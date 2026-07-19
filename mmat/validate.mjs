/* Structural validation of the MMAT question bank.
   Run with:  node mmat/validate.mjs
   Verifies the free taster + all 10 forms: well-formed schema, a single
   in-range answer key, valid category/difficulty, no duplicate/blank
   options. Pure Node, no dependencies. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sandbox = { window: {} };
new Function("window", readFileSync(join(here, "questions.js"), "utf8"))(sandbox.window);
new Function("window", readFileSync(join(here, "deep.js"), "utf8"))(sandbox.window);
const MMAT = sandbox.window.MMAT;
const DEEP = sandbox.window.MMAT_DEEP || {};

const CATS = Object.keys(MMAT.categories);
let errors = 0;
const err = (m) => { errors++; console.error("  ✗ " + m); };

function checkForm(t, where) {
  if (!t.id) err(`${where}: missing id`);
  if (!t.name) err(`${where}: missing name`);
  if (!Array.isArray(t.questions) || !t.questions.length) { err(`${where}: no questions`); return {}; }
  const perCat = {}, perTopic = {};
  t.questions.forEach((q, qi) => {
    const w = `${where} Q${qi + 1}`;
    if (!CATS.includes(q.cat)) err(`${w}: bad category "${q.cat}"`);
    if (!q.topic) err(`${w}: missing topic`);
    if (![1, 2, 3].includes(q.diff)) err(`${w}: diff must be 1–3 (found ${q.diff})`);
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
    perTopic[q.topic] = (perTopic[q.topic] || 0) + 1;
  });
  return perCat;
}

// free taster
const free = MMAT.freeTest;
if (!free) err("missing freeTest");
else {
  const pc = checkForm(free, "Free taster");
  console.log(`  ✓ ${"Free taster".padEnd(22)} ${free.questions.length} Qs   ${CATS.map((c) => `${c}:${pc[c] || 0}`).join("  ")}`);
}

// full forms
if (!Array.isArray(MMAT.tests) || MMAT.tests.length !== 10)
  err(`expected 10 tests, found ${MMAT.tests && MMAT.tests.length}`);

const ids = new Set();
const totals = {};
MMAT.tests.forEach((t, ti) => {
  const where = `Test ${ti + 1} (${t.id})`;
  if (ids.has(t.id)) err(`${where}: duplicate id`);
  ids.add(t.id);
  const pc = checkForm(t, where);
  CATS.forEach((c) => (totals[c] = (totals[c] || 0) + (pc[c] || 0)));
  console.log(`  ✓ ${where.padEnd(22)} ${t.questions.length} Qs   ${CATS.map((c) => `${c}:${pc[c] || 0}`).join("  ")}`);
});

const grand = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(`\n  Forms total: ${grand} questions   ${CATS.map((c) => `${c}:${totals[c] || 0}`).join("  ")}`);

// validate deep-explanation entries map to real questions/options
const byPrompt = {};
[MMAT.freeTest].concat(MMAT.tests).forEach((f) => f.questions.forEach((q) => { byPrompt[q.prompt] = q; }));
Object.keys(DEEP).forEach((k) => {
  const q = byPrompt[k];
  if (!q) return err(`deep.js: no question matches prompt "${k.slice(0, 40)}…"`);
  const d = DEEP[k];
  if (!d.principle || !d.principle.trim()) err(`deep.js: "${k.slice(0, 30)}…" missing principle`);
  Object.keys(d.traps || {}).forEach((opt) => {
    if (!q.options.includes(opt)) err(`deep.js: "${k.slice(0, 30)}…" trap option "${opt}" is not one of that question's options`);
    if (q.options[q.answer] === opt) err(`deep.js: "${k.slice(0, 30)}…" trap is keyed on the CORRECT option "${opt}"`);
  });
});
console.log(`  ✓ deep explanations: ${Object.keys(DEEP).length} entries, all mapped to real questions/options`);

if (errors) { console.error(`\n✗ ${errors} problem(s) found.`); process.exit(1); }
console.log("\n✓ All forms valid.");
