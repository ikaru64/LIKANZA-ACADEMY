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
      question:{type:"calcul", prompt:"Avec 2000€ placés sur un Livret A à 3% par an, combien d'intérêts Tom touche-t-il après 1 an (arrondis à l'euro) ?", unit:"€", reponse:60, tolerance:2, explication:"2000 × 3% = 60€. Le Livret A garantit le capital, mais son rendement reste modéré comparé à un placement en actions — en échange d'une sécurité totale et d'une disponibilité immédiate."}
    },
    {
      title:"Le risque, concrètement",
      story:[
        {heading:"Le premier investissement de Marc", text:"Marc place 2000€ en actions pour la première fois, convaincu que la bourse ne fait que monter sur le long terme."},
        {heading:"La première année difficile", text:"Dès sa première année, un choc économique fait chuter son placement de 18%. Marc panique un peu en consultant son compte, mais se souvient que son horizon de placement est de 15 ans."}
      ],
      question:{type:"calcul", prompt:"Après cette baisse de 18%, combien vaut approximativement le placement de Marc ?", unit:"€", reponse:1640, tolerance:15, explication:"2000 × (1 − 0,18) = 1640€. Une baisse, même marquée, ne signifie pas une perte définitive : c'est le risque normal d'un placement en actions, que le temps peut permettre de compenser — sans aucune garantie."}
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
      question:{type:"calcul", prompt:"Quel est le PER de cette action (cours de 80€ pour un bénéfice par action de 4€) ?", unit:"", reponse:20, tolerance:0.5, explication:"PER = cours / bénéfice par action = 80 / 4 = 20. Un PER de 20 signifie qu'il faudrait 20 années de bénéfices actuels pour \"rembourser\" le prix payé — à comparer à d'autres entreprises du même secteur pour juger si c'est élevé ou raisonnable."}
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
        {heading:"Un même capital, deux avenirs", text:"Elle prévoit d'investir 10 000€ dans l'un des deux ETF, sans tenir compte pour l'instant de la performance du marché — seulement de l'écart de frais entre les deux produits."}
      ],
      question:{type:"calcul", prompt:"Sur 10 000€ investis pendant 1 an, quelle est la différence de frais payés entre l'ETF à 0,45% et celui à 0,07% (hors performance de marché) ?", unit:"€", reponse:38, tolerance:2, explication:"10 000 × (0,45% − 0,07%) = 10 000 × 0,38% = 38€. Un écart qui paraît minime en un an, mais qui se cumule chaque année sur toute la durée de détention — un critère de comparaison à ne pas négliger entre deux ETF qui suivent le même indice."}
    },
    {
      title:"SCPI : investir dans l'immobilier sans gérer de bien",
      story:[
        {heading:"Le choix de Sofia", text:"Sofia n'a ni le temps ni l'envie de gérer elle-même un bien locatif (recherche de locataires, travaux, impayés). Elle se tourne vers une SCPI qui affiche un taux de distribution de 4,5% pour l'année passée."},
        {heading:"Un premier placement", text:"Elle investit 10 000€ dans cette SCPI, en gardant à l'esprit que ce taux de distribution passé ne garantit en rien les revenus futurs."}
      ],
      question:{type:"calcul", prompt:"Sur la base de ce taux de distribution de 4,5%, quel revenu annuel brut Sofia peut-elle espérer sur ses 10 000€ investis (avant fiscalité) ?", unit:"€", reponse:450, tolerance:15, explication:"10 000 × 4,5% = 450€ par an, avant fiscalité et hors frais éventuels. Ce chiffre reste une estimation basée sur une performance passée, jamais une garantie contractuelle — le capital et les revenus futurs d'une SCPI ne sont jamais garantis."}
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
      question:{type:"qcm", prompt:"Pourquoi ajouter l'or (peu corrélé aux actions technologiques déjà détenues) réduit-il davantage le risque global du portefeuille qu'une troisième action tech ?", choix:["Parce que l'or ne peut jamais perdre de valeur","Parce qu'un actif peu corrélé ne réagit pas de la même façon aux mêmes chocs de marché, ce qui amortit les variations globales du portefeuille","Parce que l'or est interdit en PEA, ce qui le rend plus sûr","Parce qu'une troisième action tech doublerait automatiquement le risque"], bonneReponse:1, explication:"Deux actifs fortement corrélés réagissent de façon similaire aux mêmes événements, ce qui n'apporte que peu de diversification. Un actif peu corrélé, comme l'or ici, réagit différemment, ce qui réduit l'amplitude globale des variations du portefeuille — sans pour autant éliminer tout risque."}
    },
    {
      title:"Lire les flux de trésorerie",
      story:[
        {heading:"Un résultat net flatteur", text:"Une entreprise affiche un résultat net de 5 M€ sur son dernier exercice, un chiffre qui impressionne à première vue."},
        {heading:"Un investissement massif", text:"En creusant les comptes, un analyste découvre que l'entreprise a aussi investi 4 M€ en capex (dépenses d'investissement) cette année-là, financés par son activité courante."}
      ],
      question:{type:"calcul", prompt:"En simplifiant (résultat net − capex), quel est le flux de trésorerie disponible approximatif de cette entreprise, en M€ ?", unit:"M€", reponse:1, tolerance:0.3, explication:"5 − 4 = 1 M€. Le résultat net peut être flatté par des éléments comptables ; le flux de trésorerie disponible montre l'argent réellement généré par l'activité une fois les investissements déduits — souvent plus révélateur de la santé financière réelle d'une entreprise."}
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
        {heading:"Un versement réfléchi", text:"Camille décide de verser 3000€ sur son PER cette année, sachant que ce montant sera déductible de son revenu imposable — mais imposé à la sortie, à la retraite."}
      ],
      question:{type:"calcul", prompt:"Avec une tranche marginale d'imposition de 30% et un versement déductible de 3000€, quelle économie d'impôt immédiate Camille obtient-elle ?", unit:"€", reponse:900, tolerance:30, explication:"3000 × 30% = 900€ d'économie d'impôt immédiate. En contrepartie, les sommes correspondantes seront en principe réintégrées à l'impôt sur le revenu à la sortie, à la retraite — l'intérêt de l'opération dépend surtout de l'écart entre la tranche d'imposition actuelle et celle anticipée au moment de la retraite."}
    }
  ],
  expert:[
    {
      title:"Introduction à la valorisation par DCF",
      story:[
        {heading:"Un flux unique à valoriser", text:"Un analyste doit estimer la valeur actuelle d'une entreprise qui, selon ses projections, générera un flux de trésorerie de 1 000 000€ dans 5 ans, et rien d'autre entre-temps pour simplifier l'exercice."},
        {heading:"Le choix du taux d'actualisation", text:"Il retient un taux d'actualisation de 8% par an, reflétant le risque et le coût du capital associés à cette entreprise."}
      ],
      question:{type:"calcul", prompt:"Avec un flux de 1 000 000€ dans 5 ans et un taux d'actualisation de 8% par an, quelle est la valeur actuelle approximative de ce flux (arrondie au millier d'euros le plus proche) ?", unit:"€", reponse:680583, tolerance:5000, explication:"Valeur actuelle = 1 000 000 / (1,08)⁵ ≈ 680 583€. Plus le taux d'actualisation retenu est élevé, plus la valeur actuelle d'un flux futur est faible — la méthode DCF est donc très sensible aux hypothèses de taux et de croissance retenues."}
    },
    {
      title:"Analyse de sensibilité",
      story:[
        {heading:"Une valorisation, plusieurs scénarios", text:"Après avoir construit un premier modèle DCF, une analyste financière fait varier son hypothèse de croissance annuelle : 2%, 4%, puis 6%, en gardant tout le reste identique."},
        {heading:"Des résultats très différents", text:"Les trois scénarios donnent des valorisations sensiblement différentes pour la même entreprise, alors qu'un seul paramètre a changé à chaque fois."}
      ],
      question:{type:"qcm", prompt:"Quel est l'intérêt principal de faire varier ainsi une hypothèse clé (comme la croissance) dans une analyse de sensibilité ?", choix:["Choisir artificiellement le scénario qui donne la valorisation la plus haute pour vendre plus cher","Mesurer la robustesse d'une valorisation et identifier les paramètres qui l'influencent le plus","Remplacer complètement le besoin de connaître les comptes de l'entreprise","Garantir que la valorisation obtenue sera exacte"], bonneReponse:1, explication:"Faire varier une hypothèse clé permet de mesurer à quel point la valorisation finale en dépend, et donc d'identifier les paramètres les plus déterminants — pas de garantir un résultat, ni de le manipuler pour arriver à une conclusion prédéfinie."}
    },
    {
      title:"Construction de portefeuille",
      story:[
        {heading:"Au-delà de la simple diversification", text:"Un gérant de portefeuille ne se contente pas de multiplier le nombre de lignes détenues : il cherche un équilibre précis entre rendement attendu, risque toléré et corrélations entre les actifs choisis."},
        {heading:"Un repère théorique", text:"Il utilise le concept de frontière efficiente pour situer différentes combinaisons possibles d'actifs, et choisir celle qui correspond le mieux à ses objectifs."}
      ],
      question:{type:"qcm", prompt:"Qu'offre, en théorie, un portefeuille situé sur la frontière efficiente ?", choix:["Une garantie de gain quel que soit le contexte de marché","Le meilleur rendement attendu possible pour un niveau de risque donné (ou le risque le plus faible pour un rendement donné)","L'absence totale de frais de gestion","Un accès automatique à tous les marchés mondiaux"], bonneReponse:1, explication:"La frontière efficiente représente, pour chaque niveau de risque, la combinaison d'actifs offrant le meilleur rendement attendu possible (ou inversement, le risque le plus faible pour un rendement donné) — un repère théorique, pas une garantie de résultat futur."}
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
  {id:"q-immobilier-003", niveau:"avance", categorie:"Immobilier", type:"qcm", question:"Qu'est-ce que le cash-flow d'un investissement locatif financé à crédit ?", choix:["Le prix d'achat du bien","La différence entre les loyers encaissés et l'ensemble des charges, crédit inclus","Le montant de l'apport initial","La plus-value latente du bien"], bonneReponse:1, explication:"Le cash-flow mesure ce qu'il reste (ou manque) chaque mois une fois toutes les charges payées, crédit compris — un indicateur clé de la viabilité réelle d'un projet à effet de levier."},

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
  {id:"q-scpi-004", niveau:"avance", categorie:"SCPI", type:"qcm", question:"Qu'est-ce que le taux de distribution d'une SCPI ?", choix:["Le pourcentage de parts détenues par l'État","Le rapport entre les revenus versés sur l'année et le prix de la part en début d'année","Le taux d'intérêt du crédit utilisé pour l'acheter","Le taux de vacance locative du parc immobilier"], bonneReponse:1, explication:"Le taux de distribution rapporte les dividendes versés au cours de l'année au prix de la part, un indicateur de rendement à comparer d'une SCPI à l'autre — sans garantir sa reconduction future."},
  {id:"q-scpi-005", niveau:"avance", categorie:"SCPI", type:"qcm", question:"Pourquoi les parts de SCPI sont-elles généralement considérées comme peu liquides ?", choix:["Parce qu'elles sont cotées en continu comme une action","Parce que leur revente peut prendre du temps, faute d'acheteur immédiat en face","Parce que la loi interdit de les revendre avant 20 ans","Parce qu'elles ne peuvent être détenues que par des professionnels"], bonneReponse:1, explication:"Contrairement à une action cotée, la revente de parts de SCPI dépend de la présence d'un acheteur (marché secondaire) ou du bon vouloir de la société de gestion, ce qui peut prendre du temps."},

  // ---- Retraite et PER ----
  {id:"q-retraite-001", niveau:"intermediaire", categorie:"Retraite et PER", type:"qcm", question:"Quel est l'un des principaux intérêts d'un PER (Plan d'Épargne Retraite) ?", choix:["Un retrait libre à tout moment sans condition", "Les versements volontaires peuvent être déduits du revenu imposable, dans certaines limites", "Un rendement garanti par l'État", "L'absence totale de frais de gestion"], bonneReponse:1, explication:"Le PER permet, sous conditions et plafonds, de déduire les versements volontaires du revenu imposable de l'année, ce qui réduit l'impôt à payer immédiatement."},
  {id:"q-retraite-002", niveau:"intermediaire", categorie:"Retraite et PER", type:"vraifaux", question:"L'argent versé sur un PER est en principe bloqué jusqu'à la retraite, sauf cas de déblocage anticipé prévus par la loi.", choix:["Vrai","Faux"], bonneReponse:0, explication:"Le PER est conçu pour l'épargne retraite : les fonds sont bloqués jusqu'au départ à la retraite, sauf exceptions comme l'achat de la résidence principale ou certains accidents de la vie."},
  {id:"q-retraite-003", niveau:"intermediaire", categorie:"Retraite et PER", type:"qcm", question:"Que se passe-t-il fiscalement si on déduit ses versements PER à l'entrée ?", choix:["Rien n'est jamais imposé, ni à l'entrée ni à la sortie","En contrepartie, les sommes seront generalement imposées à la sortie, à la retraite","Le taux d'imposition futur est automatiquement de 0%","Seuls les versements obligatoires sont concernés"], bonneReponse:1, explication:"La déduction à l'entrée n'est pas un cadeau définitif : en échange, les sommes correspondantes sont en principe réintégrées à l'impôt sur le revenu au moment de la sortie, à la retraite."},
  {id:"q-retraite-004", niveau:"avance", categorie:"Retraite et PER", type:"qcm", question:"Pourquoi la déduction fiscale d'un versement PER est-elle souvent présentée comme plus avantageuse pour une tranche marginale d'imposition élevée ?", choix:["Parce que le plafond de versement est plus élevé pour ces foyers","Parce que l'économie d'impôt à l'entrée est proportionnelle au taux marginal d'imposition, donc plus importante pour les tranches hautes","Parce que ces foyers ne paient jamais d'impôt à la sortie","Parce que la loi le réserve exclusivement aux hauts revenus"], bonneReponse:1, explication:"Un même versement déduit fait économiser d'autant plus d'impôt immédiat que le taux marginal d'imposition du foyer est élevé, ce qui rend l'arbitrage entrée/sortie potentiellement plus favorable pour les tranches hautes."},
  {id:"q-retraite-005", niveau:"avance", categorie:"Retraite et PER", type:"qcm", question:"À la retraite, sous quelle(s) forme(s) peut-on généralement récupérer l'épargne d'un PER ?", choix:["Uniquement sous forme de rente viagère, sans autre choix","Au choix (selon le contrat), en capital, en rente viagère, ou une combinaison des deux","Uniquement en une seule fois, sous forme de capital","Elle est automatiquement reversée à l'État"], bonneReponse:1, explication:"Selon les compartiments et le contrat, le PER offre en général le choix entre une sortie en capital, en rente viagère, ou un mix des deux au moment de la retraite."}
];
// ===EXPORT:QUIZ_BANK:END===

// ---------- Test de positionnement ----------
// Réutilise des questions déjà existantes dans QUIZ_BANK_FULL (aucun contenu
// dupliqué) — juste une sélection groupée par grande catégorie pédagogique.
const POSITIONING_CATEGORIES = [
  {key:'budget', label:'Budget', ids:['q-budget-001','q-budget-003']},
  {key:'epargne', label:'Épargne', ids:['q-epargne-001','q-epargne-003']},
  {key:'banque', label:'Banque & livrets', ids:['q-livreta-001']},
  {key:'credit', label:'Crédit', ids:['q-credit-001','q-credit-002']},
  {key:'interets', label:'Intérêts composés', ids:['q-intcomposes-001','q-intcomposes-003']},
  {key:'investissement', label:'Risque & rendement', ids:['q-risque-001','q-risque-002']},
  {key:'bourse', label:'Bourse', ids:['q-bourse-001','q-bourse-003']},
  {key:'etf', label:'ETF', ids:['q-etf-001']},
  {key:'diversification', label:'Diversification', ids:['q-diversification-001','q-diversification-002']},
  {key:'immobilier', label:'Immobilier', ids:['q-immobilier-001']},
  {key:'fiscalite', label:'Fiscalité', ids:['q-fiscalite-001']},
  {key:'crypto', label:'Crypto & risques', ids:['q-crypto-001']},
  {key:'arnaques', label:'Prévention des arnaques', ids:['q-arnaques-001']}
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
    exemple:"100 € placés à 6% par an valent environ 179 € après 10 ans, mais plus de 320 € après 20 ans — le gain ne double pas, il plus que triple.",
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
    avance:"La capitalisation ne reflète pas la valeur d'entreprise totale (Enterprise Value), qui intègre aussi la dette nette — un indicateur souvent plus pertinent pour comparer des sociétés à structures financières différentes.",
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
    avance:"La volatilité implicite (déduite des prix d'options) reflète les anticipations du marché sur l'ampleur des mouvements futurs, tandis que la volatilité historique se base sur les données passées — les deux peuvent diverger fortement.",
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
    avance:"Les banques centrales ciblent généralement une inflation autour de 2% par an, en ajustant leurs taux directeurs pour la contenir sans provoquer de récession — un exercice d'équilibre délicat.",
    exemple:"Une inflation de 2,1% signifie qu'un panier de biens à 100 € coûtera environ 102,10 € un an plus tard.",
    avantages:[],
    inconvenients:["Érode le pouvoir d'achat de l'épargne non rémunérée"],
    erreurs:["Ignorer l'inflation en comparant des rendements sur longue période"]
  }
];

// ---------- Index de recherche (pages + bibliothèque + actualités) ----------
const SEARCH_INDEX = [
  {title:"Accueil", url:"index.html", type:"Page"},
  {title:"Actualités", url:"actualites.html", type:"Page"},
  {title:"Bourse & comparateur", url:"bourse.html", type:"Page"},
  {title:"Crypto", url:"crypto.html", type:"Page"},
  {title:"Immobilier", url:"immobilier.html", type:"Page"},
  {title:"Finances personnelles", url:"finances-personnelles.html", type:"Page"},
  {title:"Bibliothèque", url:"bibliotheque.html", type:"Page"},
  {title:"Formations (Academy)", url:"formations.html", type:"Page"},
  {title:"Outils", url:"outils.html", type:"Page"},
  {title:"Mon compte", url:"compte.html", type:"Page"},
  {title:"Mentions légales", url:"legal.html", type:"Page"},
  {title:"À propos", url:"apropos.html", type:"Page"},
  {title:"À venir", url:"avenir.html", type:"Page"},
  ...NEWS_DATA.map(n=>({title:n.titre, url:`actualites.html#${n.id}`, type:"Actualité"})),
  ...LIBRARY.map(l=>({title:l.terme, url:`bibliotheque.html#${l.terme.replace(/\s+/g,'-')}`, type:"Définition"})),
  ...STOCKS_DEMO.map(s=>({title:s.nom+" ("+s.ticker+")", url:`bourse.html#${s.ticker}`, type:"Action"})),
  ...MARKET_DATA.map(m=>({title:m.nom, url:`marche.html#${encodeURIComponent(m.symbol)}`, type:"Marché"}))
];

