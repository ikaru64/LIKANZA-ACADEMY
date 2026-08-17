/* ============================================================
   LIKANZA ACADEMY — Défis (defis.html)
   Terrain d'entraînement mental : Défi du jour, Recommandé pour toi,
   À revoir, Modes d'entraînement, Parcours thématiques, Tes performances.
   Toute la logique de rendu vit dans scripts/data.js (renderDefiDuJour,
   renderRecommandePourToi, renderDefisARevoir, renderModesEntrainement,
   renderDefisParcours, renderDefisPerformances, startMixedSession) —
   ce fichier ne fait que les déclencher et gérer l'arrivée via ?cat=.
   ============================================================ */

renderDefiDuJour('defiDuJour');
renderRecommandePourToi('recommandePourToi');
renderDefisARevoir('defisARevoir');
renderModesEntrainement('modesEntrainement');
renderDefisParcours('defisParcours');
renderDefisPerformances('defisPerformances');

// ?cat=<categorie> : arrivée depuis revisions.html ou la mission quotidienne
// "Revoir une notion mal comprise" — lance directement une session ciblée
// sur ce thème dans la zone Modes d'entraînement, sans dépendre d'un ancien
// sélecteur qui n'existe plus dans la nouvelle structure de la page.
const requestedCat = new URLSearchParams(location.search).get('cat');
if(requestedCat){
  const pool = QUIZ_BANK_FULL.concat(MENTAL_CHALLENGES).filter(i => i.categorie === requestedCat);
  if(pool.length > 0){
    const target = document.getElementById('modesEntrainement');
    if(target){
      target.scrollIntoView({behavior: 'smooth', block: 'start'});
      startMixedSession('modesEntrainement', pool.slice(0, 8));
    }
  }
}
