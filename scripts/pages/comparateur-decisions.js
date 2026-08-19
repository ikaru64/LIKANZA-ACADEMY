function markComparateurUsed(){ tryAwardQuizPoints(`comparateur-decisions-${new Date().toDateString()}`, 5, {usedSimulator:true}); }

renderCashVsCreditTool('cashVsCredit');
renderPrepayVsInvestTool('prepayVsInvest');

document.getElementById('cashVsCredit').addEventListener('input', markComparateurUsed);
document.getElementById('prepayVsInvest').addEventListener('input', markComparateurUsed);
