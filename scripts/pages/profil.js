/* ============================================================
   LIKANZA ACADEMY — Ton profil Likanza
   Sprint de fermeture des écarts (04/09/2026, phase 7) : nouvelle page,
   identité et fonction enfin réunies (le nom/URL "Ton profil Likanza"
   pointait auparavant vers le questionnaire d'intake seul ; l'éditeur
   continu — renderPersonalizationPanel — vivait sous "Mon compte"). Réutilise
   les deux fonctions existantes telles quelles, aucune nouvelle logique.
   test-positionnement.html reste l'entrée du questionnaire lui-même,
   atteignable d'ici via "Refaire le test complet".
   ============================================================ */
renderPersonalizationPanel('personalizationPanel');
renderDomainDashboard('domainDashboard');
