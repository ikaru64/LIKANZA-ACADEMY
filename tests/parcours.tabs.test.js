/* ============================================================
   Sprint de consolidation Mon Univers Financier (09/09/2026) — restructure
   en onglets (Vue d'ensemble/Patrimoine/Portefeuille/Risques/Objectifs/
   Projections), retrait de la "Suite de l'apprentissage" (learning-only,
   déjà couvert par le Tableau de bord), et 2 nouvelles vues réelles
   (Portefeuille, Risques) consolidant les MÊMES données que Bourse — jamais
   un 2e calculateur.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadParcoursPage, flush } = require('./support/load-page');

const t = createSuite('parcours.tabs');

function seedPersonalUser(window){
  window.localStorage.setItem('likanza-positioning-result', JSON.stringify({profile: 'equilibre', completedAt: new Date().toISOString(), version: 2}));
  window.localStorage.setItem('likanza-net-worth-assets', JSON.stringify([
    {id: 'a1', nom: 'Compte courant', categorie: 'cash', valeur: 5000, dateAjout: new Date().toISOString()},
    {id: 'a2', nom: 'PEA', categorie: 'pea', valeur: 15000, dateAjout: new Date().toISOString()}
  ]));
  window.localStorage.setItem('likanza-financial-goals', JSON.stringify([
    {id: 'g1', nom: "Fonds d'urgence", montantCible: 3000, montantActuel: 500, versementMensuel: 100, dateCible: null}
  ]));
}

(async () => {
  // ---------- Suite de l'apprentissage retirée, priorité "À faire maintenant" aussi ----------
  {
    const { document } = loadParcoursPage({seed: seedPersonalUser});
    await flush(50);
    t.ok(!document.getElementById('dashboardHeader'), "le bandeau gamification (dashboardHeader) n'existe plus sur Mon Univers Financier");
    t.ok(!document.getElementById('dashboardShell'), "la grille de widgets d'apprentissage (dashboardShell) n'existe plus sur Mon Univers Financier");
    t.ok(!document.getElementById('dashboardPriority'), "le bandeau \"À faire maintenant\" (100% apprentissage) n'existe plus sur Mon Univers Financier");
    t.ok(!document.querySelector('.learning-suite-collapse'), "la section repliée \"Suite de l'apprentissage\" n'existe plus dans le HTML");
  }

  // ---------- Navigation par onglets : 6 onglets, bascule réelle ----------
  {
    const { document } = loadParcoursPage({seed: seedPersonalUser});
    await flush(50);
    const tabButtons = document.querySelectorAll('#cockpitTabsGrid .quick-access-card');
    t.equal(tabButtons.length, 6, "les 6 onglets (Vue d'ensemble/Patrimoine/Portefeuille/Risques/Objectifs/Projections) sont bien rendus");
    t.ok(document.getElementById('tab-vue-ensemble').classList.contains('active'), "Vue d'ensemble est bien l'onglet actif par défaut");
    t.ok(!document.getElementById('tab-patrimoine').classList.contains('active'), "Patrimoine n'est pas actif par défaut");

    const patrimoineBtn = [...tabButtons].find(b => b.dataset.tab === 'tab-patrimoine');
    patrimoineBtn.dispatchEvent(new (patrimoineBtn.ownerDocument.defaultView.Event)('click'));
    t.ok(document.getElementById('tab-patrimoine').classList.contains('active'), "cliquer sur \"Patrimoine\" l'affiche bien");
    t.ok(!document.getElementById('tab-vue-ensemble').classList.contains('active'), "cliquer sur \"Patrimoine\" masque bien Vue d'ensemble");
    t.ok(patrimoineBtn.classList.contains('active'), "le bouton d'onglet Patrimoine porte bien la classe active");
  }

  // ---------- Onglet Patrimoine : vrais comptes + allocation ----------
  {
    const { document } = loadParcoursPage({seed: seedPersonalUser});
    await flush(50);
    const html = document.getElementById('cockpitPatrimoineBody').innerHTML;
    t.ok(html.includes('Compte courant') && html.includes('PEA'), "les vrais comptes saisis (Compte courant, PEA) apparaissent dans l'onglet Patrimoine");
    t.ok(html.includes('Allocation globale'), "la répartition par catégorie est bien rendue dans l'onglet Patrimoine");
  }

  // ---------- Onglet Objectifs : vrais objectifs ----------
  {
    const { document } = loadParcoursPage({seed: seedPersonalUser});
    await flush(50);
    const html = document.getElementById('cockpitObjectifsBody').innerHTML;
    t.ok(html.includes("Fonds d'urgence"), "le vrai objectif saisi apparaît dans l'onglet Objectifs");
  }

  // ---------- Onglet Objectifs : boucle Lab -> Mon Univers (linkLifeProjectSimulation) visible ici ----------
  {
    const { window, document } = loadParcoursPage({seed: w => {
      seedPersonalUser(w);
      w.localStorage.setItem('likanza-life-projects', JSON.stringify([
        {id: 'p1', nom: 'Achat maison', categorie: 'immobilier', budgetTotal: 300000, dateCible: null, horizonApprox: null, priority: null, status: 'actif', notes: '', etapes: [], dateCreation: new Date().toISOString(),
          linkedSimulations: [
            {label: 'Trajectoire à 10 ans (hypothèse centrale : 85 000 €)', url: 'laboratoire.html#tab-budget-epargne', date: new Date().toISOString()}
          ]},
        {id: 'p2', nom: 'Voyage au Japon', categorie: 'voyage', budgetTotal: 4000, dateCible: null, horizonApprox: null, priority: null, status: 'actif', notes: '', etapes: [], dateCreation: new Date().toISOString(), linkedSimulations: []}
      ]));
    }});
    await flush(50);
    const html = document.getElementById('cockpitObjectifsBody').innerHTML;
    t.ok(html.includes('1 scénario du Laboratoire'), "un projet avec un scénario sauvegardé depuis le Laboratoire (linkLifeProjectSimulation) l'affiche bien ici — ferme la boucle Lab -> Mon Univers");
    t.ok(!/Voyage au Japon[\s\S]{0,120}scénario/.test(html), "un projet sans scénario lié n'affiche jamais ce signal (jamais fabriqué)");
  }

  // ---------- Onglet Projections : scénario, jamais une prévision, choc sans rebond automatique ----------
  {
    const { window, document } = loadParcoursPage({seed: seedPersonalUser});
    await flush(50);
    const capitalInput = document.getElementById('cpCapital');
    t.ok(!!capitalInput, "les champs de projection (capital/versement/rendement) sont bien rendus dans l'onglet, jamais dans un <dialog> séparé");
    t.ok(!document.getElementById('cockpitProjectionModal'), "l'ancien <dialog> de projection n'existe plus (section 19 : intégré dans l'onglet)");
    capitalInput.value = '20000';
    document.getElementById('cpVersement').value = '200';
    document.getElementById('cpRendement').value = '5';
    capitalInput.dispatchEvent(new window.Event('input'));

    // toLocaleString('fr-FR') insère un espace insécable fine U+202F comme
    // séparateur de milliers, jamais un espace normal — on ne matche donc
    // que les chiffres.
    const resultsBefore = document.getElementById('cpResults').innerHTML;
    t.ok(/20.?000/.test(resultsBefore.replace(/[\s ]/g, ' ')), "le résultat \"aujourd'hui\" reflète bien le capital saisi sans choc");

    // Applique un choc de -30% : le capital de départ doit être réduit de 30%,
    // jamais suivi d'un rebond auto (juste une projection au même rendement
    // à partir du capital déjà réduit).
    const crashBtn = [...document.querySelectorAll('.cockpit-crash-btn')].find(b => b.dataset.crash === '-30');
    t.ok(!!crashBtn, "le bouton de choc -30% existe bien");
    crashBtn.dispatchEvent(new window.Event('click'));
    const resultsAfter = document.getElementById('cpResults').innerHTML;
    t.ok(/14.?000/.test(resultsAfter.replace(/[\s ]/g, ' ')), "un choc de -30% réduit bien le capital de départ à 20000*0.7=14000 (obtenu : " + resultsAfter.slice(0, 200) + ")");
    t.ok(resultsAfter.includes('-30'), "le libellé indique bien le choc appliqué, jamais silencieux");
  }

  // ---------- Onglet Portefeuille : aucune transaction réelle -> CTA honnête vers Bourse ----------
  {
    const { document } = loadParcoursPage({seed: seedPersonalUser});
    await flush(50);
    const html = document.getElementById('cockpitPortefeuilleBody').innerHTML;
    t.ok(html.includes('bourse.html'), "sans transaction réelle, un lien honnête vers Bourse est proposé, jamais un portefeuille fabriqué");
    t.ok(!html.includes('€') || html.includes('Aucune transaction'), "aucune valeur inventée n'est affichée en l'absence de transactions réelles");
  }

  // ---------- Onglet Portefeuille : une vraie transaction sur une valeur STOCKS_DEMO (pas de réseau nécessaire) ----------
  {
    const { window, document } = loadParcoursPage({seed: w => {
      seedPersonalUser(w);
      w.localStorage.setItem('likanza-real-portfolio', JSON.stringify([
        {id: 'tx1', ticker: 'AI.PA', name: 'Air Liquide', quantity: 10, buyPrice: 150, buyDate: '2026-01-01', currency: 'EUR', note: ''}
      ]));
    }});
    await flush(80);
    const html = document.getElementById('cockpitPortefeuilleBody').innerHTML;
    t.ok(html.includes('Air Liquide'), "la vraie position (Air Liquide, valeur STOCKS_DEMO réelle, aucun réseau nécessaire) apparaît dans le Portefeuille");
    t.ok(html.includes('bourse.html'), "un lien vers Bourse pour gérer les transactions est bien présent, jamais un formulaire dupliqué ici");

    // ---------- Onglet Risques : concentration réelle sur cette même position ----------
    const riskHtml = document.getElementById('cockpitRisquesBody').innerHTML;
    t.ok(riskHtml.includes('Concentration du portefeuille'), "le panneau de concentration est bien rendu");
    t.ok(riskHtml.includes('100 %') || riskHtml.includes('100&nbsp;%'), "une seule position = 100% de concentration, calculé honnêtement (obtenu : " + riskHtml.slice(0, 300) + ")");
    t.ok(riskHtml.includes('Industrie'), "le vrai secteur (Industrie, Air Liquide) est bien utilisé pour la répartition par secteur");
    t.ok(riskHtml.includes('France'), "le vrai pays (France) est bien utilisé pour la répartition par pays");
    t.ok(riskHtml.includes('Santé financière'), "la Santé financière (6 axes, déplacée depuis l'ancienne section apprentissage) est bien présente dans l'onglet Risques");
  }

  const summary = t.summary();
  console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
  process.exit(summary.failed > 0 ? 1 : 0);
})();
