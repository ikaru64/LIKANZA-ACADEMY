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

// 1 à 2 flux réels par catégorie pour la synthèse hebdomadaire — chacun
// vérifié en direct (HTTP 200, XML RSS valide, items datés du jour) avant
// intégration, même exigence que RSS_FEEDS ci-dessus. Deux flux par
// catégorie quand une seconde source réelle et fiable a été trouvée
// (permet à generate-weekly-news.js/lib/gemini.js de signaler un accord ou
// un désaccord entre sources) ; une seule quand aucune seconde source
// réelle n'a été identifiée (Bourse, Matières premières — boursier.com et
// zonebourse.com bloquent le scraping, aucune alternative fiable trouvée) :
// mieux vaut rester honnête sur une seule source que d'en inventer une.
const WEEKLY_CATEGORY_FEEDS = [
  {categorie: 'Entreprises', slug: 'entreprises', feeds: [
    {name: 'BFM Business — Entreprises', url: 'https://www.bfmtv.com/rss/economie/entreprises/'},
    {name: 'Franceinfo — Entreprises', url: 'https://www.francetvinfo.fr/economie/entreprises.rss'}
  ]},
  {categorie: 'Géopolitique', slug: 'geopolitique', feeds: [
    {name: 'BFM International', url: 'https://www.bfmtv.com/rss/international/'},
    {name: 'Franceinfo — Monde', url: 'https://www.francetvinfo.fr/monde.rss'}
  ]},
  {categorie: 'Technologie', slug: 'technologie', feeds: [
    {name: 'Silicon.fr', url: 'https://www.silicon.fr/feed'},
    {name: '01net', url: 'https://www.01net.com/actualites/feed/'}
  ]},
  {categorie: 'Bourse', slug: 'bourse', feeds: [
    {name: 'Investing.com — Actualité sur les actions', url: 'https://fr.investing.com/rss/news_25.rss'}
  ]},
  {categorie: 'Crypto', slug: 'crypto', feeds: [
    {name: 'Investing.com — Cryptomonnaies', url: 'https://fr.investing.com/rss/news_301.rss'},
    {name: 'Cryptoast', url: 'https://cryptoast.fr/feed/'}
  ]},
  {categorie: 'Matières premières', slug: 'matieres-premieres', feeds: [
    {name: 'Investing.com — Matières premières', url: 'https://fr.investing.com/rss/news_11.rss'}
  ]},
  {categorie: 'Économie', slug: 'economie', feeds: [
    {name: 'Investing.com — Actualité économique', url: 'https://fr.investing.com/rss/news_14.rss'},
    {name: 'Franceinfo — Éco/Conso', url: 'https://www.francetvinfo.fr/economie.rss'}
  ]}
];

module.exports = { RSS_FEEDS, WEEKLY_CATEGORY_FEEDS };
