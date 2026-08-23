/* ============================================================
   LIKANZA ACADEMY — Mon parcours
   Tableau de bord personnel par domaine (niveau déclaré vs évalué,
   confiance, quiz approfondis). Jamais verrouillé : le reste du site
   reste accessible sans avoir fait le premier quiz. Mais tant qu'il
   n'est pas fait, cette page elle-même met une seule action en avant
   (le premier quiz) plutôt qu'un tableau de bord vide — et une fois
   fait, une seule recommandation d'évaluation à la fois, jamais les
   6 domaines listés comme une to-do list.
   ============================================================ */

function initParcoursHero(){
  const hasProfile = !!getPositioningResult();
  if(!hasProfile){
    document.getElementById('parcoursGateSection').style.display = 'block';
    renderParcoursGate('parcoursGate');
    return;
  }
  document.getElementById('parcoursMainSection').style.display = 'block';
  renderParcoursProfileSummary('parcoursProfileSummary');
  renderNextStepRecommendation('parcoursNextStep');
  renderFinancialIQDetail('parcoursFinancialIQ');
  renderDomainDashboard('domainDashboard');
}

function renderMistakesSection(){
  const section = document.getElementById('mistakesSection');
  const summaryEl = document.getElementById('mistakesSummary');
  if(!section || !summaryEl) return;
  const allUnresolved = getMistakes().filter(m=>!m.resolved);
  if(allUnresolved.length === 0){
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  const counts = {};
  allUnresolved.forEach(m => { counts[m.categorie] = (counts[m.categorie]||0) + 1; });
  const topCategorie = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  summaryEl.textContent = `${allUnresolved.length} notion${allUnresolved.length>1?'s':''} à revoir, surtout en ${topCategorie}.`;
}

initParcoursHero();
renderMistakesSection();
renderDailyMissions('dailyMissions');
renderWeeklyMissions('weeklyMissions');
