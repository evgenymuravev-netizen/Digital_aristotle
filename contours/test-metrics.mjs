/* Юнит-тест метрик опроса по контурам v0.2.
   Грузит config.js / survey.js / metrics.js в window-шим и гоняет
   compute() на детерминированных синтетических данных: команда-синергия,
   команда-поломка, гейтинг, лид, срезы. Плюс валидация таблицы разметки.
   Node, без зависимостей. */
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
ok("IoA unanimous = 1", approx(MX.ioaFromValues(["a", "a", "a", "a"], 4), 1));
ok("IoA max split (2-way) = 0", approx(MX.ioaFromValues(["a", "b", "a", "b"], 2), 0));
ok("IoA <2 values = null", MX.ioaFromValues(["a"], 4) === null);
ok("jaccardMean identical = 1", approx(MX.jaccardMean([["a", "b"], ["a", "b"]]), 1));
ok("jaccardMean half-overlap = 1/3", approx(MX.jaccardMean([["a", "b"], ["b", "c"]]), 1 / 3));
ok("canonicity 2/3", approx(MX.canonicity(["a", "a", "b"], "a"), 2 / 3));
ok("setEq order-insensitive", MX.setEq(["a", "b"], ["b", "a"]) === true);

/* ---------- валидация таблицы разметки v0.2 ---------- */
const CONFS = MX.CONFS, COMPS = MX.COMPS;
let codeErrs = [];
function checkCode(where, code) {
  if (code == null) return;
  if (code.conf && CONFS.indexOf(code.conf) < 0) codeErrs.push(where + ": bad conf " + code.conf);
  if (code.sens && !/^[DPR][+-]$/.test(code.sens)) codeErrs.push(where + ": bad sens " + code.sens);
  if (code.w) Object.keys(code.w).forEach((c) => { if (COMPS.indexOf(c) < 0) codeErrs.push(where + ": bad comp " + c); if (Math.abs(code.w[c]) > 2) codeErrs.push(where + ": |w|>2"); });
  if (code.fear != null && !(code.fear >= 1 && code.fear <= 2)) codeErrs.push(where + ": bad fear");
}
let episodeCount = 0;
S.blocks.forEach((b) => b.items.forEach((it) => {
  if (it.comp) Object.keys(it.comp).forEach((c) => { if (COMPS.indexOf(c) < 0) codeErrs.push(it.id + ": bad comp key " + c); });
  if (it.scaleVal) Object.keys(it.scaleVal).forEach((c) => { if (COMPS.indexOf(c) < 0) codeErrs.push(it.id + ": bad scaleVal " + c); });
  if (it.scaleConf && CONFS.indexOf(it.scaleConf.conf) < 0) codeErrs.push(it.id + ": bad scaleConf");
  if (it.episode) {
    episodeCount++;
    if (!it.options || !it.options.length) codeErrs.push(it.id + ": episode without inline options");
    else it.options.forEach((o) => { if (!("code" in o)) codeErrs.push(it.id + "/" + o.id + ": option without code"); checkCode(it.id + "/" + o.id, o.code); });
  }
  if (it.episode && it.comp) codeErrs.push(it.id + ": episode must not feed IoA_c (comp set)");
}));
(CFG.b8_reaction || []).forEach((o) => checkCode("b8/" + o.id, o.code));
ok("coding table valid (no errors)", codeErrs.length === 0);
if (codeErrs.length) console.log("    " + codeErrs.join("\n    "));
ok("episode questions present (>=8)", episodeCount >= 8);

/* ---------- synthetic teams ---------- */
function ans(v) { return { value: v, skipped: v == null }; }
const SYN = { // команда-синергия: здоровые исходы
  A1: "растём в enterprise", A2: ["d1", "d2", "d3"], A3: "m1", A4: "a", A5: "Аня", A6: "s2", A6b: "b",
  A7: ["t1", "t2"], A8: "a", A9a: "a", A9b: "a", A9c: "a", A10: "r1", A11a: "p1", A11b: "p1", A13: "a", A12: 5,
  B1: ["v1", "v2", "v3"], B2: { "Скорость": ["дедлайн"], "Прозрачность": ["открытость"], "Ответственность": ["владелец"] },
  B3: "a", B4a: "a", B4: null, B5: "Борис", B6: 1, B7: "обходят ревью", B7b: 1, B8: "x2",
  B13: "a", B14: "a", B15: "a", B16: "a", B10: null, B11a: "b4", B11b: "b4", B12: 4,
};
const BRK = { // команда-поломка: диссонансные исходы
  A1: "не знаю", A2: ["d1", "d2", "d3"], A3: "m1", A4: "d", A5: "Аня", A6: "s2", A6b: "d",
  A7: ["t1", "t2"], A8: "d", A9a: "a", A9b: "a", A9c: "a", A10: "r1", A11a: "p2", A11b: "p5", A13: "d", A12: 5,
  B1: ["v1", "v2", "v3"], B2: { "Скорость": ["страх"], "Прозрачность": ["молчание"], "Ответственность": ["вина"] },
  B3: "d", B4a: "b", B4: null, B5: "Борис", B6: 5, B7: "всё", B7b: 5, B8: "x1",
  B13: "c", B14: "e", B15: "b", B16: "d", B10: null, B11a: "b1", B11b: "b4", B12: 5,
};
function mk(proto, i, isLeader, over) {
  const a = {}; Object.keys(proto).forEach((k) => { a[k] = ans(proto[k]); });
  if (over) Object.keys(over).forEach((k) => { a[k] = ans(over[k]); });
  return { v: 2, survey: "contours-0.2", groupKey: "t", isLeader: !!isLeader, life: "long",
    segment: { stage: i < 3 ? "6-24" : "24+", func: i % 2 ? "prod" : "gtm", loc: "hq" }, lang: "ru", startedAt: 0, finishedAt: 1, answers: a };
}

/* --- синергия: 1 лид + 6 участников, все здоровые --- */
const good = [mk(SYN, 0, true)]; for (let i = 1; i <= 6; i++) good.push(mk(SYN, i, false));
const g = MX.compute(good, S, CFG);
ok("not gated at N=6", g.gated === false && g.N === 6);
ok("A2 IoA=1, canon=1", approx(g.perItem.A2.ioa, 1) && approx(g.perItem.A2.canon, 1));
ok("episode item carries no canon (A13)", g.perItem.A13.canon === null);
ok("episode flag on perItem", g.perItem.A13.episode === true && g.perItem.A2.episode === false);
COMPS.forEach((c) => {
  ok("IoA_" + c + " = 1 (identical answers)", approx(g.components[c].ioa, 1, 1e-9));
  ok("Val_" + c + " > 0.5 (healthy episodes)", g.components[c].valence != null && g.components[c].valence > 0.5);
});
ok("all conflicts ~0 in synergy team", CONFS.every((k) => approx(g.conflicts[k].share, 0)));
ok("Δ→K1K2 delta = 0 (real == should)", approx(g.conflicts.K1K2.delta, 0));
ok("fear clean", g.fear.band === "clean");
ok("sensors positive (D,P,R)", g.sensors.D.valence > 0 && g.sensors.P.valence > 0 && g.sensors.R.valence > 0);
ok("life=long → lead ioa", g.life.value === "long" && g.life.lead === "ioa");

/* --- поломка: те же закрытые не-эпизодные ответы, но исходы диссонансные --- */
const bad = [mk(BRK, 0, true)]; for (let i = 1; i <= 6; i++) bad.push(mk(BRK, i, false));
const b = MX.compute(bad, S, CFG);
ok("broken team: IoA_S still 1 (they agree...)", approx(b.components.S.ioa, 1, 1e-6));
ok("broken team: Val_C strongly negative", b.components.C.valence < -0.5);
ok("broken team: Val_St negative", b.components.St.valence < -0.3);
ok("...= consensus about breakage, not blur", b.components.C.ioa > 0.9 && b.components.C.valence < 0);
ok("K2K3 conflict named (>0.25)", b.conflicts.K2K3.share > 0.25);
ok("K1K2 conflict present (>=0.10)", b.conflicts.K1K2.share >= 0.10);
ok("K1K4 conflict present", b.conflicts.K1K4.share > 0);
ok("Δ→K1K2 delta = 1 (real != should)", approx(b.conflicts.K1K2.delta, 1));
ok("fear poisoned", b.fear.band === "poisoned");
ok("sensors negative (P,R)", b.sensors.P.valence < 0 && b.sensors.R.valence < 0);
ok("conflict shares within [0,1] and answered>0", b.conflicts.answered > 0 && CONFS.every((k) => b.conflicts[k].share >= 0 && b.conflicts[k].share <= 1));

/* --- смешанная: половина A13=f (выгорание) — K1K4 растёт --- */
const mix = [mk(SYN, 0, true)]; for (let i = 1; i <= 6; i++) mix.push(mk(SYN, i, false, i <= 3 ? { A13: "f", B16: "b" } : {}));
const m = MX.compute(mix, S, CFG);
ok("mixed: K1K4 > 0", m.conflicts.K1K4.share > 0);
ok("mixed: fear strictly above synergy team", m.fear.index > g.fear.index);

/* ---------- gating / no leader / segments / meta / silence ---------- */
const small = MX.compute([mk(SYN, 0, true), mk(SYN, 1, false), mk(SYN, 2, false)], S, CFG);
ok("gated when members < minN", small.gated === true && small.N === 2);
const noLead = [1, 2, 3, 4, 5, 6].map((i) => mk(SYN, i, false));
const nl = MX.compute(noLead, S, CFG);
ok("no leader -> canon null", nl.perItem.A2.canon === null && nl.leaders === 0);
ok("segment cells < minN suppressed", nl.segments.func && Object.keys(nl.segments.func).every((k) => nl.segments.func[k].small === true));
const segTeam = [mk(SYN, 0, true)]; for (let i = 1; i <= 5; i++) { const r = mk(SYN, i, false); r.segment = { stage: "24+", func: "prod", loc: "hq" }; segTeam.push(r); }
const sg = MX.compute(segTeam, S, CFG);
ok("segment cell >= minN computes IoA·A2 = 1", sg.segments.func.prod.small !== true && approx(sg.segments.func.prod.ioaA2, 1));
ok("meta A expected = 1.0 (all 5s)", approx(g.meta.A.expected, 1));
ok("meta actual excludes episode items", g.meta.A.actual != null && g.meta.A.actual >= 0 && g.meta.A.actual <= 1);
ok("silence B > 0 (B4/B10 skipped)", g.silence.B > 0);
ok("semantic is 3 values", Array.isArray(g.semantic) && g.semantic.length === 3);
ok("sensitive B4 answers exposed only via values field", Array.isArray(g.perItem.B4.answers) && g.perItem.B4.answers.every((a) => a == null || a.latencyMs === undefined));

/* --- «прожитая» разметка из ИИ-кодировки --- */
ok("lived empty without coded answers", g.lived.n === 0);
const livedTeam = [mk(SYN, 0, true)]; for (let i = 1; i <= 6; i++) livedTeam.push(mk(SYN, i, false));
livedTeam[1].answers.B4 = { open: 1, skipped: false, value: { ai: 1, summary: "x", contours: ["K2", "K3"], components: ["St"], values: ["Прозрачность"], valence: -1 } };
livedTeam[2].answers.B7 = { open: 1, skipped: false, value: { ai: 1, summary: "y", contours: ["K2"], components: ["St"], values: ["Прозрачность"], valence: 1 } };
const lvr = MX.compute(livedTeam, S, CFG);
ok("lived counts coded answers", lvr.lived.n === 2);
ok("lived value ±", lvr.lived.values["Прозрачность"].minus === 1 && lvr.lived.values["Прозрачность"].plus === 1);
ok("lived contours touched", lvr.lived.contours.K2 === 2 && lvr.lived.contours.K3 === 1);

/* --- два лида расходятся на A2 --- */
const l2 = mk(SYN, 9, true); l2.answers.A2 = ans(["d4", "d5", "d6"]);
const dis = MX.compute([mk(SYN, 0, true), l2, mk(SYN, 1, false), mk(SYN, 2, false), mk(SYN, 3, false), mk(SYN, 4, false), mk(SYN, 5, false)], S, CFG);
ok("two leaders disagreeing flagged", dis.leaderDisagree === true);

console.log(`\ncontours metrics v0.2: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
