/* ============================================================
   LIKANZA ACADEMY — Market Panic (jeu-market-panic.html)
   Jeu de décision sur un vrai krach historique (Yahoo Finance,
   /api/custom-quotes, jamais de données inventées — même principe
   que jeu-portefeuille.html/portfolio-game.js).

   Principe : le joueur choisit un support réel parmi 8 indices/matières
   premières suivis. Le moteur (computeCrashDecisionOutcome, scripts/data.js)
   repère le pire drawdown RÉELLEMENT survenu dans les 10 dernières années de
   cours mensuels de ce support. Le joueur découvre ce vrai épisode (sommet,
   creux, chute réelle en %) et doit décider, SANS connaître la suite réelle :
   tout vendre, rester investi, ou racheter au creux. Les 3 issues réelles ne
   sont révélées qu'après la décision — jamais avant, pour préserver la vraie
   incertitude d'une décision en plein krach.
   ============================================================ */

const MARKET_PANIC_LABELS = {
  URTH: 'Actions monde (MSCI World, ETF URTH)', '^GSPC': 'Actions US (S&P 500)', '^FCHI': 'Actions France (CAC 40)',
  '^STOXX50E': 'Actions Europe (Euro Stoxx 50)', QQQ: 'Actions technologie US (Nasdaq 100, ETF QQQ)',
  EEM: 'Actions émergents (MSCI Emerging Markets, ETF EEM)', 'GC=F': 'Or (cours au comptant, futures)', AGG: 'Obligations US (ETF AGG)'
};
const MARKET_PANIC_CAPITAL = 1000;
const MARKET_PANIC_EXTRA = 500;

function getMarketPanicHistory(){ return safeGetJSON('fzr-market-panic-history', []); }
function saveMarketPanicResult(entry){
  const history = getMarketPanicHistory();
  history.unshift(entry);
  safeSetJSON('fzr-market-panic-history', history.slice(0, 20));
}

let marketPanicFxCache = null;
async function fetchMarketPanicEurUsdRate(){
  if(marketPanicFxCache) return marketPanicFxCache;
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent('EURUSD=X') + '&range=10y&interval=1mo');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Taux de change EUR/USD indisponible');
  const map = {};
  q.history.forEach(h => { map[h.date.slice(0, 7)] = h.close; });
  marketPanicFxCache = map;
  return map;
}

async function fetchMarketPanicHistory(symbol){
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbol) + '&range=10y&interval=1mo');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 3) throw new Error('Historique indisponible');
  let points = q.history.map(h => ({period: h.date.slice(0, 7), close: h.close}));
  if(q.currency === 'USD'){
    const fx = await fetchMarketPanicEurUsdRate();
    points = points.filter(p => typeof fx[p.period] === 'number').map(p => ({period: p.period, close: p.close / fx[p.period]}));
    if(points.length < 3) throw new Error('Conversion EUR/USD insuffisante sur cette période');
  }
  return points;
}

function fmtPctMP(x){ return `${x >= 0 ? '+' : ''}${x.toFixed(1)}%`; }

function renderMarketPanicGame(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  let symbol = '^GSPC';
  let outcome = null;

  function renderSetup(){
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:14px;max-width:70ch;">Choisis un support réel. Le jeu retrouve le pire vrai krach qu'il a connu sur les 10 dernières années, et te place exactement à son plus bas — sans te montrer ce qui s'est passé après. À toi de décider : tout vendre, rester investi, ou racheter au creux.</p>
      <div class="field" style="max-width:360px;"><label for="${elId}-support">Support</label>
        <select id="${elId}-support">
          ${Object.entries(MARKET_PANIC_LABELS).map(([sym, label]) => `<option value="${sym}" ${sym === symbol ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-gold" id="${elId}-start" type="button" style="margin-top:16px;">Voir le vrai krach</button>
      <div id="${elId}-error" style="color:var(--bordeaux);font-size:12.5px;margin-top:8px;"></div>`;
    document.getElementById(`${elId}-support`).addEventListener('change', e => { symbol = e.target.value; });
    document.getElementById(`${elId}-start`).addEventListener('click', startEpisode);
  }

  async function startEpisode(){
    const startBtn = document.getElementById(`${elId}-start`);
    const errorEl = document.getElementById(`${elId}-error`);
    startBtn.disabled = true;
    startBtn.textContent = 'Chargement des données réelles…';
    errorEl.textContent = '';
    try {
      const points = await fetchMarketPanicHistory(symbol);
      const result = computeCrashDecisionOutcome(points, MARKET_PANIC_CAPITAL, MARKET_PANIC_EXTRA);
      if(!result){
        errorEl.textContent = `Aucun vrai krach notable trouvé sur ${MARKET_PANIC_LABELS[symbol]} ces 10 dernières années — choisis un autre support.`;
        startBtn.disabled = false;
        startBtn.textContent = 'Voir le vrai krach';
        return;
      }
      outcome = {symbol, result};
      renderDecision();
    } catch(err){
      errorEl.textContent = 'Données indisponibles pour le moment : ' + err.message;
      startBtn.disabled = false;
      startBtn.textContent = 'Voir le vrai krach';
    }
  }

  function renderDecision(){
    const {result} = outcome;
    const troughValue = MARKET_PANIC_CAPITAL * (result.troughClose / result.peakClose);
    el.innerHTML = `
      <div class="disclaimer-box">📊 Épisode réel sur ${MARKET_PANIC_LABELS[symbol]} : entre ${result.peakDate} et ${result.troughDate}, ce support a réellement chuté de ${result.drawdownPct.toFixed(1)}%.</div>
      <p style="font-size:13.5px;margin:14px 0;">Tu avais investi ${fmtEUR(MARKET_PANIC_CAPITAL)} juste avant le sommet du ${result.peakDate}. Aujourd'hui, au creux du ${result.troughDate}, ta position vaut <strong style="color:var(--bordeaux);">${fmtEUR(troughValue)}</strong>. Tu ne sais pas ce qui va se passer ensuite. Que fais-tu ?</p>
      <div style="display:flex;flex-direction:column;gap:10px;" id="${elId}-choices">
        <button class="btn btn-sm decision-btn" data-choice="vendu" type="button">Tout vendre — rester en cash jusqu'à aujourd'hui</button>
        <button class="btn btn-sm decision-btn" data-choice="garde" type="button">Ne rien faire — rester investi</button>
        <button class="btn btn-sm decision-btn" data-choice="achete" type="button">Racheter la baisse — investir ${fmtEUR(MARKET_PANIC_EXTRA)} de plus, maintenant</button>
      </div>`;
    el.querySelectorAll('.decision-btn').forEach(btn => {
      btn.addEventListener('click', () => renderReveal(btn.dataset.choice));
    });
  }

  function renderReveal(choice){
    const {result} = outcome;
    const o = result.outcomes;
    const rows = [
      {key: 'vendu', label: 'Tout vendre au creux'},
      {key: 'garde', label: 'Rester investi'},
      {key: 'achete', label: 'Racheter au creux'}
    ];
    const best = rows.reduce((a, b) => (o[b.key].finalValue > o[a.key].finalValue ? b : a));
    const chosenLabel = rows.find(r => r.key === choice).label;

    tryAwardQuizPoints(`market-panic-${symbol}-${result.troughDate}`, 15, {usedSimulator: true});
    recordAnswer('Gestion du risque', choice === best.key, true, 'intermediaire');
    saveMarketPanicResult({
      date: new Date().toISOString(), symbol, peakDate: result.peakDate, troughDate: result.troughDate,
      drawdownPct: result.drawdownPct, choice, outcomes: o
    });

    el.innerHTML = `
      <p style="font-size:13.5px;margin-bottom:14px;">Tu as choisi : <strong>${chosenLabel}</strong>. Voici ce qui s'est RÉELLEMENT passé sur ${MARKET_PANIC_LABELS[symbol]} entre le creux du ${result.troughDate} et le ${result.lastDate} (dernière donnée réelle disponible) :</p>
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:14px;">
        ${rows.map(r => `
          <div class="card" style="${r.key === choice ? 'border-color:var(--gold-bright);' : ''}">
            <span class="smallcaps">${r.label}${r.key === choice ? ' — ton choix' : ''}${r.key === best.key ? ' 🏆' : ''}</span>
            <div class="result-big" style="font-size:18px;margin-top:6px;">${fmtEUR(o[r.key].finalValue)}</div>
          </div>`).join('')}
      </div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">Ce support ${result.recovered ? `a fini par retrouver son niveau d'avant-krach (${result.recoveryMonths} mois après le sommet)` : "n'a pas encore retrouvé son niveau d'avant-krach sur la période réelle disponible"}. Rester investi, c'est accepter de traverser des baisses réelles comme celle-ci sans savoir à l'avance combien de temps la reprise prendra — ni même si elle aura lieu dans le délai que tu peux te permettre.</p>
      <p class="disclaimer-box">Un seul épisode réel ne prouve rien de façon générale : un autre support, une autre période, auraient donné un résultat différent. Les performances passées ne préjugent jamais des performances futures.</p>
      <button class="btn btn-sm btn-gold" id="${elId}-restart" style="margin-top:10px;">Rejouer avec un autre support</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-restart`).addEventListener('click', renderSetup);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'stockMarket'});
  }

  renderSetup();
}
