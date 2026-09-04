// ---------- Parcours actuel : sélecteur de niveau + missions par palier
// (sprint de fermeture des écarts, 04/09/2026, phases 4-5). Relocalisé
// depuis Mon Univers Financier (scripts/pages/parcours.js) : une page qui se
// présente comme le cockpit de la situation financière de l'utilisateur
// n'est pas le bon endroit pour "quel cours suivre ensuite" — Formations
// l'est. Code inchangé, seul l'emplacement change ; le libellé de section
// passe de "Missions" à "Parcours actuel" pour refléter sa vraie place dans
// la hiérarchie de la page (avant "Parcours guidés"/"Cours"). Jamais gaté
// derrière le test de positionnement — cette section était déjà accessible
// sans lui, elle le reste ici. ----------
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
        <p style="font-size:13px;color:var(--text-dim);margin:8px 0 14px;">Le niveau ${LEVEL_LABELS[nextLevel]} est débloqué. Ou continue d'explorer librement : les missions du jour et de la semaine de ton Univers Financier se renouvellent en continu et ne s'épuisent jamais.</p>
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
        <p style="font-size:13px;color:var(--text-dim);margin:8px 0 0;">C'est le dernier niveau fixe — mais les missions du jour et de la semaine de ton Univers Financier se renouvellent en continu, elles ne s'épuisent jamais.</p>
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

refreshLevelUI();
renderFormationsConseil();

// ---------- Hub de la section Cours, par domaine réel (même pattern que
// scripts/pages/bourse.js/BOURSE_TABS, scripts/pages/laboratoire.js/LAB_TABS) :
// ne montre que les domaines ayant au moins un vrai cours aujourd'hui, jamais
// un onglet vide affiché en attendant. Le domaine de chaque cours est
// calculé (coursDomainKey, scripts/data.js) à partir du vrai recouvrement de
// ses quizCategories avec celles de DOMAINS — jamais tagué à la main. ----------
const FORMATION_TABS = DOMAINS
  .filter(d => COURS_CATALOG.some(c => coursDomainKey(c) === d.key))
  .map(d => ({id: 'tab-formation-' + d.key, key: d.key, title: d.label, icon: d.icon}));
let formationActiveTab = (location.hash && FORMATION_TABS.some(t => t.id === location.hash.slice(1)))
  ? location.hash.slice(1) : (FORMATION_TABS[0] && FORMATION_TABS[0].id);

function renderFormationTabPanels(){
  const panelsEl = document.getElementById('formationTabPanels');
  if(!panelsEl) return;
  panelsEl.innerHTML = FORMATION_TABS.map(t => `<div class="home-tab-panel" id="${t.id}"><div id="coursList-${t.key}"></div></div>`).join('');
  FORMATION_TABS.forEach(t => renderCoursTiles('coursList-' + t.key, t.key));
}
function renderFormationTabs(){
  const el = document.getElementById('formationTabsGrid');
  if(!el) return;
  el.innerHTML = FORMATION_TABS.map(t => `
    <button class="quick-access-card ${t.id === formationActiveTab ? 'active' : ''}" data-tab="${t.id}">
      <div class="icon">${t.icon || ''}</div>
      <h3>${t.title}</h3>
    </button>`).join('');
  el.querySelectorAll('.quick-access-card').forEach(btn => {
    btn.addEventListener('click', () => setFormationTab(btn.dataset.tab));
  });
}
function setFormationTab(tabId){
  formationActiveTab = tabId;
  document.querySelectorAll('#formationTabsGrid .quick-access-card').forEach(c => c.classList.toggle('active', c.dataset.tab === tabId));
  document.querySelectorAll('#formationTabPanels .home-tab-panel').forEach(p => p.classList.toggle('active', p.id === tabId));
}
renderFormationTabPanels();
renderFormationTabs();
if(formationActiveTab) setFormationTab(formationActiveTab);
window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if(FORMATION_TABS.some(t => t.id === tab)) setFormationTab(tab);
});

// ---------- Parcours guidés (audit Formations Phase 4 du 27/08/2026) :
// ?parcours=<id> (arrivé depuis le bilan de "Ton profil Likanza") ouvre
// directement le détail du parcours recommandé pour l'objectif choisi,
// même mécanisme que defis.html?cat=. ----------
let parcoursActiveType = 'objectif';
function renderParcoursGuidesGrid(){
  const requestedId = new URLSearchParams(location.search).get('parcours');
  const openId = requestedId && LEARNING_PATHS.some(p => p.id === requestedId) ? requestedId : null;
  if(openId){
    parcoursActiveType = LEARNING_PATHS.find(p => p.id === openId).type;
    document.querySelectorAll('#parcoursTypeToggle .pill').forEach(p => p.classList.toggle('active', p.dataset.type === parcoursActiveType));
  }
  renderLearningPaths('parcoursGuidesGrid', {type: parcoursActiveType, openId});
}
document.getElementById('parcoursTypeToggle').querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    parcoursActiveType = btn.dataset.type;
    document.querySelectorAll('#parcoursTypeToggle .pill').forEach(p => p.classList.toggle('active', p === btn));
    renderLearningPaths('parcoursGuidesGrid', {type: parcoursActiveType});
  });
});
renderParcoursGuidesGrid();
