/* ============================================================
   Rappels du calendrier financier (computeUpcomingReminders, scripts/data.js,
   widget "Aujourd'hui" du Dashboard + onglet Planification de
   laboratoire.html) — correctif du 09/09/2026, trouvé en terminant l'audit
   du module (item explicitement différé le 08/09/2026) : jourEcheance va
   jusqu'à 31 (saveRecurringCharge), mais tous les mois n'ont pas 31 jours.
   `new Date(annee, mois, 31)` en février DÉBORDE silencieusement (comportement
   natif de Date) vers le 2 ou 3 mars, sans aucune erreur ni indication —
   un rappel "dans X jours" silencieusement faux 5 mois sur 12. Corrigé en
   ramenant le jour saisi au dernier jour réel du mois cible (clampedDate),
   convention standard de facturation, jamais un jour inventé.
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadLaboratoirePage } = require('./support/load-page');

const t = createSuite('laboratoire.calendar');

function daysInMonth(year, monthIndex){ return new Date(year, monthIndex + 1, 0).getDate(); }

// ---------- Jour d'échéance = 31 : ne doit jamais déborder sur le mois suivant ----------
{
  const { window } = loadLaboratoirePage();
  window.localStorage.setItem('likanza-recurring-charges', JSON.stringify([
    {id: 'c1', nom: 'Assurance', montant: 40, frequence: 'mensuel', categorie: 'abonnement', jourEcheance: 31, dateAjout: new Date().toISOString()}
  ]));
  const reminders = window.computeUpcomingReminders(400);
  t.equal(reminders.length, 1, "une charge mensuelle avec un jour d'échéance réel remonte bien un rappel (fenêtre large de 400 jours)");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(today.getTime() + reminders[0].dans * 86400000);
  const expectedDay = Math.min(31, daysInMonth(target.getFullYear(), target.getMonth()));
  t.equal(target.getDate(), expectedDay, "un jour d'échéance de 31 tombe sur le dernier jour réel du mois cible, jamais un débordement silencieux vers le mois suivant (ex. 31 février -> 3 mars avant le correctif)");
}

// ---------- Jour d'échéance normal (15) : comportement inchangé (non-régression) ----------
{
  const { window } = loadLaboratoirePage();
  window.localStorage.setItem('likanza-recurring-charges', JSON.stringify([
    {id: 'c2', nom: 'Internet', montant: 30, frequence: 'mensuel', categorie: 'abonnement', jourEcheance: 15, dateAjout: new Date().toISOString()}
  ]));
  const reminders = window.computeUpcomingReminders(400);
  t.equal(reminders.length, 1, "une charge avec jour d'échéance = 15 (toujours valide, aucun mois n'a moins de 15 jours) remonte bien un rappel");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(today.getTime() + reminders[0].dans * 86400000);
  t.equal(target.getDate(), 15, "un jour d'échéance qui existe dans tous les mois n'est jamais altéré par le correctif");
}

// ---------- Sans jour d'échéance renseigné : jamais de rappel (jamais un jour deviné) ----------
{
  const { window } = loadLaboratoirePage();
  window.localStorage.setItem('likanza-recurring-charges', JSON.stringify([
    {id: 'c3', nom: 'Charge sans jour', montant: 20, frequence: 'mensuel', categorie: 'abonnement', jourEcheance: null, dateAjout: new Date().toISOString()}
  ]));
  const reminders = window.computeUpcomingReminders(400);
  t.equal(reminders.length, 0, "une charge sans jour d'échéance réellement saisi ne génère jamais de rappel devine");
}

// ---------- Échéance d'objectif dans le passé : jamais un rappel ----------
{
  const { window } = loadLaboratoirePage();
  const past = new Date(); past.setFullYear(past.getFullYear() - 1);
  window.localStorage.setItem('likanza-financial-goals', JSON.stringify([
    {id: 'g1', nom: 'Objectif passé', montantCible: 1000, montantActuel: 0, versementMensuel: 50, dateCible: past.toISOString().slice(0, 10)}
  ]));
  const reminders = window.computeUpcomingReminders(400);
  t.equal(reminders.length, 0, "une échéance d'objectif déjà passée n'est jamais présentée comme un rappel à venir");
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
