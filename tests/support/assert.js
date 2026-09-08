/* ============================================================
   Petit helper d'assertion partagé — affiche toujours la valeur attendue
   ET la valeur obtenue (exigence du prompt), jamais seulement "FAIL".
   Pas de framework (Jest/Vitest) : juste une accumulation de résultats
   par fichier de test, lue par tests/run.js pour le code de sortie global.
   ============================================================ */
function createSuite(name){
  const results = [];
  function pass(msg){ results.push({ ok: true, msg }); console.log(`  OK: ${msg}`); }
  function fail(msg, expected, actual){
    results.push({ ok: false, msg, expected, actual });
    console.error(`  FAIL: ${msg}\n    attendu : ${JSON.stringify(expected)}\n    obtenu  : ${JSON.stringify(actual)}`);
  }
  return {
    name,
    results,
    /** Égalité stricte (===) ou deepEqual si l'un des deux est un objet/array. */
    equal(actual, expected, msg){
      const isDeep = (typeof expected === 'object' && expected !== null) || (typeof actual === 'object' && actual !== null);
      const ok = isDeep ? JSON.stringify(actual) === JSON.stringify(expected) : actual === expected;
      if(ok) pass(msg); else fail(msg, expected, actual);
    },
    /** Comparaison numérique à une tolérance près (arrondis flottants). */
    close(actual, expected, msg, epsilon = 0.01){
      const ok = typeof actual === 'number' && Number.isFinite(actual) && Math.abs(actual - expected) < epsilon;
      if(ok) pass(msg); else fail(msg, expected, actual);
    },
    ok(cond, msg, actual){
      if(cond) pass(msg); else fail(msg, true, actual !== undefined ? actual : cond);
    },
    isNull(actual, msg){
      if(actual === null) pass(msg); else fail(msg, null, actual);
    },
    summary(){
      const failed = results.filter(r => !r.ok).length;
      return { total: results.length, failed };
    }
  };
}

module.exports = { createSuite };
