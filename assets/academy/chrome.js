/*
 * VibeTestQ Academy — shared top bar for interactive pages.
 *
 *   <link rel="stylesheet" href="/assets/academy/chrome.css">
 *   <script defer src="/assets/academy/chrome.js"
 *           data-section="Practice Hub" data-section-href="/practicehub/"
 *           data-back-label="Practice Hub" data-back-href="/practicehub/"   (optional)
 *           data-title="Playwright Locators"                                (optional; defaults to first <h1>)
 *           data-pad="1"                                                    (optional; page header was not fixed)></script>
 *
 * The page's own header is hidden; working pieces inside it (score pill, level badge,
 * assessment title) are moved, not copied, so the page's scripts keep working.
 */
(function () {
  'use strict';
  const s = document.currentScript;
  const d = s.dataset;

  function mount() {
    if (document.getElementById('acad-bar')) return;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // pieces to keep alive, found before the legacy header is hidden
    const score = document.querySelector('.header-score');
    const level = document.querySelector('.level-badge');
    const title = document.querySelector('.assessment-title');

    const legacy = Array.from(document.querySelectorAll('body > header, body > .container > header, body > .breadcrumb'));

    const h1 = document.querySelector('main h1, h1');
    const pageTitle = d.title || (h1 ? h1.textContent.trim() : '');

    const bar = document.createElement('div');
    bar.id = 'acad-bar';
    bar.innerHTML =
      '<a class="acad-logo" href="/"><img src="/assets/ulogo.jpg" alt="VibeTestQ"></a>' +
      '<span class="acad-sep">›</span>' +
      (d.sectionHref ? '<a class="acad-sec" href="' + esc(d.sectionHref) + '">' + esc(d.section || 'Academy') + '</a>' : '<span class="acad-sec">' + esc(d.section || 'Academy') + '</span>') +
      (pageTitle ? '<span class="acad-page">' + esc(pageTitle) + '</span>' : '<span class="acad-page"></span>') +
      '<div class="acad-right"></div>';
    const right = bar.querySelector('.acad-right');

    if (score) right.appendChild(score);
    if (level) right.appendChild(level);
    const btn = (href, icon, label, accent) =>
      '<a class="acad-btn' + (accent ? ' accent' : '') + '" href="' + href + '"><i class="' + icon + '"></i> <span class="acad-label">' + label + '</span></a>';
    if (d.backHref) right.insertAdjacentHTML('beforeend', btn(d.backHref, 'fas fa-arrow-left', esc(d.backLabel || 'Back')));
    right.insertAdjacentHTML('beforeend', btn('/playwright/', 'fas fa-route', 'Curriculum'));
    right.insertAdjacentHTML('beforeend', btn('/', 'fas fa-graduation-cap', 'Academy', true));

    function renderUser() {
      const au = window.academyAuth;
      if (!au || document.getElementById('acad-user')) return;
      const b = document.createElement('button');
      b.id = 'acad-user'; b.className = 'acad-btn'; b.type = 'button';
      b.title = au.user.name + (au.user.email ? ' · ' + au.user.email : '');
      b.innerHTML = '<i class="fas fa-right-from-bracket"></i> <span class="acad-label">Sign out</span>';
      b.addEventListener('click', () => au.signOut());
      right.appendChild(b);
    }
    window.addEventListener('academy:auth', renderUser);
    renderUser();

    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('acad-chrome');
    if (d.pad) document.body.classList.add('acad-pad');

    if (title) {
      title.classList.add('acad-moved-title');
      bar.insertAdjacentElement('afterend', title);
    }
    // data-move=".mobile-menu-btn": controls from the page's own header that must keep working
    (d.move || '').split(',').map((x) => x.trim()).filter(Boolean).forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) bar.insertBefore(el, bar.firstChild);
    });
    legacy.forEach((el) => { el.style.display = 'none'; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
