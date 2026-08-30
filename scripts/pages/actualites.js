renderLevelTip('levelTip');

// ---------- Corroboration (chantier "vraies sources par article") : un
// badge dédié, distinct du Truth Framework (renderDataBadge, fait/calcul/
// analyse/scénario/avis/simulation — un axe différent, le TYPE
// d'information) — ici l'axe est "combien de sources indépendantes le
// confirment", calculé en code (voir filterSourcesUsed côté serveur),
// jamais une auto-évaluation du modèle. ----------
function renderCorroborationBadge(sourceCount){
  if(sourceCount >= 2){
    return `<span class="badge status-reel" title="Rapporté par ${sourceCount} sources indépendantes différentes">✓ Confirmé par ${sourceCount} sources</span>`;
  }
  return `<span class="badge status-differe" title="Une seule source rapporte cette information pour le moment">Source unique — à confirmer</span>`;
}
function renderSourcesListHtml(sources){
  const list = Array.isArray(sources) ? sources : [];
  const sourcesHtml = list.map(s =>
    `<li style="margin-bottom:5px;"><a href="${s.link}" target="_blank" rel="noopener" style="color:var(--gold-bright);">${s.title}</a> <span style="color:var(--text-dim);">— ${s.source}</span></li>`
  ).join('');
  return `
    <div class="course-item" style="background:none;padding:0;margin-top:10px;">
      <button type="button" class="head" style="background:none;border:none;width:100%;text-align:left;font:inherit;" onclick="this.nextElementSibling.classList.toggle('open')">
        <h4 style="font-size:13px;">Sources (${list.length})</h4>
        <span class="idx">Voir →</span>
      </button>
      <div class="course-body">
        <div class="course-body-inner">
          <ul style="font-size:13px;margin:0 0 0 18px;">${sourcesHtml}</ul>
        </div>
      </div>
    </div>`;
}

// ---------- Récap du jour (généré automatiquement, voir /api/generate-daily-news) ----------
// Une liste de 3 à 5 actualités distinctes du jour, chacune avec ses propres
// sources réellement citées et son badge de corroboration — plus un seul
// paragraphe flou balayant plusieurs sujets sans rapport. Repli sur l'ancien
// format (title/summary en un seul bloc) si items est absent/vide (ligne
// générée avant ce chantier, ou tableau vide en base) : jamais un écran cassé.
async function renderDailyRecap(){
  const el = document.getElementById('dailyRecapCard');
  if(!el) return;
  el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Chargement du récap du jour…</p>`;
  try {
    const resp = await fetch('/api/daily-news');
    if(resp.status === 404){
      el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Le récap du jour n'est pas encore disponible : il est généré automatiquement chaque matin, en fin de matinée (vers 10h-11h), pour laisser le temps aux articles du jour d'être publiés.</p>`;
      return;
    }
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const dateLabel = new Date(data.date).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    const items = Array.isArray(data.items) ? data.items : [];

    const itemsHtml = items.length > 0
      ? items.map(it => `
        <div class="card" style="margin-top:14px;">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:6px;">
            <h4 style="font-size:16px;margin:0;">${it.title}</h4>
            ${renderCorroborationBadge(it.sourceCount || 0)}
          </div>
          <p style="color:var(--text-dim);font-size:13.5px;">${it.summary}</p>
          ${renderSourcesListHtml(it.sources)}
        </div>`).join('')
      // Repli honnête sur l'ancien format (title/summary global, sources
      // indifférenciées) pour une ligne générée avant ce chantier.
      : `<p style="color:var(--text-dim);">${data.summary || ''}</p>${renderSourcesListHtml(data.sources)}`;

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:6px;">
        <span class="smallcaps" style="text-transform:capitalize;">${dateLabel}</span>
        <span class="badge status-reel">Généré par IA · sources réelles</span>
      </div>
      <h3 style="font-size:22px;margin-bottom:4px;">${data.title}</h3>
      ${itemsHtml}`;
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
      ${Array.isArray(a.aSurveiller) && a.aSurveiller.length ? `
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:4px;"><strong style="color:var(--text);">👀 À surveiller</strong> <span style="font-style:italic;">— pas une prédiction, des éléments qui confirmeront ou infirmeront cette synthèse</span></p>
      <ul style="color:var(--text-dim);font-size:13px;margin:0 0 14px 18px;">${a.aSurveiller.map(p=>`<li style="margin-bottom:4px;">${p}</li>`).join('')}</ul>` : ''}
      ${a.accordSources ? `<p style="font-size:12px;color:var(--text-dim);margin-bottom:14px;">${renderDataBadge('analyse')} ${a.accordSources}</p>` : ''}
      ${renderNewsApprofondirLink(a.categorie)}
      ${renderCourseLibraryLinks(findArticleConcepts(a))}
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:14px;">
        <span style="font-size:12px;color:var(--text-dim);">${a.lecture} de lecture · semaine du ${new Date(a.weekStart).toLocaleDateString('fr-FR', {day:'numeric', month:'long'})}</span>
        ${renderCorroborationBadge(Array.isArray(a.sources) ? new Set(a.sources.map(s=>s.source)).size : 0)}
      </div>
      ${renderSourcesListHtml(a.sources)}
      <div class="card-footer" style="margin-top:10px;">
        <a href="${a.lien}" target="_blank" rel="noopener" class="btn btn-sm">Lire l'article original ↗</a>
        <button class="fav-btn" data-fav-id="weekly-${a.slug}" data-fav-title="${a.titre}" data-fav-url="actualites.html#${a.slug}" data-fav-type="Actualité">${ICONS.star} Favoris</button>
      </div>
    </div>`).join('');
  initFavButtons();
}

// ---------- "Pour vous" (chantier Continuité, phase 7, 30/08/2026, sections
// 18-19 du prompt d'origine) : ne remplace JAMAIS la liste "Actualités"
// complète en dessous (section 77 : interconnexion ≠ duplication, mais ici
// c'est l'inverse — jamais de bulle qui cacherait l'information générale).
// Masquée entièrement si aucun article n'a de vrai signal de pertinence —
// jamais une section "Pour vous" vide ou remplie par défaut. ----------
function renderPourVous(){
  const section = document.getElementById('pourVousSection');
  const grid = document.getElementById('pourVousGrid');
  if(!section || !grid) return;
  const picks = weeklyArticles
    .map(a => ({article: a, signals: computeArticleRelevanceSignals(a)}))
    .filter(p => p.signals.length > 0)
    .slice(0, 3);
  if(!picks.length){ section.style.display = 'none'; return; }
  section.style.display = 'block';
  grid.innerHTML = picks.map(({article: a, signals}) => `
    <a href="#${a.slug}" class="card" style="text-decoration:none;color:inherit;display:block;">
      <span class="smallcaps">${a.categorie}</span>
      <h4 style="margin:8px 0 4px;font-size:16px;">${a.titre}</h4>
      <p style="font-size:12.5px;color:var(--text-dim);">${signals[0]}</p>
    </a>`).join('');
}

async function initWeeklyNews(){
  gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Chargement des actualités de la semaine…</p>`;
  try {
    const resp = await fetch('/api/weekly-news');
    if(resp.status === 404){
      gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Les actualités de la semaine ne sont pas encore disponibles : elles sont générées automatiquement chaque lundi (avec un repli le mardi si le premier passage échoue).</p>`;
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
    renderPourVous();

    // Ouvre directement la bonne carte si on arrive via une ancre (#slug)
    if(location.hash){
      setTimeout(()=>{ const el = document.querySelector(location.hash); if(el) el.scrollIntoView({behavior:'smooth'}); }, 200);
    }
  } catch(err){
    gridEl.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Les actualités de la semaine sont momentanément indisponibles.</p>`;
  }
}
initWeeklyNews();
