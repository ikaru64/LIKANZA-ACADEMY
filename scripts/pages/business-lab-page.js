/* ============================================================
   LIKANZA ACADEMY — Business Lab (business-lab.html)
   ============================================================ */

renderCompanyProfile('companyProfile');
renderBusinessLab('businessLab');
renderBusinessProblemFinder('businessProblems');

// ============================================================
// ---------- Intake progressif "assistant de décision" (polish du
// 12/09/2026, mirroir de l'intake du Laboratoire personnel — voir
// laboratoire.js renderLabIntake). 4 étapes courtes (revenus/coûts/équipe/
// trésorerie), chacune sauvegardée directement via saveBusinessProfile (le
// MÊME store que "Mon profil entreprise", jamais un store parallèle) — le
// détail complet (mode de revenu, produits...) reste dans "Mon profil
// entreprise" ci-dessous, jamais dupliqué ici. N'apparaît que tant
// qu'aucune donnée réelle n'a été saisie (hasAnyRealBusinessData).
// ============================================================
function hasAnyRealBusinessData(){
  return computeBusinessProfileSnapshot(getBusinessProfile()).ca > 0;
}

let bizIntakeStep = 0;
function renderBizIntakeStepper(){
  return `<div class="lab-intake-progress">${[0,1,2,3].map(i => `<span class="${i < bizIntakeStep ? 'done' : (i === bizIntakeStep ? 'active' : '')}"></span>`).join('')}</div>`;
}
function bizIntakeNavHtml(isLast){
  return `<div class="lab-intake-nav">
    <button type="button" class="lab-intake-skip" id="intakeSkip">Passer cette étape</button>
    <button type="button" class="btn btn-gold" id="intakeNext">${isLast ? 'Voir mon analyse →' : 'Suivant →'}</button>
  </div>`;
}
function bizIntakeFinishStep(){
  bizIntakeStep = 0;
  renderCompanyProfile('companyProfile');
  initBizEntryFlow();
}
function renderBizIntake(){
  const el = document.getElementById('bizIntakeGate');
  if(!el) return;
  if(bizIntakeStep === 0){
    el.innerHTML = `<div class="lab-intake-card">${renderBizIntakeStepper()}
      <span class="lab-intake-eyebrow">Étape 1 / 4</span>
      <h3>Ton activité</h3>
      <p class="lab-intake-sub">Un montant approximatif suffit pour démarrer — le mode de calcul détaillé (prix × volume, abonnement...) reste modifiable dans "Mon profil entreprise" ci-dessous.</p>
      <div class="lab-intake-fields">
        <div class="field"><label for="bizIntakeNom">Nom de l'entreprise (optionnel)</label><input type="text" id="bizIntakeNom" placeholder="Ma Startup"></div>
        <div class="field"><label for="bizIntakeCA">Chiffre d'affaires annuel approximatif (€)</label><input type="number" id="bizIntakeCA" min="0" placeholder="Ex : 80000"></div>
      </div>
      ${bizIntakeNavHtml(false)}</div>`;
    document.getElementById('intakeNext').addEventListener('click', () => {
      const nom = document.getElementById('bizIntakeNom').value;
      const ca = +document.getElementById('bizIntakeCA').value || 0;
      saveBusinessProfile({nom, ca, revenueMode: 'manuel'});
      bizIntakeStep = 1; renderBizIntake();
    });
    document.getElementById('intakeSkip').addEventListener('click', () => { bizIntakeStep = 1; renderBizIntake(); });
    return;
  }
  if(bizIntakeStep === 1){
    el.innerHTML = `<div class="lab-intake-card">${renderBizIntakeStepper()}
      <span class="lab-intake-eyebrow">Étape 2 / 4</span>
      <h3>Tes coûts</h3>
      <p class="lab-intake-sub">Charges fixes mensuelles (loyer, logiciels, abonnements pro...) et coûts variables en % du chiffre d'affaires.</p>
      <div class="lab-intake-fields">
        <div class="field"><label for="bizIntakeFixes">Coûts fixes mensuels (€)</label><input type="number" id="bizIntakeFixes" min="0" placeholder="Ex : 2000"></div>
        <div class="field"><label for="bizIntakeVariables">Coûts variables (% du CA)</label><input type="number" id="bizIntakeVariables" min="0" max="100" placeholder="Ex : 30"></div>
      </div>
      ${bizIntakeNavHtml(false)}</div>`;
    document.getElementById('intakeNext').addEventListener('click', () => {
      const fixes = +document.getElementById('bizIntakeFixes').value || 0;
      const variables = +document.getElementById('bizIntakeVariables').value || 0;
      saveBusinessProfile({coutsFixesMensuels: fixes, coutsVariablesPct: variables});
      bizIntakeStep = 2; renderBizIntake();
    });
    document.getElementById('intakeSkip').addEventListener('click', () => { bizIntakeStep = 2; renderBizIntake(); });
    return;
  }
  if(bizIntakeStep === 2){
    el.innerHTML = `<div class="lab-intake-card">${renderBizIntakeStepper()}
      <span class="lab-intake-eyebrow">Étape 3 / 4</span>
      <h3>Ton équipe</h3>
      <p class="lab-intake-sub">Laisse à 0 ce qui ne s'applique pas encore à ton activité.</p>
      <div class="lab-intake-fields">
        <div class="field"><label for="bizIntakeEffectif">Effectif (toi compris)</label><input type="number" id="bizIntakeEffectif" min="0" placeholder="Ex : 1"></div>
        <div class="field"><label for="bizIntakeMasse">Masse salariale mensuelle (€)</label><input type="number" id="bizIntakeMasse" min="0" placeholder="0"></div>
        <div class="field"><label for="bizIntakeMarketing">Budget marketing mensuel (€)</label><input type="number" id="bizIntakeMarketing" min="0" placeholder="0"></div>
      </div>
      ${bizIntakeNavHtml(false)}</div>`;
    document.getElementById('intakeNext').addEventListener('click', () => {
      const effectif = +document.getElementById('bizIntakeEffectif').value || 0;
      const masse = +document.getElementById('bizIntakeMasse').value || 0;
      const marketing = +document.getElementById('bizIntakeMarketing').value || 0;
      saveBusinessProfile({effectif, masseSalarialeMensuelle: masse, budgetMarketingMensuel: marketing});
      bizIntakeStep = 3; renderBizIntake();
    });
    document.getElementById('intakeSkip').addEventListener('click', () => { bizIntakeStep = 3; renderBizIntake(); });
    return;
  }
  // Étape 4 : Trésorerie
  el.innerHTML = `<div class="lab-intake-card">${renderBizIntakeStepper()}
    <span class="lab-intake-eyebrow">Étape 4 / 4</span>
    <h3>Ta trésorerie</h3>
    <p class="lab-intake-sub">Sert à calculer ton Runway (combien de mois de trésorerie il te reste) — laisse à 0 si tu ne sais pas encore.</p>
    <div class="lab-intake-fields">
      <div class="field"><label for="bizIntakeTresorerie">Trésorerie actuelle (€)</label><input type="number" id="bizIntakeTresorerie" min="0" placeholder="Ex : 5000"></div>
      <div class="field"><label for="bizIntakeDette">Dette totale (€, optionnel)</label><input type="number" id="bizIntakeDette" min="0" placeholder="0"></div>
    </div>
    ${bizIntakeNavHtml(true)}</div>`;
  document.getElementById('intakeNext').addEventListener('click', () => {
    const tresorerie = +document.getElementById('bizIntakeTresorerie').value || 0;
    const dette = +document.getElementById('bizIntakeDette').value || 0;
    saveBusinessProfile({tresorerieActuelle: tresorerie, detteTotale: dette});
    bizIntakeFinishStep();
  });
  document.getElementById('intakeSkip').addEventListener('click', bizIntakeFinishStep);
}

function initBizEntryFlow(){
  const gateEl = document.getElementById('bizIntakeGate');
  const homeEl = document.getElementById('businessHome');
  if(!gateEl || !homeEl) return;
  if(hasAnyRealBusinessData()){
    gateEl.style.display = 'none';
    homeEl.style.display = '';
  } else {
    gateEl.style.display = '';
    homeEl.style.display = 'none';
    renderBizIntake();
  }
}
initBizEntryFlow();

// ============================================================
// ---------- "Mes simulations" côté Business (polish du 12/09/2026) —
// réutilise EXACTEMENT le même store partagé que le Laboratoire personnel
// (getLabSimulations/saveLabSimulation/renameLabSimulation/
// duplicateLabSimulation/removeLabSimulation, data.js) : un scénario
// sauvegardé depuis "Scénarios & stress-test" ci-dessous (voir
// renderBusinessScenarios) apparaît ici, ET dans "Mes simulations" du
// Laboratoire personnel — même liste, deux pages. Le comparateur réutilise
// le même composant générique (renderLabScenarioCompareTable) que côté
// Personnel, jamais un second tableau ad hoc. L'état de sélection
// (bizCompareSelection) reste propre à cette page — la liste sauvegardée
// elle-même est bien partagée. ----------
// ============================================================
let bizCompareSelection = [];
function renderBizSimCompareResult(){
  const el = document.getElementById('bizSimCompareResult');
  if(!el) return;
  if(bizCompareSelection.length < 2){ el.innerHTML = ''; return; }
  const sims = getLabSimulations().filter(s => bizCompareSelection.includes(s.id));
  if(sims.length < 2){ el.innerHTML = ''; return; }
  const columns = sims.map((s, i) => ({key: 'c' + i, label: s.label}));
  const rows = [{label: 'Résultat', values: Object.fromEntries(sims.map((s, i) => ['c' + i, s.resultLabel]))}];
  el.innerHTML = `<span class="smallcaps">Comparaison de tes scénarios sauvegardés</span>${renderLabScenarioCompareTable(columns, rows)}`;
}
function renderBizSimulationsList(){
  const el = document.getElementById('bizSimulationsList');
  if(!el) return;
  const sims = getLabSimulations();
  if(sims.length === 0){
    el.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Aucune simulation sauvegardée pour l'instant — teste un scénario dans "Scénarios &amp; stress-test" ci-dessus, puis clique "💾 Sauvegarder".</p>`;
    return;
  }
  bizCompareSelection = bizCompareSelection.filter(id => sims.some(s => s.id === id));
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${sims.map(s => `
        <div class="card" style="padding:14px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
            <div style="flex:1;min-width:180px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--text-dim);cursor:pointer;"><input type="checkbox" class="biz-sim-compare-check" data-id="${s.id}" ${bizCompareSelection.includes(s.id) ? 'checked' : ''}> Comparer</label>
              <h4 style="font-size:14px;margin:4px 0 2px;" id="bizsimlabel-${s.id}">${s.label}</h4>
              <p style="font-size:11.5px;color:var(--text-dim);">${new Date(s.dateAjout).toLocaleDateString('fr-FR', {day:'numeric', month:'long'})} · ${s.resultLabel}</p>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button type="button" class="btn btn-sm biz-sim-rename" data-id="${s.id}">Renommer</button>
              <button type="button" class="btn btn-sm biz-sim-duplicate" data-id="${s.id}">Dupliquer</button>
              <button type="button" class="btn btn-sm biz-sim-delete" data-id="${s.id}">Supprimer</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <div id="bizSimCompareResult" style="margin-top:14px;"></div>`;

  el.querySelectorAll('.biz-sim-compare-check').forEach(cb => cb.addEventListener('change', () => {
    if(cb.checked) bizCompareSelection.push(cb.dataset.id);
    else bizCompareSelection = bizCompareSelection.filter(id => id !== cb.dataset.id);
    renderBizSimCompareResult();
  }));
  el.querySelectorAll('.biz-sim-rename').forEach(btn => btn.addEventListener('click', () => {
    const sim = sims.find(s => s.id === btn.dataset.id);
    const labelEl = document.getElementById(`bizsimlabel-${sim.id}`);
    labelEl.innerHTML = `<input type="text" value="${sim.label}" style="font-size:13px;padding:4px 6px;width:100%;" id="bizsimrename-${sim.id}">`;
    const input = document.getElementById(`bizsimrename-${sim.id}`);
    input.focus();
    const commit = () => { renameLabSimulation(sim.id, input.value); renderBizSimulationsList(); };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => { if(e.key === 'Enter') input.blur(); });
  }));
  el.querySelectorAll('.biz-sim-duplicate').forEach(btn => btn.addEventListener('click', () => { duplicateLabSimulation(btn.dataset.id); renderBizSimulationsList(); }));
  el.querySelectorAll('.biz-sim-delete').forEach(btn => btn.addEventListener('click', () => {
    removeLabSimulation(btn.dataset.id);
    bizCompareSelection = bizCompareSelection.filter(id => id !== btn.dataset.id);
    renderBizSimulationsList();
  }));
  renderBizSimCompareResult();
}
renderBizSimulationsList();
