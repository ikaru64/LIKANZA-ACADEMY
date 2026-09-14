/* ============================================================
   Refonte "Apprendre" (formations.html), Chantier 2 : "Likanza te
   recommande" passe de 1 à 3 cartes distinctes (pickRecommendedCategories),
   sans dupliquer la même catégorie deux fois.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage } = require('./support/load-page');

const t = createSuite('formations.recommande-3-cartes');

function seedWeakCategories(window, categories){
  const categoryStats = {};
  categories.forEach(cat => { categoryStats[cat] = {correct: 1, total: 4}; }); // 25% -> 'faible'
  window.localStorage.setItem('likanza-quiz-stats', JSON.stringify({categoryStats, history: []}));
}

// ---------- Plusieurs vraies faiblesses mesurées -> jusqu'à 3 cartes distinctes ----------
{
  const { document, runInPage } = loadFormationsPage({
    seed(window){ seedWeakCategories(window, ['Bourse', 'Actions', 'Budget']); }
  });
  const el = document.getElementById('coursRecommandePourToi');
  t.ok(el.innerHTML.includes('Likanza te recommande'), 'la section porte bien le titre "Likanza te recommande"');
  const cardCount = el.querySelectorAll('.card-grid > .card').length;
  t.equal(cardCount, 3, 'avec 3 vraies faiblesses couvertes par des cours, 3 cartes distinctes sont bien affichées');
  const titles = Array.from(el.querySelectorAll('.card-grid > .card h3')).map(h => h.textContent);
  t.equal(new Set(titles).size, titles.length, 'les 3 cartes pointent bien vers 3 cours distincts, jamais un doublon');
}

// ---------- Utilisateur neuf (aucune donnée) -> jamais une carte vide ----------
{
  const { document } = loadFormationsPage();
  const el = document.getElementById('coursRecommandePourToi');
  const cards = el.querySelectorAll('.card-grid > .card');
  cards.forEach(c => {
    t.ok(!!c.querySelector('h3') && c.querySelector('h3').textContent.trim().length > 0, 'chaque carte affichée porte bien un vrai titre de cours, jamais vide');
    t.ok(!!c.querySelector('a.btn'), 'chaque carte affichée porte bien un vrai lien cliquable');
  });
}

// ---------- pickRecommendedCategories : jamais de doublon même avec plus de faiblesses que N ----------
{
  const { runInPage } = loadFormationsPage({
    seed(window){ seedWeakCategories(window, ['Bourse', 'Actions', 'Budget', 'Épargne', 'PIB']); }
  });
  const picks = runInPage(`window.__r = pickRecommendedCategories(['Bourse','Actions','Budget','Épargne','PIB'], 3);`);
  t.equal(picks.length, 3, 'pickRecommendedCategories respecte bien la limite N même avec plus de candidats faibles');
  t.equal(new Set(picks.map(p => p.categorie)).size, 3, 'les 3 catégories retournées sont bien distinctes');
  picks.forEach(p => t.ok(p.personalized === true, `la catégorie ${p.categorie} est bien marquée personnalisée (issue d'une vraie faiblesse mesurée)`));
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
