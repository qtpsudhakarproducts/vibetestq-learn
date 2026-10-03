/*
 * VibeTestQ Academy — brings interactive pages (practice sets, locator labs, quizzes)
 * onto the shared top navigation.
 *
 *   <link rel="stylesheet" href="/assets/academy/chrome.css">
 *   <script defer src="/assets/academy/chrome.js"
 *           data-pad="1"                  (optional; page's own header was not fixed)
 *           data-move=".mobile-menu-btn"  (optional; header controls that must keep working)></script>
 *
 * The page's own header is hidden; working pieces inside it (score pill, level badge,
 * assessment title) are moved, not copied, so the page's scripts keep working.
 */
(function () {
  'use strict';
  var d = document.currentScript.dataset;

  function loadBar(cb) {
    if (window.AcademyBar) return cb();
    var t = document.createElement('script');
    t.src = '/assets/academy/bar.js';
    t.onload = cb;
    document.head.appendChild(t);
  }

  function mount() {
    if (document.getElementById('acad-bar')) return;

    // pieces to keep alive, found before the legacy header is hidden
    var score = document.querySelector('.header-score');
    var level = document.querySelector('.level-badge');
    var title = document.querySelector('.assessment-title');
    var legacy = Array.prototype.slice.call(document.querySelectorAll('body > header, body > .container > header, body > .breadcrumb'));

    var bar = window.AcademyBar.mount({ sidebarToggle: false });
    var slot = bar.querySelector('.acb-slot');
    if (score) slot.appendChild(score);
    if (level) slot.appendChild(level);

    document.body.classList.add('acad-chrome');
    if (d.pad) document.body.classList.add('acad-pad');

    if (title) {
      title.classList.add('acad-moved-title');
      bar.insertAdjacentElement('afterend', title);
    }
    (d.move || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) bar.insertBefore(el, bar.firstChild);
    });
    legacy.forEach(function (el) { el.style.display = 'none'; });
    trackQuizScore();
  }

  // Quiz pages show "n / m" in #score-display when submitted. Remember the latest and best
  // score per quiz so the Quizzes home can show it (no change to the quiz's own code).
  function trackQuizScore() {
    var disp = document.getElementById('score-display');
    if (!disp || !document.getElementById('result-container')) return;
    var file = window.location.pathname.split('/').pop();
    var save = function () {
      var m = /(\d+)\s*\/\s*(\d+)/.exec(disp.textContent || '');
      if (!m || +m[2] === 0) return;
      try {
        var key = 'vtq-quiz:' + file;
        var prev = JSON.parse(localStorage.getItem(key) || 'null');
        localStorage.setItem(key, JSON.stringify({ score: +m[1], total: +m[2], best: Math.max(+m[1], prev ? prev.best || 0 : 0), at: Date.now() }));
      } catch (e) { /* storage unavailable: nothing to remember */ }
    };
    new MutationObserver(save).observe(disp, { childList: true, characterData: true, subtree: true });
  }

  function start() { loadBar(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
