/*
 * VibeTestQ Academy — reading progress, kept in this browser.
 *
 *   AcademyProgress.visit(sectionId, meta, chapter)   remember where the reader is
 *   AcademyProgress.setDone(sectionId, num, on)       mark a chapter complete / not complete
 *   AcademyProgress.get(sectionId)                    { done:{num:ts}, seen:{num:ts}, last, total, title, href }
 *   AcademyProgress.all()                             every section, most recently read first
 *   AcademyProgress.practice() / .quizzes()           totals from the practice sets and quizzes
 *
 * Storage: localStorage "vtq-progress-v1". If storage is blocked (private window) it
 * falls back to memory for the session, and nothing breaks.
 */
(function () {
  'use strict';
  if (window.AcademyProgress) return;
  var KEY = 'vtq-progress-v1';
  var memory = null;

  function load() {
    if (memory) return memory;
    try {
      var raw = window.localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : null;
      if (data && data.sections) return data;
    } catch (e) { /* blocked or corrupt: start clean */ }
    return { v: 1, sections: {} };
  }
  function save(data) {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); memory = null; }
    catch (e) { memory = data; }
  }
  function rec(data, id) {
    return data.sections[id] || (data.sections[id] = { done: {}, seen: {}, last: null, total: 0, title: id, href: '/' });
  }
  var listeners = [];
  function emit(id) { listeners.forEach(function (f) { try { f(id); } catch (e) { /* ignore */ } }); }

  var API = {
    visit: function (id, meta, ch) {
      var d = load(), r = rec(d, id);
      r.title = meta.title; r.href = meta.href; r.total = meta.total;
      r.seen[ch.num] = Date.now();
      r.last = { num: ch.num, title: ch.title, at: Date.now() };
      save(d); emit(id);
    },
    setDone: function (id, num, on) {
      var d = load(), r = rec(d, id);
      if (on) r.done[num] = Date.now(); else delete r.done[num];
      save(d); emit(id);
    },
    get: function (id) {
      var r = load().sections[id];
      return r || { done: {}, seen: {}, last: null, total: 0, title: id, href: '/' };
    },
    doneCount: function (id) { return Object.keys(API.get(id).done).length; },
    isDone: function (id, num) { return !!API.get(id).done[num]; },
    all: function () {
      var s = load().sections;
      return Object.keys(s).map(function (k) { var r = s[k]; r.id = k; return r; })
        .filter(function (r) { return r.last; })
        .sort(function (a, b) { return b.last.at - a.last.at; });
    },
    onChange: function (f) { listeners.push(f); },

    // totals shown on the Learn page (read-only; owned by the practice sets and quizzes)
    practice: function () {
      var keys = ['vtq-js-practice', 'vtq-ts-practice', 'vtq-pw-practice', 'vtq-pw-locators', 'vtq-pw-assertions', 'vtq-pw-fixtures', 'vtq-pw-config', 'vtq-pw-api', 'vtq-pw-network', 'vtq-pw-pom', 'vtq-pw-bdd'];
      var solved = 0;
      keys.forEach(function (k) {
        try { var o = JSON.parse(window.localStorage.getItem(k) || '{}'); solved += Object.keys(o).filter(function (x) { return o[x]; }).length; } catch (e) { /* ignore */ }
      });
      return { solved: solved, total: 136 };
    },
    quizzes: function () {
      var taken = 0, bestSum = 0, totalSum = 0;
      try {
        for (var i = 0; i < window.localStorage.length; i++) {
          var k = window.localStorage.key(i);
          if (k && k.indexOf('vtq-quiz:') === 0) {
            var r = JSON.parse(window.localStorage.getItem(k) || 'null');
            if (r && r.total) { taken++; bestSum += r.score; totalSum += r.total; }
          }
        }
      } catch (e) { /* ignore */ }
      return { taken: taken, total: 18, avg: totalSum ? Math.round(100 * bestSum / totalSum) : null };
    },
  };
  window.AcademyProgress = API;
})();
