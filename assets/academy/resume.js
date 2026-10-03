/*
 * "Welcome back" strip for the Academy home: shows where a returning learner left off.
 * Needs nothing on the page except a <main> element and the site's colour variables.
 * Shows nothing for a first-time visitor, and never breaks the page if storage is blocked.
 */
(function () {
  'use strict';
  function run() {
    var P = window.AcademyProgress;
    var main = document.querySelector('main');
    if (!P || !main) return;
    var r = P.all()[0];
    if (!r || !r.last) return;
    var done = Object.keys(r.done).length, total = r.total || 0;
    var pct = total ? Math.round((100 * done) / total) : 0;
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    var st = document.createElement('style');
    st.textContent =
      '.wb{max-width:1160px;margin:5.6rem auto -3.2rem;padding:0 1.25rem;position:relative;z-index:5}' +
      '.wb-in{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:.85rem 1.1rem;box-shadow:0 10px 30px rgba(0,0,0,.18)}' +
      '.wb-txt{flex:1;min-width:220px;color:var(--text-main);font-size:.92rem;line-height:1.4}' +
      '.wb-txt small{display:block;color:var(--text-muted);font-size:.78rem;margin-top:.15rem}' +
      '.wb-bar{width:130px;height:6px;border-radius:99px;background:rgba(148,163,184,.25);overflow:hidden}' +
      '.wb-bar i{display:block;height:100%;background:linear-gradient(90deg,#6366f1,#10b981)}' +
      '.wb-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.55rem 1rem;border-radius:10px;background:var(--primary);color:#fff;font-weight:700;font-size:.88rem;text-decoration:none;white-space:nowrap}' +
      '.wb-btn:hover{filter:brightness(1.1)}' +
      '@media(max-width:700px){.wb{margin-top:5rem}.wb-bar{display:none}}';
    document.head.appendChild(st);

    var el = document.createElement('div');
    el.className = 'wb';
    el.innerHTML =
      '<div class="wb-in" role="region" aria-label="Continue learning">' +
      '<div class="wb-txt"><b>Welcome back.</b> Continue <b>' + esc(r.last.title) + '</b><small>' + esc(r.title) + ' · ' + done + ' of ' + total + ' completed</small></div>' +
      '<span class="wb-bar" role="img" aria-label="' + pct + ' percent complete"><i style="width:' + pct + '%"></i></span>' +
      '<a class="wb-btn" href="' + esc(r.href) + '#ch' + esc(r.last.num) + '"><i class="fas fa-play" aria-hidden="true"></i> Resume</a></div>';
    main.parentNode.insertBefore(el, main);
  }

  function boot() {
    if (window.AcademyProgress) return run();
    var s = document.createElement('script');
    s.src = '/assets/academy/progress.js';
    s.onload = run;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
