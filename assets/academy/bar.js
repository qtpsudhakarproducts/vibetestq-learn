/*
 * VibeTestQ Academy — the one top navigation used by every learning page.
 *
 *   AcademyBar.mount({ sidebarToggle: true|false }) -> the bar element (#acad-bar)
 *
 * Same logo, same five destinations, same sign-out, on the reading pages, practice
 * sets, quizzes and labs. The current section is highlighted from the URL.
 * Self-contained: it injects its own styles, so any page can use it.
 */
(function () {
  'use strict';
  if (window.AcademyBar) return;

  var NAV = [
    { key: 'learn', label: 'Learn', href: '/learn/', icon: 'fas fa-book-open' },
    { key: 'curriculum', label: 'Curriculum', href: '/playwright/', icon: 'fas fa-route' },
    { key: 'practice', label: 'Practice', href: '/practicehub/', icon: 'fas fa-dumbbell' },
    { key: 'quizzes', label: 'Quizzes', href: '/playwright/assessments/', icon: 'fas fa-clipboard-check' },
    { key: 'interviews', label: 'Interview Prep', href: '/iqs/', icon: 'fas fa-microphone-lines' },
  ];

  function activeKey(p) {
    p = p.replace(/\/index\.html$/, '/');
    if (/^\/(iqs|playwright\/iqs)\b/.test(p)) return 'interviews';
    if (/^\/playwright\/assessments\b/.test(p)) return 'quizzes';
    if (/^\/(practicehub|projects|assignments)\b/.test(p)) return 'practice';
    if (/^\/locators\/(beginner|intermediate|advanced|expert|practice|learn)/.test(p)) return 'practice';
    if (/^\/(playwright|locators)\b/.test(p)) return 'curriculum';
    return 'learn';
  }

  var CSS = [
    '#acad-bar{position:fixed;top:0;left:0;right:0;height:56px;z-index:2000;display:flex;align-items:center;gap:1rem;padding:0 1rem;',
    'background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid #e2e8f0;box-shadow:0 1px 8px rgba(0,0,0,.06);',
    'font-family:"Segoe UI",system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.4}',
    '#acad-bar *{box-sizing:border-box}',
    '#acad-bar .acb-toggle{background:none;border:1px solid #e2e8f0;color:#1e293b;cursor:pointer;border-radius:7px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0}',
    '#acad-bar .acb-toggle:hover{background:#f1f5f9;border-color:#0284c7}',
    '#acad-bar .acb-logo{display:flex;align-items:center;gap:8px;flex-shrink:0;text-decoration:none}',
    '#acad-bar .acb-logo img{height:50px;width:100px;object-fit:contain;display:block}',
    '#acad-bar .acb-brand-label{font-size:9px;font-weight:700;letter-spacing:.08em;color:#0369a1;padding:4px 6px;border:1px solid #dce5ed;border-radius:4px;background:#f0f9ff}',
    '#acad-bar .acb-nav{display:flex;align-items:center;gap:.15rem;margin-left:.5rem}',
    '#acad-bar .acb-link{display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .75rem;border-radius:8px;font-size:.84rem;font-weight:600;color:#475569;text-decoration:none;white-space:nowrap;transition:background .12s,color .12s}',
    '#acad-bar .acb-link:hover{background:#f1f5f9;color:#0f172a}',
    '#acad-bar .acb-link.active{background:rgba(2,132,199,.1);color:#0369a1}',
    '#acad-bar .acb-link i{font-size:.8rem;opacity:.8}',
    '#acad-bar .acb-spacer{flex:1}',
    '#acad-bar .acb-right{display:flex;align-items:center;gap:.5rem;flex-shrink:0}',
    '#acad-bar .acb-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .8rem;border-radius:8px;font-size:.78rem;font-weight:700;text-decoration:none;border:1px solid #e2e8f0;color:#475569;background:#fff;cursor:pointer;white-space:nowrap}',
    '#acad-bar .acb-btn:hover{border-color:#0284c7;color:#0284c7}',
    '#acad-bar .acb-menu{display:none;position:relative}',
    '#acad-bar .acb-panel{display:none;position:absolute;right:0;top:calc(100% + 8px);min-width:210px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.16);padding:.4rem}',
    '#acad-bar .acb-menu.open .acb-panel{display:block}',
    '#acad-bar .acb-panel .acb-link{display:flex;width:100%;padding:.55rem .7rem}',
    '#acad-bar .acb-slot{display:flex;align-items:center;gap:.5rem}',
    '#acad-bar .header-score{margin:0;font-size:.78rem;color:#475569}',
    '#acad-bar .level-badge{margin:0}',
    '@media(max-width:1000px){#acad-bar .acb-nav{display:none}#acad-bar .acb-menu{display:block}#acad-bar .acb-user .acb-label{display:none}}',
    '#acad-bar a:focus-visible,#acad-bar button:focus-visible{outline:2px solid #0284c7;outline-offset:2px}',
    '@media(max-width:560px){#acad-bar{gap:.5rem;padding:0 .6rem}#acad-bar .acb-logo img{height:46px;width:76px}#acad-bar .acb-logo{gap:4px}#acad-bar .acb-brand-label{font-size:8px}#acad-bar .acb-btn{padding:.35rem .55rem}#acad-bar .acb-home{display:none}}',
    '@media(max-width:420px){#acad-bar .acb-brand-label{display:none}}',
    'body.acad-pad{padding-top:56px}',
  ].join('\n');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function mount(opts) {
    opts = opts || {};
    var old = document.getElementById('acad-bar');
    if (old) return old;
    if (!document.getElementById('acb-style')) {
      var st = document.createElement('style');
      st.id = 'acb-style'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    var active = activeKey(window.location.pathname);
    var links = function (cls) {
      return NAV.map(function (n) {
        return '<a class="acb-link ' + cls + (n.key === active ? ' active' : '') + '" href="' + n.href + '"' +
          (n.key === active ? ' aria-current="page"' : '') + '><i class="' + n.icon + '" aria-hidden="true"></i> ' + esc(n.label) + '</a>';
      }).join('');
    };
    var bar = document.createElement('header');
    bar.id = 'acad-bar';
    bar.setAttribute('role', 'banner');
    bar.innerHTML =
      (opts.sidebarToggle ? '<button id="sb-toggle" class="acb-toggle" type="button" aria-label="Toggle chapter list"><i class="fas fa-bars"></i></button>' : '') +
      '<a class="acb-logo" href="/" aria-label="VibeTestQ Academy home"><img src="/assets/vq/VQLogoTitleForLight.png" width="100" height="50" alt="VibeTestQ"><span class="acb-brand-label">ACADEMY</span></a>' +
      '<nav class="acb-nav" aria-label="Academy">' + links('') + '</nav>' +
      '<span class="acb-spacer"></span>' +
      '<div class="acb-right"><div class="acb-slot"></div>' +
      '<div class="acb-menu"><button class="acb-btn" type="button" aria-controls="academy-learning-menu" aria-expanded="false"><i class="fas fa-compass" aria-hidden="true"></i> Menu</button>' +
      '<div class="acb-panel" id="academy-learning-menu">' + links('') + '<a class="acb-link" href="/#programs">Live programs</a><a class="acb-link" href="/upcoming-trainings.html">Batch schedule</a><a class="acb-link" href="/"><i class="fas fa-graduation-cap" aria-hidden="true"></i> Academy home</a></div></div>' +
      '<a class="acb-btn acb-home" href="/"><i class="fas fa-graduation-cap" aria-hidden="true"></i> <span class="acb-label">Academy</span></a>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);

    var menu = bar.querySelector('.acb-menu'), mbtn = menu.querySelector('button');
    mbtn.addEventListener('click', function (e) { e.stopPropagation(); var o = menu.classList.toggle('open'); mbtn.setAttribute('aria-expanded', o); });
    document.addEventListener('click', function () { menu.classList.remove('open'); mbtn.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open'); mbtn.setAttribute('aria-expanded', 'false'); mbtn.focus();
      }
    });

    // signed-in reader: who they are + Sign out (auth-guard.js fires academy:auth)
    function user() {
      var au = window.academyAuth, right = bar.querySelector('.acb-right');
      if (!au || bar.querySelector('.acb-user')) return;
      var b = document.createElement('button');
      b.className = 'acb-btn acb-user'; b.type = 'button';
      b.title = au.user.name + (au.user.email ? ' · ' + au.user.email : '');
      b.innerHTML = '<i class="fas fa-right-from-bracket" aria-hidden="true"></i> <span class="acb-label">Sign out</span>';
      b.addEventListener('click', function () { au.signOut(); });
      right.appendChild(b);
    }
    window.addEventListener('academy:auth', user);
    user();
    return bar;
  }

  window.AcademyBar = { mount: mount, nav: NAV, activeKey: activeKey };
})();
