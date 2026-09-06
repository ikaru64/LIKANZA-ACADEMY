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

   Étendu pour le terminal économique (06/09/2026) :
             GET /api/eco-rate?series=inflation-de|it|es|eu     (BCE HICP, "eu" = zone euro U2, PAS le même agrégat que les "eu" ci-dessous)
             GET /api/eco-rate?series=unemployment-de|it|es|eu  (Eurostat, mêmes datasets, autre geo)
             GET /api/eco-rate?series=gdp-growth-de|it|es|eu
             GET /api/eco-rate?series=gov-debt-de|it|es|eu
             GET /api/eco-rate?series=policy-rate-ecb-history    (historique complet taux dépôt BCE, 1999→aujourd'hui, mensualisé)
             GET /api/eco-rate?series=policy-rate-fed            (FRED FEDFUNDS, taux effectif, mensuel)
             GET /api/eco-rate?series=gdp-growth-us|jp|gb|cn     (Banque Mondiale, annuelle)
             GET /api/eco-rate?series=inflation-us|jp|gb|cn      (Banque Mondiale, annuelle)
             GET /api/eco-rate?series=unemployment-us|jp|gb|cn   (Banque Mondiale, annuelle)
             GET /api/eco-rate?series=gov-debt-us|jp|gb|cn       (Banque Mondiale, annuelle — absente pour JP/CN, vérifié en direct : "Donnée indisponible" honnête, jamais une valeur de repli)
             GET /api/eco-rate?series=gov-deficit-fr|de|it|es|eu       (Eurostat, solde public trimestriel cvs-cjo, % du PIB)
             GET /api/eco-rate?series=consumer-confidence-fr|de|it|es|eu (Eurostat, solde d'opinion, mensuel)
   "eu" = Union européenne à 27 (EU27_2020) — aucun code zone euro
   (EA/EA19/EA20) ne renvoie d'observation sur ces 3 datasets Eurostat
   (vérifié en direct), jamais présenté comme "zone euro" pour ne pas
   mal étiqueter l'agrégat.

   Réponse (défaut) : { rate, asOf, source, instrument }
   Réponse (séries)  : { points, source, sourceUrl, seriesKey, instrument, frequency }
   ou 502 si indisponible — jamais de valeur inventée, la page appelante
   affiche "donnée indisponible" dans ce cas.
   ============================================================ */

const { fetchEcbDepositRate, fetchEcbInflationFR, fetchEcbMortgageRateFR, fetchEcbHomePriceIndexFR, fetchEcbDepositRateHistory, fetchEcbInflation } = require('../lib/ecb');
const { fetchEurostatUnemploymentFR, fetchEurostatGdpGrowthFR, fetchEurostatGovDebtFR, fetchEurostatUnemployment, fetchEurostatGdpGrowth, fetchEurostatGovDebt, fetchEurostatGovDeficit, fetchEurostatConsumerConfidence } = require('../lib/eurostat');
const { fetchWorldBankSeries } = require('../lib/worldbank');
const { fetchFedFundsRate } = require('../lib/fred');

// geo Eurostat réel derrière chaque suffixe de clé ("eu" -> EU27_2020,
// jamais "zone euro" — cf. note ci-dessus).
const EUROSTAT_GEO_SUFFIXES = {de: 'DE', it: 'IT', es: 'ES', eu: 'EU27_2020'};
// geo BCE réel derrière chaque suffixe pour l'inflation HICP — ici "eu"
// signifie bien la zone euro (U2, agrégat BCE réel), un périmètre
// DIFFÉRENT du "eu" Eurostat ci-dessus (Union européenne à 27). Les deux
// sont réels mais ne mesurent pas le même ensemble de pays — toujours
// étiquetés distinctement côté front (cf. lib/ecb.js).
const ECB_INFLATION_GEO_SUFFIXES = {de: 'DE', it: 'IT', es: 'ES', eu: 'U2'};
// code pays Banque Mondiale (ISO 2 lettres) derrière chaque suffixe.
const WORLDBANK_GEO_SUFFIXES = {us: 'US', jp: 'JP', gb: 'GB', cn: 'CN'};

const SERIES_FETCHERS = {
  'inflation-fr': fetchEcbInflationFR,
  'mortgage-rate-fr': fetchEcbMortgageRateFR,
  'home-price-fr': fetchEcbHomePriceIndexFR,
  'unemployment-fr': fetchEurostatUnemploymentFR,
  'gdp-growth-fr': fetchEurostatGdpGrowthFR,
  'gov-debt-fr': fetchEurostatGovDebtFR,
  'policy-rate-ecb-history': fetchEcbDepositRateHistory,
  'policy-rate-fed': fetchFedFundsRate
};
SERIES_FETCHERS['gov-deficit-fr'] = () => fetchEurostatGovDeficit('FR');
SERIES_FETCHERS['consumer-confidence-fr'] = () => fetchEurostatConsumerConfidence('FR');
for(const [suffix, geo] of Object.entries(ECB_INFLATION_GEO_SUFFIXES)){
  SERIES_FETCHERS[`inflation-${suffix}`] = () => fetchEcbInflation(geo);
}
for(const [suffix, geo] of Object.entries(EUROSTAT_GEO_SUFFIXES)){
  SERIES_FETCHERS[`unemployment-${suffix}`] = () => fetchEurostatUnemployment(geo);
  SERIES_FETCHERS[`gdp-growth-${suffix}`] = () => fetchEurostatGdpGrowth(geo);
  SERIES_FETCHERS[`gov-debt-${suffix}`] = () => fetchEurostatGovDebt(geo);
  SERIES_FETCHERS[`gov-deficit-${suffix}`] = () => fetchEurostatGovDeficit(geo);
  SERIES_FETCHERS[`consumer-confidence-${suffix}`] = () => fetchEurostatConsumerConfidence(geo);
}
for(const [suffix, code] of Object.entries(WORLDBANK_GEO_SUFFIXES)){
  SERIES_FETCHERS[`gdp-growth-${suffix}`] = () => fetchWorldBankSeries(code, 'gdp-growth');
  SERIES_FETCHERS[`inflation-${suffix}`] = () => fetchWorldBankSeries(code, 'inflation');
  SERIES_FETCHERS[`unemployment-${suffix}`] = () => fetchWorldBankSeries(code, 'unemployment');
  SERIES_FETCHERS[`gov-debt-${suffix}`] = () => fetchWorldBankSeries(code, 'gov-debt');
}

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
