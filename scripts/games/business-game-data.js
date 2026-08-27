/* ============================================================
   LIKANZA ACADEMY — Business Game : données pures (secteurs, époques,
   Business Stories). Aucune logique de rendu ici, aucun état de partie —
   uniquement des paramètres de conception écrits à l'avance, jamais
   générés à la volée par une IA. Chaque effet numérique d'une option est
   un choix de conception documenté (comme les niveaux de difficulté du
   jeu de portefeuille), pas une donnée réelle sur une vraie entreprise.

   Architecture (voir scripts/games/business-game.js pour le moteur) :
   DONNÉES (ce fichier) → CONTEXTE ÉCONOMIQUE (BUSINESS_ERAS) →
   ÉTAT DE L'ENTREPRISE → ÉVÉNEMENT (filtré par état) → DÉCISION →
   RÈGLES DU MODÈLE (simulateMonth) → NOUVEL ÉTAT → tour suivant.
   ============================================================ */

// ---------- Époques : faits réels sourcés + modificateurs de modèle documentés ----------
// "actuel" n'a aucun fait historique à citer : uniquement des hypothèses
// explicitement présentées comme telles, jamais un chiffre inventé présenté
// comme réel. 2020/2022 citent de vraies sources (recherche faite avant
// d'écrire ce fichier, jamais un chiffre halluciné).
const BUSINESS_ERAS = {
  actuel: {
    key: 'actuel', label: 'Scénario actuel', badge: 'scenario',
    facts: [],
    note: "Aucune donnée historique à citer ici : ce contexte est un scénario neutre, sans choc économique particulier. Les dynamiques du modèle restent celles définies par secteur, sans modificateur additionnel.",
    modifiers: { saas: {}, ecommerce: {}, restaurant: {} }
  },
  2020: {
    key: '2020', label: '2020', badge: 'fait',
    facts: [
      {text: "Le chiffre d'affaires du secteur de la restauration aux États-Unis est passé de 69 Md$ en février à 31 Md$ en avril 2020, soit environ -54%. Le secteur a perdu environ 200 Md$ sur l'année, avec près de 100 000 fermetures définitives estimées.", source: 'Restaurant Business Online / National Restaurant Association', sourceUrl: 'https://www.restaurantbusinessonline.com/financing/covid-pandemic-7-charts'},
      {text: "Les ventes e-commerce mondiales ont augmenté de 27,6% en 2020 (4 280 Md$ au total) ; aux États-Unis, +43% (de 571 à 815 Md$). L'accélération de la bascule vers le digital est estimée à environ 5 ans.", source: 'UNCTAD / Forbes (IBM US Retail Index)', sourceUrl: 'https://unctad.org/news/global-e-commerce-jumps-267-trillion-covid-19-boosts-online-sales'}
    ],
    note: "Les valeurs précises appliquées dans la simulation (ex. multiplicateurs ci-dessous) sont un modèle pédagogique dérivé de ces faits, jamais les vrais chiffres d'une entreprise réelle.",
    modifiers: {
      saas: {demandMult: 1.05, financingCostMult: 1.0, note: "Accélération modérée de l'adoption d'outils numériques à distance, sans choc massif sur le financement cette année-là."},
      ecommerce: {demandMult: 1.35, financingCostMult: 1.0, note: "Forte hausse de la demande en ligne, dérivée de la croissance réelle du secteur (+27 à +43% selon la zone)."},
      restaurant: {demandMult: 0.5, financingCostMult: 1.1, note: "Choc de demande sévère sur la fréquentation en salle, dérivé de la baisse réelle du chiffre d'affaires du secteur (-54% au plus fort de la crise)."}
    }
  },
  2022: {
    key: '2022', label: '2022', badge: 'fait',
    facts: [
      {text: "Les hausses de taux de la Fed en 2022 ont poussé les investisseurs à privilégier la rentabilité plutôt que la croissance à tout prix ; les valorisations des éditeurs SaaS ont reculé et le financement est devenu plus difficile et plus cher.", source: 'Carta / SVB', sourceUrl: 'https://carta.com/data/saas-slump-2022/'},
      {text: "Les coûts alimentaires ont augmenté de 13,5% sur un an (août 2022) et les prix de la restauration de 15,5% par rapport à 2019, sur des marges avant impôts habituellement proches de 5% seulement.", source: 'National Restaurant Association / USDA ERS', sourceUrl: 'https://restaurant.org/research-and-media/research/inflation/'},
      {text: "La croissance de l'e-commerce s'est nettement ralentie en 2022 (+8,9%) par rapport à 2020 (+27,6%), une normalisation post-pandémie sous pression inflationniste.", source: 'Adobe Analytics (synthèse de recherche)', sourceUrl: 'https://www.ers.usda.gov/amber-waves/2023/july/ers-data-products-show-food-at-home-price-inflation-from-producers-to-consumers'}
    ],
    note: "Les valeurs précises appliquées dans la simulation sont un modèle pédagogique dérivé de ces faits, jamais les vrais chiffres d'une entreprise réelle.",
    modifiers: {
      saas: {demandMult: 0.95, financingCostMult: 1.4, note: "Financement plus rare et plus cher (levées de fonds/emprunt), dérivé du recul réel des valorisations SaaS et du resserrement du crédit en 2022."},
      ecommerce: {demandMult: 1.0, financingCostMult: 1.15, note: "Croissance qui se maintient mais ralentit nettement par rapport à 2020, dérivée de la décélération réelle observée (+8,9% contre +27,6%)."},
      restaurant: {demandMult: 0.9, financingCostMult: 1.15, costInflationMult: 1.14, note: "Pression forte sur les coûts (alimentation +13,5%, prix de vente +15,5%), dérivée des chiffres réels d'inflation du secteur — les marges déjà fines se resserrent encore."}
    }
  }
};
const BUSINESS_ERA_ORDER = ['actuel', '2020', '2022'];

// ---------- Secteur : SaaS B2B ----------
// Dépend surtout de l'acquisition, du churn, du pricing et de la rétention
// (§11 de la demande) — pas des mêmes variables qu'un restaurant.
const SAAS_SECTOR = {
  key: 'saas', label: 'SaaS B2B', icon: '💻',
  description: "Un logiciel vendu par abonnement mensuel à des entreprises.",
  keyVariables: ['cac', 'ltv', 'churnPct', 'mrr'],
  totalMonths: 12,
  startingState(overrides){
    return Object.assign({
      cash: 50000, clients: 0, pricePerClient: 49, monthlyFixedCosts: 3000,
      marketingBudgetMonthly: 2000, baseCac: 300, churnPct: 5, satisfaction: 60,
      productQuality: 50, reputation: 40, teamSize: 1, debt: 0, lastMonthChurned: 0, lastMonthNew: 0
    }, overrides || {});
  },
  // Dynamique mensuelle organique, avant application des effets de la décision
  // du joueur — formules simples et documentées, jamais un chiffre inventé.
  simulateMonth(state, era){
    const s = Object.assign({}, state);
    const mods = (BUSINESS_ERAS[era] && BUSINESS_ERAS[era].modifiers.saas) || {};
    const demandMult = mods.demandMult || 1;
    const financingCostMult = mods.financingCostMult || 1;

    // Le CAC effectif baisse avec la réputation (une entreprise mieux perçue
    // convertit plus facilement) — formule linéaire simple, plafonnée.
    const effectiveCac = Math.max(80, s.baseCac * (1.4 - s.reputation / 200));
    const newClients = Math.max(0, Math.round((s.marketingBudgetMonthly * demandMult) / effectiveCac));
    // Le churn baisse quand la satisfaction dépasse 60/100, augmente sinon —
    // ancrage arbitraire mais documenté et cohérent d'un tour à l'autre.
    const churnPct = Math.max(1, Math.min(30, s.churnPct - (s.satisfaction - 60) * 0.08));
    const churned = Math.round(s.clients * (churnPct / 100));
    const clients = Math.max(0, s.clients - churned + newClients);
    const mrr = clients * s.pricePerClient;
    const salaryCost = (s.teamSize - 1) * 3200; // 1 salarié en plus du fondateur ≈ 3200€/mois chargé
    const debtInterest = s.debt * 0.01 * financingCostMult;
    const expenses = s.monthlyFixedCosts + s.marketingBudgetMonthly + salaryCost + debtInterest;
    const profit = mrr - expenses;
    const cash = s.cash + profit;

    return Object.assign({}, s, {
      cash, clients, mrr, churnPct, expenses, profit,
      lastMonthChurned: churned, lastMonthNew: newClients
    });
  },
  endingRules(state, monthsPlayed, totalMonths){
    if(state.cash <= 0) return 'faillite';
    if(monthsPlayed < totalMonths) return null; // partie pas encore finie (sortie anticipée non prévue en v1)
    if(state.mrr * 12 >= 400000 && state.cash > 100000) return 'levee';
    if(state.clients >= 150 && state.churnPct < 4) return 'acquisition';
    if(state.mrr > 0 && state.profit > 0) return 'rentable';
    if(state.cash > 0) return 'stable';
    return 'pivot';
  },
  events: [
    {id:'saas-premier-client', minMonth:1, maxMonth:2, priority:3, onceOnly:true,
      title:'Ton premier client potentiel',
      buildSituation(s){ return {description:"Une petite entreprise a testé ta version d'essai et se dit intéressée, mais hésite encore.", dataPoints:[{label:'Prix proposé', value: fmtEUR(s.pricePerClient)+'/mois'},{label:'Budget marketing', value: fmtEUR(s.marketingBudgetMonthly)+'/mois'}]}; },
      options:[
        {label:"Proposer un essai gratuit prolongé", explanation:"Réduit le risque perçu par le client, mais retarde le premier revenu.", effects(s){ return {satisfaction: s.satisfaction+5}; }},
        {label:"Offrir une remise de lancement", explanation:"Facilite la première vente, au prix d'un revenu par client plus faible au départ.", effects(s){ return {pricePerClient: Math.max(19, s.pricePerClient-10), reputation: s.reputation+3}; }},
        {label:"Maintenir le prix affiché", explanation:"Préserve la valeur perçue du produit, au risque de perdre ce prospect.", effects(s){ return {}; }}
      ]},
    {id:'saas-churn-rising', minMonth:2, priority:4, onceOnly:true,
      conditions(s){ return s.clients >= 8 && s.churnPct > 7; },
      title:'Les clients partent',
      buildSituation(s){ return {description:`Clients perdus le mois dernier : ${s.lastMonthChurned}. Taux de résiliation en hausse (${s.churnPct.toFixed(1)}%/mois).`, dataPoints:[{label:'Satisfaction', value: s.satisfaction.toFixed(0)+'/100'},{label:'Qualité produit', value: s.productQuality.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Augmenter le budget publicitaire", explanation:"Compense la perte de clients par plus d'acquisition, sans traiter la cause du départ.", effects(s){ return {marketingBudgetMonthly: s.marketingBudgetMonthly+1000}; }},
        {label:"Baisser le prix", explanation:"Peut réduire le churn lié au prix, mais réduit directement le revenu par client.", effects(s){ return {pricePerClient: Math.max(19, s.pricePerClient-10), satisfaction: s.satisfaction+5}; }},
        {label:"Analyser les retours clients", explanation:"Ne coûte pas d'argent, mais prend du temps : révèle la vraie cause sans agir tout de suite ce mois-ci.", effects(s){ return {satisfaction: s.satisfaction+2}; }},
        {label:"Recruter une personne au support", explanation:"Améliore la satisfaction durablement, mais augmente les charges fixes chaque mois suivant.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+1800, satisfaction: s.satisfaction+12, teamSize: s.teamSize+1}; }},
        {label:"Ne rien changer", explanation:"Économise à court terme, mais laisse la cause du churn non traitée.", effects(s){ return {}; }}
      ]},
    {id:'saas-concurrent-prix', minMonth:3, priority:2, onceOnly:true,
      title:'Un concurrent casse ses prix',
      buildSituation(s){ return {description:"Un concurrent direct annonce une offre 30% moins chère que la tienne.", dataPoints:[{label:'Ton prix', value: fmtEUR(s.pricePerClient)+'/mois'}]}; },
      options:[
        {label:"Aligner ton prix", explanation:"Reste compétitif immédiatement, au prix direct de ta marge par client.", effects(s){ return {pricePerClient: Math.round(s.pricePerClient*0.75)}; }},
        {label:"Mettre en avant ta valeur ajoutée plutôt que le prix", explanation:"Ne change rien financièrement tout de suite, mais demande de bien argumenter — résultat incertain.", effects(s){ return {reputation: s.reputation+4, satisfaction: s.satisfaction-2}; }},
        {label:"Ignorer et continuer ta stratégie", explanation:"Aucun changement immédiat ; certains clients sensibles au prix pourraient partir plus tard.", effects(s){ return {churnPct: s.churnPct+1}; }}
      ]},
    {id:'saas-bug-majeur', minMonth:2, priority:5, onceOnly:true,
      conditions(s){ return s.clients >= 5; },
      title:'Panne technique majeure',
      buildSituation(s){ return {description:"Une panne a rendu le service indisponible pendant plusieurs heures pour tous tes clients.", dataPoints:[{label:'Clients concernés', value: String(s.clients)}]}; },
      options:[
        {label:"Communiquer immédiatement et rembourser un mois", explanation:"Coûte un mois de revenu par client touché, mais limite les dégâts sur la confiance.", effects(s){ return {cash: s.cash - s.mrr, satisfaction: s.satisfaction+8, reputation: s.reputation+2}; }},
        {label:"Corriger discrètement sans communiquer", explanation:"N'a aucun coût immédiat, mais expose à une perte de confiance si les clients l'apprennent autrement.", effects(s){ return {satisfaction: s.satisfaction-10, reputation: s.reputation-5}; }},
        {label:"Investir dans l'infrastructure pour éviter que ça se reproduise", explanation:"Réduit le risque futur, au prix d'une charge fixe supplémentaire chaque mois.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+600, productQuality: s.productQuality+10}; }}
      ]},
    {id:'saas-client-sur-mesure', minMonth:4, priority:2, onceOnly:true,
      conditions(s){ return s.clients >= 10; },
      title:'Un client important veut du sur-mesure',
      buildSituation(s){ return {description:"Ton plus gros client demande une fonctionnalité spécifique, en échange d'un engagement plus long.", dataPoints:[{label:'MRR actuel', value: fmtEUR(s.mrr)}]}; },
      options:[
        {label:"Développer la fonctionnalité sur mesure", explanation:"Sécurise ce client et peut inspirer une fonctionnalité utile à d'autres, mais mobilise du temps de développement (retarde d'autres améliorations).", effects(s){ return {productQuality: s.productQuality+5, satisfaction: s.satisfaction+6, monthlyFixedCosts: s.monthlyFixedCosts+400}; }},
        {label:"Décliner poliment", explanation:"Garde le produit simple pour tous les clients, au risque de perdre ce client précis.", effects(s){ return {churnPct: s.churnPct+0.5}; }}
      ]},
    {id:'saas-tresorerie-tendue', minMonth:5, priority:5, onceOnly:true,
      conditions(s){ return s.cash < s.expenses * 3; },
      title:'Trésorerie tendue',
      buildSituation(s){ const runway = s.expenses>0 ? Math.floor(s.cash/s.expenses) : 99; return {description:`Au rythme de dépenses actuel, il te reste environ ${runway} mois de trésorerie.`, dataPoints:[{label:'Cash', value: fmtEUR(s.cash)},{label:'Dépenses mensuelles', value: fmtEUR(s.expenses)}]}; },
      options:[
        {label:"Réduire le budget marketing", explanation:"Ralentit l'acquisition de nouveaux clients, mais prolonge directement la trésorerie.", effects(s){ return {marketingBudgetMonthly: Math.max(500, Math.round(s.marketingBudgetMonthly*0.5))}; }},
        {label:"Chercher un financement (dette)", explanation:"Apporte du cash immédiatement, mais crée des intérêts à rembourser chaque mois, plus coûteux si les conditions de financement sont difficiles.", effects(s){ return {cash: s.cash+20000, debt: s.debt+20000}; }},
        {label:"Ne rien changer", explanation:"Aucun ajustement : le risque de trésorerie critique reste entier.", effects(s){ return {}; }}
      ]},
    {id:'saas-levee-fonds', minMonth:6, priority:3, onceOnly:true,
      conditions(s){ return s.clients >= 25 && s.churnPct < 8; },
      title:'Opportunité de levée de fonds',
      buildSituation(s){ return {description:"Un investisseur propose d'apporter du capital pour accélérer ta croissance.", dataPoints:[{label:'Clients', value: String(s.clients)},{label:'MRR', value: fmtEUR(s.mrr)}]}; },
      options:[
        {label:"Accepter la levée de fonds", explanation:"Apporte un vrai capital pour recruter et investir en marketing, mais dilue ta part de l'entreprise (non modélisé en détail en v1) et augmente la pression à croître vite.", effects(s){ return {cash: s.cash+80000, marketingBudgetMonthly: s.marketingBudgetMonthly+1500}; }},
        {label:"Rester indépendant", explanation:"Garde le contrôle total, mais prive l'entreprise de ce capital pour accélérer.", effects(s){ return {reputation: s.reputation+2}; }}
      ]},
    {id:'saas-avis-negatif', minMonth:3, priority:3, onceOnly:true,
      conditions(s){ return s.satisfaction < 50; },
      title:'Avis négatif public',
      buildSituation(s){ return {description:"Un client mécontent a publié un avis très négatif, visible publiquement.", dataPoints:[{label:'Réputation', value: s.reputation.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Répondre publiquement et proposer une solution", explanation:"Peut limiter les dégâts si la réponse est bien reçue, sans coût direct.", effects(s){ return {reputation: s.reputation+3, satisfaction: s.satisfaction+3}; }},
        {label:"Ignorer", explanation:"Aucune action, aucun coût immédiat — l'avis négatif reste visible.", effects(s){ return {reputation: s.reputation-4}; }}
      ]},
    {id:'saas-partenariat', minMonth:5, priority:2, onceOnly:true,
      conditions(s){ return s.reputation >= 45; },
      title:'Offre de partenariat',
      buildSituation(s){ return {description:"Un acteur plus établi de ton secteur propose de recommander ton produit à ses clients.", dataPoints:[{label:'Réputation actuelle', value: s.reputation.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Accepter le partenariat (commission incluse)", explanation:"Apporte de nouveaux clients à moindre coût d'acquisition, contre une commission sur chaque vente.", effects(s){ return {baseCac: Math.max(80, s.baseCac*0.7), monthlyFixedCosts: s.monthlyFixedCosts+200}; }},
        {label:"Décliner", explanation:"Garde une acquisition 100% indépendante, sans nouvel apport de clients via ce canal.", effects(s){ return {}; }}
      ]},
    {id:'saas-employe-part', minMonth:6, priority:3, onceOnly:true,
      conditions(s){ return s.teamSize >= 2; },
      title:'Un employé clé veut partir',
      buildSituation(s){ return {description:"Une personne importante de ton équipe envisage de partir pour une autre offre.", dataPoints:[{label:'Taille équipe', value: String(s.teamSize)}]}; },
      options:[
        {label:"Proposer une augmentation", explanation:"Garde la compétence en interne, au prix d'une charge fixe plus élevée chaque mois.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+500, productQuality: s.productQuality+3}; }},
        {label:"Laisser partir et recruter ensuite", explanation:"Aucun coût immédiat, mais une perte temporaire de compétence et de qualité produit.", effects(s){ return {productQuality: s.productQuality-8, teamSize: Math.max(1, s.teamSize-1)}; }}
      ]},
    {id:'saas-hausse-cloud', minMonth:4, priority:2, onceOnly:true,
      title:"Hausse des coûts d'infrastructure",
      buildSituation(s){ return {description:"Ton fournisseur d'hébergement augmente ses tarifs.", dataPoints:[{label:'Charges fixes actuelles', value: fmtEUR(s.monthlyFixedCosts)+'/mois'}]}; },
      options:[
        {label:"Absorber la hausse", explanation:"Aucun changement pour les clients, mais une charge fixe plus élevée chaque mois.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+300}; }},
        {label:"Changer de fournisseur", explanation:"Peut limiter la hausse de coût, mais demande du temps technique et un risque de service dégradé pendant la transition.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+100, productQuality: s.productQuality-4}; }}
      ]},
    {id:'saas-nouveau-canal', minMonth:3, priority:2, onceOnly:true,
      title:"Un nouveau canal d'acquisition à tester",
      buildSituation(s){ return {description:"Le contenu (SEO, articles) est présenté comme un moyen d'acquérir des clients à moindre coût, mais avec un effet différé.", dataPoints:[{label:'CAC actuel', value: fmtEUR(Math.round(s.baseCac))}]}; },
      options:[
        {label:"Investir dans le contenu (SEO)", explanation:"Coûte de l'argent maintenant pour un effet qui ne se voit que plus tard sur le CAC, jamais immédiatement.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+500, baseCac: Math.max(80, s.baseCac-15)}; }},
        {label:"Rester sur les canaux actuels", explanation:"Aucun changement, aucun nouveau pari.", effects(s){ return {}; }}
      ]},
    {id:'saas-demande-remise', minMonth:7, priority:2, onceOnly:true,
      conditions(s){ return s.clients >= 15; },
      title:'Un client demande une remise pour renouveler',
      buildSituation(s){ return {description:"Un client de longue date menace de partir sauf remise pour son renouvellement.", dataPoints:[{label:'Prix actuel', value: fmtEUR(s.pricePerClient)+'/mois'}]}; },
      options:[
        {label:"Accorder la remise à ce client", explanation:"Garde ce client, au prix d'un précédent qui pourrait inciter d'autres clients à négocier aussi.", effects(s){ return {satisfaction: s.satisfaction+2, mrr: s.mrr}; }},
        {label:"Refuser et risquer le départ", explanation:"Préserve la cohérence tarifaire, au risque réel de perdre ce client.", effects(s){ return {churnPct: s.churnPct+0.3}; }}
      ]},
    {id:'saas-rachat', minMonth:9, priority:4, onceOnly:true,
      conditions(s){ return s.clients >= 60 && s.churnPct < 5; },
      title:'Un acteur plus gros propose un rachat',
      buildSituation(s){ return {description:"Une entreprise plus établie de ton secteur propose de racheter ton activité.", dataPoints:[{label:'Clients', value: String(s.clients)},{label:'MRR', value: fmtEUR(s.mrr)}]}; },
      options:[
        {label:"Explorer sérieusement l'offre", explanation:"Peut mener à une sortie avantageuse, mais implique de discuter les conditions plutôt que de continuer seul.", effects(s){ return {_flagRachatConsidere: true}; }},
        {label:"Décliner et continuer seul", explanation:"Garde le contrôle total sur la suite, au prix de renoncer à cette opportunité précise.", effects(s){ return {reputation: s.reputation+3}; }}
      ]},
    {id:'saas-mois-calme', minMonth:1, priority:1, onceOnly:false,
      title:'Un mois sans événement particulier',
      buildSituation(s){ return {description:"Ce mois-ci, rien d'exceptionnel ne se produit — l'activité continue sur sa lancée.", dataPoints:[{label:'Clients', value: String(s.clients)},{label:'Cash', value: fmtEUR(s.cash)}]}; },
      options:[
        {label:"Continuer sans changement", explanation:"Laisse l'activité suivre sa trajectoire actuelle sans nouvel arbitrage ce mois-ci.", effects(s){ return {}; }},
        {label:"Ajuster légèrement le budget marketing", explanation:"Petite variation d'investissement en acquisition, sans autre changement.", effects(s){ return {marketingBudgetMonthly: Math.round(s.marketingBudgetMonthly*1.1)}; }}
      ]}
  ]
};

// ---------- Secteur : E-commerce ----------
// Dépend surtout du stock, de la logistique, de l'acquisition, des retours
// et des marges (§11) — le stock limite physiquement les ventes possibles,
// contrairement au SaaS où rien n'est jamais "en rupture".
const ECOMMERCE_SECTOR = {
  key: 'ecommerce', label: 'E-commerce', icon: '🛍️',
  description: "Vente en ligne d'un produit physique, avec gestion de stock.",
  keyVariables: ['inventory', 'returnRatePct', 'baseCac', 'margin'],
  totalMonths: 12,
  startingState(overrides){
    return Object.assign({
      cash: 40000, inventory: 500, pricePerUnit: 35, costPerUnit: 15,
      monthlyFixedCosts: 2200, marketingBudgetMonthly: 2500, baseCac: 12,
      returnRatePct: 8, satisfaction: 60, logisticsQuality: 50, reputation: 40,
      teamSize: 1, debt: 0, lastMonthSold: 0, lastMonthStockout: 0, unitsSoldTotal: 0
    }, overrides || {});
  },
  simulateMonth(state, era){
    const s = Object.assign({}, state);
    const mods = (BUSINESS_ERAS[era] && BUSINESS_ERAS[era].modifiers.ecommerce) || {};
    const demandMult = mods.demandMult || 1;
    const financingCostMult = mods.financingCostMult || 1;

    const effectiveCac = Math.max(4, s.baseCac * (1.3 - s.reputation / 200));
    const potentialOrders = Math.max(0, Math.round((s.marketingBudgetMonthly * demandMult) / effectiveCac));
    // Le stock limite physiquement les ventes possibles — une vraie rupture,
    // pas juste un chiffre théorique (contrairement au SaaS).
    const unitsSold = Math.min(potentialOrders, s.inventory);
    const stockout = Math.max(0, potentialOrders - unitsSold);
    const returns = Math.round(unitsSold * (s.returnRatePct / 100));
    const netUnitsSold = unitsSold - returns;
    const revenue = netUnitsSold * s.pricePerUnit;
    const cogs = unitsSold * s.costPerUnit; // le coût matière est engagé dès l'expédition, retourné ou non
    const salaryCost = (s.teamSize - 1) * 2800;
    const debtInterest = s.debt * 0.01 * financingCostMult;
    const expenses = s.monthlyFixedCosts + s.marketingBudgetMonthly + salaryCost + debtInterest;
    const profit = revenue - cogs - expenses;
    const cash = s.cash + profit;
    const inventory = Math.max(0, s.inventory - unitsSold);
    // La réputation réagit aux ruptures de stock et au taux de retour —
    // deux frictions réelles et spécifiques à l'e-commerce.
    const reputationDrift = (stockout > 5 ? -2 : 0) + (s.returnRatePct > 12 ? -1 : 0.5);
    const reputation = Math.max(0, Math.min(100, s.reputation + reputationDrift));

    return Object.assign({}, s, {
      cash, inventory, revenue, expenses, profit, reputation,
      lastMonthSold: unitsSold, lastMonthStockout: stockout, unitsSoldTotal: s.unitsSoldTotal + unitsSold
    });
  },
  endingRules(state, monthsPlayed, totalMonths){
    if(state.cash <= 0) return 'faillite';
    if(monthsPlayed < totalMonths) return null;
    if(state.unitsSoldTotal >= 3000 && state.cash > 80000) return 'levee';
    if(state.unitsSoldTotal >= 6000 && state.reputation >= 60) return 'acquisition';
    if(state.profit > 0 && state.cash > state.costPerUnit * 1000) return 'rentable';
    if(state.cash > 0) return 'stable';
    return 'pivot';
  },
  events: [
    {id:'ecom-premier-lot', minMonth:1, maxMonth:2, priority:3, onceOnly:true,
      title:'Ton premier lot de produits est en ligne',
      buildSituation(s){ return {description:"Ta boutique en ligne est ouverte, avec un premier stock disponible.", dataPoints:[{label:'Stock', value: s.inventory+' unités'},{label:'Prix', value: fmtEUR(s.pricePerUnit)}]}; },
      options:[
        {label:"Lancer une campagne de lancement", explanation:"Accélère les premières ventes, au prix d'un budget marketing plus élevé ce mois-ci.", effects(s){ return {marketingBudgetMonthly: s.marketingBudgetMonthly+1000}; }},
        {label:"Démarrer doucement", explanation:"Limite les dépenses au départ, au prix d'une croissance plus lente.", effects(s){ return {}; }}
      ]},
    {id:'ecom-rupture-stock', minMonth:2, priority:5, onceOnly:true,
      conditions(s){ return s.lastMonthStockout > 3; },
      title:'Rupture de stock',
      buildSituation(s){ return {description:`Le mois dernier, environ ${s.lastMonthStockout} commandes potentielles n'ont pas pu être servies faute de stock.`, dataPoints:[{label:'Stock restant', value: s.inventory+' unités'}]}; },
      options:[
        {label:"Commander un réassort important", explanation:"Évite de nouvelles ruptures, mais immobilise du cash dans le stock immédiatement.", effects(s){ return {cash: s.cash - s.costPerUnit*400, inventory: s.inventory+400}; }},
        {label:"Réassort minimal", explanation:"Limite l'engagement de trésorerie, au risque de rester en rupture si la demande continue.", effects(s){ return {cash: s.cash - s.costPerUnit*150, inventory: s.inventory+150}; }}
      ]},
    {id:'ecom-fournisseur-retard', minMonth:3, priority:3, onceOnly:true,
      title:'Ton fournisseur annonce un retard',
      buildSituation(s){ return {description:"La prochaine livraison de stock sera retardée de plusieurs semaines.", dataPoints:[{label:'Stock actuel', value: s.inventory+' unités'}]}; },
      options:[
        {label:"Chercher un fournisseur alternatif en urgence", explanation:"Peut limiter le retard, mais souvent à un coût unitaire plus élevé.", effects(s){ return {costPerUnit: s.costPerUnit+2}; }},
        {label:"Attendre la livraison prévue", explanation:"Aucun surcoût, mais un vrai risque de rupture si le stock actuel ne suffit pas.", effects(s){ return {}; }}
      ]},
    {id:'ecom-vague-retours', minMonth:3, priority:4, onceOnly:true,
      conditions(s){ return s.returnRatePct > 10; },
      title:'Vague de retours',
      buildSituation(s){ return {description:`Le taux de retour a atteint ${s.returnRatePct.toFixed(1)}% des commandes, au-dessus de la normale du secteur.`, dataPoints:[{label:'Ventes le mois dernier', value: String(s.lastMonthSold)}]}; },
      options:[
        {label:"Améliorer la fiche produit (photos, description)", explanation:"Réduit les retours liés à une mauvaise attente du client, sans coût récurrent élevé.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+150, returnRatePct: Math.max(2, s.returnRatePct-3)}; }},
        {label:"Ne rien changer", explanation:"Aucun coût immédiat, mais le taux de retour reste élevé.", effects(s){ return {}; }}
      ]},
    {id:'ecom-pub-soldes', minMonth:4, priority:2, onceOnly:true,
      title:'Période de soldes',
      buildSituation(s){ return {description:"C'est la période des soldes : la demande en ligne augmente généralement sur ce type de créneau.", dataPoints:[{label:'Budget marketing actuel', value: fmtEUR(s.marketingBudgetMonthly)}]}; },
      options:[
        {label:"Augmenter fortement le budget publicitaire", explanation:"Profite du pic de demande saisonnier, au prix d'un budget marketing nettement plus élevé ce mois-ci.", effects(s){ return {marketingBudgetMonthly: s.marketingBudgetMonthly+2000}; }},
        {label:"Garder un budget stable", explanation:"Aucun risque supplémentaire, mais moins de bénéfice du pic saisonnier.", effects(s){ return {}; }}
      ]},
    {id:'ecom-cout-transport', minMonth:5, priority:2, onceOnly:true,
      title:'Hausse des coûts de transport',
      buildSituation(s){ return {description:"Les tarifs de livraison augmentent pour l'ensemble du secteur.", dataPoints:[{label:'Charges fixes actuelles', value: fmtEUR(s.monthlyFixedCosts)+'/mois'}]}; },
      options:[
        {label:"Absorber la hausse", explanation:"Aucun changement pour le client, mais une charge fixe plus élevée chaque mois.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+250}; }},
        {label:"Répercuter une partie sur le prix de vente", explanation:"Préserve la marge, au risque de réduire la demande si le prix devient moins attractif.", effects(s){ return {pricePerUnit: s.pricePerUnit+2, reputation: s.reputation-2}; }}
      ]},
    {id:'ecom-avis-livraison', minMonth:3, priority:3, onceOnly:true,
      conditions(s){ return s.logisticsQuality < 45; },
      title:'Avis négatifs sur la livraison',
      buildSituation(s){ return {description:"Plusieurs clients se plaignent publiquement de délais de livraison trop longs.", dataPoints:[{label:'Qualité logistique', value: s.logisticsQuality.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Investir dans un meilleur partenaire logistique", explanation:"Améliore durablement la qualité de livraison, au prix d'une charge fixe plus élevée chaque mois.", effects(s){ return {monthlyFixedCosts: s.monthlyFixedCosts+400, logisticsQuality: s.logisticsQuality+15}; }},
        {label:"Ne rien changer", explanation:"Aucun coût immédiat, mais le problème reste entier.", effects(s){ return {reputation: s.reputation-3}; }}
      ]},
    {id:'ecom-marketplace', minMonth:4, priority:3, onceOnly:true,
      conditions(s){ return s.reputation >= 40; },
      title:'Opportunité marketplace',
      buildSituation(s){ return {description:"Une grande marketplace propose de référencer ton produit, contre une commission sur chaque vente.", dataPoints:[{label:'Réputation actuelle', value: s.reputation.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Rejoindre la marketplace", explanation:"Élargit fortement la visibilité et réduit le coût d'acquisition, contre une commission qui réduit la marge par vente.", effects(s){ return {baseCac: Math.max(4, s.baseCac*0.6), costPerUnit: s.costPerUnit+1.5}; }},
        {label:"Rester uniquement sur ta propre boutique", explanation:"Garde toute la marge, sans bénéficier de la visibilité additionnelle.", effects(s){ return {}; }}
      ]},
    {id:'ecom-concurrent-copie', minMonth:5, priority:2, onceOnly:true,
      title:'Un concurrent copie ton produit',
      buildSituation(s){ return {description:"Un concurrent lance un produit très similaire, à prix plus bas.", dataPoints:[{label:'Ton prix', value: fmtEUR(s.pricePerUnit)}]}; },
      options:[
        {label:"Baisser légèrement le prix", explanation:"Reste compétitif, au prix direct d'une marge réduite par unité vendue.", effects(s){ return {pricePerUnit: Math.max(s.costPerUnit+3, s.pricePerUnit-4)}; }},
        {label:"Miser sur la qualité perçue plutôt que le prix", explanation:"Préserve la marge, mais le résultat dépend de la perception réelle des clients, incertaine.", effects(s){ return {reputation: s.reputation+3}; }}
      ]},
    {id:'ecom-qualite-produit', minMonth:4, priority:3, onceOnly:true,
      conditions(s){ return s.returnRatePct > 9; },
      title:'Des clients signalent un défaut récurrent',
      buildSituation(s){ return {description:"Plusieurs retours mentionnent le même défaut sur le produit.", dataPoints:[{label:'Taux de retour', value: s.returnRatePct.toFixed(1)+'%'}]}; },
      options:[
        {label:"Corriger le défaut avec le fournisseur", explanation:"Traite la cause réelle des retours, au prix d'un coût unitaire légèrement plus élevé.", effects(s){ return {costPerUnit: s.costPerUnit+1, returnRatePct: Math.max(3, s.returnRatePct-4)}; }},
        {label:"Ne rien changer", explanation:"Aucun coût immédiat, mais le taux de retour reste élevé.", effects(s){ return {}; }}
      ]},
    {id:'ecom-emballage', minMonth:6, priority:2, onceOnly:true,
      title:"Investir dans un meilleur emballage",
      buildSituation(s){ return {description:"Un emballage plus soigné pourrait réduire la casse pendant le transport et améliorer l'image de marque.", dataPoints:[{label:'Coût unitaire actuel', value: fmtEUR(s.costPerUnit)}]}; },
      options:[
        {label:"Investir dans l'emballage", explanation:"Réduit les retours liés à la casse et améliore la réputation, au prix d'un coût unitaire plus élevé.", effects(s){ return {costPerUnit: s.costPerUnit+1.2, returnRatePct: Math.max(2, s.returnRatePct-2), reputation: s.reputation+3}; }},
        {label:"Garder l'emballage actuel", explanation:"Aucun changement de coût, aucune amélioration non plus.", effects(s){ return {}; }}
      ]},
    {id:'ecom-tresorerie-tendue', minMonth:5, priority:5, onceOnly:true,
      conditions(s){ return s.cash < s.monthlyFixedCosts * 3; },
      title:'Trésorerie tendue',
      buildSituation(s){ const runway = s.monthlyFixedCosts>0 ? Math.floor(s.cash/s.monthlyFixedCosts) : 99; return {description:`Au rythme de dépenses actuel, il te reste environ ${runway} mois de trésorerie.`, dataPoints:[{label:'Cash', value: fmtEUR(s.cash)}]}; },
      options:[
        {label:"Réduire le budget marketing", explanation:"Ralentit les ventes, mais prolonge directement la trésorerie disponible.", effects(s){ return {marketingBudgetMonthly: Math.max(500, Math.round(s.marketingBudgetMonthly*0.5))}; }},
        {label:"Chercher un financement (dette)", explanation:"Apporte du cash immédiatement, mais crée des intérêts à rembourser chaque mois.", effects(s){ return {cash: s.cash+15000, debt: s.debt+15000}; }}
      ]},
    {id:'ecom-rachat', minMonth:9, priority:4, onceOnly:true,
      conditions(s){ return s.unitsSoldTotal >= 3500 && s.reputation >= 55; },
      title:'Un distributeur propose un rachat',
      buildSituation(s){ return {description:"Un distributeur plus établi propose de racheter ta marque pour l'intégrer à son catalogue.", dataPoints:[{label:'Ventes cumulées', value: s.unitsSoldTotal+' unités'}]}; },
      options:[
        {label:"Explorer sérieusement l'offre", explanation:"Peut mener à une sortie avantageuse, mais implique de discuter les conditions plutôt que de continuer seul.", effects(s){ return {_flagRachatConsidere: true}; }},
        {label:"Décliner et continuer seul", explanation:"Garde le contrôle total sur la marque, au prix de renoncer à cette opportunité précise.", effects(s){ return {reputation: s.reputation+2}; }}
      ]},
    {id:'ecom-mois-calme', minMonth:1, priority:1, onceOnly:false,
      title:'Un mois sans événement particulier',
      buildSituation(s){ return {description:"Ce mois-ci, rien d'exceptionnel ne se produit — l'activité continue sur sa lancée.", dataPoints:[{label:'Stock', value: s.inventory+' unités'},{label:'Cash', value: fmtEUR(s.cash)}]}; },
      options:[
        {label:"Continuer sans changement", explanation:"Laisse l'activité suivre sa trajectoire actuelle sans nouvel arbitrage ce mois-ci.", effects(s){ return {}; }},
        {label:"Ajuster légèrement le budget marketing", explanation:"Petite variation d'investissement en acquisition, sans autre changement.", effects(s){ return {marketingBudgetMonthly: Math.round(s.marketingBudgetMonthly*1.1)}; }}
      ]}
  ]
};

// ---------- Secteur : Restaurant ----------
// Dépend surtout de l'emplacement, des coûts fixes, du personnel, de la
// fréquentation et des marges (§11) — l'emplacement est fixé au départ
// (rarement modifiable), et la capacité de service (personnel) limite
// physiquement la fréquentation, comme le stock limite l'e-commerce.
const RESTAURANT_SECTOR = {
  key: 'restaurant', label: 'Restaurant', icon: '🍔',
  description: "Un restaurant physique : emplacement, personnel et marges serrées.",
  keyVariables: ['rent', 'staffCount', 'foodCostPct', 'locationQuality'],
  totalMonths: 12,
  startingState(overrides){
    return Object.assign({
      cash: 60000, avgTicket: 25, foodCostPct: 30, rent: 3500,
      staffCount: 3, staffCostPerPerson: 1900, monthlyFixedCosts: 1200,
      marketingBudgetMonthly: 800, locationQuality: 50, reputation: 40,
      serviceQuality: 50, debt: 0, lastMonthCustomers: 0, lastMonthCapped: 0
    }, overrides || {});
  },
  simulateMonth(state, era){
    const s = Object.assign({}, state);
    const mods = (BUSINESS_ERAS[era] && BUSINESS_ERAS[era].modifiers.restaurant) || {};
    const demandMult = mods.demandMult || 1;
    const financingCostMult = mods.financingCostMult || 1;
    const costInflationMult = mods.costInflationMult || 1;

    const potentialCustomers = Math.round((s.locationQuality * 3 + s.reputation * 2 + s.marketingBudgetMonthly / 15) * demandMult);
    // Le personnel limite physiquement la fréquentation servable — une
    // vraie contrainte de capacité, comme le stock en e-commerce.
    const capacity = s.staffCount * 260;
    const customers = Math.min(potentialCustomers, capacity);
    const capped = Math.max(0, potentialCustomers - customers);
    const revenue = customers * s.avgTicket;
    const foodCostPct = s.foodCostPct * costInflationMult;
    const foodCost = revenue * (foodCostPct / 100);
    const staffCost = s.staffCount * s.staffCostPerPerson;
    const debtInterest = s.debt * 0.01 * financingCostMult;
    const expenses = s.rent + staffCost + s.monthlyFixedCosts + s.marketingBudgetMonthly + debtInterest;
    const profit = revenue - foodCost - expenses;
    const cash = s.cash + profit;
    // La réputation réagit à la sur-fréquentation (clients refusés) et à la
    // qualité de service — deux frictions réelles et propres au secteur.
    const reputationDrift = (capped > 20 ? -2 : 0) + (s.serviceQuality > 65 ? 1 : s.serviceQuality < 40 ? -1 : 0);
    const reputation = Math.max(0, Math.min(100, s.reputation + reputationDrift));

    return Object.assign({}, s, {
      cash, revenue, expenses, profit, reputation, foodCostPct,
      lastMonthCustomers: customers, lastMonthCapped: capped
    });
  },
  endingRules(state, monthsPlayed, totalMonths){
    if(state.cash <= 0) return 'faillite';
    if(monthsPlayed < totalMonths) return null;
    if(state.reputation >= 65 && state.cash > 100000) return 'levee';
    if(state.lastMonthCustomers >= 700 && state.reputation >= 65) return 'acquisition';
    if(state.profit > 0 && state.cash > state.rent * 6) return 'rentable';
    if(state.cash > 0) return 'stable';
    return 'pivot';
  },
  events: [
    {id:'resto-ouverture', minMonth:1, maxMonth:2, priority:3, onceOnly:true,
      title:'Ouverture du restaurant',
      buildSituation(s){ return {description:"Le restaurant vient d'ouvrir ses portes.", dataPoints:[{label:'Emplacement', value: s.locationQuality.toFixed(0)+'/100'},{label:'Personnel', value: s.staffCount+' personne(s)'}]}; },
      options:[
        {label:"Organiser une soirée d'inauguration", explanation:"Fait connaître l'établissement rapidement, au prix d'un coût ponctuel ce mois-ci.", effects(s){ return {cash: s.cash-1500, reputation: s.reputation+6}; }},
        {label:"Ouvrir discrètement", explanation:"Aucun coût additionnel, mais une notoriété qui se construit plus lentement.", effects(s){ return {}; }}
      ]},
    {id:'resto-presse-locale', minMonth:2, priority:2, onceOnly:true,
      conditions(s){ return s.reputation >= 45; },
      title:'Un article dans la presse locale',
      buildSituation(s){ return {description:"Un journal local propose un article sur le restaurant.", dataPoints:[{label:'Réputation actuelle', value: s.reputation.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Accepter l'interview", explanation:"Bonne visibilité gratuite, sans coût direct.", effects(s){ return {reputation: s.reputation+8}; }},
        {label:"Décliner (manque de temps)", explanation:"Aucun changement, ni positif ni négatif.", effects(s){ return {}; }}
      ]},
    {id:'resto-sous-effectif', minMonth:3, priority:4, onceOnly:true,
      conditions(s){ return s.lastMonthCapped > 20; },
      title:'Le personnel est sous-effectif',
      buildSituation(s){ return {description:`Environ ${s.lastMonthCapped} clients potentiels ont été refusés faute de place ou de personnel le mois dernier.`, dataPoints:[{label:'Personnel actuel', value: String(s.staffCount)}]}; },
      options:[
        {label:"Recruter une personne supplémentaire", explanation:"Augmente la capacité de service, au prix d'une charge de personnel plus élevée chaque mois.", effects(s){ return {staffCount: s.staffCount+1}; }},
        {label:"Continuer avec l'équipe actuelle", explanation:"Aucun coût supplémentaire, mais des clients continueront d'être refusés aux heures de pointe.", effects(s){ return {reputation: s.reputation-2}; }}
      ]},
    {id:'resto-demission', minMonth:4, priority:3, onceOnly:true,
      conditions(s){ return s.staffCount >= 2; },
      title:'Un employé clé démissionne',
      buildSituation(s){ return {description:"Un membre expérimenté de l'équipe annonce son départ.", dataPoints:[{label:'Qualité de service', value: s.serviceQuality.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Recruter rapidement un remplaçant expérimenté", explanation:"Limite l'impact sur le service, à un coût de recrutement immédiat.", effects(s){ return {cash: s.cash-1000, serviceQuality: s.serviceQuality-3}; }},
        {label:"Répartir la charge sur l'équipe restante", explanation:"Aucun coût de recrutement, mais une qualité de service qui se dégrade temporairement.", effects(s){ return {serviceQuality: s.serviceQuality-10}; }}
      ]},
    {id:'resto-fournisseur-prix', minMonth:3, priority:4, onceOnly:true,
      title:'Ton fournisseur alimentaire augmente ses prix',
      buildSituation(s){ return {description:"Le coût des matières premières augmente pour l'ensemble du secteur.", dataPoints:[{label:'Part alimentaire actuelle', value: s.foodCostPct.toFixed(1)+'% du CA'}]}; },
      options:[
        {label:"Répercuter sur les prix du menu", explanation:"Préserve la marge, au risque de réduire la fréquentation si les clients sont sensibles au prix.", effects(s){ return {avgTicket: s.avgTicket+2, reputation: s.reputation-2}; }},
        {label:"Absorber la hausse sans changer les prix", explanation:"Garde les prix attractifs, au prix direct d'une marge plus faible.", effects(s){ return {foodCostPct: s.foodCostPct+3}; }},
        {label:"Chercher un fournisseur alternatif", explanation:"Peut limiter la hausse, mais demande du temps et un risque temporaire sur la qualité.", effects(s){ return {foodCostPct: s.foodCostPct+1, serviceQuality: s.serviceQuality-3}; }}
      ]},
    {id:'resto-avis-negatif', minMonth:3, priority:3, onceOnly:true,
      conditions(s){ return s.serviceQuality < 45; },
      title:'Avis négatif en ligne',
      buildSituation(s){ return {description:"Un client a laissé un avis très négatif sur le service.", dataPoints:[{label:'Qualité de service', value: s.serviceQuality.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Répondre publiquement et s'excuser", explanation:"Peut limiter les dégâts si la réponse est bien reçue, sans coût direct.", effects(s){ return {reputation: s.reputation+2}; }},
        {label:"Ignorer", explanation:"Aucune action, aucun coût — l'avis négatif reste visible.", effects(s){ return {reputation: s.reputation-4}; }}
      ]},
    {id:'resto-controle-sanitaire', minMonth:5, priority:5, onceOnly:true,
      conditions(s){ return s.serviceQuality < 50; },
      title:'Contrôle sanitaire à venir',
      buildSituation(s){ return {description:"Un contrôle sanitaire est annoncé pour les prochaines semaines.", dataPoints:[{label:'Qualité de service', value: s.serviceQuality.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Investir dans une remise aux normes préventive", explanation:"Réduit le risque de sanction, au prix d'un coût ponctuel immédiat.", effects(s){ return {cash: s.cash-2000, serviceQuality: s.serviceQuality+10}; }},
        {label:"Ne rien changer avant le contrôle", explanation:"Aucun coût immédiat, mais un vrai risque de sanction ou de fermeture temporaire en cas de manquement.", effects(s){ return {}; }}
      ]},
    {id:'resto-concurrent-ouvre', minMonth:5, priority:2, onceOnly:true,
      title:'Un concurrent ouvre à proximité',
      buildSituation(s){ return {description:"Un nouvel établissement similaire ouvre non loin.", dataPoints:[{label:'Emplacement', value: s.locationQuality.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Renforcer la fidélisation (carte de fidélité, offres)", explanation:"Peut limiter la perte de clientèle habituelle, au prix d'un coût marketing supplémentaire.", effects(s){ return {marketingBudgetMonthly: s.marketingBudgetMonthly+400, reputation: s.reputation+2}; }},
        {label:"Ne rien changer", explanation:"Aucun coût, mais un risque réel de perdre une partie de la clientèle au profit du nouveau venu.", effects(s){ return {reputation: s.reputation-3}; }}
      ]},
    {id:'resto-terrasse', minMonth:6, priority:3, onceOnly:true,
      conditions(s){ return s.cash > 20000; },
      title:"Opportunité d'agrandissement (terrasse)",
      buildSituation(s){ return {description:"Il est possible d'aménager une terrasse pour augmenter la capacité d'accueil.", dataPoints:[{label:'Capacité actuelle', value: (s.staffCount*260)+' clients/mois environ'}]}; },
      options:[
        {label:"Investir dans la terrasse", explanation:"Augmente durablement la capacité d'accueil, au prix d'un investissement immédiat et de charges fixes légèrement plus élevées.", effects(s){ return {cash: s.cash-8000, monthlyFixedCosts: s.monthlyFixedCosts+300, staffCount: s.staffCount+1}; }},
        {label:"Ne pas investir pour l'instant", explanation:"Préserve la trésorerie, sans gain de capacité.", effects(s){ return {}; }}
      ]},
    {id:'resto-renovation', minMonth:7, priority:2, onceOnly:true,
      conditions(s){ return s.serviceQuality < 55; },
      title:'Une rénovation serait bénéfique',
      buildSituation(s){ return {description:"Le cadre commence à montrer des signes d'usure.", dataPoints:[{label:'Qualité de service', value: s.serviceQuality.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Rénover", explanation:"Améliore l'expérience client et la réputation, au prix d'un investissement immédiat.", effects(s){ return {cash: s.cash-5000, serviceQuality: s.serviceQuality+12, reputation: s.reputation+4}; }},
        {label:"Reporter la rénovation", explanation:"Préserve la trésorerie à court terme, sans amélioration de l'expérience client.", effects(s){ return {}; }}
      ]},
    {id:'resto-repositionnement', minMonth:6, priority:2, onceOnly:true,
      title:'Repositionner le menu',
      buildSituation(s){ return {description:"Il est possible de repositionner le restaurant sur un menu plus haut de gamme.", dataPoints:[{label:'Ticket moyen actuel', value: fmtEUR(s.avgTicket)}]}; },
      options:[
        {label:"Monter en gamme (prix plus élevés)", explanation:"Augmente le revenu par client, au risque de réduire la fréquentation si la clientèle habituelle n'y est pas prête.", effects(s){ return {avgTicket: s.avgTicket+8, reputation: s.reputation-3}; }},
        {label:"Garder le positionnement actuel", explanation:"Aucun changement, ni risque ni gain immédiat.", effects(s){ return {}; }}
      ]},
    {id:'resto-tresorerie-tendue', minMonth:5, priority:5, onceOnly:true,
      conditions(s){ return s.cash < (s.rent + s.staffCount*s.staffCostPerPerson) * 3; },
      title:'Trésorerie tendue',
      buildSituation(s){ const monthlyBurn = s.rent + s.staffCount*s.staffCostPerPerson; const runway = monthlyBurn>0 ? Math.floor(s.cash/monthlyBurn) : 99; return {description:`Au rythme de charges actuel (loyer + personnel), il reste environ ${runway} mois de trésorerie.`, dataPoints:[{label:'Cash', value: fmtEUR(s.cash)}]}; },
      options:[
        {label:"Réduire temporairement le personnel", explanation:"Réduit les charges fixes, mais limite aussi la capacité de service et donc la fréquentation possible.", effects(s){ return {staffCount: Math.max(1, s.staffCount-1)}; }},
        {label:"Chercher un financement (dette)", explanation:"Apporte du cash immédiatement, mais crée des intérêts à rembourser chaque mois.", effects(s){ return {cash: s.cash+20000, debt: s.debt+20000}; }}
      ]},
    {id:'resto-franchise', minMonth:9, priority:3, onceOnly:true,
      conditions(s){ return s.reputation >= 60 && s.cash > 60000; },
      title:'Opportunité de second emplacement',
      buildSituation(s){ return {description:"La réputation du restaurant est assez forte pour envisager un second établissement.", dataPoints:[{label:'Réputation', value: s.reputation.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Investir dans un second emplacement", explanation:"Peut doubler la croissance à terme, au prix d'un investissement lourd et d'un risque de dispersion.", effects(s){ return {cash: s.cash-40000, monthlyFixedCosts: s.monthlyFixedCosts+1500}; }},
        {label:"Consolider le premier établissement", explanation:"Reste concentré sur ce qui fonctionne déjà, sans nouveau risque.", effects(s){ return {reputation: s.reputation+2}; }}
      ]},
    {id:'resto-rachat', minMonth:10, priority:4, onceOnly:true,
      conditions(s){ return s.reputation >= 65 && s.lastMonthCustomers >= 500; },
      title:'Une chaîne propose un rachat',
      buildSituation(s){ return {description:"Une chaîne de restaurants plus établie propose de racheter l'établissement.", dataPoints:[{label:'Réputation', value: s.reputation.toFixed(0)+'/100'}]}; },
      options:[
        {label:"Explorer sérieusement l'offre", explanation:"Peut mener à une sortie avantageuse, mais implique de discuter les conditions plutôt que de continuer seul.", effects(s){ return {_flagRachatConsidere: true}; }},
        {label:"Décliner et continuer seul", explanation:"Garde le contrôle total, au prix de renoncer à cette opportunité précise.", effects(s){ return {reputation: s.reputation+2}; }}
      ]},
    {id:'resto-mois-calme', minMonth:1, priority:1, onceOnly:false,
      title:'Un mois sans événement particulier',
      buildSituation(s){ return {description:"Ce mois-ci, rien d'exceptionnel ne se produit — l'activité continue sur sa lancée.", dataPoints:[{label:'Clients le mois dernier', value: String(s.lastMonthCustomers)},{label:'Cash', value: fmtEUR(s.cash)}]}; },
      options:[
        {label:"Continuer sans changement", explanation:"Laisse l'activité suivre sa trajectoire actuelle sans nouvel arbitrage ce mois-ci.", effects(s){ return {}; }},
        {label:"Ajuster légèrement le budget marketing", explanation:"Petite variation d'investissement en visibilité, sans autre changement.", effects(s){ return {marketingBudgetMonthly: Math.round(s.marketingBudgetMonthly*1.1)}; }}
      ]}
  ]
};

const BUSINESS_SECTORS = { saas: SAAS_SECTOR, ecommerce: ECOMMERCE_SECTOR, restaurant: RESTAURANT_SECTOR };
const BUSINESS_SECTOR_ORDER = ['saas', 'ecommerce', 'restaurant'];

// ---------- Business Stories ----------
// Récits inspirés d'entreprises réelles et bien documentées (§19) : le joueur
// découvre une situation anonymisée, décide, puis seulement ensuite découvre
// de quelle entreprise réelle le scénario s'inspire, avec sources vérifiables.
// Aucun fait n'est inventé ; les simplifications du jeu sont toujours signalées.
const BUSINESS_STORIES = [
  {
    id: 'story-saas-mailchimp',
    sectorKey: 'saas',
    icon: '💻',
    title: "Refuser l'argent facile",
    setup: {
      description: "Nous sommes en 2007. Une petite entreprise d'envoi d'emails marketing, lancée quelques années plus tôt par deux fondateurs sans aucun financement extérieur, commence à bien fonctionner et à dégager des revenus réguliers. Des investisseurs en capital-risque s'intéressent à elle et proposent une levée de fonds importante pour accélérer sa croissance.",
      dataPoints: [
        {label: 'Financement à ce jour', value: "Aucun — croissance financée par les revenus"},
        {label: 'Situation', value: "Rentable, croissance organique"}
      ]
    },
    choice: {
      question: "Si tu étais aux commandes de cette entreprise, qu'aurais-tu fait ?",
      options: [
        {id: 'accept', label: "Accepter la levée de fonds pour accélérer la croissance"},
        {id: 'refuse', label: "Refuser et continuer à financer la croissance uniquement par les revenus"}
      ]
    },
    // Simule MÉCANIQUEMENT les 2 options avec le même modèle déterministe que
    // le Business Game (audit Formations Phase 5 du 27/08/2026) — jamais une
    // prédiction sur ce qu'aurait fait la VRAIE entreprise, seulement l'effet
    // du même type de décision sur une entreprise dans une position de départ
    // similaire. baseOverrides approxime la situation du récit (rentable,
    // croissance organique) ; les deltas d'"accept" reprennent exactement les
    // chiffres de l'événement réel "saas-levee-fonds" ci-dessus, pour rester
    // cohérent avec le reste du modèle plutôt que d'inventer de nouveaux chiffres.
    consequenceModel: {
      baseOverrides: {cash: 60000, clients: 30, reputation: 55, satisfaction: 65},
      monthsToProject: 6,
      optionEffects: {
        accept(s){ return {cash: s.cash + 80000, marketingBudgetMonthly: s.marketingBudgetMonthly + 1500}; },
        refuse(s){ return {}; }
      }
    },
    reveal: {
      companyName: 'Mailchimp',
      whatReallyHappened: [
        {text: "Les fondateurs Ben Chestnut et Dan Kurzius ont choisi de ne jamais lever de fonds extérieurs et de financer toute la croissance de l'entreprise uniquement par ses propres revenus (bootstrapping).", source: 'TechCrunch', sourceUrl: 'https://techcrunch.com/2021/09/13/intuit-confirms-12b-deal-to-buy-mailchimp/'},
        {text: "En 2021, Intuit a racheté Mailchimp pour 12 milliards de dollars — le plus grand rachat jamais réalisé d'une entreprise entièrement bootstrappée, sans aucune levée de fonds en capital-risque.", source: 'Forbes', sourceUrl: 'https://www.forbes.com/sites/kenrickcai/2021/09/13/mailchimp-intuit-acquisition-billionaires-ben-chestnut-dan-kurzius/'}
      ],
      gameSimplifications: [
        "Le vrai parcours de Mailchimp s'étale sur 20 ans (2001-2021) — ce récit résume une seule décision, pas l'ensemble de l'histoire de l'entreprise.",
        "Refuser une levée de fonds ne mène pas systématiquement à un rachat à 12 milliards de dollars : Mailchimp est une réussite exceptionnelle et rare, pas un résultat garanti du bootstrapping."
      ],
      playerChoiceNote: "Ce choix n'a pas de bonne réponse universelle : dans le Business Game, une levée de fonds a aussi permis à d'autres trajectoires simulées de survivre à une crise de trésorerie. Le bootstrapping réduit la dilution et la pression de croissance imposée par des investisseurs, mais prive aussi l'entreprise d'un coussin de trésorerie en cas de choc."
    }
  },
  {
    id: 'story-ecommerce-zappos',
    sectorKey: 'ecommerce',
    icon: '🛍️',
    title: "Céder sous la pression",
    setup: {
      description: "Nous sommes en 2009. Un site de vente de chaussures en ligne a construit sa réputation sur un service client hors norme (livraison et retours gratuits sous 365 jours, centre d'appels ouvert 24h/24). Mais la crise financière frappe fort : les ventes ralentissent, l'entreprise dépend de prêts bancaires pour financer ses stocks, et son conseil d'administration s'inquiète.",
      dataPoints: [
        {label: 'Politique commerciale', value: "Retours gratuits sous 365 jours"},
        {label: 'Contexte', value: "Crise financière 2008-2009, stocks financés par emprunt bancaire"}
      ]
    },
    choice: {
      question: "Si tu étais le fondateur, qu'aurais-tu fait face à la pression du conseil d'administration ?",
      options: [
        {id: 'sell', label: "Accepter une acquisition par un acteur plus important pour sécuriser l'entreprise"},
        {id: 'refuse', label: "Refuser et continuer seul, quitte à prendre plus de risque"}
      ]
    },
    // baseOverrides reflète la trésorerie tendue et la dette du récit (stocks
    // financés par emprunt, crise 2008-2009) ; "sell" modélise un rachat qui
    // sécurise le cash et efface une partie de la dette (pas les vrais termes
    // financiers de l'accord réel, qui n'ont jamais été rendus publics dans
    // le détail) ; "refuse" laisse la dette et la trésorerie tendue telles quelles.
    consequenceModel: {
      baseOverrides: {cash: 15000, debt: 40000, inventory: 800, reputation: 60},
      monthsToProject: 6,
      optionEffects: {
        sell(s){ return {cash: s.cash + 50000, debt: Math.max(0, s.debt - 40000)}; },
        refuse(s){ return {}; }
      }
    },
    reveal: {
      companyName: 'Zappos',
      whatReallyHappened: [
        {text: "Sous la pression de son conseil d'administration (dont Sequoia Capital, actionnaire important), le fondateur Tony Hsieh — qui aurait préféré continuer à faire grandir l'entreprise seul jusqu'à une entrée en bourse — a accepté la vente à Amazon.", source: 'TechCrunch', sourceUrl: 'https://techcrunch.com/2010/06/07/tony-hsieh-zappos'},
        {text: "L'accord a été annoncé en juillet 2009 pour une valeur d'environ 847 millions de dollars, évaluée à environ 1,2 milliard de dollars frais inclus au moment de la clôture en novembre 2009 (l'écart vient de l'évolution du cours de l'action Amazon entre les deux dates).", source: 'Dossier officiel Amazon (SEC) / TechCrunch', sourceUrl: 'https://www.sec.gov/Archives/edgar/data/0001018724/000119312509153130/dex991.htm'}
      ],
      gameSimplifications: [
        "Zappos avait déjà reçu un investissement de Sequoia Capital plusieurs années avant cet épisode — ce récit se concentre sur le moment de la décision de vente, pas sur tout le parcours de financement de l'entreprise.",
        "Les deux chiffres cités (847 M$ à l'annonce, environ 1,2 Md$ à la clôture) reflètent une vraie évolution du cours de bourse, pas une imprécision du jeu."
      ],
      playerChoiceNote: "Aucune décision n'est objectivement « meilleure » ici : céder le contrôle sous la pression d'investisseurs est un compromis fréquent quand la trésorerie dépend de financements externes — exactement le type de tension que simule le Business Game via les variables Dette et besoin de financement."
    }
  },
  {
    id: 'story-restaurant-shakeshack',
    sectorKey: 'restaurant',
    icon: '🍔',
    title: "Un chariot qui devient une opportunité",
    setup: {
      description: "Nous sommes en 2003. Un chariot de hot-dogs installé temporairement dans un parc, pour accompagner une installation artistique, connaît un succès inattendu : la file d'attente s'allonge chaque été, au point d'être réédité deux étés de suite. La ville propose alors un contrat pour un kiosque permanent au même endroit.",
      dataPoints: [
        {label: 'Origine', value: "Chariot saisonnier, réédité 2 étés de suite par succès"},
        {label: 'Opportunité', value: "Contrat de kiosque permanent proposé par la ville"}
      ]
    },
    choice: {
      question: "Qu'aurais-tu fait à la place du restaurateur ?",
      options: [
        {id: 'invest', label: "Saisir l'opportunité et investir dans un kiosque permanent"},
        {id: 'stay', label: "Rester un chariot saisonnier, sans risque supplémentaire"}
      ]
    },
    // baseOverrides part d'un tout petit chariot déjà populaire (bonne
    // réputation, peu de personnel, peu de trésorerie) ; "invest" reprend
    // le même ordre de grandeur que l'événement réel "resto-terrasse"
    // (agrandissement) ci-dessus, "stay" laisse l'activité saisonnière inchangée.
    consequenceModel: {
      baseOverrides: {cash: 15000, staffCount: 2, reputation: 55, locationQuality: 50},
      monthsToProject: 6,
      optionEffects: {
        invest(s){ return {cash: s.cash - 10000, monthlyFixedCosts: s.monthlyFixedCosts + 400, staffCount: s.staffCount + 1, locationQuality: s.locationQuality + 15}; },
        stay(s){ return {}; }
      }
    },
    reveal: {
      companyName: 'Shake Shack',
      whatReallyHappened: [
        {text: "Le restaurateur Danny Meyer a accepté le contrat proposé par le département des parcs de New York : le kiosque permanent a ouvert le 12 juin 2004 à Madison Square Park.", source: 'Historique public Shake Shack', sourceUrl: 'https://en.wikipedia.org/wiki/Shake_Shack'},
        {text: "Après plus d'une décennie d'expansion progressive, un restaurant à la fois, Shake Shack est entré en bourse le 29 janvier 2015 : l'action, introduite à 21$, a grimpé de 123% dès le premier jour de cotation.", source: 'Historique public Shake Shack', sourceUrl: 'https://en.wikipedia.org/wiki/Shake_Shack'}
      ],
      gameSimplifications: [
        "Entre le chariot de 2001 et l'introduction en bourse de 2015, il s'est écoulé 14 ans d'expansion progressive — ce récit ne couvre qu'une seule décision de départ, pas tout le parcours.",
        "Le Business Game simule une seule année de décisions mensuelles : il ne peut pas reproduire une expansion sur 14 ans, mais la logique qu'il modélise (capacité limitée par le personnel, réputation qui se construit lentement) reste la même que celle de ce vrai parcours."
      ],
      playerChoiceNote: "Saisir une opportunité de croissance très tôt a fonctionné ici, mais le Business Game montre aussi, dans le secteur restaurant, qu'une expansion trop rapide (terrasse, second emplacement) peut aggraver une trésorerie déjà fragile si elle n'est pas soutenue par une demande réelle."
    }
  }
];
