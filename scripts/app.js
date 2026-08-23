/* ============================================================
   LIKANZA ACADEMY — Données partagées
   Pour mettre à jour une actualité, une cotation, une fiche action
   ou une entrée de bibliothèque : modifie les tableaux ci-dessous.
   Chaque donnée porte un "statut" : "reel" (recherché sur le web à
   une date donnée), "demo" (données fictives pour illustrer
   l'interface) ou "manuel" (saisie éditoriale).
   ============================================================ */

// ---------- Marché : valeurs de repli (dernière clôture recherchée le 29/07/2026) ----------
// Au chargement, data.js tente de rafraîchir ces valeurs via /api/quotes
// (fonction serverless Vercel, voir api/quotes.js et ARCHITECTURE.md) : elles
// passent alors en statut DIFFÉRÉ avec la date et l'heure réelles. Si le
// backend est injoignable (aperçu local, GitHub Pages, panne fournisseur),
// ces valeurs de repli restent affichées avec leur statut d'origine.
// statut possibles : "reel" (recherché sur le web à une date donnée, affiché comme LAST CLOSE),
// "demo" (données fictives), "indisponible" (UNAVAILABLE).
const MARKET_DATA = [
  {symbol:'^FCHI', nom:'CAC 40', assetType:'index', exchange:'paris', valeur:'8 408', unite:'pts', devise:'EUR', variation:'−0.6%', sens:'down', source:'Yahoo Finance', statut:'reel', statusLabel:'LAST CLOSE', maj:'29/07/2026', heure:'17:35 CEST'},
  {symbol:'^GSPC', nom:'S&P 500', assetType:'index', exchange:'newyork', valeur:'7 316', unite:'pts', devise:'USD', variation:'−1.5%', sens:'down', source:'Yahoo Finance', statut:'reel', statusLabel:'LAST CLOSE', maj:'29/07/2026', heure:'16:00 EDT'},
  {symbol:'^IXIC', nom:'Nasdaq Composite', assetType:'index', exchange:'newyork', valeur:'24 443', unite:'pts', devise:'USD', variation:'−1.7%', sens:'down', source:'Yahoo Finance', statut:'reel', statusLabel:'LAST CLOSE', maj:'29/07/2026', heure:'16:00 EDT'},
  {symbol:'^DJI', nom:'Dow Jones', assetType:'index', exchange:'newyork', valeur:'51 594', unite:'pts', devise:'USD', variation:'−2.2%', sens:'down', source:'Yahoo Finance', statut:'reel', statusLabel:'LAST CLOSE', maj:'29/07/2026', heure:'16:00 EDT'},
  {symbol:'^STOXX50E', nom:'Euro Stoxx 50', assetType:'index', exchange:'paris', valeur:'6 249', unite:'pts', devise:'EUR', variation:'−0.65%', sens:'down', source:'Yahoo Finance', statut:'reel', statusLabel:'LAST CLOSE', maj:'29/07/2026', heure:'17:35 CEST'},
  {symbol:'BTC-USD', nom:'Bitcoin', assetType:'crypto', exchange:null, valeur:'64 360', unite:'', devise:'USD', variation:'+1.5%', sens:'up', source:'Yahoo Finance', statut:'reel', statusLabel:'LAST CLOSE', maj:'29/07/2026', heure:'23:59 UTC'},
  {symbol:'ETH-USD', nom:'Ethereum', assetType:'crypto', exchange:null, valeur:'1 913', unite:'', devise:'USD', variation:'+1.6%', sens:'up', source:'Yahoo Finance', statut:'reel', statusLabel:'LAST CLOSE', maj:'29/07/2026', heure:'23:59 UTC'},
  {symbol:'XAU', nom:'Or (once)', assetType:'commodity', exchange:null, valeur:'—', unite:'', devise:'USD', variation:'n.d.', sens:'na', source:'—', statut:'indisponible', statusLabel:'UNAVAILABLE', maj:'—', heure:'—'},
  {symbol:'BRENT', nom:'Pétrole Brent', assetType:'commodity', exchange:null, valeur:'~90', unite:'$/baril', devise:'USD', variation:'+6.6%', sens:'up', source:'Presse financière', statut:'reel', statusLabel:'LAST CLOSE', maj:'29/07/2026', heure:'—'},
];

// ---------- Marché étendu (onglet "Marchés" de la page Bourse) : ETF, Forex,
// Indices/Matières premières supplémentaires, Taux. Contrairement aux entrées
// ci-dessus, ces symboles ne sont JAMAIS interrogés par le poll global du
// bandeau (/api/quotes, toutes les 5 min sur tout le site) — uniquement à la
// demande via loadMarketCategoryQuotes() (scripts/data.js), quand l'utilisateur
// ouvre l'onglet Marchés ou une fiche marche.html correspondante (contrainte
// de performance du prompt "refonte Bourse"). statut initial 'chargement' :
// jamais présenté comme une vraie cotation tant que la donnée réelle n'est
// pas arrivée (voir applyOneQuoteToMarketItem). Tous les tickers ci-dessous
// vérifiés en direct contre Yahoo Finance le 2026-08-23.
const FOREX_PAIRS = [
  {symbol:'EURUSD=X', nom:'EUR / USD', assetType:'forex', exchange:null, valeur:'—', unite:'', devise:'USD', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'GBPUSD=X', nom:'GBP / USD', assetType:'forex', exchange:null, valeur:'—', unite:'', devise:'USD', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'USDJPY=X', nom:'USD / JPY', assetType:'forex', exchange:null, valeur:'—', unite:'', devise:'JPY', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'USDCHF=X', nom:'USD / CHF', assetType:'forex', exchange:null, valeur:'—', unite:'', devise:'CHF', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'AUDUSD=X', nom:'AUD / USD', assetType:'forex', exchange:null, valeur:'—', unite:'', devise:'USD', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
];
const EXTRA_INDICES = [
  {symbol:'^GDAXI', nom:'DAX', assetType:'index', exchange:null, valeur:'—', unite:'pts', devise:'EUR', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'^FTSE', nom:'FTSE 100', assetType:'index', exchange:'london', valeur:'—', unite:'pts', devise:'GBP', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'^N225', nom:'Nikkei 225', assetType:'index', exchange:'tokyo', valeur:'—', unite:'pts', devise:'JPY', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
];
const EXTRA_COMMODITIES = [
  {symbol:'SI=F', nom:'Argent', assetType:'commodity', exchange:null, valeur:'—', unite:'$/once', devise:'USD', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'HG=F', nom:'Cuivre', assetType:'commodity', exchange:null, valeur:'—', unite:'$/livre', devise:'USD', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'NG=F', nom:'Gaz naturel', assetType:'commodity', exchange:null, valeur:'—', unite:'$/MMBtu', devise:'USD', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'ZW=F', nom:'Blé', assetType:'commodity', exchange:null, valeur:'—', unite:'¢/boisseau', devise:'USD', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'KC=F', nom:'Café', assetType:'commodity', exchange:null, valeur:'—', unite:'¢/livre', devise:'USD', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
];
// Courbe des taux US (seule courbe fiable et gratuite trouvée via les sources
// déjà utilisées par le site — pas de courbe France/zone euro équivalente
// disponible sans fournisseur payant). unite:'%' fixé en dur : le "prix" Yahoo
// pour ces tickers EST directement le taux en pourcentage, jamais une devise.
const YIELD_CURVE_TICKERS = [
  {symbol:'^IRX', nom:'Taux US 13 semaines', assetType:'rate', exchange:null, valeur:'—', unite:'%', devise:'', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'^FVX', nom:'Taux US 5 ans', assetType:'rate', exchange:null, valeur:'—', unite:'%', devise:'', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'^TNX', nom:'Taux US 10 ans', assetType:'rate', exchange:null, valeur:'—', unite:'%', devise:'', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
  {symbol:'^TYX', nom:'Taux US 30 ans', assetType:'rate', exchange:null, valeur:'—', unite:'%', devise:'', variation:'n.d.', sens:'na', source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—'},
];
// Catalogue ETF curaté (même principe que STOCKS_DEMO : classification réelle
// en dur — émetteur/indice suivi/catégorie — le prix et les fondamentaux du
// fonds (frais, holdings...) sont toujours récupérés en direct, jamais ici).
// CW8.PA et EXS1.DE illustrent volontairement le cas UCITS (fondamentaux
// partiels côté Yahoo, voir /api/etf-profile) à côté des ETF US (fondamentaux
// complets) — ne pas retirer, c'est un cas réel à assumer honnêtement dans
// l'UI, pas à cacher en ne montrant que des ETF US.
const ETF_CATALOG = [
  {ticker:'SPY', nom:'SPDR S&P 500 ETF Trust', emetteur:'State Street', indiceSuivi:'S&P 500', categorie:'Actions US'},
  {ticker:'QQQ', nom:'Invesco QQQ Trust', emetteur:'Invesco', indiceSuivi:'Nasdaq 100', categorie:'Actions technologie US'},
  {ticker:'URTH', nom:'iShares MSCI World ETF', emetteur:'BlackRock (iShares)', indiceSuivi:'MSCI World', categorie:'Actions monde'},
  {ticker:'EEM', nom:'iShares MSCI Emerging Markets ETF', emetteur:'BlackRock (iShares)', indiceSuivi:'MSCI Emerging Markets', categorie:'Actions émergentes'},
  {ticker:'XLK', nom:'Technology Select Sector SPDR Fund', emetteur:'State Street', indiceSuivi:'S&P 500 Technology', categorie:'Actions sectoriel'},
  {ticker:'GLD', nom:'SPDR Gold Shares', emetteur:'State Street', indiceSuivi:"Cours de l'or physique", categorie:'Matières premières'},
  {ticker:'AGG', nom:'iShares Core U.S. Aggregate Bond ETF', emetteur:'BlackRock (iShares)', indiceSuivi:'Bloomberg US Aggregate Bond', categorie:'Obligataire'},
  {ticker:'TLT', nom:'iShares 20+ Year Treasury Bond ETF', emetteur:'BlackRock (iShares)', indiceSuivi:'ICE US Treasury 20+ Year Bond', categorie:'Obligataire'},
  {ticker:'CW8.PA', nom:'Amundi MSCI World UCITS ETF', emetteur:'Amundi', indiceSuivi:'MSCI World', categorie:'Actions monde'},
  {ticker:'EXS1.DE', nom:'iShares Core DAX UCITS ETF', emetteur:'BlackRock (iShares)', indiceSuivi:'DAX', categorie:'Actions Europe'},
].map(e => ({
  symbol:e.ticker, nom:e.nom, assetType:'etf', exchange:null, valeur:'—', unite:'', devise:'', variation:'n.d.', sens:'na',
  source:'Yahoo Finance', statut:'chargement', statusLabel:'CHARGEMENT', maj:'—', heure:'—',
  emetteur:e.emetteur, indiceSuivi:e.indiceSuivi, categorie:e.categorie
}));
// Ajout unique au tableau partagé MARKET_DATA — toujours en fin de tableau
// (jamais au début : scripts/pages/index.js:304 fait MARKET_DATA.slice(0,4)
// pour l'aperçu d'accueil et suppose que les 4 premiers restent les indices
// historiques). Coût nul : simple ajout en mémoire, aucun appel réseau tant
// que loadMarketCategoryQuotes() n'a pas été appelé.
MARKET_DATA.push(...FOREX_PAIRS, ...EXTRA_INDICES, ...EXTRA_COMMODITIES, ...YIELD_CURVE_TICKERS, ...ETF_CATALOG);

// ---------- Horaires des places boursières (pour le calcul ouvert/fermé, sans API) ----------
const MARKET_HOURS = {
  paris:   {label:'Euronext Paris', tz:'Europe/Paris',    open:9,  close:17.5},
  newyork: {label:'NYSE / Nasdaq',  tz:'America/New_York', open:9.5, close:16},
  london:  {label:'London Stock Exchange', tz:'Europe/London', open:8, close:16.5},
  tokyo:   {label:'Tokyo Stock Exchange', tz:'Asia/Tokyo', open:9, close:15},
};

// ---------- Fiches pédagogiques des valeurs du bandeau (page marche.html) ----------
const MARKET_INFO = {
  '^FCHI': {
    resume:"Le CAC 40 regroupe les 40 plus grandes capitalisations françaises cotées sur Euronext Paris (LVMH, TotalEnergies, Sanofi, Airbus...). Il est pondéré par la capitalisation flottante : plus une entreprise pèse en bourse, plus elle influence l'indice.",
    aRetenir:"Suivre le CAC 40, c'est prendre le pouls des grandes entreprises françaises. Attention toutefois : 40 valeurs ne représentent pas toute l'économie du pays.",
    lien:'bourse.html', lienLabel:'Explorer la bourse'
  },
  '^GSPC': {
    resume:"Le S&P 500 suit 500 grandes entreprises américaines, tous secteurs confondus. C'est l'indice de référence mondial : la majorité des ETF « monde » ou « USA » y sont fortement exposés.",
    aRetenir:"Quand on parle de « la performance du marché américain », on parle presque toujours du S&P 500.",
    lien:'bourse.html', lienLabel:'Explorer la bourse'
  },
  '^IXIC': {
    resume:"Le Nasdaq Composite regroupe l'ensemble des valeurs cotées au Nasdaq, avec une très forte pondération technologique (Apple, Microsoft, Nvidia...). Il est plus volatil que le S&P 500.",
    aRetenir:"Indice très sensible aux taux d'intérêt et aux perspectives de croissance : ses hausses comme ses baisses sont souvent amplifiées.",
    lien:'bourse.html', lienLabel:'Explorer la bourse'
  },
  '^DJI': {
    resume:"Le Dow Jones Industrial Average suit 30 grandes entreprises américaines. C'est le plus ancien indice au monde (1896), pondéré par les prix des actions et non par la capitalisation, une méthode aujourd'hui contestée.",
    aRetenir:"Célèbre mais peu représentatif : 30 valeurs pondérées par le prix, les professionnels lui préfèrent le S&P 500.",
    lien:'bourse.html', lienLabel:'Explorer la bourse'
  },
  '^STOXX50E': {
    resume:"L'Euro Stoxx 50 regroupe 50 très grandes capitalisations de la zone euro (ASML, LVMH, SAP, TotalEnergies...). C'est la référence pour suivre les grandes valeurs européennes en une seule mesure.",
    aRetenir:"Une exposition « zone euro » en un seul indice, mais concentrée sur les très grandes entreprises, sans les moyennes capitalisations.",
    lien:'bourse.html', lienLabel:'Explorer la bourse'
  },
  'BTC-USD': {
    resume:"Le Bitcoin est la première cryptomonnaie, créée en 2009. Son offre est plafonnée à 21 millions d'unités, ce qui alimente la thèse de « l'or numérique », sans garantie qu'elle se vérifie.",
    aRetenir:"Actif extrêmement volatil : des variations de ±10 % en une journée ne sont pas rares. N'y investir que ce qu'on peut se permettre de perdre.",
    lien:'crypto.html', lienLabel:'Explorer la crypto'
  },
  'ETH-USD': {
    resume:"L'ether est la monnaie du réseau Ethereum, plateforme de « contrats intelligents » sur laquelle reposent la majorité des applications décentralisées (DeFi, NFT...). Deuxième capitalisation crypto derrière le Bitcoin.",
    aRetenir:"Sa valeur dépend de l'usage réel du réseau Ethereum : un pari technologique, pas seulement monétaire, et tout aussi volatil que le Bitcoin.",
    lien:'crypto.html', lienLabel:'Explorer la crypto'
  },
  'XAU': {
    resume:"L'or est coté à l'once (environ 31,1 grammes), en dollars. Actif « refuge » historique : il ne verse aucun revenu, mais sert de protection perçue contre l'inflation et les crises.",
    aRetenir:"L'or ne produit ni dividende ni intérêt : sa performance repose uniquement sur l'évolution de son prix.",
    lien:'bibliotheque.html', lienLabel:'Voir la bibliothèque'
  },
  'BRENT': {
    resume:"Le Brent est le pétrole de référence en Europe, coté en dollars par baril (159 litres). Son prix reflète l'équilibre entre l'offre (OPEP+, production américaine) et la demande mondiale, et influence directement l'inflation.",
    aRetenir:"Quand le Brent monte durablement, le plein d'essence et les coûts de production suivent : c'est l'une des matières premières les plus surveillées au monde.",
    lien:'bibliotheque.html', lienLabel:'Voir la bibliothèque'
  }
};

// ---------- Actualités du jour (résumées, sources citées) ----------
// ===EXPORT:NEWS_DATA:START===
const NEWS_DATA = [
  {
    id:'fed-taux',
    titre:"La Fed maintient ses taux, Wall Street dévisse",
    categorie:"Banques centrales",
    lecture:"3 min",
    date:"29/07/2026",
    statut:"reel",
    resume:"La Réserve fédérale américaine a choisi de ne pas toucher à ses taux directeurs, alors que trois membres du comité auraient préféré une hausse.",
    points:[
      "Le Dow Jones a connu sa pire séance depuis avril 2025 (−2,2%).",
      "Les taux obligataires à 30 ans ont atteint leur plus haut niveau depuis 2007.",
      "Trois membres du comité de politique monétaire ont voté pour une hausse des taux."
    ],
    pourquoi:"Une banque centrale jugée trop attentiste face à l'inflation inquiète les investisseurs obligataires, ce qui fait grimper les taux longs et pèse sur la valorisation des actions.",
    impact:["Marchés actions américains","Obligations souveraines","Épargnants exposés aux taux variables"],
    source:"CNBC, Bloomberg",
    lien:"https://www.cnbc.com/2026/07/28/stock-market-today-live-updates.html"
  },
  {
    id:'nasdaq-correction',
    titre:"Les valeurs technologiques plongent, le Nasdaq 100 entre en correction",
    categorie:"Technologie",
    lecture:"2 min",
    date:"29/07/2026",
    statut:"reel",
    resume:"Le secteur des semi-conducteurs a lourdement chuté après un plongeon de l'indice sud-coréen Kospi, entraînant l'ensemble de la cote technologique.",
    points:[
      "Le Nasdaq 100 est repassé sous la barre des 10% de baisse depuis son sommet de juin.",
      "Le Kospi sud-coréen a perdu environ 6% sur la séance.",
      "Micron et Sandisk comptent parmi les titres les plus touchés."
    ],
    pourquoi:"Une correction technique signale que les investisseurs réévaluent des valorisations jugées trop optimistes sur l'intelligence artificielle et les semi-conducteurs.",
    impact:["Actions technologiques","ETF sectoriels tech","Investisseurs particuliers exposés au Nasdaq"],
    source:"Bloomberg",
    lien:"https://www.bloomberg.com/news/articles/2026-07-29/us-futures-tick-higher-as-semiconductor-stocks-climb-fed-looms"
  },
  {
    id:'petrole-tensions',
    titre:"Tensions au Moyen-Orient : le pétrole s'envole",
    categorie:"Matières premières",
    lecture:"2 min",
    date:"29/07/2026",
    statut:"reel",
    resume:"Une reprise des hostilités dans la région a fait grimper les cours du pétrole, le Brent dépassant les 90 dollars le baril.",
    points:[
      "Le Brent a gagné environ 6,6% sur la séance.",
      "Le WTI américain a progressé d'environ 6,4%.",
      "La hausse pèse sur des marchés déjà fragilisés par la décision de la Fed."
    ],
    pourquoi:"Une hausse durable du pétrole peut relancer l'inflation et compliquer la tâche des banques centrales, avec des répercussions sur le pouvoir d'achat.",
    impact:["Secteur énergétique","Compagnies aériennes","Consommateurs"],
    source:"Washington Post, Motley Fool",
    lien:"https://www.washingtonpost.com/business/2026/07/29/wall-street-stocks-dow-nasdaq/"
  },
  {
    id:'berkshire-cash',
    titre:"Berkshire Hathaway affiche une trésorerie record",
    categorie:"Entreprises",
    lecture:"2 min",
    date:"29/07/2026",
    statut:"reel",
    resume:"La société de Warren Buffett détiendrait désormais près de 397 milliards de dollars de liquidités, un niveau jamais atteint.",
    points:[
      "Le montant dépasse tous les records historiques du groupe.",
      "Certains analystes y voient un signal de prudence face aux valorisations actuelles.",
      "Aucune acquisition majeure n'a été annoncée en contrepartie."
    ],
    pourquoi:"Un tel niveau de cash chez l'un des investisseurs les plus suivis au monde alimente le débat sur une possible surchauffe des marchés.",
    impact:["Sentiment de marché global","Investisseurs suivant Warren Buffett"],
    source:"Motley Fool",
    lien:"https://www.fool.com/coverage/stock-market-today/2026/07/29/"
  },
  {
    id:'meta-microsoft',
    titre:"Résultats mitigés pour les géants de la tech américaine",
    categorie:"Entreprises",
    lecture:"2 min",
    date:"29/07/2026",
    statut:"reel",
    resume:"Meta a publié des prévisions jugées décevantes par les investisseurs, tandis que l'activité cloud de Microsoft affichait sa plus forte croissance en quatre ans.",
    points:[
      "L'action Meta a reculé après la clôture sur ses prévisions.",
      "Microsoft Azure a enregistré sa meilleure croissance trimestrielle depuis quatre ans.",
      "Les trajectoires contrastées illustrent une divergence croissante au sein des \"Sept Magnifiques\"."
    ],
    pourquoi:"Ces résultats montrent que la croissance liée à l'intelligence artificielle ne profite pas uniformément à toutes les grandes entreprises technologiques.",
    impact:["Actionnaires de Meta et Microsoft","ETF technologiques"],
    source:"Bloomberg",
    lien:"https://www.bloomberg.com/news/articles/2026-07-28/stock-market-today-dow-s-p-live-updates"
  }
];
// ===EXPORT:NEWS_DATA:END===

// ---------- Cours par niveau (Academy) ----------
// ===EXPORT:COURSES:START===
const COURSES = {
  debutant:[
    {
      title:"Action, obligation, ETF : le b.a.-ba",
      story:[
        {heading:"L'héritage de Léa", text:"Léa, 23 ans, vient de recevoir 3000€ de sa grand-mère. Elle ne veut pas les laisser dormir sur son compte courant, mais ne sait pas par où commencer."},
        {heading:"Trois avis différents", text:"Un ami lui parle d'\"acheter des actions\", un cousin lui vante les obligations d'État \"sans risque\", et son conseiller bancaire évoque un produit qui \"regroupe plein d'entreprises en une fois\". Léa veut miser sur un grand nombre d'entreprises sans avoir à les choisir une par une ni passer son temps à suivre chaque titre."}
      ],
      question:{categorie:'ETF', type:"qcm", prompt:"Vers quel type de produit Léa devrait-elle se tourner pour répondre à son besoin (miser sur beaucoup d'entreprises en une seule fois, sans les sélectionner à la main) ?", choix:["Une obligation d'État","Un ETF diversifié","Un unique titre bien choisi","Un compte à terme"], bonneReponse:1, explication:"Un ETF regroupe des dizaines ou des centaines d'entreprises dans un seul produit, ce qui répond exactement au besoin de Léa : miser sur un marché entier sans sélectionner les titres un par un."}
    },
    {
      title:"PEA, CTO, livret : où loger son argent",
      story:[
        {heading:"Le choix de Tom", text:"Tom a 2000€ de côté. Il hésite entre les laisser sur son Livret A, dont le taux est actuellement de 3% par an, ou ouvrir un PEA pour investir en actions européennes."},
        {heading:"Une première estimation", text:"Avant de se décider, Tom veut d'abord comprendre concrètement ce que lui rapporterait le Livret A s'il y laissait son argent une année entière, sans rien y toucher."}
      ],
      question:{categorie:'Livret A', type:"calcul", prompt:"Avec 2000€ placés sur un Livret A à 3% par an, combien d'intérêts Tom touche-t-il après 1 an (arrondis à l'euro) ?", unit:"€", reponse:60, tolerance:2, explication:"2000 × 3% = 60€. Le Livret A garantit le capital, mais son rendement reste modéré comparé à un placement en actions, en échange d'une sécurité totale et d'une disponibilité immédiate."}
    },
    {
      title:"Le risque, concrètement",
      story:[
        {heading:"Le premier investissement de Marc", text:"Marc place 2000€ en actions pour la première fois, convaincu que la bourse ne fait que monter sur le long terme."},
        {heading:"La première année difficile", text:"Dès sa première année, un choc économique fait chuter son placement de 18%. Marc panique un peu en consultant son compte, mais se souvient que son horizon de placement est de 15 ans."}
      ],
      question:{categorie:'Risque et volatilité', type:"calcul", prompt:"Après cette baisse de 18%, combien vaut approximativement le placement de Marc ?", unit:"€", reponse:1640, tolerance:15, explication:"2000 × (1 − 0,18) = 1640€. Une baisse, même marquée, ne signifie pas une perte définitive : c'est le risque normal d'un placement en actions, que le temps peut permettre de compenser, sans aucune garantie."}
    },
    {
      title:"Construire son premier plan financier",
      story:[
        {heading:"Le budget de Nora", text:"Nora gagne 1800€ par mois et dépense en moyenne 1600€. Avant d'investir quoi que ce soit, elle a lu qu'il valait mieux constituer une épargne de précaution."},
        {heading:"Un objectif chiffré", text:"Nora vise une épargne de précaution équivalente à 4 mois de ses dépenses courantes, pour pouvoir faire face à un imprévu sans avoir à revendre un futur placement en catastrophe."}
      ],
      question:{categorie:'Épargne', type:"calcul", prompt:"Quel montant total Nora doit-elle réunir pour atteindre une épargne de précaution de 4 mois de dépenses ?", unit:"€", reponse:6400, tolerance:100, explication:"1600 × 4 = 6400€. Une fois ce coussin de sécurité constitué, Nora pourra investir le reste de son épargne avec plus de sérénité, sans craindre de devoir tout retirer au premier imprévu."}
    }
  ],
  intermediaire:[
    {
      title:"Lire les ratios de base : P/E et dividende",
      story:[
        {heading:"Deux actions, un choix", text:"Yanis compare deux entreprises du même secteur avant d'investir. La première se négocie à 80€ et a généré un bénéfice de 4€ par action l'an dernier."},
        {heading:"Un premier repère", text:"Yanis a entendu parler du PER (Price Earning Ratio) comme premier indicateur pour juger si le prix d'une action est \"cher\" ou non par rapport à ses bénéfices."}
      ],
      question:{categorie:'Actions', type:"calcul", prompt:"Quel est le PER de cette action (cours de 80€ pour un bénéfice par action de 4€) ?", unit:"", reponse:20, tolerance:0.5, explication:"PER = cours / bénéfice par action = 80 / 4 = 20. Un PER de 20 signifie qu'il faudrait 20 années de bénéfices actuels pour \"rembourser\" le prix payé, à comparer à d'autres entreprises du même secteur pour juger si c'est élevé ou raisonnable."}
    },
    {
      title:"Diversifier par secteur et zone géographique",
      story:[
        {heading:"Le portefeuille de Chloé", text:"Chloé a placé 90% de son épargne dans l'action d'une seule entreprise technologique française, convaincue de son potentiel."},
        {heading:"Une annonce inattendue", text:"Un concurrent annonce un produit révolutionnaire qui menace directement l'activité de cette entreprise. Le cours plonge en quelques jours."}
      ],
      question:{categorie:'Diversification', type:"qcm", prompt:"Qu'est-ce que cette mésaventure illustre principalement sur la stratégie de Chloé ?", choix:["Elle n'aurait jamais dû investir en actions","En concentrant son épargne sur une seule entreprise, elle s'expose fortement à un choc qui lui est spécifique","Les actions technologiques sont interdites aux particuliers","Diversifier n'aurait rien changé au résultat"], bonneReponse:1, explication:"En ne détenant qu'un seul titre, Chloé subit de plein fouet tout événement propre à cette entreprise. Répartir son épargne entre plusieurs entreprises, secteurs et zones géographiques aurait limité l'impact de ce choc isolé sur l'ensemble de son portefeuille."}
    },
    {
      title:"Cycles économiques et taux d'intérêt",
      story:[
        {heading:"Le projet immobilier d'Hugo", text:"Hugo prépare un emprunt de 200 000€ sur 20 ans pour un achat immobilier. Au moment où il commence ses démarches, les taux sont à 3%."},
        {heading:"La banque centrale relève ses taux", text:"Le temps qu'Hugo finalise son dossier, la banque centrale relève ses taux directeurs pour lutter contre l'inflation. Sa banque lui propose désormais un taux de 4% sur le même prêt."}
      ],
      question:{categorie:'Crédit', type:"calcul", prompt:"À 4% sur 20 ans pour 200 000€ empruntés, quelle est la nouvelle mensualité approximative d'Hugo (arrondie à l'euro) ?", unit:"€/mois", reponse:1212, tolerance:20, explication:"Avec la formule de mensualité de crédit (capital × taux mensuel ⁄ (1 − (1+taux mensuel)⁻ⁿ)), la mensualité passe à environ 1212€/mois. Une hausse des taux directeurs se répercute directement sur le coût du crédit pour les ménages et les entreprises, ce qui peut freiner l'économie."}
    },
    {
      title:"Comparer des ETF entre eux",
      story:[
        {heading:"Deux trackers, un même indice", text:"Nina hésite entre deux ETF qui suivent exactement le même indice mondial. Le premier facture 0,07% de frais de gestion annuels, le second 0,45%."},
        {heading:"Un même capital, deux avenirs", text:"Elle prévoit d'investir 10 000€ dans l'un des deux ETF, sans tenir compte pour l'instant de la performance du marché, seulement de l'écart de frais entre les deux produits."}
      ],
      question:{categorie:'ETF', type:"calcul", prompt:"Sur 10 000€ investis pendant 1 an, quelle est la différence de frais payés entre l'ETF à 0,45% et celui à 0,07% (hors performance de marché) ?", unit:"€", reponse:38, tolerance:2, explication:"10 000 × (0,45% − 0,07%) = 10 000 × 0,38% = 38€. Un écart qui paraît minime en un an, mais qui se cumule chaque année sur toute la durée de détention : un critère de comparaison à ne pas négliger entre deux ETF qui suivent le même indice."}
    },
    {
      title:"SCPI : investir dans l'immobilier sans gérer de bien",
      story:[
        {heading:"Le choix de Sofia", text:"Sofia n'a ni le temps ni l'envie de gérer elle-même un bien locatif (recherche de locataires, travaux, impayés). Elle se tourne vers une SCPI qui affiche un taux de distribution de 4,5% pour l'année passée."},
        {heading:"Un premier placement", text:"Elle investit 10 000€ dans cette SCPI, en gardant à l'esprit que ce taux de distribution passé ne garantit en rien les revenus futurs."}
      ],
      question:{categorie:'SCPI', type:"calcul", prompt:"Sur la base de ce taux de distribution de 4,5%, quel revenu annuel brut Sofia peut-elle espérer sur ses 10 000€ investis (avant fiscalité) ?", unit:"€", reponse:450, tolerance:15, explication:"10 000 × 4,5% = 450€ par an, avant fiscalité et hors frais éventuels. Ce chiffre reste une estimation basée sur une performance passée, jamais une garantie contractuelle : le capital et les revenus futurs d'une SCPI ne sont jamais garantis."}
    }
  ],
  avance:[
    {
      title:"Analyse fondamentale vs technique",
      story:[
        {heading:"Deux méthodes, une même action", text:"Avant d'investir dans une entreprise, Karim épluche ses derniers résultats annuels, sa dette et ses perspectives de croissance sur plusieurs années."},
        {heading:"Un collègue, une autre approche", text:"Son collègue, lui, ne regarde que les courbes de prix et de volumes des dernières semaines pour repérer des tendances à court terme, sans jamais ouvrir un rapport annuel."}
      ],
      question:{categorie:'Actions', type:"qcm", prompt:"La méthode de Karim (résultats, dette, perspectives de l'entreprise) relève de quelle approche ?", choix:["L'analyse technique","L'analyse fondamentale","Le trading haute fréquence","L'arbitrage statistique"], bonneReponse:1, explication:"Karim pratique l'analyse fondamentale : il évalue l'entreprise elle-même (résultats, dette, perspectives). Son collègue pratique l'analyse technique, centrée sur les courbes de prix et volumes passés. Aucune des deux ne prédit l'avenir avec certitude."}
    },
    {
      title:"Volatilité, corrélation, allocation d'actifs",
      story:[
        {heading:"Un portefeuille très tech", text:"Élise détient déjà deux actions technologiques américaines, qui montent et descendent quasiment ensemble à chaque annonce du secteur."},
        {heading:"Une troisième idée", text:"Elle hésite entre ajouter une troisième action technologique similaire, ou plutôt un peu d'or, un actif dont l'évolution suit rarement celle des actions technologiques."}
      ],
      question:{categorie:'Diversification', type:"qcm", prompt:"Pourquoi ajouter l'or (peu corrélé aux actions technologiques déjà détenues) réduit-il davantage le risque global du portefeuille qu'une troisième action tech ?", choix:["Parce que l'or ne peut jamais perdre de valeur","Parce qu'un actif peu corrélé ne réagit pas de la même façon aux mêmes chocs de marché, ce qui amortit les variations globales du portefeuille","Parce que l'or est interdit en PEA, ce qui le rend plus sûr","Parce qu'une troisième action tech doublerait automatiquement le risque"], bonneReponse:1, explication:"Deux actifs fortement corrélés réagissent de façon similaire aux mêmes événements, ce qui n'apporte que peu de diversification. Un actif peu corrélé, comme l'or ici, réagit différemment, ce qui réduit l'amplitude globale des variations du portefeuille, sans pour autant éliminer tout risque."}
    },
    {
      title:"Lire les flux de trésorerie",
      story:[
        {heading:"Un résultat net flatteur", text:"Une entreprise affiche un résultat net de 5 M€ sur son dernier exercice, un chiffre qui impressionne à première vue."},
        {heading:"Un investissement massif", text:"En creusant les comptes, un analyste découvre que l'entreprise a aussi investi 4 M€ en capex (dépenses d'investissement) cette année-là, financés par son activité courante."}
      ],
      question:{categorie:'Bilan comptable', type:"calcul", prompt:"En simplifiant (résultat net − capex), quel est le flux de trésorerie disponible approximatif de cette entreprise, en M€ ?", unit:"M€", reponse:1, tolerance:0.3, explication:"5 − 4 = 1 M€. Le résultat net peut être flatté par des éléments comptables ; le flux de trésorerie disponible montre l'argent réellement généré par l'activité une fois les investissements déduits, souvent plus révélateur de la santé financière réelle d'une entreprise."}
    },
    {
      title:"Produits dérivés : ce qu'il faut comprendre avant tout",
      story:[
        {heading:"Un pari à effet de levier", text:"Amine ouvre une position à effet de levier x5 sur un actif, avec une mise de 1000€, séduit par la perspective de gains amplifiés."},
        {heading:"Le marché tourne mal", text:"Quelques jours plus tard, l'actif sous-jacent baisse de 8%. Amine découvre à quel point l'effet de levier amplifie aussi les pertes, pas seulement les gains."}
      ],
      question:{categorie:'Risque et volatilité', type:"calcul", prompt:"Avec un effet de levier x5 sur une mise de 1000€, si l'actif sous-jacent baisse de 8%, quelle est la perte sur la mise engagée ?", unit:"€", reponse:400, tolerance:20, explication:"1000 × 8% × 5 = 400€ de perte, soit 40% de la mise initiale pour une baisse de \"seulement\" 8% de l'actif sous-jacent. C'est tout le principe (et le danger) de l'effet de levier : il amplifie symétriquement gains et pertes, parfois au-delà du capital engagé selon les produits."}
    },
    {
      title:"Retraite et PER : préparer le long terme",
      story:[
        {heading:"Une tranche d'imposition élevée", text:"Camille est imposée à une tranche marginale de 30%. Son conseiller lui suggère de verser sur un PER pour réduire son impôt de l'année."},
        {heading:"Un versement réfléchi", text:"Camille décide de verser 3000€ sur son PER cette année, sachant que ce montant sera déductible de son revenu imposable, mais imposé à la sortie, à la retraite."}
      ],
      question:{categorie:'Retraite et PER', type:"calcul", prompt:"Avec une tranche marginale d'imposition de 30% et un versement déductible de 3000€, quelle économie d'impôt immédiate Camille obtient-elle ?", unit:"€", reponse:900, tolerance:30, explication:"3000 × 30% = 900€ d'économie d'impôt immédiate. En contrepartie, les sommes correspondantes seront en principe réintégrées à l'impôt sur le revenu à la sortie, à la retraite : l'intérêt de l'opération dépend surtout de l'écart entre la tranche d'imposition actuelle et celle anticipée au moment de la retraite."}
    }
  ],
  expert:[
    {
      title:"Introduction à la valorisation par DCF",
      story:[
        {heading:"Un flux unique à valoriser", text:"Un analyste doit estimer la valeur actuelle d'une entreprise qui, selon ses projections, générera un flux de trésorerie de 1 000 000€ dans 5 ans, et rien d'autre entre-temps pour simplifier l'exercice."},
        {heading:"Le choix du taux d'actualisation", text:"Il retient un taux d'actualisation de 8% par an, reflétant le risque et le coût du capital associés à cette entreprise."}
      ],
      question:{categorie:'Actions', type:"calcul", prompt:"Avec un flux de 1 000 000€ dans 5 ans et un taux d'actualisation de 8% par an, quelle est la valeur actuelle approximative de ce flux (arrondie au millier d'euros le plus proche) ?", unit:"€", reponse:680583, tolerance:5000, explication:"Valeur actuelle = 1 000 000 / (1,08)⁵ ≈ 680 583€. Plus le taux d'actualisation retenu est élevé, plus la valeur actuelle d'un flux futur est faible : la méthode DCF est donc très sensible aux hypothèses de taux et de croissance retenues."}
    },
    {
      title:"Analyse de sensibilité",
      story:[
        {heading:"Une valorisation, plusieurs scénarios", text:"Après avoir construit un premier modèle DCF, une analyste financière fait varier son hypothèse de croissance annuelle : 2%, 4%, puis 6%, en gardant tout le reste identique."},
        {heading:"Des résultats très différents", text:"Les trois scénarios donnent des valorisations sensiblement différentes pour la même entreprise, alors qu'un seul paramètre a changé à chaque fois."}
      ],
      question:{categorie:'Actions', type:"qcm", prompt:"Quel est l'intérêt principal de faire varier ainsi une hypothèse clé (comme la croissance) dans une analyse de sensibilité ?", choix:["Choisir artificiellement le scénario qui donne la valorisation la plus haute pour vendre plus cher","Mesurer la robustesse d'une valorisation et identifier les paramètres qui l'influencent le plus","Remplacer complètement le besoin de connaître les comptes de l'entreprise","Garantir que la valorisation obtenue sera exacte"], bonneReponse:1, explication:"Faire varier une hypothèse clé permet de mesurer à quel point la valorisation finale en dépend, et donc d'identifier les paramètres les plus déterminants, pas de garantir un résultat, ni de le manipuler pour arriver à une conclusion prédéfinie."}
    },
    {
      title:"Construction de portefeuille",
      story:[
        {heading:"Au-delà de la simple diversification", text:"Un gérant de portefeuille ne se contente pas de multiplier le nombre de lignes détenues : il cherche un équilibre précis entre rendement attendu, risque toléré et corrélations entre les actifs choisis."},
        {heading:"Un repère théorique", text:"Il utilise le concept de frontière efficiente pour situer différentes combinaisons possibles d'actifs, et choisir celle qui correspond le mieux à ses objectifs."}
      ],
      question:{categorie:'Diversification', type:"qcm", prompt:"Qu'offre, en théorie, un portefeuille situé sur la frontière efficiente ?", choix:["Une garantie de gain quel que soit le contexte de marché","Le meilleur rendement attendu possible pour un niveau de risque donné (ou le risque le plus faible pour un rendement donné)","L'absence totale de frais de gestion","Un accès automatique à tous les marchés mondiaux"], bonneReponse:1, explication:"La frontière efficiente représente, pour chaque niveau de risque, la combinaison d'actifs offrant le meilleur rendement attendu possible (ou inversement, le risque le plus faible pour un rendement donné) : un repère théorique, pas une garantie de résultat futur."}
    }
  ]
};
// ===EXPORT:COURSES:END===

// ---------- Banque de questions de quiz (par niveau et par thème) ----------
// ===EXPORT:QUIZ_BANK:START===
const QUIZ_BANK_FULL = [
  // ---- Budget ----
  {id:"q-budget-001", niveau:"debutant", categorie:"Budget", type:"qcm", question:"Que représente le \"reste à vivre\" dans un budget ?", choix:["Le montant total des revenus","Ce qu'il reste après les dépenses fixes et variables","Le montant épargné l'année précédente","Le salaire brut avant impôts"], bonneReponse:1, explication:"Le reste à vivre est ce qui reste disponible une fois toutes les dépenses (fixes et variables) déduites des revenus."},
  {id:"q-budget-002", niveau:"debutant", categorie:"Budget", type:"vraifaux", question:"Un budget doit toujours prévoir une marge pour les dépenses imprévues.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Prévoir une marge pour l'imprévu évite de devoir emprunter ou puiser dans son épargne de précaution au moindre imprévu."},
  {id:"q-budget-003", niveau:"intermediaire", categorie:"Budget", type:"situation", question:"Léa gagne 2000€/mois et dépense 1850€. Quel est son taux d'épargne ?", choix:["1,5%","7,5%","15%","25%"], bonneReponse:1, explication:"(2000-1850)/2000 = 150/2000 = 7,5%. Le taux d'épargne rapporte l'épargne réalisée aux revenus totaux."},

  // ---- Épargne ----
  {id:"q-epargne-001", niveau:"debutant", categorie:"Épargne", type:"qcm", question:"Pourquoi constitue-t-on une épargne de précaution avant d'investir ?", choix:["Pour payer moins d'impôts","Pour faire face aux imprévus sans revendre ses placements en catastrophe","Parce que c'est obligatoire légalement","Pour obtenir un meilleur taux de crédit"], bonneReponse:1, explication:"L'épargne de précaution évite d'avoir à vendre des placements (parfois à perte) en cas de coup dur."},
  {id:"q-epargne-002", niveau:"debutant", categorie:"Épargne", type:"qcm", question:"Combien de mois de dépenses courantes représente généralement une épargne de précaution recommandée ?", choix:["1 semaine","3 à 6 mois","2 ans","10 ans"], bonneReponse:1, explication:"3 à 6 mois de dépenses est un repère courant, à ajuster selon la stabilité des revenus de chacun."},
  {id:"q-epargne-003", niveau:"intermediaire", categorie:"Épargne", type:"qcm", question:"Quelle est la différence principale entre épargner et investir ?", choix:["Il n'y a aucune différence","Épargner vise la sécurité et la disponibilité, investir vise la croissance avec un risque de perte","Investir est toujours sans risque","Épargner rapporte toujours plus qu'investir"], bonneReponse:1, explication:"L'épargne privilégie la sécurité du capital et sa disponibilité rapide, l'investissement accepte un risque de perte en échange d'un potentiel de rendement supérieur."},

  // ---- Livret A et livrets réglementés ----
  {id:"q-livreta-001", niveau:"debutant", categorie:"Livret A", type:"qcm", question:"Quel est l'un des principaux avantages du Livret A ?", choix:["Un rendement garanti à 10%","Les intérêts ne sont pas soumis à l'impôt sur le revenu ni aux prélèvements sociaux","Il permet d'investir en actions","Il n'a aucun plafond de versement"], bonneReponse:1, explication:"Le Livret A bénéficie d'une exonération fiscale totale sur ses intérêts, mais son taux est modéré et son plafond est limité."},
  {id:"q-livreta-002", niveau:"debutant", categorie:"Livret A", type:"vraifaux", question:"Le taux du Livret A est fixé une fois pour toutes et ne change jamais.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Le taux du Livret A est révisé périodiquement par les pouvoirs publics, notamment en fonction de l'inflation."},
  {id:"q-livreta-003", niveau:"intermediaire", categorie:"Livret A", type:"qcm", question:"Le capital placé sur un Livret A est-il garanti ?", choix:["Non, il peut perdre de la valeur comme une action","Oui, le capital est garanti, seul son pouvoir d'achat réel dépend de l'inflation","Seulement si le montant dépasse 10 000€","Uniquement pour les moins de 25 ans"], bonneReponse:1, explication:"Le capital nominal du Livret A ne baisse jamais, mais si l'inflation dépasse le taux de rémunération, le pouvoir d'achat réel de l'épargne diminue."},

  // ---- Inflation ----
  {id:"q-inflation-001", niveau:"debutant", categorie:"Inflation", type:"qcm", question:"Que signifie une inflation de 3% sur un an ?", choix:["Les salaires augmentent de 3%","Le niveau général des prix augmente d'environ 3%","La bourse monte de 3%","Le taux du Livret A augmente de 3%"], bonneReponse:1, explication:"L'inflation mesure la hausse générale du niveau des prix, pas directement les salaires ou les marchés financiers."},
  {id:"q-inflation-002", niveau:"debutant", categorie:"Inflation", type:"situation", question:"Une épargne rapporte 1% par an alors que l'inflation est de 3%. Que se passe-t-il pour le pouvoir d'achat réel de cette épargne ?", choix:["Il augmente d'environ 4%","Il augmente d'environ 1%","Il diminue d'environ 2%","Il reste parfaitement stable"], bonneReponse:2, explication:"Le rendement réel approximatif est rendement nominal moins inflation, soit 1% - 3% = environ -2% : le pouvoir d'achat recule malgré un montant affiché en hausse."},
  {id:"q-inflation-003", niveau:"intermediaire", categorie:"Inflation", type:"qcm", question:"Quel organisme a notamment pour mission de maîtriser l'inflation dans la zone euro ?", choix:["La Bourse de Paris","La Banque centrale européenne (BCE)","L'Autorité des marchés financiers (AMF)","L'INSEE"], bonneReponse:1, explication:"La BCE ajuste notamment ses taux directeurs pour tenter de maintenir l'inflation proche de sa cible, généralement autour de 2% par an."},

  // ---- Intérêts simples ----
  {id:"q-intsimples-001", niveau:"debutant", categorie:"Intérêts simples", type:"qcm", question:"Avec des intérêts simples, sur quelle base les intérêts sont-ils calculés chaque année ?", choix:["Uniquement sur le capital de départ","Sur le capital de départ plus les intérêts déjà versés","Sur un montant aléatoire","Sur le taux d'inflation"], bonneReponse:0, explication:"Avec des intérêts simples, seul le capital initial génère des intérêts ; contrairement aux intérêts composés, les intérêts précédents n'en génèrent pas eux-mêmes."},
  {id:"q-intsimples-002", niveau:"intermediaire", categorie:"Intérêts simples", type:"calcul", question:"Un capital de 1000€ placé à intérêts simples de 5% par an rapporte combien d'intérêts après 3 ans ?", choix:["50€","150€","157,6€","300€"], bonneReponse:1, explication:"Intérêts simples = capital × taux × durée = 1000 × 0,05 × 3 = 150€."},

  // ---- Intérêts composés ----
  {id:"q-intcomposes-001", niveau:"debutant", categorie:"Intérêts composés", type:"qcm", question:"Que veut-on dire par \"les intérêts composés\" ?", choix:["Un impôt spécifique sur les gains boursiers","Les intérêts d'une année génèrent eux-mêmes des intérêts les années suivantes","Une commission bancaire fixe","Un type de prêt étudiant"], bonneReponse:1, explication:"Chaque année, les gains passés s'ajoutent au capital et génèrent à leur tour des intérêts : c'est cet effet cumulatif qui rend le temps précieux."},
  {id:"q-intcomposes-002", niveau:"intermediaire", categorie:"Intérêts composés", type:"qcm", question:"Pourquoi le temps est-il un facteur si important avec les intérêts composés ?", choix:["Parce que les taux baissent avec le temps","Parce que l'effet cumulatif des intérêts s'accélère sur la durée","Parce que l'inflation compense toujours les gains","Le temps n'a aucune importance particulière"], bonneReponse:1, explication:"Plus la durée est longue, plus l'effet boule de neige des intérêts composés pèse dans le résultat final, souvent davantage que le montant investi initialement."},
  {id:"q-intcomposes-003", niveau:"intermediaire", categorie:"Intérêts composés", type:"calcul", question:"Un capital de 1000€ placé à 5% par an en intérêts composés vaut environ combien après 2 ans ?", choix:["1050€","1100€","1102,5€","1150€"], bonneReponse:2, explication:"1000 × 1,05 × 1,05 = 1102,5€. La deuxième année, les intérêts se calculent aussi sur les intérêts de la première année."},

  // ---- Bourse ----
  {id:"q-bourse-001", niveau:"debutant", categorie:"Bourse", type:"qcm", question:"Qu'est-ce que la bourse, dans les grandes lignes ?", choix:["Une banque publique","Un marché où s'échangent des titres financiers comme des actions ou des obligations","Un impôt sur les revenus du capital","Un livret d'épargne réglementé"], bonneReponse:1, explication:"La bourse est un marché organisé où acheteurs et vendeurs échangent des titres financiers à un prix qui évolue selon l'offre et la demande."},
  {id:"q-bourse-002", niveau:"debutant", categorie:"Bourse", type:"vraifaux", question:"Le prix d'une action en bourse peut aussi bien monter que descendre.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Le cours d'une action varie constamment selon l'offre et la demande, les résultats de l'entreprise et le contexte économique."},
  {id:"q-bourse-003", niveau:"intermediaire", categorie:"Bourse", type:"qcm", question:"Que signifie un indice boursier comme le CAC 40 ?", choix:["Le nombre d'entreprises cotées en France","Un panier représentatif de grandes entreprises dont on suit la performance moyenne","Le taux d'intérêt de la Banque de France","Un impôt sur les plus-values boursières"], bonneReponse:1, explication:"Un indice boursier regroupe un panier d'entreprises représentatives, permettant de suivre la tendance générale d'un marché."},

  // ---- Actions ----
  {id:"q-actions-001", niveau:"debutant", categorie:"Actions", type:"qcm", question:"Que possède-t-on réellement en achetant une action ?", choix:["Une créance garantie par l'État","Une part de propriété d'une entreprise","Un droit de vote au parlement","Une assurance sur ses économies"], bonneReponse:1, explication:"Une action représente une part du capital d'une entreprise, avec un droit sur ses bénéfices, mais aucune garantie de gain."},
  {id:"q-actions-002", niveau:"debutant", categorie:"Actions", type:"qcm", question:"Qu'est-ce qu'un dividende ?", choix:["Un impôt prélevé sur les actions","Une part des bénéfices qu'une entreprise reverse à ses actionnaires","Le prix d'achat d'une action","Une pénalité en cas de revente rapide"], bonneReponse:1, explication:"Le dividende est une distribution de bénéfices aux actionnaires ; toutes les entreprises n'en versent pas."},
  {id:"q-actions-003", niveau:"intermediaire", categorie:"Actions", type:"qcm", question:"Que peut indiquer un PER (Price Earning Ratio) élevé pour une action ?", choix:["Que l'entreprise est en faillite","Que le marché anticipe une forte croissance, ou que la valorisation est tendue","Que l'action ne verse jamais de dividende","Que l'action est interdite au PEA"], bonneReponse:1, explication:"Un PER élevé peut refléter des attentes de croissance fortes, mais aussi signaler une valorisation exigeante par rapport aux bénéfices actuels."},

  // ---- ETF ----
  {id:"q-etf-001", niveau:"debutant", categorie:"ETF", type:"qcm", question:"Quel est l'un des principaux avantages d'un ETF diversifié ?", choix:["Il garantit un rendement positif", "Il permet d'investir dans plusieurs entreprises en un seul produit", "Il ne peut jamais perdre de valeur", "Il ne comporte aucuns frais"], bonneReponse:1, explication:"Un ETF peut regrouper plusieurs dizaines ou milliers d'actifs, mais il ne garantit pas un rendement positif : il suit un indice, à la hausse comme à la baisse."},
  {id:"q-etf-002", niveau:"debutant", categorie:"ETF", type:"qcm", question:"Un ETF qui suit le CAC 40 fait globalement quoi ?", choix:["Il choisit les meilleures actions à la main chaque semaine","Il réplique la performance des 40 entreprises de l'indice CAC 40","Il garantit un rendement fixe de 4%","Il investit uniquement en obligations d'État"], bonneReponse:1, explication:"Un ETF indiciel réplique passivement la performance de son indice de référence, sans sélection active des titres."},
  {id:"q-etf-003", niveau:"intermediaire", categorie:"ETF", type:"qcm", question:"Pourquoi les frais de gestion d'un ETF sont-ils souvent plus bas que ceux d'un fonds géré activement ?", choix:["Parce que la loi l'impose uniquement aux ETF","Parce qu'un ETF suit un indice de façon automatique, sans équipe de gestion active","Parce que les ETF ne sont pas réglementés","Parce que les ETF sont réservés aux professionnels"], bonneReponse:1, explication:"La gestion passive (suivre un indice) nécessite moins de ressources qu'une gestion active cherchant à sélectionner les meilleurs titres, d'où des frais généralement plus faibles."},

  // ---- Obligations ----
  {id:"q-obligations-001", niveau:"intermediaire", categorie:"Obligations", type:"qcm", question:"Qu'est-ce qu'une obligation, fondamentalement ?", choix:["Une part de propriété d'une entreprise","Un prêt fait à une entreprise ou un État, remboursé avec des intérêts","Une assurance obligatoire sur ses placements","Un type de compte bancaire"], bonneReponse:1, explication:"L'acheteur d'une obligation prête de l'argent à l'émetteur, qui s'engage à verser un intérêt (coupon) et à rembourser le capital à l'échéance."},
  {id:"q-obligations-002", niveau:"intermediaire", categorie:"Obligations", type:"qcm", question:"Que se passe-t-il généralement pour le prix d'une obligation existante quand les taux d'intérêt du marché montent ?", choix:["Son prix monte","Son prix baisse","Son prix reste rigoureusement identique","Elle devient automatiquement une action"], bonneReponse:1, explication:"Quand les taux montent, les nouvelles obligations offrent un coupon plus attractif, ce qui fait mécaniquement baisser le prix des obligations existantes à coupon plus faible."},
  {id:"q-obligations-003", niveau:"avance", categorie:"Obligations", type:"qcm", question:"Qu'appelle-t-on la sensibilité d'une obligation aux taux d'intérêt ?", choix:["Son rendement garanti","La mesure de l'ampleur de variation de son prix en réaction à une variation des taux","Son éligibilité au PEA","Sa notation de crédit"], bonneReponse:1, explication:"La sensibilité mesure l'impact d'une variation des taux sur le prix de l'obligation ; plus la maturité est longue, plus la sensibilité est généralement élevée."},

  // ---- Diversification ----
  {id:"q-diversification-001", niveau:"debutant", categorie:"Diversification", type:"qcm", question:"Pourquoi diversifie-t-on un portefeuille ?", choix:["Pour être certain de gagner davantage","Pour réduire la dépendance à un seul actif ou secteur","Parce que la loi l'impose","Pour payer moins d'impôts automatiquement"], bonneReponse:1, explication:"Diversifier répartit le risque entre plusieurs actifs, sans supprimer le risque de marché global."},
  {id:"q-diversification-002", niveau:"intermediaire", categorie:"Diversification", type:"qcm", question:"Pourquoi posséder trois ETF très corrélés entre eux ne diversifie-t-il pas beaucoup un portefeuille ?", choix:["Parce que trois ETF, c'est toujours trop","Parce qu'ils réagissent de façon très similaire aux mêmes événements de marché","Parce que les ETF sont interdits en diversification","Parce qu'il en faut au moins dix pour diversifier"], bonneReponse:1, explication:"La diversification est plus efficace quand les actifs choisis sont peu corrélés, c'est-à-dire qu'ils ne réagissent pas tous de la même façon aux mêmes événements."},
  {id:"q-diversification-003", niveau:"intermediaire", categorie:"Diversification", type:"qcm", question:"Diversifier un portefeuille élimine-t-il totalement le risque de perte ?", choix:["Oui, totalement","Non, cela réduit certains risques mais pas le risque de marché global","Oui, mais seulement pour les obligations","Non, cela augmente toujours le risque"], bonneReponse:1, explication:"La diversification réduit le risque spécifique à un actif ou secteur, mais un choc de marché global peut toujours affecter l'ensemble d'un portefeuille diversifié."},

  // ---- Risque et volatilité ----
  {id:"q-risque-001", niveau:"debutant", categorie:"Risque et volatilité", type:"qcm", question:"Que mesure la volatilité d'un actif financier ?", choix:["Sa probabilité de faire faillite","L'ampleur de ses variations de prix, à la hausse comme à la baisse","Le montant de ses dividendes","Sa capitalisation boursière"], bonneReponse:1, explication:"La volatilité reflète l'ampleur des mouvements de prix, pas directement le risque de faillite ou la taille de l'entreprise."},
  {id:"q-risque-002", niveau:"intermediaire", categorie:"Risque et volatilité", type:"qcm", question:"Un actif très volatil est-il automatiquement un mauvais investissement ?", choix:["Oui, toujours","Non, cela dépend de l'horizon de placement et de la tolérance au risque de l'investisseur","Oui, sauf pour les obligations d'État","Non, la volatilité n'a aucune importance"], bonneReponse:1, explication:"La volatilité est un facteur de risque à prendre en compte, mais son acceptabilité dépend de l'horizon de temps et des objectifs de chacun, pas d'une règle universelle."},
  {id:"q-risque-003", niveau:"avance", categorie:"Risque et volatilité", type:"qcm", question:"Qu'appelle-t-on le \"maximum drawdown\" d'un placement ?", choix:["Son rendement moyen annuel","La plus forte baisse observée entre un sommet et un creux sur une période donnée","Son montant minimum de versement","Son taux d'imposition maximal"], bonneReponse:1, explication:"Le maximum drawdown mesure la perte la plus sévère subie historiquement par un placement entre un pic et un creux, un indicateur utile pour juger du risque réellement vécu."},

  // ---- PEA ----
  {id:"q-pea-001", niveau:"intermediaire", categorie:"PEA", type:"qcm", question:"Le PEA permet notamment de...", choix:["Investir en actions européennes avec une fiscalité allégée après 5 ans","Garantir un capital sans aucun risque","Emprunter de l'argent sans intérêt","Éviter totalement tout impôt sur le revenu, quel que soit le placement"], bonneReponse:0, explication:"Le PEA offre un cadre fiscal avantageux après 5 ans de détention, mais le capital investi en actions n'est jamais garanti."},
  {id:"q-pea-002", niveau:"intermediaire", categorie:"PEA", type:"qcm", question:"Que se passe-t-il généralement en cas de retrait sur un PEA avant 5 ans ?", choix:["Aucune conséquence particulière","Cela entraîne en principe la clôture du plan, sauf exceptions prévues par la loi","Le plafond de versement double automatiquement","Le PEA devient un Livret A"], bonneReponse:1, explication:"Un retrait avant 5 ans entraîne en général la clôture du PEA (sauf cas particuliers prévus par la loi), ce qui en fait un outil pensé pour le long terme."},
  {id:"q-pea-003", niveau:"avance", categorie:"PEA", type:"qcm", question:"Le PEA permet-il d'investir dans n'importe quelle action mondiale ?", choix:["Oui, sans aucune restriction","Non, il est limité aux actions européennes (ou assimilées) éligibles","Oui, mais seulement pour les cryptoactifs","Non, il est réservé aux obligations d'État"], bonneReponse:1, explication:"Le PEA est limité aux actions de sociétés européennes (ou éligibles), contrairement à un compte-titres ordinaire (CTO) qui permet d'investir plus largement."},

  // ---- Assurance-vie ----
  {id:"q-assurancevie-001", niveau:"intermediaire", categorie:"Assurance-vie", type:"qcm", question:"Qu'est-ce qu'un fonds en euros au sein d'une assurance-vie ?", choix:["Un support en actions à haut risque","Un support au capital généralement garanti, au rendement plus modéré","Une cryptomonnaie européenne","Un livret réglementé"], bonneReponse:1, explication:"Le fonds en euros offre une garantie en capital (selon les conditions du contrat), avec un rendement généralement plus modéré que des unités de compte plus risquées."},
  {id:"q-assurancevie-002", niveau:"intermediaire", categorie:"Assurance-vie", type:"qcm", question:"Qu'est-ce qu'une \"unité de compte\" dans un contrat d'assurance-vie ?", choix:["Un support dont la valeur n'est jamais garantie et qui suit des actifs comme des actions ou de l'immobilier","Un livret d'épargne à taux fixe","Un synonyme du fonds en euros","Une unité monétaire propre à l'assurance-vie"], bonneReponse:0, explication:"Les unités de compte offrent un potentiel de performance plus élevé que le fonds en euros, mais sans garantie de capital, contrairement à celui-ci."},
  {id:"q-assurancevie-003", niveau:"avance", categorie:"Assurance-vie", type:"qcm", question:"Pourquoi l'assurance-vie devient-elle souvent plus intéressante fiscalement après 8 ans de détention ?", choix:["Parce qu'elle devient un PEA","Parce qu'un abattement annuel sur les gains s'applique lors des retraits à partir de cette durée","Parce que les frais de gestion disparaissent","Parce que le capital devient garanti à 100% à partir de 8 ans"], bonneReponse:1, explication:"Après 8 ans, un abattement annuel sur les plus-values lors des retraits s'applique, rendant la fiscalité généralement plus favorable qu'avant cette durée."},

  // ---- Immobilier ----
  {id:"q-immobilier-001", niveau:"intermediaire", categorie:"Immobilier", type:"qcm", question:"Que mesure le rendement locatif brut d'un bien immobilier ?", choix:["Les loyers annuels divisés par le prix d'achat","Le prix du bien divisé par sa surface","La plus-value réalisée à la revente","Le taux d'intérêt du crédit associé"], bonneReponse:0, explication:"Le rendement locatif brut rapporte les loyers annuels perçus au prix d'achat du bien, sans tenir compte des charges ni de la fiscalité."},
  {id:"q-immobilier-002", niveau:"intermediaire", categorie:"Immobilier", type:"qcm", question:"Pourquoi le rendement locatif net est-il souvent plus pertinent que le rendement brut ?", choix:["Parce qu'il est toujours plus élevé","Parce qu'il déduit les charges, la taxe foncière et parfois la fiscalité, donnant une image plus réaliste","Parce qu'il ignore le prix d'achat","Parce que la loi impose de ne communiquer que ce chiffre"], bonneReponse:1, explication:"Le rendement net tient compte des charges réelles (copropriété, taxe foncière, gestion...), offrant une vision plus fidèle de la rentabilité réelle."},
  {id:"q-immobilier-003", niveau:"avance", categorie:"Immobilier", type:"qcm", question:"Qu'est-ce que le cash-flow d'un investissement locatif financé à crédit ?", choix:["Le prix d'achat du bien","La différence entre les loyers encaissés et l'ensemble des charges, crédit inclus","Le montant de l'apport initial","La plus-value latente du bien"], bonneReponse:1, explication:"Le cash-flow mesure ce qu'il reste (ou manque) chaque mois une fois toutes les charges payées, crédit compris : un indicateur clé de la viabilité réelle d'un projet à effet de levier."},

  // ---- Crédit ----
  {id:"q-credit-001", niveau:"debutant", categorie:"Crédit", type:"qcm", question:"Qu'est-ce que le taux d'intérêt d'un crédit représente concrètement ?", choix:["Une pénalité en cas de retard uniquement","Le coût de l'emprunt payé au prêteur, en plus du capital remboursé","Un impôt prélevé par l'État","Une assurance obligatoire"], bonneReponse:1, explication:"Le taux d'intérêt rémunère le prêteur pour le risque pris et l'argent avancé ; il s'ajoute au remboursement du capital emprunté."},
  {id:"q-credit-002", niveau:"intermediaire", categorie:"Crédit", type:"qcm", question:"Toutes choses égales par ailleurs, qu'arrive-t-il à la mensualité d'un crédit si sa durée augmente ?", choix:["Elle augmente","Elle diminue, mais le coût total des intérêts tend à augmenter","Elle reste rigoureusement identique","Le crédit devient automatiquement gratuit"], bonneReponse:1, explication:"Allonger la durée réduit la mensualité, mais généralement au prix d'un coût total des intérêts plus élevé sur la durée totale du prêt."},
  {id:"q-credit-003", niveau:"intermediaire", categorie:"Crédit", type:"qcm", question:"Qu'est-ce que l'assurance emprunteur associée à un crédit immobilier ?", choix:["Une assurance sur la valeur de revente du bien","Une assurance qui prend en charge le remboursement en cas d'événements comme le décès ou l'invalidité","Une garantie de taux fixe à vie","Un impôt local obligatoire"], bonneReponse:1, explication:"L'assurance emprunteur protège la banque (et l'emprunteur) en cas de décès, invalidité ou incapacité, en prenant en charge tout ou partie du remboursement."},

  // ---- Fiscalité de base ----
  {id:"q-fiscalite-001", niveau:"intermediaire", categorie:"Fiscalité de base", type:"qcm", question:"Que désigne le terme \"plus-value\" en matière d'investissement ?", choix:["Le montant initial investi","Le gain réalisé entre le prix d'achat et le prix de vente d'un actif","Un type d'impôt sur le revenu du travail","Un synonyme de dividende"], bonneReponse:1, explication:"La plus-value correspond à la différence positive entre le prix de vente et le prix d'achat d'un actif ; elle est généralement soumise à une fiscalité spécifique."},
  {id:"q-fiscalite-002", niveau:"intermediaire", categorie:"Fiscalité de base", type:"qcm", question:"Sur un compte-titres ordinaire (CTO) en France, les gains sont généralement soumis à quoi, sauf option contraire ?", choix:["Aucune imposition","Le prélèvement forfaitaire unique (PFU), autour de 30%","Un impôt fixe de 5%","La TVA"], bonneReponse:1, explication:"Le prélèvement forfaitaire unique (souvent appelé \"flat tax\"), autour de 30% (impôt et prélèvements sociaux compris), s'applique par défaut aux gains d'un CTO, sauf option pour le barème progressif si plus avantageux."},
  {id:"q-fiscalite-003", niveau:"avance", categorie:"Fiscalité de base", type:"qcm", question:"Pourquoi comparer la fiscalité de plusieurs enveloppes (PEA, assurance-vie, CTO) avant d'investir peut-il avoir un impact significatif ?", choix:["Parce que la fiscalité n'a jamais d'impact réel","Parce qu'à rendement brut égal, la fiscalité peut fortement modifier le rendement net final","Parce que seule l'assurance-vie est fiscalisée","Parce que la loi interdit de comparer les enveloppes"], bonneReponse:1, explication:"Deux placements au même rendement brut peuvent aboutir à des résultats nets très différents selon l'enveloppe fiscale utilisée et sa durée de détention."},

  // ---- Crypto : Blockchain (comment fonctionne la technologie) ----
  {id:"q-crypto-blockchain-001", niveau:"debutant", categorie:"Blockchain", type:"qcm", question:"Qu'est-ce qui rend une blockchain \"décentralisée\" ?", choix:["Une seule entreprise valide toutes les transactions", "Les transactions sont validées par un réseau d'ordinateurs, sans autorité centrale unique", "Elle fonctionne uniquement sur un seul serveur", "Elle est gérée par une banque centrale"], bonneReponse:1, explication:"Une blockchain publique s'appuie sur un réseau de participants (nœuds) qui valident collectivement les transactions, sans dépendre d'un intermédiaire central unique comme une banque."},
  {id:"q-crypto-blockchain-002", niveau:"debutant", categorie:"Blockchain", type:"qcm", question:"Que contrôle réellement la \"clé privée\" d'un portefeuille crypto ?", choix:["Uniquement l'accès à un mot de passe de secours", "L'accès et le contrôle total des fonds associés à cette adresse", "Rien, c'est juste un identifiant public", "Le taux de change de la cryptomonnaie"], bonneReponse:1, explication:"Quiconque détient la clé privée peut dépenser les fonds associés à l'adresse correspondante — elle ne doit jamais être partagée, contrairement à la clé publique (l'adresse), qui peut être communiquée sans risque."},
  {id:"q-crypto-blockchain-003", niveau:"intermediaire", categorie:"Blockchain", type:"qcm", question:"Quelle est la différence principale entre la preuve de travail (Proof of Work) et la preuve d'enjeu (Proof of Stake) ?", choix:["Il n'y a aucune différence, ce sont des synonymes", "La preuve de travail valide les blocs par un calcul informatique coûteux, la preuve d'enjeu par le blocage de cryptoactifs en garantie", "La preuve d'enjeu n'existe que pour les monnaies fiduciaires", "La preuve de travail est toujours plus rapide"], bonneReponse:1, explication:"La preuve de travail (ex. Bitcoin) demande une puissance de calcul importante pour valider un bloc. La preuve d'enjeu (ex. Ethereum depuis 2022) demande aux validateurs de bloquer des cryptoactifs en garantie, avec une consommation énergétique bien plus faible."},
  {id:"q-crypto-blockchain-004", niveau:"intermediaire", categorie:"Blockchain", type:"vraifaux", question:"Une transaction confirmée sur une blockchain publique peut généralement être annulée par un simple appel au support technique.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Les transactions blockchain sont en général irréversibles une fois confirmées : il n'existe pas d'équivalent à un rappel bancaire ou une opposition sur carte."},
  {id:"q-crypto-blockchain-005", niveau:"avance", categorie:"Blockchain", type:"qcm", question:"Qu'est-ce qu'un \"fork\" (bifurcation) dans l'histoire d'une blockchain ?", choix:["Un type de portefeuille matériel", "Une scission du protocole créant deux versions distinctes de la chaîne, parfois deux actifs différents", "Une simple mise à jour de sécurité sans conséquence", "Un synonyme de transaction annulée"], bonneReponse:1, explication:"Un fork survient quand une communauté ne s'accorde pas sur une évolution du protocole : la chaîne se scinde en deux versions, ce qui peut créer un nouvel actif distinct (ex. Bitcoin / Bitcoin Cash en 2017)."},

  // ---- Crypto : Tokenomics (conception économique d'un token) ----
  {id:"q-crypto-tokenomics-001", niveau:"debutant", categorie:"Tokenomics", type:"qcm", question:"Que désigne le terme \"tokenomics\" ?", choix:["Le cours en temps réel d'un token", "La conception économique d'un token : son offre, sa distribution et son utilité", "Un type de portefeuille sécurisé", "Une taxe appliquée aux cryptomonnaies"], bonneReponse:1, explication:"La tokenomics regroupe les règles économiques d'un token : combien en existe (offre), comment il est distribué, et à quoi il sert réellement dans son écosystème."},
  {id:"q-crypto-tokenomics-002", niveau:"debutant", categorie:"Tokenomics", type:"qcm", question:"Que signifie un \"supply maximum\" plafonné, comme les 21 millions de bitcoins ?", choix:["Le nombre de bitcoins qui seront émis chaque année", "Le nombre total d'unités qui pourront exister au maximum, jamais dépassé", "Le nombre de bitcoins actuellement en circulation", "Le prix maximum autorisé par unité"], bonneReponse:1, explication:"Le supply maximum est un plafond théorique définitif inscrit dans le protocole — le nombre d'unités en circulation à un instant donné (supply circulant) peut lui rester inférieur pendant des décennies."},
  {id:"q-crypto-tokenomics-003", niveau:"intermediaire", categorie:"Tokenomics", type:"qcm", question:"Pourquoi un prix unitaire très bas ne signifie-t-il pas qu'un token est \"bon marché\" ?", choix:["Un prix bas garantit toujours une hausse future", "Le prix unitaire dépend aussi du nombre total de tokens en circulation (capitalisation = prix × offre en circulation)", "Le prix unitaire n'a jamais d'importance", "Les tokens à prix bas sont toujours des arnaques"], bonneReponse:1, explication:"Un token à 0,001€ avec 1000 milliards d'unités en circulation peut avoir une capitalisation bien supérieure à un token à 500€ avec peu d'unités : le prix unitaire seul ne dit rien de la valorisation réelle."},
  {id:"q-crypto-tokenomics-004", niveau:"avance", categorie:"Tokenomics", type:"qcm", question:"Pourquoi le calendrier de \"déblocage\" (vesting) des tokens réservés aux fondateurs/investisseurs est-il un élément à surveiller ?", choix:["Il n'a aucun effet sur le marché", "D'importants déblocages peuvent augmenter fortement l'offre disponible à la vente, exerçant une pression baissière sur le prix", "Il garantit une hausse du prix à chaque déblocage", "Il ne concerne que les cryptomonnaies interdites"], bonneReponse:1, explication:"Quand des tokens jusque-là bloqués deviennent disponibles, leurs détenteurs (souvent l'équipe ou des investisseurs early-stage) peuvent les vendre, augmentant l'offre sur le marché — un facteur de risque distinct de la seule évolution de la demande."},
  {id:"q-crypto-tokenomics-005", niveau:"avance", categorie:"Tokenomics", type:"vraifaux", question:"Un token de gouvernance donne généralement un droit de vote sur certaines décisions du protocole, mais pas nécessairement un droit sur ses revenus.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Un token de gouvernance sert avant tout à voter des propositions (paramètres, évolutions du protocole) — cela ne lui donne pas automatiquement un droit sur les revenus générés, contrairement à une action qui peut ouvrir droit à un dividende."},

  // ---- Crypto : DeFi (finance décentralisée) ----
  {id:"q-crypto-defi-001", niveau:"debutant", categorie:"DeFi", type:"qcm", question:"Que désigne la \"DeFi\" (finance décentralisée) ?", choix:["Les services bancaires traditionnels en ligne", "Des services financiers (prêt, échange, épargne...) fonctionnant via des contrats intelligents, sans intermédiaire central", "Une réglementation européenne sur les cryptomonnaies", "Un type de carte bancaire crypto"], bonneReponse:1, explication:"La DeFi désigne un ensemble d'applications financières construites sur blockchain (prêt, emprunt, échange d'actifs...) qui fonctionnent via des contrats intelligents plutôt que via une banque ou un courtier traditionnel."},
  {id:"q-crypto-defi-002", niveau:"debutant", categorie:"DeFi", type:"qcm", question:"Qu'est-ce qu'un \"contrat intelligent\" (smart contract) ?", choix:["Un contrat papier signé électroniquement", "Un programme informatique qui s'exécute automatiquement sur une blockchain quand certaines conditions sont remplies", "Un avocat spécialisé en cryptomonnaies", "Un type d'assurance obligatoire pour investir en crypto"], bonneReponse:1, explication:"Un contrat intelligent est un code déployé sur une blockchain qui exécute automatiquement des règles prédéfinies (ex. \"si X paie Y, alors transférer Z\"), sans intervention humaine à l'exécution."},
  {id:"q-crypto-defi-003", niveau:"intermediaire", categorie:"DeFi", type:"qcm", question:"À quoi sert une \"pool de liquidité\" dans un échange décentralisé ?", choix:["À stocker les mots de passe des utilisateurs", "À réunir les fonds d'utilisateurs pour permettre les échanges d'actifs sans carnet d'ordres centralisé", "À calculer les impôts dus sur les gains crypto", "À garantir un rendement fixe sans aucun risque"], bonneReponse:1, explication:"Une pool de liquidité regroupe les actifs déposés par des utilisateurs (fournisseurs de liquidité) : ces réserves permettent à d'autres utilisateurs d'échanger des actifs directement contre la pool, sans acheteur/vendeur en face à face."},
  {id:"q-crypto-defi-004", niveau:"avance", categorie:"DeFi", type:"qcm", question:"Qu'est-ce que la \"perte impermanente\" (impermanent loss) pour un fournisseur de liquidité ?", choix:["Une perte garantie et systématique dans tous les cas", "Un manque à gagner qui apparaît quand le prix des actifs déposés évolue différemment de celui au moment du dépôt, comparé au fait de simplement les avoir gardés", "Des frais de transaction fixes", "Un bug rendant les fonds définitivement inaccessibles"], bonneReponse:1, explication:"Si les prix relatifs des deux actifs d'une pool divergent après le dépôt, la valeur récupérée en retirant ses fonds peut être inférieure à celle obtenue en ayant simplement conservé les actifs sans les déposer — un risque spécifique à la fourniture de liquidité, distinct du risque de marché classique."},
  {id:"q-crypto-defi-005", niveau:"intermediaire", categorie:"DeFi", type:"vraifaux", question:"Sur un échange décentralisé (DEX), une entreprise centrale garde généralement la garde de tes fonds pendant que tu échanges.", choix:["Vrai","Faux"], bonneReponse:1, explication:"C'est la définition d'un échange centralisé (CEX). Sur un DEX, les échanges passent par des contrats intelligents : l'utilisateur garde en principe le contrôle de ses fonds via son propre portefeuille, sans dépôt préalable chez un tiers."},

  // ---- Crypto : Sécurité (garde des fonds, arnaques) ----
  {id:"q-crypto-securite-001", niveau:"debutant", categorie:"Sécurité crypto", type:"qcm", question:"Les fonds détenus sur une plateforme d'échange de cryptoactifs bénéficient-ils d'une garantie publique comme un compte bancaire classique ?", choix:["Oui, systématiquement","Non, généralement aucune garantie publique équivalente n'existe en cas de faillite de la plateforme","Oui, mais seulement au-dessus de 100 000€","Oui, via le Livret A"], bonneReponse:1, explication:"Contrairement à un dépôt bancaire couvert par une garantie des dépôts, les cryptoactifs détenus sur une plateforme ne bénéficient généralement pas d'une garantie publique équivalente en cas de faillite."},
  {id:"q-crypto-securite-002", niveau:"debutant", categorie:"Sécurité crypto", type:"vraifaux", question:"Les fonds détenus sur une plateforme d'échange crypto bénéficient de la même garantie des dépôts qu'un compte bancaire classique.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Contrairement à un dépôt bancaire couvert par une garantie des dépôts, les cryptoactifs sur une plateforme ne bénéficient généralement d'aucune garantie publique équivalente."},
  {id:"q-crypto-securite-003", niveau:"intermediaire", categorie:"Sécurité crypto", type:"qcm", question:"Que signifie l'expression \"Not your keys, not your coins\" ?", choix:["Les clés privées n'ont aucune importance pratique", "Si tu ne détiens pas toi-même les clés privées (ex. fonds laissés sur une plateforme), tu ne contrôles pas réellement tes cryptoactifs", "Seules les banques peuvent détenir des clés privées", "C'est un slogan publicitaire sans fondement technique"], bonneReponse:1, explication:"Laisser ses fonds sur une plateforme d'échange revient à faire confiance à cette plateforme pour la garde de tes actifs : en cas de faillite, de piratage ou de blocage des retraits, tu dépends entièrement d'elle — d'où l'importance, pour qui le souhaite, de gérer soi-même ses clés."},
  {id:"q-crypto-securite-004", niveau:"intermediaire", categorie:"Sécurité crypto", type:"qcm", question:"Que faut-il faire de sa \"phrase de récupération\" (seed phrase) d'un portefeuille crypto ?", choix:["La partager avec le support technique si on te le demande", "Ne jamais la communiquer à personne, et la conserver hors ligne dans un endroit sûr", "La publier en ligne pour la sauvegarder", "L'envoyer par email à soi-même pour ne pas la perdre"], bonneReponse:1, explication:"Quiconque connaît la phrase de récupération peut reconstituer les clés privées et donc accéder à tous les fonds du portefeuille — aucune plateforme ou support légitime ne la demande jamais, et la stocker en ligne (email, cloud) l'expose au piratage."},
  {id:"q-crypto-securite-005", niveau:"debutant", categorie:"Sécurité crypto", type:"vraifaux", question:"Un rendement crypto garanti \"sans aucun risque\", promis par une offre trouvée en ligne, est un signal d'alerte fiable d'arnaque potentielle.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Aucun placement légitime, crypto ou non, ne peut garantir un rendement élevé sans risque : c'est l'un des signaux les plus fiables d'une arnaque financière, un schéma de Ponzi ou équivalent."},

  // ---- Crypto : Trading (mécanismes spécifiques au marché crypto) ----
  {id:"q-crypto-trading-001", niveau:"debutant", categorie:"Trading crypto", type:"qcm", question:"Quelle est une caractéristique importante à connaître sur les cryptoactifs avant d'y toucher ?", choix:["Leur valeur est toujours stable","Ils peuvent connaître des variations de prix extrêmes en peu de temps","Ils sont garantis par l'État français","Ils ne présentent aucun risque de perte"], bonneReponse:1, explication:"Les cryptoactifs sont réputés pour leur forte volatilité, avec des variations parfois extrêmes sur de courtes périodes, sans garantie publique de la valeur."},
  {id:"q-crypto-trading-002", niveau:"debutant", categorie:"Trading crypto", type:"qcm", question:"Contrairement à une bourse d'actions classique, à quel rythme le marché crypto fonctionne-t-il généralement ?", choix:["Uniquement en semaine, aux heures de bureau", "En continu, 24h/24 et 7j/7, sans jour de clôture", "Seulement le week-end", "Une heure par jour"], bonneReponse:1, explication:"Le marché crypto ne connaît pas d'heures d'ouverture/fermeture comme une bourse traditionnelle : les prix peuvent bouger fortement à tout moment, y compris la nuit ou le week-end, sans que l'investisseur puisse réagir immédiatement."},
  {id:"q-crypto-trading-003", niveau:"intermediaire", categorie:"Trading crypto", type:"qcm", question:"Pourquoi le trading avec effet de levier (marge) est-il considéré comme particulièrement risqué en crypto ?", choix:["Il élimine tout risque de perte", "Il amplifie à la fois les gains et les pertes, avec un risque de liquidation forcée de la position en cas de mouvement défavorable", "Il est réservé aux professionnels et interdit aux particuliers", "Il garantit un remboursement en cas de perte"], bonneReponse:1, explication:"Emprunter pour trader plus gros amplifie les résultats dans les deux sens ; sur un marché aussi volatil que la crypto, une position à effet de levier peut être liquidée (fermée de force, perte du capital engagé) très rapidement en cas de mouvement défavorable."},
  {id:"q-crypto-trading-004", niveau:"avance", categorie:"Trading crypto", type:"qcm", question:"Qu'est-ce que le \"slippage\" (glissement de prix) lors d'un ordre crypto ?", choix:["Un frais fixe prélevé par la plateforme", "L'écart entre le prix attendu au moment de passer l'ordre et le prix réellement exécuté, souvent plus marqué sur les actifs peu liquides", "Un bonus offert par certaines plateformes", "Un synonyme de perte impermanente"], bonneReponse:1, explication:"Sur un marché peu liquide ou lors d'un ordre de grande taille, le prix réellement obtenu peut différer sensiblement du prix affiché au moment de valider l'ordre — un risque à connaître, en particulier sur les petites capitalisations."},
  {id:"q-crypto-trading-005", niveau:"intermediaire", categorie:"Trading crypto", type:"vraifaux", question:"Un ordre \"au marché\" (market order) garantit un prix d'exécution précis, contrairement à un ordre à cours limité.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Un ordre au marché garantit une exécution rapide, mais pas un prix précis (il s'exécute au meilleur prix disponible à l'instant, avec un risque de slippage) ; c'est l'ordre à cours limité qui fixe un prix maximal/minimal, au prix d'une exécution non garantie."},

  // ---- Crypto : Analyse (évaluer un projet ou un actif) ----
  {id:"q-crypto-analyse-001", niveau:"avance", categorie:"Analyse crypto", type:"qcm", question:"Pourquoi la valorisation de nombreux cryptoactifs est-elle jugée difficile à justifier par certains analystes ?", choix:["Parce qu'ils sont cotés en continu 24h/24","Parce que beaucoup n'ont ni revenus ni utilité clairement établie, contrairement à une action adossée à une entreprise","Parce que leur code source est toujours secret","Parce qu'ils sont interdits dans la plupart des pays"], bonneReponse:1, explication:"Une action peut être valorisée à partir des bénéfices ou des actifs d'une entreprise ; beaucoup de cryptoactifs manquent de cet ancrage, rendant leur valorisation plus spéculative."},
  {id:"q-crypto-analyse-002", niveau:"intermediaire", categorie:"Analyse crypto", type:"qcm", question:"Qu'est-ce qu'un \"whitepaper\" dans l'univers crypto, et quelle prudence appliquer en le lisant ?", choix:["Un document officiel garanti par un régulateur", "Un document publié par l'équipe du projet décrivant sa technologie et son fonctionnement — à lire de façon critique, car auto-publié et non vérifié de façon indépendante par défaut", "Un contrat d'assurance obligatoire", "Un audit de sécurité toujours réalisé par un tiers indépendant"], bonneReponse:1, explication:"Un whitepaper est rédigé par les créateurs du projet eux-mêmes pour présenter leur vision : c'est une source d'information utile, mais pas une preuve d'exécution ni un document audité par une autorité indépendante — à lire avec un regard critique, jamais comme une garantie."},
  {id:"q-crypto-analyse-003", niveau:"intermediaire", categorie:"Analyse crypto", type:"qcm", question:"Que peut suggérer un nombre élevé d'adresses actives et un volume de transactions soutenu pour un projet crypto ?", choix:["Une garantie de hausse future du prix", "Un signe d'utilisation/adoption réelle du réseau — un indice parmi d'autres, jamais une garantie de performance future", "Que le projet est nécessairement une arnaque", "Que le prix ne peut plus baisser"], bonneReponse:1, explication:"Les données on-chain (adresses actives, volume de transactions) donnent un indice sur l'usage réel d'un réseau, à croiser avec d'autres éléments (tokenomics, équipe, concurrence) — ce n'est en aucun cas une garantie que le prix va monter."},
  {id:"q-crypto-analyse-004", niveau:"debutant", categorie:"Analyse crypto", type:"qcm", question:"Quelle est la différence entre \"offre en circulation\" et \"offre totale\" d'un cryptoactif ?", choix:["Ce sont des synonymes stricts", "L'offre en circulation est ce qui est déjà disponible sur le marché ; l'offre totale inclut aussi les unités créées mais pas encore en circulation (verrouillées, réservées...)", "L'offre totale est toujours inférieure à l'offre en circulation", "Ces notions ne s'appliquent qu'aux actions, jamais aux cryptoactifs"], bonneReponse:1, explication:"L'offre en circulation compte les unités réellement disponibles sur le marché aujourd'hui ; l'offre totale (voire l'offre maximum) inclut des unités pas encore émises ou encore bloquées, qui pourraient arriver sur le marché plus tard et diluer la valeur."},

  // ---- Arnaques financières ----
  {id:"q-arnaques-001", niveau:"debutant", categorie:"Arnaques financières", type:"qcm", question:"Quel est l'un des signaux d'alerte les plus fiables d'une arnaque financière ?", choix:["Un rendement modéré expliqué clairement","La promesse d'un rendement élevé garanti, sans aucun risque","Un document d'information réglementaire disponible","Un enregistrement vérifiable auprès de l'AMF"], bonneReponse:1, explication:"Aucun placement légitime ne peut garantir un rendement élevé sans risque : c'est l'un des signaux d'alerte les plus fiables d'une arnaque."},
  {id:"q-arnaques-002", niveau:"debutant", categorie:"Arnaques financières", type:"qcm", question:"Que doit faire sonner l'alarme dans une offre d'investissement qui insiste beaucoup sur l'urgence de décider \"maintenant ou jamais\" ?", choix:["Rien, c'est une pratique commerciale normale et sans risque","C'est une technique de manipulation classique qui pousse à décider sans réfléchir","C'est un gage de sérieux de l'offre","Cela prouve que l'offre est réglementée"], bonneReponse:1, explication:"Créer une urgence artificielle est une technique classique pour empêcher la réflexion et la vérification préalable, souvent utilisée dans les arnaques."},
  {id:"q-arnaques-003", niveau:"intermediaire", categorie:"Arnaques financières", type:"qcm", question:"Avant d'investir via une plateforme en France, quelle vérification de base est recommandée ?", choix:["Vérifier uniquement le design du site internet","Vérifier que la plateforme est enregistrée ou agréée auprès de l'AMF ou de l'ACPR","Demander l'avis de ses proches uniquement","Aucune vérification n'est utile"], bonneReponse:1, explication:"Vérifier l'enregistrement ou l'agrément d'un acteur auprès des régulateurs (AMF, ACPR) est une première étape de vigilance simple et accessible à tous."},

  // ---- Psychologie de l'investisseur ----
  {id:"q-psychologie-001", niveau:"intermediaire", categorie:"Psychologie de l'investisseur", type:"qcm", question:"Que désigne le \"biais de panique\" en investissement ?", choix:["Le fait de vendre en catastrophe lors d'une baisse, souvent au pire moment","Le fait de toujours garder ses positions quoi qu'il arrive","Un type de frais bancaires","Une stratégie de diversification reconnue"], bonneReponse:0, explication:"Vendre dans la panique lors d'une baisse de marché matérialise souvent une perte qui aurait pu rester temporaire si l'horizon de placement le permettait."},
  {id:"q-psychologie-002", niveau:"intermediaire", categorie:"Psychologie de l'investisseur", type:"qcm", question:"Pourquoi consulter les cours de bourse très fréquemment peut-il nuire à un investisseur de long terme ?", choix:["Cela n'a strictement aucun effet","Cela peut renforcer l'anxiété et pousser à des décisions impulsives sur de simples variations de court terme","Cela garantit de meilleures décisions","Cela améliore automatiquement le rendement"], bonneReponse:1, explication:"Une surveillance excessive expose davantage aux fluctuations de court terme, ce qui peut inciter à réagir de façon impulsive plutôt que de suivre une stratégie réfléchie."},
  {id:"q-psychologie-003", niveau:"avance", categorie:"Psychologie de l'investisseur", type:"qcm", question:"Qu'appelle-t-on le \"biais de confirmation\" en matière d'investissement ?", choix:["La tendance à ne rechercher que les informations confirmant ce que l'on pense déjà","Une méthode de calcul du rendement","Un type de frais de courtage","Un indicateur de volatilité"], bonneReponse:0, explication:"Le biais de confirmation pousse à privilégier les informations qui confirment une opinion déjà formée, au détriment d'une analyse équilibrée incluant les signaux contraires."},

  // ---- Constitution d'un patrimoine ----
  {id:"q-patrimoine-001", niveau:"intermediaire", categorie:"Constitution d'un patrimoine", type:"qcm", question:"Comment se calcule le patrimoine net d'une personne ?", choix:["Le total de ses revenus annuels","La valeur totale de ses actifs moins le total de ses dettes","Le montant de son épargne de précaution uniquement","Son salaire multiplié par son âge"], bonneReponse:1, explication:"Le patrimoine net correspond à ce qu'il resterait si l'on vendait tous les actifs et remboursait toutes les dettes : Actifs − Dettes = Patrimoine net."},
  {id:"q-patrimoine-002", niveau:"avance", categorie:"Constitution d'un patrimoine", type:"qcm", question:"Pourquoi la répartition d'un patrimoine entre plusieurs classes d'actifs (immobilier, actions, liquidités...) est-elle généralement recommandée ?", choix:["Pour compliquer inutilement la gestion","Pour répartir les risques entre des actifs qui ne réagissent pas tous de la même façon aux mêmes événements","Parce que la loi l'impose","Pour éviter totalement toute perte possible"], bonneReponse:1, explication:"Répartir son patrimoine entre différentes classes d'actifs peu corrélées aide à limiter l'impact d'un choc localisé sur une seule catégorie d'actifs."},
  {id:"q-patrimoine-003", niveau:"avance", categorie:"Constitution d'un patrimoine", type:"qcm", question:"Pourquoi rééquilibrer périodiquement un portefeuille peut-il avoir du sens ?", choix:["Pour maximiser les frais de transaction","Pour revenir à la répartition cible initiale après que certains actifs ont plus progressé que d'autres","Parce que c'est une obligation légale","Pour annuler tous les gains réalisés"], bonneReponse:1, explication:"Avec le temps, les actifs qui progressent le plus prennent une place croissante dans le portefeuille ; rééquilibrer permet de revenir à la répartition de risque initialement souhaitée."},

  // ---- SCPI ----
  {id:"q-scpi-001", niveau:"intermediaire", categorie:"SCPI", type:"qcm", question:"Qu'est-ce qu'une SCPI, dans les grandes lignes ?", choix:["Un livret d'épargne réglementé","Une société qui collecte de l'argent auprès d'épargnants pour investir dans l'immobilier locatif","Une action cotée en bourse","Un type de crédit immobilier"], bonneReponse:1, explication:"Une SCPI (société civile de placement immobilier) mutualise l'argent de nombreux épargnants pour acheter et gérer un parc immobilier locatif, et leur reverse les loyers au prorata de leurs parts."},
  {id:"q-scpi-002", niveau:"intermediaire", categorie:"SCPI", type:"qcm", question:"Quel est l'un des principaux avantages d'une SCPI par rapport à l'achat direct d'un bien locatif ?", choix:["Un capital totalement garanti","Pas de gestion locative à assurer soi-même (locataires, travaux, impayés)","Un rendement garanti par l'État","L'absence totale de frais"], bonneReponse:1, explication:"La société de gestion s'occupe de la sélection des biens, de la location et de l'entretien : l'épargnant perçoit des revenus sans gérer lui-même le bien."},
  {id:"q-scpi-003", niveau:"intermediaire", categorie:"SCPI", type:"vraifaux", question:"Le capital investi dans une SCPI est garanti, comme sur un livret réglementé.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Comme tout placement immobilier ou financier, la valeur des parts de SCPI peut baisser : il n'y a aucune garantie de capital."},
  {id:"q-scpi-004", niveau:"avance", categorie:"SCPI", type:"qcm", question:"Qu'est-ce que le taux de distribution d'une SCPI ?", choix:["Le pourcentage de parts détenues par l'État","Le rapport entre les revenus versés sur l'année et le prix de la part en début d'année","Le taux d'intérêt du crédit utilisé pour l'acheter","Le taux de vacance locative du parc immobilier"], bonneReponse:1, explication:"Le taux de distribution rapporte les dividendes versés au cours de l'année au prix de la part, un indicateur de rendement à comparer d'une SCPI à l'autre, sans garantir sa reconduction future."},
  {id:"q-scpi-005", niveau:"avance", categorie:"SCPI", type:"qcm", question:"Pourquoi les parts de SCPI sont-elles généralement considérées comme peu liquides ?", choix:["Parce qu'elles sont cotées en continu comme une action","Parce que leur revente peut prendre du temps, faute d'acheteur immédiat en face","Parce que la loi interdit de les revendre avant 20 ans","Parce qu'elles ne peuvent être détenues que par des professionnels"], bonneReponse:1, explication:"Contrairement à une action cotée, la revente de parts de SCPI dépend de la présence d'un acheteur (marché secondaire) ou du bon vouloir de la société de gestion, ce qui peut prendre du temps."},

  // ---- Retraite et PER ----
  {id:"q-retraite-001", niveau:"intermediaire", categorie:"Retraite et PER", type:"qcm", question:"Quel est l'un des principaux intérêts d'un PER (Plan d'Épargne Retraite) ?", choix:["Un retrait libre à tout moment sans condition", "Les versements volontaires peuvent être déduits du revenu imposable, dans certaines limites", "Un rendement garanti par l'État", "L'absence totale de frais de gestion"], bonneReponse:1, explication:"Le PER permet, sous conditions et plafonds, de déduire les versements volontaires du revenu imposable de l'année, ce qui réduit l'impôt à payer immédiatement."},
  {id:"q-retraite-002", niveau:"intermediaire", categorie:"Retraite et PER", type:"vraifaux", question:"L'argent versé sur un PER est en principe bloqué jusqu'à la retraite, sauf cas de déblocage anticipé prévus par la loi.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Le PER est conçu pour l'épargne retraite : les fonds sont bloqués jusqu'au départ à la retraite, sauf exceptions comme l'achat de la résidence principale ou certains accidents de la vie."},
  {id:"q-retraite-003", niveau:"intermediaire", categorie:"Retraite et PER", type:"qcm", question:"Que se passe-t-il fiscalement si on déduit ses versements PER à l'entrée ?", choix:["Rien n'est jamais imposé, ni à l'entrée ni à la sortie","En contrepartie, les sommes seront généralement imposées à la sortie, à la retraite","Le taux d'imposition futur est automatiquement de 0%","Seuls les versements obligatoires sont concernés"], bonneReponse:1, explication:"La déduction à l'entrée n'est pas un cadeau définitif : en échange, les sommes correspondantes sont en principe réintégrées à l'impôt sur le revenu au moment de la sortie, à la retraite."},
  {id:"q-retraite-004", niveau:"avance", categorie:"Retraite et PER", type:"qcm", question:"Pourquoi la déduction fiscale d'un versement PER est-elle souvent présentée comme plus avantageuse pour une tranche marginale d'imposition élevée ?", choix:["Parce que le plafond de versement est plus élevé pour ces foyers","Parce que l'économie d'impôt à l'entrée est proportionnelle au taux marginal d'imposition, donc plus importante pour les tranches hautes","Parce que ces foyers ne paient jamais d'impôt à la sortie","Parce que la loi le réserve exclusivement aux hauts revenus"], bonneReponse:1, explication:"Un même versement déduit fait économiser d'autant plus d'impôt immédiat que le taux marginal d'imposition du foyer est élevé, ce qui rend l'arbitrage entrée/sortie potentiellement plus favorable pour les tranches hautes."},
  {id:"q-retraite-005", niveau:"avance", categorie:"Retraite et PER", type:"qcm", question:"À la retraite, sous quelle(s) forme(s) peut-on généralement récupérer l'épargne d'un PER ?", choix:["Uniquement sous forme de rente viagère, sans autre choix","Au choix (selon le contrat), en capital, en rente viagère, ou une combinaison des deux","Uniquement en une seule fois, sous forme de capital","Elle est automatiquement reversée à l'État"], bonneReponse:1, explication:"Selon les compartiments et le contrat, le PER offre en général le choix entre une sortie en capital, en rente viagère, ou un mix des deux au moment de la retraite."},

  // ---- Vrai ou faux (pour le mode de jeu dédié) ----
  {id:"q-vf-epargne-001", niveau:"debutant", categorie:"Épargne", type:"vraifaux", question:"Épargner et investir, c'est exactement la même chose.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Épargner privilégie la sécurité et la disponibilité de l'argent ; investir accepte un risque de perte en échange d'un potentiel de rendement supérieur."},
  {id:"q-vf-inflation-001", niveau:"debutant", categorie:"Inflation", type:"vraifaux", question:"Si l'inflation est plus élevée que le rendement de ton épargne, ton pouvoir d'achat diminue même si le montant affiché augmente.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Le rendement réel (rendement nominal moins inflation) peut être négatif : le montant augmente, mais ce qu'il permet d'acheter diminue."},
  {id:"q-vf-intcomposes-001", niveau:"debutant", categorie:"Intérêts composés", type:"vraifaux", question:"Avec les intérêts composés, seul le capital de départ génère des intérêts chaque année.", choix:["Vrai","Faux"], bonneReponse:1, explication:"C'est la définition des intérêts simples. Avec les intérêts composés, les intérêts déjà versés génèrent eux aussi des intérêts les années suivantes."},
  {id:"q-vf-actions-001", niveau:"debutant", categorie:"Actions", type:"vraifaux", question:"Toutes les entreprises cotées en bourse versent un dividende chaque année.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Le versement d'un dividende est une décision de l'entreprise, pas une obligation : certaines réinvestissent tous leurs bénéfices sans jamais verser de dividende."},
  {id:"q-vf-etf-001", niveau:"debutant", categorie:"ETF", type:"vraifaux", question:"Un ETF qui suit un indice peut quand même perdre de la valeur si l'indice baisse.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Un ETF réplique la performance de son indice, à la hausse comme à la baisse : il ne garantit aucun rendement positif."},
  {id:"q-vf-diversification-001", niveau:"debutant", categorie:"Diversification", type:"vraifaux", question:"Diversifier son portefeuille élimine totalement tout risque de perte.", choix:["Vrai","Faux"], bonneReponse:1, explication:"La diversification réduit le risque spécifique à un actif ou secteur, mais ne supprime jamais le risque de marché global."},
  {id:"q-vf-credit-001", niveau:"debutant", categorie:"Crédit", type:"vraifaux", question:"Allonger la durée d'un crédit réduit généralement la mensualité, mais augmente souvent le coût total des intérêts.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Une durée plus longue répartit le remboursement sur plus de mensualités (donc plus faibles), mais le total des intérêts payés tend à augmenter."},
  {id:"q-vf-arnaques-001", niveau:"debutant", categorie:"Arnaques financières", type:"vraifaux", question:"Un rendement élevé garanti sans aucun risque est un signal d'alerte fiable d'arnaque potentielle.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Aucun placement légitime ne peut garantir un rendement élevé sans risque : c'est l'un des signaux les plus fiables d'une arnaque financière."},
  {id:"q-vf-pea-001", niveau:"intermediaire", categorie:"PEA", type:"vraifaux", question:"Le PEA permet d'investir dans n'importe quelle action du monde entier, sans restriction géographique.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Le PEA est limité aux actions de sociétés européennes (ou assimilées) éligibles, contrairement à un compte-titres ordinaire plus large."},

  // ---- PIB ----
  {id:"q-pib-001", niveau:"debutant", categorie:"PIB", type:"qcm", question:"Que mesure le PIB (Produit intérieur brut) ?", choix:["Le nombre d'entreprises dans un pays","La valeur totale des biens et services produits dans un pays sur une période donnée","Le montant total de la dette publique","Le nombre d'habitants actifs"], bonneReponse:1, explication:"Le PIB additionne la valeur de tous les biens et services produits sur le territoire national sur une période, généralement un an."},
  {id:"q-pib-002", niveau:"debutant", categorie:"PIB", type:"vraifaux", question:"Une hausse du PIB signifie automatiquement que chaque habitant s'enrichit dans les mêmes proportions.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Le PIB ne dit rien de la répartition des richesses : la croissance peut profiter très inégalement à la population."},
  {id:"q-pib-003", niveau:"intermediaire", categorie:"PIB", type:"situation", question:"Le PIB d'un pays passe de 2400 milliards € à 2448 milliards € en un an. Quel est le taux de croissance ?", choix:["1%","2%","4%","8%"], bonneReponse:1, explication:"(2448-2400)/2400 = 48/2400 = 2%."},
  {id:"q-pib-004", niveau:"debutant", categorie:"PIB", type:"qcm", question:"Quelle est une limite souvent citée du PIB comme indicateur de richesse ?", choix:["Il est impossible à calculer précisément","Il ignore le travail non rémunéré et les inégalités de répartition","Il ne concerne que les pays pauvres","Il ne peut pas être comparé entre deux pays"], bonneReponse:1, explication:"Le PIB ne capture ni la répartition des richesses, ni le travail non marchand comme le bénévolat ou les tâches domestiques."},

  // ---- Taux directeur ----
  {id:"q-tauxdirecteur-001", niveau:"intermediaire", categorie:"Taux directeur", type:"qcm", question:"Qui fixe le taux d'intérêt directeur dans la zone euro ?", choix:["Le gouvernement français","La Banque centrale européenne (BCE)","Les banques commerciales","Le FMI"], bonneReponse:1, explication:"C'est la BCE qui fixe les taux directeurs pour l'ensemble de la zone euro."},
  {id:"q-tauxdirecteur-002", niveau:"intermediaire", categorie:"Taux directeur", type:"vraifaux", question:"Quand une banque centrale relève son taux directeur, le crédit devient généralement plus cher.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Une hausse du taux directeur renchérit le coût de l'argent pour les banques commerciales, qui répercutent en général cette hausse sur les taux proposés aux emprunteurs."},
  {id:"q-tauxdirecteur-003", niveau:"intermediaire", categorie:"Taux directeur", type:"qcm", question:"Pourquoi une banque centrale relève-t-elle généralement son taux directeur ?", choix:["Pour stimuler la consommation","Pour lutter contre une inflation trop élevée","Pour faire baisser le chômage rapidement","Pour dévaluer la monnaie"], bonneReponse:1, explication:"Un taux directeur plus élevé freine le crédit, la consommation et l'investissement, ce qui aide à contenir l'inflation."},
  {id:"q-tauxdirecteur-004", niveau:"intermediaire", categorie:"Taux directeur", type:"qcm", question:"Quel est un effet typique d'une baisse du taux directeur ?", choix:["Les crédits deviennent plus chers","Les crédits deviennent moins chers, ce qui peut relancer l'activité","L'inflation baisse immédiatement","Les impôts diminuent"], bonneReponse:1, explication:"Une baisse du taux directeur rend l'emprunt moins coûteux, ce qui encourage la consommation et l'investissement."},

  // ---- Banque centrale ----
  {id:"q-banquecentrale-001", niveau:"debutant", categorie:"Banque centrale", type:"qcm", question:"Quel est l'un des rôles principaux d'une banque centrale ?", choix:["Ouvrir des comptes courants aux particuliers","Piloter la politique monétaire et viser la stabilité des prix","Fixer les prix dans les commerces","Collecter les impôts"], bonneReponse:1, explication:"Une banque centrale pilote la politique monétaire, notamment via son taux directeur, pour viser la stabilité des prix."},
  {id:"q-banquecentrale-002", niveau:"debutant", categorie:"Banque centrale", type:"vraifaux", question:"On peut ouvrir un compte courant personnel directement à la Banque centrale européenne.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Les particuliers ont des comptes dans des banques commerciales ; la BCE traite avec les banques et les États, pas directement avec les particuliers."},
  {id:"q-banquecentrale-003", niveau:"debutant", categorie:"Banque centrale", type:"qcm", question:"Quelle institution est la banque centrale de la zone euro ?", choix:["La Banque de France","La Banque centrale européenne (BCE)","La Réserve fédérale (Fed)","La Banque mondiale"], bonneReponse:1, explication:"La BCE est l'institution chargée de la politique monétaire pour l'ensemble des pays de la zone euro."},
  {id:"q-banquecentrale-004", niveau:"avance", categorie:"Banque centrale", type:"qcm", question:"Quel argument est souvent avancé en faveur de l'indépendance d'une banque centrale vis-à-vis du pouvoir politique ?", choix:["Cela permet d'augmenter les impôts plus facilement","Cela renforce la crédibilité de la lutte contre l'inflation","Cela supprime le besoin de régulation bancaire","Cela garantit une croissance du PIB chaque année"], bonneReponse:1, explication:"Une banque centrale indépendante est perçue comme plus crédible pour ancrer durablement les anticipations d'inflation, à l'abri des pressions politiques de court terme."},

  // ---- Récession ----
  {id:"q-recession-001", niveau:"debutant", categorie:"Récession", type:"qcm", question:"Comment définit-on généralement une récession technique ?", choix:["Une baisse du PIB sur un seul trimestre","Deux trimestres consécutifs de baisse du PIB","Une hausse du chômage de 5 points","Une chute de la bourse de 20%"], bonneReponse:1, explication:"La définition la plus courante d'une récession technique est deux trimestres consécutifs de baisse du PIB."},
  {id:"q-recession-002", niveau:"debutant", categorie:"Récession", type:"vraifaux", question:"Une récession s'accompagne souvent d'une hausse du chômage.", choix:["Vrai","Faux"], bonneReponse:0, explication:"En période de récession, les entreprises réduisent souvent leurs effectifs face à la baisse de l'activité, ce qui fait généralement grimper le chômage."},
  {id:"q-recession-003", niveau:"intermediaire", categorie:"Récession", type:"qcm", question:"Quelle est la différence entre un ralentissement de la croissance et une récession ?", choix:["Il n'y a aucune différence","Un ralentissement signifie que l'économie croît encore mais plus lentement, une récession signifie qu'elle se contracte","Une récession ne concerne que la bourse","Un ralentissement dure toujours plus longtemps qu'une récession"], bonneReponse:1, explication:"Dans un ralentissement, le PIB continue de croître mais à un rythme plus faible ; dans une récession, le PIB recule réellement."},
  {id:"q-recession-004", niveau:"avance", categorie:"Récession", type:"qcm", question:"Quel organisme évalue plusieurs indicateurs économiques (au-delà de deux trimestres de PIB) pour dater officiellement une récession aux États-Unis ?", choix:["Le FMI","Le NBER (National Bureau of Economic Research)","La Fed","Le Congrès américain"], bonneReponse:1, explication:"Le NBER évalue plusieurs indicateurs (emploi, production industrielle, revenus...) pour dater officiellement les récessions américaines, au-delà de la simple règle des deux trimestres."},

  // ---- Offre et demande ----
  {id:"q-offredemande-001", niveau:"debutant", categorie:"Offre et demande", type:"qcm", question:"Que se passe-t-il généralement sur un marché quand la demande dépasse largement l'offre ?", choix:["Les prix ont tendance à baisser","Les prix ont tendance à monter","Les prix restent toujours stables","La qualité du produit baisse automatiquement"], bonneReponse:1, explication:"Quand la demande dépasse l'offre disponible, les prix ont tendance à monter jusqu'à ce qu'un nouvel équilibre se forme."},
  {id:"q-offredemande-002", niveau:"intermediaire", categorie:"Offre et demande", type:"vraifaux", question:"Le modèle de l'offre et de la demande suppose une concurrence pure et parfaite, ce qui n'est pas toujours réaliste.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Dans la réalité, des facteurs comme les monopoles, les subventions ou l'information imparfaite peuvent déformer durablement l'équilibre théorique entre offre et demande."},
  {id:"q-offredemande-003", niveau:"debutant", categorie:"Offre et demande", type:"qcm", question:"Quel exemple illustre une hausse de prix due à une offre réduite face à une demande stable ?", choix:["Une pénurie de puces électroniques pendant une demande forte","Une baisse générale des salaires","Une hausse des impôts sur les sociétés","Une augmentation du nombre de vendeurs sur un marché"], bonneReponse:0, explication:"Une pénurie de puces électroniques face à une demande qui reste forte est un exemple typique de hausse des prix par réduction de l'offre."},
  {id:"q-offredemande-004", niveau:"debutant", categorie:"Offre et demande", type:"qcm", question:"Que se passe-t-il généralement sur un marché quand l'offre dépasse largement la demande ?", choix:["Les prix ont tendance à monter","Les prix ont tendance à baisser","Le produit disparaît du marché","Rien, les prix ne bougent jamais"], bonneReponse:1, explication:"Quand l'offre dépasse la demande, les vendeurs ont tendance à baisser leurs prix pour écouler leurs stocks."},

  // ---- Commerce international ----
  {id:"q-commint-001", niveau:"debutant", categorie:"Commerce international", type:"qcm", question:"Qu'est-ce qu'un droit de douane ?", choix:["Une taxe sur les produits exportés vers un autre pays","Une taxe appliquée sur des biens importés depuis un autre pays","Une subvention versée aux entreprises exportatrices","Un accord supprimant toute taxe entre deux pays"], bonneReponse:1, explication:"Un droit de douane est une taxe appliquée par un pays sur les biens qu'il importe depuis l'étranger, ce qui augmente leur prix pour les acheteurs locaux."},
  {id:"q-commint-002", niveau:"intermediaire", categorie:"Commerce international", type:"vraifaux", question:"Le coût d'un droit de douane est intégralement payé par le pays exportateur visé, jamais par les consommateurs du pays qui l'impose.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Le coût d'un droit de douane est généralement partagé entre l'exportateur (qui peut baisser son prix) et l'importateur/consommateur local, qui absorbe souvent une partie du surcoût via un prix final plus élevé."},
  {id:"q-commint-003", niveau:"avance", categorie:"Commerce international", type:"qcm", question:"Selon le principe de l'avantage comparatif, un pays a intérêt à se spécialiser dans...", choix:["Uniquement les biens où il est le meilleur au monde en absolu","Les biens où son efficacité relative est la plus grande, même s'il n'est pas le meilleur en absolu", "Aucun bien, l'autarcie est toujours préférable","Les biens que les autres pays ne produisent pas du tout"], bonneReponse:1, explication:"L'avantage comparatif compare le coût d'opportunité entre productions au sein d'un même pays : même un pays moins efficace que les autres dans tout peut avoir intérêt à se spécialiser là où son désavantage relatif est le plus faible."},
  {id:"q-commint-004", niveau:"debutant", categorie:"Commerce international", type:"qcm", question:"Que signifie un déficit commercial pour un pays ?", choix:["Il exporte plus qu'il n'importe","Il importe plus qu'il n'exporte", "Sa monnaie s'est automatiquement dépréciée","Il n'a plus de réserves de change"], bonneReponse:1, explication:"Un déficit commercial signifie que la valeur des importations dépasse celle des exportations sur la période considérée."},
  {id:"q-commint-005", niveau:"intermediaire", categorie:"Commerce international", type:"vraifaux", question:"Un déficit commercial est toujours le signe d'une économie en difficulté.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Un déficit commercial peut aussi refléter un pays qui investit massivement (donc importe des biens d'équipement) ou dont la monnaie forte rend les importations avantageuses — le contexte compte davantage que le signe seul."},
  {id:"q-commint-006", niveau:"intermediaire", categorie:"Commerce international", type:"qcm", question:"Quel est un risque courant d'une politique protectionniste (droits de douane élevés, quotas) ?", choix:["Une baisse garantie des prix pour les consommateurs","Des mesures de rétorsion du pays visé, pouvant dégénérer en guerre commerciale","La disparition immédiate de toute concurrence étrangère","Une hausse automatique du PIB à long terme"], bonneReponse:1, explication:"Un pays visé par des mesures protectionnistes riposte souvent par ses propres droits de douane, ce qui peut faire monter les prix des deux côtés sans bénéfice net clair."},

  // ---- Chiffre d'affaires ----
  {id:"q-ca-001", niveau:"debutant", categorie:"Chiffre d'affaires", type:"qcm", question:"Que représente le chiffre d'affaires d'une entreprise ?", choix:["Son bénéfice net après charges","Le montant total de ses ventes sur une période, avant charges","Le montant de ses dettes","La valeur de ses actifs"], bonneReponse:1, explication:"Le chiffre d'affaires est le montant total des ventes réalisées, avant déduction des charges."},
  {id:"q-ca-002", niveau:"debutant", categorie:"Chiffre d'affaires", type:"vraifaux", question:"Une entreprise avec un chiffre d'affaires élevé est forcément rentable.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Le chiffre d'affaires ne dit rien de la rentabilité : une entreprise peut vendre beaucoup tout en étant déficitaire si ses charges dépassent ses revenus."},
  {id:"q-ca-003", niveau:"intermediaire", categorie:"Chiffre d'affaires", type:"situation", question:"Une entreprise vend pour 4 millions d'euros de produits sur l'année et ses charges s'élèvent à 4,5 millions d'euros. Quel est son résultat net ?", choix:["+4 millions €","+0,5 million €","-0,5 million €","0 €"], bonneReponse:2, explication:"Résultat net = chiffre d'affaires - charges = 4 - 4,5 = -0,5 million €, l'entreprise est donc déficitaire malgré un chiffre d'affaires élevé."},
  {id:"q-ca-004", niveau:"intermediaire", categorie:"Chiffre d'affaires", type:"qcm", question:"Que surveillent le plus souvent les analystes financiers concernant le chiffre d'affaires ?", choix:["Sa valeur absolue uniquement","Sa croissance dans le temps et sa répartition par segment ou zone géographique","Le nombre d'employés qui l'ont généré","Sa couleur dans les rapports annuels"], bonneReponse:1, explication:"La croissance du chiffre d'affaires (souvent en %) et sa décomposition par segment ou zone sont plus informatives que son simple niveau absolu."},

  // ---- Marge nette ----
  {id:"q-margenette-001", niveau:"intermediaire", categorie:"Marge nette", type:"qcm", question:"Comment calcule-t-on la marge nette d'une entreprise ?", choix:["Résultat net divisé par le chiffre d'affaires","Chiffre d'affaires divisé par le résultat net","Actif divisé par le passif","Dette divisée par les capitaux propres"], bonneReponse:0, explication:"La marge nette se calcule en divisant le résultat net par le chiffre d'affaires."},
  {id:"q-margenette-002", niveau:"intermediaire", categorie:"Marge nette", type:"calcul", question:"Une entreprise réalise 50 M€ de chiffre d'affaires et 4 M€ de résultat net. Quelle est sa marge nette ?", choix:["4%","8%","12,5%","40%"], bonneReponse:1, explication:"Marge nette = 4/50 = 8%."},
  {id:"q-margenette-003", niveau:"intermediaire", categorie:"Marge nette", type:"vraifaux", question:"Les niveaux normaux de marge nette sont similaires quel que soit le secteur d'activité.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Les niveaux de marge nette varient énormément selon les secteurs : un supermarché et un éditeur de logiciels n'ont pas la même structure de coûts."},
  {id:"q-margenette-004", niveau:"debutant", categorie:"Marge nette", type:"qcm", question:"Une marge nette de 10% signifie que :", choix:["L'entreprise reverse 10% de son chiffre d'affaires en dividendes","L'entreprise conserve 10 centimes de bénéfice pour chaque euro de vente","L'entreprise a 10% de dettes","L'entreprise a augmenté son chiffre d'affaires de 10%"], bonneReponse:1, explication:"Une marge nette de 10% signifie que l'entreprise conserve 10 centimes de résultat net pour chaque euro de chiffre d'affaires."},

  // ---- Bilan comptable ----
  {id:"q-bilan-001", niveau:"intermediaire", categorie:"Bilan comptable", type:"qcm", question:"Que représente l'actif dans un bilan comptable ?", choix:["Les dettes de l'entreprise","Ce que possède l'entreprise (trésorerie, stocks, équipements...)","Le chiffre d'affaires de l'année","Les impôts payés"], bonneReponse:1, explication:"L'actif regroupe les biens et créances de l'entreprise."},
  {id:"q-bilan-002", niveau:"intermediaire", categorie:"Bilan comptable", type:"vraifaux", question:"Dans un bilan comptable, le total de l'actif est toujours égal au total du passif.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Par construction comptable, actif et passif sont toujours égaux : le passif indique comment l'actif est financé."},
  {id:"q-bilan-003", niveau:"intermediaire", categorie:"Bilan comptable", type:"qcm", question:"Quelle est la différence principale entre un bilan et un compte de résultat ?", choix:["Il n'y a aucune différence","Le bilan est une photographie à un instant donné, le compte de résultat mesure une performance sur une période","Le compte de résultat ne concerne que les grandes entreprises","Le bilan ne concerne que les impôts"], bonneReponse:1, explication:"Le bilan est un instantané du patrimoine à une date donnée, tandis que le compte de résultat mesure les revenus et charges sur une période."},
  {id:"q-bilan-004", niveau:"avance", categorie:"Bilan comptable", type:"situation", question:"Un bilan affiche 50 M€ d'actif financés par 20 M€ de capitaux propres et 30 M€ de dettes. Quelle part de l'actif est financée par les actionnaires ?", choix:["20%","40%","60%","80%"], bonneReponse:1, explication:"20 M€ de capitaux propres / 50 M€ d'actif = 40%."},

  // ---- Amortissement ----
  {id:"q-amortissement-001", niveau:"avance", categorie:"Amortissement", type:"qcm", question:"Que signifie amortir un bien en comptabilité ?", choix:["Le revendre immédiatement","Étaler son coût sur sa durée de vie estimée plutôt que de le passer en charge d'un coup","Le supprimer du bilan","Augmenter sa valeur chaque année"], bonneReponse:1, explication:"L'amortissement étale le coût d'un bien durable sur sa durée de vie estimée pour refléter son usure progressive."},
  {id:"q-amortissement-002", niveau:"intermediaire", categorie:"Amortissement", type:"calcul", question:"Une machine de 120 000 € est amortie linéairement sur 10 ans. Quelle est la charge d'amortissement annuelle ?", choix:["1 200€","12 000€","24 000€","120 000€"], bonneReponse:1, explication:"120 000 / 10 = 12 000 € de charge d'amortissement par an."},
  {id:"q-amortissement-003", niveau:"avance", categorie:"Amortissement", type:"vraifaux", question:"La charge d'amortissement correspond à une sortie de trésorerie réelle l'année où elle est comptabilisée.", choix:["Vrai","Faux"], bonneReponse:1, explication:"L'amortissement réduit le résultat comptable mais n'est pas une sortie de trésorerie réelle cette année-là : l'argent a déjà été dépensé au moment de l'achat du bien."},
  {id:"q-amortissement-004", niveau:"avance", categorie:"Amortissement", type:"qcm", question:"Pourquoi les analystes financiers regardent-ils aussi l'EBITDA (résultat avant amortissements) ?", choix:["Parce que l'amortissement n'existe pas vraiment","Parce que cela permet de comparer la performance opérationnelle sans l'effet des choix d'amortissement","Parce que l'EBITDA remplace totalement le résultat net","Parce que c'est obligatoire dans tous les pays"], bonneReponse:1, explication:"L'EBITDA neutralise l'effet des amortissements, ce qui facilite la comparaison de la performance opérationnelle entre entreprises ayant des politiques d'investissement différentes."},

  // ---- Startup ----
  {id:"q-startup-001", niveau:"debutant", categorie:"Startup", type:"qcm", question:"Qu'est-ce qui différencie généralement une startup d'une PME classique ?", choix:["Une startup est toujours plus grande","Une startup cherche un modèle économique reproductible et à forte croissance, souvent dans l'incertitude","Une startup ne peut jamais lever de fonds","Une startup est toujours rentable dès sa création"], bonneReponse:1, explication:"Une startup opère dans l'incertitude et vise une croissance rapide, quitte à ne pas être rentable pendant ses premières années, contrairement à une PME plus classique."},
  {id:"q-startup-002", niveau:"debutant", categorie:"Startup", type:"vraifaux", question:"La majorité des startups échouent avant d'atteindre la rentabilité.", choix:["Vrai","Faux"], bonneReponse:0, explication:"C'est un fait bien documenté du secteur : les investisseurs en capital-risque misent sur le fait qu'un petit nombre de réussites majeures compensera les nombreux échecs du portefeuille."},
  {id:"q-startup-003", niveau:"intermediaire", categorie:"Startup", type:"qcm", question:"Sur quoi mise généralement un investisseur en capital-risque qui finance plusieurs startups ?", choix:["Sur la réussite garantie de chaque startup","Sur le fait qu'un petit nombre de réussites majeures compensera les nombreux échecs","Sur la revente immédiate de chaque investissement","Sur l'absence totale de risque"], bonneReponse:1, explication:"Le modèle du capital-risque repose sur le fait qu'une minorité de startups à très fort succès compense les nombreux échecs du portefeuille."},
  {id:"q-startup-004", niveau:"debutant", categorie:"Startup", type:"qcm", question:"Toute jeune entreprise peut-elle être qualifiée de startup ?", choix:["Oui, systématiquement","Non, le terme désigne surtout des entreprises cherchant une forte croissance et un modèle reproductible, pas toute nouvelle activité","Non, seulement les entreprises cotées en bourse","Oui, mais seulement dans le secteur agricole"], bonneReponse:1, explication:"Une jeune entreprise sans ambition de forte croissance (un commerce de proximité par exemple) n'est généralement pas qualifiée de startup, même si elle est récente."},

  // ---- Levée de fonds ----
  {id:"q-leveedefonds-001", niveau:"intermediaire", categorie:"Levée de fonds", type:"qcm", question:"Que reçoivent en général les investisseurs en échange d'une levée de fonds ?", choix:["Un remboursement garanti avec intérêts","Des parts (actions) de l'entreprise","Un poste salarié dans l'entreprise","Rien, c'est un don"], bonneReponse:1, explication:"En échange de leur investissement, les investisseurs reçoivent des parts de l'entreprise, ce qui les rend actionnaires."},
  {id:"q-leveedefonds-002", niveau:"intermediaire", categorie:"Levée de fonds", type:"vraifaux", question:"Une levée de fonds dilue la part de propriété des actionnaires déjà présents dans l'entreprise.", choix:["Vrai","Faux"], bonneReponse:0, explication:"L'arrivée de nouveaux actionnaires via une levée de fonds réduit mécaniquement le pourcentage de détention des actionnaires existants, sauf s'ils réinvestissent proportionnellement."},
  {id:"q-leveedefonds-003", niveau:"intermediaire", categorie:"Levée de fonds", type:"situation", question:"Une startup lève 5 millions d'euros en échange de 20% de son capital. Quelle est sa valorisation après l'opération ?", choix:["5 millions €","10 millions €","25 millions €","100 millions €"], bonneReponse:2, explication:"Si 5 M€ correspondent à 20% du capital, la valorisation totale est 5 / 0,20 = 25 millions €."},
  {id:"q-leveedefonds-004", niveau:"avance", categorie:"Levée de fonds", type:"qcm", question:"Qu'est-ce qu'une « down round » ?", choix:["Une levée de fonds à une valorisation supérieure à la précédente","Une levée de fonds à une valorisation inférieure à la précédente","Le remboursement anticipé d'un prêt","Une augmentation du chiffre d'affaires"], bonneReponse:1, explication:"Une « down round » désigne une levée de fonds réalisée à une valorisation inférieure à celle de la levée précédente, souvent le signe de difficultés."}
];
// ===EXPORT:QUIZ_BANK:END===

// ============================================================
// MENTAL_CHALLENGES — Défis : exercices de raisonnement (au-delà du QCM)
// Personnages fictifs mais réalistes (même convention que COURS_CATALOG) —
// pas d'entreprises réelles ici, pour ne jamais avancer un chiffre financier
// non vérifié. `categorie` reprend volontairement la taxonomie de
// QUIZ_BANK_FULL quand le concept existe déjà, pour que la maîtrise par
// thème (getSkillMastery) reste unifiée entre les deux banques.
// Schéma : {id, domain, categorie, niveau, format, estimatedTime, xp,
// conceptsTested, explication, ...champs propres au format}
// ============================================================
const MENTAL_CHALLENGES = [
  // ---------- Format "cas" (trouve l'erreur / qui a raison / décision / cas express) ----------
  {id:"mc-cas-001", domain:"Bourse", categorie:"Risque et volatilité", niveau:"debutant", format:"cas", estimatedTime:2, xp:10,
    conceptsTested:["variation en pourcentage"],
    presentation:"erreur", statement:"Lucas : « Cette action a chuté de 50%. Si elle remonte de 50%, j'aurai récupéré ma perte. »",
    question:"Où est l'erreur dans ce raisonnement ?",
    choix:["Il n'y a pas d'erreur, il aura bien récupéré sa perte","Les deux pourcentages ne s'appliquent pas à la même base de départ","Une action ne peut jamais remonter de 50%","Il aurait fallu qu'elle chute de moins de 50%"],
    bonneReponse:1,
    explication:"100 → 50 (−50%). Puis 50 → 75 (+50% de 50, pas de 100) : il ne récupère que 25, pas 50. Il faudrait une hausse de +100% pour revenir à 100 : les pourcentages s'appliquent toujours à la valeur du moment, pas à la valeur de départ."},
  {id:"mc-cas-002", domain:"Finance personnelle", categorie:"Épargne", niveau:"debutant", format:"cas", estimatedTime:2, xp:10,
    conceptsTested:["rendement réel", "inflation"],
    presentation:"erreur", statement:"Nadia : « Mon épargne rapporte 1% par an, c'est sûr, donc mon argent est protégé. »",
    question:"Quelle nuance manque à ce raisonnement ?",
    choix:["Aucune, le raisonnement est complet","Un rendement de 1% ne dit rien sur le pouvoir d'achat réel si l'inflation est plus élevée","1% est un rendement toujours excellent","L'épargne garantie n'existe pas"],
    bonneReponse:1,
    explication:"Le capital est bien protégé en valeur nominale, mais si l'inflation dépasse 1% par an, le pouvoir d'achat de cette épargne diminue quand même : la sécurité du capital et la protection du pouvoir d'achat sont deux choses différentes."},
  {id:"mc-cas-003", domain:"Business", categorie:"Chiffre d'affaires", niveau:"debutant", format:"cas", estimatedTime:2, xp:10,
    conceptsTested:["chiffre d'affaires vs richesse personnelle"],
    presentation:"erreur", statement:"« Cet entrepreneur fait 1 million d'euros de chiffre d'affaires. Il est donc millionnaire. »",
    question:"Pourquoi ce raisonnement est-il faux ?",
    choix:["Il n'est pas faux, 1M€ de CA = 1M€ de richesse personnelle","Le chiffre d'affaires n'est pas un bénéfice, et le bénéfice de l'entreprise n'est pas la richesse personnelle du dirigeant","Le chiffre d'affaires est toujours inférieur aux charges","Un entrepreneur ne peut jamais être millionnaire"],
    bonneReponse:1,
    explication:"Le chiffre d'affaires, c'est l'argent encaissé avant toute charge (salaires, loyers, achats...). Ce qui reste ensuite (le bénéfice) appartient à l'entreprise, pas directement au dirigeant — et une entreprise à fort CA peut très bien être déficitaire."},
  {id:"mc-cas-004", domain:"Bourse", categorie:"Bourse", niveau:"intermediaire", format:"cas", estimatedTime:2, xp:12,
    conceptsTested:["performance passée", "biais de récence"],
    presentation:"erreur", statement:"« Cette action est passée de 10€ à 100€ en deux ans. C'est clairement le meilleur investissement possible, j'achète maintenant. »",
    question:"Quel est le principal problème de ce raisonnement ?",
    choix:["Il n'y a pas de problème, la tendance va forcément continuer","Une performance passée, même spectaculaire, ne garantit rien sur la suite","Le prix d'une action ne peut pas continuer à monter après x10","Il faut toujours attendre que le prix redescende à 10€"],
    bonneReponse:1,
    explication:"Une forte hausse passée ne dit rien sur l'avenir : elle peut refléter une vraie création de valeur comme une bulle spéculative. Acheter uniquement parce qu'un prix a beaucoup monté, sans analyser pourquoi, est un biais classique."},
  {id:"mc-cas-005", domain:"Crypto", categorie:"Sécurité crypto", niveau:"debutant", format:"cas", estimatedTime:2, xp:10,
    conceptsTested:["signaux d'alerte", "rendement garanti"],
    presentation:"erreur", statement:"« Cette crypto rapporte 2% garanti par jour, sans risque. »",
    question:"Quel est le premier signal d'alerte dans cette phrase ?",
    choix:["2% par jour est un montant trop précis","Le mot « garanti » associé à un rendement aussi élevé — aucun placement légitime ne peut le promettre","Le mot « crypto » lui-même est toujours suspect","Rien, cette offre est simplement rare"],
    bonneReponse:1,
    explication:"2%/jour représenterait plusieurs centaines de % par an, sans aucun placement réel qui puisse le justifier durablement — et aucun investissement sérieux ne peut « garantir » un rendement : risque et rendement vont toujours ensemble. C'est le profil type d'une arnaque (schéma de Ponzi ou équivalent)."},
  {id:"mc-cas-006", domain:"Business", categorie:"Chiffre d'affaires", niveau:"intermediaire", format:"cas", estimatedTime:3, xp:12,
    conceptsTested:["chiffre d'affaires", "marge", "rentabilité"],
    presentation:"personnes",
    personnes:[{nom:"Sarah", citation:"Cette entreprise fait plus de chiffre d'affaires que l'année dernière, donc elle va forcément mieux."},{nom:"Adam", citation:"On doit aussi regarder la marge, les coûts et éventuellement le cash-flow avant de conclure."}],
    question:"Qui raisonne le mieux ?",
    choix:["Sarah","Adam","Les deux ont partiellement raison : la croissance du CA est un bon signe, mais insuffisant seul","Aucun des deux ne raisonne correctement"],
    bonneReponse:2,
    explication:"Sarah a raison de noter que la croissance du CA est plutôt positive, mais Adam a raison de rappeler qu'elle ne suffit pas : une entreprise peut faire plus de CA tout en perdant plus d'argent si ses coûts augmentent davantage."},
  {id:"mc-cas-007", domain:"Immobilier", categorie:"Immobilier", niveau:"intermediaire", format:"cas", estimatedTime:3, xp:12,
    conceptsTested:["cycles immobiliers", "marché local"],
    presentation:"personnes",
    personnes:[{nom:"Karim", citation:"L'immobilier ne baisse jamais sur le long terme, c'est une valeur refuge."},{nom:"Julie", citation:"Ça dépend énormément de la zone et du moment de l'achat : certains marchés locaux ont bien baissé."}],
    question:"Qui raisonne le mieux ?",
    choix:["Karim","Julie","Les deux se valent, impossible de trancher","Aucun argument n'est vérifiable"],
    bonneReponse:1,
    explication:"Les prix de l'immobilier varient réellement selon la zone géographique, le type de bien et le cycle économique : il existe des marchés locaux qui ont connu de vraies baisses durables. Présenter l'immobilier comme une valeur qui « ne baisse jamais » est une généralisation excessive."},
  {id:"mc-cas-008", domain:"Bourse", categorie:"Diversification", niveau:"intermediaire", format:"cas", estimatedTime:2, xp:12,
    conceptsTested:["diversification", "risque spécifique"],
    presentation:"personnes",
    personnes:[{nom:"Tom", citation:"Je connais très bien cette entreprise, donc je préfère tout miser dessus plutôt que diversifier."},{nom:"Léa", citation:"Même en connaissant bien une entreprise, un imprévu spécifique à elle peut faire chuter tout mon capital si je ne diversifie pas."}],
    question:"Qui raisonne le mieux ?",
    choix:["Tom","Léa","Les deux ont totalement raison sans nuance","Le sujet ne concerne que les débutants"],
    bonneReponse:1,
    explication:"Bien connaître une entreprise réduit le risque de mauvaise surprise « qu'on aurait pu voir venir », mais ne protège pas contre un événement imprévisible propre à cette seule entreprise (accident, scandale, concurrent...). La diversification réduit justement ce risque spécifique."},
  {id:"mc-cas-009", domain:"Business", categorie:"Startup", niveau:"avance", format:"cas", estimatedTime:3, xp:14,
    conceptsTested:["CAC", "churn", "priorisation"],
    presentation:"situation",
    contexte:"Tu diriges une jeune startup SaaS.",
    faits:["1 000 utilisateurs inscrits, 100 clients payants","Abonnement à 20€/mois", "Coût d'acquisition client (CAC) : 50€", "Taux de résiliation (churn) : 8% par mois"],
    question:"Quel problème semble le plus urgent à traiter en premier ?",
    choix:["Le nombre d'utilisateurs inscrits est trop faible","Un churn de 8%/mois est très élevé : à ce rythme, la moitié des clients partent en moins de 9 mois, ce qui menace tout le reste","Le prix de l'abonnement est trop bas","Le CAC de 50€ est anormalement élevé pour un SaaS"],
    bonneReponse:1,
    explication:"Un churn mensuel de 8% est très élevé pour un SaaS (les acteurs sains visent souvent moins de 2-3%/mois) : cela signifie que l'entreprise doit sans cesse remplacer des clients qui partent, ce qui rend la croissance très coûteuse et fragile, quel que soit le niveau du CAC ou du prix. Tant que ce problème n'est pas traité, améliorer l'acquisition ne fait que remplir un seau percé."},
  {id:"mc-cas-010", domain:"Finance personnelle", categorie:"Crédit", niveau:"intermediaire", format:"cas", estimatedTime:3, xp:12,
    conceptsTested:["liquidité", "fonds de sécurité", "coût d'opportunité"],
    presentation:"situation",
    contexte:"Ta situation ce mois-ci :",
    faits:["Tu gagnes 1 800€/mois", "Tu as 2 500€ d'épargne disponible", "Ta voiture nécessite une réparation de 1 200€", "Tu voulais investir 500€ ce mois-ci"],
    question:"Quelle variable dois-tu considérer en priorité avant de décider ?",
    choix:["Le rendement espéré de l'investissement, qui doit toujours passer en premier","Si les 2 500€ constituent aussi ton seul fonds de sécurité, la réparation (urgence nécessaire) doit passer avant l'investissement (différable)","Aucune, il faut toujours investir le montant prévu quoi qu'il arrive","Le taux d'intérêt d'un éventuel crédit à la consommation"],
    bonneReponse:1,
    explication:"Une réparation nécessaire à 1 200€ est une dépense contrainte, alors qu'un investissement de 500€ est différable d'un mois. Si les 2 500€ sont la seule épargne de sécurité, les utiliser en partie pour la réparation plutôt que de s'endetter (ou de rester sans voiture) est la priorité — l'investissement peut attendre le mois suivant sans réel dommage."},
  {id:"mc-cas-011", domain:"Immobilier", categorie:"Immobilier", niveau:"intermediaire", format:"cas", estimatedTime:3, xp:12,
    conceptsTested:["rendement brut", "charges réelles"],
    presentation:"situation",
    contexte:"Un bien mis en vente :",
    faits:["Prix d'achat : 160 000€", "Loyer visé : 900€/mois", "Charges de copropriété : 200€/mois", "Taxe foncière : 1 500€/an", "Travaux à prévoir : 15 000€"],
    question:"Le rendement brut affiché (loyer × 12 / prix) suffit-il à juger ce projet ?",
    choix:["Oui, le rendement brut donne déjà une image fiable du projet","Non : charges de copropriété, taxe foncière et travaux réduisent fortement le rendement réel une fois pris en compte","Non, mais uniquement à cause des travaux","Oui, tant que le loyer est supérieur à 800€/mois"],
    bonneReponse:1,
    explication:"Le rendement brut (900×12/160000 ≈ 6,75%) ignore près de 4 000€/an de charges et taxe foncière, plus 15 000€ de travaux à absorber : le rendement net réel sera sensiblement inférieur. Il ne remplace jamais une analyse du cash-flow réel."},
  {id:"mc-cas-012", domain:"Business", categorie:"Marge nette", niveau:"intermediaire", format:"cas", estimatedTime:3, xp:12,
    conceptsTested:["coût d'acquisition client", "rentabilité"],
    presentation:"situation",
    contexte:"Une agence marketing, sur l'année écoulée :",
    faits:["Chiffre d'affaires : 200 000€", "Salaires : 110 000€", "Publicité : 35 000€", "Autres charges : 30 000€", "20 clients actifs"],
    question:"Quelle information est la plus importante pour juger si son acquisition client est soutenable ?",
    choix:["Le montant total du chiffre d'affaires", "Combien coûte l'acquisition d'un nouveau client comparé à ce qu'il rapporte réellement sur la durée (pas seulement sur un an)", "Le nombre total de salariés", "Le montant des charges fixes uniquement"],
    bonneReponse:1,
    explication:"200 000 − 110 000 − 35 000 − 30 000 = 25 000€ de résultat, ce qui reste correct mais modeste sur 20 clients. La vraie question pour juger la soutenabilité est de comparer le coût d'acquisition d'un client à ce qu'il rapporte sur toute la durée de la relation (pas seulement l'année en cours) : sans cette donnée, impossible de savoir si la croissance future sera rentable ou juste plus de la même chose."},

  // ---------- Format "vraimais" (vrai mais incomplet) ----------
  {id:"mc-vm-001", domain:"Bourse", categorie:"ETF", niveau:"debutant", format:"vraimais", estimatedTime:2, xp:10,
    conceptsTested:["ETF", "diversification"],
    statement:"Les ETF permettent de diversifier.",
    question:"Quelle nuance manque à cette affirmation ?",
    choix:["Aucune, c'est vrai sans exception","Tous les ETF ne sont pas très diversifiés : certains suivent un secteur ou un nombre limité de titres","Les ETF ne permettent jamais de diversifier","Seuls les ETF obligataires diversifient vraiment"],
    bonneReponse:1,
    explication:"Un ETF qui suit un indice large (type actions monde) diversifie beaucoup. Mais un ETF sectoriel (technologie, énergie...) ou un ETF pays unique peut être très concentré sur peu de titres ou une seule zone géographique : « c'est un ETF » ne garantit pas, en soi, une vraie diversification."},
  {id:"mc-vm-002", domain:"Finance personnelle", categorie:"Assurance-vie", niveau:"intermediaire", format:"vraimais", estimatedTime:2, xp:10,
    conceptsTested:["assurance-vie", "fiscalité"],
    statement:"L'assurance-vie permet de récupérer son argent à tout moment.",
    question:"Quelle nuance manque ?",
    choix:["Aucune, l'argent est totalement bloqué avant 8 ans","C'est vrai sur la disponibilité, mais un retrait avant 8 ans est fiscalement moins avantageux qu'après","L'assurance-vie ne permet jamais de retrait partiel","Il faut l'accord de l'assureur pour tout retrait"],
    bonneReponse:1,
    explication:"Contrairement à une idée reçue, l'argent placé sur une assurance-vie n'est pas bloqué : on peut le retirer quand on veut. La nuance porte sur la fiscalité, plus favorable après 8 ans de détention — la durée influence l'imposition des gains, pas la disponibilité de l'argent."},
  {id:"mc-vm-003", domain:"Immobilier", categorie:"SCPI", niveau:"intermediaire", format:"vraimais", estimatedTime:2, xp:10,
    conceptsTested:["SCPI", "frais", "liquidité"],
    statement:"Une SCPI permet d'investir dans l'immobilier sans avoir à gérer soi-même un bien.",
    question:"Quelle nuance manque ?",
    choix:["Aucune, c'est un placement sans aucun inconvénient","Les frais d'entrée sont souvent élevés, le capital n'est pas garanti et la revente des parts peut prendre du temps","Une SCPI garantit un rendement fixe chaque année","Une SCPI n'a jamais de frais"],
    bonneReponse:1,
    explication:"C'est vrai : plus besoin de chercher un locataire ou de gérer des travaux. Mais cette simplicité a un coût (frais d'entrée souvent proches de 10%), et comme tout placement en parts, le capital n'est pas garanti et la revente n'est pas instantanée — ce n'est pas l'équivalent liquide et sans risque d'un livret."},
  {id:"mc-vm-004", domain:"Finance personnelle", categorie:"Livret A", niveau:"debutant", format:"vraimais", estimatedTime:2, xp:10,
    conceptsTested:["capital garanti", "pouvoir d'achat"],
    statement:"Le Livret A garantit le capital placé.",
    question:"Quelle nuance manque ?",
    choix:["Aucune, un capital garanti signifie aussi un pouvoir d'achat garanti","Le capital nominal est garanti, mais si le taux du Livret A est inférieur à l'inflation, le pouvoir d'achat de cette épargne peut diminuer","Le Livret A ne garantit rien du tout","Le capital n'est garanti qu'au-delà de 10 000€"],
    bonneReponse:1,
    explication:"« Capital garanti » veut dire que le nombre d'euros sur le livret ne peut pas baisser. Mais si l'inflation est plus élevée que le taux du Livret A, ces mêmes euros achèteront moins de choses dans le futur : la garantie porte sur le nominal, pas sur le pouvoir d'achat réel."},
  {id:"mc-vm-005", domain:"Bourse", categorie:"Actions", niveau:"intermediaire", format:"vraimais", estimatedTime:2, xp:10,
    conceptsTested:["performance historique", "horizon d'investissement"],
    statement:"Sur longue durée, les marchés actions ont historiquement bien performé.",
    question:"Quelle nuance manque ?",
    choix:["Aucune, cela garantit une performance future identique","C'est un constat historique, pas une garantie pour l'avenir — et cela suppose de tenir sur la durée sans revendre en panique lors des baisses","Les marchés actions performent toujours mieux que l'immobilier","Cela ne concerne que les investisseurs professionnels"],
    bonneReponse:1,
    explication:"Le constat historique est réel sur de longues périodes passées, mais ne garantit rien sur l'avenir. Il suppose aussi une condition essentielle souvent oubliée : rester investi pendant les baisses, ce que beaucoup d'investisseurs ont du mal à faire en pratique — la performance historique moyenne et le comportement réel des épargnants peuvent diverger fortement."},
  {id:"mc-vm-006", domain:"Immobilier", categorie:"Crédit", niveau:"intermediaire", format:"vraimais", estimatedTime:2, xp:10,
    conceptsTested:["taux fixe vs variable"],
    statement:"Un taux de crédit fixe protège des hausses de taux futures.",
    question:"Quelle nuance manque ?",
    choix:["Aucune, le taux fixe est toujours la meilleure option","C'est vrai sur la protection, mais un taux fixe démarre en général plus haut qu'un taux variable de départ — c'est un compromis, pas un avantage sans contrepartie","Le taux fixe change chaque année comme le variable","Un crédit à taux fixe n'existe pas en France"],
    bonneReponse:1,
    explication:"Le taux fixe protège bien contre une hausse future des taux, en échange d'un taux de départ souvent un peu plus élevé qu'un taux variable au même moment : c'est un arbitrage entre sécurité et coût immédiat, pas un avantage gratuit."},
  {id:"mc-vm-007", domain:"Business", categorie:"Startup", niveau:"intermediaire", format:"vraimais", estimatedTime:2, xp:10,
    conceptsTested:["levée de fonds vs rentabilité"],
    statement:"Beaucoup de startups à succès lèvent plusieurs millions d'euros.",
    question:"Quelle nuance manque ?",
    choix:["Aucune, lever des millions prouve que l'entreprise est rentable","Une levée de fonds est du capital apporté par des investisseurs en échange de parts, pas un profit réalisé par l'entreprise — elle peut lever des millions tout en étant largement déficitaire","Lever des fonds signifie que l'entreprise n'a plus de dettes","Une levée de fonds rembourse automatiquement les investisseurs"],
    bonneReponse:1,
    explication:"Une levée de fonds finance la croissance (recrutement, développement, marketing...) avant que l'entreprise ne soit rentable, voire sans certitude qu'elle le devienne. Le montant levé mesure la confiance des investisseurs dans le potentiel futur, pas la rentabilité actuelle de l'entreprise."},

  // ---------- Format "calcul" (mini-calcul, réponse numérique libre) ----------
  {id:"mc-calc-001", domain:"Bourse", categorie:"Bourse", niveau:"debutant", format:"calcul", estimatedTime:1, xp:8,
    conceptsTested:["variation en pourcentage"],
    prompt:"Une action passe de 100€ à 80€. Quelle est la baisse, en % ?", unit:"%", reponse:20, tolerance:0.5,
    explication:"(100 − 80) / 100 = 20%. La variation en pourcentage se calcule toujours par rapport à la valeur de départ."},
  {id:"mc-calc-002", domain:"Finance personnelle", categorie:"Inflation", niveau:"intermediaire", format:"calcul", estimatedTime:2, xp:10,
    conceptsTested:["pouvoir d'achat réel"],
    prompt:"Ton salaire augmente de 2%, l'inflation est de 5% sur la même période. Quelle est approximativement la variation de ton pouvoir d'achat, en % ?", unit:"%", reponse:-3, tolerance:0.5,
    explication:"2% − 5% ≈ −3% : ton salaire nominal augmente, mais moins vite que les prix. En termes réels, ton pouvoir d'achat recule d'environ 3%, même si le chiffre sur ta fiche de paie a augmenté."},
  {id:"mc-calc-003", domain:"Business", categorie:"Marge nette", niveau:"debutant", format:"calcul", estimatedTime:1, xp:8,
    conceptsTested:["marge brute"],
    prompt:"Une entreprise vend 100€ un produit qui lui coûte 60€ à produire. Quelle est sa marge brute, en euros ?", unit:"€", reponse:40, tolerance:1,
    explication:"100 − 60 = 40€ de marge brute par produit vendu, avant les autres charges de l'entreprise (loyers, salaires, marketing...)."},
  {id:"mc-calc-004", domain:"Finance personnelle", categorie:"Intérêts composés", niveau:"intermediaire", format:"calcul", estimatedTime:2, xp:10,
    conceptsTested:["intérêts composés"],
    prompt:"500€ placés à 4% par an en intérêts composés pendant 2 ans valent approximativement combien ?", unit:"€", reponse:540.8, tolerance:3,
    explication:"500 × 1,04 × 1,04 ≈ 540,80€. La deuxième année, les 4% s'appliquent aussi sur les intérêts de la première année, pas seulement sur les 500€ de départ."},
  {id:"mc-calc-005", domain:"Finance personnelle", categorie:"Crédit", niveau:"debutant", format:"calcul", estimatedTime:1, xp:8,
    conceptsTested:["intérêts simples"],
    prompt:"Tu empruntes 10 000€ sur 1 an à 5% (intérêt simple, remboursé en une fois). Combien payes-tu d'intérêts ?", unit:"€", reponse:500, tolerance:10,
    explication:"10 000 × 5% = 500€ d'intérêts sur l'année, en plus des 10 000€ empruntés à rembourser."},
  {id:"mc-calc-006", domain:"Immobilier", categorie:"Immobilier", niveau:"intermediaire", format:"calcul", estimatedTime:2, xp:10,
    conceptsTested:["rendement locatif brut"],
    prompt:"Un bien à 200 000€ se loue 1 000€/mois. Quel est le rendement locatif brut annuel, en % ?", unit:"%", reponse:6, tolerance:0.3,
    explication:"1 000 × 12 = 12 000€ de loyers annuels. 12 000 / 200 000 = 6% de rendement brut — avant charges, taxe foncière, vacance locative et fiscalité."},
  {id:"mc-calc-007", domain:"Économie", categorie:"PIB", niveau:"intermediaire", format:"calcul", estimatedTime:1, xp:10,
    conceptsTested:["taux de croissance"],
    prompt:"Le PIB d'un pays passe de 2 000 à 2 060 milliards d'euros en un an. Quel est le taux de croissance, en % ?", unit:"%", reponse:3, tolerance:0.2,
    explication:"(2 060 − 2 000) / 2 000 = 3%. Le taux de croissance rapporte la variation à la valeur de départ, comme pour toute variation en pourcentage."},
  {id:"mc-calc-008", domain:"Finance personnelle", categorie:"Épargne", niveau:"debutant", format:"calcul", estimatedTime:1, xp:8,
    conceptsTested:["accumulation d'épargne"],
    prompt:"Tu épargnes 200€ par mois pendant 18 mois, sans aucun rendement. Combien as-tu accumulé au total ?", unit:"€", reponse:3600, tolerance:20,
    explication:"200 × 18 = 3 600€. Sans rendement, l'accumulation est une simple somme des versements — utile pour estimer rapidement le temps nécessaire pour atteindre un objectif d'épargne."},

  // ---------- Format "sequence" (remettre dans l'ordre une chaîne causale) ----------
  {id:"mc-seq-001", domain:"Économie", categorie:"Taux directeur", niveau:"intermediaire", format:"sequence", estimatedTime:2, xp:12,
    conceptsTested:["transmission monétaire"],
    prompt:"La BCE augmente fortement ses taux directeurs. Remets dans l'ordre ce qui risque de se produire ensuite.",
    steps:["Le coût du crédit augmente pour les banques puis pour les emprunteurs","Les nouveaux emprunts (immobilier, entreprises) ralentissent","La consommation et l'investissement peuvent ralentir à leur tour","La pression inflationniste peut diminuer"],
    explication:"C'est le mécanisme classique de transmission de la politique monétaire : un taux directeur plus élevé renchérit le crédit, ce qui freine la demande de crédit, puis la consommation et l'investissement, ce qui peut in fine calmer l'inflation — avec un délai de plusieurs mois entre chaque étape."},
  {id:"mc-seq-002", domain:"Économie", categorie:"Récession", niveau:"intermediaire", format:"sequence", estimatedTime:2, xp:12,
    conceptsTested:["cycle économique"],
    prompt:"Remets dans l'ordre les étapes typiques d'un ralentissement économique qui s'aggrave.",
    steps:["Les entreprises vendent moins que prévu","Elles réduisent leurs investissements et embauches","Le chômage augmente","La consommation des ménages ralentit encore davantage"],
    explication:"Ce cercle peut s'auto-entretenir : une baisse des ventes pousse les entreprises à réduire leurs coûts (dont l'emploi), ce qui réduit le revenu des ménages et donc, à nouveau, la consommation — l'un des mécanismes qui peut transformer un ralentissement en récession plus marquée."},
  {id:"mc-seq-003", domain:"Business", categorie:"Levée de fonds", niveau:"intermediaire", format:"sequence", estimatedTime:2, xp:12,
    conceptsTested:["mécanique d'une levée de fonds"],
    prompt:"Remets dans l'ordre les étapes d'une levée de fonds classique pour une startup.",
    steps:["La startup présente son projet et ses besoins de financement à des investisseurs","Les deux parties négocient une valorisation de l'entreprise","Les investisseurs versent les fonds en échange de parts (actions)","Le capital de l'entreprise est désormais réparti entre plus d'actionnaires"],
    explication:"Une levée de fonds n'est pas un don ni un prêt classique : elle dilue mécaniquement la part de propriété des actionnaires déjà présents, en échange du financement apporté par les nouveaux investisseurs."},
  {id:"mc-seq-004", domain:"Finance personnelle", categorie:"Crédit", niveau:"debutant", format:"sequence", estimatedTime:2, xp:10,
    conceptsTested:["conséquences d'un défaut de paiement"],
    prompt:"Remets dans l'ordre ce qui se passe généralement si un emprunteur cesse de payer ses mensualités de crédit.",
    steps:["L'emprunteur ne paie plus ses mensualités","La banque envoie des relances et applique des pénalités de retard","La situation continue de se dégrader si rien n'est fait","La banque peut engager une procédure de recouvrement, voire de saisie"],
    explication:"Un incident de paiement isolé n'entraîne pas immédiatement les conséquences les plus graves, mais la situation s'aggrave par étapes si elle n'est pas régularisée — d'où l'intérêt de contacter sa banque dès les premières difficultés plutôt que d'attendre."},
  {id:"mc-seq-005", domain:"Économie", categorie:"Offre et demande", niveau:"debutant", format:"sequence", estimatedTime:2, xp:10,
    conceptsTested:["mécanisme prix/rareté"],
    prompt:"Remets dans l'ordre ce qui se produit typiquement quand la demande pour un bien augmente fortement alors que l'offre reste limitée.",
    steps:["La demande pour ce bien augmente fortement","L'offre disponible ne peut pas suivre au même rythme","Les vendeurs peuvent augmenter leurs prix","Les acheteurs les plus sensibles au prix renoncent ou se retirent du marché"],
    explication:"C'est le mécanisme de base de la formation des prix par rareté : quand la demande dépasse une offre limitée, les prix montent jusqu'à ce qu'un nouvel équilibre se forme, ce qui exclut progressivement les acheteurs les moins disposés à payer ce nouveau prix."},
  {id:"mc-seq-006", domain:"Bourse", categorie:"Bourse", niveau:"intermediaire", format:"sequence", estimatedTime:2, xp:12,
    conceptsTested:["dynamique d'un choc de marché"],
    prompt:"Remets dans l'ordre le déroulement typique d'une panique boursière après une mauvaise nouvelle économique.",
    steps:["Une nouvelle économique négative surprend le marché","De nombreux investisseurs vendent dans un mouvement de panique","Les cours chutent fortement en peu de temps","Certains investisseurs profitent des prix bas pour acheter"],
    explication:"Les fortes baisses de marché suivent souvent ce schéma : une surprise négative déclenche des ventes qui s'auto-alimentent à court terme, avant qu'un nouvel équilibre de prix n'attire des acheteurs — sans que cela signifie que le point bas soit atteint pour autant."},
  {id:"mc-seq-007", domain:"Business", categorie:"Startup", niveau:"avance", format:"sequence", estimatedTime:2, xp:14,
    conceptsTested:["runway", "trésorerie"],
    prompt:"Remets dans l'ordre ce qui se passe pour une startup qui dépense plus qu'elle n'encaisse chaque mois, sans changer de trajectoire.",
    steps:["La startup dépense plus qu'elle n'encaisse chaque mois (burn rate négatif)","Sa trésorerie disponible diminue progressivement","Le nombre de mois de trésorerie restants (runway) se réduit","L'entreprise doit lever de nouveaux fonds ou devenir rentable avant d'être à court d'argent"],
    explication:"C'est la mécanique du « runway » : chaque mois de pertes réduit la trésorerie restante, ce qui fixe une échéance implicite à laquelle l'entreprise doit avoir trouvé une solution (nouveau financement ou rentabilité) sous peine de ne plus pouvoir payer ses charges."},

  // ---------- Format "infomanquante" (quelles informations manquent pour conclure) ----------
  {id:"mc-info-001", domain:"Immobilier", categorie:"Immobilier", niveau:"intermediaire", format:"infomanquante", estimatedTime:2, xp:8,
    conceptsTested:["rendement locatif", "coûts cachés"],
    contexte:"Un appartement coûte 120 000€ et se loue 900€/mois. Est-ce une excellente affaire ? Impossible à déterminer avec ces seules informations.",
    question:"Quelles informations voudrais-tu connaître avant de te prononcer ?",
    options:[
      {label:"Les charges de copropriété", note:"Réduisent directement le revenu locatif net."},
      {label:"La taxe foncière", note:"Charge annuelle récurrente souvent oubliée dans les calculs rapides."},
      {label:"Des travaux à prévoir", note:"Peuvent représenter un coût important non reflété dans le prix d'achat."},
      {label:"Le risque de vacance locative", note:"Des mois sans locataire réduisent le rendement réel sur l'année."},
      {label:"La localisation précise", note:"Détermine la demande locative et la perspective de valorisation."},
      {label:"Le mode de financement (cash ou crédit)", note:"Change complètement la rentabilité réelle de l'opération."}
    ],
    explication:"Le rendement brut apparent (900×12/120000 = 9%) semble élevé, mais aucune décision sérieuse ne peut se prendre sans ces éléments : ils peuvent faire basculer un projet qui a l'air excellent vers un projet à peine rentable, ou l'inverse."},
  {id:"mc-info-002", domain:"Bourse", categorie:"Bourse", niveau:"avance", format:"infomanquante", estimatedTime:2, xp:10,
    conceptsTested:["valorisation relative"],
    contexte:"Une action se paie 40 fois ses bénéfices annuels (PER de 40). Est-ce cher ?",
    question:"Quelles informations voudrais-tu connaître avant de conclure ?",
    options:[
      {label:"Le secteur d'activité de l'entreprise", note:"Les niveaux de valorisation normaux varient énormément d'un secteur à l'autre."},
      {label:"La croissance attendue des bénéfices futurs", note:"Un PER élevé peut se justifier par une forte croissance anticipée."},
      {label:"Le PER moyen d'entreprises comparables", note:"Un chiffre isolé, sans comparaison, ne dit presque rien."},
      {label:"L'évolution récente des bénéfices de l'entreprise", note:"Des bénéfices en forte hausse ou en baisse changent complètement la lecture du ratio."}
    ],
    explication:"Un PER de 40 n'est ni intrinsèquement cher ni bon marché : cela dépend entièrement du contexte (secteur, croissance attendue, comparaison avec des entreprises similaires). Juger une valorisation sans ces repères revient à comparer un prix sans savoir ce qu'il achète."},
  {id:"mc-info-003", domain:"Business", categorie:"Startup", niveau:"intermediaire", format:"infomanquante", estimatedTime:2, xp:8,
    conceptsTested:["levée de fonds", "dilution"],
    contexte:"Une startup annonce avoir levé 2 millions d'euros. Est-ce un succès ?",
    question:"Quelles informations voudrais-tu connaître avant de conclure ?",
    options:[
      {label:"La valorisation retenue pour l'opération", note:"Détermine la part réellement cédée par les fondateurs pour ce montant."},
      {label:"La dilution subie par les fondateurs", note:"Une bonne levée peut quand même être défavorable pour les fondateurs si elle est mal négociée."},
      {label:"L'utilisation prévue des fonds", note:"Un financement mal employé ne garantit aucun succès futur."},
      {label:"La rentabilité actuelle de l'entreprise", note:"Une levée de fonds finance souvent des pertes, ce n'est pas un signe de rentabilité."}
    ],
    explication:"Le montant levé seul ne dit presque rien du succès réel de l'opération pour l'entreprise et ses fondateurs : une levée importante à une valorisation défavorable, ou mal utilisée ensuite, peut se révéler être un mauvais résultat malgré les apparences."},
  {id:"mc-info-004", domain:"Finance personnelle", categorie:"Crédit", niveau:"debutant", format:"infomanquante", estimatedTime:2, xp:8,
    conceptsTested:["coût total du crédit"],
    contexte:"On te propose un crédit à un taux de 3%. Est-ce un bon taux ?",
    question:"Quelles informations voudrais-tu connaître avant de conclure ?",
    options:[
      {label:"La durée du prêt", note:"Un même taux coûte beaucoup plus cher en intérêts totaux sur une durée longue."},
      {label:"Le coût de l'assurance emprunteur", note:"S'ajoute au taux nominal et peut représenter une part importante du coût total."},
      {label:"Les frais de dossier et de garantie", note:"Font partie du coût réel de l'opération, au-delà du seul taux d'intérêt."},
      {label:"Le niveau des taux du marché à ce moment-là", note:"Un taux ne se juge jamais dans l'absolu, seulement par comparaison."}
    ],
    explication:"Un taux affiché seul ne représente qu'une partie du coût réel d'un crédit : durée, assurance et frais annexes peuvent faire une différence considérable entre deux offres au même taux nominal."},
  {id:"mc-info-005", domain:"Business", categorie:"Marge nette", niveau:"intermediaire", format:"infomanquante", estimatedTime:2, xp:8,
    conceptsTested:["marge sectorielle"],
    contexte:"Une entreprise affiche une marge nette de 5%. Est-ce faible ?",
    question:"Quelles informations voudrais-tu connaître avant de conclure ?",
    options:[
      {label:"Le secteur d'activité", note:"5% peut être normal (grande distribution) ou très faible (édition de logiciels) selon le secteur."},
      {label:"La marge nette moyenne du secteur", note:"Un chiffre isolé n'a de sens qu'en comparaison."},
      {label:"L'évolution de cette marge dans le temps", note:"Une marge stable à 5% n'a pas la même signification qu'une marge en baisse constante."},
      {label:"La taille de l'entreprise", note:"Les structures de coûts diffèrent fortement entre une petite structure et un grand groupe."}
    ],
    explication:"Les niveaux normaux de marge nette varient énormément d'un secteur à l'autre (souvent moins de 5% dans la distribution, bien plus dans certains services) : juger une marge sans repère sectoriel n'a pas de sens."},
  {id:"mc-info-006", domain:"Finance personnelle", categorie:"Assurance-vie", niveau:"intermediaire", format:"infomanquante", estimatedTime:2, xp:8,
    conceptsTested:["performance vs risque d'un contrat"],
    contexte:"Un contrat d'assurance-vie affiche +4% l'an dernier. Est-ce un bon contrat ?",
    question:"Quelles informations voudrais-tu connaître avant de conclure ?",
    options:[
      {label:"Les frais de gestion annuels", note:"Réduisent directement la performance réellement perçue par l'épargnant."},
      {label:"Le type de support (fonds euro sécurisé ou unités de compte)", note:"Détermine si ce rendement s'accompagne d'un vrai risque de perte en capital."},
      {label:"La performance sur plusieurs années, pas une seule", note:"Une seule bonne année ne dit rien de la régularité du contrat."},
      {label:"Le niveau de risque réellement pris pour obtenir ce résultat", note:"Un même rendement affiché peut correspondre à des niveaux de risque très différents."}
    ],
    explication:"+4% sur un fonds euro sécurisé et +4% sur des unités de compte risquées ne représentent pas du tout la même performance ajustée du risque : sans ces précisions, un chiffre de performance isolé reste largement incomparable."},

  // ---------- Format "classe" (classer des éléments dans des catégories) ----------
  {id:"mc-classe-001", domain:"Bourse", categorie:"Diversification", niveau:"debutant", format:"classe", estimatedTime:2, xp:12,
    conceptsTested:["niveaux de risque relatifs"],
    prompt:"Classe ces placements selon leur niveau de risque approximatif.",
    buckets:["Faible","Modéré","Élevé"],
    items:[
      {label:"Livret A", bucket:"Faible"},
      {label:"Obligation d'État solide", bucket:"Faible"},
      {label:"Actions d'une grande entreprise diversifiée", bucket:"Modéré"},
      {label:"Actions d'une seule petite entreprise", bucket:"Élevé"},
      {label:"Cryptoactif peu connu", bucket:"Élevé"}
    ],
    explication:"Le risque augmente globalement avec l'incertitude sur les revenus futurs et la volatilité du prix : capital garanti (Livret A, obligation d'État solide) < actions diversifiées de grandes entreprises < actions d'une seule petite entreprise ou cryptoactifs peu établis, plus volatils et moins prévisibles."},
  {id:"mc-classe-002", domain:"Finance personnelle", categorie:"Budget", niveau:"debutant", format:"classe", estimatedTime:2, xp:10,
    conceptsTested:["priorisation budgétaire"],
    prompt:"Classe ces dépenses par priorité si ton budget devient déficitaire.",
    buckets:["Indispensable","Important","Réductible","Superflu"],
    items:[
      {label:"Loyer", bucket:"Indispensable"},
      {label:"Facture d'électricité", bucket:"Indispensable"},
      {label:"Assurance auto obligatoire", bucket:"Important"},
      {label:"Abonnement streaming", bucket:"Réductible"},
      {label:"Sorties au restaurant", bucket:"Superflu"}
    ],
    explication:"En cas de budget déficitaire, l'ordre logique de révision va du plus superflu au plus indispensable : les dépenses de confort (sorties, abonnements) se réduisent généralement avant les dépenses contraintes (loyer, énergie) ou obligatoires (assurances)."},
  {id:"mc-classe-003", domain:"Économie", categorie:"Taux directeur", niveau:"intermediaire", format:"classe", estimatedTime:2, xp:12,
    conceptsTested:["chaîne de transmission monétaire"],
    prompt:"Classe ces événements du plus direct au plus indirect après une hausse des taux directeurs.",
    buckets:["Effet direct","Effet indirect","Effet très indirect"],
    items:[
      {label:"Le coût du crédit augmente pour les banques", bucket:"Effet direct"},
      {label:"Les nouveaux emprunts immobiliers ralentissent", bucket:"Effet indirect"},
      {label:"La consommation générale des ménages ralentit", bucket:"Effet très indirect"}
    ],
    explication:"Une hausse de taux directeur agit d'abord directement sur le coût de refinancement des banques, puis se transmet avec un délai aux emprunteurs (crédits plus chers), puis, plus indirectement encore, à l'ensemble de la consommation et de l'investissement dans l'économie."},
  {id:"mc-classe-004", domain:"Business", categorie:"Bilan comptable", niveau:"intermediaire", format:"classe", estimatedTime:2, xp:12,
    conceptsTested:["structure d'un bilan"],
    prompt:"Classe ces éléments selon qu'ils appartiennent à l'actif ou au passif d'un bilan comptable.",
    buckets:["Actif","Passif"],
    items:[
      {label:"Trésorerie disponible", bucket:"Actif"},
      {label:"Stocks", bucket:"Actif"},
      {label:"Créances clients", bucket:"Actif"},
      {label:"Dettes bancaires", bucket:"Passif"},
      {label:"Capitaux propres", bucket:"Passif"}
    ],
    explication:"L'actif regroupe ce que l'entreprise possède (trésorerie, stocks, créances...), le passif indique comment cet actif est financé (dettes, capitaux propres). Par construction comptable, le total de l'actif est toujours égal au total du passif."},
  {id:"mc-classe-005", domain:"Finance personnelle", categorie:"Constitution d'un patrimoine", niveau:"intermediaire", format:"classe", estimatedTime:2, xp:12,
    conceptsTested:["horizon de placement"],
    prompt:"Classe ces objectifs financiers selon leur horizon de temps le plus adapté.",
    buckets:["Court terme","Moyen terme","Long terme"],
    items:[
      {label:"Fonds d'urgence disponible immédiatement", bucket:"Court terme"},
      {label:"Vacances prévues l'an prochain", bucket:"Court terme"},
      {label:"Apport pour un achat immobilier dans 5 ans", bucket:"Moyen terme"},
      {label:"Épargne retraite", bucket:"Long terme"}
    ],
    explication:"L'horizon de temps d'un objectif détermine le type de support adapté : un objectif proche demande de la disponibilité et de la sécurité (livret), un objectif lointain peut supporter davantage de risque en échange d'un potentiel de rendement plus élevé (actions, par exemple)."},
  {id:"mc-classe-006", domain:"Crypto", categorie:"Analyse crypto", niveau:"intermediaire", format:"classe", estimatedTime:2, xp:12,
    conceptsTested:["niveaux de risque relatifs en crypto"],
    prompt:"Classe ces situations selon leur niveau de risque relatif (tout reste risqué, mais pas au même degré).",
    buckets:["Modéré","Élevé","Très élevé"],
    items:[
      {label:"Stablecoin adossé à une monnaie réelle (hors risque de l'émetteur)", bucket:"Modéré"},
      {label:"Bitcoin (grande capitalisation, marché établi)", bucket:"Élevé"},
      {label:"Petite cryptomonnaie récente et peu connue", bucket:"Très élevé"}
    ],
    explication:"Même au sein des cryptoactifs, les niveaux de risque diffèrent : un stablecoin vise une valeur stable (mais garde un risque lié à son émetteur et à sa réserve), un actif établi comme le bitcoin reste très volatil mais bénéficie d'un marché profond, tandis qu'un projet récent et peu connu cumule volatilité, faible liquidité et risque d'échec du projet lui-même."},

  // ---------- Format "dilemme" (plusieurs choix défendables selon le contexte,
  // jamais une seule bonne réponse fabriquée artificiellement) ----------
  {id:"mc-dil-001", domain:"Finance personnelle", categorie:"Constitution d'un patrimoine", niveau:"intermediaire", format:"dilemme", estimatedTime:3, xp:20,
    conceptsTested:["arbitrage épargne/investissement", "contexte personnel"],
    situation:"Tu as 20 000 € d'épargne de côté, un revenu stable, aucune dette, et un fonds d'urgence déjà constitué.",
    question:"Que ferais-tu de cette somme ?",
    options:[
      {label:"Tout investir en bourse (ETF diversifié)", defensible:true, analyse:"Avec un horizon long et un fonds d'urgence déjà en place, investir la totalité maximise le temps passé sur le marché — mais expose 100% de la somme à la volatilité à court terme."},
      {label:"Investir progressivement sur plusieurs mois (DCA)", defensible:true, analyse:"Réduit le risque de tout investir au plus mauvais moment, au prix d'un rendement statistiquement un peu plus faible en moyenne sur longue période — un compromis psychologique autant que financier."},
      {label:"Tout garder en épargne liquide, par précaution", defensible:false, analyse:"Avec un fonds d'urgence déjà constitué et un horizon long, garder 20 000 € entièrement liquides revient à accepter une perte de pouvoir d'achat quasi certaine face à l'inflation, sans bénéfice de sécurité supplémentaire réel dans cette situation précise."},
      {label:"Répartir entre investissement et un nouveau projet (formation, achat professionnel...)", defensible:true, analyse:"Défendable si ce projet a un rendement attendu réel (revenu futur, compétence monétisable) — mais seulement si ce n'est pas un choix par défaut sans analyse du retour attendu."}
    ],
    conclusion:"Il n'y a pas une seule bonne réponse ici : investir intégralement et investir progressivement sont tous deux raisonnables selon la tolérance à la volatilité à court terme, et répartir vers un projet peut l'être aussi selon sa qualité. Tout garder en liquide est la seule option sans justification solide dans ce contexte précis (fonds d'urgence déjà là, horizon long)."},
  {id:"mc-dil-002", domain:"Bourse", categorie:"Risque et volatilité", niveau:"intermediaire", format:"dilemme", estimatedTime:3, xp:20,
    conceptsTested:["comportement face à une baisse de marché", "horizon d'investissement"],
    situation:"Le marché vient de chuter de 20% en quelques semaines. Ton portefeuille, investi pour la retraite dans 25 ans, a perdu 20% de sa valeur.",
    question:"Que fais-tu ?",
    options:[
      {label:"Je vends tout pour éviter d'autres pertes", defensible:false, analyse:"Vendre après une chute transforme une perte latente (qui peut se résorber avec le temps, sur un horizon de 25 ans) en perte réelle et définitive — souvent la pire décision au pire moment, sauf si l'horizon ou la tolérance au risque ont réellement changé entre-temps."},
      {label:"Je ne touche à rien et je continue mes versements programmés", defensible:true, analyse:"Avec un horizon de 25 ans, une baisse de 20% reste un épisode temporaire statistiquement fréquent ; continuer ses versements achète même des parts à prix réduit."},
      {label:"J'augmente temporairement mes versements, si mes finances le permettent", defensible:true, analyse:"Défendable si la situation financière personnelle le permet réellement (pas d'endettement pour le faire, fonds d'urgence intact) : acheter davantage pendant une baisse, sur un horizon long, est une stratégie reconnue — jamais une martingale garantie."},
      {label:"Je regarde les cours toutes les heures pour décider", defensible:false, analyse:"Une décision d'investissement de long terme ne devrait jamais dépendre d'un suivi compulsif des cours à court terme — ce comportement est justement ce qui pousse à vendre au plus mauvais moment."}
    ],
    conclusion:"Ne rien changer et augmenter ses versements sont tous deux raisonnables pour un horizon de 25 ans ; ce qui les distingue est uniquement la capacité financière réelle à investir davantage, jamais une garantie de gain. Vendre dans la panique et suivre les cours en continu sont les deux réactions les plus corrélées aux pertes réelles des investisseurs particuliers."},
  {id:"mc-dil-003", domain:"Business", categorie:"Levée de fonds", niveau:"avance", format:"dilemme", estimatedTime:4, xp:25,
    conceptsTested:["dette vs capital", "dilution", "coût du financement"],
    situation:"Ta startup a besoin de 200 000 € pour continuer à se développer. Une banque propose un prêt à taux fixe ; un investisseur propose la même somme contre 15% du capital.",
    question:"Quelle option choisis-tu ?",
    options:[
      {label:"Le prêt bancaire", defensible:true, analyse:"Tu gardes 100% du capital et le contrôle de l'entreprise, mais tu dois rembourser quoi qu'il arrive, y compris si l'activité ne décolle pas comme prévu — un vrai risque si les revenus sont encore incertains."},
      {label:"L'investisseur", defensible:true, analyse:"Aucun remboursement obligatoire si l'entreprise échoue, et l'investisseur peut apporter réseau et expertise — mais tu cèdes une part réelle et durable du capital, et une partie du pouvoir de décision."},
      {label:"Refuser les deux et attendre d'avoir plus de revenus propres", defensible:true, analyse:"Défendable si l'activité peut réellement attendre sans perdre d'opportunité concurrentielle — mais risque de laisser un concurrent occuper le terrain pendant l'attente."},
      {label:"Prendre les deux en même temps pour maximiser les moyens disponibles", defensible:false, analyse:"Cumuler dette et dilution du capital pour le même besoin de financement, sans plan clair distinguant ce que chaque euro va financer, revient à maximiser les deux contraintes (remboursement fixe et perte de contrôle) sans raison financière de le faire."}
    ],
    conclusion:"Le choix entre le prêt, l'investisseur et l'attente dépend surtout de la confiance dans la stabilité des revenus futurs, de la valeur ajoutée réelle d'un investisseur au-delà de l'argent, et du coût réel d'attendre. Aucune de ces trois options n'est universellement supérieure aux deux autres."},

  // ---------- Format "enquete" (plusieurs indices réels à croiser avant de conclure) ----------
  {id:"mc-enq-001", domain:"Business", categorie:"Bilan comptable", niveau:"avance", format:"enquete", estimatedTime:5, xp:25,
    conceptsTested:["cash-flow vs résultat comptable", "cohérence des indicateurs financiers"],
    affirmation:"« Notre entreprise a fortement amélioré sa situation financière cette année », déclare le PDG dans son rapport annuel.",
    indices:[
      {label:"Chiffre d'affaires", valeur:"+18% sur un an"},
      {label:"Bénéfice net", valeur:"+5% sur un an"},
      {label:"Dette totale", valeur:"+40% sur un an"},
      {label:"Cash-flow opérationnel", valeur:"-12% sur un an"},
      {label:"Créances clients", valeur:"+35% sur un an"},
      {label:"Stocks", valeur:"+28% sur un an"}
    ],
    question:"Qu'est-ce qui est le plus incohérent avec l'affirmation du PDG ?",
    choix:[
      "Le chiffre d'affaires n'a pas assez augmenté",
      "Le cash-flow opérationnel baisse alors que le chiffre d'affaires et les créances augmentent fortement — signe possible que les ventes ne sont pas encore encaissées, voire de difficultés à recouvrer les paiements",
      "Le bénéfice net a augmenté, donc tout va bien",
      "La dette a augmenté, ce qui est toujours un mauvais signe"
    ],
    bonneReponse:1,
    explication:"Une hausse du chiffre d'affaires et des créances clients accompagnée d'une baisse du cash-flow opérationnel est un vrai signal d'alerte : l'entreprise vend plus mais encaisse moins, ou les délais de paiement clients s'allongent. C'est un cas classique où le compte de résultat semble bon mais la trésorerie réelle se dégrade — la dette augmente probablement pour compenser ce manque de cash. La dette seule n'est jamais automatiquement un mauvais signe (tout dépend de son usage), et un bénéfice en hausse ne suffit jamais à conclure seul."},
  {id:"mc-enq-002", domain:"Bourse", categorie:"Actions", niveau:"avance", format:"enquete", estimatedTime:5, xp:25,
    conceptsTested:["PER dans son contexte", "signaux de détérioration"],
    affirmation:"Un ami te dit : « Cette action est vraiment bon marché en ce moment, il faut en profiter. »",
    indices:[
      {label:"PER de l'action", valeur:"8 (moyenne du secteur : 18)"},
      {label:"Croissance du chiffre d'affaires", valeur:"-15% sur 3 ans"},
      {label:"Dette nette / EBITDA", valeur:"6× (secteur : 2× en moyenne)"},
      {label:"Dividende", valeur:"supprimé il y a 6 mois"},
      {label:"Cours de l'action", valeur:"-70% sur 2 ans"}
    ],
    question:"Que suggère le plus fortement ce dossier ?",
    choix:[
      "L'action est sous-évaluée par le marché, c'est une opportunité claire",
      "Un PER faible associé à une croissance négative, un endettement élevé et un dividende supprimé suggère plutôt que le marché anticipe des difficultés réelles, pas une erreur de valorisation",
      "Le PER est le seul chiffre qui compte pour juger si une action est chère",
      "La baisse du cours sur 2 ans garantit un rebond prochain"
    ],
    bonneReponse:1,
    explication:"Un PER faible peut parfois signaler une vraie sous-évaluation, mais ici il est accompagné de plusieurs signaux cohérents de détérioration réelle (croissance négative, endettement élevé, dividende supprimé) — le marché intègre probablement ces risques dans le prix plutôt que de se tromper. Un PER isolé ne permet jamais de conclure seul."},
  {id:"mc-enq-003", domain:"Finance personnelle", categorie:"Crédit", niveau:"intermediaire", format:"enquete", estimatedTime:4, xp:20,
    conceptsTested:["coût comparé de plusieurs dettes", "fonds d'urgence"],
    affirmation:"Un proche affirme : « Je rembourse ma maison plus vite que prévu, ma situation financière s'améliore clairement. »",
    indices:[
      {label:"Épargne de précaution", valeur:"200 € (recommandé : plusieurs mois de dépenses)"},
      {label:"Solde de la carte de crédit à la consommation", valeur:"en hausse"},
      {label:"Remboursement immobilier anticipé", valeur:"+300 €/mois"},
      {label:"Taux du crédit immobilier", valeur:"1,8 % (fixé il y a 5 ans)"},
      {label:"Taux moyen d'une carte de crédit à la consommation", valeur:"environ 18 %"}
    ],
    question:"Quel est le problème le plus probable dans ce raisonnement ?",
    choix:[
      "Rembourser plus vite un crédit immobilier est toujours la meilleure décision possible",
      "Rembourser par anticipation un crédit à 1,8% pendant que le solde d'une carte à environ 18% augmente revient probablement à perdre de l'argent au global, en plus de réduire l'épargne de précaution en dessous du seuil recommandé",
      "Le taux du crédit immobilier n'a aucune importance dans ce calcul",
      "L'absence d'épargne de précaution n'est pas liée à la question du remboursement anticipé"
    ],
    bonneReponse:1,
    explication:"Rembourser par anticipation un crédit peu coûteux (1,8%) a beaucoup moins de valeur que d'éponger une dette à un taux bien plus élevé (environ 18%) — chaque euro utilisé pour l'un est un euro qui ne sert pas à l'autre. Une épargne de précaution insuffisante aggrave encore le risque : un imprévu obligerait probablement à emprunter de nouveau, potentiellement au taux élevé de la carte."},
  {id:"mc-dil-004", domain:"Finance personnelle", categorie:"Retraite et PER", niveau:"intermediaire", format:"dilemme", estimatedTime:3, xp:20,
    conceptsTested:["avantage fiscal vs liquidité", "horizon long terme"],
    situation:"Tu as 35 ans, un revenu confortable, et tu hésites entre plusieurs façons de préparer ta retraite.",
    question:"Quelle stratégie choisis-tu ?",
    options:[
      {label:"Verser sur un PER (Plan d'Épargne Retraite), bloqué jusqu'à la retraite", defensible:true, analyse:"L'avantage fiscal à l'entrée peut être réel selon ta tranche d'imposition actuelle, mais l'argent reste bloqué (sauf cas exceptionnels) jusqu'à la retraite — un vrai arbitrage entre avantage fiscal immédiat et perte de liquidité pendant des décennies."},
      {label:"Investir en bourse via un compte-titres ou une assurance-vie, sans blocage", defensible:true, analyse:"Moins d'avantage fiscal immédiat qu'un PER dans certains cas, mais une vraie liberté : l'argent reste disponible si un besoin réel survient avant la retraite."},
      {label:"Ne rien mettre de côté maintenant, on verra plus tard", defensible:false, analyse:"Avec un horizon de plusieurs décennies, chaque année d'attente est une année d'intérêts composés perdue — repousser sans raison financière réelle (pas de dette prioritaire, pas de contrainte de trésorerie) a un vrai coût, même si rien de dramatique ne se passe visiblement à court terme."},
      {label:"Répartir entre un PER et un support plus liquide", defensible:true, analyse:"Défendable : diversifie l'avantage fiscal du PER avec la liberté d'un support non bloqué, au prix d'une allocation un peu plus complexe à suivre."}
    ],
    conclusion:"Verser sur un PER, investir librement et répartir entre les deux sont tous défendables selon l'importance donnée à l'avantage fiscal immédiat face à la liberté de disposer de l'argent avant la retraite. Ne rien faire est la seule option sans justification financière ici (revenu confortable, aucune contrainte particulière évoquée)."},
  {id:"mc-dil-005", domain:"Bourse", categorie:"Diversification", niveau:"debutant", format:"dilemme", estimatedTime:3, xp:18,
    conceptsTested:["concentration vs diversification", "vérification personnelle"],
    situation:"Tu as 15 000 € à investir. Un ami te conseille de tout mettre sur une seule action qu'il juge « certaine d'exploser ». Un autre te conseille un ETF monde diversifié.",
    question:"Que fais-tu ?",
    options:[
      {label:"Je mets tout sur l'action recommandée par mon ami", defensible:false, analyse:"Concentrer 100% du capital sur une seule action expose à un risque spécifique énorme (si cette entreprise se trompe, l'intégralité du capital est affectée) — aucune conviction transmise par un tiers, même forte, ne rend cette concentration prudente pour un particulier."},
      {label:"Je mets tout sur l'ETF diversifié", defensible:true, analyse:"Réduit fortement le risque spécifique à une seule entreprise, tout en restant exposé au risque de marché global — une approche raisonnable par défaut, en particulier sans expertise personnelle sur l'action recommandée."},
      {label:"Je mets une petite partie sur l'action (par exemple 5-10%) et le reste sur l'ETF", defensible:true, analyse:"Défendable si tu as une vraie thèse d'investissement sur cette action (analysée par toi-même, pas juste une conviction transmise) : limite le risque de concentration tout en gardant une exposition ciblée."},
      {label:"Je ne fais rien tant que je n'ai pas vérifié moi-même les chiffres de l'entreprise recommandée", defensible:true, analyse:"Toujours raisonnable de ne jamais investir uniquement sur la recommandation de quelqu'un d'autre sans vérification personnelle — la prudence n'est jamais un mauvais choix face à une incertitude réelle."}
    ],
    conclusion:"Investir dans l'ETF, répartir avec une petite part ciblée, ou vérifier avant d'agir sont tous défendables selon le niveau de conviction réel (et vérifié) sur l'action recommandée. Tout miser sur une seule action, sur simple recommandation d'un tiers, concentre un risque énorme sans base solide."},

  // ---------- Finance comportementale (biais, format dilemme) : jamais une
  // réponse "bonne/mauvaise" imposée, toujours le raisonnement qui compte —
  // même discipline que les dilemmes déjà existants (mc-dil-001 à 005). ----------
  {id:"mc-dil-006", domain:"Bourse", categorie:"Psychologie de l'investisseur", niveau:"debutant", format:"dilemme", estimatedTime:3, xp:18,
    conceptsTested:["FOMO", "décision motivée par l'urgence sociale plutôt que l'analyse"],
    situation:"Une cryptomonnaie que tu ne possèdes pas a été multipliée par 5 en une semaine. Plusieurs proches en parlent avec enthousiasme et semblent avoir déjà gagné beaucoup d'argent.",
    question:"Que fais-tu ?",
    options:[
      {label:"J'achète immédiatement, avant de « rater le train »", defensible:false, analyse:"Acheter uniquement par peur de manquer une hausse déjà survenue (FOMO), sans avoir analysé le projet ni son prix actuel, revient à acheter au moment où le risque de retournement est structurellement le plus élevé — l'enthousiasme collectif n'est pas une analyse."},
      {label:"Je prends le temps de me renseigner sur le projet avant toute décision", defensible:true, analyse:"Toujours raisonnable de comprendre ce qu'on achète (utilité réelle, tokenomics, risques) avant d'investir, indépendamment de l'engouement du moment — cela n'empêche pas d'investir ensuite si l'analyse le justifie."},
      {label:"Je n'achète pas, une hausse aussi rapide ne me semble pas un signal d'achat en soi", defensible:true, analyse:"Défendable : une forte hausse récente ne dit rien sur la valeur future, et peut au contraire signaler une phase spéculative avancée plutôt qu'une opportunité."},
      {label:"J'investis une somme que je ne peux pas me permettre de perdre, pour maximiser le gain potentiel", defensible:false, analyse:"Investir plus que ce qu'on peut se permettre de perdre reste déraisonnable quelle que soit la conviction — d'autant plus ici, où la décision est motivée par l'urgence sociale plutôt qu'une analyse."}
    ],
    conclusion:"Se renseigner avant de décider et choisir de ne pas investir sont deux réactions saines face au FOMO — le point commun des deux options défendables est qu'aucune décision n'est prise sous la seule pression de l'urgence sociale. Acheter dans la précipitation ou engager plus que ce qu'on peut perdre sont les deux réactions les plus corrélées aux pertes réelles des investisseurs particuliers."},
  {id:"mc-dil-007", domain:"Bourse", categorie:"Psychologie de l'investisseur", niveau:"intermediaire", format:"dilemme", estimatedTime:3, xp:20,
    conceptsTested:["effet de troupeau", "vente de panique pendant un krach"],
    situation:"Un krach boursier fait la une de tous les médias depuis plusieurs jours. Ton entourage vend massivement ses positions. Tu détiens un portefeuille diversifié, investi pour un objectif à 20 ans.",
    question:"Que fais-tu ?",
    options:[
      {label:"Je vends aussi, si tout le monde le fait c'est que ça doit être la bonne décision", defensible:false, analyse:"Suivre une décision uniquement parce qu'une majorité l'a prise, sans réévaluer sa propre situation (horizon, besoin réel de liquidités), c'est l'effet de troupeau — et c'est justement ce comportement collectif qui amplifie l'ampleur des krachs."},
      {label:"Je réévalue ma situation personnelle (horizon, besoin de liquidités) avant toute décision", defensible:true, analyse:"Toujours la bonne première étape : la décision doit dépendre de ta propre situation, pas de ce que font les autres — si rien n'a réellement changé pour toi, il n'y a pas de raison automatique d'agir."},
      {label:"Je ne fais rien, avec un horizon de 20 ans un krach reste statistiquement temporaire", defensible:true, analyse:"Défendable pour un horizon long : historiquement, les marchés actions se sont toujours redressés après un krach sur des horizons de plusieurs années à plusieurs décennies — sans que cela garantisse un avenir identique."},
      {label:"Je vends une partie pour « me rassurer », même si mon horizon n'a pas changé", defensible:false, analyse:"Vendre pour un simple soulagement émotionnel, sans que ta situation financière réelle (horizon, besoin de liquidités) ait changé, transforme une perte latente réversible en perte réalisée définitive."}
    ],
    conclusion:"Réévaluer sa situation personnelle et ne rien changer (si l'horizon le permet) sont défendables ; les deux s'appuient sur ta propre situation, pas sur le comportement du groupe. Vendre parce que « tout le monde vend », ou pour un simple soulagement émotionnel sans changement de situation réelle, illustrent l'effet de troupeau."},
  {id:"mc-dil-008", domain:"Bourse", categorie:"Psychologie de l'investisseur", niveau:"intermediaire", format:"dilemme", estimatedTime:3, xp:20,
    conceptsTested:["biais de confirmation", "remise en question d'une thèse d'investissement"],
    situation:"Tu as investi dans une entreprise en étant convaincu de son potentiel. Un ami, dont l'avis financier te semble sérieux, te montre un rapport détaillé pointant des signaux d'alerte réels sur cette même entreprise.",
    question:"Que fais-tu ?",
    options:[
      {label:"Je qualifie le rapport d'alarmiste et je continue de chercher des articles qui confirment ma vision initiale", defensible:false, analyse:"Écarter systématiquement toute information contraire à une conviction déjà formée, sans même l'examiner sérieusement, est la définition même du biais de confirmation — cela empêche toute réévaluation objective."},
      {label:"J'examine sérieusement le rapport, même s'il contredit ma position actuelle", defensible:true, analyse:"Toujours la bonne réaction : examiner une information contraire avec la même rigueur qu'une information favorable, indépendamment de ce qu'on espère qu'elle dise."},
      {label:"Je vends immédiatement toute ma position sur la seule base de ce rapport", defensible:false, analyse:"Basculer d'une confiance totale à une vente totale sur un seul rapport, sans vérification ni recoupement, est une réaction tout aussi excessive et non analytique que d'ignorer le rapport — la bonne réaction est d'abord d'examiner, pas de réagir immédiatement dans un sens ou dans l'autre."},
      {label:"Je cherche activement d'autres sources indépendantes pour vérifier les points soulevés par le rapport", defensible:true, analyse:"Défendable : recouper une information nouvelle et significative avec d'autres sources indépendantes, avant de décider, est une démarche analytique saine — dans un sens comme dans l'autre."}
    ],
    conclusion:"Examiner sérieusement le rapport et chercher à le recouper avec d'autres sources sont les deux réactions qui permettent une vraie réévaluation. Ignorer le rapport par confort, ou au contraire réagir dans la précipitation sans vérification, sont deux formes de décision non analytique — l'une par excès de confirmation, l'autre par sur-réaction."},
  {id:"mc-dil-009", domain:"Bourse", categorie:"Psychologie de l'investisseur", niveau:"intermediaire", format:"dilemme", estimatedTime:3, xp:20,
    conceptsTested:["excès de confiance", "taille de position et série de gains récents"],
    situation:"Tes 3 derniers investissements en actions ont tous été gagnants. Tu as une nouvelle idée d'investissement et envisages d'y consacrer une part bien plus importante de ton épargne que d'habitude.",
    question:"Que fais-tu ?",
    options:[
      {label:"Je mets une part beaucoup plus importante que d'habitude, ma méthode a fait ses preuves", defensible:false, analyse:"Une série de 3 gains peut être due à une vraie compétence, mais aussi en partie au hasard ou à un contexte de marché globalement favorable — l'interpréter comme la preuve certaine d'une compétence supérieure, sans analyse supplémentaire, est un signe classique d'excès de confiance."},
      {label:"Je garde la même taille de position que d'habitude, indépendamment des gains passés", defensible:true, analyse:"Défendable : une gestion disciplinée de la taille des positions, cohérente dans le temps, protège contre l'excès de confiance lié à une série de gains récents."},
      {label:"J'augmente légèrement la position, uniquement si l'analyse de cette nouvelle idée est réellement plus solide que les précédentes", defensible:true, analyse:"Défendable si l'augmentation est justifiée par la qualité de l'analyse de CETTE idée précise, et non par le simple fait que les précédentes ont réussi — la nuance est importante."},
      {label:"Je réduis mes recherches habituelles, mes choix passés ont montré que je « sais » choisir", defensible:false, analyse:"Réduire l'effort d'analyse parce que des choix passés ont réussi est une conséquence directe de l'excès de confiance — la qualité de l'analyse d'une nouvelle idée ne dépend en rien du succès des idées précédentes."}
    ],
    conclusion:"Garder une taille de position disciplinée, ou l'ajuster uniquement sur la base d'une analyse réellement plus solide de la nouvelle idée, sont défendables. Miser davantage ou analyser moins uniquement parce que les choix précédents ont réussi illustrent l'excès de confiance — une série de gains n'est pas une preuve de compétence certaine."},
  {id:"mc-dil-010", domain:"Bourse", categorie:"Psychologie de l'investisseur", niveau:"intermediaire", format:"dilemme", estimatedTime:3, xp:20,
    conceptsTested:["ancrage sur le prix d'achat", "réévaluation des fondamentaux"],
    situation:"Tu as acheté une action à 100 €. Elle vaut aujourd'hui 60 €. Depuis ton achat, les résultats de l'entreprise se sont réellement dégradés (perte de parts de marché, dette en forte hausse).",
    question:"Que fais-tu ?",
    options:[
      {label:"Je refuse de vendre tant qu'elle n'est pas revenue à 100 €, mon prix d'achat", defensible:false, analyse:"Le prix de 100 € était le prix auquel TU as acheté — il n'a aucune influence sur les perspectives futures réelles de l'entreprise. S'accrocher à ce chiffre pour décider aujourd'hui, malgré une dégradation réelle des fondamentaux, est un exemple typique d'ancrage."},
      {label:"Je réévalue l'entreprise sur ses perspectives actuelles, indépendamment de mon prix d'achat", defensible:true, analyse:"Toujours la bonne démarche : juger une position sur ses perspectives futures réelles (aujourd'hui dégradées ici), pas sur un prix passé qui n'a plus de pertinence."},
      {label:"Je vends, car les fondamentaux se sont réellement dégradés depuis mon achat", defensible:true, analyse:"Défendable si cette conclusion vient bien d'une réévaluation des perspectives actuelles de l'entreprise (dégradées ici), et non simplement de la déception du prix par rapport à l'achat."},
      {label:"J'achète davantage pour « baisser mon prix de revient moyen » et revenir à l'équilibre plus vite", defensible:false, analyse:"Renforcer une position en baisse dans le seul but de faire baisser son prix moyen d'achat (et non parce que l'analyse actuelle de l'entreprise le justifie) revient à investir plus d'argent pour satisfaire un ancrage psychologique, pas une conviction financière renouvelée."}
    ],
    conclusion:"Réévaluer l'entreprise sur ses perspectives actuelles, et vendre si cette réévaluation le justifie, sont les deux réactions qui s'appuient sur l'analyse plutôt que sur le prix d'achat. Refuser de vendre « tant que ce n'est pas revenu à 100€ », ou renforcer uniquement pour faire baisser le prix moyen, illustrent l'ancrage sur un chiffre qui n'a plus de pertinence."},
  {id:"mc-dil-011", domain:"Bourse", categorie:"Psychologie de l'investisseur", niveau:"avance", format:"dilemme", estimatedTime:4, xp:22,
    conceptsTested:["effet de disposition", "choix de la position à vendre"],
    situation:"Tu as besoin de liquidités et dois vendre une partie de ton portefeuille. Tu détiens deux actions en quantité comparable : l'une affiche +30% de gain latent, l'autre -30% de perte latente. Les perspectives futures des deux entreprises te semblent, après analyse, à peu près équivalentes.",
    question:"Laquelle vends-tu ?",
    options:[
      {label:"Je vends celle en gain, pour « sécuriser » le gain avant qu'il ne s'évapore", defensible:false, analyse:"Vendre systématiquement le gagnant et garder le perdant, sans différence réelle de perspectives entre les deux, est la définition même de l'effet de disposition — la décision devrait porter sur les perspectives futures, pas sur la performance déjà réalisée."},
      {label:"Je vends celle en perte, pour éviter d'accumuler encore plus de perte si elle continue de baisser", defensible:false, analyse:"Si la décision est motivée uniquement par la peur d'accumuler davantage de perte (et non par une analyse indiquant que cette entreprise a réellement de moins bonnes perspectives que l'autre), c'est une réaction émotionnelle à la perte latente, pas une décision financière."},
      {label:"Je vends celle dont les perspectives futures me semblent, après réanalyse, légèrement moins bonnes — peu importe si c'est la gagnante ou la perdante", defensible:true, analyse:"C'est la seule approche qui base la décision sur l'avenir plutôt que sur la performance déjà réalisée — exactement ce que l'effet de disposition empêche naturellement de faire."},
      {label:"Comme les perspectives me semblent vraiment équivalentes, je vends une part égale des deux plutôt que de choisir", defensible:true, analyse:"Défendable : si l'analyse conclut réellement à une équivalence des perspectives, répartir la vente évite d'introduire un biais arbitraire dans un sens ou dans l'autre."}
    ],
    conclusion:"Vendre sur la base d'une réévaluation des perspectives futures (quelle que soit la position déjà gagnante ou perdante), ou répartir la vente en cas d'équivalence réelle, sont les seules approches qui ne dépendent pas de la performance déjà réalisée. Vendre systématiquement le gagnant ou systématiquement le perdant, par réflexe plutôt que par analyse, illustre l'effet de disposition."},

  {id:"mc-enq-004", domain:"Économie", categorie:"Taux directeur", niveau:"avance", format:"enquete", estimatedTime:5, xp:25,
    conceptsTested:["délai de transmission monétaire", "limites d'une baisse de taux"],
    affirmation:"Un analyste déclare : « La banque centrale vient de baisser ses taux directeurs, c'est excellent pour l'économie, tout le monde va en profiter immédiatement. »",
    indices:[
      {label:"Taux directeur", valeur:"-0,5 point ce mois-ci"},
      {label:"Inflation", valeur:"encore à 6% (bien au-dessus de la cible de 2%)"},
      {label:"Chômage", valeur:"en hausse depuis 6 mois"},
      {label:"Délai de transmission historique d'une baisse de taux à l'économie réelle", valeur:"généralement plusieurs trimestres"},
      {label:"Confiance des ménages", valeur:"en baisse"}
    ],
    question:"Quel est le problème le plus important dans cette affirmation ?",
    choix:[
      "Une baisse de taux n'a jamais d'effet positif sur l'économie",
      "L'effet d'une baisse de taux se propage généralement avec un délai de plusieurs trimestres, et une inflation encore élevée limite la marge de manœuvre pour de nouvelles baisses — l'effet n'est ni immédiat, ni garanti pour tout le monde",
      "Le chômage n'a aucun rapport avec les taux directeurs",
      "Une seule baisse de taux suffit toujours à relancer une économie"
    ],
    bonneReponse:1,
    explication:"Les baisses de taux directeurs agissent avec un décalage réel (crédit moins cher, mais les effets sur l'investissement et la consommation prennent du temps à se matérialiser) — parler d'un effet « immédiat » est trompeur. Une inflation encore élevée limite aussi la capacité de la banque centrale à baisser davantage ses taux sans risquer de la relancer. Enfin, « tout le monde en profite immédiatement » ignore que les effets touchent différemment emprunteurs, épargnants et secteurs économiques."},
  {id:"mc-enq-005", domain:"Immobilier", categorie:"Immobilier", niveau:"intermediaire", format:"enquete", estimatedTime:5, xp:22,
    conceptsTested:["rendement brut vs net", "charges réelles d'un investissement locatif"],
    affirmation:"Un vendeur immobilier affirme : « Ce bien est un investissement locatif exceptionnel, le rendement affiché est de 8% brut, largement au-dessus du marché. »",
    indices:[
      {label:"Rendement brut affiché", valeur:"8%"},
      {label:"Charges de copropriété", valeur:"non incluses dans le calcul affiché"},
      {label:"Taxe foncière", valeur:"non incluse non plus"},
      {label:"Taux de vacance locative moyen du quartier", valeur:"élevé (immeuble ancien, forte rotation de locataires)"},
      {label:"Travaux de rénovation énergétique obligatoires", valeur:"à prévoir dans les 5 prochaines années, d'après le diagnostic"}
    ],
    question:"Que suggère le plus fortement ce dossier ?",
    choix:[
      "Le rendement brut de 8% est le seul chiffre à regarder pour juger de la qualité de l'investissement",
      "Le rendement brut ignore les charges, la taxe foncière, la vacance locative et les travaux à venir — le rendement net réel est probablement bien inférieur aux 8% annoncés",
      "Un rendement affiché au-dessus du marché est toujours une bonne nouvelle, sans autre vérification nécessaire",
      "Les travaux de rénovation énergétique n'ont aucun impact sur la rentabilité réelle"
    ],
    bonneReponse:1,
    explication:"Le rendement BRUT (loyer annuel ÷ prix d'achat) ne déduit aucune charge réelle — pour connaître la rentabilité réelle, il faut soustraire les charges de copropriété, la taxe foncière, les périodes de vacance locative probables, et anticiper les travaux obligatoires à venir. Un rendement affiché nettement au-dessus du marché, sans que ces éléments soient précisés, est souvent présenté sous son angle le plus favorable — pas nécessairement trompeur en soi, mais incomplet tant que le calcul net n'est pas fait."}
];

// ---------- Registre unique des 6 domaines Likanza ----------
// Source unique de vérité pour tout ce qui identifie un domaine ailleurs
// dans le site (anciennement dupliqué entre POSITIONING_DOMAINS,
// INTEREST_LIBRARY_CATEGORIES, INTEREST_QUIZ_CATEGORIES et
// INTEREST_DISPLAY_LABELS dans data.js, qui dérivent désormais tous de ce
// tableau). `quizCategories` = vraies catégories QUIZ_BANK_FULL/
// MENTAL_CHALLENGES du domaine (pour la maîtrise réelle et les quiz
// approfondis) ; `libraryCategories` = catégories de la Bibliothèque (glossaire) ;
// `mentalChallengeDomain` = valeur exacte du champ `domain` dans
// MENTAL_CHALLENGES (corrige un piège découvert : "Finance personnelle" au
// singulier là-bas contre "Finances personnelles" au pluriel comme libellé ici).
// deepQuizHook : accroche du quiz approfondi (quiz-approfondi.html), pensée
// pour ne jamais se présenter comme "un devoir de 8 minutes" — une question
// concrète plutôt qu'une durée en avant.
const DOMAINS = [
  {key:'personalFinance', label:'Finances personnelles', displayLabel:'les finances personnelles', icon:'💰',
    mentalChallengeDomain:'Finance personnelle',
    quizCategories:['Épargne', 'Livret A', 'Inflation', 'Intérêts simples', 'Intérêts composés', 'Budget', "Constitution d'un patrimoine", 'Fiscalité de base', 'Retraite et PER', 'Assurance-vie', 'Arnaques financières'],
    libraryCategories:['Finances personnelles', 'Épargne', 'Fiscalité'],
    deepQuizHook:{title:'Comprends-tu vraiment tes finances ?', subtitle:'Découvre tes forces et les notions à approfondir.'}},
  {key:'stockMarket', label:'Bourse', displayLabel:'la bourse', icon:'📈',
    mentalChallengeDomain:'Bourse',
    quizCategories:['Bourse', 'Actions', 'ETF', 'Obligations', 'Diversification', 'Risque et volatilité', 'PEA', "Psychologie de l'investisseur"],
    libraryCategories:['Bourse', 'Investissement', 'Analyse fondamentale', 'Gestion du risque', "Psychologie de l'investisseur"],
    deepQuizHook:{title:'Penses-tu vraiment comprendre la Bourse ?', subtitle:'Des situations concrètes pour découvrir tes forces.'}},
  {key:'business', label:'Business', displayLabel:'le Business', icon:'💼',
    mentalChallengeDomain:'Business',
    quizCategories:["Chiffre d'affaires", 'Marge nette', 'Bilan comptable', 'Amortissement', 'Startup', 'Levée de fonds'],
    libraryCategories:['Business', 'Entreprise'],
    deepQuizHook:{title:'Quel type d\'entrepreneur es-tu ?', subtitle:'Découvre tes forces et les notions que tu pourrais approfondir.'}},
  {key:'economics', label:'Économie', displayLabel:"l'économie", icon:'🌍',
    mentalChallengeDomain:'Économie',
    quizCategories:['PIB', 'Taux directeur', 'Banque centrale', 'Récession', 'Offre et demande', 'Commerce international'],
    libraryCategories:['Économie'],
    deepQuizHook:{title:'Comprends-tu vraiment l\'économie ?', subtitle:'Des situations concrètes pour tester ta compréhension.'}},
  {key:'realEstate', label:'Immobilier', displayLabel:"l'immobilier", icon:'🏠',
    mentalChallengeDomain:'Immobilier',
    quizCategories:['Immobilier', 'SCPI', 'Crédit'],
    libraryCategories:['Immobilier'],
    deepQuizHook:{title:'Immobilier : deal ou piège ?', subtitle:'Des mises en situation pour tester ton œil.'}},
  // 6 sous-compétences réelles (section 16 du prompt Learning Engine :
  // "Blockchain, Tokenomics, DeFi, Security, Trading, Analyse"), remplaçant
  // l'unique catégorie "Cryptoactifs" — chaque nom porte le suffixe "crypto"
  // là où une collision avec une catégorie non-crypto existante était
  // possible (Sécurité/Trading/Analyse), jamais avec le nom court d'un
  // domaine différent (categorieDomainKey résout par correspondance exacte
  // de chaîne : deux domaines ne doivent jamais partager le même nom de
  // catégorie).
  {key:'crypto', label:'Crypto', displayLabel:'la crypto', icon:'₿',
    mentalChallengeDomain:'Crypto',
    quizCategories:['Blockchain', 'Tokenomics', 'DeFi', 'Sécurité crypto', 'Trading crypto', 'Analyse crypto'],
    libraryCategories:['Crypto'],
    deepQuizHook:{title:'Crypto : sais-tu repérer les risques ?', subtitle:'Des situations concrètes pour tester tes réflexes.'}}
];

// ---------- Premier quiz de profil (100% déclaratif, aucune question notée) ----------
// « Pourquoi es-tu sur Likanza ? » — objectifs multiples, réutilisés pour la
// personnalisation immédiate (accueil, recommandations) — jamais pour calculer
// un niveau, ce champ n'a pas de bonne réponse.
const POSITIONING_GOALS = [
  {key:'personalFinance', label:'Mieux gérer mon argent'},
  {key:'stockMarket', label:'Commencer à investir'},
  {key:'stockMarket', label:'Mieux comprendre la Bourse'},
  {key:'economics', label:"Comprendre l'économie"},
  {key:'business', label:'Créer ou développer un business'},
  {key:'realEstate', label:"Comprendre l'immobilier"},
  {key:'crypto', label:'Comprendre la crypto'},
  {key:'general', label:'Améliorer ma culture financière'},
  {key:'general', label:"J'ai simplement envie d'apprendre plusieurs choses"}
];

// Centres d'intérêt : choix multiples, un intérêt peut être coché via
// plusieurs libellés proches (ex. "investir" et "comprendre la bourse"
// pointent tous deux vers stockMarket). Le champ "marketing" est une
// nuance d'intérêt supplémentaire à l'intérieur du Business (pas un 7e
// domaine — Likanza n'en compte que 6, voir DOMAINS ci-dessus).
const POSITIONING_INTERESTS = [
  {key:'personalFinance', label:'Mieux gérer mon argent au quotidien'},
  {key:'personalFinance', label:'Améliorer ma culture financière générale'},
  {key:'stockMarket', label:'Investir et comprendre la bourse'},
  {key:'stockMarket', label:'Comprendre les ETF'},
  {key:'realEstate', label:'Immobilier (achat, investissement locatif)'},
  {key:'business', label:'Créer ou développer un business'},
  {key:'marketing', label:'Marketing (acquisition, image de marque)'},
  {key:'economics', label:"Comprendre l'économie (taux, inflation, croissance)"},
  {key:'crypto', label:'Crypto-actifs'}
];

// Niveau déclaré par domaine : 4 choix, mappés positionnellement sur les 4
// niveaux déjà utilisés partout ailleurs sur le site (debutant/intermediaire/
// avance/expert) — une simple hypothèse de départ, jamais un niveau vérifié
// (voir getEvaluatedLevel dans data.js pour la version vérifiée).
const POSITIONING_LEVEL_CHOICES = [
  {value:'debutant', label:'Je découvre'},
  {value:'intermediaire', label:"J'ai quelques bases"},
  {value:'avance', label:'Je me débrouille'},
  {value:'expert', label:'Je connais déjà bien le sujet'}
];

// Manière d'apprendre (style pédagogique) + compréhension légère du risque.
// Le risque reste purement descriptif : il réutilise le même champ "risque"
// (prudent/équilibre/dynamique) déjà utilisé par le profil de Mon compte,
// jamais présenté comme un profil investisseur réglementaire.
const POSITIONING_LEARNING_STYLES = [
  {key:'explanations', label:'Une explication simple, avec des mots clairs'},
  {key:'examples', label:'Un exemple concret ou une mise en situation'},
  {key:'visual', label:'Un graphique ou un schéma visuel'},
  {key:'simulations', label:'Une simulation où je peux essayer moi-même'},
  {key:'quizzes', label:'Un quiz pour tester mes connaissances'}
];
const POSITIONING_RISK_COMFORT = [
  {value:'prudent', label:"Mal à l'aise : je préfère la sécurité, même pour un gain plus faible"},
  {value:'equilibre', label:"Ça dépend : un peu de risque ne me dérange pas si c'est mesuré"},
  {value:'dynamique', label:"À l'aise avec les variations si l'horizon est long"}
];

// ---------- Cours (lecture + quiz de validation) ----------
// Chaque cours regroupe des notions déjà présentes dans LIBRARY (aucun contenu
// dupliqué) et un quiz de validation puisé dans QUIZ_BANK_FULL par thème.
// Les points ne sont attribués qu'une fois le quiz de validation réussi.
const COURS_CATALOG = [
  // Premier cours pilote du chantier "Formation" (chapitres réels rédigés
  // pour Likanza — structure/pédagogie inspirées de Khan Academy et CFI,
  // aucun texte copié). Voir renderCoursRich/renderCourseBlock (data.js).
  {id:'bourse-actions', titre:'Comprendre la Bourse et les actions', niveau:'Débutant',
    libraryTermes:['Action','ETF','Capitalisation boursière','Obligation','PER (Price Earning Ratio)'],
    quizCategories:['Bourse','Actions','ETF','Obligations'],
    applyUrl:'bourse.html', applyLabel:'Voir de vraies fiches actions et leur PER réel',
    acquis:[
      "Expliquer ce qu'est une action et ce que possède réellement un actionnaire",
      "Calculer une capitalisation boursière à partir d'un cours et d'un nombre d'actions",
      "Distinguer une action, un ETF et une obligation",
      "Calculer un PER et l'interpréter sans le réduire à une règle simpliste"
    ],
    chapitres:[
      {titre:"1. Qu'est-ce qu'une action ?", blocs:[
        {type:'texte', texte:"Que se passe-t-il réellement quand tu achètes une action ? Tu ne reçois ni un billet, ni un produit — tu deviens propriétaire d'une toute petite partie d'une vraie entreprise."},
        {type:'definition', texte:"Une action représente une fraction du capital d'une entreprise. La détenir fait de toi un actionnaire : tu possèdes une part réelle de cette entreprise, avec les droits qui vont avec (vote en assemblée générale, part des bénéfices distribués)."},
        {type:'visualisation', schema:
"ENTREPRISE\n    │\n    ▼\n CAPITAL (divisé en actions)\n    │\n ┌──┴──┬─────┬─────┐\n │     │     │     │\n ▼     ▼     ▼     ▼\nActionnaire 1  2  3  4\n(chacun possède une part)"},
        {type:'exemple', texte:"Air Liquide, cotée à la Bourse de Paris, est une vraie entreprise industrielle réelle. Comme pour n'importe quelle société cotée, son capital est divisé en un grand nombre d'actions : chaque action détenue représente une part infime, mais réelle, de l'entreprise et de ses bénéfices futurs."},
        {type:'retenir', texte:"Un actionnaire peut gagner de deux façons différentes : si le cours de l'action monte (plus-value, seulement réalisée à la revente), et si l'entreprise reverse une partie de ses bénéfices sous forme de dividende."},
        {type:'attention', texte:"Aucun de ces deux gains n'est garanti. Le cours peut aussi baisser, et une entreprise peut choisir de ne pas verser de dividende, y compris si elle est bénéficiaire."},
        {type:'approfondir', texte:"Il existe plusieurs catégories d'actions. Les actions ordinaires donnent un droit de vote en assemblée générale (une voix par action, en général) et un droit sur les bénéfices distribués. Certaines entreprises émettent aussi des actions à droit de vote multiple ou sans droit de vote — une nuance rarement expliquée mais qui change qui contrôle réellement l'entreprise."}
      ]},
      {titre:"2. Comment une action s'échange : la Bourse et la capitalisation", blocs:[
        {type:'definition', texte:"La Bourse est un marché où s'échangent les actions déjà émises par les entreprises cotées. Le cours d'une action à un instant donné, c'est simplement le prix auquel un acheteur et un vendeur se sont mis d'accord pour l'échanger à ce moment précis."},
        {type:'texte', texte:"Ce prix bouge en continu selon l'offre et la demande : plus il y a d'acheteurs pressés d'acheter que de vendeurs pressés de vendre, plus le cours monte — et inversement."},
        {type:'calcul', texte:"La capitalisation boursière mesure la valeur totale attribuée par le marché à une entreprise cotée.", schema:
"Capitalisation boursière = Cours de l'action × Nombre total d'actions\n\nExemple :\nCours de l'action  : 50 €\nNombre d'actions   : 400 000 000\n\nCapitalisation = 50 × 400 000 000 = 20 000 000 000 €\n(20 milliards d'euros)"},
        {type:'exerciceErreur', affirmation:"Une entreprise dont l'action vaut 500 € est forcément plus grosse qu'une entreprise dont l'action vaut 10 €.", pourquoi:"Le prix d'une seule action ne dit rien sur la taille de l'entreprise : tout dépend du nombre total d'actions émises. Une entreprise à 500 €/action avec 1 million d'actions capitalise 500 millions d'euros ; une entreprise à 10 €/action avec 200 millions d'actions capitalise 2 milliards d'euros — largement plus grosse malgré un cours par action bien plus bas. Seule la capitalisation (cours × nombre d'actions) permet de comparer la taille de deux entreprises."},
        {type:'approfondir', texte:"La capitalisation boursière n'est pas tout à fait la même chose que la « valeur d'entreprise » (Enterprise Value), qui ajoute la dette nette de l'entreprise à sa capitalisation — un acheteur qui rachèterait 100% de l'entreprise devrait aussi reprendre sa dette. Cette distinction devient importante dès qu'on compare des entreprises avec des niveaux d'endettement très différents."}
      ]},
      {titre:"3. Les ETF : investir dans plusieurs entreprises à la fois", blocs:[
        {type:'definition', texte:"Un ETF (Exchange-Traded Fund, ou fonds indiciel coté) est un fonds qui réplique la performance d'un indice — par exemple le CAC 40 ou le MSCI World — en détenant un panier des actions qui composent cet indice."},
        {type:'texte', texte:"Acheter une seule part d'ETF revient donc à investir en une fois dans toutes les entreprises de l'indice répliqué, dans les proportions de cet indice — sans avoir à choisir et acheter chaque action une par une."},
        {type:'retenir', texte:"Le principal intérêt d'un ETF est la diversification instantanée : la performance d'une seule entreprise en difficulté pèse peu sur le résultat global, puisque le capital est réparti entre de nombreuses entreprises."},
        {type:'attention', texte:"Un ETF ne supprime pas tout le risque : si le marché ou le secteur entier de l'indice répliqué baisse, l'ETF baisse aussi. La diversification réduit le risque propre à une seule entreprise (risque spécifique), pas le risque de l'ensemble du marché (risque systématique)."},
        {type:'casReel', texte:"Un ETF répliquant le CAC 40 détient, en proportions variables, les 40 plus grandes capitalisations boursières françaises cotées à Paris — d'un secteur industriel comme Air Liquide à un secteur du luxe comme LVMH. Un seul achat d'ETF donne donc une exposition partagée entre des secteurs très différents."}
      ]},
      {titre:"4. Les obligations : prêter de l'argent plutôt qu'en devenir propriétaire", blocs:[
        {type:'definition', texte:"Une obligation est un titre de dette : en l'achetant, tu prêtes de l'argent à l'émetteur (une entreprise ou un État) pour une durée déterminée, en échange d'un intérêt régulier (le coupon) et du remboursement du capital prêté à l'échéance."},
        {type:'texte', texte:"C'est une relation fondamentalement différente de celle de l'action : l'actionnaire est propriétaire de l'entreprise, l'obligataire est un créancier — il lui a prêté de l'argent."},
        {type:'visualisation', schema:
"ACTION                          OBLIGATION\n───────                         ──────────\nTu deviens propriétaire         Tu prêtes de l'argent\nGain : dividende + plus-value   Gain : coupon (intérêt) fixé à l'avance\nAucun remboursement garanti     Capital remboursé à l'échéance (si l'émetteur ne fait pas défaut)\nEn cas de faillite : payé en    En cas de faillite : payé avant les\ndernier, après les créanciers   actionnaires, mais pas garanti pour autant"},
        {type:'attention', texte:"Une obligation n'est pas « sans risque ». Deux risques réels existent : le risque de défaut (l'émetteur ne rembourse pas), plus élevé pour une entreprise fragile que pour un État solide, et le risque de taux (la valeur d'une obligation déjà émise baisse si les taux d'intérêt du marché montent, car de nouvelles obligations émises deviennent plus attractives)."}
      ]},
      {titre:"5. Le PER : un premier outil pour interpréter un prix", blocs:[
        {type:'definition', texte:"Le PER (Price-to-Earnings Ratio, ou rapport cours/bénéfice) compare le prix d'une action au bénéfice net généré par action sur les 12 derniers mois."},
        {type:'calcul', texte:"PER = Prix de l'action ÷ Bénéfice par action (BPA).", schema:
"Exemple :\nPrix de l'action     : 100 €\nBénéfice par action  : 5 €\n\nPER = 100 ÷ 5 = 20\n\nAutrement dit : au cours actuel, il faudrait 20 années de bénéfices\nau rythme actuel pour \"rembourser\" le prix payé pour l'action —\nune façon de lire le prix, pas une prédiction."},
        {type:'pourquoi', texte:"Un PER élevé ne signifie jamais automatiquement qu'une action est chère ou mauvaise, et un PER faible ne signifie jamais automatiquement qu'elle est bon marché. L'interprétation dépend notamment de la croissance attendue des bénéfices, du secteur (les secteurs à forte croissance ont structurellement des PER plus élevés que les secteurs matures), de la fiabilité de ces bénéfices dans le temps, et de la situation particulière de l'entreprise à ce moment précis."},
        {type:'exerciceErreur', affirmation:"Cette action est forcément une bonne affaire parce que son PER est faible.", pourquoi:"Un PER faible peut aussi signifier que le marché anticipe une baisse future des bénéfices, des risques spécifiques à l'entreprise ou à son secteur, ou une croissance jugée limitée — pas nécessairement une « bonne affaire ». Le PER est un point de départ pour comparer des entreprises d'un même secteur, jamais une conclusion à lui seul."},
        {type:'texte', texte:"Le PER n'est qu'un premier outil parmi d'autres pour interpréter un prix — la partie Bourse de Likanza permet de voir le PER réel, calculé et daté, de n'importe quelle action suivie, avec les autres indicateurs financiers qui l'entourent."}
      ]}
    ]},
  {id:'lire-une-entreprise', titre:'Apprendre à lire une entreprise', niveau:'Intermédiaire',
    libraryTermes:['Actif','Passif','Capitaux propres','Bilan comptable','Compte de résultat','Chiffre d\'affaires','Marge nette','Résultat net','Amortissement','BFR','Provisions','Goodwill','Consolidation'],
    quizCategories:['Bilan comptable','Chiffre d\'affaires','Marge nette','Amortissement'],
    applyUrl:'business.html', applyLabel:'Explorer le Business Center Likanza',
    acquis:[
      "Distinguer l'actif, le passif et les capitaux propres d'un bilan",
      "Suivre le chemin du chiffre d'affaires jusqu'au résultat net dans un compte de résultat",
      "Expliquer pourquoi un bénéfice comptable et une trésorerie réelle peuvent diverger",
      "Comprendre à quoi servent les provisions, le goodwill et les comptes consolidés"
    ],
    chapitres:[
      {titre:"1. Le bilan : ce que possède l'entreprise, et comment elle le finance", blocs:[
        {type:'texte', texte:"Le bilan répond à une question simple : à un instant précis, qu'est-ce que l'entreprise possède, et qui a payé pour ça ?"},
        {type:'definition', texte:"L'actif regroupe tout ce que l'entreprise possède (trésorerie, stocks, machines, créances clients...). Le passif indique comment c'est financé : par les actionnaires (capitaux propres) ou par des créanciers (dettes)."},
        {type:'visualisation', schema:
"ACTIF                              PASSIF\n(ce que l'entreprise possède)      (comment c'est financé)\n────────────────────────           ─────────────────────────\nTrésorerie                         Capitaux propres\nStocks                             (apports actionnaires\nCréances clients                    + bénéfices accumulés)\nMachines, locaux...\n                                    Dettes\n                                    (banques, fournisseurs...)\n────────────────────────           ─────────────────────────\n     TOTAL ACTIF          =             TOTAL PASSIF"},
        {type:'calcul', texte:"Les capitaux propres se déduisent directement de l'équation du bilan.", schema:
"Actif total = Capitaux propres + Dettes\n\nExemple :\nActif total : 50 M€\nDettes      : 30 M€\n\nCapitaux propres = 50 − 30 = 20 M€\n(l'entreprise est financée à 40% par ses actionnaires, 60% par des créanciers)"},
        {type:'exerciceErreur', affirmation:"Un bilan qui affiche 80 M€ d'actif et 65 M€ de passif montre que l'entreprise a 15 M€ de bénéfice non comptabilisé.", pourquoi:"Par construction comptable, l'actif et le passif d'un bilan sont TOUJOURS égaux — s'ils ne le sont pas, c'est qu'une ligne manque ou qu'il y a une erreur de saisie, jamais un « bénéfice caché ». Ici, il manquerait 15 M€ quelque part au passif (probablement dans les capitaux propres ou une dette non comptabilisée) pour que le bilan s'équilibre."},
        {type:'attention', texte:"Le bilan est une photographie à un instant T, pas un film : il ne dit rien de l'évolution récente de l'entreprise ni de sa rentabilité sur l'année — c'est le rôle du compte de résultat, vu au chapitre suivant."}
      ]},
      {titre:"2. Le compte de résultat : du chiffre d'affaires au résultat net", blocs:[
        {type:'texte', texte:"Si le bilan est une photo, le compte de résultat est un film : il retrace la performance de l'entreprise sur une période (généralement un an), du chiffre d'affaires jusqu'au bénéfice final."},
        {type:'calcul', texte:"Chaque ligne du compte de résultat retire une catégorie de charges à la précédente, jusqu'au résultat net.", schema:
"Chiffre d'affaires                          10 000 000 €\n− Charges d'exploitation (hors amort.)      − 6 500 000 €\n= EBITDA                                    =  3 500 000 €\n− Amortissements et provisions              −   800 000 €\n= Résultat d'exploitation                   =  2 700 000 €\n− Charges financières (intérêts de la dette)−   500 000 €\n= Résultat avant impôt                      =  2 200 000 €\n− Impôt sur les sociétés                    −   600 000 €\n= RÉSULTAT NET                              =  1 600 000 €"},
        {type:'definition', texte:"L'EBITDA mesure la rentabilité de l'activité opérationnelle, avant amortissements, charges financières et impôts. Le résultat net, en bas du tableau, est ce qui reste réellement pour les actionnaires une fois TOUTES les charges déduites."},
        {type:'pourquoi', texte:"Pourquoi ne pas regarder uniquement le résultat net ? Parce qu'il mélange la performance opérationnelle réelle avec des éléments qui n'en dépendent pas directement — le niveau d'endettement (charges financières) ou le taux d'imposition. Deux entreprises tout aussi bien gérées peuvent avoir des résultats nets très différents si l'une est plus endettée que l'autre : l'EBITDA permet de comparer leur performance opérationnelle indépendamment de ce facteur."},
        {type:'casReel', texte:"Deux entreprises avec le même EBITDA de 3,5 M€ peuvent afficher des résultats nets très différents : celle qui n'a aucune dette n'a pas de charges financières à déduire, celle qui est fortement endettée verra son résultat net rogné par les intérêts payés à ses créanciers — la Bibliothèque Likanza détaille cette nuance dans sa fiche EBITDA."}
      ]},
      {titre:"3. Pourquoi le bénéfice peut augmenter alors que la trésorerie baisse", blocs:[
        {type:'texte', texte:"C'est l'un des pièges les plus fréquents en lecture financière : une entreprise peut afficher un résultat net en hausse tout en voyant sa trésorerie (l'argent réellement disponible sur son compte) diminuer au même moment. Comment est-ce possible ?"},
        {type:'definition', texte:"Le résultat net comptabilise des éléments qui ne correspondent à aucun mouvement d'argent réel l'année où ils sont constatés — notamment les amortissements et les provisions. À l'inverse, la trésorerie dépend aussi du BFR (besoin en fonds de roulement) : le décalage entre le moment où l'entreprise paie ses charges et celui où elle encaisse ses ventes."},
        {type:'casReel', texte:"Une entreprise en forte croissance vend davantage (chiffre d'affaires et résultat net en hausse), mais doit financer plus de stocks et attend plus longtemps d'être payée par ses nouveaux clients : son BFR augmente, ce qui absorbe de la trésorerie — même si, sur le papier, elle est plus rentable que jamais."},
        {type:'exerciceErreur', affirmation:"Une entreprise dont le résultat net augmente d'une année sur l'autre est nécessairement en meilleure santé financière immédiate.", pourquoi:"Un résultat net en hausse est un bon signal de rentabilité, mais ne garantit rien sur la trésorerie disponible à court terme : une hausse du BFR (croissance rapide, clients qui payent plus lentement) ou de fortes provisions peuvent faire baisser la trésorerie la même année, même avec un résultat net en progression. Il faut lire résultat net ET variation de trésorerie ensemble, jamais l'un sans l'autre."},
        {type:'attention', texte:"C'est précisément pour cette raison que les analystes financiers regardent toujours le tableau des flux de trésorerie en complément du compte de résultat — un résultat net positif n'empêche pas une entreprise de se retrouver en difficulté de paiement si sa trésorerie s'assèche."}
      ]},
      {titre:"4. Au-delà d'une seule entreprise : goodwill et comptes consolidés", blocs:[
        {type:'texte', texte:"Les grands groupes ne sont presque jamais une seule entité juridique : ils regroupent une société mère et de nombreuses filiales. Deux notions permettent de comprendre comment leurs comptes reflètent cette réalité."},
        {type:'definition', texte:"Le goodwill apparaît au bilan de l'acheteur quand une entreprise en rachète une autre pour un prix supérieur à la valeur de ses actifs nets — il capture ce qui est payé en plus pour la marque, la clientèle ou le savoir-faire de la cible. La consolidation, elle, regroupe les comptes de toutes les filiales d'un groupe en un seul jeu de comptes."},
        {type:'exemple', texte:"Un groupe qui rachète une entreprise valorisée 50 M€ d'actifs nets pour 80 M€ fait apparaître 30 M€ de goodwill à son bilan — puis publie des comptes consolidés qui intègrent les résultats de cette nouvelle filiale avec ceux du reste du groupe."},
        {type:'attention', texte:"Le goodwill n'est pas un bien qu'on peut revendre séparément : s'il s'avère que l'acquisition ne tient pas ses promesses, ce goodwill peut être dévalorisé (déprécié) dans les comptes, ce qui pèse directement sur le résultat net du groupe — parfois plusieurs années après l'acquisition initiale."},
        {type:'approfondir', texte:"Le niveau de détail de la consolidation dépend du contrôle exercé sur chaque filiale : une filiale détenue à 100% est intégrée globalement (100% de son actif, passif et résultat repris) ; une participation minoritaire peut n'être reprise qu'à hauteur de la quote-part détenue (mise en équivalence) — deux méthodes qui donnent une image très différente de la taille réelle du groupe."}
      ]}
    ]},
  {id:'epargne-interets', titre:"Épargne et intérêts composés", niveau:'Débutant', libraryTermes:['Intérêts composés','Assurance-vie'], quizCategories:['Épargne','Intérêts composés','Intérêts simples','Livret A','Assurance-vie']},
  {id:'fiscalite-pea', titre:'Fiscalité et enveloppes fiscales', niveau:'Intermédiaire', libraryTermes:['PEA'], quizCategories:['PEA','Fiscalité de base','Retraite et PER']},
  {id:'risque-diversification', titre:'Risque, volatilité et diversification', niveau:'Intermédiaire', libraryTermes:['Diversification','Volatilité'], quizCategories:['Diversification','Risque et volatilité',"Psychologie de l'investisseur"]},
  {id:'crypto-blockchain', titre:'Crypto et blockchain', niveau:'Avancé', libraryTermes:['Blockchain'], quizCategories:['Blockchain', 'Tokenomics', 'DeFi', 'Sécurité crypto', 'Trading crypto', 'Analyse crypto']},
  {id:'immobilier-locatif', titre:'Immobilier locatif', niveau:'Avancé', libraryTermes:['Rendement locatif'], quizCategories:['Immobilier','SCPI']},
  {id:'budget-securite', titre:'Budget et sécurité financière', niveau:'Débutant', libraryTermes:["Fonds d'urgence",'Inflation'], quizCategories:['Budget','Inflation','Arnaques financières','Crédit',"Constitution d'un patrimoine"]},
  {id:'economie-generale', titre:"Comprendre l'économie", niveau:'Intermédiaire', libraryTermes:['PIB (Produit intérieur brut)',"Taux d'intérêt directeur",'Banque centrale','Récession','Offre et demande'], quizCategories:['PIB','Taux directeur','Banque centrale','Récession','Offre et demande']},
  {id:'entreprise-essentiels', titre:"Comprendre l'entreprise", niveau:'Intermédiaire', libraryTermes:["Chiffre d'affaires",'Marge nette','Bilan comptable','Amortissement','Startup','Levée de fonds'], quizCategories:["Chiffre d'affaires",'Marge nette','Bilan comptable','Amortissement','Startup','Levée de fonds']}
];

// ---------- Actions suivies (bourse / comparateur) ----------
// ticker/nom/secteur/pays/pea sont des faits réels. prix/variation sont des
// valeurs de repli affichées le temps que la cotation live (/api/stock-quotes)
// réponde, remplacées dès qu'elle répond (voir applyLiveStockQuotes, bourse.js).
// Les fondamentaux (PER, dividende, capitalisation, marges, ROE...) ne sont
// PLUS stockés ici : ils viennent en direct de /api/company-profile (Yahoo
// Finance, réels et datés) — voir loadCompanyFundamentals (scripts/data.js).
// Un ancien champ fictif codé en dur ici a longtemps été affiché comme réel
// sans avertissement (Comparateur, Scénarios, Dividendes, fiche action) :
// ne pas réintroduire ce mélange fait/fiction.
const STOCKS_DEMO = [
  {ticker:'AI.PA', nom:'Air Liquide', secteur:'Industrie', pays:'France', pea:true, prix:178.4, variation:0.6},
  {ticker:'TTE.PA', nom:'TotalEnergies', secteur:'Énergie', pays:'France', pea:true, prix:61.2, variation:-1.1},
  {ticker:'SAN.PA', nom:'Sanofi', secteur:'Santé', pays:'France', pea:true, prix:92.7, variation:0.2},
  {ticker:'SAF.PA', nom:'Safran', secteur:'Aéronautique', pays:'France', pea:true, prix:224.5, variation:1.4},
  {ticker:'DG.PA', nom:'Vinci', secteur:'Construction', pays:'France', pea:true, prix:118.9, variation:-0.3},
  {ticker:'OR.PA', nom:"L'Oréal", secteur:'Consommation', pays:'France', pea:true, prix:352.1, variation:0.4},
  {ticker:'ASML.AS', nom:'ASML', secteur:'Technologie', pays:'Pays-Bas', pea:true, prix:812.3, variation:-2.1},
  {ticker:'MC.PA', nom:'LVMH', secteur:'Luxe', pays:'France', pea:true, prix:598.7, variation:-0.8},
];

// ---------- Glossaire / Bibliothèque ----------
const LIBRARY = [
  {
    terme:"Action",
    categorie:"Bourse",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Une action est une petite part d'une entreprise. Si tu en achètes une, tu en deviens un peu propriétaire.",
    detail:"Détenir une action donne un droit sur les bénéfices (via le dividende, s'il y en a un) et sur les décisions de l'entreprise (via le droit de vote en assemblée générale). Sa valeur varie selon l'offre et la demande sur le marché, influencée par les résultats de l'entreprise et le contexte économique.",
    avance:"Le cours d'une action reflète en théorie la valeur actualisée des flux de trésorerie futurs anticipés par le marché, mais il intègre aussi des facteurs psychologiques, sectoriels et macroéconomiques qui peuvent l'éloigner durablement des fondamentaux.",
    exemple:"Acheter une action Air Liquide, c'est devenir propriétaire d'une part infime de cette entreprise et de ses bénéfices futurs.",
    avantages:["Potentiel de gain en capital et de dividendes","Liquidité sur les grandes valeurs"],
    inconvenients:["Valeur non garantie, peut baisser fortement","Nécessite du temps pour bien choisir ses titres"],
    erreurs:["Investir sans diversifier","Vendre en panique lors d'une baisse"]
  },
  {
    terme:"ETF",
    categorie:"Bourse",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Un ETF est un panier qui regroupe plein d'actions en un seul produit, acheté en une fois.",
    detail:"Un ETF (Exchange Traded Fund, ou tracker) réplique la performance d'un indice comme le CAC 40 ou le S&P 500. Il permet une diversification immédiate à moindre coût, avec des frais de gestion généralement bien plus faibles qu'un fonds géré activement.",
    avance:"La réplication peut être physique (détention réelle des titres) ou synthétique (via des instruments dérivés), ce qui modifie le profil de risque de contrepartie. Le tracking error mesure l'écart entre la performance de l'ETF et celle de son indice de référence.",
    exemple:"Un ETF \"World\" permet d'investir en une seule opération dans des milliers d'entreprises cotées à travers le monde.",
    avantages:["Diversification immédiate","Frais de gestion réduits"],
    inconvenients:["Pas de sélection individuelle des titres","Suit aussi les baisses du marché"],
    erreurs:["Confondre un ETF sectoriel avec un ETF diversifié"]
  },
  {
    terme:"PEA",
    categorie:"Fiscalité",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le PEA est un compte qui permet d'investir en actions européennes avec moins d'impôts après 5 ans.",
    detail:"Le Plan d'Épargne en Actions est une enveloppe fiscale française plafonnée à 150 000 € de versements. Après 5 ans de détention, les gains sont exonérés d'impôt sur le revenu (seuls les prélèvements sociaux restent dus).",
    avance:"Un retrait avant 5 ans entraîne en principe la clôture du plan (sauf exceptions), ce qui en fait un outil pensé pour l'investissement de long terme plutôt que pour la spéculation à court terme.",
    exemple:"Investir 5 000 € par an sur un PEA en ETF actions européennes pendant 10 ans, dans une optique de long terme.",
    avantages:["Fiscalité avantageuse après 5 ans","Large choix d'actions et ETF européens"],
    inconvenients:["Limité aux actions européennes","Retrait avant 5 ans pénalisant"],
    erreurs:["Retirer les fonds trop tôt sans anticiper la fiscalité"]
  },
  {
    terme:"Intérêts composés",
    categorie:"Épargne",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Les intérêts composés, c'est gagner des intérêts sur les intérêts déjà accumulés.",
    detail:"Chaque année, les gains produits par un placement s'ajoutent au capital et génèrent eux-mêmes des gains l'année suivante. Plus la durée est longue, plus cet effet cumulatif devient important.",
    avance:"Mathématiquement, la valeur future suit une croissance exponentielle plutôt que linéaire : de petites différences de rendement ou de durée produisent des écarts considérables sur plusieurs décennies.",
    exemple:"100 € placés à 6% par an valent environ 179 € après 10 ans, mais plus de 320 € après 20 ans : le gain ne double pas, il plus que triple.",
    avantages:["Effet puissant sur le très long terme"],
    inconvenients:["Nécessite de la patience, peu visible à court terme"],
    erreurs:["Sous-estimer l'intérêt de commencer tôt, même avec de petites sommes"]
  },
  {
    terme:"Diversification",
    categorie:"Investissement",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Diversifier, c'est ne pas mettre tous ses œufs dans le même panier.",
    detail:"Répartir son épargne entre plusieurs actifs, secteurs et zones géographiques réduit l'impact d'une mauvaise performance isolée sur l'ensemble du portefeuille.",
    avance:"L'efficacité de la diversification dépend de la corrélation entre les actifs choisis : combiner des actifs faiblement corrélés réduit davantage la volatilité globale que d'ajouter des actifs similaires.",
    exemple:"Détenir des actions américaines, européennes et asiatiques plutôt que uniquement des valeurs françaises.",
    avantages:["Réduit le risque spécifique à un actif ou secteur"],
    inconvenients:["Ne supprime pas le risque de marché global","Peut diluer la performance des meilleurs choix"],
    erreurs:["Croire que posséder 3 ETF différents mais très corrélés suffit à diversifier"]
  },
  {
    terme:"Capitalisation boursière",
    categorie:"Bourse",
    niveau:"Intermédiaire",
    lecture:"1 min",
    simple:"La capitalisation, c'est la valeur totale d'une entreprise en bourse.",
    detail:"Elle se calcule en multipliant le cours de l'action par le nombre total d'actions en circulation. Elle permet de classer les entreprises en grandes, moyennes ou petites capitalisations (large cap, mid cap, small cap).",
    avance:"La capitalisation ne reflète pas la valeur d'entreprise totale (Enterprise Value), qui intègre aussi la dette nette, un indicateur souvent plus pertinent pour comparer des sociétés à structures financières différentes.",
    exemple:"Une entreprise avec 100 millions d'actions à 50 € chacune a une capitalisation de 5 milliards d'euros.",
    avantages:[],
    inconvenients:["Ne reflète pas la dette de l'entreprise"],
    erreurs:["Confondre capitalisation boursière et valeur d'entreprise"]
  },
  {
    terme:"PER (Price Earning Ratio)",
    categorie:"Analyse fondamentale",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le PER compare le prix d'une action à ce que l'entreprise gagne réellement.",
    detail:"Il se calcule en divisant le cours de l'action par le bénéfice par action. Un PER élevé peut indiquer une forte croissance anticipée, ou une valorisation tendue ; un PER faible peut signaler une opportunité, ou des difficultés sous-jacentes.",
    avance:"Le PER doit être comparé à celui d'entreprises comparables du même secteur, et complété par le PEG (PER rapporté à la croissance) pour éviter de pénaliser à tort les entreprises à forte croissance.",
    exemple:"Une action à 40 € avec un bénéfice par action de 2 € a un PER de 20.",
    avantages:[],
    inconvenients:["Peu pertinent seul, sans comparaison sectorielle"],
    erreurs:["Comparer le PER d'entreprises de secteurs très différents"]
  },
  {
    terme:"Dividende",
    categorie:"Bourse",
    niveau:"Débutant",
    lecture:"1 min",
    simple:"Un dividende, c'est une part des bénéfices qu'une entreprise reverse directement à ses actionnaires.",
    detail:"Le montant et la fréquence sont décidés par l'entreprise (souvent proposés par la direction et votés en assemblée générale), et peuvent varier d'une année sur l'autre — rien ne garantit qu'un dividende versé une année le sera de nouveau la suivante.",
    avance:"Toutes les entreprises ne versent pas de dividende : certaines préfèrent réinvestir l'intégralité de leurs bénéfices dans leur croissance plutôt que de les redistribuer.",
    exemple:"Une entreprise qui verse 2 € de dividende par action à chaque actionnaire, en une ou plusieurs fois dans l'année.",
    avantages:["Revenu régulier potentiel sans avoir à vendre ses actions"],
    inconvenients:["Jamais garanti : peut être réduit, gelé ou supprimé d'une année sur l'autre"],
    erreurs:["Croire qu'un dividende déjà versé sera automatiquement reconduit à l'identique"]
  },
  {
    terme:"Rendement du dividende",
    categorie:"Bourse",
    niveau:"Intermédiaire",
    lecture:"1 min",
    simple:"Le rendement du dividende compare le dividende annuel versé au cours actuel de l'action.",
    detail:"Il se calcule en divisant le dividende annuel par le cours de l'action, exprimé en pourcentage. Il évolue chaque jour avec le cours, même quand le dividende versé ne change pas.",
    avance:"Un rendement élevé peut refléter un dividende généreux, mais aussi un cours qui a fortement baissé — le rendement (dividende ÷ cours) augmente mécaniquement quand le cours chute, sans que l'entreprise verse davantage.",
    exemple:"Une action à 50 € qui verse 2 € de dividende annuel affiche un rendement de 4%.",
    avantages:[],
    inconvenients:["Peut donner une fausse impression d'opportunité quand il est élevé à cause d'une baisse du cours, pas d'un dividende plus généreux"],
    erreurs:["Choisir une action uniquement parce que son rendement affiché est élevé, sans vérifier pourquoi"]
  },
  {
    terme:"Payout ratio",
    categorie:"Analyse fondamentale",
    niveau:"Intermédiaire",
    lecture:"1 min",
    simple:"Le payout ratio indique quelle part des bénéfices d'une entreprise part en dividendes plutôt que d'être réinvestie.",
    detail:"Il se calcule en divisant le dividende total versé par le bénéfice net de l'entreprise. Un ratio proche de 100% (ou au-delà) laisse peu ou pas de marge si les bénéfices reculent.",
    avance:"Un payout ratio élevé n'est pas automatiquement un signal négatif — certains secteurs matures (foncières, utilities) distribuent structurellement une grande part de leurs bénéfices — mais il réduit la marge de sécurité en cas de baisse d'activité.",
    exemple:"Une entreprise qui gagne 100 millions € de bénéfice net et verse 60 millions € de dividendes a un payout ratio de 60%.",
    avantages:[],
    inconvenients:["Un ratio supérieur à 100% signifie que l'entreprise verse plus qu'elle ne gagne, en puisant dans sa trésorerie ou en s'endettant"],
    erreurs:["Ignorer le payout ratio et ne regarder que le rendement affiché"]
  },
  {
    terme:"Date de détachement",
    categorie:"Bourse",
    niveau:"Intermédiaire",
    lecture:"1 min",
    simple:"La date de détachement (ex-dividende) est le jour à partir duquel une action fraîchement achetée ne donne plus droit au prochain dividende.",
    detail:"Pour toucher un dividende, il faut posséder l'action la veille de cette date. À partir de la date de détachement, le cours de l'action baisse en théorie du montant du dividende détaché, puisque cette valeur sort de l'entreprise.",
    avance:"Acheter une action juste après sa date de détachement dans le seul but d'« éviter » une baisse de cours n'a pas de sens économique : le dividende manqué et la baisse mécanique du cours s'équilibrent en théorie.",
    exemple:"Si la date de détachement est le 15 mai, il faut détenir l'action au 14 mai au soir pour toucher le dividende.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre date de détachement et date de paiement"]
  },
  {
    terme:"Date de paiement",
    categorie:"Bourse",
    niveau:"Débutant",
    lecture:"1 min",
    simple:"La date de paiement est le jour où le dividende est réellement versé sur le compte de l'actionnaire.",
    detail:"Elle intervient généralement plusieurs jours ou semaines après la date de détachement — le temps que l'opération soit traitée pour tous les actionnaires éligibles.",
    avance:"Le délai entre date de détachement et date de paiement varie selon les entreprises et les marchés — toujours vérifier ces deux dates séparément plutôt que de supposer un versement immédiat.",
    exemple:"Une action détachée le 15 mai peut ne payer son dividende que le 30 mai.",
    avantages:[],
    inconvenients:[],
    erreurs:["Croire que le dividende est versé le jour même de la date de détachement"]
  },
  {
    terme:"Yield on Cost",
    categorie:"Analyse fondamentale",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le Yield on Cost rapporte le dividende actuel au prix auquel tu as toi-même acheté l'action, pas au cours d'aujourd'hui.",
    detail:"Il se calcule en divisant le dividende annuel actuel par ton prix d'achat historique. Plus cet achat est ancien et plus le dividende a progressé depuis, plus le Yield on Cost peut dépasser largement le rendement affiché aujourd'hui pour un nouvel acheteur.",
    avance:"Le Yield on Cost n'a de sens que pour évaluer ta propre position existante — il ne doit jamais être comparé au rendement affiché d'une autre action pour décider d'un nouvel achat, puisque les deux ne mesurent pas la même chose.",
    exemple:"Une action achetée 20 € qui verse aujourd'hui 2 € de dividende annuel offre un Yield on Cost de 10%, même si son rendement affiché au cours actuel (60 € par exemple) n'est que de 3,3%.",
    avantages:["Aide à visualiser l'effet cumulé d'un dividende qui progresse dans le temps"],
    inconvenients:["Ne reflète en rien le rendement qu'obtiendrait un nouvel acheteur aujourd'hui"],
    erreurs:["Présenter son Yield on Cost personnel comme le rendement réel actuel de l'action"]
  },
  {
    terme:"Dividende exceptionnel",
    categorie:"Bourse",
    niveau:"Intermédiaire",
    lecture:"1 min",
    simple:"Un dividende exceptionnel est un versement ponctuel, en plus du dividende habituel, qui ne se répète pas nécessairement.",
    detail:"Il intervient souvent après un événement particulier : cession d'un actif, bénéfice exceptionnel, trésorerie jugée excédentaire par l'entreprise. Contrairement au dividende ordinaire, il ne doit jamais être extrapolé comme un revenu récurrent.",
    avance:"Un dividende exceptionnel gonfle artificiellement le rendement affiché sur l'année où il est versé — comparer le rendement d'une entreprise sur plusieurs années suppose de distinguer ordinaire et exceptionnel plutôt que de les additionner sans le préciser.",
    exemple:"Une entreprise qui vend une filiale et reverse une partie du produit de la vente à ses actionnaires sous forme de dividende exceptionnel, une seule fois.",
    avantages:[],
    inconvenients:["Ponctuel par nature : jamais une garantie de revenu futur"],
    erreurs:["Intégrer un dividende exceptionnel dans le calcul du rendement « normal » d'une action pour les années suivantes"]
  },
  {
    terme:"Total return",
    categorie:"Analyse fondamentale",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le total return mesure le gain réel d'un investissement en additionnant l'évolution du cours ET les dividendes reçus.",
    detail:"Se limiter à l'évolution du cours d'une action sous-estime souvent la performance réelle des entreprises qui versent des dividendes réguliers, surtout sur longue période et avec réinvestissement.",
    avance:"Deux actions peuvent afficher la même évolution de cours sur 10 ans et pourtant offrir un total return très différent selon qu'elles versent ou non des dividendes réinvestis sur la période.",
    exemple:"Une action dont le cours n'a pas bougé sur 10 ans mais qui a versé 3% de dividende chaque année affiche un total return net positif sur la période, pas de 0%.",
    avantages:["Mesure plus complète et plus honnête de la performance réelle qu'une simple évolution de cours"],
    inconvenients:[],
    erreurs:["Comparer deux actions uniquement sur l'évolution de leur cours, en ignorant les dividendes versés"]
  },
  {
    terme:"Obligation",
    categorie:"Bourse",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Une obligation, c'est un prêt que tu fais à une entreprise ou un État, remboursé avec des intérêts.",
    detail:"L'émetteur s'engage à verser un intérêt (le coupon) régulièrement et à rembourser le capital à l'échéance. Le prix d'une obligation varie surtout en fonction des taux d'intérêt du marché.",
    avance:"Quand les taux montent, le prix des obligations existantes baisse mécaniquement (et inversement), car leur coupon fixe devient moins attractif comparé aux nouvelles émissions.",
    exemple:"Une obligation d'État à 10 ans qui verse un coupon annuel fixe pendant toute sa durée.",
    avantages:["Revenu généralement plus prévisible que les actions"],
    inconvenients:["Sensible aux variations de taux d'intérêt","Risque de défaut de l'émetteur"],
    erreurs:["Croire qu'une obligation ne peut jamais perdre de valeur avant l'échéance"]
  },
  {
    terme:"Taux directeur",
    categorie:"Taux",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le taux directeur, c'est le taux fixé par une banque centrale (comme la BCE) qui influence tous les autres taux de l'économie.",
    detail:"Quand une banque centrale relève son taux directeur, emprunter coûte plus cher partout dans l'économie (crédits, obligations) : elle cherche généralement à freiner l'inflation. Quand elle le baisse, elle cherche plutôt à soutenir l'activité économique.",
    avance:"La courbe des taux représente le rendement d'une même catégorie d'obligations (souvent d'État) selon leur échéance. Une courbe \"inversée\" (taux courts plus élevés que les taux longs) est historiquement associée par certains analystes à un risque de ralentissement économique — une observation statistique, jamais une certitude.",
    exemple:"La BCE relève son taux de dépôt : les nouveaux crédits immobiliers deviennent plus chers en zone euro.",
    avantages:["Un outil de pilotage macroéconomique suivi de près par les marchés"],
    inconvenients:["Effet différé et indirect sur l'économie réelle, pas immédiat"],
    erreurs:["Penser qu'une hausse de taux affecte instantanément tous les prix"]
  },
  {
    terme:"Pip",
    categorie:"Forex",
    niveau:"Débutant",
    lecture:"1 min",
    simple:"Un pip est la plus petite variation de prix habituellement mesurée sur une paire de devises.",
    detail:"Pour la plupart des paires (ex. EUR/USD), un pip correspond à 0,0001 sur le taux de change. Si l'EUR/USD passe de 1,1678 à 1,1688, c'est une variation de 10 pips.",
    avance:"Certaines paires impliquant le yen japonais (ex. USD/JPY) comptent les pips à la deuxième décimale (0,01) et non la quatrième, en raison de l'ordre de grandeur différent du taux de change.",
    exemple:"L'EUR/USD passe de 1,1678 à 1,1668 : une baisse de 10 pips.",
    avantages:["Unité standard qui permet de comparer des variations entre paires différentes"],
    inconvenients:["Peut donner une fausse impression de faible ampleur : avec du levier, quelques pips suffisent à générer une perte significative"],
    erreurs:["Confondre un pip et un point de pourcentage"]
  },
  {
    terme:"Spread (Forex)",
    categorie:"Forex",
    niveau:"Débutant",
    lecture:"1 min",
    simple:"Le spread, c'est l'écart entre le prix d'achat et le prix de vente affichés pour une paire de devises au même instant.",
    detail:"C'est une forme de coût de transaction implicite : plus le spread est large, plus il faut que le cours évolue en ta faveur avant d'être en gain. Les paires les plus échangées (EUR/USD) ont généralement les spreads les plus faibles.",
    avance:"Le spread s'élargit souvent lors d'annonces économiques majeures ou en dehors des heures de forte liquidité, car les intermédiaires exigent une compensation plus élevée pour le risque accru.",
    exemple:"Un spread de 1 pip sur l'EUR/USD signifie que le prix d'achat et le prix de vente diffèrent d'environ 0,0001.",
    avantages:["Un spread faible reflète en général un marché très liquide"],
    inconvenients:["Coût réel à chaque opération, même sans commission explicite"],
    erreurs:["Ignorer le spread dans le calcul du seuil de rentabilité d'une position"]
  },
  {
    terme:"Volatilité",
    categorie:"Gestion du risque",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"La volatilité mesure à quel point le prix d'un actif bouge, dans un sens ou dans l'autre.",
    detail:"Statistiquement, elle correspond à l'écart-type des rendements d'un actif sur une période donnée. Une volatilité élevée signifie des variations plus amples, à la hausse comme à la baisse.",
    avance:"La volatilité implicite (déduite des prix d'options) reflète les anticipations du marché sur l'ampleur des mouvements futurs, tandis que la volatilité historique se base sur les données passées ; les deux peuvent diverger fortement.",
    exemple:"Le Bitcoin affiche historiquement une volatilité bien plus élevée que le CAC 40.",
    avantages:[],
    inconvenients:["Une volatilité élevée augmente le risque de perte à court terme"],
    erreurs:["Confondre volatilité et risque de perte définitive"]
  },
  {
    terme:"Drawdown",
    categorie:"Gestion du risque",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le drawdown est la baisse subie entre le plus haut niveau atteint par un investissement et le point le plus bas qui a suivi, avant une éventuelle remontée.",
    detail:"Le drawdown maximal (souvent noté \"max drawdown\") est la plus forte de ces baisses observée sur toute la période étudiée — il donne une idée concrète de la pire chute qu'un investisseur aurait réellement vécue en détenant cet actif, contrairement à une simple moyenne de rendement qui lisse les à-coups.",
    avance:"Deux placements peuvent avoir le même rendement moyen sur 10 ans avec des drawdowns très différents — celui au drawdown le plus faible aura généralement été plus facile à conserver psychologiquement pendant la traversée d'une baisse.",
    exemple:"Un investissement qui passe de 100 à 60 avant de remonter à 120 a connu un drawdown de 40%, même si sa valeur finale est supérieure à son point de départ.",
    avantages:[],
    inconvenients:[],
    erreurs:["Ne regarder que le rendement final d'un placement sans jamais vérifier l'ampleur de ses baisses intermédiaires"]
  },
  {
    terme:"Horizon de placement",
    categorie:"Gestion du risque",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"L'horizon de placement est la durée pendant laquelle une personne prévoit de laisser son argent investi avant d'en avoir besoin.",
    detail:"Un horizon court (moins de 2 ans) laisse peu de temps pour se remettre d'une baisse de marché ; un horizon long (plus de 5 ans) permet historiquement d'absorber davantage de fluctuations. L'horizon de placement influence directement le niveau de risque qu'il est raisonnable d'accepter.",
    avance:"L'horizon réel n'est pas toujours celui qu'on croit : un besoin imprévu (perte d'emploi, urgence) peut raccourcir brutalement un horizon initialement prévu comme long.",
    exemple:"Un capital destiné à un achat immobilier dans 18 mois a un horizon court, même si la personne qui investit se sent par ailleurs à l'aise avec le risque.",
    avantages:[],
    inconvenients:[],
    erreurs:["Investir une somme dont on sait qu'on aura besoin à court terme sur un support dont la valeur peut fortement fluctuer entre-temps"]
  },
  {
    terme:"Tolérance au risque",
    categorie:"Gestion du risque",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"La tolérance au risque désigne la capacité, à la fois financière et psychologique, d'une personne à supporter des fluctuations ou des pertes potentielles sur ses investissements.",
    detail:"Elle combine deux dimensions distinctes : la capacité réelle à supporter une perte (horizon, situation financière, besoin de liquidités) et la capacité émotionnelle à ne pas paniquer face à une baisse. Les deux peuvent diverger : quelqu'un peut avoir les moyens financiers d'attendre une remontée, sans pour autant le supporter psychologiquement.",
    avance:"La tolérance au risque déclarée avant une baisse de marché et le comportement réel pendant cette baisse peuvent différer fortement — c'est pourquoi elle reste toujours une estimation, jamais une certitude, tant qu'elle n'a pas été testée en conditions réelles.",
    exemple:"Deux personnes avec la même situation financière peuvent avoir des tolérances au risque très différentes selon leur expérience passée des marchés.",
    avantages:[],
    inconvenients:[],
    erreurs:["Présenter un profil de risque estimé (via un questionnaire) comme un diagnostic psychologique fiable et définitif"]
  },
  {
    terme:"Profil investisseur",
    categorie:"Gestion du risque",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le profil investisseur résume la situation d'une personne face à l'investissement : son capital disponible, son horizon de placement, son objectif et sa tolérance au risque.",
    detail:"Il sert de repère pour orienter des choix d'investissement cohérents avec la situation réelle de la personne, plutôt que de choisir des placements au hasard ou en copiant ce que fait quelqu'un d'autre dans une situation différente.",
    avance:"Un profil investisseur n'est pas figé : il évolue avec l'âge, la situation financière, l'expérience et les objectifs — le refaire périodiquement a du sens, surtout après un changement de situation important.",
    exemple:"Une même personne peut avoir un profil plus prudent pour l'épargne destinée à un projet dans 2 ans, et un profil plus dynamique pour une épargne retraite à 30 ans.",
    avantages:["Aide à choisir des placements cohérents avec sa propre situation plutôt qu'avec celle de quelqu'un d'autre"],
    inconvenients:[],
    erreurs:["Appliquer le même profil investisseur à tous ses objectifs financiers, alors que l'horizon et le besoin diffèrent selon chaque objectif"]
  },
  {
    terme:"Aversion aux pertes",
    categorie:"Psychologie de l'investisseur",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"L'aversion aux pertes désigne la tendance, largement documentée, à ressentir la douleur d'une perte plus intensément que le plaisir d'un gain équivalent — perdre 100 € fait généralement plus mal que gagner 100 € ne fait plaisir.",
    detail:"Ce biais pousse souvent à des décisions asymétriques : vendre trop tôt une position gagnante par peur de perdre le gain acquis, et garder trop longtemps une position perdante en espérant « au moins revenir à zéro » avant de vendre.",
    avance:"L'aversion aux pertes a été mise en évidence par les travaux de Kahneman et Tversky (théorie des perspectives) : dans leurs expériences, la douleur d'une perte est ressentie en moyenne environ deux fois plus intensément que le plaisir d'un gain de même montant.",
    exemple:"Un investisseur qui refuse de vendre une action en perte de 30% « pour ne pas acter la perte », alors qu'il vendrait sans hésiter une action en gain de 30% pour sécuriser le gain, illustre ce biais.",
    avantages:[],
    inconvenients:["Peut pousser à garder des positions perdantes trop longtemps, ou à vendre des positions gagnantes trop tôt"],
    erreurs:["Prendre une décision de vente ou de conservation uniquement en fonction du prix d'achat initial, plutôt que des perspectives réelles de l'actif"]
  },
  {
    terme:"FOMO (peur de rater quelque chose)",
    categorie:"Psychologie de l'investisseur",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le FOMO (Fear Of Missing Out) est la peur de manquer une opportunité que d'autres semblent saisir avec succès — elle pousse à investir dans la précipitation, souvent après une forte hausse déjà survenue.",
    detail:"Ce biais est particulièrement fort quand un actif fait la une des médias ou des réseaux sociaux avec des témoignages de gains rapides : la peur de « rater le train » prend le pas sur une analyse posée du prix déjà atteint et des risques réels.",
    avance:"Le FOMO amplifie souvent les bulles spéculatives : plus un actif monte, plus il attire de nouveaux acheteurs mus par la peur de manquer la hausse plutôt que par une analyse de valorisation — ce qui peut accélérer la hausse à court terme, mais aussi la chute qui suit.",
    exemple:"Acheter une cryptomonnaie après qu'elle a été multipliée par 5 en une semaine, uniquement parce que des proches semblent avoir gagné beaucoup d'argent, est un exemple typique de décision motivée par le FOMO plutôt que par une analyse.",
    avantages:[],
    inconvenients:["Pousse souvent à acheter après une forte hausse déjà survenue, au moment où le risque de retournement est le plus élevé"],
    erreurs:["Confondre l'enthousiasme collectif autour d'un actif et une analyse réelle de sa valeur"]
  },
  {
    terme:"Effet de troupeau",
    categorie:"Psychologie de l'investisseur",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"L'effet de troupeau désigne la tendance à suivre les décisions de la majorité plutôt que sa propre analyse, en particulier dans les moments d'incertitude ou d'euphorie collective.",
    detail:"Suivre le comportement du plus grand nombre peut sembler rassurant (« tout le monde ne peut pas se tromper en même temps »), mais les mouvements de marché les plus extrêmes (bulles et krachs) sont précisément amplifiés par ce comportement collectif, pas par des analyses individuelles indépendantes.",
    avance:"L'effet de troupeau peut être rationnel à court terme pour un professionnel (suivre le marché plutôt que prendre un risque de sous-performance isolée), mais reste risqué pour un particulier qui achète ou vend uniquement parce que « tout le monde le fait », sans thèse d'investissement propre.",
    exemple:"Vendre en catastrophe pendant un krach uniquement parce que tous les médias et proches parlent de vente généralisée, sans réévaluer sa propre situation et son horizon, est un exemple d'effet de troupeau.",
    avantages:[],
    inconvenients:["Peut amplifier les mouvements de marché extrêmes (bulles et krachs) au détriment de ceux qui suivent le mouvement tardivement"],
    erreurs:["Considérer qu'une décision est forcément la bonne uniquement parce qu'une majorité de personnes semble faire la même chose"]
  },
  {
    terme:"Biais de confirmation",
    categorie:"Psychologie de l'investisseur",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le biais de confirmation est la tendance à rechercher, privilégier et retenir en priorité les informations qui confirment une opinion déjà formée, tout en minimisant ou ignorant celles qui la contredisent.",
    detail:"Un investisseur convaincu qu'une entreprise va bien performer aura tendance à lire davantage les articles optimistes à son sujet, et à écarter ou minimiser les signaux d'alerte réels — renforçant sa conviction initiale sans réel examen équilibré.",
    avance:"Ce biais est particulièrement dangereux après un investissement déjà réalisé : remettre en question sa propre thèse d'investissement demande un effort actif contre une tendance naturelle à chercher plutôt des raisons de se rassurer.",
    exemple:"Un investisseur qui ignore un rapport financier négatif sur une entreprise qu'il détient déjà, en le qualifiant de « alarmiste », tout en partageant activement chaque article optimiste sur cette même entreprise, illustre ce biais.",
    avantages:[],
    inconvenients:["Empêche une réévaluation objective d'une position déjà prise, même face à des signaux d'alerte réels"],
    erreurs:["Chercher activement des informations qui confortent une décision déjà prise plutôt que d'évaluer objectivement l'ensemble des informations disponibles"]
  },
  {
    terme:"Excès de confiance",
    categorie:"Psychologie de l'investisseur",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"L'excès de confiance est la tendance à surestimer sa propre capacité à prévoir l'évolution des marchés ou à sélectionner de bons investissements, souvent après une série de succès récents.",
    detail:"Une série de gains, même en partie due au hasard ou à un contexte de marché globalement favorable, peut être interprétée à tort comme la preuve d'une compétence supérieure — poussant à prendre des risques croissants sans analyse supplémentaire correspondante.",
    avance:"Les études sur le comportement des investisseurs particuliers montrent que l'excès de confiance est associé à une fréquence de transaction plus élevée, ce qui tend en moyenne à réduire la performance nette (frais de transaction cumulés, décisions plus impulsives), sans garantie de meilleurs résultats bruts.",
    exemple:"Un investisseur dont les 3 derniers investissements ont été gagnants et qui décide, sans analyse supplémentaire, de mettre une part bien plus importante de son épargne sur sa prochaine idée, illustre l'excès de confiance.",
    avantages:[],
    inconvenients:["Pousse à prendre des risques croissants sans justification analytique supplémentaire", "Associé à une fréquence de transaction plus élevée, qui tend à réduire la performance nette"],
    erreurs:["Confondre une série de gains récents (qui peut être en partie due au hasard ou au contexte de marché) avec une compétence de sélection supérieure et durable"]
  },
  {
    terme:"Ancrage",
    categorie:"Psychologie de l'investisseur",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"L'ancrage est la tendance à se fixer mentalement sur une valeur de référence (souvent le prix d'achat initial) et à juger toute évolution ultérieure par rapport à ce point fixe, même quand il n'a plus de pertinence réelle.",
    detail:"Un investisseur ancré sur son prix d'achat peut refuser de vendre une action tant qu'elle n'est pas « revenue à son prix d'achat », même si les fondamentaux de l'entreprise se sont réellement dégradés depuis — le prix d'achat n'a pourtant aucune influence sur les perspectives futures réelles de l'entreprise.",
    avance:"L'ancrage peut aussi jouer sur un plus haut historique atteint par un actif (« il faut attendre qu'il revienne à son sommet ») ou sur un chiffre rond psychologique, tout aussi arbitraires du point de vue de l'analyse financière réelle.",
    exemple:"Refuser de vendre une action achetée à 100€ et tombée à 60€ « tant qu'elle n'est pas revenue à 100€ », alors que les perspectives de l'entreprise se sont réellement détériorées entre-temps, illustre l'ancrage.",
    avantages:[],
    inconvenients:["Fait dépendre une décision d'aujourd'hui d'un prix passé qui n'a plus de pertinence sur les perspectives futures réelles"],
    erreurs:["Baser une décision de vente ou de conservation sur le prix d'achat initial plutôt que sur une réévaluation actuelle des perspectives de l'actif"]
  },
  {
    terme:"Effet de disposition",
    categorie:"Psychologie de l'investisseur",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"L'effet de disposition est la tendance à vendre trop vite les positions gagnantes (pour sécuriser le gain) et à garder trop longtemps les positions perdantes (en espérant qu'elles reviennent à l'équilibre), un mélange de plusieurs biais dont l'aversion aux pertes et l'ancrage.",
    detail:"Face au besoin de vendre une partie de son portefeuille, ce biais pousse souvent à choisir de vendre la position en gain plutôt que la position en perte — alors qu'une analyse purement financière des perspectives futures pourrait recommander l'inverse.",
    avance:"Ce comportement a un coût fiscal potentiel dans de nombreux pays : réaliser systématiquement les gains (imposables) tout en conservant les pertes (qui pourraient parfois être utilisées pour compenser d'autres gains imposables) peut être défavorable comparé à une gestion fiscale plus délibérée.",
    exemple:"Devant vendre une position pour dégager des liquidités, un investisseur qui choisit systématiquement de vendre celle en gain de 30% plutôt que celle en perte de 30%, sans réévaluer les perspectives futures des deux entreprises, illustre l'effet de disposition.",
    avantages:[],
    inconvenients:["Peut conduire à une allocation de portefeuille de moins en moins réfléchie, dictée par la performance passée plutôt que par les perspectives futures"],
    erreurs:["Choisir quelle position vendre uniquement en fonction de son gain ou sa perte latente, plutôt que de ses perspectives futures réelles"]
  },
  {
    terme:"Biais rétrospectif",
    categorie:"Psychologie de l'investisseur",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le biais rétrospectif est la tendance, une fois un événement survenu, à croire qu'on l'avait prévu ou qu'il était « évident » à l'avance — alors qu'il ne l'était pas réellement au moment des faits.",
    detail:"Après une crise boursière, il est fréquent d'entendre (ou de se dire) « c'était évident, j'aurais dû vendre avant » — alors qu'au moment des faits, l'information disponible ne permettait pas de le savoir avec certitude, et que la grande majorité des investisseurs, y compris professionnels, n'avaient pas anticipé l'événement avec cette clarté.",
    avance:"Ce biais est problématique car il donne une fausse impression de prévisibilité des marchés a posteriori, ce qui peut pousser à un excès de confiance dans sa propre capacité à anticiper la prochaine crise — alors que la reconstruction rétrospective d'un récit cohérent après coup n'a que peu à voir avec une vraie capacité de prévision.",
    exemple:"Se dire après une crise qu'on avait « senti que ça allait mal tourner », alors qu'aucune décision concrète (vente, couverture) n'a été prise avant l'événement, illustre ce biais.",
    avantages:[],
    inconvenients:["Peut donner une fausse confiance dans sa capacité à prévoir de futures crises, en se basant sur une reconstruction rétrospective plutôt qu'une vraie anticipation passée"],
    erreurs:["Juger la qualité d'une décision passée uniquement à la lumière de ce qu'on sait aujourd'hui, plutôt qu'avec l'information réellement disponible au moment de la décision"]
  },
  {
    terme:"Préférence pour le présent",
    categorie:"Psychologie de l'investisseur",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La préférence pour le présent (ou biais du présent) désigne la tendance à surpondérer une gratification immédiate par rapport à un bénéfice futur pourtant plus important, même quand les deux options sont parfaitement connues à l'avance.",
    detail:"Ce biais explique en partie pourquoi épargner ou investir pour la retraite reste difficile pour beaucoup : le bénéfice (un capital plus important dans 20-30 ans) est abstrait et lointain, alors que la dépense immédiate (consommation aujourd'hui) est concrète et immédiate.",
    avance:"Les mécanismes de versement automatique et programmé (prélèvement automatique vers l'épargne dès réception du salaire) sont souvent recommandés précisément parce qu'ils contournent ce biais : la décision n'est prise qu'une fois, plutôt que d'être renégociée chaque mois face à la tentation d'une dépense immédiate.",
    exemple:"Repousser année après année la mise en place d'une épargne retraite, alors que chaque année de retard représente des décennies d'intérêts composés potentiels en moins, illustre ce biais.",
    avantages:[],
    inconvenients:["Peut conduire à repousser indéfiniment des décisions financières dont le bénéfice réel est pourtant supérieur au coût immédiat perçu"],
    erreurs:["Ne pas reconnaître consciemment ce biais et se fier uniquement à sa « volonté » future plutôt qu'à des mécanismes automatiques (versements programmés) pour le contourner"]
  },
  {
    terme:"Blockchain",
    categorie:"Crypto",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Une blockchain est un registre numérique partagé, difficile à falsifier, qui enregistre des transactions.",
    detail:"Les transactions sont regroupées en blocs, liés entre eux de façon cryptographique et validés par un réseau d'ordinateurs plutôt que par une autorité centrale unique.",
    avance:"Les mécanismes de consensus (preuve de travail, preuve d'enjeu...) déterminent comment le réseau valide les nouveaux blocs, avec des compromis différents entre sécurité, décentralisation et consommation énergétique.",
    exemple:"Le Bitcoin utilise une blockchain publique sécurisée par la preuve de travail.",
    avantages:["Transparence et absence d'intermédiaire central"],
    inconvenients:["Irréversibilité des erreurs de transaction","Complexité technique pour les débutants"],
    erreurs:["Confondre la blockchain elle-même et les cryptomonnaies qui l'utilisent"]
  },
  {
    terme:"Rendement locatif",
    categorie:"Immobilier",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le rendement locatif indique combien un bien immobilier rapporte chaque année, en pourcentage de son prix.",
    detail:"Le rendement brut se calcule en divisant les loyers annuels par le prix d'achat. Le rendement net déduit charges, taxe foncière et frais de gestion pour donner une image plus réaliste.",
    avance:"Le cash-flow (différence entre loyers encaissés et toutes les charges, crédit inclus) est souvent plus pertinent que le seul rendement pour juger de la viabilité réelle d'un investissement locatif à effet de levier.",
    exemple:"Un bien acheté 200 000 € générant 12 000 € de loyers annuels affiche un rendement brut de 6%.",
    avantages:[],
    inconvenients:["Le rendement brut ignore les charges et la fiscalité"],
    erreurs:["Ne raisonner qu'en rendement brut sans tenir compte des charges"]
  },
  {
    terme:"Apport personnel",
    categorie:"Immobilier",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"L'apport personnel est la somme que l'acheteur investit lui-même dans un achat immobilier, en plus du montant emprunté à la banque.",
    detail:"Il peut provenir d'une épargne, d'une donation ou de la revente d'un bien. Un apport plus élevé réduit le montant à emprunter, ce qui diminue généralement le coût total du crédit et peut permettre d'obtenir un meilleur taux.",
    avance:"Les banques demandent souvent un apport minimum (traditionnellement autour de 10% pour couvrir les frais de notaire et de garantie), même si certains profils peuvent parfois emprunter sans apport selon leur situation.",
    exemple:"Pour un bien à 200 000€, un apport de 20 000€ (10%) permet d'emprunter 180 000€ plutôt que la totalité.",
    avantages:["Réduit le montant emprunté et donc le coût total du crédit", "Peut permettre de négocier un meilleur taux"],
    inconvenients:["Immobilise une épargne qui ne peut plus être investie ailleurs"],
    erreurs:["Vider toute son épargne de précaution pour maximiser l'apport"]
  },
  {
    terme:"Effet de levier",
    categorie:"Immobilier",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"L'effet de levier consiste à utiliser de l'argent emprunté pour investir dans un bien dont la valeur ou les revenus, on l'espère, dépasseront le coût du crédit.",
    detail:"En immobilier, il permet d'investir dans un bien bien plus cher que son épargne disponible seule ne le permettrait, grâce au crédit. Si le rendement du bien dépasse le coût du crédit, l'effet de levier amplifie le gain rapporté à l'apport initial — mais il amplifie aussi les pertes en cas de mauvaise opération.",
    avance:"L'effet de levier est un couteau à double tranchant : il augmente le rendement potentiel rapporté au capital investi, mais aussi le risque, puisque les mensualités doivent être payées que le bien soit rentable ou non.",
    exemple:"Investir 20 000€ d'apport pour acheter un bien de 200 000€ à crédit, c'est utiliser un effet de levier de 10 : chaque variation de la valeur du bien a un impact dix fois plus important sur l'apport initial.",
    avantages:["Permet d'investir des montants supérieurs à son épargne disponible"],
    inconvenients:["Amplifie aussi les pertes potentielles, pas seulement les gains"],
    erreurs:["Sous-estimer sa capacité à rembourser le crédit en cas de coup dur (vacance locative, taux variable...)"]
  },
  {
    terme:"Cash-flow (immobilier)",
    categorie:"Immobilier",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le cash-flow d'un investissement locatif est ce qu'il reste chaque mois une fois le loyer perçu et toutes les charges (crédit, charges de copropriété, taxe foncière, assurance...) payées.",
    detail:"Un cash-flow positif signifie que le bien s'autofinance et dégage même un excédent ; un cash-flow négatif signifie que le propriétaire doit compléter chaque mois de sa poche pour couvrir les charges.",
    avance:"Un cash-flow négatif n'est pas automatiquement une mauvaise affaire (le bien peut se valoriser dans le temps), mais il implique une capacité financière à absorber ce manque chaque mois, ce que beaucoup d'investisseurs débutants sous-estiment.",
    exemple:"Un loyer de 800€ moins 750€ de mensualité de crédit et de charges génère un cash-flow positif de 50€ par mois.",
    avantages:[],
    inconvenients:[],
    erreurs:["Ne calculer le cash-flow qu'avec le loyer et le crédit, en oubliant charges de copropriété, taxe foncière, assurance et provision pour travaux"]
  },
  {
    terme:"Charges locatives",
    categorie:"Immobilier",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Les charges locatives regroupent l'ensemble des dépenses liées à la possession et à la gestion d'un bien mis en location.",
    detail:"Elles incluent notamment les charges de copropriété, la taxe foncière, l'assurance propriétaire non occupant, les frais de gestion locative éventuels et une provision pour l'entretien ou les travaux. Certaines charges sont récupérables auprès du locataire, d'autres restent à la charge du propriétaire.",
    avance:"Sous-estimer les charges non récupérables est une des erreurs les plus fréquentes des investisseurs débutants : elles peuvent représenter 20 à 30% du loyer annuel selon le type de bien et sa localisation.",
    exemple:"Sur un loyer annuel de 9600€, environ 2000 à 2800€ de charges non récupérables (copropriété, taxe foncière, assurance, entretien) sont fréquents selon le bien.",
    avantages:[],
    inconvenients:[],
    erreurs:["Estimer la rentabilité d'un bien uniquement à partir du loyer brut, sans déduire les charges réelles"]
  },
  {
    terme:"Vacance locative",
    categorie:"Immobilier",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La vacance locative désigne les périodes où un bien mis en location reste inoccupé, sans locataire et donc sans loyer perçu.",
    detail:"Elle peut survenir entre deux locataires, pendant des travaux, ou en cas de difficulté à trouver preneur. Elle réduit directement le rendement réel d'un investissement locatif par rapport au rendement théorique calculé sur une occupation à 100%.",
    avance:"Les investisseurs expérimentés intègrent généralement une hypothèse de vacance locative (par exemple un mois par an) dans leurs calculs de rentabilité, plutôt que de supposer une occupation permanente qui est rarement réaliste sur le long terme.",
    exemple:"Un bien loué 11 mois sur 12 dans l'année a un taux de vacance locative d'environ 8%, ce qui réduit d'autant le loyer réellement perçu sur l'année.",
    avantages:[],
    inconvenients:["Réduit le rendement réel par rapport au rendement théorique affiché"],
    erreurs:["Calculer la rentabilité d'un bien en supposant une occupation à 100% toute l'année"]
  },
  {
    terme:"Crédit immobilier",
    categorie:"Immobilier",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le crédit immobilier est un prêt bancaire destiné à financer l'achat d'un bien immobilier, remboursé sur une longue durée (souvent 15 à 25 ans).",
    detail:"Son coût dépend principalement du taux d'intérêt, de la durée de remboursement et de l'assurance emprunteur. Le TAEG (taux annuel effectif global) permet de comparer différentes offres car il intègre l'ensemble de ces coûts, pas seulement le taux nominal.",
    avance:"Un allongement de la durée du crédit réduit la mensualité mais augmente fortement le coût total des intérêts payés sur la durée totale — un arbitrage à bien comprendre avant de choisir la durée d'un prêt.",
    exemple:"Pour un même montant emprunté, un crédit sur 25 ans a des mensualités plus faibles qu'un crédit sur 15 ans, mais un coût total en intérêts nettement plus élevé.",
    avantages:["Permet d'acheter un bien sans disposer de la totalité de sa valeur en épargne"],
    inconvenients:["Engage l'emprunteur sur une longue durée avec des mensualités fixes ou variables à honorer"],
    erreurs:["Comparer des offres de crédit uniquement sur le taux nominal, sans regarder le TAEG"]
  },
  {
    terme:"Fonds d'urgence",
    categorie:"Finances personnelles",
    niveau:"Débutant",
    lecture:"1 min",
    simple:"Le fonds d'urgence est une épargne de sécurité disponible immédiatement en cas d'imprévu.",
    detail:"Il représente généralement 3 à 6 mois de dépenses courantes, placé sur un support disponible sans délai (livret) plutôt qu'investi en actions.",
    avance:"Le montant idéal dépend de la stabilité des revenus : un revenu variable ou un statut d'indépendant justifie souvent un fonds d'urgence plus large qu'un salarié en CDI stable.",
    exemple:"Une personne dépensant 1 500 €/mois vise un fonds d'urgence entre 4 500 € et 9 000 €.",
    avantages:["Évite de vendre des investissements en catastrophe","Réduit le recours au crédit à la consommation"],
    inconvenients:["Rendement faible, coût d'opportunité par rapport à l'investissement"],
    erreurs:["Investir en actions l'argent destiné aux imprévus à court terme"]
  },
  {
    terme:"Assurance-vie",
    categorie:"Épargne",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"L'assurance-vie est une enveloppe d'épargne flexible, avec des avantages fiscaux qui augmentent avec le temps.",
    detail:"Elle permet d'investir sur un fonds en euros (capital garanti, rendement modéré) et/ou des unités de compte (plus risquées, potentiel de rendement plus élevé), au sein du même contrat.",
    avance:"La fiscalité devient plus favorable après 8 ans de détention, avec un abattement annuel sur les gains lors des retraits, et un cadre successoral spécifique distinct du droit commun.",
    exemple:"Répartir un contrat entre 50% de fonds en euros et 50% d'unités de compte selon son profil de risque.",
    avantages:["Flexibilité entre sécurité et performance","Cadre fiscal avantageux sur le long terme"],
    inconvenients:["Frais parfois élevés selon les contrats"],
    erreurs:["Ne pas comparer les frais de gestion entre contrats"]
  },
  {
    terme:"Inflation",
    categorie:"Économie",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"L'inflation, c'est la hausse générale des prix, qui réduit le pouvoir d'achat de l'argent non placé.",
    detail:"Si les prix augmentent de 3% par an et qu'une épargne rapporte 1%, son pouvoir d'achat réel diminue, même si le montant affiché sur le compte augmente.",
    avance:"Les banques centrales ciblent généralement une inflation autour de 2% par an, en ajustant leurs taux directeurs pour la contenir sans provoquer de récession, un exercice d'équilibre délicat.",
    exemple:"Une inflation de 2,1% signifie qu'un panier de biens à 100 € coûtera environ 102,10 € un an plus tard.",
    avantages:[],
    inconvenients:["Érode le pouvoir d'achat de l'épargne non rémunérée"],
    erreurs:["Ignorer l'inflation en comparant des rendements sur longue période"]
  },
  {
    terme:"PIB (Produit intérieur brut)",
    categorie:"Économie",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le PIB mesure la valeur totale de tout ce qui est produit dans un pays sur une période donnée, généralement un an.",
    detail:"Il additionne la valeur de tous les biens et services produits sur le territoire national et sert de baromètre principal de la santé économique d'un pays. Sa variation d'une période à l'autre indique si l'économie croît ou se contracte.",
    avance:"Le PIB ne capture ni les inégalités de répartition des richesses, ni le travail non marchand (bénévolat, tâches domestiques), ni l'impact environnemental — d'où l'existence d'indicateurs complémentaires comme l'IDH ou l'empreinte carbone.",
    exemple:"Si le PIB français croît de 1,5% sur un an, cela signifie que la richesse produite dans le pays a augmenté de 1,5% par rapport à l'année précédente.",
    avantages:["Indicateur simple, standardisé et comparable entre pays et dans le temps"],
    inconvenients:["Ne reflète pas la répartition des richesses ni le bien-être", "Ignore le travail non rémunéré et les impacts environnementaux"],
    erreurs:["Confondre croissance du PIB et amélioration du niveau de vie de chacun"]
  },
  {
    terme:"Taux d'intérêt directeur",
    categorie:"Économie",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le taux directeur est le taux auquel une banque centrale prête de l'argent aux banques commerciales — il influence tous les autres taux d'intérêt de l'économie.",
    detail:"En le relevant, une banque centrale rend le crédit plus cher, ce qui freine la consommation et l'investissement et aide à lutter contre l'inflation. En le baissant, elle rend le crédit moins cher pour relancer l'activité économique.",
    avance:"Les décisions de taux directeur (par exemple celles de la BCE ou de la Fed) se répercutent avec un délai de plusieurs mois sur l'économie réelle, ce qui rend leur calibrage difficile et sujet à débat parmi les économistes.",
    exemple:"Quand la BCE relève son taux directeur, les crédits immobiliers à taux variable et les nouveaux emprunts deviennent généralement plus chers.",
    avantages:["Outil puissant pour réguler l'inflation et l'activité économique"],
    inconvenients:["Effets décalés dans le temps, difficiles à calibrer précisément", "Impact inégal selon les ménages et les entreprises"],
    erreurs:["Penser qu'une hausse de taux se répercute instantanément sur l'économie"]
  },
  {
    terme:"Banque centrale",
    categorie:"Économie",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Une banque centrale est l'institution chargée de piloter la politique monétaire d'un pays ou d'une zone, notamment en fixant les taux d'intérêt directeurs.",
    detail:"Elle a généralement pour mission de maintenir la stabilité des prix (contenir l'inflation), et parfois de soutenir l'emploi. Elle supervise aussi le système bancaire et peut agir comme prêteur en dernier ressort en cas de crise.",
    avance:"L'indépendance d'une banque centrale vis-à-vis du pouvoir politique est considérée comme un facteur de crédibilité pour ancrer les anticipations d'inflation, même si ce principe fait l'objet de débats économiques.",
    exemple:"La Banque centrale européenne (BCE) fixe la politique monétaire pour l'ensemble de la zone euro.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre banque centrale et banque commerciale (où l'on a un compte courant)"]
  },
  {
    terme:"Récession",
    categorie:"Économie",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Une récession désigne une période où l'activité économique d'un pays recule, généralement mesurée par deux trimestres consécutifs de baisse du PIB.",
    detail:"Elle s'accompagne souvent d'une hausse du chômage, d'une baisse de la consommation et des investissements des entreprises. Elle se distingue d'une simple décélération de la croissance, où l'économie continue de croître mais plus lentement.",
    avance:"Certains organismes (comme le NBER aux États-Unis) ne se limitent pas à la règle des deux trimestres consécutifs et évaluent plusieurs indicateurs (emploi, production industrielle, revenus) pour dater officiellement une récession.",
    exemple:"Si le PIB recule pendant deux trimestres d'affilée, on parle généralement de récession technique.",
    avantages:[],
    inconvenients:["Hausse du chômage et baisse des revenus", "Baisse de la valeur de nombreux actifs financiers"],
    erreurs:["Confondre ralentissement de la croissance et récession réelle"]
  },
  {
    terme:"Offre et demande",
    categorie:"Économie",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"L'offre et la demande, c'est la relation entre la quantité d'un bien proposée sur un marché et la quantité que les acheteurs souhaitent acquérir — leur rencontre détermine le prix.",
    detail:"Quand la demande dépasse l'offre, les prix ont tendance à monter ; quand l'offre dépasse la demande, ils ont tendance à baisser. Ce mécanisme est au cœur du fonctionnement des marchés, y compris les marchés financiers.",
    avance:"Ce modèle simplifié suppose une concurrence pure et parfaite ; dans la réalité, des facteurs comme les monopoles, les subventions ou l'information imparfaite peuvent déformer durablement l'équilibre entre offre et demande.",
    exemple:"Une pénurie de puces électroniques (offre réduite) alors que la demande reste forte a fait monter leur prix pendant la crise de 2021.",
    avantages:[],
    inconvenients:[],
    erreurs:["Croire que les prix reflètent toujours un marché parfaitement équilibré"]
  },
  {
    terme:"Chômage",
    categorie:"Économie",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le taux de chômage mesure la part de la population active qui n'a pas d'emploi mais en recherche un activement.",
    detail:"Il rapporte le nombre de chômeurs (au sens du Bureau International du Travail : sans emploi, disponible et recherchant activement) à la population active totale (personnes en emploi + chômeurs). Il ne compte donc ni les inactifs (retraités, étudiants non en recherche) ni les personnes découragées qui ont cessé de chercher.",
    avance:"Le taux de chômage est un indicateur retardé (lagging indicator) : il continue souvent de se dégrader un temps après le début d'une reprise économique, car les entreprises n'embauchent qu'une fois leur activité réellement repartie.",
    exemple:"Un taux de chômage de 8% signifie que, parmi les personnes en emploi ou en recherche active d'emploi, 8% sont sans emploi.",
    avantages:["Indicateur suivi de longue date, comparable dans le temps et entre pays"],
    inconvenients:["Ne compte pas le sous-emploi (temps partiel subi) ni le halo autour du chômage (personnes découragées)", "Indicateur retardé par rapport à l'activité économique réelle"],
    erreurs:["Confondre taux de chômage et part de la population totale sans emploi (qui inclut aussi les inactifs)"]
  },
  {
    terme:"Dette publique",
    categorie:"Économie",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La dette publique est le cumul de tout ce qu'un État (et les administrations publiques) doit à ses créanciers, généralement exprimé en % du PIB pour permettre les comparaisons.",
    detail:"Elle résulte de l'accumulation des déficits publics passés (dépenses supérieures aux recettes) financés par emprunt. L'exprimer en % du PIB permet de comparer des pays de tailles différentes et de suivre si la dette croît plus vite que la richesse produite.",
    avance:"Un ratio dette/PIB élevé n'est pas automatiquement synonyme de crise : il dépend aussi du coût de la dette (taux d'intérêt payés), de sa maturité, de la devise dans laquelle elle est émise et de la capacité de l'État à lever de nouveaux impôts.",
    exemple:"Une dette publique de 117% du PIB signifie que la dette cumulée de l'État représente 1,17 fois la richesse produite dans le pays en un an.",
    avantages:["Permet à un État de financer des investissements ou de lisser un choc économique sans augmenter les impôts immédiatement"],
    inconvenients:["Le service de la dette (intérêts à payer) réduit la marge de manœuvre budgétaire future", "Une dette perçue comme insoutenable peut faire monter les taux exigés par les créanciers"],
    erreurs:["Comparer des niveaux de dette publique entre pays sans tenir compte du taux d'intérêt payé ni de la devise d'émission"]
  },
  {
    terme:"Balance commerciale",
    categorie:"Économie",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"La balance commerciale mesure la différence entre ce qu'un pays exporte (vend à l'étranger) et ce qu'il importe (achète à l'étranger) sur une période donnée.",
    detail:"Un excédent commercial signifie que le pays exporte plus qu'il n'importe (plus d'argent entre que n'en sort pour les échanges de biens et services) ; un déficit commercial signifie l'inverse.",
    avance:"Un déficit commercial n'est pas automatiquement un problème : il peut refléter un pays qui investit massivement (donc importe des biens d'équipement) ou dont la monnaie forte rend les importations avantageuses — le contexte compte davantage que le signe seul.",
    exemple:"Si un pays exporte pour 500 Md€ de biens et services sur l'année et en importe pour 550 Md€, sa balance commerciale affiche un déficit de 50 Md€.",
    avantages:[],
    inconvenients:[],
    erreurs:["Considérer systématiquement un déficit commercial comme un signe de faiblesse économique, sans regarder ce qui l'explique"]
  },
  {
    terme:"Droits de douane",
    categorie:"Économie",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Un droit de douane est une taxe appliquée sur des biens importés depuis un autre pays, généralement calculée en % de leur valeur, qui augmente leur prix pour les consommateurs et entreprises du pays importateur.",
    detail:"Un pays peut instaurer des droits de douane pour protéger ses industries nationales de la concurrence étrangère, générer des recettes fiscales, ou faire pression dans un différend commercial avec un autre pays.",
    avance:"Le coût d'un droit de douane est généralement partagé entre l'exportateur étranger (qui peut baisser son prix pour rester compétitif) et l'importateur/consommateur local (qui absorbe le reste via un prix final plus élevé) — la répartition exacte dépend du pouvoir de négociation relatif des deux parties.",
    exemple:"Un droit de douane de 20% sur un bien importé à 100€ porte son coût d'entrée à 120€ avant même la marge du distributeur local.",
    avantages:["Peut protéger temporairement une industrie nationale jugée stratégique face à une concurrence étrangère jugée déloyale"],
    inconvenients:["Augmente généralement les prix pour les consommateurs et entreprises du pays qui l'impose", "Risque de mesures de rétorsion du pays visé, pouvant dégénérer en guerre commerciale"],
    erreurs:["Croire qu'un droit de douane est payé uniquement par le pays étranger visé, sans coût pour les consommateurs du pays qui l'impose"]
  },
  {
    terme:"Libre-échange",
    categorie:"Économie",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le libre-échange désigne une politique commerciale qui réduit ou supprime les barrières (droits de douane, quotas) aux échanges de biens et services entre pays.",
    detail:"Il repose sur l'idée que chaque pays gagne à se spécialiser dans ce qu'il produit le plus efficacement (avantage comparatif) et à échanger le reste, plutôt que de chercher à tout produire localement.",
    avance:"Le libre-échange génère en théorie un gain économique global, mais sa répartition est inégale : certains secteurs et emplois d'un pays peuvent en bénéficier fortement, tandis que d'autres, moins compétitifs face à la concurrence étrangère, peuvent en souffrir — d'où les débats politiques récurrents qu'il suscite.",
    exemple:"Un accord de libre-échange entre deux pays peut supprimer les droits de douane sur la majorité des biens échangés entre eux.",
    avantages:["Permet en théorie un accès à des biens moins chers et une spécialisation plus efficace des économies"],
    inconvenients:["Peut fragiliser certains secteurs ou emplois nationaux directement exposés à une concurrence étrangère plus compétitive"],
    erreurs:["Présenter le libre-échange comme bénéficiant uniformément à tous les secteurs et tous les travailleurs d'un pays"]
  },
  {
    terme:"Protectionnisme",
    categorie:"Économie",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le protectionnisme est une politique commerciale qui vise à protéger les industries nationales de la concurrence étrangère, généralement via des droits de douane ou des quotas d'importation.",
    detail:"C'est l'opposé du libre-échange : plutôt que d'ouvrir ses frontières commerciales, un pays protectionniste cherche à limiter les importations pour préserver ses emplois et industries locales face à une concurrence étrangère jugée trop forte ou déloyale.",
    avance:"Le protectionnisme peut se justifier temporairement pour une industrie naissante jugée stratégique, le temps qu'elle devienne compétitive — mais prolongé indéfiniment, il tend à réduire la pression concurrentielle qui pousse les entreprises nationales à innover et rester efficaces, au prix de prix plus élevés pour les consommateurs.",
    exemple:"Un pays qui impose des droits de douane élevés sur l'acier importé pour protéger ses propres aciéries applique une politique protectionniste.",
    avantages:["Peut protéger temporairement des emplois et industries nationales jugés stratégiques"],
    inconvenients:["Tend à augmenter les prix pour les consommateurs et réduire la pression concurrentielle qui pousse à l'innovation", "Risque de mesures de rétorsion des partenaires commerciaux visés"],
    erreurs:["Considérer le protectionnisme comme une protection sans coût réel pour l'économie qui l'applique"]
  },
  {
    terme:"Avantage comparatif",
    categorie:"Économie",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"L'avantage comparatif est le principe économique selon lequel un pays a intérêt à se spécialiser dans la production où il est relativement le plus efficace, même s'il n'est pas le meilleur en absolu, et à échanger le reste — l'échange peut alors bénéficier aux deux parties.",
    detail:"Contrairement à l'avantage absolu (être meilleur qu'un autre pays dans la production d'un bien), l'avantage comparatif compare le coût d'opportunité de produire un bien plutôt qu'un autre au sein d'un même pays — un pays peut être moins efficace qu'un autre dans TOUT, et pourtant avoir intérêt à se spécialiser et échanger.",
    avance:"C'est l'un des résultats les plus contre-intuitifs mais les mieux établis de la théorie économique classique (David Ricardo, XIXe siècle) : même un pays plus productif que tous les autres dans tous les domaines a intérêt à se concentrer sur ce où son avantage relatif est le plus grand, et à échanger le reste.",
    exemple:"Un pays très efficace à la fois en agriculture et en électronique peut avoir intérêt à se concentrer sur l'électronique (où son avantage relatif est le plus grand) et à importer une partie de sa nourriture, plutôt que de tout produire lui-même.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre avantage comparatif (efficacité relative, propre à un pays) et avantage absolu (être meilleur qu'un autre pays en absolu)"]
  },
  {
    terme:"Compétitivité",
    categorie:"Économie",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La compétitivité d'un pays ou d'une entreprise désigne sa capacité à produire des biens et services attractifs sur les marchés internationaux, que ce soit par le prix, la qualité ou l'innovation.",
    detail:"Elle dépend de nombreux facteurs : coût de la main-d'œuvre, productivité, taux de change, qualité des infrastructures, niveau d'innovation, fiscalité — aucun facteur isolé ne suffit à l'expliquer entièrement.",
    avance:"Une monnaie qui se déprécie peut améliorer temporairement la compétitivité-prix d'un pays à l'export (ses produits deviennent moins chers pour les acheteurs étrangers), sans que cela reflète un vrai gain de productivité ou d'innovation sous-jacent — une distinction importante entre compétitivité-prix et compétitivité structurelle.",
    exemple:"Un pays peut gagner en compétitivité-prix suite à une dépréciation de sa monnaie, sans que ses entreprises soient devenues plus productives ou innovantes pour autant.",
    avantages:[],
    inconvenients:[],
    erreurs:["Réduire la compétitivité d'un pays au seul niveau des salaires, en ignorant productivité, innovation et qualité des infrastructures"]
  },
  {
    terme:"Chaînes d'approvisionnement",
    categorie:"Économie",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Une chaîne d'approvisionnement désigne l'ensemble des étapes (matières premières, production, assemblage, transport) nécessaires pour qu'un produit arrive jusqu'au consommateur final, souvent réparties entre plusieurs pays.",
    detail:"Un produit électronique courant peut ainsi combiner des composants conçus dans un pays, fabriqués dans un second, assemblés dans un troisième, avant d'être vendu dans un quatrième — chaque étape ajoutant de la valeur, mais aussi de la dépendance à ce que chaque maillon fonctionne correctement.",
    avance:"Les perturbations de chaînes d'approvisionnement mondiales (pénurie de composants, blocage d'une route commerciale majeure, crise sanitaire) peuvent avoir des répercussions économiques bien au-delà du secteur directement touché, en raison de l'interdépendance des maillons — un sujet devenu central dans les stratégies d'entreprise depuis les perturbations du début des années 2020.",
    exemple:"Une pénurie de semi-conducteurs peut ralentir la production automobile mondiale, même dans des pays qui ne fabriquent aucun semi-conducteur eux-mêmes.",
    avantages:["Permet une spécialisation mondiale qui peut réduire les coûts et améliorer la qualité globale des produits"],
    inconvenients:["Crée une dépendance à des maillons parfois lointains et peu visibles, vulnérables à des chocs imprévus"],
    erreurs:["Sous-estimer la vulnérabilité d'une chaîne d'approvisionnement mondialisée face à un choc localisé sur un seul maillon critique"]
  },
  {
    terme:"Délocalisation",
    categorie:"Économie",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La délocalisation désigne le déplacement d'une activité de production d'un pays vers un autre, généralement pour réduire les coûts (main-d'œuvre, énergie, réglementation) ou se rapprocher d'un marché en croissance.",
    detail:"Elle se distingue de la simple importation : une entreprise délocalise quand elle déplace sa PROPRE production ailleurs, plutôt que d'acheter à un fournisseur étranger déjà existant.",
    avance:"Les décisions de délocalisation ne se limitent plus uniquement au coût de la main-d'œuvre : la proximité du marché final, la stabilité géopolitique, la fiabilité des chaînes d'approvisionnement et les coûts de transport entrent aussi en compte — certaines entreprises ont d'ailleurs relocalisé une partie de leur production ces dernières années pour réduire leur dépendance à des chaînes d'approvisionnement lointaines.",
    exemple:"Une entreprise qui ferme une usine dans un pays pour ouvrir une usine équivalente dans un autre pays aux coûts de production plus faibles réalise une délocalisation.",
    avantages:["Peut réduire les coûts de production et améliorer la compétitivité-prix d'une entreprise"],
    inconvenients:["Entraîne généralement des pertes d'emplois dans le pays d'origine", "Peut allonger et complexifier les chaînes d'approvisionnement, avec un risque accru en cas de perturbation"],
    erreurs:["Confondre délocalisation (déplacement de sa propre production) et simple importation depuis un fournisseur étranger indépendant"]
  },
  {
    terme:"Taux de change",
    categorie:"Économie",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le taux de change indique combien d'unités d'une monnaie sont nécessaires pour obtenir une unité d'une autre monnaie — il détermine le prix relatif des biens, services et actifs entre deux pays.",
    detail:"Une monnaie qui s'apprécie (devient plus chère par rapport à une autre) rend les exportations de ce pays plus chères pour les acheteurs étrangers, mais rend ses importations moins chères ; une dépréciation produit l'effet inverse.",
    avance:"Les taux de change sont influencés par de nombreux facteurs : différentiels de taux d'intérêt entre pays, balance commerciale, anticipations des marchés, politique monétaire des banques centrales — leur évolution à court terme reste notoirement difficile à prévoir avec fiabilité.",
    exemple:"Si l'euro s'apprécie face au dollar, les produits européens deviennent plus chers pour les acheteurs américains, tandis que les produits américains deviennent moins chers pour les acheteurs européens.",
    avantages:[],
    inconvenients:[],
    erreurs:["Penser qu'une monnaie « forte » est toujours préférable à une monnaie « faible » pour l'économie d'un pays — cela dépend de la situation (exportateur vs importateur net, par exemple)"]
  },
  {
    terme:"Chiffre d'affaires",
    categorie:"Entreprise",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le chiffre d'affaires est le montant total des ventes réalisées par une entreprise sur une période donnée, avant déduction des charges.",
    detail:"Il ne dit rien de la rentabilité : une entreprise peut avoir un chiffre d'affaires élevé et être déficitaire si ses charges dépassent ses revenus. C'est un indicateur de taille d'activité, pas de profitabilité.",
    avance:"Les analystes surveillent surtout la croissance du chiffre d'affaires (souvent en %, en comparaison annuelle) et sa décomposition géographique ou par segment, plus que son niveau absolu.",
    exemple:"Une entreprise qui vend pour 10 millions d'euros de produits sur l'année réalise un chiffre d'affaires de 10 millions d'euros, quel que soit son bénéfice final.",
    avantages:[],
    inconvenients:["Ne renseigne pas sur la rentabilité de l'entreprise"],
    erreurs:["Confondre chiffre d'affaires et bénéfice"]
  },
  {
    terme:"Marge nette",
    categorie:"Entreprise",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La marge nette est la part du chiffre d'affaires qui reste sous forme de bénéfice, une fois toutes les charges payées.",
    detail:"Elle se calcule en divisant le résultat net par le chiffre d'affaires. Une marge nette de 10% signifie que l'entreprise conserve 10 centimes de bénéfice pour chaque euro de vente.",
    avance:"Les niveaux de marge nette normaux varient énormément selon les secteurs — un supermarché et un éditeur de logiciels n'ont pas la même structure de coûts, ce qui rend les comparaisons intersectorielles peu pertinentes.",
    exemple:"Une entreprise avec 100 M€ de chiffre d'affaires et 8 M€ de résultat net a une marge nette de 8%.",
    avantages:[],
    inconvenients:[],
    erreurs:["Comparer la marge nette d'entreprises de secteurs très différents sans nuance"]
  },
  {
    terme:"Bilan comptable",
    categorie:"Entreprise",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le bilan comptable est une photographie du patrimoine d'une entreprise à un instant donné : ce qu'elle possède (actif) et comment elle le finance (passif).",
    detail:"L'actif regroupe les biens et créances de l'entreprise (trésorerie, stocks, équipements...), tandis que le passif indique leurs origines (capitaux propres des actionnaires, dettes). Par construction, actif et passif sont toujours égaux.",
    avance:"Contrairement au compte de résultat, qui mesure une performance sur une période, le bilan est un instantané — il faut lire les deux ensemble pour bien comprendre la situation financière d'une entreprise.",
    exemple:"Un bilan qui montre 50 M€ d'actif financés par 20 M€ de capitaux propres et 30 M€ de dettes indique une entreprise financée à 40% par ses actionnaires.",
    avantages:[],
    inconvenients:[],
    erreurs:["Analyser un bilan isolément sans le compte de résultat"]
  },
  {
    terme:"Actif",
    categorie:"Entreprise",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"L'actif regroupe tout ce que possède une entreprise et qui a une valeur économique : trésorerie, stocks, équipements, créances clients, brevets...",
    detail:"On distingue généralement l'actif immobilisé (biens destinés à rester durablement dans l'entreprise : locaux, machines, brevets) de l'actif circulant (éléments qui changent rapidement dans le cycle d'exploitation : stocks, créances clients, trésorerie).",
    avance:"La valeur comptable d'un actif (son coût d'acquisition moins les amortissements déjà constatés) ne correspond pas toujours à sa valeur de marché réelle — un terrain acheté il y a 30 ans peut valoir bien plus aujourd'hui que sa valeur inscrite au bilan.",
    exemple:"Pour une usine, l'actif comprend le bâtiment, les machines, les stocks de matières premières et de produits finis, ainsi que l'argent en caisse.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre la valeur comptable d'un actif (au bilan) et sa valeur de marché réelle"]
  },
  {
    terme:"Passif",
    categorie:"Entreprise",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le passif indique comment l'entreprise finance ce qu'elle possède (son actif) : par les capitaux apportés par les actionnaires, ou par des dettes envers des tiers.",
    detail:"Il se décompose en capitaux propres (argent apporté par les actionnaires + bénéfices non distribués accumulés) et en dettes (envers les banques, les fournisseurs, l'État...). Par construction comptable, le passif est toujours égal à l'actif.",
    avance:"La structure du passif (part de capitaux propres vs part de dette) est un indicateur clé du risque financier d'une entreprise : plus la part de dette est élevée, plus l'entreprise est sensible à une hausse des taux ou à une baisse de son activité.",
    exemple:"Un passif de 50 M€ composé de 20 M€ de capitaux propres et 30 M€ de dettes signifie que 60% du financement de l'entreprise provient de créanciers, pas des actionnaires.",
    avantages:[],
    inconvenients:[],
    erreurs:["Penser que le passif ne représente que les dettes — il inclut aussi les capitaux propres"]
  },
  {
    terme:"Capitaux propres",
    categorie:"Entreprise",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Les capitaux propres représentent ce qui appartient réellement aux actionnaires d'une entreprise : leurs apports initiaux plus les bénéfices accumulés et non redistribués au fil du temps.",
    detail:"Ils se calculent comme la différence entre l'actif total et les dettes : c'est ce qu'il resterait aux actionnaires si l'entreprise vendait tous ses actifs et remboursait toutes ses dettes.",
    avance:"Des capitaux propres négatifs (dettes supérieures à l'actif) signalent une situation financière très dégradée, potentiellement proche du dépôt de bilan — un signal d'alerte que les analystes surveillent en priorité.",
    exemple:"Une entreprise avec 50 M€ d'actif et 30 M€ de dettes a 20 M€ de capitaux propres.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre capitaux propres et trésorerie disponible — les capitaux propres ne sont pas de l'argent liquide"]
  },
  {
    terme:"Compte de résultat",
    categorie:"Entreprise",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le compte de résultat mesure la performance d'une entreprise sur une période donnée (généralement un an) : tous les produits (ventes) moins toutes les charges, pour aboutir au résultat net.",
    detail:"Contrairement au bilan (une photographie à un instant donné), le compte de résultat est un film sur une période : il retrace le chiffre d'affaires, les charges d'exploitation, les charges financières et les impôts pour aboutir au bénéfice ou à la perte de l'exercice.",
    avance:"Le compte de résultat s'organise généralement en plusieurs niveaux de résultat intermédiaires (résultat d'exploitation, résultat financier, résultat exceptionnel) qui permettent d'isoler la performance de l'activité courante des éléments ponctuels ou financiers.",
    exemple:"Une entreprise avec 10 M€ de chiffre d'affaires, 7 M€ de charges d'exploitation, 0,5 M€ de charges financières et 0,6 M€ d'impôts affiche un résultat net de 1,9 M€.",
    avantages:[],
    inconvenients:[],
    erreurs:["Lire le compte de résultat sans le bilan et en déduire une situation financière complète"]
  },
  {
    terme:"Résultat net",
    categorie:"Entreprise",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le résultat net est le bénéfice (ou la perte) final d'une entreprise sur une période, une fois toutes les charges déduites de tous les produits — y compris les impôts.",
    detail:"C'est la toute dernière ligne du compte de résultat : chiffre d'affaires moins l'ensemble des charges d'exploitation, financières et exceptionnelles, moins l'impôt sur les sociétés.",
    avance:"Un résultat net positif ne garantit pas une trésorerie saine, et inversement : des éléments non monétaires (amortissements, provisions) et le décalage entre facturation et encaissement (BFR) peuvent créer un écart important entre bénéfice comptable et argent réellement disponible.",
    exemple:"Une entreprise rentable (résultat net positif) peut malgré tout manquer de trésorerie si ses clients la paient très en retard.",
    avantages:[],
    inconvenients:[],
    erreurs:["Assimiler résultat net positif et trésorerie abondante — les deux peuvent diverger fortement"]
  },
  {
    terme:"Provisions",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Une provision est une charge comptabilisée par anticipation pour un risque ou une perte probable, même si la dépense réelle n'a pas encore eu lieu.",
    detail:"Une entreprise qui anticipe un litige, une créance client qui risque de ne pas être payée, ou une garantie à honorer sur des produits vendus, comptabilise une provision : cela réduit son résultat dès maintenant, avant même la sortie de trésorerie effective.",
    avance:"Les provisions reposent sur une estimation, donc un jugement de la direction — leur ampleur peut être un levier de gestion du résultat (une entreprise peut sur- ou sous-provisionner pour lisser ses bénéfices d'une année sur l'autre), ce que les analystes surveillent.",
    exemple:"Une entreprise poursuivie en justice pour 2 M€ peut provisionner tout ou partie de ce montant avant même l'issue du procès, si une perte est jugée probable.",
    avantages:["Anticipe des risques réels plutôt que de les découvrir brutalement au moment où ils se matérialisent"],
    inconvenients:["Repose sur une estimation, donc un jugement potentiellement biaisé de la direction"],
    erreurs:["Confondre une provision (risque probable, estimé) et une dette certaine déjà due"]
  },
  {
    terme:"Goodwill",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le goodwill (écart d'acquisition) est la différence entre le prix payé pour racheter une entreprise et la valeur comptable réelle de ses actifs nets — il reflète ce qu'on paie en plus pour sa marque, sa clientèle ou son savoir-faire.",
    detail:"Quand une entreprise en rachète une autre pour un prix supérieur à la valeur de ses actifs nets identifiables, la différence est inscrite au bilan de l'acheteur sous forme de goodwill — un actif immatériel qui ne correspond à aucun bien physique précis.",
    avance:"Le goodwill n'est pas amorti mais testé régulièrement pour dépréciation (impairment test) : si l'entreprise rachetée sous-performe par rapport aux attentes initiales, une partie du goodwill peut être dépréciée, ce qui pèse directement sur le résultat de l'acheteur, parfois plusieurs années après l'acquisition.",
    exemple:"Racheter une entreprise valorisée 50 M€ d'actifs nets pour 80 M€ fait apparaître 30 M€ de goodwill au bilan de l'acheteur.",
    avantages:[],
    inconvenients:["Une dépréciation ultérieure du goodwill peut peser lourdement sur le résultat, parfois des années après l'acquisition"],
    erreurs:["Considérer le goodwill comme un actif liquide ou revendable en tant que tel"]
  },
  {
    terme:"Consolidation",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"La consolidation, c'est l'opération comptable qui regroupe les comptes d'une société mère et de ses filiales en un seul jeu de comptes, comme s'il s'agissait d'une seule entité économique.",
    detail:"Sans consolidation, chaque filiale publierait ses propres comptes séparément, rendant difficile d'évaluer la performance globale d'un groupe. Les comptes consolidés éliminent les opérations internes entre sociétés du même groupe (ventes entre filiales, par exemple) pour ne montrer que ce qui se passe avec l'extérieur.",
    avance:"Le périmètre et la méthode de consolidation (intégration globale, proportionnelle, mise en équivalence) dépendent du niveau de contrôle exercé sur chaque filiale — un groupe qui détient 30% d'une société n'applique pas la même méthode que pour une filiale détenue à 100%.",
    exemple:"Un groupe possédant 5 filiales dans différents pays publie des comptes consolidés qui additionnent leurs résultats, en retirant les ventes qu'elles se sont facturées entre elles.",
    avantages:["Donne une vision économique globale d'un groupe, plutôt que des comptes fragmentés par filiale"],
    inconvenients:["Peut masquer des difficultés propres à une filiale précise, diluées dans l'ensemble du groupe"],
    erreurs:["Analyser les comptes sociaux (non consolidés) d'une société mère en pensant qu'ils reflètent toute l'activité du groupe"]
  },
  {
    terme:"OPEX",
    categorie:"Entreprise",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Les OPEX (operating expenses, charges d'exploitation) sont les dépenses courantes nécessaires au fonctionnement quotidien d'une entreprise — loyers, salaires, marketing, fournitures — par opposition aux investissements (CAPEX).",
    detail:"Contrairement au CAPEX (achat d'un bien durable, immobilisé au bilan et amorti sur plusieurs années), une charge OPEX est directement déduite du résultat de l'année où elle est engagée.",
    avance:"La frontière entre CAPEX et OPEX n'est pas toujours évidente et peut faire l'objet de choix comptables : un abonnement logiciel en mode SaaS est généralement classé en OPEX, alors que l'achat d'une licence perpétuelle équivalente pouvait historiquement être immobilisé en CAPEX — un choix qui modifie directement le résultat affiché.",
    exemple:"Le salaire des équipes, le loyer des bureaux et les dépenses publicitaires sont des OPEX ; l'achat d'un nouveau bâtiment est un CAPEX.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre une dépense OPEX (déduite immédiatement du résultat) et un investissement CAPEX (immobilisé puis amorti)"]
  },
  {
    terme:"VAN (Valeur Actuelle Nette)",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"La VAN mesure si un investissement crée de la valeur : elle compare ce que l'investissement va rapporter, ramené à sa valeur d'aujourd'hui, à ce qu'il coûte au départ.",
    detail:"Un euro reçu dans 5 ans vaut moins qu'un euro reçu aujourd'hui (il aurait pu être placé entre-temps) : la VAN actualise donc chaque flux de trésorerie futur à un taux donné avant de les additionner, puis soustrait l'investissement initial.",
    avance:"Une VAN positive signifie que le projet rapporte plus que le coût du capital utilisé pour l'actualiser — il crée de la valeur. Une VAN négative signifie l'inverse, même si le projet semble rentable en apparence sur le papier sans actualisation.",
    exemple:"Un investissement de 10 M€ qui génère des flux de trésorerie actualisés totalisant 12 M€ a une VAN de +2 M€ : il crée de la valeur.",
    avantages:["Donne un montant en euros directement comparable entre plusieurs projets"],
    inconvenients:["Très sensible au taux d'actualisation choisi et aux hypothèses de flux de trésorerie futurs, par nature incertains"],
    erreurs:["Comparer des projets par leur VAN sans tenir compte de montants d'investissement très différents"]
  },
  {
    terme:"TRI (Taux de Rentabilité Interne)",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le TRI est le taux d'actualisation pour lequel la VAN d'un projet serait exactement nulle — autrement dit, le taux de rendement annuel réellement généré par le projet.",
    detail:"Si le TRI d'un projet est supérieur au coût du capital (WACC) de l'entreprise, le projet crée de la valeur (VAN positive à ce taux) ; s'il est inférieur, le projet détruit de la valeur.",
    avance:"Le TRI peut donner des résultats trompeurs pour comparer des projets de tailles très différentes, ou des projets dont les flux de trésorerie changent plusieurs fois de signe — la VAN reste alors le critère de référence recommandé par la plupart des praticiens.",
    exemple:"Un projet avec un TRI de 12% crée de la valeur si le coût du capital de l'entreprise est de 8%, mais en détruirait si ce coût du capital était de 15%.",
    avantages:["Exprimé en %, facile à comparer intuitivement à un coût du capital"],
    inconvenients:["Peut donner un classement de projets différent de la VAN dans certains cas (tailles très différentes, flux atypiques)"],
    erreurs:["Choisir automatiquement le projet au TRI le plus élevé sans regarder aussi sa VAN en euros et sa taille"]
  },
  {
    terme:"WACC (coût moyen pondéré du capital)",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le WACC est le coût moyen que paie une entreprise pour financer ses activités, en combinant le coût de sa dette et le coût attendu par ses actionnaires, pondérés par leur poids respectif dans le financement.",
    detail:"Une entreprise se finance par un mélange de dette (qui coûte un taux d'intérêt) et de capitaux propres (dont les actionnaires attendent un rendement, généralement supérieur au taux de la dette car plus risqué). Le WACC pondère ces deux coûts selon leur part respective dans le financement total.",
    avance:"Le WACC sert de taux d'actualisation de référence pour calculer la VAN d'un projet : un projet n'est jugé créateur de valeur que si sa rentabilité attendue dépasse ce coût du capital — sinon, l'argent serait mieux employé ailleurs, à risque égal.",
    exemple:"Une entreprise financée à 60% par capitaux propres (coût attendu 10%) et 40% par dette (coût 4%) a un WACC ≈ 0,6×10% + 0,4×4% = 7,6%.",
    avantages:["Fournit un seuil de rentabilité minimal objectif pour juger un projet d'investissement"],
    inconvenients:["Le coût des capitaux propres n'est jamais observé directement, seulement estimé — une source d'incertitude dans le calcul"],
    erreurs:["Utiliser le même WACC pour des projets à des niveaux de risque très différents au sein d'une même entreprise"]
  },
  {
    terme:"ROIC",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le ROIC (retour sur capital investi) mesure la rentabilité qu'une entreprise dégage sur l'ensemble du capital utilisé pour financer son activité (dette + capitaux propres), indépendamment de sa structure de financement.",
    detail:"Il rapporte le résultat opérationnel après impôt au capital investi total (dette + capitaux propres). Contrairement au ROE, qui ne regarde que la rentabilité pour les actionnaires, le ROIC évalue la performance opérationnelle pure de l'entreprise.",
    avance:"Comparer le ROIC au WACC est un test clé de création de valeur : un ROIC durablement supérieur au WACC signale un avantage concurrentiel réel (l'entreprise génère plus que ce que coûte son capital) ; un ROIC inférieur au WACC signale une destruction de valeur, même si l'entreprise reste comptablement bénéficiaire.",
    exemple:"Une entreprise avec un ROIC de 15% et un WACC de 8% crée de la valeur à chaque euro de capital supplémentaire investi dans son activité.",
    avantages:["Neutre par rapport à la structure de financement (dette vs capitaux propres), donc plus comparable entre entreprises"],
    inconvenients:["Calcul plus complexe que le ROE, avec des ajustements comptables qui varient selon les analystes"],
    erreurs:["Comparer directement le ROIC et le ROE sans réaliser qu'ils ne mesurent pas la même chose (capital total vs seuls capitaux propres)"]
  },
  {
    terme:"ROE",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le ROE (rendement des capitaux propres) mesure la rentabilité générée par une entreprise pour ses actionnaires : le résultat net rapporté aux capitaux propres investis.",
    detail:"Un ROE élevé signifie que l'entreprise génère beaucoup de bénéfice par euro de capitaux propres — mais ce ratio peut être artificiellement gonflé par un fort endettement (effet de levier), pas seulement par une meilleure performance opérationnelle.",
    avance:"Deux entreprises avec le même ROIC (performance opérationnelle identique) peuvent afficher des ROE très différents si l'une utilise beaucoup plus de dette que l'autre — la dette amplifie le ROE dans les deux sens : à la hausse quand tout va bien, à la baisse en cas de difficulté.",
    exemple:"Une entreprise avec 20 M€ de capitaux propres et 3 M€ de résultat net a un ROE de 15%.",
    avantages:["Indicateur simple et très suivi de la rentabilité pour l'actionnaire"],
    inconvenients:["Peut être gonflé par un endettement élevé (effet de levier) sans amélioration réelle de la performance opérationnelle"],
    erreurs:["Considérer un ROE élevé comme automatiquement positif, sans vérifier s'il provient d'un endettement élevé et donc plus risqué"]
  },
  {
    terme:"Structure financière",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"La structure financière d'une entreprise, c'est la répartition entre dette et capitaux propres utilisée pour financer ses actifs — un arbitrage entre coût du financement et niveau de risque.",
    detail:"La dette coûte généralement moins cher que les capitaux propres (intérêts déductibles fiscalement, risque moindre pour le prêteur), mais elle doit être remboursée quoi qu'il arrive et augmente le risque de défaut en cas de difficulté. Les capitaux propres coûtent plus cher mais n'imposent aucun remboursement obligatoire.",
    avance:"Il existe une structure financière jugée « optimale » en théorie (qui minimise le WACC), mais elle dépend fortement du secteur, de la stabilité des flux de trésorerie et de l'appétit au risque de la direction — il n'existe pas de ratio dette/capitaux propres universellement idéal.",
    exemple:"Une entreprise aux revenus très stables (utilities) peut supporter davantage de dette qu'une startup aux revenus imprévisibles, à risque de défaut égal.",
    avantages:[],
    inconvenients:[],
    erreurs:["Penser qu'une entreprise sans aucune dette est automatiquement mieux gérée qu'une entreprise endettée"]
  },
  {
    terme:"Rachat d'actions",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Un rachat d'actions, c'est quand une entreprise utilise sa trésorerie pour racheter ses propres actions sur le marché, réduisant le nombre d'actions en circulation.",
    detail:"En réduisant le nombre d'actions en circulation, chaque action restante représente une part plus grande de l'entreprise, ce qui tend à augmenter le bénéfice par action même si le résultat net total ne change pas.",
    avance:"C'est une alternative au versement de dividendes pour redistribuer de la trésorerie excédentaire aux actionnaires — avec un avantage fiscal potentiel selon les pays (l'actionnaire qui ne vend pas ne paie pas d'impôt immédiat, contrairement à un dividende reçu), mais aussi des critiques : certains y voient un moyen d'améliorer artificiellement des indicateurs par action plutôt que d'investir dans la croissance future.",
    exemple:"Une entreprise avec 100 millions d'actions qui en rachète 5 millions ramène le total à 95 millions : le même bénéfice se répartit désormais sur moins d'actions.",
    avantages:["Flexible (pas d'engagement récurrent contrairement à un dividende), avantage fiscal potentiel pour l'actionnaire selon les pays"],
    inconvenients:["Peut être utilisé pour gonfler artificiellement le bénéfice par action plutôt que refléter une vraie création de valeur", "Réduit la trésorerie disponible pour investir ou amortir un choc"],
    erreurs:["Interpréter systématiquement un rachat d'actions comme un signe de confiance de la direction, sans regarder s'il remplace un manque d'opportunités d'investissement réelles"]
  },
  {
    terme:"Création de valeur",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Une entreprise crée de la valeur quand la rentabilité qu'elle dégage sur le capital investi dépasse durablement le coût de ce capital (WACC) — sinon, elle en détruit, même en restant comptablement bénéficiaire.",
    detail:"Une entreprise peut afficher un résultat net positif chaque année tout en détruisant de la valeur, si la rentabilité qu'elle dégage sur les capitaux engagés (ROIC) reste inférieure à ce qu'exigent ses financeurs (WACC) — l'argent aurait alors été mieux employé ailleurs, à risque comparable.",
    avance:"C'est le principe qui sous-tend la décision d'investissement en finance d'entreprise (VAN, TRI) : un projet n'est retenu que s'il est attendu qu'il rapporte plus que son coût de financement, jamais uniquement parce qu'il est rentable en valeur absolue.",
    exemple:"Une entreprise avec un ROIC de 6% et un WACC de 9% détruit de la valeur à chaque euro supplémentaire investi dans son activité actuelle, même si son résultat net reste positif.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre « rentable » (résultat net positif) et « créateur de valeur » (rentabilité supérieure au coût du capital) — les deux ne sont pas synonymes"]
  },
  {
    terme:"Amortissement",
    categorie:"Entreprise",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"L'amortissement, c'est le fait d'étaler comptablement le coût d'un bien durable (machine, bâtiment...) sur sa durée de vie estimée, plutôt que de le passer en charge d'un seul coup.",
    detail:"Une entreprise qui achète une machine à 100 000 € utilisable pendant 10 ans peut l'amortir à raison de 10 000 € de charge par an, reflétant mieux l'usure progressive du bien dans ses comptes.",
    avance:"L'amortissement réduit le résultat comptable sans être une sortie de trésorerie réelle l'année où il est constaté — c'est une des raisons pour lesquelles les analystes financiers regardent aussi des indicateurs comme l'EBITDA, calculé avant amortissements.",
    exemple:"Une machine de 100 000 € amortie sur 10 ans génère une charge comptable de 10 000 € par an, même si elle a été payée en une fois.",
    avantages:["Reflète plus fidèlement l'usure d'un actif dans le temps"],
    inconvenients:["Peut compliquer la lecture des comptes pour un non-initié"],
    erreurs:["Confondre charge d'amortissement et sortie de trésorerie réelle"]
  },
  {
    terme:"Startup",
    categorie:"Entreprise",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Une startup est une jeune entreprise, généralement technologique, qui cherche un modèle économique reproductible et à forte croissance.",
    detail:"Contrairement à une PME classique, une startup opère souvent dans l'incertitude, teste rapidement plusieurs versions de son produit et vise une croissance rapide, quitte à ne pas être rentable pendant ses premières années.",
    avance:"La majorité des startups échouent avant d'atteindre la rentabilité — les investisseurs en capital-risque misent sur le fait qu'un petit nombre de réussites majeures compensera les nombreux échecs du portefeuille.",
    exemple:"Une startup qui lève des fonds pour développer une application avant même d'avoir des revenus significatifs cherche encore son modèle économique.",
    avantages:["Flexibilité et rapidité pour tester de nouvelles idées"],
    inconvenients:["Taux d'échec élevé", "Rentabilité souvent différée de plusieurs années"],
    erreurs:["Considérer toute jeune entreprise comme une startup, même sans ambition de forte croissance"]
  },
  {
    terme:"Levée de fonds",
    categorie:"Entreprise",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Une levée de fonds, c'est le fait pour une entreprise de faire entrer de nouveaux investisseurs à son capital en échange d'argent, pour financer sa croissance.",
    detail:"En échange de leur investissement, les investisseurs reçoivent des parts (actions) de l'entreprise. Cela dilue la part des actionnaires existants, mais apporte des capitaux sans créer de dette à rembourser.",
    avance:"Les levées de fonds successives (série A, B, C...) valorisent en général l'entreprise à un niveau croissant si elle atteint ses objectifs, mais une « down round » (levée à valorisation inférieure à la précédente) peut aussi survenir en cas de difficultés.",
    exemple:"Une startup qui lève 5 millions d'euros en échange de 20% de son capital est valorisée 25 millions d'euros après l'opération.",
    avantages:["Apporte des capitaux sans dette à rembourser"],
    inconvenients:["Dilue la part de propriété des actionnaires existants", "Peut imposer une pression de croissance de la part des investisseurs"],
    erreurs:["Confondre valorisation d'une levée de fonds et valeur réelle/liquide de l'entreprise"]
  },
  {
    terme:"Business plan",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Un business plan est un document qui décrit un projet d'entreprise : ce qu'il propose, à qui, comment il gagnera de l'argent et de quels moyens il a besoin pour démarrer.",
    detail:"Il regroupe généralement une présentation du projet, une étude de marché, la stratégie commerciale, l'organisation prévue et des prévisions financières sur plusieurs années. Il sert à la fois d'outil de réflexion pour le porteur de projet et de support pour convaincre des partenaires (banques, investisseurs).",
    avance:"Un bon business plan n'est jamais figé : il évolue avec les premiers retours du marché. Les investisseurs expérimentés jugent souvent autant la qualité du raisonnement et la connaissance du marché que l'exactitude des chiffres eux-mêmes, qui restent par nature incertains.",
    exemple:"Avant d'ouvrir un café, rédiger un business plan permet de vérifier si le loyer, les charges et le chiffre d'affaires attendu laissent une marge viable, avant d'investir le moindre euro.",
    avantages:["Force à clarifier son projet et ses hypothèses avant d'investir", "Outil de communication avec les banques et investisseurs"],
    inconvenients:["Les prévisions financières restent des estimations, jamais des certitudes"],
    erreurs:["Présenter des prévisions optimistes sans les justifier", "Considérer le business plan comme figé une fois rédigé"]
  },
  {
    terme:"Executive summary",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"1 min",
    simple:"L'executive summary est le résumé d'une à deux pages placé au début d'un business plan, qui donne l'essentiel du projet à un lecteur pressé.",
    detail:"Il reprend en condensé le problème adressé, la solution proposée, le marché visé, le modèle économique et les besoins de financement. C'est souvent la seule partie qu'un investisseur lira en détail avant de décider de creuser ou non.",
    avance:"Un executive summary efficace se rédige en dernier, une fois le reste du business plan terminé, pour en extraire fidèlement les points clés — et non l'inverse.",
    exemple:"Un investisseur qui reçoit des dizaines de dossiers par semaine décide souvent, en lisant seulement l'executive summary, s'il veut en savoir plus.",
    avantages:["Permet de capter l'attention rapidement"],
    inconvenients:[],
    erreurs:["Le rédiger avant le reste du document, au risque qu'il ne reflète pas fidèlement le projet final"]
  },
  {
    terme:"Étude de marché",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Une étude de marché consiste à analyser un secteur, ses clients potentiels et ses concurrents avant de lancer une activité.",
    detail:"Elle combine généralement des données existantes (statistiques sectorielles, études publiées) et des données collectées directement (entretiens, sondages) pour évaluer la taille du marché, les besoins non satisfaits et le positionnement des concurrents.",
    avance:"Une étude de marché rigoureuse distingue les données déclaratives (ce que les gens disent qu'ils feraient) des données comportementales (ce qu'ils font réellement) — les secondes sont généralement plus fiables pour valider une idée.",
    exemple:"Avant de lancer une nouvelle marque de vêtements, interroger 50 clients potentiels sur leurs habitudes d'achat actuelles renseigne mieux qu'une simple intuition.",
    avantages:["Réduit le risque de lancer un produit sans demande réelle"],
    inconvenients:["Ne garantit jamais le succès, le marché peut évoluer après l'étude"],
    erreurs:["Se fier uniquement à ce que les gens déclarent vouloir, sans vérifier leur comportement réel"]
  },
  {
    terme:"Proposition de valeur",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"La proposition de valeur est la réponse à la question : pourquoi un client choisirait-il ce produit ou service plutôt qu'un autre ?",
    detail:"Elle formule clairement le bénéfice concret apporté au client (gain de temps, d'argent, de confort...) et ce qui différencie l'offre de celles des concurrents. Une proposition de valeur floue rend toute stratégie commerciale plus difficile.",
    avance:"Une proposition de valeur solide se construit à partir d'un problème réel et suffisamment douloureux pour le client — pas seulement d'une fonctionnalité que l'entreprise trouve intéressante à développer.",
    exemple:"\"Recevez vos courses en 15 minutes\" est une proposition de valeur claire, centrée sur le bénéfice (rapidité) plutôt que sur la technique utilisée pour l'obtenir.",
    avantages:["Clarifie le message commercial et facilite les décisions produit"],
    inconvenients:[],
    erreurs:["Décrire les fonctionnalités du produit plutôt que le bénéfice réel pour le client"]
  },
  {
    terme:"Modèle économique",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le modèle économique décrit comment une entreprise crée de la valeur pour ses clients et comment elle transforme cette valeur en revenus.",
    detail:"Il répond à des questions comme : qui sont les clients, que leur vend-on, comment (abonnement, vente à l'unité, commission...), et à quel coût de production ou de fonctionnement. Deux entreprises avec le même produit peuvent avoir des modèles économiques très différents.",
    avance:"Le choix du modèle économique influence fortement la trésorerie et la croissance : un modèle par abonnement génère des revenus récurrents mais souvent plus lents à démarrer qu'une vente ponctuelle à prix plus élevé.",
    exemple:"Un même logiciel peut être vendu sous forme de licence unique, d'abonnement mensuel, ou financé par la publicité — trois modèles économiques différents pour un produit similaire.",
    avantages:[],
    inconvenients:[],
    erreurs:["Copier le modèle économique d'un concurrent sans vérifier qu'il est adapté à son propre produit et à ses coûts"]
  },
  {
    terme:"B2B et B2C",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"1 min",
    simple:"B2B (business to business) désigne une entreprise qui vend à d'autres entreprises ; B2C (business to consumer) désigne une entreprise qui vend directement aux particuliers.",
    detail:"Ces deux modes de vente impliquent des cycles de décision, des volumes et des stratégies marketing très différents : le B2B implique souvent moins de clients mais des montants plus élevés et des décisions plus longues, le B2C davantage de clients avec des achats plus rapides.",
    avance:"Certaines entreprises combinent les deux (on parle parfois de B2B2C, quand une entreprise vend à d'autres entreprises qui elles-mêmes revendent au consommateur final), ce qui complique l'attribution du chiffre d'affaires et la stratégie commerciale.",
    exemple:"Un fabricant de logiciels de comptabilité vendu aux entreprises fait du B2B ; une marque de vêtements vendue en ligne aux particuliers fait du B2C.",
    avantages:[],
    inconvenients:[],
    erreurs:["Appliquer une stratégie marketing pensée pour le B2C à une clientèle B2B, aux cycles de décision très différents"]
  },
  {
    terme:"SaaS",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le SaaS (Software as a Service) désigne un logiciel accessible en ligne par abonnement, sans avoir à l'installer sur son ordinateur.",
    detail:"L'éditeur héberge, met à jour et maintient le logiciel ; les clients paient généralement un abonnement mensuel ou annuel plutôt qu'une licence unique. Ce modèle génère des revenus récurrents et plus prévisibles pour l'entreprise éditrice.",
    avance:"Les entreprises SaaS suivent de près des indicateurs comme le churn (taux de résiliation) et le revenu mensuel récurrent, car leur valeur dépend largement de leur capacité à conserver leurs abonnés dans la durée, pas seulement à en acquérir de nouveaux.",
    exemple:"Un logiciel de gestion de projet accessible via un navigateur, facturé 15€ par utilisateur et par mois, est un produit SaaS typique.",
    avantages:["Revenus récurrents et plus prévisibles pour l'entreprise", "Mises à jour centralisées sans action du client"],
    inconvenients:["Dépendance du client à la disponibilité du service en ligne"],
    erreurs:["Ne suivre que le nombre de nouveaux abonnés sans surveiller le taux de résiliation"]
  },
  {
    terme:"Marketplace",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Une marketplace est une plateforme qui met en relation des vendeurs et des acheteurs, sans être elle-même propriétaire des produits vendus.",
    detail:"La plateforme se rémunère généralement via une commission sur chaque transaction plutôt qu'en vendant directement. Son défi principal est d'attirer simultanément suffisamment de vendeurs et d'acheteurs pour que l'offre et la demande s'équilibrent.",
    avance:"Les marketplaces sont soumises à un effet de réseau : plus il y a de vendeurs, plus la plateforme attire d'acheteurs, et inversement — ce qui explique pourquoi la phase de démarrage, attirer les deux côtés à la fois, est souvent la plus difficile.",
    exemple:"Une plateforme qui met en relation des particuliers louant leur logement avec des voyageurs, en prélevant une commission sur chaque réservation, fonctionne comme une marketplace.",
    avantages:["Pas besoin de posséder de stock pour générer des revenus"],
    inconvenients:["Dépend de l'équilibre entre offre et demande, difficile à amorcer"],
    erreurs:["Se concentrer uniquement sur l'acquisition d'acheteurs sans sécuriser assez de vendeurs, ou inversement"]
  },
  {
    terme:"Business Model",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le business model (modèle économique) décrit comment une entreprise crée de la valeur pour ses clients et transforme cette valeur en revenus.",
    detail:"Il répond à des questions concrètes : qui paie, pour quoi, à quelle fréquence, et quels sont les principaux coûts pour délivrer cette offre. Deux entreprises qui vendent le même type de produit peuvent avoir des business models très différents (vente à l'unité contre abonnement, par exemple).",
    avance:"Un même projet peut souvent fonctionner avec plusieurs business models différents (vente directe, abonnement, commission...) — le choix n'est presque jamais évident à l'avance et dépend du budget disponible, du comportement d'achat du client et de la fréquence du besoin.",
    exemple:"Un même logiciel de gestion peut être vendu en licence unique payée une fois, ou en abonnement mensuel : deux business models différents pour un produit proche.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre le business model (comment on gagne de l'argent) avec le business plan (le document qui décrit l'ensemble du projet)"]
  },
  {
    terme:"Business Plan",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Un business plan est un document qui structure un projet d'entreprise : le problème résolu, le client visé, l'offre, le modèle économique, les chiffres prévisionnels et les risques identifiés.",
    detail:"Il sert à la fois d'outil de réflexion pour le porteur de projet et de support de présentation à des partenaires (banque, investisseurs). Ses prévisions financières restent des hypothèses, jamais une garantie de résultat.",
    avance:"Un business plan trop figé perd rapidement de sa valeur : les hypothèses de départ (prix, coûts, rythme d'acquisition) doivent être révisées au fur et à mesure que le projet rencontre de vraies données du marché.",
    exemple:"Avant de chercher un financement, un porteur de projet rédige un business plan détaillant son marché, son offre, ses coûts et ses ventes visées sur les 3 premières années.",
    avantages:["Force à clarifier des hypothèses qui restent souvent implicites"],
    inconvenients:["Des prévisions à plusieurs années sont rarement exactes, surtout pour un projet qui n'a pas encore de données réelles"],
    erreurs:["Présenter des prévisions financières comme des certitudes plutôt que comme des hypothèses"]
  },
  {
    terme:"TAM/SAM/SOM",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"TAM/SAM/SOM sont trois niveaux pour estimer la taille d'un marché : TAM (marché total théorique), SAM (la part réellement accessible avec l'offre actuelle), SOM (la part réaliste à capter dans un horizon proche).",
    detail:"Le TAM (Total Addressable Market) représente l'ensemble du marché si l'entreprise n'avait aucune limite. Le SAM (Serviceable Available Market) restreint ce chiffre à ce que l'offre et la zone de distribution actuelles permettent réellement d'atteindre. Le SOM (Serviceable Obtainable Market) restreint encore à la part réaliste à capter face à la concurrence et aux ressources disponibles.",
    avance:"Le TAM est souvent le chiffre le plus mis en avant car le plus impressionnant, mais aussi le moins utile pour juger un projet concret : le SOM, beaucoup plus modeste, est généralement le chiffre le plus informatif pour évaluer une opportunité réelle à court terme.",
    exemple:"Pour un logiciel de comptabilité pour indépendants en France, le TAM pourrait être l'ensemble des indépendants dans le monde, le SAM les indépendants francophones, et le SOM la part réaliste que l'entreprise peut capter dans ses 2 premières années compte tenu de ses ressources.",
    avantages:[],
    inconvenients:["Une estimation de marché reste une hypothèse, pas une donnée mesurée : à ne jamais présenter comme un fait établi sans source fiable"],
    erreurs:["Mettre en avant un TAM très large pour donner l'impression d'une opportunité énorme, sans jamais estimer le SOM réellement atteignable"]
  },
  {
    terme:"Positionnement",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le positionnement est la place qu'une offre occupe dans l'esprit du client, par rapport aux alternatives existantes — sur quels critères elle se différencie (prix, qualité, spécialisation, expérience...).",
    detail:"Deux entreprises peuvent vendre un produit similaire tout en étant positionnées très différemment : l'une sur le prix le plus bas, l'autre sur la qualité premium, une troisième sur une niche très spécifique. Le positionnement guide ensuite les décisions de prix, de communication et de distribution.",
    avance:"Un positionnement n'est jamais figé : il peut évoluer si le marché change ou si l'entreprise constate que son positionnement initial ne correspond pas à la façon dont les clients la perçoivent réellement.",
    exemple:"Sur un même marché de vêtements, une marque peut se positionner sur le prix le plus bas, une autre sur la fabrication locale, une troisième sur un style très spécifique — trois positionnements différents sur le même marché.",
    avantages:["Un positionnement clair facilite les décisions de prix et de communication"],
    inconvenients:["Un positionnement trop vague ('bon rapport qualité-prix pour tous') ne différencie de rien de particulier"],
    erreurs:["Vouloir plaire à tout le monde plutôt que choisir un positionnement clair, quitte à ne pas convenir à certains clients"]
  },
  {
    terme:"Avantage concurrentiel",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Un avantage concurrentiel est un élément qui permet à une entreprise de mieux résister à la concurrence que ses rivales, de façon durable — pas seulement un atout ponctuel facile à copier.",
    detail:"Un avantage concurrentiel réel doit être difficile à reproduire rapidement : une marque forte, un effet de réseau, un coût de production structurellement plus bas, une technologie protégée, ou des données/relations accumulées avec le temps. Un simple prix bas temporaire n'en est généralement pas un, car un concurrent peut le copier du jour au lendemain.",
    avance:"Un avantage concurrentiel peut s'éroder avec le temps si l'entreprise ne l'entretient pas — une technologie finit par être rattrapée, une marque peut perdre en pertinence si le marché évolue.",
    exemple:"Une entreprise qui a accumulé des années de données clients difficiles à reconstituer pour un nouvel entrant dispose potentiellement d'un avantage concurrentiel plus durable qu'une simple promotion de prix.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre un avantage concurrentiel réel (durable, difficile à copier) avec un simple atout temporaire (facilement imitable par un concurrent)"]
  },
  {
    terme:"Barrières à l'entrée",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Les barrières à l'entrée sont les obstacles qui rendent difficile, pour une nouvelle entreprise, d'entrer sur un marché et de concurrencer les acteurs déjà en place.",
    detail:"Elles peuvent prendre plusieurs formes : investissement initial élevé, réglementation stricte, brevets, économies d'échelle des acteurs en place, fidélité de marque déjà installée, ou effet de réseau déjà constitué. Plus les barrières sont hautes, plus un marché reste protégé de nouveaux entrants, ce qui peut favoriser les entreprises déjà installées.",
    avance:"Des barrières à l'entrée élevées protègent les acteurs en place, mais peuvent aussi ralentir l'innovation sur ce marché — l'absence de nouvelle concurrence réduit la pression à s'améliorer.",
    exemple:"La construction d'un réseau de distribution physique dans tout un pays représente une barrière à l'entrée réelle pour un nouvel acteur qui voudrait concurrencer une chaîne déjà établie.",
    avantages:[],
    inconvenients:[],
    erreurs:["Sous-estimer les barrières à l'entrée d'un marché avant de s'y lancer, ou au contraire les surestimer et renoncer à un marché en réalité accessible"]
  },
  {
    terme:"Économies d'échelle",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Les économies d'échelle désignent la baisse du coût unitaire de production à mesure que le volume produit ou vendu augmente.",
    detail:"Elles viennent notamment de la répartition des coûts fixes (un même local, une même équipe) sur un plus grand nombre d'unités vendues, ou d'un meilleur pouvoir de négociation avec les fournisseurs à mesure que les volumes commandés augmentent.",
    avance:"Les économies d'échelle ne sont pas illimitées : au-delà d'une certaine taille, la complexité de gestion peut au contraire faire remonter les coûts unitaires (déséconomies d'échelle) — coordination plus lourde, structure plus complexe.",
    exemple:"Une usine qui produit 100 000 unités répartit ses coûts fixes (bâtiment, machines) sur un bien plus grand nombre de produits qu'une usine qui n'en produit que 1 000 — son coût unitaire de production est donc plus faible.",
    avantages:["Permet de baisser les prix ou d'augmenter les marges à mesure que l'activité grandit"],
    inconvenients:["Nécessite souvent un investissement initial important pour atteindre une taille suffisante"],
    erreurs:[]
  },
  {
    terme:"Effet réseau",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Il y a effet de réseau quand la valeur d'un produit ou service augmente avec le nombre de personnes qui l'utilisent déjà.",
    detail:"C'est particulièrement vrai pour les plateformes qui mettent en relation plusieurs utilisateurs (marketplaces, réseaux sociaux, messageries) : plus il y a d'utilisateurs d'un côté, plus la plateforme devient attractive pour l'autre côté, ce qui peut créer une dynamique de croissance auto-entretenue une fois une masse critique atteinte.",
    avance:"L'effet de réseau rend le démarrage particulièrement difficile (« problème de l'œuf et de la poule » : sans utilisateurs, pas d'attractivité ; sans attractivité, pas d'utilisateurs) mais, une fois la masse critique atteinte, il peut devenir un avantage concurrentiel très difficile à copier pour un nouvel entrant.",
    exemple:"Une messagerie est plus utile si la plupart de ses contacts l'utilisent déjà — c'est un effet de réseau qui explique pourquoi ce type de service tend à se concentrer autour de quelques acteurs dominants.",
    avantages:["Peut créer un avantage concurrentiel très difficile à copier une fois la masse critique atteinte"],
    inconvenients:["Rend le démarrage particulièrement difficile, avant d'avoir atteint cette masse critique"],
    erreurs:[]
  },
  {
    terme:"Cash flow",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le cash flow (flux de trésorerie) mesure l'argent qui entre et sort réellement des comptes de l'entreprise sur une période, contrairement au bénéfice comptable qui peut inclure des éléments non encore encaissés ou décaissés.",
    detail:"Une entreprise peut être rentable sur le papier (bénéfice comptable positif) tout en manquant de trésorerie si ses clients paient en retard ou si elle doit financer un stock important avant de vendre — c'est pour cela que le cash flow est suivi séparément du résultat comptable.",
    avance:"C'est une cause fréquente de difficulté, y compris pour des entreprises en croissance : une croissance rapide peut elle-même consommer beaucoup de trésorerie (stocks, recrutements, délais de paiement clients) avant que les bénéfices ne se matérialisent en cash disponible.",
    exemple:"Une entreprise qui facture ses clients à 60 jours mais doit payer ses fournisseurs à 30 jours peut afficher un bénéfice comptable positif tout en ayant un besoin réel de trésorerie pour tenir ce décalage.",
    avantages:[],
    inconvenients:[],
    erreurs:["Se fier uniquement au bénéfice comptable sans surveiller la trésorerie réellement disponible"]
  },
  {
    terme:"Point mort",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le point mort (ou seuil de rentabilité) est le niveau de chiffre d'affaires ou de ventes à partir duquel une entreprise couvre exactement l'ensemble de ses charges, sans encore faire de bénéfice ni de perte.",
    detail:"Il se calcule en divisant les charges fixes par la marge dégagée sur chaque vente (prix de vente moins coût variable). En dessous de ce seuil, l'entreprise est en perte ; au-dessus, chaque vente supplémentaire contribue au bénéfice.",
    avance:"Le point mort suppose des charges fixes et une marge par vente stables — en réalité, les charges fixes évoluent souvent par paliers (embaucher augmente brutalement les charges fixes), ce qui déplace le seuil réel à chaque changement structurel.",
    exemple:"Avec 3 000€ de charges fixes mensuelles et une marge de 20€ par vente, il faut 150 ventes par mois pour atteindre le point mort.",
    avantages:["Donne un objectif concret et atteignable à suivre, plutôt qu'un simple espoir de rentabilité"],
    inconvenients:["Un calcul simplifié qui ne tient pas compte de la saisonnalité ni de l'évolution des charges dans le temps"],
    erreurs:["Calculer un point mort une seule fois au lancement et ne jamais le recalculer alors que les charges ou les prix ont changé"]
  },
  {
    terme:"Freemium",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le freemium est un modèle économique où une version gratuite (souvent limitée) est proposée à tous, tandis qu'une version payante débloque des fonctionnalités supplémentaires ou un usage sans limite.",
    detail:"L'objectif est d'attirer un très grand nombre d'utilisateurs via la version gratuite, puis d'en convertir une partie en clients payants. Ce modèle fonctionne surtout pour des produits numériques, où le coût de servir un utilisateur supplémentaire gratuit reste très faible une fois le produit développé.",
    avance:"L'équilibre est délicat : une version gratuite trop généreuse réduit l'incitation à payer, une version gratuite trop limitée n'attire pas assez d'utilisateurs pour construire une base large — le taux de conversion des utilisateurs gratuits vers le payant est l'indicateur clé à suivre.",
    exemple:"Une application propose ses fonctionnalités de base gratuitement, mais facture un abonnement pour retirer la publicité ou débloquer des fonctionnalités avancées.",
    avantages:["Permet d'attirer un grand nombre d'utilisateurs sans barrière à l'essai"],
    inconvenients:["La grande majorité des utilisateurs gratuits ne deviennent jamais payants : le modèle ne fonctionne qu'à grande échelle"],
    erreurs:["Lancer un freemium sans avoir réfléchi à ce qui doit rester gratuit et à ce qui doit inciter à payer"]
  },
  {
    terme:"Analyse de marché",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"L'analyse de marché consiste à étudier la taille d'un marché, ses acteurs, ses tendances et ses clients avant de s'y positionner.",
    detail:"Elle combine généralement plusieurs éléments : qui sont les clients potentiels et que recherchent-ils, qui sont les concurrents déjà en place, quelles sont les tendances qui font croître ou reculer ce marché, et quelles contraintes (réglementation, technologie) le structurent.",
    avance:"Une analyse de marché reste une photographie à un instant donné, fondée sur les informations disponibles — elle ne prédit pas l'avenir et doit être mise à jour à mesure que le marché évolue.",
    exemple:"Avant de lancer un service de livraison de repas, étudier combien de concurrents existent déjà, quels prix ils pratiquent et si la demande locale semble suffisante fait partie d'une analyse de marché.",
    avantages:["Réduit le risque de se lancer sur un marché déjà saturé ou trop petit"],
    inconvenients:["Prend du temps et des ressources, sans garantir que la réalité confirmera l'analyse"],
    erreurs:["Confondre une analyse de marché réelle (données, concurrents observés) avec une simple intuition non vérifiée"]
  },
  {
    terme:"Stratégie de prix",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La stratégie de prix est la façon dont une entreprise fixe ses prix pour atteindre ses objectifs (volume, marge, positionnement) plutôt que de choisir un chiffre au hasard.",
    detail:"Plusieurs approches existent : prix bas pour maximiser le volume, prix élevé pour renforcer un positionnement premium, prix aligné sur la concurrence, ou prix basé sur la valeur perçue par le client plutôt que sur le coût de production seul.",
    avance:"Le prix envoie aussi un signal : un prix trop bas peut faire douter de la qualité perçue, un prix trop élevé sans justification perceptible peut décourager l'achat — le prix communique autant qu'il facture.",
    exemple:"Une marque premium peut délibérément fixer un prix plus élevé que ses coûts ne l'exigeraient, pour renforcer une image de qualité supérieure.",
    avantages:[],
    inconvenients:[],
    erreurs:["Fixer un prix uniquement à partir des coûts, sans tenir compte de ce que le client est réellement prêt à payer"]
  },
  {
    terme:"Intégration verticale",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"L'intégration verticale consiste, pour une entreprise, à internaliser une étape de sa chaîne de production ou de distribution qu'elle confiait auparavant à un fournisseur ou partenaire externe.",
    detail:"Elle peut être en amont (racheter un fournisseur de matière première) ou en aval (ouvrir ses propres points de vente plutôt que de passer par des distributeurs). L'objectif est souvent de mieux contrôler la qualité, les coûts ou les délais, au prix d'un investissement et d'une complexité de gestion accrus.",
    avance:"L'intégration verticale immobilise du capital et de l'attention sur des activités parfois éloignées du cœur de métier — un fournisseur externe spécialisé peut rester plus efficace sur son propre segment qu'une internalisation improvisée.",
    exemple:"Une marque de vêtements qui rachète l'une de ses usines de confection plutôt que de continuer à la sous-traiter réalise une intégration verticale en amont.",
    avantages:["Meilleur contrôle de la qualité, des coûts ou des délais sur l'étape internalisée"],
    inconvenients:["Immobilise du capital et complexifie la gestion, sur une activité parfois hors du cœur de métier"],
    erreurs:["Intégrer verticalement une activité sans être certain de pouvoir la gérer aussi efficacement qu'un fournisseur spécialisé"]
  },
  {
    terme:"Croissance",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"La croissance d'une entreprise désigne l'augmentation de son chiffre d'affaires, de sa clientèle ou de sa taille dans le temps.",
    detail:"Elle peut venir de plusieurs leviers : vendre plus aux clients existants, en acquérir de nouveaux, élargir la gamme de produits, ou s'étendre vers de nouvelles zones géographiques. Une croissance rapide n'est pas automatiquement saine si elle n'est pas accompagnée d'une rentabilité ou d'une trésorerie suffisante pour la soutenir.",
    avance:"Une entreprise peut croître en chiffre d'affaires tout en perdant de l'argent si ses coûts croissent plus vite que ses revenus — la croissance seule ne garantit ni la rentabilité ni la pérennité.",
    exemple:"Une entreprise qui ouvre 10 nouveaux points de vente en un an connaît une forte croissance, mais doit aussi financer ces ouvertures avant qu'elles ne deviennent rentables.",
    avantages:["Peut renforcer la position face à la concurrence et attirer davantage de financement"],
    inconvenients:["Une croissance non maîtrisée peut mettre en danger la trésorerie et la qualité de service"],
    erreurs:["Confondre croissance du chiffre d'affaires et croissance de la rentabilité — ce sont deux choses différentes"]
  },
  {
    terme:"Rentabilité",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La rentabilité mesure si une activité dégage plus d'argent qu'elle n'en consomme, une fois toutes ses charges payées.",
    detail:"Elle peut se lire à plusieurs niveaux : rentabilité d'une vente (marge), rentabilité de l'activité entière (résultat net) ou rentabilité d'un investissement (retour rapporté au capital engagé). Une entreprise peut avoir beaucoup de chiffre d'affaires et rester peu rentable si ses charges augmentent au même rythme.",
    avance:"La rentabilité et la trésorerie ne sont pas la même chose : une entreprise rentable sur le papier peut manquer d'argent disponible si ses clients paient en retard ou si elle doit financer beaucoup de stock à l'avance.",
    exemple:"Une entreprise qui vend pour 100 000€ et qui dépense 95 000€ pour y arriver est rentable, mais avec une marge très faible — un choc imprévu peut suffire à la faire basculer dans la perte.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre chiffre d'affaires élevé et rentabilité — les deux sont indépendants l'un de l'autre"]
  },
  {
    terme:"Dette",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La dette d'une entreprise est l'ensemble des sommes qu'elle doit rembourser à des tiers (banques, obligataires, fournisseurs) à une échéance donnée.",
    detail:"S'endetter permet de financer une croissance ou un investissement sans attendre d'avoir tout l'argent nécessaire, mais impose de rembourser capital et intérêts, quoi qu'il arrive à l'activité entre-temps. Une dette raisonnable est un outil ; une dette excessive devient une contrainte qui limite les décisions futures.",
    avance:"Le niveau de dette « acceptable » dépend fortement du secteur et de la stabilité des revenus : une entreprise aux revenus très prévisibles peut porter plus de dette qu'une entreprise aux revenus irréguliers, pour un même risque perçu.",
    exemple:"Une entreprise qui emprunte pour financer l'ouverture de nouveaux magasins doit rembourser ce prêt même si ces magasins mettent plus de temps que prévu à devenir rentables.",
    avantages:["Permet de financer un projet sans attendre d'avoir tout le capital nécessaire"],
    inconvenients:["Impose des remboursements fixes, indépendants de la performance réelle de l'activité"],
    erreurs:["S'endetter en pariant uniquement sur un scénario optimiste, sans marge de sécurité si les revenus arrivent plus lentement que prévu"]
  },
  {
    terme:"Dilution",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"La dilution se produit quand une entreprise émet de nouvelles actions (souvent lors d'une levée de fonds), ce qui réduit le pourcentage de l'entreprise détenu par chaque actionnaire déjà présent.",
    detail:"Un fondateur qui possède 100% de son entreprise au départ peut se retrouver à en détenir beaucoup moins après plusieurs levées de fonds successives, même si la valeur totale de l'entreprise a augmenté entre-temps — sa part en pourcentage diminue, mais pas nécessairement sa valeur en argent.",
    avance:"La dilution n'est pas automatiquement négative : détenir un pourcentage plus petit d'une entreprise beaucoup plus grande peut représenter, en valeur, bien plus qu'un pourcentage plus élevé d'une entreprise restée petite faute de financement.",
    exemple:"Un fondateur qui détient 100% d'une entreprise valorisée 1M€ possède, en valeur, moins qu'un fondateur qui détient 20% d'une entreprise valorisée 50M€ après plusieurs levées de fonds.",
    avantages:[],
    inconvenients:[],
    erreurs:["Refuser toute dilution par principe, même quand le financement obtenu permettrait une croissance qui bénéficierait à tous les actionnaires"]
  },
  {
    terme:"Prospection",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"La prospection consiste à identifier et contacter des clients potentiels qui ne connaissent pas encore l'entreprise, pour tenter d'engager une relation commerciale.",
    detail:"Elle peut être active (appels, emails, démarchage) ou passive (le prospect vient de lui-même, via du contenu ou une recommandation). Une prospection efficace cible des personnes qui ont vraiment le problème que l'offre résout, plutôt que de contacter au hasard.",
    avance:"Le taux de réponse à une prospection dépend fortement de sa personnalisation : un message générique envoyé à des centaines de contacts convertit presque toujours moins bien qu'un message ciblé sur un besoin identifié.",
    exemple:"Contacter directement des entreprises qui utilisent déjà un outil concurrent connu pour ses limites est une forme de prospection ciblée.",
    avantages:["Permet de créer des opportunités sans attendre que les clients viennent d'eux-mêmes"],
    inconvenients:["Prend du temps et peut être perçue négativement si elle n'est pas ciblée ou personnalisée"],
    erreurs:["Prospecter au hasard sans avoir vérifié que la personne contactée correspond vraiment au client visé"]
  },
  {
    terme:"Pipeline commercial",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le pipeline commercial représente l'ensemble des prospects et clients potentiels, classés selon leur avancement dans le processus d'achat (premier contact, qualifié, négociation, signé...).",
    detail:"Suivre un pipeline permet de savoir combien d'opportunités sont à chaque étape, et d'anticiper le chiffre d'affaires à venir plutôt que de le découvrir après coup. Un pipeline qui se vide en fin de parcours (beaucoup de premiers contacts, peu de ventes signées) signale un problème à une étape précise.",
    avance:"Un pipeline très rempli au début ne garantit rien si le taux de conversion entre les étapes reste faible — la santé du pipeline se lit à son évolution d'une étape à l'autre, pas à son volume initial.",
    exemple:"Une entreprise qui suit son pipeline peut repérer que beaucoup de prospects qualifiés n'avancent jamais vers la négociation, et chercher pourquoi précisément à cette étape.",
    avantages:["Rend visible où se bloquent réellement les ventes, étape par étape"],
    inconvenients:["Demande une vraie discipline de suivi pour rester à jour et fiable"],
    erreurs:["Se concentrer uniquement sur le nombre total d'opportunités, sans regarder à quelle étape elles stagnent"]
  },
  {
    terme:"Qualification",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Qualifier un prospect consiste à vérifier qu'il correspond vraiment au client visé (besoin réel, budget, pouvoir de décision) avant d'investir du temps commercial dessus.",
    detail:"Un prospect mal qualifié fait perdre du temps à l'entreprise et au prospect lui-même : s'il n'a ni le besoin, ni le budget, ni le pouvoir de décider, aucune négociation ne débouchera sur une vente, quelle que soit la qualité de l'argumentaire.",
    avance:"La qualification distingue souvent utilisateur, décideur et payeur (surtout en B2B) — parler longuement à quelqu'un qui utilisera le produit mais ne décide ni ne paie peut faire perdre un temps précieux sans jamais aboutir.",
    exemple:"Avant de présenter une offre complète, demander le budget disponible et qui décide finalement de l'achat permet d'éviter de construire une proposition pour quelqu'un qui n'a pas le pouvoir de l'accepter.",
    avantages:["Concentre le temps commercial sur les prospects qui ont réellement une chance d'acheter"],
    inconvenients:["Une qualification trop stricte peut écarter des prospects qui auraient fini par convertir"],
    erreurs:["Passer beaucoup de temps sur un prospect sans jamais avoir vérifié qu'il a le budget et le pouvoir de décider"]
  },
  {
    terme:"Négociation",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La négociation est l'échange entre vendeur et acheteur pour arriver à un accord sur les conditions de la vente (prix, délais, périmètre) qui convienne aux deux parties.",
    detail:"Une négociation efficace cherche à comprendre ce qui compte vraiment pour l'autre partie (pas seulement le prix) : délai, garanties, accompagnement. Céder uniquement sur le prix, sans explorer d'autres leviers, réduit souvent la marge sans répondre au vrai frein de l'acheteur.",
    avance:"Une concession accordée sans contrepartie envoie un signal : si le prix baisse facilement une fois, l'acheteur peut légitimement s'attendre à ce qu'il baisse encore — chaque concession gagne à être échangée contre quelque chose (délai, volume, engagement).",
    exemple:"Face à une demande de baisse de prix, proposer un engagement sur une durée plus longue en échange peut satisfaire l'acheteur sans détruire la marge.",
    avantages:[],
    inconvenients:[],
    erreurs:["Céder sur le prix dès la première objection, sans avoir cherché à comprendre ce qui motive vraiment la demande"]
  },
  {
    terme:"Closing",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le closing est le moment où un prospect prend sa décision finale et signe, après avoir été qualifié, avoir vu l'offre et négocié les conditions.",
    detail:"Un closing réussi n'est presque jamais un moment isolé : il est la conséquence logique d'une qualification sérieuse, d'une offre adaptée et d'objections réellement traitées en amont. Chercher à \"closer\" trop tôt, avant d'avoir levé les vraies réticences, aboutit rarement.",
    avance:"Un prospect qui hésite encore au moment du closing signale souvent une objection non résolue plus tôt dans le processus — revenir sur cette objection est en général plus efficace que d'insister sur la décision elle-même.",
    exemple:"Proposer une date de démarrage concrète, plutôt que de demander vaguement \"est-ce que ça vous va ?\", aide à transformer un accord de principe en décision réelle.",
    avantages:[],
    inconvenients:[],
    erreurs:["Considérer le closing comme une technique isolée, alors qu'il dépend surtout de tout ce qui a été fait avant"]
  },
  {
    terme:"MVP",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Un MVP (minimum viable product, produit minimum viable) est la version la plus simple d'un produit permettant de tester une idée auprès de vrais utilisateurs.",
    detail:"L'objectif n'est pas de livrer un produit complet mais d'apprendre rapidement, à moindre coût, si l'idée répond à un besoin réel avant d'investir davantage de temps et d'argent dans son développement.",
    avance:"Un MVP mal conçu peut aussi biaiser les résultats : trop minimaliste, il ne convainc personne même si l'idée sous-jacente est bonne ; trop abouti, il fait perdre l'intérêt de tester rapidement et à moindre coût.",
    exemple:"Avant de développer une application complète, proposer le service manuellement à quelques clients test permet de vérifier la demande sans coder quoi que ce soit.",
    avantages:["Réduit le risque de développer longuement un produit dont personne ne veut"],
    inconvenients:["Un MVP trop limité peut donner une image négative auprès des premiers utilisateurs"],
    erreurs:["Confondre MVP et produit final bâclé"]
  },
  {
    terme:"CAC",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le CAC (coût d'acquisition client) mesure combien coûte, en moyenne, l'acquisition d'un nouveau client, tous coûts marketing et commerciaux confondus.",
    detail:"Il se calcule en divisant les dépenses marketing et commerciales sur une période par le nombre de nouveaux clients acquis pendant cette même période. Un CAC élevé n'est pas problématique en soi, tant qu'il reste inférieur à ce que ce client rapportera dans le temps (voir LTV).",
    avance:"Le CAC doit toujours s'interpréter avec la LTV : un ratio LTV/CAC souvent cité comme repère sain est d'au moins 3, c'est-à-dire qu'un client rapporte idéalement au moins trois fois ce qu'il a coûté à acquérir — un repère indicatif, pas une règle universelle.",
    exemple:"Si une entreprise dépense 10 000€ en publicité sur un mois et acquiert 100 nouveaux clients, son CAC est de 100€ par client.",
    avantages:[],
    inconvenients:[],
    erreurs:["Regarder le CAC isolément, sans le comparer à la valeur générée par chaque client (LTV)"]
  },
  {
    terme:"LTV",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"La LTV (lifetime value, valeur vie client) estime le revenu total qu'un client génère pour une entreprise pendant toute la durée de sa relation avec elle.",
    detail:"Elle se calcule généralement en multipliant le revenu moyen généré par client sur une période par la durée moyenne de rétention du client. Elle permet de savoir combien il est raisonnable de dépenser pour acquérir un nouveau client (voir CAC).",
    avance:"La LTV est une estimation basée sur des comportements passés, projetée dans le futur — elle devient moins fiable pour une jeune entreprise qui manque encore de recul sur la fidélité réelle de ses clients.",
    exemple:"Un abonné qui paie 20€ par mois et reste client en moyenne 24 mois représente une LTV d'environ 480€.",
    avantages:[],
    inconvenients:["Reste une estimation, plus fiable avec plusieurs années de données historiques"],
    erreurs:["Calculer la LTV sur trop peu de données et la considérer comme une certitude"]
  },
  {
    terme:"ROI",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le ROI (retour sur investissement) mesure le gain obtenu par rapport à la somme investie, généralement exprimé en pourcentage.",
    detail:"Il se calcule en général ainsi : (gain de l'investissement − coût de l'investissement) / coût de l'investissement. Il s'applique aussi bien à une campagne marketing qu'à l'achat d'un équipement ou un projet d'entreprise dans son ensemble.",
    avance:"Un ROI positif ne suffit pas à juger un investissement isolément : il faut aussi tenir compte du délai sur lequel il est obtenu et du risque pris, deux investissements au même ROI n'étant pas comparables si l'un prend un mois et l'autre cinq ans.",
    exemple:"Une campagne publicitaire ayant coûté 1000€ et généré 1500€ de ventes supplémentaires attribuables a un ROI de 50%.",
    avantages:["Indicateur simple pour comparer différentes décisions d'investissement"],
    inconvenients:["Ne tient pas compte du délai ni du risque sans précision complémentaire"],
    erreurs:["Comparer des ROI obtenus sur des durées très différentes sans les ajuster"]
  },
  {
    terme:"Marge brute",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La marge brute est ce qu'il reste du chiffre d'affaires après avoir payé uniquement le coût direct de production ou d'achat des produits vendus.",
    detail:"Elle se calcule en soustrayant le coût des marchandises vendues (ou coût de production) du chiffre d'affaires. Contrairement à la marge nette, elle ne tient pas encore compte des autres charges (loyers, salaires administratifs, marketing...).",
    avance:"La marge brute varie énormément selon les secteurs : un éditeur de logiciel a typiquement une marge brute très élevée (le coût de reproduction d'un logiciel est quasi nul), tandis qu'un commerce de détail a des marges brutes plus faibles compte tenu du coût des marchandises.",
    exemple:"Un produit vendu 50€ dont le coût de fabrication est de 20€ génère une marge brute de 30€, soit 60% du prix de vente.",
    avantages:[],
    inconvenients:[],
    erreurs:["Confondre marge brute et bénéfice final de l'entreprise"]
  },
  {
    terme:"EBITDA",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"L'EBITDA (bénéfice avant intérêts, impôts, dépréciation et amortissement) mesure la rentabilité d'une entreprise liée uniquement à son activité opérationnelle.",
    detail:"Il exclut les décisions de financement (intérêts d'emprunts), fiscales (impôts) et comptables (amortissements), pour permettre de comparer la performance opérationnelle d'entreprises ayant des structures de financement ou des politiques comptables différentes.",
    avance:"L'EBITDA est un indicateur utile mais partiel : il ignore les besoins réels en investissement et peut donner une image plus flatteuse de la rentabilité qu'un résultat net, qui lui intègre l'ensemble des charges réelles de l'entreprise.",
    exemple:"Deux entreprises avec le même EBITDA peuvent avoir des résultats nets très différents si l'une est fortement endettée et l'autre non.",
    avantages:["Permet de comparer la performance opérationnelle indépendamment du financement"],
    inconvenients:["Ignore les investissements nécessaires et peut masquer un endettement important"],
    erreurs:["Utiliser l'EBITDA comme seul indicateur de la santé financière d'une entreprise"]
  },
  {
    terme:"Bootstrapping",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le bootstrapping consiste à développer une entreprise avec ses fonds propres et les revenus qu'elle génère, sans lever de fonds externes.",
    detail:"Cette approche impose souvent une croissance plus lente et plus prudente, mais elle permet au fondateur de garder l'entièreté du contrôle et du capital de son entreprise, sans rendre de comptes à des investisseurs externes.",
    avance:"Le bootstrapping convient mieux à des modèles économiques capables de générer rapidement du chiffre d'affaires ; certains secteurs nécessitant un investissement initial lourd (matériel, recherche...) sont plus difficiles à financer uniquement de cette façon.",
    exemple:"Un développeur qui construit et commercialise progressivement un logiciel en réinvestissant les premiers revenus des clients, sans faire appel à des investisseurs, pratique le bootstrapping.",
    avantages:["Garde le contrôle total et évite la dilution du capital"],
    inconvenients:["Croissance souvent plus lente, faute de capitaux externes"],
    erreurs:["Vouloir croître aussi vite qu'une entreprise financée par levée de fonds sans en avoir les moyens"]
  },
  {
    terme:"Churn",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le churn (taux de résiliation ou d'attrition) mesure la proportion de clients qui arrêtent d'utiliser un produit ou un service sur une période donnée.",
    detail:"Il se calcule généralement en divisant le nombre de clients perdus sur une période par le nombre de clients au début de cette période. Un churn élevé oblige l'entreprise à acquérir continuellement de nouveaux clients juste pour maintenir son chiffre d'affaires.",
    avance:"Un churn de seulement quelques points de pourcentage par mois peut sembler faible, mais s'accumule fortement sur une année (un churn mensuel de 5% équivaut à perdre environ la moitié de sa base de clients en un an) — d'où l'attention portée à cet indicateur dans les modèles par abonnement.",
    exemple:"Une entreprise SaaS avec 1000 abonnés qui en perd 30 en un mois a un churn mensuel de 3%.",
    avantages:[],
    inconvenients:[],
    erreurs:["Sous-estimer l'effet cumulé d'un churn en apparence faible sur plusieurs mois"]
  },
  {
    terme:"Burn rate",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le burn rate (taux de combustion) mesure la vitesse à laquelle une entreprise dépense sa trésorerie, généralement exprimé en euros par mois.",
    detail:"Il se calcule en général en comparant la trésorerie disponible à deux dates : la différence, ramenée à un mois, donne le burn rate. Rapporté au montant de trésorerie restante, il permet d'estimer le nombre de mois restants avant d'être à court de liquidités (la « runway »).",
    avance:"Un burn rate élevé n'est pas automatiquement un problème si la croissance ou la levée de fonds suit un rythme cohérent — mais il devient critique dès que la runway restante passe sous quelques mois sans perspective de financement ou de rentabilité proche.",
    exemple:"Une entreprise qui commence le mois avec 60 000€ de trésorerie et le termine avec 50 000€ a un burn rate de 10 000€ ce mois-là, soit une runway d'environ 5 mois au même rythme.",
    avantages:[],
    inconvenients:[],
    erreurs:["Suivre le burn rate sans jamais calculer la runway restante qui en découle"]
  },
  {
    terme:"Product-market fit",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le product-market fit (adéquation produit-marché) désigne le moment où un produit répond enfin à une vraie demande du marché, au point que les clients l'adoptent et le recommandent sans effort marketing disproportionné.",
    detail:"Avant d'atteindre ce point, une entreprise ajuste souvent son produit, son positionnement ou son client cible par itérations successives. Après l'avoir atteint, la priorité change généralement : passer de la recherche du bon produit à la mise à l'échelle de sa distribution.",
    avance:"Le product-market fit n'est ni binaire ni définitif : il peut se dégrader si le marché évolue ou si la concurrence change, et certaines entreprises doivent le retrouver plusieurs fois au cours de leur histoire, notamment après un pivot.",
    exemple:"Une application dont la croissance repose surtout sur le bouche-à-oreille et la rétention des utilisateurs existants, plutôt que sur des dépenses publicitaires croissantes, est souvent citée comme un signe de product-market fit.",
    avantages:[],
    inconvenients:[],
    erreurs:["Investir massivement dans l'acquisition avant d'avoir vérifié que les premiers clients restent et recommandent le produit"]
  },
  {
    terme:"Taux de conversion",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"1 min",
    simple:"Le taux de conversion mesure la proportion de personnes qui accomplissent une action souhaitée (achat, inscription...) parmi celles exposées à une offre.",
    detail:"Il se calcule en divisant le nombre de conversions par le nombre total de visiteurs ou de prospects, souvent exprimé en pourcentage. Il permet de mesurer l'efficacité d'un site, d'une campagne publicitaire ou d'un parcours de vente.",
    avance:"Le taux de conversion doit toujours s'interpréter avec le volume de trafic concerné : un taux élevé sur un très faible nombre de visiteurs peut être dû au hasard plutôt qu'à une réelle efficacité, d'où l'importance d'un échantillon suffisant avant de tirer des conclusions.",
    exemple:"Un site visité par 1000 personnes qui génère 20 ventes a un taux de conversion de 2%.",
    avantages:[],
    inconvenients:[],
    erreurs:["Tirer des conclusions d'un taux de conversion calculé sur trop peu de visiteurs"]
  },
  {
    terme:"Pricing",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le pricing désigne la stratégie de fixation du prix d'un produit ou service.",
    detail:"Il peut se baser sur le coût de revient (coût + marge), sur les prix pratiqués par la concurrence, ou sur la valeur perçue par le client — trois logiques qui peuvent donner des prix très différents pour un même produit.",
    avance:"Le pricing basé sur la valeur perçue est souvent le plus rentable mais aussi le plus difficile à mettre en œuvre, car il nécessite de bien comprendre ce que le client est réellement prêt à payer, indépendamment du coût de production.",
    exemple:"Un même café peut être vendu 2€ dans une boulangerie de quartier et 6€ dans un lieu au positionnement plus haut de gamme, pour un coût de production quasi identique.",
    avantages:[],
    inconvenients:[],
    erreurs:["Fixer un prix uniquement à partir du coût de revient, sans tenir compte de la valeur perçue par le client"]
  },
  {
    terme:"Marché adressable (TAM/SAM/SOM)",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"TAM, SAM et SOM sont trois niveaux pour estimer la taille d'un marché, du plus large au plus réaliste à court terme.",
    detail:"Le TAM (Total Addressable Market) est la taille totale théorique du marché si l'entreprise captait 100% de la demande. Le SAM (Serviceable Addressable Market) restreint ce marché à ce que l'entreprise peut réellement adresser (zone géographique, segment de clientèle). Le SOM (Serviceable Obtainable Market) est la part réaliste que l'entreprise peut espérer capter à court ou moyen terme.",
    avance:"Les investisseurs se méfient généralement d'un business plan qui ne présente que le TAM sans descendre jusqu'au SOM : un marché théorique gigantesque ne dit rien de la capacité réelle d'une jeune entreprise à en capter une part significative.",
    exemple:"Pour une application de recettes de cuisine en France, le TAM pourrait être l'ensemble des personnes cuisinant dans le monde, le SAM les francophones équipés d'un smartphone, et le SOM la part réaliste de ce segment atteignable la première année.",
    avantages:[],
    inconvenients:[],
    erreurs:["Présenter uniquement le TAM pour impressionner, sans estimer la part réellement atteignable (SOM)"]
  },
  {
    terme:"Capital-risque et business angels",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le capital-risque (venture capital) et les business angels sont deux sources de financement qui investissent dans de jeunes entreprises à fort potentiel en échange de parts de capital.",
    detail:"Les business angels sont généralement des particuliers fortunés investissant leur propre argent, souvent aux tout premiers stades du projet. Les fonds de capital-risque gèrent l'argent de plusieurs investisseurs et interviennent en général à des stades un peu plus avancés, avec des montants plus importants.",
    avance:"Ces investisseurs recherchent des entreprises capables de croître très rapidement, car leur modèle économique repose sur le fait qu'un petit nombre de réussites majeures doit compenser les nombreux échecs du reste de leur portefeuille — un projet à croissance lente mais stable ne correspond généralement pas à leurs attentes.",
    exemple:"Un fondateur qui obtient 50 000€ d'un business angel pour démarrer, puis 2 millions d'euros d'un fonds de capital-risque un an plus tard pour accélérer, traverse deux étapes de financement distinctes.",
    avantages:["Apporte des capitaux importants sans dette à rembourser", "Les investisseurs apportent souvent aussi expérience et réseau"],
    inconvenients:["Dilue la propriété des fondateurs", "Impose souvent des attentes de croissance rapide"],
    erreurs:["Rechercher du capital-risque pour un projet dont le modèle économique ne vise pas une forte croissance"]
  },
  {
    terme:"Valorisation",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"La valorisation d'une entreprise est l'estimation de sa valeur totale, notamment utilisée lors d'une levée de fonds ou d'une vente.",
    detail:"Pour une jeune entreprise sans historique financier long, elle repose souvent sur des méthodes comparatives (valorisations d'entreprises similaires) plutôt que sur des calculs strictement basés sur les bénéfices actuels, qui peuvent être encore négatifs.",
    avance:"Une valorisation élevée lors d'une levée de fonds n'est pas nécessairement un gage de succès futur : elle reflète l'anticipation des investisseurs sur la croissance à venir, qui peut ne pas se réaliser — une \"down round\" (levée suivante à valorisation inférieure) reste possible si les objectifs ne sont pas atteints.",
    exemple:"Une startup qui lève 2 millions d'euros en cédant 10% de son capital est valorisée 20 millions d'euros après l'opération (valorisation dite \"post-money\").",
    avantages:[],
    inconvenients:["Repose souvent sur des anticipations, pas uniquement sur des résultats déjà réalisés"],
    erreurs:["Confondre valorisation théorique et argent réellement disponible pour l'entreprise ou ses actionnaires"]
  },
  {
    terme:"Seuil de rentabilité",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le seuil de rentabilité (ou point mort) est le niveau de chiffre d'affaires à partir duquel une entreprise commence à générer un bénéfice, après avoir couvert toutes ses charges.",
    detail:"En dessous de ce seuil, l'entreprise est en perte ; au-dessus, elle devient bénéficiaire. Il se calcule en tenant compte des charges fixes (loyer, salaires...) et des charges variables (matières premières...) liées au niveau d'activité.",
    avance:"Le seuil de rentabilité est un indicateur statique, calculé à un instant donné avec des hypothèses de coûts et de prix figées — il doit être recalculé régulièrement, notamment lorsque les charges fixes ou la structure de coûts évoluent.",
    exemple:"Une entreprise avec 5000€ de charges fixes mensuelles et une marge de 50% sur chaque vente doit réaliser 10 000€ de chiffre d'affaires par mois pour atteindre son seuil de rentabilité.",
    avantages:[],
    inconvenients:[],
    erreurs:["Oublier de recalculer le seuil de rentabilité après une évolution des charges fixes ou du prix de vente"]
  },
  {
    terme:"ROAS",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"1 min",
    simple:"Le ROAS (Return On Ad Spend) mesure le chiffre d'affaires généré pour chaque euro dépensé en publicité.",
    detail:"Il se calcule en divisant le chiffre d'affaires généré par une campagne par son coût. Contrairement au ROI, qui tient compte de toutes les charges, le ROAS se concentre uniquement sur le rapport entre dépense publicitaire et chiffre d'affaires brut généré.",
    avance:"Un ROAS élevé ne garantit pas la rentabilité : il ignore les coûts de production, de livraison ou de gestion. Une campagne peut afficher un bon ROAS tout en étant globalement déficitaire une fois toutes les charges intégrées.",
    exemple:"Une campagne publicitaire ayant coûté 1000€ et généré 4000€ de ventes a un ROAS de 4 (ou 400%).",
    avantages:["Indicateur rapide pour comparer l'efficacité brute de différentes campagnes publicitaires"],
    inconvenients:["Ignore les coûts autres que la publicité, contrairement au ROI"],
    erreurs:["Confondre un bon ROAS avec une campagne rentable, sans vérifier la marge réelle"]
  },
  {
    terme:"Acquisition",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"L'acquisition désigne l'ensemble des actions et canaux utilisés par une entreprise pour obtenir de nouveaux clients.",
    detail:"Elle regroupe des leviers variés : publicité payante, référencement naturel (SEO), réseaux sociaux, bouche-à-oreille, partenariats... Le choix des canaux d'acquisition dépend du type de clientèle visée et du budget disponible.",
    avance:"Une stratégie d'acquisition efficace se mesure rarement à un seul indicateur : le coût d'acquisition (CAC), la qualité des clients obtenus et leur valeur dans le temps (LTV) doivent s'analyser ensemble, canal par canal.",
    exemple:"Une entreprise peut tester plusieurs canaux d'acquisition (publicité en ligne, réseaux sociaux, bouche-à-oreille) pour identifier lequel ramène les clients les plus rentables.",
    avantages:[],
    inconvenients:[],
    erreurs:["Se concentrer sur un seul canal d'acquisition sans jamais tester d'alternatives"]
  },
  {
    terme:"Rétention",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La rétention désigne la capacité d'une entreprise à garder ses clients dans la durée, plutôt qu'à les voir partir vers la concurrence.",
    detail:"Elle s'oppose au churn (taux de résiliation) : plus la rétention est élevée, plus les clients restent longtemps, ce qui augmente leur valeur totale pour l'entreprise (LTV). De nombreuses entreprises jugent qu'il coûte moins cher de fidéliser un client existant que d'en acquérir un nouveau.",
    avance:"Améliorer la rétention (support client, programme de fidélité, amélioration continue du produit) a souvent un effet de levier plus fort sur la rentabilité à long terme que d'augmenter le budget d'acquisition, en particulier dans les modèles par abonnement.",
    exemple:"Une entreprise SaaS qui améliore son support client et voit son taux de rétention annuel passer de 80% à 90% conserve davantage de revenus récurrents sans dépenser plus en acquisition.",
    avantages:["Souvent moins coûteux que l'acquisition de nouveaux clients"],
    inconvenients:[],
    erreurs:["Investir uniquement dans l'acquisition de nouveaux clients en négligeant la fidélisation des clients existants"]
  },
  {
    terme:"Branding",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le branding désigne le travail de construction et de gestion de l'image et de l'identité d'une marque.",
    detail:"Il englobe le nom, le logo, les couleurs, le ton de communication, mais aussi la perception globale que les clients ont de l'entreprise : sérieuse, innovante, accessible, premium... Un branding cohérent aide les clients à reconnaître et à se souvenir d'une marque parmi la concurrence.",
    avance:"Le branding agit sur le long terme et se mesure difficilement par un seul indicateur financier immédiat ; il influence indirectement le taux de conversion, le pricing possible (une marque perçue comme premium peut pratiquer des prix plus élevés) et la fidélité des clients.",
    exemple:"Deux produits techniquement similaires peuvent se vendre à des prix très différents selon la perception de la marque qui les propose.",
    avantages:["Peut justifier un prix plus élevé si la marque est perçue comme différenciante"],
    inconvenients:["Effets difficiles à mesurer précisément et à court terme"],
    erreurs:["Négliger la cohérence de l'image de marque entre les différents canaux de communication"]
  },
  {
    terme:"Trésorerie",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La trésorerie représente l'argent immédiatement disponible sur les comptes d'une entreprise pour faire face à ses dépenses courantes.",
    detail:"Une entreprise peut être rentable sur le papier (bénéfice positif) tout en ayant des problèmes de trésorerie si l'argent des ventes rentre plus lentement que les charges à payer. Le suivi de la trésorerie est donc distinct du suivi de la rentabilité.",
    avance:"La faillite d'une entreprise peut survenir pour manque de trésorerie même lorsqu'elle est rentable sur le papier — c'est pourquoi les investisseurs et créanciers surveillent autant le tableau de flux de trésorerie que le compte de résultat.",
    exemple:"Une entreprise qui facture ses clients à 60 jours mais doit payer ses fournisseurs à 30 jours peut se retrouver en tension de trésorerie même si elle est rentable sur l'année.",
    avantages:[],
    inconvenients:["Peut se dégrader rapidement même quand l'entreprise est rentable"],
    erreurs:["Confondre rentabilité (résultat comptable) et trésorerie disponible (argent réellement sur le compte)"]
  },
  {
    terme:"BFR",
    categorie:"Business",
    niveau:"Avancé",
    lecture:"2 min",
    simple:"Le BFR (besoin en fonds de roulement) est le montant qu'une entreprise doit financer pour couvrir le décalage entre ses dépenses et ses encaissements dans son activité courante.",
    detail:"Il naît du fait qu'une entreprise paie souvent ses fournisseurs et ses stocks avant d'être payée par ses propres clients. Plus ce décalage est important, plus le BFR est élevé, et plus l'entreprise a besoin de financement pour fonctionner au quotidien.",
    avance:"Un BFR qui augmente plus vite que le chiffre d'affaires peut signaler un problème (stocks qui s'accumulent, clients qui payent de plus en plus tard) même si l'activité semble croître normalement — c'est un signal que les analystes financiers surveillent de près.",
    exemple:"Une entreprise qui doit payer ses fournisseurs sous 30 jours mais n'est payée par ses clients qu'à 90 jours doit financer ce décalage de 60 jours grâce à son BFR.",
    avantages:[],
    inconvenients:["Immobilise des capitaux qui ne peuvent pas être utilisés autrement"],
    erreurs:["Ignorer le BFR lors de la croissance rapide d'une entreprise, ce qui peut créer des tensions de trésorerie inattendues"]
  },
  {
    terme:"SEO",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Le SEO (Search Engine Optimization, référencement naturel) regroupe les techniques visant à améliorer la position d'un site dans les résultats gratuits des moteurs de recherche.",
    detail:"Il repose notamment sur la qualité et la pertinence du contenu, la structure technique du site, la vitesse de chargement et les liens provenant d'autres sites. Contrairement à la publicité, le trafic obtenu via le SEO n'est pas payé directement au clic.",
    avance:"Le SEO est un levier d'acquisition à effet différé : les résultats mettent généralement plusieurs mois à apparaître, contrairement à la publicité payante dont l'effet est immédiat mais s'arrête dès que le budget s'arrête.",
    exemple:"Un site bien référencé pour \"comparateur de crédit immobilier\" peut recevoir du trafic gratuit et régulier depuis les moteurs de recherche, sans payer par clic.",
    avantages:["Trafic gratuit une fois le référencement obtenu, effet durable dans le temps"],
    inconvenients:["Résultats lents à obtenir, nécessite un travail de contenu régulier"],
    erreurs:["Attendre des résultats SEO immédiats comme pour une campagne publicitaire payante"]
  },
  {
    terme:"Contenu (marketing de contenu)",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le marketing de contenu consiste à attirer et fidéliser une audience en publiant du contenu utile ou intéressant (articles, vidéos, guides...), plutôt qu'en communiquant uniquement de façon directement promotionnelle.",
    detail:"L'objectif est de construire la confiance et la visibilité d'une marque sur la durée, souvent en répondant aux questions que se posent les clients potentiels avant même qu'ils envisagent d'acheter.",
    avance:"Le marketing de contenu s'articule bien avec le SEO (le contenu utile attire du trafic naturel) et avec le branding (il construit une image d'expertise), mais demande de la régularité pour produire des effets mesurables.",
    exemple:"Une entreprise de conseil financier qui publie régulièrement des articles pédagogiques attire des lecteurs qui, plus tard, deviennent parfois clients.",
    avantages:["Construit la confiance et la visibilité sur la durée"],
    inconvenients:["Demande du temps et de la régularité avant de produire des résultats mesurables"],
    erreurs:["Produire du contenu uniquement promotionnel, sans apporter de valeur réelle au lecteur"]
  },
  {
    terme:"Réseaux sociaux (marketing)",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le marketing sur les réseaux sociaux consiste à utiliser des plateformes comme Instagram, LinkedIn ou TikTok pour construire une audience, communiquer et parfois vendre directement.",
    detail:"Chaque plateforme a ses propres codes et son propre public : LinkedIn convient davantage au B2B et à la communication professionnelle, tandis qu'Instagram ou TikTok touchent davantage un public B2C plus large et plus jeune.",
    avance:"Le choix de la ou des plateformes doit découler du profil du client cible (persona) plutôt que de suivre la plateforme la plus à la mode : être présent partout sans stratégie dilue souvent les efforts plus qu'il ne les renforce.",
    exemple:"Une entreprise B2B qui vend des logiciels à d'autres entreprises aura souvent plus de retour sur LinkedIn que sur TikTok.",
    avantages:["Accès direct et peu coûteux à une audience large"],
    inconvenients:["Exige une présence régulière, résultats parfois difficiles à prévoir"],
    erreurs:["Être présent sur toutes les plateformes sans stratégie claire adaptée à chacune"]
  },
  {
    terme:"Publicité",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"La publicité consiste à payer pour diffuser un message ou une offre auprès d'une audience ciblée, sur des plateformes comme les moteurs de recherche, les réseaux sociaux ou d'autres médias.",
    detail:"Contrairement au SEO ou au contenu organique, ses effets sont immédiats mais s'arrêtent dès que le budget cesse d'être dépensé. Son efficacité se mesure notamment via le CAC (coût d'acquisition) et le ROAS (retour sur dépense publicitaire).",
    avance:"La publicité payante permet de tester rapidement un message ou une offre avant d'investir davantage dans d'autres canaux plus lents (SEO, contenu) — un usage fréquent est de l'utiliser en phase de test, puis de basculer progressivement vers des canaux organiques une fois la meilleure offre identifiée.",
    exemple:"Une campagne publicitaire ciblant les personnes intéressées par l'investissement immobilier peut générer des prospects en quelques jours, contrairement au SEO qui prend plusieurs mois.",
    avantages:["Effet immédiat, permet de tester rapidement un message ou une offre"],
    inconvenients:["Coût continu : le trafic s'arrête dès que le budget publicitaire s'arrête"],
    erreurs:["Augmenter le budget publicitaire sans avoir vérifié que l'offre convertit correctement"]
  },
  {
    terme:"Email marketing",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"L'email marketing consiste à communiquer régulièrement avec des prospects ou des clients par email, pour informer, fidéliser ou vendre.",
    detail:"Contrairement à la publicité ou aux réseaux sociaux, l'entreprise possède directement sa liste de contacts, sans dépendre des règles changeantes d'une plateforme tierce. C'est un canal souvent utilisé pour la fidélisation et la rétention plus que pour l'acquisition initiale.",
    avance:"Le taux d'ouverture et le taux de conversion d'une campagne email dépendent fortement de la qualité et de la segmentation de la liste de contacts : envoyer le même message à toute une liste non segmentée donne généralement de moins bons résultats que des messages ciblés par segment.",
    exemple:"Une entreprise qui envoie une newsletter hebdomadaire à ses clients existants pour leur présenter de nouveaux produits pratique l'email marketing.",
    avantages:["L'entreprise possède directement sa liste de contacts, indépendamment des plateformes tierces"],
    inconvenients:["Nécessite une liste de contacts existante, moins efficace pour l'acquisition pure"],
    erreurs:["Envoyer le même message à toute une liste sans la segmenter selon les profils ou les intérêts"]
  },
  {
    terme:"Persona",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Un persona est un portrait-robot fictif mais réaliste du client type d'une entreprise, construit à partir de données et d'observations réelles plutôt que d'une simple intuition.",
    detail:"Il décrit généralement l'âge, la situation, les besoins, les freins et les habitudes d'achat d'un segment de clientèle. Il aide une équipe à prendre des décisions (produit, marketing, communication) en gardant un client concret à l'esprit plutôt qu'une cible abstraite.",
    avance:"Un persona utile repose sur de vraies données (entretiens clients, données de vente) plutôt que sur des suppositions ; un persona construit sans données réelles peut orienter les décisions dans une mauvaise direction en donnant une fausse impression de rigueur.",
    exemple:"\"Claire, 34 ans, cadre, peu de temps, cherche à investir simplement sans devenir experte\" est un exemple de persona pour une application d'investissement automatisé.",
    avantages:["Aide les équipes à concevoir des produits et messages plus pertinents pour de vrais besoins"],
    inconvenients:["Peut donner une fausse impression de rigueur s'il n'est pas basé sur de vraies données"],
    erreurs:["Construire un persona uniquement à partir d'hypothèses, sans jamais vérifier avec de vrais clients"]
  },
  {
    terme:"Segmentation",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"La segmentation consiste à diviser l'ensemble des clients potentiels en groupes plus homogènes, partageant des besoins ou des caractéristiques similaires.",
    detail:"Elle peut se baser sur des critères démographiques (âge, revenu), comportementaux (habitudes d'achat) ou sur les besoins exprimés. Elle permet d'adapter l'offre, le message et le canal de communication à chaque groupe plutôt que de s'adresser à \"tout le monde\" de la même façon.",
    avance:"Une segmentation trop fine multiplie les messages à créer et gérer, tandis qu'une segmentation trop large perd en pertinence — le bon niveau de segmentation dépend de la taille de l'entreprise et de ses moyens.",
    exemple:"Une entreprise de formation financière peut segmenter son audience entre débutants complets et investisseurs déjà expérimentés, avec des messages différents pour chaque groupe.",
    avantages:["Permet des messages et offres plus pertinents pour chaque groupe de clients"],
    inconvenients:["Une segmentation trop fine peut devenir difficile à gérer avec des moyens limités"],
    erreurs:["S'adresser à tous les clients potentiels avec exactement le même message, quels que soient leurs besoins"]
  },
  {
    terme:"Niche",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Une niche est un segment de marché restreint et spécifique, souvent délaissé par les grandes entreprises généralistes.",
    detail:"Se positionner sur une niche permet à une petite entreprise de devenir rapidement une référence sur un besoin précis, plutôt que d'affronter directement de grands concurrents généralistes sur un marché large.",
    avance:"Une stratégie de niche limite mécaniquement la taille du marché adressable (voir TAM/SAM/SOM), ce qui peut convenir à une petite structure mais freiner la croissance d'un projet visant une expansion rapide et importante.",
    exemple:"Plutôt que de viser \"tous les investisseurs\", une entreprise peut se spécialiser sur \"les investisseurs débutants qui préfèrent l'immobilier locatif\", une niche plus étroite mais plus facile à adresser efficacement.",
    avantages:["Moins de concurrence directe, positionnement plus facile à défendre"],
    inconvenients:["Marché potentiel plus restreint, peut limiter la croissance à long terme"],
    erreurs:["Choisir une niche si étroite qu'elle ne représente plus un marché économiquement viable"]
  },
  {
    terme:"Client idéal",
    categorie:"Business",
    niveau:"Débutant",
    lecture:"2 min",
    simple:"Le client idéal désigne le profil de client pour lequel une offre apporte le plus de valeur et qui, en retour, est le plus susceptible d'acheter et de rester fidèle.",
    detail:"Identifier son client idéal permet de concentrer les efforts marketing et produit sur les personnes les plus susceptibles d'être satisfaites, plutôt que d'essayer de plaire à tout le monde, ce qui dilue généralement l'efficacité de l'offre et du message.",
    avance:"Le client idéal évolue souvent avec le temps et l'expérience réelle de l'entreprise : les premiers clients réels d'un projet ne correspondent pas toujours à l'idée initiale qu'on s'en faisait, d'où l'importance d'ajuster ce profil à partir des retours du terrain.",
    exemple:"Une application d'investissement simple peut découvrir que son client idéal n'est pas \"tous les jeunes actifs\" mais spécifiquement \"les jeunes actifs qui ont déjà un peu épargné mais n'osent pas investir seuls\".",
    avantages:["Concentre les efforts marketing et produit là où ils ont le plus d'impact"],
    inconvenients:[],
    erreurs:["Définir son client idéal une seule fois au départ et ne jamais l'ajuster avec l'expérience réelle"]
  },
  {
    terme:"Objections (commerciales)",
    categorie:"Business",
    niveau:"Intermédiaire",
    lecture:"2 min",
    simple:"Les objections sont les raisons, exprimées ou non, pour lesquelles un client potentiel hésite ou refuse d'acheter.",
    detail:"Elles portent souvent sur le prix, la confiance, le besoin réel ou le moment de l'achat. Anticiper les objections les plus fréquentes permet d'y répondre dans le message commercial ou le produit lui-même, avant même qu'elles ne soient formulées.",
    avance:"Les objections récurrentes sont une source d'information précieuse : lorsqu'un grand nombre de clients potentiels expriment la même objection, cela révèle souvent un vrai frein à traiter dans l'offre elle-même, pas seulement dans l'argumentaire de vente.",
    exemple:"\"C'est trop cher\", \"je n'ai pas confiance\" ou \"je n'en ai pas besoin maintenant\" sont des objections commerciales courantes que beaucoup d'entreprises rencontrent.",
    avantages:[],
    inconvenients:[],
    erreurs:["Ignorer les objections répétées des clients plutôt que d'ajuster l'offre ou le message en conséquence"]
  }
];

// ---------- Index de recherche (pages + bibliothèque + actualités) ----------
const SEARCH_INDEX = [
  {title:"Accueil", url:"index.html", type:"Page"},
  {title:"Actualités", url:"actualites.html", type:"Page"},
  {title:"Bourse & comparateur", url:"bourse.html", type:"Page"},
  {title:"Crypto", url:"crypto.html", type:"Page"},
  {title:"Immobilier", url:"immobilier.html", type:"Page"},
  {title:"Bibliothèque", url:"bibliotheque.html", type:"Page"},
  {title:"Formations (Academy)", url:"formations.html", type:"Page"},
  {title:"Laboratoire financier", url:"laboratoire.html", type:"Page"},
  {title:"Mon compte", url:"compte.html", type:"Page"},
  {title:"Mentions légales", url:"legal.html", type:"Page"},
  {title:"À propos", url:"apropos.html", type:"Page"},
  {title:"À venir", url:"avenir.html", type:"Page"},
  ...NEWS_DATA.map(n=>({title:n.titre, url:`actualites.html#${n.id}`, type:"Actualité"})),
  ...LIBRARY.map(l=>({title:l.terme, url:`bibliotheque.html#${l.terme.replace(/\s+/g,'-')}`, type:"Définition"})),
  ...STOCKS_DEMO.map(s=>({title:s.nom+" ("+s.ticker+")", url:`bourse.html#${s.ticker}`, type:"Action"})),
  ...MARKET_DATA.map(m=>({title:m.nom, url:`marche.html#${encodeURIComponent(m.symbol)}`, type:"Marché"}))
];

