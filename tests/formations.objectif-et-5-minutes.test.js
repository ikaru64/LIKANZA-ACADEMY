/* ============================================================
   Refonte "Apprendre" (formations.html), Chantier 5 : sélecteur d'objectif
   ("Que veux-tu savoir faire ?") + module "Tu as 5 minutes ?" — chaque
   objectif pointe vers une vraie cible existante (cours ou parcours),
   jamais un nouveau contenu créé pour l'occasion.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage } = require('./support/load-page');

const t = createSuite('formations.objectif-et-5-minutes');

// ---------- Sélecteur d'objectif : chaque carte pointe vers une vraie cible ----------
{
  const { document, runInPage } = loadFormationsPage();
  const el = document.getElementById('objectifSection');
  t.ok(el.innerHTML.includes('Que veux-tu savoir faire'), 'la section porte bien le titre du sélecteur d\'objectif');
  const goals = runInPage(`window.__r = LEARNING_GOALS;`);
  t.ok(goals.length >= 5, 'au moins 5 micro-objectifs réels sont bien définis');
  goals.forEach(g => {
    if(g.target.type === 'cours'){
      const exists = runInPage(`window.__r = COURS_CATALOG.some(c => c.id === ${JSON.stringify(g.target.id)});`);
      t.ok(exists, `l'objectif "${g.label}" pointe bien vers un vrai cours existant (${g.target.id})`);
    } else {
      const exists = runInPage(`window.__r = LEARNING_PATHS.some(p => p.id === ${JSON.stringify(g.target.id)});`);
      t.ok(exists, `l'objectif "${g.label}" pointe bien vers un vrai parcours existant (${g.target.id})`);
    }
  });
  const links = Array.from(el.querySelectorAll('a.card'));
  t.equal(links.length, goals.length, 'une carte cliquable est bien rendue pour chaque objectif réel');
}

// ---------- "Tu as 5 minutes ?" : sans position -> repli sur le cours recommandé ----------
{
  const { document } = loadFormationsPage();
  const el = document.getElementById('quickSessionWidget');
  t.ok(el.innerHTML.includes('minute'), "sans position en cours, un vrai chapitre court est quand même proposé (repli sur la recommandation)");
  t.ok(el.innerHTML.includes('cours.html#'), 'le lien "Lire maintenant" pointe bien vers un vrai chapitre');
}

// ---------- "Tu as 5 minutes ?" : ne propose jamais un chapitre déjà marqué terminé ----------
{
  const { document, runInPage } = loadFormationsPage({
    seed(window){
      window.localStorage.setItem('likanza-last-position', JSON.stringify({
        type: 'cours', id: 'bourse-actions', titre: 'x', chapitreIndex: 0, chapitreTitre: 'y', timestamp: Date.now()
      }));
    }
  });
  const cours = runInPage(`window.__r = COURS_CATALOG.find(c => c.id === 'bourse-actions');`);
  const allTitles = cours.chapitres.map(c => c.titre);
  // Marque TOUS les chapitres comme déjà visités -> plus aucun candidat réel dans ce cours.
  const { document: doc2 } = loadFormationsPage({
    seed(window){
      window.localStorage.setItem('likanza-last-position', JSON.stringify({
        type: 'cours', id: 'bourse-actions', titre: 'x', chapitreIndex: 0, chapitreTitre: 'y', timestamp: Date.now()
      }));
      window.localStorage.setItem('likanza-cours-visited', JSON.stringify({'bourse-actions': allTitles}));
    }
  });
  const el2 = doc2.getElementById('quickSessionWidget');
  // Tous les chapitres du cours en cours sont visités -> repli sur la recommandation
  // (jamais un chapitre déjà lu proposé comme "nouveau").
  if(el2.innerHTML.includes('cours.html#bourse-actions:')){
    t.ok(false, 'un chapitre déjà visité de bourse-actions ne doit jamais être reproposé par "Tu as 5 minutes ?"', el2.innerHTML);
  } else {
    t.ok(true, 'tous les chapitres de bourse-actions étant visités, le module ne les represente pas');
  }
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
