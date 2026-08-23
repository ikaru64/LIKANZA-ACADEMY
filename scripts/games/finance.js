/* ============================================================
   LIKANZA ACADEMY — Rendu de la page Finance d'entreprise (finance-data.js)
   Même structure que strategie.js : intro → roadmap → concepts →
   exemples réels (BUSINESS_CASES) → conseils actionnables → erreurs
   fréquentes → calculateur associé/quiz/approfondir.
   ============================================================ */

function renderFinancePage(elId){
  const el = document.getElementById(elId);
  if(!el) return;

  const exemplesHtml = FINANCE_EXEMPLES.map(ex => {
    const c = (typeof BUSINESS_CASES !== 'undefined') ? BUSINESS_CASES.find(x => x.id === ex.caseId) : null;
    if(!c) return '';
    return `<a href="business-cases.html" class="card play-tile">
      <span class="icon" style="font-size:20px;">${c.icon}</span>
      <h4 style="margin:8px 0 4px;">${c.entreprise}</h4>
      <p style="font-size:12.5px;">${ex.angle}</p>
    </a>`;
  }).join('');

  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;margin-bottom:18px;">${FINANCE_INTRO}</p>

    <div class="card" style="margin-bottom:18px;">
      <span class="smallcaps">Ce que tu vas voir</span>
      <ol style="margin:10px 0 0 20px;padding:0;font-size:13px;color:var(--text-dim);">
        ${FINANCE_ROADMAP.map(r => `<li style="margin-bottom:6px;">${r}</li>`).join('')}
      </ol>
    </div>

    <div class="card" style="margin-bottom:18px;">
      <span class="smallcaps">📚 Concepts essentiels</span>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;">
        ${FINANCE_CONCEPTS.map(t => `<a href="bibliotheque.html#${encodeURIComponent(t.replace(/\s+/g,'-'))}" class="badge">${t}</a>`).join('')}
      </div>
    </div>

    <span class="smallcaps">🏢 Exemples réels</span>
    <div class="card-grid" style="margin:10px 0 18px;">${exemplesHtml}</div>

    <div class="card" style="margin-bottom:18px;">
      <span class="smallcaps">🛠 Conseils actionnables</span>
      ${FINANCE_CONSEILS.map(c => `
        <div style="margin-top:12px;">
          <strong style="font-size:13.5px;">${c.titre}</strong>
          <ol style="margin:8px 0 0 20px;padding:0;font-size:13px;color:var(--text-dim);">
            ${c.etapes.map(e => `<li style="margin-bottom:6px;">${e}</li>`).join('')}
          </ol>
        </div>`).join('')}
    </div>

    <div class="card" style="margin-bottom:18px;">
      <span class="smallcaps">⚠️ Erreurs fréquentes</span>
      <div style="margin-top:10px;">${FINANCE_MISTAKES.map(m => `<p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;"><strong style="color:var(--text);">${m.titre}</strong> — ${m.description}</p>`).join('')}</div>
    </div>

    <div class="card-grid">
      <a href="${FINANCE_QUIZ_HREF}" class="card play-tile">
        <span class="icon" data-icon="target" style="color:var(--gold-bright);"></span>
        <h4 style="margin:8px 0 4px;">Teste tes connaissances</h4>
        <p style="font-size:12.5px;">De vraies questions sur les chiffres d'entreprise, dans les Défis.</p>
      </a>
      ${FINANCE_APPROFONDIR.map(a => `<a href="${a.href}" class="card play-tile"><h4 style="margin:8px 0 4px;">${a.label}</h4><p style="font-size:12.5px;">${a.description}</p></a>`).join('')}
    </div>`;

  tryAwardQuizPoints(`finance-page-viewed-${new Date().toDateString()}`, 3, {financePageViewed: true});
}

// ============================================================
// ---------- Laboratoire "Faut-il investir ?" (section 9 du prompt
// "Extension des domaines") : VAN/TRI à partir d'hypothèses saisies par
// l'utilisateur (investissement, CA généré, croissance, marge, durée,
// taux d'actualisation) — computeVAN/computeTRI/computeInvestmentProject
// CashFlows (scripts/data.js), jamais un résultat présenté comme une
// prédiction, toujours le résultat mécanique des hypothèses affichées. ----------
function renderFinanceLab(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;margin:0 0 16px;max-width:70ch;">Une entreprise envisage un investissement (nouvelle usine, nouvelle ligne de produit...). Ajuste les hypothèses ci-dessous pour voir si, sur cette base, le projet créerait ou détruirait de la valeur — jamais une prédiction, seulement le résultat mécanique de ce que tu saisis.</p>
    <div class="card-grid" style="grid-template-columns:1fr 1fr;">
      <div class="card">
        <div class="field"><label for="labInvInitial">Investissement initial (€)</label><input type="number" id="labInvInitial" min="0" step="1000" value="10000000"></div>
        <div class="field"><label for="labInvCA1">Chiffre d'affaires additionnel généré la 1ère année (€)</label><input type="number" id="labInvCA1" min="0" step="1000" value="8000000"></div>
        <div class="slider-row field"><label for="labInvGrowth">Croissance annuelle de ce CA <span class="v mono" id="valLabInvGrowth">3 %</span></label><input type="range" id="labInvGrowth" min="-10" max="30" step="1" value="3"></div>
        <div class="slider-row field"><label for="labInvMargin">Marge nette sur ce CA additionnel <span class="v mono" id="valLabInvMargin">20 %</span></label><input type="range" id="labInvMargin" min="0" max="50" step="1" value="20"></div>
        <div class="slider-row field"><label for="labInvYears">Durée du projet <span class="v mono" id="valLabInvYears">10 ans</span></label><input type="range" id="labInvYears" min="1" max="25" step="1" value="10"></div>
        <div class="slider-row field" style="margin-bottom:0;"><label for="labInvWacc">Taux d'actualisation (WACC) <span class="v mono" id="valLabInvWacc">8 %</span></label><input type="range" id="labInvWacc" min="1" max="20" step="0.5" value="8"></div>
      </div>
      <div class="card">
        <h3>Résultat</h3>
        <div id="labInvResult" style="margin-top:12px;"></div>
      </div>
    </div>`;

  const ids = ['labInvInitial','labInvCA1','labInvGrowth','labInvMargin','labInvYears','labInvWacc'];
  const get = id => +document.getElementById(id).value || 0;

  function update(){
    document.getElementById('valLabInvGrowth').textContent = get('labInvGrowth') + ' %';
    document.getElementById('valLabInvMargin').textContent = get('labInvMargin') + ' %';
    document.getElementById('valLabInvYears').textContent = get('labInvYears') + ' ans';
    document.getElementById('valLabInvWacc').textContent = get('labInvWacc') + ' %';

    const investissement = get('labInvInitial');
    const ca1 = get('labInvCA1');
    const croissance = get('labInvGrowth');
    const marge = get('labInvMargin');
    const duree = get('labInvYears');
    const wacc = get('labInvWacc');

    const cashFlows = computeInvestmentProjectCashFlows(ca1, croissance, marge, duree);
    const van = computeVAN(investissement, cashFlows, wacc);
    const tri = computeTRI(investissement, cashFlows);
    const cashFlowTotal = cashFlows.reduce((s, cf) => s + cf, 0);
    const roiSimple = investissement > 0 ? ((cashFlowTotal - investissement) / investissement) * 100 : 0;
    const creeDeLaValeur = van > 0;

    const resultEl = document.getElementById('labInvResult');
    resultEl.innerHTML = `
      ${renderDataBadge('calcul')}
      <div class="result-row" style="margin-top:10px;">
        <span>VAN</span><span class="mono" style="color:${creeDeLaValeur ? 'var(--emerald)' : 'var(--bordeaux)'};font-size:18px;">${fmtEUR(van)}</span>
      </div>
      <div class="result-row">
        <span>TRI</span><span class="mono">${tri === null ? 'Non calculable sur cette plage' : tri.toFixed(1) + ' %'}</span>
      </div>
      <div class="result-row">
        <span>ROI simple (non actualisé)</span><span class="mono">${roiSimple >= 0 ? '+' : ''}${roiSimple.toFixed(0)} %</span>
      </div>
      <p style="font-size:13px;margin-top:14px;color:${creeDeLaValeur ? 'var(--emerald)' : 'var(--bordeaux)'};">${creeDeLaValeur
        ? `Sur ces hypothèses, le projet créerait de la valeur : sa rentabilité attendue dépasse le coût du capital (${wacc}%).`
        : `Sur ces hypothèses, le projet détruirait de la valeur : sa rentabilité attendue ne couvre pas le coût du capital (${wacc}%), même s'il reste comptablement rentable.`}</p>
      ${renderMethodologyPanel({
        calcul: "VAN = −Investissement initial + somme des flux de trésorerie annuels, chacun actualisé au taux choisi. TRI = le taux d'actualisation pour lequel cette VAN serait exactement nulle, trouvé par approximations successives.",
        donnees: `Flux de trésorerie annuels calculés à partir de : CA additionnel de ${fmtEUR(ca1)} la 1ère année, croissance de ${croissance}%/an, marge nette de ${marge}% sur ce CA — jamais une donnée de marché, uniquement tes hypothèses saisies ci-contre.`,
        hypotheses: "Croissance et marge constantes sur toute la durée du projet (simplification) ; aucun investissement complémentaire en cours de route ; le taux d'actualisation (WACC) reste constant sur toute la période.",
        limites: "Un projet réel implique souvent des investissements échelonnés, une marge qui évolue avec l'échelle, et un WACC qui peut varier avec le risque perçu du projet — ce simulateur isole le mécanisme VAN/TRI, pas une prévision d'entreprise réelle.",
        comprendre: "Une VAN positive signifie que le projet rapporte plus que ce qu'il coûte de financer (WACC) — un TRI supérieur au WACC dit la même chose autrement, en %. Les deux mesures peuvent en théorie diverger sur des projets aux flux atypiques : la VAN reste la référence recommandée en cas de désaccord entre les deux."
      })}`;
  }

  ids.forEach(id => document.getElementById(id).addEventListener('input', update));
  update();
  tryAwardQuizPoints(`finance-lab-${new Date().toDateString()}`, 8, {usedSimulator: true});
}
