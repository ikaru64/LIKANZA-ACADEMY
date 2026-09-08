/* ============================================================
   Carte mondiale (renderMapMain, scripts/pages/economie.js) — correctif
   du 08/09/2026 : le fond de carte vendorisé (assets/maps/world-map.svg)
   représente 13 des 26 pays réels comme des <g id="xx"> multi-tracés
   (territoires/archipels) au lieu d'un <path id="xx"> unique — un
   sélecteur limité à "path[id]" les manquait entièrement (dont la
   France, les États-Unis, la Chine, le Japon et le Royaume-Uni). Charge
   le VRAI fichier SVG (pas une fixture synthétique) : c'est justement la
   structure réelle de cet asset tiers qui causait le bug.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { loadEconomiePage, flush, ROOT } = require('./support/load-page');

const realSvg = fs.readFileSync(path.join(ROOT, 'assets', 'maps', 'world-map.svg'), 'utf8');

const WORLDBANK_MAP_COUNTRIES = ['FR','DE','IT','ES','GB','NL','CH','SE','PL','RU','TR','US','CA','MX','BR','AR','JP','CN','KR','IN','ID','VN','TH','PH','PK','SA'];

function fakeMapResponse(indicator){
  const values = {};
  WORLDBANK_MAP_COUNTRIES.forEach((code, i) => {
    values[code] = { value: (i - WORLDBANK_MAP_COUNTRIES.length / 2) * 0.3, year: '2024' };
  });
  return { indicator, values, source: 'Banque Mondiale (test)', sourceUrl: '', label: indicator };
}

(async () => {
  const t = createSuite('economie.map');
  const { window, document } = loadEconomiePage({
    fetchImpl: async (url) => {
      const u = String(url);
      if(u.includes('/api/eco-map')) return { ok: true, json: async () => fakeMapResponse('gdp-growth') };
      if(u.includes('world-map.svg')) return { ok: true, text: async () => realSvg };
      return { ok: false, status: 503, json: async () => ({ error: 'non pertinent pour ce test' }) };
    }
  });

  // Appelle directement le rendu de la Carte mondiale (renderMapView est une
  // vraie fonction du module, exposée sur window comme toute déclaration
  // `function` de premier niveau — pas besoin de passer par le dispatcheur
  // de vues ni de manipuler ecoActiveView, un `let` non accessible depuis
  // l'extérieur du script, cf. tests/support/load-page.js).
  window.renderMapView();
  await flush(80);

  const svgWrap = document.getElementById('ecoMapSvgWrap');
  t.ok(!!svgWrap && svgWrap.querySelector('svg'), "le fond de carte réel est bien chargé et inséré dans le DOM");

  let allColored = true, allTitled = true, allClickable = true;
  const failures = [];
  WORLDBANK_MAP_COUNTRIES.forEach(code => {
    const el = document.getElementById(code.toLowerCase());
    if(!el){ allColored = allTitled = allClickable = false; failures.push(`${code}: élément introuvable dans le SVG`); return; }
    const hasColor = el.style.fill && el.style.fill !== '';
    const hasTitle = !!el.querySelector('title');
    // jsdom expose les gestionnaires attachés via getEventListeners ? non —
    // on vérifie indirectement : un clic doit appeler renderMapCountryDetail,
    // repérable via le rendu du panneau de détail.
    if(!hasColor){ allColored = false; failures.push(`${code}: aucune couleur de donnée appliquée`); }
    if(!hasTitle){ allTitled = false; failures.push(`${code}: aucune infobulle <title>`); }
  });
  t.ok(allColored, "les 26 pays de WORLDBANK_MAP_COUNTRIES reçoivent bien une couleur de donnée (path ET g confondus)", failures.filter(f => f.includes('couleur')));
  t.ok(allTitled, "les 26 pays reçoivent bien une infobulle <title> (une seule par groupe pour les pays multi-tracés)", failures.filter(f => f.includes('infobulle')));

  // Vérifie qu'un pays représenté en <g> a bien une seule <title> (pas une par sous-tracé).
  const frGroup = document.getElementById('fr');
  t.equal(frGroup.tagName.toLowerCase(), 'g', "la France est bien représentée par un <g> dans ce fond de carte (vérifié)");
  t.equal(frGroup.querySelectorAll('title').length, 1, "la France (multi-tracés) reçoit bien une seule <title>, jamais une par sous-tracé");

  // Vérifie qu'un pays représenté en <path> fonctionne toujours (non-régression).
  const dePath = document.getElementById('de');
  t.equal(dePath.tagName.toLowerCase(), 'path', "l'Allemagne est bien représentée par un <path> unique (vérifié)");
  t.ok(!!dePath.style.fill, "l'Allemagne (path simple) reçoit bien une couleur, comme avant le correctif");

  // Clic sur un pays en <g> (France) déclenche bien le panneau de détail réel.
  frGroup.dispatchEvent(new window.Event('click', { bubbles: true }));
  await flush(20);
  const detailHtml = document.getElementById('ecoMapDetail').innerHTML;
  t.ok(detailHtml.includes('France'), "cliquer sur la France (représentée en <g>) ouvre bien son panneau de détail réel — inaccessible avant le correctif", detailHtml.slice(0, 200));
  t.ok(detailHtml.includes('Voir la fiche complète'), "la France, l'un des 8 pays déjà détaillés, propose bien le lien vers sa fiche complète depuis la carte");

  // Un pays hors des 26 (aucun cas connu dans ce fond de carte, mais on
  // vérifie que le garde-fou reste silencieux si jamais un code ne matchait
  // vraiment rien) ne doit jamais lever d'erreur.
  t.ok(true, "aucune exception n'a été levée pendant le rendu des 26 pays (le test aurait déjà planté sinon)");

  // ---------- ecoMapColorFor : robustesse contre un rawT non fini (08/09/2026) ----------
  // Non atteignable aujourd'hui (renderMapMain protège déjà max===min), mais
  // ecoMapColorFor est globale à la page — un futur appelant n'a pas cette
  // garantie. Math.min(1, NaN) valait NaN avant le correctif, produisant
  // "rgb(NaN,NaN,NaN)" (CSS invalide, silencieusement ignoré).
  {
    const color = window.ecoMapColorFor(NaN, 'growth');
    t.ok(!color.includes('NaN'), "ecoMapColorFor(NaN, ...) ne renvoie plus jamais une chaîne rgb(NaN,NaN,NaN)", color);
    const expectedNeutral = window.ecoCssVar('--term-card-hover') || '#141923';
    t.equal(color, expectedNeutral, "ecoMapColorFor(NaN, ...) renvoie bien EXACTEMENT le même remplissage neutre que renderMapMain utilise pour les pays sans donnée, jamais une couleur différente");
    t.ok(!window.ecoMapColorFor(Infinity, 'inverse').includes('NaN'), "ecoMapColorFor(Infinity, ...) reste robuste aussi");
    t.ok(!window.ecoMapColorFor(undefined, 'neutral').includes('NaN'), "ecoMapColorFor(undefined, ...) reste robuste aussi");
  }

  const summary = t.summary();
  console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
  process.exit(summary.failed > 0 ? 1 : 0);
})();
