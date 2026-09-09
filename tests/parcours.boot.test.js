/* ============================================================
   Chargement de parcours.html ("Mon Univers Financier", le cockpit) — la
   page boote sans exception non interceptée dans ses 2 états réels :
   utilisateur tout neuf (aucun profil de positionnement -> grille
   d'accroche "parcoursGate") et utilisateur déjà positionné (cockpit
   complet -> KPIs/santé financière/file de priorités). Réseau simulé en
   échec systématique (503), comme toutes les pages "terminal" du site.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadParcoursPage, flush } = require('./support/load-page');

(async () => {
  const t = createSuite('parcours.boot');

  // ---------- État 1 : utilisateur tout neuf, aucun profil enregistré ----------
  {
    let thrown = null;
    const onError = err => { thrown = err; };
    process.on('uncaughtException', onError);
    const { document } = loadParcoursPage();
    await flush(200);
    process.removeListener('uncaughtException', onError);

    t.ok(!thrown, "un utilisateur tout neuf (aucun profil) charge la page sans exception non interceptée", thrown && thrown.stack);
    t.equal(document.getElementById('parcoursGateSection').style.display, 'block', "sans profil de positionnement, la grille d'accroche (gate) est bien affichée");
    t.ok(document.getElementById('parcoursMainSection').style.display !== 'block', "sans profil, le cockpit complet ne s'affiche jamais (jamais de KPIs fabriqués sans données)");
  }

  // ---------- État 2 : utilisateur déjà positionné (mode réel, pas démo) ----------
  {
    let thrown = null;
    const onError = err => { thrown = err; };
    process.on('uncaughtException', onError);
    // seed() s'exécute AVANT l'injection de parcours.js, donc avant l'appel
    // automatique à initParcoursHero() en bas du fichier — reproduit
    // fidèlement un vrai retour sur la page une fois positionné, plutôt que
    // de relancer initParcoursHero() une 2e fois sur un DOM déjà modifié
    // (non idempotent : la gate resterait affichée du 1er appel).
    const { document } = loadParcoursPage({seed: window => {
      window.localStorage.setItem('fzr-positioning-result', JSON.stringify({profile: 'equilibre', completedAt: new Date().toISOString(), version: 2}));
      // cockpitDetectMode() bascule en mode démo tant qu'aucune vraie donnée
      // personnelle n'existe (getNetWorthAssets/getFinancialGoals... vides) —
      // on seed un vrai objectif pour tester le VRAI cockpit, pas la démo.
      window.localStorage.setItem('fzr-financial-goals', JSON.stringify([
        {id: 'g1', nom: "Fonds d'urgence", montantCible: 3000, montantActuel: 500, versementMensuel: 100, dateCible: null}
      ]));
    }});
    await flush(200);
    process.removeListener('uncaughtException', onError);

    t.ok(!thrown, "un utilisateur déjà positionné (avec un vrai objectif) charge le cockpit sans exception non interceptée", thrown && thrown.stack);
    t.equal(document.getElementById('parcoursMainSection').style.display, 'block', "avec un profil de positionnement réel, le cockpit complet s'affiche");
    t.equal(document.getElementById('parcoursGateSection').style.display, 'none', "avec un profil, la grille d'accroche (gate) reste masquée");
    const kpis = document.getElementById('cockpitKPIs');
    t.ok(!!kpis && kpis.innerHTML.trim().length > 0, "les KPIs du cockpit sont bien rendus (contenu réel, jamais un conteneur vide)", kpis && kpis.innerHTML.slice(0, 200));
  }

  const summary = t.summary();
  console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
  process.exit(summary.failed > 0 ? 1 : 0);
})();
