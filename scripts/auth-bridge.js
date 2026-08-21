// Relie le site statique à l'app d'authentification (Google, via Next Auth).
// Les cookies cross-site étant bloqués par la plupart des navigateurs
// modernes, l'info de connexion transite explicitement par l'URL au retour
// (fragment #la_user=..., jamais envoyé au serveur) puis reste en cache dans
// localStorage tant que l'utilisateur ne se déconnecte pas.
(function () {
  const AUTH_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://likanza-auth.vercel.app';

  const STORAGE_KEY = 'likanza-auth-user';

  function renderConnected(user) {
    const statusLine = document.getElementById('authStatusLine');
    const body = document.getElementById('authCardBody');
    if (statusLine) statusLine.textContent = 'connecté';
    if (!body) return;
    const avatar = user.image
      ? `<img src="${user.image}" alt="" style="width:40px;height:40px;border-radius:50%;">`
      : '';
    const esc = window.escapeHtml || (s => String(s == null ? '' : s));
    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        ${avatar}
        <div>
          <p style="font-weight:600;">${esc(user.name) || 'Utilisateur'}</p>
          <p style="font-size:12px;color:var(--text-dim);">${esc(user.email)}</p>
        </div>
      </div>
      <p id="progressSyncStatus" style="font-size:11.5px;color:var(--text-dim);border-left:2px solid var(--hairline);padding-left:10px;margin-bottom:12px;">Vérification de la synchronisation…</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <button type="button" class="btn btn-sm" id="restoreProgressBtn" style="display:none;">Restaurer depuis mon compte</button>
      </div>
      <a class="btn btn-sm" href="${AUTH_BASE}/?action=signout&callbackUrl=${encodeURIComponent(location.origin + location.pathname)}">Se déconnecter</a>
    `;
    const restoreBtn = document.getElementById('restoreProgressBtn');
    if (restoreBtn && window.forceRestoreProgress) restoreBtn.addEventListener('click', window.forceRestoreProgress);
    if (window.refreshProgressSyncStatus) window.refreshProgressSyncStatus();
  }

  function renderDisconnected() {
    const statusLine = document.getElementById('authStatusLine');
    const body = document.getElementById('authCardBody');
    if (statusLine) statusLine.textContent = 'non connecté';
    if (!body) return;
    body.innerHTML = `
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:8px;">Connecte-toi pour sauvegarder ta progression (XP, missions, quiz, profil) sur un vrai compte et la retrouver sur un autre appareil.</p>
      <p style="font-size:11.5px;color:var(--text-dim);margin-bottom:12px;">Tant que tu n'es pas connecté, ta progression reste uniquement locale à cet appareil.</p>
      <a class="btn btn-gold btn-sm" href="${AUTH_BASE}/?callbackUrl=${encodeURIComponent(location.origin + location.pathname)}">Se connecter avec Google</a>
    `;
  }

  // Accès localStorage protégés : certains navigateurs (navigation privée,
  // stockage désactivé/plein) lèvent une exception synchrone même sur un
  // simple getItem — sans ce garde-fou, tout le module planterait et
  // compte.html afficherait une zone vide sans explication.
  function safeStorageGet(key){ try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeStorageSet(key, value){ try { localStorage.setItem(key, value); } catch (e) { /* silencieux : rien à persister n'est pas critique ici */ } }
  function safeStorageRemove(key){ try { localStorage.removeItem(key); } catch (e) { /* idem */ } }

  // 1. Retour tout juste connecté : les infos sont dans le fragment de l'URL.
  const hashMatch = location.hash.match(/la_user=([^&]+)/);
  if (hashMatch) {
    try {
      const user = JSON.parse(atob(decodeURIComponent(hashMatch[1])));
      safeStorageSet(STORAGE_KEY, JSON.stringify(user));
      history.replaceState(null, '', location.pathname + location.search);
      renderConnected(user);
      return;
    } catch (e) {
      // fragment illisible : on retombe sur les cas suivants.
    }
  }

  // 2. Retour tout juste déconnecté.
  if (/[?&]la_signedout=1/.test(location.search)) {
    safeStorageRemove(STORAGE_KEY);
    const cleanSearch = location.search.replace(/[?&]la_signedout=1/, '').replace(/^&/, '?');
    history.replaceState(null, '', location.pathname + (cleanSearch === '?' ? '' : cleanSearch));
    renderDisconnected();
    return;
  }

  // 3. Visite normale : on se fie au dernier statut connu en local.
  const cached = safeStorageGet(STORAGE_KEY);
  if (cached) {
    try {
      renderConnected(JSON.parse(cached));
      return;
    } catch (e) {
      safeStorageRemove(STORAGE_KEY);
    }
  }
  renderDisconnected();
})();
