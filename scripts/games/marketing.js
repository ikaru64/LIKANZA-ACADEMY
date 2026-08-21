/* ============================================================
   LIKANZA ACADEMY — Rendu du funnel Marketing (marketing-data.js)
   Liste ordonnée (l'ordre est l'information : c'est un funnel), cartes
   repliées par défaut — l'utilisateur clique pour approfondir plutôt
   que de tout scroller. Chaque étape peut citer un vrai cas déjà
   sourcé (via caseTag), jamais un chiffre inventé pour l'occasion.
   ============================================================ */

function renderMarketingFunnel(elId){
  const el = document.getElementById(elId);
  if(!el) return;

  function relatedCases(tag){
    if(!tag || typeof BUSINESS_CASES === 'undefined') return [];
    return BUSINESS_CASES.filter(c => c.tags.includes(tag)).slice(0, 2);
  }

  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:18px;">Du premier contact à la recommandation : 8 étapes, une vraie métrique par étape, et sa formule quand elle existe. Clique sur une étape pour voir le détail.</p>
    <div class="funnel-list">
      ${MARKETING_FUNNEL.map((s, i) => `
        <div class="card funnel-step" data-step="${s.id}" style="margin-bottom:10px;">
          <button type="button" class="funnel-step-head" data-toggle="${s.id}" style="width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;gap:12px;">
            <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--gold-bright);">${String(i+1).padStart(2,'0')}</span>
            <span style="font-size:20px;">${s.icon}</span>
            <span style="flex:1;">
              <strong style="display:block;font-size:15px;">${s.titre}</strong>
              <span style="font-size:12px;color:var(--text-dim);">${s.metrique}</span>
            </span>
            <span class="funnel-step-caret" id="${elId}-caret-${s.id}" style="color:var(--text-dim);">▾</span>
          </button>
          <div id="${elId}-body-${s.id}" style="display:none;margin-top:14px;padding-top:14px;border-top:1px solid var(--hairline);">
            <p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${s.definition}</p>
            ${s.formule ? `<p style="font-size:12.5px;margin-top:10px;"><span class="smallcaps">Formule</span> ${renderDataBadge('calcul')}<br><code style="font-size:12.5px;color:var(--gold-bright);">${s.formule}</code></p>` : ''}
            <p style="font-size:13px;color:var(--text-dim);margin-top:10px;"><strong style="color:var(--text);">Exemple :</strong> ${s.exemple}</p>
            ${relatedCases(s.caseTag).length ? `<p style="font-size:12.5px;margin-top:10px;">${renderDataBadge('fait')} ${relatedCases(s.caseTag).map(c => `<a href="business-cases.html" style="color:var(--gold-bright);">${c.icon} ${c.entreprise}</a>`).join(', ')} illustre${relatedCases(s.caseTag).length>1?'nt':''} cette étape.</p>` : ''}
            <div class="card" style="margin-top:12px;border-color:var(--gold);">
              <span class="smallcaps">💭 À toi de jouer</span>
              <p style="font-size:13px;margin-top:6px;">${s.exerciceQuestion}</p>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <div class="card" style="margin-top:20px;">
      <span class="smallcaps">⚠️ Erreurs fréquentes</span>
      <div style="margin-top:10px;">${MARKETING_MISTAKES.map(m => `<p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;"><strong style="color:var(--text);">${m.titre}</strong> — ${m.description}</p>`).join('')}</div>
    </div>
    <div class="card-grid" style="margin-top:14px;">
      <a href="business-lab.html" class="card play-tile">
        <span class="icon" style="color:var(--gold-bright);">🧪</span>
        <h4 style="margin:8px 0 4px;">Teste tes connaissances</h4>
        <p style="font-size:12.5px;">Le Business Lab propose des mises en situation réelles, pas un quiz de définitions.</p>
      </a>
      <a href="bibliotheque.html#theme:Business" class="card play-tile">
        <span class="icon" style="color:var(--gold-bright);">📚</span>
        <h4 style="margin:8px 0 4px;">Approfondir</h4>
        <p style="font-size:12.5px;">CAC, Taux de conversion, Rétention, Proposition de valeur — les définitions complètes dans la Bibliothèque.</p>
      </a>
      <a href="clients.html" class="card play-tile">
        <span class="icon" style="color:var(--gold-bright);">👥</span>
        <h4 style="margin:8px 0 4px;">Clients</h4>
        <p style="font-size:12.5px;">Le funnel amène des clients — comprendre qui ils sont vraiment complète ce sujet.</p>
      </a>
    </div>`;

  el.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const stepId = btn.dataset.toggle;
      const body = document.getElementById(`${elId}-body-${stepId}`);
      const caret = document.getElementById(`${elId}-caret-${stepId}`);
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      caret.textContent = open ? '▾' : '▴';
      if(!open) tryAwardQuizPoints(`marketing-step-${stepId}`, 2, {marketingStepViewed: stepId});
    });
  });
}
