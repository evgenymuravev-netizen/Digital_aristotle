/* Structural validation of the MMAT question bank.
   Run with:  node mmat/validate.mjs
   Checks every form/question for a well-formed, single, in-range answer
   key and flags duplicate or empty options. Pure Node, no dependencies. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "questions.js"), "utf8");

// Execute the bank with a stand-in `window`.
const sandbox = { window: {} };
new Function("window", src)(sandbox.window);
const MMAT = sandbox.window.MMAT;

const CATS = Object.keys(MMAT.categories);
let errors = 0;
const err = (m) => { errors++; console.error("  ✗ " + m); };

if (!Array.isArray(MMAT.tests) || MMAT.tests.length !== 10)
  err(`expected 10 tests, found ${MMAT.tests && MMAT.tests.length}`);

const ids = new Set();
const totals = {};

MMAT.tests.forEach((t, ti) => {
  const where = `Test ${ti + 1} (${t.id})`;
  if (!t.id || ids.has(t.id)) err(`${where}: missing or duplicate id`);
  ids.add(t.id);
  if (!t.name) err(`${where}: missing name`);
  if (!Array.isArray(t.questions) || !t.questions.length) { err(`${where}: no questions`); return; }

  const perCat = {};
  t.questions.forEach((q, qi) => {
    const w = `${where} Q${qi + 1}`;
    if (!CATS.includes(q.cat)) err(`${w}: bad category "${q.cat}"`);
    if (!q.topic) err(`${w}: missing topic`);
    if (!q.prompt || !q.prompt.trim()) err(`${w}: empty prompt`);
    if (!Array.isArray(q.options) || q.options.length < 3 || q.options.length > 5)
      err(`${w}: options must number 3–5 (found ${q.options && q.options.length})`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length)
      err(`${w}: answer index ${q.answer} out of range`);
    const seen = new Set();
    (q.options || []).forEach((o) => {
      if (o == null || !String(o).trim()) err(`${w}: blank option`);
      const k = String(o).toLowerCase().trim();
      if (seen.has(k)) err(`${w}: duplicate option "${o}"`);
      seen.add(k);
    });
    if (!q.explain || !q.explain.trim()) err(`${w}: missing explanation`);
    perCat[q.cat] = (perCat[q.cat] || 0) + 1;
    totals[q.cat] = (totals[q.cat] || 0) + 1;
  });

  const mix = CATS.map((c) => `${c}:${perCat[c] || 0}`).join("  ");
  console.log(`  ✓ ${where.padEnd(22)} ${t.questions.length} Qs   ${mix}`);
});

const grand = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(`\n  Totals: ${grand} questions   ${CATS.map((c) => `${c}:${totals[c] || 0}`).join("  ")}`);

if (errors) { console.error(`\n✗ ${errors} problem(s) found.`); process.exit(1); }
console.log("\n✓ All forms valid.");
