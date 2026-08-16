/* ============================================================
   LIKANZA ACADEMY — Test de positionnement (profil Likanza en 3 parties)
   Partie A (connaissances, questions réelles de QUIZ_BANK_FULL regroupées
   par POSITIONING_DOMAINS) -> Partie B (centres d'intérêt) -> Partie C
   (manière d'apprendre + compréhension légère du risque). Le résultat fait
   évoluer le même fzr-profile que Mon compte (pas de second système de
   profil), et conserve exactement la forme historique de
   fzr-positioning-result / fzr-level pour ne rien casser côté
   formations.js / parcours.js / renderCoach, qui restent inchangés.
   ============================================================ */

const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};

function positioningQuestions(){
  const list = [];
  POSITIONING_DOMAINS.forEach(dom=>{
    dom.ids.forEach(id=>{
      const q = QUIZ_BANK_FULL.find(x=>x.id===id);
      if(q) list.push({...q, _catKey: dom.key, _catLabel: dom.label});
    });
  });
  return list;
}

function levelFromOverallPct(pct){
  if(pct >= 80) return 'expert';
  if(pct >= 60) return 'avance';
  if(pct >= 35) return 'intermediaire';
  return 'debutant';
}

const positioningQuestionsList = positioningQuestions();
let partAAnswers = {}; // domainKey -> {correct, total}

function startPositioningTest(){
  document.getElementById('posIntro').style.display = 'none';
  const quizEl = document.getElementById('posQuiz');
  quizEl.style.display = 'block';

  partAAnswers = {};
  let qIndex = 0;

  function recordCat(catKey, correct){
    if(!partAAnswers[catKey]) partAAnswers[catKey] = {correct:0, total:0};
    partAAnswers[catKey].total++;
    if(correct) partAAnswers[catKey].correct++;
  }

  function renderQuestion(){
    if(qIndex >= positioningQuestionsList.length){
      quizEl.style.display = 'none';
      startPartB();
      return;
    }
    const item = positioningQuestionsList[qIndex];
    const pct = Math.round((qIndex/positioningQuestionsList.length)*100);
    quizEl.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Partie 1/3 · Question ${qIndex+1} / ${positioningQuestionsList.length}</span><span>${item._catLabel}</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:14px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      <div style="font-size:15px;margin-bottom:12px;font-weight:500;">${item.question}</div>
      <div id="posOpts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;"></div>
      <div id="posFeedback" style="font-size:13.5px;color:var(--text-dim);min-height:20px;margin-bottom:12px;"></div>
      <button class="btn btn-sm btn-gold" id="posNextBtn" style="display:none;">Question suivante</button>`;
    const opts = document.getElementById('posOpts');
    item.choix.forEach((opt,i)=>{
      const btn = document.createElement('button');
      btn.className = 'pill';
      btn.style.textAlign = 'left';
      btn.textContent = opt;
      btn.addEventListener('click', ()=>{
        Array.from(opts.children).forEach((c,ci)=>{
          c.disabled = true;
          if(ci===item.bonneReponse) c.style.borderColor = 'var(--emerald)';
          else if(ci===i) c.style.borderColor = 'var(--bordeaux)';
        });
        const correct = i===item.bonneReponse;
        recordCat(item._catKey, correct);
        document.getElementById('posFeedback').textContent = item.explication;
        const nextBtn = document.getElementById('posNextBtn');
        nextBtn.style.display = 'inline-block';
        nextBtn.addEventListener('click', ()=>{ qIndex++; renderQuestion(); }, {once:true});
      }, {once:true});
      opts.appendChild(btn);
    });
  }

  renderQuestion();
}

// ---------- Partie B : centres d'intérêt ----------
function startPartB(){
  const el = document.getElementById('posPartB');
  el.style.display = 'block';
  document.getElementById('posInterestsList').innerHTML = POSITIONING_INTERESTS.map((it,i)=>`
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="checkbox" class="pos-interest-cb" data-key="${it.key}" data-idx="${i}" style="width:16px;height:16px;flex-shrink:0;">
      <span>${it.label}</span>
    </label>`).join('');
}

document.getElementById('posPartBNext').addEventListener('click', ()=>{
  document.getElementById('posPartB').style.display = 'none';
  startPartC();
});

// ---------- Partie C : manière d'apprendre + compréhension légère du risque ----------
function startPartC(){
  const el = document.getElementById('posPartC');
  el.style.display = 'block';
  document.getElementById('posStylesList').innerHTML = POSITIONING_LEARNING_STYLES.map((s,i)=>`
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="checkbox" class="pos-style-cb" data-key="${s.key}" data-idx="${i}" style="width:16px;height:16px;flex-shrink:0;">
      <span>${s.label}</span>
    </label>`).join('');
  document.getElementById('posRiskList').innerHTML = POSITIONING_RISK_COMFORT.map((r,i)=>`
    <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;cursor:pointer;">
      <input type="radio" name="posRisk" class="pos-risk-radio" value="${r.value}" ${r.value==='equilibre'?'checked':''} style="width:16px;height:16px;flex-shrink:0;">
      <span>${r.label}</span>
    </label>`).join('');
}

document.getElementById('posPartCSubmit').addEventListener('click', ()=>{
  const interests = {};
  document.querySelectorAll('.pos-interest-cb').forEach(cb=>{ if(cb.checked) interests[cb.dataset.key] = true; });
  const learningStyle = {};
  document.querySelectorAll('.pos-style-cb').forEach(cb=>{ if(cb.checked) learningStyle[cb.dataset.key] = true; });
  const riskEl = document.querySelector('.pos-risk-radio:checked');
  const risque = riskEl ? riskEl.value : 'equilibre';
  document.getElementById('posPartC').style.display = 'none';
  renderResults(partAAnswers, interests, learningStyle, risque);
});

// ---------- Bilan final ----------
function renderResults(answers, interests, learningStyle, risque){
  const resEl = document.getElementById('posResults');
  resEl.style.display = 'block';

  const categoryScores = {};
  const domainLevels = {};
  let totalCorrect = 0, totalAnswered = 0;
  POSITIONING_DOMAINS.forEach(dom=>{
    const a = answers[dom.key];
    if(!a) return;
    const pct = Math.round((a.correct/a.total)*100);
    categoryScores[dom.key] = {label:dom.label, pct, correct:a.correct, total:a.total};
    domainLevels[dom.key] = levelFromOverallPct(pct);
    totalCorrect += a.correct; totalAnswered += a.total;
  });
  const overallPct = totalAnswered ? Math.round((totalCorrect/totalAnswered)*100) : 0;
  const level = levelFromOverallPct(overallPct);

  const strong = Object.values(categoryScores).filter(c=>c.pct>=75).map(c=>c.label);
  const weak = Object.values(categoryScores).filter(c=>c.pct<50).map(c=>c.label);

  // Forme historique inchangée : formations.js / parcours.js / renderCoach
  // (scripts/data.js) lisent tous ce même objet, sans changement nécessaire.
  safeSetJSON('fzr-positioning-result', {
    date: new Date().toISOString(),
    overallPct, categoryScores, level
  });
  setLevelStorage(level);

  // Fait évoluer le même profil (fzr-profile) que Mon compte, sans créer de
  // second système : age/epargne/horizon/objectif existants sont préservés.
  saveProfile({...getProfile(), levels: domainLevels, interests, learningStyle, risque});

  const interestLabels = [...new Set(POSITIONING_INTERESTS.filter(it=>interests[it.key]).map(it=>it.label))];
  const styleLabels = POSITIONING_LEARNING_STYLES.filter(s=>learningStyle[s.key]).map(s=>s.label);

  resEl.innerHTML = `
    <div class="card" style="max-width:640px;margin:0 auto;">
      <span class="smallcaps">Ton bilan</span>
      <h2 class="display" style="font-size:24px;font-weight:600;margin:8px 0;">Maîtrise globale : ${overallPct}%</h2>
      <p style="color:var(--text-dim);font-size:13.5px;margin-bottom:16px;">Niveau global estimé : <strong style="color:var(--gold-bright);">${LEVEL_LABELS[level]}</strong></p>
      <div id="posCatBars"></div>
      ${strong.length ? `<p style="font-size:12.5px;color:var(--emerald);margin-top:14px;">Points forts : ${strong.join(', ')}</p>` : ''}
      ${weak.length ? `<p style="font-size:12.5px;color:var(--gold-bright);">À renforcer en priorité : ${weak.join(', ')}</p>` : ''}
      ${interestLabels.length ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;"><strong style="color:var(--text);">Tu veux apprendre :</strong> ${interestLabels.join(' · ')}</p>` : ''}
      ${styleLabels.length ? `<p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;"><strong style="color:var(--text);">Tu apprends mieux avec :</strong> ${styleLabels.join(' · ')}</p>` : ''}
      <p style="font-size:12px;color:var(--text-dim);margin-top:12px;">Durée estimée du parcours conseillé : environ 6 semaines à raison de quelques minutes par jour.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">
        <a href="parcours.html" class="btn btn-gold">Commencer mon parcours personnalisé</a>
        <a href="index.html" class="btn btn-sm">Retour à l'exploration libre</a>
      </div>
    </div>`;

  const barsEl = document.getElementById('posCatBars');
  barsEl.innerHTML = Object.values(categoryScores).map(c=>`
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;"><span>${c.label}</span><span class="mono">${c.pct}%</span></div>
      <div class="dash-weekbar" style="width:100%;"><div class="dash-weekfill" style="width:${c.pct}%;"></div></div>
    </div>`).join('');

  awardXP(20, {positioningTestDone:true});
}

document.getElementById('posStartBtn').addEventListener('click', startPositioningTest);
