/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/stock-search
   Recherche d'actions réelles (nom ou ticker) pour la section "Tes
   actions suivies" de la page Bourse — le navigateur n'appelle jamais
   Yahoo Finance directement, il passe par cette fonction (même
   convention que /api/stock-quotes et /api/quotes).

   Requête  : GET /api/stock-search?q=<texte>
   Réponse  : { results: [{symbol, name, exchange}] }
   ============================================================ */

const { searchYahooSymbols } = require('../lib/yahoo');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const q = (req.query && req.query.q || '').trim();
  if(q.length < 2){
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({error: 'Requête trop courte (2 caractères minimum)', results: []});
    return;
  }
  try {
    const results = await searchYahooSymbols(q);
    // Courte durée de cache CDN : les requêtes de recherche varient beaucoup
    // d'un utilisateur à l'autre, un cache long n'aiderait presque jamais.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({results});
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({error: err.message, results: []});
  }
};
