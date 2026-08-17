/* ============================================================
   LIKANZA ACADEMY — Mon parcours
   Chemin visuel du parcours "Maîtriser ses finances personnelles"
   (6 niveaux). Verrouillé tant que le test de positionnement n'a
   pas été fait — le contenu lui-même (missions, bibliothèque,
   simulateurs) reste accessible partout ailleurs sans ce test.
   ============================================================ */

const PARCOURS_PRINCIPAL = [
  {
    titre:"Comprendre sa situation", difficulte:"Débutant", duree:"~25 min", lecons:4,
    competence:"Faire le point sur son budget",
    notions:["Revenus","Charges fixes","Dépenses variables","Reste à vivre","Patrimoine","Dettes"],
    lien:"laboratoire.html", statut:"disponible",
    note:"Regroupe le simulateur de budget (Simulateurs) et la mission \"Construire son premier plan financier\"."
  },
  {
    titre:"Construire un budget", difficulte:"Débutant", duree:"~20 min", lecons:3,
    competence:"Construire un budget réaliste",
    notions:["Catégories de dépenses","Méthode 50/30/20","Suivi","Réduire les dépenses inutiles"],
    lien:"laboratoire.html", statut:"disponible",
    note:"Le simulateur de budget (Simulateurs) couvre déjà cette base."
  },
  {
    titre:"Sécuriser ses finances", difficulte:"Débutant", duree:"~20 min", lecons:3,
    competence:"Définir une épargne de précaution",
    notions:["Fonds d'urgence","Montant recommandé","Liquidité","Prévention du découvert"],
    lien:"formations.html", statut:"disponible",
    note:"Couvert par la mission débutant \"Construire son premier plan financier\"."
  },
  {
    titre:"Comprendre la banque et le crédit", difficulte:"Intermédiaire", duree:"~25 min", lecons:4,
    competence:"Comparer deux crédits",
    notions:["Taux","TAEG","Mensualité","Coût total","Endettement"],
    lien:"immobilier.html", statut:"disponible",
    note:"Le calculateur de crédit (Immobilier) et la mission intermédiaire sur les taux couvrent l'essentiel."
  },
  {
    titre:"Faire travailler son argent", difficulte:"Intermédiaire", duree:"~30 min", lecons:5,
    competence:"Comprendre les intérêts composés et le risque",
    notions:["Inflation","Intérêts composés","Risque","Rendement","Diversification"],
    lien:"laboratoire.html", statut:"disponible",
    note:"Le simulateur d'intérêts composés (Outils) et plusieurs missions débutant/intermédiaire couvrent cette base."
  },
  {
    titre:"Construire son plan financier", difficulte:"Avancé", duree:"À venir", lecons:0,
    competence:"Formaliser un plan sur 12 mois",
    notions:["Objectifs SMART","Priorités","Calendrier","Automatisation","Bilan annuel"],
    lien:null, statut:"a_venir",
    note:"Projet final du parcours : en cours de rédaction, pas encore disponible."
  }
];

function renderParcoursConseil(result){
  const weakest = Object.values(result.categoryScores || {}).sort((a,b)=>a.pct-b.pct)[0];
  if(weakest && weakest.pct < 60){
    renderConseilBadge('parcoursConseil', {text:`Priorise d'abord les niveaux liés à "${weakest.label}" (${weakest.pct}% au test) : c'est là que tu progresseras le plus vite.`, tone:'warn'});
  } else {
    renderConseilBadge('parcoursConseil', {text:"Bon niveau général au test : suis le parcours dans l'ordre ou pioche directement dans les niveaux qui t'intéressent.", tone:'good'});
  }
}

function renderParcoursPath(){
  const progress = safeGetJSON('fzr-progress', {});
  const el = document.getElementById('parcoursPath');
  el.innerHTML = PARCOURS_PRINCIPAL.map((m,i)=>{
    const isAvailable = m.statut === 'disponible';
    const badge = isAvailable
      ? `<span class="badge status-reel">Contenu disponible</span>`
      : `<span class="badge status-demo">Rédaction en cours</span>`;
    return `
    <div class="parcours-step ${isAvailable ? '' : 'is-upcoming'}">
      <div class="parcours-step-idx">${i+1}</div>
      <div class="parcours-step-body">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
          <h3 style="font-size:17px;">${m.titre}</h3>
          ${badge}
        </div>
        <p style="font-size:11.5px;color:var(--text-dim);margin:4px 0 6px;">${m.difficulte} · ${m.duree}${m.lecons ? ' · ' + m.lecons + ' leçons' : ''} · compétence : ${m.competence}</p>
        <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:10px;">${m.notions.join(' · ')}</p>
        ${isAvailable ? `<a href="${m.lien}" class="btn btn-sm btn-gold">Ouvrir ce niveau</a>` : `<button class="btn btn-sm" disabled>Bientôt disponible</button>`}
      </div>
    </div>`;
  }).join('');
}

function initParcours(){
  const result = getPositioningResult();
  if(!result){
    document.getElementById('parcoursLocked').style.display = 'block';
    return;
  }
  document.getElementById('parcoursUnlocked').style.display = 'block';
  const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
  document.getElementById('parcoursMeta').textContent = `Niveau estimé : ${LEVEL_LABELS[result.level] || result.level} · ${result.overallPct}% au test`;
  renderParcoursConseil(result);
  renderParcoursPath();
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

initParcours();
renderMistakesSection();
renderDailyMissions('dailyMissions');
renderWeeklyMissions('weeklyMissions');
