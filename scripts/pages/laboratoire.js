/* ============================================================
   LIKANZA ACADEMY — Laboratoire financier (laboratoire.html)
   Simulateurs adossés à des données réellement observées : marchés
   (Yahoo Finance, historique mensuel via /api/custom-quotes),
   inflation / taux de crédit / prix immobilier France (BCE SDW via
   /api/eco-rate?series=...). Voir scripts/historical-data.js pour
   les métadonnées de source et scripts/data.js pour les fonctions
   de calcul pures (computeHistoricalInvestment, computeLoanAmortization,
   computeBuyVsRent...). Règle absolue : jamais de valeur inventée —
   un échec réseau affiche "donnée indisponible", jamais un repli fabriqué.
   ============================================================ */

renderLevelTip('levelTip', 'personalFinance');

// ---------- Hub par catégories (même pattern que bourse.js/BOURSE_TABS) :
// remplace le long scroll par une navigation, sans changer la logique des
// simulateurs eux-mêmes (chaque champ/carte garde son id, seuls les <section>
// englobants sont devenus des .home-tab-panel). D'autres catégories du plan
// (Transport, Dettes & crédits, Famille & projets, Scénarios de vie...) sont
// prévues mais pas encore construites — jamais un onglet vide affiché en
// attendant, seules les catégories réellement fonctionnelles apparaissent. ----------
const LAB_TABS = [
  {id:'tab-investissement', title:'Investissement', desc:'Tester des stratégies', icon:'trending-up'},
  {id:'tab-logement', title:'Logement', desc:'Achat, location, prêt', icon:'house'},
  {id:'tab-dettes', title:'Dettes & crédits', desc:'Coût et stratégies', icon:'landmark'},
  {id:'tab-transport', title:'Transport', desc:'Achat, crédit, LOA', icon:'compass'},
  {id:'tab-budget-epargne', title:'Budget & épargne', desc:'Comprendre son argent', icon:'coins'},
  {id:'tab-planification', title:'Planification', desc:'Comparer des décisions', icon:'scale'},
  {id:'tab-economie', title:'Économie', desc:'Effets des chocs macro', icon:'telescope'}
];
let labActiveTab = (location.hash && document.getElementById(location.hash.slice(1))) ? location.hash.slice(1) : 'tab-investissement';
function renderLabTabs(){
  const el = document.getElementById('labTabsGrid');
  if(!el) return;
  el.innerHTML = LAB_TABS.map(t=>`
    <button class="quick-access-card ${t.id===labActiveTab?'active':''}" data-tab="${t.id}">
      <div class="icon">${ICONS[t.icon] || ''}</div>
      <h3>${t.title}</h3>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${t.desc}</p>
    </button>`).join('');
  el.querySelectorAll('.quick-access-card').forEach(btn=>{
    btn.addEventListener('click', ()=>setLabTab(btn.dataset.tab));
  });
}
function setLabTab(tabId){
  labActiveTab = tabId;
  document.querySelectorAll('#labTabsGrid .quick-access-card').forEach(c=>c.classList.toggle('active', c.dataset.tab===tabId));
  document.querySelectorAll('.home-tab-panel').forEach(p=>p.classList.toggle('active', p.id===tabId));
}
renderLabTabs();
setLabTab(labActiveTab);
window.addEventListener('hashchange', ()=>{
  const tab = location.hash.slice(1);
  const target = document.getElementById(tab);
  if(target && target.classList.contains('home-tab-panel')) setLabTab(tab);
});

// ---------- Widgets individuels à l'intérieur de chaque catégorie (2e niveau
// de la même logique de hub) : chaque simulateur est une carte cachée par
// défaut (display:none dans le HTML), révélée uniquement au clic sur sa
// vignette — jamais plusieurs formulaires empilés visibles par défaut, même
// à l'intérieur d'une seule catégorie. ----------
const LAB_WIDGETS = {
  'tab-investissement': [
    {id:'widget-invest-whatif', title:"Et si j'avais investi ?", desc:"Rejoue un support réel sur une période choisie.", icon:'trending-up'},
    {id:'widget-invest-dca', title:'DCA historique', desc:'Prix moyen réel avec un versement mensuel régulier.', icon:'banknote'},
    {id:'widget-invest-compound', title:'Intérêts composés', desc:'Un capital qui grossit avec des versements réguliers.', icon:'coins'},
    {id:'widget-invest-pru', title:"Prix moyen d'achat", desc:'Calcule ton prix moyen à partir de tes achats successifs.', icon:'calculator'},
    {id:'widget-invest-var', title:'Risque quantitatif (VaR)', desc:'Perte potentielle estimée, selon un niveau de confiance choisi.', icon:'shield'},
    {id:'widget-invest-bond', title:'Calculateur obligataire (prix / YTM)', desc:'Prix ↔ rendement à l\'échéance, à partir des vrais flux de coupons.', icon:'landmark'},
    {id:'widget-invest-forex', title:'Calculateur de position Forex', desc:'Taille de position en lots, à partir de ton risque accepté et de ton stop-loss.', icon:'scale'}
  ],
  'tab-logement': [
    {id:'labCreditCard', title:'Coût réel de mon crédit', desc:"Tableau d'amortissement complet, taux et durée.", icon:'landmark'},
    {id:'labBuyRentCard', title:'Acheter ou louer ?', desc:'Patrimoine net comparé entre achat et location.', icon:'house'}
  ],
  'tab-dettes': [
    {id:'widget-debt-strategy', title:'Quel crédit rembourser en premier ?', desc:'Compare deux stratégies sur tes vrais crédits.', icon:'landmark'},
    {id:'widget-debt-consolidation', title:'Regrouper ou conserver ses crédits ?', desc:'Mensualité vs coût total réel du regroupement.', icon:'scale'}
  ],
  'tab-transport': [
    {id:'widget-transport-tco', title:'Coût total de possession', desc:'Achat, énergie, assurance, entretien, décote.', icon:'calculator'},
    {id:'widget-transport-financing', title:'Comptant, crédit, LOA ou LLD ?', desc:'Compare le coût total réel de financement.', icon:'scale'}
  ],
  'tab-budget-epargne': [
    {id:'widget-budget-inflation', title:'Que valent mes euros ?', desc:'Inflation réelle mesurée, pas une hypothèse constante.', icon:'trending-down'},
    {id:'widget-budget-calc', title:'Calculateur de budget', desc:"Ta capacité d'épargne mensuelle réelle.", icon:'wallet'},
    {id:'widget-budget-goal', title:"Objectif d'épargne", desc:'Combien de temps pour atteindre un montant visé.', icon:'target'},
    {id:'widget-budget-sub', title:"Coût futur d'un abonnement", desc:'Ce que représente un abonnement sur plusieurs années.', icon:'coins'}
  ]
};
function renderLabWidgetGrid(categoryId){
  const widgets = LAB_WIDGETS[categoryId];
  const el = document.getElementById(categoryId + '-widgets');
  if(!widgets || !el) return;
  el.innerHTML = widgets.map(w => `
    <button class="quick-access-card" data-widget="${w.id}">
      <div class="icon">${ICONS[w.icon] || ''}</div>
      <h3>${w.title}</h3>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${w.desc}</p>
    </button>`).join('');
  el.querySelectorAll('[data-widget]').forEach(btn=>{
    btn.addEventListener('click', ()=>openLabWidget(categoryId, btn.dataset.widget));
  });
}
function openLabWidget(categoryId, widgetId){
  const gridEl = document.getElementById(categoryId + '-widgets');
  if(gridEl) gridEl.style.display = 'none';
  (LAB_WIDGETS[categoryId] || []).forEach(w => {
    const panel = document.getElementById(w.id);
    if(panel) panel.style.display = (w.id === widgetId) ? '' : 'none';
  });
  const backBtn = document.getElementById(categoryId + '-back');
  if(backBtn) backBtn.style.display = '';
}
function closeLabWidget(categoryId){
  const gridEl = document.getElementById(categoryId + '-widgets');
  if(gridEl) gridEl.style.display = '';
  (LAB_WIDGETS[categoryId] || []).forEach(w => {
    const panel = document.getElementById(w.id);
    if(panel) panel.style.display = 'none';
  });
  const backBtn = document.getElementById(categoryId + '-back');
  if(backBtn) backBtn.style.display = 'none';
}
Object.keys(LAB_WIDGETS).forEach(categoryId => {
  renderLabWidgetGrid(categoryId);
  closeLabWidget(categoryId);
  const backBtn = document.getElementById(categoryId + '-back');
  if(backBtn) backBtn.addEventListener('click', () => closeLabWidget(categoryId));
});

// ---------- Template méthodologie universel (section 18 du plan) : même
// panneau « ⓘ Comment ce résultat est calculé ? » sur chaque simulateur,
// contenu réel propre à chaque calcul — renderMethodologyPanel (dans
// scripts/historical-data.js) omet silencieusement toute section non
// renseignée ici, jamais un onglet affiché vide. Contenu statique (ne décrit
// pas le résultat courant mais la MÉTHODE), injecté une seule fois au
// chargement dans le placeholder <div id="method-XXX"> de chaque carte. ----------
const LAB_METHODOLOGY = {
  'invest-whatif': {
    calcul: "Ton capital initial et chaque versement mensuel achètent des unités au vrai cours de ce mois précis — la valeur finale est le nombre total d'unités multiplié par le dernier cours connu.",
    donnees: "Cours de clôture mensuels réels (Yahoo Finance) du support choisi, sur la période exacte que tu sélectionnes.",
    hypotheses: "Le capital initial, le versement mensuel, la date de début et de fin, et le support choisi.",
    limites: "Ne tient pas compte des frais de courtage ni de la fiscalité. Les dividendes ne sont inclus que pour les supports où l'historique Yahoo les intègre déjà.",
    comprendre: "Une simulation rétrospective ne prédit rien : elle montre ce qui se serait passé sur cette période précise, avec ce support précis — une autre période aurait donné un résultat différent."
  },
  'invest-dca': {
    calcul: "Même principe que « Et si j'avais investi ? » : chaque versement mensuel achète des unités au vrai cours du mois. Le prix moyen d'achat réel est le total dépensé divisé par le nombre total d'unités achetées.",
    donnees: "Cours de clôture mensuels réels (Yahoo Finance) du support choisi.",
    hypotheses: "Le versement mensuel et la date de départ.",
    limites: "Ne tient pas compte des frais de courtage ni de la fiscalité.",
    comprendre: "Le DCA (versement programmé) lisse le prix d'achat dans le temps — il ne garantit ni un meilleur ni un moins bon résultat qu'un versement unique, tout dépend de l'évolution réelle des prix."
  },
  'invest-compound': {
    calcul: "Chaque mois, le capital accumulé (versements + intérêts déjà générés) rapporte à nouveau des intérêts — c'est l'effet « boule de neige » des intérêts composés.",
    donnees: "Selon le mode choisi : soit un vrai rendement annualisé historique (obligations/S&P 500/Nasdaq, Yahoo Finance), soit un taux que tu fixes toi-même (mode personnalisé).",
    hypotheses: "Le capital de départ, le versement mensuel, le rendement annuel, la durée et d'éventuels frais de gestion.",
    limites: "Un rendement annuel moyen constant est une simplification : les marchés réels varient fortement d'une année à l'autre.",
    comprendre: "Un rendement de 6%/an ne veut pas dire +6% chaque année : certaines années sont négatives, d'autres bien plus fortes — seule la moyenne composée sur la durée totale atteint ce chiffre."
  },
  'invest-pru': {
    calcul: "Prix moyen = (somme de chaque quantité × son prix d'achat) ÷ quantité totale achetée.",
    donnees: "Aucune donnée externe : uniquement les quantités et prix que tu saisis toi-même.",
    hypotheses: "Le nombre d'achats, leur quantité et leur prix unitaire.",
    limites: "Ne tient pas compte des frais de courtage à l'achat."
  },
  'invest-var': {
    calcul: "VaR (en %) = z(niveau de confiance) × volatilité annuelle × √(horizon en jours ÷ 252) − rendement annuel attendu × (horizon en jours ÷ 252). Le z est une constante standard associée au niveau de confiance choisi (1,645 pour 95%, 2,326 pour 99%...). VaR en € = VaR en % × valeur du portefeuille.",
    donnees: "Aucune donnée externe : la valeur du portefeuille, le rendement annuel attendu et la volatilité annuelle sont saisis par toi (tu peux t'inspirer des volatilités historiques de la Bibliothèque pour différents types d'actifs).",
    hypotheses: "Cette VaR paramétrique suppose que les rendements suivent approximativement une loi normale (voir ce terme dans la Bibliothèque), et met à l'échelle une volatilité annuelle sur l'horizon choisi via la règle dite « racine du temps ».",
    limites: "L'hypothèse de loi normale sous-estime la fréquence réelle des mouvements de marché extrêmes (« queues de distribution plus épaisses » en réalité) : cette VaR peut donc sous-estimer le risque des pertes les plus sévères, précisément celles qui comptent le plus en pratique.",
    comprendre: "Une VaR n'est jamais une perte maximale garantie : c'est un seuil associé à une probabilité de dépassement. Une VaR à 95% signifie qu'il reste, par construction, 5% de scénarios où la perte réelle dépasse ce seuil — parfois largement."
  },
  'invest-bond': {
    calcul: "Mode « Taux → Prix » : le prix est la somme de chaque coupon futur et de la valeur nominale, chacun actualisé au taux du marché saisi (formule fermée standard). Mode « Prix → YTM » : aucune formule fermée n'existe pour le rendement à l'échéance d'une obligation à coupons — le taux est retrouvé par recherche numérique (bissection), en cherchant le taux qui redonne exactement le prix observé saisi.",
    donnees: "Aucune donnée externe : la valeur nominale, le taux de coupon, la maturité, la fréquence et le taux du marché (ou le prix observé) sont saisis par toi.",
    hypotheses: "Coupons versés à intervalles réguliers (annuels ou semestriels selon la fréquence choisie) jusqu'à l'échéance, puis remboursement intégral de la valeur nominale à l'échéance — aucun défaut de l'émetteur n'est modélisé.",
    limites: "Ne tient pas compte des frais de courtage, de la fiscalité, ni d'un remboursement anticipé (obligation « callable »). Le YTM suppose que chaque coupon reçu est réinvesti exactement au même taux — une simplification rarement vérifiée en pratique.",
    comprendre: "Le prix et le taux évoluent toujours en sens inverse : un taux du marché plus élevé que le coupon fait baisser le prix sous la valeur nominale (décote), un taux plus faible le fait monter au-dessus (prime). Voir le chapitre \"Le prix d'une obligation\" du cours Bourse pour l'intuition complète."
  },
  'invest-forex': {
    calcul: "Valeur du pip = taille du lot (en unités) × taille du pip (0,0001, ou 0,01 pour les paires avec le yen) — un calcul mathématique fixe, jamais estimé. Taille de position (en lots) = (capital × risque accepté en %) ÷ (stop-loss en pips × valeur du pip par lot).",
    donnees: "Aucune donnée externe : le capital, le risque accepté, le stop-loss, la taille de lot et la convention de pip sont saisis par toi.",
    hypotheses: "La valeur du pip calculée est exprimée dans la devise de COTATION de la paire (la 2e devise, ex. USD pour EUR/USD) — le calcul suppose que ton capital risqué est exprimé dans cette même devise.",
    limites: "Si ton compte est libellé dans une autre devise que la devise de cotation de la paire tradée, une conversion de change supplémentaire est nécessaire, non calculée ici — jamais un taux de change inventé pour combler ce trou. Ne tient pas compte du spread ni d'éventuels frais de commission.",
    comprendre: "Cette formule garantit que si le stop-loss est touché, la perte réelle correspond exactement au montant qu'on avait décidé d'accepter à l'avance — c'est la taille de la position, pas la conviction dans le trade, qui détermine si une erreur reste gérable ou devient une perte sévère."
  },
  'credit': {
    calcul: "Mensualité = capital emprunté × [taux mensuel × (1+taux mensuel)^n] ÷ [(1+taux mensuel)^n − 1], où n est le nombre de mensualités — la formule standard d'un prêt amortissable à taux fixe.",
    donnees: "Le taux proposé par défaut vient du taux moyen des crédits immobiliers en France (Banque de France/BCE) sur la durée choisie — modifiable librement.",
    hypotheses: "Le prix du bien, l'apport, le taux, la durée, l'assurance et les frais annexes.",
    limites: "Ne tient pas compte d'un taux variable, d'un remboursement anticipé, ni des conditions spécifiques de chaque banque.",
    comprendre: "Le tableau d'amortissement montre qu'au début d'un crédit, une mensualité rembourse surtout des intérêts — la part de capital remboursé augmente progressivement au fil du temps."
  },
  'buyrent': {
    calcul: "Simulation mois par mois (pas une formule unique) : le patrimoine net du propriétaire est la valeur du bien moins le capital restant dû ; celui du locataire est son apport non dépensé, investi dès le départ, puis abondé chaque mois de la différence de coût réel entre les deux situations.",
    donnees: "Le taux de crédit par défaut et l'évolution des prix immobiliers viennent de séries réelles (Banque de France/BCE) ; le loyer initial et le rendement de l'apport investi sont saisis par toi.",
    hypotheses: "Prix du bien, apport, taux, durée, charges, taxe foncière, entretien, loyer et son évolution, et le rendement hypothétique si l'apport était investi ailleurs.",
    limites: "Ne tient pas compte des évolutions futures réelles des prix immobiliers ou des loyers (inconnues à l'avance), ni d'événements personnels qui pourraient forcer une revente anticipée.",
    comprendre: "Le point d'équilibre indique la durée à partir de laquelle un scénario devient plus favorable que l'autre, avec ces hypothèses précises — il change dès qu'une seule hypothèse change."
  },
  'debt-strategy': {
    calcul: "Simulation mois par mois : chaque crédit accumule ses intérêts réels puis reçoit sa mensualité minimale ; l'éventuel effort supplémentaire (plus les mensualités libérées par les crédits déjà soldés) est redirigé selon la stratégie choisie — taux le plus élevé d'abord (avalanche) ou plus petit solde d'abord (boule de neige).",
    donnees: "Aucune donnée externe : uniquement les crédits (solde, taux, mensualité minimale) que tu saisis toi-même.",
    hypotheses: "Le solde, le taux et la mensualité minimale de chaque crédit, plus l'effort mensuel supplémentaire éventuel.",
    limites: "Ne tient pas compte d'éventuelles pénalités de remboursement anticipé (à vérifier auprès de chaque prêteur), ni d'un taux variable.",
    comprendre: "L'avalanche (taux le plus élevé d'abord) minimise toujours le coût total en intérêts ; la boule de neige (plus petit solde d'abord) solde des crédits plus vite, ce qui peut aider à rester motivé."
  },
  'debt-consolidation': {
    calcul: "La situation actuelle additionne les mensualités minimales réelles de chaque crédit ; le crédit regroupé réutilise la même formule de mensualité qu'un crédit classique, sur le nouveau montant, taux et durée que tu saisis.",
    donnees: "Aucune donnée externe : les crédits actuels et les paramètres du nouveau prêt sont saisis par toi.",
    hypotheses: "Solde, taux et mensualité de chaque crédit actuel, plus montant, taux, durée et frais de dossier du crédit regroupé.",
    limites: "Ne tient pas compte de frais de rachat de crédit possibles sur les prêts actuels, ni des conditions réelles qu'une banque accepterait effectivement de proposer.",
    comprendre: "Une mensualité plus faible ne veut pas dire un coût total inférieur : allonger la durée réduit la mensualité mais augmente souvent le total des intérêts payés."
  },
  'transport-tco': {
    calcul: "Additionne tout ce qui est réellement dépensé (achat ou coût total du crédit, carburant/électricité, assurance, entretien), puis soustrait une valeur de revente estimée par décote annuelle composée — le coût net divisé par le kilométrage total donne le coût au kilomètre.",
    donnees: "Aucune donnée externe : prix, consommation, kilométrage, assurance, entretien et décote sont tous saisis par toi.",
    hypotheses: "Le prix d'achat, le mode de paiement, la durée de possession, la consommation et le prix de l'énergie, l'assurance, l'entretien et le taux de décote annuel.",
    limites: "La décote réelle dépend du modèle, de son état et du marché de l'occasion au moment de la revente — un taux constant est une simplification, jamais une valeur garantie.",
    comprendre: "Le même formulaire sert un véhicule essence, hybride ou électrique : seuls la consommation et le prix de l'énergie changent, le calcul reste identique."
  },
  'transport-financing': {
    calcul: "Comptant : le prix payé, avec en information séparée le coût d'opportunité si ce capital avait été investi. Crédit : coût total réel du prêt (même formule que « Coût réel de mon crédit »). LOA/LLD : la mensualité réelle que tu saisis, multipliée par la durée, plus l'option d'achat éventuelle pour la LOA.",
    donnees: "Aucune donnée externe : le prix du véhicule et les mensualités LOA/LLD réellement proposées sont saisis par toi.",
    hypotheses: "Prix, durée de comparaison, taux de crédit, mensualités LOA/LLD et option d'achat éventuelle.",
    limites: "Likanza ne calcule pas la mensualité LOA/LLD elle-même (marge du loueur, valeur résiduelle contractuelle) — elle doit venir d'une offre réelle que tu saisis.",
    comprendre: "Le coût total le plus bas n'est pas automatiquement le meilleur choix : la LOA/LLD n'immobilise pas de capital et peut inclure l'entretien selon le contrat."
  },
  'budget-inflation': {
    calcul: "Perte de pouvoir d'achat = montant × (indice des prix à la fin de la période ÷ indice au début) − montant. Le scénario futur applique un taux d'inflation annuel composé sur la durée choisie.",
    donnees: "Indice harmonisé des prix à la consommation (IPCH), France, BCE — donnée réelle mesurée, pas une hypothèse.",
    hypotheses: "Pour le passé : uniquement le montant et les deux dates. Pour l'avenir (scénario) : un taux d'inflation et un rendement d'épargne hypothétiques que tu choisis, jamais garantis.",
    limites: "L'inflation mesure une moyenne nationale sur un panier de biens — ton propre coût de la vie peut évoluer différemment selon tes dépenses réelles.",
    comprendre: "Le passé est un fait mesuré (badge 📊) ; l'avenir est un scénario basé sur des hypothèses (badge 🔮) — les deux ne doivent jamais être confondus."
  },
  'budget-calc': {
    calcul: "Capacité d'épargne = revenus mensuels nets − loyer/crédit − charges fixes − dépenses variables.",
    donnees: "Aucune donnée externe : uniquement les montants que tu saisis toi-même.",
    hypotheses: "Tes revenus et dépenses tels que tu les renseignes.",
    limites: "Ne détaille pas les postes de dépenses individuellement — un budget réel varie souvent d'un mois à l'autre."
  },
  'budget-goal': {
    calcul: "Durée nécessaire = montant visé ÷ épargne mensuelle possible.",
    donnees: "Aucune donnée externe.",
    hypotheses: "Le montant visé et l'épargne mensuelle que tu penses pouvoir mettre de côté.",
    limites: "Ne tient pas compte d'un éventuel rendement de l'épargne placée (calcul à versements simples, sans intérêts) ni d'imprévus qui pourraient interrompre l'épargne."
  },
  'budget-sub': {
    calcul: "Compare le total simplement dépensé (coût mensuel × durée) à ce que ce même montant aurait pu devenir s'il avait été investi à un rendement annuel composé plutôt que dépensé.",
    donnees: "Aucune donnée externe : coût, durée et rendement hypothétique sont saisis par toi.",
    hypotheses: "Le coût mensuel, la durée et le rendement annuel hypothétique si investi à la place.",
    limites: "Le rendement utilisé est une hypothèse, jamais garanti — voir le mode « Historique » du simulateur Intérêts composés pour des taux réellement mesurés dans le passé."
  }
};
Object.keys(LAB_METHODOLOGY).forEach(key => {
  const el = document.getElementById('method-' + key);
  if(el) el.innerHTML = renderMethodologyPanel(LAB_METHODOLOGY[key]);
});

const LAB_SUPPORT_LABELS = {
  URTH: 'Actions monde (MSCI World, ETF URTH)', '^GSPC': 'Actions US (S&P 500)', '^FCHI': 'Actions France (CAC 40)',
  '^STOXX50E': 'Actions Europe (Euro Stoxx 50)', QQQ: 'Actions technologie US (Nasdaq 100, ETF QQQ)',
  EEM: 'Actions émergents (MSCI Emerging Markets, ETF EEM)', 'GC=F': 'Or (cours au comptant, futures)', AGG: 'Obligations US (ETF AGG)'
};
const LAB_SUPPORT_SERIES_KEY = {
  URTH: 'urthWorld', '^GSPC': 'sp500', '^FCHI': 'cac40',
  '^STOXX50E': 'euroStoxx50', QQQ: 'nasdaq100', EEM: 'emergingMarkets', 'GC=F': 'gold', AGG: 'bondsUS'
};

// URTH et ^GSPC cotent en USD, ^FCHI en EUR — pour que "Capital initial (€)"
// et le résultat final représentent réellement les mêmes euros tout du long,
// les cours USD sont convertis avec le vrai taux de change EUR/USD mensuel
// (Yahoo Finance, EURUSD=X, même infra). Aucun taux de change inventé : un
// mois sans taux de change disponible est simplement exclu de la série.
let labFxCache = null;
async function fetchLabEurUsdRate(){
  if(labFxCache) return labFxCache;
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent('EURUSD=X') + '&range=10y&interval=1mo');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Taux de change EUR/USD indisponible');
  const map = {};
  q.history.forEach(h => { map[h.date.slice(0, 7)] = h.close; });
  labFxCache = map;
  return map;
}

async function fetchLabMonthlyHistory(symbol){
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbol) + '&range=10y&interval=1mo');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Historique indisponible');
  let points = q.history.map(h => ({period: h.date.slice(0, 7), close: h.close}));
  if(q.currency === 'USD'){
    const fx = await fetchLabEurUsdRate();
    points = points.filter(p => typeof fx[p.period] === 'number').map(p => ({period: p.period, close: p.close / fx[p.period]}));
    if(points.length < 2) throw new Error('Conversion EUR/USD insuffisante sur cette période');
  }
  return points;
}

let labInflationCache = null;
async function fetchLabInflationFR(){
  if(labInflationCache) return labInflationCache;
  const resp = await fetch('/api/eco-rate?series=inflation-fr');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  if(!Array.isArray(data.points) || data.points.length < 2) throw new Error('Série inflation indisponible');
  labInflationCache = data;
  return data;
}

// Partagé entre la carte Crédit ("Combien coûte réellement mon crédit ?") et
// la carte Acheter ou louer, qui ont toutes les deux besoin du même vrai
// taux de crédit immobilier français — un seul appel réseau, jamais deux
// appels dupliqués pour la même donnée sur la même page.
let labMortgageRateCache = null;
async function fetchLabMortgageRate(){
  if(labMortgageRateCache) return labMortgageRateCache;
  const resp = await fetch('/api/eco-rate?series=mortgage-rate-fr');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  if(!Array.isArray(data.points) || data.points.length < 1) throw new Error('Taux crédit indisponible');
  labMortgageRateCache = data;
  return data;
}

function populatePeriodSelect(selectEl, periods, defaultValue){
  selectEl.innerHTML = periods.map(p => `<option value="${p}">${p}</option>`).join('');
  if(defaultValue && periods.includes(defaultValue)) selectEl.value = defaultValue;
}

// ---------- P0-1 : "Et si j'avais investi ?" ----------
(function initLabInvest(){
  const supportEl = document.getElementById('labInvestSupport');
  const capitalEl = document.getElementById('labInvestCapital');
  const monthlyEl = document.getElementById('labInvestMonthly');
  const startEl = document.getElementById('labInvestStart');
  const endEl = document.getElementById('labInvestEnd');
  const qtyEl = document.getElementById('labInvestQty');
  const qtyNoteEl = document.getElementById('labInvestQtyNote');
  const compareLivretAEl = document.getElementById('labInvestCompareLivretA');
  const searchInputEl = document.getElementById('labInvestSearchInput');
  const searchResultsEl = document.getElementById('labInvestSearchResults');
  const followedGroupEl = document.getElementById('labInvestFollowedGroup');
  const outputEl = document.getElementById('labInvestOutput');
  const badgeEl = document.getElementById('labInvestBadge');
  const partialNoteEl = document.getElementById('labInvestPartialNote');
  if(!supportEl || !outputEl) return;

  let currentHistory = null;

  // Nom affichable pour n'importe quel support : les 8 indices/matières
  // premières curatés ont un libellé fixe (LAB_SUPPORT_LABELS) ; toute autre
  // action réelle (ajoutée via recherche) utilise son vrai nom via
  // resolveFollowedAsset — jamais "undefined" affiché.
  function labSupportLabel(symbol){
    return LAB_SUPPORT_LABELS[symbol] || resolveFollowedAsset(symbol).nom;
  }

  // Optgroup "Actions suivies" peuplé depuis les vraies valeurs suivies du
  // site (getFollowedStocks, partagé avec bourse.html/dividende.html) — sans
  // dupliquer les 8 indices/matières premières déjà listés séparément.
  function populateFollowedGroup(){
    if(!followedGroupEl) return;
    const previous = supportEl.value;
    followedGroupEl.innerHTML = getFollowedStocks()
      .filter(s => !LAB_SUPPORT_LABELS[s.symbol])
      .map(s => `<option value="${s.symbol}">${resolveFollowedAsset(s.symbol).nom}</option>`)
      .join('');
    if(previous && Array.from(supportEl.options).some(o => o.value === previous)) supportEl.value = previous;
  }
  populateFollowedGroup();

  // Convertit une quantité d'actions saisie en capital réel, au vrai cours
  // de clôture de la date de départ choisie — jamais un prix supposé.
  function applyQtyIfSet(){
    const qty = +qtyEl.value;
    if(!qty || qty <= 0 || !currentHistory){ if(qtyNoteEl) qtyNoteEl.textContent = ''; return; }
    const startPoint = currentHistory.find(p => p.period === startEl.value);
    if(!startPoint || typeof startPoint.close !== 'number'){
      if(qtyNoteEl) qtyNoteEl.textContent = 'Cours réel indisponible pour cette date de départ.';
      return;
    }
    const capital = qty * startPoint.close;
    capitalEl.value = Math.round(capital);
    if(qtyNoteEl) qtyNoteEl.textContent = `= ${qty} action${qty > 1 ? 's' : ''} × ${startPoint.close.toFixed(2)} € (cours réel de ${startEl.value}) = ${fmtEUR(capital)}.`;
  }

  function renderOutput(){
    if(!currentHistory) return;
    const startIdx = currentHistory.findIndex(p => p.period === startEl.value);
    const endIdx = currentHistory.findIndex(p => p.period === endEl.value);
    if(startIdx === -1 || endIdx === -1 || endIdx <= startIdx){
      outputEl.innerHTML = `<p style="color:var(--bordeaux);font-size:13px;">Choisis une date de fin postérieure à la date de départ.</p>`;
      return;
    }
    const slice = currentHistory.slice(startIdx, endIdx + 1);
    const result = computeHistoricalInvestment(slice, +capitalEl.value || 0, +monthlyEl.value || 0);
    if(!result){ outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Pas assez de données sur cette période.</p>`; return; }

    // Comparaison Livret A réel (même période, même capital/versement) —
    // computeLivretASeries renvoie null si un seul mois de la période est
    // hors de la couverture réelle du tableau : jamais un chiffre inventé
    // pour combler, l'onglet affiche alors une note honnête à la place.
    const livretA = compareLivretAEl.checked
      ? computeLivretASeries(slice.map(p => p.period), +capitalEl.value || 0, +monthlyEl.value || 0)
      : null;

    const level = getLevel();
    const chartSeries = [
      {data: result.investedSeries, color: 'var(--text-dim)', dashed: true, width: 1.5},
      {data: result.valueSeries, color: 'var(--gold-bright)', width: 2.5}
    ];
    if(livretA) chartSeries.push({data: livretA.valueSeries, color: 'var(--emerald)', dashed: true, width: 2});
    const chart = renderMultiLineChart(chartSeries);
    const mainFactor = result.years >= 10 ? `la durée (${result.years.toFixed(1)} ans d'exposition réelle au marché)` : 'la période choisie (les rendements réels varient beaucoup d\'une période à l\'autre)';

    let statsHtml = `
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-top:14px;">
        <div class="card"><span class="smallcaps">Total investi</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(result.totalInvested)}</div></div>
        <div class="card"><span class="smallcaps">Valeur finale</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(result.finalValue)}</div></div>
        <div class="card"><span class="smallcaps">Gain / perte</span><div class="result-big" style="font-size:20px;margin-top:6px;color:${result.totalGain>=0?'var(--emerald)':'var(--bordeaux)'};">${result.totalGain>=0?'+':''}${fmtEUR(result.totalGain)}</div></div>
        <div class="card"><span class="smallcaps">CAGR (rendement annualisé réel)</span><div class="result-big" style="font-size:20px;margin-top:6px;">${result.cagr>=0?'+':''}${result.cagr.toFixed(1)} %</div></div>`;
    if(level !== 'debutant'){
      statsHtml += `
        <div class="card"><span class="smallcaps">Meilleure année</span><div class="result-big" style="font-size:20px;margin-top:6px;color:var(--emerald);">${result.bestYear ? `+${result.bestYear.returnPct.toFixed(1)} % (${result.bestYear.year})` : '—'}</div></div>
        <div class="card"><span class="smallcaps">Pire année</span><div class="result-big" style="font-size:20px;margin-top:6px;color:var(--bordeaux);">${result.worstYear ? `${result.worstYear.returnPct.toFixed(1)} % (${result.worstYear.year})` : '—'}</div></div>
        <div class="card"><span class="smallcaps">Années négatives</span><div class="result-big" style="font-size:20px;margin-top:6px;">${result.negativeYears} / ${result.yearlyReturns.length}</div></div>
        <div class="card"><span class="smallcaps">Drawdown maximal</span><div class="result-big" style="font-size:20px;margin-top:6px;color:var(--bordeaux);">-${result.maxDrawdownPct.toFixed(1)} %</div></div>`;
    }
    if(level === 'avance' || level === 'expert'){
      statsHtml += `<div class="card"><span class="smallcaps">Temps de récupération du pire drawdown</span><div class="result-big" style="font-size:20px;margin-top:6px;">${result.recoveryMonths !== null ? result.recoveryMonths + ' mois' : 'Pas encore récupéré'}</div></div>`;
    }
    statsHtml += `</div>`;

    const legendItems = [
      `<span><span style="display:inline-block;width:10px;height:2px;background:var(--text-dim);margin-right:6px;vertical-align:middle;"></span>Versé</span>`,
      `<span><span style="display:inline-block;width:10px;height:10px;background:var(--gold-bright);border-radius:50%;margin-right:6px;"></span>Valeur (${labSupportLabel(supportEl.value)})</span>`
    ];
    let livretAHtml = '';
    if(compareLivretAEl.checked){
      if(livretA){
        legendItems.push(`<span><span style="display:inline-block;width:10px;height:2px;background:var(--emerald);margin-right:6px;vertical-align:middle;"></span>Livret A réel</span>`);
        const delta = result.finalValue - livretA.finalValue;
        livretAHtml = `<p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">${renderDataBadge('fait')} Sur la même période, avec les mêmes versements, un Livret A (taux réel en vigueur à chaque mois, capitalisation mensuelle simplifiée) aurait donné <strong style="color:var(--text);">${fmtEUR(livretA.finalValue)}</strong> — soit ${delta >= 0 ? '+' : ''}${fmtEUR(delta)} ${delta >= 0 ? 'de plus' : 'de moins'} avec ${labSupportLabel(supportEl.value)} sur cette période précise.</p>`;
      } else {
        livretAHtml = `<p style="font-size:12px;color:var(--text-dim);margin-top:10px;">${FUNDAMENTALS_UNAVAILABLE_TEXT} (comparaison Livret A : période antérieure à 2010, hors de la couverture réelle disponible).</p>`;
      }
    }

    outputEl.innerHTML = `
      <div class="pattern-chart" style="margin-top:12px;">${chart}</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;font-size:12px;color:var(--text-dim);">
        ${legendItems.join('')}
      </div>
      ${statsHtml}
      ${livretAHtml}
      <div id="labInvestExplainer" style="margin-top:14px;"></div>
      <p class="disclaimer-box" style="margin-top:12px;">Simulation strictement rétrospective sur des cours réels passés. Les performances passées ne préjugent jamais des performances futures. Le Livret A affiché capitalise mensuellement le taux réel en vigueur (simplification par rapport à la règle bancaire des quinzaines).</p>
    `;
    renderResultExplainer('labInvestExplainer', {invested: result.totalInvested, final: result.finalValue, mainFactorLabel: mainFactor});
  }

  async function loadHistory(){
    outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des données réelles…</p>`;
    badgeEl.innerHTML = '';
    try {
      currentHistory = await fetchLabMonthlyHistory(supportEl.value);
      const periods = currentHistory.map(p => p.period);
      populatePeriodSelect(startEl, periods, periods[0]);
      populatePeriodSelect(endEl, periods, periods[periods.length - 1]);
      badgeEl.innerHTML = renderDataBadge('fait');
      const lastPeriod = periods[periods.length - 1];
      // Source citée : le libellé dédié pour les 8 supports curatés, sinon
      // une citation générique Yahoo Finance — jamais un plantage pour une
      // action réelle ajoutée par recherche (LAB_SUPPORT_SERIES_KEY ne
      // couvre que les 8 supports d'origine).
      const seriesKey = LAB_SUPPORT_SERIES_KEY[supportEl.value];
      const sourceLabel = seriesKey ? HISTORICAL_SERIES[seriesKey].source : 'Yahoo Finance';
      partialNoteEl.textContent = formatPartialYearNote(lastPeriod) + ` Source : ${sourceLabel}.`;
      applyQtyIfSet();
      renderOutput();
    } catch(err){
      outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Donnée manquante : historique temporairement indisponible (${err.message}).</p>`;
      console.info('Likanza Academy — Laboratoire, historique investissement indisponible :', err.message);
    }
  }

  supportEl.addEventListener('change', loadHistory);
  [capitalEl, monthlyEl, endEl, compareLivretAEl].forEach(el => el.addEventListener('change', () => { renderOutput(); tryAwardQuizPoints(`lab-invest-${new Date().toDateString()}`, 8, {usedLab:true}); }));
  startEl.addEventListener('change', () => { applyQtyIfSet(); renderOutput(); tryAwardQuizPoints(`lab-invest-${new Date().toDateString()}`, 8, {usedLab:true}); });
  qtyEl.addEventListener('input', () => { applyQtyIfSet(); renderOutput(); });
  if(searchInputEl && searchResultsEl){
    wireStockSearch(searchInputEl, searchResultsEl, (symbol) => {
      populateFollowedGroup();
      supportEl.value = symbol;
      loadHistory();
    });
  }
  loadHistory();
})();

// ---------- P0-2 : DCA historique ----------
(function initLabDca(){
  const supportEl = document.getElementById('labDcaSupport');
  const monthlyEl = document.getElementById('labDcaMonthly');
  const startEl = document.getElementById('labDcaStart');
  const outputEl = document.getElementById('labDcaOutput');
  const badgeEl = document.getElementById('labDcaBadge');
  if(!supportEl || !outputEl) return;

  let currentHistory = null;

  function renderOutput(){
    if(!currentHistory) return;
    const startIdx = currentHistory.findIndex(p => p.period === startEl.value);
    if(startIdx === -1) return;
    const slice = currentHistory.slice(startIdx);
    const result = computeHistoricalInvestment(slice, 0, +monthlyEl.value || 0);
    if(!result){ outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Pas assez de données sur cette période.</p>`; return; }

    const chart = renderMultiLineChart([
      {data: result.investedSeries, color: 'var(--text-dim)', dashed: true, width: 1.5},
      {data: result.valueSeries, color: 'var(--gold-bright)', width: 2.5}
    ]);

    outputEl.innerHTML = `
      <div class="pattern-chart" style="margin-top:12px;">${chart}</div>
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-top:10px;">
        <div class="card"><span class="smallcaps">Total versé</span><div class="result-big" style="font-size:19px;margin-top:6px;">${fmtEUR(result.totalInvested)}</div></div>
        <div class="card"><span class="smallcaps">Valeur finale</span><div class="result-big" style="font-size:19px;margin-top:6px;">${fmtEUR(result.finalValue)}</div></div>
        <div class="card"><span class="smallcaps">Prix moyen d'achat réel</span><div class="result-big" style="font-size:19px;margin-top:6px;">${result.avgPurchasePrice.toFixed(2)} €</div></div>
        <div class="card"><span class="smallcaps">Achats pendant une baisse</span><div class="result-big" style="font-size:19px;margin-top:6px;">${result.buysDuringDip}</div></div>
      </div>
      <p class="disclaimer-box" style="margin-top:12px;">Le DCA (achat régulier) ne garantit pas un meilleur résultat qu'un versement unique — il lisse le prix d'entrée. Voir le comparateur DCA vs investissement immédiat (phase à venir).</p>`;
  }

  async function loadHistory(){
    outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des données réelles…</p>`;
    badgeEl.innerHTML = '';
    try {
      currentHistory = await fetchLabMonthlyHistory(supportEl.value);
      const periods = currentHistory.map(p => p.period);
      populatePeriodSelect(startEl, periods, periods[0]);
      badgeEl.innerHTML = renderDataBadge('fait');
      renderOutput();
    } catch(err){
      outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Donnée manquante : historique temporairement indisponible (${err.message}).</p>`;
      console.info('Likanza Academy — Laboratoire, historique DCA indisponible :', err.message);
    }
  }

  supportEl.addEventListener('change', loadHistory);
  [monthlyEl, startEl].forEach(el => el.addEventListener('change', renderOutput));
  loadHistory();
})();

// ---------- P0-3 : Crédit immobilier complet ----------
(function initLabCredit(){
  const priceEl = document.getElementById('labCreditPrice');
  const apportEl = document.getElementById('labCreditApport');
  const rateEl = document.getElementById('labCreditRate');
  const yearsEl = document.getElementById('labCreditYears');
  const insuranceEl = document.getElementById('labCreditInsurance');
  const fraisEl = document.getElementById('labCreditFrais');
  const outputEl = document.getElementById('labCreditOutput');
  const rateSourceEl = document.getElementById('labCreditRateSource');
  const badgeEl = document.getElementById('labCreditBadge');
  if(!priceEl || !outputEl) return;

  function render(){
    const capital = Math.max(0, (+priceEl.value || 0) - (+apportEl.value || 0));
    const loan = computeLoanAmortization(capital, +rateEl.value || 0, +yearsEl.value || 1, +insuranceEl.value || 0, +fraisEl.value || 0);

    const durations = [15, 20, 25].map(y => ({years: y, r: computeLoanAmortization(capital, +rateEl.value || 0, y, +insuranceEl.value || 0, +fraisEl.value || 0)}));
    const rates = [2, 3, 4, 5].map(r => ({rate: r, r2: computeLoanAmortization(capital, r, +yearsEl.value || 1, +insuranceEl.value || 0, +fraisEl.value || 0)}));

    outputEl.innerHTML = `
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-top:14px;">
        <div class="card"><span class="smallcaps">Mensualité (avec assurance)</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(loan.monthlyPaymentWithInsurance)}</div></div>
        <div class="card"><span class="smallcaps">Total emprunté</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(capital)}</div></div>
        <div class="card"><span class="smallcaps">Intérêts payés</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(loan.totalInterest)}</div></div>
        <div class="card"><span class="smallcaps">Coût total du financement</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(loan.totalCost)}</div></div>
      </div>
      <div style="margin-top:18px;overflow-x:auto;">
        <span class="smallcaps">15 ans vs 20 ans vs 25 ans (même taux)</span>
        <table style="width:100%;font-size:12.5px;border-collapse:collapse;margin-top:8px;min-width:420px;">
          <thead><tr style="color:var(--text-dim);text-align:left;"><th style="padding:6px 0;">Durée</th><th>Mensualité</th><th>Intérêts totaux</th><th>Coût total</th></tr></thead>
          <tbody>${durations.map(d => `<tr style="border-top:1px solid var(--hairline);"><td style="padding:6px 0;">${d.years} ans</td><td class="mono">${fmtEUR(d.r.monthlyPaymentWithInsurance)}</td><td class="mono">${fmtEUR(d.r.totalInterest)}</td><td class="mono">${fmtEUR(d.r.totalCost)}</td></tr>`).join('')}</tbody>
        </table>
        <p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">Une mensualité plus faible ne signifie pas forcément un crédit moins cher : une durée plus longue augmente le total des intérêts payés.</p>
      </div>
      <div style="margin-top:18px;overflow-x:auto;">
        <span class="smallcaps">Impact du taux (même durée) — pourquoi 1 point change autant</span>
        <table style="width:100%;font-size:12.5px;border-collapse:collapse;margin-top:8px;min-width:420px;">
          <thead><tr style="color:var(--text-dim);text-align:left;"><th style="padding:6px 0;">Taux</th><th>Mensualité</th><th>Intérêts totaux</th></tr></thead>
          <tbody>${rates.map(r => `<tr style="border-top:1px solid var(--hairline);"><td style="padding:6px 0;">${r.rate.toFixed(1)} %</td><td class="mono">${fmtEUR(r.r2.monthlyPaymentWithInsurance)}</td><td class="mono">${fmtEUR(r.r2.totalInterest)}</td></tr>`).join('')}</tbody>
        </table>
        <p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">Le taux s'applique chaque année sur tout le capital restant dû, pas seulement au départ : sur 20-25 ans, un écart d'1 point se cumule fortement.</p>
      </div>
      <p class="disclaimer-box" style="margin-top:14px;">Simulation pédagogique, pas une offre de prêt. Le taux réellement proposé dépend du profil emprunteur, de l'apport et de la banque.</p>`;
  }

  async function loadLiveRate(){
    badgeEl.innerHTML = '';
    try {
      const data = await fetchLabMortgageRate();
      const last = data.points[data.points.length - 1];
      rateEl.value = last.value.toFixed(2);
      badgeEl.innerHTML = renderDataBadge('fait');
      rateSourceEl.innerHTML = `Taux prérempli avec le taux moyen réel des nouveaux crédits à l'habitat des ménages en France, ${last.period} (${data.source}). ${formatPartialYearNote(last.period)} Modifie-le librement pour tester une autre hypothèse.`;
    } catch(err){
      badgeEl.innerHTML = renderDataBadge('calcul');
      rateSourceEl.innerHTML = `⚠️ Donnée manquante : taux réel temporairement indisponible, valeur de départ laissée en hypothèse éditable.`;
      console.info('Likanza Academy — Laboratoire, taux crédit indisponible :', err.message);
    }
    render();
  }

  [priceEl, apportEl, rateEl, yearsEl, insuranceEl, fraisEl].forEach(el => el.addEventListener('input', () => {
    render();
    badgeEl.innerHTML = renderDataBadge('calcul');
  }));
  loadLiveRate();
})();

// ---------- P0-4 : Que valent réellement mes euros ? (inflation réelle) ----------
(function initLabInflation(){
  const amountEl = document.getElementById('labInflAmount');
  const startEl = document.getElementById('labInflStart');
  const endEl = document.getElementById('labInflEnd');
  const outputEl = document.getElementById('labInflationOutput');
  const badgeEl = document.getElementById('labInflationBadge');
  if(!amountEl || !outputEl) return;

  let points = null;

  function render(){
    if(!points) return;
    const startPoint = points.find(p => p.period === startEl.value);
    const endPoint = points.find(p => p.period === endEl.value);
    if(!startPoint || !endPoint){ outputEl.innerHTML = `<p style="color:var(--bordeaux);font-size:13px;">Sélectionne deux périodes valides.</p>`; return; }
    const amount = +amountEl.value || 0;
    const equivalent = amount * (endPoint.value / startPoint.value);
    const totalInflationPct = (endPoint.value / startPoint.value - 1) * 100;
    const years = (parseInt(endEl.value.slice(0,4),10)*12 + parseInt(endEl.value.slice(5,7),10)) - (parseInt(startEl.value.slice(0,4),10)*12 + parseInt(startEl.value.slice(5,7),10));
    const annualizedPct = years > 0 ? (Math.pow(endPoint.value / startPoint.value, 12/years) - 1) * 100 : 0;

    const chartSeries = points.filter(p => p.period >= startEl.value && p.period <= endEl.value).map(p => amount * (p.value / startPoint.value));
    const chart = renderMultiLineChart([{data: chartSeries, color: 'var(--gold-bright)', width: 2.5}]);

    outputEl.innerHTML = `
      <div class="pattern-chart" style="margin-top:12px;">${chart}</div>
      <div class="result-label" style="margin-top:10px;">Pouvoir d'achat équivalent</div>
      <div class="result-big">${fmtEUR(amount)} de ${startEl.value} ≈ <strong>${fmtEUR(equivalent)}</strong> en ${endEl.value}</div>
      <div class="result-row" style="margin-top:10px;"><span>Inflation cumulée : ${totalInflationPct >= 0 ? '+' : ''}${totalInflationPct.toFixed(1)} %</span><span>Inflation annualisée : ${annualizedPct >= 0 ? '+' : ''}${annualizedPct.toFixed(1)} % / an</span></div>
      ${renderSourceNote('inflationFR', {period: `${startEl.value} → ${endEl.value}`})}
      <p class="disclaimer-box" style="margin-top:10px;">Calculé à partir de l'indice réel des prix à la consommation (IPCH France, BCE) — jamais une inflation constante supposée.</p>`;
  }

  async function load(){
    outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des données réelles…</p>`;
    badgeEl.innerHTML = '';
    try {
      const data = await fetchLabInflationFR();
      points = data.points;
      const periods = points.map(p => p.period);
      populatePeriodSelect(startEl, periods, periods[0]);
      populatePeriodSelect(endEl, periods, periods[periods.length - 1]);
      badgeEl.innerHTML = renderDataBadge('fait');
      render();

      // Remplace la constante figée (repli honnête, jamais présentée comme
      // un fait) par le vrai taux d'inflation glissant sur 12 mois, calculé
      // sur cette même série réelle qu'on vient de charger — puis ré-exécute
      // les widgets déjà rendus une première fois avec le repli, pour qu'ils
      // reflètent immédiatement la vraie donnée sans action de l'utilisateur.
      const realRate = computeRealInflationRate(points);
      if(typeof realRate === 'number'){
        DEFAULT_INFLATION_ASSUMPTION = Math.round(realRate * 10) / 10;
        if(typeof updateInflation === 'function') updateInflation();
        if(typeof updateSim === 'function') updateSim();
      }
    } catch(err){
      outputEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">⚠️ Donnée manquante : série d'inflation temporairement indisponible (${err.message}).</p>`;
      console.info('Likanza Academy — Laboratoire, inflation indisponible :', err.message);
    }
  }

  [amountEl, startEl, endEl].forEach(el => el.addEventListener('change', render));
  load();
})();

// ---------- Dettes & crédits : listes dynamiques de crédits réutilisables
// entre les deux widgets (stratégie de remboursement / regroupement) — même
// pattern que addDcaRow/updateDca (prix moyen d'achat) ci-dessus, avec un
// bouton de suppression par ligne. Les calculs eux-mêmes (computeDebtPayoffPlan,
// renderDebtPayoffComparison, computeDebtConsolidation,
// renderDebtConsolidationComparison) vivent dans scripts/data.js. ----------
(function initLabDebts(){
  function createDebtRowList(containerId, onChange){
    function addRow(label, balance, rate, minPayment){
      const row = document.createElement('div');
      row.className = 'field';
      row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px;';
      row.innerHTML = `
        <input type="text" class="debt-label" placeholder="Nom du crédit" value="${label || ''}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:2;min-width:120px;">
        <input type="number" class="debt-balance" placeholder="Solde (€)" value="${typeof balance === 'number' ? balance : 1000}" min="0" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:1;min-width:90px;">
        <input type="number" class="debt-rate" placeholder="Taux (%)" value="${typeof rate === 'number' ? rate : 5}" min="0" max="30" step="0.1" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:1;min-width:80px;">
        <input type="number" class="debt-min" placeholder="Mensualité min. (€)" value="${typeof minPayment === 'number' ? minPayment : 100}" min="0" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:1;min-width:90px;">
        <button type="button" class="btn btn-sm debt-remove" style="flex:0;" aria-label="Retirer ce crédit">✕</button>`;
      document.getElementById(containerId).appendChild(row);
      row.querySelectorAll('input').forEach(i => i.addEventListener('input', onChange));
      row.querySelectorAll('.debt-remove').forEach(btn => btn.addEventListener('click', () => { row.remove(); onChange(); }));
    }
    function readRows(){
      return Array.from(document.querySelectorAll(`#${containerId} > div`)).map(row => ({
        label: row.querySelector('.debt-label').value || 'Crédit',
        balance: +row.querySelector('.debt-balance').value || 0,
        rate: +row.querySelector('.debt-rate').value || 0,
        minPayment: +row.querySelector('.debt-min').value || 0
      }));
    }
    return {addRow, readRows};
  }

  const strategyRowsEl = document.getElementById('debtRows');
  const consoRowsEl = document.getElementById('debtConsoRows');
  if(!strategyRowsEl || !consoRowsEl) return;

  const strategyRows = createDebtRowList('debtRows', () => updateDebtStrategy());
  function updateDebtStrategy(){
    const extra = +document.getElementById('debtExtra').value || 0;
    document.getElementById('debtStrategyOutput').innerHTML = renderDebtPayoffComparison(strategyRows.readRows(), extra);
  }
  document.getElementById('debtAdd').addEventListener('click', () => { strategyRows.addRow(); updateDebtStrategy(); });
  document.getElementById('debtExtra').addEventListener('input', updateDebtStrategy);
  strategyRows.addRow('Carte de crédit', 2000, 19, 80);
  strategyRows.addRow('Prêt personnel', 6000, 5, 150);
  updateDebtStrategy();

  const consoRows = createDebtRowList('debtConsoRows', () => updateDebtConsolidation());
  function updateDebtConsolidation(){
    const newLoan = {
      amount: +document.getElementById('consoAmount').value || 0,
      rate: +document.getElementById('consoRate').value || 0,
      years: +document.getElementById('consoYears').value || 0,
      fees: +document.getElementById('consoFrais').value || 0
    };
    document.getElementById('debtConsolidationOutput').innerHTML = renderDebtConsolidationComparison(consoRows.readRows(), newLoan);
  }
  document.getElementById('debtConsoAdd').addEventListener('click', () => { consoRows.addRow(); updateDebtConsolidation(); });
  ['consoAmount', 'consoRate', 'consoYears', 'consoFrais'].forEach(id => document.getElementById(id).addEventListener('input', updateDebtConsolidation));
  consoRows.addRow('Carte de crédit', 2000, 19, 80);
  consoRows.addRow('Prêt personnel', 6000, 5, 150);
  updateDebtConsolidation();
})();

// ---------- Transport : coût total de possession + comparaison de
// financement. La logique de calcul (computeVehicleTCO, renderVehicleTCOResult,
// computeVehicleFinancingComparison, renderVehicleFinancingComparison) vit
// dans scripts/data.js — même formulaire pour un véhicule essence, hybride ou
// électrique, seule la consommation/le prix de l'énergie changent. ----------
(function initLabTransport(){
  const tcoOutputEl = document.getElementById('tcoOutput');
  if(!tcoOutputEl) return;

  const tcoFinancingEl = document.getElementById('tcoFinancing');
  const tcoCreditFieldsEl = document.getElementById('tcoCreditFields');
  function updateTCO(){
    const financing = tcoFinancingEl.value;
    tcoCreditFieldsEl.style.display = financing === 'credit' ? '' : 'none';
    const result = computeVehicleTCO({
      price: +document.getElementById('tcoPrice').value || 0,
      financing,
      downPayment: +document.getElementById('tcoDownPayment').value || 0,
      creditRate: +document.getElementById('tcoCreditRate').value || 0,
      possessionYears: +document.getElementById('tcoYears').value || 0,
      consumptionPer100: +document.getElementById('tcoConsumption').value || 0,
      fuelPricePerUnit: +document.getElementById('tcoFuelPrice').value || 0,
      kmPerYear: +document.getElementById('tcoKm').value || 0,
      insuranceAnnual: +document.getElementById('tcoInsurance').value || 0,
      maintenanceAnnual: +document.getElementById('tcoMaintenance').value || 0,
      depreciationRatePct: +document.getElementById('tcoDepreciation').value || 0
    });
    tcoOutputEl.innerHTML = renderVehicleTCOResult(result);
  }
  ['tcoPrice','tcoFinancing','tcoYears','tcoDownPayment','tcoCreditRate','tcoConsumption','tcoFuelPrice','tcoKm','tcoInsurance','tcoMaintenance','tcoDepreciation'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateTCO);
  });
  updateTCO();

  const finOutputEl = document.getElementById('finOutput');
  function updateFinancing(){
    const loaOptionVal = document.getElementById('finLoaOption').value;
    const creditRateVal = document.getElementById('finCreditRate').value;
    const loaMonthlyVal = document.getElementById('finLoaMonthly').value;
    const lldMonthlyVal = document.getElementById('finLldMonthly').value;
    const result = computeVehicleFinancingComparison({
      price: +document.getElementById('finPrice').value || 0,
      years: +document.getElementById('finYears').value || 0,
      cashOpportunityRatePct: +document.getElementById('finOpportunity').value || 0,
      creditRate: creditRateVal ? +creditRateVal : null,
      loaMonthly: loaMonthlyVal ? +loaMonthlyVal : null,
      loaFinalOption: loaOptionVal ? +loaOptionVal : null,
      lldMonthly: lldMonthlyVal ? +lldMonthlyVal : null
    });
    finOutputEl.innerHTML = renderVehicleFinancingComparison(result);
  }
  ['finPrice','finYears','finOpportunity','finCreditRate','finLoaMonthly','finLoaOption','finLldMonthly'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateFinancing);
  });
  updateFinancing();
})();

// ---------- P0-5 : Acheter ou louer, version sérieuse ----------
(function initLabBuyRent(){
  const ids = ['labBrPrice','labBrApport','labBrRate','labBrYears','labBrInsurance','labBrFraisDossier','labBrFraisGarantie','labBrFraisNotaire','labBrCharges','labBrTaxe','labBrEntretien','labBrTravaux','labBrLoyer','labBrChargesLoc','labBrLoyerHausse','labBrOpportunity'];
  const els = {};
  ids.forEach(id => { els[id] = document.getElementById(id); });
  const scenarioEl = document.getElementById('labBrScenario');
  const outputEl = document.getElementById('labBuyRentOutput');
  const badgeEl = document.getElementById('labBuyRentBadge');
  const priceSourceEl = document.getElementById('labBuyRentPriceSource');
  if(!els.labBrPrice || !outputEl) return;

  let appreciationAnnualPct = null; // rempli par la vraie série RESR si disponible

  function currentInputs(){
    const scenario = scenarioEl.value;
    let rateAdj = 0, appreciationOverride = null, travauxOverride = null;
    if(scenario === 'choc-taux') rateAdj = 1;
    if(scenario === 'prix-10') appreciationOverride = -10 / Math.max(1, +els.labBrYears.value || 1);
    if(scenario === 'travaux') travauxOverride = (+els.labBrTravaux.value || 0) + 8000;
    return {
      price: +els.labBrPrice.value || 0,
      downPayment: +els.labBrApport.value || 0,
      rateAnnual: (+els.labBrRate.value || 0) + rateAdj,
      years: +els.labBrYears.value || 1,
      insuranceRatePct: +els.labBrInsurance.value || 0,
      fraisDossier: +els.labBrFraisDossier.value || 0,
      fraisGarantie: +els.labBrFraisGarantie.value || 0,
      fraisNotairePct: +els.labBrFraisNotaire.value || 0,
      chargesCoproAnnual: +els.labBrCharges.value || 0,
      taxeFonciereAnnual: +els.labBrTaxe.value || 0,
      entretienAnnualPct: +els.labBrEntretien.value || 0,
      travauxOneOff: travauxOverride !== null ? travauxOverride : (+els.labBrTravaux.value || 0),
      loyerMensuelInitial: +els.labBrLoyer.value || 0,
      chargesLocatairesMensuel: +els.labBrChargesLoc.value || 0,
      loyerHausseAnnuelPct: +els.labBrLoyerHausse.value || 0,
      appreciationAnnualPct: appreciationOverride !== null ? appreciationOverride : (appreciationAnnualPct !== null ? appreciationAnnualPct : 0),
      opportunityRatePct: +els.labBrOpportunity.value || 0,
      horizonsYears: [5, 10, 15, 20, 25].filter(h => h <= (+els.labBrYears.value || 25))
    };
  }

  function render(){
    const inputs = currentInputs();
    if(inputs.horizonsYears.length === 0) inputs.horizonsYears = [Math.max(1, inputs.years)];
    const result = computeBuyVsRent(inputs);

    const chart = renderMultiLineChart([
      {data: result.yearly.map(y => y.ownerNetWorth), color: 'var(--gold-bright)', width: 2.5},
      {data: result.yearly.map(y => y.renterNetWorth), color: 'var(--text-dim)', dashed: true, width: 1.5}
    ]);

    const scenarioBadge = scenarioEl.value === 'standard' ? '' : `<span class="data-badge data-badge-scenario">🔮 Scénario : ${scenarioEl.options[scenarioEl.selectedIndex].text}</span>`;

    outputEl.innerHTML = `
      <div class="pattern-chart" style="margin-top:12px;">${chart}</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;font-size:12px;color:var(--text-dim);">
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--gold-bright);border-radius:50%;margin-right:6px;"></span>Patrimoine net propriétaire</span>
        <span><span style="display:inline-block;width:10px;height:2px;background:var(--text-dim);margin-right:6px;vertical-align:middle;"></span>Patrimoine net locataire (apport + différence investis)</span>
      </div>
      ${scenarioBadge}
      <div style="margin-top:12px;overflow-x:auto;">
        <table style="width:100%;font-size:12.5px;border-collapse:collapse;min-width:420px;">
          <thead><tr style="color:var(--text-dim);text-align:left;"><th style="padding:6px 0;">Horizon</th><th>Propriétaire</th><th>Locataire + investisseur</th><th>Écart</th></tr></thead>
          <tbody>${result.table.map(y => `<tr style="border-top:1px solid var(--hairline);"><td style="padding:6px 0;">${y.year} ans</td><td class="mono">${fmtEUR(y.ownerNetWorth)}</td><td class="mono">${fmtEUR(y.renterNetWorth)}</td><td class="mono" style="color:${y.ownerNetWorth>=y.renterNetWorth?'var(--emerald)':'var(--bordeaux)'};">${y.ownerNetWorth>=y.renterNetWorth?'+':''}${fmtEUR(y.ownerNetWorth-y.renterNetWorth)}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <p style="margin-top:12px;font-size:13.5px;">${result.breakevenYear ? `Dans ces hypothèses, le patrimoine net du propriétaire dépasse celui du locataire à partir d'environ <strong>${result.breakevenYear} ans</strong>.` : `Dans ces hypothèses, le patrimoine net du locataire reste supérieur sur toute la période testée.`}</p>
      <p class="disclaimer-box" style="margin-top:8px;">Ceci n'est pas une recommandation d'achat ou de location. Le résultat dépend entièrement des hypothèses saisies ci-dessus (taux, appréciation, rendement d'opportunité) : en modifier une peut changer la conclusion.</p>`;
  }

  async function loadAppreciation(){
    badgeEl.innerHTML = '';
    let priceNote, priceOk = false;
    try {
      const data = await fetch('/api/eco-rate?series=home-price-fr').then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      const first = data.points[0], last = data.points[data.points.length - 1];
      const yearsSpan = (parseInt(last.period.slice(0,4),10) - parseInt(first.period.slice(0,4),10)) + (parseInt(last.period.slice(6),10) - parseInt(first.period.slice(6),10)) / 4;
      appreciationAnnualPct = yearsSpan > 0 ? (Math.pow(last.value / first.value, 1 / yearsSpan) - 1) * 100 : 0;
      priceNote = `Appréciation immobilière préremplie avec l'évolution réelle observée (${first.period} → ${last.period}, France entière) : ${appreciationAnnualPct >= 0 ? '+' : ''}${appreciationAnnualPct.toFixed(1)} %/an en moyenne. ${data.source}. Niveau géographique : France entière (pas de donnée locale/ville disponible pour l'instant).`;
      priceOk = true;
    } catch(err){
      appreciationAnnualPct = 0;
      priceNote = `⚠️ Donnée manquante : indice immobilier réel temporairement indisponible, appréciation laissée à 0% (hypothèse neutre, modifiable).`;
      console.info('Likanza Academy — Laboratoire, indice immobilier indisponible :', err.message);
    }

    // Même vrai taux crédit que la carte "Combien coûte réellement mon
    // crédit ?" juste au-dessus (fetchLabMortgageRate, mise en cache
    // partagée) — auparavant laissé sur un défaut statique (3.2) jamais
    // rafraîchi, incohérent avec la carte voisine.
    let rateNote, rateOk = false;
    try {
      const data = await fetchLabMortgageRate();
      const last = data.points[data.points.length - 1];
      els.labBrRate.value = last.value.toFixed(2);
      rateNote = `Taux crédit préempli avec le taux moyen réel des nouveaux crédits à l'habitat des ménages en France, ${last.period} (${data.source}).`;
      rateOk = true;
    } catch(err){
      rateNote = `⚠️ Taux crédit réel temporairement indisponible, valeur de départ laissée en hypothèse éditable.`;
      console.info('Likanza Academy — Laboratoire, taux crédit (Acheter ou louer) indisponible :', err.message);
    }

    // "Fait" seulement si les DEUX données réelles ont bien été chargées —
    // sinon "calcul" (au moins une hypothèse de repli reste dans le calcul),
    // jamais un badge qui prétendrait tout être réel alors que ce n'est
    // qu'en partie le cas.
    badgeEl.innerHTML = renderDataBadge(priceOk && rateOk ? 'fait' : 'calcul');
    priceSourceEl.innerHTML = `${priceNote} ${rateNote} Modifie librement l'un ou l'autre pour tester une autre hypothèse.`;
    render();
  }

  ids.forEach(id => els[id].addEventListener('input', render));
  scenarioEl.addEventListener('change', render);
  loadAppreciation();
})();

// ---------- Widgets existants (portés depuis l'ancien outils.html, logique inchangée) ----------

// Budget
['budgetRevenu','budgetLoyer','budgetFixe','budgetVariable'].forEach(id=>document.getElementById(id).addEventListener('input', updateBudget));
function updateBudget(){
  const revenu = +document.getElementById('budgetRevenu').value;
  const total = ['budgetLoyer','budgetFixe','budgetVariable'].reduce((s,id)=>s+ +document.getElementById(id).value, 0);
  const solde = revenu - total;
  const el = document.getElementById('budgetResult');
  el.textContent = fmtEUR(solde);
  el.style.color = solde >= 0 ? 'var(--emerald)' : 'var(--bordeaux)';
}
updateBudget();

// Objectif épargne
['goalAmount','goalMonthly'].forEach(id=>document.getElementById(id).addEventListener('input', updateGoal));
function updateGoal(){
  const amount = +document.getElementById('goalAmount').value;
  const monthly = +document.getElementById('goalMonthly').value;
  const el = document.getElementById('goalResult');
  if(monthly <= 0){ el.textContent = '—'; return; }
  const months = Math.ceil(amount/monthly);
  const years = Math.floor(months/12), rem = months%12;
  el.textContent = years > 0 ? `${years} an(s) et ${rem} mois` : `${months} mois`;
}
updateGoal();

// Coût futur d'un abonnement
const subCost = document.getElementById('subCost'), subYears = document.getElementById('subYears'), subRate = document.getElementById('subRate');
// Même seuil que le scénario "Optimiste" des intérêts composés (RETURN_ASSUMPTIONS,
// scripts/data.js) : au-delà, ce n'est plus une hypothèse par défaut raisonnable
// mais un scénario favorable qu'il ne faut jamais présenter comme acquis.
function updateSubAlert(){
  const alertEl = document.getElementById('subRateAlert');
  const rate = +subRate.value;
  alertEl.innerHTML = rate > RETURN_ASSUMPTIONS.optimiste.rate
    ? `<p class="disclaimer-box" style="margin-top:8px;">${rate}% par an suppose un rendement proche des meilleures décennies boursières historiques (voir le simulateur d'intérêts composés) — un placement réel n'offre jamais ce rendement de façon garantie chaque année, contrairement à l'argent économisé en annulant l'abonnement.</p>`
    : '';
}
function updateSub(){
  document.getElementById('valSubYears').textContent = subYears.value + ' ans';
  document.getElementById('valSubRate').textContent = subRate.value + ' %';
  const totalPaid = subCost.value * 12 * subYears.value;
  const series = compoundSeries(0, +subCost.value, +subRate.value, +subYears.value);
  const invested = series[series.length-1];
  document.getElementById('subResult').innerHTML = `<span>Total payé : ${fmtEUR(totalPaid)}</span><span>Si investi à la place : <strong style="color:var(--emerald)">${fmtEUR(invested)}</strong></span>`;
  updateSubAlert();
}
[subCost, subYears, subRate].forEach(el=>el.addEventListener('input', updateSub));
updateSub();

// Scénarios futurs d'inflation (hypothèses, panneau secondaire de la carte inflation réelle)
const inflAmount = document.getElementById('inflAmount'), inflReturn = document.getElementById('inflReturn'), inflRate = document.getElementById('inflRate'), inflYears = document.getElementById('inflYears');
// Deux hypothèses distinctes peuvent devenir irréalistes ici : un rendement
// d'épargne trop optimiste (même seuil que RETURN_ASSUMPTIONS.optimiste,
// scripts/data.js) et une inflation annuelle soutenue rare historiquement hors
// période de crise (au-delà de 5%, à comparer à l'inflation réelle IPCH France
// affichée juste au-dessus, autour de DEFAULT_INFLATION_ASSUMPTION).
const UNREALISTIC_SUSTAINED_INFLATION = 5;
function updateInflationAlert(ret, inflation){
  const alertEl = document.getElementById('inflAssumptionAlert');
  const msgs = [];
  if(ret > RETURN_ASSUMPTIONS.optimiste.rate) msgs.push(`un rendement d'épargne de ${ret}%/an proche des meilleures décennies boursières historiques`);
  if(inflation > UNREALISTIC_SUSTAINED_INFLATION) msgs.push(`une inflation de ${inflation}%/an maintenue sur toute la période, rare historiquement hors épisode de crise (l'inflation réelle mesurée ci-dessus tourne plutôt autour de ${DEFAULT_INFLATION_ASSUMPTION}%)`);
  alertEl.innerHTML = msgs.length
    ? `<p class="disclaimer-box" style="margin-top:8px;">Hypothèse à prendre avec précaution : ${msgs.join(' et ')}.</p>`
    : '';
}
function updateInflation(){
  document.getElementById('valInflReturn').textContent = inflReturn.value + ' %';
  document.getElementById('valInflRate').textContent = inflRate.value + ' %';
  document.getElementById('valInflYears').textContent = inflYears.value + ' ans';
  const amount = +inflAmount.value, ret = +inflReturn.value/100, inflation = +inflRate.value/100, years = +inflYears.value;
  const nominal = amount * Math.pow(1+ret, years);
  const real = nominal / Math.pow(1+inflation, years);
  const diff = real - amount;
  document.getElementById('inflResult').innerHTML = `
    <span>Valeur affichée dans ${years} ans : <strong>${fmtEUR(nominal)}</strong></span>
    <span>Pouvoir d'achat réel : <strong style="color:${diff>=0?'var(--emerald)':'var(--bordeaux)'}">${fmtEUR(real)}</strong></span>`;
  const nominalSeries = [], realSeries = [];
  for(let y=0;y<=years;y++){
    nominalSeries.push(amount*Math.pow(1+ret,y));
    realSeries.push(amount*Math.pow(1+ret,y)/Math.pow(1+inflation,y));
  }
  renderBarChart('inflChart','inflChartLabels', realSeries, years);
  updateInflationAlert(+inflReturn.value, +inflRate.value);
}
[inflAmount, inflReturn, inflRate, inflYears].forEach(el=>el.addEventListener('input', updateInflation));
updateInflation();

// Intérêts composés — scénarios prudent/central/optimiste/historique/personnalisé
const capitalEl = document.getElementById('capital'), monthlyEl = document.getElementById('monthly'), rateEl = document.getElementById('rate'), yearsEl = document.getElementById('years');
const simFraisEl = document.getElementById('simFrais'), simShowRealEl = document.getElementById('simShowReal');
let simMode = 'central';
let historicalRateInfo = null; // rempli uniquement par une vraie donnée Yahoo Finance, jamais inventé
// Clés (prudent/central/optimiste) réellement enrichies avec un vrai CAGR —
// par clé, pas un seul booléen global : un échec réseau isolé sur UN
// scénario ne doit jamais faire croire que les 3 sont devenus des faits.
let returnAssumptionsEnrichedKeys = new Set();

async function fetchHistoricalReturn(){
  const resp = await fetch('/api/custom-quotes?symbols=URTH&range=5y');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !q.history || q.history.length < 2) throw new Error('Historique indisponible');
  const first = q.history[0], last = q.history[q.history.length - 1];
  const years = (new Date(last.date) - new Date(first.date)) / (365.25 * 24 * 3600 * 1000);
  if(years <= 0) throw new Error('Période invalide');
  const rate = (Math.pow(last.close / first.close, 1 / years) - 1) * 100;
  return {
    rate,
    source: 'Yahoo Finance — iShares MSCI World ETF (URTH)',
    startLabel: new Date(first.date).toLocaleDateString('fr-FR'),
    endLabel: new Date(last.date).toLocaleDateString('fr-FR')
  };
}

function currentGrossRate(){
  if(simMode === 'personnalise') return +rateEl.value;
  if(simMode === 'historique') return historicalRateInfo ? historicalRateInfo.rate : RETURN_ASSUMPTIONS.central.rate;
  return RETURN_ASSUMPTIONS[simMode].rate;
}

function updateModeDesc(){
  const descEl = document.getElementById('simModeDesc');
  const badgeEl = document.getElementById('simModeBadge');
  if(simMode === 'personnalise'){
    descEl.textContent = "Choisis librement un rendement — une hypothèse trop élevée est signalée ci-dessous.";
    if(badgeEl) badgeEl.innerHTML = '';
  } else if(simMode === 'historique'){
    descEl.textContent = historicalRateInfo
      ? `Rendement annualisé réel constaté : ${historicalRateInfo.rate.toFixed(1)} %. Source : ${historicalRateInfo.source}, du ${historicalRateInfo.startLabel} au ${historicalRateInfo.endLabel}.`
      : "Chargement de la donnée historique réelle…";
    if(badgeEl) badgeEl.innerHTML = historicalRateInfo ? renderDataBadge('fait') : '';
  } else {
    descEl.textContent = RETURN_ASSUMPTIONS[simMode].desc;
    // Tant que enrichReturnAssumptionsFromRealHistory() n'a pas résolu, ces 3
    // scénarios restent des repères pédagogiques (🔮), pas un fait — une fois
    // enrichis avec le vrai CAGR sourcé, ils deviennent 📊 Fait comme le mode
    // Historique, jamais avant.
    if(badgeEl) badgeEl.innerHTML = returnAssumptionsEnrichedKeys.has(simMode) ? renderDataBadge('fait') : renderDataBadge('scenario');
  }
}

function updateRateAlert(){
  const alertEl = document.getElementById('simRateAlert');
  const rate = +rateEl.value, years = +yearsEl.value;
  if(simMode === 'personnalise' && rate > 12){
    alertEl.innerHTML = `<p class="disclaimer-box" style="margin-top:6px;">${rate}% par an sur ${years} ans est une hypothèse extrêmement ambitieuse et ne doit pas être considérée comme un rendement normal attendu.</p>`;
  } else {
    alertEl.innerHTML = '';
  }
}

function updateRealValue(total, years){
  const el = document.getElementById('simRealValue');
  if(!simShowRealEl.checked){ el.innerHTML = ''; return; }
  const real = total / Math.pow(1 + DEFAULT_INFLATION_ASSUMPTION/100, years);
  el.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">En pouvoir d'achat d'aujourd'hui (hypothèse d'inflation ${DEFAULT_INFLATION_ASSUMPTION}%/an) : <strong style="color:var(--text);">${fmtEUR(real)}</strong></p>`;
}

async function selectMode(mode){
  simMode = mode;
  document.querySelectorAll('#simModeToggle .pill').forEach(p=>p.classList.toggle('active', p.dataset.mode === mode));
  rateEl.disabled = mode !== 'personnalise';
  if(mode === 'historique' && !historicalRateInfo){
    updateModeDesc();
    try { historicalRateInfo = await fetchHistoricalReturn(); }
    catch(err){
      document.getElementById('simModeDesc').textContent = "Donnée historique temporairement indisponible. Choisis un autre scénario.";
      console.info('Likanza Academy — rendement historique indisponible :', err.message);
      return;
    }
  }
  updateModeDesc();
  updateSim();
}
document.querySelectorAll('#simModeToggle .pill').forEach(btn=>{
  btn.addEventListener('click', ()=>selectMode(btn.dataset.mode));
});

function updateSim(){
  const P=+capitalEl.value, PMT=+monthlyEl.value, years=+yearsEl.value;
  const grossRate = currentGrossRate();
  if(simMode !== 'personnalise') rateEl.value = grossRate;
  const frais = +simFraisEl.value || 0;
  // Jamais plafonné à 0 : depuis que "Prudente" peut refléter un vrai CAGR
  // obligataire (AGG, cours seuls) et être légèrement négatif sur certaines
  // périodes réelles (ex. remontée des taux 2022-2023), un plancher artificiel
  // ferait afficher "-0,2 %" tout en calculant en réalité sur 0% — un écart
  // entre ce qui est affiché et ce qui est réellement compté, jamais acceptable.
  const netRate = grossRate - frais;
  document.getElementById('valCapital').textContent = fmtEUR(P);
  document.getElementById('valMonthly').textContent = fmtEUR(PMT);
  document.getElementById('valRate').textContent = grossRate.toFixed(1) + ' %' + (frais > 0 ? ` (net de frais : ${netRate.toFixed(1)} %)` : '');
  document.getElementById('valYears').textContent = years + ' ans';
  const series = compoundSeries(P, PMT, netRate, years);
  const total = series[series.length-1];
  const invested = P + PMT*years*12;
  document.getElementById('simTotal').textContent = fmtEUR(total);
  document.getElementById('simInvested').textContent = fmtEUR(invested);
  document.getElementById('simGains').textContent = fmtEUR(total-invested);
  renderBarChart('simChart','simChartLabels', series, years);
  updateRateAlert();
  updateRealValue(total, years);
}
[capitalEl, monthlyEl, yearsEl, simFraisEl].forEach(el=>el.addEventListener('input', ()=>{
  updateSim();
  tryAwardQuizPoints(`lab-sim-${new Date().toDateString()}`, 5, {usedSimulator:true});
}));
rateEl.addEventListener('input', ()=>{
  if(simMode !== 'personnalise') return;
  updateSim();
  tryAwardQuizPoints(`lab-sim-${new Date().toDateString()}`, 5, {usedSimulator:true});
});
simShowRealEl.addEventListener('change', updateSim);
rateEl.disabled = true;
updateModeDesc();
updateSim();

// Remplace les 3 ronds chiffres de repli (Prudente/Centrale/Optimiste) par
// un vrai CAGR sourcé dès qu'il est disponible, sans action de l'utilisateur
// — voir enrichReturnAssumptionsFromRealHistory (scripts/data.js).
enrichReturnAssumptionsFromRealHistory().then((updatedKeys) => {
  returnAssumptionsEnrichedKeys = new Set(updatedKeys);
  if(simMode !== 'historique' && simMode !== 'personnalise'){
    updateModeDesc();
    updateSim();
  }
});

renderWhatIf('simWhatIf', [
  {label:"Et si tu commençais 10 ans plus tôt ?", change:{years: +yearsEl.value + 10}},
  {label:"Et si tu doublais ton versement mensuel ?", change:{monthly: +monthlyEl.value * 2}},
  {label:"Et si le rendement était 2 points plus haut ?", change:{rate: currentGrossRate() + 2}}
], (change)=>{
  const P = change.capital ?? +capitalEl.value;
  const PMT = change.monthly ?? +monthlyEl.value;
  // Même correction qu'updateSim() : jamais de plancher artificiel à 0, pour
  // rester cohérent avec un vrai CAGR qui peut être légèrement négatif.
  const rate = (change.rate ?? currentGrossRate()) - (+simFraisEl.value || 0);
  const years = change.years ?? +yearsEl.value;
  const series = compoundSeries(P, PMT, rate, years);
  return series[series.length-1];
}, fmtEUR);

// DCA — prix moyen d'achat
let dcaCount = 0;
function markDcaUsed(){ tryAwardQuizPoints(`lab-dca-${new Date().toDateString()}`, 5, {usedDCA:true}); }
function addDcaRow(qty=10, price=100){
  dcaCount++;
  const row = document.createElement('div');
  row.className = 'field';
  row.style.display = 'flex';
  row.style.gap = '10px';
  row.innerHTML = `
    <input type="number" class="dca-qty" placeholder="Quantité" value="${qty}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;width:45%;">
    <input type="number" class="dca-price" placeholder="Prix unitaire (€)" value="${price}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;width:45%;">
  `;
  document.getElementById('dcaRows').appendChild(row);
  row.querySelectorAll('input').forEach(i=>i.addEventListener('input', ()=>{ updateDca(); markDcaUsed(); }));
}
document.getElementById('dcaAdd').addEventListener('click', ()=>{ addDcaRow(); markDcaUsed(); });
function updateDca(){
  const qtys = Array.from(document.querySelectorAll('.dca-qty')).map(i=>+i.value||0);
  const prices = Array.from(document.querySelectorAll('.dca-price')).map(i=>+i.value||0);
  let totalQty = 0, totalCost = 0;
  qtys.forEach((q,i)=>{ totalQty += q; totalCost += q*prices[i]; });
  const avg = totalQty > 0 ? totalCost/totalQty : 0;
  document.getElementById('dcaResult').innerHTML = `<span>Quantité totale : ${totalQty}</span><span>Coût total : ${fmtEUR(totalCost)}</span><span>Prix moyen d'achat : <strong style="color:var(--gold-bright)">${avg.toFixed(2)} €</strong></span>`;
}
addDcaRow(10, 95); addDcaRow(5, 110);
updateDca();

// ---------- Risque quantitatif (VaR, section 15 du prompt "Extension des
// domaines" : mathématiques financières avancées / finance quantitative) :
// computeParametricVaR (scripts/data.js) à partir d'hypothèses saisies par
// l'utilisateur — jamais une prédiction, toujours le résultat mécanique de ce
// qui est saisi, sous une hypothèse de loi normale explicitement rappelée. ----------
function markVarUsed(){ tryAwardQuizPoints(`lab-var-${new Date().toDateString()}`, 8, {usedVaR:true}); }
function updateVar(){
  const portefeuille = +document.getElementById('varPortefeuille').value || 0;
  const rendement = +document.getElementById('varRendement').value || 0;
  const volatilite = +document.getElementById('varVolatilite').value || 0;
  const confiance = +document.getElementById('varConfiance').value || 95;
  const horizon = +document.getElementById('varHorizon').value || 1;
  document.getElementById('valVarHorizon').textContent = horizon + (horizon > 1 ? ' jours' : ' jour');

  const resultEl = document.getElementById('varResult');
  const r = computeParametricVaR(portefeuille, rendement, volatilite, confiance, horizon);
  if(!r){
    resultEl.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Hypothèses invalides : la valeur du portefeuille doit être positive et la volatilité ne peut pas être négative.</p>`;
    return;
  }
  resultEl.innerHTML = `
    ${renderDataBadge('calcul')}
    <div class="result-row" style="margin-top:10px;">
      <span>Perte potentielle estimée (VaR)</span><span class="mono" style="color:var(--bordeaux);font-size:18px;">${fmtEUR(r.perteEnMontant)}</span>
    </div>
    <div class="result-row">
      <span>Soit, en % du portefeuille</span><span class="mono">${(r.perteEnPct * 100).toFixed(2)} %</span>
    </div>
    <p style="font-size:13px;margin-top:14px;color:var(--text-dim);">Avec ${confiance}% de confiance, la perte sur ${horizon} jour${horizon>1?'s':''} ne devrait pas dépasser <strong style="color:var(--text);">${fmtEUR(r.perteEnMontant)}</strong> — et donc ${100-confiance}% de chances (selon ce modèle) qu'elle soit plus élevée, potentiellement bien plus élevée : la VaR ne dit rien sur l'ampleur d'une perte au-delà de ce seuil.</p>
    <p class="disclaimer-box" style="margin-top:10px;">Ce calcul suppose que les rendements suivent approximativement une loi normale — une simplification aux limites connues : les marchés réels connaissent des mouvements extrêmes plus fréquents que ce qu'une loi normale prédirait. Cette VaR peut donc sous-estimer le risque des pertes les plus sévères.</p>`;
}
['varPortefeuille','varRendement','varVolatilite','varConfiance','varHorizon'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { updateVar(); markVarUsed(); });
});
updateVar();

// ---------- Calculateur obligataire (prix / YTM) — computeBondPrice/
// computeBondYTM (scripts/data.js). Deux modes exclusifs plutôt que les deux
// résultats affichés en même temps : un utilisateur connaît soit le taux du
// marché (et veut le prix), soit un prix observé (et veut le rendement
// implicite) — jamais les deux à la fois, ce qui rendrait le formulaire
// ambigu sur ce qui est saisi vs calculé. ----------
let bondMode = 'price';
function markBondUsed(){ tryAwardQuizPoints(`lab-bond-${new Date().toDateString()}`, 8, {usedBondCalc:true}); }
function setBondMode(mode){
  bondMode = mode;
  document.querySelectorAll('#bondModeToggle .pill').forEach(p => p.classList.toggle('active', p.dataset.mode === mode));
  document.getElementById('bondRateField').style.display = mode === 'price' ? '' : 'none';
  document.getElementById('bondPriceField').style.display = mode === 'ytm' ? '' : 'none';
  updateBond();
}
document.querySelectorAll('#bondModeToggle .pill').forEach(p => {
  p.addEventListener('click', () => { setBondMode(p.dataset.mode); markBondUsed(); });
});
function updateBond(){
  const face = +document.getElementById('bondFace').value || 0;
  const coupon = +document.getElementById('bondCoupon').value;
  const years = +document.getElementById('bondYears').value || 0;
  const freq = +document.getElementById('bondFreq').value || 1;
  const resultEl = document.getElementById('bondResult');
  if(bondMode === 'price'){
    const rate = +document.getElementById('bondRate').value;
    const price = computeBondPrice(face, coupon, years, rate, freq);
    if(price == null){
      resultEl.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Hypothèses invalides : la valeur nominale et la maturité doivent être positives.</p>`;
      return;
    }
    const ecart = price - face;
    const statut = ecart > 0.5 ? 'en prime (au-dessus du pair)' : (ecart < -0.5 ? 'en décote (en dessous du pair)' : 'au pair (proche de sa valeur nominale)');
    const comparaison = coupon > rate ? 'supérieur' : (coupon < rate ? 'inférieur' : 'égal');
    resultEl.innerHTML = `
      ${renderDataBadge('calcul')}
      <div class="result-row" style="margin-top:10px;"><span>Prix théorique de l'obligation</span><span class="mono" style="font-size:18px;color:var(--gold-bright);">${fmtEUR(price)}</span></div>
      <p style="font-size:13px;margin-top:10px;color:var(--text-dim);">L'obligation se négocie <strong style="color:var(--text);">${statut}</strong>, car son taux de coupon (${coupon}%) est ${comparaison} au taux actuellement exigé par le marché (${rate}%).</p>`;
  } else {
    const price = +document.getElementById('bondPriceInput').value;
    const ytm = computeBondYTM(price, face, coupon, years, freq);
    if(ytm == null){
      resultEl.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Impossible de calculer un rendement pour ce prix : vérifie que le prix saisi est positif et cohérent avec les autres valeurs (un prix extrêmement éloigné de la valeur nominale peut sortir de la plage de recherche -99% à +100%).</p>`;
      return;
    }
    resultEl.innerHTML = `
      ${renderDataBadge('calcul')}
      <div class="result-row" style="margin-top:10px;"><span>Rendement à l'échéance (YTM) estimé</span><span class="mono" style="font-size:18px;color:var(--gold-bright);">${ytm.toFixed(2)} %</span></div>
      <p style="font-size:13px;margin-top:10px;color:var(--text-dim);">Au prix saisi de ${fmtEUR(price)}, un acheteur qui garde l'obligation jusqu'à l'échéance obtient un rendement annualisé d'environ ${ytm.toFixed(2)}% — à comparer au taux de coupon affiché de ${coupon}%.</p>`;
  }
}
['bondFace','bondCoupon','bondYears','bondFreq','bondRate','bondPriceInput'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { updateBond(); markBondUsed(); });
});
updateBond();

// ---------- Calculateur de position Forex — computeForexPositionSize
// (scripts/data.js) : jamais un taux de change en direct utilisé pour la
// valeur du pip (calcul mathématique fixe lot × taille du pip), voir la
// limite documentée dans LAB_METHODOLOGY sur la devise du capital risqué. ----------
function markForexUsed(){ tryAwardQuizPoints(`lab-forex-${new Date().toDateString()}`, 8, {usedForexCalc:true}); }
function updateForex(){
  const capital = +document.getElementById('forexCapital').value || 0;
  const riskPct = +document.getElementById('forexRiskPct').value || 0;
  const stopPips = +document.getElementById('forexStopPips').value || 0;
  const lotSize = +document.getElementById('forexLotSize').value || 0;
  const pipDecimal = +document.getElementById('forexPipDecimal').value || 4;
  const resultEl = document.getElementById('forexResult');
  const riskAmount = capital * (riskPct / 100);
  const r = computeForexPositionSize(riskAmount, stopPips, lotSize, pipDecimal);
  if(!r){
    resultEl.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Hypothèses invalides : le capital, le risque accepté et le stop-loss doivent être positifs.</p>`;
    return;
  }
  const lotLabel = lotSize === 100000 ? 'lot standard' : (lotSize === 10000 ? 'mini lot' : 'micro lot');
  resultEl.innerHTML = `
    ${renderDataBadge('calcul')}
    <div class="result-row" style="margin-top:10px;"><span>Taille de position</span><span class="mono" style="font-size:18px;color:var(--gold-bright);">${r.positionSizeInLots.toFixed(2)} ${lotLabel}${Math.abs(r.positionSizeInLots) >= 2 ? 's' : ''}</span></div>
    <div class="result-row"><span>Soit, en unités</span><span class="mono">${Math.round(r.positionSizeInUnits).toLocaleString('fr-FR')} unités</span></div>
    <div class="result-row"><span>Montant risqué</span><span class="mono">${fmtEUR(riskAmount)}</span></div>
    <p style="font-size:13px;margin-top:10px;color:var(--text-dim);">Valeur du pip pour 1 ${lotLabel} : ${r.pipValuePerLot.toFixed(2)} (devise de cotation de la paire). Si le stop-loss de ${stopPips} pips est touché, la perte correspond exactement au montant risqué ci-dessus — jamais plus, jamais moins.</p>`;
}
['forexCapital','forexRiskPct','forexStopPips','forexLotSize','forexPipDecimal'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { updateForex(); markForexUsed(); });
});
updateForex();

// ============================================================
// ---------- Laboratoire économique (tab-economie, section 4 du prompt
// "Extension intelligente des domaines") : scénarios qualitatifs de choc
// macro. Jamais une prédiction chiffrée — chaque effet explique son
// mécanisme, jamais un simple "X monte donc Y baisse" (section 30). 4 des
// 5 scénarios du prompt (taux, inflation, chômage, droits de douane) ;
// dépenses publiques en phase suivante, jamais un onglet à moitié rempli
// pour atteindre un chiffre rond. ----------
// ============================================================
const ECO_LAB_SCENARIOS = [
  {
    id: 'taux-hausse',
    icon: '🏦',
    titre: 'La banque centrale augmente son taux directeur de 1 point',
    hypotheses: "Hausse isolée de 1 point de pourcentage, toutes choses égales par ailleurs — dans la réalité, plusieurs variables évoluent en même temps (croissance, anticipations déjà présentes dans les prix, contexte international).",
    effets: [
      {domaine: 'Obligations', effet: 'Le prix des obligations déjà émises baisse généralement.', mecanisme: "Une obligation existante verse un coupon fixe, décidé à son émission. Si les nouvelles obligations offrent un coupon plus élevé (aligné sur le nouveau taux), l'ancienne devient relativement moins attractive : son prix doit baisser pour offrir à un nouvel acheteur un rendement comparable."},
      {domaine: 'Actions', effet: 'Peut peser sur certaines valorisations, plus particulièrement les entreprises à forte croissance attendue.', mecanisme: "La valorisation d'une action reflète en théorie l'actualisation de ses bénéfices futurs ; un taux d'actualisation plus élevé réduit la valeur actuelle de bénéfices lointains. L'effet varie fortement selon le secteur, l'endettement de l'entreprise et si la hausse était déjà anticipée par le marché."},
      {domaine: 'Immobilier', effet: "Le crédit devient plus cher, ce qui peut réduire la capacité d'emprunt des acheteurs.", mecanisme: "Les taux des nouveaux crédits immobiliers suivent généralement, avec un délai, l'évolution du taux directeur. À mensualité égale, un taux plus élevé réduit le capital empruntable — ce qui peut peser sur la demande et donc sur les prix."},
      {domaine: 'Crédit', effet: 'Le coût de tout nouvel emprunt (consommation, entreprise) augmente.', mecanisme: "Les banques répercutent en partie la hausse du taux directeur sur leurs propres taux, avec une ampleur et un délai qui dépendent de la concurrence bancaire et de leur coût de refinancement sur le marché interbancaire."}
    ],
    limites: "Scénario simplifié et isolé : dans la réalité, l'ampleur et la rapidité de ces effets dépendent fortement du contexte (croissance déjà forte ou faible, niveau de dette, anticipations déjà intégrées dans les prix)."
  },
  {
    id: 'inflation-choc',
    icon: '📉',
    titre: "L'inflation passe de 2 % à 6 %",
    hypotheses: "Choc d'inflation isolé — sans présumer de la réaction de la banque centrale ni de sa durée (une inflation temporaire et une inflation durablement ancrée n'ont pas les mêmes conséquences).",
    effets: [
      {domaine: 'Pouvoir d\'achat', effet: 'Le pouvoir d\'achat de l\'épargne non rémunérée diminue.', mecanisme: "Si les prix augmentent de 6 %/an et qu'une épargne rapporte 2 %, son rendement réel (rendement nominal moins inflation) devient négatif : le montant affiché augmente, mais ce qu'il permet d'acheter diminue."},
      {domaine: 'Banque centrale', effet: 'Incite généralement la banque centrale à relever ses taux directeurs pour contenir l\'inflation.', mecanisme: "La plupart des banques centrales ciblent une inflation proche de 2 %/an. Un écart important les pousse typiquement à durcir leur politique monétaire (hausse des taux) pour freiner la demande — avec les effets décrits dans le scénario \"hausse des taux\" ci-dessus."},
      {domaine: 'Obligations', effet: 'Le rendement réel des obligations à taux fixe déjà émises se dégrade.', mecanisme: "Un coupon fixe perd de sa valeur réelle si l'inflation augmente, puisqu'il achète de moins en moins de biens et services au fil du temps — sauf pour les obligations indexées sur l'inflation, conçues spécifiquement pour ce risque."},
      {domaine: 'Salaires & entreprises', effet: "Les entreprises dont les coûts augmentent plus vite que leurs prix de vente voient leurs marges se compresser.", mecanisme: "Toutes les entreprises ne peuvent pas répercuter une hausse de coûts sur leurs prix de vente au même rythme (pouvoir de fixation des prix inégal selon le secteur et la concurrence) — d'où des effets très hétérogènes d'un secteur à l'autre."}
    ],
    limites: "L'ampleur des effets dépend fortement de si le choc est perçu comme temporaire (ex. lié à l'énergie) ou durable, et de la crédibilité de la banque centrale à le contenir — deux éléments impossibles à connaître à l'avance avec certitude."
  },
  {
    id: 'chomage-hausse',
    icon: '💼',
    titre: 'Le chômage augmente fortement',
    hypotheses: "Hausse marquée et rapide du taux de chômage, sans présumer de sa cause (choc externe, ralentissement conjoncturel, restructuration sectorielle...).",
    effets: [
      {domaine: 'Consommation', effet: 'La consommation des ménages tend à ralentir.', mecanisme: "Une hausse du chômage réduit le revenu agrégé des ménages et augmente l'incertitude sur l'emploi futur, ce qui pousse généralement à une épargne de précaution plus élevée et des achats différés, notamment pour les biens durables."},
      {domaine: 'Banque centrale', effet: 'Peut inciter la banque centrale à assouplir sa politique monétaire (baisse des taux), selon son mandat.', mecanisme: "Certaines banques centrales (comme la Fed) ont un double mandat stabilité des prix + emploi maximum ; une hausse du chômage peut alors peser en faveur d'une baisse des taux pour soutenir l'activité — sauf si l'inflation reste elle-même élevée, ce qui crée un arbitrage difficile."},
      {domaine: 'Immobilier', effet: 'La demande de logements peut se tasser, en particulier dans les secteurs/régions les plus touchés.', mecanisme: "L'achat d'un logement dépend fortement de la stabilité perçue des revenus futurs (nécessaire pour obtenir un crédit et s'engager sur 15-25 ans) : une hausse du chômage rend les banques plus prudentes sur l'octroi de crédit et les ménages plus hésitants à s'engager."},
      {domaine: 'Entreprises', effet: 'Le risque de crédit (impayés, défauts) augmente pour les entreprises exposées à la consommation.', mecanisme: "Une baisse de la consommation et des revenus des ménages réduit le chiffre d'affaires des entreprises qui en dépendent le plus directement (commerce, services), ce qui peut fragiliser leur capacité à rembourser leurs propres dettes."}
    ],
    limites: "L'ampleur de ces effets dépend du secteur touché, de la rapidité de la hausse, et des filets de sécurité sociale en place (assurance chômage) qui amortissent en partie le choc sur la consommation."
  },
  {
    id: 'droits-douane',
    icon: '🚢',
    titre: 'Un pays impose 20 % de droits de douane sur ses importations',
    hypotheses: "Mesure isolée et unilatérale, sans présumer de la réaction des pays visés (aucune mesure de rétorsion supposée dans ce scénario de base) ni du secteur précis concerné.",
    effets: [
      {domaine: 'Prix & consommateurs', effet: 'Les prix des produits importés visés augmentent généralement pour les consommateurs du pays qui impose la taxe.', mecanisme: "Le droit de douane est payé à l'entrée du territoire par l'importateur, qui répercute tout ou partie de ce coût sur son prix de vente final. La part réellement répercutée dépend du pouvoir de négociation entre l'exportateur (qui peut baisser sa marge) et l'importateur/consommateur local."},
      {domaine: 'Entreprises nationales concurrentes', effet: 'Les entreprises locales produisant des biens équivalents peuvent gagner en compétitivité-prix face aux produits importés désormais plus chers.', mecanisme: "En rendant les produits étrangers relativement plus chers, le droit de douane réduit la pression concurrentielle sur les producteurs nationaux du même secteur — un effet protecteur, mais qui ne dit rien de leur efficacité ou innovation réelle."},
      {domaine: 'Importations / exportations', effet: 'Le volume d\'importations du bien visé tend à diminuer.', mecanisme: "Un prix plus élevé réduit mécaniquement la quantité demandée, selon la sensibilité des acheteurs au prix (élasticité) : plus il existe des alternatives locales ou d'autres pays fournisseurs non taxés, plus la baisse des importations visées sera marquée."},
      {domaine: 'Devise', effet: 'L\'effet sur le taux de change du pays qui impose la mesure est ambigu et dépend du contexte.', mecanisme: "Une baisse des importations peut réduire la demande de devise étrangère (soutien à la monnaie locale), mais des mesures de rétorsion ou une perte de confiance des investisseurs peuvent jouer en sens inverse — aucun effet mécanique unique ne s'impose ici."},
      {domaine: 'Inflation', effet: 'Peut contribuer à une hausse générale des prix si les biens visés sont largement consommés ou utilisés comme intrants par d\'autres entreprises.', mecanisme: "Quand les biens taxés sont des composants utilisés dans d'autres chaînes de production locales (voir Chaînes d'approvisionnement), leur surcoût se propage aux produits finaux qui en dépendent, au-delà du seul bien directement visé par la taxe."}
    ],
    limites: "Ce scénario isole l'effet d'une mesure unilatérale et ignore volontairement les mesures de rétorsion possibles du ou des pays visés (qui peuvent imposer leurs propres droits de douane en retour), ainsi que les effets de plus long terme sur les chaînes d'approvisionnement mondiales."
  }
];

function renderEcoLabScenarios(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = ECO_LAB_SCENARIOS.map(s => `
    <details class="card" style="margin-bottom:14px;">
      <summary style="cursor:pointer;list-style:none;">
        <span class="smallcaps">${s.icon} Scénario</span>
        <h3 style="margin:8px 0 0;font-size:17px;">${s.titre}</h3>
      </summary>
      <div style="margin-top:14px;">
        ${renderDataBadge('scenario')}
        <p style="font-size:12.5px;color:var(--text-dim);margin:10px 0 14px;"><strong style="color:var(--text);">Hypothèses :</strong> ${s.hypotheses}</p>
        ${s.effets.map(e => `
          <div style="margin-bottom:12px;padding-left:12px;border-left:2px solid var(--hairline);">
            <p style="font-size:13.5px;font-weight:600;">${e.domaine} <span style="font-weight:400;color:var(--text-dim);">— ${e.effet}</span></p>
            <p style="font-size:12.5px;color:var(--text-dim);margin-top:4px;">${e.mecanisme}</p>
          </div>`).join('')}
        <p class="disclaimer-box" style="margin-top:12px;">${s.limites} Ce scénario est une illustration pédagogique du mécanisme économique, jamais une prédiction sur ce qui va réellement se passer.</p>
      </div>
    </details>`).join('');
}
safeRun('laboratoire économique', () => renderEcoLabScenarios('ecoLabScenarios'));

// ---------- Simulateur "Gouverneur de banque centrale" (tab-economie) : moteur
// pur dans scripts/data.js (initGovernorState/applyGovernorDecision/
// scoreGovernorGame), aucune donnée réelle ici — modèle pédagogique simplifié,
// même esprit que les scénarios qualitatifs ci-dessus (jamais présenté comme
// une prédiction). Historique de parties : fzr-gouverneur-history. ----------
function getGovernorHistory(){ return safeGetJSON('fzr-gouverneur-history', []); }
function saveGovernorResult(entry){
  const history = getGovernorHistory();
  history.unshift(entry);
  safeSetJSON('fzr-gouverneur-history', history.slice(0, 20));
}

function renderGovernorSim(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  let state = null;

  function fmtPt(x){ return `${x >= 0 ? '+' : ''}${x.toFixed(2)} pt`; }

  function renderIntro(){
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:14px;max-width:70ch;">Tu es gouverneur de banque centrale pendant ${GOVERNOR_ROUNDS} trimestres. À chaque tour, ajuste le taux directeur en réaction à l'inflation et au chômage — l'effet de ta décision ne se voit qu'au tour SUIVANT (délai de transmission réel de la politique monétaire), jamais instantanément. Objectif : rapprocher l'inflation de sa cible (${GOVERNOR_TARGET_INFLATION}%) et le chômage de son niveau "naturel" (${GOVERNOR_NATURAL_UNEMPLOYMENT}%) — un double mandat, comme dans la réalité.</p>
      <div class="disclaimer-box">Modèle pédagogique volontairement simplifié : les chocs et les coefficients de transmission sont illustratifs, jamais une prédiction réelle. Voir le laboratoire économique ci-dessus pour les mécanismes qualitatifs détaillés.</div>
      <button class="btn btn-gold" id="${elId}-start" type="button" style="margin-top:16px;">Prendre mes fonctions</button>`;
    document.getElementById(`${elId}-start`).addEventListener('click', () => { state = initGovernorState(); renderRound(); });
  }

  function renderRound(){
    const s = state;
    const event = GOVERNOR_EVENTS[s.round % GOVERNOR_EVENTS.length];
    const pct = Math.round((s.round / GOVERNOR_ROUNDS) * 100);
    const lastEntry = s.history[s.history.length - 1];

    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Trimestre ${s.round + 1} / ${GOVERNOR_ROUNDS}</span><span>Taux directeur actuel : ${s.tauxDirecteur.toFixed(2)}%</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:16px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      ${lastEntry ? `<p class="disclaimer-box" style="margin-bottom:14px;">Au tour précédent, tu as ${lastEntry.decision >= 0 ? 'monté' : 'baissé'} le taux de ${fmtPt(lastEntry.decision)} (${lastEntry.tauxAvant.toFixed(2)}% → ${lastEntry.tauxApres.toFixed(2)}%). Effet visible ce tour-ci (avec délai).</p>` : ''}
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));margin-bottom:16px;">
        <div class="card"><span class="smallcaps">Inflation</span><div class="result-big" style="font-size:20px;margin-top:6px;color:${Math.abs(s.inflation - GOVERNOR_TARGET_INFLATION) <= 0.5 ? 'var(--emerald)' : 'var(--bordeaux)'};">${s.inflation.toFixed(1)}%</div><p style="font-size:11px;color:var(--text-dim);margin-top:4px;">Cible : ${GOVERNOR_TARGET_INFLATION}%</p></div>
        <div class="card"><span class="smallcaps">Chômage</span><div class="result-big" style="font-size:20px;margin-top:6px;color:${Math.abs(s.chomage - GOVERNOR_NATURAL_UNEMPLOYMENT) <= 0.5 ? 'var(--emerald)' : 'var(--bordeaux)'};">${s.chomage.toFixed(1)}%</div><p style="font-size:11px;color:var(--text-dim);margin-top:4px;">Niveau naturel : ${GOVERNOR_NATURAL_UNEMPLOYMENT}%</p></div>
        <div class="card"><span class="smallcaps">Croissance</span><div class="result-big" style="font-size:20px;margin-top:6px;color:${s.croissance >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};">${s.croissance >= 0 ? '+' : ''}${s.croissance.toFixed(1)}%</div></div>
      </div>
      <p style="font-size:13px;margin-bottom:14px;">📰 ${event.titre}</p>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Ta décision sur le taux directeur</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;" id="${elId}-decisions">
        ${[-1, -0.5, -0.25, 0, 0.25, 0.5, 1].map(d => `<button type="button" class="pill decision-btn" data-delta="${d}">${d > 0 ? '+' : ''}${d}</button>`).join('')}
      </div>`;

    el.querySelectorAll('.decision-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state = applyGovernorDecision(state, +btn.dataset.delta);
        if(state.done) renderBilan(); else renderRound();
      });
    });
  }

  function renderBilan(){
    const s = state;
    const {score, avgLoss, label} = scoreGovernorGame(s);

    tryAwardQuizPoints(`gouverneur-${new Date().toDateString()}`, 15, {usedSimulator: true});
    recordAnswer('Inflation', score >= 550, true, 'intermediaire');
    saveGovernorResult({date: new Date().toISOString(), score, label, history: s.history});

    el.innerHTML = `
      <div class="card">
        <span class="smallcaps">Bilan de mandat</span>
        <div class="result-big" style="margin-top:6px;">${score} / 1000</div>
        <p style="font-size:14px;margin-top:4px;color:${score >= 800 ? 'var(--emerald)' : score >= 550 ? 'var(--gold-bright)' : 'var(--bordeaux)'};">${label}</p>
      </div>
      <p style="font-size:13px;color:var(--text-dim);margin:14px 0;">Ce score mesure l'écart moyen (au carré) entre l'inflation/le chômage observés à chaque tour et leurs cibles (${GOVERNOR_TARGET_INFLATION}% et ${GOVERNOR_NATURAL_UNEMPLOYMENT}%) — plus l'écart cumulé est faible, plus le score est élevé. C'est une version simplifiée du type d'arbitrage que formalisent certaines banques centrales à double mandat (stabilité des prix + emploi).</p>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Historique du mandat</span>
      <div style="overflow-x:auto;">
        <table class="mono" style="width:100%;font-size:12px;border-collapse:collapse;">
          <thead><tr style="text-align:left;color:var(--text-dim);"><th style="padding:4px 8px;">Trimestre</th><th style="padding:4px 8px;">Taux</th><th style="padding:4px 8px;">Décision</th><th style="padding:4px 8px;">Inflation</th><th style="padding:4px 8px;">Chômage</th></tr></thead>
          <tbody>
            ${s.history.map(h => `<tr style="border-top:1px solid var(--hairline);"><td style="padding:4px 8px;">${h.round + 1}</td><td style="padding:4px 8px;">${h.tauxAvant.toFixed(2)}%</td><td style="padding:4px 8px;">${fmtPt(h.decision)}</td><td style="padding:4px 8px;">${h.inflationAvant.toFixed(1)}%</td><td style="padding:4px 8px;">${h.chomageAvant.toFixed(1)}%</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="disclaimer-box" style="margin-top:14px;">Modèle pédagogique simplifié : en réalité, une banque centrale agit avec bien plus d'informations, d'incertitude sur les délais de transmission, et de contraintes (crédibilité, coordination internationale...) que ce moteur illustratif ne peut représenter.</p>
      <button class="btn btn-sm btn-gold" id="${elId}-restart" style="margin-top:10px;">Nouveau mandat</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-restart`).addEventListener('click', renderIntro);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'economics'});
  }

  renderIntro();
}
safeRun('simulateur gouverneur de banque centrale', () => renderGovernorSim('governorSim'));
