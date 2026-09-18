/* ============================================================
   Réouverture "idée reçue" (misconception tagging), 2026-09-18 — plumbing
   seule (indépendante du contenu réel du Chantier 3) : capture de l'index
   du distracteur cliqué -> stockage -> carte de feedback -> priorisation
   dans "À revoir". Items fixtures avec un faux `misconceptions` injecté —
   ne dépend d'aucune vraie question de scripts/app.js.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage } = require('./support/load-page');

const t = createSuite('misconception-tagging');

function fixtureItem(overrides){
  return {
    id: 'fixture-q1', niveau: 'debutant', categorie: 'Bourse', type: 'qcm',
    question: 'Question fixture ?',
    choix: ['Mauvaise réponse taguée', 'Bonne réponse', 'Mauvaise réponse non taguée'],
    bonneReponse: 1,
    explication: 'Explication générique.',
    misconceptions: {
      0: {id: 'confusion-test', label: 'Tu confonds A et B (fixture)', fix: 'Voici pourquoi A et B sont différents (fixture).'}
    },
    ...overrides
  };
}

function clickOption(document, elId, index){
  const opts = document.getElementById(`${elId}-opts`);
  opts.children[index].dispatchEvent(new (document.defaultView.Event)('click'));
}

// ---------- Cliquer le distracteur TAGUÉ -> misconceptionId/Label stockés + carte affichée ----------
{
  const { window, document } = loadFormationsPage();
  const host = document.createElement('div');
  host.id = 'q1';
  document.body.appendChild(host);
  const item = fixtureItem();
  window.renderQcmItem('q1', item, () => {});
  clickOption(document, 'q1', 0); // distracteur taggé
  const mistakes = window.getMistakes();
  const entry = mistakes.find(m => m.questionId === 'fixture-q1');
  t.ok(!!entry, "l'erreur est bien enregistrée");
  t.equal(entry.misconceptionId, 'confusion-test', "cliquer le distracteur taggé stocke bien le vrai misconceptionId");
  t.equal(entry.misconceptionLabel, 'Tu confonds A et B (fixture)', 'le vrai label est bien stocké');
  const feedbackHtml = document.getElementById('q1-feedback').innerHTML;
  t.ok(feedbackHtml.includes('Idée reçue détectée'), 'la carte "Idée reçue détectée" est bien affichée immédiatement après la réponse');
  t.ok(feedbackHtml.includes('Tu confonds A et B (fixture)'), 'la carte affiche bien le vrai label, jamais un texte générique');
}

// ---------- Cliquer un distracteur NON taggé de la même question -> jamais de misconception fabriquée ----------
{
  const { window, document } = loadFormationsPage();
  const host = document.createElement('div');
  host.id = 'q2';
  document.body.appendChild(host);
  const item = fixtureItem({id: 'fixture-q2'});
  window.renderQcmItem('q2', item, () => {});
  clickOption(document, 'q2', 2); // distracteur NON taggé
  const entry = window.getMistakes().find(m => m.questionId === 'fixture-q2');
  t.ok(!!entry, "l'erreur est bien enregistrée même sans idée reçue taguée");
  t.ok(!entry.misconceptionId, "aucun misconceptionId n'est fabriqué pour un distracteur non taggé");
  const feedbackHtml = document.getElementById('q2-feedback').innerHTML;
  t.ok(!feedbackHtml.includes('Idée reçue détectée'), "aucune carte d'idée reçue n'apparaît pour un distracteur non taggé");
}

// ---------- renderMisconceptionCallout : '' pour un item sans misconceptions ----------
{
  const { window, runInPage } = loadFormationsPage();
  const html = runInPage(`window.__r = renderMisconceptionCallout({id:'x', choix:['a','b']}, 0);`);
  t.equal(html, '', "un item sans champ misconceptions ne rend jamais une carte fabriquée");
}

// ---------- pickTopMisconception : null sans donnée taguée, la plus récente sinon ----------
{
  const { window, document } = loadFormationsPage({
    seed(w){
      w.localStorage.setItem('likanza-mistakes', JSON.stringify([
        {questionId: 'a', categorie: 'Bourse', question: 'a?', resolved: false, misconceptionId: 'old', misconceptionLabel: 'Ancienne idée reçue', lastMissedAt: '2026-01-01T00:00:00.000Z', misses: 1, firstMissedAt: '2026-01-01T00:00:00.000Z', correctAnswer: 'x', niveau: 'debutant'},
        {questionId: 'b', categorie: 'Budget', question: 'b?', resolved: false, misconceptionId: 'new', misconceptionLabel: 'Idée reçue la plus récente', lastMissedAt: '2026-02-01T00:00:00.000Z', misses: 1, firstMissedAt: '2026-02-01T00:00:00.000Z', correctAnswer: 'y', niveau: 'debutant'},
        {questionId: 'c', categorie: 'Épargne', question: 'c?', resolved: true, misconceptionId: 'resolved-one', misconceptionLabel: 'Idée reçue déjà résolue', lastMissedAt: '2026-03-01T00:00:00.000Z', misses: 1, firstMissedAt: '2026-03-01T00:00:00.000Z', correctAnswer: 'z', niveau: 'debutant'}
      ]));
    }
  });
  const pick = window.pickTopMisconception();
  t.ok(!!pick, 'une idée reçue non résolue est bien trouvée');
  t.equal(pick.misconceptionId, 'new', "la plus RÉCENTE idée reçue non résolue est bien priorisée, pas la plus ancienne");
}
{
  const { window } = loadFormationsPage();
  t.isNull(window.pickTopMisconception(), 'sans aucune erreur taguée, pickTopMisconception renvoie bien null (jamais une idée reçue générique)');
}

// ---------- renderApprendreARevoir : bascule vers la carte "idée reçue" quand une existe ----------
{
  const { window, document } = loadFormationsPage({
    seed(w){
      w.localStorage.setItem('likanza-mistakes', JSON.stringify([
        {questionId: 'a', categorie: 'Bourse', question: 'Question réelle ?', resolved: false, misconceptionId: 'x', misconceptionLabel: 'Tu confonds prix et valorisation', lastMissedAt: '2026-01-01T00:00:00.000Z', misses: 1, firstMissedAt: '2026-01-01T00:00:00.000Z', correctAnswer: 'y', niveau: 'debutant'}
      ]));
    }
  });
  const host = document.createElement('div');
  host.id = 'arevoir';
  document.body.appendChild(host);
  window.renderApprendreARevoir('arevoir');
  t.ok(host.innerHTML.includes('Tu confonds prix et valorisation'), "renderApprendreARevoir affiche bien l'idée reçue précise quand une existe");
  t.ok(host.innerHTML.includes('Question réelle'), 'le contexte de la question ayant révélé l\'idée reçue est bien affiché');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
