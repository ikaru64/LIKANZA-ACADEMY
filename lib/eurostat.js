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

async function fetchEurostatUnemploymentFR(){
  const url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m?format=JSON&geo=FR&s_adj=SA&age=TOTAL&sex=T&unit=PC_ACT&lastTimePeriod=60';
  const points = await fetchEurostatSeries(url, 'chômage FR');
  return {
    points,
    source: 'Eurostat — Enquête sur les forces de travail (une_rt_m)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/une_rt_m',
    seriesKey: 'une_rt_m.FR.SA.TOTAL.PC_ACT',
    instrument: 'Taux de chômage, France, corrigé des variations saisonnières, % de la population active',
    frequency: 'Mensuelle'
  };
}

async function fetchEurostatGdpGrowthFR(){
  const url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/namq_10_gdp?format=JSON&geo=FR&na_item=B1GQ&unit=CLV_PCH_PRE&s_adj=SCA&lastTimePeriod=40';
  const points = await fetchEurostatSeries(url, 'croissance PIB FR');
  return {
    points,
    source: 'Eurostat — Comptes nationaux trimestriels (namq_10_gdp)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/namq_10_gdp',
    seriesKey: 'namq_10_gdp.FR.SCA.B1GQ.CLV_PCH_PRE',
    instrument: 'Croissance du PIB en volume, France, variation trimestrielle en %, corrigée des variations saisonnières',
    frequency: 'Trimestrielle'
  };
}

async function fetchEurostatGovDebtFR(){
  const url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10q_ggdebt?format=JSON&geo=FR&na_item=GD&sector=S13&unit=PC_GDP&lastTimePeriod=40';
  const points = await fetchEurostatSeries(url, 'dette publique FR');
  return {
    points,
    source: 'Eurostat — Statistiques trimestrielles des administrations publiques (gov_10q_ggdebt)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/gov_10q_ggdebt',
    seriesKey: 'gov_10q_ggdebt.FR.S13.GD.PC_GDP',
    instrument: 'Dette publique brute (Maastricht), France, % du PIB',
    frequency: 'Trimestrielle'
  };
}

module.exports = { fetchEurostatSeries, parseEurostatTimeSeries, fetchEurostatUnemploymentFR, fetchEurostatGdpGrowthFR, fetchEurostatGovDebtFR };
