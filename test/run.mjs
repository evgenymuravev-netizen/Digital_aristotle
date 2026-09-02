/* ============================================================
   test/run.mjs — unit tests for the pure logic.
   Run with:  node test/run.mjs
   These import only DOM-free code paths (norms, stats, and the
   exported scoring functions of each test module), so they run
   under plain Node with no dependencies.
   ============================================================ */
import assert from "node:assert/strict";
import {
  normalCdf, probit, compareToNorm, normReference, overallNorm,
  ordinal, fmtNorm, bandFor, TESTINFO,
} from "../js/norms.js";
import {
  recentSingleResults, planFullAssessment, verdictFromSeries,
  fullCompositeSeries, CORE_V1_IDS, RESUME_WINDOW_MS,
} from "../js/stats.js";
import { TESTS, META, byId, NEW_IDS } from "../js/tests/index.js";
import { hasIcon } from "../js/icons.js";
import {
  REFLECT_TEMPLATES, sampleReflect, SYLLOGISM_SETS, buildSyllogism, sampleLogic,
  EVIDENCE_BANK, sampleEvidence, checkAnswer, criticalScore, biasIndex, overconfidence, COUNTS,
} from "../js/tests/critical.js";
import {
  sessionize, detectFormat, parseChatGPT, parseClaude, parseGemini, parseGenericCSV, parseExport,
  aggregate, weekly, weekStart, exposureBefore, pearson, exposureVsSessions, normalizeProduct, dayKey,
} from "../js/aiusage.js";
import { corsiScore } from "../js/tests/corsi.js";
import { codingScore } from "../js/tests/coding.js";
import { gonogoScore } from "../js/tests/gonogo.js";
import { switchingScore } from "../js/tests/switching.js";
import { spanScore } from "../js/tests/digitspan.js";
import { weightedScore, TIERS } from "../js/tests/sequences.js";
import { dPrime } from "../js/tests/nback.js";
import {
  personalBest, attemptCount, pastAverage, tierForPercentile,
  achievementsFor, sessionAchievements, strongestAndWeakest, TIERS as ACH_TIERS,
} from "../js/achievements.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const near = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;

const ALL_IDS = ["reaction", "coding", "nback", "corsi", "critical", "stroop", "gonogo", "digitspan", "switching", "mentalmath", "sequences"];

console.log("registry");
test("battery has the 10 tests in canonical order", () => {
  assert.deepEqual(META.map((m) => m.id), ALL_IDS);
});
test("every test has a line icon, domain, duration and seconds", () => {
  for (const m of META) {
    // icons live in icons.js keyed by test id — no emoji in the metadata
    assert.ok(hasIcon(m.id), `${m.id} has no icon in icons.js`);
    assert.ok(m.domain && m.duration, `${m.id} missing display meta`);
    assert.ok(typeof m.seconds === "number" && m.seconds > 0, `${m.id} missing seconds`);
  }
});
test("NEW_IDS are all registered", () => {
  for (const id of NEW_IDS) assert.ok(byId[id], id);
});

console.log("norms — normal distribution");
test("normalCdf(0) ≈ 0.5", () => assert.ok(near(normalCdf(0), 0.5)));
test("normalCdf(1.6449) ≈ 0.95", () => assert.ok(near(normalCdf(1.6449), 0.95)));
test("normalCdf(-1.6449) ≈ 0.05", () => assert.ok(near(normalCdf(-1.6449), 0.05)));
test("normalCdf is monotonic", () => {
  let prev = -1;
  for (let z = -3; z <= 3; z += 0.25) { const v = normalCdf(z); assert.ok(v > prev); prev = v; }
});
test("probit inverts normalCdf", () => {
  for (const p of [0.05, 0.25, 0.5, 0.75, 0.975]) assert.ok(near(normalCdf(probit(p)), p, 0.001), String(p));
  assert.ok(near(probit(0.5), 0, 1e-6));
  assert.ok(near(probit(0.975), 1.96, 0.001));
});

console.log("norms — percentile vs population");
test("at the mean → ~50th percentile", () => {
  assert.equal(compareToNorm("reaction", 270).pct, 50);
  assert.equal(compareToNorm("digitspan", 11.3).pct, 50);
  assert.equal(compareToNorm("stroop", 100).pct, 50);
  assert.equal(compareToNorm("corsi", 6.0).pct, 50);
  assert.equal(compareToNorm("switching", 280).pct, 50);
});
test("reaction is lower-is-better", () => {
  assert.ok(compareToNorm("reaction", 200).pct > 50);
  assert.ok(compareToNorm("reaction", 400).pct < 50);
});
test("switch cost is lower-is-better", () => {
  assert.ok(compareToNorm("switching", 100).pct > compareToNorm("switching", 500).pct);
});
test("digit span total is higher-is-better", () => {
  assert.ok(compareToNorm("digitspan", 14).pct > 50);
  assert.ok(compareToNorm("digitspan", 8).pct < 50);
});
test("percentile is clamped to 1..99", () => {
  assert.ok(compareToNorm("reaction", 50).pct <= 99);
  assert.ok(compareToNorm("reaction", 900).pct >= 1);
});
test("null for unknown id or missing value", () => {
  assert.equal(compareToNorm("nope", 1), null);
  assert.equal(compareToNorm("reaction", null), null);
  assert.equal(compareToNorm("reaction", NaN), null);
});
test("every registered test has full info + a norm", () => {
  for (const id of ALL_IDS) {
    const info = TESTINFO[id];
    assert.ok(info && info.measures && info.why && info.realWorld, `${id} missing prose`);
    assert.ok(info.norm && typeof info.norm.mean === "number" && info.norm.sd > 0, `${id} bad norm`);
    assert.ok(normReference(id).typical, `${id} no reference`);
  }
});
test("overallNorm averages standings; all-at-mean → 50th", () => {
  const results = ALL_IDS.map((id) => ({ id, raw: TESTINFO[id].norm.mean }));
  const ov = overallNorm(results);
  assert.equal(ov.pct, 50);
  assert.equal(ov.n, ALL_IDS.length);
});
test("overallNorm skips unknown ids and caps extremes at ±3σ", () => {
  const ov = overallNorm([{ id: "reaction", raw: 0 }, { id: "ghost", raw: 5 }]);
  assert.equal(ov.n, 1);
  assert.ok(ov.z <= 3);
  assert.equal(overallNorm([{ id: "ghost", raw: 5 }]), null);
});

console.log("norms — formatting helpers");
test("ordinal()", () => {
  assert.equal(ordinal(1), "1st"); assert.equal(ordinal(2), "2nd"); assert.equal(ordinal(3), "3rd");
  assert.equal(ordinal(11), "11th"); assert.equal(ordinal(21), "21st"); assert.equal(ordinal(78), "78th");
});
test("fmtNorm()", () => {
  assert.equal(fmtNorm(270.4, "ms"), "270 ms");
  assert.equal(fmtNorm(85, "%"), "85%");
  assert.equal(fmtNorm(11.3, "digits"), "11.3 digits");
  assert.equal(fmtNorm(6, "blocks"), "6 blocks");
  assert.equal(fmtNorm(5, "of 8"), "5 / 8");
});
test("bandFor() bands", () => {
  assert.equal(bandFor(95).label, "Exceptional");
  assert.equal(bandFor(50).label, "About average");
  assert.equal(bandFor(10).label, "Well below average");
  assert.equal(bandFor(95).cls, "up");
  assert.equal(bandFor(10).cls, "down");
});

console.log("scoring — new tests");
test("corsiScore anchors", () => {
  assert.equal(corsiScore(2), 0);
  assert.equal(corsiScore(8), 100);
  assert.ok(near(corsiScore(6), 66.67, 0.1));
  assert.equal(corsiScore(0), 0);   // clamped
});
test("codingScore anchors", () => {
  assert.equal(codingScore(0), 0);
  assert.equal(codingScore(36), 100);
  assert.equal(codingScore(18), 50);
  assert.equal(codingScore(50), 100);   // clamped
});
test("gonogoScore: perfect & fast ≈ 100, chance ≈ low, no-press → 0", () => {
  assert.ok(gonogoScore({ goAcc: 1, nogoAcc: 1, medRT: 250 }) === 100);
  assert.ok(gonogoScore({ goAcc: 1, nogoAcc: 0, medRT: 250 }) <= 20);  // pressing everything
  assert.equal(gonogoScore({ goAcc: 0, nogoAcc: 1, medRT: null }), 0); // pressing nothing
});
test("gonogoScore rewards inhibition more than raw speed", () => {
  const inhibitor = gonogoScore({ goAcc: 0.95, nogoAcc: 1, medRT: 420 });
  const spammer = gonogoScore({ goAcc: 1, nogoAcc: 0.6, medRT: 280 });
  assert.ok(inhibitor > spammer);
});
test("switchingScore: typical adult lands mid-range, flawless is 100", () => {
  const typical = switchingScore({ acc: 0.92, cost: 280 });
  assert.ok(typical > 60 && typical < 85, String(typical));
  assert.equal(switchingScore({ acc: 1, cost: 0 }), 100);
  assert.equal(switchingScore({ acc: 0.5, cost: 900 }), 0);
  // negative cost (faster on switches) caps the cost component at full marks
  assert.equal(switchingScore({ acc: 1, cost: -50 }), 100);
});
test("spanScore: forward & backward halves average", () => {
  assert.ok(near(spanScore(7, 5), (((7 - 2) / 7) * 100 + ((5 - 1) / 7) * 100) / 2, 0.01));
  assert.equal(spanScore(2, 1), 0);
  assert.equal(spanScore(9, 8), 100);
});
test("weightedScore: hard problems move the needle more", () => {
  const all = weightedScore([{ correct: true, w: 1 }, { correct: true, w: 1.4 }, { correct: true, w: 1.8 }]);
  assert.equal(all, 100);
  const onlyEasy = weightedScore([{ correct: true, w: 1 }, { correct: false, w: 1.4 }, { correct: false, w: 1.8 }]);
  const onlyHard = weightedScore([{ correct: false, w: 1 }, { correct: false, w: 1.4 }, { correct: true, w: 1.8 }]);
  assert.ok(onlyHard > onlyEasy);
  assert.equal(weightedScore([]), 0);
});
test("sequences tiers escalate in weight", () => {
  assert.ok(TIERS[0].w < TIERS[1].w && TIERS[1].w < TIERS[2].w);
});
test("dPrime: perfect detection is strongly positive, guessing ≈ 0", () => {
  assert.ok(dPrime(8, 8, 0, 16) > 3);
  assert.ok(Math.abs(dPrime(4, 8, 8, 16)) < 0.01);
  assert.ok(dPrime(0, 8, 16, 16) < -3);
});

console.log("stats — resume planning");
const now = 1_000_000_000_000;
const ids6 = CORE_V1_IDS;
const tests6 = ids6.map((id) => ({ id }));
const sessions = [
  { id: "a", ts: now - 5 * 60_000, kind: "single", scores: { reaction: 80 }, raw: { reaction: 230 }, labels: { reaction: "230 ms" } },
  { id: "b", ts: now - 10 * 60_000, kind: "single", scores: { nback: 70 }, raw: { nback: 82 } },
  { id: "c", ts: now - 2 * 60 * 60_000, kind: "single", scores: { digitspan: 60 }, raw: { digitspan: 7 } }, // outside window
  { id: "d", ts: now - 3 * 60_000, kind: "full", scores: { reaction: 50, nback: 50, digitspan: 50, stroop: 50, mentalmath: 50, sequences: 50 }, raw: {} }, // full → ignored for resume
  { id: "e", ts: now - 1 * 60_000, kind: "single", scores: { reaction: 90 }, raw: { reaction: 210 } }, // newer reaction
];

test("recentSingleResults: only recent singles, newest wins", () => {
  const r = recentSingleResults(sessions, ids6, now, RESUME_WINDOW_MS);
  assert.equal(r.reaction.sessionId, "e");
  assert.equal(r.reaction.score, 90);
  assert.equal(r.nback.score, 70);
  assert.equal(r.digitspan, undefined);
});
test("recentSingleResults: ignores full sessions", () => {
  const r = recentSingleResults(sessions, ids6, now, RESUME_WINDOW_MS);
  assert.equal(r.stroop, undefined);
  assert.equal(r.mentalmath, undefined);
});
test("planFullAssessment: reusable + remaining", () => {
  const plan = planFullAssessment(sessions, tests6, now, RESUME_WINDOW_MS);
  assert.equal(plan.reusableCount, 2);
  assert.deepEqual(plan.remainingIds, ["digitspan", "stroop", "mentalmath", "sequences"]);
  assert.deepEqual(plan.reusable.map((x) => x.id), ["reaction", "nback"]);
});
test("planFullAssessment: nothing recent → run everything (11-test battery)", () => {
  const plan = planFullAssessment([], META, now, RESUME_WINDOW_MS);
  assert.equal(plan.reusableCount, 0);
  assert.equal(plan.remainingIds.length, 11);
});

console.log("stats — composite series & battery versions");
test("legacy six-test sessions still chart as full", () => {
  const legacy = { id: "L", ts: 1, kind: "full", scores: Object.fromEntries(ids6.map((id) => [id, 60])) };
  const v2 = { id: "N", ts: 2, kind: "full", scores: Object.fromEntries(ALL_IDS.map((id) => [id, 80])) };
  const single = { id: "S", ts: 3, kind: "single", scores: { reaction: 90 } };
  const series = fullCompositeSeries([legacy, v2, single], ALL_IDS);
  assert.equal(series.length, 2);
  assert.equal(series[0].score, 60);   // mean of its own six
  assert.equal(series[1].score, 80);   // mean of all ten
});

console.log("stats — verdict sanity");
test("too few sessions → insufficient", () => {
  assert.equal(verdictFromSeries([50, 52]).status, "insufficient");
});
test("flat series → holding steady", () => {
  assert.equal(verdictFromSeries([70, 71, 69, 70, 72]).status, "stable");
});
test("clear drop → reliable decline", () => {
  assert.equal(verdictFromSeries([80, 82, 79, 81, 60, 58]).status, "decline");
});
test("clear rise → improving", () => {
  assert.equal(verdictFromSeries([50, 52, 51, 53, 70, 72]).status, "improving");
});


/* ---------------------------------------------------------------
   achievements — celebrating the right things, and only those
   --------------------------------------------------------------- */
// mirrors the real storage schema (storage.js saveSession): scores keyed by test id
const sess = (id, kind, scores, ts = 0) => ({ id, kind, ts, scores, raw: {}, labels: {} });
const HIST = [
  sess("s1", "single", { reaction: 50 }),
  sess("s2", "single", { reaction: 70 }),
  sess("s3", "full", { reaction: 60, nback: 40 }),
];

console.log("achievements — history helpers");
test("personalBest picks the max across all sessions", () => {
  assert.equal(personalBest(HIST, "reaction"), 70);
  assert.equal(personalBest(HIST, "nback"), 40);
});
test("personalBest returns null when never taken", () => {
  assert.equal(personalBest(HIST, "corsi"), null);
});
test("excludeSessionId keeps the current run out of its own comparison", () => {
  assert.equal(personalBest(HIST, "reaction", "s2"), 60);
  assert.equal(attemptCount(HIST, "reaction", "s2"), 2);
});
test("pastAverage averages prior attempts", () => {
  assert.equal(pastAverage(HIST, "reaction"), 60);   // (50+70+60)/3
  assert.equal(pastAverage(HIST, "corsi"), null);
});

test("history helpers read the same schema storage.js writes", () => {
  // saveSession() persists {scores:{id:n}} — not a results array. If that ever
  // changes, these helpers must change with it or every result reads as "first".
  const stored = sess("z", "single", { reaction: 42 });
  assert.equal(personalBest([stored], "reaction"), 42);
  assert.equal(attemptCount([stored], "reaction"), 1);
  assert.equal(pastAverage([stored], "reaction"), 42);
});

console.log("achievements — tiers");
test("tierForPercentile thresholds", () => {
  assert.equal(tierForPercentile(97), "legendary");
  assert.equal(tierForPercentile(88), "great");
  assert.equal(tierForPercentile(72), "good");
  assert.equal(tierForPercentile(57), "solid");
  assert.equal(tierForPercentile(40), "none");
  assert.equal(tierForPercentile(null), "none");
});
test("tiers are ordered loudest-first by rank", () => {
  assert.ok(ACH_TIERS.legendary.rank > ACH_TIERS.great.rank);
  assert.ok(ACH_TIERS.great.rank > ACH_TIERS.good.rank);
  assert.ok(ACH_TIERS.solid.rank > ACH_TIERS.none.rank);
});

console.log("achievements — what gets celebrated");
test("a weak result is not celebrated", () => {
  const a = achievementsFor({ score: 30, pct: 20, sessions: HIST, testId: "reaction" });
  assert.equal(a.tier, "none");
  assert.equal(a.headline, null);
});
test("a top-1% result is legendary", () => {
  const a = achievementsFor({ score: 99, pct: 99, sessions: HIST, testId: "reaction" });
  assert.equal(a.tier, "legendary");
  assert.ok(a.badges.some((b) => b.key === "top1"));
});
test("first-ever attempt is a baseline, never a personal best", () => {
  const a = achievementsFor({ score: 80, pct: 50, sessions: HIST, testId: "corsi" });
  assert.equal(a.isFirst, true);
  assert.equal(a.isPB, false);
  assert.ok(a.badges.some((b) => b.key === "baseline"));
});
test("beating your old best is a PB and gets promoted to a loud tier", () => {
  const a = achievementsFor({ score: 90, pct: 50, sessions: HIST, testId: "reaction" });
  assert.equal(a.isPB, true);
  assert.equal(a.tier, "great");           // promoted despite a mid percentile
  assert.match(a.headline, /personal best/i);
});
test("matching your old best is not a PB", () => {
  const a = achievementsFor({ score: 70, pct: 50, sessions: HIST, testId: "reaction" });
  assert.equal(a.isPB, false);
});
test("deltaVsAvg is measured against prior attempts only", () => {
  const a = achievementsFor({ score: 75, pct: 50, sessions: HIST, testId: "reaction" });
  assert.equal(Math.round(a.deltaVsAvg), 15);   // 75 - 60
  assert.ok(a.badges.some((b) => b.key === "above-own"));
});
test("a missing norm (pct null) still celebrates a personal best", () => {
  const a = achievementsFor({ score: 95, pct: null, sessions: HIST, testId: "reaction" });
  assert.equal(a.isPB, true);
  assert.notEqual(a.tier, "none");
});

console.log("achievements — session level");
test("first full assessment reads as a baseline", () => {
  const a = sessionAchievements({ overallPct: 55, composite: 50, sessions: [], sessionId: null });
  assert.equal(a.isFirst, true);
  assert.match(a.headline, /baseline/i);
});
test("beating your best composite is called out", () => {
  const hist = [sess("f1", "full", { reaction: 50, nback: 50 })];
  const a = sessionAchievements({ overallPct: 60, composite: 70, sessions: hist });
  assert.equal(a.isPB, true);
  assert.ok(a.badges.some((b) => b.key === "pb"));
});
test("singles do not count toward the composite best", () => {
  const hist = [sess("x", "single", { reaction: 99 })];
  const a = sessionAchievements({ overallPct: 50, composite: 40, sessions: hist });
  assert.equal(a.isFirst, true);   // no prior *full* session
});

console.log("achievements — strongest / weakest");
test("picks the highest and lowest percentile tests", () => {
  const results = [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }];
  const { best, worst } = strongestAndWeakest(results, { a: 90, b: 40, c: 65 });
  assert.equal(best.id, "a");
  assert.equal(worst.id, "b");
});
test("a single test has no contrast to draw", () => {
  const { best, worst } = strongestAndWeakest([{ id: "a", name: "A" }], { a: 90 });
  assert.equal(best.id, "a");
  assert.equal(worst, null);
});
test("tests without norms are skipped", () => {
  const { best, worst } = strongestAndWeakest([{ id: "a" }, { id: "z" }], { a: 80 });
  assert.equal(best.id, "a");
  assert.equal(worst, null);
});


/* ---------------------------------------------------------------
   critical thinking — item generation is correct by construction
   --------------------------------------------------------------- */
console.log("critical — reflection templates");
test("every template yields a self-consistent item, over many draws", () => {
  for (let k = 0; k < 40; k++) {
    for (const t of REFLECT_TEMPLATES) {
      const it = t();
      assert.ok(it.prompt && it.kind === "reflect", "shape");
      assert.ok(["number", "text", "choice"].includes(it.mode));
      if (it.mode === "choice") assert.ok(it.answer >= 0 && it.answer < it.options.length);
      // the intuitive answer must be wrong, or the item measures nothing
      if (it.intuitive != null) assert.notEqual(it.intuitive, it.answer, `${it.prompt} intuitive==answer`);
      // the correct answer, given as the user would type it, must check out
      const given = it.mode === "choice" ? it.answer : it.mode === "text" ? it.answer.toUpperCase() : String(it.answer);
      assert.ok(checkAnswer(it, given), `own answer rejected: ${it.prompt}`);
    }
  }
});
test("bat-and-ball algebra holds: cheaper + (cheaper + diff) = total", () => {
  for (let k = 0; k < 30; k++) {
    const it = REFLECT_TEMPLATES[0]();
    const m = it.prompt.match(/cost \$([\d.]+) in total.*costs \$([\d.]+) more/);
    const total = parseFloat(m[1]), diff = parseFloat(m[2]);
    assert.ok(Math.abs(it.answer + (it.answer + diff) - total) < 1e-9);
    assert.ok(checkAnswer(it, `$${it.answer.toFixed(2)}`));
    assert.ok(!checkAnswer(it, String(total - diff)), "intuitive answer must fail");
  }
});
test("sampleReflect draws distinct templates", () => {
  const items = sampleReflect();
  assert.equal(items.length, COUNTS.reflect);
  assert.equal(new Set(items.map((i) => i.prompt.slice(0, 12))).size, items.length);
});
test("number answers tolerate $ and whitespace; text answers ignore case", () => {
  const it = { mode: "number", answer: 0.05 };
  assert.ok(checkAnswer(it, " $0.05 ")); assert.ok(checkAnswer(it, ".05")); assert.ok(!checkAnswer(it, "0.1"));
  assert.ok(checkAnswer({ mode: "text", answer: "emily" }, "  EMILY "));
  assert.ok(!checkAnswer({ mode: "text", answer: "emily" }, "may"));
  assert.ok(!checkAnswer(it, null)); assert.ok(!checkAnswer(it, ""));
});

console.log("critical — belief-bias syllogisms");
test("2×2 design: validity and believability land in the right cells", () => {
  const set = SYLLOGISM_SETS[0];
  const vb = buildSyllogism(set, 1, true), iu = buildSyllogism(set, 1, false);
  const vu = buildSyllogism(set, 2, true), ib = buildSyllogism(set, 2, false);
  assert.deepEqual([vb.cell, iu.cell, vu.cell, ib.cell], ["VB", "IU", "VU", "IB"]);
  assert.equal(vb.conflict, false); assert.equal(iu.conflict, false);
  assert.equal(vu.conflict, true); assert.equal(ib.conflict, true);
  // form 1, valid: "No A are C. Some B are C. ∴ some B are not A"
  assert.match(vb.prompt, /^No cigarettes are inexpensive\. Some addictive things are inexpensive\.$/);
  assert.equal(vb.conclusion, "Therefore, some addictive things are not cigarettes.");
  // form 2, valid: "No B are C. Some A are C. ∴ some A are not B"  (true but unbelievable)
  assert.equal(vu.conclusion, "Therefore, some cigarettes are not addictive things.");
  assert.equal(vu.answer, 0); assert.equal(ib.answer, 1);
});
test("sampleLogic: six items, four in conflict, all different content", () => {
  for (let k = 0; k < 20; k++) {
    const items = sampleLogic();
    assert.equal(items.length, COUNTS.logic);
    assert.equal(items.filter((i) => i.conflict).length, 4);
    assert.equal(new Set(items.map((i) => i.prompt.split(" ")[1])).size >= 5, true);
    assert.ok(items.every((i) => i.explain && i.options.length === 2));
  }
});
test("biasIndex: perfect on no-conflict, chance on conflict → +50", () => {
  const items = [
    { conflict: false, correct: true }, { conflict: false, correct: true },
    { conflict: true, correct: true }, { conflict: true, correct: false },
    { conflict: true, correct: true }, { conflict: true, correct: false },
  ];
  assert.equal(biasIndex(items), 50);
  assert.equal(biasIndex([{ conflict: true, correct: true }]), null);
});

console.log("critical — evidence & scoring");
test("evidence bank labels are valid and every item explains itself", () => {
  for (const e of EVIDENCE_BANK) {
    assert.ok([0, 1, 2].includes(e.answer)); assert.ok(e.passage && e.claim && e.explain);
  }
  assert.ok(EVIDENCE_BANK.filter((e) => e.answer === 1).length >= 4, "enough 'not enough information' items to rotate");
});
test("sampleEvidence: 2 NEI + 1 follows + 1 contradicts, distinct", () => {
  for (let k = 0; k < 20; k++) {
    const items = sampleEvidence();
    const counts = [0, 1, 2].map((a) => items.filter((i) => i.answer === a).length);
    assert.deepEqual(counts, [1, 2, 1]);
    assert.equal(new Set(items.map((i) => i.passage)).size, 4);
  }
});
test("criticalScore weights 35/35/30 and clamps", () => {
  const full = { reflect: { correct: 4, total: 4 }, logic: { correct: 6, total: 6 }, evidence: { correct: 4, total: 4 } };
  assert.equal(criticalScore(full), 100);
  const half = { reflect: { correct: 2, total: 4 }, logic: { correct: 3, total: 6 }, evidence: { correct: 2, total: 4 } };
  assert.ok(near(criticalScore(half), 50));
  const onlyLogic = { reflect: { correct: 0, total: 4 }, logic: { correct: 6, total: 6 }, evidence: { correct: 0, total: 4 } };
  assert.ok(near(criticalScore(onlyLogic), 35));
});
test("overconfidence: sure-and-wrong is positive, guessing-and-right is negative", () => {
  assert.ok(near(overconfidence([{ conf: 0.9, correct: false }, { conf: 0.9, correct: false }]), 0.9));
  assert.ok(overconfidence([{ conf: 0.5, correct: true }]) < 0);
  assert.equal(overconfidence([{ conf: null, correct: true }]), null);
});

/* ---------------------------------------------------------------
   AI usage — parsing, sessionising, aggregating, correlating
   --------------------------------------------------------------- */
const T0 = Date.parse("2026-08-10T09:00:00");   // local Monday morning
const MIN = 60000;
console.log("aiusage — sessionising");
test("messages within the idle gap form one sitting; a long gap starts another", () => {
  const ev = [0, 2, 5, 9].map((m) => ({ t: T0 + m * MIN, user: true }))          // 9 min + tail
    .concat([40, 42].map((m) => ({ t: T0 + m * MIN, user: m === 40 })));          // 2 min + tail
  const days = sessionize(ev);
  assert.equal(days.length, 1);
  assert.equal(days[0].sessions, 2);
  assert.equal(days[0].messages, 5);
  assert.ok(near(days[0].minutes, 9 + 1.5 + 2 + 1.5, 0.11));
});
test("a lone message still counts as a short sitting; empty input → nothing", () => {
  assert.equal(sessionize([{ t: T0, user: true }])[0].minutes, 1.5);
  assert.deepEqual(sessionize([]), []);
});
test("sittings are attributed to the day they start", () => {
  const ev = [{ t: T0, user: true }, { t: T0 + 3 * MIN, user: false }, { t: T0 + 26 * 60 * MIN, user: true }];
  const days = sessionize(ev);
  assert.equal(days.length, 2);
  assert.equal(days[0].date, dayKey(T0));
});

console.log("aiusage — export formats");
const chatgptFixture = [{
  title: "hello", create_time: T0 / 1000,
  mapping: {
    a: { message: { author: { role: "system" }, create_time: T0 / 1000 } },
    b: { message: { author: { role: "user" }, create_time: T0 / 1000 + 5 } },
    c: { message: { author: { role: "assistant" }, create_time: T0 / 1000 + 20 } },
    d: { message: null },
  },
}, { title: "empty", mapping: {} }];
const claudeFixture = [{ uuid: "x", name: "chat", chat_messages: [
  { sender: "human", created_at: new Date(T0 + 60 * MIN).toISOString() },
  { sender: "assistant", created_at: new Date(T0 + 61 * MIN).toISOString() },
] }];
const geminiFixture = [{ header: "Gemini Apps", title: "Prompted hi", time: new Date(T0).toISOString(), products: ["Gemini Apps"] }];
test("detectFormat recognises the three exports and rejects junk", () => {
  assert.equal(detectFormat(chatgptFixture), "chatgpt");
  assert.equal(detectFormat(claudeFixture), "claude");
  assert.equal(detectFormat(geminiFixture), "gemini");
  assert.equal(detectFormat([{ foo: 1 }]), null);
  assert.equal(detectFormat({}), null);
});
test("parseChatGPT counts user turns and conversations, skips system/null nodes", () => {
  const p = parseChatGPT(chatgptFixture);
  assert.equal(p.product, "ChatGPT"); assert.equal(p.conversations, 1);
  assert.equal(p.events.length, 2); assert.equal(p.events.filter((e) => e.user).length, 1);
});
test("parseClaude / parseGemini", () => {
  const c = parseClaude(claudeFixture); assert.equal(c.events.length, 2); assert.equal(c.conversations, 1);
  const g = parseGemini(geminiFixture); assert.equal(g.events.length, 1); assert.equal(g.product, "Gemini");
});
test("parseExport: JSON end-to-end gives per-day records tagged with the product", () => {
  const out = parseExport(JSON.stringify(claudeFixture));
  assert.equal(out.format, "claude"); assert.equal(out.product, "Claude");
  assert.equal(out.records.length, 1); assert.equal(out.records[0].product, "Claude");
  assert.equal(out.stats.conversations, 1);
  const hinted = parseExport(JSON.stringify(claudeFixture), "Other");
  assert.equal(hinted.records[0].product, "Other");
});
test("parseExport: CSV with header, product normalisation, bad rows skipped", () => {
  const csv = "date,product,minutes,sessions\n2026-08-10,chat gpt,30,2\n2026-08-11,cursor,45\nnot-a-date,x,5\n";
  const out = parseExport(csv);
  assert.equal(out.format, "csv"); assert.equal(out.records.length, 2);
  assert.equal(out.records[0].product, "ChatGPT"); assert.equal(out.records[1].product, "Cursor");
  assert.equal(out.records[1].sessions, 1);
  assert.throws(() => parseExport("garbage"), /Couldn't read/);
  assert.throws(() => parseExport("[{\"foo\":1}]"), /Unrecognised/);
});
test("normalizeProduct maps aliases", () => {
  assert.equal(normalizeProduct("OpenAI GPT-5"), "ChatGPT");
  assert.equal(normalizeProduct("anthropic"), "Claude");
  assert.equal(normalizeProduct("Bard"), "Gemini");
  assert.equal(normalizeProduct("whatever"), "Other");
});

console.log("aiusage — aggregation & correlation");
const recs = [
  { date: "2026-08-03", product: "ChatGPT", minutes: 60, sessions: 2, messages: 10 },
  { date: "2026-08-04", product: "Claude", minutes: 30, sessions: 1, messages: 4 },
  { date: "2026-08-10", product: "ChatGPT", minutes: 120, sessions: 3, messages: 20 },
];
test("aggregate totals and per-product split", () => {
  const a = aggregate(recs);
  assert.equal(a.minutes, 210); assert.ok(near(a.hours, 3.5)); assert.equal(a.sessions, 6); assert.equal(a.days, 3);
  assert.equal(a.byProduct.ChatGPT.minutes, 180); assert.equal(a.byProduct.Claude.sessions, 1);
});
test("weekStart is Monday; weekly buckets are oldest→newest and sum correctly", () => {
  assert.equal(weekStart("2026-08-13"), "2026-08-10");   // Thu → Mon
  assert.equal(weekStart("2026-08-10"), "2026-08-10");
  const w = weekly(recs, { weeks: 3, now: Date.parse("2026-08-13T12:00:00") });
  assert.deepEqual(w.map((b) => b.start), ["2026-07-27", "2026-08-03", "2026-08-10"]);
  assert.deepEqual(w.map((b) => b.minutes), [0, 90, 120]);
});
test("exposureBefore: 7-day window is 4th..10th, so the 3rd is excluded", () => {
  assert.equal(exposureBefore(recs, Date.parse("2026-08-10T20:00:00"), 7), 150);
  assert.equal(exposureBefore(recs, Date.parse("2026-08-04T20:00:00"), 7), 90);
});
test("pearson: perfect negative, null on tiny or flat samples", () => {
  assert.ok(near(pearson([1, 2, 3, 4], [8, 6, 4, 2]), -1));
  assert.equal(pearson([1, 2], [1, 2]), null);
  assert.equal(pearson([1, 1, 1], [1, 2, 3]), null);
});
test("exposureVsSessions lines up full sessions with prior-week hours", () => {
  const sessions = [
    { id: "a", kind: "full", ts: Date.parse("2026-08-05T18:00:00"), scores: { reaction: 70, critical: 80 } },
    { id: "b", kind: "single", ts: Date.parse("2026-08-06T18:00:00"), scores: { reaction: 99 } },
    { id: "c", kind: "full", ts: Date.parse("2026-08-11T18:00:00"), scores: { reaction: 60, critical: 50 } },
  ];
  const x = exposureVsSessions(recs, sessions, "critical");
  assert.equal(x.n, 2);
  assert.ok(near(x.rows[0].hours, 1.5)); assert.ok(near(x.rows[1].hours, 2.0));
  assert.equal(x.rows[1].composite, 55); assert.equal(x.rows[1].testScore, 50);
  assert.equal(x.rComposite, null);   // n < 3
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
