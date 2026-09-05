/* ============================================================
   LIKANZA ACADEMY — Guide : PEA ou compte-titres (CTO) ?
   Chantier "Guides & Décryptages", phase 6 (2e guide pilote). Choisi
   explicitement SANS bloc simulationCTA : aucun comparateur fiscal PEA/CTO
   n'existe dans le Laboratoire, et ce guide ne doit jamais fabriquer un
   outil pour l'occasion — la comparaison reste conceptuelle (tableau +
   exemple chiffré), avec un renvoi honnête vers un cours existant plutôt
   qu'une fausse simulation.

   Chiffres vérifiés le 05/09/2026 par recherche web + recoupement avec les
   fiches Bibliothèque déjà réelles du site (LIBRARY: "PEA", "PFU (...)",
   "Plus-value mobilière (imposition)", scripts/app.js) qui citent déjà les
   mêmes chiffres de façon indépendante :
   - Plafond PEA : 150 000 € (225 000 € en cumulant avec un PEA-PME) —
     service-public.gouv.fr (fiche F2385, officielle).
   - PFU (flat tax) : 31,4 % depuis le 1er janvier 2026 (12,8 % IR + 18,6 %
     prélèvements sociaux, contre 30 % avant), suite à la loi de financement
     de la sécurité sociale pour 2026 (loi n°2025-1403 du 30/12/2025) —
     confirmé par la fiche officielle service-public.gouv.fr
     (entreprendre.service-public.gouv.fr/actualites/A18796) et recoupé par
     plusieurs sources indépendantes.
   - Éligibilité PEA (actions/fonds domiciliés UE/EEE, réplication synthétique
     pour les ETF mondiaux), règle des 5 ans, moins-values, succession —
     recoupés par le guide AMF "Dans un PEA, ce qu'il faut savoir".
   ============================================================ */
const GUIDE_PEA_OU_CTO = {
  slug: 'pea-ou-cto',
  question: 'PEA ou compte-titres (CTO) ?',
  title: 'PEA ou compte-titres (CTO) ? Ce qui change vraiment entre les deux enveloppes',
  shortAnswer: "Ce n'est pas vraiment un choix exclusif. Le PEA offre un vrai avantage fiscal après 5 ans de détention, mais reste plafonné à 150 000 € de versements et limité aux actions et fonds domiciliés dans l'Union européenne. Le compte-titres ordinaire (CTO) n'a aucun plafond ni aucune restriction géographique, mais chaque gain réalisé est imposé l'année où il l'est, sans exonération liée à la durée. La plupart des investisseurs qui dépassent le plafond du PEA, ou qui veulent investir hors d'Europe, utilisent les deux enveloppes en parallèle plutôt que de choisir l'une contre l'autre.",
  category: 'choisir',
  difficulty: 'intermediaire',
  readingTime: '8 min',
  publishedAt: '2026-09-05',
  updatedAt: '2026-09-05',
  freshness: 'dynamic',
  concepts: ['PEA', 'PFU (prélèvement forfaitaire unique / flat tax)', 'Plus-value mobilière (imposition)', 'ETF', 'Diversification'],
  relatedCourse: {id: 'fiscalite-pea', chapitre: 'PEA, assurance-vie, PER : quelle enveloppe pour quel objectif ?'},
  sections: [
    {
      type: 'texte',
      texte: "Tu veux commencer à investir en Bourse et tu hésites sur l'enveloppe à ouvrir en premier : le <strong>PEA</strong> (Plan d'Épargne en Actions) ou un <strong>compte-titres ordinaire</strong> (CTO) ? Les deux permettent d'acheter les mêmes types d'actifs (actions, ETF...), mais leurs règles de plafond, de fiscalité et de succession sont très différentes — et rien n'empêche, une fois que tu comprends ces différences, d'ouvrir les deux."
    },
    {
      type: 'definition',
      texte: "<strong>PEA</strong> : une enveloppe fiscale française plafonnée, réservée aux résidents fiscaux français majeurs (une seule par personne), qui donne accès à une exonération d'impôt sur le revenu sur les gains après 5 ans de détention. <strong>Compte-titres ordinaire (CTO)</strong> : un compte de placement classique, sans plafond ni condition de résidence particulière, sur lequel chaque plus-value ou dividende est imposé l'année où il est réalisé, quelle que soit la durée de détention."
    },
    {
      type: 'diagram',
      variant: 'tree',
      title: 'Les deux enveloppes peuvent être ouvertes en parallèle',
      root: 'Capital à investir',
      leaves: [
        "PEA : actions et fonds domiciliés dans l'UE/EEE, jusqu'à 150 000 € de versements (225 000 € en cumulant avec un PEA-PME)",
        "CTO : tout actif financier coté (actions américaines, asiatiques...), sans aucun plafond de versement"
      ]
    },
    {
      type: 'comparisonTable',
      intro: "Aucune des deux enveloppes n'est un \"gagnant\" universel : chacune répond à un usage différent, et elles se combinent souvent plutôt qu'elles ne s'excluent.",
      columns: [{key: 'pea', label: 'PEA'}, {key: 'cto', label: 'Compte-titres (CTO)'}],
      rows: [
        {label: 'Plafond de versement', values: {pea: '150 000 € (225 000 € en cumulant avec un PEA-PME)', cto: 'Aucun plafond'}},
        {label: 'Actifs éligibles', values: {pea: "Actions et fonds domiciliés dans l'UE/EEE (ETF mondiaux accessibles via réplication synthétique)", cto: 'Tout actif financier coté, sans restriction géographique'}},
        {label: 'Fiscalité en cas de retrait avant 5 ans', values: {pea: 'Clôture du plan dans la majorité des cas, gains imposés au PFU (31,4 %)', cto: "Sans objet : chaque gain est déjà imposé chaque année, dès sa réalisation"}},
        {label: 'Fiscalité après 5 ans (PEA) / chaque année (CTO)', values: {pea: "Gains exonérés d'impôt sur le revenu, seuls les prélèvements sociaux (18,6 %) restent dus", cto: 'Toujours au PFU (31,4 %) par défaut, chaque année, sans exonération liée à la durée'}},
        {label: 'Moins-values', values: {pea: 'Utilisables uniquement si le PEA est intégralement clôturé', cto: 'Imputables sur les plus-values de même nature, reportables jusqu\'à 10 ans'}},
        {label: 'Succession', values: {pea: 'Clôture automatique au décès ; les avantages fiscaux acquis s\'arrêtent là', cto: 'Transmis directement dans la succession, sans clôture forcée'}}
      ],
      note: 'Comparaison conceptuelle, pas un calcul sur ta situation fiscale précise : ton taux marginal d\'imposition et l\'option pour le barème progressif (à la place du PFU) peuvent changer le résultat réel — voir le cours lié en bas de page pour ce mécanisme.'
    },
    {
      type: 'casReel',
      texte: "Un investisseur qui dispose de 200 000 € à placer en actions et ETF ne peut pas tout loger dans un PEA classique, plafonné à 150 000 € de versements : il peut verser 150 000 € sur son PEA (pour profiter de l'exonération après 5 ans sur cette part) et placer les 50 000 € restants sur un CTO, qui n'a aucun plafond. Sans CTO, cet excédent ne pourrait tout simplement pas être investi dans les mêmes conditions via un PEA seul."
    },
    {
      type: 'mythReality',
      myth: 'Le compte-titres est toujours moins intéressant fiscalement que le PEA.',
      reality: "Pas nécessairement. Le CTO permet d'imputer une moins-value sur une plus-value de même nature (et de la reporter jusqu'à 10 ans) — un mécanisme que le PEA n'offre pas de la même façon, puisqu'une perte dans un PEA n'est utilisable que si le plan est intégralement clôturé. Le CTO n'impose aussi aucune durée minimale de détention ni aucune contrainte géographique. Le \"meilleur\" choix dépend du montant à investir, des actifs visés et du taux marginal d'imposition du foyer — jamais d'une règle universelle."
    },
    {
      type: 'risks',
      items: [
        {label: "Retirer un PEA avant 5 ans sans anticiper la clôture", texte: "Un retrait avant 5 ans entraîne, dans la majorité des cas, la clôture définitive du plan — impossible ensuite de rouvrir un PEA \"à la même ancienneté\"."},
        {label: 'Un retrait ne libère jamais de nouveau plafond de versement', texte: "Le plafond du PEA (150 000 €) s'apprécie sur le total versé depuis l'ouverture, jamais sur la valeur actuelle ou sur ce qu'il reste après un retrait — une confusion fréquente."},
        {label: 'Concentration géographique du PEA', texte: "Un PEA seul limite l'exposition aux actions et fonds domiciliés dans l'UE/EEE (via réplication synthétique pour certains ETF mondiaux) — une diversification hors zone euro nécessite un CTO en complément."},
        {label: 'Oublier de déclarer une moins-value sur un CTO', texte: "Une moins-value non déclarée l'année de sa réalisation peut ensuite être plus difficile à faire valoir pour réduire l'imposition d'une plus-value future."}
      ]
    },
    {
      type: 'faq',
      items: [
        {question: 'Puis-je avoir un PEA et un compte-titres en même temps ?', reponse: "Oui. Ce sont deux enveloppes indépendantes : rien n'empêche de les ouvrir et de les alimenter en parallèle, chez le même établissement ou chez deux établissements différents."},
        {question: 'Que se passe-t-il si je retire de l\'argent de mon PEA avant 5 ans ?', reponse: "Dans la majorité des cas, tout retrait avant 5 ans entraîne la clôture du plan et l'imposition des gains au PFU (31,4 %), sauf exceptions prévues par la loi (licenciement, invalidité, création d'entreprise, mise à la retraite anticipée)."},
        {question: 'Le compte-titres permet-il d\'investir en actions américaines ?', reponse: "Oui, sans restriction — contrairement au PEA, qui exige que les actions détenues en direct soient domiciliées dans l'Union européenne ou l'Espace économique européen."}
      ]
    }
  ],
  methodology: {
    calcul: "Le tableau comparatif de cette page est conceptuel, pas un calcul sur ta situation fiscale réelle — aucun comparateur PEA/CTO n'existe aujourd'hui dans le Laboratoire financier de Likanza (contrairement au comparateur DCA vs investissement en une fois) : ce guide reste honnête sur cette limite plutôt que de fabriquer un simulateur pour l'occasion.",
    donnees: "Plafond de versement du PEA (150 000 €, 225 000 € en cumulant avec un PEA-PME) et taux du PFU (31,4 % depuis le 1er janvier 2026, dont 18,6 % de prélèvements sociaux) : chiffres officiels vérifiés auprès de service-public.gouv.fr et recoupés avec les fiches Bibliothèque \"PEA\" et \"PFU (prélèvement forfaitaire unique / flat tax)\" déjà présentes sur Likanza.",
    hypotheses: "Le cas réel chiffré (200 000 € à répartir) illustre uniquement la mécanique du plafond, jamais une recommandation de montant à investir.",
    limites: "Les taux et plafonds cités sont ceux en vigueur au 1er janvier 2026 et peuvent évoluer (la flat tax elle-même vient de changer au moment de la rédaction de ce guide, d'où son étiquette \"données datées\" ci-dessus). Ce guide ne remplace jamais un conseil fiscal personnalisé : le taux marginal d'imposition de chaque foyer, et l'option pour le barème progressif à la place du PFU, peuvent changer le résultat réel au cas par cas."
  },
  sources: [
    {title: 'PEA (Plan d\'Épargne en Actions)', publisher: 'service-public.gouv.fr', date: '2026', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2385', sourceType: 'official_data'},
    {title: 'Évolution du taux du Prélèvement Forfaitaire Unique (PFU)', publisher: 'service-public.gouv.fr', date: '2026', url: 'https://entreprendre.service-public.gouv.fr/actualites/A18796', sourceType: 'official_data'},
    {title: 'Dans un PEA (Plan d\'Épargne en Actions), ce qu\'il faut savoir', publisher: 'Autorité des marchés financiers (AMF)', date: '2023', url: 'https://www.amf-france.org/sites/institutionnel/files/private/2023-12/2023_investir_dans_un_pea.pdf', sourceType: 'institutional'}
  ]
};

renderGuidePage('guideContent', GUIDE_PEA_OU_CTO);
