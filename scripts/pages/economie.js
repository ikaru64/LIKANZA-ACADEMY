/* ============================================================
   LIKANZA ACADEMY — Page Économie (economie.html)
   Refonte du 06/09/2026 : "Likanza Economic Intelligence Terminal"
   (Phase 1, socle). Toutes les séries viennent de /api/eco-rate (BCE,
   Eurostat, Banque Mondiale, FRED — voir api/eco-rate.js) — jamais une
   valeur inventée pour combler une case vide ; une série indisponible
   affiche honnêtement "Donnée indisponible".

   Portée volontairement limitée à un socle réel plutôt qu'aux 40
   sections du brief d'origine — carte interactive, Graph Lab, mode
   enseignant, crisis replay et impact engine restent reportés à des
   chantiers futurs (décision actée avec l'utilisateur, cf. mémoire
   project_economie_terminal_status). Le comparateur de pays (section 26
   du brief) a été ajouté ensuite : aucune nouvelle donnée nécessaire,
   il ne fait que réutiliser les séries déjà réelles et déjà branchées
   pour les 8 pays ci-dessous.
   ============================================================ */

// ---------- Pays couverts : seulement des pays réels, jamais un agrégat
// mélangeant deux périmètres différents sous un même sélecteur (la zone
// euro BCE et l'Union européenne à 27 Eurostat sont deux agrégats réels
// mais distincts — cf. lib/ecb.js/lib/eurostat.js — non exposés ici comme
// "pays" pour ne pas les confondre ; ils réapparaîtront proprement
// étiquetés dans le futur module Banques centrales). Chaque pays ne liste
// QUE les indicateurs pour lesquels une vraie source existe déjà pour lui
// — jamais un indicateur générique appliqué par défaut à tous. ----------
const ECO_COUNTRIES = {
  FR: {label: 'France', flag: '🇫🇷', kpis: ['gdp-growth', 'inflation', 'unemployment', 'gov-debt', 'gov-deficit', 'consumer-confidence', 'policy-rate-ecb']},
  DE: {label: 'Allemagne', flag: '🇩🇪', kpis: ['gdp-growth', 'inflation', 'unemployment', 'gov-debt', 'gov-deficit', 'consumer-confidence', 'policy-rate-ecb']},
  IT: {label: 'Italie', flag: '🇮🇹', kpis: ['gdp-growth', 'inflation', 'unemployment', 'gov-debt', 'gov-deficit', 'consumer-confidence', 'policy-rate-ecb']},
  ES: {label: 'Espagne', flag: '🇪🇸', kpis: ['gdp-growth', 'inflation', 'unemployment', 'gov-debt', 'gov-deficit', 'consumer-confidence', 'policy-rate-ecb']},
  US: {label: 'États-Unis', flag: '🇺🇸', kpis: ['gdp-growth', 'inflation', 'unemployment', 'gov-debt', 'policy-rate-fed']},
  GB: {label: 'Royaume-Uni', flag: '🇬🇧', kpis: ['gdp-growth', 'inflation', 'unemployment', 'gov-debt']},
  JP: {label: 'Japon', flag: '🇯🇵', kpis: ['gdp-growth', 'inflation', 'unemployment']},
  CN: {label: 'Chine', flag: '🇨🇳', kpis: ['gdp-growth', 'inflation', 'unemployment']}
};
const ECO_EUROSTAT_COUNTRIES = new Set(['FR', 'DE', 'IT', 'ES']); // séries Eurostat/BCE (index à convertir pour l'inflation)
let ecoActiveCountry = 'FR';

// ---------- Vues transversales (modules) : seulement celles pour
// lesquelles une vraie source existe déjà — Croissance/Inflation/Emploi
// sont déjà couverts par la vue "Pays" (KPI + Macro Trend), pas dupliqués
// ici. Graph Lab/mode enseignant/crisis replay/impact engine restent des
// chantiers futurs (cf. en-tête). La carte mondiale (ajoutée le
// 06/09/2026) est le premier de ces modules différés à être construit —
// périmètre volontairement restreint à l'Europe/Amériques/Asie (26 pays
// réels, WORLDBANK_MAP_COUNTRIES côté backend), jamais l'Afrique ni
// l'Océanie tant qu'aucune donnée n'y est vérifiée. ----------
const ECO_VIEWS = {
  overview: {label: "Vue d'ensemble", icon: 'compass'},
  map: {label: 'Carte mondiale', icon: 'globe'},
  compare: {label: 'Comparateur', icon: 'list'},
  'graph-lab': {label: 'Graph Lab', icon: 'telescope'},
  'crisis-replay': {label: 'Crisis Replay', icon: 'triangle-alert'},
  'central-banks': {label: 'Banques centrales', icon: 'landmark'},
  debt: {label: 'Dette & déficit', icon: 'scale'},
  'public-finance': {label: 'Finances publiques', icon: 'coins'}
};
let ecoActiveView = 'overview';

// ---------- État de la carte mondiale ----------
// Seuls les indicateurs à couverture complète sur les 26 pays sont
// proposés ici (croissance/inflation/chômage) — la dette publique n'a de
// vraie donnée Banque Mondiale que pour ~11/26 pays, trop incomplet pour
// une carte crédible (api/eco-map.js la refuse déjà côté serveur).
const ECO_MAP_INDICATORS = ['gdp-growth', 'inflation', 'unemployment'];
let ecoMapIndicator = 'gdp-growth';
let ecoMapSvgMarkup = null; // chargé une seule fois, mis en cache pour la session
let ecoMapData = null; // {indicator, values, source, sourceUrl, label} de l'indicateur actif
// Libellés FR des 26 pays de la carte — copie front de
// lib/worldbank.js::WORLDBANK_COUNTRY_LABELS (module Node, non accessible
// au navigateur), mêmes 26 pays, jamais un pays de plus ou de moins que
// WORLDBANK_MAP_COUNTRIES côté serveur.
const WORLDBANK_MAP_COUNTRY_LABELS_FR = {
  FR: 'France', DE: 'Allemagne', IT: 'Italie', ES: 'Espagne', GB: 'Royaume-Uni',
  NL: 'Pays-Bas', CH: 'Suisse', SE: 'Suède', PL: 'Pologne', RU: 'Russie', TR: 'Turquie',
  US: 'États-Unis', CA: 'Canada', MX: 'Mexique', BR: 'Brésil', AR: 'Argentine',
  JP: 'Japon', CN: 'Chine', KR: 'Corée du Sud', IN: 'Inde', ID: 'Indonésie',
  VN: 'Vietnam', TH: 'Thaïlande', PH: 'Philippines', PK: 'Pakistan', SA: 'Arabie saoudite'
};

// ---------- Métadonnées par indicateur : libellé, icône, formatage,
// et clé de série RÉELLE selon le pays (jamais une clé générique qui
// n'existerait pas côté serveur). ----------
const ECO_KPI_META = {
  'gdp-growth': {
    label: 'Croissance du PIB', icon: 'trending-up',
    seriesKey: c => `gdp-growth-${c.toLowerCase()}`,
    fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + ' %',
    tone: 'growth' // hausse = vert
  },
  'inflation': {
    label: 'Inflation', icon: 'coins',
    seriesKey: c => `inflation-${c.toLowerCase()}`,
    isIndex: c => ECO_EUROSTAT_COUNTRIES.has(c), // BCE renvoie un indice (base 100) à convertir ; Banque Mondiale renvoie déjà un taux annuel
    fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + ' %',
    tone: 'neutral' // pas de jugement bon/mauvais universel sur le sens de variation
  },
  'unemployment': {
    label: 'Chômage', icon: 'briefcase',
    seriesKey: c => `unemployment-${c.toLowerCase()}`,
    fmt: v => v.toFixed(1) + ' %',
    tone: 'inverse' // hausse = rouge
  },
  'gov-debt': {
    label: 'Dette publique', icon: 'scale',
    seriesKey: c => `gov-debt-${c.toLowerCase()}`,
    fmt: v => v.toFixed(1) + ' % PIB',
    tone: 'inverse'
  },
  'gov-deficit': {
    label: 'Déficit public', icon: 'trending-down',
    seriesKey: c => `gov-deficit-${c.toLowerCase()}`,
    fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + ' % PIB',
    tone: 'inverseInverted' // une amélioration (moins négatif) = vert
  },
  'consumer-confidence': {
    label: 'Confiance des ménages', icon: 'star',
    seriesKey: c => `consumer-confidence-${c.toLowerCase()}`,
    fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1),
    tone: 'neutral'
  },
  'policy-rate-ecb': {
    label: 'Taux BCE (dépôt)', icon: 'landmark',
    seriesKey: () => 'policy-rate-ecb-history',
    fmt: v => v.toFixed(2) + ' %',
    tone: 'neutral'
  },
  'policy-rate-fed': {
    label: 'Taux Fed (fonds fédéraux)', icon: 'landmark',
    seriesKey: () => 'policy-rate-fed',
    fmt: v => v.toFixed(2) + ' %',
    tone: 'neutral'
  }
};

async function fetchEcoSeries(seriesKey){
  const resp = await fetch(`/api/eco-rate?series=${seriesKey}`);
  if(!resp.ok){
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  if(!Array.isArray(data.points) || data.points.length === 0) throw new Error('Série sans observation');
  return data;
}

// Fraîcheur honnête (section 5/33 du brief) : jamais "LIVE" pour une
// donnée trimestrielle/annuelle — seule une série quotidienne (le taux de
// dépôt BCE, publié chaque jour même sans changement) peut légitimement
// prétendre à un badge LIVE.
function ecoFreshnessBadge(frequency){
  const isDaily = /quotidienne/i.test(frequency || '');
  return isDaily
    ? `<span class="eco-freshness is-live">Live</span>`
    : `<span class="eco-freshness is-periodic">Dernière publication</span>`;
}

function ecoDeltaClass(tone, delta){
  if(Math.abs(delta) < 1e-9) return 'flat';
  if(tone === 'neutral') return 'flat';
  const rising = delta > 0;
  if(tone === 'growth') return rising ? 'up' : 'down';
  if(tone === 'inverse') return rising ? 'down' : 'up';
  if(tone === 'inverseInverted') return rising ? 'down' : 'up'; // déficit : une hausse (plus négatif) est déjà gérée par le signe de delta
  return 'flat';
}

function renderEcoNav(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <span class="eco-nav-label">Modules</span>
    ${Object.entries(ECO_VIEWS).map(([key, v]) => `
      <button type="button" class="${key === ecoActiveView ? 'active' : ''}" data-view="${key}">
        <span class="eco-nav-flag">${ICONS[v.icon] || ''}</span><span>${v.label}</span>
      </button>`).join('')}
    <span class="eco-nav-label">Pays</span>
    ${Object.entries(ECO_COUNTRIES).map(([code, c]) => `
      <button type="button" class="${code === ecoActiveCountry ? 'active' : ''}" data-country="${code}">
        <span class="eco-nav-flag">${c.flag}</span><span>${c.label}</span>
      </button>`).join('')}
  `;
  el.querySelectorAll('button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      ecoActiveView = btn.dataset.view;
      el.querySelectorAll('button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === ecoActiveView));
      renderEcoBody();
    });
  });
  el.querySelectorAll('button[data-country]').forEach(btn => {
    btn.addEventListener('click', () => {
      ecoActiveCountry = btn.dataset.country;
      el.querySelectorAll('button[data-country]').forEach(b => b.classList.toggle('active', b.dataset.country === ecoActiveCountry));
      renderEcoBody();
    });
  });
}

// Dispatcheur central : la vue "Vue d'ensemble" garde le comportement
// pays-par-pays existant (en-tête + KPI + Macro Trend) ; chaque module
// transversal prend la main sur les 3 mêmes zones (header/kpis/main)
// avec son propre contenu, pour ne jamais avoir deux mises en page
// simultanées qui se chevauchent.
function renderEcoBody(){
  renderEcoHeader('ecoHeaderMeta');
  if(ecoActiveView === 'overview'){
    renderEcoKpis('ecoKpis');
    rerenderEcoMain();
  } else if(ecoActiveView === 'map'){
    renderMapView();
  } else if(ecoActiveView === 'compare'){
    renderCompareView();
  } else if(ecoActiveView === 'graph-lab'){
    renderGraphLabView();
  } else if(ecoActiveView === 'crisis-replay'){
    renderCrisisView();
  } else if(ecoActiveView === 'central-banks'){
    renderCentralBanksView();
  } else if(ecoActiveView === 'debt'){
    renderDebtView();
  } else if(ecoActiveView === 'public-finance'){
    renderPublicFinanceView();
  }
}

// ============================================================
// Module "Carte mondiale" (06/09/2026) — 26 pays réels d'Europe/
// Amériques/Asie (WORLDBANK_MAP_COUNTRIES côté backend), un seul appel
// réseau par indicateur (/api/eco-map), fond de carte SVG tiers vendorisé
// (assets/maps/world-map.svg, CC BY-SA 3.0) colorié par JS. Jamais un
// pays coloré sans vraie donnée reçue ; tout pays hors des 26 (Afrique,
// Océanie comprises) reste en gris neutre, avec une note explicite —
// jamais présenté comme un manque de donnée plutôt qu'un choix de
// périmètre assumé.
// ============================================================
async function ecoLoadMapSvg(){
  if(ecoMapSvgMarkup) return ecoMapSvgMarkup;
  const resp = await fetch('assets/maps/world-map.svg');
  if(!resp.ok) throw new Error(`Fond de carte indisponible (HTTP ${resp.status})`);
  ecoMapSvgMarkup = await resp.text();
  return ecoMapSvgMarkup;
}

// Couleur relative aux vraies valeurs reçues (normalisation min-max sur
// CE jeu de données précis) — jamais un seuil absolu inventé du type
// "croissance > 3 % = vert", qui affirmerait une norme universelle non
// vérifiée. `tone` réutilise EXACTEMENT ECO_KPI_META[...].tone déjà
// défini : 'growth' (haut=favorable), 'inverse' (haut=défavorable),
// 'neutral' (jamais de jugement bon/mauvais, ex. inflation — même
// principe déjà affirmé pour les KPI classiques, une teinte à intensité
// variable plutôt que rouge/vert).
function ecoMapLerp(a, b, f){ return a.map((v, i) => Math.round(v + (b[i] - v) * f)); }
function ecoMapColorFor(rawT, tone){
  const t = Math.max(0, Math.min(1, rawT));
  if(tone === 'neutral'){
    const light = [110, 114, 122], dark = [212, 175, 55];
    const rgb = ecoMapLerp(light, dark, t);
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  }
  const favorable = tone === 'growth' ? t : 1 - t;
  const neg = [240, 68, 56], mid = [110, 114, 122], pos = [50, 213, 131];
  const rgb = favorable < 0.5 ? ecoMapLerp(neg, mid, favorable * 2) : ecoMapLerp(mid, pos, (favorable - 0.5) * 2);
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}
function ecoMapLegendGradient(tone){
  if(tone === 'neutral') return 'linear-gradient(to right, rgb(110,114,122), rgb(212,175,55))';
  if(tone === 'growth') return 'linear-gradient(to right, rgb(240,68,56), rgb(110,114,122), rgb(50,213,131))';
  return 'linear-gradient(to right, rgb(50,213,131), rgb(110,114,122), rgb(240,68,56))';
}

function renderMapIndicatorPicker(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `<div class="eco-map-picker">
    ${ECO_MAP_INDICATORS.map(k => `<button type="button" class="pill ${k === ecoMapIndicator ? 'active' : ''}" data-map-indicator="${k}">${ICONS[ECO_KPI_META[k].icon] || ''} ${ECO_KPI_META[k].label}</button>`).join('')}
  </div>`;
  el.querySelectorAll('[data-map-indicator]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.dataset.mapIndicator === ecoMapIndicator) return;
      ecoMapIndicator = btn.dataset.mapIndicator;
      el.querySelectorAll('[data-map-indicator]').forEach(b => b.classList.toggle('active', b.dataset.mapIndicator === ecoMapIndicator));
      renderMapMain();
    });
  });
}

// Panneau de détail au clic sur un pays — affiche exactement la donnée
// déjà reçue pour l'indicateur actif, jamais une valeur supplémentaire
// non chargée. Pour les 8 pays déjà couverts par une vraie fiche
// détaillée (ECO_COUNTRIES), ajoute un lien réel vers cette fiche.
function renderMapCountryDetail(code, entry){
  const el = document.getElementById('ecoMapDetail');
  if(!el) return;
  const meta = ECO_KPI_META[ecoMapIndicator];
  const label = WORLDBANK_MAP_COUNTRY_LABELS_FR[code] || code;
  const hasFullSheet = !!ECO_COUNTRIES[code];
  el.innerHTML = `
    <div class="eco-panel" style="margin-top:10px;">
      <span class="eco-panel-title">${label}</span>
      <p style="font-size:20px;font-family:'IBM Plex Mono',monospace;margin-top:6px;color:var(--term-text);">${meta.fmt(entry.value)}</p>
      <p class="eco-panel-note">${meta.label} · ${entry.year} · ${ecoMapData.source}</p>
      ${hasFullSheet ? `<button type="button" class="btn btn-sm eco-link" id="ecoMapGoToSheet" style="margin-top:8px;">Voir la fiche complète →</button>` : ''}
    </div>`;
  const goBtn = document.getElementById('ecoMapGoToSheet');
  if(goBtn) goBtn.addEventListener('click', () => {
    ecoActiveCountry = code;
    ecoActiveView = 'overview';
    renderEcoNav('ecoNav');
    renderEcoBody();
  });
}

function renderMapLegend(elId, meta, min, max){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <div class="eco-map-legend-bar" style="background:${ecoMapLegendGradient(meta.tone)};"></div>
    <div class="eco-map-legend-labels"><span>${meta.fmt(min)}</span><span>${meta.fmt(max)}</span></div>
    <div class="eco-map-legend-swatch"><span class="eco-map-swatch-off"></span> Hors périmètre ou donnée indisponible</div>`;
}

async function renderMapView(){
  renderMapIndicatorPicker('ecoKpis');
  await renderMapMain();
}

async function renderMapMain(){
  const mainEl = document.getElementById('ecoMain');
  if(!mainEl) return;
  mainEl.innerHTML = `<p class="eco-panel-note">Chargement de la carte…</p>`;
  const meta = ECO_KPI_META[ecoMapIndicator];
  let svgMarkup, mapData;
  try {
    [svgMarkup, mapData] = await Promise.all([
      ecoLoadMapSvg(),
      fetch(`/api/eco-map?indicator=${ecoMapIndicator}`).then(async resp => {
        if(!resp.ok){ const body = await resp.json().catch(() => ({})); throw new Error(body.error || `HTTP ${resp.status}`); }
        return resp.json();
      })
    ]);
  } catch(err){
    mainEl.innerHTML = `<p class="eco-panel-note">Carte indisponible pour le moment (${err.message}).</p>`;
    return;
  }
  ecoMapData = mapData;
  const values = mapData.values || {};
  const nums = Object.values(values).map(v => v.value);
  if(nums.length === 0){
    mainEl.innerHTML = `<p class="eco-panel-note">Aucune donnée réelle disponible pour "${meta.label}" pour le moment.</p>`;
    return;
  }
  const min = Math.min(...nums), max = Math.max(...nums);

  mainEl.innerHTML = `
    <p class="eco-panel-note">Carte limitée à l'Europe, aux Amériques et à l'Asie pour l'instant — l'Afrique et l'Océanie n'ont pas encore de données vérifiées sur ce site, jamais affichées par défaut plutôt qu'estimées.</p>
    <div class="eco-map-wrap" id="ecoMapSvgWrap">${svgMarkup}</div>
    <div class="eco-map-legend" id="ecoMapLegend"></div>
    <div id="ecoMapDetail"></div>
    <p class="eco-panel-note">${mapData.source} · Fond de carte : <a href="https://github.com/flekschas/simple-world-map" target="_blank" rel="noopener">simple-world-map</a> (CC BY-SA 3.0, Al MacDonald / Fritz Lekschas).</p>`;

  renderMapLegend('ecoMapLegend', meta, min, max);

  const wrapEl = document.getElementById('ecoMapSvgWrap');
  const svgEl = wrapEl.querySelector('svg');
  if(!svgEl) return;
  const pathsById = {};
  wrapEl.querySelectorAll('path[id]').forEach(p => { pathsById[p.id] = p; });
  const neutralFill = ecoCssVar('--term-card-hover') || '#141923';
  const neutralStroke = ecoCssVar('--term-border') || 'rgba(212,175,55,0.16)';
  Object.values(pathsById).forEach(path => {
    path.style.fill = neutralFill;
    path.style.stroke = neutralStroke;
    path.style.strokeWidth = '0.5';
  });
  Object.entries(values).forEach(([code, entry]) => {
    const path = pathsById[code.toLowerCase()];
    if(!path) return; // pays réel mais absent du fond de carte tiers -> ignoré, jamais une erreur bloquante
    const t = (max === min) ? 0.5 : (entry.value - min) / (max - min);
    path.style.fill = ecoMapColorFor(t, meta.tone);
    path.style.cursor = 'pointer';
    const label = WORLDBANK_MAP_COUNTRY_LABELS_FR[code] || code;
    // <title> natif : vraie infobulle au survol, sans logique JS de
    // positionnement à maintenir — nom réel, valeur réelle, année réelle.
    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    titleEl.textContent = `${label} — ${meta.fmt(entry.value)} (${entry.year})`;
    path.insertBefore(titleEl, path.firstChild);
    path.addEventListener('click', () => renderMapCountryDetail(code, entry));
  });
}

// ============================================================
// Module "Graph Lab" (06/09/2026) — superpose 2 vraies séries au choix
// (n'importe quel pays × indicateur déjà réel, ou l'un des 2 taux
// directeurs) sur une fenêtre calendaire commune. Aucune nouvelle donnée :
// réutilise exactement ecoFetchRealSeries, déjà partagé avec le
// Comparateur. Jamais un coefficient de corrélation calculé : superposer
// deux courbes réelles est déjà utile pour l'oeil, mais un vrai chiffre
// de corrélation nécessiterait un ré-échantillonnage (mensuel vs annuel)
// qui friserait l'invention de points n'ayant jamais existé — un
// disclaimer explicite rappelle qu'une ressemblance visuelle n'est
// jamais une causalité.
// ============================================================
function ecoGraphLabSeriesOptions(){
  const options = [];
  Object.entries(ECO_COUNTRIES).forEach(([code, c]) => {
    ['gdp-growth', 'inflation', 'unemployment', 'gov-debt', 'gov-deficit', 'consumer-confidence'].forEach(k => {
      if(c.kpis.includes(k)) options.push({value: `${code}:${k}`, label: `${c.flag} ${c.label} — ${ECO_KPI_META[k].label}`});
    });
  });
  // Taux directeurs ajoutés une seule fois chacun (jamais un doublon par
  // pays de la zone euro pour le même vrai taux BCE unique) — "FR"/"US"
  // servent juste de porte d'entrée réelle vers ecoComparePolicyRateKey,
  // pas une prétention que le taux serait spécifique à ce pays.
  options.push({value: 'FR:policy-rate', label: '🏦 BCE — Taux de dépôt (zone euro)'});
  options.push({value: 'US:policy-rate', label: '🏦 Fed — Taux des fonds fédéraux'});
  return options;
}
let ecoGraphLabA = 'FR:inflation';
let ecoGraphLabB = 'FR:policy-rate';
let ecoGraphLabChartA = null;
let ecoGraphLabChartB = null;

function ecoGraphLabYear(period){ return parseInt(String(period).slice(0, 4), 10); }

function renderGraphLabPicker(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const options = ecoGraphLabSeriesOptions();
  const selectHtml = (id, current) => `<select id="${id}">${options.map(o => `<option value="${o.value}" ${o.value === current ? 'selected' : ''}>${o.label}</option>`).join('')}</select>`;
  el.innerHTML = `
    <div style="grid-column:1/-1;display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
      <div class="field" style="margin-bottom:0;"><label for="ecoGraphLabSelectA">Série A</label>${selectHtml('ecoGraphLabSelectA', ecoGraphLabA)}</div>
      <div class="field" style="margin-bottom:0;"><label for="ecoGraphLabSelectB">Série B</label>${selectHtml('ecoGraphLabSelectB', ecoGraphLabB)}</div>
    </div>`;
  document.getElementById('ecoGraphLabSelectA').addEventListener('change', e => { ecoGraphLabA = e.target.value; renderGraphLabMain(); });
  document.getElementById('ecoGraphLabSelectB').addEventListener('change', e => { ecoGraphLabB = e.target.value; renderGraphLabMain(); });
}

async function renderGraphLabView(){
  renderGraphLabPicker('ecoKpis');
  await renderGraphLabMain();
}

function renderGraphLabChart(canvasId, series, color){
  const canvas = document.getElementById(canvasId);
  if(!canvas || typeof Chart === 'undefined') return null;
  const textDim = ecoCssVar('--term-text-dim') || '#9198A3';
  const hairline = ecoCssVar('--term-border') || 'rgba(212,175,55,0.16)';
  return new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {labels: series.points.map(p => p.period), datasets: [{label: series.label, data: series.points.map(p => p.value), borderColor: color, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.1}]},
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: {mode: 'index', intersect: false},
      scales: {
        x: {ticks: {color: textDim, maxTicksLimit: 8, font: {size: 10}}, grid: {color: hairline}},
        y: {ticks: {color: textDim, font: {size: 10}, callback: v => series.meta.fmt(v)}, grid: {color: hairline}}
      },
      plugins: {
        legend: {display: false},
        tooltip: {backgroundColor: '#0D1016', titleColor: '#D4AF37', bodyColor: '#F5F5F5', borderColor: hairline, borderWidth: 1, callbacks: {label: ctx => series.meta.fmt(ctx.parsed.y)}}
      }
    }
  });
}

async function renderGraphLabMain(){
  const mainEl = document.getElementById('ecoMain');
  if(!mainEl) return;
  mainEl.innerHTML = `<p class="eco-panel-note">Chargement des deux séries…</p>`;
  const [descA, descB] = [ecoGraphLabA, ecoGraphLabB].map(d => { const [country, key] = d.split(':'); return {country, key}; });
  const [seriesA, seriesB] = await Promise.all([
    ecoFetchRealSeries(descA.country, descA.key),
    ecoFetchRealSeries(descB.country, descB.key)
  ]);
  if(!seriesA || !seriesB){
    mainEl.innerHTML = `<p class="eco-panel-note">${!seriesA ? 'Série A' : 'Série B'} indisponible pour le moment.</p>`;
    return;
  }
  // Fenêtre calendaire commune (par année, seule granularité comparable
  // entre une série mensuelle et une série annuelle) — jamais une
  // superposition qui laisserait croire que les deux courbes couvrent la
  // même période si ce n'est pas réellement le cas.
  const yearsA = seriesA.points.map(p => ecoGraphLabYear(p.period));
  const yearsB = seriesB.points.map(p => ecoGraphLabYear(p.period));
  const start = Math.max(Math.min(...yearsA), Math.min(...yearsB));
  const end = Math.min(Math.max(...yearsA), Math.max(...yearsB));
  if(start > end){
    mainEl.innerHTML = `<p class="eco-panel-note">Ces deux séries n'ont aucune période réelle commune — impossible de les superposer honnêtement.</p>`;
    return;
  }
  const clip = points => points.filter(p => { const y = ecoGraphLabYear(p.period); return y >= start && y <= end; });
  const labelA = ecoGraphLabSeriesOptions().find(o => o.value === ecoGraphLabA).label;
  const labelB = ecoGraphLabSeriesOptions().find(o => o.value === ecoGraphLabB).label;
  const clippedA = {points: clip(seriesA.points), meta: seriesA.meta, label: labelA};
  const clippedB = {points: clip(seriesB.points), meta: seriesB.meta, label: labelB};

  mainEl.innerHTML = `
    <p class="eco-panel-note">Fenêtre commune réelle : ${start}–${end}. Chaque série garde sa propre fréquence réelle (mensuelle/trimestrielle/annuelle) — jamais ré-échantillonnée pour se faire correspondre artificiellement.</p>
    <div class="eco-panel" style="margin-top:8px;">
      <span class="eco-panel-title">${labelA}</span>
      <div style="position:relative;height:150px;margin-top:8px;"><canvas id="ecoGraphLabCanvasA"></canvas></div>
    </div>
    <div class="eco-panel" style="margin-top:10px;">
      <span class="eco-panel-title">${labelB}</span>
      <div style="position:relative;height:150px;margin-top:8px;"><canvas id="ecoGraphLabCanvasB"></canvas></div>
    </div>
    <p class="eco-panel-note">Superposition visuelle de deux séries réelles, jamais un coefficient de corrélation calculé (les fréquences réelles diffèrent souvent, un ré-échantillonnage inventerait des points qui n'existent pas). Une ressemblance d'évolution entre les deux courbes n'est jamais une preuve de causalité — une coïncidence de calendrier reste toujours possible.</p>`;

  if(ecoGraphLabChartA){ ecoGraphLabChartA.destroy(); ecoGraphLabChartA = null; }
  if(ecoGraphLabChartB){ ecoGraphLabChartB.destroy(); ecoGraphLabChartB = null; }
  ecoGraphLabChartA = renderGraphLabChart('ecoGraphLabCanvasA', clippedA, ecoCssVar('--term-gold-light') || '#F0D36B');
  ecoGraphLabChartB = renderGraphLabChart('ecoGraphLabCanvasB', clippedB, ecoCssVar('--term-blue') || '#4F8FE8');
}

// ============================================================
// Module "Crisis Replay" (06/09/2026) — 3 crises réelles rejouées avec les
// séries déjà branchées (taux BCE/Fed + croissance du PIB par pays),
// jamais une nouvelle source. Chaque narration ne cite QUE des faits
// historiques largement établis (dates d'événements réels), jamais un
// chiffre économique inventé — tout chiffre affiché vient du vrai point
// de donnée déjà chargé.
//
// Fenêtres et couverture vérifiées EN DIRECT le 06/09/2026 (curl réel via
// api/eco-rate) avant d'écrire ce module : les 3 séries Eurostat
// (croissance/inflation/chômage FR/DE/IT/ES) ne remontent PAS avant
// 2016 (chômage : pas avant sept. 2021) — la crise 2008 n'est donc
// réellement montrable que pour les 4 pays couverts par la Banque
// Mondiale (US/GB/JP/CN, annuelle depuis 1990) et les 2 taux directeurs
// (BCE depuis 1999, Fed depuis 1954). Jamais présenté comme une carence
// de ce module : une note explicite le dit sur cette crise précise.
// ============================================================
const ECO_CRISES = {
  'gfc-2008': {
    label: 'Crise financière 2008', startYear: 2007, endYear: 2010, peakYear: 2009,
    narrative: "Déclenchée par l'effondrement du marché immobilier américain (subprime) et la faillite de Lehman Brothers en septembre 2008, la crise financière mondiale a provoqué une récession sévère et des baisses de taux directeurs rapides de la part des banques centrales.",
    coverageNote: "Les séries Eurostat (France, Allemagne, Italie, Espagne) utilisées sur cette page ne remontent pas avant 2016 — cette crise n'est donc montrée ici que pour les États-Unis, le Royaume-Uni, le Japon et la Chine (Banque Mondiale, annuelle) et pour les taux directeurs BCE/Fed."
  },
  'covid-2020': {
    label: 'Covid-19 (2020)', startYear: 2019, endYear: 2022, peakYear: 2020,
    narrative: "Les mesures de confinement adoptées à partir de mars 2020 pour freiner la pandémie de Covid-19 ont provoqué un arrêt brutal de l'activité économique mondiale, suivi d'un rebond soutenu par des politiques monétaires et budgétaires exceptionnelles.",
    coverageNote: "Le chômage Eurostat (France, Allemagne, Italie, Espagne) utilisé sur cette page ne remonte pas avant septembre 2021 — la croissance du PIB reste, elle, disponible pour ces 4 pays sur cette période."
  },
  'inflation-2022': {
    label: "Choc d'inflation (2021-2023)", startYear: 2021, endYear: 2023, peakYear: 2022,
    narrative: "La reprise post-Covid, les tensions sur les chaînes d'approvisionnement et la guerre en Ukraine (à partir de février 2022) ont provoqué une forte hausse des prix de l'énergie et de l'alimentation, entraînant le cycle de hausses de taux directeurs le plus rapide depuis plusieurs décennies.",
    coverageNote: null
  }
};
let ecoActiveCrisis = 'inflation-2022'; // la mieux couverte pour les 8 pays, choisie par défaut
let ecoCrisisChartEcb = null;
let ecoCrisisChartFed = null;

function ecoCrisisClip(points, startYear, endYear){
  return points.filter(p => { const y = parseInt(String(p.period).slice(0, 4), 10); return y >= startYear && y <= endYear; });
}

function renderCrisisPicker(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `<div class="eco-map-picker" style="grid-column:1/-1;">
    ${Object.entries(ECO_CRISES).map(([key, c]) => `<button type="button" class="pill ${key === ecoActiveCrisis ? 'active' : ''}" data-crisis="${key}">${c.label}</button>`).join('')}
  </div>`;
  el.querySelectorAll('[data-crisis]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.dataset.crisis === ecoActiveCrisis) return;
      ecoActiveCrisis = btn.dataset.crisis;
      el.querySelectorAll('[data-crisis]').forEach(b => b.classList.toggle('active', b.dataset.crisis === ecoActiveCrisis));
      renderCrisisMain();
    });
  });
}

async function renderCrisisView(){
  renderCrisisPicker('ecoKpis');
  await renderCrisisMain();
}

// Une seule vraie valeur par pays pour la table : le dernier point réel
// dont l'année correspond à l'année charnière de la crise (pour les séries
// trimestrielles FR/DE/IT/ES, cela prend naturellement le dernier
// trimestre réel de cette année) — jamais une moyenne ou une estimation,
// et la période exacte affichée (ex. "2009-Q4") rend la granularité
// explicite plutôt que de la masquer derrière une simple année.
function ecoCrisisPeakValue(points, peakYear){
  const inYear = points.filter(p => parseInt(String(p.period).slice(0, 4), 10) === peakYear);
  return inYear.length > 0 ? inYear[inYear.length - 1] : null;
}

async function renderCrisisMain(){
  const mainEl = document.getElementById('ecoMain');
  if(!mainEl) return;
  mainEl.innerHTML = `<p class="eco-panel-note">Chargement…</p>`;
  const crisis = ECO_CRISES[ecoActiveCrisis];

  const countryCodes = Object.keys(ECO_COUNTRIES);
  const [ecbSeries, fedSeries, ...countrySeries] = await Promise.all([
    ecoFetchRealSeries('FR', 'policy-rate'),
    ecoFetchRealSeries('US', 'policy-rate'),
    ...countryCodes.map(code => ecoFetchRealSeries(code, 'gdp-growth'))
  ]);

  const tableRows = countryCodes.map((code, i) => {
    const series = countrySeries[i];
    const point = series ? ecoCrisisPeakValue(series.points, crisis.peakYear) : null;
    return {code, point, meta: series ? series.meta : ECO_KPI_META['gdp-growth']};
  });

  mainEl.innerHTML = `
    <p class="eco-panel-note">${crisis.narrative}</p>
    ${crisis.coverageNote ? `<p class="eco-panel-note" style="color:var(--term-gold-light);">${crisis.coverageNote}</p>` : ''}
    <div class="eco-panel" style="margin-top:8px;">
      <span class="eco-panel-title">Taux BCE (dépôt) — ${crisis.startYear}–${crisis.endYear}</span>
      <div style="position:relative;height:130px;margin-top:8px;"><canvas id="ecoCrisisCanvasEcb"></canvas></div>
    </div>
    <div class="eco-panel" style="margin-top:10px;">
      <span class="eco-panel-title">Taux Fed (fonds fédéraux) — ${crisis.startYear}–${crisis.endYear}</span>
      <div style="position:relative;height:130px;margin-top:8px;"><canvas id="ecoCrisisCanvasFed"></canvas></div>
    </div>
    <div class="eco-panel" style="margin-top:10px;">
      <span class="eco-panel-title">Croissance du PIB, dernière période réelle de ${crisis.peakYear}</span>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:8px;">
        <thead><tr>
          <th style="text-align:left;padding:6px 8px;color:var(--term-text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;text-transform:uppercase;">Pays</th>
          <th style="text-align:left;padding:6px 8px;color:var(--term-text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;text-transform:uppercase;">Période réelle</th>
          <th style="text-align:right;padding:6px 8px;color:var(--term-text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;text-transform:uppercase;">Croissance du PIB</th>
        </tr></thead>
        <tbody>
          ${tableRows.map(r => `<tr>
            <td style="padding:6px 8px;color:var(--term-text);">${ECO_COUNTRIES[r.code].flag} ${ECO_COUNTRIES[r.code].label}</td>
            <td style="padding:6px 8px;color:var(--term-text-dim);font-family:'IBM Plex Mono',monospace;">${r.point ? r.point.period : '—'}</td>
            <td style="text-align:right;padding:6px 8px;color:var(--term-text);font-family:'IBM Plex Mono',monospace;">${r.point ? r.meta.fmt(r.point.value) : '<span style="color:var(--term-text-dim);">N/D</span>'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p class="eco-panel-note">"N/D" = aucune vraie donnée disponible pour ce pays sur cette année précise — jamais une valeur estimée pour combler la case.</p>
    </div>
    <p class="eco-panel-note">Rejeu historique basé sur des données réellement publiées — jamais une reconstitution ni une prédiction. Les dates d'événements citées sont des faits historiques établis ; les chiffres affichés viennent uniquement des vraies séries déjà utilisées ailleurs sur cette page.</p>`;

  if(ecoCrisisChartEcb){ ecoCrisisChartEcb.destroy(); ecoCrisisChartEcb = null; }
  if(ecoCrisisChartFed){ ecoCrisisChartFed.destroy(); ecoCrisisChartFed = null; }
  if(ecbSeries){
    ecoCrisisChartEcb = renderGraphLabChart('ecoCrisisCanvasEcb', {points: ecoCrisisClip(ecbSeries.points, crisis.startYear, crisis.endYear), meta: ecbSeries.meta, label: 'BCE'}, ecoCssVar('--term-gold-light') || '#F0D36B');
  }
  if(fedSeries){
    ecoCrisisChartFed = renderGraphLabChart('ecoCrisisCanvasFed', {points: ecoCrisisClip(fedSeries.points, crisis.startYear, crisis.endYear), meta: fedSeries.meta, label: 'Fed'}, ecoCssVar('--term-blue') || '#4F8FE8');
  }
}

function renderEcoHeader(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const now = new Date();
  const actualise = `Actualisé · ${now.toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'})}`;
  const context = ecoActiveView === 'overview'
    ? `${ECO_COUNTRIES[ecoActiveCountry].flag} ${ECO_COUNTRIES[ecoActiveCountry].label}`
    : ECO_VIEWS[ecoActiveView].label;
  el.innerHTML = `${actualise}<br><strong>${context}</strong>`;
}

async function renderEcoKpis(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const country = ecoActiveCountry;
  const kpiKeys = ECO_COUNTRIES[country].kpis;
  el.innerHTML = kpiKeys.map(k => `
    <div class="eco-kpi is-loading" id="ecoKpi-${k}">
      <span class="eco-kpi-label">${ICONS[ECO_KPI_META[k].icon] || ''} ${ECO_KPI_META[k].label}</span>
      <span class="eco-kpi-value">Chargement…</span>
    </div>`).join('');

  await Promise.all(kpiKeys.map(async k => {
    const cardEl = document.getElementById(`ecoKpi-${k}`);
    if(!cardEl) return;
    const meta = ECO_KPI_META[k];
    const seriesKey = meta.seriesKey(country);
    try {
      const data = await fetchEcoSeries(seriesKey);
      let points = data.points;
      if(meta.isIndex && meta.isIndex(country)){
        // Conversion indice -> glissement annuel (12 mois), même fonction
        // que le reste du site (computeRealInflationRate, scripts/data.js).
        points = points.map((p, i) => {
          if(i < 12) return null;
          const rate = computeRealInflationRate(points.slice(0, i + 1));
          return typeof rate === 'number' ? {period: p.period, value: rate} : null;
        }).filter(Boolean);
        if(points.length === 0) throw new Error('Historique insuffisant pour calculer un glissement annuel');
      }
      const last = points[points.length - 1];
      const prev = points.length > 1 ? points[points.length - 2] : null;
      const delta = prev ? last.value - prev.value : 0;
      const deltaClass = prev ? ecoDeltaClass(meta.tone, delta) : 'flat';
      const arrow = deltaClass === 'up' ? '↑' : deltaClass === 'down' ? '↓' : '→';
      const sparkHistory = points.slice(-24).map(p => ({close: p.value, date: p.period}));
      cardEl.classList.remove('is-loading');
      cardEl.innerHTML = `
        <span class="eco-kpi-label">${ICONS[meta.icon] || ''} ${meta.label}</span>
        <span class="eco-kpi-value">${meta.fmt(last.value)}</span>
        ${prev ? `<span class="eco-kpi-delta ${deltaClass}">${arrow} ${meta.fmt(Math.abs(delta)).replace(/^\+/, '')} vs période préc.</span>` : ''}
        <div class="eco-kpi-spark">${renderSparklineHTML(sparkHistory, {compact: true})}</div>
        <span class="eco-kpi-asof">${ecoFreshnessBadge(data.frequency)} · ${last.period}</span>`;
    } catch(err){
      cardEl.classList.remove('is-loading');
      cardEl.classList.add('is-unavailable');
      cardEl.innerHTML = `
        <span class="eco-kpi-label">${ICONS[meta.icon] || ''} ${meta.label}</span>
        <span class="eco-kpi-value" style="font-size:12px;font-weight:400;color:var(--term-text-dim);">Donnée indisponible</span>
        <span class="eco-kpi-asof">${err.message}</span>`;
    }
  }));
}

// ============================================================
// Graphique principal "Macro Trend" — Chart.js (chargé sur cette page,
// même version/intégrité que parcours.html). Un seul pays à la fois
// (celui sélectionné dans la navigation) : la superposition de plusieurs
// pays sur un même graphique est reportée à un chantier futur (Graph
// Lab) plutôt que construite à la hâte ici. Variable + période
// filtrées côté client à partir de l'historique déjà récupéré (pas
// d'appel réseau supplémentaire par changement de période).
// ============================================================
const ECO_CHART_VARIABLES = ['gdp-growth', 'inflation', 'unemployment', 'gov-debt', 'gov-deficit'];
const ECO_CHART_PERIODS = [
  {key: '5a', label: '5 ans', years: 5},
  {key: '10a', label: '10 ans', years: 10},
  {key: 'max', label: 'Historique complet', years: null}
];
let ecoChartVariable = 'gdp-growth';
let ecoChartPeriodKey = '10a';
let ecoChartInstance = null;

function ecoCssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Estime le nombre de points correspondant à N années selon la fréquence
// réelle de la série (jamais une troncature arbitraire identique pour du
// mensuel/trimestriel/annuel).
function ecoPointsForYears(frequency, years){
  if(years === null) return Infinity;
  if(/mensuelle/i.test(frequency)) return years * 12;
  if(/trimestrielle/i.test(frequency)) return years * 4;
  return years; // annuelle
}

async function renderEcoMainChart(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const country = ecoActiveCountry;
  const availableVars = ECO_CHART_VARIABLES.filter(v => ECO_COUNTRIES[country].kpis.includes(v));
  if(!availableVars.includes(ecoChartVariable)) ecoChartVariable = availableVars[0];
  if(!ecoChartVariable){
    el.innerHTML = `<span class="eco-panel-title">Macro Trend</span><p class="eco-panel-note">Aucune série chronologique disponible pour ${ECO_COUNTRIES[country].label} pour le moment.</p>`;
    return;
  }

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <span class="eco-panel-title">Macro Trend</span>
      <div class="mode-toggle" id="${elId}-tabs">
        ${availableVars.map(v => `<button type="button" class="pill ${v === ecoChartVariable ? 'active' : ''}" data-var="${v}">${ECO_KPI_META[v].label}</button>`).join('')}
      </div>
    </div>
    <select id="${elId}-period" style="margin-top:10px;max-width:220px;">
      ${ECO_CHART_PERIODS.map(p => `<option value="${p.key}" ${p.key === ecoChartPeriodKey ? 'selected' : ''}>${p.label}</option>`).join('')}
    </select>
    <div id="${elId}-canvas-wrap" style="position:relative;flex:1;min-height:220px;margin-top:14px;">
      <canvas id="${elId}-canvas"></canvas>
    </div>
    <p class="eco-panel-note" id="${elId}-note"></p>`;

  document.querySelectorAll(`#${elId}-tabs .pill`).forEach(btn => {
    btn.addEventListener('click', () => { ecoChartVariable = btn.dataset.var; renderEcoMainChart(elId); });
  });
  document.getElementById(`${elId}-period`).addEventListener('change', e => { ecoChartPeriodKey = e.target.value; renderEcoMainChart(elId); });

  const canvas = document.getElementById(`${elId}-canvas`);
  const noteEl = document.getElementById(`${elId}-note`);
  const meta = ECO_KPI_META[ecoChartVariable];
  const seriesKey = meta.seriesKey(country);
  try {
    const data = await fetchEcoSeries(seriesKey);
    let points = data.points;
    if(meta.isIndex && meta.isIndex(country)){
      points = points.map((p, i) => {
        if(i < 12) return null;
        const rate = computeRealInflationRate(points.slice(0, i + 1));
        return typeof rate === 'number' ? {period: p.period, value: rate} : null;
      }).filter(Boolean);
    }
    const n = ecoPointsForYears(data.frequency, ECO_CHART_PERIODS.find(p => p.key === ecoChartPeriodKey).years);
    const shown = Number.isFinite(n) ? points.slice(-n) : points;
    if(shown.length === 0) throw new Error('Historique insuffisant pour cette période');

    if(!canvas || typeof Chart === 'undefined') throw new Error('Chart.js indisponible');
    if(ecoChartInstance) ecoChartInstance.destroy();
    const gold = ecoCssVar('--term-gold-light') || '#F0D36B';
    const hairline = ecoCssVar('--term-border') || 'rgba(212,175,55,0.16)';
    const textDim = ecoCssVar('--term-text-dim') || '#9198A3';
    ecoChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: shown.map(p => p.period),
        datasets: [{
          data: shown.map(p => p.value),
          borderColor: gold, backgroundColor: 'rgba(240,211,107,0.12)',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.15
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: {duration: 260},
        interaction: {mode: 'index', intersect: false},
        scales: {
          x: {ticks: {color: textDim, maxTicksLimit: 8, font: {size: 10}}, grid: {color: hairline}},
          y: {ticks: {color: textDim, font: {size: 10}, callback: v => meta.fmt(v)}, grid: {color: hairline}}
        },
        plugins: {
          legend: {display: false},
          tooltip: {
            backgroundColor: '#0D1016', titleColor: gold, bodyColor: '#F5F5F5', borderColor: hairline, borderWidth: 1,
            callbacks: {label: ctx => meta.fmt(ctx.parsed.y)}
          }
        }
      }
    });
    noteEl.textContent = `${data.source} · ${data.instrument}`;
  } catch(err){
    if(ecoChartInstance){ ecoChartInstance.destroy(); ecoChartInstance = null; }
    document.getElementById(`${elId}-canvas-wrap`).innerHTML = `<p class="eco-panel-note">Donnée indisponible (${err.message}).</p>`;
    noteEl.textContent = '';
  }
}

function rerenderEcoMain(){ renderEcoMainChart('ecoMain'); }

// ============================================================
// Module "Comparateur" (section 26 du brief) — réutilise entièrement
// les vraies séries déjà branchées pour les 8 pays de la navigation,
// aucune nouvelle source de données. Volontairement PAS de radar
// multi-indicateurs normalisé : mélanger des unités différentes (%,
// % PIB, points d'indice) sur un même axe 0-100 donnerait l'impression
// d'un score composite alors que ce serait une normalisation inventée —
// un graphique en barres par indicateur + un tableau comparatif complet
// couvrent le même besoin honnêtement.
// ============================================================
const ECO_COMPARE_ROWS = ['gdp-growth', 'inflation', 'unemployment', 'gov-debt', 'gov-deficit', 'policy-rate'];
let ecoCompareCountries = ['FR', 'DE', 'US'];
let ecoCompareVariable = 'gdp-growth';

// Le taux directeur n'a pas de clé KPI unique par pays (BCE pour la zone
// euro, Fed pour les États-Unis, aucune source pour GB/JP/CN) — résolu
// ici plutôt que fabriqué comme un indicateur générique.
function ecoComparePolicyRateKey(country){
  if(ECO_COUNTRIES[country].kpis.includes('policy-rate-ecb')) return 'policy-rate-ecb';
  if(ECO_COUNTRIES[country].kpis.includes('policy-rate-fed')) return 'policy-rate-fed';
  return null;
}

// Extrait de ecoFetchLatest (Graph Lab, 06/09/2026) : la logique de
// résolution de clé réelle + conversion indice->taux d'inflation est
// désormais partagée entre "dernière valeur" (Comparateur) et "série
// complète" (Graph Lab) — un seul endroit qui décide ce qu'est une vraie
// donnée pour ce pays/indicateur, jamais deux logiques qui pourraient
// diverger.
async function ecoFetchRealSeries(country, rowKey){
  const key = rowKey === 'policy-rate' ? ecoComparePolicyRateKey(country) : (ECO_COUNTRIES[country].kpis.includes(rowKey) ? rowKey : null);
  if(!key) return null; // pas de vraie source pour ce pays -> jamais une case vide fabriquée, juste absente
  const meta = ECO_KPI_META[key];
  try {
    const data = await fetchEcoSeries(meta.seriesKey(country));
    let points = data.points;
    if(meta.isIndex && meta.isIndex(country)){
      points = points.map((p, i) => {
        if(i < 12) return null;
        const rate = computeRealInflationRate(points.slice(0, i + 1));
        return typeof rate === 'number' ? {period: p.period, value: rate} : null;
      }).filter(Boolean);
      if(points.length === 0) return null;
    }
    return {points, meta};
  } catch(err){
    return null;
  }
}
async function ecoFetchLatest(country, rowKey){
  const series = await ecoFetchRealSeries(country, rowKey);
  if(!series || series.points.length === 0) return null;
  const last = series.points[series.points.length - 1];
  return {value: last.value, period: last.period, meta: series.meta};
}

async function renderCompareView(){
  const kpisEl = document.getElementById('ecoKpis');
  const mainEl = document.getElementById('ecoMain');
  if(!kpisEl || !mainEl) return;

  kpisEl.innerHTML = `
    <div style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
      ${Object.entries(ECO_COUNTRIES).map(([code, c]) => `<button type="button" class="pill ${ecoCompareCountries.includes(code) ? 'active' : ''}" data-country="${code}">${c.flag} ${c.label}</button>`).join('')}
    </div>`;
  kpisEl.querySelectorAll('button[data-country]').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.country;
      if(ecoCompareCountries.includes(code)){
        if(ecoCompareCountries.length > 1) ecoCompareCountries = ecoCompareCountries.filter(c => c !== code); // au moins 1 pays affiché
      } else if(ecoCompareCountries.length < 5){ // 5 max, lisibilité du graphique/tableau
        ecoCompareCountries = [...ecoCompareCountries, code];
      }
      renderCompareView();
    });
  });

  mainEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <span class="eco-panel-title">Comparateur international</span>
      <div class="mode-toggle" id="ecoCompareTabs">
        ${ECO_COMPARE_ROWS.map(v => `<button type="button" class="pill ${v === ecoCompareVariable ? 'active' : ''}" data-var="${v}">${v === 'policy-rate' ? 'Taux directeur' : ECO_KPI_META[v].label}</button>`).join('')}
      </div>
    </div>
    <div style="position:relative;flex:1;min-height:180px;margin-top:14px;" id="ecoCompareChartWrap"><canvas id="ecoCompareChart"></canvas></div>
    <div style="overflow-x:auto;margin-top:16px;">
      <table id="ecoCompareTable" style="width:100%;border-collapse:collapse;font-size:11.5px;">
        <thead><tr>
          <th style="text-align:left;padding:6px 8px;color:var(--term-text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;text-transform:uppercase;">Indicateur</th>
          ${ecoCompareCountries.map(c => `<th style="text-align:right;padding:6px 8px;color:var(--term-gold-light);">${ECO_COUNTRIES[c].flag} ${ECO_COUNTRIES[c].label}</th>`).join('')}
        </tr></thead>
        <tbody id="ecoCompareTableBody"></tbody>
      </table>
    </div>
    <p class="eco-panel-note">"N/D" = aucune source réelle intégrée à ce jour pour ce pays sur cet indicateur — jamais une valeur estimée pour combler la case.</p>`;

  document.querySelectorAll('#ecoCompareTabs .pill').forEach(btn => {
    btn.addEventListener('click', () => { ecoCompareVariable = btn.dataset.var; renderCompareView(); });
  });

  const tableResults = {};
  await Promise.all(ECO_COMPARE_ROWS.map(async row => {
    tableResults[row] = {};
    await Promise.all(ecoCompareCountries.map(async country => {
      tableResults[row][country] = await ecoFetchLatest(country, row);
    }));
  }));

  document.getElementById('ecoCompareTableBody').innerHTML = ECO_COMPARE_ROWS.map(row => `
    <tr style="border-top:1px solid var(--term-border);">
      <td style="padding:6px 8px;color:var(--term-text-dim);">${row === 'policy-rate' ? 'Taux directeur' : ECO_KPI_META[row].label}</td>
      ${ecoCompareCountries.map(country => {
        const r = tableResults[row][country];
        return `<td style="text-align:right;padding:6px 8px;" class="mono">${r ? r.meta.fmt(r.value) : '<span style="color:var(--term-text-dim);">N/D</span>'}</td>`;
      }).join('')}
    </tr>`).join('');

  const canvas = document.getElementById('ecoCompareChart');
  if(canvas && typeof Chart !== 'undefined'){
    if(ecoChartInstance){ ecoChartInstance.destroy(); ecoChartInstance = null; }
    const barData = ecoCompareCountries.map(c => tableResults[ecoCompareVariable][c]);
    const gold = ecoCssVar('--term-gold-light') || '#F0D36B';
    const hairline = ecoCssVar('--term-border') || 'rgba(212,175,55,0.16)';
    const textDim = ecoCssVar('--term-text-dim') || '#9198A3';
    ecoChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ecoCompareCountries.map(c => `${ECO_COUNTRIES[c].flag} ${ECO_COUNTRIES[c].label}`),
        datasets: [{data: barData.map(r => r ? r.value : null), backgroundColor: gold, borderRadius: 2}]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: {ticks: {color: textDim, font: {size: 10.5}}, grid: {display: false}},
          y: {ticks: {color: textDim, font: {size: 10}}, grid: {color: hairline}}
        },
        plugins: {
          legend: {display: false},
          tooltip: {
            backgroundColor: '#0D1016', titleColor: gold, bodyColor: '#F5F5F5', borderColor: hairline, borderWidth: 1,
            callbacks: {label: ctx => { const r = barData[ctx.dataIndex]; return r ? r.meta.fmt(r.value) + ' · ' + r.period : 'Donnée indisponible'; }}
          }
        }
      }
    });
  }
}

// ============================================================
// Module "Banques centrales" — seules la BCE et la Fed ont une vraie
// source de taux directeur intégrée à ce jour (aucune source gratuite
// fiable identifiée pour BoE/BoJ/PBoC lors de l'audit du 06/09/2026) —
// jamais de carte BoE/BoJ/PBoC vide ou fabriquée en attendant. Idem pour
// les dates de "prochaine réunion" : aucune source vérifiée, donc jamais
// affichées (un lien vers le calendrier officiel remplace la donnée).
// ============================================================
const ECO_CENTRAL_BANKS = [
  {key: 'ecb', label: 'BCE', seriesKey: 'policy-rate-ecb-history', officialUrl: 'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html'},
  {key: 'fed', label: 'Fed', seriesKey: 'policy-rate-fed', officialUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm'}
];

// ---------- Calendrier des réunions de politique monétaire — dates
// réelles vérifiées directement sur les calendriers officiels le
// 06/09/2026 (jamais un chiffre "consensus"/"attendu" : ces dates sont
// déjà fixées et publiées par les banques centrales elles-mêmes, pas une
// prévision). Snapshot manuel, à mettre à jour quand une nouvelle année
// de calendrier est publiée — même discipline que le budget de l'État. ----------
const ECO_CENTRAL_BANK_MEETINGS = [
  {date: '2026-09-09', dateEnd: '2026-09-10', bank: 'BCE', url: 'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html'},
  {date: '2026-09-15', dateEnd: '2026-09-16', bank: 'Fed', url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm'},
  {date: '2026-10-27', dateEnd: '2026-10-28', bank: 'Fed', url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm'},
  {date: '2026-10-28', dateEnd: '2026-10-29', bank: 'BCE', url: 'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html'},
  {date: '2026-12-08', dateEnd: '2026-12-09', bank: 'Fed', url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm'},
  {date: '2026-12-16', dateEnd: '2026-12-17', bank: 'BCE', url: 'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html'}
];

function ecoFormatDateRange(start, end){
  const s = new Date(start + 'T00:00:00'), e = new Date(end + 'T00:00:00');
  const sameMonth = s.getMonth() === e.getMonth();
  const dayFmt = d => d.toLocaleDateString('fr-FR', {day: '2-digit'});
  const fullFmt = d => d.toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'});
  return sameMonth ? `${dayFmt(s)}-${fullFmt(e)}` : `${fullFmt(s)} - ${fullFmt(e)}`;
}
function ecoNextMeetingFor(bank, fromDate){
  return ECO_CENTRAL_BANK_MEETINGS.filter(m => m.bank === bank && m.dateEnd >= fromDate).sort((a, b) => a.date < b.date ? -1 : 1)[0] || null;
}
function ecoUpcomingMeetings(fromDate){
  return ECO_CENTRAL_BANK_MEETINGS.filter(m => m.dateEnd >= fromDate).sort((a, b) => a.date < b.date ? -1 : 1);
}

// Dernier VRAI changement de taux dans l'historique (jamais une date
// de réunion supposée) : le premier point, en partant de la fin, dont
// la valeur diffère du point précédent.
function ecoLastRateChange(points){
  for(let i = points.length - 1; i > 0; i--){
    const delta = points[i].value - points[i - 1].value;
    if(Math.abs(delta) > 1e-9) return {period: points[i].period, delta};
  }
  return null;
}

async function renderCentralBanksView(){
  const kpisEl = document.getElementById('ecoKpis');
  const mainEl = document.getElementById('ecoMain');
  if(!kpisEl || !mainEl) return;

  kpisEl.innerHTML = ECO_CENTRAL_BANKS.map(b => `
    <div class="eco-kpi is-loading" id="ecoCb-${b.key}">
      <span class="eco-kpi-label">${ICONS.landmark || ''} Taux ${b.label}</span>
      <span class="eco-kpi-value">Chargement…</span>
    </div>`).join('');

  const results = {};
  await Promise.all(ECO_CENTRAL_BANKS.map(async b => {
    const cardEl = document.getElementById(`ecoCb-${b.key}`);
    try {
      const data = await fetchEcoSeries(b.seriesKey);
      results[b.key] = data;
      const last = data.points[data.points.length - 1];
      const change = ecoLastRateChange(data.points);
      const next = ecoNextMeetingFor(b.label, last.period.slice(0, 10));
      cardEl.classList.remove('is-loading');
      cardEl.innerHTML = `
        <span class="eco-kpi-label">${ICONS.landmark || ''} Taux ${b.label}</span>
        <span class="eco-kpi-value">${last.value.toFixed(2)} %</span>
        ${change ? `<span class="eco-kpi-delta ${change.delta > 0 ? 'down' : 'up'}">${change.delta > 0 ? '↑' : '↓'} ${Math.abs(change.delta).toFixed(2)} pt le ${change.period}</span>` : `<span class="eco-kpi-delta flat">Aucun changement sur la période couverte</span>`}
        ${next ? `<span class="eco-kpi-delta flat">Prochaine réunion : ${ecoFormatDateRange(next.date, next.dateEnd)}</span>` : ''}
        <span class="eco-kpi-asof">${ecoFreshnessBadge(data.frequency)} · ${last.period} · <a href="${b.officialUrl}" target="_blank" rel="noopener" style="color:var(--term-text-dim);">Calendrier officiel →</a></span>`;
    } catch(err){
      cardEl.classList.remove('is-loading');
      cardEl.classList.add('is-unavailable');
      cardEl.innerHTML = `<span class="eco-kpi-label">${ICONS.landmark || ''} Taux ${b.label}</span><span class="eco-kpi-value" style="font-size:12px;font-weight:400;color:var(--term-text-dim);">Donnée indisponible</span><span class="eco-kpi-asof">${err.message}</span>`;
    }
  }));

  mainEl.innerHTML = `
    <span class="eco-panel-title">Taux directeurs — BCE vs Fed</span>
    <div style="position:relative;flex:1;min-height:200px;margin-top:12px;" id="ecoCbChartWrap"><canvas id="ecoCbChart"></canvas></div>
    <p class="eco-panel-note">BCE : taux de la facilité de dépôt (taux administré). Fed : taux effectif des fonds fédéraux (taux de marché) — deux concepts proches mais pas rigoureusement comparables terme à terme.</p>
    <div class="eco-mechanism" style="margin-top:16px;">
      <span class="eco-panel-title">Pourquoi les taux changent ? <span style="font-weight:400;text-transform:none;font-size:10.5px;color:var(--term-text-dim);">— mécanisme simplifié, pas une causalité automatique</span></span>
      <div class="eco-mechanism-flow">
        ${['Inflation', 'Banque centrale', 'Taux directeurs', 'Coût du crédit', 'Consommation / investissement', 'Croissance', 'Inflation'].map((step, i, arr) => `<span class="eco-mechanism-step">${step}</span>${i < arr.length - 1 ? '<span class="eco-mechanism-arrow">→</span>' : ''}`).join('')}
      </div>
    </div>
    <div class="eco-panel" style="margin-top:16px;padding:12px 14px;">
      <span class="eco-panel-title">Prochaines réunions de politique monétaire</span>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
        ${ecoUpcomingMeetings(new Date().toISOString().slice(0, 10)).slice(0, 4).map(m => `
          <a href="${m.url}" target="_blank" rel="noopener" style="border-bottom:1px solid var(--term-border);padding:6px 2px;text-decoration:none;color:inherit;display:flex;justify-content:space-between;font-size:12px;">
            <span>${m.bank}</span><span class="mono" style="color:var(--term-text-dim);">${ecoFormatDateRange(m.date, m.dateEnd)}</span>
          </a>`).join('') || '<p class="eco-panel-note">Aucune réunion à venir dans le calendrier connu.</p>'}
      </div>
      <p class="eco-panel-note">Dates officielles publiées par la BCE et la Réserve fédérale — jamais un chiffre "consensus" ou "attendu" pour la décision elle-même.</p>
    </div>`;

  const canvas = document.getElementById('ecoCbChart');
  if(canvas && typeof Chart !== 'undefined' && results.ecb && results.fed){
    if(ecoChartInstance){ ecoChartInstance.destroy(); ecoChartInstance = null; }
    const gold = ecoCssVar('--term-gold-light') || '#F0D36B';
    const blue = ecoCssVar('--term-blue') || '#4F8FE8';
    const hairline = ecoCssVar('--term-border') || 'rgba(212,175,55,0.16)';
    const textDim = ecoCssVar('--term-text-dim') || '#9198A3';
    const ecbMonthly = results.ecb.points.slice(-120);
    const fedMonthly = results.fed.points.slice(-120);
    const labels = ecbMonthly.map(p => p.period.slice(0, 7));
    ecoChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {label: 'BCE (dépôt)', data: ecbMonthly.map(p => p.value), borderColor: gold, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.1},
          {label: 'Fed (fonds fédéraux)', data: fedMonthly.map(p => p.value), borderColor: blue, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.1}
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: {mode: 'index', intersect: false},
        scales: {
          x: {ticks: {color: textDim, maxTicksLimit: 8, font: {size: 10}}, grid: {color: hairline}},
          y: {ticks: {color: textDim, font: {size: 10}, callback: v => v + ' %'}, grid: {color: hairline}}
        },
        plugins: {
          legend: {labels: {color: textDim, font: {size: 10.5}}},
          tooltip: {backgroundColor: '#0D1016', titleColor: gold, bodyColor: '#F5F5F5', borderColor: hairline, borderWidth: 1}
        }
      }
    });
  }
}

// ============================================================
// Module "Dette & déficit" — historique réel (pays de la navigation),
// décomposition pédagogique de l'identité comptable de la dette (formule
// réelle, générique — jamais des chiffres actuels plaqués dessus tant
// que la charge d'intérêts en % du PIB n'a pas de source vérifiée), et
// un simulateur standard (mêmes conventions que "Projeter mon capital"
// du cockpit : <dialog> natif, disclaimer pédagogique explicite).
// ============================================================
async function renderDebtView(){
  const kpisEl = document.getElementById('ecoKpis');
  const mainEl = document.getElementById('ecoMain');
  if(!kpisEl || !mainEl) return;
  const country = ecoActiveCountry;
  const hasDebt = ECO_COUNTRIES[country].kpis.includes('gov-debt');
  const hasDeficit = ECO_COUNTRIES[country].kpis.includes('gov-deficit');

  kpisEl.innerHTML = ['gov-debt', 'gov-deficit'].filter(k => ECO_COUNTRIES[country].kpis.includes(k)).map(k => `<div class="eco-kpi is-loading" id="ecoDebtKpi-${k}"><span class="eco-kpi-label">${ICONS[ECO_KPI_META[k].icon] || ''} ${ECO_KPI_META[k].label}</span><span class="eco-kpi-value">Chargement…</span></div>`).join('')
    || `<p class="eco-panel-note" style="padding:14px;">Aucune donnée de dette/déficit pour ${ECO_COUNTRIES[country].label} pour le moment.</p>`;

  await Promise.all(['gov-debt', 'gov-deficit'].filter(k => ECO_COUNTRIES[country].kpis.includes(k)).map(async k => {
    const cardEl = document.getElementById(`ecoDebtKpi-${k}`);
    const meta = ECO_KPI_META[k];
    try {
      const data = await fetchEcoSeries(meta.seriesKey(country));
      const last = data.points[data.points.length - 1];
      cardEl.classList.remove('is-loading');
      cardEl.innerHTML = `<span class="eco-kpi-label">${ICONS[meta.icon] || ''} ${meta.label}</span><span class="eco-kpi-value">${meta.fmt(last.value)}</span><span class="eco-kpi-asof">${ecoFreshnessBadge(data.frequency)} · ${last.period}</span>`;
    } catch(err){
      cardEl.classList.remove('is-loading'); cardEl.classList.add('is-unavailable');
      cardEl.innerHTML = `<span class="eco-kpi-label">${ICONS[meta.icon] || ''} ${meta.label}</span><span class="eco-kpi-value" style="font-size:12px;font-weight:400;color:var(--term-text-dim);">Donnée indisponible</span>`;
    }
  }));

  mainEl.innerHTML = `
    <span class="eco-panel-title">Dette publique — ${ECO_COUNTRIES[country].label}<button type="button" class="eco-link" id="ecoDebtSimBtn">Simuler la dette →</button></span>
    <div style="position:relative;flex:1;min-height:200px;margin-top:12px;" id="ecoDebtChartWrap"><canvas id="ecoDebtChart"></canvas></div>
    <div class="eco-mechanism" style="margin-top:16px;">
      <span class="eco-panel-title">Pourquoi la dette augmente ? <span style="font-weight:400;text-transform:none;font-size:10.5px;color:var(--term-text-dim);">— identité comptable, pas une prévision</span></span>
      <div class="eco-mechanism-flow">
        <span class="eco-mechanism-step">Déficit primaire</span><span class="eco-mechanism-arrow">+</span>
        <span class="eco-mechanism-step">Charge d'intérêts</span><span class="eco-mechanism-arrow">−</span>
        <span class="eco-mechanism-step">Croissance nominale</span><span class="eco-mechanism-arrow">=</span>
        <span class="eco-mechanism-step" style="border-color:var(--term-gold);color:var(--term-gold-light);">Dynamique de la dette</span>
      </div>
      <p class="eco-panel-note">Un déficit primaire élevé, des taux d'intérêt supérieurs à la croissance nominale, ou les deux à la fois, font mécaniquement augmenter le ratio dette/PIB — et inversement.</p>
    </div>`;

  if(!hasDebt){ document.getElementById('ecoDebtChartWrap').innerHTML = `<p class="eco-panel-note">Historique de dette indisponible pour ${ECO_COUNTRIES[country].label}.</p>`; }
  else {
    try {
      const data = await fetchEcoSeries(ECO_KPI_META['gov-debt'].seriesKey(country));
      const canvas = document.getElementById('ecoDebtChart');
      if(canvas && typeof Chart !== 'undefined'){
        if(ecoChartInstance){ ecoChartInstance.destroy(); ecoChartInstance = null; }
        const gold = ecoCssVar('--term-gold-light') || '#F0D36B';
        const hairline = ecoCssVar('--term-border') || 'rgba(212,175,55,0.16)';
        const textDim = ecoCssVar('--term-text-dim') || '#9198A3';
        ecoChartInstance = new Chart(canvas.getContext('2d'), {
          type: 'line',
          data: {labels: data.points.map(p => p.period), datasets: [{data: data.points.map(p => p.value), borderColor: gold, backgroundColor: 'rgba(240,211,107,0.1)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.15}]},
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: {x: {ticks: {color: textDim, maxTicksLimit: 8, font: {size: 10}}, grid: {color: hairline}}, y: {ticks: {color: textDim, font: {size: 10}, callback: v => v + ' % PIB'}, grid: {color: hairline}}},
            plugins: {legend: {display: false}, tooltip: {backgroundColor: '#0D1016', titleColor: gold, bodyColor: '#F5F5F5', borderColor: hairline, borderWidth: 1}}
          }
        });
      }
    } catch(err){
      document.getElementById('ecoDebtChartWrap').innerHTML = `<p class="eco-panel-note">Donnée indisponible (${err.message}).</p>`;
    }
  }

  const simBtn = document.getElementById('ecoDebtSimBtn');
  if(simBtn) simBtn.addEventListener('click', () => openDebtSimulator(country, hasDebt));
}

// ---------- Simulateur de dette : même motif que "Projeter mon capital"
// du cockpit (parcours.js) — <dialog> natif, formule standard de
// dynamique de la dette, pré-rempli avec la VRAIE dette actuelle du pays
// quand disponible, jamais un exemple fabriqué. ----------
function computeDebtProjection(params){
  const {dette0, croissanceReellePct, inflationPct, tauxInteretPct, soldePrimairePct} = params;
  const croissanceNominalePct = (1 + croissanceReellePct / 100) * (1 + inflationPct / 100) * 100 - 100;
  const results = {};
  let dette = dette0;
  for(let year = 1; year <= 20; year++){
    const interets = dette * (tauxInteretPct / 100);
    const croissanceEffet = dette * (croissanceNominalePct / 100) / (1 + croissanceNominalePct / 100);
    dette = dette + interets - croissanceEffet - soldePrimairePct;
    if([5, 10, 20].includes(year)) results[year] = dette;
  }
  return {croissanceNominalePct, atHorizon: results};
}

function openDebtSimulator(country, hasDebt){
  let dialog = document.getElementById('ecoDebtSimDialog');
  if(!dialog){
    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="ecoDebtSimDialog" class="eco-modal">
        <form method="dialog">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:4px;">Simuler la dette publique</h3>
          <p class="disclaimer-box" style="margin-bottom:14px;">Simulation pédagogique — identité comptable standard, pas une prévision officielle. Les hypothèses sont les tiennes, jamais des données réelles projetées comme certaines.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="field"><label for="dsDette0">Dette initiale (% PIB)</label><input type="number" id="dsDette0" step="0.1"></div>
            <div class="field"><label for="dsCroissance">Croissance réelle (%/an)</label><input type="number" id="dsCroissance" step="0.1" value="1.2"></div>
            <div class="field"><label for="dsInflation">Inflation (%/an)</label><input type="number" id="dsInflation" step="0.1" value="2"></div>
            <div class="field"><label for="dsTaux">Taux d'intérêt apparent (%/an)</label><input type="number" id="dsTaux" step="0.1" value="3"></div>
            <div class="field" style="grid-column:1/-1;"><label for="dsSolde">Solde primaire (% PIB, négatif = déficit primaire)</label><input type="number" id="dsSolde" step="0.1" value="-1"></div>
          </div>
          <div id="dsResults" style="margin-top:14px;"></div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
            <button type="submit" class="btn btn-sm" id="dsCloseBtn">Fermer</button>
          </div>
        </form>
      </dialog>`);
    dialog = document.getElementById('ecoDebtSimDialog');
    const recompute = () => {
      const params = {
        dette0: +document.getElementById('dsDette0').value || 0,
        croissanceReellePct: +document.getElementById('dsCroissance').value || 0,
        inflationPct: +document.getElementById('dsInflation').value || 0,
        tauxInteretPct: +document.getElementById('dsTaux').value || 0,
        soldePrimairePct: +document.getElementById('dsSolde').value || 0
      };
      const proj = computeDebtProjection(params);
      document.getElementById('dsResults').innerHTML = [5, 10, 20].map(h => `
        <div class="result-row"><span class="result-horizon">Dans ${h} ans</span><span class="result-value mono">${proj.atHorizon[h].toFixed(1)} % PIB</span></div>`).join('');
    };
    ['dsDette0', 'dsCroissance', 'dsInflation', 'dsTaux', 'dsSolde'].forEach(id => document.getElementById(id).addEventListener('input', recompute));
    dialog._recompute = recompute;
  }
  fetchEcoSeries(ECO_KPI_META['gov-debt'].seriesKey(country)).then(data => {
    document.getElementById('dsDette0').value = hasDebt ? data.points[data.points.length - 1].value.toFixed(1) : 100;
    dialog._recompute();
  }).catch(() => { document.getElementById('dsDette0').value = 100; dialog._recompute(); });
  dialog.showModal();
}

// ============================================================
// Module "Finances publiques" — répartition des dépenses publiques
// (toutes administrations, France) par fonction COFOG, snapshot manuel
// daté et sourcé (INSEE Première n°2093, 05/02/2026, données 2024 —
// aucune API live identifiée pour cette ventilation, cf. mémoire). La
// somme (1671 Md€) est très légèrement inférieure au total publié
// (1672 Md€) par arrondi de chaque poste — écart documenté, jamais
// masqué ni recalé artificiellement.
// ============================================================
const ECO_PUBLIC_FINANCE_SNAPSHOT = {
  year: 2024,
  totalMdEur: 1672,
  pctGDP: 57.0,
  source: 'INSEE — Insee Première n°2093, "Usage de l\'argent public : les dépenses publiques par fonction en 2024"',
  sourceUrl: 'https://www.insee.fr/fr/statistiques/8735252',
  publishedOn: '5 février 2026',
  scope: "Ensemble des administrations publiques (État, collectivités locales, sécurité sociale) — pas seulement le budget de l'État",
  categories: [
    {label: 'Protection sociale', mdEur: 693, color: '#D4AF37'},
    {label: 'Santé', mdEur: 261, color: '#4F8FE8'},
    {label: 'Services généraux', mdEur: 181, color: '#9B7BE0'},
    {label: 'Affaires économiques', mdEur: 166, color: '#32D583'},
    {label: 'Enseignement', mdEur: 149, color: '#F0D36B'},
    {label: 'Défense', mdEur: 54, color: '#F04438'},
    {label: 'Ordre et sécurité publics (dont justice)', mdEur: 52, color: '#E88F4F'},
    {label: 'Loisirs, culture et culte', mdEur: 43, color: '#6BAFD9'},
    {label: 'Logement et équipements collectifs', mdEur: 42, color: '#B08FE0'},
    {label: "Protection de l'environnement", mdEur: 30, color: '#5FCF9E'}
  ]
};
let ecoBudgetChartInstance = null;

function renderPublicFinanceView(){
  const kpisEl = document.getElementById('ecoKpis');
  const mainEl = document.getElementById('ecoMain');
  if(!kpisEl || !mainEl) return;
  const snap = ECO_PUBLIC_FINANCE_SNAPSHOT;
  kpisEl.innerHTML = `
    <div class="eco-kpi"><span class="eco-kpi-label">${ICONS.coins || ''} Dépenses publiques</span><span class="eco-kpi-value">${snap.totalMdEur.toLocaleString('fr-FR')} Md€</span><span class="eco-kpi-asof"><span class="eco-freshness is-periodic">Instantané annuel</span> · ${snap.year}</span></div>
    <div class="eco-kpi"><span class="eco-kpi-label">${ICONS.scale || ''} % du PIB</span><span class="eco-kpi-value">${snap.pctGDP} %</span><span class="eco-kpi-asof">${snap.year}</span></div>`;

  mainEl.innerHTML = `
    <span class="eco-panel-title">Répartition des dépenses publiques (${snap.year}) — ${snap.scope}</span>
    <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;margin-top:14px;flex:1;">
      <div style="position:relative;width:220px;height:220px;flex-shrink:0;">
        <canvas id="ecoBudgetCanvas"></canvas>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;">
          <div style="font-size:17px;font-weight:600;color:var(--term-text);" class="mono">${snap.totalMdEur} Md€</div>
          <div style="font-size:9.5px;color:var(--term-text-dim);text-transform:uppercase;">Dépenses publiques</div>
        </div>
      </div>
      <div style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:5px;">
        ${snap.categories.map(c => `
          <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${c.color};flex-shrink:0;"></span>
            <span style="flex:1;color:var(--term-text-dim);">${c.label}</span>
            <span class="mono" style="color:var(--term-text);">${c.mdEur} Md€ · ${Math.round(c.mdEur / snap.totalMdEur * 100)} %</span>
          </div>`).join('')}
      </div>
    </div>
    <p class="eco-panel-note">Source : ${snap.source}, publié le ${snap.publishedOn}. <a href="${snap.sourceUrl}" target="_blank" rel="noopener" style="color:var(--term-text-dim);">Consulter →</a> — instantané annuel mis à jour manuellement (aucune donnée équivalente n'est publiée en continu), jamais présenté comme temps réel.</p>`;

  const canvas = document.getElementById('ecoBudgetCanvas');
  if(canvas && typeof Chart !== 'undefined'){
    if(ecoBudgetChartInstance) ecoBudgetChartInstance.destroy();
    ecoBudgetChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {labels: snap.categories.map(c => c.label), datasets: [{data: snap.categories.map(c => c.mdEur), backgroundColor: snap.categories.map(c => c.color), borderWidth: 0, hoverOffset: 6}]},
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: {display: false},
          tooltip: {backgroundColor: '#0D1016', titleColor: '#F0D36B', bodyColor: '#F5F5F5', borderColor: 'rgba(212,175,55,0.16)', borderWidth: 1, callbacks: {label: ctx => `${ctx.label} : ${ctx.parsed} Md€ (${Math.round(ctx.parsed / snap.totalMdEur * 100)} %)`}}
        }
      }
    });
  }
}

safeRun('terminal économie — navigation', () => renderEcoNav('ecoNav'));
safeRun('terminal économie — corps (en-tête/KPI/contenu)', () => renderEcoBody());

// ---------- Concepts clés — Bibliothèque (catégorie "Économie" déjà
// existante), même pattern d'accordéon que la page Crypto. ----------
const ecoLib = LIBRARY.filter(l => l.categorie === 'Économie');
safeRun('glossaire économie', () => {
  const el = document.getElementById('ecoGlossary');
  if(!el) return;
  el.innerHTML = ecoLib.map(l => `
    <div class="glossary-item">
      <button type="button" class="head" style="background:none;border:none;width:100%;text-align:left;font:inherit;" onclick="this.nextElementSibling.classList.toggle('open')"><h4>${l.terme}</h4><span class="idx">${l.niveau}</span></button>
      <div class="glossary-body">${l.detail}</div>
    </div>`).join('') || '<p style="color:var(--text-dim);font-size:13px;">Notions à venir.</p>';
});
