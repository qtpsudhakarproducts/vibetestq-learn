(function () {
  if (window.__docsAuthGuardLoaded) return;
  window.__docsAuthGuardLoaded = true;

  // This script is only included on protected learning pages (see each page's <head>),
  // so the only page it must skip is the login page itself.
  const pathname = window.location.pathname.replace(/\\/g, '/');
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const isLoginPage = normalizedPath === '/login.html' || normalizedPath === '/login';

  if (isLoginPage) {
    return;
  }

  const loginUrl = '/login.html?redirect=' + encodeURIComponent(pathname + window.location.search);
  window.__docsAuthRedirectUrl = loginUrl;

  const isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalPreview) {
    return;
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

    const firebaseConfig = {
      apiKey: "AIzaSyBFlp21T_oghQMpH0y5D7N9p3dqNQfBtxg",
      authDomain: "vibetestq-b3eb9.firebaseapp.com",
      projectId: "vibetestq-b3eb9",
      storageBucket: "vibetestq-b3eb9.firebasestorage.app",
      messagingSenderId: "334461164720",
      appId: "1:334461164720:web:5f563cca7e91f00e33ef75",
      measurementId: "G-B7E47M7147"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.replace(window.__docsAuthRedirectUrl);
      }
    });
  `;

  document.head.appendChild(script);
})();
