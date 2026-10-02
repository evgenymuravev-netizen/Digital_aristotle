/* ============================================================
   Опрос по контурам v0.2 — расчёт метрик (window.CONTOURS_METRICS).
   Чистые функции + compute() над массивом ответов. Считаем ДИСПЕРСИЮ,
   а не уровень; никакого сводного индекса. Пороги — стартовые
   (не откалиброваны), показывать сравнение блоков и динамику.

   v0.2 поверх v0.1 (IoA/канон/Δ/мета/молчание/семантика/срезы):
   • components — по каждой составляющей S/V/St/C пара (IoA_c, Val_c):
       IoA_c — средневзвешенная сходимость закрытых вопросов с comp;
       Val_c — валентность эпизодных ответов: Σ w / Σ |w| ∈ [−1,+1].
     Эпизодные вопросы (episode:true) в IoA_c НЕ входят.
   • conflicts — матрица конфликтов контуров: доля ответов с меткой
     conf среди всех данных ответов на conf-кодированные вопросы.
     Δ (A11/B11) прикладывается к K1K2 отдельным полем (не суммируется).
   • sensors — валентность датчиков D/P/R из sens-кодов.
   • fear — индекс страха F: по каждому вопросу с fear-кодами
     Σ share(o)·fear(o) / maxFear, усреднённый вместе с молчанием
     блока B. Полосы: <0.15 clean · ≤0.35 muted · >0.35 poisoned.
   • life — тип группы: временная → ведущий показатель канон,
     долгоживущая → IoA (из третьего документа фреймворка).
   ============================================================ */
(function () {
  "use strict";

  var COMPS = ["S", "V", "St", "C"];
  var CONFS = ["K1K2", "K1K3", "K1K4", "K2K3", "K2K4", "K3K4"];

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

  /* код варианта: встроенные options или запись в config-списке */
  function codeOf(it, cfg, optId) {
    if (optId == null || typeof optId !== "string") return null;
    var list = it.options || (it.opt && cfg[it.opt]) || null; if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].id === optId) return list[i].code || null;
    return null;
  }

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
    function optCount(it) { return it.options ? it.options.length : (it.opt && cfg[it.opt] ? cfg[it.opt].length : (it.type === "scale" ? 5 : (it.type === "forced" ? 2 : null))); }

    var perItem = {};
    Object.keys(items).forEach(function (id) {
      var it = items[id]; var mvals = members.map(function (r) { return val(r, id); });
      var nonNull = mvals.filter(function (v) { return v != null; }).length;
      var res = { id: id, block: it.block, type: it.type, closed: !!it.closed, episode: !!it.episode, metric: it.metric,
        answered: nonNull, skipRate: members.length ? 1 - nonNull / members.length : 0 };
      if (it.closed) {
        if (it.type === "multi") { res.ioa = jaccardMean(members.map(function (r) { return val(r, id); }).filter(Boolean)); res.ioaMethod = "jaccard"; res.canon = (leader && !it.episode) ? canonicity(mvals, val(leader, id), setEq) : null; }
        else { res.ioa = ioaFromValues(mvals, optCount(it)); res.ioaMethod = "entropy"; res.canon = (leader && !it.episode) ? canonicity(mvals, val(leader, id)) : null; }
        res.distribution = labelDist(it, mvals, cfg);
      } else {
        res.distribution = null;
        res.open = it.type === "open" || it.type === "name" || it.type === "assoc";
        if (!it.sensitive || N >= minN) res.answers = members.map(function (r) { var a = r.answers && r.answers[id]; return a ? { value: a.value, skipped: a.skipped } : null; });
      }
      perItem[id] = res;
    });

    /* ---- v0.2: составляющие S/V/St/C — пара (IoA_c, Val_c) ---- */
    var components = {};
    COMPS.forEach(function (c) { components[c] = { ioaNum: 0, ioaDen: 0, valNum: 0, valDen: 0 }; });
    Object.keys(items).forEach(function (id) {
      var it = items[id];
      if (it.comp && !it.episode && perItem[id].ioa != null) {
        Object.keys(it.comp).forEach(function (c) { if (components[c]) { components[c].ioaNum += perItem[id].ioa * it.comp[c]; components[c].ioaDen += it.comp[c]; } });
      }
    });
    members.forEach(function (r) {
      Object.keys(items).forEach(function (id) {
        var it = items[id], v = val(r, id); if (v == null) return;
        if (it.scaleVal && typeof v === "number") {
          Object.keys(it.scaleVal).forEach(function (c) { if (!components[c]) return;
            components[c].valNum += ((v - 3) / 2) * it.scaleVal[c]; components[c].valDen += Math.abs(it.scaleVal[c]); });
          return;
        }
        var code = codeOf(it, cfg, v); if (code && code.w) {
          Object.keys(code.w).forEach(function (c) { if (!components[c]) return;
            components[c].valNum += code.w[c]; components[c].valDen += Math.abs(code.w[c]); });
        }
      });
    });
    COMPS.forEach(function (c) {
      var x = components[c];
      components[c] = {
        ioa: x.ioaDen ? x.ioaNum / x.ioaDen : null,
        valence: x.valDen ? x.valNum / x.valDen : null,
        nVal: x.valDen,
      };
    });

    /* ---- v0.2: конфликты контуров ---- */
    var conflicts = {}; CONFS.forEach(function (k) { conflicts[k] = { n: 0 }; });
    var confDen = 0;
    members.forEach(function (r) {
      Object.keys(items).forEach(function (id) {
        var it = items[id];
        var hasConf = it.scaleConf || (it.options || (it.opt && cfg[it.opt]) || []).some(function (o) { return o.code && o.code.conf; });
        if (!hasConf) return;
        var v = val(r, id); if (v == null) return;
        confDen++;
        if (it.scaleConf && typeof v === "number") { if (v >= it.scaleConf.from) conflicts[it.scaleConf.conf].n++; return; }
        var code = codeOf(it, cfg, v); if (code && code.conf && conflicts[code.conf]) conflicts[code.conf].n++;
      });
    });
    CONFS.forEach(function (k) { conflicts[k].share = confDen ? conflicts[k].n / confDen : null; });
    conflicts.answered = confDen;

    /* ---- v0.2: датчики D/P/R ---- */
    var sensors = { D: { num: 0, den: 0 }, P: { num: 0, den: 0 }, R: { num: 0, den: 0 } };
    members.forEach(function (r) {
      Object.keys(items).forEach(function (id) {
        var it = items[id], v = val(r, id); if (v == null) return;
        var code = codeOf(it, cfg, v); if (!code || !code.sens) return;
        var letter = code.sens[0], sign = code.sens[1] === "+" ? 1 : -1;
        if (sensors[letter]) { sensors[letter].num += sign; sensors[letter].den += 1; }
      });
    });
    Object.keys(sensors).forEach(function (k) { var s = sensors[k]; sensors[k] = { valence: s.den ? s.num / s.den : null, n: s.den }; });

    /* ---- v0.2: «прожитая» разметка — из ИИ-кодировки открытых ответов
       (бэкенд заменяет текст на {ai:1, summary, contours, components, values, valence}) ---- */
    var lived = { n: 0, values: {}, contours: {} };
    members.forEach(function (r) {
      Object.keys(r.answers || {}).forEach(function (id) {
        var a = r.answers[id]; if (!a || a.skipped || !a.value || !a.value.ai) return;
        lived.n++;
        (a.value.values || []).forEach(function (v) { var b = lived.values[v] = lived.values[v] || { plus: 0, minus: 0 }; if (a.value.valence > 0) b.plus++; else if (a.value.valence < 0) b.minus++; });
        (a.value.contours || []).forEach(function (k) { lived.contours[k] = (lived.contours[k] || 0) + 1; });
      });
    });

    /* ---- Δ-разрыв (A11, B11) ---- */
    var deltas = {};
    ["A11", "B11"].forEach(function (pk) {
      var ids = Object.keys(items).filter(function (id) { return items[id].pairKey === pk; });
      if (ids.length !== 2) return;
      var a = ids.find(function (x) { return items[x].metric === "declared-real"; }), b = ids.find(function (x) { return items[x].metric === "declared-should"; });
      var diff = 0, valid = 0;
      members.forEach(function (r) { var ra = val(r, a), rb = val(r, b); if (ra != null && rb != null) { valid++; if (ra !== rb) diff++; } });
      deltas[pk] = valid ? { delta: diff / valid, valid: valid } : null;
    });
    // Δ — вклад ядра «декларируется ≠ выгодно» в конфликт К1↔К2 (отдельным полем, не суммой)
    var dvals = ["A11", "B11"].map(function (pk) { return deltas[pk] ? deltas[pk].delta : null; }).filter(function (x) { return x != null; });
    conflicts.K1K2.delta = dvals.length ? dvals.reduce(function (a, c) { return a + c; }, 0) / dvals.length : null;

    /* ---- мета-разрыв по блокам ---- */
    var meta = {};
    survey.blocks.forEach(function (b) {
      var metaItem = b.items.find(function (it) { return it.metaFor === b.id; });
      var closedIoas = b.items.filter(function (it) { return it.closed && !it.episode && perItem[it.id].ioa != null; }).map(function (it) { return perItem[it.id].ioa; });
      var actual = closedIoas.length ? closedIoas.reduce(function (a, c) { return a + c; }, 0) / closedIoas.length : null;
      var scaleVals = members.map(function (r) { return val(r, metaItem ? metaItem.id : ""); }).filter(function (v) { return v != null; });
      var expected = scaleVals.length ? (scaleVals.reduce(function (a, c) { return a + c; }, 0) / scaleVals.length - 1) / 4 : null;
      meta[b.id] = { actual: actual, expected: expected, gap: (actual != null && expected != null) ? actual - expected : null, n: scaleVals.length };
    });

    /* ---- молчание по блокам ---- */
    var silence = {};
    survey.blocks.forEach(function (b) {
      var tot = 0, sk = 0;
      members.forEach(function (r) { b.items.forEach(function (it) { var a = r.answers && r.answers[it.id]; if (a) { tot++; if (a.skipped) sk++; } }); });
      silence[b.id] = tot ? sk / tot : 0;
    });

    /* ---- v0.2: индекс страха F (гейт достоверности датчика) ---- */
    var fearParts = [];
    Object.keys(items).forEach(function (id) {
      var it = items[id];
      var list = it.options || (it.opt && cfg[it.opt]) || null; if (!list) return;
      var maxFear = 0; list.forEach(function (o) { if (o.code && o.code.fear) maxFear = Math.max(maxFear, o.code.fear); });
      if (!maxFear) return;
      var sum = 0, n = 0;
      members.forEach(function (r) { var v = val(r, id); if (v == null) return; n++; var code = codeOf(it, cfg, v); if (code && code.fear) sum += code.fear; });
      if (n) fearParts.push({ id: id, score: sum / (n * maxFear) });
    });
    fearParts.push({ id: "silence-B", score: silence.B || 0 });
    var F = fearParts.length ? fearParts.reduce(function (a, p) { return a + p.score; }, 0) / fearParts.length : null;
    var fear = { index: F, band: F == null ? null : (F < 0.15 ? "clean" : (F <= 0.35 ? "muted" : "poisoned")), parts: fearParts };

    /* ---- v0.2: тип группы → ведущий показатель ---- */
    var lifeCounts = {}; members.forEach(function (r) { if (r.life) lifeCounts[r.life] = (lifeCounts[r.life] || 0) + 1; });
    var lifeVal = Object.keys(lifeCounts).sort(function (a, b) { return lifeCounts[b] - lifeCounts[a]; })[0] || null;
    var life = { value: lifeVal, lead: lifeVal === "temp" ? "canon" : (lifeVal === "long" ? "ioa" : "both") };

    /* ---- семантическая дисперсия (B2) — токен-приближение ---- */
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

    /* ---- сегментация: размеры срезов + IoA внутри групп ≥ minN для A2 ----
       Анонимность: ячейку среза меньше minN не показываем и не считаем
       (единый порог с агрегатом — иначе срез деанонимизирует человека). */
    var segments = {};
    ["stage", "func", "loc"].forEach(function (dim) {
      var groups = {};
      members.forEach(function (r) { var g = (r.segment && r.segment[dim]) || ""; if (!g) return; (groups[g] = groups[g] || []).push(r); });
      var out = {};
      Object.keys(groups).forEach(function (g) { var grp = groups[g]; if (grp.length < minN) { out[g] = { n: grp.length, ioaA2: null, small: true }; return; }
        out[g] = { n: grp.length, ioaA2: jaccardMean(grp.map(function (r) { return val(r, "A2"); }).filter(Boolean)) }; });
      if (Object.keys(out).length) segments[dim] = out;
    });

    return { N: N, minN: minN, gated: N < minN, leaders: leaders.length, leaderDisagree: leaderDisagree,
      perItem: perItem, components: components, conflicts: conflicts, sensors: sensors, fear: fear, life: life, lived: lived,
      deltas: deltas, meta: meta, silence: silence, semantic: semantic, segments: segments };
  }

  function labelDist(it, values, cfg) {
    var labels = {};
    var list = it.options || (it.opt && cfg[it.opt]) || null;
    if (list) list.forEach(function (o) { labels[o.id] = o.ru; });
    var d = {};
    values.forEach(function (v) {
      if (v == null) return;
      if (it.type === "multi") v.forEach(function (id) { var l = labels[id] || id; d[l] = (d[l] || 0) + 1; });
      else if (it.type === "single") { var l = labels[v] || (String(v).indexOf("own:") === 0 ? String(v).slice(4) : v); d[l] = (d[l] || 0) + 1; }
      else { d[v] = (d[v] || 0) + 1; }
    });
    return Object.keys(d).map(function (k) { return { label: k, n: d[k] }; }).sort(function (a, b) { return b.n - a.n; });
  }

  window.CONTOURS_METRICS = { compute: compute, ioaFromValues: ioaFromValues, jaccardMean: jaccardMean, entropy: entropy, canonicity: canonicity, setEq: setEq, COMPS: COMPS, CONFS: CONFS };
})();
