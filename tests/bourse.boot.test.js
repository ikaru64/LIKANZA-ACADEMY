/* ============================================================
   Chargement de bourse.html : la page boote sans aucune erreur JS, même
   quand tous les appels réseau échouent, et les états de chargement se
   résolvent en "Donnée indisponible" plutôt que de rester bloqués.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBoursePage, flush } = require('./support/load-page');

(async () => {
  const t = createSuite('bourse.boot');

  let thrown = null;
  process.on('uncaughtException', err => { thrown = err; });

  const { document } = loadBoursePage(); // fetch par défaut : échoue systématiquement (503)
  await flush(200); // laisse toutes les promesses internes (fetch/then) se résoudre

  t.ok(!thrown, `la page se charge sans exception non interceptée (échec réseau simulé sur tous les appels)`, thrown && thrown.stack);

  // "Marché du jour" doit passer d'un état de chargement à un état
  // résolu (jamais bloqué indéfiniment sur "Chargement…").
  const marketOfDay = document.getElementById('marketOfDayBody');
  t.ok(!!marketOfDay, "le conteneur #marketOfDayBody existe bien dans la page réelle");
  if(marketOfDay){
    t.ok(!/Chargement/i.test(marketOfDay.innerHTML) || /indisponible/i.test(marketOfDay.innerHTML),
      "« Marché du jour » ne reste pas bloqué sur un état de chargement quand le réseau échoue",
      marketOfDay.innerHTML.slice(0, 200));
  }

  // Fiches actions : doivent afficher les 8 valeurs de démonstration
  // (données statiques réelles, indépendantes du réseau) même quand les
  // fondamentales (réseau) échouent.
  const stockGrid = document.getElementById('stockGrid');
  t.ok(!!stockGrid && stockGrid.children.length > 0, "les fiches actions (données statiques) s'affichent bien même sans réseau", stockGrid && stockGrid.innerHTML.slice(0, 200));

  const summary = t.summary();
  console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
  process.exit(summary.failed > 0 ? 1 : 0);
})();
