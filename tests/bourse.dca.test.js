/* ============================================================
   updateDcaVsLump (scripts/pages/bourse.js) — correctif du 08/09/2026 :
   un prix manquant/nul/négatif était silencieusement absorbé dans le
   calcul (sa part du montant total disparaissait), pouvant inverser le
   verdict affiché. Vérifie le texte réellement rendu dans
   #dcaVsLumpResult, pas seulement l'absence d'exception.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadBoursePage, flush } = require('./support/load-page');

(async () => {
  const t = createSuite('bourse.dca');
  const { window, document } = loadBoursePage();
  await flush(50); // laisse l'init de la page (rendu des 4 champs de prix par défaut) se stabiliser

  function setDca(total, prices){
    document.getElementById('dcaTotal').value = String(total);
    const inputs = Array.from(document.querySelectorAll('.dcaPrice'));
    prices.forEach((v, i) => { if(inputs[i]) inputs[i].value = String(v); });
    window.updateDcaVsLump();
  }
  function resultHtml(){ return document.getElementById('dcaVsLumpResult').innerHTML; }
  function parseEuro(html, label){
    const m = html.match(new RegExp(`${label}[\\s\\S]*?>([\\d\\s\\u00A0,]+)\\s*€`));
    return m ? parseFloat(m[1].replace(/[\s ]/g, '').replace(',', '.')) : null;
  }

  // ---------- Cas nominal : 4 prix valides ----------
  setDca(4000, [100, 90, 95, 110]);
  {
    const html = resultHtml();
    const dca = parseEuro(html, 'DCA \\(réparti\\)');
    const lump = parseEuro(html, 'Tout en une fois');
    // perInstallment = 1000 ; dcaUnits = 1000/100+1000/90+1000/95+1000/110 ≈ 40.728 ; dcaValue ≈ 4480.1
    // lumpUnits = 4000/100 = 40 ; lumpValue = 40*110 = 4400
    t.close(dca, 4480.13, "4 prix valides : la valeur DCA correspond bien au calcul à la main", 5);
    t.close(lump, 4400, "4 prix valides : la valeur investissement unique correspond bien au calcul à la main", 5);
  }

  // ---------- Un champ du milieu vide ----------
  setDca(4000, [100, 80, '', 100]);
  t.ok(resultHtml().includes('Renseigne les 4 prix'), "un prix du milieu vide -> refus explicite, aucun verdict calculé", resultHtml());
  t.ok(!resultHtml().includes('whatif-compare'), "aucun bloc de résultat chiffré n'est rendu avec un prix invalide");

  // ---------- Premier champ vide ----------
  setDca(4000, ['', 90, 95, 110]);
  t.ok(resultHtml().includes('Renseigne les 4 prix'), "premier prix vide -> refus explicite (avant le correctif : investissement unique affiché à 0€)");

  // ---------- Dernier champ vide ----------
  setDca(4000, [100, 90, 95, '']);
  t.ok(resultHtml().includes('Renseigne les 4 prix'), "dernier prix vide -> refus explicite (avant le correctif : DCA déclaré vainqueur sur 0€ contre 0€)");

  // ---------- Un prix exactement à 0 ----------
  setDca(4000, [100, 0, 95, 110]);
  t.ok(resultHtml().includes('Renseigne les 4 prix'), "un prix saisi à 0 est traité comme un prix manquant");

  // ---------- Montant total négatif (branche déjà existante, non régressée) ----------
  setDca(-500, [100, 90, 95, 110]);
  t.ok(resultHtml().includes('Indique un montant total'), "un montant total négatif affiche le message existant, inchangé");

  // ---------- Égalité stricte : 3e état neutre ----------
  setDca(4000, [100, 100, 100, 100]);
  t.ok(resultHtml().includes('exactement le même résultat'), "une égalité stricte affiche le message neutre dédié, jamais un vainqueur par défaut");

  const summary = t.summary();
  console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
  process.exit(summary.failed > 0 ? 1 : 0);
})();
