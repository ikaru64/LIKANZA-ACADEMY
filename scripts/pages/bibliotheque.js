/* ============================================================
   LIKANZA ACADEMY — Bibliothèque : "arbre du savoir"
   Navigation à deux niveaux sur LIBRARY (aucune donnée nouvelle) :
   niveau 1 = thèmes (une catégorie = une carte), niveau 2 = les
   notions ("feuilles") de ce thème. La recherche court-circuite les
   deux niveaux et affiche directement les feuilles correspondantes.
   ============================================================ */
document.getElementById('libCount').textContent = LIBRARY.length + ' notions';

let currentMode = 'simple';
let currentTheme = null; // null = on est au niveau "thèmes"

function bibliothequeBodyKey(){
  return currentMode === 'detail' ? 'detail' : (currentMode === 'avance' ? 'avance' : 'simple');
}

function themeCounts(){
  const counts = {};
  LIBRARY.forEach(l => { counts[l.categorie] = (counts[l.categorie]||0) + 1; });
  return counts;
}

function renderLeafCards(container, items){
  const bodyKey = bibliothequeBodyKey();
  container.innerHTML = items.map((l,i) => `
    <div class="kt-leaf-card" id="leaf-${l.terme.replace(/\s+/g,'-')}">
      <button type="button" class="kt-leaf-head" style="background:none;border:none;width:100%;text-align:left;font:inherit;" data-idx="${i}">
        <h4>${l.terme}</h4>
        <span class="kt-leaf-meta">${l.niveau} · ${l.lecture}</span>
      </button>
      <div class="kt-leaf-body">
        <div id="ktConseil-${i}"></div>
        ${renderPrerequisNudge(l.prerequis, {className: 'kt-leaf-prereq'})}
        <p>${l[bodyKey]}</p>
        ${l.exemple ? `<p class="kt-leaf-example"><strong>Exemple : </strong>${l.exemple}</p>` : ''}
        ${l.avantages && l.avantages.length ? `<p class="kt-leaf-pro"><strong>Avantages :</strong> ${l.avantages.join(' · ')}</p>` : ''}
        ${l.inconvenients && l.inconvenients.length ? `<p class="kt-leaf-con"><strong>Limites :</strong> ${l.inconvenients.join(' · ')}</p>` : ''}
        ${l.erreurs && l.erreurs.length ? `<p class="kt-leaf-err"><strong>Erreurs fréquentes :</strong> ${l.erreurs.join(' · ')}</p>` : ''}
        ${renderTermeRecommendationsRow(l.terme)}
      </div>
    </div>`).join('') || '<p style="padding:12px 4px;color:var(--text-dim);">Aucune notion trouvée.</p>';

  container.querySelectorAll('.kt-leaf-head').forEach(head => {
    head.addEventListener('click', () => head.closest('.kt-leaf-card').classList.toggle('open'));
  });
  items.forEach((l,i) => {
    const conseil = pickConseilMessage(l.niveau, {weakCategory: getWeakCategoryLabel(l.categorie)});
    renderConseilBadge(`ktConseil-${i}`, conseil);
  });
}

function renderKnowledgeTree(){
  const themesEl = document.getElementById('ktThemes');
  const leavesEl = document.getElementById('ktLeaves');
  const crumbEl = document.getElementById('ktBreadcrumb');
  const query = (document.getElementById('libSearch').value || '').trim().toLowerCase();

  if(query){
    const matches = LIBRARY
      .filter(l => l.terme.toLowerCase().includes(query) || l.simple.toLowerCase().includes(query))
      .sort((a,b) => a.terme.localeCompare(b.terme));
    themesEl.style.display = 'none';
    leavesEl.style.display = '';
    crumbEl.style.display = '';
    crumbEl.innerHTML = `<button class="kt-back-btn" id="ktBack" type="button">← Tous les thèmes</button><span class="kt-crumb-label">Résultats pour « ${query} » (${matches.length})</span>`;
    document.getElementById('ktBack').addEventListener('click', () => { document.getElementById('libSearch').value = ''; renderKnowledgeTree(); });
    renderLeafCards(leavesEl, matches);
    return;
  }

  if(currentTheme){
    const items = LIBRARY.filter(l => l.categorie === currentTheme).sort((a,b) => a.terme.localeCompare(b.terme));
    themesEl.style.display = 'none';
    leavesEl.style.display = '';
    crumbEl.style.display = '';
    crumbEl.innerHTML = `<button class="kt-back-btn" id="ktBack" type="button">← Tous les thèmes</button><span class="kt-crumb-label">${currentTheme} · ${items.length} notion${items.length>1?'s':''}</span>`;
    document.getElementById('ktBack').addEventListener('click', () => { currentTheme = null; renderKnowledgeTree(); });
    renderLeafCards(leavesEl, items);
    return;
  }

  crumbEl.style.display = 'none';
  leavesEl.style.display = 'none';
  themesEl.style.display = '';
  const counts = themeCounts();
  const cats = Object.keys(counts).sort((a,b) => a.localeCompare(b));
  themesEl.innerHTML = cats.map(cat => `
    <button class="kt-theme-card" data-theme="${cat}" type="button">
      <span class="kt-leaf-icon">${ICONS.sprout}</span>
      <h3>${cat}</h3>
      <span class="kt-theme-count">${counts[cat]} notion${counts[cat]>1?'s':''}</span>
    </button>`).join('');
  themesEl.querySelectorAll('.kt-theme-card').forEach(btn => {
    btn.addEventListener('click', () => { currentTheme = btn.dataset.theme; renderKnowledgeTree(); });
  });
}

document.querySelectorAll('.mode-toggle .pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-toggle .pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    renderKnowledgeTree();
  });
});
document.getElementById('libSearch').addEventListener('input', renderKnowledgeTree);

renderKnowledgeTree();

// Liens profonds :
//  - bibliotheque.html#theme:NomDuTheme ouvre directement ce thème (ex. depuis Éco).
//  - bibliotheque.html#Terme-Avec-Tirets (recherche globale, notion du jour du
//    tableau de bord) ouvre le bon thème et déplie la notion visée.
if(location.hash){
  const rawHash = decodeURIComponent(location.hash.slice(1));
  if(rawHash.startsWith('theme:')){
    const wantedTheme = rawHash.slice('theme:'.length);
    if(LIBRARY.some(l => l.categorie === wantedTheme)){
      currentTheme = wantedTheme;
      renderKnowledgeTree();
    }
  } else {
    const item = LIBRARY.find(l => l.terme.replace(/\s+/g,'-') === rawHash);
    if(item){
      currentTheme = item.categorie;
      renderKnowledgeTree();
      setTimeout(() => {
        const el = document.getElementById(`leaf-${item.terme.replace(/\s+/g,'-')}`);
        if(el){ el.classList.add('open'); el.scrollIntoView({behavior:'smooth', block:'start'}); }
      }, 50);
    }
  }
}
