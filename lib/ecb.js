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

module.exports = { fetchEcbDepositRate };
