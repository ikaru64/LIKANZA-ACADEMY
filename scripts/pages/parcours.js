/* ============================================================
   LIKANZA ACADEMY — Mon Univers Financier
   Cockpit financier personnel (patrimoine, objectifs, alertes,
   projets, trajectoire...), via la coquille de widgets partagée
   (renderDashboardShell, scripts/data.js). Jamais verrouillé : le
   reste du site reste accessible sans avoir fait le premier quiz.
   Mais tant qu'il n'est pas fait, cette page elle-même met une
   seule action en avant (le premier quiz) plutôt qu'un tableau de
   bord vide.

   Sprint de fermeture des écarts (04/09/2026, phases 4-5) : le
   sélecteur de niveau curriculum et la liste de missions par palier
   (l'ancienne identité "Mon Parcours") ont été retirés d'ici — cette
   page ne répond plus qu'à "où en est ma situation financière et où
   vais-je ?", jamais à "quel cours suivre ensuite" (déplacé sur
   formations.html, voir scripts/pages/formations.js).
   ============================================================ */

// Chantier 1 (audit Dashboard du 28/08/2026) : remplace la pile de sections
// individuelles (profil, stats, prochain pas, Financial IQ, détail par
// domaine) par la coquille de widgets (renderDashboardShell, scripts/data.js)
// — personnalisable, avec bascule Personnel/Professionnel en page.
function initParcoursHero(){
  const hasProfile = !!getPositioningResult();
  if(!hasProfile){
    document.getElementById('parcoursGateSection').style.display = 'block';
    renderParcoursGate('parcoursGate');
    return;
  }
  document.getElementById('parcoursMainSection').style.display = 'block';
  // En-tête scindé (refonte cockpit, 05/09/2026) : les 3 bandeaux de nudge
  // (onboarding/ré-onboarding/suggestion d'intérêt) restent au-dessus du
  // pli, toujours visibles ; le bloc gamification (XP/niveau/série) est
  // du contenu pédagogique au sens du nouveau cockpit — voir Phase 3 pour
  // son déplacement dans la section repliée "Suite de l'apprentissage".
  renderParcoursNudges('parcoursNudges');
  renderGamificationHeader('dashboardHeader');
  renderDashboardShell('dashboardShell');
  renderCockpitHeader('cockpitHeader');
  renderCockpitKPIs('cockpitKPIs');
  renderCockpitChart('cockpitChart');
  renderCockpitSide('cockpitSide');
}

// ============================================================
// Cockpit financier (refonte 05/09/2026) — en-tête compact + rangée de KPI.
// Aucune donnée fabriquée : computeCockpitKPIs (scripts/data.js) compose
// computeNetWorth/computeBudgetSummary, déjà réels. "Dernière mise à jour"
// vient du point réel le plus récent (historique de patrimoine ou dernier
// actif ajouté), jamais une date d'aujourd'hui codée en dur.
// ============================================================
function cockpitLastUpdateLabel(){
  const history = getNetWorthHistory();
  const assets = getNetWorthAssets();
  const dates = [
    ...history.map(p => p.dateAjout),
    ...assets.map(a => a.dateAjout)
  ].filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d));
  if(dates.length === 0) return null;
  const mostRecent = new Date(Math.max(...dates.map(d => d.getTime())));
  return mostRecent.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'}) + ' · ' + mostRecent.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
}
function renderCockpitHeader(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const lastUpdate = cockpitLastUpdateLabel();
  el.innerHTML = `
    <div class="cockpit-title">
      <h2>Mon Univers Financier</h2>
      <p class="cockpit-subtitle">Une vision globale de ton capital, aujourd'hui et demain.</p>
    </div>
    <div style="display:flex;align-items:center;gap:16px;">
      <button type="button" class="btn btn-sm btn-gold" id="cockpitProjectBtn">Projeter mon capital</button>
      <div class="cockpit-meta">
        <div>Dernière mise à jour</div>
        <div class="cockpit-meta-value">${lastUpdate || 'Aucune donnée enregistrée'}</div>
      </div>
    </div>`;
  const projectBtn = document.getElementById('cockpitProjectBtn');
  if(projectBtn) projectBtn.addEventListener('click', openCockpitProjectionModal);
}

// Vue active partagée entre les KPI et les onglets du graphique combiné
// (Phase 5) : un seul état, deux points d'entrée (clic KPI ou clic onglet),
// setCockpitView synchronise les deux et met à jour le graphique.
// 'liquidites' pointe vers 'global' (aucun onglet dédié aux liquidités
// seules dans le graphique — GLOBAL/ÉPARGNE/INVESTISSEMENTS/REVENUS
// seulement), jamais un onglet fabriqué pour combler l'écart.
let cockpitActiveView = 'global';
const COCKPIT_KPI_VIEWS = {patrimoine: 'global', liquidites: 'global', epargne: 'epargne', investissements: 'investissements', solde: 'revenus'};
function setCockpitView(view){
  cockpitActiveView = view;
  document.querySelectorAll('.cockpit-kpi').forEach(btn => {
    btn.classList.toggle('active', (COCKPIT_KPI_VIEWS[btn.dataset.key] || 'global') === view);
  });
  document.querySelectorAll('.cockpit-chart-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  updateCockpitChartView(view);
}
function renderCockpitKPIs(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const k = computeCockpitKPIs();
  const pct = v => k.patrimoineNet > 0 ? Math.round((v / k.patrimoineNet) * 100) : 0;
  const cards = [
    {key: 'patrimoine', label: 'Patrimoine total', value: k.patrimoineNet, sub: null},
    {key: 'liquidites', label: 'Liquidités', value: k.liquidites, sub: k.patrimoineNet > 0 ? `${pct(k.liquidites)} % du patrimoine` : null},
    {key: 'epargne', label: 'Épargne', value: k.epargne, sub: k.patrimoineNet > 0 ? `${pct(k.epargne)} % du patrimoine` : null},
    {key: 'investissements', label: 'Investissements', value: k.investissements, sub: k.patrimoineNet > 0 ? `${pct(k.investissements)} % du patrimoine` : null},
    {key: 'solde', label: 'Solde mensuel', value: k.soldeMensuel, sub: k.soldeMensuel !== 0 ? `${k.tauxEpargnePct.toFixed(0)} % taux d'épargne` : null}
  ];
  el.innerHTML = cards.map((c, i) => `
    <button type="button" class="cockpit-kpi ${i === 0 ? 'active' : ''}" data-key="${c.key}" id="${elId}-${c.key}">
      <span class="kpi-label">${c.label}</span>
      <span class="kpi-value mono" id="${elId}-${c.key}-value">0 €</span>
      ${c.sub ? `<span class="kpi-sub">${c.sub}</span>` : ''}
    </button>`).join('');
  cards.forEach(c => {
    animateNumber(document.getElementById(`${elId}-${c.key}-value`), c.value, {format: fmtEUR});
  });
  el.querySelectorAll('.cockpit-kpi').forEach(btn => {
    btn.addEventListener('click', () => setCockpitView(COCKPIT_KPI_VIEWS[btn.dataset.key] || 'global'));
  });
}

// ============================================================
// Graphique combiné "Évolution du patrimoine" (Phase 5) — Chart.js, seule
// librairie externe du site (justifiée : aucune fonction de graphique
// existante ne gère de vraie interactivité au survol). Barres empilées
// (liquidités/épargne/investissements/autres) + courbe dorée (total réel).
// Enregistre lui-même un point d'historique catégorisé au chargement (même
// garde-fou idempotent qu'dans laboratoire.js), pour que l'historique
// s'alimente même si l'utilisateur ne visite jamais le Laboratoire.
// ============================================================
const COCKPIT_CHART_RANGES = [
  {key:'6m', label:'6 mois', months:6}, {key:'1a', label:'1 an', months:12},
  {key:'2a', label:'2 ans', months:24}, {key:'5a', label:'5 ans', months:60},
  {key:'tout', label:'Toutes les enveloppes', months:null}
];
let cockpitChartRangeKey = 'tout';
let cockpitChartInstance = null;
function cockpitCSSVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function cockpitChartDatasets(series){
  const gold = cockpitCSSVar('--gold-bright') || '#D9BC7C';
  const emerald = cockpitCSSVar('--emerald') || '#4E9177';
  const blue = '#438BFF';
  const grey = cockpitCSSVar('--text-dim') || '#9B968C';
  return [
    {key: 'liquidites', type: 'bar', label: 'Liquidités', data: series.liquidites, backgroundColor: grey, stack: 'patrimoine'},
    {key: 'epargne', type: 'bar', label: 'Épargne', data: series.epargne, backgroundColor: emerald, stack: 'patrimoine'},
    {key: 'investissements', type: 'bar', label: 'Investissements', data: series.investissements, backgroundColor: blue, stack: 'patrimoine'},
    {key: 'autres', type: 'bar', label: 'Autres (immobilier, véhicule...)', data: series.autres, backgroundColor: 'rgba(155,150,140,0.35)', stack: 'patrimoine'},
    {key: 'total', type: 'line', label: 'Patrimoine total', data: series.total, borderColor: gold, backgroundColor: gold, borderWidth: 2.5, pointRadius: 2, tension: 0.15, yAxisID: 'y'}
  ];
}
// Filtre honnête par onglet : GLOBAL montre tout ; ÉPARGNE/INVESTISSEMENTS
// n'estompent (opacité réduite) que les autres barres — jamais masquées
// silencieusement, l'utilisateur voit toujours que la donnée existe.
function cockpitDatasetOpacity(key, view){
  if(view === 'global' || key === 'total') return 1;
  if(view === 'epargne') return key === 'epargne' ? 1 : 0.15;
  if(view === 'investissements') return key === 'investissements' ? 1 : 0.15;
  return 1;
}
function updateCockpitChartView(view){
  const revenusEl = document.getElementById('cockpitChart-revenus');
  const canvasWrap = document.getElementById('cockpitChart-canvas-wrap');
  if(!revenusEl || !canvasWrap) return;
  if(view === 'revenus'){
    canvasWrap.style.display = 'none';
    revenusEl.style.display = '';
    renderCockpitRevenusPanel('cockpitChart-revenus');
    return;
  }
  canvasWrap.style.display = '';
  revenusEl.style.display = 'none';
  if(!cockpitChartInstance) return;
  cockpitChartInstance.data.datasets.forEach((ds, i) => {
    const key = cockpitChartInstance.data.datasetKeys[i];
    const opacity = cockpitDatasetOpacity(key, view);
    if(ds.type === 'bar') ds.backgroundColor = cockpitApplyOpacity(ds._baseColor || ds.backgroundColor, opacity, ds);
  });
  cockpitChartInstance.update();
}
function cockpitApplyOpacity(baseColor, opacity, ds){
  if(!ds._baseColor) ds._baseColor = baseColor;
  const base = ds._baseColor;
  if(base.startsWith('rgba')) return base.replace(/[\d.]+\)$/, opacity + ')');
  if(base.startsWith('#')){
    const r = parseInt(base.slice(1,3),16), g = parseInt(base.slice(3,5),16), b = parseInt(base.slice(5,7),16);
    return `rgba(${r},${g},${b},${opacity})`;
  }
  return base;
}
function renderCockpitRevenusPanel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const est = computeCapitalIncomeEstimate();
  if(!est){
    el.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Renseigne ton patrimoine pour voir apparaître une estimation ici.</p>`;
    return;
  }
  el.innerHTML = `
    <span class="smallcaps" style="color:var(--gold-bright);">Revenus de capital estimés</span>
    <div class="result-big" style="font-size:28px;margin-top:8px;">${fmtEUR(est.monthlyEstimate)} <span style="font-size:13px;color:var(--text-dim);font-weight:400;">/ mois</span></div>
    <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${fmtEUR(est.annualEstimate)} / an, SCÉNARIO CENTRAL (${est.ratePct} % de rendement annuel supposé).</p>
    <p class="disclaimer-box" style="margin-top:10px;">Aucun suivi réel de dividendes/intérêts perçus n'existe encore sur Likanza — ceci est une estimation basée sur ton patrimoine actuel et le même moteur de scénario que "Mon Futur", jamais un montant déjà perçu.</p>`;
}
function renderCockpitChart(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const assets = getNetWorthAssets();
  const debts = getPersonalDebts();
  const net = computeNetWorth(assets, debts);
  // Écrit lui-même un point d'historique catégorisé (même garde-fou
  // idempotent que laboratoire.js) — l'historique s'alimente même si
  // l'utilisateur ne visite jamais le Laboratoire.
  if(assets.length > 0 || debts.length > 0){
    recordNetWorthSnapshot(currentMonthKey(), net.patrimoineNet, net.parCategorie);
  }
  const fullHistory = getNetWorthHistory();
  if(fullHistory.length === 0){
    el.innerHTML = `
      <span class="smallcaps">Évolution du patrimoine</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:12px;">Renseigne ton patrimoine (actifs/dettes) pour voir apparaître son évolution ici.</p>
      <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm" style="margin-top:10px;align-self:flex-start;">Renseigner mes finances →</a>`;
    return;
  }
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <span class="smallcaps">Évolution du patrimoine</span>
      <div class="mode-toggle">
        <button class="pill cockpit-chart-tab active" data-view="global">GLOBAL</button>
        <button class="pill cockpit-chart-tab" data-view="epargne">ÉPARGNE</button>
        <button class="pill cockpit-chart-tab" data-view="investissements">INVESTISSEMENTS</button>
        <button class="pill cockpit-chart-tab" data-view="revenus">REVENUS</button>
      </div>
    </div>
    <select id="cockpitChartRange" style="margin-top:10px;max-width:200px;">
      ${COCKPIT_CHART_RANGES.map(r => `<option value="${r.key}" ${r.key === cockpitChartRangeKey ? 'selected' : ''}>${r.label}</option>`).join('')}
    </select>
    <div id="cockpitChart-canvas-wrap" style="position:relative;flex:1;margin-top:14px;min-height:220px;">
      <canvas id="cockpitChartCanvas"></canvas>
    </div>
    <div id="cockpitChart-revenus" class="cockpit-panel" style="display:none;margin-top:14px;"></div>`;

  function buildOrUpdateChart(){
    const range = COCKPIT_CHART_RANGES.find(r => r.key === cockpitChartRangeKey) || COCKPIT_CHART_RANGES[COCKPIT_CHART_RANGES.length - 1];
    const sliced = range.months ? fullHistory.slice(-range.months) : fullHistory;
    const series = buildWealthEvolutionSeries(sliced);
    const datasets = cockpitChartDatasets(series);
    const canvas = document.getElementById('cockpitChartCanvas');
    if(!canvas || typeof Chart === 'undefined') return;
    if(cockpitChartInstance) cockpitChartInstance.destroy();
    const hairline = cockpitCSSVar('--hairline') || 'rgba(184,151,78,0.22)';
    const textDim = cockpitCSSVar('--text-dim') || '#9B968C';
    cockpitChartInstance = new Chart(canvas.getContext('2d'), {
      data: {labels: series.labels, datasets: datasets.map(({key, ...d}) => d)},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: {mode: 'index', intersect: false},
        scales: {
          x: {stacked: true, grid: {color: hairline}, ticks: {color: textDim, font: {family: "'IBM Plex Mono', monospace", size: 10.5}}},
          y: {stacked: true, grid: {color: hairline}, ticks: {color: textDim, callback: v => fmtEUR(v)}}
        },
        plugins: {
          legend: {labels: {color: textDim, boxWidth: 10, font: {size: 11}}},
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label} : ${ctx.parsed.y === null ? 'donnée non disponible' : fmtEUR(ctx.parsed.y)}`
            }
          }
        }
      }
    });
    cockpitChartInstance.data.datasetKeys = datasets.map(d => d.key);
    updateCockpitChartView(cockpitActiveView);
  }
  buildOrUpdateChart();

  document.getElementById('cockpitChartRange').addEventListener('change', e => {
    cockpitChartRangeKey = e.target.value;
    buildOrUpdateChart();
  });
  el.querySelectorAll('.cockpit-chart-tab').forEach(btn => {
    btn.addEventListener('click', () => setCockpitView(btn.dataset.view));
  });
}

// ============================================================
// Colonne latérale (Phase 6) — donut interactif, comptes & enveloppes,
// objectifs (fusion visuelle goals + projets de vie, jamais un vrai
// merge : deux registres réellement différents), allocation globale.
// ============================================================
function renderCockpitSide(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <div class="cockpit-panel" id="${elId}-donut"></div>
    <div class="cockpit-panel" id="${elId}-accounts"></div>
    <div class="cockpit-panel" id="${elId}-objectifs"></div>
    <div class="cockpit-panel" id="${elId}-allocation"></div>
    <div class="cockpit-panel" id="${elId}-score"></div>
    <div class="cockpit-panel" id="${elId}-insights"></div>`;
  renderCockpitDonut(`${elId}-donut`);
  renderCockpitAccounts(`${elId}-accounts`);
  renderCockpitObjectifs(`${elId}-objectifs`);
  renderCockpitAllocation(`${elId}-allocation`);
  // Score financier et Insights (Phase 7) réutilisent verbatim les widgets
  // déjà réels et testés — mêmes fonctions que l'ancien DASHBOARD_WIDGETS
  // (health-score/alerts, retirés du registre en Phase 3), jamais réécrits.
  renderHealthScoreDashboardWidget(`${elId}-score`);
  renderAlertsDashboardWidget(`${elId}-insights`);
}

// ---------- Donut interactif ----------
let cockpitDonutInstance = null;
let cockpitAccountsFilter = null; // catégorie active pour le filtre comptes (clic donut/légende)
function renderCockpitDonut(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const segs = getWealthAllocationSegments();
  if(segs.length === 0){
    el.innerHTML = `<span class="panel-title">Répartition du patrimoine</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">Renseigne ton patrimoine pour voir apparaître sa répartition ici.</p>`;
    return;
  }
  const net = computeNetWorth(getNetWorthAssets(), getPersonalDebts());
  el.innerHTML = `
    <span class="panel-title">Répartition du patrimoine</span>
    <div style="position:relative;margin-top:14px;height:190px;">
      <canvas id="${elId}-canvas"></canvas>
      <div class="cockpit-donut-center" id="${elId}-center">
        <div class="cockpit-donut-total mono">${fmtEUR(net.patrimoineNet)}</div>
        <div class="cockpit-donut-label">Patrimoine total</div>
      </div>
    </div>
    <div class="cockpit-donut-legend" id="${elId}-legend">
      ${segs.map(s => `
        <button type="button" class="cockpit-donut-legend-row ${s.key === cockpitAccountsFilter ? 'active' : ''}" data-key="${s.key}">
          <span class="cockpit-donut-legend-dot" style="background:${s.color};"></span>
          <span class="cockpit-donut-legend-label">${s.label}</span>
          <span class="cockpit-donut-legend-value mono">${fmtEUR(s.value)} · ${Math.round(s.pct)} %</span>
        </button>`).join('')}
    </div>`;

  const canvas = document.getElementById(`${elId}-canvas`);
  const centerTotal = document.getElementById(`${elId}-center`).querySelector('.cockpit-donut-total');
  const centerLabel = document.getElementById(`${elId}-center`).querySelector('.cockpit-donut-label');
  if(!canvas || typeof Chart === 'undefined') return;
  if(cockpitDonutInstance) cockpitDonutInstance.destroy();

  // elId suit toujours le motif "<conteneur>-donut" (voir renderCockpitSide) —
  // dérive l'id du panneau comptes voisin plutôt que de le coder en dur.
  const accountsElId = elId.replace(/-donut$/, '-accounts');
  function selectCategory(key){
    cockpitAccountsFilter = cockpitAccountsFilter === key ? null : key;
    document.querySelectorAll(`#${elId}-legend .cockpit-donut-legend-row`).forEach(row => {
      row.classList.toggle('active', row.dataset.key === cockpitAccountsFilter);
    });
    renderCockpitAccounts(accountsElId);
  }

  cockpitDonutInstance = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: segs.map(s => s.label),
      datasets: [{data: segs.map(s => s.value), backgroundColor: segs.map(s => s.color), borderWidth: 0, hoverOffset: 6}]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: {legend: {display: false}, tooltip: {callbacks: {label: ctx => `${ctx.label} : ${fmtEUR(ctx.parsed)}`}}},
      onHover: (evt, elements) => {
        if(elements.length){
          const seg = segs[elements[0].index];
          centerTotal.textContent = fmtEUR(seg.value);
          centerLabel.textContent = seg.label;
        } else {
          centerTotal.textContent = fmtEUR(net.patrimoineNet);
          centerLabel.textContent = 'Patrimoine total';
        }
      },
      onClick: (evt, elements) => {
        if(elements.length) selectCategory(segs[elements[0].index].key);
      }
    }
  });

  document.getElementById(`${elId}-legend`).querySelectorAll('.cockpit-donut-legend-row').forEach(row => {
    row.addEventListener('click', () => selectCategory(row.dataset.key));
  });
}

// ---------- Mes comptes & enveloppes ----------
function renderCockpitAccounts(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const assets = getNetWorthAssets();
  if(assets.length === 0){
    el.innerHTML = `<span class="panel-title">Mes comptes &amp; enveloppes</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">Aucun compte enregistré pour l'instant.</p><a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm btn-gold" style="margin-top:10px;">Ajouter un compte →</a>`;
    return;
  }
  const filtered = cockpitAccountsFilter ? assets.filter(a => a.categorie === cockpitAccountsFilter) : assets;
  const sorted = filtered.slice().sort((a, b) => b.valeur - a.valeur);
  el.innerHTML = `
    <span class="panel-title">Mes comptes &amp; enveloppes</span>
    ${cockpitAccountsFilter ? `<p style="font-size:11.5px;color:var(--gold-bright);margin-top:8px;">Filtré : ${NET_WORTH_CATEGORY_LABELS[cockpitAccountsFilter] || cockpitAccountsFilter} <button type="button" id="${elId}-clear-filter" style="background:none;border:none;color:var(--text-dim);cursor:pointer;text-decoration:underline;margin-left:4px;">retirer ×</button></p>` : ''}
    <div style="margin-top:8px;">
      ${sorted.length === 0
        ? `<p style="font-size:12.5px;color:var(--text-dim);padding:8px 0;">Aucun compte dans cette catégorie.</p>`
        : sorted.map(a => `
        <a href="laboratoire.html#tab-budget-epargne" class="cockpit-account-row">
          <span>${a.nom}<span class="cockpit-account-cat">${NET_WORTH_CATEGORY_LABELS[a.categorie] || a.categorie}</span></span>
          <span class="mono">${fmtEUR(a.valeur)}</span>
        </a>`).join('')}
    </div>`;
  if(cockpitAccountsFilter){
    const clearBtn = document.getElementById(`${elId}-clear-filter`);
    if(clearBtn) clearBtn.addEventListener('click', () => {
      cockpitAccountsFilter = null;
      document.querySelectorAll('.cockpit-donut-legend-row').forEach(row => row.classList.remove('active'));
      renderCockpitAccounts(elId);
    });
  }
}

// ---------- Mes objectifs (goals + projets de vie, 2 sous-listes réelles) ----------
function renderCockpitObjectifs(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <span class="panel-title">Mes objectifs</span>
    <div id="${elId}-goals" style="margin-top:10px;"></div>
    <div id="${elId}-projects" style="margin-top:16px;"></div>`;
  renderGoalsDashboardWidget(`${elId}-goals`);
  renderLifeProjectsDashboardWidget(`${elId}-projects`);
}

// ---------- Allocation globale (barres horizontales) ----------
function renderCockpitAllocation(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const segs = getWealthAllocationSegments();
  if(segs.length === 0){
    el.innerHTML = `<span class="panel-title">Allocation globale</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">Aucune donnée pour l'instant.</p>`;
    return;
  }
  const sorted = segs.slice().sort((a, b) => b.pct - a.pct);
  el.innerHTML = `
    <span class="panel-title">Allocation globale</span>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
      ${sorted.map(s => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>${s.label}</span><span class="mono">${Math.round(s.pct)} %</span></div>
          <div class="cockpit-allocation-bar"><div class="cockpit-allocation-fill" style="width:${s.pct}%;background:${s.color};"></div></div>
        </div>`).join('')}
    </div>`;
}

// ============================================================
// Modal "Projeter mon capital" (Phase 7) — <dialog> natif, aucune
// librairie : focus trap + fermeture Esc/backdrop natifs. Recalcul en
// direct via le vrai moteur computeWealthProjection (data.js, déjà utilisé
// par "Mon Futur"/Trajectoire), jamais un 2e calcul divergent. Champs
// pré-remplis avec le vrai patrimoine/solde de l'utilisateur au moment de
// l'ouverture, jamais une valeur d'exemple fabriquée.
const COCKPIT_PROJECTION_HORIZONS = [1, 5, 10, 20];
let cockpitProjectionLastFocus = null;
function computeCockpitProjectionResults(){
  const capital = +document.getElementById('cpCapital').value || 0;
  const versement = +document.getElementById('cpVersement').value || 0;
  const rendement = +document.getElementById('cpRendement').value || 0;
  const result = computeWealthProjection({patrimoineInitial: capital, epargneMensuelle: versement, rendementAnnuelPct: rendement, inflationPct: 0, augmentationAnnuellePct: 0});
  const resultsEl = document.getElementById('cpResults');
  if(!resultsEl) return;
  resultsEl.innerHTML = `
    <div class="result-row"><span class="result-horizon">Aujourd'hui</span><span class="result-value mono">${fmtEUR(capital)}</span></div>
    ${COCKPIT_PROJECTION_HORIZONS.map(h => `
      <div class="result-row"><span class="result-horizon">${h} an${h > 1 ? 's' : ''}</span><span class="result-value mono">${fmtEUR(result.atHorizon[h].patrimoineNominal)}</span></div>`).join('')}`;
}
function openCockpitProjectionModal(){
  const dialog = document.getElementById('cockpitProjectionModal');
  if(!dialog || typeof dialog.showModal !== 'function') return;
  const k = computeCockpitKPIs();
  document.getElementById('cpCapital').value = Math.round(k.patrimoineNet);
  document.getElementById('cpVersement').value = Math.round(Math.max(0, k.soldeMensuel));
  computeCockpitProjectionResults();
  cockpitProjectionLastFocus = document.activeElement;
  dialog.showModal();
}
function initCockpitProjectionModal(){
  const dialog = document.getElementById('cockpitProjectionModal');
  if(!dialog) return;
  ['cpCapital', 'cpVersement', 'cpRendement'].forEach(id => {
    const input = document.getElementById(id);
    if(input) input.addEventListener('input', computeCockpitProjectionResults);
  });
  const closeBtn = document.getElementById('cpCloseBtn');
  if(closeBtn) closeBtn.addEventListener('click', () => dialog.close());
  // Clic sur le ::backdrop natif : remonte comme un clic sur le <dialog>
  // lui-même (motif standard), jamais sur son contenu interne.
  dialog.addEventListener('click', e => { if(e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if(cockpitProjectionLastFocus && cockpitProjectionLastFocus.focus) cockpitProjectionLastFocus.focus(); });
}

// ============================================================
// Synchronisation thème clair/sombre (Phase 8) — Chart.js lit les couleurs
// une seule fois à la construction (cockpitCSSVar) : sans ce câblage, un
// changement de thème après coup laisserait les graphiques dans les
// anciennes couleurs. N'ajoute PAS de logique dans initTheme (data.js,
// partagée par tout le site) — un 2e écouteur sur le même bouton, réservé
// à cette page, reconstruit simplement les graphiques avec les nouvelles
// variables CSS. setTimeout(...,0) : le clic déclenche AUSSI le
// gestionnaire de initTheme sur le même événement — celui-ci doit avoir
// fini d'appliquer le nouvel attribut data-theme avant qu'on relise les
// couleurs, d'où le report d'un tick.
function initCockpitThemeSync(){
  const themeBtn = document.getElementById('themeToggle');
  if(!themeBtn) return;
  themeBtn.addEventListener('click', () => {
    setTimeout(() => {
      const savedView = cockpitActiveView;
      const savedFilter = cockpitAccountsFilter;
      renderCockpitChart('cockpitChart');
      setCockpitView(savedView);
      cockpitAccountsFilter = savedFilter;
      renderCockpitDonut('cockpitSide-donut');
      renderCockpitAccounts('cockpitSide-accounts');
    }, 0);
  });
}

initCockpitProjectionModal();
initCockpitThemeSync();
initParcoursHero();

// Profil de simulation (âge/épargne/horizon/risque/objectif — pré-remplit
// les outils du site) : relocalisé depuis Mon Compte (sprint de fermeture
// des écarts, 04/09/2026, phase 6). Ce sont de vraies données financières,
// leur place est ici plutôt que dans les paramètres de compte. Toujours
// visible, jamais gaté derrière le test de positionnement (comme sur son
// ancien emplacement).
renderProfileWidget('profileWidget');
