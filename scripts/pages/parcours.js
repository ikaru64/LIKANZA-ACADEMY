/* ============================================================
   LIKANZA ACADEMY — Mon parcours
   Tableau de bord personnel par domaine (niveau déclaré vs évalué,
   confiance, quiz approfondis). Jamais verrouillé : le reste du site
   reste accessible sans avoir fait le premier quiz. Mais tant qu'il
   n'est pas fait, cette page elle-même met une seule action en avant
   (le premier quiz) plutôt qu'un tableau de bord vide — et une fois
   fait, une seule recommandation d'évaluation à la fois, jamais les
   6 domaines listés comme une to-do list.
   ============================================================ */

function initParcoursHero(){
  const hasProfile = !!getPositioningResult();
  if(!hasProfile){
    document.getElementById('parcoursGateSection').style.display = 'block';
    renderParcoursGate('parcoursGate');
    return;
  }
  document.getElementById('parcoursMainSection').style.display = 'block';
  renderParcoursProfileSummary('parcoursProfileSummary');
  renderNextStepRecommendation('parcoursNextStep');
  renderFinancialIQDetail('parcoursFinancialIQ');
  renderDomainDashboard('domainDashboard');
}

// ---------- Missions par niveau (déplacé depuis formations.html : la liste
// de missions ne doit vivre que sur Mon Parcours, jamais dupliquée sur
// Formations). Jamais gaté derrière le test de positionnement — cette
// section était déjà accessible sans lui sur Formations, elle le reste ici. ----------
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
        <p style="font-size:13px;color:var(--text-dim);margin:8px 0 14px;">Le niveau ${LEVEL_LABELS[nextLevel]} est débloqué. Ou continue d'explorer librement : les missions du jour et de la semaine ci-dessous se renouvellent en continu et ne s'épuisent jamais.</p>
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
        <p style="font-size:13px;color:var(--text-dim);margin:8px 0 0;">C'est le dernier niveau fixe — mais les missions du jour et de la semaine ci-dessous se renouvellent en continu, elles ne s'épuisent jamais.</p>
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
  // Basé sur la vraie maîtrise en direct (Défis/cours/quiz approfondis),
  // pas sur un ancien score noté du premier quiz (retiré : celui-ci est
  // désormais 100% déclaratif).
  const weakest = getSkillMastery().find(m => m.niveau === 'faible');
  if(weakest){
    renderConseilBadge('formationsConseil', {text:`Tes quiz montrent une marge de progression en ${weakest.categorie} (${weakest.pct}%) : une bonne piste pour la suite.`, tone:'warn'});
    return;
  }
  renderConseilBadge('formationsConseil', {text:"Explore les missions ci-dessous à ton rythme, dans l'ordre que tu veux : rien n'est obligatoire.", tone:'neutral'});
}

function renderMistakesSection(){
  const section = document.getElementById('mistakesSection');
  const summaryEl = document.getElementById('mistakesSummary');
  if(!section || !summaryEl) return;
  const allUnresolved = getMistakes().filter(m=>!m.resolved);
  if(allUnresolved.length === 0){
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  const counts = {};
  allUnresolved.forEach(m => { counts[m.categorie] = (counts[m.categorie]||0) + 1; });
  const topCategorie = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  summaryEl.textContent = `${allUnresolved.length} notion${allUnresolved.length>1?'s':''} à revoir, surtout en ${topCategorie}.`;
}

initParcoursHero();
renderMistakesSection();
refreshLevelUI();
renderFormationsConseil();
renderDailyMissions('dailyMissions');
renderWeeklyMissions('weeklyMissions');
