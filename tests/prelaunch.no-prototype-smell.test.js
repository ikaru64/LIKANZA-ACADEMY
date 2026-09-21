/* ============================================================
   Pré-lancement (2026-09-21), P1 — plus rien qui trahisse un prototype :
   pas de faux joueurs, pas d'étape "Boss — bientôt", pas de carte "Arène :
   bientôt disponible", pas de chiffres périmés (82 questions / 23 thèmes).
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createSuite } = require('./support/assert');
const { loadPage, ROOT } = require('./support/load-page');

const t = createSuite('prelaunch.no-prototype-smell');
const COMMON = ['scripts/icons.js', 'scripts/app.js', 'scripts/data.js'];
const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ---------- Ligues : palier réel, aucun concurrent fictif ----------
{
  const { document, window } = loadPage('index.html', COMMON, {
    seed(w){ w.localStorage.setItem('likanza-gamification', JSON.stringify({xp: 200, financePoints: 200, streak: 1, lastVisit: null, badges: []})); }
  });
  const host = document.createElement('div');
  host.id = 'leagueTest';
  document.body.appendChild(host);
  window.renderLeagueBoard('leagueTest');
  t.ok(host.textContent.includes('Ligue Argent'), 'la vraie ligue (200 XP -> Argent) est affichée');
  t.ok(host.textContent.includes('200 XP'), "l'XP réel est affiché");
  t.ok(/Encore 200 XP pour atteindre la ligue Or/.test(host.textContent), 'la progression vers la ligue suivante est calculée sur les vrais seuils');
  t.ok(!/Léa M|Yanis B|Chloé R|démo|fictif/i.test(host.textContent), "aucun faux joueur ni mention de démo n'est affiché");
  t.ok(!!host.querySelector('.dash-weekfill'), 'une vraie barre de progression est rendue');
  const top = document.createElement('div'); top.id = 'leagueTop'; document.body.appendChild(top);
  window.localStorage.setItem('likanza-gamification', JSON.stringify({xp: 5000, financePoints: 5000, streak: 1, lastVisit: null, badges: []}));
  window.renderLeagueBoard('leagueTop');
  t.ok(top.textContent.includes('ligue la plus haute'), 'la dernière ligue est gérée sans "undefined" ni NaN');
  t.ok(!/undefined|NaN/.test(top.textContent), 'aucun undefined/NaN dans le rendu');
}

// ---------- Marqueurs de prototype absents ----------
{
  t.ok(!/is-boss|Boss — bientôt/.test(src('scripts/data.js') + src('styles/design-system.css')), 'plus d\'étape fantôme "Boss — bientôt" dans les parcours de Défis');
  t.ok(!/arenaTitle|Arène : bientôt|Arena: coming soon/.test(src('index.html') + src('scripts/pages/index.js')), 'plus de carte "Arène : bientôt disponible" sur l\'accueil');
  t.ok(!/DEMO_PLAYERS/.test(src('scripts/data.js')), 'les faux profils DEMO_PLAYERS ont disparu');
  const all = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).map(src).join('\n') + src('scripts/data.js') + src('scripts/pages/index.js');
  t.ok(!/Bientôt disponible|profils de démonstration|Classement de démo|Formulaire de démonstration|Demo form/i.test(all), 'aucun libellé "Bientôt disponible" / "profils de démonstration" / "Classement de démo" / formulaire de démonstration');
}

// ---------- Chiffres : plus de valeurs périmées, et vrais ----------
{
  t.ok(!/82 questions|23 thèmes/.test(src('formations.html') + src('scripts/pages/index.js')), 'plus de "82 questions / 23 thèmes" (chiffres périmés)');
  const { runInPage } = loadPage('formations.html', COMMON);
  const real = runInPage('window.__r = {n: QUIZ_BANK_FULL.length + MENTAL_CHALLENGES.length, cats: new Set(QUIZ_BANK_FULL.concat(MENTAL_CHALLENGES).map(q => q.categorie)).size};');
  t.ok(real.n > 300, `"plus de 300 questions" est vrai (${real.n} questions réelles)`);
  t.ok(real.cats >= 45 && real.cats <= 60, `"une cinquantaine de thèmes" est vrai (${real.cats} catégories réelles)`);
  t.ok(/plus de 300 questions/.test(src('formations.html')) && /plus de 300 questions/.test(src('scripts/pages/index.js')), 'les deux promos affichent la valeur vérifiée');
}

const summary = t.summary();
console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
process.exit(summary.failed > 0 ? 1 : 0);
