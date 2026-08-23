/* ============================================================
   LIKANZA ACADEMY — Construis ton portefeuille (jeu-portefeuille.html)
   Jeu de stratégie financière à tours, sur de vrais cours historiques
   (Yahoo Finance, /api/custom-quotes, jamais de données inventées).

   Un seul jeu de cette taille (~600 lignes, aucune réutilisation par
   une autre page) : sorti de scripts/data.js dans son propre fichier,
   chargé uniquement par jeu-portefeuille.html, après app.js (STOCKS_DEMO,
   fmtEUR, ICONS) et data.js (safeGetJSON/safeSetJSON, awardXP,
   tryAwardQuizPoints, renderMultiLineChart).

   Principe : le joueur répartit un capital fictif entre les 8 valeurs
   suivies (STOCKS_DEMO) + du cash, puis avance trimestre par trimestre
   sur un vrai historique mensuel (10 ans, ~121 points réels par titre,
   vérifié en direct contre l'API de production). Il peut rééquilibrer à
   chaque tour, sans jamais voir les cours futurs. La narration de chaque
   tour et le bilan final sont calculés à partir des vrais chiffres —
   jamais une actualité ou un chiffre inventés (même principe que
   renderResultExplainer, scripts/data.js).
   ============================================================ */

const PORTFOLIO_BUDGET = 10000;
const PORTFOLIO_BENCHMARK_SYMBOL = '^FCHI';
const PORTFOLIO_BENCHMARK_NAME = 'CAC 40';

const PORTFOLIO_DIFFICULTIES = {
  debutant: {
    label: 'Débutant', turnCount: 6, maxSingleWeightPct: null, minAssetsHeld: null,
    revealBenchmarkLive: true, showFullHistoryChart: true, nameSectors: true,
    description: '6 trimestres, aucune contrainte, benchmark visible en direct.'
  },
  intermediaire: {
    label: 'Intermédiaire', turnCount: 8, maxSingleWeightPct: 40, minAssetsHeld: null,
    revealBenchmarkLive: false, showFullHistoryChart: true, nameSectors: true,
    description: '8 trimestres, max 40% sur une valeur, comparaison au CAC 40 seulement à la fin.'
  },
  avance: {
    label: 'Avancé', turnCount: 10, maxSingleWeightPct: 30, minAssetsHeld: 4,
    revealBenchmarkLive: false, showFullHistoryChart: false, nameSectors: false,
    description: '10 trimestres, max 30% sur une valeur, au moins 4 valeurs détenues, graphique limité aux derniers tours, secteurs non nommés.'
  }
};
const PORTFOLIO_DIFFICULTY_ORDER = ['debutant', 'intermediaire', 'avance'];

// Un seul scénario actif en v1 (croissanceMaitrisee) ; les 3 autres existent
// déjà en config pour un futur sélecteur d'objectif (v1.1), sans re-architecture.
const PORTFOLIO_SCENARIOS = {
  croissanceMaitrisee: {
    label: 'Croissance maîtrisée',
    description: "Objectif : faire progresser ton capital sans prendre une volatilité excessive.",
    primaryMetricLabel: 'volatilité mesurée sur la partie',
    evaluate(result){
      const metGoal = result.returnPct >= result.benchmarkReturnPct * 0.7 && result.volatilityOfPeriodReturns <= 12;
      return {metGoal, primaryMetric: 'volatilityOfPeriodReturns'};
    }
  },
  protectionCapital: {
    label: 'Protéger son capital',
    description: 'Objectif : terminer la partie avec une perte maximale limitée.',
    primaryMetricLabel: 'plus grosse baisse depuis un sommet',
    evaluate(result){ return {metGoal: result.maxDrawdownPct <= 15, primaryMetric: 'maxDrawdownPct'}; }
  },
  diversification: {
    label: 'Diversification',
    description: 'Objectif : maintenir un portefeuille réellement diversifié tout au long de la partie.',
    primaryMetricLabel: 'diversification effective moyenne',
    evaluate(result){ return {metGoal: result.avgEffectiveN >= 4, primaryMetric: 'avgEffectiveN'}; }
  },
  survivreCrise: {
    label: 'Survivre à la crise',
    description: 'Objectif : traverser la partie sans subir une perte catastrophique.',
    primaryMetricLabel: 'plus grosse baisse depuis un sommet',
    evaluate(result){ return {metGoal: result.maxDrawdownPct <= 30 && result.returnPct > -10, primaryMetric: 'maxDrawdownPct'}; }
  }
};

function fmtPct(x){ return `${x >= 0 ? '+' : ''}${x.toFixed(1)}%`; }

// ---------- Historique des parties (fzr-portfolio-game-history) ----------
// Écriture dès v1 (impossible à reconstituer rétroactivement) ; la lecture/
// réflexion ("sur tes dernières parties...") est un fast-follow, pas dans
// cette passe — mais l'écriture doit commencer maintenant.
function getPortfolioGameHistory(){ return safeGetJSON('fzr-portfolio-game-history', []); }
function savePortfolioGameResult(entry){
  const history = getPortfolioGameHistory();
  history.unshift(entry);
  safeSetJSON('fzr-portfolio-game-history', history.slice(0, 20));
}

// ---------- Fonctions pures : alignement des dates réelles, tours ----------

// Intersection des dates communes à tous les symboles (mêmes vrais points
// mensuels partout) — même logique que l'ancien computePortfolioBacktest,
// généralisée à un nombre de symboles arbitraire.
function alignPortfolioDates(historyBySymbol, symbols){
  const sets = symbols.map(s => new Set((historyBySymbol[s] || []).map(h => h.date)));
  if(sets.some(s => s.size === 0)) return [];
  const common = [...sets[0]].filter(d => sets.every(set => set.has(d)));
  return common.sort();
}

function buildPortfolioCloseMaps(historyBySymbol, symbols){
  const closeMaps = {};
  symbols.forEach(s => {
    closeMaps[s] = {};
    (historyBySymbol[s] || []).forEach(h => { closeMaps[s][h.date] = h.close; });
  });
  return closeMaps;
}

// Découpe les dates communes réelles en turnCount+1 bornes réparties sur
// toute la fenêtre disponible (jamais une date inventée) — turnPeriods[0]
// = début de partie, turnPeriods[i] = fin du tour i.
function buildPortfolioTurnPeriods(commonDates, turnCount){
  const L = commonDates.length;
  const periods = [];
  for(let i = 0; i <= turnCount; i++){
    const idx = Math.round((i / turnCount) * (L - 1));
    periods.push(commonDates[idx]);
  }
  return periods;
}

// ---------- Croissance réelle d'un tour (rééquilibrage au début de chaque tour) ----------
function applyPortfolioTurnGrowth(startValue, weights, cashPct, closeMaps, dateStart, dateEnd){
  let newValue = 0;
  Object.keys(weights).forEach(ticker => {
    const w = weights[ticker];
    if(w <= 0) return;
    const growth = closeMaps[ticker][dateEnd] / closeMaps[ticker][dateStart];
    newValue += startValue * (w / 100) * growth;
  });
  newValue += startValue * (cashPct / 100); // cash : aucune croissance, aucun taux inventé
  return newValue;
}

// ---------- Narration de tour : calculée à partir des vrais rendements, jamais inventée ----------
function computePortfolioTurnReturns(closeMaps, dateStart, dateEnd){
  return STOCKS_DEMO.map(s => ({
    ticker: s.ticker, nom: s.nom, secteur: s.secteur,
    returnPct: (closeMaps[s.ticker][dateEnd] / closeMaps[s.ticker][dateStart] - 1) * 100
  }));
}

function describePortfolioTurn(tickerReturns, nameSectors){
  const bySector = {};
  tickerReturns.forEach(t => { (bySector[t.secteur] = bySector[t.secteur] || []).push(t.returnPct); });
  const sectorAvg = Object.entries(bySector).map(([secteur, arr]) => ({secteur, avg: arr.reduce((a, b) => a + b, 0) / arr.length}));
  sectorAvg.sort((a, b) => b.avg - a.avg);
  const best = sectorAvg[0], worst = sectorAvg[sectorAvg.length - 1];
  const dispersion = best.avg - worst.avg;

  let statement;
  if(dispersion < 3){
    statement = 'Trimestre plutôt homogène : les 8 valeurs suivies ont évolué de façon assez proche les unes des autres.';
  } else if(nameSectors){
    statement = `Ce trimestre, le secteur ${best.secteur} (${fmtPct(best.avg)}) a nettement surperformé le secteur ${worst.secteur} (${fmtPct(worst.avg)}) — un écart de ${dispersion.toFixed(1)} points.`;
  } else {
    statement = `Ce trimestre, l'écart entre le secteur le plus dynamique et le plus stable a été marqué (environ ${dispersion.toFixed(1)} points) — à toi de composer avec cette incertitude.`;
  }
  return {statement, dispersion, bestSector: best.secteur, worstSector: worst.secteur, sectorAvg};
}

// ---------- Bilan multi-dimensionnel de fin de partie (jamais juste le rendement) ----------
// Pure : uniquement à partir des vraies valeurs de portefeuille et des vrais
// choix du joueur (weightsHistory), jamais une valeur inventée.
function computePortfolioGameResult(portfolioValueSeries, weightsHistory, benchmarkValueSeries, budget){
  const n = portfolioValueSeries.length;
  const returnPct = (portfolioValueSeries[n - 1] / budget - 1) * 100;
  const benchmarkReturnPct = (benchmarkValueSeries[benchmarkValueSeries.length - 1] / budget - 1) * 100;

  // Drawdown maximal : même boucle de suivi de pic que computeHistoricalInvestment (data.js).
  let peak = portfolioValueSeries[0], maxDD = 0;
  for(let i = 1; i < n; i++){
    if(portfolioValueSeries[i] > peak) peak = portfolioValueSeries[i];
    else {
      const dd = (peak - portfolioValueSeries[i]) / peak;
      if(dd > maxDD) maxDD = dd;
    }
  }

  // Volatilité mesurée sur les tours réellement joués (jamais annualisée / présentée comme un chiffre standard).
  const periodReturns = [];
  for(let i = 1; i < n; i++) periodReturns.push(portfolioValueSeries[i] / portfolioValueSeries[i - 1] - 1);
  const meanR = periodReturns.reduce((a, b) => a + b, 0) / periodReturns.length;
  const variance = periodReturns.reduce((a, b) => a + (b - meanR) ** 2, 0) / periodReturns.length;
  const volatilityOfPeriodReturns = Math.sqrt(variance) * 100;

  // Diversification effective (Herfindahl inversé, cash inclus comme sa propre part —
  // 100% cash n'est pas de la diversification) + activité de rééquilibrage réelle.
  let sumEffectiveN = 0, sumCash = 0, rebalanceCount = 0;
  weightsHistory.forEach((snap, i) => {
    const fracs = Object.values(snap.weights).filter(w => w > 0).map(w => w / 100);
    const cashFrac = snap.cashPct / 100;
    const sumSq = fracs.reduce((a, f) => a + f * f, 0) + cashFrac * cashFrac;
    sumEffectiveN += sumSq > 0 ? 1 / sumSq : 0;
    sumCash += snap.cashPct;
    if(i > 0){
      const prev = weightsHistory[i - 1];
      const changed = JSON.stringify(prev.weights) !== JSON.stringify(snap.weights) || prev.cashPct !== snap.cashPct;
      if(changed) rebalanceCount++;
    }
  });

  return {
    returnPct, benchmarkReturnPct,
    maxDrawdownPct: maxDD * 100,
    volatilityOfPeriodReturns,
    avgEffectiveN: sumEffectiveN / weightsHistory.length,
    avgCashPct: sumCash / weightsHistory.length,
    rebalanceCount,
    turnsPlayed: n - 1
  };
}

// ---------- Narration finale : décision vs résultat, toujours séparés ----------
function buildPortfolioGameNarrative(result, scenario){
  const better = result.returnPct >= result.benchmarkReturnPct;
  const outcomeText = `Ton portefeuille termine à ${fmtPct(result.returnPct)}, contre ${fmtPct(result.benchmarkReturnPct)} pour 100% ${PORTFOLIO_BENCHMARK_NAME} sur la même période — ${better ? 'mieux' : 'moins bien'} que la référence. Ta plus grosse baisse depuis un sommet a atteint ${result.maxDrawdownPct.toFixed(1)}%, avec une volatilité mesurée de ${result.volatilityOfPeriodReturns.toFixed(1)}% sur les ${result.turnsPlayed} tours joués.`;

  let diversificationPhrase;
  if(result.avgEffectiveN < 2) diversificationPhrase = `resté concentré sur l'équivalent de ${result.avgEffectiveN.toFixed(1)} position(s) réellement indépendante(s)`;
  else if(result.avgEffectiveN < 4) diversificationPhrase = `moyennement diversifié (l'équivalent de ${result.avgEffectiveN.toFixed(1)} positions indépendantes)`;
  else diversificationPhrase = `bien diversifié (l'équivalent de ${result.avgEffectiveN.toFixed(1)} positions indépendantes)`;
  const decisionProcessText = `Sur l'ensemble de la partie, ton portefeuille est ${diversificationPhrase}, avec en moyenne ${result.avgCashPct.toFixed(0)}% de cash, et ${result.rebalanceCount} rééquilibrage${result.rebalanceCount > 1 ? 's' : ''} réel${result.rebalanceCount > 1 ? 's' : ''}. Ceci décrit ta façon de jouer, indépendamment du résultat obtenu sur cette période précise : une stratégie concentrée qui a bien tourné n'est pas forcément une bonne stratégie, une stratégie diversifiée qui a moins bien tourné n'est pas forcément une erreur.`;

  const evaluation = scenario.evaluate(result);
  const scenarioFitText = `Objectif « ${scenario.label} » : ${evaluation.metGoal ? 'atteint' : 'non atteint'} sur cette partie (${scenario.primaryMetricLabel}).`;

  return {outcomeText, decisionProcessText, scenarioFitText, metGoal: evaluation.metGoal};
}

// ---------- Validation d'allocation selon la difficulté ----------
function validatePortfolioAllocation(weights, cashPct, difficulty){
  const errors = [];
  const stockTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const total = stockTotal + cashPct;
  if(total !== 100) errors.push(`Le total doit faire 100% (actuellement ${total}%).`);
  if(difficulty.maxSingleWeightPct != null){
    const tooHigh = Object.entries(weights).find(([, w]) => w > difficulty.maxSingleWeightPct);
    if(tooHigh) errors.push(`Aucune valeur ne peut dépasser ${difficulty.maxSingleWeightPct}% du portefeuille à ce niveau de difficulté.`);
  }
  if(difficulty.minAssetsHeld != null){
    const heldCount = Object.values(weights).filter(w => w > 0).length;
    if(heldCount < difficulty.minAssetsHeld) errors.push(`Détiens au moins ${difficulty.minAssetsHeld} valeurs différentes à ce niveau de difficulté.`);
  }
  return {valid: errors.length === 0, errors};
}

function portfolioEqualWeights(){
  const n = STOCKS_DEMO.length;
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  const w = {};
  STOCKS_DEMO.forEach((s, i) => { w[s.ticker] = base + (i < remainder ? 1 : 0); });
  return w;
}

// ---------- UI : configuration -> boucle de tours -> résultats ----------
function renderPortfolioGame(elId){
  const el = document.getElementById(elId);
  if(!el) return;

  let difficultyId = 'intermediaire';
  const scenario = PORTFOLIO_SCENARIOS.croissanceMaitrisee;
  let game = null; // état de la partie en cours, créé par startGame()

  function renderSetup(){
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:14px;">Répartis un capital fictif de ${fmtEUR(PORTFOLIO_BUDGET)} entre les 8 valeurs suivies et du cash, puis avance trimestre par trimestre sur de vrais cours historiques (10 ans, Yahoo Finance). Rééquilibre à chaque tour — tu ne verras jamais les cours à venir.</p>
      <div class="disclaimer-box">${scenario.description}</div>
      <span class="smallcaps" style="display:block;margin:16px 0 8px;">Difficulté</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;" id="${elId}-diffs">
        ${PORTFOLIO_DIFFICULTY_ORDER.map(key => `<button type="button" class="pill diff-btn ${key === difficultyId ? 'active' : ''}" data-diff="${key}">${PORTFOLIO_DIFFICULTIES[key].label}</button>`).join('')}
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin-top:8px;" id="${elId}-diff-desc">${PORTFOLIO_DIFFICULTIES[difficultyId].description}</p>
      <button class="btn btn-gold" id="${elId}-start" type="button" style="margin-top:16px;">Lancer la partie</button>
      <div id="${elId}-error" style="color:var(--bordeaux);font-size:12.5px;margin-top:8px;"></div>`;

    el.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        difficultyId = btn.dataset.diff;
        el.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === difficultyId));
        document.getElementById(`${elId}-diff-desc`).textContent = PORTFOLIO_DIFFICULTIES[difficultyId].description;
      });
    });
    document.getElementById(`${elId}-start`).addEventListener('click', startGame);
  }

  async function startGame(){
    const startBtn = document.getElementById(`${elId}-start`);
    const errorEl = document.getElementById(`${elId}-error`);
    startBtn.disabled = true;
    startBtn.textContent = 'Chargement des données réelles…';
    errorEl.textContent = '';
    try {
      const difficulty = PORTFOLIO_DIFFICULTIES[difficultyId];
      const symbols = STOCKS_DEMO.map(s => s.ticker).concat([PORTFOLIO_BENCHMARK_SYMBOL]);
      const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbols.join(',')) + '&range=10y&interval=1mo');
      if(!resp.ok) throw new Error('HTTP ' + resp.status);
      const payload = await resp.json();
      const historyBySymbol = {};
      (payload.quotes || []).forEach(q => { if(Array.isArray(q.history)) historyBySymbol[q.symbol] = q.history; });

      const stockSymbols = STOCKS_DEMO.map(s => s.ticker);
      const commonDates = alignPortfolioDates(historyBySymbol, stockSymbols.concat([PORTFOLIO_BENCHMARK_SYMBOL]));
      if(commonDates.length < difficulty.turnCount + 1) throw new Error('Données historiques insuffisantes pour ce nombre de tours');
      const closeMaps = buildPortfolioCloseMaps(historyBySymbol, stockSymbols.concat([PORTFOLIO_BENCHMARK_SYMBOL]));
      const turnPeriods = buildPortfolioTurnPeriods(commonDates, difficulty.turnCount);

      const initialWeights = portfolioEqualWeights();
      game = {
        difficulty, difficultyId,
        closeMaps, turnPeriods,
        currentTurnIndex: 0,
        pendingWeights: initialWeights,
        pendingCashPct: 0,
        portfolioValueSeries: [PORTFOLIO_BUDGET],
        benchmarkValueSeries: [PORTFOLIO_BUDGET],
        weightsHistory: [],
        turnNarrations: []
      };
      renderTurn();
    } catch(err){
      errorEl.textContent = 'Partie indisponible pour le moment : ' + err.message;
      startBtn.disabled = false;
      startBtn.textContent = 'Lancer la partie';
    }
  }

  function renderTurn(){
    const g = game;
    const total = Object.values(g.pendingWeights).reduce((a, b) => a + b, 0) + g.pendingCashPct;
    const pct = Math.round((g.currentTurnIndex / g.difficulty.turnCount) * 100);
    const lastNarration = g.turnNarrations[g.turnNarrations.length - 1];

    const visiblePortfolio = g.difficulty.showFullHistoryChart ? g.portfolioValueSeries : g.portfolioValueSeries.slice(-3);
    const visibleBenchmark = g.difficulty.showFullHistoryChart ? g.benchmarkValueSeries : g.benchmarkValueSeries.slice(-3);
    const series = [{data: visiblePortfolio, color: 'var(--gold-bright)', width: 2}];
    if(g.difficulty.revealBenchmarkLive) series.push({data: visibleBenchmark, color: 'var(--text-dim)', dashed: true, width: 1.5});

    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Trimestre ${g.currentTurnIndex + 1} / ${g.difficulty.turnCount}</span><span>Valeur actuelle : ${fmtEUR(g.portfolioValueSeries[g.portfolioValueSeries.length - 1])}</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:16px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <div class="pattern-chart">${renderMultiLineChart(series, `Évolution de la valeur du portefeuille sur les ${g.currentTurnIndex + 1} trimestres joués`)}</div>
      ${lastNarration ? `<p class="disclaimer-box" style="margin-top:12px;">📰 ${lastNarration.statement}</p>` : ''}
      <span class="smallcaps" style="display:block;margin:16px 0 8px;">${g.currentTurnIndex === 0 ? 'Ta répartition de départ' : 'Rééquilibrer pour le tour suivant'}</span>
      <div class="portfolio-alloc-list">
        ${STOCKS_DEMO.map(s => `
          <div class="portfolio-alloc-row">
            <span class="portfolio-alloc-name">${s.nom} <span class="mono" style="color:var(--text-dim);font-size:11px;">${s.ticker} · ${s.secteur}</span></span>
            <input type="number" min="0" max="100" step="1" class="portfolio-alloc-input" data-ticker="${s.ticker}" value="${g.pendingWeights[s.ticker]}">
            <span class="mono" style="font-size:12px;color:var(--text-dim);">%</span>
          </div>`).join('')}
        <div class="portfolio-alloc-row">
          <span class="portfolio-alloc-name">Cash <span class="mono" style="color:var(--text-dim);font-size:11px;">non investi</span></span>
          <input type="number" min="0" max="100" step="1" class="portfolio-alloc-input" id="${elId}-cash" value="${g.pendingCashPct}">
          <span class="mono" style="font-size:12px;color:var(--text-dim);">%</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0;flex-wrap:wrap;gap:10px;">
        <span class="mono" id="${elId}-total" style="font-size:13px;color:${total === 100 ? 'var(--emerald)' : 'var(--bordeaux)'};">Total : ${total}%</span>
        <button class="btn btn-sm" id="${elId}-equal" type="button">Répartition égale</button>
      </div>
      <div id="${elId}-validation" style="color:var(--bordeaux);font-size:12.5px;margin-bottom:10px;"></div>
      <button class="btn btn-sm btn-gold" id="${elId}-confirm" type="button">${g.currentTurnIndex === g.difficulty.turnCount - 1 ? 'Jouer le dernier trimestre' : 'Passer au trimestre suivant'}</button>`;

    function readWeights(){
      const weights = {};
      el.querySelectorAll('.portfolio-alloc-input[data-ticker]').forEach(input => { weights[input.dataset.ticker] = Math.max(0, Math.min(100, +input.value || 0)); });
      const cashPct = Math.max(0, Math.min(100, +document.getElementById(`${elId}-cash`).value || 0));
      return {weights, cashPct};
    }
    function refreshTotal(){
      const {weights, cashPct} = readWeights();
      const newTotal = Object.values(weights).reduce((a, b) => a + b, 0) + cashPct;
      const totalEl = document.getElementById(`${elId}-total`);
      totalEl.textContent = `Total : ${newTotal}%`;
      totalEl.style.color = newTotal === 100 ? 'var(--emerald)' : 'var(--bordeaux)';
    }
    el.querySelectorAll('.portfolio-alloc-input').forEach(input => input.addEventListener('input', refreshTotal));
    document.getElementById(`${elId}-equal`).addEventListener('click', () => {
      g.pendingWeights = portfolioEqualWeights();
      g.pendingCashPct = 0;
      renderTurn();
    });
    document.getElementById(`${elId}-confirm`).addEventListener('click', () => {
      const {weights, cashPct} = readWeights();
      const {valid, errors} = validatePortfolioAllocation(weights, cashPct, g.difficulty);
      if(!valid){
        document.getElementById(`${elId}-validation`).innerHTML = errors.map(e => `<p>${e}</p>`).join('');
        return;
      }
      g.pendingWeights = weights;
      g.pendingCashPct = cashPct;
      advanceTurn();
    });
  }

  function advanceTurn(){
    const g = game;
    const dateStart = g.turnPeriods[g.currentTurnIndex];
    const dateEnd = g.turnPeriods[g.currentTurnIndex + 1];
    const startValue = g.portfolioValueSeries[g.portfolioValueSeries.length - 1];
    const startBenchmark = g.benchmarkValueSeries[g.benchmarkValueSeries.length - 1];

    g.weightsHistory.push({weights: g.pendingWeights, cashPct: g.pendingCashPct});
    const newValue = applyPortfolioTurnGrowth(startValue, g.pendingWeights, g.pendingCashPct, g.closeMaps, dateStart, dateEnd);
    const benchmarkGrowth = g.closeMaps[PORTFOLIO_BENCHMARK_SYMBOL][dateEnd] / g.closeMaps[PORTFOLIO_BENCHMARK_SYMBOL][dateStart];
    g.portfolioValueSeries.push(newValue);
    g.benchmarkValueSeries.push(startBenchmark * benchmarkGrowth);

    const tickerReturns = computePortfolioTurnReturns(g.closeMaps, dateStart, dateEnd);
    g.turnNarrations.push(describePortfolioTurn(tickerReturns, g.difficulty.nameSectors));

    g.currentTurnIndex++;
    if(g.currentTurnIndex >= g.difficulty.turnCount) renderResultsScreen();
    else renderTurn();
  }

  function renderResultsScreen(){
    const g = game;
    const result = computePortfolioGameResult(g.portfolioValueSeries, g.weightsHistory, g.benchmarkValueSeries, PORTFOLIO_BUDGET);
    const narrative = buildPortfolioGameNarrative(result, scenario);

    tryAwardQuizPoints(`portfolio-game-${new Date().toDateString()}`, 20, {usedSimulator: true});
    // Alimente la maîtrise réelle (section 18 du prompt Learning Engine :
    // "les résultats peuvent alimenter certaines compétences du profil") —
    // un objectif de partie atteint est traité comme une bonne réponse en
    // "Diversification" (vraie catégorie de quiz du domaine Bourse), avec le
    // niveau de difficulté choisi comme niveau de la question (mêmes clés
    // debutant/intermediaire/avance que les quiz).
    recordAnswer('Diversification', !!scenario.evaluate(result).metGoal, true, g.difficultyId);
    savePortfolioGameResult({
      date: new Date().toISOString(), difficultyId: g.difficultyId, scenarioId: 'croissanceMaitrisee', turnCount: g.difficulty.turnCount,
      finalWeights: g.weightsHistory[g.weightsHistory.length - 1], result
    });

    el.innerHTML = `
      <div class="pattern-chart">${renderMultiLineChart([
        {data: g.portfolioValueSeries, color: 'var(--gold-bright)', width: 2},
        {data: g.benchmarkValueSeries, color: 'var(--text-dim)', dashed: true, width: 1.5}
      ], `Comparaison de l'évolution de ton portefeuille (trait plein) et de ${PORTFOLIO_BENCHMARK_NAME} (trait pointillé)`)}</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin:14px 0;font-size:12px;color:var(--text-dim);">
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--gold-bright);border-radius:50%;margin-right:6px;"></span>Ton portefeuille</span>
        <span><span style="display:inline-block;width:10px;height:2px;background:var(--text-dim);margin-right:6px;vertical-align:middle;"></span>${PORTFOLIO_BENCHMARK_NAME}</span>
      </div>
      <div class="card-grid">
        <div class="card">
          <span class="smallcaps">Ton portefeuille</span>
          <div class="result-big" style="margin-top:6px;">${fmtEUR(g.portfolioValueSeries[g.portfolioValueSeries.length - 1])}</div>
          <p style="color:${result.returnPct >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};font-size:14px;margin-top:4px;">${fmtPct(result.returnPct)}</p>
        </div>
        <div class="card">
          <span class="smallcaps">${PORTFOLIO_BENCHMARK_NAME} (référence)</span>
          <div class="result-big" style="margin-top:6px;">${fmtEUR(g.benchmarkValueSeries[g.benchmarkValueSeries.length - 1])}</div>
          <p style="color:${result.benchmarkReturnPct >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};font-size:14px;margin-top:4px;">${fmtPct(result.benchmarkReturnPct)}</p>
        </div>
      </div>
      <p style="font-size:13px;color:var(--text-dim);margin:14px 0;">${narrative.outcomeText}</p>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:14px;">${narrative.decisionProcessText}</p>
      <p class="disclaimer-box">${narrative.scenarioFitText}</p>
      <p class="disclaimer-box" style="margin-top:10px;">Partie basée sur de vrais cours passés (Yahoo Finance, cotations différées), sur ${result.turnsPlayed} trimestres réels. Les performances passées ne préjugent jamais des performances futures.</p>
      <button class="btn btn-sm btn-gold" id="${elId}-restart" style="margin-top:6px;">Nouvelle partie</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-restart`).addEventListener('click', renderSetup);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'stockMarket'});
  }

  renderSetup();
}
