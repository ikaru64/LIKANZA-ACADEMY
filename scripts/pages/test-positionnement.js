/* ============================================================
   LIKANZA ACADEMY — Ton profil Likanza (premier quiz, 100% déclaratif)
   Rôle : donner à Likanza une première idée de qui est l'utilisateur, ce
   qu'il cherche, ce qui l'intéresse et le niveau qu'il PENSE avoir par
   domaine — jamais un niveau vérifié. Aucune question notée ici (la
   vérification réelle se fait via les quiz approfondis, quiz-approfondi.html,
   qui réutilisent le vrai moteur de Défis). 4 étapes courtes, toutes
   skippables en pratique (chaque écran a un bouton "Continuer" même sans
   rien cocher). Écrit dans fzr-profile (levels/interests/learningStyle/
   risque/goals) et fzr-positioning-result (simple marqueur de complétion,
   plus aucun score noté).
   ============================================================ */

const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};

document.getElementById('posStartBtn').addEventListener('click', () => {
  document.getElementById('posIntro').style.display = 'none';
  startGoals();
});

// ---------- 1/4 : objectif ----------
function startGoals(){
  document.getElementById('posGoals').style.display = 'block';
  document.getElementById('posGoalsList').innerHTML = POSITIONING_GOALS.map((g, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="checkbox" class="pos-goal-cb" data-key="${g.key}" data-idx="${i}" style="width:16px;height:16px;flex-shrink:0;">
      <span>${g.label}</span>
    </label>`).join('');
}
document.getElementById('posGoalsNext').addEventListener('click', () => {
  document.getElementById('posGoals').style.display = 'none';
  startInterests();
});

// ---------- 2/4 : centres d'intérêt ----------
function startInterests(){
  document.getElementById('posInterests').style.display = 'block';
  document.getElementById('posInterestsList').innerHTML = POSITIONING_INTERESTS.map((it, i) => `
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="checkbox" class="pos-interest-cb" data-key="${it.key}" data-idx="${i}" style="width:16px;height:16px;flex-shrink:0;">
      <span>${it.label}</span>
    </label>`).join('');
}
document.getElementById('posInterestsNext').addEventListener('click', () => {
  document.getElementById('posInterests').style.display = 'none';
  startLevels();
});

// ---------- 3/4 : niveau déclaré par domaine ----------
function startLevels(){
  document.getElementById('posLevels').style.display = 'block';
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
  startStyle();
});

// ---------- 4/4 : manière d'apprendre + confort au risque ----------
function startStyle(){
  document.getElementById('posStyle').style.display = 'block';
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
  const goals = {};
  const goalLabels = [];
  document.querySelectorAll('.pos-goal-cb').forEach(cb => {
    if(cb.checked){ goals[cb.dataset.key] = true; goalLabels.push(POSITIONING_GOALS[+cb.dataset.idx].label); }
  });
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
  safeSetJSON('fzr-positioning-result', {date: new Date().toISOString(), goals, interests, learningStyle, risque});

  // Même profil que Mon compte (fzr-profile) : age/epargne/horizon/objectif
  // existants sont préservés, seuls levels/interests/learningStyle/risque/goals
  // sont mis à jour ici.
  saveProfile({...getProfile(), levels, interests, learningStyle, risque, goals});

  const declaredRows = DOMAINS.map(d => {
    const lvl = levels[d.key];
    const choice = POSITIONING_LEVEL_CHOICES.find(c => c.value === lvl);
    return `<div class="panel-row"><span>${d.icon} ${d.label}</span><span class="val mono">${choice ? choice.label : '—'}</span></div>`;
  }).join('');

  resEl.innerHTML = `
    <div class="card" style="max-width:640px;margin:0 auto;">
      <span class="smallcaps">C'est noté</span>
      <h2 class="display" style="font-size:24px;font-weight:600;margin:8px 0;">Ton profil est enregistré</h2>
      <p style="color:var(--text-dim);font-size:13.5px;margin-bottom:16px;">Ces niveaux sont <strong style="color:var(--text);">déclarés par toi</strong> — une hypothèse de départ, pas encore vérifiée. Fais un quiz approfondi dans Mon Parcours (environ 8 minutes) quand tu veux vraiment savoir où tu en es dans un domaine.</p>
      <div class="panel">${declaredRows}</div>
      ${goalLabels.length ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:14px;"><strong style="color:var(--text);">Tu cherches à :</strong> ${goalLabels.join(' · ')}</p>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">
        <a href="parcours.html" class="btn btn-gold">Voir Mon Parcours</a>
        <a href="index.html" class="btn btn-sm">Explorer le site</a>
      </div>
    </div>`;

  awardXP(15, {positioningTestDone: true});
}
