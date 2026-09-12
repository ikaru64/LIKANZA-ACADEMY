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
  euroStoxx50: {
    label: 'Actions Europe (Euro Stoxx 50)',
    source: 'Yahoo Finance — indice Euro Stoxx 50 (^STOXX50E)',
    sourceUrl: 'https://finance.yahoo.com/quote/%5ESTOXX50E',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  nasdaq100: {
    label: 'Actions technologie US (Nasdaq 100, ETF QQQ)',
    source: 'Yahoo Finance — Invesco QQQ Trust (QQQ)',
    sourceUrl: 'https://finance.yahoo.com/quote/QQQ',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  emergingMarkets: {
    label: 'Actions émergents (MSCI Emerging Markets, ETF EEM)',
    source: 'Yahoo Finance — iShares MSCI Emerging Markets ETF (EEM)',
    sourceUrl: 'https://finance.yahoo.com/quote/EEM',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  gold: {
    label: 'Or (cours au comptant, futures)',
    source: 'Yahoo Finance — Gold futures (GC=F)',
    sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  bondsUS: {
    label: 'Obligations US (ETF AGG, toutes échéances)',
    source: 'Yahoo Finance — iShares Core U.S. Aggregate Bond ETF (AGG)',
    sourceUrl: 'https://finance.yahoo.com/quote/AGG',
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
  },
  unemploymentFR: {
    label: 'Taux de chômage (France)',
    source: 'Eurostat — Enquête sur les forces de travail (une_rt_m)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/une_rt_m',
    frequency: 'Mensuelle',
    kind: 'live'
  },
  gdpGrowthFR: {
    label: 'Croissance du PIB (France)',
    source: 'Eurostat — Comptes nationaux trimestriels (namq_10_gdp)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/namq_10_gdp',
    frequency: 'Trimestrielle',
    kind: 'live'
  },
  govDebtFR: {
    label: 'Dette publique (France, % du PIB)',
    source: 'Eurostat — Statistiques des administrations publiques (gov_10q_ggdebt)',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/product/view/gov_10q_ggdebt',
    frequency: 'Trimestrielle',
    kind: 'live'
  }
};

// ---------- Likanza Truth Framework : les 6 catégories d'information ----------
// Toute affirmation importante appartient à l'une de ces 6 catégories,
// jamais mélangées dans un même chiffre affiché. Distinction volontaire
// entre DONNÉE RÉELLE (vérifiable, datée, sourcée) et CALCUL (résultat
// dérivé d'une formule + d'hypothèses) : un ratio ou une projection
// calculée à partir d'une vraie donnée n'est pas elle-même une donnée réelle.
//
// Chantier C (refonte continuité UX, 12/09/2026) a audité ces 6 catégories
// contre les 4 demandées par le brief (Donnée réelle/Calcul/Scénario/
// Simulation) : "fait" est renommé "Donnée réelle" (même concept, libellé
// plus clair) et calcul/scénario/simulation correspondaient déjà. "analyse"
// et "avis" sont volontairement CONSERVÉS comme 2 catégories de plus,
// jamais fusionnées dans l'une des 4 : elles encodent une distinction
// épistémique réelle que le brief n'avait pas anticipée — "analyse" est une
// lecture/explication d'une donnée déjà réelle ou calculée (ex. "pourquoi
// cette variation", un classement basé sur des seuils réels), "avis" est un
// jugement éditorial explicitement subjectif (ex. "deux lectures possibles
// des mêmes faits", "un repère indicatif, jamais une garantie") — les
// confondre avec CALCUL ferait perdre exactement la distinction que ce
// framework existe pour préserver.
const DATA_BADGE_META = {
  fait:       {emoji: '📊', label: 'Donnée réelle', className: 'data-badge-fait'},
  calcul:     {emoji: '🧮', label: 'Calcul', className: 'data-badge-calcul'},
  analyse:    {emoji: '🔍', label: 'Analyse', className: 'data-badge-analyse'},
  scenario:   {emoji: '🔮', label: 'Scénario', className: 'data-badge-scenario'},
  avis:       {emoji: '💬', label: 'Avis', className: 'data-badge-avis'},
  simulation: {emoji: '🎮', label: 'Simulation', className: 'data-badge-simulation'}
};
function renderDataBadge(kind){
  const meta = DATA_BADGE_META[kind] || DATA_BADGE_META.calcul;
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

// ---------- État vide orienté action (Chantier B, refonte continuité UX du
// 12/09/2026) : remplace un texte plat "Aucune donnée" par un message +,
// quand une vraie prochaine action existe, un bouton pour la déclencher —
// jamais un bouton fabriqué qui ferait doublon avec un contrôle déjà
// visible juste au-dessus (ex. un sélecteur de pays/indicateur déjà à
// l'écran) : dans ce cas, `cta` est omis et le message guide simplement
// vers ce contrôle existant. `cta.href` support un ancrage réel (lien
// cross-page) ; pour une action in-page (changer d'onglet, etc.), omettre
// `href` et câbler un `click` sur `.empty-state-cta` après insertion
// (même discipline que renderLabIntake/wireLabPriorityCard). ----------
function renderEmptyState(message, cta){
  let button = '';
  if(cta && cta.href){
    button = `<a href="${cta.href}" class="btn btn-sm btn-gold empty-state-cta" style="margin-top:8px;display:inline-block;">${cta.label}</a>`;
  } else if(cta){
    button = `<button type="button" class="btn btn-sm btn-gold empty-state-cta" style="margin-top:8px;">${cta.label}</button>`;
  }
  return `<p style="font-size:12.5px;color:var(--text-dim);">${message}</p>${button}`;
}

// ---------- Note de source (panneau "Voir les sources", section 46) ----------
function renderSourceNote(seriesKey, extra){
  const s = HISTORICAL_SERIES[seriesKey];
  if(!s) return '';
  const period = extra && extra.period ? ` · période : ${extra.period}` : '';
  return `<p class="source-note">Source : ${s.source}${s.frequency ? ' · ' + s.frequency : ''}${period}${s.sourceUrl ? ` · <a href="${s.sourceUrl}" target="_blank" rel="noopener">voir la série</a>` : ''}</p>`;
}

// ---------- Template méthodologie universel (Laboratoire financier, section
// 18 du plan) : le même bouton « ⓘ Comment ce résultat est calculé ? », avec
// les mêmes 5 sous-sections partout — calcul, données, hypothèses, limites,
// comprendre. Une section sans contenu réel fourni n'est jamais affichée
// vide (jamais un onglet "Limites" laissé blanc pour faire comme les autres).
// <details>/<summary> natif : aucun JS de toggle à écrire ni à tester. ----------
const METHODOLOGY_SECTION_META = {
  calcul: {emoji: '🧮', label: 'Calcul'},
  donnees: {emoji: '📊', label: 'Données'},
  hypotheses: {emoji: '⚙️', label: 'Hypothèses'},
  limites: {emoji: '⚠️', label: 'Limites'},
  comprendre: {emoji: '📚', label: 'Comprendre'}
};
function renderMethodologyPanel(spec){
  if(!spec) return '';
  const sections = Object.keys(METHODOLOGY_SECTION_META)
    .filter(key => spec[key])
    .map(key => {
      const meta = METHODOLOGY_SECTION_META[key];
      const parts = Array.isArray(spec[key]) ? spec[key] : [spec[key]];
      const content = parts.map(p => `<p style="margin-top:6px;">${p}</p>`).join('');
      return `<div style="margin-top:12px;"><span class="smallcaps">${meta.emoji} ${meta.label}</span>${content}</div>`;
    }).join('');
  if(!sections) return '';
  return `<details class="why-drawer" style="margin-top:14px;">
    <summary class="smallcaps" style="cursor:pointer;">ⓘ Comment ce résultat est calculé ?</summary>
    <div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;">${sections}</div>
  </details>`;
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
