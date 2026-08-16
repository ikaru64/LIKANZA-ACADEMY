renderLevelTip('levelTip', 'personalFinance');

// Budget
['budgetRevenu','budgetLoyer','budgetFixe','budgetVariable'].forEach(id=>document.getElementById(id).addEventListener('input', updateBudget));
function updateBudget(){
  const revenu = +document.getElementById('budgetRevenu').value;
  const total = ['budgetLoyer','budgetFixe','budgetVariable'].reduce((s,id)=>s+ +document.getElementById(id).value, 0);
  const solde = revenu - total;
  const el = document.getElementById('budgetResult');
  el.textContent = fmtEUR(solde);
  el.style.color = solde >= 0 ? 'var(--emerald)' : 'var(--bordeaux)';
}
updateBudget();

// Objectif épargne
['goalAmount','goalMonthly'].forEach(id=>document.getElementById(id).addEventListener('input', updateGoal));
function updateGoal(){
  const amount = +document.getElementById('goalAmount').value;
  const monthly = +document.getElementById('goalMonthly').value;
  const el = document.getElementById('goalResult');
  if(monthly <= 0){ el.textContent = '—'; return; }
  const months = Math.ceil(amount/monthly);
  const years = Math.floor(months/12), rem = months%12;
  el.textContent = years > 0 ? `${years} an(s) et ${rem} mois` : `${months} mois`;
}
updateGoal();

// Coût futur d'un abonnement
const subCost = document.getElementById('subCost'), subYears = document.getElementById('subYears'), subRate = document.getElementById('subRate');
function updateSub(){
  document.getElementById('valSubYears').textContent = subYears.value + ' ans';
  document.getElementById('valSubRate').textContent = subRate.value + ' %';
  const totalPaid = subCost.value * 12 * subYears.value;
  const series = compoundSeries(0, +subCost.value, +subRate.value, +subYears.value);
  const invested = series[series.length-1];
  document.getElementById('subResult').innerHTML = `<span>Total payé : ${fmtEUR(totalPaid)}</span><span>Si investi à la place : <strong style="color:var(--emerald)">${fmtEUR(invested)}</strong></span>`;
}
[subCost, subYears, subRate].forEach(el=>el.addEventListener('input', updateSub));
updateSub();

// Impact de l'inflation
const inflAmount = document.getElementById('inflAmount'), inflReturn = document.getElementById('inflReturn'), inflRate = document.getElementById('inflRate'), inflYears = document.getElementById('inflYears');
function updateInflation(){
  document.getElementById('valInflReturn').textContent = inflReturn.value + ' %';
  document.getElementById('valInflRate').textContent = inflRate.value + ' %';
  document.getElementById('valInflYears').textContent = inflYears.value + ' ans';
  const amount = +inflAmount.value, ret = +inflReturn.value/100, inflation = +inflRate.value/100, years = +inflYears.value;
  const nominal = amount * Math.pow(1+ret, years);
  const real = nominal / Math.pow(1+inflation, years);
  const diff = real - amount;
  document.getElementById('inflResult').innerHTML = `
    <span>Valeur affichée dans ${years} ans : <strong>${fmtEUR(nominal)}</strong></span>
    <span>Pouvoir d'achat réel : <strong style="color:${diff>=0?'var(--emerald)':'var(--bordeaux)'}">${fmtEUR(real)}</strong></span>`;
  const nominalSeries = [], realSeries = [];
  for(let y=0;y<=years;y++){
    nominalSeries.push(amount*Math.pow(1+ret,y));
    realSeries.push(amount*Math.pow(1+ret,y)/Math.pow(1+inflation,y));
  }
  renderBarChart('inflChart','inflChartLabels', realSeries, years);
}
[inflAmount, inflReturn, inflRate, inflYears].forEach(el=>el.addEventListener('input', updateInflation));
updateInflation();

// Intérêts composés — scénarios prudent/central/optimiste/historique/personnalisé
// (RETURN_ASSUMPTIONS centralisé dans scripts/data.js, réutilisable ailleurs
// plutôt que de dupliquer des pourcentages différents par fichier).
const capitalEl = document.getElementById('capital'), monthlyEl = document.getElementById('monthly'), rateEl = document.getElementById('rate'), yearsEl = document.getElementById('years');
const simFraisEl = document.getElementById('simFrais'), simShowRealEl = document.getElementById('simShowReal');
let simMode = 'central';
let simUsed = false;
let historicalRateInfo = null; // rempli uniquement par une vraie donnée Yahoo Finance, jamais inventé

async function fetchHistoricalReturn(){
  const resp = await fetch('/api/custom-quotes?symbols=URTH&range=5y');
  if(!resp.ok) throw new Error('HTTP ' + resp.status);
  const payload = await resp.json();
  const q = (payload.quotes || [])[0];
  if(!q || !q.history || q.history.length < 2) throw new Error('Historique indisponible');
  const first = q.history[0], last = q.history[q.history.length - 1];
  const years = (new Date(last.date) - new Date(first.date)) / (365.25 * 24 * 3600 * 1000);
  if(years <= 0) throw new Error('Période invalide');
  const rate = (Math.pow(last.close / first.close, 1 / years) - 1) * 100;
  return {
    rate,
    source: 'Yahoo Finance — iShares MSCI World ETF (URTH)',
    startLabel: new Date(first.date).toLocaleDateString('fr-FR'),
    endLabel: new Date(last.date).toLocaleDateString('fr-FR')
  };
}

function currentGrossRate(){
  if(simMode === 'personnalise') return +rateEl.value;
  if(simMode === 'historique') return historicalRateInfo ? historicalRateInfo.rate : RETURN_ASSUMPTIONS.central.rate;
  return RETURN_ASSUMPTIONS[simMode].rate;
}

function updateModeDesc(){
  const descEl = document.getElementById('simModeDesc');
  if(simMode === 'personnalise') descEl.textContent = "Choisis librement un rendement — une hypothèse trop élevée est signalée ci-dessous.";
  else if(simMode === 'historique') descEl.textContent = historicalRateInfo
    ? `Rendement annualisé réel constaté : ${historicalRateInfo.rate.toFixed(1)} %. Source : ${historicalRateInfo.source}, du ${historicalRateInfo.startLabel} au ${historicalRateInfo.endLabel}.`
    : "Chargement de la donnée historique réelle…";
  else descEl.textContent = RETURN_ASSUMPTIONS[simMode].desc;
}

function updateRateAlert(){
  const alertEl = document.getElementById('simRateAlert');
  const rate = +rateEl.value, years = +yearsEl.value;
  if(simMode === 'personnalise' && rate > 12){
    alertEl.innerHTML = `<p class="disclaimer-box" style="margin-top:6px;">${rate}% par an sur ${years} ans est une hypothèse extrêmement ambitieuse et ne doit pas être considérée comme un rendement normal attendu.</p>`;
  } else {
    alertEl.innerHTML = '';
  }
}

function updateRealValue(total, years){
  const el = document.getElementById('simRealValue');
  if(!simShowRealEl.checked){ el.innerHTML = ''; return; }
  const real = total / Math.pow(1 + DEFAULT_INFLATION_ASSUMPTION/100, years);
  el.innerHTML = `<p style="font-size:12.5px;color:var(--text-dim);">En pouvoir d'achat d'aujourd'hui (hypothèse d'inflation ${DEFAULT_INFLATION_ASSUMPTION}%/an) : <strong style="color:var(--text);">${fmtEUR(real)}</strong></p>`;
}

async function selectMode(mode){
  simMode = mode;
  document.querySelectorAll('#simModeToggle .pill').forEach(p=>p.classList.toggle('active', p.dataset.mode === mode));
  rateEl.disabled = mode !== 'personnalise';
  if(mode === 'historique' && !historicalRateInfo){
    updateModeDesc();
    try { historicalRateInfo = await fetchHistoricalReturn(); }
    catch(err){
      document.getElementById('simModeDesc').textContent = "Donnée historique temporairement indisponible. Choisis un autre scénario.";
      console.info('Likanza Academy — rendement historique indisponible :', err.message);
      return;
    }
  }
  updateModeDesc();
  updateSim();
}
document.querySelectorAll('#simModeToggle .pill').forEach(btn=>{
  btn.addEventListener('click', ()=>selectMode(btn.dataset.mode));
});

function updateSim(){
  const P=+capitalEl.value, PMT=+monthlyEl.value, years=+yearsEl.value;
  const grossRate = currentGrossRate();
  if(simMode !== 'personnalise') rateEl.value = grossRate;
  const frais = +simFraisEl.value || 0;
  const netRate = Math.max(0, grossRate - frais);
  document.getElementById('valCapital').textContent = fmtEUR(P);
  document.getElementById('valMonthly').textContent = fmtEUR(PMT);
  document.getElementById('valRate').textContent = grossRate.toFixed(1) + ' %' + (frais > 0 ? ` (net de frais : ${netRate.toFixed(1)} %)` : '');
  document.getElementById('valYears').textContent = years + ' ans';
  const series = compoundSeries(P, PMT, netRate, years);
  const total = series[series.length-1];
  const invested = P + PMT*years*12;
  document.getElementById('simTotal').textContent = fmtEUR(total);
  document.getElementById('simInvested').textContent = fmtEUR(invested);
  document.getElementById('simGains').textContent = fmtEUR(total-invested);
  renderBarChart('simChart','simChartLabels', series, years);
  updateRateAlert();
  updateRealValue(total, years);
}
[capitalEl, monthlyEl, yearsEl, simFraisEl].forEach(el=>el.addEventListener('input', ()=>{
  updateSim();
  if(!simUsed){ simUsed = true; awardXP(5, {usedSimulator:true}); }
}));
rateEl.addEventListener('input', ()=>{
  if(simMode !== 'personnalise') return;
  updateSim();
  if(!simUsed){ simUsed = true; awardXP(5, {usedSimulator:true}); }
});
simShowRealEl.addEventListener('change', updateSim);
rateEl.disabled = true;
updateModeDesc();
updateSim();

renderWhatIf('simWhatIf', [
  {label:"Et si tu commençais 10 ans plus tôt ?", change:{years: +yearsEl.value + 10}},
  {label:"Et si tu doublais ton versement mensuel ?", change:{monthly: +monthlyEl.value * 2}},
  {label:"Et si le rendement était 2 points plus haut ?", change:{rate: currentGrossRate() + 2}}
], (change)=>{
  const P = change.capital ?? +capitalEl.value;
  const PMT = change.monthly ?? +monthlyEl.value;
  const rate = Math.max(0, (change.rate ?? currentGrossRate()) - (+simFraisEl.value || 0));
  const years = change.years ?? +yearsEl.value;
  const series = compoundSeries(P, PMT, rate, years);
  return series[series.length-1];
}, fmtEUR);

// DCA — prix moyen d'achat
let dcaCount = 0;
let dcaUsed = false;
function markDcaUsed(){ if(!dcaUsed){ dcaUsed = true; awardXP(5, {usedDCA:true}); } }
function addDcaRow(qty=10, price=100){
  dcaCount++;
  const row = document.createElement('div');
  row.className = 'field';
  row.style.display = 'flex';
  row.style.gap = '10px';
  row.innerHTML = `
    <input type="number" class="dca-qty" placeholder="Quantité" value="${qty}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;width:45%;">
    <input type="number" class="dca-price" placeholder="Prix unitaire (€)" value="${price}" style="background:var(--bg);border:1px solid var(--hairline);color:var(--text);padding:8px 10px;border-radius:2px;width:45%;">
  `;
  document.getElementById('dcaRows').appendChild(row);
  row.querySelectorAll('input').forEach(i=>i.addEventListener('input', ()=>{ updateDca(); markDcaUsed(); }));
}
document.getElementById('dcaAdd').addEventListener('click', ()=>{ addDcaRow(); markDcaUsed(); });
function updateDca(){
  const qtys = Array.from(document.querySelectorAll('.dca-qty')).map(i=>+i.value||0);
  const prices = Array.from(document.querySelectorAll('.dca-price')).map(i=>+i.value||0);
  let totalQty = 0, totalCost = 0;
  qtys.forEach((q,i)=>{ totalQty += q; totalCost += q*prices[i]; });
  const avg = totalQty > 0 ? totalCost/totalQty : 0;
  document.getElementById('dcaResult').innerHTML = `<span>Quantité totale : ${totalQty}</span><span>Coût total : ${fmtEUR(totalCost)}</span><span>Prix moyen d'achat : <strong style="color:var(--gold-bright)">${avg.toFixed(2)} €</strong></span>`;
}
addDcaRow(10, 95); addDcaRow(5, 110);
updateDca();
