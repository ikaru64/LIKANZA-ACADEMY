// Capacité d'emprunt
const capMonthly = document.getElementById('capMonthly'), capRate = document.getElementById('capRate'), capYears = document.getElementById('capYears');
function updateCap(){
  document.getElementById('valMonthlyCap').textContent = fmtEUR(+capMonthly.value);
  document.getElementById('valRateCap').textContent = capRate.value + ' %';
  document.getElementById('valYearsCap').textContent = capYears.value + ' ans';
  const cap = borrowingCapacity(+capMonthly.value, +capRate.value, +capYears.value);
  document.getElementById('capResult').textContent = fmtEUR(cap);
}
[capMonthly, capRate, capYears].forEach(el=>el.addEventListener('input', updateCap));
updateCap();

// Mensualité de crédit
const loanCapital = document.getElementById('loanCapital'), loanRate = document.getElementById('loanRate'), loanYears = document.getElementById('loanYears');
function updateLoan(){
  document.getElementById('valCapitalLoan').textContent = fmtEUR(+loanCapital.value);
  document.getElementById('valRateLoan').textContent = loanRate.value + ' %';
  document.getElementById('valYearsLoan').textContent = loanYears.value + ' ans';
  const m = loanMonthlyPayment(+loanCapital.value, +loanRate.value, +loanYears.value);
  document.getElementById('loanResult').textContent = fmtEUR(m);
  const total = m * loanYears.value * 12;
  document.getElementById('loanTotal').innerHTML = `<span>Coût total : ${fmtEUR(total)}</span><span>Dont intérêts : ${fmtEUR(total - loanCapital.value)}</span>`;
}
[loanCapital, loanRate, loanYears].forEach(el=>el.addEventListener('input', updateLoan));
updateLoan();
renderWhatIf('loanWhatIf', [
  {label:"Et si les taux montaient de +1 point ?", change:{rate: 1}},
  {label:"Et si les taux montaient de +2 points ?", change:{rate: 2}}
], (change)=>{
  const rate = +loanRate.value + (change.rate || 0);
  return loanMonthlyPayment(+loanCapital.value, rate, +loanYears.value);
}, v=>fmtEUR(v)+' / mois');

// Rendement locatif
['rentPrice','rentMonthly','rentCharges'].forEach(id=>document.getElementById(id).addEventListener('input', updateRent));
function updateRent(){
  const price = +document.getElementById('rentPrice').value;
  const monthly = +document.getElementById('rentMonthly').value;
  const charges = +document.getElementById('rentCharges').value;
  if(price <= 0){ document.getElementById('rentResult').innerHTML = '<span style="color:var(--bordeaux)">Prix d\'achat invalide.</span>'; return; }
  const brut = (monthly*12/price)*100;
  const net = ((monthly*12 - charges)/price)*100;
  document.getElementById('rentResult').innerHTML = `<span>Rendement brut : <strong class="mono" style="color:var(--gold-bright)">${brut.toFixed(2)}%</strong></span><span>Rendement net (hors fiscalité) : <strong class="mono" style="color:var(--emerald)">${net.toFixed(2)}%</strong></span>`;
}
updateRent();

// Acheter ou louer
['cmpRent','cmpLoan','cmpCharges'].forEach(id=>document.getElementById(id).addEventListener('input', updateCmp));
function updateCmp(){
  const rent = +document.getElementById('cmpRent').value;
  const loan = +document.getElementById('cmpLoan').value;
  const charges = +document.getElementById('cmpCharges').value;
  const ownerCost = loan + charges;
  const diff = ownerCost - rent;
  document.getElementById('cmpResult').innerHTML = `<span>Coût mensuel locataire : ${fmtEUR(rent)}</span><span>Coût mensuel propriétaire : ${fmtEUR(ownerCost)}</span><span style="color:${diff<=0?'var(--emerald)':'var(--bordeaux)'}">Écart : ${diff>=0?'+':''}${fmtEUR(diff)} / mois</span>`;
}
updateCmp();
renderLevelTip('levelTip', 'realEstate');
