/* ============================================================
   LIKANZA ACADEMY — Rendu de la page Vente & Négociation (vente-data.js)
   Même shell que strategie.js/finance.js (intro/roadmap/concepts/
   conseils/erreurs/approfondir), plus l'exercice d'objections en
   accordéon (même pattern que marketing.js/clients.js) : plusieurs
   angles de réponse par objection, jamais "la bonne phrase".
   ============================================================ */

function renderVentePage(elId){
  const el = document.getElementById(elId);
  if(!el) return;

  el.innerHTML = `
    <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;margin-bottom:18px;">${VENTE_INTRO}</p>

    <div class="card" style="margin-bottom:18px;">
      <span class="smallcaps">Ce que tu vas voir</span>
      <ol style="margin:10px 0 0 20px;padding:0;font-size:13px;color:var(--text-dim);">
        ${VENTE_ROADMAP.map(r => `<li style="margin-bottom:6px;">${r}</li>`).join('')}
      </ol>
    </div>

    <div class="card" style="margin-bottom:18px;">
      <span class="smallcaps">📚 Concepts essentiels</span>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;">
        ${VENTE_CONCEPTS.map(t => `<a href="bibliotheque.html#${encodeURIComponent(t.replace(/\s+/g,'-'))}" class="badge">${t}</a>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;">
      <span class="smallcaps">🛠 Conseils actionnables</span>
      ${VENTE_CONSEILS.map(c => `
        <div style="margin-top:12px;">
          <strong style="font-size:13.5px;">${c.titre}</strong>
          <ol style="margin:8px 0 0 20px;padding:0;font-size:13px;color:var(--text-dim);">
            ${c.etapes.map(e => `<li style="margin-bottom:6px;">${e}</li>`).join('')}
          </ol>
        </div>`).join('')}
    </div>

    <span class="smallcaps">🎯 Exercice : 5 objections, plusieurs angles chacune</span>
    <p style="font-size:12px;color:var(--text-dim);margin:6px 0 10px;font-style:italic;">Il n'y a pas de bonne phrase universelle — clique sur une objection pour voir plusieurs raisonnements possibles, pas une réponse unique.</p>
    <div style="margin-bottom:18px;">
      ${VENTE_OBJECTIONS.map(o => `
        <div class="card" data-objection="${o.id}" style="margin-bottom:10px;">
          <button type="button" class="funnel-step-head" data-toggle="${o.id}" style="width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;gap:12px;">
            <strong style="flex:1;font-size:14.5px;">${o.objection}</strong>
            <span class="funnel-step-caret" id="${elId}-caret-${o.id}" style="color:var(--text-dim);">▾</span>
          </button>
          <div id="${elId}-body-${o.id}" style="display:none;margin-top:14px;padding-top:14px;border-top:1px solid var(--hairline);">
            ${o.angles.map(a => `
              <div style="margin-bottom:12px;">
                <strong style="font-size:13px;color:var(--gold-bright);">${a.titre}</strong>
                <p style="font-size:13px;color:var(--text-dim);margin-top:4px;">${a.raisonnement}</p>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    </div>

    <div class="card" style="margin-bottom:18px;">
      <span class="smallcaps">⚠️ Erreurs fréquentes</span>
      <div style="margin-top:10px;">${VENTE_MISTAKES.map(m => `<p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;"><strong style="color:var(--text);">${m.titre}</strong> — ${m.description}</p>`).join('')}</div>
    </div>

    <div class="card-grid">
      ${VENTE_APPROFONDIR.map(a => `<a href="${a.href}" class="card play-tile"><h4 style="margin:8px 0 4px;">${a.label}</h4><p style="font-size:12.5px;">${a.description}</p></a>`).join('')}
    </div>`;

  el.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const oId = btn.dataset.toggle;
      const body = document.getElementById(`${elId}-body-${oId}`);
      const caret = document.getElementById(`${elId}-caret-${oId}`);
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      caret.textContent = open ? '▾' : '▴';
      if(!open) tryAwardQuizPoints(`vente-objection-${oId}`, 2, {venteObjectionViewed: oId});
    });
  });

  tryAwardQuizPoints(`vente-page-viewed-${new Date().toDateString()}`, 3, {ventePageViewed: true});
}
