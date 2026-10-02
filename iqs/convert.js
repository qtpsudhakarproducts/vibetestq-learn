/**
 * convert.js — Markdown → HTML fragment converter for the IQ SPA
 * Run: node convert.js
 * Converts all chapter .md files in playwright/ to .html fragments
 * No npm dependencies required — uses a built-in markdown parser
 */

const fs   = require('fs');
const path = require('path');

// ─── Minimal Markdown Parser ──────────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function processInline(text) {
  // Protect inline code first
  const inlineCodes = [];
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    inlineCodes.push(`<code class="ic">${escHtml(c)}</code>`);
    return `\x00IC${inlineCodes.length - 1}\x00`;
  });

  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Restore inline code
  text = text.replace(/\x00IC(\d+)\x00/g, (_, i) => inlineCodes[parseInt(i)]);
  return text;
}

function buildTable(rows) {
  const lines = rows.filter(r => r.trim() && !r.match(/^\|[-:\s|]+\|$/));
  if (!lines.length) return '';
  const [header, ...body] = lines;
  const cells = r => r.split('|').filter((_, i, a) => i !== 0 && i !== a.length - 1)
                       .map(c => c.trim());
  const ths = cells(header).map(c => `<th>${processInline(c)}</th>`).join('');
  const trs = body.map(r => {
    const tds = cells(r).map(c => `<td>${processInline(c)}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('\n');
  return `<div class="table-wrap"><table class="q-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function convertMd(md) {
  // ── 0. Normalize line endings (CRLF → LF) ────────────────────────────────
  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── 0b. Strip "Additional Links" section (SPA has sidebar navigation) ────
  md = md.replace(/\n##\s*Additional Links[\s\S]*$/m, '');

  // ── 1. Extract & protect fenced code blocks ──────────────────────────────
  const blocks = [];
  md = md.replace(/```(\w*)\n([\s\S]*?)```/gm, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : '';
    blocks.push(`<pre class="code-block" data-lang="${lang||''}"><code${langClass}>${escHtml(code.trimEnd())}</code></pre>`);
    return `\x00BLOCK${blocks.length - 1}\x00`;
  });

  const lines = md.split('\n');
  const out   = [];
  let inUl      = false;
  let inOl      = false;
  let inTable   = false;
  let tableRows = [];
  let currentQ  = false;
  let inAnswer  = false;
  let paraLines = [];   // buffer: accumulate wrapped paragraph lines

  function flushPara() {
    if (paraLines.length) {
      out.push(`<p class="q-para">${paraLines.join(' ')}</p>`);
      paraLines = [];
    }
  }
  function closeOpenBlocks() {
    flushPara();
    if (inUl)    { out.push('</ul>');  inUl    = false; }
    if (inOl)    { out.push('</ol>');  inOl    = false; }
    if (inTable) { out.push(buildTable(tableRows)); tableRows = []; inTable = false; }
  }
  function closeQ() {
    flushPara();
    if (inAnswer) { out.push('</div>'); inAnswer = false; }
    if (currentQ) { out.push('</div>'); currentQ = false; }
  }
  function closeUl() { if (inUl) { out.push('</ul>'); inUl = false; } }
  function closeOl() { if (inOl) { out.push('</ol>'); inOl = false; } }

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.trimEnd();

    // ── Code-block placeholder ──
    const blockMatch = line.match(/^\x00BLOCK(\d+)\x00$/);
    if (blockMatch) {
      closeOpenBlocks();
      out.push(blocks[parseInt(blockMatch[1])]);
      continue;
    }

    // ── Tables ──
    if (line.startsWith('|')) {
      if (!inTable) { closeOpenBlocks(); inTable = true; tableRows = []; }
      tableRows.push(line);
      continue;
    } else if (inTable) {
      closeOpenBlocks();
    }

    // ── Blockquote ──
    if (line.match(/^>\s*/)) {
      closeOpenBlocks();
      const bqText = processInline(line.replace(/^>\s*/, ''));
      out.push(`<div class="q-tip">${bqText}</div>`);
      continue;
    }

    // ── HR / separator ──
    if (/^-{3,}$/.test(line)) {
      closeOpenBlocks();
      closeQ();
      out.push('<hr class="q-sep">');
      continue;
    }

    // ── Headings ──
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      closeOpenBlocks(); closeQ();
      out.push(`<h1 class="ch-title">${processInline(h1[1])}</h1>`);
      continue;
    }

    // Q-style heading: ## Q1.1 — text
    const qHead = line.match(/^## (Q[\d.]+)\s*[—\-]+\s*(.*)/);
    if (qHead) {
      closeOpenBlocks(); closeQ();
      const [, qnum, qtitle] = qHead;
      const qid = 'q-' + qnum.replace(/\./g, '-');
      out.push(`<div class="q-block" id="${qid}">`);
      out.push(`<div class="q-question"><span class="q-badge">${qnum}</span><h2 class="q-text">${processInline(qtitle)}</h2></div>`);
      out.push(`<div class="q-answer">`);
      currentQ = true;
      inAnswer = true;
      continue;
    }

    const h2 = line.match(/^## (.+)/);
    if (h2) {
      closeOpenBlocks(); closeQ();
      out.push(`<h2 class="section-hd">${processInline(h2[1])}</h2>`);
      continue;
    }

    const h3 = line.match(/^### (.+)/);
    if (h3) {
      closeOpenBlocks();
      out.push(`<h3 class="sub-hd">${processInline(h3[1])}</h3>`);
      continue;
    }

    const h4 = line.match(/^#### (.+)/);
    if (h4) {
      closeOpenBlocks();
      out.push(`<h4 class="subsub-hd">${processInline(h4[1])}</h4>`);
      continue;
    }

    // ── Lists ──
    const ulItem = line.match(/^[*\-] (.+)/);
    if (ulItem) {
      flushPara();
      if (!inUl) { closeOl(); out.push('<ul class="q-list">'); inUl = true; }
      out.push(`<li>${processInline(ulItem[1])}</li>`);
      continue;
    } else if (inUl && line.trim() === '') {
      closeUl();
    }

    const olItem = line.match(/^\d+\. (.+)/);
    if (olItem) {
      flushPara();
      if (!inOl) { closeUl(); out.push('<ol class="q-olist">'); inOl = true; }
      out.push(`<li>${processInline(olItem[1])}</li>`);
      continue;
    } else if (inOl && line.trim() === '') {
      closeOl();
    }

    // ── Empty line → flush paragraph buffer ──
    if (line.trim() === '') {
      closeOpenBlocks();
      continue;
    }

    // ── Paragraph: buffer the line (joins wrapped lines into one <p>) ──
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
    paraLines.push(processInline(line));
  }

  closeOpenBlocks();
  closeQ();
  return out.join('\n');
}

// ─── File Walking ─────────────────────────────────────────────────────────────

const BASE = path.join(__dirname, 'playwright');
const SKIP = new Set(['chapter-list.md', 'question-bank-all-chapters.md']);

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.md') && !SKIP.has(entry.name)) files.push(full);
  }
  return files;
}

const mdFiles = walk(BASE);
let converted = 0;

for (const mdPath of mdFiles) {
  const md      = fs.readFileSync(mdPath, 'utf8');
  const html    = convertMd(md);
  const htmlPath = mdPath.replace(/\.md$/, '.html');
  const rel     = path.relative(__dirname, htmlPath);
  fs.writeFileSync(htmlPath, html, 'utf8');
  converted++;
  console.log(`✓ ${rel}`);
}

console.log(`\n✅ Converted ${converted} files`);
