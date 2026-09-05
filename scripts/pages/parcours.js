/* ============================================================
   LIKANZA ACADEMY — Mon Univers Financier
   Cockpit financier personnel (patrimoine, objectifs, alertes,
   projets, trajectoire...), via la coquille de widgets partagée
   (renderDashboardShell, scripts/data.js). Jamais verrouillé : le
   reste du site reste accessible sans avoir fait le premier quiz.
   Mais tant qu'il n'est pas fait, cette page elle-même met une
   seule action en avant (le premier quiz) plutôt qu'un tableau de
   bord vide.

   Sprint de fermeture des écarts (04/09/2026, phases 4-5) : le
   sélecteur de niveau curriculum et la liste de missions par palier
   (l'ancienne identité "Mon Parcours") ont été retirés d'ici — cette
   page ne répond plus qu'à "où en est ma situation financière et où
   vais-je ?", jamais à "quel cours suivre ensuite" (déplacé sur
   formations.html, voir scripts/pages/formations.js).
   ============================================================ */

// Chantier 1 (audit Dashboard du 28/08/2026) : remplace la pile de sections
// individuelles (profil, stats, prochain pas, Financial IQ, détail par
// domaine) par la coquille de widgets (renderDashboardShell, scripts/data.js)
// — personnalisable, avec bascule Personnel/Professionnel en page.
function initParcoursHero(){
  const hasProfile = !!getPositioningResult();
  if(!hasProfile){
    document.getElementById('parcoursGateSection').style.display = 'block';
    renderParcoursGate('parcoursGate');
    return;
  }
  document.getElementById('parcoursMainSection').style.display = 'block';
  // En-tête scindé (refonte cockpit, 05/09/2026) : les 3 bandeaux de nudge
  // (onboarding/ré-onboarding/suggestion d'intérêt) restent au-dessus du
  // pli, toujours visibles ; le bloc gamification (XP/niveau/série) est
  // du contenu pédagogique au sens du nouveau cockpit — voir Phase 3 pour
  // son déplacement dans la section repliée "Suite de l'apprentissage".
  renderParcoursNudges('parcoursNudges');
  renderGamificationHeader('dashboardHeader');
  renderDashboardShell('dashboardShell');
  renderCockpitHeader('cockpitHeader');
  renderCockpitKPIs('cockpitKPIs');
}

// ============================================================
// Cockpit financier (refonte 05/09/2026) — en-tête compact + rangée de KPI.
// Aucune donnée fabriquée : computeCockpitKPIs (scripts/data.js) compose
// computeNetWorth/computeBudgetSummary, déjà réels. "Dernière mise à jour"
// vient du point réel le plus récent (historique de patrimoine ou dernier
// actif ajouté), jamais une date d'aujourd'hui codée en dur.
// ============================================================
function cockpitLastUpdateLabel(){
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
      <p class="cockpit-subtitle">Une vision globale de ton capital, aujourd'hui et demain.</p>
    </div>
    <div class="cockpit-meta">
      <div>Dernière mise à jour</div>
      <div class="cockpit-meta-value">${lastUpdate || 'Aucune donnée enregistrée'}</div>
    </div>`;
}

// Vue active du futur graphique combiné (câblée en Phase 5) — les clics KPI
// mettent déjà à jour cet état et l'affichage "actif", prêts à piloter le
// changement d'onglet du graphique une fois celui-ci construit.
let cockpitActiveView = 'global';
const COCKPIT_KPI_VIEWS = {patrimoine: 'global', liquidites: 'epargne', epargne: 'epargne', investissements: 'investissements', solde: 'revenus'};
function renderCockpitKPIs(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const k = computeCockpitKPIs();
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
      <span class="kpi-label">${c.label}</span>
      <span class="kpi-value mono" id="${elId}-${c.key}-value">0 €</span>
      ${c.sub ? `<span class="kpi-sub">${c.sub}</span>` : ''}
    </button>`).join('');
  cards.forEach(c => {
    animateNumber(document.getElementById(`${elId}-${c.key}-value`), c.value, {format: fmtEUR});
  });
  el.querySelectorAll('.cockpit-kpi').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.cockpit-kpi').forEach(b => b.classList.toggle('active', b === btn));
      cockpitActiveView = COCKPIT_KPI_VIEWS[btn.dataset.key] || 'global';
    });
  });
}

initParcoursHero();

// Profil de simulation (âge/épargne/horizon/risque/objectif — pré-remplit
// les outils du site) : relocalisé depuis Mon Compte (sprint de fermeture
// des écarts, 04/09/2026, phase 6). Ce sont de vraies données financières,
// leur place est ici plutôt que dans les paramètres de compte. Toujours
// visible, jamais gaté derrière le test de positionnement (comme sur son
// ancien emplacement).
renderProfileWidget('profileWidget');
