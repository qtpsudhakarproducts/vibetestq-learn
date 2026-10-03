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

  Promise.all([fetch(manifestUrl).then((r) => r.json()), lib('bar', '/assets/academy/bar.js'), lib('progress', '/assets/academy/progress.js')]).then((x) => start(x[0])).catch((e) => {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif;color:#b91c1c">Could not load this section (' + esc(e.message) + ').</p>';
  });

  function start(M) {
    const PARTS = M.parts;
    const ALL = [];
    PARTS.filter((p) => p.live !== false).forEach((p) => p.chapters.forEach((c) => ALL.push(Object.assign({}, c, { part: p }))));
    const byNum = new Map(ALL.map((c) => [String(c.num), c]));

    // ── Shell ──────────────────────────────────────────────────────────────
    document.body.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
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
          <main id="main" tabindex="-1"></main>
        </div>
      </div>`;

    // one top navigation for the whole Academy (also handles Sign out)
    window.AcademyBar.mount({ sidebarToggle: true });

    const footerHtml = '<footer class="acad-foot"><span>&copy; 2026 VibeTestQ. All rights reserved.</span>' +
      '<span class="acad-foot-links"><a href="/learn/">Learning Library</a><a href="https://vibetestq.com" target="_blank" rel="noopener">vibetestq.com</a><a href="mailto:trainings@vibetestq.com">trainings@vibetestq.com</a></span></footer>';
    const sbNav = document.getElementById('sb-nav');
    const mainEl = document.getElementById('main');
    const progFill = document.getElementById('prog-fill');
    const tbarCh = { textContent: '' }; // chapter title now lives in the page, not the bar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sb-overlay');
    const contentCol = document.getElementById('content-col');
    const colorVars = (p) => `--pc:${p.color};--pc-rgb:${p.rgb}`;
    const label = (p) => (M.partLabel || 'Part') + ' ' + p.num;
    // chapterWord lets a manifest name its units ("steps", "lessons") instead of "chapters"
    const word = (n) => (M.chapterWord ? (n === 1 ? M.chapterWord.replace(/s$/, '') : M.chapterWord) : (n === 1 ? 'chapter' : 'chapters'));
    const metric = (p) => `${p.chapters.length} ${word(p.chapters.length)}${p.metric ? ' · ' + p.metric : ''}`;
    const metricShort = (p) => `${p.chapters.length} ${M.chapterWord ? word(p.chapters.length) : 'ch'}${p.metric ? ' · ' + p.metric : ''}`;

    // ── Reading progress (kept in this browser; see progress.js) ───────────
    const P = window.AcademyProgress;
    const SID = M.id;
    const readable = (p) => p.chapters.filter((c) => !c.href);
    const doneIn = (p) => readable(p).filter((c) => P.isDone(SID, c.num)).length;
    const READ_ALL = ALL.filter((c) => !c.href);
    const doneAll = () => READ_ALL.filter((c) => P.isDone(SID, c.num)).length;
    const pctOf = (d, n) => (n ? Math.round((100 * d) / n) : 0);
    function resumeTarget() {
      const last = P.get(SID).last;
      const lastEntry = last && byNum.get(String(last.num));
      if (lastEntry && !lastEntry.href) {
        // go back to where they were; if that chapter is finished, go to the next unfinished one
        if (!P.isDone(SID, last.num)) return lastEntry;
        const i = READ_ALL.findIndex((c) => String(c.num) === String(last.num));
        const nxt = READ_ALL.slice(i + 1).concat(READ_ALL.slice(0, i)).find((c) => !P.isDone(SID, c.num));
        if (nxt) return nxt;
      }
      return READ_ALL.find((c) => !P.isDone(SID, c.num)) || READ_ALL[0] || ALL[0];
    }
    const progressMeta = (p) => {
      if (p._flat) return P.isDone(SID, p.chapters[0].num) ? 'Completed' : 'Chapter ' + p.num;
      const d = doneIn(p), n = readable(p).length;
      return metricShort(p) + (d ? ' · ' + d + '/' + n + ' done' : '');
    };
    const progressBar = (p) => {
      if (p._flat) return '';
      const d = doneIn(p), n = readable(p).length;
      return d ? '<div class="ph-prog" role="img" aria-label="' + d + ' of ' + n + ' completed"><i style="width:' + pctOf(d, n) + '%"></i></div>' : '';
    };
    function resumeBlock() {
      if (!READ_ALL.length) return '';
      const d = doneAll(), n = READ_ALL.length, seen = Object.keys(P.get(SID).seen).length;
      const t = resumeTarget();
      const verb = d >= n ? 'Review' : (seen || d ? 'Continue' : 'Start');
      return '<div class="home-resume"><div class="hr-top"><b>' + d + ' / ' + n + '</b> ' + esc(word(n)) + ' completed</div>' +
        '<div class="hr-bar"><i style="width:' + pctOf(d, n) + '%"></i></div>' +
        '<a class="hr-btn" href="#ch' + t.num + '"><i class="fas fa-play" aria-hidden="true"></i> ' + verb + ' · ' + esc(t.title) + '</a></div>';
    }
    function dashboardHtml() {
      const recent = P.all().filter((r) => r.id !== SID).slice(0, 3);
      const pr = P.practice(), qz = P.quizzes();
      const card = (r) => {
        const d = Object.keys(r.done).length, n = r.total || 0;
        return '<a class="dash-card" href="' + esc(r.href) + '#ch' + esc(r.last.num) + '"><span class="dc-sec">' + esc(r.title) + '</span>' +
          '<span class="dc-ch">' + esc(r.last.title) + '</span>' +
          '<span class="dc-bar"><i style="width:' + pctOf(d, n) + '%"></i></span>' +
          '<span class="dc-meta">' + d + ' / ' + n + ' completed</span><span class="dc-go">Resume <i class="fas fa-arrow-right" aria-hidden="true"></i></span></a>';
      };
      const main = recent.length
        ? '<h2>Continue learning</h2><div class="dash-cards">' + recent.map(card).join('') + '</div>'
        : '<h2>Start here</h2><div class="dash-cards"><a class="dash-card" href="/playwright/"><span class="dc-sec">Playwright Mastery</span><span class="dc-ch">The full curriculum, module by module</span><span class="dc-meta">10 modules</span><span class="dc-go">Open curriculum <i class="fas fa-arrow-right" aria-hidden="true"></i></span></a></div>';
      return '<section class="dash" aria-label="Your learning">' +
        '<div class="dash-main">' + main + '</div>' +
        '<div class="dash-side"><h2>Your activity</h2>' +
        '<a class="dash-stat" href="/practicehub/"><b>' + pr.solved + ' / ' + pr.total + '</b><span>practice challenges solved</span><em class="ds-track"><i style="width:' + pctOf(pr.solved, pr.total) + '%"></i></em></a>' +
        '<a class="dash-stat" href="/playwright/assessments/"><b>' + qz.taken + ' / ' + qz.total + '</b><span>quizzes taken' + (qz.avg != null ? ' · ' + qz.avg + '% average' : '') + '</span><em class="ds-track"><i style="width:' + pctOf(qz.taken, qz.total) + '%"></i></em></a>' +
        '</div></section>';
    }
    function markDoneHtml(entry) {
      if (entry.href) return '';
      const on = P.isDone(SID, entry.num);
      return '<div class="mark-done-wrap"><button type="button" class="mark-done' + (on ? ' on' : '') + '" aria-pressed="' + on + '">' +
        '<i class="' + (on ? 'fas' : 'far') + ' fa-circle-check" aria-hidden="true"></i> <span>' + (on ? 'Completed — click to undo' : 'Mark as complete') + '</span></button></div>';
    }
    let currentNum = null, autoTried = false;

    // ── Sidebar ────────────────────────────────────────────────────────────
    function buildSidebar() {
      sbNav.innerHTML = '';
      PARTS.forEach((p) => {
        const live = p.live !== false;
        const grp = document.createElement('div');
        grp.className = 'part-group';
        grp.dataset.part = p.num;
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
            a.innerHTML = `<span class="ch-num">${c.num}</span><span style="flex:1;min-width:0">${esc(c.title)}${/^https?:/.test(c.href || '') ? ' <i class="fas fa-arrow-up-right-from-square" aria-hidden="true" style="font-size:.6rem;opacity:.5"></i>' : ''}</span>`;
            if (!c.href) a.insertAdjacentHTML('beforeend', '<span class="ch-state" aria-hidden="true"></span>');
            list.appendChild(a);
          });
          toggle.addEventListener('click', () => toggle.classList.toggle('open'));
          grp.appendChild(list);
        }
        sbNav.appendChild(grp);
      });
    }

    function refreshSidebar() {
      document.querySelectorAll('.ch-link[data-chnum]').forEach((a) => {
        const num = a.dataset.chnum;
        a.classList.toggle('done', P.isDone(SID, num));
        a.classList.toggle('seen', !P.isDone(SID, num) && !!P.get(SID).seen[num]);
      });
      PARTS.forEach((p) => {
        const el = document.querySelector('.part-group[data-part="' + p.num + '"] .p-count');
        if (!el || p.live === false) return;
        const d = doneIn(p), n = readable(p).length;
        el.textContent = metric(p) + (d ? ' · ' + d + '/' + n + ' done' : '');
      });
    }
    P.onChange(() => {
      refreshSidebar();
      const hr = document.querySelector('.home-resume');
      if (hr) hr.outerHTML = resumeBlock();
    });

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
            ${progressBar(p)}
            <div class="ph-foot">
              <span class="ph-meta"><i class="fas fa-book-open"></i> ${progressMeta(p)}</span>
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
                ${H.dashboard ? '' : resumeBlock()}
              </div>
              <div class="home-hero-right">${(H.stats || []).map((s) => `<div class="home-stat-pill"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div>
            </div>
          </div>
          ${H.dashboard ? dashboardHtml() : ''}
          <div class="home-section-label"><i class="${H.labelIcon || 'fas fa-layer-group'}"></i> ${esc(H.label || 'Study map')}</div>
          <div class="parts-home-grid">${cards}</div>
          ${footerHtml}
        </div>`;

      mainEl.querySelectorAll('.ph-card:not(.ph-card-soon):not(.ph-card-links)').forEach((card) => {
        card.addEventListener('click', () => {
          if (card.dataset.href) location.href = card.dataset.href;
          else location.hash = '#ch' + card.dataset.first;
        });
      });
      document.querySelectorAll('.ch-link.active').forEach((l) => l.classList.remove('active'));
      currentNum = null;
      refreshSidebar();
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
      // reference text reads more professionally without decorative emoji at the start of headings
      const LEAD_EMOJI = /^(?:[\s\uFE0F\u200D\u20E3]|[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}]|[0-9#*]\uFE0F?\u20E3)+/u;
      tmp.querySelectorAll('h1,h2,h3,h4').forEach((h) => {
        const t = h.firstChild;
        if (t && t.nodeType === 3) t.textContent = t.textContent.replace(LEAD_EMOJI, '');
      });
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
          <nav class="acad-crumb" aria-label="Breadcrumb"><a href="${window.location.pathname}">${esc(M.title)}</a><span aria-hidden="true">›</span><span>${esc(label(p))}</span></nav>
          <span class="ch-part-badge" style="${colorVars(p)}"><i class="${p.icon}"></i> ${esc(label(p))} — ${esc(p.short || p.title)}</span>
          <div class="ch-content">${html}</div>
          ${markDoneHtml(entry)}
          <div class="chapter-nav">${nav(prev, 'prev')}${nav(next, 'next')}</div>
          ${footerHtml}
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

      // remember where the reader is, and let them mark the chapter complete
      if (!entry.href) {
        currentNum = entry.num; autoTried = false;
        P.visit(SID, { title: M.title, href: window.location.pathname, total: READ_ALL.length }, { num: entry.num, title: entry.title });
        const btn = mainEl.querySelector('.mark-done');
        if (btn) btn.addEventListener('click', () => {
          const on = !P.isDone(SID, entry.num);
          autoTried = true; // an explicit choice wins over auto-complete
          P.setDone(SID, entry.num, on);
          btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on);
          btn.querySelector('i').className = (on ? 'fas' : 'far') + ' fa-circle-check';
          btn.querySelector('span').textContent = on ? 'Completed — click to undo' : 'Mark as complete';
        });
        // a short chapter that fits on screen counts as read after a few seconds
        setTimeout(() => {
          if (currentNum === entry.num && !autoTried && contentCol.scrollHeight - contentCol.clientHeight < 140) autoComplete(entry.num);
        }, 6000);
      }

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

      refreshSidebar();
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
    function autoComplete(num) {
      if (autoTried || currentNum !== num || P.isDone(SID, num)) return;
      autoTried = true;
      P.setDone(SID, num, true);
      const btn = mainEl.querySelector('.mark-done');
      if (btn) {
        btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true');
        btn.querySelector('i').className = 'fas fa-circle-check';
        btn.querySelector('span').textContent = 'Completed — click to undo';
      }
    }
    contentCol.addEventListener('scroll', () => {
      const h = contentCol.scrollHeight - contentCol.clientHeight;
      const pct = h > 0 ? contentCol.scrollTop / h : 0;
      progFill.style.width = pct * 100 + '%';
      if (currentNum !== null && h > 140 && pct >= 0.9) autoComplete(currentNum);
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
