/* ============================================================
   Refonte "Apprendre", Chantier 6 : pont cours -> Bibliothèque au fil du
   chapitre (findChapterConcept/renderCourseChapter), en complément du lien
   de fin de cours existant (renderCourseLibraryLinks) — jamais en
   remplacement. Réutilise data.js (commun à toutes les pages), pas besoin
   de charger cours.html spécifiquement : findChapterConcept est une
   fonction pure.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage } = require('./support/load-page');

const t = createSuite('cours.chapitre-bibliotheque-bridge');

const { runInPage } = loadFormationsPage();

// ---------- Terme du cours réellement mentionné dans le texte du chapitre ----------
{
  const chapitre = {titre: 'x', blocs: [{type: 'texte', texte: "Une Action représente une part de propriété dans une entreprise."}]};
  const terme = runInPage(`window.__r = findChapterConcept(${JSON.stringify(chapitre)}, ['Action', 'ETF']);`);
  t.equal(terme, 'Action', 'un terme du cours réellement mentionné dans le texte du chapitre est bien détecté');
}

// ---------- Aucun terme du cours mentionné -> jamais un lien fabriqué ----------
{
  const chapitre = {titre: 'x', blocs: [{type: 'texte', texte: "Ce chapitre ne parle d'aucun terme technique particulier ici."}]};
  const terme = runInPage(`window.__r = findChapterConcept(${JSON.stringify(chapitre)}, ['Action', 'ETF']) || null;`);
  t.isNull(terme, "aucun terme du cours n'étant mentionné, aucun lien n'est fabriqué");
}

// ---------- Un terme mentionné mais hors de la liste du cours -> ignoré (jamais toute la Bibliothèque) ----------
{
  const chapitre = {titre: 'x', blocs: [{type: 'texte', texte: "L'inflation érode le pouvoir d'achat au fil du temps."}]};
  const terme = runInPage(`window.__r = findChapterConcept(${JSON.stringify(chapitre)}, ['Action', 'ETF']) || null;`);
  t.isNull(terme, "un terme mentionné mais absent de la liste du cours (Inflation) n'est jamais proposé — jamais toute la Bibliothèque scannée");
}

// ---------- Un mot-candidat qui n'existe pas réellement dans LIBRARY n'est jamais lié ----------
{
  const chapitre = {titre: 'x', blocs: [{type: 'texte', texte: "Ce terme fantaisiste n'existe pas vraiment."}]};
  const terme = runInPage(`window.__r = findChapterConcept(${JSON.stringify(chapitre)}, ['Terme Fantaisiste Inexistant']) || null;`);
  t.isNull(terme, "un terme absent de LIBRARY n'est jamais proposé, même s'il est passé en candidat");
}

// ---------- renderCourseChapter : le lien inline apparaît bien, distinct du lien de fin de cours ----------
{
  const chapitre = {titre: 'Chapitre test', blocs: [{type: 'texte', texte: "Une Action est un titre de propriété."}]};
  const html = runInPage(`window.__r = renderCourseChapter(${JSON.stringify(chapitre)}, ['Action']);`);
  t.ok(html.includes('bibliotheque.html#Action'), 'renderCourseChapter insère bien un lien inline vers la vraie fiche Bibliothèque du terme détecté');
  t.ok(html.includes('Chapitre test'), 'le titre du chapitre reste bien affiché');
}

// ---------- Sur un vrai cours du catalogue, au moins un chapitre produit une vraie détection ----------
{
  const anyDetected = runInPage(`
    window.__r = COURS_CATALOG.find(c => c.id === 'bourse-actions').chapitres
      .some(ch => !!findChapterConcept(ch, COURS_CATALOG.find(c => c.id === 'bourse-actions').libraryTermes));
  `);
  t.ok(anyDetected, "sur le vrai cours bourse-actions, au moins un chapitre détecte réellement un de ses propres termes");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
