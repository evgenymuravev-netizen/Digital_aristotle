/* Independent re-computation of EVERY numerical answer key.
   Run with:  node mmat/check-answers.mjs

   In each full form the 9 numerical questions occupy indices 10–18, and in
   the free taster they occupy [1,4,7,10]. We recompute each expected option
   text from scratch (pure JS for plain numbers; literals for unit/format
   answers) and assert it equals options[answer]. This catches a mis-placed
   answer index, an option typo, or an arithmetic slip. The harness also
   asserts that indices 10–18 really are the numerical ones (structure drift). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sandbox = { window: {} };
new Function("window", readFileSync(join(here, "questions.js"), "utf8"))(sandbox.window);
const MMAT = sandbox.window.MMAT;

let bad = 0, checked = 0;
const fail = (m) => { bad++; console.error("  ✗ " + m); };

function check(form, idx, want, where) {
  const q = form.questions[idx];
  if (!q) return fail(`${where} index ${idx}: no such question`);
  if (q.cat !== "numerical") return fail(`${where} index ${idx}: expected a numerical question, got ${q.cat}/${q.topic}`);
  checked++;
  const got = q.options[q.answer];
  if (String(got) !== String(want)) fail(`${where} Q${idx + 1}: marked "${got}" but recomputed "${want}"`);
}

// ---- free taster: numerical at [1,4,7,10] ----
const free = MMAT.freeTest;
[[1, `${20 + 10}`], [4, `${0.12 * 150}`], [7, "$62.50"], [10, `${(60 / 5) * 3}`]]
  .forEach(([i, w]) => check(free, i, w, "Free"));

// ---- full forms: numerical at indices 10–18 ----
// expected[formIndex] = [v10, v11, v12, v13, v14, v15, v16, v17, v18]
const expected = [
  /* Test 1  */ [`${31 * 2 + 1}`, `${30 + 12}`, `${44 * 3 - 7}`, `${17 * 6 - 19}`, `${14 + 11}`, "60 km/h", `${5 * 20 - 72}`, "$80", "$48"],
  /* Test 2  */ [`${21 + 10}`, `${17 * 2 - 1}`, `${24 * 2 / 3}`, `${13 ** 2 - 12 ** 2}`, `${144 / 12 + 7 * 8}`, "12 days", "$16,200", "12.5%", "300 g"],
  /* Test 3  */ [`${7 ** 2}`, `${41 * 2 - 1}`, `${37 + 32}`, `${15 * 14}`, `${2 ** 3 + 3 ** 3 + 4 ** 3}`, "25%", "12 hours", `${75 / 1.25}`, `${9 * 7}`],
  /* Test 4  */ [`${18 + 29}`, `${2 * 36}`, "29", `${25 * 16}`, `${9 * 7 - 48 / 6}`, "5 hours", "$144", `${0.75 * 150}`, "6 L"],
  /* Test 5  */ [`${80 * 2}`, `${40 * 3 + 1}`, `${47 * 2 + 1}`, `${144 / 9}`, `${17 * 99}`, "5 minutes", "16.67%", "$60", "$4"],
  /* Test 6  */ [`${22 + 7}`, `${192 * 4}`, `${27 + 14}`, `${37 + 48 + 55}`, `${12 * 11 - 11}`, "$882", "2.5 hours", "8,820", "$300"],
  /* Test 7  */ [`${84 - 9}`, `${32 * 2}`, `${6 ** 3}`, `${(15 + 9) * (12 - 4)}`, `${9 * 8}`, "3/5", "$68", `${0.6 * 0.8 * 200}`, "20 minutes"],
  /* Test 8  */ [`${32 * 2}`, `${7 ** 2}`, `${51 * 2 - 3}`, `${144 + 256}`, `${18 * 25}`, "7.5°", `${96 / 8}`, "$60", `${40 / 8 * 5}`],
  /* Test 9  */ [`${35 * 2 - 3}`, `${72 * 2}`, `${4 + 7 + 13}`, `${23 ** 2}`, `${1000 - 7 * 8}`, "12", `${60 / 0.75}`, "$360", "8:15"],
  /* Test 10 */ [`${36 * 7}`, `${21 + 7}`, `${33 * 2 - 1}`, `${7 * 8 * 9}`, `${Math.round((1 / 2 + 1 / 3 + 1 / 6) * 12)}`, "$1,000", "10 L", "44%", "$10,000"],
];

MMAT.tests.forEach((form, fi) => {
  const want = expected[fi];
  if (!want) return fail(`Test ${fi + 1}: no expected values`);
  for (let k = 0; k < 9; k++) check(form, 10 + k, want[k], `Test ${fi + 1}`);
});

console.log(`\nRecomputed ${checked} numerical answer keys.`);
if (bad) { console.error(`✗ ${bad} mismatch(es).`); process.exit(1); }
console.log("✓ Every numerical answer matches its independently-computed value.");
