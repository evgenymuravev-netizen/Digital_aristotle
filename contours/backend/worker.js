/* ============================================================
   Опрос по контурам — приём ответов (Cloudflare Worker).

   Что делает и чего НЕ делает (честно):
   • POST /submit — принимает ответ, САНИРУЕТ на входе (убирает поминутную
     латентность/время на вопрос, огрубляет метки времени до суток, режет
     сверхдлинные строки) и кладёт в KV append-only под случайным id.
   • ИИ-кодировка открытых ответов (если задан ANTHROPIC_API_KEY):
     каждый открытый текст (метка open:1 от раннера) одним запросом к
     Claude превращается в ОБЕЗЛИЧЕННОЕ саммари + разметку — какие контуры
     (K1..K4) и составляющие (S/V/St/C/D/P/R) затрагивает, какие ценности,
     валентность. ХРАНИТСЯ ТОЛЬКО ЭТО; сырой текст не сохраняется никогда.
     Текст транзитом проходит через API Anthropic (используйте политику
     без обучения/ретеншена) и память Worker — это «нулевое хранение»,
     а не «нулевое раскрытие».
   • Без ключа открытые ответы хранятся как раньше (санированный текст) —
     об этом респонденту честно сказано на старте.
   • НЕ логирует IP и заголовки запроса.
   • GET /report?key=<groupKey> — отдаёт записи ТОЛЬКО по токену
     фасилитатора (Authorization: Bearer <FAC_TOKEN>) и ТОЛЬКО при N ≥ MIN_N.
   • CORS ограничен ALLOWED_ORIGIN.

   Это «append-only + строгий доступ + минимизация данных», НЕ zero-knowledge:
   держатель токена видит записи. Выдавайте токен человеку ВНЕ линии
   подчинения команды (внешний фасилитатор / HR-партнёр).

   env:
     RESPONSES          — KV namespace (binding)
     FAC_TOKEN          — секрет фасилитатора (wrangler secret put FAC_TOKEN)
     ANTHROPIC_API_KEY  — секрет для ИИ-кодировки (wrangler secret put ...)
     MODEL              — модель Claude (по умолчанию claude-opus-5)
     ORG_VALUES         — ценности через запятую (для разметки)
     AI_FALLBACK        — "drop" (по умолч.: при сбое ИИ текст ВЫБРАСЫВАЕТСЯ,
                          хранится пометка об ошибке) | "raw" (хранить текст)
     ALLOWED_ORIGIN, MIN_N — как раньше
   ============================================================ */
const MAXLEN = 4000; // предохранитель от гигантской вставки в открытый ответ
const CONTOURS = ["K1", "K2", "K3", "K4"];
const COMPONENTS = ["S", "V", "St", "C", "D", "P", "R"];

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    const minN = parseInt(env.MIN_N || "5", 10);

    if (req.method === "POST" && url.pathname === "/submit") {
      let body;
      try { body = await req.json(); } catch (e) { return json({ error: "bad json" }, 400, cors); }
      if (!body || !body.answers || !body.groupKey) return json({ error: "missing fields" }, 422, cors);
      const clean = sanitize(body);
      if (env.ANTHROPIC_API_KEY) await codeOpenAnswers(clean, env); // саммари вместо текста
      // append-only; ключ случайный; никаких IP/метаданных запроса не сохраняем
      await env.RESPONSES.put(clean.groupKey + ":" + crypto.randomUUID(), JSON.stringify(clean));
      return json({ ok: true, ai: !!env.ANTHROPIC_API_KEY }, 200, cors);
    }

    if (req.method === "GET" && url.pathname === "/report") {
      const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!env.FAC_TOKEN || token !== env.FAC_TOKEN) return json({ error: "unauthorized" }, 401, cors);
      const key = url.searchParams.get("key");
      if (!key) return json({ error: "missing key" }, 422, cors);
      const list = await env.RESPONSES.list({ prefix: key + ":" });
      const n = list.keys.length;
      if (n < minN) return json({ gated: true, n, minN }, 200, cors); // анонимность: не отдаём сырьё при малом N
      const responses = [];
      for (const k of list.keys) { const v = await env.RESPONSES.get(k.name); if (v) responses.push(JSON.parse(v)); }
      return json({ gated: false, n, responses }, 200, cors);
    }

    return json({ error: "not found" }, 404, cors);
  },
};

/* ---- ИИ-кодировка открытых ответов: хранится саммари + разметка, не текст ---- */
async function codeOpenAnswers(clean, env) {
  const open = [];
  Object.keys(clean.answers).forEach((id) => {
    const a = clean.answers[id];
    if (a && a.open && !a.skipped && typeof a.value === "string" && a.value.trim()) open.push({ id, text: a.value });
  });
  if (!open.length) return;

  const values = String(env.ORG_VALUES || "Скорость,Прозрачность,Ответственность").split(",").map((s) => s.trim()).filter(Boolean);
  let coded = null;
  try {
    coded = await askClaude(open, values, env);
  } catch (e) { coded = null; }

  open.forEach(({ id }) => {
    const c = coded && coded.find((x) => x && x.id === id);
    if (c) {
      clean.answers[id] = { open: 1, skipped: false, value: {
        ai: 1,
        summary: String(c.summary || "").slice(0, 200),
        contours: arr(c.contours, CONTOURS),
        components: arr(c.components, COMPONENTS),
        values: arr(c.values, values),
        valence: c.valence === 1 || c.valence === -1 ? c.valence : 0,
      } };
    } else if ((env.AI_FALLBACK || "drop") === "drop") {
      // приватность важнее полноты: при сбое ИИ текст выбрасываем, факт фиксируем
      clean.answers[id] = { open: 1, skipped: false, value: { ai: 0, error: 1 } };
    } // AI_FALLBACK === "raw": оставить санированный текст как есть
  });
}
function arr(x, allow) { return Array.isArray(x) ? x.map(String).filter((v) => allow.indexOf(v) >= 0).slice(0, 8) : []; }

async function askClaude(open, values, env) {
  const prompt =
    "Ты кодируешь анонимные ответы опроса о стратегии и культуре команды (фреймворк 4 контуров: " +
    "K1 — стратегия и ценности; K2 — структуры и культура; K3 — договорённости и поведение; K4 — личные действия и ресурс; " +
    "составляющие: S стратегия, V ценности, St структуры, C культура, D договорённости, P реакция системы, R личный ресурс). " +
    "Ценности компании: " + values.join(", ") + ".\n" +
    "Для КАЖДОГО ответа верни объект: id; summary — обезличенный пересказ сути в одну фразу (≤120 знаков, БЕЗ имён, должностей, дат и деталей, по которым можно узнать человека); " +
    "contours — какие контуры затрагивает (подмножество [\"K1\",\"K2\",\"K3\",\"K4\"]); components — подмножество [\"S\",\"V\",\"St\",\"C\",\"D\",\"P\",\"R\"]; " +
    "values — какие из ценностей компании затронуты (точные строки из списка выше, может быть пустым); " +
    "valence — 1 если случай подтверждает здоровье системы, -1 если сигналит поломку, 0 нейтрально.\n" +
    "Ответь ТОЛЬКО JSON-массивом без пояснений.\n\nОтветы:\n" +
    open.map((o) => JSON.stringify({ id: o.id, text: o.text })).join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.MODEL || "claude-opus-5",
      max_tokens: 2000,
      output_config: { effort: "low" }, // простая кодировка — глубокое размышление не нужно
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("api " + res.status);
  const data = await res.json();
  if (data.stop_reason === "refusal") throw new Error("refusal");
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const m = text.match(/\[[\s\S]*\]/); // модель может обернуть JSON в пояснение — берём массив
  if (!m) throw new Error("no json");
  const parsed = JSON.parse(m[0]);
  if (!Array.isArray(parsed)) throw new Error("not array");
  return parsed;
}

function dayFloor(ts) { const d = new Date(ts || Date.now()); d.setUTCHours(0, 0, 0, 0); return d.getTime(); }
function cut(s) { return typeof s === "string" ? s.slice(0, MAXLEN) : s; }

function sanitize(b) {
  const seg = b.segment || {};
  const answers = {};
  Object.keys(b.answers || {}).forEach((k) => {
    const a = b.answers[k] || {};
    let v = a.value;
    if (typeof v === "string") v = cut(v);
    else if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = {}; Object.keys(v).forEach((kk) => { o[cut(kk)] = Array.isArray(v[kk]) ? v[kk].map(cut) : cut(v[kk]); }); v = o;
    } else if (Array.isArray(v)) { v = v.map(cut); }
    answers[k] = { value: v, skipped: !!a.skipped }; // БЕЗ latencyMs / spentMs
    if (a.open) answers[k].open = 1;
  });
  return {
    v: 2, survey: cut(b.survey), groupKey: cut(b.groupKey), isLeader: !!b.isLeader,
    segment: { stage: cut(seg.stage || ""), func: cut(seg.func || ""), loc: cut(seg.loc || "") },
    life: ["temp", "mid", "long"].indexOf(b.life) >= 0 ? b.life : "",
    lang: b.lang === "en" ? "en" : "ru",
    startedAt: dayFloor(b.startedAt), finishedAt: dayFloor(b.finishedAt), answers,
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: Object.assign({ "Content-Type": "application/json" }, cors) });
}
