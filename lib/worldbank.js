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

const WORLDBANK_COUNTRY_LABELS = {
  US: 'États-Unis', CN: 'Chine', JP: 'Japon', GB: 'Royaume-Uni',
  // Étendu pour la carte mondiale (06/09/2026) : Europe/Amériques/Asie
  // uniquement (périmètre choisi par l'utilisateur), chaque pays vérifié
  // en direct avec une vraie donnée 2024 pour croissance/inflation/chômage
  // avant d'être ajouté ici — jamais un pays listé sans couverture réelle.
  FR: 'France', DE: 'Allemagne', IT: 'Italie', ES: 'Espagne', NL: 'Pays-Bas',
  CH: 'Suisse', SE: 'Suède', PL: 'Pologne', RU: 'Russie', TR: 'Turquie',
  CA: 'Canada', MX: 'Mexique', BR: 'Brésil', AR: 'Argentine',
  KR: 'Corée du Sud', IN: 'Inde', ID: 'Indonésie', VN: 'Vietnam',
  TH: 'Thaïlande', PH: 'Philippines', PK: 'Pakistan', SA: 'Arabie saoudite'
};

// Les 26 pays retenus pour la carte mondiale (chantier "Carte mondiale",
// 06/09/2026) : Europe/Amériques/Asie, jamais l'Afrique ni l'Océanie —
// périmètre explicitement choisi par l'utilisateur, pas un oubli. Chacun
// vérifié en direct (curl) avec une vraie valeur 2024 pour
// gdp-growth/inflation/unemployment avant d'être inclus.
const WORLDBANK_MAP_COUNTRIES = [
  'FR','DE','IT','ES','GB','NL','CH','SE','PL','RU','TR',
  'US','CA','MX','BR','AR',
  'JP','CN','KR','IN','ID','VN','TH','PH','PK','SA'
];

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

// ---------- Carte mondiale (06/09/2026) : 1 indicateur × N pays, en un
// seul appel réseau (l'API Banque Mondiale accepte des codes ISO2 joints
// par ";", vérifié en direct) — jamais un fetch par pays comme le
// Comparateur, qui devient vite coûteux au-delà de quelques pays.
// Interroge une fenêtre de 3 années (pas une seule année fixe qui
// périmerait vite) et retient, PAR PAYS, sa propre observation la plus
// récente dans cette fenêtre — deux pays réels peuvent avoir leur
// dernière donnée publiée sur des années différentes (retard de
// publication variable), jamais uniformisés sous une seule année
// affichée pour tous. Un pays sans aucune observation réelle dans la
// fenêtre est simplement absent de `values`, jamais une valeur inventée
// ou reportée d'une année trop ancienne.
async function fetchWorldBankSeriesMulti(countryCodes, indicatorKey, yearRange){
  const indicator = WORLDBANK_INDICATORS[indicatorKey];
  if(!indicator) throw new Error(`Banque Mondiale : indicateur inconnu (${indicatorKey})`);
  const codes = countryCodes.join(';');
  const url = `https://api.worldbank.org/v2/country/${codes}/indicator/${indicator.code}?format=json&date=${yearRange}&per_page=${countryCodes.length * 5 + 10}`;
  const resp = await fetch(url, {headers: {'Accept': 'application/json'}});
  if(!resp.ok) throw new Error(`Banque Mondiale (${indicatorKey}, carte) : HTTP ${resp.status}`);
  const json = await resp.json();
  const rows = Array.isArray(json) && json[1];
  if(!Array.isArray(rows)) throw new Error(`Banque Mondiale (${indicatorKey}, carte) : réponse inattendue`);
  const values = {};
  rows.forEach(r => {
    if(typeof r.value !== 'number' || !r.country || typeof r.country.id !== 'string') return;
    const existing = values[r.country.id];
    if(!existing || r.date > existing.year) values[r.country.id] = {value: r.value, year: r.date};
  });
  return {
    indicator: indicatorKey,
    values,
    source: `Banque Mondiale — ${indicator.datasetLabel}`,
    sourceUrl: `https://data.worldbank.org/indicator/${indicator.code}`,
    label: indicator.label
  };
}

module.exports = { fetchWorldBankSeries, fetchWorldBankSeriesMulti, WORLDBANK_INDICATORS, WORLDBANK_COUNTRY_LABELS, WORLDBANK_MAP_COUNTRIES };
