/* ============================================================
   LIKANZA ACADEMY — Page Économie (economie.html)
   Refonte du 06-07/09/2026 : socle "Likanza Economic Intelligence
   Terminal" (pays/KPI/Macro Trend/Comparateur/Carte mondiale/Graph Lab/
   Crisis Replay/mode enseignant/Et si.../Banques centrales/Dette &
   déficit/Finances publiques) construit module après module — tout est
   réel, sourcé, testé. Toutes les séries viennent de /api/eco-rate (BCE,
   Eurostat, Banque Mondiale, FRED — voir api/eco-rate.js) — jamais une
   valeur inventée pour combler une case vide ; une série indisponible
   affiche honnêtement "Donnée indisponible".

   Refonte du 07/09/2026 : ce socle (ECO_VIEWS, renderEcoBody...) devient
   la VUE AVANCÉE (?vue=avance), atteinte au clic depuis un nouvel
   ACCUEIL à 6 zones (mission unique : comprendre l'état de l'économie,
   ce qui change et le lien avec les marchés en 20-30 secondes — voir le
   bloc "Accueil Economy Intelligence" plus bas dans ce fichier, et
   ecoInitPageMode tout en bas pour la bascule). Rien n'a été supprimé
   ni réécrit dans le socle ci-dessous — seulement redispatché derrière
   un état plutôt que montré par défaut.
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

// ---------- Mode enseignant (07/09/2026) : bascule persistée qui ajoute
// une définition en langage simple sous chaque KPI, réutilisant EXACTEMENT
// le texte déjà présent dans LIBRARY (le même "Définition express" que la
// Bibliothèque/l'accueil) — jamais un texte pédagogique réécrit à part,
// qui pourrait diverger de la vraie définition ailleurs sur le site.
// ECO_TEACHER_TERMS ne couvre QUE les indicateurs ayant un vrai terme
// LIBRARY correspondant (vérifié un par un) : gov-deficit et
// consumer-confidence n'ont réellement aucun terme dédié dans la
// catégorie "Économie" de LIBRARY — pas de faux lien vers une définition
// inexistante pour ces deux-là. ----------
const ECO_TEACHER_TERMS = {
  'gdp-growth': 'PIB (Produit intérieur brut)',
  'inflation': 'Inflation',
  'unemployment': 'Chômage',
  'gov-debt': 'Dette publique',
  'policy-rate-ecb': 'Taux directeur',
  'policy-rate-fed': 'Taux directeur'
};
const ECO_CRISIS_TEACHER_TERMS = {
  'gfc-2008': 'Crise des subprimes',
  'covid-2020': 'Récession',
  'inflation-2022': 'Inflation'
};
let ecoTeacherMode = safeGetJSON('likanza-eco-teacher-mode', false);
function ecoLibraryDefinition(terme){
  const entry = LIBRARY.find(l => l.terme === terme);
  return entry ? entry.simple : null;
}
function ecoTeacherToggleHtml(){
  return `<button type="button" class="pill ${ecoTeacherMode ? 'active' : ''}" id="ecoTeacherToggle" style="margin-top:6px;" title="Ajoute une définition en langage simple sous chaque indicateur">🎓 Mode enseignant</button>`;
}
function ecoWireTeacherToggle(){
  const btn = document.getElementById('ecoTeacherToggle');
  if(!btn) return;
  btn.addEventListener('click', () => {
    ecoTeacherMode = !ecoTeacherMode;
    safeSetJSON('likanza-eco-teacher-mode', ecoTeacherMode);
    renderEcoBody();
  });
}
// Bloc de définition réutilisable, même esprit que renderCalcNote
// (dividende-page.js) : replié par défaut, jamais imposé à un utilisateur
// qui n'a pas activé le mode enseignant (il n'apparaît pas du tout dans
// ce cas, pas juste masqué en CSS).
function ecoTeacherDefinitionHtml(terme){
  if(!ecoTeacherMode || !terme) return '';
  const def = ecoLibraryDefinition(terme);
  if(!def) return '';
  return `<p class="eco-teacher-note">🎓 <strong>${terme}</strong> : ${def}</p>`;
}

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
  'impact-engine': {label: 'Et si...?', icon: 'shuffle'},
  'central-banks': {label: 'Banques centrales', icon: 'landmark'},
  debt: {label: 'Dette & déficit', icon: 'scale'},
  'public-finance': {label: 'Finances publiques', icon: 'coins'}
};
let ecoActiveView = 'overview';

// Vues qui lisent réellement ecoActiveCountry (vérifié par grep dans ce
// fichier : seules "Vue d'ensemble" et "Dette & déficit" en dépendent —
// la Carte mondiale/le Comparateur/Graph Lab/Crisis Replay/Et si.../
// Banques centrales/Finances publiques gèrent chacun leur propre notion
// de pays, ou n'en ont aucune). Bug UX réel découvert lors de l'audit de
// la refonte Accueil du 07/09/2026 : les boutons pays restaient
// cliquables sur TOUTES les vues, sans aucun effet visible en dehors de
// ces deux-là — corrigé en désactivant réellement (disabled, pas
// seulement visuel) les boutons pays hors de ces vues, avec une note
// explicite plutôt qu'un piège silencieux.
const ECO_VIEWS_USING_COUNTRY = new Set(['overview', 'debt']);

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

// fmt (optionnel, la fonction meta.fmt du KPI concerné) : le seuil de
// platitude doit refléter ce qui sera RÉELLEMENT affiché à l'écran (arrondi
// par fmt), jamais l'écart brut — sinon la flèche peut annoncer une hausse
// alors que le chiffre affiché arrondit à zéro (ex. +0,04 pt sur le PIB
// affichait "↑ 0.0 %"). Sans fmt fourni, repli sur l'ancien seuil brut.
function ecoDeltaClass(tone, delta, fmt){
  const displayedZero = fmt
    ? parseFloat(String(fmt(Math.abs(delta))).replace(/[^0-9.,-]/g, '').replace(',', '.')) === 0
    : Math.abs(delta) < 1e-9;
  if(displayedZero) return 'flat';
  // tone 'neutral' (ex. inflation, confiance des ménages, taux directeur) :
  // jamais de jugement favorable/défavorable sur le sens de variation — mais
  // "flat" (pas de variation mesurable) et "variation réelle sans jugement"
  // sont deux notions différentes, jamais confondues sous un même "→"
  // depuis le 08/09/2026 (avant : toujours 'flat', même sur un écart réel
  // non nul — la flèche "→" se lisait à tort comme "inchangé").
  if(tone === 'neutral') return delta > 0 ? 'neutral-up' : 'neutral-down';
  const rising = delta > 0;
  if(tone === 'growth') return rising ? 'up' : 'down';
  if(tone === 'inverse') return rising ? 'down' : 'up';
  if(tone === 'inverseInverted') return rising ? 'down' : 'up'; // déficit : une hausse (plus négatif) est déjà gérée par le signe de delta
  return 'flat';
}

function renderEcoNav(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const countryRelevant = ECO_VIEWS_USING_COUNTRY.has(ecoActiveView);
  el.innerHTML = `
    <span class="eco-nav-label">Modules</span>
    ${Object.entries(ECO_VIEWS).map(([key, v]) => `
      <button type="button" class="${key === ecoActiveView ? 'active' : ''}" data-view="${key}">
        <span class="eco-nav-flag">${ICONS[v.icon] || ''}</span><span>${v.label}</span>
      </button>`).join('')}
    <span class="eco-nav-label">Pays</span>
    ${countryRelevant ? '' : `<p class="eco-nav-note">Ce module n'est pas spécifique à un pays.</p>`}
    ${Object.entries(ECO_COUNTRIES).map(([code, c]) => `
      <button type="button" class="${code === ecoActiveCountry ? 'active' : ''}" data-country="${code}" ${countryRelevant ? '' : 'disabled'}>
        <span class="eco-nav-flag">${c.flag}</span><span>${c.label}</span>
      </button>`).join('')}
  `;
  el.querySelectorAll('button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.dataset.view === ecoActiveView) return;
      ecoActiveView = btn.dataset.view;
      renderEcoNav(elId); // reconstruit aussi l'état activé/désactivé des boutons pays pour la nouvelle vue
      renderEcoBody();
    });
  });
  if(countryRelevant){
    el.querySelectorAll('button[data-country]').forEach(btn => {
      btn.addEventListener('click', () => {
        if(btn.dataset.country === ecoActiveCountry) return;
        ecoActiveCountry = btn.dataset.country;
        el.querySelectorAll('button[data-country]').forEach(b => b.classList.toggle('active', b.dataset.country === ecoActiveCountry));
        renderEcoBody();
      });
    });
  }
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
  } else if(ecoActiveView === 'impact-engine'){
    renderImpactEngineView();
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
  // Garde-fou de robustesse, pas un bug visible aujourd'hui : renderMapMain
  // protège déjà sa propre division par zéro (max === min -> t = 0.5) avant
  // d'appeler cette fonction. Mais ecoMapColorFor est déclarée dans la
  // portée globale de la page, donc appelable par un futur appelant sans
  // cette garantie — Math.min(1, NaN) vaut NaN, ce qui produirait
  // silencieusement "rgb(NaN,NaN,NaN)" (CSS invalide, ignoré par le
  // navigateur) au lieu d'une couleur explicite "aucune donnée". Même
  // couleur que le remplissage neutre de renderMapMain, pour rester
  // cohérent visuellement entre les deux chemins.
  if(!Number.isFinite(rawT)) return ecoCssVar('--term-card-hover') || '#141923';
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
  // Le fond de carte représente un pays en plusieurs morceaux (territoires,
  // archipels : France, Italie, Espagne, Royaume-Uni, Suède, Russie,
  // États-Unis, Canada, Argentine, Japon, Chine, Indonésie, Philippines —
  // vérifié en direct dans le SVG, 08/09/2026) comme un <g id="xx"> dont les
  // <path> enfants n'ont eux-mêmes aucun id — un sélecteur limité à
  // "path[id]" les manque entièrement (13 des 26 pays réels de la carte,
  // dont le pays par défaut de la page). Ces <path> enfants n'ont non plus
  // aucun attribut fill propre (vérifié : le remplissage/curseur posé sur le
  // <g> hérite normalement vers tous ses descendants en SVG) — poser le
  // style sur le groupe suffit donc, pas besoin de descendre jusqu'aux
  // tracés terminaux.
  const pathsById = {};
  wrapEl.querySelectorAll('path[id], g[id]').forEach(p => { pathsById[p.id] = p; });
  const neutralFill = ecoCssVar('--term-card-hover') || '#141923';
  const neutralStroke = ecoCssVar('--term-border') || 'rgba(212,175,55,0.16)';
  Object.values(pathsById).forEach(path => {
    path.style.fill = neutralFill;
    path.style.stroke = neutralStroke;
    path.style.strokeWidth = '0.5';
  });
  Object.entries(values).forEach(([code, entry]) => {
    const path = pathsById[code.toLowerCase()];
    if(!path) return; // code ISO réellement absent de ce fond de carte tiers (aucun cas connu parmi les 26 pays de WORLDBANK_MAP_COUNTRIES, vérifié) -> ignoré, jamais une erreur bloquante
    const t = (max === min) ? 0.5 : (entry.value - min) / (max - min);
    path.style.fill = ecoMapColorFor(t, meta.tone);
    path.style.cursor = 'pointer';
    const label = WORLDBANK_MAP_COUNTRY_LABELS_FR[code] || code;
    // <title> natif : vraie infobulle au survol, sans logique JS de
    // positionnement à maintenir — nom réel, valeur réelle, année réelle.
    // Un seul <title>, posé sur le <g> pour un pays multi-tracés, suffit
    // pour toute la zone survolée — jamais une infobulle par sous-tracé.
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
let ecoActiveScenario = 'rate-hike';

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
    ${ecoTeacherDefinitionHtml(ECO_CRISIS_TEACHER_TERMS[ecoActiveCrisis])}
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
  el.innerHTML = `${actualise}<br><strong>${context}</strong><br>${ecoTeacherToggleHtml()}`;
  ecoWireTeacherToggle();
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
      const deltaClass = prev ? ecoDeltaClass(meta.tone, delta, meta.fmt) : 'flat';
      const arrow = (deltaClass === 'up' || deltaClass === 'neutral-up') ? '↑' : (deltaClass === 'down' || deltaClass === 'neutral-down') ? '↓' : '→';
      const sparkHistory = points.slice(-24).map(p => ({close: p.value, date: p.period}));
      cardEl.classList.remove('is-loading');
      cardEl.innerHTML = `
        <span class="eco-kpi-label">${ICONS[meta.icon] || ''} ${meta.label}</span>
        <span class="eco-kpi-value">${meta.fmt(last.value)}</span>
        ${prev ? `<span class="eco-kpi-delta ${deltaClass}">${arrow} ${meta.fmt(Math.abs(delta)).replace(/^\+/, '')} vs période préc.</span>` : ''}
        <div class="eco-kpi-spark">${renderSparklineHTML(sparkHistory, {compact: true})}</div>
        <span class="eco-kpi-asof">${ecoFreshnessBadge(data.frequency)} · ${last.period}</span>
        ${ecoTeacherDefinitionHtml(ECO_TEACHER_TERMS[k])}`;
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
    return {points, meta, frequency: data.frequency, source: data.source};
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

// ============================================================
// Module "Et si...?" (07/09/2026) — généralise le motif déjà validé deux
// fois sur cette page (renderCentralBanksView "Pourquoi les taux
// changent ?", renderDebtView "Pourquoi la dette augmente ?") : un
// enchaînement QUALITATIF de mécanismes économiques reconnus (manuels
// d'économie), jamais un chiffre inventé ni une relation mesurée. Un
// vrai moteur quantitatif ("+1 pt de taux ⇒ −X % de PIB") exigerait une
// relation économétrique sans source vérifiée pour ce projet — hors de
// portée, définitivement. Réutilise .eco-mechanism-flow/-step/-arrow
// (déjà en place) et l'idiome de bascule de vue déjà utilisé par
// renderMapCountryDetail — zéro nouvelle donnée, zéro nouvel appel réseau.
// ============================================================
const ECO_SCENARIOS = {
  'rate-hike': {
    label: 'La banque centrale relève ses taux directeurs',
    chain: ['Banque centrale relève ses taux', "Coût du crédit augmente", "Emprunt des ménages / entreprises ralentit", "Consommation et investissement ralentissent", "Croissance ralentit", "Inflation reflue (mais le chômage peut augmenter)"],
    caveat: "Mécanisme de manuel d'économie (canal du taux d'intérêt), pas une prévision : l'ampleur et le délai réels dépendent fortement du contexte (anticipations, autres chocs simultanés).",
    link: {type: 'crisis', key: 'inflation-2022', note: "Ce mécanisme est celui du cycle de hausses de taux le plus rapide depuis plusieurs décennies, déclenché en réponse au choc d'inflation 2021-2023 →"}
  },
  'oil-shock': {
    label: 'Le prix du pétrole augmente fortement',
    chain: ['Prix du pétrole augmente', 'Coûts de production et de transport augmentent', 'Prix à la consommation augmentent (inflation importée)', 'Pouvoir d\'achat des ménages baisse', 'Banques centrales sous pression de resserrer leur politique'],
    caveat: "Mécanisme de manuel d'économie (choc d'offre / \"cost-push\"), pas une prévision : la hausse des prix de l'énergie n'est jamais le seul facteur d'un épisode d'inflation réel.",
    link: {type: 'crisis', key: 'inflation-2022', note: "La hausse des prix de l'énergie est l'un des facteurs cités (parmi d'autres) du choc d'inflation 2021-2023 →"}
  },
  'currency-depreciation': {
    label: 'Une monnaie se déprécie fortement',
    chain: ['Monnaie se déprécie', 'Produits importés plus chers', 'Inflation importée augmente', 'Produits exportés plus compétitifs à l\'étranger', 'Effet net sur la balance commerciale très dépendant du contexte'],
    caveat: "Mécanisme théorique standard, pas une prévision : le sens et l'ampleur de l'effet net dépendent fortement des élasticités et de la structure des échanges du pays concerné. Cette page ne suit aucune série de change réelle — aucun lien vers un module de ce site n'est proposé ici.",
    link: null
  },
  'fiscal-expansion': {
    label: "L'État augmente fortement ses dépenses publiques",
    chain: ['Dépenses publiques augmentent', 'Demande globale augmente', 'Activité et emploi soutenus à court terme', 'Déficit public se creuse', 'Dette publique augmente'],
    caveat: "Mécanisme de manuel d'économie (relance budgétaire), pas une prévision : les deux dernières étapes suivent la même identité comptable déjà détaillée dans le module \"Dette & déficit\".",
    link: {type: 'view', view: 'debt', note: "Voir l'identité comptable complète de la dynamique de la dette →"}
  },
  'recession-spiral': {
    label: "L'activité ralentit fortement (récession)",
    chain: ['Activité économique ralentit', "Entreprises réduisent l'emploi", 'Chômage augmente', 'Revenus des ménages baissent', 'Consommation baisse', 'Activité ralentit encore'],
    caveat: "Mécanisme de manuel d'économie (spirale récessive), pas une prévision : une récession réelle peut être freinée à tout moment par une réponse monétaire ou budgétaire.",
    link: {type: 'crisis', key: 'covid-2020', note: "Cette spirale s'est produite pour de vrai lors de la récession Covid-19 (2020) →"}
  },
  'banking-crisis': {
    label: 'Une crise de confiance frappe le système bancaire',
    chain: ['Confiance dans les banques s\'effondre', 'Resserrement brutal du crédit (credit crunch)', 'Investissement et consommation chutent', 'Récession', 'Banques centrales baissent les taux en urgence'],
    caveat: "Mécanisme de manuel d'économie (crise bancaire systémique), pas une prévision : chaque crise bancaire réelle a ses propres déclencheurs et sa propre ampleur.",
    link: {type: 'crisis', key: 'gfc-2008', note: "Cet enchaînement est celui de la crise financière de 2008 →"}
  }
};

function renderImpactEnginePicker(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `<div class="eco-map-picker" style="grid-column:1/-1;">
    ${Object.entries(ECO_SCENARIOS).map(([key, s]) => `<button type="button" class="pill ${key === ecoActiveScenario ? 'active' : ''}" data-scenario="${key}">${s.label}</button>`).join('')}
  </div>`;
  el.querySelectorAll('[data-scenario]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.dataset.scenario === ecoActiveScenario) return;
      ecoActiveScenario = btn.dataset.scenario;
      el.querySelectorAll('[data-scenario]').forEach(b => b.classList.toggle('active', b.dataset.scenario === ecoActiveScenario));
      renderImpactEngineMain();
    });
  });
}

function renderImpactEngineMain(){
  const el = document.getElementById('ecoMain');
  if(!el) return;
  const s = ECO_SCENARIOS[ecoActiveScenario];
  el.innerHTML = `
    <span class="eco-panel-title">Et si... ${s.label.charAt(0).toLowerCase()}${s.label.slice(1)} ?</span>
    <p class="eco-panel-note" style="margin-top:6px;">Ces enchaînements présentent des mécanismes économiques reconnus (manuels d'économie), jamais une prévision chiffrée ni une relation mesurée sur ce site — l'ampleur, le délai et parfois même le sens réel de ces effets dépendent fortement du contexte.</p>
    <div class="eco-mechanism-flow" style="margin-top:14px;">
      ${s.chain.map((step, i, arr) => `<span class="eco-mechanism-step">${step}</span>${i < arr.length - 1 ? '<span class="eco-mechanism-arrow">→</span>' : ''}`).join('')}
    </div>
    <p class="eco-panel-note" style="margin-top:12px;">${s.caveat}</p>
    ${s.link ? `<button type="button" class="btn btn-sm eco-link" id="ecoScenarioLink" style="margin-top:10px;">${s.link.note}</button>` : ''}`;
  const linkBtn = document.getElementById('ecoScenarioLink');
  if(linkBtn) linkBtn.addEventListener('click', () => {
    if(s.link.type === 'crisis'){ ecoActiveView = 'crisis-replay'; ecoActiveCrisis = s.link.key; }
    else if(s.link.type === 'view'){ ecoActiveView = s.link.view; }
    renderEcoNav('ecoNav');
    renderEcoBody();
  });
}

function renderImpactEngineView(){
  renderImpactEnginePicker('ecoKpis');
  renderImpactEngineMain();
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
    <!-- Décomposition qualitative des 3 forces réelles à l'œuvre (déficit
         primaire, charge d'intérêts, croissance nominale) — reste exacte
         après le passage à la formule précise de computeDebtProjection
         (08/09/2026, cf. son commentaire) : les 3 mêmes termes y figurent
         encore (1+i, 1/(1+g), -pb), seule leur combinaison précise a changé,
         jamais les forces qualitatives elles-mêmes. Vérifié, pas supposé. -->
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
  // Chaque paramètre doit être un nombre fini — jamais un calcul lancé sur un
  // champ vidé silencieusement remplacé par 0 par l'appelant (voir
  // openDebtSimulator/recompute, qui distingue déjà champ vide et zéro saisi).
  if(![dette0, croissanceReellePct, inflationPct, tauxInteretPct, soldePrimairePct].every(Number.isFinite)) return null;
  const croissanceNominalePct = (1 + croissanceReellePct / 100) * (1 + inflationPct / 100) * 100 - 100;
  // Une croissance nominale de -100 % (ou moins) annule ou inverse le
  // dénominateur (1 + croissanceNominalePct/100) du terme d'effet de
  // croissance ci-dessous — sans ce garde-fou, le résultat explose vers
  // Infinity plutôt que d'afficher un message honnête sur une hypothèse hors
  // de portée du modèle.
  if(croissanceNominalePct <= -100) return null;
  const results = {};
  let dette = dette0;
  // Une dette publique négative n'a pas de sens dans ce cadre (ce serait une
  // position créditrice nette, un concept différent, non modélisé ici) — la
  // trajectoire est plafonnée à 0, et flooredAtYear retient la première année
  // où ça se produit pour que l'appelant explique le plancher plutôt que
  // d'afficher un 0,0 % PIB sec à un horizon qui l'a dépassé depuis longtemps.
  let flooredAtYear = null;
  // Formule exacte de la dynamique du ratio dette/PIB : d(t) = d(t-1) *
  // (1+i)/(1+g) - pb. Une version développée (dette + intérêts - effet de
  // croissance - solde primaire, avec effet de croissance = dette*g/(1+g))
  // omet le terme croisé -i*g/(1+g)*dette et surestime systématiquement la
  // dette (~2,6 points de PIB à 20 ans sur les valeurs par défaut de cette
  // page, vérifié) — remplacée le 08/09/2026 par la formule exacte
  // ci-dessous, qui donne le même résultat qu'un calcul direct de d*(1+i)/(1+g).
  for(let year = 1; year <= 20; year++){
    dette = (dette * (1 + tauxInteretPct / 100)) / (1 + croissanceNominalePct / 100) - soldePrimairePct;
    if(dette < 0 && flooredAtYear === null) flooredAtYear = year;
    dette = Math.max(dette, 0);
    if([5, 10, 20].includes(year)) results[year] = dette;
  }
  return {croissanceNominalePct, atHorizon: results, flooredAtYear};
}

function openDebtSimulator(country, hasDebt){
  let dialog = document.getElementById('ecoDebtSimDialog');
  if(!dialog){
    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="ecoDebtSimDialog" class="eco-modal">
        <form method="dialog">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:4px;">Simuler la dette publique</h3>
          <p class="disclaimer-box" style="margin-bottom:14px;">Simulation pédagogique — identité comptable standard, pas une prévision officielle. Les hypothèses sont les tiennes, jamais des données réelles projetées comme certaines.</p>
          <!-- Bornes économiquement plausibles (08/09/2026) — pas des limites
               réelles observées quelque part, juste un garde-fou contre une
               saisie qui rendrait le modèle non calculable (ex. -100 % de
               croissance) ou absurde à interpréter : dette 0-400 % du PIB
               (au-delà, aucun cas réel connu et le modèle perd son sens
               pédagogique), croissance réelle -15 à 15 %/an, inflation -5 à
               30 %/an, taux d'intérêt 0-25 %/an (jamais négatif ici, ce
               modèle ne traite pas les taux réels négatifs), solde primaire
               -20 à 20 % du PIB. -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="field"><label for="dsDette0">Dette initiale (% PIB)</label><input type="number" id="dsDette0" step="0.1" min="0" max="400"></div>
            <div class="field"><label for="dsCroissance">Croissance réelle (%/an)</label><input type="number" id="dsCroissance" step="0.1" min="-15" max="15" value="1.2"></div>
            <div class="field"><label for="dsInflation">Inflation (%/an)</label><input type="number" id="dsInflation" step="0.1" min="-5" max="30" value="2"></div>
            <div class="field"><label for="dsTaux">Taux d'intérêt apparent (%/an)</label><input type="number" id="dsTaux" step="0.1" min="0" max="25" value="3"></div>
            <div class="field" style="grid-column:1/-1;"><label for="dsSolde">Solde primaire (% PIB, négatif = déficit primaire)</label><input type="number" id="dsSolde" step="0.1" min="-20" max="20" value="-1"></div>
          </div>
          <div id="dsResults" style="margin-top:14px;"></div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
            <button type="submit" class="btn btn-sm" id="dsCloseBtn">Fermer</button>
          </div>
        </form>
      </dialog>`);
    dialog = document.getElementById('ecoDebtSimDialog');
    // Distingue un champ vidé d'un vrai zéro saisi : "+valeur || 0" les
    // confondait, ce qui construisait silencieusement une projection sur une
    // hypothèse jamais renseignée plutôt que de suspendre le calcul.
    const DS_FIELD_LABELS = {dsDette0: 'la dette initiale', dsCroissance: 'la croissance réelle', dsInflation: "l'inflation", dsTaux: "le taux d'intérêt", dsSolde: 'le solde primaire'};
    function readDsField(id){
      const raw = document.getElementById(id).value;
      if(raw === '') return null;
      const num = +raw;
      return Number.isFinite(num) ? num : null;
    }
    const recompute = () => {
      const raw = {
        dsDette0: readDsField('dsDette0'), dsCroissance: readDsField('dsCroissance'),
        dsInflation: readDsField('dsInflation'), dsTaux: readDsField('dsTaux'), dsSolde: readDsField('dsSolde')
      };
      const resultsEl = document.getElementById('dsResults');
      const missing = Object.entries(raw).filter(([, v]) => v === null).map(([id]) => DS_FIELD_LABELS[id]);
      if(missing.length > 0){
        resultsEl.innerHTML = `<p class="eco-panel-note">Renseigne ${missing.join(', ')} pour voir la projection — un champ vide n'est jamais remplacé par zéro.</p>`;
        return;
      }
      const params = {
        dette0: raw.dsDette0, croissanceReellePct: raw.dsCroissance, inflationPct: raw.dsInflation,
        tauxInteretPct: raw.dsTaux, soldePrimairePct: raw.dsSolde
      };
      const proj = computeDebtProjection(params);
      if(!proj){
        resultsEl.innerHTML = `<p class="eco-panel-note">Cette combinaison d'hypothèses n'est pas calculable ici (la croissance nominale composée tombe à -100 % ou moins) — essaie des valeurs moins extrêmes.</p>`;
        return;
      }
      resultsEl.innerHTML = [5, 10, 20].map(h => {
        const flooredHere = proj.flooredAtYear !== null && h >= proj.flooredAtYear;
        const valueHtml = flooredHere
          ? `Dette remboursée avant cet horizon <span style="color:var(--term-text-dim);font-weight:400;">(la trajectoire atteint 0 avant, ce modèle ne sait pas la prolonger au-delà)</span>`
          : `${proj.atHorizon[h].toFixed(1)} % PIB`;
        return `<div class="result-row"><span class="result-horizon">Dans ${h} ans</span><span class="result-value mono">${valueHtml}</span></div>`;
      }).join('');
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

// ============================================================
// Accueil "Economy Intelligence" (refonte du 07/09/2026) — nouvelle
// mission unique de cette page : comprendre en 20-30 secondes l'état de
// l'économie, ce qui change, et le lien avec les marchés, puis pouvoir
// creuser au clic. Le terminal à 9 onglets ci-dessus (ECO_VIEWS,
// renderEcoBody...) n'est pas supprimé : il devient la Vue avancée,
// atteinte via ?vue=avance (voir ecoInitPageMode, tout en bas de ce
// fichier) — rien n'est réécrit ni perdu, seulement redispatché derrière
// un état plutôt que montré par défaut. Toute donnée ici réutilise
// exactement les mêmes fonctions réelles que la Vue avancée
// (fetchEcoSeries/ecoFetchRealSeries/ECO_KPI_META) — zéro nouvelle
// source, zéro valeur inventée.
// ============================================================

// ---------- Géographies visibles pour la page d'accueil. "Zone euro"
// n'est JAMAIS un raccourci vers l'agrégat UE27 Eurostat (périmètre
// réellement différent de l'agrégat BCE U2 — cf. api/eco-rate.js, déjà
// documenté comme un piège à ne jamais fusionner) : seuls les
// indicateurs ayant une vraie source zone-euro (BCE, U2) lui sont
// proposés (ECO_HOME_EA_AVAILABLE) — les autres affichent honnêtement
// "Non disponible pour la zone euro" plutôt qu'un agrégat UE27
// silencieusement substitué. Royaume-Uni/Japon réservés dans la
// structure (libellé/drapeau déjà prêts), non affichés pour l'instant
// (ECO_HOME_GEOS_VISIBLE). ----------
const ECO_HOME_GEOS = {
  FR: {label: 'France', flag: '🇫🇷'},
  EA: {label: 'Zone euro', flag: '🇪🇺'},
  US: {label: 'États-Unis', flag: '🇺🇸'},
  CN: {label: 'Chine', flag: '🇨🇳'},
  GB: {label: 'Royaume-Uni', flag: '🇬🇧'},
  JP: {label: 'Japon', flag: '🇯🇵'}
};
const ECO_HOME_GEOS_VISIBLE = ['FR', 'EA', 'US', 'CN']; // GB/JP réservés, à activer plus tard
let ecoHomeGeo = 'FR';

// Les 6 indicateurs de la Zone 2. PMI et taux souverain à 10 ans (cités
// en exemple) n'ont AUCUNE source réelle intégrée sur ce site (vérifié :
// absents de ECO_KPI_META et de tout lib/*.js — le taux à 10 ans avait
// déjà été tenté puis abandonné faute de source fiable, cf. mémoire du
// projet) — remplacés par 2 indicateurs déjà réels et déjà sourcés :
// Dette publique et Confiance des ménages.
const ECO_HOME_INDICATORS = ['inflation', 'gdp-growth', 'policy-rate', 'unemployment', 'gov-debt', 'consumer-confidence'];
const ECO_HOME_EA_AVAILABLE = ['inflation', 'policy-rate']; // seuls les 2 à avoir une vraie source zone-euro (U2)

// Vérifié un par un contre LIBRARY (catégorie "Économie") : Confiance des
// ménages n'a réellement aucun terme dédié — jamais un ⓘ fabriqué pour
// cet indicateur.
const ECO_HOME_INDICATOR_TERMS = {
  'inflation': 'Inflation', 'gdp-growth': 'PIB (Produit intérieur brut)', 'policy-rate': 'Taux directeur',
  'unemployment': 'Chômage', 'gov-debt': 'Dette publique', 'consumer-confidence': null
};
// Vérifié un par un dans COURS_CATALOG (scripts/app.js, champ
// libraryTermes) : seuls ces 2 termes figurent réellement dans un cours
// (Inflation -> "Les fondations de tes finances personnelles" ;
// PIB/Taux directeur -> "Comprendre l'économie") — jamais un lien de
// cours fabriqué pour Chômage/Dette publique/Confiance, qui n'en ont
// aucun (Bibliothèque seule pour ceux-là).
const ECO_HOME_INDICATOR_COURSE = {
  'inflation': 'budget-securite', 'gdp-growth': 'economie-generale', 'policy-rate': 'economie-generale',
  'unemployment': null, 'gov-debt': null, 'consumer-confidence': null
};

// ---------- Interprétations prudentes (Zones 2 et 4) — jamais présentées
// comme une certitude, vocabulaire imposé : "peut", "tend historiquement
// à", "est généralement associé à", "constitue un signal à surveiller".
// Une entrée par indicateur × sens réel du dernier mouvement observé. ----------
const ECO_HOME_INTERPRETATIONS = {
  'inflation': {
    up: "Une inflation qui remonte peut augmenter la probabilité d'un maintien des taux directeurs à un niveau élevé.",
    down: "Une inflation qui ralentit peut réduire progressivement la pression sur la politique monétaire."
  },
  'gdp-growth': {
    up: "Une croissance qui accélère est généralement associée à un marché du travail plus dynamique.",
    down: "Une croissance qui ralentit constitue un signal à surveiller pour l'emploi dans les mois qui suivent."
  },
  'policy-rate': {
    up: "Une hausse des taux directeurs tend historiquement à renchérir le crédit et à ralentir la demande.",
    down: "Une baisse des taux directeurs tend historiquement à alléger le coût du crédit."
  },
  'unemployment': {
    up: "Une hausse du chômage peut peser sur la consommation des ménages dans les mois suivants.",
    down: "Un chômage en baisse est généralement associé à une consommation des ménages plus soutenue."
  },
  'gov-debt': {
    up: "Une dette publique en hausse peut, à terme, limiter la marge de manœuvre budgétaire de l'État.",
    down: "Une dette publique en baisse peut redonner une marge de manœuvre budgétaire supplémentaire."
  },
  'consumer-confidence': {
    up: "Une confiance des ménages en hausse est généralement associée à une consommation plus soutenue.",
    down: "Une confiance des ménages en baisse constitue un signal à surveiller pour la consommation à venir."
  }
};
function ecoHomeInterpretation(indicatorKey, delta){
  if(!delta) return null;
  return (ECO_HOME_INTERPRETATIONS[indicatorKey] || {})[delta > 0 ? 'up' : 'down'] || null;
}

// ---------- Récupération partagée : un seul fetch par indicateur pour
// toute la page d'accueil (Zones 2/3/4 lisent le même résultat mis en
// cache, jamais 3 appels réseau indépendants qui pourraient renvoyer des
// valeurs légèrement désynchronisées). "EA" (zone euro) a son propre
// chemin de récupération, sur les 2 vraies séries zone-euro (inflation-eu
// = BCE U2, policy-rate-ecb-history = déjà zone-euro par nature). ----------
let ecoHomeData = {}; // {indicatorKey: {points, meta, frequency, source} | null}
async function ecoHomeFetchIndicator(geo, indicatorKey){
  if(geo === 'EA'){
    if(!ECO_HOME_EA_AVAILABLE.includes(indicatorKey)) return null;
    const seriesKey = indicatorKey === 'inflation' ? 'inflation-eu' : 'policy-rate-ecb-history';
    const meta = indicatorKey === 'inflation' ? ECO_KPI_META['inflation'] : ECO_KPI_META['policy-rate-ecb'];
    try {
      const data = await fetchEcoSeries(seriesKey);
      let points = data.points;
      if(indicatorKey === 'inflation'){
        points = points.map((p, i) => {
          if(i < 12) return null;
          const rate = computeRealInflationRate(points.slice(0, i + 1));
          return typeof rate === 'number' ? {period: p.period, value: rate} : null;
        }).filter(Boolean);
        if(points.length === 0) return null;
      }
      return {points, meta, frequency: data.frequency, source: data.source};
    } catch(err){ return null; }
  }
  return ecoFetchRealSeries(geo, indicatorKey);
}
async function ecoHomeFetchAll(geo){
  const results = await Promise.all(ECO_HOME_INDICATORS.map(k => ecoHomeFetchIndicator(geo, k)));
  const data = {};
  ECO_HOME_INDICATORS.forEach((k, i) => { data[k] = results[i]; });
  ecoHomeData = data;
}

function ecoHomeLastDelta(points){
  if(!points || points.length < 2) return null;
  return points[points.length - 1].value - points[points.length - 2].value;
}

// ============================================================
// ZONE 1 — Hero "Economy Intelligence" : titre + sélecteur géographique.
// ============================================================
function renderEcoHomeHero(){
  const el = document.getElementById('ecoHomeHero');
  if(!el) return;
  el.innerHTML = `
    <div class="eco-home-hero-top">
      <div>
        <span class="eco-home-eyebrow">Economy Intelligence</span>
        <h2>Comprendre l'économie mondiale en quelques secondes.</h2>
      </div>
      <a href="economie.html?vue=avance" class="btn btn-sm" title="La vue complète : carte mondiale, comparateur, Graph Lab, Crisis Replay, Et si...?, banques centrales, dette, finances publiques">Vue terminal avancée →</a>
    </div>
    <div class="eco-home-geo-picker" id="ecoHomeGeoPicker">
      ${ECO_HOME_GEOS_VISIBLE.map(g => `<button type="button" class="pill ${g === ecoHomeGeo ? 'active' : ''}" data-geo="${g}">${ECO_HOME_GEOS[g].flag} ${ECO_HOME_GEOS[g].label}</button>`).join('')}
    </div>`;
  el.querySelectorAll('[data-geo]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(btn.dataset.geo === ecoHomeGeo) return;
      ecoHomeGeo = btn.dataset.geo;
      el.querySelectorAll('[data-geo]').forEach(b => b.classList.toggle('active', b.dataset.geo === ecoHomeGeo));
      renderEcoHomeMetricsLoading();
      await ecoHomeFetchAll(ecoHomeGeo);
      renderEcoHomeMetrics();
      renderEcoHomeState();
      renderEcoHomeChanges();
    });
  });
}

// ============================================================
// ZONE 2 — 6 indicateurs macro principaux (MacroMetricCard). Icône+
// libellé, valeur, delta+tendance (sparkline déjà existante), source+
// fraîcheur, interprétation prudente, ⓘ (définition LIBRARY + cours
// réel si disponible), "Voir l'historique →" (renvoie à la Vue avancée,
// réutilise le Macro Trend chart existant tel quel).
// ============================================================
function renderEcoHomeMetricsLoading(){
  const el = document.getElementById('ecoHomeMetrics');
  if(!el) return;
  el.innerHTML = `<span class="eco-home-section-title">Indicateurs clés</span><div class="eco-home-metrics-grid">${ECO_HOME_INDICATORS.map(k => {
    const meta = k === 'policy-rate' ? {icon: 'landmark', label: 'Taux directeur'} : ECO_KPI_META[k];
    return `<div class="eco-kpi is-loading"><span class="eco-kpi-label">${ICONS[meta.icon] || ''} ${meta.label}</span><span class="eco-kpi-value">Chargement…</span></div>`;
  }).join('')}</div>`;
}
function ecoHomeInfoHtml(indicatorKey, uid){
  const terme = ECO_HOME_INDICATOR_TERMS[indicatorKey];
  if(!terme) return '';
  const def = ecoLibraryDefinition(terme);
  if(!def) return '';
  const courseId = ECO_HOME_INDICATOR_COURSE[indicatorKey];
  const courseOrLibHtml = courseId
    ? `<a href="cours.html#${courseId}" style="display:block;margin-top:8px;">Voir le cours complet →</a>`
    : `<a href="bibliotheque.html#${encodeURIComponent(terme.replace(/\s+/g, '-'))}" style="display:block;margin-top:8px;">Voir dans la Bibliothèque →</a>`;
  return `
    <button type="button" class="eco-info-btn" aria-label="Qu'est-ce que ${terme} ?" onclick="document.getElementById('${uid}').classList.toggle('open')">ⓘ</button>
    <div class="glossary-body" id="${uid}">
      <div class="glossary-body-inner">
        <strong>Qu'est-ce que ${terme} ?</strong>
        <p style="margin-top:4px;">${def}</p>
        ${courseOrLibHtml}
      </div>
    </div>`;
}
function renderEcoHomeMetrics(){
  const el = document.getElementById('ecoHomeMetrics');
  if(!el) return;
  const geoLabel = ECO_HOME_GEOS[ecoHomeGeo].label;
  el.innerHTML = `<span class="eco-home-section-title">Indicateurs clés — ${geoLabel}</span><div class="eco-home-metrics-grid" id="ecoHomeMetricsGrid"></div>`;
  const grid = document.getElementById('ecoHomeMetricsGrid');
  grid.innerHTML = ECO_HOME_INDICATORS.map((k, i) => {
    const fallbackMeta = k === 'policy-rate' ? {icon: 'landmark', label: 'Taux directeur'} : ECO_KPI_META[k];
    const d = ecoHomeData[k];
    const uid = `ecoHomeInfo-${k}`;
    if(!d || d.points.length === 0){
      return `<div class="eco-kpi is-unavailable"><span class="eco-kpi-label">${ICONS[fallbackMeta.icon] || ''} ${fallbackMeta.label}</span><span class="eco-kpi-value" style="font-size:12px;font-weight:400;color:var(--term-text-dim);">Donnée indisponible${ecoHomeGeo === 'EA' && !ECO_HOME_EA_AVAILABLE.includes(k) ? ' pour la zone euro' : ''}</span></div>`;
    }
    const last = d.points[d.points.length - 1];
    const delta = ecoHomeLastDelta(d.points);
    const deltaClass = delta !== null ? ecoDeltaClass(d.meta.tone, delta, d.meta.fmt) : 'flat';
    const arrow = (deltaClass === 'up' || deltaClass === 'neutral-up') ? '↑' : (deltaClass === 'down' || deltaClass === 'neutral-down') ? '↓' : '→';
    const sparkHistory = d.points.slice(-24).map(p => ({close: p.value, date: p.period}));
    const interpretation = ecoHomeInterpretation(k, delta);
    return `<div class="eco-kpi">
      <span class="eco-kpi-label">${ICONS[d.meta.icon] || ''} ${d.meta.label}${ecoHomeInfoHtml(k, uid)}</span>
      <span class="eco-kpi-value">${d.meta.fmt(last.value)}</span>
      ${delta !== null ? `<span class="eco-kpi-delta ${deltaClass}">${arrow} ${d.meta.fmt(Math.abs(delta)).replace(/^\+/, '')} vs période préc.</span>` : ''}
      <div class="eco-kpi-spark">${renderSparklineHTML(sparkHistory, {compact: true})}</div>
      <span class="eco-kpi-asof">${ecoFreshnessBadge(d.frequency)} · ${last.period} · ${d.source || ''}</span>
      ${interpretation ? `<p class="eco-home-interpretation">${interpretation}</p>` : ''}
      <a href="economie.html?vue=avance&pays=${ecoHomeGeo === 'EA' ? 'FR' : ecoHomeGeo}&onglet=overview${ECO_CHART_VARIABLES.includes(k) ? `&variable=${k}` : ''}" class="eco-link" style="font-size:11px;">Voir l'historique →</a>
    </div>`;
  }).join('');
}

// ============================================================
// ZONE 3 — État de l'économie (EconomyState). Méthodologie disclosed,
// jamais un chiffre inventé : chaque barre = position (0-100 %) de la
// dernière valeur réelle dans le min-max de son PROPRE historique déjà
// récupéré (Zone 2) — jamais un seuil absolu inventé. Le sens (haut =
// favorable) suit le "tone" déjà défini dans ECO_KPI_META : croissance
// (growth) et marché du travail (inverse sur le chômage, donc barre
// inversée) ont une lecture favorable/défavorable claire ; inflation et
// taux directeur restent "neutral" (pas de jugement bon/mauvais universel
// sur leur niveau, même principe déjà appliqué à la Carte mondiale) — la
// barre "Conditions financières" est un PROXY assumé et disclosed
// (position du taux directeur dans son historique), jamais un indice
// composite inventé. Formulation imposée : "Lecture des indicateurs
// actuels", jamais "L'économie est officiellement...".
// ============================================================
function ecoHomeBarPct(points, tone){
  if(!points || points.length < 2) return null;
  const values = points.map(p => p.value);
  const min = Math.min(...values), max = Math.max(...values);
  if(max === min) return 50;
  const last = values[values.length - 1];
  const pct = ((last - min) / (max - min)) * 100;
  return tone === 'inverse' ? 100 - pct : pct;
}
const ECO_HOME_STATE_DIMENSIONS = [
  {key: 'gdp-growth', label: 'Croissance', tone: 'growth'},
  {key: 'inflation', label: 'Inflation', tone: 'neutral'},
  {key: 'unemployment', label: 'Marché du travail', tone: 'inverse'},
  {key: 'policy-rate', label: 'Conditions financières', tone: 'neutral'}
];
function ecoHomeReading(){
  const growth = ecoHomeData['gdp-growth'];
  const favorable = [], vigilance = [];
  if(growth && growth.points.length >= 2){
    const delta = ecoHomeLastDelta(growth.points);
    const last = growth.points[growth.points.length - 1].value;
    if(delta < 0) vigilance.push(`Croissance en ralentissement (${ECO_KPI_META['gdp-growth'].fmt(last)} sur la dernière période observée).`);
    else if(delta > 0) favorable.push(`Croissance en accélération (${ECO_KPI_META['gdp-growth'].fmt(last)} sur la dernière période observée).`);
  }
  const inflation = ecoHomeData['inflation'];
  if(inflation && inflation.points.length >= 3){
    const p = inflation.points, n = p.length;
    if(p[n - 1].value < p[n - 2].value && p[n - 2].value < p[n - 3].value) favorable.push('Inflation en baisse sur les deux dernières périodes observées.');
    else if(p[n - 1].value > p[n - 2].value && p[n - 2].value > p[n - 3].value) vigilance.push('Inflation en hausse sur les deux dernières périodes observées.');
  }
  const unemployment = ecoHomeData['unemployment'];
  if(unemployment && unemployment.points.length >= 2){
    const delta = ecoHomeLastDelta(unemployment.points);
    const last = unemployment.points[unemployment.points.length - 1].value;
    if(delta <= 0) favorable.push(`Marché du travail résilient (chômage à ${ECO_KPI_META['unemployment'].fmt(last)}).`);
    else vigilance.push(`Chômage en hausse (${ECO_KPI_META['unemployment'].fmt(last)} sur la dernière période observée).`);
  }
  let headline = 'Lecture mixte';
  if(growth && growth.points.length >= 2){
    const delta = ecoHomeLastDelta(growth.points);
    const last = growth.points[growth.points.length - 1].value;
    if(delta < 0 && last < 1) headline = 'Ralentissement modéré';
    else if(delta < 0) headline = 'Croissance qui ralentit';
    else if(last > 1.5) headline = 'Expansion soutenue';
    else headline = 'Croissance stable';
  }
  const watch = ecoUpcomingMeetings(new Date().toISOString().slice(0, 10)).slice(0, 3)
    .map(m => `Réunion ${m.bank} — ${ecoFormatDateRange(m.date, m.dateEnd)}`);
  return {headline, favorable, vigilance, watch};
}
function renderEcoHomeState(){
  const el = document.getElementById('ecoHomeState');
  if(!el) return;
  const reading = ecoHomeReading();
  el.innerHTML = `
    <span class="eco-home-section-title">État de l'économie <button type="button" class="eco-link" id="ecoHomeMethodoBtn" style="font-size:10.5px;">Méthodologie</button></span>
    <div class="eco-panel" style="margin-top:10px;">
      <p style="font-size:11px;color:var(--term-text-dim);text-transform:uppercase;letter-spacing:.06em;">Lecture des indicateurs actuels</p>
      <p style="font-family:'Cormorant Garamond',serif;font-size:24px;color:var(--term-gold-light);margin-top:4px;">${reading.headline}</p>
      <div class="eco-home-bars">
        ${ECO_HOME_STATE_DIMENSIONS.map(dim => {
          const pct = ecoHomeBarPct((ecoHomeData[dim.key] || {}).points, dim.tone);
          return `<div class="eco-home-bar-row">
            <span class="eco-home-bar-label">${dim.label}</span>
            <div class="eco-home-bar-track">${pct === null ? '' : `<div class="eco-home-bar-fill" style="width:${pct}%;"></div>`}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="eco-home-state-cols">
        <div><span class="eco-home-col-title" style="color:var(--term-positive);">Points favorables</span>${reading.favorable.length ? reading.favorable.map(t => `<p>${t}</p>`).join('') : '<p class="eco-panel-note">Aucun signal favorable net sur les indicateurs suivis actuellement.</p>'}</div>
        <div><span class="eco-home-col-title" style="color:var(--term-negative);">Points de vigilance</span>${reading.vigilance.length ? reading.vigilance.map(t => `<p>${t}</p>`).join('') : '<p class="eco-panel-note">Aucun signal de vigilance net sur les indicateurs suivis actuellement.</p>'}</div>
        <div><span class="eco-home-col-title">À surveiller</span>${reading.watch.length ? reading.watch.map(t => `<p>${t}</p>`).join('') : '<p class="eco-panel-note">Aucune échéance connue dans le calendrier suivi.</p>'}</div>
      </div>
      <div class="glossary-body" id="ecoHomeMethodoBody"><div class="glossary-body-inner">
        <strong>Méthodologie</strong>
        <p style="margin-top:4px;">Chaque barre indique la position de la dernière valeur réelle par rapport au minimum et au maximum de son propre historique observé sur ce site (jamais un seuil absolu inventé). "Marché du travail" est inversé (un chômage bas remplit la barre). "Inflation" et "Conditions financières" (proxy : niveau du taux directeur dans son historique) restent neutres — ni favorables ni défavorables par nature, comme sur la Carte mondiale. Cette lecture décrit les indicateurs suivis, ce n'est jamais une prévision ni un verdict officiel sur l'économie.</p>
      </div></div>
    </div>`;
  const methodoBtn = document.getElementById('ecoHomeMethodoBtn');
  if(methodoBtn) methodoBtn.addEventListener('click', () => document.getElementById('ecoHomeMethodoBody').classList.toggle('open'));
}

// ============================================================
// ZONE 4 — Ce qui change (MacroEventCard, 3 max). Calcul automatique
// (jamais 3 événements curés à la main, source de contenu qui périme) :
// les indicateurs avec le plus grand mouvement réel récent normalisé
// (|delta| / écart-type historique).
// ============================================================
function ecoHomeStdDev(values){
  const n = values.length;
  if(n < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
}
function ecoHomeTopChanges(){
  return ECO_HOME_INDICATORS.map(k => {
    const d = ecoHomeData[k];
    if(!d || d.points.length < 2) return null;
    const values = d.points.map(p => p.value);
    const last = values[values.length - 1];
    const prev = values[values.length - 2];
    const delta = last - prev;
    if(Math.abs(delta) < 1e-9) return null;
    const stdev = ecoHomeStdDev(values);
    return {key: k, last, prev, delta, score: stdev > 0 ? Math.abs(delta) / stdev : 0, meta: d.meta, period: d.points[d.points.length - 1].period};
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 3);
}
function renderEcoHomeChanges(){
  const el = document.getElementById('ecoHomeChanges');
  if(!el) return;
  const changes = ecoHomeTopChanges();
  el.innerHTML = `
    <span class="eco-home-section-title">Ce qui change — ${ECO_HOME_GEOS[ecoHomeGeo].label}</span>
    <div class="eco-home-changes-grid">
      ${changes.length === 0 ? '<p class="eco-panel-note">Aucun mouvement significatif détecté sur les indicateurs suivis actuellement.</p>' : changes.map(c => `
        <div class="eco-panel">
          <span class="eco-panel-title">${c.meta.label}</span>
          <p style="font-family:'IBM Plex Mono',monospace;font-size:18px;color:var(--term-text);margin-top:6px;">${c.meta.fmt(c.last)} <span style="font-size:12px;color:var(--term-text-dim);font-weight:400;">contre ${c.meta.fmt(c.prev)} précédemment</span></p>
          <p class="eco-panel-note">${ecoHomeInterpretation(c.key, c.delta) || ''}</p>
        </div>`).join('')}
    </div>`;
}

// ============================================================
// ZONE 5 — Monde (CountryComparison compact). Réutilise ecoHomeFetchIndicator
// (qui gère déjà FR/EA/US/CN/GB/JP) pour les 4 géographies visibles de la
// page + les 8 pays réels du Comparateur existant réunis sous une seule
// liste, comparaison compacte 5 indicateurs. Favorable/neutre/vigilance
// dérivé du "tone" déjà défini (jamais vert=bon/rouge=mauvais sans
// logique) — l'inflation reste explicitement neutre, jamais colorée,
// cohérent avec la Carte mondiale déjà livrée.
// ============================================================
const ECO_HOME_WORLD_GEOS = ['FR', 'EA', 'US', 'CN'];
const ECO_HOME_WORLD_ROWS = ['inflation', 'gdp-growth', 'policy-rate', 'unemployment', 'gov-debt'];
let ecoHomeWorldData = null;
function ecoHomeToneLabel(tone, delta){
  if(tone === 'neutral' || !delta) return {label: 'neutre', cls: 'flat'};
  const rising = delta > 0;
  const favorable = (tone === 'growth' && rising) || (tone === 'inverse' && !rising);
  return favorable ? {label: 'favorable', cls: 'up'} : {label: 'vigilance', cls: 'down'};
}
async function renderEcoHomeWorld(){
  const el = document.getElementById('ecoHomeWorld');
  if(!el) return;
  el.innerHTML = `<span class="eco-home-section-title">Monde</span><p class="eco-panel-note">Chargement…</p>`;
  if(!ecoHomeWorldData){
    const table = {};
    for(const geo of ECO_HOME_WORLD_GEOS){
      table[geo] = {};
      for(const row of ECO_HOME_WORLD_ROWS){ table[geo][row] = await ecoHomeFetchIndicator(geo, row); }
    }
    ecoHomeWorldData = table;
  }
  el.innerHTML = `
    <span class="eco-home-section-title">Monde</span>
    <div class="eco-table-wrap">
      <table class="eco-home-world-table">
        <thead><tr><th>Indicateur</th>${ECO_HOME_WORLD_GEOS.map(g => `<th>${ECO_HOME_GEOS[g].flag} ${ECO_HOME_GEOS[g].label}</th>`).join('')}</tr></thead>
        <tbody>
          ${ECO_HOME_WORLD_ROWS.map(row => `<tr><td>${row === 'policy-rate' ? 'Taux directeur' : ECO_KPI_META[row].label}</td>${ECO_HOME_WORLD_GEOS.map(geo => {
            const d = ecoHomeWorldData[geo][row];
            if(!d || d.points.length === 0) return `<td class="is-na">N/D</td>`;
            const last = d.points[d.points.length - 1];
            const delta = ecoHomeLastDelta(d.points);
            const tone = ecoHomeToneLabel(d.meta.tone, delta);
            return `<td><span class="mono">${d.meta.fmt(last.value)}</span><span class="eco-home-tone eco-home-tone-${tone.cls}">${tone.label}</span></td>`;
          }).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
    <a href="economie.html?vue=avance&onglet=compare" class="eco-link" style="font-size:11.5px;margin-top:8px;display:inline-block;">Voir le comparateur complet →</a>
    <a href="economie.html?vue=avance&onglet=map" class="eco-link" style="font-size:11.5px;margin-top:8px;margin-left:14px;display:inline-block;">Voir la carte mondiale →</a>`;
}

// ============================================================
// ZONE 6 — Calendrier macro (compact). Réutilise ECO_CENTRAL_BANK_MEETINGS
// / ecoUpcomingMeetings tels quels — aucune page calendrier dédiée
// n'existe sur le site (vérifié) et aucune source de dates de publication
// macro n'est intégrée : "Voir tous les événements suivis →" déplie la
// liste complète EN PLACE plutôt que de fabriquer un lien vers une page
// qui n'existe pas.
// ============================================================
function renderEcoHomeCalendar(){
  const el = document.getElementById('ecoHomeCalendar');
  if(!el) return;
  const all = ecoUpcomingMeetings(new Date().toISOString().slice(0, 10));
  const preview = all.slice(0, 3);
  el.innerHTML = `
    <span class="eco-home-section-title">Calendrier macro</span>
    <div class="eco-panel" style="margin-top:10px;">
      <div id="ecoHomeCalendarList">
        ${preview.map(m => `<a href="${m.url}" target="_blank" rel="noopener" class="eco-home-calendar-row"><span>${m.bank}</span><span class="mono">${ecoFormatDateRange(m.date, m.dateEnd)}</span></a>`).join('') || '<p class="eco-panel-note">Aucune échéance connue pour l\'instant.</p>'}
      </div>
      ${all.length > preview.length ? `<button type="button" class="eco-link" id="ecoHomeCalendarMore" style="margin-top:8px;font-size:11.5px;">Voir tous les événements suivis (${all.length}) →</button>` : ''}
      <p class="eco-panel-note">Dates officielles BCE/Fed. Aucun calendrier de publications macro (inflation, PIB, emploi...) n'est encore intégré sur ce site.</p>
    </div>`;
  const moreBtn = document.getElementById('ecoHomeCalendarMore');
  if(moreBtn) moreBtn.addEventListener('click', () => {
    document.getElementById('ecoHomeCalendarList').innerHTML = all.map(m => `<a href="${m.url}" target="_blank" rel="noopener" class="eco-home-calendar-row"><span>${m.bank}</span><span class="mono">${ecoFormatDateRange(m.date, m.dateEnd)}</span></a>`).join('');
    moreBtn.style.display = 'none';
  });
}

// ============================================================
// Macro → Marchés (MacroMarketImpact) — pédagogique, distinct de l'Et
// si...? existant (qui reste dans la Vue avancée pour les chaînes de
// cause à effet macro-macro) : mécanismes réels de manuel, jamais une
// prédiction ni une recommandation d'achat. Ponts vers Bourse limités
// aux vraies destinations existantes (aucune vue "secteurs sensibles aux
// taux" n'existe sur bourse.html, vérifié).
// ============================================================
const ECO_MARKET_IMPACTS = {
  'inflation-up': {label: 'Inflation ↑', bonds: "Peut peser sur le prix des obligations déjà émises (leur rendement doit rester compétitif face à la hausse des prix).", stocks: 'Peut peser sur les valorisations, notamment des entreprises à forte croissance attendue.', realestate: 'Peut renchérir indirectement le coût du crédit immobilier si la banque centrale réagit en relevant ses taux.', currency: 'Effet sur la monnaie très dépendant de la réponse de la banque centrale.'},
  'inflation-down': {label: 'Inflation ↓', bonds: 'Peut soutenir le prix des obligations déjà émises.', stocks: 'Peut soutenir les valorisations, notamment des entreprises à forte croissance attendue.', realestate: 'Peut contribuer à rendre le crédit immobilier moins coûteux si la banque centrale baisse ses taux en retour.', currency: 'Effet sur la monnaie très dépendant de la réponse de la banque centrale.'},
  'rate-up': {label: 'Taux directeurs ↑', bonds: 'Tend historiquement à faire baisser le prix des obligations déjà émises (rendement moins compétitif).', stocks: 'Peut augmenter le coût du capital pour les entreprises et peser sur les valorisations.', realestate: 'Tend historiquement à renchérir le crédit immobilier.', currency: 'Peut soutenir relativement la monnaie concernée (rendement plus attractif pour les capitaux étrangers).'},
  'rate-down': {label: 'Taux directeurs ↓', bonds: 'Peut soutenir le prix des obligations déjà émises.', stocks: 'Peut réduire le coût du capital pour les entreprises.', realestate: 'Peut contribuer à rendre le crédit immobilier moins coûteux.', currency: 'Peut exercer une pression relative sur la monnaie concernée.'},
  'growth-up': {label: 'Croissance ↑', bonds: "Peut peser légèrement sur les obligations si elle ravive les anticipations d'inflation ou de taux.", stocks: 'Est généralement associée à une amélioration des perspectives de bénéfices des entreprises.', realestate: 'Peut soutenir la demande immobilière via un marché du travail plus dynamique.', currency: 'Peut soutenir relativement la monnaie concernée.'},
  'growth-down': {label: 'Croissance ↓', bonds: 'Peut soutenir les obligations perçues comme des valeurs refuges.', stocks: 'Est généralement associée à des perspectives de bénéfices plus prudentes.', realestate: 'Peut peser sur la demande immobilière via un marché du travail plus incertain.', currency: 'Peut exercer une pression relative sur la monnaie concernée.'},
  'unemployment-up': {label: 'Chômage ↑', bonds: 'Peut soutenir les obligations si la hausse renforce les anticipations de baisse des taux.', stocks: 'Peut peser sur la consommation et donc sur les résultats des entreprises exposées.', realestate: 'Peut peser sur la demande immobilière.', currency: 'Peut exercer une pression relative sur la monnaie concernée.'},
  'oil-up': {label: 'Pétrole ↑', bonds: "Peut peser sur les obligations si la hausse ravive les anticipations d'inflation.", stocks: 'Effet contrasté : peut peser sur les entreprises fortement consommatrices d\'énergie, soutenir les producteurs.', realestate: 'Effet indirect, via le coût de la vie et le pouvoir d\'achat des ménages.', currency: 'Peut soutenir relativement la monnaie des pays exportateurs de pétrole.'}
};
let ecoHomeMarketScenario = 'rate-down';
function renderEcoHomeMarkets(){
  const el = document.getElementById('ecoHomeMarkets');
  if(!el) return;
  const s = ECO_MARKET_IMPACTS[ecoHomeMarketScenario];
  el.innerHTML = `
    <span class="eco-home-section-title">Macro → Marchés</span>
    <p class="eco-panel-note">Des mécanismes économiques reconnus, jamais une prédiction ni une recommandation d'investissement.</p>
    <div class="eco-map-picker" style="margin-top:8px;">
      ${Object.entries(ECO_MARKET_IMPACTS).map(([key, v]) => `<button type="button" class="pill ${key === ecoHomeMarketScenario ? 'active' : ''}" data-scenario="${key}">${v.label}</button>`).join('')}
    </div>
    <div class="eco-home-market-grid" style="margin-top:10px;">
      <div class="eco-panel"><span class="eco-panel-title">Obligations</span><p style="margin-top:6px;font-size:12.5px;">${s.bonds}</p></div>
      <div class="eco-panel"><span class="eco-panel-title">Actions</span><p style="margin-top:6px;font-size:12.5px;">${s.stocks}</p></div>
      <div class="eco-panel"><span class="eco-panel-title">Immobilier</span><p style="margin-top:6px;font-size:12.5px;">${s.realestate}</p></div>
      <div class="eco-panel"><span class="eco-panel-title">Devises</span><p style="margin-top:6px;font-size:12.5px;">${s.currency}</p></div>
    </div>
    <div style="margin-top:10px;display:flex;gap:16px;flex-wrap:wrap;">
      <a href="bourse.html#tab-marches" class="eco-link" style="font-size:11.5px;">Explorer les obligations et taux sur Bourse →</a>
      <a href="bourse.html#tab-screener" class="eco-link" style="font-size:11.5px;">Filtrer les actions par secteur sur Bourse →</a>
    </div>`;
  el.querySelectorAll('[data-scenario]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.dataset.scenario === ecoHomeMarketScenario) return;
      ecoHomeMarketScenario = btn.dataset.scenario;
      renderEcoHomeMarkets();
    });
  });
}

// ============================================================
// CTA Laboratoire + pont Actualités. Une seule vraie destination existe
// pour les scénarios macro (laboratoire.html#tab-economie, "Gouverneur de
// banque centrale" + scénarios) — les 5 exemples illustrent le contenu
// sans fabriquer 5 ancres différentes qui n'existent pas.
// ============================================================
function renderEcoHomeCtas(){
  const el = document.getElementById('ecoHomeCtas');
  if(!el) return;
  el.innerHTML = `
    <div class="eco-home-ctas-grid">
      <div class="eco-panel">
        <span class="eco-panel-title">🧪 Tester un scénario économique</span>
        <p class="eco-panel-note" style="margin-top:6px;">Hausse des taux, baisse des taux, inflation élevée, récession, choc pétrolier — des scénarios qualitatifs, avec le mécanisme expliqué, jamais une prédiction.</p>
        <a href="laboratoire.html#tab-economie" class="btn btn-sm btn-gold" style="margin-top:10px;">Explorer les scénarios →</a>
      </div>
      <div class="eco-panel">
        <span class="eco-panel-title">📰 Ce qui change actuellement</span>
        <p class="eco-panel-note" style="margin-top:6px;">Cette page se concentre sur 3 mouvements macro majeurs (Zone "Ce qui change" ci-dessus) — pour toute l'actualité économique, retrouve les vraies publications de la semaine.</p>
        <a href="actualites.html?cat=${encodeURIComponent('Économie')}" class="btn btn-sm" style="margin-top:10px;">Voir toutes les actualités économiques →</a>
      </div>
    </div>`;
}

// ============================================================
// Orchestrateur accueil + bascule de mode (Vue accueil / Vue avancée).
// ============================================================
async function renderEcoHomeAll(){
  renderEcoHomeHero();
  renderEcoHomeMetricsLoading();
  await ecoHomeFetchAll(ecoHomeGeo);
  renderEcoHomeMetrics();
  renderEcoHomeState();
  renderEcoHomeChanges();
  renderEcoHomeCalendar();
  renderEcoHomeMarkets();
  renderEcoHomeCtas();
  renderEcoHomeWorld();
}

// ?vue=avance (+ pays/onglet/variable optionnels) ouvre la Vue avancée
// (l'ancien terminal, préservé à l'identique) ; par défaut, l'Accueil.
// Simple lecture au chargement (pas de routage SPA) — cohérent avec le
// reste du site, où chaque page relit son propre état au chargement.
function ecoInitPageMode(){
  const params = new URLSearchParams(location.search);
  const isAdvanced = params.get('vue') === 'avance';
  const homeEl = document.getElementById('ecoHome');
  const terminalEl = document.getElementById('ecoTerminal');
  if(homeEl) homeEl.style.display = isAdvanced ? 'none' : '';
  if(terminalEl) terminalEl.style.display = isAdvanced ? '' : 'none';
  if(isAdvanced){
    const pays = params.get('pays');
    const onglet = params.get('onglet');
    const variable = params.get('variable');
    if(pays && ECO_COUNTRIES[pays]) ecoActiveCountry = pays;
    if(onglet && ECO_VIEWS[onglet]) ecoActiveView = onglet;
    if(variable && ECO_CHART_VARIABLES.includes(variable)) ecoChartVariable = variable;
    safeRun('terminal économie — navigation', () => renderEcoNav('ecoNav'));
    safeRun('terminal économie — corps (en-tête/KPI/contenu)', () => renderEcoBody());
  } else {
    safeRun('accueil économie', () => renderEcoHomeAll());
  }
}
ecoInitPageMode();
