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

// ============================================================
// ---------- Simulateur LBO (section 13 du prompt "Extension des
// domaines" : M&A/PE/VC) : computeLBOReturns (scripts/data.js) à partir
// d'hypothèses saisies par l'utilisateur — montre mécaniquement pourquoi
// la dette amplifie le rendement sur le capital investi (effet de levier),
// jamais une prédiction, toujours le résultat mécanique de ce que
// l'utilisateur saisit. ----------
function renderLboLab(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;margin:0 0 16px;max-width:70ch;">Un fonds de private equity envisage de racheter une entreprise en utilisant de la dette (un LBO). Ajuste les hypothèses ci-dessous pour voir comment l'effet de levier peut amplifier le rendement sur le capital investi — dans les deux sens, jamais une prédiction, seulement le résultat mécanique de ce que tu saisis.</p>
    <div class="card-grid" style="grid-template-columns:1fr 1fr;">
      <div class="card">
        <div class="field"><label for="lboPrixAchat">Prix d'achat de l'entreprise (€)</label><input type="number" id="lboPrixAchat" min="0" step="100000" value="20000000"></div>
        <div class="field"><label for="lboDette">Dette utilisée pour l'achat (€)</label><input type="number" id="lboDette" min="0" step="100000" value="12000000"></div>
        <div class="field"><label for="lboEbitda">EBITDA initial de l'entreprise (€)</label><input type="number" id="lboEbitda" min="1" step="10000" value="2500000"></div>
        <div class="slider-row field"><label for="lboCroissance">Croissance annuelle de l'EBITDA <span class="v mono" id="valLboCroissance">6 %</span></label><input type="range" id="lboCroissance" min="-10" max="25" step="1" value="6"></div>
        <div class="slider-row field"><label for="lboMultipleSortie">Multiple de sortie (x EBITDA) <span class="v mono" id="valLboMultipleSortie">8 x</span></label><input type="range" id="lboMultipleSortie" min="3" max="15" step="0.5" value="8"></div>
        <div class="slider-row field"><label for="lboDuree">Durée de détention <span class="v mono" id="valLboDuree">5 ans</span></label><input type="range" id="lboDuree" min="1" max="10" step="1" value="5"></div>
        <div class="slider-row field" style="margin-bottom:0;"><label for="lboDetteRemboursee">Part de la dette remboursée sur la période <span class="v mono" id="valLboDetteRemboursee">60 %</span></label><input type="range" id="lboDetteRemboursee" min="0" max="100" step="5" value="60"></div>
      </div>
      <div class="card">
        <h3>Résultat</h3>
        <div id="lboLabResult" style="margin-top:12px;"></div>
      </div>
    </div>`;

  const ids = ['lboPrixAchat','lboDette','lboEbitda','lboCroissance','lboMultipleSortie','lboDuree','lboDetteRemboursee'];
  const get = id => +document.getElementById(id).value || 0;

  function update(){
    document.getElementById('valLboCroissance').textContent = get('lboCroissance') + ' %';
    document.getElementById('valLboMultipleSortie').textContent = get('lboMultipleSortie') + ' x';
    document.getElementById('valLboDuree').textContent = get('lboDuree') + ' ans';
    document.getElementById('valLboDetteRemboursee').textContent = get('lboDetteRemboursee') + ' %';

    const prixAchat = get('lboPrixAchat');
    const dette = get('lboDette');
    const ebitda = get('lboEbitda');
    const croissance = get('lboCroissance');
    const multipleSortie = get('lboMultipleSortie');
    const duree = get('lboDuree');
    const detteRemboursee = get('lboDetteRemboursee');

    const resultEl = document.getElementById('lboLabResult');
    const r = computeLBOReturns(prixAchat, dette, ebitda, croissance, multipleSortie, duree, detteRemboursee);
    if(!r || dette >= prixAchat){
      resultEl.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Hypothèses invalides : la dette doit rester inférieure au prix d'achat (il faut un capital investi positif) et l'EBITDA initial doit être positif.</p>`;
      return;
    }
    const multipleEntree = ebitda > 0 ? prixAchat / ebitda : null;
    const creeDeLaValeur = r.multipleEquity > 1;

    resultEl.innerHTML = `
      ${renderDataBadge('calcul')}
      <div class="result-row" style="margin-top:10px;">
        <span>Capital investi (equity)</span><span class="mono">${fmtEUR(r.equityInitial)}</span>
      </div>
      <div class="result-row">
        <span>Multiple d'entrée</span><span class="mono">${multipleEntree === null ? '—' : multipleEntree.toFixed(1) + ' x EBITDA'}</span>
      </div>
      <div class="result-row">
        <span>Valeur d'entreprise à la sortie</span><span class="mono">${fmtEUR(r.veSortie)}</span>
      </div>
      <div class="result-row">
        <span>Multiple sur capital investi</span><span class="mono" style="color:${creeDeLaValeur ? 'var(--emerald)' : 'var(--bordeaux)'};font-size:18px;">${r.multipleEquity.toFixed(2)} x</span>
      </div>
      <div class="result-row">
        <span>TRI approximatif</span><span class="mono">${r.triApprox === null ? 'Non calculable' : r.triApprox.toFixed(1) + ' %'}</span>
      </div>
      <p style="font-size:13px;margin-top:14px;color:var(--text-dim);">Sur ces hypothèses, la valeur de l'entreprise a progressé de <strong style="color:var(--text);">${r.multipleEV === null ? '—' : ((r.multipleEV - 1) * 100).toFixed(0) + ' %'}</strong> sur la période, alors que le capital des investisseurs a été multiplié par <strong style="color:${creeDeLaValeur ? 'var(--emerald)' : 'var(--bordeaux)'};">${r.multipleEquity.toFixed(2)}</strong> — c'est l'effet de levier de la dette utilisée pour l'achat, qui amplifie le rendement sur le capital investi dans les deux sens (à la hausse comme à la baisse).</p>
      ${renderMethodologyPanel({
        calcul: "Capital investi = Prix d'achat − Dette. Valeur de l'entreprise à la sortie = EBITDA initial × (1 + croissance)^durée × multiple de sortie. Valeur du capital à la sortie = Valeur d'entreprise à la sortie − Dette restante (dette initiale réduite du % remboursé saisi). Multiple sur capital investi = Valeur du capital à la sortie / Capital investi initial.",
        donnees: `Calcul à partir de tes hypothèses saisies ci-contre : prix d'achat de ${fmtEUR(prixAchat)}, dette de ${fmtEUR(dette)}, EBITDA initial de ${fmtEUR(ebitda)} — jamais une donnée de marché réelle, uniquement les valeurs que tu as saisies.`,
        hypotheses: "Croissance de l'EBITDA constante sur toute la durée ; remboursement de la dette simplifié à un pourcentage global saisi (jamais un échéancier réel calculé à partir des flux de trésorerie de l'entreprise) ; aucun coût d'intérêt sur la dette n'est modélisé séparément ; le multiple de sortie peut être identique ou différent du multiple d'entrée implicite.",
        limites: "Un LBO réel implique un échéancier de dette précis (intérêts + capital), plusieurs tranches de dette à des coûts différents, et souvent des refinancements en cours de route — ce simulateur isole le mécanisme de l'effet de levier, pas une modélisation financière complète d'une opération réelle.",
        comprendre: "Comme la dette est fixe (son remboursement ne dépend pas de la performance de l'entreprise au-delà du minimum contractuel), toute variation de valeur de l'entreprise se reporte proportionnellement plus fortement sur le capital investi. C'est ce même mécanisme qui amplifie les gains si l'entreprise performe bien, et amplifie tout autant les pertes si elle sous-performe — voir aussi le terme Effet de levier, utilisé de façon similaire en immobilier."
      })}`;
  }

  ids.forEach(id => document.getElementById(id).addEventListener('input', update));
  update();
  tryAwardQuizPoints(`lbo-lab-${new Date().toDateString()}`, 8, {usedSimulator: true});
}

// ============================================================
// ---------- Simulateur DCF (valorisation par flux de trésorerie actualisés,
// section AMÉLIORATION de l'audit de couverture pédagogique du 25/08/2026 :
// "DCF comme outil interactif, au lieu d'un exercice à chiffres fixes" — le
// seul DCF existant jusqu'ici était une mission scénarisée à un flux unique
// figé). Réutilise computeInvestmentProjectCashFlows (mêmes hypothèses de
// CA/croissance/marge que "Faut-il investir ?") pour générer les flux
// explicites, puis computeDCFValuation (scripts/data.js) pour la valeur
// terminale — jamais une prédiction, toujours le résultat mécanique de ce
// que l'utilisateur saisit. ----------
function renderDcfLab(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;margin:0 0 8px;max-width:70ch;">Une valorisation par DCF actualise les flux de trésorerie qu'une entreprise devrait générer sur une période explicite, plus une "valeur terminale" représentant tout ce qui vient après — ajuste les hypothèses ci-dessous pour voir comment chaque paramètre pèse sur le résultat final, jamais une prédiction, seulement le résultat mécanique de ce que tu saisis.</p>
    <p style="font-size:12px;color:var(--text-dim);margin:0 0 16px;"><strong>Avant de continuer, il peut être utile de connaître :</strong> ${['WACC (coût moyen pondéré du capital)', 'VAN (Valeur Actuelle Nette)'].map(t => `<a href="bibliotheque.html#${encodeURIComponent(t.replace(/\s+/g,'-'))}" class="badge">${t}</a>`).join(' ')}</p>
    <div class="card-grid" style="grid-template-columns:1fr 1fr;">
      <div class="card">
        <div class="field"><label for="dcfCA1">Flux de trésorerie généré la 1ère année (€)</label><input type="number" id="dcfCA1" min="0" step="10000" value="1000000"></div>
        <div class="slider-row field"><label for="dcfGrowth">Croissance annuelle de ce flux <span class="v mono" id="valDcfGrowth">5 %</span></label><input type="range" id="dcfGrowth" min="-10" max="30" step="1" value="5"></div>
        <div class="slider-row field"><label for="dcfMargin">Part convertie en flux de trésorerie disponible <span class="v mono" id="valDcfMargin">100 %</span></label><input type="range" id="dcfMargin" min="10" max="100" step="5" value="100"></div>
        <div class="slider-row field"><label for="dcfYears">Durée de la période explicite <span class="v mono" id="valDcfYears">5 ans</span></label><input type="range" id="dcfYears" min="1" max="15" step="1" value="5"></div>
        <div class="slider-row field"><label for="dcfWacc">Taux d'actualisation (WACC) <span class="v mono" id="valDcfWacc">8 %</span></label><input type="range" id="dcfWacc" min="1" max="20" step="0.5" value="8"></div>
        <div class="slider-row field" style="margin-bottom:0;"><label for="dcfTerminalGrowth">Croissance perpétuelle après la période explicite <span class="v mono" id="valDcfTerminalGrowth">2 %</span></label><input type="range" id="dcfTerminalGrowth" min="0" max="5" step="0.25" value="2"></div>
      </div>
      <div class="card">
        <h3>Résultat</h3>
        <div id="dcfLabResult" style="margin-top:12px;"></div>
      </div>
    </div>`;

  const ids = ['dcfCA1','dcfGrowth','dcfMargin','dcfYears','dcfWacc','dcfTerminalGrowth'];
  const get = id => +document.getElementById(id).value || 0;

  function update(){
    document.getElementById('valDcfGrowth').textContent = get('dcfGrowth') + ' %';
    document.getElementById('valDcfMargin').textContent = get('dcfMargin') + ' %';
    document.getElementById('valDcfYears').textContent = get('dcfYears') + ' ans';
    document.getElementById('valDcfWacc').textContent = get('dcfWacc') + ' %';
    document.getElementById('valDcfTerminalGrowth').textContent = get('dcfTerminalGrowth') + ' %';

    const ca1 = get('dcfCA1');
    const croissance = get('dcfGrowth');
    const margeConversion = get('dcfMargin');
    const duree = get('dcfYears');
    const wacc = get('dcfWacc');
    const terminalGrowth = get('dcfTerminalGrowth');

    const cashFlows = computeInvestmentProjectCashFlows(ca1, croissance, margeConversion, duree);
    const resultEl = document.getElementById('dcfLabResult');
    const r = computeDCFValuation(cashFlows, wacc, terminalGrowth);
    if(!r){
      resultEl.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Hypothèses invalides : le taux d'actualisation (WACC) doit rester strictement supérieur à la croissance perpétuelle retenue, sans quoi la valeur terminale diverge mathématiquement — une entreprise ne peut pas croître indéfiniment plus vite que son coût du capital.</p>`;
      return;
    }

    resultEl.innerHTML = `
      ${renderDataBadge('calcul')}
      <div class="result-row" style="margin-top:10px;">
        <span>Valeur actuelle des flux explicites</span><span class="mono">${fmtEUR(r.pvOfExplicitFlows)}</span>
      </div>
      <div class="result-row">
        <span>Valeur terminale actualisée</span><span class="mono">${fmtEUR(r.discountedTerminalValue)}</span>
      </div>
      <div class="result-row">
        <span>Valeur d'entreprise totale</span><span class="mono" style="color:var(--gold-bright);font-size:18px;">${fmtEUR(r.enterpriseValue)}</span>
      </div>
      <p style="font-size:13px;margin-top:14px;color:var(--text-dim);">La valeur terminale représente <strong style="color:${r.terminalValueSharePct > 60 ? 'var(--bordeaux)' : 'var(--text)'};">${r.terminalValueSharePct.toFixed(0)} %</strong> de la valeur totale — c'est normal et fréquent dans un DCF réel (souvent 60 à 80 %), mais cela signifie aussi que la majeure partie du résultat dépend d'une hypothèse de croissance perpétuelle lointaine et incertaine, pas des flux explicitement projetés.</p>
      ${renderMethodologyPanel({
        calcul: "Valeur d'entreprise = valeur actuelle des flux explicites (chaque flux actualisé au WACC) + valeur terminale actualisée. Valeur terminale = flux de la dernière année × (1 + croissance perpétuelle) ÷ (WACC − croissance perpétuelle), elle-même actualisée sur la durée de la période explicite — le modèle de croissance perpétuelle de Gordon, l'approche la plus courante.",
        donnees: `Flux de trésorerie calculés à partir de : flux 1ère année de ${fmtEUR(ca1)}, croissance de ${croissance}%/an, part convertie en flux disponible de ${margeConversion}% — jamais une donnée de marché, uniquement tes hypothèses saisies ci-contre.`,
        hypotheses: "Croissance et taux de conversion en flux disponible constants sur toute la période explicite ; le WACC reste constant sur toute la période ; la croissance perpétuelle après la période explicite reste elle aussi constante indéfiniment.",
        limites: "Un DCF réel implique souvent des flux de trésorerie qui ne croissent pas de façon régulière, un WACC qui peut évoluer avec le risque perçu de l'entreprise, et une valeur terminale qui reste, par construction, la partie la plus incertaine du calcul (elle porte sur un horizon lointain, jamais observable). Ce simulateur isole le mécanisme du DCF, pas une valorisation d'entreprise réelle.",
        comprendre: "Le DCF est très sensible à deux hypothèses en particulier : le WACC et la croissance perpétuelle. Un petit écart entre les deux (WACC proche de la croissance perpétuelle) fait exploser la valeur terminale — teste-le en rapprochant les deux curseurs pour voir cette sensibilité en direct, une limite structurelle de la méthode, pas un bug du calculateur."
      })}`;
  }

  ids.forEach(id => document.getElementById(id).addEventListener('input', update));
  update();
  tryAwardQuizPoints(`dcf-lab-${new Date().toDateString()}`, 8, {usedSimulator: true});
}
