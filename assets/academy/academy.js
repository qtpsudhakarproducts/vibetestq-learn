/*
 * VibeTestQ Academy shell
 * One reading experience for every learning section: top bar, sidebar tree,
 * study-map home, chapter reader, prev/next, progress bar.
 *
 * A section page only needs:
 *   <script src="/assets/academy/academy.js" data-manifest="/data/<section>.json"></script>
 *
 * Manifest: see /data/iqs.json (fragments) and /data/pwdoc.json (markdown).
 */
(function () {
  'use strict';

  const script = document.currentScript;
  const manifestUrl = script && script.dataset.manifest;
  if (!manifestUrl) { console.error('academy.js: data-manifest is required'); return; }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const libs = {};
  function lib(name, src) { return libs[name] || (libs[name] = loadScript(src)); }

  fetch(manifestUrl).then((r) => r.json()).then(start).catch((e) => {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif;color:#b91c1c">Could not load this section (' + esc(e.message) + ').</p>';
  });

  function start(M) {
    const PARTS = M.parts;
    const ALL = [];
    PARTS.filter((p) => p.live !== false).forEach((p) => p.chapters.forEach((c) => ALL.push(Object.assign({}, c, { part: p }))));
    const byNum = new Map(ALL.map((c) => [String(c.num), c]));

    // ── Shell ──────────────────────────────────────────────────────────────
    document.body.innerHTML = `
      <header id="topbar">
        <button id="sb-toggle" aria-label="Toggle sidebar"><i class="fas fa-bars"></i></button>
        <a class="tbar-logo" href="/"><img src="/assets/ulogo.jpg" alt="VibeTestQ"></a>
        <span class="tbar-sep">›</span>
        <span class="tbar-pg">${esc(M.title)}</span>
        <span id="tbar-ch"></span>
        <div class="tbar-right">${(M.topbar || []).map((b) =>
          `<a class="tbar-btn${b.accent ? ' accent' : ''}" href="${b.href}"${b.target ? ` target="${b.target}"` : ''}><i class="${b.icon}"></i> <span class="tbar-label">${esc(b.label)}</span></a>`).join('')}
        </div>
      </header>
      <div id="sb-overlay"></div>
      <div id="app">
        <aside id="sidebar">
          <div class="sb-head">
            <div class="sb-head-title"><i class="${M.sidebarIcon || 'fas fa-book'}" style="font-size:.9rem"></i> ${esc(M.title)}</div>
            <div class="sb-head-meta">${esc(M.meta || '')}</div>
          </div>
          <nav id="sb-nav"></nav>
        </aside>
        <div id="content-col">
          <div id="prog"><div id="prog-fill"></div></div>
          <div id="main"></div>
        </div>
      </div>`;

    const sbNav = document.getElementById('sb-nav');
    const mainEl = document.getElementById('main');
    const progFill = document.getElementById('prog-fill');
    const tbarCh = document.getElementById('tbar-ch');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sb-overlay');
    const contentCol = document.getElementById('content-col');
    const colorVars = (p) => `--pc:${p.color};--pc-rgb:${p.rgb}`;
    const label = (p) => (M.partLabel || 'Part') + ' ' + p.num;
    // chapterWord lets a manifest name its units ("steps", "lessons") instead of "chapters"
    const word = (n) => (M.chapterWord ? (n === 1 ? M.chapterWord.replace(/s$/, '') : M.chapterWord) : (n === 1 ? 'chapter' : 'chapters'));
    const metric = (p) => `${p.chapters.length} ${word(p.chapters.length)}${p.metric ? ' · ' + p.metric : ''}`;
    const metricShort = (p) => `${p.chapters.length} ${M.chapterWord ? word(p.chapters.length) : 'ch'}${p.metric ? ' · ' + p.metric : ''}`;

    // ── Sidebar ────────────────────────────────────────────────────────────
    function buildSidebar() {
      sbNav.innerHTML = '';
      PARTS.forEach((p) => {
        const live = p.live !== false;
        const grp = document.createElement('div');
        grp.className = 'part-group';
        const toggle = document.createElement('button');
        toggle.className = 'part-toggle' + (live ? '' : ' locked');
        toggle.style.cssText = colorVars(p);
        const pc = live ? p.color : '#94a3b8';
        toggle.innerHTML = `
          <span class="p-badge" style="--pc:${pc};--pc-rgb:${live ? p.rgb : '148,163,184'}">
            <span style="font-size:.5rem;font-weight:900;opacity:.8;letter-spacing:.04em;text-transform:uppercase;color:${pc}">${esc((M.badgeLetter || 'P'))}</span>
            <span style="font-size:.82rem;font-weight:900;color:${pc}">${p.num}</span>
          </span>
          <span class="p-info">
            <span class="p-title"${live ? '' : ' style="color:#94a3b8"'}>${esc(p.short || p.title)}</span>
            <span class="p-count"${live ? '' : ' style="color:#94a3b8"'}>${metric(p)}</span>
          </span>
          ${live ? '<i class="fas fa-chevron-right p-chevron"></i>' : '<span class="sb-soon-badge">Coming Soon</span>'}`;
        grp.appendChild(toggle);
        if (live) {
          const list = document.createElement('div');
          list.className = 'part-chapters';
          p.chapters.forEach((c) => {
            const a = document.createElement('a');
            a.className = 'ch-link';
            a.style.cssText = colorVars(p);
            a.dataset.chnum = c.num;
            a.href = c.href ? c.href : `#ch${c.num}`;
            a.innerHTML = `<span class="ch-num">${c.num}</span><span style="flex:1;min-width:0">${esc(c.title)}${c.href ? ' <i class="fas fa-arrow-up-right-from-square" style="font-size:.6rem;opacity:.5"></i>' : ''}</span>`;
            list.appendChild(a);
          });
          toggle.addEventListener('click', () => toggle.classList.toggle('open'));
          grp.appendChild(list);
        }
        sbNav.appendChild(grp);
      });
    }

    // ── Home (study map) ───────────────────────────────────────────────────
    function showHome() {
      tbarCh.textContent = '';
      document.title = M.pageTitle || (M.title + ' | VibeTestQ');
      const H = M.home || {};
      // A book with a single part shows one card per chapter instead of one lonely card.
      const flat = PARTS.length === 1 && PARTS[0].chapters.length > 3;
      const cardParts = flat ? PARTS[0].chapters.map((c) => ({
        num: c.num, title: c.title, short: PARTS[0].short || PARTS[0].title, color: PARTS[0].color, rgb: PARTS[0].rgb,
        icon: PARTS[0].icon, desc: c.desc || '', chapters: [c], _flat: true,
      })) : PARTS;
      const cards = cardParts.map((p) => {
        const live = p.live !== false;
        const first = live && p.chapters[0];
        const target = first ? (first.href || '') : '';
        const pc = live ? p.color : '#94a3b8';
        const rgb = live ? p.rgb : '148,163,184';
        if (p.listLinks) {
          // library-style card: lists every destination directly instead of opening the first one
          return `
        <div class="ph-card ph-card-links" style="--pc:${pc};--pc-rgb:${rgb}">
          <div class="ph-card-top"></div>
          <div class="ph-card-body">
            <div class="ph-card-head">
              <div class="ph-card-sticker" style="--pc:${pc};--pc-rgb:${rgb}"><span class="ph-sticker-label">${esc((M.badgeLetter || 'P') + p.num)}</span><i class="${p.icon}"></i></div>
              <div class="ph-card-head-right"><div class="ph-title">${esc(p.title)}</div></div>
            </div>
            <div class="ph-desc">${p.desc || ''}</div>
            <ul class="ph-links">${p.chapters.map((c) => `<li><a href="${esc(c.href)}">${esc(c.title)} <i class="fas fa-arrow-right"></i></a></li>`).join('')}</ul>
          </div>
        </div>`;
        }
        return `
        <div class="ph-card${live ? '' : ' ph-card-soon'}" style="--pc:${pc};--pc-rgb:${rgb}" data-first="${first ? first.num : ''}" data-href="${esc(target)}">
          <div class="ph-card-top"${live ? '' : ' style="background:#e2e8f0"'}></div>
          <div class="ph-card-body">
            <div class="ph-card-head">
              <div class="ph-card-sticker" style="--pc:${pc};--pc-rgb:${rgb}">
                <span class="ph-sticker-label">${esc((M.badgeLetter || 'P') + p.num)}</span>
                <i class="${p.icon}"></i>
              </div>
              <div class="ph-card-head-right">
                <div class="ph-title"${live ? '' : ' style="color:#94a3b8"'}>${esc(p.title)}</div>
                <div class="ph-chip-row"><span class="ph-icon-tag"${live ? '' : ' style="color:#94a3b8;background:rgba(148,163,184,.08)"'}><i class="${p.icon}"></i> ${esc(p.short || p.title)}</span></div>
              </div>
            </div>
            <div class="ph-desc"${live ? '' : ' style="color:#cbd5e1"'}>${p.desc || ''}</div>
            <div class="ph-foot">
              <span class="ph-meta"><i class="fas fa-book-open"></i> ${p._flat ? 'Chapter ' + p.num : metricShort(p)}</span>
              ${live ? '<span class="ph-go">Open <i class="fas fa-arrow-right"></i></span>' : '<span class="ph-soon-badge"><i class="fas fa-clock"></i> Coming Soon</span>'}
            </div>
          </div>
        </div>`;
      }).join('');

      mainEl.innerHTML = `
        <div class="home-wrap fade-in">
          <div class="home-hero">
            <div class="home-hero-inner">
              <div class="home-hero-left">
                <div class="home-eyebrow"><i class="${H.eyebrowIcon || 'fas fa-pencil-alt'}"></i> ${esc(H.eyebrow || M.title)}</div>
                <h1>${H.title || esc(M.title)}</h1>
                ${H.sub ? `<p class="home-sub">${H.sub}</p>` : ''}
                ${H.note ? `<div class="home-note">${H.note}</div>` : ''}
              </div>
              <div class="home-hero-right">${(H.stats || []).map((s) => `<div class="home-stat-pill"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div>
            </div>
          </div>
          <div class="home-section-label"><i class="${H.labelIcon || 'fas fa-layer-group'}"></i> ${esc(H.label || 'Study map')}</div>
          <div class="parts-home-grid">${cards}</div>
        </div>`;

      mainEl.querySelectorAll('.ph-card:not(.ph-card-soon):not(.ph-card-links)').forEach((card) => {
        card.addEventListener('click', () => {
          if (card.dataset.href) location.href = card.dataset.href;
          else location.hash = '#ch' + card.dataset.first;
        });
      });
      document.querySelectorAll('.ch-link.active').forEach((l) => l.classList.remove('active'));
    }

    // ── Chapter content ────────────────────────────────────────────────────
    const dirOf = (u) => u.replace(/[^/]*$/, '');
    function chapterUrl(entry) {
      if (entry.src) return entry.src;
      const pat = (M.content && M.content.pattern) || '';
      return fill(pat, { part: entry.part.slug, chapter: entry.slug });
    }

    async function renderMarkdown(md, url) {
      await lib('marked', 'https://cdn.jsdelivr.net/npm/marked/marked.min.js');
      const base = dirOf(url);
      const html = marked.parse(md, { gfm: true, breaks: true });
      const tmp = document.createElement('div');
      tmp.className = 'md-article';
      tmp.innerHTML = html;
      // relative images -> resolve against the markdown file
      tmp.querySelectorAll('img').forEach((img) => {
        const s = img.getAttribute('src') || '';
        if (s && !/^(https?:|data:|\/)/.test(s)) img.src = base + s;
      });
      // links to sibling markdown chapters -> in-app hash links
      tmp.querySelectorAll('a[href]').forEach((a) => {
        const h = a.getAttribute('href');
        if (/^https?:/.test(h)) { a.target = '_blank'; a.rel = 'noopener'; return; }
        const m = h.match(/([^/]+)\.md(#.*)?$/);
        if (m) {
          const hit = ALL.find((c) => (c.src || '').split('/').pop().replace(/\.md$/, '') === m[1]);
          if (hit) a.setAttribute('href', '#ch' + hit.num);
        }
      });
      // code blocks -> same markup the fragment chapters use
      tmp.querySelectorAll('pre > code').forEach((code) => {
        const pre = code.parentElement;
        pre.classList.add('code-block');
        if (/language-mermaid/.test(code.className)) {
          const d = document.createElement('div');
          d.className = 'mermaid';
          d.textContent = code.textContent;
          pre.replaceWith(d);
        }
      });
      tmp.querySelectorAll('table').forEach((t) => {
        const w = document.createElement('div'); w.className = 'table-wrap';
        t.parentNode.insertBefore(w, t); w.appendChild(t); t.classList.add('q-table');
      });
      return tmp.outerHTML;
    }

    async function loadChapter(num) {
      const entry = byNum.get(String(num));
      if (!entry) { showHome(); return; }
      const p = entry.part;
      const url = chapterUrl(entry);
      mainEl.innerHTML = `<div class="reader-wrap" style="color:var(--text-dim);padding-top:3rem;text-align:center"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:var(--cyan)"></i><p style="margin-top:.75rem;font-size:.85rem">Loading ${esc(entry.title)}…</p></div>`;

      let html;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        html = (entry.type || (M.content && M.content.type)) === 'md' || /\.md$/.test(url) ? await renderMarkdown(text, url) : text;
      } catch (e) {
        mainEl.innerHTML = `<div class="reader-wrap"><p style="color:#f87171;font-size:.9rem"><i class="fas fa-exclamation-triangle"></i> Could not load “${esc(entry.title)}”.</p></div>`;
        return;
      }

      const vars = { num: entry.num, title: entry.title };
      document.title = fill(M.chapterTitle || '{title} | ' + M.title + ' | VibeTestQ', vars);
      tbarCh.textContent = fill(M.topbarChapter || '{title}', vars);

      const idx = ALL.findIndex((c) => String(c.num) === String(num));
      const prev = idx > 0 ? ALL[idx - 1] : null;
      const next = idx < ALL.length - 1 ? ALL[idx + 1] : null;
      const nav = (c, dir) => c ? `
        <a class="nav-btn ${dir}" href="${c.href ? c.href : '#ch' + c.num}">
          ${dir === 'prev' ? '<span class="nav-arrow"><i class="fas fa-chevron-left"></i></span>' : ''}
          <span class="nav-info"><span class="nav-label">${dir === 'prev' ? 'Previous' : 'Next'}</span><span class="nav-title">${esc(c.title)}</span></span>
          ${dir === 'next' ? '<span class="nav-arrow"><i class="fas fa-chevron-right"></i></span>' : ''}
        </a>` : '';

      mainEl.innerHTML = `
        <div class="reader-wrap fade-in" style="${colorVars(p)}">
          <span class="ch-part-badge" style="${colorVars(p)}"><i class="${p.icon}"></i> ${esc(label(p))} — ${esc(p.short || p.title)}</span>
          <div class="ch-content">${html}</div>
          <div class="chapter-nav">${nav(prev, 'prev')}${nav(next, 'next')}</div>
        </div>`;

      if (window.hljs) mainEl.querySelectorAll('pre.code-block code').forEach((el) => window.hljs.highlightElement(el));
      mainEl.querySelectorAll('pre.code-block').forEach((pre) => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(pre.querySelector('code').innerText).then(() => {
            btn.className = 'copy-btn copied'; btn.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => { btn.className = 'copy-btn'; btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
          });
        });
        pre.appendChild(btn);
      });

      const mm = mainEl.querySelectorAll('.mermaid');
      if (mm.length) {
        lib('mermaid', 'https://cdn.jsdelivr.net/npm/mermaid@10.9.3/dist/mermaid.min.js').then(() => {
          window.mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
          window.mermaid.run({ nodes: mm });
        });
      }

      contentCol.scrollTo({ top: 0, behavior: 'smooth' });

      const sn = mainEl.querySelector('.sn-chapter');
      if (sn) {
        mainEl.querySelector('.reader-wrap')?.classList.add('sn-reader');
        const rev = mainEl.querySelectorAll('.sn-reveal');
        if (rev.length && 'IntersectionObserver' in window) {
          const obs = new IntersectionObserver((es) => es.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('sn-vis'); obs.unobserve(e.target); }
          }), { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
          rev.forEach((el) => obs.observe(el));
        }
      }

      document.querySelectorAll('.ch-link.active').forEach((l) => l.classList.remove('active'));
      const link = document.querySelector(`.ch-link[data-chnum="${CSS.escape(String(num))}"]`);
      if (link) {
        link.classList.add('active');
        const tg = link.closest('.part-group')?.querySelector('.part-toggle');
        if (tg && !tg.classList.contains('open')) tg.classList.add('open');
        setTimeout(() => link.scrollIntoView({ block: 'nearest' }), 150);
      }
    }

    // ── Behaviour ──────────────────────────────────────────────────────────
    contentCol.addEventListener('scroll', () => {
      const h = contentCol.scrollHeight - contentCol.clientHeight;
      progFill.style.width = (h > 0 ? (contentCol.scrollTop / h) * 100 : 0) + '%';
    });
    const openSb = () => { sidebar.classList.add('open'); overlay.classList.add('show'); };
    const closeSb = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
    document.getElementById('sb-toggle').addEventListener('click', () => {
      if (window.innerWidth <= 768) (sidebar.classList.contains('open') ? closeSb : openSb)();
      else sidebar.classList.toggle('collapsed');
    });
    overlay.addEventListener('click', closeSb);

    function route() {
      const m = location.hash.match(/^#ch(.+)$/);
      if (m) { loadChapter(decodeURIComponent(m[1])); if (window.innerWidth <= 768) closeSb(); }
      else showHome();
    }
    window.addEventListener('hashchange', route);

    buildSidebar();
    document.querySelector('.part-toggle')?.classList.add('open');
    route();
  }
})();
