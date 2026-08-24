/* ============================================================
   LIKANZA ACADEMY — Page Marché (marche.html)
   Fiche détaillée d'une valeur du bandeau : cotation, historique
   des dernières séances, repères pédagogiques (MARKET_INFO).
   Le symbole affiché est lu dans le hash de l'URL (ex. marche.html#%5EFCHI) ;
   la fiche se re-rend quand les cotations réelles arrivent
   (événement fzr:quotes-updated émis par data.js).
   ============================================================ */

const MARCHE_TYPE_LABELS = {index:'Indice boursier', crypto:'Cryptomonnaie', commodity:'Matière première', stock:'Action', etf:'ETF', forex:'Paire de devises', rate:'Taux'};

function marcheCurrentSymbol(){
  let sym = '';
  try{ sym = decodeURIComponent(location.hash.slice(1)); }catch(e){ sym = location.hash.slice(1); }
  return MARKET_DATA.some(m=>m.symbol===sym) ? sym : MARKET_DATA[0].symbol;
}

// Sparkline factorisée dans scripts/data.js (renderSparklineHTML), réutilisée
// aussi par les lignes hausses/baisses de la page Bourse.
function renderMarcheChart(it){
  return renderSparklineHTML(it.history, {unite: it.unite, source: it.source});
}

function renderMarcheSiblings(current){
  const el = document.getElementById('marketSiblings');
  if(!el) return;
  const currentItem = MARKET_DATA.find(m=>m.symbol===current);
  // Filtré par assetType : depuis l'ajout d'ETF/Forex/Taux/matières premières
  // supplémentaires (onglet Marchés de Bourse), lister TOUT MARKET_DATA ici
  // mélangerait des dizaines de valeurs sans rapport (ex. une paire Forex à
  // côté d'un indice) — on ne veut voir que les valeurs de la même catégorie.
  const siblings = currentItem
    ? MARKET_DATA.filter(m=>m.assetType===currentItem.assetType && m.symbol!==current)
    : [];
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

// ---------- Fondamentaux réels d'un ETF (frais, holdings, secteurs, encours) ----------
// Chargé à la demande, uniquement quand assetType==='etf' (jamais pour les
// autres classes). Chaque champ vaut null si absent chez Yahoo (fréquent pour
// les ETF UCITS domiciliés en Europe, voir api/etf-profile.js) : affiché
// indépendamment comme "Donnée indisponible", jamais un bloc tout-ou-rien.
function renderEtfFieldRow(label, value){
  return `<div class="result-row"><span>${label}</span><span class="mono">${value !== null && value !== undefined ? value : '<span style="color:var(--text-dim);">Donnée indisponible</span>'}</span></div>`;
}
// Un seul appel /api/etf-profile par symbole par chargement de page : la
// fiche se re-rend à chaque événement fzr:quotes-updated (nouvelle cotation
// de prix, sans rapport avec les fondamentaux du fonds), pas la peine de
// re-fetcher le profil du fonds à chaque fois.
const etfProfileCache = {};
function renderEtfFundamentals(elId, symbol){
  const el = document.getElementById(elId);
  if(!el) return;
  if(etfProfileCache[symbol]){
    renderEtfFundamentalsHtml(el, symbol, etfProfileCache[symbol]);
    return;
  }
  el.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Chargement des fondamentaux du fonds…</p>`;
  fetch('/api/etf-profile?symbol=' + encodeURIComponent(symbol))
    .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(f => {
      etfProfileCache[symbol] = f;
      renderEtfFundamentalsHtml(el, symbol, f);
    })
    .catch(err => {
      el.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Fondamentaux du fonds indisponibles pour le moment (${err.message}).</p>`;
    });
}
function renderEtfFundamentalsHtml(el, symbol, f){
      const pct = v => typeof v === 'number' ? (v * 100).toFixed(2) + ' %' : null;
      const eur = v => typeof v === 'number' ? v.toLocaleString('fr-FR', {maximumFractionDigits:0}) : null;
      el.innerHTML = `
        ${renderDataBadge('fait')}
        <div style="margin-top:10px;">
          ${renderEtfFieldRow('Émetteur / gérant', f.family)}
          ${renderEtfFieldRow('Catégorie', f.categoryName)}
          ${renderEtfFieldRow('Frais courants (TER)', pct(f.expenseRatio))}
          ${renderEtfFieldRow('Actifs sous gestion', eur(f.totalAssets))}
          ${renderEtfFieldRow('Rendement (yield)', pct(f.yield))}
        </div>
        ${f.sectorWeightings && f.sectorWeightings.length ? `
        <h4 style="margin-top:16px;font-size:13.5px;">Exposition sectorielle</h4>
        <div style="margin-top:8px;">${f.sectorWeightings
          .slice().sort((a,b)=>b.weight-a.weight).slice(0,6)
          .map(s => renderEtfFieldRow(s.sector, pct(s.weight))).join('')}</div>` : ''}
        ${f.holdings && f.holdings.length ? `
        <h4 style="margin-top:16px;font-size:13.5px;">Principales positions</h4>
        <div style="margin-top:8px;">${f.holdings.slice(0,10)
          .map(h => renderEtfFieldRow(`${h.name} (${h.symbol})`, pct(h.weight))).join('')}</div>` : `
        <p style="font-size:12.5px;color:var(--text-dim);margin-top:14px;">Composition détaillée (principales positions) indisponible pour ce fonds via notre source de données — fréquent pour les ETF domiciliés hors des États-Unis.</p>`}
        ${renderMethodologyPanel({
          donnees: `Source : Yahoo Finance (profil du fonds), symbole ${symbol}.`,
          limites: "La disponibilité des données diffère selon le domicile du fonds : les ETF domiciliés aux États-Unis exposent en général l'ensemble de ces champs, les ETF UCITS domiciliés en Europe souvent seulement les frais et l'exposition sectorielle.",
          comprendre: "Réplication physique : l'ETF détient réellement les titres de l'indice. Réplication synthétique : l'ETF utilise un contrat d'échange (swap) pour reproduire la performance, sans détenir les titres. Capitalisant : les dividendes sont réinvestis automatiquement. Distribuant : les dividendes sont versés régulièrement."
        })}`;
}

function renderMarcheDetail(){
  const sym = marcheCurrentSymbol();
  const it = MARKET_DATA.find(m=>m.symbol===sym);
  const el = document.getElementById('marketDetail');
  if(!el || !it) return;

  if(it.statut === 'chargement') loadMarketCategoryQuotes([it.symbol]);

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
  const loading = it.statut === 'chargement';
  const valueHtml = unavailable
    ? `<span class="result-big" style="color:var(--text-dim);">n.d.</span>`
    : loading
      ? `<span class="result-big" style="color:var(--text-dim);">…</span>`
      : `<span class="result-big">${it.valeur}${it.unite ? ' ' + it.unite : ''}</span><span class="${it.sens} mono" style="font-size:18px;">${it.variation}</span>`;
  const majLine = it.maj !== '—'
    ? `Source : ${it.source} · Mis à jour : ${it.maj}${it.heure !== '—' ? ' à ' + it.heure : ''}`
    : `Source : ${it.source}`;

  el.innerHTML = `
    <div class="card-grid">
      <div class="card">
        <span class="smallcaps">${MARCHE_TYPE_LABELS[it.assetType] || 'Marché'}${it.categorie ? ' · ' + it.categorie : ''}</span>
        <h3 style="margin-top:6px;">${it.nom} <span class="mono" style="font-size:13px;color:var(--text-dim);">${it.symbol}</span></h3>
        ${it.emetteur ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:2px;">${it.emetteur}${it.indiceSuivi ? ' · réplique ' + it.indiceSuivi : ''}</p>` : ''}
        <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:12px 0;">${valueHtml}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
          <span class="badge status-${it.statut}">${it.statusLabel}</span>
          ${openBadge}
        </div>
        <p style="font-size:12px;color:var(--text-dim);">${majLine}</p>
        ${unavailable ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Valeur indisponible tant que les cotations automatiques ne sont pas connectées.</p>` : ''}
        ${loading ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:8px;">Chargement de la cotation en cours…</p>` : ''}
        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="fav-btn" data-fav-id="market-${it.symbol}" data-fav-title="${it.nom}" data-fav-url="marche.html#${encodeURIComponent(it.symbol)}" data-fav-type="Marché">${ICONS.star} Favoris</button>
          <button class="btn btn-sm" id="marcheFollowBtn"></button>
        </div>
      </div>
      <div class="card">
        <h3>Dernières séances</h3>
        ${renderMarcheChart(it)}
      </div>
    </div>
    ${it.assetType === 'etf' ? `<div class="card" style="margin-top:18px;" id="etfFundamentals-${it.symbol}">
      <h3>Fondamentaux du fonds</h3>
    </div>` : ''}
    ${info ? `<div class="card" style="margin-top:18px;">
      <h3>Comprendre : ${it.nom}</h3>
      <p style="color:var(--text-dim);font-size:14px;margin:10px 0;">${info.resume}</p>
      <p style="font-size:13.5px;"><strong>À retenir :</strong> ${info.aRetenir}</p>
      <a href="${info.lien}" class="btn btn-sm" style="margin-top:14px;">${info.lienLabel}</a>
    </div>` : ''}
    <p class="disclaimer-box">Ces informations sont fournies à titre pédagogique, en différé. Elles ne constituent ni un conseil en investissement, ni une incitation à acheter ou vendre.</p>`;

  initFavButtons();
  renderMarcheSiblings(sym);
  if(it.assetType === 'etf') renderEtfFundamentals('etfFundamentals-' + it.symbol, it.symbol);
  renderMarcheFollowBtn(it);
}

// ---------- Bouton "Suivre" (Phase 2 de la refonte Bourse) : ajoute cet
// actif de marché à la même liste que les actions suivies (getFollowedStocks),
// pour qu'il apparaisse dans Fiches actions/Screener/Comparateur sur
// bourse.html. Distinct du bouton "Favoris" ci-dessus (qui ne fait que
// mémoriser un lien de navigation rapide, sans lien avec ces outils). ----------
function renderMarcheFollowBtn(it){
  const btn = document.getElementById('marcheFollowBtn');
  if(!btn) return;
  function update(){
    const followed = getFollowedStocks().some(s => s.symbol === it.symbol);
    btn.textContent = followed ? '✓ Suivi (retirer)' : '+ Suivre';
    btn.classList.toggle('active', followed);
  }
  update();
  btn.onclick = () => {
    const followed = getFollowedStocks().some(s => s.symbol === it.symbol);
    if(followed) removeFollowedStock(it.symbol);
    else addFollowedStock({symbol: it.symbol, name: it.nom, assetType: it.assetType});
    update();
  };
}

safeRun('fiche marché', renderMarcheDetail);
window.addEventListener('hashchange', ()=>safeRun('fiche marché (navigation)', renderMarcheDetail));
document.addEventListener('fzr:quotes-updated', ()=>safeRun('fiche marché (cotations)', renderMarcheDetail));
