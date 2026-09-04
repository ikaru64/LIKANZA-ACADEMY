// Sprint de fermeture des écarts (04/09/2026, phase 6) : Mon compte ne garde
// plus que ce qui est réellement de son ressort (identité, connexion,
// synchronisation, favoris, confidentialité). Migré ailleurs, code inchangé :
// sélecteur de niveau -> formations.html (déjà là depuis les phases 4-5) ;
// Progression & récompenses (XP/série/badges/ligue) -> widget Dashboard
// 'gamification-full' (scripts/data.js, DASHBOARD_WIDGETS) ; profil de
// simulation -> parcours.html (Mon Univers Financier) ; personnalisation
// (objectifs/intérêts/style) -> profil.html (nouvelle page "Profil Likanza") ;
// watchlist -> bourse.html.

const favs = getFavorites();
document.getElementById('favCount').textContent = favs.length + ' élément(s)';
if(favs.length){
  document.getElementById('favEmpty').style.display = 'none';
  document.getElementById('favGrid').innerHTML = favs.map(f=>`
    <div class="card">
      <span class="smallcaps">${f.type}</span>
      <h3 style="font-size:18px;">${f.title}</h3>
      <div class="card-footer"><span>Ajouté le ${f.date}</span><a href="${f.url}" class="btn btn-sm">Ouvrir</a></div>
    </div>`).join('');
}
