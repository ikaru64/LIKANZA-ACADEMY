/* ============================================================
   Contenu de repli statique (référencement + lecture sans JavaScript,
   08/09/2026) : le <noscript> et les données structurées (JSON-LD)
   doivent rester synchronisés avec STOCKS_DEMO (identité seule — nom,
   secteur, pays, éligibilité PEA — JAMAIS un cours ni une variation, qui
   périmeraient immédiatement). Ce test échoue bruyamment si l'un dérive
   de l'autre, plutôt que de laisser un repli obsolète silencieux.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { loadBoursePage, ROOT } = require('./support/load-page');

const t = createSuite('bourse.static-fallback');
const { window, runInPage } = loadBoursePage();
const rawHtml = fs.readFileSync(path.join(ROOT, 'bourse.html'), 'utf8');

// ---------- STOCKS_DEMO (scripts/app.js) est la source de vérité ----------
// `const` de premier niveau du script : une liaison lexicale, jamais une
// propriété de window (voir tests/support/load-page.js) — lue via runInPage.
const stocksDemo = runInPage('window.__r = STOCKS_DEMO;');
t.ok(Array.isArray(stocksDemo) && stocksDemo.length === 8, "STOCKS_DEMO contient bien les 8 valeurs de départ attendues", stocksDemo && stocksDemo.length);

// ---------- <noscript> : une entrée par valeur, identité seule ----------
const noscriptMatch = rawHtml.match(/<noscript>([\s\S]*?)<\/noscript>/);
t.ok(!!noscriptMatch, "un bloc <noscript> existe bien dans bourse.html");
const noscriptHtml = noscriptMatch ? noscriptMatch[1] : '';
stocksDemo.forEach(s => {
  t.ok(noscriptHtml.includes(s.ticker), `le <noscript> mentionne bien le ticker réel ${s.ticker}`, noscriptHtml.includes(s.ticker));
  t.ok(noscriptHtml.includes(s.nom), `le <noscript> mentionne bien le nom réel ${s.nom}`);
  t.ok(noscriptHtml.includes(s.secteur), `le <noscript> mentionne bien le secteur réel de ${s.nom} (${s.secteur})`);
  t.ok(noscriptHtml.includes(s.pays), `le <noscript> mentionne bien le pays réel de ${s.nom} (${s.pays})`);
});
// Jamais un prix figé dans le repli statique : un nombre à décimale suivi
// de "€" trahirait une cotation datée présentée comme statique.
t.ok(!/\d+[.,]\d+\s*€/.test(noscriptHtml), "le <noscript> ne contient jamais de cours figé (aucun prix, qui périmerait immédiatement)", noscriptHtml);

// ---------- JSON-LD : une entrée par valeur, jamais de champ financier périssable ----------
const ldMatch = rawHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
t.ok(!!ldMatch, "un bloc JSON-LD existe bien dans bourse.html");
if(ldMatch){
  const data = JSON.parse(ldMatch[1]);
  t.equal(data['@type'], 'ItemList', "le type schema.org est bien générique (ItemList), pas un type financier spécifique");
  t.equal(data.itemListElement.length, stocksDemo.length, "le JSON-LD contient bien une entrée par valeur réelle de STOCKS_DEMO");
  stocksDemo.forEach(s => {
    const item = data.itemListElement.find(i => i.name.includes(s.ticker));
    t.ok(!!item, `une entrée JSON-LD existe bien pour ${s.ticker}`, item);
    if(item){
      t.ok(item.description.includes(s.secteur) && item.description.includes(s.pays), `la description JSON-LD de ${s.ticker} cite bien son vrai secteur et pays`, item.description);
    }
  });
  t.ok(!JSON.stringify(data).match(/\d+[.,]\d+\s*€/), "aucun cours n'apparaît dans le JSON-LD (identité seule, rien de périssable)");
}

// ---------- Conteneurs dynamiques marqués, pour distinguer repli statique / remplacement JS ----------
['stockGrid', 'marketOfDayBody', 'marketMoversBody'].forEach(id => {
  t.ok(new RegExp(`id="${id}"[^>]*data-live="pending"`).test(rawHtml), `#${id} porte bien le marqueur data-live="pending" avant l'exécution du JS`);
});

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
