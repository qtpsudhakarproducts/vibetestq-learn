/**
 * sketchnote-convert.js  v2
 * Converts every chapter .md → rich sketchnote Q&A HTML fragment.
 * Run: node sketchnote-convert.js
 *
 * SKIPS files listed in HANDCRAFTED (those have manual rich designs).
 * For every other chapter it produces:
 *   - sn-q-card per question with colour-coded header
 *   - First paragraph → sn-box (Key Point) in the card accent colour
 *   - **bold** text → coloured keyword spans
 *   - Bullet lists → sn-list with smart rotating / detected emoji icons
 *   - Code blocks → sn-terminal with syntax highlighting
 *   - Tables → sn-table-scroll with scrollable sn-table
 *   - Blockquotes → sn-callout
 *   - Chapter summary cloud at the bottom
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Files with hand-crafted HTML — DO NOT overwrite ─────────────────────────
const HANDCRAFTED = new Set([
  'chapter-101-javascript-for-automation-introduction-history.html',
]);

// ─── Accent-colour cycle ──────────────────────────────────────────────────────
const COLOURS = [
  { name: 'blue', hex: '#3b82f6', bg: 'rgba(59,130,246,.07)' },
  { name: 'green', hex: '#22c55e', bg: 'rgba(34,197,94,.07)' },
  { name: 'purple', hex: '#a855f7', bg: 'rgba(168,85,247,.07)' },
  { name: 'orange', hex: '#f97316', bg: 'rgba(249,115,22,.07)' },
  { name: 'teal', hex: '#14b8a6', bg: 'rgba(20,184,166,.07)' },
  { name: 'pink', hex: '#ec4899', bg: 'rgba(236,72,153,.07)' },
  { name: 'red', hex: '#ef4444', bg: 'rgba(239,68,68,.07)' },
  { name: 'yellow', hex: '#eab308', bg: 'rgba(234,179,8,.08)' },
];

// ─── Part metadata ────────────────────────────────────────────────────────────
const PARTS = {
  'part-1-javascript-typescript': { num: '1', label: 'JavaScript & TypeScript', icon: '⚡' },
  'part-2-playwright-core': { num: '2', label: 'Playwright Core', icon: '🎭' },
  'part-3-playwright-test-framework': { num: '3', label: 'Test Framework', icon: '🧪' },
  'part-4-execution-cli-cicd': { num: '4', label: 'Execution & CI/CD', icon: '🔄' },
  'part-5-pom-framework-design': { num: '5', label: 'POM & Framework Design', icon: '🏗️' },
  'part-6-cucumber-bdd': { num: '6', label: 'Cucumber BDD', icon: '🌐' },
  'part-7-api-testing-network-authentication': { num: '7', label: 'API & Network', icon: '👁️' },
  'part-8-visual-testing-accessibility': { num: '8', label: 'Visual & Accessibility', icon: '🎨' },
  'part-9-ai-native-automation': { num: '9', label: 'AI-Native Automation', icon: '🤖' },
};

// ─── Rotating list icons ──────────────────────────────────────────────────────
const LIST_ICONS = ['🔷', '💡', '⚡', '🎯', '📌', '🔑', '🚀', '🌟', '📦', '🔶', '🎪', '🔹'];

// ─── HTML escape ──────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Inline markdown → HTML (colour-aware) ───────────────────────────────────
function inline(text, colName) {
  // Protect inline code
  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code class="sn-ic">${esc(c)}</code>`);
    return `\x00C${codes.length - 1}\x00`;
  });

  // Bold+italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold → coloured keyword if colName provided
  if (colName) {
    text = text.replace(/\*\*(.+?)\*\*/g, `<strong class="k-${colName}">$1</strong>`);
  } else {
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Restore inline code
  text = text.replace(/\x00C(\d+)\x00/g, (_, i) => codes[parseInt(i)]);
  return text;
}

// ─── Syntax highlight code blocks ────────────────────────────────────────────
function hlCode(code, lang) {
  const l = (lang || '').toLowerCase();
  if (l === 'bash' || l === 'shell' || l === '') {
    return code
      .replace(/^(#.*)$/gm, '<span class="tc-cm">$1</span>')
      .replace(/^(\$.+)$/gm, '<span class="tc-var">$1</span>');
  }
  if (l === 'json') {
    return code
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="tc-str">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="tc-str">$1</span>');
  }
  // js/ts/java/python/csharp/html/yaml
  const slots = [];
  function protect(rx, cls) {
    code = code.replace(rx, m => {
      slots.push(`<span class="${cls}">${esc(m)}</span>`);
      return `\x00S${slots.length - 1}\x00`;
    });
  }
  // Comments and strings first
  protect(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, 'tc-cm');
  protect(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, 'tc-str');
  // Keywords
  code = code.replace(
    /\b(await|async|const|let|var|function|return|import|export|from|class|new|if|else|for|while|do|switch|case|break|continue|throw|try|catch|finally|true|false|null|undefined|this|typeof|instanceof|of|in|extends|implements|interface|type|enum|public|private|protected|static|override|readonly|void|boolean|string|number|any|unknown|never|default|module|require|describe|test|it|expect|beforeAll|afterAll|beforeEach|afterEach)\b/g,
    '<span class="tc-kw">$&</span>'
  );
  // Function calls
  code = code.replace(/\b([a-z][a-zA-Z0-9]*)(?=\s*\()/g, '<span class="tc-fn">$1</span>');
  // Numbers
  code = code.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tc-num">$1</span>');
  // Restore protected slots
  code = code.replace(/\x00S(\d+)\x00/g, (_, i) => slots[parseInt(i)]);
  return code;
}

// ─── Build scrollable table ───────────────────────────────────────────────────
function buildTable(rows) {
  const valid = rows.filter(r => r.trim() && !r.match(/^\|[-:\s|]+\|$/));
  if (!valid.length) return '';
  const [hdr, ...body] = valid;
  const cells = r => r.split('|')
    .filter((_, i, a) => i !== 0 && i !== a.length - 1)
    .map(c => c.trim());

  const ths = cells(hdr).map((c, i) => {
    const thCols = ['sn-th-blue', 'sn-th-green', 'sn-th-purple', 'sn-th-orange'];
    const cls = i > 0 ? ` class="${thCols[(i - 1) % thCols.length]}"` : '';
    return `<th${cls}>${inline(c)}</th>`;
  }).join('');

  const trs = body.map(r => {
    const tds = cells(r).map(c => {
      const t = inline(c);
      const cls = /^✅/.test(c) ? ' class="yes"' : /^✗|^❌/.test(c) ? ' class="no"' : '';
      return `<td${cls}>${t}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('\n          ');

  return `
      <div class="sn-table-scroll">
        <table class="sn-table">
          <thead><tr>${ths}</tr></thead>
          <tbody>
          ${trs}
          </tbody>
        </table>
      </div>`;
}

// ─── Detect smart icon for a list item ───────────────────────────────────────
function listIcon(text, idx) {
  if (/^✅/.test(text) || /\bcan\b|\benables?\b|\bworks?\b/i.test(text)) return '<span class="icon" style="color:var(--sn-green)">✅</span>';
  if (/^✗|^❌|cannot|no longer|not/i.test(text)) return '<span class="icon" style="color:var(--sn-red)">✗</span>';
  if (/\bwarning|caution|avoid|danger/i.test(text)) return '<span class="icon" style="color:var(--sn-orange)">⚠️</span>';
  if (/\btip|recommend|prefer|best\b/i.test(text)) return '<span class="icon" style="color:var(--sn-blue)">💡</span>';
  return `<span class="icon">${LIST_ICONS[idx % LIST_ICONS.length]}</span>`;
}

// ─── Convert answer body lines → rich HTML ────────────────────────────────────
function convertAnswer(lines, colName) {
  const out = [];
  let inUl = false, inOl = false, inTable = false, tableRows = [];
  let listIconIdx = 0;
  let firstBoxDone = false;   // first text paragraph → sn-box Key Point
  let paraLines = [];

  // Extract fenced code blocks
  const codeBlocks = [];
  const rawBody = lines.join('\n');
  const stripped = rawBody.replace(/```(\w*)\n([\s\S]*?)```/gm, (_, lang, code) => {
    const hl = hlCode(esc(code.trimEnd()), lang.toLowerCase());
    codeBlocks.push({ lang: lang || 'code', hl });
    return `\x00CB${codeBlocks.length - 1}\x00`;
  });
  const processLines = stripped.split('\n');

  function flushPara() {
    if (!paraLines.length) return;
    const combined = paraLines.join(' ');
    if (!firstBoxDone) {
      firstBoxDone = true;
      out.push(`
      <div class="sn-box b-${colName}" style="margin-top:.25rem">
        <span class="sn-box-label c-${colName}">Key Point</span>
        <p class="sn-para" style="margin-top:.45rem">${combined}</p>
      </div>`);
    } else {
      out.push(`<p class="sn-para">${combined}</p>`);
    }
    paraLines = [];
  }

  function flushTable() {
    if (inTable) { out.push(buildTable(tableRows)); tableRows = []; inTable = false; }
  }

  function closeAll() {
    flushPara();
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
    flushTable();
  }

  for (const line of processLines) {
    // Code-block placeholder
    const cbm = line.match(/^\x00CB(\d+)\x00$/);
    if (cbm) {
      closeAll();
      firstBoxDone = true; // treat code blocks as "content seen"
      const cb = codeBlocks[parseInt(cbm[1])];
      const label = cb.lang && cb.lang !== 'code' ? cb.lang : 'code';
      out.push(`
      <div class="sn-terminal">
        <div class="sn-terminal-bar">
          <div class="sn-tbar-dot" style="background:#ff5f57"></div>
          <div class="sn-tbar-dot" style="background:#febc2e"></div>
          <div class="sn-tbar-dot" style="background:#28c840"></div>
          <span class="sn-terminal-label">${esc(label)}</span>
        </div>
        <div class="sn-terminal-code">${cb.hl}</div>
      </div>`);
      continue;
    }

    // If we are in a table and the line does not start with '|', flush the table first
    if (inTable && !line.startsWith('|')) {
      flushTable();
    }

    // Table
    if (line.startsWith('|')) {
      if (!inTable) {
        flushPara();
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (inOl) { out.push('</ol>'); inOl = false; }
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
      firstBoxDone = true;
      continue;
    }

    // Blockquote / tip
    if (line.match(/^>\s*/)) {
      closeAll();
      firstBoxDone = true;
      const bq = inline(line.replace(/^>\s*/, ''), colName);
      const isInterview = /interview|tip|note|remember/i.test(bq);
      const cls = isInterview ? 'c-purple' : `c-${colName}`;
      const icon = isInterview ? '💡' : '📝';
      out.push(`<div class="sn-callout ${cls}"><span class="sn-callout-icon">${icon}</span><span class="sn-callout-text">${bq}</span></div>`);
      continue;
    }

    // HR → skip inside answers
    if (/^-{3,}$/.test(line.trim())) continue;

    // h3 sub-heading
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      closeAll();
      firstBoxDone = true;
      out.push(`<h3 class="sn-sub-hd" style="border-left-color:var(--sn-${colName})">${inline(h3[1], colName)}</h3>`);
      continue;
    }

    // h4
    const h4 = line.match(/^#### (.+)/);
    if (h4) {
      closeAll();
      out.push(`<h4 class="sn-subsub-hd">${inline(h4[1], colName)}</h4>`);
      continue;
    }

    // Bullet list
    const ulm = line.match(/^[*\-] (.+)/);
    if (ulm) {
      flushPara();
      firstBoxDone = true;
      if (!inUl) {
        if (inOl) { out.push('</ol>'); inOl = false; }
        out.push('<ul class="sn-list">');
        inUl = true;
      }
      const txt = inline(ulm[1], colName);
      const ico = listIcon(ulm[1], listIconIdx++);
      out.push(`<li>${ico}<span>${txt}</span></li>`);
      continue;
    } else if (inUl && line.trim() === '') {
      out.push('</ul>'); inUl = false;
    }

    // Ordered list
    const olm = line.match(/^(\d+)\. (.+)/);
    if (olm) {
      flushPara();
      firstBoxDone = true;
      if (!inOl) {
        if (inUl) { out.push('</ul>'); inUl = false; }
        out.push('<ol class="sn-olist">');
        inOl = true;
      }
      out.push(`<li>${inline(olm[2], colName)}</li>`);
      continue;
    } else if (inOl && line.trim() === '') {
      out.push('</ol>'); inOl = false;
    }

    // Empty line
    if (line.trim() === '') { closeAll(); continue; }

    // Paragraph text
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
    paraLines.push(inline(line, colName));
  }

  closeAll();
  return out.join('\n');
}

// ─── Extract summary bullets from the MD file ───────────────────────────────
function extractSummary(md) {
  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const idx = md.indexOf('## Chapter Summary');
  if (idx === -1) return [];

  const summaryPart = md.slice(idx);
  const lines = summaryPart.split('\n');
  const bullets = [];
  let curBullet = '';

  for (const line of lines) {
    if (line.startsWith('#') && !line.startsWith('## Chapter Summary')) {
      break;
    }
    const m = line.trim().match(/^[*\-]\s+(.+)/);
    if (m) {
      if (curBullet) bullets.push(curBullet);
      curBullet = m[1];
    } else if (curBullet && line.trim() && !line.startsWith('##') && !line.startsWith('---')) {
      curBullet += ' ' + line.trim();
    }
  }
  if (curBullet) bullets.push(curBullet);
  return bullets;
}

// ─── Extract part summary if this is the last chapter ───────────────────────
function extractPartSummary(md) {
  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const match = md.match(/\n# (Part \d+\s*[—\-–]+\s*.*Summary[\s\S]*)$/m);
  if (!match) return null;

  const content = match[1];
  const lines = content.split('\n');
  const partTitle = lines[0].trim();
  const bodyLines = lines.slice(1);

  const out = [];
  let currentGroup = [];

  for (const line of bodyLines) {
    if (line.trim().startsWith('---')) continue;
    if (line.trim().startsWith('##')) continue;

    if (line.trim() === '') {
      if (currentGroup.length) {
        out.push(`<p class="sn-para" style="margin-bottom:.75rem">${inline(currentGroup.join(' '))}</p>`);
        currentGroup = [];
      }
    } else {
      currentGroup.push(line.trim());
    }
  }
  if (currentGroup.length) {
    out.push(`<p class="sn-para" style="margin-bottom:.75rem">${inline(currentGroup.join(' '))}</p>`);
  }

  return {
    title: partTitle,
    html: out.join('\n')
  };
}

// ─── Parse markdown → chapter structure ──────────────────────────────────────
function parseMd(md) {
  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  md = md.replace(/\n## Chapter Summary[\s\S]*$/m, '');
  md = md.replace(/\n## Additional Links[\s\S]*$/m, '');

  const lines = md.split('\n');
  let title = '', intro = [], qs = [], cur = null;

  for (const line of lines) {
    const h1 = line.match(/^# (.+)/);
    if (h1) { title = h1[1].trim(); continue; }

    const qm = line.match(/^## (Q[\d.]+)\s*[—\-–]+\s*(.*)/);
    if (qm) {
      if (cur) qs.push(cur);
      cur = { qnum: qm[1], qtitle: qm[2].trim(), lines: [] };
      continue;
    }

    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (cur) { cur.lines.push(''); cur.lines.push(`### ${h2[1]}`); }
      continue;
    }

    if (/^---+$/.test(line.trim())) continue;

    if (cur) cur.lines.push(line);
    else if (line.trim()) intro.push(line.trim());
  }
  if (cur) qs.push(cur);
  return { title, intro: intro.join(' '), qs };
}

// ─── Build chapter summary cloud from parsed bullets ─────────────────────────
function buildCloud(bullets) {
  if (!bullets || !bullets.length) return '';
  const items = bullets.map(b => {
    return `<li><span class="icon">⭐</span><span>${inline(b)}</span></li>`;
  });
  const mid = Math.ceil(items.length / 2);
  const col1 = items.slice(0, mid).join('\n            ');
  const col2 = items.slice(mid).join('\n            ');
  return `
    <div class="sn-remember sn-reveal">
      <div class="sn-remember-hd"><span>📌</span><span>Chapter Summary</span></div>
      <div class="sn-cloud">
        <div class="sn-grid-2" style="text-align:left;gap:.5rem">
          <ul class="sn-list">
            ${col1}
          </ul>
          <ul class="sn-list">
            ${col2}
          </ul>
        </div>
      </div>
    </div>`;
}

// ─── Colorise chapter title words ────────────────────────────────────────────
function colorTitle(title) {
  const clean = title.replace(/^Chapter\s+\d+\s*[—\-–]+\s*/i, '');
  return clean.split(/\s+/)
    .map((w, i) => `<span class="w${(i % 8) + 1}">${esc(w)}</span>`)
    .join(' ');
}

function chNum(filename) {
  const m = filename.match(/chapter-(\d+)/);
  return m ? m[1] : '';
}

// ─── Build part summary container ───────────────────────────────────────────
function buildPartSummary(partSummary) {
  if (!partSummary) return '';
  return `
  <!-- PART SUMMARY -->
  <div class="sn-remember sn-reveal" style="margin-top:2.5rem">
    <div class="sn-remember-hd" style="color:var(--sn-pink)"><span>🏆</span><span>${esc(partSummary.title)}</span></div>
    <div class="sn-cloud" style="border-color:var(--sn-pink);background:linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)">
      <div style="text-align:left">
        ${partSummary.html}
      </div>
    </div>
  </div>`;
}

// ─── Build full HTML fragment ─────────────────────────────────────────────────
function buildHtml(mdPath) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const bullets = extractSummary(md);
  const partSummary = extractPartSummary(md);
  const { title, intro, qs } = parseMd(md);

  const partDir = path.basename(path.dirname(mdPath));
  const partInfo = PARTS[partDir] || { num: '?', label: '', icon: '📖' };
  const ch = chNum(path.basename(mdPath));

  const cards = qs.map((q, idx) => {
    const col = COLOURS[idx % COLOURS.length];
    const body = convertAnswer(q.lines, col.name);
    return `
  <!-- ${esc(q.qnum)} -->
  <div class="sn-q-card sn-reveal" style="--qc:${col.hex};--qc-bg:${col.bg}">
    <div class="sn-q-head">
      <span class="sn-q-badge">${esc(q.qnum)}</span>
      <h2 class="sn-q-text">${inline(q.qtitle)}</h2>
    </div>
    <div class="sn-a-zone">
      ${body.trim()}
    </div>
  </div>`;
  }).join('\n');

  return `<div class="sn-chapter">
<div class="sn-page">
  <div class="sn-margin-line"></div>

  <div class="sn-stars" aria-hidden="true">
    <span class="sn-star" style="top:2%;right:5%;animation-delay:.4s">⭐</span>
    <span class="sn-star" style="top:6%;right:13%;animation-delay:.9s;font-size:.7rem">✦</span>
    <span class="sn-star" style="top:1%;right:22%;animation-delay:.6s;font-size:.65rem">★</span>
    <span class="sn-star" style="top:11%;right:4%;animation-delay:1.4s;font-size:.7rem">💫</span>
  </div>

  <div class="sn-title-block">
    <div class="sn-eyebrow">${esc(partInfo.icon)} Part ${esc(partInfo.num)} &nbsp;·&nbsp; Chapter ${esc(ch)} &nbsp;·&nbsp; ${qs.length} Questions</div>
    <h1 class="sn-big-title">${colorTitle(title)}</h1>
    <p class="sn-title-sub">${esc(partInfo.label)} — Interview Q&amp;A</p>
    <div class="sn-title-deco"></div>
  </div>

${intro ? `  <div class="sn-callout c-blue sn-reveal" style="margin-bottom:1.5rem">
    <span class="sn-callout-icon">📖</span>
    <span class="sn-callout-text">${inline(intro)}</span>
  </div>` : ''}

${cards}

${buildCloud(bullets)}

${buildPartSummary(partSummary)}

</div>
</div>
`;
}

// ─── Walk all .md files ───────────────────────────────────────────────────────
const BASE = path.join(__dirname, 'playwright');
const SKIP_MD = new Set(['chapter-list.md', 'question-bank-all-chapters.md']);

function walk(dir) {
  const files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.name.endsWith('.md') && !SKIP_MD.has(e.name)) files.push(full);
  }
  return files;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const mdFiles = walk(BASE);
let ok = 0, skipped = 0, errors = 0;

for (const mdPath of mdFiles) {
  const htmlPath = mdPath.replace(/\.md$/, '.html');
  const htmlName = path.basename(htmlPath);

  if (HANDCRAFTED.has(htmlName)) {
    console.log(`⏭  skipped (hand-crafted): ${path.relative(__dirname, htmlPath)}`);
    skipped++;
    continue;
  }

  try {
    const html = buildHtml(mdPath);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✓  ${path.relative(__dirname, htmlPath)}`);
    ok++;
  } catch (e) {
    console.error(`✗  ${path.relative(__dirname, mdPath)}: ${e.message}`);
    errors++;
  }
}

console.log(`\n✅  Converted ${ok}  ⏭  Skipped ${skipped}  ✗  Errors ${errors}`);
