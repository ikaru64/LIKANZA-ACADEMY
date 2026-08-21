/* ============================================================
   LIKANZA ACADEMY — Profil investisseur
   Capital / horizon / objectif / tolérance au risque, cette dernière
   évaluée via plusieurs questions réelles (jamais un simple curseur).
   Le résultat est toujours présenté comme un "profil de risque
   estimé", jamais une vérité psychologique — voir renderProfileResult
   dans investor-profile.js.
   ============================================================ */

const INVESTOR_CAPITAL_OPTIONS = [500, 1000, 5000, 10000, 50000];

const INVESTOR_HORIZON_OPTIONS = [
  {value: 'court', label: 'Court terme', detail: 'moins de 2 ans'},
  {value: 'moyen', label: 'Moyen terme', detail: '2 à 5 ans'},
  {value: 'long', label: 'Long terme', detail: 'plus de 5 ans'}
];

const INVESTOR_OBJECTIF_OPTIONS = [
  {value: 'croissance', label: 'Croissance du capital'},
  {value: 'revenus', label: 'Revenus / dividendes réguliers'},
  {value: 'preserver', label: 'Préserver le capital'},
  {value: 'projet', label: "Préparer un projet précis"},
  {value: 'retraite', label: 'Préparer la retraite'},
  {value: 'diversification', label: 'Diversifier une épargne existante'},
  {value: 'apprendre', label: 'Apprendre, comprendre comment ça marche'},
  {value: 'autre', label: 'Autre'}
];

// Tolérance au risque : plusieurs questions réelles, chaque option a un
// poids — le score total détermine un profil ESTIMÉ (prudent/équilibré/
// dynamique), jamais présenté comme un diagnostic psychologique fiable.
const INVESTOR_RISK_QUESTIONS = [
  {
    id: 'reaction10',
    question: "Si la valeur de ton investissement baissait de 10 % en quelques semaines, tu...",
    options: [
      {value: 'vendre-tout', label: "vendrais tout pour éviter d'autres pertes", weight: 0},
      {value: 'vendre-partie', label: 'vendrais une partie par précaution', weight: 1},
      {value: 'rien-faire', label: 'ne ferais rien, tu attendrais', weight: 2},
      {value: 'acheter-plus', label: "en profiterais pour investir davantage", weight: 3}
    ]
  },
  {
    id: 'reaction20',
    question: 'Et si la baisse atteignait 20 % ?',
    options: [
      {value: 'vendre-tout', label: "vendrais tout pour éviter d'autres pertes", weight: 0},
      {value: 'vendre-partie', label: 'vendrais une partie par précaution', weight: 1},
      {value: 'rien-faire', label: 'ne ferais rien, tu attendrais', weight: 2},
      {value: 'acheter-plus', label: "en profiterais pour investir davantage", weight: 3}
    ]
  },
  {
    id: 'besoin-argent',
    question: 'As-tu besoin de cet argent dans les 2 prochaines années, même en cas d\'imprévu ?',
    options: [
      {value: 'oui', label: 'Oui, probablement', weight: 0},
      {value: 'possible', label: "C'est possible mais pas certain", weight: 1},
      {value: 'non', label: "Non, cet argent n'est pas nécessaire à court terme", weight: 2}
    ]
  },
  {
    id: 'experience',
    question: 'Ton expérience en investissement ?',
    options: [
      {value: 'debutant', label: "Je débute, je n'ai jamais investi", weight: 0},
      {value: 'un-peu', label: "J'ai déjà investi un peu", weight: 1},
      {value: 'experimente', label: 'Je gère mes placements depuis plusieurs années', weight: 2}
    ]
  },
  {
    id: 'diversification-actuelle',
    question: 'Ton épargne actuelle est...',
    options: [
      {value: 'concentre', label: "concentrée sur un seul placement ou un seul type d'actif", weight: 0},
      {value: 'quelques', label: 'répartie sur quelques placements différents', weight: 1},
      {value: 'diversifie', label: 'déjà bien diversifiée (plusieurs classes d\'actifs, zones)', weight: 2}
    ]
  },
  {
    id: 'perte-quotidien',
    question: 'Une perte de 15 % de cet investissement affecterait ton quotidien ?',
    options: [
      {value: 'beaucoup', label: 'Oui, significativement', weight: 0},
      {value: 'un-peu', label: "Un peu, mais je m'en remettrais", weight: 1},
      {value: 'pas-du-tout', label: "Pas du tout, ce n'est qu'une partie de mon épargne", weight: 2}
    ]
  }
];
