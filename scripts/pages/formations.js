const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
let level = getLevel();
if(!COURSES[level]) level = 'debutant';
if(!isLevelUnlocked(level)) level = firstUnlockedLevel();

function refreshLevelUI(){
  document.querySelectorAll('.level-pills .pill').forEach(p=>{
    const lvl = p.dataset.lvl;
    const unlocked = isLevelUnlocked(lvl);
    p.classList.toggle('active', lvl===level);
    p.disabled = !unlocked;
    p.title = unlocked ? '' : 'Débloqué une fois le niveau précédent terminé à 100%';
    p.textContent = LEVEL_LABELS[lvl] + (unlocked ? '' : ' (verrouillé)');
  });
  document.getElementById('levelLabel').textContent = LEVEL_LABELS[level];
  renderModules();
}
document.querySelectorAll('.level-pills .pill').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const lvl = btn.dataset.lvl;
    if(!isLevelUnlocked(lvl)) return;
    level = lvl;
    setLevelStorage(level);
    refreshLevelUI();
  });
});

function getProgress(){ return safeGetJSON('fzr-progress', {}); }

// Appelé uniquement quand la question de fin de mission a été résolue
// correctement — c'est la seule façon de valider une mission désormais.
function completeMission(key){
  const progress = getProgress();
  if(progress[key]) return;
  progress[key] = true;
  safeSetJSON('fzr-progress', progress);
  const mods = COURSES[level];
  const doneCount = mods.filter((c,i)=>progress[level+'-'+i]).length;
  const levelJustCompleted = doneCount === mods.length;
  awardXP(30, {moduleCompleted:true, levelJustCompleted});
  if(document.getElementById('gamiWidget')) renderGamificationWidget('gamiWidget', true);
  refreshLevelUI();
}

function renderModules(){
  const progress = getProgress();
  const mods = COURSES[level];
  const doneCount = mods.filter((c,i)=>progress[level+'-'+i]).length;
  document.getElementById('progressLabel').textContent = `${doneCount} / ${mods.length} missions accomplies`;

  document.getElementById('courseList').innerHTML = mods.map((c,i)=>{
    const key = level+'-'+i;
    const done = !!progress[key];
    const q = c.question;
    const storyHtml = c.story.map(ch=>`<div class="mission-chapter"><h5>${ch.heading}</h5><p>${ch.text}</p></div>`).join('');

    let questionHtml;
    if(done){
      questionHtml = `
        <div class="mission-question">
          <p class="mission-q-prompt">${q.prompt}</p>
          <p class="mission-solved">${ICONS.check} Mission validée : ${q.explication}</p>
        </div>`;
    } else if(q.type === 'calcul'){
      questionHtml = `
        <div class="mission-question">
          <p class="mission-q-prompt">${q.prompt}</p>
          <div class="field" style="max-width:260px;">
            <input type="number" step="any" id="mq-input-${key}" placeholder="Ta réponse${q.unit ? ' ('+q.unit+')' : ''}">
          </div>
          <button class="btn btn-sm btn-gold" data-check="${key}">Vérifier</button>
          <p class="mission-feedback" id="mq-feedback-${key}"></p>
        </div>`;
    } else {
      questionHtml = `
        <div class="mission-question">
          <p class="mission-q-prompt">${q.prompt}</p>
          <div class="mission-choices" id="mq-choices-${key}">
            ${q.choix.map((opt,oi)=>`<button class="pill" style="text-align:left;display:block;width:100%;margin-bottom:6px;" data-choice="${oi}">${opt}</button>`).join('')}
          </div>
          <p class="mission-feedback" id="mq-feedback-${key}"></p>
        </div>`;
    }

    return `
    <div class="course-item">
      <div class="head" onclick="this.nextElementSibling.classList.toggle('open')">
        <h4>${done ? ICONS.check + ' ' : ''}${c.title}</h4>
        <span class="idx">${String(i+1).padStart(2,'0')}</span>
      </div>
      <div class="course-body">
        <div class="course-body-inner">
          ${storyHtml}
          ${questionHtml}
        </div>
      </div>
    </div>`;
  }).join('');

  // Branche les interactions (calcul / QCM) pour les missions pas encore validées.
  mods.forEach((c,i)=>{
    const key = level+'-'+i;
    if(progress[key]) return;
    const q = c.question;
    const feedback = document.getElementById(`mq-feedback-${key}`);

    if(q.type === 'calcul'){
      const btn = document.querySelector(`[data-check="${key}"]`);
      const input = document.getElementById(`mq-input-${key}`);
      if(!btn || !input) return;
      const check = ()=>{
        const val = parseFloat(input.value);
        if(isNaN(val)){ feedback.textContent = "Entre un nombre avant de vérifier."; feedback.style.color = 'var(--text-dim)'; return; }
        if(Math.abs(val - q.reponse) <= q.tolerance){
          completeMission(key);
        } else {
          feedback.textContent = `Pas tout à fait : ${q.explication}`;
          feedback.style.color = 'var(--bordeaux)';
        }
      };
      btn.addEventListener('click', check);
      input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') check(); });
    } else {
      const choicesEl = document.getElementById(`mq-choices-${key}`);
      if(!choicesEl) return;
      Array.from(choicesEl.children).forEach((btn, oi)=>{
        btn.addEventListener('click', ()=>{
          if(oi === q.bonneReponse){
            completeMission(key);
          } else {
            btn.style.borderColor = 'var(--bordeaux)';
            feedback.textContent = q.explication;
            feedback.style.color = 'var(--bordeaux)';
          }
        });
      });
    }
  });
}

function renderFormationsConseil(){
  const result = getPositioningResult();
  if(result && result.categoryScores){
    const weakest = Object.values(result.categoryScores).sort((a,b)=>a.pct-b.pct)[0];
    if(weakest && weakest.pct < 60){
      renderConseilBadge('formationsConseil', {text:`Ton test de positionnement indique une marge de progression en ${weakest.label} (${weakest.pct}%) : une bonne piste pour la suite.`, tone:'warn'});
      return;
    }
  }
  renderConseilBadge('formationsConseil', {text:"Explore les missions ci-dessous à ton rythme, dans l'ordre que tu veux : rien n'est obligatoire.", tone:'neutral'});
}

refreshLevelUI();
renderFormationsConseil();
renderGamificationWidget('gamiWidget', true);
