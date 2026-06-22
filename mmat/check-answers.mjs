/* Independent re-computation of every numerical answer key.
   Run with:  node mmat/check-answers.mjs

   For each numerical question we recompute the expected option text from
   scratch (pure JS for arithmetic / series; literals for formatted answers)
   and assert it equals options[answer]. Catches a mis-placed answer index
   or a typo in the "correct" option. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sandbox = { window: {} };
new Function("window", readFileSync(join(here, "questions.js"), "utf8"))(sandbox.window);
const T = sandbox.window.MMAT.tests;

/* expected[formIndex][questionIndex] = expected option STRING.
   Numbers are computed independently; formatted answers given literally. */
const expected = {
  0: { 10: `${12 + 3}`, 11: `${16 * 2}`, 12: `${5 ** 2}`, 13: `${40 * 2}`,
       14: "$3", 15: `${60 * 2.5}`, 16: `${0.15 * 200}`, 17: "$30", 18: `${17 + 28 + 35}` },
  1: { 10: `${28 + 7}`, 11: `${70 - 10}`, 12: `${11 + 5}`, 13: `${24 * 2}`,
       14: `${12 * 8}`, 15: `${250 / 2}`, 16: `${4 * 5}`, 17: "$0.40", 18: `${81 - 16}` },
  2: { 10: `${11 + 3}`, 11: `${3 / 3}`, 12: `${5 + 8}`, 13: `${6 ** 2}`,
       14: `${144 / 12}`, 15: `${0.25 * 80}`, 16: `${6 * 4}`, 17: `${1 + 2 + 3 + 4 + 5}`, 18: `${8 * 6}` },
  3: { 10: `${24 + 6}`, 11: `${27 * 3}`, 12: `${35 - 5}`, 13: `${12 + 5}`,
       14: `${7 * 6}`, 15: `${0.30 * 150}`, 16: "5/8", 17: "25%", 18: `${1000 - 365}` },
  4: { 10: `${44 + 11}`, 11: `${8 / 2}`, 12: `${22 * 2 + 2}`, 13: `${17 + 16}`,
       14: `${13 + 19}`, 15: `${0.20 * 250}`, 16: "$105", 17: `${(10 + 20 + 30) / 3}`, 18: "$13.50" },
  5: { 10: `${23 + 6}`, 11: `${54 * 3}`, 12: `${60 - 20}`, 13: `${5 ** 3}`,
       14: `${18 * 5}`, 15: `${(60 / 4) * 3}`, 16: `${2000 / 250}`, 17: "$3.00", 18: `${49 + 24}` },
  6: { 10: `${16 + 4}`, 11: `${81 * 3}`, 12: `${60 - 10}`, 13: `${16 + 6}`,
       14: `${16 * 4}`, 15: `${0.40 * 90}`, 16: `${60 / 3}`, 17: "2 hours", 18: `${250 + 175}` },
  7: { 10: `${40 + 10}`, 11: `${16 * 2}`, 12: `${22 + 5}`, 13: `${15 + 6}`,
       14: `${11 * 11}`, 15: `${0.60 * 200}`, 16: "$17.50", 17: "300 g", 18: `${144 - 44}` },
  8: { 10: `${36 + 9}`, 11: `${32 / 2}`, 12: "13", 13: `${120 * 5}`,
       14: `${144 - 89}`, 15: `${80 / 8}`, 16: `${240 / 20}`, 17: "$6.50", 18: `${(15 * 4) / 6}` },
  9: { 10: `${52 + 13}`, 11: `${1000 * 10}`, 12: `${26 + 11}`, 13: `${120 * 6}`,
       14: `${19 * 21}`, 15: `${0.35 * 160}`, 16: "4", 17: "25%", 18: `${(144 / 12) * 5}` },
};

let bad = 0, checked = 0;
Object.keys(expected).forEach((f) => {
  Object.keys(expected[f]).forEach((q) => {
    const item = T[f].questions[q];
    const got = item.options[item.answer];
    const want = expected[f][q];
    checked++;
    if (String(got) !== String(want)) {
      bad++;
      console.error(`  ✗ Test ${+f + 1} Q${+q + 1}: marked "${got}" but recomputed "${want}"`);
    }
  });
});

console.log(`\nChecked ${checked} numerical answer keys.`);
if (bad) { console.error(`✗ ${bad} mismatch(es).`); process.exit(1); }
console.log("✓ Every recomputed numerical answer matches its marked option.");
