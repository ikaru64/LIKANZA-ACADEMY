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
  const progress = getMissionProgress();
  const mods = COURSES[level];
  const doneCount = mods.filter((c,i)=>progress[level+'-'+i]).length;
  document.getElementById('progressLabel').textContent = `${doneCount} / ${mods.length} missions accomplies`;
  renderMissionTiles('courseList', level);
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
renderCoursTiles('coursList');
