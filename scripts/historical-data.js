/* ============================================================
   LIKANZA ACADEMY — Registre des données historiques réelles
   (Laboratoire financier, scripts/pages/laboratoire.js)

   Règle absolue du Laboratoire : ne jamais inventer une donnée.
   Ce fichier ne contient AUCUNE valeur numérique — seulement les
   métadonnées (source, période couverte, fréquence) des séries
   réellement utilisées. Les valeurs elles-mêmes sont toujours
   récupérées en direct via /api/custom-quotes (Yahoo Finance) ou
   /api/eco-rate?series=... (BCE SDW, voir lib/ecb.js) — jamais
   codées en dur ici.

   Chargé uniquement sur les pages qui en ont besoin (laboratoire.html),
   comme scripts/app.js et scripts/data.js.
   ============================================================ */

const HISTORICAL_SERIES = {
  urthWorld: {
    label: 'Actions monde (MSCI World, via ETF URTH)',
    source: 'Yahoo Finance — iShares MSCI World ETF (URTH)',
    sourceUrl: 'https://finance.yahoo.com/quote/URTH',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  sp500: {
    label: 'Actions US (S&P 500)',
    source: 'Yahoo Finance — indice S&P 500 (^GSPC)',
    sourceUrl: 'https://finance.yahoo.com/quote/%5EGSPC',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  cac40: {
    label: 'Actions France (CAC 40)',
    source: 'Yahoo Finance — indice CAC 40 (^FCHI)',
    sourceUrl: 'https://finance.yahoo.com/quote/%5EFCHI',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  inflationFR: {
    label: 'Inflation France (IPCH)',
    source: 'Banque centrale européenne (BCE) — statistiques HICP',
    sourceUrl: 'https://data.ecb.europa.eu/data/datasets/ICP',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  mortgageRateFR: {
    label: 'Taux crédit immobilier (ménages, France)',
    source: "Banque centrale européenne (BCE) — statistiques MIR",
    sourceUrl: 'https://data.ecb.europa.eu/data/datasets/MIR',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  homePriceFR: {
    label: "Prix de l'immobilier résidentiel (France entière)",
    source: 'BCE / Eurostat — statistiques immobilières résidentielles (RESR)',
    sourceUrl: 'https://data.ecb.europa.eu/data/datasets/RESR',
    frequency: 'Trimestrielle',
    kind: 'live'
  }
};

// ---------- Badges "type de donnée" (section 4 de la spec utilisateur) ----------
// Toujours l'un des quatre, jamais mélangés dans le même chiffre affiché.
const DATA_BADGE_META = {
  reel:      {emoji: '🟢', label: 'Historique réel', className: 'data-badge-reel'},
  hypothese: {emoji: '🔵', label: 'Hypothèse', className: 'data-badge-hypothese'},
  scenario:  {emoji: '🟡', label: 'Scénario', className: 'data-badge-scenario'},
  exemple:   {emoji: '⚪', label: 'Exemple pédagogique', className: 'data-badge-exemple'},
  editorial: {emoji: '📝', label: 'Rédaction Likanza Academy', className: 'data-badge-editorial'}
};
function renderDataBadge(kind){
  const meta = DATA_BADGE_META[kind] || DATA_BADGE_META.hypothese;
  return `<span class="data-badge ${meta.className}"><span aria-hidden="true">${meta.emoji}</span> ${meta.label}</span>`;
}

// ---------- Indicateur de fiabilité (section 45) ----------
const DATA_QUALITY_META = {
  forte:     {emoji: '🟢', label: 'Forte', desc: 'Données historiques officielles disponibles.'},
  moyenne:   {emoji: '🟡', label: 'Moyenne', desc: 'Certaines hypothèses utilisateur sont nécessaires.'},
  theorique: {emoji: '⚪', label: 'Simulation théorique', desc: 'Majoritairement basée sur des hypothèses.'}
};
function renderDataQualityBadge(level){
  const meta = DATA_QUALITY_META[level] || DATA_QUALITY_META.theorique;
  return `<span class="data-quality-badge data-quality-${level}" title="${meta.desc}"><span aria-hidden="true">${meta.emoji}</span> Qualité des données : ${meta.label}</span>`;
}

// ---------- Note de source (panneau "Voir les sources", section 46) ----------
function renderSourceNote(seriesKey, extra){
  const s = HISTORICAL_SERIES[seriesKey];
  if(!s) return '';
  const period = extra && extra.period ? ` · période : ${extra.period}` : '';
  return `<p class="source-note">Source : ${s.source}${s.frequency ? ' · ' + s.frequency : ''}${period}${s.sourceUrl ? ` · <a href="${s.sourceUrl}" target="_blank" rel="noopener">voir la série</a>` : ''}</p>`;
}

// ---------- Période couverte + avertissement année partielle (section 2) ----------
function formatSeriesPeriodLabel(points){
  if(!points || points.length === 0) return '';
  return `${points[0].period} → ${points[points.length - 1].period}`;
}
const MONTH_NAMES_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function formatPartialYearNote(lastPeriod){
  if(!lastPeriod) return '';
  const yearMatch = lastPeriod.match(/^(\d{4})/);
  if(!yearMatch) return '';
  const year = +yearMatch[1];
  const currentYear = new Date().getFullYear();
  if(year < currentYear) return '';
  const monthMatch = lastPeriod.match(/^\d{4}-(\d{2})$/);
  if(monthMatch){
    const m = +monthMatch[1];
    return `Données ${year} disponibles jusqu'à ${MONTH_NAMES_FR[m - 1]} ${year}.`;
  }
  const qMatch = lastPeriod.match(/^\d{4}-Q(\d)$/);
  if(qMatch) return `Données ${year} disponibles jusqu'au ${qMatch[1]}ᵉ trimestre ${year}.`;
  return `Données ${year} partielles.`;
}
