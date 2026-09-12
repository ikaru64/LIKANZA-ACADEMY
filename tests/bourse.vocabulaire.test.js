/* ============================================================
   Chantier H (refonte continuité UX, 12/09/2026) — 5 termes techniques/
   anglais confirmés visibles sur bourse.html (audité comme confinés à ce
   seul fichier avant renommage) : "DCA Lab"→"Simulateur DCA", "Scenario
   Lab"→"Scénarios", "Equity Intelligence Terminal"→"Marchés financiers",
   "Options Payoff Lab"→"Simulateur d'options", "Trading Simulator"→
   "Simulateur de trading". Copie uniquement, jamais les noms de
   fonctions/classes CSS internes.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { ROOT } = require('./support/load-page');

const t = createSuite('bourse.vocabulaire');

const html = fs.readFileSync(path.join(ROOT, 'bourse.html'), 'utf8');

const OLD_TERMS = ['DCA Lab', 'Scenario Lab', 'Equity Intelligence Terminal', 'Options Payoff Lab', 'Trading Simulator'];
OLD_TERMS.forEach(term => {
  t.ok(!html.includes(term), `"${term}" n'apparaît plus sur bourse.html`);
});

const NEW_TERMS = ['Simulateur DCA', 'Scénarios', 'Marchés financiers', "Simulateur d'options", 'Simulateur de trading'];
NEW_TERMS.forEach(term => {
  t.ok(html.includes(term), `le nouveau libellé "${term}" est bien présent`);
});

// Vérifie qu'aucun des 5 anciens termes n'a fui ailleurs sur le site.
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
let leaked = [];
files.forEach(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  OLD_TERMS.forEach(term => { if(content.includes(term)) leaked.push(`${f}: "${term}"`); });
});
t.equal(leaked.length, 0, 'aucun des 5 anciens termes ne fuit sur une autre page du site', leaked);

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
