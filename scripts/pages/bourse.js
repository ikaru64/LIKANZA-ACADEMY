// ================= Navigation par onglets (même pattern que index.html) =================
const BOURSE_TABS = [
  {id:'tab-marche-jour', title:'Marché du jour', desc:'Hausses, baisses, sélection', icon:'star'},
  {id:'tab-fiches', title:'Fiches actions', desc:'8 valeurs suivies', icon:'list'},
  {id:'tab-comparateur', title:'Comparateur', desc:'2 à 5 titres', icon:'scale'},
  {id:'tab-scenarios', title:'Scénarios', desc:'Estimation, pas une prédiction', icon:'target'},
  {id:'tab-dca', title:'DCA vs unique', desc:'Impact du timing', icon:'banknote'},
  {id:'tab-dividendes', title:'Dividendes', desc:'Rendement + réinvestissement', icon:'coins'}
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
}
renderBourseTabs();
setBourseTab(bourseActiveTab);
window.addEventListener('hashchange', ()=>{
  const tab = location.hash.slice(1);
  const target = document.getElementById(tab);
  if(target && target.classList.contains('home-tab-panel')) setBourseTab(tab);
});

// ---------- Fiches actions (liste modifiable : STOCKS_DEMO + actions ajoutées par recherche) ----------
function renderTrendHtml(trend){
  if(!trend) return '';
  return `<p style="font-size:11.5px;color:${trend.changePct>=0?'var(--emerald)':'var(--bordeaux)'};margin-top:6px;">Tendance ${trend.days}j : ${trend.changePct>=0?'+':''}${trend.changePct.toFixed(1)}% · ${trend.posLabel}</p>`;
}

function renderStockGrid(){
  const list = getFollowedStocks();
  const metaEl = document.getElementById('stockGridMeta');
  if(metaEl) metaEl.textContent = `${list.length} valeur${list.length>1?'s':''} suivie${list.length>1?'s':''}`;

  document.getElementById('stockGrid').innerHTML = list.map(entry=>{
    const s = STOCKS_DEMO.find(x=>x.ticker===entry.symbol);
    if(s){
      return `
      <div class="card" id="${s.ticker}">
        <span class="smallcaps">${s.secteur} · ${s.pays}</span>
        <h3>${s.nom} <span class="mono" style="font-size:13px;color:var(--text-dim);">${s.ticker}</span></h3>
        <div class="result-row" style="margin:0 0 10px;">
          <span class="mono" style="font-size:18px;color:var(--text);">${s.prix.toFixed(1)} €</span>
          <span class="mono ${s.variation>=0?'up':'down'}" style="color:${s.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${s.variation>=0?'+':''}${s.variation}%</span>
        </div>
        <p>PER ${s.per} · Rendement ${s.dividende}% · Cap. ${s.cap} ${s.pea ? '· <span style="color:var(--emerald)">Éligible PEA</span>' : ''}</p>
        ${renderTrendHtml(computeTrendIndicator(s.history))}
        ${s._live ? `<span class="badge status-reel" style="margin-top:6px;">Cotation différée (Yahoo Finance)</span>` : `<span class="demo-flag" style="margin-top:6px;">Donnée de démonstration</span>`}
        <div class="card-footer">
          <button class="fav-btn" data-fav-id="stock-${s.ticker}" data-fav-title="${s.nom}" data-fav-url="bourse.html#${s.ticker}" data-fav-type="Action">${ICONS.star} Favoris</button>
          <button class="btn btn-sm" data-remove-stock="${s.ticker}">Retirer</button>
        </div>
      </div>`;
    }
    return `
      <div class="card" id="custom-${entry.symbol}">
        <span class="smallcaps">Cours en direct uniquement</span>
        <h3>${entry.name} <span class="mono" style="font-size:13px;color:var(--text-dim);">${entry.symbol}</span></h3>
        <div class="result-row" id="quote-${entry.symbol}" style="margin:0 0 10px;"><span class="mono" style="color:var(--text-dim);">Chargement…</span></div>
        <div id="trend-${entry.symbol}"></div>
        <div class="card-footer">
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
const checksEl = document.getElementById('compareChecks');
checksEl.innerHTML = STOCKS_DEMO.map((s,i)=>`
  <label class="pill" style="display:flex;gap:6px;align-items:center;cursor:pointer;">
    <input type="checkbox" class="compareCheck" value="${s.ticker}" ${i<3?'checked':''} style="accent-color:var(--gold);"> ${s.nom}
  </label>`).join('');

let advancedMode = false;
document.getElementById('modeDebutant').addEventListener('click', e=>{ advancedMode=false; toggleMode(e.target); });
document.getElementById('modeAvance').addEventListener('click', e=>{ advancedMode=true; toggleMode(e.target); });
function toggleMode(btn){
  document.getElementById('modeDebutant').classList.toggle('active', !advancedMode);
  document.getElementById('modeAvance').classList.toggle('active', advancedMode);
  renderCompare();
}

const CRITERIA_BASIC = [
  {key:'prix', label:'Cours', unit:'€', higherBetter:null},
  {key:'variation', label:'Variation du jour', unit:'%', higherBetter:null},
  {key:'per', label:'PER', unit:'×', higherBetter:false},
  {key:'dividende', label:'Rendement dividende', unit:'%', higherBetter:true},
  {key:'cap', label:'Capitalisation', unit:'', higherBetter:null},
  {key:'ca', label:"Chiffre d'affaires", unit:'', higherBetter:null},
];
const CRITERIA_ADV = [
  ...CRITERIA_BASIC,
  {key:'marge_nette', label:'Marge nette', unit:'%', higherBetter:true},
  {key:'roe', label:'ROE', unit:'%', higherBetter:true},
  {key:'dette_ebitda', label:'Dette / EBITDA', unit:'×', higherBetter:false},
];

function renderCompare(){
  const selected = Array.from(document.querySelectorAll('.compareCheck:checked')).map(c=>c.value);
  const table = document.getElementById('compareTable');
  if(selected.length < 2){
    table.innerHTML = '<tr><td style="padding:16px 0;color:var(--text-dim);">Sélectionne au moins 2 actions pour lancer la comparaison.</td></tr>';
    return;
  }
  const stocks = selected.slice(0,5).map(t=>STOCKS_DEMO.find(s=>s.ticker===t));
  const criteria = advancedMode ? CRITERIA_ADV : CRITERIA_BASIC;
  let html = '<tr><th>Critère</th>' + stocks.map(s=>`<th>${s.nom}</th>`).join('') + '</tr>';
  criteria.forEach(c=>{
    const values = stocks.map(s=> typeof s[c.key] === 'number' ? s[c.key] : null);
    let bestIdx = -1;
    if(c.higherBetter !== null){
      const nums = values.filter(v=>v!==null);
      if(nums.length){
        const target = c.higherBetter ? Math.max(...nums) : Math.min(...nums);
        bestIdx = values.indexOf(target);
      }
    }
    html += `<tr><td>${c.label}</td>` + stocks.map((s,i)=>{
      const raw = s[c.key];
      const display = typeof raw === 'number' ? raw + c.unit : raw;
      return `<td class="${i===bestIdx?'best':''}">${display}</td>`;
    }).join('') + '</tr>';
  });
  html += '<tr><td>Éligible PEA</td>' + stocks.map(s=>`<td>${s.pea?'Oui':'Non'}</td>`).join('') + '</tr>';
  html += '<tr><td>Secteur</td>' + stocks.map(s=>`<td>${s.secteur}</td>`).join('') + '</tr>';
  html += '<tr><td>Pays</td>' + stocks.map(s=>`<td>${s.pays}</td>`).join('') + '</tr>';
  table.innerHTML = html;
}
checksEl.addEventListener('change', renderCompare);

// ---------- Scénarios (moteur partagé avec la sélection du jour) ----------
function computeScenarios(stock, growth, perTarget, horizon){
  const bpaActuel = stock.prix / stock.per;
  const defs = {
    defavorable: {growth: growth - 6, per: perTarget * 0.75},
    central: {growth: growth, per: perTarget},
    favorable: {growth: growth + 6, per: perTarget * 1.25}
  };
  const out = {};
  Object.entries(defs).forEach(([key,s])=>{
    const bpaFutur = bpaActuel * Math.pow(1 + s.growth/100, horizon);
    const prixCible = bpaFutur * s.per;
    const variation = ((prixCible / stock.prix) - 1) * 100;
    out[key] = {prixCible, variation};
  });
  return out;
}

const scenSelect = document.getElementById('scenStock');
scenSelect.innerHTML = STOCKS_DEMO.map(s=>`<option value="${s.ticker}">${s.nom}</option>`).join('');
const scenInputs = ['scenGrowth','scenPer','scenHorizon'].map(id=>document.getElementById(id));
function updateScenario(){
  const stock = STOCKS_DEMO.find(s=>s.ticker===scenSelect.value) || STOCKS_DEMO[0];
  if(!stock) return;
  const growth = +document.getElementById('scenGrowth').value;
  const perTarget = +document.getElementById('scenPer').value;
  const horizon = +document.getElementById('scenHorizon').value;
  document.getElementById('valGrowth').textContent = growth + ' %';
  document.getElementById('valPer').textContent = perTarget + '×';
  document.getElementById('valHorizon').textContent = horizon + ' ans';

  const scenarios = computeScenarios(stock, growth, perTarget, horizon);
  const labels = {defavorable:'Scénario défavorable', central:'Scénario central', favorable:'Scénario favorable'};
  let html = '';
  Object.entries(scenarios).forEach(([key,r])=>{
    html += `<div class="result-row" style="justify-content:space-between;width:100%;"><span>${labels[key]}</span><span class="mono" style="color:${r.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${r.prixCible.toFixed(1)} € (${r.variation>=0?'+':''}${r.variation.toFixed(0)}%)</span></div>`;
  });
  document.getElementById('scenResults').innerHTML = `<div class="result-label">Prix théorique estimé dans ${horizon} an(s), cours actuel ${stock.prix} €</div>` + html;

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
  <div class="field"><label>${p} : prix (€)</label><input type="number" class="dcaPrice" data-idx="${i}" value="${defaultPrices[i]}"></div>`).join('');

let dcaUsed = false;
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
  if(!dcaUsed){ dcaUsed = true; awardXP(5, {usedDCA:true}); }
}
[dcaTotalEl].forEach(el=>el.addEventListener('input', updateDcaVsLump));
dcaPricesRowsEl.addEventListener('input', updateDcaVsLump);

// ---------- Simulateur de dividendes ----------
const divSelect = document.getElementById('divStock');
divSelect.innerHTML = STOCKS_DEMO.map(s=>`<option value="${s.ticker}">${s.nom}</option>`).join('');
const divGrowthEl = document.getElementById('divGrowth'), divYearsEl = document.getElementById('divYears'), divReinvestEl = document.getElementById('divReinvest');
function updateDividend(){
  document.getElementById('valDivGrowth').textContent = divGrowthEl.value + ' %';
  document.getElementById('valDivYears').textContent = divYearsEl.value + ' ans';
  const stock = STOCKS_DEMO.find(s=>s.ticker===divSelect.value);
  const growth = +divGrowthEl.value/100;
  const years = +divYearsEl.value;
  const reinvest = divReinvestEl.checked;
  let shareValue = stock.prix;
  let shares = 1;
  let cumDividends = 0;
  const series = [shareValue*shares];
  for(let y=1;y<=years;y++){
    const yieldRate = stock.dividende/100 * Math.pow(1+growth, y-1);
    const dividendPaid = shareValue * shares * yieldRate;
    cumDividends += dividendPaid;
    if(reinvest) shares += dividendPaid/shareValue;
    series.push(shareValue*shares + (reinvest?0:cumDividends));
  }
  const finalValue = series[series.length-1];
  document.getElementById('divResult').innerHTML = `
    <div class="result-label">Valeur totale estimée après ${years} an(s)</div>
    <div class="result-big">${fmtEUR(finalValue)}</div>
    <div class="result-row"><span>Dividendes cumulés : ${fmtEUR(cumDividends)}</span><span>Mode : ${reinvest?'réinvestis':'encaissés'}</span></div>`;
  renderBarChart('divChart','divChartLabels', series, years);
}
[divGrowthEl, divYearsEl, divReinvestEl].forEach(el=>el.addEventListener('input', updateDividend));
divSelect.addEventListener('change', updateDividend);

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
function renderStockRow(s){
  const spark = renderSparklineHTML(s.history, {compact:true});
  return `<a class="market-row" href="bourse.html#${s.ticker}">
    <div>
      <strong>${s.nom}</strong> <span class="mono" style="font-size:11px;color:var(--text-dim);">${s.ticker}</span>
      <div style="font-size:11.5px;color:var(--text-dim);">${s.secteur}</div>
    </div>
    <div class="market-row-spark">${spark}</div>
    <div class="mono market-row-value">
      <div>${s.prix.toFixed(1)} €</div>
      <div style="color:${s.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${s.variation>=0?'+':''}${s.variation}%</div>
    </div>
  </a>`;
}
const BOURSE_LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
function renderMarketOfDay(){
  const body = document.getElementById('marketOfDayBody');
  if(!body) return;
  if(marketOfDayView === 'hausses'){
    body.innerHTML = `<div class="market-row-list">${stocksByChange().slice(0,5).map(renderStockRow).join('')}</div>`;
  } else if(marketOfDayView === 'baisses'){
    body.innerHTML = `<div class="market-row-list">${stocksByChange().slice(-5).reverse().map(renderStockRow).join('')}</div>`;
  } else {
    const idx = dayOfYear() % STOCKS_DEMO.length;
    const idx2 = (idx + 4) % STOCKS_DEMO.length;
    const picks = idx === idx2 ? [STOCKS_DEMO[idx]] : [STOCKS_DEMO[idx], STOCKS_DEMO[idx2]];
    const labels = {defavorable:'Défavorable', central:'Central', favorable:'Favorable'};
    body.innerHTML = picks.map(s=>{
      const scenarios = computeScenarios(s, 6, 18, 5);
      const rows = ['defavorable','central','favorable'].map(key=>{
        const r = scenarios[key];
        return `<div class="result-row" style="justify-content:space-between;width:100%;"><span>${labels[key]}</span><span class="mono" style="color:${r.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${r.prixCible.toFixed(1)} € (${r.variation>=0?'+':''}${r.variation.toFixed(0)}%)</span></div>`;
      }).join('');
      return `<div class="card" style="margin-bottom:14px;">
        <span class="smallcaps">${s.secteur} · ${s.pays}</span>
        <h3>${s.nom} <span class="mono" style="font-size:13px;color:var(--text-dim);">${s.ticker}</span></h3>
        <div class="result-row" style="margin:8px 0;"><span class="mono" style="font-size:16px;">${s.prix.toFixed(1)} €</span><span class="mono" style="color:${s.variation>=0?'var(--emerald)':'var(--bordeaux)'}">${s.variation>=0?'+':''}${s.variation}%</span></div>
        ${rows}
        <p class="disclaimer-box" style="margin-top:10px;">Scénarios pédagogiques basés sur des hypothèses génériques (croissance 6 %, PER cible 18×, horizon 5 ans) : pas une recommandation d'achat ou de vente.</p>
      </div>`;
    }).join('');
  }
  const tip = document.getElementById('marketLevelTip');
  if(tip){
    const lvl = getLevel();
    tip.innerHTML = `<div class="coach-panel"><span class="smallcaps">Pour toi, niveau ${BOURSE_LEVEL_LABELS[lvl] || lvl}</span><p class="coach-msg" style="margin-top:8px;">→ ${MARKET_TIPS[lvl] || MARKET_TIPS.debutant}</p></div>`;
  }
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
  renderCompare();
  updateScenario();
  updateDividend();
  renderMarketOfDay();
}

// ================= Rendu initial (données de démonstration) =================
refreshAllStockViews();
updateDcaVsLump();

// ================= Cotations réelles (dégradation silencieuse si indisponibles) =================
if(location.protocol !== 'file:'){
  fetch('/api/stock-quotes')
    .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(payload=>{
      if(!payload || !Array.isArray(payload.quotes) || !payload.quotes.length) return;
      if(applyLiveStockQuotes(payload.quotes) > 0) refreshAllStockViews();
    })
    .catch(err=>{
      console.info('Likanza Academy — cotations actions en direct indisponibles, valeurs de démonstration affichées :', err.message);
    });
}

// ---------- Cours en direct des actions ajoutées par recherche (/api/custom-quotes) ----------
function loadCustomQuotesForGrid(list){
  const liteSymbols = list.filter(e => !STOCKS_DEMO.find(s=>s.ticker===e.symbol)).map(e=>e.symbol);
  if(liteSymbols.length === 0 || location.protocol === 'file:') return;
  fetch('/api/custom-quotes?symbols=' + encodeURIComponent(liteSymbols.join(',')))
    .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(payload=>{
      (payload.quotes || []).forEach(q=>{
        const quoteEl = document.getElementById(`quote-${q.symbol}`);
        if(quoteEl && typeof q.price === 'number'){
          quoteEl.innerHTML = `<span class="mono" style="font-size:18px;color:var(--text);">${q.price.toFixed(2)} ${q.currency==='EUR'?'€':q.currency}</span><span class="mono" style="color:${q.changePercent>=0?'var(--emerald)':'var(--bordeaux)'}">${q.changePercent>=0?'+':''}${q.changePercent.toFixed(2)}%</span>`;
        }
        const trendEl = document.getElementById(`trend-${q.symbol}`);
        if(trendEl) trendEl.innerHTML = renderTrendHtml(computeTrendIndicator(q.history));
      });
    })
    .catch(err=>{
      console.info('Likanza Academy — cours en direct indisponibles pour les actions suivies :', err.message);
      liteSymbols.forEach(sym=>{
        const el = document.getElementById(`quote-${sym}`);
        if(el) el.innerHTML = `<span style="color:var(--text-dim);font-size:12.5px;">Cours momentanément indisponible.</span>`;
      });
    });
}

// ---------- Recherche d'action à ajouter (/api/stock-search) ----------
const stockSearchInput = document.getElementById('stockSearchInput');
const stockSearchResults = document.getElementById('stockSearchResults');
let stockSearchTimer = null;
if(stockSearchInput){
  stockSearchInput.addEventListener('input', ()=>{
    clearTimeout(stockSearchTimer);
    const q = stockSearchInput.value.trim();
    if(q.length < 2){ stockSearchResults.innerHTML = ''; return; }
    stockSearchTimer = setTimeout(()=>{
      fetch('/api/stock-search?q=' + encodeURIComponent(q))
        .then(r=>r.json())
        .then(payload=>{
          const results = payload.results || [];
          if(results.length === 0){
            stockSearchResults.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Aucun résultat.</p>`;
            return;
          }
          stockSearchResults.innerHTML = results.map(r=>
            `<button class="pill" style="display:block;width:100%;text-align:left;margin-bottom:6px;" data-add-symbol="${r.symbol}" data-add-name="${r.name.replace(/"/g,'&quot;')}">${r.name} <span class="mono" style="color:var(--text-dim);">${r.symbol} · ${r.exchange}</span></button>`
          ).join('');
          stockSearchResults.querySelectorAll('[data-add-symbol]').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              addFollowedStock({symbol: btn.dataset.addSymbol, name: btn.dataset.addName});
              stockSearchInput.value = '';
              stockSearchResults.innerHTML = '';
              refreshAllStockViews();
            });
          });
        })
        .catch(()=>{ stockSearchResults.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Recherche momentanément indisponible.</p>`; });
    }, 300);
  });
}

const resetStocksBtn = document.getElementById('resetStocksBtn');
if(resetStocksBtn) resetStocksBtn.addEventListener('click', ()=>{
  resetFollowedStocks();
  refreshAllStockViews();
});
