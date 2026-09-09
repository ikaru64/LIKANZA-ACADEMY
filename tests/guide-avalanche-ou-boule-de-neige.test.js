/* ============================================================
   Guides & Décryptages, nouveau guide "Avalanche ou boule de neige ?"
   (09/09/2026) — Lab-bridge RÉEL vers widget-debt-strategy
   (computeDebtPayoffPlan/renderDebtPayoffComparison, laboratoire.js,
   tab-dettes), sur le même motif que les ponts DCA et Acheter-ou-louer déjà
   en prod (clé de contexte propre au guide, jamais la clé générique).
   Écrit avec le harnais jsdom (tests/support/load-page.js) plutôt que le
   mock eval ad hoc du scratchpad : le widget lit ses lignes de crédits via
   un vrai querySelectorAll (readRows()), que le mock ad hoc ne peut pas
   simuler (retourne toujours []) — jsdom donne un DOM réel, donc un test
   de bout en bout authentique plutôt qu'un test qui ne vérifierait que le
   pont sans jamais exercer le vrai calcul en aval.

   GUIDES/SEARCH_INDEX/LIBRARY/COURS_CATALOG/GUIDE_AVALANCHE_OU_BOULE_DE_NEIGE
   sont tous des `const` de premier niveau dans les vrais scripts de la page
   -> invisibles via window.xxx (seules les déclarations `function` le sont).
   Lus via runInPage(), qui exécute dans la même portée partagée que les
   scripts injectés.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadPage, loadLaboratoirePage } = require('./support/load-page');

const t = createSuite('guide-avalanche-ou-boule-de-neige');
const GUIDE_LOCAL_SCRIPTS = ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/historical-data.js', 'scripts/guides-data.js', 'scripts/pages/guide-avalanche-ou-boule-de-neige.js'];
function loadGuidePage(options){ return loadPage('guide-avalanche-ou-boule-de-neige.html', GUIDE_LOCAL_SCRIPTS, options); }

// ---------- Rendu du guide seul (structure éditoriale, faits, sources, cours lié) ----------
{
  const { document, runInPage } = loadGuidePage();
  const html = document.getElementById('guideContent').innerHTML;
  const data = runInPage(`window.__r = {
    guide: GUIDE_AVALANCHE_OU_BOULE_DE_NEIGE,
    guidesHasIt: GUIDES.some(g => g.slug === 'avalanche-ou-boule-de-neige'),
    hasSimulation: getGuideBySlug('avalanche-ou-boule-de-neige') && getGuideBySlug('avalanche-ou-boule-de-neige').hasSimulation,
    searchHasIt: SEARCH_INDEX.some(e => e.type === 'Guide' && e.url === 'guide-avalanche-ou-boule-de-neige.html'),
    libraryTerms: LIBRARY.map(l => l.terme),
    budgetSecuriteCourse: COURS_CATALOG.find(c => c.id === 'budget-securite')
  };`);
  const GUIDE = data.guide;

  t.ok(data.guidesHasIt, "GUIDES référence bien le nouveau guide");
  t.equal(data.hasSimulation, true, "l'index déclare bien hasSimulation:true (comparateur réel widget-debt-strategy)");
  t.ok(data.searchHasIt, "SEARCH_INDEX indexe bien le nouveau guide");

  t.ok(html.includes(GUIDE.title), "le vrai titre du guide est bien affiché");
  t.ok(html.indexOf(GUIDE.shortAnswer) < html.indexOf('compare-table'), "la réponse courte précède bien le tableau comparatif");
  t.ok(html.includes('compare-table') && !html.includes('class="best"'), "le tableau comparatif ne désigne jamais un gagnant");
  t.ok(html.includes('guide-diagram-flow'), "le schéma causal (concentrer, jamais disperser) est bien rendu");
  t.ok(html.includes("n'y a pas de vraie raison"), "le bloc mythe/réalité est bien rendu");
  t.ok(html.includes('Pénalités de remboursement anticipé'), "le bloc risques est bien rendu, y compris la pénalité de remboursement anticipé");
  t.ok(html.includes('glossary-item'), "la FAQ est bien rendue (accordéon réutilisé)");
  t.ok(html.includes('Kettle') && html.includes('Journal of Consumer Research'), "l'étude académique réelle est bien citée avec ses auteurs");
  t.ok(html.includes("ne compare pas directement l'avalanche à la boule de neige"), "la nuance sur ce que l'étude prouve VRAIMENT est bien présente (jamais surinterprétée)");

  GUIDE.concepts.forEach(terme => {
    t.ok(data.libraryTerms.includes(terme), `le concept "${terme}" cité par le guide existe bien réellement dans LIBRARY`);
  });
  t.ok(!!data.budgetSecuriteCourse, "le cours budget-securite existe bien réellement");
  t.ok((data.budgetSecuriteCourse.chapitres || []).some(ch => ch.titre === GUIDE.relatedCourse.chapitre), "le chapitre \"Ta valeur nette\" cité existe bien réellement dans ce cours");
  t.ok(html.includes('🎓 Voir le cours'), "le lien vers le vrai cours associé est bien rendu");
  t.ok(html.includes('nfcc.org') && html.includes('fidelity.com'), "les 2 sources institutionnelles réelles sont bien citées");

  t.ok(html.includes('Comparer les deux stratégies sur mes crédits'), "le bloc simulationCTA réel est bien rendu");
  t.ok(html.includes('Mensualité supplémentaire'), "le seul champ pertinent (mensualité supplémentaire) est bien proposé, jamais le formulaire entier du widget (crédits, taux...)");

  const pageHtml = require('fs').readFileSync(require('path').join(require('./support/load-page').ROOT, 'guide-avalanche-ou-boule-de-neige.html'), 'utf8');
  t.ok(pageHtml.includes('<title>Avalanche ou boule de neige ?'), "la page a bien un titre unique et spécifique");
  t.ok(!/<h1[^>]*>/.test(pageHtml.replace(/<!--[\s\S]*?-->/g, '')), "la page statique n'a bien aucun <h1> propre (même motif que les guides précédents)");
}

// ---------- ÉTAPE 1 — Clic réel sur "Simuler" avec une vraie valeur saisie ----------
{
  const { window, document } = loadGuidePage();
  const input = document.getElementById('guide-block-10-extraMonthly');
  t.ok(!!input, "Étape 1 — le champ mensualité supplémentaire du bloc simulationCTA existe bien");
  input.value = '150';
  const btn = document.getElementById('guide-block-10-cta');
  t.ok(!!btn, "Étape 1 — le bouton Simuler existe bien");
  btn.dispatchEvent(new window.Event('click'));

  const written = JSON.parse(window.localStorage.getItem('likanza-context-guide-simulation-avalanche-ou-boule-de-neige'));
  t.equal(written.extraMonthly, 150, "Étape 1 — le contexte transmet bien la VRAIE valeur saisie, jamais une valeur par défaut fabriquée");
  t.equal(written.guideSlug, 'avalanche-ou-boule-de-neige', "Étape 1 — le contexte identifie bien le vrai guide d'origine");
  t.ok(window.localStorage.getItem('likanza-context-guide-simulation-dca-ou-lump-sum') === null, "Étape 1 — aucune écriture parasite sur la clé de contexte du guide DCA (clés bien séparées)");
  t.ok(window.localStorage.getItem('likanza-context-guide-simulation-acheter-ou-louer') === null, "Étape 1 — aucune écriture parasite sur la clé de contexte du guide Acheter-ou-louer non plus");

  // ---------- ÉTAPE 2 — "Navigation" vers laboratoire.html : préremplissage réel ----------
  const savedContext = window.localStorage.getItem('likanza-context-guide-simulation-avalanche-ou-boule-de-neige');
  const lab = loadLaboratoirePage({seed: w => {
    w.localStorage.setItem('likanza-context-guide-simulation-avalanche-ou-boule-de-neige', savedContext);
  }});

  t.equal(lab.document.getElementById('debtExtra').value, '150', "Étape 2 — la mensualité supplémentaire réelle est bien préremplie sur le widget avalanche/boule de neige");
  t.ok(lab.document.getElementById('widget-debt-strategy').style.display !== 'none', "Étape 2 — le bon widget (avalanche/boule de neige) est bien ouvert automatiquement (jamais masqué)");
  t.equal(lab.document.getElementById('widget-debt-consolidation').style.display, 'none', "Étape 2 — le widget voisin (regroupement de crédits) reste bien masqué, seul le bon widget s'ouvre");
  const banner = lab.document.getElementById('debtStrategyGuideContext').innerHTML;
  t.ok(banner.includes('Simulation liée au guide') && banner.length > 0, "Étape 2 — la bannière contextuelle est bien rendue");
  t.ok(banner.includes('guide-avalanche-ou-boule-de-neige.html'), "Étape 2 — le lien de retour pointe bien vers la vraie page du guide");
  // Le widget DCA, sur la même page, ne doit jamais être affecté.
  t.equal(lab.document.getElementById('dcaGuideContext').innerHTML.trim(), '', "Étape 2 — le widget DCA, sur la même page, n'est jamais affecté par ce contexte");

  // consumeContext écrit littéralement null via safeSetJSON (jamais un vrai
  // removeItem) -> getItem renvoie la CHAÎNE "null", pas la valeur null.
  const consumedValue = lab.window.localStorage.getItem('likanza-context-guide-simulation-avalanche-ou-boule-de-neige');
  t.ok(consumedValue === 'null' || !consumedValue, "Étape 2 — le contexte est bien supprimé après lecture (usage unique)");

  // Le calcul réel en aval reflète bien la mensualité supplémentaire transmise
  // (2 crédits par défaut du widget : 2000€/19% et 6000€/5% — un vrai
  // querySelectorAll jsdom, contrairement au mock ad hoc du scratchpad qui
  // aurait toujours renvoyé une liste vide ici).
  const output = lab.document.getElementById('debtStrategyOutput').innerHTML;
  t.ok(output.includes('Comparaison calculée') && output.includes('150'), "Étape 2 — le calcul en aval reflète bien la vraie mensualité supplémentaire transmise (150€/mois), pas seulement le préremplissage du champ");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
