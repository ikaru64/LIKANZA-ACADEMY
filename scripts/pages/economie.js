/* ============================================================
   LIKANZA ACADEMY — Page Économie (economie.html)
   Nouveau pilier macro (prompt "Extension intelligente des domaines",
   Priorité 1) : 5 indicateurs réels (BCE + Eurostat, /api/eco-rate),
   chacun avec sa source, sa fréquence et ses limites explicites — même
   discipline "jamais de valeur inventée" que le reste du site. Le taux
   de dépôt BCE (déjà branché depuis la refonte Bourse mais jamais
   affiché ailleurs) trouve ici sa vraie place. Le calcul de l'inflation
   glissante sur 12 mois réutilise computeRealInflationRate (scripts/
   data.js), déjà utilisé par le Laboratoire — pas de deuxième calcul.
   ============================================================ */

const ECO_INDICATORS = [
  {key: 'depositRate', icon: '🏦', title: 'Taux de dépôt BCE', seriesKey: null, historicalKey: null,
    fmt: v => v.rate + ' %', asOf: v => v.asOf, source: v => v.source, instrument: v => v.instrument},
  {key: 'inflation', icon: '📉', title: 'Inflation (France)', seriesKey: 'inflation-fr', historicalKey: 'inflationFR',
    fmt: v => { const r = computeRealInflationRate(v.points); return typeof r === 'number' ? (r >= 0 ? '+' : '') + r.toFixed(1) + ' %' : 'n.d.'; },
    asOf: v => v.points[v.points.length - 1].period, source: v => v.source, instrument: () => 'Glissement annuel (12 mois), calculé à partir de l\'indice réel'},
  {key: 'unemployment', icon: '💼', title: 'Chômage (France)', seriesKey: 'unemployment-fr', historicalKey: 'unemploymentFR',
    fmt: v => v.points[v.points.length - 1].value.toFixed(1) + ' %', asOf: v => v.points[v.points.length - 1].period, source: v => v.source, instrument: v => v.instrument},
  {key: 'gdpGrowth', icon: '🌍', title: 'Croissance du PIB (France)', seriesKey: 'gdp-growth-fr', historicalKey: 'gdpGrowthFR',
    fmt: v => { const p = v.points[v.points.length - 1].value; return (p >= 0 ? '+' : '') + p.toFixed(1) + ' %'; },
    asOf: v => v.points[v.points.length - 1].period, source: v => v.source, instrument: v => v.instrument},
  {key: 'govDebt', icon: '💰', title: 'Dette publique (France)', seriesKey: 'gov-debt-fr', historicalKey: 'govDebtFR',
    fmt: v => v.points[v.points.length - 1].value.toFixed(1) + ' % du PIB', asOf: v => v.points[v.points.length - 1].period, source: v => v.source, instrument: v => v.instrument}
];

async function fetchEcoIndicator(spec){
  const url = spec.seriesKey ? `/api/eco-rate?series=${spec.seriesKey}` : '/api/eco-rate';
  const resp = await fetch(url);
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  if(spec.seriesKey && (!Array.isArray(data.points) || data.points.length === 0)) throw new Error('Série sans observation');
  return data;
}

async function renderEcoIndicators(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = ECO_INDICATORS.map(spec => `
    <div class="card" id="ecoCard-${spec.key}">
      <span class="smallcaps">${spec.icon} ${spec.title}</span>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Chargement…</p>
    </div>`).join('');

  await Promise.all(ECO_INDICATORS.map(async spec => {
    const cardEl = document.getElementById(`ecoCard-${spec.key}`);
    if(!cardEl) return;
    try {
      const data = await fetchEcoIndicator(spec);
      cardEl.innerHTML = `
        <span class="smallcaps">${spec.icon} ${spec.title}</span>
        <div class="result-big" style="font-size:26px;margin-top:8px;">${spec.fmt(data)}</div>
        <p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">${spec.asOf(data)}${spec.source ? ' · ' + spec.source(data) : ''}</p>
        ${renderMethodologyPanel({
          donnees: spec.instrument ? spec.instrument(data) : '',
          limites: spec.historicalKey ? `Fréquence de publication : voir source. Une donnée macro décrit une moyenne nationale — elle ne reflète pas nécessairement une situation individuelle.` : "Le taux de dépôt est l'un des trois taux directeurs de la BCE — il ne détermine pas directement les taux des crédits ou de l'épargne, qui dépendent aussi des marges bancaires et de la concurrence."
        })}
        ${spec.historicalKey ? renderSourceNote(spec.historicalKey) : ''}`;
    } catch(err){
      cardEl.innerHTML = `
        <span class="smallcaps">${spec.icon} ${spec.title}</span>
        <p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Donnée indisponible pour le moment (${err.message}).</p>`;
    }
  }));
}
safeRun('indicateurs macro', () => renderEcoIndicators('ecoIndicators'));

// ---------- Concepts clés — Bibliothèque (catégorie "Économie" déjà
// existante), même pattern d'accordéon que la page Crypto. ----------
const ecoLib = LIBRARY.filter(l => l.categorie === 'Économie');
safeRun('glossaire économie', () => {
  const el = document.getElementById('ecoGlossary');
  if(!el) return;
  el.innerHTML = ecoLib.map(l => `
    <div class="glossary-item">
      <button type="button" class="head" style="background:none;border:none;width:100%;text-align:left;font:inherit;" onclick="this.nextElementSibling.classList.toggle('open')"><h4>${l.terme}</h4><span class="idx">${l.niveau}</span></button>
      <div class="glossary-body">${l.detail}</div>
    </div>`).join('') || '<p style="color:var(--text-dim);font-size:13px;">Notions à venir.</p>';
});
