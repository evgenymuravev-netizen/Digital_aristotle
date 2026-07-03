/* End-to-end engine test with a minimal DOM/localStorage shim.
   Run with:  node mmat/test-engine.mjs

   Loads the REAL config.js + questions.js + app.js and drives full
   attempts through a fake DOM. Verifies: free-taster grading, the
   "no two adjacent questions share a topic" interleaving guarantee,
   the paywall unlock flow, a locked form after unlock, and the
   adaptive weak-area round. No dependencies. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/* ---------------- minimal DOM ---------------- */
class FakeEl {
  constructor(tag) { this.tagName = (tag || "div").toUpperCase(); this.children = []; this._a = {}; this._ev = {};
    this._cls = new Set(); this._text = ""; this._html = ""; this._value = ""; this.style = {};
    this.classList = {
      add: (c) => this._cls.add(c), remove: (c) => this._cls.delete(c), contains: (c) => this._cls.has(c),
      toggle: (c, f) => { const on = f === undefined ? !this._cls.has(c) : f; on ? this._cls.add(c) : this._cls.delete(c); return on; },
    };
  }
  get className() { return [...this._cls].join(" "); }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text || this.children.map((c) => c.textContent || "").join(""); }
  set innerHTML(v) { this._text = ""; this.children = []; this._html = String(v); }
  get innerHTML() { return this._html || ""; }
  get value() { return this._value; }
  set value(v) { this._value = String(v); }
  setAttribute(k, v) { this._a[k] = String(v); if (k === "value") this._value = String(v); }
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
    const out = this._all(pred, []); out.forEach = Array.prototype.forEach.bind(out); return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

const byId = {};
const document = {
  getElementById: (id) => byId[id] || (byId[id] = new FakeEl("div")),
  createElement: (t) => new FakeEl(t),
  createTextNode: (t) => Object.assign(new FakeEl("text"), { _text: String(t) }),
  addEventListener() {},
};
const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k),
};
const win = { scrollTo() {}, confirm: () => true, addEventListener() {}, localStorage };
const syncTimeout = (fn) => { fn(); return 0; };
const noopInterval = () => 1;

/* ---------------- load real source ---------------- */
new Function("window", readFileSync(join(here, "config.js"), "utf8"))(win);
new Function("window", readFileSync(join(here, "questions.js"), "utf8"))(win);
const FORMS = [win.MMAT.freeTest, ...win.MMAT.tests];

// key by prompt + options (odd-one-out prompts intentionally repeat, so prompt
// alone isn't unique — the options always are).
const qKey = (prompt, options) => prompt + "||" + options.join("");
const promptMap = {};
FORMS.forEach((f) => f.questions.forEach((q) => { promptMap[qKey(q.prompt, q.options)] = { answer: q.answer, n: q.options.length }; }));

new Function("window", "document", "localStorage", "setInterval", "clearInterval", "setTimeout",
  readFileSync(join(here, "app.js"), "utf8")
)(win, document, localStorage, noopInterval, () => {}, syncTimeout); // boot() runs → home

/* ---------------- drivers ---------------- */
const btnByText = (root, txt) => root.querySelectorAll("button").find((b) => (b.textContent || "").includes(txt));

// Drive the currently-active exam to results. `mode`: "correct" | "wrong".
// Returns { pct, sub, topics:[chip text per position in shown order] }.
function driveExam(mode) {
  const topics = [];
  let guard = 0;
  while ($("screen-exam").classList.contains("active") && guard++ < 200) {
    const qEl = byId["exam-question"];
    const prompt = qEl.querySelector(".q-prompt").innerHTML;
    const shownOptions = qEl.querySelectorAll(".option").map((b) => b.children[1].textContent);
    const info = promptMap[qKey(prompt, shownOptions)];
    if (!info) throw new Error("Shown question not found in bank: " + prompt.slice(0, 40));
    topics.push(qEl.querySelector(".q-topic").textContent);
    const choose = mode === "wrong" ? (info.answer + 1) % info.n : info.answer;
    qEl.querySelectorAll(".option")[choose].fire("click");
    const next = btnByText(qEl, "Next") || btnByText(qEl, "Review & submit");
    next.fire("click"); // advances, or submits on the last item (confirm → finish)
  }
  const pctEl = byId["results-body"].querySelector(".dial-pct");
  const subEl = byId["results-body"].querySelector(".dial-sub");
  return { pct: parseInt((pctEl && pctEl.textContent) || "x", 10), sub: subEl && subEl.textContent, topics };
}
function $(id) { return document.getElementById(id); }
function goHome() { byId["brand"].fire("click"); }

/* ---------------- assertions ---------------- */
let fail = 0;
const expect = (name, got, want) => {
  const ok = got === want;
  console.log(`  ${ok ? "✓" : "✗"} ${name}: ${JSON.stringify(got)}${ok ? "" : " (expected " + JSON.stringify(want) + ")"}`);
  if (!ok) fail++;
};
const assert = (name, cond, detail) => { console.log(`  ${cond ? "✓" : "✗"} ${name}${cond ? "" : " — " + detail}`); if (!cond) fail++; };
const noAdjacentDup = (arr) => { for (let i = 1; i < arr.length; i++) if (arr[i] === arr[i - 1]) return i; return -1; };

console.log("Free taster:");
store.clear(); goHome();
byId["start-free"].fire("click");                  // free test starts (no lock)
const free = driveExam("correct");
expect("all-correct %", free.pct, 100);
expect("tally", free.sub, "12 / 12 correct");
assert("no two adjacent questions share a topic", noAdjacentDup(free.topics) === -1,
  "duplicate at position " + noAdjacentDup(free.topics) + " in " + JSON.stringify(free.topics));

console.log("\nPaywall + locked form:");
store.clear(); goHome();
const unlockBtn = btnByText(byId["test-grid"], "Unlock");
assert("locked forms show an Unlock button before purchase", !!unlockBtn, "no Unlock button found");
unlockBtn.fire("click");                            // → paywall
assert("paywall screen shown", $("screen-paywall").classList.contains("active"), "paywall not active");
const codeInput = byId["paywall-body"].querySelector(".code-input");
codeInput.value = "DEMO-KEY-123";
btnByText(byId["paywall-body"], "Unlock").fire("click");   // demo unlock → starts the form
assert("unlocking a form launches its exam", $("screen-exam").classList.contains("active"), "exam not active after unlock");
const locked = driveExam("correct");
expect("unlocked form all-correct %", locked.pct, 100);
expect("unlocked form size", locked.sub, "25 / 25 correct");
assert("interleaved: no adjacent topic in a 25-Q form", noAdjacentDup(locked.topics) === -1,
  "duplicate at position " + noAdjacentDup(locked.topics));
goHome();
assert("form no longer shows Unlock once purchased", !btnByText(byId["test-grid"], "Unlock"), "still locked");

console.log("\nAdaptive weak-area round:");
// already did one full form all-correct above; add a taster with wrong answers to create weak topics
byId["start-free"].fire("click");
driveExam("wrong");
goHome();
const dashBtn = btnByText(byId["dashboard"], "Practice");
assert("weak-area button is enabled after enough data", dashBtn && !dashBtn.getAttribute("disabled"),
  "button: " + (dashBtn && dashBtn.textContent));
dashBtn.fire("click");                              // start adaptive round
assert("adaptive round launches an exam", $("screen-exam").classList.contains("active"), "exam not active");
const weak = driveExam("correct");
assert("adaptive round grades to 100% when all correct", weak.pct === 100, "got " + weak.pct);
assert("adaptive round interleaves topics too", noAdjacentDup(weak.topics) === -1, "dup at " + noAdjacentDup(weak.topics));

if (fail) { console.error(`\n✗ ${fail} engine assertion(s) failed.`); process.exit(1); }
console.log("\n✓ Engine: grading, interleaving, paywall unlock and adaptive round all verified end-to-end.");
