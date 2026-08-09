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

function actionCurrentSymbol(){
  try { return decodeURIComponent(location.hash.slice(1)); }
  catch(e){ return location.hash.slice(1); }
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
    <div class="card">
      <h3>Données fondamentales</h3>
      <p style="margin-top:8px;">PER ${demo.per} · Rendement ${demo.dividende}% · Capitalisation ${demo.cap} · Chiffre d'affaires ${demo.ca}</p>
      <p style="margin-top:6px;color:var(--text-dim);font-size:13px;">Marge nette ${demo.marge_nette}% · ROE ${demo.roe}% · Dette/EBITDA ${demo.dette_ebitda}×${demo.pea ? ' · <span style="color:var(--emerald)">Éligible PEA</span>' : ''}</p>
    </div>` : `
    <div class="card">
      <h3>Données fondamentales</h3>
      <p style="color:var(--text-dim);font-size:13px;margin-top:8px;">Non disponibles pour cette action : seul le cours en direct est affiché ici. Le Comparateur, les Scénarios et le simulateur de Dividendes (page Bourse) restent réservés aux 8 valeurs à données fondamentales réelles.</p>
    </div>`;

  el.innerHTML = `
    <div class="card-grid" style="grid-template-columns:1fr 1fr;">
      ${headerHtml}
      ${chartHtml}
    </div>
    <div class="card-grid" style="grid-template-columns:1fr 1fr;margin-top:16px;">
      ${fundamentalsHtml}
      <div class="card" id="companyProfileCard" style="display:none;"></div>
    </div>
    <div class="card" id="technicalCard" style="margin-top:16px;"></div>
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

  // ---------- Description de la société (asynchrone, dégradation silencieuse) ----------
  const profileCard = document.getElementById('companyProfileCard');
  if(profileCard){
    fetch('/api/company-profile?symbol=' + encodeURIComponent(ticker))
      .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(profile => {
        profileCard.style.display = '';
        const meta = [profile.sector, profile.industry, profile.employees ? profile.employees.toLocaleString('fr-FR') + ' employés' : null].filter(Boolean).join(' · ');
        profileCard.innerHTML = `
          <h3>À propos de ${nom}</h3>
          ${meta ? `<p style="font-size:12px;color:var(--text-dim);margin:6px 0 10px;">${meta}</p>` : ''}
          <p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">${profile.summary}</p>
          ${profile.website ? `<a href="${profile.website}" target="_blank" rel="noopener" class="btn btn-sm" style="margin-top:12px;">Site officiel ↗</a>` : ''}`;
      })
      .catch(err => {
        console.info('Likanza Academy — description de société indisponible :', err.message);
      });
  }
}

safeRun('fiche action', renderActionDetail);
window.addEventListener('hashchange', () => safeRun('fiche action (navigation)', renderActionDetail));
