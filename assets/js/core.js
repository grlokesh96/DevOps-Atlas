/* ============================================================
   DevOps-Atlas — core utilities
   ============================================================ */
(function (global) {
  'use strict';

  var DA = global.DA = global.DA || {};

  /* ---------- tiny DOM helpers ---------- */
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- strings ---------- */
  function slugify(s) {
    return String(s == null ? '' : s)
      .toLowerCase().trim()
      .replace(/['"`]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled';
  }
  function uniqueSlug(base, taken) {
    var s = slugify(base), i = 2, o = s;
    while (taken && taken(s)) { s = o + '-' + (i++); }
    return s;
  }
  function stripMd(md) {
    return String(md || '')
      .replace(/^---[\s\S]*?---/, '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_~|-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function excerpt(md, n) {
    var t = stripMd(md);
    n = n || 170;
    return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t;
  }
  function readingTime(md) {
    var words = stripMd(md).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }
  function fmtDate(d) {
    if (!d) return '';
    var dt = new Date(d + (String(d).length === 10 ? 'T00:00:00' : ''));
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function bytes(n) {
    if (n == null) return '';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }
  function initials(name) {
    return String(name || 'DA').split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

  /* ---------- YAML-ish frontmatter ---------- */
  function parseFrontmatter(text) {
    var out = { data: {}, body: String(text || ''), raw: '' };
    var m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(out.body);
    if (!m) return out;
    out.raw = m[1];
    out.body = out.body.slice(m[0].length);
    var lines = m[1].split(/\r?\n/), key = null;
    lines.forEach(function (line) {
      if (/^\s*-\s+/.test(line) && key) {
        var v = line.replace(/^\s*-\s+/, '').trim().replace(/^["']|["']$/g, '');
        if (!Array.isArray(out.data[key])) out.data[key] = [out.data[key]];
        out.data[key].push(v);
        return;
      }
      var kv = /^([A-Za-z0-9_ -]+):\s*(.*)$/.exec(line);
      if (!kv) return;
      key = kv[1].trim().toLowerCase().replace(/\s+/g, '_');
      var val = kv[2].trim();
      if (val === '') { out.data[key] = ''; return; }
      if (val[0] === '[' && val[val.length - 1] === ']') {
        out.data[key] = val.slice(1, -1).split(',').map(function (s) { return s.trim().replace(/^["']|["']$/g, ''); }).filter(Boolean);
        return;
      }
      if (/^(true|false)$/i.test(val)) { out.data[key] = /^true$/i.test(val); return; }
      if (/^\d+$/.test(val)) { out.data[key] = parseInt(val, 10); return; }
      out.data[key] = val.replace(/^["']|["']$/g, '');
    });
    return out;
  }
  function buildFrontmatter(d) {
    var order = ['title', 'description', 'type', 'category', 'tags', 'difficulty', 'author', 'published', 'date'];
    var lines = ['---'];
    order.forEach(function (k) {
      var v = d[k];
      if (v == null || v === '') return;
      if (Array.isArray(v)) { if (!v.length) return; lines.push(k + ': [' + v.join(', ') + ']'); }
      else if (typeof v === 'boolean') lines.push(k + ': ' + v);
      else lines.push(k + ': ' + String(v).replace(/:/g, '\\:'));
    });
    lines.push('---');
    return lines.join('\n');
  }

  /* ---------- markdown ---------- */
  var renderer = null;
  function mdRenderer() {
    if (renderer) return renderer;
    var r = new marked.Renderer();
    var slugCounts = {};
    DA.headingSlugs = [];
    r.heading = function (text, level) {
      var plain = String(text).replace(/<[^>]+>/g, '');
      var base = slugify(plain);
      slugCounts[base] = (slugCounts[base] || 0) + 1;
      var id = slugCounts[base] > 1 ? base + '-' + slugCounts[base] : base;
      DA.headingSlugs.push({ id: id, text: plain, level: level });
      return '<h' + level + ' id="' + id + '">' + text +
        '<a class="heading-anchor" href="#' + id + '" aria-label="Link to this section">#</a></h' + level + '>';
    };
    r.code = function (code, info) {
      var lang = (info || '').trim().split(/\s+/)[0] || '';
      var highlighted;
      try {
        highlighted = lang && hljs.getLanguage(lang)
          ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
          : hljs.highlightAuto(code).value;
      } catch (e) { highlighted = esc(code); }
      var label = lang || 'code';
      return '<div class="codeblock" data-lang="' + esc(label) + '">' +
        '<div class="cb-head"><span>' + esc(label) + '</span>' +
        '<button type="button" class="copy-btn" data-copy>Copy</button></div>' +
        '<pre><code class="language-' + esc(lang) + '">' + highlighted + '</code></pre></div>';
    };
    r.table = function (head, body) {
      return '<div class="table-scroll"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    };
    renderer = r;
    return r;
  }
  function renderMd(md) {
    try {
      marked.setOptions({ renderer: mdRenderer(), gfm: true, breaks: false, pedantic: false, headerIds: false });
      return marked.parse(String(md || ''));
    } catch (e) {
      console.warn('markdown render failed', e);
      return '<p>' + esc(String(md || '')) + '</p>';
    }
  }

  /* ---------- table of contents ---------- */
  function tocFromHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return Array.prototype.slice.call(tmp.querySelectorAll('h1,h2,h3')).map(function (h) {
      return { id: h.id, text: h.textContent.replace(/#$/, '').trim(), level: parseInt(h.tagName[1], 10) };
    });
  }
  function tocHtml(items, activeId) {
    if (!items || !items.length) return '';
    return '<div class="toc"><h4>On this page</h4><ol>' + items.map(function (it) {
      var cls = (it.level >= 3 ? 'lvl-3' : '') + (it.id === activeId ? ' active' : '');
      return '<li><a class="' + cls + '" href="#' + it.id + '" data-toc-link>' + esc(it.text) + '</a></li>';
    }).join('') + '</ol></div>';
  }

  /* ---------- downloads ---------- */
  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
  }
  function downloadName(title, ext) {
    return 'devops-atlas-' + slugify(title) + '.' + ext;
  }
  function asMarkdown(item) {
    var fm = buildFrontmatter({
      title: item.title, description: item.description, type: item.type,
      category: item.category, tags: item.tags, author: item.author,
      published: item.status === 'published', date: item.date
    });
    return fm + '\n\n' + (item.content || '') + '\n';
  }
  function asText(item) {
    var head = [
      item.title,
      item.description || '',
      '',
      'Type: ' + (item.type || '') + '   Category: ' + (item.category || ''),
      'Author: ' + (item.author || '') + '   Date: ' + (item.date || ''),
      'Tags: ' + ((item.tags || []).join(', ')),
      '',
      ''.padEnd ? '-'.repeat(60) : '------------------------------------------------------------',
      ''
    ].join('\n');
    return head + stripMd(item.content || '');
  }
  function printPdf() { global.print(); }

  function downloadItem(item, fmt) {
    if (!item) return;
    if (fmt === 'md') saveBlob(new Blob([asMarkdown(item)], { type: 'text/markdown;charset=utf-8' }), downloadName(item.title, 'md'));
    else if (fmt === 'txt') saveBlob(new Blob([asText(item)], { type: 'text/plain;charset=utf-8' }), downloadName(item.title, 'txt'));
    else if (fmt === 'pdf') { DA.toast('Opening print dialog — choose “Save as PDF”.'); setTimeout(printPdf, 250); }
  }

  /* ---------- misc ---------- */
  function debounce(fn, ms) {
    var t; return function () {
      var a = arguments, c = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 200);
    };
  }
  function toast(msg, kind) {
    var wrap = document.getElementById('toasts');
    if (!wrap) return;
    var t = el('div', { class: 'toast' + (kind ? ' ' + kind : ''), text: msg });
    wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2600);
    setTimeout(function () { t.remove(); }, 3000);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = el('textarea'); ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); res(); } catch (e) { rej(e); }
      ta.remove();
    });
  }
  function qs(obj) {
    var p = new URLSearchParams();
    for (var k in obj) if (obj[k] != null && obj[k] !== '') p.set(k, obj[k]);
    var s = p.toString();
    return s ? '?' + s : '';
  }

  DA.util = {
    el: el, esc: esc, $: $, $$: $$,
    slugify: slugify, uniqueSlug: uniqueSlug, stripMd: stripMd, excerpt: excerpt,
    readingTime: readingTime, fmtDate: fmtDate, bytes: bytes, initials: initials, todayISO: todayISO,
    parseFrontmatter: parseFrontmatter, buildFrontmatter: buildFrontmatter,
    renderMd: renderMd, tocFromHtml: tocFromHtml, tocHtml: tocHtml,
    saveBlob: saveBlob, downloadName: downloadName, downloadItem: downloadItem, asMarkdown: asMarkdown, asText: asText,
    debounce: debounce, toast: toast, copyText: copyText, qs: qs
  };
})(window);
