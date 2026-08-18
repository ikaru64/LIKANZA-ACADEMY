/* ============================================================
   LIKANZA ACADEMY — Mon parcours
   Tableau de bord personnel par domaine (niveau déclaré vs évalué,
   confiance, quiz approfondis). Jamais verrouillé : accessible sans
   avoir fait le premier quiz, avec des états vides honnêtes par
   domaine tant qu'aucune donnée n'existe.
   ============================================================ */

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

renderDomainDashboard('domainDashboard');
renderMistakesSection();
renderDailyMissions('dailyMissions');
renderWeeklyMissions('weeklyMissions');
