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
      question:{type:"qcm", prompt:"Vers quel type de produit Léa devrait-elle se tourner pour répondre à son besoin (miser sur beaucoup d'entreprises en une seule fois, sans les sélectionner à la main) ?", choix:["Une obligation d'État","Un ETF diversifié","Un unique titre bien choisi","Un compte à terme"], bonneReponse:1, explication:"Un ETF regroupe des dizaines ou des centaines d'entreprises dans un seul produit, ce qui répond exactement au besoin de Léa : miser sur un marché entier sans sélectionner les titres un par un."}
    },
    {
      title:"PEA, CTO, livret : où loger son argent",
      story:[
        {heading:"Le choix de Tom", text:"Tom a 2000€ de côté. Il hésite entre les laisser sur son Livret A, dont le taux est actuellement de 3% par an, ou ouvrir un PEA pour investir en actions européennes."},
        {heading:"Une première estimation", text:"Avant de se décider, Tom veut d'abord comprendre concrètement ce que lui rapporterait le Livret A s'il y laissait son argent une année entière, sans rien y toucher."}
      ],
      question:{type:"calcul", prompt:"Avec 2000€ placés sur un Livret A à 3% par an, combien d'intérêts Tom touche-t-il après 1 an (arrondis à l'euro) ?", unit:"€", reponse:60, tolerance:2, explication:"2000 × 3% = 60€. Le Livret A garantit le capital, mais son rendement reste modéré comparé à un placement en actions, en échange d'une sécurité totale et d'une disponibilité immédiate."}
    },
    {
      title:"Le risque, concrètement",
      story:[
        {heading:"Le premier investissement de Marc", text:"Marc place 2000€ en actions pour la première fois, convaincu que la bourse ne fait que monter sur le long terme."},
        {heading:"La première année difficile", text:"Dès sa première année, un choc économique fait chuter son placement de 18%. Marc panique un peu en consultant son compte, mais se souvient que son horizon de placement est de 15 ans."}
      ],
      question:{type:"calcul", prompt:"Après cette baisse de 18%, combien vaut approximativement le placement de Marc ?", unit:"€", reponse:1640, tolerance:15, explication:"2000 × (1 − 0,18) = 1640€. Une baisse, même marquée, ne signifie pas une perte définitive : c'est le risque normal d'un placement en actions, que le temps peut permettre de compenser, sans aucune garantie."}
    },
    {
      title:"Construire son premier plan financier",
      story:[
        {heading:"Le budget de Nora", text:"Nora gagne 1800€ par mois et dépense en moyenne 1600€. Avant d'investir quoi que ce soit, elle a lu qu'il valait mieux constituer une épargne de précaution."},
        {heading:"Un objectif chiffré", text:"Nora vise une épargne de précaution équivalente à 4 mois de ses dépenses courantes, pour pouvoir faire face à un imprévu sans avoir à revendre un futur placement en catastrophe."}
      ],
      question:{type:"calcul", prompt:"Quel montant total Nora doit-elle réunir pour atteindre une épargne de précaution de 4 mois de dépenses ?", unit:"€", reponse:6400, tolerance:100, explication:"1600 × 4 = 6400€. Une fois ce coussin de sécurité constitué, Nora pourra investir le reste de son épargne avec plus de sérénité, sans craindre de devoir tout retirer au premier imprévu."}
    }
  ],
  intermediaire:[
    {
      title:"Lire les ratios de base : P/E et dividende",
      story:[
        {heading:"Deux actions, un choix", text:"Yanis compare deux entreprises du même secteur avant d'investir. La première se négocie à 80€ et a généré un bénéfice de 4€ par action l'an dernier."},
        {heading:"Un premier repère", text:"Yanis a entendu parler du PER (Price Earning Ratio) comme premier indicateur pour juger si le prix d'une action est \"cher\" ou non par rapport à ses bénéfices."}
      ],
      question:{type:"calcul", prompt:"Quel est le PER de cette action (cours de 80€ pour un bénéfice par action de 4€) ?", unit:"", reponse:20, tolerance:0.5, explication:"PER = cours / bénéfice par action = 80 / 4 = 20. Un PER de 20 signifie qu'il faudrait 20 années de bénéfices actuels pour \"rembourser\" le prix payé, à comparer à d'autres entreprises du même secteur pour juger si c'est élevé ou raisonnable."}
    },
    {
      title:"Diversifier par secteur et zone géographique",
      story:[
        {heading:"Le portefeuille de Chloé", text:"Chloé a placé 90% de son épargne dans l'action d'une seule entreprise technologique française, convaincue de son potentiel."},
        {heading:"Une annonce inattendue", text:"Un concurrent annonce un produit révolutionnaire qui menace directement l'activité de cette entreprise. Le cours plonge en quelques jours."}
      ],
      question:{type:"qcm", prompt:"Qu'est-ce que cette mésaventure illustre principalement sur la stratégie de Chloé ?", choix:["Elle n'aurait jamais dû investir en actions","En concentrant son épargne sur une seule entreprise, elle s'expose fortement à un choc qui lui est spécifique","Les actions technologiques sont interdites aux particuliers","Diversifier n'aurait rien changé au résultat"], bonneReponse:1, explication:"En ne détenant qu'un seul titre, Chloé subit de plein fouet tout événement propre à cette entreprise. Répartir son épargne entre plusieurs entreprises, secteurs et zones géographiques aurait limité l'impact de ce choc isolé sur l'ensemble de son portefeuille."}
    },
    {
      title:"Cycles économiques et taux d'intérêt",
      story:[
        {heading:"Le projet immobilier d'Hugo", text:"Hugo prépare un emprunt de 200 000€ sur 20 ans pour un achat immobilier. Au moment où il commence ses démarches, les taux sont à 3%."},
        {heading:"La banque centrale relève ses taux", text:"Le temps qu'Hugo finalise son dossier, la banque centrale relève ses taux directeurs pour lutter contre l'inflation. Sa banque lui propose désormais un taux de 4% sur le même prêt."}
      ],
      question:{type:"calcul", prompt:"À 4% sur 20 ans pour 200 000€ empruntés, quelle est la nouvelle mensualité approximative d'Hugo (arrondie à l'euro) ?", unit:"€/mois", reponse:1212, tolerance:20, explication:"Avec la formule de mensualité de crédit (capital × taux mensuel ⁄ (1 − (1+taux mensuel)⁻ⁿ)), la mensualité passe à environ 1212€/mois. Une hausse des taux directeurs se répercute directement sur le coût du crédit pour les ménages et les entreprises, ce qui peut freiner l'économie."}
    },
    {
      title:"Comparer des ETF entre eux",
      story:[
        {heading:"Deux trackers, un même indice", text:"Nina hésite entre deux ETF qui suivent exactement le même indice mondial. Le premier facture 0,07% de frais de gestion annuels, le second 0,45%."},
        {heading:"Un même capital, deux avenirs", text:"Elle prévoit d'investir 10 000€ dans l'un des deux ETF, sans tenir compte pour l'instant de la performance du marché, seulement de l'écart de frais entre les deux produits."}
      ],
      question:{type:"calcul", prompt:"Sur 10 000€ investis pendant 1 an, quelle est la différence de frais payés entre l'ETF à 0,45% et celui à 0,07% (hors performance de marché) ?", unit:"€", reponse:38, tolerance:2, explication:"10 000 × (0,45% − 0,07%) = 10 000 × 0,38% = 38€. Un écart qui paraît minime en un an, mais qui se cumule chaque année sur toute la durée de détention : un critère de comparaison à ne pas négliger entre deux ETF qui suivent le même indice."}
    },
    {
      title:"SCPI : investir dans l'immobilier sans gérer de bien",
      story:[
        {heading:"Le choix de Sofia", text:"Sofia n'a ni le temps ni l'envie de gérer elle-même un bien locatif (recherche de locataires, travaux, impayés). Elle se tourne vers une SCPI qui affiche un taux de distribution de 4,5% pour l'année passée."},
        {heading:"Un premier placement", text:"Elle investit 10 000€ dans cette SCPI, en gardant à l'esprit que ce taux de distribution passé ne garantit en rien les revenus futurs."}
      ],
      question:{type:"calcul", prompt:"Sur la base de ce taux de distribution de 4,5%, quel revenu annuel brut Sofia peut-elle espérer sur ses 10 000€ investis (avant fiscalité) ?", unit:"€", reponse:450, tolerance:15, explication:"10 000 × 4,5% = 450€ par an, avant fiscalité et hors frais éventuels. Ce chiffre reste une estimation basée sur une performance passée, jamais une garantie contractuelle : le capital et les revenus futurs d'une SCPI ne sont jamais garantis."}
    }
  ],
  avance:[
    {
      title:"Analyse fondamentale vs technique",
      story:[
        {heading:"Deux méthodes, une même action", text:"Avant d'investir dans une entreprise, Karim épluche ses derniers résultats annuels, sa dette et ses perspectives de croissance sur plusieurs années."},
        {heading:"Un collègue, une autre approche", text:"Son collègue, lui, ne regarde que les courbes de prix et de volumes des dernières semaines pour repérer des tendances à court terme, sans jamais ouvrir un rapport annuel."}
      ],
      question:{type:"qcm", prompt:"La méthode de Karim (résultats, dette, perspectives de l'entreprise) relève de quelle approche ?", choix:["L'analyse technique","L'analyse fondamentale","Le trading haute fréquence","L'arbitrage statistique"], bonneReponse:1, explication:"Karim pratique l'analyse fondamentale : il évalue l'entreprise elle-même (résultats, dette, perspectives). Son collègue pratique l'analyse technique, centrée sur les courbes de prix et volumes passés. Aucune des deux ne prédit l'avenir avec certitude."}
    },
    {
      title:"Volatilité, corrélation, allocation d'actifs",
      story:[
        {heading:"Un portefeuille très tech", text:"Élise détient déjà deux actions technologiques américaines, qui montent et descendent quasiment ensemble à chaque annonce du secteur."},
        {heading:"Une troisième idée", text:"Elle hésite entre ajouter une troisième action technologique similaire, ou plutôt un peu d'or, un actif dont l'évolution suit rarement celle des actions technologiques."}
      ],
      question:{type:"qcm", prompt:"Pourquoi ajouter l'or (peu corrélé aux actions technologiques déjà détenues) réduit-il davantage le risque global du portefeuille qu'une troisième action tech ?", choix:["Parce que l'or ne peut jamais perdre de valeur","Parce qu'un actif peu corrélé ne réagit pas de la même façon aux mêmes chocs de marché, ce qui amortit les variations globales du portefeuille","Parce que l'or est interdit en PEA, ce qui le rend plus sûr","Parce qu'une troisième action tech doublerait automatiquement le risque"], bonneReponse:1, explication:"Deux actifs fortement corrélés réagissent de façon similaire aux mêmes événements, ce qui n'apporte que peu de diversification. Un actif peu corrélé, comme l'or ici, réagit différemment, ce qui réduit l'amplitude globale des variations du portefeuille, sans pour autant éliminer tout risque."}
    },
    {
      title:"Lire les flux de trésorerie",
      story:[
        {heading:"Un résultat net flatteur", text:"Une entreprise affiche un résultat net de 5 M€ sur son dernier exercice, un chiffre qui impressionne à première vue."},
        {heading:"Un investissement massif", text:"En creusant les comptes, un analyste découvre que l'entreprise a aussi investi 4 M€ en capex (dépenses d'investissement) cette année-là, financés par son activité courante."}
      ],
      question:{type:"calcul", prompt:"En simplifiant (résultat net − capex), quel est le flux de trésorerie disponible approximatif de cette entreprise, en M€ ?", unit:"M€", reponse:1, tolerance:0.3, explication:"5 − 4 = 1 M€. Le résultat net peut être flatté par des éléments comptables ; le flux de trésorerie disponible montre l'argent réellement généré par l'activité une fois les investissements déduits, souvent plus révélateur de la santé financière réelle d'une entreprise."}
    },
    {
      title:"Produits dérivés : ce qu'il faut comprendre avant tout",
      story:[
        {heading:"Un pari à effet de levier", text:"Amine ouvre une position à effet de levier x5 sur un actif, avec une mise de 1000€, séduit par la perspective de gains amplifiés."},
        {heading:"Le marché tourne mal", text:"Quelques jours plus tard, l'actif sous-jacent baisse de 8%. Amine découvre à quel point l'effet de levier amplifie aussi les pertes, pas seulement les gains."}
      ],
      question:{type:"calcul", prompt:"Avec un effet de levier x5 sur une mise de 1000€, si l'actif sous-jacent baisse de 8%, quelle est la perte sur la mise engagée ?", unit:"€", reponse:400, tolerance:20, explication:"1000 × 8% × 5 = 400€ de perte, soit 40% de la mise initiale pour une baisse de \"seulement\" 8% de l'actif sous-jacent. C'est tout le principe (et le danger) de l'effet de levier : il amplifie symétriquement gains et pertes, parfois au-delà du capital engagé selon les produits."}
    },
    {
      title:"Retraite et PER : préparer le long terme",
      story:[
        {heading:"Une tranche d'imposition élevée", text:"Camille est imposée à une tranche marginale de 30%. Son conseiller lui suggère de verser sur un PER pour réduire son impôt de l'année."},
        {heading:"Un versement réfléchi", text:"Camille décide de verser 3000€ sur son PER cette année, sachant que ce montant sera déductible de son revenu imposable, mais imposé à la sortie, à la retraite."}
      ],
      question:{type:"calcul", prompt:"Avec une tranche marginale d'imposition de 30% et un versement déductible de 3000€, quelle économie d'impôt immédiate Camille obtient-elle ?", unit:"€", reponse:900, tolerance:30, explication:"3000 × 30% = 900€ d'économie d'impôt immédiate. En contrepartie, les sommes correspondantes seront en principe réintégrées à l'impôt sur le revenu à la sortie, à la retraite : l'intérêt de l'opération dépend surtout de l'écart entre la tranche d'imposition actuelle et celle anticipée au moment de la retraite."}
    }
  ],
  expert:[
    {
      title:"Introduction à la valorisation par DCF",
      story:[
        {heading:"Un flux unique à valoriser", text:"Un analyste doit estimer la valeur actuelle d'une entreprise qui, selon ses projections, générera un flux de trésorerie de 1 000 000€ dans 5 ans, et rien d'autre entre-temps pour simplifier l'exercice."},
        {heading:"Le choix du taux d'actualisation", text:"Il retient un taux d'actualisation de 8% par an, reflétant le risque et le coût du capital associés à cette entreprise."}
      ],
      question:{type:"calcul", prompt:"Avec un flux de 1 000 000€ dans 5 ans et un taux d'actualisation de 8% par an, quelle est la valeur actuelle approximative de ce flux (arrondie au millier d'euros le plus proche) ?", unit:"€", reponse:680583, tolerance:5000, explication:"Valeur actuelle = 1 000 000 / (1,08)⁵ ≈ 680 583€. Plus le taux d'actualisation retenu est élevé, plus la valeur actuelle d'un flux futur est faible : la méthode DCF est donc très sensible aux hypothèses de taux et de croissance retenues."}
    },
    {
      title:"Analyse de sensibilité",
      story:[
        {heading:"Une valorisation, plusieurs scénarios", text:"Après avoir construit un premier modèle DCF, une analyste financière fait varier son hypothèse de croissance annuelle : 2%, 4%, puis 6%, en gardant tout le reste identique."},
        {heading:"Des résultats très différents", text:"Les trois scénarios donnent des valorisations sensiblement différentes pour la même entreprise, alors qu'un seul paramètre a changé à chaque fois."}
      ],
      question:{type:"qcm", prompt:"Quel est l'intérêt principal de faire varier ainsi une hypothèse clé (comme la croissance) dans une analyse de sensibilité ?", choix:["Choisir artificiellement le scénario qui donne la valorisation la plus haute pour vendre plus cher","Mesurer la robustesse d'une valorisation et identifier les paramètres qui l'influencent le plus","Remplacer complètement le besoin de connaître les comptes de l'entreprise","Garantir que la valorisation obtenue sera exacte"], bonneReponse:1, explication:"Faire varier une hypothèse clé permet de mesurer à quel point la valorisation finale en dépend, et donc d'identifier les paramètres les plus déterminants, pas de garantir un résultat, ni de le manipuler pour arriver à une conclusion prédéfinie."}
    },
    {
      title:"Construction de portefeuille",
      story:[
        {heading:"Au-delà de la simple diversification", text:"Un gérant de portefeuille ne se contente pas de multiplier le nombre de lignes détenues : il cherche un équilibre précis entre rendement attendu, risque toléré et corrélations entre les actifs choisis."},
        {heading:"Un repère théorique", text:"Il utilise le concept de frontière efficiente pour situer différentes combinaisons possibles d'actifs, et choisir celle qui correspond le mieux à ses objectifs."}
      ],
      question:{type:"qcm", prompt:"Qu'offre, en théorie, un portefeuille situé sur la frontière efficiente ?", choix:["Une garantie de gain quel que soit le contexte de marché","Le meilleur rendement attendu possible pour un niveau de risque donné (ou le risque le plus faible pour un rendement donné)","L'absence totale de frais de gestion","Un accès automatique à tous les marchés mondiaux"], bonneReponse:1, explication:"La frontière efficiente représente, pour chaque niveau de risque, la combinaison d'actifs offrant le meilleur rendement attendu possible (ou inversement, le risque le plus faible pour un rendement donné) : un repère théorique, pas une garantie de résultat futur."}
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

  // ---- Cryptoactifs ----
  {id:"q-crypto-001", niveau:"debutant", categorie:"Cryptoactifs", type:"qcm", question:"Quelle est une caractéristique importante à connaître sur les cryptoactifs avant d'y toucher ?", choix:["Leur valeur est toujours stable","Ils peuvent connaître des variations de prix extrêmes en peu de temps","Ils sont garantis par l'État français","Ils ne présentent aucun risque de perte"], bonneReponse:1, explication:"Les cryptoactifs sont réputés pour leur forte volatilité, avec des variations parfois extrêmes sur de courtes périodes, sans garantie publique de la valeur."},
  {id:"q-crypto-002", niveau:"intermediaire", categorie:"Cryptoactifs", type:"qcm", question:"Les fonds détenus sur une plateforme d'échange de cryptoactifs bénéficient-ils d'une garantie publique comme un compte bancaire classique ?", choix:["Oui, systématiquement","Non, généralement aucune garantie publique équivalente n'existe en cas de faillite de la plateforme","Oui, mais seulement au-dessus de 100 000€","Oui, via le Livret A"], bonneReponse:1, explication:"Contrairement à un dépôt bancaire couvert par une garantie des dépôts, les cryptoactifs détenus sur une plateforme ne bénéficient généralement pas d'une garantie publique équivalente en cas de faillite."},
  {id:"q-crypto-003", niveau:"avance", categorie:"Cryptoactifs", type:"qcm", question:"Pourquoi la valorisation de nombreux cryptoactifs est-elle jugée difficile à justifier par certains analystes ?", choix:["Parce qu'ils sont cotés en continu 24h/24","Parce que beaucoup n'ont ni revenus ni utilité clairement établie, contrairement à une action adossée à une entreprise","Parce que leur code source est toujours secret","Parce qu'ils sont interdits dans la plupart des pays"], bonneReponse:1, explication:"Une action peut être valorisée à partir des bénéfices ou des actifs d'une entreprise ; beaucoup de cryptoactifs manquent de cet ancrage, rendant leur valorisation plus spéculative."},

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
  {id:"q-retraite-003", niveau:"intermediaire", categorie:"Retraite et PER", type:"qcm", question:"Que se passe-t-il fiscalement si on déduit ses versements PER à l'entrée ?", choix:["Rien n'est jamais imposé, ni à l'entrée ni à la sortie","En contrepartie, les sommes seront generalement imposées à la sortie, à la retraite","Le taux d'imposition futur est automatiquement de 0%","Seuls les versements obligatoires sont concernés"], bonneReponse:1, explication:"La déduction à l'entrée n'est pas un cadeau définitif : en échange, les sommes correspondantes sont en principe réintégrées à l'impôt sur le revenu au moment de la sortie, à la retraite."},
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
  {id:"q-vf-crypto-001", niveau:"debutant", categorie:"Cryptoactifs", type:"vraifaux", question:"Les fonds détenus sur une plateforme d'échange crypto bénéficient de la même garantie des dépôts qu'un compte bancaire classique.", choix:["Vrai","Faux"], bonneReponse:1, explication:"Contrairement à un dépôt bancaire couvert par une garantie des dépôts, les cryptoactifs sur une plateforme ne bénéficient généralement d'aucune garantie publique équivalente."},
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

// ---------- Test de positionnement (profil Likanza en 3 parties) ----------
// Partie A — connaissances : réutilise des questions déjà existantes dans
// QUIZ_BANK_FULL (aucun contenu dupliqué), regroupées par 6 grands domaines
// plutôt que par 13 catégories fines — permet un niveau distinct par domaine
// (ex. finance personnelle : intermédiaire, bourse : débutant...) plutôt
// qu'un seul niveau global.
const POSITIONING_DOMAINS = [
  {key:'personalFinance', label:'Finances personnelles', ids:['q-budget-001', 'q-epargne-001', 'q-credit-002', 'q-patrimoine-002']},
  {key:'stockMarket', label:'Bourse', ids:['q-bourse-001', 'q-etf-001', 'q-diversification-002', 'q-risque-003']},
  {key:'economics', label:'Économie', ids:['q-pib-001', 'q-inflation-001', 'q-tauxdirecteur-002', 'q-recession-004']},
  {key:'realEstate', label:'Immobilier', ids:['q-immobilier-001', 'q-scpi-003', 'q-immobilier-002', 'q-immobilier-003']},
  {key:'business', label:'Business', ids:['q-ca-002', 'q-startup-001', 'q-margenette-001', 'q-bilan-004']},
  {key:'crypto', label:'Crypto', ids:['q-crypto-001', 'q-crypto-002', 'q-crypto-003', 'q-vf-crypto-001']}
];

// Partie B — centres d'intérêt : choix multiples, un intérêt peut être coché
// via plusieurs libellés proches (ex. "investir" et "comprendre la bourse"
// pointent tous deux vers stockMarket).
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

// Partie C — manière d'apprendre (style pédagogique) + compréhension légère
// du risque. Le risque reste purement descriptif : il réutilise le même champ
// "risque" (prudent/équilibre/dynamique) déjà utilisé par le profil de
// Mon compte, jamais présenté comme un profil investisseur réglementaire.
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
  {id:'bourse-actions', titre:'Comprendre la Bourse et les actions', niveau:'Débutant', libraryTermes:['Action','ETF','Capitalisation boursière','Obligation','PER (Price Earning Ratio)'], quizCategories:['Bourse','Actions','ETF','Obligations']},
  {id:'epargne-interets', titre:"Épargne et intérêts composés", niveau:'Débutant', libraryTermes:['Intérêts composés','Assurance-vie'], quizCategories:['Épargne','Intérêts composés','Intérêts simples','Livret A','Assurance-vie']},
  {id:'fiscalite-pea', titre:'Fiscalité et enveloppes fiscales', niveau:'Intermédiaire', libraryTermes:['PEA'], quizCategories:['PEA','Fiscalité de base','Retraite et PER']},
  {id:'risque-diversification', titre:'Risque, volatilité et diversification', niveau:'Intermédiaire', libraryTermes:['Diversification','Volatilité'], quizCategories:['Diversification','Risque et volatilité',"Psychologie de l'investisseur"]},
  {id:'crypto-blockchain', titre:'Crypto et blockchain', niveau:'Avancé', libraryTermes:['Blockchain'], quizCategories:['Cryptoactifs']},
  {id:'immobilier-locatif', titre:'Immobilier locatif', niveau:'Avancé', libraryTermes:['Rendement locatif'], quizCategories:['Immobilier','SCPI']},
  {id:'budget-securite', titre:'Budget et sécurité financière', niveau:'Débutant', libraryTermes:["Fonds d'urgence",'Inflation'], quizCategories:['Budget','Inflation','Arnaques financières','Crédit',"Constitution d'un patrimoine"]},
  {id:'economie-generale', titre:"Comprendre l'économie", niveau:'Intermédiaire', libraryTermes:['PIB (Produit intérieur brut)',"Taux d'intérêt directeur",'Banque centrale','Récession','Offre et demande'], quizCategories:['PIB','Taux directeur','Banque centrale','Récession','Offre et demande']},
  {id:'entreprise-essentiels', titre:"Comprendre l'entreprise", niveau:'Intermédiaire', libraryTermes:["Chiffre d'affaires",'Marge nette','Bilan comptable','Amortissement','Startup','Levée de fonds'], quizCategories:["Chiffre d'affaires",'Marge nette','Bilan comptable','Amortissement','Startup','Levée de fonds']}
];

// ---------- Actions de démonstration (bourse / comparateur) ----------
// Toutes les données ci-dessous sont FICTIVES, à but pédagogique uniquement.
const STOCKS_DEMO = [
  {ticker:'AI.PA', nom:'Air Liquide', secteur:'Industrie', pays:'France', pea:true, prix:178.4, variation:0.6, cap:'92 Md€', ca:'27,5 Md€', per:22.1, dividende:2.9, dette_ebitda:1.8, marge_nette:11.2, roe:13.5},
  {ticker:'TTE.PA', nom:'TotalEnergies', secteur:'Énergie', pays:'France', pea:true, prix:61.2, variation:-1.1, cap:'148 Md€', ca:'210 Md€', per:8.4, dividende:5.6, dette_ebitda:0.9, marge_nette:7.8, roe:16.2},
  {ticker:'SAN.PA', nom:'Sanofi', secteur:'Santé', pays:'France', pea:true, prix:92.7, variation:0.2, cap:'118 Md€', ca:'43 Md€', per:16.8, dividende:3.9, dette_ebitda:1.2, marge_nette:14.1, roe:11.8},
  {ticker:'SAF.PA', nom:'Safran', secteur:'Aéronautique', pays:'France', pea:true, prix:224.5, variation:1.4, cap:'93 Md€', ca:'27 Md€', per:29.6, dividende:1.4, dette_ebitda:1.5, marge_nette:9.4, roe:18.9},
  {ticker:'DG.PA', nom:'Vinci', secteur:'Construction', pays:'France', pea:true, prix:118.9, variation:-0.3, cap:'70 Md€', ca:'71 Md€', per:12.9, dividende:4.1, dette_ebitda:2.4, marge_nette:8.1, roe:15.4},
  {ticker:'OR.PA', nom:"L'Oréal", secteur:'Consommation', pays:'France', pea:true, prix:352.1, variation:0.4, cap:'190 Md€', ca:'44 Md€', per:31.2, dividende:1.7, dette_ebitda:0.6, marge_nette:13.9, roe:19.6},
  {ticker:'ASML.AS', nom:'ASML', secteur:'Technologie', pays:'Pays-Bas', pea:true, prix:812.3, variation:-2.1, cap:'320 Md€', ca:'32 Md€', per:33.8, dividende:0.9, dette_ebitda:0.4, marge_nette:26.3, roe:28.1},
  {ticker:'MC.PA', nom:'LVMH', secteur:'Luxe', pays:'France', pea:true, prix:598.7, variation:-0.8, cap:'298 Md€', ca:'86 Md€', per:22.7, dividende:2.1, dette_ebitda:1.1, marge_nette:17.5, roe:16.8},
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

