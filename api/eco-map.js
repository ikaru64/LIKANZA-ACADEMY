/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/eco-map
   Carte mondiale de l'Economic Intelligence Terminal (economie.html),
   chantier "Carte mondiale" (06/09/2026). Contrairement à /api/eco-rate
   (1 pays × N périodes), cette route sert 1 indicateur × N pays × la
   dernière observation réelle de chacun — une forme différente qui ne
   rentre pas dans SERIES_FETCHERS, d'où une route dédiée plutôt que
   d'y forcer ~78 clés à un fetch par pays.

   Un seul appel réseau à la Banque Mondiale (codes ISO2 joints par ";"),
   voir lib/worldbank.js::fetchWorldBankSeriesMulti pour le détail.

   Périmètre volontaire : Europe/Amériques/Asie uniquement (26 pays,
   WORLDBANK_MAP_COUNTRIES) — jamais l'Afrique ni l'Océanie, jamais un
   pays sans donnée réelle vérifiée en direct avant d'être ajouté à la
   liste. Seuls gdp-growth/inflation/unemployment sont exposés ici : la
   dette publique (gov-debt) n'a de vraie donnée Banque Mondiale que pour
   ~11 des 26 pays, trop incomplet pour une carte crédible — différé.

   Requête : GET /api/eco-map?indicator=gdp-growth
             GET /api/eco-map?indicator=inflation&countries=FR,DE,US (surcharge optionnelle, tests/dev)

   Réponse : { indicator, values: {FR: {value, year}, ...}, source, sourceUrl, label }
   ou 502 si indisponible — jamais une valeur inventée pour un pays absent
   de la réponse réelle de la Banque Mondiale.
   ============================================================ */

const { fetchWorldBankSeriesMulti, WORLDBANK_MAP_COUNTRIES } = require('../lib/worldbank');

const ALLOWED_MAP_INDICATORS = ['gdp-growth', 'inflation', 'unemployment'];
const YEAR_RANGE = '2021:2024';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const indicator = req.query && req.query.indicator;
  if(!ALLOWED_MAP_INDICATORS.includes(indicator)){
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({error: `Indicateur de carte inconnu ou non disponible : ${indicator}`});
    return;
  }
  const countriesParam = req.query && req.query.countries;
  const countries = countriesParam
    ? countriesParam.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
    : WORLDBANK_MAP_COUNTRIES;
  try {
    const data = await fetchWorldBankSeriesMulti(countries, indicator, YEAR_RANGE);
    // Annuelle, publiée par la Banque Mondiale avec 1-2 ans de retard :
    // cache long, comme les autres séries Banque Mondiale de ce site.
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({error: err.message});
  }
};
