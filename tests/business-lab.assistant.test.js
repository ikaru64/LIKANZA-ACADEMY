/* ============================================================
   Laboratoire professionnel (Business Lab) : refonte "assistant de
   décision" (11/09/2026) — miroir de laboratoire.assistant.test.js côté
   Personnel. Réutilise EXACTEMENT le même diagnostic déjà réel
   (computeBusinessDiagnostics, déjà branché sur "Analyser ma situation")
   pour construire "Santé de mon activité" (composite) et "Tes priorités"
   (jusqu'à 3, jamais un second moteur de diagnostic). Les outils déjà
   existants (Unit Economics, Runway, Scénarios & stress-test...) ne sont
   jamais retirés ni dupliqués : chaque priorité renvoie directement vers
   l'outil réel concerné. Couvre aussi le nouveau champ de recherche par
   mots-clés de "J'ai un problème" (décision explicite de l'utilisateur :
   pas de NLU, un simple rapprochement de mots-clés), et l'intake progressif
   à 4 étapes ajouté en polish le 12/09/2026 (miroir de l'intake du
   Laboratoire personnel) : chaque étape sauvegarde directement via
   saveBusinessProfile, le MÊME store que "Mon profil entreprise", jamais
   un store parallèle.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBusinessLabPage } = require('./support/load-page');

const t = createSuite('business-lab.assistant');

// ---------- Sans profil renseigné : les 4 entrées s'affichent, jamais de score/priorités fabriqués ----------
{
  const { document } = loadBusinessLabPage();
  const home = document.getElementById('businessHome');
  t.ok(!!home, 'le conteneur #businessHome existe bien sur business-lab.html');
  t.equal(document.querySelectorAll('#businessHome .lab-entry-card').length, 4, 'les 4 entrées (Comprendre/Résoudre/Tester/Préparer) sont bien affichées');
  t.ok(home.innerHTML.includes('Renseigne d\'abord'), "sans profil renseigné, un message honnête invite à renseigner le profil, jamais un score fabriqué");
  t.ok(!home.innerHTML.includes('lab-health-card'), 'la carte de santé ne doit pas apparaître sans données réelles');

  // Intake progressif (polish 12/09/2026) : sans aucune donnée réelle, le gate s'affiche, jamais le tableau de bord.
  t.equal(document.getElementById('bizIntakeGate').style.display, '', "sans aucune donnée réelle, le gate d'intake est bien visible");
  t.equal(document.getElementById('businessHome').style.display, 'none', "sans aucune donnée réelle, le tableau de bord reste bien masqué derrière le gate");
  const gateHtml = document.getElementById('bizIntakeGate').innerHTML;
  t.ok(gateHtml.includes('Étape 1 / 4') && gateHtml.includes('Ton activité'), "l'étape 1 (activité/CA) est bien affichée en premier");
  t.ok(!gateHtml.includes('Étape 2'), "les autres étapes ne sont pas affichées simultanément (progressif, jamais tous les champs à la fois)");

  // Les sections/outils déjà existants ne sont jamais retirés.
  t.ok(!!document.getElementById('business-profile'), 'la section "Mon profil entreprise" existe toujours');
  t.ok(!!document.getElementById('business-diagnostics'), 'la section "Analyser ma situation" existe toujours');
  t.equal(document.querySelectorAll('#businessLab .play-tile').length, 10, 'les 10 outils du Business Lab existants sont tous bien présents, inchangés');
}

// ---------- Avec un profil réel en déficit + trésorerie tendue + mauvais LTV/CAC : santé + priorités réelles ----------
{
  const seed = (window) => {
    window.localStorage.setItem('likanza-business-profile', JSON.stringify({
      nom: 'Ma Startup', revenueMode: 'manuel', ca: 120000, clients: 0,
      prixUnitaire: 0, volumeAnnuel: 0, panierMoyenAnnuel: 0, nombreAbonnes: 0, prixAbonnementMensuel: 0, produits: [],
      coutsFixesMensuels: 8000, coutsVariablesPct: 50,
      effectif: 2, masseSalarialeMensuelle: 0, budgetMarketingMensuel: 0,
      detteTotale: 0, tresorerieActuelle: 0
    }));
    // CA mensuel 10000, coûts variables 50% -> marge 5000, charges fixes 8000 -> résultat -3000/mois -> resultat-negatif.
    // Burn 3000/mois, trésorerie 0 -> runway 0 mois -> runway-court.
    window.localStorage.setItem('likanza-unit-economics', JSON.stringify({prix: 100, coutDirect: 80, cac: 100, achatsMoyens: 1, chargesFixes: 0}));
    // margeBrute 20, ltv 20, ratioLtvCac 0.2 -> ltv-cac-faible.
  };
  const { window, document } = loadBusinessLabPage({ seed });
  const home = document.getElementById('businessHome');

  t.ok(home.innerHTML.includes('lab-health-card'), 'avec un profil réel renseigné, la carte "Santé de mon activité" est bien affichée');
  const scoreMatch = home.innerHTML.match(/lab-health-score"[^>]*>(\d+) \/ 100/);
  t.ok(!!scoreMatch, 'un score composite chiffré est bien affiché (pas juste des tirets)');
  if(scoreMatch){
    const score = +scoreMatch[1];
    t.ok(score >= 0 && score <= 100, `le score composite (${score}) est bien compris entre 0 et 100`);
  }
  t.ok(home.innerHTML.includes("Santé de l'activité"), 'le libellé est bien "Santé de l\'activité", jamais "Santé financière" (distinct du Laboratoire personnel)');

  const priorityCards = document.querySelectorAll('#businessHome .lab-priority-card');
  t.ok(priorityCards.length >= 1 && priorityCards.length <= 3, `entre 1 et 3 priorités sont affichées (obtenu : ${priorityCards.length})`);
  t.ok(home.innerHTML.includes('Repasser en résultat positif') || home.innerHTML.includes('résultat positif'.normalize()), 'la priorité "résultat négatif" est bien remontée avec un titre pédagogique');
  t.ok(home.innerHTML.includes('trésorerie') || home.innerHTML.includes('Sécuriser'), 'la priorité "runway court" est bien remontée');

  // Vocabulaire hedgé : jamais une injonction du type "fais ceci"/"vends"/"licencie".
  const forbiddenWords = ['fais ceci', 'vends immédiatement', 'licencie', 'dois absolument'];
  forbiddenWords.forEach(w => t.ok(!home.innerHTML.toLowerCase().includes(w), `le mot-clé impératif "${w}" n'apparaît jamais dans les priorités Business`));

  // Cliquer sur le CTA d'une priorité ouvre bien le VRAI outil correspondant (Scénarios & stress-test ou Runway), jamais un calcul dupliqué.
  const ctaBtn = document.getElementById('bizPriority-0-cta');
  t.ok(!!ctaBtn, 'le bouton CTA de la 1ère priorité existe bien');
  if(ctaBtn){
    ctaBtn.dispatchEvent(new window.Event('click'));
    const sessionHtml = document.getElementById('businessLab-session').innerHTML;
    t.ok(sessionHtml.length > 0, "cliquer sur le CTA d'une priorité ouvre bien un vrai outil du Business Lab (session non vide)");
  }
}

// ---------- « J'ai un problème » : recherche par mots-clés (décision explicite : keyword-match, pas de NLU) ----------
{
  const { window, document } = loadBusinessLabPage();
  const grid = document.getElementById('businessProblems-grid');
  t.ok(!!grid, 'la grille de problèmes a bien un id dédié pour être re-rendue par la recherche');
  t.equal(grid.querySelectorAll('[data-problem]').length, 10, 'sans recherche, les 10 problèmes réels sont tous affichés');

  const searchInput = document.getElementById('businessProblems-search');
  t.ok(!!searchInput, 'le champ de recherche libre "Décris ton problème" existe bien');

  searchInput.value = 'prix';
  searchInput.dispatchEvent(new window.Event('input'));
  const filtered = Array.from(grid.querySelectorAll('[data-problem]')).map(b => b.dataset.problem);
  t.ok(filtered.includes('prix-mal-calibre'), 'chercher "prix" fait bien remonter le problème "Mon prix est peut-être mal calibré"');
  t.ok(filtered.length < 10, 'la recherche filtre bien la liste, jamais en affichant systématiquement les 10 problèmes');

  searchInput.value = 'xyzxyzxyz';
  searchInput.dispatchEvent(new window.Event('input'));
  t.ok(grid.innerHTML.includes('Aucun problème'), "une recherche sans correspondance affiche un message honnête, jamais une liste vide silencieuse ni un problème inventé");

  searchInput.value = '';
  searchInput.dispatchEvent(new window.Event('input'));
  t.equal(grid.querySelectorAll('[data-problem]').length, 10, 'vider la recherche réaffiche bien les 10 problèmes');
}

// ---------- Parcours complet de l'intake (4 étapes réelles, avec de vraies valeurs saisies) ----------
{
  const { window, document } = loadBusinessLabPage();

  // Étape 1 : activité (nom + CA)
  document.getElementById('bizIntakeNom').value = 'Ma Startup Test';
  document.getElementById('bizIntakeCA').value = '120000';
  document.getElementById('intakeNext').dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('bizIntakeGate').innerHTML.includes('Étape 2 / 4'), "après l'étape 1, on passe bien réellement à l'étape 2");
  t.equal(window.getBusinessProfile().ca, 120000, "le CA saisi à l'étape 1 est bien persisté immédiatement via saveBusinessProfile (même store que \"Mon profil entreprise\")");

  // Étape 2 : coûts
  document.getElementById('bizIntakeFixes').value = '8000';
  document.getElementById('bizIntakeVariables').value = '50';
  document.getElementById('intakeNext').dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('bizIntakeGate').innerHTML.includes('Étape 3 / 4'), "après l'étape 2, on passe bien réellement à l'étape 3");

  // Étape 3 : équipe (skip volontaire — un skip n'écrit rien pour cette étape, mais avance bien)
  document.getElementById('intakeSkip').dispatchEvent(new window.Event('click'));
  t.ok(document.getElementById('bizIntakeGate').innerHTML.includes('Étape 4 / 4'), "après avoir passé l'étape 3, on avance bien réellement à l'étape 4");
  t.equal(window.getBusinessProfile().effectif, 0, "passer l'étape 3 n'écrit bien aucune valeur fabriquée pour l'effectif");

  // Étape 4 : trésorerie — dernière étape, termine l'intake
  document.getElementById('bizIntakeTresorerie').value = '0';
  document.getElementById('intakeNext').dispatchEvent(new window.Event('click'));

  // Fin de l'intake : le gate disparaît, le tableau de bord (Santé + priorités) apparaît, avec les VRAIES données saisies.
  t.equal(document.getElementById('bizIntakeGate').style.display, 'none', "l'intake terminé, le gate disparaît bien");
  t.equal(document.getElementById('businessHome').style.display, '', "l'intake terminé, le tableau de bord apparaît bien");
  const homeHtml = document.getElementById('businessHome').innerHTML;
  t.ok(homeHtml.includes('lab-health-card'), "le tableau de bord affiche bien la carte \"Santé de l'activité\" avec les données de l'intake");
  t.ok(homeHtml.includes('résultat positif') || homeHtml.includes('trésorerie'), "une priorité réelle (résultat négatif au vu du CA/coûts saisis) est bien remontée à partir des données de l'intake");

  // "Mon profil entreprise" (le formulaire complet) reflète bien les mêmes données, jamais un second état divergent.
  t.equal(document.getElementById('companyProfile-ca').value, '120000', "\"Mon profil entreprise\" est bien rafraîchi avec le CA saisi pendant l'intake, jamais un formulaire resté périmé");
  t.equal(document.getElementById('companyProfile-coutsFixesMensuels').value, '8000', "\"Mon profil entreprise\" reflète bien aussi les coûts fixes saisis pendant l'intake");
}

// ---------- "Mes simulations" : un scénario sauvegardé côté Business rejoint le MÊME store que le Laboratoire personnel ----------
{
  const { window, document } = loadBusinessLabPage();
  // Renseigne un profil réel pour que "Scénarios & stress-test" ait une base non nulle à décaler.
  window.saveBusinessProfile({ca: 120000, coutsFixesMensuels: 5000, coutsVariablesPct: 30, tresorerieActuelle: 10000});

  document.getElementById('businessLab-scenarios').dispatchEvent(new window.Event('click'));
  const sessionSel = 'businessLab-session-scenarios';
  t.ok(!!document.getElementById(sessionSel), 'ouvrir "Scénarios & stress-test" affiche bien le vrai outil dans la session');

  document.getElementById(`${sessionSel}-caDelta`).value = '-20';
  document.getElementById(`${sessionSel}-caDelta`).dispatchEvent(new window.Event('input'));
  document.getElementById(`${sessionSel}-scenarioNom`).value = 'Perte gros client';
  document.getElementById(`${sessionSel}-scenarioSave`).dispatchEvent(new window.Event('click'));

  const sims = window.getLabSimulations();
  t.ok(sims.some(s => s.label === 'Perte gros client' && s.type === 'business-scenario'), 'le scénario Business sauvegardé rejoint bien le store PARTAGÉ (getLabSimulations), pas un store isolé');
  t.ok(!!sims.find(s => s.label === 'Perte gros client').resultLabel.includes('Résultat mensuel'), 'le scénario sauvegardé porte bien un résultat chiffré, jamais un libellé vide');

  const bizListHtml = document.getElementById('bizSimulationsList').innerHTML;
  t.ok(bizListHtml.includes('Perte gros client'), '"Mes simulations" côté Business affiche bien le scénario tout juste sauvegardé');

  // La comparaison réutilise le même composant générique que côté Personnel (jamais un second tableau ad hoc).
  window.saveLabSimulation({type: 'business-scenario', label: 'Second scénario', resultLabel: 'Résultat mensuel : +100 € (contre +50 € actuellement).'});
  // Simule une simulation ajoutée ailleurs (ex. depuis le Laboratoire personnel, même store) :
  // redéclenche le rendu pour la voir apparaître ici aussi.
  window.renderBizSimulationsList();
  const listEl = document.getElementById('bizSimulationsList');
  const checks = listEl.querySelectorAll('.biz-sim-compare-check');
  t.ok(checks.length >= 2, "au moins 2 cases à cocher \"Comparer\" sont bien présentes pour les 2 simulations");
  checks[0].checked = true; checks[0].dispatchEvent(new window.Event('change'));
  checks[1].checked = true; checks[1].dispatchEvent(new window.Event('change'));
  const compareHtml = document.getElementById('bizSimCompareResult').innerHTML;
  t.ok(compareHtml.includes('lab-scenario-compare'), 'cocher 2 simulations affiche bien le MÊME comparateur générique (renderLabScenarioCompareTable) que côté Personnel');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
