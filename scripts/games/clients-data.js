/* ============================================================
   LIKANZA ACADEMY — Guide Clients
   7 sujets pour comprendre qui on sert vraiment : segmentation,
   persona (avec un avertissement explicite sur ses limites),
   problème client, comportement d'achat, objections, fidélisation,
   expérience client. Même logique que marketing-data.js : `caseTag`
   relie un sujet à un vrai cas déjà sourcé via un tag partagé,
   jamais un nouvel exemple inventé.
   ============================================================ */

const CLIENTS_TOPICS = [
  {
    id: 'segmentation', titre: 'Segmentation', icon: '🧩',
    definition: "Diviser un marché large en groupes de personnes qui partagent des besoins, des comportements ou des contraintes suffisamment proches pour leur parler différemment.",
    exemple: "Un même produit peut intéresser des étudiants et des cadres pour des raisons totalement différentes — leur parler de la même façon revient souvent à ne convaincre ni l'un ni l'autre.",
    exerciceQuestion: "Si tu devais diviser tes clients potentiels en 2 ou 3 groupes vraiment différents, quels seraient-ils ?",
    caseTag: 'premiers-clients'
  },
  {
    id: 'persona', titre: 'Persona', icon: '🧑',
    definition: "Une représentation semi-fictive d'un segment de client, construite pour rendre plus concrètes les décisions produit ou marketing.",
    prudence: "Un persona reste une hypothèse tant qu'il n'est pas confronté à de vraies personnes — un persona imaginé sans jamais parler à un client réel peut donner une fausse impression de certitude.",
    exemple: "Un persona utile décrit un objectif et une frustration concrète, pas seulement un âge et un métier.",
    exerciceQuestion: "As-tu déjà parlé à au moins 3 personnes réelles qui ressemblent à ton persona, ou est-il encore entièrement imaginé ?",
    caseTag: null
  },
  {
    id: 'probleme-client', titre: 'Le problème client', icon: '❗',
    definition: "Ce que le client essaie réellement de résoudre — souvent différent de ce qu'il dit vouloir acheter en premier lieu.",
    exemple: "Quelqu'un qui « veut une perceuse » veut en réalité un trou dans un mur, pas l'objet lui-même — comprendre cette distinction change souvent l'offre.",
    exerciceQuestion: "Si ton produit n'existait pas, comment cette personne résoudrait-elle son problème aujourd'hui ?",
    caseTag: 'concurrence'
  },
  {
    id: 'comportement-achat', titre: "Comportement d'achat", icon: '🛒',
    definition: "La façon dont une personne décide réellement d'acheter : ce qui la rassure, ce qui la fait hésiter, ce qui la fait basculer.",
    exemple: "Le prix affiché n'est souvent qu'un facteur parmi d'autres : la confiance, l'urgence perçue et la facilité du parcours d'achat pèsent tout autant.",
    exerciceQuestion: "Qu'est-ce qui, concrètement, a fait hésiter tes derniers clients avant d'acheter ?",
    caseTag: null
  },
  {
    id: 'objections', titre: 'Objections', icon: '🙅',
    definition: "Les raisons, exprimées ou non, pour lesquelles un client potentiel hésite ou refuse d'acheter.",
    exemple: "« C'est trop cher », « je n'ai pas confiance » ou « je préfère continuer comme avant » sont des objections différentes qui demandent des réponses différentes.",
    exerciceQuestion: "Quelles sont les 3 objections que tu entends le plus souvent, et as-tu une vraie réponse à chacune ?",
    caseTag: 'concurrence'
  },
  {
    id: 'fidelisation', titre: 'Fidélisation', icon: '💎',
    definition: "Ce qui pousse un client à continuer d'acheter ou de s'engager après son premier achat, plutôt que de partir à la première alternative.",
    exemple: "Un programme de fidélité, une adhésion, ou simplement une qualité de service constante peuvent fidéliser — mais tous n'ont pas le même coût.",
    exerciceQuestion: "Qu'est-ce qui empêcherait concrètement un client satisfait de partir chez un concurrent demain ?",
    caseTag: 'retention'
  },
  {
    id: 'experience-client', titre: 'Expérience client', icon: '🌟',
    definition: "Tout ce que le client vit à chaque contact avec l'entreprise — pas seulement le produit, mais le service, l'attente, le support, l'ambiance.",
    exemple: "Deux entreprises qui vendent un produit presque identique peuvent avoir des résultats très différents selon la qualité de l'expérience autour de ce produit.",
    exerciceQuestion: "À quel moment précis, dans le parcours de ton client, l'expérience pourrait-elle le plus facilement se dégrader ?",
    caseTag: 'differenciation'
  }
];

// Erreurs fréquentes à afficher en fin de page (clients.js).
const CLIENTS_MISTAKES = [
  {titre: 'Créer un persona sans jamais parler à un vrai client', description: "Un persona entièrement imaginé donne une fausse impression de certitude — il reste une hypothèse tant qu'il n'est pas confronté à de vraies personnes."},
  {titre: 'Confondre utilisateur, décideur et payeur', description: "En B2B surtout, ces 3 rôles peuvent être 3 personnes différentes — leur parler comme s'il s'agissait d'une seule revient souvent à mal cibler les 3."},
  {titre: "Ignorer les objections plutôt que d'y répondre", description: "Une objection récurrente et jamais traitée continue de faire perdre des ventes, même si elle n'est jamais formulée à voix haute."}
];
