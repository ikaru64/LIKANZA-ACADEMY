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
    lien:"finances-personnelles.html", statut:"disponible",
    note:"Regroupe le simulateur de budget (Finances personnelles) et la mission \"Construire son premier plan financier\"."
  },
  {
    titre:"Construire un budget", difficulte:"Débutant", duree:"~20 min", lecons:3,
    competence:"Construire un budget réaliste",
    notions:["Catégories de dépenses","Méthode 50/30/20","Suivi","Réduire les dépenses inutiles"],
    lien:"finances-personnelles.html", statut:"disponible",
    note:"Le simulateur de budget (Finances personnelles) couvre déjà cette base."
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
    lien:"outils.html", statut:"disponible",
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
  const listEl = document.getElementById('mistakesList');
  if(!section || !listEl) return;
  const allUnresolved = getMistakes()
    .filter(m=>!m.resolved)
    .sort((a,b)=> new Date(a.firstMissedAt) - new Date(b.firstMissedAt));
  if(allUnresolved.length === 0){
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  const shown = allUnresolved.slice(0, 3);
  listEl.innerHTML = shown.map(m => `
    <div class="today-block" style="margin-bottom:10px;">
      <h4>${m.categorie}</h4>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:8px;">${m.question}</p>
      <a href="defis.html?cat=${encodeURIComponent(m.categorie)}" class="today-link">Réviser cette notion →</a>
    </div>`).join('')
    + (allUnresolved.length > shown.length ? `<a href="revisions.html" class="today-link">Voir toutes mes notions à revoir (${allUnresolved.length}) →</a>` : `<a href="revisions.html" class="today-link">Voir le détail →</a>`);
}

initParcours();
if(document.getElementById('coachWidget')) renderCoach('coachWidget');
renderMistakesSection();
