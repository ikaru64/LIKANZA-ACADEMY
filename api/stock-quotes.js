/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/stock-quotes
   Rôle : backend de données de marché pour les 8 actions de
   démonstration (STOCKS_DEMO côté site), utilisé par la page
   Bourse (hausses/baisses du jour, sélection du jour, sparklines).

   Conformément à ARCHITECTURE.md, le navigateur n'appelle jamais
   un fournisseur directement : il passe par cette fonction. Route
   séparée de /api/quotes (bandeau) pour ne pas coupler leur cache
   ni leur temps de réponse — même helper Yahoo Finance partagé
   (lib/yahoo.js), même contrat de réponse normalisé.

   Fournisseur : Yahoo Finance (endpoint public non contractuel),
   données différées — statut DELAYED.

   Réponse : { updatedAt, quotes: [schéma normalisé ARCHITECTURE.md] }
   ============================================================ */

const { fetchYahooQuote } = require('../lib/yahoo');

// Tickers alignés sur STOCKS_DEMO (scripts/app.js) — déjà des tickers
// Yahoo valides, pas de mapping symbol↔yahoo nécessaire ici.
const STOCKS_YAHOO = [
  {symbol:'AI.PA',   yahoo:'AI.PA',   name:'Air Liquide',    assetType:'stock'},
  {symbol:'TTE.PA',  yahoo:'TTE.PA',  name:'TotalEnergies',  assetType:'stock'},
  {symbol:'SAN.PA',  yahoo:'SAN.PA',  name:'Sanofi',         assetType:'stock'},
  {symbol:'SAF.PA',  yahoo:'SAF.PA',  name:'Safran',         assetType:'stock'},
  {symbol:'DG.PA',   yahoo:'DG.PA',   name:'Vinci',          assetType:'stock'},
  {symbol:'OR.PA',   yahoo:'OR.PA',   name:"L'Oréal",        assetType:'stock'},
  {symbol:'ASML.AS', yahoo:'ASML.AS', name:'ASML',           assetType:'stock'},
  {symbol:'MC.PA',   yahoo:'MC.PA',   name:'LVMH',           assetType:'stock'}
];

// range/interval optionnels (Phase 2 de la refonte Bourse — indicateurs
// techniques MM20/MM50 dans bourse.js) : mêmes ensembles autorisés que
// /api/custom-quotes.js, 5j/1j par défaut si absents (comportement
// inchangé pour tout appelant existant).
const ALLOWED_RANGES = new Set(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'max']);
const ALLOWED_INTERVALS = new Set(['1d', '1wk', '1mo']);

module.exports = async (req, res) => {
  const requestedRange = req.query && req.query.range;
  const range = ALLOWED_RANGES.has(requestedRange) ? requestedRange : '5d';
  const requestedInterval = req.query && req.query.interval;
  const interval = ALLOWED_INTERVALS.has(requestedInterval) ? requestedInterval : '1d';
  const settled = await Promise.allSettled(STOCKS_YAHOO.map(entry => fetchYahooQuote(entry, {range, interval})));
  const quotes = [];
  const errors = [];
  settled.forEach(r => {
    if(r.status === 'fulfilled') quotes.push(r.value);
    else errors.push(r.reason && r.reason.message ? r.reason.message : String(r.reason));
  });

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if(quotes.length === 0){
    // Pas de cache CDN sur une panne totale : on veut réessayer vite.
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({updatedAt: new Date().toISOString(), quotes: [], errors});
    return;
  }
  // 5 min de cache CDN + 15 min de service en différé pendant la revalidation :
  // les quotas fournisseurs sont respectés quel que soit le trafic.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  res.status(200).json({updatedAt: new Date().toISOString(), quotes, errors});
};
