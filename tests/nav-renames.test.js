/* ============================================================
   Chantier I (refonte continuité UX, 12/09/2026) — 2 renommages à fort
   rayon d'impact, copie uniquement (fichiers/URLs business-lab.html et
   play.html INCHANGÉS) : "Business Lab" → "Laboratoire professionnel",
   "Play" → "Jeux & simulations". Grep exhaustif avant renommage (HTML +
   JS de copie, jamais les commentaires internes ni les noms de fonctions/
   classes/tests décrivant la fonctionnalité — renderBusinessLab, #businessLab,
   scripts/pages/business-lab-page.js restent inchangés).
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { ROOT } = require('./support/load-page');

const t = createSuite('nav-renames');

const ALL_HTML = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

// ---------- "Business Lab" : plus aucune occurrence visible ----------
{
  let leaked = [];
  ALL_HTML.forEach(f => {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if(html.includes('Business Lab')) leaked.push(f);
  });
  t.equal(leaked.length, 0, '"Business Lab" n\'apparaît plus dans aucune page HTML', leaked);

  const businessLabHtml = fs.readFileSync(path.join(ROOT, 'business-lab.html'), 'utf8');
  t.ok(businessLabHtml.includes('<title>Laboratoire professionnel · Likanza Academy</title>'), 'le titre de business-lab.html est bien "Laboratoire professionnel"');
  t.ok(businessLabHtml.includes('<h1 class="visually-hidden">Laboratoire professionnel</h1>'), 'le h1 masqué reflète bien le nouveau nom');
  // L'URL/fichier reste inchangé (décision explicite de l'utilisateur).
  t.ok(fs.existsSync(path.join(ROOT, 'business-lab.html')), 'business-lab.html reste bien le nom de fichier/URL, inchangé');

  const businessHtml = fs.readFileSync(path.join(ROOT, 'business.html'), 'utf8');
  t.ok(businessHtml.includes('href="business-lab.html" class="card play-tile">') && businessHtml.includes('Laboratoire professionnel'), 'la carte business.html pointant vers business-lab.html est bien renommée');
}

// ---------- "Play" : plus aucune occurrence visible, hors mots anglais usuels non liés ----------
{
  let leaked = [];
  ALL_HTML.forEach(f => {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if(/\bPlay\b/.test(html)) leaked.push(f);
  });
  t.equal(leaked.length, 0, '"Play" (mot isolé) n\'apparaît plus dans aucune page HTML', leaked);

  const playHtml = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
  t.ok(playHtml.includes('Jeux &amp; simulations · Likanza Academy'), 'le titre de play.html est bien "Jeux & simulations"');
  t.ok(playHtml.includes('<h1 class="visually-hidden">Jeux &amp; simulations</h1>'), 'le h1 masqué reflète bien le nouveau nom');
  t.ok(fs.existsSync(path.join(ROOT, 'play.html')), 'play.html reste bien le nom de fichier/URL, inchangé');
}

// ---------- Les noms de fonctions/ids internes ne sont jamais touchés (copie uniquement) ----------
{
  const dataJs = fs.readFileSync(path.join(ROOT, 'scripts', 'data.js'), 'utf8');
  t.ok(dataJs.includes('function renderBusinessLab(elId)'), 'renderBusinessLab (nom de fonction interne) reste bien inchangé');
  const pageScript = fs.readFileSync(path.join(ROOT, 'scripts', 'pages', 'business-lab-page.js'), 'utf8');
  t.ok(pageScript.includes("renderBusinessLab('businessLab')"), 'l\'id DOM #businessLab reste bien inchangé');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
