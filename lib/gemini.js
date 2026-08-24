/* ============================================================
   LIKANZA ACADEMY — Helper partagé : résumés d'actualité via Gemini
   Modèle appelé par alias ("gemini-flash-lite-latest") plutôt qu'une
   version figée, pour rester valide sans maintenance quand Google
   fait évoluer sa gamme de modèles. Modèle "lite" choisi volontairement
   (pas de raisonnement étendu par défaut) : plus rapide, moins cher, et
   la tâche (résumer des titres réels) n'a pas besoin de raisonnement.
   ============================================================ */

const GEMINI_MODEL = 'gemini-flash-lite-latest';

// Règle commune aux deux prompts, isolée ici après avoir observé en test
// l'IA ajouter un détail absent de la source (un fabricant non cité pour
// justifier une panne technique) — voir historique du projet.
const ANTI_HALLUCINATION_RULE = `Règle absolue, plus importante que le style : n'ajoute STRICTEMENT AUCUNE information absente des titres fournis — aucun nom d'entreprise, cause, chiffre, lieu ou détail que tu devines ou déduis, même s'il te semble probable ou si tu le "sais" par ailleurs. Si un titre est vague ou incomplet, reformule-le en restant tout aussi vague : ne comble jamais un manque d'information par une supposition. En cas de doute sur un détail, omets-le plutôt que de l'inventer.

Exemple concret à ne pas reproduire : si un titre dit "la ligne est suspendue à cause d'un problème technique" sans préciser lequel, n'écris jamais "à cause d'un problème sur les équipements de telle marque" — reste sur "un problème technique", sans nommer de cause ni de fabricant qui n'est pas explicitement cité dans le titre.`;

// Likanza Truth Framework : Likanza Academy distingue toujours fait, calcul,
// analyse, scénario et avis — jamais présentés comme une certitude. Cette
// règle s'applique aux deux prompts pour qu'aucune synthèse ne franchisse la
// ligne entre "ce qui s'est passé" (un fait) et "ce qui pourrait se passer"
// (un scénario, jamais garanti).
const CONDITIONAL_LANGUAGE_RULE = `Règle de langage, aussi importante que la précédente : ne formule jamais une évolution future de marché, de secteur ou d'action comme une certitude. Interdit : "va monter", "va baisser", "va exploser", "il faut acheter", "il faut vendre", ou toute affirmation qui prétend savoir ce qui va se passer. Préfère un langage descriptif ou conditionnel sur ce qui s'est déjà passé et pourquoi c'est important, sans jamais prédire la suite ni recommander une action d'achat ou de vente.

Exemple concret à ne pas reproduire : si les titres sources rapportent une baisse des taux, n'écris jamais "cette baisse va relancer la bourse" — écris plutôt quelque chose comme "cette baisse des taux est le type de facteur qui a historiquement pu favoriser certains secteurs", sans jamais transformer un lien possible en certitude.`;

async function callGemini(prompt, schema, maxOutputTokens){
  const apiKey = process.env.GEMINI_API_KEY;
  if(!apiKey) throw new Error('GEMINI_API_KEY manquant');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{parts: [{text: prompt}]}],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      maxOutputTokens: maxOutputTokens || 1024,
      temperature: 0
    }
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  if(!resp.ok){
    const errText = await resp.text().catch(() => '');
    throw new Error(`Gemini : HTTP ${resp.status} ${errText.slice(0,300)}`);
  }
  const json = await resp.json();
  const text = json.candidates && json.candidates[0] && json.candidates[0].content
    && json.candidates[0].content.parts && json.candidates[0].content.parts[0]
    && json.candidates[0].content.parts[0].text;
  if(!text) throw new Error('Gemini : réponse vide ou inattendue');
  return JSON.parse(text);
}

// ---------- Récap quotidien (liste de 3 à 5 actualités distinctes, chacune
// avec ses propres sources — plus un seul paragraphe flou balayant des
// thèmes sans rapport, voir historique du chantier "vraies sources par
// article"). sourcesUsed : les numéros de la liste d'entrée qui ont
// RÉELLEMENT servi à CET item précis (jamais partagé entre items) — permet
// au code appelant de ne stocker que les sources réellement citées, et de
// calculer une corroboration (2+ sources distinctes) sans jamais faire
// confiance à une auto-évaluation du modèle. ----------
const DAILY_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {type: 'string', description: "Titre court et factuel de cette actualité précise (moins de 90 caractères)."},
          summary: {type: 'string', description: "Résumé de 40 à 70 mots en français, ton pédagogique clair, sans jargon inutile, portant UNIQUEMENT sur cette actualité précise."},
          sourcesUsed: {type: 'array', items: {type: 'integer'}, description: "Les numéros (1 à N) des titres de la liste fournie qui ont RÉELLEMENT servi à écrire ce résumé précis — jamais tous les numéros par défaut, uniquement ceux réellement utilisés pour CETTE actualité."}
        },
        required: ['title', 'summary', 'sourcesUsed']
      },
      description: "3 à 5 actualités distinctes et les plus importantes de la liste fournie, chacune avec ses propres sources."
    }
  },
  required: ['items']
};

function buildDailyPrompt(articles){
  const list = articles.map((a, i) => `${i+1}. [${a.source}] ${a.title}${a.summary ? ' — ' + a.summary : ''}`).join('\n');
  return `Tu es l'éditeur des actualités financières de Likanza Academy, une plateforme pédagogique française d'éducation financière destinée aux débutants et intermédiaires.

Voici une liste réelle de titres d'actualité économique et financière publiés aujourd'hui, provenant de plusieurs sources :

${list}

Identifie les 3 à 5 actualités DISTINCTES les plus importantes de cette liste, à partir UNIQUEMENT de ces informations. Pour chacune :
- Un titre court et factuel (moins de 90 caractères).
- Un résumé de 40 à 70 mots en français, clair et accessible à quelqu'un qui débute en finance, sans jargon inutile ni sensationnalisme, portant uniquement sur cette actualité précise (pas un mélange de plusieurs sujets).
- La liste des numéros de titres (parmi ceux fournis ci-dessus) qui parlent réellement de cette même actualité — si plusieurs titres de la liste rapportent le même événement (même si formulés différemment), regroupe-les sous un seul item et liste tous leurs numéros ; si un seul titre en parle, liste uniquement ce numéro.

Ne mélange jamais deux sujets différents dans un même item, et n'invente jamais un numéro qui ne figure pas dans la liste fournie.

${ANTI_HALLUCINATION_RULE}

${CONDITIONAL_LANGUAGE_RULE}

Écris dans un français correct et complet, avec tous les accents et caractères français nécessaires (é, è, à, ç, ô, û...) : aucun mot ne doit perdre ses accents.

Réponds uniquement au format JSON demandé.`;
}

async function generateDailySummary(articles){
  const parsed = await callGemini(buildDailyPrompt(articles), DAILY_SCHEMA, 1536);
  if(!Array.isArray(parsed.items) || parsed.items.length === 0) throw new Error('Gemini : réponse JSON incomplète');
  return {
    items: parsed.items
      .filter(it => it && typeof it.title === 'string' && typeof it.summary === 'string')
      .map(it => ({
        title: it.title.trim(),
        summary: it.summary.trim(),
        sourcesUsed: Array.isArray(it.sourcesUsed) ? it.sourcesUsed.filter(n => Number.isInteger(n)) : []
      }))
  };
}

// ---------- Article de fond hebdomadaire, un par catégorie ----------
// aSurveiller et accordSources ajoutés pour le chantier "Bourse & Actualités
// — vrai système d'intelligence financière" : jamais une prédiction
// (aSurveiller décrit des éléments qui confirmeront/infirmeront une
// hypothèse, pas ce qui va se passer), et accordSources n'est demandé que
// lorsque la catégorie a réellement 2 sources indépendantes ce jour-là
// (jamais un accord/désaccord inventé à partir d'une seule source).
const CATEGORY_ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    titre: {type: 'string', description: "Titre court et factuel (moins de 90 caractères)."},
    resume: {type: 'string', description: "Résumé de 80 à 150 mots en français, ton pédagogique clair."},
    points: {type: 'array', items: {type: 'string'}, description: "3 à 5 points à retenir, courts (une phrase chacun)."},
    pourquoi: {type: 'string', description: "1 à 2 phrases expliquant pourquoi ce thème compte pour quelqu'un qui apprend la finance."},
    impact: {type: 'array', items: {type: 'string'}, description: "2 à 4 tags courts (2-5 mots) décrivant qui/quoi est concerné."},
    aSurveiller: {type: 'array', items: {type: 'string'}, description: "2 à 4 éléments futurs et concrets qui permettront de confirmer ou d'infirmer une hypothèse de cette synthèse (ex: prochaine publication, prochaine décision) — jamais une prédiction de ce qui va se passer."},
    accordSources: {type: 'string', description: "Si et seulement si plusieurs sources indépendantes ont été fournies : 1 phrase indiquant si elles se recoupent ou si l'une rapporte un détail que les autres ne confirment pas. Chaîne vide si une seule source a été fournie."},
    sourcesUsed: {type: 'array', items: {type: 'integer'}, description: "Les numéros (1 à N) des titres de la liste ci-dessus qui ont RÉELLEMENT servi à écrire cette synthèse — jamais tous les numéros par défaut, uniquement ceux réellement utilisés."}
  },
  required: ['titre', 'resume', 'points', 'pourquoi', 'impact', 'aSurveiller', 'accordSources', 'sourcesUsed']
};

function buildCategoryPrompt(categorie, articles, distinctSourceNames){
  const list = articles.map((a, i) => `${i+1}. [${a.source}] ${a.title}${a.summary ? ' — ' + a.summary : ''}`).join('\n');
  const multiSource = Array.isArray(distinctSourceNames) && distinctSourceNames.length >= 2;
  return `Tu es l'éditeur des actualités financières de Likanza Academy, une plateforme pédagogique française d'éducation financière destinée aux débutants et intermédiaires.

Voici une liste réelle de titres d'actualité de la catégorie "${categorie}", publiés cette semaine, provenant de ${multiSource ? `${distinctSourceNames.length} sources indépendantes (indiquées entre crochets devant chaque titre)` : '1 seule source (indiquée entre crochets devant chaque titre)'} :

${list}

Rédige une synthèse hebdomadaire de cette catégorie à partir UNIQUEMENT de ces informations :
- Un titre court et factuel (moins de 90 caractères) qui dégage le fil conducteur de la semaine dans cette catégorie.
- Un résumé de 80 à 150 mots en français qui relie les événements les plus importants de la liste, dans un langage clair et accessible à quelqu'un qui débute en finance, sans jargon inutile.
- 3 à 5 points à retenir (une phrase courte chacun).
- 1 à 2 phrases sur pourquoi ce thème compte pour quelqu'un qui apprend la finance.
- 2 à 4 tags courts (2-5 mots) décrivant qui ou quoi est concerné (ex: "Épargnants exposés aux taux variables", "Marchés actions européens").
- 2 à 4 éléments concrets "à surveiller" : des événements futurs (une prochaine publication, une prochaine décision...) qui permettront de confirmer ou d'infirmer une hypothèse de ta synthèse — jamais une prédiction de ce qui va se passer.
${multiSource
    ? `- Un champ "accordSources" : compare ce que rapportent les ${distinctSourceNames.length} sources entre crochets. Si elles se recoupent sur les faits principaux, dis-le simplement. Si l'une rapporte un détail, un chiffre ou une nuance que les autres ne mentionnent pas, dis-le aussi, sans jamais trancher laquelle a raison si les deux sont plausibles.`
    : `- Un champ "accordSources" : une seule source est disponible cette semaine pour cette catégorie — renvoie une chaîne vide, ne compare rien qui n'existe pas.`}
- La liste des numéros de titres (parmi ceux fournis ci-dessus) qui ont RÉELLEMENT servi à écrire cette synthèse — jamais tous les numéros par défaut si tu n'as utilisé qu'une partie de la liste, et jamais un numéro qui ne figure pas dans la liste fournie.

${ANTI_HALLUCINATION_RULE}

${CONDITIONAL_LANGUAGE_RULE}

Écris dans un français correct et complet, avec tous les accents et caractères français nécessaires (é, è, à, ç, ô, û...) : aucun mot ne doit perdre ses accents.

Réponds uniquement au format JSON demandé.`;
}

async function generateCategoryArticle(categorie, articles, distinctSourceNames){
  const parsed = await callGemini(buildCategoryPrompt(categorie, articles, distinctSourceNames), CATEGORY_ARTICLE_SCHEMA, 1536);
  if(!parsed.titre || !parsed.resume || !Array.isArray(parsed.points) || !parsed.pourquoi || !Array.isArray(parsed.impact)){
    throw new Error('Gemini : réponse JSON incomplète');
  }
  return {
    titre: parsed.titre.trim(),
    resume: parsed.resume.trim(),
    points: parsed.points.map(p => String(p).trim()).filter(Boolean),
    pourquoi: parsed.pourquoi.trim(),
    impact: parsed.impact.map(p => String(p).trim()).filter(Boolean),
    aSurveiller: Array.isArray(parsed.aSurveiller) ? parsed.aSurveiller.map(p => String(p).trim()).filter(Boolean) : [],
    accordSources: typeof parsed.accordSources === 'string' ? parsed.accordSources.trim() : '',
    sourcesUsed: Array.isArray(parsed.sourcesUsed) ? parsed.sourcesUsed.filter(n => Number.isInteger(n)) : []
  };
}

// ---------- Filtrage sourcesUsed → sources réelles + corroboration calculée
// (chantier "vraies sources par article") — partagé entre
// generate-daily-news.js et generate-weekly-news.js pour ne jamais dupliquer
// cette logique. pool : le tableau RSS brut (0-indexed) passé à Gemini ;
// sourcesUsed : les indices 1-based retournés par le modèle. Un indice hors
// bornes ou dupliqué est ignoré silencieusement, jamais un crash sur une
// sortie Gemini légèrement malformée. corroborated ne compte QUE des noms de
// source distincts : deux items du même flux ne comptent jamais comme une
// corroboration, même s'ils sont tous deux cités. ----------
function filterSourcesUsed(pool, sourcesUsed){
  const seen = new Set();
  const sources = [];
  (Array.isArray(sourcesUsed) ? sourcesUsed : []).forEach(n => {
    const idx = n - 1;
    if(!Number.isInteger(idx) || idx < 0 || idx >= pool.length || seen.has(idx)) return;
    seen.add(idx);
    const item = pool[idx];
    if(item) sources.push({title: item.title, link: item.link, source: item.source});
  });
  const sourceCount = new Set(sources.map(s => s.source)).size;
  return {sources, sourceCount, corroborated: sourceCount >= 2};
}

module.exports = { generateDailySummary, generateCategoryArticle, filterSourcesUsed };
