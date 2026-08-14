function renderRevisionsCount(){
  const el = document.getElementById('revisionsCount');
  if(!el) return;
  const count = getMistakes().filter(m=>!m.resolved).length;
  el.textContent = count === 0 ? 'tout est à jour' : `${count} notion${count>1?'s':''} en attente`;
}

renderRevisionsCount();
renderRevisionsList('revisionsList');
renderMasteryList('masteryList');
