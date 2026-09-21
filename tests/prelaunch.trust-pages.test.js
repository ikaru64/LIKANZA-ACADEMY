/* ============================================================
   Pré-lancement (2026-09-21), P0 — pages de confiance : mentions légales
   sans "démonstration"/"avant toute mise en ligne", identité éditeur jamais
   inventée (champs vides simplement absents, aucun marqueur visible), contact
   piloté par SITE_CONFIG, roadmap factuelle, aucune erreur technique brute
   affichée à l'utilisateur.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { loadPage, ROOT } = require('./support/load-page');

const t = createSuite('prelaunch.trust-pages');
// Texte réellement visible : les <script> réinjectés par le harnais font partie du body (commentaires de code inclus).
function visibleText(doc){ const c = doc.body.cloneNode(true); c.querySelectorAll('script').forEach(n => n.remove()); return c.textContent; }
const COMMON = ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/historical-data.js'];

// ---------- Mentions légales ----------
{
  const { document, window, runInPage } = loadPage('legal.html', [...COMMON, 'scripts/pages/legal.js']);
  const text = visibleText(document);
  t.ok(!/démonstration technique/i.test(text), 'legal.html ne se présente plus comme une "démonstration technique"');
  t.ok(!/avant toute mise en ligne/i.test(text), 'legal.html ne renvoie plus à une échéance "avant toute mise en ligne"');
  t.ok(!/contenus de démonstration/i.test(text), 'legal.html ne qualifie plus les contenus Crypto de "démonstration"');
  t.ok(!/À RENSEIGNER/i.test(text), "aucun marqueur [À RENSEIGNER…] n'est visible dans l'interface publique");
  const ident = document.getElementById('legalIdentity');
  t.ok(ident.textContent.includes('Hébergeur'), "l'hébergeur (info factuelle, pas personnelle) est bien affiché");
  t.ok(!ident.textContent.includes('Éditeur'), "champ éditeur vide : la ligne n'est pas affichée (jamais une valeur inventée)");
  t.ok(!/Aucun formulaire ni adresse de contact/.test(text), "l'ancien aveu \"aucun moyen de contact\" a disparu");
  t.ok(/version la plus récente/.test(text), 'la politique de confidentialité décrit la vraie synchronisation (la plus récente gagne)');
  t.ok(!/ne compare jamais les dates/.test(text), "l'ancienne description de la synchronisation (sans comparaison de dates) a disparu");

  // Champs renseignés : affichés, échappés, jamais de HTML injecté
  runInPage(`SITE_CONFIG.publisherName = 'Jeanne <b>Dupont</b>'; SITE_CONFIG.contactEmail = 'contact@exemple.test'; window.__r = 1;`);
  window.renderSiteIdentity('legalIdentity');
  t.ok(ident.textContent.includes('Jeanne <b>Dupont</b>') && !ident.querySelector('b'), 'un champ renseigné est affiché et échappé (aucune injection HTML)');
  t.ok(!!ident.querySelector('a[href="mailto:contact@exemple.test"]'), "l'e-mail renseigné devient un vrai lien mailto");
  runInPage(`SITE_CONFIG.contactEmail = 'pas-un-email'; window.__r = 1;`);
  window.renderSiteIdentity('legalIdentity');
  t.ok(!ident.querySelector('a[href^="mailto:"]'), "une valeur qui n'est pas un e-mail n'est jamais transformée en lien");
}

// ---------- getSiteConfigMissing : ce qu'il reste à renseigner ----------
{
  const { window } = loadPage('legal.html', [...COMMON, 'scripts/pages/legal.js']);
  const missing = window.getSiteConfigMissing();
  t.ok(['contactEmail', 'publisherName', 'publisherStatus', 'publisherAddress'].every(k => missing.includes(k)), 'la liste des champs encore vides est exposée (contactEmail, publisherName, publisherStatus, publisherAddress)');
}

// ---------- Contact ----------
{
  const { document, window, runInPage } = loadPage('contact.html', [...COMMON, 'scripts/pages/contact.js']);
  const block = document.getElementById('contactBlock');
  t.ok(block.textContent.trim().length > 0, "la page Contact n'est jamais vide");
  t.ok(!block.querySelector('a[href^="mailto:"]'), "sans e-mail renseigné, aucun lien mailto n'est inventé");
  t.ok(!/À RENSEIGNER/i.test(visibleText(document)), 'aucun marqueur visible sur la page Contact');
  runInPage(`SITE_CONFIG.contactEmail = 'bonjour@exemple.test'; window.__r = 1;`);
  window.renderContactBlock('contactBlock');
  t.ok(!!block.querySelector('a[href="mailto:bonjour@exemple.test"]'), "avec un e-mail renseigné, un vrai bouton mailto apparaît");
}

// ---------- Roadmap ----------
{
  const html = fs.readFileSync(path.join(ROOT, 'avenir.html'), 'utf8');
  const disponible = html.indexOf('<h2>Disponible</h2>');
  const dev = html.indexOf('<h2>En développement</h2>');
  const plusTard = html.indexOf('<h2>Plus tard</h2>');
  t.ok(disponible > 0 && dev > disponible && plusTard > dev, 'la roadmap est organisée en Disponible / En développement / Plus tard');
  const plusTardBlock = html.slice(plusTard);
  t.ok(!/Synchronisation cloud|multi-appareils/i.test(plusTardBlock), "la synchronisation cloud (déjà en ligne) n'est plus présentée comme future");
  t.ok(/Compte &amp; synchronisation/.test(html.slice(disponible, dev)), 'la synchronisation apparaît bien dans "Disponible"');
  t.ok(!/<form/.test(html) && !/Bientôt disponible/.test(html), 'plus de formulaire factice ni de bouton "Bientôt disponible"');
}

// ---------- Aucun marqueur interne visible sur aucune page ----------
{
  const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  const offenders = htmlFiles.filter(f => /\[À RENSEIGNER|\[A RENSEIGNER|lorem ipsum|\bTODO\b/i.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  t.equal(offenders.length, 0, "aucune page HTML ne contient de marqueur interne visible (À RENSEIGNER / lorem ipsum / TODO)", offenders);
}

// ---------- Messages d'erreur : jamais de détail technique brut ----------
{
  const { window } = loadPage('legal.html', [...COMMON, 'scripts/pages/legal.js']);
  ['HTTP 502', 'HTTP 404', 'Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed', 'undefined', 'Unexpected token < in JSON'].forEach(m => {
    t.equal(window.friendlyErrorDetail(new Error(m)), '', `le message technique "${m}" n'est jamais affiché`);
  });
  t.equal(window.friendlyErrorDetail(new Error('Historique insuffisant pour cette période')), 'Historique insuffisant pour cette période', 'un message déjà rédigé en français est conservé comme précision');
  t.equal(window.friendlyErrorSuffix(new Error('HTTP 500')), '', 'suffixe vide pour une erreur technique');
  t.equal(window.friendlyErrorSuffix(null), '', 'suffixe vide sans erreur (jamais "undefined")');
  ['scripts/pages/bourse.js', 'scripts/pages/economie.js', 'scripts/pages/laboratoire.js', 'scripts/pages/marche.js'].forEach(f => {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const leaks = src.split('\n').filter(l => /\$\{err\.message\}/.test(l) && !/console\./.test(l));
    t.equal(leaks.length, 0, `${f} n'interpole plus err.message brut dans l'interface`);
  });
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
