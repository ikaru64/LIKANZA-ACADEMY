/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/eco-rate
   Taux de dépôt BCE en direct (voir lib/ecb.js), pour la page Éco.
   Cache CDN long : la BCE ne change ses taux qu'environ toutes les
   6 semaines, un cache court n'apporterait rien.

   Réponse : { rate, asOf, source, instrument }
   ou 502 si indisponible — jamais de taux inventé, la page appelante
   masque simplement l'indicateur dans ce cas.
   ============================================================ */

const { fetchEcbDepositRate } = require('../lib/ecb');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const data = await fetchEcbDepositRate();
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({error: err.message});
  }
};
