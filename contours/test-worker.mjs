/* Тест приёмного Worker (backend/worker.js) с моками KV и API Anthropic.
   Проверяет: ИИ-кодировка заменяет открытый текст на саммари+разметку
   (сырой текст НЕ сохраняется), сбой ИИ → текст выброшен (AI_FALLBACK=drop),
   без ключа — прежнее поведение, санация таймингов, гейт minN и токен на
   GET /report. Node ≥18 (глобальные Request/Response/fetch), без зависимостей. */
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const worker = (await import(path.join(dir, "backend", "worker.js"))).default;

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("  ✗ FAIL: " + name); } };

function kvMock() {
  return { store: {},
    async put(k, v) { this.store[k] = v; },
    async get(k) { return this.store[k] ?? null; },
    async list({ prefix }) { return { keys: Object.keys(this.store).filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }; } };
}
function payload() {
  return { v: 2, survey: "contours-0.2", groupKey: "t1", isLeader: false, life: "long",
    segment: { stage: "24+", func: "prod", loc: "hq" }, lang: "ru", startedAt: 1756600000000, finishedAt: 1756600001000,
    answers: {
      A2: { value: ["d1", "d2", "d3"], skipped: false, latencyMs: 1234, spentMs: 999 },
      B4: { value: "СЕКРЕТ: Борис из юротдела продавил релиз в обход ревью", skipped: false, open: 1 },
      B7: { value: "обходят ревью", skipped: false, open: 1 },
      B10: { value: null, skipped: true, open: 1 },
    } };
}
const post = (env, body) => worker.fetch(new Request("https://w.dev/submit", { method: "POST", body: JSON.stringify(body) }), env);
const report = (env, key, token) => worker.fetch(new Request("https://w.dev/report?key=" + key, { headers: token ? { Authorization: "Bearer " + token } : {} }), env);

/* --- 1. ИИ-кодировка: хранится саммари, не текст --- */
{
  const env = { RESPONSES: kvMock(), FAC_TOKEN: "sekret", MIN_N: "5", ANTHROPIC_API_KEY: "k", ORG_VALUES: "Скорость,Прозрачность,Ответственность" };
  let apiBody = null;
  globalThis.fetch = async (url, opts) => {
    apiBody = JSON.parse(opts.body);
    return new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text:
      'Вот разметка:\n[{"id":"B4","summary":"обход процесса под давлением дедлайна без последствий","contours":["K2","K3"],"components":["St","P"],"values":["Прозрачность"],"valence":-1},' +
      '{"id":"B7","summary":"регулярно обходят ревью","contours":["K2"],"components":["St"],"values":[],"valence":-1}]' }] }), { status: 200 });
  };
  const r = await post(env, payload());
  ok("submit ok with ai flag", r.status === 200 && (await r.json()).ai === true);
  const stored = JSON.parse(Object.values(env.RESPONSES.store)[0]);
  ok("raw open text NOT stored", JSON.stringify(stored).indexOf("СЕКРЕТ") < 0 && JSON.stringify(stored).indexOf("Борис") < 0);
  ok("summary + labels stored", stored.answers.B4.value.ai === 1 && stored.answers.B4.value.contours.join() === "K2,K3" && stored.answers.B4.value.values[0] === "Прозрачность" && stored.answers.B4.value.valence === -1);
  ok("second open answer coded too", stored.answers.B7.value.ai === 1);
  ok("skipped open answer untouched", stored.answers.B10.skipped === true);
  ok("closed answers pass through", stored.answers.A2.value.join() === "d1,d2,d3");
  ok("timing stripped", stored.answers.A2.latencyMs === undefined && stored.answers.A2.spentMs === undefined);
  ok("timestamps coarsened to day", stored.startedAt % 86400000 === 0);
  ok("API called with model default", apiBody.model === "claude-opus-5" && apiBody.output_config.effort === "low");
  ok("raw text went to API (transit, not storage)", JSON.stringify(apiBody).indexOf("СЕКРЕТ") >= 0);
  /* report гейт: 1 ответ < minN */
  const g = await (await report(env, "t1", "sekret")).json();
  ok("report gated below minN", g.gated === true && g.n === 1);
  ok("report unauthorized without token", (await report(env, "t1")).status === 401);
}

/* --- 2. Сбой ИИ + AI_FALLBACK=drop (по умолчанию): текст выброшен --- */
{
  const env = { RESPONSES: kvMock(), FAC_TOKEN: "s", MIN_N: "5", ANTHROPIC_API_KEY: "k" };
  globalThis.fetch = async () => new Response("boom", { status: 500 });
  await post(env, payload());
  const stored = JSON.parse(Object.values(env.RESPONSES.store)[0]);
  ok("on AI failure raw text discarded", JSON.stringify(stored).indexOf("СЕКРЕТ") < 0);
  ok("failure marked", stored.answers.B4.value.error === 1 && stored.answers.B4.value.ai === 0);
}

/* --- 3. Сбой ИИ + AI_FALLBACK=raw: санированный текст остаётся --- */
{
  const env = { RESPONSES: kvMock(), FAC_TOKEN: "s", MIN_N: "5", ANTHROPIC_API_KEY: "k", AI_FALLBACK: "raw" };
  globalThis.fetch = async () => new Response("boom", { status: 500 });
  await post(env, payload());
  const stored = JSON.parse(Object.values(env.RESPONSES.store)[0]);
  ok("fallback=raw keeps sanitized text", stored.answers.B4.value.indexOf("СЕКРЕТ") === 0);
}

/* --- 4. Без ключа: прежнее поведение (текст хранится, ai:false) --- */
{
  const env = { RESPONSES: kvMock(), FAC_TOKEN: "s", MIN_N: "5" };
  globalThis.fetch = async () => { throw new Error("must not be called"); };
  const r = await post(env, payload());
  ok("no key → ai:false", (await r.json()).ai === false);
  const stored = JSON.parse(Object.values(env.RESPONSES.store)[0]);
  ok("no key → raw open text kept (documented)", typeof stored.answers.B4.value === "string");
}

/* --- 5. Валидация разметки от модели: чужие метки отбрасываются --- */
{
  const env = { RESPONSES: kvMock(), FAC_TOKEN: "s", MIN_N: "5", ANTHROPIC_API_KEY: "k", ORG_VALUES: "Скорость" };
  globalThis.fetch = async () => new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text:
    '[{"id":"B4","summary":"x","contours":["K9","K1"],"components":["Zz","S"],"values":["Чужое","Скорость"],"valence":5}]' }] }), { status: 200 });
  await post(env, payload());
  const stored = JSON.parse(Object.values(env.RESPONSES.store)[0]);
  const v = stored.answers.B4.value;
  ok("model output whitelisted", v.contours.join() === "K1" && v.components.join() === "S" && v.values.join() === "Скорость" && v.valence === 0);
}

console.log(`\ncontours worker: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
