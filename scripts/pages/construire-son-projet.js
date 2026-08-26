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

// Catégories plus larges que les 3 secteurs simulables du Business Game
// (§21 MVP) : l'outil de stratégie reste utile pour tout type de projet,
// seul le passage vers le jeu se limite aux secteurs réellement implémentés.
const PROJECT_SECTOR_OPTIONS = [
  {value:'saas', label: (typeof BUSINESS_SECTORS !== 'undefined' && BUSINESS_SECTORS.saas) ? `${BUSINESS_SECTORS.saas.icon} ${BUSINESS_SECTORS.saas.label}` : 'SaaS (logiciel en abonnement)'},
  {value:'ecommerce', label: (typeof BUSINESS_SECTORS !== 'undefined' && BUSINESS_SECTORS.ecommerce) ? `${BUSINESS_SECTORS.ecommerce.icon} ${BUSINESS_SECTORS.ecommerce.label}` : 'E-commerce'},
  {value:'app', label:'📱 Application mobile'},
  {value:'marketplace', label:'🔀 Marketplace'},
  {value:'agence', label:'🧩 Agence / service professionnel'},
  {value:'restaurant', label: (typeof BUSINESS_SECTORS !== 'undefined' && BUSINESS_SECTORS.restaurant) ? `${BUSINESS_SECTORS.restaurant.icon} ${BUSINESS_SECTORS.restaurant.label}` : 'Restaurant'},
  {value:'media', label:'📰 Média / contenu'},
  {value:'createur', label:'🎨 Activité de créateur / créatrice'},
  {value:'immobilier', label:'🏠 Immobilier'},
  {value:'service-local', label:'🧰 Service local'},
  {value:'autre', label:'✳️ Autre'}
];
const PROJECT_SECTOR_LABELS = Object.fromEntries(PROJECT_SECTOR_OPTIONS.map(o=>[o.value, o.label]));
// Seuls ces 3 secteurs sont aujourd'hui simulables dans le Business Game (§21 MVP).
const PROJECT_SECTOR_TO_GAME_KEY = {saas:'saas', ecommerce:'ecommerce', restaurant:'restaurant'};

const DIAGNOSTIC_STATUS_META = {
  vert:   {emoji:'🟢', label:'Complet'},
  jaune:  {emoji:'🟡', label:'À surveiller'},
  orange: {emoji:'🟠', label:'À approfondir'},
  rouge:  {emoji:'🔴', label:'Manquant'}
};

function wordCount(str){ return (str || '').trim().split(/\s+/).filter(Boolean).length; }

// Diagnostic basé uniquement sur la présence et la précision des réponses
// réellement saisies par l'utilisateur — jamais un jugement inventé (§4).
function computeDiagnostic(a){
  a = a || {};
  const zones = [];

  const wProbleme = wordCount(a.probleme), wMarche = wordCount(a.marche), wConcurrence = wordCount(a.concurrence);
  if(wProbleme >= 8 && wMarche >= 5 && wConcurrence >= 5){
    zones.push({key:'probleme', label:'Problème & marché', status:'vert', justification:`Le problème (${wProbleme} mots), le marché (${wMarche} mots) et la concurrence (${wConcurrence} mots) sont tous les trois décrits avec un niveau de détail correct.`});
  } else if(wProbleme >= 3 && (wMarche >= 1 || wConcurrence >= 1)){
    zones.push({key:'probleme', label:'Problème & marché', status:'orange', justification:`Le problème est décrit, mais le marché (${wMarche} mots) ou la concurrence (${wConcurrence} mots) restent peu détaillés — creuse ces deux points.`});
  } else {
    zones.push({key:'probleme', label:'Problème & marché', status:'rouge', justification:"Le problème, le marché et la concurrence ne sont pas encore assez renseignés pour évaluer cette zone."});
  }

  const wClientDetail = wordCount(a.clientDetail);
  if(a.clientType && wClientDetail >= 6){
    zones.push({key:'client', label:'Client cible', status:'vert', justification:`Le type de client est choisi et décrit précisément (${wClientDetail} mots).`});
  } else if(a.clientType && wClientDetail >= 1){
    zones.push({key:'client', label:'Client cible', status:'orange', justification:`Le type de client est choisi, mais sa description reste courte (${wClientDetail} mot${wClientDetail>1?'s':''}) — précise qui est vraiment ce client.`});
  } else {
    zones.push({key:'client', label:'Client cible', status:'rouge', justification:"Le client cible n'est pas encore renseigné."});
  }

  const wValeur = wordCount(a.valeur), wOffre = wordCount(a.offre);
  if(wValeur >= 6 && wOffre >= 3 && a.businessModel){
    zones.push({key:'offre', label:'Offre & business model', status:'vert', justification:`La proposition de valeur (${wValeur} mots), l'offre (${wOffre} mots) et le business model sont tous renseignés.`});
  } else if(wValeur >= 1 || wOffre >= 1){
    zones.push({key:'offre', label:'Offre & business model', status:'orange', justification:"La proposition de valeur ou l'offre sont amorcées, mais incomplètes ou sans business model choisi."});
  } else {
    zones.push({key:'offre', label:'Offre & business model', status:'rouge', justification:"La proposition de valeur, l'offre et le business model ne sont pas encore renseignés."});
  }

  const r = computeSeuil(a);
  const ventesVisees = Number(a.ventesVisees) || 0;
  if(!r.valid){
    zones.push({key:'chiffres', label:'Chiffres (seuil de rentabilité)', status:'rouge', justification: r.margeUnitaire <= 0 ? "Le prix indiqué n'est pas supérieur au coût variable par vente : impossible de calculer un seuil de rentabilité." : "Aucune charge fixe mensuelle n'a été indiquée : impossible de calculer un seuil de rentabilité."});
  } else if(ventesVisees >= r.seuilVentes){
    zones.push({key:'chiffres', label:'Chiffres (seuil de rentabilité)', status:'vert', justification:`Ton objectif de ${ventesVisees} ventes/mois est au-dessus du seuil de rentabilité calculé (${r.seuilVentes} ventes/mois).`});
  } else if(ventesVisees > 0){
    zones.push({key:'chiffres', label:'Chiffres (seuil de rentabilité)', status:'jaune', justification:`Ton objectif de ${ventesVisees} ventes/mois est en dessous du seuil de rentabilité calculé (${r.seuilVentes} ventes/mois) — à surveiller de près au démarrage.`});
  } else {
    zones.push({key:'chiffres', label:'Chiffres (seuil de rentabilité)', status:'orange', justification:`Le seuil de rentabilité est calculable (${r.seuilVentes} ventes/mois), mais tu n'as pas encore indiqué d'objectif de ventes visées.`});
  }

  const wTest = wordCount(a.testIdee), wRisques = wordCount(a.risques), wClients = wordCount(a.premiersClients);
  if(wTest >= 5 && wRisques >= 5 && wClients >= 3){
    zones.push({key:'validation', label:'Validation & risques', status:'vert', justification:"Le test de l'idée, les risques et les premiers clients envisagés sont tous décrits."});
  } else if(wTest >= 1 || wRisques >= 1 || wClients >= 1){
    zones.push({key:'validation', label:'Validation & risques', status:'orange', justification:"Une partie de la validation (test, risques ou premiers clients) est amorcée, mais incomplète."});
  } else {
    zones.push({key:'validation', label:'Validation & risques', status:'rouge', justification:"Le test de l'idée, les risques et les premiers clients ne sont pas encore renseignés."});
  }

  return zones;
}

// 3 stratégies génériques (prudente/croissance/niche), chacune justifiée par
// de vraies réponses saisies — jamais une affirmation qu'une stratégie est
// objectivement meilleure sans préciser sous quelles conditions (§4).
function computeStrategies(a){
  a = a || {};
  const budget = Number(a.budgetInitial) || 0;
  const r = computeSeuil(a);
  const ventesVisees = Number(a.ventesVisees) || 0;
  const wConcurrence = wordCount(a.concurrence);
  const wClientDetail = wordCount(a.clientDetail);
  const budgetLabel = budget > 0 ? fmtEUR(budget) : 'non renseigné';

  return [
    {
      id: 'prudente', label: 'Prudente',
      objectif: "Minimiser le risque : viser la rentabilité rapide plutôt que la croissance rapide.",
      avantages: ["Moins de capital nécessaire pour démarrer.", "Permet de valider le modèle avant d'investir davantage."],
      risques: ["Croissance plus lente.", "Risque de laisser une opportunité à la concurrence."],
      recommandeeSi: `un capital initial limité (ici ${budgetLabel}) et/ou un objectif de ventes proche du seuil de rentabilité calculé`,
      recommandee: (budget > 0 && budget < 5000) || (r.valid && ventesVisees > 0 && ventesVisees < r.seuilVentes * 1.3)
    },
    {
      id: 'croissance', label: 'Croissance',
      objectif: "Investir davantage en acquisition et marketing pour croître vite, quitte à retarder la rentabilité.",
      avantages: ["Prendre position sur le marché avant la concurrence.", "Peut justifier une levée de fonds si le modèle fonctionne."],
      risques: ["Dépenses plus élevées avant d'être rentable.", "Dépend d'un accès à du financement si la trésorerie se tend."],
      recommandeeSi: `un capital initial confortable (ici ${budgetLabel}, seuil indicatif : 5 000€)`,
      recommandee: budget >= 5000
    },
    {
      id: 'niche', label: 'Niche',
      objectif: "Se concentrer sur un segment de clientèle précis plutôt que sur le marché large.",
      avantages: ["Moins de concurrence directe sur un segment précis.", "Message marketing plus simple à cibler."],
      risques: ["Marché adressable plus restreint.", "Croissance plafonnée sans élargissement futur du ciblage."],
      recommandeeSi: `une concurrence déjà présente sur le marché large (ici décrite en ${wConcurrence} mots) et/ou un client cible décrit précisément (${wClientDetail} mots)`,
      recommandee: wConcurrence >= 8 || wClientDetail >= 12
    }
  ];
}

const PROJECT_STEPS = [
  {key:'secteur', title:'Catégorie de projet', category:'Point de départ',
    fields:[{key:'secteur', type:'select', options: PROJECT_SECTOR_OPTIONS}],
    prompt:"Dans quelle catégorie se situe ton projet ? Cela oriente le diagnostic et permet, pour certains secteurs, de tester ta stratégie ensuite dans le Business Game."},
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
      {key:'clientDetail', type:'textarea', placeholder:"Ex : des parents qui travaillent à temps plein..."},
      {key:'roleUtilisateur', type:'text', label:"Qui utilise vraiment le produit/service au quotidien ?", placeholder:"Ex : l'employé qui s'en sert tous les jours (souvent = le client en B2C)"},
      {key:'roleDecideur', type:'text', label:"Qui décide de l'achat ?", placeholder:"Ex : le/la responsable achats, un parent, un manager"},
      {key:'rolePayeur', type:'text', label:"Qui paie, concrètement ?", placeholder:"Ex : l'entreprise elle-même, ou la même personne que l'utilisateur"}
    ],
    prompt:"À qui ce problème s'adresse-t-il en priorité, et peux-tu le décrire plus précisément ? En B2C, utilisateur/décideur/payeur sont souvent la même personne — en B2B, ils peuvent être trois personnes différentes, et l'ignorer est une erreur fréquente.",
    hint:'Persona'},
  {key:'marche', title:'Marché potentiel', category:'Le marché',
    fields:[{key:'marche', type:'textarea', placeholder:"Une estimation approximative suffit."}],
    prompt:"Combien de personnes ou d'entreprises pourraient être concernées, à ta connaissance ?",
    hint:'Marché adressable (TAM/SAM/SOM)'},
  {key:'concurrence', title:'Concurrence', category:'Le marché',
    fields:[{key:'concurrence', type:'textarea', placeholder:"..."}],
    prompt:"Qui résout déjà ce problème aujourd'hui, même partiellement ? Une absence totale de concurrence est rare, et souvent un signal d'alerte plutôt qu'un avantage."},
  {key:'concurrentsListe', title:'Concurrents identifiés', category:'Le marché', type:'concurrents',
    prompt:"Optionnel mais utile : détaille 1 à 3 concurrents réels (ou solutions de contournement, comme « ne rien faire » ou « le faire soi-même ») pour préciser en quoi tu es vraiment différent.",
    hint:'Avantage concurrentiel'},
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
  {key:'capital', title:'Capital initial', category:'Les chiffres',
    fields:[{key:'budgetInitial', type:'number', placeholder:'Ex : 3000 (0 si aucun)', suffix:'€'}],
    prompt:"De combien de capital disposes-tu pour démarrer (économies, prêt, aide) ? Indique 0 si tu n'en as pas encore."},
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
  {key:'diagnostic', title:'Diagnostic de ton projet', category:'Bilan', type:'diagnostic',
    prompt:"Un diagnostic basé uniquement sur ce que tu as répondu jusqu'ici — jamais un jugement inventé."},
  {key:'strategie', title:'Choisis une stratégie', category:'Bilan', type:'strategie',
    prompt:"Plusieurs stratégies sont possibles à partir de tes réponses. Aucune n'est objectivement meilleure dans l'absolu."},
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
  if(step.type === 'strategie'){
    const checked = document.querySelector('input[name="field-strategieChoisie"]:checked');
    answers.strategieChoisie = checked ? checked.value : (answers.strategieChoisie || '');
    saveAnswers();
    return;
  }
  if(step.type === 'concurrents'){
    collectConcurrentsRows();
    // Ne garde que les lignes où au moins un champ a été rempli — une étape
    // facultative laissée vide ne doit pas polluer la fiche finale.
    answers.concurrentsListe = (answers.concurrentsListe || []).filter(r => Object.values(r).some(v => (v||'').trim()));
    saveAnswers();
    return;
  }
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
    if(f.type === 'text'){
      return `<div class="field" style="margin-bottom:12px;">${label}<input type="text" id="field-${f.key}" value="${value}" placeholder="${f.placeholder||''}"></div>`;
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

const CONCURRENT_ROW_FIELDS = ['nom','cible','prix','force','faiblesse'];

function collectConcurrentsRows(){
  const rows = answers.concurrentsListe && answers.concurrentsListe.length ? answers.concurrentsListe : [{}];
  document.querySelectorAll('.concurrent-row').forEach((rowEl, i) => {
    if(!rows[i]) rows[i] = {};
    CONCURRENT_ROW_FIELDS.forEach(k => {
      const inp = document.getElementById(`concurrent-${i}-${k}`);
      if(inp) rows[i][k] = inp.value;
    });
  });
  answers.concurrentsListe = rows;
}

function renderConcurrentsStep(){
  const el = document.getElementById('wizardStepFields');
  if(!answers.concurrentsListe || !answers.concurrentsListe.length){
    answers.concurrentsListe = [{nom:'',cible:'',prix:'',force:'',faiblesse:''}];
  }
  const rows = answers.concurrentsListe;
  const rowLabels = {nom:'Nom', cible:'Cible principale', prix:'Prix approximatif', force:'Force observée', faiblesse:'Faiblesse observée'};
  const rowPlaceholders = {nom:"Ex : Deliveroo, ou 'cuisiner soi-même'", cible:'Ex : urbains pressés', prix:'Ex : 15€/livraison', force:'Ex : rapidité de livraison', faiblesse:'Ex : prix élevé, peu healthy'};
  el.innerHTML = `
    ${rows.map((r,i) => `
      <div class="card concurrent-row" data-row="${i}" style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span class="smallcaps">Concurrent ${i+1}</span>
          ${rows.length > 1 ? `<button type="button" class="btn btn-sm" data-remove-row="${i}">Supprimer</button>` : ''}
        </div>
        ${CONCURRENT_ROW_FIELDS.map(k => `<div class="field" style="margin-bottom:8px;"><label style="font-size:11.5px;color:var(--text-dim);display:block;margin-bottom:4px;">${rowLabels[k]}</label><input type="text" id="concurrent-${i}-${k}" value="${escapeHtml(r[k]||'')}" placeholder="${rowPlaceholders[k]}"></div>`).join('')}
      </div>`).join('')}
    <button type="button" class="btn btn-sm" id="addConcurrentBtn">+ Ajouter un concurrent</button>`;
  el.querySelectorAll('[data-remove-row]').forEach(btn => btn.addEventListener('click', () => {
    collectConcurrentsRows();
    answers.concurrentsListe.splice(Number(btn.dataset.removeRow), 1);
    saveAnswers();
    renderConcurrentsStep();
  }));
  document.getElementById('addConcurrentBtn').addEventListener('click', () => {
    collectConcurrentsRows();
    answers.concurrentsListe.push({nom:'',cible:'',prix:'',force:'',faiblesse:''});
    saveAnswers();
    renderConcurrentsStep();
  });
}

function renderDiagnosticStep(){
  const el = document.getElementById('wizardStepFields');
  const zones = computeDiagnostic(answers);
  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:12px;">Ce diagnostic est basé uniquement sur ce que tu as écrit dans les étapes précédentes — jamais un jugement inventé.</p>
    ${zones.map(z => `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${DIAGNOSTIC_STATUS_META[z.status].emoji} ${z.label}</strong>
          <span style="font-size:11px;color:var(--text-dim);">${DIAGNOSTIC_STATUS_META[z.status].label}</span>
        </div>
        <p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${z.justification}</p>
      </div>`).join('')}`;
}

function renderStrategieStep(){
  const el = document.getElementById('wizardStepFields');
  const strategies = computeStrategies(answers);
  const chosen = answers.strategieChoisie;
  el.innerHTML = `
    <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:12px;">${typeof renderDataBadge === 'function' ? renderDataBadge('avis') : '💬'} Aucune stratégie n'est objectivement meilleure dans l'absolu : chacune dépend de tes contraintes réelles (capital, marché, tolérance au risque). Choisis celle qui te semble la plus adaptée.</p>
    ${strategies.map(s => `
      <label style="display:block;border:1px solid var(--hairline);border-radius:2px;padding:12px 14px;margin-bottom:10px;cursor:pointer;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
          <input type="radio" name="field-strategieChoisie" value="${s.label}" ${chosen===s.label?'checked':''}>
          <strong style="color:var(--gold-bright);">${s.label}${s.recommandee ? ' · plutôt indiquée ici' : ''}</strong>
        </div>
        <p style="font-size:12.5px;margin-bottom:6px;">${s.objectif}</p>
        <p style="font-size:12px;color:var(--text-dim);margin-bottom:2px;"><strong>Avantages :</strong> ${s.avantages.join(' ')}</p>
        <p style="font-size:12px;color:var(--text-dim);"><strong>Risques :</strong> ${s.risques.join(' ')}</p>
        <p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">Plutôt indiquée si : ${s.recommandeeSi}.</p>
      </label>`).join('')}`;
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
      else if(f.key === 'secteur') v = PROJECT_SECTOR_LABELS[v] || v;
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
  const zones = computeDiagnostic(a);
  const strategies = computeStrategies(a);
  const chosenStrategy = strategies.find(s => s.label === a.strategieChoisie);
  const gameKey = PROJECT_SECTOR_TO_GAME_KEY[a.secteur];
  const esc = escapeHtml;
  const fiche = [
    {label:'Catégorie de projet', value: PROJECT_SECTOR_LABELS[a.secteur] || '—'},
    {label:'Projet', value: esc(a.offre) || '—'},
    {label:'Problème', value: esc(a.probleme) || '—'},
    {label:'Client cible', value: [CLIENT_TYPE_LABELS[a.clientType], esc(a.clientDetail)].filter(Boolean).join(' — ') || '—'},
    {label:'Utilisateur / décideur / payeur', value: [
      a.roleUtilisateur ? `Utilise : ${esc(a.roleUtilisateur)}` : '',
      a.roleDecideur ? `Décide : ${esc(a.roleDecideur)}` : '',
      a.rolePayeur ? `Paie : ${esc(a.rolePayeur)}` : ''
    ].filter(Boolean).join(' · ') || '—'},
    {label:'Marché', value: esc(a.marche) || '—'},
    {label:'Proposition de valeur', value: esc(a.valeur) || '—'},
    {label:'Offre', value: esc(a.offre) || '—'},
    {label:'Business model', value: BUSINESS_MODEL_LABELS[a.businessModel] || '—'},
    {label:'Prix', value: a.prix ? fmtEUR(Number(a.prix)) : '—'},
    {label:'Capital initial', value: a.budgetInitial ? fmtEUR(Number(a.budgetInitial)) : '—'},
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
      ${(a.concurrentsListe && a.concurrentsListe.length) ? `<div style="margin-bottom:12px;"><strong style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--gold-bright);">Concurrents identifiés</strong>${a.concurrentsListe.map(c=>`<p style="font-size:13px;margin-top:6px;"><strong>${esc(c.nom)||'—'}</strong>${c.cible?` · cible : ${esc(c.cible)}`:''}${c.prix?` · prix : ${esc(c.prix)}`:''}${c.force?` · force : ${esc(c.force)}`:''}${c.faiblesse?` · faiblesse : ${esc(c.faiblesse)}`:''}</p>`).join('')}</div>` : ''}
      <div style="margin-bottom:16px;">
        <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--gold-bright);">Diagnostic</strong>
        ${zones.map(z=>`<p style="font-size:12.5px;margin-top:6px;">${DIAGNOSTIC_STATUS_META[z.status].emoji} <strong>${z.label}</strong> — ${z.justification}</p>`).join('')}
      </div>
      ${chosenStrategy ? `<div style="margin-bottom:16px;"><strong style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--gold-bright);">Stratégie choisie</strong><p style="font-size:13.5px;margin-top:4px;">${chosenStrategy.label} — ${chosenStrategy.objectif}</p></div>` : ''}
      <p class="disclaimer-box" style="margin-top:16px;">Cette fiche récapitule tes propres réponses. Elle ne garantit aucun succès et ne constitue ni un conseil financier ni un business plan complet — elle t'aide à structurer une réflexion, pas à la remplacer.</p>
      ${!gameKey ? `<p class="disclaimer-box" style="margin-top:12px;">La catégorie « ${PROJECT_SECTOR_LABELS[a.secteur] || 'choisie'} » n'est pas encore simulable dans le Business Game. Secteurs disponibles pour l'instant : ${(typeof BUSINESS_SECTOR_ORDER !== 'undefined' ? BUSINESS_SECTOR_ORDER.map(k=>BUSINESS_SECTORS[k].label).join(', ') : 'SaaS B2B, e-commerce, restaurant')}.</p>` : ''}
      <div id="wizardFinal-method"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
        <button class="btn btn-sm" id="wizardRestartBtn">Recommencer</button>
        <a href="business.html" class="btn btn-sm btn-gold">Retour à Business</a>
        ${gameKey ? `<button class="btn btn-sm btn-gold" id="wizardTestBtn" type="button">🎮 Tester cette stratégie</button>` : ''}
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
  const testBtn = document.getElementById('wizardTestBtn');
  if(testBtn){
    testBtn.addEventListener('click', ()=>{
      safeSetJSON('fzr-business-strategy-transfer', {
        sectorKey: gameKey,
        clientCible: a.clientDetail || '',
        budgetInitial: Number(a.budgetInitial) || 0,
        businessModel: BUSINESS_MODEL_LABELS[a.businessModel] || '',
        strategieChoisie: a.strategieChoisie || ''
      });
      window.location.href = 'jeu-business.html';
    });
  }
  document.getElementById('wizardFinal-method').innerHTML = renderMethodologyPanel(BUSINESS_METHODOLOGY['construire-mon-projet']);
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
  else if(step.type === 'diagnostic'){ renderDiagnosticStep(); renderHint(null); }
  else if(step.type === 'strategie'){ renderStrategieStep(); renderHint(null); }
  else if(step.type === 'concurrents'){ renderConcurrentsStep(); renderHint(step.hint); }
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
