/* ============================================================
   LIKANZA ACADEMY — Helper partagé : séries macroéconomiques Eurostat
   Utilisé par api/eco-rate.js, au même titre que lib/ecb.js (BCE). API
   publique Eurostat (format JSON-stat 2.0), aucune clé requise —
   testée en direct avant intégration (2026-08-23) sur les 3 séries
   ci-dessous, toutes vérifiées avec de vraies valeurs pour la France.

   Format JSON-stat vérifié : avec toutes les dimensions filtrées à une
   seule catégorie (geo=FR, s_adj=SA...) sauf "time", l'index de valeur
   correspond directement à l'index temporel (dimension.time.category.
   index) — parsing générique, sans hypothèse sur les autres dimensions.
   Une période sans observation publiée est simplement absente de
   l'objet "value" (jamais comblée par une valeur inventée).
   ============================================================ */

function parseEurostatTimeSeries(json, seriesLabel){
  const timeIndex = json.dimension && json.dimension.time && json.dimension.time.category && json.dimension.time.category.index;
  const value = json.value;
  if(!timeIndex || !value) throw new Error(`Eurostat (${seriesLabel}) : structure temporelle introuvable`);
  const points = Object.entries(timeIndex)
    .map(([period, idx]) => ({period, value: value[String(idx)]}))
    .filter(p => typeof p.value === 'number')
    .sort((a, b) => (a.period < b.period ? -1 : 1));
  if(points.length === 0) throw new Error(`Eurostat (${seriesLabel}) : aucune observation exploitable`);
  return points;
}

async function fetchEurostatSeries(url, seriesLabel){
  const resp = await fetch(url, {headers: {'Accept': 'application/json'}});
  if(!resp.ok) throw new Error(`Eurostat (${seriesLabel}) : HTTP ${resp.status}`);
  const json = await resp.json();
  return parseEurostatTimeSeries(json, seriesLabel);
}

/* ------------------------------------------------------------
   Extension multi-pays (terminal économique, 06/09/2026) : les 3 séries
   ci-dessus n'avaient que geo=FR codé en dur. Eurostat couvre nativement
   les autres pays UE avec le même dataset — seul le code géographique
   change. Zone euro : aucun code EA/EA19/EA20 ne renvoie d'observation
   sur ces 3 datasets (vérifié en direct, dimension geo vide) — EU27_2020
   (Union européenne à 27) est utilisé comme agrégat à la place, jamais
   présenté comme "zone euro" pour ne pas mal étiqueter la donnée.
   ------------------------------------------------------------ */
const EUROSTAT_COUNTRY_LABELS = {
  FR: 'France', DE: 'Allemagne', IT: 'Italie', ES: 'Espagne', EU27_2020: 'Union européenne (27)'
};

async function fetchEurostatUnemployment(geo){
  const label = EUROSTAT_COUNTRY_LABELS[geo] || geo;
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m?format=JSON&geo=${geo}&s_adj=SA&age=TOTAL&sex=T&unit=PC_ACT&lastTimePeriod=60`;
  const points = await fetchEurostatSeries(url, `chômage ${geo}`);
  return {
    points,
    source: 'Eurostat — Enquête sur les forces de travail (une_rt_m)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/une_rt_m',
    seriesKey: `une_rt_m.${geo}.SA.TOTAL.PC_ACT`,
    instrument: `Taux de chômage, ${label}, corrigé des variations saisonnières, % de la population active`,
    frequency: 'Mensuelle'
  };
}

async function fetchEurostatGdpGrowth(geo){
  const label = EUROSTAT_COUNTRY_LABELS[geo] || geo;
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/namq_10_gdp?format=JSON&geo=${geo}&na_item=B1GQ&unit=CLV_PCH_PRE&s_adj=SCA&lastTimePeriod=40`;
  const points = await fetchEurostatSeries(url, `croissance PIB ${geo}`);
  return {
    points,
    source: 'Eurostat — Comptes nationaux trimestriels (namq_10_gdp)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/namq_10_gdp',
    seriesKey: `namq_10_gdp.${geo}.SCA.B1GQ.CLV_PCH_PRE`,
    instrument: `Croissance du PIB en volume, ${label}, variation trimestrielle en %, corrigée des variations saisonnières`,
    frequency: 'Trimestrielle'
  };
}

async function fetchEurostatGovDebt(geo){
  const label = EUROSTAT_COUNTRY_LABELS[geo] || geo;
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10q_ggdebt?format=JSON&geo=${geo}&na_item=GD&sector=S13&unit=PC_GDP&lastTimePeriod=40`;
  const points = await fetchEurostatSeries(url, `dette publique ${geo}`);
  return {
    points,
    source: 'Eurostat — Statistiques trimestrielles des administrations publiques (gov_10q_ggdebt)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/gov_10q_ggdebt',
    seriesKey: `gov_10q_ggdebt.${geo}.S13.GD.PC_GDP`,
    instrument: `Dette publique brute (Maastricht), ${label}, % du PIB`,
    frequency: 'Trimestrielle'
  };
}

async function fetchEurostatGovDeficit(geo){
  const label = EUROSTAT_COUNTRY_LABELS[geo] || geo;
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10q_ggnfa?format=JSON&geo=${geo}&na_item=B9&sector=S13&unit=PC_GDP&s_adj=SCA&lastTimePeriod=40`;
  const points = await fetchEurostatSeries(url, `déficit public ${geo}`);
  return {
    points,
    source: 'Eurostat — Comptes trimestriels non financiers des administrations publiques (gov_10q_ggnfa)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/gov_10q_ggnfa',
    seriesKey: `gov_10q_ggnfa.${geo}.SCA.S13.B9.PC_GDP`,
    instrument: `Capacité (+) / besoin (-) de financement des administrations publiques, ${label}, % du PIB, données cvs-cjo (une valeur négative = déficit)`,
    frequency: 'Trimestrielle'
  };
}

async function fetchEurostatConsumerConfidence(geo){
  const label = EUROSTAT_COUNTRY_LABELS[geo] || geo;
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ei_bsco_m?format=JSON&geo=${geo}&indic=BS-CSMCI&s_adj=SA&unit=BAL&lastTimePeriod=60`;
  const points = await fetchEurostatSeries(url, `confiance des ménages ${geo}`);
  return {
    points,
    source: 'Eurostat / Commission européenne — Enquêtes de conjoncture (ei_bsco_m)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/ei_bsco_m',
    seriesKey: `ei_bsco_m.${geo}.SA.BS-CSMCI.BAL`,
    instrument: `Indicateur de confiance des consommateurs, ${label}, solde d'opinion (points, pas un pourcentage — 0 = moyenne de long terme)`,
    frequency: 'Mensuelle'
  };
}

// Alias rétrocompatibles : conservent exactement le contrat déjà consommé
// par api/eco-rate.js (clés 'unemployment-fr' etc.), laboratoire.js et
// business.js.
const fetchEurostatUnemploymentFR = () => fetchEurostatUnemployment('FR');
const fetchEurostatGdpGrowthFR = () => fetchEurostatGdpGrowth('FR');
const fetchEurostatGovDebtFR = () => fetchEurostatGovDebt('FR');

module.exports = {
  fetchEurostatSeries, parseEurostatTimeSeries,
  fetchEurostatUnemploymentFR, fetchEurostatGdpGrowthFR, fetchEurostatGovDebtFR,
  fetchEurostatUnemployment, fetchEurostatGdpGrowth, fetchEurostatGovDebt,
  fetchEurostatGovDeficit, fetchEurostatConsumerConfidence,
  EUROSTAT_COUNTRY_LABELS
};
