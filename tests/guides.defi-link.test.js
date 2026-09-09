/* ============================================================
   Pont Guide -> Défi ("Teste si tu as compris", sprint de consolidation
   09/09/2026, section 43 du prompt d'origine) : guide.relatedDefiCategory
   ne s'affiche QUE si une vraie question de QUIZ_BANK_FULL/MENTAL_CHALLENGES
   porte cette catégorie exacte — jamais un lien vers une catégorie vide ou
   fabriquée. Réutilise le support ?cat= déjà réel de defis.html (même motif
   que actualites.html?cat=/formations.html), jamais un nouveau filtre.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadPage } = require('./support/load-page');

const t = createSuite('guides.defi-link');

const GUIDES = [
  {file: 'guide-dca-ou-lump-sum.html', script: 'scripts/pages/guide-dca-ou-lump-sum.js', category: 'Risque et volatilité'},
  {file: 'guide-pea-ou-cto.html', script: 'scripts/pages/guide-pea-ou-cto.js', category: 'PEA'},
  {file: 'guide-etf-ou-stock-picking.html', script: 'scripts/pages/guide-etf-ou-stock-picking.js', category: 'ETF'},
  {file: 'guide-acheter-ou-louer.html', script: 'scripts/pages/guide-acheter-ou-louer.js', category: 'Immobilier'},
  {file: 'guide-avalanche-ou-boule-de-neige.html', script: 'scripts/pages/guide-avalanche-ou-boule-de-neige.js', category: 'Crédit'}
];

GUIDES.forEach(g => {
  const { document, runInPage } = loadPage(g.file, ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/historical-data.js', 'scripts/guides-data.js', g.script]);
  const html = document.getElementById('guideContent').innerHTML;
  t.ok(html.includes('Teste si tu as compris'), `${g.file} : le bloc "Teste si tu as compris" est bien rendu`);
  t.ok(html.includes(`defis.html?cat=${encodeURIComponent(g.category)}`), `${g.file} : le lien pointe bien vers la vraie catégorie "${g.category}" via le support ?cat= déjà réel de defis.html`);

  // Vérifie que la catégorie citée correspond bien à de VRAIES questions
  // (jamais une catégorie fabriquée qui renverrait une liste vide).
  const realCount = runInPage(`window.__r = QUIZ_BANK_FULL.filter(q => q.categorie === ${JSON.stringify(g.category)}).length + MENTAL_CHALLENGES.filter(q => q.categorie === ${JSON.stringify(g.category)}).length;`);
  t.ok(realCount > 0, `${g.file} : la catégorie "${g.category}" correspond bien à de vraies questions réelles (obtenu ${realCount})`);
});

// ---------- Une catégorie fabriquée ne s'affiche jamais ----------
{
  const { window } = loadPage('guide-dca-ou-lump-sum.html', ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/historical-data.js', 'scripts/guides-data.js', 'scripts/pages/guide-dca-ou-lump-sum.js']);
  // Appelle directement renderGuideDefiLink (function déclarée -> déjà sur
  // window) avec une fausse catégorie pour vérifier le garde-fou, sans
  // dépendre d'un vrai guide qui en porterait une.
  const fakeHtml = window.renderGuideDefiLink('Catégorie-totalement-fabriquée-xyz');
  t.equal(fakeHtml, '', "renderGuideDefiLink renvoie bien une chaîne vide pour une catégorie qui ne correspond à aucune vraie question");
  t.equal(window.renderGuideDefiLink(null), '', "renderGuideDefiLink renvoie bien une chaîne vide quand aucune catégorie n'est fournie");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
