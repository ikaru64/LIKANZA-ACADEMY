/* ============================================================
   LIKANZA ACADEMY — Helper partagé : cotations Yahoo Finance
   Utilisé par api/quotes.js (indices/matières premières) et
   api/stock-quotes.js (actions). Placé hors de api/ pour ne pas
   devenir une route Vercel.
   ============================================================ */

const FETCH_HEADERS = {'User-Agent':'Mozilla/5.0 (compatible; LikanzaAcademy/1.0)'};

async function fetchYahooQuote(entry){
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(entry.yahoo)}?interval=1d&range=5d`;
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

module.exports = { fetchYahooQuote, searchYahooSymbols, FETCH_HEADERS };
