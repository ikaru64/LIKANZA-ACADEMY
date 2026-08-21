/* ============================================================
   LIKANZA ACADEMY — Dividend Intelligence (dividende.html)
   Remplace l'ancien "simulateur de dividendes" (bourse.html, taux de
   croissance inventé par l'utilisateur appliqué à une entreprise réelle)
   par une fiche construite uniquement sur des données réelles : historique
   réel des versements (Yahoo events=div, lib/yahoo.js), fondamentaux réels
   (payout ratio, dates réelles de détachement/paiement), et un simulateur
   de réinvestissement qui utilise les VRAIS dividendes versés plutôt qu'un
   taux composé fictif (computeDividendReinvestmentSimulation, scripts/data.js).

   Le ticker vient du hash de l'URL (dividende.html#TICKER), même convention
   que action.html. Ouvert à toute valeur suivie (getFollowedStocks), pas
   seulement aux 8 valeurs curatées.
   ============================================================ */

const DIV_TICKER_PATTERN = /^[A-Za-z0-9.\-^=]{1,15}$/;
function divCurrentSymbol(){
  let sym = '';
  try { sym = decodeURIComponent(location.hash.slice(1)); }
  catch(e){ sym = location.hash.slice(1); }
  return DIV_TICKER_PATTERN.test(sym) ? sym : '';
}

const DIV_TABS = [
  {id: 'dtab-apercu', title: 'Aperçu', icon: 'coins', desc: 'Dividende, rendement, prochaines dates réelles'},
  {id: 'dtab-historique', title: 'Historique', icon: 'list', desc: 'Année par année, jamais une baisse masquée'},
  {id: 'dtab-soutenabilite', title: 'Soutenabilité', icon: 'shield', desc: 'Score décomposable, jamais "sûr à 100%"'},
  {id: 'dtab-previsions', title: 'Prévisions', icon: 'telescope', desc: 'Annoncé vs Scénario Likanza'},
  {id: 'dtab-simulation', title: 'Simulation', icon: 'calculator', desc: 'Vrais dividendes réinvestis'},
  {id: 'dtab-comparer', title: 'Comparer', icon: 'scale', desc: '2 à 5 valeurs suivies'}
];

// État partagé de la fiche actuellement affichée — rechargé à chaque
// changement de ticker (hashchange), jamais mélangé entre deux valeurs.
let DIV = {ticker: null, nom: null, fields: null, points: null, dividends: null, yearlyHistory: null, safetyScore: null};
let divActiveTab = 'dtab-apercu';

function renderDivTabs(){
  const el = document.getElementById('divTabsGrid');
  if(!el) return;
  el.innerHTML = DIV_TABS.map(t => `
    <button class="quick-access-card ${t.id === divActiveTab ? 'active' : ''}" data-dtab="${t.id}">
      <div class="icon">${ICONS[t.icon] || ''}</div>
      <h3 style="font-size:14px;">${t.title}</h3>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">${t.desc}</p>
    </button>`).join('');
  el.querySelectorAll('[data-dtab]').forEach(btn => btn.addEventListener('click', () => setDivTab(btn.dataset.dtab)));
}
function setDivTab(tabId){
  divActiveTab = tabId;
  document.querySelectorAll('#divTabsGrid .quick-access-card').forEach(c => c.classList.toggle('active', c.dataset.dtab === tabId));
  document.querySelectorAll('#divContent .home-tab-panel').forEach(p => p.classList.toggle('active', p.id === tabId));
}

function populateDivTickerSelect(){
  const sel = document.getElementById('divTickerSelect');
  if(!sel) return;
  const followed = getFollowedStocks();
  sel.innerHTML = followed.map(entry => {
    const s = resolveFollowedStock(entry.symbol);
    return `<option value="${entry.symbol}">${s.nom}</option>`;
  }).join('');
  const current = divCurrentSymbol();
  if(current && followed.some(e => e.symbol === current)) sel.value = current;
  // populateDivTickerSelect() est réappelée à chaque changement de hash
  // (initDividendePage) mais l'élément <select> lui-même persiste dans le
  // DOM : un flag évite d'empiler un nouveau listener "change" à chaque fois.
  if(!sel.dataset.bound){
    sel.dataset.bound = '1';
    sel.addEventListener('change', () => { location.hash = encodeURIComponent(sel.value); });
  }
}

// Recherche ouverte à TOUTE valeur réelle (pas seulement les valeurs déjà
// suivies) : wireStockSearch (scripts/data.js) ajoute la valeur choisie aux
// valeurs suivies puis navigue directement vers sa fiche dividende.
function wireDivSearch(){
  const input = document.getElementById('divSearchInput');
  if(!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  wireStockSearch(input, document.getElementById('divSearchResults'), (symbol) => {
    populateDivTickerSelect();
    location.hash = encodeURIComponent(symbol);
  });
}

// ---------- Chargement des données réelles (fondamentaux + historique de
// prix/dividendes convertis en EUR) — un seul chargement par ticker, partagé
// par tous les onglets pour ne jamais afficher deux vues incohérentes. ----------
async function loadDivTicker(symbol){
  const stock = resolveFollowedStock(symbol);
  DIV = {ticker: symbol, nom: stock.nom, fields: null, points: null, dividends: null, yearlyHistory: null, safetyScore: null};
  document.title = `${stock.nom} · Dividend Intelligence · Likanza Academy`;
  const crumb = document.getElementById('crumbName'); if(crumb) crumb.textContent = `${stock.nom} · Dividendes`;
  const titleEl = document.getElementById('divPageTitle'); if(titleEl) titleEl.textContent = `💰 ${stock.nom} — Dividend Intelligence`;

  DIV_TABS.forEach(t => {
    const el = document.getElementById(t.id);
    if(el) el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;padding:20px 0;">Chargement des données réelles…</p>`;
  });

  const [profileResult, historyResult] = await Promise.allSettled([
    loadCompanyFundamentals([symbol]).then(cache => cache[symbol]),
    fetchSymbolMonthlyHistoryWithDividends(symbol, '10y')
  ]);

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  DIV.fields = profile && profile.fundamentals ? profile.fundamentals.fields : null;

  const history = historyResult.status === 'fulfilled' ? historyResult.value : null;
  DIV.points = history ? history.points : null;
  DIV.dividends = history ? history.dividends : [];
  DIV.yearlyHistory = computeDividendYearlyHistory(DIV.dividends);
  DIV.safetyScore = computeDividendSafetyScore(DIV.fields || {}, DIV.yearlyHistory);

  renderApercuTab();
  renderHistoriqueTab();
  renderSoutenabiliteTab();
  renderPrevisionsTab();
  renderSimulationTab();
  renderComparerTab();
}

// ================= Onglet 1 : Aperçu =================
// Inclut l'explication du "piège du rendement élevé" (section demandée) :
// jamais une affirmation causale inventée — uniquement la vraie évolution du
// dividende par action ET la vraie évolution du cours sur 12 mois,
// présentées ensemble pour que la décomposition soit factuelle.
function explainYieldLevel(ff, points, yearlyHistory){
  if(!ff || typeof ff.dividendYield !== 'number' || typeof ff.fiveYearAvgDividendYield !== 'number') return null;
  const currentPct = ff.dividendYield * 100;
  const avgPct = ff.fiveYearAvgDividendYield;
  if(avgPct <= 0 || currentPct < avgPct * 1.2) return null; // pas d'écart notable à commenter

  let priceChange1y = null;
  if(Array.isArray(points) && points.length >= 13){
    const last = points[points.length - 1].close, yearAgo = points[points.length - 13].close;
    if(typeof last === 'number' && typeof yearAgo === 'number' && yearAgo > 0) priceChange1y = (last / yearAgo - 1) * 100;
  }
  const divGrowth = yearlyHistory && yearlyHistory.latestCompletedYear ? yearlyHistory.latestCompletedYear.growthPct : null;

  let explanation;
  if(typeof priceChange1y === 'number' && priceChange1y < -5 && (divGrowth === null || divGrowth < 10)){
    explanation = `Sur les 12 derniers mois, le cours a reculé de ${Math.abs(priceChange1y).toFixed(1)}%${typeof divGrowth === 'number' ? ` pendant que le dividende par action a évolué de ${divGrowth >= 0 ? '+' : ''}${divGrowth.toFixed(1)}%` : ''} — la hausse du rendement provient donc au moins en partie de la baisse du cours, pas uniquement d'un dividende plus généreux.`;
  } else if(typeof divGrowth === 'number' && divGrowth > 5){
    explanation = `Le dividende par action a réellement progressé de ${divGrowth.toFixed(1)}% sur la dernière année complète — le rendement plus élevé que la moyenne 5 ans peut donc refléter, au moins en partie, une vraie hausse du dividende plutôt qu'une seule baisse du cours.`;
  } else {
    explanation = `Les données disponibles ne permettent pas de départager avec certitude la part venant d'une hausse du dividende de celle venant d'une évolution du cours — à vérifier sur l'onglet Historique du cours de la fiche action.`;
  }
  return {currentPct, avgPct, explanation};
}

function renderApercuTab(){
  const el = document.getElementById('dtab-apercu');
  if(!el) return;
  const ff = DIV.fields;
  if(!ff){
    el.innerHTML = `<div class="card"><h3>Aperçu</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p></div>`;
    return;
  }
  const latestYear = DIV.yearlyHistory ? DIV.yearlyHistory.latestCompletedYear : null;
  const trap = explainYieldLevel(ff, DIV.points, DIV.yearlyHistory);

  el.innerHTML = `
    <div class="card-grid">
      <div class="card">
        <h3>Fiche dividende</h3>
        <p style="margin-top:8px;">${renderDataBadge('fait')}</p>
        <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
          <div><span class="smallcaps">Dividende annuel</span><br><strong style="font-size:18px;">${formatFundamentalValue('dividendRate', ff.dividendRate)}</strong></div>
          <div><span class="smallcaps">Rendement actuel</span><br><strong style="font-size:18px;">${formatFundamentalValue('dividendYield', ff.dividendYield)}</strong></div>
          <div><span class="smallcaps">Versé sur 12 mois</span><br>${formatFundamentalValue('trailingAnnualDividendRate', ff.trailingAnnualDividendRate)}</div>
          <div><span class="smallcaps">Payout ratio</span><br>${formatFundamentalValue('payoutRatio', ff.payoutRatio)}</div>
          <div><span class="smallcaps">Prochaine date de détachement</span><br>${formatFundamentalValue('exDividendDate', ff.exDividendDate)}</div>
          <div><span class="smallcaps">Prochaine date de paiement</span><br>${formatFundamentalValue('dividendDate', ff.dividendDate)}</div>
        </div>
        ${latestYear ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:12px;">${renderDataBadge('calcul')} Dernière année civile complète (${latestYear.year}) : ${latestYear.total.toFixed(2)} € versés au total${typeof latestYear.growthPct === 'number' ? `, ${latestYear.growthPct >= 0 ? '+' : ''}${latestYear.growthPct.toFixed(1)}% vs l'année précédente` : ''}.</p>` : ''}
      </div>
      <div class="card">
        <h3>⚠️ Le piège du rendement élevé</h3>
        <p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Un rendement élevé n'est pas automatiquement une bonne nouvelle : il peut venir d'un dividende plus généreux, mais aussi d'un cours qui a baissé (le rendement = dividende ÷ cours augmente mécaniquement quand le cours chute).</p>
        ${typeof ff.fiveYearAvgDividendYield === 'number' ? `<p style="font-size:12.5px;margin-top:10px;">${renderDataBadge('fait')} Rendement actuel ${formatFundamentalValue('dividendYield', ff.dividendYield)} vs moyenne 5 ans ${formatFundamentalValue('fiveYearAvgDividendYield', ff.fiveYearAvgDividendYield)}.</p>` : `<p style="font-size:12px;color:var(--text-dim);margin-top:10px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (moyenne 5 ans).</p>`}
        ${trap ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">${renderDataBadge('analyse')} ${trap.explanation}</p>` : `<p style="font-size:12px;color:var(--text-dim);margin-top:10px;font-style:italic;">Pas d'écart notable entre le rendement actuel et sa moyenne 5 ans pour cette valeur.</p>`}
        <p style="margin-top:12px;"><a href="bibliotheque.html#Rendement-du-dividende" style="color:var(--gold-bright);font-size:12px;">Voir la définition dans la Bibliothèque →</a></p>
      </div>
    </div>`;
}

// ================= Onglet 2 : Historique =================
function renderHistoriqueTab(){
  const el = document.getElementById('dtab-historique');
  if(!el) return;
  const h = DIV.yearlyHistory;
  if(!h){
    el.innerHTML = `<div class="card"><h3>Historique</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (aucun historique de versement trouvé pour cette valeur).</p></div>`;
    return;
  }
  const TREND_META = {
    hausse: {emoji: '🟢', label: 'Hausse', color: 'var(--emerald)'},
    gel: {emoji: '🟡', label: 'Gel', color: 'var(--gold-bright)'},
    baisse: {emoji: '🔴', label: 'Baisse', color: 'var(--bordeaux)'}
  };
  const rows = h.years.map(y => {
    const meta = y.trend ? TREND_META[y.trend] : null;
    return `<tr>
      <td>${y.year}${y.isPartial ? ' <span style="color:var(--text-dim);font-size:11px;">(en cours)</span>' : ''}</td>
      <td>${y.total.toFixed(2)} €</td>
      <td>${typeof y.growthPct === 'number' ? `${y.growthPct >= 0 ? '+' : ''}${y.growthPct.toFixed(1)}%` : '—'}</td>
      <td>${meta ? `<span style="color:${meta.color};">${meta.emoji} ${meta.label}</span>` : '—'}</td>
    </tr>`;
  }).join('');
  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><h3>Historique année par année</h3>${renderDataBadge('fait')}</div>
      <p style="font-size:12px;color:var(--text-dim);margin:8px 0 12px;">Total réellement versé par année civile — jamais une baisse ou un gel masqué, y compris quand le résultat est négatif.</p>
      <div style="overflow-x:auto;"><table class="compare-table"><tr><th>Année</th><th>Dividende versé</th><th>Évolution</th><th>Tendance</th></tr>${rows}</table></div>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:14px;">${renderDataBadge('calcul')} Sur les années complètes : ${h.increases} hausse(s), ${h.freezes} gel(s), ${h.decreases} baisse(s).${typeof h.cagr5y === 'number' ? ` Croissance annuelle moyenne sur 5 ans : ${h.cagr5y >= 0 ? '+' : ''}${h.cagr5y.toFixed(1)}%.` : ''}${typeof h.cagr10y === 'number' ? ` Sur 10 ans : ${h.cagr10y >= 0 ? '+' : ''}${h.cagr10y.toFixed(1)}%.` : ''}</p>
    </div>`;
}

// ================= Onglet 3 : Soutenabilité =================
function renderSoutenabiliteTab(){
  const el = document.getElementById('dtab-soutenabilite');
  if(!el) return;
  const score = DIV.safetyScore;
  if(!score){
    el.innerHTML = `<div class="card"><h3>Soutenabilité</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p></div>`;
    return;
  }
  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;"><h3>Score de soutenabilité</h3><span class="mono" style="font-size:20px;color:var(--gold-bright);">${score.overall}/100</span></div>
      <p style="font-size:12px;color:var(--text-dim);margin:8px 0 14px;">${renderDataBadge('calcul')} Chaque composant ci-dessous est calculé séparément à partir de vraies données — jamais un dividende "sûr à 100%".</p>
      ${score.components.map(c => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;"><span>${c.label}</span><span class="mono">${c.points}/100</span></div>
          <p style="font-size:11.5px;color:var(--text-dim);margin-top:2px;">${c.formatted}</p>
        </div>`).join('')}
      <p class="disclaimer-box">Ce score résume des données réelles disponibles aujourd'hui. Il ne garantit ni le maintien, ni la hausse, ni l'absence de baisse future du dividende — la situation d'une entreprise peut changer.</p>
    </div>`;
}

// ================= Onglet 4 : Prévisions =================
const DIV_SCENARIO_HORIZONS = [1, 3, 5, 10];
function renderPrevisionsTab(){
  const el = document.getElementById('dtab-previsions');
  if(!el) return;
  const ff = DIV.fields || {};
  const h = DIV.yearlyHistory;

  const hasAnnounced = typeof ff.dividendDate === 'number' || typeof ff.exDividendDate === 'number';
  const announcedHtml = hasAnnounced ? `
    <p style="font-size:13px;">${renderDataBadge('fait')} 📌 Déjà annoncé</p>
    <p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${typeof ff.exDividendDate === 'number' ? `Date de détachement : ${formatFundamentalValue('exDividendDate', ff.exDividendDate)}. ` : ''}${typeof ff.dividendDate === 'number' ? `Date de paiement : ${formatFundamentalValue('dividendDate', ff.dividendDate)}. ` : ''}${typeof ff.dividendRate === 'number' ? `Montant annuel réel actuellement communiqué : ${formatFundamentalValue('dividendRate', ff.dividendRate)}.` : ''}</p>`
    : `<p style="font-size:12.5px;color:var(--text-dim);">${FUNDAMENTALS_UNAVAILABLE_TEXT} (aucune date de paiement à venir communiquée par la source de données à ce jour).</p>`;

  const cagr = h ? (typeof h.cagr5y === 'number' ? h.cagr5y : h.cagr10y) : null;
  const base = typeof ff.dividendRate === 'number' ? ff.dividendRate : (typeof ff.trailingAnnualDividendRate === 'number' ? ff.trailingAnnualDividendRate : null);

  function scenarioBlock(horizon){
    if(typeof cagr !== 'number' || typeof base !== 'number'){
      return `<p style="font-size:12.5px;color:var(--text-dim);">${FUNDAMENTALS_UNAVAILABLE_TEXT} (historique de dividende ou montant actuel insuffisant pour un scénario).</p>`;
    }
    const projected = base * Math.pow(1 + cagr / 100, horizon);
    return `
      <p style="font-size:13px;">${renderDataBadge('scenario')} 🧮 Scénario Likanza — ${horizon} an(s)</p>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Hypothèse : la croissance annuelle moyenne réelle observée (${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}%/an) se maintient à l'identique. Ce n'est pas une garantie — une simple projection mathématique.</p>
      <p style="font-size:15px;margin-top:8px;">Dividende annuel projeté : <strong>${projected.toFixed(2)} €</strong></p>`;
  }

  el.innerHTML = `
    <div class="card-grid">
      <div class="card">
        <h3>Prévisions</h3>
        <div style="margin-top:10px;">${announcedHtml}</div>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--hairline);">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
            ${DIV_SCENARIO_HORIZONS.map(hh => `<button type="button" class="pill ${hh === divScenarioHorizon ? 'active' : ''}" data-horizon="${hh}">${hh} an${hh > 1 ? 's' : ''}</button>`).join('')}
          </div>
          <div id="divScenarioBody">${scenarioBlock(divScenarioHorizon)}</div>
        </div>
        <p class="disclaimer-box">Aucune estimation de dividende futur par des analystes n'est disponible via cette source de données — contrairement aux cibles de cours (voir la fiche action), il n'existe pas de consensus professionnel équivalent pour les dividendes. Le "Scénario Likanza" ci-dessus est un calcul, jamais une prédiction.</p>
      </div>
      <div class="card">
        <h3>Facteurs à surveiller</h3>
        <p style="font-size:12px;color:var(--text-dim);margin:6px 0 12px;">Jamais une probabilité chiffrée de baisse — uniquement les signaux réels déjà calculés dans l'onglet Soutenabilité.</p>
        ${DIV.safetyScore ? DIV.safetyScore.components.map(c => {
          const flag = c.points >= 70 ? '🟢' : c.points >= 40 ? '🟡' : '🔴';
          return `<p style="font-size:12.5px;margin-bottom:8px;">${flag} ${c.label} : ${c.formatted}</p>`;
        }).join('') : `<p style="font-size:12.5px;color:var(--text-dim);">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`}
      </div>
    </div>`;

  el.querySelectorAll('[data-horizon]').forEach(btn => btn.addEventListener('click', () => {
    divScenarioHorizon = Number(btn.dataset.horizon);
    renderPrevisionsTab();
  }));
}
let divScenarioHorizon = 5;

// ================= Onglet 5 : Simulation =================
const DIV_SIM_RANGES = [{label: '2 ans', years: 2}, {label: '5 ans', years: 5}, {label: '10 ans', years: 10}];
let divSimRangeYears = 5, divSimInitial = 1000, divSimReinvest = true;

function renderSimulationTab(){
  const el = document.getElementById('dtab-simulation');
  if(!el) return;
  if(!Array.isArray(DIV.points) || DIV.points.length < 2){
    el.innerHTML = `<div class="card"><h3>Simulation</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (historique de cours insuffisant).</p></div>`;
    return;
  }
  el.innerHTML = `
    <div class="card-grid">
      <div class="card">
        <h3>Paramètres</h3>
        <div class="field"><label for="divSimInitial">Montant investi (€)</label><input type="number" id="divSimInitial" value="${divSimInitial}" min="1"></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;">${DIV_SIM_RANGES.map(r => `<button type="button" class="pill ${r.years === divSimRangeYears ? 'active' : ''}" data-simrange="${r.years}">${r.label}</button>`).join('')}</div>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px;color:var(--text-dim);margin-top:6px;"><input type="checkbox" id="divSimReinvest" ${divSimReinvest ? 'checked' : ''} style="accent-color:var(--gold);"> Réinvestir les dividendes reçus</label>
        <p style="font-size:11.5px;color:var(--text-dim);margin-top:12px;">${renderDataBadge('simulation')} Méthode : à chaque versement RÉEL, le montant reçu est réinvesti au premier cours de clôture mensuel disponible à la date du versement ou après — jamais un prix intra-mensuel supposé connu à l'avance. Les opérations de split ne sont pas prises en compte (simplification).</p>
      </div>
      <div class="card" id="divSimResult"></div>
    </div>`;

  document.getElementById('divSimInitial').addEventListener('input', e => { divSimInitial = Number(e.target.value) || 0; runDivSimulation(); });
  document.getElementById('divSimReinvest').addEventListener('change', e => { divSimReinvest = e.target.checked; runDivSimulation(); });
  el.querySelectorAll('[data-simrange]').forEach(btn => btn.addEventListener('click', () => {
    divSimRangeYears = Number(btn.dataset.simrange);
    renderSimulationTab();
  }));
  runDivSimulation();
}

function runDivSimulation(){
  const resultEl = document.getElementById('divSimResult');
  if(!resultEl) return;
  const monthsWanted = divSimRangeYears * 12;
  const points = DIV.points.slice(-monthsWanted - 1);
  if(points.length < 2){
    resultEl.innerHTML = `<h3>Résultat</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (historique insuffisant sur cette période).</p>`;
    return;
  }
  const startPeriod = points[0].period;
  const dividendsInRange = (DIV.dividends || []).filter(d => d.date.slice(0, 7) >= startPeriod);
  const sim = computeDividendReinvestmentSimulation(points, dividendsInRange, divSimInitial, divSimReinvest);
  if(!sim){
    resultEl.innerHTML = `<h3>Résultat</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`;
    return;
  }
  const yieldOnCost = computeYieldOnCost(points[0].close, DIV.fields ? DIV.fields.dividendRate : null);

  resultEl.innerHTML = `
    <h3>Résultat</h3>
    <div class="result-label">Valeur totale après ${sim.years.toFixed(1)} an(s)</div>
    <div class="result-big">${sim.finalValue.toFixed(0)} €</div>
    <p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Investi : ${sim.initial.toFixed(0)} € · Gain total : ${sim.totalGain >= 0 ? '+' : ''}${sim.totalGain.toFixed(0)} € (${sim.cagr >= 0 ? '+' : ''}${sim.cagr.toFixed(1)}%/an)</p>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--hairline);">
      <p style="font-size:12.5px;">${renderDataBadge('calcul')} Décomposition du résultat</p>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Effet du seul cours de l'action : ${sim.priceOnlyValue.toFixed(0)} € (${sim.cagrPriceOnly >= 0 ? '+' : ''}${sim.cagrPriceOnly.toFixed(1)}%/an)</p>
      <p style="font-size:12.5px;color:var(--text-dim);">Effet des dividendes (${sim.paymentsUsed} versement${sim.paymentsUsed > 1 ? 's' : ''} réel${sim.paymentsUsed > 1 ? 's' : ''}) : ${sim.dividendEffect >= 0 ? '+' : ''}${sim.dividendEffect.toFixed(0)} €</p>
      <p style="font-size:12.5px;color:var(--text-dim);">Dividendes reçus au total : ${sim.cashDividendsReceived.toFixed(0)} €${sim.reinvest ? ` (dont ${sim.dividendsReinvestedValue.toFixed(0)} € réinvestis)` : ' (non réinvestis)'}</p>
    </div>
    ${typeof yieldOnCost === 'number' ? `<p style="font-size:12.5px;margin-top:12px;">${renderDataBadge('calcul')} Yield on Cost : <strong>${yieldOnCost.toFixed(2).replace('.', ',')} %</strong> — le dividende annuel actuel rapporté au prix d'achat du début de période, pas au cours actuel.</p>` : ''}
    <p class="disclaimer-box">Simulation basée sur les cours et dividendes réellement observés sur cette période — elle ne prédit pas la performance future et ne prend pas en compte la fiscalité ni les frais de courtage.</p>`;
}

// ================= Onglet 6 : Comparer =================
let divCompareSelected = [];
function renderComparerTab(){
  const el = document.getElementById('dtab-comparer');
  if(!el) return;
  const followed = getFollowedStocks();
  if(divCompareSelected.length === 0 && DIV.ticker) divCompareSelected = [DIV.ticker];

  el.innerHTML = `
    <div class="card">
      <h3>Choisis 2 à 5 valeurs suivies</h3>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;">
        ${followed.map(s => `<label style="display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--text-dim);"><input type="checkbox" class="divCompareCheck" value="${s.symbol}" ${divCompareSelected.includes(s.symbol) ? 'checked' : ''} style="accent-color:var(--gold);"> ${s.name}</label>`).join('')}
      </div>
    </div>
    <div class="card" style="margin-top:16px;" id="divCompareResult"></div>`;

  // Même convention que le Comparateur de bourse.html (compareCheck) : au-delà
  // de 5 cases cochées, seules les 5 premières (ordre d'affichage) sont
  // utilisées, sans forcer un décochage de l'interface.
  el.querySelectorAll('.divCompareCheck').forEach(cb => cb.addEventListener('change', () => {
    divCompareSelected = Array.from(el.querySelectorAll('.divCompareCheck:checked')).map(c => c.value).slice(0, 5);
    runDivComparison();
  }));
  runDivComparison();
}

async function runDivComparison(){
  const resultEl = document.getElementById('divCompareResult');
  if(!resultEl) return;
  if(divCompareSelected.length < 2){
    resultEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Sélectionne au moins 2 valeurs pour lancer la comparaison.</p>`;
    return;
  }
  resultEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement…</p>`;
  const symbols = divCompareSelected;
  const [fundamentalsCache, histories] = await Promise.all([
    loadCompanyFundamentals(symbols),
    Promise.all(symbols.map(s => fetchSymbolMonthlyHistoryWithDividends(s, '5y').catch(() => null)))
  ]);

  const rows = symbols.map((symbol, i) => {
    const stock = resolveFollowedStock(symbol);
    const profile = fundamentalsCache[symbol];
    const ff = profile && profile.fundamentals ? profile.fundamentals.fields : null;
    const hist = histories[i];
    const yearly = hist ? computeDividendYearlyHistory(hist.dividends) : null;
    const safety = computeDividendSafetyScore(ff || {}, yearly);
    return {symbol, nom: stock.nom, ff, yearly, safety};
  });

  const criteria = [
    {label: 'Rendement actuel', get: r => r.ff ? formatFundamentalValue('dividendYield', r.ff.dividendYield) : FUNDAMENTALS_UNAVAILABLE_TEXT},
    {label: 'Dividende annuel réel', get: r => r.ff ? formatFundamentalValue('dividendRate', r.ff.dividendRate) : FUNDAMENTALS_UNAVAILABLE_TEXT},
    {label: 'Payout ratio', get: r => r.ff ? formatFundamentalValue('payoutRatio', r.ff.payoutRatio) : FUNDAMENTALS_UNAVAILABLE_TEXT},
    {label: 'Croissance moyenne réelle (5 ans)', get: r => (r.yearly && typeof r.yearly.cagr5y === 'number') ? `${r.yearly.cagr5y >= 0 ? '+' : ''}${r.yearly.cagr5y.toFixed(1)}%` : FUNDAMENTALS_UNAVAILABLE_TEXT},
    {label: 'Score de soutenabilité', get: r => r.safety ? `${r.safety.overall}/100` : FUNDAMENTALS_UNAVAILABLE_TEXT}
  ];

  const table = `<table class="compare-table"><tr><th>Critère</th>${rows.map(r => `<th>${r.nom}</th>`).join('')}</tr>${
    criteria.map(c => `<tr><td>${c.label}</td>${rows.map(r => `<td>${c.get(r)}</td>`).join('')}</tr>`).join('')
  }</table>`;

  const yields = rows.filter(r => r.ff && typeof r.ff.dividendYield === 'number');
  const growths = rows.filter(r => r.yearly && typeof r.yearly.cagr5y === 'number');
  const narration = [];
  if(yields.length >= 2){
    const best = yields.reduce((a, b) => (b.ff.dividendYield > a.ff.dividendYield ? b : a));
    narration.push(`${best.nom} verse aujourd'hui le rendement le plus élevé du groupe — un rendement plus élevé n'est pas automatiquement préférable (voir l'onglet Aperçu de chaque valeur, "le piège du rendement élevé").`);
  }
  if(growths.length >= 2){
    const fastest = growths.reduce((a, b) => (b.yearly.cagr5y > a.yearly.cagr5y ? b : a));
    narration.push(`${fastest.nom} a fait croître son dividende le plus rapidement sur les 5 dernières années — une tendance passée, pas une garantie pour l'avenir.`);
  }

  resultEl.innerHTML = `
    <h3>Comparaison</h3>
    <p style="font-size:12px;color:var(--text-dim);margin:6px 0 12px;">${renderDataBadge('fait')} Données réelles, mêmes conditions pour toutes les valeurs — jamais un vainqueur global désigné.</p>
    <div style="overflow-x:auto;">${table}</div>
    ${narration.length ? `<div style="margin-top:14px;">${narration.map(n => `<p style="font-size:12.5px;color:var(--text-dim);margin-bottom:8px;">${renderDataBadge('analyse')} ${n}</p>`).join('')}</div>` : ''}
    <p class="disclaimer-box">Cette comparaison décrit ce qui différencie ces valeurs sur des critères réels liés au dividende — elle ne constitue jamais un classement global ni une recommandation d'achat.</p>`;
}

// ================= Initialisation =================
function initDividendePage(){
  const el = document.getElementById('divContent');
  const noTickerEl = document.getElementById('divNoTicker');
  if(!el) return;
  wireDivSearch();
  const followed = getFollowedStocks();
  if(followed.length === 0){
    el.style.display = 'none';
    if(noTickerEl) noTickerEl.style.display = '';
    return;
  }
  if(noTickerEl) noTickerEl.style.display = 'none';
  el.style.display = '';

  let ticker = divCurrentSymbol();
  if(!ticker || !followed.some(s => s.symbol === ticker)){
    ticker = followed[0].symbol;
    location.hash = encodeURIComponent(ticker);
    return; // le hashchange déclenché par la ligne ci-dessus relance l'init
  }

  populateDivTickerSelect();
  divActiveTab = 'dtab-apercu';
  divScenarioHorizon = 5;
  divCompareSelected = [];
  renderDivTabs();
  setDivTab('dtab-apercu');
  loadDivTicker(ticker);
}

safeRun('dividend intelligence', initDividendePage);
window.addEventListener('hashchange', () => safeRun('dividend intelligence (navigation)', initDividendePage));
