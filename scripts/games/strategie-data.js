/* ============================================================
   LIKANZA ACADEMY — Stratégie
   Concepts réels de la Bibliothèque, exemples reliés à de vrais cas
   déjà sourcés dans BUSINESS_CASES (jamais un nouveau chiffre inventé
   pour l'occasion), conseils actionnables, erreurs fréquentes, et un
   lien vers Compare Strategies + un vrai quiz existant.
   ============================================================ */

const STRATEGIE_INTRO = "Il n'existe pas une seule bonne stratégie face à la concurrence — des entreprises avec des ressources, des marchés et des contraintes différentes ont réussi avec des approches opposées. Comprendre les options aide à choisir la tienne, pas à copier celle d'une autre.";

const STRATEGIE_ROADMAP = [
  'Comprendre la concurrence et le marché',
  'Choisir comment te différencier',
  "Évaluer ce qui te protège d'un nouvel entrant",
  'Fixer ta stratégie de prix',
  'Étudier de vraies stratégies déjà utilisées',
  'Comparer plusieurs approches sur un même problème'
];

const STRATEGIE_CONCEPTS = ['Analyse de marché', 'Positionnement', 'Avantage concurrentiel', 'Barrières à l\'entrée', 'Niche', 'Stratégie de prix', 'Économies d\'échelle', 'Effet réseau', 'Intégration verticale', 'Diversification', 'Croissance'];

const STRATEGIE_EXEMPLES = [
  {caseId: 'apple', angle: "Différenciation par l'intégration d'un écosystème entier, pas un seul produit"},
  {caseId: 'starbucks', angle: "Différenciation par l'expérience — et ce qui se passe quand elle s'érode"},
  {caseId: 'netflix-streaming', angle: 'Transformation stratégique face à un marché qui change de nature'},
  {caseId: 'costco', angle: 'Le modèle économique lui-même comme arme stratégique face au prix'},
  {caseId: 'airbnb', angle: "L'effet réseau comme barrière à l'entrée pour un nouveau concurrent"}
];

const STRATEGIE_CONSEILS = [
  {
    titre: 'Avant de baisser ton prix face à un concurrent',
    etapes: [
      'Vérifie que ta marge actuelle supporte vraiment une baisse (calcul dans Business Lab).',
      "Demande-toi si le client compare vraiment sur le prix, ou sur autre chose que tu ignores.",
      'Envisage une différenciation plutôt qu\'une guerre des prix, rarement gagnable pour le plus petit acteur.'
    ]
  },
  {
    titre: 'Pour évaluer ton avantage concurrentiel réel',
    etapes: [
      'Liste ce qu\'un concurrent devrait faire, concrètement, pour te copier.',
      'Estime combien de temps et de ressources ça lui prendrait.',
      "Si la réponse est \"quelques semaines\", ce n'est probablement pas un avantage durable."
    ]
  }
];

const STRATEGIE_MISTAKES = [
  {titre: 'Confondre différenciation superficielle et réelle', description: "Un simple changement de couleur ou de slogan n'est pas une différenciation durable si le produit ou le service reste identique."},
  {titre: 'Copier une stratégie sans tenir compte du contexte', description: "Une stratégie qui a marché pour une entreprise dépendait de ses ressources, sa marque et son marché — l'appliquer telle quelle ailleurs ignore ces différences."},
  {titre: "Sous-estimer ou surestimer les barrières à l'entrée", description: "Se lancer sans vérifier ce qui protège réellement les acteurs en place, ou au contraire renoncer à un marché en réalité accessible."}
];

const STRATEGIE_APPROFONDIR = [
  {label: 'Compare Strategies', description: 'Voir plusieurs entreprises face au même problème, côte à côte.', href: 'business-cases.html'},
  {label: 'Business Models', description: "Comment ces stratégies se traduisent concrètement en revenu.", href: 'business-cases.html'},
  {label: 'Construire mon idée', description: 'Appliquer ces notions à ton propre projet, étape par étape.', href: 'construire-son-projet.html'}
];

const STRATEGIE_QUIZ_HREF = 'defis.html?cat=Diversification';
