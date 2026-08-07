const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
function refreshProgressCard(){
  const level = getLevel();
  document.getElementById('profLevel').textContent = LEVEL_LABELS[level] || 'Débutant';
  const progress = safeGetJSON('fzr-progress', {});
  const mods = COURSES[level] || COURSES.debutant;
  const done = mods.filter((c,i)=>progress[level+'-'+i]).length;
  document.getElementById('profProgress').innerHTML = `<div class="result-big" style="font-size:26px;">${done} / ${mods.length}</div><p style="font-size:12.5px;color:var(--text-dim);">missions accomplies au niveau ${LEVEL_LABELS[level]}</p>`;
  const select = document.getElementById('manualLevelSelect');
  if(select) select.value = level;
}
refreshProgressCard();
const manualLevelSelect = document.getElementById('manualLevelSelect');
if(manualLevelSelect) manualLevelSelect.addEventListener('change', ()=>{
  setLevelStorage(manualLevelSelect.value);
  refreshProgressCard();
});
renderProfileWidget('profileWidget');

// ================= Watchlist =================
safeRun('bannière démo watchlist', ()=>renderDemoBanner('watchlistDemoBanner'));

const WATCHLIST_ASSETS = [
  ...MARKET_DATA.filter(m=>m.statut!=='indisponible').map(m=>({symbol:m.symbol, nom:m.nom, type:m.assetType})),
  ...STOCKS_DEMO.map(s=>({symbol:s.ticker, nom:s.nom, type:'stock'}))
];
const wlAssetSelect = document.getElementById('wlAsset');
if(wlAssetSelect) wlAssetSelect.innerHTML = WATCHLIST_ASSETS.map(a=>`<option value="${a.symbol}">${a.nom} (${a.symbol})</option>`).join('');

function currentValueFor(symbol){
  const m = MARKET_DATA.find(x=>x.symbol===symbol);
  if(m) return parseNumericValue(m.valeur);
  const s = STOCKS_DEMO.find(x=>x.ticker===symbol);
  if(s) return s.prix;
  return null;
}
function renderWatchlist(){
  const list = getWatchlist();
  const grid = document.getElementById('watchlistGrid');
  const empty = document.getElementById('watchlistEmpty');
  if(!grid || !empty) return;
  if(list.length === 0){
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  grid.style.display = 'grid';
  empty.style.display = 'none';
  grid.innerHTML = list.map(item=>{
    const value = currentValueFor(item.symbol);
    const crossed = item.threshold && value !== null && (
      (item.direction === 'above' && value >= item.threshold) ||
      (item.direction === 'below' && value <= item.threshold)
    );
    return `
    <div class="card">
      <span class="smallcaps">${item.type}</span>
      <h3 style="font-size:19px;">${item.nom} <span class="mono" style="font-size:12px;color:var(--text-dim);">${item.symbol}</span></h3>
      <p>Valeur actuelle (démo) : <strong>${value !== null ? value : 'non disponible'}</strong>${item.threshold ? ` · seuil : ${item.threshold}` : ''}</p>
      ${item.note ? `<p style="font-size:12.5px;color:var(--text-dim);">${item.note}</p>` : ''}
      ${crossed ? `<p style="font-size:12.5px;color:var(--gold-bright);">⚠ Seuil franchi (donnée de démonstration, pas une alerte réelle en direct)</p>` : ''}
      <div class="card-footer"><span>Ajouté le ${item.date}</span><button class="del-btn" data-symbol="${item.symbol}">Retirer</button></div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.del-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      saveWatchlist(getWatchlist().filter(x=>x.symbol!==btn.dataset.symbol));
      renderWatchlist();
    });
  });
}
const wlAddBtn = document.getElementById('wlAddBtn');
if(wlAddBtn) wlAddBtn.addEventListener('click', ()=>{
  const symbol = wlAssetSelect.value;
  const asset = WATCHLIST_ASSETS.find(a=>a.symbol===symbol);
  if(!asset) return;
  const thresholdRaw = document.getElementById('wlThreshold').value;
  const threshold = thresholdRaw ? Number(thresholdRaw) : null;
  const currentVal = currentValueFor(symbol);
  const direction = (threshold !== null && currentVal !== null) ? (threshold >= currentVal ? 'above' : 'below') : null;
  const list = getWatchlist().filter(x=>x.symbol!==symbol);
  list.unshift({
    symbol, nom: asset.nom, type: asset.type,
    threshold, direction,
    note: document.getElementById('wlNote').value.trim(),
    date: new Date().toLocaleDateString('fr-FR')
  });
  saveWatchlist(list);
  document.getElementById('wlThreshold').value = '';
  document.getElementById('wlNote').value = '';
  renderWatchlist();
});
safeRun('watchlist (init)', renderWatchlist);
renderGamificationWidget('gamiWidget', true);
renderLeagueBoard('leagueWidget');

const favs = getFavorites();
document.getElementById('favCount').textContent = favs.length + ' élément(s)';
if(favs.length){
  document.getElementById('favEmpty').style.display = 'none';
  document.getElementById('favGrid').innerHTML = favs.map(f=>`
    <div class="card">
      <span class="smallcaps">${f.type}</span>
      <h3 style="font-size:18px;">${f.title}</h3>
      <div class="card-footer"><span>Ajouté le ${f.date}</span><a href="${f.url}" class="btn btn-sm">Ouvrir</a></div>
    </div>`).join('');
}
