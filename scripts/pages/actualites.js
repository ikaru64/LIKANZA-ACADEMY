renderLevelTip('levelTip');

// ---------- Récap du jour (généré automatiquement, voir /api/generate-daily-news) ----------
async function renderDailyRecap(){
  const el = document.getElementById('dailyRecapCard');
  if(!el) return;
  el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Chargement du récap du jour…</p>`;
  try {
    const resp = await fetch('/api/daily-news');
    if(resp.status === 404){
      el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Le récap du jour n'est pas encore disponible : il est généré automatiquement chaque matin entre 8h et 10h.</p>`;
      return;
    }
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const dateLabel = new Date(data.date).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    const sourcesHtml = (data.sources || []).map(s =>
      `<li style="margin-bottom:5px;"><a href="${s.link}" target="_blank" rel="noopener" style="color:var(--gold-bright);">${s.title}</a> <span style="color:var(--text-dim);">— ${s.source}</span></li>`
    ).join('');
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:6px;">
        <span class="smallcaps" style="text-transform:capitalize;">${dateLabel}</span>
        <span class="badge status-reel">Généré par IA · sources réelles</span>
      </div>
      <h3 style="font-size:22px;margin-bottom:10px;">${data.title}</h3>
      <p style="color:var(--text-dim);">${data.summary}</p>
      <div class="course-item" style="background:none;padding:0;margin-top:16px;">
        <div class="head" onclick="this.nextElementSibling.classList.toggle('open')">
          <h4 style="font-size:14px;">Sources (${(data.sources || []).length})</h4>
          <span class="idx">Voir →</span>
        </div>
        <div class="course-body">
          <div class="course-body-inner">
            <ul style="font-size:13px;margin:0 0 0 18px;">${sourcesHtml}</ul>
          </div>
        </div>
      </div>`;
  } catch(err){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Le récap du jour est momentanément indisponible.</p>`;
  }
}
renderDailyRecap();

// ---------- Articles hebdomadaires par catégorie (généré automatiquement, voir /api/generate-weekly-news) ----------
const filtersEl = document.getElementById('newsFilters');
const gridEl = document.getElementById('fullNewsGrid');
let weeklyArticles = [];

function renderFull(cat){
  const items = cat === 'Toutes' ? weeklyArticles : weeklyArticles.filter(a => a.categorie === cat);
  gridEl.innerHTML = items.map(a => `
    <div class="card" id="${a.slug}" style="padding:30px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:6px;">
        <span class="smallcaps">${a.categorie}</span>
        <span class="badge status-reel">Généré par IA · sources réelles</span>
      </div>
      <h3 style="font-size:24px;">${a.titre}</h3>
      <p>${a.resume}</p>
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:8px;"><strong style="color:var(--text);">Les points à retenir</strong></p>
      <ul style="color:var(--text-dim);font-size:13.5px;margin:0 0 14px 18px;">${a.points.map(p=>`<li style="margin-bottom:5px;">${p}</li>`).join('')}</ul>
      <p style="font-size:13.5px;margin-bottom:10px;"><strong>Pourquoi c'est important : </strong><span style="color:var(--text-dim);">${a.pourquoi}</span></p>
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;"><strong style="color:var(--text);">Impact potentiel :</strong> ${a.impact.join(' · ')}</p>
      ${a.categorie === 'Économie' ? `<p style="font-size:12.5px;margin-bottom:14px;"><a href="bibliotheque.html#theme:%C3%89conomie" style="color:var(--gold-bright);">Voir le concept dans la Bibliothèque →</a></p>` : ''}
      <div class="card-footer">
        <span>${a.lecture} de lecture · semaine du ${new Date(a.weekStart).toLocaleDateString('fr-FR', {day:'numeric', month:'long'})} · Source : ${a.source}</span>
      </div>
      <div class="card-footer" style="margin-top:10px;">
        <a href="${a.lien}" target="_blank" rel="noopener" class="btn btn-sm">Lire l'article original ↗</a>
        <button class="fav-btn" data-fav-id="weekly-${a.slug}" data-fav-title="${a.titre}" data-fav-url="actualites.html#${a.slug}" data-fav-type="Actualité">${ICONS.star} Favoris</button>
      </div>
    </div>`).join('');
  initFavButtons();
}

async function initWeeklyNews(){
  gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Chargement des actualités de la semaine…</p>`;
  try {
    const resp = await fetch('/api/weekly-news');
    if(resp.status === 404){
      gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Les actualités de la semaine ne sont pas encore disponibles : elles sont générées automatiquement chaque lundi.</p>`;
      return;
    }
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    weeklyArticles = (data.articles || []).map(a => ({...a, weekStart: data.weekStart}));

    const cats = ['Toutes', ...new Set(weeklyArticles.map(a => a.categorie))];
    filtersEl.innerHTML = cats.map((c,i) => `<button class="pill ${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('');
    filtersEl.addEventListener('click', e => {
      if(e.target.tagName !== 'BUTTON') return;
      filtersEl.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      renderFull(e.target.dataset.cat);
    });
    renderFull('Toutes');

    // Ouvre directement la bonne carte si on arrive via une ancre (#slug)
    if(location.hash){
      setTimeout(()=>{ const el = document.querySelector(location.hash); if(el) el.scrollIntoView({behavior:'smooth'}); }, 200);
    }
  } catch(err){
    gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Les actualités de la semaine sont momentanément indisponibles.</p>`;
  }
}
initWeeklyNews();
