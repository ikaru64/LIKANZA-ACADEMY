/* ============================================================
   LIKANZA ACADEMY — Business (business.html)
   Plusieurs widgets qui réutilisent la vraie progression déjà
   existante (renderBusinessResume/renderBusinessQuestionDuJour/
   renderBusinessCasRecommande/renderConceptLevels/renderTopicWidget/
   renderBusinessToolsProgress, tous dans scripts/data.js).
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

renderTopicWidget('businessImmobilier', {
  title: 'Immobilier',
  intro: "Acheter, investir en locatif ou comprendre un crédit : les bases pour ne pas se faire surprendre par les chiffres.",
  terms: ['Rendement locatif', 'Apport personnel', 'Effet de levier', 'Cash-flow (immobilier)', 'Charges locatives', 'Vacance locative', 'Crédit immobilier'],
  ctaLabel: "Simuler un crédit ou un rendement →",
  ctaHref: 'immobilier.html'
});

renderTopicWidget('businessMarketing', {
  title: 'Marketing',
  intro: "Se faire connaître et convaincre : le funnel complet, de l'attention au client fidèle, avec les métriques réelles.",
  terms: ['Proposition de valeur', 'Acquisition', 'SEO', 'Contenu (marketing de contenu)', 'Réseaux sociaux (marketing)', 'Publicité', 'Email marketing', 'CAC', 'Taux de conversion', 'Rétention', 'Branding'],
  ctaLabel: "Explorer le funnel marketing →",
  ctaHref: 'marketing.html'
});

renderTopicWidget('businessClients', {
  title: 'Clients',
  intro: "Comprendre qui on sert vraiment : segmentation, persona, objections, fidélisation — le socle de toute proposition de valeur solide.",
  terms: ['Client idéal', 'Persona', 'Segmentation', 'Niche', 'Objections (commerciales)', 'B2B et B2C', 'LTV'],
  ctaLabel: "Explorer le guide Clients →",
  ctaHref: 'clients.html'
});

renderConceptLevels('businessLevelPib', 'PIB (Produit intérieur brut)');
renderConceptLevels('businessLevelTaux', "Taux d'intérêt directeur");
renderConceptLevels('businessLevelLevier', "Effet de levier");
renderBusinessToolsProgress('businessToolsProgress');
renderBusinessQuestionDuJour('businessQuestion');
renderBusinessCasRecommande('businessCasRecommande');
