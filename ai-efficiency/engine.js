/* ============================================================
   AI Efficiency Test — движок подсчёта. window.AIE_ENGINE

   Чистые функции, тестируются в Node без DOM.

   Как считается балл. У каждого варианта есть вектор баллов s по
   измерениям. Для каждого вопроса известен лучший вариант (максимальная
   сумма s) и худший. Балл по измерению — это доля пройденного пути от
   худшего к лучшему, усреднённая по вопросам, где это измерение
   участвует. Так шкала остаётся в [0,100] и не зависит от того, сколько
   вопросов пришлось на измерение.

   Калибровка — отдельная ось, НЕ часть балла: средний lean выбранных
   вариантов. Отрицательный — недоиспользование, положительный —
   пере-доверие. Человек может набрать средний балл и там, и там; лечится
   это противоположными вещами, поэтому в один индекс не сворачиваем.
   ============================================================ */
(function () {
  "use strict";

  function pickList(all, roleId) {
    return all.filter(function (q) { return q.block === "core" || q.block === roleId; });
  }

  function optTotal(o) {
    var t = 0, s = o.s || {};
    Object.keys(s).forEach(function (k) { t += s[k]; });
    return t;
  }

  /* лучший вариант вопроса — с максимальной суммой баллов */
  function bestOption(q) {
    return q.options.reduce(function (a, b) { return optTotal(b) > optTotal(a) ? b : a; }, q.options[0]);
  }

  /* --- базовая линия случайного выбора ---
     Считается аналитически (среднее по вариантам), а не симуляцией: так она
     детерминирована и проверяема. Нужна, потому что сырой балл при случайных
     ответах даёт ~54 из 100 — если это не вычесть, монетка выглядит как
     «развивается», и всё число теряет смысл. */
  function chanceBaseline(questions, model) {
    var acc = {};
    model.dimensions.forEach(function (d) { acc[d.id] = { got: 0, max: 0 }; });
    questions.forEach(function (q) {
      var touched = {};
      q.options.forEach(function (o) { Object.keys(o.s || {}).forEach(function (k) { touched[k] = 1; }); });
      Object.keys(touched).forEach(function (dim) {
        if (!acc[dim]) return;
        var vals = q.options.map(function (o) { return (o.s && o.s[dim]) || 0; });
        var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
        if (hi === lo) return;
        var mean = vals.reduce(function (a, v) { return a + (v - lo) / (hi - lo); }, 0) / vals.length;
        acc[dim].got += mean; acc[dim].max += 1;
      });
    });
    var dims = {}, wsum = 0, wtot = 0;
    model.dimensions.forEach(function (d) {
      var a = acc[d.id];
      dims[d.id] = a.max ? (a.got / a.max) * 100 : null;
      if (dims[d.id] == null) return;
      wsum += dims[d.id] * d.weight; wtot += d.weight;
    });
    return { dims: dims, overall: wtot ? wsum / wtot : 0 };
  }

  /* сырой балл → доля пути от случайного угадывания до идеала */
  function chanceCorrect(raw, chance) {
    if (raw == null || chance == null || chance >= 100) return raw;
    return Math.max(0, Math.min(100, Math.round(((raw - chance) / (100 - chance)) * 100)));
  }

  /* --- подсчёт по набору ответов: { [questionId]: optionId } --- */
  function score(answers, questions, model) {
    var dims = model.dimensions;
    var acc = {};
    dims.forEach(function (d) { acc[d.id] = { got: 0, max: 0, n: 0 }; });

    var leanSum = 0, leanN = 0, correct = 0, answered = 0;
    var perItem = [];

    questions.forEach(function (q) {
      var chosenId = answers[q.id];
      var chosen = null;
      q.options.forEach(function (o) { if (o.id === chosenId) chosen = o; });
      var best = bestOption(q);
      if (!chosen) { perItem.push({ id: q.id, skipped: true, best: best.id }); return; }

      answered++;
      if (chosen === best) correct++;
      leanSum += (chosen.lean || 0); leanN++;

      // по каждому измерению, затронутому хоть одним вариантом этого вопроса
      var touched = {};
      q.options.forEach(function (o) { Object.keys(o.s || {}).forEach(function (k) { touched[k] = 1; }); });
      Object.keys(touched).forEach(function (dim) {
        if (!acc[dim]) return;
        var vals = q.options.map(function (o) { return (o.s && o.s[dim]) || 0; });
        var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
        if (hi === lo) return;                       // измерение не различает варианты
        var got = (chosen.s && chosen.s[dim]) || 0;
        acc[dim].got += (got - lo) / (hi - lo);      // доля пути от худшего к лучшему
        acc[dim].max += 1;
        acc[dim].n += 1;
      });

      perItem.push({ id: q.id, chosen: chosen.id, best: best.id, correct: chosen === best,
        lean: chosen.lean || 0, why: chosen.why, bestWhy: best.why, skipped: false });
    });

    var base = chanceBaseline(questions, model);
    var rawDims = {}, dimScores = {};
    dims.forEach(function (d) {
      var a = acc[d.id];
      rawDims[d.id] = a.max ? (a.got / a.max) * 100 : null;
      dimScores[d.id] = rawDims[d.id] == null ? null : chanceCorrect(rawDims[d.id], base.dims[d.id]);
    });

    // сырой общий балл — взвешенное среднее по измерениям, где есть данные
    var wsum = 0, wtot = 0;
    dims.forEach(function (d) {
      if (rawDims[d.id] == null) return;
      wsum += rawDims[d.id] * d.weight; wtot += d.weight;
    });
    var rawOverall = wtot ? wsum / wtot : 0;
    var overall = answered ? chanceCorrect(rawOverall, base.overall) : 0;

    var lean = leanN ? leanSum / leanN : 0;

    return {
      overall: overall,
      rawOverall: Math.round(rawOverall),
      chance: Math.round(base.overall),
      band: pickBand(model.bands, overall),
      dims: dimScores,
      dimBands: dimBandsOf(dimScores, model),
      calibration: { lean: lean, band: pickCalibration(model.calibration, lean) },
      correct: correct, answered: answered, total: questions.length,
      perItem: perItem,
    };
  }

  function pickBand(bands, value) {
    for (var i = 0; i < bands.length; i++) if (value >= bands[i].min) return bands[i];
    return bands[bands.length - 1];
  }
  function pickCalibration(cals, lean) {
    for (var i = 0; i < cals.length; i++) if (lean <= cals[i].max) return cals[i];
    return cals[cals.length - 1];
  }
  function dimBandsOf(dimScores, model) {
    var out = {};
    Object.keys(dimScores).forEach(function (k) {
      if (dimScores[k] == null) { out[k] = null; return; }
      out[k] = pickBand(model.dimBands, dimScores[k]);
    });
    return out;
  }

  /* --- две самые слабые оси: то, с чего начинать --- */
  function weakest(result, model, n) {
    return model.dimensions
      .filter(function (d) { return result.dims[d.id] != null; })
      .sort(function (a, b) { return result.dims[a.id] - result.dims[b.id]; })
      .slice(0, n || 2);
  }

  /* --- валидатор контента: без него легко разъехаться --- */
  function validate(questions, model) {
    var errs = [];
    var dimIds = {}; model.dimensions.forEach(function (d) { dimIds[d.id] = 1; });
    var roleIds = { core: 1 }; model.roles.forEach(function (r) { roleIds[r.id] = 1; });
    var seen = {};

    questions.forEach(function (q) {
      if (seen[q.id]) errs.push(q.id + ": duplicate id");
      seen[q.id] = 1;
      if (!roleIds[q.block]) errs.push(q.id + ": unknown block " + q.block);
      if (!dimIds[q.dim]) errs.push(q.id + ": unknown dim " + q.dim);
      if (!q.prompt || !q.prompt.en || !q.prompt.ru) errs.push(q.id + ": prompt missing a language");
      if (!q.options || q.options.length !== 4) errs.push(q.id + ": expected 4 options");

      var totals = [];
      (q.options || []).forEach(function (o) {
        if (!o.text || !o.text.en || !o.text.ru) errs.push(q.id + "/" + o.id + ": text missing a language");
        if (!o.why || !o.why.en || !o.why.ru) errs.push(q.id + "/" + o.id + ": why missing a language");
        if (typeof o.lean !== "number" || o.lean < -1 || o.lean > 1) errs.push(q.id + "/" + o.id + ": bad lean");
        if (!o.s || !Object.keys(o.s).length) errs.push(q.id + "/" + o.id + ": no score vector");
        Object.keys(o.s || {}).forEach(function (k) {
          if (!dimIds[k]) errs.push(q.id + "/" + o.id + ": unknown dimension " + k);
          if (Math.abs(o.s[k]) > 2) errs.push(q.id + "/" + o.id + ": |s| > 2 on " + k);
        });
        totals.push(optTotal(o));
      });

      // ровно один лучший вариант, и он должен быть строго лучше остальных
      var mx = Math.max.apply(null, totals);
      if (totals.filter(function (t) { return t === mx; }).length !== 1) errs.push(q.id + ": best option is not unique");
      // лучший вариант не должен быть перекосом в одну сторону калибровки
      var best = bestOption(q);
      // и должен доминировать по каждому измерению: иначе «везде лучший ответ»
      // не даёт 100% по полоске, и шкала измерения становится нечитаемой
      var touched = {};
      (q.options || []).forEach(function (o) { Object.keys(o.s || {}).forEach(function (k) { touched[k] = 1; }); });
      Object.keys(touched).forEach(function (dim) {
        var vals = (q.options || []).map(function (o) { return (o.s && o.s[dim]) || 0; });
        var hi = Math.max.apply(null, vals);
        if (hi === Math.min.apply(null, vals)) return;
        if (((best.s && best.s[dim]) || 0) !== hi) errs.push(q.id + ": best option is not the maximum on " + dim);
      });
      if (best.lean !== 0) errs.push(q.id + ": best option should be lean 0 (balanced), got " + best.lean);
      // в вопросе должна быть и «недо», и «пере» ловушка — иначе шкала односторонняя
      var leans = (q.options || []).map(function (o) { return o.lean; });
      if (leans.indexOf(1) < 0) errs.push(q.id + ": no over-delegation trap");
      if (leans.indexOf(-1) < 0) errs.push(q.id + ": no under-use trap");
    });

    return errs;
  }

  window.AIE_ENGINE = {
    pickList: pickList, score: score, validate: validate, chanceBaseline: chanceBaseline, chanceCorrect: chanceCorrect,
    bestOption: bestOption, optTotal: optTotal, weakest: weakest,
  };
})();
