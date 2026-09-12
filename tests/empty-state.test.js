/* ============================================================
   Chantier B (refonte continuité UX, 12/09/2026) — renderEmptyState
   (scripts/historical-data.js), un état vide unique remplaçant les textes
   plats "Aucune donnée" : jamais un bouton fabriqué quand la vraie
   prochaine action est déjà un contrôle visible ailleurs à l'écran
   (sélecteur d'indicateur/pays sur Économie) ; un vrai bouton câblé quand
   une action in-page réelle existe (bascule d'onglet sur Mon Univers
   Financier).
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { loadParcoursPage, loadEconomiePage, flush, ROOT } = require('./support/load-page');

const realSvg = fs.readFileSync(path.join(ROOT, 'assets', 'maps', 'world-map.svg'), 'utf8');

const t = createSuite('empty-state');

(async () => {
  // ---------- Unité : renderEmptyState lui-même ----------
  {
    const { window } = loadParcoursPage({seed: w => {
      w.localStorage.setItem('likanza-positioning-result', JSON.stringify({profile: 'equilibre', completedAt: new Date().toISOString(), version: 2}));
    }});
    const messageOnly = window.renderEmptyState('Rien pour l\'instant.');
    t.ok(messageOnly.includes('Rien pour l\'instant.'), 'sans cta, le message est bien rendu');
    t.ok(!messageOnly.includes('empty-state-cta'), 'sans cta, aucun bouton fabriqué n\'est ajouté');

    const withHref = window.renderEmptyState('Message.', {label: 'Aller voir →', href: 'parcours.html'});
    t.ok(withHref.includes('<a href="parcours.html"') && withHref.includes('Aller voir →'), 'avec un href réel, un vrai lien <a> est rendu');

    const withButton = window.renderEmptyState('Message.', {label: 'Faire quelque chose →'});
    t.ok(withButton.includes('<button type="button"') && withButton.includes('empty-state-cta'), 'sans href (action in-page), un <button> avec la classe empty-state-cta est rendu, prêt à être câblé par l\'appelant');
  }

  // ---------- Mon Univers Financier : Allocation globale sans aucun actif ----------
  {
    const { window, document } = loadParcoursPage({seed: w => {
      w.localStorage.setItem('likanza-positioning-result', JSON.stringify({profile: 'equilibre', completedAt: new Date().toISOString(), version: 2}));
      // Un vrai objectif financier suffit à sortir du mode démo (cockpitDetectMode), sans renseigner le moindre actif/dette.
      w.localStorage.setItem('likanza-financial-goals', JSON.stringify([
        {id: 'g1', nom: "Fonds d'urgence", montantCible: 3000, montantActuel: 0, versementMensuel: 50, dateCible: null}
      ]));
    }});
    await flush(50);
    t.equal(window.cockpitDetectMode(), 'personal', 'un objectif réel suffit à sortir du mode démo, sans qu\'aucun actif ne soit renseigné');

    const containerId = 'testAllocation';
    const div = document.createElement('div');
    div.id = containerId;
    document.body.appendChild(div);
    window.renderCockpitAllocation(containerId);
    const html = document.getElementById(containerId).innerHTML;
    t.ok(html.includes("Aucun actif enregistré"), "l'état vide honnête de l'allocation globale est bien affiché quand aucun actif n'est enregistré");
    t.ok(html.includes('Ajouter un actif'), 'un vrai bouton "Ajouter un actif" est proposé, jamais un texte plat sans action');

    const ctaBtn = document.getElementById(containerId).querySelector('.empty-state-cta');
    t.ok(!!ctaBtn, 'le bouton porte bien la classe empty-state-cta, câblée par le call site');
    ctaBtn.dispatchEvent(new window.Event('click'));
    const activeTabBtn = document.querySelector('#cockpitTabsGrid .quick-access-card.active');
    t.ok(!!activeTabBtn && activeTabBtn.dataset.tab === 'tab-patrimoine', "cliquer sur \"Ajouter un actif\" bascule bien réellement vers l'onglet Patrimoine, jamais un lien mort");
  }

  // ---------- Économie : carte mondiale sans donnée réelle pour l'indicateur choisi ----------
  {
    const { window, document } = loadEconomiePage({
      fetchImpl: async (url) => {
        const u = String(url);
        if(u.includes('/api/eco-map')) return { ok: true, json: async () => ({indicator: 'gdp-growth', values: {}, source: 'test', sourceUrl: '', label: 'Croissance du PIB'}) };
        if(u.includes('world-map.svg')) return { ok: true, text: async () => realSvg };
        return { ok: false, status: 503, json: async () => ({ error: 'non pertinent pour ce test' }) };
      }
    });
    window.renderMapView();
    await flush(80);
    const mainHtml = document.getElementById('ecoMain').innerHTML;
    t.ok(mainHtml.includes('Aucune donnée réelle disponible'), "l'absence de donnée réelle pour cet indicateur est bien affichée honnêtement");
    t.ok(mainHtml.includes('choisis un autre indicateur ci-dessus'), 'le message guide bien vers le sélecteur déjà visible, jamais un bouton fabriqué qui ferait doublon');
    t.ok(!mainHtml.includes('empty-state-cta'), 'aucun bouton fabriqué ici : le sélecteur d\'indicateur est déjà un contrôle visible à l\'écran');
  }

  const summary = t.summary();
  console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
  process.exit(summary.failed > 0 ? 1 : 0);
})();
