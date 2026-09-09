/* ============================================================
   LIKANZA ACADEMY — Guide : Rembourser ses dettes, avalanche ou boule de neige ?
   Chantier "Guides & Décryptages", batch 3 (09/09/2026), choisi pendant
   l'exécution du plan "do them all" comme prochain sujet frais. Lab-bridge
   RÉEL vers widget-debt-strategy (computeDebtPayoffPlan/renderDebtPayoffComparison,
   laboratoire.js, tab-dettes) — un comparateur mois par mois déjà réel et
   déjà audité (voir project_laboratoire_personnel_status), pas un outil
   fabriqué pour l'occasion.

   Chiffres/sources vérifiés par recherche web le 09/09/2026 :
   - Définitions avalanche/boule de neige et l'écart d'intérêts totaux
     (l'avalanche coûte structurellement moins cher, la boule de neige plus
     motivante) : convergence entre NFCC (National Foundation for Credit
     Counseling, association à but non lucratif réelle) et Fidelity.
   - Le mécanisme psychologique ("visible-progress effect") : Kettle, K. L.,
     Trudel, R., Blanchard, S. J., & Häubl, G. (2016), "Repayment
     Concentration and Consumer Motivation to Get Out of Debt", Journal of
     Consumer Research, 43(3), 460-477 — étude académique réelle (4 études
     labo + 1 étude terrain), publiée par Oxford Academic. Présentée avec
     précision : l'étude compare une CONCENTRATION du remboursement sur un
     seul compte à la fois (ce que font À LA FOIS l'avalanche ET la boule de
     neige) contre une répartition égale sur tous les comptes (une 3e
     stratégie, ni l'une ni l'autre) — elle ne compare donc PAS directement
     avalanche vs boule de neige entre elles, seulement "concentrer" vs
     "disperser". Jamais présentée comme une preuve directe que la boule de
     neige bat l'avalanche psychologiquement, seulement que concentrer les
     efforts (le principe commun aux deux méthodes) motive plus que disperser.
   - Aucune source institutionnelle française (Banque de France, INC)
     n'a été trouvée traitant spécifiquement de ces 2 méthodes nommées —
     concept d'origine nord-américaine (popularisé notamment par Dave
     Ramsey pour la "boule de neige") sans équivalent officiel français
     identifié ; les 2 sources utilisées sont donc étrangères, comme déjà
     assumé et disclosed pour le guide ETF-ou-stock-picking (SPIVA US) —
     les principes mathématiques et comportementaux ne dépendent pas du pays.
   ============================================================ */
const GUIDE_AVALANCHE_OU_BOULE_DE_NEIGE = {
  slug: 'avalanche-ou-boule-de-neige',
  question: 'Rembourser ses dettes : avalanche ou boule de neige ?',
  title: 'Avalanche ou boule de neige ? Les deux méthodes réelles pour rembourser plusieurs crédits',
  shortAnswer: "Quand tu as plusieurs crédits en cours et une petite somme en plus à leur consacrer chaque mois, deux méthodes réelles existent pour décider où la mettre en priorité. La méthode avalanche (rembourser d'abord le taux le plus élevé) minimise mathématiquement le total des intérêts payés. La méthode boule de neige (rembourser d'abord le plus petit solde) coûte structurellement un peu plus cher en intérêts, mais des travaux de recherche montrent qu'elle peut être plus motivante à tenir dans la durée, en donnant des victoires visibles plus tôt. Le bon choix dépend de ce qui te fait le plus risquer d'abandonner en cours de route : le coût, ou le manque de motivation.",
  category: 'budget',
  difficulty: 'debutant',
  readingTime: '7 min',
  publishedAt: '2026-09-09',
  updatedAt: '2026-09-09',
  freshness: 'evergreen',
  concepts: ['Intérêts composés', 'Budget', "Fonds d'urgence"],
  relatedTools: [{label: 'Comparateur de stratégies de remboursement (Laboratoire)', url: 'laboratoire.html#tab-dettes'}],
  relatedCourse: {id: 'budget-securite', chapitre: 'Ta valeur nette : ce que tu possèdes vraiment'},
  sections: [
    {
      type: 'texte',
      texte: "Tu as plusieurs crédits en cours — une carte de crédit, un prêt personnel, peut-être un crédit auto — et tu peux consacrer un peu plus que les mensualités minimales chaque mois. Où mettre ce surplus en priorité ? Deux méthodes réelles, réellement utilisées, répondent à cette question de deux façons différentes."
    },
    {
      type: 'definition',
      texte: "<strong>Méthode avalanche</strong> : tu classes tes crédits du taux d'intérêt le plus élevé au plus faible, tu paies les mensualités minimales sur tous, et tout ton surplus va sur le crédit au taux le plus élevé. Une fois soldé, tu passes au suivant. <strong>Méthode boule de neige</strong> : même principe, mais tu classes tes crédits du plus petit solde restant au plus grand, indépendamment du taux — le surplus va d'abord sur le plus petit solde."
    },
    {
      type: 'diagram',
      title: 'Le principe commun aux deux méthodes : concentrer, jamais disperser',
      steps: [
        'Payer la mensualité minimale sur CHAQUE crédit, sans exception',
        "Classer les crédits selon un seul critère (taux pour l'avalanche, solde pour la boule de neige)",
        "Envoyer TOUT le surplus disponible sur un seul crédit à la fois (le premier de la liste)",
        "Une fois ce crédit soldé, rediriger sa mensualité minimale + le surplus vers le crédit suivant de la liste"
      ]
    },
    {
      type: 'comparisonTable',
      intro: "Aucune des deux méthodes n'est un \"gagnant\" universel : elles répondent à deux priorités différentes.",
      columns: [{key: 'avalanche', label: 'Avalanche'}, {key: 'boule', label: 'Boule de neige'}],
      rows: [
        {label: 'Critère de tri', values: {avalanche: 'Taux d\'intérêt (du plus élevé au plus faible)', boule: 'Solde restant (du plus petit au plus grand)'}},
        {label: 'Coût total en intérêts', values: {avalanche: 'Toujours le plus bas possible, mathématiquement', boule: 'Plus élevé — souvent de quelques dizaines à quelques centaines d\'euros selon les taux et soldes réels'}},
        {label: 'Premier crédit soldé', values: {avalanche: 'Peut prendre du temps si le taux le plus élevé a aussi un gros solde', boule: 'Rapide par construction (le plus petit solde en premier)'}},
        {label: 'Ce qui la rend plus facile à tenir', values: {avalanche: 'Le résultat financier objectif, si tu es motivé par le chiffre', boule: 'Les victoires rapprochées et visibles, si tu risques de décourager'}},
        {label: 'Cas où le résultat est identique', values: {avalanche: 'Le crédit au taux le plus élevé a AUSSI le plus petit solde', boule: 'Le crédit au plus petit solde a AUSSI le taux le plus élevé'}}
      ],
      note: 'Comparaison conceptuelle — utilise le comparateur du Laboratoire (lien en bas de page) pour un calcul mois par mois avec tes vrais crédits, soldes et taux.'
    },
    {
      type: 'pourquoi',
      texte: "L'écart entre les deux méthodes vient directement des intérêts composés : chaque mois, un crédit non soldé génère de nouveaux intérêts calculés sur son solde restant. Concentrer le surplus sur le taux le plus élevé (avalanche) réduit le solde qui génère le PLUS d'intérêts chaque mois, ce qui limite mathématiquement le montant total payé sur toute la durée du remboursement — un euro de surplus mis sur un crédit à 19% \"économise\" toujours plus d'intérêts futurs que le même euro mis sur un crédit à 5%, quel que soit le solde de chacun."
    },
    {
      type: 'casReel',
      texte: "Une étude académique publiée dans le Journal of Consumer Research (Kettle, Trudel, Blanchard & Häubl, 2016, 4 études en laboratoire et 1 étude de terrain) a mesuré l'effet de la CONCENTRATION du remboursement sur la motivation à continuer : les participants qui concentraient leur effort sur un seul compte à la fois (le principe commun à l'avalanche ET à la boule de neige) ont rapporté une motivation plus élevée, une perception de progrès plus forte, et sont restés inscrits dans leur plan de remboursement plus longtemps que ceux qui répartissaient le même montant total également sur tous leurs comptes. Le mécanisme identifié : un compte qui descend rapidement vers zéro est un signal de progrès fréquent et visible, alors qu'un gros solde qui baisse lentement est difficile à distinguer d'une absence de progrès. Cette étude ne compare pas directement l'avalanche à la boule de neige entre elles — elle valide surtout l'idée de concentrer l'effort sur un seul crédit à la fois plutôt que de le disperser sur tous, ce qui est déjà vrai pour les deux méthodes."
    },
    {
      type: 'mythReality',
      myth: 'La boule de neige est juste "moins bonne" que l\'avalanche, il n\'y a pas de vraie raison de la choisir.',
      reality: "Non — le surcoût réel en intérêts de la boule de neige est souvent limité si l'écart de taux entre tes crédits n'est pas énorme, alors que le risque d'abandonner un plan de remboursement démotivant a, lui, un coût total qui peut être bien plus élevé : un crédit qu'on arrête de rembourser en priorité continue de générer des intérêts indéfiniment. Une méthode qu'on tient jusqu'au bout coûte toujours moins cher qu'une méthode optimale abandonnée à mi-chemin."
    },
    {
      type: 'attention',
      texte: "Avant d'accélérer le remboursement de tes crédits, la plupart des professionnels du conseil budgétaire recommandent de garder un petit fonds d'urgence de côté — sans lui, le moindre imprévu (réparation, panne) t'oblige à réutiliser du crédit, souvent au pire moment, et annule l'effort déjà fait."
    },
    {
      type: 'risks',
      items: [
        {label: 'Reprendre du crédit pendant le remboursement', texte: "Continuer à utiliser une carte de crédit remboursée par ailleurs (ou en ouvrir une nouvelle) pendant que tu appliques l'une des deux méthodes annule une partie de l'effort — le solde total de tes dettes peut stagner ou remonter malgré les versements."},
        {label: 'Abandonner après un imprévu', texte: "Un choc financier (perte de revenu, dépense imprévue) sans fonds d'urgence peut interrompre le plan en cours de route — voir l'avertissement ci-dessus."},
        {label: 'Pénalités de remboursement anticipé', texte: "Certains crédits (surtout immobiliers) prévoient des indemnités en cas de remboursement plus rapide que prévu — à vérifier auprès de chaque prêteur avant d'y consacrer un surplus important."},
        {label: 'Négliger le taux au profit du seul solde (boule de neige)', texte: "Un tout petit crédit à un taux très bas soldé en premier retarde le traitement d'un gros crédit à taux élevé qui, lui, continue de coûter cher chaque mois qui passe."}
      ]
    },
    {
      type: 'faq',
      items: [
        {question: "Puis-je changer de méthode en cours de route ?", reponse: "Oui — rien n'empêche de commencer en boule de neige pour prendre de l'élan avec une ou deux petites victoires rapides, puis de basculer en avalanche une fois la motivation installée. Ce n'est pas un choix figé pour toujours."},
        {question: "Et si mes crédits ont tous à peu près le même taux ?", reponse: "Dans ce cas, l'écart de coût entre les deux méthodes devient minime, et le critère de motivation (boule de neige) prend le dessus sans vraiment sacrifier grand-chose financièrement."},
        {question: "La méthode s'applique-t-elle aussi à un seul crédit ?", reponse: "Non — ces deux méthodes ne concernent que l'ORDRE de priorité entre PLUSIEURS crédits distincts. Avec un seul crédit, la seule question est combien de surplus mensuel y consacrer, pas dans quel ordre."}
      ]
    },
    {
      type: 'simulationCTA',
      intro: "Le tableau ci-dessus reste conceptuel. Le Laboratoire compare les deux stratégies mois par mois, sur tes vrais crédits (solde, taux, mensualité minimale) et ton vrai surplus disponible.",
      label: 'Comparer les deux stratégies sur mes crédits →',
      targetUrl: 'laboratoire.html#tab-dettes',
      fields: [
        {key: 'extraMonthly', label: 'Mensualité supplémentaire que tu peux consacrer (€)', default: 100}
      ]
    }
  ],
  methodology: {
    calcul: "Le tableau comparatif de cette page est conceptuel, jamais un calcul sur de vrais crédits — pour un vrai calcul, utilise le comparateur du Laboratoire, qui simule mois par mois (avec intérêts composés réels) les deux stratégies sur tes crédits saisis.",
    donnees: "Les définitions et l'écart de coût entre les deux méthodes proviennent de NFCC (National Foundation for Credit Counseling) et de Fidelity. Le mécanisme psychologique cité provient d'une étude académique publiée dans le Journal of Consumer Research (Kettle et al., 2016).",
    hypotheses: "L'étude académique citée compare la CONCENTRATION du remboursement (principe commun à l'avalanche et à la boule de neige) à une répartition égale sur tous les comptes — elle ne compare pas directement l'avalanche à la boule de neige l'une contre l'autre.",
    limites: "Aucune source institutionnelle française n'a été trouvée traitant spécifiquement de ces deux méthodes nommées (concept d'origine nord-américaine) — les sources utilisées sont donc étrangères, mais les principes mathématiques (intérêts composés) et comportementaux (progrès visible) qu'elles décrivent ne dépendent pas du pays. L'écart de coût réel entre les deux méthodes dépend entièrement des taux et soldes réels de chacun — parfois négligeable, parfois important."
  },
  sources: [
    {title: 'Debt Avalanche vs Debt Snowball - Best Way to Pay off Debt', publisher: 'National Foundation for Credit Counseling (NFCC)', url: 'https://www.nfcc.org/blog/what-is-the-best-way-to-pay-off-debt-debt-avalanche-vs-debt-snowball/', sourceType: 'institutional'},
    {title: 'Debt snowball method vs. debt avalanche method: Which is right for you?', publisher: 'Fidelity', url: 'https://www.fidelity.com/learning-center/personal-finance/avalanche-snowball-debt', sourceType: 'institutional'},
    {title: 'Repayment Concentration and Consumer Motivation to Get Out of Debt', publisher: 'Journal of Consumer Research (Oxford Academic), Kettle, Trudel, Blanchard & Häubl, 2016', url: 'https://academic.oup.com/jcr/article-abstract/43/3/460/2200459', sourceType: 'primary'}
  ]
};

renderGuidePage('guideContent', GUIDE_AVALANCHE_OU_BOULE_DE_NEIGE);
