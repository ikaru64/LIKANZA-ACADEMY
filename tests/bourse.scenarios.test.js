/* ============================================================
   computeScenarios (scripts/pages/bourse.js) et computeComparativeScenarios
   (scripts/data.js) — correctif du 08/09/2026 : un BPA nul, négatif ou NaN
   (typeof NaN === 'number' !) était accepté comme un BPA positif normal,
   produisant un cours cible négatif et un ordre de scénarios inversé
   (favorable pire que défavorable). Verrouille ce correctif.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBoursePage } = require('./support/load-page');

const t = createSuite('bourse.scenarios');
const { window } = loadBoursePage();
const { computeScenarios, computeComparativeScenarios } = window;

// ---------- computeScenarios : cas nominal vérifiable à la main ----------
// BPA=5, prix=100, croissance=10%, PER cible=15, horizon=1 an.
// bpaFutur central = 5 * 1.10 = 5.5 ; prixCible central = 5.5 * 15 = 82.5.
{
  const s = computeScenarios(5, 100, 10, 15, 1);
  t.ok(s !== null, "un BPA positif normal produit bien des scénarios", s);
  t.close(s.central.prixCible, 82.5, "scénario central : cours cible = 82.5 (calcul à la main)");
  t.ok(s.favorable.prixCible > s.central.prixCible && s.central.prixCible > s.defavorable.prixCible,
    "l'ordre défavorable < central < favorable est bien respecté sur un BPA positif",
    [s.defavorable.prixCible, s.central.prixCible, s.favorable.prixCible]);
}

// ---------- computeScenarios : BPA invalide (nul, négatif, NaN, undefined) ----------
t.isNull(computeScenarios(-2.5, 178.4, 5, 15, 3), "un BPA négatif est refusé (avant le correctif : cours cible négatif, ordre inversé)");
t.isNull(computeScenarios(0, 178.4, 5, 15, 3), "un BPA nul est refusé");
t.isNull(computeScenarios(NaN, 178.4, 5, 15, 3), "un BPA NaN est refusé (typeof NaN === 'number' est le piège corrigé)");
t.isNull(computeScenarios(undefined, 178.4, 5, 15, 3), "un BPA undefined est refusé");

// ---------- computeScenarios : prix actuel invalide, même avec un BPA valide ----------
t.isNull(computeScenarios(5, 0, 10, 15, 1), "un prix actuel à 0 est refusé");
t.isNull(computeScenarios(5, -50, 10, 15, 1), "un prix actuel négatif est refusé");
t.isNull(computeScenarios(5, NaN, 10, 15, 1), "un prix actuel NaN est refusé");

// ---------- computeComparativeScenarios : un seul côté invalide ne doit jamais affecter l'autre ----------
{
  const { a, b } = computeComparativeScenarios(5, -2.5, { growth: 10, perTarget: 15, horizon: 1 });
  t.ok(a !== null, "côté A (BPA positif) produit bien des scénarios même si B est invalide", a);
  t.isNull(b, "côté B (BPA négatif) est bien refusé indépendamment");
  t.close(a.central.prixCible, 82.5, "côté A valide : même résultat que le calcul isolé (82.5)");
}
{
  const { a, b } = computeComparativeScenarios(NaN, 8, { growth: 5, perTarget: 12, horizon: 2 });
  t.isNull(a, "côté A (BPA NaN) est refusé");
  t.ok(b !== null, "côté B (BPA valide) produit bien un résultat, non affecté par l'invalidité de A", b);
}
t.equal(computeComparativeScenarios(0, 0, { growth: 5, perTarget: 12, horizon: 2 }), { a: null, b: null },
  "deux BPA nuls -> les deux côtés sont refusés, jamais un cours cible à 0 € affiché comme réel");

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
