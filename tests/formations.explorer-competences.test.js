/* ============================================================
   Refonte "Apprendre" (formations.html), Chantier 3 : "Explorer les
   compétences" — un anneau réel par domaine (computeDomainMastery),
   dépliable sur les vraies sous-catégories de quiz du domaine
   (getSkillMastery), remplace l'ancienne section à simples barres.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage } = require('./support/load-page');

const t = createSuite('formations.explorer-competences');

// ---------- Utilisateur neuf : aucune donnée -> section entièrement masquée ----------
{
  const { document } = loadFormationsPage();
  const el = document.getElementById('formationDomainMastery');
  t.equal(el.innerHTML.trim(), '', "un utilisateur neuf ne voit jamais un anneau à 0% pour un domaine jamais touché");
}

// ---------- Un domaine réellement pratiqué -> anneau + sous-compétences réelles ----------
{
  const { document } = loadFormationsPage({
    seed(window){
      // Bourse et Actions -> domaine stockMarket (DOMAINS, app.js)
      window.localStorage.setItem('likanza-quiz-stats', JSON.stringify({
        categoryStats: {
          'Bourse': {correct: 3, total: 4},   // 75% -> maîtrisé
          'Actions': {correct: 1, total: 4}   // 25% -> faible
        },
        history: []
      }));
    }
  });
  const el = document.getElementById('formationDomainMastery');
  t.ok(el.innerHTML.includes('Explorer les compétences'), 'la section porte bien le titre "Explorer les compétences"');
  t.ok(el.innerHTML.includes('mastery-ring'), 'un vrai anneau de progression est bien rendu');
  t.ok(el.innerHTML.includes('Bourse'), 'la sous-compétence "Bourse" apparaît bien dans le détail dépliable');
  t.ok(el.innerHTML.includes('Actions'), 'la sous-compétence "Actions" apparaît bien dans le détail dépliable');
  t.ok(el.innerHTML.includes('75%') || el.innerHTML.includes('75 %'), 'le vrai pourcentage individuel de "Bourse" (75%) est bien affiché');
  t.ok(el.innerHTML.includes('25%') || el.innerHTML.includes('25 %'), 'le vrai pourcentage individuel de "Actions" (25%) est bien affiché');
  // Un domaine jamais touché (ex. Économie) ne doit jamais apparaître
  t.ok(!el.innerHTML.includes('Économie'), 'un domaine jamais pratiqué (Économie) ne doit jamais apparaître avec un anneau fabriqué');
}

// ---------- Un domaine pratiqué mais SANS sous-catégorie individuelle mesurable (< 2 réponses) ----------
{
  const { document } = loadFormationsPage({
    seed(window){
      window.localStorage.setItem('likanza-quiz-stats', JSON.stringify({
        categoryStats: {'PIB': {correct: 1, total: 1}}, // total < 2 -> exclu de getSkillMastery
        history: []
      }));
    }
  });
  const el = document.getElementById('formationDomainMastery');
  // PIB seul avec total=1 est exclu de getSkillMastery -> computeDomainMastery ne verra aucune
  // contribution réelle pour ce domaine -> section entière masquée (cohérent, jamais un anneau fantôme).
  t.equal(el.innerHTML.trim(), '', "un échantillon insuffisant (moins de 2 réponses) ne produit jamais d'anneau fabriqué");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
