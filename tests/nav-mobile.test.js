/* ============================================================
   Chantier E2 (refonte continuité UX, 12/09/2026) — le menu mobile bas de
   page était un ensemble totalement différent et non groupé du menu
   desktop (sidebar/menu déroulant), omettant Bourse/Crypto/Business/
   Économie/Mon Univers Financier ; le lien "Profil" pointait en fait vers
   compte.html, pas vers le vrai profil.html. Nouveau menu à 5 items :
   Accueil/Univers (Mon Univers Financier, auparavant inatteignable)/
   Défis/Labo, puis un bouton "Plus" qui réutilise EXACTEMENT le même
   mécanisme d'ouverture que le hamburger desktop (#mobileToggle/#mainNav)
   — rend tout le reste (Formations/Guides/Bibliothèque/Bourse/Crypto/
   Entreprendre/Économie/Compte/Profil) atteignable en 2 taps, sans
   dupliquer de système de menu.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { ROOT, loadPage } = require('./support/load-page');

const t = createSuite('nav-mobile');

const SAMPLE_PAGES = ['index.html', 'parcours.html', 'defis.html', 'labo-financier.html', 'bourse.html'];

SAMPLE_PAGES.forEach(page => {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const navMatch = html.match(/<nav class="mobile-bottom-nav"[\s\S]*?<\/nav>/);
  t.ok(!!navMatch, `${page} : le menu mobile bas de page existe bien`);
  const nav = navMatch[0];
  t.ok(nav.includes('href="index.html"'), `${page} : Accueil est bien présent`);
  t.ok(nav.includes('href="parcours.html"') && nav.includes('Univers'), `${page} : Mon Univers Financier est désormais atteignable depuis le menu mobile (auparavant absent)`);
  t.ok(nav.includes('href="defis.html"'), `${page} : Défis est bien présent`);
  t.ok(nav.includes('href="labo-financier.html"'), `${page} : Labo est bien présent`);
  t.ok(nav.includes('id="mobileBottomMore"'), `${page} : le bouton "Plus" existe bien`);
  t.ok(!nav.includes('href="formations.html"') && !nav.includes('href="compte.html"'), `${page} : Formations/le lien "Profil" mal étiqueté (pointant vers compte.html) ne sont plus des raccourcis directs — atteignables via "Plus"`);
});

// ---------- Le bouton "Plus" réutilise le même mécanisme que le hamburger desktop ----------
{
  const { window, document } = loadPage('index.html', ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js']);
  const nav = document.getElementById('mainNav');
  const bottomMore = document.getElementById('mobileBottomMore');
  const headerToggle = document.getElementById('mobileToggle');
  t.ok(!!nav && !!bottomMore && !!headerToggle, 'les 3 éléments (mainNav, mobileBottomMore, mobileToggle) existent bien sur la page');
  // initNav() est câblé sur le DOMContentLoaded partagé (data.js) — ce
  // harnais injecte les scripts après coup (voir tests/support/load-page.js),
  // l'événement a donc déjà eu lieu ; on appelle la vraie fonction
  // directement, comme d'autres tests le font pour renderMapView() etc.
  window.initNav();
  t.ok(!nav.classList.contains('open'), 'le menu est bien fermé au chargement');
  bottomMore.dispatchEvent(new window.Event('click'));
  t.ok(nav.classList.contains('open'), 'cliquer sur "Plus" ouvre bien le même menu que le hamburger desktop (#mainNav.open), jamais un second système de menu');
  bottomMore.dispatchEvent(new window.Event('click'));
  t.ok(!nav.classList.contains('open'), 'cliquer une seconde fois sur "Plus" referme bien le menu (bascule)');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
