/* ============================================================
   LIKANZA ACADEMY — Éco (eco.html)
   Indicateurs de marché en direct (Yahoo Finance, via /api/custom-quotes,
   déjà utilisé ailleurs sur le site) et actualité économique réelle
   (synthèse hebdomadaire déjà générée à partir de vrais flux RSS,
   catégorie "Entreprises" — voir /api/weekly-news). Aucune donnée
   inventée : en cas d'échec, dégradation silencieuse avec un lien de
   repli, jamais un contenu fictif.
   ============================================================ */

const ECO_INDICATORS = [
  {symbol:'^FCHI', name:'CAC 40'},
  {symbol:'^GSPC', name:'S&P 500'},
  {symbol:'^IXIC', name:'Nasdaq Composite'},
  {symbol:'^DJI', name:'Dow Jones'},
  {symbol:'^STOXX50E', name:'Euro Stoxx 50'},
  {symbol:'GC=F', name:'Or (once, futures)'},
  {symbol:'BZ=F', name:'Pétrole Brent'}
];

async function renderEcoIndicators(){
  const el = document.getElementById('ecoIndicators');
  if(!el) return;
  el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des cours en direct…</p>`;
  try {
    const symbols = ECO_INDICATORS.map(i => i.symbol).join(',');
    const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbols) + '&range=5d');
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const payload = await resp.json();
    const bySymbol = {};
    (payload.quotes || []).forEach(q => { bySymbol[q.symbol] = q; });
    el.innerHTML = ECO_INDICATORS.map(ind => {
      const q = bySymbol[ind.symbol];
      if(!q) return `<div class="panel-row"><span>${ind.name}</span><span class="val mono" style="color:var(--text-dim);">n.d.</span></div>`;
      const sens = q.changePercent >= 0 ? 'up' : 'down';
      return `<div class="panel-row"><span>${ind.name}</span><span class="val ${sens} mono">${q.price.toFixed(2)} <span style="font-size:11px;">${q.changePercent>=0?'+':''}${q.changePercent.toFixed(2)}%</span></span></div>`;
    }).join('');
  } catch(err){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Cours en direct momentanément indisponibles.</p>`;
    console.info('Likanza Academy — indicateurs Éco indisponibles :', err.message);
  }
}

async function renderEcoNews(){
  const el = document.getElementById('ecoNewsCard');
  if(!el) return;
  el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement…</p>`;
  try {
    const resp = await fetch('/api/weekly-news');
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const payload = await resp.json();
    const article = (payload.articles || []).find(a => a.categorie === 'Entreprises');
    if(!article) throw new Error('Article "Entreprises" indisponible cette semaine');
    el.innerHTML = `
      <span class="smallcaps">${article.categorie}</span>
      <h3 style="margin:8px 0 10px;">${article.titre}</h3>
      <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;">${article.resume}</p>
      <a href="actualites.html" class="btn btn-sm btn-gold" style="margin-top:14px;">Lire toute l'actualité →</a>`;
  } catch(err){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Actualité économique momentanément indisponible. <a href="actualites.html" style="color:var(--gold-bright);">Voir toutes les actualités →</a></p>`;
    console.info('Likanza Academy — actualité Éco indisponible :', err.message);
  }
}

renderEcoIndicators();
renderEcoNews();
