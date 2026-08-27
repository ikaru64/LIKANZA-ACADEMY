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
