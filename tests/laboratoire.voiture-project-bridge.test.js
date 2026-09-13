/* ============================================================
   Réouverture d'une limite explicitement disclosed par le chantier
   continuité UX du 12/09/2026 : "Acheter une voiture" (Chantier F, "Que
   veux-tu résoudre ?") ouvrait bien le calculateur "Coût total de
   possession", mais sans aucun pont vers "Mon Univers Financier" — "voiture"
   n'était pas une vraie catégorie de LIFE_PROJECT_CATEGORIES (décision
   honnête d'un chantier antérieur, voir test-positionnement.js). Devient
   réelle ici parce qu'un vrai pont existe désormais : le calculateur TCO
   peut créer un projet réel avec un budget réellement calculé (netCost),
   jamais un montant inventé.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadLaboratoirePage } = require('./support/load-page');

const t = createSuite('laboratoire.voiture-project-bridge');

const { window, document, runInPage } = loadLaboratoirePage();

// LIFE_PROJECT_CATEGORIES/LIFE_PROJECT_CATEGORY_META/PROJECT_REQUIRED_CATEGORIES
// sont des `const` de premier niveau : invisibles depuis window.xxx
// (sémantique JS standard), accessibles via runInPage (portée partagée).
const lifeProjectConsts = runInPage(`window.__r = {
  categories: LIFE_PROJECT_CATEGORIES,
  meta: LIFE_PROJECT_CATEGORY_META,
  required: PROJECT_REQUIRED_CATEGORIES
};`);

// ---------- "voiture" est bien une vraie catégorie, avec ses vrais champs ----------
t.ok(lifeProjectConsts.categories.includes('voiture'), 'LIFE_PROJECT_CATEGORIES contient bien "voiture"');
t.equal(lifeProjectConsts.meta.voiture.label, 'Voiture', 'LIFE_PROJECT_CATEGORY_META.voiture a bien un vrai libellé');
t.ok(!!lifeProjectConsts.meta.voiture.emoji, 'LIFE_PROJECT_CATEGORY_META.voiture a bien un emoji');

// ---------- Le formulaire de création manuelle propose bien "Voiture" ----------
{
  const options = Array.from(document.querySelectorAll('#projectMgrCategorie option')).map(o => o.value);
  t.ok(options.includes('voiture'), 'le formulaire de création manuelle de projet propose bien "Voiture" comme catégorie sélectionnable');
}

// ---------- Le calculateur TCO propose bien un vrai bouton "Créer un projet", avec le vrai coût calculé ----------
{
  window.setLabTab('tab-transport');
  window.openLabWidget('tab-transport', 'widget-transport-tco');
  // Renseigne des valeurs réelles pour déclencher un vrai calcul.
  document.getElementById('tcoPrice').value = '20000';
  document.getElementById('tcoPrice').dispatchEvent(new window.Event('input'));
  document.getElementById('tcoYears').value = '5';
  document.getElementById('tcoYears').dispatchEvent(new window.Event('input'));

  const addBtn = document.getElementById('tcoAddProjectBtn');
  t.ok(!!addBtn, 'le bouton "Créer un projet Voiture" existe bien une fois un vrai résultat calculé');

  addBtn.dispatchEvent(new window.Event('click'));
  const projects = window.getLifeProjects();
  const voitureProject = projects.find(p => p.categorie === 'voiture');
  t.ok(!!voitureProject, 'cliquer le bouton crée bien réellement un projet de catégorie "voiture"');
  t.ok(voitureProject.budgetTotal > 0, 'le projet créé porte bien un budget réel (non nul), jamais 0 par défaut');
  t.ok(voitureProject.nom === 'Voiture', 'le projet créé porte bien un nom réel');

  t.equal(addBtn.disabled, true, 'le bouton se désactive bien après création, pour éviter un doublon accidentel');
  t.ok(addBtn.textContent.includes('ajouté'), 'le bouton confirme bien visuellement la création (jamais une fermeture silencieuse)');
  const msgHtml = document.getElementById('tcoAddProjectMsg').innerHTML;
  t.ok(msgHtml.includes('parcours.html'), 'un lien réel vers Mon Univers Financier est bien proposé après création');
}

// ---------- L'écart de compétences du projet pointe bien vers une vraie catégorie de quiz ----------
{
  const gaps = window.getProjectSkillGaps({categorie: 'voiture'});
  t.ok(Array.isArray(gaps), 'getProjectSkillGaps fonctionne bien pour la catégorie "voiture", sans planter');
  t.ok(lifeProjectConsts.required.voiture.includes('Crédit'), 'le projet "voiture" est bien rattaché à "Crédit", la même catégorie réelle qu\'immobilier, pour la même raison (financement)');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
