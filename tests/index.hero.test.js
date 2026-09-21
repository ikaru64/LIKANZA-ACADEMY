/* ============================================================
   Pré-lancement (2026-09-21), P1 — accueil : un nouveau visiteur comprend
   en 5 secondes ce qu'est Likanza, ce qu'il peut y faire et par où commencer.
   Le hero n'apparaît que sans activité réelle ; un utilisateur qui revient
   retrouve directement son tableau de bord (inchangé). Bilingue (EN/FR).
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { loadPage, ROOT } = require('./support/load-page');

const t = createSuite('index.hero');
const SCRIPTS = ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js', 'scripts/pages/index.js'];

// ---------- Nouveau visiteur ----------
{
  const { document, window } = loadPage('index.html', SCRIPTS);
  const hero = document.getElementById('homeHero');
  t.ok(hero.style.display !== 'none', 'le hero est bien visible pour un nouveau visiteur');
  const h1 = hero.querySelector('h1');
  t.ok(!!h1 && h1.textContent.includes('Apprends à mieux gérer ton argent'), 'la proposition de valeur est un vrai <h1> lisible');
  t.equal(document.querySelectorAll('h1').length, 1, "il n'y a qu'un seul <h1> sur l'accueil");
  t.ok(hero.textContent.includes('Cours interactifs') && hero.textContent.includes('Simulateurs') && hero.textContent.includes('Défis') && hero.textContent.includes('Outils financiers'), 'la ligne "Cours interactifs • Simulateurs • Défis • Outils financiers" est présente');
  const start = hero.querySelector('#homeHeroStart');
  const explore = hero.querySelector('#homeHeroExplore');
  t.equal(start.textContent.trim(), 'Commencer', 'CTA principal : "Commencer"');
  t.equal(start.getAttribute('href'), 'test-positionnement.html', 'le CTA principal mène au vrai parcours de découverte du niveau');
  t.equal(explore.textContent.trim(), 'Explorer Likanza', 'CTA secondaire : "Explorer Likanza"');
  t.ok(!!document.querySelector(explore.getAttribute('href')), "le CTA secondaire pointe vers un vrai bloc de la page (les univers)");
  const cards = Array.from(hero.querySelectorAll('.home-univers-card'));
  t.equal(cards.length, 5, 'les 5 grands univers sont présentés (Apprendre, Investir, Gérer mon argent, Entreprendre, Pratiquer)');
  ['APPRENDRE', 'INVESTIR', 'GÉRER MON ARGENT', 'ENTREPRENDRE', 'PRATIQUER'].forEach(label => {
    t.ok(cards.some(c => c.textContent.includes(label)), `l'univers "${label}" est bien présenté`);
  });
  cards.concat([start]).forEach(a => {
    const file = a.getAttribute('href').split('#')[0];
    t.ok(fs.existsSync(path.join(ROOT, file)), `le lien ${file} pointe vers une vraie page`);
  });
  t.ok(cards.every(c => c.querySelector('.icon svg')), 'chaque univers affiche bien son icône');
  t.ok(/sans inscription/.test(hero.textContent), 'la promesse "sans inscription" (vraie : tout fonctionne en local) est présente');
  t.ok(document.getElementById('dashboardHeader') && document.getElementById('todayMission'), 'le tableau de bord existant reste présent sous le hero (rien supprimé)');
}

// ---------- Anglais ----------
{
  const { document, window } = loadPage('index.html', SCRIPTS);
  window.setLang('en');
  const hero = document.getElementById('homeHero');
  t.ok(hero.textContent.includes('Learn to manage your money better'), 'le hero est traduit en anglais');
  t.equal(hero.querySelector('#homeHeroStart').textContent.trim(), 'Get started', 'CTA traduit');
  window.setLang('fr');
  t.ok(hero.textContent.includes('Apprends à mieux gérer ton argent'), 'retour au français OK');
}

// ---------- Utilisateur qui revient : pas de hero, un <h1> masqué visuellement ----------
{
  const { document } = loadPage('index.html', SCRIPTS, {
    seed(w){ w.localStorage.setItem('likanza-gamification', JSON.stringify({xp: 120, financePoints: 120, streak: 3, lastVisit: null, badges: []})); }
  });
  const hero = document.getElementById('homeHero');
  t.equal(hero.style.display, 'none', "un utilisateur qui a déjà de l'XP ne voit pas le hero de découverte");
  t.ok(!hero.querySelector('.home-univers-card'), "aucune carte d'univers superflue pour un utilisateur qui revient");
  t.equal(document.querySelectorAll('h1').length, 1, 'un <h1> existe toujours (accessibilité)');
  t.ok(document.querySelector('h1').classList.contains('visually-hidden'), 'ce <h1> est masqué visuellement pour ne pas encombrer le tableau de bord');
  t.ok(!!document.getElementById('todayMission'), 'le tableau de bord est bien là');
}
{
  const { document } = loadPage('index.html', SCRIPTS, {
    seed(w){ w.localStorage.setItem('likanza-cours-progress', JSON.stringify({'bourse-actions': true})); }
  });
  t.equal(document.getElementById('homeHero').style.display, 'none', 'un cours terminé suffit pour ne plus être traité comme un nouveau visiteur');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
