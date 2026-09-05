/* ============================================================
   LIKANZA ACADEMY — Quiz approfondi (quiz-approfondi.html?domaine=<key>)
   Vérifie réellement le niveau d'un domaine (8 à 15 questions selon le
   contenu réellement disponible — jamais rempli de répétitions pour
   atteindre un chiffre). Réutilise le moteur de Défis (startMixedSession) :
   ce n'est pas un 7e moteur de quiz, juste un pool plus grand et
   mono-domaine, lancé avec opts.level/opts.categorie pour que le résultat
   final s'écrive dans fzr-deep-quiz-results (voir saveDeepQuizResult,
   scripts/data.js) au lieu de l'historique générique "mixte/mélange".
   ============================================================ */

const domainKey = new URLSearchParams(location.search).get('domaine');
const domain = DOMAINS.find(d => d.key === domainKey);

const introEl = document.getElementById('deepQuizIntro');
const sessionEl = document.getElementById('deepQuizSession');
const invalidEl = document.getElementById('deepQuizInvalid');

function buildDeepQuizPool(dom){
  const fromBank = QUIZ_BANK_FULL.filter(q => dom.quizCategories.includes(q.categorie));
  const fromMental = MENTAL_CHALLENGES.filter(m => m.domain === dom.mentalChallengeDomain);
  const pool = fromBank.concat(fromMental);
  for(let i = pool.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(pool.length, 15));
}

if(!domain){
  introEl.style.display = 'none';
  invalidEl.style.display = 'block';
} else {
  const pool = buildDeepQuizPool(domain);
  const isShort = pool.length < 8;
  const estMinutes = Math.max(3, Math.round(pool.length * 0.55));
  const hook = domain.deepQuizHook || {title:`${domain.label} : où en es-tu vraiment ?`, subtitle:'Raisonnement, cas concrets, calculs simples — pas seulement des définitions.'};

  introEl.innerHTML = `
    <span class="smallcaps">${domain.icon} ${domain.label}</span>
    <h2 class="display" style="font-size:24px;font-weight:600;margin:10px 0;">${hook.title}</h2>
    <p style="color:var(--text-dim);font-size:14px;line-height:1.6;margin-bottom:8px;">${hook.subtitle}</p>
    <p class="mono" style="font-size:11.5px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.04em;">${pool.length} situation${pool.length > 1 ? 's' : ''} · à ton rythme (~${estMinutes} min)</p>
    ${isShort ? `<p class="disclaimer-box">Le contenu réel pour ${domain.displayLabel} est encore limité sur Likanza : ce quiz est volontairement plus court, plutôt que rempli de répétitions pour atteindre un chiffre rond.</p>` : ''}
    <p class="disclaimer-box">Facultatif. Le résultat remplace ton niveau déclaré par un niveau réellement évalué pour ${domain.displayLabel} — visible dans Mon Univers Financier.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
      <button class="btn btn-gold" id="deepQuizStart" ${pool.length === 0 ? 'disabled' : ''}>Commencer</button>
      <a href="parcours.html" class="btn btn-sm">Annuler</a>
    </div>`;

  if(pool.length > 0){
    document.getElementById('deepQuizStart').addEventListener('click', () => {
      introEl.style.display = 'none';
      sessionEl.style.display = 'block';
      // Volontairement PAS de pickAdaptivePool ici (audit Formations Phase 3
      // du 27/08/2026) : ce quiz sert justement à ÉVALUER le niveau réel sur
      // tout le domaine (il remplace le niveau déclaré par un niveau
      // mesuré) — biaiser le tirage vers le niveau déjà supposé rendrait
      // l'évaluation circulaire, et un domaine entier n'a de toute façon pas
      // une seule catégorie/maîtrise à cibler.
      startMixedSession('deepQuizSession', pool, {
        level: domain.key,
        categorie: domain.label,
        showParcoursLink: true,
        onComplete: (score, total) => {
          const result = saveDeepQuizResult(domain.key, score, total);
          // Badge "examen réussi" (audit Formations Phase 6 du 27/08/2026) :
          // injecté après coup, une fois que startMixedSession a déjà rendu
          // son propre écran de résultat — jamais un second écran de résultat
          // concurrent, juste un badge en tête de celui qui existe déjà.
          const passed = result.pct >= DEEP_QUIZ_PASS_THRESHOLD * 100;
          const badge = `<p class="disclaimer-box" style="margin-bottom:12px;border-color:${passed ? 'var(--emerald)' : 'var(--hairline)'};">${passed ? '✓ Examen réussi' : 'Pas encore réussi'} — seuil de réussite : ${Math.round(DEEP_QUIZ_PASS_THRESHOLD*100)}% sur ce quiz approfondi.</p>`;
          sessionEl.innerHTML = badge + sessionEl.innerHTML;
        }
      });
    });
  }
}
