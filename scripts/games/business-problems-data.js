/* ============================================================
   LIKANZA ACADEMY — « J'ai un problème »
   10 problèmes business courants, chacun relié à : des notions de la
   Bibliothèque, un cas réel qui a affronté le même problème
   (via le tag partagé avec BUSINESS_CASES), éventuellement un outil
   du Business Lab quand un calcul concret aide vraiment, et des
   questions de réflexion — jamais une recommandation unique. Le champ
   `tag` doit correspondre exactement à une clé de
   BUSINESS_CASE_TAG_LABELS (business-cases-data.js) pour que les cas
   liés se retrouvent automatiquement, sans duplication de contenu.
   ============================================================ */

const BUSINESS_PROBLEMS = [
  {
    id: 'trop-concurrence', tag: 'concurrence', icon: '🥊',
    titre: "Il y a trop de concurrence sur mon marché",
    description: "Beaucoup de concurrents ne veut pas dire qu'il n'y a pas de place — mais ça change complètement la stratégie à adopter : se battre sur le prix rarement une bonne idée face à des acteurs plus gros.",
    libraryTermes: ['Avantage concurrentiel', 'Barrières à l\'entrée', 'Positionnement'],
    outil: null,
    questions: [
      "Qu'est-ce que je peux offrir que mes concurrents directs n'offrent pas ou mal ?",
      "Est-ce que je vise le même client qu'eux, ou un segment qu'ils négligent ?"
    ]
  },
  {
    id: 'premiers-clients', tag: 'premiers-clients', icon: '🚀',
    titre: "Je n'arrive pas à trouver mes premiers clients",
    description: "Avant la question du volume, il y a souvent une question plus simple non résolue : qui, précisément, a ce problème, et où cette personne se trouve-t-elle déjà ?",
    libraryTermes: ['Proposition de valeur', 'Positionnement'],
    outil: { type: 'link', href: 'construire-son-projet.html', label: "Reprendre l'outil Construire mon idée" },
    questions: [
      "Est-ce que je peux nommer 3 personnes réelles qui ont ce problème, pas juste un profil imaginé ?",
      "Où ces personnes passent-elles déjà du temps, en ligne ou hors ligne ?"
    ]
  },
  {
    id: 'se-differencier', tag: 'differenciation', icon: '✨',
    titre: "Je ne sais pas comment me différencier",
    description: "Se différencier ne veut pas forcément dire innover sur le produit — parfois c'est le service, la rapidité ou l'expérience client qui fait la différence.",
    libraryTermes: ['Proposition de valeur', 'Avantage concurrentiel'],
    outil: null,
    questions: [
      "Sur quel critère mes clients actuels disent-ils déjà que je suis différent, même un peu ?",
      "Est-ce que ma différence est facile à copier, ou est-ce qu'elle demande du temps à construire ?"
    ]
  },
  {
    id: 'prix-mal-calibre', tag: 'prix', icon: '🏷️',
    titre: "Mon prix est peut-être mal calibré",
    description: "Un prix trop bas peut sembler attirer plus de clients tout en tuant la marge ; un prix trop haut peut sembler prudent tout en éloignant les clients. Les deux se testent avec des chiffres, pas avec une intuition.",
    libraryTermes: ['Marge brute', 'Seuil de rentabilité'],
    outil: { type: 'lab', id: 'unit-economics', label: 'Tester mon prix dans Unit Economics' },
    questions: [
      "Si je baisse mon prix de 10%, combien de ventes en plus faudrait-il pour gagner autant qu'avant ?",
      "Est-ce que mes clients actuels ont déjà négocié ou hésité sur le prix ?"
    ]
  },
  {
    id: 'visiteurs-peu-ventes', tag: 'conversion', icon: '📉',
    titre: "J'ai des visiteurs mais peu de ventes",
    description: "L'intérêt et l'achat sont deux étapes différentes — le problème peut venir de l'offre elle-même, du prix, de la confiance, ou simplement du moment où l'achat est proposé.",
    libraryTermes: ['Freemium', 'Proposition de valeur'],
    outil: { type: 'lab', id: 'unit-economics', label: 'Vérifier la cohérence prix/marge dans Unit Economics' },
    questions: [
      "À quelle étape précise les visiteurs abandonnent-ils : avant de voir le prix, ou après ?",
      "Est-ce que j'ai déjà demandé directement à 5 visiteurs pourquoi ils n'ont pas acheté ?"
    ]
  },
  {
    id: 'cac-trop-cher', tag: 'cac', icon: '💸',
    titre: "Acquérir un client me coûte trop cher",
    description: "Un CAC élevé n'est pas forcément un problème s'il reste inférieur à ce que rapporte ce client dans la durée — le vrai signal, c'est le ratio entre les deux, pas le CAC seul.",
    libraryTermes: ['CAC', 'LTV'],
    outil: { type: 'lab', id: 'unit-economics', label: 'Calculer mon ratio LTV/CAC dans Unit Economics' },
    questions: [
      "Est-ce que je connais précisément combien coûte l'acquisition d'un client, canal par canal ?",
      "Est-ce que ce client, une fois acquis, achète une seule fois ou revient plusieurs fois ?"
    ]
  },
  {
    id: 'retention-faible', tag: 'retention', icon: '🔁',
    titre: "Mes clients ne reviennent pas assez",
    description: "La rétention détermine si l'acquisition de nouveaux clients fait vraiment croître le business, ou si elle se contente de remplacer ceux qui partent.",
    libraryTermes: ['Churn', 'LTV', 'Freemium'],
    outil: { type: 'lab', id: 'unit-economics', label: 'Voir l\'effet de la rétention sur la LTV dans Unit Economics' },
    questions: [
      "Est-ce que je sais à quel moment, précisément, les clients arrêtent d'utiliser ou d'acheter ?",
      "Qu'est-ce qui distingue mes clients les plus fidèles de ceux qui partent après un seul achat ?"
    ]
  },
  {
    id: 'pas-rentable', tag: 'rentabilite', icon: '📊',
    titre: "Mon activité n'est pas (encore) rentable",
    description: "Ne pas être rentable au début n'est pas anormal — la question utile est de savoir à partir de combien de ventes ça deviendrait rentable, et si c'est réaliste.",
    libraryTermes: ['Seuil de rentabilité', 'Marge brute', 'Cash flow'],
    outil: { type: 'lab', id: 'unit-economics', label: 'Calculer mon seuil de rentabilité dans Unit Economics' },
    questions: [
      "Combien de ventes par mois faudrait-il pour couvrir mes charges fixes, avec ma marge actuelle ?",
      "Ce nombre de ventes est-il déjà proche de ce que je fais, ou très loin ?"
    ]
  },
  {
    id: 'changer-modele', tag: 'business-model', icon: '🔄',
    titre: "Je me demande si je devrais changer de modèle économique",
    description: "Changer de modèle (vente unique vers abonnement, gratuit vers freemium...) change aussi les coûts, les risques et le rythme d'encaissement — ce n'est jamais un changement neutre.",
    libraryTermes: ['Modèle économique', 'Cash flow'],
    outil: { type: 'link', href: 'business-cases.html', label: 'Comparer les modèles économiques' },
    questions: [
      "Est-ce que le nouveau modèle correspond à la façon dont mes clients préfèrent déjà payer ?",
      "Est-ce que je peux tenir la trésorerie pendant la transition d'un modèle à l'autre ?"
    ]
  },
  {
    id: 'se-developper', tag: 'croissance', icon: '📈',
    titre: "Je veux me développer mais je ne sais pas comment",
    description: "Grandir peut vouloir dire plus de clients, plus de produits, ou plus de zones géographiques — chaque direction a des coûts et des risques différents.",
    libraryTermes: ['Économies d\'échelle', 'Effet réseau', 'Barrières à l\'entrée'],
    outil: null,
    questions: [
      "Est-ce que mon activité actuelle est déjà stable avant d'ajouter de la croissance dessus ?",
      "Qu'est-ce qui limiterait ma croissance en premier : la demande, l'argent, ou ma capacité à produire/livrer ?"
    ]
  }
];
