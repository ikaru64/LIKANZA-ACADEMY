/* ============================================================
   LIKANZA ACADEMY — Sources RSS réelles pour les actualités
   Utilisé par api/generate-daily-news.js (récap quotidien, mélange
   de thèmes) et api/generate-weekly-news.js (un article de fond par
   catégorie, renouvelé chaque semaine). Flux vérifiés en direct
   (contenu réel, daté du jour) avant intégration — voir lib/rss.js
   pour le fetch/parsing.
   ============================================================ */

// Flux mélangés utilisés pour le récap quotidien (toutes thématiques confondues).
const RSS_FEEDS = [
  {name:'Investing.com — Actualité économique', url:'https://fr.investing.com/rss/news_14.rss'},
  {name:'Investing.com — Actualité sur les actions', url:'https://fr.investing.com/rss/news_25.rss'},
  {name:'BFM Business — Entreprises', url:'https://www.bfmtv.com/rss/economie/entreprises/'}
];

// Un flux dédié par catégorie pour la synthèse hebdomadaire — chacun vérifié
// individuellement (contenu réel et pertinent pour le thème, pas de filtrage
// a posteriori nécessaire).
const WEEKLY_CATEGORY_FEEDS = [
  {categorie: 'Entreprises', slug: 'entreprises', feed: {name: 'BFM Business — Entreprises', url: 'https://www.bfmtv.com/rss/economie/entreprises/'}},
  {categorie: 'Géopolitique', slug: 'geopolitique', feed: {name: 'BFM International', url: 'https://www.bfmtv.com/rss/international/'}},
  {categorie: 'Technologie', slug: 'technologie', feed: {name: 'Silicon.fr', url: 'https://www.silicon.fr/feed'}},
  {categorie: 'Bourse', slug: 'bourse', feed: {name: 'Investing.com — Actualité sur les actions', url: 'https://fr.investing.com/rss/news_25.rss'}},
  {categorie: 'Crypto', slug: 'crypto', feed: {name: 'Investing.com — Cryptomonnaies', url: 'https://fr.investing.com/rss/news_301.rss'}},
  {categorie: 'Matières premières', slug: 'matieres-premieres', feed: {name: 'Investing.com — Matières premières', url: 'https://fr.investing.com/rss/news_11.rss'}}
];

module.exports = { RSS_FEEDS, WEEKLY_CATEGORY_FEEDS };
