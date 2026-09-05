/* ============================================================
   LIKANZA ACADEMY — Guide : Acheter ou louer son logement ?
   Chantier "Guides & Décryptages", batch 2 (8e guide). Choisi pour son pont
   de simulation réel : le Laboratoire dispose déjà d'un comparateur
   patrimoine net acheteur/locataire (computeBuyVsRent, widget labBuyRentCard,
   onglet tab-logement) qui tient compte du coût d'opportunité de l'apport
   — pas juste "mensualité vs loyer". Seuls prix du bien et loyer équivalent
   sont transmis au clic (les deux seules valeurs qu'un lecteur connaît
   d'emblée), sur une clé de contexte propre à ce guide
   (guide-simulation-acheter-ou-louer, jamais la clé générique du guide DCA,
   pour éviter qu'un widget vole le contexte destiné à l'autre sur la même
   page Laboratoire).

   Chiffres vérifiés le 05/09/2026 par recherche web :
   - Frais de notaire : environ 7 à 8,5 % du prix dans l'ancien, 2 à 3 %
     dans le neuf (dont une large majorité reversée à l'État/collectivités
     sous forme de droits de mutation) — recoupé sur plusieurs sources
     professionnelles indépendantes (Pretto, Crédit Agricole, MeilleureSCPI).
   ============================================================ */
const GUIDE_ACHETER_OU_LOUER = {
  slug: 'acheter-ou-louer',
  question: 'Acheter ou louer son logement ?',
  title: 'Acheter ou louer son logement ? Ce qu\'il faut comparer avant de décider',
  shortAnswer: "Il n'existe pas de réponse universelle. Devenir propriétaire devient généralement plus avantageux que louer au-delà d'un certain nombre d'années de détention, principalement parce que les frais d'achat (notaire, parfois agence) doivent d'abord être amortis — mais ce nombre d'années dépend entièrement du prix du bien, du loyer équivalent, du taux de crédit et de ce que rapporterait l'apport s'il était investi ailleurs plutôt qu'immobilisé dans le bien. Un chiffre générique ne veut rien dire pour ta situation : utilise le comparateur du Laboratoire avec tes propres montants pour obtenir TON horizon de rentabilité.",
  category: 'choisir',
  difficulty: 'intermediaire',
  readingTime: '9 min',
  publishedAt: '2026-09-05',
  updatedAt: '2026-09-05',
  freshness: 'semi-dynamic',
  concepts: ['Crédit immobilier', 'Apport personnel'],
  relatedCourse: {id: 'budget-securite', chapitre: 'Ta valeur nette : ce que tu possèdes vraiment'},
  sections: [
    {
      type: 'texte',
      texte: "\"Acheter, c'est arrêter de payer pour le propriétaire d'un autre\" est l'un des raisonnements les plus répétés sur le logement — et l'un des plus incomplets. Devenir propriétaire immobilise un apport qui aurait pu être investi ailleurs, engage des frais d'achat élevés dès le départ, et lie à un bien difficile à revendre rapidement. Louer, à l'inverse, offre une flexibilité réelle mais ne construit aucun patrimoine immobilier direct. Comparer les deux sérieusement demande de regarder au-delà de la seule mensualité comparée au loyer."
    },
    {
      type: 'definition',
      texte: "<strong>Acheter</strong> : financer un bien (souvent via un crédit immobilier complété par un apport personnel), en devenant propriétaire d'un actif qui prend ou perd de la valeur, tout en payant les frais d'achat, la taxe foncière et l'entretien. <strong>Louer</strong> : payer un loyer pour occuper un bien sans en devenir propriétaire, en gardant la liberté de déménager plus facilement et en pouvant investir ailleurs la somme qui aurait servi d'apport."
    },
    {
      type: 'diagram',
      title: "Pourquoi la durée de détention change tout",
      steps: [
        "Un achat immobilier engage des frais initiaux élevés dès la signature : frais de notaire (environ 7-8 % du prix dans l'ancien, 2-3 % dans le neuf), parfois frais d'agence",
        "Ces frais ne sont récupérés qu'au fil du temps, à mesure que le bien est détenu et, potentiellement, prend de la valeur",
        "Plus la durée de détention est longue, plus ces frais fixes sont amortis sur un grand nombre d'années",
        "En dessous d'un certain nombre d'années de détention, ces frais peuvent ne jamais être totalement compensés par rapport à la location — d'où l'importance de connaître SON horizon de rentabilité avant de décider"
      ]
    },
    {
      type: 'comparisonTable',
      intro: "Aucune des deux options n'est un \"gagnant\" universel : le résultat dépend du prix, du loyer équivalent, du taux de crédit et de la durée de détention envisagée — voir la simulation en bas de page pour tes propres chiffres.",
      columns: [{key: 'acheter', label: 'Acheter'}, {key: 'louer', label: 'Louer'}],
      rows: [
        {label: 'Frais initiaux', values: {acheter: "Frais de notaire (7-8 % ancien, 2-3 % neuf), parfois frais d'agence et de garantie", louer: 'Dépôt de garantie (généralement 1 à 2 mois de loyer), remboursable en fin de bail'}},
        {label: "Coût d'opportunité de l'apport", values: {acheter: "L'apport est immobilisé dans le bien, il ne peut plus être investi ailleurs", louer: "L'équivalent de l'apport peut être investi ailleurs (Bourse, épargne...) pendant toute la durée de la location"}},
        {label: 'Évolution du coût mensuel', values: {acheter: 'Mensualité de crédit généralement fixe (hors taux variable), jusqu\'à la fin du prêt', louer: "Loyer révisable chaque année, généralement à la hausse"}},
        {label: 'Flexibilité pour déménager', values: {acheter: 'Revente qui prend du temps et génère des frais (agence, diagnostics)', louer: "Préavis de quelques mois, sans frais de revente"}},
        {label: 'Charges à la charge de l\'occupant', values: {acheter: 'Taxe foncière, entretien, grosses réparations, charges de copropriété', louer: "Charges locatives courantes uniquement, les grosses réparations restent au propriétaire"}},
        {label: 'Patrimoine construit', values: {acheter: 'Un actif (le bien) dont la valeur peut monter ou baisser selon le marché local', louer: "Aucun patrimoine immobilier direct construit par le loyer versé"}}
      ],
      note: 'Comparaison conceptuelle, pas un calcul sur ta situation précise — utilise le comparateur du Laboratoire (lien en bas de page) pour un vrai calcul avec tes propres chiffres.'
    },
    {
      type: 'mythReality',
      myth: "Payer un loyer, c'est \"jeter de l'argent par les fenêtres\" alors qu'un crédit immobilier construit toujours du patrimoine.",
      reality: "Pas nécessairement, une fois le coût d'opportunité de l'apport pris en compte. L'équivalent de l'apport, s'il était investi ailleurs pendant la durée de la location plutôt qu'immobilisé dans un achat, peut lui aussi produire un rendement réel — c'est un vrai coût, pas un argument rhétorique. Le comparateur du Laboratoire calcule précisément ce patrimoine net alternatif (apport investi + différence de coût mensuel investie chaque mois), pas seulement \"mensualité vs loyer\"."
    },
    {
      type: 'risks',
      items: [
        {label: "Sous-estimer les frais d'achat", texte: "Les frais de notaire (7-8 % dans l'ancien) et d'éventuels frais d'agence représentent une somme immédiate significative, souvent sous-estimée au moment de comparer avec un loyer mensuel."},
        {label: "Immobiliser toute son épargne dans l'apport", texte: "Vider son épargne de précaution pour maximiser l'apport expose à devoir emprunter ou revendre en catastrophe au moindre imprévu — l'apport personnel ne doit jamais absorber la totalité de l'épargne disponible."},
        {label: 'Sous-estimer les charges d\'un bien détenu', texte: "Taxe foncière, entretien courant et grosses réparations (toiture, chaudière...) s'ajoutent à la mensualité de crédit et sont parfois absents des comparaisons rapides."},
        {label: 'Acheter sur un horizon trop court', texte: "Revendre un bien peu d'années après l'achat expose au risque de ne pas avoir amorti les frais de notaire, en plus des frais de revente (agence, diagnostics) — l'achat est structurellement pensé pour une détention longue."}
      ]
    },
    {
      type: 'faq',
      items: [
        {question: "Existe-t-il un nombre d'années universel à partir duquel acheter devient rentable ?", reponse: "Non. Ce seuil dépend du prix du bien, du loyer équivalent, du taux de crédit, des frais d'achat et de ce que rapporterait l'apport investi ailleurs — un chiffre générique circulant en ligne ne s'applique pas forcément à ta situation. Utilise le comparateur du Laboratoire avec tes propres montants."},
        {question: "L'apport doit-il toujours être le plus élevé possible ?", reponse: "Pas nécessairement. Un apport plus élevé réduit le montant emprunté et le coût total du crédit, mais immobilise une épargne qui ne peut plus être investie ailleurs — et ne doit jamais entamer l'épargne de précaution."},
        {question: "Le comparateur du Laboratoire tient-il compte de la revente du bien ?", reponse: "Il compare le patrimoine net (valeur du bien moins capital restant dû côté propriétaire, apport et différence de coût investis côté locataire) sur plusieurs horizons — c'est cette valeur, pas seulement la mensualité, qui détermine si acheter ou louer laisse le patrimoine le plus élevé à un horizon donné."}
      ]
    },
    {
      type: 'simulationCTA',
      intro: "Le tableau ci-dessus reste conceptuel. Le Laboratoire compare le patrimoine net réel entre achat et location, sur plusieurs horizons, à partir du prix du bien et du loyer équivalent que tu indiques.",
      label: 'Comparer acheter et louer →',
      targetUrl: 'laboratoire.html#tab-logement',
      fields: [
        {key: 'price', label: 'Prix du bien envisagé (€)', default: 250000},
        {key: 'loyer', label: 'Loyer équivalent (€/mois)', default: 850}
      ]
    }
  ],
  methodology: {
    calcul: "Le tableau comparatif de cette page est conceptuel, pas un calcul sur ta situation réelle — pour un vrai calcul, utilise le comparateur Acheter ou louer du Laboratoire, qui simule mois par mois le patrimoine net des deux options (computeBuyVsRent).",
    donnees: "Les frais de notaire cités (7-8,5 % dans l'ancien, 2-3 % dans le neuf) sont recoupés sur plusieurs sources professionnelles indépendantes du secteur du courtage immobilier, cohérentes entre elles sur ces ordres de grandeur pour 2026.",
    hypotheses: "Le schéma \"pourquoi la durée change tout\" illustre un mécanisme général (l'amortissement des frais fixes dans le temps), jamais un nombre d'années précis applicable à toute situation.",
    limites: "Les frais de notaire, taux de crédit et évolutions de prix immobiliers varient selon la localisation, le type de bien et les conditions de marché du moment — les ordres de grandeur cités ici ne remplacent jamais une simulation avec les chiffres réels d'un bien précis, ni un avis notarial ou bancaire personnalisé."
  },
  sources: [
    {title: 'Frais de notaire 2026 : calcul et barème', publisher: 'Pretto', date: '2026', url: 'https://www.pretto.fr/notaire-immobilier/frais-de-notaire/bareme-frais-de-notaire/', sourceType: 'secondary'},
    {title: 'Frais de notaire dans l\'ancien : calcul, taux 2026 et exemples', publisher: 'Crédit Agricole', date: '2026', url: 'https://e-immobilier.credit-agricole.fr/conseils/reglementation/comment-sont-calcules-les-frais-de-notaire-dans-lancien', sourceType: 'secondary'}
  ]
};

renderGuidePage('guideContent', GUIDE_ACHETER_OU_LOUER);
