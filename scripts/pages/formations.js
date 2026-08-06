const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
let level = getLevel();
if(!COURSES[level]) level = 'debutant';

function refreshLevelUI(){
  document.querySelectorAll('.level-pills .pill').forEach(p=>p.classList.toggle('active', p.dataset.lvl===level));
  document.getElementById('levelLabel').textContent = LEVEL_LABELS[level];
  renderModules();
}
document.querySelectorAll('.level-pills .pill').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    level = btn.dataset.lvl;
    setLevelStorage(level);
    refreshLevelUI();
  });
});

function getProgress(){ return safeGetJSON('fzr-progress', {}); }
function toggleModuleDone(key){
  const progress = getProgress();
  const wasDone = !!progress[key];
  progress[key] = !wasDone;
  safeSetJSON('fzr-progress', progress);
  if(!wasDone){
    const mods = COURSES[level];
    const doneCount = mods.filter((c,i)=>progress[level+'-'+i]).length;
    const levelJustCompleted = doneCount === mods.length;
    awardXP(30, {moduleCompleted:true, levelJustCompleted});
    if(document.getElementById('gamiWidget')) renderGamificationWidget('gamiWidget', true);
  }
  renderModules();
}

function renderModules(){
  const progress = getProgress();
  const mods = COURSES[level];
  const doneCount = mods.filter((c,i)=>progress[level+'-'+i]).length;
  document.getElementById('progressLabel').textContent = `${doneCount} / ${mods.length} missions accomplies`;
  document.getElementById('courseList').innerHTML = mods.map((c,i)=>{
    const key = level+'-'+i;
    const done = !!progress[key];
    return `
    <div class="course-item">
      <div class="head" onclick="this.nextElementSibling.classList.toggle('open')">
        <h4>${done ? '✓ ' : ''}${c.title}</h4>
        <span class="idx">${String(i+1).padStart(2,'0')}</span>
      </div>
      <div class="course-body">
        <p style="margin-bottom:12px;">${c.body}</p>
        <button class="btn btn-sm" onclick="toggleModuleDone('${key}')">${done ? 'Marquer comme non faite' : 'Valider cette mission'}</button>
      </div>
    </div>`;
  }).join('');
}
refreshLevelUI();
renderQuizSetup('quizContainer');
renderGamificationWidget('gamiWidget', true);
