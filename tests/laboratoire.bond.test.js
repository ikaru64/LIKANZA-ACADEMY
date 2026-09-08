/* ============================================================
   Calculateur obligataire (computeBondPrice/computeBondYTM, scripts/data.js,
   onglet Investissement de laboratoire.html) — correctif du 08/09/2026,
   trouvé en auditant le module pour la même classe de bug déjà corrigée
   deux fois (Bourse : BPA négatif ; Économie : croissance de dette à
   -100%) : un taux du marché <= -100% (le champ "bondRate" n'avait aucune
   borne HTML, contrairement à bondCoupon/bondYears) annule ou inverse la
   base d'actualisation (1 + taux/n), et couponPerPeriod/0 explose vers
   Infinity — affiché "∞ €" (Math.round(Infinity).toLocaleString('fr-FR')),
   sans qu'aucun garde-fou existant (typeof, price==null) ne l'intercepte.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadLaboratoirePage } = require('./support/load-page');

const t = createSuite('laboratoire.bond');
const { window } = loadLaboratoirePage();
const { computeBondPrice, computeBondYTM } = window;

// ---------- Cas nominal : vérifiable à la main (obligation au pair) ----------
{
  // Coupon = taux du marché -> le prix doit être exactement la valeur nominale (obligation "au pair").
  const price = computeBondPrice(1000, 5, 10, 5, 1);
  t.close(price, 1000, "obligation dont le coupon égale le taux du marché : prix = valeur nominale (au pair), cas connu vérifiable à la main");
}

// ---------- Taux du marché <= -100% : refusé, jamais Infinity ----------
t.isNull(computeBondPrice(1000, 4, 10, -100, 1), "un taux du marché à -100% est refusé (avant le correctif : prix = Infinity, affiché '∞ €')");
t.isNull(computeBondPrice(1000, 4, 10, -150, 1), "un taux du marché en dessous de -100% (-150%) est refusé aussi");
t.ok(Number.isFinite(computeBondPrice(1000, 4, 10, -50, 1)), "un taux du marché négatif mais au-dessus de -100% (-50%, cas extrême mais mathématiquement valide) reste bien calculable");

// ---------- Semestriel (n=2) : le seuil dépend bien de n, pas seulement du taux brut ----------
// ratePerPeriod = marketRatePct/100/n ; la base s'annule quand ratePerPeriod = -1, soit marketRatePct = -100*n.
t.isNull(computeBondPrice(1000, 4, 10, -200, 2), "en semestriel (n=2), un taux de -200% (ratePerPeriod = -1) est bien refusé");
t.ok(Number.isFinite(computeBondPrice(1000, 4, 10, -150, 2)), "en semestriel, -150% reste au-dessus du seuil réel (-200%) pour n=2 et reste calculable");

// ---------- BPA/taux NaN ou non finis : refusés (même garde-fou que Bourse/Économie) ----------
t.isNull(computeBondPrice(1000, NaN, 10, 5, 1), "un taux de coupon NaN est refusé (Number.isFinite, pas seulement typeof)");
t.isNull(computeBondPrice(1000, 4, 10, NaN, 1), "un taux du marché NaN est refusé");
t.isNull(computeBondPrice(1000, 4, 10, Infinity, 1), "un taux du marché infini est refusé");

// ---------- Non-régression : computeBondYTM (recherche par bissection) reste correct ----------
{
  const price = computeBondPrice(1000, 4, 10, 5, 1);
  const ytm = computeBondYTM(price, 1000, 4, 10, 1);
  t.close(ytm, 5, "computeBondYTM retrouve bien le taux du marché ayant servi à calculer le prix (cohérence prix <-> rendement)", 0.01);
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
