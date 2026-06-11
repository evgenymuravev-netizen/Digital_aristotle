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
import { corsiScore } from "../js/tests/corsi.js";
import { codingScore } from "../js/tests/coding.js";
import { gonogoScore } from "../js/tests/gonogo.js";
import { switchingScore } from "../js/tests/switching.js";
import { spanScore } from "../js/tests/digitspan.js";
import { weightedScore, TIERS } from "../js/tests/sequences.js";
import { dPrime } from "../js/tests/nback.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const near = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;

const ALL_IDS = ["reaction", "coding", "nback", "corsi", "stroop", "gonogo", "digitspan", "switching", "mentalmath", "sequences"];

console.log("registry");
test("battery has the 10 tests in canonical order", () => {
  assert.deepEqual(META.map((m) => m.id), ALL_IDS);
});
test("every test has icon, domain, duration and seconds", () => {
  for (const m of META) {
    assert.ok(m.icon && m.domain && m.duration, `${m.id} missing display meta`);
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
test("planFullAssessment: nothing recent → run everything (10-test battery)", () => {
  const plan = planFullAssessment([], META, now, RESUME_WINDOW_MS);
  assert.equal(plan.reusableCount, 0);
  assert.equal(plan.remainingIds.length, 10);
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
