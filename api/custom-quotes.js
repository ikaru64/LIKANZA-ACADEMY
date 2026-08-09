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
   Réponse  : { updatedAt, quotes, errors }
   ============================================================ */

const { fetchYahooQuote } = require('../lib/yahoo');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const raw = (req.query && req.query.symbols || '').trim();
  const symbols = [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))].slice(0, 20);
  if(symbols.length === 0){
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({updatedAt: new Date().toISOString(), quotes: [], errors: ['Aucun symbole fourni']});
    return;
  }

  const entries = symbols.map(s => ({symbol: s, yahoo: s, name: s, assetType: 'stock'}));
  const settled = await Promise.allSettled(entries.map(entry => fetchYahooQuote(entry)));
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
  // Cache court : liste de symboles arbitraire par utilisateur, un cache long
  // n'aiderait presque jamais (clé de cache CDN = URL complète avec ?symbols=).
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  res.status(200).json({updatedAt: new Date().toISOString(), quotes, errors});
};
