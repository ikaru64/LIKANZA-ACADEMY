/* ============================================================
   Bibliothèque : refonte visuelle premium (11/09/2026) — conserve la
   logique existante (LIBRARY, recherche, 3 niveaux, navigation univers ->
   notions, liens profonds), ajoute des stats/historique/tri/panneau
   réellement calculés (jamais fabriqués). Écrit avec le harnais jsdom
   (tests/support/load-page.js) pour un vrai DOM, un vrai querySelectorAll,
   et éviter le piège de scoping des `let` de module (voir
   feedback_node_test_harness_gotchas) en pilotant les vrais clics.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadPage } = require('./support/load-page');

const t = createSuite('bibliotheque');
const BIBLIOTHEQUE_LOCAL_SCRIPTS = ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/historical-data.js', 'scripts/pages/bibliotheque.js'];
function loadBibliothequePage(options){ return loadPage('bibliotheque.html', BIBLIOTHEQUE_LOCAL_SCRIPTS, options); }

// ---------- Rendu initial : stats réelles, univers réels, aucune donnée fabriquée ----------
{
  const { document, runInPage } = loadBibliothequePage();
  const data = runInPage(`window.__r = {
    stats: computeLibraryStats(),
    libraryLength: LIBRARY.length,
    univers: [...new Set(LIBRARY.map(l => l.categorie))],
    visualKeys: Object.keys(LIBRARY_CATEGORY_VISUALS)
  };`);

  t.equal(data.stats.total, 262, "computeLibraryStats().total correspond bien au vrai compte LIBRARY.length");
  t.equal(data.stats.univers, 14, "computeLibraryStats().univers correspond bien au vrai nombre de catégories distinctes");
  t.equal(data.stats.maitrisees, 0, "sans aucune activité quiz réelle, 0 notion maîtrisée (jamais un chiffre fabriqué)");
  t.equal(data.stats.aRevoir, 0, "sans aucune activité réelle, 0 notion à revoir");
  t.equal(data.stats.recommandees, 0, "sans aucune activité réelle, 0 notion recommandée");

  data.univers.forEach(cat => {
    t.ok(data.visualKeys.includes(cat), `l'univers réel "${cat}" a bien une entrée dans LIBRARY_CATEGORY_VISUALS (jamais un univers réel sans traitement visuel)`);
  });
  t.equal(data.visualKeys.length, data.univers.length, "LIBRARY_CATEGORY_VISUALS ne contient ni plus ni moins que les vrais univers de LIBRARY (jamais un univers fantôme)");

  const statsHtml = document.getElementById('libStats').innerHTML;
  t.ok(statsHtml.includes('262'), "la vraie stat 'Notions' (262) est bien affichée");
  t.ok(statsHtml.includes('>14<') || statsHtml.includes('14'), "la vraie stat 'Univers' (14) est bien affichée");

  const universHtml = document.getElementById('ktThemes').innerHTML;
  data.univers.forEach(cat => t.ok(universHtml.includes(cat), `l'univers réel "${cat}" apparaît bien dans la grille`));
  t.ok(!universHtml.includes('#F1E9D4'), "l'ancienne couleur crème codée en dur n'apparaît plus (identité noir & or)");

  const h1s = document.querySelectorAll('h1');
  t.equal(h1s.length, 1, "un seul vrai <h1> visible, jamais visually-hidden ni dupliqué");
  t.equal(h1s[0].textContent.trim(), 'Bibliothèque Likanza Academy', "le h1 réel porte bien le vrai titre");
}

// ---------- "Continuer votre apprentissage" : masqué sans historique réel, affiché après une vraie visite ----------
{
  const { document } = loadBibliothequePage();
  t.equal(document.getElementById('libContinueSection').style.display, 'none', "sans aucune visite réelle, la section 'Continuer' reste bien masquée (jamais un système de progression fictif)");

  // Ouvre une vraie notion (clic réel sur un univers puis sur une carte de notion).
  const firstTheme = document.querySelector('.lib-univers-card');
  t.ok(!!firstTheme, "au moins un univers réel est cliquable");
  firstTheme.dispatchEvent(new (document.defaultView.Event)('click', {bubbles:true}));
  const firstLeafHead = document.querySelector('.kt-leaf-head');
  t.ok(!!firstLeafHead, "au moins une notion réelle est affichée après avoir ouvert un univers");
  const openedTerme = firstLeafHead.dataset.terme;
  firstLeafHead.dispatchEvent(new (document.defaultView.Event)('click', {bubbles:true}));

  const visitsRaw = document.defaultView.localStorage.getItem('likanza-library-visits');
  t.ok(!!visitsRaw && JSON.parse(visitsRaw).some(v => v.terme === openedTerme), "ouvrir une vraie carte de notion enregistre bien une vraie visite (recordLibraryVisit)");
}

// ---------- Tri des univers : uniquement des tris réels, jamais "Popularité" ----------
{
  const { document } = loadBibliothequePage();
  const sortHtml = document.getElementById('libSort').innerHTML;
  t.ok(sortHtml.includes('A → Z') && sortHtml.includes('Nombre de notions') && sortHtml.includes('Progression'), "les 3 tris réellement compatibles sont bien proposés");
  t.ok(!sortHtml.toLowerCase().includes('popularité'), "\"Popularité\" n'est jamais proposé : aucune donnée d'usage agrégée entre utilisateurs n'existe sur ce site statique");

  const select = document.getElementById('libSortSelect');
  select.value = 'count';
  select.dispatchEvent(new (document.defaultView.Event)('change', {bubbles:true}));
  const cardsAfterSort = Array.from(document.querySelectorAll('.lib-univers-card')).map(c => c.dataset.theme);
  t.ok(cardsAfterSort.length === 14, "les 14 univers réels restent tous présents après un changement de tri");
}

// ---------- Recherche : suggestions réelles cliquables, état vide honnête ----------
{
  const { document } = loadBibliothequePage();
  const suggestionsHtml = document.getElementById('libSuggestions').innerHTML;
  ['PER', 'ETF', 'Dividende', 'Inflation'].forEach(s => t.ok(suggestionsHtml.includes(`>${s}<`), `la suggestion réelle "${s}" est bien rendue`));

  const suggestBtn = document.querySelector('[data-suggest="ETF"]');
  t.ok(!!suggestBtn, "le bouton de suggestion ETF existe bien");
  suggestBtn.dispatchEvent(new (document.defaultView.Event)('click', {bubbles:true}));
  t.equal(document.getElementById('libSearch').value, 'ETF', "cliquer une suggestion remplit bien la vraie recherche avec le vrai mot-clé");
  const leavesHtml = document.getElementById('ktLeaves').innerHTML;
  t.ok(leavesHtml.includes('kt-leaf-card'), "la recherche déclenchée par la suggestion retourne bien de vrais résultats");

  document.getElementById('libSearch').value = 'zzz-terme-qui-nexiste-pas-zzz';
  document.getElementById('libSearch').dispatchEvent(new (document.defaultView.Event)('input', {bubbles:true}));
  const emptyHtml = document.getElementById('ktLeaves').innerHTML;
  t.ok(emptyHtml.includes('Aucune notion trouvée') && emptyHtml.includes('Essayez un terme plus général'), "une recherche sans résultat affiche bien un état vide honnête, jamais une zone blanche");
}

// ---------- Panneau latéral "Votre parcours" + "Carte du savoir" ----------
{
  const { document, runInPage } = loadBibliothequePage();
  const data = runInPage(`window.__r = {niveau: getLevel(), label: DOMAIN_LEVEL_LABELS[getLevel()]};`);
  const sideHtml = document.getElementById('libSide').innerHTML;
  t.ok(sideHtml.includes('Votre parcours'), "le panneau 'Votre parcours' est bien rendu");
  t.ok(sideHtml.includes(data.label), `le vrai niveau déclaré (${data.label}) est bien affiché, pas un niveau fabriqué`);
  t.ok(sideHtml.includes('0 / 262 notions consultées'), "sans aucune visite réelle, affiche bien 0/262, jamais un nombre inventé");
  t.ok(sideHtml.includes('Carte du savoir') && sideHtml.includes('<svg'), "la Carte du savoir est bien un vrai SVG généré, jamais une image contenant du texte");
  t.ok(sideHtml.includes('14 univers') && sideHtml.includes('262 notions'), "la Carte du savoir cite bien les vrais totaux");
}

// ---------- Liens profonds (deep links) préservés ----------
{
  const { document } = loadBibliothequePage({ seed: w => { w.location.hash = '#theme:Crypto'; } });
  // Le hash doit ouvrir directement l'univers Crypto (jamais la grille générale).
  const leavesVisible = document.getElementById('ktLeaves').style.display !== 'none';
  t.ok(leavesVisible, "un lien profond #theme:Crypto ouvre bien directement les notions de cet univers");
  const crumbHtml = document.getElementById('ktBreadcrumb').innerHTML;
  t.ok(crumbHtml.includes('Crypto'), "le fil d'ariane confirme bien le vrai univers ouvert par le lien profond");
}

// ---------- Chantier K (refonte continuité UX, 12/09/2026) : une fiche de terme propose bien une action de suite ----------
{
  const { document } = loadBibliothequePage({ seed: w => { w.location.hash = '#theme:Crypto'; } });
  const leafCards = document.querySelectorAll('#ktLeaves .kt-leaf-card');
  t.ok(leafCards.length > 0, "au moins une fiche de terme est bien rendue pour cet univers");
  const firstNextStep = leafCards[0].querySelector('[id^="nextstep-"]');
  t.ok(!!firstNextStep, "chaque fiche de terme a bien un conteneur de prochaine étape (renderNextStepCard)");
  t.ok(firstNextStep.innerHTML.length > 0, "renderNextStepCard produit bien un contenu réel, jamais un conteneur resté vide");
  t.ok(firstNextStep.innerHTML.includes('Prochaine étape') || firstNextStep.innerHTML.includes('parcours'), "le contenu ressemble bien à une vraie proposition d'action de suite (même composant que Formations/Simulations)");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
