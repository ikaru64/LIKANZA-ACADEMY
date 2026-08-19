/* ============================================================
   LIKANZA ACADEMY — Business Game (jeu-business.html)
   Moteur de gestion d'entreprise à tours : le temps avance, chaque
   décision a des effets définis à l'avance (jamais générés à la volée),
   les effets persistent d'un tour à l'autre, plusieurs stratégies
   viables, plusieurs fins possibles. Jamais un simple quiz, jamais un
   générateur d'événements aléatoires sans logique : chaque événement
   n'apparaît que si l'état actuel de l'entreprise le justifie (voir
   `conditions` dans scripts/games/business-game-data.js).

   Architecture : DONNÉES (business-game-data.js) → CONTEXTE ÉCONOMIQUE
   (BUSINESS_ERAS) → ÉTAT → ÉVÉNEMENT filtré → DÉCISION → RÈGLES DU
   MODÈLE (sector.simulateMonth, pur et déterministe) → NOUVEL ÉTAT →
   tour suivant. Comme le jeu de portefeuille (portfolio-game.js), le
   résultat final sépare toujours ce qui s'est passé (résultat) de
   comment le joueur a joué (processus de décision) — jamais confondus.
   ============================================================ */

const BUSINESS_GAME_OUTCOME_META = {
  rentable:  {emoji:'🟢', label:'Entreprise rentable'},
  stable:    {emoji:'🟡', label:'Entreprise stable'},
  levee:     {emoji:'🟣', label:'Levée de fonds envisagée'},
  acquisition:{emoji:'🤝', label:'Opportunité de rachat'},
  pivot:     {emoji:'🟠', label:'Pivot nécessaire'},
  faillite:  {emoji:'🔴', label:'Faillite'}
};

function getBusinessGameHistory(){ return safeGetJSON('fzr-business-game-history', []); }
function saveBusinessGameResult(entry){
  const history = getBusinessGameHistory();
  history.unshift(entry);
  safeSetJSON('fzr-business-game-history', history.slice(0, 20));
}
// Transfert en provenance de Business Strategy (construire-son-projet.js) :
// { sectorKey, clientCible, budgetInitial, businessModel, strategieChoisie }.
// Lu ici, jamais réécrit par ce fichier ; supprimé après lecture pour ne pas
// pré-remplir une partie suivante sans rapport.
function readBusinessStrategyTransfer(){
  const data = safeGetJSON('fzr-business-strategy-transfer', null);
  if(data) safeSetJSON('fzr-business-strategy-transfer', null);
  return data;
}

// ---------- Sélection d'événement : filtrée par l'état réel, jamais du hasard pur ----------
function pickBusinessEvent(sector, state, month, shownIds){
  const candidates = sector.events.filter(ev => {
    if(ev.onceOnly && shownIds.has(ev.id)) return false;
    if(ev.minMonth && month < ev.minMonth) return false;
    if(ev.maxMonth && month > ev.maxMonth) return false;
    if(ev.conditions && !ev.conditions(state)) return false;
    return true;
  });
  if(candidates.length === 0) return sector.events.find(ev => ev.id.endsWith('-mois-calme') || ev.id.endsWith('-calme')) || sector.events[sector.events.length - 1];
  const maxPriority = Math.max(...candidates.map(e => e.priority || 1));
  const topTier = candidates.filter(e => (e.priority || 1) === maxPriority);
  return topTier[Math.floor(Math.random() * topTier.length)];
}

// ---------- Bilan causal : identifie, parmi les vraies décisions prises,
// celles qui ont le plus pesé sur les charges fixes et le churn (facteurs
// négatifs) ou sur la réputation/qualité produit/clients (facteurs positifs)
// — jamais un texte canné, toujours dérivé du vrai journal de décisions. ----------
function buildBusinessGameCausalFactors(decisionLog){
  const negative = decisionLog
    .filter(d => (d.delta.monthlyFixedCosts || 0) > 0 || (d.delta.churnPct || 0) > 0 || (d.delta.cash || 0) < -1000)
    .map(d => ({label: `${d.optionLabel} (mois ${d.month})`, weight: (d.delta.monthlyFixedCosts||0)*3 + (d.delta.churnPct||0)*2000 + Math.max(0,-(d.delta.cash||0))}))
    .sort((a,b) => b.weight - a.weight)
    .slice(0, 3)
    .map(d => d.label);
  const positive = decisionLog
    .filter(d => (d.delta.reputation || 0) > 0 || (d.delta.productQuality || 0) > 0 || (d.delta.satisfaction || 0) > 0)
    .map(d => ({label: `${d.optionLabel} (mois ${d.month})`, weight: (d.delta.reputation||0) + (d.delta.productQuality||0) + (d.delta.satisfaction||0)}))
    .sort((a,b) => b.weight - a.weight)
    .slice(0, 2)
    .map(d => d.label);
  return {negative, positive};
}

function buildBusinessGameNarrative(sector, era, initialState, finalState, decisionLog, outcome, monthsPlayed){
  const meta = BUSINESS_GAME_OUTCOME_META[outcome];
  const outcomeText = outcome === 'faillite'
    ? `Ta trésorerie est tombée à ${fmtEUR(Math.round(finalState.cash))} au mois ${monthsPlayed} : l'entreprise n'a pas pu continuer. Elle comptait alors ${finalState.clients} client(s) pour ${fmtEUR(Math.round(finalState.mrr))}/mois de revenu récurrent.`
    : `Après ${monthsPlayed} mois, l'entreprise compte ${finalState.clients} client(s), ${fmtEUR(Math.round(finalState.mrr))}/mois de revenu récurrent, et ${fmtEUR(Math.round(finalState.cash))} de trésorerie (contre ${fmtEUR(initialState.cash)} au départ).`;

  const {negative, positive} = buildBusinessGameCausalFactors(decisionLog);
  let decisionProcessText;
  if(outcome === 'faillite' || outcome === 'pivot'){
    decisionProcessText = negative.length
      ? `Les décisions qui ont le plus pesé sur cette trajectoire : ${negative.join(', ')}.`
      : `Aucune décision isolée n'explique clairement ce résultat : la dynamique organique du secteur (acquisition, churn, coûts) a suffi à elle seule.`;
  } else {
    decisionProcessText = positive.length
      ? `Les décisions qui ont le plus contribué à ce résultat : ${positive.join(', ')}.`
      : `Ce résultat vient surtout de la dynamique organique du secteur plus que d'une décision isolée.`;
  }

  return {outcomeText, decisionProcessText, outcomeLabel: `${meta.emoji} ${meta.label}`};
}

// ---------- UI : configuration → boucle de tours → résultats ----------
function renderBusinessGame(elId){
  const el = document.getElementById(elId);
  if(!el) return;

  let sectorKey = 'saas';
  let eraKey = 'actuel';
  let transfer = readBusinessStrategyTransfer();
  if(transfer && transfer.sectorKey && BUSINESS_SECTORS[transfer.sectorKey]) sectorKey = transfer.sectorKey;
  let game = null;

  function renderSetup(){
    const sector = BUSINESS_SECTORS[sectorKey];
    el.innerHTML = `
      ${transfer ? `<p class="disclaimer-box" style="margin-bottom:14px;">${renderDataBadge('avis')} Paramètres repris de ton analyse dans Business Strategy : secteur ${sector.label}${transfer.budgetInitial ? `, capital ${fmtEUR(transfer.budgetInitial)}` : ''}${transfer.strategieChoisie ? `, stratégie « ${transfer.strategieChoisie} »` : ''}.</p>` : ''}
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:14px;">Choisis un secteur et un contexte économique, puis prends une décision chaque mois. Chaque option a des effets définis à l'avance — jamais un hasard sans logique. ${renderDataBadge('simulation')}</p>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Secteur</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;" id="${elId}-sectors">
        ${BUSINESS_SECTOR_ORDER.map(key => `<button type="button" class="pill sector-btn ${key===sectorKey?'active':''}" data-sector="${key}">${BUSINESS_SECTORS[key].icon} ${BUSINESS_SECTORS[key].label}</button>`).join('')}
      </div>
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${sector.description}</p>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Contexte économique</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;" id="${elId}-eras">
        ${BUSINESS_ERA_ORDER.map(key => `<button type="button" class="pill era-btn ${key===eraKey?'active':''}" data-era="${key}">📅 ${BUSINESS_ERAS[key].label}</button>`).join('')}
      </div>
      <div id="${elId}-era-facts" style="margin-bottom:16px;"></div>
      <button class="btn btn-gold" id="${elId}-start" type="button">Lancer l'entreprise</button>`;

    function renderEraFacts(){
      const era = BUSINESS_ERAS[eraKey];
      const factsEl = document.getElementById(`${elId}-era-facts`);
      if(era.facts.length === 0){
        factsEl.innerHTML = `<p class="disclaimer-box">${era.note}</p>`;
        return;
      }
      const mod = era.modifiers[sectorKey];
      factsEl.innerHTML = `
        <div class="disclaimer-box">
          ${era.facts.map(f => `<p style="margin-bottom:6px;">${renderDataBadge('fait')} ${f.text} <em style="color:var(--text-dim);">— ${f.source}</em></p>`).join('')}
          ${mod && mod.note ? `<p style="margin-top:8px;">${renderDataBadge('calcul')} ${mod.note}</p>` : ''}
          <p style="margin-top:8px;font-size:12px;">${era.note}</p>
        </div>`;
    }
    renderEraFacts();

    el.querySelectorAll('.sector-btn').forEach(btn => btn.addEventListener('click', () => {
      sectorKey = btn.dataset.sector;
      renderSetup();
    }));
    el.querySelectorAll('.era-btn').forEach(btn => btn.addEventListener('click', () => {
      eraKey = btn.dataset.era;
      el.querySelectorAll('.era-btn').forEach(b => b.classList.toggle('active', b.dataset.era === eraKey));
      renderEraFacts();
    }));
    document.getElementById(`${elId}-start`).addEventListener('click', startGame);
  }

  function startGame(){
    const sector = BUSINESS_SECTORS[sectorKey];
    const overrides = {};
    if(transfer && transfer.budgetInitial > 0) overrides.cash = transfer.budgetInitial;
    game = {
      sectorKey, eraKey,
      month: 0,
      state: sector.startingState(overrides),
      initialState: sector.startingState(overrides),
      shownEventIds: new Set(),
      decisionLog: [],
      finished: false
    };
    renderTurn();
  }

  function renderTurn(){
    const sector = BUSINESS_SECTORS[game.sectorKey];
    const month = game.month + 1;
    const event = pickBusinessEvent(sector, game.state, month, game.shownEventIds);
    game.currentEvent = event;
    const situation = event.buildSituation(game.state);
    const pct = Math.round((game.month / sector.totalMonths) * 100);

    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Mois ${month} / ${sector.totalMonths}</span><span>Cash : ${fmtEUR(Math.round(game.state.cash))}</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:16px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <div class="card-grid" style="margin-bottom:14px;">
        <div class="card"><span class="smallcaps">Clients</span><div class="result-big" style="font-size:20px;margin-top:4px;">${game.state.clients}</div></div>
        <div class="card"><span class="smallcaps">Revenu mensuel</span><div class="result-big" style="font-size:20px;margin-top:4px;">${fmtEUR(Math.round(game.state.mrr))}</div></div>
        <div class="card"><span class="smallcaps">Réputation</span><div class="result-big" style="font-size:20px;margin-top:4px;">${Math.round(game.state.reputation)}/100</div></div>
      </div>
      <h3 style="margin-bottom:6px;">${event.title}</h3>
      <p style="color:var(--text-dim);font-size:13.5px;margin-bottom:10px;">${situation.description}</p>
      ${situation.dataPoints && situation.dataPoints.length ? `<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text-dim);margin-bottom:14px;">${situation.dataPoints.map(d=>`<span><strong style="color:var(--text);">${d.label} :</strong> ${d.value}</span>`).join('')}</div>` : ''}
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Que fais-tu ?</span>
      <div class="business-options-list" id="${elId}-options">
        ${event.options.map((opt, i) => `
          <button type="button" class="business-option-btn" data-idx="${i}" style="display:block;width:100%;text-align:left;background:var(--bg);border:1px solid var(--hairline);border-radius:2px;padding:12px 14px;margin-bottom:8px;cursor:pointer;">
            <strong style="color:var(--gold-bright);">${String.fromCharCode(65+i)}. ${opt.label}</strong>
            <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${opt.explanation}</p>
          </button>`).join('')}
      </div>`;

    el.querySelectorAll('.business-option-btn').forEach(btn => {
      btn.addEventListener('click', () => chooseOption(event, event.options[+btn.dataset.idx]));
    });
  }

  function chooseOption(event, option){
    const sector = BUSINESS_SECTORS[game.sectorKey];
    const before = game.state;
    const delta = option.effects(before) || {};
    const afterDecision = Object.assign({}, before, delta);
    const afterMonth = sector.simulateMonth(afterDecision, game.eraKey);

    game.decisionLog.push({
      month: game.month + 1, eventTitle: event.title, optionLabel: option.label,
      explanation: option.explanation, delta,
      cashBefore: before.cash, cashAfter: afterMonth.cash
    });
    game.shownEventIds.add(event.id);
    game.state = afterMonth;
    game.month++;

    const outcome = sector.endingRules(game.state, game.month, sector.totalMonths);
    if(outcome) renderResults(outcome);
    else renderTurn();
  }

  function renderResults(outcome){
    const sector = BUSINESS_SECTORS[game.sectorKey];
    const narrative = buildBusinessGameNarrative(sector, game.eraKey, game.initialState, game.state, game.decisionLog, outcome, game.month);
    const meta = BUSINESS_GAME_OUTCOME_META[outcome];

    tryAwardQuizPoints(`business-game-${new Date().toDateString()}`, 20, {usedSimulator:true});
    const resultEntry = {
      date: new Date().toISOString(), sectorKey: game.sectorKey, eraKey: game.eraKey,
      outcome, monthsPlayed: game.month,
      finalCash: game.state.cash, finalClients: game.state.clients, finalMrr: game.state.mrr,
      decisionCount: game.decisionLog.length
    };
    saveBusinessGameResult(resultEntry);

    el.innerHTML = `
      <div class="result-label">${narrative.outcomeLabel}</div>
      <p style="font-size:13px;color:var(--text-dim);margin:10px 0;">${narrative.outcomeText}</p>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:14px;">${narrative.decisionProcessText}</p>
      <div class="card-grid" style="margin-bottom:14px;">
        <div class="card"><span class="smallcaps">Clients finaux</span><div class="result-big" style="font-size:20px;margin-top:4px;">${game.state.clients}</div></div>
        <div class="card"><span class="smallcaps">Revenu mensuel final</span><div class="result-big" style="font-size:20px;margin-top:4px;">${fmtEUR(Math.round(game.state.mrr))}</div></div>
        <div class="card"><span class="smallcaps">Décisions prises</span><div class="result-big" style="font-size:20px;margin-top:4px;">${game.decisionLog.length}</div></div>
      </div>
      <p class="disclaimer-box">${renderDataBadge('simulation')} Partie basée sur un modèle pédagogique déterministe (voir scripts/games/business-game-data.js) : les effets de chaque décision sont des paramètres de conception écrits à l'avance, jamais générés au hasard ni garantis pour une vraie entreprise.</p>
      <button class="btn btn-sm btn-gold" id="${elId}-restart" style="margin-top:10px;">Nouvelle partie</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-restart`).addEventListener('click', renderSetup);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  }

  renderSetup();
}

// ---------- UI : Business Stories — découvre la situation, décide, puis
// seulement ensuite découvre de quelle entreprise réelle elle s'inspire
// (§19 : jamais l'inverse, jamais un fait inventé sur une vraie entreprise). ----------
function renderBusinessStories(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  let activeId = null;
  let chosenOptionId = null;

  function renderList(){
    chosenOptionId = null;
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:14px;">Chaque récit s'inspire d'une vraie entreprise, à un vrai moment de décision. Découvre la situation, décide ce que tu aurais fait, puis compare avec ce qui s'est réellement passé.</p>
      <div class="card-grid" id="${elId}-list">
        ${BUSINESS_STORIES.map(s => `
          <div class="card business-story-card" data-story="${s.id}" style="cursor:pointer;">
            <span class="smallcaps">${BUSINESS_SECTORS[s.sectorKey].label}</span>
            <h4 style="margin:6px 0;">${s.icon} ${s.title}</h4>
            <span style="font-size:12px;color:var(--gold-bright);">Découvrir ce récit →</span>
          </div>`).join('')}
      </div>`;
    el.querySelectorAll('.business-story-card').forEach(card => {
      card.addEventListener('click', () => { activeId = card.dataset.story; renderSetup(); });
    });
  }

  function currentStory(){ return BUSINESS_STORIES.find(s => s.id === activeId); }

  function renderSetup(){
    const story = currentStory();
    el.innerHTML = `
      <button type="button" class="btn btn-sm" id="${elId}-back" style="margin-bottom:14px;">← Tous les récits</button>
      <span class="smallcaps">${BUSINESS_SECTORS[story.sectorKey].label}</span>
      <h3 style="margin:6px 0 10px;">${story.icon} ${story.title}</h3>
      <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;margin-bottom:10px;">${story.setup.description}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text-dim);margin-bottom:16px;">${story.setup.dataPoints.map(d=>`<span><strong style="color:var(--text);">${d.label} :</strong> ${d.value}</span>`).join('')}</div>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">${story.choice.question}</span>
      <div id="${elId}-choice-options">
        ${story.choice.options.map(opt => `
          <button type="button" class="business-option-btn story-choice-btn" data-opt="${opt.id}" style="display:block;width:100%;text-align:left;background:var(--bg);border:1px solid var(--hairline);border-radius:2px;padding:12px 14px;margin-bottom:8px;cursor:pointer;">
            <strong style="color:var(--gold-bright);">${opt.label}</strong>
          </button>`).join('')}
      </div>`;
    document.getElementById(`${elId}-back`).addEventListener('click', renderList);
    el.querySelectorAll('.story-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => { chosenOptionId = btn.dataset.opt; renderReveal(); });
    });
  }

  function renderReveal(){
    const story = currentStory();
    const chosenOption = story.choice.options.find(o => o.id === chosenOptionId);
    el.innerHTML = `
      <button type="button" class="btn btn-sm" id="${elId}-back" style="margin-bottom:14px;">← Tous les récits</button>
      <span class="smallcaps">${BUSINESS_SECTORS[story.sectorKey].label}</span>
      <h3 style="margin:6px 0 10px;">${story.icon} ${story.title}</h3>
      <p class="disclaimer-box" style="margin-bottom:14px;">🔀 Ton choix : « ${chosenOption.label} »</p>
      <p style="font-size:13.5px;margin-bottom:10px;">Ce récit était inspiré de <strong>${story.reveal.companyName}</strong>.</p>
      <div class="disclaimer-box" style="margin-bottom:12px;">
        ${story.reveal.whatReallyHappened.map(f => `<p style="margin-bottom:6px;">${renderDataBadge('fait')} ${f.text} <em style="color:var(--text-dim);">— ${f.source}</em></p>`).join('')}
      </div>
      <div class="disclaimer-box" style="margin-bottom:12px;">
        ${story.reveal.gameSimplifications.map(t => `<p style="margin-bottom:6px;">${renderDataBadge('simulation')} ${t}</p>`).join('')}
      </div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">${story.reveal.playerChoiceNote}</p>
      <a href="jeu-business.html" class="btn btn-sm btn-gold">🎮 Essayer ce secteur dans le Business Game</a>`;
    document.getElementById(`${elId}-back`).addEventListener('click', renderList);
  }

  renderList();
}
