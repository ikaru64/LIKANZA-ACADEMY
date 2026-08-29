/* ============================================================
   LIKANZA ACADEMY — Analyser une vraie entreprise (Formations Phase 5)
   Parcours guidé parallèle à construire-son-projet.js, mais pour LIRE une
   entreprise réelle plutôt que d'en construire une fictive : mêmes briques
   (étapes déclaratives, barre de progression, écran de synthèse) — sauf
   que chaque étape RÉVÈLE une vraie donnée déjà sourcée (BUSINESS_CASES) ou
   récupérée en direct (loadCompanyFundamentals, Yahoo Finance via
   /api/company-profile) plutôt que de collecter une réponse de
   l'utilisateur. Seules les 8 entreprises encore cotées de BUSINESS_CASES
   (celles avec un champ `ticker`) sont proposées ici — les 4 autres
   (Mailchimp, Zappos, Blockbuster, WeWork) restent uniquement consultables
   sur business-cases.html, aucune donnée financière réelle n'existant plus
   pour elles. Jamais une donnée inventée : un champ Yahoo manquant s'affiche
   honnêtement comme indisponible (FUNDAMENTALS_UNAVAILABLE_TEXT), jamais un
   0 ou une estimation fabriquée. ============================================================ */

const ELIGIBLE_ANALYSE_CASES = BUSINESS_CASES.filter(c => !!c.ticker);

const ANALYSE_STEPS = [
  {key: 'contexte', title: 'Le contexte réel', category: 'Contexte', prompt: "Une vraie situation d'entreprise, avant de regarder le moindre chiffre."},
  {key: 'probleme', title: 'Le problème à résoudre', category: 'Contexte', prompt: "Ce que cette entreprise devait affronter, concrètement."},
  {key: 'predire', title: 'À toi de jouer : prédis avant de vérifier', category: 'Les vrais chiffres', prompt: "Fais ta propre hypothèse avant de voir la réalité — c'est ce qui rend l'exercice utile, pas juste informatif."},
  {key: 'chiffres', title: 'Les vrais chiffres', category: 'Les vrais chiffres', prompt: "Données réelles, récupérées en direct — jamais une estimation fabriquée si une valeur manque."},
  {key: 'strategie', title: 'La stratégie réellement suivie', category: 'Stratégie', prompt: "Ce que l'entreprise a choisi de faire face à ce problème."},
  {key: 'resultats', title: "Ce qui s'est réellement passé", category: 'Résultats', prompt: "Des résultats sourcés, jamais une success story sans preuve — et ce que tes propres chiffres suggèrent."},
  {key: 'limites', title: 'Les limites de ce cas', category: 'Prendre du recul', prompt: "Pourquoi cette stratégie ne se copie jamais telle quelle ailleurs."},
  {key: 'synthese', title: 'À retenir', category: 'Bilan', prompt: "Le point clé de ce cas, et des questions pour ton propre projet."}
];

let selectedCase = null;
let fundamentals = null;
let stepIndex = 0;

function analyseFields(){
  return (fundamentals && fundamentals.fundamentals && fundamentals.fundamentals.fields) || null;
}

function renderIntro(){
  const el = document.getElementById('analyseIntro');
  el.innerHTML = `
    <span class="smallcaps">Facultatif · environ 8 minutes</span>
    <h2 class="display" style="font-size:26px;font-weight:600;margin:10px 0;">Analyser une vraie entreprise</h2>
    <p style="color:var(--text-dim);font-size:14px;line-height:1.6;margin-bottom:8px;">Choisis une entreprise réelle parmi celles déjà décryptées dans nos Business Case Studies. Tu vas revivre son histoire, prédire ce que montrent ses chiffres avant de les découvrir, puis regarder ses vraies données financières — récupérées en direct, jamais inventées.</p>
    <p class="disclaimer-box">Une stratégie qui a marché pour une entreprise réelle n'est jamais automatiquement adaptée à un autre projet — ce parcours donne du contexte et des questions, jamais une recette à copier.</p>
    <div class="card-grid" style="margin-top:18px;">
      ${ELIGIBLE_ANALYSE_CASES.map(c => `
        <button type="button" class="card play-tile" data-case="${c.id}" style="text-align:left;cursor:pointer;width:100%;">
          <span class="smallcaps">${c.secteur}</span>
          <h4 style="margin:8px 0 6px;">${c.icon} ${c.entreprise}</h4>
          <span style="font-size:11px;color:var(--text-dim);">${BUSINESS_CASE_TYPE_META[c.type].emoji} ${BUSINESS_CASE_TYPE_META[c.type].label} · ${c.ticker}</span>
          <span style="font-size:12px;color:var(--gold-bright);display:block;margin-top:10px;">Analyser →</span>
        </button>`).join('')}
    </div>
    <a href="business-cases.html" class="btn btn-sm" style="margin-top:16px;">← Voir tous les Business Case Studies (dont ceux sans données live)</a>`;
  el.querySelectorAll('[data-case]').forEach(btn => {
    btn.addEventListener('click', () => startAnalysis(btn.dataset.case));
  });
}

function startAnalysis(caseId){
  selectedCase = BUSINESS_CASES.find(c => c.id === caseId);
  if(!selectedCase) return;
  document.getElementById('analyseIntro').style.display = 'none';
  document.getElementById('analyseLoading').style.display = 'block';
  document.getElementById('analyseLoading').innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Récupération des vraies données financières de ${selectedCase.entreprise}...</p>`;
  loadCompanyFundamentals([selectedCase.ticker]).then(cache => {
    fundamentals = cache[selectedCase.ticker] || null;
    document.getElementById('analyseLoading').style.display = 'none';
    document.getElementById('analyseStep').style.display = 'block';
    stepIndex = 0;
    renderStep();
  });
}

function renderStep(){
  const step = ANALYSE_STEPS[stepIndex];
  document.getElementById('analyseStepCounter').textContent = `Étape ${stepIndex + 1} / ${ANALYSE_STEPS.length}`;
  document.getElementById('analyseStepCategory').textContent = step.category;
  const pct = Math.round((stepIndex / (ANALYSE_STEPS.length - 1)) * 100);
  document.getElementById('analyseProgressFill').style.width = pct + '%';
  document.getElementById('analyseStepTitle').textContent = `${selectedCase.icon} ${step.title}`;
  document.getElementById('analyseStepPrompt').textContent = step.prompt;
  document.getElementById('analyseBackBtn').style.visibility = stepIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('analyseNextBtn').textContent = step.key === 'synthese' ? 'Terminer →' : 'Suivant →';

  const RENDERERS = {
    contexte: renderContexteStep,
    probleme: renderProblemeStep,
    predire: renderPredireStep,
    chiffres: renderChiffresStep,
    strategie: renderStrategieStep,
    resultats: renderResultatsStep,
    limites: renderLimitesStep,
    synthese: renderSyntheseStep
  };
  RENDERERS[step.key]();
}

function renderContexteStep(){
  const c = selectedCase;
  document.getElementById('analyseStepFields').innerHTML = `
    <div class="card" style="background:var(--bg-alt);">
      <span class="smallcaps">${c.secteur} · ${c.annee}</span>
      <h4 style="margin:8px 0;">${c.icon} ${c.entreprise}</h4>
      <p style="font-size:13.5px;line-height:1.6;">${c.contexte}</p>
    </div>`;
}

function renderProblemeStep(){
  const c = selectedCase;
  document.getElementById('analyseStepFields').innerHTML = `
    <div class="card" style="background:var(--bg-alt);">
      <p style="font-size:13.5px;line-height:1.6;">${c.probleme}</p>
    </div>
    ${c.concurrence ? `<div class="card" style="margin-top:12px;"><span class="smallcaps">Contexte concurrentiel</span><p style="font-size:13px;color:var(--text-dim);margin-top:6px;">${c.concurrence}</p></div>` : ''}`;
}

function renderPredireStep(){
  const el = document.getElementById('analyseStepFields');
  el.innerHTML = `
    <p style="font-size:13.5px;margin-bottom:12px;">Ces dernières années, le chiffre d'affaires de <strong>${selectedCase.entreprise}</strong> a plutôt, à ton avis...</p>
    <div class="mode-toggle" id="analysePredireChoice" style="margin-bottom:14px;flex-wrap:wrap;">
      <button type="button" class="pill" data-guess="forte">📈 Fortement augmenté</button>
      <button type="button" class="pill" data-guess="stable">➡️ Stagné</button>
      <button type="button" class="pill" data-guess="baisse">📉 Diminué</button>
    </div>
    <div id="analysePredireReveal"></div>`;
  document.getElementById('analysePredireChoice').querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('analysePredireChoice').querySelectorAll('.pill').forEach(b => b.classList.toggle('active', b === btn));
      revealPredictionTruth();
    });
  });
}

function revealPredictionTruth(){
  const el = document.getElementById('analysePredireReveal');
  const fields = analyseFields();
  if(!fields || typeof fields.revenueGrowth !== 'number'){
    el.innerHTML = `<p class="disclaimer-box" style="margin-top:10px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} pour cette entreprise en ce moment.</p>`;
    return;
  }
  const growth = bucketGrowth(fields.revenueGrowth);
  el.innerHTML = `<div class="card" style="margin-top:6px;background:var(--bg-alt);">
    <span class="smallcaps">${renderDataBadge('fait')} La réalité</span>
    <p style="font-size:13.5px;margin-top:8px;">Croissance réelle du chiffre d'affaires : <strong>${growth.label}</strong> (${formatFundamentalValue('revenueGrowth', fields.revenueGrowth)}).</p>
  </div>`;
}

function renderChiffresStep(){
  const el = document.getElementById('analyseStepFields');
  if(!fundamentals){
    el.innerHTML = `<p class="disclaimer-box">${FUNDAMENTALS_UNAVAILABLE_TEXT} — les serveurs de données n'ont peut-être pas répondu, réessaie plus tard.</p>`;
    return;
  }
  const fields = analyseFields() || {};
  const KEYS = ['trailingPE', 'marketCap', 'dividendYield', 'profitMargins'];
  const asOf = fundamentals.fundamentals && fundamentals.fundamentals.asOfDate
    ? new Date(fundamentals.fundamentals.asOfDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})
    : null;
  el.innerHTML = `
    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:16px;">
      ${KEYS.map(k => `<div class="card"><span class="smallcaps">${FUNDAMENTALS_FIELD_META[k].label}</span><div class="result-big" style="font-size:18px;margin-top:6px;">${formatFundamentalValue(k, fields[k])}</div></div>`).join('')}
    </div>
    <div class="card">${renderFinancialHistoryCard(fundamentals.financialHistory)}</div>
    <p class="disclaimer-box" style="margin-top:12px;">${renderDataBadge('fait')} Données réelles${asOf ? ` (au ${asOf})` : ''}, cotation différée — un champ manquant s'affiche honnêtement comme indisponible, jamais une valeur inventée.</p>`;
}

function renderStrategieStep(){
  document.getElementById('analyseStepFields').innerHTML = `
    <div class="card" style="background:var(--bg-alt);">
      <p style="font-size:13.5px;line-height:1.6;">${selectedCase.strategie}</p>
    </div>`;
}

function renderResultatsStep(){
  const c = selectedCase;
  const fields = analyseFields();
  const derived = fields ? deriveStrengthsWeaknesses(fields) : null;
  document.getElementById('analyseStepFields').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${c.resultats.map(r => `
        <div class="card">
          <p style="font-size:13.5px;line-height:1.6;">${r.texte}</p>
          <p style="font-size:11px;color:var(--text-dim);margin-top:6px;">Source : <a href="${r.sourceUrl}" target="_blank" rel="noopener" style="color:var(--gold-bright);">${r.source}</a></p>
        </div>`).join('')}
    </div>
    ${derived && (derived.strengths.length || derived.weaknesses.length) ? `
    <div class="card" style="margin-top:14px;">
      <span class="smallcaps">${renderDataBadge('calcul')} Ce que montrent les vrais chiffres aujourd'hui</span>
      <div style="margin-top:8px;">
        ${derived.strengths.map(s => `<p style="font-size:12.5px;color:var(--emerald);margin-top:4px;">✓ ${s}</p>`).join('')}
        ${derived.weaknesses.map(w => `<p style="font-size:12.5px;color:var(--bordeaux);margin-top:4px;">⚠ ${w}</p>`).join('')}
      </div>
    </div>` : ''}`;
}

function renderLimitesStep(){
  document.getElementById('analyseStepFields').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${selectedCase.limites.map(l => `<p style="font-size:13px;color:var(--text-dim);line-height:1.6;">⚠ ${l}</p>`).join('')}
    </div>`;
}

function renderSyntheseStep(){
  const c = selectedCase;
  document.getElementById('analyseStepFields').innerHTML = `
    <div class="card" style="background:var(--bg-alt);margin-bottom:14px;">
      <span class="smallcaps">À retenir</span>
      <p style="font-size:13.5px;line-height:1.6;margin-top:6px;">${c.retenir}</p>
    </div>
    <span class="smallcaps" style="display:block;margin-bottom:8px;">Pour ton propre projet</span>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${c.appliqueQuestions.map(q => `<p style="font-size:13px;color:var(--text-dim);">→ ${q}</p>`).join('')}
    </div>`;
  tryAwardQuizPoints(`analyser-entreprise-${c.id}-${new Date().toDateString()}`, 15, {analyseEntrepriseDone: true, entreprise: c.id});
}

function backToIntro(){
  selectedCase = null;
  fundamentals = null;
  document.getElementById('analyseStep').style.display = 'none';
  document.getElementById('analyseIntro').style.display = 'block';
  renderIntro();
}

document.getElementById('analyseBackBtn').addEventListener('click', () => {
  if(stepIndex === 0) return;
  stepIndex--;
  renderStep();
});
document.getElementById('analyseNextBtn').addEventListener('click', () => {
  if(stepIndex >= ANALYSE_STEPS.length - 1){ backToIntro(); return; }
  stepIndex++;
  renderStep();
});

renderIntro();
