/* ============================================================
   LIKANZA ACADEMY — Laboratoire financier (laboratoire.html)
   Simulateurs adossés à des données réellement observées : marchés
   (Yahoo Finance, historique mensuel via /api/custom-quotes),
   inflation / taux de crédit / prix immobilier France (BCE SDW via
   /api/eco-rate?series=...). Voir scripts/historical-data.js pour
   les métadonnées de source et scripts/data.js pour les fonctions
   de calcul pures (computeHistoricalInvestment, computeLoanAmortization,
   computeBuyVsRent...). Règle absolue : jamais de valeur inventée —
   un échec réseau affiche "donnée indisponible", jamais un repli fabriqué.
   ============================================================ */

renderLevelTip('levelTip', 'personalFinance');

// ---------- Hub par catégories (même pattern que bourse.js/BOURSE_TABS) :
// remplace le long scroll par une navigation, sans changer la logique des
// simulateurs eux-mêmes (chaque champ/carte garde son id, seuls les <section>
// englobants sont devenus des .home-tab-panel). D'autres catégories du plan
// (Transport, Dettes & crédits, Famille & projets, Scénarios de vie...) sont
// prévues mais pas encore construites — jamais un onglet vide affiché en
// attendant, seules les catégories réellement fonctionnelles apparaissent. ----------
const LAB_TABS = [
  {id:'tab-investissement', title:'Investissement', desc:'Tester des stratégies', icon:'trending-up'},
  {id:'tab-logement', title:'Logement', desc:'Achat, location, prêt', icon:'house'},
  {id:'tab-dettes', title:'Dettes & crédits', desc:'Coût et stratégies', icon:'landmark'},
  {id:'tab-transport', title:'Transport', desc:'Achat, crédit, LOA', icon:'compass'},
  {id:'tab-budget-epargne', title:'Budget & épargne', desc:'Comprendre son argent', icon:'coins'},
  {id:'tab-planification', title:'Planification', desc:'Comparer des décisions', icon:'scale'}
];
let labActiveTab = (location.hash && document.getElementById(location.hash.slice(1))) ? location.hash.slice(1) : 'tab-investissement';
function renderLabTabs(){
  const el = document.getElementById('labTabsGrid');
  if(!el) return;
  el.innerHTML = LAB_TABS.map(t=>`
    <button class="quick-access-card ${t.id===labActiveTab?'active':''}" data-tab="${t.id}">
      <div class="icon">${ICONS[t.icon] || ''}</div>
      <h3>${t.title}</h3>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${t.desc}</p>
    </button>`).join('');
  el.querySelectorAll('.quick-access-card').forEach(btn=>{
    btn.addEventListener('click', ()=>setLabTab(btn.dataset.tab));
  });
}
function setLabTab(tabId){
  labActiveTab = tabId;
  document.querySelectorAll('#labTabsGrid .quick-access-card').forEach(c=>c.classList.toggle('active', c.dataset.tab===tabId));
  document.querySelectorAll('.home-tab-panel').forEach(p=>p.classList.toggle('active', p.id===tabId));
}
renderLabTabs();
setLabTab(labActiveTab);
window.addEventListener('hashchange', ()=>{
  const tab = location.hash.slice(1);
  const target = document.getElementById(tab);
  if(target && target.classList.contains('home-tab-panel')) setLabTab(tab);
});

// ---------- Widgets individuels à l'intérieur de chaque catégorie (2e niveau
// de la même logique de hub) : chaque simulateur est une carte cachée par
// défaut (display:none dans le HTML), révélée uniquement au clic sur sa
// vignette — jamais plusieurs formulaires empilés visibles par défaut, même
// à l'intérieur d'une seule catégorie. ----------
const LAB_WIDGETS = {
  'tab-investissement': [
    {id:'widget-invest-whatif', title:"Et si j'avais investi ?", desc:"Rejoue un support réel sur une période choisie.", icon:'trending-up'},
    {id:'widget-invest-dca', title:'DCA historique', desc:'Prix moyen réel avec un versement mensuel régulier.', icon:'banknote'},
    {id:'widget-invest-compound', title:'Intérêts composés', desc:'Un capital qui grossit avec des versements réguliers.', icon:'coins'},
    {id:'widget-invest-pru', title:"Prix moyen d'achat", desc:'Calcule ton prix moyen à partir de tes achats successifs.', icon:'calculator'}
  ],
  'tab-logement': [
    {id:'labCreditCard', title:'Coût réel de mon crédit', desc:"Tableau d'amortissement complet, taux et durée.", icon:'landmark'},
    {id:'labBuyRentCard', title:'Acheter ou louer ?', desc:'Patrimoine net comparé entre achat et location.', icon:'house'}
  ],
  'tab-dettes': [
    {id:'widget-debt-strategy', title:'Quel crédit rembourser en premier ?', desc:'Compare deux stratégies sur tes vrais crédits.', icon:'landmark'},
    {id:'widget-debt-consolidation', title:'Regrouper ou conserver ses crédits ?', desc:'Mensualité vs coût total réel du regroupement.', icon:'scale'}
  ],
  'tab-transport': [
    {id:'widget-transport-tco', title:'Coût total de possession', desc:'Achat, énergie, assurance, entretien, décote.', icon:'calculator'},
    {id:'widget-transport-financing', title:'Comptant, crédit, LOA ou LLD ?', desc:'Compare le coût total réel de financement.', icon:'scale'}
  ],
  'tab-budget-epargne': [
    {id:'widget-budget-inflation', title:'Que valent mes euros ?', desc:'Inflation réelle mesurée, pas une hypothèse constante.', icon:'trending-down'},
    {id:'widget-budget-calc', title:'Calculateur de budget', desc:"Ta capacité d'épargne mensuelle réelle.", icon:'wallet'},
    {id:'widget-budget-goal', title:"Objectif d'épargne", desc:'Combien de temps pour atteindre un montant visé.', icon:'target'},
    {id:'widget-budget-sub', title:"Coût futur d'un abonnement", desc:'Ce que représente un abonnement sur plusieurs années.', icon:'coins'}
  ]
};
function renderLabWidgetGrid(categoryId){
  const widgets = LAB_WIDGETS[categoryId];
  const el = document.getElementById(categoryId + '-widgets');
  if(!widgets || !el) return;
  el.innerHTML = widgets.map(w => `
    <button class="quick-access-card" data-widget="${w.id}">
      <div class="icon">${ICONS[w.icon] || ''}</div>
      <h3>${w.title}</h3>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${w.desc}</p>
    </button>`).join('');
  el.querySelectorAll('[data-widget]').forEach(btn=>{
    btn.addEventListener('click', ()=>openLabWidget(categoryId, btn.dataset.widget));
  });
}
function openLabWidget(categoryId, widgetId){
  const gridEl = document.getElementById(categoryId + '-widgets');
  if(gridEl) gridEl.style.display = 'none';
  (LAB_WIDGETS[categoryId] || []).forEach(w => {
    const panel = document.getElementById(w.id);
    if(panel) panel.style.display = (w.id === widgetId) ? '' : 'none';
  });
  const backBtn = document.getElementById(categoryId + '-back');
  if(backBtn) backBtn.style.display = '';
}
function closeLabWidget(categoryId){
  const gridEl = document.getElementById(categoryId + '-widgets');
  if(gridEl) gridEl.style.display = '';
  (LAB_WIDGETS[categoryId] || []).forEach(w => {
    const panel = document.getElementById(w.id);
    if(panel) panel.style.display = 'none';
  });
  const backBtn = document.getElementById(categoryId + '-back');
  if(backBtn) backBtn.style.display = 'none';
}
Object.keys(LAB_WIDGETS).forEach(categoryId => {
  renderLabWidgetGrid(categoryId);
  closeLabWidget(categoryId);
  const backBtn = document.getElementById(categoryId + '-back');
  if(backBtn) backBtn.addEventListener('click', () => closeLabWidget(categoryId));
});

const LAB_SUPPORT_LABELS = {
  URTH: 'Actions monde (MSCI World, ETF URTH)', '^GSPC': 'Actions US (S&P 500)', '^FCHI': 'Actions France (CAC 40)',
  '^STOXX50E': 'Actions Europe (Euro Stoxx 50)', QQQ: 'Actions technologie US (Nasdaq 100, ETF QQQ)',
  EEM: 'Actions émergents (MSCI Emerging Markets, ETF EEM)', 'GC=F': 'Or (cours au comptant, futures)', AGG: 'Obligations US (ETF AGG)'
};
const LAB_SUPPORT_SERIES_KEY = {
  URTH: 'urthWorld', '^GSPC': 'sp500', '^FCHI': 'cac40',
  '^STOXX50E': 'euroStoxx50', QQQ: 'nasdaq100', EEM: 'emergingMarkets', 'GC=F': 'gold', AGG: 'bondsUS'
};

// URTH et ^GSPC cotent en USD, ^FCHI en EUR — pour que "Capital initial (€)"
// et le résultat final représentent réellement les mêmes euros tout du long,
// les cours USD sont convertis avec le vrai taux de change EUR/USD mensuel
// (Yahoo Finance, EURUSD=X, même infra). Aucun taux de change inventé : un
// mois sans taux de change disponible est simplement exclu de la série.
let labFxCache = null;
async function fetchLabEurUsdRate(){
  if(labFxCache) return labFxCache;
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent('EURUSD=X') + '&range=10y&interval=1mo');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Taux de change EUR/USD indisponible');
  const map = {};
  q.history.forEach(h => { map[h.date.slice(0, 7)] = h.close; });
  labFxCache = map;
  return map;
}

async function fetchLabMonthlyHistory(symbol){
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbol) + '&range=10y&interval=1mo');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Historique indisponible');
  let points = q.history.map(h => ({period: h.date.slice(0, 7), close: h.close}));
  if(q.currency === 'USD'){
    const fx = await fetchLabEurUsdRate();
    points = points.filter(p => typeof fx[p.period] === 'number').map(p => ({period: p.period, close: p.close / fx[p.period]}));
    if(points.length < 2) throw new Error('Conversion EUR/USD insuffisante sur cette période');
  }
  return points;
}

let labInflationCache = null;
async function fetchLabInflationFR(){
  if(labInflationCache) return labInflationCache;
  const resp = await fetch('/api/eco-rate?series=inflation-fr');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  if(!Array.isArray(data.points) || data.points.length < 2) throw new Error('Série inflation indisponible');
  labInflationCache = data;
  return data;
}

// Partagé entre la carte Crédit ("Combien coûte réellement mon crédit ?") et
// la carte Acheter ou louer, qui ont toutes les deux besoin du même vrai
// taux de crédit immobilier français — un seul appel réseau, jamais deux
// appels dupliqués pour la même donnée sur la même page.
let labMortgageRateCache = null;
async function fetchLabMortgageRate(){
  if(labMortgageRateCache) return labMortgageRateCache;
  const resp = await fetch('/api/eco-rate?series=mortgage-rate-fr');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  if(!Array.isArray(data.points) || data.points.length < 1) throw new Error('Taux crédit indisponible');
  labMortgageRateCache = data;
  return data;
}

function populatePeriodSelect(selectEl, periods, defaultValue){
  selectEl.innerHTML = periods.map(p => `<option value="${p}">${p}</option>`).join('');
  if(defaultValue && periods.includes(defaultValue)) selectEl.value = defaultValue;
}

// ---------- P0-1 : "Et si j'avais investi ?" ----------
(function initLabInvest(){
  const supportEl = document.getElementById('labInvestSupport');
  const capitalEl = document.getElementById('labInvestCapital');
  const monthlyEl = document.getElementById('labInvestMonthly');
  const startEl = document.getElementById('labInvestStart');
  const endEl = document.getElementById('labInvestEnd');
  const qtyEl = document.getElementById('labInvestQty');
  const qtyNoteEl = document.getElementById('labInvestQtyNote');
  const compareLivretAEl = document.getElementById('labInvestCompareLivretA');
  const searchInputEl = document.getElementById('labInvestSearchInput');
  const searchResultsEl = document.getElementById('labInvestSearchResults');
  const followedGroupEl = document.getElementById('labInvestFollowedGroup');
  const outputEl = document.getElementById('labInvestOutput');
  const badgeEl = document.getElementById('labInvestBadge');
  const partialNoteEl = document.getElementById('labInvestPartialNote');
  if(!supportEl || !outputEl) return;

  let currentHistory = null;

  // Nom affichable pour n'importe quel support : les 8 indices/matières
  // premières curatés ont un libellé fixe (LAB_SUPPORT_LABELS) ; toute autre
  // action réelle (ajoutée via recherche) utilise son vrai nom via
  // resolveFollowedStock — jamais "undefined" affiché.
  function labSupportLabel(symbol){
    return LAB_SUPPORT_LABELS[symbol] || resolveFollowedStock(symbol).nom;
  }

  // Optgroup "Actions suivies" peuplé depuis les vraies valeurs suivies du
  // site (getFollowedStocks, partagé avec bourse.html/dividende.html) — sans
  // dupliquer les 8 indices/matières premières déjà listés séparément.
  function populateFollowedGroup(){
    if(!followedGroupEl) return;
    const previous = supportEl.value;
    followedGroupEl.innerHTML = getFollowedStocks()
      .filter(s => !LAB_SUPPORT_LABELS[s.symbol])
      .map(s => `<option value="${s.symbol}">${resolveFollowedStock(s.symbol).nom}</option>`)
      .join('');
    if(previous && Array.from(supportEl.options).some(o => o.value === previous)) supportEl.value = previous;
  }
  populateFollowedGroup();

  // Convertit une quantité d'actions saisie en capital réel, au vrai cours
  // de clôture de la date de départ choisie — jamais un prix supposé.
  function applyQtyIfSet(){
    const qty = +qtyEl.value;
    if(!qty || qty <= 0 || !currentHistory){ if(qtyNoteEl) qtyNoteEl.textContent = ''; return; }
    const startPoint = currentHistory.find(p => p.period === startEl.value);
    if(!startPoint || typeof startPoint.close !== 'number'){
      if(qtyNoteEl) qtyNoteEl.textContent = 'Cours réel indisponible pour cette date de départ.';
      return;
    }
    const capital = qty * startPoint.close;
    capitalEl.value = Math.round(capital);
    if(qtyNoteEl) qtyNoteEl.textContent = `= ${qty} action${qty > 1 ? 's' : ''} × ${startPoint.close.toFixed(2)} € (cours réel de ${startEl.value}) = ${fmtEUR(capital)}.`;
  }

  function renderOutput(){
    if(!currentHistory) return;
    const startIdx = currentHistory.findIndex(p => p.period === startEl.value);
    const endIdx = currentHistory.findIndex(p => p.period === endEl.value);
    if(startIdx === -1 || endIdx === -1 || endIdx <= startIdx){
      outputEl.innerHTML = `<p style="color:var(--bordeaux);font-size:13px;">Choisis une date de fin postérieure à la date de départ.</p>`;
      return;
    }
    const slice = currentHistory.slice(startIdx, endIdx + 1);
    const result = computeHistoricalInvestment(slice, +capitalEl.value || 0, +monthlyEl.value || 0);
    if(!result){ outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Pas assez de données sur cette période.</p>`; return; }

    // Comparaison Livret A réel (même période, même capital/versement) —
    // computeLivretASeries renvoie null si un seul mois de la période est
    // hors de la couverture réelle du tableau : jamais un chiffre inventé
    // pour combler, l'onglet affiche alors une note honnête à la place.
    const livretA = compareLivretAEl.checked
      ? computeLivretASeries(slice.map(p => p.period), +capitalEl.value || 0, +monthlyEl.value || 0)
      : null;

    const level = getLevel();
    const chartSeries = [
      {data: result.investedSeries, color: 'var(--text-dim)', dashed: true, width: 1.5},
      {data: result.valueSeries, color: 'var(--gold-bright)', width: 2.5}
    ];
    if(livretA) chartSeries.push({data: livretA.valueSeries, color: 'var(--emerald)', dashed: true, width: 2});
    const chart = renderMultiLineChart(chartSeries);
    const mainFactor = result.years >= 10 ? `la durée (${result.years.toFixed(1)} ans d'exposition réelle au marché)` : 'la période choisie (les rendements réels varient beaucoup d\'une période à l\'autre)';

    let statsHtml = `
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-top:14px;">
        <div class="card"><span class="smallcaps">Total investi</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(result.totalInvested)}</div></div>
        <div class="card"><span class="smallcaps">Valeur finale</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(result.finalValue)}</div></div>
        <div class="card"><span class="smallcaps">Gain / perte</span><div class="result-big" style="font-size:20px;margin-top:6px;color:${result.totalGain>=0?'var(--emerald)':'var(--bordeaux)'};">${result.totalGain>=0?'+':''}${fmtEUR(result.totalGain)}</div></div>
        <div class="card"><span class="smallcaps">CAGR (rendement annualisé réel)</span><div class="result-big" style="font-size:20px;margin-top:6px;">${result.cagr>=0?'+':''}${result.cagr.toFixed(1)} %</div></div>`;
    if(level !== 'debutant'){
      statsHtml += `
        <div class="card"><span class="smallcaps">Meilleure année</span><div class="result-big" style="font-size:20px;margin-top:6px;color:var(--emerald);">${result.bestYear ? `+${result.bestYear.returnPct.toFixed(1)} % (${result.bestYear.year})` : '—'}</div></div>
        <div class="card"><span class="smallcaps">Pire année</span><div class="result-big" style="font-size:20px;margin-top:6px;color:var(--bordeaux);">${result.worstYear ? `${result.worstYear.returnPct.toFixed(1)} % (${result.worstYear.year})` : '—'}</div></div>
        <div class="card"><span class="smallcaps">Années négatives</span><div class="result-big" style="font-size:20px;margin-top:6px;">${result.negativeYears} / ${result.yearlyReturns.length}</div></div>
        <div class="card"><span class="smallcaps">Drawdown maximal</span><div class="result-big" style="font-size:20px;margin-top:6px;color:var(--bordeaux);">-${result.maxDrawdownPct.toFixed(1)} %</div></div>`;
    }
    if(level === 'avance' || level === 'expert'){
      statsHtml += `<div class="card"><span class="smallcaps">Temps de récupération du pire drawdown</span><div class="result-big" style="font-size:20px;margin-top:6px;">${result.recoveryMonths !== null ? result.recoveryMonths + ' mois' : 'Pas encore récupéré'}</div></div>`;
    }
    statsHtml += `</div>`;

    const legendItems = [
      `<span><span style="display:inline-block;width:10px;height:2px;background:var(--text-dim);margin-right:6px;vertical-align:middle;"></span>Versé</span>`,
      `<span><span style="display:inline-block;width:10px;height:10px;background:var(--gold-bright);border-radius:50%;margin-right:6px;"></span>Valeur (${labSupportLabel(supportEl.value)})</span>`
    ];
    let livretAHtml = '';
    if(compareLivretAEl.checked){
      if(livretA){
        legendItems.push(`<span><span style="display:inline-block;width:10px;height:2px;background:var(--emerald);margin-right:6px;vertical-align:middle;"></span>Livret A réel</span>`);
        const delta = result.finalValue - livretA.finalValue;
        livretAHtml = `<p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">${renderDataBadge('fait')} Sur la même période, avec les mêmes versements, un Livret A (taux réel en vigueur à chaque mois, capitalisation mensuelle simplifiée) aurait donné <strong style="color:var(--text);">${fmtEUR(livretA.finalValue)}</strong> — soit ${delta >= 0 ? '+' : ''}${fmtEUR(delta)} ${delta >= 0 ? 'de plus' : 'de moins'} avec ${labSupportLabel(supportEl.value)} sur cette période précise.</p>`;
      } else {
        livretAHtml = `<p style="font-size:12px;color:var(--text-dim);margin-top:10px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (comparaison Livret A : période antérieure à 2010, hors de la couverture réelle disponible).</p>`;
      }
    }

    outputEl.innerHTML = `
      <div class="pattern-chart" style="margin-top:12px;">${chart}</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;font-size:12px;color:var(--text-dim);">
        ${legendItems.join('')}
      </div>
      ${statsHtml}
      ${livretAHtml}
      <div id="labInvestExplainer" style="margin-top:14px;"></div>
      <p class="disclaimer-box" style="margin-top:12px;">Simulation strictement rétrospective sur des cours réels passés. Les performances passées ne préjugent jamais des performances futures. Le Livret A affiché capitalise mensuellement le taux réel en vigueur (simplification par rapport à la règle bancaire des quinzaines).</p>
    `;
    renderResultExplainer('labInvestExplainer', {invested: result.totalInvested, final: result.finalValue, mainFactorLabel: mainFactor});
  }

  async function loadHistory(){
    outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des données réelles…</p>`;
    badgeEl.innerHTML = '';
    try {
      currentHistory = await fetchLabMonthlyHistory(supportEl.value);
      const periods = currentHistory.map(p => p.period);
      populatePeriodSelect(startEl, periods, periods[0]);
      populatePeriodSelect(endEl, periods, periods[periods.length - 1]);
      badgeEl.innerHTML = renderDataBadge('fait');
      const lastPeriod = periods[periods.length - 1];
      // Source citée : le libellé dédié pour les 8 supports curatés, sinon
      // une citation générique Yahoo Finance — jamais un plantage pour une
      // action réelle ajoutée par recherche (LAB_SUPPORT_SERIES_KEY ne
      // couvre que les 8 supports d'origine).
      const seriesKey = LAB_SUPPORT_SERIES_KEY[supportEl.value];
      const sourceLabel = seriesKey ? HISTORICAL_SERIES[seriesKey].source : 'Yahoo Finance';
      partialNoteEl.textContent = formatPartialYearNote(lastPeriod) + ` Source : ${sourceLabel}.`;
      applyQtyIfSet();
      renderOutput();
    } catch(err){
      outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Donnée manquante : historique temporairement indisponible (${err.message}).</p>`;
      console.info('Likanza Academy — Laboratoire, historique investissement indisponible :', err.message);
    }
  }

  supportEl.addEventListener('change', loadHistory);
  [capitalEl, monthlyEl, endEl, compareLivretAEl].forEach(el => el.addEventListener('change', () => { renderOutput(); tryAwardQuizPoints(`lab-invest-${new Date().toDateString()}`, 8, {usedLab:true}); }));
  startEl.addEventListener('change', () => { applyQtyIfSet(); renderOutput(); tryAwardQuizPoints(`lab-invest-${new Date().toDateString()}`, 8, {usedLab:true}); });
  qtyEl.addEventListener('input', () => { applyQtyIfSet(); renderOutput(); });
  if(searchInputEl && searchResultsEl){
    wireStockSearch(searchInputEl, searchResultsEl, (symbol) => {
      populateFollowedGroup();
      supportEl.value = symbol;
      loadHistory();
    });
  }
  loadHistory();
})();

// ---------- P0-2 : DCA historique ----------
(function initLabDca(){
  const supportEl = document.getElementById('labDcaSupport');
  const monthlyEl = document.getElementById('labDcaMonthly');
  const startEl = document.getElementById('labDcaStart');
  const outputEl = document.getElementById('labDcaOutput');
  const badgeEl = document.getElementById('labDcaBadge');
  if(!supportEl || !outputEl) return;

  let currentHistory = null;

  function renderOutput(){
    if(!currentHistory) return;
    const startIdx = currentHistory.findIndex(p => p.period === startEl.value);
    if(startIdx === -1) return;
    const slice = currentHistory.slice(startIdx);
    const result = computeHistoricalInvestment(slice, 0, +monthlyEl.value || 0);
    if(!result){ outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Pas assez de données sur cette période.</p>`; return; }

    const chart = renderMultiLineChart([
      {data: result.investedSeries, color: 'var(--text-dim)', dashed: true, width: 1.5},
      {data: result.valueSeries, color: 'var(--gold-bright)', width: 2.5}
    ]);

    outputEl.innerHTML = `
      <div class="pattern-chart" style="margin-top:12px;">${chart}</div>
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-top:10px;">
        <div class="card"><span class="smallcaps">Total versé</span><div class="result-big" style="font-size:19px;margin-top:6px;">${fmtEUR(result.totalInvested)}</div></div>
        <div class="card"><span class="smallcaps">Valeur finale</span><div class="result-big" style="font-size:19px;margin-top:6px;">${fmtEUR(result.finalValue)}</div></div>
        <div class="card"><span class="smallcaps">Prix moyen d'achat réel</span><div class="result-big" style="font-size:19px;margin-top:6px;">${result.avgPurchasePrice.toFixed(2)} €</div></div>
        <div class="card"><span class="smallcaps">Achats pendant une baisse</span><div class="result-big" style="font-size:19px;margin-top:6px;">${result.buysDuringDip}</div></div>
      </div>
      <p class="disclaimer-box" style="margin-top:12px;">Le DCA (achat régulier) ne garantit pas un meilleur résultat qu'un versement unique — il lisse le prix d'entrée. Voir le comparateur DCA vs investissement immédiat (phase à venir).</p>`;
  }

  async function loadHistory(){
    outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des données réelles…</p>`;
    badgeEl.innerHTML = '';
    try {
      currentHistory = await fetchLabMonthlyHistory(supportEl.value);
      const periods = currentHistory.map(p => p.period);
      populatePeriodSelect(startEl, periods, periods[0]);
      badgeEl.innerHTML = renderDataBadge('fait');
      renderOutput();
    } catch(err){
      outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Donnée manquante : historique temporairement indisponible (${err.message}).</p>`;
      console.info('Likanza Academy — Laboratoire, historique DCA indisponible :', err.message);
    }
  }

  supportEl.addEventListener('change', loadHistory);
  [monthlyEl, startEl].forEach(el => el.addEventListener('change', renderOutput));
  loadHistory();
})();

// ---------- P0-3 : Crédit immobilier complet ----------
(function initLabCredit(){
  const priceEl = document.getElementById('labCreditPrice');
  const apportEl = document.getElementById('labCreditApport');
  const rateEl = document.getElementById('labCreditRate');
  const yearsEl = document.getElementById('labCreditYears');
  const insuranceEl = document.getElementById('labCreditInsurance');
  const fraisEl = document.getElementById('labCreditFrais');
  const outputEl = document.getElementById('labCreditOutput');
  const rateSourceEl = document.getElementById('labCreditRateSource');
  const badgeEl = document.getElementById('labCreditBadge');
  if(!priceEl || !outputEl) return;

  function render(){
    const capital = Math.max(0, (+priceEl.value || 0) - (+apportEl.value || 0));
    const loan = computeLoanAmortization(capital, +rateEl.value || 0, +yearsEl.value || 1, +insuranceEl.value || 0, +fraisEl.value || 0);

    const durations = [15, 20, 25].map(y => ({years: y, r: computeLoanAmortization(capital, +rateEl.value || 0, y, +insuranceEl.value || 0, +fraisEl.value || 0)}));
    const rates = [2, 3, 4, 5].map(r => ({rate: r, r2: computeLoanAmortization(capital, r, +yearsEl.value || 1, +insuranceEl.value || 0, +fraisEl.value || 0)}));

    outputEl.innerHTML = `
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-top:14px;">
        <div class="card"><span class="smallcaps">Mensualité (avec assurance)</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(loan.monthlyPaymentWithInsurance)}</div></div>
        <div class="card"><span class="smallcaps">Total emprunté</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(capital)}</div></div>
        <div class="card"><span class="smallcaps">Intérêts payés</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(loan.totalInterest)}</div></div>
        <div class="card"><span class="smallcaps">Coût total du financement</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(loan.totalCost)}</div></div>
      </div>
      <div style="margin-top:18px;overflow-x:auto;">
        <span class="smallcaps">15 ans vs 20 ans vs 25 ans (même taux)</span>
        <table style="width:100%;font-size:12.5px;border-collapse:collapse;margin-top:8px;min-width:420px;">
          <thead><tr style="color:var(--text-dim);text-align:left;"><th style="padding:6px 0;">Durée</th><th>Mensualité</th><th>Intérêts totaux</th><th>Coût total</th></tr></thead>
          <tbody>${durations.map(d => `<tr style="border-top:1px solid var(--hairline);"><td style="padding:6px 0;">${d.years} ans</td><td class="mono">${fmtEUR(d.r.monthlyPaymentWithInsurance)}</td><td class="mono">${fmtEUR(d.r.totalInterest)}</td><td class="mono">${fmtEUR(d.r.totalCost)}</td></tr>`).join('')}</tbody>
        </table>
        <p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">Une mensualité plus faible ne signifie pas forcément un crédit moins cher : une durée plus longue augmente le total des intérêts payés.</p>
      </div>
      <div style="margin-top:18px;overflow-x:auto;">
        <span class="smallcaps">Impact du taux (même durée) — pourquoi 1 point change autant</span>
        <table style="width:100%;font-size:12.5px;border-collapse:collapse;margin-top:8px;min-width:420px;">
          <thead><tr style="color:var(--text-dim);text-align:left;"><th style="padding:6px 0;">Taux</th><th>Mensualité</th><th>Intérêts totaux</th></tr></thead>
          <tbody>${rates.map(r => `<tr style="border-top:1px solid var(--hairline);"><td style="padding:6px 0;">${r.rate.toFixed(1)} %</td><td class="mono">${fmtEUR(r.r2.monthlyPaymentWithInsurance)}</td><td class="mono">${fmtEUR(r.r2.totalInterest)}</td></tr>`).join('')}</tbody>
        </table>
        <p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">Le taux s'applique chaque année sur tout le capital restant dû, pas seulement au départ : sur 20-25 ans, un écart d'1 point se cumule fortement.</p>
      </div>
      <p class="disclaimer-box" style="margin-top:14px;">Simulation pédagogique, pas une offre de prêt. Le taux réellement proposé dépend du profil emprunteur, de l'apport et de la banque.</p>`;
  }

  async function loadLiveRate(){
    badgeEl.innerHTML = '';
    try {
      const data = await fetchLabMortgageRate();
      const last = data.points[data.points.length - 1];
      rateEl.value = last.value.toFixed(2);
      badgeEl.innerHTML = renderDataBadge('fait');
      rateSourceEl.innerHTML = `Taux prérempli avec le taux moyen réel des nouveaux crédits à l'habitat des ménages en France, ${last.period} (${data.source}). ${formatPartialYearNote(last.period)} Modifie-le librement pour tester une autre hypothèse.`;
    } catch(err){
      badgeEl.innerHTML = renderDataBadge('calcul');
      rateSourceEl.innerHTML = `⚠️ Donnée manquante : taux réel temporairement indisponible, valeur de départ laissée en hypothèse éditable.`;
      console.info('Likanza Academy — Laboratoire, taux crédit indisponible :', err.message);
    }
    render();
  }

  [priceEl, apportEl, rateEl, yearsEl, insuranceEl, fraisEl].forEach(el => el.addEventListener('input', () => {
    render();
    badgeEl.innerHTML = renderDataBadge('calcul');
  }));
  loadLiveRate();
})();

// ---------- P0-4 : Que valent réellement mes euros ? (inflation réelle) ----------
(function initLabInflation(){
  const amountEl = document.getElementById('labInflAmount');
  const startEl = document.getElementById('labInflStart');
  const endEl = document.getElementById('labInflEnd');
  const outputEl = document.getElementById('labInflationOutput');
  const badgeEl = document.getElementById('labInflationBadge');
  if(!amountEl || !outputEl) return;

  let points = null;

  function render(){
    if(!points) return;
    const startPoint = points.find(p => p.period === startEl.value);
    const endPoint = points.find(p => p.period === endEl.value);
    if(!startPoint || !endPoint){ outputEl.innerHTML = `<p style="color:var(--bordeaux);font-size:13px;">Sélectionne deux périodes valides.</p>`; return; }
    const amount = +amountEl.value || 0;
    const equivalent = amount * (endPoint.value / startPoint.value);
    const totalInflationPct = (endPoint.value / startPoint.value - 1) * 100;
    const years = (parseInt(endEl.value.slice(0,4),10)*12 + parseInt(endEl.value.slice(5,7),10)) - (parseInt(startEl.value.slice(0,4),10)*12 + parseInt(startEl.value.slice(5,7),10));
    const annualizedPct = years > 0 ? (Math.pow(endPoint.value / startPoint.value, 12/years) - 1) * 100 : 0;

    const chartSeries = points.filter(p => p.period >= startEl.value && p.period <= endEl.value).map(p => amount * (p.value / startPoint.value));
    const chart = renderMultiLineChart([{data: chartSeries, color: 'var(--gold-bright)', width: 2.5}]);

    outputEl.innerHTML = `
      <div class="pattern-chart" style="margin-top:12px;">${chart}</div>
      <div class="result-label" style="margin-top:10px;">Pouvoir d'achat équivalent</div>
      <div class="result-big">${fmtEUR(amount)} de ${startEl.value} ≈ <strong>${fmtEUR(equivalent)}</strong> en ${endEl.value}</div>
      <div class="result-row" style="margin-top:10px;"><span>Inflation cumulée : ${totalInflationPct >= 0 ? '+' : ''}${totalInflationPct.toFixed(1)} %</span><span>Inflation annualisée : ${annualizedPct >= 0 ? '+' : ''}${annualizedPct.toFixed(1)} % / an</span></div>
      ${renderSourceNote('inflationFR', {period: `${startEl.value} → ${endEl.value}`})}
      <p class="disclaimer-box" style="margin-top:10px;">Calculé à partir de l'indice réel des prix à la consommation (IPCH France, BCE) — jamais une inflation constante supposée.</p>`;
  }

  async function load(){
    outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des données réelles…</p>`;
    badgeEl.innerHTML = '';
    try {
      const data = await fetchLabInflationFR();
      points = data.points;
      const periods = points.map(p => p.period);
      populatePeriodSelect(startEl, periods, periods[0]);
      populatePeriodSelect(endEl, periods, periods[periods.length - 1]);
      badgeEl.innerHTML = renderDataBadge('fait');
      render();

      // Remplace la constante figée (repli honnête, jamais présentée comme
      // un fait) par le vrai taux d'inflation glissant sur 12 mois, calculé
      // sur cette même série réelle qu'on vient de charger — puis ré-exécute
      // les widgets déjà rendus une première fois avec le repli, pour qu'ils
      // reflètent immédiatement la vraie donnée sans action de l'utilisateur.
      const realRate = computeRealInflationRate(points);
      if(typeof realRate === 'number'){
        DEFAULT_INFLATION_ASSUMPTION = Math.round(realRate * 10) / 10;
        if(typeof updateInflation === 'function') updateInflation();
        if(typeof updateSim === 'function') updateSim();
      }
    } catch(err){
      outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Donnée manquante : série d'inflation temporairement indisponible (${err.message}).</p>`;
      console.info('Likanza Academy — Laboratoire, inflation indisponible :', err.message);
    }
  }

  [amountEl, startEl, endEl].forEach(el => el.addEventListener('change', render));
  load();
})();

// ---------- Dettes & crédits : listes dynamiques de crédits réutilisables
// entre les deux widgets (stratégie de remboursement / regroupement) — même
// pattern que addDcaRow/updateDca (prix moyen d'achat) ci-dessus, avec un
// bouton de suppression par ligne. Les calculs eux-mêmes (computeDebtPayoffPlan,
// renderDebtPayoffComparison, computeDebtConsolidation,
// renderDebtConsolidationComparison) vivent dans scripts/data.js. ----------
(function initLabDebts(){
  function createDebtRowList(containerId, onChange){
    function addRow(label, balance, rate, minPayment){
      const row = document.createElement('div');
      row.className = 'field';
      row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px;';
      row.innerHTML = `
        <input type="text" class="debt-label" placeholder="Nom du crédit" value="${label || ''}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:2;min-width:120px;">
        <input type="number" class="debt-balance" placeholder="Solde (€)" value="${typeof balance === 'number' ? balance : 1000}" min="0" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:1;min-width:90px;">
        <input type="number" class="debt-rate" placeholder="Taux (%)" value="${typeof rate === 'number' ? rate : 5}" min="0" max="30" step="0.1" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:1;min-width:80px;">
        <input type="number" class="debt-min" placeholder="Mensualité min. (€)" value="${typeof minPayment === 'number' ? minPayment : 100}" min="0" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:1;min-width:90px;">
        <button type="button" class="btn btn-sm debt-remove" style="flex:0;" aria-label="Retirer ce crédit">✕</button>`;
      document.getElementById(containerId).appendChild(row);
      row.querySelectorAll('input').forEach(i => i.addEventListener('input', onChange));
      row.querySelectorAll('.debt-remove').forEach(btn => btn.addEventListener('click', () => { row.remove(); onChange(); }));
    }
    function readRows(){
      return Array.from(document.querySelectorAll(`#${containerId} > div`)).map(row => ({
        label: row.querySelector('.debt-label').value || 'Crédit',
        balance: +row.querySelector('.debt-balance').value || 0,
        rate: +row.querySelector('.debt-rate').value || 0,
        minPayment: +row.querySelector('.debt-min').value || 0
      }));
    }
    return {addRow, readRows};
  }

  const strategyRowsEl = document.getElementById('debtRows');
  const consoRowsEl = document.getElementById('debtConsoRows');
  if(!strategyRowsEl || !consoRowsEl) return;

  const strategyRows = createDebtRowList('debtRows', () => updateDebtStrategy());
  function updateDebtStrategy(){
    const extra = +document.getElementById('debtExtra').value || 0;
    document.getElementById('debtStrategyOutput').innerHTML = renderDebtPayoffComparison(strategyRows.readRows(), extra);
  }
  document.getElementById('debtAdd').addEventListener('click', () => { strategyRows.addRow(); updateDebtStrategy(); });
  document.getElementById('debtExtra').addEventListener('input', updateDebtStrategy);
  strategyRows.addRow('Carte de crédit', 2000, 19, 80);
  strategyRows.addRow('Prêt personnel', 6000, 5, 150);
  updateDebtStrategy();

  const consoRows = createDebtRowList('debtConsoRows', () => updateDebtConsolidation());
  function updateDebtConsolidation(){
    const newLoan = {
      amount: +document.getElementById('consoAmount').value || 0,
      rate: +document.getElementById('consoRate').value || 0,
      years: +document.getElementById('consoYears').value || 0,
      fees: +document.getElementById('consoFrais').value || 0
    };
    document.getElementById('debtConsolidationOutput').innerHTML = renderDebtConsolidationComparison(consoRows.readRows(), newLoan);
  }
  document.getElementById('debtConsoAdd').addEventListener('click', () => { consoRows.addRow(); updateDebtConsolidation(); });
  ['consoAmount', 'consoRate', 'consoYears', 'consoFrais'].forEach(id => document.getElementById(id).addEventListener('input', updateDebtConsolidation));
  consoRows.addRow('Carte de crédit', 2000, 19, 80);
  consoRows.addRow('Prêt personnel', 6000, 5, 150);
  updateDebtConsolidation();
})();

// ---------- Transport : coût total de possession + comparaison de
// financement. La logique de calcul (computeVehicleTCO, renderVehicleTCOResult,
// computeVehicleFinancingComparison, renderVehicleFinancingComparison) vit
// dans scripts/data.js — même formulaire pour un véhicule essence, hybride ou
// électrique, seule la consommation/le prix de l'énergie changent. ----------
(function initLabTransport(){
  const tcoOutputEl = document.getElementById('tcoOutput');
  if(!tcoOutputEl) return;

  const tcoFinancingEl = document.getElementById('tcoFinancing');
  const tcoCreditFieldsEl = document.getElementById('tcoCreditFields');
  function updateTCO(){
    const financing = tcoFinancingEl.value;
    tcoCreditFieldsEl.style.display = financing === 'credit' ? '' : 'none';
    const result = computeVehicleTCO({
      price: +document.getElementById('tcoPrice').value || 0,
      financing,
      downPayment: +document.getElementById('tcoDownPayment').value || 0,
      creditRate: +document.getElementById('tcoCreditRate').value || 0,
      possessionYears: +document.getElementById('tcoYears').value || 0,
      consumptionPer100: +document.getElementById('tcoConsumption').value || 0,
      fuelPricePerUnit: +document.getElementById('tcoFuelPrice').value || 0,
      kmPerYear: +document.getElementById('tcoKm').value || 0,
      insuranceAnnual: +document.getElementById('tcoInsurance').value || 0,
      maintenanceAnnual: +document.getElementById('tcoMaintenance').value || 0,
      depreciationRatePct: +document.getElementById('tcoDepreciation').value || 0
    });
    tcoOutputEl.innerHTML = renderVehicleTCOResult(result);
  }
  ['tcoPrice','tcoFinancing','tcoYears','tcoDownPayment','tcoCreditRate','tcoConsumption','tcoFuelPrice','tcoKm','tcoInsurance','tcoMaintenance','tcoDepreciation'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateTCO);
  });
  updateTCO();

  const finOutputEl = document.getElementById('finOutput');
  function updateFinancing(){
    const loaOptionVal = document.getElementById('finLoaOption').value;
    const creditRateVal = document.getElementById('finCreditRate').value;
    const loaMonthlyVal = document.getElementById('finLoaMonthly').value;
    const lldMonthlyVal = document.getElementById('finLldMonthly').value;
    const result = computeVehicleFinancingComparison({
      price: +document.getElementById('finPrice').value || 0,
      years: +document.getElementById('finYears').value || 0,
      cashOpportunityRatePct: +document.getElementById('finOpportunity').value || 0,
      creditRate: creditRateVal ? +creditRateVal : null,
      loaMonthly: loaMonthlyVal ? +loaMonthlyVal : null,
      loaFinalOption: loaOptionVal ? +loaOptionVal : null,
      lldMonthly: lldMonthlyVal ? +lldMonthlyVal : null
    });
    finOutputEl.innerHTML = renderVehicleFinancingComparison(result);
  }
  ['finPrice','finYears','finOpportunity','finCreditRate','finLoaMonthly','finLoaOption','finLldMonthly'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateFinancing);
  });
  updateFinancing();
})();

// ---------- P0-5 : Acheter ou louer, version sérieuse ----------
(function initLabBuyRent(){
  const ids = ['labBrPrice','labBrApport','labBrRate','labBrYears','labBrInsurance','labBrFraisDossier','labBrFraisGarantie','labBrFraisNotaire','labBrCharges','labBrTaxe','labBrEntretien','labBrTravaux','labBrLoyer','labBrChargesLoc','labBrLoyerHausse','labBrOpportunity'];
  const els = {};
  ids.forEach(id => { els[id] = document.getElementById(id); });
  const scenarioEl = document.getElementById('labBrScenario');
  const outputEl = document.getElementById('labBuyRentOutput');
  const badgeEl = document.getElementById('labBuyRentBadge');
  const priceSourceEl = document.getElementById('labBuyRentPriceSource');
  if(!els.labBrPrice || !outputEl) return;

  let appreciationAnnualPct = null; // rempli par la vraie série RESR si disponible

  function currentInputs(){
    const scenario = scenarioEl.value;
    let rateAdj = 0, appreciationOverride = null, travauxOverride = null;
    if(scenario === 'choc-taux') rateAdj = 1;
    if(scenario === 'prix-10') appreciationOverride = -10 / Math.max(1, +els.labBrYears.value || 1);
    if(scenario === 'travaux') travauxOverride = (+els.labBrTravaux.value || 0) + 8000;
    return {
      price: +els.labBrPrice.value || 0,
      downPayment: +els.labBrApport.value || 0,
      rateAnnual: (+els.labBrRate.value || 0) + rateAdj,
      years: +els.labBrYears.value || 1,
      insuranceRatePct: +els.labBrInsurance.value || 0,
      fraisDossier: +els.labBrFraisDossier.value || 0,
      fraisGarantie: +els.labBrFraisGarantie.value || 0,
      fraisNotairePct: +els.labBrFraisNotaire.value || 0,
      chargesCoproAnnual: +els.labBrCharges.value || 0,
      taxeFonciereAnnual: +els.labBrTaxe.value || 0,
      entretienAnnualPct: +els.labBrEntretien.value || 0,
      travauxOneOff: travauxOverride !== null ? travauxOverride : (+els.labBrTravaux.value || 0),
      loyerMensuelInitial: +els.labBrLoyer.value || 0,
      chargesLocatairesMensuel: +els.labBrChargesLoc.value || 0,
      loyerHausseAnnuelPct: +els.labBrLoyerHausse.value || 0,
      appreciationAnnualPct: appreciationOverride !== null ? appreciationOverride : (appreciationAnnualPct !== null ? appreciationAnnualPct : 0),
      opportunityRatePct: +els.labBrOpportunity.value || 0,
      horizonsYears: [5, 10, 15, 20, 25].filter(h => h <= (+els.labBrYears.value || 25))
    };
  }

  function render(){
    const inputs = currentInputs();
    if(inputs.horizonsYears.length === 0) inputs.horizonsYears = [Math.max(1, inputs.years)];
    const result = computeBuyVsRent(inputs);

    const chart = renderMultiLineChart([
      {data: result.yearly.map(y => y.ownerNetWorth), color: 'var(--gold-bright)', width: 2.5},
      {data: result.yearly.map(y => y.renterNetWorth), color: 'var(--text-dim)', dashed: true, width: 1.5}
    ]);

    const scenarioBadge = scenarioEl.value === 'standard' ? '' : `<span class="data-badge data-badge-scenario">🔮 Scénario : ${scenarioEl.options[scenarioEl.selectedIndex].text}</span>`;

    outputEl.innerHTML = `
      <div class="pattern-chart" style="margin-top:12px;">${chart}</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;font-size:12px;color:var(--text-dim);">
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--gold-bright);border-radius:50%;margin-right:6px;"></span>Patrimoine net propriétaire</span>
        <span><span style="display:inline-block;width:10px;height:2px;background:var(--text-dim);margin-right:6px;vertical-align:middle;"></span>Patrimoine net locataire (apport + différence investis)</span>
      </div>
      ${scenarioBadge}
      <div style="margin-top:12px;overflow-x:auto;">
        <table style="width:100%;font-size:12.5px;border-collapse:collapse;min-width:420px;">
          <thead><tr style="color:var(--text-dim);text-align:left;"><th style="padding:6px 0;">Horizon</th><th>Propriétaire</th><th>Locataire + investisseur</th><th>Écart</th></tr></thead>
          <tbody>${result.table.map(y => `<tr style="border-top:1px solid var(--hairline);"><td style="padding:6px 0;">${y.year} ans</td><td class="mono">${fmtEUR(y.ownerNetWorth)}</td><td class="mono">${fmtEUR(y.renterNetWorth)}</td><td class="mono" style="color:${y.ownerNetWorth>=y.renterNetWorth?'var(--emerald)':'var(--bordeaux)'};">${y.ownerNetWorth>=y.renterNetWorth?'+':''}${fmtEUR(y.ownerNetWorth-y.renterNetWorth)}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <p style="margin-top:12px;font-size:13.5px;">${result.breakevenYear ? `Dans ces hypothèses, le patrimoine net du propriétaire dépasse celui du locataire à partir d'environ <strong>${result.breakevenYear} ans</strong>.` : `Dans ces hypothèses, le patrimoine net du locataire reste supérieur sur toute la période testée.`}</p>
      <p class="disclaimer-box" style="margin-top:8px;">Ceci n'est pas une recommandation d'achat ou de location. Le résultat dépend entièrement des hypothèses saisies ci-dessus (taux, appréciation, rendement d'opportunité) : en modifier une peut changer la conclusion.</p>`;
  }

  async function loadAppreciation(){
    badgeEl.innerHTML = '';
    let priceNote, priceOk = false;
    try {
      const data = await fetch('/api/eco-rate?series=home-price-fr').then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      const first = data.points[0], last = data.points[data.points.length - 1];
      const yearsSpan = (parseInt(last.period.slice(0,4),10) - parseInt(first.period.slice(0,4),10)) + (parseInt(last.period.slice(6),10) - parseInt(first.period.slice(6),10)) / 4;
      appreciationAnnualPct = yearsSpan > 0 ? (Math.pow(last.value / first.value, 1 / yearsSpan) - 1) * 100 : 0;
      priceNote = `Appréciation immobilière préremplie avec l'évolution réelle observée (${first.period} → ${last.period}, France entière) : ${appreciationAnnualPct >= 0 ? '+' : ''}${appreciationAnnualPct.toFixed(1)} %/an en moyenne. ${data.source}. Niveau géographique : France entière (pas de donnée locale/ville disponible pour l'instant).`;
      priceOk = true;
    } catch(err){
      appreciationAnnualPct = 0;
      priceNote = `⚠️ Donnée manquante : indice immobilier réel temporairement indisponible, appréciation laissée à 0% (hypothèse neutre, modifiable).`;
      console.info('Likanza Academy — Laboratoire, indice immobilier indisponible :', err.message);
    }

    // Même vrai taux crédit que la carte "Combien coûte réellement mon
    // crédit ?" juste au-dessus (fetchLabMortgageRate, mise en cache
    // partagée) — auparavant laissé sur un défaut statique (3.2) jamais
    // rafraîchi, incohérent avec la carte voisine.
    let rateNote, rateOk = false;
    try {
      const data = await fetchLabMortgageRate();
      const last = data.points[data.points.length - 1];
      els.labBrRate.value = last.value.toFixed(2);
      rateNote = `Taux crédit préempli avec le taux moyen réel des nouveaux crédits à l'habitat des ménages en France, ${last.period} (${data.source}).`;
      rateOk = true;
    } catch(err){
      rateNote = `⚠️ Taux crédit réel temporairement indisponible, valeur de départ laissée en hypothèse éditable.`;
      console.info('Likanza Academy — Laboratoire, taux crédit (Acheter ou louer) indisponible :', err.message);
    }

    // "Fait" seulement si les DEUX données réelles ont bien été chargées —
    // sinon "calcul" (au moins une hypothèse de repli reste dans le calcul),
    // jamais un badge qui prétendrait tout être réel alors que ce n'est
    // qu'en partie le cas.
    badgeEl.innerHTML = renderDataBadge(priceOk && rateOk ? 'fait' : 'calcul');
    priceSourceEl.innerHTML = `${priceNote} ${rateNote} Modifie librement l'un ou l'autre pour tester une autre hypothèse.`;
    render();
  }

  ids.forEach(id => els[id].addEventListener('input', render));
  scenarioEl.addEventListener('change', render);
  loadAppreciation();
})();

// ---------- Widgets existants (portés depuis l'ancien outils.html, logique inchangée) ----------

// Budget
['budgetRevenu','budgetLoyer','budgetFixe','budgetVariable'].forEach(id=>document.getElementById(id).addEventListener('input', updateBudget));
function updateBudget(){
  const revenu = +document.getElementById('budgetRevenu').value;
  const total = ['budgetLoyer','budgetFixe','budgetVariable'].reduce((s,id)=>s+ +document.getElementById(id).value, 0);
  const solde = revenu - total;
  const el = document.getElementById('budgetResult');
  el.textContent = fmtEUR(solde);
  el.style.color = solde >= 0 ? 'var(--emerald)' : 'var(--bordeaux)';
}
updateBudget();

// Objectif épargne
['goalAmount','goalMonthly'].forEach(id=>document.getElementById(id).addEventListener('input', updateGoal));
function updateGoal(){
  const amount = +document.getElementById('goalAmount').value;
  const monthly = +document.getElementById('goalMonthly').value;
  const el = document.getElementById('goalResult');
  if(monthly <= 0){ el.textContent = '—'; return; }
  const months = Math.ceil(amount/monthly);
  const years = Math.floor(months/12), rem = months%12;
  el.textContent = years > 0 ? `${years} an(s) et ${rem} mois` : `${months} mois`;
}
updateGoal();

// Coût futur d'un abonnement
const subCost = document.getElementById('subCost'), subYears = document.getElementById('subYears'), subRate = document.getElementById('subRate');
// Même seuil que le scénario "Optimiste" des intérêts composés (RETURN_ASSUMPTIONS,
// scripts/data.js) : au-delà, ce n'est plus une hypothèse par défaut raisonnable
// mais un scénario favorable qu'il ne faut jamais présenter comme acquis.
function updateSubAlert(){
  const alertEl = document.getElementById('subRateAlert');
  const rate = +subRate.value;
  alertEl.innerHTML = rate > RETURN_ASSUMPTIONS.optimiste.rate
    ? `<p class="disclaimer-box" style="margin-top:8px;">${rate}% par an suppose un rendement proche des meilleures décennies boursières historiques (voir le simulateur d'intérêts composés) — un placement réel n'offre jamais ce rendement de façon garantie chaque année, contrairement à l'argent économisé en annulant l'abonnement.</p>`
    : '';
}
function updateSub(){
  document.getElementById('valSubYears').textContent = subYears.value + ' ans';
  document.getElementById('valSubRate').textContent = subRate.value + ' %';
  const totalPaid = subCost.value * 12 * subYears.value;
  const series = compoundSeries(0, +subCost.value, +subRate.value, +subYears.value);
  const invested = series[series.length-1];
  document.getElementById('subResult').innerHTML = `<span>Total payé : ${fmtEUR(totalPaid)}</span><span>Si investi à la place : <strong style="color:var(--emerald)">${fmtEUR(invested)}</strong></span>`;
  updateSubAlert();
}
[subCost, subYears, subRate].forEach(el=>el.addEventListener('input', updateSub));
updateSub();

// Scénarios futurs d'inflation (hypothèses, panneau secondaire de la carte inflation réelle)
const inflAmount = document.getElementById('inflAmount'), inflReturn = document.getElementById('inflReturn'), inflRate = document.getElementById('inflRate'), inflYears = document.getElementById('inflYears');
// Deux hypothèses distinctes peuvent devenir irréalistes ici : un rendement
// d'épargne trop optimiste (même seuil que RETURN_ASSUMPTIONS.optimiste,
// scripts/data.js) et une inflation annuelle soutenue rare historiquement hors
// période de crise (au-delà de 5%, à comparer à l'inflation réelle IPCH France
// affichée juste au-dessus, autour de DEFAULT_INFLATION_ASSUMPTION).
const UNREALISTIC_SUSTAINED_INFLATION = 5;
function updateInflationAlert(ret, inflation){
  const alertEl = document.getElementById('inflAssumptionAlert');
  const msgs = [];
  if(ret > RETURN_ASSUMPTIONS.optimiste.rate) msgs.push(`un rendement d'épargne de ${ret}%/an proche des meilleures décennies boursières historiques`);
  if(inflation > UNREALISTIC_SUSTAINED_INFLATION) msgs.push(`une inflation de ${inflation}%/an maintenue sur toute la période, rare historiquement hors épisode de crise (l'inflation réelle mesurée ci-dessus tourne plutôt autour de ${DEFAULT_INFLATION_ASSUMPTION}%)`);
  alertEl.innerHTML = msgs.length
    ? `<p class="disclaimer-box" style="margin-top:8px;">Hypothèse à prendre avec précaution : ${msgs.join(' et ')}.</p>`
    : '';
}
function updateInflation(){
  document.getElementById('valInflReturn').textContent = inflReturn.value + ' %';
  document.getElementById('valInflRate').textContent = inflRate.value + ' %';
  document.getElementById('valInflYears').textContent = inflYears.value + ' ans';
  const amount = +inflAmount.value, ret = +inflReturn.value/100, inflation = +inflRate.value/100, years = +inflYears.value;
  const nominal = amount * Math.pow(1+ret, years);
  const real = nominal / Math.pow(1+inflation, years);
  const diff = real - amount;
  document.getElementById('inflResult').innerHTML = `
    <span>Valeur affichée dans ${years} ans : <strong>${fmtEUR(nominal)}</strong></span>
    <span>Pouvoir d'achat réel : <strong style="color:${diff>=0?'var(--emerald)':'var(--bordeaux)'}">${fmtEUR(real)}</strong></span>`;
  const nominalSeries = [], realSeries = [];
  for(let y=0;y<=years;y++){
    nominalSeries.push(amount*Math.pow(1+ret,y));
    realSeries.push(amount*Math.pow(1+ret,y)/Math.pow(1+inflation,y));
  }
  renderBarChart('inflChart','inflChartLabels', realSeries, years);
  updateInflationAlert(+inflReturn.value, +inflRate.value);
}
[inflAmount, inflReturn, inflRate, inflYears].forEach(el=>el.addEventListener('input', updateInflation));
updateInflation();

// Intérêts composés — scénarios prudent/central/optimiste/historique/personnalisé
const capitalEl = document.getElementById('capital'), monthlyEl = document.getElementById('monthly'), rateEl = document.getElementById('rate'), yearsEl = document.getElementById('years');
const simFraisEl = document.getElementById('simFrais'), simShowRealEl = document.getElementById('simShowReal');
let simMode = 'central';
let historicalRateInfo = null; // rempli uniquement par une vraie donnée Yahoo Finance, jamais inventé
// Clés (prudent/central/optimiste) réellement enrichies avec un vrai CAGR —
// par clé, pas un seul booléen global : un échec réseau isolé sur UN
// scénario ne doit jamais faire croire que les 3 sont devenus des faits.
let returnAssumptionsEnrichedKeys = new Set();

async function fetchHistoricalReturn(){
  const resp = await fetch('/api/custom-quotes?symbols=URTH&range=5y');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !q.history || q.history.length < 2) throw new Error('Historique indisponible');
  const first = q.history[0], last = q.history[q.history.length - 1];
  const years = (new Date(last.date) - new Date(first.date)) / (365.25 * 24 * 3600 * 1000);
  if(years <= 0) throw new Error('Période invalide');
  const rate = (Math.pow(last.close / first.close, 1 / years) - 1) * 100;
  return {
    rate,
    source: 'Yahoo Finance — iShares MSCI World ETF (URTH)',
    startLabel: new Date(first.date).toLocaleDateString('fr-FR'),
    endLabel: new Date(last.date).toLocaleDateString('fr-FR')
  };
}

function currentGrossRate(){
  if(simMode === 'personnalise') return +rateEl.value;
  if(simMode === 'historique') return historicalRateInfo ? historicalRateInfo.rate : RETURN_ASSUMPTIONS.central.rate;
  return RETURN_ASSUMPTIONS[simMode].rate;
}

function updateModeDesc(){
  const descEl = document.getElementById('simModeDesc');
  const badgeEl = document.getElementById('simModeBadge');
  if(simMode === 'personnalise'){
    descEl.textContent = "Choisis librement un rendement — une hypothèse trop élevée est signalée ci-dessous.";
    if(badgeEl) badgeEl.innerHTML = '';
  } else if(simMode === 'historique'){
    descEl.textContent = historicalRateInfo
      ? `Rendement annualisé réel constaté : ${historicalRateInfo.rate.toFixed(1)} %. Source : ${historicalRateInfo.source}, du ${historicalRateInfo.startLabel} au ${historicalRateInfo.endLabel}.`
      : "Chargement de la donnée historique réelle…";
    if(badgeEl) badgeEl.innerHTML = historicalRateInfo ? renderDataBadge('fait') : '';
  } else {
    descEl.textContent = RETURN_ASSUMPTIONS[simMode].desc;
    // Tant que enrichReturnAssumptionsFromRealHistory() n'a pas résolu, ces 3
    // scénarios restent des repères pédagogiques (🔮), pas un fait — une fois
    // enrichis avec le vrai CAGR sourcé, ils deviennent 📊 Fait comme le mode
    // Historique, jamais avant.
    if(badgeEl) badgeEl.innerHTML = returnAssumptionsEnrichedKeys.has(simMode) ? renderDataBadge('fait') : renderDataBadge('scenario');
  }
}

function updateRateAlert(){
  const alertEl = document.getElementById('simRateAlert');
  const rate = +rateEl.value, years = +yearsEl.value;
  if(simMode === 'personnalise' && rate > 12){
    alertEl.innerHTML = `<p class="disclaimer-box" style="margin-top:6px;">${rate}% par an sur ${years} ans est une hypothèse extrêmement ambitieuse et ne doit pas être considérée comme un rendement normal attendu.</p>`;
  } else {
    alertEl.innerHTML = '';
  }
}

function updateRealValue(total, years){
  const el = document.getElementById('simRealValue');
  if(!simShowRealEl.checked){ el.innerHTML = ''; return; }
  const real = total / Math.pow(1 + DEFAULT_INFLATION_ASSUMPTION/100, years);
  el.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">En pouvoir d'achat d'aujourd'hui (hypothèse d'inflation ${DEFAULT_INFLATION_ASSUMPTION}%/an) : <strong style="color:var(--text);">${fmtEUR(real)}</strong></p>`;
}

async function selectMode(mode){
  simMode = mode;
  document.querySelectorAll('#simModeToggle .pill').forEach(p=>p.classList.toggle('active', p.dataset.mode === mode));
  rateEl.disabled = mode !== 'personnalise';
  if(mode === 'historique' && !historicalRateInfo){
    updateModeDesc();
    try { historicalRateInfo = await fetchHistoricalReturn(); }
    catch(err){
      document.getElementById('simModeDesc').textContent = "Donnée historique temporairement indisponible. Choisis un autre scénario.";
      console.info('Likanza Academy — rendement historique indisponible :', err.message);
      return;
    }
  }
  updateModeDesc();
  updateSim();
}
document.querySelectorAll('#simModeToggle .pill').forEach(btn=>{
  btn.addEventListener('click', ()=>selectMode(btn.dataset.mode));
});

function updateSim(){
  const P=+capitalEl.value, PMT=+monthlyEl.value, years=+yearsEl.value;
  const grossRate = currentGrossRate();
  if(simMode !== 'personnalise') rateEl.value = grossRate;
  const frais = +simFraisEl.value || 0;
  // Jamais plafonné à 0 : depuis que "Prudente" peut refléter un vrai CAGR
  // obligataire (AGG, cours seuls) et être légèrement négatif sur certaines
  // périodes réelles (ex. remontée des taux 2022-2023), un plancher artificiel
  // ferait afficher "-0,2 %" tout en calculant en réalité sur 0% — un écart
  // entre ce qui est affiché et ce qui est réellement compté, jamais acceptable.
  const netRate = grossRate - frais;
  document.getElementById('valCapital').textContent = fmtEUR(P);
  document.getElementById('valMonthly').textContent = fmtEUR(PMT);
  document.getElementById('valRate').textContent = grossRate.toFixed(1) + ' %' + (frais > 0 ? ` (net de frais : ${netRate.toFixed(1)} %)` : '');
  document.getElementById('valYears').textContent = years + ' ans';
  const series = compoundSeries(P, PMT, netRate, years);
  const total = series[series.length-1];
  const invested = P + PMT*years*12;
  document.getElementById('simTotal').textContent = fmtEUR(total);
  document.getElementById('simInvested').textContent = fmtEUR(invested);
  document.getElementById('simGains').textContent = fmtEUR(total-invested);
  renderBarChart('simChart','simChartLabels', series, years);
  updateRateAlert();
  updateRealValue(total, years);
}
[capitalEl, monthlyEl, yearsEl, simFraisEl].forEach(el=>el.addEventListener('input', ()=>{
  updateSim();
  tryAwardQuizPoints(`lab-sim-${new Date().toDateString()}`, 5, {usedSimulator:true});
}));
rateEl.addEventListener('input', ()=>{
  if(simMode !== 'personnalise') return;
  updateSim();
  tryAwardQuizPoints(`lab-sim-${new Date().toDateString()}`, 5, {usedSimulator:true});
});
simShowRealEl.addEventListener('change', updateSim);
rateEl.disabled = true;
updateModeDesc();
updateSim();

// Remplace les 3 ronds chiffres de repli (Prudente/Centrale/Optimiste) par
// un vrai CAGR sourcé dès qu'il est disponible, sans action de l'utilisateur
// — voir enrichReturnAssumptionsFromRealHistory (scripts/data.js).
enrichReturnAssumptionsFromRealHistory().then((updatedKeys) => {
  returnAssumptionsEnrichedKeys = new Set(updatedKeys);
  if(simMode !== 'historique' && simMode !== 'personnalise'){
    updateModeDesc();
    updateSim();
  }
});

renderWhatIf('simWhatIf', [
  {label:"Et si tu commençais 10 ans plus tôt ?", change:{years: +yearsEl.value + 10}},
  {label:"Et si tu doublais ton versement mensuel ?", change:{monthly: +monthlyEl.value * 2}},
  {label:"Et si le rendement était 2 points plus haut ?", change:{rate: currentGrossRate() + 2}}
], (change)=>{
  const P = change.capital ?? +capitalEl.value;
  const PMT = change.monthly ?? +monthlyEl.value;
  // Même correction qu'updateSim() : jamais de plancher artificiel à 0, pour
  // rester cohérent avec un vrai CAGR qui peut être légèrement négatif.
  const rate = (change.rate ?? currentGrossRate()) - (+simFraisEl.value || 0);
  const years = change.years ?? +yearsEl.value;
  const series = compoundSeries(P, PMT, rate, years);
  return series[series.length-1];
}, fmtEUR);

// DCA — prix moyen d'achat
let dcaCount = 0;
function markDcaUsed(){ tryAwardQuizPoints(`lab-dca-${new Date().toDateString()}`, 5, {usedDCA:true}); }
function addDcaRow(qty=10, price=100){
  dcaCount++;
  const row = document.createElement('div');
  row.className = 'field';
  row.style.display = 'flex';
  row.style.gap = '10px';
  row.innerHTML = `
    <input type="number" class="dca-qty" placeholder="Quantité" value="${qty}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;width:45%;">
    <input type="number" class="dca-price" placeholder="Prix unitaire (€)" value="${price}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;width:45%;">
  `;
  document.getElementById('dcaRows').appendChild(row);
  row.querySelectorAll('input').forEach(i=>i.addEventListener('input', ()=>{ updateDca(); markDcaUsed(); }));
}
document.getElementById('dcaAdd').addEventListener('click', ()=>{ addDcaRow(); markDcaUsed(); });
function updateDca(){
  const qtys = Array.from(document.querySelectorAll('.dca-qty')).map(i=>+i.value||0);
  const prices = Array.from(document.querySelectorAll('.dca-price')).map(i=>+i.value||0);
  let totalQty = 0, totalCost = 0;
  qtys.forEach((q,i)=>{ totalQty += q; totalCost += q*prices[i]; });
  const avg = totalQty > 0 ? totalCost/totalQty : 0;
  document.getElementById('dcaResult').innerHTML = `<span>Quantité totale : ${totalQty}</span><span>Coût total : ${fmtEUR(totalCost)}</span><span>Prix moyen d'achat : <strong style="color:var(--gold-bright)">${avg.toFixed(2)} €</strong></span>`;
}
addDcaRow(10, 95); addDcaRow(5, 110);
updateDca();
