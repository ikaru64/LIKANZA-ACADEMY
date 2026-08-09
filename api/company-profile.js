/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/company-profile
   Description réelle d'une société (secteur, industrie, effectif,
   résumé d'activité) pour la fiche action détaillée. Utilise
   lib/yahoo.js:fetchCompanyProfile — mécanisme cookie+crumb testé en
   direct avant intégration, mais moins stable que les autres routes
   Yahoo du site (endpoint non public/non documenté). Cache CDN long
   pour limiter la fréquence des appels : une description d'entreprise
   change rarement.

   Requête  : GET /api/company-profile?symbol=AAPL
   Réponse  : { sector, industry, website, employees, summary }
   ou 404/502 si indisponible — jamais de description inventée, la
   page appelante masque simplement la section dans ce cas.
   ============================================================ */

const { fetchCompanyProfile } = require('../lib/yahoo');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const symbol = (req.query && req.query.symbol || '').trim();
  if(!symbol){
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({error: 'Symbole manquant'});
    return;
  }
  try {
    const profile = await fetchCompanyProfile(symbol);
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json(profile);
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({error: err.message});
  }
};
