/* ============================================================
   LIKANZA ACADEMY — Construis ton projet
   Parcours guidé de 20 questions pour structurer une réflexion
   entrepreneuriale. N'invente jamais "l'idée parfaite" : chaque champ
   vient exclusivement de ce que l'utilisateur écrit lui-même. Le seul
   calcul (étape 15) réutilise une formule réelle et standard (seuil
   de rentabilité), appliquée aux chiffres saisis par l'utilisateur —
   jamais une performance ou un résultat inventé.
   Stocké séparément du profil (fzr-business-project) : ceci est un
   artefact de réflexion sur un projet, pas une donnée d'identité ou
   de niveau de l'utilisateur.
   ============================================================ */

const PROJECT_STEPS = [
  {key:'interets', title:'Tes intérêts', category:'Point de départ',
    fields:[{key:'interets', type:'textarea', placeholder:"Ex : la cuisine, le sport, la technologie, aider les autres..."}],
    prompt:"Quels sujets ou secteurs t'intéressent vraiment ? Un projet tient plus longtemps quand il part de quelque chose qui t'intéresse réellement."},
  {key:'competences', title:'Tes compétences', category:'Point de départ',
    fields:[{key:'competences', type:'textarea', placeholder:"Ex : organiser, expliquer, bricoler, vendre, écrire..."}],
    prompt:"Dans quoi es-tu déjà bon(ne), ou en train de progresser ? Une compétence ne doit pas forcément être professionnelle."},
  {key:'probleme', title:'Un problème que tu sais résoudre', category:'Le problème',
    fields:[{key:'probleme', type:'textarea', placeholder:"Ex : trouver du temps pour cuisiner sainement..."}],
    prompt:"Quel problème connais-tu bien, que d'autres personnes rencontrent aussi ? Le meilleur point de départ est souvent un problème que tu as toi-même vécu."},
  {key:'clientType', title:'Type de clients', category:'Le client',
    fields:[
      {key:'clientType', type:'radio', options:[{value:'b2c', label:'Des particuliers (B2C)'},{value:'b2b', label:'Des entreprises (B2B)'},{value:'both', label:'Les deux'}]},
      {key:'clientDetail', type:'textarea', placeholder:"Ex : des parents qui travaillent à temps plein..."}
    ],
    prompt:"À qui ce problème s'adresse-t-il en priorité, et peux-tu le décrire plus précisément ?",
    hint:'Persona'},
  {key:'marche', title:'Marché potentiel', category:'Le marché',
    fields:[{key:'marche', type:'textarea', placeholder:"Une estimation approximative suffit."}],
    prompt:"Combien de personnes ou d'entreprises pourraient être concernées, à ta connaissance ?",
    hint:'Marché adressable (TAM/SAM/SOM)'},
  {key:'concurrence', title:'Concurrence', category:'Le marché',
    fields:[{key:'concurrence', type:'textarea', placeholder:"..."}],
    prompt:"Qui résout déjà ce problème aujourd'hui, même partiellement ? Une absence totale de concurrence est rare, et souvent un signal d'alerte plutôt qu'un avantage."},
  {key:'valeur', title:'Proposition de valeur', category:"L'offre",
    fields:[{key:'valeur', type:'textarea', placeholder:"..."}],
    prompt:"Pourquoi un client choisirait ta solution plutôt qu'une autre, ou plutôt que rien du tout ?",
    hint:'Proposition de valeur'},
  {key:'offre', title:'Ton offre', category:"L'offre",
    fields:[{key:'offre', type:'textarea', placeholder:"..."}],
    prompt:"Concrètement, qu'est-ce que tu vends ? Un produit, un service, un abonnement ?"},
  {key:'businessModel', title:'Business model', category:"L'offre",
    fields:[{key:'businessModel', type:'select', options:[
      {value:'unite', label:"Vente à l'unité"},
      {value:'abonnement', label:'Abonnement récurrent'},
      {value:'commission', label:'Commission sur transaction'},
      {value:'publicite', label:'Publicité'},
      {value:'autre', label:'Autre / modèle mixte'}
    ]}],
    prompt:"Comment ton offre génère-t-elle des revenus ?",
    hint:'Modèle économique'},
  {key:'prix', title:'Prix', category:'Les chiffres',
    fields:[{key:'prix', type:'number', placeholder:'Ex : 25', suffix:'€'}],
    prompt:"À quel prix envisages-tu de vendre (par vente, ou par mois pour un abonnement) ?",
    hint:'Pricing'},
  {key:'acquisition', title:'Acquisition', category:'Marketing',
    fields:[{key:'acquisition', type:'textarea', placeholder:"..."}],
    prompt:"Comment tes premiers clients pourraient-ils te découvrir ?",
    hint:'Acquisition'},
  {key:'marketing', title:'Marketing', category:'Marketing',
    fields:[{key:'marketing', type:'textarea', placeholder:"..."}],
    prompt:"Comment comptes-tu communiquer sur ton offre ?",
    hint:'Branding'},
  {key:'couts', title:'Coûts', category:'Les chiffres',
    fields:[
      {key:'chargesFixes', type:'number', label:'Charges fixes mensuelles', placeholder:'Ex : 150', suffix:'€/mois'},
      {key:'coutVariable', type:'number', label:'Coût variable par vente', placeholder:'Ex : 5 (0 si aucun)', suffix:'€'}
    ],
    prompt:"Quelles charges devras-tu payer chaque mois, que tu vendes ou non (outils, abonnements, local...) ? Et combien te coûte chaque vente supplémentaire ?"},
  {key:'revenus', title:'Revenus visés', category:'Les chiffres',
    fields:[{key:'ventesVisees', type:'number', label:'Ventes visées par mois', placeholder:'Ex : 20'}],
    prompt:"Combien de ventes par mois vises-tu au démarrage ?"},
  {key:'seuil', title:'Seuil de rentabilité simplifié', category:'Les chiffres', type:'computed',
    prompt:"À partir de tes propres chiffres (prix, coût variable, charges fixes), calcul du nombre de ventes mensuelles nécessaires pour atteindre le seuil de rentabilité.",
    hint:'Seuil de rentabilité'},
  {key:'risques', title:'Risques', category:'Prendre du recul',
    fields:[{key:'risques', type:'textarea', placeholder:"..."}],
    prompt:"Qu'est-ce qui pourrait faire échouer ce projet ? Les identifier tôt permet de s'y préparer, pas de s'en inquiéter inutilement."},
  {key:'testIdee', title:"Test de l'idée", category:'Prendre du recul',
    fields:[{key:'testIdee', type:'textarea', placeholder:"..."}],
    prompt:"Comment pourrais-tu tester cette idée avant d'investir beaucoup de temps ou d'argent ?",
    hint:'MVP'},
  {key:'premiersClients', title:'Premiers clients', category:'Prendre du recul',
    fields:[{key:'premiersClients', type:'textarea', placeholder:"..."}],
    prompt:"Qui pourraient être tes 3 premiers clients réels, même à petite échelle ?"},
  {key:'synthese', title:'Ta synthèse', category:'Bilan', type:'summary',
    prompt:"Relis l'ensemble de tes réponses avant la fiche finale."},
  {key:'businessplan', title:'Ta fiche projet', category:'Bilan', type:'final',
    prompt:""}
];

const BUSINESS_MODEL_LABELS = {unite:"Vente à l'unité", abonnement:'Abonnement récurrent', commission:'Commission sur transaction', publicite:'Publicité', autre:'Autre / modèle mixte'};
const CLIENT_TYPE_LABELS = {b2c:'Particuliers (B2C)', b2b:'Entreprises (B2B)', both:'Particuliers et entreprises'};

let stepIndex = 0;
let answers = safeGetJSON('fzr-business-project', {});

function saveAnswers(){ safeSetJSON('fzr-business-project', answers); }

function collectCurrentFields(){
  const step = PROJECT_STEPS[stepIndex];
  if(!step.fields) return;
  step.fields.forEach(f=>{
    if(f.type === 'radio'){
      const checked = document.querySelector(`input[name="field-${f.key}"]:checked`);
      answers[f.key] = checked ? checked.value : '';
    } else {
      const el = document.getElementById('field-'+f.key);
      if(el) answers[f.key] = el.value;
    }
  });
  saveAnswers();
}

function renderHint(hintTerme){
  const hintEl = document.getElementById('wizardStepHint');
  if(!hintTerme){ hintEl.innerHTML = ''; return; }
  const item = LIBRARY.find(l=>l.terme===hintTerme);
  if(!item){ hintEl.innerHTML = ''; return; }
  hintEl.innerHTML = `<p style="font-size:12px;color:var(--text-dim);border-left:2px solid var(--hairline);padding-left:10px;">${item.simple} <a href="bibliotheque.html#${encodeURIComponent(item.terme.replace(/\s+/g,'-'))}" style="color:var(--gold-bright);">En savoir plus →</a></p>`;
}

function renderFieldsHtml(step){
  return step.fields.map(f=>{
    const value = escapeHtml(answers[f.key] ?? '');
    const label = f.label ? `<label style="font-size:12.5px;color:var(--text-dim);display:block;margin-bottom:4px;">${f.label}</label>` : '';
    if(f.type === 'textarea'){
      return `<div class="field" style="margin-bottom:12px;">${label}<textarea id="field-${f.key}" rows="3" placeholder="${f.placeholder||''}" style="width:100%;background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:10px;border-radius:2px;font-family:inherit;font-size:13.5px;resize:vertical;">${value}</textarea></div>`;
    }
    if(f.type === 'number'){
      return `<div class="field" style="margin-bottom:12px;">${label}<div style="display:flex;align-items:center;gap:8px;"><input type="number" id="field-${f.key}" value="${value}" placeholder="${f.placeholder||''}" style="flex:1;"> ${f.suffix ? `<span style="color:var(--text-dim);font-size:12.5px;">${f.suffix}</span>` : ''}</div></div>`;
    }
    if(f.type === 'select'){
      return `<div class="field" style="margin-bottom:12px;">${label}<select id="field-${f.key}">${f.options.map(o=>`<option value="${o.value}" ${value===o.value?'selected':''}>${o.label}</option>`).join('')}</select></div>`;
    }
    if(f.type === 'radio'){
      return `<div class="field" style="margin-bottom:12px;display:flex;flex-direction:column;gap:8px;">${f.options.map(o=>`
        <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
          <input type="radio" name="field-${f.key}" value="${o.value}" ${value===o.value?'checked':''} style="width:16px;height:16px;flex-shrink:0;">
          <span>${o.label}</span>
        </label>`).join('')}</div>`;
    }
    return '';
  }).join('');
}

function computeSeuil(a){
  a = a || answers;
  const prix = Number(a.prix) || 0;
  const coutVariable = Number(a.coutVariable) || 0;
  const chargesFixes = Number(a.chargesFixes) || 0;
  const ventesVisees = Number(a.ventesVisees) || 0;
  const margeUnitaire = prix - coutVariable;
  if(margeUnitaire <= 0 || chargesFixes <= 0){
    return {valid:false, margeUnitaire, prix, coutVariable, chargesFixes, ventesVisees};
  }
  const seuilVentes = Math.ceil(chargesFixes / margeUnitaire);
  return {valid:true, seuilVentes, margeUnitaire, prix, coutVariable, chargesFixes, ventesVisees};
}

function renderComputedStep(){
  const el = document.getElementById('wizardStepFields');
  const r = computeSeuil();
  if(!r.valid){
    el.innerHTML = `<p class="disclaimer-box">Impossible de calculer un seuil de rentabilité avec ces chiffres : ${r.margeUnitaire <= 0 ? "le prix doit être supérieur au coût variable par vente" : "indique des charges fixes mensuelles supérieures à 0"} (étapes précédentes). Tu peux revenir en arrière pour ajuster tes chiffres, ou continuer et y revenir plus tard.</p>`;
    return;
  }
  el.innerHTML = `
    <div class="result-label">Ventes mensuelles nécessaires pour atteindre le seuil</div>
    <div class="result-big">${r.seuilVentes}</div>
    <p style="font-size:13px;color:var(--text-dim);margin-top:10px;">Avec un prix de ${fmtEUR(r.prix)}, un coût variable de ${fmtEUR(r.coutVariable)} par vente et ${fmtEUR(r.chargesFixes)} de charges fixes mensuelles, il te faudrait environ <strong style="color:var(--gold-bright);">${r.seuilVentes} vente${r.seuilVentes>1?'s':''} par mois</strong> pour couvrir tes charges (marge de ${fmtEUR(r.margeUnitaire)} par vente).</p>
    ${r.ventesVisees > 0 ? `<p style="font-size:13px;margin-top:8px;color:${r.ventesVisees >= r.seuilVentes ? 'var(--emerald)' : 'var(--gold-bright)'};">Tu vises ${r.ventesVisees} vente${r.ventesVisees>1?'s':''}/mois, ${r.ventesVisees >= r.seuilVentes ? 'au-dessus' : 'en-dessous'} de ce seuil calculé.</p>` : ''}
    <p class="disclaimer-box" style="margin-top:12px;">Calcul simplifié à partir de tes propres chiffres, pas une prévision ni un conseil financier. Un vrai seuil de rentabilité intègre aussi la saisonnalité, la trésorerie et d'autres charges non listées ici.</p>`;
  answers.seuilVentesCalcule = r.valid ? r.seuilVentes : null;
  saveAnswers();
}

function fieldSummaryLabel(step){
  return step.title;
}

function renderSummaryStep(){
  const el = document.getElementById('wizardStepFields');
  const rows = PROJECT_STEPS.filter(s=>s.fields).map(step=>{
    const vals = step.fields.map(f=>{
      let v = answers[f.key];
      if(f.type === 'radio' && f.key === 'clientType') v = CLIENT_TYPE_LABELS[v] || v;
      else if(f.key === 'businessModel') v = BUSINESS_MODEL_LABELS[v] || v;
      else if(f.type === 'number' && v) v = fmtEUR(Number(v));
      else if(v) v = escapeHtml(v);
      return v;
    }).filter(Boolean);
    if(!vals.length) return '';
    return `<div style="margin-bottom:10px;"><span style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim);">${fieldSummaryLabel(step)}</span><p style="font-size:13.5px;margin-top:2px;">${vals.join(' · ')}</p></div>`;
  }).join('');
  el.innerHTML = rows || '<p style="color:var(--text-dim);font-size:13px;">Aucune réponse enregistrée pour l\'instant.</p>';
}

function renderFinalStep(a){
  a = a || answers;
  document.getElementById('wizardStep').style.display = 'none';
  const el = document.getElementById('wizardFinal');
  el.style.display = 'block';
  const r = computeSeuil(a);
  const revenuVise = (Number(a.prix)||0) * (Number(a.ventesVisees)||0);
  const esc = escapeHtml;
  const fiche = [
    {label:'Projet', value: esc(a.offre) || '—'},
    {label:'Problème', value: esc(a.probleme) || '—'},
    {label:'Client cible', value: [CLIENT_TYPE_LABELS[a.clientType], esc(a.clientDetail)].filter(Boolean).join(' — ') || '—'},
    {label:'Marché', value: esc(a.marche) || '—'},
    {label:'Proposition de valeur', value: esc(a.valeur) || '—'},
    {label:'Offre', value: esc(a.offre) || '—'},
    {label:'Business model', value: BUSINESS_MODEL_LABELS[a.businessModel] || '—'},
    {label:'Prix', value: a.prix ? fmtEUR(Number(a.prix)) : '—'},
    {label:'Acquisition', value: esc(a.acquisition) || '—'},
    {label:'Marketing', value: esc(a.marketing) || '—'},
    {label:'Coûts principaux', value: (a.chargesFixes || a.coutVariable) ? `${fmtEUR(Number(a.chargesFixes)||0)}/mois fixes, ${fmtEUR(Number(a.coutVariable)||0)} variable par vente` : '—'},
    {label:'Sources de revenus', value: a.ventesVisees ? `${BUSINESS_MODEL_LABELS[a.businessModel]||''} — ${a.ventesVisees} ventes visées/mois, soit environ ${fmtEUR(revenuVise)}/mois` : '—'},
    {label:'Hypothèses à tester', value: esc(a.testIdee) || '—'},
    {label:'Risques', value: esc(a.risques) || '—'},
    {label:'Prochaines actions', value: [esc(a.testIdee), esc(a.premiersClients)].filter(Boolean).join(' · ') || '—'}
  ];
  el.innerHTML = `
    <div class="card" style="max-width:640px;margin:0 auto;">
      <span class="smallcaps">Ta fiche projet</span>
      <h2 class="display" style="font-size:24px;font-weight:600;margin:8px 0 14px;">Synthèse structurée</h2>
      ${fiche.map(f=>`<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--hairline);"><strong style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--gold-bright);">${f.label}</strong><p style="font-size:13.5px;margin-top:4px;">${f.value}</p></div>`).join('')}
      ${r.valid ? `<div style="margin-bottom:12px;"><strong style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--gold-bright);">Seuil de rentabilité simplifié</strong><p style="font-size:13.5px;margin-top:4px;">${r.seuilVentes} ventes/mois environ</p></div>` : ''}
      <p class="disclaimer-box" style="margin-top:16px;">Cette fiche récapitule tes propres réponses. Elle ne garantit aucun succès et ne constitue ni un conseil financier ni un business plan complet — elle t'aide à structurer une réflexion, pas à la remplacer.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
        <button class="btn btn-sm" id="wizardRestartBtn">Recommencer</button>
        <a href="business.html" class="btn btn-sm btn-gold">Retour à Business</a>
      </div>
    </div>`;
  document.getElementById('wizardRestartBtn').addEventListener('click', ()=>{
    if(confirm('Recommencer effacera tes réponses actuelles. Continuer ?')){
      answers = {};
      saveAnswers();
      stepIndex = 0;
      el.style.display = 'none';
      document.getElementById('wizardIntro').style.display = 'block';
    }
  });
  awardXP(15, {businessProjectDone:true});
}

function renderStep(){
  const step = PROJECT_STEPS[stepIndex];
  document.getElementById('wizardStepCounter').textContent = `Étape ${stepIndex+1} / ${PROJECT_STEPS.length}`;
  document.getElementById('wizardStepCategory').textContent = step.category;
  const pct = Math.round((stepIndex/(PROJECT_STEPS.length-1))*100);
  document.getElementById('wizardProgressFill').style.width = pct + '%';
  document.getElementById('wizardStepTitle').textContent = step.title;
  document.getElementById('wizardStepPrompt').textContent = step.prompt;
  document.getElementById('wizardBackBtn').style.visibility = stepIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('wizardNextBtn').textContent = step.type === 'summary' ? 'Voir ma fiche →' : 'Suivant →';

  if(step.type === 'computed'){ renderComputedStep(); renderHint(step.hint); }
  else if(step.type === 'summary'){ renderSummaryStep(); renderHint(null); }
  else { document.getElementById('wizardStepFields').innerHTML = renderFieldsHtml(step); renderHint(step.hint); }
}

document.getElementById('wizardStartBtn').addEventListener('click', ()=>{
  document.getElementById('wizardIntro').style.display = 'none';
  document.getElementById('wizardStep').style.display = 'block';
  renderStep();
});

document.getElementById('wizardBackBtn').addEventListener('click', ()=>{
  if(stepIndex === 0) return;
  collectCurrentFields();
  stepIndex--;
  renderStep();
});

document.getElementById('wizardNextBtn').addEventListener('click', ()=>{
  collectCurrentFields();
  stepIndex++;
  if(stepIndex >= PROJECT_STEPS.length - 1 && PROJECT_STEPS[stepIndex] && PROJECT_STEPS[stepIndex].type === 'final'){
    renderFinalStep();
    return;
  }
  renderStep();
});
