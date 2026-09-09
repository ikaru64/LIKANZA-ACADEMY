/* ============================================================
   Recherche Guides (guides.html) — sprint de consolidation 09/09/2026,
   section 28 du prompt d'origine ("pea cto" doit trouver "PEA ou
   compte-titres (CTO) ?"). Avant le correctif, la recherche exigeait la
   requête entière comme UNE seule sous-chaîne contiguë du texte réel —
   "pea cto" ne matchait jamais "PEA ou compte-titres (CTO) ?" (les mots
   "pea" et "cto" existent bien dans le texte réel, mais jamais côte à
   côte). Corrigé : chaque mot de la requête doit apparaître quelque part
   dans le texte réel (ET logique), peu importe l'ordre/la ponctuation.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadPage } = require('./support/load-page');

const t = createSuite('guides.search');
const GUIDES_LOCAL_SCRIPTS = ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/historical-data.js', 'scripts/guides-data.js', 'scripts/pages/guides.js'];
function loadGuidesPage(options){ return loadPage('guides.html', GUIDES_LOCAL_SCRIPTS, options); }

function questionsShown(document){
  return [...document.querySelectorAll('#guidesGrid h3')].map(h => h.textContent);
}

{
  const { window, document } = loadGuidesPage();

  const searchInput = document.getElementById('guidesSearch');

  // ---------- "pea cto" (multi-mots, jamais contigus dans le vrai texte) ----------
  searchInput.value = 'pea cto';
  searchInput.dispatchEvent(new window.Event('input'));
  const afterPeaCto = questionsShown(document);
  t.ok(afterPeaCto.some(q => q.includes('PEA') && q.includes('CTO')), `"pea cto" trouve bien le vrai guide "PEA ou compte-titres (CTO) ?" (obtenu : ${JSON.stringify(afterPeaCto)})`);

  // ---------- "boule neige" (même classe de requête multi-mots) ----------
  searchInput.value = 'boule neige';
  searchInput.dispatchEvent(new window.Event('input'));
  const afterBouleNeige = questionsShown(document);
  t.ok(afterBouleNeige.some(q => q.toLowerCase().includes('boule de neige')), `"boule neige" trouve bien le vrai guide avalanche/boule de neige (obtenu : ${JSON.stringify(afterBouleNeige)})`);

  // ---------- Mot-clé totalement absent : aucun résultat, jamais un guide non pertinent ----------
  searchInput.value = 'zzz-totalement-absent-xyz';
  searchInput.dispatchEvent(new window.Event('input'));
  t.equal(questionsShown(document).length, 0, "une requête sans aucune correspondance réelle ne renvoie jamais de guide non pertinent");

  // ---------- Un seul mot déjà présent : comportement inchangé (non-régression) ----------
  searchInput.value = 'DCA';
  searchInput.dispatchEvent(new window.Event('input'));
  const afterDca = questionsShown(document);
  t.ok(afterDca.some(q => q.includes('DCA')), "une requête d'un seul mot continue de fonctionner comme avant");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
