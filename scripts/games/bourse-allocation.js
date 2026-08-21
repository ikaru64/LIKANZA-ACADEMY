/* ============================================================
   LIKANZA ACADEMY — "J'ai X€ à investir" : scénarios par risque
   Classe les valeurs réellement suivies (getFollowedStocks) en 3
   groupes (prudent/équilibré/dynamique) à partir de vraies données
   calculées (volatilité, drawdown, endettement — jamais un tier
   inventé). Jamais "sans risque" : toujours "moins risqué relativement
   aux autres options analysées". Réutilise deriveStrengthsWeaknesses
   (data.js) pour expliquer pourquoi chaque valeur apparaît dans son
   groupe — aucune nouvelle rédaction par entreprise.
   ============================================================ */

const ALLOCATION_TIER_META = {
  prudent:   {emoji: '🟢', label: 'Profil prudent', desc: 'valeurs les moins risquées relativement aux autres analysées ici — une action reste toujours risquée.'},
  equilibre: {emoji: '🟡', label: 'Profil équilibré', desc: 'un compromis entre risque et potentiel de gain, relativement aux autres valeurs analysées.'},
  dynamique: {emoji: '🔴', label: 'Profil dynamique', desc: 'valeurs les plus risquées relativement aux autres analysées ici — potentiel de gain plus élevé, mais aussi de perte.'}
};

async function renderAllocationScenarios(elId, capital){
  const el = document.getElementById(elId);
  if(!el) return;
  const followed = getFollowedStocks();
  if(followed.length < 3){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Tu suis actuellement ${followed.length} valeur${followed.length>1?'s':''} — ajoute au moins 3 valeurs suivies (depuis Bourse) pour obtenir un classement par risque pertinent.</p>`;
    return;
  }
  el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Analyse de tes ${followed.length} valeurs suivies…</p>`;

  const symbols = followed.map(s => s.symbol);
  let fundamentalsMap = {};
  try { fundamentalsMap = await loadCompanyFundamentals(symbols); } catch(err){ console.info('Likanza Academy — allocation, fondamentaux indisponibles :', err.message); }

  const results = await Promise.all(symbols.map(async symbol => {
    let volatility = null, drawdown = null;
    try {
      const history = await fetchSymbolMonthlyHistory(symbol, '5y');
      const volResult = computeMonthlyReturnVolatility(history);
      volatility = volResult ? volResult.monthlyStdevPct : null;
      const invest = computeHistoricalInvestment(history, 1000, 0);
      drawdown = invest ? invest.maxDrawdownPct : null;
    } catch(err){ console.info(`Likanza Academy — allocation, historique indisponible pour ${symbol} :`, err.message); }
    const fundEntry = fundamentalsMap[symbol];
    const fields = fundEntry && fundEntry.fundamentals ? fundEntry.fundamentals.fields : null;
    const tier = computeRiskTier(fields, volatility);
    return {symbol, name: (followed.find(f => f.symbol === symbol) || {}).name || symbol, fields, volatility, drawdown, tier};
  }));

  const usable = results.filter(r => r.tier);
  if(usable.length < 3){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Données insuffisantes pour classer tes valeurs suivies par risque en ce moment (historique ou fondamentaux temporairement indisponibles pour plusieurs d'entre elles).</p>`;
    return;
  }

  const groups = {prudent: [], equilibre: [], dynamique: []};
  usable.forEach(r => groups[r.tier].push(r));

  function stockCard(r){
    const sw = r.fields ? deriveStrengthsWeaknesses(r.fields) : {strengths: [], weaknesses: []};
    const volLabel = bucketVolatility(r.volatility);
    const allocation = capital > 0 ? capital / usable.filter(x => x.tier === r.tier).length : null;
    return `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${r.name} <span style="font-size:11px;color:var(--text-dim);">${r.symbol}</span></strong>
          ${allocation ? `<span class="val mono" style="font-size:12.5px;">${fmtEUR(allocation)}</span>` : ''}
        </div>
        <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${volLabel ? volLabel.label : 'Volatilité non calculable actuellement'}${typeof r.drawdown === 'number' ? ` · pire baisse historique observée : -${r.drawdown.toFixed(1)}%` : ''}</p>
        ${sw.strengths.length ? `<p style="font-size:12px;margin-top:8px;"><strong style="color:var(--emerald);">Pourquoi elle apparaît ici :</strong> ${sw.strengths[0]}</p>` : ''}
        ${sw.weaknesses.length ? `<p style="font-size:12px;margin-top:4px;"><strong style="color:var(--bordeaux);">Pourquoi elle pourrait ne pas convenir :</strong> ${sw.weaknesses[0]}</p>` : ''}
        <a href="action.html#${encodeURIComponent(r.symbol)}" style="font-size:12px;color:var(--gold-bright);display:inline-block;margin-top:8px;">Voir la fiche complète →</a>
      </div>`;
  }

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:16px;">${renderDataBadge('analyse')} Classement basé sur la volatilité mensuelle réelle (5 ans) et l'endettement net de tes valeurs suivies — jamais une garantie de performance, jamais un conseil personnalisé.</p>
    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));align-items:start;">
      ${Object.entries(ALLOCATION_TIER_META).map(([key, meta]) => `
        <div>
          <div class="card" style="margin-bottom:10px;border-color:var(--gold);">
            <strong>${meta.emoji} ${meta.label}</strong>
            <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${meta.desc}</p>
          </div>
          ${groups[key].length ? groups[key].map(stockCard).join('') : `<p style="font-size:12px;color:var(--text-dim);">Aucune de tes valeurs suivies ne correspond à ce profil actuellement.</p>`}
        </div>`).join('')}
    </div>
    <p class="disclaimer-box" style="margin-top:16px;">${renderDataBadge('avis')} Parmi les valeurs suivies analysées, celles-ci correspondent le mieux, selon les données disponibles, aux critères de chaque profil. Cela ne constitue pas une garantie de performance ni un conseil personnalisé — une action reste toujours risquée, quel que soit son groupe.</p>`;

  tryAwardQuizPoints(`allocation-scenarios-${new Date().toDateString()}`, 5, {allocationScenariosViewed: true});
}

/* ============================================================
   Simulateur de portefeuille : pondère les valeurs suivies,
   agrège leur historique réel commun (computePortfolioSeries),
   affiche CAGR/drawdown réels + 2 stress-tests sur des fenêtres
   historiques réelles prédéfinies (PORTFOLIO_STRESS_WINDOWS,
   scripts/data.js). Jamais un pourcentage de krach inventé : une
   fenêtre non couverte par l'historique disponible l'affiche
   honnêtement plutôt que de l'estimer.
   ============================================================ */
function renderPortfolioSimulator(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const followed = getFollowedStocks();
  if(followed.length < 2){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Suis au moins 2 valeurs (depuis Bourse) pour construire un portefeuille.</p>`;
    return;
  }

  function renderForm(){
    el.innerHTML = `
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">Pondère tes valeurs suivies (parts relatives, normalisées automatiquement à 100%), puis calcule la performance historique réelle de ce portefeuille.</p>
      ${followed.map(s => `
        <div class="field" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;max-width:360px;">
          <label style="flex:1;font-size:13px;">${s.name || s.symbol} <span style="color:var(--text-dim);font-size:11px;">${s.symbol}</span></label>
          <input type="number" id="${elId}-weight-${s.symbol}" value="1" min="0" step="0.5" style="width:70px;">
        </div>`).join('')}
      <button type="button" class="btn btn-gold" id="${elId}-calc" style="margin-top:10px;">Calculer mon portefeuille</button>
      <div id="${elId}-result" style="margin-top:16px;"></div>`;
    document.getElementById(`${elId}-calc`).addEventListener('click', computeAndRender);
  }

  async function computeAndRender(){
    const resultEl = document.getElementById(`${elId}-result`);
    resultEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Récupération de l'historique réel…</p>`;
    const weighted = followed.map(s => ({symbol: s.symbol, weight: +document.getElementById(`${elId}-weight-${s.symbol}`).value || 0})).filter(s => s.weight > 0);
    if(weighted.length < 2){
      resultEl.innerHTML = `<p style="color:var(--bordeaux);font-size:13px;">Attribue un poids à au moins 2 valeurs.</p>`;
      return;
    }
    let entries;
    try {
      entries = await Promise.all(weighted.map(async w => ({...w, monthlyPoints: await fetchSymbolMonthlyHistory(w.symbol, '5y')})));
    } catch(err){
      resultEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Historique temporairement indisponible pour une ou plusieurs valeurs (${err.message}).</p>`;
      return;
    }
    const series = computePortfolioSeries(entries);
    if(!series || series.insufficientHistory){
      resultEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Historique commun insuffisant entre ces valeurs (${series ? series.commonMonths : 0} mois communs, 12 minimum) pour un calcul agrégé fiable.</p>`;
      return;
    }
    const invest = computeHistoricalInvestment(series.portfolioIndex, 1, 0);
    const stressResults = PORTFOLIO_STRESS_WINDOWS.map(w => ({...w, result: computeStressWindowReturn(series.portfolioIndex, w.start, w.end)}));

    resultEl.innerHTML = `
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">${renderDataBadge('fait')} Calculé sur ${series.commonMonths} mois d'historique réel commun aux ${series.weights.length} valeurs pondérées.</p>
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:16px;">
        <div class="card"><span class="smallcaps">Rendement annualisé (CAGR)</span><div class="result-big" style="font-size:19px;margin-top:6px;color:${invest.cagr>=0?'var(--emerald)':'var(--bordeaux)'};">${invest.cagr>=0?'+':''}${invest.cagr.toFixed(1)}%</div></div>
        <div class="card"><span class="smallcaps">Pire baisse historique</span><div class="result-big" style="font-size:19px;margin-top:6px;color:var(--bordeaux);">-${invest.maxDrawdownPct.toFixed(1)}%</div></div>
        <div class="card"><span class="smallcaps">Années négatives</span><div class="result-big" style="font-size:19px;margin-top:6px;">${invest.negativeYears} / ${invest.yearlyReturns.length}</div></div>
      </div>
      <span class="smallcaps">Que se serait-il passé pendant...</span>
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-top:8px;">
        ${stressResults.map(sw => `
          <div class="card">
            <strong style="font-size:13px;">${sw.label}</strong>
            ${sw.result
              ? `<div class="result-big" style="font-size:18px;margin-top:6px;color:${sw.result.changePct>=0?'var(--emerald)':'var(--bordeaux)'};">${sw.result.changePct>=0?'+':''}${sw.result.changePct.toFixed(1)}%</div><p style="font-size:11px;color:var(--text-dim);margin-top:4px;">${sw.result.startPeriod} → ${sw.result.endPeriod}, sur ce portefeuille</p>`
              : `<p style="font-size:12px;color:var(--text-dim);margin-top:6px;">Période non couverte par l'historique disponible pour ce portefeuille.</p>`}
          </div>`).join('')}
      </div>
      <p class="disclaimer-box" style="margin-top:14px;">${renderDataBadge('scenario')} Performance rétrospective sur des données réelles — ne préjuge en rien de la composition future de ce portefeuille ni de ses performances à venir.</p>`;
    tryAwardQuizPoints(`portfolio-simulator-${new Date().toDateString()}`, 5, {portfolioSimulatorUsed: true});
  }

  renderForm();
}
