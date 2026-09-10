/* ============================================================
   Guides & Décryptages, nouveau guide "Comment savoir si une action est
   chère ?" (10/09/2026) — 6e guide, premier de la catégorie "decider"
   (Marchés & décisions), premier qui n'est pas une comparaison binaire
   "X ou Y". Sans simulationCTA (aucun calculateur de valorisation dans le
   Laboratoire) : le pont "pratique" est un relatedCourse vers le vrai
   chapitre PER de bourse-actions, donc pas d'étape Lab-bridge à tester ici
   (contrairement à tests/guide-avalanche-ou-boule-de-neige.test.js).
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadPage } = require('./support/load-page');

const t = createSuite('guide-action-chere');
const GUIDE_LOCAL_SCRIPTS = ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/historical-data.js', 'scripts/guides-data.js', 'scripts/pages/guide-action-chere.js'];
function loadGuidePage(options){ return loadPage('guide-action-chere.html', GUIDE_LOCAL_SCRIPTS, options); }

{
  const { document, runInPage } = loadGuidePage();
  const html = document.getElementById('guideContent').innerHTML;
  const data = runInPage(`window.__r = {
    guide: GUIDE_ACTION_CHERE,
    guidesEntry: GUIDES.find(g => g.slug === 'action-chere'),
    searchHasIt: SEARCH_INDEX.some(e => e.type === 'Guide' && e.url === 'guide-action-chere.html'),
    libraryTerms: LIBRARY.map(l => l.terme),
    bourseActionsCourse: COURS_CATALOG.find(c => c.id === 'bourse-actions'),
    hasRealDefiCategory: (typeof QUIZ_BANK_FULL !== 'undefined' && QUIZ_BANK_FULL.some(q => q.categorie === 'Actions')) || (typeof MENTAL_CHALLENGES !== 'undefined' && MENTAL_CHALLENGES.some(q => q.categorie === 'Actions'))
  };`);
  const GUIDE = data.guide;

  t.ok(!!data.guidesEntry, "GUIDES référence bien le nouveau guide");
  t.equal(data.guidesEntry.category, 'decider', "classé dans la catégorie 'decider' (Marchés & décisions), une catégorie jusque-là vide");
  t.equal(data.guidesEntry.hasSimulation, false, "l'index déclare honnêtement hasSimulation:false (aucun calculateur de valorisation dans le Laboratoire)");
  t.ok(data.searchHasIt, "SEARCH_INDEX indexe bien le nouveau guide");
  t.ok(Array.isArray(data.guidesEntry.concepts) && data.guidesEntry.concepts.length > 0, "l'index léger porte bien concepts[] (pour findArticleGuideLink depuis Actualités)");

  t.ok(html.includes(GUIDE.title), "le vrai titre du guide est bien affiché");
  t.ok(html.indexOf(GUIDE.shortAnswer) < html.indexOf('guide-diagram-flow'), "la réponse courte précède bien le schéma étape par étape");
  t.ok(html.includes('guide-diagram-flow'), "le schéma \"le bon réflexe, étape par étape\" est bien rendu");
  t.ok(html.includes('compare-table') && !html.includes('class="best"'), "le tableau comparatif (2 profils illustratifs) ne désigne jamais un gagnant");
  t.ok(html.includes('Profil A') && html.includes('Profil B'), "les 2 profils illustratifs sont bien nommés comme tels, jamais présentés comme 2 entreprises réelles");
  t.ok(html.includes("bas veut dire que l'action est une bonne affaire"), "le bloc mythe/réalité est bien rendu");
  t.ok(html.includes('structure financière') || html.includes('endettement important'), "le bloc risques cite bien la distorsion par l'endettement (point vérifié sur vernimmen.net)");
  t.ok(html.includes('résultat exceptionnel'), "le bloc risques cite bien la distorsion par un résultat exceptionnel (point vérifié sur legifiscal.fr)");
  t.ok(html.includes('glossary-item'), "la FAQ est bien rendue (accordéon réutilisé)");
  t.ok(html.includes('vernimmen.net') || html.includes('Vernimmen'), "la source Vernimmen (référence académique française de finance d'entreprise) est bien citée");
  t.ok(html.includes('legifiscal.fr') || html.includes('LégiFiscal'), "la source LégiFiscal est bien citée");
  t.ok(!html.includes('simulationCTA') && !html.includes('Passer de la théorie à la pratique'), "aucun bloc simulationCTA fabriqué (cohérent avec hasSimulation:false)");

  GUIDE.concepts.forEach(terme => {
    t.ok(data.libraryTerms.includes(terme), `le concept "${terme}" cité par le guide existe bien réellement dans LIBRARY`);
  });
  t.ok(!!data.bourseActionsCourse, "le cours bourse-actions existe bien réellement");
  t.ok((data.bourseActionsCourse.chapitres || []).some(ch => ch.titre === GUIDE.relatedCourse.chapitre), "le chapitre PER cité existe bien réellement dans ce cours (correspondance exacte de titre)");
  t.ok(html.includes('🎓 Voir le cours') && html.includes('chapitre'), "le lien vers le vrai chapitre du cours associé est bien rendu, adressé au bon chapitre");
  t.ok(data.hasRealDefiCategory, "relatedDefiCategory ('Actions') correspond bien à une vraie catégorie de défi existante");
  t.ok(html.includes('Teste si tu as compris') && html.includes('cat=Actions'), "le lien vers un vrai défi 'Actions' est bien rendu");

  const pageHtml = require('fs').readFileSync(require('path').join(require('./support/load-page').ROOT, 'guide-action-chere.html'), 'utf8');
  t.ok(pageHtml.includes('<title>Comment savoir si une action est chère ?'), "la page a bien un titre unique et spécifique");
  t.ok(!/<h1[^>]*>/.test(pageHtml.replace(/<!--[\s\S]*?-->/g, '')), "la page statique n'a bien aucun <h1> propre (même motif que les guides précédents)");
  t.ok(pageHtml.includes('rel="canonical"'), "la page a bien un rel=canonical (discipline SEO du sprint de consolidation)");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
