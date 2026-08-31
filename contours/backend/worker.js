/* ============================================================
   Опрос по контурам — приём ответов (Cloudflare Worker).

   Что делает и чего НЕ делает (честно):
   • POST /submit — принимает ответ, САНИРУЕТ на входе (убирает поминутную
     латентность/время на вопрос, огрубляет метки времени до суток, режет
     сверхдлинные строки) и кладёт в KV append-only под случайным id.
   • НЕ логирует IP и заголовки запроса.
   • GET /report?key=<groupKey> — отдаёт санированные ответы ТОЛЬКО по токену
     фасилитатора (Authorization: Bearer <FAC_TOKEN>) и ТОЛЬКО при N ≥ MIN_N.
   • CORS ограничен ALLOWED_ORIGIN.

   Это «append-only + строгий доступ + минимизация данных», НЕ zero-knowledge:
   держатель токена видит санированные индивидуальные записи. Выдавайте токен
   человеку ВНЕ линии подчинения команды (внешний фасилитатор / HR-партнёр).
   ============================================================ */
const MAXLEN = 4000; // предохранитель от гигантской вставки в открытый ответ

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
      // append-only; ключ случайный; никаких IP/метаданных запроса не сохраняем
      await env.RESPONSES.put(clean.groupKey + ":" + crypto.randomUUID(), JSON.stringify(clean));
      return json({ ok: true }, 200, cors);
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
  });
  return {
    v: 1, survey: cut(b.survey), groupKey: cut(b.groupKey), isLeader: !!b.isLeader,
    segment: { stage: cut(seg.stage || ""), func: cut(seg.func || ""), loc: cut(seg.loc || "") },
    lang: b.lang === "en" ? "en" : "ru",
    startedAt: dayFloor(b.startedAt), finishedAt: dayFloor(b.finishedAt), answers,
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: Object.assign({ "Content-Type": "application/json" }, cors) });
}
