/* ============================================================
   LIKANZA ACADEMY — Helper partagé : cotations Yahoo Finance
   Utilisé par api/quotes.js (indices/matières premières) et
   api/stock-quotes.js (actions). Placé hors de api/ pour ne pas
   devenir une route Vercel.
   ============================================================ */

const FETCH_HEADERS = {'User-Agent':'Mozilla/5.0 (compatible; LikanzaAcademy/1.0)'};

// Extrait l'historique réel des versements de dividendes depuis la réponse
// chart Yahoo (result.events.dividends, présent uniquement quand la requête
// inclut events=div) — un événement par paiement réellement effectué, jamais
// une agrégation ou une extrapolation Likanza. Objet vide si aucun dividende
// (ou si events=div n'a pas été demandé) : jamais une erreur bloquante.
function parseYahooDividendEvents(result){
  const raw = result && result.events && result.events.dividends;
  if(!raw || typeof raw !== 'object') return [];
  return Object.values(raw)
    .filter(e => e && typeof e.amount === 'number' && typeof e.date === 'number')
    .map(e => ({date: new Date(e.date * 1000).toISOString(), amount: e.amount}))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchYahooQuote(entry, opts){
  const range = (opts && opts.range) || '5d';
  const interval = (opts && opts.interval) || '1d';
  const eventsParam = (opts && opts.events) ? '&events=div,splits' : '';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(entry.yahoo)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}${eventsParam}`;
  const resp = await fetch(url, {headers: FETCH_HEADERS});
  if(!resp.ok) throw new Error(`Yahoo ${entry.yahoo} : HTTP ${resp.status}`);
  const json = await resp.json();
  const result = json.chart && json.chart.result && json.chart.result[0];
  if(!result || !result.meta) throw new Error(`Yahoo ${entry.yahoo} : réponse sans résultat`);
  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const closes = ((result.indicators || {}).quote || [{}])[0].close || [];
  // Paires (date, clôture) alignées, sans les trous (séances sans donnée).
  const sessions = timestamps
    .map((t, i) => ({date: new Date(t * 1000).toISOString(), close: closes[i]}))
    .filter(s => typeof s.close === 'number');
  const price = typeof meta.regularMarketPrice === 'number' ? meta.regularMarketPrice
    : (sessions.length ? sessions[sessions.length - 1].close : undefined);
  // La dernière clôture de la série correspond à la séance en cours (ou à la
  // dernière séance si le marché est fermé) : la clôture de référence pour la
  // variation quotidienne est donc l'avant-dernière valeur valide.
  const prevClose = sessions.length >= 2 ? sessions[sessions.length - 2].close
    : (typeof meta.previousClose === 'number' ? meta.previousClose : meta.chartPreviousClose);
  if(typeof price !== 'number' || typeof prevClose !== 'number' || prevClose === 0){
    throw new Error(`Yahoo ${entry.yahoo} : cotation inexploitable`);
  }
  return {
    symbol: entry.symbol,
    name: entry.name,
    assetType: entry.assetType,
    price,
    currency: meta.currency || 'USD',
    change: price - prevClose,
    changePercent: (price - prevClose) / prevClose * 100,
    timestamp: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    source: 'Yahoo Finance',
    status: 'DELAYED',
    delayMinutes: 15,
    history: sessions,
    dividends: (opts && opts.events) ? parseYahooDividendEvents(result) : undefined
  };
}

// Recherche publique Yahoo Finance (nom ou ticker -> symboles réels), utilisée
// par api/stock-search.js pour permettre d'ajouter n'importe quelle action
// suivie de vraies cotations (voir fetchYahooQuote) — jamais de résultat inventé.
async function searchYahooSymbols(query){
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
  const resp = await fetch(url, {headers: FETCH_HEADERS});
  if(!resp.ok) throw new Error(`Yahoo recherche : HTTP ${resp.status}`);
  const json = await resp.json();
  const quotes = Array.isArray(json.quotes) ? json.quotes : [];
  return quotes
    .filter(q => q.quoteType === 'EQUITY' && q.symbol && (q.shortname || q.longname))
    .slice(0, 8)
    .map(q => ({symbol: q.symbol, name: q.longname || q.shortname, exchange: q.exchDisp || q.exchange || ''}));
}

// Profil d'entreprise réel (description, secteur, industrie, effectif) via
// l'endpoint Yahoo quoteSummary. Contrairement aux endpoints ci-dessus,
// celui-ci exige une authentification par cookie + "crumb" (mécanisme moins
// stable, non documenté officiellement) : testé en direct avant intégration,
// mais surveiller si Yahoo change ce comportement. Aucun repli inventé côté
// appelant en cas d'échec — voir api/company-profile.js.
async function getYahooCrumb(){
  const cookieResp = await fetch('https://fc.yahoo.com', {headers: FETCH_HEADERS});
  const setCookie = cookieResp.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];
  if(!cookie) throw new Error('Yahoo : cookie de session introuvable');
  const crumbResp = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: {...FETCH_HEADERS, Cookie: cookie}
  });
  if(!crumbResp.ok) throw new Error(`Yahoo crumb : HTTP ${crumbResp.status}`);
  const crumb = (await crumbResp.text()).trim();
  if(!crumb) throw new Error('Yahoo : crumb vide');
  return {cookie, crumb};
}

// Champs bruts extraits des modules quoteSummary utilisés pour les fondamentaux
// réels (Comparateur, Scénarios, Dividendes, fiche action) — chaque valeur est
// un nombre réel ou null (jamais un repli inventé côté appelant).
const FUNDAMENTALS_RAW_FIELDS = {
  trailingPE: ['summaryDetail', 'trailingPE'],
  forwardPE: ['summaryDetail', 'forwardPE'],
  priceToSales: ['summaryDetail', 'priceToSalesTrailing12Months'],
  priceToBook: ['defaultKeyStatistics', 'priceToBook'],
  evToRevenue: ['defaultKeyStatistics', 'enterpriseToRevenue'],
  evToEbitda: ['defaultKeyStatistics', 'enterpriseToEbitda'],
  dividendYield: ['summaryDetail', 'dividendYield'],
  marketCap: ['summaryDetail', 'marketCap'],
  totalRevenue: ['financialData', 'totalRevenue'],
  revenueGrowth: ['financialData', 'revenueGrowth'],
  grossMargins: ['financialData', 'grossMargins'],
  operatingMargins: ['financialData', 'operatingMargins'],
  profitMargins: ['financialData', 'profitMargins'],
  returnOnEquity: ['financialData', 'returnOnEquity'],
  totalCash: ['financialData', 'totalCash'],
  totalDebt: ['financialData', 'totalDebt'],
  freeCashflow: ['financialData', 'freeCashflow'],
  trailingEps: ['defaultKeyStatistics', 'trailingEps'],
  sharesOutstanding: ['defaultKeyStatistics', 'sharesOutstanding'],
  // Cibles de cours et consensus RÉELS des analystes suivant le titre (pas une
  // estimation Likanza) — permettent des scénarios ancrés sur de vraies
  // prévisions professionnelles plutôt que sur des hypothèses libres de
  // l'utilisateur. recommendationMean : 1 = "achat fort" à 5 = "vente forte".
  targetLowPrice: ['financialData', 'targetLowPrice'],
  targetMeanPrice: ['financialData', 'targetMeanPrice'],
  targetMedianPrice: ['financialData', 'targetMedianPrice'],
  targetHighPrice: ['financialData', 'targetHighPrice'],
  recommendationMean: ['financialData', 'recommendationMean'],
  numberOfAnalystOpinions: ['financialData', 'numberOfAnalystOpinions'],
  // Dividend Intelligence : mêmes modules déjà interrogés (summaryDetail),
  // plus calendarEvents (nouveau) pour la prochaine date de paiement réelle —
  // aucun nouvel appel réseau, juste des champs supplémentaires du même appel.
  dividendRate: ['summaryDetail', 'dividendRate'],
  payoutRatio: ['summaryDetail', 'payoutRatio'],
  fiveYearAvgDividendYield: ['summaryDetail', 'fiveYearAvgDividendYield'],
  trailingAnnualDividendRate: ['summaryDetail', 'trailingAnnualDividendRate'],
  exDividendDate: ['summaryDetail', 'exDividendDate'],
  dividendDate: ['calendarEvents', 'dividendDate']
};
const RECOMMENDATION_KEY_LABELS = {
  strong_buy: 'Achat fort', buy: 'Achat', hold: 'Conserver', sell: 'Vente', strong_sell: 'Vente forte'
};

// Profil réel (description, secteur, industrie, effectif) + fondamentaux réels
// (marges, croissance, valorisation...) + cibles de cours et consensus réels
// des analystes, en un seul appel Yahoo quoteSummary — même mécanisme
// cookie+crumb que ci-dessus, un crumb peut être partagé entre plusieurs
// appels (voir api/company-profile.js, mode batch) pour limiter le nombre de
// requêtes contre cet endpoint non documenté et fragile.
async function fetchCompanyProfile(symbol, crumbCtx){
  const {cookie, crumb} = crumbCtx || await getYahooCrumb();
  const modules = 'assetProfile,summaryDetail,financialData,defaultKeyStatistics,recommendationTrend,calendarEvents';
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
  const resp = await fetch(url, {headers: {...FETCH_HEADERS, Cookie: cookie}});
  if(!resp.ok) throw new Error(`Yahoo profil ${symbol} : HTTP ${resp.status}`);
  const json = await resp.json();
  const result = json.quoteSummary && json.quoteSummary.result && json.quoteSummary.result[0];
  const profile = result && result.assetProfile;
  if(!profile || !profile.longBusinessSummary) throw new Error(`Yahoo profil ${symbol} : réponse sans résultat`);

  const fields = {};
  Object.entries(FUNDAMENTALS_RAW_FIELDS).forEach(([key, [moduleName, rawKey]]) => {
    const mod = result && result[moduleName];
    const raw = mod && mod[rawKey];
    fields[key] = (raw && typeof raw.raw === 'number') ? raw.raw : null;
  });

  const financialData = result && result.financialData;
  const recommendationKey = financialData && typeof financialData.recommendationKey === 'string' ? financialData.recommendationKey : null;
  const trend = result && result.recommendationTrend && Array.isArray(result.recommendationTrend.trend) ? result.recommendationTrend.trend[0] : null;
  const recommendationBreakdown = trend ? {
    strongBuy: trend.strongBuy || 0, buy: trend.buy || 0, hold: trend.hold || 0, sell: trend.sell || 0, strongSell: trend.strongSell || 0
  } : null;

  return {
    sector: profile.sector || null,
    industry: profile.industry || null,
    website: profile.website || null,
    employees: typeof profile.fullTimeEmployees === 'number' ? profile.fullTimeEmployees : null,
    summary: profile.longBusinessSummary,
    fundamentals: {
      asOfDate: new Date().toISOString(), source: 'Yahoo Finance (quoteSummary)', fields,
      recommendationKey, recommendationLabel: recommendationKey ? (RECOMMENDATION_KEY_LABELS[recommendationKey] || recommendationKey) : null,
      recommendationBreakdown
    }
  };
}

module.exports = { fetchYahooQuote, searchYahooSymbols, fetchCompanyProfile, getYahooCrumb, FETCH_HEADERS };
