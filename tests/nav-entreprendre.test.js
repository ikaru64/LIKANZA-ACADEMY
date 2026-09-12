/* ============================================================
   Chantier E3 (refonte continuité UX, 12/09/2026) — "Business" ne doit
   plus être classé comme un marché financier (section 8 du brief) :
   sorti du groupe "Marchés" (sidebar + menu déroulant desktop) vers son
   propre groupe "Entreprendre", sur les 52 pages HTML concernées.
   Vérifie un échantillon représentatif plutôt que les 52 pages une par
   une (mécanique identique confirmée par un diff md5 avant commit).
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { ROOT } = require('./support/load-page');

const t = createSuite('nav-entreprendre');

const SAMPLE_PAGES = ['index.html', 'business.html', 'bourse.html', 'laboratoire.html', 'economie.html'];

SAMPLE_PAGES.forEach(page => {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');

  // ---------- Sidebar ----------
  const sidebarMarchésIdx = html.search(/sidebar-group-label">Marchés/);
  const sidebarEntreprendreIdx = html.search(/sidebar-group-label">Entreprendre/);
  const sidebarCompteIdx = html.search(/sidebar-group-label">Compte/);
  t.ok(sidebarMarchésIdx > -1, `${page} : le groupe sidebar "Marchés" existe bien`);
  t.ok(sidebarEntreprendreIdx > sidebarMarchésIdx, `${page} : le groupe sidebar "Entreprendre" existe bien, après "Marchés"`);
  t.ok(sidebarCompteIdx > sidebarEntreprendreIdx, `${page} : "Entreprendre" est bien positionné avant "Compte"`);
  const sidebarMarchésSegment = html.slice(sidebarMarchésIdx, sidebarEntreprendreIdx);
  const sidebarEntreprendreSegment = html.slice(sidebarEntreprendreIdx, sidebarCompteIdx);
  t.ok(!sidebarMarchésSegment.includes('business.html'), `${page} : le groupe sidebar "Marchés" ne contient plus "business.html"`);
  t.ok(sidebarEntreprendreSegment.includes('business.html'), `${page} : le groupe sidebar "Entreprendre" contient bien "business.html"`);
  t.ok(sidebarMarchésSegment.includes('bourse.html') && sidebarMarchésSegment.includes('crypto.html') && sidebarMarchésSegment.includes('economie.html'), `${page} : Bourse/Crypto/Économie restent bien dans "Marchés"`);

  // ---------- Menu déroulant desktop ----------
  const dropdownMarchésIdx = html.search(/<h5>Marchés<\/h5>/);
  const dropdownEntreprendreIdx = html.search(/<h5>Entreprendre<\/h5>/);
  t.ok(dropdownMarchésIdx > -1 && dropdownEntreprendreIdx > dropdownMarchésIdx, `${page} : le menu déroulant a bien "Marchés" puis "Entreprendre"`);
  const dropdownMarchésSegment = html.slice(dropdownMarchésIdx, dropdownEntreprendreIdx);
  t.ok(!dropdownMarchésSegment.includes('business.html'), `${page} : la colonne déroulante "Marchés" ne contient plus "business.html"`);
  const dropdownEntreprendreEnd = html.indexOf('</div>', dropdownEntreprendreIdx);
  t.ok(html.slice(dropdownEntreprendreIdx, dropdownEntreprendreEnd).includes('business.html'), `${page} : la colonne déroulante "Entreprendre" contient bien "business.html"`);
});

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
