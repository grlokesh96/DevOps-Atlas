/* ============================================================
   DevOps-Atlas — admin: dashboard, editor, upload, manage
   ============================================================ */
(function (global) {
  'use strict';
  var DA = global.DA, U = DA.util, S = DA.store;
  var A = DA.admin = {};

  function adminTabs(active) {
    var tabs = [
      ['#/admin', 'Dashboard', 'dashboard'],
      ['#/admin/new', 'Create Content', 'new'],
      ['#/admin/upload', 'Upload Content', 'upload'],
      ['#/admin/published', 'Published', 'published'],
      ['#/admin/drafts', 'Drafts', 'drafts']
    ];
    return '<nav class="admin-tabs">' + tabs.map(function (t) {
      return '<a href="' + t[0] + '"' + (t[2] === active ? ' class="active"' : '') + '>' + t[1] + '</a>';
    }).join('') + '</nav>';
  }

  function crumb(parts) {
    return '<nav class="crumb" aria-label="Breadcrumb">' + parts.map(function (p, i) {
      var sep = i ? '<span class="sep">/</span>' : '';
      return sep + (p.href ? '<a href="' + p.href + '">' + U.esc(p.label) + '</a>' : '<span>' + U.esc(p.label) + '</span>');
    }).join('') + '</nav>';
  }
  function empty(icon, title, body, cta) {
    return '<div class="empty"><div class="big">' + icon + '</div><h3>' + U.esc(title) + '</h3><p>' + U.esc(body) + '</p>' + (cta || '') + '</div>';
  }

  /* ================= DASHBOARD ================= */
  A.dashboard = {
    render: function () {
      var st = S.stats();
      var recent = S.all().sort(function (a, b) { return (b.updatedAt || b.date || '').localeCompare(a.updatedAt || a.date || ''); }).slice(0, 8);
      var uploads = S.all().filter(function (i) { return i.source === 'upload'; }).length;

      return crumb([{ label: 'Home', href: '#/' }, { label: 'Admin' }]) +
      '<div class="admin-head"><div><span class="eyebrow">Admin · V1 (no authentication)</span>' +
        '<h1>Dashboard</h1></div>' +
        '<div class="hero-cta">' +
          '<a class="btn btn-primary" href="#/admin/new">＋ Create content</a>' +
          '<a class="btn" href="#/admin/upload">⤒ Upload content</a>' +
        '</div></div>' +
      adminTabs('dashboard') +

      '<div class="banner">ℹ️ <div><strong>V1 has no authentication.</strong> Content is stored in this browser\'s local storage. ' +
        'Add auth and a backend before exposing <code>/admin</code> publicly.</div></div>' +

      '<div class="dash-stats">' +
        '<div class="dash-stat"><b>' + st.total + '</b><span>Total content items</span></div>' +
        '<div class="dash-stat pub"><b>' + st.published + '</b><span>Published</span></div>' +
        '<div class="dash-stat drafts"><b>' + st.drafts + '</b><span>Drafts</span></div>' +
        '<div class="dash-stat upload"><b>' + uploads + '</b><span>Uploaded files</span></div>' +
        '<div class="dash-stat"><b>' + st.categories + '</b><span>Categories in use</span></div>' +
        '<div class="dash-stat"><b>' + st.tags + '</b><span>Tag assignments</span></div>' +
      '</div>' +

      '<div class="panel"><h3>Quick actions</h3><p class="sub">Jump straight into a workflow.</p>' +
        '<div class="quick-actions">' +
          qa('#/admin/new', '📝', 'Create Content', 'Markdown form with live preview') +
          qa('#/admin/upload', '⤒', 'Upload Content', '.md · .mdx · .txt · .pdf') +
          qa('#/admin/drafts', '📝', 'Drafts', st.drafts + ' waiting to publish') +
          qa('#/admin/published', '✅', 'Published', st.published + ' live on the site') +
          qa('#/content', '📚', 'View public site', 'See what visitors see') +
          qa('#/commands', '⌨️', 'Command Atlas', (DA_SEED_COMMANDS || []).length + ' reference commands') +
        '</div></div>' +

      '<div class="panel"><h3>Recent content</h3><p class="sub">Newest and most recently edited.</p>' +
        contentTable(recent) + '</div>';
    },
    mount: function () {}
  };
  function qa(href, ico, title, sub) {
    return '<a class="quick-action" href="' + href + '"><span class="qa-ico">' + ico + '</span>' +
      '<span><b>' + U.esc(title) + '</b><span>' + U.esc(sub) + '</span></span></a>';
  }

  /* ================= LIST (published / drafts) ================= */
  function contentTable(list) {
    if (!list.length) return empty('📭', 'Nothing here yet', 'Create your first item to get started.', '<a class="btn btn-primary" href="#/admin/new">Create content</a>');
    return '<div class="table-wrap"><table class="ctable"><thead><tr>' +
      '<th>Title</th><th>Type</th><th>Category</th><th>Status</th><th>Updated</th><th style="text-align:right">Actions</th>' +
      '</tr></thead><tbody>' + list.map(function (i) {
        return '<tr>' +
          '<td class="t-title">' + U.esc(i.title) + '<small>' + U.esc(i.id) + (i.source === 'upload' ? ' · upload' : '') + '</small></td>' +
          '<td><span class="badge type">' + U.esc(i.type) + '</span></td>' +
          '<td>' + U.esc(i.category) + '</td>' +
          '<td><span class="badge ' + (i.status === 'published' ? 'published' : 'draft') + '">' + i.status + '</span></td>' +
          '<td class="muted">' + U.esc(U.fmtDate(i.updatedAt || i.date)) + '</td>' +
          '<td><div class="t-actions">' +
            '<a class="btn btn-sm" href="' + S.hrefFor(i) + '">View</a>' +
            '<a class="btn btn-sm" href="#/admin/edit/' + i.id + '">Edit</a>' +
            (i.status === 'draft'
              ? '<button type="button" class="btn btn-sm btn-primary" data-publish="' + i.id + '">Publish</button>'
              : '<button type="button" class="btn btn-sm" data-unpublish="' + i.id + '">Unpublish</button>') +
            '<button type="button" class="btn btn-sm btn-danger" data-delete="' + i.id + '">Delete</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function wireTable(root) {
    DA.util.$$('[data-publish]', root).forEach(function (b) {
      b.addEventListener('click', function () { setStatus(b.getAttribute('data-publish'), 'published'); });
    });
    DA.util.$$('[data-unpublish]', root).forEach(function (b) {
      b.addEventListener('click', function () { setStatus(b.getAttribute('data-unpublish'), 'draft'); });
    });
    DA.util.$$('[data-delete]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-delete');
        if (confirm('Delete “' + id + '”? This cannot be undone.')) {
          S.remove(id);
          U.toast('Deleted “' + id + '”.', 'warn');
          DA.app.refresh();
        }
      });
    });
  }
  function setStatus(id, status) {
    var it = S.get(id);
    if (!it) return;
    it.status = status;
    if (it.seedId || S.isSeed(id)) S.saveSeedEdit(it); else S.save(it);
    U.toast(status === 'published' ? 'Published — now visible on the public site.' : 'Moved to drafts — hidden from public listings.');
    DA.app.refresh();
  }

  A.published = {
    render: function () {
      var list = S.byStatus('published');
      return crumb([{ label: 'Home', href: '#/' }, { label: 'Admin', href: '#/admin' }, { label: 'Published' }]) +
        '<div class="admin-head"><div><span class="eyebrow">Admin</span><h1>Published content</h1></div>' +
        '<a class="btn btn-primary" href="#/admin/new">＋ Create content</a></div>' +
        adminTabs('published') +
        '<p class="muted" style="margin-bottom:16px">' + list.length + ' items visible on the homepage, category pages, tag pages, listings and search.</p>' +
        contentTable(list);
    },
    mount: function (root) { wireTable(root); }
  };

  A.drafts = {
    render: function () {
      var list = S.byStatus('draft');
      return crumb([{ label: 'Home', href: '#/' }, { label: 'Admin', href: '#/admin' }, { label: 'Drafts' }]) +
        '<div class="admin-head"><div><span class="eyebrow">Admin</span><h1>Drafts</h1></div>' +
        '<a class="btn btn-primary" href="#/admin/new">＋ Create content</a></div>' +
        adminTabs('drafts') +
        '<div class="banner warn">📝 <div>Drafts never appear in public content listings, search, category pages, tag pages or the homepage statistics.</div></div>' +
        (list.length ? contentTable(list)
          : empty('📝', 'No drafts', 'Everything you have created is published.', '<a class="btn btn-primary" href="#/admin/new">Create content</a>'));
    },
    mount: function (root) { wireTable(root); }
  };

  /* ================= EDITOR (create / edit) ================= */
  function blankItem() {
    return {
      id: '', type: 'Article', title: '', description: '', category: '', tags: [],
      author: 'Lokesh G', cover: '', content: '', status: 'draft', date: U.todayISO()
    };
  }

  A.editor = {
    render: function (p) {
      var editing = !!p.id;
      var item = editing ? S.get(p.id) : null;
      if (editing && !item) return empty('✂️', 'Item not found', 'It may have been deleted.', '<a class="btn" href="#/admin">Back to dashboard</a>');
      if (!editing) item = blankItem();

      var isSeed = editing && S.isSeed(p.id);
      return crumb([{ label: 'Home', href: '#/' }, { label: 'Admin', href: '#/admin' },
        { label: editing ? 'Edit' : 'Create Content' }]) +
        '<div class="admin-head"><div><span class="eyebrow">Admin · ' + (editing ? 'Editing' : 'New item') + '</span>' +
          '<h1>' + (editing ? U.esc(item.title) : 'Create content') + '</h1></div>' +
          '<div class="hero-cta">' +
            (editing ? '<a class="btn" href="' + S.hrefFor(item) + '">👁 Preview</a>' : '') +
            '<a class="btn btn-ghost" href="#/admin">← Dashboard</a>' +
          '</div></div>' +
        adminTabs(editing ? '' : 'new') +
        (isSeed ? '<div class="banner">🧩 <div>This is a <strong>built-in seed</strong> item. Editing saves an override in your browser; the original seed data stays untouched.</div></div>' : '') +
        '<div id="form-error" class="form-error" hidden></div>' +

        '<div class="form-grid" style="margin-bottom:18px">' +
          field('type', 'Content Type', '<select id="f-type">' + S.TYPES.map(function (t) {
            return '<option' + (item.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') +
          field('status', 'Status', '<select id="f-status">' + S.STATUSES.map(function (t) {
            var v = t.toLowerCase();
            return '<option value="' + v + '"' + (item.status === v ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') +
          field('title', 'Title <span class="req">*</span>', '<input id="f-title" value="' + U.esc(item.title) + '" placeholder="Kubernetes Deployment Strategies" required>') +
          field('date', 'Publish Date', '<input id="f-date" type="date" value="' + U.esc(item.date) + '">') +
          field('description', 'Description', '<textarea id="f-desc" rows="2" placeholder="One-line summary shown in cards and search.">' + U.esc(item.description) + '</textarea>', true) +
          field('category', 'Category', '<input id="f-cat" list="cat-list" value="' + U.esc(item.category) + '" placeholder="Kubernetes"><datalist id="cat-list">' +
            S.categories().map(function (c) { return '<option value="' + U.esc(c.name) + '">'; }).join('') + '</datalist>') +
          field('tags', 'Tags', '<input id="f-tags" value="' + U.esc(item.tags.join(', ')) + '" placeholder="kubernetes, deployments, sre">') +
          field('author', 'Author', '<input id="f-author" value="' + U.esc(item.author) + '" placeholder="Your name">') +
          field('cover', 'Cover Image', '<input id="f-cover" value="' + U.esc(item.cover || '') + '" placeholder="Emoji (🚢) or image URL">') +
          field('slug', 'Slug / ID', '<input id="f-id" value="' + U.esc(item.id) + '" placeholder="auto-generated-from-title"' + (editing ? ' readonly' : '') + '>') +
        '</div>' +

        '<div class="field full" style="margin-bottom:14px"><label>Content (Markdown) <span class="req">*</span></label></div>' +
        '<div class="editor" id="editor">' +
          '<div class="editor-toolbar">' +
            tb('B', 'bold', '**bold**', 'Bold') + tb('I', 'italic', '*italic*', 'Italic') +
            '<span class="sep"></span>' +
            tb('H1', 'h1', '# Heading 1', 'Heading 1') + tb('H2', 'h2', '## Heading 2', 'Heading 2') + tb('H3', 'h3', '### Heading 3', 'Heading 3') +
            '<span class="sep"></span>' +
            tb('•', 'ul', '- item\n- item', 'Bullet list') + tb('1.', 'ol', '1. item\n2. item', 'Numbered list') + tb('❝', 'quote', '> quote', 'Quote') +
            '<span class="sep"></span>' +
            tb('🔗', 'link', '[text](https://example.com)', 'Link') + tb('🖼', 'img', '![alt](https://example.com/img.png)', 'Image') +
            tb('&lt;/&gt;', 'code', '```bash\ncommand\n```', 'Code block') + tb('⌨', 'inline', '`code`', 'Inline code') +
            tb('▦', 'table', '| A | B |\n| --- | --- |\n| 1 | 2 |', 'Table') +
            '<span class="grow"></span>' +
            '<button type="button" id="btn-md-help" title="Markdown help">?</button>' +
          '</div>' +
          '<div class="editor-tabs">' +
            '<button type="button" class="active" data-pane-tab="edit">Editor</button>' +
            '<button type="button" data-pane-tab="preview">Preview</button>' +
          '</div>' +
          '<div class="editor-split">' +
            '<div class="editor-pane active" data-pane="edit"><div class="pane-label"><span>Editor</span><span id="md-stats" class="mono"></span></div>' +
              '<textarea id="f-content" spellcheck="true" placeholder="Write Markdown here…\n\n# Heading\n\n- bullet\n- point\n\n```bash\nkubectl get pods -A\n```">' + U.esc(item.content) + '</textarea></div>' +
            '<div class="editor-pane" data-pane="preview"><div class="pane-label"><span>Preview</span><span class="mono">same as published</span></div>' +
              '<div class="editor-preview prose" id="preview"></div></div>' +
          '</div>' +
        '</div>' +

        '<div class="form-actions">' +
          '<button type="button" class="btn btn-primary" id="btn-save">' + (item.status === 'published' ? 'Save & Publish' : 'Save Draft') + '</button>' +
          '<button type="button" class="btn" id="btn-save-draft">Save Draft</button>' +
          '<button type="button" class="btn btn-primary" id="btn-publish">Publish</button>' +
          (editing ? '<button type="button" class="btn" id="btn-preview">Preview</button>' : '') +
          (editing ? '<button type="button" class="btn btn-danger" id="btn-delete">Delete</button>' : '') +
          '<span class="spacer"></span>' +
          (editing ? '<a class="btn btn-ghost" href="' + S.hrefFor(item) + '">View live →</a>' : '') +
        '</div>';
    },

    mount: function (root, p) {
      var editing = !!p.id;
      var original = editing ? S.get(p.id) : null;
      var q = function (s) { return root.querySelector(s); };
      var ta = q('#f-content'), prev = q('#preview'), stats = q('#md-stats');

      function current() {
        var tags = q('#f-tags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var id = editing ? original.id : (q('#f-id').value.trim() || U.slugify(q('#f-title').value));
        return {
          id: id,
          seedId: original && original.seedId ? original.seedId : (editing && S.isSeed(id) ? id : undefined),
          type: q('#f-type').value,
          title: q('#f-title').value.trim(),
          description: q('#f-desc').value.trim(),
          category: q('#f-cat').value.trim() || 'General',
          tags: tags,
          author: q('#f-author').value.trim() || 'DevOps-Atlas',
          cover: q('#f-cover').value.trim(),
          content: ta.value,
          status: q('#f-status').value,
          date: q('#f-date').value || U.todayISO(),
          updatedAt: U.todayISO()
        };
      }

      function validate(it, forPublish) {
        var errs = [];
        if (!it.title) errs.push('Title is required.');
        if (!it.content.trim()) errs.push('Content is required.');
        if (forPublish && it.status !== 'published') errs.push('Status must be Published.');
        if (!editing && S.takenId(it.id)) errs.push('Slug “' + it.id + '” already exists — change the slug field.');
        return errs;
      }
      function showErrs(errs) {
        var box = q('#form-error');
        if (!errs.length) { box.hidden = true; return false; }
        box.innerHTML = '<strong>Fix before saving:</strong><ul style="margin:6px 0 0 18px">' + errs.map(function (e) { return '<li>' + U.esc(e) + '</li>'; }).join('') + '</ul>';
        box.hidden = false;
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }

      function doSave(forPublish) {
        var it = current();
        if (forPublish) it.status = 'published';
        if (showErrs(validate(it, false))) return;
        var ok;
        if (it.seedId) ok = S.saveSeedEdit(it);
        else ok = S.save(it);
        if (!ok) return;
        U.toast(it.status === 'published' ? 'Published ✓ — visible on the public site.' : 'Draft saved ✓ — hidden from public listings.');
        location.hash = '#/admin';
      }

      /* live preview */
      function renderPreview() {
        var html = U.renderMd(ta.value);
        prev.innerHTML = html || '<p class="muted">Nothing to preview yet.</p>';
        var w = U.stripMd(ta.value).split(/\s+/).filter(Boolean).length;
        stats.textContent = w + ' words · ' + U.readingTime(ta.value) + ' min';
      }
      var debounced = U.debounce(renderPreview, 180);
      ta.addEventListener('input', debounced);
      renderPreview();

      /* toolbar */
      var wraps = {
        bold: ['**', '**'], italic: ['*', '*'], h1: ['# ', ''], h2: ['## ', ''], h3: ['### ', ''],
        ul: ['- ', ''], ol: ['1. ', ''], quote: ['> ', ''],
        link: ['[', '](https://example.com)'], img: ['![', '](https://example.com/img.png)'],
        code: ['```bash\n', '\n```'], inline: ['`', '`'],
        table: ['| A | B |\n| --- | --- |\n| ', ' | 2 |']
      };
      DA.util.$$('.editor-toolbar [data-md]', root).forEach(function (b) {
        b.addEventListener('click', function () {
          var key = b.getAttribute('data-md'), w = wraps[key];
          if (!w) return;
          var s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e);
          if (key === 'ul' || key === 'ol') {
            var lines = (sel || 'item').split('\n');
            var out = lines.map(function (l, i) { return (key === 'ol' ? (i + 1) + '. ' : '- ') + l.replace(/^([-*]\s|\d+\.\s)/, ''); }).join('\n');
            ta.setRangeText(w[0] + out, s, e, 'end');
          } else {
            ta.setRangeText(w[0] + (sel || '') + w[1], s, e, 'end');
          }
          ta.focus(); renderPreview();
        });
      });
      var help = q('#btn-md-help');
      if (help) help.addEventListener('click', function () {
        U.toast('Markdown: # headings, **bold**, *italic*, - lists, > quote, `code`, ```blocks```, [link](url), | tables |');
      });

      /* mobile editor tabs */
      DA.util.$$('[data-pane-tab]', root).forEach(function (b) {
        b.addEventListener('click', function () {
          var which = b.getAttribute('data-pane-tab');
          DA.util.$$('[data-pane-tab]', root).forEach(function (x) { x.classList.toggle('active', x === b); });
          DA.util.$$('[data-pane]', root).forEach(function (x) { x.classList.toggle('active', x.getAttribute('data-pane') === which); });
          if (which === 'preview') renderPreview();
        });
      });

      q('#btn-save').addEventListener('click', function () { doSave(false); });
      q('#btn-save-draft').addEventListener('click', function () { var it = current(); it.status = 'draft'; if (showErrs(validate(it, false))) return; (it.seedId ? S.saveSeedEdit(it) : S.save(it)); U.toast('Draft saved ✓'); location.hash = '#/admin/drafts'; });
      q('#btn-publish').addEventListener('click', function () { doSave(true); });
      var pv = q('#btn-preview');
      if (pv) pv.addEventListener('click', function () {
        var it = current();
        if (showErrs(validate(it, false))) return;
        if (it.seedId) S.saveSeedEdit(it); else S.save(it);
        location.hash = '#/preview/' + it.id;
      });
      var del = q('#btn-delete');
      if (del) del.addEventListener('click', function () {
        if (confirm('Delete “' + original.title + '”?')) { S.remove(original.id); U.toast('Deleted.', 'warn'); location.hash = '#/admin'; }
      });
      q('#f-title').addEventListener('blur', function () {
        var idf = q('#f-id');
        if (!editing && !idf.value.trim()) { idf.value = U.slugify(q('#f-title').value); }
      });
    }
  };

  function field(name, label, control, full) {
    return '<div class="field' + (full ? ' full' : '') + '"><label for="f-' + name + '">' + label + '</label>' + control + '</div>';
  }
  function tb(txt, key, snippet, title) {
    return '<button type="button" data-md="' + key + '" title="' + title + '">' + txt + '</button>';
  }

  /* ================= PREVIEW ROUTE ================= */
  A.preview = {
    render: function (p) {
      var item = S.get(p.id);
      if (!item) return empty('👁', 'Nothing to preview', 'Save an item first.', '<a class="btn" href="#/admin">Dashboard</a>');
      var html = U.renderMd(item.content);
      var toc = U.tocFromHtml(html);
      return crumb([{ label: 'Admin', href: '#/admin' }, { label: 'Preview' }]) +
        '<div class="banner warn">👁 <div><strong>Preview mode.</strong> This renders exactly like the published page. ' +
        'Status: <strong>' + U.esc(item.status) + '</strong>' +
        (item.status === 'draft' ? ' — drafts are hidden from all public listings.' : ' — live on the public site.') + '</div></div>' +
        '<div class="hero-cta" style="margin-bottom:22px">' +
          '<a class="btn btn-primary" href="#/admin/edit/' + item.id + '">Edit</a>' +
          (item.status === 'draft'
            ? '<button type="button" class="btn" id="pv-publish">Publish now</button>'
            : '<button type="button" class="btn" id="pv-unpublish">Move to drafts</button>') +
          '<a class="btn" href="' + S.hrefFor(item) + '">Open as visitor</a>' +
        '</div>' +
        '<div class="article-layout"><div class="article-main">' +
          '<header class="article-head"><div class="chips"><span class="badge type">' + U.esc(item.type) + '</span>' +
            '<span class="badge ' + (item.status === 'published' ? 'published' : 'draft') + '">' + item.status + '</span>' +
            '<span class="chip">' + U.esc(item.category) + '</span></div>' +
            '<h1>' + U.esc(item.title) + '</h1><p class="lead">' + U.esc(item.description) + '</p>' +
            '<div class="article-meta"><span class="who"><span class="avatar">' + U.esc(U.initials(item.author)) + '</span>' + U.esc(item.author) + '</span>' +
            '<span>📅 ' + U.esc(U.fmtDate(item.date)) + '</span><span>⏱ ' + U.readingTime(item.content) + ' min read</span></div></header>' +
          '<div class="prose">' + html + '</div>' +
        '</div><aside class="toc-desktop">' + U.tocHtml(toc, '') + '</aside></div>';
    },
    mount: function (root, p) {
      DA.views.wireToc(root);
      var b = root.querySelector('#pv-publish');
      if (b) b.addEventListener('click', function () {
        var it = S.get(p.id); it.status = 'published';
        (it.seedId || S.isSeed(it.id)) ? S.saveSeedEdit(it) : S.save(it);
        U.toast('Published ✓'); DA.app.refresh();
      });
      var u = root.querySelector('#pv-unpublish');
      if (u) u.addEventListener('click', function () {
        var it = S.get(p.id); it.status = 'draft';
        (it.seedId || S.isSeed(it.id)) ? S.saveSeedEdit(it) : S.save(it);
        U.toast('Moved to drafts.', 'warn'); DA.app.refresh();
      });
    }
  };

  /* ================= UPLOAD ================= */
  A.upload = {
    render: function () {
      return crumb([{ label: 'Home', href: '#/' }, { label: 'Admin', href: '#/admin' }, { label: 'Upload Content' }]) +
        '<div class="admin-head"><div><span class="eyebrow">Admin</span><h1>Upload content</h1></div>' +
        '<a class="btn btn-ghost" href="#/admin">← Dashboard</a></div>' +
        adminTabs('upload') +
        '<div class="dropzone" id="dz" tabindex="0" role="button" aria-label="Upload files">' +
          '<div class="dz-ico">📂</div>' +
          '<h3>Drag &amp; Drop File Here</h3>' +
          '<p>Markdown, plain text and PDF files</p>' +
          '<div class="or">or</div>' +
          '<span class="btn btn-primary" id="dz-choose">Choose File</span>' +
          '<input type="file" id="dz-input" multiple accept=".md,.mdx,.txt,.pdf" hidden>' +
          '<div class="dz-formats"><span class="dz-format">.md</span><span class="dz-format">.mdx</span>' +
            '<span class="dz-format">.txt</span><span class="dz-format">.pdf</span></div>' +
        '</div>' +
        '<div class="panel" style="margin-top:18px"><h3>What happens next</h3>' +
          '<div class="quick-actions">' +
            qa('#', '📝', '.md / .mdx', 'Frontmatter parsed → metadata + preview') +
            qa('#', '📄', '.txt', 'Metadata + text preview + download') +
            qa('#', '📕', '.pdf', 'Metadata + browser preview + download') +
          '</div></div>' +
        '<div class="upload-list" id="up-list"></div>' +
        '<div id="up-preview"></div>';
    },
    mount: function (root) {
      var dz = root.querySelector('#dz'), input = root.querySelector('#dz-input'),
          list = root.querySelector('#up-list'), preview = root.querySelector('#up-preview');

      root.querySelector('#dz-choose').addEventListener('click', function (e) { e.stopPropagation(); input.click(); });
      dz.addEventListener('click', function () { input.click(); });
      dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
      ['dragenter', 'dragover'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('over'); });
      });
      dz.addEventListener('drop', function (e) { handle(e.dataTransfer.files); });
      input.addEventListener('change', function () { handle(input.files); input.value = ''; });

      function ext(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; }

      function itemRow(file) {
        var row = document.createElement('div');
        row.className = 'upload-item';
        row.innerHTML = '<span class="ui-ico">⏳</span><div class="ui-main">' +
          '<div class="ui-name">' + U.esc(file.name) + '</div>' +
          '<div class="ui-meta">' + U.bytes(file.size) + ' · reading…</div>' +
          '<div class="progress"><i></i></div></div>';
        list.appendChild(row);
        return row;
      }
      function fail(row, msg) {
        row.classList.add('err');
        row.querySelector('.ui-ico').textContent = '⚠️';
        row.querySelector('.ui-msg') || row.querySelector('.ui-main').insertAdjacentHTML('beforeend', '<div class="ui-msg"></div>');
        row.querySelector('.ui-msg').textContent = msg;
        var pr = row.querySelector('.progress'); if (pr) pr.remove();
      }
      function ok(row, msg) {
        row.classList.add('ok');
        row.querySelector('.ui-ico').textContent = '✅';
        row.querySelector('.ui-main').insertAdjacentHTML('beforeend', '<div class="ui-msg">' + U.esc(msg) + '</div>');
        var bar = row.querySelector('.progress i'); if (bar) bar.style.width = '100%';
        var pr = row.querySelector('.progress'); if (pr) setTimeout(function () { pr.remove(); }, 700);
      }

      function handle(files) {
        files = Array.prototype.slice.call(files || []);
        if (!files.length) return;
        files.forEach(function (file) { process(file); });
      }

      function process(file) {
        var row = itemRow(file);
        var e = ext(file.name);
        var allowed = ['md', 'mdx', 'txt', 'pdf'];

        if (allowed.indexOf(e) < 0) {
          fail(row, 'Unsupported file type “.' + e + '”. Allowed: .md, .mdx, .txt, .pdf');
          return;
        }
        var max = S.MAX_BYTES[e] || 524288;
        if (file.size > max) {
          fail(row, 'File too large (' + U.bytes(file.size) + '). Maximum for .' + e + ' is ' + U.bytes(max) + '.');
          return;
        }

        var bar = row.querySelector('.progress i');
        var pct = 0;
        var tick = setInterval(function () { pct = Math.min(90, pct + 15); if (bar) bar.style.width = pct + '%'; }, 90);

        var reader = new FileReader();
        reader.onerror = function () { clearInterval(tick); fail(row, 'Could not read the file.'); };
        reader.onload = function () {
          clearInterval(tick);
          if (bar) bar.style.width = '100%';
          try {
            if (e === 'md' || e === 'mdx') ingestMarkdown(file, reader.result, row);
            else if (e === 'txt') ingestText(file, reader.result, row);
            else ingestPdf(file, reader.result, row);
          } catch (err) {
            console.error(err);
            fail(row, 'Failed to process: ' + (err.message || err));
          }
        };
        if (e === 'pdf') reader.readAsDataURL(file);
        else reader.readAsText(file);
      }

      function baseId(name) {
        var base = U.slugify(name.replace(/\.[^.]+$/, ''));
        return U.uniqueSlug(base, function (s) { return !!S.get(s); });
      }

      function ingestMarkdown(file, text, row) {
        var fm = U.parseFrontmatter(text);
        var d = fm.data || {};
        var title = d.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        var body = (fm.raw ? fm.body : text).trim();
        var item = {
          id: baseId(title),
          type: normaliseType(d.type),
          title: String(title),
          description: d.description || U.excerpt(body, 150),
          category: d.category || 'General',
          tags: Array.isArray(d.tags) ? d.tags : (d.tags ? String(d.tags).split(/[,\s]+/) : []),
          author: d.author || 'DevOps-Atlas',
          cover: '',
          content: body,
          status: d.published === false || d.published === 'false' ? 'draft' : (d.published === true || d.published === 'true' ? 'published' : 'draft'),
          date: d.date || U.todayISO(),
          difficulty: d.difficulty || '',
          source: 'upload',
          fileMeta: { name: file.name, size: file.size, kind: 'md' },
          updatedAt: U.todayISO()
        };
        if (!S.save(item)) { fail(row, 'Browser storage is full — the file is too large to persist.'); return; }
        ok(row, 'Frontmatter parsed → “' + item.title + '” (' + item.type + ', ' + item.status + '). Saved as draft preview.');
        addPreview(item);
      }

      function ingestText(file, text, row) {
        var item = {
          id: baseId(file.name),
          type: 'Note',
          title: file.name.replace(/\.[^.]+$/, ''),
          description: U.excerpt(text, 150) || 'Plain text upload',
          category: 'Uploads',
          tags: ['upload', 'txt'],
          author: 'DevOps-Atlas',
          cover: '📄',
          content: '## File preview\n\n```\n' + text.slice(0, 4000) + (text.length > 4000 ? '\n… (truncated)' : '') + '\n```\n\n## Metadata\n\n| Field | Value |\n| --- | --- |\n| Original file | `' + file.name + '` |\n| Size | ' + U.bytes(file.size) + ' |\n| Type | text/plain |',
          status: 'draft',
          date: U.todayISO(),
          source: 'upload',
          fileMeta: { name: file.name, size: file.size, kind: 'txt', data: text },
          updatedAt: U.todayISO()
        };
        if (!S.save(item)) { fail(row, 'Browser storage is full — the file is too large to persist.'); return; }
        ok(row, 'Text stored · metadata saved · original downloadable.');
        addPreview(item, text);
      }

      function ingestPdf(file, dataUrl, row) {
        var item = {
          id: baseId(file.name),
          type: 'Note',
          title: file.name.replace(/\.[^.]+$/, ''),
          description: 'PDF upload — ' + U.bytes(file.size),
          category: 'Uploads',
          tags: ['upload', 'pdf'],
          author: 'DevOps-Atlas',
          cover: '📕',
          content: '## PDF document\n\n| Field | Value |\n| --- | --- |\n| Original file | `' + file.name + '` |\n| Size | ' + U.bytes(file.size) + ' |\n| Type | application/pdf |\n\nUse the **Download** button below to retrieve the original file.',
          status: 'draft',
          date: U.todayISO(),
          source: 'upload',
          fileMeta: { name: file.name, size: file.size, kind: 'pdf', data: dataUrl },
          updatedAt: U.todayISO()
        };
        if (!S.save(item)) { fail(row, 'PDF is too large for browser storage (limit 1.5 MB).'); return; }
        ok(row, 'PDF stored · metadata saved · original downloadable.');
        addPreview(item, null, dataUrl);
      }

      function normaliseType(t) {
        if (!t) return 'Article';
        t = String(t).toLowerCase();
        var found = S.TYPES.filter(function (x) { return x.toLowerCase() === t; })[0];
        return found || 'Article';
      }

      function addPreview(item, text, dataUrl) {
        var wrap = document.createElement('div');
        wrap.className = 'panel';
        wrap.style.marginTop = '16px';
        var head = '<h3>Preview — ' + U.esc(item.title) + '</h3>' +
          '<p class="sub"><span class="badge ' + (item.status === 'published' ? 'published' : 'draft') + '">' + item.status + '</span> ' +
          '<span class="badge type">' + U.esc(item.type) + '</span> · ' + U.esc(item.category) +
          (item.tags.length ? ' · #' + U.esc(item.tags.join(', #')) : '') + '</p>';

        var bodyHtml;
        if (dataUrl && /\.pdf$/i.test(item.fileMeta.name)) {
          bodyHtml = '<iframe src="' + dataUrl + '" style="width:100%;height:520px;border:1px solid var(--border);border-radius:10px;background:#fff" title="PDF preview"></iframe>';
        } else {
          bodyHtml = '<div class="prose">' + U.renderMd(item.content) + '</div>';
        }
        wrap.innerHTML = head + bodyHtml +
          '<div class="hero-cta" style="margin-top:16px">' +
            '<a class="btn btn-primary" href="#/admin/edit/' + item.id + '">Edit</a>' +
            '<a class="btn" href="' + S.hrefFor(item) + '">Open</a>' +
            (item.fileMeta && item.fileMeta.data
              ? '<button type="button" class="btn" data-dl-original="' + item.id + '">⤓ Download original</button>' : '') +
            '<a class="btn btn-ghost" href="#/admin">Done</a>' +
          '</div>';
        preview.appendChild(wrap);

        var btn = wrap.querySelector('[data-dl-original]');
        if (btn) btn.addEventListener('click', function () {
          var it = S.get(btn.getAttribute('data-dl-original'));
          if (!it || !it.fileMeta || !it.fileMeta.data) return;
          var isPdf = it.fileMeta.kind === 'pdf';
          var blob = isPdf ? dataUrlToBlob(it.fileMeta.data) : new Blob([it.fileMeta.data], { type: 'text/plain;charset=utf-8' });
          U.saveBlob(blob, it.fileMeta.name);
        });
      }
      function dataUrlToBlob(dataUrl) {
        var parts = dataUrl.split(','), bin = atob(parts[1]), arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new Blob([arr], { type: 'application/pdf' });
      }
    }
  };
})(window);
