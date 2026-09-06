/* ============================================================
   LIKANZA ACADEMY — Page Économie (economie.html)
   Refonte du 06/09/2026 : "Likanza Economic Intelligence Terminal"
   (Phase 1, socle). Toutes les séries viennent de /api/eco-rate (BCE,
   Eurostat, Banque Mondiale, FRED — voir api/eco-rate.js) — jamais une
   valeur inventée pour combler une case vide ; une série indisponible
   affiche honnêtement "Donnée indisponible".

   Portée volontairement limitée à un socle réel plutôt qu'aux 40
   sections du brief d'origine — carte interactive, comparateur de pays,
   Graph Lab, mode enseignant, crisis replay et impact engine sont
   reportés à des chantiers futurs (décision actée avec l'utilisateur,
   cf. mémoire project_economie_terminal_status).
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
    <span class="eco-nav-label">Pays</span>
    ${Object.entries(ECO_COUNTRIES).map(([code, c]) => `
      <button type="button" class="${code === ecoActiveCountry ? 'active' : ''}" data-country="${code}">
        <span class="eco-nav-flag">${c.flag}</span><span>${c.label}</span>
      </button>`).join('')}
  `;
  el.querySelectorAll('button[data-country]').forEach(btn => {
    btn.addEventListener('click', () => {
      ecoActiveCountry = btn.dataset.country;
      el.querySelectorAll('button[data-country]').forEach(b => b.classList.toggle('active', b.dataset.country === ecoActiveCountry));
      renderEcoHeader('ecoHeaderMeta');
      renderEcoKpis('ecoKpis');
      rerenderEcoMain();
    });
  });
}

function renderEcoHeader(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const now = new Date();
  el.innerHTML = `Actualisé · ${now.toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'})}<br><strong>${ECO_COUNTRIES[ecoActiveCountry].flag} ${ECO_COUNTRIES[ecoActiveCountry].label}</strong>`;
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

safeRun('terminal économie — navigation', () => renderEcoNav('ecoNav'));
safeRun('terminal économie — en-tête', () => renderEcoHeader('ecoHeaderMeta'));
safeRun('terminal économie — KPI', () => renderEcoKpis('ecoKpis'));
safeRun('terminal économie — graphique principal', () => renderEcoMainChart('ecoMain'));

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
