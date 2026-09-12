/* ============================================================
   Chantier E (refonte continuité UX, 12/09/2026) — Laboratoire Macro/
   Économie extrait vers sa propre page (laboratoire-economie.html /
   scripts/pages/laboratoire-economie-page.js), auparavant un 8e onglet
   physiquement niché au fond du Laboratoire Personnel malgré
   labo-financier.html qui présente déjà Personnel/Professionnel/Économie
   comme 3 univers frères — contradiction nommée explicitement par
   l'utilisateur (section 19 de son brief). Extraction pure, zéro
   changement de logique (ECO_LAB_SCENARIOS + renderEcoLabScenarios +
   renderGovernorSim ne dépendaient déjà d'aucun état local à
   laboratoire.js).
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadLaboratoireEconomiePage, loadLaboratoirePage } = require('./support/load-page');

const t = createSuite('laboratoire-economie');

// ---------- La nouvelle page autonome rend bien le contenu réel ----------
{
  const { document } = loadLaboratoireEconomiePage();
  t.ok(!!document.getElementById('ecoLabScenarios'), 'le conteneur des scénarios macro existe bien sur la nouvelle page');
  const scenariosHtml = document.getElementById('ecoLabScenarios').innerHTML;
  t.ok(scenariosHtml.includes('La banque centrale augmente son taux directeur'), 'le scénario "hausse des taux" est bien rendu sur la page autonome');
  t.equal((scenariosHtml.match(/<details/g) || []).length, 4, 'les 4 scénarios macro sont bien tous rendus (repliables)');

  t.ok(!!document.getElementById('governorSim'), 'le conteneur du simulateur "Gouverneur de banque centrale" existe bien');
  const govHtml = document.getElementById('governorSim').innerHTML;
  t.ok(govHtml.includes('Prendre mes fonctions'), 'le simulateur "Gouverneur de banque centrale" est bien rendu et fonctionnel sur la page autonome');

  t.ok(document.querySelector('.breadcrumb').textContent.includes('Économie'), 'le fil d\'ariane reflète bien "Économie" comme univers de premier niveau, pas un sous-onglet');
}

// ---------- Le Laboratoire Personnel n'héberge plus cet onglet (l'autre face du correctif) ----------
{
  const { document } = loadLaboratoirePage();
  t.ok(!document.getElementById('tab-economie'), 'laboratoire.html (Personnel) n\'a plus de panneau #tab-economie — extrait en page séparée');
  t.ok(!document.getElementById('ecoLabScenarios'), 'laboratoire.html (Personnel) ne rend plus les scénarios macro — déplacés sur laboratoire-economie.html');
  t.equal(document.querySelectorAll('#labTabsGrid .quick-access-card').length, 7, 'laboratoire.html conserve bien ses 7 autres onglets, inchangés');
}

// ---------- labo-financier.html : le picker pointe bien vers la nouvelle page dédiée ----------
{
  const fs = require('fs');
  const path = require('path');
  const { ROOT } = require('./support/load-page');
  const html = fs.readFileSync(path.join(ROOT, 'labo-financier.html'), 'utf8');
  t.ok(html.includes('href="laboratoire-economie.html"'), 'le picker de labo-financier.html pointe bien vers laboratoire-economie.html, jamais vers un ancien ancrage #tab-economie');
  t.ok(!html.includes('tab-economie'), 'labo-financier.html ne référence plus du tout l\'ancien ancrage #tab-economie');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
