let comparateurUsed = false;
function markComparateurUsed(){ if(!comparateurUsed){ comparateurUsed = true; awardXP(5, {usedSimulator:true}); } }

renderCashVsCreditTool('cashVsCredit');
renderPrepayVsInvestTool('prepayVsInvest');

document.getElementById('cashVsCredit').addEventListener('input', markComparateurUsed);
document.getElementById('prepayVsInvest').addEventListener('input', markComparateurUsed);
