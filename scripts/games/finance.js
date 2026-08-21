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
