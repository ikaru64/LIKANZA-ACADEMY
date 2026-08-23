/* ============================================================
   LIKANZA ACADEMY — Finance d'entreprise
   Concepts réels de la Bibliothèque, exemples reliés à de vrais cas
   déjà sourcés dans BUSINESS_CASES (jamais un nouveau chiffre inventé
   pour l'occasion), conseils actionnables, erreurs fréquentes, un
   calculateur associé (Unit Economics) et un vrai quiz existant.
   ============================================================ */

const FINANCE_INTRO = "Une entreprise peut avoir beaucoup de clients et pourtant manquer d'argent. Le chiffre d'affaires n'est pas le bénéfice, une entreprise rentable peut avoir des problèmes de trésorerie, et ces distinctions ne sont pas des détails techniques — elles déterminent si une entreprise survit ou non.";

const FINANCE_ROADMAP = [
  "Comprendre pourquoi chiffre d'affaires ne veut pas dire bénéfice",
  'Distinguer marge, rentabilité et trésorerie',
  'Comprendre le point mort et le seuil de rentabilité',
  "Voir ce que la dette et la dilution changent vraiment",
  'Étudier un vrai cas où ces distinctions ont tout changé',
  'Tester tes propres chiffres dans Unit Economics'
];

const FINANCE_CONCEPTS = ["Chiffre d'affaires", 'Marge brute', 'Marge nette', 'EBITDA', 'Cash flow', 'BFR', 'Point mort', 'Trésorerie', 'Rentabilité', 'Dette', 'Dilution', 'Valorisation',
  'VAN (Valeur Actuelle Nette)', 'TRI (Taux de Rentabilité Interne)', 'WACC (coût moyen pondéré du capital)', 'ROIC', 'ROE', 'Structure financière', "Rachat d'actions", 'Création de valeur'];

const FINANCE_EXEMPLES = [
  {caseId: 'wework', angle: "Un revenu de 1,8 Md$ et une perte de 1,9 Md$ la même année : chiffre d'affaires élevé et rentabilité négative peuvent coexister"},
  {caseId: 'blockbuster', angle: "905 M$ de dette imposée par une scission d'entreprise, qui a limité toutes les décisions suivantes"},
  {caseId: 'costco', angle: "Une rentabilité qui vient presque entièrement d'une seule ligne (les adhésions), pas de la marge sur les produits vendus"}
];

const FINANCE_CONSEILS = [
  {
    titre: 'Pour vérifier si ton activité est vraiment rentable',
    etapes: [
      'Calcule ta marge brute (prix − coût direct) sur une vente type.',
      'Additionne tes charges fixes mensuelles (loyer, abonnements, salaires fixes).',
      'Calcule ton seuil de rentabilité : charges fixes ÷ marge brute par vente.',
      'Compare ce seuil à tes ventes réelles — c\'est calculable directement dans Unit Economics (Business Lab).'
    ]
  },
  {
    titre: "Avant de t'endetter pour financer un projet",
    etapes: [
      "Vérifie que les revenus attendus sont suffisamment prévisibles pour supporter des remboursements fixes.",
      'Prévois un scénario où les revenus arrivent plus lentement que prévu — la dette, elle, ne ralentit pas.',
      'Distingue ce que la dette finance : un investissement qui génère du revenu, ou une dépense qui n\'en génère pas.'
    ]
  }
];

const FINANCE_MISTAKES = [
  {titre: 'Confondre chiffre d\'affaires et bénéfice', description: "Un chiffre d'affaires en hausse ne dit rien sur la rentabilité si les charges augmentent au même rythme, ou plus vite."},
  {titre: 'Confondre rentabilité et trésorerie disponible', description: "Une entreprise peut être rentable sur le papier et pourtant manquer d'argent si ses clients paient en retard ou si elle doit financer beaucoup de stock à l'avance."},
  {titre: "Sous-estimer le coût réel d'une dette", description: "Une dette ne se limite pas au capital emprunté — les intérêts et l'obligation de rembourser quoi qu'il arrive à l'activité pèsent sur toutes les décisions suivantes."}
];

const FINANCE_APPROFONDIR = [
  {label: 'Unit Economics', description: 'Le calculateur associé : teste prix, marge, seuil de rentabilité avec tes propres chiffres.', href: 'business-lab.html'},
  {label: "Comprendre l'économie", description: 'Taux directeur, inflation : comment le contexte économique influence une entreprise endettée.', href: 'formations.html'},
  {label: 'Construire mon idée', description: 'Le seuil de rentabilité calculé directement sur ton propre projet.', href: 'construire-son-projet.html'}
];

const FINANCE_QUIZ_HREF = 'defis.html?cat=' + encodeURIComponent('Marge nette');
