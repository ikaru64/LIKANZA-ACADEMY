const cryptoItems = MARKET_DATA.filter(m=>m.assetType==='crypto');
document.getElementById('cryptoPanel').innerHTML = cryptoItems.map(c=>`
  <div class="card">
    <span class="smallcaps">Cryptomonnaie</span>
    <h3>${c.nom} <span class="mono" style="font-size:12px;color:var(--text-dim);">${c.symbol}</span></h3>
    <div class="result-row"><span class="mono" style="font-size:20px;color:var(--text);">${c.valeur} ${c.devise}</span><span class="mono ${c.sens}">${c.variation}</span></div>
    <div class="card-footer"><span class="badge status-${c.statut}" title="Source : ${c.source}">${c.statusLabel}</span><span>${c.maj} · ${c.heure}</span></div>
  </div>`).join('');
safeRun('bannière démo crypto', ()=>renderDemoBanner('cryptoDemoBanner'));

const cryptoLib = LIBRARY.filter(l=>l.categorie==='Crypto');
document.getElementById('cryptoCourses').innerHTML = cryptoLib.map(l=>`
  <div class="glossary-item">
    <div class="head" onclick="this.nextElementSibling.classList.toggle('open')"><h4>${l.terme}</h4><span class="idx">${l.niveau}</span></div>
    <div class="glossary-body">${l.detail}</div>
  </div>`).join('');
