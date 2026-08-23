/* ============================================================
   LIKANZA ACADEMY — Défis (defis.html)
   Terrain d'entraînement mental : Défi du jour, statistiques réelles
   (niveau/XP/série/ligue/maîtrise), puis un hub par onglet (même pattern que
   bourse.js/BOURSE_TABS, laboratoire.js/LAB_TABS, formations.js/
   FORMATION_TABS) : Quiz Express, Casse-têtes, Pour toi, Parcours
   thématiques, Mes performances, Classement. Toute la logique de rendu vit
   dans scripts/data.js — ce fichier déclenche, gère la navigation par
   onglets et l'arrivée via ?cat=.
   ============================================================ */

renderDefisStatsBar('defisStatsBar');
renderDefiDuJour('defiDuJour');

// ---------- Hub par onglet : chaque onglet correspond à une vraie
// destination fonctionnelle aujourd'hui — jamais un onglet "Enquêtes",
// "Dilemmes", "Escape Rooms" ou "Battles" tant que ce contenu réel n'existe
// pas (chantiers séparés, pas encore construits). ----------
const DEFIS_TABS = [
  {id:'tab-defis-express', title:'Quiz Express', desc:'20 s à quelques minutes', icon:'⚡'},
  {id:'tab-defis-cassetetes', title:'Casse-têtes', desc:'Raisonnement, pas des définitions', icon:'🧠'},
  {id:'tab-defis-pourtoi', title:'Pour toi', desc:'Recommandé et à revoir', icon:'🎯'},
  {id:'tab-defis-parcours', title:'Parcours thématiques', desc:'Séries par thème', icon:'🗺️'},
  {id:'tab-defis-perf', title:'Mes performances', desc:'Basé sur tes vraies réponses', icon:'📊'},
  {id:'tab-defis-classement', title:'Classement', desc:'Par ligue (démo)', icon:'🏆'}
];
let defisActiveTab = (location.hash && DEFIS_TABS.some(t => t.id === location.hash.slice(1))) ? location.hash.slice(1) : DEFIS_TABS[0].id;
function renderDefisTabs(){
  const el = document.getElementById('defisTabsGrid');
  if(!el) return;
  el.innerHTML = DEFIS_TABS.map(t => `
    <button class="quick-access-card ${t.id === defisActiveTab ? 'active' : ''}" data-tab="${t.id}">
      <div class="icon">${t.icon}</div>
      <h3>${t.title}</h3>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${t.desc}</p>
    </button>`).join('');
  el.querySelectorAll('.quick-access-card').forEach(btn => {
    btn.addEventListener('click', () => setDefisTab(btn.dataset.tab));
  });
}
function setDefisTab(tabId){
  defisActiveTab = tabId;
  document.querySelectorAll('#defisTabsGrid .quick-access-card').forEach(c => c.classList.toggle('active', c.dataset.tab === tabId));
  document.querySelectorAll('.home-tab-panel').forEach(p => p.classList.toggle('active', p.id === tabId));
}
renderDefisTabs();
setDefisTab(defisActiveTab);
window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if(DEFIS_TABS.some(t => t.id === tab)) setDefisTab(tab);
});

renderModesEntrainement('modesEntrainement');
renderDefisCassesTetes('defisCassesTetes');
renderRecommandePourToi('recommandePourToi');
renderDefisARevoir('defisARevoir');
renderDefisParcours('defisParcours');
renderDefisPerformances('defisPerformances');
renderLeagueBoard('defisClassement');

// ?cat=<categorie> : arrivée depuis revisions.html ou la mission quotidienne
// "Revoir une notion mal comprise" — lance directement une session ciblée
// sur ce thème dans l'onglet Quiz Express, sans dépendre d'un ancien
// sélecteur qui n'existe plus dans la nouvelle structure de la page.
const requestedCat = new URLSearchParams(location.search).get('cat');
if(requestedCat){
  const pool = QUIZ_BANK_FULL.concat(MENTAL_CHALLENGES).filter(i => i.categorie === requestedCat);
  if(pool.length > 0){
    setDefisTab('tab-defis-express');
    const target = document.getElementById('modesEntrainement');
    if(target){
      target.scrollIntoView({behavior: 'smooth', block: 'start'});
      startMixedSession('modesEntrainement', pool.slice(0, 8));
    }
  }
}
