/* ============================================================
   LIKANZA ACADEMY — bourse-allocation.html
   3 onglets hébergeant les 3 pièces du chantier "Bourse V2" :
   Mon profil (investor-profile.js), J'ai X€ à investir
   (bourse-allocation.js : renderAllocationScenarios) et Mon
   portefeuille (bourse-allocation.js : renderPortfolioSimulator).
   Un seul mount point, pas un mur de scroll (leçon du chantier
   Business : plusieurs outils lourds sur une page = déplacer en
   onglets, pas empiler).
   ============================================================ */

function initBourseAllocationPage(){
  const el = document.getElementById('allocationHub');
  if(!el) return;
  let activeTab = 'profil';

  const TABS = [
    {value: 'profil', label: '🧠 Mon profil'},
    {value: 'capital', label: "💰 J'ai X€ à investir"},
    {value: 'portefeuille', label: '📈 Mon portefeuille'}
  ];

  function render(){
    el.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
        ${TABS.map(t => `<button type="button" class="pill ${activeTab===t.value?'active':''}" data-tab="${t.value}">${t.label}</button>`).join('')}
      </div>
      <div id="allocationHub-content"></div>`;
    el.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); }));

    if(activeTab === 'profil'){
      renderInvestorProfileWizard('allocationHub-content');
    } else if(activeTab === 'portefeuille'){
      renderPortfolioSimulator('allocationHub-content');
    } else {
      renderCapitalTab();
    }
  }

  function renderCapitalTab(){
    const contentEl = document.getElementById('allocationHub-content');
    const profile = getInvestorProfile();
    contentEl.innerHTML = `
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">Indique un montant pour voir tes valeurs suivies réparties en 3 profils de risque, à partir de données réelles — jamais une recommandation d'achat.</p>
      <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:16px;">
        <div class="field" style="max-width:200px;"><label for="allocCapitalInput">Montant (€)</label><input type="number" id="allocCapitalInput" value="${profile ? profile.capital : 1000}" min="1"></div>
        <button type="button" class="btn btn-gold" id="allocCapitalGo">Voir les scénarios</button>
      </div>
      ${!profile ? `<p style="font-size:12px;color:var(--text-dim);margin-bottom:14px;">Astuce : remplis d'abord <a href="#" id="allocGoProfil" style="color:var(--gold-bright);">Mon profil</a> pour affiner l'analyse selon ta tolérance au risque réelle.</p>` : ''}
      <div id="allocScenariosResult"></div>`;

    const goProfilLink = document.getElementById('allocGoProfil');
    if(goProfilLink) goProfilLink.addEventListener('click', (e) => { e.preventDefault(); activeTab = 'profil'; render(); });

    document.getElementById('allocCapitalGo').addEventListener('click', () => {
      const capital = +document.getElementById('allocCapitalInput').value || 0;
      if(capital <= 0) return;
      renderAllocationScenarios('allocScenariosResult', capital);
    });

    if(profile && profile.capital) renderAllocationScenarios('allocScenariosResult', profile.capital);
  }

  render();
}

initBourseAllocationPage();
