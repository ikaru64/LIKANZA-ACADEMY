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

renderLevelTip('levelTip', 'realEstate');
