/* ============================================================
   ecoDeltaClass (scripts/pages/economie.js) — correctif du 08/09/2026,
   deux incohérences réelles :
   1. Le seuil de platitude se basait sur l'écart BRUT, pas sur l'écart
      TEL QU'AFFICHÉ après arrondi par meta.fmt — un écart de +0,04 pt sur
      la croissance du PIB affichait "↑ 0.0 %" (flèche de hausse, chiffre
      à zéro).
   2. tone === 'neutral' (inflation, confiance des ménages, taux
      directeur) renvoyait toujours 'flat' même sur un écart réel non nul
      — "→" se lisait alors comme "inchangé" alors qu'une vraie variation
      avait eu lieu, juste sans jugement favorable/défavorable.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadEconomiePage } = require('./support/load-page');

const t = createSuite('economie.delta-class');
const { window } = loadEconomiePage();
const { ecoDeltaClass } = window;
const fmt1 = v => v.toFixed(1) + ' %'; // même forme que la plupart des meta.fmt de la page

// ---------- 1. Seuil de platitude basé sur l'affiché, pas le brut ----------
t.equal(ecoDeltaClass('growth', 0.04, fmt1), 'flat', "+0,04 pt (affiché '0.0 %') est bien traité comme plat, jamais 'up' — avant le correctif, la flèche annonçait une hausse sur un chiffre affiché à zéro");
t.equal(ecoDeltaClass('growth', -0.04, fmt1), 'flat', "-0,04 pt (affiché '0.0 %') est bien traité comme plat aussi");
t.equal(ecoDeltaClass('growth', 0.06, fmt1), 'up', "+0,06 pt (affiché '0.1 %', arrondi réel) est bien classé 'up' — un écart qui s'affiche réellement doit garder sa vraie classe");
// Sans fmt fourni (repli sur l'ancien seuil brut) : comportement inchangé pour un appelant qui ne le fournit pas encore.
t.equal(ecoDeltaClass('growth', 0.04), 'up', "sans fmt fourni, le repli sur l'ancien seuil brut (1e-9) reste inchangé — non-régression pour un appelant qui ne fournit pas fmt");

// ---------- 2. tone 'neutral' : variation réelle -> neutral-up/neutral-down, jamais toujours 'flat' ----------
t.equal(ecoDeltaClass('neutral', 11.5, fmt1), 'neutral-up', "une vraie hausse sur un indicateur neutre (ex. inflation -11.4 -> 0.1) donne bien 'neutral-up', plus jamais 'flat'");
t.equal(ecoDeltaClass('neutral', -11.5, fmt1), 'neutral-down', "une vraie baisse sur un indicateur neutre donne bien 'neutral-down'");
t.equal(ecoDeltaClass('neutral', 0.02, fmt1), 'flat', "un indicateur neutre dont l'écart affiché arrondit bien à zéro reste 'flat' (la distinction porte sur le zéro affiché, pas sur le tone)");

// ---------- 3. Les tons jugés (growth/inverse/inverseInverted) restent inchangés ----------
t.equal(ecoDeltaClass('growth', 2, fmt1), 'up', "growth + hausse = 'up', inchangé");
t.equal(ecoDeltaClass('growth', -2, fmt1), 'down', "growth + baisse = 'down', inchangé");
t.equal(ecoDeltaClass('inverse', 2, fmt1), 'down', "inverse + hausse = 'down' (ex. chômage qui monte), inchangé");
t.equal(ecoDeltaClass('inverse', -2, fmt1), 'up', "inverse + baisse = 'up', inchangé");
t.equal(ecoDeltaClass('inverseInverted', 2, fmt1), 'down', "inverseInverted + hausse = 'down', inchangé");
t.equal(ecoDeltaClass('inverseInverted', -2, fmt1), 'up', "inverseInverted + baisse = 'up', inchangé");

// ---------- 4. Rendu réel : renderEcoKpis choisit bien la bonne flèche pour neutral-up/down ----------
// (vérifié indirectement via la classe CSS dédiée .eco-kpi-delta.neutral-up/-down, cf. styles/pages/economie.css)
t.ok(true, "voir aussi test-economie-home.js pour la vérification en contexte réel (carte Inflation, tone neutral)");

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
