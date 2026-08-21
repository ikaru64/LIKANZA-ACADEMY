/* ============================================================
   LIKANZA ACADEMY — Business Case Studies (business-cases.html)
   Rendu de BUSINESS_CASES (business-cases-data.js) : liste filtrable
   (type + tag), fiche détaillée en 8 blocs, et « Compare Strategies »
   (cases partageant un tag, affichées côte à côte, jamais un vainqueur
   désigné). Même pattern d'état que renderBusinessStories
   (business-game.js) : liste ⇄ détail, sans framework, un seul mount
   point réutilisé.
   ============================================================ */

function renderBusinessCaseLibrary(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  let activeType = null;
  let activeTag = null;

  function filteredCases(){
    return BUSINESS_CASES.filter(c =>
      (!activeType || c.type === activeType) &&
      (!activeTag || c.tags.includes(activeTag))
    );
  }

  function renderList(){
    const list = filteredCases();
    const allTags = [...new Set(BUSINESS_CASES.flatMap(c => c.tags))];
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:16px;">${BUSINESS_CASES.length} cas réels, sourcés, choisis pour leur qualité plutôt que leur nombre. Découvre la situation, décide ce que tu aurais fait, puis compare avec ce qui s'est réellement passé.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <button type="button" class="pill ${!activeType?'active':''}" data-type="">Tous types</button>
        ${Object.entries(BUSINESS_CASE_TYPE_META).map(([key, meta]) => `<button type="button" class="pill ${activeType===key?'active':''}" data-type="${key}">${meta.emoji} ${meta.label}</button>`).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
        <button type="button" class="pill ${!activeTag?'active':''}" data-tag="">Tous les problèmes</button>
        ${allTags.map(tag => `<button type="button" class="pill ${activeTag===tag?'active':''}" data-tag="${tag}">${BUSINESS_CASE_TAG_LABELS[tag] || tag}</button>`).join('')}
      </div>
      ${list.length === 0 ? `<p style="color:var(--text-dim);font-size:13px;">Aucun cas ne correspond à cette combinaison de filtres.</p>` : `
      <div class="card-grid">
        ${list.map(c => `
          <button type="button" class="card business-case-card" data-case="${c.id}" style="text-align:left;cursor:pointer;width:100%;">
            <span class="smallcaps">${c.secteur}</span>
            <h4 style="margin:8px 0 6px;">${c.icon} ${c.entreprise}</h4>
            <span style="font-size:11px;color:var(--text-dim);">${BUSINESS_CASE_TYPE_META[c.type].emoji} ${BUSINESS_CASE_TYPE_META[c.type].label} · ${c.annee}</span>
            <p style="font-size:12px;color:var(--text-dim);margin-top:8px;">${c.tags.map(t => BUSINESS_CASE_TAG_LABELS[t] || t).join(' · ')}</p>
            <span style="font-size:12px;color:var(--gold-bright);display:block;margin-top:10px;">Découvrir ce cas →</span>
          </button>`).join('')}
      </div>`}
      ${allTags.map(tag => list.filter(c=>c.tags.includes(tag)).length >= 2 ? '' : '').join('')}
      <div id="${elId}-compare-hint" style="margin-top:18px;"></div>`;

    el.querySelectorAll('[data-type]').forEach(btn => btn.addEventListener('click', () => { activeType = btn.dataset.type || null; renderList(); }));
    el.querySelectorAll('[data-tag]').forEach(btn => btn.addEventListener('click', () => { activeTag = btn.dataset.tag || null; renderList(); }));
    el.querySelectorAll('[data-case]').forEach(btn => btn.addEventListener('click', () => renderDetail(btn.dataset.case)));

    // Compare Strategies : proposé seulement quand au moins 2 cas visibles
    // partagent réellement le même tag — jamais une comparaison forcée.
    const compareHint = document.getElementById(`${elId}-compare-hint`);
    if(compareHint && activeTag && list.length >= 2){
      compareHint.innerHTML = `<a href="#" class="btn btn-sm btn-gold" id="${elId}-compare-btn">⚖️ Comparer ces ${list.length} cas sur « ${BUSINESS_CASE_TAG_LABELS[activeTag] || activeTag} »</a>`;
      document.getElementById(`${elId}-compare-btn`).addEventListener('click', (e) => { e.preventDefault(); renderCompare(activeTag); });
    }
  }

  function fieldBlock(title, badgeKind, content){
    return `<div class="card" style="margin-bottom:14px;">
      <span class="smallcaps">${title}</span> ${renderDataBadge(badgeKind)}
      <div style="margin-top:8px;">${content}</div>
    </div>`;
  }

  function renderDetail(caseId){
    const c = BUSINESS_CASES.find(x => x.id === caseId);
    if(!c){ renderList(); return; }
    const meta = BUSINESS_CASE_TYPE_META[c.type];
    el.innerHTML = `
      <button type="button" class="btn btn-sm" id="${elId}-back" style="margin-bottom:14px;">← Tous les cas</button>
      <span class="smallcaps">${c.secteur} · ${c.annee}</span>
      <h3 style="margin:6px 0 4px;">${c.icon} ${c.entreprise}</h3>
      <span style="font-size:12px;color:var(--text-dim);">${meta.emoji} ${meta.label} · ${c.tags.map(t => BUSINESS_CASE_TAG_LABELS[t] || t).join(' · ')}</span>

      ${fieldBlock('🧩 Le contexte', 'fait', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${c.contexte}</p>`)}
      ${fieldBlock('❗ Le problème', 'analyse', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${c.probleme}</p>`)}
      ${fieldBlock('🥊 La concurrence', 'fait', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${c.concurrence}</p>`)}
      ${fieldBlock('🎯 La stratégie', 'fait', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${c.strategie}</p>`)}
      ${fieldBlock('📊 Les résultats', 'fait', c.resultats.map(r => `<p style="font-size:13px;color:var(--text-dim);margin-bottom:8px;">${r.texte} <em style="color:var(--text-dim);">— ${r.source}</em> <a href="${r.sourceUrl}" target="_blank" rel="noopener" style="color:var(--gold-bright);font-size:11.5px;">Source ↗</a></p>`).join(''))}
      ${fieldBlock('⚠️ Les limites', 'avis', `<ul style="font-size:12.5px;color:var(--text-dim);margin:0 0 0 18px;">${c.limites.map(l => `<li style="margin-bottom:6px;">${l}</li>`).join('')}</ul>`)}
      ${fieldBlock('💡 Ce qu\'on peut retenir', 'analyse', `<p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${c.retenir}</p>`)}

      <div class="card" style="margin-bottom:14px;border-color:var(--gold);">
        <span class="smallcaps">🛠 Applique-le à ton cas</span>
        <p style="font-size:12px;color:var(--text-dim);margin-top:6px;font-style:italic;">Une stratégie qui a fonctionné pour ${c.entreprise} n'est pas automatiquement adaptée à ton projet — ces questions t'aident à réfléchir, elles ne te disent pas quoi faire.</p>
        <ul style="font-size:13px;margin:10px 0 0 18px;">${c.appliqueQuestions.map(q => `<li style="margin-bottom:8px;">${q}</li>`).join('')}</ul>
      </div>`;
    document.getElementById(`${elId}-back`).addEventListener('click', renderList);
    tryAwardQuizPoints(`business-case-${c.id}`, 5, {businessCaseStudied: c.id});
  }

  // ---------- Compare Strategies : cases partageant un tag, côte à côte,
  // jamais de vainqueur désigné — juste ce qui diffère entre elles. ----------
  function renderCompare(tag){
    const cases = BUSINESS_CASES.filter(c => c.tags.includes(tag));
    el.innerHTML = `
      <button type="button" class="btn btn-sm" id="${elId}-back" style="margin-bottom:14px;">← Tous les cas</button>
      <span class="smallcaps">Compare Strategies</span>
      <h3 style="margin:6px 0 10px;">Comment ces entreprises ont abordé : ${BUSINESS_CASE_TAG_LABELS[tag] || tag}</h3>
      <div class="card-grid">
        ${cases.map(c => `
          <div class="card">
            <span class="smallcaps">${BUSINESS_CASE_TYPE_META[c.type].emoji} ${c.secteur}</span>
            <h4 style="margin:8px 0 6px;">${c.icon} ${c.entreprise}</h4>
            <p style="font-size:12.5px;color:var(--text-dim);"><strong style="color:var(--text);">Problème :</strong> ${c.probleme}</p>
            <p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;"><strong style="color:var(--text);">Approche :</strong> ${c.strategie}</p>
            <button type="button" class="btn btn-sm" style="margin-top:10px;" data-case="${c.id}">Voir le cas complet →</button>
          </div>`).join('')}
      </div>
      <p class="disclaimer-box" style="margin-top:16px;">${renderDataBadge('avis')} Ces entreprises avaient des ressources, des marchés et des contraintes différentes — il n'existe pas une seule bonne stratégie face à ce problème. Ce qui a fonctionné pour l'une ne garantit rien pour une autre.</p>`;
    document.getElementById(`${elId}-back`).addEventListener('click', renderList);
    el.querySelectorAll('[data-case]').forEach(btn => btn.addEventListener('click', () => renderDetail(btn.dataset.case)));
  }

  renderList();
}

/* ============================================================
   Hub « Décoder un business » : deux onglets qui partagent la page —
   Cas réels (renderBusinessCaseLibrary) et Modèles économiques
   (renderBusinessModelLibrary, business-models.js) — sans dupliquer
   le contenu, juste deux façons de le lire.
   ============================================================ */
function renderBusinessDecodeHub(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  let activeTab = 'cases';

  function render(){
    el.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <button type="button" class="pill ${activeTab==='cases'?'active':''}" data-tab="cases">🏢 Cas réels</button>
        <button type="button" class="pill ${activeTab==='models'?'active':''}" data-tab="models">💰 Modèles économiques</button>
      </div>
      <div id="${elId}-tab-content"></div>`;
    el.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); }));
    if(activeTab === 'cases') renderBusinessCaseLibrary(`${elId}-tab-content`);
    else renderBusinessModelLibrary(`${elId}-tab-content`);
  }

  render();
}
