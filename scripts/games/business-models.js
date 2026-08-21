/* ============================================================
   LIKANZA ACADEMY — Bibliothèque de Business Models
   Rendu de BUSINESS_MODELS (business-models-data.js) : liste ⇄ fiche
   détaillée, même pattern que renderBusinessCaseLibrary. Quand un
   modèle référence un cas réel (caseId), la fiche va chercher
   l'entreprise et un résultat sourcé directement dans BUSINESS_CASES
   plutôt que d'écrire un nouvel exemple — zéro exemple inventé.
   ============================================================ */

function renderBusinessModelLibrary(elId){
  const el = document.getElementById(elId);
  if(!el) return;

  function renderList(){
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:16px;">${BUSINESS_MODELS.length} façons différentes de faire rentrer de l'argent dans un business. Aucune n'est "la meilleure" : chacune dépend de ce que tu vends, à qui, et comment.</p>
      <div class="card-grid">
        ${BUSINESS_MODELS.map(m => `
          <button type="button" class="card business-model-card" data-model="${m.id}" style="text-align:left;cursor:pointer;width:100%;">
            <h4 style="margin:0 0 6px;">${m.icon} ${m.nom}</h4>
            <p style="font-size:12.5px;color:var(--text-dim);line-height:1.5;">${m.commentCaMarche}</p>
            <span style="font-size:12px;color:var(--gold-bright);display:block;margin-top:10px;">Voir le détail →</span>
          </button>`).join('')}
      </div>`;
    el.querySelectorAll('[data-model]').forEach(btn => btn.addEventListener('click', () => renderDetail(btn.dataset.model)));
  }

  function fieldBlock(title, badgeKind, content){
    return `<div class="card" style="margin-bottom:14px;">
      <span class="smallcaps">${title}</span> ${renderDataBadge(badgeKind)}
      <div style="margin-top:8px;">${content}</div>
    </div>`;
  }

  function exempleBlock(m){
    if(!m.caseId){
      return fieldBlock('🔎 Exemple réel', 'avis', `<p style="font-size:13px;color:var(--text-dim);line-height:1.6;font-style:italic;">Aucun cas étudié sur Likanza n'illustre encore précisément ce modèle — plutôt que d'inventer un exemple, on préfère ne rien affirmer. D'autres cas seront ajoutés au fil du temps.</p>`);
    }
    const c = (typeof BUSINESS_CASES !== 'undefined') ? BUSINESS_CASES.find(x => x.id === m.caseId) : null;
    if(!c){
      return fieldBlock('🔎 Exemple réel', 'avis', `<p style="font-size:13px;color:var(--text-dim);line-height:1.6;font-style:italic;">Aucun cas étudié sur Likanza n'illustre encore précisément ce modèle.</p>`);
    }
    const r = c.resultats[0];
    return fieldBlock('🔎 Exemple réel', 'fait', `
      <p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;"><strong style="color:var(--text);">${c.icon} ${c.entreprise}</strong> — ${r.texte} <em style="color:var(--text-dim);">— ${r.source}</em> <a href="${r.sourceUrl}" target="_blank" rel="noopener" style="color:var(--gold-bright);font-size:11.5px;">Source ↗</a></p>
      <a href="business-cases.html" style="font-size:12px;color:var(--gold-bright);display:inline-block;margin-top:6px;">Voir la fiche complète de ${c.entreprise} →</a>`);
  }

  function renderDetail(modelId){
    const m = BUSINESS_MODELS.find(x => x.id === modelId);
    if(!m){ renderList(); return; }
    el.innerHTML = `
      <button type="button" class="btn btn-sm" id="${elId}-back" style="margin-bottom:14px;">← Tous les modèles</button>
      <h3 style="margin:6px 0 12px;">${m.icon} ${m.nom}</h3>

      ${fieldBlock('⚙️ Comment ça marche', 'fait', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${m.commentCaMarche}</p>`)}
      ${fieldBlock('💰 Qui paie, et quand', 'fait', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;"><strong style="color:var(--text);">Qui paie :</strong> ${m.quiPaie}<br><strong style="color:var(--text);">Quand :</strong> ${m.quand}</p>`)}
      ${fieldBlock('📈 D\'où vient le revenu', 'fait', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${m.revenus}</p>`)}
      ${fieldBlock('🧾 Coûts principaux', 'fait', `<ul style="font-size:12.5px;color:var(--text-dim);margin:0 0 0 18px;">${m.coutsPrincipaux.map(c2 => `<li style="margin-bottom:6px;">${c2}</li>`).join('')}</ul>`)}
      ${fieldBlock('⚠️ Risques', 'avis', `<ul style="font-size:12.5px;color:var(--text-dim);margin:0 0 0 18px;">${m.risques.map(r => `<li style="margin-bottom:6px;">${r}</li>`).join('')}</ul>`)}
      ${fieldBlock('🎯 Dans quels cas c\'est pertinent', 'analyse', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${m.pertinence}</p>`)}
      ${exempleBlock(m)}
    `;
    document.getElementById(`${elId}-back`).addEventListener('click', renderList);
    tryAwardQuizPoints(`business-model-${m.id}`, 3, {businessModelStudied: m.id});
  }

  renderList();
}
