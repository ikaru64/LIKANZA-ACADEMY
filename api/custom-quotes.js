/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/custom-quotes
   Cotations Yahoo Finance pour des tickers choisis par l'utilisateur
   (section "Tes actions suivies" de la page Bourse) — pendant de
   /api/stock-quotes, mais pour une liste arbitraire au lieu des 8
   actions de démonstration. Même helper partagé (lib/yahoo.js), même
   contrat de réponse normalisé.

   Fournisseur : Yahoo Finance (endpoint public non contractuel),
   données différées — statut DELAYED.

   Requête  : GET /api/custom-quotes?symbols=AAPL,MSFT,...  (20 max)
                  &range=1y   (optionnel : 5d par défaut, voir ALLOWED_RANGES)
                  &interval=1mo (optionnel : 1d par défaut, voir ALLOWED_INTERVALS —
                                  utiliser 1mo avec range=10y pour un historique long
                                  sans imposer un payload quotidien énorme, cf. le
                                  Laboratoire financier / simulateurs historiques)
   Réponse  : { updatedAt, quotes, errors }
   ============================================================ */

const { fetchYahooQuote } = require('../lib/yahoo');

const ALLOWED_RANGES = new Set(['5d', '1mo', '6mo', '1y', '5y', '10y']);
const ALLOWED_INTERVALS = new Set(['1d', '1wk', '1mo']);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const raw = (req.query && req.query.symbols || '').trim();
  const symbols = [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))].slice(0, 20);
  if(symbols.length === 0){
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({updatedAt: new Date().toISOString(), quotes: [], errors: ['Aucun symbole fourni']});
    return;
  }
  const requestedRange = req.query && req.query.range;
  const range = ALLOWED_RANGES.has(requestedRange) ? requestedRange : '5d';
  const requestedInterval = req.query && req.query.interval;
  const interval = ALLOWED_INTERVALS.has(requestedInterval) ? requestedInterval : '1d';

  const entries = symbols.map(s => ({symbol: s, yahoo: s, name: s, assetType: 'stock'}));
  const settled = await Promise.allSettled(entries.map(entry => fetchYahooQuote(entry, {range, interval})));
  const quotes = [];
  const errors = [];
  settled.forEach(r => {
    if(r.status === 'fulfilled') quotes.push(r.value);
    else errors.push(r.reason && r.reason.message ? r.reason.message : String(r.reason));
  });

  if(quotes.length === 0){
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({updatedAt: new Date().toISOString(), quotes: [], errors});
    return;
  }
  // Cache court par défaut (quotidien) : liste de symboles arbitraire par
  // utilisateur, un cache long n'aiderait presque jamais (clé de cache CDN =
  // URL complète avec ?symbols=). En mensuel (historique long, Laboratoire
  // financier), la donnée ne bouge qu'une fois par mois : cache plus long.
  const cacheSeconds = interval === '1mo' ? 3600 : 120;
  res.setHeader('Cache-Control', `s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds*3}`);
  res.status(200).json({updatedAt: new Date().toISOString(), quotes, errors});
};
