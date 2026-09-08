/* ============================================================
   computeRealPortfolioPositions / computeRealPortfolioTotals
   (scripts/data.js) — PRU sur achats multiples, rejet des transactions
   corrompues, et refus d'additionner des positions en devises
   différentes (ventilation honnête par devise plutôt qu'un total qui
   mélangerait silencieusement des devises).
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBoursePage } = require('./support/load-page');

const t = createSuite('bourse.portfolio');
const { window } = loadBoursePage();
const { computeRealPortfolioPositions, computeRealPortfolioTotals } = window;

// ---------- PRU sur achats multiples au même ticker ----------
{
  const transactions = [
    { ticker: 'AAPL', name: 'Apple', quantity: 10, buyPrice: 150, currency: 'EUR' },
    { ticker: 'AAPL', name: 'Apple', quantity: 5, buyPrice: 180, currency: 'EUR' }
  ];
  const positions = computeRealPortfolioPositions(transactions, { AAPL: 200 });
  t.equal(positions.length, 1, "2 transactions sur le même ticker forment bien une seule position");
  const p = positions[0];
  t.equal(p.quantity, 15, "quantité totale = 10 + 5 = 15");
  t.close(p.totalInvested, 2400, "montant investi total = 10*150 + 5*180 = 2400");
  t.close(p.avgBuyPrice, 160, "PRU (prix de revient unitaire) = 2400 / 15 = 160");
  t.close(p.currentValue, 3000, "valeur actuelle = 15 * 200 (cours en direct fourni)");
  t.close(p.gainLoss, 600, "plus-value latente = 3000 - 2400 = 600");
  t.close(p.gainLossPct, 25, "plus-value latente en % = 600 / 2400 * 100 = 25 %");
}

// ---------- Transactions corrompues : ignorées, jamais une position fantôme ----------
{
  const transactions = [
    { ticker: 'AAPL', name: 'Apple', quantity: 10, buyPrice: 150, currency: 'EUR' },
    { ticker: 'BAD1', name: 'Corrompue 1', quantity: -5, buyPrice: 100, currency: 'EUR' }, // quantité négative
    { ticker: 'BAD2', name: 'Corrompue 2', quantity: 5, buyPrice: 0, currency: 'EUR' }, // prix nul
    { ticker: 'BAD3', name: 'Corrompue 3', quantity: 'dix', buyPrice: 100, currency: 'EUR' }, // quantité non numérique
    null, // entrée totalement absente
    { ticker: 123, name: 'Corrompue 4', quantity: 5, buyPrice: 100, currency: 'EUR' } // ticker non textuel
  ];
  const positions = computeRealPortfolioPositions(transactions, {});
  t.equal(positions.length, 1, "seule la transaction AAPL valide forme une position, les 5 autres corrompues sont ignorées", positions.map(p => p.ticker));
  t.equal(positions[0].ticker, 'AAPL', "la position restante est bien AAPL, pas une des transactions corrompues");
}

// ---------- Cours en direct inconnu : la position reste affichée, mais sans valeur actuelle inventée ----------
{
  const positions = computeRealPortfolioPositions([{ ticker: 'XYZ', name: 'Inconnu', quantity: 3, buyPrice: 50, currency: 'EUR' }], {});
  t.isNull(positions[0].currentPrice, "cours en direct absent -> currentPrice reste null, jamais un chiffre inventé");
  t.isNull(positions[0].currentValue, "valeur actuelle reste null tant que le cours réel n'est pas connu");
  t.isNull(positions[0].gainLoss, "plus-value latente reste null (rien à calculer sans valeur actuelle réelle)");
}

// ---------- Totaux : une seule devise, tous les cours connus -> un total unique ----------
{
  const positions = computeRealPortfolioPositions([
    { ticker: 'AAPL', name: 'Apple', quantity: 10, buyPrice: 150, currency: 'EUR' },
    { ticker: 'MSFT', name: 'Microsoft', quantity: 4, buyPrice: 300, currency: 'EUR' }
  ], { AAPL: 160, MSFT: 320 });
  const totals = computeRealPortfolioTotals(positions);
  t.ok(totals.isSingleCurrency, "toutes les positions sont en EUR -> isSingleCurrency = true");
  t.close(totals.totalInvested, 2700, "total investi = 1500 + 1200 = 2700");
  t.close(totals.totalCurrentValue, 2880, "total actuel = 1600 + 1280 = 2880 (toutes les valeurs sont connues)");
  t.equal(totals.currency, 'EUR', "devise unique correctement identifiée");
}

// ---------- Totaux : devises différentes -> jamais un total unique mélangeant les devises ----------
{
  const positions = computeRealPortfolioPositions([
    { ticker: 'AAPL', name: 'Apple', quantity: 10, buyPrice: 150, currency: 'USD' },
    { ticker: 'MC', name: 'LVMH', quantity: 2, buyPrice: 700, currency: 'EUR' }
  ], { AAPL: 160, MC: 720 });
  const totals = computeRealPortfolioTotals(positions);
  t.ok(!totals.isSingleCurrency, "des positions en USD et EUR ne sont jamais fusionnées sous isSingleCurrency", totals.isSingleCurrency);
  t.isNull(totals.totalCurrentValue, "aucun total global unique n'est calculé quand les devises diffèrent (jamais un taux de change inventé)");
  t.isNull(totals.currency, "aucune devise unique n'est affichée pour un portefeuille multi-devises");
  t.equal(totals.byCurrency.length, 2, "une ventilation honnête par devise est fournie à la place (2 devises)");
  const usd = totals.byCurrency.find(c => c.currency === 'USD');
  const eur = totals.byCurrency.find(c => c.currency === 'EUR');
  t.close(usd.totalCurrentValue, 1600, "le sous-total USD est correct et indépendant de l'EUR");
  t.close(eur.totalCurrentValue, 1440, "le sous-total EUR est correct et indépendant de l'USD");
}

// ---------- Totaux : position sans cours connu -> total global honnêtement absent, pas approximé ----------
{
  const positions = computeRealPortfolioPositions([
    { ticker: 'AAPL', name: 'Apple', quantity: 10, buyPrice: 150, currency: 'EUR' },
    { ticker: 'XYZ', name: 'Inconnu', quantity: 3, buyPrice: 50, currency: 'EUR' }
  ], { AAPL: 160 }); // XYZ sans cours
  const totals = computeRealPortfolioTotals(positions);
  t.isNull(totals.totalCurrentValue, "une seule position sans cours connu suffit à rendre le total global indisponible, jamais une estimation partielle présentée comme complète");
  t.equal(totals.positionsWithUnknownPrice, 1, "le nombre de positions sans cours connu est bien compté (1)");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
