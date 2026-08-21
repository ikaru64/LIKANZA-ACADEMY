/* ============================================================
   LIKANZA ACADEMY — Rendu du profil investisseur (investor-profile-data.js)
   Formulaire unique (capital/horizon/objectif/6 questions de risque) →
   résumé éditable. Le résultat est toujours qualifié de "profil de
   risque ESTIMÉ" — jamais une vérité psychologique. Stocké dans
   fzr-investor-profile, réutilisé par la construction d'allocation
   et par la fiche action (verdict + analyse par horizon).
   ============================================================ */

const INVESTOR_PROFILE_META = {
  prudent:  {emoji: '🟢', label: 'Prudent', desc: 'tu privilégies éviter les pertes, même au prix d\'un potentiel de gain plus limité'},
  equilibre: {emoji: '🟡', label: 'Équilibré', desc: 'tu acceptes des fluctuations en échange d\'un potentiel de gain plus élevé'},
  dynamique: {emoji: '🔴', label: 'Dynamique', desc: 'tu acceptes des fluctuations importantes en échange d\'un potentiel de gain plus élevé sur la durée'}
};

function getInvestorProfile(){ return safeGetJSON('fzr-investor-profile', null); }
function saveInvestorProfile(p){ safeSetJSON('fzr-investor-profile', p); }

function renderInvestorProfileWizard(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const existing = getInvestorProfile();

  if(existing){ renderSummary(existing); }
  else { renderForm(); }

  function renderSummary(p){
    const meta = INVESTOR_PROFILE_META[p.riskProfile];
    const horizon = INVESTOR_HORIZON_OPTIONS.find(h => h.value === p.horizon);
    const objectif = INVESTOR_OBJECTIF_OPTIONS.find(o => o.value === p.objectif);
    el.innerHTML = `
      <div class="card-grid" style="margin-bottom:14px;">
        <div class="card"><span class="smallcaps">Capital</span><div class="result-big" style="font-size:20px;margin-top:6px;">${fmtEUR(p.capital)}</div></div>
        <div class="card"><span class="smallcaps">Horizon</span><div class="result-big" style="font-size:20px;margin-top:6px;">${horizon ? horizon.label : '—'}</div><p style="font-size:11px;color:var(--text-dim);">${horizon ? horizon.detail : ''}</p></div>
        <div class="card"><span class="smallcaps">Objectif</span><div class="result-big" style="font-size:17px;margin-top:6px;">${objectif ? objectif.label : '—'}</div></div>
        <div class="card" style="border-color:var(--gold);"><span class="smallcaps">Profil de risque estimé</span> ${renderDataBadge('analyse')}<div class="result-big" style="font-size:18px;margin-top:6px;">${meta.emoji} ${meta.label}</div></div>
      </div>
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">${meta.desc}. Ce profil est une <strong>estimation</strong> basée sur tes réponses, pas un diagnostic psychologique fiable — tu peux le refaire à tout moment si ta situation change.</p>
      <button type="button" class="btn btn-sm" id="${elId}-edit">Modifier mon profil</button>`;
    document.getElementById(`${elId}-edit`).addEventListener('click', renderForm);
  }

  function renderForm(){
    const saved = existing || {};
    el.innerHTML = `
      <div class="field" style="margin-bottom:14px;">
        <label style="font-size:12.5px;color:var(--text-dim);display:block;margin-bottom:6px;">Capital disponible</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
          ${INVESTOR_CAPITAL_OPTIONS.map(c => `<button type="button" class="pill" data-capital="${c}">${fmtEUR(c)}</button>`).join('')}
        </div>
        <input type="number" id="${elId}-capital-custom" placeholder="Montant personnalisé (€)" value="${saved.capital && !INVESTOR_CAPITAL_OPTIONS.includes(saved.capital) ? saved.capital : ''}" style="max-width:220px;">
      </div>

      <div class="field" style="margin-bottom:14px;">
        <label style="font-size:12.5px;color:var(--text-dim);display:block;margin-bottom:6px;">Horizon</label>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${INVESTOR_HORIZON_OPTIONS.map(h => `<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;"><input type="radio" name="${elId}-horizon" value="${h.value}" ${saved.horizon===h.value?'checked':''} style="width:15px;height:15px;flex-shrink:0;"> ${h.label} (${h.detail})</label>`).join('')}
        </div>
      </div>

      <div class="field" style="margin-bottom:18px;">
        <label style="font-size:12.5px;color:var(--text-dim);display:block;margin-bottom:6px;">Pourquoi investis-tu ?</label>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${INVESTOR_OBJECTIF_OPTIONS.map(o => `<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;"><input type="radio" name="${elId}-objectif" value="${o.value}" ${saved.objectif===o.value?'checked':''} style="width:15px;height:15px;flex-shrink:0;"> ${o.label}</label>`).join('')}
        </div>
      </div>

      <div class="card" style="margin-bottom:14px;border-color:var(--gold);">
        <span class="smallcaps">Tolérance au risque</span>
        <p style="font-size:12px;color:var(--text-dim);margin:6px 0 14px;">Plusieurs questions, pas un simple curseur — pour estimer honnêtement ta situation.</p>
        ${INVESTOR_RISK_QUESTIONS.map(q => `
          <div style="margin-bottom:16px;">
            <p style="font-size:13.5px;margin-bottom:8px;">${q.question}</p>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${q.options.map(o => `<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;"><input type="radio" name="${elId}-risk-${q.id}" value="${o.value}" ${saved.riskAnswers && saved.riskAnswers[q.id]===o.value?'checked':''} style="width:15px;height:15px;flex-shrink:0;"> ${o.label}</label>`).join('')}
            </div>
          </div>`).join('')}
      </div>

      <button type="button" class="btn btn-gold" id="${elId}-submit">Calculer mon profil</button>
      <div id="${elId}-error" style="margin-top:10px;color:var(--bordeaux);font-size:13px;"></div>`;

    el.querySelectorAll('[data-capital]').forEach(btn => btn.addEventListener('click', () => {
      document.getElementById(`${elId}-capital-custom`).value = '';
      el.querySelectorAll('[data-capital]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }));
    if(saved.capital && INVESTOR_CAPITAL_OPTIONS.includes(saved.capital)){
      const activeBtn = el.querySelector(`[data-capital="${saved.capital}"]`);
      if(activeBtn) activeBtn.classList.add('active');
    }

    document.getElementById(`${elId}-submit`).addEventListener('click', () => {
      const errorEl = document.getElementById(`${elId}-error`);
      const customCapital = +document.getElementById(`${elId}-capital-custom`).value || 0;
      const activePill = el.querySelector('[data-capital].active');
      const capital = customCapital > 0 ? customCapital : (activePill ? +activePill.dataset.capital : 0);
      const horizonEl = document.querySelector(`input[name="${elId}-horizon"]:checked`);
      const objectifEl = document.querySelector(`input[name="${elId}-objectif"]:checked`);
      const riskAnswers = {};
      let allRiskAnswered = true;
      INVESTOR_RISK_QUESTIONS.forEach(q => {
        const checked = document.querySelector(`input[name="${elId}-risk-${q.id}"]:checked`);
        if(checked) riskAnswers[q.id] = checked.value; else allRiskAnswered = false;
      });

      if(capital <= 0 || !horizonEl || !objectifEl || !allRiskAnswered){
        errorEl.textContent = 'Complète toutes les questions avant de calculer ton profil (capital, horizon, objectif, et les 6 questions de risque).';
        return;
      }
      const risk = computeInvestorRiskProfile(riskAnswers);
      const profile = {capital, horizon: horizonEl.value, objectif: objectifEl.value, riskAnswers, riskScore: risk.score, riskMaxScore: risk.maxScore, riskProfile: risk.profile, computedAt: new Date().toISOString()};
      saveInvestorProfile(profile);
      tryAwardQuizPoints(`investor-profile-${new Date().toDateString()}`, 5, {investorProfileSet: true});
      renderSummary(profile);
    });
  }
}
