const avenirForm = document.getElementById('avenirForm');
if(avenirForm) avenirForm.addEventListener('submit', e=>{
  e.preventDefault();
  const email = document.getElementById('avenirEmail').value.trim();
  const list = safeGetJSON('likanza-avenir-emails', []);
  if(email && !list.includes(email)) list.push(email);
  safeSetJSON('likanza-avenir-emails', list);
  const msgEl = document.getElementById('avenirMsg');
  if(msgEl) msgEl.textContent = "Enregistré sur cet appareil. Démonstration locale : aucun e-mail n'est réellement envoyé pour l'instant.";
  avenirForm.reset();
});
