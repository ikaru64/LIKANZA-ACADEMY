// Les cotations sont d'abord affichées avec les valeurs de repli de
// MARKET_DATA, puis re-rendues quand les cotations réelles arrivent
// (événement fzr:quotes-updated émis par data.js, initLiveMarketData) —
// même pattern que marche.js, pour ne jamais laisser un badge "réel"
// afficher indéfiniment un prix figé au chargement de la page.
function renderCryptoPanel(){
  const el = document.getElementById('cryptoPanel');
  if(!el) return;
  const cryptoItems = MARKET_DATA.filter(m=>m.assetType==='crypto');
  el.innerHTML = cryptoItems.map(c=>`
  <div class="card">
    <span class="smallcaps">Cryptomonnaie</span>
    <h3>${c.nom} <span class="mono" style="font-size:12px;color:var(--text-dim);">${c.symbol}</span></h3>
    <div class="result-row"><span class="mono" style="font-size:20px;color:var(--text);">${c.valeur} ${c.devise}</span><span class="mono ${c.sens}">${c.variation}</span></div>
    <div class="card-footer"><span class="badge status-${c.statut}" title="Source : ${c.source}">${c.statusLabel}</span><span>${c.maj} · ${c.heure}</span></div>
  </div>`).join('');
}
renderCryptoPanel();
document.addEventListener('fzr:quotes-updated', ()=>safeRun('crypto (cotations)', renderCryptoPanel));

safeRun('bannière démo crypto', ()=>renderDemoBanner('cryptoDemoBanner'));
safeRun('conseil niveau crypto', ()=>renderLevelTip('levelTip', 'crypto'));

const cryptoLib = LIBRARY.filter(l=>l.categorie==='Crypto');
document.getElementById('cryptoCourses').innerHTML = cryptoLib.map(l=>`
  <div class="glossary-item">
    <button type="button" class="head" style="background:none;border:none;width:100%;text-align:left;font:inherit;" onclick="this.nextElementSibling.classList.toggle('open')"><h4>${l.terme}</h4><span class="idx">${l.niveau}</span></button>
    <div class="glossary-body">${l.detail}</div>
  </div>`).join('');

// ---------- Maîtrise crypto par sous-compétence (section 16 du prompt
// Learning Engine : "Blockchain, Tokenomics, DeFi, Security, Trading,
// Analyse" — un profil crypto indépendant mais intégré au profil global,
// jamais un seul score "crypto" agrégé qui masquerait les écarts entre
// sous-compétences). Réutilise getSkillMastery (même source que Mon
// Parcours/Financial IQ) — aucune donnée dupliquée ni recalculée ici. ----------
function renderCryptoMasteryPanel(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const categories = DOMAINS.find(d => d.key === 'crypto').quizCategories;
  const mastery = getSkillMastery();
  el.innerHTML = categories.map(cat => {
    const m = mastery.find(x => x.categorie === cat);
    return `
    <div class="card">
      <span class="smallcaps">${cat}</span>
      ${m
        ? `<div class="result-big" style="font-size:22px;margin-top:6px;">${m.pct}%</div><p style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">${m.correct}/${m.total} bonnes réponses</p>`
        : `<p style="font-size:12px;color:var(--text-dim);margin-top:8px;">Pas encore de données</p>`}
      <a href="defis.html?cat=${encodeURIComponent(cat)}" class="btn btn-sm" style="margin-top:10px;">S'entraîner →</a>
    </div>`;
  }).join('');
}
safeRun('maîtrise crypto', () => renderCryptoMasteryPanel('cryptoMastery'));
