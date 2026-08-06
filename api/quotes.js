/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/quotes
   Rôle : backend de données de marché du bandeau (ticker).
   Conformément à ARCHITECTURE.md, le navigateur n'appelle jamais
   un fournisseur directement : il passe par cette fonction, dont
   la réponse est mise en cache par le CDN Vercel (s-maxage) pour
   respecter les quotas des fournisseurs.

   Fournisseurs :
   - Yahoo Finance (endpoint public non contractuel) : indices et
     matières premières, données différées — statut DELAYED.
   - CoinGecko (offre gratuite, attribution requise) : Bitcoin et
     Ethereum, variation sur 24 h — statut DELAYED.

   Réponse : { updatedAt, quotes: [schéma normalisé ARCHITECTURE.md] }
   ============================================================ */

// Le champ "symbol" renvoyé est celui utilisé par MARKET_DATA côté site,
// pas forcément celui du fournisseur (ex. XAU ↔ GC=F chez Yahoo).
const YAHOO_QUOTES = [
  {symbol:'^FCHI',     yahoo:'^FCHI',     name:'CAC 40',           assetType:'index'},
  {symbol:'^GSPC',     yahoo:'^GSPC',     name:'S&P 500',          assetType:'index'},
  {symbol:'^IXIC',     yahoo:'^IXIC',     name:'Nasdaq Composite', assetType:'index'},
  {symbol:'^DJI',      yahoo:'^DJI',      name:'Dow Jones',        assetType:'index'},
  {symbol:'^STOXX50E', yahoo:'^STOXX50E', name:'Euro Stoxx 50',    assetType:'index'},
  {symbol:'XAU',       yahoo:'GC=F',      name:'Or (once)',        assetType:'commodity'},
  {symbol:'BRENT',     yahoo:'BZ=F',      name:'Pétrole Brent',    assetType:'commodity'}
];

const COINGECKO_QUOTES = [
  {symbol:'BTC-USD', id:'bitcoin',  name:'Bitcoin'},
  {symbol:'ETH-USD', id:'ethereum', name:'Ethereum'}
];

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

// Historique quotidien sur 7 jours (facultatif : une panne ici ne bloque pas la cotation).
async function fetchCoinGeckoHistory(id){
  try{
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`;
    const resp = await fetch(url, {headers: FETCH_HEADERS});
    if(!resp.ok) return [];
    const json = await resp.json();
    return (json.prices || [])
      .filter(p => Array.isArray(p) && typeof p[1] === 'number')
      .map(p => ({date: new Date(p[0]).toISOString(), close: p[1]}));
  }catch(err){
    return [];
  }
}

async function fetchCoinGeckoQuotes(){
  const ids = COINGECKO_QUOTES.map(c => c.id).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`;
  const resp = await fetch(url, {headers: FETCH_HEADERS});
  if(!resp.ok) throw new Error(`CoinGecko : HTTP ${resp.status}`);
  const json = await resp.json();
  const histories = await Promise.all(COINGECKO_QUOTES.map(entry => fetchCoinGeckoHistory(entry.id)));
  return COINGECKO_QUOTES.map((entry, i) => {
    const data = json[entry.id];
    if(!data || typeof data.usd !== 'number') return null;
    const changePercent = typeof data.usd_24h_change === 'number' ? data.usd_24h_change : null;
    return {
      symbol: entry.symbol,
      name: entry.name,
      assetType: 'crypto',
      price: data.usd,
      currency: 'USD',
      change: changePercent === null ? null : data.usd * changePercent / (100 + changePercent),
      changePercent,
      timestamp: data.last_updated_at ? new Date(data.last_updated_at * 1000).toISOString() : null,
      source: 'CoinGecko',
      status: 'DELAYED',
      delayMinutes: 5,
      history: histories[i]
    };
  }).filter(Boolean);
}

module.exports = async (req, res) => {
  const tasks = [
    ...YAHOO_QUOTES.map(entry => fetchYahooQuote(entry)),
    fetchCoinGeckoQuotes()
  ];
  const settled = await Promise.allSettled(tasks);
  const quotes = [];
  const errors = [];
  settled.forEach(r => {
    if(r.status === 'fulfilled') quotes.push(...[].concat(r.value));
    else errors.push(r.reason && r.reason.message ? r.reason.message : String(r.reason));
  });

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if(quotes.length === 0){
    // Pas de cache CDN sur une panne totale : on veut réessayer vite.
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({updatedAt: new Date().toISOString(), quotes: [], errors});
    return;
  }
  // 5 min de cache CDN + 15 min de service en différé pendant la revalidation :
  // les quotas fournisseurs sont respectés quel que soit le trafic.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  res.status(200).json({updatedAt: new Date().toISOString(), quotes, errors});
};
