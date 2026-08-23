/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/eco-rate
   Taux de dépôt BCE en direct par défaut (voir lib/ecb.js), pour la
   page Business. Cache CDN long : la BCE ne change ses taux qu'environ
   toutes les 6 semaines, un cache court n'apporterait rien.

   Étendu pour le Laboratoire financier : d'autres séries réelles de
   la même famille d'API (BCE SDW) sont exposées via ?series=... au
   lieu de créer une fonction serverless par série (garder le nombre
   de fonctions Vercel bas). Étendu à nouveau pour la page Économie
   (chômage/PIB/dette publique) avec des séries Eurostat (lib/eurostat.js,
   format JSON-stat — différent de BCE SDW, mais même contrat de
   réponse pour l'appelant), toujours via ce même ?series=.

   Requête : GET /api/eco-rate                    (défaut : taux de dépôt BCE, réponse inchangée)
             GET /api/eco-rate?series=inflation-fr       (indice HICP France, mensuel, 2016→aujourd'hui)
             GET /api/eco-rate?series=mortgage-rate-fr   (taux crédit immobilier ménages France, mensuel)
             GET /api/eco-rate?series=home-price-fr      (indice prix immobilier résidentiel France, trimestriel)
             GET /api/eco-rate?series=unemployment-fr    (taux de chômage France, mensuel, Eurostat)
             GET /api/eco-rate?series=gdp-growth-fr      (croissance du PIB France, trimestrielle, Eurostat)
             GET /api/eco-rate?series=gov-debt-fr        (dette publique France, % du PIB, trimestrielle, Eurostat)

   Réponse (défaut) : { rate, asOf, source, instrument }
   Réponse (séries)  : { points, source, sourceUrl, seriesKey, instrument, frequency }
   ou 502 si indisponible — jamais de valeur inventée, la page appelante
   affiche "donnée indisponible" dans ce cas.
   ============================================================ */

const { fetchEcbDepositRate, fetchEcbInflationFR, fetchEcbMortgageRateFR, fetchEcbHomePriceIndexFR } = require('../lib/ecb');
const { fetchEurostatUnemploymentFR, fetchEurostatGdpGrowthFR, fetchEurostatGovDebtFR } = require('../lib/eurostat');

const SERIES_FETCHERS = {
  'inflation-fr': fetchEcbInflationFR,
  'mortgage-rate-fr': fetchEcbMortgageRateFR,
  'home-price-fr': fetchEcbHomePriceIndexFR,
  'unemployment-fr': fetchEurostatUnemploymentFR,
  'gdp-growth-fr': fetchEurostatGdpGrowthFR,
  'gov-debt-fr': fetchEurostatGovDebtFR
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const seriesParam = req.query && req.query.series;
  const fetcher = seriesParam ? SERIES_FETCHERS[seriesParam] : fetchEcbDepositRate;
  if(!fetcher){
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({error: `Série inconnue : ${seriesParam}`});
    return;
  }
  try {
    const data = await fetcher();
    // Séries historiques mensuelles/trimestrielles : cache long, elles ne
    // sont mises à jour qu'une fois par mois (ou trimestre) par la BCE.
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({error: err.message});
  }
};
