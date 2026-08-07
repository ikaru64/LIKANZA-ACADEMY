document.getElementById('libCount').textContent = LIBRARY.length + ' notions';

let currentMode = 'simple';
let currentCat = 'Toutes';
const cats = ['Toutes', ...new Set(LIBRARY.map(l=>l.categorie))];
document.getElementById('libFilters').innerHTML = cats.map((c,i)=>`<button class="pill ${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('');

// ---------- Lexique A-Z : saute jusqu'à la première notion commençant par la lettre ----------
const AZ_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const availableLetters = new Set(LIBRARY.map(l=>l.terme[0].toUpperCase()));
document.getElementById('azStrip').innerHTML = AZ_LETTERS.map(letter=>{
  const has = availableLetters.has(letter);
  return `<a href="#" class="${has?'':'disabled'}" data-letter="${letter}">${letter}</a>`;
}).join('');
document.getElementById('azStrip').addEventListener('click', e=>{
  const a = e.target.closest('a');
  if(!a || a.classList.contains('disabled')) return;
  e.preventDefault();
  const target = document.querySelector(`#libList [data-letter="${a.dataset.letter}"]`);
  if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
});

function renderLib(){
  const searchInputEl = document.getElementById('libSearch');
  const query = searchInputEl ? searchInputEl.value.trim().toLowerCase() : '';
  let items = currentCat==='Toutes' ? LIBRARY : LIBRARY.filter(l=>l.categorie===currentCat);
  if(query) items = items.filter(l=>l.terme.toLowerCase().includes(query) || l.simple.toLowerCase().includes(query));
  items = [...items].sort((a,b)=>a.terme.localeCompare(b.terme));
  const bodyKey = {simple:'simple', detail:'detail', avance:'avance'}[currentMode] === 'detail' ? 'detail' : (currentMode==='avance' ? 'avance' : 'simple');
  document.getElementById('libList').innerHTML = items.map((l,i)=>`
    <div class="glossary-item" id="${l.terme.replace(/\s+/g,'-')}" data-letter="${l.terme[0].toUpperCase()}">
      <div class="head" onclick="this.nextElementSibling.classList.toggle('open')">
        <h4>${l.terme}</h4>
        <span class="idx">${l.niveau} · ${l.lecture}</span>
      </div>
      <div class="glossary-body">
        <div class="glossary-body-inner">
          <div id="libConseil-${i}"></div>
          <p style="margin-bottom:10px;">${l[bodyKey]}</p>
          ${l.exemple ? `<p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;"><strong style="color:var(--text);">Exemple : </strong>${l.exemple}</p>` : ''}
          ${l.avantages && l.avantages.length ? `<p style="font-size:12.5px;margin-bottom:6px;"><strong style="color:var(--emerald);">Avantages :</strong> ${l.avantages.join(' · ')}</p>` : ''}
          ${l.inconvenients && l.inconvenients.length ? `<p style="font-size:12.5px;margin-bottom:6px;"><strong style="color:var(--bordeaux);">Limites :</strong> ${l.inconvenients.join(' · ')}</p>` : ''}
          ${l.erreurs && l.erreurs.length ? `<p style="font-size:12.5px;"><strong style="color:var(--gold-bright);">Erreurs fréquentes :</strong> ${l.erreurs.join(' · ')}</p>` : ''}
        </div>
      </div>
    </div>`).join('') || '<p class="empty-note" style="padding:24px;">Aucune notion trouvée.</p>';

  items.forEach((l,i)=>{
    const conseil = pickConseilMessage(l.niveau, {weakCategory: getWeakCategoryLabel(l.categorie)});
    renderConseilBadge(`libConseil-${i}`, conseil);
  });
}
document.getElementById('libFilters').addEventListener('click', e=>{
  if(e.target.tagName !== 'BUTTON') return;
  document.querySelectorAll('#libFilters .pill').forEach(p=>p.classList.remove('active'));
  e.target.classList.add('active');
  currentCat = e.target.dataset.cat;
  renderLib();
});
document.querySelectorAll('.mode-toggle .pill').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.mode-toggle .pill').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    renderLib();
  });
});
document.getElementById('libSearch').addEventListener('input', renderLib);
renderLib();
if(location.hash) setTimeout(()=>{ const el=document.querySelector(location.hash); if(el) el.scrollIntoView({behavior:'smooth'}); }, 200);
