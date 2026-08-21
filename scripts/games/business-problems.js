/* ============================================================
   LIKANZA ACADEMY — « J'ai un problème » (business-problems-data.js)
   Grille de problèmes courants ⇄ fiche : notions liées (Bibliothèque),
   cas réel confronté au même problème (via le tag partagé avec
   BUSINESS_CASES, si un cas correspond), outil du Business Lab quand
   pertinent, questions de réflexion. Jamais une recommandation
   unique : toujours plusieurs pistes, jamais un "fais ceci".
   ============================================================ */

function renderBusinessProblemFinder(elId, opts){
  const el = document.getElementById(elId);
  if(!el) return;
  const businessLabElId = (opts && opts.businessLabElId) || 'businessLab';

  function renderList(){
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:16px;">Choisis ce qui te bloque en ce moment. Pas de recette magique : des notions pour comprendre, un cas réel pour voir comment d'autres l'ont affronté, et des questions pour y réfléchir toi-même.</p>
      <div class="card-grid">
        ${BUSINESS_PROBLEMS.map(p => `
          <button type="button" class="card business-problem-card" data-problem="${p.id}" style="text-align:left;cursor:pointer;width:100%;">
            <h4 style="margin:0 0 6px;">${p.icon} ${p.titre}</h4>
            <span style="font-size:12px;color:var(--gold-bright);display:block;margin-top:10px;">Explorer →</span>
          </button>`).join('')}
      </div>`;
    el.querySelectorAll('[data-problem]').forEach(btn => btn.addEventListener('click', () => renderDetail(btn.dataset.problem)));
  }

  function fieldBlock(title, badgeKind, content){
    return `<div class="card" style="margin-bottom:14px;">
      <span class="smallcaps">${title}</span>${badgeKind ? ' ' + renderDataBadge(badgeKind) : ''}
      <div style="margin-top:8px;">${content}</div>
    </div>`;
  }

  function renderDetail(problemId){
    const p = BUSINESS_PROBLEMS.find(x => x.id === problemId);
    if(!p){ renderList(); return; }
    const relatedCases = (typeof BUSINESS_CASES !== 'undefined') ? BUSINESS_CASES.filter(c => c.tags.includes(p.tag)) : [];
    const outilHtml = !p.outil ? '' : (p.outil.type === 'lab'
      ? `<a href="#" id="${elId}-outil-btn" class="btn btn-sm btn-gold">🧮 ${p.outil.label}</a>`
      : `<a href="${p.outil.href}" class="btn btn-sm btn-gold">🔗 ${p.outil.label}</a>`);

    el.innerHTML = `
      <button type="button" class="btn btn-sm" id="${elId}-back" style="margin-bottom:14px;">← Tous les problèmes</button>
      <h3 style="margin:6px 0 12px;">${p.icon} ${p.titre}</h3>
      <p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;margin-bottom:16px;">${p.description}</p>

      ${fieldBlock('📚 Notions liées', null, p.libraryTermes.map(t => `<a href="bibliotheque.html#${encodeURIComponent(t.replace(/\s+/g,'-'))}" class="badge" style="margin:0 6px 6px 0;display:inline-block;">${t}</a>`).join(''))}
      ${outilHtml ? fieldBlock('🛠 Outil pour y voir clair', 'calcul', outilHtml) : ''}
      ${fieldBlock('🏢 Un cas réel confronté à ce problème', relatedCases.length ? 'fait' : 'avis', relatedCases.length
        ? relatedCases.map(c => `<a href="business-cases.html" style="display:block;font-size:13px;color:var(--text);margin-bottom:6px;">${c.icon} <strong>${c.entreprise}</strong> — <span style="color:var(--text-dim);">${BUSINESS_CASE_TYPE_META[c.type].label}</span></a>`).join('')
        : `<p style="font-size:13px;color:var(--text-dim);line-height:1.6;font-style:italic;">Aucun cas étudié sur Likanza n'illustre encore précisément ce problème — plutôt que de forcer un rapprochement approximatif, on préfère ne rien affirmer. D'autres cas seront ajoutés au fil du temps.</p>`)}

      <div class="card" style="margin-bottom:14px;border-color:var(--gold);">
        <span class="smallcaps">💭 Questions à te poser</span>
        <p style="font-size:12px;color:var(--text-dim);margin-top:6px;font-style:italic;">Il n'y a pas de bonne réponse universelle — ces questions t'aident à réfléchir à ta situation précise.</p>
        <ul style="font-size:13px;margin:10px 0 0 18px;">${p.questions.map(q => `<li style="margin-bottom:8px;">${q}</li>`).join('')}</ul>
      </div>`;
    document.getElementById(`${elId}-back`).addEventListener('click', renderList);
    if(p.outil && p.outil.type === 'lab'){
      const btn = document.getElementById(`${elId}-outil-btn`);
      if(btn) btn.addEventListener('click', (e) => {
        e.preventDefault();
        const labBtn = document.getElementById(`${businessLabElId}-${p.outil.id}`);
        if(labBtn){ labBtn.click(); labBtn.scrollIntoView({behavior:'smooth', block:'start'}); }
      });
    }
    tryAwardQuizPoints(`business-problem-${p.id}`, 3, {businessProblemExplored: p.id});
  }

  renderList();
}
