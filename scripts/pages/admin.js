// ================= Connexion (protection locale de démonstration, PAS une vraie sécurité) =================
// Le mot de passe ci-dessous est visible par quiconque lit ce fichier. Ce n'est PAS
// une protection réelle des données : voir ARCHITECTURE.md pour une vraie solution.
const ADMIN_DEMO_PASSWORD = "likanza2026";

function isAdminLoggedIn(){
  try{ return sessionStorage.getItem('fzr-admin-session') === 'ok'; }catch(e){ return false; }
}
function showAdminContent(){
  const login = document.getElementById('adminLoginScreen');
  const content = document.getElementById('adminContent');
  if(login) login.style.display = 'none';
  if(content) content.style.display = 'block';
}
function showLoginScreen(){
  const login = document.getElementById('adminLoginScreen');
  const content = document.getElementById('adminContent');
  if(login) login.style.display = 'block';
  if(content) content.style.display = 'none';
}
if(isAdminLoggedIn()) showAdminContent();

const adminLoginBtn = document.getElementById('adminLoginBtn');
if(adminLoginBtn) adminLoginBtn.addEventListener('click', ()=>{
  const pass = document.getElementById('adminPass').value;
  const msgEl = document.getElementById('adminLoginMsg');
  if(pass === ADMIN_DEMO_PASSWORD){
    try{ sessionStorage.setItem('fzr-admin-session', 'ok'); }catch(e){}
    showAdminContent();
  }else{
    if(msgEl) msgEl.textContent = "Mot de passe incorrect.";
  }
});
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
if(adminLogoutBtn) adminLogoutBtn.addEventListener('click', ()=>{
  try{ sessionStorage.removeItem('fzr-admin-session'); }catch(e){}
  showLoginScreen();
});

// ================= Brouillons éditables (initialisés depuis les vraies données) =================
function getDraftCourses(){
  const saved = safeGetJSON('fzr-draft-courses', null);
  return saved || JSON.parse(JSON.stringify(COURSES));
}
function saveDraftCourses(c){ safeSetJSON('fzr-draft-courses', c); }
let draftCourses = getDraftCourses();
const LEVEL_LABELS_ADMIN = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
let currentEditLevel = 'debutant';

// ================= Missions =================
function renderLevelTabs(){
  const el = document.getElementById('coursesLevelTabs');
  if(!el) return;
  const levels = Object.keys(draftCourses);
  el.innerHTML = levels.map(l=>`<button class="pill ${l===currentEditLevel?'active':''}" data-level="${l}">${LEVEL_LABELS_ADMIN[l]||l}</button>`).join('');
  el.querySelectorAll('.pill').forEach(btn=>{
    btn.addEventListener('click', ()=>{ currentEditLevel = btn.dataset.level; renderLevelTabs(); renderMissionsList(); });
  });
  const select = document.getElementById('newMissionLevel');
  if(select) select.innerHTML = levels.map(l=>`<option value="${l}">${LEVEL_LABELS_ADMIN[l]||l}</option>`).join('');
}
function renderMissionsList(){
  const el = document.getElementById('coursesEditList');
  if(!el) return;
  const mods = draftCourses[currentEditLevel] || [];
  el.innerHTML = mods.map((m,i)=>`
    <div class="course-item">
      <div class="field"><label>Titre</label><input type="text" class="mission-title" data-idx="${i}" value="${m.title.replace(/"/g,'&quot;')}"></div>
      <p style="font-size:12px;color:var(--text-dim);margin:6px 0 10px;">Mission scénarisée (${(m.story||[]).length} chapitre${(m.story||[]).length>1?'s':''} + question) ; l'édition du scénario complet depuis cet outil n'est pas encore disponible, modifie <code>scripts/app.js</code> directement pour l'instant.</p>
      <button class="del-btn" data-idx="${i}">Supprimer cette mission</button>
    </div>`).join('') || '<p class="empty-note" style="padding:16px;">Aucune mission pour ce niveau.</p>';
  el.querySelectorAll('.mission-title').forEach(input=>{
    input.addEventListener('input', ()=>{
      draftCourses[currentEditLevel][+input.dataset.idx].title = input.value;
      saveDraftCourses(draftCourses);
    });
  });
  el.querySelectorAll('.del-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(!confirm('Supprimer cette mission ?')) return;
      draftCourses[currentEditLevel].splice(+btn.dataset.idx, 1);
      saveDraftCourses(draftCourses);
      renderMissionsList();
    });
  });
}
const addMissionBtn = document.getElementById('addMissionBtn');
if(addMissionBtn) addMissionBtn.addEventListener('click', ()=>{
  const level = document.getElementById('newMissionLevel').value;
  const title = document.getElementById('newMissionTitle').value.trim();
  const body = document.getElementById('newMissionBody').value.trim();
  if(!title || !body){ alert('Titre et contenu sont obligatoires.'); return; }
  if(!draftCourses[level]) draftCourses[level] = [];
  draftCourses[level].push({title, body});
  saveDraftCourses(draftCourses);
  document.getElementById('newMissionTitle').value = '';
  document.getElementById('newMissionBody').value = '';
  currentEditLevel = level;
  renderLevelTabs();
  renderMissionsList();
});

// ================= Actualités : panneau d'état du pipeline (lecture seule) =================
// Il n'y a volontairement plus d'éditeur ici : l'ancien formulaire écrivait
// dans fzr-draft-news / NEWS_DATA, une structure que scripts/pages/actualites.js
// ne lit jamais (le vrai contenu vient exclusivement de /api/daily-news et
// /api/weekly-news, alimentées par le pipeline Cron+IA). Modifier NEWS_DATA
// donnait donc l'illusion d'un contrôle éditorial qui n'existait pas.
async function renderNewsPipelineStatus(){
  const el = document.getElementById('newsPipelineStatus');
  if(!el) return;
  el.innerHTML = `<div class="card"><p style="color:var(--text-dim);font-size:13px;">Vérification de l'état du pipeline…</p></div>`;

  const fetchStatus = (url) => fetch(url).then(r => {
    if(r.status === 404) return null;
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
  const [dailyResult, weeklyResult] = await Promise.allSettled([fetchStatus('/api/daily-news'), fetchStatus('/api/weekly-news')]);

  const dailyCard = (() => {
    if(dailyResult.status === 'rejected') return `<div class="card"><span class="smallcaps">Récap du jour</span><p style="color:var(--bordeaux);font-size:13px;margin-top:8px;">État impossible à vérifier (erreur réseau ou API).</p></div>`;
    const daily = dailyResult.value;
    if(!daily) return `<div class="card"><span class="smallcaps">Récap du jour</span><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Aucun récap encore généré. Prévu chaque jour à 7h30 UTC.</p></div>`;
    return `<div class="card">
      <span class="smallcaps">Récap du jour</span>
      <h4 style="margin-top:8px;font-size:15px;">${daily.title}</h4>
      <p style="color:var(--text-dim);font-size:12.5px;margin-top:6px;">Date : ${new Date(daily.date).toLocaleDateString('fr-FR')} · ${(daily.sources||[]).length} source(s) réelle(s) · généré le ${new Date(daily.generatedAt).toLocaleString('fr-FR')}</p>
    </div>`;
  })();

  const weeklyCard = (() => {
    if(weeklyResult.status === 'rejected') return `<div class="card"><span class="smallcaps">Articles de la semaine</span><p style="color:var(--bordeaux);font-size:13px;margin-top:8px;">État impossible à vérifier (erreur réseau ou API).</p></div>`;
    const weekly = weeklyResult.value;
    if(!weekly) return `<div class="card"><span class="smallcaps">Articles de la semaine</span><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Aucun article encore généré. Prévu chaque lundi à 6h UTC.</p></div>`;
    const list = (weekly.articles||[]).map(a=>`<li>${a.categorie} — ${a.titre}</li>`).join('');
    return `<div class="card">
      <span class="smallcaps">Articles de la semaine</span>
      <p style="color:var(--text-dim);font-size:12.5px;margin:8px 0;">Semaine du ${new Date(weekly.weekStart).toLocaleDateString('fr-FR')} · ${(weekly.articles||[]).length} article(s)</p>
      <ul style="font-size:12.5px;color:var(--text-dim);margin:0 0 0 18px;">${list}</ul>
    </div>`;
  })();

  el.innerHTML = dailyCard + weeklyCard;
}

// ================= Export data.js =================
function jsIndent(obj){
  return JSON.stringify(obj, null, 2);
}
function exportDataJs(){
  try{
    const scripts = document.querySelectorAll('script');
    const originalDataJs = scripts[0].textContent;
    const coursesBlock = 'const COURSES = ' + jsIndent(draftCourses) + ';';
    let out = originalDataJs;
    out = out.replace(
      /\/\/ ===EXPORT:COURSES:START===[\s\S]*?\/\/ ===EXPORT:COURSES:END===/,
      '// ===EXPORT:COURSES:START===\n' + coursesBlock + '\n// ===EXPORT:COURSES:END==='
    );
    const blob = new Blob([out], {type:'text/javascript'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const msgEl = document.getElementById('exportMsg');
    if(msgEl) msgEl.textContent = 'Fichier téléchargé. Envoie-le pour republier, ou remplace data.js toi-même sur ton hébergement.';
  }catch(err){
    console.error('Échec de l\u2019export data.js :', err);
    const msgEl = document.getElementById('exportMsg');
    if(msgEl) msgEl.textContent = "L'export a échoué dans cet environnement : réessaie une fois le site publié en ligne.";
  }
}
const exportBtn = document.getElementById('exportBtn');
if(exportBtn) exportBtn.addEventListener('click', ()=>safeRun('export data.js', exportDataJs));

const resetBtn = document.getElementById('resetBtn');
if(resetBtn) resetBtn.addEventListener('click', ()=>{
  if(!confirm('Réinitialiser tous tes changements non exportés ?')) return;
  draftCourses = JSON.parse(JSON.stringify(COURSES));
  saveDraftCourses(draftCourses);
  renderLevelTabs();
  renderMissionsList();
  renderNewsPipelineStatus();
});

// ================= Initialisation =================
safeRun('onglets niveaux (init)', renderLevelTabs);
safeRun('liste missions (init)', renderMissionsList);
safeRun('état pipeline actualités (init)', renderNewsPipelineStatus);

