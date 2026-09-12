/* ============================================================
   Chantier G (refonte continuité UX, 12/09/2026) — les 11 onglets Bourse
   étaient plats, de poids égal, sans regroupement. Nouvelle couche VISUELLE
   (Aujourd'hui/Mes actions/Analyser/Comparer/Simuler/Portefeuille)
   au-dessus des mêmes 11 onglets — ids, libellés, routage par hash et
   comportement de bascule (setBourseTab) INCHANGÉS.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBoursePage } = require('./support/load-page');

const t = createSuite('bourse.tab-groups');

const { window, document, runInPage } = loadBoursePage();

// ---------- Les 11 onglets existent toujours, aucun renommé/supprimé ----------
// BOURSE_TABS est un `const` de premier niveau : invisible depuis window.xxx
// (sémantique JS standard), accessible via runInPage (portée partagée).
const REAL_TAB_IDS = ['tab-marche-jour', 'tab-fiches', 'tab-screener', 'tab-comparateur', 'tab-scenarios', 'tab-dca', 'tab-portefeuille', 'tab-marches', 'tab-options', 'tab-paper-trading', 'tab-watchlist'];
const bourseTabs = runInPage('window.__r = BOURSE_TABS;');
t.equal(bourseTabs.length, 11, 'les 11 onglets réels existent toujours, aucun supprimé');
REAL_TAB_IDS.forEach(id => {
  t.ok(bourseTabs.some(bt => bt.id === id), `l'onglet réel "${id}" existe toujours, inchangé`);
});
t.equal(document.querySelectorAll('#bourseTabsGrid .quick-access-card').length, 11, 'les 11 cartes-onglets sont bien toutes rendues');

// ---------- Les 6 groupes du brief sont bien représentés visuellement ----------
const gridHtml = document.getElementById('bourseTabsGrid').innerHTML;
['Aujourd\'hui', 'Mes actions', 'Analyser', 'Comparer', 'Simuler', 'Portefeuille'].forEach(group => {
  t.ok(gridHtml.includes(group), `le groupe "${group}" est bien affiché comme en-tête visuel`);
});
t.equal((gridHtml.match(/bourse-tab-group-label/g) || []).length, 6, 'exactement 6 en-têtes de groupe sont rendus (pas un par onglet)');

// ---------- Le comportement de bascule (setBourseTab) reste inchangé ----------
{
  const btn = document.querySelector('[data-tab="tab-comparateur"]');
  btn.dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('tab-comparateur').classList.contains('active'), 'cliquer un onglet groupé bascule toujours réellement vers le bon panneau');
  t.ok(btn.classList.contains('active'), 'la carte cliquée porte bien la classe active');
}

// ---------- Le routage par hash reste inchangé ----------
{
  window.location.hash = 'tab-portefeuille';
  window.dispatchEvent(new window.Event('hashchange'));
  t.ok(document.getElementById('tab-portefeuille').classList.contains('active'), 'le routage par hash fonctionne toujours à l\'identique après le regroupement visuel');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
