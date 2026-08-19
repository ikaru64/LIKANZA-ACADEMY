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

// ---------- Récap quotidien (mélange de thèmes, court) ----------
const DAILY_SCHEMA = {
  type: 'object',
  properties: {
    title: {type: 'string', description: "Titre court et factuel du récap du jour (moins de 90 caractères)."},
    summary: {type: 'string', description: "Récap de 150 à 250 mots, en français, ton pédagogique clair, sans jargon inutile."}
  },
  required: ['title', 'summary']
};

function buildDailyPrompt(articles){
  const list = articles.map((a, i) => `${i+1}. [${a.source}] ${a.title}${a.summary ? ' — ' + a.summary : ''}`).join('\n');
  return `Tu es l'éditeur des actualités financières de Likanza Academy, une plateforme pédagogique française d'éducation financière destinée aux débutants et intermédiaires.

Voici une liste réelle de titres d'actualité économique et financière publiés aujourd'hui, provenant de plusieurs sources :

${list}

Rédige un récap quotidien à partir UNIQUEMENT de ces informations :
- Un titre court et factuel (moins de 90 caractères).
- Un résumé de 150 à 250 mots en français, qui dégage les 3 à 5 thèmes les plus importants de la journée, dans un langage clair et accessible à quelqu'un qui débute en finance, sans jargon inutile ni sensationnalisme.

${ANTI_HALLUCINATION_RULE}

${CONDITIONAL_LANGUAGE_RULE}

Écris dans un français correct et complet, avec tous les accents et caractères français nécessaires (é, è, à, ç, ô, û...) : aucun mot ne doit perdre ses accents.

Réponds uniquement au format JSON demandé.`;
}

async function generateDailySummary(articles){
  const parsed = await callGemini(buildDailyPrompt(articles), DAILY_SCHEMA, 1024);
  if(!parsed.title || !parsed.summary) throw new Error('Gemini : réponse JSON incomplète');
  return {title: parsed.title.trim(), summary: parsed.summary.trim()};
}

// ---------- Article de fond hebdomadaire, un par catégorie ----------
const CATEGORY_ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    titre: {type: 'string', description: "Titre court et factuel (moins de 90 caractères)."},
    resume: {type: 'string', description: "Résumé de 80 à 150 mots en français, ton pédagogique clair."},
    points: {type: 'array', items: {type: 'string'}, description: "3 à 5 points à retenir, courts (une phrase chacun)."},
    pourquoi: {type: 'string', description: "1 à 2 phrases expliquant pourquoi ce thème compte pour quelqu'un qui apprend la finance."},
    impact: {type: 'array', items: {type: 'string'}, description: "2 à 4 tags courts (2-5 mots) décrivant qui/quoi est concerné."}
  },
  required: ['titre', 'resume', 'points', 'pourquoi', 'impact']
};

function buildCategoryPrompt(categorie, articles){
  const list = articles.map((a, i) => `${i+1}. ${a.title}${a.summary ? ' — ' + a.summary : ''}`).join('\n');
  return `Tu es l'éditeur des actualités financières de Likanza Academy, une plateforme pédagogique française d'éducation financière destinée aux débutants et intermédiaires.

Voici une liste réelle de titres d'actualité de la catégorie "${categorie}", publiés cette semaine, provenant d'une même source :

${list}

Rédige une synthèse hebdomadaire de cette catégorie à partir UNIQUEMENT de ces informations :
- Un titre court et factuel (moins de 90 caractères) qui dégage le fil conducteur de la semaine dans cette catégorie.
- Un résumé de 80 à 150 mots en français qui relie les événements les plus importants de la liste, dans un langage clair et accessible à quelqu'un qui débute en finance, sans jargon inutile.
- 3 à 5 points à retenir (une phrase courte chacun).
- 1 à 2 phrases sur pourquoi ce thème compte pour quelqu'un qui apprend la finance.
- 2 à 4 tags courts (2-5 mots) décrivant qui ou quoi est concerné (ex: "Épargnants exposés aux taux variables", "Marchés actions européens").

${ANTI_HALLUCINATION_RULE}

${CONDITIONAL_LANGUAGE_RULE}

Écris dans un français correct et complet, avec tous les accents et caractères français nécessaires (é, è, à, ç, ô, û...) : aucun mot ne doit perdre ses accents.

Réponds uniquement au format JSON demandé.`;
}

async function generateCategoryArticle(categorie, articles){
  const parsed = await callGemini(buildCategoryPrompt(categorie, articles), CATEGORY_ARTICLE_SCHEMA, 1536);
  if(!parsed.titre || !parsed.resume || !Array.isArray(parsed.points) || !parsed.pourquoi || !Array.isArray(parsed.impact)){
    throw new Error('Gemini : réponse JSON incomplète');
  }
  return {
    titre: parsed.titre.trim(),
    resume: parsed.resume.trim(),
    points: parsed.points.map(p => String(p).trim()).filter(Boolean),
    pourquoi: parsed.pourquoi.trim(),
    impact: parsed.impact.map(p => String(p).trim()).filter(Boolean)
  };
}

module.exports = { generateDailySummary, generateCategoryArticle };
