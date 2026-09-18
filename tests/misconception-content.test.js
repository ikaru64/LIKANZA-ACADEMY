/* ============================================================
   Réouverture "idée reçue" (misconception tagging), Chantier 3+4 — vérifie
   que le contenu réellement rédigé (scripts/app.js, ~30 questions sur les 6
   domaines) s'intègre bien avec la plumbing (Chantier 1), pas seulement des
   fixtures. Cliquer un vrai distracteur taggé d'une vraie question de
   QUIZ_BANK_FULL/MENTAL_CHALLENGES doit produire une vraie carte "Idée reçue
   détectée", et le nombre de questions taguées doit couvrir les 6 domaines.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage } = require('./support/load-page');

const t = createSuite('misconception-content');

const { window, document, runInPage } = loadFormationsPage();

// ---------- Couverture : ~25-30 questions taguées, réparties sur les 6 domaines réels ----------
{
  const stats = runInPage(`
    const tagged = QUIZ_BANK_FULL.concat(MENTAL_CHALLENGES).filter(q => q.misconceptions);
    const domainsCovered = new Set(tagged.map(q => categorieDomainKey(q.categorie)).filter(Boolean));
    window.__r = {count: tagged.length, domains: Array.from(domainsCovered).sort()};
  `);
  t.ok(stats.count >= 25 && stats.count <= 35, `entre 25 et 35 questions sont bien taguées (obtenu : ${stats.count})`, stats.count);
  t.equal(stats.domains.length, 6, 'les 6 domaines réels ont bien au moins une question taguée, pas seulement Bourse', stats.domains);
  ['personalFinance', 'stockMarket', 'business', 'economics', 'realEstate', 'crypto'].forEach(d => {
    t.ok(stats.domains.includes(d), `le domaine ${d} a bien au moins une question taguée`);
  });
}

// ---------- Aucune question vraifaux n'est taguée (exclusion délibérée, binaire) ----------
{
  const vraifauxTagged = runInPage(`window.__r = QUIZ_BANK_FULL.filter(q => q.type === 'vraifaux' && q.misconceptions).length;`);
  t.equal(vraifauxTagged, 0, 'aucune question de type vraifaux ne porte de misconceptions (exclusion délibérée du plan)');
}

// ---------- Bout-en-bout sur une vraie question réelle (q-actions-003, PER) ----------
{
  const item = runInPage(`window.__r = QUIZ_BANK_FULL.find(q => q.id === 'q-actions-003');`);
  t.ok(!!item, 'la vraie question q-actions-003 (PER) existe bien dans QUIZ_BANK_FULL');
  t.ok(!!(item.misconceptions && item.misconceptions[0]), "elle porte bien une idée reçue taguée sur son 1er distracteur");

  const host = document.createElement('div');
  host.id = 'realq';
  document.body.appendChild(host);
  window.renderQcmItem('realq', item, () => {});
  const opts = document.getElementById('realq-opts');
  opts.children[0].dispatchEvent(new window.Event('click')); // "Que l'entreprise est en faillite"

  const feedbackHtml = document.getElementById('realq-feedback').innerHTML;
  t.ok(feedbackHtml.includes('Idée reçue détectée'), "cliquer le vrai distracteur taggé affiche bien la carte d'idée reçue, avec du vrai contenu");
  t.ok(feedbackHtml.includes('PER') || feedbackHtml.includes('faillite'), "le contenu affiché est bien celui réellement rédigé pour cette question, pas un texte générique");

  const entry = window.getMistakes().find(m => m.questionId === 'q-actions-003');
  t.ok(!!entry && !!entry.misconceptionId, "l'erreur enregistrée porte bien le vrai misconceptionId de cette question");
}

// ---------- renderApprendreARevoir affiche bien une vraie idée reçue après ça ----------
{
  const host2 = document.createElement('div');
  host2.id = 'arevoir-real';
  document.body.appendChild(host2);
  window.renderApprendreARevoir('arevoir-real');
  t.ok(host2.innerHTML.toLowerCase().includes('per'), "renderApprendreARevoir affiche bien la vraie idée reçue détectée plus haut, pas le cadrage générique par catégorie");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
