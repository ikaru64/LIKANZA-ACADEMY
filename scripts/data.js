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
    btn.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '☾' : '☀';
    btn.addEventListener('click', ()=>{
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
      safeSet('fzr-theme', isLight ? 'dark' : 'light');
      btn.textContent = isLight ? '☀' : '☾';
      forceRepaint();
    });
  }
}

// ---------- localStorage sécurisé (fonctionne uniquement une fois le site publié dans un vrai navigateur) ----------
function safeGet(key){
  try{ return localStorage.getItem(key); }catch(e){ return null; }
}
function safeSet(key, val){
  try{ localStorage.setItem(key, val); return true; }catch(e){ return false; }
}
function safeGetJSON(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; }
}
function safeSetJSON(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); return true; }catch(e){ return false; }
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
function applyLiveQuotes(quotes){
  let applied = 0;
  quotes.forEach(q=>{
    const it = MARKET_DATA.find(m=>m.symbol===q.symbol);
    if(!it || typeof q.price !== 'number' || typeof q.changePercent !== 'number') return;
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
    applied++;
  });
  return applied;
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

// ---------- Sparkline partagée (graphique en barres CSS à partir d'un historique) ----------
// Utilisée par la fiche marché (marche.html) et par les lignes hausses/baisses
// de la page Bourse. mode "compact" : juste les barres, sans dates ni légende
// (pour une petite ligne de liste) ; mode complet : barres + dates + légende.
function sparklineFmtDate(iso){
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'});
}
function sparklineFmtClose(n){
  return n.toLocaleString('fr-FR', n >= 1000 ? {maximumFractionDigits:0} : {minimumFractionDigits:2, maximumFractionDigits:2});
}
function renderSparklineHTML(history, opts){
  opts = opts || {};
  if(!Array.isArray(history) || history.length < 2){
    return opts.compact
      ? `<div class="bar-chart bar-chart-empty"></div>`
      : `<p style="font-size:12.5px;color:var(--text-dim);">L'historique des dernières séances s'affiche dès que les cotations automatiques sont disponibles (connexion au backend requise).</p>`;
  }
  const closes = history.map(h=>h.close);
  const min = Math.min(...closes), max = Math.max(...closes);
  const spread = (max - min) || 1;
  const bars = history.map(h=>{
    const pct = 12 + Math.round(((h.close - min) / spread) * 88);
    return `<div class="bar" style="height:${pct}%;" title="${sparklineFmtDate(h.date)} : ${sparklineFmtClose(h.close)}${opts.unite ? ' ' + opts.unite : ''}"></div>`;
  }).join('');
  const chartClass = opts.compact ? 'bar-chart bar-chart-sm' : 'bar-chart';
  if(opts.compact) return `<div class="${chartClass}">${bars}</div>`;
  const labels = history.map(h=>`<span>${sparklineFmtDate(h.date)}</span>`).join('');
  return `<div class="${chartClass}">${bars}</div><div class="bar-labels">${labels}</div>
    <p style="font-size:11px;color:var(--text-dim);margin-top:10px;">Clôtures des dernières séances (source : ${opts.source || 'n.d.'}). Échelle resserrée entre ${sparklineFmtClose(min)} et ${sparklineFmtClose(max)} pour rendre les variations lisibles.</p>`;
}

// ---------- Conseils adaptés au niveau (contexte marché) ----------
const MARKET_TIPS = {
  debutant: "Les hausses et baisses du jour ne veulent pas dire grand-chose isolément — ce sont les tendances sur plusieurs années qui comptent le plus pour un premier investissement.",
  intermediaire: "Compare toujours une variation quotidienne au contexte : un secteur entier qui bouge n'a pas la même signification qu'un mouvement isolé sur une seule entreprise.",
  avance: "Regarde si la variation du jour s'accompagne d'une actualité précise (résultats, annonce) avant d'en tirer une conclusion — le \"bruit\" quotidien est souvent sans lien avec les fondamentaux.",
  expert: "Une variation de PER à bénéfice constant reflète un changement d'anticipations du marché, pas un changement de la valeur intrinsèque de l'entreprise — utile à distinguer avant d'interpréter un mouvement de cours."
};

// ---------- Conseil Likanza : recommandations adaptées au niveau (composant réutilisable) ----------
const NIVEAU_RANK = {debutant:0, 'débutant':0, intermediaire:1, 'intermédiaire':1, avance:2, 'avancé':2, expert:3};
function normalizeNiveau(v){
  if(!v) return null;
  const key = String(v).toLowerCase();
  return key in NIVEAU_RANK ? NIVEAU_RANK[key] : null;
}
function getPositioningResult(){ return safeGetJSON('fzr-positioning-result', null); }
function getWeakCategoryLabel(categorieOuTerme){
  const result = getPositioningResult();
  if(!result || !result.categoryScores || !categorieOuTerme) return null;
  const weak = Object.values(result.categoryScores).find(c =>
    c.pct < 50 && c.label.toLowerCase() === String(categorieOuTerme).toLowerCase());
  return weak ? weak.label : null;
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
      `Ton test de positionnement montre que "${opts.weakCategory}" mérite d'être renforcé — cette notion peut t'y aider.`,
      `Notion liée à une faiblesse détectée dans ton test (${opts.weakCategory}) : à ne pas sauter.`,
      `Ton bilan indique une marge de progression en ${opts.weakCategory} — utile de s'y arrêter maintenant.`
    ];
    return {text: pool[Math.floor(Math.random()*pool.length)], tone:'warn'};
  }

  const diff = itemRank - userRank;
  let pool, tone;
  if(diff <= -2){
    pool = [
      "Tu maîtrises probablement déjà cette notion — une révision rapide peut suffire.",
      "Plutôt destiné aux débutants ; à ton niveau, ça peut surtout servir de rappel.",
      "Tu connais sans doute déjà l'essentiel ici — libre à toi de passer directement plus loin."
    ];
    tone = 'muted';
  } else if(diff === -1){
    pool = [
      "Tu as probablement déjà vu l'essentiel de cette notion — une relecture rapide ne fait pas de mal.",
      "Un peu en-dessous de ton niveau actuel, utile comme piqûre de rappel."
    ];
    tone = 'muted';
  } else if(diff === 0){
    pool = [
      "Recommandé pour ton niveau actuel.",
      "Ce contenu correspond bien à ton niveau du moment.",
      "Pile ton niveau — une bonne notion à consolider maintenant."
    ];
    tone = 'good';
  } else if(diff === 1){
    pool = [
      "Un peu plus avancé que ton niveau actuel, mais accessible si les bases sont solides.",
      "Cette notion va un peu plus loin — tu peux t'y risquer si tu es à l'aise avec les fondamentaux."
    ];
    tone = 'neutral';
  } else {
    pool = [
      "Cette notion est plus avancée que ton niveau actuel. Tu peux tout de même l'ouvrir.",
      "Contenu avancé — rien ne t'empêche de le consulter, mais les bases restent utiles avant.",
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
  el.innerHTML = `<p class="conseil-likanza" style="border-left:2px solid ${colors[conseil.tone]||'var(--gold)'};padding-left:10px;font-size:12px;color:var(--text-dim);margin-top:8px;">💡 ${conseil.text}</p>`;
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
  el.innerHTML = `<div class="demo-banner">Mode démonstration — les fiches et simulateurs de cette page utilisent des données de démonstration. Seul le bandeau de marché est alimenté automatiquement en données différées (Yahoo Finance · CoinGecko), avec repli sur la dernière clôture connue.</div>`;
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
        <button class="fav-btn" data-fav-id="news-${a.id}" data-fav-title="${a.titre}" data-fav-url="actualites.html#${a.id}" data-fav-type="Actualité">★</button>
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
      <div class="head" onclick="this.nextElementSibling.classList.toggle('open')">
        <h4>${c.title}</h4>
        <span class="idx">${String(i+1).padStart(2,'0')}</span>
      </div>
      <div class="course-body">${c.body}</div>
    </div>`).join('');
}

// ---------- Gamification (XP, niveaux, séries, badges) ----------
const LEVEL_TITLES = [
  "🌱 Épargnant","📚 Curieux","🔍 Apprenti Analyste","📈 Investisseur","💼 Analyste",
  "🎯 Stratège Débutant","🏦 Stratège","🦅 Visionnaire","🛡️ Gestionnaire de Risque",
  "💎 Investisseur Chevronné","🏛️ Architecte du Patrimoine","👑 Maître Likanza"
];
// Niveau à partir duquel le niveau de quiz "Avancé" se débloque.
const ADVANCED_QUIZ_UNLOCK_LEVEL = 4;
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
  {id:'first_sim', name:'Premier laboratoire', desc:"Lancer une simulation financière.", check:(g,ctx)=> !!(ctx && ctx.usedSimulator)},
  {id:'positioning_test', name:'Bilan effectué', desc:"Terminer le test de positionnement.", check:(g,ctx)=> !!(ctx && ctx.positioningTestDone)}
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
      <p style="font-size:11.5px;color:var(--text-dim);margin-bottom:14px;">Classement basé sur l'XP, comparé à des profils fictifs — le vrai classement entre joueurs nécessite un compte et un serveur, pas encore disponible.</p>
      <div class="league-list">
        ${board.map((p,i)=>`<div class="league-row ${p.isUser?'is-user':''}"><span>${i+1}. ${p.name}</span><span class="mono">${p.fp} XP</span></div>`).join('')}
      </div>
    </div>`;
}

function getGamification(){
  const g = safeGetJSON('fzr-gamification', {xp:0, financePoints:0, streak:0, lastVisit:null, badges:[]});
  if(g.financePoints === undefined) g.financePoints = g.xp; // migration en douceur depuis l'ancien système à monnaie unique
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

function checkDailyStreak(){
  const g = getGamification();
  const today = new Date().toDateString();
  if(g.lastVisit === today){ logActivity(); return g; }
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  g.streak = (g.lastVisit === yesterday) ? g.streak + 1 : 1;
  g.lastVisit = today;
  const bonus = Math.round(15 * streakMultiplier(g.streak));
  g.xp += bonus;
  g.financePoints += bonus;
  saveGamification(g);
  checkBadges(g, {});
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
// Finance Points (monnaie à dépenser plus tard) — les deux progressent ensemble
// pour l'instant, mais sont stockés et affichés séparément.
function awardXP(amount, ctx){
  const g = getGamification();
  const finalAmount = Math.round(amount * streakMultiplier(g.streak));
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
  toast.innerHTML = `<strong>🏅 ${badge.name}</strong><br><span>${badge.desc}</span>`;
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
          <span class="smallcaps">Niveau ${lvl.level} — ${lvl.title}</span>
          <div class="gami-xpbar"><div class="gami-xpfill" id="gamiXpFill-${elId}" style="width:0%;"></div></div>
          <p style="font-size:11px;color:var(--text-dim);margin-top:4px;">${lvl.xpInLevel} / 100 XP · ${g.xp} XP au total${mult>1?` · bonus série x${mult}`:''}</p>
        </div>
        <div class="gami-streak">🔥 <strong>${g.streak}</strong><span>jour${g.streak>1?'s':''}</span></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid var(--hairline);">
        <span style="font-size:12.5px;color:var(--text-dim);">💰 Finance Points (à dépenser)</span>
        <span class="mono" style="font-size:15px;color:var(--gold-bright);font-weight:600;">${g.financePoints}</span>
      </div>
      ${full ? `<div class="gami-badges">${BADGES.map(b=>{
          const earned = g.badges.includes(b.id);
          return `<div class="gami-badge ${earned?'earned':''}" title="${b.desc}"><span>${earned?'🏅':'🔒'}</span>${b.name}</div>`;
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
// ---------- Notion à revoir (rotation quotidienne stable) ----------
function getNotionOfDay(){
  return LIBRARY[dayOfYear() % LIBRARY.length];
}

// ---------- En-tête de tableau de bord (salutation, rang, FinPoints, série, activité hebdo) ----------
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

function renderDashboardHeader(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const g = getGamification();
  const lvl = levelFromXP(g.xp);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const weekDays = getWeeklyActivityDays();
  const weekPct = Math.min(100, Math.round((weekDays/WEEKLY_GOAL_DAYS)*100));
  el.innerHTML = `
    <div class="dash-header">
      <div class="dash-greeting">
        <span class="smallcaps" id="dashGreeting">${greeting}</span>
        <h1 class="display" style="font-size:26px;font-weight:600;margin-top:4px;">${lvl.title}</h1>
      </div>
      <div class="dash-stats">
        <div class="dash-stat"><span class="num" id="dashNumXP">0 XP</span><span class="lab">niveau ${lvl.level}</span></div>
        <div class="dash-stat"><span class="num" id="dashNumFP">💰 0</span><span class="lab">Finance Points</span></div>
        <div class="dash-stat"><span class="num">🔥 ${g.streak}</span><span class="lab">série</span></div>
        <div class="dash-stat">
          <span class="num">${weekDays}/${WEEKLY_GOAL_DAYS}</span><span class="lab">jours actifs</span>
          <div class="dash-weekbar"><div class="dash-weekfill" id="dashWeekFill" style="width:0%;"></div></div>
        </div>
      </div>
    </div>`;
  animateNumber(document.getElementById('dashNumXP'), g.xp, {suffix:' XP'});
  animateNumber(document.getElementById('dashNumFP'), g.financePoints, {prefix:'💰 '});
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
function tryAwardQuizPoints(questionId, amount, ctx){
  const ledger = getQuizPointsLedger();
  if(ledger.ids.includes(questionId)) return false;
  ledger.ids.push(questionId);
  safeSetJSON('fzr-quiz-points-ledger', ledger);
  awardXP(amount, ctx);
  return true;
}

// ---------- Bonus de combo : plus on enchaîne de bonnes réponses d'affilée
// dans un même défi, plus chaque question suivante rapporte de points. ----------
function comboBonusAmount(combo){
  if(combo >= 8) return 20;
  if(combo >= 5) return 15;
  if(combo >= 3) return 12;
  return 10;
}

// ---------- Statistiques de quiz (par catégorie, historique) ----------
function getQuizStats(){
  return safeGetJSON('fzr-quiz-stats', {categoryStats:{}, history:[]});
}
function saveQuizStats(stats){ safeSetJSON('fzr-quiz-stats', stats); }
function recordAnswer(categorie, correct){
  const stats = getQuizStats();
  if(!stats.categoryStats[categorie]) stats.categoryStats[categorie] = {correct:0, total:0};
  stats.categoryStats[categorie].total++;
  if(correct) stats.categoryStats[categorie].correct++;
  saveQuizStats(stats);
}
function recordQuizCompletion(level, categorie, length, score){
  const stats = getQuizStats();
  stats.history.unshift({date:new Date().toLocaleDateString('fr-FR'), level, categorie, length, score});
  stats.history = stats.history.slice(0, 30);
  saveQuizStats(stats);
}
function getMasteredAndToReview(){
  const stats = getQuizStats();
  const mastered = [], toReview = [];
  Object.entries(stats.categoryStats).forEach(([cat, s])=>{
    if(s.total < 2) return;
    const pct = s.correct / s.total;
    if(pct >= 0.75) mastered.push(cat);
    else if(pct < 0.5) toReview.push(cat);
  });
  return {mastered, toReview};
}

// ---------- Sélection des questions ----------
function selectQuizQuestions(level, categorie, length){
  let pool = QUIZ_BANK_FULL.slice();
  if(level && level !== 'tous') pool = pool.filter(q=>q.niveau===level);
  if(categorie && categorie !== 'tous') pool = pool.filter(q=>q.categorie===categorie);
  // mélange (Fisher-Yates)
  for(let i=pool.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(length, pool.length));
}

// ---------- Défi rapide (1 question, pour le tableau de bord) ----------
function renderQuickChallenge(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const item = QUIZ_BANK_FULL[dayOfYear() % QUIZ_BANK_FULL.length];
  el.innerHTML = `
    <div class="quiz-q" style="font-size:14px;margin-bottom:10px;">${item.question}</div>
    <div id="${elId}-opts" style="display:flex;flex-direction:column;gap:6px;"></div>
    <div id="${elId}-feedback" style="font-size:12.5px;color:var(--text-dim);margin-top:8px;min-height:18px;"></div>`;
  const opts = document.getElementById(elId+'-opts');
  item.choix.forEach((opt,i)=>{
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.style.textAlign = 'left';
    btn.textContent = opt;
    btn.addEventListener('click', ()=>{
      Array.from(opts.children).forEach((c,ci)=>{
        c.disabled = true;
        c.style.borderColor = ci===item.bonneReponse ? 'var(--emerald)' : (ci===i ? 'var(--bordeaux)' : 'var(--hairline)');
      });
      const correct = i===item.bonneReponse;
      recordAnswer(item.categorie, correct);
      let msg = item.explication;
      if(correct){ const got = tryAwardQuizPoints(item.id, 10); msg += got ? ' (+10 XP · +10 Finance Points)' : ' (déjà validée aujourd\u2019hui, sans nouveaux gains)'; }
      document.getElementById(elId+'-feedback').textContent = msg;
    }, {once:true});
    opts.appendChild(btn);
  });
}

// ---------- Moteur de quiz complet (sélection, session, résultats) ----------
function renderQuizSetup(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const categories = [...new Set(QUIZ_BANK_FULL.map(q=>q.categorie))].sort();
  const userLevel = levelFromXP(getGamification().xp).level;
  const advancedUnlocked = userLevel >= ADVANCED_QUIZ_UNLOCK_LEVEL;
  el.innerHTML = `
    <div class="field"><label>Niveau</label>
      <select id="${elId}-level">
        <option value="tous">Tous niveaux</option>
        <option value="debutant">Débutant</option>
        <option value="intermediaire">Intermédiaire</option>
        <option value="avance" ${advancedUnlocked?'':'disabled'}>Avancé${advancedUnlocked?'':` 🔒 (débloqué au niveau ${ADVANCED_QUIZ_UNLOCK_LEVEL})`}</option>
      </select>
      ${advancedUnlocked?'':`<p style="font-size:11px;color:var(--text-dim);margin-top:4px;">Le niveau Avancé se débloque au niveau ${ADVANCED_QUIZ_UNLOCK_LEVEL} (tu es niveau ${userLevel}).</p>`}
    </div>
    <div class="field"><label>Thème</label>
      <select id="${elId}-cat">
        <option value="tous">Mélange de thèmes</option>
        ${categories.map(c=>`<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Nombre de questions</label>
      <select id="${elId}-len">
        <option value="5">5 questions</option>
        <option value="10">10 questions</option>
        <option value="20">20 questions</option>
        <option value="30">30 questions</option>
      </select>
    </div>
    <button class="btn btn-gold btn-sm" id="${elId}-start">Commencer le défi</button>
    <div id="${elId}-session" style="margin-top:18px;"></div>`;
  document.getElementById(`${elId}-start`).addEventListener('click', ()=>{
    const level = document.getElementById(`${elId}-level`).value;
    const categorie = document.getElementById(`${elId}-cat`).value;
    const length = +document.getElementById(`${elId}-len`).value;
    const questions = selectQuizQuestions(level, categorie, length);
    startQuizSession(`${elId}-session`, questions, level);
  });
}

function startQuizSession(elId, questions, level){
  const el = document.getElementById(elId);
  if(!el) return;
  if(questions.length === 0){
    el.innerHTML = `<p class="empty-note">Pas assez de questions disponibles pour cette combinaison — essaie un autre thème.</p>`;
    return;
  }
  let qIndex = 0, score = 0, combo = 0, maxCombo = 0;
  const wrong = [];
  const startTime = Date.now();

  function renderQuestion(){
    if(qIndex >= questions.length){
      renderResults();
      return;
    }
    const item = questions[qIndex];
    const pct = Math.round((qIndex/questions.length)*100);
    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Question ${qIndex+1} / ${questions.length}</span><span>${item.categorie} · ${item.niveau}${combo>=3?` · 🔥 combo x${combo}`:''}</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:14px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <div style="font-size:15px;margin-bottom:12px;font-weight:500;">${item.question}</div>
      <div id="${elId}-opts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;"></div>
      <div id="${elId}-feedback" style="font-size:13.5px;color:var(--text-dim);min-height:20px;"></div>`;
    const opts = document.getElementById(`${elId}-opts`);
    item.choix.forEach((opt,i)=>{
      const btn = document.createElement('button');
      btn.className = 'pill';
      btn.style.textAlign = 'left';
      btn.textContent = opt;
      btn.addEventListener('click', ()=>{
        Array.from(opts.children).forEach((c,ci)=>{
          c.disabled = true;
          if(ci===item.bonneReponse) c.style.borderColor = 'var(--emerald)';
          else if(ci===i) c.style.borderColor = 'var(--bordeaux)';
        });
        const correct = i===item.bonneReponse;
        recordAnswer(item.categorie, correct);
        let feedback = item.explication;
        if(correct){
          score++;
          combo++;
          maxCombo = Math.max(maxCombo, combo);
          const amount = comboBonusAmount(combo);
          const got = tryAwardQuizPoints(item.id, amount, {combo: maxCombo});
          if(got) feedback += ` (+${amount} XP · +${amount} Finance Points${combo>=3?` · combo x${combo}`:''})`;
        } else {
          combo = 0;
          wrong.push(item);
        }
        document.getElementById(`${elId}-feedback`).textContent = feedback;
        setTimeout(()=>{ qIndex++; renderQuestion(); }, 1400);
      });
      opts.appendChild(btn);
    });
  }

  function renderResults(){
    const pct = Math.round((score/questions.length)*100);
    let msg = "Revois les notions essentielles avant de réessayer.";
    if(pct >= 90) msg = "Excellente maîtrise du sujet.";
    else if(pct >= 70) msg = "Très bon résultat. Tu maîtrises l'essentiel du sujet.";
    else if(pct >= 50) msg = "Les bases sont présentes, mais certaines notions restent à consolider.";
    if(level) recordQuizCompletion(level, 'mélange', questions.length, pct);
    const seconds = Math.round((Date.now()-startTime)/1000);
    const {mastered, toReview} = getMasteredAndToReview();
    if(pct === 100) awardXP(25, {quizPerfect:true, combo: maxCombo});
    el.innerHTML = `
      <div class="result-big">${score} / ${questions.length} <span style="font-size:16px;color:var(--text-dim);">(${pct}%)</span></div>
      <p style="color:var(--text-dim);font-size:14px;margin:8px 0;">${msg}</p>
      <p style="font-size:11.5px;color:var(--text-dim);">Temps passé : ${seconds}s · meilleur combo : x${maxCombo}${pct===100?' · + 25 XP bonus (sans-faute)':''} (points par question limités à un gain par jour, bonifiés par combo et série de connexion)</p>
      ${mastered.length ? `<p style="font-size:12.5px;color:var(--emerald);margin-top:10px;">Maîtrisé : ${mastered.join(', ')}</p>` : ''}
      ${toReview.length ? `<p style="font-size:12.5px;color:var(--gold-bright);">À revoir : ${toReview.join(', ')}</p>` : ''}
      ${wrong.length ? `<div style="margin-top:14px;"><p style="font-size:12.5px;font-weight:600;margin-bottom:6px;">Réponses à revoir :</p>${wrong.map(w=>`<p style="font-size:12px;color:var(--text-dim);margin-bottom:6px;">• ${w.question} — ${w.explication}</p>`).join('')}</div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
        ${wrong.length ? `<button class="btn btn-sm" id="${elId}-retry-wrong">Revoir uniquement mes erreurs</button>` : ''}
        <button class="btn btn-sm btn-gold" id="${elId}-retry-fresh">Nouveau défi</button>
      </div>`;
    if(wrong.length) document.getElementById(`${elId}-retry-wrong`).addEventListener('click', ()=>{
      startQuizSession(elId, wrong.slice(), level);
    });
    document.getElementById(`${elId}-retry-fresh`).addEventListener('click', ()=>{
      startQuizSession(elId, selectQuizQuestions(level||'tous','tous',questions.length), level);
    });
  }

  renderQuestion();
}

// Compatibilité : ancien point d'entrée simple (5 questions mélangées, niveau libre)
function renderQuiz(containerId){
  startQuizSession(containerId, selectQuizQuestions('tous','tous',5), 'tous');
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

// ---------- Profil personnel (pré-remplit les simulateurs du site) ----------
function getProfile(){
  return safeGetJSON('fzr-profile', {age:25, epargne:150, horizon:15, risque:'equilibre', objectif:''});
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
        <div class="field"><label>Âge</label><input type="number" id="profAge" value="${p.age}"></div>
        <div class="field"><label>Épargne mensuelle possible (€)</label><input type="number" id="profEpargne" value="${p.epargne}"></div>
        <div class="field"><label>Horizon (années)</label><input type="number" id="profHorizon" value="${p.horizon}"></div>
        <div class="field"><label>Profil de risque</label>
          <select id="profRisque">
            <option value="prudent" ${p.risque==='prudent'?'selected':''}>Prudent</option>
            <option value="equilibre" ${p.risque==='equilibre'?'selected':''}>Équilibré</option>
            <option value="dynamique" ${p.risque==='dynamique'?'selected':''}>Dynamique</option>
          </select>
        </div>
        <div class="field" style="grid-column:1/-1;"><label>Quel est ton objectif principal ?</label>
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

// ---------- Panneau coach (accueil / compte) ----------
function renderCoach(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const level = getLevel();
  const progress = safeGetJSON('fzr-progress', {});
  const favs = getFavorites();
  const mods = COURSES[level] || COURSES.debutant;
  const done = mods.filter((c,i)=>progress[level+'-'+i]).length;
  const pct = mods.length ? Math.round((done/mods.length)*100) : 0;
  const labels = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};

  const messages = [];
  if(done === 0) messages.push(`Tu n'as pas encore commencé les missions du niveau ${labels[level]}.`);
  else if(pct < 100) messages.push(`Tu as terminé ${pct}% du parcours ${labels[level]}.`);
  else messages.push(`Parcours ${labels[level]} terminé — tente le niveau supérieur dans Formations.`);

  const favTypes = favs.map(f=>f.type);
  if(favTypes.includes('Action')) messages.push("Tu sembles t'intéresser à la bourse : le comparateur d'actions peut t'aider à aller plus loin.");
  if(favs.length === 0) messages.push("Astuce : clique sur ★ sur une actualité ou une action pour la retrouver dans ton compte.");
  if(!safeGetJSON('fzr-profile', null)) messages.push("Renseigne ton profil (âge, épargne, horizon) dans Mon compte pour des simulations personnalisées.");

  const positioning = getPositioningResult();
  if(positioning && positioning.categoryScores){
    const weakest = Object.values(positioning.categoryScores).sort((a,b)=>a.pct-b.pct)[0];
    if(weakest && weakest.pct < 60) messages.push(`Ton test de positionnement indique une marge de progression en ${weakest.label} (${weakest.pct}%) — un bon point de départ.`);
    messages.push(`Ton parcours personnalisé t'attend dans <a href="parcours.html" style="color:var(--gold-bright);">Mon parcours</a>.`);
  } else {
    messages.push(`Envie d'un parcours vraiment adapté à ton niveau ? <a href="test-positionnement.html" style="color:var(--gold-bright);">Fais le test de positionnement</a> (facultatif, environ 5 minutes).`);
  }

  el.innerHTML = `
    <div class="coach-panel">
      <span class="smallcaps">Ton coach Likanza Academy</span>
      <div class="coach-progress" style="margin-top:10px;"><div class="coach-bar" id="coachBar-${elId}" style="width:0%;"></div></div>
      <p style="font-size:12px;color:var(--text-dim);margin:8px 0 14px;">${done}/${mods.length} missions accomplies · niveau ${labels[level]}</p>
      ${messages.map(m=>`<p class="coach-msg">→ ${m}</p>`).join('')}
    </div>`;
  animateWidthIn(document.getElementById('coachBar-'+elId), pct);
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
    <div class="pie-legend">${segments.map(s=>`<span><i style="background:${s.color}"></i>${s.label} — ${Math.round(s.value/total*100)}%</span>`).join('')}</div>`;
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
  // Laisse le temps aux scripts de page de peupler les cartes avant d'observer
  setTimeout(()=>safeRun('animations au scroll', initReveal), 60);
});

