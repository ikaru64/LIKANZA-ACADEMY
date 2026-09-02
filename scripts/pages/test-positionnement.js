/* ============================================================
   LIKANZA ACADEMY — Ton profil Likanza (premier quiz, 100% déclaratif)
   Rôle : donner à Likanza une première idée de qui est l'utilisateur, ce
   qu'il cherche, ce qui l'intéresse et le niveau qu'il PENSE avoir par
   domaine — jamais un niveau vérifié. Aucune question notée ici (la
   vérification réelle se fait via les quiz approfondis, quiz-approfondi.html,
   qui réutilisent le vrai moteur de Défis). Écrit dans fzr-profile
   (levels/interests/learningStyle/risque/goals/primaryGoal/subGoal) et
   fzr-positioning-result (marqueur de complétion + onboardingVersion).

   Chantier "Onboarding intelligent" (31/08/2026, sections 1, 6-7 du prompt
   d'origine) : ajoute jusqu'à 3 étapes CONDITIONNELLES entre l'objectif et
   les centres d'intérêt, jamais imposées quand elles n'ont pas de sens —
   objectif principal (seulement si plusieurs objectifs cochés), question
   adaptative (seulement si l'objectif principal a un vrai jeu de
   sous-questions, POSITIONING_SUBGOALS, app.js), et projet concret +
   horizon large (le budget/la date exacte se complètent plus tard, dans Mon
   Univers Financier — jamais demandés ici). Toutes les étapes restent
   skippables (chaque écran garde un bouton "Continuer" même sans rien
   cocher, et le projet a son propre "Pas de projet pour l'instant").
   ============================================================ */

const ONBOARDING_VERSION = 2;
const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};

// ---------- Compteur d'étape honnête : jamais un total inventé, toujours le
// meilleur total connu à cet instant (peut s'affiner d'une étape à l'autre
// à mesure que les branches se résolvent — jamais une fausse précision). ----------
let currentStepNumber = 1;
let checkedGoals = {};
let primaryGoal = null;
let primaryGoalLabel = null;
let subGoalKey = null;
let subGoalLabel = null;
let selectedProjectCategory = null;
let createdProject = null;

function computeTotalSteps(){
  let total = 5; // objectif, projet, centres d'intérêt, niveaux, manière d'apprendre — toujours présentes
  const goalKeys = Object.keys(checkedGoals);
  if(goalKeys.length > 1) total += 1; // étape "objectif principal"
  const resolvedPrimary = goalKeys.length === 1 ? goalKeys[0] : primaryGoal;
  if(resolvedPrimary && POSITIONING_SUBGOALS[resolvedPrimary]) total += 1; // étape adaptative
  if(selectedProjectCategory) total += 1; // étape "horizon" (seulement si un projet a été choisi)
  return total;
}
function setStepBadge(elId, suffix){
  document.getElementById(elId).textContent = `${currentStepNumber} / ${computeTotalSteps()} · ${suffix}`;
}

document.getElementById('posStartBtn').addEventListener('click', () => {
  document.getElementById('posIntro').style.display = 'none';
  currentStepNumber = 1;
  startGoals();
});

// ---------- Étape : objectif ----------
function startGoals(){
  document.getElementById('posGoals').style.display = 'block';
  setStepBadge('posGoalsBadge', 'ton objectif');
  document.getElementById('posGoalsList').innerHTML = POSITIONING_GOALS.map((g, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="checkbox" class="pos-goal-cb" data-key="${g.key}" data-idx="${i}" style="width:16px;height:16px;flex-shrink:0;">
      <span>${g.label}</span>
    </label>`).join('');
}
let goalKeyToLabel = {};

document.getElementById('posGoalsNext').addEventListener('click', () => {
  const goals = {};
  const goalLabels = [];
  const keyToLabel = {};
  document.querySelectorAll('.pos-goal-cb').forEach(cb => {
    if(cb.checked){
      goals[cb.dataset.key] = true;
      const label = POSITIONING_GOALS[+cb.dataset.idx].label;
      goalLabels.push(label);
      // Un objectif peut être coché via plusieurs libellés partageant la
      // même clé (voir POSITIONING_GOALS) — garde le premier libellé réel
      // rencontré pour cette clé, jamais un libellé fabriqué.
      if(!keyToLabel[cb.dataset.key]) keyToLabel[cb.dataset.key] = label;
    }
  });
  checkedGoals = goals;
  goalKeyToLabel = keyToLabel;
  window.__posGoalLabels = goalLabels;
  document.getElementById('posGoals').style.display = 'none';

  const goalKeys = Object.keys(goals);
  currentStepNumber++;
  if(goalKeys.length > 1){
    startPrimaryGoal(goalKeys);
  } else {
    // Un seul objectif (ou aucun) : pas de choix réel à faire, l'objectif
    // principal est déjà connu sans qu'on ait besoin de le demander.
    primaryGoal = goalKeys[0] || null;
    primaryGoalLabel = primaryGoal ? keyToLabel[primaryGoal] : null;
    proceedAfterPrimaryGoal();
  }
});

// ---------- Étape conditionnelle : objectif principal (si plusieurs cochés) ----------
function startPrimaryGoal(goalKeys){
  document.getElementById('posPrimaryGoal').style.display = 'block';
  setStepBadge('posPrimaryGoalBadge', 'objectif principal');
  document.getElementById('posPrimaryGoalList').innerHTML = goalKeys.map((key, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="radio" name="posPrimaryGoalRadio" class="pos-primarygoal-radio" data-key="${key}" value="${key}" ${i === 0 ? 'checked' : ''} style="width:15px;height:15px;flex-shrink:0;">
      <span>${goalKeyToLabel[key] || key}</span>
    </label>`).join('');
}
document.getElementById('posPrimaryGoalNext').addEventListener('click', () => {
  const checked = document.querySelector('.pos-primarygoal-radio:checked');
  primaryGoal = checked ? checked.dataset.key : null;
  primaryGoalLabel = primaryGoal ? goalKeyToLabel[primaryGoal] : null;
  document.getElementById('posPrimaryGoal').style.display = 'none';
  currentStepNumber++;
  proceedAfterPrimaryGoal();
});

// Une fois l'objectif principal résolu (avec ou sans étape dédiée), décide
// s'il existe une vraie question adaptative pour ce domaine.
function proceedAfterPrimaryGoal(){
  const subgoalDef = primaryGoal ? POSITIONING_SUBGOALS[primaryGoal] : null;
  if(subgoalDef){
    startSubGoal(subgoalDef);
  } else {
    startProject();
  }
}

// ---------- Étape conditionnelle : question adaptative selon l'objectif principal ----------
function startSubGoal(subgoalDef){
  document.getElementById('posSubGoal').style.display = 'block';
  setStepBadge('posSubGoalBadge', 'préciser ton objectif');
  document.getElementById('posSubGoalTitle').textContent = subgoalDef.title;
  document.getElementById('posSubGoalList').innerHTML = subgoalDef.options.map((o, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="radio" name="posSubGoalRadio" class="pos-subgoal-radio" data-key="${o.key}" data-idx="${i}" value="${o.key}" style="width:15px;height:15px;flex-shrink:0;">
      <span>${o.label}</span>
    </label>`).join('');
}
document.getElementById('posSubGoalNext').addEventListener('click', () => {
  const checked = document.querySelector('.pos-subgoal-radio:checked');
  const subgoalDef = primaryGoal ? POSITIONING_SUBGOALS[primaryGoal] : null;
  subGoalKey = checked ? checked.dataset.key : null;
  subGoalLabel = (checked && subgoalDef) ? subgoalDef.options[+checked.dataset.idx].label : null;
  document.getElementById('posSubGoal').style.display = 'none';
  currentStepNumber++;
  startProject();
});

// ---------- Étape : projet concret (chantier Onboarding intelligent,
// 31/08/2026, sections 6-7 du prompt d'origine) : comprendre l'INTENTION
// seulement — jamais un montant demandé ici (voir LIFE_PROJECT_HORIZONS,
// data.js, pour la raison). Toujours skippable ("Pas de projet pour
// l'instant"), toujours restreinte aux 7 vraies catégories de
// LIFE_PROJECT_CATEGORIES — jamais une catégorie fabriquée (ex. "voiture",
// suggérée par le prompt d'origine, n'a pas de vraie catégorie dédiée dans
// le modèle de données réel et tombe donc honnêtement sous "Autre"). ----------
function startProject(){
  document.getElementById('posProject').style.display = 'block';
  setStepBadge('posProjectBadge', 'ton projet');
  const options = LIFE_PROJECT_CATEGORIES.map(cat => ({cat, meta: LIFE_PROJECT_CATEGORY_META[cat]}));
  document.getElementById('posProjectList').innerHTML = options.map(({cat, meta}) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="radio" name="posProjectRadio" class="pos-project-radio" data-cat="${cat}" value="${cat}" style="width:15px;height:15px;flex-shrink:0;">
      <span>${meta.emoji} ${meta.label}</span>
    </label>`).join('') + `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;border-top:1px solid var(--hairline);padding-top:10px;margin-top:4px;">
      <input type="radio" name="posProjectRadio" class="pos-project-radio" data-cat="" value="" checked style="width:15px;height:15px;flex-shrink:0;">
      <span style="color:var(--text-dim);">Pas de projet pour l'instant</span>
    </label>`;
}
document.getElementById('posProjectNext').addEventListener('click', () => {
  const checked = document.querySelector('.pos-project-radio:checked');
  selectedProjectCategory = (checked && checked.dataset.cat) ? checked.dataset.cat : null;
  document.getElementById('posProject').style.display = 'none';
  currentStepNumber++;
  if(selectedProjectCategory){
    startProjectHorizon();
  } else {
    startInterests();
  }
});

// ---------- Étape conditionnelle : horizon (seulement si un projet a été choisi) ----------
function startProjectHorizon(){
  document.getElementById('posProjectHorizon').style.display = 'block';
  setStepBadge('posProjectHorizonBadge', 'horizon du projet');
  document.getElementById('posProjectHorizonList').innerHTML = LIFE_PROJECT_HORIZONS.map((h, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="radio" name="posProjectHorizonRadio" class="pos-projecthorizon-radio" data-value="${h.value}" value="${h.value}" style="width:15px;height:15px;flex-shrink:0;">
      <span>${h.label}</span>
    </label>`).join('');
}
document.getElementById('posProjectHorizonNext').addEventListener('click', () => {
  const checked = document.querySelector('.pos-projecthorizon-radio:checked');
  const horizonApprox = checked ? checked.dataset.value : null;
  const meta = LIFE_PROJECT_CATEGORY_META[selectedProjectCategory];
  // Nom générique honnête (jamais demandé à l'utilisateur ici) — modifiable
  // ensuite dans Mon Univers, comme le budget et la date exacte.
  createdProject = saveLifeProject({nom: `Mon projet ${meta.label}`, categorie: selectedProjectCategory, budgetTotal: 0, dateCible: null, horizonApprox});
  document.getElementById('posProjectHorizon').style.display = 'none';
  currentStepNumber++;
  startInterests();
});

// ---------- Étape : centres d'intérêt ----------
function startInterests(){
  document.getElementById('posInterests').style.display = 'block';
  setStepBadge('posInterestsBadge', "centres d'intérêt");
  document.getElementById('posInterestsList').innerHTML = POSITIONING_INTERESTS.map((it, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="checkbox" class="pos-interest-cb" data-key="${it.key}" data-idx="${i}" style="width:16px;height:16px;flex-shrink:0;">
      <span>${it.label}</span>
    </label>`).join('');
}
document.getElementById('posInterestsNext').addEventListener('click', () => {
  document.getElementById('posInterests').style.display = 'none';
  currentStepNumber++;
  startLevels();
});

// ---------- Étape : niveau déclaré par domaine ----------
function startLevels(){
  document.getElementById('posLevels').style.display = 'block';
  setStepBadge('posLevelsBadge', 'niveau déclaré');
  document.getElementById('posLevelsList').innerHTML = DOMAINS.map(d => `
    <div>
      <span class="smallcaps">${d.icon} ${d.label}</span>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
        ${POSITIONING_LEVEL_CHOICES.map(c => `
        <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;">
          <input type="radio" name="posLevel-${d.key}" class="pos-level-radio" data-domain="${d.key}" value="${c.value}" style="width:15px;height:15px;flex-shrink:0;">
          <span>${c.label}</span>
        </label>`).join('')}
      </div>
    </div>`).join('');
}
document.getElementById('posLevelsNext').addEventListener('click', () => {
  document.getElementById('posLevels').style.display = 'none';
  currentStepNumber++;
  startStyle();
});

// ---------- Étape : manière d'apprendre + confort au risque ----------
function startStyle(){
  document.getElementById('posStyle').style.display = 'block';
  setStepBadge('posStyleBadge', "manière d'apprendre");
  document.getElementById('posStylesList').innerHTML = POSITIONING_LEARNING_STYLES.map((s, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="checkbox" class="pos-style-cb" data-key="${s.key}" data-idx="${i}" style="width:16px;height:16px;flex-shrink:0;">
      <span>${s.label}</span>
    </label>`).join('');
  document.getElementById('posRiskList').innerHTML = POSITIONING_RISK_COMFORT.map((r, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="radio" name="posRisk" class="pos-risk-radio" value="${r.value}" ${r.value === 'equilibre' ? 'checked' : ''} style="width:16px;height:16px;flex-shrink:0;">
      <span>${r.label}</span>
    </label>`).join('');
}
document.getElementById('posStyleSubmit').addEventListener('click', () => {
  // `goals` est indexé par clé de domaine (plusieurs libellés de
  // POSITIONING_GOALS peuvent partager la même clé, ex. deux libellés
  // "stockMarket") : utile pour la personnalisation par domaine. On garde
  // en parallèle les libellés exacts cochés (goalLabels) pour les réafficher
  // fidèlement dans le bilan, sans perdre d'information en reconstruisant.
  const goals = checkedGoals;
  const goalLabels = window.__posGoalLabels || [];
  const interests = {};
  document.querySelectorAll('.pos-interest-cb').forEach(cb => { if(cb.checked) interests[cb.dataset.key] = true; });
  const levels = {};
  document.querySelectorAll('.pos-level-radio:checked').forEach(r => { levels[r.dataset.domain] = r.value; });
  const learningStyle = {};
  document.querySelectorAll('.pos-style-cb').forEach(cb => { if(cb.checked) learningStyle[cb.dataset.key] = true; });
  const riskEl = document.querySelector('.pos-risk-radio:checked');
  const risque = riskEl ? riskEl.value : 'equilibre';
  document.getElementById('posStyle').style.display = 'none';
  renderResults(goals, goalLabels, interests, levels, learningStyle, risque);
});

// ---------- Bilan : jamais un niveau "vérifié", toujours présenté comme une hypothèse ----------
function renderResults(goals, goalLabels, interests, levels, learningStyle, risque){
  const resEl = document.getElementById('posResults');
  resEl.style.display = 'block';

  // fzr-positioning-result n'est plus qu'un marqueur de complétion : plus
  // aucune question notée ici, donc plus de score/niveau calculé à stocker.
  // onboardingVersion (chantier Onboarding intelligent, 31/08/2026, section
  // 68 du prompt d'origine) : permet de distinguer plus tard un profil créé
  // avant/après l'ajout de nouvelles questions, sans jamais forcer un ancien
  // utilisateur à tout refaire.
  safeSetJSON('fzr-positioning-result', {date: new Date().toISOString(), onboardingVersion: ONBOARDING_VERSION, goals, interests, learningStyle, risque, primaryGoal, subGoal: subGoalKey});

  // Même profil que Mon compte (fzr-profile) : age/epargne/horizon/objectif
  // existants sont préservés, seuls levels/interests/learningStyle/risque/
  // goals/primaryGoal/subGoal sont mis à jour ici.
  saveProfile({...getProfile(), levels, interests, learningStyle, risque, goals, primaryGoal, subGoal: subGoalKey});

  const declaredRows = DOMAINS.map(d => {
    const lvl = levels[d.key];
    const choice = POSITIONING_LEVEL_CHOICES.find(c => c.value === lvl);
    return `<div class="panel-row"><span>${d.icon} ${d.label}</span><span class="val mono">${choice ? choice.label : '—'}</span></div>`;
  }).join('');

  // Parcours recommandés (audit Formations Phase 4 du 27/08/2026) : jusqu'ici,
  // l'objectif coché ici ne débouchait sur aucune suite concrète. Chaque clé
  // de `goals` correspond directement à un id de LEARNING_PATHS (objectif) —
  // "general" n'a pas de domaine réel, donc jamais de parcours inventé pour
  // lui, seulement le lien "Explorer le site" déjà présent plus bas.
  const matchedPaths = Object.keys(goals).map(key => LEARNING_PATHS.find(p => p.id === key && p.type === 'objectif')).filter(Boolean);
  const pathsHtml = matchedPaths.length ? `
    <div style="margin-top:16px;">
      <span class="smallcaps">Le parcours qu'on te recommande</span>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        ${matchedPaths.map(p => `<a href="formations.html?parcours=${encodeURIComponent(p.id)}" class="card play-tile" style="text-decoration:none;"><span class="icon">${p.icon}</span><h4 style="margin:8px 0 4px;">${p.titre}</h4><p style="font-size:12.5px;color:var(--text-dim);">${p.description}</p></a>`).join('')}
      </div>
    </div>` : '';

  const primaryGoalDomain = primaryGoal ? DOMAINS.find(d => d.key === primaryGoal) : null;
  const primaryGoalHtml = primaryGoalLabel ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;"><strong style="color:var(--text);">Ton objectif principal :</strong> ${primaryGoalDomain ? primaryGoalDomain.icon + ' ' : ''}${primaryGoalLabel}${subGoalLabel ? ` — ${subGoalLabel}` : ''}</p>` : '';

  const projectHtml = createdProject ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;"><strong style="color:var(--text);">Ton projet :</strong> ${LIFE_PROJECT_CATEGORY_META[createdProject.categorie].emoji} ${LIFE_PROJECT_CATEGORY_META[createdProject.categorie].label}${createdProject.horizonApprox ? ` — ${LIFE_PROJECT_HORIZONS.find(h => h.value === createdProject.horizonApprox).label}` : ''}</p>` : '';

  resEl.innerHTML = `
    <div class="card" style="max-width:640px;margin:0 auto;">
      <span class="smallcaps">C'est noté</span>
      <h2 class="display" style="font-size:24px;font-weight:600;margin:8px 0;">Ton profil est enregistré</h2>
      <p style="color:var(--text-dim);font-size:13.5px;margin-bottom:16px;">Ces niveaux sont <strong style="color:var(--text);">déclarés par toi</strong> — une hypothèse de départ, pas encore vérifiée. Fais un quiz approfondi dans Mon Parcours (environ 8 minutes) quand tu veux vraiment savoir où tu en es dans un domaine.</p>
      <div class="panel">${declaredRows}</div>
      ${goalLabels.length ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:14px;"><strong style="color:var(--text);">Tu cherches à :</strong> ${goalLabels.join(' · ')}</p>` : ''}
      ${primaryGoalHtml}
      ${projectHtml}
      ${pathsHtml}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">
        <a href="parcours.html" class="btn btn-gold">Voir Mon Parcours</a>
        <a href="index.html" class="btn btn-sm">Explorer le site</a>
      </div>
    </div>`;

  tryAwardQuizPoints('positioning-test-completed', 15, {positioningTestDone: true});
}
