/* ============================================================
   Refonte "Apprendre" (formations.html), Chantier 1 : hero "Continuer ta
   mission" + estimation de durée de lecture calculée (aucune valeur saisie
   à la main n'existe dans COURS_CATALOG). Remplace l'ancien widget
   "Continuer" compact, jamais branché depuis un chapitre visité (voir
   git log) — même source de vérité (getLastPosition/getCoursProgress).
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage } = require('./support/load-page');

const t = createSuite('formations.apprendre-hero');

// ---------- Nouvel utilisateur : aucune position -> état vide honnête ----------
{
  const { document } = loadFormationsPage();
  const hero = document.getElementById('apprendreHero');
  t.ok(hero.innerHTML.includes('Aucune mission en cours'), 'un utilisateur neuf voit un état vide honnête, jamais un hero cassé');
  t.ok(hero.innerHTML.includes('Choisir un objectif'), "l'état vide propose bien une vraie action de suite");
}

// ---------- Position réelle sur un cours non terminé -> hero rempli ----------
{
  const { window, document, runInPage } = loadFormationsPage({
    seed(window){
      window.localStorage.setItem('likanza-last-position', JSON.stringify({
        type: 'cours', id: 'bourse-actions', titre: 'Comprendre la Bourse et les actions',
        chapitreIndex: 1, chapitreTitre: "Comment une action s'échange : la Bourse et la capitalisation",
        timestamp: Date.now()
      }));
      window.localStorage.setItem('likanza-cours-visited', JSON.stringify({
        'bourse-actions': ["1. Qu'est-ce qu'une action ?"]
      }));
    }
  });
  const cours = runInPage(`window.__r = COURS_CATALOG.find(c => c.id === 'bourse-actions');`);
  const hero = document.getElementById('apprendreHero');
  t.ok(hero.innerHTML.includes(cours.titre), 'le hero affiche bien le vrai titre du cours en cours');
  t.ok(hero.innerHTML.includes('Chapitre 2'), 'le hero affiche bien le vrai numéro de chapitre reprisée (index 1 -> "Chapitre 2")');
  t.ok(hero.innerHTML.includes('Reprendre'), 'un lien "Reprendre" réel est bien proposé');
  t.ok(hero.innerHTML.includes(`cours.html#bourse-actions:`), 'le lien "Reprendre" pointe bien vers le bon cours/chapitre');
  // "bourse-actions" appartient au parcours objectif "stockMarket" (LEARNING_PATHS) :
  // les paliers du hero doivent lister les vrais cours de CE parcours, jamais une liste inventée.
  const path = runInPage(`window.__r = LEARNING_PATHS.find(p => p.type === 'objectif' && p.coursIds.includes('bourse-actions'));`);
  t.ok(!!path, "le fixture s'appuie bien sur un cours réellement rattaché à un parcours objectif");
  const autreCoursDuParcours = path.coursIds.find(id => id !== 'bourse-actions');
  const autreCours = runInPage(`window.__r = COURS_CATALOG.find(c => c.id === ${JSON.stringify(autreCoursDuParcours)});`);
  t.ok(hero.innerHTML.includes(autreCours.titre.slice(0, 20)), 'les paliers du hero listent bien un autre vrai cours du même parcours objectif');
}

// ---------- Cours terminé entre-temps -> hero repasse à l'état vide (jamais un lien mort) ----------
{
  const { document } = loadFormationsPage({
    seed(window){
      window.localStorage.setItem('likanza-last-position', JSON.stringify({
        type: 'cours', id: 'bourse-actions', titre: 'x', chapitreIndex: 1, chapitreTitre: 'y', timestamp: Date.now()
      }));
      window.localStorage.setItem('likanza-cours-progress', JSON.stringify({'bourse-actions': true}));
    }
  });
  const hero = document.getElementById('apprendreHero');
  t.ok(hero.innerHTML.includes('Aucune mission en cours'), 'un cours déjà terminé ne doit jamais réapparaître comme "mission en cours"');
}

// ---------- Sélecteur de niveau : démoté (replié), jamais supprimé ----------
{
  const { document } = loadFormationsPage();
  const details = document.getElementById('levelDetails');
  t.ok(!!details, 'le sélecteur de niveau existe toujours dans la page');
  t.ok(!details.hasAttribute('open'), 'le sélecteur de niveau est bien replié par défaut (démoté, jamais mis en avant)');
  t.ok(!!document.querySelector('.level-pills .pill[data-lvl="debutant"]'), 'les boutons de niveau réels sont toujours présents dans le DOM');
}

// ---------- estimateReadingMinutes : calculé depuis le vrai texte, jamais une valeur saisie à la main ----------
{
  const { runInPage } = loadFormationsPage();
  const zero = runInPage(`window.__r = estimateReadingMinutes({blocs: []});`);
  t.equal(zero, 0, 'un chapitre sans blocs donne 0 minute (jamais un minimum fabriqué sur du vide)');
  const oneWord = runInPage(`window.__r = estimateReadingMinutes({blocs: [{type:'texte', texte:'Un.'}]});`);
  t.equal(oneWord, 1, 'un chapitre non vide donne toujours au moins 1 minute, jamais 0');
  const longText = 'mot '.repeat(400);
  const twoMin = runInPage(`window.__r = estimateReadingMinutes({blocs: [{type:'texte', texte:${JSON.stringify(longText)}}]});`);
  t.equal(twoMin, 2, '400 mots ÷ 200 mots/minute = 2 minutes, un vrai calcul, jamais un chiffre choisi à la main');
  // Un vrai cours du catalogue donne bien une estimation positive
  const bourseMin = runInPage(`window.__r = estimateCourseMinutes(COURS_CATALOG.find(c => c.id === 'bourse-actions'));`);
  t.ok(bourseMin > 0, 'un vrai cours du catalogue donne une estimation de durée totale positive', bourseMin);
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
