// Adressage par chapitre (réouverture du 30/08/2026 d'une limite du chantier
// Continuité) : cours.html#<coursId>:<chapitre-slug> ouvre directement ce
// chapitre, cours.html#<coursId> seul garde son comportement d'avant (écran
// d'introduction). Le "id" du cours ne contient jamais de ":" -> séparer sur
// la première occurrence est toujours sûr, jamais une confusion possible.
function coursCurrentId(){
  const raw = location.hash.slice(1);
  const colonIdx = raw.indexOf(':');
  const idPart = colonIdx === -1 ? raw : raw.slice(0, colonIdx);
  try { return decodeURIComponent(idPart); }
  catch(e){ return idPart; }
}
function coursCurrentChapterSlug(){
  const raw = location.hash.slice(1);
  const colonIdx = raw.indexOf(':');
  if(colonIdx === -1) return null;
  const slugPart = raw.slice(colonIdx + 1);
  try { return decodeURIComponent(slugPart); }
  catch(e){ return slugPart; }
}

function renderCoursPage(){
  const id = coursCurrentId();
  const chapterSlug = coursCurrentChapterSlug();
  const cours = COURS_CATALOG.find(c=>c.id===id);
  const crumb = document.getElementById('crumbTitre');
  const titleEl = document.getElementById('coursTitle');
  const niveauEl = document.getElementById('coursNiveau');

  if(!cours){
    if(crumb) crumb.textContent = 'Cours introuvable';
    if(titleEl) titleEl.textContent = 'Cours introuvable';
    if(niveauEl) niveauEl.textContent = '';
    renderCoursDetail('coursDetail', id);
    return;
  }

  document.title = `${cours.titre} · Likanza Academy`;
  if(crumb) crumb.textContent = cours.titre;
  if(titleEl) titleEl.textContent = cours.titre;
  if(niveauEl) niveauEl.textContent = cours.niveau;

  renderCoursDetail('coursDetail', cours.id, () => {
    if(titleEl && !titleEl.dataset.marked){ titleEl.innerHTML = ICONS.check + ' ' + titleEl.textContent; titleEl.dataset.marked = '1'; }
  }, chapterSlug);
}

safeRun('page cours', renderCoursPage);
window.addEventListener('hashchange', () => safeRun('page cours (navigation)', renderCoursPage));
