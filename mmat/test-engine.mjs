/* End-to-end engine test with a minimal DOM/localStorage shim.
   Run with:  node mmat/test-engine.mjs

   Loads the REAL questions.js + app.js, then drives a full attempt
   (boot → start a form → answer every item → submit) and reads the
   score straight out of the results DOM. Verifies grading for an
   all-correct, all-wrong and mixed run. No dependencies. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/* ---------------- minimal DOM ---------------- */
class FakeEl {
  constructor(tag) { this.tagName = (tag || "div").toUpperCase(); this.children = []; this._a = {}; this._ev = {};
    this._cls = new Set(); this._text = ""; this.style = {};
    this.classList = {
      add: (c) => this._cls.add(c), remove: (c) => this._cls.delete(c),
      contains: (c) => this._cls.has(c),
      toggle: (c, f) => { const on = f === undefined ? !this._cls.has(c) : f; on ? this._cls.add(c) : this._cls.delete(c); return on; },
    };
  }
  get className() { return [...this._cls].join(" "); }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text || this.children.map((c) => c.textContent || "").join(""); }
  set innerHTML(v) { this._text = ""; this.children = []; this._html = String(v); }
  get innerHTML() { return this._html || ""; }
  setAttribute(k, v) { this._a[k] = String(v); }
  getAttribute(k) { return this._a[k] != null ? this._a[k] : null; }
  removeAttribute(k) { delete this._a[k]; }
  appendChild(n) { this.children.push(n); return n; }
  append(...ns) { ns.forEach((n) => this.children.push(typeof n === "string" ? Object.assign(new FakeEl("text"), { _text: n }) : n)); }
  addEventListener(t, fn) { (this._ev[t] = this._ev[t] || []).push(fn); }
  removeEventListener(t, fn) { if (this._ev[t]) this._ev[t] = this._ev[t].filter((f) => f !== fn); }
  fire(t, evt) { (this._ev[t] || []).slice().forEach((fn) => fn.call(this, evt || { preventDefault() {}, returnValue: "" })); }
  _all(pred, out) { this.children.forEach((c) => { if (c instanceof FakeEl) { if (pred(c)) out.push(c); c._all(pred, out); } }); return out; }
  querySelectorAll(sel) {
    const pred = sel[0] === "." ? (e) => e._cls.has(sel.slice(1)) : (e) => e.tagName === sel.toUpperCase();
    const out = this._all(pred, []);
    out.forEach = Array.prototype.forEach.bind(out);
    return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

const byId = {};
[ "test-grid", "screen-home", "screen-intro", "screen-exam", "screen-results",
  "intro-body", "results-body", "brand", "exam-title", "exam-subtitle", "exam-answered",
  "exam-timer", "exam-timer-sr", "exam-question", "exam-palette", "exam-submit", "exam-quit",
].forEach((id) => { byId[id] = new FakeEl("div"); });

const document = {
  getElementById: (id) => byId[id] || (byId[id] = new FakeEl("div")),
  createElement: (t) => new FakeEl(t),
  createTextNode: (t) => Object.assign(new FakeEl("text"), { _text: String(t) }),
  addEventListener() {}, _ev: {},
};
const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k),
};
let confirmReturn = true;
const win = {
  MMAT: null, scrollTo() {}, confirm: () => confirmReturn,
  addEventListener() {}, localStorage,
  setInterval: () => 1, clearInterval() {},
};

/* ---------------- load the real source ---------------- */
const ctx = { window: win, document, localStorage, setInterval: win.setInterval, clearInterval: win.clearInterval };
new Function("window", readFileSync(join(here, "questions.js"), "utf8"))(win);
const TESTS = win.MMAT.tests;
new Function("window", "document", "localStorage", "setInterval", "clearInterval",
  readFileSync(join(here, "app.js"), "utf8")
)(win, document, localStorage, ctx.setInterval, ctx.clearInterval); // boot() runs here → home

/* ---------------- helpers to drive the UI ---------------- */
const btnByText = (root, txt) => root.querySelectorAll("button").find((b) => (b.textContent || "").includes(txt));
function findStartCardButton() { return byId["test-grid"].querySelectorAll("button")[0]; } // first form's Start

function runForm(testIndex, decide) {
  store.clear();
  // re-render home so the freshly-cleared state shows, then open the first form
  byId["brand"].fire("click");                 // back to home (renderHome)
  findStartCardButton().fire("click");         // → intro for Test 1
  btnByText(byId["intro-body"], "Start").fire("click"); // → exam, starts clock

  const total = TESTS[testIndex].questions.length;
  for (let i = 0; i < total; i++) {
    const opts = byId["exam-question"].querySelectorAll(".option");
    const choose = decide(i, TESTS[testIndex].questions[i]);
    if (choose != null) opts[choose].fire("click");
    const nav = byId["exam-question"];
    const next = btnByText(nav, "Next") || btnByText(nav, "Review & submit");
    next.fire("click"); // advances, or on last item submits (confirm → finish)
  }
  // read score out of the results DOM
  const pctEl = byId["results-body"].querySelector(".dial-pct");
  const subEl = byId["results-body"].querySelector(".dial-sub");
  return { pct: parseInt((pctEl && pctEl.textContent) || "x", 10), sub: subEl && subEl.textContent };
}

/* ---------------- scenarios ---------------- */
let fail = 0;
const expect = (name, got, want) => {
  const ok = got === want;
  console.log(`  ${ok ? "✓" : "✗"} ${name}: got ${JSON.stringify(got)}${ok ? "" : ", expected " + JSON.stringify(want)}`);
  if (!ok) fail++;
};

const T = 0, N = TESTS[T].questions.length;

const allCorrect = runForm(T, (i, q) => q.answer);
expect("all-correct %", allCorrect.pct, 100);
expect("all-correct tally", allCorrect.sub, `${N} / ${N} correct`);

const allWrong = runForm(T, (i, q) => (q.answer + 1) % q.options.length);
expect("all-wrong %", allWrong.pct, 0);
expect("all-wrong tally", allWrong.sub, `0 / ${N} correct`);

// answer the first 10 correctly, the rest wrong → 10/25 = 40%
const mixed = runForm(T, (i, q) => (i < 10 ? q.answer : (q.answer + 1) % q.options.length));
expect("mixed %", mixed.pct, Math.round((10 / N) * 100));
expect("mixed tally", mixed.sub, `10 / ${N} correct`);

// leaving blanks: answer none → 0%, and best score should persist all-correct=100
const blanks = runForm(T, () => null);
expect("all-blank %", blanks.pct, 0);

if (fail) { console.error(`\n✗ ${fail} engine assertion(s) failed.`); process.exit(1); }
console.log("\n✓ Engine grades, submits and reports correctly end-to-end.");
