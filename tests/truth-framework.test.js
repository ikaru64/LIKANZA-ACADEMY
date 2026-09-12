/* ============================================================
   Chantier C (refonte continuité UX, 12/09/2026) — Likanza Truth Framework :
   "fait" renommé "Donnée réelle" (même concept, libellé plus clair, aligné
   sur le brief). "analyse"/"avis" volontairement CONSERVÉS comme catégories
   distinctes de calcul/scénario/simulation — voir le commentaire de
   DATA_BADGE_META (scripts/historical-data.js) pour la justification
   épistémique. Couvre aussi le nouveau ACTION_METHODOLOGY.theses
   (scripts/data.js), 1er point d'extension de renderMethodologyPanel vers
   la fiche action.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBoursePage } = require('./support/load-page');

const t = createSuite('truth-framework');

const { window, runInPage } = loadBoursePage();

// ---------- renderDataBadge : 6 catégories, le libellé "fait" a bien changé ----------
t.ok(window.renderDataBadge('fait').includes('Donnée réelle'), 'renderDataBadge("fait") affiche bien "Donnée réelle" (nouveau libellé), jamais "Fait"');
t.ok(!window.renderDataBadge('fait').includes('>Fait<'), 'l\'ancien libellé "Fait" n\'apparaît plus');
t.ok(window.renderDataBadge('calcul').includes('Calcul'), 'renderDataBadge("calcul") inchangé');
t.ok(window.renderDataBadge('scenario').includes('Scénario'), 'renderDataBadge("scenario") inchangé');
t.ok(window.renderDataBadge('simulation').includes('Simulation'), 'renderDataBadge("simulation") inchangé');
// "analyse"/"avis" volontairement conservés comme 2 catégories de plus, jamais fusionnées.
t.ok(window.renderDataBadge('analyse').includes('Analyse'), '"analyse" reste une catégorie à part entière, jamais fusionnée dans "Calcul"');
t.ok(window.renderDataBadge('avis').includes('Avis'), '"avis" reste une catégorie à part entière, jamais fusionnée dans "Calcul"');

// ---------- ACTION_METHODOLOGY.theses : nouvelle extension de renderMethodologyPanel vers la fiche action ----------
// ACTION_METHODOLOGY est un `const` de premier niveau (data.js) : invisible
// depuis window.xxx (sémantique JS standard), accessible via runInPage
// (portée partagée), voir tests/support/load-page.js.
const thesesSpec = runInPage(`window.__r = (typeof ACTION_METHODOLOGY !== 'undefined') ? ACTION_METHODOLOGY.theses : null;`);
t.ok(!!thesesSpec, 'ACTION_METHODOLOGY.theses existe bien (scripts/data.js)');
if(thesesSpec){
  const panel = window.renderMethodologyPanel(thesesSpec);
  t.ok(panel.includes('ⓘ Comment ce résultat est calculé'), 'le panneau méthodologie de la fiche action réutilise bien EXACTEMENT le même composant partagé (renderMethodologyPanel), jamais un panneau ad hoc dupliqué');
  ['calcul', 'donnees', 'hypotheses', 'limites', 'comprendre'].forEach(key => {
    t.ok(!!thesesSpec[key], `ACTION_METHODOLOGY.theses couvre bien la section "${key}"`);
  });
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
