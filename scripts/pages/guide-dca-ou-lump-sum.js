/* ============================================================
   LIKANZA ACADEMY — Guide : DCA ou investir tout d'un coup ?
   Chantier "Guides & Décryptages", phase 3 (Gold Standard Guide). Choisi
   plutôt que "PEA ou CTO ?"/"ETF ou stock picking ?" (suggestions du prompt
   d'origine) : c'est le seul sujet où un vrai outil de simulation existe
   déjà dans le Laboratoire (widget-invest-dca, comparaison DCA vs
   investissement unique sur de vraies données Yahoo Finance) — la boucle
   Guide → Simulation → Retour peut donc être testée honnêtement, sans
   fabriquer un outil pour l'occasion.

   Chiffres vérifiés : la statistique "environ deux tiers du temps" et la
   source Vanguard ont été confirmées par recherche web le 05/09/2026 (la
   page Vanguard elle-même renvoie vers son étude complète en PDF plutôt que
   de citer le chiffre exact en clair ; la fourchette 61,6%-73,7% et la
   moyenne ~66% ressortent de façon cohérente sur plusieurs sources
   secondaires indépendantes citant la même étude Vanguard 1976-2022) —
   présentée ici avec la période et la nuance nécessaires, jamais comme une
   loi universelle. Le guide AMF cité est réel (amf-france.org).
   ============================================================ */
const GUIDE_DCA_OU_LUMP_SUM = {
  slug: 'dca-ou-lump-sum',
  question: "DCA ou investir tout d'un coup ?",
  title: "DCA ou investir tout d'un coup ? Ce que montrent vraiment les données",
  shortAnswer: "Sur le plan strictement statistique, investir tout son capital en une fois a historiquement mieux performé qu'un versement étalé dans le temps, sur les marchés actions étudiés — parce que les marchés montent plus souvent qu'ils ne baissent, donc laisser de l'argent de côté a un coût d'opportunité. Mais un versement progressif (DCA) réduit le risque de tomber sur un très mauvais point d'entrée et peut être plus facile à tenir psychologiquement. Le bon choix dépend surtout de ta tolérance à voir un capital investi baisser rapidement, pas d'un \"meilleur\" chiffre universel.",
  category: 'choisir',
  difficulty: 'intermediaire',
  readingTime: '9 min',
  publishedAt: '2026-09-05',
  updatedAt: '2026-09-05',
  freshness: 'semi-dynamic',
  concepts: ['ETF', 'Volatilité', 'Diversification', 'Tolérance au risque', 'Horizon de placement'],
  relatedTools: [{label: 'Comparateur DCA historique (Laboratoire)', url: 'laboratoire.html#tab-investissement'}],
  relatedCourse: {id: 'risque-diversification', chapitre: 'Volatilité et diversification : le risque au niveau du portefeuille'},
  sections: [
    {
      type: 'texte',
      texte: "Tu as un capital disponible — un héritage, une prime, une épargne accumulée — et tu hésites entre deux façons de l'investir en Bourse : tout placer en une seule fois (<em>lump sum</em>), ou l'étaler par petites sommes régulières sur plusieurs mois (le <em>Dollar-Cost Averaging</em>, DCA, aussi appelé versement programmé). Les deux stratégies sont réelles, réellement utilisées, et aucune n'est universellement \"la bonne\"."
    },
    {
      type: 'definition',
      texte: "<strong>Investissement en une fois (lump sum)</strong> : tu places l'intégralité de ton capital disponible dès aujourd'hui, en un seul ordre. <strong>DCA / versement programmé</strong> : tu divises ce même capital en plusieurs versements égaux, investis à intervalles réguliers (souvent mensuels) sur une période que tu choisis (par exemple 12 mois)."
    },
    {
      type: 'diagram',
      title: 'Pourquoi investir en une fois gagne le plus souvent, statistiquement',
      steps: [
        'Les marchés actions montent plus souvent que sur une année donnée qu\'ils ne baissent',
        'Une somme non investie (en attente d\'être versée par tranches) ne profite pas de cette hausse pendant qu\'elle attend',
        'Ce manque à gagner s\'appelle le "coût d\'opportunité" du cash en attente',
        'Sur une majorité de périodes historiques, ce coût d\'opportunité dépasse le bénéfice du lissage du DCA'
      ]
    },
    {
      type: 'comparisonTable',
      intro: "Aucune des deux stratégies n'est un \"gagnant\" universel : chacune répond à un besoin différent.",
      columns: [{key: 'lump', label: 'En une fois'}, {key: 'dca', label: 'DCA / programmé'}],
      rows: [
        {label: 'Performance moyenne historique (marchés actions)', values: {lump: 'Plus élevée en moyenne sur la période étudiée', dca: 'Plus faible en moyenne sur la période étudiée'}},
        {label: 'Risque de \"mauvais point d\'entrée\"', values: {lump: 'Concentré sur un seul jour', dca: 'Réparti sur plusieurs mois'}},
        {label: "Confort psychologique face à une baisse rapide", values: {lump: "Peut être difficile si le marché chute juste après", dca: "Souvent plus facile à vivre, achats à prix moyenné"}},
        {label: 'Discipline requise', values: {lump: 'Une seule décision', dca: 'Plusieurs versements à tenir dans la durée'}},
        {label: 'Cas où cela a historiquement mieux marché', values: {lump: 'Marché globalement haussier sur la période', dca: 'Juste avant ou pendant une baisse prolongée (ex. fin 2007 / 2008)'}}
      ],
      note: 'Comparaison conceptuelle, pas un calcul sur un capital ou une période précise — utilise le comparateur du Laboratoire (lien en bas de page) pour un vrai calcul avec tes propres chiffres.'
    },
    {
      type: 'interactive',
      variant: 'percentDrop',
      initialCapital: 1000,
      options: [10, 20, 30, 50]
    },
    {
      type: 'pourquoi',
      texte: "L'exemple ci-dessus illustre une asymétrie centrale au débat DCA vs lump sum : une perte de 50 % nécessite un gain de +100 % pour revenir au capital de départ, pas simplement +50 %. Plus la baisse initiale est brutale, plus il faut une remontée disproportionnée pour la compenser — c'est exactement le scénario qu'un versement en une fois expose davantage, et qu'un DCA amortit en n'exposant qu'une fraction du capital à ce risque à un instant donné."
    },
    {
      type: 'mythReality',
      myth: 'Le DCA protège contre toute perte en capital.',
      reality: "Non. Le DCA réduit le risque de tomber sur un seul très mauvais jour d'entrée, mais si le marché baisse sur toute la durée des versements (par exemple 12 mois de baisse continue), le DCA n'empêche pas la perte — il peut même, une fois tout le capital versé, se retrouver dans une situation proche de l'investissement en une fois."
    },
    {
      type: 'casReel',
      texte: "Selon les recherches de Vanguard portant sur les marchés américains entre 1976 et 2022, un investissement en une fois a historiquement surperformé un versement étalé sur 12 mois dans environ deux tiers des périodes glissantes étudiées, pour un portefeuille 100% actions — principalement parce que les marchés actions montent plus souvent qu'ils ne baissent sur ce type d'horizon. La même étude souligne une exception notable : un DCA démarré juste avant une crise majeure (comme fin 2007, avant la crise financière de 2008) peut surperformer un investissement en une fois réalisé au même moment, puisque les versements suivants achètent à des prix progressivement plus bas."
    },
    {
      type: 'risks',
      items: [
        {label: 'Risque de marché (les deux stratégies)', texte: "Un ETF ou une action peut perdre une part importante de sa valeur, quelle que soit la façon dont le capital a été investi — aucune des deux stratégies n'élimine ce risque."},
        {label: "Risque de timing (surtout en une fois)", texte: "Investir tout ton capital juste avant une baisse marquée expose l'intégralité de la somme au même instant défavorable."},
        {label: 'Risque comportemental (surtout en DCA)', texte: "Interrompre les versements programmés après une baisse (par peur) annule justement l'avantage du DCA, qui repose sur le fait de continuer à acheter y compris quand les prix sont bas."},
        {label: "Risque de rester trop longtemps en cash", texte: "Étaler un DCA sur une durée très longue (plusieurs années) sans raison précise peut faire perdre plus de temps de marché que nécessaire, sans réduire davantage le risque de timing au-delà d'un certain point."}
      ]
    },
    {
      type: 'faq',
      items: [
        {question: 'Puis-je combiner les deux approches ?', reponse: "Oui — rien n'empêche d'investir une partie du capital immédiatement et d'étaler le reste sur quelques mois. Ce n'est pas un choix binaire obligatoire."},
        {question: "Le DCA a-t-il un intérêt si je n'ai pas un gros capital de départ ?", reponse: "Le DCA est aussi, et surtout, la façon dont fonctionne l'épargne régulière classique (versement mensuel sur un salaire) — dans ce cas, ce n'est pas vraiment un choix face à un capital disponible, mais simplement la façon dont l'argent arrive au fil du temps."},
        {question: 'Sur combien de mois étaler un DCA si je choisis cette option ?', reponse: "Il n'existe pas de durée officiellement \"optimale\" — 6 à 12 mois est une fourchette courante dans la pratique, au-delà de laquelle l'avantage de réduction du risque de timing s'amenuise sans disparaître complètement."}
      ]
    },
    {
      type: 'simulationCTA',
      intro: "Le tableau ci-dessus reste conceptuel. Le Laboratoire compare les deux stratégies sur de vraies données historiques (MSCI World, S&amp;P 500, CAC 40 et d'autres supports réels), à partir de la mensualité que tu indiques.",
      label: 'Comparer les deux stratégies →',
      targetUrl: 'laboratoire.html#tab-investissement',
      fields: [
        {key: 'mensualite', label: 'Mensualité que tu envisages (€)', default: 200}
      ]
    }
  ],
  methodology: {
    calcul: "Le tableau comparatif de cette page est conceptuel (basé sur des tendances générales), jamais un calcul sur un capital réel — pour un vrai calcul, utilise le comparateur DCA du Laboratoire, qui applique de vraies mensualités à de vrais historiques de cours (Yahoo Finance).",
    donnees: "La statistique \"environ deux tiers des cas\" provient de recherches Vanguard sur les marchés américains, période 1976-2022, portefeuille 100% actions.",
    hypotheses: "La mini-interaction \"imagine ton portefeuille perdre X%\" applique une baisse instantanée hypothétique à un capital de 1000€ fictif, uniquement pour illustrer l'asymétrie perte/récupération — ce n'est jamais une prédiction ni un scénario probable pour un actif réel donné.",
    limites: "Aucune performance passée, y compris les statistiques Vanguard citées, ne garantit un résultat futur. Le \"meilleur\" choix entre DCA et investissement en une fois dépend aussi de facteurs non capturés par ces statistiques : ta tolérance réelle au risque, ta situation personnelle, et l'horizon de placement visé."
  },
  sources: [
    {title: 'How to invest a lump sum of money (Dollar-cost averaging vs. lump-sum investing)', publisher: 'Vanguard', date: '2024', url: 'https://investor.vanguard.com/investor-resources-education/online-trading/dollar-cost-averaging-vs-lump-sum', sourceType: 'institutional'},
    {title: "Investir votre épargne : étape par étape", publisher: 'Autorité des marchés financiers (AMF)', url: 'https://www.amf-france.org/sites/institutionnel/files/resource/Lire%20le%20guide%20pedagogique%20%20Investir%20votre%20epargne%20etape%20par%20etape%20.pdf', sourceType: 'institutional'}
  ]
};

renderGuidePage('guideContent', GUIDE_DCA_OU_LUMP_SUM);
