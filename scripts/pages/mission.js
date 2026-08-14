const MISSION_LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};

function missionCurrentKey(){
  try { return decodeURIComponent(location.hash.slice(1)); }
  catch(e){ return location.hash.slice(1); }
}

function renderMissionPage(){
  const key = missionCurrentKey();
  const dashAt = key.lastIndexOf('-');
  const level = dashAt > -1 ? key.slice(0, dashAt) : '';
  const index = dashAt > -1 ? parseInt(key.slice(dashAt+1), 10) : NaN;
  const mods = COURSES[level] || [];
  const mission = mods[index];

  const crumb = document.getElementById('crumbTitre');
  const titleEl = document.getElementById('missionTitle');
  const metaEl = document.getElementById('missionMeta');

  if(!mission){
    if(crumb) crumb.textContent = 'Mission introuvable';
    if(titleEl) titleEl.textContent = 'Mission introuvable';
    if(metaEl) metaEl.textContent = '';
    renderMissionDetail('missionDetail', level, index);
    return;
  }

  document.title = `${mission.title} · Likanza Academy`;
  if(crumb) crumb.textContent = mission.title;
  if(titleEl) titleEl.textContent = mission.title;
  if(metaEl) metaEl.textContent = `Niveau ${MISSION_LEVEL_LABELS[level] || level} · Mission ${String(index+1).padStart(2,'0')}`;

  renderMissionDetail('missionDetail', level, index, () => {
    const banner = document.getElementById('missionLevelDone');
    if(banner) banner.style.display = '';
  });
}

safeRun('page mission', renderMissionPage);
window.addEventListener('hashchange', () => safeRun('page mission (navigation)', renderMissionPage));
