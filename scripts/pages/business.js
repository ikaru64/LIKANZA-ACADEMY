/* ============================================================
   LIKANZA ACADEMY — Business (business.html)
   Indicateurs de marché en direct (Yahoo Finance via /api/custom-quotes)
   + taux de dépôt BCE en direct (via /api/eco-rate, voir lib/ecb.js),
   et plusieurs widgets qui réutilisent la vraie progression déjà
   existante (renderBusinessResume/renderBusinessNiveau/
   renderBusinessQuestionDuJour/renderBusinessCasRecommande/
   renderConceptLevels/renderTopicWidget, tous dans scripts/data.js).
   Business Lab et « J'ai un problème » vivent sur business-lab.html
   (porte « Résoudre un problème »), pas ici, pour garder ce hub court.
   L'actualité économique/entreprises réelle
   vit uniquement sur actualites.html (pas de duplication ici, juste un
   lien de renvoi). Aucune donnée inventée : en cas d'échec,
   dégradation silencieuse avec un message clair, jamais un contenu
   fictif.
   ============================================================ */

const BUSINESS_INDICATORS = [
  {symbol:'^FCHI', name:'CAC 40'},
  {symbol:'^GSPC', name:'S&P 500'},
  {symbol:'^IXIC', name:'Nasdaq Composite'},
  {symbol:'^DJI', name:'Dow Jones'},
  {symbol:'^STOXX50E', name:'Euro Stoxx 50'},
  {symbol:'GC=F', name:'Or (once, futures)'},
  {symbol:'BZ=F', name:'Pétrole Brent'}
];

async function renderBusinessIndicators(){
  const el = document.getElementById('businessIndicators');
  if(!el) return;
  el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement des cours en direct…</p>`;
  try {
    const symbols = BUSINESS_INDICATORS.map(i => i.symbol).join(',');
    const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(symbols) + '&range=5d');
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const payload = await resp.json();
    const bySymbol = {};
    (payload.quotes || []).forEach(q => { bySymbol[q.symbol] = q; });
    el.innerHTML = `<span class="smallcaps">Marchés</span> ${renderDataBadge('fait')}` + BUSINESS_INDICATORS.map(ind => {
      const q = bySymbol[ind.symbol];
      if(!q) return `<div class="panel-row"><span>${ind.name}</span><span class="val mono" style="color:var(--text-dim);">Donnée temporairement indisponible</span></div>`;
      const sens = q.changePercent >= 0 ? 'up' : 'down';
      return `<div class="panel-row"><span>${ind.name}</span><span class="val ${sens} mono">${q.price.toFixed(2)} <span style="font-size:11px;">${q.changePercent>=0?'+':''}${q.changePercent.toFixed(2)}%</span></span></div>`;
    }).join('');
  } catch(err){
    el.innerHTML = `<span class="smallcaps">Marchés</span><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Donnée temporairement indisponible.</p>`;
    console.info('Likanza Academy — indicateurs Business indisponibles :', err.message);
  }
}

async function renderBusinessRate(){
  const el = document.getElementById('businessRateCard');
  if(!el) return;
  el.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">Chargement…</p>`;
  try {
    const resp = await fetch('/api/eco-rate');
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    el.innerHTML = `
      <span class="smallcaps">Taux de dépôt BCE</span> ${renderDataBadge('fait')}
      <div class="business-rate-value">${data.rate.toFixed(2)} %</div>
      <p style="font-size:11px;color:var(--text-dim);margin-top:4px;">${data.source} · au ${new Date(data.asOf).toLocaleDateString('fr-FR')}</p>
      <p style="font-size:12.5px;color:var(--text-dim);margin-top:10px;line-height:1.5;">${renderDataBadge('analyse')} C'est l'un des taux directeurs de la BCE : il influence, entre autres, le coût du crédit dans la zone euro. Historiquement, une hausse peut peser sur le crédit et l'immobilier, une baisse peut au contraire les soutenir — jamais de façon automatique ni garantie.</p>
      <div class="business-tags">
        <span class="business-tag">Épargne</span><span class="business-tag">Crédit</span><span class="business-tag">Immobilier</span><span class="business-tag">Actions</span><span class="business-tag">Pouvoir d'achat</span>
      </div>`;
  } catch(err){
    el.innerHTML = `<span class="smallcaps">Taux de dépôt BCE</span><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Donnée temporairement indisponible.</p>`;
    console.info('Likanza Academy — taux BCE indisponible :', err.message);
  }
}

renderLevelTip('levelTip', 'business');
renderBusinessResume('businessResume');
renderBusinessIndicators();
renderBusinessRate();

renderTopicWidget('businessImmobilier', {
  title: 'Immobilier',
  intro: "Acheter, investir en locatif ou comprendre un crédit : les bases pour ne pas se faire surprendre par les chiffres.",
  terms: ['Rendement locatif', 'Apport personnel', 'Effet de levier', 'Cash-flow (immobilier)', 'Charges locatives', 'Vacance locative', 'Crédit immobilier'],
  ctaLabel: "Simuler un crédit ou un rendement →",
  ctaHref: 'immobilier.html'
});

renderTopicWidget('businessMarketing', {
  title: 'Marketing',
  intro: "Se faire connaître et convaincre : les leviers pour attirer des clients et les convertir, sans dépenser au hasard.",
  terms: ['Proposition de valeur', 'Acquisition', 'SEO', 'Contenu (marketing de contenu)', 'Réseaux sociaux (marketing)', 'Publicité', 'Email marketing', 'CAC', 'Taux de conversion', 'Rétention', 'Branding'],
  ctaLabel: "Voir tout le vocabulaire Business →",
  ctaHref: 'bibliotheque.html#theme:Business'
});

renderTopicWidget('businessClients', {
  title: 'Clients',
  intro: "Comprendre qui on sert vraiment : le socle de toute proposition de valeur solide.",
  terms: ['Client idéal', 'Persona', 'Segmentation', 'Niche', 'Objections (commerciales)', 'B2B et B2C', 'LTV'],
  ctaLabel: "Voir tout le vocabulaire Business →",
  ctaHref: 'bibliotheque.html#theme:Business'
});

renderConceptLevels('businessLevelPib', 'PIB (Produit intérieur brut)');
renderConceptLevels('businessLevelTaux', "Taux d'intérêt directeur");
renderConceptLevels('businessLevelLevier', "Effet de levier");
renderBusinessQuestionDuJour('businessQuestion');
renderBusinessCasRecommande('businessCasRecommande');
renderBusinessNiveau('businessNiveau');
renderBusinessProfile('businessProfile');
