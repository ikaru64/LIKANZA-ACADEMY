const cats = ['Toutes', ...new Set(NEWS_DATA.map(n=>n.categorie))];
const filtersEl = document.getElementById('newsFilters');
filtersEl.innerHTML = cats.map((c,i)=>`<button class="pill ${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('');

function renderFull(cat){
  const items = cat==='Toutes' ? NEWS_DATA : NEWS_DATA.filter(n=>n.categorie===cat);
  document.getElementById('fullNewsGrid').innerHTML = items.map(a=>`
    <div class="card" id="${a.id}" style="padding:30px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:6px;">
        <span class="smallcaps">${a.categorie}</span>
        <span class="badge status-${a.statut}">${a.statut === 'reel' ? 'résumé assisté par IA — vérifié' : a.statut}</span>
      </div>
      <h3 style="font-size:24px;">${a.titre}</h3>
      <p>${a.resume}</p>
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:8px;"><strong style="color:var(--text);">Les points à retenir</strong></p>
      <ul style="color:var(--text-dim);font-size:13.5px;margin:0 0 14px 18px;">${a.points.map(p=>`<li style="margin-bottom:5px;">${p}</li>`).join('')}</ul>
      <p style="font-size:13.5px;margin-bottom:10px;"><strong>Pourquoi c'est important — </strong><span style="color:var(--text-dim);">${a.pourquoi}</span></p>
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;"><strong style="color:var(--text);">Impact potentiel :</strong> ${a.impact.join(' · ')}</p>
      <div class="card-footer">
        <span>${a.lecture} de lecture · ${a.date} · Source : ${a.source}</span>
      </div>
      <div class="card-footer" style="margin-top:10px;">
        <a href="${a.lien}" target="_blank" rel="noopener" class="btn btn-sm">Lire l'article original ↗</a>
        <button class="fav-btn" data-fav-id="news-${a.id}" data-fav-title="${a.titre}" data-fav-url="actualites.html#${a.id}" data-fav-type="Actualité">★ Favoris</button>
      </div>
    </div>`).join('');
  initFavButtons();
}
filtersEl.addEventListener('click', e=>{
  if(e.target.tagName !== 'BUTTON') return;
  filtersEl.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
  e.target.classList.add('active');
  renderFull(e.target.dataset.cat);
});
renderFull('Toutes');

// Ouvre directement la bonne carte si on arrive via une ancre (#id)
if(location.hash){
  setTimeout(()=>{ const el = document.querySelector(location.hash); if(el) el.scrollIntoView({behavior:'smooth'}); }, 200);
}
