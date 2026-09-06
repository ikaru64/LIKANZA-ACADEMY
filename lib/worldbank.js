/* ============================================================
   LIKANZA ACADEMY — Helper partagé : indicateurs Banque Mondiale
   Utilisé par api/eco-rate.js, pour les pays hors couverture Eurostat
   (États-Unis, Chine, Japon, Royaume-Uni). API publique gratuite, sans
   clé, CORS activé (Access-Control-Allow-Origin: * vérifié en direct le
   06/09/2026) — le proxy serverless reste utilisé ici pour garder un
   contrat de réponse identique aux autres sources (points/source/
   sourceUrl/instrument/frequency) et bénéficier du même cache CDN que
   BCE/Eurostat, pas parce que le CORS l'exigerait.

   Données ANNUELLES (pas mensuelles/trimestrielles comme BCE/Eurostat) —
   la Banque Mondiale publie avec 1-2 ans de retard, jamais "temps réel".
   Certains indicateurs sont absents pour certains pays (ex. dette
   publique centrale non publiée pour le Japon et la Chine, vérifié en
   direct : valeur `null` sur toute la période) — un point avec
   value:null est filtré, jamais remplacé par une estimation.
   ============================================================ */

const WORLDBANK_COUNTRY_LABELS = { US: 'États-Unis', CN: 'Chine', JP: 'Japon', GB: 'Royaume-Uni' };

const WORLDBANK_INDICATORS = {
  'gdp-growth': {code: 'NY.GDP.MKTP.KD.ZG', label: 'Croissance du PIB (annuelle)', datasetLabel: 'PIB (méthode des prix constants)'},
  'inflation': {code: 'FP.CPI.TOTL.ZG', label: 'Inflation, prix à la consommation (annuelle)', datasetLabel: 'Indice des prix à la consommation'},
  'unemployment': {code: 'SL.UEM.TOTL.ZS', label: 'Taux de chômage (estimation OIT)', datasetLabel: 'Population active'},
  'gov-debt': {code: 'GC.DOD.TOTL.GD.ZS', label: 'Dette publique centrale, % du PIB', datasetLabel: 'Finances publiques centrales'}
};

async function fetchWorldBankSeries(countryCode, indicatorKey){
  const indicator = WORLDBANK_INDICATORS[indicatorKey];
  if(!indicator) throw new Error(`Banque Mondiale : indicateur inconnu (${indicatorKey})`);
  const countryLabel = WORLDBANK_COUNTRY_LABELS[countryCode] || countryCode;
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator.code}?format=json&per_page=40&date=1990:2026`;
  const resp = await fetch(url, {headers: {'Accept': 'application/json'}});
  if(!resp.ok) throw new Error(`Banque Mondiale (${indicatorKey} ${countryCode}) : HTTP ${resp.status}`);
  const json = await resp.json();
  const rows = Array.isArray(json) && json[1];
  if(!Array.isArray(rows)) throw new Error(`Banque Mondiale (${indicatorKey} ${countryCode}) : réponse inattendue`);
  const points = rows
    .filter(r => typeof r.value === 'number')
    .map(r => ({period: r.date, value: r.value}))
    .sort((a, b) => (a.period < b.period ? -1 : 1));
  if(points.length === 0) throw new Error(`Banque Mondiale (${indicatorKey} ${countryCode}) : aucune observation publiée pour ce pays`);
  return {
    points,
    source: `Banque Mondiale — ${indicator.datasetLabel}`,
    sourceUrl: `https://data.worldbank.org/indicator/${indicator.code}?locations=${countryCode}`,
    seriesKey: `${indicator.code}.${countryCode}`,
    instrument: `${indicator.label}, ${countryLabel}`,
    frequency: 'Annuelle (publication avec 1 à 2 ans de retard, jamais temps réel)'
  };
}

module.exports = { fetchWorldBankSeries, WORLDBANK_INDICATORS, WORLDBANK_COUNTRY_LABELS };
