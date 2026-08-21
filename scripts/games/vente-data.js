/* ============================================================
   LIKANZA ACADEMY — Vente & Négociation
   Contrairement à Stratégie/Finance, aucune vraie catégorie de quiz
   n'existe pour ce domaine, et aucun cas de BUSINESS_CASES n'illustre
   spécifiquement la vente — plutôt que forcer un rapprochement ou
   inventer un cas, cette page s'appuie sur les concepts et sur un
   exercice d'objections : plusieurs angles de réponse par objection,
   chacun avec son raisonnement, jamais "la bonne phrase" (fidèle à la
   consigne explicite reçue).
   ============================================================ */

const VENTE_INTRO = "Vendre, ce n'est pas trouver la phrase magique qui convainc — c'est comprendre ce qui bloque réellement une personne, et y répondre honnêtement. Ci-dessous, des concepts réels et un exercice sur 5 objections courantes, chacune avec plusieurs angles de réponse possibles.";

const VENTE_ROADMAP = [
  'Comprendre les étapes du pipeline commercial',
  'Qualifier avant de convaincre',
  'Reconnaître les objections les plus courantes',
  "S'entraîner à y répondre sans phrase magique",
  'Comprendre ce que change vraiment le closing'
];

const VENTE_CONCEPTS = ['Prospection', 'Pipeline commercial', 'Qualification', 'Objections (commerciales)', 'Négociation', 'Closing'];

const VENTE_CONSEILS = [
  {
    titre: 'Avant de présenter une offre complète',
    etapes: [
      'Vérifie que la personne a vraiment le problème que tu résous.',
      'Identifie qui décide et qui paie — pas seulement qui utilise.',
      "Si l'un des deux manque, qualifie davantage avant d'investir plus de temps."
    ]
  },
  {
    titre: 'Face à une objection, avant de répondre',
    etapes: [
      "Demande-toi si c'est la vraie objection, ou si elle en cache une autre.",
      'Reformule ce que tu as compris, pour vérifier que tu réponds au bon problème.',
      "Explore au moins 2 angles de réponse possibles avant de choisir, plutôt qu'une réponse automatique."
    ]
  }
];

const VENTE_MISTAKES = [
  {titre: 'Chercher la phrase magique plutôt que comprendre le blocage', description: "Une réponse toute faite qui ne répond pas à la vraie inquiétude du prospect ne convainc personne, même bien formulée."},
  {titre: 'Céder sur le prix dès la première objection', description: "Céder sans contrepartie peut faire perdre de la marge sans même répondre au vrai frein — qui n'est pas toujours le prix."},
  {titre: 'Continuer à insister avec un prospect non qualifié', description: "Sans budget, sans besoin réel ou sans pouvoir de décision, aucune technique de vente ne fera aboutir une négociation."}
];

const VENTE_APPROFONDIR = [
  {label: 'Clients', description: 'Comprendre qui décide, qui paie, quelles sont les vraies objections.', href: 'clients.html'},
  {label: 'Marketing', description: 'Ce qui amène un prospect qualifié jusqu\'à toi, avant même la vente.', href: 'marketing.html'},
  {label: 'Bibliothèque — Business', description: 'Toutes les définitions complètes, avec exemples et erreurs fréquentes.', href: 'bibliotheque.html#theme:Business'}
];

// Exercice : chaque objection a plusieurs angles de réponse possibles avec
// leur raisonnement — jamais une seule "bonne réponse" présentée comme
// universelle.
const VENTE_OBJECTIONS = [
  {
    id: 'trop-cher', objection: '« C\'est trop cher »',
    angles: [
      {titre: 'Recentrer sur la valeur plutôt que le prix', raisonnement: "Un prix n'a de sens que comparé à ce qu'il rapporte — demander à quoi la personne compare ce prix peut révéler que la comparaison n'est pas la bonne."},
      {titre: 'Proposer une contrepartie plutôt qu\'une baisse pure', raisonnement: "Baisser le prix sans rien en retour peut créer un précédent difficile à défaire ; un engagement plus long ou un volume plus grand peut compenser sans détruire la marge."},
      {titre: "Accepter que ce prospect n'est peut-être pas le bon, cette fois", raisonnement: "Certains prospects ne sont simplement pas qualifiés budgétairement — insister à tout prix coûte du temps qui pourrait servir ailleurs."}
    ]
  },
  {
    id: 'confiance', objection: '« Je ne vous connais pas / je n\'ai pas confiance »',
    angles: [
      {titre: 'Réduire le risque perçu plutôt que convaincre par le discours', raisonnement: "Une période d'essai, une garantie ou des références vérifiables répondent souvent mieux au manque de confiance qu'un argumentaire supplémentaire."},
      {titre: "Comprendre d'où vient précisément la méfiance", raisonnement: "Elle peut viser l'entreprise, le produit ou le secteur en général — la réponse utile n'est pas la même selon le cas."}
    ]
  },
  {
    id: 'reflexion', objection: '« Je dois réfléchir / en parler à mon équipe »',
    angles: [
      {titre: 'Identifier ce qui reste réellement en suspens', raisonnement: '"Réfléchir" cache souvent une objection non exprimée (prix, confiance, timing) — demander directement ce qui manque peut la faire émerger.'},
      {titre: 'Respecter le délai sans relancer à l\'aveugle', raisonnement: "Proposer un point de suivi à une date précise plutôt que de relancer sans structure évite de paraître pressant sans faire avancer les choses."}
    ]
  },
  {
    id: 'concurrent', objection: '« Je suis déjà chez un concurrent »',
    angles: [
      {titre: 'Comprendre ce qui fonctionne et ne fonctionne pas chez le concurrent', raisonnement: "Dénigrer un concurrent affaiblit généralement la crédibilité ; comprendre les frictions réelles du prospect ouvre une vraie discussion."},
      {titre: "Ne pas insister si le prospect est réellement satisfait", raisonnement: "Un client globalement satisfait de son fournisseur actuel n'est parfois simplement pas une priorité à ce moment précis."}
    ]
  },
  {
    id: 'timing', objection: '« Ce n\'est pas le bon moment »',
    angles: [
      {titre: 'Comprendre ce qui rendrait le moment bon', raisonnement: '"Pas le bon moment" reste vague — demander ce qui doit changer précisément permet de savoir si, et quand, revenir vers ce prospect.'},
      {titre: 'Accepter un suivi à plus long terme sans forcer', raisonnement: "Certains cycles de décision sont longs et hors du contrôle du vendeur — forcer une décision prématurée peut nuire à la relation sur la durée."}
    ]
  }
];
