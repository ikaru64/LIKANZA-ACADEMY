// ================= I18N (accueil) =================
const I18N = {
  en: {
    todayEyebrow: "FOR YOU TODAY",
    todayTitle: "Your daily dashboard",
    learnPreviewLabel: "YOUR MISSIONS",
    learnCta: "Open my missions",
    libraryEyebrow: "LEARN A CONCEPT",
    libraryCardTitle: "The Likanza Academy encyclopedia",
    libraryDesc: "Clear definitions, examples and three reading levels for every key concept.",
    libraryCta: "Explore the library",
    teacherTitle: "AI Teacher",
    teacherDemoFlag: "Local demo",
    teacherTopicLabel: "Pick a topic",
    teacherAskCta: "Explain simply",
    teacherNote: "Local demonstration: the full AI teacher will need a future connection to a real API.",
    challengeTitle: "Interactive challenge",
    arenaTitle: "Arena: coming soon",
    leaguePreviewTitle: "See your league",
    arenaDesc: "Leagues already rank your XP against demo profiles on your account page. A real multiplayer Arena is planned but needs user accounts and a server, not yet available.",
    arenaCta: "See my league",
    labToolEyebrow: "SIMULATE",
    labToolTitle: "Compound interest lab",
    simCapitalLabel: "Starting capital",
    simMonthlyLabel: "Monthly contribution",
    simRateLabel: "Annual return",
    simYearsLabel: "Years",
    labToolCta: "Open all simulators",
    simLabNote: "This is a teaching lab with hypothetical numbers, not a real wealth sync or investment advice. Below: quick links to the other simulators (wealth projection, savings goal, budget, credit and scenario comparison), all kept fully working on their own pages.",
    seeAllLink: "see all →",
    freeLabel: "FREE, FOREVER",
    premiumTeaserTitle: "Premium (planned)",
    premiumTeaserDesc: "A more advanced AI Teacher, an ultra-personalised path and detailed statistics: Premium will add comfort, never lock the essentials. Not billed yet.",
    premiumTeaserCta: "Learn more",
    newsletterEyebrow: "Newsletter",
    newsletterTitle: "Finance, explained simply, every week.",
    newsletterCta: "Subscribe",
    langButtonLabel: "FR",
    quickAccess: [
      {tab:"tab-apprendre", title:"Learn", desc:"Missions & library", icon:"graduation-cap"},
      {tab:"tab-entrainer", title:"Train", desc:"Challenges & leagues", icon:"swords"},
      {tab:"tab-simuler", title:"Simulate", desc:"Labs & tools", icon:"calculator"},
      {tab:"tab-actualites", title:"Understand the news", desc:"Summarised daily", icon:"newspaper"}
    ],
    simPreviews: [
      {title:"Wealth projection", desc:"Project your net worth over time.", url:"finances-personnelles.html"},
      {title:"Savings goal", desc:"How long to reach a target amount.", url:"finances-personnelles.html"},
      {title:"Budget", desc:"Income, expenses, savings rate.", url:"finances-personnelles.html"},
      {title:"Credit", desc:"Monthly payment & borrowing capacity.", url:"immobilier.html"},
      {title:"Scenario comparison", desc:"Cautious vs balanced vs ambitious.", url:"bourse.html"}
    ]
  },
  fr: {
    todayEyebrow: "POUR TOI AUJOURD'HUI",
    todayTitle: "Ton tableau de bord du jour",
    learnPreviewLabel: "TES MISSIONS",
    learnCta: "Ouvrir mes missions",
    libraryEyebrow: "APPRENDRE UNE NOTION",
    libraryCardTitle: "L'encyclopédie Likanza Academy",
    libraryDesc: "Des définitions claires, des exemples et trois niveaux de lecture pour chaque notion clé.",
    libraryCta: "Explorer la bibliothèque",
    teacherTitle: "Professeur IA",
    teacherDemoFlag: "Démonstration locale",
    teacherTopicLabel: "Choisis une notion",
    teacherAskCta: "Explique-moi simplement",
    teacherNote: "Démonstration locale : la version IA complète nécessitera une future connexion à une API.",
    challengeTitle: "Défi interactif",
    arenaTitle: "Arène : bientôt disponible",
    leaguePreviewTitle: "Voir ma ligue",
    arenaDesc: "Les ligues classent déjà ton XP face à des profils de démonstration, sur ta page compte. Une vraie Arène multijoueur est prévue, mais nécessite des comptes utilisateurs et un serveur : pas encore disponible.",
    arenaCta: "Voir ma ligue",
    labToolEyebrow: "SIMULER",
    labToolTitle: "Laboratoire d'intérêts composés",
    simCapitalLabel: "Capital de départ",
    simMonthlyLabel: "Versement mensuel",
    simRateLabel: "Rendement annuel",
    simYearsLabel: "Durée",
    labToolCta: "Ouvrir tous les simulateurs",
    simLabNote: "Ceci est un laboratoire pédagogique avec des chiffres hypothétiques, pas une synchronisation réelle de patrimoine ni un conseil en investissement. Ci-dessous : accès rapide aux autres simulateurs (projection de patrimoine, objectif d'épargne, budget, crédit et comparaison de scénarios), tous pleinement fonctionnels sur leur page dédiée.",
    seeAllLink: "tout voir →",
    freeLabel: "GRATUIT, TOUJOURS",
    premiumTeaserTitle: "Premium (à venir)",
    premiumTeaserDesc: "Un professeur IA plus avancé, un parcours ultra-personnalisé et des statistiques détaillées : le Premium ajoutera du confort, sans jamais bloquer l'essentiel. Rien n'est facturé pour l'instant.",
    premiumTeaserCta: "En savoir plus",
    newsletterEyebrow: "Newsletter",
    newsletterTitle: "L'essentiel de la finance, expliqué simplement, chaque semaine.",
    newsletterCta: "S'inscrire",
    langButtonLabel: "EN",
    quickAccess: [
      {tab:"tab-apprendre", title:"Apprendre", desc:"Missions & bibliothèque", icon:"graduation-cap"},
      {tab:"tab-entrainer", title:"S'entraîner", desc:"Défis & ligues", icon:"swords"},
      {tab:"tab-simuler", title:"Simuler", desc:"Laboratoires & outils", icon:"calculator"},
      {tab:"tab-actualites", title:"Comprendre l'actualité", desc:"Résumée chaque jour", icon:"newspaper"}
    ],
    simPreviews: [
      {title:"Projection de patrimoine", desc:"Projette ton patrimoine net dans le temps.", url:"finances-personnelles.html"},
      {title:"Objectif d'épargne", desc:"Le temps nécessaire pour atteindre un montant.", url:"finances-personnelles.html"},
      {title:"Budget", desc:"Revenus, dépenses, taux d'épargne.", url:"finances-personnelles.html"},
      {title:"Crédit", desc:"Mensualité et capacité d'emprunt.", url:"immobilier.html"},
      {title:"Comparaison de scénarios", desc:"Prudent vs équilibré vs ambitieux.", url:"bourse.html"}
    ]
  }
};

let LANG = safeGet('fzr-lang') || 'fr';
function t(key){ return (I18N[LANG] && I18N[LANG][key]) || key; }

function applyStaticI18n(){
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(I18N[LANG][key] !== undefined) el.textContent = I18N[LANG][key];
  });
  const langBtn = document.getElementById('langToggle');
  if(langBtn) langBtn.textContent = t('langButtonLabel');
  const emailInput = document.getElementById('newsletterEmail');
  if(emailInput) emailInput.placeholder = LANG === 'en' ? 'you@email.com' : 'ton@email.fr';
}

function setLang(lang){
  LANG = lang;
  safeSet('fzr-lang', lang);
  safeRun('textes traduits', applyStaticI18n);
  safeRun('accès rapides (langue)', renderQuickAccess);
  safeRun('simulateurs (langue)', renderSimPreviews);
  safeRun("aujourd'hui (langue)", renderTodayCard);
}

const langToggleBtn = document.getElementById('langToggle');
if(langToggleBtn) langToggleBtn.addEventListener('click', ()=>{
  safeRun('changement de langue', ()=>setLang(LANG === 'en' ? 'fr' : 'en'));
});

// ================= Carte "Pour toi aujourd'hui" =================
function renderTodayCard(){
  const missionEl = document.getElementById('todayMission');
  const notionEl = document.getElementById('todayNotion');
  const challengeEl = document.getElementById('todayChallenge');
  if(missionEl){
    const level = getLevel();
    const mods = COURSES[level] || COURSES.debutant;
    const progress = safeGetJSON('fzr-progress', {});
    let idx = mods.findIndex((c,i)=>!progress[level+'-'+i]);
    const isReview = idx === -1;
    if(isReview) idx = 0;
    const mission = mods[idx];
    missionEl.innerHTML = `
      <h4>${LANG==='en'?(isReview?'Review':'Recommended mission'):(isReview?'Révision':'Mission recommandée')}</h4>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">${mission.title}</p>
      <a href="formations.html" class="btn btn-sm btn-gold">${LANG==='en'?'Continue':'Continuer'}</a>`;
  }
  if(notionEl){
    const notion = getNotionOfDay();
    notionEl.innerHTML = `
      <h4>${LANG==='en'?'Notion to review':'Notion à revoir'}</h4>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">${notion.terme} · ${notion.simple}</p>
      <a href="bibliotheque.html#${notion.terme.replace(/\s+/g,'-')}" class="btn btn-sm">${LANG==='en'?'Read more':'En savoir plus'}</a>`;
  }
  if(challengeEl){
    challengeEl.innerHTML = `<h4>${LANG==='en'?'Quick challenge':'Défi rapide'}</h4><div id="quickChallengeBox"></div>`;
    safeRun('défi rapide', ()=>renderQuickChallenge('quickChallengeBox'));
  }
}

// ================= Accès rapides / déclencheurs d'onglets =================
let activeTab = 'tab-apprendre';
function renderQuickAccess(){
  const el = document.getElementById('quickAccessGrid');
  if(!el) return;
  el.innerHTML = I18N[LANG].quickAccess.map(q=>`
    <button class="quick-access-card ${q.tab===activeTab?'active':''}" data-tab="${q.tab}">
      <div class="icon">${ICONS[q.icon] || ''}</div>
      <h3>${q.title}</h3>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${q.desc}</p>
    </button>`).join('');
  el.querySelectorAll('.quick-access-card').forEach(btn=>{
    btn.addEventListener('click', ()=>setActiveTab(btn.dataset.tab));
  });
}
function setActiveTab(tabId){
  activeTab = tabId;
  document.querySelectorAll('.quick-access-card').forEach(c=>c.classList.toggle('active', c.dataset.tab===tabId));
  document.querySelectorAll('.home-tab-panel').forEach(p=>p.classList.toggle('active', p.id===tabId));
}
if(location.hash && document.getElementById(location.hash.slice(1))){
  activeTab = location.hash.slice(1);
}
// Un clic sur un lien "index.html#tab-..." depuis l'accueil lui-même ne
// recharge pas la page : sans ce listener, ça ne faisait que scroller vers
// un panneau caché (display:none), sans jamais changer d'onglet.
window.addEventListener('hashchange', ()=>{
  const tab = location.hash.slice(1);
  const target = document.getElementById(tab);
  if(target && target.classList.contains('home-tab-panel')){
    safeRun('changement d\'onglet (ancre)', ()=>setActiveTab(tab));
  }
});

// ================= Onglet Apprendre =================
function renderLearnTab(){
  const level = getLevel();
  const labels = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};
  const mods = COURSES[level] || COURSES.debutant;
  const progress = safeGetJSON('fzr-progress', {});
  const nameEl = document.getElementById('learnLevelName');
  if(nameEl) nameEl.textContent = labels[level] || level;
  const listEl = document.getElementById('learnMissionsList');
  if(listEl){
    listEl.innerHTML = mods.slice(0,4).map((c,i)=>{
      const done = !!progress[level+'-'+i];
      return `<p style="font-size:13px;color:var(--text-dim);margin-bottom:4px;">${done?ICONS.check:ICONS.circle} ${c.title}</p>`;
    }).join('');
  }
}

// ================= Onglet Professeur IA (mini) =================
function renderTeacherMini(){
  const select = document.getElementById('teacherTopic');
  const btn = document.getElementById('teacherAskBtn');
  const out = document.getElementById('teacherOutput');
  if(!select || !btn || !out) return;
  select.innerHTML = LIBRARY.map(l=>`<option value="${l.terme}">${l.terme}</option>`).join('');
  btn.addEventListener('click', ()=>{
    const term = LIBRARY.find(l=>l.terme===select.value) || LIBRARY[0];
    out.textContent = term.simple;
  });
}

// ================= Onglet Simuler =================
function updateHomeSim(){
  const capEl = document.getElementById('homeSimCapital');
  const monEl = document.getElementById('homeSimMonthly');
  const rateEl = document.getElementById('homeSimRate');
  const yrsEl = document.getElementById('homeSimYears');
  const resEl = document.getElementById('homeSimResult');
  if(!capEl || !monEl || !rateEl || !yrsEl || !resEl) return;
  const P = Number(capEl.value)||0, PMT = Number(monEl.value)||0, rate = Number(rateEl.value)||0, years = Number(yrsEl.value)||1;
  const series = compoundSeries(P, PMT, rate, years);
  resEl.textContent = fmtEUR(series[series.length-1]);
  renderBarChart('homeSimChart', 'homeSimChartLabels', series, years);
}
function initHomeSim(){
  ['homeSimCapital','homeSimMonthly','homeSimRate','homeSimYears'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', ()=>safeRun('laboratoire intérêts composés', updateHomeSim));
  });
  updateHomeSim();
}
function renderSimPreviews(){
  const el = document.getElementById('simPreviewGrid');
  if(!el) return;
  el.innerHTML = I18N[LANG].simPreviews.map(s=>`
    <div class="card">
      <h3 style="font-size:16px;">${s.title}</h3>
      <p style="font-size:12.5px;">${s.desc}</p>
      <a href="${s.url}" class="btn btn-sm">${LANG==='en'?'Open':'Ouvrir'}</a>
    </div>`).join('');
}

// ================= Onglet Actualités =================
// Depuis la refonte des actualités, le contenu vient de /api/weekly-news
// (articles générés automatiquement, un par catégorie, renouvelés chaque
// semaine) plutôt que de l'ancien NEWS_DATA statique.
async function renderNewsTab(){
  const mainEl = document.getElementById('mainNewsCardHome');
  const recentEl = document.getElementById('recentNewsPreview');
  try {
    const resp = await fetch('/api/weekly-news');
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const articles = data.articles || [];
    const main = articles[0];
    if(main && mainEl){
      mainEl.innerHTML = `
        <div style="flex:1;">
          <span class="smallcaps">${main.categorie}</span>
          <h3 style="font-size:22px;">${main.titre}</h3>
          <p>${main.resume}</p>
          <div class="card-footer"><span>${main.lecture} de lecture · Source : ${main.source}</span></div>
          <a href="actualites.html#${main.slug}" class="btn btn-sm" style="margin-top:12px;">${LANG==='en'?'Read full summary':'Lire le résumé complet'}</a>
        </div>`;
    }
    if(recentEl){
      recentEl.innerHTML = articles.slice(1,3).map(a=>`
        <div class="card">
          <span class="smallcaps">${a.categorie}</span>
          <h3 style="font-size:16px;">${a.titre}</h3>
          <p style="font-size:12.5px;">${a.resume}</p>
          <a href="actualites.html#${a.slug}" class="btn btn-sm">${LANG==='en'?'Read':'Lire'}</a>
        </div>`).join('');
    }
  } catch(err){
    if(mainEl) mainEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Actualités momentanément indisponibles.</p>`;
    console.error('Likanza Academy — échec dans "actualités (accueil)" :', err);
  }
  safeRun('mini marché (accueil)', ()=>{
    const el = document.getElementById('marketMiniSnippet');
    if(!el) return;
    el.innerHTML = MARKET_DATA.slice(0,4).map(m=>`<span>${m.nom} <span class="${m.sens}">${m.variation}</span></span>`).join('');
  });
}

// ================= Premium teaser =================
const premiumBtn = document.getElementById('premiumTeaserBtn');
if(premiumBtn) premiumBtn.addEventListener('click', (e)=>{
  e.preventDefault();
  alert(LANG==='en' ? "Premium is a planned evolution: nothing to buy yet." : "Le Premium est une évolution prévue : rien à acheter pour l'instant.");
});

// ================= Newsletter =================
const newsletterFormEl = document.getElementById('newsletterForm');
if(newsletterFormEl) newsletterFormEl.addEventListener('submit', e=>{
  e.preventDefault();
  const msgEl = document.getElementById('newsletterMsg');
  if(msgEl) msgEl.textContent = LANG==='en'
    ? "Demo form: real delivery needs a server-side email integration, not active yet."
    : "Formulaire de démonstration : l'envoi réel nécessite une intégration e-mail côté serveur, pas encore active.";
});

// ================= Initialisation =================
safeRun('en-tête tableau de bord (init)', ()=>renderDashboardHeader('dashboardHeader'));
safeRun('coach personnalisé (init)', ()=>renderCoach('coachWidget'));
safeRun('textes traduits (init)', applyStaticI18n);
safeRun('accès rapides (init)', renderQuickAccess);
setActiveTab(activeTab);
safeRun('carte du jour (init)', renderTodayCard);
safeRun('onglet apprendre (init)', renderLearnTab);
safeRun('professeur IA mini (init)', renderTeacherMini);
safeRun('défis (aperçu)', ()=>{
  const el = document.getElementById('homeDefisTeaser');
  if(!el) return;
  el.innerHTML = `<p style="font-size:13px;color:var(--text-dim);margin-bottom:14px;">Quiz express, Vrai ou faux et bientôt d'autres formats — 82 questions sur 23 thèmes, à ton rythme.</p><a href="defis.html" class="btn btn-sm btn-gold">Ouvrir les Défis →</a>`;
});
safeRun('laboratoire simulateur (init)', initHomeSim);
safeRun('aperçus simulateurs (init)', renderSimPreviews);
safeRun('onglet actualités (init)', renderNewsTab);

