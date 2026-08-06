// Relie le site statique à l'app d'authentification (Google, via Next Auth).
// Sur localhost:5050 on parle à l'app auth locale (localhost:3000) ; en
// production on parle à likanza-auth.vercel.app.
(function () {
  const AUTH_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://likanza-auth.vercel.app';

  function renderConnected(user) {
    const statusLine = document.getElementById('authStatusLine');
    const body = document.getElementById('authCardBody');
    if (statusLine) statusLine.textContent = 'connecté';
    if (!body) return;
    const avatar = user.image
      ? `<img src="${user.image}" alt="" style="width:40px;height:40px;border-radius:50%;">`
      : '';
    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        ${avatar}
        <div>
          <p style="font-weight:600;">${user.name || 'Utilisateur'}</p>
          <p style="font-size:12px;color:var(--text-dim);">${user.email}</p>
        </div>
      </div>
      <a class="btn btn-sm" href="${AUTH_BASE}/api/auth/signout?callbackUrl=${encodeURIComponent(location.href)}">Se déconnecter</a>
    `;
  }

  function renderDisconnected() {
    const statusLine = document.getElementById('authStatusLine');
    const body = document.getElementById('authCardBody');
    if (statusLine) statusLine.textContent = 'non connecté';
    if (!body) return;
    body.innerHTML = `
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:12px;">Connecte-toi pour créer ton compte réel Likanza Academy.</p>
      <a class="btn btn-gold btn-sm" href="${AUTH_BASE}/api/auth/signin/google?callbackUrl=${encodeURIComponent(location.href)}">Se connecter avec Google</a>
    `;
  }

  function renderError() {
    const statusLine = document.getElementById('authStatusLine');
    const body = document.getElementById('authCardBody');
    if (statusLine) statusLine.textContent = 'service de connexion indisponible';
    if (!body) return;
    body.innerHTML = `<p style="font-size:13px;color:var(--text-dim);">Impossible de contacter le service de connexion pour le moment.</p>`;
  }

  fetch(AUTH_BASE + '/api/progress', { credentials: 'include' })
    .then(function (res) {
      if (res.status === 401) return renderDisconnected();
      if (!res.ok) return renderError();
      return res.json().then(function (data) {
        renderConnected({ email: data.email, name: data.name, image: data.image });
      });
    })
    .catch(renderError);
})();
