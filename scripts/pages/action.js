/* ============================================================
   LIKANZA ACADEMY — Fiche action détaillée (action.html)
   Cours + graphique sur l'année écoulée (Yahoo Finance, réel),
   données fondamentales si l'action fait partie des 8 valeurs de
   démonstration (scripts/app.js:STOCKS_DEMO), description de la
   société (voir /api/company-profile) et analyse technique
   factuelle (computeTechnicalIndicators, scripts/data.js) — jamais
   un signal d'achat/vente. Le ticker est lu dans le hash de l'URL,
   même convention que marche.html/marche.js.
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

  const demo = STOCKS_DEMO.find(s => s.ticker === ticker);
  const nom = demo ? demo.nom : ticker;
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

  const price = quote ? quote.price : (demo ? demo.prix : null);
  const changePercent = quote ? quote.changePercent : (demo ? demo.variation : null);
  const history = quote && Array.isArray(quote.history) ? quote.history : (demo ? demo.history : null);

  const headerHtml = `
    <div class="card">
      <span class="smallcaps">${demo ? demo.secteur + ' · ' + demo.pays : 'Cours en direct uniquement'}</span>
      <h3 style="margin-top:6px;">${nom} <span class="mono" style="font-size:13px;color:var(--text-dim);">${ticker}</span></h3>
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:12px 0;">
        ${typeof price === 'number' && typeof changePercent === 'number'
          ? `<span class="result-big">${price.toFixed(2)} €</span><span class="mono" style="font-size:18px;color:${changePercent>=0?'var(--emerald)':'var(--bordeaux)'}">${changePercent>=0?'+':''}${changePercent.toFixed(2)}%</span>`
          : `<span class="result-big" style="color:var(--text-dim);">n.d.</span>`}
      </div>
      ${quoteError ? `<p style="font-size:12px;color:var(--text-dim);">Cotation en direct momentanément indisponible${demo ? ' : valeur de démonstration affichée' : ''}.</p>` : ''}
      <div style="margin-top:12px;">
        <button class="fav-btn" data-fav-id="action-${ticker}" data-fav-title="${nom}" data-fav-url="action.html#${encodeURIComponent(ticker)}" data-fav-type="Action">${ICONS.star} Favoris</button>
      </div>
    </div>`;

  const chartHtml = `
    <div class="card">
      <h3>Graphique — sur l'année écoulée</h3>
      ${history ? renderSparklineHTML(history, {source: 'Yahoo Finance'}) : `<p style="font-size:12.5px;color:var(--text-dim);">Graphique indisponible pour le moment.</p>`}
    </div>`;

  const fundamentalsHtml = demo ? `
    <div class="card" id="companyFundamentalsCard">
      <h3>Données fondamentales</h3>
      <p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Chargement des données réelles…</p>
    </div>` : `
    <div class="card">
      <h3>Données fondamentales</h3>
      <p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Non disponibles pour cette action : seul le cours en direct est affiché ici. Le Comparateur, les Scénarios et le simulateur de Dividendes (page Bourse) restent réservés aux 8 valeurs suivies, pour lesquelles Likanza peut récupérer des fondamentaux réels.</p>
    </div>`;

  const editorial = demo ? COMPANY_EDITORIAL[ticker] : null;
  // Résumé/business model : contenu déjà rédigé (COMPANY_EDITORIAL), disponible
  // immédiatement sans attendre le fetch — jusqu'ici affiché uniquement dans le
  // Comparateur à 2 titres de bourse.html, jamais sur la fiche individuelle.
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
    ${demo ? `<div class="card-grid" style="margin-top:16px;">
      <div class="card" id="thesisCard" style="display:none;"></div>
      <div class="card" id="consensusCard" style="display:none;"></div>
    </div>` : ''}
    <div class="card" id="technicalCard" style="margin-top:16px;"></div>
    ${demo ? `<div class="card" id="thematicNewsCard" style="margin-top:16px;display:none;"></div>` : ''}
    <p class="disclaimer-box" style="margin-top:16px;">Ces informations sont fournies à titre pédagogique, en différé. Elles ne constituent ni un conseil en investissement, ni une incitation à acheter ou vendre.</p>`;

  initFavButtons();

  // ---------- Analyse technique (synchrone, à partir de l'historique déjà récupéré) ----------
  const techEl = document.getElementById('technicalCard');
  const tech = history ? computeTechnicalIndicators(history) : null;
  if(techEl){
    if(tech){
      const lines = [`Plus haut sur ${tech.days} séances : ${tech.periodHigh.toFixed(2)} € · Plus bas : ${tech.periodLow.toFixed(2)} €`];
      if(tech.ma20) lines.push(`Le cours est actuellement ${tech.ma20.above ? 'au-dessus' : 'en dessous'} de sa moyenne mobile 20 jours (${tech.ma20.value.toFixed(2)} €, ${tech.ma20.diffPct>=0?'+':''}${tech.ma20.diffPct.toFixed(1)}%)`);
      if(tech.ma50) lines.push(`Le cours est actuellement ${tech.ma50.above ? 'au-dessus' : 'en dessous'} de sa moyenne mobile 50 jours (${tech.ma50.value.toFixed(2)} €, ${tech.ma50.diffPct>=0?'+':''}${tech.ma50.diffPct.toFixed(1)}%)`);
      techEl.innerHTML = `<h3>Analyse technique</h3>${lines.map(l=>`<p class="coach-msg" style="margin-top:8px;">→ ${l}</p>`).join('')}<p style="font-size:11.5px;color:var(--text-dim);margin-top:10px;">Indicateurs factuels calculés sur les prix réels — ne constituent jamais un conseil d'achat ou de vente.</p>`;
    } else {
      techEl.innerHTML = `<h3>Analyse technique</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Historique insuffisant pour calculer des indicateurs techniques.</p>`;
    }
  }

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
        const ff = profile.fundamentals ? profile.fundamentals.fields : null;
        if(fundCard){
          if(!ff){
            fundCard.innerHTML = `<h3>Données fondamentales</h3><p style="color:var(--text-dim);font-size:13px;margin-top:8px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`;
          } else {
            fundCard.innerHTML = `
              <h3>Données fondamentales</h3>
              <p style="margin-top:8px;">PER ${formatFundamentalValue('trailingPE', ff.trailingPE)} · Rendement ${formatFundamentalValue('dividendYield', ff.dividendYield)} · Capitalisation ${formatFundamentalValue('marketCap', ff.marketCap)} · Chiffre d'affaires ${formatFundamentalValue('totalRevenue', ff.totalRevenue)}</p>
              <p style="margin-top:6px;color:var(--text-dim);font-size:13px;">Marge nette ${formatFundamentalValue('profitMargins', ff.profitMargins)} · ROE ${formatFundamentalValue('returnOnEquity', ff.returnOnEquity)} · EV/EBITDA ${formatFundamentalValue('evToEbitda', ff.evToEbitda)}${demo && demo.pea ? ' · <span style="color:var(--emerald)">Éligible PEA</span>' : ''}</p>
              <p style="margin-top:8px;">${renderDataBadge('fait')}</p>
              <div id="whyPER" style="margin-top:10px;"></div>
              <div id="whyDividend" style="margin-top:6px;"></div>
              <div id="whyROE" style="margin-top:6px;"></div>`;
            renderWhyDrawer('whyPER', {fieldKey: 'trailingPE', companySymbol: ticker});
            renderWhyDrawer('whyDividend', {fieldKey: 'dividendYield', companySymbol: ticker});
            renderWhyDrawer('whyROE', {fieldKey: 'returnOnEquity', companySymbol: ticker});
          }
        }

        // ---------- Thèse favorable / prudente : réorganise des données déjà
        // calculées (deriveStrengthsWeaknesses, même primitive que le
        // Comparateur) et déjà rédigées (COMPANY_EDITORIAL.risques) — jamais
        // une thèse inventée pour l'occasion. ----------
        if(thesisCard && editorial){
          thesisCard.style.display = '';
          const sw = ff ? deriveStrengthsWeaknesses(ff) : {strengths: [], weaknesses: []};
          thesisCard.innerHTML = `
            <h3>Thèses</h3>
            <div style="margin-top:10px;">
              <p style="font-weight:600;font-size:13px;color:var(--emerald);">🐂 Thèse favorable</p>
              ${sw.strengths.length ? `<ul style="font-size:12.5px;color:var(--text-dim);margin:6px 0 0 16px;">${sw.strengths.map(s=>`<li>${s}</li>`).join('')}</ul>` : `<p style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">${FUNDAMENTALS_UNAVAILABLE_TEXT}</p>`}
            </div>
            <div style="margin-top:14px;">
              <p style="font-weight:600;font-size:13px;color:var(--bordeaux);">🐻 Thèse prudente</p>
              <ul style="font-size:12.5px;color:var(--text-dim);margin:6px 0 0 16px;">${editorial.risques.map(r=>`<li>${r}</li>`).join('')}</ul>
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
  const thematicCard = document.getElementById('thematicNewsCard');
  if(thematicCard && demo){
    fetch('/api/weekly-news')
      .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(payload => {
        const related = findThematicNews(demo.secteur, payload.articles || []);
        if(related.length === 0) return;
        thematicCard.style.display = '';
        thematicCard.innerHTML = `
          <h3>Actualités thématiquement liées au secteur "${demo.secteur}"</h3>
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
