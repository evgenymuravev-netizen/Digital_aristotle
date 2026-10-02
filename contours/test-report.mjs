/* Смоук-тест отчёта фасилитатора (report.html) под мини-шимом DOM.
   Извлекает inline-скрипт, запускает его, жмёт «Демо-данные» и проверяет,
   что отчёт v0.2 отрисовался: датчик, составляющие, конфликты — и что в
   HTML не просочились undefined/NaN. Node, без зависимостей. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(dir, "report.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)[1];

function node(id) {
  return { id, textContent: "", innerHTML: "", value: "", style: {}, _h: {},
    addEventListener(t, fn) { (this._h[t] = this._h[t] || []).push(fn); },
    click() { (this._h.click || []).forEach((fn) => fn.call(this, { target: this })); },
    setAttribute() {}, appendChild() {}, remove() {} };
}
const ids = {};
["in", "files", "pick", "go", "demo", "count", "err", "out", "h-brand", "h-back", "h-eyebrow", "h-h1", "h-lede", "h-paste", "btn-print", "btn-agg"].forEach((i) => { ids[i] = node(i); });
globalThis.document = { getElementById: (i) => ids[i] || null, createElement: (t) => node(t), documentElement: { setAttribute() {} }, body: node("body") };
globalThis.localStorage = { getItem: () => "ru", setItem() {} };
globalThis.window = {};
const load = (f) => (0, eval)(fs.readFileSync(path.join(dir, f), "utf8"));
load("config.js"); load("survey.js"); load("metrics.js");
(0, eval)(script);

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("  ✗ FAIL: " + name); } };

ids.demo.click();
const out = ids.out.innerHTML;
ok("report rendered (non-empty)", out.length > 2000);
ok("governance panel present", out.indexOf("линии подчинения") >= 0);
ok("fear section present", out.indexOf("Достоверность датчика") >= 0);
ok("components section present", out.indexOf("составляющие") >= 0 && out.indexOf("Стратегия") >= 0 && out.indexOf("Культура") >= 0);
ok("valence chips present", out.indexOf("валентность") >= 0);
ok("conflicts section present", out.indexOf("Конфликты контуров") >= 0 && out.indexOf("К1↔К2") >= 0);
ok("named conflict present", out.indexOf("Ценности против правил") >= 0 && out.indexOf("Цель против человека") >= 0);
ok("sensors chips present", out.indexOf("датчики К3/К4") >= 0);
ok("lead-indicator note present", out.indexOf("ведущий показатель") >= 0);
ok("diagnosis present", out.indexOf("Диагноз") >= 0 || out.indexOf("считается автоматически") >= 0);
ok("no 'undefined' leaked into HTML", out.indexOf("undefined") < 0);
ok("no 'NaN' leaked into HTML", out.indexOf("NaN") < 0);
ok("episode rows render without IoA chip", out.indexOf("эпизод") >= 0);
ok("AI-coded open answer rendered", out.indexOf("ИИ-саммари") >= 0);
ok("lived-values panel rendered", out.indexOf("Прожитые ценности") >= 0 && out.indexOf("затронутые контуры") >= 0);

console.log(`\ncontours report: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
