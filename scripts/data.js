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
function safeSet(key, val){
  try{ localStorage.setItem(key, val); return true; }catch(e){ return false; }
}
function safeGetJSON(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; }
}
function safeSetJSON(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); return true; }catch(e){ return false; }
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
  let correct = 0, total = 0;
  domain.quizCategories.forEach(cat => {
    const s = stats[cat];
    if(s){ correct += s.correct; total += s.total; }
  });
  if(total < 10) return null;
  const pct = Math.round((correct / total) * 100);
  return {niveau: levelFromPct(pct), pct, confiance: total >= 20 ? 'moyenne' : 'faible', source: 'activité récente (Défis, cours)', correct, total};
}

const DOMAIN_LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};

// ---------- Mon Parcours : tableau de bord par domaine ----------
// Une carte par domaine (déclaré vs évalué, jamais confondus). Réutilise le
// gabarit visuel de renderBusinessNiveau (business-concept-row) plutôt que
// d'introduire un nouveau composant pour la même idée (une ligne = un fait,
// une étiquette).
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
  {id:'first_sim', name:'Premier laboratoire', desc:"Lancer une simulation financière.", check:(g,ctx)=> !!(ctx && ctx.usedSimulator)},
  {id:'positioning_test', name:'Bilan effectué', desc:"Terminer le test de positionnement.", check:(g,ctx)=> !!(ctx && ctx.positioningTestDone)},
  {id:'first_cours', name:'Premier cours', desc:"Réussir le quiz de validation d'un cours.", check:(g,ctx)=> !!(ctx && ctx.coursCompleted)},
  {id:'mistake_slayer', name:'Retour gagnant', desc:"Corriger 5 anciennes erreurs.", check:(g,ctx)=> !!(ctx && ctx.totalResolved >= 5)},
  {id:'memory_perfect', name:'Mémoire d\'éléphant', desc:"Terminer une partie de Memory Finance sans erreur.", check:(g,ctx)=> !!(ctx && ctx.memoryPerfect)}
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
        <span style="font-size:12.5px;color:var(--text-dim);">${ICONS.coins} Finance Points (à dépenser)</span>
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
function recordAnswer(categorie, correct, applied){
  const stats = getQuizStats();
  const c = stats.categoryStats[categorie] || (stats.categoryStats[categorie] = {correct:0, total:0});
  if(c.appliedCorrect === undefined) c.appliedCorrect = 0;
  if(c.appliedTotal === undefined) c.appliedTotal = 0;
  if(!c.correctDates) c.correctDates = [];
  c.total++;
  if(applied) c.appliedTotal++;
  if(correct){
    c.correct++;
    if(applied) c.appliedCorrect++;
    const today = new Date().toDateString();
    if(!c.correctDates.includes(today)){
      c.correctDates.unshift(today);
      c.correctDates = c.correctDates.slice(0, 12); // jours distincts récents, jamais un journal illimité
    }
  }
  saveQuizStats(stats);
}
function recordQuizCompletion(level, categorie, length, score){
  const stats = getQuizStats();
  stats.history.unshift({date:new Date().toLocaleDateString('fr-FR'), level, categorie, length, score});
  stats.history = stats.history.slice(0, 30);
  saveQuizStats(stats);
}
// Score de maîtrise continu par catégorie, dérivé de fzr-quiz-stats (aucune
// donnée inventée — uniquement de vraies réponses aux quiz). Seule mesure de
// maîtrise du site (l'ancienne version à double seuil silencieux, avec son
// angle mort 50-75%, a été retirée).
function getSkillMastery(){
  const stats = getQuizStats();
  return Object.entries(stats.categoryStats)
    .filter(([, s]) => s.total >= 2)
    .map(([categorie, s]) => {
      const pct = Math.round((s.correct / s.total) * 100);
      let niveau = 'en cours';
      if(pct >= 75) niveau = 'maîtrisé';
      else if(pct < 50) niveau = 'faible';
      return {categorie, pct, correct: s.correct, total: s.total, niveau};
    })
    .sort((a, b) => a.pct - b.pct);
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
      startMixedSession(`${elId}-session`, pool.slice(0, 6), {level: cat, categorie: cat, onRestart: () => renderMasteryList(elId)});
      sessionEl.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  });
}

// selectQuizQuestions, renderQuickChallenge et renderQuizSetup ont été
// retirés : entièrement remplacés par le moteur Défis (defisFullPool,
// startMixedSession, renderDefiDuJour, renderModesEntrainement) qui couvre
// le même besoin (sélection niveau/thème/longueur) sur un pool combiné
// QUIZ_BANK_FULL + MENTAL_CHALLENGES, avec plusieurs formats possibles.

// ---------- Feedback pédagogique partagé (Défis) ----------
// Utilisé par tous les moteurs de quiz/défis, anciens et nouveaux : un
// verdict court suivi de la vraie explication — jamais un simple ✅/❌ nu,
// jamais un ton enfantin ("Oups ! Essaie encore champion 😜").
function renderFeedbackHtml(correct, explication, xpMsg){
  return `
    <p class="feedback-verdict ${correct ? 'feedback-correct' : 'feedback-incorrect'}">
      <span aria-hidden="true">${correct ? '✓' : '✗'}</span> ${correct ? 'Exact.' : 'Pas tout à fait.'}
    </p>
    <p class="feedback-explanation">${explication}</p>
    ${xpMsg ? `<p class="feedback-xp">${xpMsg}</p>` : ''}`;
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
        recordAnswer(item.categorie, correct, isAppliedItem(item));
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
        document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg);
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
      recordAnswer(item.categorie, correct, isAppliedItem(item));
      const xp = item.xp || 10;
      let xpMsg = '';
      if(correct){
        const got = tryAwardQuizPoints(item.id, xp);
        if(got) xpMsg = `+${got} XP · +${got} Finance Points`;
        resolveMistake(item.id);
      } else {
        recordMistake(item);
      }
      document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg);
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
      recordAnswer(item.categorie, correct, isAppliedItem(item));
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
      document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg);
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
    recordAnswer(item.categorie, correct, isAppliedItem(item));
    const xp = item.xp || 10;
    let xpMsg = '';
    if(correct){
      const got = tryAwardQuizPoints(item.id, xp);
      if(got) xpMsg = `+${xp} XP · +${xp} Finance Points`;
      resolveMistake(item.id);
    } else {
      recordMistake(item);
    }
    feedbackEl.innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg);
    onAnswered(correct, correct ? xp : 0);
  };
  btn.addEventListener('click', check);
  input.addEventListener('keydown', e => { if(e.key === 'Enter') check(); });
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
    recordAnswer(item.categorie, correct, isAppliedItem(item));
    const xp = item.xp || 12;
    let xpMsg = '';
    if(correct){
      const got = tryAwardQuizPoints(item.id, xp);
      if(got) xpMsg = `+${xp} XP · +${xp} Finance Points`;
      resolveMistake(item.id);
    } else {
      recordMistake(item);
    }
    document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, item.explication, xpMsg);
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
    recordAnswer(item.categorie, correct, isAppliedItem(item));
    const xp = item.xp || 12;
    let xpMsg = '';
    if(correct){
      const got = tryAwardQuizPoints(item.id, xp);
      if(got) xpMsg = `+${xp} XP · +${xp} Finance Points`;
      resolveMistake(item.id);
    } else {
      recordMistake(item);
    }
    document.getElementById(`${elId}-feedback`).innerHTML = renderFeedbackHtml(correct, `${correctCount}/${item.items.length} bien classés. ${item.explication}`, xpMsg);
    onAnswered(correct, correct ? xp : 0);
  }, {once:true});
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
  classe: renderClasseItem
};

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
    startMixedSession(elId, pool.slice(0, 5), {onRestart: () => renderRecommandePourToi(elId)});
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
    startMixedSession(elId, pool.slice(0, 5), {onRestart: () => renderDefisARevoir(elId)});
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
      startMixedSession(`${elId}-session`, pool.slice(0, 6), {
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
    let items = pool.filter(i => (cat === 'tous' || i.categorie === cat) && (level === 'tous' || i.niveau === level));
    for(let i = items.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    items = items.slice(0, length);
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
  el.innerHTML = `<div id="${elId}-semaine" style="margin-bottom:20px;"></div><div id="${elId}-mastery"></div>`;
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

// Grille de tuiles cliquables (page Academy) — chaque tuile ouvre le cours
// complet sur sa propre page (cours.html#id) plutôt que de tout dérouler en
// accordéon sur la même page, pour éviter un scroll interminable.
function renderCoursTiles(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const progress = getCoursProgress();
  el.innerHTML = `<div class="card-grid">${COURS_CATALOG.map(cours=>{
    const done = !!progress[cours.id];
    return `
    <a href="cours.html#${encodeURIComponent(cours.id)}" class="card play-tile">
      <span class="icon" data-icon="book-open" style="color:var(--gold-bright);"></span>
      <h3 style="font-size:16px;margin-top:10px;">${done ? ICONS.check + ' ' : ''}${cours.titre}</h3>
      <p>${cours.libraryTermes.length} notion${cours.libraryTermes.length>1?'s':''} · lecture + quiz de validation</p>
      <div class="card-footer"><span class="badge ${done ? 'status-reel' : 'status-differe'}">${done ? 'Validé' : cours.niveau}</span><span>Ouvrir →</span></div>
    </a>`;
  }).join('')}</div>`;
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
  let pool = QUIZ_BANK_FULL.filter(q=>cours.quizCategories.includes(q.categorie));
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
        recordAnswer(item.categorie, correct, isAppliedItem(item));
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
    renderNextStepCard(`${elId}-nextstep`, {categories: cours.quizCategories});
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
      recordAnswer(q.categorie, correct, isAppliedItem(q));
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
        recordAnswer(q.categorie, correct, isAppliedItem(q));
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
      recordAnswer(item.categorie, correct, isAppliedItem(item));
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
    startMixedSession(elId, catPool.slice(0, 5), {level:'business', categorie, onRestart: () => renderBusinessCasRecommande(elId)});
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
    </button>`;
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

  return {prix, coutDirect, cac, achatsMoyens, chargesFixes, margeBrute, margeBrutePct, ltv, ratioLtvCac, seuilVentes, revenuTotalMoyen};
}

function renderUnitEconomics(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const stored = safeGetJSON('fzr-unit-economics', {prix:50, coutDirect:15, cac:40, achatsMoyens:3, chargesFixes:1500});

  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('calcul')} Renseigne tes propres hypothèses : les calculs s'enchaînent à partir de ces chiffres, sans jugement automatique sur ton projet.</p>
    <div class="card-grid" style="margin-bottom:16px;">
      <div class="field"><label for="${elId}-prix">Prix de vente moyen (€)</label><input type="number" id="${elId}-prix" value="${stored.prix}"></div>
      <div class="field"><label for="${elId}-coutDirect">Coût direct par vente (€)</label><input type="number" id="${elId}-coutDirect" value="${stored.coutDirect}"></div>
      <div class="field"><label for="${elId}-cac">CAC — coût d'acquisition (€)</label><input type="number" id="${elId}-cac" value="${stored.cac}"></div>
      <div class="field"><label for="${elId}-achatsMoyens">Nombre d'achats moyen par client</label><input type="number" id="${elId}-achatsMoyens" value="${stored.achatsMoyens}" step="0.1"></div>
      <div class="field"><label for="${elId}-chargesFixes">Charges fixes mensuelles (€)</label><input type="number" id="${elId}-chargesFixes" value="${stored.chargesFixes}"></div>
    </div>
    <div id="${elId}-results"></div>`;

  function readInputs(){
    return {
      prix: document.getElementById(`${elId}-prix`).value,
      coutDirect: document.getElementById(`${elId}-coutDirect`).value,
      cac: document.getElementById(`${elId}-cac`).value,
      achatsMoyens: document.getElementById(`${elId}-achatsMoyens`).value,
      chargesFixes: document.getElementById(`${elId}-chargesFixes`).value
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
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">${renderDataBadge('avis')} Un ratio LTV/CAC autour de 3 est souvent cité comme un repère sain (voir la fiche « CAC » de la Bibliothèque) — un repère indicatif, jamais une règle universelle ni une garantie de rentabilité.</p>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Sensibilité — que se passe-t-il si...</span>
      <div class="card-grid">
        <div class="card"><h4>CAC +20%</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">Ratio LTV/CAC : <strong class="mono">${r.cac>0 ? (r.ltv/(r.cac*1.2)).toFixed(1)+'×' : '—'}</strong></p></div>
        <div class="card"><h4>1 achat de moins par client</h4><p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">LTV : <strong class="mono">${fmtEUR(r.margeBrute * Math.max(0, r.achatsMoyens - 1))}</strong></p></div>
      </div>`;
  }
  ['prix','coutDirect','cac','achatsMoyens','chargesFixes'].forEach(key => {
    document.getElementById(`${elId}-${key}`).addEventListener('input', update);
  });
  update();
  tryAwardQuizPoints(`unit-economics-${new Date().toDateString()}`, 5, {usedUnitEconomics:true});
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
function getFollowedStocks(){
  let list = safeGetJSON('fzr-followed-stocks', null);
  if(list === null){
    // Premier chargement : on part des 8 valeurs de démonstration, en
    // reprenant une éventuelle liste de l'ancienne fonctionnalité séparée
    // (fzr-custom-stocks) pour ne rien perdre de ce qui avait déjà été ajouté.
    const defaults = STOCKS_DEMO.map(s => ({symbol: s.ticker, name: s.nom}));
    const legacy = safeGetJSON('fzr-custom-stocks', []).map(s => ({symbol: s.symbol, name: s.name}));
    const seen = new Set(defaults.map(s => s.symbol));
    legacy.forEach(s => { if(!seen.has(s.symbol)){ defaults.push(s); seen.add(s.symbol); } });
    list = defaults;
    saveFollowedStocks(list);
  }
  return list;
}
function saveFollowedStocks(list){ safeSetJSON('fzr-followed-stocks', list); }
function addFollowedStock(stock){
  const list = getFollowedStocks().filter(s => s.symbol !== stock.symbol);
  list.push({symbol: stock.symbol, name: stock.name});
  saveFollowedStocks(list.slice(0, FOLLOWED_STOCKS_MAX));
}
function removeFollowedStock(symbol){
  saveFollowedStocks(getFollowedStocks().filter(s => s.symbol !== symbol));
}
function resetFollowedStocks(){
  saveFollowedStocks(STOCKS_DEMO.map(s => ({symbol: s.ticker, name: s.nom})));
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
  'fzr-business-strategy-transfer', 'fzr-unit-economics', 'fzr-watchlist', 'fzr-real-portfolio'
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
    ma50: movingAverageVsLast(50)
  };
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
// curatées STOCKS_DEMO) — remplace les lookups STOCKS_DEMO.find dispersés
// dans bourse.js/action.js. secteur/pays/pea restent explicitement `null`
// quand non curatés (jamais une valeur par défaut inventée) : permet de
// distinguer "non éligible confirmé" de "non déterminé" côté affichage. ----------
let followedQuotesCache = {};
function resolveFollowedStock(symbol){
  const demo = STOCKS_DEMO.find(s => s.ticker === symbol);
  if(demo){
    return {
      ticker: demo.ticker, nom: demo.nom, secteur: demo.secteur, pays: demo.pays,
      pea: demo.pea, prix: demo.prix, variation: demo.variation, history: demo.history,
      curated: true
    };
  }
  const followed = getFollowedStocks().find(s => s.symbol === symbol);
  const q = followedQuotesCache[symbol];
  return {
    ticker: symbol, nom: followed ? followed.name : symbol,
    secteur: null, pays: null, pea: null,
    prix: q ? q.price : null, variation: q ? q.changePercent : null, history: q ? q.history : null,
    curated: false
  };
}

// ---------- Portefeuille réel (déclaratif) : Likanza n'a accès à aucun
// compte-titres réel — chaque transaction (action, quantité, prix, date) est
// saisie manuellement par l'utilisateur. Les positions sont agrégées à
// partir de ces transactions réellement saisies, valorisées avec un cours
// ACTUEL réel déjà chargé ailleurs (resolveFollowedStock, jamais un nouvel
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
// partir de resolveFollowedStock, jamais recalculé ici. Un ticker absent de
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

