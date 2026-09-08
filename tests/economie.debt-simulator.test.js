/* ============================================================
   Simulateur de dette (computeDebtProjection + recompute, dans
   openDebtSimulator, scripts/pages/economie.js) — correctif du
   08/09/2026 : une croissance réelle de -100% (aucune borne HTML avant)
   faisait exploser le calcul vers Infinity ; un solde primaire fortement
   excédentaire donnait une dette négative sans plafond ; un champ vidé
   était silencieusement remplacé par 0 (`+valeur || 0`) au lieu de
   suspendre le calcul.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadEconomiePage, flush } = require('./support/load-page');

(async () => {
  const t = createSuite('economie.debt-simulator');
  const { window, document } = loadEconomiePage({
    fetchImpl: async (url) => {
      if(String(url).includes('gov-debt-fr')) return { ok: true, json: async () => ({ points: [{ period: '2026-Q1', value: 110 }], source: 'Eurostat', frequency: 'Trimestrielle' }) };
      return { ok: false, status: 503, json: async () => ({ error: 'non pertinent pour ce test' }) };
    }
  });

  window.openDebtSimulator('FR', true);
  await flush(50);

  const dialog = document.getElementById('ecoDebtSimDialog');
  t.ok(!!dialog, "la modale de simulation existe bien dans le DOM réel");

  function setFields({ dette0, croissance, inflation, taux, solde }){
    if(dette0 !== undefined) document.getElementById('dsDette0').value = String(dette0);
    if(croissance !== undefined) document.getElementById('dsCroissance').value = String(croissance);
    if(inflation !== undefined) document.getElementById('dsInflation').value = String(inflation);
    if(taux !== undefined) document.getElementById('dsTaux').value = String(taux);
    if(solde !== undefined) document.getElementById('dsSolde').value = String(solde);
    document.getElementById('dsSolde').dispatchEvent(new window.Event('input', { bubbles: true }));
  }
  function resultsText(){ return document.getElementById('dsResults').innerHTML; }

  // ---------- Bornes HTML réelles sur les 5 champs ----------
  t.equal(document.getElementById('dsCroissance').min, '-15', "le champ croissance réelle porte bien une borne min réelle dans le HTML");
  t.equal(document.getElementById('dsCroissance').max, '15', "le champ croissance réelle porte bien une borne max réelle dans le HTML");
  t.equal(document.getElementById('dsTaux').min, '0', "le champ taux d'intérêt porte bien une borne min réelle (jamais négatif)");

  // ---------- Cas nominal (valeurs par défaut réelles de la page) ----------
  setFields({ dette0: 110, croissance: 1.2, inflation: 2, taux: 3.2, solde: -2 });
  t.ok(/\d+[.,]\d+\s*% PIB/.test(resultsText()), "cas nominal : une vraie projection chiffrée s'affiche", resultsText());
  t.ok(!resultsText().includes('Infinity') && !resultsText().includes('NaN'), "cas nominal : aucun Infinity ni NaN ne fuit à l'écran");

  // ---------- Croissance réelle à -100% (avant le correctif : Infinity) ----------
  setFields({ croissance: -100 });
  t.ok(!resultsText().includes('Infinity'), "croissance réelle à -100% : plus jamais Infinity affiché");
  t.ok(!/\d+[.,]\d+\s*% PIB/.test(resultsText()), "croissance réelle à -100% : aucun chiffre n'est affiché, seulement une explication", resultsText());

  // ---------- Croissance très négative mais dans la plage autorisée (-15%) ----------
  setFields({ croissance: -15, inflation: -5 });
  t.ok(!resultsText().includes('Infinity') && !resultsText().includes('NaN'), "croissance très négative (-15%, plage autorisée) : toujours pas d'Infinity/NaN");

  // ---------- Solde primaire fortement excédentaire : dette plafonnée à 0, jamais négative ----------
  setFields({ dette0: 20, croissance: 0, inflation: 0, taux: 3, solde: 20 });
  t.ok(!resultsText().includes('-') || resultsText().includes('Dette remboursée'), "solde primaire fortement excédentaire : jamais une dette négative affichée sèchement", resultsText());
  t.ok(resultsText().includes('Dette remboursée') || resultsText().includes('0.0'), "solde primaire fortement excédentaire : le plancher à 0 est bien atteint et expliqué");

  // ---------- Taux d'intérêt au maximum autorisé (25%) ----------
  setFields({ dette0: 110, croissance: 1, inflation: 2, taux: 25, solde: -2 });
  t.ok(!resultsText().includes('Infinity') && !resultsText().includes('NaN'), "taux d'intérêt maximal (25%) : toujours pas d'Infinity/NaN");

  // ---------- Chaque champ vidé un par un : jamais remplacé silencieusement par 0 ----------
  const fields = ['dsDette0', 'dsCroissance', 'dsInflation', 'dsTaux', 'dsSolde'];
  for(const id of fields){
    setFields({ dette0: 110, croissance: 1.2, inflation: 2, taux: 3.2, solde: -2 });
    document.getElementById(id).value = '';
    document.getElementById(id).dispatchEvent(new window.Event('input', { bubbles: true }));
    t.ok(!/\d+[.,]\d+\s*% PIB/.test(resultsText()), `champ ${id} vidé : aucun chiffre affiché (jamais remplacé silencieusement par 0)`, resultsText());
    t.ok(resultsText().toLowerCase().includes('renseigne'), `champ ${id} vidé : un message explicite invite à le renseigner`);
  }

  // ---------- Précision : formule exacte d*(1+i)/(1+g) - pb (08/09/2026) ----------
  // L'ancienne récurrence développée (dette + intérêts - effet de
  // croissance - solde primaire) omettait le terme croisé -i*g/(1+g)*dette
  // et surestimait la dette de ~2,6 points de PIB à 20 ans sur ces mêmes
  // valeurs par défaut — vérifié à la main avant ce test.
  {
    const proj = window.computeDebtProjection({ dette0: 110, croissanceReellePct: 1.2, inflationPct: 2, tauxInteretPct: 3.2, soldePrimairePct: -2 });
    t.close(proj.atHorizon[5], 119.87, "projection à 5 ans : correspond bien à la formule exacte d*(1+i)/(1+g)-pb (119,87)", 0.01);
    t.close(proj.atHorizon[10], 129.72, "projection à 10 ans : correspond bien à la formule exacte (129,72)", 0.01);
    t.close(proj.atHorizon[20], 149.40, "projection à 20 ans : correspond bien à la formule exacte (149,40), plus 151,99 (ancienne approximation, écart de 2,59 points)", 0.01);
  }

  const summary = t.summary();
  console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
  process.exit(summary.failed > 0 ? 1 : 0);
})();
