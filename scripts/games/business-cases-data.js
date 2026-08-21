/* ============================================================
   LIKANZA ACADEMY — Bibliothèque de Business Case Studies
   12 cas réels et sourcés (succès, échec, pivot) dans une structure
   commune — pas 3 systèmes de contenu séparés pour Business Case
   Studies / Business Autopsy / Pivots, mais un seul tableau avec un
   champ `type` et des `tags` (problèmes réellement abordés par le
   cas), réutilisé par business-cases.js pour la liste filtrable, la
   fiche détaillée et « Compare Strategies ».

   Règle stricte : chaque affirmation chiffrée importante cite une
   vraie source avec URL (voir `resultats`). Aucun chiffre n'est
   inventé pour combler un cas. Les 3 premiers cas (Mailchimp, Zappos,
   Shake Shack) reprennent et enrichissent BUSINESS_STORIES
   (business-game-data.js, déjà sourcé) dans cette structure plus
   complète — le contenu n'est pas dupliqué, juste réorganisé.

   `appliqueQuestions` sont toujours des questions de réflexion,
   jamais une recommandation ("fais comme cette entreprise") — une
   stratégie qui a fonctionné pour une entreprise réelle n'est pas
   automatiquement adaptée à un autre projet, contexte différent.
   ============================================================ */

const BUSINESS_CASES = [
  {
    id: 'mailchimp',
    entreprise: 'Mailchimp',
    icon: '📧',
    type: 'succes',
    tags: ['financement', 'croissance', 'business-model'],
    secteur: 'SaaS — emailing marketing',
    annee: '2001–2021',
    contexte: "En 2001, deux fondateurs (Ben Chestnut et Dan Kurzius) lancent une entreprise d'envoi d'emails marketing, sans lever le moindre financement extérieur. Dans un secteur (le logiciel) où lever des fonds auprès d'investisseurs en capital-risque est la norme pour accélérer la croissance, ce choix reste l'exception plutôt que la règle.",
    probleme: "Accélérer la croissance d'un logiciel généralement demande des moyens importants (recrutement, marketing, développement) — la voie la plus commune pour se les procurer rapidement est de lever des fonds, au prix d'une dilution du capital et d'une pression de croissance imposée par les investisseurs.",
    concurrence: "Le marché de l'emailing marketing comptait déjà plusieurs acteurs financés par du capital-risque, avec des moyens marketing et commerciaux plus importants dès le départ.",
    strategie: "Les fondateurs ont choisi de financer toute la croissance de l'entreprise uniquement par ses propres revenus (bootstrapping), en gardant l'intégralité du contrôle et du capital, quitte à grandir plus lentement qu'un concurrent financé.",
    resultats: [
      {texte: "En 2021, Intuit rachète Mailchimp pour 12 milliards de dollars — le plus grand rachat jamais réalisé d'une entreprise entièrement bootstrappée, sans aucune levée de fonds en capital-risque.", source: 'Forbes', sourceUrl: 'https://www.forbes.com/sites/kenrickcai/2021/09/13/mailchimp-intuit-acquisition-billionaires-ben-chestnut-dan-kurzius/'},
      {texte: "L'accord comprenait 300 millions de dollars de bonus pour les employés, le reste (11,7 milliards) réparti à parts égales entre cash et actions Intuit.", source: 'TechCrunch', sourceUrl: 'https://techcrunch.com/2021/09/13/intuit-confirms-12b-deal-to-buy-mailchimp/'}
    ],
    limites: [
      "Le bootstrapping a fonctionné ici sur 20 ans (2001-2021) : c'est un choix qui demande de la patience, pas un raccourci vers un résultat rapide.",
      "L'emailing marketing a un besoin en capital initial relativement faible comparé à d'autres secteurs (matériel, biotech...) — bootstrapper y est structurellement plus réaliste que dans un secteur nécessitant un investissement lourd avant le moindre revenu.",
      "Un rachat à 12 milliards de dollars reste une réussite exceptionnelle et rare : la grande majorité des entreprises bootstrappées ne connaissent pas une issue de cette ampleur."
    ],
    retenir: "Financer sa croissance par ses propres revenus plutôt que par une levée de fonds réduit la dilution et la pression de croissance imposée par des investisseurs externes — mais prive aussi l'entreprise d'un coussin de trésorerie en cas de choc, et suppose un secteur où grandir sans capital extérieur reste réaliste.",
    appliqueQuestions: [
      "Ton secteur permet-il de générer des revenus significatifs avant d'avoir besoin d'un investissement important ?",
      "Es-tu prêt à accepter une croissance plus lente en échange de garder le contrôle total de ton entreprise ?",
      "As-tu réellement besoin de capital externe, ou est-ce une solution de facilité plutôt qu'une nécessité ?"
    ]
  },
  {
    id: 'zappos',
    entreprise: 'Zappos',
    icon: '👟',
    type: 'succes',
    tags: ['differenciation', 'financement', 'croissance'],
    secteur: 'E-commerce — chaussures',
    annee: '1999–2009',
    contexte: "Zappos construit sa réputation sur un service client hors norme (livraison et retours gratuits sous 365 jours, centre d'appels ouvert 24h/24) dans un marché de la vente de chaussures en ligne où le produit lui-même est difficilement différenciable d'un site à l'autre.",
    probleme: "Face à la crise financière de 2008-2009, les ventes ralentissent et l'entreprise dépend de prêts bancaires pour financer ses stocks — une situation de trésorerie tendue qui inquiète son conseil d'administration, dont Sequoia Capital, actionnaire important.",
    concurrence: "De nombreux sites de vente de chaussures en ligne proposaient un catalogue similaire, sans le même niveau d'investissement dans le service client.",
    strategie: "Le fondateur Tony Hsieh, qui aurait préféré continuer à faire grandir l'entreprise seul jusqu'à une entrée en bourse, a cédé sous la pression de son conseil d'administration et accepté une vente à Amazon plutôt que de continuer à porter seul le risque de trésorerie.",
    resultats: [
      {texte: "L'accord de rachat par Amazon a été annoncé en juillet 2009 pour une valeur d'environ 847 millions de dollars, évaluée à environ 1,2 milliard de dollars frais inclus au moment de la clôture en novembre 2009 (écart dû à l'évolution du cours de l'action Amazon entre les deux dates).", source: 'Dossier officiel Amazon (SEC) / TechCrunch', sourceUrl: 'https://www.sec.gov/Archives/edgar/data/0001018724/000119312509153130/dex991.htm'},
      {texte: "Tony Hsieh a confirmé publiquement avoir cédé sous la pression du conseil d'administration plutôt que par choix initial.", source: 'TechCrunch', sourceUrl: 'https://techcrunch.com/2010/06/07/tony-hsieh-zappos'}
    ],
    limites: [
      "La différenciation par le service client a construit la réputation de Zappos, mais n'a pas suffi à elle seule à éviter une dépendance à l'emprunt bancaire pour financer les stocks — un problème structurel de l'e-commerce physique (contrainte de stock), pas propre à Zappos.",
      "La décision de vendre n'était pas uniquement stratégique : elle a été largement influencée par la pression d'un actionnaire important, pas seulement par un choix libre du fondateur.",
      "Le contexte (crise financière 2008-2009) a probablement rendu le financement externe plus difficile à obtenir qu'en temps normal, ce qui a pu peser sur la décision."
    ],
    retenir: "Un service client exceptionnel peut devenir un vrai axe de différenciation sur un marché où le produit est peu différenciable — mais céder le contrôle sous la pression d'investisseurs reste un compromis fréquent dès que la trésorerie dépend de financements externes, particulièrement en période de tension économique.",
    appliqueQuestions: [
      "Sur quel critère non lié au produit lui-même pourrais-tu te différencier (service, expérience, rapidité, garanties) ?",
      "Ta trésorerie dépend-elle de financements externes (emprunt, investisseurs) que tu ne contrôles pas entièrement ?",
      "As-tu réfléchi à ce que tu ferais si un partenaire financier te mettait sous pression pour une décision que tu ne souhaites pas prendre ?"
    ]
  },
  {
    id: 'shake-shack',
    entreprise: 'Shake Shack',
    icon: '🍔',
    type: 'succes',
    tags: ['croissance', 'premiers-clients'],
    secteur: 'Restauration',
    annee: '2001–2015',
    contexte: "En 2001, un chariot de hot-dogs installé temporairement dans Madison Square Park (New York) pour accompagner une installation artistique connaît un succès inattendu : la file d'attente s'allonge chaque été, au point d'être reconduit deux étés de suite.",
    probleme: "Le succès du chariot saisonnier pose une vraie question de développement : rester une activité limitée et sans risque, ou investir dans une structure permanente sans certitude que la demande se maintienne hors du contexte temporaire initial.",
    concurrence: "New York compte une offre de restauration rapide déjà dense ; rien ne garantissait qu'un kiosque permanent attirerait la même affluence qu'un chariot associé à un événement ponctuel.",
    strategie: "Le restaurateur Danny Meyer a accepté le contrat proposé par le département des parcs de New York pour transformer le chariot saisonnier en kiosque permanent, puis a développé l'enseigne progressivement, un restaurant à la fois, sur plus d'une décennie.",
    resultats: [
      {texte: "Le kiosque permanent Shake Shack a ouvert le 12 juin 2004 à Madison Square Park.", source: 'Historique public Shake Shack', sourceUrl: 'https://en.wikipedia.org/wiki/Shake_Shack'},
      {texte: "Après cette expansion progressive, Shake Shack est entré en bourse le 29 janvier 2015 : l'action, introduite à 21$, a grimpé de 123% dès le premier jour de cotation.", source: 'Historique public Shake Shack', sourceUrl: 'https://en.wikipedia.org/wiki/Shake_Shack'}
    ],
    limites: [
      "Entre le chariot de 2001 et l'introduction en bourse de 2015, il s'est écoulé 14 ans d'expansion progressive — pas une réussite immédiate, mais un développement lent et maîtrisé, un restaurant à la fois.",
      "Le succès initial du chariot était en partie lié à un contexte particulier (installation artistique, emplacement central à New York) difficile à reproduire à l'identique ailleurs.",
      "La forte hausse du cours à l'introduction en bourse reflète l'enthousiasme des marchés financiers à ce moment précis, pas une garantie de performance future de l'action."
    ],
    retenir: "Saisir une opportunité de croissance identifiée tôt (une forte demande observée, même dans un cadre limité) peut être payant, mais le vrai travail se situe souvent dans l'exécution progressive et maîtrisée sur plusieurs années, pas dans un coup ponctuel.",
    appliqueQuestions: [
      "As-tu déjà observé un signal de demande plus fort que prévu sur une version limitée ou temporaire de ton offre ?",
      "Serais-tu prêt à développer ton activité progressivement sur plusieurs années plutôt que de chercher une croissance immédiate ?",
      "Quelle part du succès initial dépend d'un contexte particulier (lieu, moment, circonstance) qui ne se reproduira pas forcément ailleurs ?"
    ]
  },
  {
    id: 'netflix-streaming',
    entreprise: 'Netflix',
    icon: '📼',
    type: 'pivot',
    tags: ['business-model', 'concurrence', 'croissance'],
    secteur: 'Location et diffusion de vidéo',
    annee: '2005–2013',
    contexte: "En 2005, Netflix est un service de location de DVD par courrier, avec 4,2 millions d'abonnés et environ 1 million de DVD expédiés par jour — un modèle qui fonctionne bien, mais qui dépend d'une logistique physique coûteuse.",
    probleme: "La diffusion de contenu vidéo par internet commence à devenir techniquement possible pour le grand public — un changement technologique qui pourrait, à terme, rendre le modèle de location physique moins pertinent.",
    concurrence: "Le principal concurrent direct de Netflix sur la location de DVD était alors Blockbuster (voir le cas dédié), avec un réseau de magasins physiques bien plus étendu — mais aucun concurrent n'avait encore construit d'offre de diffusion en ligne à grande échelle.",
    strategie: "Netflix lance en janvier 2007 un service de streaming (« Watch Now ») en complément — et non en remplacement immédiat — de son offre DVD, avec un catalogue au départ volontairement restreint (environ 1 000 titres en streaming, contre 70 000 disponibles en DVD).",
    resultats: [
      {texte: "L'année de lancement du streaming (2007), Netflix dépasse pour la première fois le milliard de dollars de revenu annuel, avec une hausse de 18% du nombre d'abonnés sur l'année.", source: 'Synthèse historique Netflix (Edspira)', sourceUrl: 'https://www.edspira.com/netflix-streaming-vs-dvd/'},
      {texte: "En 2013, les trois quarts du revenu domestique de Netflix proviennent désormais du streaming plutôt que du DVD.", source: 'Synthèse historique Netflix (Financial Content)', sourceUrl: 'https://www.financialcontent.com/article/marketminute-2025-3-21-the-history-of-netflix-from-dvd-rentals-to-streaming-giant'}
    ],
    limites: [
      "Le pivot n'a pas été un remplacement brutal : le streaming a d'abord coexisté avec le DVD pendant plusieurs années (le catalogue streaming ne représentait qu'une fraction du catalogue DVD au lancement), avant de devenir progressivement dominant.",
      "Netflix disposait déjà d'une base d'abonnés et de revenus établis avant de lancer le streaming — un point de départ très différent d'une entreprise qui pivote sans base de clients existante.",
      "Le succès du pivot dépendait aussi de facteurs externes hors du contrôle de Netflix (adoption du haut débit par le grand public, évolution des droits de diffusion de contenu)."
    ],
    retenir: "Un pivot réussi n'est pas nécessairement un abandon brutal de l'activité existante : introduire une nouvelle offre en complément, avec un périmètre volontairement limité au départ, permet de tester une évolution du marché sans tout risquer d'un coup.",
    appliqueQuestions: [
      "Un changement technologique ou d'usage est-il en train de rendre ton modèle actuel potentiellement moins pertinent à terme ?",
      "Pourrais-tu tester une nouvelle direction en complément de ton activité actuelle plutôt qu'en la remplaçant immédiatement ?",
      "Disposes-tu d'une base de clients ou de revenus existante qui pourrait absorber le risque d'un tel changement, ou pars-tu de zéro ?"
    ]
  },
  {
    id: 'blockbuster',
    entreprise: 'Blockbuster',
    icon: '📉',
    type: 'echec',
    tags: ['concurrence', 'business-model', 'rentabilite'],
    secteur: 'Location de vidéo (magasins physiques)',
    annee: '2004–2010',
    contexte: "Blockbuster domine la location de films en magasin physique aux États-Unis, avec un modèle économique qui dépend en partie significative des frais de retard facturés aux clients qui rendent leurs cassettes/DVD après la date prévue.",
    probleme: "Les frais de retard représentaient une source de revenu importante (environ 800 millions de dollars par an) mais étaient de plus en plus mal perçus par les clients, dans un contexte où Netflix proposait déjà la location par courrier sans frais de retard.",
    concurrence: "Netflix (voir le cas dédié) gagnait des parts de marché avec un modèle sans frais de retard et, à partir de 2007, une offre de streaming complémentaire — une pression concurrentielle croissante sur le modèle historique de Blockbuster.",
    strategie: "En 2005, Blockbuster supprime les frais de retard pour concurrencer Netflix — une décision qui coûte immédiatement environ 400 millions de dollars par an de trésorerie, sans revenu de remplacement mis en place au même moment. La situation est aggravée par la dette héritée de la scission de Viacom en 2004 (905 millions de dollars) et par la crise financière de 2008, qui rend le crédit plus difficile à obtenir pour une entreprise déjà endettée.",
    resultats: [
      {texte: "Entre l'abolition des frais de retard et 2010, le revenu tiré de ces frais est passé d'environ 800 millions de dollars par an à 134 millions — une perte de 83% sans mécanisme de revenu de remplacement en place.", source: 'Analyse historique (Cato Institute)', sourceUrl: 'https://www.cato.org/commentary/lessons-rise-netflix-fall-blockbuster'},
      {texte: "Blockbuster dépose le bilan en 2010, avec près d'un milliard de dollars de dette.", source: 'Analyse historique (Indigo9 Digital)', sourceUrl: 'https://www.indigo9digital.com/blog/blockbusterfailure'}
    ],
    limites: [
      "L'échec de Blockbuster ne s'explique pas par un seul facteur : la dette héritée de la scission Viacom (2004), la crise financière de 2008 et la décision de supprimer les frais de retard sans revenu de remplacement se sont combinées.",
      "Certaines analyses historiques nuancent le récit simple « Netflix a tué Blockbuster » : Blockbuster a eu, à un moment, l'occasion de racheter Netflix et a décliné — la décision reflète autant des choix internes que la seule pression externe de la concurrence.",
      "Le contexte macroéconomique (crise financière 2008, accès au crédit restreint pour une entreprise endettée) a probablement aggravé une situation déjà fragile, indépendamment des choix stratégiques propres à Blockbuster."
    ],
    retenir: "Supprimer une source de revenu importante pour rester compétitif, sans avoir mis en place un revenu de remplacement au même moment, peut transformer une réponse défensive à la concurrence en un vrai problème de trésorerie — surtout combiné à un endettement déjà élevé et un contexte économique défavorable.",
    appliqueQuestions: [
      "Une part importante de ton revenu dépend-elle d'un mécanisme (frais, pénalité, commission) que tes clients perçoivent mal et qu'un concurrent pourrait supprimer pour te concurrencer ?",
      "Si tu devais supprimer une source de revenu pour rester compétitif, aurais-tu un revenu de remplacement prêt à la même date ?",
      "Ton niveau d'endettement te laisse-t-il une marge de manœuvre suffisante si le contexte économique se dégrade ?"
    ]
  },
  {
    id: 'duolingo',
    entreprise: 'Duolingo',
    icon: '🦉',
    type: 'succes',
    tags: ['conversion', 'retention', 'business-model', 'differenciation'],
    secteur: 'Éducation — application d\'apprentissage des langues',
    annee: '2016–2024',
    contexte: "Duolingo propose un apprentissage des langues gratuit, financé par un modèle freemium (fonctionnalités de base gratuites, abonnement payant pour retirer la publicité et débloquer des fonctionnalités avancées) — un marché où l'abandon en cours d'apprentissage est un problème courant pour ce type de produit.",
    probleme: "Un produit d'apprentissage gratuit doit résoudre deux problèmes à la fois : retenir des utilisateurs qui abandonnent facilement un apprentissage de long terme, et convertir une partie suffisante d'entre eux en clients payants pour financer l'ensemble.",
    concurrence: "De nombreuses applications et méthodes d'apprentissage des langues existent, avec des modèles économiques variés (cours payants dès le départ, plateformes avec professeurs, autres applications freemium).",
    strategie: "Duolingo a construit son produit autour de mécaniques de jeu (séries de jours consécutifs, points d'expérience, classements) pour maintenir l'engagement quotidien, tout en optimisant en continu ses fonctionnalités payantes et son tunnel d'achat pour convertir une partie des utilisateurs gratuits en abonnés.",
    resultats: [
      {texte: "Le taux de désabonnement (churn) mensuel est passé d'environ 47% mi-2020 à 37% début 2023, puis à un point bas de 28% sur les marchés occidentaux fin 2023.", source: 'Analyse du modèle Duolingo (foundercoho)', sourceUrl: 'https://foundercoho.substack.com/p/inside-duolingos-6b-playbook-gamification'},
      {texte: "Le revenu est passé de 531 millions de dollars en 2023 à environ 748 millions en 2024, avec 76% issu des abonnements ; l'application comptait environ 104 millions d'utilisateurs mensuels et 8 millions d'abonnés payants mi-2024, pour un taux de conversion vers le payant d'environ 8,8% en 2024.", source: 'Analyse du modèle Duolingo (StriveCloud)', sourceUrl: 'https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo'}
    ],
    limites: [
      "Un taux de conversion de 8,8% signifie que plus de 9 utilisateurs sur 10 restent gratuits en permanence : le modèle freemium ne fonctionne économiquement qu'à très grande échelle d'utilisateurs.",
      "Les mécaniques de gamification qui retiennent les utilisateurs (séries, points, classements) demandent un travail continu d'optimisation produit, pas une mise en place ponctuelle.",
      "Le coût de servir un utilisateur gratuit supplémentaire reste très faible pour un produit numérique déjà développé — un modèle freemium serait beaucoup plus difficile à financer pour un produit physique ou nécessitant un coût variable élevé par utilisateur."
    ],
    retenir: "Un modèle freemium peut fonctionner durablement à condition de résoudre ensemble deux problèmes distincts (rétention et conversion), avec un travail continu d'optimisation plutôt qu'un réglage figé — et seulement pour des produits où le coût de servir un utilisateur gratuit reste très faible.",
    appliqueQuestions: [
      "Ton produit permettrait-il de servir un grand nombre d'utilisateurs gratuits à un coût marginal très faible, comme un produit numérique ?",
      "As-tu un plan concret pour faire revenir les utilisateurs régulièrement, pas seulement pour les faire s'inscrire une première fois ?",
      "Sais-tu quelle proportion de tes utilisateurs gratuits tu dois convertir en payants pour que le modèle soit viable à ton échelle ?"
    ]
  },
  {
    id: 'costco',
    entreprise: 'Costco',
    icon: '🏬',
    type: 'succes',
    tags: ['business-model', 'rentabilite', 'differenciation'],
    secteur: 'Distribution — grande distribution sur adhésion',
    annee: 'Modèle établi, données récentes',
    contexte: "Costco vend des produits en grande distribution avec des marges commerciales volontairement très faibles sur la marchandise elle-même, dans un secteur où la concurrence sur les prix est intense.",
    probleme: "Vendre au prix le plus bas possible réduit mécaniquement la marge sur chaque produit — un distributeur qui ne compte que sur la marge commerciale classique reste vulnérable à la moindre pression concurrentielle sur les prix.",
    concurrence: "Le secteur de la grande distribution compte de nombreux acteurs qui se font concurrence essentiellement sur le prix des produits vendus.",
    strategie: "Costco fait payer à ses clients un abonnement annuel (l'adhésion) pour avoir le droit d'acheter dans ses magasins, et construit l'essentiel de sa rentabilité sur ce revenu récurrent plutôt que sur la marge commerciale des produits, qui reste minimale.",
    resultats: [
      {texte: "Les frais d'adhésion ne représentent qu'environ 2% du chiffre d'affaires total de Costco, mais contribuent à environ 66 à 73% de son profit d'exploitation ou brut, tandis que la marge sur la marchandise vendue dépasse à peine 3%.", source: 'Analyse du modèle Costco (FourWeekMBA)', sourceUrl: 'https://fourweekmba.com/costco-membership-revenue/'},
      {texte: "Le taux de renouvellement des adhésions dépasse 90% sur des marchés clés comme les États-Unis et le Canada.", source: 'Analyse du modèle Costco (Management Consulted)', sourceUrl: 'https://managementconsulted.com/podcast/costco-business-model-breakdown/'}
    ],
    limites: [
      "Ce modèle suppose que les clients acceptent de payer par avance pour avoir accès à des prix bas — un pari qui fonctionne à condition que la différence de prix perçue justifie clairement le coût de l'adhésion.",
      "Un taux de renouvellement élevé (>90%) est le résultat d'années de confiance construite avec les clients ; un nouvel entrant qui copierait ce modèle sans cette confiance déjà établie n'obtiendrait pas nécessairement le même taux.",
      "Ce modèle dépend d'un volume de clients très important et régulier pour que le revenu d'adhésion soit significatif à l'échelle de l'entreprise — moins adapté à une petite structure avec peu de clients."
    ],
    retenir: "Séparer clairement la source de profit (ici, l'adhésion) de l'offre principale (ici, des prix bas sur les produits) permet de rester très compétitif sur le prix perçu par le client tout en construisant une rentabilité stable et récurrente ailleurs — une logique transposable au-delà de la distribution.",
    appliqueQuestions: [
      "Ton offre principale pourrait-elle rester à prix serré si une autre source de revenu (abonnement, service annexe) portait l'essentiel de ta rentabilité ?",
      "Tes clients reviendraient-ils suffisamment souvent pour qu'un modèle d'adhésion ou d'abonnement ait du sens ?",
      "As-tu déjà distingué, dans tes chiffres, ce qui te fait vraiment gagner de l'argent de ce qui attire simplement des clients ?"
    ]
  },
  {
    id: 'apple',
    entreprise: 'Apple',
    icon: '🍎',
    type: 'succes',
    tags: ['differenciation', 'retention'],
    secteur: 'Technologie — électronique grand public',
    annee: '2024',
    contexte: "Apple vend des smartphones, ordinateurs et objets connectés sur un marché où les caractéristiques techniques des produits concurrents se ressemblent de plus en plus.",
    probleme: "Sur un marché où le matériel devient une commodité (les fiches techniques se valent), comment continuer à justifier un prix premium et fidéliser les clients sur la durée plutôt qu'à chaque achat isolé ?",
    concurrence: "Les fabricants Android (Samsung en tête) et les fabricants d'ordinateurs proposent des produits aux caractéristiques techniques comparables, souvent à prix inférieur.",
    strategie: "Apple intègre étroitement matériel, logiciel et services (App Store, iCloud, Apple Music, Apple Pay...), ce qui rend chaque appareil plus utile en présence des autres et augmente le coût perçu de tout quitter pour un autre écosystème.",
    resultats: [
      {texte: "Les revenus de services d'Apple (App Store, iCloud, Apple Music, Apple Pay, AppleCare...) ont atteint environ 85 milliards de dollars en 2024, en hausse depuis 81 milliards en 2023.", source: 'Apple Services Revenue Statistics (TechLila)', sourceUrl: 'https://www.techlila.com/apple-services-revenue-statistics/'},
      {texte: "68% des utilisateurs d'iPhone possèdent au moins trois autres appareils Apple, et le taux de rétention client d'Apple atteint environ 92%, davantage que Google ou Samsung.", source: "Étude de cas sur la stratégie d'écosystème d'Apple (The CDO Times)", sourceUrl: 'https://cdotimes.com/2024/11/21/case-study-apples-ecosystem-strategy-building-loyalty-and-revenue-through-integration-and-innovation/'}
    ],
    limites: [
      "L'effet d'écosystème est plus fort chez les utilisateurs qui possèdent déjà plusieurs appareils Apple — il ne se déclenche pas dès le premier achat, ce qui suppose un investissement initial du client.",
      "Cette stratégie s'appuie sur des décennies d'innovation produit et une image de marque déjà établie ; la reproduire suppose des ressources qu'une jeune entreprise n'a en général pas.",
      "L'intégration fermée entre produits est aussi critiquée (position dominante, difficulté à changer d'écosystème), ce qui expose Apple à des enquêtes réglementaires dans plusieurs pays."
    ],
    retenir: "La différenciation peut venir de la façon dont plusieurs produits ou services se renforcent mutuellement, plutôt que d'un seul produit isolé — mais cela demande du temps et des ressources pour se construire.",
    appliqueQuestions: [
      "Est-ce que ton offre a plusieurs éléments qui se renforcent mutuellement, ou est-ce un produit isolé facilement comparable à un concurrent ?",
      "Qu'est-ce qui rendrait réellement coûteux, pour un client, de passer à un concurrent ?"
    ]
  },
  {
    id: 'starbucks',
    entreprise: 'Starbucks',
    icon: '☕',
    type: 'succes',
    tags: ['differenciation', 'retention'],
    secteur: 'Restauration — café',
    annee: '2025',
    contexte: "Starbucks vend un produit facilement reproductible (du café) dans un secteur où de nombreux concurrents proposent une boisson comparable à prix inférieur.",
    probleme: "Comment vendre un produit banal à un prix premium de façon durable, et que se passe-t-il si l'exécution de la différenciation se dégrade avec le temps ?",
    concurrence: "Chaînes de restauration rapide avec offre café (McDonald's McCafé), chaînes concurrentes (Dunkin'), cafés indépendants locaux.",
    strategie: "Starbucks construit son positionnement autour du concept de « troisième lieu » (ni la maison ni le travail) : expérience de marque standardisée dans le monde entier, ambiance et service plutôt que le café seul justifient le prix.",
    resultats: [
      {texte: "Après plusieurs trimestres de recul, la stratégie « Back to Starbucks » lancée par le CEO Brian Niccol a permis une croissance des ventes comparables de 7,9% au 4e trimestre fiscal 2025 (contre 5,7% attendu par les analystes) — la première hausse en sept trimestres.", source: 'Starbucks stock pops as efforts to revive third place pay off (Yahoo Finance)', sourceUrl: 'https://finance.yahoo.com/markets/stocks/article/starbucks-stock-pops-as-efforts-to-revive-third-place-pay-off-2026-outlook-improves-154557895.html'},
      {texte: "Le revenu du 4e trimestre fiscal 2025 a atteint 9,3 milliards de dollars, au-dessus des 9,2 milliards attendus par les marchés.", source: 'Starbucks stock pops as efforts to revive third place pay off (Yahoo Finance)', sourceUrl: 'https://finance.yahoo.com/markets/stocks/article/starbucks-stock-pops-as-efforts-to-revive-third-place-pay-off-2026-outlook-improves-154557895.html'}
    ],
    limites: [
      "Les ventes comparables avaient reculé pendant plusieurs trimestres avant ce redressement — la stratégie « troisième lieu » s'était érodée dans l'exécution quotidienne (rapidité de service priorisée au détriment de l'ambiance) avant d'être consciemment relancée.",
      "Un redressement sur un trimestre ne prouve pas encore une tendance durable ; les résultats ultérieurs restent à confirmer.",
      "Cette stratégie suppose des coûts d'exploitation plus élevés (personnel, aménagement des magasins) qu'une chaîne purement low-cost."
    ],
    retenir: "Une proposition de valeur fondée sur l'expérience doit être défendue activement dans l'exécution quotidienne — elle peut s'éroder discrètement si l'entreprise privilégie d'autres priorités (ici la vitesse), même sans changer son discours marketing.",
    appliqueQuestions: [
      "Est-ce que ton « expérience client » est vraiment vécue à chaque visite, ou seulement affichée dans ta communication ?",
      "Qu'est-ce qui pourrait éroder discrètement ta différenciation dans le temps si tu n'y fais pas attention ?"
    ]
  },
  {
    id: 'shopify',
    entreprise: 'Shopify',
    icon: '🛍️',
    type: 'succes',
    tags: ['business-model', 'croissance'],
    secteur: 'Technologie — infrastructure e-commerce (SaaS)',
    annee: '2023',
    contexte: "Shopify fournit l'infrastructure technique permettant à des commerçants, petits ou grands, d'ouvrir une boutique en ligne sans compétences techniques ni gros budget de départ.",
    probleme: "Un modèle d'abonnement fixe classique ne capte pas la valeur créée quand un marchand réussit très bien à vendre — le prestataire technique reste plafonné même si son client explose.",
    concurrence: "Autres solutions e-commerce (WooCommerce, BigCommerce, Magento) et marketplaces qui captent directement la vente (Amazon).",
    strategie: "Shopify combine un abonnement mensuel (accès à la plateforme) et des « solutions marchands » proportionnelles au volume vendu (paiement, expédition...) — le revenu de Shopify croît directement avec le succès de ses marchands.",
    resultats: [
      {texte: "En 2023, Shopify a généré environ 7,06 milliards de dollars de revenu (en hausse depuis 5,6 milliards en 2022), dont 26% issus des abonnements et 74% des solutions marchands.", source: 'Shopify Business Model 2024 (FourWeekMBA)', sourceUrl: 'https://fourweekmba.com/shopify-business-model/'},
      {texte: "Sur les 9 premiers mois de 2023, la plateforme a facilité 160,8 milliards de dollars de volume de vente marchand (GMV), en hausse de 18% sur un an.", source: 'Shopify Inc. — Form 6-K FY2023 (SEC)', sourceUrl: 'https://www.sec.gov/Archives/edgar/data/1594805/000159480524000039/yearinreview.htm'}
    ],
    limites: [
      "Le revenu de Shopify est directement exposé aux cycles économiques de ses marchands : si eux vendent moins, Shopify gagne mécaniquement moins aussi.",
      "La plupart des marchands paient moins de 50$/mois d'abonnement — l'essentiel de la rentabilité vient du volume agrégé de très nombreux petits marchands, pas d'un abonnement élevé par client.",
      "Des solutions tout-en-un moins chères peuvent attirer les tout premiers commerçants avant qu'ils n'atteignent une taille justifiant Shopify."
    ],
    retenir: "Un modèle où le prestataire gagne davantage quand son client réussit (plutôt qu'un abonnement fixe seul) aligne les intérêts des deux parties, mais expose aussi le prestataire aux mêmes cycles économiques que ses clients.",
    appliqueQuestions: [
      "Est-ce que tu gagnes plus quand tes clients réussissent, ou ton revenu est-il totalement décorrélé de leur succès ?",
      "Que se passerait-il pour ton revenu si tes clients vendaient 20% de moins du jour au lendemain ?"
    ]
  },
  {
    id: 'airbnb',
    entreprise: 'Airbnb',
    icon: '🏠',
    type: 'succes',
    tags: ['effet-reseau', 'premiers-clients'],
    secteur: 'Technologie — marketplace de l\'hébergement',
    annee: '2024',
    contexte: "Airbnb met en relation des particuliers qui louent leur logement (hôtes) avec des voyageurs, sur un marché où l'hébergement se faisait jusque-là presque exclusivement via des hôtels.",
    probleme: "Un marketplace a besoin des deux côtés (hôtes ET voyageurs) pour avoir de la valeur, et doit résoudre un problème de confiance inédit : accepter de dormir chez un inconnu, ou d'héberger un inconnu chez soi.",
    concurrence: "Hôtellerie traditionnelle, autres plateformes de location (VRBO/HomeAway), hébergement informel non structuré.",
    strategie: "Airbnb a construit des mécanismes de confiance (avis bidirectionnels hôte/voyageur, paiement sécurisé, messagerie, assistance) qui ont permis un effet réseau où une partie des voyageurs deviennent eux-mêmes hôtes par la suite.",
    resultats: [
      {texte: "36% des hôtes d'Airbnb ont d'abord été des voyageurs sur la plateforme, un signe concret de l'effet réseau qui alimente à la fois l'offre et la demande.", source: 'Airbnb Revenues Benefit From Network Effects (PYMNTS)', sourceUrl: 'https://www.pymnts.com/earnings/2023/airbnb-sees-network-effect-as-36-of-hosts-are-prior-guests/'},
      {texte: "En 2024, Airbnb a généré environ 11,1 milliards de dollars de revenus (+11,95% sur un an), avec plus de 8 millions d'annonces actives et plus de 5 millions d'hôtes dans le monde.", source: 'Airbnb Statistics (Dataopedia)', sourceUrl: 'https://dataopedia.com/airbnb-statistics/'}
    ],
    limites: [
      "Ce modèle dépend fortement de la réglementation locale : de nombreuses villes limitent ou interdisent la location de courte durée, ce qui peut retirer une partie de l'offre du jour au lendemain.",
      "La confiance construite reste fragile : un incident grave largement médiatisé peut nuire à la réputation de toute la plateforme, pas seulement d'un hôte.",
      "Démarrer un marketplace demande d'attirer les deux côtés en même temps, souvent avec des moyens limités au début — une phase difficile qu'Airbnb a mis du temps à dépasser."
    ],
    retenir: "Dans un marketplace à deux faces, résoudre le problème de confiance entre inconnus peut être un avantage aussi déterminant que le produit lui-même.",
    appliqueQuestions: [
      "Si ton idée nécessite deux côtés (offre et demande), lequel des deux est le plus difficile à attirer en premier ?",
      "Comment pourrais-tu construire de la confiance entre des inconnus dans ton propre projet ?"
    ]
  },
  {
    id: 'wework',
    entreprise: 'WeWork',
    icon: '🏢',
    type: 'echec',
    tags: ['financement', 'rentabilite', 'croissance'],
    secteur: 'Immobilier — espaces de coworking',
    annee: '2019',
    contexte: "WeWork louait des immeubles de bureaux à long terme puis les relouait en espaces flexibles à court terme, valorisée 47 milliards de dollars par des investisseurs privés (dont SoftBank) avant sa tentative d'entrée en bourse (IPO) en 2019.",
    probleme: "Une croissance très rapide, financée par du capital-risque, sans rentabilité claire ni gouvernance équilibrée — un problème resté invisible tant que l'entreprise restait privée.",
    concurrence: "Espaces de coworking classiques (Regus/IWG), marché de l'immobilier de bureau traditionnel.",
    strategie: "WeWork a cherché à se faire valoriser comme une entreprise technologique à forte croissance plutôt que comme une société immobilière classique, pour justifier une valorisation bien supérieure à ses fondamentaux financiers.",
    resultats: [
      {texte: "Le dépôt du document S-1 (14 août 2019), obligatoire avant une entrée en bourse, a révélé une perte nette de 1,9 milliard de dollars pour un revenu de 1,8 milliard en 2018 — des chiffres qui ont immédiatement refroidi de nombreux investisseurs institutionnels.", source: 'WeWork IPO Failure: Causes, Collapse, and Aftermath (iDeals VDR)', sourceUrl: 'https://www.idealsvdr.com/blog/deals/need-know-wework-ipo-postponement/'},
      {texte: "La valorisation envisagée pour l'IPO est tombée d'environ 47 milliards de dollars à 10-15 milliards en quelques semaines ; le fondateur Adam Neumann a démissionné de son poste de CEO le 24 septembre 2019, et l'IPO a été suspendue mi-octobre 2019. L'entreprise a déposé le bilan (Chapter 11) en 2023.", source: 'The WeWork Collapse: Governance Failures (Directors Institute)', sourceUrl: 'https://www.directors-institute.com/post/the-wework-collapse-governance-failures-founder-control-lessons-learned/'}
    ],
    limites: [
      "Des actions à droit de vote multiple donnaient au fondateur une majorité de contrôle malgré une part minoritaire du capital — une structure de gouvernance qui ne se retrouve pas dans toutes les levées de fonds agressives.",
      "Toutes les startups en forte croissance financées par du capital-risque ne connaissent pas cet effondrement ; les circonstances propres à WeWork (conflits d'intérêts du fondateur, absentéisme de contrôle du conseil) ont aggravé une situation déjà fragile.",
      "L'échec a été révélé au moment précis de l'examen public (le S-1), pas nécessairement avant — ce qui pose la question de ce qui reste invisible tant qu'une entreprise privée n'est pas soumise à cette transparence."
    ],
    retenir: "Une croissance rapide financée par du capital sans rentabilité claire peut sembler être un succès jusqu'à ce que les investisseurs — ou le public, lors d'une IPO — examinent réellement les chiffres et la gouvernance.",
    appliqueQuestions: [
      "Est-ce que ta croissance actuelle est rentable, ou financée par un capital qui devra un jour être justifié ou remboursé ?",
      "Qui détient le pouvoir de décision dans ton projet, et cet équilibre te semble-t-il sain ?"
    ]
  }
];

const BUSINESS_CASE_TYPE_META = {
  succes: {emoji: '🟢', label: 'Succès'},
  echec: {emoji: '🔴', label: 'Échec'},
  pivot: {emoji: '🟠', label: 'Pivot'}
};

// Libellés lisibles pour les tags (problèmes réellement abordés) — utilisés
// par business-cases.js et par « J'ai un problème » pour ne jamais afficher
// une clé technique brute à l'utilisateur.
const BUSINESS_CASE_TAG_LABELS = {
  'concurrence': 'Trop de concurrence',
  'differenciation': 'Se différencier',
  'premiers-clients': 'Trouver ses premiers clients',
  'prix': 'Prix mal calibré',
  'conversion': 'Visiteurs mais peu de ventes',
  'cac': "Acquisition trop chère",
  'retention': 'Rétention / churn',
  'rentabilite': "Pas rentable",
  'business-model': 'Changer de modèle économique',
  'croissance': 'Se développer',
  'financement': 'Financer sa croissance',
  'effet-reseau': "Démarrer un marketplace / effet réseau"
};
