/* ============================================================
   LIKANZA ACADEMY — Helper partagé : taux de dépôt BCE
   Utilisé par api/eco-rate.js. Placé hors de api/ pour ne pas devenir
   une route Vercel. Endpoint public de la BCE (SDMX-JSON, aucune clé
   requise), testé en direct avant intégration — mais sans en-tête
   Access-Control-Allow-Origin, d'où ce proxy serverless (le
   navigateur ne peut pas l'appeler directement).

   Série FM.D.U2.EUR.4F.KR.DFR.LEV = taux de la facilité de dépôt,
   l'un des trois taux directeurs de la BCE (celui le plus souvent
   cité comme référence dans la presse financière).
   ============================================================ */

const ECB_SERIES_URL = 'https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.DFR.LEV?lastNObservations=1&format=jsondata';

async function fetchEcbDepositRate(){
  const resp = await fetch(ECB_SERIES_URL, {headers: {'Accept': 'application/json'}});
  if(!resp.ok) throw new Error(`BCE : HTTP ${resp.status}`);
  const json = await resp.json();

  const seriesMap = json.dataSets && json.dataSets[0] && json.dataSets[0].series;
  const series = seriesMap && Object.values(seriesMap)[0];
  const observations = series && series.observations;
  if(!observations) throw new Error('BCE : réponse sans observation');

  const obsKeys = Object.keys(observations);
  const lastKey = obsKeys[obsKeys.length - 1];
  const rate = observations[lastKey][0];
  if(typeof rate !== 'number') throw new Error('BCE : valeur de taux introuvable');

  const timeValues = json.structure.dimensions.observation[0].values;
  const asOf = (timeValues[+lastKey] && timeValues[+lastKey].id) || null;

  return {rate, asOf, source: 'Banque centrale européenne', instrument: 'Facilité de dépôt'};
}

/* ------------------------------------------------------------
   Séries historiques complètes (Laboratoire financier) — même API
   SDW que le taux de dépôt ci-dessus, trois dataflows différents,
   toutes vérifiées en direct avant intégration :
   - ICP  : indice des prix à la consommation harmonisé (inflation FR)
   - MIR  : statistiques de taux d'intérêt des IFM (crédit immobilier FR)
   - RESR : statistiques immobilières résidentielles (prix immobilier FR)
   Parsing générique du format SDMX-JSON de la BCE, jamais de valeur
   de repli inventée : une observation manquante ou une clé de série
   introuvable fait échouer l'appel (l'appelant affiche alors
   "donnée indisponible", jamais une valeur fabriquée).
   ------------------------------------------------------------ */
async function fetchEcbSeriesFull(url, seriesLabel){
  const resp = await fetch(url, {headers: {'Accept': 'application/json'}});
  if(!resp.ok) throw new Error(`BCE (${seriesLabel}) : HTTP ${resp.status}`);
  const json = await resp.json();

  const seriesMap = json.dataSets && json.dataSets[0] && json.dataSets[0].series;
  const series = seriesMap && Object.values(seriesMap)[0];
  const observations = series && series.observations;
  if(!observations) throw new Error(`BCE (${seriesLabel}) : réponse sans observation`);

  const timeValues = json.structure.dimensions.observation[0].values;
  const points = Object.keys(observations)
    .map(k => ({period: timeValues[+k] && timeValues[+k].id, value: observations[k][0]}))
    .filter(p => p.period && typeof p.value === 'number')
    .sort((a, b) => (a.period < b.period ? -1 : 1));
  if(points.length === 0) throw new Error(`BCE (${seriesLabel}) : aucune observation exploitable`);
  return points;
}

async function fetchEcbInflationFR(){
  const url = 'https://data-api.ecb.europa.eu/service/data/ICP/M.FR.N.000000.4.INX?format=jsondata&startPeriod=2016-01';
  const points = await fetchEcbSeriesFull(url, 'inflation FR');
  return {
    points,
    source: 'Banque centrale européenne (BCE) — statistiques HICP',
    sourceUrl: 'https://data.ecb.europa.eu/data/datasets/ICP',
    seriesKey: 'ICP.M.FR.N.000000.4.INX',
    instrument: "Indice des prix à la consommation harmonisé (IPCH), France, base 100",
    frequency: 'Mensuelle'
  };
}

async function fetchEcbMortgageRateFR(){
  const url = 'https://data-api.ecb.europa.eu/service/data/MIR/M.FR.B.A2C.A.R.A.2250.EUR.N?format=jsondata&startPeriod=2016-01';
  const points = await fetchEcbSeriesFull(url, 'taux crédit immobilier FR');
  return {
    points,
    source: 'Banque centrale européenne (BCE) — statistiques MIR (taux d\'intérêt des IFM)',
    sourceUrl: 'https://data.ecb.europa.eu/data/datasets/MIR',
    seriesKey: 'MIR.M.FR.B.A2C.A.R.A.2250.EUR.N',
    instrument: "Taux moyen des nouveaux crédits à l'habitat, ménages, France (taux annuel effectif au sens BCE)",
    frequency: 'Mensuelle'
  };
}

async function fetchEcbHomePriceIndexFR(){
  const url = 'https://data-api.ecb.europa.eu/service/data/RESR/Q.FR._T.N._TR.TVAL.4D0.TB.N.IX?format=jsondata&startPeriod=2016-01';
  const points = await fetchEcbSeriesFull(url, 'indice prix immobilier FR');
  return {
    points,
    source: 'BCE / Eurostat — statistiques immobilières résidentielles (RESR)',
    sourceUrl: 'https://data.ecb.europa.eu/data/datasets/RESR',
    seriesKey: 'RESR.Q.FR._T.N._TR.TVAL.4D0.TB.N.IX',
    instrument: "Indice des prix de l'immobilier résidentiel, France entière, tous logements",
    frequency: 'Trimestrielle'
  };
}

/* ------------------------------------------------------------
   Historique complet du taux de dépôt BCE (terminal économique,
   06/09/2026) — même série que fetchEcbDepositRate, mais avec
   startPeriod=1999-01 au lieu de lastNObservations=1. Vérifié en direct :
   plus de 10 000 observations QUOTIDIENNES depuis 1999 (la BCE publie
   ce taux tous les jours, même quand il ne change pas). Un graphique
   n'a besoin ni de cette densité ni de ce poids (~1,4 Mo) — on ne garde
   que la dernière observation réelle de chaque mois (jamais une valeur
   interpolée), ce qui donne un point par changement de taux effectif.
   ------------------------------------------------------------ */
function resampleToMonthlyLast(points){
  const byMonth = new Map();
  for(const p of points) byMonth.set(p.period.slice(0, 7), p);
  return Array.from(byMonth.values());
}

async function fetchEcbDepositRateHistory(){
  const url = 'https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.DFR.LEV?format=jsondata&startPeriod=1999-01';
  const dailyPoints = await fetchEcbSeriesFull(url, 'historique taux de dépôt BCE');
  return {
    points: resampleToMonthlyLast(dailyPoints),
    source: 'Banque centrale européenne (BCE) — facilité de dépôt',
    sourceUrl: 'https://data.ecb.europa.eu/data/datasets/FM',
    seriesKey: 'FM.D.U2.EUR.4F.KR.DFR.LEV',
    instrument: 'Taux de la facilité de dépôt, zone euro, un point par mois (dernière valeur quotidienne publiée du mois)',
    frequency: 'Quotidienne (rééchantillonnée en mensuelle, dernier point du mois)'
  };
}

module.exports = { fetchEcbDepositRate, fetchEcbInflationFR, fetchEcbMortgageRateFR, fetchEcbHomePriceIndexFR, fetchEcbDepositRateHistory };
