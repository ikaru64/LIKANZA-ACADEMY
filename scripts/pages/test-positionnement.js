/* ============================================================
   LIKANZA ACADEMY — Test de positionnement
   Réutilise des questions déjà existantes de QUIZ_BANK_FULL,
   regroupées par POSITIONING_CATEGORIES (scripts/app.js).
   Facultatif pour explorer le site ; nécessaire uniquement pour
   générer un parcours personnalisé (voir parcours.html).
   ============================================================ */

function positioningQuestions(){
  const list = [];
  POSITIONING_CATEGORIES.forEach(cat=>{
    cat.ids.forEach(id=>{
      const q = QUIZ_BANK_FULL.find(x=>x.id===id);
      if(q) list.push({...q, _catKey: cat.key, _catLabel: cat.label});
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

function startPositioningTest(){
  document.getElementById('posIntro').style.display = 'none';
  const quizEl = document.getElementById('posQuiz');
  quizEl.style.display = 'block';

  const questions = positioningQuestions();
  let qIndex = 0;
  const answers = {}; // catKey -> {correct, total}

  function recordCat(catKey, correct){
    if(!answers[catKey]) answers[catKey] = {correct:0, total:0};
    answers[catKey].total++;
    if(correct) answers[catKey].correct++;
  }

  function renderQuestion(){
    if(qIndex >= questions.length){ renderResults(answers, questions.length); return; }
    const item = questions[qIndex];
    const pct = Math.round((qIndex/questions.length)*100);
    quizEl.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Question ${qIndex+1} / ${questions.length}</span><span>${item._catLabel}</span>
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

function renderResults(answers, totalQuestions){
  const quizEl = document.getElementById('posQuiz');
  const resEl = document.getElementById('posResults');
  quizEl.style.display = 'none';
  resEl.style.display = 'block';

  const categoryScores = {};
  let totalCorrect = 0, totalAnswered = 0;
  POSITIONING_CATEGORIES.forEach(cat=>{
    const a = answers[cat.key];
    if(!a) return;
    const pct = Math.round((a.correct/a.total)*100);
    categoryScores[cat.key] = {label:cat.label, pct, correct:a.correct, total:a.total};
    totalCorrect += a.correct; totalAnswered += a.total;
  });
  const overallPct = totalAnswered ? Math.round((totalCorrect/totalAnswered)*100) : 0;
  const level = levelFromOverallPct(overallPct);
  const LEVEL_LABELS = {debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert'};

  const strong = Object.values(categoryScores).filter(c=>c.pct>=75).map(c=>c.label);
  const weak = Object.values(categoryScores).filter(c=>c.pct<50).map(c=>c.label);

  safeSetJSON('fzr-positioning-result', {
    date: new Date().toISOString(),
    overallPct, categoryScores, level
  });
  setLevelStorage(level);

  resEl.innerHTML = `
    <div class="card" style="max-width:640px;margin:0 auto;">
      <span class="smallcaps">Ton bilan</span>
      <h2 class="display" style="font-size:24px;font-weight:600;margin:8px 0;">Maîtrise globale : ${overallPct}%</h2>
      <p style="color:var(--text-dim);font-size:13.5px;margin-bottom:16px;">Niveau estimé : <strong style="color:var(--gold-bright);">${LEVEL_LABELS[level]}</strong></p>
      <div id="posCatBars"></div>
      ${strong.length ? `<p style="font-size:12.5px;color:var(--emerald);margin-top:14px;">Points forts : ${strong.join(', ')}</p>` : ''}
      ${weak.length ? `<p style="font-size:12.5px;color:var(--gold-bright);">À renforcer en priorité : ${weak.join(', ')}</p>` : ''}
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
