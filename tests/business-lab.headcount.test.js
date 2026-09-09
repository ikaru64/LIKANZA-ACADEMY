/* ============================================================
   Simulateur RH/Recrutement (computeHeadcountBreakeven, scripts/data.js,
   outil "Simulateur RH / Recrutement" de business-lab.html) — correctif du
   09/09/2026, trouvé en auditant le Laboratoire Professionnel (2e module
   soumis au même audit auto-dirigé que Bourse/Économie/Laboratoire
   personnel) : "Charges patronales (% du brut)" n'a qu'une borne HTML
   min="0" (soft — un champ number laisse toujours taper une valeur négative
   au clavier). Sans garde-fou, des charges patronales négatives inversent
   le signe de coutTotalMensuel (coût mensuel négatif), un chiffre qui n'a
   aucun sens réel affiché comme un vrai coût. Contrairement aux autres
   calculateurs Business (profil, scénarios, valorisation...), celui-ci lit
   les champs du DOM directement sans passer par un save*() qui filtrerait
   déjà les valeurs négatives — d'où sa vulnérabilité isolée.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBusinessLabPage } = require('./support/load-page');

const t = createSuite('business-lab.headcount');

function openHeadcountTool(window, document){
  document.getElementById('businessLab-headcount').dispatchEvent(new window.Event('click'));
  return 'businessLab-session-headcount';
}

function setField(document, elId, key, value){
  const el = document.getElementById(`${elId}-${key}`);
  el.value = value;
  el.dispatchEvent(new (el.ownerDocument.defaultView.Event)('input', {bubbles: true}));
}

// ---------- Cas nominal (valeurs par défaut) : coût réel positif, cohérent ----------
{
  const { window, document } = loadBusinessLabPage();
  const elId = openHeadcountTool(window, document);
  const resultsHtml = document.getElementById(`${elId}-results`).innerHTML;
  // Défauts : 2800 * 1.42 = 3976 (toLocaleString('fr-FR') insère un espace
  // insécable fine U+202F comme séparateur de milliers, pas un espace normal
  // — on ne matche donc que les chiffres, jamais le séparateur exact).
  t.ok(/3.?976/.test(resultsHtml.replace(/[\s  ]/g, ' ')), "coût total mensuel par défaut (2800€ × 1.42) affiché correctement");
}

// ---------- Charges patronales négatives (-150%) : refusé, jamais un coût négatif silencieux ----------
{
  const { window, document } = loadBusinessLabPage();
  const elId = openHeadcountTool(window, document);
  setField(document, elId, 'chargesPatronalesPct', '-150');
  const resultsHtml = document.getElementById(`${elId}-results`).innerHTML;
  t.ok(!/-\s?\d[\d\s]*€.*mensuel/i.test(resultsHtml), "aucun coût mensuel négatif n'est jamais affiché comme un vrai résultat");
  t.ok(resultsHtml.includes('positive') || resultsHtml.includes('négatif'), "un message d'erreur explicite remplace le calcul quand les charges patronales sont négatives (avant le correctif : coût mensuel = -1400€ affiché sans alerte)");
}

// ---------- Salaire brut négatif : refusé aussi ----------
{
  const { window, document } = loadBusinessLabPage();
  const elId = openHeadcountTool(window, document);
  setField(document, elId, 'salaireBrutMensuel', '-2000');
  const resultsHtml = document.getElementById(`${elId}-results`).innerHTML;
  t.ok(resultsHtml.includes('positive') || resultsHtml.includes('négatif'), "un salaire brut négatif déclenche le même message d'erreur explicite");
}

// ---------- Non-régression directe sur la fonction pure ----------
{
  const { window } = loadBusinessLabPage();
  const { computeHeadcountBreakeven } = window;
  t.isNull(computeHeadcountBreakeven({salaireBrutMensuel: 2000, chargesPatronalesPct: -10, coutRecrutement: 1000, margeGenereeParEmploye: 3000}), "computeHeadcountBreakeven renvoie null pour des charges patronales négatives");
  t.isNull(computeHeadcountBreakeven({salaireBrutMensuel: -100, chargesPatronalesPct: 40, coutRecrutement: 1000, margeGenereeParEmploye: 3000}), "computeHeadcountBreakeven renvoie null pour un salaire négatif");
  const ok = computeHeadcountBreakeven({salaireBrutMensuel: 2800, chargesPatronalesPct: 42, coutRecrutement: 2000, margeGenereeParEmploye: 3500});
  t.close(ok.coutTotalMensuel, 3976, "cas nominal : coût total mensuel = 2800 * 1.42 (vérifiable à la main)");
  t.isNull(ok.moisBreakEven, "marge générée (3500) < coût total (3976) -> marge nette négative -> jamais rentabilisé, moisBreakEven = null (jamais un chiffre négatif inventé)");
  const profitable = computeHeadcountBreakeven({salaireBrutMensuel: 2000, chargesPatronalesPct: 40, coutRecrutement: 1000, margeGenereeParEmploye: 5000});
  t.close(profitable.moisBreakEven, 1000 / (5000 - 2800), "cas rentable : coût recrutement / marge nette mensuelle (vérifiable à la main : 1000 / (5000 - 2000*1.4))", 0.01);
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
