/* ============================================================
   LIKANZA ACADEMY — Éco (eco.html)
   Indicateurs de marché en direct (Yahoo Finance via /api/custom-quotes)
   + taux de dépôt BCE en direct (via /api/eco-rate, voir lib/ecb.js),
   actualité économique réelle restructurée (synthèse hebdomadaire déjà
   générée depuis de vrais flux RSS, champs pourquoi/impact déjà réels
   mais jusqu'ici inexploités), et plusieurs widgets qui réutilisent la
   vraie progression déjà existante (renderEcoResume/renderEcoNiveau/
   renderEcoQuestionDuJour/renderConceptLevels/renderEcoCategories, tous
   dans scripts/data.js). Aucune donnée inventée : en cas d'échec,
   dégradation silencieuse avec un message clair, jamais un contenu
   fictif.
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
    el.innerHTML = `<span class="smallcaps">Marchés</span>` + ECO_INDICATORS.map(ind => {
      const q = bySymbol[ind.symbol];
      if(!q) return `<div class="panel-row"><span>${ind.name}</span><span class="val mono" style="color:var(--text-dim);">Donnée temporairement indisponible</span></div>`;
      const sens = q.changePercent >= 0 ? 'up' : 'down';
      return `<div class="panel-row"><span>${ind.name}</span><span class="val ${sens} mono">${q.price.toFixed(2)} <span style="font-size:11px;">${q.changePercent>=0?'+':''}${q.changePercent.toFixed(2)}%</span></span></div>`;
    }).join('');
  } catch(err){
    el.innerHTML = `<span class="smallcaps">Marchés</span><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Donnée temporairement indisponible.</p>`;
    console.info('Likanza Academy — indicateurs Éco indisponibles :', err.message);
  }
}

async function renderEcoRate(){
  const el = document.getElementById('ecoRateCard');
  if(!el) return;
  el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement…</p>`;
  try {
    const resp = await fetch('/api/eco-rate');
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    el.innerHTML = `
      <span class="smallcaps">Taux de dépôt BCE</span>
      <div class="eco-rate-value">${data.rate.toFixed(2)} %</div>
      <p style="font-size:11px;color:var(--text-dim);margin-top:4px;">${data.source} · au ${new Date(data.asOf).toLocaleDateString('fr-FR')}</p>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;line-height:1.5;">C'est l'un des taux directeurs de la BCE : il influence, entre autres, le coût du crédit dans la zone euro. Historiquement, une hausse peut peser sur le crédit et l'immobilier, une baisse peut au contraire les soutenir — jamais de façon automatique ni garantie.</p>
      <div class="eco-tags">
        <span class="eco-tag">Épargne</span><span class="eco-tag">Crédit</span><span class="eco-tag">Immobilier</span><span class="eco-tag">Actions</span><span class="eco-tag">Pouvoir d'achat</span>
      </div>`;
  } catch(err){
    el.innerHTML = `<span class="smallcaps">Taux de dépôt BCE</span><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Donnée temporairement indisponible.</p>`;
    console.info('Likanza Academy — taux BCE indisponible :', err.message);
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
    const impactHtml = Array.isArray(article.impact) && article.impact.length
      ? `<div class="eco-tags">${article.impact.map(i=>`<span class="eco-tag">${i}</span>`).join('')}</div>` : '';
    el.innerHTML = `
      <span class="smallcaps">${article.categorie}</span>
      <h3 style="margin:8px 0 10px;">${article.titre}</h3>
      <span class="eco-news-label">Ce qui s'est passé</span>
      <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;">${article.resume}</p>
      ${article.pourquoi ? `<span class="eco-news-label">Pourquoi</span><p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;">${article.pourquoi}</p>` : ''}
      ${impactHtml ? `<span class="eco-news-label">Pourquoi ça compte</span>${impactHtml}` : ''}
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="actualites.html" class="btn btn-sm">Lire toute l'actualité →</a>
        <a href="cours.html#entreprise-essentiels" class="btn btn-sm btn-gold">Concept associé : l'entreprise →</a>
      </div>`;
  } catch(err){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Donnée temporairement indisponible. <a href="actualites.html" style="color:var(--gold-bright);">Voir toutes les actualités →</a></p>`;
    console.info('Likanza Academy — actualité Éco indisponible :', err.message);
  }
}

renderEcoResume('ecoResume');
renderEcoIndicators();
renderEcoRate();
renderEcoNews();
renderConceptLevels('ecoLevelPib', 'PIB (Produit intérieur brut)');
renderConceptLevels('ecoLevelTaux', "Taux d'intérêt directeur");
renderEcoQuestionDuJour('ecoQuestion');
renderEcoNiveau('ecoNiveau');
renderEcoCategories('ecoCategories');
