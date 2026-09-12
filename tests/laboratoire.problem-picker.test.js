/* ============================================================
   Chantier F (refonte continuité UX, 12/09/2026) — entrée "orientée
   problème" du Laboratoire Personnel ("Que veux-tu résoudre ?"), miroir du
   Laboratoire Business ("J'ai un problème"). Chaque carte ouvre
   DIRECTEMENT l'onglet+widget réel concerné (LAB_WIDGETS/openLabWidget,
   déjà réels) — jamais une fiche intermédiaire. Affichée AU-DESSUS de
   l'intake/du tableau de bord, jamais en remplacement — un visiteur qui
   sait déjà ce qu'il veut faire n'a pas besoin de passer par l'intake.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadLaboratoirePage } = require('./support/load-page');

const t = createSuite('laboratoire.problem-picker');

const { window, document } = loadLaboratoirePage();

t.ok(!!document.getElementById('labProblemPicker'), 'le conteneur de l\'entrée orientée problème existe bien');
const pickerHtml = document.getElementById('labProblemPicker').innerHTML;
t.ok(pickerHtml.includes('Que veux-tu résoudre'), 'le titre "Que veux-tu résoudre ?" est bien affiché');
const cards = document.querySelectorAll('#labProblemPicker .lab-entry-card');
t.equal(cards.length, 8, 'les 8 cartes-problème du brief sont bien toutes présentes');
['Gérer mon argent', 'Atteindre un objectif', 'Acheter une voiture', 'Acheter ou louer', 'Investir', 'Gérer mes crédits', 'Préparer les imprévus', 'Simuler mon futur'].forEach(titre => {
  t.ok(pickerHtml.includes(titre), `la carte "${titre}" est bien présente`);
});

// ---------- L'entrée orientée problème est visible AVANT même l'intake (jamais un remplacement) ----------
t.ok(document.getElementById('labIntakeGate').style.display === '', 'sans données réelles, le gate d\'intake reste bien visible EN PLUS du picker (pas remplacé)');

// ---------- Cliquer une carte ouvre bien le VRAI widget concerné, jamais une page morte ----------
{
  const buyRentCard = Array.from(cards).find(c => c.textContent.includes('Acheter ou louer'));
  buyRentCard.dispatchEvent(new window.Event('click'));
  const tabPanel = document.getElementById('tab-logement');
  t.ok(tabPanel.classList.contains('active'), 'cliquer "Acheter ou louer" bascule bien réellement vers l\'onglet Logement');
  const widget = document.getElementById('labBuyRentCard');
  t.ok(widget.style.display !== 'none', 'le widget "Acheter ou louer ?" est bien ouvert directement, sans clic supplémentaire');
  const grid = document.getElementById('tab-logement-widgets');
  t.ok(grid.style.display === 'none', 'la grille de widgets du logement est bien masquée au profit du widget ouvert directement');
}
{
  const urgenceCard = Array.from(cards).find(c => c.textContent.includes('Préparer les imprévus'));
  urgenceCard.dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('tab-planification').classList.contains('active'), 'cliquer "Préparer les imprévus" bascule bien vers l\'onglet Planification');
  t.ok(document.getElementById('widget-urgence-choc').style.display !== 'none', 'le widget "Fonds d\'urgence & choc financier" est bien ouvert directement');
}
{
  const investCard = Array.from(cards).find(c => c.textContent.includes('Investir') && !c.textContent.includes('centive'));
  investCard.dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('tab-investissement').classList.contains('active'), 'cliquer "Investir" (sans widget unique dominant) bascule bien vers l\'onglet Investissement');
  const grid = document.getElementById('tab-investissement-widgets');
  t.ok(grid.style.display !== 'none', 'sans widget ciblé, la grille des widgets d\'investissement reste bien visible (choix laissé à l\'utilisateur), jamais un widget arbitraire ouvert de force');
}

// ---------- Le lien "diagnostic complet" reste une alternative réelle, jamais un chemin obligatoire ----------
{
  const diagBtn = document.getElementById('labProblemPicker-diag-link');
  t.ok(!!diagBtn, 'le bouton "Faire le diagnostic complet" existe bien comme alternative');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
