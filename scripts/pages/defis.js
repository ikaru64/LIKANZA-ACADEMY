/* ============================================================
   LIKANZA ACADEMY — Défis
   Deux modes construits pour cette passe : Quiz express (moteur
   existant, renderQuizSetup) et Vrai ou faux (renderVraiFaux,
   partagé avec Play). D'autres formats (classement, portfolio
   challenge, graph challenge...) viendront dans une prochaine passe.
   ============================================================ */

let defisMode = 'quiz';
document.querySelectorAll('[data-defismode]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-defismode]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    defisMode = btn.dataset.defismode;
    document.getElementById('defisQuiz').style.display = defisMode === 'quiz' ? 'block' : 'none';
    document.getElementById('defisVraiFaux').style.display = defisMode === 'vraifaux' ? 'block' : 'none';
    if(defisMode === 'vraifaux' && !document.getElementById('defisVraiFaux').dataset.started){
      document.getElementById('defisVraiFaux').dataset.started = '1';
      renderVraiFaux('defisVraiFaux');
    }
  });
});

renderQuizSetup('defisQuiz');

// Arrivée depuis un lien "Réviser cette notion" (ex. Mon parcours, banque
// d'erreurs) : ?cat=<catégorie> présélectionne le thème et démarre direct.
const requestedCat = new URLSearchParams(location.search).get('cat');
if(requestedCat){
  const validCats = new Set(QUIZ_BANK_FULL.map(q=>q.categorie));
  if(validCats.has(requestedCat)){
    const catSelect = document.getElementById('defisQuiz-cat');
    const startBtn = document.getElementById('defisQuiz-start');
    if(catSelect && startBtn){
      catSelect.value = requestedCat;
      startBtn.click();
    }
  }
}
