/* ============================================================
   LIKANZA ACADEMY — Bibliothèque de Business Models
   13 modèles économiques de référence, chacun avec : comment ça
   marche / qui paie / quand / d'où viennent les revenus / coûts
   principaux / risques / dans quels cas c'est pertinent / un exemple
   réel. L'exemple pointe vers un vrai cas de BUSINESS_CASES
   (business-cases-data.js) quand il en existe un pertinent — jamais
   un nouvel exemple inventé pour combler un modèle qui n'a pas de cas
   étudié sur le site (caseId reste alors null, avec une note honnête
   plutôt qu'un exemple fabriqué).
   ============================================================ */

const BUSINESS_MODELS = [
  {
    id: 'unite', nom: 'Vente à l\'unité', icon: '🛍️',
    commentCaMarche: "Le client paie une fois pour un produit ou un service, sans engagement de le racheter.",
    quiPaie: 'Le client final, à chaque achat.',
    quand: "Au moment de l'achat.",
    revenus: "Marge sur chaque vente (prix de vente moins coûts directs).",
    coutsPrincipaux: ["Coût de production ou d'achat du produit", "Coûts d'acquisition client, à renouveler pour chaque nouvelle vente"],
    risques: ["Aucun revenu récurrent garanti : il faut retrouver de nouveaux clients (ou faire revenir les mêmes) en permanence"],
    pertinence: "Pertinent pour des achats ponctuels ou peu fréquents, où un abonnement n'aurait pas de sens pour le client.",
    caseId: null
  },
  {
    id: 'abonnement', nom: 'Abonnement récurrent', icon: '🔁',
    commentCaMarche: "Le client paie un montant régulier (mensuel, annuel) pour un accès continu à un produit ou service.",
    quiPaie: 'Le client abonné, à chaque échéance.',
    quand: "Périodiquement, tant que l'abonnement est actif.",
    revenus: "Revenu récurrent, plus prévisible qu'une vente ponctuelle — souvent suivi via le MRR (revenu mensuel récurrent).",
    coutsPrincipaux: ["Maintien et amélioration continue du service", "Support client sur la durée de vie de l'abonnement"],
    risques: ["Le churn (résiliation) : un abonnement facile à quitter peut annuler les efforts d'acquisition si la rétention n'est pas suivie de près"],
    pertinence: "Pertinent quand le produit apporte une valeur continue dans le temps, pas seulement au moment de l'achat.",
    caseId: 'netflix-streaming'
  },
  {
    id: 'freemium', nom: 'Freemium', icon: '🆓',
    commentCaMarche: "Une version gratuite (souvent limitée) est proposée à tous, une version payante débloque des fonctionnalités supplémentaires.",
    quiPaie: "Une minorité d'utilisateurs, ceux qui convertissent vers le payant.",
    quand: "Quand l'utilisateur choisit de passer à la version payante.",
    revenus: "Abonnements payants d'une fraction des utilisateurs gratuits, parfois complétés par de la publicité sur la version gratuite.",
    coutsPrincipaux: ["Coût de servir un très grand nombre d'utilisateurs gratuits (doit rester très faible pour que le modèle tienne)"],
    risques: ["Un taux de conversion vers le payant trop faible peut ne jamais couvrir le coût de la base gratuite, même large"],
    pertinence: "Pertinent surtout pour des produits numériques, où le coût de servir un utilisateur gratuit supplémentaire reste très faible.",
    caseId: 'duolingo'
  },
  {
    id: 'marketplace', nom: 'Marketplace', icon: '🔀',
    commentCaMarche: "La plateforme met en relation vendeurs et acheteurs sans posséder elle-même les produits vendus, et prélève une commission sur chaque transaction.",
    quiPaie: "Le vendeur, l'acheteur, ou les deux, selon la plateforme.",
    quand: "À chaque transaction réalisée sur la plateforme.",
    revenus: "Commission sur chaque transaction.",
    coutsPrincipaux: ["Attirer et retenir suffisamment de vendeurs ET d'acheteurs pour équilibrer l'offre et la demande", "Modération et confiance entre les deux parties"],
    risques: ["Le démarrage (attirer les deux côtés à la fois) est souvent la phase la plus difficile — voir la notion d'effet réseau"],
    pertinence: "Pertinent quand il existe déjà de nombreux vendeurs et acheteurs dispersés, que la plateforme peut regrouper plus efficacement qu'ils ne le feraient seuls.",
    caseId: 'airbnb'
  },
  {
    id: 'commission', nom: 'Commission sur transaction', icon: '💳',
    commentCaMarche: "L'entreprise facilite une transaction entre deux parties et prélève un pourcentage ou un montant fixe sur chaque transaction réalisée.",
    quiPaie: "Souvent celui qui vend ou celui qui reçoit le service facilité.",
    quand: "À chaque transaction.",
    revenus: "Un pourcentage ou un montant fixe par transaction — le revenu croît avec le volume de transactions, pas nécessairement avec le nombre de clients.",
    coutsPrincipaux: ["Infrastructure de paiement et de sécurisation des transactions", "Support en cas de litige entre les parties"],
    risques: ["Dépend fortement du volume de transactions : une baisse d'activité du marché sous-jacent impacte directement le revenu"],
    pertinence: "Pertinent quand l'entreprise facilite réellement une transaction (paiement, mise en relation) plutôt que de vendre un produit propre.",
    caseId: 'shopify'
  },
  {
    id: 'ecommerce', nom: 'E-commerce', icon: '📦',
    commentCaMarche: "Vente de produits physiques en ligne, avec gestion de stock, logistique et livraison.",
    quiPaie: "Le client, au moment de la commande.",
    quand: "À l'achat, avant ou après réception selon les modalités de paiement.",
    revenus: "Marge entre le prix de vente et le coût du produit + logistique.",
    coutsPrincipaux: ["Stock immobilisé (contrainte physique réelle)", "Logistique et transport", "Retours produits"],
    risques: ["Rupture de stock ou surstock", "Marges souvent plus fines qu'en vente de service, à cause des coûts logistiques"],
    pertinence: "Pertinent pour tout produit physique où la vente en ligne élargit l'accès à des clients au-delà d'une zone géographique limitée.",
    caseId: 'zappos'
  },
  {
    id: 'agence', nom: 'Agence / services', icon: '🧩',
    commentCaMarche: "Vente de temps, d'expertise ou de prestations réalisées sur mesure pour chaque client.",
    quiPaie: "Le client, souvent au forfait ou au temps passé.",
    quand: "À la livraison de la prestation, ou par étapes convenues.",
    revenus: "Facturation du temps ou des prestations réalisées.",
    coutsPrincipaux: ["Masse salariale de l'équipe qui réalise les prestations", "Temps commercial pour trouver de nouvelles missions"],
    risques: ["Le revenu dépend directement du temps disponible de l'équipe : difficile à faire croître sans recruter proportionnellement"],
    pertinence: "Pertinent quand chaque client a des besoins suffisamment différents pour justifier une prestation sur mesure plutôt qu'un produit standardisé.",
    caseId: null
  },
  {
    id: 'publicite', nom: 'Publicité', icon: '📣',
    commentCaMarche: "Le produit ou service est gratuit ou peu cher pour l'utilisateur final ; le revenu vient d'annonceurs qui paient pour être visibles auprès de cette audience.",
    quiPaie: "Les annonceurs, pas l'utilisateur final.",
    quand: "Selon l'audience effectivement touchée (par affichage, par clic, ou par période).",
    revenus: "Paiement des annonceurs, généralement proportionnel à l'audience ou à l'engagement généré.",
    coutsPrincipaux: ["Construire et maintenir une audience suffisamment large ou ciblée pour intéresser des annonceurs"],
    risques: ["Dépend de la taille et de la qualité de l'audience, qui peut être longue à construire et fragile à conserver"],
    pertinence: "Pertinent quand l'entreprise peut réunir une audience large ou très ciblée, avant même d'avoir un revenu direct des utilisateurs.",
    caseId: null
  },
  {
    id: 'licence', nom: 'Licence', icon: '📜',
    commentCaMarche: "L'entreprise autorise un tiers à utiliser une technologie, une marque ou un contenu qu'elle possède, en échange d'un paiement.",
    quiPaie: "L'entreprise ou la personne qui obtient le droit d'utilisation.",
    quand: "Selon les termes convenus (paiement unique, redevance récurrente, ou pourcentage sur les ventes réalisées grâce à la licence).",
    revenus: "Paiement de licence, souvent avec un coût marginal très faible pour l'entreprise qui la concède.",
    coutsPrincipaux: ["Développement initial de ce qui est mis sous licence (technologie, marque, contenu)", "Protection juridique de la propriété intellectuelle"],
    risques: ["Dépend de la capacité à protéger juridiquement ce qui est mis sous licence contre une copie non autorisée"],
    pertinence: "Pertinent quand l'entreprise possède une technologie, une marque ou un contenu qu'elle préfère laisser d'autres exploiter plutôt que de tout produire elle-même.",
    caseId: null
  },
  {
    id: 'franchise', nom: 'Franchise', icon: '🏪',
    commentCaMarche: "Un franchisé paie pour exploiter la marque, le concept et les méthodes d'une enseigne déjà établie, sur un territoire donné.",
    quiPaie: "Le franchisé : un droit d'entrée initial, puis souvent des redevances récurrentes sur son chiffre d'affaires.",
    quand: "Un paiement initial, puis périodiquement (redevances).",
    revenus: "Droit d'entrée + redevances récurrentes, sans que l'enseigne ait à financer elle-même l'ouverture de chaque nouveau point de vente.",
    coutsPrincipaux: ["Maintenir la cohérence de la marque et du concept sur l'ensemble du réseau", "Support et formation aux franchisés"],
    risques: ["La réputation de la marque dépend aussi de la qualité d'exécution de chaque franchisé, hors du contrôle direct de l'enseigne"],
    pertinence: "Pertinent pour développer rapidement un réseau de points de vente sans mobiliser tout le capital nécessaire à chaque ouverture.",
    caseId: null
  },
  {
    id: 'saas', nom: 'SaaS (logiciel en abonnement)', icon: '💻',
    commentCaMarche: "Un logiciel accessible via un navigateur ou une application, facturé en abonnement plutôt que vendu en licence unique.",
    quiPaie: "Le client, mensuellement ou annuellement.",
    quand: "Périodiquement, tant que l'abonnement est actif.",
    revenus: "Abonnements récurrents (voir aussi « Abonnement récurrent »), souvent avec plusieurs paliers selon les fonctionnalités.",
    coutsPrincipaux: ["Développement et maintenance continue du logiciel", "Infrastructure technique (hébergement)", "Support client"],
    risques: ["Le churn (résiliation) reste l'indicateur le plus surveillé — voir la fiche « Churn » de la Bibliothèque"],
    pertinence: "Pertinent pour un logiciel qui apporte une valeur continue, avec des mises à jour et un support qui justifient un paiement récurrent plutôt qu'unique.",
    caseId: 'mailchimp'
  },
  {
    id: 'produit-physique', nom: 'Produit physique (vente directe)', icon: '📮',
    commentCaMarche: "Conception, fabrication (ou sous-traitance) et vente d'un bien matériel, en direct ou via des distributeurs.",
    quiPaie: "Le client final ou un distributeur intermédiaire.",
    quand: "À l'achat.",
    revenus: "Marge entre le coût de fabrication/achat et le prix de vente.",
    coutsPrincipaux: ["Production ou approvisionnement", "Stock et logistique", "Distribution"],
    risques: ["Immobilisation de trésorerie dans le stock avant même la première vente"],
    pertinence: "Pertinent pour tout bien matériel — la question centrale devient souvent la gestion du stock et de la logistique plutôt que la seule vente.",
    caseId: null
  },
  {
    id: 'membership', nom: 'Adhésion / membership', icon: '🎫',
    commentCaMarche: "Le client paie un abonnement pour avoir le droit d'accéder à une offre (souvent à prix réduit), plutôt que de payer une marge classique sur chaque produit.",
    quiPaie: "Le membre, périodiquement, indépendamment du volume qu'il achète ensuite.",
    quand: "À l'adhésion, puis à chaque renouvellement.",
    revenus: "Le revenu d'adhésion peut devenir la principale source de profit, même si l'offre elle-même est vendue avec une marge très faible.",
    coutsPrincipaux: ["Maintenir suffisamment d'avantages perçus pour justifier le renouvellement de l'adhésion"],
    risques: ["Si les avantages perçus de l'adhésion diminuent, le taux de renouvellement peut chuter rapidement"],
    pertinence: "Pertinent quand l'entreprise peut proposer des prix très compétitifs sur son offre principale grâce à un revenu d'adhésion stable ailleurs.",
    caseId: 'costco'
  }
];
