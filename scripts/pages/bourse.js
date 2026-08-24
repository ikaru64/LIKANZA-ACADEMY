// ================= Navigation par onglets (même pattern que index.html) =================
const BOURSE_TABS = [
  {id:'tab-marche-jour', title:'Marché du jour', desc:'Hausses, baisses, sélection', icon:'star'},
  {id:'tab-fiches', title:'Fiches actions', desc:'liste modifiable, 20 max', icon:'list'},
  {id:'tab-screener', title:'Filtrer', desc:'Parmi tes valeurs suivies', icon:'search'},
  {id:'tab-comparateur', title:'Comparateur', desc:'2 à 5 titres', icon:'scale'},
  {id:'tab-scenarios', title:'Scénarios', desc:'Estimation, pas une prédiction', icon:'target'},
  {id:'tab-dca', title:'DCA vs unique', desc:'Impact du timing', icon:'banknote'},
  {id:'tab-portefeuille', title:'Portefeuille', desc:'Déclaratif, tes transactions', icon:'wallet'},
  {id:'tab-marches', title:'Autres marchés', desc:'ETF, Forex, matières premières, taux', icon:'landmark'},
  {id:'tab-options', title:'Options', desc:'Call/Put, payoff à l\'échéance', icon:'swords'},
  {id:'tab-paper-trading', title:'Paper Trading', desc:'Argent fictif, vrais cours', icon:'flame'}
];
let bourseActiveTab = (location.hash && document.getElementById(location.hash.slice(1))) ? location.hash.slice(1) : 'tab-marche-jour';
function renderBourseTabs(){
  const el = document.getElementById('bourseTabsGrid');
  if(!el) return;
  el.innerHTML = BOURSE_TABS.map(t=>`
    <button class="quick-access-card ${t.id===bourseActiveTab?'active':''}" data-tab="${t.id}">
      <div class="icon">${ICONS[t.icon] || ''}</div>
      <h3>${t.title}</h3>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${t.desc}</p>
    </button>`).join('');
  el.querySelectorAll('.quick-access-card').forEach(btn=>{
    btn.addEventListener('click', ()=>setBourseTab(btn.dataset.tab));
  });
}
function setBourseTab(tabId){
  bourseActiveTab = tabId;
  document.querySelectorAll('#bourseTabsGrid .quick-access-card').forEach(c=>c.classList.toggle('active', c.dataset.tab===tabId));
  document.querySelectorAll('.home-tab-panel').forEach(p=>p.classList.toggle('active', p.id===tabId));
  if(tabId === 'tab-marches') safeRun('onglet Autres marchés', renderMarketsHub);
}
renderBourseTabs();
setBourseTab(bourseActiveTab);
renderBourseToolsProgress('bourseToolsProgress');
window.addEventListener('hashchange', ()=>{
  const tab = location.hash.slice(1);
  const target = document.getElementById(tab);
  if(target && target.classList.contains('home-tab-panel')) setBourseTab(tab);
});

// ---------- Fiches actions (liste modifiable : STOCKS_DEMO + actions
// ajoutées par recherche + actifs de marché suivis depuis "Autres marchés",
// Phase 2 de la refonte Bourse) ----------
function renderTrendHtml(trend){
  if(!trend) return '';
  return `<p style="font-size:11.5px;color:${trend.changePct>=0?'var(--emerald)':'var(--bordeaux)'};margin-top:6px;">Tendance ${trend.days}j : ${trend.changePct>=0?'+':''}${trend.changePct.toFixed(1)}% · ${trend.posLabel}</p>`;
}
// Réutilisé pour toute carte (action ou actif de marché) disposant déjà d'un
// historique synchrone (STOCKS_DEMO) — pour les valeurs en direct uniquement,
// voir le placeholder tech-${symbol} rempli par loadCustomQuotesForGrid.
function renderTechIndicatorsHtml(history, unite){
  const lines = renderTechnicalIndicatorsLines(computeTechnicalIndicators(history), unite);
  if(!lines) return '';
  return `<p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">${lines.join(' · ')}</p>`;
}
const ASSET_TYPE_LABELS = {stock:'Action', etf:'ETF', index:'Indice', forex:'Forex', commodity:'Matière première', rate:'Taux'};

function renderStockGrid(){
  const list = getFollowedStocks();
  const metaEl = document.getElementById('stockGridMeta');
  if(metaEl) metaEl.textContent = `${list.length} valeur${list.length>1?'s':''} suivie${list.length>1?'s':''}`;

  document.getElementById('stockGrid').innerHTML = list.map(entry=>{
    const s = STOCKS_DEMO.find(x=>x.ticker===entry.symbol);
    if(s){
      const fund = companyFundamentalsCache[s.ticker];
      const ff = fund && fund.fundamentals ? fund.fundamentals.fields : null;
      const fundLine = fund === undefined ? 'Chargement des données réelles…'
        : !ff ? FUNDAMENTALS_UNAVAILABLE_TEXT
        : `PER ${formatFundamentalValue('trailingPE', ff.trailingPE)} · Rendement ${formatFundamentalValue('dividendYield', ff.dividendYield)} · Cap. ${formatFundamentalValue('marketCap', ff.marketCap)}`;
      return `
      <div class="card" id="${s.ticker}">
        <span class="smallcaps">${s.secteur} · ${s.pays}</span>
        <h3>${s.nom} <span class="mono" style="font-size:13px;color:var(--text-dim);">${s.ticker}</span></h3>
        <div class="result-row" style="margin:0 0 10px;">
          <span class="mono" style="font-size:18px;color:var(--text);">${s.prix.toFixed(1)} €</span>
          <span class="mono ${s.variation>=0?'up':'down'}" style="color:${s.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${s.variation>=0?'+':''}${s.variation}%</span>
        </div>
        <p style="font-size:13px;color:var(--text-dim);">${fundLine} ${s.pea ? '· <span style="color:var(--emerald)">Éligible PEA</span>' : ''}</p>
        ${ff ? `<p style="margin-top:2px;">${renderDataBadge('fait')}</p>` : ''}
        ${renderTrendHtml(computeTrendIndicator(s.history))}
        ${renderTechIndicatorsHtml(s.history)}
        ${s._live ? `<span class="badge status-reel" style="margin-top:6px;">Cotation différée (Yahoo Finance)</span>` : `<span class="demo-flag" style="margin-top:6px;">Donnée de démonstration</span>`}
        <div class="card-footer">
          <a href="action.html#${encodeURIComponent(s.ticker)}" class="btn btn-sm btn-gold">Voir la fiche →</a>
          <button class="fav-btn" data-fav-id="stock-${s.ticker}" data-fav-title="${s.nom}" data-fav-url="bourse.html#${s.ticker}" data-fav-type="Action">${ICONS.star} Favoris</button>
          <button class="btn btn-sm" data-remove-stock="${s.ticker}">Retirer</button>
        </div>
      </div>`;
    }
    // Actions ajoutées par recherche ET actifs de marché suivis (ETF/Forex/
    // matières premières/taux/indices) partagent la même carte "cours en
    // direct uniquement" : ni l'un ni l'autre n'a de fondamentales pré-
    // chargées, et /api/custom-quotes (loadCustomQuotesForGrid) résout
    // n'importe quel symbole indifféremment. Seuls le libellé de type et le
    // lien de détail diffèrent (marche.html pour les actifs de marché,
    // action.html — spécifique aux actions — pour le reste).
    const assetType = entry.assetType || 'stock';
    const isMarketAsset = assetType !== 'stock';
    const detailHref = isMarketAsset ? `marche.html#${encodeURIComponent(entry.symbol)}` : `action.html#${encodeURIComponent(entry.symbol)}`;
    return `
      <div class="card" id="custom-${entry.symbol}">
        <span class="smallcaps">${isMarketAsset ? (ASSET_TYPE_LABELS[assetType] || 'Actif de marché') + ' · cours en direct' : 'Cours en direct uniquement'}</span>
        <h3>${entry.name} <span class="mono" style="font-size:13px;color:var(--text-dim);">${entry.symbol}</span></h3>
        <div class="result-row" id="quote-${entry.symbol}" style="margin:0 0 10px;"><span class="mono" style="color:var(--text-dim);">Chargement…</span></div>
        <div id="trend-${entry.symbol}"></div>
        <div id="tech-${entry.symbol}"></div>
        <div class="card-footer">
          <a href="${detailHref}" class="btn btn-sm btn-gold">Voir la fiche →</a>
          <button class="btn btn-sm" data-remove-stock="${entry.symbol}">Retirer</button>
        </div>
      </div>`;
  }).join('');

  initFavButtons();
  document.querySelectorAll('[data-remove-stock]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      removeFollowedStock(btn.dataset.removeStock);
      refreshAllStockViews();
    });
  });
  loadCustomQuotesForGrid(list);
}

// ---------- Comparateur ----------
// Ouvert à toute valeur suivie (getFollowedStocks), pas seulement aux 8
// valeurs de démonstration — coeur du chantier "supprimer la logique 8
// actions premium + le reste au prix seul". La sélection déjà cochée est
// préservée d'un rafraîchissement à l'autre (ex. après ajout d'une nouvelle
// valeur suivie), jamais réinitialisée silencieusement.
const checksEl = document.getElementById('compareChecks');
function renderCompareChecks(){
  const previouslyChecked = new Set(Array.from(document.querySelectorAll('.compareCheck:checked')).map(c=>c.value));
  const list = getFollowedStocks();
  checksEl.innerHTML = list.map((entry,i)=>{
    const s = resolveFollowedAsset(entry.symbol);
    const checked = previouslyChecked.size ? previouslyChecked.has(entry.symbol) : i < 3;
    return `<label class="pill" style="display:flex;gap:6px;align-items:center;cursor:pointer;">
    <input type="checkbox" class="compareCheck" value="${entry.symbol}" ${checked?'checked':''} style="accent-color:var(--gold);"> ${s.nom}
  </label>`;
  }).join('');
}
renderCompareChecks();

let advancedMode = false;
document.getElementById('modeDebutant').addEventListener('click', e=>{ advancedMode=false; toggleMode(e.target); });
document.getElementById('modeAvance').addEventListener('click', e=>{ advancedMode=true; toggleMode(e.target); });
function toggleMode(btn){
  document.getElementById('modeDebutant').classList.toggle('active', !advancedMode);
  document.getElementById('modeAvance').classList.toggle('active', advancedMode);
  renderCompare();
}

// Critères réels : prix/variation viennent de STOCKS_DEMO (cotation live),
// tous les autres viennent de /api/company-profile (fondamentaux réels,
// jamais des champs fictifs de STOCKS_DEMO).
const CRITERIA_BASIC = [
  {key:'prix', label:'Cours', source:'stock', unit:' €', higherBetter:null},
  {key:'variation', label:'Variation du jour', source:'stock', unit:'%', higherBetter:null},
  {key:'trailingPE', label:'PER', source:'fundamentals', higherBetter:false},
  {key:'dividendYield', label:'Rendement dividende', source:'fundamentals', higherBetter:true},
  {key:'marketCap', label:'Capitalisation', source:'fundamentals', higherBetter:null},
  {key:'totalRevenue', label:"Chiffre d'affaires", source:'fundamentals', higherBetter:null},
];
const CRITERIA_ADV = [
  ...CRITERIA_BASIC,
  {key:'profitMargins', label:'Marge nette', source:'fundamentals', higherBetter:true},
  {key:'returnOnEquity', label:'ROE', source:'fundamentals', higherBetter:true},
  {key:'evToEbitda', label:'EV/EBITDA', source:'fundamentals', higherBetter:false},
  // Dividend Intelligence : un payout ratio plus bas laisse en général plus
  // de marge de manœuvre à l'entreprise pour maintenir ou augmenter son
  // dividende — voir l'analyse complète (dividende.html) pour le détail.
  {key:'payoutRatio', label:'Payout ratio', source:'fundamentals', higherBetter:false},
];

function getFundamentalsFields(ticker){
  const fund = companyFundamentalsCache[ticker];
  return fund && fund.fundamentals ? fund.fundamentals.fields : null;
}

function renderCompare(){
  const selected = Array.from(document.querySelectorAll('.compareCheck:checked')).map(c=>c.value);
  const table = document.getElementById('compareTable');
  if(selected.length < 2){
    table.innerHTML = '<tr><td style="padding:16px 0;color:var(--text-dim);">Sélectionne au moins 2 valeurs pour lancer la comparaison.</td></tr>';
    const analysisEl = document.getElementById('compareAnalysis');
    if(analysisEl) analysisEl.innerHTML = '';
    const techEl = document.getElementById('compareTech');
    if(techEl) techEl.innerHTML = '';
    const chartEl = document.getElementById('compareChart');
    if(chartEl) chartEl.innerHTML = '';
    return;
  }
  const stocks = selected.slice(0,5).map(t=>resolveFollowedAsset(t));
  // Un ETF/une paire Forex/une matière première n'a aucune fondamentale
  // réelle (PER, dividende, marge...) dans ce projet — dès qu'une sélection
  // mixte inclut un actif non-action, on n'affiche que les critères
  // réellement communs (cours/variation) plutôt que des colonnes fondamentales
  // vides pour certaines lignes, ou pire, une valeur fabriquée.
  const hasNonStock = stocks.some(s => s.assetType !== 'stock');
  const criteria = hasNonStock ? CRITERIA_BASIC.filter(c=>c.source==='stock') : (advancedMode ? CRITERIA_ADV : CRITERIA_BASIC);
  let html = '<tr><th>Critère</th>' + stocks.map(s=>`<th>${s.nom}</th>`).join('') + '</tr>';
  criteria.forEach(c=>{
    const values = stocks.map(s => c.source === 'stock'
      ? (typeof s[c.key] === 'number' ? s[c.key] : null)
      : (getFundamentalsFields(s.ticker) ? getFundamentalsFields(s.ticker)[c.key] : null));
    let bestIdx = -1;
    if(c.higherBetter !== null){
      const nums = values.map((v,i)=>({v,i})).filter(o=>typeof o.v === 'number');
      if(nums.length){
        const target = c.higherBetter ? Math.max(...nums.map(o=>o.v)) : Math.min(...nums.map(o=>o.v));
        const found = nums.find(o=>o.v===target);
        bestIdx = found ? found.i : -1;
      }
    }
    html += `<tr><td>${c.label}</td>` + stocks.map((s,i)=>{
      const raw = values[i];
      // Le "cours" d'une action est en €, mais celui d'un indice/d'une
      // matière première/d'une paire Forex a sa propre unité réelle (pts,
      // $/baril...) — on préfère l'unité réelle de l'actif (s.unite) au
      // suffixe générique de CRITERIA_BASIC quand elle est renseignée.
      const unit = c.key === 'prix' && typeof s.unite === 'string' ? (s.unite ? ' ' + s.unite : '') : c.unit;
      const display = c.source === 'stock'
        ? (typeof raw === 'number' ? raw.toFixed(1) + unit : FUNDAMENTALS_UNAVAILABLE_TEXT)
        : formatFundamentalValue(c.key, raw);
      return `<td class="${i===bestIdx?'best':''}">${display}</td>`;
    }).join('') + '</tr>';
  });
  // pea/secteur/pays restent des champs curatés (8 valeurs STOCKS_DEMO),
  // sans aucun sens pour un actif de marché (une paire Forex n'a pas de
  // "secteur") : masqués dès qu'un actif non-action est sélectionné, plutôt
  // que "Non déterminé" partout.
  if(!hasNonStock){
    html += '<tr><td>Éligible PEA</td>' + stocks.map(s=>`<td>${s.pea===true?'Oui':s.pea===false?'Non':'Non déterminé'}</td>`).join('') + '</tr>';
    html += '<tr><td>Secteur</td>' + stocks.map(s=>`<td>${s.secteur || 'Non déterminé'}</td>`).join('') + '</tr>';
    html += '<tr><td>Pays</td>' + stocks.map(s=>`<td>${s.pays || 'Non déterminé'}</td>`).join('') + '</tr>';
  } else {
    html += '<tr><td>Type d\'actif</td>' + stocks.map(s=>`<td>${ASSET_TYPE_LABELS[s.assetType] || 'Non déterminé'}</td>`).join('') + '</tr>';
  }
  table.innerHTML = html;
  renderCompareTech(stocks);
  renderCompareChart(stocks);
  renderCompareAnalysis(stocks);
}

// ---------- Indicateurs techniques par valeur sélectionnée (réutilise
// computeTechnicalIndicators/renderTechnicalIndicatorsLines tel quel, section
// 3 de la Phase 2 de la refonte Bourse) — s'affiche pour toute valeur ayant
// un historique réel, action ou actif de marché. ----------
function renderCompareTech(stocks){
  const el = document.getElementById('compareTech');
  if(!el) return;
  const blocks = stocks.map(s => {
    const lines = renderTechnicalIndicatorsLines(computeTechnicalIndicators(s.history), s.unite);
    if(!lines) return '';
    return `<div class="card" style="margin-top:10px;"><h4 style="margin:0 0 6px;">${s.nom}</h4>${lines.map(l=>`<p style="font-size:12px;color:var(--text-dim);margin-top:4px;">→ ${l}</p>`).join('')}</div>`;
  }).filter(Boolean);
  el.innerHTML = blocks.length ? `<span class="smallcaps">Indicateurs techniques</span>${blocks.join('')}` : '';
}

// ---------- Graphique comparé (réutilise renderMultiLineChart, data.js —
// déjà construit, jamais utilisé jusqu'ici dans bourse.js) : les séries sont
// normalisées en variation % depuis le premier point, jamais en prix brut —
// sans cela, une action à ~180€ écraserait visuellement un indice à
// ~8000pts sur la même échelle. ----------
function normalizeSeriesToPercentChange(closes){
  if(!Array.isArray(closes) || closes.length === 0 || typeof closes[0] !== 'number' || closes[0] === 0) return null;
  return closes.map(c => typeof c === 'number' ? ((c / closes[0]) - 1) * 100 : null);
}
// 5 couleurs déjà définies dans la palette du site (var(--gold-bright) etc.),
// jamais une couleur inventée — au plus 5 valeurs sélectionnables dans le
// comparateur, une couleur par valeur suffit toujours.
const COMPARE_CHART_COLORS = ['var(--gold-bright)', 'var(--emerald)', 'var(--bordeaux)', 'var(--text-dim)', 'var(--gold)'];
function renderCompareChart(stocks){
  const el = document.getElementById('compareChart');
  if(!el) return;
  const withHistory = stocks.filter(s => Array.isArray(s.history) && s.history.length >= 2);
  if(withHistory.length < 2){
    el.innerHTML = '';
    return;
  }
  const named = withHistory.map((s, i) => ({
    nom: s.nom,
    color: COMPARE_CHART_COLORS[i % COMPARE_CHART_COLORS.length],
    data: normalizeSeriesToPercentChange(s.history.map(h => h.close))
  })).filter(s => Array.isArray(s.data));
  if(named.length < 2){ el.innerHTML = ''; return; }
  const legend = named.map(s => `<span><span style="display:inline-block;width:10px;height:10px;background:${s.color};border-radius:50%;margin-right:6px;"></span>${s.nom}</span>`).join('');
  el.innerHTML = `
    <details class="card" style="margin-top:14px;">
      <summary class="smallcaps" style="cursor:pointer;">📈 Voir le graphique comparé (variation % depuis le début de la période)</summary>
      <div style="margin-top:10px;">${renderMultiLineChart(named.map(s=>({data:s.data, color:s.color, width:2})), 'Variation depuis le début de la période (%)')}</div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:12px;color:var(--text-dim);">${legend}</div>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">Chaque série part de 0% pour permettre de comparer des valeurs d'échelles très différentes (ex. une action et un indice) sur le même graphique — jamais le prix brut de chacune.</p>
    </details>`;
}

// ---------- Analyse complète : résumé, business model, croissance/rentabilité/
// valorisation expliquées, risques, forces/faiblesses, scénarios, verdict sans
// gagnant. Limité à exactement 2 valeurs (la structure "A vs B" ne se généralise
// pas proprement à 5 sans devenir illisible) — le tableau rapide ci-dessus,
// lui, reste utilisable de 2 à 5. ----------
function renderCompareAnalysis(stocks){
  const el = document.getElementById('compareAnalysis');
  if(!el) return;
  if(stocks.length !== 2){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Sélectionne exactement 2 valeurs pour voir l'analyse complète (résumé, business model, scénarios...).</p>`;
    return;
  }
  const [sA, sB] = stocks;
  // Un ETF/une paire Forex/une matière première n'a pas de fondamentales
  // d'entreprise à charger : sans ce garde-fou, la vérification suivante
  // (fundA/fundB === undefined, qui signifie normalement "encore en cours de
  // chargement") resterait bloquée indéfiniment sur "Chargement…", puisque
  // ces fondamentales ne seront jamais demandées pour un actif non-action.
  if(sA.assetType !== 'stock' || sB.assetType !== 'stock'){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">L'analyse complète (résumé, business model, scénarios...) n'est disponible que pour deux actions — les ETF/Forex/matières premières n'ont pas de fondamentales d'entreprise à analyser.</p>`;
    return;
  }
  const fundA = companyFundamentalsCache[sA.ticker], fundB = companyFundamentalsCache[sB.ticker];
  if(fundA === undefined || fundB === undefined){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement de l'analyse complète…</p>`;
    return;
  }
  const ffA = getFundamentalsFields(sA.ticker), ffB = getFundamentalsFields(sB.ticker);
  const edA = COMPANY_EDITORIAL[sA.ticker], edB = COMPANY_EDITORIAL[sB.ticker];

  function fieldRow(key){
    return `<div class="result-row" style="justify-content:space-between;"><span>${FUNDAMENTALS_FIELD_META[key].label}</span><span class="mono">${formatFundamentalValue(key, ffA && ffA[key])} · ${formatFundamentalValue(key, ffB && ffB[key])}</span></div>`;
  }
  const swA = ffA ? deriveStrengthsWeaknesses(ffA) : {strengths:[], weaknesses:[]};
  const swB = ffB ? deriveStrengthsWeaknesses(ffB) : {strengths:[], weaknesses:[]};

  el.innerHTML = `
    <details open>
      <summary class="smallcaps" style="cursor:pointer;">Analyse complète : ${sA.nom} vs ${sB.nom}</summary>
      <div style="margin-top:16px;">
        <div class="card" style="margin-bottom:14px;">
          <span class="smallcaps">1. Résumé du business</span> ${renderDataBadge('avis')}
          <div class="card-grid" style="margin-top:10px;">
            <div><h4>${sA.nom}</h4><p style="font-size:13px;color:var(--text-dim);margin-top:6px;">${edA ? edA.resume : 'Non disponible.'}</p></div>
            <div><h4>${sB.nom}</h4><p style="font-size:13px;color:var(--text-dim);margin-top:6px;">${edB ? edB.resume : 'Non disponible.'}</p></div>
          </div>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <span class="smallcaps">2. Business model</span> ${renderDataBadge('avis')}
          <div class="card-grid" style="margin-top:10px;">
            <div><p style="font-size:13px;color:var(--text-dim);">${edA ? edA.businessModel : 'Non disponible.'}</p></div>
            <div><p style="font-size:13px;color:var(--text-dim);">${edB ? edB.businessModel : 'Non disponible.'}</p></div>
          </div>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <span class="smallcaps">3. Croissance expliquée</span> ${renderDataBadge('analyse')}
          ${fieldRow('revenueGrowth')}${fieldRow('totalRevenue')}
          <p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">${ffA && typeof ffA.revenueGrowth === 'number' ? `${sA.nom} : ${bucketGrowth(ffA.revenueGrowth).label}. ` : ''}${ffB && typeof ffB.revenueGrowth === 'number' ? `${sB.nom} : ${bucketGrowth(ffB.revenueGrowth).label}.` : ''}</p>
          <p class="source-note">Source : Yahoo Finance (quoteSummary), dernier exercice connu.</p>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <span class="smallcaps">4. Rentabilité expliquée</span> ${renderDataBadge('analyse')}
          ${fieldRow('grossMargins')}${fieldRow('operatingMargins')}${fieldRow('profitMargins')}${fieldRow('returnOnEquity')}
          <p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Une marge nette plus élevée signifie qu'une entreprise conserve davantage de bénéfice par euro de chiffre d'affaires — pas nécessairement qu'elle est "meilleure", cela dépend du secteur et du modèle économique.</p>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <span class="smallcaps">5. Valorisation expliquée</span> ${renderDataBadge('analyse')}
          ${fieldRow('trailingPE')}${fieldRow('priceToSales')}${fieldRow('evToEbitda')}
          <p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Un PER plus élevé peut se justifier par une croissance plus forte, des marges plus élevées ou une position dominante — jamais, à lui seul, la preuve qu'une action est "chère" ou "bon marché".</p>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <span class="smallcaps">6. Risques</span> ${renderDataBadge('avis')}
          <div class="card-grid" style="margin-top:10px;">
            <div><h4>${sA.nom}</h4><ul style="font-size:13px;color:var(--text-dim);margin-top:6px;padding-left:18px;">${(edA ? edA.risques : []).map(r=>`<li>${r}</li>`).join('')}</ul></div>
            <div><h4>${sB.nom}</h4><ul style="font-size:13px;color:var(--text-dim);margin-top:6px;padding-left:18px;">${(edB ? edB.risques : []).map(r=>`<li>${r}</li>`).join('')}</ul></div>
          </div>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <span class="smallcaps">7. Forces et faiblesses (calculées)</span> ${renderDataBadge('calcul')}
          <div class="card-grid" style="margin-top:10px;">
            <div><h4>${sA.nom}</h4>
              ${swA.strengths.length ? `<p style="font-size:12.5px;color:var(--emerald);margin-top:6px;">Points forts : ${swA.strengths.join(' ')}</p>` : ''}
              ${swA.weaknesses.length ? `<p style="font-size:12.5px;color:var(--bordeaux);margin-top:6px;">Points de vigilance : ${swA.weaknesses.join(' ')}</p>` : ''}
            </div>
            <div><h4>${sB.nom}</h4>
              ${swB.strengths.length ? `<p style="font-size:12.5px;color:var(--emerald);margin-top:6px;">Points forts : ${swB.strengths.join(' ')}</p>` : ''}
              ${swB.weaknesses.length ? `<p style="font-size:12.5px;color:var(--bordeaux);margin-top:6px;">Points de vigilance : ${swB.weaknesses.join(' ')}</p>` : ''}
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <span class="smallcaps">8. Scénarios (cibles réelles des analystes)</span> ${renderDataBadge('scenario')}
          <div class="field" style="max-width:260px;margin-top:10px;margin-bottom:0;"><label for="compInvestAmount">Montant investi aujourd'hui (€)</label><input type="number" id="compInvestAmount" min="1" step="1" value="300"></div>
          <div id="compConsensus" style="margin:14px 0;"></div>
          <div id="compScenResults"></div>
          <p class="disclaimer-box">Cibles de cours réelles des analystes qui suivent chaque titre (Yahoo Finance), horizon type d'environ 12 mois (convention courante du secteur) — des estimations professionnelles, pas des garanties. Ceci ne constitue jamais une recommandation d'achat ou de vente personnalisée.</p>

          <details style="margin-top:16px;">
            <summary class="smallcaps" style="cursor:pointer;font-size:11px;">Explorer mes propres hypothèses (plutôt que les cibles des analystes)</summary>
            <div style="margin-top:12px;">
              <div class="slider-row field"><label for="compGrowth">Croissance annuelle du bénéfice <span class="v mono" id="compValGrowth">6 %</span></label><input type="range" id="compGrowth" min="-10" max="25" step="1" value="6"></div>
              <div class="slider-row field"><label for="compPer">PER cible <span class="v mono" id="compValPer">18×</span></label><input type="range" id="compPer" min="5" max="40" step="1" value="18"></div>
              <div class="slider-row field"><label for="compHorizon">Horizon <span class="v mono" id="compValHorizon">5 ans</span></label><input type="range" id="compHorizon" min="1" max="15" step="1" value="5"></div>
              <div id="compFreeScenResults" style="margin-top:12px;"></div>
              <p class="disclaimer-box">Cette estimation dépend des hypothèses que tu as saisies ci-dessus — pas les cibles des analystes. Elle ne constitue pas une prédiction.</p>
            </div>
          </details>
        </div>
        <div class="card">
          <span class="smallcaps">Verdict — selon l'angle</span>
          <div id="compVerdict" style="margin-top:10px;"></div>
        </div>
      </div>
    </details>`;

  if(ffA && ffB){
    const angles = computeComparisonAngles({symbol: sA.nom, fields: ffA}, {symbol: sB.nom, fields: ffB});
    document.getElementById('compVerdict').innerHTML = angles.map(a=>`
      <div style="margin-bottom:10px;">
        <p style="font-weight:600;font-size:13px;">${a.label}</p>
        <p style="font-size:12.5px;color:var(--text-dim);">${a.readings.map(r=>`${r.symbol} : ${r.text}`).join(' · ')}</p>
        <p style="font-size:12.5px;color:var(--text-dim);margin-top:2px;">${a.framing}</p>
      </div>`).join('') + `<p class="disclaimer-box">Il n'existe pas forcément une meilleure entreprise universelle. Le résultat dépend des objectifs, du risque accepté et des hypothèses sur l'avenir.</p>`;
  } else {
    document.getElementById('compVerdict').innerHTML = `<p style="color:var(--text-dim);font-size:13px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`;
  }

  // ---- 8. Scénarios réels (cibles des analystes), contenu principal ----
  function renderCompAnalystScenarios(){
    const investAmount = +document.getElementById('compInvestAmount').value || 0;
    const consensusEl = document.getElementById('compConsensus');
    const resultsEl = document.getElementById('compScenResults');

    function consensusCard(nom, fund){
      const c = fund && fund.fundamentals ? formatAnalystConsensus(fund.fundamentals) : null;
      if(!c) return `<div class="card"><h4>${nom}</h4><p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p></div>`;
      return `<div class="card"><h4>${nom}</h4><p style="font-size:13px;margin-top:4px;">${c.label}</p><p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">${c.total} analyste${c.total>1?'s':''} · ${c.breakdown.strongBuy} achat fort · ${c.breakdown.buy} achat · ${c.breakdown.hold} conserver · ${c.breakdown.sell} vente · ${c.breakdown.strongSell} vente forte</p></div>`;
    }
    consensusEl.innerHTML = `<div class="card-grid">${consensusCard(sA.nom, fundA)}${consensusCard(sB.nom, fundB)}</div>`;

    if(investAmount <= 0){
      resultsEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Indique un montant investi supérieur à 0 pour voir la projection.</p>`;
      return;
    }
    function renderCasesForCompany(nom, ff, prix, editorial){
      const scenarios = ff ? computeAnalystScenarios(ff, prix, investAmount) : null;
      if(!scenarios || (!scenarios.bear && !scenarios.base && !scenarios.bull)){
        return `<div class="card"><h4>${nom}</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p></div>`;
      }
      const rows = ['bear','base','bull'].map(key=>{
        const c = scenarios[key];
        const meta = CASE_META[key];
        if(!c) return `<p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">${meta.label} : ${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`;
        const color = c.gainEur >= 0 ? 'var(--emerald)' : 'var(--bordeaux)';
        const factors = buildAnalystScenarioFactors(key, ff, editorial);
        return `<div style="margin-top:10px;border-top:1px solid var(--hairline);padding-top:8px;">
          <p style="font-size:11px;color:var(--text-dim);">${meta.label} (${meta.sub})</p>
          <div class="result-row" style="justify-content:space-between;"><span class="mono" style="font-size:13px;">${c.targetPrice.toFixed(1)} €</span><span class="mono" style="color:${color};font-size:12px;">${fmtEUR(c.projectedValue)} (${c.gainEur>=0?'+':''}${fmtEUR(c.gainEur)})</span></div>
          ${factors.length ? `<p style="font-size:11px;color:var(--text-dim);margin-top:4px;">${factors[0]}</p>` : ''}
        </div>`;
      }).join('');
      return `<div class="card"><h4>${nom}</h4>${rows}</div>`;
    }
    resultsEl.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">${fmtEUR(investAmount)} investis aujourd'hui dans chaque entreprise →</p><div class="card-grid" style="margin-top:8px;">${renderCasesForCompany(sA.nom, ffA, sA.prix, edA)}${renderCasesForCompany(sB.nom, ffB, sB.prix, edB)}</div>`;
  }
  document.getElementById('compInvestAmount').addEventListener('input', renderCompAnalystScenarios);
  renderCompAnalystScenarios();

  // ---- Explorer mes propres hypothèses, outil secondaire replié ----
  function updateCompFreeScenarios(){
    const growth = +document.getElementById('compGrowth').value;
    const perTarget = +document.getElementById('compPer').value;
    const horizon = +document.getElementById('compHorizon').value;
    document.getElementById('compValGrowth').textContent = growth + ' %';
    document.getElementById('compValPer').textContent = perTarget + '×';
    document.getElementById('compValHorizon').textContent = horizon + ' ans';
    const {a, b} = computeComparativeScenarios(ffA ? ffA.trailingEps : null, ffB ? ffB.trailingEps : null, {growth, perTarget, horizon});
    const labels = {defavorable:'Défavorable', central:'Central', favorable:'Favorable'};
    function renderSide(nom, scenarios){
      if(!scenarios) return `<div class="card"><h4>${nom}</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (BPA réel indisponible, scénario non calculable)</p></div>`;
      return `<div class="card"><h4>${nom}</h4>${Object.entries(scenarios).map(([k,r])=>`<div class="result-row" style="justify-content:space-between;"><span>${labels[k]}</span><span class="mono">${r.prixCible.toFixed(1)} €</span></div>`).join('')}</div>`;
    }
    document.getElementById('compFreeScenResults').innerHTML = `<div class="card-grid">${renderSide(sA.nom, a)}${renderSide(sB.nom, b)}</div>`;
  }
  ['compGrowth','compPer','compHorizon'].forEach(id => document.getElementById(id).addEventListener('input', updateCompFreeScenarios));
  updateCompFreeScenarios();
}
checksEl.addEventListener('change', renderCompare);

// ---------- Filtre parmi les valeurs suivies (screener « mode simple ») ----------
// Ne porte que sur l'univers réellement suivi (STOCKS_DEMO + ajouts par
// recherche) — jamais présenté comme un screener de marché complet (voir
// disclaimer dans bourse.html). Un titre n'est retenu que si sa donnée
// sous-jacente est réellement vérifiable, jamais par défaut sur une donnée
// manquante. Chaque filtre explique pourquoi il compte (title = tooltip).
const SCREENER_FILTERS = [
  {id:'rentable', label:'Rentable', why:"Une marge nette positive et significative signifie que l'entreprise conserve du bénéfice après toutes ses charges.",
    test(s, ff){ return !!(ff && typeof ff.profitMargins === 'number' && ff.profitMargins > 0.05); }},
  {id:'croissance', label:'En croissance', why:"Chiffre d'affaires en croissance modérée ou forte sur le dernier exercice connu.",
    test(s, ff){ const g = ff ? bucketGrowth(ff.revenueGrowth) : null; return !!(g && (g.level === 'forte' || g.level === 'moderee')); }},
  {id:'dividende', label:'Verse un dividende', why:"Rendement de dividende réel et positif — un revenu régulier, jamais garanti pour l'avenir.",
    test(s, ff){ return !!(ff && typeof ff.dividendYield === 'number' && ff.dividendYield > 0); }},
  {id:'bilan-solide', label:'Bilan solide', why:"Trésorerie nette positive ou endettement net modéré, qui peut mieux absorber un ralentissement.",
    test(s, ff){ const l = ff ? bucketLeverage(ff.totalDebt, ff.totalCash) : null; return !!(l && l.level !== 'eleve'); }},
  {id:'pea', label:'Éligible PEA', why:"Peut être logé dans un PEA, avec le cadre fiscal associé après 5 ans — ne dit rien sur la qualité de l'entreprise.",
    test(s){ return !!s.pea; }}
];
const screenerActiveFilters = new Set();
function renderScreenerFilters(){
  const el = document.getElementById('screenerFilters');
  if(!el) return;
  el.innerHTML = SCREENER_FILTERS.map(f => `
    <label class="pill" style="display:flex;gap:6px;align-items:center;cursor:pointer;" title="${f.why}">
      <input type="checkbox" class="screenerCheck" value="${f.id}" style="accent-color:var(--gold);"> ${f.label}
    </label>`).join('');
  el.querySelectorAll('.screenerCheck').forEach(cb => {
    cb.addEventListener('change', () => {
      if(cb.checked) screenerActiveFilters.add(cb.value); else screenerActiveFilters.delete(cb.value);
      renderScreener();
    });
  });
}
function screenerUniverse(){
  return getFollowedStocks().map(entry => resolveFollowedAsset(entry.symbol));
}

// ---------- Screener « mode avancé » : critères numériques + tri, sur le
// même univers honnête (valeurs suivies uniquement, jamais un classement sur
// des milliers de titres) — les fondamentaux sont déjà chargés par
// loadFundamentalsAndRefresh, aucun nouvel appel réseau. Une valeur sans la
// donnée demandée est exclue du filtre correspondant, jamais incluse par
// défaut ; en tri, elle est toujours reléguée en fin de liste, jamais classée
// arbitrairement parmi les valeurs réelles.
const SCREENER_ADV_COLUMNS = [
  {key: 'trailingPE', label: 'PER'},
  {key: 'dividendYield', label: 'Rendement'},
  {key: 'profitMargins', label: 'Marge nette'},
  {key: 'marketCap', label: 'Capitalisation'}
];
let screenerAdvancedMode = false;
let screenerAdvSort = {key: null, dir: 1};
const screenerAdvFilters = {perMax: null, divYieldMin: null, secteur: 'toutes'};

function screenerAdvancedMatch(s){
  if(!screenerAdvancedMode) return true;
  const ff = getFundamentalsFields(s.ticker);
  if(screenerAdvFilters.perMax != null && !(ff && typeof ff.trailingPE === 'number' && ff.trailingPE <= screenerAdvFilters.perMax)) return false;
  if(screenerAdvFilters.divYieldMin != null && !(ff && typeof ff.dividendYield === 'number' && ff.dividendYield * 100 >= screenerAdvFilters.divYieldMin)) return false;
  if(screenerAdvFilters.secteur !== 'toutes' && s.secteur !== screenerAdvFilters.secteur) return false;
  return true;
}

function renderScreenerAdvancedControls(){
  const el = document.getElementById('screenerAdvancedControls');
  if(!el) return;
  el.style.display = screenerAdvancedMode ? '' : 'none';
  if(!screenerAdvancedMode) return;
  const secteurs = [...new Set(screenerUniverse().map(s => s.secteur).filter(Boolean))].sort();
  el.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:end;">
      <div class="field" style="max-width:160px;">
        <label for="screenerPerMax">PER maximum</label>
        <input type="number" id="screenerPerMax" min="0" step="1" placeholder="Ex : 25" value="${screenerAdvFilters.perMax ?? ''}">
      </div>
      <div class="field" style="max-width:200px;">
        <label for="screenerDivMin">Rendement dividende minimum (%)</label>
        <input type="number" id="screenerDivMin" min="0" step="0.1" placeholder="Ex : 2" value="${screenerAdvFilters.divYieldMin ?? ''}">
      </div>
      <div class="field" style="max-width:220px;">
        <label for="screenerSecteur">Secteur</label>
        <select id="screenerSecteur">
          <option value="toutes">Tous les secteurs suivis</option>
          ${secteurs.map(s => `<option value="${s}" ${screenerAdvFilters.secteur === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">Une valeur sans la donnée demandée est exclue du filtre correspondant, jamais incluse par défaut — clique un en-tête de colonne du tableau pour trier.</p>`;
  document.getElementById('screenerPerMax').addEventListener('input', e => { screenerAdvFilters.perMax = e.target.value ? parseFloat(e.target.value) : null; renderScreener(); });
  document.getElementById('screenerDivMin').addEventListener('input', e => { screenerAdvFilters.divYieldMin = e.target.value ? parseFloat(e.target.value) : null; renderScreener(); });
  document.getElementById('screenerSecteur').addEventListener('change', e => { screenerAdvFilters.secteur = e.target.value; renderScreener(); });
}

function renderScreenerAdvancedTable(list){
  const rows = list.map(s => ({stock: s, ff: getFundamentalsFields(s.ticker) || {}}));
  if(screenerAdvSort.key){
    const key = screenerAdvSort.key;
    rows.sort((a, b) => {
      const va = a.ff[key], vb = b.ff[key];
      const na = typeof va === 'number', nb = typeof vb === 'number';
      if(!na && !nb) return 0;
      if(!na) return 1;
      if(!nb) return -1;
      return (va - vb) * screenerAdvSort.dir;
    });
  }
  const arrow = key => screenerAdvSort.key === key ? (screenerAdvSort.dir === 1 ? ' ▲' : ' ▼') : '';
  return `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;">
    <thead><tr>
      <th style="text-align:left;padding:6px 8px;">Valeur</th>
      <th style="text-align:left;padding:6px 8px;">Secteur</th>
      ${SCREENER_ADV_COLUMNS.map(c => `<th data-sort-key="${c.key}" style="text-align:right;padding:6px 8px;cursor:pointer;white-space:nowrap;">${c.label}${arrow(c.key)}</th>`).join('')}
    </tr></thead>
    <tbody>${rows.map(({stock, ff}) => {
      const isStock = (stock.assetType || 'stock') === 'stock';
      const href = isStock ? `action.html#${encodeURIComponent(stock.ticker)}` : `marche.html#${encodeURIComponent(stock.ticker)}`;
      // Un ETF/Forex/matière première n'a pas de secteur réel : affiche son
      // type d'actif à la place de "Non déterminé", pour expliquer
      // pourquoi les colonnes fondamentales à droite sont vides sur sa ligne.
      const secteurCell = isStock ? (stock.secteur || 'Non déterminé') : (ASSET_TYPE_LABELS[stock.assetType] || 'Actif de marché');
      return `<tr>
      <td style="padding:6px 8px;"><a href="${href}" style="color:var(--gold-bright);">${stock.nom}</a></td>
      <td style="padding:6px 8px;color:var(--text-dim);">${secteurCell}</td>
      ${SCREENER_ADV_COLUMNS.map(c => `<td style="text-align:right;padding:6px 8px;">${formatFundamentalValue(c.key, ff[c.key])}</td>`).join('')}
    </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function renderScreener(){
  const el = document.getElementById('screenerResults');
  if(!el) return;
  const universe = screenerUniverse();
  const activeFilters = SCREENER_FILTERS.filter(f => screenerActiveFilters.has(f.id));
  let list = activeFilters.length === 0 ? universe : universe.filter(s => {
    const ff = getFundamentalsFields(s.ticker);
    return activeFilters.every(f => f.test(s, ff));
  });
  if(screenerAdvancedMode) list = list.filter(screenerAdvancedMatch);
  const summary = (activeFilters.length === 0 && !screenerAdvancedMode)
    ? `${universe.length} valeur${universe.length>1?'s':''} suivie${universe.length>1?'s':''} au total (aucun filtre actif).`
    : `${list.length} valeur${list.length>1?'s':''} sur ${universe.length} correspond${list.length>1?'ent':''} à ces critères.`;
  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:12px;">${summary}</p>
    ${list.length === 0
      ? `<p style="color:var(--text-dim);font-size:13px;">Aucune de tes valeurs suivies ne correspond à cette combinaison de critères.</p>`
      : (screenerAdvancedMode ? renderScreenerAdvancedTable(list) : `<div class="card-grid">${list.map(s => {
          const isStock = (s.assetType || 'stock') === 'stock';
          const href = isStock ? `action.html#${encodeURIComponent(s.ticker)}` : `marche.html#${encodeURIComponent(s.ticker)}`;
          const metaLine = isStock ? `${s.secteur || 'Non déterminé'} · ${s.pays || 'Non déterminé'}` : (ASSET_TYPE_LABELS[s.assetType] || 'Actif de marché');
          return `
        <a href="${href}" class="card play-tile">
          <span class="smallcaps">${metaLine}</span>
          <h4 style="margin:6px 0;">${s.nom} <span class="mono" style="font-size:12px;color:var(--text-dim);">${s.ticker}</span></h4>
          <p style="font-size:12.5px;color:var(--text-dim);">${typeof s.prix === 'number' ? s.prix.toFixed(1) + (typeof s.unite === 'string' ? (s.unite ? ' ' + s.unite : '') : ' €') : 'Cours indisponible'} ${typeof s.variation === 'number' ? `<span style="color:${s.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${s.variation>=0?'+':''}${s.variation.toFixed(1)}%</span>` : ''}</p>
        </a>`;
        }).join('')}</div>`)}
    ${activeFilters.some(f => f.id === 'pea') ? `<p style="font-size:11.5px;color:var(--text-dim);margin-top:12px;">Le filtre « Éligible PEA » ne retient que les valeurs dont l'éligibilité est confirmée — une valeur suivie hors des 8 démo n'apparaît pas ici tant que cette information n'est pas vérifiée, jamais parce qu'elle est explicitement non éligible.</p>` : ''}`;
  if(screenerAdvancedMode){
    el.querySelectorAll('[data-sort-key]').forEach(th => th.addEventListener('click', () => {
      const key = th.dataset.sortKey;
      if(screenerAdvSort.key === key) screenerAdvSort.dir *= -1; else { screenerAdvSort.key = key; screenerAdvSort.dir = 1; }
      renderScreener();
    }));
  }
}
const screenerAdvToggle = document.getElementById('screenerAdvancedToggle');
if(screenerAdvToggle) screenerAdvToggle.addEventListener('change', () => {
  screenerAdvancedMode = screenerAdvToggle.checked;
  renderScreenerAdvancedControls();
  renderScreener();
});
renderScreenerFilters();

// ---------- Scénarios (moteur partagé avec la sélection du jour) ----------
// bpaActuel vient désormais du vrai trailingEps (fondamentaux réels), plus
// jamais de stock.prix / stock.per fictif — un BPA indisponible renvoie null,
// jamais un scénario calculé sur une base inventée.
function computeScenarios(bpaActuel, prixActuel, growth, perTarget, horizon){
  if(typeof bpaActuel !== 'number' || typeof prixActuel !== 'number' || prixActuel <= 0) return null;
  const defs = {
    defavorable: {growth: growth - 6, per: perTarget * 0.75},
    central: {growth: growth, per: perTarget},
    favorable: {growth: growth + 6, per: perTarget * 1.25}
  };
  const out = {};
  Object.entries(defs).forEach(([key,s])=>{
    const bpaFutur = bpaActuel * Math.pow(1 + s.growth/100, horizon);
    const prixCible = bpaFutur * s.per;
    const variation = ((prixCible / prixActuel) - 1) * 100;
    out[key] = {prixCible, variation};
  });
  return out;
}

// Ouvert à toute valeur suivie (voir renderCompareChecks ci-dessus pour la
// même logique) — préserve la sélection courante d'un rafraîchissement à
// l'autre plutôt que de revenir silencieusement au premier ticker.
const scenSelect = document.getElementById('scenStock');
function renderScenSelect(){
  const previous = scenSelect.value;
  scenSelect.innerHTML = getFollowedStocks().map(entry => {
    const s = resolveFollowedAsset(entry.symbol);
    return `<option value="${entry.symbol}">${s.nom}</option>`;
  }).join('');
  if(previous && getFollowedStocks().some(e => e.symbol === previous)) scenSelect.value = previous;
}
renderScenSelect();

// ---------- Scénarios ancrés sur de vraies cibles de cours d'analystes (contenu principal de l'onglet) ----------
const CASE_META = {
  bear: {label: 'Scénario bas', sub: 'cible basse des analystes'},
  base: {label: 'Scénario central', sub: 'cible moyenne des analystes'},
  bull: {label: 'Scénario haut', sub: 'cible haute des analystes'}
};
// ---------- Repère technique de court terme, en contexte des scénarios (jamais présenté
// comme une confirmation des scénarios ci-dessous : le RSI/Bollinger décrivent le momentum
// des derniers jours, les scénarios (analystes ou hypothèses) portent sur un horizon de
// mois/années — deux natures de signaux différentes, volontairement affichées côte à côte
// sans jamais être mélangées en une seule affirmation. Réutilise computeTechnicalIndicators
// (déjà utilisé par les Fiches actions/Comparateur), aucun nouveau calcul introduit. ----------
function renderScenTechContext(){
  const el = document.getElementById('scenTechContext');
  if(!el) return;
  const symbol = scenSelect.value || (getFollowedStocks()[0] && getFollowedStocks()[0].symbol);
  if(!symbol){ el.innerHTML = ''; return; }
  const stock = resolveFollowedAsset(symbol);
  if(!Array.isArray(stock.history) || stock.history.length < 20){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:12px;">Repère technique indisponible pour ${stock.nom} (historique insuffisant).</p>`;
    return;
  }
  const tech = computeTechnicalIndicators(stock.history);
  const rsiText = typeof tech.rsi14 === 'number'
    ? `RSI(14) = ${tech.rsi14.toFixed(0)} ${tech.rsi14 >= 70 ? '(zone de surachat)' : tech.rsi14 <= 30 ? '(zone de survente)' : '(zone neutre)'}`
    : 'RSI(14) indisponible';
  const bollingerLabels = {above: 'au-dessus de la bande haute', below: 'en-dessous de la bande basse', inside: 'à l\'intérieur des bandes'};
  const bollText = tech.bollinger ? `Bandes de Bollinger : cours ${bollingerLabels[tech.bollinger.position] || 'indisponible'}` : 'Bandes de Bollinger indisponibles';

  el.innerHTML = `
    <div class="card">
      <span class="smallcaps">📍 Repère technique actuel — ${stock.nom}</span> ${renderDataBadge('calcul')}
      <p style="font-size:12.5px;margin-top:8px;">${rsiText} · ${bollText}</p>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">Ceci décrit le momentum de COURT TERME (dernières séances), une lecture indépendante des scénarios ci-dessous (cibles analystes ou hypothèses, horizon de mois/années) — jamais une indication de quel scénario a le plus de chances de se réaliser. Voir "Analyse technique" dans la Bibliothèque pour comprendre ces indicateurs.</p>
    </div>`;
}
scenSelect.addEventListener('change', renderScenTechContext);

function renderAnalystScenarios(){
  const symbol = scenSelect.value || (getFollowedStocks()[0] && getFollowedStocks()[0].symbol);
  if(!symbol) return;
  const stock = resolveFollowedAsset(symbol);
  const investAmount = +document.getElementById('scenInvestAmount').value || 0;
  const consensusEl = document.getElementById('scenConsensus');
  const gridEl = document.getElementById('scenCasesGrid');
  const disclaimerEl = document.getElementById('scenDisclaimer');

  const fund = companyFundamentalsCache[stock.ticker];
  const ff = getFundamentalsFields(stock.ticker);
  if(fund === undefined){
    gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des cibles réelles des analystes…</p>`;
    consensusEl.innerHTML = ''; disclaimerEl.innerHTML = '';
    return;
  }
  if(!ff){
    gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} pour ${stock.nom}.</p>`;
    consensusEl.innerHTML = ''; disclaimerEl.innerHTML = '';
    return;
  }

  const consensus = formatAnalystConsensus(fund.fundamentals);
  consensusEl.innerHTML = consensus ? `
    <div class="card">
      <span class="smallcaps">Consensus actuel des analystes</span> ${renderDataBadge('fait')}
      <h3 style="margin-top:6px;">${consensus.label}</h3>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${consensus.total} analyste${consensus.total>1?'s':''} · ${consensus.breakdown.strongBuy} achat fort · ${consensus.breakdown.buy} achat · ${consensus.breakdown.hold} conserver · ${consensus.breakdown.sell} vente · ${consensus.breakdown.strongSell} vente forte</p>
    </div>` : '';

  if(investAmount <= 0){
    gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Indique un montant investi supérieur à 0 pour voir la projection.</p>`;
    disclaimerEl.innerHTML = '';
    return;
  }
  const scenarios = computeAnalystScenarios(ff, stock.prix, investAmount);
  if(!scenarios || (!scenarios.bear && !scenarios.base && !scenarios.bull)){
    gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (cibles de cours indisponibles pour ${stock.nom}).</p>`;
    disclaimerEl.innerHTML = '';
    return;
  }

  const editorial = COMPANY_EDITORIAL[stock.ticker];
  gridEl.innerHTML = ['bear','base','bull'].map(key => {
    const c = scenarios[key];
    const meta = CASE_META[key];
    if(!c) return `<div class="card"><span class="smallcaps">${meta.label}</span><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p></div>`;
    const factors = buildAnalystScenarioFactors(key, ff, editorial);
    const color = c.gainEur >= 0 ? 'var(--emerald)' : 'var(--bordeaux)';
    return `
      <div class="card">
        <span class="smallcaps">${meta.label}</span>
        <p style="font-size:11px;color:var(--text-dim);margin-top:2px;">${meta.sub}</p>
        <div class="result-big" style="margin-top:8px;font-size:22px;">${c.targetPrice.toFixed(1)} €</div>
        <p style="font-size:12px;color:${color};margin-top:2px;">${c.gainPct>=0?'+':''}${c.gainPct.toFixed(0)}% vs cours actuel</p>
        <div class="result-row" style="justify-content:space-between;margin-top:10px;border-top:1px solid var(--hairline);padding-top:8px;">
          <span style="font-size:12.5px;">${fmtEUR(investAmount)} investis aujourd'hui →</span>
          <span class="mono" style="color:${color};">${fmtEUR(c.projectedValue)}</span>
        </div>
        <p style="font-size:11.5px;color:${color};margin-top:2px;">${c.gainEur>=0?'+':''}${fmtEUR(c.gainEur)}</p>
        ${factors.length ? `<p style="font-size:11.5px;color:var(--text-dim);margin-top:10px;">Facteurs qui pourraient peser vers ce scénario :</p><ul style="font-size:11.5px;color:var(--text-dim);margin:4px 0 0 16px;">${factors.slice(0,3).map(f=>`<li>${f}</li>`).join('')}</ul>` : ''}
      </div>`;
  }).join('');

  disclaimerEl.innerHTML = `${renderDataBadge('fait')} Cibles de cours de ${ff.numberOfAnalystOpinions || '?'} analyste(s) suivant ce titre, Yahoo Finance, récupérées le ${new Date(fund.fundamentals.asOfDate).toLocaleDateString('fr-FR')}. Les cibles de cours reflètent généralement un horizon d'environ 12 mois (convention courante du secteur) — ce sont des estimations professionnelles, pas des garanties : les analystes peuvent se tromper, et le consensus peut changer. Ceci ne constitue jamais une recommandation d'achat ou de vente personnalisée.`;
}
scenSelect.addEventListener('change', renderAnalystScenarios);
document.getElementById('scenInvestAmount').addEventListener('input', renderAnalystScenarios);

// ---------- Explorer mes propres hypothèses (outil secondaire, replié) ----------
const scenInputs = ['scenGrowth','scenPer','scenHorizon'].map(id=>document.getElementById(id));
function updateScenario(){
  const symbol = scenSelect.value || (getFollowedStocks()[0] && getFollowedStocks()[0].symbol);
  if(!symbol) return;
  const stock = resolveFollowedAsset(symbol);
  const growth = +document.getElementById('scenGrowth').value;
  const perTarget = +document.getElementById('scenPer').value;
  const horizon = +document.getElementById('scenHorizon').value;
  document.getElementById('valGrowth').textContent = growth + ' %';
  document.getElementById('valPer').textContent = perTarget + '×';
  document.getElementById('valHorizon').textContent = horizon + ' ans';

  const ff = getFundamentalsFields(stock.ticker);
  const scenarios = ff ? computeScenarios(ff.trailingEps, stock.prix, growth, perTarget, horizon) : null;
  const resultsEl = document.getElementById('scenResults');
  if(!scenarios){
    resultsEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (BPA réel indisponible pour ${stock.nom}, scénario non calculable).</p>`;
    document.getElementById('scenChart').innerHTML = ''; document.getElementById('scenChartLabels').innerHTML = '';
    return;
  }
  const labels = {defavorable:'Scénario défavorable', central:'Scénario central', favorable:'Scénario favorable'};
  let html = '';
  Object.entries(scenarios).forEach(([key,r])=>{
    html += `<div class="result-row" style="justify-content:space-between;width:100%;"><span>${labels[key]}</span><span class="mono" style="color:${r.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${r.prixCible.toFixed(1)} € (${r.variation>=0?'+':''}${r.variation.toFixed(0)}%)</span></div>`;
  });
  resultsEl.innerHTML = `<div class="result-label">Prix théorique estimé dans ${horizon} an(s), cours actuel ${stock.prix} € ${renderDataBadge('scenario')}</div>` + html + `<p style="margin-top:6px;">${renderDataBadge('fait')} BPA de départ : ${formatFundamentalValue('trailingEps', ff.trailingEps)}</p>`;

  const chart = document.getElementById('scenChart');
  const labelsEl = document.getElementById('scenChartLabels');
  chart.innerHTML=''; labelsEl.innerHTML='';
  const max = Math.max(scenarios.defavorable.prixCible, scenarios.central.prixCible, scenarios.favorable.prixCible, stock.prix);
  [['Actuel', stock.prix], ['Défav.', scenarios.defavorable.prixCible], ['Central', scenarios.central.prixCible], ['Favor.', scenarios.favorable.prixCible]].forEach(([lab,val])=>{
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = Math.max(2,(val/max)*100) + '%';
    bar.title = `${lab} : ${val.toFixed(1)} €`;
    chart.appendChild(bar);
    const l = document.createElement('span'); l.textContent = lab; labelsEl.appendChild(l);
  });
}
scenSelect.addEventListener('change', updateScenario);
scenInputs.forEach(el=>el.addEventListener('input', updateScenario));

// ---------- DCA vs investissement unique (ne dépend pas des cotations live) ----------
const dcaTotalEl = document.getElementById('dcaTotal');
const dcaPricesRowsEl = document.getElementById('dcaPriceRows');
const dcaPeriods = ['Aujourd\'hui', 'Dans 3 mois', 'Dans 6 mois', 'Dans 9 mois'];
const defaultPrices = [100, 92, 108, 97];
dcaPricesRowsEl.innerHTML = dcaPeriods.map((p,i)=>`
  <div class="field"><label>${p} : prix (€) <input type="number" class="dcaPrice" data-idx="${i}" value="${defaultPrices[i]}"></label></div>`).join('');

function updateDcaVsLump(){
  const total = +dcaTotalEl.value;
  const prices = Array.from(document.querySelectorAll('.dcaPrice')).map(i=>+i.value);
  const perInstallment = total / prices.length;
  let dcaUnits = 0;
  prices.forEach(p=>{ if(p>0) dcaUnits += perInstallment/p; });
  const finalPrice = prices[prices.length-1];
  const dcaValue = dcaUnits * finalPrice;
  const lumpUnits = prices[0]>0 ? total/prices[0] : 0;
  const lumpValue = lumpUnits * finalPrice;
  const best = dcaValue >= lumpValue ? 'dca' : 'lump';
  document.getElementById('dcaVsLumpResult').innerHTML = `
    <div class="whatif-compare">
      <div class="whatif-col"><div class="lab">DCA (réparti)</div><div class="val" style="color:${best==='dca'?'var(--emerald)':'var(--text)'}">${fmtEUR(dcaValue)}</div></div>
      <div class="whatif-col"><div class="lab">Tout en une fois</div><div class="val" style="color:${best==='lump'?'var(--emerald)':'var(--text)'}">${fmtEUR(lumpValue)}</div></div>
    </div>
    <p style="font-size:12.5px;color:var(--text-dim);margin-top:12px;">Avec ces prix, la stratégie ${best==='dca'?'DCA':'investissement unique'} aurait donné le meilleur résultat sur cette période précise, un résultat qui dépend entièrement des prix saisis, pas d'une règle générale.</p>`;
  tryAwardQuizPoints(`bourse-dca-${new Date().toDateString()}`, 5, {usedDCA:true});
}
[dcaTotalEl].forEach(el=>el.addEventListener('input', updateDcaVsLump));
dcaPricesRowsEl.addEventListener('input', updateDcaVsLump);

// ---------- Marché du jour : hausses / baisses / sélection ----------
let marketOfDayView = 'hausses';
document.querySelectorAll('[data-mjtab]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-mjtab]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    marketOfDayView = btn.dataset.mjtab;
    renderMarketOfDay();
  });
});

function stocksByChange(){
  return STOCKS_DEMO.slice().sort((a,b)=>b.variation-a.variation);
}
// La couleur du mini-graphique reflète la tendance sur TOUT l'historique
// affiché (premier point vs dernier, voir renderSparklineHTML) — pas la
// variation du jour affichée à droite. Un titre en hausse aujourd'hui peut
// très bien avoir un mini-graphique rouge s'il reste net en baisse sur les
// dernières séances (et inversement) : les deux chiffres sont réels, mais
// mesurent deux périodes différentes. Sans le préciser, ça peut ressembler
// à une incohérence ou à un bug — d'où la légende de période sous le graphique.
function renderStockRow(s){
  const spark = renderSparklineHTML(s.history, {compact:true});
  const points = Array.isArray(s.history) ? s.history.length : 0;
  return `<a class="market-row" href="bourse.html#${s.ticker}">
    <div>
      <strong>${s.nom}</strong> <span class="mono" style="font-size:11px;color:var(--text-dim);">${s.ticker}</span>
      <div style="font-size:11.5px;color:var(--text-dim);">${s.secteur}</div>
    </div>
    <div class="market-row-spark">
      ${spark}
      ${points > 1 ? `<span style="display:block;text-align:center;font-size:9px;color:var(--text-dim);margin-top:2px;">${points} séances</span>` : ''}
    </div>
    <div class="mono market-row-value">
      <div>${s.prix.toFixed(1)} €</div>
      <div style="color:${s.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${s.variation>=0?'+':''}${s.variation}%</div>
      <div style="font-size:9px;color:var(--text-dim);font-weight:400;">aujourd'hui</div>
    </div>
  </a>`;
}
const BOURSE_LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
function renderMarketOfDay(){
  const body = document.getElementById('marketOfDayBody');
  if(!body) return;
  if(marketOfDayView === 'hausses' || marketOfDayView === 'baisses'){
    const list = marketOfDayView === 'hausses' ? stocksByChange().slice(0,5) : stocksByChange().slice(-5).reverse();
    body.innerHTML = `
      <p style="font-size:11.5px;color:var(--text-dim);margin-bottom:10px;">Le classement et le pourcentage à droite portent sur la variation du jour ; le mini-graphique montre la tendance sur les dernières séances (voir la légende sous chaque graphique) — les deux peuvent diverger, par exemple un titre en hausse aujourd'hui après avoir baissé les jours précédents.</p>
      <div class="market-row-list">${list.map(renderStockRow).join('')}</div>`;
  } else {
    const idx = dayOfYear() % STOCKS_DEMO.length;
    const idx2 = (idx + 4) % STOCKS_DEMO.length;
    const picks = idx === idx2 ? [STOCKS_DEMO[idx]] : [STOCKS_DEMO[idx], STOCKS_DEMO[idx2]];
    const labels = {defavorable:'Défavorable', central:'Central', favorable:'Favorable'};
    body.innerHTML = picks.map(s=>{
      const ff = getFundamentalsFields(s.ticker);
      const scenarios = ff ? computeScenarios(ff.trailingEps, s.prix, 6, 18, 5) : null;
      const rows = scenarios ? ['defavorable','central','favorable'].map(key=>{
        const r = scenarios[key];
        return `<div class="result-row" style="justify-content:space-between;width:100%;"><span>${labels[key]}</span><span class="mono" style="color:${r.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${r.prixCible.toFixed(1)} € (${r.variation>=0?'+':''}${r.variation.toFixed(0)}%)</span></div>`;
      }).join('') : `<p style="color:var(--text-dim);font-size:13px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (BPA réel indisponible, scénario non calculable).</p>`;
      return `<div class="card" style="margin-bottom:14px;">
        <span class="smallcaps">${s.secteur} · ${s.pays}</span>
        <h3>${s.nom} <span class="mono" style="font-size:13px;color:var(--text-dim);">${s.ticker}</span></h3>
        <div class="result-row" style="margin:8px 0;"><span class="mono" style="font-size:16px;">${s.prix.toFixed(1)} €</span><span class="mono" style="color:${s.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${s.variation>=0?'+':''}${s.variation}%</span></div>
        ${rows}
        <p class="disclaimer-box" style="margin-top:10px;">Scénarios pédagogiques basés sur des hypothèses génériques (croissance 6 %, PER cible 18×, horizon 5 ans) et sur le vrai BPA de départ (Yahoo Finance) : pas une recommandation d'achat ou de vente.</p>
      </div>`;
    }).join('');
  }
  const tip = document.getElementById('marketLevelTip');
  if(tip){
    const lvl = getLevel();
    tip.innerHTML = `<div class="coach-panel"><span class="smallcaps">Pour toi, niveau ${BOURSE_LEVEL_LABELS[lvl] || lvl}</span><p class="coach-msg" style="margin-top:8px;">→ ${MARKET_TIPS[lvl] || MARKET_TIPS.debutant}</p></div>`;
  }
}

// ---------- 🔥 Ce qui bouge réellement : les plus fortes variations, jamais
// une causalité inventée. Une actualité liée n'est affichée qu'en cas de
// proximité de vocabulaire réelle (findThematicNews, déjà utilisé sur
// action.js) — jamais présentée comme la cause confirmée du mouvement. ----------
let weeklyArticlesForMovers = null;
function renderMarketMovers(){
  const body = document.getElementById('marketMoversBody');
  if(!body) return;
  const movers = STOCKS_DEMO.slice().sort((a,b) => Math.abs(b.variation) - Math.abs(a.variation)).slice(0,3);
  body.innerHTML = movers.map(s=>{
    const related = weeklyArticlesForMovers ? findThematicNews(s.secteur, weeklyArticlesForMovers) : [];
    return `<div class="card" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:10px;">
        <div><strong>${s.nom}</strong> <span class="mono" style="font-size:11px;color:var(--text-dim);">${s.ticker}</span> · <span style="font-size:12px;color:var(--text-dim);">${s.secteur}</span></div>
        <span class="mono" style="font-size:15px;color:${s.variation>=0?'var(--emerald)':'var(--bordeaux)'};">${s.variation>=0?'+':''}${s.variation}%</span>
      </div>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">${renderDataBadge('fait')} Variation du jour, cotation différée Yahoo Finance.</p>
      ${related.length
        ? `<p style="font-size:12.5px;margin-top:6px;">${renderDataBadge('analyse')} Actualité de la semaine sur le même secteur (proximité de thème, pas une cause confirmée) : <a href="actualites.html#${related[0].slug}" style="color:var(--gold-bright);">${related[0].titre}</a></p>`
        : `<p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${renderDataBadge('avis')} Aucun facteur unique ne peut être confirmé à partir des informations disponibles ici.</p>`}
    </div>`;
  }).join('');
}
// Chargé une fois (pas de nouvel appel réseau à chaque rafraîchissement de
// cotation) : /api/weekly-news est déjà utilisé ailleurs sur le site
// (actualites.html, action.js), aucune nouvelle fonction serverless.
if(location.protocol !== 'file:'){
  fetch('/api/weekly-news')
    .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(payload => { weeklyArticlesForMovers = payload.articles || []; renderMarketMovers(); })
    .catch(err => { console.info('Likanza Academy — actualités liées indisponibles pour "Ce qui bouge" :', err.message); });
}

// ---------- 📅 À surveiller : contenu pédagogique évergreen (types
// d'événements qui peuvent influencer un marché), explicitement PAS un
// calendrier daté — aucune source de calendrier financier n'est
// actuellement intégrée au site (voir rapport final du chantier). ----------
const MARKET_WATCH_ITEMS = [
  {label: 'Publication de résultats trimestriels', desc: "Peut faire varier fortement un cours si les chiffres surprennent, en bien ou en mal, par rapport aux attentes du marché."},
  {label: 'Décision de taux d\'une banque centrale', desc: "Influence le coût du crédit dans toute l'économie : peut peser sur l'ensemble des marchés, pas seulement un titre précis."},
  {label: 'Publication de l\'inflation', desc: "Peut influencer les anticipations sur les décisions futures des banques centrales."},
  {label: 'Révision de la guidance par une entreprise', desc: "Un changement de prévisions peut avoir plus d'impact sur le cours que les résultats du trimestre eux-mêmes."},
  {label: 'Rapport sur l\'emploi', desc: "Indicateur suivi de près pour juger de la santé économique générale."}
];
function renderMarketWatch(){
  const body = document.getElementById('marketWatchBody');
  if(!body) return;
  body.innerHTML = `
    <p class="disclaimer-box" style="margin-bottom:14px;">Ceci n'est pas un calendrier daté (aucune date de publication réelle n'est actuellement récupérée par Likanza) — une explication du type d'événement qui peut influencer un marché, à consulter avec l'actualité réelle de la page <a href="actualites.html" style="color:var(--gold-bright);">Actualités</a>.</p>
    <div class="card-grid">${MARKET_WATCH_ITEMS.map(i => `
      <div class="card"><h4>${i.label}</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${i.desc}</p></div>`).join('')}
    </div>`;
}

// ---------- Cotations live (/api/stock-quotes) : fusion sur STOCKS_DEMO, repli silencieux ----------
function applyLiveStockQuotes(quotes){
  let applied = 0;
  quotes.forEach(q=>{
    const s = STOCKS_DEMO.find(x=>x.ticker===q.symbol);
    if(!s || typeof q.price !== 'number' || typeof q.changePercent !== 'number') return;
    s.prix = q.price;
    s.variation = Math.round(q.changePercent * 10) / 10;
    if(Array.isArray(q.history) && q.history.length >= 2) s.history = q.history;
    s._live = true;
    applied++;
  });
  return applied;
}
function refreshAllStockViews(){
  renderStockGrid();
  renderCompareChecks();
  renderCompare();
  renderScenSelect();
  renderScenTechContext();
  renderAnalystScenarios();
  updateScenario();
  renderMarketOfDay();
  renderMarketMovers();
  renderScreener();
  renderPortfolioTab();
}

// Charge les fondamentaux réels de TOUTE valeur suivie (pas seulement les 8
// démo, coeur du chantier "supprimer la logique 8 actions premium + le reste
// au prix seul") puis rafraîchit — jamais un repli sur un champ fictif en cas
// d'échec (loadCompanyFundamentals laisse `null` en cache, voir data.js).
// Depuis la Phase 2, ne demande ces fondamentales que pour les actions
// (assetType==='stock') : un ETF/une paire Forex n'a pas de fondamentales
// d'entreprise, /api/company-profile échouerait ou renverrait du bruit pour
// ces symboles — les consommateurs (Screener/Comparateur) affichent déjà
// FUNDAMENTALS_UNAVAILABLE_TEXT quand companyFundamentalsCache[ticker] n'a
// jamais été demandé, sans code de dégradation supplémentaire à écrire ici.
function loadFundamentalsAndRefresh(){
  if(location.protocol === 'file:') return Promise.resolve();
  const stockSymbols = getFollowedStocks().filter(s => (s.assetType || 'stock') === 'stock').map(s => s.symbol);
  return loadCompanyFundamentals(stockSymbols)
    .then(() => refreshAllStockViews())
    .catch(err => {
      console.info('Likanza Academy — fondamentaux réels indisponibles :', err.message);
    });
}

// ================= Rendu initial (données de démonstration) =================
refreshAllStockViews();
updateDcaVsLump();
renderMarketWatch();

// ================= Cotations réelles (dégradation silencieuse si indisponibles) =================
if(location.protocol !== 'file:'){
  // range=6mo : nécessaire pour que computeTechnicalIndicators (indicateurs
  // techniques, Fiches actions) dispose d'assez d'historique pour de vraies
  // moyennes mobiles 20/50 jours sur les 8 valeurs de démonstration — le
  // défaut 5j de l'API ne suffirait qu'au plus haut/bas de période.
  fetch('/api/stock-quotes?range=6mo')
    .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(payload=>{
      if(!payload || !Array.isArray(payload.quotes) || !payload.quotes.length) return;
      if(applyLiveStockQuotes(payload.quotes) > 0) refreshAllStockViews();
    })
    .catch(err=>{
      console.info('Likanza Academy — cotations actions en direct indisponibles, valeurs de démonstration affichées :', err.message);
    });

  loadFundamentalsAndRefresh();
}

// ---------- Cours en direct des actions ajoutées par recherche (/api/custom-quotes) ----------
// Alimente aussi followedQuotesCache (scripts/data.js), partagé avec
// resolveFollowedAsset : Comparateur/Scénarios/Dividendes/action.js peuvent
// ainsi lire le prix/historique de n'importe quelle valeur suivie non-démo,
// pas seulement l'afficher une fois dans cette grille.
function loadCustomQuotesForGrid(list){
  const liteSymbols = list.filter(e => !STOCKS_DEMO.find(s=>s.ticker===e.symbol)).map(e=>e.symbol);
  if(liteSymbols.length === 0 || location.protocol === 'file:') return;
  // range=6mo (au lieu du défaut 5j de l'API) : nécessaire pour que
  // computeTechnicalIndicators dispose d'assez d'historique pour calculer de
  // vraies moyennes mobiles 20/50 jours (tech-${symbol} ci-dessous), pas
  // seulement un plus haut/bas sur quelques séances.
  fetch('/api/custom-quotes?symbols=' + encodeURIComponent(liteSymbols.join(',')) + '&range=6mo')
    .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(payload=>{
      let appliedAny = false;
      (payload.quotes || []).forEach(q=>{
        if(typeof q.price === 'number'){
          followedQuotesCache[q.symbol] = {price: q.price, changePercent: q.changePercent, history: q.history};
          appliedAny = true;
        }
        const quoteEl = document.getElementById(`quote-${q.symbol}`);
        if(quoteEl && typeof q.price === 'number'){
          quoteEl.innerHTML = `<span class="mono" style="font-size:18px;color:var(--text);">${q.price.toFixed(2)} ${q.currency==='EUR'?'€':q.currency}</span><span class="mono" style="color:${q.changePercent>=0?'var(--emerald)':'var(--bordeaux)'}">${q.changePercent>=0?'+':''}${q.changePercent.toFixed(2)}%</span>`;
        }
        const trendEl = document.getElementById(`trend-${q.symbol}`);
        if(trendEl) trendEl.innerHTML = renderTrendHtml(computeTrendIndicator(q.history));
        const techEl = document.getElementById(`tech-${q.symbol}`);
        if(techEl) techEl.innerHTML = renderTechIndicatorsHtml(q.history, q.currency==='EUR'?'€':q.currency);
      });
      // Une fois les cotations en cache, le Comparateur/Scénarios peuvent
      // afficher un vrai prix pour ces valeurs (pas seulement la grille).
      if(appliedAny){ renderCompare(); renderScenTechContext(); renderAnalystScenarios(); updateScenario(); renderScreener(); }
    })
    .catch(err=>{
      console.info('Likanza Academy — cours en direct indisponibles pour les actions suivies :', err.message);
      liteSymbols.forEach(sym=>{
        const el = document.getElementById(`quote-${sym}`);
        if(el) el.innerHTML = `<span style="color:var(--text-dim);font-size:12.5px;">Cours momentanément indisponible.</span>`;
      });
    });
}

// wireStockSearch (recherche + ajout d'une action suivie) vit maintenant dans
// scripts/data.js — réutilisée aussi par dividende.html, pas seulement par
// cette page. Ici, on ne fournit que le rafraîchissement propre à bourse.js.
wireStockSearch(document.getElementById('stockSearchInput'), document.getElementById('stockSearchResults'), () => {
  refreshAllStockViews();
  loadFundamentalsAndRefresh();
});
// Sur le Comparateur, la valeur ajoutée est automatiquement cochée pour
// comparaison immédiate — refreshAllStockViews() a déjà reconstruit
// compareChecks de façon synchrone au moment où ce callback s'exécute.
wireStockSearch(document.getElementById('compareSearchInput'), document.getElementById('compareSearchResults'), (symbol) => {
  refreshAllStockViews();
  loadFundamentalsAndRefresh();
  const cb = checksEl.querySelector(`input[value="${symbol}"]`);
  if(cb){ cb.checked = true; renderCompare(); }
});

const resetStocksBtn = document.getElementById('resetStocksBtn');
if(resetStocksBtn) resetStocksBtn.addEventListener('click', ()=>{
  resetFollowedStocks();
  refreshAllStockViews();
});

// ---------- Portefeuille réel (déclaratif) : les cours actuels réutilisent
// resolveFollowedAsset, déjà alimenté par les cotations live ci-dessus
// (applyLiveStockQuotes/loadCustomQuotesForGrid) — aucun nouvel appel réseau
// dédié à ce tableau. L'action choisie via la recherche devient aussi une
// valeur suivie (même wireStockSearch que partout ailleurs), pour que son
// cours se rafraîchisse automatiquement comme les autres. ----------
let portfolioSelectedSymbol = null;
let portfolioSelectedName = null;

function renderPortfolioTab(){
  const positionsEl = document.getElementById('portfolioPositions');
  const listEl = document.getElementById('portfolioTransactionsList');
  if(!positionsEl && !listEl) return;
  const transactions = getRealPortfolio();
  const livePrices = {};
  [...new Set(transactions.map(t => t.ticker))].forEach(ticker => {
    const s = resolveFollowedAsset(ticker);
    if(typeof s.prix === 'number') livePrices[ticker] = s.prix;
  });
  const positions = computeRealPortfolioPositions(transactions, livePrices);
  const totals = computeRealPortfolioTotals(positions);
  if(positionsEl) positionsEl.innerHTML = `<h3>Positions</h3>${renderRealPortfolioHTML(positions, totals)}`;
  if(listEl){
    if(transactions.length === 0){
      listEl.innerHTML = '';
      return;
    }
    const sorted = [...transactions].sort((a, b) => b.buyDate.localeCompare(a.buyDate));
    listEl.innerHTML = `
      <h3>Transactions</h3>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead><tr>
          <th style="text-align:left;padding:6px 8px;">Date</th>
          <th style="text-align:left;padding:6px 8px;">Valeur</th>
          <th style="text-align:right;padding:6px 8px;">Quantité</th>
          <th style="text-align:right;padding:6px 8px;">Prix d'achat</th>
          <th style="padding:6px 8px;"></th>
        </tr></thead>
        <tbody>${sorted.map(t => `<tr>
          <td style="padding:6px 8px;">${new Date(t.buyDate).toLocaleDateString('fr-FR')}</td>
          <td style="padding:6px 8px;">${t.name}</td>
          <td style="text-align:right;padding:6px 8px;">${t.quantity}</td>
          <td style="text-align:right;padding:6px 8px;">${t.buyPrice.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</td>
          <td style="text-align:right;padding:6px 8px;"><button type="button" class="pill" data-remove-tx="${t.id}" style="cursor:pointer;">Supprimer</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    listEl.querySelectorAll('[data-remove-tx]').forEach(btn => btn.addEventListener('click', () => {
      removeRealPortfolioTransaction(btn.dataset.removeTx);
      renderPortfolioTab();
    }));
  }
}

wireStockSearch(document.getElementById('portfolioSearchInput'), document.getElementById('portfolioSearchResults'), (symbol) => {
  portfolioSelectedSymbol = symbol;
  const followed = getFollowedStocks().find(s => s.symbol === symbol);
  portfolioSelectedName = followed ? followed.name : symbol;
  const selEl = document.getElementById('portfolioSelectedStock');
  if(selEl) selEl.textContent = `Action sélectionnée : ${portfolioSelectedName} (${symbol})`;
  loadFundamentalsAndRefresh();
});

const portfolioAddBtn = document.getElementById('portfolioAddBtn');
if(portfolioAddBtn) portfolioAddBtn.addEventListener('click', () => {
  const errEl = document.getElementById('portfolioFormError');
  const qtyEl = document.getElementById('portfolioQty');
  const priceEl = document.getElementById('portfolioPrice');
  const dateEl = document.getElementById('portfolioDate');
  const qty = parseFloat(qtyEl.value);
  const price = parseFloat(priceEl.value);
  const date = dateEl.value;
  if(!portfolioSelectedSymbol){ if(errEl) errEl.textContent = "Choisis d'abord une action réelle dans la recherche ci-dessus."; return; }
  if(!(qty > 0)){ if(errEl) errEl.textContent = 'Renseigne une quantité réelle supérieure à 0.'; return; }
  if(!(price > 0)){ if(errEl) errEl.textContent = "Renseigne un prix d'achat réel supérieur à 0."; return; }
  if(!date){ if(errEl) errEl.textContent = 'Renseigne la date réelle de la transaction.'; return; }
  if(errEl) errEl.textContent = '';
  saveRealPortfolioTransaction({ticker: portfolioSelectedSymbol, name: portfolioSelectedName, quantity: qty, buyPrice: price, buyDate: date});
  qtyEl.value = ''; priceEl.value = ''; dateEl.value = '';
  portfolioSelectedSymbol = null; portfolioSelectedName = null;
  const selEl = document.getElementById('portfolioSelectedStock');
  if(selEl) selEl.textContent = 'Aucune action sélectionnée.';
  renderPortfolioTab();
});

renderPortfolioTab();

// ---------- Onglet "Autres marchés" : ETF, Obligations, Indices, Forex,
// Matières premières, Taux (extension du prompt "refonte Bourse", phase 1).
// Chaque tuile s'appuie sur MARKET_DATA, chargé à la demande uniquement à
// l'ouverture de cet onglet (voir loadMarketCategoryQuotes, scripts/data.js) —
// jamais dans le poll global du bandeau. "Voir tout" renvoie vers marche.html,
// dont les valeurs "sœurs" (renderMarcheSiblings) sont désormais filtrées par
// assetType : cette fiche fait donc office de liste complète par catégorie,
// sans avoir à construire un second composant de liste ici. ----------
function renderMarketHubMiniRows(items){
  if(!items.length) return `<p style="font-size:12px;color:var(--text-dim);">Aucune valeur dans cette catégorie.</p>`;
  return items.slice(0,3).map(m=>{
    const val = m.statut === 'reel' ? `${m.valeur}${m.unite ? ' ' + m.unite : ''}` : '…';
    const varia = m.sens === 'na' ? '' : `<span class="${m.sens}" style="font-size:11.5px;">${m.variation}</span>`;
    return `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12.5px;margin-top:5px;">
      <span>${m.nom}</span><span class="mono" style="display:flex;gap:6px;align-items:center;">${val} ${varia}</span>
    </div>`;
  }).join('');
}
function renderMarketsHub(){
  const el = document.getElementById('marketsHubGrid');
  if(!el) return;
  const categories = [
    {icon:'📦', title:'ETF', desc:'Frais, composition et encours réels du fonds', items: MARKET_DATA.filter(m=>m.assetType==='etf')},
    {icon:'💵', title:'Obligations', desc:'Courbe des taux et ETF obligataires réels', items: MARKET_DATA.filter(m=>m.assetType==='etf' && m.categorie==='Obligataire')},
    {icon:'📊', title:'Indices', desc:'Grands indices boursiers mondiaux', items: MARKET_DATA.filter(m=>m.assetType==='index')},
    {icon:'💱', title:'Forex', desc:'Principales paires de devises', items: MARKET_DATA.filter(m=>m.assetType==='forex')},
    {icon:'🛢️', title:'Matières premières', desc:'Énergie, métaux, agriculture', items: MARKET_DATA.filter(m=>m.assetType==='commodity')},
    {icon:'🏦', title:'Taux', desc:'Courbe des taux US (référence mondiale)', items: MARKET_DATA.filter(m=>m.assetType==='rate')},
  ];
  el.innerHTML = categories.map(cat => `
    <div class="card">
      <span class="icon">${cat.icon}</span>
      <h3 style="margin:8px 0 4px;">${cat.title}</h3>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">${cat.desc}</p>
      <div>${renderMarketHubMiniRows(cat.items)}</div>
      ${cat.items.length ? `<a href="marche.html#${encodeURIComponent(cat.items[0].symbol)}" class="btn btn-sm" style="margin-top:12px;">Voir tout →</a>` : ''}
    </div>`).join('');
  renderRatesAndBondsExtra('marketsHubExtra');

  // Chargement à la demande, une seule fois par page : une fois chargé, le
  // statut d'une entrée passe à 'reel' et n'est plus proposé au rechargement.
  const pending = [...FOREX_PAIRS, ...EXTRA_INDICES, ...EXTRA_COMMODITIES, ...YIELD_CURVE_TICKERS, ...ETF_CATALOG]
    .filter(m => m.statut === 'chargement')
    .map(m => m.symbol);
  if(pending.length) loadMarketCategoryQuotes(pending);
}
document.addEventListener('fzr:quotes-updated', () => {
  if(bourseActiveTab === 'tab-marches') safeRun('onglet Autres marchés (cotations)', renderMarketsHub);
});

// Taux de dépôt BCE (réel, /api/eco-rate — jusqu'ici inutilisé sur aucune
// page du site) + pédagogie prix/rendement obligataire (calcul en pur,
// jamais une cotation d'obligation individuelle inventée : aucune source
// retail disponible pour ça, voir le plan).
function renderRatesAndBondsExtra(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `<div class="card"><p style="font-size:12.5px;color:var(--text-dim);">Chargement du taux de dépôt BCE…</p></div>`;
  fetch('/api/eco-rate')
    .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data=>{
      el.innerHTML = `
        <div class="card">
          <span class="smallcaps">🏦 Taux de dépôt BCE</span>
          <div class="result-big" style="margin-top:8px;">${data.rate} %</div>
          <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">Source : ${data.source}${data.asOf ? ' · au ' + data.asOf : ''}</p>
        </div>
        <div class="card" style="margin-top:14px;">
          <h3>Pourquoi le prix d'une obligation baisse quand les taux montent ?</h3>
          <div style="margin-top:8px;">${renderDataBadge('calcul')}</div>
          ${renderMethodologyPanel({
            calcul: "Une obligation existante verse un coupon fixe, décidé à son émission. Si les taux du marché montent, les nouvelles obligations émises offrent un coupon plus élevé — l'ancienne, moins attractive, doit baisser de prix pour offrir à un nouvel acheteur un rendement comparable.",
            donnees: "Exemple chiffré (calcul simplifié, obligation perpétuelle sans échéance) : une obligation de 1000 € versant un coupon fixe de 3 %/an (30 €/an). Si le taux de marché passe à 5 %, un acheteur exige un rendement équivalent : prix ≈ 30 ÷ 0,05 = 600 €, soit une baisse d'environ 40 %.",
            hypotheses: "Exemple simplifié à titre pédagogique — une obligation réelle a une échéance fixe et revient à sa valeur nominale au remboursement ; sa sensibilité réelle au taux (duration) dépend de la maturité restante.",
            limites: "Aucune cotation d'obligation individuelle n'est disponible via notre source de données (marché de gré à gré, peu accessible aux particuliers) : la courbe des taux ci-dessus et les ETF obligataires ci-contre (catégorie Obligations) sont les substituts réels utilisés sur cette page.",
            comprendre: "Plus la maturité d'une obligation est longue, plus son prix est sensible aux variations de taux (duration élevée) — c'est pourquoi un ETF obligataire long terme (ex. TLT, 20 ans et plus) bouge davantage qu'un ETF obligataire toutes échéances (ex. AGG) pour une même variation de taux."
          })}
        </div>`;
    })
    .catch(err=>{
      el.innerHTML = `<div class="card"><p style="font-size:12.5px;color:var(--text-dim);">Taux BCE indisponible pour le moment (${err.message}).</p></div>`;
    });
}

// ---------- Onglet "Options" : payoff à l'échéance (computeOptionPayoff/
// computeOptionMetrics/renderPayoffDiagramSVG, scripts/data.js) à partir
// d'hypothèses saisies par l'utilisateur — jamais un prix théorique d'option
// avant échéance (qui exigerait une hypothèse de volatilité invérifiable),
// uniquement la mécanique certaine du payoff contractuel. ----------
function renderOptionsSimulator(){
  const strikeEl = document.getElementById('optStrike');
  if(!strikeEl) return;
  const ids = ['optType', 'optPosition', 'optStrike', 'optPremium'];

  function update(){
    const optionType = document.getElementById('optType').value;
    const position = document.getElementById('optPosition').value;
    const strike = +document.getElementById('optStrike').value || 0;
    const premium = +document.getElementById('optPremium').value || 0;

    const resultEl = document.getElementById('optResult');
    const metrics = computeOptionMetrics(optionType, position, strike, premium);
    if(!metrics){
      resultEl.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Hypothèses invalides : le prix d'exercice et la prime doivent être positifs ou nuls.</p>`;
      document.getElementById('optChart').innerHTML = '';
      return;
    }
    const optionLabel = optionType === 'call' ? 'call' : 'put';
    const positionLabel = position === 'long' ? 'acheteur' : 'vendeur';
    const fmtMax = v => v === null ? 'Illimité' : fmtEUR(v);

    resultEl.innerHTML = `
      ${renderDataBadge('calcul')}
      <div class="result-row" style="margin-top:10px;">
        <span>Seuil de rentabilité (breakeven)</span><span class="mono">${fmtEUR(metrics.breakeven)}</span>
      </div>
      <div class="result-row">
        <span>Gain maximal</span><span class="mono" style="color:var(--emerald);">${fmtMax(metrics.maxGain)}</span>
      </div>
      <div class="result-row">
        <span>Perte maximale</span><span class="mono" style="color:var(--bordeaux);">${fmtMax(metrics.maxLoss)}</span>
      </div>
      <p style="font-size:13px;margin-top:14px;color:var(--text-dim);">En tant que <strong style="color:var(--text);">${positionLabel}</strong> de ce <strong style="color:var(--text);">${optionLabel}</strong>, ton résultat à l'échéance dépend uniquement du prix de l'actif sous-jacent à ce moment-là — jamais de son évolution avant l'échéance.</p>
      ${metrics.maxLoss === null || metrics.maxGain === null ? `<p class="disclaimer-box" style="margin-top:10px;">${metrics.maxLoss === null ? 'En tant que vendeur, ta perte n\'est théoriquement pas plafonnée' : 'Ton gain n\'est théoriquement pas plafonné'} — un profil de risque très différent de l'achat d'une action classique, où la perte reste toujours limitée à la mise investie.</p>` : ''}
      ${renderMethodologyPanel({
        calcul: "Valeur intrinsèque à l'échéance : max(prix de l'actif − prix d'exercice, 0) pour un call, max(prix d'exercice − prix de l'actif, 0) pour un put. Payoff acheteur = valeur intrinsèque − prime payée. Payoff vendeur = prime reçue − valeur intrinsèque (l'exact opposé, prime en moins).",
        donnees: `Calcul à partir de tes hypothèses saisies ci-contre : prix d'exercice de ${fmtEUR(strike)}, prime de ${fmtEUR(premium)} — jamais une cotation d'option réelle, uniquement les valeurs que tu as saisies.`,
        hypotheses: "L'option est supposée conservée jusqu'à son échéance et exercée ou non selon son intérêt à ce moment précis — aucun ajustement ni clôture anticipée de la position n'est pris en compte.",
        limites: "Ceci ne calcule jamais le prix théorique d'une option AVANT son échéance (un tel calcul, type Black-Scholes, exigerait une hypothèse de volatilité future invérifiable) — uniquement son payoff certain une fois l'échéance atteinte, à un prix du sous-jacent donné.",
        comprendre: "Le seuil de rentabilité (breakeven) est le prix du sous-jacent à partir duquel la position devient profitable une fois la prime prise en compte — toujours décalé du prix d'exercice par le montant de la prime."
      })}`;

    const priceMin = Math.max(0, strike * 0.5);
    const priceMax = strike * 1.5 + premium * 2;
    document.getElementById('optChart').innerHTML = renderPayoffDiagramSVG(optionType, position, strike, premium, priceMin, priceMax);
  }

  ids.forEach(id => document.getElementById(id).addEventListener('input', update));
  ids.forEach(id => document.getElementById(id).addEventListener('change', update));
  update();
  tryAwardQuizPoints(`options-lab-${new Date().toDateString()}`, 8, {usedSimulator: true});
}
safeRun('simulateur Options', renderOptionsSimulator);

// ---------- Onglet "Paper Trading" : argent fictif, exécuté à de vrais cours
// en direct (executePaperTrade/computePaperTradingPositions, scripts/data.js).
// Univers négociable = les valeurs déjà suivies (getFollowedStocks), actions
// ET actifs de marché (resolveFollowedAsset, généralisé Phase 2) — aucun
// nouveau système de recherche construit ici. ----------
function renderPaperTradingSymbolOptions(){
  const sel = document.getElementById('ptSymbol');
  if(!sel) return;
  const previous = sel.value;
  const list = getFollowedStocks();
  sel.innerHTML = list.map(entry => `<option value="${entry.symbol}">${entry.name} (${entry.symbol})</option>`).join('');
  if(previous && list.some(e => e.symbol === previous)) sel.value = previous;
}
function renderPaperTradingQuote(){
  const sel = document.getElementById('ptSymbol');
  const quoteEl = document.getElementById('ptQuote');
  if(!sel || !quoteEl || !sel.value){ if(quoteEl) quoteEl.textContent = ''; return; }
  const asset = resolveFollowedAsset(sel.value);
  if(typeof asset.prix !== 'number'){
    quoteEl.textContent = 'Cours actuel indisponible pour le moment.';
    return;
  }
  const unite = typeof asset.unite === 'string' && asset.unite ? asset.unite : '€';
  quoteEl.textContent = `Cours actuel : ${asset.prix.toFixed(2)} ${unite}`;
}
function renderPaperTradingSummary(){
  const el = document.getElementById('paperTradingSummary');
  if(!el) return;
  const state = getPaperTradingState();
  const livePrices = {};
  state.transactions.forEach(tx => {
    const asset = resolveFollowedAsset(tx.symbol);
    if(typeof asset.prix === 'number') livePrices[tx.symbol] = asset.prix;
  });
  const {positions, realizedGainTotal} = computePaperTradingPositions(state.transactions, livePrices);
  const known = positions.filter(p => p.currentValue !== null);
  const positionsValue = known.length === positions.length ? known.reduce((s, p) => s + p.currentValue, 0) : null;
  const totalValue = positionsValue !== null ? state.cash + positionsValue : null;
  const unrealizedTotal = known.length === positions.length ? known.reduce((s, p) => s + p.unrealizedGain, 0) : null;

  el.innerHTML = `
    <div class="card"><span class="smallcaps">Cash disponible</span><div class="result-big" style="margin-top:6px;">${fmtEUR(state.cash)}</div></div>
    <div class="card"><span class="smallcaps">Valeur totale simulée</span><div class="result-big" style="margin-top:6px;">${totalValue !== null ? fmtEUR(totalValue) : FUNDAMENTALS_UNAVAILABLE_TEXT}</div></div>
    <div class="card"><span class="smallcaps">P&amp;L latent (positions ouvertes)</span><div class="result-big" style="margin-top:6px;color:${unrealizedTotal === null ? 'var(--text-dim)' : unrealizedTotal >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};">${unrealizedTotal !== null ? (unrealizedTotal >= 0 ? '+' : '') + fmtEUR(unrealizedTotal) : FUNDAMENTALS_UNAVAILABLE_TEXT}</div></div>
    <div class="card"><span class="smallcaps">P&amp;L réalisé (ventes déjà passées)</span><div class="result-big" style="margin-top:6px;color:${realizedGainTotal >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};">${realizedGainTotal >= 0 ? '+' : ''}${fmtEUR(realizedGainTotal)}</div></div>`;
}
function renderPaperTradingPositions(){
  const el = document.getElementById('paperTradingPositions');
  if(!el) return;
  const state = getPaperTradingState();
  const livePrices = {};
  state.transactions.forEach(tx => {
    const asset = resolveFollowedAsset(tx.symbol);
    if(typeof asset.prix === 'number') livePrices[tx.symbol] = asset.prix;
  });
  const {positions} = computePaperTradingPositions(state.transactions, livePrices);
  if(positions.length === 0){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Aucune position ouverte — passe ton premier ordre ci-dessus.</p>`;
    return;
  }
  const rows = positions.map(p => `
    <tr>
      <td style="padding:6px 8px;">${p.name} <span class="mono" style="font-size:11.5px;color:var(--text-dim);">${p.symbol}</span></td>
      <td style="text-align:right;padding:6px 8px;">${p.qty}</td>
      <td style="text-align:right;padding:6px 8px;">${fmtEUR(p.avgBuyPrice)}</td>
      <td style="text-align:right;padding:6px 8px;">${p.currentPrice !== null ? fmtEUR(p.currentPrice) : FUNDAMENTALS_UNAVAILABLE_TEXT}</td>
      <td style="text-align:right;padding:6px 8px;${p.unrealizedGain !== null ? `color:${p.unrealizedGain >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};` : ''}">${p.unrealizedGain !== null ? `${p.unrealizedGain >= 0 ? '+' : ''}${fmtEUR(p.unrealizedGain)}` : FUNDAMENTALS_UNAVAILABLE_TEXT}</td>
    </tr>`).join('');
  el.innerHTML = `
    <span class="smallcaps">Positions ouvertes (simulation)</span>
    <div style="overflow-x:auto;margin-top:10px;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;">
      <thead><tr>
        <th style="text-align:left;padding:6px 8px;">Valeur</th>
        <th style="text-align:right;padding:6px 8px;">Quantité</th>
        <th style="text-align:right;padding:6px 8px;">Prix moyen</th>
        <th style="text-align:right;padding:6px 8px;">Cours actuel</th>
        <th style="text-align:right;padding:6px 8px;">Gain / perte latent</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}
function renderPaperTradingHistory(){
  const el = document.getElementById('paperTradingHistory');
  if(!el) return;
  const state = getPaperTradingState();
  if(state.transactions.length === 0){ el.innerHTML = ''; return; }
  const sorted = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const rows = sorted.map(tx => `
    <tr>
      <td style="padding:6px 8px;">${new Date(tx.date).toLocaleDateString('fr-FR')}</td>
      <td style="padding:6px 8px;">${tx.name} <span class="mono" style="font-size:11.5px;color:var(--text-dim);">${tx.symbol}</span></td>
      <td style="padding:6px 8px;color:${tx.action === 'buy' ? 'var(--emerald)' : 'var(--bordeaux)'};">${tx.action === 'buy' ? 'Achat' : 'Vente'}</td>
      <td style="text-align:right;padding:6px 8px;">${tx.qty}</td>
      <td style="text-align:right;padding:6px 8px;">${fmtEUR(tx.price)}</td>
      <td style="text-align:right;padding:6px 8px;">${fmtEUR(tx.total)}</td>
    </tr>`).join('');
  el.innerHTML = `
    <span class="smallcaps">Historique des ordres (simulation)</span>
    <div style="overflow-x:auto;margin-top:10px;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;">
      <thead><tr>
        <th style="text-align:left;padding:6px 8px;">Date</th>
        <th style="text-align:left;padding:6px 8px;">Valeur</th>
        <th style="text-align:left;padding:6px 8px;">Ordre</th>
        <th style="text-align:right;padding:6px 8px;">Quantité</th>
        <th style="text-align:right;padding:6px 8px;">Prix</th>
        <th style="text-align:right;padding:6px 8px;">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}
function refreshPaperTradingViews(){
  renderPaperTradingSummary();
  renderPaperTradingPositions();
  renderPaperTradingHistory();
}
function renderPaperTrading(){
  const symbolEl = document.getElementById('ptSymbol');
  if(!symbolEl) return;
  renderPaperTradingSymbolOptions();
  renderPaperTradingQuote();
  refreshPaperTradingViews();

  document.getElementById('ptSymbol').addEventListener('change', renderPaperTradingQuote);
  document.getElementById('ptSubmit').addEventListener('click', () => {
    const feedbackEl = document.getElementById('ptFeedback');
    const symbol = document.getElementById('ptSymbol').value;
    const action = document.getElementById('ptAction').value;
    const qty = +document.getElementById('ptQty').value || 0;
    if(!symbol){ feedbackEl.textContent = 'Ajoute d\'abord au moins une valeur suivie (depuis Fiches actions ou Autres marchés).'; feedbackEl.style.color = 'var(--bordeaux)'; return; }
    const asset = resolveFollowedAsset(symbol);
    if(typeof asset.prix !== 'number'){
      feedbackEl.textContent = 'Cours actuel indisponible pour le moment — réessaie une fois la cotation chargée.';
      feedbackEl.style.color = 'var(--bordeaux)';
      return;
    }
    // Réalisé AVANT l'ordre (méthode du coût moyen pondéré, computePaperTradingPositions)
    // pour isoler le gain propre à CE trade précis, jamais un total cumulé — nécessaire
    // pour le badge "Premier gain réalisé" ci-dessous.
    const realizedBefore = computePaperTradingPositions(getPaperTradingState().transactions, {}).realizedGainTotal;
    const result = executePaperTrade(symbol, asset.nom, asset.assetType, action, qty, asset.prix);
    if(!result.ok){
      feedbackEl.textContent = result.reason;
      feedbackEl.style.color = 'var(--bordeaux)';
      return;
    }
    feedbackEl.textContent = `${action === 'buy' ? 'Achat' : 'Vente'} de ${qty} ${asset.nom} exécuté${qty>1?'s':''} à ${asset.prix.toFixed(2)} ${asset.unite || '€'} (simulation).`;
    feedbackEl.style.color = 'var(--emerald)';
    refreshPaperTradingViews();
    tryAwardQuizPoints(`paper-trading-${new Date().toDateString()}`, 8, {usedSimulator: true});
    // Badges Paper Trading : jamais soumis au throttle quotidien de
    // tryAwardQuizPoints ci-dessus (sinon un 2e trade le même jour, potentiellement
    // le premier avec un vrai gain réalisé, ne déclencherait jamais "Premier gain réalisé").
    const realizedAfter = computePaperTradingPositions(result.state.transactions, {}).realizedGainTotal;
    checkBadges(getGamification(), {paperTradeExecuted: true, paperRealizedGain: realizedAfter - realizedBefore});
  });
  document.getElementById('ptReset').addEventListener('click', () => {
    if(!confirm('Réinitialiser la simulation de Paper Trading ? Toutes les positions et l\'historique fictifs seront effacés.')) return;
    resetPaperTradingState();
    refreshPaperTradingViews();
  });
}
document.addEventListener('fzr:quotes-updated', () => {
  if(bourseActiveTab === 'tab-paper-trading') safeRun('Paper Trading (cotations)', refreshPaperTradingViews);
});
safeRun('Paper Trading', renderPaperTrading);
