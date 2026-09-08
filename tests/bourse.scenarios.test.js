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

// ---------- Écart de croissance proportionnel à l'hypothèse centrale (option B, 08/09/2026) ----------
// growthSpread = max(|growth| * 0.5, 2). Vérifié en dérivant le taux de
// croissance implicite des scénarios défavorable/favorable à partir du
// cours cible obtenu (BPA=5, PER=15, horizon=1 an, pour rester simple :
// prixCible = 5 * (1+g/100) * per).
function impliedGrowth(prixCible, per, bpa){ return ((prixCible / (per * bpa)) - 1) * 100; }
{
  // growth=2 -> spread=max(1,2)=2 -> défavorable=0%, favorable=4%
  const s = computeScenarios(5, 100, 2, 15, 1);
  t.close(impliedGrowth(s.defavorable.prixCible, 15 * 0.75, 5), 0, "à 2 % de croissance centrale, le scénario défavorable retombe sur 0 % (écart resserré par le plancher), pas -4 % comme avec l'ancien écart fixe de 6 pts");
  t.close(impliedGrowth(s.favorable.prixCible, 15 * 1.25, 5), 4, "à 2 % de croissance centrale, le scénario favorable est à 4 %");
}
{
  // growth=20 -> spread=max(10,2)=10 -> défavorable=10%, favorable=30%
  const s = computeScenarios(5, 100, 20, 15, 1);
  t.close(impliedGrowth(s.defavorable.prixCible, 15 * 0.75, 5), 10, "à 20 % de croissance centrale, l'écart s'élargit bien (défavorable à 10 %, pas 14 % comme avec l'ancien écart fixe)");
  t.close(impliedGrowth(s.favorable.prixCible, 15 * 1.25, 5), 30, "à 20 % de croissance centrale, le scénario favorable est à 30 %");
}
{
  // growth=0 -> spread=max(0,2)=2 (plancher) -> défavorable=-2%, favorable=2%
  const s = computeScenarios(5, 100, 0, 15, 1);
  t.close(impliedGrowth(s.defavorable.prixCible, 15 * 0.75, 5), -2, "à 0 % de croissance centrale, le plancher de 2 points garde un écart lisible entre les 3 scénarios (jamais un écart nul)");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
