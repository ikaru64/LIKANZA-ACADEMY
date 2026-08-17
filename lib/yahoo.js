/* ============================================================
   LIKANZA ACADEMY — Helper partagé : cotations Yahoo Finance
   Utilisé par api/quotes.js (indices/matières premières) et
   api/stock-quotes.js (actions). Placé hors de api/ pour ne pas
   devenir une route Vercel.
   ============================================================ */

const FETCH_HEADERS = {'User-Agent':'Mozilla/5.0 (compatible; LikanzaAcademy/1.0)'};

async function fetchYahooQuote(entry, opts){
  const range = (opts && opts.range) || '5d';
  const interval = (opts && opts.interval) || '1d';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(entry.yahoo)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
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
    history: sessions
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

async function fetchCompanyProfile(symbol){
  const {cookie, crumb} = await getYahooCrumb();
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile&crumb=${encodeURIComponent(crumb)}`;
  const resp = await fetch(url, {headers: {...FETCH_HEADERS, Cookie: cookie}});
  if(!resp.ok) throw new Error(`Yahoo profil ${symbol} : HTTP ${resp.status}`);
  const json = await resp.json();
  const profile = json.quoteSummary && json.quoteSummary.result && json.quoteSummary.result[0] && json.quoteSummary.result[0].assetProfile;
  if(!profile || !profile.longBusinessSummary) throw new Error(`Yahoo profil ${symbol} : réponse sans résultat`);
  return {
    sector: profile.sector || null,
    industry: profile.industry || null,
    website: profile.website || null,
    employees: typeof profile.fullTimeEmployees === 'number' ? profile.fullTimeEmployees : null,
    summary: profile.longBusinessSummary
  };
}

module.exports = { fetchYahooQuote, searchYahooSymbols, fetchCompanyProfile, FETCH_HEADERS };
