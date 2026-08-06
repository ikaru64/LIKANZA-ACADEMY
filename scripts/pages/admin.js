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
function getDraftNews(){
  const saved = safeGetJSON('fzr-draft-news', null);
  return saved || JSON.parse(JSON.stringify(NEWS_DATA));
}
function saveDraftNews(n){ safeSetJSON('fzr-draft-news', n); }

let draftCourses = getDraftCourses();
let draftNews = getDraftNews();
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
      <div class="field"><label>Contenu</label><textarea class="mission-body" data-idx="${i}">${m.body}</textarea></div>
      <button class="del-btn" data-idx="${i}">Supprimer cette mission</button>
    </div>`).join('') || '<p class="empty-note" style="padding:16px;">Aucune mission pour ce niveau.</p>';
  el.querySelectorAll('.mission-title').forEach(input=>{
    input.addEventListener('input', ()=>{
      draftCourses[currentEditLevel][+input.dataset.idx].title = input.value;
      saveDraftCourses(draftCourses);
    });
  });
  el.querySelectorAll('.mission-body').forEach(ta=>{
    ta.addEventListener('input', ()=>{
      draftCourses[currentEditLevel][+ta.dataset.idx].body = ta.value;
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

// ================= Actualités =================
function slugify(str){
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,40) || ('actu-'+Date.now());
}
function renderNewsList(){
  const el = document.getElementById('newsEditList');
  const countEl = document.getElementById('newsCountLabel');
  if(!el) return;
  if(countEl) countEl.textContent = draftNews.length + ' actualité(s)';
  el.innerHTML = draftNews.map((a,i)=>`
    <div class="card">
      <div class="field"><label>Titre</label><input type="text" class="news-f" data-idx="${i}" data-field="titre" value="${(a.titre||'').replace(/"/g,'&quot;')}"></div>
      <div class="field"><label>Catégorie</label><input type="text" class="news-f" data-idx="${i}" data-field="categorie" value="${(a.categorie||'').replace(/"/g,'&quot;')}"></div>
      <div class="field"><label>Résumé</label><textarea class="news-f" data-idx="${i}" data-field="resume">${a.resume||''}</textarea></div>
      <div class="field"><label>Points clés (un par ligne)</label><textarea class="news-f" data-idx="${i}" data-field="points">${(a.points||[]).join('\n')}</textarea></div>
      <div class="field"><label>Pourquoi c'est important</label><textarea class="news-f" data-idx="${i}" data-field="pourquoi">${a.pourquoi||''}</textarea></div>
      <div class="field"><label>Impact potentiel (séparé par des virgules)</label><input type="text" class="news-f" data-idx="${i}" data-field="impact" value="${(a.impact||[]).join(', ')}"></div>
      <div class="field"><label>Source</label><input type="text" class="news-f" data-idx="${i}" data-field="source" value="${(a.source||'').replace(/"/g,'&quot;')}"></div>
      <div class="field"><label>Lien original</label><input type="text" class="news-f" data-idx="${i}" data-field="lien" value="${(a.lien||'').replace(/"/g,'&quot;')}"></div>
      <div style="display:flex;gap:12px;">
        <div class="field" style="flex:1;"><label>Date</label><input type="text" class="news-f" data-idx="${i}" data-field="date" value="${a.date||''}"></div>
        <div class="field" style="flex:1;"><label>Lecture</label><input type="text" class="news-f" data-idx="${i}" data-field="lecture" value="${a.lecture||''}"></div>
      </div>
      <button class="del-btn" data-idx="${i}">Supprimer cette actualité</button>
    </div>`).join('') || '<p class="empty-note" style="padding:16px;">Aucune actualité.</p>';

  el.querySelectorAll('.news-f').forEach(field=>{
    field.addEventListener('input', ()=>{
      const idx = +field.dataset.idx;
      const key = field.dataset.field;
      if(key === 'points') draftNews[idx].points = field.value.split('\n').map(s=>s.trim()).filter(Boolean);
      else if(key === 'impact') draftNews[idx].impact = field.value.split(',').map(s=>s.trim()).filter(Boolean);
      else draftNews[idx][key] = field.value;
      saveDraftNews(draftNews);
    });
  });
  el.querySelectorAll('.del-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(!confirm('Supprimer cette actualité ?')) return;
      draftNews.splice(+btn.dataset.idx, 1);
      saveDraftNews(draftNews);
      renderNewsList();
    });
  });
}
const addNewsBtn = document.getElementById('addNewsBtn');
if(addNewsBtn) addNewsBtn.addEventListener('click', ()=>{
  const titre = document.getElementById('newNewsTitre').value.trim();
  const resume = document.getElementById('newNewsResume').value.trim();
  if(!titre || !resume){ alert('Titre et résumé sont obligatoires.'); return; }
  const entry = {
    id: slugify(titre),
    titre,
    categorie: document.getElementById('newNewsCat').value.trim() || 'Actualité',
    lecture: document.getElementById('newNewsLecture').value.trim() || '2 min',
    date: document.getElementById('newNewsDate').value.trim() || new Date().toLocaleDateString('fr-FR'),
    statut: 'manuel',
    resume,
    points: document.getElementById('newNewsPoints').value.split('\n').map(s=>s.trim()).filter(Boolean),
    pourquoi: document.getElementById('newNewsPourquoi').value.trim(),
    impact: document.getElementById('newNewsImpact').value.split(',').map(s=>s.trim()).filter(Boolean),
    source: document.getElementById('newNewsSource').value.trim() || 'Rédaction Likanza Academy',
    lien: document.getElementById('newNewsLien').value.trim() || '#'
  };
  draftNews.unshift(entry);
  saveDraftNews(draftNews);
  ['newNewsTitre','newNewsCat','newNewsResume','newNewsPoints','newNewsPourquoi','newNewsImpact','newNewsSource','newNewsLien','newNewsDate','newNewsLecture'].forEach(id=>{
    const f = document.getElementById(id); if(f) f.value = '';
  });
  renderNewsList();
});

// ================= Export data.js =================
function jsIndent(obj){
  return JSON.stringify(obj, null, 2);
}
function exportDataJs(){
  try{
    const scripts = document.querySelectorAll('script');
    const originalDataJs = scripts[0].textContent;
    const coursesBlock = 'const COURSES = ' + jsIndent(draftCourses) + ';';
    const newsBlock = 'const NEWS_DATA = ' + jsIndent(draftNews) + ';';
    let out = originalDataJs.replace(
      /\/\/ ===EXPORT:NEWS_DATA:START===[\s\S]*?\/\/ ===EXPORT:NEWS_DATA:END===/,
      '// ===EXPORT:NEWS_DATA:START===\n' + newsBlock + '\n// ===EXPORT:NEWS_DATA:END==='
    );
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
    if(msgEl) msgEl.textContent = "L'export a échoué dans cet environnement — réessaie une fois le site publié en ligne.";
  }
}
const exportBtn = document.getElementById('exportBtn');
if(exportBtn) exportBtn.addEventListener('click', ()=>safeRun('export data.js', exportDataJs));

const resetBtn = document.getElementById('resetBtn');
if(resetBtn) resetBtn.addEventListener('click', ()=>{
  if(!confirm('Réinitialiser tous tes changements non exportés ?')) return;
  draftCourses = JSON.parse(JSON.stringify(COURSES));
  draftNews = JSON.parse(JSON.stringify(NEWS_DATA));
  saveDraftCourses(draftCourses);
  saveDraftNews(draftNews);
  renderLevelTabs();
  renderMissionsList();
  renderNewsList();
});

// ================= Initialisation =================
safeRun('onglets niveaux (init)', renderLevelTabs);
safeRun('liste missions (init)', renderMissionsList);
safeRun('liste actualités (init)', renderNewsList);

