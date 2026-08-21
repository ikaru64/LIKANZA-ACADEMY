/* ============================================================
   LIKANZA ACADEMY — Rendu du guide Clients (clients-data.js)
   Même pattern que renderMarketingFunnel : cartes repliées par
   défaut, clic pour approfondir. Le sujet "Persona" affiche un
   avertissement explicite (prudence) plutôt qu'un exemple chiffré.
   ============================================================ */

function renderClientsGuide(elId){
  const el = document.getElementById(elId);
  if(!el) return;

  function relatedCases(tag){
    if(!tag || typeof BUSINESS_CASES === 'undefined') return [];
    return BUSINESS_CASES.filter(c => c.tags.includes(tag)).slice(0, 2);
  }

  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:18px;">Comprendre qui on sert vraiment : 7 sujets, clique pour approfondir chacun.</p>
    <div class="clients-list">
      ${CLIENTS_TOPICS.map(t => `
        <div class="card clients-topic" data-topic="${t.id}" style="margin-bottom:10px;">
          <button type="button" class="funnel-step-head" data-toggle="${t.id}" style="width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;gap:12px;">
            <span style="font-size:20px;">${t.icon}</span>
            <strong style="flex:1;font-size:15px;">${t.titre}</strong>
            <span class="funnel-step-caret" id="${elId}-caret-${t.id}" style="color:var(--text-dim);">▾</span>
          </button>
          <div id="${elId}-body-${t.id}" style="display:none;margin-top:14px;padding-top:14px;border-top:1px solid var(--hairline);">
            <p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${t.definition}</p>
            ${t.prudence ? `<p style="font-size:12.5px;margin-top:10px;">${renderDataBadge('avis')} ${t.prudence}</p>` : ''}
            <p style="font-size:13px;color:var(--text-dim);margin-top:10px;"><strong style="color:var(--text);">Exemple :</strong> ${t.exemple}</p>
            ${relatedCases(t.caseTag).length ? `<p style="font-size:12.5px;margin-top:10px;">${renderDataBadge('fait')} ${relatedCases(t.caseTag).map(c => `<a href="business-cases.html" style="color:var(--gold-bright);">${c.icon} ${c.entreprise}</a>`).join(', ')} illustre${relatedCases(t.caseTag).length>1?'nt':''} ce sujet.</p>` : ''}
            <div class="card" style="margin-top:12px;border-color:var(--gold);">
              <span class="smallcaps">💭 À toi de jouer</span>
              <p style="font-size:13px;margin-top:6px;">${t.exerciceQuestion}</p>
            </div>
          </div>
        </div>`).join('')}
    </div>`;

  el.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const topicId = btn.dataset.toggle;
      const body = document.getElementById(`${elId}-body-${topicId}`);
      const caret = document.getElementById(`${elId}-caret-${topicId}`);
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      caret.textContent = open ? '▾' : '▴';
      if(!open) tryAwardQuizPoints(`clients-topic-${topicId}`, 2, {clientsTopicViewed: topicId});
    });
  });
}
