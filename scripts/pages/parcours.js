/* ============================================================
   LIKANZA ACADEMY — Mon Univers Financier
   Cockpit financier personnel (patrimoine, objectifs, alertes,
   projets, trajectoire...), via la coquille de widgets partagée
   (renderDashboardShell, scripts/data.js). Jamais verrouillé : le
   reste du site reste accessible sans avoir fait le premier quiz.
   Mais tant qu'il n'est pas fait, cette page elle-même met une
   seule action en avant (le premier quiz) plutôt qu'un tableau de
   bord vide.

   Sprint de fermeture des écarts (04/09/2026, phases 4-5) : le
   sélecteur de niveau curriculum et la liste de missions par palier
   (l'ancienne identité "Mon Parcours") ont été retirés d'ici — cette
   page ne répond plus qu'à "où en est ma situation financière et où
   vais-je ?", jamais à "quel cours suivre ensuite" (déplacé sur
   formations.html, voir scripts/pages/formations.js).
   ============================================================ */

// Chantier 1 (audit Dashboard du 28/08/2026) : remplace la pile de sections
// individuelles (profil, stats, prochain pas, Financial IQ, détail par
// domaine) par la coquille de widgets (renderDashboardShell, scripts/data.js)
// — personnalisable, avec bascule Personnel/Professionnel en page.
function initParcoursHero(){
  const hasProfile = !!getPositioningResult();
  if(!hasProfile){
    document.getElementById('parcoursGateSection').style.display = 'block';
    renderParcoursGate('parcoursGate');
    return;
  }
  document.getElementById('parcoursMainSection').style.display = 'block';
  renderDashboardHeader('dashboardHeader');
  renderDashboardShell('dashboardShell');
}

initParcoursHero();

// Profil de simulation (âge/épargne/horizon/risque/objectif — pré-remplit
// les outils du site) : relocalisé depuis Mon Compte (sprint de fermeture
// des écarts, 04/09/2026, phase 6). Ce sont de vraies données financières,
// leur place est ici plutôt que dans les paramètres de compte. Toujours
// visible, jamais gaté derrière le test de positionnement (comme sur son
// ancien emplacement).
renderProfileWidget('profileWidget');
