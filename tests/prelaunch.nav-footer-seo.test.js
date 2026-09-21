/* ============================================================
   Pré-lancement (2026-09-21), P1 — sur TOUTES les pages HTML : nav et footer
   uniques, "Apprendre" (plus "Formations") dans la navigation, "Roadmap",
   marqueur Beta discret, aperçu de partage (og:image + twitter:card) présent
   et pointant vers un vrai fichier. Vérification purement textuelle (aucun
   navigateur nécessaire) sur les ~53 pages.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { ROOT } = require('./support/load-page');

const t = createSuite('prelaunch.nav-footer-seo');
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8').split('\r\n').join('\n'); // fins de ligne normalisées (CRLF/LF mélangés dans le dépôt)
const footerOf = html => { const a = html.indexOf('<footer class="site-footer">'); return html.slice(a, html.indexOf('</footer>', a)); };
const sidebarOf = html => { const a = html.indexOf('<aside class="app-sidebar"'); return html.slice(a, html.indexOf('</aside>', a)); };
// Le seul écart toléré entre pages : la classe "active" du lien courant.
const norm = s => s.replace(/ class="active"/g, '').replace(/\s+/g, ' ');

t.ok(files.length >= 50, `au moins 50 pages HTML auditées (obtenu : ${files.length})`);

// ---------- Navigation ----------
{
  const bad = { formations: [], group: [], roadmap: [], sidebarDiff: [] };
  const baseSidebar = norm(sidebarOf(read('index.html')));
  files.forEach(f => {
    const html = read(f);
    const sb = sidebarOf(html);
    if(/<span>Formations<\/span>/.test(sb) || /<a href="formations\.html">Formations<\/a>/.test(html)) bad.formations.push(f);
    if(!sb.includes('sidebar-group-label">Apprendre &amp; pratiquer<')) bad.group.push(f);
    if(/<a href="avenir\.html">À venir<\/a>/.test(html)) bad.roadmap.push(f);
    if(norm(sb) !== baseSidebar) bad.sidebarDiff.push(f);
  });
  t.equal(bad.formations.length, 0, 'aucune page ne dit encore "Formations" dans sa navigation (renommé "Apprendre")', bad.formations);
  t.equal(bad.group.length, 0, 'le groupe de navigation s\'appelle "Apprendre & pratiquer" partout (plus de tautologie Apprendre > Apprendre)', bad.group);
  t.equal(bad.roadmap.length, 0, 'le lien "À venir" est devenu "Roadmap" partout', bad.roadmap);
  t.equal(bad.sidebarDiff.length, 0, 'la barre latérale est identique sur toutes les pages (hors lien actif)', bad.sidebarDiff);
}

// ---------- Footer unique ----------
{
  const required = ['apropos.html', 'contact.html', 'legal.html#mentions', 'legal.html#confidentialite', 'legal.html#risques', 'avenir.html'];
  const baseFooter = footerOf(read('index.html'));
  const missing = [], diverging = [];
  files.forEach(f => {
    const ft = footerOf(read(f));
    required.forEach(r => { if(!ft.includes(`href="${r}"`)) missing.push(f + ' -> ' + r); });
    if(ft !== baseFooter) diverging.push(f);
    if(!/plateforme éducative/.test(ft) || !/conseil financier personnalisé/.test(ft)) missing.push(f + ' -> phrase pédagogique');
  });
  t.equal(missing.length, 0, 'chaque footer contient À propos, Contact, Mentions légales, Confidentialité, Avertissement risques, Roadmap et la phrase pédagogique', missing.slice(0, 5));
  t.equal(diverging.length, 0, 'le footer est strictement identique sur toutes les pages', diverging.slice(0, 5));
  t.ok(!/<li><\/li>/.test(baseFooter), 'plus de <li> vide dans le footer (ancien défaut de index.html)');
}

// ---------- Beta ----------
{
  const noBeta = files.filter(f => !/<span class="beta-tag">Beta<\/span>/.test(read(f)));
  t.equal(noBeta.length, 0, 'le marqueur Beta discret est présent dans le header de toutes les pages', noBeta);
  const noBetaFooter = files.filter(f => !/© 2026 Likanza Academy · Beta/.test(footerOf(read(f))));
  t.equal(noBetaFooter.length, 0, 'le pied de page mentionne la Beta partout', noBetaFooter);
}

// ---------- SEO / partage ----------
{
  const problems = [];
  files.forEach(f => {
    const html = read(f);
    ['<title>', 'name="description"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card"', 'rel="canonical"', 'rel="icon"'].forEach(tag => {
      if(!html.includes(tag)) problems.push(f + ' -> ' + tag);
    });
  });
  t.equal(problems.length, 0, 'chaque page a title, description, og:title/description/image, twitter:card, canonical et favicon', problems.slice(0, 5));
  const card = path.join(ROOT, 'assets', 'og-card.svg');
  t.ok(fs.existsSync(card), "l'image de partage référencée existe réellement (assets/og-card.svg)");
  const svg = fs.readFileSync(card, 'utf8');
  t.ok(/<svg[^>]+width="1200"[^>]+height="630"/.test(svg) && svg.includes('Likanza Academy'), 'la carte de partage fait 1200×630 et porte le nom du site');
  const wrongImg = files.filter(f => !read(f).includes('https://likanza-academy.vercel.app/assets/og-card.svg'));
  t.equal(wrongImg.length, 0, "toutes les pages pointent vers la même image de partage", wrongImg);
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
