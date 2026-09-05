/* ============================================================
   LIKANZA ACADEMY — Guides & Décryptages : landing
   Filtrage catégorie + recherche sur l'index léger GUIDES uniquement
   (aucun contenu de guide chargé ici) — même mécanique que la
   recherche de bibliotheque.html (filter + re-render), jamais un
   nouveau moteur de recherche.
   ============================================================ */
document.getElementById('guidesCount').textContent = GUIDES.length + (GUIDES.length > 1 ? ' guides' : ' guide');

const pillsEl = document.getElementById('guidesCategoryPills');
pillsEl.insertAdjacentHTML('beforeend', GUIDE_CATEGORIES.map(c =>
  `<button class="pill" data-category="${c.key}">${c.label}</button>`).join(''));

let guidesActiveCategory = 'all';

function refreshGuidesGrid(){
  const query = (document.getElementById('guidesSearch').value || '').trim().toLowerCase();
  let list = guidesActiveCategory === 'all' ? GUIDES : getGuidesByCategory(guidesActiveCategory);
  if(query){
    list = list.filter(g =>
      g.question.toLowerCase().includes(query) ||
      g.title.toLowerCase().includes(query) ||
      g.shortAnswer.toLowerCase().includes(query));
  }
  renderGuidesGrid('guidesGrid', list);
}

pillsEl.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    pillsEl.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    guidesActiveCategory = btn.dataset.category;
    refreshGuidesGrid();
  });
});
document.getElementById('guidesSearch').addEventListener('input', refreshGuidesGrid);

refreshGuidesGrid();
