/* ============================================================
   test/run.mjs — unit tests for the pure logic.
   Run with:  node test/run.mjs
   These import only DOM-free modules (norms.js, stats.js, ui.js),
   so they run under plain Node with no dependencies.
   ============================================================ */
import assert from "node:assert/strict";
import {
  normalCdf, compareToNorm, normReference, ordinal, fmtNorm, bandFor, TESTINFO,
} from "../js/norms.js";
import {
  recentSingleResults, planFullAssessment, verdictFromSeries, RESUME_WINDOW_MS,
} from "../js/stats.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const near = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;

console.log("norms — normal distribution");
test("normalCdf(0) ≈ 0.5", () => assert.ok(near(normalCdf(0), 0.5)));
test("normalCdf(1.6449) ≈ 0.95", () => assert.ok(near(normalCdf(1.6449), 0.95)));
test("normalCdf(-1.6449) ≈ 0.05", () => assert.ok(near(normalCdf(-1.6449), 0.05)));
test("normalCdf is monotonic", () => {
  let prev = -1;
  for (let z = -3; z <= 3; z += 0.25) { const v = normalCdf(z); assert.ok(v > prev); prev = v; }
});

console.log("norms — percentile vs population");
test("at the mean → ~50th percentile", () => {
  assert.equal(compareToNorm("reaction", 270).pct, 50);
  assert.equal(compareToNorm("digitspan", 6.6).pct, 50);
  assert.equal(compareToNorm("stroop", 100).pct, 50);
});
test("reaction is lower-is-better", () => {
  assert.ok(compareToNorm("reaction", 200).pct > 50);
  assert.ok(compareToNorm("reaction", 400).pct < 50);
});
test("stroop interference is lower-is-better", () => {
  assert.ok(compareToNorm("stroop", 20).pct > compareToNorm("stroop", 250).pct);
});
test("digit span is higher-is-better", () => {
  assert.ok(compareToNorm("digitspan", 9).pct > 50);
  assert.ok(compareToNorm("digitspan", 4).pct < 50);
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
test("bundle carries typical + your value + source", () => {
  const n = compareToNorm("digitspan", 7);
  assert.equal(n.typical, "6.6 digits");
  assert.equal(n.yourValue, "7 digits");
  assert.ok(n.source.length > 0);
  assert.equal(typeof n.established, "boolean");
});
test("every test in the registry has full info + a norm", () => {
  for (const id of ["reaction", "nback", "digitspan", "stroop", "mentalmath", "sequences"]) {
    const info = TESTINFO[id];
    assert.ok(info && info.measures && info.why && info.realWorld, `${id} missing prose`);
    assert.ok(info.norm && typeof info.norm.mean === "number" && info.norm.sd > 0, `${id} bad norm`);
    assert.ok(normReference(id).typical, `${id} no reference`);
  }
});

console.log("norms — formatting helpers");
test("ordinal()", () => {
  assert.equal(ordinal(1), "1st"); assert.equal(ordinal(2), "2nd"); assert.equal(ordinal(3), "3rd");
  assert.equal(ordinal(11), "11th"); assert.equal(ordinal(21), "21st"); assert.equal(ordinal(78), "78th");
});
test("fmtNorm()", () => {
  assert.equal(fmtNorm(270.4, "ms"), "270 ms");
  assert.equal(fmtNorm(85, "%"), "85%");
  assert.equal(fmtNorm(6.6, "digits"), "6.6 digits");
  assert.equal(fmtNorm(5, "of 8"), "5 / 8");
});
test("bandFor() bands", () => {
  assert.equal(bandFor(95).label, "Exceptional");
  assert.equal(bandFor(50).label, "About average");
  assert.equal(bandFor(10).label, "Well below average");
  assert.equal(bandFor(95).cls, "up");
  assert.equal(bandFor(10).cls, "down");
});

console.log("stats — resume planning");
const now = 1_000_000_000_000;
const ids = ["reaction", "nback", "digitspan", "stroop", "mentalmath", "sequences"];
const tests = ids.map((id) => ({ id }));
const sessions = [
  { id: "a", ts: now - 5 * 60_000, kind: "single", scores: { reaction: 80 }, raw: { reaction: 230 }, labels: { reaction: "230 ms" } },
  { id: "b", ts: now - 10 * 60_000, kind: "single", scores: { nback: 70 }, raw: { nback: 82 } },
  { id: "c", ts: now - 2 * 60 * 60_000, kind: "single", scores: { digitspan: 60 }, raw: { digitspan: 7 } }, // outside window
  { id: "d", ts: now - 3 * 60_000, kind: "full", scores: { reaction: 50, nback: 50, digitspan: 50, stroop: 50, mentalmath: 50, sequences: 50 }, raw: {} }, // full → ignored
  { id: "e", ts: now - 1 * 60_000, kind: "single", scores: { reaction: 90 }, raw: { reaction: 210 } }, // newer reaction
];

test("recentSingleResults: only recent singles, newest wins", () => {
  const r = recentSingleResults(sessions, ids, now, RESUME_WINDOW_MS);
  assert.equal(r.reaction.sessionId, "e");     // newer of a/e
  assert.equal(r.reaction.score, 90);
  assert.equal(r.nback.score, 70);
  assert.equal(r.digitspan, undefined);        // outside the 1h window
});
test("recentSingleResults: ignores full sessions", () => {
  const r = recentSingleResults(sessions, ids, now, RESUME_WINDOW_MS);
  // stroop/mentalmath/sequences only appear in the full session → must be absent
  assert.equal(r.stroop, undefined);
  assert.equal(r.mentalmath, undefined);
});
test("planFullAssessment: reusable + remaining", () => {
  const plan = planFullAssessment(sessions, tests, now, RESUME_WINDOW_MS);
  assert.equal(plan.reusableCount, 2);
  assert.deepEqual(plan.remainingIds, ["digitspan", "stroop", "mentalmath", "sequences"]);
  assert.deepEqual(plan.reusable.map((x) => x.id), ["reaction", "nback"]);
});
test("planFullAssessment: nothing recent → run everything", () => {
  const plan = planFullAssessment([], tests, now, RESUME_WINDOW_MS);
  assert.equal(plan.reusableCount, 0);
  assert.equal(plan.remainingIds.length, 6);
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
