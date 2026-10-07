/* ============================================================
   DevOps-Atlas — public views
   ============================================================ */
(function (global) {
  'use strict';
  var DA = global.DA, U = DA.util, S = DA.store;
  var V = DA.views = {};

  /* ---------------- shared components ---------------- */
  function coverHtml(item, cls) {
    var c = item.cover;
    if (c && /^https?:/.test(c)) return '<div class="card-cover ' + (cls || '') + '"><img src="' + U.esc(c) + '" alt=""></div>';
    if (c) return '<div class="card-cover ' + (cls || '') + '"><span>' + U.esc(c) + '</span></div>';
    return '<div class="card-cover ' + (cls || '') + '"><span class="cc-initials">' + U.esc(U.initials(item.category)) + '</span></div>';
  }

  function cardHtml(item) {
    var href = S.hrefFor(item);
    var meta = [];
    meta.push('<span class="badge type">' + U.esc(item.type) + '</span>');
    if (item.status === 'draft') meta.push('<span class="badge draft">Draft</span>');
    meta.push('<span>' + U.esc(item.category) + '</span>');
    var foot = '<span>' + U.esc(U.fmtDate(item.date)) + '</span>';
    if (item.type !== 'Troubleshooting') foot += '<span>' + U.readingTime(item.content) + ' min read</span>';
    return '<article class="card"><a class="card-link" href="' + href + '">' +
      coverHtml(item) +
      '<div class="card-body">' +
        '<div class="card-meta">' + meta.join('') + '</div>' +
        '<h3>' + U.esc(item.title) + '</h3>' +
        '<p class="desc">' + U.esc(item.description) + '</p>' +
        '<div class="card-foot">' + foot + '</div>' +
      '</div></a></article>';
  }

  function downloadMenuHtml(item, align) {
    if (['Article', 'Blog', 'Note', 'Post'].indexOf(item.type) < 0) return '';
    return '<span class="dl-wrap"><button type="button" class="btn btn-sm" data-dl-toggle aria-haspopup="true" aria-expanded="false">⤓ Download</button>' +
      '<div class="dl-menu ' + (align || '') + '" hidden>' +
      '<button type="button" data-dl="md">Markdown <span class="fmt">.md</span></button>' +
      '<button type="button" data-dl="txt">Plain text <span class="fmt">.txt</span></button>' +
      '<button type="button" data-dl="pdf">PDF (print) <span class="fmt">.pdf</span></button>' +
      '</div></span>';
  }

  function crumb(parts) {
    return '<nav class="crumb" aria-label="Breadcrumb">' + parts.map(function (p, i) {
      var sep = i ? '<span class="sep">/</span>' : '';
      return sep + (p.href ? '<a href="' + p.href + '">' + U.esc(p.label) + '</a>' : '<span>' + U.esc(p.label) + '</span>');
    }).join('') + '</nav>';
  }

  function emptyHtml(icon, title, body, cta) {
    return '<div class="empty"><div class="big">' + icon + '</div><h3>' + U.esc(title) + '</h3>' +
      '<p>' + U.esc(body) + '</p>' + (cta || '') + '</div>';
  }

  function chipsFor(item) {
    if (!item.tags || !item.tags.length) return '';
    return '<div class="chips">' + item.tags.map(function (t) {
      return '<a class="chip tag" href="#/tag/' + encodeURIComponent(U.slugify(t)) + '">#' + U.esc(t) + '</a>';
    }).join('') + '</div>';
  }

  V.components = { cardHtml: cardHtml, coverHtml: coverHtml, downloadMenuHtml: downloadMenuHtml, crumb: crumb, emptyHtml: emptyHtml };

  /* ---------------- HOME ---------------- */
  V.home = {
    render: function () {
      var st = S.stats();
      var featured = S.published().filter(function (i) { return i.type !== 'Troubleshooting' && i.type !== 'Lab'; }).slice(0, 6);
      var ts = S.published().filter(function (i) { return i.type === 'Troubleshooting'; }).slice(0, 6);
      var labs = S.published().filter(function (i) { return i.type === 'Lab'; }).slice(0, 6);
      var cats = S.categories().slice(0, 8);

      return '' +
      '<section class="hero">' +
        '<span class="eyebrow">Cloud-native engineering knowledge base</span>' +
        '<h1>Learn. Build. Troubleshoot. <span>Master.</span></h1>' +
        '<p>Articles, hands-on labs, a searchable command atlas, a troubleshooting library and interview prep — all in one lightweight, static atlas.</p>' +
        '<div class="hero-cta">' +
          '<a class="btn btn-primary" href="#/content">Browse content</a>' +
          '<a class="btn" href="#/troubleshooting">Troubleshooting library</a>' +
          '<a class="btn btn-ghost" href="#/commands">Command atlas</a>' +
        '</div>' +
        '<div class="stats">' +
          '<div class="stat"><b>' + st.published + '</b><span>Published items</span></div>' +
          '<div class="stat"><b>' + st.categories + '</b><span>Categories</span></div>' +
          '<div class="stat"><b>' + st.troubleshooting + '</b><span>Troubleshooting guides</span></div>' +
          '<div class="stat"><b>' + st.labs + '</b><span>Hands-on labs</span></div>' +
          '<div class="stat"><b>' + (DA_SEED_COMMANDS ? DA_SEED_COMMANDS.length : 0) + '</b><span>Reference commands</span></div>' +
          '<div class="stat"><b>' + (DA_SEED_INTERVIEW ? DA_SEED_INTERVIEW.length : 0) + '</b><span>Interview tracks</span></div>' +
        '</div>' +
      '</section>' +

      '<section class="section"><div class="section-head"><div><span class="eyebrow">Latest</span><h2>Featured content</h2>' +
        '<p>Articles, blog posts, notes and community posts.</p></div>' +
        '<a class="btn btn-sm" href="#/content">View all →</a></div>' +
        '<div class="grid grid-3">' + featured.map(cardHtml).join('') + '</div></section>' +

      '<section class="section"><div class="section-head"><div><span class="eyebrow">Debug faster</span><h2>Troubleshooting library</h2>' +
        '<p>Problem → diagnosis → commands → solution → prevention.</p></div>' +
        '<a class="btn btn-sm" href="#/troubleshooting">All entries →</a></div>' +
        '<div class="grid grid-3">' + ts.map(cardHtml).join('') + '</div></section>' +

      '<section class="section"><div class="section-head"><div><span class="eyebrow">Hands-on</span><h2>Labs</h2>' +
        '<p>Step-by-step builds with expected output and cleanup.</p></div>' +
        '<a class="btn btn-sm" href="#/labs">All labs →</a></div>' +
        '<div class="grid grid-3">' + labs.map(cardHtml).join('') + '</div></section>' +

      '<section class="section"><div class="section-head"><div><span class="eyebrow">Explore</span><h2>Categories</h2></div>' +
        '<a class="btn btn-sm" href="#/content">Full listing →</a></div>' +
        '<div class="cat-grid">' + cats.map(function (c) {
          return '<a class="cat-tile" href="#/category/' + encodeURIComponent(c.slug) + '"><div class="ct-ico">📁</div>' +
            '<b>' + U.esc(c.name) + '</b><span>' + c.count + ' item' + (c.count === 1 ? '' : 's') + '</span></a>';
        }).join('') + '</div></section>';
    },
    mount: function () {}
  };

  /* ---------------- CONTENT LISTING ---------------- */
  V.content = {
    render: function (p) {
      var types = ['All'].concat(S.TYPES);
      var cats = [{ name: 'All' }].concat(S.categories());
      var tagInfo = p.tag ? S.tags().filter(function (t) { return t.slug === p.tag; })[0] : null;
      var head;
      if (p.tag) {
        head = '<div class="page-head"><span class="eyebrow">Tag</span><h1>#' + U.esc(tagInfo ? tagInfo.name : p.tag) + '</h1>' +
          '<p>Content tagged “' + U.esc(tagInfo ? tagInfo.name : p.tag) + '”. Drafts are never shown here.</p></div>';
      } else if (p.category && p.category !== 'All') {
        head = '<div class="page-head"><span class="eyebrow">Category</span><h1>' + U.esc(p.category) + '</h1>' +
          '<p>Published content in “' + U.esc(p.category) + '”. Drafts are never shown here.</p></div>';
      } else {
        head = '<div class="page-head"><span class="eyebrow">Library</span><h1>All content</h1>' +
          '<p>Everything published in DevOps-Atlas. Drafts are never shown here.</p></div>';
      }
      return crumb([{ label: 'Home', href: '#/' }].concat(
        p.tag ? [{ label: 'Content', href: '#/content' }, { label: '#' + (tagInfo ? tagInfo.name : p.tag) }]
        : p.category && p.category !== 'All' ? [{ label: 'Content', href: '#/content' }, { label: p.category }]
        : [{ label: 'Content' }]
      )) + head +
        '<div class="filters">' +
          '<input type="search" id="f-q" placeholder="Filter content…" value="' + U.esc(p.q || '') + '" aria-label="Filter content">' +
          '<select id="f-type" aria-label="Content type">' + types.map(function (t) {
            return '<option' + (p.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
          '<select id="f-cat" aria-label="Category">' + cats.map(function (c) {
            return '<option value="' + U.esc(c.name) + '"' + (p.category === c.name ? ' selected' : '') + '>' + U.esc(c.name) + '</option>'; }).join('') + '</select>' +
          '<select id="f-sort" aria-label="Sort">' +
            '<option value="newest"' + (p.sort !== 'oldest' && p.sort !== 'title' ? ' selected' : '') + '>Newest</option>' +
            '<option value="oldest"' + (p.sort === 'oldest' ? ' selected' : '') + '>Oldest</option>' +
            '<option value="title"' + (p.sort === 'title' ? ' selected' : '') + '>Title A–Z</option>' +
          '</select>' +
          '<span class="spacer"></span><span class="result-count" id="f-count"></span>' +
        '</div>' +
        '<div id="listing" class="grid grid-3"></div>';
    },
    mount: function (root, p) {
      var q = root.querySelector('#f-q'), ty = root.querySelector('#f-type'),
          ca = root.querySelector('#f-cat'), so = root.querySelector('#f-sort'),
          out = root.querySelector('#listing'), cnt = root.querySelector('#f-count');

      function apply() {
        var list = S.publicList({
          q: q.value, type: ty.value, category: ca.value, tag: p.tag || '',
          sort: so.value === 'newest' ? '' : so.value
        });
        cnt.textContent = list.length + ' result' + (list.length === 1 ? '' : 's');
        out.innerHTML = list.length
          ? list.map(cardHtml).join('')
          : emptyHtml('🔍', 'No content found', 'Try a different filter or search term.',
              '<a class="btn btn-primary" href="#/admin/new">Create content</a>');
      }
      [q, ty, ca, so].forEach(function (n) { n.addEventListener('input', apply); n.addEventListener('change', apply); });
      apply();
    }
  };

  /* ---------------- ARTICLE READER ---------------- */
  V.read = {
    render: function (p) {
      var item = S.get(p.id);
      if (!item) return emptyHtml('📄', 'Content not found', 'This item does not exist or was removed.', '<a class="btn" href="#/content">Back to content</a>');
      if (item.status === 'draft') {
        return emptyHtml('📝', 'This item is a draft', 'Drafts are not part of the public site.',
          '<div class="hero-cta"><a class="btn btn-primary" href="#/admin/edit/' + item.id + '">Edit in admin</a><a class="btn" href="#/admin">Admin dashboard</a></div>');
      }
      var html = U.renderMd(item.content);
      var toc = U.tocFromHtml(html);
      var seq = S.articleSequence();
      var idx = seq.findIndex(function (i) { return i.id === item.id; });
      var prev = idx > 0 ? seq[idx - 1] : null;
      var next = idx >= 0 && idx < seq.length - 1 ? seq[idx + 1] : null;
      var related = S.published().filter(function (i) {
        return i.id !== item.id && (i.category === item.category || i.tags.some(function (t) { return item.tags.indexOf(t) >= 0; }));
      }).slice(0, 3);

      var tocBlock = U.tocHtml(toc, '');

      return crumb([{ label: 'Home', href: '#/' }, { label: 'Content', href: '#/content' }, { label: item.title }]) +
      '<div class="article-layout"><div class="article-main">' +
        '<header class="article-head">' +
          '<div class="chips"><span class="badge type">' + U.esc(item.type) + '</span>' +
            '<a class="chip" href="#/category/' + encodeURIComponent(U.slugify(item.category)) + '">' + U.esc(item.category) + '</a></div>' +
          '<h1>' + U.esc(item.title) + '</h1>' +
          '<p class="lead">' + U.esc(item.description) + '</p>' +
          '<div class="article-meta">' +
            '<span class="who"><span class="avatar">' + U.esc(U.initials(item.author)) + '</span>' + U.esc(item.author) + '</span>' +
            '<span>📅 ' + U.esc(U.fmtDate(item.date)) + '</span>' +
            '<span>⏱ ' + U.readingTime(item.content) + ' min read</span>' +
            '<span>' + html.split(/<h[23]/).length + ' sections</span>' +
          '</div>' +
          '<div class="article-actions">' +
            '<span class="share-wrap"><button type="button" class="btn btn-primary" data-share-toggle aria-expanded="false">⤴ Share</button>' +
              '<div class="share-menu" hidden>' +
                '<button type="button" data-share="copy">🔗 Copy link</button>' +
                '<button type="button" data-share="twitter">𝕏 / Twitter</button>' +
                '<button type="button" data-share="linkedin">💼 LinkedIn</button>' +
                '<button type="button" data-share="reddit">🟠 Reddit</button>' +
                '<button type="button" data-share="email">✉️ Email</button>' +
              '</div></span>' +
            downloadMenuHtml(item) +
            (item.type === 'Troubleshooting' ? '<a class="btn" href="#/troubleshooting">Library</a>' : '') +
          '</div>' +
          (item.tags.length ? '<div style="margin-top:14px">' + chipsFor(item) + '</div>' : '') +
        '</header>' +

        '<details class="toc-mobile"><summary>Table of contents <span class="muted" style="font-weight:400;font-size:12px">' + toc.length + ' sections</span></summary>' + tocBlock + '</details>' +

        '<div class="prose" id="article-body">' + html + '</div>' +

        '<div class="related"><div class="section-head"><h2>Related content</h2></div>' +
          (related.length ? '<div class="grid grid-3">' + related.map(cardHtml).join('') + '</div>'
            : '<p class="muted">No related items yet.</p>') +
        '</div>' +

        (prev || next ? '<nav class="pager">' +
          (prev ? '<a href="#/read/' + prev.id + '"><span class="dir">← Previous</span><b>' + U.esc(prev.title) + '</b></a>' : '<span></span>') +
          (next ? '<a class="next" href="#/read/' + next.id + '"><span class="dir">Next →</span><b>' + U.esc(next.title) + '</b></a>' : '') +
        '</nav>' : '') +
      '</div>' +
      '<aside class="toc-desktop">' + tocBlock + '</aside>' +
      '</div>';
    },
    mount: function (root, p) {
      var item = S.get(p.id);
      wireDownloads(root, item);
      wireShare(root, item);
      wireToc(root);
    }
  };

  /* ---------------- TROUBLESHOOTING ---------------- */
  V.troubleshooting = {
    render: function (p) {
      var items = S.published().filter(function (i) { return i.type === 'Troubleshooting'; });
      var groups = {};
      items.forEach(function (i) { (groups[i.tsGroup || i.category] = groups[i.tsGroup || i.category] || []).push(i); });
      var keys = Object.keys(groups);

      if (p.id) {
        var item = S.get(p.id);
        if (!item) return emptyHtml('🚨', 'Entry not found', 'Pick an entry from the library.', '<a class="btn" href="#/troubleshooting">Back to library</a>');
        return tsDetail(item, items, groups);
      }

      return crumb([{ label: 'Home', href: '#/' }, { label: 'Troubleshooting' }]) +
        '<div class="page-head"><span class="eyebrow">Debug faster</span><h1>Troubleshooting library</h1>' +
        '<p>' + items.length + ' entries covering Kubernetes, AWS, Terraform, CI/CD and GitOps. Each entry gives you the symptoms, the exact commands, the fix and how to prevent a repeat.</p></div>' +
        '<div class="filters"><input type="search" id="ts-q" placeholder="Filter entries (e.g. OOMKilled, AccessDenied)…" aria-label="Filter entries"><span class="spacer"></span><span class="result-count" id="ts-count"></span></div>' +
        '<div class="ts-layout"><aside class="ts-side" id="ts-side">' +
          keys.map(function (k) {
            return '<div class="grp"><h4>' + U.esc(k) + '</h4>' +
              groups[k].map(function (i) { return '<a href="#/troubleshooting/' + i.id + '">' + U.esc(i.title) + '</a>'; }).join('') + '</div>';
          }).join('') +
        '</aside><div><div class="grid grid-2" id="ts-grid">' +
          items.map(function (i) { return '<div data-ts-card data-title="' + U.esc((i.title + ' ' + i.description).toLowerCase()) + '">' + cardHtml(i) + '</div>'; }).join('') +
        '</div></div></div>';
    },
    mount: function (root, p) {
      wireDownloads(root, p.id ? S.get(p.id) : null);
      wireShare(root, p.id ? S.get(p.id) : null);
      wireToc(root);
      var q = root.querySelector('#ts-q');
      if (q) {
        q.addEventListener('input', function () {
          var v = q.value.toLowerCase().trim(), n = 0;
          DA.util.$$('[data-ts-card]', root).forEach(function (c) {
            var ok = !v || c.getAttribute('data-title').indexOf(v) >= 0;
            c.style.display = ok ? '' : 'none';
            if (ok) n++;
          });
          root.querySelector('#ts-count').textContent = n + ' entries';
        });
        q.dispatchEvent(new Event('input'));
      }
      var side = root.querySelector('#ts-side');
      if (side && p.id) {
        var active = side.querySelector('a[href="#/troubleshooting/' + p.id + '"]');
        if (active) {
          active.classList.add('active');
          if (active.scrollIntoView) try { active.scrollIntoView({ block: 'nearest' }); } catch (e) {}
        }
      }
      wireSideToggle(root);
    }
  };

  function tsDetail(item, items, groups) {
    var html = U.renderMd(item.content);
    var toc = U.tocFromHtml(html);
    var sideHtml = Object.keys(groups).map(function (k) {
      return '<div class="grp"><h4>' + U.esc(k) + '</h4>' +
        groups[k].map(function (i) {
          return '<a href="#/troubleshooting/' + i.id + '"' + (i.id === item.id ? ' class="active"' : '') + '>' + U.esc(i.title) + '</a>';
        }).join('') + '</div>';
    }).join('');

    var sev = { Critical: 'draft', High: 'draft', Medium: 'published', Low: 'published' }[item.severity] || 'published';

    return crumb([{ label: 'Home', href: '#/' }, { label: 'Troubleshooting', href: '#/troubleshooting' }, { label: item.title }]) +
      '<button type="button" class="btn btn-sm ts-side-toggle" data-side-toggle style="display:none;margin-bottom:14px">☰ Entries</button>' +
      '<div class="ts-layout"><aside class="ts-side" id="ts-side">' + sideHtml + '</aside><div class="article-main">' +
        '<header class="article-head">' +
          '<div class="chips"><span class="badge type">Troubleshooting</span>' +
            '<span class="badge ' + sev + '">' + U.esc(item.severity || 'Medium') + ' severity</span>' +
            '<span class="chip">' + U.esc(item.tsGroup || item.category) + '</span></div>' +
          '<h1>' + U.esc(item.title) + '</h1>' +
          '<p class="lead">' + U.esc(item.description) + '</p>' +
          '<div class="article-actions">' +
            '<span class="share-wrap"><button type="button" class="btn btn-primary" data-share-toggle>⤴ Share</button>' +
              '<div class="share-menu" hidden>' +
                '<button type="button" data-share="copy">🔗 Copy link</button>' +
                '<button type="button" data-share="twitter">𝕏 / Twitter</button>' +
                '<button type="button" data-share="email">✉️ Email</button>' +
              '</div></span>' +
            '<a class="btn" href="#/troubleshooting">← Library</a>' +
          '</div>' +
        '</header>' +
        '<details class="toc-mobile"><summary>On this page</summary>' + U.tocHtml(toc, '') + '</details>' +
        '<div class="prose" id="article-body">' + html + '</div>' +
      '</div><aside class="toc-desktop">' + U.tocHtml(toc, '') + '</aside></div>';
  }

  /* ---------------- COMMAND ATLAS ---------------- */
  V.commands = {
    render: function (p) {
      var cmds = DA_SEED_COMMANDS || [];
      var cats = [];
      cmds.forEach(function (c) { if (cats.indexOf(c.category) < 0) cats.push(c.category); });
      return crumb([{ label: 'Home', href: '#/' }, { label: 'Command Atlas' }]) +
        '<div class="page-head"><span class="eyebrow">Reference</span><h1>Command atlas</h1>' +
        '<p>' + cmds.length + ' copy-ready commands across ' + cats.length + ' tools. Searchable, with a one-click copy button on every entry.</p></div>' +
        '<div class="filters">' +
          '<input type="search" id="cmd-q" placeholder="Search commands, e.g. kubectl get pods…" value="' + U.esc(p.q || '') + '" aria-label="Search commands">' +
          '<select id="cmd-cat" aria-label="Category"><option value="All">All categories</option>' +
            cats.map(function (c) { return '<option' + (p.cat === c ? ' selected' : '') + '>' + U.esc(c) + '</option>'; }).join('') +
          '</select><span class="spacer"></span><span class="result-count" id="cmd-count"></span>' +
        '</div><div id="cmd-out"></div>';
    },
    mount: function (root, p) {
      var cmds = DA_SEED_COMMANDS || [];
      var q = root.querySelector('#cmd-q'), cat = root.querySelector('#cmd-cat'),
          out = root.querySelector('#cmd-out'), cnt = root.querySelector('#cmd-count');

      function card(c) {
        return '<div class="cmd-card" data-cmd>' +
          '<div><div class="cmd-line"><code>' + U.esc(c.command) + '</code>' +
            '<button type="button" class="copy-btn" data-copy-text="' + U.esc(c.command) + '">Copy</button></div>' +
            '<div class="cmd-desc">' + U.esc(c.description) + '</div>' +
            (c.example && c.example !== c.command ? '<div class="cmd-eg"><b>Example:</b> <span class="mono">' + U.esc(c.example) + '</span></div>' : '') +
          '</div>' +
          '<span class="chip">' + U.esc(c.category) + '</span>' +
        '</div>';
      }
      function apply() {
        var v = q.value.toLowerCase().trim(), c = cat.value;
        var list = cmds.filter(function (x) {
          if (c !== 'All' && x.category !== c) return false;
          if (!v) return true;
          return (x.command + ' ' + x.description + ' ' + x.example + ' ' + x.category).toLowerCase().indexOf(v) >= 0;
        });
        cnt.textContent = list.length + ' / ' + cmds.length + ' commands';
        if (!list.length) { out.innerHTML = emptyHtml('⌨️', 'No commands matched', 'Try another keyword or category.'); return; }
        var groups = {};
        list.forEach(function (x) { (groups[x.category] = groups[x.category] || []).push(x); });
        out.innerHTML = Object.keys(groups).map(function (k) {
          return '<div class="cmd-cat-head"><h2>' + U.esc(k) + '</h2><span class="count">' + groups[k].length + ' commands</span></div>' +
            '<div class="cmd-grid">' + groups[k].map(card).join('') + '</div>';
        }).join('');
      }
      q.addEventListener('input', apply); cat.addEventListener('change', apply);
      apply();
    }
  };

  /* ---------------- LABS ---------------- */
  V.labs = {
    render: function (p) {
      var items = S.published().filter(function (i) { return i.type === 'Lab'; });
      if (p.id) {
        var it = S.get(p.id);
        if (!it) return emptyHtml('🧪', 'Lab not found', 'Pick a lab from the list.', '<a class="btn" href="#/labs">All labs</a>');
        var html = U.renderMd(it.content);
        var toc = U.tocFromHtml(html);
        return crumb([{ label: 'Home', href: '#/' }, { label: 'Labs', href: '#/labs' }, { label: it.title }]) +
          '<div class="article-layout"><div class="article-main">' +
            '<header class="article-head">' +
              '<div class="chips"><span class="badge type">Lab</span><span class="chip">' + U.esc(it.category) + '</span>' +
                '<span class="chip">' + U.esc(it.difficulty || 'Intermediate') + '</span>' +
                (it.duration ? '<span class="chip">⏱ ' + U.esc(it.duration) + '</span>' : '') + '</div>' +
              '<h1>' + U.esc(it.title) + '</h1><p class="lead">' + U.esc(it.description) + '</p>' +
              '<div class="article-meta"><span class="who"><span class="avatar">' + U.esc(U.initials(it.author)) + '</span>' + U.esc(it.author) + '</span>' +
                '<span>📅 ' + U.esc(U.fmtDate(it.date)) + '</span><span>⏱ ' + U.readingTime(it.content) + ' min</span></div>' +
              '<div class="article-actions">' +
                '<span class="share-wrap"><button type="button" class="btn btn-primary" data-share-toggle>⤴ Share</button>' +
                '<div class="share-menu" hidden><button type="button" data-share="copy">🔗 Copy link</button>' +
                '<button type="button" data-share="email">✉️ Email</button></div></span>' +
                '<a class="btn" href="#/labs">← All labs</a>' +
              '</div>' +
            '</header>' +
            '<details class="toc-mobile"><summary>Table of contents</summary>' + U.tocHtml(toc, '') + '</details>' +
            '<div class="prose" id="article-body">' + html + '</div>' +
          '</div><aside class="toc-desktop">' + U.tocHtml(toc, '') + '</aside></div>';
      }
      var groups = {};
      items.forEach(function (i) { (groups[i.category] = groups[i.category] || []).push(i); });
      return crumb([{ label: 'Home', href: '#/' }, { label: 'Labs' }]) +
        '<div class="page-head"><span class="eyebrow">Hands-on</span><h1>Labs</h1>' +
        '<p>Guided builds with objective, architecture, commands, expected output, troubleshooting and cleanup.</p></div>' +
        Object.keys(groups).map(function (k) {
          return '<section class="section"><div class="section-head"><h2>' + U.esc(k) + '</h2>' +
            '<span class="result-count">' + groups[k].length + ' labs</span></div>' +
            '<div class="grid grid-3">' + groups[k].map(cardHtml).join('') + '</div></section>';
        }).join('');
    },
    mount: function (root, p) { wireDownloads(root, p.id ? S.get(p.id) : null); wireShare(root, p.id ? S.get(p.id) : null); wireToc(root); }
  };

  /* ---------------- INTERVIEW PREP ---------------- */
  V.interview = {
    render: function (p) {
      var cats = DA_SEED_INTERVIEW || [];
      if (p.id) {
        var cat = cats.filter(function (c) { return c.id === p.id; })[0];
        if (!cat) return emptyHtml('🎯', 'Track not found', 'Choose a track from the list.', '<a class="btn" href="#/interview">All tracks</a>');
        var items = S.published().filter(function (i) { return i.type === 'Article' && i.tags.indexOf('interview') >= 0; });
        return crumb([{ label: 'Home', href: '#/' }, { label: 'Interview Prep', href: '#/interview' }, { label: cat.title }]) +
          '<div class="page-head"><span class="eyebrow">Interview prep</span><h1>' + cat.icon + ' ' + U.esc(cat.title) + '</h1>' +
          '<p>' + U.esc(cat.description) + ' · ' + cat.questions.length + ' questions, answers kept short and interview-ready.</p>' +
          '<div class="article-actions"><a class="btn" href="#/interview">← All tracks</a>' +
            '<button type="button" class="btn" data-acc-expand>Expand all</button>' +
            '<button type="button" class="btn" data-acc-collapse>Collapse all</button></div></div>' +
          '<div class="acc" id="iv-acc">' + cat.questions.map(function (q, i) {
            return '<details' + (i === 0 ? ' open' : '') + '><summary>' + U.esc(q.q) + '</summary>' +
              '<div class="acc-body prose">' + U.renderMd(q.a) + '</div></details>';
          }).join('') + '</div>' +
          '<section class="section" style="margin-top:34px"><div class="section-head"><h2>More tracks</h2></div>' +
            '<div class="cat-grid">' + cats.filter(function (c) { return c.id !== cat.id; }).map(tile).join('') + '</div></section>';
      }
      return crumb([{ label: 'Home', href: '#/' }, { label: 'Interview Prep' }]) +
        '<div class="page-head"><span class="eyebrow">Interview prep</span><h1>Interview prep</h1>' +
        '<p>' + cats.length + ' tracks with short, interview-ready answers. Open a track, expand a question, and you have your answer in 30 seconds.</p></div>' +
        '<div class="cat-grid">' + cats.map(tile).join('') + '</div>';

      function tile(c) {
        return '<a class="cat-tile" href="#/interview/' + c.id + '"><div class="ct-ico">' + c.icon + '</div>' +
          '<b>' + U.esc(c.title) + '</b><span>' + c.questions.length + ' questions</span></a>';
      }
    },
    mount: function (root, p) {
      var ex = root.querySelector('[data-acc-expand]'), co = root.querySelector('[data-acc-collapse]');
      if (ex) ex.addEventListener('click', function () { DA.util.$$('#iv-acc details', root).forEach(function (d) { d.open = true; }); });
      if (co) co.addEventListener('click', function () { DA.util.$$('#iv-acc details', root).forEach(function (d) { d.open = false; }); });
    }
  };

  /* ---------------- SEARCH RESULTS PAGE ---------------- */
  V.search = {
    render: function (p) {
      var q = p.q || '';
      var results = q ? S.search(q) : [];
      return crumb([{ label: 'Home', href: '#/' }, { label: 'Search' }]) +
        '<div class="page-head"><span class="eyebrow">Search</span><h1>Results for “' + U.esc(q) + '”</h1>' +
        '<p>' + results.length + ' match' + (results.length === 1 ? '' : 'es') + ' across content, commands and interview tracks.</p></div>' +
        '<div class="filters"><input type="search" id="sq" value="' + U.esc(q) + '" placeholder="Search everything…" aria-label="Search"><span class="spacer"></span></div>' +
        '<div class="grid" style="gap:10px">' + (results.length ? results.map(function (r) {
          return '<a class="sr-item" href="' + r.href + '"><span class="sr-kind">' + U.esc(r.kind) + '</span>' +
            '<span style="min-width:0"><span class="sr-title">' + U.esc(r.title) + '</span>' +
            '<span class="sr-desc">' + U.esc(r.desc) + '</span></span></a>';
        }).join('') : emptyHtml('🔍', 'No matches', 'Try a broader keyword.')) + '</div>';
    },
    mount: function (root, p) {
      var i = root.querySelector('#sq');
      i.addEventListener('input', DA.util.debounce(function () {
        location.hash = '#/search' + U.qs({ q: i.value });
      }, 320));
      i.focus();
    }
  };

  /* ---------------- shared behavior ---------------- */
  function wireDownloads(root, item) {
    if (!item) return;
    var toggle = root.querySelector('[data-dl-toggle]');
    if (!toggle) return;
    var menu = toggle.nextElementSibling;
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !menu.hidden;
      closeAllMenus(root);
      menu.hidden = open;
      toggle.setAttribute('aria-expanded', String(!open));
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dl]');
      if (!b) return;
      e.stopPropagation();
      menu.hidden = true;
      DA.store.get && U.downloadItem(item, b.getAttribute('data-dl'));
    });
  }

  function wireShare(root, item) {
    var toggle = root.querySelector('[data-share-toggle]');
    if (!toggle) return;
    var menu = toggle.nextElementSibling;
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !menu.hidden;
      closeAllMenus(root);
      menu.hidden = open;
      toggle.setAttribute('aria-expanded', String(!open));
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-share]');
      if (!b) return;
      e.stopPropagation();
      menu.hidden = true;
      var url = location.href;
      var title = item ? item.title : document.title;
      var kind = b.getAttribute('data-share');
      if (kind === 'copy') {
        U.copyText(url).then(function () { U.toast('Link copied to clipboard.'); });
      } else if (kind === 'twitter') open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url));
      else if (kind === 'linkedin') open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url));
      else if (kind === 'reddit') open('https://www.reddit.com/submit?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title));
      else if (kind === 'email') location.href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(url);
    });
  }

  function closeAllMenus(root) {
    DA.util.$$('.dl-menu, .share-menu', root).forEach(function (m) { m.hidden = true; });
    DA.util.$$('[data-dl-toggle],[data-share-toggle]', root).forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }
  document.addEventListener('click', function () { closeAllMenus(document); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAllMenus(document); });

  function wireToc(root) {
    var links = DA.util.$$('[data-toc-link]', root);
    if (!links.length) return;
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var id = a.getAttribute('href').slice(1);
        var t = document.getElementById(id);
        if (t) {
          var y = t.getBoundingClientRect().top + window.pageYOffset - 76;
          window.scrollTo({ top: y, behavior: 'smooth' });
          history.replaceState(null, '', location.hash.split('#')[2] ? location.hash : location.hash);
        }
        DA.util.$$('.toc a', root).forEach(function (x) { x.classList.remove('active'); });
        a.classList.add('active');
        var d = a.closest('details'); if (d) d.open = false;
      });
    });
    var heads = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    if ('IntersectionObserver' in window && heads.length) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-80px 0px -70% 0px' });
      heads.forEach(function (h) { obs.observe(h); });
    }
  }

  function wireSideToggle(root) {
    var btn = root.querySelector('[data-side-toggle]');
    if (!btn) return;
    btn.style.display = '';
    btn.addEventListener('click', function () {
      var side = root.querySelector('#ts-side');
      if (side) side.classList.toggle('open');
    });
  }

  V.wireDownloads = wireDownloads;
  V.wireShare = wireShare;
  V.wireToc = wireToc;
})(window);
