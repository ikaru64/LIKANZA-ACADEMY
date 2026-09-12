/* ============================================================
   Chantier J (refonte continuité UX, 12/09/2026) — index.html gagne 2
   aperçus compacts toujours visibles (Marchés, Défi rapide), auparavant
   cachés derrière un clic sur un onglet, et démote 2 blocs décoratifs
   (démo d'intérêts composés, Premium/newsletter) derrière un <details>
   progressif — jamais supprimés. Découverte en cours de route : index.html
   est bilingue (EN/FR, I18N) — le système de widgets réutilisable
   (renderDashboardShell/DASHBOARD_WIDGETS) est français uniquement, donc
   PAS réutilisé ici (décision explicite de l'utilisateur) : cette refonte
   reste dans l'architecture i18n existante, en ajoutant/réorganisant du
   contenu réel plutôt qu'en changeant de système.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadPage } = require('./support/load-page');

const t = createSuite('index.dashboard');

const { window, document, runInPage } = loadPage('index.html', ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/pages/index.js']);

// ---------- Aperçu Marchés : nouveau, toujours visible, jamais un second calcul ----------
{
  const el = document.getElementById('homeMarketsPreview');
  t.ok(!!el, 'le conteneur de l\'aperçu Marchés existe bien');
  t.ok(el.innerHTML.includes('MARCHÉS'), 'l\'aperçu Marchés affiche bien son eyebrow');
  // MARKET_DATA est un `const` de premier niveau : invisible depuis window.xxx, accessible via runInPage.
  const marketNames = runInPage('window.__r = MARKET_DATA.slice(0, 4).map(m => m.nom);');
  marketNames.forEach(nom => {
    // jsdom sérialise "&" en "&amp;" dans .innerHTML (ex. "S&P 500").
    const expected = nom.replace(/&/g, '&amp;');
    t.ok(el.innerHTML.includes(expected), `l'aperçu Marchés affiche bien "${nom}" (même donnée réelle que MARKET_DATA, jamais un second calcul)`);
  });
  t.ok(el.innerHTML.includes('href="bourse.html"'), 'l\'aperçu Marchés propose bien une action claire vers Bourse');
}

// ---------- Aperçu Défi rapide : nouveau, toujours visible, MÊME contenu que la teaser d'onglet ----------
{
  const previewEl = document.getElementById('homeChallengePreview');
  const tabEl = document.getElementById('homeDefisTeaser');
  t.ok(!!previewEl && !!tabEl, 'les 2 conteneurs (aperçu toujours visible + teaser d\'onglet) existent bien');
  t.ok(previewEl.innerHTML.includes('DÉFI RAPIDE'), 'l\'aperçu Défi rapide affiche bien son eyebrow');
  t.ok(previewEl.innerHTML.includes('href="defis.html"') && tabEl.innerHTML.includes('href="defis.html"'), 'les 2 emplacements proposent bien la même action réelle, jamais 2 formulations différentes');
}

// ---------- Démo d'intérêts composés : démotée derrière un <details>, jamais supprimée ----------
{
  const details = Array.from(document.querySelectorAll('#tab-simuler details'));
  t.equal(details.length, 1, 'la démo d\'intérêts composés est bien encapsulée dans un <details> replié par défaut');
  t.ok(!details[0].hasAttribute('open'), 'le <details> de la démo est bien replié par défaut (progressive disclosure, jamais supprimé)');
  t.ok(!!document.getElementById('homeSimCapital') && !!document.getElementById('homeSimResult'), 'les champs réels de la démo existent toujours dans le DOM, juste repliés — jamais retirés');
}

// ---------- Premium/Newsletter : démotés derrière un <details>, jamais supprimés ----------
{
  const detailsList = Array.from(document.querySelectorAll('section details'));
  const moreDetails = detailsList.find(d => d.innerHTML.includes('newsletterForm'));
  t.ok(!!moreDetails, 'le bloc Premium/Newsletter est bien encapsulé dans un <details>');
  t.ok(!moreDetails.hasAttribute('open'), 'le <details> Premium/Newsletter est bien replié par défaut');
  t.ok(!!document.getElementById('newsletterForm') && !!document.getElementById('premiumTeaserBtn'), 'le formulaire newsletter et le bouton Premium existent toujours dans le DOM, juste repliés — jamais retirés');
}

// ---------- i18n toujours fonctionnel (la découverte qui a fait pivoter le scope de ce chantier) ----------
{
  window.setLang('en');
  t.ok(document.getElementById('homeMarketsPreview').innerHTML.includes('MARKETS'), 'basculer en anglais traduit bien le nouvel aperçu Marchés (le système i18n existant n\'a pas été cassé)');
  t.ok(document.getElementById('homeChallengePreview').innerHTML.includes('QUICK CHALLENGE'), 'basculer en anglais traduit bien le nouvel aperçu Défi rapide');
  window.setLang('fr');
  t.ok(document.getElementById('homeMarketsPreview').innerHTML.includes('MARCHÉS'), 'rebasculer en français fonctionne toujours');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
