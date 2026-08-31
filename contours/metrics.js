/* ============================================================
   Опрос по контурам — расчёт метрик (window.CONTOURS_METRICS).
   Чистые функции + compute() над массивом ответов. Считаем ДИСПЕРСИЮ,
   а не уровень; никакого сводного индекса. Пороги — стартовые
   (не откалиброваны), показывать сравнение блоков и динамику.
   ============================================================ */
(function () {
  "use strict";

  function entropy(counts) { // counts: array of frequencies
    var tot = counts.reduce(function (a, b) { return a + b; }, 0); if (!tot) return 0;
    var h = 0; counts.forEach(function (c) { if (c > 0) { var p = c / tot; h -= p * Math.log(p); } }); return h;
  }
  function dist(values) { var m = {}; values.forEach(function (v) { var k = JSON.stringify(v); m[k] = (m[k] || 0) + 1; }); return m; }
  function ioaFromValues(values, kPossible) {
    var vals = values.filter(function (v) { return v != null && v !== ""; }); if (vals.length < 2) return null;
    var d = dist(vals), counts = Object.keys(d).map(function (k) { return d[k]; });
    var k = kPossible && kPossible > 1 ? kPossible : counts.length; if (k <= 1) return 1;
    return Math.max(0, Math.min(1, 1 - entropy(counts) / Math.log(k)));
  }
  function jaccard(a, b) { var B = {}, uni = {}, inter = 0; b.forEach(function (x) { B[x] = 1; uni[x] = 1; }); a.forEach(function (x) { if (B[x]) inter++; uni[x] = 1; }); var u = Object.keys(uni).length; return u ? inter / u : 0; }
  function jaccardMean(sets) { var s = sets.filter(function (x) { return x && x.length; }); if (s.length < 2) return null; var tot = 0, cnt = 0; for (var i = 0; i < s.length; i++) for (var j = i + 1; j < s.length; j++) { tot += jaccard(s[i], s[j]); cnt++; } return cnt ? tot / cnt : null; }
  function canonicity(values, leaderVal, eq) { if (leaderVal == null) return null; var vals = values.filter(function (v) { return v != null; }); if (!vals.length) return null; var m = 0; vals.forEach(function (v) { if ((eq || defEq)(v, leaderVal)) m++; }); return m / vals.length; }
  function defEq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function setEq(a, b) { if (!a || !b) return false; var A = a.slice().sort().join("|"), B = b.slice().sort().join("|"); return A === B; }

  function compute(responses, survey, cfg) {
    var minN = (cfg && cfg.minN) || 5;
    var leaders = responses.filter(function (r) { return r.isLeader; });
    var members = responses.filter(function (r) { return !r.isLeader; });
    if (!members.length) members = responses.slice();   // all-leaders fallback
    var N = members.length;
    var leaderDisagree = false, leader = null;
    if (leaders.length === 1) leader = leaders[0];
    else if (leaders.length > 1) { // check leader agreement on a headline closed item
      var lv = leaders.map(function (r) { return val(r, "A2"); });
      leaderDisagree = !lv.every(function (x) { return setEq(x, lv[0]); });
      leader = leaders[0];
    }

    var items = {};
    survey.blocks.forEach(function (b) { b.items.forEach(function (it) { items[it.id] = it; }); });
    function val(r, id) { var a = r.answers && r.answers[id]; return a && !a.skipped ? a.value : null; }
    function optCount(it) { return it.opt && cfg[it.opt] ? cfg[it.opt].length : (it.type === "scale" ? 5 : (it.type === "forced" ? 2 : null)); }

    var perItem = {};
    Object.keys(items).forEach(function (id) {
      var it = items[id]; var mvals = members.map(function (r) { return val(r, id); });
      var nonNull = mvals.filter(function (v) { return v != null; }).length;
      var res = { id: id, block: it.block, type: it.type, closed: !!it.closed, metric: it.metric,
        answered: nonNull, skipRate: members.length ? 1 - nonNull / members.length : 0 };
      if (it.closed) {
        if (it.type === "multi") { res.ioa = jaccardMean(members.map(function (r) { return val(r, id); }).filter(Boolean)); res.ioaMethod = "jaccard"; res.canon = leader ? canonicity(mvals, val(leader, id), setEq) : null; }
        else { res.ioa = ioaFromValues(mvals, optCount(it)); res.ioaMethod = "entropy"; res.canon = leader ? canonicity(mvals, val(leader, id)) : null; }
        res.distribution = labelDist(it, mvals, cfg);
      } else {
        res.distribution = null;
        res.open = it.type === "open" || it.type === "name" || it.type === "assoc";
        if (!it.sensitive || N >= minN) res.answers = members.map(function (r) { var a = r.answers && r.answers[id]; return a ? { value: a.value, skipped: a.skipped, latencyMs: a.latencyMs } : null; });
      }
      perItem[id] = res;
    });

    // Δ-разрыв (A11, B11)
    var deltas = {};
    ["A11", "B11"].forEach(function (pk) {
      var ids = Object.keys(items).filter(function (id) { return items[id].pairKey === pk; });
      if (ids.length !== 2) return;
      var a = ids.find(function (x) { return items[x].metric === "declared-real"; }), b = ids.find(function (x) { return items[x].metric === "declared-should"; });
      var diff = 0, valid = 0;
      members.forEach(function (r) { var ra = val(r, a), rb = val(r, b); if (ra != null && rb != null) { valid++; if (ra !== rb) diff++; } });
      deltas[pk] = valid ? { delta: diff / valid, valid: valid } : null;
    });

    // мета-разрыв по блокам
    var meta = {};
    survey.blocks.forEach(function (b) {
      var metaItem = b.items.find(function (it) { return it.metaFor === b.id; });
      var closedIoas = b.items.filter(function (it) { return it.closed && perItem[it.id].ioa != null; }).map(function (it) { return perItem[it.id].ioa; });
      var actual = closedIoas.length ? closedIoas.reduce(function (a, c) { return a + c; }, 0) / closedIoas.length : null;
      var scaleVals = members.map(function (r) { return val(r, metaItem ? metaItem.id : ""); }).filter(function (v) { return v != null; });
      var expected = scaleVals.length ? (scaleVals.reduce(function (a, c) { return a + c; }, 0) / scaleVals.length - 1) / 4 : null;
      meta[b.id] = { actual: actual, expected: expected, gap: (actual != null && expected != null) ? actual - expected : null, n: scaleVals.length };
    });

    // молчание по блокам
    var silence = {};
    survey.blocks.forEach(function (b) {
      var tot = 0, sk = 0;
      members.forEach(function (r) { b.items.forEach(function (it) { var a = r.answers && r.answers[it.id]; if (a) { tot++; if (a.skipped) sk++; } }); });
      silence[b.id] = tot ? sk / tot : 0;
    });

    // семантическая дисперсия (B2) — токен-приближение
    var semantic = null;
    var b2 = perItem.B2;
    if (b2) {
      var vals = (cfg.org && cfg.org.values) || [];
      semantic = vals.slice(0, 3).map(function (vname) {
        var words = [];
        members.forEach(function (r) { var a = r.answers && r.answers.B2 && !r.answers.B2.skipped ? r.answers.B2.value : null; if (a && a[vname]) a[vname].forEach(function (w) { w = String(w || "").toLowerCase().trim(); if (w) words.push(w); }); });
        var d = dist(words), keys = Object.keys(d); var largest = keys.reduce(function (m, k) { return Math.max(m, d[k]); }, 0);
        return { value: vname, total: words.length, clusters: keys.length, dispersion: words.length ? 1 - largest / words.length : null, top: keys.sort(function (a, c) { return d[c] - d[a]; }).slice(0, 6).map(function (k) { return { w: k, n: d[k] }; }) };
      });
    }

    // сегментация: размеры срезов + IoA внутри групп ≥3 для A2/B1
    var segments = {};
    ["stage", "func", "loc"].forEach(function (dim) {
      var groups = {};
      members.forEach(function (r) { var g = (r.segment && r.segment[dim]) || ""; if (!g) return; (groups[g] = groups[g] || []).push(r); });
      var out = {};
      Object.keys(groups).forEach(function (g) { var grp = groups[g]; if (grp.length < 3) { out[g] = { n: grp.length, ioaA2: null, small: true }; return; }
        out[g] = { n: grp.length, ioaA2: jaccardMean(grp.map(function (r) { return val(r, "A2"); }).filter(Boolean)) }; });
      if (Object.keys(out).length) segments[dim] = out;
    });

    return { N: N, minN: minN, gated: N < minN, leaders: leaders.length, leaderDisagree: leaderDisagree,
      perItem: perItem, deltas: deltas, meta: meta, silence: silence, semantic: semantic, segments: segments };
  }

  function labelDist(it, values, cfg) {
    var labels = {};
    if (it.opt && cfg[it.opt]) cfg[it.opt].forEach(function (o) { labels[o.id] = o.ru; });
    var d = {};
    values.forEach(function (v) {
      if (v == null) return;
      if (it.type === "multi") v.forEach(function (id) { var l = labels[id] || id; d[l] = (d[l] || 0) + 1; });
      else if (it.type === "single") { var l = labels[v] || (String(v).indexOf("own:") === 0 ? String(v).slice(4) : v); d[l] = (d[l] || 0) + 1; }
      else { d[v] = (d[v] || 0) + 1; }
    });
    return Object.keys(d).map(function (k) { return { label: k, n: d[k] }; }).sort(function (a, b) { return b.n - a.n; });
  }

  window.CONTOURS_METRICS = { compute: compute, ioaFromValues: ioaFromValues, jaccardMean: jaccardMean, entropy: entropy, canonicity: canonicity, setEq: setEq };
})();
