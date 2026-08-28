/* ============================================================
   LIKANZA ACADEMY — Comportements partagés
   Chargé sur toutes les pages après data.js
   ============================================================ */

// ---------- Thème clair / sombre ----------
function forceRepaint(){
  // Contourne un bug connu de WebKit/Safari où le texte qui hérite d'une
  // couleur via variable CSS ne se réaffiche pas toujours après un changement
  // de thème. On force un redessin réel du document.
  const el = document.body;
  el.style.display = 'none';
  // eslint-disable-next-line no-unused-expressions
  el.offsetHeight; // lecture qui force le navigateur à recalculer la mise en page
  el.style.display = '';
}

function initTheme(){
  const saved = safeGet('fzr-theme');
  if(saved) document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeToggle');
  if(btn){
    btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'light' ? ICONS.moon : ICONS.sun;
    btn.addEventListener('click', ()=>{
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
      safeSet('fzr-theme', isLight ? 'dark' : 'light');
      btn.innerHTML = isLight ? ICONS.sun : ICONS.moon;
      forceRepaint();
    });
  }
}

// ---------- localStorage sécurisé (fonctionne uniquement une fois le site publié dans un vrai navigateur) ----------
function safeGet(key){
  try{ return localStorage.getItem(key); }catch(e){ return null; }
}
// Avant ce correctif (audit du 2026-08-20, section K), un échec d'écriture
// localStorage (quota dépassé, navigation privée restrictive...) était
// totalement silencieux : la progression cessait de s'enregistrer sans que
// l'utilisateur en soit jamais informé. Avertit une seule fois par session
// (pas à chaque écriture manquée, jamais spammé) via le même style de toast
// que showBadgeToast, plus loin dans ce fichier — aucune nouvelle classe CSS.
let storageWarningShown = false;
function warnStorageFailureOnce(key, err){
  console.error(`Likanza Academy — échec d'enregistrement local (clé "${key}") :`, err && err.message);
  if(storageWarningShown) return;
  storageWarningShown = true;
  try{
    if(typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') return;
    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.style.borderColor = 'var(--bordeaux)';
    toast.innerHTML = `<strong>⚠️ Sauvegarde impossible</strong><br><span>Ta progression ne s'enregistre plus sur cet appareil (stockage local plein ou bloqué). Libère de l'espace ou essaie un autre navigateur.</span>`;
    document.body.appendChild(toast);
    if(typeof requestAnimationFrame === 'function') requestAnimationFrame(()=>toast.classList.add('show'));
    setTimeout(()=>{ toast.classList.remove('show'); setTimeout(()=>toast.remove(), 400); }, 6000);
  }catch(e){ /* jamais laisser l'avertissement lui-même faire planter la page */ }
}
function safeSet(key, val){
  try{ localStorage.setItem(key, val); return true; }catch(e){ warnStorageFailureOnce(key, e); return false; }
}
function safeGetJSON(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; }
}
function safeSetJSON(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); return true; }catch(e){ warnStorageFailureOnce(key, e); return false; }
}

// ---------- Échappement HTML (texte libre saisi par l'utilisateur, ex. "Construis ton projet") ----------
// À utiliser systématiquement avant d'interpoler une réponse libre dans un
// template innerHTML : le texte reste local à l'appareil (jamais envoyé à un
// serveur ni à un autre utilisateur), mais rien n'empêche un contenu collé
// (ex. copié depuis une page piégée) de casser le rendu ou de s'exécuter.
function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- Navigation : menu mobile + menu déroulant Explorer + lien actif ----------
function initNav(){
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('mainNav');
  if(toggle && nav){
    toggle.addEventListener('click', ()=>{
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.main-nav > a').forEach(a=>{
    if(a.getAttribute('href') === current) a.classList.add('active');
  });
  document.querySelectorAll('.nav-dropdown').forEach(dropdown=>{
    const toggleBtn = dropdown.querySelector('.nav-dropdown-toggle');
    const links = dropdown.querySelectorAll('.nav-dropdown-panel a');
    links.forEach(a=>{
      if(a.getAttribute('href').split('#')[0] === current) dropdown.classList.add('has-active');
    });
    toggleBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });
  document.addEventListener('click', (e)=>{
    document.querySelectorAll('.nav-dropdown.open').forEach(d=>{
      if(!d.contains(e.target)) d.classList.remove('open');
    });
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') document.querySelectorAll('.nav-dropdown.open').forEach(d=>d.classList.remove('open'));
  });
}

// ---------- Recherche globale ----------
function initSearch(){
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  if(!input || !results) return;
  function render(items){
    if(items.length === 0){
      results.innerHTML = '<div class="search-empty">Aucun résultat.</div>';
      return;
    }
    results.innerHTML = items.slice(0,8).map(i=>`<a href="${i.url}"><span class="tag">${i.type}</span>${i.title}</a>`).join('');
  }
  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    if(q.length < 2){ results.classList.remove('open'); return; }
    const matches = SEARCH_INDEX.filter(i=>i.title.toLowerCase().includes(q));
    render(matches);
    results.classList.add('open');
  });
  input.addEventListener('focus', ()=>{ if(input.value.trim().length >= 2) results.classList.add('open'); });
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.search-box')) results.classList.remove('open');
  });
}

// ---------- Favoris (localStorage — fonctionnel une fois le site hébergé) ----------
function getFavorites(){ return safeGetJSON('fzr-favorites', []); }
function isFavorite(id){ return getFavorites().some(f=>f.id===id); }
function toggleFavorite(id, title, url, type){
  let favs = getFavorites();
  if(favs.some(f=>f.id===id)){
    favs = favs.filter(f=>f.id!==id);
  }else{
    favs.push({id, title, url, type, date:new Date().toLocaleDateString('fr-FR')});
  }
  safeSetJSON('fzr-favorites', favs);
  return isFavorite(id);
}
function initFavButtons(){
  document.querySelectorAll('.fav-btn').forEach(btn=>{
    const id = btn.dataset.favId;
    if(!id) return;
    if(isFavorite(id)) btn.classList.add('active');
    btn.addEventListener('click', ()=>{
      const active = toggleFavorite(id, btn.dataset.favTitle, btn.dataset.favUrl, btn.dataset.favType);
      btn.classList.toggle('active', active);
    });
  });
}

// ---------- Niveau utilisateur (Academy) ----------
function getLevel(){ return safeGet('fzr-level') || 'debutant'; }
function setLevelStorage(lvl){ safeSet('fzr-level', lvl); }

// ---------- Verrouillage des parcours (formation progressive) ----------
// Un niveau se débloque uniquement quand toutes les missions du niveau
// précédent ont été validées (question résolue, pas juste consultées).
const LEVEL_ORDER = ['debutant','intermediaire','avance','expert'];
function isLevelUnlocked(level){
  const idx = LEVEL_ORDER.indexOf(level);
  if(idx <= 0) return true;
  const prev = LEVEL_ORDER[idx-1];
  const progress = safeGetJSON('fzr-progress', {});
  return COURSES[prev].every((c,i)=>progress[prev+'-'+i]);
}
function firstUnlockedLevel(){
  return LEVEL_ORDER.find(l=>isLevelUnlocked(l)) || 'debutant';
}

// ---------- Ticker de marché ----------
function renderTicker(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  let html = '';
  for(let i=0;i<2;i++){
    MARKET_DATA.forEach(it=>{
      if(it.sens === 'na') return;
      const maj = it.maj !== '—' ? ` · ${it.maj}${it.heure !== '—' ? ' ' + it.heure : ''}` : '';
      const valeur = it.valeur !== '—' ? `<span class="mono" style="color:var(--text-dim);">${it.valeur}${it.unite ? ' ' + it.unite : ''}</span> ` : '';
      html += `<a class="ticker-item" href="marche.html#${encodeURIComponent(it.symbol)}" title="Source : ${it.source} · ${it.statusLabel}${maj} · Voir la fiche">${it.nom} ${valeur}<span class="${it.sens}">${it.variation}</span></a>`;
    });
  }
  el.innerHTML = html;
}

// ---------- Cotations réelles (/api/quotes, fonction serverless Vercel) ----------
// Conformément à ARCHITECTURE.md, le navigateur n'appelle jamais un fournisseur
// de données directement : il interroge le backend Likanza Academy (api/quotes.js),
// mis en cache côté CDN. Si le backend est injoignable (aperçu local, GitHub
// Pages, panne ou quota fournisseur), les valeurs de repli de MARKET_DATA
// restent affichées avec leur statut d'origine — jamais une ancienne valeur
// présentée comme fraîche.
const LIVE_STATUS_LABELS = {
  'LIVE':'LIVE', 'REAL-TIME':'TEMPS RÉEL', 'DELAYED':'DIFFÉRÉ', 'LAST_CLOSE':'LAST CLOSE',
  'MANUAL':'MANUEL', 'DEMO':'DEMO', 'UNAVAILABLE':'UNAVAILABLE'
};
function currencySymbol(code){
  return {USD:'$', EUR:'€', GBP:'£'}[code] || code || '';
}
// Normalise une cotation Yahoo/CoinGecko (q) sur une entrée MARKET_DATA (it) —
// factorisé pour être partagé entre le poll global du bandeau (applyLiveQuotes,
// via /api/quotes) et le chargement à la demande d'une nouvelle classe d'actif
// (loadMarketCategoryQuotes, via /api/custom-quotes) : même normalisation
// partout, jamais deux formats différents pour la même donnée.
function applyOneQuoteToMarketItem(it, q){
  if(!it || typeof q.price !== 'number' || typeof q.changePercent !== 'number') return false;
  // Valeurs numériques brutes, en plus des chaînes déjà formatées en français
  // ci-dessous — nécessaires pour tout calcul réel (comparateur, indicateurs
  // techniques) : jamais un re-parsing fragile de "8 408" ou "+1,5%".
  it.prixNum = q.price;
  it.variationNum = q.changePercent;
  it.valeur = q.price.toLocaleString('fr-FR', q.price >= 1000
    ? {maximumFractionDigits:0}
    : {minimumFractionDigits:2, maximumFractionDigits:2});
  if(!it.unite) it.unite = currencySymbol(q.currency);
  it.variation = (q.changePercent >= 0 ? '+' : '−') + Math.abs(q.changePercent).toFixed(1) + '%';
  it.sens = q.changePercent >= 0 ? 'up' : 'down';
  if(q.source) it.source = q.source;
  it.statut = 'reel';
  it.statusLabel = LIVE_STATUS_LABELS[q.status] || q.status || 'DIFFÉRÉ';
  const when = q.timestamp ? new Date(q.timestamp) : null;
  if(when && !isNaN(when)){
    it.maj = when.toLocaleDateString('fr-FR');
    it.heure = when.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
  }
  if(Array.isArray(q.history) && q.history.length >= 2) it.history = q.history;
  return true;
}
function applyLiveQuotes(quotes){
  let applied = 0;
  quotes.forEach(q=>{
    const it = MARKET_DATA.find(m=>m.symbol===q.symbol);
    if(applyOneQuoteToMarketItem(it, q)) applied++;
  });
  return applied;
}

// Chargement à la demande (jamais dans le poll global du bandeau, voir
// ARCHITECTURE.md) des classes d'actifs étendues (ETF/Forex/Indices
// supplémentaires/Matières premières supplémentaires/Taux) : appelé
// uniquement quand l'utilisateur ouvre l'onglet Marchés ou une fiche
// marche.html correspondante, jamais au chargement du site. Ne déclenche
// jamais renderTicker() : le bandeau du site reste strictement les valeurs
// historiques (5 indices + 2 matières premières + 2 cryptos), quel que soit
// ce que l'utilisateur a chargé ailleurs.
function loadMarketCategoryQuotes(symbols, opts){
  if(!Array.isArray(symbols) || symbols.length === 0) return Promise.resolve(0);
  // opts.range/opts.interval (optionnels) : transmis tels quels à
  // /api/custom-quotes, qui les supporte déjà pour tout symbole. Par défaut
  // (rafraîchissement léger de l'onglet "Autres marchés"), on ne les envoie
  // pas — l'API retombe sur 5 jours, largement suffisant pour une simple
  // cotation. Un historique plus long (ex. 6 mois, pour les indicateurs
  // techniques ou le comparateur) n'est demandé qu'explicitement par
  // l'appelant qui en a besoin.
  const extra = opts && opts.range ? '&range=' + encodeURIComponent(opts.range) : '';
  const extraInterval = opts && opts.interval ? '&interval=' + encodeURIComponent(opts.interval) : '';
  // /api/custom-quotes plafonne à 20 symboles par requête (voir api/custom-quotes.js) :
  // au-delà (catalogue ETF + Forex + Indices/Matières premières supplémentaires +
  // courbe des taux dépasse 20 au total), découper en plusieurs requêtes plutôt
  // que de laisser le plafond tronquer silencieusement la liste.
  const chunks = [];
  for(let i=0;i<symbols.length;i+=20) chunks.push(symbols.slice(i, i+20));
  return Promise.all(chunks.map(chunk =>
    fetch('/api/custom-quotes?symbols=' + encodeURIComponent(chunk.join(',')) + extra + extraInterval)
      .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(payload => (payload && Array.isArray(payload.quotes)) ? payload.quotes : [])
      .catch(err=>{
        console.info('Likanza Academy — cotations de marché étendues indisponibles :', err.message);
        return [];
      })
  )).then(results=>{
    const allQuotes = [].concat(...results);
    const applied = applyLiveQuotes(allQuotes);
    if(applied > 0) document.dispatchEvent(new CustomEvent('fzr:quotes-updated'));
    return applied;
  });
}
function initLiveMarketData(){
  if(location.protocol === 'file:') return; // aperçu local sans backend
  const refresh = ()=>fetch('/api/quotes')
    .then(r=>{ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(payload=>{
      if(!payload || !Array.isArray(payload.quotes)) return;
      if(applyLiveQuotes(payload.quotes) > 0){
        renderTicker('tickerTrack');
        // Prévient les pages qui affichent ces données (ex. marche.html)
        document.dispatchEvent(new CustomEvent('fzr:quotes-updated'));
      }
    })
    .catch(err=>{
      console.info('Likanza Academy — cotations en direct indisponibles, valeurs de repli affichées :', err.message);
    });
  refresh();
  // Rafraîchit tant que la page reste ouverte, au rythme du cache CDN (5 min) :
  // inutile d'interroger plus souvent, le CDN servirait la même réponse.
  setInterval(refresh, 5*60*1000);
}

// ---------- Sparkline partagée (courbe SVG à partir d'un historique) ----------
// Utilisée par la fiche marché (marche.html) et par les lignes hausses/baisses
// de la page Bourse. mode "compact" : petite courbe seule (ligne de liste) ;
// mode complet : courbe avec dégradé, pointillé de référence, repères et dates.
// Couleur : émeraude si la période est haussière, bordeaux sinon.
function sparklineFmtDate(iso){
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'});
}
function sparklineFmtClose(n){
  return n.toLocaleString('fr-FR', n >= 1000 ? {maximumFractionDigits:0} : {minimumFractionDigits:2, maximumFractionDigits:2});
}
let sparklineSeq = 0; // ids de dégradés uniques quand plusieurs courbes coexistent sur une page
function renderSparklineHTML(history, opts){
  opts = opts || {};
  if(!Array.isArray(history) || history.length < 2){
    return opts.compact
      ? `<svg class="sparkline-sm" viewBox="0 0 120 34" aria-hidden="true"></svg>`
      : `<p style="font-size:12.5px;color:var(--text-dim);">L'historique des dernières séances s'affiche dès que les cotations automatiques sont disponibles (connexion au backend requise).</p>`;
  }
  const closes = history.map(h=>h.close);
  const min = Math.min(...closes), max = Math.max(...closes);
  const spread = (max - min) || Math.abs(max) * 0.01 || 1;
  const up = closes[closes.length - 1] >= closes[0];
  const color = up ? 'var(--emerald)' : 'var(--bordeaux)';
  const gid = 'sparkGrad' + (++sparklineSeq);
  const gradient = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.28"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;

  if(opts.compact){
    const W = 120, H = 34, pad = 3;
    const X = i => pad + i * (W - 2 * pad) / (closes.length - 1);
    const Y = v => pad + (1 - (v - min) / spread) * (H - 2 * pad);
    const line = 'M' + closes.map((c, i) => `${X(i).toFixed(1)} ${Y(c).toFixed(1)}`).join(' L');
    const area = `${line} L${X(closes.length - 1).toFixed(1)} ${H - pad} L${X(0).toFixed(1)} ${H - pad} Z`;
    return `<svg class="sparkline-sm" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      ${gradient}
      <path d="${area}" fill="url(#${gid})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  const W = 600, H = 220, padL = 10, padR = 66, padT = 16, padB = 28;
  const X = i => padL + i * (W - padL - padR) / (closes.length - 1);
  const Y = v => padT + (1 - (v - min) / spread) * (H - padT - padB);
  const linePath = 'M' + closes.map((c, i) => `${X(i).toFixed(1)} ${Y(c).toFixed(1)}`).join(' L');
  const areaPath = `${linePath} L${X(closes.length - 1).toFixed(1)} ${H - padB} L${X(0).toFixed(1)} ${H - padB} Z`;
  const refY = Y(closes[0]).toFixed(1);
  // Libellés de dates : premier, milieu, dernier (évite le chevauchement)
  const labelIdx = [...new Set([0, Math.floor((closes.length - 1) / 2), closes.length - 1])];
  const xLabels = labelIdx.map(i =>
    `<text x="${X(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === closes.length - 1 ? 'end' : 'middle'}">${sparklineFmtDate(history[i].date)}</text>`).join('');
  const yLabels = `
      <text x="${W - padR + 10}" y="${(Y(max) + 4).toFixed(1)}">${sparklineFmtClose(max)}</text>
      <text x="${W - padR + 10}" y="${(Y(min) + 4).toFixed(1)}">${sparklineFmtClose(min)}</text>`;
  const hoverPoints = history.map((h, i) =>
    `<circle cx="${X(i).toFixed(1)}" cy="${Y(h.close).toFixed(1)}" r="10" fill="transparent"><title>${sparklineFmtDate(h.date)} : ${sparklineFmtClose(h.close)}${opts.unite ? ' ' + opts.unite : ''}</title></circle>`).join('');
  return `
    <svg class="market-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution sur les dernières séances">
      ${gradient}
      <line x1="${padL}" y1="${Y(max).toFixed(1)}" x2="${W - padR}" y2="${Y(max).toFixed(1)}" class="grid"/>
      <line x1="${padL}" y1="${Y(min).toFixed(1)}" x2="${W - padR}" y2="${Y(min).toFixed(1)}" class="grid"/>
      <line x1="${padL}" y1="${refY}" x2="${W - padR}" y2="${refY}" class="refline"/>
      <path d="${areaPath}" fill="url(#${gid})"/>
      <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${X(closes.length - 1).toFixed(1)}" cy="${Y(closes[closes.length - 1]).toFixed(1)}" r="4" fill="${color}"/>
      ${yLabels}
      ${xLabels}
      ${hoverPoints}
    </svg>
    <p style="font-size:11px;color:var(--text-dim);margin-top:8px;">Clôtures des dernières séances (source : ${opts.source || 'n.d.'}). La ligne pointillée marque la première clôture de la période ; échelle resserrée entre ${sparklineFmtClose(min)} et ${sparklineFmtClose(max)}.</p>`;
}

// ---------- Conseils adaptés au niveau (contexte marché) ----------
const MARKET_TIPS = {
  debutant: "Les hausses et baisses du jour ne veulent pas dire grand-chose isolément : ce sont les tendances sur plusieurs années qui comptent le plus pour un premier investissement.",
  intermediaire: "Compare toujours une variation quotidienne au contexte : un secteur entier qui bouge n'a pas la même signification qu'un mouvement isolé sur une seule entreprise.",
  avance: "Regarde si la variation du jour s'accompagne d'une actualité précise (résultats, annonce) avant d'en tirer une conclusion : le \"bruit\" quotidien est souvent sans lien avec les fondamentaux.",
  expert: "Une variation de PER à bénéfice constant reflète un changement d'anticipations du marché, pas un changement de la valeur intrinsèque de l'entreprise, utile à distinguer avant d'interpréter un mouvement de cours."
};

// ---------- Personnalisation légère par domaine (profil Likanza) ----------
// Utilise le niveau spécifique au domaine (fzr-profile.levels, alimenté par
// le test de positionnement) quand il existe, sinon le niveau global
// (fzr-level) — jamais une valeur inventée : dégradation silencieuse vers le
// signal réel disponible le plus précis.
function getDomainLevel(domainKey){
  if(domainKey){
    const lvl = getProfile().levels[domainKey];
    if(lvl) return lvl;
  }
  return getLevel();
}

// ---------- Niveau déclaré vs niveau évalué, par domaine ----------
// Mêmes seuils que l'ancien test de positionnement noté (retiré) — réutilisés
// ici pour convertir un vrai pourcentage de bonnes réponses en un des 4
// niveaux déjà utilisés partout ailleurs sur le site.
function levelFromPct(pct){
  if(pct >= 80) return 'expert';
  if(pct >= 60) return 'avance';
  if(pct >= 35) return 'intermediaire';
  return 'debutant';
}

// Résultats des quiz approfondis (quiz-approfondi.html) : un par domaine,
// écrit uniquement à la fin d'un quiz complet — jamais partiel.
function getDeepQuizResults(){ return safeGetJSON('fzr-deep-quiz-results', {}); }
function saveDeepQuizResult(domainKey, correct, total){
  const results = getDeepQuizResults();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  results[domainKey] = {niveau: levelFromPct(pct), pct, correct, total, date: new Date().toISOString()};
  safeSetJSON('fzr-deep-quiz-results', results);
  return results[domainKey];
}
// Seuil de réussite d'un quiz approfondi = un vrai mini-examen par domaine
// (audit Formations Phase 6 du 27/08/2026) : plus élevé que le seuil léger
// du quiz de cours (COURS_PASS_THRESHOLD, 60%) puisqu'il porte sur tout un
// domaine entier (8 à 15 questions), pas un seul cours — jamais confondu
// avec ce seuil-là.
const DEEP_QUIZ_PASS_THRESHOLD = 0.7;
function isDeepQuizPassed(domainKey){
  const result = getDeepQuizResults()[domainKey];
  return !!result && result.pct >= DEEP_QUIZ_PASS_THRESHOLD * 100;
}
function getPassedExamsCount(){
  return DOMAINS.filter(d => isDeepQuizPassed(d.key)).length;
}

// Niveau évalué (vérifié) par domaine — jamais inventé. Deux sources
// possibles, jamais mélangées, par ordre de fiabilité :
//  1. Un quiz approfondi terminé pour ce domaine → confiance élevée.
//  2. À défaut, la vraie maîtrise accumulée par l'activité réelle (Défis,
//     cours, Business...) sur les catégories du domaine (getSkillMastery) →
//     confiance moyenne à partir de 20 réponses, faible à partir de 10.
//  En dessous de 10 réponses et sans quiz approfondi : renvoie null — le
//  code appelant doit alors afficher "pas encore assez de données", jamais
//  un niveau calculé sur trop peu d'éléments.
function getEvaluatedLevel(domainKey){
  const domain = DOMAINS.find(d => d.key === domainKey);
  if(!domain) return null;

  const deepResult = getDeepQuizResults()[domainKey];
  if(deepResult){
    return {niveau: deepResult.niveau, pct: deepResult.pct, confiance: 'élevée', source: 'quiz approfondi', date: deepResult.date, correct: deepResult.correct, total: deepResult.total};
  }

  const stats = getQuizStats().categoryStats;
  let correct = 0, total = 0, weightedCorrect = 0, weightedTotal = 0;
  domain.quizCategories.forEach(cat => {
    const s = stats[cat];
    if(!s) return;
    correct += s.correct; total += s.total;
    weightedCorrect += s.weightedCorrect !== undefined ? s.weightedCorrect : s.correct;
    weightedTotal += s.weightedTotal !== undefined ? s.weightedTotal : s.total;
  });
  if(total < 10) return null;
  // pct pondéré par difficulté (section 6) ; confiance basée sur le nombre
  // RÉEL de réponses (total brut), jamais gonflé par la pondération.
  const pct = Math.round((weightedCorrect / weightedTotal) * 100);
  return {niveau: levelFromPct(pct), pct, confiance: total >= 20 ? 'moyenne' : 'faible', source: 'activité récente (Défis, cours)', correct, total};
}

const DOMAIN_LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};

// ---------- Mon Parcours : tableau de bord par domaine ----------
// Une carte par domaine (déclaré vs évalué, jamais confondus). Réutilise le
// gabarit visuel de renderBusinessNiveau (business-concept-row) plutôt que
// d'introduire un nouveau composant pour la même idée (une ligne = un fait,
// une étiquette).
// ---------- Tableau de bord : compteurs réels à vie (audit Formations Phase 6
// du 27/08/2026 — jusqu'ici, seul un compteur "à revoir" existait). Chaque
// chiffre vient d'une source déjà existante, jamais un total inventé pour
// remplir une case. ----------
function renderParcoursStats(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const masteredCount = getSkillMastery().filter(m => m.niveau === 'maîtrisé').length;
  const examsCount = getPassedExamsCount();
  const defisCount = getPassedDefisSessionsCount();
  const stats = [
    {label: 'Notions maîtrisées', value: masteredCount, sub: 'sur les thèmes déjà pratiqués'},
    {label: 'Examens réussis', value: `${examsCount} / ${DOMAINS.length}`, sub: `quiz approfondis, ≥${Math.round(DEEP_QUIZ_PASS_THRESHOLD*100)}%`},
    {label: 'Défis réussis', value: defisCount, sub: `sessions à ≥${Math.round(DEFI_SESSION_PASS_THRESHOLD*100)}%, à vie`}
  ];
  el.innerHTML = `<div class="card-grid">${stats.map(s => `
    <div class="card">
      <span class="smallcaps">${s.label}</span>
      <div class="result-big" style="font-size:24px;margin-top:6px;">${s.value}</div>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">${s.sub}</p>
    </div>`).join('')}</div>`;
}

// ---------- Widgets compacts "pont" entre Mon Parcours et le Laboratoire
// (audit Dashboard du 28/08/2026, Chantier 1) — jusqu'ici, aucune donnée du
// Laboratoire (patrimoine, objectifs) n'apparaissait nulle part sur Mon
// Parcours. Toujours un aperçu compact + un lien vers l'outil complet,
// jamais une réimplémentation parallèle des calculs déjà réels. ----------
function renderNetWorthDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const assets = getNetWorthAssets();
  const debts = getPersonalDebts();
  if(assets.length === 0 && debts.length === 0){
    el.innerHTML = `
      <span class="smallcaps">💎 Mon Patrimoine</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:10px;">Ajoute tes premiers actifs pour construire ton patrimoine ici.</p>
      <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm btn-gold" style="margin-top:10px;">Configurer →</a>`;
    return;
  }
  const net = computeNetWorth(assets, debts);
  const history = getNetWorthHistory();
  let deltaHtml = '';
  if(history.length >= 2){
    const delta = net.patrimoineNet - history[history.length - 2].patrimoineNet;
    deltaHtml = `<p style="font-size:12px;margin-top:2px;"><span class="mono" style="color:${delta >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};">${delta >= 0 ? '+' : ''}${fmtEUR(delta)}</span> <span style="color:var(--text-dim);">vs mois dernier</span></p>`;
  }
  const chart = history.length >= 2 ? renderMultiLineChart([{data: history.slice(-12).map(p => p.patrimoineNet), color: 'var(--gold-bright)', width: 2}]) : '';
  el.innerHTML = `
    <span class="smallcaps">💎 Mon Patrimoine</span>
    <div class="result-big" style="font-size:26px;margin-top:6px;color:${net.patrimoineNet >= 0 ? 'var(--text)' : 'var(--bordeaux)'};">${fmtEUR(net.patrimoineNet)}</div>
    ${deltaHtml}
    ${chart ? `<div class="pattern-chart" style="margin-top:10px;">${chart}</div>` : ''}
    <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm" style="margin-top:10px;">Voir le détail →</a>`;
}
const GOAL_STATUS_META = {atteint: {emoji: '🏆', label: 'Atteint'}, ontrack: {emoji: '🟢', label: 'Dans les temps'}, atrisk: {emoji: '🟠', label: 'À risque'}, impossible: {emoji: '🔴', label: "Hors d'atteinte au rythme actuel"}};
function renderGoalsDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const goals = getFinancialGoals();
  if(goals.length === 0){
    el.innerHTML = `
      <span class="smallcaps">🎯 Mes Objectifs</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:10px;">Quel est ton prochain objectif ?</p>
      <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm btn-gold" style="margin-top:10px;">Créer un objectif →</a>`;
    return;
  }
  el.innerHTML = `
    <span class="smallcaps">🎯 Mes Objectifs (${goals.length})</span>
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:10px;">
      ${goals.slice(0, 4).map(g => {
        const proj = computeGoalProjection(g);
        const meta = proj && proj.statut ? GOAL_STATUS_META[proj.statut] : null;
        return `<div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;">
            <span>${g.nom}</span>
            <span class="mono" style="color:var(--text-dim);">${meta ? meta.emoji + ' ' : ''}${Math.round(proj.progressionPct)}%</span>
          </div>
          <div class="dash-weekbar" style="width:100%;"><div class="dash-weekfill" style="width:${proj.progressionPct}%;"></div></div>
        </div>`;
      }).join('')}
    </div>
    ${goals.length > 4 ? `<p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">+${goals.length - 4} autre${goals.length - 4 > 1 ? 's' : ''}</p>` : ''}
    <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm" style="margin-top:10px;">Gérer mes objectifs →</a>`;
}
function renderBusinessSnapshotDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const profile = getBusinessProfile();
  const snapshot = computeBusinessProfileSnapshot(profile);
  if(snapshot.ca === 0){
    el.innerHTML = `
      <span class="smallcaps">💼 Mon Entreprise</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:10px;">Renseigne ton profil entreprise pour voir un aperçu ici.</p>
      <a href="business-lab.html" class="btn btn-sm btn-gold" style="margin-top:10px;">Configurer →</a>`;
    return;
  }
  el.innerHTML = `
    <span class="smallcaps">💼 Mon Entreprise${profile.nom ? ' — ' + profile.nom : ''}</span>
    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));margin-top:10px;">
      <div class="card"><span class="smallcaps">CA annuel</span><div class="result-big" style="font-size:16px;margin-top:4px;">${fmtEUR(snapshot.ca)}</div></div>
      <div class="card"><span class="smallcaps">Résultat mensuel</span><div class="result-big" style="font-size:16px;margin-top:4px;color:${snapshot.resultatMensuelApproximatif >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};">${fmtEUR(snapshot.resultatMensuelApproximatif)}</div></div>
      <div class="card"><span class="smallcaps">Trésorerie</span><div class="result-big" style="font-size:16px;margin-top:4px;">${fmtEUR(profile.tresorerieActuelle)}</div></div>
    </div>
    <a href="business-lab.html" class="btn btn-sm" style="margin-top:10px;">Voir le Business Lab →</a>`;
}
// Le disclaimer déclaré-vs-évalué vivait auparavant dans le HTML de
// parcours.html autour de renderDomainDashboard — préservé ici pour que le
// passage en widget (Chantier 1) ne perde pas cette explication.
function renderDomainDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <span class="smallcaps">Niveau par domaine</span>
    <p class="disclaimer-box" style="margin:10px 0 14px;">Le niveau déclaré vient de <a href="test-positionnement.html" style="color:var(--gold-bright);">ton profil Likanza</a> : une hypothèse de départ, jamais présentée comme vérifiée. Le niveau évalué vient d'un quiz approfondi ou de ton activité réelle (Défis, cours) — et n'apparaît que lorsqu'il y a assez de données pour être honnête.</p>
    <div id="${elId}-inner"></div>`;
  renderDomainDashboard(`${elId}-inner`);
}
function renderFutureDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const assets = getNetWorthAssets();
  const debts = getPersonalDebts();
  const patrimoineInitial = computeNetWorth(assets, debts).patrimoineNet;
  // Aperçu compact : épargne mensuelle réelle du mois si connue (jamais une
  // hypothèse d'épargne inventée), sinon 0 — l'outil complet (Laboratoire)
  // permet de régler ce curseur toi-même.
  const budgetSummary = computeBudgetSummary(getBudgetEntries(), currentMonthKey());
  const epargneMensuelle = Math.max(0, budgetSummary.solde || 0);
  const scenarios = computeWealthProjectionScenarios({patrimoineInitial, epargneMensuelle, inflationPct: 2.1, augmentationAnnuellePct: 0});
  const SCENARIO_COLORS = {prudent: 'var(--bordeaux)', central: 'var(--gold-bright)', optimiste: 'var(--emerald)'};
  el.innerHTML = `
    <span class="smallcaps">🔮 Mon Futur</span>
    <p style="font-size:11.5px;color:var(--text-dim);margin:8px 0 10px;">Dans 10 ans, à ${fmtEUR(epargneMensuelle)}/mois${epargneMensuelle === 0 ? ' (aucune épargne mensuelle détectée)' : ''} :</p>
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${Object.keys(RETURN_ASSUMPTIONS).map(key => `
        <div style="display:flex;justify-content:space-between;font-size:12.5px;">
          <span style="color:${SCENARIO_COLORS[key]};">${RETURN_ASSUMPTIONS[key].label}</span>
          <span class="mono">${fmtEUR(scenarios[key].atHorizon[10].patrimoineNominal)}</span>
        </div>`).join('')}
    </div>
    <a href="laboratoire.html#tab-planification" class="btn btn-sm" style="margin-top:10px;">Simuler mes hypothèses →</a>`;
}
// Aperçu compact du calendrier financier (Chantier 5) : uniquement les
// échéances réelles à venir sous 7 jours (computeUpcomingReminders) — jamais
// une date inventée, jamais un rappel de "salaire" (aucune donnée de date de
// versement n'existe nulle part sur le site).
function renderTodayDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const reminders = computeUpcomingReminders(7);
  if(reminders.length === 0){
    el.innerHTML = `
      <span class="smallcaps">📅 Aujourd'hui</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Aucune échéance connue dans les 7 prochains jours.</p>
      <a href="laboratoire.html#tab-planification" class="btn btn-sm" style="margin-top:10px;">Voir le calendrier →</a>`;
    return;
  }
  el.innerHTML = `
    <span class="smallcaps">📅 Aujourd'hui</span>
    <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">
      ${reminders.slice(0, 5).map(r => `
        <div style="display:flex;justify-content:space-between;font-size:12.5px;">
          <span>${r.type === 'goal' ? '🎯' : '🔁'} ${r.label}</span>
          <span class="mono" style="color:var(--text-dim);">${r.dans === 0 ? "aujourd'hui" : r.dans === 1 ? 'demain' : `dans ${r.dans} j`}</span>
        </div>`).join('')}
    </div>
    ${reminders.length > 5 ? `<p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">+${reminders.length - 5} autre${reminders.length - 5 > 1 ? 's' : ''}</p>` : ''}
    <a href="laboratoire.html#tab-planification" class="btn btn-sm" style="margin-top:10px;">Voir le calendrier →</a>`;
}
function renderMistakesDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const unresolved = getMistakes().filter(m => !m.resolved);
  if(unresolved.length === 0){
    el.innerHTML = `<span class="smallcaps">🧠 Notions à revoir</span><p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Rien en attente — continue comme ça !</p>`;
    return;
  }
  const counts = {};
  unresolved.forEach(m => { counts[m.categorie] = (counts[m.categorie] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  el.innerHTML = `
    <span class="smallcaps">🧠 Notions à revoir</span>
    <p style="font-size:13px;color:var(--text-dim);margin:8px 0 10px;">${unresolved.length} notion${unresolved.length > 1 ? 's' : ''} à revoir, surtout en ${top}.</p>
    <a href="revisions.html" class="btn btn-sm">Réviser →</a>`;
}

// ---- 🚨 Alertes unifiées (audit Dashboard du 28/08/2026, Chantier 6) :
// agrège en un seul flux des signaux qui existaient déjà séparément
// (diagnostics budgétaires, conflit d'objectifs, échéances imminentes) —
// jamais un signal recalculé différemment ici, toujours le même calcul déjà
// testé ailleurs. Volontairement exclus : notions à revoir / révisions
// espacées, qui ont déjà leur propre widget Dashboard dédié ('mistakes',
// 'spaced-review') — les dupliquer ici serait redondant, pas plus complet.
// Chaque alerte pointe vers le vrai outil qui l'a calculée (jamais un lien
// générique) : c'est le "Analyser"/"Simuler" du prompt d'origine, sans
// bouton "Pourquoi ?" séparé (le message cite déjà le chiffre qui justifie
// l'alerte) ni "Ignorer" persistant (aucun modèle de données pour un
// masquage durable n'existait avant cette passe — hors scope pour l'instant,
// décision documentée plutôt qu'un mécanisme construit sans vrai besoin
// observé).
function computeUnifiedAlerts(){
  const alerts = [];
  const mois = currentMonthKey();
  const entries = getBudgetEntries();
  const budgetSummary = computeBudgetSummary(entries, mois);
  const debts = getPersonalDebts();
  const assets = getNetWorthAssets();
  const goals = getFinancialGoals();
  const recurringChargesTotal = computeRecurringChargesTotal(getRecurringCharges());

  computeFinancialDiagnostics({budgetSummary, debts, recurringChargesTotal, assets})
    .filter(d => d.niveau !== 'ok')
    .forEach(d => alerts.push({niveau: d.niveau, message: d.message, lien: 'laboratoire.html#tab-budget-epargne', cta: 'Analyser'}));

  const conflict = computeGoalsConflict(goals, budgetSummary);
  if(conflict.status === 'conflict'){
    alerts.push({niveau: 'alerte', message: `Tes objectifs demandent ${fmtEUR(conflict.totalCommitted)}/mois, ${fmtEUR(conflict.overCommitted)} de plus que ta capacité d'épargne actuelle (${fmtEUR(conflict.capacity)}/mois).`, lien: 'laboratoire.html#tab-budget-epargne', cta: 'Simuler'});
  }

  computeUpcomingReminders(3).forEach(r => {
    const delai = r.dans === 0 ? "aujourd'hui" : r.dans === 1 ? 'demain' : `dans ${r.dans} j`;
    alerts.push({niveau: r.dans <= 1 ? 'attention' : 'info', message: `${r.label} ${delai}${r.montant !== null ? ` (${fmtEUR(r.montant)})` : ''}.`, lien: 'laboratoire.html#tab-planification', cta: 'Voir'});
  });

  const NIVEAU_ORDER = {alerte: 0, attention: 1, info: 2};
  return alerts.sort((a, b) => NIVEAU_ORDER[a.niveau] - NIVEAU_ORDER[b.niveau]);
}
function renderAlertsDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const alerts = computeUnifiedAlerts();
  if(alerts.length === 0){
    el.innerHTML = `<span class="smallcaps">🚨 Likanza détecte</span><p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Rien à signaler pour l'instant.</p>`;
    return;
  }
  const EMOJI = {alerte: '🔴', attention: '🟠', info: 'ℹ️'};
  el.innerHTML = `
    <span class="smallcaps">🚨 Likanza détecte</span>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
      ${alerts.slice(0, 6).map(a => `
        <div style="font-size:12.5px;">
          <span>${EMOJI[a.niveau]} ${a.message}</span>
          <a href="${a.lien}" style="color:var(--gold-bright);margin-left:4px;">${a.cta} →</a>
        </div>`).join('')}
    </div>
    ${alerts.length > 6 ? `<p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">+${alerts.length - 6} autre${alerts.length - 6 > 1 ? 's' : ''}</p>` : ''}`;
}

// ---- 🩺 Financial Health Score (audit Dashboard du 28/08/2026, Chantier 6) :
// 6 axes réutilisant des calculs déjà établis et testés ailleurs (jamais un
// seuil réinventé pour ce widget). "trésorerie" ≠ "budget" : trésorerie
// mesure le poids des charges récurrentes déjà engagées sur le revenu (une
// contrainte de flexibilité immédiate), budget mesure le taux d'épargne (une
// habitude, dans la durée) — deux lectures réellement distinctes, pas un
// doublon habillé différemment. Chaque axe affiche "Données insuffisantes"
// s'il manque la donnée source, JAMAIS un score à 0 fabriqué faute de
// donnée (0 serait indiscernable d'un vrai mauvais score).
const HEALTH_SCORE_NIVEAU_POINTS = {ok: 100, attention: 55, alerte: 15};
function computeHealthScore(){
  const mois = currentMonthKey();
  const entries = getBudgetEntries();
  const budgetSummary = computeBudgetSummary(entries, mois);
  const debts = getPersonalDebts();
  const assets = getNetWorthAssets();
  const goals = getFinancialGoals();
  const recurringChargesTotal = computeRecurringChargesTotal(getRecurringCharges());
  const diagnostics = computeFinancialDiagnostics({budgetSummary, debts, recurringChargesTotal, assets});
  const findDiag = prefixes => diagnostics.find(d => prefixes.some(p => d.id.startsWith(p))) || null;

  const axes = {};

  const budgetDiag = findDiag(['solde-negatif', 'epargne-']);
  axes.budget = {label: 'Budget', insuffisant: !budgetDiag};
  if(budgetDiag) Object.assign(axes.budget, {score: HEALTH_SCORE_NIVEAU_POINTS[budgetDiag.niveau], niveau: budgetDiag.niveau, detail: budgetDiag.message});

  const detteDiag = findDiag(['endettement-']);
  axes.dette = {label: 'Dette'};
  if(detteDiag) Object.assign(axes.dette, {insuffisant: false, score: HEALTH_SCORE_NIVEAU_POINTS[detteDiag.niveau], niveau: detteDiag.niveau, detail: detteDiag.message});
  else if(budgetSummary.revenus > 0) Object.assign(axes.dette, {insuffisant: false, score: 100, niveau: 'ok', detail: 'Aucune mensualité de crédit enregistrée.'});
  else axes.dette.insuffisant = true;

  const securiteDiag = findDiag(['urgence-']);
  axes.securite = {label: 'Sécurité', insuffisant: !securiteDiag};
  if(securiteDiag) Object.assign(axes.securite, {score: HEALTH_SCORE_NIVEAU_POINTS[securiteDiag.niveau], niveau: securiteDiag.niveau, detail: securiteDiag.message});

  const chargesDiag = findDiag(['charges-elevees']);
  axes.tresorerie = {label: 'Trésorerie'};
  if(chargesDiag) Object.assign(axes.tresorerie, {insuffisant: false, score: HEALTH_SCORE_NIVEAU_POINTS[chargesDiag.niveau], niveau: chargesDiag.niveau, detail: chargesDiag.message});
  else if(budgetSummary.revenus > 0 && recurringChargesTotal.mensuel > 0){
    const pct = (recurringChargesTotal.mensuel / budgetSummary.revenus) * 100;
    Object.assign(axes.tresorerie, {insuffisant: false, score: 100, niveau: 'ok', detail: `Tes abonnements et factures récurrents représentent ${pct.toFixed(0)} % de tes revenus.`});
  } else axes.tresorerie.insuffisant = true;

  axes.investissement = {label: 'Investissement'};
  if(assets.length > 0){
    const total = assets.reduce((s, a) => s + a.valeur, 0);
    const investi = assets.filter(a => a.categorie !== 'cash').reduce((s, a) => s + a.valeur, 0);
    if(total > 0){
      const pct = (investi / total) * 100;
      const niveau = pct >= 40 ? 'ok' : pct >= 15 ? 'attention' : 'alerte';
      Object.assign(axes.investissement, {insuffisant: false, score: HEALTH_SCORE_NIVEAU_POINTS[niveau], niveau, detail: `${pct.toFixed(0)} % de ton patrimoine est investi hors épargne cash.`});
    } else axes.investissement.insuffisant = true;
  } else axes.investissement.insuffisant = true;

  axes.objectifs = {label: 'Objectifs'};
  const statuses = goals.map(g => computeGoalProjection(g)).filter(p => p && p.statut);
  if(statuses.length > 0){
    const enBonneVoie = statuses.filter(p => p.statut === 'atteint' || p.statut === 'ontrack').length;
    const pct = (enBonneVoie / statuses.length) * 100;
    const niveau = pct >= 70 ? 'ok' : pct >= 40 ? 'attention' : 'alerte';
    Object.assign(axes.objectifs, {insuffisant: false, score: HEALTH_SCORE_NIVEAU_POINTS[niveau], niveau, detail: `${enBonneVoie}/${statuses.length} objectif(s) dans les temps.`});
  } else axes.objectifs.insuffisant = true;

  const known = Object.values(axes).filter(a => !a.insuffisant);
  const globalScore = known.length > 0 ? Math.round(known.reduce((s, a) => s + a.score, 0) / known.length) : null;
  return {axes, globalScore, axesConnues: known.length, axesTotal: Object.keys(axes).length};
}
// Radar/spider chart générique, sans précédent sur le site (audit du
// 28/08/2026 confirmé : aucun graphique radar nulle part) — construit à la
// main en SVG, comme tous les autres graphiques du site. Un axe
// "insuffisant" n'est JAMAIS relié au polygone de données (jamais un score 0
// fabriqué) : son sommet est marqué par un simple repère pointillé, et le
// tracé du polygone saute la valeur manquante plutôt que d'inventer un point.
function renderRadarChart(axes){
  const size = 260, center = size / 2, maxR = 92;
  const n = axes.length;
  if(n === 0) return '';
  const angleFor = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const pointFor = (i, r) => [center + r * Math.cos(angleFor(i)), center + r * Math.sin(angleFor(i))];

  const rings = [0.25, 0.5, 0.75, 1].map(f => {
    const pts = axes.map((_, i) => pointFor(i, maxR * f).join(',')).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="var(--hairline)" stroke-width="1"/>`;
  }).join('');
  const spokes = axes.map((_, i) => {
    const [x, y] = pointFor(i, maxR);
    return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="var(--hairline)" stroke-width="1"/>`;
  }).join('');

  let dataPath = '', started = false;
  axes.forEach((ax, i) => {
    if(ax.insuffisant){ started = false; return; }
    const [x, y] = pointFor(i, maxR * (ax.score / 100));
    dataPath += (started ? ' L' : ' M') + `${x.toFixed(1)},${y.toFixed(1)}`;
    started = true;
  });

  const markers = axes.map((ax, i) => {
    if(ax.insuffisant){
      const [x, y] = pointFor(i, maxR * 0.16);
      return `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="var(--ivory-dim)" stroke-width="1.5" stroke-dasharray="2,2"/>`;
    }
    const [x, y] = pointFor(i, maxR * (ax.score / 100));
    const color = ax.score >= 70 ? 'var(--emerald)' : ax.score >= 40 ? 'var(--gold-bright)' : 'var(--bordeaux)';
    return `<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`;
  }).join('');

  const labels = axes.map((ax, i) => {
    const [x, y] = pointFor(i, maxR + 24);
    const cos = Math.cos(angleFor(i));
    const anchor = Math.abs(cos) < 0.3 ? 'middle' : (cos > 0 ? 'start' : 'end');
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="11" fill="var(--ivory-dim)">${ax.label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:320px;display:block;margin:0 auto;">
    ${rings}${spokes}
    ${dataPath ? `<path d="${dataPath}" fill="var(--gold-bright)" fill-opacity="0.18" stroke="var(--gold-bright)" stroke-width="2"/>` : ''}
    ${markers}${labels}
  </svg>`;
}
function renderHealthScoreDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const health = computeHealthScore();
  if(health.axesConnues === 0){
    el.innerHTML = `
      <span class="smallcaps">🩺 Santé financière</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:10px;">Renseigne ton budget, tes objectifs et ton patrimoine pour voir apparaître ton score ici.</p>
      <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm btn-gold" style="margin-top:10px;">Configurer →</a>`;
    return;
  }
  const axesList = Object.values(health.axes);
  el.innerHTML = `
    <span class="smallcaps">🩺 Santé financière</span>
    ${health.globalScore !== null ? `<div class="result-big" style="font-size:24px;margin-top:6px;">${health.globalScore}/100</div>` : ''}
    <p style="font-size:11.5px;color:var(--text-dim);margin:4px 0 10px;">${health.axesConnues}/${health.axesTotal} axes évalués — jamais un axe deviné.</p>
    ${renderRadarChart(axesList)}
    <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm" style="margin-top:10px;">Voir le détail →</a>`;
}
// Pendant professionnel du widget d'alertes (Chantier 6) : réutilise
// computeBusinessDiagnostics telle quelle (mêmes seuils, déjà testés dans
// Business Lab), jamais un recalcul parallèle.
function renderBusinessAlertsDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const profile = getBusinessProfile();
  const snapshot = computeBusinessProfileSnapshot(profile);
  if(snapshot.ca === 0){
    el.innerHTML = `<span class="smallcaps">🚨 Likanza détecte</span><p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Renseigne ton profil entreprise pour activer le check-up.</p>`;
    return;
  }
  const runway = computeRunway(profile);
  const unitEconomics = safeGetJSON('fzr-unit-economics', null) ? computeUnitEconomics(safeGetJSON('fzr-unit-economics', {})) : null;
  const alerts = computeBusinessDiagnostics({snapshot, runway, unitEconomics}).filter(d => d.niveau !== 'ok');
  if(alerts.length === 0){
    el.innerHTML = `<span class="smallcaps">🚨 Likanza détecte</span><p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Rien à signaler pour l'instant.</p>`;
    return;
  }
  const EMOJI = {alerte: '🔴', attention: '🟠'};
  el.innerHTML = `
    <span class="smallcaps">🚨 Likanza détecte</span>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
      ${alerts.map(a => `<div style="font-size:12.5px;">${EMOJI[a.niveau]} ${a.message}</div>`).join('')}
    </div>
    <a href="business-lab.html" class="btn btn-sm" style="margin-top:10px;">Voir le Business Lab →</a>`;
}
function renderLifeProjectsDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const projects = getLifeProjects();
  if(projects.length === 0){
    el.innerHTML = `
      <span class="smallcaps">🗺️ Mes Projets de vie</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:10px;">Quel est ton prochain grand projet ?</p>
      <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm btn-gold" style="margin-top:10px;">Créer un projet →</a>`;
    return;
  }
  el.innerHTML = `
    <span class="smallcaps">🗺️ Mes Projets de vie</span>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
      ${projects.slice(0, 4).map(p => {
        const meta = LIFE_PROJECT_CATEGORY_META[p.categorie];
        const progress = computeProjectProgress(p);
        return `<div style="font-size:12.5px;">
          <span>${meta.emoji} ${p.nom}</span>
          <span style="color:var(--text-dim);margin-left:6px;">${progress.progressionPct !== null ? `${progress.progressionPct}%` : `${fmtEUR(progress.depensesEngagees)}/${fmtEUR(p.budgetTotal)}`}</span>
        </div>`;
      }).join('')}
    </div>
    ${projects.length > 4 ? `<p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">+${projects.length - 4} autre${projects.length - 4 > 1 ? 's' : ''}</p>` : ''}
    <a href="laboratoire.html#tab-budget-epargne" class="btn btn-sm" style="margin-top:10px;">Gérer mes projets →</a>`;
}

// ---- Patrimoine combiné personnel + professionnel (audit Dashboard du
// 28/08/2026, Chantier 8) : jusqu'ici deux silos totalement séparés, sans
// aucune vue combinée même quand les deux profils existent. Côté
// professionnel, jamais une vraie valorisation d'entreprise fabriquée
// (multiples EV/EBITDA ou PER — déjà un outil dédié et explicite pour ça,
// "Valorisation par multiples") : seulement trésorerie − dette totale, une
// vraie position de cash, jamais une estimation de la valeur de l'entreprise
// elle-même.
function computeCombinedWealth(){
  const personalAssets = getNetWorthAssets();
  const personalDebts = getPersonalDebts();
  const hasPersonal = personalAssets.length > 0 || personalDebts.length > 0;
  const personalNet = computeNetWorth(personalAssets, personalDebts).patrimoineNet;
  const profile = getBusinessProfile();
  const hasBusiness = profile.ca > 0 || profile.tresorerieActuelle > 0 || profile.detteTotale > 0;
  const businessNet = profile.tresorerieActuelle - profile.detteTotale;
  return {hasPersonal, hasBusiness, personalNet, businessNet, total: personalNet + businessNet};
}
function renderCombinedWealthDashboardWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const wealth = computeCombinedWealth();
  if(!wealth.hasPersonal && !wealth.hasBusiness){
    el.innerHTML = `<span class="smallcaps">💰 Patrimoine total</span><p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Renseigne ton patrimoine personnel et/ou ton profil entreprise pour voir ton patrimoine total ici.</p>`;
    return;
  }
  if(!wealth.hasBusiness){
    el.innerHTML = `<span class="smallcaps">💰 Patrimoine total</span><p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Renseigne aussi ton profil entreprise (Business Lab) pour voir ton patrimoine personnel + professionnel combiné.</p>`;
    return;
  }
  if(!wealth.hasPersonal){
    el.innerHTML = `<span class="smallcaps">💰 Patrimoine total</span><p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Renseigne aussi ton patrimoine personnel (Laboratoire) pour voir ton patrimoine personnel + professionnel combiné.</p>`;
    return;
  }
  el.innerHTML = `
    <span class="smallcaps">💰 Patrimoine total</span>
    <div class="result-big" style="font-size:24px;margin-top:6px;">${fmtEUR(wealth.total)}</div>
    <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;font-size:12.5px;">
      <div style="display:flex;justify-content:space-between;"><span>👤 Personnel</span><span class="mono">${fmtEUR(wealth.personalNet)}</span></div>
      <div style="display:flex;justify-content:space-between;"><span>🏢 Professionnel (trésorerie nette)</span><span class="mono">${fmtEUR(wealth.businessNet)}</span></div>
    </div>
    <p style="font-size:11px;color:var(--text-dim);margin-top:8px;">Côté professionnel : trésorerie − dette totale, jamais une valorisation d'entreprise (voir "Valorisation par multiples" dans le Business Lab pour ça).</p>`;
}

// ---------- Coquille du Dashboard "Mon Univers Financier" : registre de
// widgets + personnalisation (Chantier 1). Remplace la page à sections
// empilées par une grille de widgets, avec bascule Personnel/Professionnel
// en page (jamais une navigation vers 2 pages séparées) et personnalisation
// par cases à cocher + Monter/Descendre — JAMAIS de glisser-déposer,
// décision documentée dans l'audit du 28/08/2026 : le code contenait déjà
// une décision explicite inverse (défis "sequence", boutons Monter/Descendre
// choisis pour la fiabilité mobile) — cohérence plutôt que rupture. ----------
const DASHBOARD_WIDGETS = [
  {id: 'gamification', title: null, mode: 'both', selfCard: false, render: elId => renderGamificationWidget(elId, false)},
  {id: 'combined-wealth', title: null, mode: 'both', selfCard: false, render: renderCombinedWealthDashboardWidget},
  {id: 'profile-summary', title: null, mode: 'personal', selfCard: true, render: renderParcoursProfileSummary},
  {id: 'net-worth', title: null, mode: 'personal', selfCard: false, render: renderNetWorthDashboardWidget},
  {id: 'goals', title: null, mode: 'personal', selfCard: false, render: renderGoalsDashboardWidget},
  {id: 'future', title: null, mode: 'personal', selfCard: false, render: renderFutureDashboardWidget},
  {id: 'today', title: null, mode: 'personal', selfCard: false, render: renderTodayDashboardWidget},
  {id: 'alerts', title: null, mode: 'personal', selfCard: false, render: renderAlertsDashboardWidget},
  {id: 'health-score', title: null, mode: 'personal', selfCard: false, render: renderHealthScoreDashboardWidget},
  {id: 'life-projects', title: null, mode: 'personal', selfCard: false, render: renderLifeProjectsDashboardWidget},
  {id: 'business-snapshot', title: null, mode: 'professional', selfCard: false, render: renderBusinessSnapshotDashboardWidget},
  {id: 'business-alerts', title: null, mode: 'professional', selfCard: false, render: renderBusinessAlertsDashboardWidget},
  {id: 'stats', title: null, mode: 'both', selfCard: true, render: renderParcoursStats},
  {id: 'next-step', title: null, mode: 'both', selfCard: true, render: renderNextStepRecommendation},
  {id: 'financial-iq', title: null, mode: 'personal', selfCard: false, render: renderFinancialIQDetail},
  {id: 'learning-paths', title: 'Parcours guidés', mode: 'both', selfCard: true, render: elId => renderLearningPaths(elId, {})},
  {id: 'missions-daily', title: 'Missions du jour', mode: 'both', selfCard: false, render: renderDailyMissions},
  {id: 'missions-weekly', title: 'Missions de la semaine', mode: 'both', selfCard: false, render: renderWeeklyMissions},
  {id: 'spaced-review', title: "À repasser aujourd'hui", mode: 'both', selfCard: false, render: renderSpacedReviewList},
  {id: 'mistakes', title: null, mode: 'both', selfCard: false, render: renderMistakesDashboardWidget},
  {id: 'domain-dashboard', title: null, mode: 'personal', selfCard: true, render: renderDomainDashboardWidget}
];
const WIDGET_DISPLAY_NAMES = {
  'gamification': 'Progression (niveau, XP, série)',
  'combined-wealth': '💰 Patrimoine total (personnel + pro)',
  'profile-summary': 'Ton profil Likanza',
  'net-worth': '💎 Mon Patrimoine',
  'goals': '🎯 Mes Objectifs',
  'future': '🔮 Mon Futur',
  'today': "📅 Aujourd'hui",
  'alerts': '🚨 Likanza détecte',
  'health-score': '🩺 Santé financière',
  'life-projects': '🗺️ Mes Projets de vie',
  'business-snapshot': '💼 Mon Entreprise',
  'business-alerts': '🚨 Likanza détecte (Pro)',
  'stats': 'En chiffres',
  'next-step': 'Ton prochain pas',
  'financial-iq': 'Financial IQ',
  'mistakes': 'Notions à revoir',
  'domain-dashboard': 'Niveau par domaine'
};
const DASHBOARD_LAYOUT_KEY = 'fzr-dashboard-layout';
function getDashboardLayout(){
  const knownIds = DASHBOARD_WIDGETS.map(w => w.id);
  const stored = safeGetJSON(DASHBOARD_LAYOUT_KEY, null);
  if(!stored) return {order: knownIds.slice(), hidden: [], mode: 'personal'};
  // Migration douce : un widget ajouté après coup (nouvelle version du site)
  // rejoint la fin de l'ordre déjà enregistré, jamais masqué par erreur ni
  // perdu silencieusement.
  const order = (stored.order || []).filter(id => knownIds.includes(id));
  knownIds.forEach(id => { if(!order.includes(id)) order.push(id); });
  const hidden = (stored.hidden || []).filter(id => knownIds.includes(id));
  const mode = stored.mode === 'professional' ? 'professional' : 'personal';
  return {order, hidden, mode};
}
function saveDashboardLayout(layout){ safeSetJSON(DASHBOARD_LAYOUT_KEY, layout); }

function renderDashboardShell(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  let layout = getDashboardLayout();
  let customizing = false;

  function applicableWidgets(){
    return DASHBOARD_WIDGETS.filter(w => w.mode === 'both' || w.mode === layout.mode);
  }
  function visibleWidgets(){
    const applicable = applicableWidgets();
    return layout.order.map(id => applicable.find(w => w.id === id)).filter(w => w && !layout.hidden.includes(w.id));
  }
  // Échange les positions RÉELLES dans layout.order (pas seulement dans la
  // vue filtrée par mode) : l'ordre de l'autre mode ne doit jamais être
  // perturbé par un widget qui n'y apparaît même pas.
  function moveWidget(id, dir){
    const orderedApplicable = layout.order.filter(oid => applicableWidgets().some(w => w.id === oid));
    const pos = orderedApplicable.indexOf(id);
    const targetPos = pos + dir;
    if(pos === -1 || targetPos < 0 || targetPos >= orderedApplicable.length) return;
    const otherId = orderedApplicable[targetPos];
    const idxA = layout.order.indexOf(id), idxB = layout.order.indexOf(otherId);
    [layout.order[idxA], layout.order[idxB]] = [layout.order[idxB], layout.order[idxA]];
    saveDashboardLayout(layout);
    render();
  }

  function renderCustomizePanel(){
    const ordered = layout.order.map(id => applicableWidgets().find(w => w.id === id)).filter(Boolean);
    return `<div class="card" style="margin-bottom:16px;">
      <span class="smallcaps">Personnaliser</span>
      <p style="font-size:12px;color:var(--text-dim);margin:6px 0 12px;">Affiche, masque ou réordonne les widgets de ce mode.</p>
      <div style="display:flex;flex-direction:column;gap:2px;">
        ${ordered.map((w, i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--hairline);">
            <label style="display:flex;align-items:center;gap:8px;flex:1;font-size:13px;cursor:pointer;">
              <input type="checkbox" class="dash-widget-toggle" data-id="${w.id}" ${layout.hidden.includes(w.id) ? '' : 'checked'}>
              ${w.title || WIDGET_DISPLAY_NAMES[w.id] || w.id}
            </label>
            <button type="button" class="btn btn-sm dash-widget-up" data-id="${w.id}" ${i === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
            <button type="button" class="btn btn-sm dash-widget-down" data-id="${w.id}" ${i === ordered.length - 1 ? 'disabled' : ''} aria-label="Descendre">↓</button>
          </div>`).join('')}
      </div>
    </div>`;
  }

  function render(){
    const widgets = visibleWidgets();
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <div class="mode-toggle" id="${elId}-mode" style="margin:0;">
          <button type="button" class="pill${layout.mode === 'personal' ? ' active' : ''}" data-mode="personal">👤 Personnel</button>
          <button type="button" class="pill${layout.mode === 'professional' ? ' active' : ''}" data-mode="professional">🏢 Professionnel</button>
        </div>
        <button type="button" class="btn btn-sm" id="${elId}-customize-toggle">⚙️ ${customizing ? 'Terminer' : 'Personnaliser'}</button>
      </div>
      <div id="${elId}-customize">${customizing ? renderCustomizePanel() : ''}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        ${widgets.map(w => `
          <div${w.selfCard ? '' : ' class="card"'} id="${elId}-tile-${w.id}">
            ${w.title ? `<span class="smallcaps">${w.title}</span><div style="margin-top:10px;" id="${elId}-body-${w.id}"></div>` : `<div id="${elId}-body-${w.id}"></div>`}
          </div>`).join('')}
      </div>`;

    document.getElementById(`${elId}-mode`).querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        if(btn.dataset.mode === layout.mode) return;
        layout.mode = btn.dataset.mode;
        saveDashboardLayout(layout);
        render();
      });
    });
    document.getElementById(`${elId}-customize-toggle`).addEventListener('click', () => { customizing = !customizing; render(); });
    if(customizing){
      el.querySelectorAll('.dash-widget-toggle').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.dataset.id;
          layout.hidden = cb.checked ? layout.hidden.filter(h => h !== id) : [...layout.hidden, id];
          saveDashboardLayout(layout);
          render();
        });
      });
      el.querySelectorAll('.dash-widget-up').forEach(btn => btn.addEventListener('click', () => moveWidget(btn.dataset.id, -1)));
      el.querySelectorAll('.dash-widget-down').forEach(btn => btn.addEventListener('click', () => moveWidget(btn.dataset.id, 1)));
    }
    widgets.forEach(w => w.render(`${elId}-body-${w.id}`));
  }

  render();
}

function renderDomainDashboard(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const profileLevels = getProfile().levels || {};

  el.innerHTML = DOMAINS.map(domain => {
    const declared = profileLevels[domain.key];
    const declaredHtml = declared
      ? `${DOMAIN_LEVEL_LABELS[declared] || declared}`
      : `<span style="color:var(--text-dim);">non déclaré</span>`;

    const evaluated = getEvaluatedLevel(domain.key);
    const evaluatedHtml = evaluated
      ? `${DOMAIN_LEVEL_LABELS[evaluated.niveau] || evaluated.niveau} <span style="color:var(--text-dim);font-size:10px;">· confiance ${evaluated.confiance}</span>`
      : `<span style="color:var(--text-dim);">pas encore assez de données</span>`;

    let divergenceHtml = '';
    if(declared && evaluated){
      const gap = Math.abs(normalizeNiveau(declared) - normalizeNiveau(evaluated.niveau));
      if(gap >= 2){
        divergenceHtml = `<p class="disclaimer-box" style="margin-top:10px;">Ton niveau évalué (${DOMAIN_LEVEL_LABELS[evaluated.niveau]}) diffère nettement de ce que tu avais déclaré (${DOMAIN_LEVEL_LABELS[declared]}) — normal, le niveau déclaré n'était qu'une hypothèse de départ.</p>`;
      }
    }

    const cta = evaluated
      ? `<a href="quiz-approfondi.html?domaine=${domain.key}" class="btn btn-sm">Refaire le quiz approfondi</a>`
      : `<a href="quiz-approfondi.html?domaine=${domain.key}" class="btn btn-sm btn-gold">Évaluer mon niveau (~8 min)</a>`;

    return `
    <div class="card" style="margin-bottom:14px;">
      <span class="smallcaps">${domain.icon} ${domain.label}</span>
      <div class="business-concepts-list" style="margin-top:10px;">
        <div class="business-concept-row">
          <span class="business-concept-name">Niveau déclaré <span style="color:var(--text-dim);font-weight:400;">(hypothèse, à confirmer)</span></span>
          <span class="business-concept-label">${declaredHtml}</span>
        </div>
        <div class="business-concept-row">
          <span class="business-concept-name">Niveau évalué</span>
          <span class="business-concept-label">${evaluatedHtml}</span>
        </div>
      </div>
      ${divergenceHtml}
      <div style="margin-top:12px;">${cta}</div>
    </div>`;
  }).join('');
}

// ---------- Mon Parcours : porte d'entrée + une seule action à la fois ----------
// Règle UX : à chaque instant, une seule action principale évidente — jamais
// une liste de 6 quiz de "8 minutes" qui ressemble à une to-do list.

// Avant le premier quiz : une seule CTA, le reste de la page (missions,
// révisions) reste accessible, mais rien n'est bloqué ailleurs sur le site.
function renderParcoursGate(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <div class="card" style="max-width:600px;margin:0 auto;text-align:center;">
      <span class="smallcaps">🧭 Construisons ton expérience</span>
      <p style="color:var(--text-dim);font-size:14px;line-height:1.6;margin:12px 0 6px;">Avant de te proposer une expérience personnalisée, aide-nous simplement à mieux te connaître.</p>
      <p class="mono" style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.05em;">⏱ Environ 2 minutes · Pas de bonne ou mauvaise réponse</p>
      <a href="test-positionnement.html" class="btn btn-gold" style="margin-top:16px;">Commencer</a>
      <div class="business-concepts-list" style="margin-top:24px;text-align:left;opacity:0.5;">
        <div class="business-concept-row"><span class="business-concept-icon">🔒</span><span class="business-concept-name">Ton profil</span></div>
        <div class="business-concept-row"><span class="business-concept-icon">🔒</span><span class="business-concept-name">Tes niveaux</span></div>
        <div class="business-concept-row"><span class="business-concept-icon">🔒</span><span class="business-concept-name">Tes points forts</span></div>
        <div class="business-concept-row"><span class="business-concept-icon">🔒</span><span class="business-concept-name">Tes recommandations</span></div>
      </div>
    </div>`;
}

const LEARNING_STYLE_TAGLINE = {
  explanations: 'des explications simples',
  examples: 'des exemples concrets',
  visual: 'des schémas visuels',
  simulations: 'des simulations',
  quizzes: 'des quiz'
};
// "marketing" est un sous-intérêt de Business (voir INTEREST_QUIZ_CATEGORIES),
// pas un domaine à part entière — ramené sur "business" pour ces classements.
function normalizeToDomainKey(k){
  if(k === 'marketing') return 'business';
  return DOMAINS.some(d => d.key === k) ? k : null;
}
// Domaines réellement déclarés par l'utilisateur (objectifs puis intérêts),
// dans l'ordre où ils doivent primer — jamais un ordre inventé.
function getProfileTopDomainKeys(limit){
  const profile = getProfile();
  const goalKeys = Object.keys(profile.goals || {}).map(normalizeToDomainKey).filter(Boolean);
  const interestKeys = Object.keys(profile.interests || {}).filter(k => profile.interests[k]).map(normalizeToDomainKey).filter(Boolean);
  const ordered = [];
  goalKeys.concat(interestKeys).forEach(k => { if(!ordered.includes(k)) ordered.push(k); });
  return typeof limit === 'number' ? ordered.slice(0, limit) : ordered;
}

// Une fois le premier quiz fait : résumé du profil réel (jamais de barres
// d'intensité inventées — le premier quiz ne capture pas de classement entre
// intérêts, seulement des cases cochées).
function renderParcoursProfileSummary(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const profile = getProfile();
  const topLabels = getProfileTopDomainKeys(2).map(k => (DOMAINS.find(d => d.key === k) || {}).label).filter(Boolean);
  const styleKeys = Object.keys(profile.learningStyle || {}).filter(k => profile.learningStyle[k]);
  const styleLabel = styleKeys.length ? LEARNING_STYLE_TAGLINE[styleKeys[0]] : null;

  let tagline;
  if(topLabels.length && styleLabel){
    tagline = `Tu t'intéresses surtout à ${topLabels.join(' et à ')}, et tu préfères apprendre avec ${styleLabel}.`;
  } else if(topLabels.length){
    tagline = `Tu t'intéresses surtout à ${topLabels.join(' et à ')}.`;
  } else {
    tagline = "Ton profil est enregistré — explore librement, tes recommandations s'affineront avec le temps.";
  }

  const allInterestKeys = Object.keys(profile.interests || {}).filter(k => profile.interests[k]);
  const chipsHtml = allInterestKeys.length
    ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;">${allInterestKeys.map(k => `<span class="pill">${INTEREST_DISPLAY_LABELS[k] || k}</span>`).join('')}</div>`
    : '';

  el.innerHTML = `
    <div class="card">
      <span class="smallcaps">Ton profil Likanza</span>
      <p style="font-size:14.5px;line-height:1.6;margin-top:10px;">${tagline}</p>
      ${chipsHtml}
      <a href="test-positionnement.html" class="btn btn-sm" style="margin-top:14px;">Revoir mon profil</a>
    </div>`;
}

// Une seule recommandation d'évaluation à la fois : priorité aux domaines
// déclarés (objectifs puis intérêts) qui n'ont pas encore de niveau évalué ;
// à défaut, le premier domaine non évalué dans l'ordre du registre ; si tout
// est déjà évalué, aucune recommandation à afficher (jamais une CTA inutile).
function pickPrimaryDomainRecommendation(){
  const priorityKeys = getProfileTopDomainKeys();
  const orderedKeys = priorityKeys.concat(DOMAINS.map(d => d.key).filter(k => !priorityKeys.includes(k)));
  const found = orderedKeys.map(k => DOMAINS.find(d => d.key === k)).find(d => d && getEvaluatedLevel(d.key) === null);
  return found || null;
}

function renderNextStepRecommendation(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const primary = pickPrimaryDomainRecommendation();

  if(!primary){
    el.innerHTML = `
      <div class="card">
        <span class="smallcaps">🎯 Tes évaluations</span>
        <p style="font-size:13.5px;color:var(--text-dim);margin-top:10px;">Tous tes domaines ont déjà un niveau évalué. Continue d'explorer Likanza : ton niveau continue de s'affiner avec ton activité.</p>
      </div>`;
    return;
  }

  const hook = primary.deepQuizHook || {title:`Évaluer mon niveau en ${primary.displayLabel}`, subtitle:''};
  const others = DOMAINS.filter(d => d.key !== primary.key);
  const othersHtml = others.map(d => `<a href="quiz-approfondi.html?domaine=${d.key}" class="pill">${d.icon} ${d.label}</a>`).join('');

  el.innerHTML = `
    <div class="card">
      <span class="smallcaps">🎯 Ton prochain pas</span>
      <h3 style="margin:8px 0 4px;">${primary.icon} ${hook.title}</h3>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:12px;">${hook.subtitle}</p>
      <a href="quiz-approfondi.html?domaine=${primary.key}" class="btn btn-gold">Commencer</a>
    </div>
    <details style="margin-top:12px;">
      <summary class="smallcaps" style="cursor:pointer;">Autres évaluations disponibles</summary>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">${othersHtml}</div>
    </details>`;
}

// ---------- Concepts financiers rencontrés en Bourse (fiches actions,
// comparateur...) : jamais une mesure de maîtrise — ça, c'est le rôle de
// recordAnswer/getSkillMastery, qui exigent une vraie évaluation (bonne/
// mauvaise réponse). Consulter un PER ou un rendement de dividende n'est
// qu'une EXPOSITION, jamais une réussite : cette trace sert uniquement à
// relier la Bourse au moteur de recommandation ("prochaine étape" ci-
// dessous), jamais à gonfler artificiellement un pourcentage de maîtrise.
// Corrige la déconnexion Bourse ↔ modèle de compétences identifiée par
// l'audit du 2026-08-20 (section H). ----------
function getEncounteredConcepts(){
  return safeGetJSON('fzr-concepts-encountered', {});
}
function recordConceptEncounter(categories){
  if(!Array.isArray(categories) || categories.length === 0) return;
  const map = getEncounteredConcepts();
  const now = new Date().toISOString();
  categories.forEach(cat => {
    if(!cat) return;
    if(!map[cat]) map[cat] = {count: 0, firstSeenAt: now, lastSeenAt: now};
    map[cat].count += 1;
    map[cat].lastSeenAt = now;
  });
  safeSetJSON('fzr-concepts-encountered', map);
}

// Détecte, à partir des vrais champs fondamentaux ET des vrais indicateurs
// techniques déjà affichés sur une fiche action, quelles catégories de quiz
// RÉELLEMENT existantes (jamais une catégorie inventée) correspondent aux
// notions montrées à l'utilisateur — pour pouvoir les relier honnêtement à
// la Bibliothèque/aux Défis via getNextStepSuggestion.
function detectBourseConceptsFromFundamentals(ff, tech){
  const categories = new Set();
  if(ff){
    if(typeof ff.trailingPE === 'number') categories.add('Actions'); // PER
    if(typeof ff.returnOnEquity === 'number') categories.add('Actions'); // ROE
    if(typeof ff.dividendYield === 'number') categories.add('Bourse'); // rendement du dividende
  }
  if(tech && (typeof tech.rsi14 === 'number' || tech.bollinger)) categories.add('Analyse technique');
  return [...categories];
}

// ---------- Moteur "prochaine étape" universel ----------
// Une seule recommandation concrète et réelle, jamais une CTA générique.
// Ordre de priorité : (1) notion faible tout juste travaillée dans cette
// session (ctx.categories, écrite par recordAnswer avant l'appel — jamais
// une supposition), (2) erreurs non résolues du site entier, (3) notion
// faible dans le domaine concerné, (4) généralise pickPrimaryDomainRecommendation
// (réutilisée par référence, jamais dupliquée), (5) repli honnête vers Mon
// Parcours. Lit la maîtrise par concept, ne recalcule jamais sa propre
// détection de faiblesse en parallèle.
function getNextStepSuggestion(ctx){
  ctx = ctx || {};

  if(Array.isArray(ctx.categories) && ctx.categories.length){
    const weakTouched = ctx.categories
      .map(getConceptMastery)
      .filter(m => m && (m.stage === 'decouvert' || m.stage === 'compris'))
      .sort((a, b) => a.pct - b.pct)[0];
    if(weakTouched){
      return {
        label: `S'entraîner sur ${weakTouched.categorie} →`,
        url: `defis.html?cat=${encodeURIComponent(weakTouched.categorie)}`,
        reason: weakTouched.stage === 'decouvert'
          ? `Tu découvres tout juste "${weakTouched.categorie}" (${weakTouched.pct}% de bonnes réponses) — quelques exercices de plus pour bien comprendre.`
          : `Tu comprends "${weakTouched.categorie}" (${weakTouched.pct}% de bonnes réponses), mais pas encore sur des cas concrets.`
      };
    }
  }

  const unresolved = getMistakes().filter(m => !m.resolved);
  if(unresolved.length){
    const counts = {};
    unresolved.forEach(m => { counts[m.categorie] = (counts[m.categorie] || 0) + 1; });
    const [cat] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      label: `Revoir ${cat} →`,
      url: `defis.html?cat=${encodeURIComponent(cat)}`,
      reason: `Des notions en attente de révision, surtout en ${cat}.`
    };
  }

  const domain = ctx.domainKey
    ? DOMAINS.find(d => d.key === ctx.domainKey)
    : (Array.isArray(ctx.categories) && ctx.categories.length ? DOMAINS.find(d => d.quizCategories.includes(ctx.categories[0])) : null);
  if(domain){
    const weakInDomain = getAllConceptMastery().find(m => domain.quizCategories.includes(m.categorie) && m.stage !== 'maitrise');
    if(weakInDomain){
      return {
        label: `Continuer en ${weakInDomain.categorie} →`,
        url: `defis.html?cat=${encodeURIComponent(weakInDomain.categorie)}`,
        reason: `Encore à consolider en ${domain.label}.`
      };
    }
  }

  const primary = pickPrimaryDomainRecommendation();
  if(primary){
    const hook = primary.deepQuizHook || {title: `Évaluer mon niveau en ${primary.displayLabel}`};
    return {
      label: 'Évaluer mon niveau →',
      url: `quiz-approfondi.html?domaine=${primary.key}`,
      reason: hook.title
    };
  }

  return {
    label: 'Voir mon parcours →',
    url: 'parcours.html',
    reason: "Continue d'explorer : ton profil continue de s'affiner."
  };
}

// Composant réutilisable : un bloc "prochaine étape" à brancher sur n'importe
// quel écran de résultat (Défis, quiz approfondi, cours, mission, jeux...).
function renderNextStepCard(elId, ctx){
  const el = document.getElementById(elId);
  if(!el) return;
  const step = getNextStepSuggestion(ctx);
  el.innerHTML = `
    <div class="card" style="margin-top:16px;">
      <span class="smallcaps">🎯 Prochaine étape</span>
      <p style="font-size:13.5px;color:var(--text-dim);margin:8px 0 12px;">${step.reason}</p>
      <a href="${step.url}" class="btn btn-sm btn-gold">${step.label}</a>
    </div>`;
}

const LEVEL_TIPS = {
  debutant: "Pas besoin de retenir tous les chiffres pour l'instant. Comprends d'abord le principe.",
  intermediaire: "Tu connais déjà ce principe : regarde maintenant ce qui peut modifier le résultat.",
  avance: "Passons directement aux hypothèses et aux limites du modèle.",
  expert: "Passons directement aux hypothèses et aux limites du modèle."
};
// Discret par nature : à n'appeler qu'une fois par page, à un endroit où le
// conseil apporte une vraie valeur (jamais en répétition sur plusieurs blocs).
function renderLevelTip(elId, domainKey){
  const el = document.getElementById(elId);
  if(!el) return;
  const level = getDomainLevel(domainKey);
  const text = LEVEL_TIPS[level];
  if(!text){ el.innerHTML = ''; return; }
  renderConseilBadge(elId, {text, tone:'neutral'});
}

// ---------- Conseil Likanza : recommandations adaptées au niveau (composant réutilisable) ----------
const NIVEAU_RANK = {debutant:0, 'débutant':0, intermediaire:1, 'intermédiaire':1, avance:2, 'avancé':2, expert:3};
function normalizeNiveau(v){
  if(!v) return null;
  const key = String(v).toLowerCase();
  return key in NIVEAU_RANK ? NIVEAU_RANK[key] : null;
}
function getPositioningResult(){ return safeGetJSON('fzr-positioning-result', null); }
// Historiquement basé sur le score noté de l'ancien test de positionnement
// (retiré : le premier quiz est désormais 100% déclaratif, sans question
// notée). Réécrit pour s'appuyer sur la vraie maîtrise en direct
// (getSkillMastery, alimentée par Défis/cours/quiz approfondis) — une
// source plus fiable, mise à jour en continu plutôt qu'un instantané figé.
function getWeakCategoryLabel(categorieOuTerme){
  if(!categorieOuTerme) return null;
  const weak = getSkillMastery().find(m =>
    m.niveau === 'faible' && m.categorie.toLowerCase() === String(categorieOuTerme).toLowerCase());
  return weak ? weak.categorie : null;
}
// Renvoie {text, tone} ou null si le niveau de l'item/utilisateur est inconnu.
// `opts.weakCategory` (optionnel) priorise un message lié à une faiblesse détectée.
function pickConseilMessage(itemNiveau, opts){
  opts = opts || {};
  const itemRank = normalizeNiveau(itemNiveau);
  const userRank = normalizeNiveau(getLevel());
  if(itemRank === null || userRank === null) return null;

  if(opts.weakCategory){
    const pool = [
      `Ton test de positionnement montre que "${opts.weakCategory}" mérite d'être renforcé : cette notion peut t'y aider.`,
      `Notion liée à une faiblesse détectée dans ton test (${opts.weakCategory}) : à ne pas sauter.`,
      `Ton bilan indique une marge de progression en ${opts.weakCategory} : utile de s'y arrêter maintenant.`
    ];
    return {text: pool[Math.floor(Math.random()*pool.length)], tone:'warn'};
  }

  const diff = itemRank - userRank;
  let pool, tone;
  if(diff <= -2){
    pool = [
      "Tu maîtrises probablement déjà cette notion : une révision rapide peut suffire.",
      "Plutôt destiné aux débutants ; à ton niveau, ça peut surtout servir de rappel.",
      "Tu connais sans doute déjà l'essentiel ici : libre à toi de passer directement plus loin."
    ];
    tone = 'muted';
  } else if(diff === -1){
    pool = [
      "Tu as probablement déjà vu l'essentiel de cette notion : une relecture rapide ne fait pas de mal.",
      "Un peu en-dessous de ton niveau actuel, utile comme piqûre de rappel."
    ];
    tone = 'muted';
  } else if(diff === 0){
    pool = [
      "Recommandé pour ton niveau actuel.",
      "Ce contenu correspond bien à ton niveau du moment.",
      "Pile ton niveau : une bonne notion à consolider maintenant."
    ];
    tone = 'good';
  } else if(diff === 1){
    pool = [
      "Un peu plus avancé que ton niveau actuel, mais accessible si les bases sont solides.",
      "Cette notion va un peu plus loin : tu peux t'y risquer si tu es à l'aise avec les fondamentaux."
    ];
    tone = 'neutral';
  } else {
    pool = [
      "Cette notion est plus avancée que ton niveau actuel. Tu peux tout de même l'ouvrir.",
      "Contenu avancé : rien ne t'empêche de le consulter, mais les bases restent utiles avant.",
      "Plus technique que ton niveau du moment ; à garder de côté pour plus tard si besoin."
    ];
    tone = 'warn';
  }
  return {text: pool[Math.floor(Math.random()*pool.length)], tone};
}
function renderConseilBadge(elId, conseil){
  const el = document.getElementById(elId);
  if(!el) return;
  if(!conseil){ el.innerHTML = ''; return; }
  const colors = {good:'var(--emerald)', warn:'var(--gold-bright)', muted:'var(--text-dim)', neutral:'var(--hairline)'};
  el.innerHTML = `<p class="conseil-likanza" style="border-left:2px solid ${colors[conseil.tone]||'var(--gold)'};padding-left:10px;font-size:12px;color:var(--text-dim);margin-top:8px;">${ICONS.lightbulb} ${conseil.text}</p>`;
}

// ---------- Ouverture / fermeture des places boursières (calcul local, sans API) ----------
function getMarketStatus(exchangeKey){
  const conf = MARKET_HOURS[exchangeKey];
  if(!conf) return null;
  try{
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {timeZone: conf.tz, hour:'numeric', minute:'numeric', hour12:false, weekday:'short'}).formatToParts(now);
    const weekday = parts.find(p=>p.type==='weekday').value;
    const hour = Number(parts.find(p=>p.type==='hour').value);
    const minute = Number(parts.find(p=>p.type==='minute').value);
    const decimalTime = hour + minute/60;
    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const isOpen = !isWeekend && decimalTime >= conf.open && decimalTime < conf.close;
    return {isOpen, label: conf.label, localTime: `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`};
  }catch(err){
    return null; // fuseau horaire indisponible dans cet environnement
  }
}

// ---------- Bannière mode démonstration ----------
function renderDemoBanner(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `<div class="demo-banner">Mode démonstration : les fiches et simulateurs de cette page utilisent des données de démonstration. Seul le bandeau de marché est alimenté automatiquement en données différées (Yahoo Finance · CoinGecko), avec repli sur la dernière clôture connue.</div>`;
}

// ---------- Panneau de marché ----------
function renderMarketPanel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = MARKET_DATA.map(it=>{
    const marketInfo = it.exchange ? getMarketStatus(it.exchange) : (it.assetType==='crypto' ? {isOpen:true, label:'Marché crypto', localTime:null} : null);
    const openBadge = marketInfo ? `<span class="badge ${marketInfo.isOpen?'status-reel':'status-demo'}" title="${marketInfo.label}">${marketInfo.isOpen ? 'Ouvert' : 'Fermé'}</span>` : '';
    return `
    <div class="panel-row">
      <span>${it.nom} <span class="mono" style="font-size:10px;color:var(--text-dim);">${it.symbol}</span></span>
      <span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
        ${openBadge}
        <span class="badge status-${it.statut}" title="Source : ${it.source} · Mis à jour : ${it.maj} ${it.heure!=='—'?it.heure:''}">${it.statusLabel}</span>
        <span class="val ${it.sens}">${it.variation}</span>
      </span>
    </div>`;
  }).join('');
}

// ---------- Cartes d'actualités ----------
function renderNewsCards(elId, filter){
  const el = document.getElementById(elId);
  if(!el) return;
  const items = filter && filter !== 'Toutes' ? NEWS_DATA.filter(n=>n.categorie===filter) : NEWS_DATA;
  el.innerHTML = items.map(a=>`
    <div class="card" id="${a.id}">
      <span class="smallcaps">${a.categorie}</span>
      <h3>${a.titre}</h3>
      <p>${a.resume}</p>
      ${a.points ? `<ul style="color:var(--text-dim);font-size:13px;margin:0 0 12px 18px;">${a.points.slice(0,2).map(p=>`<li style="margin-bottom:4px;">${p}</li>`).join('')}</ul>` : ''}
      <div class="card-footer">
        <span>${a.lecture} de lecture · ${a.date}</span>
        <span class="badge status-${a.statut}">source citée</span>
      </div>
      <div class="card-footer" style="margin-top:8px;">
        <a href="${a.lien}" target="_blank" rel="noopener" class="btn btn-sm">Lire l'article original ↗</a>
        <button class="fav-btn" data-fav-id="news-${a.id}" data-fav-title="${a.titre}" data-fav-url="actualites.html#${a.id}" data-fav-type="Actualité">${ICONS.star}</button>
      </div>
    </div>`).join('');
  initFavButtons();
}

// ---------- Cours par niveau ----------
function renderCourseList(elId, level){
  const el = document.getElementById(elId);
  if(!el || !COURSES[level]) return;
  el.innerHTML = COURSES[level].map((c,i)=>`
    <div class="course-item">
      <button type="button" class="head" style="background:none;border:none;width:100%;text-align:left;font:inherit;" onclick="this.nextElementSibling.classList.toggle('open')">
        <h4>${c.title}</h4>
        <span class="idx">${String(i+1).padStart(2,'0')}</span>
      </button>
      <div class="course-body"><div class="course-body-inner">${c.body || ''}</div></div>
    </div>`).join('');
}

// ---------- Gamification (XP, niveaux, séries, badges) ----------
// Chaque titre embarque son icône SVG (rendu via innerHTML uniquement).
const LEVEL_TITLES = [
  `${ICONS.sprout} Épargnant`, `${ICONS['book-open']} Curieux`, `${ICONS.search} Apprenti Analyste`,
  `${ICONS['trending-up']} Investisseur`, `${ICONS.briefcase} Analyste`, `${ICONS.target} Stratège Débutant`,
  `${ICONS.landmark} Stratège`, `${ICONS.telescope} Visionnaire`, `${ICONS.shield} Gestionnaire de Risque`,
  `${ICONS.gem} Investisseur Chevronné`, `${ICONS.castle} Architecte du Patrimoine`, `${ICONS.crown} Maître Likanza`
];
// Phrases d'accueil du tableau de bord : une piochée au hasard à chaque
// ouverture (plus de logique liée à l'heure de la journée), + un slogan fixe.
const WELCOME_PHRASES = [
  "Bienvenue dans ton aventure",
  "Prêt à progresser aujourd'hui ?",
  "Ravi de te revoir",
  "Ton argent, tes règles",
  "La finance, enfin claire",
  "Chaque jour compte",
  "De retour pour apprendre",
  "Construisons ton avenir",
  "Bienvenue chez toi",
  "En route vers l'indépendance"
];
const BRAND_SLOGAN = "Apprends la finance. À ton rythme.";

const BADGES = [
  {id:'first_module', name:'Première mission', desc:"Terminer ta première mission.", check:(g,ctx)=> !!(ctx && ctx.moduleCompleted)},
  {id:'level_complete', name:'Parcours terminé', desc:"Terminer toutes les missions d'un niveau.", check:(g,ctx)=> !!(ctx && ctx.levelJustCompleted)},
  {id:'streak_3', name:'3 jours de suite', desc:"Revenir 3 jours d'affilée.", check:(g)=> g.streak >= 3},
  {id:'streak_7', name:'Une semaine de suite', desc:"Revenir 7 jours d'affilée.", check:(g)=> g.streak >= 7},
  {id:'streak_30', name:'30 jours de série', desc:"Revenir 30 jours d'affilée.", check:(g)=> g.streak >= 30},
  {id:'quiz_perfect', name:'Champion des quiz', desc:"Réussir une épreuve sans erreur.", check:(g,ctx)=> !!(ctx && ctx.quizPerfect)},
  {id:'combo_5', name:'Combo x5', desc:"Enchaîner 5 bonnes réponses d'affilée dans un défi.", check:(g,ctx)=> !!(ctx && ctx.combo >= 5)},
  {id:'combo_10', name:'Combo parfait', desc:"Enchaîner 10 bonnes réponses d'affilée dans un défi.", check:(g,ctx)=> !!(ctx && ctx.combo >= 10)},
  {id:'explorer', name:'Explorateur', desc:"Répondre à des questions dans au moins 10 thèmes différents.", check:()=> Object.keys(getQuizStats().categoryStats).length >= 10},
  {id:'level_5', name:'Niveau 5 atteint', desc:"Atteindre le niveau 5.", check:(g)=> levelFromXP(g.xp).level >= 5},
  {id:'level_10', name:'Niveau 10 atteint', desc:"Atteindre le niveau 10.", check:(g)=> levelFromXP(g.xp).level >= 10},
  {id:'fp_500', name:'500 Finance Points', desc:"Accumuler 500 Finance Points.", check:(g)=> g.financePoints >= 500},
  {id:'fp_1000', name:'1000 Finance Points', desc:"Accumuler 1000 Finance Points.", check:(g)=> g.financePoints >= 1000},
  {id:'first_dca', name:'Premier DCA', desc:"Utiliser le comparateur DCA vs investissement unique.", check:(g,ctx)=> !!(ctx && ctx.usedDCA)},
  // Le flag usedSimulator est partagé par >10 fonctionnalités très différentes
  // (Laboratoire, Paper Trading, Business Game, Portfolio Game, Market Panic,
  // simulateur Gouverneur...) — le nom du badge doit rester assez générique
  // pour être vrai quel que soit le déclencheur réel (audit du 2026-08-20,
  // section G) : jamais "Premier laboratoire" pour quelqu'un qui n'a jamais
  // ouvert laboratoire.html.
  {id:'first_sim', name:'Première simulation', desc:"Utiliser un simulateur du site (Laboratoire, Paper Trading, Business Game, Portfolio Game, Market Panic...).", check:(g,ctx)=> !!(ctx && ctx.usedSimulator)},
  {id:'positioning_test', name:'Bilan effectué', desc:"Terminer le test de positionnement.", check:(g,ctx)=> !!(ctx && ctx.positioningTestDone)},
  {id:'first_cours', name:'Premier cours', desc:"Réussir le quiz de validation d'un cours.", check:(g,ctx)=> !!(ctx && ctx.coursCompleted)},
  {id:'mistake_slayer', name:'Retour gagnant', desc:"Corriger 5 anciennes erreurs.", check:(g,ctx)=> !!(ctx && ctx.totalResolved >= 5)},
  {id:'memory_perfect', name:'Mémoire d\'éléphant', desc:"Terminer une partie de Memory Finance sans erreur.", check:(g,ctx)=> !!(ctx && ctx.memoryPerfect)},
  {id:'first_paper_trade', name:'Premier trade simulé', desc:"Passer un premier ordre en Paper Trading.", check:(g,ctx)=> !!(ctx && ctx.paperTradeExecuted)},
  {id:'paper_gain', name:'Premier gain réalisé', desc:"Réaliser un gain sur une vente en Paper Trading.", check:(g,ctx)=> !!(ctx && ctx.paperRealizedGain > 0)}
];

// ---------- Ligues (classement de démonstration, pas de vrais autres joueurs) ----------
const LEAGUES = [
  {id:'bronze', name:'Bronze', min:0},
  {id:'argent', name:'Argent', min:150},
  {id:'or', name:'Or', min:400},
  {id:'platine', name:'Platine', min:800},
  {id:'diamant', name:'Diamant', min:1500},
  {id:'legende', name:'Légende', min:3000}
];
const DEMO_PLAYERS = [
  {name:'Léa M.', fp:2140}, {name:'Yanis B.', fp:1620}, {name:'Chloé R.', fp:980},
  {name:'Nathan P.', fp:710}, {name:'Sofia K.', fp:540}, {name:'Hugo D.', fp:310},
  {name:'Emma L.', fp:190}, {name:'Adam T.', fp:95}, {name:'Camille V.', fp:40}
];
function currentLeague(fp){
  let league = LEAGUES[0];
  LEAGUES.forEach(l=>{ if(fp >= l.min) league = l; });
  return league;
}
function renderLeagueBoard(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const g = getGamification();
  const league = currentLeague(g.xp);
  const board = [...DEMO_PLAYERS, {name:'Toi', fp:g.xp, isUser:true}]
    .filter(p=>currentLeague(p.fp).id === league.id)
    .sort((a,b)=>b.fp-a.fp);
  el.innerHTML = `
    <div class="gami-widget">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="smallcaps">Ligue ${league.name}</span>
        <span class="demo-flag" style="margin:0;">Classement de démo</span>
      </div>
      <p style="font-size:11.5px;color:var(--text-dim);margin-bottom:14px;">Classement basé sur l'XP, comparé à des profils fictifs : le vrai classement entre joueurs nécessite un compte et un serveur, pas encore disponible.</p>
      <div class="league-list">
        ${board.map((p,i)=>`<div class="league-row ${p.isUser?'is-user':''}"><span>${i+1}. ${p.name}</span><span class="mono">${p.fp} XP</span></div>`).join('')}
      </div>
    </div>`;
}

function getGamification(){
  const g = safeGetJSON('fzr-gamification', {xp:0, financePoints:0, streak:0, lastVisit:null, badges:[]});
  if(g.financePoints === undefined) g.financePoints = g.xp; // migration en douceur depuis l'ancien système à monnaie unique
  if(g.streakFreezes === undefined) g.streakFreezes = 0; // migration en douceur : tolérance de série (voir checkDailyStreak)
  if(g.pendingStreakBonus === undefined) g.pendingStreakBonus = 0; // migration en douceur : voir checkDailyStreak/awardXP
  return g;
}
function saveGamification(g){ safeSetJSON('fzr-gamification', g); }

function levelFromXP(xp){
  const level = Math.floor(xp/100) + 1;
  const title = LEVEL_TITLES[Math.min(level-1, LEVEL_TITLES.length-1)];
  const xpInLevel = xp % 100;
  return {level, title, xpInLevel};
}

// ---------- Multiplicateur de série : plus la série de connexion quotidienne
// est longue, plus les gains (quiz, bonus de connexion) sont bonifiés. ----------
function streakMultiplier(streak){
  if(streak >= 30) return 1.5;
  if(streak >= 14) return 1.3;
  if(streak >= 7) return 1.15;
  return 1;
}

// ---------- Tolérance de série : jusqu'ici, un seul jour manqué remettait
// la série à 1, sans aucune marge. g.streakFreezes se régénère +1 tous les
// 7 jours de série réelle (plafonné à 2) et se consomme automatiquement
// quand exactement un jour a été manqué (pas plus) — au-delà, la série
// repart bien à 1 comme avant. ----------
function checkDailyStreak(){
  const g = getGamification();
  const today = new Date().toDateString();
  if(g.lastVisit === today){ logActivity(); return g; }
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const twoDaysAgo = new Date(Date.now() - 2*86400000).toDateString();
  if(g.lastVisit === yesterday){
    g.streak += 1;
  } else if(g.lastVisit === twoDaysAgo && g.streakFreezes > 0){
    g.streakFreezes -= 1;
    g.streak += 1;
  } else {
    g.streak = 1;
  }
  if(g.streak > 0 && g.streak % 7 === 0) g.streakFreezes = Math.min(2, g.streakFreezes + 1);
  g.lastVisit = today;
  // Le bonus de série n'est JAMAIS crédité ici (une simple ouverture de page,
  // sans aucune activité réelle) : il est mis en attente et crédité par
  // awardXP() dès la première vraie activité pédagogique du jour (quiz,
  // défi, cours, jeu...). Avant ce correctif, ouvrir n'importe quelle page
  // une fois par jour suffisait à faire progresser XP et niveau sans jamais
  // rien apprendre — audit du 2026-08-20, section G.
  g.pendingStreakBonus = Math.round(15 * streakMultiplier(g.streak));
  saveGamification(g);
  checkBadges(g, {}); // les badges de série (streak_3/7/30) restent liés au nombre de jours, pas à l'XP
  logActivity();
  return g;
}

// ---------- Activité hebdomadaire (jours distincts actifs sur les 7 derniers jours) ----------
const WEEKLY_GOAL_DAYS = 5;
function logActivity(){
  const log = safeGetJSON('fzr-activity-log', []);
  const today = new Date().toDateString();
  if(!log.includes(today)){
    log.push(today);
    const cutoff = Date.now() - 30*86400000; // on garde 30 jours max, pas besoin de plus
    const trimmed = log.filter(d => new Date(d).getTime() >= cutoff);
    safeSetJSON('fzr-activity-log', trimmed);
  }
}
function getWeeklyActivityDays(){
  const log = safeGetJSON('fzr-activity-log', []);
  const cutoff = Date.now() - 7*86400000;
  return log.filter(d => new Date(d).getTime() >= cutoff).length;
}

// awardXP fait gagner à la fois de l'XP (fait progresser le niveau/rang) et des
// Finance Points. Les deux valeurs sont aujourd'hui strictement identiques
// (aucun mécanisme de dépense n'existe nulle part dans le code) — stockées et
// affichées séparément pour pouvoir diverger plus tard si un vrai mécanisme
// de dépense est construit, mais l'interface ne doit jamais promettre un
// usage ("à dépenser") qui n'existe pas encore (audit du 2026-08-20,
// section G) : voir le libellé dans renderGamificationWidget.
function awardXP(amount, ctx){
  const g = getGamification();
  let finalAmount = Math.round(amount * streakMultiplier(g.streak));
  // Première vraie activité du jour : encaisse aussi le bonus de série mis
  // en attente par checkDailyStreak (jamais crédité pour la seule ouverture
  // d'une page — voir ce commentaire).
  if(g.pendingStreakBonus > 0){
    finalAmount += g.pendingStreakBonus;
    g.pendingStreakBonus = 0;
  }
  g.xp += finalAmount;
  g.financePoints += finalAmount;
  logActivity();
  saveGamification(g);
  checkBadges(g, ctx || {});
  return g;
}

function checkBadges(g, ctx){
  let updated = false;
  BADGES.forEach(b=>{
    if(!g.badges.includes(b.id) && b.check(g, ctx)){
      g.badges.push(b.id);
      updated = true;
      showBadgeToast(b);
    }
  });
  if(updated) saveGamification(g);
}

function showBadgeToast(badge){
  const toast = document.createElement('div');
  toast.className = 'badge-toast';
  toast.innerHTML = `<strong>${ICONS.medal} ${badge.name}</strong><br><span>${badge.desc}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(()=>toast.classList.add('show'));
  setTimeout(()=>{ toast.classList.remove('show'); setTimeout(()=>toast.remove(), 400); }, 3600);
}

function renderGamificationWidget(elId, full){
  const el = document.getElementById(elId);
  if(!el) return;
  const g = getGamification();
  const lvl = levelFromXP(g.xp);
  const earnedCount = g.badges.length;
  const mult = streakMultiplier(g.streak);
  el.innerHTML = `
    <div class="gami-widget">
      <div class="gami-top">
        <div style="flex:1;">
          <span class="smallcaps">Niveau ${lvl.level} · ${lvl.title}</span>
          <div class="gami-xpbar"><div class="gami-xpfill" id="gamiXpFill-${elId}" style="width:0%;"></div></div>
          <p style="font-size:11px;color:var(--text-dim);margin-top:4px;">${lvl.xpInLevel} / 100 XP · ${g.xp} XP au total${mult>1?` · bonus série x${mult}`:''}</p>
        </div>
        <div class="gami-streak">${ICONS.flame} <strong>${g.streak}</strong><span>jour${g.streak>1?'s':''}</span></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid var(--hairline);">
        <span style="font-size:12.5px;color:var(--text-dim);">${ICONS.coins} Finance Points (récompense cumulée)</span>
        <span class="mono" style="font-size:15px;color:var(--gold-bright);font-weight:600;">${g.financePoints}</span>
      </div>
      ${full ? `<div class="gami-badges">${BADGES.map(b=>{
          const earned = g.badges.includes(b.id);
          return `<div class="gami-badge ${earned?'earned':''}" title="${b.desc}"><span>${earned?ICONS.medal:ICONS.lock}</span>${b.name}</div>`;
        }).join('')}</div>` : `<p style="font-size:12px;color:var(--text-dim);margin-top:10px;">${earnedCount} badge${earnedCount>1?'s':''} débloqué${earnedCount>1?'s':''} sur ${BADGES.length}</p>`}
    </div>`;
  animateWidthIn(document.getElementById('gamiXpFill-'+elId), lvl.xpInLevel);
}

// ---------- Quiz réutilisable ----------
const QUIZ_BANK = [
  {q:"Qu'est-ce qu'une action, au fond ?", options:["Une part de propriété dans une entreprise","Un prêt fait à une entreprise","Une garantie de gain à la revente","Un type de compte bancaire"], correct:0, explain:"Une action représente une part du capital d'une entreprise, avec un droit sur ses bénéfices, mais aucune garantie de gain."},
  {q:"Le PEA permet notamment de...", options:["Investir en actions européennes avec une fiscalité allégée après 5 ans","Garantir un capital sans aucun risque","Emprunter de l'argent sans intérêt","Éviter totalement tout impôt sur le revenu"], correct:0, explain:"Le PEA offre un cadre fiscal avantageux après un certain délai, mais le capital investi n'est jamais garanti."},
  {q:"À quoi sert principalement un ETF ?", options:["Prédire les cours de bourse à l'avance","Répliquer la performance d'un indice en un seul produit","Garantir un rendement fixe de 10% par an","Remplacer un compte courant classique"], correct:1, explain:"Un ETF regroupe de nombreux titres pour suivre un indice, ce qui répartit le risque entre plusieurs entreprises."},
  {q:"Pourquoi diversifier un portefeuille ?", options:["Pour être certain de gagner davantage","Parce que la loi l'impose","Pour réduire la dépendance à un seul actif ou secteur","Pour payer moins d'impôts automatiquement"], correct:2, explain:"Diversifier répartit le risque entre plusieurs actifs, sans supprimer le risque global."},
  {q:"Les intérêts composés, c'est...", options:["Un impôt spécifique sur les gains boursiers","Gagner des intérêts sur les intérêts déjà accumulés","Une commission prélevée par la banque","Un type de prêt étudiant"], correct:1, explain:"Chaque année, les gains passés génèrent eux-mêmes des gains : un effet cumulatif qui rend le temps précieux."},
  {q:"Le PER (Price Earning Ratio) sert à...", options:["Comparer le prix d'une action à ses bénéfices","Mesurer la dette d'une entreprise","Calculer un dividende garanti","Prévoir l'inflation"], correct:0, explain:"Le PER met en relation le cours de l'action et le bénéfice par action, pour juger si une valorisation est tendue ou non."},
  {q:"La volatilité d'un actif mesure...", options:["Sa probabilité de faire faillite","L'ampleur de ses variations de prix","Le montant de ses dividendes","Sa capitalisation boursière"], correct:1, explain:"La volatilité reflète l'ampleur des mouvements de prix, à la hausse comme à la baisse, pas le risque de faillite en soi."}
];
// ---------- Défi rapide (1 question, pour le tableau de bord) ----------
function dayOfYear(){
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}
// ---------- Notion du jour (rotation quotidienne stable, personnalisée par intérêt) ----------
// Si le profil a un intérêt enregistré (test de positionnement), la rotation
// reste déterministe mais se fait dans le sous-ensemble réel de LIBRARY
// correspondant à cet intérêt plutôt que dans la bibliothèque entière —
// dégradation silencieuse vers la rotation globale si aucun intérêt n'est
// encore connu ou si le sous-ensemble est vide.
// Dérivés du registre unique DOMAINS (scripts/app.js) — plus une entrée
// "marketing" conservée à part : c'est une nuance d'intérêt à l'intérieur du
// Business, pas un 7e domaine (voir le commentaire sur DOMAINS dans app.js).
const INTEREST_LIBRARY_CATEGORIES = Object.fromEntries(DOMAINS.map(d => [d.key, d.libraryCategories]));
INTEREST_LIBRARY_CATEGORIES.marketing = ['Business'];
// Même principe, mais pointant vers la taxonomie propre à
// QUIZ_BANK_FULL/MENTAL_CHALLENGES (Défis) — les deux taxonomies sont
// volontairement différentes (glossaire vs. questions).
const INTEREST_QUIZ_CATEGORIES = Object.fromEntries(DOMAINS.map(d => [d.key, d.quizCategories]));
INTEREST_QUIZ_CATEGORIES.marketing = ["Chiffre d'affaires", 'Marge nette', 'Startup'];
function getNotionOfDay(){
  const profile = getProfile();
  const topInterest = Object.keys(profile.interests || {}).find(k => profile.interests[k]);
  if(topInterest && INTEREST_LIBRARY_CATEGORIES[topInterest]){
    const pool = LIBRARY.filter(l => INTEREST_LIBRARY_CATEGORIES[topInterest].includes(l.categorie));
    if(pool.length) return pool[dayOfYear() % pool.length];
  }
  return LIBRARY[dayOfYear() % LIBRARY.length];
}

// ---------- Missions renouvelables (quotidiennes / hebdomadaires) ----------
// Couche additionnelle au-dessus des missions fixes de COURSES (formations.html) :
// celles-ci ne s'épuisent jamais, se régénèrent chaque jour/semaine à partir
// de gabarits, et s'adaptent au niveau/intérêts/progression réels de
// l'utilisateur. N'utilise jamais fzr-progress (clé des missions fixes) :
// stockage dédié (fzr-daily-missions-log / fzr-weekly-missions-log), aucune
// collision possible avec le système existant.
const MISSION_TEMPLATES = [
  {id:'decouvrir-concept', xp:5, build(){
    const n = getNotionOfDay();
    return {title:'Découvrir 1 concept', desc:`Lis la notion « ${n.terme} » dans la Bibliothèque.`, href:`bibliotheque.html#${encodeURIComponent(n.terme.replace(/\s+/g,'-'))}`};
  }},
  {id:'terminer-lecon', xp:10, build(){
    const progress = getCoursProgress();
    const next = COURS_CATALOG.find(c=>!progress[c.id]);
    if(!next) return null;
    return {title:'Terminer une leçon', desc:`Termine le cours « ${next.titre} » et son quiz de validation.`, href:`cours.html#${encodeURIComponent(next.id)}`};
  }},
  {id:'repondre-questions', xp:8, build(){
    return {title:'Répondre à 5 questions', desc:'Réponds à 5 questions dans les Défis pour tester tes connaissances.', href:'defis.html'};
  }},
  {id:'analyser-actualite', xp:5, build(){
    return {title:'Analyser une actualité', desc:"Lis une actualité de la semaine et repère pourquoi elle compte pour toi.", href:'actualites.html'};
  }},
  {id:'tester-simulateur', xp:5, build(){
    return {title:'Tester un simulateur', desc:'Ouvre un simulateur et modifie au moins une variable pour voir son effet.', href:'laboratoire.html'};
  }},
  {id:'sujet-nouveau', xp:5, build(){
    const profile = getProfile();
    const knownKeys = Object.keys(profile.interests || {}).filter(k=>profile.interests[k]);
    const knownCats = knownKeys.flatMap(k => INTEREST_LIBRARY_CATEGORIES[k] || []);
    const allCats = [...new Set(LIBRARY.map(l=>l.categorie))];
    const unknownCats = allCats.filter(c=>!knownCats.includes(c));
    const pool = (knownCats.length && unknownCats.length) ? LIBRARY.filter(l=>unknownCats.includes(l.categorie)) : LIBRARY;
    const n = pool[dayOfYear() % pool.length];
    return {title:'Découvrir un sujet hors de ta zone habituelle', desc:`Explore « ${n.terme} » (${n.categorie}), un thème différent de tes habitudes.`, href:`bibliotheque.html#${encodeURIComponent(n.terme.replace(/\s+/g,'-'))}`};
  }},
  {id:'etape-business', xp:8, domainKey:'business', build(){
    return {title:'Compléter une étape Business', desc:'Avance d\'une étape dans « Construis ton projet ».', href:'construire-son-projet.html'};
  }},
  {id:'comparer-actifs', xp:5, domainKey:'stockMarket', build(){
    return {title:'Comparer deux actifs', desc:'Utilise le comparateur pour comparer deux actions ou ETF entre eux.', href:'bourse.html'};
  }},
  {id:'revoir-notion', xp:8, build(){
    const mistakes = getMistakes().filter(m=>!m.resolved);
    if(!mistakes.length) return null;
    const m = mistakes[0];
    return {title:'Revoir une notion mal comprise', desc:`Retravaille « ${m.categorie} » dans les Défis, d'après tes vraies erreurs de quiz.`, href:`defis.html?cat=${encodeURIComponent(m.categorie)}`};
  }}
];
// themeDomainKey (optionnel) : biais léger de sélection, pas une nouvelle
// mécanique — les gabarits déjà tagués d'un domainKey correspondant passent
// juste en tête de la rotation déterministe existante (voir
// getWeeklyThemeDomain). Sans thème (missions du jour), le comportement est
// strictement inchangé.
function pickMissions(count, seed, excludeIds, themeDomainKey){
  const applicable = MISSION_TEMPLATES.filter(t => !(excludeIds||[]).includes(t.id));
  const ordered = themeDomainKey
    ? [...applicable].sort((a, b) => (b.domainKey === themeDomainKey ? 1 : 0) - (a.domainKey === themeDomainKey ? 1 : 0))
    : applicable;
  const results = [];
  const tried = new Set();
  let i = seed;
  while(results.length < count && tried.size < ordered.length){
    const t = ordered[i % ordered.length];
    if(!tried.has(t.id)){
      tried.add(t.id);
      const built = t.build();
      if(built) results.push({...built, id:t.id, xp:t.xp});
    }
    i++;
  }
  return results;
}
// ---------- Thème hebdomadaire (priorité 6) : même rotation déterministe
// que les missions elles-mêmes (dayOfYear/7), un domaine réel de DOMAINS —
// jamais un thème inventé. Purement une couche de présentation + biais de
// sélection ci-dessus, aucune nouvelle donnée utilisateur stockée. ----------
function getWeeklyThemeDomain(){
  const weekSeed = Math.floor(dayOfYear()/7);
  return DOMAINS[weekSeed % DOMAINS.length];
}
function isoWeekStart(){
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0,0,0,0);
  return monday.toISOString().slice(0,10);
}
function getDailyMissionsLog(){
  const today = new Date().toDateString();
  const log = safeGetJSON('fzr-daily-missions-log', {date:today, doneIds:[]});
  if(log.date !== today) return {date:today, doneIds:[]};
  return log;
}
function completeDailyMission(id, xp){
  const log = getDailyMissionsLog();
  if(log.doneIds.includes(id)) return false;
  log.doneIds.push(id);
  safeSetJSON('fzr-daily-missions-log', log);
  awardXP(xp, {dailyMissionDone:id});
  return true;
}
function getWeeklyMissionsLog(){
  const weekStart = isoWeekStart();
  const log = safeGetJSON('fzr-weekly-missions-log', {weekStart, doneIds:[]});
  if(log.weekStart !== weekStart) return {weekStart, doneIds:[]};
  return log;
}
function completeWeeklyMission(id, xp){
  const log = getWeeklyMissionsLog();
  if(log.doneIds.includes(id)) return false;
  log.doneIds.push(id);
  safeSetJSON('fzr-weekly-missions-log', log);
  awardXP(xp, {weeklyMissionDone:id});
  return true;
}
function renderMissionsBlock(elId, missions, doneIds, onComplete){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = missions.map(m=>{
    const done = doneIds.includes(m.id);
    return `
    <div class="today-block" style="margin-bottom:10px;">
      <h4>${m.title}</h4>
      <p style="font-size:12.5px;color:var(--text-dim);margin:4px 0 8px;">${m.desc}</p>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <a href="${m.href}" class="today-link">Ouvrir →</a>
        <button class="btn btn-sm" data-mission-id="${m.id}" data-mission-xp="${m.xp}" ${done?'disabled':''}>${done ? ICONS.check+' Fait' : `Marquer comme fait (+${m.xp} XP)`}</button>
      </div>
    </div>`;
  }).join('');
  el.querySelectorAll('[data-mission-id]').forEach(btn=>{
    btn.addEventListener('click', ()=>onComplete(btn.dataset.missionId, +btn.dataset.missionXp));
  });
}
function renderDailyMissions(elId){
  const missions = pickMissions(2, dayOfYear(), []);
  const log = getDailyMissionsLog();
  renderMissionsBlock(elId, missions, log.doneIds, (id, xp)=>{
    completeDailyMission(id, xp);
    renderDailyMissions(elId);
  });
}
function renderWeeklyMissions(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const theme = getWeeklyThemeDomain();
  const missions = pickMissions(3, Math.floor(dayOfYear()/7), [], theme.key);
  const log = getWeeklyMissionsLog();
  const doneCount = missions.filter(m => log.doneIds.includes(m.id)).length;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      <span class="smallcaps">${theme.icon} Semaine ${theme.label}</span>
      <span class="mono" style="font-size:11px;color:var(--text-dim);">${doneCount}/${missions.length} complétées</span>
    </div>
    <div id="${elId}-list"></div>`;
  renderMissionsBlock(`${elId}-list`, missions, log.doneIds, (id, xp)=>{
    completeWeeklyMission(id, xp);
    renderWeeklyMissions(elId);
  });
}

// ---------- Petites animations : barres qui se remplissent, compteurs qui montent ----------
function prefersReducedMotion(){
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function animateWidthIn(el, targetPct){
  if(!el) return;
  if(prefersReducedMotion()){ el.style.width = targetPct + '%'; return; }
  el.style.width = '0%';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.width = targetPct + '%'; }));
}
function animateNumber(el, target, opts){
  if(!el) return;
  const prefix = (opts && opts.prefix) || '';
  const suffix = (opts && opts.suffix) || '';
  if(prefersReducedMotion()){ el.textContent = prefix + target + suffix; return; }
  const duration = (opts && opts.duration) || 700;
  const start = performance.now();
  function tick(now){
    const p = Math.min(1, (now-start)/duration);
    const eased = 1 - Math.pow(1-p, 3);
    el.textContent = prefix + Math.round(target*eased) + suffix;
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Libellés courts pour la salutation personnalisée (Accueil) — réutilisés
// nulle part ailleurs comme identifiant technique, uniquement pour l'affichage.
const INTEREST_DISPLAY_LABELS = Object.fromEntries(DOMAINS.map(d => [d.key, d.displayLabel]));
INTEREST_DISPLAY_LABELS.marketing = 'le marketing';
// ---------- En-tête de tableau de bord (salutation, rang, FinPoints, série, activité hebdo) ----------
function renderDashboardHeader(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const g = getGamification();
  const lvl = levelFromXP(g.xp);
  let greeting = WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
  const profile = getProfile();
  const profileInterests = profile.interests || {};
  const interests = Object.keys(profileInterests).filter(k => profileInterests[k]);
  if(interests.length){
    const labels = interests.slice(0,2).map(k => INTEREST_DISPLAY_LABELS[k] || k);
    greeting = `Tu t'intéresses surtout à ${labels.join(' et à ')}.`;
  }
  // L'objectif déclaré (pourquoi l'utilisateur est sur Likanza) prime sur les
  // intérêts (ce qui l'intéresse) : c'est le signal le plus direct de son
  // intention. "general" n'est pas un domaine réel (ex. "améliorer ma culture
  // financière") et n'a donc rien de plus précis à afficher qu'un intérêt.
  const goalKeys = Object.keys(profile.goals || {}).filter(k => k !== 'general' && DOMAINS.some(d => d.key === k));
  if(goalKeys.length){
    const labels = goalKeys.slice(0,2).map(k => (DOMAINS.find(d => d.key === k) || {}).displayLabel || k);
    greeting = `Tu es ici avant tout pour progresser sur ${labels.join(' et sur ')}.`;
  }
  const weekDays = getWeeklyActivityDays();
  const weekPct = Math.min(100, Math.round((weekDays/WEEKLY_GOAL_DAYS)*100));
  // Sans test de positionnement complété, "Débutant" ci-dessus n'est qu'un
  // repli silencieux (voir getLevel()), pas un niveau réellement déclaré —
  // ce bandeau invite explicitement à combler ça, une seule fois, jusqu'à
  // ce que le test soit fait (jamais réaffiché après, voir getPositioningResult).
  const showOnboardingNudge = !getPositioningResult();
  el.innerHTML = `
    <div class="dash-header">
      <div class="dash-greeting">
        <span class="smallcaps">${BRAND_SLOGAN}</span>
        <h1 class="display" style="font-size:26px;font-weight:600;margin-top:4px;">${lvl.title}</h1>
        <p style="font-size:12px;color:var(--text);font-style:italic;margin-top:2px;" id="dashGreeting">${greeting}</p>
      </div>
      <div class="dash-stats">
        <div class="dash-stat"><span class="num" id="dashNumXP">0 XP</span><span class="lab">niveau ${lvl.level}</span></div>
        <div class="dash-stat"><span class="num">${ICONS.coins} <span id="dashNumFP">0</span></span><span class="lab">Finance Points</span></div>
        <div class="dash-stat"><span class="num">${ICONS.flame} ${g.streak}</span><span class="lab">série</span></div>
        <div class="dash-stat">
          <span class="num">${weekDays}/${WEEKLY_GOAL_DAYS}</span><span class="lab">jours actifs</span>
          <div class="dash-weekbar"><div class="dash-weekfill" id="dashWeekFill" style="width:0%;"></div></div>
        </div>
      </div>
    </div>
    ${showOnboardingNudge ? `
    <div class="today-card" style="margin-top:4px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
      <div>
        <span class="eyebrow">Nouveau sur Likanza ?</span>
        <p style="font-size:13.5px;margin-top:4px;max-width:52ch;">2 minutes pour indiquer ce qui t'intéresse, ton niveau et tes objectifs — Likanza personnalise ensuite ses recommandations à partir de ça, jamais au hasard.</p>
      </div>
      <a href="test-positionnement.html" class="btn btn-sm btn-gold" style="white-space:nowrap;">Faire le test →</a>
    </div>` : ''}`;
  animateNumber(document.getElementById('dashNumXP'), g.xp, {suffix:' XP'});
  animateNumber(document.getElementById('dashNumFP'), g.financePoints);
  animateWidthIn(document.getElementById('dashWeekFill'), weekPct);
}

// ================================================================
// ---------- Système de quiz complet (banque, moteur, stats) ----------
// ================================================================

// ---------- Anti-abus des FinPoints : une question ne rapporte des
// FinPoints que la première fois qu'elle est réussie dans la journée. ----------
function getQuizPointsLedger(){
  const today = new Date().toDateString();
  const ledger = safeGetJSON('fzr-quiz-points-ledger', {date:today, ids:[]});
  if(ledger.date !== today) return {date:today, ids:[]};
  return ledger;
}
// Anti-farming au-delà du quotidien : répondre juste à la même question
// chaque jour donnait l'XP plein indéfiniment (le ledger ci-dessus ne
// protège que dans la même journée). fzr-xp-repeat-counts compte, à vie,
// combien de fois chaque question a déjà rapporté des points — borné par
// construction : au plus ~172 questions existent sur tout le site, donc
// cette table ne grossit jamais au-delà de cette taille, peu importe le
// nombre de jours écoulés. 1ère réussite = XP plein, 2e = moitié, au-delà
// = 0 XP (mais recordAnswer/isAppliedItem restent appelés séparément par
// chaque site d'appel, donc la maîtrise par concept continue de progresser
// même quand l'XP n'est plus versé).
function getXPRepeatCounts(){ return safeGetJSON('fzr-xp-repeat-counts', {}); }
function saveXPRepeatCounts(counts){ safeSetJSON('fzr-xp-repeat-counts', counts); }

function tryAwardQuizPoints(questionId, amount, ctx){
  const ledger = getQuizPointsLedger();
  if(ledger.ids.includes(questionId)) return 0;
  ledger.ids.push(questionId);
  safeSetJSON('fzr-quiz-points-ledger', ledger);
  const counts = getXPRepeatCounts();
  const timesAwarded = counts[questionId] || 0;
  counts[questionId] = timesAwarded + 1;
  saveXPRepeatCounts(counts);
  const multiplier = timesAwarded === 0 ? 1 : timesAwarded === 1 ? 0.5 : 0;
  const finalAmount = Math.round(amount * multiplier);
  if(finalAmount > 0) awardXP(finalAmount, ctx);
  return finalAmount;
}

// ---------- Statistiques de quiz (par catégorie, historique) ----------
function getQuizStats(){
  return safeGetJSON('fzr-quiz-stats', {categoryStats:{}, history:[]});
}
function saveQuizStats(stats){ safeSetJSON('fzr-quiz-stats', stats); }

// Un item "appliqué" demande de raisonner sur un cas, jamais un simple rappel
// de définition — condition nécessaire pour progresser au-delà du palier
// "Compris" dans la maîtrise par concept (voir getConceptMastery ci-dessous).
// Les formats Défis (cas/vraimais/calcul/séquence/infomanquante/classe) sont
// toujours du raisonnement ; dans QUIZ_BANK_FULL, seuls les types "situation"
// et "calcul" le sont — "qcm"/"vraifaux" restent du rappel.
function isAppliedItem(item){
  if(!item) return false;
  if(item.format) return true;
  return item.type === 'situation' || item.type === 'calcul';
}

// applied (3e paramètre, optionnel, rétrocompatible) : vrai si la réponse
// vient d'un item de raisonnement (voir isAppliedItem). Alimente uniquement
// getConceptMastery — categoryStats[cat].correct/total restent la même
// source de vérité qu'avant pour getSkillMastery, aucune dérive possible.
// Poids par difficulté (section 6 du prompt Learning Engine : "les exercices
// difficiles doivent avoir davantage de poids que les questions très
// faciles"). Multiplicateurs modérés, jamais extrêmes — une seule question
// experte ne doit pas faire basculer un niveau à elle seule (section 6 :
// "éviter les changements absurdes après une seule question").
const DIFFICULTY_WEIGHT = {debutant:1, intermediaire:1.3, avance:1.7, expert:2};
function recordAnswer(categorie, correct, applied, niveau){
  const stats = getQuizStats();
  const c = stats.categoryStats[categorie] || (stats.categoryStats[categorie] = {correct:0, total:0});
  if(c.appliedCorrect === undefined) c.appliedCorrect = 0;
  if(c.appliedTotal === undefined) c.appliedTotal = 0;
  if(c.weightedCorrect === undefined) c.weightedCorrect = 0;
  if(c.weightedTotal === undefined) c.weightedTotal = 0;
  if(!c.correctDates) c.correctDates = [];
  const weight = DIFFICULTY_WEIGHT[niveau] || 1;
  c.total++;
  c.weightedTotal += weight;
  if(applied) c.appliedTotal++;
  if(correct){
    c.correct++;
    c.weightedCorrect += weight;
    if(applied) c.appliedCorrect++;
    const today = new Date().toDateString();
    if(!c.correctDates.includes(today)){
      c.correctDates.unshift(today);
      c.correctDates = c.correctDates.slice(0, 12); // jours distincts récents, jamais un journal illimité
    }
  }
  saveQuizStats(stats);
}
// Seuil "défi réussi" pour le compteur à vie (section suivante) — même
// valeur que le palier "Très bon résultat" déjà affiché par startMixedSession,
// jamais un second seuil qui contredirait le message montré à l'écran.
const DEFI_SESSION_PASS_THRESHOLD = 0.7;
function recordQuizCompletion(level, categorie, length, score){
  const stats = getQuizStats();
  stats.history.unshift({date:new Date().toLocaleDateString('fr-FR'), level, categorie, length, score});
  stats.history = stats.history.slice(0, 30);
  // Compteur à vie de sessions réussies (section 24 du prompt Learning
  // Engine : "défis réussis" au tableau de bord) — l'historique ci-dessus
  // est volontairement plafonné à 30 entrées (rolling), donc incapable à lui
  // seul de porter un total à vie.
  if(score >= DEFI_SESSION_PASS_THRESHOLD * 100) stats.totalPassedSessions = (stats.totalPassedSessions || 0) + 1;
  saveQuizStats(stats);
  // Répétition espacée (voir plus haut) : une catégorie réelle (jamais
  // "mélange"/"mixte", qui échouent silencieusement le lookup de maîtrise)
  // peut faire avancer une révision déjà due, ou entrer en suivi si elle
  // vient tout juste d'atteindre "maîtrisé".
  advanceSpacedReviewIfDue(categorie, score);
  scheduleSpacedReviewIfNewlyMastered(categorie);
}
function getPassedDefisSessionsCount(){ return getQuizStats().totalPassedSessions || 0; }
// Score de maîtrise continu par catégorie, dérivé de fzr-quiz-stats (aucune
// donnée inventée — uniquement de vraies réponses aux quiz). Seule mesure de
// maîtrise du site (l'ancienne version à double seuil silencieux, avec son
// angle mort 50-75%, a été retirée).
function getSkillMastery(){
  const stats = getQuizStats();
  return Object.entries(stats.categoryStats)
    .filter(([, s]) => s.total >= 2)
    // weightedCorrect/weightedTotal absents (données enregistrées avant la
    // pondération par difficulté, section 6) -> repli sur les comptes bruts,
    // jamais un NaN ni un pourcentage inventé pour les anciennes données.
    .map(([categorie, s]) => {
      const wCorrect = s.weightedCorrect !== undefined ? s.weightedCorrect : s.correct;
      const wTotal = s.weightedTotal !== undefined ? s.weightedTotal : s.total;
      const pct = Math.round((wCorrect / wTotal) * 100);
      let niveau = 'en cours';
      if(pct >= 75) niveau = 'maîtrisé';
      else if(pct < 50) niveau = 'faible';
      return {categorie, pct, correct: s.correct, total: s.total, weightedCorrect: wCorrect, weightedTotal: wTotal, niveau};
    })
    .sort((a, b) => a.pct - b.pct);
}

// ---------- Financial IQ : score de maîtrise composite par domaine, séparé
// de l'XP (sections 19-20 du plan Défis). L'XP (levelFromXP/LEVEL_TITLES)
// mesure la régularité/participation ; le Financial IQ mesure la vraie
// qualité des réponses par domaine — jamais un chiffre à l'apparence
// scientifique inventé (pas de note façon "742" sans échelle expliquée) :
// reste un vrai pourcentage de bonnes réponses, pondéré par le nombre réel
// de réponses par domaine, jamais une simple moyenne des moyennes qui
// donnerait le même poids à un domaine testé 2 fois et à un domaine testé
// 50 fois. Distinct du système "niveau évalué" de Mon Parcours (quiz
// approfondi ponctuel par domaine) : ici, un score qui évolue en continu
// avec CHAQUE réponse donnée, dans Défis comme ailleurs sur le site. ----------
function categorieDomainKey(categorie){
  const domain = DOMAINS.find(d => (d.quizCategories || []).includes(categorie));
  return domain ? domain.key : null;
}
// pct pondéré par difficulté (section 6) ; total/correct restent des
// comptes BRUTS (nombre réel de réponses) — utilisés pour les seuils de
// confiance/échantillon (badges de maîtrise, getEvaluatedLevel, Financial
// IQ) qui doivent représenter un vrai nombre de réponses, jamais un total
// gonflé artificiellement par la pondération.
function computeDomainMastery(){
  const mastery = getSkillMastery();
  const byDomain = {};
  DOMAINS.forEach(d => { byDomain[d.key] = {key: d.key, label: d.label, icon: d.icon, correct: 0, total: 0, weightedCorrect: 0, weightedTotal: 0}; });
  mastery.forEach(m => {
    const key = categorieDomainKey(m.categorie);
    if(!key) return;
    byDomain[key].correct += m.correct;
    byDomain[key].total += m.total;
    byDomain[key].weightedCorrect += m.weightedCorrect;
    byDomain[key].weightedTotal += m.weightedTotal;
  });
  return Object.values(byDomain)
    .map(d => ({...d, pct: d.total > 0 ? Math.round((d.weightedCorrect / d.weightedTotal) * 100) : null}))
    .filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total);
}

// ---------- Badges de maîtrise réelle (section 21/23 du prompt Learning
// Engine) : jusqu'ici tous les badges de BADGES mesuraient de l'activité
// (streak, XP, nombre de thèmes touchés) — jamais une vraie compétence. Un
// badge par domaine, calculé à partir de computeDomainMastery() (même
// source que Financial IQ), avec le même seuil minimal que
// getEvaluatedLevel (10 réponses réelles) pour ne jamais l'attribuer sur un
// échantillon trop faible pour être honnête. Générés depuis DOMAINS : un
// nouveau domaine obtient automatiquement son badge, jamais codé en dur
// à la main (section 29 du prompt, "ajouter facilement de nouvelles
// compétences"). ----------
const MASTERY_BADGE_MIN_TOTAL = 10;
const MASTERY_BADGE_THRESHOLD = 75;
const MASTERY_BADGE_LABELS = {
  personalFinance: 'Personal Finance', stockMarket: 'Analyste Bourse', business: 'Business Strategist',
  economics: 'Économiste en herbe', realEstate: 'Expert Immobilier', crypto: 'Crypto Fundamentals'
};
const MASTERY_BADGES = DOMAINS.map(d => ({
  id: 'mastery_' + d.key,
  name: MASTERY_BADGE_LABELS[d.key] || `Maîtrise ${d.label}`,
  desc: `Atteindre ${MASTERY_BADGE_THRESHOLD}% de bonnes réponses en ${d.displayLabel} (au moins ${MASTERY_BADGE_MIN_TOTAL} réponses réelles).`,
  check: () => {
    const dom = computeDomainMastery().find(x => x.key === d.key);
    return !!(dom && dom.total >= MASTERY_BADGE_MIN_TOTAL && dom.pct >= MASTERY_BADGE_THRESHOLD);
  }
}));
BADGES.push(...MASTERY_BADGES);
const FINANCIAL_IQ_MIN_ANSWERS = 15; // jamais un rang affiché sur un échantillon trop faible pour être honnête
function computeFinancialIQ(){
  const domains = computeDomainMastery();
  // Seuil de déblocage basé sur le nombre RÉEL de réponses (jamais gonflé
  // par la pondération par difficulté) ; le score affiché, lui, est
  // pondéré (section 6) — un vrai reflet de compétence, pas juste un ratio brut.
  const totalAnswers = domains.reduce((s, d) => s + d.total, 0);
  if(totalAnswers < FINANCIAL_IQ_MIN_ANSWERS) return null;
  const weightedTotal = domains.reduce((s, d) => s + d.weightedTotal, 0);
  const weightedCorrect = domains.reduce((s, d) => s + d.weightedCorrect, 0);
  return {pct: Math.round((weightedCorrect / weightedTotal) * 100), totalAnswers, domains};
}
// Noms volontairement distincts de LEVEL_TITLES (XP) — jamais le même mot
// pour deux systèmes différents (un utilisateur pourrait être "Analyste" en
// XP et à un tout autre niveau de maîtrise réelle en même temps).
const MASTERY_RANKS = [
  {min: 0, name: 'Novice', emoji: '🌱'},
  {min: 40, name: 'Perspicace', emoji: '🔎'},
  {min: 60, name: 'Rigoureux', emoji: '📊'},
  {min: 75, name: 'Aguerri', emoji: '🎯'},
  {min: 90, name: 'Virtuose', emoji: '💎'}
];
function masteryRankFromPct(pct){
  let rank = MASTERY_RANKS[0];
  MASTERY_RANKS.forEach(r => { if(pct >= r.min) rank = r; });
  return rank;
}
function renderFinancialIQDetail(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const iq = computeFinancialIQ();
  if(!iq){
    const domains = computeDomainMastery();
    const totalAnswers = domains.reduce((s, d) => s + d.total, 0);
    el.innerHTML = `
      <span class="smallcaps">🧠 Financial IQ</span>
      <p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Pas encore assez de réponses réelles pour calculer un score fiable (${totalAnswers} / ${FINANCIAL_IQ_MIN_ANSWERS} nécessaires) — continue à répondre aux Défis pour le débloquer.</p>`;
    return;
  }
  const rank = masteryRankFromPct(iq.pct);
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
      <div>
        <span class="smallcaps">🧠 Financial IQ</span>
        <div class="result-big" style="font-size:26px;margin-top:4px;">${iq.pct} %</div>
        <p style="font-size:12px;color:var(--text-dim);margin-top:2px;">${rank.emoji} Rang de maîtrise : ${rank.name}</p>
      </div>
    </div>
    <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">
      ${iq.domains.map(d => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:3px;">
            <span>${d.icon} ${d.label}</span>
            <span class="mono" style="color:var(--text-dim);">${d.pct} % (${d.correct}/${d.total})</span>
          </div>
          <div class="dash-weekbar" style="width:100%;"><div class="dash-weekfill" style="width:${d.pct}%;"></div></div>
        </div>`).join('')}
    </div>
    ${renderMethodologyPanel({
      calcul: "Financial IQ = (total des bonnes réponses ÷ total des réponses données) × 100, tous domaines confondus — une vraie moyenne pondérée par le nombre de réponses, jamais une simple moyenne des pourcentages par domaine (qui donnerait autant de poids à un domaine testé 2 fois qu'à un domaine testé 50 fois).",
      donnees: "Toutes tes réponses réellement enregistrées sur le site (Défis, quiz de cours, missions) qui appartiennent à une catégorie rattachée à l'un des 6 domaines Likanza.",
      limites: `Un score n'est affiché qu'à partir de ${FINANCIAL_IQ_MIN_ANSWERS} réponses au total, pour éviter un chiffre trompeur sur un trop petit échantillon. Distinct du "niveau évalué" par domaine sur Mon Parcours, qui vient d'un quiz approfondi ponctuel, pas d'un score qui évolue en continu.`,
      comprendre: "Contrairement à l'XP (qui récompense la régularité, quelle que soit la réussite), le Financial IQ ne progresse que si tes réponses sont réellement correctes — répondre 100 fois à des questions faciles sans être juste ne le fait pas progresser."
    })}`;
}

// ---------- Maîtrise par concept, 4 paliers (Découvert → Compris → Appliqué → Maîtrisé) ----------
// Même source de vérité que getSkillMastery (fzr-quiz-stats.categoryStats) —
// jamais un second système qui pourrait diverger. "Concept" = les mêmes ~50
// catégories déjà partagées par les quiz, les Défis et DOMAINS[].quizCategories
// (app.js) — pas une nouvelle taxonomie. Chaque palier est un sur-ensemble
// strict du précédent, jamais un score fabriqué pour une notion jamais
// touchée : sans donnée réelle, la fonction renvoie null.
const CONCEPT_STAGE_ORDER = {decouvert: 0, compris: 1, applique: 2, maitrise: 3};
const CONCEPT_STAGE_LABELS = {decouvert: 'Découvert', compris: 'Compris', applique: 'Appliqué', maitrise: 'Maîtrisé'};
function getConceptMastery(categorie){
  const stats = getQuizStats().categoryStats[categorie];
  if(!stats || stats.total < 1) return null;
  const pct = Math.round((stats.correct / stats.total) * 100);
  const appliedCorrect = stats.appliedCorrect || 0;
  const distinctDays = (stats.correctDates || []).length;

  const comprisOk = stats.total >= 2 && pct >= 50;
  const appliqueOk = comprisOk && appliedCorrect >= 1;
  const maitriseOk = appliqueOk && pct >= 75 && appliedCorrect >= 2 && distinctDays >= 3 && stats.total >= 6;

  const stage = maitriseOk ? 'maitrise' : appliqueOk ? 'applique' : comprisOk ? 'compris' : 'decouvert';
  return {categorie, stage, label: CONCEPT_STAGE_LABELS[stage], pct, correct: stats.correct, total: stats.total, appliedCorrect, distinctDays};
}
function getAllConceptMastery(){
  return Object.keys(getQuizStats().categoryStats)
    .map(getConceptMastery)
    .filter(Boolean)
    .sort((a, b) => CONCEPT_STAGE_ORDER[a.stage] - CONCEPT_STAGE_ORDER[b.stage] || a.pct - b.pct);
}

// ---------- Banque d'erreurs (persistée, dédoublonnée par question) ----------
// Contrairement au tableau "wrong" local à startQuizSession (perdu au
// rechargement), ceci garde une trace durable des erreurs à travers les 3
// moteurs de quiz du site, pour alimenter une vraie recommandation de révision.
function getMistakes(){ return safeGetJSON('fzr-mistakes', []); }
function saveMistakes(list){ safeSetJSON('fzr-mistakes', list); }

function recordMistake(item){
  const list = getMistakes();
  const existing = list.find(m => m.questionId === item.id);
  const now = new Date().toISOString();
  if(existing){
    existing.misses++;
    existing.lastMissedAt = now;
    existing.resolved = false;
  } else {
    list.push({
      questionId: item.id,
      categorie: item.categorie,
      niveau: item.niveau,
      question: item.question,
      correctAnswer: item.explication,
      firstMissedAt: now,
      lastMissedAt: now,
      misses: 1,
      resolved: false
    });
  }
  saveMistakes(list);
}

function resolveMistake(questionId){
  const list = getMistakes();
  const entry = list.find(m => m.questionId === questionId);
  if(!entry || entry.resolved) return;
  entry.resolved = true;
  entry.resolvedAt = new Date().toISOString();
  saveMistakes(list);
  const totalResolved = list.filter(m => m.resolved).length;
  checkBadges(getGamification(), {mistakeResolved: true, totalResolved});
}

// ---------- Répétition espacée réelle (audit Formations Phase 3 du
// 27/08/2026) : jusqu'ici, une notion maîtrisée ne revenait jamais se
// retester automatiquement — seules les erreurs (fzr-mistakes, ci-dessus)
// étaient reprogrammées, et seulement à l'initiative de l'utilisateur.
// Ici, une catégorie qui atteint "maîtrisé" (getSkillMastery) est
// programmée pour resurgir à J+7, puis J+14 si la révision réussit à
// l'échéance, puis J+30 (et se répète ensuite à 30 jours) — jamais
// réinitialisée tant qu'elle reste suivie, jamais avancée par une révision
// faite en avance ou ratée. ----------
const SPACED_REPETITION_INTERVALS_DAYS = [7, 14, 30];
function getSpacedRepetition(){ return safeGetJSON('fzr-spaced-repetition', {}); }
function saveSpacedRepetition(state){ safeSetJSON('fzr-spaced-repetition', state); }
// toISOString() convertit d'abord en UTC : dans un fuseau en avance sur UTC
// (ex. France), juste après minuit local, la date UTC est encore la veille —
// ça décalerait toutes les échéances d'un jour. On formate donc toujours la
// date LOCALE directement, sans jamais passer par toISOString().
function formatDateISO(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayISO(){ return formatDateISO(new Date()); }
function addDaysISO(dateISO, days){
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}
function scheduleSpacedReviewIfNewlyMastered(categorie){
  const mastery = getSkillMastery().find(m => m.categorie === categorie);
  if(!mastery || mastery.niveau !== 'maîtrisé') return;
  const state = getSpacedRepetition();
  if(state[categorie]) return; // déjà en cours de suivi, jamais réinitialisée
  state[categorie] = {stage: 0, nextReviewDate: addDaysISO(todayISO(), SPACED_REPETITION_INTERVALS_DAYS[0])};
  saveSpacedRepetition(state);
}
function advanceSpacedReviewIfDue(categorie, scorePct){
  const state = getSpacedRepetition();
  const entry = state[categorie];
  if(!entry) return;
  const today = todayISO();
  if(today < entry.nextReviewDate) return; // pas encore échue -> rien à avancer
  if(scorePct < COURS_PASS_THRESHOLD * 100) return; // révisée mais ratée -> reste due, jamais avancée
  const nextStage = Math.min(entry.stage + 1, SPACED_REPETITION_INTERVALS_DAYS.length - 1);
  state[categorie] = {stage: nextStage, nextReviewDate: addDaysISO(today, SPACED_REPETITION_INTERVALS_DAYS[nextStage])};
  saveSpacedRepetition(state);
}
function getDueSpacedReviews(){
  const state = getSpacedRepetition();
  const today = todayISO();
  return Object.entries(state)
    .filter(([, e]) => e.nextReviewDate <= today)
    .map(([categorie, e]) => ({categorie, stage: e.stage, nextReviewDate: e.nextReviewDate}));
}
function renderSpacedReviewList(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const due = getDueSpacedReviews();
  if(due.length === 0){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Rien à repasser aujourd'hui : les notions déjà maîtrisées reviendront automatiquement à leur échéance.</p>`;
    return;
  }
  el.innerHTML = `<div class="course-list">${due.map(d => `
    <div class="course-item">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
        <div>
          <span class="smallcaps">${d.categorie}</span>
          <p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">Maîtrisée il y a ${SPACED_REPETITION_INTERVALS_DAYS[d.stage]} jour${SPACED_REPETITION_INTERVALS_DAYS[d.stage] > 1 ? 's' : ''} · à repasser pour vérifier que c'est toujours acquis</p>
        </div>
        <button class="btn btn-sm btn-gold" data-spaced-cat="${d.categorie}" style="white-space:nowrap;">Réviser →</button>
      </div>
    </div>`).join('')}</div>
    <div id="${elId}-session" style="margin-top:16px;"></div>`;
  el.querySelectorAll('[data-spaced-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const categorie = btn.dataset.spacedCat;
      const pool = defisFullPool().filter(i => i.categorie === categorie);
      const sessionEl = document.getElementById(`${elId}-session`);
      if(!sessionEl || pool.length === 0) return;
      startMixedSession(`${elId}-session`, pickAdaptivePool(pool, categorie, 5), {categorie, onRestart: () => renderSpacedReviewList(elId)});
      sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  });
}

// ---------- Révisions (revisions.html) : vue complète des erreurs non
// résolues + maîtrise par thème, à partir des mêmes données que le bloc
// "Notions à revoir" de Mon parcours (juste non tronqué à 3 éléments). ----------
function renderRevisionsList(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const unresolved = getMistakes()
    .filter(m=>!m.resolved)
    .sort((a,b)=> b.misses - a.misses || new Date(a.firstMissedAt) - new Date(b.firstMissedAt));

  if(unresolved.length === 0){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Aucune notion en attente de révision pour le moment : continue comme ça !</p>`;
    return;
  }

  el.innerHTML = `<div class="course-list">${unresolved.map(m=>`
    <div class="course-item">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:220px;">
          <span class="smallcaps">${m.categorie}</span>
          <p style="font-size:14px;margin-top:6px;">${m.question}</p>
          <p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">Ratée ${m.misses} fois · depuis le ${new Date(m.firstMissedAt).toLocaleDateString('fr-FR')}</p>
        </div>
        <a href="defis.html?cat=${encodeURIComponent(m.categorie)}" class="btn btn-sm btn-gold" style="white-space:nowrap;">Réviser →</a>
      </div>
    </div>`).join('')}</div>`;
}

function renderMasteryList(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const mastery = getSkillMastery();
  if(mastery.length === 0){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Réponds à quelques quiz (Défis, Vrai ou faux, Cours) pour voir apparaître ta maîtrise par thème ici.</p>`;
    return;
  }
  const colorFor = niveau => niveau==='maîtrisé' ? 'var(--emerald)' : niveau==='faible' ? 'var(--bordeaux)' : 'var(--gold-bright)';
  el.innerHTML = `<div class="card-grid">${mastery.map(s=>`
    <div class="card">
      <span class="smallcaps">${s.categorie}</span>
      <div class="result-big" style="font-size:26px;margin-top:8px;color:${colorFor(s.niveau)};">${s.pct}%</div>
      <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${s.correct}/${s.total} bonnes réponses · ${s.niveau}</p>
      ${s.niveau !== 'maîtrisé' ? `<button class="btn btn-sm" style="margin-top:10px;" data-mastery-cat="${s.categorie}">S'entraîner →</button>` : ''}
    </div>`).join('')}</div>
    <div id="${elId}-session" style="margin-top:18px;"></div>`;
  el.querySelectorAll('[data-mastery-cat]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cat = btn.dataset.masteryCat;
      const pool = defisFullPool().filter(i => i.categorie === cat);
      const sessionEl = document.getElementById(`${elId}-session`);
      if(!sessionEl || pool.length === 0) return;
      startMixedSession(`${elId}-session`, pickAdaptivePool(pool, cat, 6), {level: cat, categorie: cat, onRestart: () => renderMasteryList(elId)});
      sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  });
}

// selectQuizQuestions, renderQuickChallenge et renderQuizSetup ont été
// retirés : entièrement remplacés par le moteur Défis (defisFullPool,
// startMixedSession, renderDefiDuJour, renderModesEntrainement) qui couvre
// le même besoin (sélection niveau/thème/longueur) sur un pool combiné
// QUIZ_BANK_FULL + MENTAL_CHALLENGES, avec plusieurs formats possibles.

// ---------- Recommandation Likanza après un échec (Learning Engine, "ne
// jamais se limiter à Pas tout à fait") ----------
// Relie une catégorie de quiz/défi aux vraies destinations existantes pour
// cette catégorie précise — cours (COURS_CATALOG.quizCategories, déjà la
// vraie taxonomie de compétences), définition (LIBRARY), simulateur
// (Laboratoire, uniquement les 3 domaines réellement couverts aujourd'hui)
// et défi (MENTAL_CHALLENGES). Un lien n'apparaît que si sa destination
// existe réellement pour CETTE catégorie — jamais une recommandation
// générique déconnectée de l'erreur, jamais un lien vers du contenu absent.
const DOMAIN_LAB_LINK = {
  personalFinance: {url:'laboratoire.html#tab-budget-epargne', label:'Simuler dans le Laboratoire'},
  stockMarket: {url:'laboratoire.html#tab-investissement', label:'Simuler dans le Laboratoire'},
  realEstate: {url:'laboratoire.html#tab-logement', label:'Simuler dans le Laboratoire'}
};
function findLibraryEntryForCategorie(categorie, domain){
  const norm = s => s.toLowerCase().trim();
  const target = norm(categorie);
  const singular = target.replace(/s$/, '');
  let entry = LIBRARY.find(l => norm(l.terme) === target || norm(l.terme) === singular);
  if(!entry && domain) entry = LIBRARY.find(l => (domain.libraryCategories || []).includes(l.categorie));
  return entry || null;
}
// Sens inverse de findLibraryEntryForCategorie : depuis un terme de
// Bibliothèque (ex. "ETF"), retrouve la vraie catégorie de quiz correspondante
// (ex. "ETF" ou "Obligations" pour le terme "Obligation") si elle existe —
// permet à renderRecommendationsRow (Bibliothèque, section 12 du prompt
// Learning Engine) de réutiliser findRecommendationsFor telle quelle, jamais
// une deuxième logique de correspondance dupliquée.
function matchQuizCategorieForTerme(terme){
  const norm = s => s.toLowerCase().trim();
  const target = norm(terme);
  const pluralTarget = target + 's';
  for(const domain of DOMAINS){
    const match = (domain.quizCategories || []).find(c => norm(c) === target || norm(c) === pluralTarget);
    if(match) return match;
  }
  return null;
}
// Ligne de liens "Voir aussi" (Bibliothèque -> Cours/Défi) pour un terme
// donné — omise si aucune vraie correspondance n'existe pour ce terme
// précis, jamais un lien générique déconnecté de la notion consultée.
function renderTermeRecommendationsRow(terme){
  const categorie = matchQuizCategorieForTerme(terme);
  if(!categorie) return '';
  const {domainKey, cours, defi} = findRecommendationsFor(categorie);
  const links = [];
  if(cours && domainKey) links.push(`<a href="formations.html#tab-formation-${domainKey}">${ICONS['book-open']} Cours lié</a>`);
  if(defi) links.push(`<a href="defis.html?cat=${encodeURIComponent(categorie)}">${ICONS.target} Défi lié</a>`);
  if(links.length === 0) return '';
  return `<p class="kt-leaf-example" style="margin-top:10px;"><strong>Aller plus loin : </strong>${links.join(' · ')}</p>`;
}
// Recherche brute (aucun HTML) — partagée entre le panneau complet
// (renderRecommendationPanel, après un échec) et le widget compact "À
// apprendre" de l'accueil (renderTodayWeakness) : même logique de
// correspondance partout, jamais deux résultats différents pour la même
// catégorie selon l'endroit du site.
function findRecommendationsFor(categorie){
  if(!categorie) return {domainKey:null, cours:null, def:null, defi:null, labo:null, hasRetryContent:false};
  const domainKey = categorieDomainKey(categorie);
  const domain = DOMAINS.find(d => d.key === domainKey);
  const cours = COURS_CATALOG.find(c => (c.quizCategories || []).includes(categorie))
    || (domainKey ? COURS_CATALOG.find(c => coursDomainKey(c) === domainKey) : null);
  const def = findLibraryEntryForCategorie(categorie, domain);
  const defi = MENTAL_CHALLENGES.find(m => m.categorie === categorie);
  const labo = domainKey ? DOMAIN_LAB_LINK[domainKey] : null;
  const hasRetryContent = QUIZ_BANK_FULL.concat(MENTAL_CHALLENGES).some(i => i.categorie === categorie);
  return {domainKey, cours, def, defi, labo, hasRetryContent};
}
function renderRecommendationPanel(categorie){
  if(!categorie) return '';
  const {domainKey, cours, def, defi, labo, hasRetryContent} = findRecommendationsFor(categorie);

  const links = [];
  if(cours && domainKey) links.push(`<a class="btn btn-sm" href="formations.html#tab-formation-${domainKey}">${ICONS['book-open']} Cours : ${cours.titre}</a>`);
  if(def) links.push(`<a class="btn btn-sm" href="bibliotheque.html#${encodeURIComponent(def.terme.replace(/\s+/g,'-'))}">${ICONS.lightbulb} Définition : ${def.terme}</a>`);
  if(labo) links.push(`<a class="btn btn-sm" href="${labo.url}">${ICONS.calculator} ${labo.label}</a>`);
  if(defi) links.push(`<a class="btn btn-sm" href="defis.html?cat=${encodeURIComponent(categorie)}">${ICONS.target} Refaire un défi sur ce thème</a>`);
  else if(hasRetryContent) links.push(`<a class="btn btn-sm" href="defis.html?cat=${encodeURIComponent(categorie)}">${ICONS.target} Refaire le test</a>`);

  if(links.length === 0) return '';
  return `
    <div class="feedback-recommendation" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--hairline);">
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Tu dois renforcer cette compétence — quelques pistes :</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">${links.join('')}</div>
    </div>`;
}

// ---------- Widget accueil "À apprendre" (section 10 du prompt Learning
// Engine) : la vraie faiblesse mesurée de l'utilisateur (getSkillMastery,
// déjà utilisé par Mon Parcours/Financial IQ), pas un contenu identique
// pour tout le monde. Un seul lien (le plus actionnable : défi > cours >
// définition) pour rester un widget compact, cohérent avec ses voisins
// (todayMission/todayNotion) — le détail complet reste dans le panneau de
// recommandation (renderRecommendationPanel), pas dupliqué ici. ----------
function renderTodayWeakness(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const mastery = getSkillMastery();
  const weakest = mastery.find(m => m.niveau === 'faible') || mastery[0];
  if(!weakest){
    el.innerHTML = `
      <h4>À apprendre</h4>
      <p style="font-size:13px;color:var(--text-dim);">Fais quelques quiz ou défis pour que Likanza repère tes points à renforcer.</p>`;
    return;
  }
  const {domainKey, cours, def, defi} = findRecommendationsFor(weakest.categorie);
  let cta = null;
  if(defi) cta = {href:`defis.html?cat=${encodeURIComponent(weakest.categorie)}`, label:'Faire un défi'};
  else if(cours && domainKey) cta = {href:`formations.html#tab-formation-${domainKey}`, label:'Voir le cours'};
  else if(def) cta = {href:`bibliotheque.html#${encodeURIComponent(def.terme.replace(/\s+/g,'-'))}`, label:'Lire la définition'};

  el.innerHTML = `
    <h4>À apprendre</h4>
    <p style="font-size:13px;color:var(--text-dim);margin-bottom:6px;">Ta plus grande marge de progression : <strong style="color:var(--text);">${weakest.categorie}</strong> (${weakest.pct}% de bonnes réponses).</p>
    ${cta ? `<a href="${cta.href}" class="today-link">${cta.label} →</a>` : ''}`;
}

// ---------- Feedback pédagogique partagé (Défis) ----------
// Utilisé par tous les moteurs de quiz/défis, anciens et nouveaux : un
// verdict court suivi de la vraie explication — jamais un simple ✅/❌ nu,
// jamais un ton enfantin ("Oups ! Essaie encore champion 😜"). categorie
// (optionnel, 4e argument) déclenche renderRecommendationPanel sur échec.
function renderFeedbackHtml(correct, explication, xpMsg, categorie){
  return `
    <p class="feedback-verdict ${correct ? 'feedback-correct' : 'feedback-incorrect'}">
      <span aria-hidden="true">${correct ? '✓' : '✗'}</span> ${correct ? 'Exact.' : 'Pas tout à fait.'}
    </p>
    <p class="feedback-explanation">${explication}</p>
    ${xpMsg ? `<p class="feedback-xp">${xpMsg}</p>` : ''}
    ${!correct ? renderRecommendationPanel(categorie) : ''}`;
}


// ---------- Vrai ou faux : mini-jeu rapide (réutilisé par Défis et Play) ----------
// Puise dans QUIZ_BANK_FULL, uniquement les items type:"vraifaux" — aucun contenu dupliqué.
function renderVraiFaux(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const questions = QUIZ_BANK_FULL.filter(q=>q.type==='vraifaux');
  for(let i=questions.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  let qIndex = 0, score = 0;

  function renderQuestion(){
    if(qIndex >= questions.length){ renderResults(); return; }
    const item = questions[qIndex];
    const pct = Math.round((qIndex/questions.length)*100);
    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Affirmation ${qIndex+1} / ${questions.length}</span><span>${item.categorie}</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:16px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <div class="vf-statement">${item.question}</div>
      <div class="vf-buttons">
        <button class="vf-btn vf-true" data-choice="0">Vrai</button>
        <button class="vf-btn vf-false" data-choice="1">Faux</button>
      </div>
      <div class="vf-feedback" id="${elId}-feedback"></div>`;
    Array.from(el.querySelectorAll('.vf-btn')).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const choice = +btn.dataset.choice;
        el.querySelectorAll('.vf-btn').forEach(b=>b.disabled = true);
        const correct = choice === item.bonneReponse;
        recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
        let xpMsg = '';
        if(correct){
          btn.classList.add('vf-correct'); score++;
          const got = tryAwardQuizPoints(item.id, 10);
          if(got) xpMsg = `+${got} XP · +${got} Finance Points`;
          resolveMistake(item.id);
        } else {
          btn.classList.add('vf-wrong');
          const rightBtn = el.querySelector(`[data-choice="${item.bonneReponse}"]`);
          if(rightBtn) rightBtn.classList.add('vf-correct');
          recordMistake(item);
        }
        document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg, item.categorie);
        setTimeout(()=>{ qIndex++; renderQuestion(); }, 1700);
      }, {once:true});
    });
  }

  function renderResults(){
    const pct = questions.length ? Math.round((score/questions.length)*100) : 0;
    el.innerHTML = `
      <div class="result-big">${score} / ${questions.length}</div>
      <p style="color:var(--text-dim);font-size:13px;margin:8px 0 16px;">${pct}% de bonnes réponses.</p>
      <button class="btn btn-sm btn-gold" id="${elId}-restart">Recommencer</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-restart`).addEventListener('click', ()=>renderVraiFaux(elId));
    const touchedCategories = [...new Set(questions.map(q => q.categorie).filter(Boolean))];
    renderNextStepCard(`${elId}-nextstep`, {categories: touchedCategories});
  }

  renderQuestion();
}

// ============================================================
// Défis — moteurs de format "mentaux" (au-delà du QCM/vrai-faux)
// Chaque moteur respecte le même contrat : renderFormatX(container, item,
// onAnswered(correct, xpEarned)) — verrouille après une seule réponse,
// passe systématiquement par recordAnswer/recordMistake/resolveMistake/
// tryAwardQuizPoints (ou awardXP explicite quand il n'y a pas de bonne/
// mauvaise réponse unique), et affiche le feedback pédagogique partagé
// (renderFeedbackHtml) — jamais un ✅/❌ nu.
// ============================================================

// Tous les moteurs ci-dessous prennent un `elId` (identifiant de l'élément
// hôte déjà présent dans le DOM), pas une référence de nœud — même
// convention que le reste du fichier (startQuizSession, renderVraiFaux,
// renderMissionDetail...), ce qui les rend adressables sans collision même
// si plusieurs sessions existent sur une même page.

// ---------- Moteur interne : liste de choix avec bloc d'intro optionnel ----------
// Réutilisé par renderQcmItem (sans intro), renderCasItem et renderVraiMaisItem
// (avec intro) — même mécanique de clic/verrouillage/couleur que les moteurs
// QCM historiques, juste factorisée pour ne pas la dupliquer 3 fois.
function renderChoiceItem(elId, introHtml, item, onAnswered){
  const host = document.getElementById(elId);
  if(!host) return;
  host.innerHTML = `
    ${introHtml || ''}
    <div class="defi-q-prompt" style="font-size:15px;font-weight:500;margin-bottom:12px;">${item.question}</div>
    <div id="${elId}-opts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;"></div>
    <div id="${elId}-feedback"></div>`;
  const opts = document.getElementById(`${elId}-opts`);
  item.choix.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.style.textAlign = 'left';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      Array.from(opts.children).forEach((c, ci) => {
        c.disabled = true;
        if(ci === item.bonneReponse) c.style.borderColor = 'var(--emerald)';
        else if(ci === i) c.style.borderColor = 'var(--bordeaux)';
      });
      const correct = i === item.bonneReponse;
      recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
      const xp = item.xp || 10;
      let xpMsg = '';
      if(correct){
        const got = tryAwardQuizPoints(item.id, xp);
        if(got) xpMsg = `+${got} XP · +${got} Finance Points`;
        resolveMistake(item.id);
      } else {
        recordMistake(item);
      }
      document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg, item.categorie);
      onAnswered(correct, correct ? xp : 0);
    }, {once:true});
    opts.appendChild(btn);
  });
}

// ---------- Format "qcm" : items QUIZ_BANK_FULL (type qcm/situation/calcul-mcq) ----------
function renderQcmItem(elId, item, onAnswered){
  renderChoiceItem(elId, '', item, onAnswered);
}

// ---------- Format "vraifaux" : un seul item, extrait du pattern de renderVraiFaux
// (qui reste par ailleurs une boucle multi-questions autonome pour Play/jeu-vrai-faux.html) ----------
function renderVraiFauxItem(elId, item, onAnswered){
  const host = document.getElementById(elId);
  if(!host) return;
  host.innerHTML = `
    <div class="vf-statement">${item.question}</div>
    <div class="vf-buttons">
      <button class="vf-btn vf-true" data-choice="0">Vrai</button>
      <button class="vf-btn vf-false" data-choice="1">Faux</button>
    </div>
    <div id="${elId}-feedback" style="margin-top:16px;"></div>`;
  Array.from(host.querySelectorAll('.vf-btn')).forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = +btn.dataset.choice;
      host.querySelectorAll('.vf-btn').forEach(b => b.disabled = true);
      const correct = choice === item.bonneReponse;
      recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
      const xp = item.xp || 10;
      let xpMsg = '';
      if(correct){
        btn.classList.add('vf-correct');
        const got = tryAwardQuizPoints(item.id, xp);
        if(got) xpMsg = `+${got} XP · +${got} Finance Points`;
        resolveMistake(item.id);
      } else {
        btn.classList.add('vf-wrong');
        const rightBtn = host.querySelector(`[data-choice="${item.bonneReponse}"]`);
        if(rightBtn) rightBtn.classList.add('vf-correct');
        recordMistake(item);
      }
      document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg, item.categorie);
      onAnswered(correct, correct ? xp : 0);
    }, {once:true});
  });
}

// ---------- Format "cas" : mise en situation + question à choix ----------
// Un seul moteur pour 4 formats nommés par le cahier des charges (Trouve
// l'erreur / Qui a raison ? / Décision sous contrainte / Cas express) —
// seul le champ `presentation` change l'habillage de l'intro, la mécanique
// de réponse est identique.
function renderCasItem(elId, item, onAnswered){
  let introHtml;
  if(item.presentation === 'personnes' && Array.isArray(item.personnes)){
    introHtml = `<div class="defi-intro">${item.personnes.map(p => `
      <div class="defi-intro-quote">
        <span class="defi-intro-quote-name">${p.nom}</span>
        <p class="defi-intro-quote-text">« ${p.citation} »</p>
      </div>`).join('')}</div>`;
  } else if(item.presentation === 'situation' && Array.isArray(item.faits)){
    introHtml = `<div class="defi-intro">
      ${item.contexte ? `<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:8px;">${item.contexte}</p>` : ''}
      <ul class="defi-intro-facts">${item.faits.map(f => `<li>• ${f}</li>`).join('')}</ul>
    </div>`;
  } else {
    introHtml = `<div class="defi-intro"><p class="defi-intro-statement">${item.statement}</p></div>`;
  }
  renderChoiceItem(elId, introHtml, item, onAnswered);
}

// ---------- Format "vraimais" : affirmation vraie mais incomplète ----------
function renderVraiMaisItem(elId, item, onAnswered){
  const introHtml = `<div class="defi-intro">
    <span class="defi-vrai-chip">${ICONS.check} Vrai, mais...</span>
    <p class="defi-intro-statement">${item.statement}</p>
  </div>`;
  renderChoiceItem(elId, introHtml, item, onAnswered);
}

// ---------- Format "calcul" : mini-calcul à réponse numérique libre ----------
// UI reprise de renderMissionDetail (mission.html), mais règle d'interaction
// alignée sur les autres formats Défis : verrouille après le premier essai
// (mission.html laisse réessayer indéfiniment, ce qui ne convient pas à un
// défi noté).
function renderCalculItem(elId, item, onAnswered){
  const host = document.getElementById(elId);
  if(!host) return;
  host.innerHTML = `
    <div class="defi-q-prompt" style="font-size:15px;font-weight:500;margin-bottom:12px;">${item.prompt}</div>
    <div class="field" style="max-width:220px;">
      <input type="number" step="any" id="${elId}-input" placeholder="Ta réponse${item.unit ? ' (' + item.unit + ')' : ''}">
    </div>
    <button class="btn btn-sm btn-gold" id="${elId}-check">Vérifier</button>
    <div id="${elId}-feedback" style="margin-top:12px;"></div>`;
  const input = document.getElementById(`${elId}-input`);
  const btn = document.getElementById(`${elId}-check`);
  const feedbackEl = document.getElementById(`${elId}-feedback`);
  const check = () => {
    if(btn.disabled) return;
    const val = parseFloat(input.value);
    if(isNaN(val)){ feedbackEl.innerHTML = `<p class="feedback-explanation">Entre un nombre avant de vérifier.</p>`; return; }
    btn.disabled = true;
    input.disabled = true;
    const correct = Math.abs(val - item.reponse) <= item.tolerance;
    recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
    const xp = item.xp || 10;
    let xpMsg = '';
    if(correct){
      const got = tryAwardQuizPoints(item.id, xp);
      if(got) xpMsg = `+${xp} XP · +${xp} Finance Points`;
      resolveMistake(item.id);
    } else {
      recordMistake(item);
    }
    feedbackEl.innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg, item.categorie);
    onAnswered(correct, correct ? xp : 0);
  };
  btn.addEventListener('click', check);
  input.addEventListener('keydown', e => { if(e.key === 'Enter') check(); });
}

// ---------- Exercices à variables aléatoires (audit Formations Phase 2 du
// 27/08/2026 : aucun exercice du site ne régénérait ses chiffres — un même
// exercice affichait toujours les mêmes valeurs, mémorisables sans
// comprendre la méthode). Chaque entrée décrit un `generate()` pur qui tire
// des valeurs réalistes et calcule le résultat exact à partir d'elles —
// jamais une réponse pré-écrite qui pourrait diverger des chiffres tirés.
// Rendu ensuite via renderCalculItem, réutilisé tel quel (aucune nouvelle
// mécanique de saisie/correction à maintenir). ----------
function randMultiple(min, max, step){
  const count = Math.floor((max - min) / step) + 1;
  return min + step * Math.floor(Math.random() * count);
}
function randPick(options){
  return options[Math.floor(Math.random() * options.length)];
}
const RANDOM_EXERCISE_TEMPLATES = {
  interetsComposes: {
    generate(){
      const capital = randMultiple(1000, 5000, 100);
      const taux = randMultiple(2, 8, 1);
      const duree = randMultiple(2, 5, 1);
      const valeurFinale = capital * Math.pow(1 + taux/100, duree);
      const interets = valeurFinale - capital;
      return {
        prompt: `Tu places ${fmtEUR(capital)} à intérêts composés, à un taux de ${taux}% par an, pendant ${duree} ans. Combien d'intérêts au total ce placement a-t-il rapportés à la fin (arrondis à l'euro le plus proche) ?`,
        unit: '€',
        reponse: Math.round(interets),
        tolerance: 1,
        explication: `Valeur finale = ${fmtEUR(capital)} × (1 + ${taux}%)^${duree} ≈ ${fmtEUR(valeurFinale)}. Intérêts gagnés = valeur finale − capital de départ ≈ ${fmtEUR(interets)}.`
      };
    }
  },
  margeNette: {
    generate(){
      const ca = randMultiple(100000, 500000, 10000);
      const margePct = randPick([3,5,8,10,12,15]);
      const resultatNet = Math.round(ca * margePct / 100);
      return {
        prompt: `Une entreprise réalise ${fmtEUR(ca)} de chiffre d'affaires et ${fmtEUR(resultatNet)} de résultat net sur l'année. Quelle est sa marge nette, en % (arrondie à 1 décimale) ?`,
        unit: '%',
        reponse: Math.round((resultatNet/ca)*1000)/10,
        tolerance: 0.15,
        explication: `Marge nette = Résultat net ÷ Chiffre d'affaires = ${fmtEUR(resultatNet)} ÷ ${fmtEUR(ca)} = ${margePct}%.`
      };
    }
  },
  rendementLocatifBrut: {
    generate(){
      const prix = randMultiple(100000, 400000, 10000);
      const rendementPct = randPick([4,5,6,7,8]);
      const loyers = Math.round(prix * rendementPct / 100);
      return {
        prompt: `Un bien immobilier acheté ${fmtEUR(prix)} génère ${fmtEUR(loyers)} de loyers annuels. Quel est son rendement locatif brut, en % (arrondi à 1 décimale) ?`,
        unit: '%',
        reponse: Math.round((loyers/prix)*1000)/10,
        tolerance: 0.15,
        explication: `Rendement brut = Loyers annuels ÷ Prix d'achat = ${fmtEUR(loyers)} ÷ ${fmtEUR(prix)} = ${rendementPct}%.`
      };
    }
  },
  tailleDePosition: {
    generate(){
      const capital = randMultiple(2000, 20000, 1000);
      const risquePct = randPick([0.5, 1, 1.5, 2]);
      const distance = randPick([0.5, 1, 2, 2.5, 5]);
      const maxLoss = capital * risquePct / 100;
      const quantite = Math.floor(maxLoss / distance);
      return {
        prompt: `Ton capital est de ${fmtEUR(capital)} et tu acceptes de risquer ${risquePct}% de ce capital sur cette opération. L'écart entre ton prix d'entrée et ton stop-loss est de ${distance}€ par action. Combien d'actions au maximum peux-tu acheter pour respecter ce risque (nombre entier) ?`,
        unit: 'actions',
        reponse: quantite,
        tolerance: 0,
        explication: `Perte maximale acceptée = Capital × % risqué = ${fmtEUR(capital)} × ${risquePct}% = ${fmtEUR(maxLoss)}. Taille de position = Perte maximale ÷ distance entrée-stop = ${fmtEUR(maxLoss)} ÷ ${distance}€ = ${(maxLoss/distance).toFixed(2)}, arrondi à l'unité inférieure (on ne peut pas acheter une fraction d'action) : ${quantite} actions.`
      };
    }
  },
  seuilRentabilite: {
    generate(){
      const chargesFixes = randMultiple(2000, 10000, 500);
      const margePct = randPick([20, 25, 30, 40, 50]);
      const seuil = Math.round(chargesFixes / (margePct/100));
      const tolerance = Math.max(50, Math.round(seuil * 0.01));
      return {
        prompt: `Une entreprise a ${fmtEUR(chargesFixes)} de charges fixes mensuelles, et chaque vente lui laisse une marge sur coût variable de ${margePct}%. Quel chiffre d'affaires mensuel doit-elle réaliser pour atteindre son seuil de rentabilité (arrondi à l'euro le plus proche) ?`,
        unit: '€',
        reponse: seuil,
        tolerance,
        explication: `Seuil de rentabilité = Charges fixes ÷ Marge sur coût variable (%) = ${fmtEUR(chargesFixes)} ÷ ${margePct}% ≈ ${fmtEUR(seuil)}. En dessous de ce chiffre d'affaires, l'entreprise est en perte ; au-dessus, elle devient bénéficiaire.`
      };
    }
  }
};
function renderCalculAleatoireItem(elId, item, onAnswered){
  const template = RANDOM_EXERCISE_TEMPLATES[item.templateId];
  const host = document.getElementById(elId);
  if(!host) return;
  if(!template){ host.innerHTML = `<p class="empty-note">Exercice indisponible pour le moment.</p>`; return; }
  const generated = Object.assign({}, item, template.generate());
  renderCalculItem(elId, generated, onAnswered);
}

// ---------- Format "sequence" : remettre des étapes dans le bon ordre ----------
// Boutons Monter/Descendre plutôt que drag & drop, volontairement : le
// cahier des charges lui-même met en garde contre un drag & drop peu fiable
// sur mobile (§12/§49) — cette version fonctionne identiquement au clavier,
// à la souris et au tactile.
function renderSequenceItem(elId, item, onAnswered){
  const host = document.getElementById(elId);
  if(!host) return;
  let order = item.steps.map((_, i) => i);
  for(let i = order.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if(order.every((v, i) => v === i) && order.length > 1){ const t = order[0]; order[0] = order[1]; order[1] = t; }

  function render(){
    host.innerHTML = `
      <div class="defi-q-prompt" style="font-size:15px;font-weight:500;margin-bottom:6px;">${item.prompt}</div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:12px;">Remets ces étapes dans le bon ordre.</p>
      <div id="${elId}-list" class="defi-seq-list"></div>
      <button class="btn btn-sm btn-gold" id="${elId}-validate">Valider l'ordre</button>
      <div id="${elId}-feedback" style="margin-top:12px;"></div>`;
    const list = document.getElementById(`${elId}-list`);
    order.forEach((stepIdx, pos) => {
      const row = document.createElement('div');
      row.className = 'defi-seq-row';
      row.innerHTML = `
        <div class="defi-seq-row-text">${item.steps[stepIdx]}</div>
        <div class="defi-seq-row-controls">
          <button class="defi-seq-btn" data-dir="up" ${pos===0?'disabled':''} aria-label="Monter">↑</button>
          <button class="defi-seq-btn" data-dir="down" ${pos===order.length-1?'disabled':''} aria-label="Descendre">↓</button>
        </div>`;
      row.querySelector('[data-dir="up"]').addEventListener('click', () => move(pos, -1));
      row.querySelector('[data-dir="down"]').addEventListener('click', () => move(pos, 1));
      list.appendChild(row);
    });
    document.getElementById(`${elId}-validate`).addEventListener('click', validate, {once:true});
  }
  function move(pos, dir){
    const target = pos + dir;
    if(target < 0 || target >= order.length) return;
    [order[pos], order[target]] = [order[target], order[pos]];
    render();
  }
  function validate(){
    const correct = order.every((stepIdx, pos) => stepIdx === pos);
    host.querySelectorAll('.defi-seq-btn').forEach(b => b.disabled = true);
    host.querySelectorAll('.defi-seq-row').forEach((row, pos) => {
      row.classList.add(order[pos] === pos ? 'defi-seq-correct' : 'defi-seq-wrong');
    });
    recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
    const xp = item.xp || 12;
    let xpMsg = '';
    if(correct){
      const got = tryAwardQuizPoints(item.id, xp);
      if(got) xpMsg = `+${xp} XP · +${xp} Finance Points`;
      resolveMistake(item.id);
    } else {
      recordMistake(item);
    }
    document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg, item.categorie);
    onAnswered(correct, correct ? xp : 0);
  }
  render();
}

// ---------- Format "infomanquante" : sélection multiple, sans bonne/mauvaise réponse ----------
// Le but pédagogique est justement qu'on ne peut pas conclure avec les seules
// informations données — donc pas de recordAnswer/recordMistake ici, mais
// l'XP de participation passe bien par tryAwardQuizPoints (donc par
// awardXP → logActivity) pour ne pas fausser le suivi de série/activité.
function renderInfoManquanteItem(elId, item, onAnswered){
  const host = document.getElementById(elId);
  if(!host) return;
  host.innerHTML = `
    ${item.contexte ? `<div class="defi-intro"><p style="font-size:13.5px;color:var(--text-dim);">${item.contexte}</p></div>` : ''}
    <div class="defi-q-prompt" style="font-size:15px;font-weight:500;margin-bottom:4px;">${item.question}</div>
    <p style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">Sélectionne autant d'éléments que tu veux, puis valide.</p>
    <div id="${elId}-list" class="defi-info-list"></div>
    <button class="btn btn-sm btn-gold" id="${elId}-validate">Valider</button>
    <div id="${elId}-feedback" style="margin-top:12px;"></div>`;
  const list = document.getElementById(`${elId}-list`);
  item.options.forEach((opt, i) => {
    const label = document.createElement('label');
    label.className = 'defi-info-option';
    label.innerHTML = `<input type="checkbox" data-idx="${i}"><span class="defi-info-option-text">${opt.label}</span>`;
    list.appendChild(label);
  });
  document.getElementById(`${elId}-validate`).addEventListener('click', () => {
    list.querySelectorAll('input').forEach(cb => cb.disabled = true);
    document.getElementById(`${elId}-validate`).disabled = true;
    const notes = item.options.map(o => `<li>• <strong>${o.label}</strong> — ${o.note}</li>`).join('');
    const xp = item.xp || 8;
    const got = tryAwardQuizPoints(item.id, xp);
    const xpMsg = got ? `+${got} XP · +${got} Finance Points` : '';
    document.getElementById(`${elId}-feedback`).innerHTML = `
      <p class="feedback-verdict feedback-correct"><span aria-hidden="true">✓</span> Bonne question à se poser.</p>
      <p class="feedback-explanation">${item.explication}</p>
      <ul class="defi-intro-facts" style="margin-top:8px;">${notes}</ul>
      ${xpMsg ? `<p class="feedback-xp">${xpMsg}</p>` : ''}`;
    onAnswered(true, got ? xp : 0);
  }, {once:true});
}

// ---------- Format "classe" : classer chaque élément dans un panier (select) ----------
// Pas de drag & drop (même raison que "sequence") — un <select> par élément.
// Seuil documenté : ≥70% des éléments bien classés = un recordAnswer(true)
// pour rester cohérent avec le comptage binaire de la maîtrise par thème.
function renderClasseItem(elId, item, onAnswered){
  const host = document.getElementById(elId);
  if(!host) return;
  host.innerHTML = `
    <div class="defi-q-prompt" style="font-size:15px;font-weight:500;margin-bottom:12px;">${item.prompt}</div>
    <div id="${elId}-list" class="defi-classe-list"></div>
    <button class="btn btn-sm btn-gold" id="${elId}-validate">Valider</button>
    <div id="${elId}-feedback" style="margin-top:12px;"></div>`;
  const list = document.getElementById(`${elId}-list`);
  item.items.forEach((it, i) => {
    const row = document.createElement('div');
    row.className = 'defi-classe-row';
    row.innerHTML = `
      <span class="defi-classe-row-label">${it.label}</span>
      <select data-idx="${i}">
        <option value="">—</option>
        ${item.buckets.map(b => `<option value="${b}">${b}</option>`).join('')}
      </select>`;
    list.appendChild(row);
  });
  document.getElementById(`${elId}-validate`).addEventListener('click', () => {
    const selects = Array.from(list.querySelectorAll('select'));
    let correctCount = 0;
    selects.forEach((sel, i) => {
      sel.disabled = true;
      const row = sel.closest('.defi-classe-row');
      const ok = sel.value === item.items[i].bucket;
      if(ok) correctCount++;
      row.classList.add(ok ? 'defi-classe-correct' : 'defi-classe-wrong');
    });
    document.getElementById(`${elId}-validate`).disabled = true;
    const correct = (correctCount / item.items.length) >= 0.7;
    recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
    const xp = item.xp || 12;
    let xpMsg = '';
    if(correct){
      const got = tryAwardQuizPoints(item.id, xp);
      if(got) xpMsg = `+${xp} XP · +${xp} Finance Points`;
      resolveMistake(item.id);
    } else {
      recordMistake(item);
    }
    document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, `${correctCount}/${item.items.length} bien classés. ${item.explication}`, xpMsg, item.categorie);
    onAnswered(correct, correct ? xp : 0);
  }, {once:true});
}

// ---------- Format "dilemme" : plusieurs choix peuvent être raisonnables
// selon le contexte — jamais une seule bonne réponse fabriquée
// artificiellement. Chaque option porte un booléen `defensible` décidé par
// le contenu du défi lui-même (pas un simple index unique de bonne réponse) ;
// plusieurs options peuvent être `defensible:true` en même temps. La
// réponse est "correcte" si l'option choisie est défendable dans CE
// contexte précis — le feedback affiche toujours l'analyse propre à
// l'option choisie, jamais un jugement générique. ----------
function renderDilemmeItem(elId, item, onAnswered){
  const host = document.getElementById(elId);
  if(!host) return;
  host.innerHTML = `
    <div class="defi-intro"><p class="defi-intro-statement">${item.situation}</p></div>
    <div class="defi-q-prompt" style="font-size:15px;font-weight:500;margin-bottom:12px;">${item.question}</div>
    <div id="${elId}-opts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;"></div>
    <div id="${elId}-feedback"></div>`;
  const opts = document.getElementById(`${elId}-opts`);
  item.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.style.textAlign = 'left';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      Array.from(opts.children).forEach((c, ci) => {
        c.disabled = true;
        if(ci === i) c.style.borderColor = opt.defensible ? 'var(--emerald)' : 'var(--bordeaux)';
      });
      const correct = !!opt.defensible;
      recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
      const xp = item.xp || 15;
      let xpMsg = '';
      if(correct){
        const got = tryAwardQuizPoints(item.id, xp);
        if(got) xpMsg = `+${got} XP · +${got} Finance Points`;
        resolveMistake(item.id);
      } else {
        recordMistake(item);
      }
      document.getElementById(`${elId}-feedback`).innerHTML = `
        <p class="feedback-verdict ${correct ? 'feedback-correct' : 'feedback-incorrect'}">
          <span aria-hidden="true">${correct ? '✓' : '⚠'}</span> ${correct ? 'Choix défendable dans ce contexte.' : 'Contestable dans ce contexte précis.'}
        </p>
        <p class="feedback-explanation">${opt.analyse}</p>
        ${item.conclusion ? `<p class="feedback-explanation" style="margin-top:8px;font-style:italic;">${item.conclusion}</p>` : ''}
        ${xpMsg ? `<p class="feedback-xp">${xpMsg}</p>` : ''}`;
      onAnswered(correct, correct ? xp : 0);
    }, {once:true});
    opts.appendChild(btn);
  });
}

// ---------- Format "enquete" : plusieurs indices réels à croiser avant de
// répondre, présentés comme un dossier — jamais une conclusion évidente en
// un coup d'œil. Réutilise le moteur QCM déjà partagé (renderChoiceItem,
// même mécanique que "cas"/"vraimais") : seule la présentation change. ----------
function renderEnqueteItem(elId, item, onAnswered){
  const introHtml = `<div class="defi-intro">
    ${item.affirmation ? `<p class="defi-intro-statement" style="margin-bottom:10px;">${item.affirmation}</p>` : ''}
    <ul class="defi-intro-facts">${(item.indices || []).map(ind => `<li>• <strong>${ind.label}</strong> : ${ind.valeur}</li>`).join('')}</ul>
  </div>`;
  renderChoiceItem(elId, introHtml, item, onAnswered);
}

// ---------- Orchestrateur : session mêlant plusieurs formats/domaines ----------
// Détermine le format réel d'un item (les items QUIZ_BANK_FULL utilisent
// `type`, les items MENTAL_CHALLENGES utilisent `format` directement).
function resolveDefiFormat(item){
  if(item.format) return item.format;
  if(item.type === 'vraifaux') return 'vraifaux';
  return 'qcm'; // 'qcm' | 'situation' | 'calcul' (QUIZ_BANK_FULL) rendus tous comme un choix simple
}
const DEFI_FORMAT_RENDERERS = {
  qcm: renderQcmItem,
  vraifaux: renderVraiFauxItem,
  cas: renderCasItem,
  vraimais: renderVraiMaisItem,
  calcul: renderCalculItem,
  sequence: renderSequenceItem,
  infomanquante: renderInfoManquanteItem,
  classe: renderClasseItem,
  dilemme: renderDilemmeItem,
  enquete: renderEnqueteItem,
  calculAleatoire: renderCalculAleatoireItem
};

// ---------- Adaptation de la difficulté (section 27 du prompt Learning
// Engine) : "si l'utilisateur réussit facilement, augmenter la difficulté ;
// s'il échoue, proposer un niveau intermédiaire — jamais un changement
// absurde sur une seule réponse." Basé sur getSkillMastery (déjà pondéré
// par difficulté, voir DIFFICULTY_WEIGHT), donc déjà lissé sur l'historique
// réel — une seule bonne/mauvaise réponse ne fait pas basculer le niveau
// visé. Uniquement les 3 niveaux réellement présents dans le contenu
// (aucun défi/quiz n'utilise "expert" aujourd'hui). ----------
const NIVEAU_ORDER = ['debutant', 'intermediaire', 'avance'];
function targetNiveauForCategorie(categorie){
  const m = getSkillMastery().find(x => x.categorie === categorie);
  if(!m || m.total < 4) return 'debutant'; // pas assez de données -> commencer par les fondamentaux, jamais deviner
  if(m.pct < 40) return 'debutant';
  if(m.pct < 70) return 'intermediaire';
  return 'avance';
}
// Trie par proximité avec le niveau visé (le plus proche en premier), en
// mélangeant aléatoirement au sein d'un même niveau de proximité — jamais un
// classement figé qui montrerait toujours les mêmes exercices en premier.
// Un niveau absent/inconnu sur un item est traité comme le plus éloigné,
// jamais priorisé par erreur.
function pickAdaptivePool(pool, categorie, count){
  const targetIdx = NIVEAU_ORDER.indexOf(targetNiveauForCategorie(categorie));
  return pool
    .map(item => {
      const idx = NIVEAU_ORDER.indexOf(item.niveau);
      const distance = idx === -1 ? NIVEAU_ORDER.length : Math.abs(idx - targetIdx);
      return {item, distance, rand: Math.random()};
    })
    .sort((a, b) => a.distance - b.distance || a.rand - b.rand)
    .slice(0, count)
    .map(s => s.item);
}

// Contrairement à startQuizSession/renderVraiFaux (avance automatiquement
// après 1400-1700ms), la session mixte avance sur un clic explicite : les
// nouveaux formats (cas, séquence, info manquante...) ont un texte plus
// dense qu'un simple QCM, une avancée chronométrée forcerait à lire vite
// plutôt qu'à réfléchir — contraire à l'objectif même de Défis.
function startMixedSession(elId, items, opts){
  const el = document.getElementById(elId);
  if(!el) return;
  opts = opts || {};
  if(!items || items.length === 0){
    el.innerHTML = `<p class="empty-note">Pas assez d'exercices disponibles pour cette sélection.</p>`;
    return;
  }
  let index = 0, score = 0, totalXp = 0;
  const startTime = Date.now();

  function renderItem(){
    if(index >= items.length){ renderResults(); return; }
    const item = items[index];
    const format = resolveDefiFormat(item);
    const renderer = DEFI_FORMAT_RENDERERS[format];
    const pct = Math.round((index / items.length) * 100);
    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>${index + 1} / ${items.length}</span><span>${item.categorie || item.domain || ''}</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:16px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <div id="${elId}-item"></div>
      <div id="${elId}-next" style="margin-top:16px;"></div>`;
    const itemElId = `${elId}-item`;
    if(!renderer){
      document.getElementById(itemElId).innerHTML = `<p class="empty-note">Format d'exercice non pris en charge pour le moment.</p>`;
      index++;
      renderItem();
      return;
    }
    renderer(itemElId, item, (correct, xp) => {
      if(correct) score++;
      totalXp += xp;
      const nextEl = document.getElementById(`${elId}-next`);
      const isLast = index === items.length - 1;
      nextEl.innerHTML = `<button class="btn btn-sm btn-gold" id="${elId}-advance">${isLast ? 'Voir le résultat' : 'Question suivante →'}</button>`;
      document.getElementById(`${elId}-advance`).addEventListener('click', () => { index++; renderItem(); });
    });
  }

  function renderResults(){
    const pct = Math.round((score / items.length) * 100);
    const seconds = Math.round((Date.now() - startTime) / 1000);
    let msg = "Revois les notions essentielles avant de réessayer.";
    if(pct >= 90) msg = "Excellente maîtrise du sujet.";
    else if(pct >= 70) msg = "Très bon résultat.";
    else if(pct >= 50) msg = "Les bases sont là, certaines notions restent à consolider.";
    // Alimente le même historique que l'ancien moteur QCM (fzr-quiz-stats),
    // pour que "Cette semaine" (renderDefisSemaine) reflète aussi les sessions
    // lancées depuis Défi du jour / Recommandé / À revoir / Parcours.
    recordQuizCompletion(opts.level || 'mixte', opts.categorie || 'mélange', items.length, pct);
    el.innerHTML = `
      <div class="result-big">${score} / ${items.length} <span style="font-size:16px;color:var(--text-dim);">(${pct}%)</span></div>
      <p style="color:var(--text-dim);font-size:14px;margin:8px 0;">${msg}</p>
      <p style="font-size:11.5px;color:var(--text-dim);">Temps passé : ${seconds}s${totalXp > 0 ? ` · +${totalXp} XP au total` : ''}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
        ${opts.onRestart ? `<button class="btn btn-sm btn-gold" id="${elId}-restart">Nouveau défi</button>` : ''}
        ${opts.showParcoursLink ? `<a href="parcours.html" class="btn btn-sm">Voir mon parcours →</a>` : ''}
      </div>
      <div id="${elId}-nextstep"></div>`;
    if(opts.onRestart) document.getElementById(`${elId}-restart`).addEventListener('click', opts.onRestart);
    const touchedCategories = [...new Set(items.map(i => i.categorie).filter(Boolean))];
    renderNextStepCard(`${elId}-nextstep`, {categories: touchedCategories, domainKey: opts.level});
    // Distinct de onRestart (qui ne se déclenche que sur un clic explicite) :
    // onComplete se déclenche à chaque fois que la session arrive naturellement
    // à son résultat — nécessaire pour suivre la progression des Parcours
    // thématiques sans dépendre d'un clic supplémentaire de l'utilisateur.
    if(typeof opts.onComplete === 'function') opts.onComplete(score, items.length);
  }

  renderItem();
}

// Pool combiné, utilisé par toutes les sections personnalisées de Défis
// ci-dessous (Défi du jour, Recommandé pour toi, À revoir) : les deux
// banques ont des id distincts (vérifié par test), donc aucune collision.
function defisFullPool(){ return QUIZ_BANK_FULL.concat(MENTAL_CHALLENGES); }

// ---------- Défi du jour : 3 exercices, choisis de façon déterministe par
// jour (identiques pour tout le monde le même jour, changent le lendemain) ----------
function pickDefiDuJourItems(){
  const pool = defisFullPool();
  const seed = dayOfYear();
  const picked = [];
  const usedCategories = new Set();
  let i = seed, attempts = 0;
  while(picked.length < 3 && attempts < pool.length * 2){
    const item = pool[i % pool.length];
    if(!usedCategories.has(item.categorie)){
      picked.push(item);
      usedCategories.add(item.categorie);
    }
    i += 37; // pas premier avec la plupart des tailles de pool, pour bien répartir le tirage
    attempts++;
  }
  i = seed;
  while(picked.length < 3 && picked.length < pool.length){
    const item = pool[i % pool.length];
    if(!picked.includes(item)) picked.push(item);
    i++;
  }
  return picked;
}

// ---------- Barre de statistiques du tableau de bord Défis (niveau, XP,
// série, ligue, Financial IQ) — uniquement des valeurs déjà réellement
// suivies ailleurs sur le site (getGamification/levelFromXP/currentLeague/
// computeFinancialIQ), jamais un nouveau compteur inventé pour ce widget.
// Le Financial IQ affiche un tiret honnête tant qu'il n'y a pas assez de
// vraies réponses pour le calculer (voir renderFinancialIQDetail pour le
// détail par domaine + méthodologie).----------
function renderDefisStatsBar(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const g = getGamification();
  const lvl = levelFromXP(g.xp);
  const league = currentLeague(g.xp);
  const iq = computeFinancialIQ();
  const rank = iq ? masteryRankFromPct(iq.pct) : null;
  const stats = [
    {label: 'Niveau', value: lvl.level, sub: lvl.title},
    {label: 'XP', value: g.xp},
    {label: 'Série', value: `${g.streak} 🔥`},
    {label: 'Ligue', value: league.name},
    {label: 'Financial IQ', value: iq !== null ? iq.pct + ' %' : '—', sub: iq !== null ? `${rank.emoji} ${rank.name}` : 'Réponds à quelques défis pour le débloquer'}
  ];
  el.innerHTML = `<div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:14px;">
    ${stats.map(s => `<div class="card" style="padding:12px 14px;">
      <span class="smallcaps">${s.label}</span>
      <div class="result-big" style="font-size:20px;margin-top:4px;">${s.value}</div>
      ${s.sub ? `<p style="font-size:11px;color:var(--text-dim);margin-top:2px;">${s.sub}</p>` : ''}
    </div>`).join('')}
  </div>`;
}

// ---------- Lanceur générique de session filtrée par format (Casse-têtes,
// Dilemmes, Enquêtes) : un seul moteur de lancement/mélange/relance, jamais
// dupliqué pour chaque nouvel onglet de raisonnement. ----------
function renderDefisFormatLauncher(elId, pool, intro, buttonLabel){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <p style="font-size:13px;color:var(--text-dim);margin-bottom:14px;max-width:70ch;">${intro}</p>
    <button class="btn btn-gold" id="${elId}-start">${buttonLabel}</button>
    <div id="${elId}-session" style="margin-top:16px;"></div>`;
  document.getElementById(`${elId}-start`).addEventListener('click', () => {
    // Volontairement PAS de pickAdaptivePool ici (audit Formations Phase 3
    // du 27/08/2026) : ce lanceur mélange plusieurs thèmes à la fois par
    // conception (variété de raisonnement, pas maîtrise d'un seul thème) —
    // biaiser vers un seul niveau cible n'aurait pas de sens sur un pool
    // multi-catégories comme celui-ci.
    const shuffled = [...pool];
    for(let i = shuffled.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const sessionEl = document.getElementById(`${elId}-session`);
    startMixedSession(`${elId}-session`, shuffled.slice(0, Math.min(6, shuffled.length)), {onRestart: () => renderDefisFormatLauncher(elId, pool, intro, buttonLabel)});
    if(sessionEl && sessionEl.scrollIntoView) sessionEl.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  });
}
// Casse-têtes : formats de raisonnement "classiques" (trouve l'erreur,
// vrai-mais-incomplet, remets dans l'ordre, info manquante, classement,
// calcul) — Dilemmes et Enquêtes ont chacun leur propre onglet dédié
// ci-dessous, jamais le même contenu dupliqué dans deux onglets à la fois.
function renderDefisCassesTetes(elId){
  const pool = MENTAL_CHALLENGES.filter(c => c.format !== 'dilemme' && c.format !== 'enquete');
  renderDefisFormatLauncher(elId, pool,
    "Pas de définition à réciter, ni de calcul isolé : un raisonnement à démêler à chaque fois — trouve l'erreur dans un raisonnement, ce qui manque pour vraiment conclure, remets des événements dans l'ordre logique, ou classe des éléments selon un critère.",
    "Lancer une session de casse-têtes");
}
// Dilemmes : plusieurs choix défendables selon le contexte, jamais une seule
// bonne réponse fabriquée — voir renderDilemmeItem.
function renderDefisDilemmes(elId){
  const pool = MENTAL_CHALLENGES.filter(c => c.format === 'dilemme');
  renderDefisFormatLauncher(elId, pool,
    "Pas de bonne réponse unique : plusieurs choix peuvent être raisonnables selon le contexte. À chaque fois, découvre pourquoi une option se défend — et pourquoi une autre ne se défend pas dans cette situation précise.",
    "Lancer un dilemme");
}
// Enquêtes : un dossier de vrais indices à croiser avant de conclure — voir renderEnqueteItem.
function renderDefisEnquetes(elId){
  const pool = MENTAL_CHALLENGES.filter(c => c.format === 'enquete');
  renderDefisFormatLauncher(elId, pool,
    "Un dossier d'indices à croiser avant de conclure — comme un vrai enquêteur financier, jamais une conclusion évidente en un coup d'œil.",
    "Ouvrir un dossier");
}
function renderDefiDuJour(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const items = pickDefiDuJourItems();
  if(items.length === 0){ el.innerHTML = `<p class="empty-note">Défi du jour indisponible pour le moment.</p>`; return; }
  const totalXp = items.reduce((s, it) => s + (it.xp || 10), 0);
  const totalTime = items.reduce((s, it) => s + (it.estimatedTime || 1), 0);
  const domains = [...new Set(items.map(it => it.domain || it.categorie))];
  function renderIntro(){
    el.innerHTML = `
      <span class="smallcaps">⚡ Défi du jour</span>
      <p style="font-size:13px;color:var(--text-dim);margin:8px 0 14px;">${domains.join(' · ')}</p>
      <div class="defi-hero-meta">
        <span>${items.length} questions</span>
        <span>~${totalTime} min</span>
        <span>jusqu'à +${totalXp} XP</span>
      </div>
      <button class="btn btn-gold" id="${elId}-start">Commencer</button>`;
    document.getElementById(`${elId}-start`).addEventListener('click', () => {
      // Volontairement PAS de pickAdaptivePool ici (audit Formations Phase 3
      // du 27/08/2026) : le Défi du jour est une sélection déjà curatée par
      // pickDefiDuJourItems (multi-catégories, un défi identique pour tous
      // ce jour-là) — la re-trier par mastery casserait cette identité.
      startMixedSession(elId, items, {onRestart: renderIntro});
    });
  }
  renderIntro();
}

// ---------- Recommandé pour toi : catégorie la plus faible en maîtrise, ou
// à défaut liée à un centre d'intérêt encore peu exploré ----------
function renderRecommandePourToi(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const mastery = getSkillMastery();
  const weakest = mastery.find(m => m.niveau === 'faible');
  let categorie, reason;
  if(weakest){
    categorie = weakest.categorie;
    reason = `Tu as récemment eu du mal avec ${categorie} (${weakest.pct}% de bonnes réponses).`;
  } else {
    const profile = getProfile();
    const knownInterests = Object.keys(profile.interests || {}).filter(k => profile.interests[k]);
    const candidateCats = knownInterests.flatMap(k => INTEREST_QUIZ_CATEGORIES[k] || []);
    const exploredCats = new Set(mastery.map(m => m.categorie));
    const unexplored = candidateCats.filter(c => !exploredCats.has(c));
    if(unexplored.length > 0){
      categorie = unexplored[dayOfYear() % unexplored.length];
      reason = "Ça correspond à l'un de tes centres d'intérêt, et tu ne l'as pas encore beaucoup exploré.";
    } else {
      const allCats = [...new Set(defisFullPool().map(i => i.categorie))];
      categorie = allCats[dayOfYear() % allCats.length];
      reason = "Un thème à découvrir pour varier tes révisions.";
    }
  }
  el.innerHTML = `
    <span class="smallcaps">🎯 Recommandé pour toi</span>
    <p style="font-size:12.5px;color:var(--text-dim);margin:6px 0 10px;">${reason}</p>
    <h3 style="margin-bottom:10px;font-size:17px;">${categorie}</h3>
    <button class="btn btn-sm btn-gold" id="${elId}-start">S'entraîner sur ce thème →</button>`;
  document.getElementById(`${elId}-start`).addEventListener('click', () => {
    const pool = defisFullPool().filter(i => i.categorie === categorie);
    startMixedSession(elId, pickAdaptivePool(pool, categorie, 5), {onRestart: () => renderRecommandePourToi(elId)});
  });
}

// ---------- À revoir : widget compact (comme sur Mon parcours), lance
// directement une session ciblée sur la catégorie la plus en échec ----------
function renderDefisARevoir(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const unresolved = getMistakes().filter(m => !m.resolved);
  if(unresolved.length === 0){
    el.innerHTML = `<span class="smallcaps">🧠 À revoir</span><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Aucune notion en attente de révision pour le moment : continue comme ça !</p>`;
    return;
  }
  const counts = {};
  unresolved.forEach(m => { counts[m.categorie] = (counts[m.categorie] || 0) + 1; });
  const [topCategorie, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  el.innerHTML = `
    <span class="smallcaps">🧠 À revoir</span>
    <p style="font-size:13px;color:var(--text-dim);margin:6px 0 12px;">${unresolved.length} notion${unresolved.length > 1 ? 's' : ''} à revoir, surtout en ${topCategorie} (${topCount} erreur${topCount > 1 ? 's' : ''}).</p>
    <button class="btn btn-sm btn-gold" id="${elId}-start">S'entraîner sur ${topCategorie} →</button>`;
  document.getElementById(`${elId}-start`).addEventListener('click', () => {
    const pool = defisFullPool().filter(i => i.categorie === topCategorie);
    startMixedSession(elId, pickAdaptivePool(pool, topCategorie, 5), {onRestart: () => renderDefisARevoir(elId)});
  });
}

// ---------- Parcours thématiques : séries de catégories, sans verrouillage
// entre étapes (§22) — juste une progression suivie et affichée. Crypto
// volontairement absent : le stock de contenu réel y est encore trop mince
// pour constituer une série complète (à enrichir en phase future). ----------
const DEFIS_PARCOURS = [
  {id:'argent', titre:"💰 Comprendre son argent", categories:['Budget','Épargne','Livret A','Inflation','Crédit','Intérêts composés',"Constitution d'un patrimoine",'Retraite et PER']},
  {id:'bourse', titre:"📈 Comprendre la Bourse", categories:['Bourse','Actions','ETF','Obligations','Diversification','Risque et volatilité','PEA',"Psychologie de l'investisseur"]},
  {id:'business', titre:"💼 Penser comme un entrepreneur", categories:["Chiffre d'affaires",'Marge nette','Bilan comptable','Amortissement','Startup','Levée de fonds']},
  {id:'immobilier', titre:"🏠 Comprendre l'immobilier", categories:['Immobilier','SCPI','Crédit']},
  {id:'economie', titre:"🌍 Comprendre l'économie", categories:['PIB','Taux directeur','Banque centrale','Récession','Offre et demande']}
];
function getDefisParcoursProgress(){ return safeGetJSON('fzr-defis-parcours-progress', {}); }
function renderDefisParcours(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const progress = getDefisParcoursProgress();
  el.innerHTML = DEFIS_PARCOURS.map(p => {
    const doneCount = p.categories.filter(c => progress[`${p.id}-${c}`]).length;
    return `
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <h3 style="font-size:16px;">${p.titre}</h3>
        <span class="meta-line">${doneCount} / ${p.categories.length}</span>
      </div>
      <div style="margin-top:8px;">
        ${p.categories.map((c, i) => `
          <button type="button" class="defi-parcours-step ${progress[`${p.id}-${c}`] ? 'is-done' : ''}" style="background:none;border:none;text-align:left;width:100%;cursor:pointer;" data-parcours="${p.id}" data-cat="${c}">
            ${progress[`${p.id}-${c}`] ? ICONS.check + ' ' : (i + 1) + '. '}${c}
          </button>`).join('')}
        <div class="defi-parcours-step is-boss">Boss — bientôt</div>
      </div>
    </div>`;
  }).join('') + `<div id="${elId}-session"></div>`;
  el.querySelectorAll('[data-cat]').forEach(row => {
    row.addEventListener('click', () => {
      const cat = row.dataset.cat, parcoursId = row.dataset.parcours;
      const pool = defisFullPool().filter(i => i.categorie === cat);
      if(pool.length === 0) return;
      const sessionEl = document.getElementById(`${elId}-session`);
      if(!sessionEl) return;
      startMixedSession(`${elId}-session`, pickAdaptivePool(pool, cat, 6), {
        onComplete: () => {
          const p2 = getDefisParcoursProgress();
          p2[`${parcoursId}-${cat}`] = true;
          safeSetJSON('fzr-defis-parcours-progress', p2);
        },
        onRestart: () => { renderDefisParcours(elId); }
      });
      sessionEl.scrollIntoView && sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  });
}

// ---------- Modes d'entraînement : accès direct par thème/niveau/format,
// même esprit que l'ancien renderQuizSetup mais alimente startMixedSession
// (plusieurs formats possibles, pas seulement QCM). ----------
function renderModesEntrainement(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const pool = defisFullPool();
  const categories = [...new Set(pool.map(i => i.categorie))].sort();
  el.innerHTML = `
    <div class="field"><label for="${elId}-cat">Thème</label>
      <select id="${elId}-cat">
        <option value="tous">Mélange de thèmes</option>
        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label for="${elId}-level">Niveau</label>
      <select id="${elId}-level">
        <option value="tous">Tous niveaux</option>
        <option value="debutant">🟢 Fondamentaux</option>
        <option value="intermediaire">🟡 Intermédiaire</option>
        <option value="avance">🔴 Avancé</option>
      </select>
    </div>
    <div class="field"><label for="${elId}-len">Nombre de questions</label>
      <select id="${elId}-len">
        <option value="5">5 questions</option>
        <option value="10">10 questions</option>
        <option value="15">15 questions</option>
      </select>
    </div>
    <button class="btn btn-gold btn-sm" id="${elId}-start">Commencer le défi</button>
    <div id="${elId}-session" style="margin-top:18px;"></div>`;
  document.getElementById(`${elId}-start`).addEventListener('click', () => {
    const cat = document.getElementById(`${elId}-cat`).value;
    const level = document.getElementById(`${elId}-level`).value;
    const length = +document.getElementById(`${elId}-len`).value;
    let candidates = pool.filter(i => (cat === 'tous' || i.categorie === cat) && (level === 'tous' || i.niveau === level));
    // Niveau explicitement choisi par l'utilisateur -> toujours prioritaire,
    // jamais réécrit automatiquement. Adaptation (section 27) uniquement
    // quand "Tous niveaux" ET un thème précis sont sélectionnés : un mélange
    // de thèmes n'a pas de maîtrise unique à cibler.
    let items;
    if(level === 'tous' && cat !== 'tous'){
      items = pickAdaptivePool(candidates, cat, length);
    } else {
      for(let i = candidates.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      items = candidates.slice(0, length);
    }
    startMixedSession(`${elId}-session`, items, {onRestart: () => document.getElementById(`${elId}-start`).click()});
  });
}

// ---------- Tes performances : maîtrise réelle par thème (renderMasteryList,
// déjà utilisé sur revisions.html) + un bloc "Cette semaine" calculé à partir
// de vraies données (jamais un pourcentage inventé, pas de classement/
// percentile — nécessiterait de vrais autres utilisateurs, hors P0). ----------
function renderDefisSemaine(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const stats = getQuizStats();
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const parseHistDate = d => { const [j,m,a] = d.split('/').map(Number); return new Date(a, m-1, j).getTime(); };
  const recent = (stats.history || []).filter(h => { try { return parseHistDate(h.date) >= weekAgo; } catch(e){ return false; } });
  const exercisesCount = recent.reduce((s, h) => s + (h.length || 0), 0);
  const avgPct = recent.length ? Math.round(recent.reduce((s, h) => s + h.score, 0) / recent.length) : null;
  const mastery = getSkillMastery();
  const reinforced = mastery.filter(m => m.niveau === 'maîtrisé').length;
  const toReview = getMistakes().filter(m => !m.resolved).length;
  const best = mastery.length ? mastery.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const worst = mastery.length ? mastery.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
  el.innerHTML = `
    <span class="smallcaps">Cette semaine</span>
    <div class="defi-stat-row" style="margin-top:12px;">
      <div class="defi-stat"><div class="defi-stat-value">${exercisesCount}</div><div class="defi-stat-label">Exercices</div></div>
      <div class="defi-stat"><div class="defi-stat-value">${avgPct !== null ? avgPct + '%' : '—'}</div><div class="defi-stat-label">Réussite moyenne</div></div>
      <div class="defi-stat"><div class="defi-stat-value">${reinforced}</div><div class="defi-stat-label">Notions maîtrisées</div></div>
      <div class="defi-stat"><div class="defi-stat-value">${toReview}</div><div class="defi-stat-label">Notions à revoir</div></div>
    </div>
    <p style="font-size:12.5px;color:var(--text-dim);margin-top:14px;">
      ${best ? `Meilleur domaine : <strong style="color:var(--text);">${best.categorie}</strong> (${best.pct}%)` : "Réponds à quelques exercices pour voir apparaître tes points forts."}
      ${worst && worst !== best ? ` · À renforcer : <strong style="color:var(--text);">${worst.categorie}</strong> (${worst.pct}%)` : ''}
    </p>`;
}
function renderDefisPerformances(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `<div class="card" id="${elId}-iq" style="margin-bottom:20px;"></div><div id="${elId}-semaine" style="margin-bottom:20px;"></div><div id="${elId}-mastery"></div>`;
  renderFinancialIQDetail(`${elId}-iq`);
  renderDefisSemaine(`${elId}-semaine`);
  renderMasteryList(`${elId}-mastery`);
}

// ---------- Memory Finance : jeu de paires d'images, thème bourse ----------
// Cartes 100% visuelles (aucun texte) : on retrouve deux cartes portant la
// même icône. Le jeu de symboles est un sous-ensemble d'ICONS (scripts/icons.js)
// choisi pour son lien avec la bourse/la finance — pas de logo ou visuel externe.
const MEMORY_ICON_POOL = ['trending-up','trending-down','landmark','coins','banknote','scale','briefcase','building-2','wallet','calculator','shield','telescope'];
const MEMORY_BACK_ICON = 'circle';
// Difficulté = plus de paires à garder en tête simultanément (plus de
// variables), jamais un chronomètre. movesBudget est un seuil de réussite
// indicatif (~2,2 coups par paire, un jeu de mémoire quasi parfait tourne
// autour de pairCount coups) — un choix de design du jeu, pas une donnée financière.
const MEMORY_DIFFICULTIES = {
  facile: {label:'Facile', pairCount:6},
  moyen: {label:'Moyen', pairCount:9},
  difficile: {label:'Difficile', pairCount:12}
};
const MEMORY_DIFFICULTY_ORDER = ['facile','moyen','difficile'];
function memoryMovesBudget(pairCount){ return Math.ceil(pairCount * 2.2); }

function buildMemoryDeck(pairCount){
  const pool = MEMORY_ICON_POOL.slice();
  for(let i=pool.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, Math.min(pairCount, pool.length));
  const cards = [];
  chosen.forEach((icon, idx)=>{
    cards.push({uid:`${idx}-a`, pairIndex:idx, icon});
    cards.push({uid:`${idx}-b`, pairIndex:idx, icon});
  });
  for(let i=cards.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return {cards, icons: chosen};
}

function renderMemoryFinance(elId, difficultyId){
  const el = document.getElementById(elId);
  if(!el) return;

  if(!difficultyId){
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;margin-bottom:14px;">Retrouve les paires identiques. Plus de paires à mémoriser en même temps = plus difficile.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${MEMORY_DIFFICULTY_ORDER.map(key => `<button type="button" class="pill mem-diff-btn" data-diff="${key}">${MEMORY_DIFFICULTIES[key].label} (${MEMORY_DIFFICULTIES[key].pairCount} paires)</button>`).join('')}
      </div>`;
    el.querySelectorAll('.mem-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => renderMemoryFinance(elId, btn.dataset.diff));
    });
    return;
  }

  const pairCount = MEMORY_DIFFICULTIES[difficultyId].pairCount;
  const movesBudget = memoryMovesBudget(pairCount);
  const {cards, icons} = buildMemoryDeck(pairCount);
  const totalPairs = icons.length;
  let flipped = [], matchedPairs = 0, moves = 0, errors = 0, locked = false;

  el.innerHTML = `
    <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:12px;">
      <span>Paires trouvées : <span id="${elId}-found">0</span> / ${totalPairs}</span><span>Coups : <span id="${elId}-moves">0</span> (objectif : ${movesBudget})</span>
    </div>
    <div class="mem-grid">${cards.map(card=>`
      <button class="mem-card" data-uid="${card.uid}" data-pair="${card.pairIndex}" type="button" aria-label="Carte retournée">
        <span class="mem-card-inner">
          <span class="mem-card-face mem-card-back"><span class="mem-card-icon">${ICONS[MEMORY_BACK_ICON]}</span></span>
          <span class="mem-card-face mem-card-front">
            <span class="mem-card-icon">${ICONS[card.icon]}</span>
          </span>
        </span>
      </button>`).join('')}</div>`;

  const foundEl = document.getElementById(`${elId}-found`);
  const movesEl = document.getElementById(`${elId}-moves`);

  function renderResults(){
    const perfect = errors === 0;
    const success = moves <= movesBudget;
    if(perfect) tryAwardQuizPoints(`memory-perfect-${new Date().toDateString()}`, 15);
    checkBadges(getGamification(), {memoryPerfect: perfect});
    el.innerHTML = `
      <span class="badge ${success ? 'status-reel' : 'status-demo'}">${success ? 'Réussi' : 'À retenter'}</span>
      <div class="result-big" style="margin-top:8px;">${moves} coup${moves>1?'s':''}</div>
      <p style="color:var(--text-dim);font-size:13px;margin:8px 0 16px;">${totalPairs} paires trouvées, ${errors} erreur${errors>1?'s':''}, objectif : ${movesBudget} coups.${perfect ? ' Sans-faute !' : ''}</p>
      <button class="btn btn-sm btn-gold" id="${elId}-restart">Nouvelle partie</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-restart`).addEventListener('click', ()=>renderMemoryFinance(elId));
    renderNextStepCard(`${elId}-nextstep`, {});
  }

  Array.from(el.querySelectorAll('.mem-card')).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(locked || btn.classList.contains('mem-flipped') || btn.classList.contains('mem-matched')) return;
      btn.classList.add('mem-flipped');
      flipped.push(btn);
      if(flipped.length < 2) return;
      moves++; movesEl.textContent = moves;
      locked = true;
      const [a, b] = flipped;
      const isMatch = a.dataset.pair === b.dataset.pair;
      if(isMatch){
        setTimeout(()=>{
          a.classList.add('mem-matched'); b.classList.add('mem-matched');
          a.classList.remove('mem-flipped'); b.classList.remove('mem-flipped');
          matchedPairs++;
          foundEl.textContent = matchedPairs;
          tryAwardQuizPoints(`memory-icon-${icons[+a.dataset.pair]}`, 8);
          flipped = []; locked = false;
          if(matchedPairs === totalPairs) renderResults();
        }, 500);
      } else {
        errors++;
        setTimeout(()=>{
          a.classList.remove('mem-flipped'); b.classList.remove('mem-flipped');
          flipped = []; locked = false;
        }, 900);
      }
    });
  });
}

// ---------- Figures chartistes : reconnaître les motifs d'analyse technique ----------
// Schémas SYNTHÉTIQUES et pédagogiques uniquement — jamais un vrai cours d'un
// instrument réel — clairement annoncé sous chaque graphique. Les définitions
// des figures elles-mêmes sont du savoir standard d'analyse technique.
const CHART_PATTERNS = [
  {id:'tete-epaules', nom:'Tête-épaules',
    explication:"Trois sommets, celui du milieu plus haut que les deux autres, reliés par une ligne de cou. Les chartistes y voient souvent un possible signal de fin de tendance haussière une fois la ligne de cou cassée à la baisse.",
    points:[[0,0.3],[0.15,0.62],[0.3,0.42],[0.5,0.9],[0.7,0.42],[0.85,0.6],[1,0.22]]},
  {id:'tete-epaules-inversee', nom:'Tête-épaules inversée',
    explication:"L'inverse de la figure tête-épaules : trois creux, celui du milieu plus bas que les deux autres. Souvent interprétée comme un possible signal de fin de tendance baissière une fois la ligne de cou cassée à la hausse.",
    points:[[0,0.7],[0.15,0.38],[0.3,0.58],[0.5,0.12],[0.7,0.58],[0.85,0.4],[1,0.78]]},
  {id:'double-sommet', nom:'Double sommet',
    explication:"Deux sommets à peu près à la même hauteur, séparés par un creux — une forme en 'M'. Souvent associée à un possible essoufflement d'une tendance haussière.",
    points:[[0,0.32],[0.25,0.85],[0.5,0.48],[0.75,0.85],[1,0.25]]},
  {id:'double-fond', nom:'Double fond',
    explication:"Deux creux à peu près à la même profondeur, séparés par un sommet — une forme en 'W'. Souvent associée à un possible essoufflement d'une tendance baissière.",
    points:[[0,0.68],[0.25,0.15],[0.5,0.52],[0.75,0.15],[1,0.75]]},
  {id:'triangle-ascendant', nom:'Triangle ascendant',
    explication:"Une résistance à peu près horizontale en haut et des creux de plus en plus hauts en bas, qui se rapprochent. Souvent vue comme une figure de continuation dans une tendance haussière.",
    points:[[0,0.3],[0.15,0.78],[0.3,0.45],[0.45,0.78],[0.6,0.55],[0.75,0.78],[0.9,0.65],[1,0.88]]},
  {id:'triangle-descendant', nom:'Triangle descendant',
    explication:"Un support à peu près horizontal en bas et des sommets de plus en plus bas en haut, qui se rapprochent. Souvent vue comme une figure de continuation dans une tendance baissière.",
    points:[[0,0.7],[0.15,0.22],[0.3,0.55],[0.45,0.22],[0.6,0.45],[0.75,0.22],[0.9,0.35],[1,0.12]]},
  {id:'canal', nom:'Canal / Rectangle',
    explication:"Le prix oscille entre deux lignes à peu près horizontales et parallèles, un support et une résistance, sans direction claire — une phase de range plutôt que de tendance.",
    points:[[0,0.5],[0.125,0.76],[0.25,0.28],[0.375,0.76],[0.5,0.28],[0.625,0.76],[0.75,0.28],[0.875,0.76],[1,0.5]]},
  {id:'cup-and-handle', nom:'Cup and handle (tasse avec anse)',
    explication:"Un creux arrondi en U (la « tasse ») suivi d'une petite consolidation qui redescend légèrement (l'« anse ») avant un possible dépassement du niveau de départ. Vue comme une figure de continuation haussière.",
    points:[[0,0.75],[0.15,0.45],[0.3,0.24],[0.4,0.2],[0.5,0.24],[0.65,0.45],[0.78,0.76],[0.85,0.64],[0.92,0.68],[1,0.95]]}
];

function generatePatternSeries(pattern, sampleCount){
  sampleCount = sampleCount || 48;
  const jittered = pattern.points.map(([x,y])=>[x, Math.min(0.96, Math.max(0.04, y + (Math.random()-0.5)*0.05))]);
  const series = [];
  for(let i=0;i<sampleCount;i++){
    const x = i/(sampleCount-1);
    let p0 = jittered[0], p1 = jittered[jittered.length-1];
    for(let k=0;k<jittered.length-1;k++){
      if(x >= jittered[k][0] && x <= jittered[k+1][0]){ p0 = jittered[k]; p1 = jittered[k+1]; break; }
    }
    const span = p1[0]-p0[0];
    const t = span > 0 ? (x-p0[0])/span : 0;
    let y = p0[1] + (p1[1]-p0[1])*t + (Math.random()-0.5)*0.02;
    series.push(Math.min(0.98, Math.max(0.02, y)));
  }
  return series;
}

function renderPatternChartSVG(series){
  const w = 560, h = 190, padX = 12, padY = 14;
  const innerW = w - padX*2, innerH = h - padY*2;
  const pts = series.map((y,i)=>{
    const x = padX + (i/(series.length-1)) * innerW;
    const yy = padY + (1-y) * innerH;
    return `${x.toFixed(1)},${yy.toFixed(1)}`;
  }).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block;" role="img" aria-label="Courbe d'évolution d'un cours boursier à identifier parmi les figures chartistes proposées ci-dessous"><polyline points="${pts}" fill="none" stroke="var(--gold-bright)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

// Figures visuellement proches, utilisées pour composer des choix plus
// difficiles à distinguer (plus de considérations, pas un chronomètre) —
// jamais tirées au hasard quand une confusion réelle et pédagogiquement
// pertinente existe (ex. tête-épaules vs sa version inversée).
const CHART_PATTERN_CONFUSABLES = {
  'tete-epaules': ['tete-epaules-inversee'],
  'tete-epaules-inversee': ['tete-epaules'],
  'double-sommet': ['double-fond'],
  'double-fond': ['double-sommet'],
  'triangle-ascendant': ['triangle-descendant'],
  'triangle-descendant': ['triangle-ascendant'],
  canal: [],
  'cup-and-handle': []
};
const CHART_GAME_MAX_ERRORS = 3;

function renderChartPatternGame(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const rounds = CHART_PATTERNS.slice();
  for(let i=rounds.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [rounds[i], rounds[j]] = [rounds[j], rounds[i]];
  }
  let qIndex = 0, score = 0, errors = 0;

  function pickChoices(correct){
    const confusableIds = CHART_PATTERN_CONFUSABLES[correct.id] || [];
    const confusables = CHART_PATTERNS.filter(p => confusableIds.includes(p.id));
    const rest = CHART_PATTERNS.filter(p => p.id !== correct.id && !confusableIds.includes(p.id));
    for(let i=rest.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    const distractorSlots = Math.min(5, CHART_PATTERNS.length - 1);
    const distractors = confusables.concat(rest).slice(0, distractorSlots);
    const choices = [correct, ...distractors];
    for(let i=choices.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  }

  function renderRound(){
    if(qIndex >= rounds.length){ renderResults(false); return; }
    const pattern = rounds[qIndex];
    const series = generatePatternSeries(pattern);
    const choices = pickChoices(pattern);
    const pct = Math.round((qIndex/rounds.length)*100);
    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Figure ${qIndex+1} / ${rounds.length}</span><span>Erreurs : ${errors} / ${CHART_GAME_MAX_ERRORS}</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:12px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <div class="pattern-chart">${renderPatternChartSVG(series)}</div>
      <p style="font-size:10.5px;color:var(--text-dim);margin:6px 0 14px;text-align:right;">Schéma pédagogique (données synthétiques) — pas un cours réel.</p>
      <div class="vf-buttons" style="grid-template-columns:1fr 1fr;">${choices.map(c=>`<button class="vf-btn" data-id="${c.id}">${c.nom}</button>`).join('')}</div>
      <div class="vf-feedback" id="${elId}-feedback"></div>`;
    Array.from(el.querySelectorAll('.vf-btn')).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        el.querySelectorAll('.vf-btn').forEach(b=>b.disabled = true);
        const correct = btn.dataset.id === pattern.id;
        if(correct){ btn.classList.add('vf-correct'); score++; tryAwardQuizPoints(`pattern-${pattern.id}`, 10); }
        else {
          btn.classList.add('vf-wrong');
          errors++;
          const rightBtn = el.querySelector(`[data-id="${pattern.id}"]`);
          if(rightBtn) rightBtn.classList.add('vf-correct');
        }
        document.getElementById(`${elId}-feedback`).textContent = pattern.explication;
        const eliminated = errors >= CHART_GAME_MAX_ERRORS;
        setTimeout(()=>{
          if(eliminated){ renderResults(true); return; }
          qIndex++; renderRound();
        }, 2400);
      }, {once:true});
    });
  }

  function renderResults(eliminated){
    const attempted = eliminated ? qIndex + 1 : rounds.length;
    const pct = attempted ? Math.round((score/attempted)*100) : 0;
    if(!eliminated && pct === 100) tryAwardQuizPoints(`chart-pattern-perfect-${new Date().toDateString()}`, 25, {quizPerfect:true});
    el.innerHTML = `
      ${eliminated ? `<span class="badge status-demo">Manche arrêtée après ${CHART_GAME_MAX_ERRORS} erreurs</span>` : ''}
      <div class="result-big" style="margin-top:${eliminated ? '8px' : '0'};">${score} / ${attempted}</div>
      <p style="color:var(--text-dim);font-size:13px;margin:8px 0 16px;">${pct}% de figures reconnues${eliminated ? `, sur ${attempted} tentées avant l'arrêt` : ''}.</p>
      <button class="btn btn-sm btn-gold" id="${elId}-restart">Recommencer</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-restart`).addEventListener('click', ()=>renderChartPatternGame(elId));
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'stockMarket'});
  }

  renderRound();
}

// ---------- Construis ton portefeuille : moteur déplacé ----------
// Le jeu à tours "Construis ton portefeuille" (config difficulté/scénario,
// boucle de tours, narration et scoring multi-dimensionnel calculés à
// partir de vrais cours historiques) vit désormais dans son propre fichier :
// scripts/games/portfolio-game.js — chargé uniquement par jeu-portefeuille.html
// (seule page à en avoir besoin). Voir ce fichier pour renderPortfolioGame et
// les fonctions associées.

// ---------- Cours : lecture puis quiz de validation ----------
// Contenu de lecture puisé dans LIBRARY, quiz puisé dans QUIZ_BANK_FULL — voir
// COURS_CATALOG (app.js). Les points ne sont accordés qu'à la réussite du quiz,
// une seule fois par cours (pas de gain répété en retentant un cours déjà validé).
const COURS_PASS_THRESHOLD = 0.6;
function getCoursProgress(){ return safeGetJSON('fzr-cours-progress', {}); }

// Suivi des chapitres réellement ouverts par cours (audit Formations du
// 27/08/2026 : le raccourci "Test" du sélecteur de format permettait de
// sauter directement au quiz sans avoir ouvert un seul chapitre). Identifié
// par le titre du chapitre plutôt que son index : l'index bouge selon le
// format actif (getFormatFilteredChapitres retire des chapitres), le titre
// reste stable quel que soit le format utilisé pour l'ouvrir.
function getVisitedChapters(coursId){
  const all = safeGetJSON('fzr-cours-visited', {});
  return all[coursId] || [];
}
function markChapterVisited(coursId, chapitreTitre){
  const all = safeGetJSON('fzr-cours-visited', {});
  const list = all[coursId] || [];
  if(!list.includes(chapitreTitre)) list.push(chapitreTitre);
  all[coursId] = list;
  safeSetJSON('fzr-cours-visited', all);
}

// Rattache chaque cours à son domaine réel (DOMAINS, app.js) en comptant le
// recouvrement entre ses quizCategories et celles de chaque domaine — jamais
// une catégorie inventée à la main : le domaine avec le plus de catégories en
// commun l'emporte, à égalité le premier domaine testé (ordre de DOMAINS).
// Reste correct même si COURS_CATALOG grandit sans mise à jour manuelle.
// ---------- Parcours guidés (objectif/métier) : voir LEARNING_PATHS (app.js).
// Progression dérivée de fzr-cours-progress, déjà la seule source de vérité
// de complétion d'un cours — jamais un second compteur qui pourrait diverger. ----------
function getLearningPathProgress(path){
  const progress = getCoursProgress();
  const done = path.coursIds.filter(id => progress[id]).length;
  const total = path.coursIds.length;
  return {done, total, pct: total ? Math.round((done / total) * 100) : 0};
}
function renderLearningPaths(elId, opts){
  const el = document.getElementById(elId);
  if(!el) return;
  opts = opts || {};
  const paths = opts.type ? LEARNING_PATHS.filter(p => p.type === opts.type) : LEARNING_PATHS;
  el.innerHTML = `<div class="card-grid">${paths.map(p => {
    const prog = getLearningPathProgress(p);
    return `<button type="button" class="card play-tile" data-parcours-id="${p.id}" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon">${p.icon}</span>
      <h3 style="margin:10px 0 6px;">${p.titre}</h3>
      <p style="font-size:12.5px;color:var(--text-dim);">${p.description}</p>
      <div class="dash-weekbar" style="width:100%;margin-top:10px;"><div class="dash-weekfill" style="width:${prog.pct}%;"></div></div>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">${prog.done} / ${prog.total} cours terminés${prog.total > 0 && prog.done === prog.total ? ' — parcours terminé' : ''}</p>
    </button>`;
  }).join('')}</div>
  <div id="${elId}-detail" style="margin-top:18px;"></div>`;
  el.querySelectorAll('[data-parcours-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      renderLearningPathDetail(`${elId}-detail`, btn.dataset.parcoursId);
      const detailEl = document.getElementById(`${elId}-detail`);
      if(detailEl.scrollIntoView) detailEl.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  });
  if(opts.openId) renderLearningPathDetail(`${elId}-detail`, opts.openId);
}
function renderLearningPathDetail(elId, pathId){
  const el = document.getElementById(elId);
  if(!el) return;
  const path = LEARNING_PATHS.find(p => p.id === pathId);
  if(!path){ el.innerHTML = ''; return; }
  const progress = getCoursProgress();
  const courses = path.coursIds.map(id => COURS_CATALOG.find(c => c.id === id)).filter(Boolean);
  el.innerHTML = `
    <div class="card" style="max-width:640px;">
      <span class="smallcaps">${path.icon} ${path.titre}</span>
      <p style="font-size:13px;color:var(--text-dim);margin:8px 0 14px;">${path.description}</p>
      <div style="display:flex;flex-direction:column;gap:2px;">
        ${courses.map((c, i) => `
          <a href="cours.html#${encodeURIComponent(c.id)}" class="defi-parcours-step ${progress[c.id] ? 'is-done' : ''}" style="text-decoration:none;display:block;">
            ${progress[c.id] ? ICONS.check + ' ' : (i + 1) + '. '}${c.titre}
          </a>`).join('')}
      </div>
    </div>`;
}

function coursDomainKey(cours){
  if(!cours || !Array.isArray(cours.quizCategories)) return null;
  let best = null, bestScore = 0;
  DOMAINS.forEach(domain => {
    const score = cours.quizCategories.filter(c => (domain.quizCategories || []).includes(c)).length;
    if(score > bestScore){ bestScore = score; best = domain.key; }
  });
  return best;
}

// Grille de tuiles cliquables (page Academy) — chaque tuile ouvre le cours
// complet sur sa propre page (cours.html#id) plutôt que de tout dérouler en
// accordéon sur la même page, pour éviter un scroll interminable. domainKey
// optionnel : ne montre que les cours réellement rattachés à ce domaine
// (voir coursDomainKey), jamais un cours mal classé pour remplir un onglet.
function renderCoursTiles(elId, domainKey){
  const el = document.getElementById(elId);
  if(!el) return;
  const progress = getCoursProgress();
  const list = domainKey ? COURS_CATALOG.filter(c => coursDomainKey(c) === domainKey) : COURS_CATALOG;
  el.innerHTML = `<div class="card-grid">${list.map(cours=>{
    const done = !!progress[cours.id];
    const isRich = Array.isArray(cours.chapitres) && cours.chapitres.length > 0;
    const meta = isRich ? `${cours.chapitres.length} chapitre${cours.chapitres.length>1?'s':''} · lecture + quiz de validation` : `${cours.libraryTermes.length} notion${cours.libraryTermes.length>1?'s':''} · lecture + quiz de validation`;
    return `
    <a href="cours.html#${encodeURIComponent(cours.id)}" class="card play-tile">
      <span class="icon" data-icon="book-open" style="color:var(--gold-bright);"></span>
      <h3 style="font-size:16px;margin-top:10px;">${done ? ICONS.check + ' ' : ''}${cours.titre}</h3>
      <p>${meta}</p>
      <div class="card-footer"><span class="badge ${done ? 'status-reel' : 'status-differe'}">${done ? 'Validé' : cours.niveau}</span><span>Ouvrir →</span></div>
    </a>`;
  }).join('')}</div>`;
}

// ---------- Cours enrichi (chapitres réels) : template universel de bloc
// pédagogique (section 5 du plan) — définition/à retenir/attention/exemple/
// calcul/visualisation/cas réel/pourquoi, plus un bloc "approfondir" replié
// par défaut (<details> natif, aucun JS de toggle) pour aller plus loin sans
// quitter le cours, et un bloc "trouve l'erreur" pour varier les exercices
// (section 15 : pas uniquement des QCM). Un bloc sans contenu réel n'est
// jamais rendu vide. ----------
const COURSE_BLOCK_META = {
  definition: {emoji: '📖', label: 'Définition'},
  retenir: {emoji: '💡', label: 'À retenir'},
  attention: {emoji: '⚠️', label: 'Attention'},
  exemple: {emoji: '🔢', label: 'Exemple'},
  calcul: {emoji: '🧮', label: 'Calcul'},
  visualisation: {emoji: '📊', label: 'Visualisation'},
  casReel: {emoji: '🏢', label: 'Cas réel'},
  pourquoi: {emoji: '🧠', label: 'Pourquoi ?'}
};

// ---------- Sélecteur de format par cours (section AMÉLIORATION/OPTIONNEL de
// l'audit de couverture pédagogique du 25/08/2026) : filtre client-side sur
// les blocs déjà écrits dans chaque cours — jamais un nouveau contenu à
// rédiger par cours. "Complet" = comportement historique inchangé (tous les
// blocs). "Test" est spécial : ignore les blocs, saute directement au quiz.
// Un chapitre qui n'a plus aucun bloc correspondant au format choisi est
// retiré de la pagination pour ce format (jamais une page vide affichée) ;
// si AUCUN chapitre du cours n'a de contenu pour un format, repli silencieux
// sur "Complet" plutôt qu'un écran cassé. ----------
const COURSE_FORMATS = [
  {key:'complet', emoji:'📖', label:'Complet'},
  {key:'rapide', emoji:'⚡', label:'Rapide'},
  {key:'pratique', emoji:'🧮', label:'Pratique'},
  {key:'avance', emoji:'🔥', label:'Avancé'},
  {key:'test', emoji:'🧠', label:'Test'}
];
const COURSE_FORMAT_BLOCK_TYPES = {
  rapide: ['definition', 'retenir'],
  pratique: ['calcul', 'exemple', 'exerciceErreur', 'casReel', 'visualisation'],
  avance: ['attention', 'pourquoi', 'approfondir']
};
function getFormatFilteredChapitres(chapitres, formatKey){
  const allowedTypes = COURSE_FORMAT_BLOCK_TYPES[formatKey];
  if(!allowedTypes) return chapitres; // 'complet' (ou format inconnu) : aucun filtre
  const filtered = chapitres
    .map(ch => ({...ch, blocs: (ch.blocs || []).filter(b => allowedTypes.includes(b.type))}))
    .filter(ch => ch.blocs.length > 0);
  return filtered.length > 0 ? filtered : chapitres; // jamais un cours vide : repli sur "Complet"
}
function renderCourseBlock(bloc){
  if(!bloc || !bloc.type) return '';
  if(bloc.type === 'texte'){
    return bloc.texte ? `<p style="margin-top:12px;line-height:1.7;">${bloc.texte}</p>` : '';
  }
  if(bloc.type === 'approfondir'){
    return bloc.texte ? `<details class="why-drawer" style="margin-top:14px;">
      <summary class="smallcaps" style="cursor:pointer;">🔬 Approfondir</summary>
      <div style="font-size:13px;color:var(--text-dim);line-height:1.7;margin-top:8px;">${bloc.texte}</div>
    </details>` : '';
  }
  if(bloc.type === 'exerciceErreur'){
    if(!bloc.affirmation || !bloc.pourquoi) return '';
    return `<div class="card" style="margin-top:14px;background:var(--bg-alt);">
      <span class="smallcaps">🕵️ Trouve l'erreur</span>
      <p style="margin-top:8px;font-style:italic;">« ${bloc.affirmation} »</p>
      <details class="why-drawer" style="margin-top:8px;"><summary class="smallcaps" style="cursor:pointer;">Voir pourquoi c'est incomplet ou faux</summary>
        <p style="font-size:13px;color:var(--text-dim);margin-top:8px;">${bloc.pourquoi}</p>
      </details>
    </div>`;
  }
  const meta = COURSE_BLOCK_META[bloc.type];
  if(!meta || (!bloc.texte && !bloc.schema)) return '';
  const textHtml = bloc.texte ? `<p style="margin-top:8px;line-height:1.7;">${bloc.texte}</p>` : '';
  const schemaHtml = bloc.schema ? `<pre style="background:var(--bg);border:1px solid var(--hairline);border-radius:var(--radius);padding:12px 16px;font-size:12px;line-height:1.5;overflow-x:auto;margin-top:8px;">${bloc.schema}</pre>` : '';
  return `<div class="card" style="margin-top:14px;">
    <span class="smallcaps">${meta.emoji} ${meta.label}</span>
    ${textHtml}${schemaHtml}
  </div>`;
}
function renderCourseChapter(chapitre){
  if(!chapitre) return '';
  const blocsHtml = (chapitre.blocs || []).map(renderCourseBlock).join('');
  return `<h4 style="margin-top:4px;">${chapitre.titre}</h4>${blocsHtml}`;
}
// Lien réel vers la Bibliothèque pour chaque notion citée (section 17 : la
// Formation et la Bibliothèque doivent être liées) — même format de hash que
// bibliotheque.js (terme avec espaces remplacés par des tirets).
function renderCourseLibraryLinks(libraryTermes){
  const termes = (libraryTermes || []).filter(t => LIBRARY.some(l => l.terme === t));
  if(termes.length === 0) return '';
  return `<p style="font-size:12px;color:var(--text-dim);margin-top:16px;">📚 Voir aussi dans la Bibliothèque : ${termes.map(t => `<a href="bibliotheque.html#${encodeURIComponent(t.replace(/\s+/g,'-'))}" style="color:var(--gold-bright);">${t}</a>`).join(' · ')}</p>`;
}
// Lien réel vers un cours (étape "Cours" de la Boucle Likanza) — cours.html
// n'a aucun moyen d'ouvrir directement un chapitre précis (navigation par
// index JS en mémoire dans renderCoursRich, jamais adressable par URL), donc
// ce lien pointe vers le cours entier et nomme le chapitre pertinent dans le
// TEXTE, pas dans l'URL. Jamais un lien mort : chaîne vide si l'id n'existe
// pas réellement dans COURS_CATALOG.
function renderRelatedCourseLink(coursId, chapitreLabel){
  const cours = COURS_CATALOG.find(c => c.id === coursId);
  if(!cours) return '';
  const chapitreText = chapitreLabel ? `, chapitre « ${chapitreLabel} »` : '';
  return `<p style="font-size:12px;color:var(--text-dim);margin-top:6px;"><a href="cours.html#${encodeURIComponent(coursId)}" style="color:var(--gold-bright);">🎓 Voir le cours « ${cours.titre} »${chapitreText} →</a></p>`;
}

// Écran affiché avant le 1er chapitre d'un cours enrichi (audit Formations du
// 27/08/2026 : les objectifs (cours.acquis) n'étaient montrés qu'à la toute
// fin, jamais avant de commencer). Les prérequis (cours.prerequis, quand ils
// existent) sont montrés avec leur statut réel de progression — jamais un
// verrou : juste une recommandation informée, l'utilisateur reste libre de
// commencer sans les avoir faits.
function renderCoursePrerequisites(prerequis){
  const items = (prerequis || []).map(id => COURS_CATALOG.find(c => c.id === id)).filter(Boolean);
  if(items.length === 0) return '';
  const progress = getCoursProgress();
  return `<div class="card" style="margin-bottom:14px;background:var(--bg-alt);">
    <span class="smallcaps">Recommandé avant de commencer</span>
    <ul style="margin:10px 0 0;padding-left:18px;font-size:13.5px;line-height:1.9;">
      ${items.map(c => `<li><a href="cours.html#${encodeURIComponent(c.id)}" style="color:var(--gold-bright);">${c.titre}</a> — ${progress[c.id] ? '<span style="color:var(--emerald);">déjà validé ✓</span>' : '<span style="color:var(--text-dim);">pas encore fait</span>'}</li>`).join('')}
    </ul>
  </div>`;
}
function renderCourseIntro(elId, cours, onStart){
  const el = document.getElementById(elId);
  if(!el) return;
  const acquis = Array.isArray(cours.acquis) ? cours.acquis : [];
  el.innerHTML = `
    <h4 style="margin-top:4px;">${cours.titre}</h4>
    ${renderCoursePrerequisites(cours.prerequis)}
    ${acquis.length ? `<div class="card" style="margin-bottom:16px;">
      <span class="smallcaps">À la fin de ce cours, tu sauras :</span>
      <ul style="margin:10px 0 0;padding-left:18px;font-size:13.5px;color:var(--text-dim);line-height:1.8;">${acquis.map(a => `<li>${a}</li>`).join('')}</ul>
    </div>` : ''}
    <button class="btn btn-sm btn-gold" id="${elId}-start-course">Commencer →</button>`;
  document.getElementById(`${elId}-start-course`).addEventListener('click', onStart);
}

// ---------- Feedback qualité pédagogique (section 26 du prompt Learning
// Engine) : simple, jamais bloquant, un avis par contenu (pas un vote répété
// à chaque relecture) — sert uniquement à repérer les cours à améliorer,
// jamais affiché comme une note publique. ----------
function getClarityFeedback(){ return safeGetJSON('fzr-clarity-feedback', {}); }
function saveClarityFeedbackEntry(contentId, rating){
  const all = getClarityFeedback();
  all[contentId] = {rating, date: new Date().toISOString()};
  safeSetJSON('fzr-clarity-feedback', all);
}
const CLARITY_OPTIONS = [
  {value:'tres-claire', label:'Très claire'},
  {value:'claire', label:'Claire'},
  {value:'moyenne', label:'Moyenne'},
  {value:'pas-claire', label:'Pas claire'}
];
function renderClarityFeedback(elId, contentId){
  const el = document.getElementById(elId);
  if(!el || !contentId) return;
  const existing = getClarityFeedback()[contentId];
  if(existing){
    const opt = CLARITY_OPTIONS.find(o => o.value === existing.rating);
    el.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">Merci pour ton retour${opt ? ` (${opt.label})` : ''}.</p>`;
    return;
  }
  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:8px;">Cette explication était-elle claire ?</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">${CLARITY_OPTIONS.map(o => `<button class="pill" data-value="${o.value}" type="button">${o.label}</button>`).join('')}</div>`;
  el.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      saveClarityFeedbackEntry(contentId, btn.dataset.value);
      renderClarityFeedback(elId, contentId);
    });
  });
}

// Navigation chapitre par chapitre (même forme que la pagination existante
// de renderCoursDetail — barre de progression, bouton Suivant/Précédent),
// puis bascule sur le quiz de validation déjà existant (renderCoursQuiz,
// inchangé). Utilisé uniquement pour les cours qui déclarent cours.chapitres
// — les cours sans chapitres réels gardent l'ancien rendu (bundle de
// notions), jamais une régression sur ce qui existe déjà.
function renderCoursRich(elId, cours, onComplete){
  const el = document.getElementById(elId);
  if(!el) return;
  let activeFormat = 'complet';
  let chapitres = cours.chapitres;
  let chapIndex = 0;

  function formatSelectorHtml(){
    return `<div class="mode-toggle" id="${elId}-format" style="margin-bottom:14px;">
      ${COURSE_FORMATS.map(f => `<button class="pill${f.key === activeFormat ? ' active' : ''}" data-format="${f.key}" type="button" title="${f.label}">${f.emoji} ${f.label}</button>`).join('')}
    </div>`;
  }
  function wireFormatSelector(){
    const wrap = document.getElementById(`${elId}-format`);
    if(!wrap) return;
    wrap.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.format;
        if(key === activeFormat) return;
        if(key === 'test'){
          const visited = getVisitedChapters(cours.id);
          const unread = cours.chapitres.filter(ch => !visited.includes(ch.titre));
          if(unread.length > 0){ renderReadingRequired(unread); return; }
          activeFormat = key;
          renderQuizStep();
          return;
        }
        activeFormat = key;
        chapitres = getFormatFilteredChapitres(cours.chapitres, key);
        chapIndex = 0;
        renderChapterStep();
      });
    });
  }

  // Bloque le raccourci "Test" tant que tous les chapitres n'ont pas été
  // ouverts au moins une fois — jamais un blocage silencieux : le message
  // liste ce qui reste et propose un bouton direct vers le premier chapitre
  // non lu, plutôt qu'un simple refus.
  function renderReadingRequired(unread){
    el.innerHTML = `
      ${formatSelectorHtml()}
      <div class="card" style="margin-top:8px;">
        <span class="smallcaps">Termine la lecture d'abord</span>
        <p style="font-size:13.5px;color:var(--text-dim);margin-top:8px;">Il te reste ${unread.length} chapitre${unread.length > 1 ? 's' : ''} non ouvert${unread.length > 1 ? 's' : ''} avant de passer directement au quiz : ${unread.map(c => c.titre).join(', ')}.</p>
        <button class="btn btn-sm btn-gold" id="${elId}-goto-unread" style="margin-top:10px;">Reprendre la lecture →</button>
      </div>`;
    wireFormatSelector();
    document.getElementById(`${elId}-goto-unread`).addEventListener('click', () => {
      activeFormat = 'complet';
      chapitres = cours.chapitres;
      const target = cours.chapitres.findIndex(ch => ch.titre === unread[0].titre);
      chapIndex = target >= 0 ? target : 0;
      renderChapterStep();
    });
  }

  function renderChapterStep(){
    markChapterVisited(cours.id, chapitres[chapIndex].titre);
    const isLast = chapIndex === chapitres.length - 1;
    const pct = Math.round(((chapIndex + 1) / chapitres.length) * 100);
    el.innerHTML = `
      ${formatSelectorHtml()}
      <div class="mono" style="font-size:11px;color:var(--text-dim);margin-bottom:6px;">Chapitre ${chapIndex+1} / ${chapitres.length}</div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:16px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      ${renderCourseChapter(chapitres[chapIndex])}
      ${isLast ? renderCourseLibraryLinks(cours.libraryTermes) : ''}
      ${isLast ? `<div id="${elId}-clarity" style="margin-top:16px;"></div>` : ''}
      <div style="display:flex;gap:8px;margin-top:18px;">
        ${chapIndex > 0 ? `<button class="btn btn-sm" id="${elId}-prev">← Précédent</button>` : ''}
        <button class="btn btn-sm btn-gold" id="${elId}-next">${isLast ? 'Passer au quiz →' : 'Chapitre suivant →'}</button>
      </div>`;
    wireFormatSelector();
    document.getElementById(`${elId}-next`).addEventListener('click', () => {
      if(isLast){ renderQuizStep(); }
      else { chapIndex++; renderChapterStep(); }
    });
    const prevBtn = document.getElementById(`${elId}-prev`);
    if(prevBtn) prevBtn.addEventListener('click', () => { chapIndex--; renderChapterStep(); });
    if(isLast) renderClarityFeedback(`${elId}-clarity`, cours.id);
  }

  function renderQuizStep(){
    const progress = getCoursProgress();
    const done = !!progress[cours.id];
    el.innerHTML = `
      ${formatSelectorHtml()}
      <div class="mission-question">
        <p class="mission-q-prompt">${done ? "Cours validé — retente le quiz quand tu veux, en révision." : "Lecture terminée : valide le quiz pour gagner des points."}</p>
        <div id="${elId}-quiz"></div>
        <button class="btn btn-sm btn-gold" id="${elId}-start">${done ? 'Revoir le quiz' : 'Commencer le quiz'}</button>
      </div>
      <button class="btn btn-sm" id="${elId}-back" style="margin-top:12px;">← Revoir les chapitres</button>`;
    wireFormatSelector();
    document.getElementById(`${elId}-start`).addEventListener('click', function(){
      this.style.display = 'none';
      renderCoursQuiz(`${elId}-quiz`, cours, onComplete);
    });
    document.getElementById(`${elId}-back`).addEventListener('click', () => {
      activeFormat = 'complet';
      chapitres = cours.chapitres;
      chapIndex = 0;
      renderChapterStep();
    });
  }

  renderCourseIntro(elId, cours, renderChapterStep);
}

// Écran de fin d'un cours enrichi : jamais un simple "Bravo", toujours les
// vraies acquisitions (section 16) et les 4 suites possibles réelles —
// "Approfondir" pointe vers le prochain cours réel du même domaine s'il
// existe, "Appliquer" vers un vrai outil Likanza fourni par le cours lui-même
// (jamais un lien générique), "Expérimenter"/"Te tester" vers le Laboratoire
// et les Défis, toujours disponibles.
function renderCourseCompletionMenu(elId, cours){
  const el = document.getElementById(elId);
  if(!el) return;
  const domain = coursDomainKey(cours);
  const next = COURS_CATALOG.find(c => c.id !== cours.id && coursDomainKey(c) === domain) || null;
  const acquis = Array.isArray(cours.acquis) ? cours.acquis : [];
  // "Ce qui reste fragile" (audit Formations Phase 6 du 27/08/2026) : le
  // reste de cet écran dit déjà quoi faire ensuite, mais jamais ce qui,
  // PARMI les thèmes de ce cours précis, est encore faible d'après la vraie
  // maîtrise mesurée (getSkillMastery) — jamais un jugement générique,
  // seulement les catégories réellement rattachées à ce cours.
  const weakCategories = (cours.quizCategories || [])
    .map(cat => getSkillMastery().find(m => m.categorie === cat))
    .filter(m => m && m.niveau === 'faible');
  el.innerHTML = `
    ${acquis.length ? `<div class="card" style="margin-top:18px;">
      <span class="smallcaps">Tu sais maintenant :</span>
      <ul style="margin:10px 0 0;padding-left:18px;font-size:13.5px;color:var(--text-dim);line-height:1.8;">${acquis.map(a => `<li>${a}</li>`).join('')}</ul>
    </div>` : ''}
    ${weakCategories.length ? `<p class="disclaimer-box" style="margin-top:14px;">⚠ Encore fragile : ${weakCategories.map(m => `${m.categorie} (${m.pct}%)`).join(', ')} — un point à retravailler avant de considérer ce cours vraiment acquis.</p>` : ''}
    <div class="card-grid" style="margin-top:14px;">
      ${next ? `<a href="cours.html#${encodeURIComponent(next.id)}" class="card play-tile"><span class="icon">📚</span><h4 style="margin:8px 0 4px;">Approfondir</h4><p style="font-size:12.5px;color:var(--text-dim);">${next.titre}</p></a>` : ''}
      ${cours.applyUrl ? `<a href="${cours.applyUrl}" class="card play-tile"><span class="icon">📈</span><h4 style="margin:8px 0 4px;">Appliquer</h4><p style="font-size:12.5px;color:var(--text-dim);">${cours.applyLabel || 'Voir dans Likanza'}</p></a>` : ''}
      <a href="laboratoire.html" class="card play-tile"><span class="icon">🧪</span><h4 style="margin:8px 0 4px;">Expérimenter</h4><p style="font-size:12.5px;color:var(--text-dim);">Tester dans le Laboratoire</p></a>
      <a href="${Array.isArray(cours.quizCategories) && cours.quizCategories[0] ? `defis.html?cat=${encodeURIComponent(cours.quizCategories[0])}` : 'defis.html'}" class="card play-tile"><span class="icon">🧠</span><h4 style="margin:8px 0 4px;">Te tester</h4><p style="font-size:12.5px;color:var(--text-dim);">${Array.isArray(cours.quizCategories) && cours.quizCategories[0] ? `Défi sur « ${cours.quizCategories[0]} »` : 'Faire un défi'}</p></a>
    </div>`;
}

// Rendu complet d'un seul cours (lecture + quiz) — utilisé par cours.html.
// onComplete (optionnel) est appelé une fois, la première fois que le quiz
// est réussi, pour laisser la page appelante mettre à jour son propre titre.
// Répartit une liste de notions en au plus maxPages pages à peu près égales
// (une notion isolée reste seule sur sa page, jamais étirée artificiellement).
function paginateCoursTerms(items, maxPages){
  maxPages = maxPages || 3;
  const pageCount = Math.max(1, Math.min(maxPages, items.length || 1));
  if(pageCount <= 1) return [items];
  const base = Math.floor(items.length / pageCount);
  const remainder = items.length - base*pageCount;
  const pages = [];
  let idx = 0;
  for(let p=0; p<pageCount; p++){
    const size = base + (p < remainder ? 1 : 0);
    pages.push(items.slice(idx, idx+size));
    idx += size;
  }
  return pages;
}

// Lecture découpée en 2-3 écrans courts (bouton "Suivant") avant le quiz de
// validation, plutôt qu'un seul bloc de texte — plus digeste, surtout pour
// les cours qui regroupent plusieurs notions.
function renderCoursDetail(elId, coursId, onComplete){
  const el = document.getElementById(elId);
  if(!el) return;
  const cours = COURS_CATALOG.find(c=>c.id===coursId);
  if(!cours){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Cours introuvable. <a href="formations.html" style="color:var(--gold-bright);">Retour à l'Academy</a>.</p>`;
    return;
  }
  if(Array.isArray(cours.chapitres) && cours.chapitres.length > 0){
    renderCoursRich(elId, cours, onComplete);
    return;
  }
  const termItems = cours.libraryTermes.map(t=>LIBRARY.find(l=>l.terme===t)).filter(Boolean);
  const pages = paginateCoursTerms(termItems, 3);
  let pageIndex = 0;

  function renderReadingPage(){
    const items = pages[pageIndex] || [];
    const isLast = pageIndex === pages.length - 1;
    const pct = pages.length ? Math.round(((pageIndex+1)/pages.length)*100) : 100;
    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);margin-bottom:6px;">Lecture ${pageIndex+1} / ${pages.length}</div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:16px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      ${items.map(item=>`<div class="mission-chapter"><h5>${item.terme}</h5><p>${item.simple}</p><p>${item.detail}</p></div>`).join('')}
      <button class="btn btn-sm btn-gold" id="${elId}-next">${isLast ? 'Passer au quiz →' : 'Suivant →'}</button>`;
    document.getElementById(`${elId}-next`).addEventListener('click', ()=>{
      if(isLast){ renderQuizStep(); }
      else { pageIndex++; renderReadingPage(); }
    });
  }

  function renderQuizStep(){
    const progress = getCoursProgress();
    const done = !!progress[cours.id];
    el.innerHTML = `
      <div class="mission-question">
        <p class="mission-q-prompt">${done ? "Cours validé — retente le quiz quand tu veux, en révision." : "Lecture terminée : valide le quiz pour gagner des points."}</p>
        <div id="${elId}-quiz"></div>
        <button class="btn btn-sm btn-gold" id="${elId}-start">${done ? 'Revoir le quiz' : 'Commencer le quiz'}</button>
      </div>
      <button class="btn btn-sm" id="${elId}-back" style="margin-top:12px;">← Revoir la lecture</button>`;
    document.getElementById(`${elId}-start`).addEventListener('click', function(){
      this.style.display = 'none';
      renderCoursQuiz(`${elId}-quiz`, cours, onComplete);
    });
    document.getElementById(`${elId}-back`).addEventListener('click', ()=>{ pageIndex = 0; renderReadingPage(); });
  }

  renderReadingPage();
}

function renderCoursQuiz(elId, cours, onComplete){
  const el = document.getElementById(elId);
  if(!el) return;
  const simplePool = QUIZ_BANK_FULL.filter(q=>cours.quizCategories.includes(q.categorie));
  // Mélange des formats "raisonnement" du moteur Défis (classement, mise en
  // catégories) au pool classique du quiz de cours (audit Formations Phase 2
  // du 27/08/2026 : ces formats existaient déjà pour les Défis mais
  // n'étaient jamais proposés dans la validation d'un cours). Seuls
  // "sequence" et "classe" sont inclus ici : leur correction est binaire
  // (bon ordre / bon classement ou non), contrairement à "dilemme" (réponses
  // "défendables", pas de vrai/faux), "infomanquante" (aucune mauvaise
  // réponse par construction) ou "cas"/"enquête" (narratifs, à choix unique
  // déjà couverts par le pool classique) — les mélanger fausserait le seuil
  // de réussite du cours.
  const richPool = MENTAL_CHALLENGES.filter(m => cours.quizCategories.includes(m.categorie) && (m.format === 'classe' || m.format === 'sequence'));
  let pool = simplePool.concat(richPool);
  for(let i=pool.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const questions = pool.slice(0, Math.min(5, pool.length));
  let qIndex = 0, score = 0;

  function renderQuestion(){
    if(qIndex >= questions.length){ renderResults(); return; }
    const item = questions[qIndex];
    const pct = Math.round((qIndex/questions.length)*100);
    if(item.format){
      // Item enrichi (MENTAL_CHALLENGES) : délègue au moteur de rendu des
      // Défis, qui gère lui-même son scoring/XP/feedback. Comme dans
      // startMixedSession, l'avancée se fait sur un clic explicite (jamais
      // un setTimeout) — ces formats ont plusieurs lignes à relire après
      // correction, une avancée chronométrée couperait cette relecture.
      el.innerHTML = `
        <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>Question ${qIndex+1} / ${questions.length}</span><span>${item.categorie}</span>
        </div>
        <div class="dash-weekbar" style="width:100%;margin-bottom:14px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
        <div id="${elId}-item"></div>
        <div id="${elId}-next" style="margin-top:14px;"></div>`;
      DEFI_FORMAT_RENDERERS[item.format](`${elId}-item`, item, (correct) => {
        if(correct) score++;
        const isLast = qIndex === questions.length - 1;
        document.getElementById(`${elId}-next`).innerHTML = `<button class="btn btn-sm btn-gold" id="${elId}-advance">${isLast ? 'Voir le résultat' : 'Question suivante →'}</button>`;
        document.getElementById(`${elId}-advance`).addEventListener('click', () => { qIndex++; renderQuestion(); });
      });
      return;
    }
    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Question ${qIndex+1} / ${questions.length}</span><span>${item.categorie}</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:14px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <div style="font-size:15px;margin-bottom:12px;font-weight:500;">${item.question}</div>
      <div id="${elId}-opts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;"></div>
      <div id="${elId}-feedback" style="font-size:13.5px;color:var(--text-dim);min-height:20px;"></div>`;
    const opts = document.getElementById(`${elId}-opts`);
    item.choix.forEach((opt,i)=>{
      const optBtn = document.createElement('button');
      optBtn.className = 'pill';
      optBtn.style.textAlign = 'left';
      optBtn.textContent = opt;
      optBtn.addEventListener('click', ()=>{
        Array.from(opts.children).forEach((c,ci)=>{
          c.disabled = true;
          if(ci===item.bonneReponse) c.style.borderColor = 'var(--emerald)';
          else if(ci===i) c.style.borderColor = 'var(--bordeaux)';
        });
        const correct = i===item.bonneReponse;
        recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
        if(correct){ score++; resolveMistake(item.id); }
        else recordMistake(item);
        document.getElementById(`${elId}-feedback`).textContent = item.explication;
        setTimeout(()=>{ qIndex++; renderQuestion(); }, 1400);
      }, {once:true});
      opts.appendChild(optBtn);
    });
  }

  function renderResults(){
    const pct = questions.length ? score/questions.length : 0;
    const passed = pct >= COURS_PASS_THRESHOLD;
    const progress = getCoursProgress();
    const alreadyDone = !!progress[cours.id];
    let rewardMsg = '';
    if(passed && !alreadyDone){
      progress[cours.id] = true;
      safeSetJSON('fzr-cours-progress', progress);
      awardXP(50, {coursCompleted:true});
      rewardMsg = ' · +50 XP · +50 Finance Points';
      if(typeof onComplete === 'function') onComplete();
    } else if(passed && alreadyDone){
      rewardMsg = ' · déjà validé, pas de nouveaux points';
    }
    el.innerHTML = `
      <div class="result-big">${score} / ${questions.length}</div>
      <p style="color:${passed?'var(--emerald)':'var(--bordeaux)'};font-size:13.5px;margin:8px 0 16px;">
        ${passed ? `Cours validé (${Math.round(pct*100)}%)${rewardMsg}` : `Pas encore validé (${Math.round(pct*100)}%, ${Math.round(COURS_PASS_THRESHOLD*100)}% requis) — relis le cours et réessaie.`}
      </p>
      <button class="btn btn-sm btn-gold" id="${elId}-retry">${passed ? 'Repasser le quiz' : 'Réessayer'}</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-retry`).addEventListener('click', ()=>renderCoursQuiz(elId, cours, onComplete));
    if(Array.isArray(cours.chapitres) && cours.chapitres.length > 0) renderCourseCompletionMenu(`${elId}-nextstep`, cours);
    else renderNextStepCard(`${elId}-nextstep`, {categories: cours.quizCategories});
  }

  renderQuestion();
}

// ---------- Missions (formations.html) : story + question, par niveau ----------
// Contenu dans COURSES (app.js). Comme pour les cours, les missions sont
// présentées en tuiles cliquables sur formations.html plutôt qu'en accordéon
// — chaque tuile ouvre sa mission complète sur mission.html#niveau-index.
function getMissionProgress(){ return safeGetJSON('fzr-progress', {}); }

function renderMissionTiles(elId, level){
  const el = document.getElementById(elId);
  if(!el) return;
  const progress = getMissionProgress();
  const mods = COURSES[level] || [];
  el.innerHTML = `<div class="card-grid">${mods.map((c,i)=>{
    const done = !!progress[level+'-'+i];
    return `
    <a href="mission.html#${level}-${i}" class="card play-tile">
      <span class="icon" data-icon="target" style="color:var(--gold-bright);"></span>
      <h3 style="font-size:16px;margin-top:10px;">${done ? ICONS.check + ' ' : ''}${c.title}</h3>
      <p>Mission ${String(i+1).padStart(2,'0')} · ${c.story.length} étape${c.story.length>1?'s':''} de lecture</p>
      <div class="card-footer"><span class="badge ${done ? 'status-reel' : 'status-differe'}">${done ? 'Terminée' : 'À faire'}</span><span>Ouvrir →</span></div>
    </a>`;
  }).join('')}</div>`;
}

// onLevelComplete (optionnel) n'est appelé qu'une fois, la première fois que
// la dernière mission d'un niveau vient d'être validée.
function completeMission(level, index, onLevelComplete){
  const progress = getMissionProgress();
  const key = level+'-'+index;
  if(progress[key]) return;
  progress[key] = true;
  safeSetJSON('fzr-progress', progress);
  const mods = COURSES[level] || [];
  const doneCount = mods.filter((c,i)=>progress[level+'-'+i]).length;
  const levelJustCompleted = doneCount === mods.length;
  awardXP(30, {moduleCompleted:true, levelJustCompleted});
  if(levelJustCompleted && typeof onLevelComplete === 'function') onLevelComplete();
}

// Rendu complet d'une seule mission (lecture + question) — utilisé par mission.html.
function renderMissionDetail(elId, level, index, onComplete){
  const el = document.getElementById(elId);
  if(!el) return;
  const mods = COURSES[level] || [];
  const c = mods[index];
  if(!c){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Mission introuvable. <a href="formations.html" style="color:var(--gold-bright);">Retour à l'Academy</a>.</p>`;
    return;
  }
  const key = level+'-'+index;
  const progress = getMissionProgress();
  const done = !!progress[key];
  const q = c.question;
  const storyHtml = c.story.map(ch=>`<div class="mission-chapter"><h5>${ch.heading}</h5><p>${ch.text}</p></div>`).join('');

  let questionHtml;
  if(done){
    questionHtml = `
      <div class="mission-question">
        <p class="mission-q-prompt">${q.prompt}</p>
        <p class="mission-solved">${ICONS.check} Mission validée : ${q.explication}</p>
      </div>
      <div id="${elId}-nextstep"></div>`;
  } else if(q.type === 'calcul'){
    questionHtml = `
      <div class="mission-question">
        <p class="mission-q-prompt">${q.prompt}</p>
        <div class="field" style="max-width:260px;">
          <input type="number" step="any" id="${elId}-input" placeholder="Ta réponse${q.unit ? ' ('+q.unit+')' : ''}">
        </div>
        <button class="btn btn-sm btn-gold" id="${elId}-check">Vérifier</button>
        <p class="mission-feedback" id="${elId}-feedback"></p>
      </div>`;
  } else {
    questionHtml = `
      <div class="mission-question">
        <p class="mission-q-prompt">${q.prompt}</p>
        <div class="mission-choices" id="${elId}-choices">
          ${q.choix.map((opt,oi)=>`<button class="pill" style="text-align:left;display:block;width:100%;margin-bottom:6px;" data-choice="${oi}">${opt}</button>`).join('')}
        </div>
        <p class="mission-feedback" id="${elId}-feedback"></p>
      </div>`;
  }

  el.innerHTML = storyHtml + questionHtml;
  if(done){
    renderNextStepCard(`${elId}-nextstep`, {});
    return;
  }

  const feedback = document.getElementById(`${elId}-feedback`);
  if(q.type === 'calcul'){
    const btn = document.getElementById(`${elId}-check`);
    const input = document.getElementById(`${elId}-input`);
    const check = ()=>{
      const val = parseFloat(input.value);
      if(isNaN(val)){ feedback.textContent = "Entre un nombre avant de vérifier."; feedback.style.color = 'var(--text-dim)'; return; }
      const correct = Math.abs(val - q.reponse) <= q.tolerance;
      recordAnswer(q.categorie, correct, isAppliedItem(q), q.niveau);
      if(correct){
        completeMission(level, index, onComplete);
        renderMissionDetail(elId, level, index, onComplete);
      } else {
        feedback.textContent = `Pas tout à fait : ${q.explication}`;
        feedback.style.color = 'var(--bordeaux)';
      }
    };
    btn.addEventListener('click', check);
    input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') check(); });
  } else {
    const choicesEl = document.getElementById(`${elId}-choices`);
    Array.from(choicesEl.children).forEach((btn, oi)=>{
      btn.addEventListener('click', ()=>{
        const correct = oi === q.bonneReponse;
        recordAnswer(q.categorie, correct, isAppliedItem(q), q.niveau);
        if(correct){
          completeMission(level, index, onComplete);
          renderMissionDetail(elId, level, index, onComplete);
        } else {
          btn.style.borderColor = 'var(--bordeaux)';
          feedback.textContent = q.explication;
          feedback.style.color = 'var(--bordeaux)';
        }
      });
    });
  }
}

// ---------- Business (business.html) : widgets réutilisant des données déjà réelles ----------
// Aucun de ces widgets ne crée de nouveau système de points ou de progression :
// tout vient de getGamification/getSkillMastery/getCoursProgress/QUIZ_BANK_FULL,
// déjà utilisés ailleurs sur le site.
const BUSINESS_COURS_IDS = ['economie-generale', 'entreprise-essentiels', 'immobilier-locatif'];
const BUSINESS_QUESTION_CATEGORIES = ['PIB', 'Taux directeur', 'Banque centrale', 'Récession', 'Offre et demande', 'Inflation'];
const BUSINESS_SKILL_CATEGORIES = ['PIB', 'Taux directeur', 'Banque centrale', 'Récession', 'Offre et demande', 'Inflation', "Chiffre d'affaires", 'Marge nette', 'Bilan comptable', 'Amortissement', 'Startup', 'Levée de fonds', 'Immobilier', 'Crédit'];

// Bandeau "Reprends où tu t'es arrêté" — masqué si aucun cours Business n'a
// encore été commencé (pas de fausse reprise pour un premier visiteur).
function renderBusinessResume(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const progress = getCoursProgress();
  const doneCount = BUSINESS_COURS_IDS.filter(id => progress[id]).length;

  if(doneCount === 0){
    el.style.display = 'none';
    return;
  }
  el.style.display = '';
  if(doneCount === BUSINESS_COURS_IDS.length){
    el.innerHTML = `
      <span class="smallcaps">Reprends où tu t'es arrêté</span>
      <p class="business-resume-text">${ICONS.check} Tu as terminé les 3 cours Business. Direction les <a href="defis.html" style="color:var(--gold-bright);">Défis</a> ou <a href="revisions.html" style="color:var(--gold-bright);">tes révisions</a> pour aller plus loin.</p>`;
    return;
  }
  const nextId = BUSINESS_COURS_IDS.find(id => !progress[id]);
  const nextCours = COURS_CATALOG.find(c => c.id === nextId);
  el.innerHTML = `
    <span class="smallcaps">Reprends où tu t'es arrêté</span>
    <p class="business-resume-text">${nextCours.titre}</p>
    <a href="cours.html#${encodeURIComponent(nextId)}" class="btn btn-sm btn-gold">Continuer →</a>`;
}

// Question du jour — sélection déterministe par jour (même principe que le
// "terme du jour" de la Bibliothèque), pool = vraies questions déjà écrites
// dans QUIZ_BANK_FULL. Réutilise le même mécanisme anti-farming quotidien que
// Vrai ou faux et les Cours (tryAwardQuizPoints).
function businessQuestionPool(){
  return QUIZ_BANK_FULL.filter(q => BUSINESS_QUESTION_CATEGORIES.includes(q.categorie));
}

function renderBusinessQuestionDuJour(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const pool = businessQuestionPool();
  if(pool.length === 0){ el.style.display = 'none'; return; }
  const item = pool[dayOfYear() % pool.length];

  el.innerHTML = `
    <span class="smallcaps">Question du jour</span>
    <p class="business-question-text">${item.question}</p>
    <div class="vf-buttons" style="grid-template-columns:1fr 1fr;margin-top:12px;">
      ${item.choix.map((opt,oi)=>`<button class="vf-btn" data-choice="${oi}">${opt}</button>`).join('')}
    </div>
    <div class="vf-feedback" id="${elId}-feedback"></div>`;

  Array.from(el.querySelectorAll('.vf-btn')).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const choice = +btn.dataset.choice;
      el.querySelectorAll('.vf-btn').forEach(b=>b.disabled = true);
      const correct = choice === item.bonneReponse;
      recordAnswer(item.categorie, correct, isAppliedItem(item), item.niveau);
      if(correct){ btn.classList.add('vf-correct'); tryAwardQuizPoints(item.id, 10); resolveMistake(item.id); }
      else {
        btn.classList.add('vf-wrong');
        const rightBtn = el.querySelector(`[data-choice="${item.bonneReponse}"]`);
        if(rightBtn) rightBtn.classList.add('vf-correct');
        recordMistake(item);
      }
      document.getElementById(`${elId}-feedback`).textContent = item.explication;
    }, {once:true});
  });
}

// Niveau Business — regroupe le niveau/titre global déjà existant (pas
// dupliqué, juste affiché ici), la maîtrise par thème déjà calculée par
// getSkillMastery(), et la progression réelle des 3 cours Business.
function renderBusinessNiveau(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const g = getGamification();
  const lvl = levelFromXP(g.xp);
  const mastery = getSkillMastery();
  const progress = getCoursProgress();
  const coursDone = BUSINESS_COURS_IDS.filter(id => progress[id]).length;

  const conceptsHtml = BUSINESS_SKILL_CATEGORIES.map(cat => {
    const found = mastery.find(m => m.categorie === cat);
    let icon, label, color;
    if(found && found.niveau === 'maîtrisé'){ icon = ICONS.check; label = 'maîtrisé'; color = 'var(--emerald)'; }
    else if(found){ icon = '○'; label = 'à consolider'; color = 'var(--gold-bright)'; }
    else { icon = '·'; label = 'pas encore commencé'; color = 'var(--text-dim)'; }
    return `<div class="business-concept-row" style="color:${color};"><span class="business-concept-icon">${icon}</span><span class="business-concept-name">${cat}</span><span class="business-concept-label">${label}</span></div>`;
  }).join('');

  const nextCoursId = BUSINESS_COURS_IDS.find(id => !progress[id]);
  const ctaHtml = nextCoursId
    ? `<a href="cours.html#${encodeURIComponent(nextCoursId)}" class="btn btn-sm btn-gold">Continuer mon parcours →</a>`
    : `<a href="formations.html" class="btn btn-sm btn-gold">Explorer d'autres cours →</a>`;

  el.innerHTML = `
    <span class="smallcaps">Ton niveau</span>
    <h3 style="margin:8px 0 4px;">${lvl.title}</h3>
    <p style="font-size:12px;color:var(--text-dim);margin-bottom:14px;">${g.xp} XP au total · ${coursDone}/${BUSINESS_COURS_IDS.length} cours Business terminés</p>
    <div class="business-concepts-list">${conceptsHtml}</div>
    <div style="margin-top:14px;">${ctaHtml}</div>`;
}

// ---------- Ta progression sur les outils de raisonnement Business (cas,
// modèles, problèmes, Unit Economics, idée en cours) : jamais un pourcentage
// inventé, uniquement des comptes réels tirés de fzr-xp-repeat-counts (clé
// permanente écrite par tryAwardQuizPoints, contrairement au ledger du jour
// utilisé pour l'anti-farming) et de fzr-business-project. ----------
function renderBusinessToolsProgress(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const claimedIds = Object.keys(getXPRepeatCounts());
  const casesStudied = claimedIds.filter(id => id.startsWith('business-case-')).length;
  const modelsStudied = claimedIds.filter(id => id.startsWith('business-model-')).length;
  const problemsExplored = claimedIds.filter(id => id.startsWith('business-problem-')).length;
  const unitEconomicsUsed = claimedIds.some(id => id.startsWith('unit-economics-'));
  const projectAnswers = safeGetJSON('fzr-business-project', {});
  const ideaInProgress = Object.values(projectAnswers).some(v => (typeof v === 'string' ? v.trim() : v));

  const casesTotal = (typeof BUSINESS_CASES !== 'undefined') ? BUSINESS_CASES.length : null;
  const modelsTotal = (typeof BUSINESS_MODELS !== 'undefined') ? BUSINESS_MODELS.length : null;
  const problemsTotal = (typeof BUSINESS_PROBLEMS !== 'undefined') ? BUSINESS_PROBLEMS.length : null;

  const rows = [];
  if(casesTotal !== null) rows.push({label:'Cas réels étudiés', value:`${casesStudied}/${casesTotal}`, href:'business-cases.html'});
  if(modelsTotal !== null) rows.push({label:'Modèles économiques explorés', value:`${modelsStudied}/${modelsTotal}`, href:'business-cases.html'});
  if(problemsTotal !== null) rows.push({label:'Problèmes explorés', value:`${problemsExplored}/${problemsTotal}`, href:'business-lab.html#business-probleme'});
  rows.push({label:'Unit Economics testé', value: unitEconomicsUsed ? 'Oui' : 'Pas encore', href:'business-lab.html'});
  rows.push({label:'Idée en cours de construction', value: ideaInProgress ? 'Oui' : 'Pas encore', href:'construire-son-projet.html'});

  const allZero = casesStudied === 0 && modelsStudied === 0 && problemsExplored === 0 && !unitEconomicsUsed && !ideaInProgress;

  el.innerHTML = `
    <span class="smallcaps">Ta progression Business</span>
    ${allZero ? `<p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Tu n'as pas encore commencé — <a href="business-cases.html" style="color:var(--gold-bright);">explore un premier cas réel</a> pour démarrer.</p>` : `
    <div style="margin-top:10px;">${rows.map(r => `<a href="${r.href}" class="panel-row" style="text-decoration:none;color:inherit;"><span>${r.label}</span><span class="val mono">${r.value}</span></a>`).join('')}</div>`}`;
}

// ---------- Ta progression Bourse V2 : mêmes principes que
// renderBusinessToolsProgress — uniquement des comptes réels tirés de
// fzr-xp-repeat-counts et fzr-investor-profile, jamais un pourcentage
// inventé. ----------
function renderBourseToolsProgress(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const claimedIds = Object.keys(getXPRepeatCounts());
  const scenariosViewed = claimedIds.some(id => id.startsWith('allocation-scenarios-'));
  const portfolioSimulated = claimedIds.some(id => id.startsWith('portfolio-simulator-'));
  const profile = safeGetJSON('fzr-investor-profile', null);

  const rows = [
    {label: 'Profil investisseur rempli', value: profile ? 'Oui' : 'Pas encore', href: 'bourse-allocation.html'},
    {label: "Scénarios d'allocation consultés", value: scenariosViewed ? 'Oui' : 'Pas encore', href: 'bourse-allocation.html'},
    {label: 'Portefeuille simulé', value: portfolioSimulated ? 'Oui' : 'Pas encore', href: 'bourse-allocation.html'}
  ];
  const allZero = !profile && !scenariosViewed && !portfolioSimulated;

  el.innerHTML = `
    <span class="smallcaps">Ta progression Bourse</span>
    ${allZero ? `<p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Tu n'as pas encore commencé — <a href="bourse-allocation.html" style="color:var(--gold-bright);">définis ton profil investisseur</a> pour démarrer.</p>` : `
    <div style="margin-top:10px;">${rows.map(r => `<a href="${r.href}" class="panel-row" style="text-decoration:none;color:inherit;"><span>${r.label}</span><span class="val mono">${r.value}</span></a>`).join('')}</div>`}`;
}

// ---------- Cas recommandé pour toi (Business) : même logique que
// renderRecommandePourToi (Défis), restreinte au périmètre déjà utilisé par
// "Ton niveau" (BUSINESS_SKILL_CATEGORIES) — pas une nouvelle taxonomie,
// la même liste que celle affichée juste à côté. ----------
function renderBusinessCasRecommande(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const pool = defisFullPool().filter(i => BUSINESS_SKILL_CATEGORIES.includes(i.categorie));
  if(pool.length === 0){ el.style.display = 'none'; return; }
  const mastery = getSkillMastery().filter(m => BUSINESS_SKILL_CATEGORIES.includes(m.categorie));
  const weakest = mastery.find(m => m.niveau === 'faible');
  let categorie, reason;
  if(weakest){
    categorie = weakest.categorie;
    reason = `Tu as récemment eu du mal avec ${categorie} (${weakest.pct}% de bonnes réponses).`;
  } else {
    const exploredCats = new Set(mastery.map(m => m.categorie));
    const poolCats = [...new Set(pool.map(i => i.categorie))];
    const unexplored = poolCats.filter(c => !exploredCats.has(c));
    if(unexplored.length > 0){
      categorie = unexplored[dayOfYear() % unexplored.length];
      reason = "Une notion Business que tu n'as pas encore explorée.";
    } else {
      categorie = poolCats[dayOfYear() % poolCats.length];
      reason = "Un thème à revoir pour varier tes révisions Business.";
    }
  }
  el.innerHTML = `
    <span class="smallcaps">🎯 Cas recommandé pour toi</span>
    <p style="font-size:12.5px;color:var(--text-dim);margin:6px 0 10px;">${reason}</p>
    <h3 style="margin-bottom:10px;font-size:17px;">${categorie}</h3>
    <button class="btn btn-sm btn-gold" id="${elId}-start">S'entraîner sur ce thème →</button>`;
  document.getElementById(`${elId}-start`).addEventListener('click', () => {
    const catPool = pool.filter(i => i.categorie === categorie);
    startMixedSession(elId, pickAdaptivePool(catPool, categorie, 5), {level:'business', categorie, onRestart: () => renderBusinessCasRecommande(elId)});
  });
}

// ---------- Business Lab : décisions rapides + business cases, réutilise
// les vraies données déjà écrites (MENTAL_CHALLENGES domain "Business" et
// QUIZ_BANK_FULL sur les 6 catégories Business de DOMAINS) — aucune donnée
// inventée. "Construis ton projet" (outil déjà existant, réflexion guidée)
// est présenté ici comme 3e module plutôt que dupliqué ailleurs sur la
// page. Volontairement pas de 4e module "Construis ton entreprise avec
// conséquences" : ça demanderait un vrai moteur de décisions/conséquences
// économiques (comme le jeu de portefeuille, mais pour un business), hors
// scope de cette passe. ----------
function businessLabDecisionsPool(){ return MENTAL_CHALLENGES.filter(m => m.domain === 'Business'); }
function businessLabCasesPool(){
  const domain = DOMAINS.find(d => d.key === 'business');
  return QUIZ_BANK_FULL.filter(q => domain.quizCategories.includes(q.categorie));
}
function shuffleCopy(arr){
  const copy = arr.slice();
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function renderBusinessLab(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const decisionsPool = businessLabDecisionsPool();
  const casesPool = businessLabCasesPool();
  const sessionEl = document.getElementById(`${elId}-session`);
  el.innerHTML = `
    <button type="button" class="card play-tile" id="${elId}-decisions" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.lightbulb}</span>
      <h3 style="margin:10px 0 6px;">Décisions rapides</h3>
      <p>${decisionsPool.length} situations business à trancher en 2 minutes chacune.</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Commencer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-cases" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.scale}</span>
      <h3 style="margin:10px 0 6px;">Business Cases</h3>
      <p>${casesPool.length} cas sur le chiffre d'affaires, la marge, les levées de fonds…</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Commencer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-unit-economics" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.calculator}</span>
      <h3 style="margin:10px 0 6px;">Unit Economics</h3>
      <p>Prix, marge, CAC, LTV, point mort : ton business est-il économiquement cohérent ?</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Calculer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-headcount" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.user}</span>
      <h3 style="margin:10px 0 6px;">Simulateur RH / Recrutement</h3>
      <p>Coût réel d'une embauche et durée pour la rentabiliser.</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Calculer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-expenses" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.wallet}</span>
      <h3 style="margin:10px 0 6px;">Dépenses & trésorerie</h3>
      <p>OPEX, CAPEX, et projection de trésorerie sur plusieurs mois.</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Calculer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-pricing" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.coins}</span>
      <h3 style="margin:10px 0 6px;">Pricing interactif</h3>
      <p>Teste un nouveau prix : impact sur la marge et le volume nécessaire.</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Calculer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-funnel" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.compass}</span>
      <h3 style="margin:10px 0 6px;">Sales funnel interactif</h3>
      <p>Visiteurs → leads → prospects → clients, et le CAC implicite.</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Calculer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-scenarios" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.shield}</span>
      <h3 style="margin:10px 0 6px;">Scénarios & stress-test</h3>
      <p>Optimiste, pessimiste, choc — l'impact sur ton résultat, sauvegardable et comparable.</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Calculer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-runway" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.flame}</span>
      <h3 style="margin:10px 0 6px;">Runway</h3>
      <p>Combien de mois de trésorerie te reste-t-il au rythme actuel ?</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Calculer →</span></div>
    </button>
    <button type="button" class="card play-tile" id="${elId}-valorisation" style="width:100%;text-align:left;cursor:pointer;">
      <span class="icon" style="color:var(--gold-bright);">${ICONS.gem}</span>
      <h3 style="margin:10px 0 6px;">Valorisation par multiples</h3>
      <p>EV/EBITDA et PER : de vrais calculateurs, pas juste des définitions.</p>
      <div class="card-footer"><span class="badge status-reel">Disponible</span><span>Calculer →</span></div>
    </button>`;
  // Volontairement PAS de pickAdaptivePool sur ces 2 pools (audit Formations
  // Phase 3 du 27/08/2026) : "Décisions rapides" et "Business Cases"
  // mélangent volontairement toutes les catégories Business à la fois — pas
  // de maîtrise unique à cibler, contrairement à renderBusinessCasRecommande
  // ci-dessus qui filtre déjà sur UNE seule catégorie avant de lancer.
  document.getElementById(`${elId}-decisions`).addEventListener('click', () => {
    if(!sessionEl) return;
    startMixedSession(`${elId}-session`, shuffleCopy(decisionsPool).slice(0, 6), {level:'business', categorie:'Décisions rapides', onRestart: () => renderBusinessLab(elId)});
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-cases`).addEventListener('click', () => {
    if(!sessionEl) return;
    startMixedSession(`${elId}-session`, shuffleCopy(casesPool).slice(0, 6), {level:'business', categorie:'Business Cases', onRestart: () => renderBusinessLab(elId)});
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-unit-economics`).addEventListener('click', () => {
    if(!sessionEl) return;
    sessionEl.innerHTML = `<div class="card" style="max-width:none;"><div id="${elId}-session-unit-economics"></div></div>`;
    renderUnitEconomics(`${elId}-session-unit-economics`);
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-headcount`).addEventListener('click', () => {
    if(!sessionEl) return;
    sessionEl.innerHTML = `<div class="card" style="max-width:none;"><div id="${elId}-session-headcount"></div></div>`;
    renderHeadcountSimulator(`${elId}-session-headcount`);
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-expenses`).addEventListener('click', () => {
    if(!sessionEl) return;
    sessionEl.innerHTML = `<div class="card" style="max-width:none;"><div id="${elId}-session-expenses"></div></div>`;
    renderBusinessExpenses(`${elId}-session-expenses`);
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-pricing`).addEventListener('click', () => {
    if(!sessionEl) return;
    sessionEl.innerHTML = `<div class="card" style="max-width:none;"><div id="${elId}-session-pricing"></div></div>`;
    renderPricingSimulator(`${elId}-session-pricing`);
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-funnel`).addEventListener('click', () => {
    if(!sessionEl) return;
    sessionEl.innerHTML = `<div class="card" style="max-width:none;"><div id="${elId}-session-funnel"></div></div>`;
    renderSalesFunnel(`${elId}-session-funnel`);
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-scenarios`).addEventListener('click', () => {
    if(!sessionEl) return;
    sessionEl.innerHTML = `<div class="card" style="max-width:none;"><div id="${elId}-session-scenarios"></div></div>`;
    renderBusinessScenarios(`${elId}-session-scenarios`);
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-runway`).addEventListener('click', () => {
    if(!sessionEl) return;
    sessionEl.innerHTML = `<div class="card" style="max-width:none;"><div id="${elId}-session-runway"></div></div>`;
    renderRunwaySimulator(`${elId}-session-runway`);
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  document.getElementById(`${elId}-valorisation`).addEventListener('click', () => {
    if(!sessionEl) return;
    sessionEl.innerHTML = `<div class="card" style="max-width:none;"><div id="${elId}-session-valorisation"></div></div>`;
    renderValorisationSimulator(`${elId}-session-valorisation`);
    sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
}

// ---------- Unit Economics : "mon business est-il économiquement cohérent ?"
// Calculs enchaînés à partir des seules hypothèses saisies (prix, coût
// direct, CAC, achats moyens, charges fixes) — jamais un verdict du type
// "ton business est excellent", seulement ce que les chiffres montrent une
// fois combinés, plus 2 questions de sensibilité réelles recalculées en
// direct. Formules réelles et standard (marge brute, LTV = marge × achats
// moyens, ratio LTV/CAC, seuil de rentabilité = charges fixes / marge). ----------
function computeUnitEconomics(a){
  const prix = Number(a.prix) || 0;
  const coutDirect = Number(a.coutDirect) || 0;
  const cac = Number(a.cac) || 0;
  const achatsMoyens = Number(a.achatsMoyens) || 0;
  const chargesFixes = Number(a.chargesFixes) || 0;

  const margeBrute = prix - coutDirect;
  const margeBrutePct = prix > 0 ? (margeBrute / prix) * 100 : null;
  const ltv = margeBrute * achatsMoyens;
  const ratioLtvCac = cac > 0 ? ltv / cac : null;
  const seuilVentes = (margeBrute > 0 && chargesFixes > 0) ? Math.ceil(chargesFixes / margeBrute) : null;
  const revenuTotalMoyen = prix * achatsMoyens;

  // Customer Economics enrichi (Financial Lab, Phase 5) : churn et ARPU sont
  // optionnels (un business non-abonnement les laisse à 0) — jamais un
  // calcul fabriqué en leur absence, toujours null plutôt que 0 trompeur.
  const churnMensuelPct = Number(a.churnMensuelPct) || 0;
  const arpuMensuel = Number(a.arpuMensuel) || 0;
  const customerLifetimeMonths = churnMensuelPct > 0 ? 100 / churnMensuelPct : null;
  const ltvAbonnement = (arpuMensuel > 0 && customerLifetimeMonths !== null) ? arpuMensuel * customerLifetimeMonths : null;
  const paybackMonths = (cac > 0 && arpuMensuel > 0 && margeBrutePct !== null && margeBrutePct > 0) ? cac / (arpuMensuel * (margeBrutePct / 100)) : null;

  return {
    prix, coutDirect, cac, achatsMoyens, chargesFixes, margeBrute, margeBrutePct, ltv, ratioLtvCac, seuilVentes, revenuTotalMoyen,
    churnMensuelPct, arpuMensuel, customerLifetimeMonths, ltvAbonnement, paybackMonths
  };
}

// ---------- Panneaux de méthodologie côté Professionnel — même principe et
// même forme que LAB_METHODOLOGY (scripts/pages/laboratoire.js) côté
// Personnel, mais rempli à l'intérieur de la fonction de rendu elle-même
// plutôt qu'en une boucle unique au chargement : contrairement au Laboratoire
// personnel, les conteneurs de résultat de ces 3 outils sont créés
// dynamiquement (clic, fin de partie, étape finale de l'assistant), jamais
// présents dans le HTML statique au chargement de la page. ----------
const BUSINESS_METHODOLOGY = {
  'profil-entreprise': {
    calcul: "Chiffre d'affaires = selon le mode choisi (prix × volume, clients × panier moyen, abonnés × prix × 12, ou somme des lignes produits). Résultat mensuel = CA mensuel − coûts variables (% du CA) − charges fixes − masse salariale − marketing.",
    donnees: "Aucune donnée externe : uniquement les hypothèses que tu saisis toi-même.",
    hypotheses: "Les coûts variables sont un pourcentage constant du CA, quel que soit le volume — une hypothèse simplificatrice qui ignore les économies d'échelle possibles à plus grand volume.",
    limites: "Ce n'est pas un vrai compte de résultat comptable : ni amortissements, ni impôts, ni distinction entre charges sociales et salaire net.",
    comprendre: "La marge sur coûts variables n'est jamais présentée comme une EBITDA — établir une vraie EBITDA exigerait de trancher quels postes sont réellement \"opérationnels\", une décision non modélisée ici."
  },
  'unit-economics': {
    calcul: "Marge brute = prix de vente − coût direct. LTV = marge brute × nombre d'achats moyen par client. Ratio LTV/CAC = LTV ÷ coût d'acquisition. Seuil de rentabilité (ventes mensuelles) = charges fixes ÷ marge brute. Pour un abonnement (optionnel) : durée de vie client = 100 ÷ churn mensuel (%). LTV abonnement = ARPU mensuel × durée de vie. Payback period = CAC ÷ (ARPU mensuel × marge brute %).",
    donnees: "Aucune donnée externe : uniquement les chiffres que tu saisis toi-même (prix, coût direct, CAC, achats moyens, charges fixes, et pour un abonnement : churn et ARPU).",
    hypotheses: "Suppose un coût direct et un prix constants sur toutes les ventes, et un nombre d'achats moyen par client représentatif — en réalité, ces chiffres varient d'un client à l'autre. Le churn est supposé constant dans le temps, alors qu'il varie souvent selon l'ancienneté du client.",
    limites: "Ne modélise ni la saisonnalité, ni les coûts indirects (support client, retours) au-delà du coût direct saisi. La durée de vie client (100/churn) suppose un taux de résiliation constant — un churn qui décroît avec l'ancienneté donnerait une durée de vie réelle plus longue.",
    comprendre: "Un ratio LTV/CAC élevé ne suffit pas à lui seul : si le seuil de rentabilité en ventes mensuelles n'est jamais atteint, l'activité peut rester déficitaire malgré un bon ratio par client. Un payback period long (>12-18 mois, repère usuel) signifie que l'entreprise doit financer longtemps l'acquisition avant de la rentabiliser."
  },
  'headcount': {
    calcul: "Coût total mensuel = salaire brut × (1 + charges patronales %). Marge nette mensuelle = marge générée par le poste − coût total mensuel. Mois pour rentabiliser = coût de recrutement ÷ marge nette mensuelle (si positive). Comparaison optionnelle : coût mensuel freelance = tarif journalier × jours facturés par mois.",
    donnees: "Aucune donnée externe : uniquement les hypothèses que tu saisis toi-même.",
    hypotheses: "Suppose que la marge générée par le poste est constante dès le premier mois — en réalité, une nouvelle recrue met généralement du temps à devenir pleinement opérationnelle (montée en compétence).",
    limites: "Ne modélise ni la formation, ni la période d'essai, ni le risque de turnover — un vrai coût de recrutement inclut souvent bien plus que les frais d'annonce ou d'agence (temps de l'équipe consacré au recrutement, par exemple).",
    comprendre: "Si la marge nette mensuelle est négative, l'embauche ne se rentabilise jamais au rythme actuel — augmenter la marge générée (prix, volume) ou réduire le coût (négociation salariale, aide à l'embauche) sont les deux seuls leviers."
  },
  'expenses-cashflow': {
    calcul: "OPEX mensuel = somme des dépenses récurrentes saisies. Solde mensuel projeté = résultat du profil entreprise − OPEX. Trésorerie projetée au mois n = trésorerie actuelle − CAPEX total + (n × solde mensuel).",
    donnees: "Le résultat mensuel et la trésorerie de départ viennent de \"Mon profil entreprise\" ; l'OPEX et le CAPEX viennent des dépenses que tu ajoutes ici.",
    hypotheses: "Le CAPEX est supposé payé comptant intégralement dès aujourd'hui — jamais un étalement fabriqué faute de date de paiement précisée. Le solde mensuel est supposé constant sur tout l'horizon.",
    limites: "Ne modélise ni la saisonnalité, ni un financement du CAPEX par emprunt (qui étalerait le décaissement dans le temps plutôt qu'un paiement comptant immédiat).",
    comprendre: "Séparer OPEX et CAPEX compte parce qu'ils se comportent différemment sur la trésorerie : le CAPEX est un choc ponctuel qu'on peut choisir de retarder, alors que l'OPEX pèse tous les mois — deux entreprises avec le même résultat net peuvent avoir des trajectoires de trésorerie très différentes selon ce mélange."
  },
  'pricing': {
    calcul: "Marge par vente = prix − coût direct. Marge totale à volume constant = marge par vente × volume actuel. Volume nécessaire pour la même marge totale = marge totale actuelle ÷ nouvelle marge par vente.",
    donnees: "Aucune donnée externe : uniquement les hypothèses que tu saisis toi-même.",
    hypotheses: "Suppose que le volume de ventes reste constant quel que soit le prix testé — aucune élasticité prix/volume n'est modélisée, faute de pouvoir la mesurer sans donnée réelle.",
    limites: "Un vrai changement de prix affecte presque toujours le volume vendu (à la hausse si le prix baisse, à la baisse s'il augmente) — ce calcul montre l'impact mécanique à volume constant, jamais une prédiction de la réaction réelle du marché.",
    comprendre: "Le \"volume nécessaire pour la même marge totale\" répond à la question qui compte vraiment avant de baisser un prix : pas \"combien vais-je vendre en plus ?\" (personne ne le sait avec certitude), mais \"combien devrais-je vendre en plus pour au moins ne pas perdre d'argent ?\" — un repère concret pour juger si l'objectif est réaliste."
  },
  'sales-funnel': {
    calcul: "Leads = visiteurs × taux de conversion visiteur→lead. Prospects = leads × taux lead→prospect. Clients = prospects × taux prospect→client. CAC implicite = budget marketing ÷ clients. Comparaison « où agir en priorité » : +20% appliqué à un seul taux à la fois, toutes choses égales par ailleurs.",
    donnees: "Aucune donnée externe : uniquement les taux de conversion que tu saisis toi-même à chaque étage.",
    hypotheses: "Suppose des taux de conversion constants à chaque étage, indépendamment du volume de visiteurs.",
    limites: "En réalité, un volume de visiteurs plus élevé peut attirer un trafic moins qualifié et faire baisser les taux de conversion réels à chaque étage — ce calcul ne modélise pas cet effet.",
    comprendre: "Un entonnoir rend visible OÙ agir en priorité : améliorer de 50% le taux le plus faible des 3 étages a souvent plus d'impact sur le nombre final de clients que d'améliorer légèrement les 3 — teste plusieurs combinaisons de taux pour voir lequel pèse le plus dans ton cas."
  },
  'scenarios': {
    calcul: "CA ajusté = CA du profil × (1 + variation CA %) − (clients perdus × CA moyen par client). Charges ajustées = charges du profil × (1 + variation charges %). Résultat ajusté = marge sur CA ajusté − charges ajustées.",
    donnees: "Le profil entreprise (CA, charges, coûts variables) et les scénarios sauvegardés que tu ajoutes.",
    hypotheses: "Les 3 préréglages (optimiste +15%/−5%, pessimiste −15%/+10%, choc sévère −30%/+20%) sont des illustrations documentées, jamais une prévision réelle calibrée sur ton marché.",
    limites: "Un scénario sauvegardé est toujours recalculé contre ton profil ACTUEL, jamais figé au moment de la sauvegarde — si tu modifies ton profil entreprise plus tard, les scénarios déjà sauvegardés refléteront honnêtement l'impact sur ta nouvelle situation."
  },
  'runway': {
    calcul: "Burn mensuel = résultat mensuel du profil entreprise, si négatif (0 si l'entreprise est profitable). Runway = trésorerie actuelle ÷ burn mensuel. Le simulateur \"Et si...\" recalcule ce runway avec une levée de fonds hypothétique et/ou une variation du burn, sans jamais modifier le profil entreprise réel.",
    donnees: "Trésorerie actuelle et résultat mensuel viennent directement de \"Mon profil entreprise\".",
    hypotheses: "Le calcul de base suppose que le burn mensuel actuel se maintient à l'identique — le simulateur \"Et si...\" permet de tester une évolution hypothétique (levée de fonds, réduction de coûts) sans l'écrire dans le profil.",
    limites: "Le résultat approximatif du profil n'est pas un vrai suivi de trésorerie (encaissements/décaissements réels, délais de paiement clients/fournisseurs non modélisés) — un runway réel peut différer de ce calcul.",
    comprendre: "Le runway répond à une seule question mais elle est décisive : combien de temps as-tu pour changer de trajectoire (trouver des clients, lever des fonds, réduire les coûts) avant d'être à court de trésorerie ? Un runway court n'est pas une fatalité, mais il fixe une vraie échéance."
  },
  'valorisation': {
    calcul: "Valorisation par EV/EBITDA = EBITDA annuel × multiple choisi. Valorisation par PER = résultat net annuel × PER choisi.",
    donnees: "Aucune donnée externe : EBITDA, multiple, résultat net et PER sont tous des saisies manuelles.",
    hypotheses: "Le multiple ou le PER utilisé est une hypothèse que tu choisis toi-même — aucun multiple de marché réel n'est recherché ou suggéré automatiquement.",
    limites: "Le multiple approprié varie énormément selon le secteur, la taille et la croissance de l'entreprise. Les 2 méthodes donnent souvent des résultats différents pour la même entreprise, et une vraie valorisation de transaction dépend de bien plus que ce calcul (négociation, due diligence, actifs et passifs hors bilan).",
    comprendre: "Une valorisation par multiples n'est jamais un prix figé : elle donne un ordre de grandeur discutable, pas un chiffre définitif — c'est pour ça que 2 méthodes différentes donnent souvent 2 résultats différents pour la même entreprise, et qu'une vraie négociation part de là plutôt que de s'y arrêter."
  },
  'business-game': {
    calcul: "Chaque décision prise pendant la partie modifie plusieurs variables (trésorerie, clients, MRR, satisfaction...) selon des règles définies à l'avance pour le secteur choisi (voir scripts/games/business-game-data.js) ; le résultat final est l'état cumulé de ces variables après toutes les décisions.",
    donnees: "Aucune donnée réelle : effets de décisions pré-écrits par secteur (SaaS / E-commerce / Restaurant), pas une vraie modélisation économique ni une prédiction sur une entreprise réelle.",
    hypotheses: "Suppose que les effets d'une décision sont toujours les mêmes, indépendamment du contexte réel de ton entreprise — un raccourci pédagogique nécessaire pour un jeu déterministe et rejouable.",
    limites: "Ne remplace jamais un vrai business plan ou une vraie comptabilité : deux entreprises réelles confrontées aux mêmes décisions peuvent obtenir des résultats très différents selon leur marché, leur exécution et des facteurs externes non modélisés ici."
  },
  'construire-mon-projet': {
    calcul: "Seuil de rentabilité = charges fixes mensuelles ÷ marge par vente (prix de vente − coût variable unitaire), à partir des chiffres que tu renseignes toi-même à chaque étape.",
    donnees: "Aucune donnée externe : uniquement tes propres réponses au questionnaire guidé.",
    hypotheses: "Suppose un prix de vente et un coût variable constants par unité vendue, sans tenir compte des paliers de charges ou des remises de volume.",
    limites: "Cette fiche récapitule des hypothèses simplifiées et déclaratives — elle ne constitue ni un business plan complet, ni un conseil financier, ni une garantie de viabilité du projet."
  }
};

function renderUnitEconomics(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const stored = safeGetJSON('fzr-unit-economics', {prix:50, coutDirect:15, cac:40, achatsMoyens:3, chargesFixes:1500, churnMensuelPct:0, arpuMensuel:0});

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} Renseigne tes propres hypothèses : les calculs s'enchaînent à partir de ces chiffres, sans jugement automatique sur ton projet.</p>
    <div class="card-grid" style="margin-bottom:16px;">
      <div class="field"><label for="${elId}-prix">Prix de vente moyen (€)</label><input type="number" id="${elId}-prix" value="${stored.prix}"></div>
      <div class="field"><label for="${elId}-coutDirect">Coût direct par vente (€)</label><input type="number" id="${elId}-coutDirect" value="${stored.coutDirect}"></div>
      <div class="field"><label for="${elId}-cac">CAC — coût d'acquisition (€)</label><input type="number" id="${elId}-cac" value="${stored.cac}"></div>
      <div class="field"><label for="${elId}-achatsMoyens">Nombre d'achats moyen par client</label><input type="number" id="${elId}-achatsMoyens" value="${stored.achatsMoyens}" step="0.1"></div>
      <div class="field"><label for="${elId}-chargesFixes">Charges fixes mensuelles (€)</label><input type="number" id="${elId}-chargesFixes" value="${stored.chargesFixes}"></div>
    </div>
    <span class="smallcaps" style="display:block;margin-bottom:8px;">Business par abonnement ? (optionnel — Customer Economics enrichi)</span>
    <div class="card-grid" style="margin-bottom:16px;">
      <div class="field"><label for="${elId}-churnMensuelPct">Taux de résiliation mensuel — churn (%)</label><input type="number" id="${elId}-churnMensuelPct" value="${stored.churnMensuelPct || 0}" min="0" max="100" step="0.1"></div>
      <div class="field"><label for="${elId}-arpuMensuel">Revenu moyen par client et par mois — ARPU (€)</label><input type="number" id="${elId}-arpuMensuel" value="${stored.arpuMensuel || 0}" min="0"></div>
    </div>
    <div id="${elId}-results"></div>
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;

  function readInputs(){
    return {
      prix: document.getElementById(`${elId}-prix`).value,
      coutDirect: document.getElementById(`${elId}-coutDirect`).value,
      cac: document.getElementById(`${elId}-cac`).value,
      achatsMoyens: document.getElementById(`${elId}-achatsMoyens`).value,
      chargesFixes: document.getElementById(`${elId}-chargesFixes`).value,
      churnMensuelPct: document.getElementById(`${elId}-churnMensuelPct`).value,
      arpuMensuel: document.getElementById(`${elId}-arpuMensuel`).value
    };
  }
  function update(){
    const a = readInputs();
    safeSetJSON('fzr-unit-economics', a);
    const r = computeUnitEconomics(a);
    const ratioColor = r.ratioLtvCac === null ? 'var(--text-dim)' : r.ratioLtvCac >= 3 ? 'var(--emerald)' : r.ratioLtvCac >= 1 ? 'var(--gold-bright)' : 'var(--bordeaux)';
    document.getElementById(`${elId}-results`).innerHTML = `
      <div class="card" style="margin-bottom:14px;">
        <span class="smallcaps">Ce que ces chiffres donnent, étape par étape</span>
        <div class="result-row" style="justify-content:space-between;margin-top:10px;"><span>Marge brute par vente</span><span class="mono">${fmtEUR(r.margeBrute)}${r.margeBrutePct!==null ? ` (${r.margeBrutePct.toFixed(0)}%)` : ''}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>LTV (marge brute × achats moyens)</span><span class="mono">${fmtEUR(r.ltv)}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>Ratio LTV / CAC</span><span class="mono" style="color:${ratioColor};">${r.ratioLtvCac===null?'—':r.ratioLtvCac.toFixed(1)+'×'}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>Revenu total moyen par client</span><span class="mono">${fmtEUR(r.revenuTotalMoyen)}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>Ventes mensuelles au point mort</span><span class="mono">${r.seuilVentes===null?'—':r.seuilVentes}</span></div>
      </div>
      ${r.customerLifetimeMonths !== null || r.paybackMonths !== null ? `
      <div class="card" style="margin-bottom:14px;">
        <span class="smallcaps">Customer Economics — abonnement</span>
        <div class="result-row" style="justify-content:space-between;margin-top:10px;"><span>Durée de vie client estimée</span><span class="mono">${r.customerLifetimeMonths===null?'—':r.customerLifetimeMonths.toFixed(1)+' mois'}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>LTV basée sur le revenu récurrent</span><span class="mono">${r.ltvAbonnement===null?'—':fmtEUR(r.ltvAbonnement)}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>Payback period (CAC récupéré en)</span><span class="mono">${r.paybackMonths===null?'—':r.paybackMonths.toFixed(1)+' mois'}</span></div>
      </div>` : ''}
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">${renderDataBadge('avis')} Un ratio LTV/CAC autour de 3 est souvent cité comme un repère sain (voir la fiche « CAC » de la Bibliothèque) — un repère indicatif, jamais une règle universelle ni une garantie de rentabilité.</p>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Sensibilité — que se passe-t-il si...</span>
      <div class="card-grid">
        <div class="card"><h4>CAC +20%</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Ratio LTV/CAC : <strong class="mono">${r.cac>0 ? (r.ltv/(r.cac*1.2)).toFixed(1)+'×' : '—'}</strong></p></div>
        <div class="card"><h4>1 achat de moins par client</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">LTV : <strong class="mono">${fmtEUR(r.margeBrute * Math.max(0, r.achatsMoyens - 1))}</strong></p></div>
      </div>
      ${renderCourseLibraryLinks(['CAC', 'LTV', 'Marge brute', 'Seuil de rentabilité', 'Churn'])}`;
    document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['unit-economics']);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  }
  ['prix','coutDirect','cac','achatsMoyens','chargesFixes','churnMensuelPct','arpuMensuel'].forEach(key => {
    document.getElementById(`${elId}-${key}`).addEventListener('input', update);
  });
  update();
  tryAwardQuizPoints(`unit-economics-${new Date().toDateString()}`, 5, {usedUnitEconomics:true});
}

// ---------- Simulateur RH / Recrutement (Financial Lab, Phase 5) : coût
// réel d'une embauche (salaire + charges patronales, jamais juste le salaire
// brut affiché à l'offre) et durée pour la rentabiliser à partir de la marge
// qu'elle est censée générer. ----------
function computeHeadcountBreakeven(a){
  const salaireBrutMensuel = Number(a.salaireBrutMensuel) || 0;
  const chargesPatronalesPct = Number(a.chargesPatronalesPct) || 0;
  const coutRecrutement = Number(a.coutRecrutement) || 0;
  const margeGenereeParEmploye = Number(a.margeGenereeParEmploye) || 0;

  const coutTotalMensuel = salaireBrutMensuel * (1 + chargesPatronalesPct / 100);
  const coutTotalAnnuel = coutTotalMensuel * 12;
  const margeNetteMensuelle = margeGenereeParEmploye - coutTotalMensuel;
  // Jamais un mois négatif ou fabriqué : sans marge nette positive, l'embauche
  // ne se rentabilise jamais au rythme actuel, quel que soit le coût de
  // recrutement — statut "jamais", pas un chiffre de mois inventé.
  const moisBreakEven = margeNetteMensuelle > 0 ? (coutRecrutement > 0 ? coutRecrutement / margeNetteMensuelle : 0) : null;

  // Comparaison optionnelle salarié vs freelance/prestataire (§ Options/Impact) :
  // jamais calculée si les 2 champs ne sont pas renseignés, pour ne jamais
  // afficher un coût freelance fabriqué à partir d'hypothèses vides.
  const tarifJournalierFreelance = Number(a.tarifJournalierFreelance) || 0;
  const joursParMoisFreelance = Number(a.joursParMoisFreelance) || 0;
  const coutFreelanceMensuel = (tarifJournalierFreelance > 0 && joursParMoisFreelance > 0) ? tarifJournalierFreelance * joursParMoisFreelance : null;

  return {
    salaireBrutMensuel, chargesPatronalesPct, coutRecrutement, margeGenereeParEmploye, coutTotalMensuel, coutTotalAnnuel, margeNetteMensuelle, moisBreakEven,
    tarifJournalierFreelance, joursParMoisFreelance, coutFreelanceMensuel
  };
}
function renderHeadcountSimulator(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const stored = safeGetJSON('fzr-headcount-sim', {salaireBrutMensuel:2800, chargesPatronalesPct:42, coutRecrutement:2000, margeGenereeParEmploye:3500});

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} Le coût réel d'une embauche inclut toujours les charges patronales, jamais seulement le salaire brut affiché sur l'offre.</p>
    <div class="card-grid" style="margin-bottom:16px;">
      <div class="field"><label for="${elId}-salaireBrutMensuel">Salaire brut mensuel (€)</label><input type="number" id="${elId}-salaireBrutMensuel" min="0" value="${stored.salaireBrutMensuel}"></div>
      <div class="field"><label for="${elId}-chargesPatronalesPct">Charges patronales (% du brut)</label><input type="number" id="${elId}-chargesPatronalesPct" min="0" max="100" value="${stored.chargesPatronalesPct}"></div>
      <div class="field"><label for="${elId}-coutRecrutement">Coût de recrutement ponctuel (€)</label><input type="number" id="${elId}-coutRecrutement" min="0" value="${stored.coutRecrutement}"></div>
      <div class="field"><label for="${elId}-margeGenereeParEmploye">Marge générée par ce poste (€/mois)</label><input type="number" id="${elId}-margeGenereeParEmploye" min="0" value="${stored.margeGenereeParEmploye}"></div>
    </div>
    <span class="smallcaps" style="display:block;margin-bottom:8px;">Comparer à un freelance/prestataire ? (optionnel)</span>
    <div class="card-grid" style="margin-bottom:16px;">
      <div class="field"><label for="${elId}-tarifJournalierFreelance">Tarif journalier freelance (€)</label><input type="number" id="${elId}-tarifJournalierFreelance" min="0" value="${stored.tarifJournalierFreelance || 0}"></div>
      <div class="field"><label for="${elId}-joursParMoisFreelance">Jours facturés par mois</label><input type="number" id="${elId}-joursParMoisFreelance" min="0" max="31" value="${stored.joursParMoisFreelance || 0}"></div>
    </div>
    <div id="${elId}-results"></div>
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;

  function readInputs(){
    return {
      salaireBrutMensuel: document.getElementById(`${elId}-salaireBrutMensuel`).value,
      chargesPatronalesPct: document.getElementById(`${elId}-chargesPatronalesPct`).value,
      coutRecrutement: document.getElementById(`${elId}-coutRecrutement`).value,
      margeGenereeParEmploye: document.getElementById(`${elId}-margeGenereeParEmploye`).value,
      tarifJournalierFreelance: document.getElementById(`${elId}-tarifJournalierFreelance`).value,
      joursParMoisFreelance: document.getElementById(`${elId}-joursParMoisFreelance`).value
    };
  }
  function update(){
    const a = readInputs();
    safeSetJSON('fzr-headcount-sim', a);
    const r = computeHeadcountBreakeven(a);
    document.getElementById(`${elId}-results`).innerHTML = `
      <div class="card" style="margin-bottom:14px;">
        <span class="smallcaps">Coût réel de ce poste</span>
        <div class="result-row" style="justify-content:space-between;margin-top:10px;"><span>Coût total mensuel (salaire + charges)</span><span class="mono">${fmtEUR(r.coutTotalMensuel)}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>Coût total annuel</span><span class="mono">${fmtEUR(r.coutTotalAnnuel)}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>Marge nette mensuelle (marge générée − coût)</span><span class="mono" style="color:${r.margeNetteMensuelle>=0?'var(--emerald)':'var(--bordeaux)'};">${r.margeNetteMensuelle>=0?'+':''}${fmtEUR(r.margeNetteMensuelle)}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>Rentabilisée (coût de recrutement récupéré) en</span><span class="mono">${r.moisBreakEven===null?'Jamais, au rythme actuel':r.moisBreakEven.toFixed(1)+' mois'}</span></div>
      </div>
      ${r.coutFreelanceMensuel !== null ? `
      <div class="card" style="margin-bottom:14px;">
        <span class="smallcaps">Salarié vs freelance/prestataire</span>
        <div class="result-row" style="justify-content:space-between;margin-top:10px;"><span>Coût mensuel salarié</span><span class="mono">${fmtEUR(r.coutTotalMensuel)}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>Coût mensuel freelance (${r.joursParMoisFreelance} j × ${fmtEUR(r.tarifJournalierFreelance)})</span><span class="mono">${fmtEUR(r.coutFreelanceMensuel)}</span></div>
        <div class="result-row" style="justify-content:space-between;border-top:1px solid var(--hairline);padding-top:6px;margin-top:4px;"><span><strong>Écart mensuel</strong></span><span class="mono" style="color:${r.coutFreelanceMensuel<=r.coutTotalMensuel?'var(--emerald)':'var(--bordeaux)'};"><strong>${fmtEUR(Math.abs(r.coutFreelanceMensuel-r.coutTotalMensuel))} ${r.coutFreelanceMensuel<=r.coutTotalMensuel?'moins cher en freelance':'moins cher en salarié'}</strong></span></div>
        <p style="font-size:12px;color:var(--text-dim);margin-top:8px;">Le coût le plus bas ne fait pas tout : un salarié offre un engagement long terme, une disponibilité et une intégration à l'équipe qu'un freelance n'offre pas forcément, et inversement un freelance permet d'ajuster le volume sans engagement de durée — jamais une simple question de prix.</p>
      </div>` : ''}
      <p class="disclaimer-box">La "marge générée par ce poste" est une hypothèse que tu fixes toi-même (ex. chiffre d'affaires additionnel × marge, ou temps libéré valorisé) — jamais un chiffre garanti ni mesuré automatiquement.</p>
      ${renderCourseLibraryLinks(['Recrutement'])}
      ${renderRelatedCourseLink('operations-rh-essentiels', 'RH : recruter, intégrer et retenir')}`;
    document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['headcount']);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  }
  ['salaireBrutMensuel','chargesPatronalesPct','coutRecrutement','margeGenereeParEmploye','tarifJournalierFreelance','joursParMoisFreelance'].forEach(key => {
    document.getElementById(`${elId}-${key}`).addEventListener('input', update);
  });
  update();
  tryAwardQuizPoints(`headcount-sim-${new Date().toDateString()}`, 5, {usedHeadcountSim:true});
}

// ---------- Dépenses OPEX/CAPEX & projection de trésorerie (Financial Lab,
// Phase 5) : liste persistante (même patron fzr-real-portfolio que partout
// ailleurs) — OPEX = charges d'exploitation récurrentes mensuelles, CAPEX =
// investissement ponctuel (non récurrent, jamais mensualisé automatiquement).
// La projection s'ajoute explicitement au résultat déjà calculé dans le
// profil entreprise, sans jamais tenter de fusionner les deux registres
// (risque de double comptage disclosed plutôt que masqué par une fausse
// fusion automatique). ----------
const BUSINESS_EXPENSES_KEY = 'fzr-business-expenses';
function getBusinessExpenses(){
  try {
    const raw = JSON.parse(localStorage.getItem(BUSINESS_EXPENSES_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function saveBusinessExpense(expense){
  if(!expense || typeof expense.nom !== 'string' || !expense.nom.trim() || !(expense.montant > 0) || (expense.categorie !== 'opex' && expense.categorie !== 'capex')) return null;
  const list = getBusinessExpenses();
  const entry = {
    id: 'expense-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    nom: expense.nom.trim().slice(0, 60), montant: expense.montant, categorie: expense.categorie,
    dateAjout: new Date().toISOString()
  };
  list.push(entry);
  localStorage.setItem(BUSINESS_EXPENSES_KEY, JSON.stringify(list));
  return entry;
}
function removeBusinessExpense(id){
  const list = getBusinessExpenses().filter(e => e.id !== id);
  localStorage.setItem(BUSINESS_EXPENSES_KEY, JSON.stringify(list));
}
function computeBusinessExpensesTotal(expenses){
  return (expenses || []).reduce((acc, e) => {
    if(e.categorie === 'opex') acc.opexMensuel += e.montant; else acc.capexTotal += e.montant;
    return acc;
  }, {opexMensuel: 0, capexTotal: 0});
}
// Projection simplifiée : le CAPEX est soustrait intégralement dès le mois 0
// (hypothèse d'un paiement comptant immédiat, jamais un étalement fabriqué
// faute de date de paiement réellement précisée par l'utilisateur).
function computeBusinessCashflowProjection(snapshot, opexMensuel, capexTotal, horizonMois, tresorerieActuelle){
  const soldeMensuel = snapshot.resultatMensuelApproximatif - (opexMensuel || 0);
  const series = [];
  let cash = (tresorerieActuelle || 0) - (capexTotal || 0);
  for(let m = 0; m <= horizonMois; m++){ series.push(cash); cash += soldeMensuel; }
  return {series, soldeMensuel, finalCash: series[series.length - 1]};
}
function renderBusinessExpenses(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} OPEX = charge d'exploitation récurrente mensuelle. CAPEX = investissement ponctuel (matériel, équipement). Ces dépenses s'ajoutent au résultat déjà calculé dans "Mon profil entreprise" — vérifie que tu ne les comptes pas deux fois dans "coûts fixes mensuels" là-bas.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <div class="field" style="flex:2;min-width:140px;"><label for="${elId}-nom">Nom</label><input type="text" id="${elId}-nom" placeholder="Loyer bureau"></div>
      <div class="field" style="flex:1;min-width:110px;"><label for="${elId}-montant">Montant (€)</label><input type="number" id="${elId}-montant" min="0" value="200"></div>
      <div class="field" style="flex:1;min-width:130px;"><label for="${elId}-categorie">Catégorie</label><select id="${elId}-categorie"><option value="opex">OPEX (mensuel)</option><option value="capex">CAPEX (ponctuel)</option></select></div>
    </div>
    <button type="button" class="btn btn-sm btn-gold" id="${elId}-add" style="margin-top:10px;">+ Ajouter</button>
    <div id="${elId}-list" style="margin-top:14px;"></div>
    <div class="card" style="margin-top:16px;">
      <span class="smallcaps">Projection de trésorerie</span>
      <div class="slider-row field" style="max-width:280px;margin-top:8px;"><label for="${elId}-horizon">Horizon <span class="v mono" id="${elId}-horizonVal">12 mois</span></label><input type="range" id="${elId}-horizon" min="3" max="24" step="1" value="12"></div>
      <div id="${elId}-cashflow" style="margin-top:10px;"></div>
    </div>
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;

  function renderList(){
    const expenses = getBusinessExpenses();
    const totals = computeBusinessExpensesTotal(expenses);
    if(expenses.length === 0){
      document.getElementById(`${elId}-list`).innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Aucune dépense enregistrée pour l'instant.</p>`;
    } else {
      document.getElementById(`${elId}-list`).innerHTML = `
        <p style="font-size:13px;margin-bottom:10px;"><strong>OPEX : ${fmtEUR(totals.opexMensuel)}/mois</strong> — <strong>CAPEX : ${fmtEUR(totals.capexTotal)} au total</strong></p>
        ${expenses.map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;padding:6px 0;border-bottom:1px solid var(--hairline);">
          <span>${e.categorie === 'opex' ? '🔁' : '🏗️'} ${e.nom}</span>
          <span style="display:flex;align-items:center;gap:10px;"><span class="mono">${fmtEUR(e.montant)}${e.categorie === 'opex' ? '/mois' : ''}</span><button type="button" class="btn btn-sm expense-remove" data-id="${e.id}" aria-label="Supprimer">✕</button></span>
        </div>`).join('')}`;
      document.querySelectorAll(`#${elId}-list .expense-remove`).forEach(btn => {
        btn.addEventListener('click', () => { removeBusinessExpense(btn.dataset.id); renderList(); updateCashflow(); });
      });
    }
    return totals;
  }

  function updateCashflow(){
    const horizon = +document.getElementById(`${elId}-horizon`).value;
    document.getElementById(`${elId}-horizonVal`).textContent = horizon + ' mois';
    const totals = computeBusinessExpensesTotal(getBusinessExpenses());
    const profile = getBusinessProfile();
    const snapshot = computeBusinessProfileSnapshot(profile);
    if(snapshot.ca === 0){
      document.getElementById(`${elId}-cashflow`).innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Renseigne d'abord "Mon profil entreprise" (chiffre d'affaires) pour activer la projection.</p>`;
      return;
    }
    const proj = computeBusinessCashflowProjection(snapshot, totals.opexMensuel, totals.capexTotal, horizon, profile.tresorerieActuelle);
    const chart = renderMultiLineChart([{data: proj.series, color: proj.soldeMensuel >= 0 ? 'var(--emerald)' : 'var(--bordeaux)', width: 2.5}]);
    document.getElementById(`${elId}-cashflow`).innerHTML = `
      <div class="pattern-chart">${chart}</div>
      <p style="font-size:13px;margin-top:10px;">Au rythme actuel (résultat du profil ${fmtEUR(snapshot.resultatMensuelApproximatif)}/mois − OPEX ${fmtEUR(totals.opexMensuel)}/mois = ${proj.soldeMensuel>=0?'+':''}${fmtEUR(proj.soldeMensuel)}/mois), ta trésorerie passerait de ${fmtEUR(profile.tresorerieActuelle - totals.capexTotal)} (après CAPEX) à <strong style="color:${proj.finalCash>=0?'var(--emerald)':'var(--bordeaux)'};">${fmtEUR(proj.finalCash)}</strong> dans ${horizon} mois.</p>
      <p class="disclaimer-box" style="margin-top:10px;">Hypothèse forte : ce rythme se maintient à l'identique, et le CAPEX est payé comptant intégralement dès aujourd'hui — jamais un étalement fabriqué faute de date de paiement précisée.</p>
      ${renderCourseLibraryLinks(['OPEX', 'Trésorerie', 'Cash flow', 'Immobilisation'])}`;
  }

  document.getElementById(`${elId}-add`).addEventListener('click', () => {
    const entry = saveBusinessExpense({
      nom: document.getElementById(`${elId}-nom`).value,
      montant: +document.getElementById(`${elId}-montant`).value,
      categorie: document.getElementById(`${elId}-categorie`).value
    });
    if(entry){ renderList(); updateCashflow(); }
  });
  document.getElementById(`${elId}-horizon`).addEventListener('input', updateCashflow);

  renderList();
  updateCashflow();
  document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['expenses-cashflow']);
  renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  tryAwardQuizPoints(`expenses-cashflow-${new Date().toDateString()}`, 5, {usedExpensesCashflow: true});
}

// ---------- Pricing interactif (Financial Lab, Phase 5) : curseur de prix
// testé, jamais une élasticité prix/volume inventée — seulement 2 vérités
// mécaniques : l'impact sur la marge à volume constant, et le volume qu'il
// faudrait vendre au nouveau prix pour générer la MÊME marge totale
// qu'aujourd'hui. ----------
function computePricingImpact(a){
  const prixActuel = Number(a.prixActuel) || 0;
  const coutDirect = Number(a.coutDirect) || 0;
  const volumeActuel = Number(a.volumeActuel) || 0;
  const nouveauPrix = Number(a.nouveauPrix) || 0;

  const margeActuelle = prixActuel - coutDirect;
  const margeNouvelle = nouveauPrix - coutDirect;
  const margeTotaleActuelle = margeActuelle * volumeActuel;
  const caActuel = prixActuel * volumeActuel;
  const caNouveauVolumeConstant = nouveauPrix * volumeActuel;
  const margeTotaleNouvelleVolumeConstant = margeNouvelle * volumeActuel;
  const volumeNecessairePourMemeMarge = margeNouvelle > 0 ? margeTotaleActuelle / margeNouvelle : null;

  return {
    prixActuel, coutDirect, volumeActuel, nouveauPrix,
    margeActuelle, margeNouvelle, margeTotaleActuelle, caActuel, caNouveauVolumeConstant,
    margeTotaleNouvelleVolumeConstant, volumeNecessairePourMemeMarge
  };
}
function renderPricingSimulator(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const stored = safeGetJSON('fzr-pricing-sim', {prixActuel:50, coutDirect:20, volumeActuel:100});

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} Jamais une élasticité prix/volume inventée : seulement ce que le calcul mécanique montre à volume constant, et ce qu'il faudrait vendre en plus pour compenser.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <div class="field" style="flex:1;min-width:140px;"><label for="${elId}-prixActuel">Prix de vente actuel (€)</label><input type="number" id="${elId}-prixActuel" min="0" value="${stored.prixActuel}"></div>
      <div class="field" style="flex:1;min-width:140px;"><label for="${elId}-coutDirect">Coût direct par vente (€)</label><input type="number" id="${elId}-coutDirect" min="0" value="${stored.coutDirect}"></div>
      <div class="field" style="flex:1;min-width:140px;"><label for="${elId}-volumeActuel">Volume de ventes actuel /mois</label><input type="number" id="${elId}-volumeActuel" min="0" value="${stored.volumeActuel}"></div>
    </div>
    <div class="slider-row field" style="max-width:340px;margin-top:10px;"><label for="${elId}-nouveauPrix">Prix testé <span class="v mono" id="${elId}-nouveauPrixVal"></span></label><input type="range" id="${elId}-nouveauPrix" min="1" step="1"></div>
    <div id="${elId}-results" style="margin-top:14px;"></div>
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;

  const sliderEl = document.getElementById(`${elId}-nouveauPrix`);
  function syncSliderRange(){
    const prixActuel = +document.getElementById(`${elId}-prixActuel`).value || 1;
    sliderEl.min = Math.max(1, Math.round(prixActuel * 0.5));
    sliderEl.max = Math.round(prixActuel * 1.5);
    if(!sliderEl.dataset.touched) sliderEl.value = prixActuel;
  }
  function update(){
    syncSliderRange();
    const a = {
      prixActuel: document.getElementById(`${elId}-prixActuel`).value,
      coutDirect: document.getElementById(`${elId}-coutDirect`).value,
      volumeActuel: document.getElementById(`${elId}-volumeActuel`).value,
      nouveauPrix: sliderEl.value
    };
    safeSetJSON('fzr-pricing-sim', {prixActuel: a.prixActuel, coutDirect: a.coutDirect, volumeActuel: a.volumeActuel});
    document.getElementById(`${elId}-nouveauPrixVal`).textContent = fmtEUR(+a.nouveauPrix);
    const r = computePricingImpact(a);
    const deltaMarge = r.margeTotaleNouvelleVolumeConstant - r.margeTotaleActuelle;
    document.getElementById(`${elId}-results`).innerHTML = `
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
        <div class="card"><span class="smallcaps">Marge par vente (actuelle → testée)</span><div class="result-big" style="font-size:17px;margin-top:6px;">${fmtEUR(r.margeActuelle)} → ${fmtEUR(r.margeNouvelle)}</div></div>
        <div class="card"><span class="smallcaps">Marge totale à volume constant</span><div class="result-big" style="font-size:17px;margin-top:6px;color:${deltaMarge>=0?'var(--emerald)':'var(--bordeaux)'};">${deltaMarge>=0?'+':''}${fmtEUR(deltaMarge)}</div></div>
        <div class="card"><span class="smallcaps">Volume nécessaire pour la même marge totale</span><div class="result-big" style="font-size:17px;margin-top:6px;">${r.volumeNecessairePourMemeMarge===null?'Jamais (marge nulle ou négative)':Math.ceil(r.volumeNecessairePourMemeMarge)+'/mois'}</div></div>
      </div>
      <p class="disclaimer-box" style="margin-top:12px;">Ce calcul ne modélise jamais comment le volume réagirait réellement à un changement de prix (élasticité) — seulement l'arithmétique mécanique à volume supposé constant, ou le volume qu'il faudrait atteindre pour compenser.</p>
      ${renderCourseLibraryLinks(['Pricing', 'Stratégie de prix'])}`;
    document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['pricing']);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  }
  ['prixActuel','coutDirect','volumeActuel'].forEach(key => {
    document.getElementById(`${elId}-${key}`).addEventListener('input', update);
  });
  sliderEl.addEventListener('input', () => { sliderEl.dataset.touched = '1'; update(); });
  update();
  tryAwardQuizPoints(`pricing-sim-${new Date().toDateString()}`, 5, {usedPricingSim: true});
}

// ---------- Sales funnel interactif (Financial Lab, Phase 5) : conversion
// étage par étage, jamais un taux de conversion moyen "du marché" inventé —
// uniquement les taux que l'utilisateur saisit lui-même. ----------
function computeSalesFunnel(a){
  const visiteurs = Number(a.visiteurs) || 0;
  const tauxLead = Number(a.tauxLead) || 0;
  const tauxProspect = Number(a.tauxProspect) || 0;
  const tauxClient = Number(a.tauxClient) || 0;
  const budgetMarketing = Number(a.budgetMarketing) || 0;

  const leads = visiteurs * (tauxLead / 100);
  const prospects = leads * (tauxProspect / 100);
  const clients = prospects * (tauxClient / 100);
  const tauxConversionGlobal = visiteurs > 0 ? (clients / visiteurs) * 100 : null;
  const cac = (budgetMarketing > 0 && clients > 0) ? budgetMarketing / clients : null;

  return {visiteurs, leads, prospects, clients, tauxConversionGlobal, cac};
}
function renderSalesFunnel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const stored = safeGetJSON('fzr-sales-funnel', {visiteurs:5000, tauxLead:10, tauxProspect:30, tauxClient:20, budgetMarketing:2000});

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} Jamais un taux de conversion "moyen du marché" — uniquement tes propres taux, étage par étage.</p>
    <div class="card-grid" style="margin-bottom:16px;">
      <div class="field"><label for="${elId}-visiteurs">Visiteurs / mois</label><input type="number" id="${elId}-visiteurs" min="0" value="${stored.visiteurs}"></div>
      <div class="field"><label for="${elId}-tauxLead">Visiteur → Lead (%)</label><input type="number" id="${elId}-tauxLead" min="0" max="100" value="${stored.tauxLead}"></div>
      <div class="field"><label for="${elId}-tauxProspect">Lead → Prospect qualifié (%)</label><input type="number" id="${elId}-tauxProspect" min="0" max="100" value="${stored.tauxProspect}"></div>
      <div class="field"><label for="${elId}-tauxClient">Prospect → Client (%)</label><input type="number" id="${elId}-tauxClient" min="0" max="100" value="${stored.tauxClient}"></div>
      <div class="field"><label for="${elId}-budgetMarketing">Budget marketing mensuel (€, optionnel)</label><input type="number" id="${elId}-budgetMarketing" min="0" value="${stored.budgetMarketing}"></div>
    </div>
    <div id="${elId}-results"></div>
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;

  function update(){
    const a = {
      visiteurs: document.getElementById(`${elId}-visiteurs`).value,
      tauxLead: document.getElementById(`${elId}-tauxLead`).value,
      tauxProspect: document.getElementById(`${elId}-tauxProspect`).value,
      tauxClient: document.getElementById(`${elId}-tauxClient`).value,
      budgetMarketing: document.getElementById(`${elId}-budgetMarketing`).value
    };
    safeSetJSON('fzr-sales-funnel', a);
    const r = computeSalesFunnel(a);
    const maxVal = Math.max(r.visiteurs, 1);
    const stages = [
      {label: 'Visiteurs', value: r.visiteurs},
      {label: 'Leads', value: r.leads},
      {label: 'Prospects qualifiés', value: r.prospects},
      {label: 'Clients', value: r.clients}
    ];
    document.getElementById(`${elId}-results`).innerHTML = `
      <div class="card">
        <span class="smallcaps">Ton entonnoir</span>
        ${stages.map(s => `
          <div style="margin-top:10px;">
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:3px;"><span>${s.label}</span><span class="mono">${Math.round(s.value).toLocaleString('fr-FR')}</span></div>
            <div style="background:var(--bg);border-radius:2px;height:10px;overflow:hidden;"><div style="background:var(--gold-bright);height:100%;width:${(s.value/maxVal*100).toFixed(1)}%;"></div></div>
          </div>`).join('')}
        <div class="result-row" style="justify-content:space-between;margin-top:14px;padding-top:10px;border-top:1px solid var(--hairline);"><span>Taux de conversion global</span><span class="mono">${r.tauxConversionGlobal===null?'—':r.tauxConversionGlobal.toFixed(2)+' %'}</span></div>
        <div class="result-row" style="justify-content:space-between;"><span>CAC implicite (budget ÷ clients)</span><span class="mono">${r.cac===null?'—':fmtEUR(r.cac)}</span></div>
      </div>
      <span class="smallcaps" style="display:block;margin:14px 0 8px;">Où agir en priorité ? +20% sur un seul taux, toutes choses égales par ailleurs</span>
      <div class="card-grid">
        <div class="card"><h4>Visiteur → Lead +20%</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Clients : <strong class="mono">${Math.round(computeSalesFunnel({...a, tauxLead: a.tauxLead*1.2}).clients)}</strong> (${Math.round(computeSalesFunnel({...a, tauxLead: a.tauxLead*1.2}).clients - r.clients)>=0?'+':''}${Math.round(computeSalesFunnel({...a, tauxLead: a.tauxLead*1.2}).clients - r.clients)})</p></div>
        <div class="card"><h4>Lead → Prospect +20%</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Clients : <strong class="mono">${Math.round(computeSalesFunnel({...a, tauxProspect: a.tauxProspect*1.2}).clients)}</strong> (${Math.round(computeSalesFunnel({...a, tauxProspect: a.tauxProspect*1.2}).clients - r.clients)>=0?'+':''}${Math.round(computeSalesFunnel({...a, tauxProspect: a.tauxProspect*1.2}).clients - r.clients)})</p></div>
        <div class="card"><h4>Prospect → Client +20%</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Clients : <strong class="mono">${Math.round(computeSalesFunnel({...a, tauxClient: a.tauxClient*1.2}).clients)}</strong> (${Math.round(computeSalesFunnel({...a, tauxClient: a.tauxClient*1.2}).clients - r.clients)>=0?'+':''}${Math.round(computeSalesFunnel({...a, tauxClient: a.tauxClient*1.2}).clients - r.clients)})</p></div>
      </div>
      <p class="disclaimer-box" style="margin-top:10px;">Suppose des taux de conversion constants à chaque étage, indépendamment du volume — en réalité, un volume de visiteurs plus élevé peut attirer un trafic moins qualifié et faire baisser ces taux. La comparaison "où agir en priorité" applique le même +20% relatif à chaque étage pour rester comparable, mais un effort marketing réel ne coûte pas forcément le même prix selon l'étage visé.</p>
      ${renderCourseLibraryLinks(['Pipeline commercial', 'Qualification', 'Taux de conversion'])}`;
    document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['sales-funnel']);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  }
  ['visiteurs','tauxLead','tauxProspect','tauxClient','budgetMarketing'].forEach(key => {
    document.getElementById(`${elId}-${key}`).addEventListener('input', update);
  });
  update();
  tryAwardQuizPoints(`sales-funnel-${new Date().toDateString()}`, 5, {usedSalesFunnel: true});
}

// ---------- Scénarios & stress-test (Financial Lab, Phase 6) : applique un
// choc au profil entreprise (jamais au profil lui-même — un calcul à côté,
// jamais une écriture dans fzr-business-profile) et compare plusieurs
// scénarios sauvegardés. Seuls les DELTAS sont persistés (fzr-business-scenarios),
// jamais un résultat figé : la comparaison recalcule toujours contre le
// profil ACTUEL (§71, source de vérité unique) — un scénario sauvegardé la
// semaine dernière reflète honnêtement l'impact sur la situation d'aujourd'hui,
// pas une photo obsolète. ----------
const BUSINESS_SCENARIOS_KEY = 'fzr-business-scenarios';
const BUSINESS_SCENARIO_PRESETS = {
  optimiste: {label: 'Optimiste', caDeltaPct: 15, coutsDeltaPct: -5, perteClients: 0},
  pessimiste: {label: 'Pessimiste', caDeltaPct: -15, coutsDeltaPct: 10, perteClients: 0},
  stress: {label: 'Choc sévère', caDeltaPct: -30, coutsDeltaPct: 20, perteClients: 1}
};
function computeBusinessScenario(profile, caDeltaPct, coutsDeltaPct, perteClients){
  const p = profile || getBusinessProfile();
  const base = computeBusinessProfileSnapshot(p);
  const caParClient = base.caParClient || 0;
  const caAjuste = Math.max(0, base.ca * (1 + (Number(caDeltaPct) || 0) / 100) - (Number(perteClients) || 0) * caParClient);
  const caMensuelAjuste = caAjuste / 12;
  const coutsVariablesMensuelsAjustes = caMensuelAjuste * (p.coutsVariablesPct / 100);
  const margeSurCoutsVariablesAjustee = caMensuelAjuste - coutsVariablesMensuelsAjustes;
  const chargesMensuellesTotalesAjustees = base.chargesMensuellesTotales * (1 + (Number(coutsDeltaPct) || 0) / 100);
  const resultatMensuelAjuste = margeSurCoutsVariablesAjustee - chargesMensuellesTotalesAjustees;
  return {
    caAjuste, caMensuelAjuste, coutsVariablesMensuelsAjustes, margeSurCoutsVariablesAjustee,
    chargesMensuellesTotalesAjustees, resultatMensuelAjuste, resultatAnnuelAjuste: resultatMensuelAjuste * 12
  };
}
function getBusinessScenarios(){
  try {
    const raw = JSON.parse(localStorage.getItem(BUSINESS_SCENARIOS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function saveBusinessScenarioEntry(scenario){
  if(!scenario || typeof scenario.nom !== 'string' || !scenario.nom.trim()) return null;
  if(typeof scenario.caDeltaPct !== 'number' || typeof scenario.coutsDeltaPct !== 'number' || !(scenario.perteClients >= 0)) return null;
  const list = getBusinessScenarios();
  const entry = {
    id: 'scenario-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    nom: scenario.nom.trim().slice(0, 60), caDeltaPct: scenario.caDeltaPct, coutsDeltaPct: scenario.coutsDeltaPct, perteClients: scenario.perteClients,
    dateAjout: new Date().toISOString()
  };
  list.push(entry);
  localStorage.setItem(BUSINESS_SCENARIOS_KEY, JSON.stringify(list));
  return entry;
}
function removeBusinessScenarioEntry(id){
  const list = getBusinessScenarios().filter(s => s.id !== id);
  localStorage.setItem(BUSINESS_SCENARIOS_KEY, JSON.stringify(list));
}
function renderBusinessScenarios(elId){
  const el = document.getElementById(elId);
  if(!el) return;

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('scenario')} Un choc appliqué à "Mon profil entreprise", jamais écrit dedans — pour explorer sans risque de casser tes vraies hypothèses.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
      <button type="button" class="btn btn-sm" data-preset="optimiste">🟢 Optimiste</button>
      <button type="button" class="btn btn-sm" data-preset="pessimiste">🟠 Pessimiste</button>
      <button type="button" class="btn btn-sm" data-preset="stress">🔴 Choc sévère</button>
    </div>
    <div class="slider-row field" style="max-width:320px;"><label for="${elId}-caDelta">Variation du CA <span class="v mono" id="${elId}-caDeltaVal">0 %</span></label><input type="range" id="${elId}-caDelta" min="-50" max="50" step="1" value="0"></div>
    <div class="slider-row field" style="max-width:320px;"><label for="${elId}-coutsDelta">Variation des charges <span class="v mono" id="${elId}-coutsDeltaVal">0 %</span></label><input type="range" id="${elId}-coutsDelta" min="-30" max="50" step="1" value="0"></div>
    <div class="field" style="max-width:220px;"><label for="${elId}-perteClients">Clients perdus (nombre)</label><input type="number" id="${elId}-perteClients" min="0" value="0"></div>
    <div id="${elId}-results" style="margin-top:14px;"></div>
    <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-top:14px;">
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-scenarioNom">Nom du scénario</label><input type="text" id="${elId}-scenarioNom" placeholder="Ex. Grosse commande annulée"></div>
      <button type="button" class="btn btn-sm btn-gold" id="${elId}-scenarioSave">💾 Sauvegarder ce scénario</button>
    </div>
    <div id="${elId}-comparatif" style="margin-top:18px;"></div>
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;

  function currentDeltas(){
    return {
      caDeltaPct: +document.getElementById(`${elId}-caDelta`).value,
      coutsDeltaPct: +document.getElementById(`${elId}-coutsDelta`).value,
      perteClients: +document.getElementById(`${elId}-perteClients`).value
    };
  }
  function renderComparatif(){
    const scenarios = getBusinessScenarios();
    const profile = getBusinessProfile();
    if(scenarios.length === 0){
      document.getElementById(`${elId}-comparatif`).innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Aucun scénario sauvegardé pour l'instant.</p>`;
      return;
    }
    document.getElementById(`${elId}-comparatif`).innerHTML = `
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Scénarios sauvegardés (recalculés contre ton profil actuel)</span>
      <div style="overflow-x:auto;"><table style="width:100%;font-size:12.5px;border-collapse:collapse;min-width:420px;">
        <thead><tr style="color:var(--text-dim);text-align:left;"><th style="padding:6px 0;">Scénario</th><th>CA</th><th>Charges</th><th>Clients perdus</th><th>Résultat mensuel</th><th></th></tr></thead>
        <tbody>${scenarios.map(s => {
          const r = computeBusinessScenario(profile, s.caDeltaPct, s.coutsDeltaPct, s.perteClients);
          return `<tr style="border-top:1px solid var(--hairline);">
            <td style="padding:6px 0;">${s.nom}</td>
            <td class="mono">${s.caDeltaPct>=0?'+':''}${s.caDeltaPct}%</td>
            <td class="mono">${s.coutsDeltaPct>=0?'+':''}${s.coutsDeltaPct}%</td>
            <td class="mono">${s.perteClients}</td>
            <td class="mono" style="color:${r.resultatMensuelAjuste>=0?'var(--emerald)':'var(--bordeaux)'};">${r.resultatMensuelAjuste>=0?'+':''}${fmtEUR(r.resultatMensuelAjuste)}</td>
            <td><button type="button" class="btn btn-sm scenario-remove" data-id="${s.id}" aria-label="Supprimer">✕</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    document.querySelectorAll(`#${elId}-comparatif .scenario-remove`).forEach(btn => {
      btn.addEventListener('click', () => { removeBusinessScenarioEntry(btn.dataset.id); renderComparatif(); });
    });
  }
  function update(){
    document.getElementById(`${elId}-caDeltaVal`).textContent = (+document.getElementById(`${elId}-caDelta`).value >= 0 ? '+' : '') + document.getElementById(`${elId}-caDelta`).value + ' %';
    document.getElementById(`${elId}-coutsDeltaVal`).textContent = (+document.getElementById(`${elId}-coutsDelta`).value >= 0 ? '+' : '') + document.getElementById(`${elId}-coutsDelta`).value + ' %';
    const deltas = currentDeltas();
    const profile = getBusinessProfile();
    const base = computeBusinessProfileSnapshot(profile);
    const scenario = computeBusinessScenario(profile, deltas.caDeltaPct, deltas.coutsDeltaPct, deltas.perteClients);
    document.getElementById(`${elId}-results`).innerHTML = `
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
        <div class="card"><span class="smallcaps">Résultat mensuel actuel</span><div class="result-big" style="font-size:18px;margin-top:6px;color:${base.resultatMensuelApproximatif>=0?'var(--emerald)':'var(--bordeaux)'};">${base.resultatMensuelApproximatif>=0?'+':''}${fmtEUR(base.resultatMensuelApproximatif)}</div></div>
        <div class="card"><span class="smallcaps">Résultat mensuel dans ce scénario</span><div class="result-big" style="font-size:18px;margin-top:6px;color:${scenario.resultatMensuelAjuste>=0?'var(--emerald)':'var(--bordeaux)'};">${scenario.resultatMensuelAjuste>=0?'+':''}${fmtEUR(scenario.resultatMensuelAjuste)}</div></div>
        <div class="card"><span class="smallcaps">Écart</span><div class="result-big" style="font-size:18px;margin-top:6px;">${fmtEUR(scenario.resultatMensuelAjuste - base.resultatMensuelApproximatif)}</div></div>
      </div>
      <p class="disclaimer-box" style="margin-top:10px;">Scénario appliqué à côté du profil, jamais écrit dedans. Les 3 préréglages (+15/−5, −15/+10, −30/+20) sont des illustrations documentées, jamais une prévision réelle de ton marché.</p>
      ${renderCourseLibraryLinks(['Compte de résultat', 'Résultat net'])}
      ${renderRelatedCourseLink('lire-une-entreprise', 'Le compte de résultat : du chiffre d\'affaires au résultat net')}`;
    document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['scenarios']);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  }
  el.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = BUSINESS_SCENARIO_PRESETS[btn.dataset.preset];
      document.getElementById(`${elId}-caDelta`).value = preset.caDeltaPct;
      document.getElementById(`${elId}-coutsDelta`).value = preset.coutsDeltaPct;
      document.getElementById(`${elId}-perteClients`).value = preset.perteClients;
      document.getElementById(`${elId}-scenarioNom`).value = preset.label;
      update();
    });
  });
  ['caDelta','coutsDelta','perteClients'].forEach(key => {
    document.getElementById(`${elId}-${key}`).addEventListener('input', update);
  });
  document.getElementById(`${elId}-scenarioSave`).addEventListener('click', () => {
    const deltas = currentDeltas();
    const entry = saveBusinessScenarioEntry({nom: document.getElementById(`${elId}-scenarioNom`).value, ...deltas});
    if(entry) renderComparatif();
  });

  update();
  renderComparatif();
  tryAwardQuizPoints(`business-scenarios-${new Date().toDateString()}`, 5, {usedBusinessScenarios: true});
}

// ---------- Runway (Financial Lab, Phase 6) : trésorerie ÷ burn mensuel —
// jamais un chiffre fabriqué quand l'entreprise est déjà profitable (pas de
// burn, runway non applicable plutôt qu'une valeur infinie affichée). ----------
function computeRunway(profile){
  const p = profile || getBusinessProfile();
  const snapshot = computeBusinessProfileSnapshot(p);
  const burnMensuel = snapshot.resultatMensuelApproximatif < 0 ? -snapshot.resultatMensuelApproximatif : 0;
  const runwayMois = burnMensuel > 0 ? p.tresorerieActuelle / burnMensuel : null;
  return {burnMensuel, runwayMois, tresorerieActuelle: p.tresorerieActuelle, resultatMensuel: snapshot.resultatMensuelApproximatif};
}
function renderRunwaySimulator(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const r = computeRunway();
  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} Calculé à partir de "Mon profil entreprise" (trésorerie actuelle et résultat mensuel) — modifie ton profil pour changer ce calcul de base.</p>
    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
      <div class="card"><span class="smallcaps">Trésorerie actuelle</span><div class="result-big" style="font-size:19px;margin-top:6px;">${fmtEUR(r.tresorerieActuelle)}</div></div>
      <div class="card"><span class="smallcaps">Burn mensuel</span><div class="result-big" style="font-size:19px;margin-top:6px;color:${r.burnMensuel>0?'var(--bordeaux)':'var(--emerald)'};">${r.burnMensuel>0?fmtEUR(r.burnMensuel):'Aucun'}</div></div>
      <div class="card"><span class="smallcaps">Runway</span><div class="result-big" style="font-size:19px;margin-top:6px;">${r.runwayMois===null?'Profitable, non applicable':r.runwayMois.toFixed(1)+' mois'}</div></div>
    </div>
    <p class="disclaimer-box" style="margin-top:12px;">Le burn mensuel est déduit du résultat approximatif du profil entreprise — jamais un vrai suivi de trésorerie mois par mois (encaissements/décaissements réels, délais de paiement clients/fournisseurs non modélisés).</p>
    ${r.burnMensuel > 0 ? `
    <span class="smallcaps" style="display:block;margin:16px 0 8px;">Et si... (simulation, jamais écrite dans ton profil)</span>
    <div class="slider-row field" style="max-width:320px;"><label for="${elId}-levee">Levée de fonds simulée <span class="v mono" id="${elId}-leveeVal">0 €</span></label><input type="range" id="${elId}-levee" min="0" max="200000" step="5000" value="0"></div>
    <div class="slider-row field" style="max-width:320px;"><label for="${elId}-burnDelta">Variation du burn mensuel <span class="v mono" id="${elId}-burnDeltaVal">0 %</span></label><input type="range" id="${elId}-burnDelta" min="-50" max="50" step="5" value="0"></div>
    <div id="${elId}-simResult" style="margin-top:10px;"></div>` : ''}
    ${renderCourseLibraryLinks(['Burn rate'])}
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;
  document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['runway']);
  renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  tryAwardQuizPoints(`runway-${new Date().toDateString()}`, 5, {usedRunway: true});

  if(r.burnMensuel > 0){
    function updateSim(){
      const levee = +document.getElementById(`${elId}-levee`).value;
      const burnDeltaPct = +document.getElementById(`${elId}-burnDelta`).value;
      document.getElementById(`${elId}-leveeVal`).textContent = fmtEUR(levee);
      document.getElementById(`${elId}-burnDeltaVal`).textContent = (burnDeltaPct>=0?'+':'') + burnDeltaPct + ' %';
      const nouveauBurn = r.burnMensuel * (1 + burnDeltaPct / 100);
      const nouveauRunway = nouveauBurn > 0 ? (r.tresorerieActuelle + levee) / nouveauBurn : null;
      document.getElementById(`${elId}-simResult`).innerHTML = `
        <p style="font-size:13px;">Nouveau runway : <strong class="mono" style="color:var(--gold-bright);">${nouveauRunway===null?'Profitable':nouveauRunway.toFixed(1)+' mois'}</strong> (contre ${r.runwayMois.toFixed(1)} mois aujourd'hui)</p>`;
    }
    ['levee','burnDelta'].forEach(key => document.getElementById(`${elId}-${key}`).addEventListener('input', updateSim));
    updateSim();
  }
}

// ---------- Valorisation par multiples (Financial Lab, Phase 6) : de vrais
// calculateurs (EV = EBITDA × multiple ; valorisation = résultat net × PER),
// jamais juste des définitions — l'EBITDA et le résultat net restent des
// saisies manuelles, le profil entreprise ne calculant jamais de vraie
// EBITDA (amortissements/impôts non modélisés, voir sa méthodologie). ----------
function computeValorisationMultiples(a){
  const ebitda = Number(a.ebitda) || 0;
  const multipleEV = Number(a.multipleEV) || 0;
  const resultatNet = Number(a.resultatNet) || 0;
  const per = Number(a.per) || 0;
  return {ebitda, multipleEV, ev: ebitda * multipleEV, resultatNet, per, valorisationPER: resultatNet * per};
}
function renderValorisationSimulator(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const stored = safeGetJSON('fzr-valorisation-sim', {ebitda:50000, multipleEV:6, resultatNet:35000, per:12});

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} L'EBITDA et le résultat net sont à saisir toi-même — le profil entreprise ne calcule jamais une vraie EBITDA (amortissements et impôts non modélisés).</p>
    <span class="smallcaps" style="display:block;margin-bottom:8px;">EV / EBITDA</span>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-ebitda">EBITDA annuel (€)</label><input type="number" id="${elId}-ebitda" min="0" value="${stored.ebitda}"></div>
      <div class="field" style="flex:1;min-width:140px;"><label for="${elId}-multipleEV">Multiple EV/EBITDA (×)</label><input type="number" id="${elId}-multipleEV" min="0" step="0.5" value="${stored.multipleEV}"></div>
    </div>
    <span class="smallcaps" style="display:block;margin-bottom:8px;">Valorisation par PER</span>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-resultatNet">Résultat net annuel (€)</label><input type="number" id="${elId}-resultatNet" min="0" value="${stored.resultatNet}"></div>
      <div class="field" style="flex:1;min-width:140px;"><label for="${elId}-per">PER (×)</label><input type="number" id="${elId}-per" min="0" step="0.5" value="${stored.per}"></div>
    </div>
    <div id="${elId}-results" style="margin-top:16px;"></div>
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;

  function update(){
    const a = {
      ebitda: document.getElementById(`${elId}-ebitda`).value,
      multipleEV: document.getElementById(`${elId}-multipleEV`).value,
      resultatNet: document.getElementById(`${elId}-resultatNet`).value,
      per: document.getElementById(`${elId}-per`).value
    };
    safeSetJSON('fzr-valorisation-sim', a);
    const r = computeValorisationMultiples(a);
    document.getElementById(`${elId}-results`).innerHTML = `
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        <div class="card"><span class="smallcaps">Valorisation par EV/EBITDA</span><div class="result-big" style="font-size:19px;margin-top:6px;">${fmtEUR(r.ev)}</div><p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">${fmtEUR(r.ebitda)} × ${r.multipleEV}</p></div>
        <div class="card"><span class="smallcaps">Valorisation par PER</span><div class="result-big" style="font-size:19px;margin-top:6px;">${fmtEUR(r.valorisationPER)}</div><p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">${fmtEUR(r.resultatNet)} × ${r.per}</p></div>
      </div>
      <p class="disclaimer-box" style="margin-top:12px;">Le multiple approprié varie énormément selon le secteur, la taille et la croissance de l'entreprise — jamais un multiple universel. Ces 2 méthodes donnent souvent des résultats différents pour la même entreprise : la valorisation réelle d'une transaction dépend de bien plus que ce calcul (négociation, due diligence, actifs et passifs hors bilan...).</p>
      ${renderCourseLibraryLinks(['Multiple de valorisation (EV/EBITDA)', 'Valorisation', 'EBITDA', 'PER (Price Earning Ratio)'])}
      ${renderRelatedCourseLink('ma-private-equity', null)}`;
    document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['valorisation']);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
  }
  ['ebitda','multipleEV','resultatNet','per'].forEach(key => {
    document.getElementById(`${elId}-${key}`).addEventListener('input', update);
  });
  update();
  tryAwardQuizPoints(`valorisation-sim-${new Date().toDateString()}`, 5, {usedValorisationSim: true});
}

// ---------- "Analyser ma situation" — check-up automatique côté
// Professionnel (Financial Lab, Phase 7, équivalent business du diagnostic
// automatique du Tableau de bord personnel — computeFinancialDiagnostics).
// Chaque règle ne s'active que si la donnée existe réellement (profil
// entreprise renseigné, éventuellement Unit Economics), et chaque message
// cite le chiffre réel — jamais un jugement seul. ----------
function computeBusinessDiagnostics(ctx){
  const diagnostics = [];
  const snapshot = ctx && ctx.snapshot;
  const runway = ctx && ctx.runway;
  const unitEconomics = ctx && ctx.unitEconomics;

  if(snapshot && snapshot.ca > 0){
    if(snapshot.resultatMensuelApproximatif < 0){
      diagnostics.push({id:'resultat-negatif', niveau:'alerte', message:`Ton activité est déficitaire de ${fmtEUR(-snapshot.resultatMensuelApproximatif)}/mois au rythme actuel.`});
    } else {
      const margeNettePct = (snapshot.resultatMensuelApproximatif / snapshot.caMensuel) * 100;
      if(margeNettePct < 10){
        diagnostics.push({id:'marge-nette-faible', niveau:'attention', message:`Ta marge nette est de ${margeNettePct.toFixed(0)} % du chiffre d'affaires — un coussin de sécurité réduit face à un imprévu.`});
      } else {
        diagnostics.push({id:'marge-nette-ok', niveau:'ok', message:`Ta marge nette est de ${margeNettePct.toFixed(0)} % du chiffre d'affaires.`});
      }
    }
  }

  if(runway && runway.burnMensuel > 0){
    if(runway.runwayMois < 6){
      diagnostics.push({id:'runway-court', niveau:'alerte', message:`Ta trésorerie ne couvre que ${runway.runwayMois.toFixed(1)} mois de burn au rythme actuel — sous le repère usuel de 6 mois.`});
    } else if(runway.runwayMois < 12){
      diagnostics.push({id:'runway-moyen', niveau:'attention', message:`Ta trésorerie couvre ${runway.runwayMois.toFixed(1)} mois de burn au rythme actuel.`});
    } else {
      diagnostics.push({id:'runway-ok', niveau:'ok', message:`Ta trésorerie couvre ${runway.runwayMois.toFixed(1)} mois de burn au rythme actuel.`});
    }
  }

  if(unitEconomics && unitEconomics.ratioLtvCac !== null){
    if(unitEconomics.ratioLtvCac < 1){
      diagnostics.push({id:'ltv-cac-faible', niveau:'alerte', message:`Ton ratio LTV/CAC (Unit Economics) est de ${unitEconomics.ratioLtvCac.toFixed(1)}× — chaque client acquis coûte plus cher qu'il ne rapporte.`});
    } else if(unitEconomics.ratioLtvCac < 3){
      diagnostics.push({id:'ltv-cac-moyen', niveau:'attention', message:`Ton ratio LTV/CAC (Unit Economics) est de ${unitEconomics.ratioLtvCac.toFixed(1)}× — sous le repère usuel de 3× souvent cité.`});
    } else {
      diagnostics.push({id:'ltv-cac-ok', niveau:'ok', message:`Ton ratio LTV/CAC (Unit Economics) est de ${unitEconomics.ratioLtvCac.toFixed(1)}×.`});
    }
  }

  return diagnostics;
}
function renderBusinessDiagnostics(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const profile = getBusinessProfile();
  const snapshot = computeBusinessProfileSnapshot(profile);
  const runway = computeRunway(profile);
  const unitEconomics = safeGetJSON('fzr-unit-economics', null) ? computeUnitEconomics(safeGetJSON('fzr-unit-economics', {})) : null;

  if(snapshot.ca === 0){
    el.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Renseigne d'abord "Mon profil entreprise" ci-dessus pour activer le check-up automatique.</p>`;
    return;
  }

  const diagnostics = computeBusinessDiagnostics({snapshot, runway, unitEconomics});
  const emoji = {ok:'🟢', attention:'🟠', alerte:'🔴'};
  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:10px;">${renderDataBadge('calcul')} Jamais un jugement : chaque ligne cite le chiffre réel qui la justifie, calculé à partir de "Mon profil entreprise"${runway.burnMensuel>0?', du Runway':''}${unitEconomics?' et de Unit Economics':''}.</p>
    ${diagnostics.map(d => `<p style="font-size:13px;margin-top:8px;">${emoji[d.niveau]} ${d.message}</p>`).join('')}
    ${!unitEconomics ? `<p style="font-size:12px;color:var(--text-dim);margin-top:10px;">Remplis aussi Unit Economics pour enrichir ce check-up avec ton ratio LTV/CAC.</p>` : ''}
    ${renderCourseLibraryLinks(['Marge nette', 'Trésorerie'])}
    ${renderRelatedCourseLink('entreprise-essentiels', 'De la vente au bénéfice : la marge nette')}
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;
  renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
}

// 30 secondes / 2 minutes / Approfondir — réutilise les champs déjà existants
// de LIBRARY (simple/detail), zéro contenu dupliqué. "Approfondir" pointe
// vers la fiche complète de la Bibliothèque (exemple, avantages, erreurs...).
function renderConceptLevels(elId, termeName){
  const el = document.getElementById(elId);
  if(!el) return;
  const item = LIBRARY.find(l => l.terme === termeName);
  if(!item){ el.style.display = 'none'; return; }
  let mode = 'simple';

  function update(){
    document.getElementById(`${elId}-text`).textContent = mode === 'detail' ? item.detail : item.simple;
    el.querySelectorAll('.business-level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === mode));
  }

  el.innerHTML = `
    <span class="smallcaps">${item.terme}</span>
    <div class="business-level-toggle">
      <button class="business-level-btn active" data-level="simple" type="button">30 secondes</button>
      <button class="business-level-btn" data-level="detail" type="button">2 minutes</button>
    </div>
    <p id="${elId}-text" class="business-level-text"></p>
    <a href="bibliotheque.html#${encodeURIComponent(item.terme.replace(/\s+/g,'-'))}" class="btn btn-sm" style="margin-top:10px;">Approfondir →</a>`;

  el.querySelectorAll('.business-level-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{ mode = btn.dataset.level; update(); });
  });
  update();
}

// Widget thématique générique (Immobilier / Marketing / Clients sur business.html) :
// une grille de notions réelles de LIBRARY (aucune donnée inventée), chacune reliant
// directement vers sa fiche complète dans la Bibliothèque.
function renderTopicWidget(elId, {title, intro, terms, ctaLabel, ctaHref}){
  const el = document.getElementById(elId);
  if(!el) return;
  const items = terms.map(t => LIBRARY.find(l => l.terme === t)).filter(Boolean);
  el.innerHTML = `
    <span class="smallcaps">${title}</span>
    <p class="topic-widget-intro">${intro}</p>
    <div class="topic-widget-grid">
      ${items.map(l => `
        <a href="bibliotheque.html#${encodeURIComponent(l.terme.replace(/\s+/g,'-'))}" class="topic-widget-chip">
          <span class="topic-widget-chip-term">${l.terme}</span>
          <span class="topic-widget-chip-def">${l.simple}</span>
        </a>`).join('')}
    </div>
    ${ctaHref ? `<a href="${ctaHref}" class="btn btn-sm btn-gold" style="margin-top:14px;">${ctaLabel}</a>` : ''}`;
}

// ---------- Ton profil business (business.html) ----------
// Agrège l'historique réel du Business Game (fzr-business-game-history,
// voir scripts/games/business-game.js) : ne conclut jamais sur une seule
// partie, affiche uniquement des chiffres réellement enregistrés, et ne
// prétend jamais diagnostiquer une vraie personnalité — toujours cadré
// comme "dans tes décisions sur Likanza", jamais au-delà.
function renderBusinessProfile(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  if(typeof getBusinessGameHistory !== 'function'){ el.style.display = 'none'; return; }
  const history = getBusinessGameHistory();

  if(history.length < 2){
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;">Ton profil business se construit à partir de tes vraies parties du Business Game — il faut au moins 2 parties jouées pour dégager une tendance fiable (${history.length} partie${history.length>1?'s':''} enregistrée${history.length>1?'s':''} pour l'instant).</p>
      <a href="jeu-business.html" class="btn btn-sm btn-gold" style="margin-top:10px;">🎮 Jouer une partie</a>`;
    return;
  }

  const outcomeCounts = {};
  history.forEach(h => { outcomeCounts[h.outcome] = (outcomeCounts[h.outcome]||0) + 1; });
  const mostCommonOutcome = Object.entries(outcomeCounts).sort((a,b)=>b[1]-a[1])[0];
  const sectorCounts = {};
  history.forEach(h => { sectorCounts[h.sectorKey] = (sectorCounts[h.sectorKey]||0) + 1; });
  const mostPlayedSector = Object.entries(sectorCounts).sort((a,b)=>b[1]-a[1])[0];
  const bankruptcyRate = history.filter(h=>h.outcome==='faillite').length / history.length;
  const avgDecisions = Math.round(history.reduce((s,h)=>s+(h.decisionCount||0),0) / history.length);

  const sectorLabel = (typeof BUSINESS_SECTORS !== 'undefined' && BUSINESS_SECTORS[mostPlayedSector[0]]) ? BUSINESS_SECTORS[mostPlayedSector[0]].label : mostPlayedSector[0];
  const outcomeMeta = (typeof BUSINESS_GAME_OUTCOME_META !== 'undefined') ? BUSINESS_GAME_OUTCOME_META[mostCommonOutcome[0]] : null;
  const outcomeLabel = outcomeMeta ? `${outcomeMeta.emoji} ${outcomeMeta.label}` : mostCommonOutcome[0];

  // Recommandations reliées à du vrai contenu existant, jamais un texte inventé
  // pour l'occasion — construites à partir des vrais chiffres ci-dessus.
  const recommendations = [];
  if(bankruptcyRate >= 0.5){
    recommendations.push({title:'Burn rate', desc:"Plus de la moitié de tes parties se sont terminées en faillite — cette notion explique comment surveiller ta vitesse de dépense de trésorerie.", href:'bibliotheque.html#Burn-rate'});
  }
  if(avgDecisions > 0 && avgDecisions < 6){
    recommendations.push({title:'Business Strategy', desc:"Tes parties se terminent souvent tôt — l'outil d'analyse de projet peut t'aider à préparer un budget et une stratégie avant de rejouer.", href:'construire-son-projet.html'});
  }
  recommendations.push({title:'Business Cases', desc:"Continue à t'entraîner sur des mises en situation courtes dans le Business Lab.", href:'business-lab.html'});

  el.innerHTML = `
    <p style="font-size:13px;color:var(--text-dim);margin-bottom:12px;">Basé sur tes ${history.length} dernières parties du Business Game — jamais sur une seule partie isolée.</p>
    <div class="card-grid" style="margin-bottom:14px;">
      <div class="card"><span class="smallcaps">Secteur le plus joué</span><div class="result-big" style="font-size:18px;margin-top:4px;">${sectorLabel}</div></div>
      <div class="card"><span class="smallcaps">Résultat le plus fréquent</span><div class="result-big" style="font-size:18px;margin-top:4px;">${outcomeLabel}</div></div>
      <div class="card"><span class="smallcaps">Taux de faillite</span><div class="result-big" style="font-size:18px;margin-top:4px;">${Math.round(bankruptcyRate*100)}%</div></div>
    </div>
    <p style="font-size:13px;line-height:1.6;margin-bottom:14px;">Dans tes décisions sur Likanza, tu as le plus souvent joué en ${sectorLabel}, avec un résultat le plus fréquent de type « ${outcomeLabel} » sur ${history.length} parties jouées. Ceci décrit ton comportement dans le jeu, jamais un diagnostic de ta personnalité réelle.</p>
    <span class="smallcaps" style="display:block;margin-bottom:8px;">À retravailler</span>
    <div class="card-grid">
      ${recommendations.map(r => `<a href="${r.href}" class="card play-tile"><h3 style="margin:0 0 6px;font-size:15px;">${r.title}</h3><p style="font-size:12.5px;">${r.desc}</p></a>`).join('')}
    </div>`;
}

// ---------- Graphique en barres générique ----------
function renderBarChart(chartId, labelsId, series, years){
  const chart = document.getElementById(chartId);
  const labels = document.getElementById(labelsId);
  if(!chart || !labels) return;
  chart.innerHTML=''; labels.innerHTML='';
  const steps = Math.min(8, years);
  const max = series[series.length-1] || 1;
  for(let i=1;i<=steps;i++){
    const yearIdx = Math.round(i*years/steps);
    const val = series[yearIdx];
    const h = Math.max(2, (val/max)*100);
    const bar = document.createElement('div');
    bar.className='bar'; bar.style.height=h+'%';
    bar.title = `Année ${yearIdx} : ${fmtEUR(val)}`;
    chart.appendChild(bar);
    const lab = document.createElement('span'); lab.textContent='A'+yearIdx; labels.appendChild(lab);
  }
}

// ---------- Hypothèses de rendement centralisées ----------
// Source unique pour les scénarios "prudent/central/optimiste" proposés par
// le simulateur d'intérêts composés (laboratoire.html, et index.html onglet
// Simuler) — évite d'avoir des pourcentages différents éparpillés dans
// plusieurs fichiers.
//
// Les 3 valeurs ci-dessous ne sont QUE des replis affichés avant que la
// vraie donnée arrive (enrichReturnAssumptionsFromRealHistory, plus bas) —
// jamais présentées comme un fait tant qu'elles n'ont pas été remplacées par
// un vrai CAGR sourcé et daté. Avant cette refonte, ces trois pourcentages
// étaient inventés (ronds, habillés d'une description plausible mais jamais
// reliés à un vrai chiffre) : exactement le problème signalé.
const RETURN_ASSUMPTIONS = {
  prudent: {rate: 3, label: 'Prudente', desc: 'Chargement de la référence réelle…'},
  central: {rate: 6, label: 'Centrale', desc: 'Chargement de la référence réelle…'},
  optimiste: {rate: 9, label: 'Optimiste', desc: 'Chargement de la référence réelle…'}
};

// Symbole Yahoo réel associé à chaque scénario — mêmes supports déjà listés
// dans laboratoire.html (aucun nouveau symbole). CAGR calculé en devise
// native (dollars) : on mesure un rendement d'indice réel, pas un pari de
// change — la conversion EUR/USD (utile pour "et si j'avais investi X €")
// n'a pas sa place dans une hypothèse générique de rendement.
const RETURN_ASSUMPTION_SYMBOLS = {
  prudent: {symbol: 'AGG', name: "l'ETF obligataire US (AGG)"},
  central: {symbol: '^GSPC', name: 'le S&P 500'},
  optimiste: {symbol: 'QQQ', name: "l'ETF Nasdaq 100 (QQQ)"}
};

// Mute RETURN_ASSUMPTIONS en place avec un vrai CAGR sourcé et daté pour
// chaque scénario, calculé sur tout l'historique réel disponible (cours
// seuls, sans dividendes réinvestis — même limitation déjà assumée ailleurs
// sur le site, ex. "Et si j'avais investi ?"). Un échec réseau sur UN
// symbole laisse ce scénario sur son repli (jamais un blocage des deux
// autres, jamais une valeur inventée à sa place). Retourne le sous-ensemble
// des clés réellement mises à jour, pour que l'appelant sache quoi re-rendre.
async function enrichReturnAssumptionsFromRealHistory(){
  const updated = [];
  await Promise.all(Object.entries(RETURN_ASSUMPTION_SYMBOLS).map(async ([key, {symbol, name}]) => {
    try {
      const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbol) + '&range=max&interval=1mo');
      if(!resp.ok) throw new Error('HTTP ' + resp.status);
      const payload = await resp.json();
      const q = (payload.quotes || [])[0];
      if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Historique indisponible');
      const first = q.history[0], last = q.history[q.history.length - 1];
      const years = (new Date(last.date) - new Date(first.date)) / (365.25 * 24 * 3600 * 1000);
      if(years <= 0 || typeof first.close !== 'number' || typeof last.close !== 'number' || first.close <= 0) throw new Error('Période invalide');
      const rate = (Math.pow(last.close / first.close, 1 / years) - 1) * 100;
      const startLabel = new Date(first.date).toLocaleDateString('fr-FR', {year: 'numeric', month: 'short'});
      const endLabel = new Date(last.date).toLocaleDateString('fr-FR', {year: 'numeric', month: 'short'});
      RETURN_ASSUMPTIONS[key].rate = rate;
      RETURN_ASSUMPTIONS[key].desc = `Rendement annualisé réel de ${name}, en dollars et hors dividendes réinvestis, du ${startLabel} au ${endLabel} (Yahoo Finance) : ${rate >= 0 ? '+' : ''}${rate.toFixed(1)} %/an — une période réellement observée, jamais une garantie pour l'avenir.`;
      updated.push(key);
    } catch(err){
      RETURN_ASSUMPTIONS[key].desc = `⚠️ Donnée manquante : référence réelle temporairement indisponible, valeur de repli (${RETURN_ASSUMPTIONS[key].rate} %) affichée à la place.`;
      console.info(`Likanza Academy — rendement réel indisponible pour "${key}" :`, err.message);
    }
  }));
  return updated;
}

// Inflation par défaut — repli affiché tant que la vraie série française
// (IPCH, BCE) n'a pas été chargée par la carte "Que valent réellement mes
// euros ?" de laboratoire.html. Remplacée par computeRealInflationRate dès
// que cette vraie série arrive (jamais recalculée depuis une constante figée
// au moment de l'écriture du code).
let DEFAULT_INFLATION_ASSUMPTION = 2.1;

// Taux d'inflation annualisé réel le plus récent, calculé sur les 12
// derniers mois glissants de la vraie série IPCH déjà chargée (points :
// {period:'YYYY-MM', value}, la plus récente en dernier) — jamais une
// hypothèse inventée. Retourne null si moins de 13 points disponibles
// (pas assez pour un vrai glissement sur 12 mois), l'appelant garde alors
// le repli existant plutôt que d'afficher un calcul non fiable.
function computeRealInflationRate(points){
  if(!Array.isArray(points) || points.length < 13) return null;
  const last = points[points.length - 1], yearAgo = points[points.length - 13];
  if(!last || !yearAgo || typeof last.value !== 'number' || typeof yearAgo.value !== 'number' || yearAgo.value <= 0) return null;
  return (last.value / yearAgo.value - 1) * 100;
}

// ---------- Fonctions financières partagées ----------
const fmtEUR = n => Math.round(n).toLocaleString('fr-FR') + ' €';
function compoundSeries(P, PMT, rAnnual, years){
  const r = rAnnual/100;
  const series = [];
  for(let y=0;y<=years;y++){
    const months = y*12;
    let fv;
    if(r===0){ fv = P + PMT*months; }
    else { const rm = r/12; fv = P*Math.pow(1+rm, months) + PMT*((Math.pow(1+rm, months)-1)/rm); }
    series.push(fv);
  }
  return series;
}
function loanMonthlyPayment(capital, rateAnnual, years){
  const rm = rateAnnual/100/12;
  const n = years*12;
  if(rm === 0) return capital/n;
  return capital * rm / (1 - Math.pow(1+rm, -n));
}
function borrowingCapacity(monthlyPayment, rateAnnual, years){
  const rm = rateAnnual/100/12;
  const n = years*12;
  if(rm === 0) return monthlyPayment*n;
  return monthlyPayment * (1 - Math.pow(1+rm, -n)) / rm;
}

// ---------- Comparateur de décisions : achat cash ou à crédit + investir ----------
// Compare deux façons de financer le même achat sur la même durée, avec le même
// effort d'épargne mensuel total dans les deux cas (mêmes formules que le
// simulateur d'intérêts composés et le calcul de mensualité déjà utilisés
// ailleurs — aucune nouvelle hypothèse, juste une mise en regard) :
//  - "Cash" : on paie comptant, puis on investit chaque mois l'équivalent de
//    la mensualité qu'on aurait payée à la banque.
//  - "Crédit" : on emprunte, on investit tout de suite la somme non dépensée,
//    et la mensualité part rembourser la banque plutôt qu'être investie.
function computeCashVsCreditComparison(price, creditRate, investRate, years){
  const monthlyPayment = loanMonthlyPayment(price, creditRate, years);
  const cashSeries = compoundSeries(0, monthlyPayment, investRate, years);
  const creditSeries = compoundSeries(price, 0, investRate, years);
  const totalRepaid = monthlyPayment * years * 12;
  return {
    monthlyPayment,
    totalRepaid,
    totalInterest: totalRepaid - price,
    cashSeries,
    creditSeries,
    cashFinalValue: cashSeries[cashSeries.length-1],
    creditFinalValue: creditSeries[creditSeries.length-1]
  };
}

// ---------- Comparateur de décisions : rembourser par anticipation ou investir ----------
// Une somme disponible peut soit réduire un crédit existant (gain "garanti"
// équivalent au taux du crédit, puisque c'est un intérêt qu'on cesse de payer),
// soit être investie (rendement supposé, jamais garanti). Comparaison purement
// arithmétique à partir des hypothèses saisies par l'utilisateur.
function computePrepayVsInvestComparison(amount, creditRate, investRate, years){
  const prepaySeries = [];
  const investSeries = [];
  for(let y=0;y<=years;y++){
    prepaySeries.push(amount * Math.pow(1+creditRate/100, y));
    investSeries.push(amount * Math.pow(1+investRate/100, y));
  }
  return {
    prepaySeries,
    investSeries,
    prepayFinalValue: prepaySeries[prepaySeries.length-1],
    investFinalValue: investSeries[investSeries.length-1]
  };
}

// ============================================================
// Laboratoire financier — moteurs de calcul sur données réelles
// (scripts/historical-data.js pour les métadonnées de source ;
// scripts/pages/laboratoire.js pour l'interface). Toutes ces
// fonctions sont pures : elles ne font aucun fetch, elles reçoivent
// des séries déjà récupérées en direct (Yahoo Finance / BCE SDW) et
// ne fabriquent jamais une valeur manquante.
// ============================================================

// ---------- Historique mensuel réel, partagé entre pages (Bourse V2) ----------
// Même logique que fetchLabMonthlyHistory (scripts/pages/laboratoire.js), mais
// centralisée dans data.js pour être réutilisable sur les pages Bourse
// (allocation par risque, portefeuille) sans dupliquer la conversion EUR/USD.
// Conserve la version spécifique du Laboratoire intacte (zéro risque de
// régression sur une page déjà testée) — celle-ci sert les nouvelles pages.
let sharedFxCache = null;
async function fetchEurUsdRate(){
  if(sharedFxCache) return sharedFxCache;
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent('EURUSD=X') + '&range=10y&interval=1mo');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Taux de change EUR/USD indisponible');
  const map = {};
  q.history.forEach(h => { map[h.date.slice(0, 7)] = h.close; });
  sharedFxCache = map;
  return map;
}
async function fetchSymbolMonthlyHistory(symbol, range){
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbol) + '&range=' + (range || '5y') + '&interval=1mo');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Historique indisponible');
  let points = q.history.map(h => ({period: h.date.slice(0, 7), close: h.close}));
  if(q.currency === 'USD'){
    const fx = await fetchEurUsdRate();
    points = points.filter(p => typeof fx[p.period] === 'number').map(p => ({period: p.period, close: p.close / fx[p.period]}));
    if(points.length < 2) throw new Error('Conversion EUR/USD insuffisante sur cette période');
  }
  return points;
}

// ---------- Dividend Intelligence : historique mensuel + dividendes réels,
// convertis en EUR pour les valeurs cotées en USD — même conversion mois par
// mois que fetchSymbolMonthlyHistory ci-dessus (jamais un taux unique
// appliqué à toute la période, ni pour le cours ni pour le dividende). Un
// seul appel réseau (events=div ajouté à la même requête chart déjà
// utilisée). dividends: [] si l'entreprise n'en verse pas — jamais une erreur.
async function fetchSymbolMonthlyHistoryWithDividends(symbol, range){
  const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbol) + '&range=' + (range || '10y') + '&interval=1mo&events=div');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !Array.isArray(q.history) || q.history.length < 2) throw new Error('Historique indisponible');
  let points = q.history.map(h => ({period: h.date.slice(0, 7), close: h.close}));
  let dividends = Array.isArray(q.dividends) ? q.dividends : [];
  if(q.currency === 'USD'){
    const fx = await fetchEurUsdRate();
    points = points.filter(p => typeof fx[p.period] === 'number').map(p => ({period: p.period, close: p.close / fx[p.period]}));
    dividends = dividends
      .map(d => { const rate = fx[d.date.slice(0, 7)]; return typeof rate === 'number' ? {date: d.date, amount: d.amount / rate} : null; })
      .filter(Boolean);
    if(points.length < 2) throw new Error('Conversion EUR/USD insuffisante sur cette période');
  }
  return {points, dividends, currency: q.currency};
}

// ---------- Investissement historique réel (P0-1 "Et si j'avais investi ?" / P0-2 DCA historique) ----------
// monthlyPoints : [{period:'2016-09', close:72.66}, ...] triés chronologiquement,
// une vraie série mensuelle (Yahoo Finance via /api/custom-quotes?interval=1mo).
// Achète des "unités" au vrai cours de chaque mois (capital initial au mois 0,
// puis versement mensuel optionnel) — reproduit fidèlement l'effet du prix
// réel payé à chaque date, jamais un rendement moyen lissé.
function computeHistoricalInvestment(monthlyPoints, initial, monthlyContribution){
  if(!monthlyPoints || monthlyPoints.length < 2) return null;
  const points = monthlyPoints;
  let units = initial > 0 ? initial / points[0].close : 0;
  let invested = initial;
  const investedSeries = [invested];
  const valueSeries = [units * points[0].close];
  let buysDuringDip = 0;

  for(let i = 1; i < points.length; i++){
    if(monthlyContribution > 0){
      units += monthlyContribution / points[i].close;
      invested += monthlyContribution;
      if(points[i].close < points[i-1].close) buysDuringDip++;
    }
    investedSeries.push(invested);
    valueSeries.push(units * points[i].close);
  }

  const finalValue = valueSeries[valueSeries.length - 1];
  const totalInvested = investedSeries[investedSeries.length - 1];
  const totalGain = finalValue - totalInvested;
  const years = (points.length - 1) / 12;
  const cagr = totalInvested > 0 && years > 0 ? (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100 : 0;
  const avgPurchasePrice = units > 0 ? totalInvested / units : 0;

  // Rendements par année civile (la première et la dernière année peuvent être partielles)
  const yearlyReturns = [];
  let yearStartValue = valueSeries[0];
  let currentYear = points[0].period.slice(0, 4);
  for(let i = 1; i <= points.length; i++){
    const period = i < points.length ? points[i].period : null;
    const year = period ? period.slice(0, 4) : null;
    if(year !== currentYear){
      const endValue = valueSeries[i - 1];
      yearlyReturns.push({year: currentYear, returnPct: yearStartValue > 0 ? (endValue / yearStartValue - 1) * 100 : 0});
      currentYear = year;
      yearStartValue = endValue;
    }
  }
  const bestYear = yearlyReturns.length ? yearlyReturns.reduce((a, b) => (b.returnPct > a.returnPct ? b : a)) : null;
  const worstYear = yearlyReturns.length ? yearlyReturns.reduce((a, b) => (b.returnPct < a.returnPct ? b : a)) : null;
  const negativeYears = yearlyReturns.filter(y => y.returnPct < 0).length;

  // Drawdown maximal + temps de récupération (du sommet précédent jusqu'au retour à ce niveau)
  let peak = valueSeries[0], peakIdx = 0, maxDD = 0, troughIdx = 0, ddPeakIdx = 0;
  for(let i = 1; i < valueSeries.length; i++){
    if(valueSeries[i] > peak){ peak = valueSeries[i]; peakIdx = i; }
    else {
      const dd = (peak - valueSeries[i]) / peak;
      if(dd > maxDD){ maxDD = dd; troughIdx = i; ddPeakIdx = peakIdx; }
    }
  }
  let recoveryMonths = null;
  if(maxDD > 0){
    const peakValue = valueSeries[ddPeakIdx];
    for(let i = troughIdx + 1; i < valueSeries.length; i++){
      if(valueSeries[i] >= peakValue){ recoveryMonths = i - ddPeakIdx; break; }
    }
  }

  return {
    dates: points.map(p => p.period),
    investedSeries, valueSeries,
    finalValue, totalInvested, totalGain, cagr, years,
    avgPurchasePrice, finalUnits: units, buysDuringDip,
    bestYear, worstYear, negativeYears, yearlyReturns,
    maxDrawdownPct: maxDD * 100,
    recoveryMonths
  };
}

// ---------- Décision face à un vrai krach (Market Panic, jeu-market-panic.html) ----------
// Repère le pire drawdown RÉELLEMENT survenu dans la série mensuelle fournie
// (même algorithme peak/trough que computeHistoricalInvestment ci-dessus, mais
// appliqué directement aux cours, pas à une valeur de portefeuille), puis
// calcule 3 issues réelles à partir de ce même vrai sommet/creux jusqu'à la
// dernière donnée disponible : vendre au creux (capital gelé, aucune
// croissance après la vente), rester investi (le cours réel continue de
// courir), racheter au creux (un capital supplémentaire investi exactement au
// plus bas, au vrai cours de ce mois). Jamais un chiffre inventé : les 3
// issues ne sont que le même vrai historique de prix, rejoué depuis 3 points
// de décision différents.
function computeCrashDecisionOutcome(monthlyPoints, capital, extraAtTrough){
  if(!monthlyPoints || monthlyPoints.length < 3) return null;
  const points = monthlyPoints;

  let peak = points[0].close, peakIdx = 0, maxDD = 0, troughIdx = 0, ddPeakIdx = 0;
  for(let i = 1; i < points.length; i++){
    if(points[i].close > peak){ peak = points[i].close; peakIdx = i; }
    else {
      const dd = (peak - points[i].close) / peak;
      if(dd > maxDD){ maxDD = dd; troughIdx = i; ddPeakIdx = peakIdx; }
    }
  }
  if(maxDD <= 0) return null; // série toujours en hausse : aucun vrai drawdown à jouer

  const peakClose = points[ddPeakIdx].close;
  const troughClose = points[troughIdx].close;
  const lastIdx = points.length - 1;
  const lastClose = points[lastIdx].close;

  const units = capital > 0 ? capital / peakClose : 0;
  const extraUnits = extraAtTrough > 0 ? extraAtTrough / troughClose : 0;

  const vendu = {finalValue: units * troughClose};
  const garde = {finalValue: units * lastClose};
  const achete = {finalValue: units * lastClose + extraUnits * lastClose, extraInvested: extraAtTrough};

  let recoveryMonths = null;
  for(let i = troughIdx + 1; i <= lastIdx; i++){
    if(points[i].close >= peakClose){ recoveryMonths = i - ddPeakIdx; break; }
  }

  return {
    peakDate: points[ddPeakIdx].period, troughDate: points[troughIdx].period, lastDate: points[lastIdx].period,
    peakClose, troughClose, lastClose,
    drawdownPct: maxDD * 100,
    monthsPeakToTrough: troughIdx - ddPeakIdx,
    monthsTroughToLast: lastIdx - troughIdx,
    recoveryMonths,
    recovered: lastClose >= peakClose,
    outcomes: {vendu, garde, achete}
  };
}

// ---------- Simulateur "Gouverneur de banque centrale" (laboratoire.html, tab-economie) ----------
// Modèle pédagogique volontairement simplifié, jamais une prédiction ni des
// données réelles (contrairement au reste du Laboratoire) — même esprit que
// les scénarios qualitatifs ECO_LAB_SCENARIOS (scripts/pages/laboratoire.js) :
// chaque choc est écrit à l'avance (jamais généré aléatoirement), et l'effet
// du taux directeur sur l'inflation/le chômage/la croissance n'agit qu'AU TOUR
// SUIVANT (délai de transmission de la politique monétaire, comme expliqué
// dans le scénario "hausse des taux" du laboratoire économique) — jamais un
// effet instantané. Objectif pédagogique : le double mandat (inflation proche
// d'une cible, chômage proche de son niveau "naturel"), un arbitrage réel des
// banques centrales, pas juste "monter les taux = toujours bien".
const GOVERNOR_TARGET_INFLATION = 2;
const GOVERNOR_NATURAL_UNEMPLOYMENT = 5;
const GOVERNOR_NEUTRAL_RATE = 2;
const GOVERNOR_ROUNDS = 6;

const GOVERNOR_EVENTS = [
  {titre: "Un choc énergétique fait grimper les prix à l'importation.", deltaInflation: 1.5, deltaChomage: 0, deltaCroissance: -0.2},
  {titre: "La consommation ralentit après plusieurs mois de prix élevés.", deltaInflation: 0, deltaChomage: 0.3, deltaCroissance: -0.5},
  {titre: "Les tensions commerciales internationales s'apaisent légèrement.", deltaInflation: -0.3, deltaChomage: 0, deltaCroissance: 0.2},
  {titre: "Une vague d'investissement dynamise un secteur clé de l'économie.", deltaInflation: 0.2, deltaChomage: -0.4, deltaCroissance: 1.0},
  {titre: "Une incertitude géopolitique pèse sur la confiance des ménages.", deltaInflation: 0, deltaChomage: 0.2, deltaCroissance: -0.6},
  {titre: "Les prix de l'énergie se stabilisent après les chocs précédents.", deltaInflation: -0.4, deltaChomage: 0, deltaCroissance: 0.3}
];

function initGovernorState(){
  return {
    round: 0,
    tauxDirecteur: GOVERNOR_NEUTRAL_RATE,
    inflation: 4.5,
    chomage: 7,
    croissance: 1.5,
    history: [],
    done: false
  };
}

// Applique la décision du joueur (variation du taux directeur, en points de %,
// pas de 0,25) puis fait évoluer l'état vers le tour suivant : le choc du
// tour suivant (fixe, jamais inventé au vol) + l'effet DÉCALÉ du taux qui
// vient d'être décidé (jamais du taux déjà en vigueur ce tour-ci).
function applyGovernorDecision(state, deltaTaux){
  const clampedDelta = Math.max(-1, Math.min(1, Math.round(deltaTaux * 4) / 4));
  const newTaux = Math.max(0, Math.min(15, state.tauxDirecteur + clampedDelta));

  const event = GOVERNOR_EVENTS[state.round % GOVERNOR_EVENTS.length];
  const gap = newTaux - GOVERNOR_NEUTRAL_RATE;

  const inflation = Math.max(0, Math.min(20, state.inflation + event.deltaInflation - 0.4 * gap));
  const chomage = Math.max(0, Math.min(25, state.chomage + event.deltaChomage + 0.25 * gap));
  const croissance = Math.max(-8, Math.min(10, state.croissance + event.deltaCroissance - 0.5 * gap));

  const historyEntry = {
    round: state.round, tauxAvant: state.tauxDirecteur, decision: clampedDelta, tauxApres: newTaux,
    inflationAvant: state.inflation, chomageAvant: state.chomage, croissanceAvant: state.croissance,
    evenement: event.titre
  };

  const nextRound = state.round + 1;
  return {
    round: nextRound,
    tauxDirecteur: newTaux,
    inflation, chomage, croissance,
    history: state.history.concat([historyEntry]),
    done: nextRound >= GOVERNOR_ROUNDS
  };
}

// Perte quadratique à double mandat (inflation + chômage), même logique que
// la fonction de perte réellement utilisée par certaines banques centrales
// pour formaliser leur arbitrage — jamais une seule métrique isolée.
function scoreGovernorGame(state){
  const allInflation = state.history.map(h => h.inflationAvant).concat([state.inflation]);
  const allChomage = state.history.map(h => h.chomageAvant).concat([state.chomage]);
  let loss = 0;
  allInflation.forEach((v, i) => {
    loss += Math.pow(v - GOVERNOR_TARGET_INFLATION, 2) + Math.pow(allChomage[i] - GOVERNOR_NATURAL_UNEMPLOYMENT, 2);
  });
  const avgLoss = loss / allInflation.length;
  const score = Math.max(0, Math.round(1000 - avgLoss * 20));
  let label;
  if(score >= 800) label = 'Pilotage maîtrisé';
  else if(score >= 550) label = 'Pilotage correct, quelques déséquilibres';
  else label = 'Déséquilibres importants';
  return {avgLoss, score, label};
}

// ---------- Livret A réel (comparaison "Et si j'avais investi ?") ----------
// Aucune API n'est déjà branchée sur ce site pour le taux du Livret A (BCE
// SDW/lib/ecb.js ne couvre pas les taux réglementés français) — traité
// comme COMPANY_EDITORIAL : une table réelle, datée, sourcée, curatée à la
// main plutôt qu'inventée, jamais présentée comme une donnée "live".
//
// Vérifié par recherche web croisée le 2026-08-22 (2 sources indépendantes,
// un écart entre elles corrigé) :
//  - https://www.magnolia.fr/placement/produits-epargne/reglementes/livret-a/historique
//  - https://www.ideal-investisseur.fr/economie/livret-A-baisse-remuneration-1-er-fevrier-2020-7649.html
//    (la première source seule indiquait à tort "aucun changement entre
//    2015 et 2022" ; corrigée : gel réel à 0,75 % jusqu'au 31/01/2020, puis
//    0,50 % dès le 1er février 2020, confirmé par la seconde source).
// Couverture à partir de 2010, largement suffisante pour la fenêtre
// range=10y déjà utilisée par fetchLabMonthlyHistory (jamais besoin
// d'extrapoler avant cette date).
const LIVRET_A_RATE_HISTORY = [
  {date: '2010-08-01', rate: 1.75},
  {date: '2011-02-01', rate: 2.00},
  {date: '2011-08-01', rate: 2.25},
  {date: '2013-02-01', rate: 1.75},
  {date: '2013-08-01', rate: 1.25},
  {date: '2014-08-01', rate: 1.00},
  {date: '2015-08-01', rate: 0.75},
  {date: '2020-02-01', rate: 0.50},
  {date: '2022-02-01', rate: 1.00},
  {date: '2022-08-01', rate: 2.00},
  {date: '2023-02-01', rate: 3.00},
  {date: '2025-02-01', rate: 2.40},
  {date: '2025-08-01', rate: 1.70},
  {date: '2026-02-01', rate: 1.50}
];
// Retourne le taux réellement en vigueur pour le mois donné ('YYYY-MM'),
// null si antérieur à la couverture du tableau — jamais un taux extrapolé.
function computeLivretARateAt(periodYYYYMM){
  let applicable = null;
  for(const entry of LIVRET_A_RATE_HISTORY){
    if(entry.date.slice(0, 7) <= periodYYYYMM) applicable = entry;
    else break;
  }
  return applicable ? applicable.rate : null;
}
// Même forme de sortie que computeHistoricalInvestment (investedSeries/
// valueSeries) pour un ajout direct à renderMultiLineChart. monthlyPeriods :
// ['YYYY-MM', ...] triés chronologiquement — mêmes mois que la série du
// support comparé, pour un graphique parfaitement superposable.
// Capitalisation mensuelle du taux annuel réellement en vigueur chaque mois
// (simplification explicite par rapport à la vraie règle des quinzaines
// bancaires françaises — disclaimé côté appelant). null si UN SEUL mois de
// la période n'a pas de taux réel disponible (jamais une valeur inventée
// pour combler un trou).
function computeLivretASeries(monthlyPeriods, initial, monthlyContribution){
  if(!Array.isArray(monthlyPeriods) || monthlyPeriods.length < 2) return null;
  let capital = initial;
  const investedSeries = [initial];
  const valueSeries = [capital];
  for(let i = 1; i < monthlyPeriods.length; i++){
    const rate = computeLivretARateAt(monthlyPeriods[i]);
    if(rate === null) return null;
    const monthlyRate = rate / 100 / 12;
    capital = capital * (1 + monthlyRate) + monthlyContribution;
    investedSeries.push(investedSeries[investedSeries.length - 1] + monthlyContribution);
    valueSeries.push(capital);
  }
  return {investedSeries, valueSeries, finalValue: valueSeries[valueSeries.length - 1]};
}

// Volatilité réelle : écart-type des variations mensuelles en %, calculée sur
// de vrais cours (même format que computeHistoricalInvestment — {period, close}).
// Seule brique de calcul manquante pour évaluer un risque relatif entre
// plusieurs valeurs suivies ; jamais une estimation qualitative inventée.
function computeMonthlyReturnVolatility(monthlyPoints){
  if(!Array.isArray(monthlyPoints) || monthlyPoints.length < 3) return null;
  const returns = [];
  for(let i = 1; i < monthlyPoints.length; i++){
    const prev = monthlyPoints[i - 1].close, curr = monthlyPoints[i].close;
    if(typeof prev === 'number' && typeof curr === 'number' && prev > 0) returns.push((curr / prev - 1) * 100);
  }
  if(returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
  return {monthlyStdevPct: Math.sqrt(variance), monthsUsed: returns.length};
}

// Bandes de volatilité réelles, jamais "sans risque" — toujours relatif aux
// autres valeurs analysées (consigne explicite reçue).
function bucketVolatility(monthlyStdevPct){
  if(typeof monthlyStdevPct !== 'number') return null;
  if(monthlyStdevPct < 4) return {level: 'faible', label: 'volatilité mensuelle plus faible que la moyenne des valeurs analysées'};
  if(monthlyStdevPct < 7) return {level: 'moderee', label: 'volatilité mensuelle modérée'};
  return {level: 'elevee', label: 'volatilité mensuelle plus élevée que la moyenne des valeurs analysées'};
}

// ---------- Profil investisseur : score de tolérance au risque ----------
// Somme des poids réellement choisis par l'utilisateur (INVESTOR_RISK_QUESTIONS,
// investor-profile-data.js), jamais un diagnostic psychologique — un "profil
// de risque ESTIMÉ", explicitement qualifié comme tel dans le rendu.
function computeInvestorRiskProfile(answers){
  if(typeof INVESTOR_RISK_QUESTIONS === 'undefined') return null;
  let score = 0, maxScore = 0, answered = 0;
  INVESTOR_RISK_QUESTIONS.forEach(q => {
    const maxWeight = Math.max(...q.options.map(o => o.weight));
    maxScore += maxWeight;
    const chosen = q.options.find(o => o.value === answers[q.id]);
    if(chosen){ score += chosen.weight; answered++; }
  });
  if(answered < INVESTOR_RISK_QUESTIONS.length) return {score, maxScore, answered, total: INVESTOR_RISK_QUESTIONS.length, profile: null};
  const ratio = maxScore > 0 ? score / maxScore : 0;
  const profile = ratio < 0.35 ? 'prudent' : ratio < 0.7 ? 'equilibre' : 'dynamique';
  return {score, maxScore, answered, total: INVESTOR_RISK_QUESTIONS.length, ratio, profile};
}

// ---------- Classement d'une valeur suivie en tier de risque relatif ----------
// Combine la volatilité réelle (bucketVolatility) et l'endettement net
// (bucketLeverage, déjà utilisé par le Comparateur) — jamais "sans risque",
// toujours relatif aux autres valeurs analysées. `volatility` peut être null
// (historique indisponible) : dans ce cas le classement se rabat sur le seul
// endettement, jamais un tier inventé faute de donnée.
function computeRiskTier(fundamentalFields, monthlyStdevPct){
  const vol = bucketVolatility(monthlyStdevPct);
  const lev = bucketLeverage(fundamentalFields ? fundamentalFields.totalDebt : null, fundamentalFields ? fundamentalFields.totalCash : null);
  if(!vol && !lev) return null;
  if(vol){
    if(vol.level === 'faible' && (!lev || lev.level !== 'eleve')) return 'prudent';
    if(vol.level === 'elevee' || (lev && lev.level === 'eleve')) return 'dynamique';
    return 'equilibre';
  }
  // Pas de volatilité disponible : classement plus prudent, basé uniquement sur l'endettement.
  return lev.level === 'eleve' ? 'dynamique' : lev.level === 'modere' ? 'equilibre' : 'prudent';
}

// ---------- Score transparent (Qualité / Valorisation / Risque) ----------
// Chaque sous-score s'appuie sur les mêmes bandes réelles que le reste du
// site (bucketGrowth/bucketMargin/bucketLeverage/bucketVolatility) — jamais
// un chiffre global opaque : chaque composant est retourné avec sa vraie
// valeur ET le nombre de points qu'elle rapporte, pour un affichage
// entièrement décomposable. Un composant sans donnée est explicitement
// `null` et exclu de la moyenne, jamais remplacé par une valeur inventée.
function computeStockScore(fields, monthlyStdevPct, maxDrawdownPct){
  fields = fields || {};

  function sub(label, value, formatted, points){
    return {label, value, formatted, points};
  }

  // Qualité : croissance + marge + endettement, mêmes bandes que le Comparateur.
  const qualityComponents = [];
  const growth = bucketGrowth(fields.revenueGrowth);
  if(growth) qualityComponents.push(sub('Croissance du chiffre d\'affaires', fields.revenueGrowth, formatFundamentalValue('revenueGrowth', fields.revenueGrowth),
    growth.level === 'forte' ? 90 : growth.level === 'moderee' ? 65 : growth.level === 'stable' ? 40 : 15));
  const margin = bucketMargin(fields.profitMargins);
  if(margin) qualityComponents.push(sub('Marge nette', fields.profitMargins, formatFundamentalValue('profitMargins', fields.profitMargins),
    margin.level === 'elevee' ? 90 : margin.level === 'moderee' ? 60 : 25));
  const leverage = bucketLeverage(fields.totalDebt, fields.totalCash);
  if(leverage) qualityComponents.push(sub('Endettement net', null, leverage.label,
    leverage.level === 'faible' ? 90 : leverage.level === 'modere' ? 55 : 20));

  // Valorisation : PER par rapport à des repères généraux — pas un comparable
  // sectoriel précis (donnée non disponible), explicitement qualifié comme tel.
  const valuationComponents = [];
  if(typeof fields.trailingPE === 'number' && fields.trailingPE > 0){
    const per = fields.trailingPE;
    const perPoints = per < 15 ? 80 : per < 25 ? 55 : per < 40 ? 30 : 10;
    valuationComponents.push(sub('PER (par rapport à des repères généraux)', per, formatFundamentalValue('trailingPE', per), perPoints));
  }

  // Risque : volatilité + drawdown réels — score orienté "moins de risque",
  // jamais "sans risque".
  const riskComponents = [];
  const vol = bucketVolatility(monthlyStdevPct);
  if(vol) riskComponents.push(sub('Volatilité mensuelle (5 ans)', monthlyStdevPct, `${monthlyStdevPct.toFixed(1)}%/mois`,
    vol.level === 'faible' ? 85 : vol.level === 'moderee' ? 55 : 25));
  if(typeof maxDrawdownPct === 'number'){
    const ddPoints = maxDrawdownPct < 20 ? 85 : maxDrawdownPct < 40 ? 55 : 20;
    riskComponents.push(sub('Pire baisse historique observée', maxDrawdownPct, `-${maxDrawdownPct.toFixed(1)}%`, ddPoints));
  }

  function avg(components){
    if(!components.length) return null;
    return Math.round(components.reduce((s, c) => s + c.points, 0) / components.length);
  }

  const quality = {score: avg(qualityComponents), components: qualityComponents};
  const valuation = {score: avg(valuationComponents), components: valuationComponents};
  const risk = {score: avg(riskComponents), components: riskComponents};
  const available = [quality.score, valuation.score, risk.score].filter(s => typeof s === 'number');
  const overall = available.length ? Math.round(available.reduce((a, b) => a + b, 0) / available.length) : null;

  return {quality, valuation, risk, overall};
}

// Verdict à 3 états dérivé du score — jamais un simple BUY/SELL. Toujours
// accompagné de facteurs réels qui pourraient faire évoluer l'analyse,
// dérivés des mêmes bandes déjà calculées (même esprit que
// buildAnalystScenarioFactors, sans dépendre de cibles d'analystes qui ne
// couvrent pas tous les titres).
function computeStockVerdict(score, riskTier, investorProfile){
  if(typeof score.overall !== 'number') return {level: 'indetermine', label: 'Données insuffisantes', reason: "Pas assez de données réelles disponibles pour former une analyse."};

  let mismatch = false;
  if(investorProfile && investorProfile.riskProfile && riskTier){
    const order = {prudent: 0, equilibre: 1, dynamique: 2};
    if(order[riskTier] > order[investorProfile.riskProfile]) mismatch = true;
  }

  if(mismatch){
    return {level: 'risque', label: 'Risqué ou inadapté au profil', reason: `Cette valeur est classée "${riskTier}" alors que ton profil de risque estimé est "${investorProfile.riskProfile}" — elle pourrait ne pas correspondre à ta tolérance au risque actuelle, indépendamment de son score.`};
  }
  if(score.overall >= 65) return {level: 'etudier', label: 'À étudier selon ton profil', reason: `Score global de ${score.overall}/100 sur les critères disponibles (qualité, valorisation, risque) — cela ne garantit aucune performance future.`};
  if(score.overall >= 40) return {level: 'surveiller', label: 'À surveiller', reason: `Score global de ${score.overall}/100 : certains critères sont favorables, d'autres moins — la situation mérite d'être suivie avant toute décision.`};
  return {level: 'risque', label: 'Risqué ou inadapté au profil', reason: `Score global de ${score.overall}/100 sur les critères disponibles — plusieurs indicateurs sont défavorables relativement aux autres valeurs analysées.`};
}

// "Ce qui pourrait changer cette analyse" — dérivé des composants du score
// eux-mêmes, jamais une prédiction de ce qui va se passer.
function buildScoreChangeFactors(score){
  const factors = [];
  score.quality.components.forEach(c => { if(c.points < 60) factors.push(`Une amélioration de "${c.label.toLowerCase()}" renforcerait le score de qualité.`); });
  score.valuation.components.forEach(c => { if(c.points < 60) factors.push(`Une baisse de la valorisation (${c.label.toLowerCase()}) rendrait le prix d'entrée plus favorable.`); });
  score.risk.components.forEach(c => { if(c.points < 60) factors.push(`Une baisse de "${c.label.toLowerCase()}" réduirait le risque relatif de cette valeur.`); });
  if(!factors.length) factors.push("Les critères disponibles sont déjà globalement favorables — une dégradation de l'un d'eux (croissance, marge, endettement, valorisation, volatilité) referait évoluer cette analyse.");
  return factors;
}

// ---------- Simulateur de portefeuille : agrégation pondérée réelle ----------
// entries: [{symbol, weight, monthlyPoints:[{period,close}]}]. N'agrège que
// sur les périodes communes à TOUTES les valeurs (jamais une extrapolation
// pour combler l'historique manquant d'une valeur plus récente) — si moins
// de 12 mois communs, le renvoie explicitement plutôt que de forcer un calcul
// peu fiable. L'indice repart à 1 (comme une part de portefeuille), permet de
// réutiliser computeHistoricalInvestment pour CAGR/drawdown sur ce même indice.
function computePortfolioSeries(entries){
  const totalWeight = entries.reduce((s, e) => s + (e.weight || 0), 0);
  if(totalWeight <= 0 || entries.length === 0) return null;
  const norm = entries.map(e => ({...e, weight: e.weight / totalWeight}));

  const periodSets = norm.map(e => new Set(e.monthlyPoints.map(p => p.period)));
  const commonPeriods = norm[0].monthlyPoints.map(p => p.period).filter(p => periodSets.every(s => s.has(p))).sort();
  if(commonPeriods.length < 12) return {insufficientHistory: true, commonMonths: commonPeriods.length};

  const closeMaps = norm.map(e => { const m = {}; e.monthlyPoints.forEach(p => { m[p.period] = p.close; }); return m; });
  const portfolioIndex = [{period: commonPeriods[0], close: 1}];
  for(let i = 1; i < commonPeriods.length; i++){
    const prevP = commonPeriods[i - 1], curP = commonPeriods[i];
    let weightedReturn = 0;
    norm.forEach((e, idx) => {
      const prevClose = closeMaps[idx][prevP], curClose = closeMaps[idx][curP];
      weightedReturn += e.weight * (curClose / prevClose - 1);
    });
    portfolioIndex.push({period: curP, close: portfolioIndex[i - 1].close * (1 + weightedReturn)});
  }
  return {insufficientHistory: false, commonMonths: commonPeriods.length, portfolioIndex, weights: norm.map(e => ({symbol: e.symbol, weight: e.weight}))};
}

// 2 fenêtres réelles prédéfinies, jamais un pourcentage de krach inventé —
// le vrai recalcul se fait toujours sur les données déjà fetchées.
const PORTFOLIO_STRESS_WINDOWS = [
  {id: 'covid2020', label: 'Krach Covid (février à avril 2020)', start: '2020-02', end: '2020-04'},
  {id: 'baisse2022', label: 'Baisse des marchés 2022 (janvier à octobre 2022)', start: '2022-01', end: '2022-10'}
];
function computeStressWindowReturn(portfolioIndex, start, end){
  const slice = portfolioIndex.filter(p => p.period >= start && p.period <= end);
  if(slice.length < 2) return null;
  return {
    startPeriod: slice[0].period, endPeriod: slice[slice.length - 1].period, months: slice.length,
    changePct: (slice[slice.length - 1].close / slice[0].close - 1) * 100
  };
}

// Convertit une série de valeurs nominales en "pouvoir d'achat d'aujourd'hui"
// à partir d'un vrai indice d'inflation (points {period, value} — plus la
// valeur est haute, plus les prix ont augmenté). Renvoie null pour les points
// hors de la période couverte par l'indice — jamais une valeur inventée pour boucher un trou.
function computeRealValueSeries(dates, valueSeries, inflationPoints){
  if(!inflationPoints || inflationPoints.length === 0) return dates.map(() => null);
  const idx = {};
  inflationPoints.forEach(p => { idx[p.period] = p.value; });
  const latest = inflationPoints[inflationPoints.length - 1].value;
  return dates.map((d, i) => {
    const iv = idx[d];
    if(typeof iv !== 'number') return null;
    return valueSeries[i] * (latest / iv);
  });
}

// ---------- Crédit immobilier complet (P0-3) ----------
// Étend loanMonthlyPayment avec un vrai tableau d'amortissement mois par
// mois (intérêts/capital/CRD), l'assurance et les frais annexes.
function computeLoanAmortization(capital, rateAnnual, years, insuranceRatePct, fraisAnnexes){
  const monthlyPayment = capital > 0 ? loanMonthlyPayment(capital, rateAnnual, years) : 0;
  const n = Math.round(years * 12);
  const rm = rateAnnual / 100 / 12;
  let balance = capital;
  const schedule = [];
  let totalInterest = 0;
  for(let m = 1; m <= n; m++){
    const interest = rm === 0 ? 0 : balance * rm;
    let principal = monthlyPayment - interest;
    if(principal > balance) principal = balance;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    schedule.push({month: m, interest, principal, balance});
  }
  const insuranceMonthly = capital * ((insuranceRatePct || 0) / 100) / 12;
  const totalInsurance = insuranceMonthly * n;
  const totalCost = capital + totalInterest + totalInsurance + (fraisAnnexes || 0);
  return {
    monthlyPayment,
    monthlyPaymentWithInsurance: monthlyPayment + insuranceMonthly,
    insuranceMonthly,
    totalInterest, totalInsurance,
    fraisAnnexes: fraisAnnexes || 0,
    totalCost,
    schedule
  };
}

// ---------- Décision d'investissement (Finance d'entreprise, section 9 du
// prompt "Extension des domaines") : VAN et TRI à partir de flux de
// trésorerie annuels réels saisis par l'utilisateur — jamais une prédiction,
// toujours le résultat mécanique des hypothèses fournies. ----------
// VAN = -investissement initial + somme des flux actualisés au taux donné.
function computeVAN(investissementInitial, cashFlows, tauxActualisationPct){
  const r = tauxActualisationPct / 100;
  let van = -investissementInitial;
  cashFlows.forEach((cf, i) => { van += cf / Math.pow(1 + r, i + 1); });
  return van;
}
// TRI = le taux pour lequel la VAN est nulle. Pas de formule fermée en
// général : recherche par bissection sur l'intervalle -99%/+500%. Si la VAN
// ne change jamais de signe sur cet intervalle (ex. tous les flux négatifs),
// aucun TRI n'existe dans cette plage — retourne null plutôt qu'une valeur
// approchée trompeuse.
function computeTRI(investissementInitial, cashFlows){
  const vanAt = r => computeVAN(investissementInitial, cashFlows, r * 100);
  let lo = -0.99, hi = 5;
  const vLo = vanAt(lo), vHi = vanAt(hi);
  if(vLo === 0) return lo * 100;
  if(vHi === 0) return hi * 100;
  if((vLo > 0) === (vHi > 0)) return null; // pas de changement de signe -> pas de TRI trouvable sur cette plage
  for(let i = 0; i < 100; i++){
    const mid = (lo + hi) / 2;
    const vMid = vanAt(mid);
    if(Math.abs(vMid) < 0.01) return mid * 100;
    if((vMid > 0) === (vLo > 0)) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}
// Construit la série de cash-flows annuels à partir d'hypothèses simplifiées
// (CA additionnel généré la 1ère année, croissance annuelle, marge nette sur
// ce CA) — jamais une croissance ou une marge inventée, toujours celles
// saisies par l'utilisateur, explicitement présentées comme des hypothèses.
function computeInvestmentProjectCashFlows(caAnnee1, croissancePct, margePct, dureeAnnees){
  const cashFlows = [];
  let ca = caAnnee1;
  for(let t = 0; t < dureeAnnees; t++){
    if(t > 0) ca *= (1 + croissancePct / 100);
    cashFlows.push(ca * (margePct / 100));
  }
  return cashFlows;
}

// ---------- DCF (valorisation par flux de trésorerie actualisés) — outil
// interactif demandé par l'audit de couverture pédagogique (25/08/2026,
// section AMÉLIORATION : "DCF comme outil interactif, au lieu d'un exercice
// à chiffres fixes"). Réutilise computeVAN (déjà utilisé par le simulateur
// "Faut-il investir ?") pour la valeur actuelle des flux explicites, et y
// ajoute une valeur terminale (modèle de croissance perpétuelle de Gordon :
// TV = FCF final × (1+g) ÷ (WACC−g)), elle-même actualisée. Retourne null si
// WACC ≤ g : la formule de croissance perpétuelle diverge mathématiquement
// dans ce cas (une entreprise ne peut pas croître indéfiniment plus vite que
// son coût du capital), jamais une valeur fabriquée dans ce cas invalide. ----------
function computeDCFValuation(cashFlows, waccPct, terminalGrowthPct){
  if(!Array.isArray(cashFlows) || cashFlows.length === 0) return null;
  if(!(waccPct > terminalGrowthPct)) return null;
  const n = cashFlows.length;
  const finalFCF = cashFlows[n - 1];
  const wacc = waccPct / 100, g = terminalGrowthPct / 100;
  const pvOfExplicitFlows = computeVAN(0, cashFlows, waccPct);
  const terminalValue = (finalFCF * (1 + g)) / (wacc - g);
  const discountedTerminalValue = terminalValue / Math.pow(1 + wacc, n);
  const enterpriseValue = pvOfExplicitFlows + discountedTerminalValue;
  const terminalValueSharePct = enterpriseValue !== 0 ? (discountedTerminalValue / enterpriseValue) * 100 : 0;
  return {pvOfExplicitFlows, terminalValue, discountedTerminalValue, enterpriseValue, terminalValueSharePct};
}

// ---------- LBO (rachat par effet de levier, section 13 du prompt "Extension
// des domaines" : M&A/PE/VC) : illustre mécaniquement pourquoi la dette
// amplifie le rendement sur le capital investi (effet de levier), jamais une
// prédiction — simplification volontaire : remboursement de dette linéaire
// piloté par un % saisi par l'utilisateur, pas de coût d'intérêt modélisé
// séparément (voir renderMethodologyPanel côté UI pour les limites). ----------
function computeLBOReturns(prixAchat, dette, ebitdaInitial, croissanceEbitdaPct, multipleSortie, dureeAnnees, pctDetteRembourseePct){
  const equityInitial = prixAchat - dette;
  if(!(equityInitial > 0) || !(dureeAnnees > 0) || !(ebitdaInitial > 0)) return null;
  const ebitdaSortie = ebitdaInitial * Math.pow(1 + croissanceEbitdaPct / 100, dureeAnnees);
  const veSortie = ebitdaSortie * multipleSortie;
  const detteRestante = Math.max(0, dette * (1 - pctDetteRembourseePct / 100));
  const equitySortie = veSortie - detteRestante;
  const multipleEquity = equitySortie / equityInitial;
  const multipleEV = prixAchat > 0 ? veSortie / prixAchat : null;
  const triApprox = multipleEquity > 0 ? (Math.pow(multipleEquity, 1 / dureeAnnees) - 1) * 100 : null;
  return {equityInitial, ebitdaSortie, veSortie, detteRestante, equitySortie, multipleEquity, multipleEV, triApprox};
}

// ---------- Value at Risk paramétrique (section 15 du prompt "Extension des
// domaines" : mathématiques financières avancées / finance quantitative).
// Convention Bâle usuelle (z-score fixé pour 3 niveaux de confiance standards,
// jamais une fonction de répartition normale inverse générale — inutile ici
// et source d'erreur d'implémentation) + règle "racine du temps" pour mettre
// à l'échelle une volatilité annuelle sur l'horizon choisi. Hypothèse
// explicite (voir renderMethodologyPanel côté UI) : rendements supposés
// suivre une loi normale — une simplification aux limites connues (queues de
// distribution plus épaisses en réalité), jamais présentée comme un fait. ----------
const VAR_Z_SCORES = {90: 1.2816, 95: 1.645, 99: 2.326};
function computeParametricVaR(portefeuilleValeur, rendementAnnuelPct, volatiliteAnnuellePct, niveauConfiance, horizonJours){
  const z = VAR_Z_SCORES[niveauConfiance];
  if(!z || !(portefeuilleValeur > 0) || !(volatiliteAnnuellePct >= 0) || !(horizonJours > 0)) return null;
  const horizonAnnees = horizonJours / 252;
  const moyenneHorizon = (rendementAnnuelPct / 100) * horizonAnnees;
  const volatiliteHorizon = (volatiliteAnnuellePct / 100) * Math.sqrt(horizonAnnees);
  const perteEnPct = z * volatiliteHorizon - moyenneHorizon;
  const perteEnMontant = portefeuilleValeur * Math.max(0, perteEnPct);
  return {z, horizonAnnees, moyenneHorizon, volatiliteHorizon, perteEnPct, perteEnMontant};
}

// ---------- Obligations : prix et rendement à l'échéance (YTM) — calculateur
// explicitement demandé par l'audit de couverture pédagogique (25/08/2026,
// section F "Obligations"), jusqu'ici absent malgré un exercice statique
// expliquant seulement le SENS de la relation prix/taux, jamais son ampleur
// chiffrée. Deux fonctions pures et complémentaires :
// - computeBondPrice : formule fermée classique (somme des coupons actualisés
//   + valeur nominale actualisée), taux connu → prix.
// - computeBondYTM : aucune formule fermée n'existe pour le YTM d'une
//   obligation à coupons — recherche numérique par bissection, cas d'usage
//   canonique de cette méthode. Le prix est une fonction strictement
//   décroissante du taux (coupons et remboursement final tous actualisés
//   plus fortement à taux plus élevé), donc la bissection converge toujours
//   sur l'intervalle -99%..+100% (largement au-delà de tout cas réel).
// Convention : coupon versé paymentsPerYear fois par an (1 = annuel, valeur
// par défaut ; 2 = semestriel, comme la plupart des obligations d'État US).
// Jamais un résultat approximatif présenté comme exact : computeBondYTM
// retourne null si les bornes ne encadrent pas le prix visé, plutôt qu'une
// valeur fausse silencieusement renvoyée. ----------
function computeBondPrice(faceValue, couponRatePct, yearsToMaturity, marketRatePct, paymentsPerYear){
  const n = paymentsPerYear || 1;
  if(!(faceValue > 0) || !(yearsToMaturity > 0) || !(n >= 1) || typeof couponRatePct !== 'number' || typeof marketRatePct !== 'number') return null;
  const totalPeriods = Math.round(yearsToMaturity * n);
  if(totalPeriods < 1) return null;
  const couponPerPeriod = (couponRatePct / 100) * faceValue / n;
  const ratePerPeriod = (marketRatePct / 100) / n;
  let price = 0;
  for(let t = 1; t <= totalPeriods; t++){
    price += couponPerPeriod / Math.pow(1 + ratePerPeriod, t);
  }
  price += faceValue / Math.pow(1 + ratePerPeriod, totalPeriods);
  return price;
}
function computeBondYTM(price, faceValue, couponRatePct, yearsToMaturity, paymentsPerYear){
  const n = paymentsPerYear || 1;
  if(!(price > 0) || !(faceValue > 0) || !(yearsToMaturity > 0)) return null;
  let lo = -99, hi = 100;
  const priceAtLo = computeBondPrice(faceValue, couponRatePct, yearsToMaturity, lo, n);
  const priceAtHi = computeBondPrice(faceValue, couponRatePct, yearsToMaturity, hi, n);
  if(priceAtLo == null || priceAtHi == null || !(priceAtLo > price) || !(priceAtHi < price)) return null;
  let mid = 0, priceAtMid;
  for(let i = 0; i < 200; i++){
    mid = (lo + hi) / 2;
    priceAtMid = computeBondPrice(faceValue, couponRatePct, yearsToMaturity, mid, n);
    if(priceAtMid == null) return null;
    if(Math.abs(priceAtMid - price) < 0.0001) return mid;
    if(priceAtMid > price) lo = mid; else hi = mid;
  }
  return mid;
}

// ---------- Forex : calculateur de taille de position — explicitement
// demandé par l'audit de couverture pédagogique (25/08/2026, section H
// "Forex"), jusqu'ici totalement absent (0 outil). Formule standard de
// gestion du risque par trade : taille de position = montant risqué ÷
// (distance du stop-loss en pips × valeur du pip pour 1 lot).
// La valeur du pip pour 1 lot est calculée mathématiquement (lot × taille
// du pip), jamais approximée depuis un taux de change en direct — elle
// s'exprime dans la devise de COTATION de la paire (la 2e devise, ex. USD
// pour EUR/USD), jamais dans une devise arbitraire : convertir le montant
// risqué dans cette même devise reste à la charge de l'utilisateur si son
// compte est libellé dans une autre devise (limite documentée côté UI,
// jamais un taux de change inventé pour combler ce trou). ----------
function computeForexPipValue(unitsPerLot, pipDecimalPlaces){
  if(!(unitsPerLot > 0)) return null;
  const pipSize = pipDecimalPlaces === 2 ? 0.01 : 0.0001;
  return unitsPerLot * pipSize;
}
function computeForexPositionSize(accountRiskAmount, stopLossPips, unitsPerLot, pipDecimalPlaces){
  if(!(accountRiskAmount > 0) || !(stopLossPips > 0) || !(unitsPerLot > 0)) return null;
  const pipValuePerLot = computeForexPipValue(unitsPerLot, pipDecimalPlaces);
  if(pipValuePerLot == null) return null;
  const positionSizeInLots = accountRiskAmount / (stopLossPips * pipValuePerLot);
  return {pipValuePerLot, positionSizeInLots, positionSizeInUnits: positionSizeInLots * unitsPerLot};
}

// ---------- Calculateur de taille de position générique (actions, crypto,
// tout actif tradé à l'unité) — dernier point AMÉLIORATION de l'audit de
// couverture pédagogique (25/08/2026). Applique exactement la formule déjà
// documentée dans le terme Bibliothèque "Taille de position" (categorie
// Gestion du risque, construite lors du pilier Trading) : taille = montant
// risqué ÷ distance entre le prix d'entrée et le stop-loss — jamais un
// résultat retourné si le stop-loss est égal au prix d'entrée (risque par
// unité nul, division impossible), plutôt qu'une taille infinie fabriquée. ----------
function computeTradePositionSize(accountCapital, riskPct, entryPrice, stopLossPrice){
  if(!(accountCapital > 0) || !(riskPct > 0) || !(entryPrice > 0) || !(stopLossPrice > 0)) return null;
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
  if(!(riskPerUnit > 0)) return null;
  const riskAmount = accountCapital * (riskPct / 100);
  const positionSizeUnits = riskAmount / riskPerUnit;
  const positionValueAtEntry = positionSizeUnits * entryPrice;
  return {riskAmount, riskPerUnit, positionSizeUnits, positionValueAtEntry};
}

// ---------- Dettes & crédits : stratégie de remboursement multi-crédits ----------
// Simulation mois par mois (avalanche = taux le plus élevé d'abord, snowball =
// plus petit solde d'abord, custom = ordre fourni) — jamais une formule
// fermée, car l'ordre de priorité change à chaque mois selon les soldes
// restants. Une mensualité minimale qui ne couvre même pas les intérêts du
// mois (amortissement négatif) est détectée et retournée comme une erreur
// explicite, jamais une simulation qui boucle indéfiniment ou un résultat
// silencieusement faux. Garde-fou à 600 mois (50 ans) : au-delà, le plan
// n'est jamais présenté comme complet.
function computeDebtPayoffPlan(debts, strategy, extraMonthly, customOrder){
  if(!Array.isArray(debts) || debts.length === 0) return null;
  const clean = debts.filter(d => d && typeof d.balance === 'number' && d.balance > 0 && typeof d.rate === 'number' && d.rate >= 0 && typeof d.minPayment === 'number' && d.minPayment > 0);
  if(clean.length === 0) return null;
  const negative = clean.filter(d => d.minPayment <= (d.rate / 100 / 12) * d.balance);
  if(negative.length > 0) return {error: 'negative-amortization', debts: negative.map(d => d.label || '')};

  let balances = clean.map(d => ({...d}));
  const baseExtra = typeof extraMonthly === 'number' && extraMonthly > 0 ? extraMonthly : 0;
  let rolloverExtra = 0; // mensualités libérées par des dettes déjà soldées, réutilisées à partir du mois suivant (effet boule de neige)

  function priorityOrder(){
    const active = balances.map((d, i) => i).filter(i => balances[i].balance > 0);
    if(strategy === 'avalanche') return active.sort((a, b) => balances[b].rate - balances[a].rate);
    if(strategy === 'snowball') return active.sort((a, b) => balances[a].balance - balances[b].balance);
    if(strategy === 'custom' && Array.isArray(customOrder)) return customOrder.filter(i => active.includes(i));
    return active;
  }

  let month = 0;
  let totalInterest = 0;
  const maxMonths = 600;
  while(balances.some(d => d.balance > 0.01) && month < maxMonths){
    month++;
    let newlyFreed = 0;
    balances.forEach(d => {
      if(d.balance <= 0) return;
      const interest = d.balance * (d.rate / 100 / 12);
      totalInterest += interest;
      d.balance += interest;
      const payment = Math.min(d.minPayment, d.balance);
      d.balance -= payment;
      if(d.balance <= 0.01){ d.balance = 0; newlyFreed += d.minPayment; }
    });
    let pool = baseExtra + rolloverExtra;
    priorityOrder().forEach(idx => {
      if(pool <= 0) return;
      const d = balances[idx];
      const pay = Math.min(pool, d.balance);
      d.balance -= pay;
      pool -= pay;
      if(d.balance <= 0.01) d.balance = 0;
    });
    rolloverExtra += newlyFreed;
  }
  return {
    months: month, years: month / 12, totalInterest,
    completed: balances.every(d => d.balance <= 0.01),
    strategy
  };
}
function renderDebtPayoffComparison(debts, extraMonthly){
  if(!Array.isArray(debts) || debts.length === 0){
    return `<p style="color:var(--text-dim);font-size:13px;">Ajoute au moins un crédit réel pour comparer les stratégies.</p>`;
  }
  const baseline = computeDebtPayoffPlan(debts, 'avalanche', 0);
  if(baseline && baseline.error){
    return `<p style="color:var(--bordeaux);font-size:13px;">${renderDataBadge('avis')} La mensualité minimale de <strong>${baseline.debts.join(', ')}</strong> ne couvre même pas les intérêts du mois — la dette augmenterait indéfiniment avec ces valeurs (amortissement négatif). Vérifie le taux et la mensualité saisis.</p>`;
  }
  if(!baseline) return `<p style="color:var(--text-dim);font-size:13px;">Renseigne un solde, un taux et une mensualité réels pour chaque crédit.</p>`;
  const avalanche = computeDebtPayoffPlan(debts, 'avalanche', extraMonthly);
  const snowball = computeDebtPayoffPlan(debts, 'snowball', extraMonthly);

  const fmtEUR = v => Math.round(v).toLocaleString('fr-FR') + ' €';
  const fmtDuree = months => months >= 12 ? `${Math.floor(months / 12)} an(s) et ${months % 12} mois` : `${months} mois`;
  const rows = [
    {label: 'Taux le plus élevé d\'abord (avalanche)', plan: avalanche},
    {label: 'Plus petit solde d\'abord (boule de neige)', plan: snowball}
  ];

  return `
    <p style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">${renderDataBadge('calcul')} Comparaison calculée mois par mois à partir des vrais soldes, taux et mensualités minimales saisis${extraMonthly > 0 ? `, avec ${fmtEUR(extraMonthly)}/mois supplémentaires` : ''}.</p>
    <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;">
      <thead><tr><th style="text-align:left;padding:6px 8px;">Stratégie</th><th style="text-align:right;padding:6px 8px;">Durée</th><th style="text-align:right;padding:6px 8px;">Intérêts totaux</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td style="padding:6px 8px;">${r.label}${!r.plan.completed ? ' ⚠️' : ''}</td><td style="text-align:right;padding:6px 8px;">${fmtDuree(r.plan.months)}</td><td style="text-align:right;padding:6px 8px;">${fmtEUR(r.plan.totalInterest)}</td></tr>`).join('')}</tbody>
    </table></div>
    ${(!avalanche.completed || !snowball.completed) ? `<p style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">⚠️ Avec ces paramètres, le remboursement dépasse 50 ans dans la simulation — les mensualités saisies sont probablement insuffisantes.</p>` : ''}
    <p style="font-size:12px;color:var(--text-dim);margin-top:10px;">Avec les mensualités minimales seules (sans effort supplémentaire) : ${fmtDuree(baseline.months)}, ${fmtEUR(baseline.totalInterest)} d'intérêts au total.</p>
    ${extraMonthly > 0 ? `<p style="font-size:12px;color:var(--emerald);margin-top:4px;">Économie grâce aux ${fmtEUR(extraMonthly)}/mois supplémentaires : ${fmtEUR(baseline.totalInterest - Math.min(avalanche.totalInterest, snowball.totalInterest))} d'intérêts en moins, terminé ${fmtDuree(baseline.months - Math.min(avalanche.months, snowball.months))} plus tôt.</p>` : ''}`;
}

// ---------- Dettes & crédits : regrouper ou conserver ses crédits ----------
// Réutilise computeLoanAmortization (déjà utilisé pour le crédit immobilier)
// pour le nouveau prêt regroupé — jamais une deuxième formule de mensualité
// dupliquée. Le point du chantier (section 7 du plan) : une mensualité plus
// faible ne signifie jamais automatiquement un coût total inférieur, le
// calcul doit pouvoir montrer les deux à la fois, jamais un seul chiffre.
function computeDebtConsolidation(debts, newLoan){
  if(!Array.isArray(debts) || debts.length === 0) return null;
  if(!newLoan || !(newLoan.amount > 0) || typeof newLoan.rate !== 'number' || !(newLoan.years > 0)) return null;
  const current = computeDebtPayoffPlan(debts, 'avalanche', 0);
  if(!current || current.error) return null;
  const currentMonthly = debts.reduce((s, d) => s + (d.minPayment || 0), 0);
  const currentTotalCost = debts.reduce((s, d) => s + (d.balance || 0), 0) + current.totalInterest;

  const amort = computeLoanAmortization(newLoan.amount, newLoan.rate, newLoan.years, 0, newLoan.fees || 0);
  const consolidatedMonths = Math.round(newLoan.years * 12);

  return {
    current: {monthly: currentMonthly, totalCost: currentTotalCost, months: current.months},
    consolidated: {monthly: amort.monthlyPayment, totalCost: amort.totalCost, months: consolidatedMonths},
    monthlyDiff: amort.monthlyPayment - currentMonthly,
    totalCostDiff: amort.totalCost - currentTotalCost
  };
}
function renderDebtConsolidationComparison(debts, newLoan){
  if(!Array.isArray(debts) || debts.length === 0){
    return `<p style="color:var(--text-dim);font-size:13px;">Ajoute au moins un crédit réel à regrouper.</p>`;
  }
  const result = computeDebtConsolidation(debts, newLoan);
  if(!result){
    return `<p style="color:var(--text-dim);font-size:13px;">Renseigne des valeurs réelles (soldes, taux, mensualités, et les paramètres du nouveau prêt) pour comparer.</p>`;
  }
  const fmtEUR = v => Math.round(v).toLocaleString('fr-FR') + ' €';
  const fmtDuree = months => months >= 12 ? `${Math.floor(months / 12)} an(s) et ${months % 12} mois` : `${months} mois`;
  const monthlyLower = result.monthlyDiff < 0;
  const totalCostHigher = result.totalCostDiff > 0;
  return `
    <p style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">${renderDataBadge('calcul')} Comparaison calculée à partir des vrais crédits saisis et des paramètres du nouveau prêt.</p>
    <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;">
      <thead><tr><th style="text-align:left;padding:6px 8px;"></th><th style="text-align:right;padding:6px 8px;">Mensualité</th><th style="text-align:right;padding:6px 8px;">Coût total</th><th style="text-align:right;padding:6px 8px;">Durée</th></tr></thead>
      <tbody>
        <tr><td style="padding:6px 8px;">Situation actuelle</td><td style="text-align:right;padding:6px 8px;">${fmtEUR(result.current.monthly)}</td><td style="text-align:right;padding:6px 8px;">${fmtEUR(result.current.totalCost)}</td><td style="text-align:right;padding:6px 8px;">${fmtDuree(result.current.months)}</td></tr>
        <tr><td style="padding:6px 8px;">Crédit regroupé</td><td style="text-align:right;padding:6px 8px;">${fmtEUR(result.consolidated.monthly)}</td><td style="text-align:right;padding:6px 8px;">${fmtEUR(result.consolidated.totalCost)}</td><td style="text-align:right;padding:6px 8px;">${fmtDuree(result.consolidated.months)}</td></tr>
      </tbody>
    </table></div>
    <p style="font-size:12.5px;margin-top:10px;">Mensualité ${monthlyLower ? 'plus basse' : 'plus élevée'} de ${fmtEUR(Math.abs(result.monthlyDiff))}${monthlyLower ? ', mais' : ' et'} coût total ${totalCostHigher ? 'plus élevé' : 'plus bas'} de ${fmtEUR(Math.abs(result.totalCostDiff))}.</p>
    ${monthlyLower && totalCostHigher ? `<p class="disclaimer-box" style="margin-top:10px;"><strong>Une mensualité plus faible ne signifie pas un coût total inférieur.</strong> Ici, regrouper allège la mensualité mais coûte plus cher au total — souvent parce que la durée s'allonge.</p>` : ''}`;
}

// ---------- Transport : coût total de possession d'un véhicule ----------
// Outlay total réellement dépensé (achat ou crédit, carburant/électricité,
// assurance, entretien, carte grise) moins une valeur de revente estimée par
// décote annuelle constante — la décote n'est jamais une donnée officielle,
// juste l'hypothèse choisie par l'utilisateur, toujours signalée comme telle.
// Le même formulaire sert aussi bien un véhicule essence qu'électrique
// (consommation + prix de l'unité d'énergie saisis librement) — jamais deux
// calculs séparés dupliqués pour la même formule.
function computeVehicleTCO(inputs){
  const {price, financing, downPayment, creditRate, consumptionPer100, fuelPricePerUnit, kmPerYear, insuranceAnnual, maintenanceAnnual, depreciationRatePct, possessionYears, cartGrise} = inputs || {};
  if(!(price > 0) || !(possessionYears > 0) || typeof kmPerYear !== 'number' || kmPerYear < 0) return null;
  if(typeof consumptionPer100 !== 'number' || consumptionPer100 < 0 || typeof fuelPricePerUnit !== 'number' || fuelPricePerUnit < 0) return null;
  if(typeof insuranceAnnual !== 'number' || insuranceAnnual < 0 || typeof maintenanceAnnual !== 'number' || maintenanceAnnual < 0) return null;
  if(typeof depreciationRatePct !== 'number' || depreciationRatePct < 0 || depreciationRatePct > 100) return null;

  let purchaseOutlay, financingDetail = null;
  if(financing === 'credit'){
    const dp = typeof downPayment === 'number' && downPayment >= 0 ? downPayment : 0;
    const amort = computeLoanAmortization(Math.max(price - dp, 0), typeof creditRate === 'number' ? creditRate : 0, possessionYears);
    purchaseOutlay = dp + amort.totalCost;
    financingDetail = {monthlyPayment: amort.monthlyPayment, totalInterest: amort.totalInterest};
  } else {
    purchaseOutlay = price;
  }

  const fuelCost = (consumptionPer100 / 100) * kmPerYear * fuelPricePerUnit * possessionYears;
  const insuranceCost = insuranceAnnual * possessionYears;
  const maintenanceCost = maintenanceAnnual * possessionYears;
  const totalOutlay = purchaseOutlay + fuelCost + insuranceCost + maintenanceCost + (typeof cartGrise === 'number' ? cartGrise : 0);
  const resaleValue = price * Math.pow(1 - depreciationRatePct / 100, possessionYears);
  const netCost = totalOutlay - resaleValue;
  const totalKm = kmPerYear * possessionYears;

  return {
    totalOutlay, resaleValue, netCost,
    costPerKm: totalKm > 0 ? netCost / totalKm : null,
    fuelCost, insuranceCost, maintenanceCost, purchaseOutlay, financingDetail
  };
}
function renderVehicleTCOResult(result){
  if(!result) return `<p style="color:var(--text-dim);font-size:13px;">Renseigne des valeurs réelles (prix, consommation, kilométrage annuel, assurance, entretien) pour calculer le coût total de possession.</p>`;
  const fmtEUR = v => Math.round(v).toLocaleString('fr-FR') + ' €';
  return `
    <p style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">${renderDataBadge('calcul')} Calculé à partir des valeurs saisies (achat, carburant ou électricité, assurance, entretien) et d'une décote annuelle constante que tu choisis.</p>
    <div class="result-label">Coût net de possession</div>
    <div class="result-big">${fmtEUR(result.netCost)}</div>
    <div class="result-row"><span>Dépensé au total : ${fmtEUR(result.totalOutlay)}</span><span>Valeur de revente estimée : ${fmtEUR(result.resaleValue)}</span></div>
    ${result.costPerKm !== null ? `<p style="font-size:12.5px;margin-top:8px;">Soit environ <strong>${result.costPerKm.toFixed(2).replace('.', ',')} € / km</strong> parcouru sur cette période.</p>` : ''}
    <div style="margin-top:12px;font-size:12.5px;color:var(--text-dim);">
      <p>Carburant / électricité : ${fmtEUR(result.fuelCost)}</p>
      <p>Assurance : ${fmtEUR(result.insuranceCost)}</p>
      <p>Entretien : ${fmtEUR(result.maintenanceCost)}</p>
      ${result.financingDetail ? `<p>Dont intérêts du crédit : ${fmtEUR(result.financingDetail.totalInterest)}</p>` : ''}
    </div>
    <p style="font-size:11.5px;color:var(--text-dim);margin-top:10px;">La valeur de revente est une estimation basée sur le taux de décote annuel que tu as choisi — la vraie décote dépend du modèle, de l'état et du marché de l'occasion au moment de la revente, jamais une donnée officielle.</p>`;
}

// ---------- Transport : comptant, crédit, LOA ou LLD ? ----------
// Jamais une option présentée par défaut comme la meilleure (section 6 du
// plan) — la LOA/LLD est saisie directement par l'utilisateur (mensualité
// réellement proposée par un concessionnaire), Likanza ne prétend pas la
// calculer depuis des premiers principes qu'il ne connaît pas (marge du
// loueur, valeur résiduelle contractuelle...).
function computeVehicleFinancingComparison(inputs){
  const {price, years, cashOpportunityRatePct, creditRate, loaMonthly, loaFinalOption, lldMonthly} = inputs || {};
  if(!(price > 0) || !(years > 0)) return null;

  const cashOpportunityCost = typeof cashOpportunityRatePct === 'number' && cashOpportunityRatePct > 0
    ? price * (Math.pow(1 + cashOpportunityRatePct / 100, years) - 1) : 0;
  const amort = typeof creditRate === 'number' && creditRate >= 0 ? computeLoanAmortization(price, creditRate, years) : null;
  const loaTotal = typeof loaMonthly === 'number' && loaMonthly > 0 ? loaMonthly * years * 12 + (typeof loaFinalOption === 'number' ? loaFinalOption : 0) : null;
  const lldTotal = typeof lldMonthly === 'number' && lldMonthly > 0 ? lldMonthly * years * 12 : null;

  return {
    cash: {totalCost: price, opportunityCost: cashOpportunityCost, owns: true},
    credit: amort ? {totalCost: amort.totalCost, monthlyPayment: amort.monthlyPayment, owns: true} : null,
    loa: loaTotal !== null ? {totalCost: loaTotal, owns: typeof loaFinalOption === 'number' && loaFinalOption > 0} : null,
    lld: lldTotal !== null ? {totalCost: lldTotal, owns: false} : null
  };
}
function renderVehicleFinancingComparison(result){
  if(!result) return `<p style="color:var(--text-dim);font-size:13px;">Renseigne au moins le prix du véhicule et la durée de comparaison.</p>`;
  const fmtEUR = v => Math.round(v).toLocaleString('fr-FR') + ' €';
  const rows = [{label: 'Comptant', totalCost: result.cash.totalCost, owns: true, extra: result.cash.opportunityCost > 0 ? `Coût d'opportunité si ce capital avait été investi : ${fmtEUR(result.cash.opportunityCost)}` : null}];
  if(result.credit) rows.push({label: 'Crédit', totalCost: result.credit.totalCost, owns: true, extra: `Mensualité : ${fmtEUR(result.credit.monthlyPayment)}`});
  if(result.loa) rows.push({label: "LOA (avec option d'achat)", totalCost: result.loa.totalCost, owns: result.loa.owns, extra: null});
  if(result.lld) rows.push({label: 'LLD (sans option d\'achat)', totalCost: result.lld.totalCost, owns: false, extra: null});

  return `
    <p style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">${renderDataBadge('calcul')} Comparaison calculée sur la même durée, à partir des valeurs réellement saisies — jamais une solution présentée par défaut comme la meilleure.</p>
    <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;">
      <thead><tr><th style="text-align:left;padding:6px 8px;">Solution</th><th style="text-align:right;padding:6px 8px;">Coût total</th><th style="text-align:center;padding:6px 8px;">Propriétaire à la fin</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td style="padding:6px 8px;">${r.label}</td><td style="text-align:right;padding:6px 8px;">${fmtEUR(r.totalCost)}</td><td style="text-align:center;padding:6px 8px;">${r.owns ? 'Oui' : 'Non'}</td></tr>`).join('')}</tbody>
    </table></div>
    ${rows.filter(r => r.extra).map(r => `<p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${r.label} — ${r.extra}</p>`).join('')}
    <p style="font-size:11.5px;color:var(--text-dim);margin-top:10px;">Le coût total le plus bas n'est pas automatiquement le meilleur choix : la LOA/LLD n'immobilise pas de capital et peut inclure l'entretien selon le contrat — vérifie les conditions réelles proposées avant de comparer uniquement sur ce chiffre.</p>`;
}

// ---------- Acheter ou louer, version sérieuse (P0-5) ----------
// Simulation mois par mois (pas une formule fermée) car le loyer augmente
// chaque année et le crédit s'amortit de façon non linéaire — un calcul en
// une étape ne représenterait pas fidèlement les deux trajectoires.
// Patrimoine net propriétaire = valeur du bien - capital restant dû.
// Patrimoine net locataire = apport + frais d'acquisition jamais dépensés,
// investis dès le départ, puis abondés chaque mois de la différence entre
// le coût mensuel réel du propriétaire et le coût mensuel du locataire
// (section 14 : coût d'opportunité de l'apport, jamais traité comme disparu).
function computeBuyVsRent(inputs){
  const {
    price, downPayment, rateAnnual, years, insuranceRatePct,
    fraisDossier, fraisGarantie, fraisNotairePct,
    chargesCoproAnnual, taxeFonciereAnnual, entretienAnnualPct, travauxOneOff,
    loyerMensuelInitial, chargesLocatairesMensuel, loyerHausseAnnuelPct,
    appreciationAnnualPct, opportunityRatePct,
    horizonsYears
  } = inputs;

  const loanCapital = Math.max(0, price - downPayment);
  const loan = computeLoanAmortization(loanCapital, rateAnnual, years, insuranceRatePct, 0);
  const fraisNotaire = price * ((fraisNotairePct || 0) / 100);
  const fraisAcquisition = (fraisDossier || 0) + (fraisGarantie || 0) + fraisNotaire;

  const maxHorizon = Math.max(...horizonsYears);
  const totalMonths = Math.round(maxHorizon * 12);
  let renterCapital = downPayment + fraisAcquisition;
  let loyer = loyerMensuelInitial;
  const monthlyOpp = (opportunityRatePct || 0) / 100 / 12;

  const yearly = [];
  for(let m = 1; m <= totalMonths; m++){
    if(m > 1 && (m - 1) % 12 === 0) loyer *= (1 + (loyerHausseAnnuelPct || 0) / 100);
    const scheduleRow = loan.schedule[m - 1];
    const mortgagePayment = scheduleRow ? loan.monthlyPaymentWithInsurance : 0;
    const ownerMonthlyExtra = (chargesCoproAnnual + taxeFonciereAnnual + price * (entretienAnnualPct || 0) / 100) / 12
      + (m === 1 ? (travauxOneOff || 0) : 0);
    const ownerMonthlyCost = mortgagePayment + ownerMonthlyExtra;
    const renterMonthlyCost = loyer + (chargesLocatairesMensuel || 0);
    renterCapital = renterCapital * (1 + monthlyOpp) + (ownerMonthlyCost - renterMonthlyCost);

    if(m % 12 === 0){
      const year = m / 12;
      const remainingDebt = scheduleRow ? scheduleRow.balance : 0;
      const propertyValue = price * Math.pow(1 + (appreciationAnnualPct || 0) / 100, year);
      yearly.push({
        year,
        ownerNetWorth: propertyValue - remainingDebt,
        renterNetWorth: renterCapital,
        propertyValue,
        remainingDebt
      });
    }
  }

  const breakeven = yearly.find(y => y.ownerNetWorth >= y.renterNetWorth) || null;
  const table = horizonsYears.map(h => yearly[h - 1]).filter(Boolean);

  return {
    monthlyPayment: loan.monthlyPaymentWithInsurance,
    fraisAcquisition,
    yearly,
    table,
    breakevenYear: breakeven ? breakeven.year : null
  };
}

// ---------- Graphique multi-lignes générique (SVG, même approche que renderPortfolioBacktestChart) ----------
// seriesList : [{data:[...nombres ou null...], color:'var(--gold-bright)', dashed:false, width:2}]
function renderMultiLineChart(seriesList, label){
  const w = 640, h = 220, padX = 12, padY = 14;
  const innerW = w - padX * 2, innerH = h - padY * 2;
  const allValues = seriesList.flatMap(s => s.data.filter(v => typeof v === 'number'));
  if(allValues.length === 0) return '<p style="color:var(--text-dim);font-size:12.5px;">Pas assez de données pour tracer ce graphique.</p>';
  const min = Math.min(...allValues), max = Math.max(...allValues);
  const span = (max - min) || 1;
  const len = Math.max(...seriesList.map(s => s.data.length));
  function toPoints(data){
    return data.map((v, i) => {
      if(typeof v !== 'number') return null;
      const x = padX + (i / (len - 1)) * innerW;
      const y = padY + (1 - (v - min) / span) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).filter(Boolean).join(' ');
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block;" role="img" aria-label="${label || "Graphique d'évolution de la valeur dans le temps"}">
    ${seriesList.map(s => `<polyline points="${toPoints(s.data)}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2}" ${s.dashed ? 'stroke-dasharray="4 3"' : ''} stroke-linejoin="round"/>`).join('')}
  </svg>`;
}

// ---------- Options : payoff à l'échéance (section "Options" de la refonte
// Bourse). Volontairement PAS un modèle de valorisation (type Black-Scholes) :
// un tel modèle exige des hypothèses de volatilité/taux qui donneraient une
// fausse impression de précision sur un prix théorique avant échéance. Ici,
// uniquement la mécanique certaine et non ambiguë du payoff à l'échéance
// (valeur intrinsèque − prime, ou l'inverse pour un vendeur) — un fait
// contractuel, pas une estimation. Formules vérifiées en direct sur des cas
// connus (long call/short put) avant intégration. ----------
function computeOptionPayoff(optionType, position, strike, premium, priceAtExpiry){
  if(!(strike >= 0) || !(premium >= 0) || !(priceAtExpiry >= 0)) return null;
  const intrinsic = optionType === 'call' ? Math.max(priceAtExpiry - strike, 0) : Math.max(strike - priceAtExpiry, 0);
  return position === 'long' ? intrinsic - premium : premium - intrinsic;
}
// maxGain/maxLoss null = perte ou gain non plafonné (jamais un chiffre inventé
// pour un risque qui, contractuellement, n'a pas de plafond).
function computeOptionMetrics(optionType, position, strike, premium){
  if(!(strike >= 0) || !(premium >= 0)) return null;
  const breakeven = optionType === 'call' ? strike + premium : strike - premium;
  let maxGain, maxLoss;
  if(optionType === 'call'){
    if(position === 'long'){ maxLoss = premium; maxGain = null; }
    else { maxGain = premium; maxLoss = null; }
  } else {
    const capped = Math.max(strike - premium, 0);
    if(position === 'long'){ maxLoss = premium; maxGain = capped; }
    else { maxGain = premium; maxLoss = capped; }
  }
  return {breakeven, maxGain, maxLoss};
}
// Diagramme de payoff (SVG, fonction profit/perte vs prix du sous-jacent à
// l'échéance — distinct de renderMultiLineChart, qui trace des séries
// temporelles par index, pas une fonction sur un axe de prix continu).
function renderPayoffDiagramSVG(optionType, position, strike, premium, priceMin, priceMax){
  const w = 640, h = 240, padX = 16, padY = 16;
  const innerW = w - padX * 2, innerH = h - padY * 2;
  const steps = 60;
  const points = [];
  for(let i = 0; i <= steps; i++){
    const price = priceMin + (i / steps) * (priceMax - priceMin);
    points.push({price, payoff: computeOptionPayoff(optionType, position, strike, premium, price)});
  }
  const payoffs = points.map(p => p.payoff);
  const maxAbs = Math.max(...payoffs.map(Math.abs), 1);
  const priceSpan = (priceMax - priceMin) || 1;
  function toX(price){ return padX + ((price - priceMin) / priceSpan) * innerW; }
  function toY(payoff){ return padY + innerH / 2 - (payoff / maxAbs) * (innerH / 2); }
  const pathPoints = points.map(p => `${toX(p.price).toFixed(1)},${toY(p.payoff).toFixed(1)}`).join(' ');
  const zeroY = toY(0);
  const strikeX = toX(strike);
  const color = position === 'long' ? 'var(--emerald)' : 'var(--bordeaux)';
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block;" role="img" aria-label="Diagramme de payoff à l'échéance">
    <line x1="${padX}" y1="${zeroY.toFixed(1)}" x2="${w - padX}" y2="${zeroY.toFixed(1)}" stroke="var(--hairline)" stroke-width="1"/>
    <line x1="${strikeX.toFixed(1)}" y1="${padY}" x2="${strikeX.toFixed(1)}" y2="${h - padY}" stroke="var(--hairline)" stroke-width="1" stroke-dasharray="3 3"/>
    <polyline points="${pathPoints}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`;
}

// ---------- Explication "pourquoi" (section 39) ----------
// Génère un court texte à partir des vrais chiffres calculés — jamais un
// commentaire générique pré-écrit indépendant du résultat.
function renderResultExplainer(elId, {invested, final, mainFactorLabel}){
  const el = document.getElementById(elId);
  if(!el) return;
  const gain = final - invested;
  const parts = [`<p>Tu as versé <strong>${fmtEUR(invested)}</strong>.</p>`];
  if(gain >= 0){
    parts.push(`<p>La différence jusqu'à <strong>${fmtEUR(final)}</strong> (+${fmtEUR(gain)}) provient de la croissance de la valeur sur cette période, pas de nouveaux versements.</p>`);
  } else {
    parts.push(`<p>Le résultat final (<strong>${fmtEUR(final)}</strong>) est inférieur au montant versé : sur cette période précise, la valeur a baissé plus qu'elle n'a progressé.</p>`);
  }
  if(mainFactorLabel) parts.push(`<p class="source-note" style="margin-top:10px;">Facteur déterminant dans cette simulation : ${mainFactorLabel}.</p>`);
  el.innerHTML = `<div class="result-explainer">${parts.join('')}</div>`;
}

function renderCashVsCreditTool(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13px;margin-bottom:16px;">Un même achat, deux façons de le financer sur la même durée : payer comptant puis investir chaque mois l'équivalent de la mensualité que tu aurais payée à la banque, ou emprunter et investir tout de suite la somme non dépensée.</p>
    <div class="slider-row field"><label for="${elId}-price">Prix de l'achat <span class="v mono" id="${elId}-price-v">15 000 €</span></label><input type="range" id="${elId}-price" min="1000" max="60000" step="500" value="15000"></div>
    <div class="slider-row field"><label for="${elId}-creditrate">Taux du crédit <span class="v mono" id="${elId}-creditrate-v">4 %</span></label><input type="range" id="${elId}-creditrate" min="0" max="12" step="0.1" value="4"></div>
    <div class="slider-row field"><label for="${elId}-investrate">Rendement d'investissement espéré <span class="v mono" id="${elId}-investrate-v">6 %</span></label><input type="range" id="${elId}-investrate" min="0" max="12" step="0.1" value="6"></div>
    <div class="slider-row field"><label for="${elId}-years">Durée <span class="v mono" id="${elId}-years-v">7 ans</span></label><input type="range" id="${elId}-years" min="1" max="25" step="1" value="7"></div>
    <div class="result-row" style="margin-top:4px;"><span>Mensualité du crédit : <strong id="${elId}-monthly">—</strong></span><span>Coût total du crédit (intérêts) : <strong id="${elId}-interest">—</strong></span></div>
    <div class="card-grid" style="margin:16px 0;">
      <div class="card"><span class="smallcaps">Cash + investir la mensualité</span><div class="result-big" style="font-size:26px;margin-top:6px;" id="${elId}-cash-final">—</div></div>
      <div class="card"><span class="smallcaps">Crédit + investir le capital</span><div class="result-big" style="font-size:26px;margin-top:6px;" id="${elId}-credit-final">—</div></div>
    </div>
    <p style="font-size:13.5px;margin-bottom:12px;" id="${elId}-verdict"></p>
    <div class="pattern-chart"><div id="${elId}-chart"></div></div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin:10px 0 4px;font-size:12px;color:var(--text-dim);">
      <span><span style="display:inline-block;width:10px;height:2px;background:var(--gold-bright);margin-right:6px;vertical-align:middle;"></span>Cash + investir la mensualité</span>
      <span><span style="display:inline-block;width:10px;height:2px;background:var(--text-dim);margin-right:6px;vertical-align:middle;"></span>Crédit + investir le capital</span>
    </div>
    <p class="disclaimer-box">Le taux du crédit est contractuel : une fois signé, il ne bouge pas. Le rendement d'investissement est une hypothèse que tu choisis toi-même : il n'est jamais garanti, peut être négatif certaines années, et les marchés réels restent imprévisibles. Ce comparateur applique tes hypothèses à une formule mathématique standard — ce n'est ni une prédiction, ni un conseil personnalisé.</p>`;

  function update(){
    const price = +document.getElementById(`${elId}-price`).value;
    const creditRate = +document.getElementById(`${elId}-creditrate`).value;
    const investRate = +document.getElementById(`${elId}-investrate`).value;
    const years = +document.getElementById(`${elId}-years`).value;
    document.getElementById(`${elId}-price-v`).textContent = fmtEUR(price);
    document.getElementById(`${elId}-creditrate-v`).textContent = creditRate + ' %';
    document.getElementById(`${elId}-investrate-v`).textContent = investRate + ' %';
    document.getElementById(`${elId}-years-v`).textContent = years + ' an' + (years>1?'s':'');

    const r = computeCashVsCreditComparison(price, creditRate, investRate, years);
    const better = r.creditFinalValue >= r.cashFinalValue;
    document.getElementById(`${elId}-monthly`).textContent = fmtEUR(r.monthlyPayment) + ' / mois';
    document.getElementById(`${elId}-interest`).textContent = fmtEUR(r.totalInterest);
    document.getElementById(`${elId}-cash-final`).textContent = fmtEUR(r.cashFinalValue);
    document.getElementById(`${elId}-credit-final`).textContent = fmtEUR(r.creditFinalValue);
    document.getElementById(`${elId}-verdict`).innerHTML = `Avec ces hypothèses, sur ${years} an${years>1?'s':''}, le scénario <strong>${better ? 'crédit + investir le capital' : 'cash + investir la mensualité'}</strong> aboutit à un patrimoine final plus élevé de ${fmtEUR(Math.abs(r.creditFinalValue - r.cashFinalValue))}.`;
    document.getElementById(`${elId}-chart`).innerHTML = renderPortfolioBacktestChart(r.cashSeries, r.creditSeries);
  }

  el.querySelectorAll('input[type="range"]').forEach(inp => inp.addEventListener('input', update));
  update();
}

function renderPrepayVsInvestTool(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13px;margin-bottom:16px;">Tu as une somme disponible : la mettre sur ton crédit en cours réduit les intérêts que tu paies (gain garanti, contractuel), ou tu peux l'investir (rendement supposé, jamais garanti).</p>
    <div class="slider-row field"><label for="${elId}-amount">Somme disponible <span class="v mono" id="${elId}-amount-v">5 000 €</span></label><input type="range" id="${elId}-amount" min="500" max="30000" step="500" value="5000"></div>
    <div class="slider-row field"><label for="${elId}-creditrate">Taux du crédit en cours <span class="v mono" id="${elId}-creditrate-v">4 %</span></label><input type="range" id="${elId}-creditrate" min="0" max="12" step="0.1" value="4"></div>
    <div class="slider-row field"><label for="${elId}-investrate">Rendement d'investissement espéré <span class="v mono" id="${elId}-investrate-v">6 %</span></label><input type="range" id="${elId}-investrate" min="0" max="12" step="0.1" value="6"></div>
    <div class="slider-row field"><label for="${elId}-years">Durée restante du crédit <span class="v mono" id="${elId}-years-v">10 ans</span></label><input type="range" id="${elId}-years" min="1" max="25" step="1" value="10"></div>
    <div class="card-grid" style="margin:16px 0;">
      <div class="card"><span class="smallcaps">Rembourser par anticipation</span><div class="result-big" style="font-size:26px;margin-top:6px;" id="${elId}-prepay-final">—</div><p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">Gain garanti (contractuel)</p></div>
      <div class="card"><span class="smallcaps">Investir la somme</span><div class="result-big" style="font-size:26px;margin-top:6px;" id="${elId}-invest-final">—</div><p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">Rendement non garanti</p></div>
    </div>
    <p style="font-size:13.5px;margin-bottom:12px;" id="${elId}-verdict"></p>
    <p class="disclaimer-box">Rembourser par anticipation procure un gain certain, équivalent au taux de ton crédit. Investir peut rapporter davantage, mais sans aucune garantie : le rendement réel peut être inférieur à l'hypothèse choisie, voire négatif. Ce comparateur applique tes hypothèses à une formule mathématique standard — ce n'est ni une prédiction, ni un conseil personnalisé.</p>`;

  function update(){
    const amount = +document.getElementById(`${elId}-amount`).value;
    const creditRate = +document.getElementById(`${elId}-creditrate`).value;
    const investRate = +document.getElementById(`${elId}-investrate`).value;
    const years = +document.getElementById(`${elId}-years`).value;
    document.getElementById(`${elId}-amount-v`).textContent = fmtEUR(amount);
    document.getElementById(`${elId}-creditrate-v`).textContent = creditRate + ' %';
    document.getElementById(`${elId}-investrate-v`).textContent = investRate + ' %';
    document.getElementById(`${elId}-years-v`).textContent = years + ' an' + (years>1?'s':'');

    const r = computePrepayVsInvestComparison(amount, creditRate, investRate, years);
    const better = r.investFinalValue >= r.prepayFinalValue;
    document.getElementById(`${elId}-prepay-final`).textContent = fmtEUR(r.prepayFinalValue);
    document.getElementById(`${elId}-invest-final`).textContent = fmtEUR(r.investFinalValue);
    document.getElementById(`${elId}-verdict`).innerHTML = `Avec ces hypothèses, sur ${years} an${years>1?'s':''}, ${better ? "investir aboutit à un montant plus élevé" : "rembourser par anticipation aboutit à un gain plus élevé"} de ${fmtEUR(Math.abs(r.investFinalValue - r.prepayFinalValue))}${better ? ", mais sans la garantie du remboursement" : ""}.`;
  }

  el.querySelectorAll('input[type="range"]').forEach(inp => inp.addEventListener('input', update));
  update();
}

// ---------- Apparition en fondu au scroll ----------
function initReveal(){
  try{
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('.card, .panel, .course-item, .glossary-item');
    if(prefersReduced || !('IntersectionObserver' in window)){
      return; // pas d'animation, contenu visible immédiatement
    }
    targets.forEach(el=>el.classList.add('fzr-reveal'));
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('fzr-in-view');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.08});
    targets.forEach(el=>io.observe(el));
    // Garde-fou : si l'observateur ne s'est pas déclenché (environnement d'aperçu,
    // iframe redimensionnée, etc.), on force la visibilité après un court délai
    // plutôt que de laisser du contenu invisible indéfiniment.
    setTimeout(()=>{
      document.querySelectorAll('.fzr-reveal:not(.fzr-in-view)').forEach(el=>{
        el.classList.add('fzr-in-view');
      });
    }, 1200);
  }catch(err){
    console.error('initReveal a échoué, contenu affiché sans animation :', err);
    document.querySelectorAll('.fzr-reveal').forEach(el=>el.classList.add('fzr-in-view'));
  }
}

// ---------- Watchlist personnelle (locale, avec seuils d'alerte) ----------
function getWatchlist(){ return safeGetJSON('fzr-watchlist', []); }
function saveWatchlist(list){ safeSetJSON('fzr-watchlist', list); }
function parseNumericValue(str){
  const n = Number(String(str).replace(/[^\d,.-]/g,'').replace(',', '.'));
  return isNaN(n) ? null : n;
}

// ---------- Actions suivies (page Bourse, liste modifiable) ----------
// Initialisée avec les 8 tickers STOCKS_DEMO, mais l'utilisateur peut en
// retirer et en ajouter d'autres via recherche libre (voir api/stock-search.js,
// api/custom-quotes.js). Seuls les tickers STOCKS_DEMO ont de vraies données
// fondamentales (PER, dividende...) : les autres n'affichent qu'un cours en
// direct réel et ne participent pas au Comparateur/Scénarios/Dividendes.
const FOLLOWED_STOCKS_MAX = 20;
// assetType ('stock'|'etf'|'index'|'forex'|'commodity'|'rate') distingue les
// actions des actifs de marché suivis (section "Autres marchés") — stocké à
// l'ajout plutôt que déduit du symbole, car certains tickers ETF (ex.
// "CW8.PA") ont exactement la même forme qu'un ticker action. Toute entrée
// déjà en localStorage sans ce champ (avant cette extension) est traitée
// comme 'stock', rétrocompatible avec les listes déjà suivies par les
// utilisateurs.
function getFollowedStocks(){
  let list = safeGetJSON('fzr-followed-stocks', null);
  if(list === null){
    // Premier chargement : on part des 8 valeurs de démonstration, en
    // reprenant une éventuelle liste de l'ancienne fonctionnalité séparée
    // (fzr-custom-stocks) pour ne rien perdre de ce qui avait déjà été ajouté.
    const defaults = STOCKS_DEMO.map(s => ({symbol: s.ticker, name: s.nom, assetType: 'stock'}));
    const legacy = safeGetJSON('fzr-custom-stocks', []).map(s => ({symbol: s.symbol, name: s.name, assetType: 'stock'}));
    const seen = new Set(defaults.map(s => s.symbol));
    legacy.forEach(s => { if(!seen.has(s.symbol)){ defaults.push(s); seen.add(s.symbol); } });
    list = defaults;
    saveFollowedStocks(list);
  }
  return list.map(s => ({...s, assetType: s.assetType || 'stock'}));
}
function saveFollowedStocks(list){ safeSetJSON('fzr-followed-stocks', list); }
function addFollowedStock(stock){
  const list = getFollowedStocks().filter(s => s.symbol !== stock.symbol);
  list.push({symbol: stock.symbol, name: stock.name, assetType: stock.assetType || 'stock'});
  saveFollowedStocks(list.slice(0, FOLLOWED_STOCKS_MAX));
}
function removeFollowedStock(symbol){
  saveFollowedStocks(getFollowedStocks().filter(s => s.symbol !== symbol));
}
function resetFollowedStocks(){
  saveFollowedStocks(STOCKS_DEMO.map(s => ({symbol: s.ticker, name: s.nom, assetType: 'stock'})));
}

// ---------- Recherche d'une action à ajouter (/api/stock-search) ----------
// Partagée entre bourse.html (Fiches actions, Comparateur) et dividende.html
// — n'importe quelle valeur réelle peut être ajoutée aux valeurs suivies
// depuis n'importe laquelle de ces pages, jamais une recherche limitée aux
// 8 valeurs de démonstration. Ne fait volontairement AUCUNE hypothèse sur
// l'état de la page appelante (pas de refreshAllStockViews/loadFundamentals
// codés en dur ici, propres à bourse.js) : tout rafraîchissement spécifique
// à la page se fait via le callback onAdded(symbol).
function wireStockSearch(inputEl, resultsEl, onAdded){
  if(!inputEl || !resultsEl) return;
  let timer = null;
  inputEl.addEventListener('input', ()=>{
    clearTimeout(timer);
    const q = inputEl.value.trim();
    if(q.length < 2){ resultsEl.innerHTML = ''; return; }
    timer = setTimeout(()=>{
      fetch('/api/stock-search?q=' + encodeURIComponent(q))
        .then(r=>r.json())
        .then(payload=>{
          const results = payload.results || [];
          if(results.length === 0){
            resultsEl.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Aucun résultat.</p>`;
            return;
          }
          resultsEl.innerHTML = results.map(r=>
            `<button class="pill" style="display:block;width:100%;text-align:left;margin-bottom:6px;" data-add-symbol="${r.symbol}" data-add-name="${r.name.replace(/"/g,'&quot;')}">${r.name} <span class="mono" style="color:var(--text-dim);">${r.symbol} · ${r.exchange}</span></button>`
          ).join('');
          resultsEl.querySelectorAll('[data-add-symbol]').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              const symbol = btn.dataset.addSymbol;
              addFollowedStock({symbol, name: btn.dataset.addName});
              inputEl.value = '';
              resultsEl.innerHTML = '';
              if(onAdded) onAdded(symbol);
            });
          });
        })
        .catch(()=>{ resultsEl.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Recherche momentanément indisponible.</p>`; });
    }, 300);
  });
}

// ================================================================
// ---------- Synchronisation de la progression sur un vrai compte ----------
// ================================================================
// Le jeton de synchronisation (signé HMAC, voir likanza-auth-app/lib/sync-
// token.js) est mis en cache par auth-bridge.js dans le MÊME objet que
// likanza-auth-user (champ syncToken), reçu une seule fois via le fragment
// d'URL au retour de connexion — jamais un cookie cross-site, bloqué par
// défaut sur Safari/Firefox (voir le commit "Evite le cookie cross-site" de
// likanza-auth). Sans jeton (non connecté, ou jeton expiré et jamais
// renouvelé), toute cette section reste silencieuse : le site continue de
// fonctionner entièrement en local, comme avant.
// Fonction plutôt que constante top-level : évite de dépendre de `location`
// dès le chargement du script (absent des harnais de test Node existants,
// qui ne l'exécutent jamais dans un navigateur) — seulement résolu au moment
// réel de la synchronisation.
function progressSyncApiUrl(){
  return (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api/progress'
    : 'https://likanza-auth.vercel.app/api/progress';
}

// Whitelist explicite : seule une vraie progression est synchronisée, jamais
// des préférences d'affichage locales (thème, langue) ni des données
// sensibles (session admin) ou de contenu éditorial (brouillons admin) — voir
// le plan de ce chantier pour le détail de chaque exclusion.
const PROGRESS_SYNC_KEYS = [
  'fzr-profile', 'fzr-investor-profile', 'fzr-followed-stocks', 'fzr-gamification',
  'fzr-level', 'fzr-progress', 'fzr-xp-repeat-counts', 'fzr-quiz-points-ledger',
  'fzr-quiz-stats', 'fzr-deep-quiz-results', 'fzr-mistakes', 'fzr-favorites',
  'fzr-cours-progress', 'fzr-defis-parcours-progress', 'fzr-daily-missions-log',
  'fzr-weekly-missions-log', 'fzr-activity-log', 'fzr-positioning-result',
  'fzr-business-project', 'fzr-business-game-history', 'fzr-portfolio-game-history',
  'fzr-business-strategy-transfer', 'fzr-unit-economics', 'fzr-watchlist', 'fzr-real-portfolio',
  'fzr-paper-trading', 'fzr-market-panic-history', 'fzr-gouverneur-history', 'fzr-clarity-feedback',
  'fzr-concepts-encountered', 'fzr-personal-debts', 'fzr-financial-goals', 'fzr-recurring-charges',
  'fzr-net-worth-assets', 'fzr-business-profile', 'fzr-budget-entries', 'fzr-net-worth-history',
  'fzr-business-expenses', 'fzr-business-scenarios'
];
// Métadonnée purement locale (jamais transmise) : distingue "cet appareil n'a
// jamais synchronisé" (première visite -> on restaure depuis le compte) de
// "cet appareil synchronise déjà" (il devient la source de vérité).
const PROGRESS_SYNC_MARKER = 'fzr-sync-last-at';

function getSyncToken(){
  const cached = safeGetJSON('likanza-auth-user', null);
  return cached && typeof cached.syncToken === 'string' ? cached.syncToken : null;
}

// Ne conserve que les clés réellement définies sur cet appareil — un
// utilisateur tout juste arrivé n'envoie pas 24 valeurs nulles.
function snapshotProgress(){
  const snap = {};
  PROGRESS_SYNC_KEYS.forEach(key => {
    const value = safeGetJSON(key, undefined);
    if(value !== undefined) snap[key] = value;
  });
  return snap;
}

// N'écrase que les clés présentes dans le snapshot reçu — une clé absente du
// compte (ex. ajoutée à la whitelist après coup) ne supprime jamais une
// donnée locale existante.
function applyProgressSnapshot(data){
  if(!data || typeof data !== 'object') return;
  PROGRESS_SYNC_KEYS.forEach(key => {
    if(Object.prototype.hasOwnProperty.call(data, key)) safeSetJSON(key, data[key]);
  });
}

function setProgressSyncStatus(text){
  const el = document.getElementById('progressSyncStatus');
  if(el) el.textContent = text;
  const btn = document.getElementById('restoreProgressBtn');
  if(btn) btn.style.display = getSyncToken() ? '' : 'none';
}

async function pushProgressSnapshot(token){
  try{
    const resp = await fetch(progressSyncApiUrl(), {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
      body: JSON.stringify(snapshotProgress())
    });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    return true;
  } catch(e){
    console.info('Likanza Academy — sauvegarde de la progression momentanément indisponible :', e.message);
    return false;
  }
}

// Point d'entrée principal, appelé une fois par chargement de page (voir le
// bloc DOMContentLoaded en fin de fichier) : décide s'il faut RESTAURER
// depuis le compte (premier appareil à se connecter après une inscription
// sur un autre appareil) ou POUSSER l'état local (cet appareil a déjà
// synchronisé au moins une fois, il devient la source de vérité). Jamais de
// fusion champ par champ — voir le disclaimer affiché dans compte.html.
async function syncProgressWithAccount(){
  const token = getSyncToken();
  if(!token){ setProgressSyncStatus('Connecte-toi pour synchroniser ta progression.'); return; }

  setProgressSyncStatus('Synchronisation…');
  let resp;
  try{
    resp = await fetch(progressSyncApiUrl(), {headers: {'Authorization': 'Bearer ' + token}});
  } catch(e){
    setProgressSyncStatus('Synchronisation momentanément indisponible (hors ligne ?).');
    return;
  }
  if(resp.status === 401){
    setProgressSyncStatus('Session de synchronisation expirée — reconnecte-toi pour reprendre la synchronisation.');
    return;
  }
  if(!resp.ok){
    setProgressSyncStatus('Synchronisation momentanément indisponible.');
    return;
  }
  const payload = await resp.json().catch(() => null);
  if(!payload){ setProgressSyncStatus('Synchronisation momentanément indisponible.'); return; }

  const hasSyncedBefore = !!safeGetJSON(PROGRESS_SYNC_MARKER, null);
  if(payload.data && !hasSyncedBefore){
    applyProgressSnapshot(payload.data);
  } else {
    await pushProgressSnapshot(token);
  }
  safeSetJSON(PROGRESS_SYNC_MARKER, new Date().toISOString());
  setProgressSyncStatus('Synchronisé à ' + new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) + '.');
}

// Bouton de secours (compte.html) : force une restauration depuis le compte,
// même si cet appareil a déjà synchronisé — le garde-fou explicite face à
// l'absence de fusion fine (voir le disclaimer affiché à côté du bouton).
async function forceRestoreProgress(){
  const token = getSyncToken();
  if(!token) return;
  setProgressSyncStatus('Restauration…');
  try{
    const resp = await fetch(progressSyncApiUrl(), {headers: {'Authorization': 'Bearer ' + token}});
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const payload = await resp.json();
    if(payload.data) applyProgressSnapshot(payload.data);
    safeSetJSON(PROGRESS_SYNC_MARKER, new Date().toISOString());
    setProgressSyncStatus('Restauré à ' + new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) + ' — recharge la page pour voir les changements.');
  } catch(e){
    setProgressSyncStatus('Restauration impossible pour le moment.');
  }
}
window.refreshProgressSyncStatus = syncProgressWithAccount;

// Repousse l'état local pendant que l'onglet reste ouvert, sans attendre un
// rechargement de page — jamais de nouvelle décision pull-vs-push ici
// (seulement au chargement, voir syncProgressWithAccount) pour ne jamais
// écraser une modification en cours par une donnée serveur plus ancienne.
// pagehide/beforeunload ne sont volontairement pas utilisés : un fetch()
// déclenché à ce moment est fréquemment annulé avant d'aboutir.
function initProgressSyncHeartbeat(){
  setInterval(() => {
    if(document.visibilityState !== 'visible') return;
    const token = getSyncToken();
    if(token) pushProgressSnapshot(token);
  }, 2 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState !== 'hidden') return;
    const token = getSyncToken();
    if(token) pushProgressSnapshot(token);
  });
}

// Indicateur factuel de tendance, calculé uniquement à partir de vraies
// données de prix (Yahoo Finance) — décrit la situation, ne recommande
// jamais d'acheter, vendre ou renforcer une position.
function computeTrendIndicator(history){
  if(!Array.isArray(history) || history.length < 2) return null;
  const closes = history.map(h => h.close).filter(c => typeof c === 'number');
  if(closes.length < 2) return null;
  const first = closes[0], last = closes[closes.length - 1];
  const changePct = ((last / first) - 1) * 100;
  const min = Math.min(...closes), max = Math.max(...closes);
  const range = max - min;
  const posPct = range > 0 ? ((last - min) / range) * 100 : 50;
  let posLabel = 'dans sa fourchette récente';
  if(posPct >= 85) posLabel = 'proche de son plus haut récent';
  else if(posPct <= 15) posLabel = 'proche de son plus bas récent';
  return {changePct, posLabel, days: closes.length};
}

// Analyse technique factuelle (fiche action) : moyennes mobiles et position
// du cours par rapport à elles, plus haut/bas de la période — uniquement
// des faits calculés sur de vraies données de prix, jamais un signal
// d'achat/vente/renforcement. Nécessite un historique suffisant (au moins
// 5 séances) ; les moyennes 20/50 jours sont omises si l'historique fourni
// est trop court plutôt que calculées sur un échantillon non représentatif.
// RSI (14 jours, méthode de lissage de Wilder — la méthode standard, pas une
// simple moyenne mobile sur la fenêtre de calcul) et bandes de Bollinger
// (20 jours, ±2 écarts-types — paramètres standards). Formules vérifiées en
// direct contre l'exemple de référence du RSI de Wilder (RSI ≈ 70,5 sur sa
// série de 15 clôtures) avant intégration ici. Comme pour les moyennes
// mobiles ci-dessous, omis (null) si l'historique fourni est trop court,
// jamais calculé sur un échantillon non représentatif.
function computeRSI(closes, period){
  period = period || 14;
  if(!Array.isArray(closes) || closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for(let i = 1; i <= period; i++){
    const diff = closes[i] - closes[i - 1];
    if(diff >= 0) gains += diff; else losses += -diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for(let i = period + 1; i < closes.length; i++){
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0, loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if(avgGain === 0 && avgLoss === 0) return 50;
  if(avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}
function computeBollingerBands(closes, period, numStdDev){
  period = period || 20; numStdDev = numStdDev || 2;
  if(!Array.isArray(closes) || closes.length < period) return null;
  const window = closes.slice(closes.length - period);
  const mean = window.reduce((a, b) => a + b, 0) / period;
  const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  const last = closes[closes.length - 1];
  return {
    middle: mean, upper: mean + numStdDev * stdDev, lower: mean - numStdDev * stdDev, stdDev, last,
    position: last > mean + numStdDev * stdDev ? 'above' : last < mean - numStdDev * stdDev ? 'below' : 'inside'
  };
}
// ---------- MACD (Moving Average Convergence Divergence, 12/26/9 — les
// paramètres standards) et indicateur de volume — pilier OPTIONNEL de
// l'audit de couverture pédagogique (25/08/2026), "MACD, volume comme
// indicateurs techniques supplémentaires". Réutilise le même historique
// déjà chargé pour RSI/Bollinger (aucun nouvel appel réseau) ; le volume
// vient de result.indicators.quote[0].volume (lib/yahoo.js), disponible
// dans la même réponse Yahoo Finance déjà consommée mais jusqu'ici jamais
// extraite. computeEMASeries amorce la moyenne exponentielle par une
// moyenne simple sur les `period` premières valeurs (convention standard),
// jamais par la première valeur seule (biais de démarrage plus fort). ----------
function computeEMASeries(values, period){
  if(!Array.isArray(values) || values.length < period) return null;
  const k = 2 / (period + 1);
  const series = [];
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  series[period - 1] = ema;
  for(let i = period; i < values.length; i++){
    ema = values[i] * k + ema * (1 - k);
    series[i] = ema;
  }
  return series;
}
function computeMACD(closes, fastPeriod, slowPeriod, signalPeriod){
  fastPeriod = fastPeriod || 12; slowPeriod = slowPeriod || 26; signalPeriod = signalPeriod || 9;
  if(!Array.isArray(closes) || closes.length < slowPeriod + signalPeriod) return null;
  const emaFast = computeEMASeries(closes, fastPeriod);
  const emaSlow = computeEMASeries(closes, slowPeriod);
  if(!emaFast || !emaSlow) return null;
  const macdSeries = [];
  for(let i = slowPeriod - 1; i < closes.length; i++){
    macdSeries.push(emaFast[i] - emaSlow[i]);
  }
  const signalSeries = computeEMASeries(macdSeries, signalPeriod);
  if(!signalSeries) return null;
  const macdLine = macdSeries[macdSeries.length - 1];
  const signalLine = signalSeries[signalSeries.length - 1];
  const histogram = macdLine - signalLine;
  const prevMacdLine = macdSeries.length >= 2 ? macdSeries[macdSeries.length - 2] : null;
  const prevSignalLine = signalSeries.length >= 2 ? signalSeries[signalSeries.length - 2] : null;
  let crossover = null;
  if(typeof prevMacdLine === 'number' && typeof prevSignalLine === 'number'){
    if(prevMacdLine <= prevSignalLine && macdLine > signalLine) crossover = 'bullish';
    else if(prevMacdLine >= prevSignalLine && macdLine < signalLine) crossover = 'bearish';
  }
  return {macdLine, signalLine, histogram, crossover};
}
// Volume moyen sur `period` séances comparé au volume de la dernière séance
// disponible — jamais une comparaison si le volume est absent des données
// (séance sans volume renvoyé par Yahoo Finance), plutôt qu'un 0 fabriqué.
function computeVolumeTrend(history, period){
  period = period || 20;
  if(!Array.isArray(history)) return null;
  const withVolume = history.filter(h => typeof h.volume === 'number');
  if(withVolume.length < period) return null;
  const lastVolume = withVolume[withVolume.length - 1].volume;
  const window = withVolume.slice(withVolume.length - period);
  const avgVolume = window.reduce((a, h) => a + h.volume, 0) / window.length;
  if(!(avgVolume > 0)) return null;
  return {lastVolume, avgVolume, ratioToAvg: lastVolume / avgVolume, aboveAverage: lastVolume > avgVolume};
}
function computeTechnicalIndicators(history){
  if(!Array.isArray(history) || history.length < 5) return null;
  const closes = history.map(h => h.close).filter(c => typeof c === 'number');
  if(closes.length < 5) return null;
  const last = closes[closes.length - 1];

  function movingAverageVsLast(period){
    if(closes.length < period) return null;
    const window = closes.slice(closes.length - period);
    const ma = window.reduce((a, b) => a + b, 0) / window.length;
    return {value: ma, diffPct: ((last / ma) - 1) * 100, above: last >= ma};
  }

  return {
    days: closes.length,
    last,
    periodHigh: Math.max(...closes),
    periodLow: Math.min(...closes),
    ma20: movingAverageVsLast(20),
    ma50: movingAverageVsLast(50),
    rsi14: computeRSI(closes, 14),
    bollinger: computeBollingerBands(closes, 20, 2),
    macd: computeMACD(closes, 12, 26, 9),
    volumeTrend: computeVolumeTrend(history, 20)
  };
}
// Rendu textuel partagé d'un résultat computeTechnicalIndicators — factorisé
// depuis action.js (Phase 2 de la refonte Bourse) pour être réutilisé tel
// quel dans bourse.js (Fiches actions, Comparateur), jamais une seconde
// rédaction des mêmes phrases. unite optionnel (ex. "€", "pts",
// devise d'un actif de marché) — "€" par défaut pour les actions. RSI/
// Bollinger (section "Trading" de la refonte Bourse) : le RSI est présenté
// comme un indicateur de momentum, jamais un signal d'achat/vente — les
// seuils 70/30 sont des conventions largement utilisées, pas une règle
// garantie (voir aussi le terme RSI dans la Bibliothèque).
function renderTechnicalIndicatorsLines(tech, unite){
  const u = unite || '€';
  if(!tech) return null;
  const lines = [`Plus haut sur ${tech.days} séances : ${tech.periodHigh.toFixed(2)} ${u} · Plus bas : ${tech.periodLow.toFixed(2)} ${u}`];
  if(tech.ma20) lines.push(`Le cours est actuellement ${tech.ma20.above ? 'au-dessus' : 'en dessous'} de sa moyenne mobile 20 jours (${tech.ma20.value.toFixed(2)} ${u}, ${tech.ma20.diffPct>=0?'+':''}${tech.ma20.diffPct.toFixed(1)}%)`);
  if(tech.ma50) lines.push(`Le cours est actuellement ${tech.ma50.above ? 'au-dessus' : 'en dessous'} de sa moyenne mobile 50 jours (${tech.ma50.value.toFixed(2)} ${u}, ${tech.ma50.diffPct>=0?'+':''}${tech.ma50.diffPct.toFixed(1)}%)`);
  if(typeof tech.rsi14 === 'number'){
    const zone = tech.rsi14 >= 70 ? 'zone de surachat (>70), une convention utilisée par certains pour repérer un possible essoufflement, jamais un signal fiable à lui seul'
      : tech.rsi14 <= 30 ? 'zone de survente (<30), une convention utilisée par certains pour repérer un possible rebond, jamais un signal fiable à lui seul'
      : 'zone neutre (entre 30 et 70)';
    lines.push(`RSI (14 jours) : ${tech.rsi14.toFixed(1)} — ${zone}`);
  }
  if(tech.bollinger){
    const posLabel = tech.bollinger.position === 'above' ? 'au-dessus de la bande haute'
      : tech.bollinger.position === 'below' ? 'en dessous de la bande basse'
      : 'à l\'intérieur du canal';
    lines.push(`Bandes de Bollinger (20 jours, ±2 écarts-types) : le cours est ${posLabel} (${tech.bollinger.lower.toFixed(2)} ${u} — ${tech.bollinger.upper.toFixed(2)} ${u})`);
  }
  if(tech.macd){
    const crossLabel = tech.macd.crossover === 'bullish' ? ' — croisement haussier récent (ligne MACD passée au-dessus de sa ligne de signal)'
      : tech.macd.crossover === 'bearish' ? ' — croisement baissier récent (ligne MACD passée en dessous de sa ligne de signal)'
      : '';
    lines.push(`MACD (12/26/9) : ${tech.macd.macdLine.toFixed(2)}, ligne de signal ${tech.macd.signalLine.toFixed(2)}${crossLabel}`);
  }
  if(tech.volumeTrend){
    const label = tech.volumeTrend.aboveAverage ? 'au-dessus' : 'en dessous';
    lines.push(`Volume de la dernière séance : ${label} de sa moyenne 20 jours (${(tech.volumeTrend.ratioToAvg * 100).toFixed(0)}% de la moyenne)`);
  }
  return lines;
}

// ================================================================
// ---------- Fondamentaux réels (Comparateur, Scénarios, Dividendes, fiche action) ----------
// ================================================================
// Toutes les valeurs viennent de /api/company-profile (Yahoo Finance,
// quoteSummary) — jamais de repli sur un chiffre inventé. Un champ absent
// (fields.x === null) doit toujours s'afficher comme indisponible, jamais
// comme zéro ou comme une valeur de STOCKS_DEMO.

function fmtBigNumber(n){
  if(typeof n !== 'number') return null;
  if(Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2).replace('.', ',') + ' Md';
  if(Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' M';
  return Math.round(n).toLocaleString('fr-FR');
}

const FUNDAMENTALS_FIELD_META = {
  trailingPE: {label: 'PER', format: 'multiple'},
  forwardPE: {label: 'PER prévisionnel', format: 'multiple'},
  priceToSales: {label: 'P/S (prix / chiffre d\'affaires)', format: 'multiple'},
  priceToBook: {label: 'Price/Book', format: 'multiple'},
  evToRevenue: {label: 'EV/CA', format: 'multiple'},
  evToEbitda: {label: 'EV/EBITDA', format: 'multiple'},
  dividendYield: {label: 'Rendement du dividende', format: 'percent'},
  marketCap: {label: 'Capitalisation', format: 'bigEUR'},
  totalRevenue: {label: "Chiffre d'affaires", format: 'bigEUR'},
  revenueGrowth: {label: 'Croissance du chiffre d\'affaires', format: 'percent'},
  grossMargins: {label: 'Marge brute', format: 'percent'},
  operatingMargins: {label: 'Marge opérationnelle', format: 'percent'},
  profitMargins: {label: 'Marge nette', format: 'percent'},
  returnOnEquity: {label: 'ROE (rentabilité des capitaux propres)', format: 'percent'},
  totalCash: {label: 'Trésorerie', format: 'bigEUR'},
  totalDebt: {label: 'Dette totale', format: 'bigEUR'},
  freeCashflow: {label: 'Free cash-flow', format: 'bigEUR'},
  trailingEps: {label: 'BPA (bénéfice par action)', format: 'eur'},
  sharesOutstanding: {label: 'Actions en circulation', format: 'bigNumber'},
  targetLowPrice: {label: 'Cible basse des analystes', format: 'eur'},
  targetMeanPrice: {label: 'Cible moyenne des analystes', format: 'eur'},
  targetMedianPrice: {label: 'Cible médiane des analystes', format: 'eur'},
  targetHighPrice: {label: 'Cible haute des analystes', format: 'eur'},
  // Dividend Intelligence. fiveYearAvgDividendYield est une exception du
  // format Yahoo : contrairement à dividendYield/payoutRatio (fractions,
  // 0.0201 = 2,01 %), ce champ revient déjà en points de pourcentage
  // (1.83 = 1,83 %) — vérifié en direct en production (AI.PA), d'où le
  // format 'percentRaw' dédié plutôt que 'percent' (qui donnerait 183 %).
  dividendRate: {label: 'Dividende annuel réel', format: 'eur'},
  payoutRatio: {label: 'Payout ratio (part du bénéfice reversée)', format: 'percent'},
  fiveYearAvgDividendYield: {label: 'Rendement moyen sur 5 ans', format: 'percentRaw'},
  trailingAnnualDividendRate: {label: 'Dividende versé sur les 12 derniers mois', format: 'eur'},
  exDividendDate: {label: 'Date de détachement', format: 'date'},
  dividendDate: {label: 'Date de paiement', format: 'date'}
};
const FUNDAMENTALS_UNAVAILABLE_TEXT = 'Donnée indisponible ou non suffisamment fiable';

function formatFundamentalValue(key, value){
  if(typeof value !== 'number' || !Number.isFinite(value)) return FUNDAMENTALS_UNAVAILABLE_TEXT;
  const meta = FUNDAMENTALS_FIELD_META[key];
  if(!meta) return String(value);
  switch(meta.format){
    case 'percent': return (value * 100).toFixed(1).replace('.', ',') + ' %';
    case 'percentRaw': return value.toFixed(1).replace('.', ',') + ' %';
    case 'multiple': return value.toFixed(1).replace('.', ',') + '×';
    case 'eur': return value.toFixed(2).replace('.', ',') + ' €';
    case 'bigEUR': return fmtBigNumber(value) + ' €';
    case 'bigNumber': return fmtBigNumber(value);
    case 'date': return new Date(value * 1000).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});
    default: return String(value);
  }
}

// ---------- Historique financier (graphiques) : CA + résultat net réels sur
// jusqu'à 4 années annuelles (Yahoo incomeStatementHistory, voir lib/yahoo.js
// pour la vérification en direct du 2026-08-22 — seuls totalRevenue/netIncome
// sont fiables sur cet endpoint, grossProfit/ebit y sont systématiquement à
// 0). Trois petits graphiques à barres séparés (CA, résultat net, marge nette
// calculée) plutôt qu'un double axe trompeur — chaque échelle reste honnête
// pour sa propre grandeur. ----------
function financialHistoryBarsSVG(labels, values, opts){
  opts = opts || {};
  const W = 600, H = 130, padL = 10, padR = 10, padT = 14, padB = 24;
  const n = values.length;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const spread = (max - min) || Math.abs(max) * 0.01 || 1;
  const plotH = H - padT - padB;
  const zeroY = padT + (1 - (0 - min) / spread) * plotH;
  const slot = (W - padL - padR) / n;
  const barW = slot * 0.5;
  const Y = v => padT + (1 - (v - min) / spread) * plotH;
  const color = opts.color || 'var(--gold-bright)';
  const fmt = opts.fmt || (v => String(v));
  const bars = values.map((v, i) => {
    const x = padL + i * slot + (slot - barW) / 2;
    const y = v >= 0 ? Y(v) : zeroY;
    const h = Math.max(Math.abs(Y(v) - zeroY), 1);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${v < 0 ? 'var(--bordeaux)' : color}" rx="2"><title>${labels[i]} : ${fmt(v)}</title></rect>`;
  }).join('');
  const labelsSVG = labels.map((l, i) =>
    `<text x="${(padL + i * slot + slot / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${l}</text>`).join('');
  return `<svg class="market-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.ariaLabel || ''}">
    <line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${W - padR}" y2="${zeroY.toFixed(1)}" class="refline"/>
    ${bars}
    ${labelsSVG}
  </svg>`;
}
function renderFinancialHistoryCard(financialHistory){
  if(!Array.isArray(financialHistory) || financialHistory.length < 2){
    return `<h3>Historique financier</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`;
  }
  const labels = financialHistory.map(f => String(f.year));
  const revenues = financialHistory.map(f => f.totalRevenue);
  const netIncomes = financialHistory.map(f => f.netIncome);
  const margins = financialHistory.map(f => f.totalRevenue !== 0 ? (f.netIncome / f.totalRevenue) * 100 : 0);
  const eurFmt = v => fmtBigNumber(v) + ' €';
  const pctFmt = v => (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + ' %';
  return `
    <h3>Historique financier</h3>
    <p style="font-size:12px;color:var(--text-dim);margin:6px 0 12px;">Chiffre d'affaires et résultat net réellement publiés (jusqu'à ${financialHistory.length} années, Yahoo Finance) — la marge nette est calculée à partir de ces deux valeurs, jamais une donnée fournie directement.</p>
    <div style="margin-bottom:14px;">
      <p class="smallcaps">${renderDataBadge('fait')} Chiffre d'affaires</p>
      ${financialHistoryBarsSVG(labels, revenues, {fmt: eurFmt, ariaLabel: 'Chiffre d\'affaires annuel réel'})}
    </div>
    <div style="margin-bottom:14px;">
      <p class="smallcaps">${renderDataBadge('fait')} Résultat net</p>
      ${financialHistoryBarsSVG(labels, netIncomes, {fmt: eurFmt, ariaLabel: 'Résultat net annuel réel', color: 'var(--emerald)'})}
    </div>
    <div>
      <p class="smallcaps">${renderDataBadge('calcul')} Marge nette (résultat net / chiffre d'affaires)</p>
      ${financialHistoryBarsSVG(labels, margins, {fmt: pctFmt, ariaLabel: 'Marge nette annuelle calculée', color: 'var(--gold-bright)'})}
    </div>`;
}

// ---------- Cache en session des fondamentaux réels (partagé entre pages) ----------
// Découpe en lots de 8 : limite réelle du batch Yahoo quoteSummary derrière
// /api/company-profile (voir api/company-profile.js, symbols.slice(0,8)) — au
// départ pensée pour les 8 valeurs STOCKS_DEMO, mais s'applique maintenant à
// n'importe quelle liste de valeurs suivies (jusqu'à 20, FOLLOWED_STOCKS_MAX),
// jamais un choix arbitraire du code. Un seul lot de requêtes en vol à la fois
// (jamais une explosion de requêtes) : le crumb Yahoo est un mécanisme fragile
// et non documenté.
let companyFundamentalsCache = {};
let companyFundamentalsPromise = null;
function loadCompanyFundamentals(symbols){
  const missing = [...new Set(symbols)].filter(s => !(s in companyFundamentalsCache));
  if(missing.length === 0) return Promise.resolve(companyFundamentalsCache);
  if(companyFundamentalsPromise) return companyFundamentalsPromise.then(() => loadCompanyFundamentals(symbols));
  const chunks = [];
  for(let i = 0; i < missing.length; i += 8) chunks.push(missing.slice(i, i + 8));
  companyFundamentalsPromise = Promise.all(chunks.map(chunk =>
    fetch('/api/company-profile?symbols=' + encodeURIComponent(chunk.join(',')))
      .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(payload => {
        (payload.companies || []).forEach(c => { companyFundamentalsCache[c.symbol] = c; });
        chunk.forEach(s => { if(!(s in companyFundamentalsCache)) companyFundamentalsCache[s] = null; });
      })
      .catch(() => {
        chunk.forEach(s => { companyFundamentalsCache[s] = null; });
      })
  )).then(() => companyFundamentalsCache)
    .finally(() => { companyFundamentalsPromise = null; });
  return companyFundamentalsPromise;
}

// ---------- Descripteur générique d'une valeur suivie (dépasse les 8 valeurs
// curatées STOCKS_DEMO, et depuis la Phase 2 de la refonte Bourse, dépasse
// aussi les actions : résout également les actifs de marché suivis
// (ETF/Forex/matières premières/taux/indices, MARKET_DATA) — remplace les
// lookups STOCKS_DEMO.find dispersés dans bourse.js/action.js. secteur/pays/
// pea restent explicitement `null` quand non curatés OU non applicables à ce
// type d'actif (jamais une valeur par défaut inventée) : permet de
// distinguer "non éligible confirmé" de "non déterminé" côté affichage.
// assetType MARKET_DATA n'a jamais de fondamentales (PER/dividende/secteur) :
// aucune tentative de les fabriquer ici, les consommateurs (Screener/
// Comparateur) doivent dégrader proprement sur assetType !== 'stock'. ----------
let followedQuotesCache = {};
function resolveFollowedAsset(symbol){
  const demo = STOCKS_DEMO.find(s => s.ticker === symbol);
  if(demo){
    return {
      ticker: demo.ticker, nom: demo.nom, secteur: demo.secteur, pays: demo.pays,
      pea: demo.pea, prix: demo.prix, variation: demo.variation, history: demo.history,
      devise: null, unite: null, assetType: 'stock', curated: true
    };
  }
  const market = MARKET_DATA.find(m => m.symbol === symbol);
  if(market){
    // followedQuotesCache, alimenté par loadCustomQuotesForGrid pour TOUTE
    // valeur suivie (y compris les actifs de marché), porte un historique
    // plus riche (6 mois) que MARKET_DATA lui-même (rafraîchi en léger sur
    // l'onglet "Autres marchés", 5 jours par défaut) — préféré ici quand
    // disponible, jamais un repli sur des données plus pauvres si le riche
    // existe déjà en cache.
    const cached = followedQuotesCache[symbol];
    return {
      ticker: market.symbol, nom: market.nom, secteur: null, pays: null, pea: null,
      prix: cached && typeof cached.price === 'number' ? cached.price : (typeof market.prixNum === 'number' ? market.prixNum : null),
      variation: cached && typeof cached.changePercent === 'number' ? cached.changePercent : (typeof market.variationNum === 'number' ? market.variationNum : null),
      history: (cached && Array.isArray(cached.history)) ? cached.history : (Array.isArray(market.history) ? market.history : null),
      devise: market.devise || null, unite: market.unite || null,
      assetType: market.assetType, curated: true
    };
  }
  const followed = getFollowedStocks().find(s => s.symbol === symbol);
  const q = followedQuotesCache[symbol];
  return {
    ticker: symbol, nom: followed ? followed.name : symbol,
    secteur: null, pays: null, pea: null,
    prix: q ? q.price : null, variation: q ? q.changePercent : null, history: q ? q.history : null,
    devise: null, unite: null, assetType: (followed && followed.assetType) || 'stock', curated: false
  };
}

// ---------- Portefeuille réel (déclaratif) : Likanza n'a accès à aucun
// compte-titres réel — chaque transaction (action, quantité, prix, date) est
// saisie manuellement par l'utilisateur. Les positions sont agrégées à
// partir de ces transactions réellement saisies, valorisées avec un cours
// ACTUEL réel déjà chargé ailleurs (resolveFollowedAsset, jamais un nouvel
// appel réseau dédié). Une transaction malformée (quantité/prix non
// positifs, ticker manquant) est ignorée, jamais complétée par une valeur
// par défaut inventée. ----------
const REAL_PORTFOLIO_KEY = 'fzr-real-portfolio';
function getRealPortfolio(){
  try {
    const raw = JSON.parse(localStorage.getItem(REAL_PORTFOLIO_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function saveRealPortfolioTransaction(tx){
  if(!tx || typeof tx.ticker !== 'string' || !tx.ticker || !(tx.quantity > 0) || !(tx.buyPrice > 0) || typeof tx.buyDate !== 'string' || !tx.buyDate) return null;
  const list = getRealPortfolio();
  const entry = {
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    ticker: tx.ticker, name: typeof tx.name === 'string' && tx.name ? tx.name : tx.ticker,
    quantity: tx.quantity, buyPrice: tx.buyPrice, buyDate: tx.buyDate,
    note: typeof tx.note === 'string' ? tx.note.slice(0, 140) : ''
  };
  list.push(entry);
  localStorage.setItem(REAL_PORTFOLIO_KEY, JSON.stringify(list));
  return entry;
}
function removeRealPortfolioTransaction(id){
  const list = getRealPortfolio().filter(tx => tx.id !== id);
  localStorage.setItem(REAL_PORTFOLIO_KEY, JSON.stringify(list));
}
// livePrices : {ticker: prixActuelRéel|null} — construit par l'appelant à
// partir de resolveFollowedAsset, jamais recalculé ici. Un ticker absent de
// livePrices (cours indisponible) laisse currentValue/gainLoss à `null`,
// jamais un chiffre approximé à partir du prix d'achat.
function computeRealPortfolioPositions(transactions, livePrices){
  livePrices = livePrices || {};
  const byTicker = {};
  (transactions || []).forEach(tx => {
    if(!tx || typeof tx.ticker !== 'string' || typeof tx.quantity !== 'number' || typeof tx.buyPrice !== 'number' || tx.quantity <= 0 || tx.buyPrice <= 0) return;
    if(!byTicker[tx.ticker]) byTicker[tx.ticker] = {ticker: tx.ticker, name: tx.name || tx.ticker, quantity: 0, totalInvested: 0};
    byTicker[tx.ticker].quantity += tx.quantity;
    byTicker[tx.ticker].totalInvested += tx.quantity * tx.buyPrice;
  });
  return Object.values(byTicker).map(pos => {
    const currentPrice = typeof livePrices[pos.ticker] === 'number' ? livePrices[pos.ticker] : null;
    const avgBuyPrice = pos.totalInvested / pos.quantity;
    const currentValue = currentPrice !== null ? currentPrice * pos.quantity : null;
    const gainLoss = currentValue !== null ? currentValue - pos.totalInvested : null;
    const gainLossPct = (currentValue !== null && pos.totalInvested > 0) ? (gainLoss / pos.totalInvested) * 100 : null;
    return {ticker: pos.ticker, name: pos.name, quantity: pos.quantity, totalInvested: pos.totalInvested, avgBuyPrice, currentPrice, currentValue, gainLoss, gainLossPct};
  }).sort((a, b) => (b.currentValue !== null ? b.currentValue : b.totalInvested) - (a.currentValue !== null ? a.currentValue : a.totalInvested));
}
// Le total n'est affiché comme un seul chiffre que si TOUTES les positions
// ont un cours actuel connu — jamais un total qui mélange silencieusement une
// vraie valeur de marché et un coût d'achat pour les positions sans cours.
function computeRealPortfolioTotals(positions){
  const totalInvested = (positions || []).reduce((sum, p) => sum + p.totalInvested, 0);
  const known = (positions || []).filter(p => p.currentValue !== null);
  const allKnown = positions.length > 0 && known.length === positions.length;
  const totalCurrentValue = allKnown ? known.reduce((sum, p) => sum + p.currentValue, 0) : null;
  const totalGainLoss = allKnown ? totalCurrentValue - totalInvested : null;
  const totalGainLossPct = (allKnown && totalInvested > 0) ? (totalGainLoss / totalInvested) * 100 : null;
  return {
    totalInvested, totalCurrentValue, totalGainLoss, totalGainLossPct,
    positionsWithUnknownPrice: positions.length - known.length
  };
}
function renderRealPortfolioHTML(positions, totals){
  if(!Array.isArray(positions) || positions.length === 0){
    return `<p style="color:var(--text-dim);font-size:13px;">Aucune transaction enregistrée pour l'instant — ajoute ta première transaction réelle ci-dessus.</p>`;
  }
  const eurFmt = v => v.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
  const pctFmt = v => (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + ' %';
  const totalsHtml = totals.totalCurrentValue !== null
    ? `<p style="font-size:14px;margin-bottom:4px;">Valeur actuelle totale : <strong>${eurFmt(totals.totalCurrentValue)}</strong> (investi : ${eurFmt(totals.totalInvested)})</p>
       <p style="font-size:13px;color:${totals.totalGainLoss >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};">${totals.totalGainLoss >= 0 ? '+' : ''}${eurFmt(totals.totalGainLoss)} (${pctFmt(totals.totalGainLossPct)}) — calculé à partir des cours actuels réels</p>`
    : `<p style="font-size:13px;color:var(--text-dim);">Valeur totale non calculable : le cours actuel de ${totals.positionsWithUnknownPrice} position(s) sur ${positions.length} est indisponible (voir le détail par position ci-dessous).</p>`;
  const rows = positions.map(p => `
    <tr>
      <td style="padding:6px 8px;"><a href="action.html#${encodeURIComponent(p.ticker)}" style="color:var(--gold-bright);">${p.name}</a></td>
      <td style="text-align:right;padding:6px 8px;">${p.quantity}</td>
      <td style="text-align:right;padding:6px 8px;">${eurFmt(p.avgBuyPrice)}</td>
      <td style="text-align:right;padding:6px 8px;">${p.currentPrice !== null ? eurFmt(p.currentPrice) : FUNDAMENTALS_UNAVAILABLE_TEXT}</td>
      <td style="text-align:right;padding:6px 8px;">${eurFmt(p.totalInvested)}</td>
      <td style="text-align:right;padding:6px 8px;${p.gainLoss !== null ? `color:${p.gainLoss >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};` : ''}">${p.gainLoss !== null ? `${p.gainLoss >= 0 ? '+' : ''}${eurFmt(p.gainLoss)} (${pctFmt(p.gainLossPct)})` : FUNDAMENTALS_UNAVAILABLE_TEXT}</td>
    </tr>`).join('');
  return `
    ${totalsHtml}
    <div style="overflow-x:auto;margin-top:12px;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;">
      <thead><tr>
        <th style="text-align:left;padding:6px 8px;">Valeur</th>
        <th style="text-align:right;padding:6px 8px;">Quantité</th>
        <th style="text-align:right;padding:6px 8px;">Prix d'achat moyen</th>
        <th style="text-align:right;padding:6px 8px;">Cours actuel</th>
        <th style="text-align:right;padding:6px 8px;">Investi</th>
        <th style="text-align:right;padding:6px 8px;">Gain / perte latent</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p style="font-size:11.5px;color:var(--text-dim);margin-top:10px;">Portefeuille déclaratif : ces positions viennent des transactions que tu as toi-même saisies, jamais d'un compte-titres réel connecté. Le gain/perte est latent (non réalisé) et calculé sur le cours actuel réel.</p>`;
}

// ============================================================
// ---------- PROFIL FINANCIER PERSONNEL PERSISTANT (Financial Lab, Phase 0
// des fondations transverses — voir audit du 26/08/2026 : "aucune donnée
// financière personnelle persistante n'existe" était le vrai trou
// architectural bloquant dashboard/diagnostic/target engine/patrimoine).
// Même patron exact que fzr-real-portfolio ci-dessus (liste d'entrées avec
// id, validation stricte avant écriture, fonctions get/save/remove dédiées,
// jamais un objet mutable partagé) — 4 registres indépendants, aucune
// duplication entre eux (source de vérité unique, section 71 du prompt
// Financial Lab) :
//   - dettes personnelles : mêmes noms de champs que computeDebtPayoffPlan/
//     computeDebtConsolidation attendent déjà (label/balance/rate/
//     minPayment) — zéro couche de conversion, la vraie dette sauvegardée
//     est directement utilisable par ces fonctions existantes.
//   - objectifs financiers multiples (remplace widget-budget-goal, qui ne
//     gérait qu'un seul objectif jamais sauvegardé).
//   - charges récurrentes (abonnements ET factures — même structure, un
//     champ categorie les distingue, remplace widget-budget-sub qui ne
//     gérait qu'un seul abonnement à la fois).
//   - actifs (patrimoine) : le passif du patrimoine net n'est JAMAIS une
//     liste séparée — il est recalculé à partir des dettes personnelles
//     ci-dessus (computeNetWorth prend actifs + dettes en paramètres),
//     pour qu'une dette ne soit jamais saisie deux fois à deux endroits
//     différents.
// ============================================================

// ---- Dettes personnelles ----
const PERSONAL_DEBTS_KEY = 'fzr-personal-debts';
function getPersonalDebts(){
  try {
    const raw = JSON.parse(localStorage.getItem(PERSONAL_DEBTS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function savePersonalDebt(debt){
  if(!debt || typeof debt.label !== 'string' || !debt.label.trim() || !(debt.balance > 0) || typeof debt.rate !== 'number' || debt.rate < 0 || !(debt.minPayment > 0)) return null;
  const list = getPersonalDebts();
  const entry = {
    id: 'debt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    label: debt.label.trim().slice(0, 60), balance: debt.balance, rate: debt.rate, minPayment: debt.minPayment,
    dateAjout: new Date().toISOString()
  };
  list.push(entry);
  localStorage.setItem(PERSONAL_DEBTS_KEY, JSON.stringify(list));
  return entry;
}
function removePersonalDebt(id){
  const list = getPersonalDebts().filter(d => d.id !== id);
  localStorage.setItem(PERSONAL_DEBTS_KEY, JSON.stringify(list));
}

// ---- Objectifs financiers (remplace le calcul à objectif unique de
// widget-budget-goal) ----
const FINANCIAL_GOALS_KEY = 'fzr-financial-goals';
function getFinancialGoals(){
  try {
    const raw = JSON.parse(localStorage.getItem(FINANCIAL_GOALS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function saveFinancialGoal(goal){
  if(!goal || typeof goal.nom !== 'string' || !goal.nom.trim() || !(goal.montantCible > 0) || !(goal.montantActuel >= 0) || !(goal.versementMensuel >= 0)) return null;
  if(goal.dateCible !== null && goal.dateCible !== undefined && (typeof goal.dateCible !== 'string' || isNaN(Date.parse(goal.dateCible)))) return null;
  const list = getFinancialGoals();
  const entry = {
    id: 'goal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    nom: goal.nom.trim().slice(0, 60), montantCible: goal.montantCible, montantActuel: goal.montantActuel,
    versementMensuel: goal.versementMensuel, dateCible: (typeof goal.dateCible === 'string' && goal.dateCible) ? goal.dateCible : null,
    dateAjout: new Date().toISOString()
  };
  list.push(entry);
  localStorage.setItem(FINANCIAL_GOALS_KEY, JSON.stringify(list));
  return entry;
}
function removeFinancialGoal(id){
  const list = getFinancialGoals().filter(g => g.id !== id);
  localStorage.setItem(FINANCIAL_GOALS_KEY, JSON.stringify(list));
}
// Statut d'un objectif — jamais un jugement, un fait calculé à partir des
// hypothèses saisies (rythme de versement actuel, date cible si fournie).
// Sans date cible : aucun statut coloré (rien à comparer), seulement la
// durée nécessaire au rythme actuel — jamais un 🔴 fabriqué faute de
// référence temporelle. Le seuil 1,5x (statut "à risque" plutôt que
// "impossible") est une convention de lecture assumée, documentée ici et
// dans le panneau méthodologie de l'outil, jamais présentée comme une
// règle universelle.
function computeGoalProjection(goal){
  if(!goal || !(goal.montantCible > 0)) return null;
  const manquant = Math.max(0, goal.montantCible - goal.montantActuel);
  const progressionPct = Math.min(100, (goal.montantActuel / goal.montantCible) * 100);
  if(manquant === 0){
    return {manquant: 0, progressionPct: 100, moisNecessaires: 0, statut: 'atteint'};
  }
  if(!(goal.versementMensuel > 0)){
    return {manquant, progressionPct, moisNecessaires: null, statut: 'impossible'};
  }
  const moisNecessaires = Math.ceil(manquant / goal.versementMensuel);
  let statut = null;
  let moisRestants = null;
  if(goal.dateCible){
    const now = new Date();
    const cible = new Date(goal.dateCible);
    moisRestants = Math.max(0, Math.round((cible - now) / (1000 * 60 * 60 * 24 * 30.44)));
    if(moisNecessaires <= moisRestants) statut = 'ontrack';
    else if(moisNecessaires <= moisRestants * 1.5) statut = 'atrisk';
    else statut = 'impossible';
  }
  return {manquant, progressionPct, moisNecessaires, moisRestants, statut};
}

// ---- Conflit entre objectifs (audit Dashboard du 28/08/2026, Chantier 3) :
// jusqu'ici, chaque objectif était calculé isolément — rien ne vérifiait que
// la somme des versements mensuels déclarés restait compatible avec la
// capacité d'épargne réelle. "insufficient-data" tant qu'aucune donnée
// budgétaire réelle n'existe pour le mois (jamais un faux conflit affiché
// faute de données — un solde à 0€ par défaut déclencherait sinon
// systématiquement une alerte). ----
function computeGoalsConflict(goals, budgetSummary){
  const activeGoals = (goals || []).filter(g => {
    const proj = computeGoalProjection(g);
    return proj && proj.statut !== 'atteint' && g.versementMensuel > 0;
  });
  const totalCommitted = activeGoals.reduce((s, g) => s + g.versementMensuel, 0);
  if(!budgetSummary || (budgetSummary.revenus === 0 && budgetSummary.depenses === 0)){
    return {status: 'insufficient-data', totalCommitted, activeGoals};
  }
  const capacity = budgetSummary.solde;
  if(totalCommitted <= capacity){
    return {status: 'ok', totalCommitted, capacity, activeGoals};
  }
  return {status: 'conflict', totalCommitted, capacity, overCommitted: totalCommitted - capacity, activeGoals};
}
// Scénario "priorité à un objectif" : cet objectif reçoit son versement
// demandé en premier, les autres (dans leur ordre existant) se partagent ce
// qui reste, chacun plafonné à ce qu'il demandait réellement — jamais plus.
// Un objectif qui ne reçoit rien voit sa date recalculée avec un versement
// nul (statut "impossible"), jamais masqué ni ignoré silencieusement.
function computeGoalsPriorityAllocation(goals, capacity, priorityGoalId){
  const ordered = [
    ...goals.filter(g => g.id === priorityGoalId),
    ...goals.filter(g => g.id !== priorityGoalId)
  ];
  let remaining = Math.max(0, capacity);
  return ordered.map(goal => {
    const allocated = Math.min(goal.versementMensuel, remaining);
    remaining -= allocated;
    const projection = computeGoalProjection({...goal, versementMensuel: allocated});
    return {goal, allocated, requested: goal.versementMensuel, projection};
  });
}

// ---- 🗺️ Mes Projets de vie (audit Dashboard du 28/08/2026, Chantier 7) :
// décision de modèle de données actée dans l'audit — un Projet reste un
// registre SÉPARÉ de fzr-financial-goals plutôt qu'une extension du modèle
// Objectif. Un Objectif est un montant plat à épargner ; un Projet a des
// étapes propres (chacune avec son propre statut et sa propre dépense
// réelle), un budget total, et des risques — retrofitter ce modèle dans les
// Objectifs aurait complexifié un CRUD déjà testé (dont la détection de
// conflit, computeGoalsConflict) pour un besoin structurellement différent.
// Jamais une progression fabriquée : sans étape ajoutée, progressionPct est
// null (jamais 0 %, qui laisserait croire à un vrai calcul).
const LIFE_PROJECT_CATEGORIES = ['immobilier', 'entreprise', 'mariage', 'voyage', 'etudes', 'famille', 'autre'];
const LIFE_PROJECT_CATEGORY_META = {
  immobilier: {emoji: '🏠', label: 'Immobilier'}, entreprise: {emoji: '💼', label: 'Entreprise'},
  mariage: {emoji: '💍', label: 'Mariage'}, voyage: {emoji: '✈️', label: 'Voyage'},
  etudes: {emoji: '🎓', label: 'Études'}, famille: {emoji: '👶', label: 'Famille'}, autre: {emoji: '📌', label: 'Autre'}
};
const LIFE_PROJECTS_KEY = 'fzr-life-projects';
function getLifeProjects(){
  try {
    const raw = JSON.parse(localStorage.getItem(LIFE_PROJECTS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function saveLifeProject(project){
  if(!project || typeof project.nom !== 'string' || !project.nom.trim()) return null;
  if(!LIFE_PROJECT_CATEGORIES.includes(project.categorie)) return null;
  if(!(project.budgetTotal >= 0)) return null;
  if(project.dateCible !== null && project.dateCible !== undefined && (typeof project.dateCible !== 'string' || isNaN(Date.parse(project.dateCible)))) return null;
  const list = getLifeProjects();
  const entry = {
    id: 'project-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    nom: project.nom.trim().slice(0, 60),
    categorie: project.categorie,
    budgetTotal: project.budgetTotal,
    dateCible: (typeof project.dateCible === 'string' && project.dateCible) ? project.dateCible : null,
    etapes: [],
    dateCreation: new Date().toISOString()
  };
  list.push(entry);
  localStorage.setItem(LIFE_PROJECTS_KEY, JSON.stringify(list));
  return entry;
}
function removeLifeProject(id){
  localStorage.setItem(LIFE_PROJECTS_KEY, JSON.stringify(getLifeProjects().filter(p => p.id !== id)));
}
function saveProjectEtape(projectId, etape){
  if(!etape || typeof etape.nom !== 'string' || !etape.nom.trim()) return null;
  if(etape.dateCible !== null && etape.dateCible !== undefined && (typeof etape.dateCible !== 'string' || isNaN(Date.parse(etape.dateCible)))) return null;
  const list = getLifeProjects();
  const project = list.find(p => p.id === projectId);
  if(!project) return null;
  const entry = {
    id: 'etape-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    nom: etape.nom.trim().slice(0, 60),
    dateCible: (typeof etape.dateCible === 'string' && etape.dateCible) ? etape.dateCible : null,
    statut: 'a-faire',
    depense: 0
  };
  project.etapes.push(entry);
  localStorage.setItem(LIFE_PROJECTS_KEY, JSON.stringify(list));
  return entry;
}
const PROJECT_ETAPE_STATUTS = ['a-faire', 'en-cours', 'termine'];
function updateProjectEtapeStatut(projectId, etapeId, statut, depense){
  if(!PROJECT_ETAPE_STATUTS.includes(statut)) return null;
  const list = getLifeProjects();
  const project = list.find(p => p.id === projectId);
  const etape = project && project.etapes.find(e => e.id === etapeId);
  if(!etape) return null;
  etape.statut = statut;
  if(typeof depense === 'number' && depense >= 0) etape.depense = depense;
  localStorage.setItem(LIFE_PROJECTS_KEY, JSON.stringify(list));
  return etape;
}
function removeProjectEtape(projectId, etapeId){
  const list = getLifeProjects();
  const project = list.find(p => p.id === projectId);
  if(!project) return;
  project.etapes = project.etapes.filter(e => e.id !== etapeId);
  localStorage.setItem(LIFE_PROJECTS_KEY, JSON.stringify(list));
}
function computeProjectProgress(project){
  const etapes = project.etapes || [];
  const depensesEngagees = etapes.reduce((s, e) => s + (e.depense || 0), 0);
  const budgetRestant = Math.max(0, project.budgetTotal - depensesEngagees);
  if(etapes.length === 0) return {progressionPct: null, etapesTerminees: 0, etapesTotal: 0, depensesEngagees, budgetRestant};
  const etapesTerminees = etapes.filter(e => e.statut === 'termine').length;
  return {progressionPct: Math.round((etapesTerminees / etapes.length) * 100), etapesTerminees, etapesTotal: etapes.length, depensesEngagees, budgetRestant};
}
// Ligne du temps PASSÉ ← AUJOURD'HUI → FUTUR : uniquement des points réels
// (un historique de patrimoine déjà enregistré, ou une date cible que
// l'utilisateur a lui-même saisie sur un objectif/projet/étape) — jamais une
// date extrapolée ou un jalon inventé.
function computeLifeTimeline(){
  const events = [];
  getNetWorthHistory().forEach(p => events.push({type: 'patrimoine', date: p.mois + '-01', label: `Patrimoine : ${fmtEUR(p.patrimoineNet)}`, lien: null}));
  const today = todayISO();
  events.push({type: 'aujourdhui', date: today, label: "Aujourd'hui", lien: null});
  getFinancialGoals().filter(g => g.dateCible).forEach(g => events.push({type: 'goal', date: g.dateCible, label: `🎯 ${g.nom}`, lien: 'laboratoire.html#tab-budget-epargne'}));
  getLifeProjects().forEach(p => {
    const meta = LIFE_PROJECT_CATEGORY_META[p.categorie];
    if(p.dateCible) events.push({type: 'project', date: p.dateCible, label: `${meta.emoji} ${p.nom}`, lien: 'laboratoire.html#tab-budget-epargne'});
    (p.etapes || []).filter(e => e.dateCible && e.statut !== 'termine').forEach(e => events.push({type: 'etape', date: e.dateCible, label: `${meta.emoji} ${p.nom} — ${e.nom}`, lien: 'laboratoire.html#tab-budget-epargne'}));
  });
  events.sort((a, b) => a.date.localeCompare(b.date));
  events.forEach(e => { e.temporalite = e.type === 'aujourdhui' ? 'present' : (e.date < today ? 'passe' : 'futur'); });
  return events;
}
// Ligne du temps horizontale scrollable (jamais un débordement de la page,
// §"Wide content" — overflow-x confiné à ce conteneur). Réutilisée telle
// quelle par le widget Laboratoire complet et par l'aperçu Dashboard.
function renderLifeTimeline(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const events = computeLifeTimeline();
  if(events.length <= 1){
    el.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Ajoute un objectif, un projet ou une étape avec une date pour voir ta ligne du temps ici.</p>`;
    return;
  }
  const COLOR = {passe: 'var(--ivory-dim)', present: 'var(--gold-bright)', futur: 'var(--emerald)'};
  el.innerHTML = `<div style="display:flex;overflow-x:auto;padding:10px 4px;">
    ${events.map((e, i) => `
      <div style="display:flex;flex-direction:column;align-items:center;min-width:130px;flex-shrink:0;">
        <span style="font-size:10px;color:var(--text-dim);white-space:nowrap;">${new Date(e.date + 'T00:00:00').toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
        <div style="display:flex;align-items:center;width:100%;margin-top:4px;">
          <div style="flex:1;height:1px;background:${i === 0 ? 'transparent' : 'var(--hairline)'};"></div>
          <span style="width:10px;height:10px;border-radius:50%;background:${COLOR[e.temporalite]};flex-shrink:0;"></span>
          <div style="flex:1;height:1px;background:${i === events.length - 1 ? 'transparent' : 'var(--hairline)'};"></div>
        </div>
        ${e.lien ? `<a href="${e.lien}" style="font-size:11.5px;text-align:center;margin-top:4px;color:var(--gold-bright);">${e.label}</a>` : `<span style="font-size:11.5px;text-align:center;margin-top:4px;">${e.label}</span>`}
      </div>`).join('')}
  </div>`;
}

// ---- 🔮 Mon Futur : projection longue du patrimoine (audit Dashboard du
// 28/08/2026, Chantier 4) — rien ne projetait au-delà de 24 mois jusqu'ici
// (la projection de trésorerie existante est linéaire, sans rendement, sur
// 3 à 24 mois). Réutilise les 3 taux déjà définis pour les intérêts
// composés (RETURN_ASSUMPTIONS, prudent/central/optimiste — mêmes valeurs,
// jamais un 4e taux inventé pour cet outil-ci). L'épargne annuelle suit
// l'hypothèse d'augmentation salariale choisie ; le patrimoine réel déflate
// le nominal par l'inflation cumulée, jamais présenté comme une garantie —
// voir le disclaimer obligatoire dans le rendu (initMonFuturSimulator,
// laboratoire.js). ----
const WEALTH_PROJECTION_HORIZONS = [1, 5, 10, 20];
function computeWealthProjection(params){
  const patrimoineInitial = params.patrimoineInitial || 0;
  const epargneMensuelle = params.epargneMensuelle || 0;
  const rendementAnnuelPct = params.rendementAnnuelPct || 0;
  const inflationPct = params.inflationPct || 0;
  const augmentationAnnuellePct = params.augmentationAnnuellePct || 0;
  const maxHorizon = Math.max(...WEALTH_PROJECTION_HORIZONS);
  const points = [{annee: 0, patrimoineNominal: patrimoineInitial, patrimoineReel: patrimoineInitial}];
  let patrimoine = patrimoineInitial;
  let epargneAnnuelle = epargneMensuelle * 12;
  for(let an = 1; an <= maxHorizon; an++){
    patrimoine = patrimoine * (1 + rendementAnnuelPct / 100) + epargneAnnuelle;
    const patrimoineReel = patrimoine / Math.pow(1 + inflationPct / 100, an);
    points.push({annee: an, patrimoineNominal: patrimoine, patrimoineReel});
    epargneAnnuelle *= (1 + augmentationAnnuellePct / 100);
  }
  const atHorizon = {};
  WEALTH_PROJECTION_HORIZONS.forEach(h => { atHorizon[h] = points[h]; });
  return {points, atHorizon};
}
function computeWealthProjectionScenarios(baseParams){
  const scenarios = {};
  Object.keys(RETURN_ASSUMPTIONS).forEach(key => {
    scenarios[key] = computeWealthProjection({...baseParams, rendementAnnuelPct: RETURN_ASSUMPTIONS[key].rate});
  });
  return scenarios;
}

// ---- Charges récurrentes : abonnements ET factures (même structure, un
// champ categorie les distingue) — remplace le calcul à une seule charge de
// widget-budget-sub. ----
const RECURRING_CHARGES_KEY = 'fzr-recurring-charges';
const RECURRING_CHARGE_FREQUENCIES = ['mensuel', 'trimestriel', 'annuel'];
function getRecurringCharges(){
  try {
    const raw = JSON.parse(localStorage.getItem(RECURRING_CHARGES_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
// jourEcheance (1-31, optionnel — audit Dashboard du 28/08/2026, Chantier 5)
// : jamais un jour inventé. Sans valeur fournie, la charge reste réelle mais
// n'apparaît jamais sur un jour précis du calendrier, seulement groupée par
// mois — voir computeCalendarEvents.
function saveRecurringCharge(charge){
  if(!charge || typeof charge.nom !== 'string' || !charge.nom.trim() || !(charge.montant > 0) || !RECURRING_CHARGE_FREQUENCIES.includes(charge.frequence)) return null;
  const categorie = charge.categorie === 'facture' ? 'facture' : 'abonnement';
  const jourEcheance = (Number.isInteger(charge.jourEcheance) && charge.jourEcheance >= 1 && charge.jourEcheance <= 31) ? charge.jourEcheance : null;
  const list = getRecurringCharges();
  const entry = {
    id: 'charge-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    nom: charge.nom.trim().slice(0, 60), montant: charge.montant, frequence: charge.frequence, categorie, jourEcheance,
    dateAjout: new Date().toISOString()
  };
  list.push(entry);
  localStorage.setItem(RECURRING_CHARGES_KEY, JSON.stringify(list));
  return entry;
}
function removeRecurringCharge(id){
  const list = getRecurringCharges().filter(c => c.id !== id);
  localStorage.setItem(RECURRING_CHARGES_KEY, JSON.stringify(list));
}
// Équivalent mensuel/annuel — jamais une approximation : trimestriel ×4,
// annuel ×1, pour le total annuel ; ÷12 pour l'équivalent mensuel.
function computeRecurringChargeCost(charge){
  if(!charge || !(charge.montant > 0)) return null;
  const perYear = charge.frequence === 'mensuel' ? 12 : (charge.frequence === 'trimestriel' ? 4 : 1);
  const annuel = charge.montant * perYear;
  return {annuel, mensuel: annuel / 12, sur3ans: annuel * 3, sur5ans: annuel * 5, sur10ans: annuel * 10};
}
function computeRecurringChargesTotal(charges){
  return (charges || []).reduce((acc, c) => {
    const cost = computeRecurringChargeCost(c);
    if(!cost) return acc;
    acc.mensuel += cost.mensuel; acc.annuel += cost.annuel;
    if(c.categorie === 'facture') acc.mensuelFactures += cost.mensuel; else acc.mensuelAbonnements += cost.mensuel;
    return acc;
  }, {mensuel: 0, annuel: 0, mensuelAbonnements: 0, mensuelFactures: 0});
}

// ---- 📅 Calendrier financier (audit Dashboard du 28/08/2026, Chantier 5) :
// confirmé absent de tout le site avant cette passe. Construit uniquement à
// partir de données réellement déclarées par l'utilisateur (charges
// récurrentes, échéances d'objectifs) — jamais une vraie transaction
// bancaire tant qu'aucune connexion n'existe (section 30 du prompt). ----
// Une charge "trimestriel"/"annuel" ne tombe pas tous les mois : le calcul
// compte le nombre de mois écoulés depuis son ajout réel (dateAjout),
// jamais une date de première échéance inventée.
function computeCalendarEvents(mois){
  if(typeof mois !== 'string' || !/^\d{4}-\d{2}$/.test(mois)) return [];
  const [y, m] = mois.split('-').map(Number);
  const chargeEvents = getRecurringCharges().filter(c => {
    const added = new Date(c.dateAjout);
    const monthsSince = (y - added.getFullYear()) * 12 + (m - (added.getMonth() + 1));
    if(monthsSince < 0) return false;
    if(c.frequence === 'mensuel') return true;
    if(c.frequence === 'trimestriel') return monthsSince % 3 === 0;
    return monthsSince % 12 === 0; // annuel
  }).map(c => ({type: 'charge', id: c.id, label: c.nom, montant: -c.montant, jour: c.jourEcheance, categorie: c.categorie}));

  const goalEvents = getFinancialGoals()
    .filter(g => g.dateCible && g.dateCible.slice(0, 7) === mois)
    .map(g => ({type: 'goal', id: g.id, label: `Échéance : ${g.nom}`, montant: null, jour: +g.dateCible.slice(8, 10), categorie: 'objectif'}));

  return [...chargeEvents, ...goalEvents].sort((a, b) => (a.jour || 99) - (b.jour || 99));
}
// Rappels des N prochains jours (widget "Aujourd'hui") — seules les charges
// avec un jour d'échéance réellement saisi peuvent apparaître ici (jamais un
// jour deviné) ; une échéance d'objectif dans le passé n'est jamais un rappel.
function computeUpcomingReminders(daysAhead){
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const reminders = [];
  getRecurringCharges().filter(c => c.jourEcheance).forEach(c => {
    let target = new Date(today.getFullYear(), today.getMonth(), c.jourEcheance);
    if(target < today) target = new Date(today.getFullYear(), today.getMonth() + 1, c.jourEcheance);
    const dans = Math.round((target - today) / 86400000);
    if(dans <= daysAhead) reminders.push({type: 'charge', label: c.nom, montant: c.montant, dans});
  });
  getFinancialGoals().filter(g => g.dateCible).forEach(g => {
    const target = new Date(g.dateCible + 'T00:00:00');
    const dans = Math.round((target - today) / 86400000);
    if(dans >= 0 && dans <= daysAhead) reminders.push({type: 'goal', label: g.nom, montant: null, dans});
  });
  return reminders.sort((a, b) => a.dans - b.dans);
}

// ---- Actifs (patrimoine) — le passif vient TOUJOURS des dettes
// personnelles ci-dessus, jamais d'une liste de passifs séparée. ----
const NET_WORTH_ASSETS_KEY = 'fzr-net-worth-assets';
// 'actions' conservé pour ne jamais casser une catégorie déjà enregistrée
// chez un utilisateur existant (audit Dashboard du 28/08/2026 : les
// enveloppes PEA/CTO/crypto sont assez distinctes fiscalement et en risque
// pour mériter leur propre ligne plutôt que de rester noyées dans "actions").
const NET_WORTH_ASSET_CATEGORIES = ['cash', 'pea', 'cto', 'crypto', 'actions', 'immobilier', 'vehicule', 'autre'];
function getNetWorthAssets(){
  try {
    const raw = JSON.parse(localStorage.getItem(NET_WORTH_ASSETS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function saveNetWorthAsset(asset){
  if(!asset || typeof asset.nom !== 'string' || !asset.nom.trim() || !(asset.valeur >= 0) || !NET_WORTH_ASSET_CATEGORIES.includes(asset.categorie)) return null;
  const list = getNetWorthAssets();
  const entry = {
    id: 'asset-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    nom: asset.nom.trim().slice(0, 60), categorie: asset.categorie, valeur: asset.valeur,
    dateAjout: new Date().toISOString()
  };
  list.push(entry);
  localStorage.setItem(NET_WORTH_ASSETS_KEY, JSON.stringify(list));
  return entry;
}
function removeNetWorthAsset(id){
  const list = getNetWorthAssets().filter(a => a.id !== id);
  localStorage.setItem(NET_WORTH_ASSETS_KEY, JSON.stringify(list));
}
// Patrimoine net = actifs saisis − dettes personnelles (fzr-personal-debts).
// Jamais un troisième registre de "passifs" : une dette n'existe qu'à un
// seul endroit (section 71 du prompt Financial Lab, "source de vérité").
function computeNetWorth(assets, debts){
  const totalActifs = (assets || []).reduce((s, a) => s + (typeof a.valeur === 'number' ? a.valeur : 0), 0);
  const totalPassifs = (debts || []).reduce((s, d) => s + (typeof d.balance === 'number' ? d.balance : 0), 0);
  const parCategorie = {};
  NET_WORTH_ASSET_CATEGORIES.forEach(c => { parCategorie[c] = 0; });
  (assets || []).forEach(a => { if(parCategorie[a.categorie] !== undefined) parCategorie[a.categorie] += a.valeur; });
  return {totalActifs, totalPassifs, patrimoineNet: totalActifs - totalPassifs, parCategorie};
}
// Historique du patrimoine net (Financial Lab, Phase 2 — "avec historique") :
// un point réel par mois, jamais un historique rétroactif fabriqué. Un seul
// point par mois (écrasé s'il existe déjà) : rouvrir la page 3 fois le même
// mois ne doit jamais créer 3 points, seulement mettre à jour le point du
// mois en cours avec la valeur la plus récente.
const NET_WORTH_HISTORY_KEY = 'fzr-net-worth-history';
function getNetWorthHistory(){
  try {
    const raw = JSON.parse(localStorage.getItem(NET_WORTH_HISTORY_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function recordNetWorthSnapshot(mois, patrimoineNet){
  if(typeof mois !== 'string' || !/^\d{4}-\d{2}$/.test(mois) || typeof patrimoineNet !== 'number' || !isFinite(patrimoineNet)) return null;
  const list = getNetWorthHistory().filter(p => p.mois !== mois);
  const point = {mois, patrimoineNet, dateAjout: new Date().toISOString()};
  list.push(point);
  list.sort((a, b) => a.mois.localeCompare(b.mois));
  localStorage.setItem(NET_WORTH_HISTORY_KEY, JSON.stringify(list));
  return point;
}

// ============================================================
// ---------- BUDGET MENSUEL CATÉGORISÉ (Financial Lab, Phase 1 — Dashboard &
// diagnostic) : liste de mouvements réels (revenu ou dépense), chacun
// rattaché à un mois ('YYYY-MM') et une catégorie FIXE (pas de texte libre)
// pour que "Où part mon argent" agrège de vrais totaux comparables d'un mois
// à l'autre, jamais une liste de libellés disparates impossibles à regrouper.
// ============================================================
const BUDGET_ENTRY_KEY = 'fzr-budget-entries';
const BUDGET_CATEGORIES = {
  revenu: ['Salaire', 'Freelance / Business', 'Autre revenu'],
  depense: ['Logement', 'Alimentation', 'Transport', 'Loisirs & sorties', 'Santé', 'Abonnements', 'Autre']
};
function getBudgetEntries(){
  try {
    const raw = JSON.parse(localStorage.getItem(BUDGET_ENTRY_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function saveBudgetEntry(entry){
  if(!entry || (entry.type !== 'revenu' && entry.type !== 'depense')) return null;
  if(!BUDGET_CATEGORIES[entry.type].includes(entry.categorie)) return null;
  if(!(entry.montant > 0)) return null;
  if(typeof entry.mois !== 'string' || !/^\d{4}-\d{2}$/.test(entry.mois)) return null;
  const list = getBudgetEntries();
  const item = {
    id: 'budget-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    type: entry.type, categorie: entry.categorie, montant: entry.montant, mois: entry.mois,
    dateAjout: new Date().toISOString()
  };
  list.push(item);
  localStorage.setItem(BUDGET_ENTRY_KEY, JSON.stringify(list));
  return item;
}
function removeBudgetEntry(id){
  const list = getBudgetEntries().filter(e => e.id !== id);
  localStorage.setItem(BUDGET_ENTRY_KEY, JSON.stringify(list));
}
function currentMonthKey(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function previousMonthKey(mois){
  const [y, m] = mois.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
// Synthèse d'un mois précis — jamais une moyenne ou une estimation : sans
// entrée saisie pour ce mois, revenus/dépenses valent 0, jamais un chiffre
// d'un autre mois recopié silencieusement.
function computeBudgetSummary(entries, mois){
  const monthEntries = (entries || []).filter(e => e.mois === mois);
  const revenus = monthEntries.filter(e => e.type === 'revenu').reduce((s, e) => s + e.montant, 0);
  const depenses = monthEntries.filter(e => e.type === 'depense').reduce((s, e) => s + e.montant, 0);
  const solde = revenus - depenses;
  const tauxEpargnePct = revenus > 0 ? (solde / revenus) * 100 : null;
  const parCategorie = {};
  monthEntries.filter(e => e.type === 'depense').forEach(e => { parCategorie[e.categorie] = (parCategorie[e.categorie] || 0) + e.montant; });
  const repartition = Object.keys(parCategorie)
    .map(c => ({categorie: c, montant: parCategorie[c], pct: depenses > 0 ? (parCategorie[c] / depenses) * 100 : 0}))
    .sort((a, b) => b.montant - a.montant);
  return {mois, revenus, depenses, solde, tauxEpargnePct, repartition};
}
// Détecteur automatique — chaque règle ne s'active QUE si les données
// nécessaires existent réellement (jamais un statut fabriqué faute de
// donnée), et chaque message cite le chiffre réel calculé, jamais un
// jugement seul ("tu dépenses trop") sans le nombre qui le justifie. Seuils
// (33 % taux d'endettement, 3 mois de fonds d'urgence, 10 % taux d'épargne)
// documentés ici et dans le panneau méthodologie comme des repères usuels de
// gestion budgétaire, jamais présentés comme une règle universelle ou un
// conseil personnalisé.
function computeFinancialDiagnostics(ctx){
  const diagnostics = [];
  const budgetSummary = ctx && ctx.budgetSummary;
  const debts = (ctx && ctx.debts) || [];
  const recurringChargesTotal = ctx && ctx.recurringChargesTotal;
  const assets = (ctx && ctx.assets) || [];

  if(budgetSummary && budgetSummary.revenus > 0){
    if(budgetSummary.solde < 0){
      diagnostics.push({id:'solde-negatif', niveau:'alerte', message:`Tu as dépensé ${fmtEUR(-budgetSummary.solde)} de plus que tu n'as gagné ce mois-ci.`});
    } else if(budgetSummary.tauxEpargnePct < 10){
      diagnostics.push({id:'epargne-faible', niveau:'attention', message:`Ton taux d'épargne ce mois-ci est de ${budgetSummary.tauxEpargnePct.toFixed(0)} % — sous le repère usuel de 10 % souvent cité en gestion budgétaire.`});
    } else {
      diagnostics.push({id:'epargne-ok', niveau:'ok', message:`Ton taux d'épargne ce mois-ci est de ${budgetSummary.tauxEpargnePct.toFixed(0)} %.`});
    }
  }

  if(budgetSummary && budgetSummary.revenus > 0 && debts.length > 0){
    const mensualites = debts.reduce((s, d) => s + (typeof d.minPayment === 'number' ? d.minPayment : 0), 0);
    const tauxEndettementPct = (mensualites / budgetSummary.revenus) * 100;
    if(tauxEndettementPct > 33){
      diagnostics.push({id:'endettement-eleve', niveau:'alerte', message:`Tes mensualités de crédit représentent ${tauxEndettementPct.toFixed(0)} % de tes revenus — au-dessus du seuil de 33 % généralement retenu par les banques françaises pour le taux d'endettement.`});
    } else if(tauxEndettementPct > 25){
      diagnostics.push({id:'endettement-moyen', niveau:'attention', message:`Tes mensualités de crédit représentent ${tauxEndettementPct.toFixed(0)} % de tes revenus.`});
    } else {
      diagnostics.push({id:'endettement-ok', niveau:'ok', message:`Tes mensualités de crédit représentent ${tauxEndettementPct.toFixed(0)} % de tes revenus.`});
    }
  }

  if(budgetSummary && budgetSummary.revenus > 0 && recurringChargesTotal && recurringChargesTotal.mensuel > 0){
    const pct = (recurringChargesTotal.mensuel / budgetSummary.revenus) * 100;
    if(pct > 15){
      diagnostics.push({id:'charges-elevees', niveau:'attention', message:`Tes abonnements et factures récurrents représentent ${pct.toFixed(0)} % de tes revenus (${fmtEUR(recurringChargesTotal.mensuel)}/mois).`});
    }
  }

  if(budgetSummary && budgetSummary.depenses > 0 && assets.length > 0){
    const cash = assets.filter(a => a.categorie === 'cash').reduce((s, a) => s + a.valeur, 0);
    const moisCouverts = cash / budgetSummary.depenses;
    if(moisCouverts < 1){
      diagnostics.push({id:'urgence-faible', niveau:'alerte', message:`Ton épargne disponible (${fmtEUR(cash)}) couvre moins d'1 mois de dépenses au rythme actuel.`});
    } else if(moisCouverts < 3){
      diagnostics.push({id:'urgence-moyenne', niveau:'attention', message:`Ton épargne disponible couvre environ ${moisCouverts.toFixed(1)} mois de dépenses — sous le repère usuel de 3 mois pour un fonds d'urgence.`});
    } else {
      diagnostics.push({id:'urgence-ok', niveau:'ok', message:`Ton épargne disponible couvre environ ${moisCouverts.toFixed(1)} mois de dépenses.`});
    }
  }

  return diagnostics;
}
// Dashboard central — ne stocke jamais rien lui-même, recompose uniquement à
// partir des registres existants (source de vérité unique, §71 du prompt
// Financial Lab) : fzr-budget-entries, fzr-personal-debts,
// fzr-financial-goals, fzr-recurring-charges, fzr-net-worth-assets.
function computeFinancialDashboard(mois){
  const entries = getBudgetEntries();
  const budgetSummary = computeBudgetSummary(entries, mois);
  const budgetSummaryPrecedent = computeBudgetSummary(entries, previousMonthKey(mois));
  const debts = getPersonalDebts();
  const goals = getFinancialGoals().map(g => ({...g, projection: computeGoalProjection(g)}));
  const recurringChargesTotal = computeRecurringChargesTotal(getRecurringCharges());
  const assets = getNetWorthAssets();
  const netWorth = computeNetWorth(assets, debts);
  const diagnostics = computeFinancialDiagnostics({budgetSummary, debts, recurringChargesTotal, assets});
  return {mois, budgetSummary, budgetSummaryPrecedent, debts, goals, recurringChargesTotal, netWorth, diagnostics};
}

// ============================================================
// ---------- PROFIL ENTREPRISE PERSISTANT (Financial Lab, Phase 0 côté
// Professionnel — l'audit du 26/08/2026 a confirmé qu'aucun profil
// d'entreprise central n'existe : Unit Economics et "Construire mon projet"
// ont chacun leur propre stockage isolé, jamais réutilisé ailleurs, et
// VAN/TRI/LBO/DCF repartent de zéro à chaque visite. Un seul profil (pas une
// liste, comme fzr-profile côté personnel — une entreprise à la fois) :
// même pattern defaults + merge que getProfile/saveProfile, pour que
// l'ajout d'un futur champ ne casse jamais un profil déjà sauvegardé. ----------
// ============================================================
const BUSINESS_PROFILE_DEFAULTS = {
  nom: '', revenueMode: 'manuel', ca: 0, clients: 0,
  prixUnitaire: 0, volumeAnnuel: 0, panierMoyenAnnuel: 0,
  nombreAbonnes: 0, prixAbonnementMensuel: 0, produits: [],
  coutsFixesMensuels: 0, coutsVariablesPct: 0,
  effectif: 0, masseSalarialeMensuelle: 0, budgetMarketingMensuel: 0,
  detteTotale: 0, tresorerieActuelle: 0
};
function getBusinessProfile(){
  const stored = safeGetJSON('fzr-business-profile', null);
  if(!stored) return {...BUSINESS_PROFILE_DEFAULTS};
  return {...BUSINESS_PROFILE_DEFAULTS, ...stored};
}
// Modèle de revenus généralisé (Financial Lab, Phase 4) : le CA n'est plus
// forcément un chiffre saisi à la main — 4 formules alternatives, chacune
// adaptée à un type de business réel. "ca" reste le champ unique lu partout
// ailleurs (§71, source de vérité unique) : saveBusinessProfile le recalcule
// toujours automatiquement à partir du mode choisi, sauf en mode "manuel" où
// c'est la seule vraie source.
const REVENUE_MODES = ['manuel', 'prix-volume', 'clients-panier', 'abonnement', 'multi-produits'];
function computeRevenueModel(profile){
  const p = profile || getBusinessProfile();
  switch(p.revenueMode){
    case 'prix-volume':
      return {ca: (p.prixUnitaire || 0) * (p.volumeAnnuel || 0), detail: `${p.volumeAnnuel || 0} ventes/an × ${fmtEUR(p.prixUnitaire || 0)}`};
    case 'clients-panier':
      return {ca: (p.clients || 0) * (p.panierMoyenAnnuel || 0), detail: `${p.clients || 0} clients × ${fmtEUR(p.panierMoyenAnnuel || 0)}/an`};
    case 'abonnement':
      return {ca: (p.nombreAbonnes || 0) * (p.prixAbonnementMensuel || 0) * 12, detail: `${p.nombreAbonnes || 0} abonnés × ${fmtEUR(p.prixAbonnementMensuel || 0)}/mois × 12`};
    case 'multi-produits': {
      const produits = Array.isArray(p.produits) ? p.produits : [];
      return {ca: produits.reduce((s, prod) => s + (prod.prix || 0) * (prod.volume || 0), 0), detail: `${produits.length} produit(s)`};
    }
    default:
      return {ca: p.ca || 0, detail: 'Saisi manuellement'};
  }
}
function saveBusinessProfile(profile){
  const current = getBusinessProfile();
  const merged = {...current, ...(profile || {})};
  // Validation champ par champ : un champ invalide reprend sa valeur
  // actuelle plutôt que de faire échouer toute la sauvegarde ou d'accepter
  // une valeur négative/NaN silencieusement.
  const numericFields = ['ca', 'clients', 'prixUnitaire', 'volumeAnnuel', 'panierMoyenAnnuel', 'nombreAbonnes', 'prixAbonnementMensuel', 'coutsFixesMensuels', 'coutsVariablesPct', 'effectif', 'masseSalarialeMensuelle', 'budgetMarketingMensuel', 'detteTotale', 'tresorerieActuelle'];
  numericFields.forEach(f => { if(!(typeof merged[f] === 'number' && isFinite(merged[f]) && merged[f] >= 0)) merged[f] = current[f]; });
  merged.nom = typeof merged.nom === 'string' ? merged.nom.trim().slice(0, 80) : current.nom;
  merged.revenueMode = REVENUE_MODES.includes(merged.revenueMode) ? merged.revenueMode : current.revenueMode;
  merged.produits = Array.isArray(merged.produits)
    ? merged.produits
        .filter(prod => prod && typeof prod.nom === 'string' && prod.nom.trim() && typeof prod.prix === 'number' && prod.prix >= 0 && typeof prod.volume === 'number' && prod.volume >= 0)
        .map(prod => ({nom: prod.nom.trim().slice(0, 60), prix: prod.prix, volume: prod.volume}))
    : current.produits;
  merged.ca = computeRevenueModel(merged).ca;
  safeSetJSON('fzr-business-profile', merged);
  return merged;
}
// Compte de résultat simplifié (Financial Lab, Phase 4) — Chiffre d'affaires
// → marge sur coûts variables → résultat, à partir du profil entreprise
// persistant. margeSurCoutsVariables n'est jamais présentée comme une EBITDA
// (qui exigerait de trancher quels postes sont "opérationnels", non modélisé
// ici) — juste la première brique honnête d'un compte de résultat.
function computeBusinessProfileSnapshot(profile){
  const p = profile || getBusinessProfile();
  const revenue = computeRevenueModel(p);
  const ca = revenue.ca;
  const caMensuel = ca / 12;
  const coutsVariablesMensuels = caMensuel * (p.coutsVariablesPct / 100);
  const margeSurCoutsVariables = caMensuel - coutsVariablesMensuels;
  const chargesMensuellesTotales = p.coutsFixesMensuels + p.masseSalarialeMensuelle + p.budgetMarketingMensuel;
  const resultatMensuelApproximatif = margeSurCoutsVariables - chargesMensuellesTotales;
  return {
    ca, caDetail: revenue.detail, caMensuel, coutsVariablesMensuels, margeSurCoutsVariables,
    chargesMensuellesTotales, resultatMensuelApproximatif, resultatAnnuelApproximatif: resultatMensuelApproximatif * 12,
    caParClient: p.clients > 0 ? ca / p.clients : null
  };
}

// ---------- UI du profil entreprise (Financial Lab, Phase 4) : tous les
// champs des 5 modes de revenus restent présents dans le DOM en permanence
// (jamais recréés via innerHTML), seule leur visibilité bascule selon le
// mode choisi — jamais un re-rendu complet à chaque changement qui ferait
// perdre le focus clavier. La liste de produits (mode multi-produits) suit
// le même patron que createDebtRowList (scripts/pages/laboratoire.js) :
// lignes ajoutées via document.createElement, jamais via innerHTML. ----------
const REVENUE_MODE_LABELS = {
  manuel: 'Montant annuel connu',
  'prix-volume': 'Prix unitaire × volume de ventes',
  'clients-panier': 'Nombre de clients × panier moyen',
  abonnement: 'Abonnement (MRR)',
  'multi-produits': 'Plusieurs produits/services'
};
function renderCompanyProfile(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const stored = getBusinessProfile();

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} Une seule fiche pour ton entreprise, réutilisée par les autres outils du Business Lab — jamais une donnée à ressaisir à deux endroits.</p>
    <div class="field"><label for="${elId}-nom">Nom de l'entreprise</label><input type="text" id="${elId}-nom" value="${stored.nom || ''}" placeholder="Ma Startup"></div>
    <div class="field" style="max-width:340px;"><label for="${elId}-revenueMode">Comment calculer ton chiffre d'affaires ?</label>
      <select id="${elId}-revenueMode">
        ${REVENUE_MODES.map(m => `<option value="${m}" ${stored.revenueMode===m?'selected':''}>${REVENUE_MODE_LABELS[m]}</option>`).join('')}
      </select>
    </div>
    <div id="${elId}-mode-manuel" class="revenue-mode-group">
      <div class="field" style="max-width:220px;"><label for="${elId}-ca">Chiffre d'affaires annuel (€)</label><input type="number" id="${elId}-ca" min="0" value="${stored.ca}"></div>
    </div>
    <div id="${elId}-mode-prix-volume" class="revenue-mode-group" style="display:flex;gap:12px;flex-wrap:wrap;">
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-prixUnitaire">Prix unitaire (€)</label><input type="number" id="${elId}-prixUnitaire" min="0" value="${stored.prixUnitaire}"></div>
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-volumeAnnuel">Volume de ventes / an</label><input type="number" id="${elId}-volumeAnnuel" min="0" value="${stored.volumeAnnuel}"></div>
    </div>
    <div id="${elId}-mode-clients-panier" class="revenue-mode-group" style="display:flex;gap:12px;flex-wrap:wrap;">
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-clients">Nombre de clients</label><input type="number" id="${elId}-clients" min="0" value="${stored.clients}"></div>
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-panierMoyenAnnuel">Panier moyen / an (€)</label><input type="number" id="${elId}-panierMoyenAnnuel" min="0" value="${stored.panierMoyenAnnuel}"></div>
    </div>
    <div id="${elId}-mode-abonnement" class="revenue-mode-group" style="display:flex;gap:12px;flex-wrap:wrap;">
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-nombreAbonnes">Nombre d'abonnés</label><input type="number" id="${elId}-nombreAbonnes" min="0" value="${stored.nombreAbonnes}"></div>
      <div class="field" style="flex:1;min-width:160px;"><label for="${elId}-prixAbonnementMensuel">Prix de l'abonnement (€/mois)</label><input type="number" id="${elId}-prixAbonnementMensuel" min="0" value="${stored.prixAbonnementMensuel}"></div>
    </div>
    <div id="${elId}-mode-multi-produits" class="revenue-mode-group">
      <div id="${elId}-produitsRows"></div>
      <button type="button" class="btn btn-sm" id="${elId}-produitAdd" style="margin-top:8px;">+ Ajouter un produit</button>
    </div>
    <div class="card-grid" style="margin-top:16px;">
      <div class="field"><label for="${elId}-coutsFixesMensuels">Coûts fixes mensuels (€)</label><input type="number" id="${elId}-coutsFixesMensuels" min="0" value="${stored.coutsFixesMensuels}"></div>
      <div class="field"><label for="${elId}-coutsVariablesPct">Coûts variables (% du CA)</label><input type="number" id="${elId}-coutsVariablesPct" min="0" max="100" value="${stored.coutsVariablesPct}"></div>
      <div class="field"><label for="${elId}-effectif">Effectif</label><input type="number" id="${elId}-effectif" min="0" value="${stored.effectif}"></div>
      <div class="field"><label for="${elId}-masseSalarialeMensuelle">Masse salariale mensuelle (€)</label><input type="number" id="${elId}-masseSalarialeMensuelle" min="0" value="${stored.masseSalarialeMensuelle}"></div>
      <div class="field"><label for="${elId}-budgetMarketingMensuel">Budget marketing mensuel (€)</label><input type="number" id="${elId}-budgetMarketingMensuel" min="0" value="${stored.budgetMarketingMensuel}"></div>
      <div class="field"><label for="${elId}-detteTotale">Dette totale (€)</label><input type="number" id="${elId}-detteTotale" min="0" value="${stored.detteTotale}"></div>
      <div class="field"><label for="${elId}-tresorerieActuelle">Trésorerie actuelle (€)</label><input type="number" id="${elId}-tresorerieActuelle" min="0" value="${stored.tresorerieActuelle}"></div>
    </div>
    <div id="${elId}-results" style="margin-top:16px;"></div>
    <div id="${elId}-method"></div>
    <div id="${elId}-nextstep" style="margin-top:10px;"></div>`;

  function readProduits(){
    return Array.from(document.querySelectorAll(`#${elId}-produitsRows > div`)).map(row => ({
      nom: row.querySelector('.produit-nom').value || 'Produit',
      prix: +row.querySelector('.produit-prix').value || 0,
      volume: +row.querySelector('.produit-volume').value || 0
    }));
  }

  function addProduitRow(nom, prix, volume){
    const row = document.createElement('div');
    row.className = 'field';
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px;';
    row.innerHTML = `
      <input type="text" class="produit-nom" placeholder="Nom du produit" value="${nom || ''}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:2;min-width:120px;">
      <input type="number" class="produit-prix" placeholder="Prix (€)" value="${typeof prix === 'number' ? prix : 10}" min="0" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:1;min-width:90px;">
      <input type="number" class="produit-volume" placeholder="Volume/an" value="${typeof volume === 'number' ? volume : 100}" min="0" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;flex:1;min-width:90px;">
      <button type="button" class="btn btn-sm produit-remove" aria-label="Retirer ce produit">✕</button>`;
    document.getElementById(`${elId}-produitsRows`).appendChild(row);
    row.querySelectorAll('input').forEach(i => i.addEventListener('input', update));
    row.querySelectorAll('.produit-remove').forEach(btn => btn.addEventListener('click', () => { row.remove(); update(); }));
  }

  function updateModeVisibility(mode){
    REVENUE_MODES.forEach(m => {
      const group = document.getElementById(`${elId}-mode-${m}`);
      if(group) group.style.display = (m === mode) ? '' : 'none';
    });
  }

  function update(){
    const inputs = {
      nom: document.getElementById(`${elId}-nom`).value,
      revenueMode: document.getElementById(`${elId}-revenueMode`).value,
      ca: +document.getElementById(`${elId}-ca`).value,
      prixUnitaire: +document.getElementById(`${elId}-prixUnitaire`).value,
      volumeAnnuel: +document.getElementById(`${elId}-volumeAnnuel`).value,
      clients: +document.getElementById(`${elId}-clients`).value,
      panierMoyenAnnuel: +document.getElementById(`${elId}-panierMoyenAnnuel`).value,
      nombreAbonnes: +document.getElementById(`${elId}-nombreAbonnes`).value,
      prixAbonnementMensuel: +document.getElementById(`${elId}-prixAbonnementMensuel`).value,
      produits: readProduits(),
      coutsFixesMensuels: +document.getElementById(`${elId}-coutsFixesMensuels`).value,
      coutsVariablesPct: +document.getElementById(`${elId}-coutsVariablesPct`).value,
      effectif: +document.getElementById(`${elId}-effectif`).value,
      masseSalarialeMensuelle: +document.getElementById(`${elId}-masseSalarialeMensuelle`).value,
      budgetMarketingMensuel: +document.getElementById(`${elId}-budgetMarketingMensuel`).value,
      detteTotale: +document.getElementById(`${elId}-detteTotale`).value,
      tresorerieActuelle: +document.getElementById(`${elId}-tresorerieActuelle`).value
    };
    const saved = saveBusinessProfile(inputs);
    const snap = computeBusinessProfileSnapshot(saved);
    document.getElementById(`${elId}-results`).innerHTML = `
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Compte de résultat simplifié (mensuel)</span>
      <div class="result-row" style="justify-content:space-between;"><span>Chiffre d'affaires</span><span class="mono">${fmtEUR(snap.caMensuel)}</span></div>
      <div class="result-row" style="justify-content:space-between;"><span>− Coûts variables</span><span class="mono">${fmtEUR(snap.coutsVariablesMensuels)}</span></div>
      <div class="result-row" style="justify-content:space-between;border-top:1px solid var(--hairline);padding-top:6px;"><span><strong>= Marge sur coûts variables</strong></span><span class="mono"><strong>${fmtEUR(snap.margeSurCoutsVariables)}</strong></span></div>
      <div class="result-row" style="justify-content:space-between;"><span>− Charges fixes, salaires, marketing</span><span class="mono">${fmtEUR(snap.chargesMensuellesTotales)}</span></div>
      <div class="result-row" style="justify-content:space-between;border-top:1px solid var(--hairline);padding-top:6px;margin-top:4px;"><span><strong>= Résultat net approximatif</strong></span><span class="mono" style="color:${snap.resultatMensuelApproximatif>=0?'var(--emerald)':'var(--bordeaux)'};font-size:16px;"><strong>${snap.resultatMensuelApproximatif>=0?'+':''}${fmtEUR(snap.resultatMensuelApproximatif)}</strong></span></div>
      <p style="font-size:12px;color:var(--text-dim);margin-top:10px;">Chiffre d'affaires : ${snap.caDetail} (${fmtEUR(snap.ca)}/an).${snap.caParClient !== null ? ` CA par client : ${fmtEUR(snap.caParClient)}/an.` : ''}</p>
      <p class="disclaimer-box" style="margin-top:10px;">Marge sur coûts variables, pas une EBITDA : ne tranche pas quels postes sont "opérationnels". Un compte de résultat simplifié, pas une vraie comptabilité (amortissements, impôts, charges sociales non détaillées ici).</p>
      ${renderCourseLibraryLinks(['Chiffre d\'affaires', 'Compte de résultat', 'Résultat net'])}
      ${renderRelatedCourseLink('lire-une-entreprise', 'Le compte de résultat : du chiffre d\'affaires au résultat net')}`;
    document.getElementById(`${elId}-method`).innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['profil-entreprise']);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'business'});
    // Tient le check-up "Analyser ma situation" à jour en direct — si sa
    // section n'existe pas sur la page (getElementById renvoie null),
    // renderBusinessDiagnostics ressort silencieusement sans rien faire.
    if(typeof renderBusinessDiagnostics === 'function') renderBusinessDiagnostics('businessDiagnostics');
  }

  document.getElementById(`${elId}-revenueMode`).addEventListener('change', () => { updateModeVisibility(document.getElementById(`${elId}-revenueMode`).value); update(); });
  ['nom','ca','prixUnitaire','volumeAnnuel','clients','panierMoyenAnnuel','nombreAbonnes','prixAbonnementMensuel','coutsFixesMensuels','coutsVariablesPct','effectif','masseSalarialeMensuelle','budgetMarketingMensuel','detteTotale','tresorerieActuelle'].forEach(key => {
    document.getElementById(`${elId}-${key}`).addEventListener('input', update);
  });
  document.getElementById(`${elId}-produitAdd`).addEventListener('click', () => { addProduitRow(); update(); });
  stored.produits.forEach(p => addProduitRow(p.nom, p.prix, p.volume));

  updateModeVisibility(stored.revenueMode);
  update();
}

// ---------- Paper Trading : argent fictif, exécuté à de vrais cours en direct
// (section "Bourse" — distinct du portefeuille réel/déclaratif ci-dessus, qui
// loggue les VRAIES transactions de l'utilisateur). Généralise
// computeRealPortfolioPositions (achat seul, additif) pour supporter la vente
// (réduction de position au coût moyen pondéré courant, P&L réalisé) et un
// solde de trésorerie fictif — jamais un ordre exécuté silencieusement au-delà
// des fonds disponibles ou de la position détenue. ----------
const PAPER_TRADING_KEY = 'fzr-paper-trading';
const PAPER_TRADING_STARTING_CASH = 10000;
function getPaperTradingState(){
  const raw = safeGetJSON(PAPER_TRADING_KEY, null);
  if(!raw || typeof raw.cash !== 'number' || !Array.isArray(raw.transactions)){
    return {cash: PAPER_TRADING_STARTING_CASH, transactions: []};
  }
  return raw;
}
function savePaperTradingState(state){ safeSetJSON(PAPER_TRADING_KEY, state); }
function resetPaperTradingState(){
  const state = {cash: PAPER_TRADING_STARTING_CASH, transactions: []};
  savePaperTradingState(state);
  return state;
}
// livePrices : {symbol: prixActuelRéel} — utilisé uniquement pour valider
// qu'une vente ne dépasse pas la position réellement détenue ; le prix
// d'EXÉCUTION de l'ordre, lui, vient toujours de `price` (le cours affiché à
// l'utilisateur au moment de passer l'ordre), jamais recalculé ici.
function executePaperTrade(symbol, name, assetType, action, qty, price){
  if(typeof symbol !== 'string' || !symbol || !(qty > 0) || !(price > 0)){
    return {ok: false, reason: 'Hypothèses invalides : symbole, quantité et prix doivent être renseignés et positifs.'};
  }
  const state = getPaperTradingState();
  const total = qty * price;
  if(action === 'buy'){
    if(total > state.cash){
      return {ok: false, reason: `Fonds insuffisants : cet achat coûterait ${total.toFixed(2)} €, il ne te reste que ${state.cash.toFixed(2)} € disponibles.`};
    }
    state.cash -= total;
  } else if(action === 'sell'){
    const {positions} = computePaperTradingPositions(state.transactions, {});
    const held = positions.find(p => p.symbol === symbol);
    const heldQty = held ? held.qty : 0;
    if(qty > heldQty){
      return {ok: false, reason: `Tu ne détiens que ${heldQty} unité${heldQty > 1 ? 's' : ''} de ${name || symbol} dans cette simulation, tu ne peux pas en vendre ${qty}.`};
    }
    state.cash += total;
  } else {
    return {ok: false, reason: 'Type d\'ordre inconnu.'};
  }
  const entry = {
    id: 'ptx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    date: new Date().toISOString(), symbol, name: name || symbol, assetType: assetType || 'stock',
    action, qty, price, total
  };
  state.transactions.push(entry);
  savePaperTradingState(state);
  return {ok: true, entry, state};
}
// Traite les transactions dans l'ordre chronologique (pas l'ordre de saisie,
// qui peut différer) : méthode du coût moyen pondéré, même principe que le
// simulateur "Prix moyen d'achat" du Laboratoire — une vente réduit la
// position au coût moyen COURANT (pas au coût moyen final), et réalise un
// gain/perte à ce moment précis de la séquence.
function computePaperTradingPositions(transactions, livePrices){
  livePrices = livePrices || {};
  const bySymbol = {};
  let realizedGainTotal = 0;
  const sorted = [...(transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(tx => {
    if(!tx || typeof tx.symbol !== 'string' || !(tx.qty > 0) || !(tx.price > 0)) return;
    if(!bySymbol[tx.symbol]) bySymbol[tx.symbol] = {symbol: tx.symbol, name: tx.name || tx.symbol, assetType: tx.assetType || 'stock', qty: 0, totalInvested: 0};
    const pos = bySymbol[tx.symbol];
    if(tx.action === 'buy'){
      pos.qty += tx.qty;
      pos.totalInvested += tx.qty * tx.price;
    } else if(tx.action === 'sell'){
      const avgCost = pos.qty > 0 ? pos.totalInvested / pos.qty : 0;
      const sellQty = Math.min(tx.qty, pos.qty);
      realizedGainTotal += sellQty * (tx.price - avgCost);
      pos.totalInvested -= sellQty * avgCost;
      pos.qty -= sellQty;
    }
  });
  const positions = Object.values(bySymbol)
    .filter(p => p.qty > 1e-9)
    .map(pos => {
      const currentPrice = typeof livePrices[pos.symbol] === 'number' ? livePrices[pos.symbol] : null;
      const avgBuyPrice = pos.totalInvested / pos.qty;
      const currentValue = currentPrice !== null ? currentPrice * pos.qty : null;
      const unrealizedGain = currentValue !== null ? currentValue - pos.totalInvested : null;
      const unrealizedGainPct = (currentValue !== null && pos.totalInvested > 0) ? (unrealizedGain / pos.totalInvested) * 100 : null;
      return {symbol: pos.symbol, name: pos.name, assetType: pos.assetType, qty: pos.qty, totalInvested: pos.totalInvested, avgBuyPrice, currentPrice, currentValue, unrealizedGain, unrealizedGainPct};
    })
    .sort((a, b) => (b.currentValue !== null ? b.currentValue : b.totalInvested) - (a.currentValue !== null ? a.currentValue : a.totalInvested));
  return {positions, realizedGainTotal};
}

// ---------- Contenu éditorial (résumé business / business model / risques) ----------
// Rédigé une fois pour les 8 valeurs suivies — pas généré à la volée, pour ne
// jamais mélanger un contenu qui se veut factuel avec un risque d'IA non
// relue. Basé sur des faits publics largement documentés (modèle économique
// de l'entreprise), jamais un chiffre précis inventé.
const COMPANY_EDITORIAL = {
  'AI.PA': {
    resume: "Air Liquide produit et distribue des gaz industriels et médicaux (oxygène, azote, hydrogène...) utilisés par l'industrie, la santé et l'électronique. Ses clients sont principalement des entreprises industrielles, des hôpitaux et des fabricants de semi-conducteurs.",
    businessModel: "Une large part du chiffre d'affaires vient de contrats de long terme (parfois 10 à 15 ans) avec des usines de production installées chez le client, ce qui donne une forte visibilité sur les revenus. L'activité est diversifiée entre plusieurs secteurs et zones géographiques.",
    risques: ["Activité capitalistique : les usines de production coûtent cher à construire avant de générer des revenus.", "Exposition à la conjoncture industrielle mondiale.", "Les nouveaux projets (ex. hydrogène) demandent des investissements importants par avance."]
  },
  'TTE.PA': {
    resume: "TotalEnergies est un groupe énergétique intégré : exploration et production de pétrole et de gaz, raffinage, distribution de carburants, et développement croissant dans l'électricité et les renouvelables.",
    businessModel: "Les revenus dépendent fortement des prix du pétrole et du gaz, très volatils et hors du contrôle de l'entreprise. Le groupe diversifie progressivement vers l'électricité pour réduire cette dépendance sur le long terme.",
    risques: ["Forte sensibilité aux prix des matières premières énergétiques.", "Risques réglementaires et géopolitiques liés aux zones d'exploration.", "La transition énergétique pourrait peser sur la demande de long terme pour les hydrocarbures."]
  },
  'SAN.PA': {
    resume: "Sanofi est un groupe pharmaceutique qui développe, fabrique et commercialise des médicaments et vaccins dans plusieurs domaines thérapeutiques (immunologie, vaccins, maladies rares...).",
    businessModel: "Les revenus reposent sur un portefeuille de médicaments protégés par des brevets, avec des marges élevées tant que l'exclusivité dure. La croissance dépend du renouvellement de ce portefeuille avant l'expiration des brevets existants.",
    risques: ["Expiration de brevets sur des médicaments majeurs (concurrence des génériques).", "Risque d'échec en phase de recherche clinique.", "Pression réglementaire sur les prix des médicaments dans plusieurs pays."]
  },
  'SAF.PA': {
    resume: "Safran conçoit et fabrique des moteurs d'avions (avec General Electric via CFM International), des équipements aéronautiques et des systèmes de défense.",
    businessModel: "Une grande partie des revenus vient des services après-vente (maintenance, pièces) sur les moteurs déjà en service — un flux récurrent qui grandit avec le nombre d'avions en circulation, pas seulement des ventes de moteurs neufs.",
    risques: ["Cycles longs et coûteux de développement de nouveaux moteurs.", "Forte dépendance au rythme de production des avionneurs et au trafic aérien mondial.", "Risque de perturbation des chaînes d'approvisionnement."]
  },
  'DG.PA': {
    resume: "Vinci est un groupe de construction et de concessions : il construit des infrastructures (routes, bâtiments) et exploite des concessions de long terme (autoroutes, aéroports).",
    businessModel: "Deux moteurs distincts : la construction (marges plus faibles, dépendante des chantiers en cours) et les concessions, qui génèrent des revenus récurrents et prévisibles sur plusieurs décennies.",
    risques: ["Les concessions dépendent du trafic réel (routier, aérien), sensible à la conjoncture.", "Risque réglementaire sur les tarifs des concessions.", "L'activité construction reste cyclique."]
  },
  'OR.PA': {
    resume: "L'Oréal conçoit, fabrique et distribue des produits de beauté et de soin (cosmétiques, parfums, soins capillaires) sous de multiples marques, du grand public au luxe.",
    businessModel: "La diversification par marque et par zone géographique limite la dépendance à un seul produit ou marché. Les marges dépendent du positionnement (luxe vs grand public) et de l'investissement marketing nécessaire pour maintenir la préférence de marque.",
    risques: ["Sensibilité aux dépenses discrétionnaires des consommateurs, surtout sur le segment luxe.", "Concurrence intense et coûts marketing élevés pour défendre les parts de marché.", "Exposition aux devises (ventes mondiales, coûts en partie en euros)."]
  },
  'ASML.AS': {
    resume: "ASML conçoit et fabrique les machines de lithographie utilisées pour produire les puces électroniques les plus avancées — un équipement indispensable aux plus grands fabricants de semi-conducteurs mondiaux.",
    businessModel: "ASML est en position de quasi-monopole sur la lithographie EUV, la technologie la plus avancée, ce qui lui donne un fort pouvoir de fixation des prix. Une partie des revenus vient aussi des services et de la maintenance des machines déjà installées.",
    risques: ["Très forte concentration de la clientèle (un petit nombre de très grands fabricants de puces).", "Cycles d'investissement des semi-conducteurs marqués par des phases de forte puis de faible demande.", "Restrictions à l'export (tensions géopolitiques) qui peuvent limiter certaines ventes."]
  },
  'MC.PA': {
    resume: "LVMH est un groupe de luxe réunissant de nombreuses maisons (mode, maroquinerie, vins et spiritueux, parfums, horlogerie, distribution sélective) opérant de façon largement indépendante sous un même groupe.",
    businessModel: "La diversification entre de nombreuses maisons et catégories de produits réduit la dépendance à une seule marque. Le positionnement haut de gamme permet des marges élevées, mais dépend de la capacité à maintenir la désirabilité des marques dans la durée.",
    risques: ["Sensibilité aux dépenses discrétionnaires des clients aisés, surtout en ralentissement économique.", "Risque de dilution de l'image de marque en cas de sur-expansion.", "Exposition aux devises et aux flux du tourisme international."]
  }
};

// ---------- Fonctions pures : lecture des fondamentaux ----------

// Seuils de lecture partagés (mêmes bandes partout sur le site) — une
// interprétation, jamais un fait en soi : toujours affichée à côté du vrai
// chiffre qui la justifie, jamais à sa place.
function bucketGrowth(pct){
  if(typeof pct !== 'number') return null;
  if(pct >= 0.10) return {level: 'forte', label: 'croissance forte'};
  if(pct >= 0.03) return {level: 'moderee', label: 'croissance modérée'};
  if(pct >= -0.02) return {level: 'stable', label: 'chiffre d\'affaires stable'};
  return {level: 'baisse', label: 'chiffre d\'affaires en baisse'};
}
function bucketMargin(pct){
  if(typeof pct !== 'number') return null;
  if(pct >= 0.20) return {level: 'elevee', label: 'marge élevée'};
  if(pct >= 0.08) return {level: 'moderee', label: 'marge modérée'};
  return {level: 'faible', label: 'marge faible'};
}
function bucketLeverage(totalDebt, totalCash){
  if(typeof totalDebt !== 'number' || typeof totalCash !== 'number') return null;
  const net = totalDebt - totalCash;
  if(net <= 0) return {level: 'faible', label: 'trésorerie nette positive (plus de cash que de dette)'};
  if(totalCash > 0 && net / totalCash <= 3) return {level: 'modere', label: 'endettement net modéré'};
  return {level: 'eleve', label: 'endettement net élevé'};
}

// Synthèse forces/faiblesses dérivée des vraies bandes ci-dessus — aucune
// nouvelle rédaction par entreprise, purement calculé.
function deriveStrengthsWeaknesses(fields){
  const strengths = [], weaknesses = [];
  const growth = bucketGrowth(fields.revenueGrowth);
  const margin = bucketMargin(fields.profitMargins);
  const leverage = bucketLeverage(fields.totalDebt, fields.totalCash);
  if(growth){ (growth.level === 'forte' || growth.level === 'moderee' ? strengths : weaknesses).push(`Chiffre d'affaires : ${growth.label} (${formatFundamentalValue('revenueGrowth', fields.revenueGrowth)}).`); }
  if(margin){ (margin.level === 'elevee' ? strengths : margin.level === 'faible' ? weaknesses : strengths).push(`Rentabilité : ${margin.label} (marge nette ${formatFundamentalValue('profitMargins', fields.profitMargins)}).`); }
  if(leverage){ (leverage.level === 'eleve' ? weaknesses : strengths).push(`Structure financière : ${leverage.label}.`); }
  return {strengths, weaknesses};
}

// ---------- Bouclage "Approfondir" (actualités -> Academy/Bibliothèque) ----------
// Généralise le lien en dur qui n'existait auparavant que pour la catégorie
// "Économie" (actualites.js) — mêmes vraies catégories Bibliothèque que
// DOMAINS (app.js), pas une nouvelle taxonomie inventée. Une catégorie sans
// équivalent réel en Bibliothèque (Géopolitique) ne force aucun lien.
const NEWS_CATEGORY_LINKS = {
  'Entreprises': 'Entreprises',
  'Technologie': 'Technologie',
  'Bourse': 'Bourse',
  'Crypto': 'Crypto',
  'Matières premières': 'Matières premières',
  'Économie': 'Économie'
};
function renderNewsApprofondirLink(categorie){
  const theme = NEWS_CATEGORY_LINKS[categorie];
  if(!theme) return '';
  return `<p style="font-size:12.5px;margin-bottom:14px;"><a href="bibliotheque.html#theme:${encodeURIComponent(theme)}" style="color:var(--gold-bright);">Voir le concept dans la Bibliothèque →</a></p>`;
}

// ---------- Impact potentiel (v1, volontairement modeste) : proximité thématique
// entre le secteur réel d'une valeur (STOCKS_DEMO.secteur) et les actualités
// hebdomadaires déjà réelles — jamais un badge directionnel (🟢/🔴), aucune
// donnée fiable ne permet une vraie classification sectorielle des actualités
// aujourd'hui. Une simple proximité de vocabulaire, jamais une affirmation
// causale ("cette actu va faire bouger ce titre"). ----------
const SECTOR_KEYWORDS = {
  'Industrie': ['industrie', 'industriel', 'usine', 'production'],
  'Énergie': ['pétrole', 'gaz', 'énergie', 'opep', 'baril', 'électricité'],
  'Santé': ['médicament', 'pharmaceutique', 'santé', 'vaccin', 'clinique'],
  'Aéronautique': ['aéronautique', 'avion', 'aviation', 'aérien'],
  'Construction': ['construction', 'btp', 'immobilier', 'infrastructure'],
  'Consommation': ['consommation', 'consommateur', 'grande distribution', 'détail'],
  'Technologie': ['technologie', 'semi-conducteur', 'intelligence artificielle', 'puce', 'numérique'],
  'Luxe': ['luxe', 'mode', 'discrétionnaire']
};
function findThematicNews(secteur, weeklyArticles){
  const keywords = SECTOR_KEYWORDS[secteur];
  if(!keywords || !Array.isArray(weeklyArticles)) return [];
  return weeklyArticles.filter(a => {
    const text = [a.titre, a.resume, a.pourquoi, ...(a.points || [])].join(' ').toLowerCase();
    return keywords.some(k => text.includes(k));
  });
}

// ---------- Chronologie d'entreprise (fiche action) ----------
// Mouvement de cours réel et notable, calculé mois par mois sur l'historique
// déjà récupéré (aucun nouvel appel réseau) — seuil explicite, jamais une
// interprétation de la cause : "mouvement observé", jamais "causé par".
function detectSignificantPriceMoves(monthlyPoints, thresholdPct){
  thresholdPct = typeof thresholdPct === 'number' ? thresholdPct : 12;
  if(!Array.isArray(monthlyPoints) || monthlyPoints.length < 2) return [];
  const moves = [];
  for(let i = 1; i < monthlyPoints.length; i++){
    const prev = monthlyPoints[i - 1], curr = monthlyPoints[i];
    if(typeof prev.close !== 'number' || typeof curr.close !== 'number' || prev.close <= 0) continue;
    const changePct = (curr.close / prev.close - 1) * 100;
    if(Math.abs(changePct) >= thresholdPct){
      moves.push({period: curr.period, changePct, priceBefore: prev.close, priceAfter: curr.close});
    }
  }
  return moves;
}

// Fusionne les catégories d'événements réels disponibles en une chronologie
// triée (plus ancien en premier, comme une vraie histoire de l'entreprise) —
// une catégorie absente ou vide est simplement omise, jamais comblée par une
// valeur inventée. `earnings` : vérifié en direct (Yahoo quoteSummary,
// 2026-08-22) que earningsHistory.history contient aussi des trimestres PAS
// ENCORE publiés (epsEstimate seul, sans epsActual — ex. AI.PA n'avait alors
// AUCUN trimestre passé avec un vrai epsActual, contrairement à AAPL) :
// filtré ici en dur sur la présence réelle d'epsActual, jamais une
// estimation présentée comme un résultat déjà publié.
function buildCompanyTimeline({dividendEvents, priceMoves, earnings, thematicNews}){
  const entries = [];
  (dividendEvents || []).forEach(d => {
    if(!d || typeof d.date !== 'string' || typeof d.amount !== 'number') return;
    entries.push({date: d.date, type: 'dividende', label: `Dividende versé : ${d.amount.toFixed(2).replace('.', ',')} €`, badge: 'fait'});
  });
  (priceMoves || []).forEach(m => {
    if(!m || typeof m.period !== 'string' || typeof m.changePct !== 'number') return;
    entries.push({
      date: `${m.period}-01`, type: 'mouvement',
      label: `Mouvement de cours observé : ${m.changePct >= 0 ? '+' : ''}${m.changePct.toFixed(1).replace('.', ',')} %`,
      changePct: m.changePct, priceBefore: m.priceBefore, priceAfter: m.priceAfter, badge: 'calcul'
    });
  });
  (earnings || []).forEach(e => {
    if(!e || typeof e.epsActual !== 'number' || typeof e.quarterDate !== 'string') return;
    const surprisePct = typeof e.epsEstimate === 'number' && e.epsEstimate !== 0 ? ((e.epsActual / e.epsEstimate - 1) * 100) : null;
    entries.push({
      date: e.quarterDate, type: 'resultat',
      label: `Résultat trimestriel publié : BPA réel ${e.epsActual.toFixed(2).replace('.', ',')}${typeof e.epsEstimate === 'number' ? ` vs attendu ${e.epsEstimate.toFixed(2).replace('.', ',')}` : ''}`,
      epsActual: e.epsActual, epsEstimate: e.epsEstimate, surprisePct, badge: 'fait'
    });
  });
  (thematicNews || []).forEach(a => {
    if(!a || typeof a.date !== 'string' || !a.titre) return;
    entries.push({date: a.date, type: 'actualite', label: a.titre, slug: a.slug || null, badge: 'fait'});
  });
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Comparateur : verdict par angle, jamais de gagnant global ----------
function computeComparisonAngles(companyA, companyB){
  const angles = [];
  const fa = companyA.fields, fb = companyB.fields;

  angles.push({
    angle: 'croissance', label: 'Pour la croissance',
    readings: [companyA, companyB].map((c, i) => ({symbol: c.symbol, text: `${formatFundamentalValue('revenueGrowth', (i === 0 ? fa : fb).revenueGrowth)} de croissance du chiffre d'affaires (${(i === 0 ? fa : fb).revenueGrowth != null ? 'donnée réelle, dernier exercice connu' : 'donnée indisponible'})`})),
    framing: (typeof fa.revenueGrowth === 'number' && typeof fb.revenueGrowth === 'number')
      ? `Sur ce seul critère, ${(fa.revenueGrowth >= fb.revenueGrowth ? companyA.symbol : companyB.symbol)} pourrait sembler plus adapté selon l'hypothèse que la croissance récente se poursuit — une hypothèse, pas une garantie.`
      : "Comparaison impossible sur ce critère : au moins une donnée est indisponible."
  });
  angles.push({
    angle: 'stabilite', label: 'Pour la stabilité',
    readings: [companyA, companyB].map(c => ({symbol: c.symbol, text: `${bucketLeverage(c.fields.totalDebt, c.fields.totalCash) ? bucketLeverage(c.fields.totalDebt, c.fields.totalCash).label : FUNDAMENTALS_UNAVAILABLE_TEXT}`})),
    framing: "Une trésorerie nette positive ou un endettement net modéré peut mieux absorber un ralentissement — mais la stabilité dépend aussi de facteurs non financiers (position concurrentielle, cycle du secteur)."
  });
  angles.push({
    angle: 'dividendes', label: 'Pour les dividendes',
    readings: [companyA, companyB].map(c => ({symbol: c.symbol, text: formatFundamentalValue('dividendYield', c.fields.dividendYield)})),
    framing: (typeof fa.dividendYield === 'number' && typeof fb.dividendYield === 'number')
      ? `${(fa.dividendYield >= fb.dividendYield ? companyA.symbol : companyB.symbol)} verse aujourd'hui un rendement plus élevé — un rendement passé ne garantit pas son maintien futur.`
      : "Comparaison impossible sur ce critère : au moins une donnée est indisponible."
  });
  angles.push({
    angle: 'valorisation', label: 'Pour une valorisation prudente',
    readings: [companyA, companyB].map(c => ({symbol: c.symbol, text: `PER ${formatFundamentalValue('trailingPE', c.fields.trailingPE)}`})),
    framing: (typeof fa.trailingPE === 'number' && typeof fb.trailingPE === 'number')
      ? `${(fa.trailingPE <= fb.trailingPE ? companyA.symbol : companyB.symbol)} se paie aujourd'hui un multiple plus faible — un PER plus élevé peut se justifier par une croissance plus forte, des marges plus élevées, ou une position dominante, pas seulement par une survalorisation.`
      : "Comparaison impossible sur ce critère : au moins une donnée est indisponible."
  });
  return angles;
}

// ---------- Curseur d'hypothèses comparatif (même hypothèse, vrais points de départ) ----------
function computeComparativeScenarios(epsA, epsB, {growth, perTarget, horizon}){
  function oneScenario(bpaActuel){
    if(typeof bpaActuel !== 'number') return null;
    const defs = {
      defavorable: {growth: growth - 6, per: perTarget * 0.75},
      central: {growth, per: perTarget},
      favorable: {growth: growth + 6, per: perTarget * 1.25}
    };
    const out = {};
    Object.entries(defs).forEach(([key, s]) => {
      const bpaFutur = bpaActuel * Math.pow(1 + s.growth / 100, horizon);
      out[key] = {prixCible: bpaFutur * s.per};
    });
    return out;
  }
  return {a: oneScenario(epsA), b: oneScenario(epsB)};
}

// ---------- Scénarios ancrés sur de vraies cibles de cours d'analystes ----------
// Remplace la logique "hypothèses libres" (croissance/PER choisis par
// l'utilisateur, qui pouvaient produire des résultats déconnectés de
// l'entreprise réelle) par les vraies cibles basse/moyenne/haute publiées par
// les analystes qui suivent le titre — des estimations professionnelles
// réelles, sourcées et datées, jamais une invention Likanza. Ce ne sont pas
// des garanties : les analystes peuvent se tromper, et l'horizon type de ces
// cibles est d'environ 12 mois (convention courante du secteur, pas une
// donnée renvoyée telle quelle par l'API).
function computeAnalystScenarios(fields, currentPrice, investAmount){
  if(typeof currentPrice !== 'number' || currentPrice <= 0 || typeof investAmount !== 'number' || investAmount <= 0) return null;
  const shares = investAmount / currentPrice;
  function oneCase(targetPrice){
    if(typeof targetPrice !== 'number') return null;
    const projectedValue = shares * targetPrice;
    return {
      targetPrice,
      projectedValue,
      gainEur: projectedValue - investAmount,
      gainPct: (targetPrice / currentPrice - 1) * 100
    };
  }
  return {
    bear: oneCase(fields.targetLowPrice),
    base: oneCase(fields.targetMeanPrice),
    bull: oneCase(fields.targetHighPrice)
  };
}

// Facteurs qui POURRAIENT peser vers chaque scénario — dérivés des vraies
// bandes de croissance/marge/levier déjà calculées pour le Comparateur
// (jamais une nouvelle donnée inventée) + du contenu éditorial réel de
// l'entreprise. Décrit ce qui pourrait justifier chaque cas, jamais une
// affirmation sur ce que les analystes pensent réellement (cette information
// n'est pas disponible via l'API).
function buildAnalystScenarioFactors(caseKey, fields, editorial){
  const factors = [];
  const growth = bucketGrowth(fields.revenueGrowth);
  const margin = bucketMargin(fields.profitMargins);
  const leverage = bucketLeverage(fields.totalDebt, fields.totalCash);

  if(caseKey === 'bear'){
    if(growth && (growth.level === 'stable' || growth.level === 'baisse')) factors.push(`Croissance du chiffre d'affaires actuellement ${growth.label} (${formatFundamentalValue('revenueGrowth', fields.revenueGrowth)}).`);
    if(margin && margin.level === 'faible') factors.push(`Marge nette actuellement faible (${formatFundamentalValue('profitMargins', fields.profitMargins)}).`);
    if(leverage && leverage.level === 'eleve') factors.push('Endettement net élevé.');
    if(editorial) editorial.risques.forEach(r => factors.push(r));
  } else if(caseKey === 'bull'){
    if(growth && (growth.level === 'forte' || growth.level === 'moderee')) factors.push(`Croissance du chiffre d'affaires actuellement ${growth.label} (${formatFundamentalValue('revenueGrowth', fields.revenueGrowth)}).`);
    if(margin && margin.level === 'elevee') factors.push(`Marge nette actuellement élevée (${formatFundamentalValue('profitMargins', fields.profitMargins)}).`);
    if(leverage && leverage.level === 'faible') factors.push('Trésorerie nette positive (plus de cash que de dette).');
    if(editorial) factors.push(editorial.businessModel);
  } else {
    factors.push("Reflète la moyenne des estimations des analystes qui suivent ce titre — un équilibre entre les facteurs favorables et défavorables listés dans les deux autres scénarios.");
  }
  return factors;
}

// Consensus réel (répartition achat fort/achat/conserver/vente/vente forte) —
// null si l'API ne renvoie rien pour ce titre, jamais une répartition inventée.
function formatAnalystConsensus(fundamentals){
  if(!fundamentals || !fundamentals.recommendationLabel || !fundamentals.recommendationBreakdown) return null;
  const b = fundamentals.recommendationBreakdown;
  return {
    label: fundamentals.recommendationLabel,
    breakdown: b,
    total: b.strongBuy + b.buy + b.hold + b.sell + b.strongSell,
    numberOfAnalystOpinions: fundamentals.fields ? fundamentals.fields.numberOfAnalystOpinions : null
  };
}

// ---------- « Pourquoi ? » : explique une métrique déjà affichée, sans jamais
// faire de nouvel appel réseau — uniquement des données déjà en cache
// (companyFundamentalsCache) et les primitives déjà utilisées par le
// Comparateur (bucketGrowth/bucketMargin/bucketLeverage,
// deriveStrengthsWeaknesses, COMPANY_EDITORIAL). Si la donnée sous-jacente est
// absente, le composant le dit — jamais un texte de remplissage inventé. ----------
const WHY_FIELD_DEFINITIONS = {
  trailingPE: "Le PER (price-to-earnings ratio) compare le cours de l'action au bénéfice par action : il indique combien d'années de bénéfice actuel le marché est prêt à payer pour posséder l'action.",
  forwardPE: "Le PER prévisionnel utilise le bénéfice attendu (estimation, pas un fait) plutôt que le bénéfice déjà publié — il reflète les anticipations du marché, pas une garantie.",
  priceToSales: "Le P/S compare le cours au chiffre d'affaires par action : utile pour valoriser des entreprises pas encore rentables, où le PER n'a pas de sens.",
  priceToBook: "Le Price/Book compare le cours à la valeur comptable des actifs de l'entreprise : un repère surtout pertinent pour des secteurs à fort actif tangible (banques, industrie lourde).",
  evToRevenue: "L'EV/CA compare la valeur d'entreprise (capitalisation + dette − trésorerie) à son chiffre d'affaires, sans être affecté par la rentabilité ou la structure de dette.",
  evToEbitda: "L'EV/EBITDA compare la valeur d'entreprise à son excédent brut d'exploitation : une mesure de valorisation qui, contrairement au PER, n'est pas affectée par la structure de dette ou la fiscalité.",
  dividendYield: "Le rendement du dividende rapporte le dividende annuel versé au cours actuel de l'action : il mesure le revenu régulier généré par l'action, indépendamment de sa variation de cours.",
  marketCap: "La capitalisation boursière est la valeur totale de l'entreprise sur les marchés (cours × nombre d'actions) : elle situe la taille de l'entreprise, pas sa qualité.",
  totalRevenue: "Le chiffre d'affaires est le total des ventes réalisées par l'entreprise sur la période, avant toute charge.",
  revenueGrowth: "La croissance du chiffre d'affaires mesure l'évolution des ventes d'une année sur l'autre : un indicateur de dynamique commerciale, pas de rentabilité.",
  grossMargins: "La marge brute est ce qu'il reste du chiffre d'affaires après le seul coût direct de production — avant les autres charges de l'entreprise.",
  operatingMargins: "La marge opérationnelle est ce qu'il reste après les charges d'exploitation courantes, avant intérêts et impôts : une mesure de la rentabilité de l'activité elle-même.",
  profitMargins: "La marge nette est la part du chiffre d'affaires qui reste en bénéfice après toutes les charges : elle mesure la capacité de l'entreprise à transformer ses ventes en profit réel.",
  returnOnEquity: "Le ROE mesure le bénéfice généré par rapport aux capitaux propres de l'entreprise : il indique l'efficacité avec laquelle l'entreprise transforme les fonds de ses actionnaires en profit.",
  totalCash: "La trésorerie est l'argent immédiatement disponible pour l'entreprise — un coussin de sécurité face aux imprévus ou aux opportunités d'investissement.",
  totalDebt: "La dette totale correspond à l'ensemble des emprunts de l'entreprise, à comparer à sa trésorerie pour juger de sa solidité financière.",
  freeCashflow: "Le free cash-flow est la trésorerie générée par l'activité après les investissements nécessaires : ce qui reste réellement disponible pour l'entreprise (dividendes, rachats, désendettement).",
  trailingEps: "Le BPA (bénéfice par action) répartit le bénéfice total de l'entreprise sur chaque action existante — la base de calcul du PER et des scénarios de cours.",
  targetLowPrice: "La cible basse est l'estimation la plus prudente parmi les analystes qui suivent ce titre — un scénario possible, pas une prédiction garantie.",
  targetMeanPrice: "La cible moyenne résume l'ensemble des estimations des analystes qui suivent ce titre — une moyenne peut masquer un fort désaccord entre eux.",
  targetHighPrice: "La cible haute est l'estimation la plus optimiste parmi les analystes qui suivent ce titre — un scénario possible, pas une prédiction garantie."
};

// Réutilise les mêmes bandes de lecture que le Comparateur — jamais une
// nouvelle interprétation créée pour ce composant.
function whyBucketReading(fieldKey, fields){
  if(fieldKey === 'revenueGrowth') return bucketGrowth(fields.revenueGrowth);
  if(fieldKey === 'grossMargins' || fieldKey === 'operatingMargins' || fieldKey === 'profitMargins') return bucketMargin(fields[fieldKey]);
  if(fieldKey === 'totalDebt' || fieldKey === 'totalCash') return bucketLeverage(fields.totalDebt, fields.totalCash);
  return null;
}

function renderWhyDrawer(elId, {fieldKey, companySymbol}){
  const el = document.getElementById(elId);
  if(!el) return;
  const definition = WHY_FIELD_DEFINITIONS[fieldKey];
  const meta = FUNDAMENTALS_FIELD_META[fieldKey];
  if(!definition || !meta){ el.innerHTML = ''; return; }

  const fund = companyFundamentalsCache[companySymbol];
  const fields = fund && fund.fundamentals ? fund.fundamentals.fields : null;
  const value = fields ? fields[fieldKey] : null;
  const reading = fields ? whyBucketReading(fieldKey, fields) : null;
  const sw = fields ? deriveStrengthsWeaknesses(fields) : {strengths: [], weaknesses: []};
  const editorial = COMPANY_EDITORIAL[companySymbol];

  el.innerHTML = `
    <details class="why-drawer">
      <summary class="smallcaps" style="cursor:pointer;">Pourquoi ? — ${meta.label}</summary>
      <div style="margin-top:10px;font-size:12.5px;color:var(--text-dim);line-height:1.6;">
        <p>${definition}</p>
        ${typeof value === 'number'
          ? `<p style="margin-top:8px;">${renderDataBadge('fait')} Valeur actuelle : <strong style="color:var(--text);">${formatFundamentalValue(fieldKey, value)}</strong>${reading ? ` — ${reading.label}.` : ''}</p>`
          : `<p style="margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}.</p>`}
        ${sw.strengths.length ? `<p style="margin-top:8px;color:var(--emerald);">${renderDataBadge('calcul')} Ce qui pourrait justifier ce niveau : ${sw.strengths.join(' ')}</p>` : ''}
        ${editorial && editorial.risques.length ? `<p style="margin-top:8px;color:var(--bordeaux);">${renderDataBadge('avis')} Risques à garder en tête : ${editorial.risques.join(' ')}</p>` : ''}
        <p style="margin-top:8px;font-style:italic;">Un chiffre isolé ne résume jamais une entreprise à lui seul — à lire avec le reste de la fiche.</p>
      </div>
    </details>`;
}

// ---------- Dividend Intelligence : historique réel agrégé par année civile ----------
// dividendEvents vient de parseYahooDividendEvents (lib/yahoo.js) via
// /api/custom-quotes?events=div — un événement par versement réellement
// effectué. Ici, simple agrégation (somme réelle par année civile), jamais
// une extrapolation : une année en cours (encore incomplète) est marquée
// explicitement pour ne jamais être comparée comme si elle était terminée.
function computeDividendYearlyHistory(dividendEvents){
  if(!Array.isArray(dividendEvents) || dividendEvents.length === 0) return null;
  const currentYear = new Date().getFullYear();
  const byYear = {};
  dividendEvents.forEach(e => {
    const year = Number(e.date.slice(0, 4));
    if(!byYear[year]) byYear[year] = {year, total: 0, payments: 0};
    byYear[year].total += e.amount;
    byYear[year].payments++;
  });
  const years = Object.values(byYear).sort((a, b) => a.year - b.year);
  years.forEach((y, i) => {
    y.isPartial = y.year === currentYear;
    const prev = i > 0 ? years[i - 1] : null;
    // Une année encore en cours ne peut pas être comparée à une année
    // complète : son total est mécaniquement plus bas (moins de versements
    // reçus à date), ce qui produirait une fausse "baisse" — jamais affiché.
    if(!y.isPartial && prev && prev.total > 0 && !prev.isPartial){
      y.growthPct = (y.total / prev.total - 1) * 100;
      y.trend = y.growthPct > 0.5 ? 'hausse' : y.growthPct < -0.5 ? 'baisse' : 'gel';
    } else {
      y.growthPct = null;
      y.trend = null;
    }
  });
  const completedYears = years.filter(y => !y.isPartial);
  const increases = completedYears.filter(y => y.trend === 'hausse').length;
  const decreases = completedYears.filter(y => y.trend === 'baisse').length;
  const freezes = completedYears.filter(y => y.trend === 'gel').length;
  function cagrOver(nYears){
    const span = completedYears.slice(-nYears - 1);
    if(span.length < 2) return null;
    const first = span[0], last = span[span.length - 1];
    if(first.total <= 0) return null;
    const yearsElapsed = last.year - first.year;
    if(yearsElapsed <= 0) return null;
    return (Math.pow(last.total / first.total, 1 / yearsElapsed) - 1) * 100;
  }
  return {
    years,
    latestCompletedYear: completedYears.length ? completedYears[completedYears.length - 1] : null,
    increases, decreases, freezes,
    cagr5y: cagrOver(5),
    cagr10y: cagrOver(10)
  };
}

// ---------- Dividend Intelligence : score de soutenabilité, décomposable ----------
// Même esprit que computeStockScore : chaque composant retourne sa vraie
// valeur ET les points qu'elle rapporte, un composant sans donnée est exclu
// (jamais remplacé par une valeur inventée), et le score global n'est JAMAIS
// présenté comme "sûr à 100%" — voir le disclaimer porté par l'appelant.
function computeDividendSafetyScore(fields, yearlyHistory){
  fields = fields || {};
  function sub(label, value, formatted, points){ return {label, value, formatted, points}; }
  const components = [];

  // Couverture par les bénéfices : payout ratio réel (part du bénéfice reversée).
  if(typeof fields.payoutRatio === 'number' && fields.payoutRatio >= 0){
    const pr = fields.payoutRatio;
    const points = pr <= 0.6 ? 85 : pr <= 0.8 ? 55 : pr <= 1 ? 25 : 5;
    components.push(sub('Couverture par les bénéfices (payout ratio)', pr, formatFundamentalValue('payoutRatio', pr), points));
  }

  // Couverture par le free cash-flow réel : montant total versé (dividendRate ×
  // actions en circulation) rapporté au FCF réellement généré — jamais un
  // repli sur le seul bénéfice comptable si le FCF est disponible.
  if(typeof fields.dividendRate === 'number' && typeof fields.sharesOutstanding === 'number' && typeof fields.freeCashflow === 'number' && fields.freeCashflow > 0){
    const totalPaid = fields.dividendRate * fields.sharesOutstanding;
    const fcfPayout = totalPaid / fields.freeCashflow;
    const points = fcfPayout <= 0.6 ? 85 : fcfPayout <= 0.8 ? 55 : fcfPayout <= 1 ? 25 : 5;
    components.push(sub('Couverture par le free cash-flow', fcfPayout, (fcfPayout * 100).toFixed(0).replace('.', ',') + ' %', points));
  }

  // Dette : réutilise exactement bucketLeverage (Comparateur), jamais une
  // nouvelle bande inventée pour ce composant.
  const leverage = bucketLeverage(fields.totalDebt, fields.totalCash);
  if(leverage) components.push(sub('Endettement net', null, leverage.label,
    leverage.level === 'faible' ? 90 : leverage.level === 'modere' ? 55 : 20));

  // Stabilité historique : réutilise le compte réel de hausses/baisses/gels
  // de computeDividendYearlyHistory, jamais une nouvelle lecture des données brutes.
  if(yearlyHistory){
    const total = yearlyHistory.increases + yearlyHistory.decreases + yearlyHistory.freezes;
    if(total > 0){
      const stablePct = (yearlyHistory.increases + yearlyHistory.freezes) / total;
      const points = yearlyHistory.decreases === 0 ? 90 : stablePct >= 0.7 ? 60 : 25;
      components.push(sub('Stabilité historique du dividende', stablePct,
        `${yearlyHistory.increases} hausse(s), ${yearlyHistory.freezes} gel(s), ${yearlyHistory.decreases} baisse(s) sur ${total} année(s) complète(s)`, points));
    }
  }

  if(components.length === 0) return null;
  const overall = Math.round(components.reduce((s, c) => s + c.points, 0) / components.length);
  return {overall, components};
}

// ---------- Dividend Intelligence : Yield on Cost ----------
// Rendement rapporté au prix d'ACHAT historique (pas au cours actuel) : plus
// il est ancien, plus la différence avec le rendement affiché aujourd'hui est
// significative — calcul simple, jamais une prédiction.
function computeYieldOnCost(purchasePrice, currentDividendRate){
  if(typeof purchasePrice !== 'number' || purchasePrice <= 0 || typeof currentDividendRate !== 'number' || currentDividendRate < 0) return null;
  return (currentDividendRate / purchasePrice) * 100;
}

// ---------- Dividend Intelligence : simulation "si j'avais investi X€" avec
// réinvestissement des VRAIS dividendes versés (remplace le taux de croissance
// fictif de l'ancien simulateur) ----------
// Méthodologie explicitée (à afficher telle quelle à l'utilisateur, jamais
// cachée) : à chaque versement réel (dividendEvents), le montant total perçu
// (unités détenues × montant par action) est réinvesti au premier cours de
// clôture mensuel disponible À LA DATE DU VERSEMENT OU APRÈS — Likanza ne
// prétend jamais connaître le cours exact intra-mensuel auquel l'achat aurait
// eu lieu. priceHistory : même format que computeHistoricalInvestment
// ({period:'YYYY-MM', close}). Les splits ne sont pas pris en compte
// (simplification explicite, voir disclaimer).
function computeDividendReinvestmentSimulation(priceHistory, dividendEvents, initial, reinvest){
  if(!Array.isArray(priceHistory) || priceHistory.length < 2 || typeof initial !== 'number' || initial <= 0) return null;
  const points = priceHistory.filter(p => typeof p.close === 'number');
  if(points.length < 2) return null;

  let units = initial / points[0].close;
  let cashDividendsReceived = 0;
  let dividendsReinvestedValue = 0;
  let paymentsUsed = 0;
  const events = Array.isArray(dividendEvents) ? dividendEvents.slice().sort((a, b) => a.date.localeCompare(b.date)) : [];

  events.forEach(ev => {
    const evMonth = ev.date.slice(0, 7);
    // Un versement antérieur au début de l'historique de prix fourni n'a pas
    // de cours de référence fiable pour calculer les unités déjà détenues à
    // cette date : jamais compté comme perçu, plutôt que d'inventer un prix.
    if(evMonth < points[0].period) return;
    paymentsUsed++;
    const amount = units * ev.amount;
    cashDividendsReceived += amount;
    if(reinvest){
      const target = points.find(p => p.period >= evMonth);
      if(target && target.close > 0){
        const newUnits = amount / target.close;
        units += newUnits;
        dividendsReinvestedValue += amount;
      }
    }
  });

  const finalClose = points[points.length - 1].close;
  const finalValue = units * finalClose;
  const priceOnlyValue = (initial / points[0].close) * finalClose;
  const years = (() => {
    const first = points[0].period, last = points[points.length - 1].period;
    const [y1, m1] = first.split('-').map(Number), [y2, m2] = last.split('-').map(Number);
    return (y2 - y1) + (m2 - m1) / 12;
  })();
  const totalGain = finalValue - initial;
  const cagr = years > 0 ? (Math.pow(finalValue / initial, 1 / years) - 1) * 100 : 0;
  const cagrPriceOnly = years > 0 ? (Math.pow(priceOnlyValue / initial, 1 / years) - 1) * 100 : 0;

  return {
    initial, finalValue, totalGain, cagr, years,
    finalUnits: units,
    // Décomposition demandée : évolution du cours seul vs effet dividendes/réinvestissement.
    priceOnlyValue,
    cagrPriceOnly,
    dividendEffect: finalValue - priceOnlyValue,
    cashDividendsReceived,
    dividendsReinvestedValue,
    reinvest: !!reinvest,
    paymentsUsed
  };
}

// ---------- Profil personnel (pré-remplit les simulateurs + test de positionnement) ----------
// fzr-profile est le seul objet profil du site : le test de positionnement
// (levels/interests/learningStyle) fait évoluer cette même structure plutôt
// que d'en créer une seconde. Migration non destructive : un profil déjà
// enregistré avant l'ajout de ces 3 champs (ou un profil qui n'existe pas du
// tout) reçoit des valeurs par défaut sans jamais perdre age/epargne/horizon/
// risque/objectif déjà saisis.
function getProfile(){
  const defaults = {age:25, epargne:150, horizon:15, risque:'equilibre', objectif:'', levels:{}, interests:{}, learningStyle:{}};
  const stored = safeGetJSON('fzr-profile', null);
  if(!stored) return defaults;
  return {
    ...defaults, ...stored,
    levels: {...defaults.levels, ...(stored.levels || {})},
    interests: {...defaults.interests, ...(stored.interests || {})},
    learningStyle: {...defaults.learningStyle, ...(stored.learningStyle || {})}
  };
}
function saveProfile(p){ safeSetJSON('fzr-profile', p); }

const PROFILE_OBJECTIFS = [
  {value:'gerer', label:'Mieux gérer mon argent'},
  {value:'decouvert', label:'Sortir du découvert'},
  {value:'economiser', label:'Économiser chaque mois'},
  {value:'securite', label:"Créer une épargne de sécurité"},
  {value:'comprendre', label:'Comprendre la finance'},
  {value:'investir', label:'Commencer à investir'},
  {value:'immobilier', label:'Préparer un achat immobilier'},
  {value:'bourse', label:'Mieux comprendre la bourse'},
  {value:'crypto', label:'Comprendre la crypto et ses risques'},
  {value:'arnaques', label:'Éviter les erreurs et les arnaques'}
];

function renderRiskGauge(elId, risque){
  const el = document.getElementById(elId);
  if(!el) return;
  const pct = {prudent:25, equilibre:55, dynamique:85}[risque] || 50;
  const deg = pct*3.6;
  el.innerHTML = `<div class="gauge" style="background:conic-gradient(var(--gold) ${deg}deg, var(--hairline) 0deg);"><div class="gauge-inner">${pct}%</div></div><div class="gauge-label">Profil ${risque}</div>`;
}

function renderProfileWidget(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const p = getProfile();
  el.innerHTML = `
    <div class="profile-widget">
      <div class="profile-grid">
        <div class="field"><label for="profAge">Âge</label><input type="number" id="profAge" value="${p.age}"></div>
        <div class="field"><label for="profEpargne">Épargne mensuelle possible (€)</label><input type="number" id="profEpargne" value="${p.epargne}"></div>
        <div class="field"><label for="profHorizon">Horizon (années)</label><input type="number" id="profHorizon" value="${p.horizon}"></div>
        <div class="field"><label for="profRisque">Profil de risque</label>
          <select id="profRisque">
            <option value="prudent" ${p.risque==='prudent'?'selected':''}>Prudent</option>
            <option value="equilibre" ${p.risque==='equilibre'?'selected':''}>Équilibré</option>
            <option value="dynamique" ${p.risque==='dynamique'?'selected':''}>Dynamique</option>
          </select>
        </div>
        <div class="field" style="grid-column:1/-1;"><label for="profObjectif">Quel est ton objectif principal ?</label>
          <select id="profObjectif">
            <option value="">— À définir —</option>
            ${PROFILE_OBJECTIFS.map(o=>`<option value="${o.value}" ${p.objectif===o.value?'selected':''}>${o.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="riskGauge"></div>
      <button class="btn btn-sm btn-gold" id="profSaveBtn">Enregistrer mon profil</button>
      <p style="font-size:11px;color:var(--text-dim);margin-top:8px;">Ce profil pré-remplit les simulateurs et adapte les conseils du site. Stocké sur cet appareil uniquement. Tu peux le modifier à tout moment.</p>
    </div>`;
  renderRiskGauge('riskGauge', p.risque);
  document.getElementById('profSaveBtn').addEventListener('click', ()=>{
    const newP = {
      ...getProfile(),
      age: Number(document.getElementById('profAge').value) || 0,
      epargne: Number(document.getElementById('profEpargne').value) || 0,
      horizon: Number(document.getElementById('profHorizon').value) || 1,
      risque: document.getElementById('profRisque').value,
      objectif: document.getElementById('profObjectif').value
    };
    saveProfile(newP);
    renderRiskGauge('riskGauge', newP.risque);
  });
  document.getElementById('profRisque').addEventListener('change', (e)=>renderRiskGauge('riskGauge', e.target.value));
}

// ---------- Comparateur "Et si...?" générique ----------
function renderWhatIf(elId, scenarios, computeFn, formatFn){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `<div class="whatif-row">${scenarios.map((s,i)=>`<button class="whatif-btn" data-idx="${i}">${s.label}</button>`).join('')}</div><div class="whatif-compare" id="${elId}-out"></div>`;
  el.querySelectorAll('.whatif-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const scenario = scenarios[+btn.dataset.idx];
      const base = computeFn({});
      const alt = computeFn(scenario.change);
      document.getElementById(elId+'-out').innerHTML = `
        <div class="whatif-col"><div class="lab">Situation actuelle</div><div class="val">${formatFn(base)}</div></div>
        <div class="whatif-col"><div class="lab">${scenario.label}</div><div class="val" style="color:var(--emerald);">${formatFn(alt)}</div></div>`;
    });
  });
}

// ---------- Graphique circulaire générique (répartition patrimoniale, etc.) ----------
function renderPieChart(elId, segments){
  const el = document.getElementById(elId);
  if(!el) return;
  const total = segments.reduce((s,x)=>s+x.value,0) || 1;
  let acc = 0;
  const stops = segments.map(s=>{
    const start = acc/total*360;
    acc += s.value;
    const end = acc/total*360;
    return `${s.color} ${start}deg ${end}deg`;
  }).join(', ');
  el.innerHTML = `
    <div class="pie" style="background:conic-gradient(${stops});"></div>
    <div class="pie-legend">${segments.map(s=>`<span><i style="background:${s.color}"></i>${s.label} · ${Math.round(s.value/total*100)}%</span>`).join('')}</div>`;
}

// Petit utilitaire : exécute une fonction sans jamais laisser une erreur
// dans une section bloquer l'initialisation des autres sections.
function safeRun(label, fn){
  try{ fn(); }
  catch(err){ console.error(`Likanza Academy — échec dans "${label}" :`, err); }
}

document.addEventListener('DOMContentLoaded', ()=>{
  safeRun('theme', initTheme);
  safeRun('navigation', initNav);
  safeRun('recherche', initSearch);
  safeRun('ticker', ()=>renderTicker('tickerTrack'));
  safeRun('cotations réelles', initLiveMarketData);
  safeRun('série quotidienne', checkDailyStreak);
  safeRun('synchronisation du compte', syncProgressWithAccount);
  safeRun('synchronisation du compte (relances périodiques)', initProgressSyncHeartbeat);
  // Laisse le temps aux scripts de page de peupler les cartes avant d'observer
  setTimeout(()=>safeRun('animations au scroll', initReveal), 60);
});

