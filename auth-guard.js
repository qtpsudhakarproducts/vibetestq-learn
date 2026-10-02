/*
 * VibeTestQ Academy — sign-in gate for learning pages.
 *
 * Content is free; readers sign in with GitHub. This script:
 *  - hides the page until Firebase confirms a signed-in user (no flash of content),
 *  - sends everyone else to /login.html and back to where they were afterwards,
 *  - exposes window.academyAuth ({ user, signOut }) and fires "academy:auth" so
 *    the Academy top bars can show who is signed in and offer "Sign out".
 *
 * Note: this is a client-side gate. The lesson files are static, so it keeps casual
 * visitors out but does not make the files private.
 */
(function () {
  'use strict';
  if (window.__academyGuard) return;
  window.__academyGuard = true;

  var path = window.location.pathname.replace(/\\/g, '/');
  var normalized = path.replace(/\/+$/, '') || '/';
  if (normalized === '/login.html' || normalized === '/login') return;

  function loginUrl() {
    return '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
  }
  window.__docsAuthRedirectUrl = loginUrl(); // kept for older pages

  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return; // local preview is not gated

  // Hide the page until we know who is reading it.
  var hide = document.createElement('style');
  hide.id = 'academy-guard-style';
  hide.textContent = 'html{visibility:hidden}';
  document.documentElement.appendChild(hide);

  var toLogin = function () { window.location.replace(loginUrl()); };
  // If Firebase cannot load (blocked network, CDN down) do not leave a blank page.
  var timer = setTimeout(toLogin, 10000);
  window.__academyGuardApi = {
    ok: function () { clearTimeout(timer); hide.remove(); },
    toLogin: toLogin,
  };

  var script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

    const firebaseConfig = {
      apiKey: "AIzaSyBFlp21T_oghQMpH0y5D7N9p3dqNQfBtxg",
      authDomain: "vibetestq-b3eb9.firebaseapp.com",
      projectId: "vibetestq-b3eb9",
      storageBucket: "vibetestq-b3eb9.firebasestorage.app",
      messagingSenderId: "334461164720",
      appId: "1:334461164720:web:5f563cca7e91f00e33ef75",
      measurementId: "G-B7E47M7147"
    };

    const auth = getAuth(initializeApp(firebaseConfig));
    onAuthStateChanged(auth, (user) => {
      const api = window.__academyGuardApi;
      if (!user) { api.toLogin(); return; }
      window.academyAuth = {
        user: { name: user.displayName || user.email || 'Signed in', email: user.email || '', photo: user.photoURL || '' },
        signOut: () => signOut(auth).then(() => window.location.replace('/login.html')),
      };
      api.ok();
      window.dispatchEvent(new CustomEvent('academy:auth'));
    });
  `;
  script.onerror = toLogin;
  document.head.appendChild(script);
})();
