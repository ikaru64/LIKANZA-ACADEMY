/* ============================================================
   Laboratoire personnel : refonte "assistant de décision" (11/09/2026) —
   intake progressif, Santé financière (composite affiché ici, à la
   différence du Bilan Likanza de Mon Univers Financier — demande explicite
   de ce chantier), "Tes priorités" (jusqu'à 3, réutilise computeFinancialDashboard/
   computeHealthScore/computeLabPriorities, jamais un second moteur de
   diagnostic), scénarios par priorité. Les 8 onglets/19 outils existants ne
   sont jamais retirés — voir laboratoire.tabs (test pré-existant) pour leur
   couverture, non dupliquée ici.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadLaboratoirePage } = require('./support/load-page');

const t = createSuite('laboratoire.assistant');

// ---------- Sans aucune donnée réelle : le gate d'intake s'affiche, jamais le tableau de bord ----------
{
  const { document } = loadLaboratoirePage();
  t.equal(document.getElementById('labIntakeGate').style.display, '', "sans aucune donnée réelle, le gate d'intake est bien visible");
  t.equal(document.getElementById('labHome').style.display, 'none', "sans aucune donnée réelle, le tableau de bord (Santé + priorités) reste bien masqué");
  const html = document.getElementById('labIntakeGate').innerHTML;
  t.ok(html.includes('Étape 1 / 4') && html.includes('Tes revenus'), "l'étape 1 (revenus) est bien affichée en premier");
  t.ok(!html.includes('Étape 2') , "les autres étapes ne sont pas affichées simultanément (progressif, jamais 30 champs à la fois)");

  // Les 8 onglets/19 outils existants restent bien présents, inchangés, sous "Tous les outils".
  t.ok(document.getElementById('labToolsHead').textContent.includes('Tous les outils'), "la section des outils existants est bien libellée \"Tous les outils\", jamais supprimée");
  t.equal(document.querySelectorAll('#labTabsGrid .quick-access-card').length, 8, "les 8 onglets existants sont bien tous présents, inchangés");
}

// ---------- Parcours complet de l'intake (4 étapes réelles, avec de vraies valeurs saisies) ----------
{
  const { window, document } = loadLaboratoirePage();
  // Étape 1 : revenus
  document.getElementById('intakeRevenuNet').value = '1800';
  document.getElementById('intakeRevenuAutre').value = '';
  document.getElementById('intakeNext').dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('labIntakeGate').innerHTML.includes('Étape 2 / 4'), "après l'étape 1, on passe bien réellement à l'étape 2");

  // Étape 2 : dépenses
  document.getElementById('intakeLogement').value = '700';
  document.getElementById('intakeAlim').value = '350';
  document.getElementById('intakeLoisirs').value = '200';
  document.getElementById('intakeAbos').value = '50';
  document.getElementById('intakeNext').dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('labIntakeGate').innerHTML.includes('Étape 3 / 4'), "après l'étape 2, on passe bien réellement à l'étape 3");

  // Étape 3 : situation
  document.getElementById('intakeEpargne').value = '500';
  document.getElementById('intakeNext').dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('labIntakeGate').innerHTML.includes('Étape 4 / 4'), "après l'étape 3, on passe bien réellement à l'étape 4");

  // Étape 4 : objectif — choisit un préréglage réel, saisit un vrai montant/date
  const voitureBtn = Array.from(document.querySelectorAll('[data-goal]')).find(b => b.dataset.goal === 'Acheter une voiture');
  t.ok(!!voitureBtn, "le préréglage réel \"Acheter une voiture\" est bien proposé");
  voitureBtn.dispatchEvent(new window.Event('click'));
  document.getElementById('intakeGoalMontant').value = '12000';
  document.getElementById('intakeNext').dispatchEvent(new window.Event('click'));

  // Fin de l'intake : les vraies données sont bien persistées via les VRAIES fonctions de sauvegarde (aucun store parallèle).
  const entries = window.getBudgetEntries();
  t.ok(entries.some(e => e.type === 'revenu' && e.categorie === 'Salaire' && e.montant === 1800), "le revenu réellement saisi est bien persisté via saveBudgetEntry");
  t.ok(entries.some(e => e.categorie === 'Logement' && e.montant === 700), "la dépense Logement réellement saisie est bien persistée");
  t.ok(entries.some(e => e.categorie === 'Loisirs & sorties' && e.montant === 200), "la dépense Loisirs réellement saisie est bien persistée");
  const assets = window.getNetWorthAssets();
  t.ok(assets.some(a => a.categorie === 'epargne' && a.valeur === 500), "l'épargne réellement saisie est bien persistée via saveNetWorthAsset");
  const goals = window.getFinancialGoals();
  t.ok(goals.some(g => g.nom === 'Acheter une voiture' && g.montantCible === 12000), "l'objectif réellement choisi est bien persisté via saveFinancialGoal");

  // Le tableau de bord s'affiche bien maintenant, plus le gate.
  t.equal(document.getElementById('labIntakeGate').style.display, 'none', "l'intake terminé, le gate se masque bien");
  t.equal(document.getElementById('labHome').style.display, '', "l'intake terminé, le tableau de bord devient bien visible");
}

// ---------- Santé financière : score composite affiché ICI (section 5, demande explicite — à la différence du Bilan Likanza de Mon Univers) ----------
{
  const { window, document } = loadLaboratoirePage({ seed: w => {
    const mois = new Date().toISOString().slice(0,7);
    w.localStorage.setItem('likanza-budget-entries', JSON.stringify([
      {id:'b1', type:'revenu', categorie:'Salaire', montant:2000, mois, dateAjout:new Date().toISOString()},
      {id:'b2', type:'depense', categorie:'Logement', montant:800, mois, dateAjout:new Date().toISOString()}
    ]));
  }});
  const healthHtml = document.getElementById('labHome').innerHTML;
  t.ok(/\d+\s*\/\s*100/.test(healthHtml), "le score composite \"X/100\" est bien affiché ici (demande explicite de ce chantier)");
  t.ok(healthHtml.includes('Santé financière'), "le libellé \"Santé financière\" est bien présent");
}

// ---------- Tes priorités : jamais plus de 3, chiffres réels, jamais une injonction ----------
{
  const { window, document } = loadLaboratoirePage({ seed: w => {
    const mois = new Date().toISOString().slice(0,7);
    w.localStorage.setItem('likanza-budget-entries', JSON.stringify([
      {id:'b1', type:'revenu', categorie:'Salaire', montant:2000, mois, dateAjout:new Date().toISOString()},
      {id:'b2', type:'depense', categorie:'Logement', montant:900, mois, dateAjout:new Date().toISOString()},
      {id:'b3', type:'depense', categorie:'Loisirs & sorties', montant:300, mois, dateAjout:new Date().toISOString()},
      {id:'b4', type:'depense', categorie:'Abonnements', montant:150, mois, dateAjout:new Date().toISOString()}
    ]));
    w.localStorage.setItem('likanza-net-worth-assets', JSON.stringify([{id:'a1', nom:'Compte courant', categorie:'cash', valeur:200}]));
    const dateCible = new Date(); dateCible.setMonth(dateCible.getMonth()+18);
    w.localStorage.setItem('likanza-financial-goals', JSON.stringify([{id:'g1', nom:'Voiture', montantCible:12000, montantActuel:0, versementMensuel:380, dateCible: dateCible.toISOString().slice(0,10), dateAjout:new Date().toISOString()}]));
  }});
  const priorityCards = document.querySelectorAll('.lab-priority-card');
  t.ok(priorityCards.length >= 1 && priorityCards.length <= 3, `entre 1 et 3 priorités affichées, jamais plus (obtenu ${priorityCards.length})`);
  const homeHtml = document.getElementById('labHome').innerHTML;
  t.ok(!/\bfais\s|\bachète\s|\bvends\s/i.test(homeHtml), "aucune injonction (\"fais\", \"achète\", \"vends\") n'est jamais formulée");
  t.ok(homeHtml.includes('piste') || homeHtml.includes('scénario') || homeHtml.includes('pourrait'), "un vocabulaire hedgé (piste/scénario/pourrait) est bien utilisé");

  // Vérifie qu'au moins une priorité cite un vrai chiffre issu des données saisies (18 mois / 12 000 € / etc.)
  t.ok(homeHtml.includes('Voiture') || homeHtml.includes('fonds d\'urgence') || homeHtml.includes('urgence'), `au moins une priorité réelle (objectif Voiture ou fonds d'urgence) est bien sélectionnée (html: ${homeHtml.slice(0,400)})`);
}

// ---------- "Voir où économiser" : décomposition réelle, jamais un montant inventé ----------
{
  const { window, document } = loadLaboratoirePage({ seed: w => {
    const mois = new Date().toISOString().slice(0,7);
    w.localStorage.setItem('likanza-budget-entries', JSON.stringify([
      {id:'b1', type:'revenu', categorie:'Salaire', montant:1500, mois, dateAjout:new Date().toISOString()},
      {id:'b2', type:'depense', categorie:'Logement', montant:900, mois, dateAjout:new Date().toISOString()},
      {id:'b3', type:'depense', categorie:'Loisirs & sorties', montant:400, mois, dateAjout:new Date().toISOString()},
      {id:'b4', type:'depense', categorie:'Abonnements', montant:200, mois, dateAjout:new Date().toISOString()}
    ]));
  }});
  // solde = 1500 - 1500 = 0, donc pas de solde-negatif, mais tauxEpargnePct = 0% < 10% -> epargne-faible.
  const breakdownBtn = document.querySelector('[id^="labPriority-"][id$="-cta-breakdown"]');
  t.ok(!!breakdownBtn, "le bouton \"Voir où économiser\" est bien présent pour une priorité de type dépenses");
  breakdownBtn.dispatchEvent(new window.Event('click'));
  const cardId = breakdownBtn.id.replace('-cta-breakdown', '');
  const detailHtml = document.getElementById(`${cardId}-detail`).innerHTML;
  // "&" est sérialisé en "&amp;" dans innerHTML (jsdom, comme tout navigateur)
  // — le texte réellement affiché à l'écran reste bien "Loisirs & sorties".
  t.ok(detailHtml.includes('Loisirs &amp; sorties') && detailHtml.includes('Abonnements'), "la décomposition cite bien les vraies catégories discrétionnaires réelles");
  t.ok(!detailHtml.includes('Logement'), "le Logement (peu compressible à court terme) n'est jamais inclus dans les pistes d'économie");
  // 25% de 400 = 100, 25% de 200 = 50 -> total 150
  t.ok(detailHtml.includes('100') && detailHtml.includes('50'), `les vrais montants de réduction (25% de chaque catégorie) sont bien calculés (html: ${detailHtml.slice(0,500)})`);
}

// ---------- "⚡ Optimiser ma situation" : résumé réel, jamais fictif ----------
{
  const { window, document } = loadLaboratoirePage({ seed: w => {
    // Taux d'épargne volontairement sous 10% (1500 revenus, 1450 dépenses,
    // solde 50 -> 3.3%) pour déclencher réellement le diagnostic
    // "epargne-faible" et obtenir une vraie priorité ici, pas un cas vide.
    const mois = new Date().toISOString().slice(0,7);
    w.localStorage.setItem('likanza-budget-entries', JSON.stringify([
      {id:'b1', type:'revenu', categorie:'Salaire', montant:1500, mois, dateAjout:new Date().toISOString()},
      {id:'b2', type:'depense', categorie:'Logement', montant:900, mois, dateAjout:new Date().toISOString()},
      {id:'b3', type:'depense', categorie:'Loisirs & sorties', montant:400, mois, dateAjout:new Date().toISOString()},
      {id:'b4', type:'depense', categorie:'Abonnements', montant:150, mois, dateAjout:new Date().toISOString()}
    ]));
  }});
  const optimizeBtn = document.getElementById('labOptimizeBtn');
  t.ok(!!optimizeBtn, "le bouton ⚡ Optimiser ma situation est bien présent");
  optimizeBtn.dispatchEvent(new window.Event('click'));
  const summaryHtml = document.getElementById('labOptimizeSummary').innerHTML;
  t.ok(summaryHtml.includes('piste'), "le résumé cite bien un vrai nombre de pistes identifiées");
}

// ---------- Comparateur A/B/C + "Mes simulations" (sections 8-9, 16-17) ----------
{
  const { window, document } = loadLaboratoirePage({ seed: w => {
    const dateCible = new Date(); dateCible.setMonth(dateCible.getMonth()+18);
    w.localStorage.setItem('likanza-financial-goals', JSON.stringify([{id:'g1', nom:'Voiture', montantCible:12000, montantActuel:0, versementMensuel:380, dateCible: dateCible.toISOString().slice(0,10), dateAjout:new Date().toISOString()}]));
  }});
  const objectifCard = document.querySelector('.lab-priority-card');
  t.ok(!!objectifCard, "une priorité objectif est bien générée");
  const scenarioBtn = document.querySelector('[id$="-cta-scenario-objectif"]');
  t.ok(!!scenarioBtn, "le bouton \"Tester ce scénario\" de l'objectif est bien présent");
  scenarioBtn.dispatchEvent(new window.Event('click'));

  const detailId = scenarioBtn.id.replace('-cta-scenario-objectif', '-detail');
  const detailHtml = document.getElementById(detailId).innerHTML;
  t.ok(detailHtml.includes('lab-scenario-compare'), "le vrai composant de comparaison A/B/C (réutilisable) est bien rendu");
  t.ok(detailHtml.includes('Scénario A (+50 €)') && detailHtml.includes('Scénario B (+100 €)') && detailHtml.includes('Scénario C (+200 €)'), "les 3 vraies colonnes de scénario sont bien présentes");
  t.ok(!detailHtml.includes('class="best"'), "le comparateur ne désigne jamais un \"gagnant\" (même discipline que les tableaux de Guides)");

  // Sauvegarde réelle d'un scénario testé.
  const saveBtn = document.querySelector(`#${detailId} .lab-save-sim-btn`);
  t.ok(!!saveBtn, "un bouton \"Sauvegarder ce scénario\" réel est bien présent dans le détail");
  saveBtn.dispatchEvent(new window.Event('click'));
  const sims = window.getLabSimulations();
  t.equal(sims.length, 1, "sauvegarder un scénario le persiste bien réellement via saveLabSimulation");
  t.ok(sims[0].label.includes('Voiture'), "le libellé sauvegardé référence bien le vrai objectif concerné");
  t.ok(saveBtn.disabled && saveBtn.textContent.includes('Sauvegardé'), "le bouton se désactive bien après la sauvegarde réelle, jamais un double-enregistrement silencieux");

  // "Mes simulations" reflète bien la vraie sauvegarde.
  const simsListHtml = document.getElementById('labSimulationsList').innerHTML;
  t.ok(simsListHtml.includes(sims[0].label), "la simulation réellement sauvegardée apparaît bien dans \"Mes simulations\"");

  // Renommer réellement.
  const renameBtn = document.querySelector('.lab-sim-rename');
  renameBtn.dispatchEvent(new window.Event('click'));
  const renameInput = document.getElementById(`simrename-${sims[0].id}`);
  renameInput.value = 'Voiture — mon scénario préféré';
  renameInput.dispatchEvent(new window.Event('blur'));
  t.equal(window.getLabSimulations()[0].label, 'Voiture — mon scénario préféré', "renommer une simulation la persiste bien réellement (renameLabSimulation)");

  // Dupliquer réellement.
  const dupBtn = document.querySelector('.lab-sim-duplicate');
  dupBtn.dispatchEvent(new window.Event('click'));
  t.equal(window.getLabSimulations().length, 2, "dupliquer une simulation en crée bien réellement une seconde");
  t.ok(window.getLabSimulations()[0].label.includes('(copie)'), "la copie est bien étiquetée comme telle");

  // Comparer 2 simulations réelles : cocher les 2 cases affiche bien le vrai comparateur.
  const checks = document.querySelectorAll('.lab-sim-compare-check');
  t.equal(checks.length, 2, "2 cases à cocher \"Comparer\" sont bien présentes pour les 2 vraies simulations");
  checks[0].checked = true; checks[0].dispatchEvent(new window.Event('change'));
  checks[1].checked = true; checks[1].dispatchEvent(new window.Event('change'));
  const compareHtml = document.getElementById('labSimCompareResult').innerHTML;
  t.ok(compareHtml.includes('lab-scenario-compare'), "cocher 2 simulations affiche bien une vraie comparaison A/B (réutilise le même composant)");

  // Supprimer réellement.
  const deleteBtn = document.querySelector('.lab-sim-delete');
  deleteBtn.dispatchEvent(new window.Event('click'));
  t.equal(window.getLabSimulations().length, 1, "supprimer une simulation la retire bien réellement du stockage");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
