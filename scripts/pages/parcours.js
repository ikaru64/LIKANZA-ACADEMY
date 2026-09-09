/* ============================================================
   LIKANZA ACADEMY — Mon Univers Financier
   Cockpit financier personnel plein écran (refonte 05/09/2026, densifiée
   05/09/2026 v2 sur une image de référence pour la composition/densité —
   jamais copiée au pixel, la logique de layout adaptée aux vraies pages et
   vraies données de Likanza). Jamais verrouillé : le reste du site reste
   accessible sans avoir fait le premier quiz.

   Mode Aperçu/Démo (v2) : un utilisateur sans AUCUNE donnée financière
   réelle voit un dashboard complet et impressionnant plutôt qu'une
   collection d'états vides — mais TOUJOURS avec un badge "MODE DÉMO"
   visible et honnête (jamais une donnée fabriquée présentée comme réelle).
   Dès la première vraie donnée saisie (via le drawer "Configurer mes
   finances" ou ailleurs sur le site), le mode démo disparaît définitivement
   — jamais de mélange démo/réel.
   ============================================================ */

// ============================================================
// Données de démonstration (Mode Aperçu) — jamais écrites dans le vrai
// localStorage de l'utilisateur, jamais mélangées à une vraie donnée.
// Chiffres cohérents entre eux (le total du patrimoine ci-dessous
// correspond exactement à la somme des actifs listés).
// ============================================================
const COCKPIT_DEMO_DATA = (function(){
  const assets = [
    {nom: 'Compte courant', categorie: 'cash', valeur: 12650},
    {nom: 'Livret A', categorie: 'epargne', valeur: 8400},
    {nom: 'LDDS', categorie: 'epargne', valeur: 2830},
    {nom: 'PEA', categorie: 'pea', valeur: 8420},
    {nom: 'CTO', categorie: 'cto', valeur: 7010},
    {nom: 'Crypto', categorie: 'crypto', valeur: 4680},
    {nom: 'Contrat d\'assurance-vie', categorie: 'assurancevie', valeur: 2830}
  ];
  const goals = [
    {id: 'demo-goal-1', nom: 'Projet immobilier', montantCible: 80000, montantActuel: 22400, versementMensuel: 400, dateCible: null},
    {id: 'demo-goal-2', nom: "Fonds d'urgence", montantCible: 10000, montantActuel: 6200, versementMensuel: 150, dateCible: null},
    {id: 'demo-goal-3', nom: 'Voyage en Asie', montantCible: 5000, montantActuel: 2000, versementMensuel: 100, dateCible: null},
    {id: 'demo-goal-4', nom: 'Indépendance financière', montantCible: 200000, montantActuel: 24000, versementMensuel: 300, dateCible: null}
  ];
  const mois = (typeof currentMonthKey === 'function') ? currentMonthKey() : new Date().toISOString().slice(0,7);
  const budgetEntries = [
    {type: 'revenu', categorie: 'Salaire', montant: 2800, mois},
    {type: 'depense', categorie: 'Logement', montant: 950, mois},
    {type: 'depense', categorie: 'Alimentation', montant: 420, mois},
    {type: 'depense', categorie: 'Transport', montant: 180, mois},
    {type: 'depense', categorie: 'Loisirs & sorties', montant: 180, mois},
    {type: 'depense', categorie: 'Abonnements', montant: 70, mois}
  ];
  // Historique de démonstration : une rampe de croissance lissée sur 12
  // mois se terminant exactement sur les valeurs actuelles ci-dessus —
  // générée, pas tapée à la main, mais chaque point reste interne et
  // clairement démo (jamais écrit dans fzr-net-worth-history).
  const finalCat = {cash: 12650, epargne: 11230, assurancevie: 2830, pea: 8420, cto: 7010, crypto: 4680, actions: 0, immobilier: 0, vehicule: 0, autre: 0};
  const history = [];
  const now = new Date();
  for(let i = 11; i >= 0; i--){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const moisKey = d.toISOString().slice(0,7);
    const frac = 0.42 + (0.58 * (11 - i) / 11); // de 42% à 100% de la valeur finale
    const parCategorie = {};
    Object.keys(finalCat).forEach(k => { parCategorie[k] = Math.round(finalCat[k] * frac); });
    const patrimoineNet = Object.values(parCategorie).reduce((s,v) => s+v, 0);
    history.push({mois: moisKey, patrimoineNet, parCategorie, dateAjout: d.toISOString()});
  }
  return {assets, debts: [], goals, lifeProjects: [], budgetEntries, history};
})();

let cockpitMode = 'demo'; // 'personal' | 'business' | 'demo'
let cockpitDemoMode = false; // dérivé de cockpitMode, conservé pour ne rien casser dans les fonctions ci-dessous
// Gap Closure Sprint P2, phase 17 (06/09/2026) : un utilisateur au profil
// business réel (Business Lab) mais sans aucune donnée financière
// personnelle déclenchait ce mode démo — il voyait un salaire/Livret A/PEA
// entièrement fabriqués sur SA page "Mon Univers Financier", sans aucun
// rapport avec son vrai profil business, potentiellement pris pour de
// vraies données. Un vrai profil business existant est un signal réel
// suffisant pour préférer l'état vide honnête ("Ajoute tes premiers
// actifs...") à une démo personnelle non pertinente — corrigé en phase 17.
//
// Suivi disclosed de la phase 17 (07/09/2026) : préférer l'état vide était
// correct mais insuffisant côté produit — ce même utilisateur a de VRAIES
// données professionnelles, analysées ailleurs sur le site (Business Lab),
// qui méritent la même place de choix qu'un hero personnel plutôt qu'un
// clic supplémentaire. cockpitDetectMode() distingue donc 3 états réels ;
// un utilisateur ayant les DEUX (donnée perso réelle + profil business
// réel) reste en 'personal' — son business reste à un clic via la nav
// existante, pas un cas couvert par ce hero business.
function cockpitDetectMode(){
  const hasRealPersonalData = getNetWorthAssets().length > 0 || getNetWorthHistory().length > 0
    || getFinancialGoals().length > 0 || getLifeProjects().length > 0;
  // getBusinessProfile() retourne toujours un objet complet (defaults
  // fusionnés), jamais null — safeGetJSON(...,null) directement sur la
  // clé brute est le seul moyen de savoir si un profil a RÉELLEMENT été
  // enregistré (même motif que renderPersonalizationPanel, data.js).
  const hasRealBusinessProfile = !!safeGetJSON('fzr-business-profile', null);
  if(hasRealPersonalData) return 'personal';
  if(hasRealBusinessProfile) return 'business';
  return 'demo';
}
function cockpitAssets(){ return cockpitDemoMode ? COCKPIT_DEMO_DATA.assets : getNetWorthAssets(); }
function cockpitDebts(){ return cockpitDemoMode ? COCKPIT_DEMO_DATA.debts : getPersonalDebts(); }
function cockpitBudgetEntries(){ return cockpitDemoMode ? COCKPIT_DEMO_DATA.budgetEntries : getBudgetEntries(); }
function cockpitGoals(){ return cockpitDemoMode ? COCKPIT_DEMO_DATA.goals : null; } // null = laisser le widget réel lire getFinancialGoals()
function cockpitLifeProjects(){ return cockpitDemoMode ? COCKPIT_DEMO_DATA.lifeProjects : null; }
function cockpitHistory(){ return cockpitDemoMode ? COCKPIT_DEMO_DATA.history : getNetWorthHistory(); }

// ============================================================
// Chantier 1 (audit Dashboard du 28/08/2026) : remplace la pile de sections
// individuelles (profil, stats, prochain pas, Financial IQ, détail par
// domaine) par la coquille de widgets (renderDashboardShell, scripts/data.js)
// — personnalisable, avec bascule Personnel/Professionnel en page.
// ============================================================
function initParcoursHero(){
  const hasProfile = !!getPositioningResult();
  if(!hasProfile){
    document.getElementById('parcoursGateSection').style.display = 'block';
    renderParcoursGate('parcoursGate');
    return;
  }
  document.getElementById('parcoursMainSection').style.display = 'block';
  cockpitMode = cockpitDetectMode();
  cockpitDemoMode = cockpitMode === 'demo';
  // En-tête scindé (refonte cockpit, 05/09/2026) : les 3 bandeaux de nudge
  // (onboarding/ré-onboarding/suggestion d'intérêt) restent au-dessus du
  // pli, toujours visibles.
  renderParcoursNudges('parcoursNudges');
  // Gap Closure Sprint P2, phase 16 (06/09/2026) : le budget de hauteur fixe
  // du cockpit (parcours.css, --nudges-h) ne peut pas connaître la hauteur
  // réelle de ce bandeau autrement qu'en la mesurant après son rendu — un
  // bandeau vide donne 0px (aucun changement de comportement par rapport à
  // avant), un vrai bandeau (ré-onboarding/suggestion) est maintenant
  // correctement soustrait, jamais poussé sous le pli.
  const nudgesEl = document.getElementById('parcoursNudges');
  if(nudgesEl && typeof nudgesEl.offsetHeight === 'number'){
    document.documentElement.style.setProperty('--nudges-h', nudgesEl.offsetHeight + 'px');
  }
  // Sprint de consolidation (09/09/2026) : le bandeau gamification (XP/niveau/
  // série), la "Suite de l'apprentissage" (missions/révisions/parcours
  // guidés) et le bandeau "À faire maintenant" (computeDashboardPriorityQueue
  // — vérifié : ses 6 candidats sont TOUS des items d'apprentissage, aucun
  // financier) sont retirés d'ici. Le Tableau de bord (index.html) en est
  // déjà responsable (son propre dashboardHeader + onglet "Apprendre").
  // Mon Univers Financier ne répond plus qu'à "où en est ma situation
  // financière ?" — voir renderCockpitTabsGrid ci-dessous pour la nouvelle
  // navigation par onglets (Vue d'ensemble/Patrimoine/Portefeuille/Risques/
  // Objectifs/Projections). La Santé financière (6 axes, réellement
  // financière — budget/dette/sécurité/trésorerie/investissement/objectifs)
  // n'est jamais supprimée : déplacée dans l'onglet Risques.
  renderCockpitTabsGrid();
  renderCockpitBody();
}

// Reconstruit tout le cockpit à l'identique (utilisé après la bascule de
// thème ET après la 1ère vraie donnée saisie dans le drawer, qui fait
// sortir du mode démo) — un seul point d'entrée pour ne jamais oublier un
// sous-composant lors d'un futur ajout.
function rerenderCockpit(){
  cockpitMode = cockpitDetectMode();
  cockpitDemoMode = cockpitMode === 'demo';
  renderCockpitBody();
}

// ============================================================
// Navigation par onglets (sprint de consolidation 09/09/2026, section 5 du
// prompt d'origine) : réutilise le motif quick-access-grid/home-tab-panel
// déjà réel de index.html (renderQuickAccess/setActiveTab, scripts/pages/
// index.js) — mêmes classes CSS, même mécanique (toggle .active, rendu
// éager de tous les onglets au chargement, jamais un rendu paresseux qui
// risquerait un onglet périmé après une modification ailleurs sur la page).
// ============================================================
const COCKPIT_TABS = [
  {id: 'tab-vue-ensemble', label: "Vue d'ensemble", icon: 'compass'},
  {id: 'tab-patrimoine', label: 'Patrimoine', icon: 'gem'},
  {id: 'tab-portefeuille', label: 'Portefeuille', icon: 'trending-up'},
  {id: 'tab-risques', label: 'Risques', icon: 'shield'},
  {id: 'tab-objectifs', label: 'Objectifs', icon: 'target'},
  {id: 'tab-projections', label: 'Projections', icon: 'telescope'}
];
let cockpitActiveTab = 'tab-vue-ensemble';
function renderCockpitTabsGrid(){
  const el = document.getElementById('cockpitTabsGrid');
  if(!el) return;
  el.innerHTML = COCKPIT_TABS.map(t => `
    <button type="button" class="quick-access-card ${t.id === cockpitActiveTab ? 'active' : ''}" data-tab="${t.id}" style="padding:12px 14px;text-align:center;">
      <div class="icon" style="margin-bottom:4px;">${ICONS[t.icon] || ''}</div>
      <h3 style="font-size:12.5px;">${t.label}</h3>
    </button>`).join('');
  el.querySelectorAll('.quick-access-card').forEach(btn => {
    btn.addEventListener('click', () => setCockpitActiveTab(btn.dataset.tab));
  });
}
function setCockpitActiveTab(tabId){
  if(!COCKPIT_TABS.some(t => t.id === tabId)) return;
  cockpitActiveTab = tabId;
  document.querySelectorAll('#cockpitTabsGrid .quick-access-card').forEach(c => c.classList.toggle('active', c.dataset.tab === tabId));
  COCKPIT_TABS.forEach(t => {
    const panel = document.getElementById(t.id);
    if(panel) panel.classList.toggle('active', t.id === tabId);
  });
}

// Dispatcheur hero personnel/business (suivi disclosed Gap Closure Sprint
// phase 17, 07/09/2026) : un profil Business Lab réel sans donnée
// financière personnelle réelle mérite son propre hero, pas un hero
// personnel vide — voir cockpitDetectMode(). Aucune 3ème rangée de
// panneaux fabriquée en mode business (moins de contenu, mais honnête,
// plutôt qu'un remplissage forcé pour égaler visuellement le personnel).
function renderCockpitBody(){
  const tabsGridEl = document.getElementById('cockpitTabsGrid');
  if(cockpitMode === 'business'){
    // Onglets Patrimoine/Portefeuille/Risques/Objectifs/Projections sont
    // spécifiques aux données financières personnelles — un profil Business
    // Lab réel les masque plutôt que d'afficher 5 onglets vides ou
    // dupliquant Business Lab (qui a déjà ses propres outils).
    if(tabsGridEl) tabsGridEl.style.display = 'none';
    renderBusinessCockpitHeader('cockpitHeader');
    renderBusinessCockpitKPIs('cockpitKPIs');
    renderBusinessCockpitMain('cockpitChart');
    renderBusinessCockpitSide('cockpitSide');
    return;
  }
  if(tabsGridEl) tabsGridEl.style.display = '';
  renderCockpitHeader('cockpitHeader');
  renderCockpitKPIs('cockpitKPIs');
  renderCockpitChart('cockpitChart');
  renderCockpitSide('cockpitSide');
  renderCockpitPatrimoineTab('cockpitPatrimoineBody');
  renderCockpitPortefeuilleTab('cockpitPortefeuilleBody');
  renderCockpitRisquesTab('cockpitRisquesBody');
  renderCockpitObjectifs('cockpitObjectifsBody');
  renderCockpitProjectionsTab('cockpitProjectionsBody');
}

// ============================================================
// Hero Business (07/09/2026) — suivi disclosed de la Gap Closure Sprint,
// phase 17. Réutilise exclusivement des fonctions déjà réelles et déjà en
// production sur business-lab.html (computeBusinessProfileSnapshot,
// computeRunway, renderBusinessDiagnostics, renderNextStepCard,
// businessLabDecisionsPool/businessLabCasesPool) — zéro nouvelle métrique
// ni série temporelle inventée. Le profil entreprise est un instantané
// unique (pas d'historique comme fzr-net-worth-history) : aucun graphique
// "évolution" n'est donc fabriqué ici, contrairement au hero personnel.
// ============================================================
function renderBusinessCockpitHeader(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <div class="cockpit-title">
      <h2>Mon Univers Financier</h2>
      <span class="cockpit-demo-badge" style="background:var(--emerald);color:#0B0B0D;">Vue entreprise</span>
      <p class="cockpit-subtitle" style="width:100%;">Aucune donnée financière personnelle enregistrée — voici un aperçu de ton entreprise, à partir de ton profil Business Lab.</p>
    </div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <a href="business-lab.html#companyProfile" class="btn btn-sm btn-gold">Gérer mon profil entreprise →</a>
      <div class="cockpit-meta">
        <div>Statut</div>
        <div class="cockpit-meta-value">Profil renseigné</div>
      </div>
    </div>`;
}
function renderBusinessCockpitKPIs(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const profile = getBusinessProfile();
  const snapshot = computeBusinessProfileSnapshot(profile);
  const runway = computeRunway(profile);
  const cards = [
    {key: 'ca', label: "Chiffre d'affaires annuel", value: snapshot.ca, icon: 'coins'},
    {key: 'resultat', label: 'Résultat mensuel', value: snapshot.resultatMensuelApproximatif, icon: 'trending-up'},
    {key: 'tresorerie', label: 'Trésorerie actuelle', value: profile.tresorerieActuelle, icon: 'wallet'}
  ];
  el.innerHTML = cards.map(c => `
    <div class="cockpit-kpi" id="${elId}-${c.key}">
      <span class="kpi-top"><span class="kpi-icon">${ICONS[c.icon] || ''}</span><span class="kpi-label">${c.label}</span></span>
      <span class="kpi-value mono" id="${elId}-${c.key}-value">0 €</span>
    </div>`).join('') + `
    <div class="cockpit-kpi" id="${elId}-runway">
      <span class="kpi-top"><span class="kpi-icon">${ICONS['shield'] || ''}</span><span class="kpi-label">Runway</span></span>
      <span class="kpi-value mono">${runway.runwayMois === null ? 'Profitable' : runway.runwayMois.toFixed(1) + ' mois'}</span>
    </div>`;
  cards.forEach(c => {
    animateNumber(document.getElementById(`${elId}-${c.key}-value`), c.value, {format: fmtEUR});
  });
}
function renderBusinessCockpitMain(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `<span class="smallcaps">Check-up entreprise</span><div id="${elId}-diagnostics" style="margin-top:12px;"></div>`;
  renderBusinessDiagnostics(`${elId}-diagnostics`);
}
function renderBusinessCockpitSide(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <div class="cockpit-panel" id="${elId}-nextstep"></div>
    <div class="cockpit-panel" id="${elId}-lab"></div>`;
  renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  const labEl = document.getElementById(`${elId}-lab`);
  if(labEl){
    const decisions = businessLabDecisionsPool().length;
    const cases = businessLabCasesPool().length;
    labEl.innerHTML = `
      <span class="panel-title">Business Lab</span>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">${decisions} décisions rapides et ${cases} business cases réels à explorer pour progresser.</p>
      <a href="business-lab.html" class="btn btn-sm" style="margin-top:10px;align-self:flex-start;">Ouvrir le Business Lab →</a>`;
  }
}

// ============================================================
// En-tête compact + rangée de KPI.
// ============================================================
function cockpitLastUpdateLabel(){
  if(cockpitDemoMode) return null;
  const history = getNetWorthHistory();
  const assets = getNetWorthAssets();
  const dates = [
    ...history.map(p => p.dateAjout),
    ...assets.map(a => a.dateAjout)
  ].filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d));
  if(dates.length === 0) return null;
  const mostRecent = new Date(Math.max(...dates.map(d => d.getTime())));
  return mostRecent.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'}) + ' · ' + mostRecent.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
}
function renderCockpitHeader(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const lastUpdate = cockpitLastUpdateLabel();
  el.innerHTML = `
    <div class="cockpit-title">
      <h2>Mon Univers Financier</h2>
      ${cockpitDemoMode ? `<span class="cockpit-demo-badge">Mode démo</span>` : ''}
      <p class="cockpit-subtitle" style="width:100%;">${cockpitDemoMode ? "Aperçu illustratif — renseigne tes finances pour voir TES vraies données." : "Une vision globale de ton capital, aujourd'hui et demain."}</p>
    </div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      ${cockpitDemoMode ? `<button type="button" class="btn btn-sm btn-gold" id="cockpitConfigureBtn">Configurer mes finances</button>` : `<button type="button" class="btn btn-sm" id="cockpitConfigureBtn">+ Ajouter une donnée</button>`}
      <button type="button" class="btn btn-sm btn-gold" id="cockpitProjectBtn">Projeter mon capital</button>
      <div class="cockpit-meta">
        <div>Dernière mise à jour</div>
        <div class="cockpit-meta-value">${lastUpdate || (cockpitDemoMode ? 'Aperçu' : 'Aucune donnée enregistrée')}</div>
      </div>
    </div>`;
  const projectBtn = document.getElementById('cockpitProjectBtn');
  if(projectBtn) projectBtn.addEventListener('click', () => setCockpitActiveTab('tab-projections'));
  const configureBtn = document.getElementById('cockpitConfigureBtn');
  if(configureBtn) configureBtn.addEventListener('click', openOnboardingDrawer);
}

// Vue active partagée entre les KPI et les onglets du graphique combiné :
// un seul état, deux points d'entrée (clic KPI ou clic onglet),
// setCockpitView synchronise les deux et met à jour le graphique.
// 'liquidites' pointe vers 'global' (aucun onglet dédié aux liquidités
// seules dans le graphique — GLOBAL/ÉPARGNE/INVESTISSEMENTS/REVENUS
// seulement), jamais un onglet fabriqué pour combler l'écart.
let cockpitActiveView = 'global';
const COCKPIT_KPI_VIEWS = {patrimoine: 'global', liquidites: 'global', epargne: 'epargne', investissements: 'investissements', solde: 'revenus'};
function setCockpitView(view){
  cockpitActiveView = view;
  document.querySelectorAll('.cockpit-kpi').forEach(btn => {
    btn.classList.toggle('active', (COCKPIT_KPI_VIEWS[btn.dataset.key] || 'global') === view);
  });
  document.querySelectorAll('.cockpit-chart-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  updateCockpitChartView(view);
}
// Icônes réelles (scripts/icons.js, déjà chargées partout sur le site) —
// une par KPI, jamais décoratives au hasard : chacune illustre bien le
// concept du KPI qu'elle accompagne.
const COCKPIT_KPI_ICONS = {patrimoine: 'coins', liquidites: 'wallet', epargne: 'shield', investissements: 'trending-up', solde: 'target'};
function renderCockpitKPIs(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const k = computeCockpitKPIs(cockpitAssets(), cockpitDebts(), cockpitBudgetEntries());
  const pct = v => k.patrimoineNet > 0 ? Math.round((v / k.patrimoineNet) * 100) : 0;
  const cards = [
    {key: 'patrimoine', label: 'Patrimoine total', value: k.patrimoineNet, sub: null},
    {key: 'liquidites', label: 'Liquidités', value: k.liquidites, sub: k.patrimoineNet > 0 ? `${pct(k.liquidites)} % du patrimoine` : null},
    {key: 'epargne', label: 'Épargne', value: k.epargne, sub: k.patrimoineNet > 0 ? `${pct(k.epargne)} % du patrimoine` : null},
    {key: 'investissements', label: 'Investissements', value: k.investissements, sub: k.patrimoineNet > 0 ? `${pct(k.investissements)} % du patrimoine` : null},
    {key: 'solde', label: 'Solde mensuel', value: k.soldeMensuel, sub: k.soldeMensuel !== 0 ? `${k.tauxEpargnePct.toFixed(0)} % taux d'épargne` : null}
  ];
  el.innerHTML = cards.map((c, i) => `
    <button type="button" class="cockpit-kpi ${i === 0 ? 'active' : ''}" data-key="${c.key}" id="${elId}-${c.key}">
      <span class="kpi-top"><span class="kpi-icon">${ICONS[COCKPIT_KPI_ICONS[c.key]] || ''}</span><span class="kpi-label">${c.label}</span></span>
      <span class="kpi-value mono" id="${elId}-${c.key}-value">0 €</span>
      ${c.sub ? `<span class="kpi-sub">${c.sub}</span>` : ''}
    </button>`).join('');
  cards.forEach(c => {
    animateNumber(document.getElementById(`${elId}-${c.key}-value`), c.value, {format: fmtEUR});
  });
  el.querySelectorAll('.cockpit-kpi').forEach(btn => {
    btn.addEventListener('click', () => setCockpitView(COCKPIT_KPI_VIEWS[btn.dataset.key] || 'global'));
  });
}

// ============================================================
// Graphique combiné "Évolution du patrimoine" — Chart.js, seule librairie
// externe du site (justifiée : aucune fonction de graphique existante ne
// gère de vraie interactivité au survol). Barres empilées (liquidités/
// épargne/investissements/autres) + courbe dorée (total réel). Enregistre
// lui-même un point d'historique catégorisé au chargement (même garde-fou
// idempotent qu'dans laboratoire.js), pour que l'historique s'alimente
// même si l'utilisateur ne visite jamais le Laboratoire — JAMAIS en mode
// démo, où rien n'est écrit dans le vrai localStorage.
// ============================================================
const COCKPIT_CHART_RANGES = [
  {key:'6m', label:'6 mois', months:6}, {key:'1a', label:'1 an', months:12},
  {key:'2a', label:'2 ans', months:24}, {key:'5a', label:'5 ans', months:60},
  {key:'tout', label:'Toutes les enveloppes', months:null}
];
let cockpitChartRangeKey = 'tout';
let cockpitChartInstance = null;
function cockpitCSSVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function cockpitChartDatasets(series){
  const gold = cockpitCSSVar('--gold-bright') || '#D9BC7C';
  const emerald = cockpitCSSVar('--emerald') || '#4E9177';
  const blue = '#438BFF';
  const grey = cockpitCSSVar('--text-dim') || '#9B968C';
  return [
    {key: 'liquidites', type: 'bar', label: 'Liquidités', data: series.liquidites, backgroundColor: grey, stack: 'patrimoine'},
    {key: 'epargne', type: 'bar', label: 'Épargne', data: series.epargne, backgroundColor: emerald, stack: 'patrimoine'},
    {key: 'investissements', type: 'bar', label: 'Investissements', data: series.investissements, backgroundColor: blue, stack: 'patrimoine'},
    {key: 'autres', type: 'bar', label: 'Autres (immobilier, véhicule...)', data: series.autres, backgroundColor: 'rgba(155,150,140,0.35)', stack: 'patrimoine'},
    {key: 'total', type: 'line', label: 'Patrimoine total', data: series.total, borderColor: gold, backgroundColor: gold, borderWidth: 2.5, pointRadius: 2, tension: 0.15, yAxisID: 'y'}
  ];
}
// Filtre honnête par onglet : GLOBAL montre tout ; ÉPARGNE/INVESTISSEMENTS
// n'estompent (opacité réduite) que les autres barres — jamais masquées
// silencieusement, l'utilisateur voit toujours que la donnée existe.
function cockpitDatasetOpacity(key, view){
  if(view === 'global' || key === 'total') return 1;
  if(view === 'epargne') return key === 'epargne' ? 1 : 0.15;
  if(view === 'investissements') return key === 'investissements' ? 1 : 0.15;
  return 1;
}
function updateCockpitChartView(view){
  const revenusEl = document.getElementById('cockpitChart-revenus');
  const canvasWrap = document.getElementById('cockpitChart-canvas-wrap');
  if(!revenusEl || !canvasWrap) return;
  if(view === 'revenus'){
    canvasWrap.style.display = 'none';
    revenusEl.style.display = '';
    renderCockpitRevenusPanel('cockpitChart-revenus');
    return;
  }
  canvasWrap.style.display = '';
  revenusEl.style.display = 'none';
  if(!cockpitChartInstance) return;
  cockpitChartInstance.data.datasets.forEach((ds, i) => {
    const key = cockpitChartInstance.data.datasetKeys[i];
    const opacity = cockpitDatasetOpacity(key, view);
    if(ds.type === 'bar') ds.backgroundColor = cockpitApplyOpacity(ds._baseColor || ds.backgroundColor, opacity, ds);
  });
  cockpitChartInstance.update();
}
function cockpitApplyOpacity(baseColor, opacity, ds){
  if(!ds._baseColor) ds._baseColor = baseColor;
  const base = ds._baseColor;
  if(base.startsWith('rgba')) return base.replace(/[\d.]+\)$/, opacity + ')');
  if(base.startsWith('#')){
    const r = parseInt(base.slice(1,3),16), g = parseInt(base.slice(3,5),16), b = parseInt(base.slice(5,7),16);
    return `rgba(${r},${g},${b},${opacity})`;
  }
  return base;
}
function renderCockpitRevenusPanel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const est = computeCapitalIncomeEstimate(cockpitAssets(), cockpitDebts(), cockpitBudgetEntries());
  if(!est){
    el.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Renseigne ton patrimoine pour voir apparaître une estimation ici.</p>`;
    return;
  }
  el.innerHTML = `
    <span class="smallcaps" style="color:var(--gold-bright);">Revenus de capital estimés</span>
    <div class="result-big" style="font-size:28px;margin-top:8px;">${fmtEUR(est.monthlyEstimate)} <span style="font-size:13px;color:var(--text-dim);font-weight:400;">/ mois</span></div>
    <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${fmtEUR(est.annualEstimate)} / an, SCÉNARIO CENTRAL (${est.ratePct} % de rendement annuel supposé).</p>
    <p class="disclaimer-box" style="margin-top:10px;">Aucun suivi réel de dividendes/intérêts perçus n'existe encore sur Likanza — ceci est une estimation basée sur ton patrimoine actuel et le même moteur de scénario que "Mon Futur", jamais un montant déjà perçu.</p>`;
}
function renderCockpitChart(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const assets = cockpitAssets();
  const debts = cockpitDebts();
  const net = computeNetWorth(assets, debts);
  // Écrit lui-même un point d'historique catégorisé (même garde-fou
  // idempotent que laboratoire.js) — JAMAIS en mode démo.
  if(!cockpitDemoMode && (assets.length > 0 || debts.length > 0)){
    recordNetWorthSnapshot(currentMonthKey(), net.patrimoineNet, net.parCategorie);
  }
  const fullHistory = cockpitHistory();
  if(fullHistory.length === 0){
    el.innerHTML = `
      <span class="smallcaps">Évolution du patrimoine</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:12px;">Renseigne ton patrimoine pour voir apparaître son évolution ici.</p>
      <button type="button" class="btn btn-sm" style="margin-top:10px;align-self:flex-start;" onclick="openOnboardingDrawer()">Configurer mes finances →</button>`;
    return;
  }
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <span class="smallcaps">Évolution du patrimoine</span>
      <div class="mode-toggle">
        <button class="pill cockpit-chart-tab active" data-view="global">GLOBAL</button>
        <button class="pill cockpit-chart-tab" data-view="epargne">ÉPARGNE</button>
        <button class="pill cockpit-chart-tab" data-view="investissements">INVESTISSEMENTS</button>
        <button class="pill cockpit-chart-tab" data-view="revenus">REVENUS</button>
      </div>
    </div>
    <select id="cockpitChartRange" style="margin-top:10px;max-width:200px;">
      ${COCKPIT_CHART_RANGES.map(r => `<option value="${r.key}" ${r.key === cockpitChartRangeKey ? 'selected' : ''}>${r.label}</option>`).join('')}
    </select>
    <div id="cockpitChart-canvas-wrap" style="position:relative;flex:1;margin-top:14px;min-height:180px;">
      <canvas id="cockpitChartCanvas"></canvas>
    </div>
    <div id="cockpitChart-revenus" class="cockpit-panel" style="display:none;margin-top:14px;"></div>`;

  function buildOrUpdateChart(){
    const range = COCKPIT_CHART_RANGES.find(r => r.key === cockpitChartRangeKey) || COCKPIT_CHART_RANGES[COCKPIT_CHART_RANGES.length - 1];
    const sliced = range.months ? fullHistory.slice(-range.months) : fullHistory;
    const series = buildWealthEvolutionSeries(sliced);
    const datasets = cockpitChartDatasets(series);
    const canvas = document.getElementById('cockpitChartCanvas');
    if(!canvas || typeof Chart === 'undefined') return;
    if(cockpitChartInstance) cockpitChartInstance.destroy();
    const hairline = cockpitCSSVar('--hairline') || 'rgba(184,151,78,0.22)';
    const textDim = cockpitCSSVar('--text-dim') || '#9B968C';
    cockpitChartInstance = new Chart(canvas.getContext('2d'), {
      data: {labels: series.labels, datasets: datasets.map(({key, ...d}) => d)},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: {mode: 'index', intersect: false},
        animation: {duration: 260},
        scales: {
          x: {stacked: true, grid: {color: hairline}, ticks: {color: textDim, font: {family: "'IBM Plex Mono', monospace", size: 10.5}}},
          y: {stacked: true, grid: {color: hairline}, ticks: {color: textDim, callback: v => fmtEUR(v)}}
        },
        plugins: {
          legend: {labels: {color: textDim, boxWidth: 10, font: {size: 11}}},
          tooltip: {
            backgroundColor: cockpitCSSVar('--onyx') || '#0B0B0D',
            titleColor: cockpitCSSVar('--gold-bright') || '#D9BC7C',
            bodyColor: cockpitCSSVar('--text') || '#EDE8DE',
            borderColor: 'rgba(212,175,55,0.35)', borderWidth: 1,
            callbacks: {
              label: ctx => `${ctx.dataset.label} : ${ctx.parsed.y === null ? 'donnée non disponible' : fmtEUR(ctx.parsed.y)}`
            }
          }
        }
      }
    });
    cockpitChartInstance.data.datasetKeys = datasets.map(d => d.key);
    updateCockpitChartView(cockpitActiveView);
  }
  buildOrUpdateChart();

  document.getElementById('cockpitChartRange').addEventListener('change', e => {
    cockpitChartRangeKey = e.target.value;
    buildOrUpdateChart();
  });
  el.querySelectorAll('.cockpit-chart-tab').forEach(btn => {
    btn.addEventListener('click', () => setCockpitView(btn.dataset.view));
  });
}

// ============================================================
// Colonne latérale : donut interactif, revenus passifs estimés,
// prochaines actions. (Comptes/Objectifs/Allocation vivent désormais dans
// la rangée de panneaux sous le graphique — voir renderCockpitPanelsRow —
// pour se rapprocher de la disposition de l'image de référence.)
// ============================================================
function renderCockpitSide(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <div class="cockpit-panel" id="${elId}-donut"></div>
    <div class="cockpit-panel" id="${elId}-revenus"></div>
    <div class="cockpit-panel" id="${elId}-actions"></div>`;
  renderCockpitDonut(`${elId}-donut`);
  renderCockpitRevenusPassifsPanel(`${elId}-revenus`);
  renderCockpitActionsPanel(`${elId}-actions`);
}

// ---------- Onglet Patrimoine (Comptes / Allocation) — les Objectifs ont
// leur propre onglet (renderCockpitObjectifs, appelé directement depuis
// renderCockpitBody), le Portefeuille (positions réelles) le sien
// (renderCockpitPortefeuilleTab) : ancienne rangée à 3 panneaux éclatée en
// onglets distincts (sprint de consolidation 09/09/2026, section 5). ----------
function renderCockpitPatrimoineTab(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <div class="cockpit-panel" id="${elId}-accounts"></div>
    <div class="cockpit-panel" id="${elId}-allocation"></div>`;
  renderCockpitAccounts(`${elId}-accounts`);
  renderCockpitAllocation(`${elId}-allocation`);
}

// ---------- Donut interactif ----------
let cockpitDonutInstance = null;
let cockpitAccountsFilter = null; // catégorie active pour le filtre comptes (clic donut/légende)
function renderCockpitDonut(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const segs = getWealthAllocationSegments(cockpitAssets(), cockpitDebts());
  if(segs.length === 0){
    el.innerHTML = `<span class="panel-title">Répartition du patrimoine</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">Renseigne ton patrimoine pour voir apparaître sa répartition ici.</p>`;
    return;
  }
  const net = computeNetWorth(cockpitAssets(), cockpitDebts());
  el.innerHTML = `
    <span class="panel-title">Répartition du patrimoine</span>
    <div style="position:relative;margin-top:12px;height:200px;">
      <canvas id="${elId}-canvas"></canvas>
      <div class="cockpit-donut-center" id="${elId}-center">
        <div class="cockpit-donut-total mono">${fmtEUR(net.patrimoineNet)}</div>
        <div class="cockpit-donut-label">Patrimoine total</div>
      </div>
    </div>
    <div class="cockpit-donut-legend" id="${elId}-legend">
      ${segs.map(s => `
        <button type="button" class="cockpit-donut-legend-row ${s.key === cockpitAccountsFilter ? 'active' : ''}" data-key="${s.key}">
          <span class="cockpit-donut-legend-dot" style="background:${s.color};color:${s.color};"></span>
          <span class="cockpit-donut-legend-label">${s.label}</span>
          <span class="cockpit-donut-legend-value mono">${fmtEUR(s.value)} · ${Math.round(s.pct)} %</span>
        </button>`).join('')}
    </div>`;

  const canvas = document.getElementById(`${elId}-canvas`);
  const centerTotal = document.getElementById(`${elId}-center`).querySelector('.cockpit-donut-total');
  const centerLabel = document.getElementById(`${elId}-center`).querySelector('.cockpit-donut-label');
  if(!canvas || typeof Chart === 'undefined') return;
  if(cockpitDonutInstance) cockpitDonutInstance.destroy();

  function selectCategory(key){
    cockpitAccountsFilter = cockpitAccountsFilter === key ? null : key;
    document.querySelectorAll(`#${elId}-legend .cockpit-donut-legend-row`).forEach(row => {
      row.classList.toggle('active', row.dataset.key === cockpitAccountsFilter);
    });
    // Le détail par compte vit désormais dans l'onglet Patrimoine (sprint de
    // consolidation 09/09/2026) — cliquer une catégorie du donut (Vue
    // d'ensemble) y bascule directement plutôt que de filtrer un panneau
    // invisible sur l'onglet courant.
    setCockpitActiveTab('tab-patrimoine');
    renderCockpitAccounts('cockpitPatrimoineBody-accounts');
  }

  cockpitDonutInstance = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: segs.map(s => s.label),
      datasets: [{data: segs.map(s => s.value), backgroundColor: segs.map(s => s.color), borderWidth: 0, hoverOffset: 8}]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      animation: {duration: 260},
      plugins: {
        legend: {display: false},
        tooltip: {
          backgroundColor: cockpitCSSVar('--onyx') || '#0B0B0D', titleColor: cockpitCSSVar('--gold-bright') || '#D9BC7C', bodyColor: cockpitCSSVar('--text') || '#EDE8DE',
          borderColor: 'rgba(212,175,55,0.35)', borderWidth: 1,
          callbacks: {label: ctx => `${ctx.label} : ${fmtEUR(ctx.parsed)}`}
        }
      },
      onHover: (evt, elements) => {
        if(elements.length){
          const seg = segs[elements[0].index];
          centerTotal.textContent = fmtEUR(seg.value);
          centerLabel.textContent = seg.label;
        } else {
          centerTotal.textContent = fmtEUR(net.patrimoineNet);
          centerLabel.textContent = 'Patrimoine total';
        }
      },
      onClick: (evt, elements) => {
        if(elements.length) selectCategory(segs[elements[0].index].key);
      }
    }
  });

  document.getElementById(`${elId}-legend`).querySelectorAll('.cockpit-donut-legend-row').forEach(row => {
    row.addEventListener('click', () => selectCategory(row.dataset.key));
  });
}

// ---------- Mes comptes & enveloppes ----------
function renderCockpitAccounts(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const assets = cockpitAssets();
  if(assets.length === 0){
    el.innerHTML = `<span class="panel-title">Mes comptes &amp; enveloppes</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">Aucun compte enregistré pour l'instant.</p><button type="button" class="btn btn-sm btn-gold" style="margin-top:10px;" onclick="openOnboardingDrawer()">Ajouter un compte →</button>`;
    return;
  }
  const filtered = cockpitAccountsFilter ? assets.filter(a => a.categorie === cockpitAccountsFilter) : assets;
  const sorted = filtered.slice().sort((a, b) => b.valeur - a.valeur);
  el.innerHTML = `
    <span class="panel-title">Mes comptes &amp; enveloppes${cockpitDemoMode ? '' : ` <a href="laboratoire.html#tab-budget-epargne">Voir tout →</a>`}</span>
    ${cockpitAccountsFilter ? `<p style="font-size:11px;color:var(--gold-bright);margin-top:8px;">Filtré : ${NET_WORTH_CATEGORY_LABELS[cockpitAccountsFilter] || cockpitAccountsFilter} <button type="button" id="${elId}-clear-filter" style="background:none;border:none;color:var(--text-dim);cursor:pointer;text-decoration:underline;margin-left:4px;">retirer ×</button></p>` : ''}
    <div style="margin-top:6px;">
      ${sorted.length === 0
        ? `<p style="font-size:12.5px;color:var(--text-dim);padding:8px 0;">Aucun compte dans cette catégorie.</p>`
        : sorted.map(a => `
        <a href="laboratoire.html#tab-budget-epargne" class="cockpit-account-row">
          <span>${a.nom}<span class="cockpit-account-cat">${NET_WORTH_CATEGORY_LABELS[a.categorie] || a.categorie}</span></span>
          <span class="mono">${fmtEUR(a.valeur)}</span>
        </a>`).join('')}
    </div>`;
  if(cockpitAccountsFilter){
    const clearBtn = document.getElementById(`${elId}-clear-filter`);
    if(clearBtn) clearBtn.addEventListener('click', () => {
      cockpitAccountsFilter = null;
      document.querySelectorAll('.cockpit-donut-legend-row').forEach(row => row.classList.remove('active'));
      renderCockpitAccounts(elId);
    });
  }
}

// ---------- Mes objectifs (goals financiers réels ou d'exemple + projets de vie réels) ----------
function renderCockpitObjectifs(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <span class="panel-title">Mes objectifs${cockpitDemoMode ? '' : ` <a href="laboratoire.html#tab-budget-epargne">Voir tous →</a>`}</span>
    <div id="${elId}-goals" style="margin-top:8px;"></div>
    <div id="${elId}-projects" style="margin-top:14px;"></div>`;
  renderGoalsDashboardWidget(`${elId}-goals`, cockpitGoals());
  renderLifeProjectsDashboardWidget(`${elId}-projects`, cockpitLifeProjects());
}

// ---------- Allocation globale (barres horizontales) ----------
function renderCockpitAllocation(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const segs = getWealthAllocationSegments(cockpitAssets(), cockpitDebts());
  if(segs.length === 0){
    el.innerHTML = `<span class="panel-title">Allocation globale</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">Aucune donnée pour l'instant.</p>`;
    return;
  }
  const sorted = segs.slice().sort((a, b) => b.pct - a.pct);
  el.innerHTML = `
    <span class="panel-title">Allocation globale</span>
    <div style="display:flex;flex-direction:column;gap:9px;margin-top:10px;">
      ${sorted.map(s => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px;"><span>${s.label}</span><span class="mono">${Math.round(s.pct)} %</span></div>
          <div class="cockpit-allocation-bar"><div class="cockpit-allocation-fill" style="width:${s.pct}%;background:${s.color};color:${s.color};"></div></div>
        </div>`).join('')}
    </div>`;
}

// ============================================================
// Onglet Portefeuille (sprint de consolidation 09/09/2026, section 12 du
// prompt d'origine) : consolide le MÊME registre réel que Bourse
// (fzr-real-portfolio, computeRealPortfolioPositions/computeRealPortfolioTotals,
// scripts/data.js) — jamais un 2e calculateur. Mon Univers observe, Bourse
// reste l'endroit où on déclare/gère ses transactions (lien direct fourni,
// jamais dupliqué ici). Le paper trading (fzr-paper-trading, un registre de
// simulation) n'est jamais mélangé à ce portefeuille réel.
// ============================================================
function cockpitFetchPortfolioQuotes(tickers){
  const missing = tickers.filter(t => !STOCKS_DEMO.find(s => s.ticker === t) && !(t in followedQuotesCache));
  if(missing.length === 0 || location.protocol === 'file:') return Promise.resolve();
  return fetch('/api/custom-quotes?symbols=' + encodeURIComponent(missing.join(',')))
    .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(payload => {
      (payload.quotes || []).forEach(q => {
        if(typeof q.price === 'number') followedQuotesCache[q.symbol] = {price: q.price, changePercent: q.changePercent, history: q.history, currency: q.currency};
      });
    })
    .catch(() => {});
}
// secteur/pays : réels pour les 8 valeurs STOCKS_DEMO (resolveFollowedAsset),
// `null` sinon — jamais devinés pour une valeur suivie hors de ce curatage.
function cockpitEnrichedPortfolioPositions(){
  const transactions = getRealPortfolio();
  const livePrices = {};
  transactions.forEach(tx => {
    const r = resolveFollowedAsset(tx.ticker);
    if(typeof r.prix === 'number') livePrices[tx.ticker] = r.prix;
  });
  const positions = computeRealPortfolioPositions(transactions, livePrices);
  return positions.map(p => {
    const r = resolveFollowedAsset(p.ticker);
    return {...p, secteur: r.secteur, pays: r.pays};
  });
}
function renderCockpitPortefeuilleTab(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  if(cockpitDemoMode){
    el.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Le portefeuille réel n'est pas simulé en mode aperçu — déclare tes transactions réelles dans Bourse pour le voir apparaître ici.</p><a href="bourse.html#tab-portefeuille" class="btn btn-sm btn-gold" style="margin-top:10px;">Ouvrir Bourse →</a>`;
    return;
  }
  const transactions = getRealPortfolio();
  if(transactions.length === 0){
    el.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Aucune transaction réelle enregistrée. Déclare tes achats (action, quantité, prix, date) dans Bourse pour voir ton portefeuille consolidé ici.</p><a href="bourse.html#tab-portefeuille" class="btn btn-sm btn-gold" style="margin-top:10px;">Déclarer mes transactions →</a>`;
    return;
  }
  const tickers = [...new Set(transactions.map(t => t.ticker))];
  el.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Chargement des cotations…</p>`;
  cockpitFetchPortfolioQuotes(tickers).then(() => {
    const positions = cockpitEnrichedPortfolioPositions();
    const totals = computeRealPortfolioTotals(positions);
    el.innerHTML = `
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('fait')} Les mêmes transactions réelles que dans Bourse, jamais un 2e registre. <a href="bourse.html#tab-portefeuille">Gérer mes transactions →</a></p>
      ${renderRealPortfolioHTML(positions, totals)}`;
  });
}

// ============================================================
// Onglet Risques (sprint de consolidation 09/09/2026, section 14-16 du
// prompt d'origine) : jamais un score de risque opaque — des signaux
// explicables (concentration réelle par position/secteur/pays, calculée sur
// le MÊME portefeuille que l'onglet Portefeuille) + la Santé financière
// (computeHealthScore, 6 axes déjà réels) déplacée ici depuis l'ancienne
// section "Suite de l'apprentissage" : un signal financier, jamais un
// contenu d'apprentissage.
// ============================================================
function renderCockpitRisquesTab(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <div class="cockpit-panel" id="${elId}-health" style="margin-bottom:16px;"></div>
    <div class="cockpit-panel" id="${elId}-concentration" style="margin-bottom:16px;"></div>
    <div class="cockpit-panel" id="${elId}-exposure"></div>`;
  renderHealthScoreDashboardWidget(`${elId}-health`);
  renderCockpitConcentrationPanel(`${elId}-concentration`);
  renderCockpitGoalExposurePanel(`${elId}-exposure`);
}
function renderCockpitConcentrationPanel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  if(cockpitDemoMode || getRealPortfolio().length === 0){
    el.innerHTML = `<span class="panel-title">Concentration du portefeuille</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Déclare tes transactions réelles dans Bourse pour voir ta concentration par position/secteur/pays ici.</p>`;
    return;
  }
  el.innerHTML = `<span class="panel-title">Concentration du portefeuille</span><p style="font-size:12px;color:var(--text-dim);margin-top:8px;">Chargement…</p>`;
  const tickers = [...new Set(getRealPortfolio().map(t => t.ticker))];
  cockpitFetchPortfolioQuotes(tickers).then(() => {
    const positions = cockpitEnrichedPortfolioPositions();
    const conc = computeRealPortfolioConcentration(positions);
    if(!conc){
      el.innerHTML = `<span class="panel-title">Concentration du portefeuille</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Cours actuels indisponibles pour l'instant — réessaie plus tard.</p>`;
      return;
    }
    function barsHtml(groups, coveragePct, emptyLabel){
      if(groups.length === 0) return `<p style="font-size:12px;color:var(--text-dim);">${emptyLabel}</p>`;
      return `
        <div style="display:flex;flex-direction:column;gap:7px;">
          ${groups.slice(0, 6).map(g => `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px;"><span>${g.label}</span><span class="mono">${g.pct.toFixed(0)} %</span></div>
              <div class="cockpit-allocation-bar"><div class="cockpit-allocation-fill" style="width:${g.pct}%;background:var(--gold);"></div></div>
            </div>`).join('')}
        </div>
        ${coveragePct < 99.5 ? `<p style="font-size:11px;color:var(--text-dim);margin-top:8px;">${(100 - coveragePct).toFixed(0)} % du portefeuille n'a pas de classification connue (valeur suivie hors des 8 valeurs curatées).</p>` : ''}`;
    }
    el.innerHTML = `
      <span class="panel-title">Concentration du portefeuille</span>
      <p style="font-size:12px;color:var(--text-dim);margin:8px 0 14px;">${renderDataBadge('calcul')} Calculée sur les positions dont le cours actuel est connu — jamais un score unique, seulement ces ratios réels.</p>
      <p style="font-size:13px;margin-bottom:12px;">Ta position la plus importante représente <strong style="color:${conc.topPositionPct >= 30 ? 'var(--bordeaux)' : 'var(--text)'};">${conc.topPositionPct.toFixed(0)} %</strong> de ton portefeuille (${conc.byPosition[0].label}).</p>
      <span class="smallcaps" style="display:block;margin:14px 0 8px;">Par secteur</span>
      ${barsHtml(conc.bySecteur, conc.secteurCoveragePct, 'Secteur non connu pour tes positions actuelles.')}
      <span class="smallcaps" style="display:block;margin:14px 0 8px;">Par pays</span>
      ${barsHtml(conc.byPays, conc.paysCoveragePct, 'Pays non connu pour tes positions actuelles.')}
      <p class="disclaimer-box" style="margin-top:14px;">Une forte concentration (position, secteur ou pays) n'est ni bonne ni mauvaise en soi — elle augmente simplement l'impact d'un événement propre à cette position/secteur/pays sur l'ensemble de ton portefeuille.</p>`;
  });
}
// "Objectifs court terme exposés au marché" (section 16) : ne sait PAS quel
// actif finance précisément quel objectif (aucun lien de ce type n'existe
// dans le modèle de données réel, FinancialGoal n'a pas de linkedAccounts) —
// un rapprochement général et hedgé entre l'horizon le plus proche et
// l'exposition globale aux marchés, jamais une attribution précise fabriquée.
function renderCockpitGoalExposurePanel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const goals = (cockpitGoals() || getFinancialGoals()).filter(g => g.dateCible);
  const now = new Date();
  const soonGoals = goals.filter(g => {
    const d = new Date(g.dateCible + 'T00:00:00');
    const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
    return months >= 0 && months <= 12;
  });
  const assets = cockpitAssets();
  const totalAssets = assets.reduce((s, a) => s + a.valeur, 0);
  const marketExposed = assets.filter(a => ['pea', 'cto', 'crypto', 'actions'].includes(a.categorie)).reduce((s, a) => s + a.valeur, 0);
  const marketExposedPct = totalAssets > 0 ? (marketExposed / totalAssets) * 100 : 0;
  el.innerHTML = `
    <span class="panel-title">Objectifs proches et marché</span>
    ${soonGoals.length === 0
      ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Aucun objectif avec une échéance dans les 12 prochains mois.</p>`
      : `<p style="font-size:13px;margin-top:8px;">${soonGoals.length} objectif${soonGoals.length > 1 ? 's' : ''} avec une échéance dans les 12 prochains mois : ${soonGoals.map(g => g.nom).join(', ')}.</p>
         ${marketExposedPct > 20 ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">${renderDataBadge('avis')} ${marketExposedPct.toFixed(0)} % de ton patrimoine est exposé aux marchés (PEA/CTO/crypto/actions) — une baisse des marchés dans les prochains mois pourrait réduire ce dont tu disposes, si l'argent destiné à un objectif proche en fait partie.</p>` : ''}`}
    <p class="disclaimer-box" style="margin-top:12px;">Ce signal ne sait pas quel actif finance précisément quel objectif (aucun lien de ce type n'existe aujourd'hui dans tes données) — un rapprochement général entre ton horizon le plus proche et ton exposition globale aux marchés, jamais une analyse précise par objectif.</p>`;
}

// ---------- Revenus passifs estimés (panneau compact, colonne latérale) ----------
function renderCockpitRevenusPassifsPanel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const est = computeCapitalIncomeEstimate(cockpitAssets(), cockpitDebts(), cockpitBudgetEntries());
  if(!est){
    el.innerHTML = `<span class="panel-title">Revenus passifs estimés</span><p style="font-size:12px;color:var(--text-dim);margin-top:8px;">Renseigne ton patrimoine pour voir une estimation ici.</p>`;
    return;
  }
  el.innerHTML = `
    <span class="panel-title">Revenus passifs estimés</span>
    <div class="result-big" style="font-size:22px;margin-top:6px;">${fmtEUR(est.monthlyEstimate)} <span style="font-size:11px;color:var(--text-dim);font-weight:400;">/ mois</span></div>
    <p style="font-size:11px;color:var(--text-dim);margin-top:4px;">Soit ${fmtEUR(est.annualEstimate)} / an (projection, scénario central ${est.ratePct} %).</p>`;
}

// ---------- Prochaines actions (réutilise computeUnifiedAlerts quand des
// diagnostics réels existent ; complète toujours avec de vrais raccourcis
// statiques vers des pages/fonctions réelles du site — jamais un texte
// générique inventé sans lien réel derrière). ----------
function renderCockpitActionsPanel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const realAlerts = cockpitDemoMode ? [] : computeUnifiedAlerts().slice(0, 2);
  const staticActions = [
    {label: 'Compléter mon profil financier', sub: 'Améliore tes recommandations personnalisées', href: 'profil.html'},
    {label: 'Simuler mon patrimoine futur', sub: 'Projette ton capital à 5, 10 ou 20 ans', action: "setCockpitActiveTab('tab-projections')"},
    {label: 'PEA ou compte-titres ?', sub: 'Compare les deux enveloppes sur de vrais critères', href: 'guide-pea-ou-cto.html'}
  ].slice(0, Math.max(1, 3 - realAlerts.length));
  el.innerHTML = `
    <span class="panel-title">Prochaines actions</span>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
      ${realAlerts.map(a => `<a href="${a.lien}" class="cockpit-account-row" style="border:none;padding:6px 0;"><span>${a.message}</span><span class="mono" style="color:var(--gold-bright);">${a.cta} →</span></a>`).join('')}
      ${staticActions.map(a => `<${a.href ? 'a href="'+a.href+'"' : 'button type="button" onclick="'+a.action+'"'} class="cockpit-account-row" style="border:none;padding:6px 0;background:none;text-align:left;width:100%;cursor:pointer;font:inherit;color:inherit;">
        <span>${a.label}<span class="cockpit-account-cat">${a.sub}</span></span>
        <span class="mono" style="color:var(--gold-bright);">→</span>
      </${a.href ? 'a' : 'button'}>`).join('')}
    </div>`;
}

// ============================================================
// Modal "Projeter mon capital" — <dialog> natif, aucune librairie : focus
// intégrée directement dans l'onglet Projections (sprint de consolidation
// 09/09/2026, section 19 du prompt d'origine : "elle ne doit plus être un
// bloc isolé sur une page incohérente") — plus un <dialog> séparé. Recalcul
// en direct via le vrai moteur computeWealthProjection (data.js, déjà
// utilisé par "Mon Futur"/Trajectoire), jamais un 2e calcul divergent.
// Champs pré-remplis avec le vrai patrimoine/solde (ou l'aperçu démo).
// Scénarios de choc (-10/-20/-30/-40/-50 %, section 21) : une baisse
// PONCTUELLE appliquée au capital de départ, jamais suivie d'un rebond
// automatique — toute reprise suppose le même rendement hypothétique choisi
// ci-dessus, appliqué à partir du capital déjà réduit.
// ============================================================
const COCKPIT_PROJECTION_HORIZONS = [1, 5, 10, 20];
const COCKPIT_CRASH_SCENARIOS = [-10, -20, -30, -40, -50];
function computeCockpitProjectionResults(){
  const capitalEl = document.getElementById('cpCapital');
  if(!capitalEl) return; // onglet pas encore rendu
  const capitalSaisi = +capitalEl.value || 0;
  const versement = +document.getElementById('cpVersement').value || 0;
  const rendement = +document.getElementById('cpRendement').value || 0;
  const activeCrashBtn = document.querySelector('.cockpit-crash-btn.active');
  const crashPct = activeCrashBtn ? +activeCrashBtn.dataset.crash : 0;
  const capitalApresChoc = capitalSaisi * (1 + crashPct / 100);
  const result = computeWealthProjection({patrimoineInitial: capitalApresChoc, epargneMensuelle: versement, rendementAnnuelPct: rendement, inflationPct: 0, augmentationAnnuellePct: 0});
  const resultsEl = document.getElementById('cpResults');
  if(!resultsEl) return;
  resultsEl.innerHTML = `
    <div class="result-row"><span class="result-horizon">Aujourd'hui${crashPct !== 0 ? ` (après choc ${crashPct} %)` : ''}</span><span class="result-value mono">${fmtEUR(capitalApresChoc)}</span></div>
    ${COCKPIT_PROJECTION_HORIZONS.map(h => `
      <div class="result-row"><span class="result-horizon">${h} an${h > 1 ? 's' : ''}</span><span class="result-value mono">${fmtEUR(result.atHorizon[h].patrimoineNominal)}</span></div>`).join('')}`;
}
function renderCockpitProjectionsTab(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const k = computeCockpitKPIs(cockpitAssets(), cockpitDebts(), cockpitBudgetEntries());
  el.innerHTML = `
    <div class="card" style="max-width:640px;">
      <span class="panel-title">Où pourrait aller ton patrimoine ?</span>
      <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${renderDataBadge('scenario')} Un scénario, jamais une prévision — un calcul mécanique à partir des hypothèses ci-dessous, que tu peux modifier librement.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;">
        <div class="field" style="flex:1;min-width:140px;"><label for="cpCapital">Capital actuel (€)</label><input type="number" id="cpCapital" min="0" step="100" value="${Math.round(k.patrimoineNet)}"></div>
        <div class="field" style="flex:1;min-width:140px;"><label for="cpVersement">Versement mensuel (€)</label><input type="number" id="cpVersement" min="0" step="10" value="${Math.round(Math.max(0, k.soldeMensuel))}"></div>
        <div class="field" style="flex:1;min-width:120px;"><label for="cpRendement">Rendement estimé (%/an)</label><input type="number" id="cpRendement" min="0" max="20" step="0.5" value="6"></div>
      </div>
      <div style="margin-top:16px;">
        <span class="smallcaps" style="display:block;margin-bottom:8px;">Et si le marché chutait aujourd'hui ?</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-sm cockpit-crash-btn active" data-crash="0">Aucun choc</button>
          ${COCKPIT_CRASH_SCENARIOS.map(c => `<button type="button" class="btn btn-sm cockpit-crash-btn" data-crash="${c}">${c} %</button>`).join('')}
        </div>
      </div>
      <div id="cpResults" style="margin-top:16px;"></div>
      <p class="disclaimer-box" style="margin-top:12px;">Simulation pédagogique — rendement non garanti, jamais une certitude. Un choc de marché n'est jamais suivi ici d'un rebond automatique : toute récupération après un choc suppose le même rendement hypothétique que tu as choisi ci-dessus, appliqué à partir du capital déjà réduit.</p>
    </div>`;
  ['cpCapital', 'cpVersement', 'cpRendement'].forEach(id => {
    document.getElementById(id).addEventListener('input', computeCockpitProjectionResults);
  });
  el.querySelectorAll('.cockpit-crash-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.cockpit-crash-btn').forEach(b => b.classList.toggle('active', b === btn));
      computeCockpitProjectionResults();
    });
  });
  computeCockpitProjectionResults();
}

// ============================================================
// Drawer "Configurer mes finances" — panneau latéral (jamais une nouvelle
// page), écrit directement dans les vraies fonctions de sauvegarde
// (saveNetWorthAsset/saveBudgetEntry/saveFinancialGoal) : aucun store
// parallèle, aucune donnée fabriquée. Dès le premier vrai enregistrement,
// le mode démo est définitivement désactivé et tout le cockpit est
// reconstruit avec la vraie donnée qui vient d'être saisie.
// ============================================================
let cockpitDrawerLastFocus = null;
function exitCockpitDemoModeIfNeeded(){
  if(cockpitDemoMode){
    cockpitDemoMode = false;
    rerenderCockpit();
  }
}
function renderOnboardingDrawerBody(){
  const body = document.getElementById('onboardingDrawerBody');
  if(!body) return;
  const catOptions = NET_WORTH_ASSET_CATEGORIES.map(c => `<option value="${c}">${NET_WORTH_CATEGORY_LABELS[c] || c}</option>`).join('');
  body.innerHTML = `
    <div class="cockpit-drawer-section">
      <span class="section-eyebrow">Comptes &amp; investissements</span>
      <div class="cockpit-drawer-row">
        <div class="field"><label for="drawerAssetNom">Nom</label><input type="text" id="drawerAssetNom" placeholder="Livret A"></div>
        <div class="field"><label for="drawerAssetCategorie">Catégorie</label><select id="drawerAssetCategorie">${catOptions}</select></div>
      </div>
      <div class="cockpit-drawer-row">
        <div class="field"><label for="drawerAssetValeur">Valeur (€)</label><input type="number" id="drawerAssetValeur" min="0" value="1000"></div>
        <button type="button" class="btn btn-sm btn-gold" id="drawerAssetAdd" style="align-self:flex-end;">+ Ajouter</button>
      </div>
      <p id="drawerAssetError" style="font-size:12px;color:var(--bordeaux);display:none;"></p>
      <div class="cockpit-drawer-list" id="drawerAssetList"></div>
    </div>
    <div class="cockpit-drawer-section">
      <span class="section-eyebrow">Revenus &amp; dépenses (ce mois-ci)</span>
      <div class="cockpit-drawer-row">
        <div class="field"><label for="drawerBudgetType">Type</label><select id="drawerBudgetType"><option value="revenu">Revenu</option><option value="depense">Dépense</option></select></div>
        <div class="field"><label for="drawerBudgetCategorie">Catégorie</label><select id="drawerBudgetCategorie"></select></div>
      </div>
      <div class="cockpit-drawer-row">
        <div class="field"><label for="drawerBudgetMontant">Montant (€)</label><input type="number" id="drawerBudgetMontant" min="0" value="500"></div>
        <button type="button" class="btn btn-sm btn-gold" id="drawerBudgetAdd" style="align-self:flex-end;">+ Ajouter</button>
      </div>
      <p id="drawerBudgetError" style="font-size:12px;color:var(--bordeaux);display:none;"></p>
      <div class="cockpit-drawer-list" id="drawerBudgetList"></div>
    </div>
    <div class="cockpit-drawer-section">
      <span class="section-eyebrow">Objectifs</span>
      <div class="cockpit-drawer-row">
        <div class="field" style="flex:2;"><label for="drawerGoalNom">Nom</label><input type="text" id="drawerGoalNom" placeholder="Voiture"></div>
      </div>
      <div class="cockpit-drawer-row">
        <div class="field"><label for="drawerGoalCible">Montant cible (€)</label><input type="number" id="drawerGoalCible" min="0" value="10000"></div>
        <div class="field"><label for="drawerGoalActuel">Déjà épargné (€)</label><input type="number" id="drawerGoalActuel" min="0" value="0"></div>
      </div>
      <div class="cockpit-drawer-row">
        <div class="field"><label for="drawerGoalVersement">Versement mensuel (€)</label><input type="number" id="drawerGoalVersement" min="0" value="0"></div>
        <button type="button" class="btn btn-sm btn-gold" id="drawerGoalAdd" style="align-self:flex-end;">+ Ajouter</button>
      </div>
      <p id="drawerGoalError" style="font-size:12px;color:var(--bordeaux);display:none;"></p>
      <div class="cockpit-drawer-list" id="drawerGoalList"></div>
    </div>`;

  function refreshBudgetCategories(){
    const type = document.getElementById('drawerBudgetType').value;
    document.getElementById('drawerBudgetCategorie').innerHTML = BUDGET_CATEGORIES[type].map(c => `<option value="${c}">${c}</option>`).join('');
  }
  refreshBudgetCategories();
  document.getElementById('drawerBudgetType').addEventListener('change', refreshBudgetCategories);

  function refreshLists(){
    const assets = getNetWorthAssets();
    document.getElementById('drawerAssetList').innerHTML = assets.length === 0 ? '' : assets.map(a => `<div class="cockpit-drawer-list-row"><span>${a.nom}</span><span class="mono">${fmtEUR(a.valeur)}</span></div>`).join('');
    const entries = getBudgetEntries().filter(e => e.mois === currentMonthKey());
    document.getElementById('drawerBudgetList').innerHTML = entries.length === 0 ? '' : entries.map(e => `<div class="cockpit-drawer-list-row"><span>${e.categorie} (${e.type})</span><span class="mono">${fmtEUR(e.montant)}</span></div>`).join('');
    const goals = getFinancialGoals();
    document.getElementById('drawerGoalList').innerHTML = goals.length === 0 ? '' : goals.map(g => `<div class="cockpit-drawer-list-row"><span>${g.nom}</span><span class="mono">${fmtEUR(g.montantActuel)}/${fmtEUR(g.montantCible)}</span></div>`).join('');
  }
  refreshLists();

  // Gap Closure Sprint P2, phase 16 (06/09/2026) : les 3 handlers ci-dessous
  // ne faisaient jusqu'ici RIEN de visible en cas d'échec de sauvegarde (nom
  // vide, montant nul/négatif) — le clic semblait ne pas fonctionner, sans
  // aucune explication. Ajoute un message honnête à côté du bouton, jamais
  // une nouvelle règle de validation (saveNetWorthAsset/saveBudgetEntry/
  // saveFinancialGoal restent les seules sources de vérité sur ce qui est
  // valide).
  function showDrawerError(id, message){
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = message;
    el.style.display = message ? '' : 'none';
  }
  document.getElementById('drawerAssetAdd').addEventListener('click', () => {
    const nom = document.getElementById('drawerAssetNom').value;
    const categorie = document.getElementById('drawerAssetCategorie').value;
    const valeur = +document.getElementById('drawerAssetValeur').value || 0;
    if(saveNetWorthAsset({nom, categorie, valeur})){
      showDrawerError('drawerAssetError', '');
      document.getElementById('drawerAssetNom').value = '';
      exitCockpitDemoModeIfNeeded();
      refreshLists();
    } else {
      showDrawerError('drawerAssetError', 'Vérifie le nom (non vide) et la valeur (positive ou nulle).');
    }
  });
  document.getElementById('drawerBudgetAdd').addEventListener('click', () => {
    const type = document.getElementById('drawerBudgetType').value;
    const categorie = document.getElementById('drawerBudgetCategorie').value;
    const montant = +document.getElementById('drawerBudgetMontant').value || 0;
    if(saveBudgetEntry({type, categorie, montant, mois: currentMonthKey()})){
      showDrawerError('drawerBudgetError', '');
      exitCockpitDemoModeIfNeeded();
      refreshLists();
    } else {
      showDrawerError('drawerBudgetError', 'Le montant doit être strictement positif.');
    }
  });
  document.getElementById('drawerGoalAdd').addEventListener('click', () => {
    const nom = document.getElementById('drawerGoalNom').value;
    const montantCible = +document.getElementById('drawerGoalCible').value || 0;
    const montantActuel = +document.getElementById('drawerGoalActuel').value || 0;
    const versementMensuel = +document.getElementById('drawerGoalVersement').value || 0;
    if(saveFinancialGoal({nom, montantCible, montantActuel, versementMensuel, dateCible: null})){
      showDrawerError('drawerGoalError', '');
      document.getElementById('drawerGoalNom').value = '';
      exitCockpitDemoModeIfNeeded();
      refreshLists();
    } else {
      showDrawerError('drawerGoalError', 'Vérifie le nom (non vide) et le montant cible (positif).');
    }
  });
}
function openOnboardingDrawer(){
  const backdrop = document.getElementById('onboardingDrawerBackdrop');
  const drawer = document.getElementById('onboardingDrawer');
  if(!backdrop || !drawer) return;
  renderOnboardingDrawerBody();
  backdrop.hidden = false; drawer.hidden = false;
  requestAnimationFrame(() => { backdrop.classList.add('open'); drawer.classList.add('open'); });
  cockpitDrawerLastFocus = document.activeElement;
}
function closeOnboardingDrawer(){
  const backdrop = document.getElementById('onboardingDrawerBackdrop');
  const drawer = document.getElementById('onboardingDrawer');
  if(!backdrop || !drawer) return;
  backdrop.classList.remove('open'); drawer.classList.remove('open');
  setTimeout(() => { backdrop.hidden = true; drawer.hidden = true; }, 280);
  if(cockpitDrawerLastFocus && cockpitDrawerLastFocus.focus) cockpitDrawerLastFocus.focus();
}
function initOnboardingDrawer(){
  const backdrop = document.getElementById('onboardingDrawerBackdrop');
  const closeBtn = document.getElementById('onboardingDrawerClose');
  if(backdrop) backdrop.addEventListener('click', closeOnboardingDrawer);
  if(closeBtn) closeBtn.addEventListener('click', closeOnboardingDrawer);
  document.addEventListener('keydown', e => {
    const drawer = document.getElementById('onboardingDrawer');
    if(e.key === 'Escape' && drawer && !drawer.hidden) closeOnboardingDrawer();
  });
}

// ============================================================
// Synchronisation thème clair/sombre — Chart.js lit les couleurs une seule
// fois à la construction (cockpitCSSVar) : sans ce câblage, un changement
// de thème après coup laisserait les graphiques dans les anciennes
// couleurs. N'ajoute PAS de logique dans initTheme (data.js, partagée par
// tout le site) — un 2e écouteur sur le même bouton, réservé à cette page,
// reconstruit simplement les graphiques avec les nouvelles variables CSS.
// setTimeout(...,0) : le clic déclenche AUSSI le gestionnaire de initTheme
// sur le même événement — celui-ci doit avoir fini d'appliquer le nouvel
// attribut data-theme avant qu'on relise les couleurs, d'où le report
// d'un tick.
// ============================================================
function initCockpitThemeSync(){
  const themeBtn = document.getElementById('themeToggle');
  if(!themeBtn) return;
  themeBtn.addEventListener('click', () => {
    setTimeout(() => {
      const savedView = cockpitActiveView;
      const savedFilter = cockpitAccountsFilter;
      renderCockpitChart('cockpitChart');
      setCockpitView(savedView);
      cockpitAccountsFilter = savedFilter;
      renderCockpitSide('cockpitSide');
      renderCockpitPatrimoineTab('cockpitPatrimoineBody');
    }, 0);
  });
}

initCockpitThemeSync();
initOnboardingDrawer();
initParcoursHero();

// Profil de simulation (âge/épargne/horizon/risque/objectif — pré-remplit
// les outils du site) : relocalisé depuis Mon Compte (sprint de fermeture
// des écarts, 04/09/2026, phase 6). Ce sont de vraies données financières,
// leur place est ici plutôt que dans les paramètres de compte. Toujours
// visible, jamais gaté derrière le test de positionnement (comme sur son
// ancien emplacement).
renderProfileWidget('profileWidget');
