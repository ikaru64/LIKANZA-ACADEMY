/* ============================================================
   computeOptionPayoff / computeOptionMetrics (scripts/data.js) — payoff
   à l'échéance, acheteur/vendeur, call/put, et rejet des entrées
   invalides. Fonctions pures : chargées via la vraie page (mêmes
   fondations que le reste du site), mais aucun DOM n'est nécessaire pour
   les appeler.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBoursePage } = require('./support/load-page');

const t = createSuite('bourse.options');
const { window } = loadBoursePage();
const { computeOptionPayoff, computeOptionMetrics } = window;

// ---------- computeOptionPayoff ----------
// Call, position longue, strike 100, prime 5.
// - Prix d'expiration au-dessus du strike (120) : intrinsèque = 20, payoff = 20 - 5 = 15.
t.close(computeOptionPayoff('call', 'long', 100, 5, 120), 15, "call long, prix au-dessus du strike : payoff = intrinsèque - prime (15)");
// - Au point mort (105 = strike + prime) : intrinsèque = 5, payoff = 5 - 5 = 0.
t.close(computeOptionPayoff('call', 'long', 100, 5, 105), 0, "call long, au point mort (strike + prime) : payoff = 0");
// - En dessous du strike (90) : intrinsèque = 0, payoff = 0 - 5 = -5 (perte = la prime).
t.close(computeOptionPayoff('call', 'long', 100, 5, 90), -5, "call long, en dessous du strike : payoff = -prime (perte maximale)");

// Call, position vendeur (short) : payoff inversé par rapport au long, à somme nulle entre les deux parties.
t.close(computeOptionPayoff('call', 'short', 100, 5, 120), -15, "call short, prix au-dessus du strike : perte symétrique de l'acheteur");
t.close(computeOptionPayoff('call', 'short', 100, 5, 90), 5, "call short, en dessous du strike : gain = la prime encaissée (perte max de l'acheteur)");

// Put, position longue, strike 100, prime 4.
t.close(computeOptionPayoff('put', 'long', 100, 4, 80), 16, "put long, prix en dessous du strike : payoff = (strike - prix) - prime (16)");
t.close(computeOptionPayoff('put', 'long', 100, 4, 96), 0, "put long, au point mort (strike - prime) : payoff = 0");
t.close(computeOptionPayoff('put', 'long', 100, 4, 120), -4, "put long, au-dessus du strike : payoff = -prime (l'option expire sans valeur)");

// Put, position vendeur.
t.close(computeOptionPayoff('put', 'short', 100, 4, 80), -16, "put short, prix en dessous du strike : perte symétrique de l'acheteur");
t.close(computeOptionPayoff('put', 'short', 100, 4, 120), 4, "put short, au-dessus du strike : gain = la prime encaissée");

// Entrées invalides : jamais un chiffre calculé sur des paramètres qui n'ont pas de sens.
t.isNull(computeOptionPayoff('call', 'long', -100, 5, 120), "un strike négatif est refusé (payoff)");
t.isNull(computeOptionPayoff('call', 'long', 100, -5, 120), "une prime négative est refusée (payoff)");
t.isNull(computeOptionPayoff('call', 'long', 100, 5, NaN), "un prix d'expiration NaN est refusé (payoff)");
t.isNull(computeOptionPayoff('call', 'long', 100, 5, -10), "un prix d'expiration négatif est refusé (payoff)");

// ---------- computeOptionMetrics ----------
// Call long : perte plafonnée à la prime, gain non plafonné (contractuellement illimité).
{
  const m = computeOptionMetrics('call', 'long', 100, 5);
  t.close(m.breakeven, 105, "call long : point mort = strike + prime");
  t.close(m.maxLoss, 5, "call long : perte maximale = la prime versée");
  t.isNull(m.maxGain, "call long : gain maximal non plafonné (null, jamais un chiffre inventé pour un risque contractuellement illimité)");
}
// Call short : gain plafonné à la prime, perte non plafonnée.
{
  const m = computeOptionMetrics('call', 'short', 100, 5);
  t.close(m.breakeven, 105, "call short : même point mort que le long (c'est le même contrat, vu de l'autre côté)");
  t.close(m.maxGain, 5, "call short : gain maximal = la prime encaissée");
  t.isNull(m.maxLoss, "call short : perte maximale non plafonnée (le sous-jacent peut monter indéfiniment)");
}
// Put long : perte plafonnée à la prime, gain plafonné (le sous-jacent ne peut pas descendre sous 0).
{
  const m = computeOptionMetrics('put', 'long', 100, 4);
  t.close(m.breakeven, 96, "put long : point mort = strike - prime");
  t.close(m.maxLoss, 4, "put long : perte maximale = la prime versée");
  t.close(m.maxGain, 96, "put long : gain maximal plafonné (strike - prime, le sous-jacent ne peut pas être négatif)");
}
// Put short : gain plafonné à la prime, perte plafonnée (mais peut être importante).
{
  const m = computeOptionMetrics('put', 'short', 100, 4);
  t.close(m.maxGain, 4, "put short : gain maximal = la prime encaissée");
  t.close(m.maxLoss, 96, "put short : perte maximale plafonnée à (strike - prime), pas illimitée comme pour un call short");
}
// Cas limite : prime supérieure au strike sur un put -> la perte plafonnée ne doit jamais devenir négative.
{
  const m = computeOptionMetrics('put', 'long', 10, 15);
  t.close(m.maxGain, 0, "put avec une prime supérieure au strike : le gain plafonné est ramené à 0, jamais un nombre négatif absurde");
}

// Entrées invalides.
t.isNull(computeOptionMetrics('call', 'long', -1, 5), "un strike négatif est refusé (metrics)");
t.isNull(computeOptionMetrics('call', 'long', 100, -1), "une prime négative est refusée (metrics)");
t.isNull(computeOptionMetrics('call', 'long', NaN, 5), "un strike NaN est refusé (metrics)");

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
