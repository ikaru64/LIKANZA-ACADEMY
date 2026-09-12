/* ============================================================
   LIKANZA ACADEMY — Bibliothèque : refonte visuelle premium (11/09/2026)
   Conserve intégralement la logique existante : LIBRARY (aucune donnée
   nouvelle), la recherche, les 3 niveaux d'explication (simple/detail/
   avance), la navigation à deux niveaux univers -> notions, les liens
   profonds (#theme:X, #Terme-Avec-Tirets). Seule la présentation change,
   plus 3 ajouts réels (jamais fabriqués) :
   - computeLibraryStats/computeLibraryTermMastery/computeLibraryUniversProgress
     (data.js) : pont notion -> vraie maîtrise via matchQuizCategorieForTerme,
     déjà réel — alimente les stats, la barre de progression par univers et
     le tri "Progression".
   - getLibraryVisits/recordLibraryVisit (data.js) : un vrai historique de
     consultation (horodaté), jamais un système de progression inventé —
     alimente "Continuer votre apprentissage".
   - Un tri des univers (A→Z / Nombre de notions / Progression) — jamais
     "Popularité" : aucune donnée d'usage agrégée entre utilisateurs
     n'existe sur ce site statique (chaque visite reste locale à l'appareil).

   Images : aucune photographie n'est chargée ici (aucun outil de génération
   /sourcing d'images fiable, cohérent et pérenne disponible pour produire
   14 visuels premium réels) — chaque univers a un traitement visuel
   CSS/icône (LIBRARY_CATEGORY_VISUALS ci-dessous), dans la palette demandée,
   construit pour qu'un vrai visuel photographique puisse remplacer l'icône
   plus tard sans toucher au reste du code (il suffirait d'ajouter un champ
   `image` par entrée, vérifié en priorité par libraryCategoryVisualHtml).
   ============================================================ */

let currentMode = 'simple';
let currentTheme = null; // null = on est au niveau "univers"
let currentSort = 'az';

function bibliothequeBodyKey(){
  return currentMode === 'detail' ? 'detail' : (currentMode === 'avance' ? 'avance' : 'simple');
}
function themeCounts(){
  const counts = {};
  LIBRARY.forEach(l => { counts[l.categorie] = (counts[l.categorie]||0) + 1; });
  return counts;
}

// ---------- Visuels par univers (section 4/22 du prompt d'origine) ----------
const LIBRARY_CATEGORY_VISUALS = {
  'Analyse fondamentale': {icon: 'search', accent: '#D4AF37'},
  'Bourse': {icon: 'trending-up', accent: '#D4AF37'},
  'Business': {icon: 'briefcase', accent: '#B87333'},
  'Crypto': {icon: 'bitcoin', accent: '#C9A66B'},
  'Entreprise': {icon: 'building-2', accent: '#4C6FA5'},
  'Finances personnelles': {icon: 'wallet', accent: '#4E9177'},
  'Fiscalité': {icon: 'landmark', accent: '#7A6BA6'},
  'Forex': {icon: 'scale', accent: '#3E8C82'},
  'Gestion du risque': {icon: 'shield', accent: '#9E5B5B'},
  'Immobilier': {icon: 'house', accent: '#B8974E'},
  'Investissement': {icon: 'sprout', accent: '#4E9177'},
  "Psychologie de l'investisseur": {icon: 'user', accent: '#7A6BA6'},
  'Épargne': {icon: 'coins', accent: '#D4AF37'},
  'Économie': {icon: 'globe', accent: '#4C6FA5'}
};
function libraryCategoryVisual(categorie){
  return LIBRARY_CATEGORY_VISUALS[categorie] || {icon: 'library', accent: '#D4AF37'};
}
// Point d'extension unique pour un vrai visuel photographique futur (jamais
// construit ici, voir le commentaire d'en-tête) : vérifie `visual.image`
// (un chemin réel local, ex. "images/library/bourse.webp") avant de retomber
// sur l'icône, pour qu'ajouter une vraie photo un jour ne demande de changer
// que LIBRARY_CATEGORY_VISUALS, jamais ce rendu.
function libraryCategoryArtHtml(categorie){
  const visual = libraryCategoryVisual(categorie);
  if(visual.image){
    return `<img src="${visual.image}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`;
  }
  return `<span class="lib-univers-icon" style="color:${visual.accent};">${ICONS[visual.icon] || ICONS.library}</span>`;
}

// ---------- Relatif simple (section 9, "Dernière lecture : hier") ----------
function formatRelativeLibraryDate(iso){
  const then = new Date(iso);
  if(isNaN(then)) return '';
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if(days <= 0) return "aujourd'hui";
  if(days === 1) return 'hier';
  if(days < 7) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if(weeks < 5) return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  return then.toLocaleDateString('fr-FR', {day:'numeric', month:'long'});
}

// ---------- Navigation partagée vers une notion précise (recherche/continuer/
// liens profonds — un seul point d'entrée, jamais 3 implémentations qui
// pourraient diverger). ----------
function openLibraryTerm(terme){
  const item = LIBRARY.find(l => l.terme === terme);
  if(!item) return;
  const searchEl = document.getElementById('libSearch');
  if(searchEl) searchEl.value = '';
  currentTheme = item.categorie;
  renderKnowledgeTree();
  setTimeout(() => {
    const el = document.getElementById(`leaf-${item.terme.replace(/\s+/g,'-')}`);
    if(el){ el.classList.add('open'); el.scrollIntoView({behavior:'smooth', block:'start'}); }
  }, 50);
}

// ---------- Stats réelles (section 7) : chaque chiffre vient de
// computeLibraryStats (data.js) — jamais une valeur hardcodée. 0 est une
// vraie réponse (un nouvel utilisateur n'a rien encore maîtrisé), affichée
// normalement, distincte d'une métrique non implémentée. ----------
function renderLibraryStats(){
  const el = document.getElementById('libStats');
  if(!el) return;
  const stats = computeLibraryStats();
  const cards = [
    {value: stats.total, label: 'Notions', icon: 'book-open'},
    {value: stats.univers, label: 'Univers', icon: 'compass'},
    {value: stats.maitrisees, label: 'Maîtrisées', icon: 'medal', tone: stats.maitrisees > 0 ? 'positive' : ''},
    {value: stats.aRevoir, label: 'À revoir', icon: 'target', tone: stats.aRevoir > 0 ? 'warn' : ''},
    {value: stats.recommandees, label: 'Recommandées', icon: 'star'}
  ];
  el.innerHTML = cards.map(c => `
    <div class="lib-stat-card">
      <span class="lib-stat-icon">${ICONS[c.icon] || ''}</span>
      <div>
        <div class="lib-stat-value ${c.tone || ''}">${c.value}</div>
        <div class="lib-stat-label">${c.label}</div>
      </div>
    </div>`).join('');
}

// ---------- Mode d'explication (section 8) : même fonctionnement qu'avant
// (currentMode + re-rendu de l'arbre), présentation enrichie. ----------
const LIB_MODE_DEFS = [
  {key: 'simple', icon: 'sprout', title: 'Explique-moi simplement', desc: 'Des explications claires et accessibles.'},
  {key: 'detail', icon: 'book-open', title: 'Comprendre en détail', desc: 'Des explications complètes avec exemples.'},
  {key: 'avance', icon: 'trending-up', title: 'Version avancée', desc: 'Approche technique et approfondie.'}
];
function renderLibraryModeGrid(){
  const el = document.getElementById('libModeGrid');
  if(!el) return;
  el.innerHTML = LIB_MODE_DEFS.map(m => `
    <button type="button" class="lib-mode-card ${m.key === currentMode ? 'active' : ''}" data-mode="${m.key}">
      <span class="lib-mode-icon">${ICONS[m.icon] || ''}</span>
      <h3>${m.title}</h3>
      <p>${m.desc}</p>
    </button>`).join('');
  el.querySelectorAll('.lib-mode-card').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMode = btn.dataset.mode;
      el.querySelectorAll('.lib-mode-card').forEach(b => b.classList.toggle('active', b === btn));
      renderKnowledgeTree();
    });
  });
}

// ---------- Continuer votre apprentissage (section 9) : getLibraryVisits
// (data.js) — jamais affichée si aucune vraie visite n'existe encore. ----------
function renderLibraryContinue(){
  const section = document.getElementById('libContinueSection');
  const grid = document.getElementById('libContinueGrid');
  if(!section || !grid) return;
  const items = getLibraryVisits().slice(0, 4)
    .map(v => { const entry = LIBRARY.find(l => l.terme === v.terme); return entry ? {entry, visit: v} : null; })
    .filter(Boolean);
  if(items.length === 0){ section.style.display = 'none'; return; }
  section.style.display = '';
  grid.innerHTML = items.map(({entry, visit}) => {
    const visual = libraryCategoryVisual(entry.categorie);
    const mastery = computeLibraryTermMastery(entry.terme);
    const pct = mastery ? Math.round((CONCEPT_STAGE_ORDER[mastery.stage] / CONCEPT_STAGE_ORDER.maitrise) * 100) : null;
    return `
    <a href="#${encodeURIComponent(entry.terme.replace(/\s+/g,'-'))}" class="lib-continue-card" data-continue-terme="${entry.terme}" style="--lib-accent:${visual.accent};">
      <div class="lib-continue-art">${libraryCategoryArtHtml(entry.categorie)}</div>
      <div class="lib-continue-body">
        <span class="badge status-differe">${mastery ? mastery.label : 'En cours'}</span>
        <h4>${entry.terme}</h4>
        <p>${entry.categorie}</p>
        ${pct !== null ? `<div class="dash-weekbar" style="width:100%;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>` : ''}
        <span class="lib-continue-date">Dernière lecture : ${formatRelativeLibraryDate(visit.dateAjout)}</span>
      </div>
    </a>`;
  }).join('');
  grid.querySelectorAll('[data-continue-terme]').forEach(card => {
    card.addEventListener('click', e => { e.preventDefault(); openLibraryTerm(card.dataset.continueTerme); });
  });
}

// ---------- Tri des univers (section 12) : uniquement des tris réellement
// compatibles avec les données existantes — jamais "Popularité" (aucune
// donnée d'usage agrégée entre utilisateurs n'existe sur ce site statique). ----------
const LIB_SORT_OPTIONS = [
  {key: 'az', label: 'A → Z'},
  {key: 'count', label: 'Nombre de notions'},
  {key: 'progress', label: 'Progression'}
];
function sortedThemeCats(){
  const counts = themeCounts();
  const cats = Object.keys(counts);
  if(currentSort === 'count') cats.sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  else if(currentSort === 'progress'){
    cats.sort((a, b) => {
      const pa = computeLibraryUniversProgress(a), pb = computeLibraryUniversProgress(b);
      if(pa === null && pb === null) return a.localeCompare(b);
      if(pa === null) return 1;
      if(pb === null) return -1;
      return pb - pa || a.localeCompare(b);
    });
  } else cats.sort((a, b) => a.localeCompare(b));
  return {cats, counts};
}
function renderLibrarySort(){
  const el = document.getElementById('libSort');
  if(!el) return;
  el.innerHTML = `<label for="libSortSelect" class="lib-sort-label">Trier par :</label>
    <select id="libSortSelect">${LIB_SORT_OPTIONS.map(o => `<option value="${o.key}" ${o.key === currentSort ? 'selected' : ''}>${o.label}</option>`).join('')}</select>`;
  document.getElementById('libSortSelect').addEventListener('change', e => {
    currentSort = e.target.value;
    renderKnowledgeTree();
  });
}

// ---------- Carte du savoir (section 14) : réseau abstrait généré en SVG à
// partir de vrais comptages (jamais une image contenant du texte, jamais un
// système complexe pour la V1 — même discipline "SVG fait main" que
// renderRadarChart, data.js). Taille de chaque nœud ∝ nombre réel de notions
// de cet univers. ---------- */
function renderLibraryKnowledgeMapSVG(){
  const counts = themeCounts();
  const cats = Object.keys(counts).sort();
  if(cats.length === 0) return '';
  const size = 220, center = size / 2, ringR = 82;
  const maxCount = Math.max(...cats.map(c => counts[c]));
  const nodes = cats.map((cat, i) => {
    const angle = (Math.PI * 2 * i / cats.length) - Math.PI / 2;
    const x = center + Math.cos(angle) * ringR;
    const y = center + Math.sin(angle) * ringR;
    const r = 3.5 + 4.5 * (counts[cat] / maxCount);
    return {x, y, r, color: libraryCategoryVisual(cat).accent, cat, count: counts[cat]};
  });
  const lines = nodes.map(n => `<line x1="${center}" y1="${center}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" stroke="rgba(212,175,55,0.18)" stroke-width="1"/>`).join('');
  const dots = nodes.map(n => `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="${n.color}" fill-opacity="0.88"><title>${n.cat} — ${n.count} notion${n.count > 1 ? 's' : ''}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="100%" role="img" aria-label="Carte du savoir : ${cats.length} univers, ${LIBRARY.length} notions" style="max-width:220px;display:block;margin:0 auto;">
    ${lines}
    <circle cx="${center}" cy="${center}" r="6" fill="var(--gold-bright)"/>
    ${dots}
  </svg>`;
}

// ---------- Panneau latéral "Votre parcours" (section 13) : réutilise
// getLevel() (data.js, même niveau déclaré que Formations/Bourse), jamais
// un second système de niveau. Le compteur de notions "consultées" vient du
// vrai historique de visites, distinct de "maîtrisées" (plus exigeant, basé
// sur les quiz réels). ---------- */
function renderLibrarySidePanel(){
  const el = document.getElementById('libSide');
  if(!el) return;
  const niveau = getLevel();
  const visits = getLibraryVisits();
  const stats = computeLibraryStats();
  const pct = stats.total > 0 ? Math.min(100, Math.round((visits.length / stats.total) * 100)) : 0;
  el.innerHTML = `
    <div class="lib-side-panel">
      <span class="lib-side-title">Votre parcours</span>
      <p class="lib-side-caption">Niveau actuel</p>
      <p class="lib-side-value">${DOMAIN_LEVEL_LABELS[niveau] || niveau}</p>
      <div class="dash-weekbar" style="width:100%;margin-top:10px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <p class="lib-side-caption" style="margin-top:6px;">${visits.length} / ${stats.total} notions consultées</p>
    </div>
    <div class="lib-side-panel">
      <span class="lib-side-title">Carte du savoir</span>
      <div class="lib-knowledge-map">${renderLibraryKnowledgeMapSVG()}</div>
      <p class="lib-side-value" style="font-size:14px;margin-top:8px;">${stats.univers} univers · ${stats.total} notions</p>
      <p class="lib-side-caption">Un savoir connecté</p>
    </div>`;
}

// ---------- Suggestions de recherche (section 6) : mots-clés réels,
// vérifiés pour donner au moins un vrai résultat avec la logique de
// recherche existante (jamais une suggestion qui renverrait "aucun
// résultat"). ---------- */
const LIB_SEARCH_SUGGESTIONS = ['PER', 'ETF', 'Dividende', 'Inflation', 'Obligation', 'Crypto', 'Risque', 'Crédit'];
function renderLibrarySuggestions(){
  const el = document.getElementById('libSuggestions');
  if(!el) return;
  el.innerHTML = `<span class="lib-suggestions-label">Essayez :</span>` +
    LIB_SEARCH_SUGGESTIONS.map(s => `<button type="button" class="lib-suggestion-pill" data-suggest="${s}">${s}</button>`).join('');
  el.querySelectorAll('[data-suggest]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('libSearch').value = btn.dataset.suggest;
      renderKnowledgeTree();
      document.getElementById('libSearch').scrollIntoView({behavior:'smooth', block:'center'});
    });
  });
}

// ---------- Rendu des notions (feuilles) — logique inchangée, plus
// l'enregistrement réel d'une visite à l'ouverture d'une carte. ---------- */
function renderLeafCards(container, items){
  const bodyKey = bibliothequeBodyKey();
  container.innerHTML = items.map((l,i) => `
    <div class="kt-leaf-card" id="leaf-${l.terme.replace(/\s+/g,'-')}">
      <button type="button" class="kt-leaf-head" style="background:none;border:none;width:100%;text-align:left;font:inherit;" data-idx="${i}" data-terme="${l.terme}">
        <h4>${l.terme}</h4>
        <span class="kt-leaf-meta">${l.niveau} · ${l.lecture}</span>
      </button>
      <div class="kt-leaf-body">
        <div id="ktConseil-${i}"></div>
        ${renderPrerequisNudge(l.prerequis, {className: 'kt-leaf-prereq'})}
        <p>${l[bodyKey]}</p>
        ${l.exemple ? `<p class="kt-leaf-example"><strong>Exemple : </strong>${l.exemple}</p>` : ''}
        ${l.avantages && l.avantages.length ? `<p class="kt-leaf-pro"><strong>Avantages :</strong> ${l.avantages.join(' · ')}</p>` : ''}
        ${l.inconvenients && l.inconvenients.length ? `<p class="kt-leaf-con"><strong>Limites :</strong> ${l.inconvenients.join(' · ')}</p>` : ''}
        ${l.erreurs && l.erreurs.length ? `<p class="kt-leaf-err"><strong>Erreurs fréquentes :</strong> ${l.erreurs.join(' · ')}</p>` : ''}
        ${renderTermeRecommendationsRow(l.terme)}
        <div id="nextstep-${i}" style="margin-top:10px;"></div>
      </div>
    </div>`).join('') || `
    <div class="lib-empty-state">
      <span class="lib-empty-icon">${ICONS.search || ''}</span>
      <h3>Aucune notion trouvée</h3>
      <p>Essayez un terme plus général.</p>
    </div>`;

  container.querySelectorAll('.kt-leaf-head').forEach(head => {
    head.addEventListener('click', () => {
      const card = head.closest('.kt-leaf-card');
      const wasOpen = card.classList.contains('open');
      card.classList.toggle('open');
      if(!wasOpen) recordLibraryVisit(head.dataset.terme);
    });
  });
  items.forEach((l,i) => {
    const conseil = pickConseilMessage(l.niveau, {weakCategory: getWeakCategoryLabel(l.categorie), categorie: l.categorie});
    renderConseilBadge(`ktConseil-${i}`, conseil);
    // Chantier K (refonte continuité UX, 12/09/2026) : une fiche de terme ne
    // proposait jusqu'ici aucune action de suite (contrairement aux
    // Formations/Simulations, qui appellent déjà renderNextStepCard) —
    // pure réutilisation, aucune nouvelle logique de recommandation.
    renderNextStepCard(`nextstep-${i}`, {domainKey: categorieDomainKey(l.categorie)});
  });
}

function renderKnowledgeTree(){
  const themesEl = document.getElementById('ktThemes');
  const leavesEl = document.getElementById('ktLeaves');
  const crumbEl = document.getElementById('ktBreadcrumb');
  const sortEl = document.getElementById('libSort');
  const query = (document.getElementById('libSearch').value || '').trim().toLowerCase();

  if(query){
    const matches = LIBRARY
      .filter(l => l.terme.toLowerCase().includes(query) || l.simple.toLowerCase().includes(query))
      .sort((a,b) => a.terme.localeCompare(b.terme));
    themesEl.style.display = 'none';
    leavesEl.style.display = '';
    crumbEl.style.display = '';
    if(sortEl) sortEl.style.display = 'none';
    crumbEl.innerHTML = `<button class="kt-back-btn" id="ktBack" type="button">← Tous les univers</button><span class="kt-crumb-label">Résultats pour « ${query} » (${matches.length})</span>`;
    document.getElementById('ktBack').addEventListener('click', () => { document.getElementById('libSearch').value = ''; renderKnowledgeTree(); });
    renderLeafCards(leavesEl, matches);
    return;
  }

  if(currentTheme){
    const items = LIBRARY.filter(l => l.categorie === currentTheme).sort((a,b) => a.terme.localeCompare(b.terme));
    themesEl.style.display = 'none';
    leavesEl.style.display = '';
    crumbEl.style.display = '';
    if(sortEl) sortEl.style.display = 'none';
    crumbEl.innerHTML = `<button class="kt-back-btn" id="ktBack" type="button">← Tous les univers</button><span class="kt-crumb-label">${currentTheme} · ${items.length} notion${items.length>1?'s':''}</span>`;
    document.getElementById('ktBack').addEventListener('click', () => { currentTheme = null; renderKnowledgeTree(); });
    renderLeafCards(leavesEl, items);
    return;
  }

  crumbEl.style.display = 'none';
  leavesEl.style.display = 'none';
  themesEl.style.display = '';
  if(sortEl) sortEl.style.display = '';
  const {cats, counts} = sortedThemeCats();
  themesEl.innerHTML = cats.map(cat => {
    const visual = libraryCategoryVisual(cat);
    const progress = computeLibraryUniversProgress(cat);
    return `
    <button class="lib-univers-card" data-theme="${cat}" type="button" style="--lib-accent:${visual.accent};">
      <div class="lib-univers-art">${libraryCategoryArtHtml(cat)}</div>
      <div class="lib-univers-body">
        <h3>${cat}</h3>
        <span class="lib-univers-count">${counts[cat]} notion${counts[cat]>1?'s':''}</span>
        ${progress !== null ? `<div class="dash-weekbar" style="width:100%;margin-top:6px;"><div class="dash-weekfill" style="width:${progress}%;"></div></div>` : ''}
      </div>
      <span class="lib-univers-arrow" aria-hidden="true">→</span>
    </button>`;
  }).join('');
  themesEl.querySelectorAll('.lib-univers-card').forEach(btn => {
    btn.addEventListener('click', () => { currentTheme = btn.dataset.theme; renderKnowledgeTree(); });
  });
}

document.getElementById('libSearch').addEventListener('input', renderKnowledgeTree);
const libSearchBtn = document.getElementById('libSearchBtn');
if(libSearchBtn) libSearchBtn.addEventListener('click', () => document.getElementById('libSearch').focus());

renderLibraryStats();
renderLibraryModeGrid();
renderLibraryContinue();
renderLibrarySort();
renderLibrarySidePanel();
renderLibrarySuggestions();
renderKnowledgeTree();

// Liens profonds :
//  - bibliotheque.html#theme:NomDuTheme ouvre directement ce thème (ex. depuis Éco).
//  - bibliotheque.html#Terme-Avec-Tirets (recherche globale, notion du jour du
//    tableau de bord) ouvre le bon thème et déplie la notion visée.
if(location.hash){
  const rawHash = decodeURIComponent(location.hash.slice(1));
  if(rawHash.startsWith('theme:')){
    const wantedTheme = rawHash.slice('theme:'.length);
    if(LIBRARY.some(l => l.categorie === wantedTheme)){
      currentTheme = wantedTheme;
      renderKnowledgeTree();
    }
  } else {
    const item = LIBRARY.find(l => l.terme.replace(/\s+/g,'-') === rawHash);
    if(item) openLibraryTerm(item.terme);
  }
}
