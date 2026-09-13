/* AI Efficiency Test — проверка контента и движка. Node, без зависимостей.
   Содержание банка сценариев проверяется так же строго, как арифметика:
   молча разъехавшаяся разметка вариантов — самый вероятный способ
   получить правдоподобный, но бессмысленный балл. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
globalThis.window = {};
const load = (f) => (0, eval)(fs.readFileSync(path.join(dir, f), "utf8"));
load("roles.js"); load("questions.js"); load("engine.js");
const M = window.AIE_MODEL, Q = window.AIE_QUESTIONS, E = window.AIE_ENGINE;

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log("  ✗ FAIL: " + n); } };

/* ---------- контент ---------- */
const errs = E.validate(Q, M);
ok("content validates (" + errs.length + " errors)", errs.length === 0);
if (errs.length) console.log("    " + errs.join("\n    "));

ok("32 items in the bank", Q.length === 32);
ok("8 core items", Q.filter((q) => q.block === "core").length === 8);
M.roles.forEach((r) => {
  ok(r.id + ": 8 role items", Q.filter((q) => q.block === r.id).length === 8);
  ok(r.id + ": test is 16 items", E.pickList(Q, r.id).length === 16);
});
// каждое измерение должно реально встречаться, иначе полоска всегда пустая
M.dimensions.forEach((d) => {
  const used = Q.some((q) => q.options.some((o) => o.s && o.s[d.id] != null));
  ok("dimension " + d.id + " is used by some option", used);
});
// у каждой роли должно набираться достаточно данных по каждому измерению
M.roles.forEach((r) => {
  const items = E.pickList(Q, r.id);
  M.dimensions.forEach((d) => {
    const n = items.filter((q) => q.options.some((o) => {
      const vals = q.options.map((x) => (x.s && x.s[d.id]) || 0);
      return Math.max(...vals) !== Math.min(...vals);
    })).length;
    ok(r.id + "/" + d.id + ": >=2 discriminating items (" + n + ")", n >= 2);
  });
});

/* ---------- крайние случаи подсчёта ---------- */
const pm = E.pickList(Q, "pm");
const allBest = {}; pm.forEach((q) => { allBest[q.id] = E.bestOption(q).id; });
const perfect = E.score(allBest, pm, M);
ok("all-best => 100", perfect.overall === 100);
ok("all-best => every item correct", perfect.correct === pm.length);
ok("all-best => balanced calibration", perfect.calibration.band.id === "balanced");
ok("all-best => top band", perfect.band.id === "fluent");
ok("all-best => every dimension 100", M.dimensions.every((d) => perfect.dims[d.id] === 100));

function worstBy(q, fn) {
  return q.options.reduce((a, b) => (fn(b) < fn(a) ? b : a), q.options[0]).id;
}
const allWorst = {}; pm.forEach((q) => { allWorst[q.id] = worstBy(q, E.optTotal); });
const worst = E.score(allWorst, pm, M);
ok("all-worst => 0", worst.overall === 0);
ok("all-worst => bottom band", worst.band.id === "early");
ok("score is bounded 0..100", worst.overall >= 0 && perfect.overall <= 100);

/* ---------- поправка на угадывание ---------- */
const base = E.chanceBaseline(pm, M);
ok("chance baseline is computed", base.overall > 0 && base.overall < 100);
ok("chance baseline is in the expected range (~54 raw)", base.overall > 48 && base.overall < 60);
ok("chance baseline is deterministic", E.chanceBaseline(pm, M).overall === base.overall);
ok("perfect answers are far above chance", perfect.rawOverall > base.overall + 30);
ok("result exposes raw and chance for transparency",
   typeof perfect.rawOverall === "number" && typeof perfect.chance === "number");
ok("chanceCorrect maps chance to 0", E.chanceCorrect(base.overall, base.overall) === 0);
ok("chanceCorrect maps 100 to 100", E.chanceCorrect(100, base.overall) === 100);
ok("chanceCorrect clamps below chance to 0", E.chanceCorrect(base.overall - 20, base.overall) === 0);
ok("corrected score is never above raw for mid performance", (() => {
  const a = {}; pm.forEach((q, i) => { a[q.id] = i % 2 ? E.bestOption(q).id : q.options.find(o => o !== E.bestOption(q)).id; });
  const r = E.score(a, pm, M);
  return r.overall <= r.rawOverall;
})());
// случайные ответы не должны выглядеть как результат: медиана ровно 0
ok("random answering has median 0 (not flattering)", (() => {
  let zero = 0;
  for (let i = 0; i < 400; i++) {
    const a = {}; pm.forEach((q) => { a[q.id] = q.options[Math.floor(Math.random() * 4)].id; });
    if (E.score(a, pm, M).overall === 0) zero++;
  }
  return zero > 200;
})());

/* ---------- калибровка: две противоположные стратегии ---------- */
const overAll = {}; pm.forEach((q) => { const o = q.options.find((x) => x.lean === 1); if (o) overAll[q.id] = o.id; });
const over = E.score(overAll, pm, M);
ok("always-over-delegate => over-truster", over.calibration.band.id === "over");
ok("always-over-delegate => lean > 0", over.calibration.lean > 0);

const underAll = {}; pm.forEach((q) => { const o = q.options.find((x) => x.lean === -1); if (o) underAll[q.id] = o.id; });
const under = E.score(underAll, pm, M);
ok("always-under-use => under-user", under.calibration.band.id === "under");
ok("always-under-use => lean < 0", under.calibration.lean < 0);

// суть двухсторонней шкалы: обе крайности набирают мало, но по разным причинам
ok("both extremes score poorly", over.overall < 40 && under.overall < 55);
ok("the two extremes are distinguishable", over.calibration.band.id !== under.calibration.band.id);

/* ---------- пропуски и частичные ответы ---------- */
const empty = E.score({}, pm, M);
ok("no answers => 0 answered, no crash", empty.answered === 0 && empty.overall === 0);
ok("no answers => every item marked skipped", empty.perItem.every((p) => p.skipped));

const half = {}; pm.slice(0, 8).forEach((q) => { half[q.id] = E.bestOption(q).id; });
const halfRes = E.score(half, pm, M);
ok("half answered => 8 answered", halfRes.answered === 8);
ok("half answered => still 100 on what was answered", halfRes.overall === 100);
ok("half answered => 8 skipped in review", halfRes.perItem.filter((p) => p.skipped).length === 8);

/* ---------- разбор по вопросам ---------- */
const mixed = {}; pm.forEach((q, i) => { mixed[q.id] = i % 2 ? E.bestOption(q).id : worstBy(q, E.optTotal); });
const mx = E.score(mixed, pm, M);
ok("mixed => score strictly between", mx.overall > 0 && mx.overall < 100);
ok("review carries chosen and best for every answered item",
   mx.perItem.filter((p) => !p.skipped).every((p) => p.chosen && p.best && p.why && p.bestWhy));
ok("weakest() returns two dimensions", E.weakest(mx, M, 2).length === 2);
ok("weakest() is actually the lowest", (() => {
  const w = E.weakest(mx, M, 2);
  const all = M.dimensions.map((d) => mx.dims[d.id]).filter((v) => v != null).sort((a, b) => a - b);
  return mx.dims[w[0].id] === all[0];
})());

/* ---------- полосы ---------- */
ok("band thresholds are ordered", M.bands.every((b, i) => i === 0 || M.bands[i - 1].min > b.min));
ok("bands cover 0", M.bands[M.bands.length - 1].min === 0);
ok("calibration bands cover +1", M.calibration[M.calibration.length - 1].max >= 1);

/* ---------- двуязычность ---------- */
const langErrs = [];
const bi = (o, where) => { if (!o || !o.en || !o.ru) langErrs.push(where); };
M.dimensions.forEach((d) => { bi(d.name, "dim " + d.id + " name"); bi(d.blurb, "dim " + d.id + " blurb"); });
M.roles.forEach((r) => { bi(r.name, "role " + r.id + " name"); bi(r.blurb, "role " + r.id + " blurb"); });
M.bands.forEach((b) => { bi(b.name, "band " + b.id); bi(b.note, "band " + b.id + " note"); });
M.calibration.forEach((c) => { bi(c.name, "calib " + c.id); bi(c.note, "calib " + c.id + " note"); });
ok("model is fully bilingual", langErrs.length === 0);
if (langErrs.length) console.log("    " + langErrs.join("\n    "));

console.log(`\nai-efficiency engine: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
