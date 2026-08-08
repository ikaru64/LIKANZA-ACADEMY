/* ============================================================
   LIKANZA ACADEMY — Sources RSS réelles pour le récap quotidien
   Utilisé par api/generate-daily-news.js. Flux vérifiés en direct
   (contenu réel, daté du jour) avant intégration — voir lib/rss.js
   pour le fetch/parsing.
   ============================================================ */

const RSS_FEEDS = [
  {name:'Investing.com — Actualité économique', url:'https://fr.investing.com/rss/news_14.rss'},
  {name:'Investing.com — Actualité sur les actions', url:'https://fr.investing.com/rss/news_25.rss'},
  {name:'BFM Business — Entreprises', url:'https://www.bfmtv.com/rss/economie/entreprises/'}
];

module.exports = { RSS_FEEDS };
