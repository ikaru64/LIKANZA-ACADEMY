function renderRevisionsCount(){
  const el = document.getElementById('revisionsCount');
  if(!el) return;
  const count = getMistakes().filter(m=>!m.resolved).length;
  el.textContent = count === 0 ? 'tout est à jour' : `${count} notion${count>1?'s':''} en attente`;
}

function renderSpacedReviewCount(){
  const el = document.getElementById('spacedReviewCount');
  if(!el) return;
  const count = getDueSpacedReviews().length;
  el.textContent = count === 0 ? 'rien à repasser' : `${count} notion${count>1?'s':''} à repasser`;
}

renderRevisionsCount();
renderRevisionsList('revisionsList');
renderSpacedReviewCount();
renderSpacedReviewList('spacedReviewList');
renderMasteryList('masteryList');
