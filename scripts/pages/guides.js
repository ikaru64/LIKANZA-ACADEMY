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

// Recherche par mots, pas par sous-chaîne unique (sprint de consolidation
// 09/09/2026, section 28 du prompt d'origine) : "pea cto" ne matchait jamais
// la vraie question "PEA ou compte-titres (CTO) ?" tant que la recherche
// exigeait "pea cto" comme UNE seule sous-chaîne contiguë — chaque mot du
// texte réel de la question compte maintenant séparément, tous doivent
// apparaître (ET logique), peu importe l'ordre ou la ponctuation entre eux.
function refreshGuidesGrid(){
  const query = (document.getElementById('guidesSearch').value || '').trim().toLowerCase();
  let list = guidesActiveCategory === 'all' ? GUIDES : getGuidesByCategory(guidesActiveCategory);
  if(query){
    const words = query.split(/\s+/).filter(Boolean);
    list = list.filter(g => {
      const haystack = `${g.question} ${g.title} ${g.shortAnswer}`.toLowerCase();
      return words.every(w => haystack.includes(w));
    });
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
