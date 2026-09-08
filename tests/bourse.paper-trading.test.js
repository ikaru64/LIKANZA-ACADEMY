/* ============================================================
   executePaperTrade (scripts/data.js) — comptabilité du cash fictif sur
   achat/vente, refus de vendre plus que détenu, refus si fonds
   insuffisants, refus sur quantité/prix non positifs. L'état est
   persisté dans localStorage (réel dans jsdom) : chaque bloc réinitialise
   explicitement via resetPaperTradingState() pour rester indépendant.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBoursePage } = require('./support/load-page');

const t = createSuite('bourse.paper-trading');
const { window, runInPage } = loadBoursePage();
const { executePaperTrade, resetPaperTradingState, getPaperTradingState } = window;
// PAPER_TRADING_STARTING_CASH est un `const` de premier niveau du script :
// une liaison lexicale, jamais une propriété de window (contrairement aux
// fonctions déclarées avec `function`) — lu via runInPage (voir
// tests/support/load-page.js pour l'explication complète).
const PAPER_TRADING_STARTING_CASH = runInPage('window.__r = PAPER_TRADING_STARTING_CASH;');

// ---------- Solde de départ réel ----------
{
  const state = resetPaperTradingState();
  t.equal(state.cash, PAPER_TRADING_STARTING_CASH, "le solde de départ correspond bien à la constante réelle du module");
}

// ---------- Achat : débite bien le cash exact ----------
{
  resetPaperTradingState();
  const res = executePaperTrade('AAPL', 'Apple', 'stock', 'buy', 10, 150);
  t.ok(res.ok, "un achat avec des fonds suffisants est bien accepté", res);
  t.close(getPaperTradingState().cash, PAPER_TRADING_STARTING_CASH - 1500, "le cash est bien débité exactement de qty*price (10*150=1500)");
  t.equal(getPaperTradingState().transactions.length, 1, "la transaction est bien enregistrée");
}

// ---------- Achat puis vente : cash cohérent (achat débite, vente crédite) ----------
{
  resetPaperTradingState();
  executePaperTrade('AAPL', 'Apple', 'stock', 'buy', 10, 150); // -1500
  const sellRes = executePaperTrade('AAPL', 'Apple', 'stock', 'sell', 4, 180); // +720
  t.ok(sellRes.ok, "vendre une quantité détenue est bien accepté", sellRes);
  const expectedCash = PAPER_TRADING_STARTING_CASH - 1500 + 720;
  t.close(getPaperTradingState().cash, expectedCash, "le cash après achat puis vente partielle correspond bien à la somme exacte des deux mouvements");
}

// ---------- Vente refusée : plus que détenu ----------
{
  resetPaperTradingState();
  executePaperTrade('AAPL', 'Apple', 'stock', 'buy', 5, 150);
  const res = executePaperTrade('AAPL', 'Apple', 'stock', 'sell', 10, 160);
  t.ok(!res.ok, "vendre plus que la quantité détenue (10 pour 5 possédées) est bien refusé", res);
  t.close(getPaperTradingState().cash, PAPER_TRADING_STARTING_CASH - 750, "le cash n'a pas bougé après un ordre de vente refusé");
  t.equal(getPaperTradingState().transactions.length, 1, "aucune transaction fantôme n'est enregistrée pour l'ordre refusé");
}

// ---------- Vente refusée : rien détenu du tout ----------
{
  resetPaperTradingState();
  const res = executePaperTrade('MSFT', 'Microsoft', 'stock', 'sell', 1, 300);
  t.ok(!res.ok, "vendre un titre jamais acheté est bien refusé", res);
}

// ---------- Achat refusé : fonds insuffisants ----------
{
  resetPaperTradingState();
  const res = executePaperTrade('AAPL', 'Apple', 'stock', 'buy', 1000, 150); // 150 000 € pour 10 000 € de départ
  t.ok(!res.ok, "un achat dont le coût dépasse le cash disponible est bien refusé", res);
  t.equal(getPaperTradingState().cash, PAPER_TRADING_STARTING_CASH, "le cash reste inchangé après un achat refusé pour fonds insuffisants");
}

// ---------- Quantité ou prix non positifs : refusés ----------
{
  resetPaperTradingState();
  t.ok(!executePaperTrade('AAPL', 'Apple', 'stock', 'buy', 0, 150).ok, "une quantité nulle est refusée");
  t.ok(!executePaperTrade('AAPL', 'Apple', 'stock', 'buy', -5, 150).ok, "une quantité négative est refusée");
  t.ok(!executePaperTrade('AAPL', 'Apple', 'stock', 'buy', 10, 0).ok, "un prix nul est refusé");
  t.ok(!executePaperTrade('AAPL', 'Apple', 'stock', 'buy', 10, -150).ok, "un prix négatif est refusé");
  t.ok(!executePaperTrade('', 'Sans symbole', 'stock', 'buy', 10, 150).ok, "un symbole vide est refusé");
  t.equal(getPaperTradingState().transactions.length, 0, "aucune des 5 tentatives invalides n'a créé de transaction");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
