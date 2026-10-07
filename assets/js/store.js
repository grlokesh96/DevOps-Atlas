/* ============================================================
   DevOps-Atlas — content store
   Seed content stays in memory; user-created / uploaded / edited
   content persists in localStorage.
   ============================================================ */
(function (global) {
  'use strict';
  var DA = global.DA, U = DA.util;
  var KEY = 'da.content.v1';
  var META = 'da.meta.v1';

  var TYPES = ['Article', 'Blog', 'Note', 'Post', 'Lab', 'Troubleshooting'];
  var STATUSES = ['Draft', 'Published'];
  var MAX_BYTES = { md: 524288, mdx: 524288, txt: 524288, pdf: 1572864 };

  function readJSON(k, fb) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; }
    catch (e) { return fb; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { DA.util.toast('Storage full — content too large to save.', 'err'); return false; }
  }

  function seedAll() {
    var out = [];
    (global.DA_SEED_ARTICLES || []).forEach(function (a) { out.push(normalize(a, 'seed')); });
    (global.DA_SEED_TROUBLESHOOTING || []).forEach(function (t) {
      out.push(normalize({
        id: t.id, type: 'Troubleshooting', status: 'published', date: '2025-09-15',
        title: t.title, description: t.description, category: t.group,
        tags: (t.tags || []).concat(['troubleshooting']), author: 'Lokesh G',
        cover: '🚨', content: t.content, severity: t.severity, tsGroup: t.group
      }, 'seed'));
    });
    (global.DA_SEED_LABS || []).forEach(function (l) {
      var o = {}; for (var k in l) o[k] = l[k];
      o.type = 'Lab'; o.category = l.group; o.author = o.author || 'Lokesh G';
      o.tags = (l.tags || []).concat(['lab']);
      out.push(normalize(o, 'seed'));
    });
    return out;
  }

  function normalize(item, source) {
    var o = {};
    for (var k in item) o[k] = item[k];
    o.id = o.id || U.slugify(o.title || 'untitled');
    o.type = TYPES.indexOf(o.type) >= 0 ? o.type : 'Article';
    o.status = (String(o.status || '').toLowerCase() === 'draft') ? 'draft' : 'published';
    o.title = o.title || 'Untitled';
    o.description = o.description || U.excerpt(o.content, 150);
    o.category = o.category || 'General';
    o.tags = Array.isArray(o.tags) ? o.tags.filter(Boolean) : [];
    o.author = o.author || 'DevOps-Atlas';
    o.date = o.date || U.todayISO();
    o.content = o.content || '';
    o.source = source || 'user';
    o.updatedAt = o.updatedAt || o.date;
    return o;
  }

  function userItems() { return readJSON(KEY, []); }
  function persist(arr) { return writeJSON(KEY, arr); }

  function all() {
    var byId = {}, order = [];
    seedAll().forEach(function (s) { byId[s.id] = s; order.push(s.id); });
    userItems().forEach(function (u) {
      if (u.__deleted) { delete byId[u.seedId || u.id]; return; }
      var target = u.seedId;
      if (target && byId[target]) {
        var merged = {};
        for (var k in byId[target]) merged[k] = byId[target][k];
        for (var j in u) if (j !== 'seedId' && j !== '__deleted') merged[j] = u[j];
        merged.id = byId[target].id;
        merged.source = 'seed-edited';
        byId[target] = merged;
      } else if (!target) {
        if (!byId[u.id]) order.push(u.id);
        byId[u.id] = u;
      }
    });
    var out = [];
    order.forEach(function (id) { if (byId[id]) out.push(byId[id]); });
    return out.map(function (i) { return normalize(i, i.source); });
  }

  function get(id) {
    var all_ = all();
    for (var i = 0; i < all_.length; i++) if (all_[i].id === id) return all_[i];
    return null;
  }

  function isSeed(id) {
    return (global.DA_SEED_ARTICLES || []).some(function (a) { return a.id === id; }) ||
      (global.DA_SEED_TROUBLESHOOTING || []).some(function (a) { return a.id === id; }) ||
      (global.DA_SEED_LABS || []).some(function (a) { return a.id === id; });
  }

  function takenId(base, ignoreId) {
    return all().some(function (i) { return i.id === base && i.id !== ignoreId; });
  }

  function save(item, opts) {
    opts = opts || {};
    item = normalize(item, item.source || 'user');
    var arr = userItems();
    var idx = -1;
    if (item.seedId) {
      for (var i = 0; i < arr.length; i++) if (arr[i].seedId === item.seedId) { idx = i; break; }
      if (idx < 0) arr.push(item); else arr[idx] = item;
      persist(arr); return item;
    }
    for (var k = 0; k < arr.length; k++) if (!arr[k].seedId && arr[k].id === item.id) { idx = k; break; }
    if (idx < 0) arr.push(item); else arr[idx] = item;
    return persist(arr) ? item : null;
  }

  /* Save an edit of a seed record by snapshotting it as a user override. */
  function saveSeedEdit(seedItem) {
    var copy = {};
    for (var k in seedItem) copy[k] = seedItem[k];
    copy.seedId = seedItem.id;
    copy.updatedAt = U.todayISO();
    var arr = userItems().filter(function (u) { return u.seedId !== seedItem.id && !(u.__deleted && u.seedId === seedItem.id); });
    arr.push(copy);
    return persist(arr) ? copy : null;
  }

  function remove(id) {
    var arr = userItems();
    if (isSeed(id)) {
      if (arr.some(function (u) { return u.seedId === id && !u.__deleted; })) {
        arr = arr.filter(function (u) { return u.seedId !== id; });
        arr.push({ seedId: id, __deleted: true });
      } else {
        arr.push({ seedId: id, __deleted: true });
      }
    } else {
      arr = arr.filter(function (u) { return u.id !== id; });
    }
    persist(arr);
  }

  function restoreSeeds() {
    localStorage.removeItem(KEY);
  }

  /* ---------- queries ---------- */
  function published() {
    return all().filter(function (i) { return i.status === 'published'; })
      .sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
  }
  function drafts() { return all().filter(function (i) { return i.status === 'draft'; }); }
  function byStatus(s) {
    return all().filter(function (i) { return i.status === s.toLowerCase(); })
      .sort(function (a, b) { return (b.updatedAt || b.date || '').localeCompare(a.updatedAt || a.date || ''); });
  }
  function publicList(filter) {
    filter = filter || {};
    var list = published();
    if (filter.type && filter.type !== 'All') list = list.filter(function (i) { return i.type === filter.type; });
    if (filter.category && filter.category !== 'All') list = list.filter(function (i) { return i.category === filter.category; });
    if (filter.tag) list = list.filter(function (i) { return i.tags.indexOf(filter.tag) >= 0; });
    if (filter.q) list = list.filter(function (i) { return score(i, filter.q) > 0; });
    if (filter.sort === 'oldest') list.sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });
    else if (filter.sort === 'title') list.sort(function (a, b) { return a.title.localeCompare(b.title); });
    else if (filter.sort === 'relevance' && filter.q) list.sort(function (a, b) { return score(b, filter.q) - score(a, filter.q); });
    return list;
  }
  function categories() {
    var m = {};
    published().forEach(function (i) { m[i.category] = (m[i.category] || 0) + 1; });
    return Object.keys(m).sort().map(function (k) { return { name: k, count: m[k], slug: U.slugify(k) }; });
  }
  function tags() {
    var m = {};
    published().forEach(function (i) { i.tags.forEach(function (t) { m[t] = (m[t] || 0) + 1; }); });
    return Object.keys(m).sort().map(function (k) { return { name: k, count: m[k], slug: U.slugify(k) }; });
  }
  function types() {
    var m = {};
    all().forEach(function (i) { m[i.type] = (m[i.type] || 0) + 1; });
    return m;
  }
  function stats() {
    var pub = published();
    var cats = {}; pub.forEach(function (i) { cats[i.category] = 1; });
    var tg = 0; pub.forEach(function (i) { tg += i.tags.length; });
    return {
      published: pub.length,
      drafts: drafts().length,
      total: all().length,
      categories: Object.keys(cats).length,
      tags: tg,
      troubleshooting: pub.filter(function (i) { return i.type === 'Troubleshooting'; }).length,
      labs: pub.filter(function (i) { return i.type === 'Lab'; }).length
    };
  }

  function score(item, q) {
    if (!q) return 0;
    var s = 0, needle = q.toLowerCase().trim();
    var terms = needle.split(/\s+/);
    var hay = {
      title: (item.title || '').toLowerCase(),
      desc: (item.description || '').toLowerCase(),
      tags: (item.tags || []).join(' ').toLowerCase(),
      cat: (item.category || '').toLowerCase(),
      type: (item.type || '').toLowerCase(),
      body: (item.content || '').toLowerCase()
    };
    terms.forEach(function (t) {
      if (!t) return;
      if (hay.title.indexOf(t) >= 0) s += 12;
      if (hay.tags.indexOf(t) >= 0) s += 6;
      if (hay.cat.indexOf(t) >= 0) s += 5;
      if (hay.type.indexOf(t) >= 0) s += 4;
      if (hay.desc.indexOf(t) >= 0) s += 4;
      if (hay.body.indexOf(t) >= 0) s += 1;
    });
    return s;
  }

  /* Global search across content + commands + interview + reference data. */
  function search(q) {
    if (!q || q.trim().length < 1) return [];
    var out = [];
    all().forEach(function (i) {
      if (i.status !== 'published') return;
      var s = score(i, q);
      if (s > 0) out.push({ kind: i.type, title: i.title, desc: i.description, href: hrefFor(i), score: s + 2 });
    });
    (global.DA_SEED_COMMANDS || []).forEach(function (c) {
      var hay = (c.command + ' ' + c.description + ' ' + c.category).toLowerCase();
      if (hay.indexOf(q.toLowerCase().trim()) >= 0)
        out.push({ kind: 'Command', title: c.command, desc: c.description, href: '#/commands?q=' + encodeURIComponent(q), score: 8 });
    });
    (global.DA_SEED_INTERVIEW || []).forEach(function (cat) {
      (cat.questions || []).forEach(function (qq) {
        var hay = (qq.q + ' ' + qq.a + ' ' + cat.title).toLowerCase();
        if (hay.indexOf(q.toLowerCase().trim()) >= 0)
          out.push({ kind: 'Interview', title: qq.q, desc: cat.title, href: '#/interview/' + cat.id, score: 6 });
      });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 24);
  }

  function hrefFor(i) {
    if (i.type === 'Troubleshooting') return '#/troubleshooting/' + i.id;
    if (i.type === 'Lab') return '#/labs/' + i.id;
    return '#/read/' + i.id;
  }

  /* Sequence helpers for prev/next on article pages */
  function articleSequence() {
    return published().filter(function (i) { return ['Article', 'Blog', 'Note', 'Post'].indexOf(i.type) >= 0; });
  }

  DA.store = {
    TYPES: TYPES, STATUSES: STATUSES, MAX_BYTES: MAX_BYTES,
    all: all, get: get, save: save, saveSeedEdit: saveSeedEdit, remove: remove,
    restoreSeeds: restoreSeeds, isSeed: isSeed, takenId: takenId,
    published: published, drafts: drafts, byStatus: byStatus, publicList: publicList,
    categories: categories, tags: tags, types: types, stats: stats,
    search: search, hrefFor: hrefFor, articleSequence: articleSequence
  };
})(window);
