/* Смоук-тест раннера (app.js) под минимальным DOM-шимом.
   Проверяет, что boot() рисует старт, а проход по всем 24 вопросам
   (через «Пропустить») не падает и доходит до экрана «Спасибо».
   Гоняет buildInput() для всех типов вопросов. Node, без зависимостей. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

/* ---------- tiny DOM shim ---------- */
const byId = {};
function mkNode(tag) {
  const n = {
    tagName: (tag || "").toUpperCase(), children: [], _h: {}, style: {}, _cls: [],
    value: "", checked: false, _text: "", _html: "",
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); },
    remove() {},
    setAttribute(k, v) { if (k === "id") byId[v] = this; this["_attr_" + k] = v; if (k === "value") this.value = v; },
    getAttribute(k) { return this["_attr_" + k]; },
    addEventListener(t, fn) { (this._h[t] = this._h[t] || []).push(fn); },
    _fire(t) { (this._h[t] || []).forEach((fn) => fn.call(this, { target: this, preventDefault() {} })); },
    get classList() {
      const self = this;
      return { add: (c) => { if (self._cls.indexOf(c) < 0) self._cls.push(c); },
        remove: (c) => { const i = self._cls.indexOf(c); if (i >= 0) self._cls.splice(i, 1); },
        contains: (c) => self._cls.indexOf(c) >= 0 };
    },
    set className(v) { this._cls = String(v || "").split(/\s+/).filter(Boolean); },
    get className() { return this._cls.join(" "); },
    set textContent(v) { this._text = v; },
    get textContent() { return this._text; },
    set innerHTML(v) { this._html = v; if (v === "") this.children = []; },
    get innerHTML() { return this._html; },
    _walk(out) { this.children.forEach((c) => { if (c.children) { out.push(c); c._walk(out); } }); return out; },
    _match(sel) { if (sel[0] === ".") return this._cls.indexOf(sel.slice(1)) >= 0; if (sel[0] === "#") return byId[sel.slice(1)] === this; return this.tagName === sel.toUpperCase(); },
    querySelectorAll(sel) { return this._walk([]).filter((n) => n._match(sel)); },
    querySelector(sel) { const a = this.querySelectorAll(sel); return a.length ? a[0] : null; },
  };
  if (tag) { /* id registered on setAttribute or via el() attrs */ }
  return n;
}
const rootApp = mkNode("div"); byId["app"] = rootApp;
const documentShim = {
  createElement: (t) => mkNode(t),
  createTextNode: (t) => ({ _textnode: true, textContent: t, children: null }),
  getElementById: (id) => byId[id] || null,
  body: mkNode("body"),
  documentElement: mkNode("html"),
};
// el() sets id through attrs object: n.setAttribute? No — el() does n[k]=... Actually el() uses setAttribute path? Check: el sets id via a[k] with setAttribute for generic attrs. "id" falls to else branch -> setAttribute("id",v). Good, registers in byId.
globalThis.document = documentShim;
globalThis.window = { CONTOURS_CONFIG: null, SURVEY: null };
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] == null ? null : this._d[k]; }, setItem(k, v) { this._d[k] = String(v); } };
globalThis.setInterval = () => 1;      // don't actually schedule; Next-clicks drive advance
globalThis.clearInterval = () => {};
globalThis.Date = Date;

const load = (f) => (0, eval)(fs.readFileSync(path.join(dir, f), "utf8"));
load("config.js"); load("survey.js");
window.CONTOURS_CONFIG = window.CONTOURS_CONFIG; // set by config.js
// app.js reads window.SURVEY / window.CONTOURS_CONFIG at IIFE start:
load("app.js");

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("  ✗ FAIL: " + name); } };

/* start screen rendered */
ok("start screen rendered (has #app children)", rootApp.children.length > 0);
ok("group-key input present", !!byId["gk"]);
ok("begin button reachable", !!byId["gk"] && !!byId["lead"]);

/* fill group key + begin */
byId["gk"].value = "smoke-team";
// find the Begin button: it's a BUTTON whose onclick starts the survey. Fire all buttons' click that carry begin text is hard;
// instead locate via the cta-row button in current tree.
function allButtons() { return rootApp._walk([]).filter((n) => n.tagName === "BUTTON"); }
const beginBtn = allButtons().find((b) => b.textContent === window.SURVEY.ui.begin.ru);
ok("found Begin button", !!beginBtn);
beginBtn._fire("click");
ok("first item rendered (#answer present)", !!byId["answer"]);

/* walk all 24 items via Skip */
const N = window.SURVEY.blocks.reduce((a, b) => a + b.items.length, 0);
ok("survey flattens to 28 screens (24 questions; A9 a/b/c, A11/B11 a/b)", N === 28);
let steps = 0, threw = null;
try {
  for (let i = 0; i < N + 2; i++) {
    const skip = allButtons().find((b) => b.textContent === window.SURVEY.ui.skip.ru);
    const doneMark = allButtons().find((b) => b.textContent === window.SURVEY.ui.download.ru);
    if (doneMark) break;               // reached finish screen
    if (!skip) break;
    skip._fire("click"); steps++;
  }
} catch (e) { threw = e; }
ok("walked without throwing", threw === null);
if (threw) console.log("    threw: " + threw.message + "\n" + (threw.stack || "").split("\n").slice(0, 4).join("\n"));
ok("advanced through all 28 items", steps >= 28);
const dl = allButtons().find((b) => b.textContent === window.SURVEY.ui.download.ru);
ok("reached done screen (download button present)", !!dl);
const facil = rootApp._walk([]).find((n) => n.tagName === "A" && n.textContent === window.SURVEY.ui.facil_link.ru);
ok("done screen links to facilitator report", !!facil);

/* EN switch: language dropdown boots survey in English without throwing */
let enThrew = null;
try { globalThis.localStorage.setItem("contours:lang", "en"); const sel = rootApp._walk([]).find((n) => n.tagName === "SELECT"); if (sel) { sel.value = "en"; sel._fire("change"); } } catch (e) { enThrew = e; }
ok("language switch reboots without throwing", enThrew === null);

console.log(`\ncontours runner: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
