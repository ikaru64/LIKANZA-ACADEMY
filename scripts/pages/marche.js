/* ============================================================
   LIKANZA ACADEMY — Page Marché (marche.html)
   Fiche détaillée d'une valeur du bandeau : cotation, historique
   des dernières séances, repères pédagogiques (MARKET_INFO).
   Le symbole affiché est lu dans le hash de l'URL (ex. marche.html#%5EFCHI) ;
   la fiche se re-rend quand les cotations réelles arrivent
   (événement fzr:quotes-updated émis par data.js).
   ============================================================ */

const MARCHE_TYPE_LABELS = {index:'Indice boursier', crypto:'Cryptomonnaie', commodity:'Matière première', stock:'Action'};

function marcheCurrentSymbol(){
  let sym = '';
  try{ sym = decodeURIComponent(location.hash.slice(1)); }catch(e){ sym = location.hash.slice(1); }
  return MARKET_DATA.some(m=>m.symbol===sym) ? sym : MARKET_DATA[0].symbol;
}

function marcheFmtDate(iso){
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'});
}

function marcheFmtClose(n){
  return n.toLocaleString('fr-FR', n >= 1000 ? {maximumFractionDigits:0} : {minimumFractionDigits:2, maximumFractionDigits:2});
}

function renderMarcheChart(it){
  if(!Array.isArray(it.history) || it.history.length < 2){
    return `<p style="font-size:12.5px;color:var(--text-dim);">L'historique des dernières séances s'affiche dès que les cotations automatiques sont disponibles (connexion au backend requise).</p>`;
  }
  const closes = it.history.map(h=>h.close);
  const min = Math.min(...closes), max = Math.max(...closes);
  const spread = (max - min) || 1;
  const bars = it.history.map(h=>{
    const pct = 12 + Math.round(((h.close - min) / spread) * 88);
    return `<div class="bar" style="height:${pct}%;" title="${marcheFmtDate(h.date)} : ${marcheFmtClose(h.close)}${it.unite ? ' ' + it.unite : ''}"></div>`;
  }).join('');
  const labels = it.history.map(h=>`<span>${marcheFmtDate(h.date)}</span>`).join('');
  return `<div class="bar-chart">${bars}</div><div class="bar-labels">${labels}</div>
    <p style="font-size:11px;color:var(--text-dim);margin-top:10px;">Clôtures des dernières séances (source : ${it.source}). Échelle resserrée entre ${marcheFmtClose(min)} et ${marcheFmtClose(max)} pour rendre les variations lisibles.</p>`;
}

function renderMarcheSiblings(current){
  const el = document.getElementById('marketSiblings');
  if(!el) return;
  const siblings = MARKET_DATA.filter(m=>m.symbol!==current);
  el.innerHTML = siblings.map(m=>{
    const val = m.valeur !== '—' ? `${m.valeur}${m.unite ? ' ' + m.unite : ''}` : 'n.d.';
    const varia = m.sens === 'na' ? '' : `<span class="${m.sens}">${m.variation}</span>`;
    return `<a class="card market-mini" href="marche.html#${encodeURIComponent(m.symbol)}">
      <span class="smallcaps">${m.nom}</span>
      <div class="mono" style="display:flex;justify-content:space-between;gap:10px;margin-top:8px;font-size:13px;"><span>${val}</span>${varia}</div>
    </a>`;
  }).join('');
  const count = document.getElementById('siblingsCount');
  if(count) count.textContent = `${siblings.length} valeurs suivies`;
}

function renderMarcheDetail(){
  const sym = marcheCurrentSymbol();
  const it = MARKET_DATA.find(m=>m.symbol===sym);
  const el = document.getElementById('marketDetail');
  if(!el || !it) return;

  document.title = `${it.nom} · Marché · Likanza Academy`;
  const crumb = document.getElementById('crumbName');
  if(crumb) crumb.textContent = it.nom;
  const title = document.getElementById('marcheTitle');
  if(title) title.textContent = it.nom;

  const info = MARKET_INFO[sym];
  const marketInfo = it.exchange ? getMarketStatus(it.exchange)
    : (it.assetType === 'crypto' ? {isOpen:true, label:'Marché crypto, ouvert en continu', localTime:null} : null);
  const openBadge = marketInfo ? `<span class="badge ${marketInfo.isOpen ? 'status-reel' : 'status-demo'}" title="${marketInfo.label}">${marketInfo.isOpen ? 'Ouvert' : 'Fermé'}</span>` : '';
  const unavailable = it.statut === 'indisponible';
  const valueHtml = unavailable
    ? `<span class="result-big" style="color:var(--text-dim);">n.d.</span>`
    : `<span class="result-big">${it.valeur}${it.unite ? ' ' + it.unite : ''}</span><span class="${it.sens} mono" style="font-size:18px;">${it.variation}</span>`;
  const majLine = it.maj !== '—'
    ? `Source : ${it.source} · Mis à jour : ${it.maj}${it.heure !== '—' ? ' à ' + it.heure : ''}`
    : `Source : ${it.source}`;

  el.innerHTML = `
    <div class="card-grid" style="grid-template-columns:1fr 1fr;">
      <div class="card">
        <span class="smallcaps">${MARCHE_TYPE_LABELS[it.assetType] || 'Marché'}</span>
        <h3 style="margin-top:6px;">${it.nom} <span class="mono" style="font-size:13px;color:var(--text-dim);">${it.symbol}</span></h3>
        <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:12px 0;">${valueHtml}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
          <span class="badge status-${it.statut}">${it.statusLabel}</span>
          ${openBadge}
        </div>
        <p style="font-size:12px;color:var(--text-dim);">${majLine}</p>
        ${unavailable ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Valeur indisponible tant que les cotations automatiques ne sont pas connectées.</p>` : ''}
        <div style="margin-top:16px;">
          <button class="fav-btn" data-fav-id="market-${it.symbol}" data-fav-title="${it.nom}" data-fav-url="marche.html#${encodeURIComponent(it.symbol)}" data-fav-type="Marché">★ Favoris</button>
        </div>
      </div>
      <div class="card">
        <h3>Dernières séances</h3>
        ${renderMarcheChart(it)}
      </div>
    </div>
    ${info ? `<div class="card" style="margin-top:18px;">
      <h3>Comprendre : ${it.nom}</h3>
      <p style="color:var(--text-dim);font-size:14px;margin:10px 0;">${info.resume}</p>
      <p style="font-size:13.5px;"><strong>À retenir :</strong> ${info.aRetenir}</p>
      <a href="${info.lien}" class="btn btn-sm" style="margin-top:14px;">${info.lienLabel}</a>
    </div>` : ''}
    <p class="disclaimer-box">Ces informations sont fournies à titre pédagogique, en différé. Elles ne constituent ni un conseil en investissement, ni une incitation à acheter ou vendre.</p>`;

  initFavButtons();
  renderMarcheSiblings(sym);
}

safeRun('fiche marché', renderMarcheDetail);
window.addEventListener('hashchange', ()=>safeRun('fiche marché (navigation)', renderMarcheDetail));
document.addEventListener('fzr:quotes-updated', ()=>safeRun('fiche marché (cotations)', renderMarcheDetail));
