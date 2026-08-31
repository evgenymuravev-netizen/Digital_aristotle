/* Юнит-тест метрик опроса по контурам.
   Грузит config.js / survey.js / metrics.js в window-шим и гоняет
   compute() на детерминированных синтетических данных. Node, без зависимостей. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
globalThis.window = {};
const load = (f) => (0, eval)(fs.readFileSync(path.join(dir, f), "utf8"));
load("config.js"); load("survey.js"); load("metrics.js");
const CFG = window.CONTOURS_CONFIG, S = window.SURVEY, MX = window.CONTOURS_METRICS;

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.log("  ✗ FAIL: " + name); } }
function approx(a, b, eps) { return a != null && b != null && Math.abs(a - b) <= (eps == null ? 1e-9 : eps); }

/* ---------- pure helpers ---------- */
ok("entropy of two equal = ln2", approx(MX.entropy([1, 1]), Math.log(2)));
ok("entropy of one bucket = 0", approx(MX.entropy([5]), 0));
ok("IoA unanimous = 1", approx(MX.ioaFromValues(["a", "a", "a", "a"], 4), 1));
ok("IoA max split (2-way) = 0", approx(MX.ioaFromValues(["a", "b", "a", "b"], 2), 0));
ok("IoA all-distinct(4/4) = 0", approx(MX.ioaFromValues(["a", "b", "c", "d"], 4), 0));
ok("IoA <2 values = null", MX.ioaFromValues(["a"], 4) === null);
ok("jaccardMean identical = 1", approx(MX.jaccardMean([["a", "b"], ["a", "b"], ["a", "b"]]), 1));
ok("jaccardMean disjoint = 0", approx(MX.jaccardMean([["a", "b"], ["c", "d"]]), 0));
ok("jaccardMean half-overlap = 1/3", approx(MX.jaccardMean([["a", "b"], ["b", "c"]]), 1 / 3));
ok("canonicity 2/3", approx(MX.canonicity(["a", "a", "b"], "a"), 2 / 3));
ok("setEq order-insensitive", MX.setEq(["a", "b"], ["b", "a"]) === true);
ok("setEq different = false", MX.setEq(["a", "b"], ["a", "c"]) === false);

/* ---------- synthetic team ---------- */
function ans(v) { return { value: v, skipped: v == null, latencyMs: 1200, spentMs: 3000 }; }
function mk(i, isLeader, skipA8) {
  const a = {};
  a.A1 = ans("растём в enterprise");
  a.A2 = ans(["d1", "d2", "d3"]);            // identical multi  -> IoA 1, canon 1
  a.A3 = ans("m1");                          // identical single -> IoA 1
  a.A4 = ans("задача → зачем → стратегия");
  a.A5 = ans("Аня");
  a.A6 = ans("s2");                          // identical
  a.A7 = ans(["t1", "t2"]);
  a.A8 = ans(skipA8 ? null : "личный рост"); // some skipped -> silence
  a.A9a = ans("a"); a.A9b = ans("a"); a.A9c = ans("a");
  a.A10 = ans("r" + ((i % 6) + 1));          // fully spread   -> IoA ~0
  a.A11a = ans("p1"); a.A11b = ans("p5");    // real != should -> Δ = 1
  a.A12 = ans(5);                            // meta expected = 1.0
  a.B1 = ans(["v1", "v2", "v3"]);
  a.B2 = ans({ "Скорость": ["дедлайн", "цикл"], "Прозрачность": ["открытость"], "Ответственность": ["владелец"] });
  a.B3 = ans("случай на прошлой неделе");
  a.B4 = ans(null);                          // sensitive, skipped
  a.B5 = ans("Борис");
  a.B6 = ans(3);
  a.B7 = ans("обходят ревью");
  a.B8 = ans("x2");
  a.B9 = ans("хвалили за релиз");
  a.B10 = ans(null);
  a.B11a = ans("b1"); a.B11b = ans("b4");
  a.B12 = ans(4);
  return { v: 1, survey: "contours-0.1", groupKey: "t", isLeader: !!isLeader,
    segment: { stage: i < 3 ? "6-24" : "24+", func: i % 2 ? "eng" : "sales", loc: "Dubai" },
    lang: "ru", startedAt: 0, finishedAt: 1, answers: a };
}
// 1 leader + 6 members; skip A8 for 3 members
const team = [mk(0, true, false)];
for (let i = 1; i <= 6; i++) team.push(mk(i, false, i <= 3));

const res = MX.compute(team, S, CFG);
ok("not gated at N=6", res.gated === false);
ok("N counts members only (6)", res.N === 6);
ok("leaders counted (1)", res.leaders === 1);
ok("A2 IoA ~1 (identical multi)", approx(res.perItem.A2.ioa, 1, 1e-9));
ok("A2 canonicity = 1 (all match leader)", approx(res.perItem.A2.canon, 1));
ok("A2 method = jaccard", res.perItem.A2.ioaMethod === "jaccard");
ok("A3 IoA = 1 (identical single)", approx(res.perItem.A3.ioa, 1));
ok("A10 IoA ~0 (fully spread)", approx(res.perItem.A10.ioa, 0, 1e-9));
ok("A11 Δ = 1 (real != should)", res.deltas.A11 && approx(res.deltas.A11.delta, 1));
ok("A11 Δ valid = 6", res.deltas.A11 && res.deltas.A11.valid === 6);
ok("meta A expected = 1.0 (all 5s)", approx(res.meta.A.expected, 1));
ok("meta A actual within [0,1]", res.meta.A.actual >= 0 && res.meta.A.actual <= 1);
ok("meta A gap <= 0 (illusion of agreement)", res.meta.A.gap <= 0);
ok("silence A > 0 (A8 skips)", res.silence.A > 0);
ok("silence B > 0 (B4/B10 skipped)", res.silence.B > 0);
ok("A3 distribution present", Array.isArray(res.perItem.A3.distribution) && res.perItem.A3.distribution.length === 1);
ok("A10 distribution has 6 buckets", res.perItem.A10.distribution.length === 6);
ok("semantic is 3 values", Array.isArray(res.semantic) && res.semantic.length === 3);
ok("segmentation by func present", res.segments.func && Object.keys(res.segments.func).length >= 1);
ok("sensitive B4 hidden at N<minN respected (N>=minN so shown)", Array.isArray(res.perItem.B4.answers));

/* ---------- gating: N < minN ---------- */
const small = MX.compute([mk(0, true, false), mk(1, false, false), mk(2, false, false)], S, CFG);
ok("gated when members < minN", small.gated === true);
ok("gated N = 2 members", small.N === 2);

/* ---------- no leader: canonicity null ---------- */
const noLead = MX.compute([mk(1, false), mk(2, false), mk(3, false), mk(4, false), mk(5, false), mk(6, false)], S, CFG);
ok("no leader -> canon null", noLead.perItem.A2.canon === null);
ok("no leader -> leaders 0", noLead.leaders === 0);

/* ---------- two leaders disagree ---------- */
const l2 = mk(9, true, false); l2.answers.A2 = ans(["d4", "d5", "d6"]);
const dis = MX.compute([mk(0, true, false), l2, mk(1, false), mk(2, false), mk(3, false), mk(4, false), mk(5, false)], S, CFG);
ok("two leaders disagreeing flagged", dis.leaderDisagree === true);

/* ---------- sensitive hidden at small N (build 4 members, sensitive B4 hidden but gated anyway) ---------- */
console.log(`\ncontours metrics: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
