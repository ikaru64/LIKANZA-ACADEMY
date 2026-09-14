/* ============================================================
   Refonte "Apprendre" (formations.html), Chantier 4 : colonne latérale
   (Mission du jour / À revoir / Compétences maîtrisées / Projet final) —
   4 signaux déjà réels, jamais un widget fabriqué.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage } = require('./support/load-page');

const t = createSuite('formations.colonne-laterale');

// ---------- Utilisateur neuf : chaque widget affiche un état honnête, jamais cassé ----------
{
  const { document } = loadFormationsPage();
  const mission = document.getElementById('missionDuJourWidget');
  const revoir = document.getElementById('apprendreARevoirWidget');
  const competences = document.getElementById('competencesMaitriseesWidget');
  const projet = document.getElementById('projetFinalWidget');
  t.ok(mission.innerHTML.includes('Mission du jour'), 'Mission du jour affiche bien son titre même sans signal personnalisé');
  // Sans aucune donnée personnalisée, il reste toujours une vraie recommandation de
  // "découverte" (même mécanisme que Défis/Business) -> jamais une liste vide
  // silencieuse tant qu'il existe au moins un vrai cours au catalogue.
  t.ok(!!mission.querySelector('a'), 'Mission du jour propose toujours au moins un vrai lien (recommandation de découverte), jamais une liste vide silencieuse');
  t.ok(revoir.innerHTML.includes('continue comme ça'), 'À revoir sans erreur non résolue affiche un message honnête');
  t.ok(competences.innerHTML.includes('Aucune compétence maîtrisée'), 'Compétences maîtrisées sans donnée affiche un message honnête, jamais un badge fabriqué');
  t.ok(projet.innerHTML.includes('analyser-entreprise.html'), 'Projet final pointe bien vers le vrai assistant existant');
  t.ok(!projet.innerHTML.match(/\d+\s*%/), 'Projet final n\'affiche jamais une progression fabriquée (aucun stockage réel n\'existe pour cette page)');
}

// ---------- Mission du jour : reprise de position + révision due + recommandation, max 3, tous cliquables ----------
{
  const { document, runInPage } = loadFormationsPage({
    seed(window){
      window.localStorage.setItem('likanza-last-position', JSON.stringify({
        type: 'cours', id: 'bourse-actions', titre: 'x', chapitreIndex: 0, chapitreTitre: "1. Qu'est-ce qu'une action ?", timestamp: Date.now()
      }));
      window.localStorage.setItem('likanza-spaced-repetition', JSON.stringify({
        'Budget': {stage: 0, nextReviewDate: '2000-01-01'} // largement échue
      }));
    }
  });
  const mission = document.getElementById('missionDuJourWidget');
  const links = Array.from(mission.querySelectorAll('a'));
  t.ok(links.length > 0 && links.length <= 3, 'Mission du jour affiche entre 1 et 3 items, jamais plus');
  t.ok(mission.innerHTML.includes('Reprendre'), "l'item de reprise de position est bien présent");
  t.ok(mission.innerHTML.includes('Réviser Budget'), "l'item de révision espacée due est bien présent");
  links.forEach(a => t.ok(!!a.getAttribute('href') && a.getAttribute('href').length > 0, 'chaque item de Mission du jour porte bien un vrai lien'));
}

// ---------- À revoir priorisé : pointe vers un vrai cours quand un existe pour la catégorie ----------
{
  const { document } = loadFormationsPage({
    seed(window){
      window.localStorage.setItem('likanza-mistakes', JSON.stringify([
        {questionId: 'q1', categorie: 'Bourse', niveau: 'debutant', question: 'x', correctAnswer: 'y', firstMissedAt: '2026-01-01', lastMissedAt: '2026-01-01', misses: 3, resolved: false},
        {questionId: 'q2', categorie: 'Bourse', niveau: 'debutant', question: 'x2', correctAnswer: 'y2', firstMissedAt: '2026-01-01', lastMissedAt: '2026-01-01', misses: 1, resolved: false}
      ]));
    }
  });
  const revoir = document.getElementById('apprendreARevoirWidget');
  t.ok(revoir.innerHTML.includes('Bourse'), 'la catégorie la plus en échec (Bourse) est bien mise en avant');
  t.ok(revoir.innerHTML.includes('cours.html#'), "un vrai cours couvrant 'Bourse' existe -> le lien pointe bien vers ce cours plutôt que vers les Défis");
}

// ---------- Compétences maîtrisées : badges réels, seuil 75% ----------
{
  const { document } = loadFormationsPage({
    seed(window){
      window.localStorage.setItem('likanza-quiz-stats', JSON.stringify({
        categoryStats: {'Budget': {correct: 8, total: 10}}, // 80% -> maîtrisé
        history: []
      }));
    }
  });
  const competences = document.getElementById('competencesMaitriseesWidget');
  t.ok(competences.innerHTML.includes('Budget'), 'une vraie catégorie maîtrisée (80% >= 75%) apparaît bien comme badge');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
