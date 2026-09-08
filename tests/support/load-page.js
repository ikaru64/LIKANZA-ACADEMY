/* ============================================================
   Harnais de tests — chargement d'une vraie page Likanza dans jsdom.

   Pourquoi pas un simple `eval()` des fichiers concaténés (le motif
   utilisé dans les scripts de vérification ad hoc de ce projet) : un
   `eval()` exécuté depuis Node ne partage PAS les bindings `const`/`let`
   de haut niveau entre fichiers (ni avec l'appelant), alors que le vrai
   site charge chaque script comme une balise <script> distincte dans le
   MÊME document — les déclarations `let`/`const`/`function` de premier
   niveau de scripts/icons.js, app.js, data.js, historical-data.js et de
   la page vivent dans une portée globale partagée. On reproduit donc ce
   comportement ici : on retire les <script src="..."> locaux du HTML
   réel de la page, puis on les réinjecte un par un comme de vraies
   balises <script> (jsdom les exécute immédiatement avec
   `runScripts: "dangerously"`), dans le même ordre que la page réelle.

   Seules les fonctions déclarées avec `function nomFn(){}` au premier
   niveau deviennent des propriétés de `window` (sémantique JS standard :
   une déclaration de fonction crée aussi une propriété sur l'objet
   global). Un `let`/`const` de premier niveau (ex. companyFundamentalsCache)
   reste une liaison purement lexicale, invisible depuis `window.xxx` — pour
   lire/écrire une telle variable depuis un test, utiliser `runInPage()`
   ci-dessous, qui exécute du code dans cette même portée partagée.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');

// Scripts locaux communs à toutes les pages "terminal" (Bourse, Économie...) —
// le CDN Chart.js est volontairement exclu (jamais chargé depuis un test :
// remplacé par un stub configurable, voir loadPage ci-dessous).
const COMMON_LOCAL_SCRIPTS = ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/historical-data.js'];
const BOURSE_LOCAL_SCRIPTS = [...COMMON_LOCAL_SCRIPTS, 'scripts/pages/bourse.js'];
const ECONOMIE_LOCAL_SCRIPTS = [...COMMON_LOCAL_SCRIPTS, 'scripts/pages/economie.js'];
const LABORATOIRE_LOCAL_SCRIPTS = [...COMMON_LOCAL_SCRIPTS, 'scripts/pages/laboratoire.js'];

function stripScriptTags(html){
  return html.replace(/<script\b[^>]*><\/script>/gi, '');
}

/**
 * Charge une vraie page Likanza (htmlFile, relatif à la racine du dépôt) dans
 * une vraie instance jsdom, avec la liste de scripts locaux donnée réellement
 * exécutée dans l'ordre (voir l'explication en tête de fichier). Retourne
 * { window, document, runInPage }.
 *
 * Options :
 *  - fetchImpl(url, options) : implémentation de window.fetch. Par défaut,
 *    simule un échec réseau systématique (503) — utile pour vérifier
 *    qu'aucune page ne reste bloquée sur "Chargement" ni ne lève d'erreur
 *    quand aucune donnée réelle n'est disponible.
 *  - chartStub : classe utilisée comme window.Chart (mock par défaut,
 *    Chart.js vient d'un CDN et ne doit jamais être réellement chargé
 *    dans un test).
 */
function loadPage(htmlFile, localScripts, { fetchImpl, chartStub } = {}){
  const rawHtml = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
  const html = stripScriptTags(rawHtml);

  const dom = new JSDOM(html, {
    url: `https://likanza-academy.test/${htmlFile}`,
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  const { window } = dom;

  // ---------- Stubs (section "Vérification" du prompt) ----------
  window.matchMedia = window.matchMedia || function(query){
    return { matches: false, media: query, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; } };
  };
  // jsdom n'implémente pas le rendu canvas réel (nécessiterait le paquet
  // natif "canvas") — Chart.js est de toute façon mocké, ce contexte n'a
  // donc besoin d'exister que pour ne jamais renvoyer null aux appelants.
  window.HTMLCanvasElement.prototype.getContext = function(){
    return {
      fillRect(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, fill(){}, arc(){},
      measureText(){ return { width: 0 }; }, save(){}, restore(){}, translate(){}, scale(){}, drawImage(){},
      createLinearGradient(){ return { addColorStop(){} }; }, setLineDash(){}
    };
  };
  class DefaultMockChart {
    constructor(ctx, config){ this.ctx = ctx; this.data = config && config.data; this.options = config && config.options; DefaultMockChart.instances.push(this); }
    update(){} destroy(){ DefaultMockChart.instances = DefaultMockChart.instances.filter(c => c !== this); }
  }
  DefaultMockChart.instances = [];
  window.Chart = chartStub || DefaultMockChart;
  window.fetch = fetchImpl || (async () => ({ ok: false, status: 503, json: async () => ({ error: 'HTTP 503 (stub de test — aucun réseau réel)' }) }));
  // jsdom n'implémente pas <dialog>.showModal()/close() (nécessiterait un
  // vrai rendu de layout) — plusieurs pages (economie.html, bourse.html)
  // utilisent un <dialog> natif pour leurs modales de simulation ; un
  // simple mock d'état (.open) suffit, aucun code de production n'inspecte
  // le rendu visuel réel de la boîte de dialogue.
  if(window.HTMLDialogElement && !window.HTMLDialogElement.prototype.showModal){
    window.HTMLDialogElement.prototype.showModal = function(){ this.open = true; };
    window.HTMLDialogElement.prototype.close = function(){ this.open = false; };
  }

  // ---------- Chargement des scripts locaux réels, dans l'ordre réel ----------
  localScripts.forEach(rel => {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = code;
    window.document.body.appendChild(scriptEl);
  });

  return {
    window,
    document: window.document,
    /**
     * Exécute du code JS dans la portée globale PARTAGÉE avec les scripts
     * de la page (contrairement à window.eval, qui recrée une portée
     * indirecte et ne verrait pas non plus les `let`/`const` de haut
     * niveau des scripts déjà chargés) — utile pour lire/écrire une
     * variable de module comme `companyFundamentalsCache`. Le code doit
     * assigner son résultat à `window.__r` ; la valeur est renvoyée puis
     * la propriété temporaire supprimée.
     */
    runInPage(code){
      const scriptEl = window.document.createElement('script');
      scriptEl.textContent = code;
      window.document.body.appendChild(scriptEl);
      const result = window.__r;
      delete window.__r;
      return result;
    }
  };
}

// Attend que les micro/macro-tâches en cours (fetch simulés, .then()
// chaînés par le code de la page) se résolvent avant d'inspecter le DOM —
// jsdom partage la vraie boucle d'événements de Node, un setTimeout ici
// laisse donc le temps aux promesses internes de la page de se résoudre.
function flush(ms = 30){
  return new Promise(r => setTimeout(r, ms));
}

function loadBoursePage(options){ return loadPage('bourse.html', BOURSE_LOCAL_SCRIPTS, options); }
function loadEconomiePage(options){ return loadPage('economie.html', ECONOMIE_LOCAL_SCRIPTS, options); }
function loadLaboratoirePage(options){ return loadPage('laboratoire.html', LABORATOIRE_LOCAL_SCRIPTS, options); }

module.exports = { loadPage, loadBoursePage, loadEconomiePage, loadLaboratoirePage, flush, ROOT };
