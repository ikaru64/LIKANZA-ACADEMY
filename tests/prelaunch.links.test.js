/* ============================================================
   Pré-lancement (2026-09-21) — aucun lien interne cassé dans les pages
   statiques (nav, footer, CTA), ancres des pages juridiques valides,
   sitemap cohérent avec les fichiers réels.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { ROOT } = require('./support/load-page');

const t = createSuite('prelaunch.links');
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const html = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const broken = [], badAnchors = [];
let total = 0;
files.forEach(f => {
  const src = html(f);
  (src.match(/href="([^"#?]+\.html)(#[^"]*)?(\?[^"]*)?"/g) || []).forEach(m => {
    const mm = m.match(/href="([^"#?]+\.html)(#([^"]*))?/);
    total++;
    const target = mm[1];
    if(/^https?:/.test(target)) return;
    if(!fs.existsSync(path.join(ROOT, target))){ broken.push(f + ' -> ' + target); return; }
    const anchor = mm[3];
    // ancres vérifiables sur les pages 100% statiques
    if(anchor && ['legal.html', 'contact.html', 'avenir.html'].includes(target) && !/^[a-z]+:/.test(anchor)){
      if(!new RegExp('id="' + anchor + '"').test(html(target))) badAnchors.push(f + ' -> ' + target + '#' + anchor);
    }
  });
});
t.ok(total > 1000, `plus de 1000 liens internes vérifiés (obtenu : ${total})`);
t.equal(broken.length, 0, 'aucun lien interne ne pointe vers une page inexistante', broken.slice(0, 8));
t.equal(badAnchors.length, 0, 'toutes les ancres vers les pages juridiques/contact/roadmap existent', badAnchors.slice(0, 8));

// ---------- Sitemap ----------
{
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const urls = (sm.match(/<loc>[^<]+<\/loc>/g) || []).map(l => l.replace(/<\/?loc>/g, '').replace('https://likanza-academy.vercel.app/', ''));
  const missing = urls.filter(u => u && !fs.existsSync(path.join(ROOT, u)));
  t.equal(missing.length, 0, 'chaque URL du sitemap correspond à un vrai fichier', missing);
  t.ok(urls.includes('contact.html'), 'la nouvelle page Contact est dans le sitemap');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
