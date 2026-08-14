function coursCurrentId(){
  try { return decodeURIComponent(location.hash.slice(1)); }
  catch(e){ return location.hash.slice(1); }
}

function renderCoursPage(){
  const id = coursCurrentId();
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
  });
}

safeRun('page cours', renderCoursPage);
window.addEventListener('hashchange', () => safeRun('page cours (navigation)', renderCoursPage));
