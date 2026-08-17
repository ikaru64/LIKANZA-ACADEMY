const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
let level = getLevel();
if(!COURSES[level]) level = 'debutant';
if(!isLevelUnlocked(level)) level = firstUnlockedLevel();

function renderLevelCompleteBanner(doneCount, modsLength){
  const el = document.getElementById('levelCompleteBanner');
  if(!el) return;
  if(doneCount < modsLength){ el.innerHTML = ''; return; }
  const nextLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1];
  if(nextLevel){
    el.innerHTML = `
      <div class="card" style="background:var(--bg-alt);border:1px solid var(--gold);">
        <span class="smallcaps" style="color:var(--emerald);">${ICONS.check} Niveau ${LEVEL_LABELS[level]} terminé</span>
        <p style="font-size:13px;color:var(--text-dim);margin:8px 0 14px;">Le niveau ${LEVEL_LABELS[nextLevel]} est débloqué. Ou continue d'explorer librement : les missions du jour et de la semaine ci-dessus se renouvellent en continu et ne s'épuisent jamais.</p>
        <button class="btn btn-sm btn-gold" id="levelCompleteNextBtn" type="button">Passer au niveau ${LEVEL_LABELS[nextLevel]} →</button>
      </div>`;
    document.getElementById('levelCompleteNextBtn').addEventListener('click', () => {
      level = nextLevel;
      setLevelStorage(level);
      refreshLevelUI();
      document.getElementById('courseList').scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  } else {
    el.innerHTML = `
      <div class="card" style="background:var(--bg-alt);border:1px solid var(--gold);">
        <span class="smallcaps" style="color:var(--emerald);">${ICONS.check} Niveau Expert terminé</span>
        <p style="font-size:13px;color:var(--text-dim);margin:8px 0 0;">C'est le dernier niveau fixe — mais les missions du jour et de la semaine ci-dessus se renouvellent en continu, elles ne s'épuisent jamais.</p>
      </div>`;
  }
}

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
  renderLevelCompleteBanner(doneCount, mods.length);
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
renderDailyMissions('dailyMissions');
renderWeeklyMissions('weeklyMissions');
