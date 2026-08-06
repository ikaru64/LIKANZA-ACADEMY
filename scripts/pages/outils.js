// Profil de risque + conseils adaptés au niveau
const outilsProfile = getProfile();
const outilsHasProfile = !!safeGetJSON('fzr-profile', null);
if(document.getElementById('outilsRiskGauge')) renderRiskGauge('outilsRiskGauge', outilsProfile.risque);
const outilsRiskNote = document.getElementById('outilsRiskNote');
if(outilsRiskNote){
  outilsRiskNote.innerHTML = outilsHasProfile
    ? "Basé sur ton profil enregistré dans Mon compte."
    : "Profil par défaut (équilibré) — <a href=\"compte.html\" style=\"color:var(--gold-bright);\">renseigne le tien dans Mon compte</a> pour une jauge personnalisée.";
}
if(document.getElementById('coachWidget')) renderCoach('coachWidget');

// Intérêts composés
const capitalEl = document.getElementById('capital'), monthlyEl = document.getElementById('monthly'), rateEl = document.getElementById('rate'), yearsEl = document.getElementById('years');
let simUsed = false;
function updateSim(){
  const P=+capitalEl.value, PMT=+monthlyEl.value, rate=+rateEl.value, years=+yearsEl.value;
  document.getElementById('valCapital').textContent = fmtEUR(P);
  document.getElementById('valMonthly').textContent = fmtEUR(PMT);
  document.getElementById('valRate').textContent = rate + ' %';
  document.getElementById('valYears').textContent = years + ' ans';
  const series = compoundSeries(P, PMT, rate, years);
  const total = series[series.length-1];
  const invested = P + PMT*years*12;
  document.getElementById('simTotal').textContent = fmtEUR(total);
  document.getElementById('simInvested').textContent = fmtEUR(invested);
  document.getElementById('simGains').textContent = fmtEUR(total-invested);
  renderBarChart('simChart','simChartLabels', series, years);
}
[capitalEl, monthlyEl, rateEl, yearsEl].forEach(el=>el.addEventListener('input', ()=>{
  updateSim();
  if(!simUsed){ simUsed = true; awardXP(5, {usedSimulator:true}); }
}));
updateSim();

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
