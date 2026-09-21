/* ============================================================
   Pré-lancement (2026-09-21), P2 — bases d'accessibilité et garde-fous
   d'affichage : champs étiquetés, images avec alt, jamais "NaN €", tableaux
   qui défilent sur mobile plutôt que de faire déborder la page.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { loadPage, ROOT } = require('./support/load-page');

const t = createSuite('prelaunch.a11y-guards');
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

// ---------- Champs de saisie étiquetés ----------
{
  const unlabeled = [];
  files.forEach(f => {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    (html.match(/<input\b[^>]*>/g) || []).forEach(tag => {
      if(/type="(hidden|submit|button|checkbox|radio)"/.test(tag)) return;
      const id = (tag.match(/\bid="([^"]+)"/) || [])[1];
      const labelled = /aria-label=|aria-labelledby=/.test(tag) || (id && new RegExp('for="' + id + '"').test(html));
      if(!labelled) unlabeled.push(f + ' -> ' + (id || tag.slice(0, 50)));
    });
  });
  t.equal(unlabeled.length, 0, 'chaque champ de saisie a une étiquette (label for= ou aria-label)', unlabeled);
}

// ---------- Images avec alt ----------
{
  const noAlt = [];
  files.forEach(f => {
    (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/<img\b[^>]*>/g) || []).forEach(tag => { if(!/\balt=/.test(tag)) noAlt.push(f); });
  });
  t.equal(noAlt.length, 0, 'toute image a un attribut alt', noAlt);
}

// ---------- Un seul <h1> par page (statique) et titre de page présent ----------
{
  const multi = files.filter(f => (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/<h1\b/g) || []).length > 1);
  t.equal(multi.length, 0, 'aucune page ne déclare plusieurs <h1> dans son HTML', multi);
}

// ---------- fmtEUR : jamais "NaN €" ----------
{
  const { runInPage } = loadPage('formations.html', ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js']);
  const out = runInPage('window.__r = [fmtEUR(1234.5), fmtEUR(NaN), fmtEUR(undefined), fmtEUR(Infinity), fmtEUR(null), fmtEUR("12")];');
  t.equal(out[0].replace(/\s/g, ' '), '1 235 €'.replace(/\s/g, ' '), 'fmtEUR formate toujours un nombre valide');
  t.equal(out.slice(1).join('|'), '—|—|—|—|—', 'fmtEUR affiche "—" pour NaN / undefined / Infinity / null / texte, jamais "NaN €"');
}

// ---------- Tableaux : défilement horizontal sur mobile ----------
{
  const css = fs.readFileSync(path.join(ROOT, 'styles/design-system.css'), 'utf8');
  t.ok(/@media \(max-width:640px\)\{\s*\.card table[^}]*overflow-x:auto/.test(css), 'une règle mobile fait défiler les tableaux trop larges au lieu de faire déborder la page');
  t.ok(/\.beta-tag\{/.test(css) && /\.home-hero\{/.test(css), 'les styles du marqueur Beta et du hero existent');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
