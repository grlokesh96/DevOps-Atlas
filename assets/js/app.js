/* ============================================================
   DevOps-Atlas — router, shell, global behaviour
   ============================================================ */
(function (global) {
  'use strict';
  var DA = global.DA, U = DA.util, S = DA.store;
  var viewRoot = document.getElementById('view');

  var app = DA.app = {};

  /* ---------------- routing ---------------- */
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var query = {};
    if (qi >= 0) new URLSearchParams(h.slice(qi + 1)).forEach(function (v, k) { query[k] = v; });
    var seg = path.split('/').filter(Boolean);
    return { path: path, seg: seg, q: query };
  }

  function resolve(r) {
    var s = r.seg, q = r.q;
    if (!s.length) return { view: DA.views.home, params: q };
    switch (s[0]) {
      case 'content':
        return { view: DA.views.content, params: { q: q.q || '', type: q.type || 'All', category: q.category || 'All', sort: q.sort || '' } };
      case 'read':
        return { view: DA.views.read, params: { id: decodeURIComponent(s[1] || '') } };
      case 'troubleshooting':
        return { view: DA.views.troubleshooting, params: { id: s[1] ? decodeURIComponent(s[1]) : null } };
      case 'commands':
        return { view: DA.views.commands, params: { q: q.q || '', cat: q.cat || 'All' } };
      case 'labs':
        return { view: DA.views.labs, params: { id: s[1] ? decodeURIComponent(s[1]) : null } };
      case 'interview':
        return { view: DA.views.interview, params: { id: s[1] ? decodeURIComponent(s[1]) : null } };
      case 'search':
        return { view: DA.views.search, params: { q: q.q || '' } };
      case 'category':
        return { view: DA.views.content, params: { category: findCategory(decodeURIComponent(s[1] || '')), type: 'All', q: '', sort: '' }, label: 'Category' };
      case 'tag':
        return { view: DA.views.content, params: { tag: decodeURIComponent(s[1] || ''), type: 'All', q: '', sort: '' }, label: 'Tag' };
      case 'admin':
        if (s[1] === 'new') return { view: DA.admin.editor, params: {} };
        if (s[1] === 'edit') return { view: DA.admin.editor, params: { id: decodeURIComponent(s[2] || '') } };
        if (s[1] === 'upload') return { view: DA.admin.upload, params: {} };
        if (s[1] === 'published') return { view: DA.admin.published, params: {} };
        if (s[1] === 'drafts') return { view: DA.admin.drafts, params: {} };
        return { view: DA.admin.dashboard, params: {} };
      case 'preview':
        return { view: DA.admin.preview, params: { id: decodeURIComponent(s[1] || '') } };
      default:
        return { view: null, params: {} };
    }
  }

  function findCategory(slug) {
    var c = S.categories().filter(function (x) { return x.slug === slug; })[0];
    return c ? c.name : 'All';
  }

  var lastRoute = null;
  function render() {
    var r = parseHash();
    var target = resolve(r);

    /* in-page anchors (TOC headings) should not re-render */
    if (r.path && !r.path && lastRoute) return;

    if (!target.view) {
      viewRoot.innerHTML = DA.views.components.emptyHtml('🧭', 'Page not found', 'The page you are looking for does not exist.',
        '<div class="hero-cta"><a class="btn btn-primary" href="#/">Go home</a><a class="btn" href="#/content">Browse content</a></div>');
    } else {
      /* tag filter support on the content view */
      if (r.seg[0] === 'tag') target.params.tag = decodeURIComponent(r.seg[1] || '');
      try {
        viewRoot.innerHTML = target.view.render(target.params);
      } catch (e) {
        console.error(e);
        viewRoot.innerHTML = '<div class="empty"><div class="big">⚠️</div><h3>Something went wrong</h3><p class="mono">' + U.esc(e.message) + '</p></div>';
      }
      if (target.view.mount) {
        try { target.view.mount(viewRoot, target.params); } catch (e) { console.error('mount failed', e); }
      }
    }

    document.title = titleFor(r, target) + ' · DevOps-Atlas';
    markNav(r);
    closeMobileNav();
    if (!inPageAnchor()) window.scrollTo(0, 0);
    viewRoot.focus({ preventScroll: true });
    lastRoute = r;
    closeSearch();
  }

  function inPageAnchor() { return false; }

  function titleFor(r, target) {
    var s = r.seg;
    if (!s.length) return 'Learn. Build. Troubleshoot. Master.';
    if (s[0] === 'read' || s[0] === 'preview') { var i = S.get(decodeURIComponent(s[1] || '')); return i ? i.title : 'Content'; }
    if (s[0] === 'troubleshooting' && s[1]) { var t = S.get(decodeURIComponent(s[1])); return t ? t.title + ' — Troubleshooting' : 'Troubleshooting'; }
    if (s[0] === 'labs' && s[1]) { var l = S.get(decodeURIComponent(s[1])); return l ? l.title + ' — Lab' : 'Labs'; }
    if (s[0] === 'interview' && s[1]) return 'Interview Prep';
    return { content: 'Content', troubleshooting: 'Troubleshooting Library', commands: 'Command Atlas', labs: 'Labs', interview: 'Interview Prep', admin: 'Admin', search: 'Search', category: 'Category', tag: 'Tag' }[s[0]] || 'DevOps-Atlas';
  }

  function markNav(r) {
    var key = r.seg[0] || 'home';
    if (key === 'read' || key === 'category' || key === 'tag' || key === 'search') key = 'content';
    DA.util.$$('#mainnav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === key);
    });
  }

  app.refresh = function () { render(); };

  /* ---------------- heading anchors keep the route ---------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#/"]');
    if (!a) return;
    var href = a.getAttribute('href');
    /* let the browser handle hash navigation; router listens to hashchange */
    if (href === location.hash) { e.preventDefault(); render(); }
  });

  /* ---------------- code copy (delegated) ---------------- */
  document.addEventListener('click', function (e) {
    var cb = e.target.closest('[data-copy]');
    if (cb) {
      var block = cb.closest('.codeblock');
      var code = block ? block.querySelector('code') : null;
      if (!code) return;
      U.copyText(code.innerText).then(function () {
        cb.textContent = 'Copied'; cb.classList.add('done');
        setTimeout(function () { cb.textContent = 'Copy'; cb.classList.remove('done'); }, 1600);
      }).catch(function () { U.toast('Copy failed — select manually.', 'err'); });
      return;
    }
    var cc = e.target.closest('[data-copy-text]');
    if (cc) {
      U.copyText(cc.getAttribute('data-copy-text')).then(function () {
        cc.textContent = 'Copied'; cc.classList.add('done');
        setTimeout(function () { cc.textContent = 'Copy'; cc.classList.remove('done'); }, 1600);
      });
    }
  });

  /* ---------------- global search ---------------- */
  var searchToggle = document.getElementById('search-toggle');
  var searchbar = document.getElementById('searchbar');
  var searchInput = document.getElementById('global-search');
  var searchResults = document.getElementById('search-results');

  function openSearch() {
    searchbar.hidden = false;
    searchInput.focus();
    searchInput.select();
    if (searchInput.value) runSearch();
  }
  function closeSearch() { searchbar.hidden = true; }
  searchToggle.addEventListener('click', function () { searchbar.hidden ? openSearch() : closeSearch(); });

  function runSearch() {
    var q = searchInput.value.trim();
    if (!q) { searchResults.innerHTML = ''; return; }
    var res = S.search(q);
    if (!res.length) { searchResults.innerHTML = '<div class="sr-empty">No matches for “' + U.esc(q) + '”</div>'; return; }
    searchResults.innerHTML = res.map(function (r) {
      return '<a class="sr-item" href="' + r.href + '"><span class="sr-kind">' + U.esc(r.kind) + '</span>' +
        '<span style="min-width:0"><span class="sr-title">' + U.esc(r.title) + '</span>' +
        '<span class="sr-desc">' + U.esc(r.desc) + '</span></span></a>';
    }).join('');
  }
  searchInput.addEventListener('input', U.debounce(runSearch, 140));
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var first = searchResults.querySelector('a');
      if (first && !searchInput.value.includes(' ')) { location.hash = first.getAttribute('href'); }
      else { location.hash = '#/search' + U.qs({ q: searchInput.value.trim() }); }
    }
    if (e.key === 'Escape') closeSearch();
    if (e.key === 'ArrowDown') { e.preventDefault(); var f = searchResults.querySelector('a'); if (f) f.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (searchbar.hidden) return;
    if (!searchbar.contains(e.target) && e.target !== searchToggle && !searchToggle.contains(e.target)) closeSearch();
  });

  /* keyboard shortcuts */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (e.key === '/' && !typing) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape' && !searchbar.hidden) closeSearch();
  });

  /* ---------------- mobile nav ---------------- */
  var burger = document.getElementById('nav-burger');
  var nav = document.getElementById('mainnav');
  function closeMobileNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMobileNav(); });

  /* ---------------- misc shell ---------------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  var toTop = document.getElementById('to-top');
  window.addEventListener('scroll', function () {
    toTop.hidden = window.pageYOffset < 500;
  }, { passive: true });
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  window.addEventListener('hashchange', render);

  /* boot */
  if (!location.hash) location.hash = '#/';
  render();
})(window);
