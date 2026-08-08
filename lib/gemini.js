/* ============================================================
   LIKANZA ACADEMY — Helper partagé : résumé quotidien via Gemini
   Modèle appelé par alias ("gemini-flash-latest") plutôt qu'une
   version figée, pour rester valide sans maintenance quand Google
   fait évoluer sa gamme de modèles.
   ============================================================ */

const GEMINI_MODEL = 'gemini-flash-lite-latest';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: {type: 'string', description: "Titre court et factuel du récap du jour (moins de 90 caractères)."},
    summary: {type: 'string', description: "Récap de 150 à 250 mots, en français, ton pédagogique clair, sans jargon inutile."}
  },
  required: ['title', 'summary']
};

function buildPrompt(articles){
  const list = articles.map((a, i) => `${i+1}. [${a.source}] ${a.title}${a.summary ? ' — ' + a.summary : ''}`).join('\n');
  return `Tu es l'éditeur des actualités financières de Likanza Academy, une plateforme pédagogique française d'éducation financière destinée aux débutants et intermédiaires.

Voici une liste réelle de titres d'actualité économique et financière publiés aujourd'hui, provenant de plusieurs sources :

${list}

Rédige un récap quotidien à partir UNIQUEMENT de ces informations :
- Un titre court et factuel (moins de 90 caractères).
- Un résumé de 150 à 250 mots en français, qui dégage les 3 à 5 thèmes les plus importants de la journée, dans un langage clair et accessible à quelqu'un qui débute en finance, sans jargon inutile ni sensationnalisme.

Règle absolue, plus importante que le style : n'ajoute STRICTEMENT AUCUNE information absente de la liste ci-dessus — aucun nom d'entreprise, cause, chiffre, lieu ou détail que tu devines ou déduis, même s'il te semble probable ou si tu le "sais" par ailleurs. Si un titre est vague ou incomplet, reformule-le en restant tout aussi vague : ne comble jamais un manque d'information par une supposition. En cas de doute sur un détail, omets-le plutôt que de l'inventer.

Exemple concret à ne pas reproduire : si un titre dit "la ligne est suspendue à cause d'un problème technique" sans préciser lequel, n'écris jamais "à cause d'un problème sur les équipements de telle marque" — reste sur "un problème technique", sans nommer de cause ni de fabricant qui n'est pas explicitement cité dans le titre.

Réponds uniquement au format JSON demandé.`;
}

async function generateDailySummary(articles){
  const apiKey = process.env.GEMINI_API_KEY;
  if(!apiKey) throw new Error('GEMINI_API_KEY manquant');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{parts: [{text: buildPrompt(articles)}]}],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 1024,
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
  const parsed = JSON.parse(text);
  if(!parsed.title || !parsed.summary) throw new Error('Gemini : réponse JSON incomplète');
  return {title: parsed.title.trim(), summary: parsed.summary.trim()};
}

module.exports = { generateDailySummary };
