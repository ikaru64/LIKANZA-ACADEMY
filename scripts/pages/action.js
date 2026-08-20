/* ============================================================
   LIKANZA ACADEMY — Fiche action détaillée (action.html)
   Cours + graphique (Yahoo Finance, réel), fondamentaux réels,
   description de la société (/api/company-profile) et analyse
   technique factuelle (computeTechnicalIndicators, scripts/data.js)
   — jamais un signal d'achat/vente. Le ticker est lu dans le hash
   de l'URL, même convention que marche.html/marche.js.

   Ouvert à TOUTE valeur suivie (getFollowedStocks/resolveFollowedStock,
   scripts/data.js), pas seulement aux 8 valeurs curatées STOCKS_DEMO :
   /api/company-profile accepte n'importe quel symbole Yahoo valide, la
   restriction aux 8 valeurs était une limitation de câblage UI, pas une
   limite de données. Seul le contenu éditorial rédigé à la main
   (COMPANY_EDITORIAL : résumé, business model) reste curaté — jamais
   généré pour combler l'absence de rédaction vérifiée sur une valeur
   arbitraire.
   ============================================================ */

// Le ticker vient du hash de l'URL, donc potentiellement contrôlé par un
// tiers (lien partagé) : on le valide contre le format réel des symboles
// Yahoo déjà utilisés sur le site (AAPL, MC.PA, ^FCHI, GC=F...) avant de
// jamais l'injecter dans du HTML — jamais de valeur brute non validée.
const ACTION_TICKER_PATTERN = /^[A-Za-z0-9.\-^=]{1,15}$/;
function actionCurrentSymbol(){
  let sym = '';
  try { sym = decodeURIComponent(location.hash.slice(1)); }
  catch(e){ sym = location.hash.slice(1); }
  return ACTION_TICKER_PATTERN.test(sym) ? sym : '';
}

async function renderActionDetail(){
  const ticker = actionCurrentSymbol();
  const el = document.getElementById('actionDetail');
  if(!el) return;
  if(!ticker){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Choisis une action depuis la page <a href="bourse.html" style="color:var(--gold-bright);">Bourse</a>.</p>`;
    return;
  }

  const stock = resolveFollowedStock(ticker);
  const nom = stock.nom;
  document.title = `${nom} · Fiche action · Likanza Academy`;
  const crumb = document.getElementById('crumbName'); if(crumb) crumb.textContent = nom;
  const titleEl = document.getElementById('actionTitle'); if(titleEl) titleEl.textContent = nom;

  el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Chargement de la fiche…</p>`;

  let quote = null, quoteError = null;
  try {
    const resp = await fetch('/api/custom-quotes?symbols=' + encodeURIComponent(ticker) + '&range=1y');
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const payload = await resp.json();
    quote = (payload.quotes || [])[0] || null;
    if(!quote) quoteError = (payload.errors || [])[0] || 'Cotation indisponible';
  } catch(err){
    quoteError = err.message;
  }

  const price = quote ? quote.price : stock.prix;
  const changePercent = quote ? quote.changePercent : stock.variation;
  const history = quote && Array.isArray(quote.history) ? quote.history : stock.history;

  const headerHtml = `
    <div class="card">
      <span class="smallcaps" id="actionSectorLine">${stock.secteur && stock.pays ? `${stock.secteur} · ${stock.pays}` : 'Secteur non déterminé — cotation réelle'}</span>
      <h3 style="margin-top:6px;">${nom} <span class="mono" style="font-size:13px;color:var(--text-dim);">${ticker}</span></h3>
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:12px 0;">
        ${typeof price === 'number' && typeof changePercent === 'number'
          ? `<span class="result-big">${price.toFixed(2)} €</span><span class="mono" style="font-size:18px;color:${changePercent>=0?'var(--emerald)':'var(--bordeaux)'}">${changePercent>=0?'+':''}${changePercent.toFixed(2)}%</span>`
          : `<span class="result-big" style="color:var(--text-dim);">n.d.</span>`}
      </div>
      ${quoteError ? `<p style="font-size:12px;color:var(--text-dim);">Cotation en direct momentanément indisponible${stock.curated ? ' : valeur de démonstration affichée' : ''}.</p>` : ''}
      <div style="margin-top:12px;">
        <button class="fav-btn" data-fav-id="action-${ticker}" data-fav-title="${nom}" data-fav-url="action.html#${encodeURIComponent(ticker)}" data-fav-type="Action">${ICONS.star} Favoris</button>
      </div>
    </div>`;

  // Sélecteur de période : intervalles vérifiés en direct contre l'endpoint
  // Yahoo chart (voir api/custom-quotes.js) — un intervalle plus large pour
  // les longues périodes (1sem/1mois) pour ne pas imposer un payload
  // quotidien énorme, même convention que le Laboratoire financier.
  const chartHtml = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
        <h3>Cours et historique</h3>
        <div id="actionPeriodPills" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
      </div>
      <div id="actionChartBody">${history ? renderSparklineHTML(history, {source: 'Yahoo Finance'}) : `<p style="font-size:12.5px;color:var(--text-dim);">Graphique indisponible pour le moment.</p>`}</div>
    </div>`;

  // Fondamentaux tentés pour toute valeur (plus seulement les 8 curatées) :
  // /api/company-profile accepte n'importe quel symbole Yahoo réel.
  const fundamentalsHtml = `
    <div class="card" id="companyFundamentalsCard">
      <h3>Données fondamentales</h3>
      <p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Chargement des données réelles…</p>
    </div>`;

  const editorial = COMPANY_EDITORIAL[ticker];
  // Résumé/business model : contenu rédigé à la main (COMPANY_EDITORIAL),
  // volontairement limité aux 8 valeurs curatées — jamais généré pour une
  // valeur arbitraire (voir l'en-tête du fichier). Disponible immédiatement,
  // sans attendre le fetch.
  const editorialHtml = editorial ? `
    <div class="card">
      <h3>Résumé & business model</h3>
      <p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;margin-top:8px;">${editorial.resume}</p>
      <p style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-top:10px;">${editorial.businessModel}</p>
    </div>` : '';

  el.innerHTML = `
    <div class="card-grid">
      ${headerHtml}
      ${chartHtml}
    </div>
    ${editorialHtml}
    <div class="card-grid" style="margin-top:16px;">
      ${fundamentalsHtml}
      <div class="card" id="companyProfileCard" style="display:none;"></div>
    </div>
    <div class="card-grid" style="margin-top:16px;">
      <div class="card" id="thesisCard" style="display:none;"></div>
      <div class="card" id="consensusCard" style="display:none;"></div>
    </div>
    <div class="card" id="technicalCard" style="margin-top:16px;"></div>
    <div class="card" id="thematicNewsCard" style="margin-top:16px;display:none;"></div>
    <p class="disclaimer-box" style="margin-top:16px;">Ces informations sont fournies à titre pédagogique, en différé. Elles ne constituent ni un conseil en investissement, ni une incitation à acheter ou vendre.</p>`;

  initFavButtons();

  // ---------- Analyse technique (synchrone, à partir de l'historique déjà récupéré) ----------
  function renderTechnicalCard(hist){
    const techEl = document.getElementById('technicalCard');
    if(!techEl) return;
    const tech = hist ? computeTechnicalIndicators(hist) : null;
    if(tech){
      const lines = [`Plus haut sur ${tech.days} séances : ${tech.periodHigh.toFixed(2)} € · Plus bas : ${tech.periodLow.toFixed(2)} €`];
      if(tech.ma20) lines.push(`Le cours est actuellement ${tech.ma20.above ? 'au-dessus' : 'en dessous'} de sa moyenne mobile 20 jours (${tech.ma20.value.toFixed(2)} €, ${tech.ma20.diffPct>=0?'+':''}${tech.ma20.diffPct.toFixed(1)}%)`);
      if(tech.ma50) lines.push(`Le cours est actuellement ${tech.ma50.above ? 'au-dessus' : 'en dessous'} de sa moyenne mobile 50 jours (${tech.ma50.value.toFixed(2)} €, ${tech.ma50.diffPct>=0?'+':''}${tech.ma50.diffPct.toFixed(1)}%)`);
      techEl.innerHTML = `<h3>Analyse technique</h3>${lines.map(l=>`<p class="coach-msg" style="margin-top:8px;">→ ${l}</p>`).join('')}<p style="font-size:11.5px;color:var(--text-dim);margin-top:10px;">Indicateurs factuels calculés sur les prix réels — ne constituent jamais un conseil d'achat ou de vente.</p>`;
    } else {
      techEl.innerHTML = `<h3>Analyse technique</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Historique insuffisant pour calculer des indicateurs techniques.</p>`;
    }
  }
  renderTechnicalCard(history);

  // ---------- Sélecteur de période : 1j/5j/1m/3m/6m/1a/2a/5a/max, tous
  // vérifiés en direct sur l'endpoint Yahoo réel (voir api/custom-quotes.js).
  // Ne touche jamais le prix/variation affichés dans l'en-tête (toujours la
  // cotation la plus récente) — seuls le graphique et l'analyse technique se
  // recalculent sur la période choisie. ----------
  const PERIOD_OPTIONS = [
    {id:'1d', label:'1 j', range:'1d', interval:'1d'},
    {id:'5d', label:'5 j', range:'5d', interval:'1d'},
    {id:'1mo', label:'1 m', range:'1mo', interval:'1d'},
    {id:'3mo', label:'3 m', range:'3mo', interval:'1d'},
    {id:'6mo', label:'6 m', range:'6mo', interval:'1d'},
    {id:'1y', label:'1 an', range:'1y', interval:'1d'},
    {id:'2y', label:'2 ans', range:'2y', interval:'1wk'},
    {id:'5y', label:'5 ans', range:'5y', interval:'1wk'},
    {id:'max', label:'Max', range:'max', interval:'1mo'}
  ];
  const pillsEl = document.getElementById('actionPeriodPills');
  let activePeriod = '1y';
  function renderPeriodPills(){
    if(!pillsEl) return;
    pillsEl.innerHTML = PERIOD_OPTIONS.map(p => `<button type="button" class="pill ${p.id===activePeriod?'active':''}" data-period="${p.id}" style="font-size:11.5px;padding:5px 10px;">${p.label}</button>`).join('');
    pillsEl.querySelectorAll('[data-period]').forEach(btn => {
      btn.addEventListener('click', () => loadChartForPeriod(btn.dataset.period));
    });
  }
  function loadChartForPeriod(periodId){
    const opt = PERIOD_OPTIONS.find(p => p.id === periodId);
    if(!opt) return;
    activePeriod = periodId;
    renderPeriodPills();
    const bodyEl = document.getElementById('actionChartBody');
    if(bodyEl) bodyEl.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Chargement…</p>`;
    fetch(`/api/custom-quotes?symbols=${encodeURIComponent(ticker)}&range=${opt.range}&interval=${opt.interval}`)
      .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(payload => {
        const q = (payload.quotes || [])[0];
        const hist = q && Array.isArray(q.history) ? q.history : null;
        if(bodyEl) bodyEl.innerHTML = hist ? renderSparklineHTML(hist, {source: 'Yahoo Finance'}) : `<p style="font-size:12.5px;color:var(--text-dim);">Graphique indisponible pour cette période.</p>`;
        renderTechnicalCard(hist);
      })
      .catch(err => {
        console.info('Likanza Academy — historique indisponible pour cette période :', err.message);
        if(bodyEl) bodyEl.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">Graphique momentanément indisponible pour cette période.</p>`;
      });
  }
  renderPeriodPills();

  // ---------- Description de la société + fondamentaux réels (asynchrone, un seul appel) ----------
  const profileCard = document.getElementById('companyProfileCard');
  const fundCard = document.getElementById('companyFundamentalsCard');
  const thesisCard = document.getElementById('thesisCard');
  const consensusCard = document.getElementById('consensusCard');
  if(profileCard || fundCard){
    fetch('/api/company-profile?symbol=' + encodeURIComponent(ticker))
      .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(profile => {
        // Alimente le même cache partagé que bourse.js (companyFundamentalsCache,
        // scripts/data.js) : renderWhyDrawer ci-dessous s'appuie dessus, jamais
        // sur une copie locale qui pourrait diverger.
        companyFundamentalsCache[ticker] = profile;

        if(profileCard){
          profileCard.style.display = '';
          const meta = [profile.sector, profile.industry, profile.employees ? profile.employees.toLocaleString('fr-FR') + ' employés' : null].filter(Boolean).join(' · ');
          profileCard.innerHTML = `
            <h3>À propos de ${nom}</h3>
            ${meta ? `<p style="font-size:12px;color:var(--text-dim);margin:6px 0 10px;">${meta}</p>` : ''}
            <p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${profile.summary}</p>
            ${profile.website ? `<a href="${profile.website}" target="_blank" rel="noopener" class="btn btn-sm" style="margin-top:12px;">Site officiel ↗</a>` : ''}`;
        }
        // Pour une valeur non curatée, le secteur réel de Yahoo (profile.sector)
        // n'est connu qu'ici, une fois le fetch résolu — remplace le texte
        // générique de l'en-tête dès qu'il est disponible.
        if(!stock.curated && (profile.sector || profile.industry)){
          const sectorLine = document.getElementById('actionSectorLine');
          if(sectorLine) sectorLine.textContent = [profile.sector, profile.industry].filter(Boolean).join(' · ');
        }
        const ff = profile.fundamentals ? profile.fundamentals.fields : null;
        if(fundCard){
          if(!ff){
            fundCard.innerHTML = `<h3>Données fondamentales</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`;
          } else {
            fundCard.innerHTML = `
              <h3>Données fondamentales</h3>
              <p style="margin-top:8px;">PER ${formatFundamentalValue('trailingPE', ff.trailingPE)} · Rendement ${formatFundamentalValue('dividendYield', ff.dividendYield)} · Capitalisation ${formatFundamentalValue('marketCap', ff.marketCap)} · Chiffre d'affaires ${formatFundamentalValue('totalRevenue', ff.totalRevenue)}</p>
              <p style="margin-top:6px;color:var(--text-dim);font-size:13px;">Marge nette ${formatFundamentalValue('profitMargins', ff.profitMargins)} · ROE ${formatFundamentalValue('returnOnEquity', ff.returnOnEquity)} · EV/EBITDA ${formatFundamentalValue('evToEbitda', ff.evToEbitda)}${stock.pea === true ? ' · <span style="color:var(--emerald)">Éligible PEA</span>' : ''}</p>
              <p style="margin-top:8px;">${renderDataBadge('fait')}</p>
              <div id="whyPER" style="margin-top:10px;"></div>
              <div id="whyDividend" style="margin-top:6px;"></div>
              <div id="whyROE" style="margin-top:6px;"></div>`;
            renderWhyDrawer('whyPER', {fieldKey: 'trailingPE', companySymbol: ticker});
            renderWhyDrawer('whyDividend', {fieldKey: 'dividendYield', companySymbol: ticker});
            renderWhyDrawer('whyROE', {fieldKey: 'returnOnEquity', companySymbol: ticker});
          }
        }

        // ---------- Thèse favorable / prudente : la favorable se calcule pour
        // toute valeur dont les fondamentaux ont pu être chargés
        // (deriveStrengthsWeaknesses, même primitive que le Comparateur) ; la
        // prudente reprend COMPANY_EDITORIAL.risques quand la valeur est
        // curatée, sinon une note honnête plutôt qu'un risque inventé. ----------
        if(thesisCard && ff){
          thesisCard.style.display = '';
          const sw = deriveStrengthsWeaknesses(ff);
          thesisCard.innerHTML = `
            <h3>Thèses</h3>
            <div style="margin-top:10px;">
              <p style="font-weight:600;font-size:13px;color:var(--emerald);">🐂 Thèse favorable</p>
              ${sw.strengths.length ? `<ul style="font-size:12.5px;color:var(--text-dim);margin:6px 0 0 16px;">${sw.strengths.map(s=>`<li>${s}</li>`).join('')}</ul>` : `<p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`}
            </div>
            <div style="margin-top:14px;">
              <p style="font-weight:600;font-size:13px;color:var(--bordeaux);">🐻 Thèse prudente</p>
              ${editorial
                ? `<ul style="font-size:12.5px;color:var(--text-dim);margin:6px 0 0 16px;">${editorial.risques.map(r=>`<li>${r}</li>`).join('')}</ul>`
                : `${sw.weaknesses.length ? `<ul style="font-size:12.5px;color:var(--text-dim);margin:6px 0 0 16px;">${sw.weaknesses.map(w=>`<li>${w}</li>`).join('')}</ul>` : ''}<p style="font-size:11.5px;color:var(--text-dim);margin-top:6px;font-style:italic;">Analyse éditoriale non disponible pour cette valeur — seuls les points calculables à partir des vrais fondamentaux sont listés ici.</p>`}
            </div>
            <p style="font-size:11px;color:var(--text-dim);margin-top:12px;font-style:italic;">${renderDataBadge('avis')} Deux lectures possibles des mêmes faits — ni l'une ni l'autre n'est "la vérité" sur cette entreprise.</p>`;
        }

        // ---------- Consensus analystes : même primitive que l'onglet Scénarios
        // de bourse.html (formatAnalystConsensus), jamais affichée jusqu'ici sur
        // la fiche individuelle d'un titre. ----------
        if(consensusCard){
          const consensus = profile.fundamentals ? formatAnalystConsensus(profile.fundamentals) : null;
          consensusCard.style.display = '';
          if(!consensus){
            consensusCard.innerHTML = `<h3>Consensus analystes</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`;
          } else {
            consensusCard.innerHTML = `
              <h3>Consensus analystes</h3> ${renderDataBadge('fait')}
              <p style="font-size:15px;margin-top:8px;">${consensus.label}</p>
              <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${consensus.total} analyste${consensus.total>1?'s':''} · ${consensus.breakdown.strongBuy} achat fort · ${consensus.breakdown.buy} achat · ${consensus.breakdown.hold} conserver · ${consensus.breakdown.sell} vente · ${consensus.breakdown.strongSell} vente forte</p>
              <p style="font-size:11px;color:var(--text-dim);margin-top:10px;">Estimations professionnelles réelles, pas une garantie — voir l'onglet Scénarios de la page Bourse pour une projection chiffrée.</p>`;
          }
        }
      })
      .catch(err => {
        console.info('Likanza Academy — description/fondamentaux de société indisponibles :', err.message);
        if(fundCard) fundCard.innerHTML = `<h3>Données fondamentales</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`;
        if(thesisCard) thesisCard.style.display = 'none';
        if(consensusCard) consensusCard.style.display = 'none';
      });
  }

  // ---------- Actualités thématiquement liées au secteur (proximité, jamais un badge directionnel) ----------
  // Limité aux valeurs curatées : SECTOR_KEYWORDS (scripts/data.js) est
  // indexé sur les libellés français de secteur curatés (STOCKS_DEMO), pas
  // sur la taxonomie anglaise renvoyée par Yahoo (profile.sector) pour une
  // valeur arbitraire — étendre ce mapping est hors scope de ce chantier.
  const thematicCard = document.getElementById('thematicNewsCard');
  if(thematicCard && stock.curated && stock.secteur){
    fetch('/api/weekly-news')
      .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(payload => {
        const related = findThematicNews(stock.secteur, payload.articles || []);
        if(related.length === 0) return;
        thematicCard.style.display = '';
        thematicCard.innerHTML = `
          <h3>Actualités thématiquement liées au secteur "${stock.secteur}"</h3>
          <p style="font-size:12px;color:var(--text-dim);margin:6px 0 12px;">Simple proximité de thème avec les actualités réelles de la semaine — pas une affirmation que ces actualités vont influencer ce titre précis.</p>
          ${related.map(a => `<p style="font-size:13px;margin-bottom:8px;"><a href="actualites.html#${a.slug}" style="color:var(--gold-bright);">${a.titre}</a></p>`).join('')}
          ${renderNewsApprofondirLink(related[0].categorie)}`;
      })
      .catch(err => {
        console.info('Likanza Academy — actualités thématiques indisponibles :', err.message);
      });
  }
}

safeRun('fiche action', renderActionDetail);
window.addEventListener('hashchange', () => safeRun('fiche action (navigation)', renderActionDetail));
