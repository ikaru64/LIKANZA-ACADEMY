/* ============================================================
   LIKANZA ACADEMY — Guide : Comment savoir si une action est chère ?
   Chantier "Guides & Décryptages", batch 3 (6e guide, premier de la
   catégorie "decider" — Marchés & décisions). Première dans la maison
   ce n'est pas une comparaison binaire "X ou Y" comme les 5 guides
   précédents : la question elle-même n'a pas de réponse en un seul chiffre,
   le guide le dit explicitement dès la réponse courte plutôt que de forcer
   un faux choix entre deux options.

   SANS simulationCTA : aucun calculateur de valorisation (PER, comparaison
   sectorielle) n'existe dans le Laboratoire financier — la partie Bourse du
   site affiche déjà le PER réel de chaque action suivie (via
   resolveFollowedAsset/STOCKS_DEMO), donc le pont "pratique" de ce guide est
   un relatedCourse (chapitre PER déjà réel de bourse-actions) plutôt qu'un
   outil fabriqué pour l'occasion.

   Sources vérifiées le 10/09/2026 par recherche web (WebSearch + WebFetch
   direct sur les pages, pas seulement le résumé du moteur de recherche) :
   - vernimmen.net (glossaire, HEC Paris / Pascal Quiry — Yann Le Fur),
     page "Price earning ratio" : confirme textuellement que le PER dépend
     de 3 facteurs (croissance future des bénéfices, risque, taux
     d'intérêt), et qu'il est "fortement affecté par la structure
     financière" (l'endettement) de l'entreprise étudiée, nécessitant une
     "utilisation prudente" — repris tel quel dans le bloc "risks"
     ci-dessous, jamais reformulé au-delà de ce que la page dit réellement.
   - legifiscal.fr, page "Price Earning Ratio (PER)" : confirme textuellement
     que le PER "permet de comparer la cherté d'une société par rapport à
     d'autres du même secteur d'activité", qu'un PER élevé "dénote une
     anticipation de bénéfices futurs", et qu'il "peut être faussé par un
     résultat exceptionnel, à la suite de la cession d'un actif, ou encore
     un endettement important" — repris dans le bloc "risks".
   - Le tableau comparatif ci-dessous (2 profils illustratifs) est une
     construction pédagogique, explicitement présentée comme telle (jamais
     deux entreprises réelles ni des chiffres de marché actuels) — même
     discipline que l'exemple chiffré du chapitre PER de bourse-actions
     (data.js/app.js), qui utilise déjà un exemple générique (100€/5€) plutôt
     qu'une action réelle dont le PER changerait dès le lendemain.
   ============================================================ */
const GUIDE_ACTION_CHERE = {
  slug: 'action-chere',
  question: 'Comment savoir si une action est chère ?',
  title: "Comment savoir si une action est chère ? Ce qu'un seul chiffre ne peut jamais te dire",
  shortAnswer: "Aucun chiffre unique ne permet de trancher. Le PER (le prix de l'action divisé par le bénéfice par action) est le point de départ le plus courant, mais il ne veut dire quelque chose que comparé à celui d'entreprises du même secteur et à la croissance des bénéfices attendue — un PER élevé peut refléter une vraie croissance à venir, un PER faible peut cacher un vrai risque, et le PER lui-même peut être faussé par un résultat exceptionnel ou un endettement important.",
  category: 'decider',
  difficulty: 'intermediaire',
  readingTime: '8 min',
  publishedAt: '2026-09-10',
  updatedAt: '2026-09-10',
  freshness: 'evergreen',
  concepts: ['PER (Price Earning Ratio)', 'Dividende', 'Rendement du dividende', 'Capitalisation boursière'],
  relatedCourse: {id: 'bourse-actions', chapitre: '5. Le PER : un premier outil pour interpréter un prix'},
  relatedDefiCategory: 'Actions',
  sections: [
    {
      type: 'texte',
      texte: "Tu regardes une action et tu te demandes si elle est \"chère\" ou \"bon marché\" — une question naturelle, mais qui n'a jamais de réponse en un seul chiffre. Le prix affiché seul (10 €, 100 € ou 1 000 €) ne dit rien : tout dépend du nombre d'actions émises (voir la <strong>capitalisation boursière</strong>) et surtout de ce que l'entreprise gagne réellement. Ce guide explique le réflexe le plus courant pour aborder cette question — et pourquoi il ne suffit jamais, seul, à trancher."
    },
    {
      type: 'definition',
      texte: "Le <strong>PER (Price Earning Ratio, ou rapport cours/bénéfice)</strong> compare le prix d'une action au bénéfice net qu'elle génère par action. C'est l'outil le plus utilisé pour discuter de la \"cherté\" d'une action, mais ce n'est qu'un point de départ : le même chiffre peut vouloir dire des choses très différentes selon le secteur et la situation de l'entreprise."
    },
    {
      type: 'diagram',
      title: "Le bon réflexe, étape par étape",
      steps: [
        "Regarder le PER seul ne dit presque rien : 15, 25 ou 40 n'ont pas de sens dans l'absolu",
        "Le comparer au PER d'entreprises du même secteur — un PER \"normal\" varie fortement d'un secteur à l'autre",
        "Le comparer aussi à l'historique du PER de cette même action, pour voir si elle se paie plus ou moins cher que d'habitude",
        "Croiser avec la croissance des bénéfices attendue : un PER plus élevé est plus justifiable pour une entreprise dont les bénéfices croissent vite",
        "Regarder si l'entreprise verse un dividende, et à quel rendement — un deuxième angle, pas un substitut au PER",
        "Se faire un avis prudent à partir de ces éléments croisés, jamais une certitude à partir d'un seul chiffre"
      ]
    },
    {
      type: 'comparisonTable',
      intro: "Un exemple pédagogique (deux profils illustratifs, pas deux entreprises réelles) : le même PER de 25 n'a pas la même signification selon le profil de l'entreprise.",
      columns: [{key: 'croissance', label: 'Profil A — forte croissance anticipée'}, {key: 'mature', label: 'Profil B — activité mature, stable'}],
      rows: [
        {label: 'PER (illustratif)', values: {croissance: '25', mature: '25'}},
        {label: 'Croissance des bénéfices attendue', values: {croissance: 'Élevée (le marché anticipe des bénéfices bien plus hauts dans quelques années)', mature: 'Faible ou nulle (activité stable, peu d\'évolution attendue)'}},
        {label: 'Ce que le même PER de 25 peut refléter ici', values: {croissance: "Un prix qui \"parie\" sur une croissance future réelle — pas nécessairement une survalorisation", mature: "Un prix plus difficile à justifier si les bénéfices ne progressent pas pour le \"rattraper\""}},
        {label: 'Rendement du dividende typique', values: {croissance: 'Souvent faible ou nul (bénéfices réinvestis dans la croissance plutôt que distribués)', mature: 'Souvent plus élevé (moins d\'opportunités de réinvestissement interne à forte rentabilité)'}},
        {label: 'Risque principal', values: {croissance: 'La croissance anticipée ne se réalise pas (le prix intègre déjà beaucoup d\'optimisme)', mature: 'Stagnation durable sans qu\'aucune amélioration ne vienne justifier même ce PER modéré'}}
      ],
      note: "Un PER identique ne permet donc jamais, à lui seul, de dire laquelle des deux est la plus \"chère\" au sens où l'entend le marché — c'est précisément pour ça qu'il doit toujours être lu avec le contexte de croissance et de secteur."
    },
    {
      type: 'texte',
      texte: "Le <strong>rendement du dividende</strong> (le dividende annuel divisé par le cours de l'action) est un deuxième angle utile, mais avec le même piège que le PER pris isolément : il évolue chaque jour avec le cours, même quand le dividende versé ne change pas. Un rendement qui paraît soudain élevé peut refléter un dividende généreux — ou un cours qui a fortement chuté, sans que l'entreprise verse davantage. Le chiffre seul ne distingue pas les deux cas."
    },
    {
      type: 'mythReality',
      myth: "Un PER bas veut dire que l'action est une bonne affaire, sous-évaluée par le marché.",
      reality: "Pas nécessairement. Un PER bas peut aussi signifier que le marché anticipe une baisse future des bénéfices, un risque spécifique à l'entreprise ou à son secteur, ou une croissance jugée limitée. Le PER est un point de comparaison entre entreprises d'un même secteur, jamais une conclusion à lui seul — un PER bas isolé n'est ni un signal d'achat, ni un signal de vente."
    },
    {
      type: 'risks',
      items: [
        {label: 'Le PER peut être faussé par un résultat exceptionnel', texte: "Un résultat net gonflé ponctuellement par la cession d'un actif, ou au contraire réduit par une charge exceptionnelle, fait bouger le PER sans rien changer à la vraie rentabilité récurrente de l'entreprise — une fiche PER isolée sur un seul exercice peut donner une image trompeuse."},
        {label: 'Un endettement important fausse la comparaison', texte: "Le PER est fortement affecté par la structure financière de l'entreprise étudiée : deux entreprises avec le même bénéfice par action mais des niveaux de dette très différents ne portent pas le même risque, alors que le PER seul ne le montre pas."},
        {label: 'Le PER n\'a pas de sens pour une entreprise sans bénéfice', texte: "Une entreprise en perte a un bénéfice par action négatif ou nul : le PER devient alors incalculable ou dénué de sens, ce qui ne veut pas dire que l'action n'a aucune valeur — d'autres façons d'estimer un prix existent pour ce cas, hors du champ de ce guide."},
        {label: 'Comparer des secteurs très différents entre eux', texte: "Un PER \"normal\" pour un secteur à forte croissance anticipée est structurellement plus élevé que pour un secteur mature — comparer le PER d'une entreprise à celui d'une autre d'un secteur totalement différent ne dit rien de fiable sur laquelle est la plus chère."}
      ]
    },
    {
      type: 'faq',
      items: [
        {question: "Existe-t-il un \"bon\" PER universel, valable pour toutes les actions ?", reponse: "Non. Ce qui est considéré comme un PER \"normal\" varie fortement d'un secteur à l'autre, et dans le temps selon les taux d'intérêt et l'appétit général du marché pour le risque — un PER de 30 peut être ordinaire dans un secteur en forte croissance, et élevé dans un secteur mature."},
        {question: "Le rendement du dividende suffit-il, à lui seul, à juger si une action est chère ?", reponse: "Non, pour la même raison que le PER seul ne suffit pas : un rendement élevé peut refléter un dividende généreux et soutenable, ou au contraire un cours qui a chuté sans que rien ne se soit amélioré. Il se lit toujours avec d'autres éléments, jamais isolément."},
        {question: "Le PER est-il utile pour une entreprise qui ne fait pas encore de bénéfice ?", reponse: "Très peu : un bénéfice par action négatif ou proche de zéro rend le PER incalculable ou peu significatif. D'autres indicateurs, adaptés à ce cas, existent mais sortent du cadre de ce guide, centré sur le PER comme premier réflexe pour une entreprise déjà bénéficiaire."}
      ]
    }
  ],
  methodology: {
    calcul: "Ce guide ne calcule rien sur une action réelle et ne fournit aucun chiffre de marché daté : la partie Bourse de Likanza affiche déjà le PER réel, calculé et daté, de chaque action suivie — ce guide explique seulement comment le lire, jamais un nouveau calculateur.",
    donnees: "Les points sur l'interprétation du PER (dépendance à la croissance/au risque/aux taux, distorsion par un résultat exceptionnel ou un endettement important, comparaison au sein d'un même secteur) proviennent de vernimmen.net (glossaire de référence en finance d'entreprise) et de legifiscal.fr, vérifiés directement sur ces pages le 10/09/2026 — jamais un résumé de résumé.",
    hypotheses: "Le tableau comparatif (Profil A / Profil B) est une construction pédagogique avec un PER identique choisi à dessein pour illustrer que le même chiffre peut avoir deux significations différentes — ce ne sont pas deux entreprises réelles ni des données de marché.",
    limites: "Ce guide se limite au PER et au rendement du dividende, les deux indicateurs déjà enseignés ailleurs sur Likanza (cours \"Comprendre la Bourse et les actions\", Bibliothèque). D'autres méthodes de valorisation existent (multiples sur le chiffre d'affaires ou l'EBITDA, actualisation des flux de trésorerie...) mais ne sont pas couvertes ici."
  },
  sources: [
    {title: 'Price earning ratio (glossaire)', publisher: 'Vernimmen.net (Pascal Quiry, Yann Le Fur)', date: '2026', url: 'https://www.vernimmen.net/Pratiquer/Glossaire/definition/Price%20earning%20ratio.html', sourceType: 'institutional'},
    {title: 'Price Earning Ratio (PER)', publisher: 'LégiFiscal', date: '2026', url: 'https://www.legifiscal.fr/placements/epargne/bourse-pea/price-earning-ratio-per.html', sourceType: 'secondary'}
  ]
};

renderGuidePage('guideContent', GUIDE_ACTION_CHERE);
