/* ============================================================
   LIKANZA ACADEMY — Guide : ETF ou stock-picking ?
   Chantier "Guides & Décryptages", batch 2 (7e guide). Comparison-table
   only, sans simulationCTA : aucun comparateur ETF vs sélection de titres
   n'existe dans le Laboratoire (les widgets existants comparent des
   stratégies de VERSEMENT — DCA vs lump sum — jamais un choix de véhicule
   ETF vs actions individuelles), le guide reste honnête sur cette limite
   plutôt que de fabriquer un outil pour l'occasion.

   Chiffres vérifiés le 05/09/2026 par recherche web :
   - SPIVA U.S. Scorecard Year-End 2024 (S&P Dow Jones Indices) : 65 % des
     fonds actions américaines grandes capitalisations gérés activement ont
     sous-performé le S&P 500 en 2024 (1 an), et environ 92 % ont
     sous-performé sur 20 ans. Chiffre présenté explicitement comme
     américain (le marché le mieux documenté par SPIVA sur cet horizon),
     jamais généralisé tel quel à la France — le guide précise que
     l'ampleur exacte varie selon le marché et la période, tout en citant le
     mécanisme structurel (frais cumulés) qui explique le phénomène partout.
   - economie.gouv.fr, "Comment investir dans les ETF ?" : frais de gestion
     généralement inférieurs à 0,5 %/an, diversification en une seule
     transaction, aucune garantie de capital.
   - Recoupé avec la fiche Bibliothèque déjà réelle "Biais du survivant
     (backtesting)" (scripts/app.js) pour le risque propre au stock-picking
     basé sur un historique.
   ============================================================ */
const GUIDE_ETF_OU_STOCK_PICKING = {
  slug: 'etf-ou-stock-picking',
  question: 'ETF ou stock-picking ?',
  title: "ETF ou stock-picking ? Ce que montrent les données sur la sélection de titres",
  shortAnswer: "Un ETF (tracker) achète automatiquement un panier large de titres pour un coût annuel très faible ; le stock-picking consiste à choisir soi-même quelles actions détenir, dans l'espoir de faire mieux que le marché. Les données disponibles (rapports SPIVA notamment) montrent qu'une large majorité de gérants professionnels, dont c'est le métier à temps plein, ne parvient déjà pas à battre durablement son indice de référence une fois les frais comptés — ce qui ne rend pas le stock-picking impossible pour un particulier motivé, mais en fait un pari structurellement difficile à gagner sur la durée, pas une évidence.",
  category: 'choisir',
  difficulty: 'debutant',
  readingTime: '7 min',
  publishedAt: '2026-09-05',
  updatedAt: '2026-09-05',
  freshness: 'semi-dynamic',
  concepts: ['ETF', 'Diversification', 'Biais du survivant (backtesting)'],
  relatedCourse: {id: 'risque-diversification', chapitre: 'Les pièges du backtesting'},
  sections: [
    {
      type: 'texte',
      texte: "Tu veux investir en Bourse et tu hésites entre acheter un <strong>ETF</strong> (un fonds qui réplique automatiquement un indice comme le CAC 40 ou le MSCI World) ou choisir toi-même des actions individuelles — le <strong>stock-picking</strong>. Les deux sont possibles avec les mêmes enveloppes (PEA, CTO), mais impliquent un temps, un risque et des résultats historiques très différents."
    },
    {
      type: 'definition',
      texte: "<strong>ETF (Exchange-Traded Fund, ou tracker)</strong> : un fonds coté en Bourse qui détient automatiquement un panier de titres pour reproduire la performance d'un indice, sans qu'un gérant humain choisisse individuellement chaque ligne. <strong>Stock-picking</strong> : sélectionner soi-même les actions individuelles à acheter, en pariant que ces choix précis feront mieux, en moyenne, que le marché dans son ensemble."
    },
    {
      type: 'diagram',
      title: "Pourquoi les frais cumulés pèsent lourd sur la durée",
      steps: [
        "Un fonds géré activement prélève des frais de gestion chaque année, qu'il surperforme ou non son indice cette année-là",
        "Ces frais doivent d'abord être compensés avant qu'un gain réel net ne revienne à l'investisseur",
        "Sur une seule année, un bon choix de titres peut largement compenser ces frais",
        "Mais sur 10 ou 20 ans, l'effet cumulé des frais devient de plus en plus difficile à rattraper année après année",
        "D'où le taux élevé de sous-performance des gérants professionnels observé sur les longues durées (rapports SPIVA)"
      ]
    },
    {
      type: 'comparisonTable',
      intro: "Aucune des deux approches n'est un \"gagnant\" universel : elles répondent à un temps disponible et un goût du risque très différents.",
      columns: [{key: 'etf', label: 'ETF'}, {key: 'stock', label: 'Stock-picking'}],
      rows: [
        {label: 'Frais annuels typiques', values: {etf: 'Généralement inférieurs à 0,5 %/an (souvent 0,05 % à 0,4 %)', stock: 'Pas de frais de gestion récurrents, mais des frais de courtage à chaque achat/vente'}},
        {label: 'Diversification', values: {etf: 'Automatique, en une seule transaction (parfois plusieurs milliers de titres)', stock: 'Dépend entièrement du nombre de lignes détenues et des choix de l\'investisseur'}},
        {label: 'Temps nécessaire', values: {etf: 'Minimal une fois le choix de l\'ETF fait', stock: 'Recherche et suivi réguliers pour rester informé sur chaque titre détenu'}},
        {label: 'Performance historique des professionnels', values: {etf: 'Suit l\'indice moins les frais, par construction', stock: 'Sur longue durée, la majorité des gérants professionnels eux-mêmes ne battent pas leur indice de référence (SPIVA)'}},
        {label: 'Risque idiosyncratique (un titre qui s\'effondre)', values: {etf: 'Très réduit, un seul titre pèse peu dans le panier', stock: 'Élevé si le portefeuille est peu diversifié'}},
        {label: 'Adapté à qui', values: {etf: 'Qui veut un résultat proche du marché sans y consacrer beaucoup de temps', stock: "Qui a le temps, l'intérêt pour l'analyse d'entreprises, et accepte un risque plus concentré"}}
      ],
      note: "Les deux approches ne s'excluent pas : une allocation courante consiste à garder un cœur de portefeuille en ETF large et à consacrer une part limitée du capital au stock-picking, si le temps et l'intérêt y sont."
    },
    {
      type: 'casReel',
      texte: "Selon le rapport SPIVA U.S. Scorecard de fin d'année 2024 (S&P Dow Jones Indices), 65 % des fonds actions américaines grandes capitalisations gérés activement ont sous-performé leur indice de référence, le S&P 500, sur la seule année 2024 — et cette proportion atteint environ 92 % sur 20 ans. Ce chiffre concerne spécifiquement le marché américain, le mieux documenté sur cet horizon par ces rapports ; l'ampleur exacte varie selon le marché et la période observée, mais le même mécanisme structurel (frais cumulés) s'observe sur d'autres marchés, y compris en Europe."
    },
    {
      type: 'mythReality',
      myth: "Choisir soi-même ses actions permet forcément de battre le marché avec un peu d'expérience.",
      reality: "Pas nécessairement. Les rapports SPIVA montrent que même des gérants professionnels, dont c'est le métier à temps plein, ne battent pas durablement leur indice de référence dans leur grande majorité, principalement à cause des frais cumulés et de la difficulté à répéter de bons choix année après année. Cela ne rend pas le stock-picking impossible pour un particulier motivé et bien informé — mais montre que ce n'est pas une compétence qui s'acquiert automatiquement avec un peu d'expérience, ni un pari statistiquement favorable par défaut."
    },
    {
      type: 'risks',
      items: [
        {label: 'Risque de concentration', texte: "Un portefeuille de quelques actions individuelles est bien plus exposé qu'un ETF large à la chute d'un seul titre — la diversification protège justement contre ce risque."},
        {label: 'Biais du survivant sur les performances passées', texte: "Un historique de performance qui semble convaincant peut avoir été construit en ne regardant que des actions qui ont \"survécu\" jusqu'à aujourd'hui, en oubliant celles qui ont fait faillite ou ont été retirées de la cote entre-temps — ce qui gonfle artificiellement la performance apparente d'une stratégie de sélection de titres testée après coup."},
        {label: 'Coût de temps sous-estimé', texte: "Suivre sérieusement plusieurs entreprises individuelles (résultats, actualité, valorisation) prend un temps réel et régulier, souvent sous-estimé au moment de se lancer."},
        {label: 'Frais de transaction cumulés', texte: "Des achats/ventes fréquents sur des actions individuelles génèrent des frais de courtage répétés, qui s'ajoutent aux frais de gestion d'un ETF si les deux approches sont combinées."}
      ]
    },
    {
      type: 'faq',
      items: [
        {question: 'Un ETF peut-il quand même perdre de l\'argent ?', reponse: "Oui. Un ETF suit son indice à la baisse comme à la hausse : il ne protège jamais contre une baisse générale du marché, et ne garantit aucun capital."},
        {question: 'Faut-il choisir entre les deux, ou peut-on combiner ?', reponse: "Rien n'empêche de combiner : une approche courante consiste à garder un cœur de portefeuille en ETF large (pour la diversification) et à consacrer une part limitée du capital au stock-picking, si le temps et l'intérêt y sont."},
        {question: 'Les gérants professionnels n\'ont-ils pas un avantage sur un particulier ?', reponse: "Ils ont plus de temps, de données et d'outils, mais les rapports SPIVA montrent que la majorité d'entre eux ne bat pas durablement son indice une fois les frais de gestion déduits — l'avantage informationnel ne suffit pas à lui seul à compenser ce coût cumulé sur la durée."}
      ]
    }
  ],
  methodology: {
    calcul: "Ce guide ne calcule rien sur un portefeuille réel — aucun comparateur ETF vs stock-picking n'existe aujourd'hui dans le Laboratoire financier de Likanza (contrairement au comparateur DCA vs investissement en une fois) : ce guide reste honnête sur cette limite plutôt que de fabriquer un simulateur pour l'occasion.",
    donnees: "Le taux de sous-performance des fonds actifs (65 % sur 1 an, environ 92 % sur 20 ans) provient du rapport SPIVA U.S. Scorecard de fin d'année 2024 (S&P Dow Jones Indices), sur le marché américain. Les frais typiques d'ETF (généralement inférieurs à 0,5 %/an) proviennent d'economie.gouv.fr.",
    hypotheses: "Le schéma \"pourquoi les frais cumulés pèsent lourd\" illustre un mécanisme général, jamais un calcul sur un montant ou une durée précise.",
    limites: "Les statistiques SPIVA citées concernent le marché américain sur la période indiquée et peuvent différer sur d'autres marchés ou d'autres périodes. Un taux de sous-performance élevé chez les professionnels ne prouve pas qu'un particulier ne peut jamais réussir en stock-picking — il indique seulement que c'est structurellement difficile à répéter durablement, pas impossible au cas par cas."
  },
  sources: [
    {title: 'SPIVA U.S. Scorecard Year-End 2024', publisher: 'S&P Dow Jones Indices', date: '2024', url: 'https://www.spglobal.com/spdji/en/documents/spiva/spiva-us-year-end-2024.pdf', sourceType: 'index_provider'},
    {title: 'Comment investir dans les ETF ?', publisher: 'economie.gouv.fr', date: '2026', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/comment-investir-dans-les-etf', sourceType: 'official_data'}
  ]
};

renderGuidePage('guideContent', GUIDE_ETF_OU_STOCK_PICKING);
