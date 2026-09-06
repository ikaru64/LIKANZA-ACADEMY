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

// ---------- Vues transversales (modules) : seulement celles pour
// lesquelles une vraie source existe déjà — Croissance/Inflation/Emploi
// sont déjà couverts par la vue "Pays" (KPI + Macro Trend), pas dupliqués
// ici. Carte mondiale/comparateur/Graph Lab/mode enseignant/crisis
// replay/impact engine restent des chantiers futurs (cf. en-tête). ----------
const ECO_VIEWS = {
  overview: {label: "Vue d'ensemble", icon: 'compass'},
  'central-banks': {label: 'Banques centrales', icon: 'landmark'},
  debt: {label: 'Dette & déficit', icon: 'scale'},
  'public-finance': {label: 'Finances publiques', icon: 'coins'}
};
let ecoActiveView = 'overview';

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
  } else if(ecoActiveView === 'central-banks'){
    renderCentralBanksView();
  } else if(ecoActiveView === 'debt'){
    renderDebtView();
  } else if(ecoActiveView === 'public-finance'){
    renderPublicFinanceView();
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
