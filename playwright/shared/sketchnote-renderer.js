(function (global) {
  const sharedStyleId = 'sketchnote-shared-styles';

  function ensureSharedStyles() {
    if (document.getElementById(sharedStyleId)) return;

    const style = document.createElement('style');
    style.id = sharedStyleId;
    style.textContent = `
      .table-wrap {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        margin: 1rem 0;
        border-radius: 10px;
      }
      .table-wrap .dtbl {
        display: table;
        min-width: 480px;
        width: max-content;
        max-width: none;
      }
      @media (max-width: 768px) {
        .table-wrap {
          margin-left: 0;
          margin-right: 0;
        }
        .table-wrap .dtbl th,
        .table-wrap .dtbl td {
          white-space: nowrap;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const renderer = {
    postProcess(section) {
      ensureSharedStyles();
      const titleColors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777'];
      const numBg = ['bg1', 'bg2', 'bg3', 'bg4', 'bg5', 'bg6', 'bg7'];
      const numText = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
      const boxCls = ['b1', 'b2', 'b4', 'b5', 'b3', 'b6', 'b7'];
      const h3Cls = ['c1', 'c2', 'c4', 'c5', 'c6', 'c7', 'c3'];

      section.querySelectorAll('h1').forEach((h) => {
        const words = h.textContent.trim().split(/\s+/);
        h.innerHTML = words.map((w, i) => `<span style="color:${titleColors[i % titleColors.length]}">${w}</span>`).join(' ');
        h.className = 'sk-h1';
      });

      let h2n = 0;
      section.querySelectorAll('h2').forEach((h) => {
        const col = numBg[h2n % numBg.length];
        const txt = numText[h2n % numText.length];
        h2n++;
        const div = document.createElement('div');
        div.className = 'sh';
        div.innerHTML = `<span class="sh-num ${col}">${h2n}</span><span class="sh-text ${txt}">${h.innerHTML}</span>`;
        h.replaceWith(div);
      });

      let h3n = 0;
      section.querySelectorAll('h3').forEach((h) => {
        h.className = `sk-h3 ${h3Cls[h3n % h3Cls.length]}`;
        h3n++;
      });

      section.querySelectorAll('h4').forEach((h) => {
        h.className = 'sk-h4 c4';
      });

      let bn = 0;
      section.querySelectorAll('blockquote').forEach((bq) => {
        bq.className = `box ${boxCls[bn % boxCls.length]}`;
        bq.style.fontStyle = 'normal';
        bn++;
      });

      section.querySelectorAll('table').forEach((t) => {
        if (t.closest('.table-wrap')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrap';
        t.parentNode.insertBefore(wrapper, t);
        wrapper.appendChild(t);
        t.className = 'dtbl';
      });

      section.querySelectorAll('ul').forEach((ul) => {
        ul.className = 'sk-ul';
      });

      section.querySelectorAll('ol').forEach((ol) => {
        ol.className = 'sk-ol';
      });

      const transformNestedList = (list, ancestry = []) => {
        const items = Array.from(list.children).filter((child) => child.matches('li'));
        items.forEach((item, idx) => {
          const path = ancestry.concat(idx + 1);
          const nestedLists = Array.from(item.children).filter((child) => child.matches('ul, ol'));

          const marker = document.createElement('span');
          marker.className = 'sub-marker';
          marker.textContent = path.join('.');

          const content = document.createElement('span');
          content.className = 'sub-marker-text';
          Array.from(item.childNodes).forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node.matches('ul, ol')) return;
            content.appendChild(node.cloneNode(true));
          });

          item.innerHTML = '';
          item.className = 'sk-sub-item';
          item.appendChild(marker);
          item.appendChild(content);

          nestedLists.forEach((nestedList) => {
            nestedList.className = 'sk-sub-list';
            item.appendChild(nestedList);
            transformNestedList(nestedList, path);
          });
        });
      };

      section.querySelectorAll('li > ul, li > ol').forEach((list) => {
        const parentLi = list.parentElement;
        if (!parentLi || !parentLi.matches('li')) return;
        list.className = 'sk-sub-list';
        transformNestedList(list);
      });

      const kwCls = ['kw1', 'kw2', 'kw4', 'kw5', 'kw6', 'kw7', 'kw3'];
      section.querySelectorAll('strong').forEach((s, i) => {
        s.className = kwCls[i % kwCls.length];
      });
    },

    normalizeMarkdown(text) {
      return String(text || '')
        .replace(/^#\s+(?:Chapter\s+)?(?:\d+[:.]?\s*)+/gim, '# ')
        .replace(/^##\s+(?:Chapter\s+)?(?:\d+[:.]?\s*)+/gim, '## ');
    },

    resolveDocUrl(filename, pageLocation) {
      const origin = pageLocation.origin;
      const pathname = pageLocation.pathname;
      let basePath = pathname;

      if (pathname.endsWith('/')) {
        basePath = pathname;
      } else if (pathname.endsWith('.html')) {
        basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
      } else {
        basePath = `${pathname}/`;
      }

      return new URL(filename, `${origin}${basePath}`).toString();
    },

    async fetchMarkdown(url, options = {}) {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      return decoder.decode(buffer);
    },

    addCopyButtons(root) {
      root.querySelectorAll('pre').forEach((pre) => {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerHTML = '<i class="far fa-copy"></i> Copy';
        button.onclick = () => this.copyCode(button);
        pre.appendChild(button);
      });
    },

    async copyCode(button) {
      const pre = button.parentElement;
      const code = pre.querySelector('code').innerText;
      try {
        await navigator.clipboard.writeText(code);
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.innerHTML = '<i class="far fa-copy"></i> Copy';
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  global.SketchnoteRenderer = renderer;
})(window);
