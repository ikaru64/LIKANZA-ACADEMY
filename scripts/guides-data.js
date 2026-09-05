/* ============================================================
   LIKANZA ACADEMY — Guides & Décryptages
   Chantier "Guides & Décryptages" (05/09/2026). Nouvelle couche éditoriale
   répondant à des questions financières concrètes (PEA ou CTO ? Comment
   investir 500 € ?), jamais un blog générique : réponse courte d'abord,
   preuves ensuite, simulation enfin. Module autonome par sujet (même
   convention que scripts/historical-data.js) — données ET rendu réunis ici,
   chargé après data.js/historical-data.js (dont on réutilise
   renderMethodologyPanel/renderDataBadge) et avant le script de la page.

   Phase 1 (fondations) : uniquement le modèle de données + les composants
   de rendu. Aucun contenu éditorial réel dans ce fichier — le premier vrai
   Guide (« DCA ou investir tout d'un coup ? ») est une phase distincte, qui
   remplira GUIDES ci-dessous.

   Principe directeur : renderGuideBlock délègue à renderCourseBlock (déjà
   dans data.js) pour tout type de bloc déjà couvert par les cours (texte,
   definition, retenir, attention, exemple, calcul, casReel, pourquoi,
   approfondir, outil) — jamais une deuxième version de ces types. Seuls les
   types propres aux Guides (comparaison, schéma, mythe/réalité, risques,
   FAQ, interaction, appel à simulation, sources) sont gérés ici.
   ============================================================ */

// ---------- Fraîcheur (section 27 du prompt d'origine) — GUIDE_CATEGORIES et
// GUIDES (index léger) vivent désormais dans app.js, pas ici : app.js charge
// avant ce fichier sur TOUTES les pages, et SEARCH_INDEX (app.js) doit
// pouvoir indexer les Guides même sur une page qui ne charge jamais
// guides-data.js. evergreen (ex. diversification) / semi-dynamic (ex. fiscalité du PEA,
// change avec la loi) / dynamic (ex. comparaison basée sur des valorisations
// actuelles) — sert uniquement à signaler qu'un Guide peut nécessiter une
// révision, jamais un score de qualité inventé.
const GUIDE_FRESHNESS_META = {
  evergreen: {emoji: '🌲', label: 'Intemporel'},
  'semi-dynamic': {emoji: '🔄', label: 'À réviser périodiquement'},
  dynamic: {emoji: '📅', label: 'Données datées'}
};
function renderGuideFreshnessBadge(freshness){
  const meta = GUIDE_FRESHNESS_META[freshness];
  if(!meta) return '';
  return `<span class="data-quality-badge"><span aria-hidden="true">${meta.emoji}</span> ${meta.label}</span>`;
}

// ---------- Sources (sections 24-25 et 58-59 du prompt d'origine) : jamais
// une source inventée. sourceType reprend le vocabulaire du prompt
// d'origine (primary/institutional/official_data/company/index_provider/
// secondary), affiché comme repère, jamais comme un score de fiabilité
// chiffré. Citation inline : un texte de bloc peut inclure directement
// `<sup><a href="#source-N">[N]</a></sup>` (N = position 1-indexée dans
// guide.sources) — pas de syntaxe de citation séparée à parser, cohérent
// avec le reste du site où les blocs de texte acceptent déjà du HTML réel. ----------
const GUIDE_SOURCE_TYPE_LABELS = {
  primary: 'Source primaire',
  institutional: 'Institution',
  official_data: 'Donnée officielle',
  company: 'Entreprise',
  index_provider: "Fournisseur d'indice",
  secondary: 'Source secondaire'
};
function renderGuideSources(sources){
  if(!Array.isArray(sources) || sources.length === 0) return '';
  return `<div class="card" style="margin-top:20px;">
    <span class="smallcaps">Sources</span>
    <ol style="margin:10px 0 0;padding-left:20px;font-size:12.5px;color:var(--text-dim);line-height:1.9;">
      ${sources.map((s, i) => `<li id="source-${i + 1}">${s.title}${s.publisher ? ` — ${s.publisher}` : ''}${s.date ? `, ${s.date}` : ''}${s.url ? ` — <a href="${s.url}" target="_blank" rel="noopener">consulter →</a>` : ''}${s.sourceType && GUIDE_SOURCE_TYPE_LABELS[s.sourceType] ? ` <span class="data-badge">${GUIDE_SOURCE_TYPE_LABELS[s.sourceType]}</span>` : ''}</li>`).join('')}
    </ol>
  </div>`;
}

// ---------- Comparaison (section 11 et 20 du prompt d'origine) : jamais un
// "gagnant" désigné (aucune cellule .best utilisée ici, contrairement à
// compare-table sur les fiches actions) — généralise le motif déjà réel de
// scripts/pages/dividende-page.js (criteria × colonnes), jusqu'ici copié 3
// fois sur le site, jamais dupliqué une 4e fois. Contenu statique (rows[].
// values), pas une fonction get() : un Guide est écrit à la main, pas
// alimenté par un profil chargé en direct comme sur une fiche action. ----------
function renderGuideComparisonTable(bloc){
  if(!Array.isArray(bloc.columns) || bloc.columns.length === 0 || !Array.isArray(bloc.rows) || bloc.rows.length === 0) return '';
  const table = `<table class="compare-table"><tr><th>Critère</th>${bloc.columns.map(c => `<th>${c.label}</th>`).join('')}</tr>${
    bloc.rows.map(r => `<tr><td>${r.label}</td>${bloc.columns.map(c => `<td>${r.values && r.values[c.key] !== undefined ? r.values[c.key] : '—'}</td>`).join('')}</tr>`).join('')
  }</table>`;
  return `<div class="card" style="margin-top:14px;">
    ${bloc.intro ? `<p style="margin-bottom:10px;">${bloc.intro}</p>` : ''}
    <div style="overflow-x:auto;">${table}</div>
    ${bloc.note ? `<p style="font-size:12px;color:var(--text-dim);margin-top:10px;">${bloc.note}</p>` : ''}
  </div>`;
}

// ---------- Schémas (sections 12-13 du prompt d'origine) : jamais de l'ASCII
// art dans l'interface réelle (exigence explicite). HTML/CSS plutôt qu'un
// SVG dessiné à la main : du vrai texte (accessible aux lecteurs d'écran,
// jamais un contenu porté uniquement par une image), plus simple à rendre
// responsive sans outillage de build. Deux variantes : "flow" (séquence
// causale verticale, ex. inflation → taux → crédit) et "tree" (une racine
// vers plusieurs feuilles, ex. diversification d'un ETF). ----------
function renderGuideDiagram(bloc){
  if(bloc.variant === 'tree' && bloc.root && Array.isArray(bloc.leaves) && bloc.leaves.length){
    return `<div class="card" style="margin-top:14px;">
      ${bloc.title ? `<span class="smallcaps">${bloc.title}</span>` : ''}
      <div class="guide-diagram-tree">
        <div class="guide-diagram-root">${bloc.root}</div>
        <div class="guide-diagram-leaves">${bloc.leaves.map(l => `<div class="guide-diagram-leaf">${l}</div>`).join('')}</div>
      </div>
    </div>`;
  }
  if(Array.isArray(bloc.steps) && bloc.steps.length){
    return `<div class="card" style="margin-top:14px;">
      ${bloc.title ? `<span class="smallcaps">${bloc.title}</span>` : ''}
      <div class="guide-diagram-flow">
        ${bloc.steps.map((s, i) => `<div class="guide-diagram-step">${s}</div>${i < bloc.steps.length - 1 ? `<div class="guide-diagram-arrow" aria-hidden="true">↓</div>` : ''}`).join('')}
      </div>
    </div>`;
  }
  return '';
}

// ---------- Mythe / Réalité (section 22, optionnel) ----------
function renderGuideMythReality(bloc){
  if(!bloc.myth || !bloc.reality) return '';
  return `<div class="card" style="margin-top:14px;">
    <div style="border-left:2px solid var(--bordeaux);padding-left:12px;margin-bottom:12px;">
      <span class="smallcaps" style="color:var(--bordeaux);">✗ Mythe</span>
      <p style="margin-top:4px;font-style:italic;">« ${bloc.myth} »</p>
    </div>
    <div style="border-left:2px solid var(--emerald);padding-left:12px;">
      <span class="smallcaps" style="color:var(--emerald);">✓ Réalité</span>
      <p style="margin-top:4px;">${bloc.reality}</p>
    </div>
  </div>`;
}

// ---------- Risques (section 23 : jamais relégués en petite note de bas de
// page — un vrai bloc à part entière). ----------
function renderGuideRisks(bloc){
  if(!Array.isArray(bloc.items) || bloc.items.length === 0) return '';
  return `<div class="card" style="margin-top:14px;border-color:var(--bordeaux);">
    <span class="smallcaps" style="color:var(--bordeaux);">⚠️ Risques principaux</span>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:10px;">
      ${bloc.items.map(r => `<div><strong style="color:var(--text);font-size:13px;">${r.label}</strong><p style="font-size:12.5px;color:var(--text-dim);margin-top:2px;">${r.texte}</p></div>`).join('')}
    </div>
  </div>`;
}

// ---------- FAQ (section 8 et 10, aucun équivalent n'existait nulle part
// avant ce chantier) : réutilise l'accordéon .glossary-item déjà réel
// (scripts/pages/crypto.js), jamais un nouveau composant d'interaction. ----------
function renderGuideFaq(bloc){
  if(!Array.isArray(bloc.items) || bloc.items.length === 0) return '';
  return `<div style="margin-top:14px;">
    <span class="smallcaps">FAQ</span>
    <div style="margin-top:10px;">
      ${bloc.items.map(item => `
      <div class="glossary-item">
        <button type="button" class="head" style="background:none;border:none;width:100%;text-align:left;font:inherit;" onclick="this.nextElementSibling.classList.toggle('open')"><h4 style="font-size:15px;">${item.question}</h4></button>
        <div class="glossary-body">${item.reponse}</div>
      </div>`).join('')}
    </div>
  </div>`;
}

// ---------- Mini-interaction (sections 16 et 40-41) : un seul type concret
// pour l'instant ("percentDrop" — l'exemple explicitement donné par le
// prompt d'origine, "imagine ton portefeuille perdre X%"), jamais un système
// d'interaction générique abstrait sans un vrai second cas d'usage pour le
// justifier (section 57). Capital réel du Guide (bloc.initialCapital),
// jamais une valeur fabriquée. Le calcul de récupération illustre
// l'asymétrie pertes/récupération demandée en section 16. ----------
function renderGuideRecoveryLine(capital, pct){
  const after = capital * (1 - pct / 100);
  if(after <= 0) return `Une perte de ${pct} % ne laisse plus rien à récupérer sur ce capital.`;
  const recoveryPct = ((capital / after) - 1) * 100;
  return `Pour revenir à ${fmtEUR(capital)}, il faudrait ensuite +${recoveryPct.toFixed(1)} %.`;
}
function renderGuideInteractive(bloc, blocId){
  if(bloc.variant !== 'percentDrop') return '';
  const capital = bloc.initialCapital > 0 ? bloc.initialCapital : 1000;
  const options = Array.isArray(bloc.options) && bloc.options.length ? bloc.options : [10, 20, 30, 50];
  return `<div class="card" style="margin-top:14px;" id="${blocId}" data-capital="${capital}">
    <span class="smallcaps">Imagine que ton portefeuille perde :</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;">
      ${options.map((pct, i) => `<button type="button" class="pill guide-drop-pill ${i === 0 ? 'active' : ''}" data-pct="${pct}">-${pct} %</button>`).join('')}
    </div>
    <p style="font-size:13px;color:var(--text-dim);">Capital de départ : <strong class="mono" style="color:var(--text);">${fmtEUR(capital)}</strong></p>
    <p style="font-size:13px;color:var(--text-dim);">Valeur après la baisse : <strong class="mono" id="${blocId}-result" style="color:var(--text);">${fmtEUR(capital * (1 - options[0] / 100))}</strong></p>
    <p style="font-size:12.5px;color:var(--gold-bright);margin-top:8px;" id="${blocId}-recovery">${renderGuideRecoveryLine(capital, options[0])}</p>
  </div>`;
}
// Câblée une seule fois après insertion de la page entière (voir
// renderGuidePage) — même principe que les calculateurs de
// scripts/games/finance.js (get/update/addEventListener), jamais un
// framework de réactivité introduit pour ce seul besoin.
function wireGuideInteractiveBlocks(rootEl){
  (rootEl || document).querySelectorAll('.guide-drop-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-capital]');
      if(!card) return;
      card.querySelectorAll('.guide-drop-pill').forEach(b => b.classList.toggle('active', b === btn));
      const capital = +card.dataset.capital;
      const pct = +btn.dataset.pct;
      const resultEl = card.querySelector('[id$="-result"]');
      const recoveryEl = card.querySelector('[id$="-recovery"]');
      if(resultEl) resultEl.textContent = fmtEUR(capital * (1 - pct / 100));
      if(recoveryEl) recoveryEl.textContent = renderGuideRecoveryLine(capital, pct);
    });
  });
}

// ---------- Pont vers le Laboratoire (sections 29-33 du prompt d'origine) :
// réutilise le moteur de contexte existant (writeContext/consumeContext,
// data.js) sur le motif business-strategy (changement de PAGE complet,
// jamais le motif same-page de life-project-simulation qui, lui, doit
// rappeler sa propre fonction de lecture manuellement faute de
// rechargement) — un vrai clic ici recharge bien laboratoire.html, donc son
// chargement initial suffit à lire le contexte. Jamais une donnée
// fabriquée : les champs transmis sont exactement ceux saisis par le
// lecteur, relus au moment du clic. ----------
function renderGuideSimulationCTA(bloc, blocId){
  if(!Array.isArray(bloc.fields) || bloc.fields.length === 0 || !bloc.targetUrl) return '';
  return `<div class="card" style="margin-top:20px;border:1px solid var(--gold);background:var(--bg-alt);" id="${blocId}">
    <span class="smallcaps" style="color:var(--gold-bright);">Passer de la théorie à la pratique</span>
    ${bloc.intro ? `<p style="margin:8px 0 14px;">${bloc.intro}</p>` : ''}
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      ${bloc.fields.map(f => `<div class="field" style="flex:1;min-width:140px;"><label for="${blocId}-${f.key}">${f.label}</label><input type="number" id="${blocId}-${f.key}" min="0" value="${f.default || 0}"></div>`).join('')}
    </div>
    <button type="button" class="btn btn-gold" id="${blocId}-cta" style="margin-top:14px;">${bloc.label || 'Simuler →'}</button>
  </div>`;
}
function wireGuideSimulationCTA(blocId, bloc, guide){
  const btn = document.getElementById(`${blocId}-cta`);
  if(!btn) return;
  btn.addEventListener('click', () => {
    const payload = {guideSlug: guide.slug, guideTitle: guide.title};
    bloc.fields.forEach(f => { payload[f.key] = +document.getElementById(`${blocId}-${f.key}`).value || 0; });
    // Clé de contexte par guide (guide-simulation-<slug>), pas une clé
    // générique partagée : laboratoire.html héberge maintenant plusieurs
    // widgets pontés (DCA, Acheter ou louer), sur des onglets différents.
    // consumeContext supprime la clé dès sa première lecture — avec une
    // clé générique unique, le widget dont l'init tourne en premier volerait
    // le contexte destiné à l'autre (mauvais onglet ouvert, mauvais champ
    // prérempli). Le slug du guide est déjà réel et unique, donc réutilisé
    // tel quel comme suffixe de clé.
    writeContext('guide-simulation-' + guide.slug, payload);
    window.location.href = bloc.targetUrl;
  });
}

// ---------- Dispatcher de blocs : délègue aux types déjà couverts par les
// cours, gère ici uniquement les types propres aux Guides. ----------
const GUIDE_ONLY_BLOCK_TYPES = ['comparisonTable', 'diagram', 'mythReality', 'risks', 'faq', 'interactive', 'simulationCTA'];
function renderGuideBlock(bloc, index, guide){
  if(!bloc || !bloc.type) return '';
  if(!GUIDE_ONLY_BLOCK_TYPES.includes(bloc.type)) return renderCourseBlock(bloc);
  const blocId = `guide-block-${index}`;
  if(bloc.type === 'comparisonTable') return renderGuideComparisonTable(bloc);
  if(bloc.type === 'diagram') return renderGuideDiagram(bloc);
  if(bloc.type === 'mythReality') return renderGuideMythReality(bloc);
  if(bloc.type === 'risks') return renderGuideRisks(bloc);
  if(bloc.type === 'faq') return renderGuideFaq(bloc);
  if(bloc.type === 'interactive') return renderGuideInteractive(bloc, blocId);
  if(bloc.type === 'simulationCTA') return renderGuideSimulationCTA(bloc, blocId);
  return '';
}

// ---------- Modèle de Guide (section 56 du prompt d'origine) : concepts[]
// est toujours validé contre la vraie LIBRARY au rendu (même discipline que
// renderCourseLibraryLinks) — un concept qui n'existe pas dans LIBRARY
// disparaît silencieusement du lien, jamais un lien cassé ni une entrée
// fabriquée. GUIDES (index léger de métadonnées) et getGuideBySlug/
// getGuidesByCategory vivent dans app.js (voir plus haut) — chaque guide réel
// vit dans son propre script (ex. scripts/pages/guide-<slug>.js, chargé
// uniquement par SA page) qui définit l'objet complet consommé par
// renderGuidePage ci-dessous — jamais chargé sur la landing juste pour
// construire une carte (section 64, performance).

// ---------- Rendu complet d'une page Guide : réutilise
// renderCourseLibraryLinks (Bibliothèque), renderRelatedCourseLink (Cours,
// data.js — ferme l'étape "Cours" de la Boucle Likanza appliquée aux Guides),
// renderMethodologyPanel (sources & méthodologie), renderGuideSources
// (bibliographie) — jamais un doublon de ces composants déjà réels.
// guide.relatedCourse est optionnel ({id, chapitre}) : silencieux si absent
// ou si l'id/le chapitre ne correspond à rien de réel dans COURS_CATALOG
// (même discipline que renderRelatedCourseLink lui-même). ----------
function renderGuidePage(elId, guide){
  const el = document.getElementById(elId);
  if(!el || !guide) return;
  const validConcepts = (guide.concepts || []).filter(t => LIBRARY.some(l => l.terme === t));
  const sectionsHtml = (guide.sections || []).map((bloc, i) => renderGuideBlock(bloc, i, guide)).join('');
  el.innerHTML = `
    <div class="card" style="max-width:720px;margin:0 auto;">
      <span class="smallcaps">${guide.question}</span>
      <h1 class="display" style="font-size:26px;font-weight:600;margin:10px 0;">${guide.title}</h1>
      <p style="font-size:15px;line-height:1.7;">${guide.shortAnswer}</p>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:10px;">Dernière mise à jour : ${guide.updatedAt ? new Date(guide.updatedAt).toLocaleDateString('fr-FR') : '—'} ${renderGuideFreshnessBadge(guide.freshness)}</p>
    </div>
    <div style="max-width:720px;margin:24px auto 0;">
      ${sectionsHtml}
      ${renderCourseLibraryLinks(validConcepts)}
      ${guide.relatedCourse ? renderRelatedCourseLink(guide.relatedCourse.id, guide.relatedCourse.chapitre) : ''}
      ${renderMethodologyPanel(guide.methodology)}
      ${renderGuideSources(guide.sources)}
    </div>`;
  wireGuideInteractiveBlocks(el);
  (guide.sections || []).forEach((bloc, i) => {
    if(bloc.type === 'simulationCTA') wireGuideSimulationCTA(`guide-block-${i}`, bloc, guide);
  });
}

// ---------- Landing (Phase 4) : carte + grille, construites uniquement à
// partir de l'index léger GUIDES (jamais du contenu complet d'un guide).
// difficulty reprend le même vocabulaire que LIBRARY.niveau
// (debutant/intermediaire/avance) — jamais un nouveau référentiel. ----------
const GUIDE_DIFFICULTY_LABELS = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé'
};
function renderGuideCard(guide){
  const catLabel = (GUIDE_CATEGORIES.find(c => c.key === guide.category) || {}).label || guide.category;
  return `<a class="card" href="${guide.url}">
    <span class="smallcaps">${catLabel}</span>
    <h3 style="font-size:17px;margin:10px 0 8px;">${guide.question}</h3>
    <p style="font-size:13px;color:var(--text-dim);flex:1;">${guide.shortAnswer}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;font-size:11.5px;color:var(--text-dim);align-items:center;">
      ${guide.difficulty && GUIDE_DIFFICULTY_LABELS[guide.difficulty] ? `<span class="data-quality-badge">${GUIDE_DIFFICULTY_LABELS[guide.difficulty]}</span>` : ''}
      <span>${guide.readingTime || ''}</span>
      ${guide.hasSimulation ? '<span>🧪 Simulation liée</span>' : ''}
    </div>
  </a>`;
}
function renderGuidesGrid(elId, guides){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = guides.length
    ? guides.map(renderGuideCard).join('')
    : '<p style="padding:12px 4px;color:var(--text-dim);">Aucun guide ne correspond à ta recherche.</p>';
}
