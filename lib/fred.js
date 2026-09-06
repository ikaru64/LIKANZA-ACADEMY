/* ============================================================
   LIKANZA ACADEMY — Helper partagé : taux directeur Fed (FRED)
   Utilisé par api/eco-rate.js. L'endpoint public fredgraph.csv de la
   Federal Reserve Bank of St. Louis ne nécessite AUCUNE clé pour les
   séries publiques (vérifié en direct le 06/09/2026) — mais ne renvoie
   pas d'en-tête Access-Control-Allow-Origin, d'où ce proxy serverless
   (même raison que lib/ecb.js : le navigateur ne peut pas l'appeler
   directement).

   Série FEDFUNDS = taux effectif des fonds fédéraux, mensuel — la
   mesure la plus citée dans la presse financière pour la politique
   monétaire américaine (équivalent du taux de dépôt BCE pour la zone
   euro, mais ce n'est pas rigoureusement le même concept : FEDFUNDS est
   un taux EFFECTIF de marché, pas un taux administré comme la facilité
   de dépôt BCE — précisé dans "instrument" pour ne jamais laisser croire
   à une comparaison parfaitement homogène).
   ============================================================ */

const FRED_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=FEDFUNDS';

function parseFredCsv(csvText, seriesId){
  const lines = csvText.trim().split(/\r?\n/);
  if(lines.length < 2 || !lines[0].includes(seriesId)) throw new Error(`FRED (${seriesId}) : format CSV inattendu`);
  const points = lines.slice(1)
    .map(line => {
      const [date, raw] = line.split(',');
      const value = parseFloat(raw);
      return {period: date, value};
    })
    .filter(p => p.period && typeof p.value === 'number' && !Number.isNaN(p.value))
    .sort((a, b) => (a.period < b.period ? -1 : 1));
  if(points.length === 0) throw new Error(`FRED (${seriesId}) : aucune observation exploitable`);
  return points;
}

async function fetchFedFundsRate(){
  const resp = await fetch(FRED_CSV_URL);
  if(!resp.ok) throw new Error(`FRED (FEDFUNDS) : HTTP ${resp.status}`);
  const csvText = await resp.text();
  const points = parseFredCsv(csvText, 'FEDFUNDS');
  return {
    points,
    source: 'Federal Reserve Bank of St. Louis (FRED) — Effective Federal Funds Rate',
    sourceUrl: 'https://fred.stlouisfed.org/series/FEDFUNDS',
    seriesKey: 'FEDFUNDS',
    instrument: "Taux effectif des fonds fédéraux (moyenne mensuelle), États-Unis — taux de marché, pas un taux administré (à ne pas comparer terme à terme avec la facilité de dépôt BCE)",
    frequency: 'Mensuelle'
  };
}

module.exports = { fetchFedFundsRate, parseFredCsv };
