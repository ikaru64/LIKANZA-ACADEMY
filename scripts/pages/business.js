/* ============================================================
   LIKANZA ACADEMY — Business (business.html)
   Plusieurs widgets qui réutilisent la vraie progression déjà
   existante (renderBusinessResume/renderBusinessQuestionDuJour/
   renderBusinessCasRecommande/renderConceptLevels/
   renderBusinessToolsProgress, tous dans scripts/data.js).
   La grille "Explore un domaine du Business" est un lien statique par
   domaine (voir business.html) — plus de renderTopicWidget ici, les
   pages profondes (marketing.html/clients.html/immobilier.html/
   strategie.html/finance.html/vente.html) portent leur propre contenu.
   Business Lab et « J'ai un problème » vivent sur business-lab.html
   (porte « Résoudre un problème »), pas ici, pour garder ce hub court.
   Ton profil business, Ton niveau & indicateurs en direct et le renvoi
   vers Actualités ont été retirés du hub (redondants avec Play, la
   Bibliothèque et Actualités elles-mêmes) — leurs fonctions restent
   dans scripts/data.js/business-game.js, réutilisables ailleurs.
   Aucune donnée inventée : en cas d'échec, dégradation silencieuse
   avec un message clair, jamais un contenu fictif.
   ============================================================ */

renderLevelTip('levelTip', 'business');
renderBusinessResume('businessResume');

renderConceptLevels('businessLevelPib', 'PIB (Produit intérieur brut)');
renderConceptLevels('businessLevelTaux', "Taux d'intérêt directeur");
renderConceptLevels('businessLevelLevier', "Effet de levier");
renderBusinessToolsProgress('businessToolsProgress');
renderBusinessQuestionDuJour('businessQuestion');
renderBusinessCasRecommande('businessCasRecommande');
