/* ============================================================
   aiusage.js — how much you actually talk to AI.

   The battery measures the outcome; this measures the exposure. Put the
   two side by side over months and "is AI making me dumber" stops being
   a vibe and becomes a within-person correlation.

   A static page can't read your ChatGPT account. It CAN read the data
   export every major product lets you download, entirely in the browser:
     • ChatGPT  — Settings → Data controls → Export data → conversations.json
     • Claude   — Settings → Privacy → Export data → conversations.json
     • Gemini   — Google Takeout → My Activity → Gemini Apps → JSON
   plus a generic CSV (date,product,minutes,sessions) and a manual log for
   everything else (Copilot, Cursor, Perplexity…).

   Time is estimated by sessionising message timestamps: messages closer
   than 15 minutes belong to one sitting; a sitting lasts first→last
   message plus a short tail. Raw messages never leave the browser and are
   never stored — only per-day totals are kept.
   ============================================================ */

const KEY = "digital-aristotle:aiusage:v1";
export const PRODUCTS = ["ChatGPT", "Claude", "Gemini", "Copilot", "Cursor", "Perplexity", "Other"];
export const GAP_MIN = 15;     // idle gap that ends a sitting
export const TAIL_MIN = 1.5;   // reading time after the last message

const DAY = 86400000;
const pad = (n) => String(n).padStart(2, "0");

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Timestamp at local noon of a day key (DST-safe for day arithmetic). */
export function dayTs(key) { return Date.parse(`${key}T12:00:00`); }

/* ---------------------------- sessionising ---------------------------- */

/**
 * Group timestamped events into sittings and total them per day.
 * @param {Array<{t:number, user?:boolean}>} events
 * @returns {Array<{date:string, minutes:number, sessions:number, messages:number}>}
 */
export function sessionize(events, { gapMin = GAP_MIN, tailMin = TAIL_MIN } = {}) {
  const evs = [...events].filter((e) => Number.isFinite(e.t)).sort((a, b) => a.t - b.t);
  const days = new Map();
  let start = null, last = null, msgs = 0;
  const close = () => {
    if (start == null) return;
    const key = dayKey(start);
    const minutes = (last - start) / 60000 + tailMin;
    const d = days.get(key) || { date: key, minutes: 0, sessions: 0, messages: 0 };
    d.minutes += minutes; d.sessions += 1; d.messages += msgs;
    days.set(key, d);
  };
  for (const e of evs) {
    if (start == null || e.t - last > gapMin * 60000) { close(); start = e.t; msgs = 0; }
    last = e.t;
    if (e.user) msgs++;
  }
  close();
  return [...days.values()].map((d) => ({ ...d, minutes: Math.round(d.minutes * 10) / 10 })).sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------------------------- export parsers ---------------------------- */

export function detectFormat(data) {
  if (!Array.isArray(data) || !data.length) return null;
  const x = data.find((i) => i && typeof i === "object") || {};
  if (x.mapping && typeof x.mapping === "object") return "chatgpt";
  if (Array.isArray(x.chat_messages)) return "claude";
  if (typeof x.time === "string" && (x.header || Array.isArray(x.products))) return "gemini";
  return null;
}

export function parseChatGPT(arr) {
  const events = []; let conversations = 0;
  for (const c of arr) {
    let any = false;
    for (const node of Object.values(c?.mapping || {})) {
      const m = node?.message;
      if (!m || !m.create_time) continue;
      const role = m.author?.role;
      if (role !== "user" && role !== "assistant") continue;
      events.push({ t: m.create_time * 1000, user: role === "user" });
      if (role === "user") any = true;
    }
    if (any) conversations++;
  }
  return { product: "ChatGPT", events, conversations };
}

export function parseClaude(arr) {
  const events = []; let conversations = 0;
  for (const c of arr) {
    let any = false;
    for (const m of c?.chat_messages || []) {
      const t = Date.parse(m?.created_at);
      if (!Number.isFinite(t)) continue;
      const user = m.sender === "human";
      events.push({ t, user });
      if (user) any = true;
    }
    if (any) conversations++;
  }
  return { product: "Claude", events, conversations };
}

export function parseGemini(arr) {
  const events = [];
  for (const it of arr) {
    const t = Date.parse(it?.time);
    if (!Number.isFinite(t)) continue;
    events.push({ t, user: true });          // each activity item is a prompt
  }
  return { product: "Gemini", events, conversations: null };
}

/** date,product,minutes[,sessions[,messages]] — header optional. */
export function parseGenericCSV(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  let rows = lines.map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  if (rows[0] && /date/i.test(rows[0][0])) rows = rows.slice(1);
  const out = [];
  for (const r of rows) {
    const [date, product, minutes, sessions, messages] = r;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) continue;
    const min = parseFloat(minutes);
    if (!Number.isFinite(min)) continue;
    out.push({
      date, product: normalizeProduct(product),
      minutes: min, sessions: parseInt(sessions, 10) || 1, messages: parseInt(messages, 10) || 0,
    });
  }
  return out;
}

export function normalizeProduct(name) {
  const n = String(name || "").trim().toLowerCase();
  const hit = PRODUCTS.find((p) => p.toLowerCase() === n);
  if (hit) return hit;
  if (/gpt|openai/.test(n)) return "ChatGPT";
  if (/claude|anthropic/.test(n)) return "Claude";
  if (/gemini|bard|google/.test(n)) return "Gemini";
  if (/copilot/.test(n)) return "Copilot";
  if (/cursor/.test(n)) return "Cursor";
  if (/perplexity/.test(n)) return "Perplexity";
  return "Other";
}

/**
 * Turn a pasted/uploaded export into per-day records.
 * @returns {{product:string, format:string, records:Array, stats:{conversations:number|null, messages:number, days:number, from:string|null, to:string|null}}}
 */
export function parseExport(text, productHint = null) {
  let data = null;
  try { data = JSON.parse(text); } catch { /* not JSON — try CSV below */ }

  if (data != null) {
    const fmt = detectFormat(data);
    if (!fmt) throw new Error("Unrecognised JSON — expected a ChatGPT, Claude or Gemini export.");
    const parsed = fmt === "chatgpt" ? parseChatGPT(data) : fmt === "claude" ? parseClaude(data) : parseGemini(data);
    const product = productHint || parsed.product;
    const records = sessionize(parsed.events).map((r) => ({ ...r, product }));
    return { product, format: fmt, records, stats: summarize(records, parsed.conversations) };
  }

  const rows = parseGenericCSV(text);
  if (!rows.length) throw new Error("Couldn't read that file — use a ChatGPT/Claude/Gemini JSON export or a CSV of date,product,minutes,sessions.");
  const records = productHint ? rows.map((r) => ({ ...r, product: productHint })) : rows;
  return { product: productHint || "mixed", format: "csv", records, stats: summarize(records, null) };
}

function summarize(records, conversations) {
  const dates = records.map((r) => r.date).sort();
  return {
    conversations,
    messages: records.reduce((s, r) => s + (r.messages || 0), 0),
    minutes: Math.round(records.reduce((s, r) => s + r.minutes, 0)),
    days: records.length,
    from: dates[0] || null, to: dates[dates.length - 1] || null,
  };
}

/* ---------------------------- aggregation ---------------------------- */

export function aggregate(records) {
  const out = { minutes: 0, sessions: 0, messages: 0, days: new Set(), byProduct: {} };
  for (const r of records || []) {
    out.minutes += r.minutes || 0; out.sessions += r.sessions || 0; out.messages += r.messages || 0;
    out.days.add(r.date);
    const p = out.byProduct[r.product] || (out.byProduct[r.product] = { minutes: 0, sessions: 0, messages: 0 });
    p.minutes += r.minutes || 0; p.sessions += r.sessions || 0; p.messages += r.messages || 0;
  }
  return { minutes: out.minutes, hours: out.minutes / 60, sessions: out.sessions, messages: out.messages, days: out.days.size, byProduct: out.byProduct };
}

/** Monday-start week key for a day key. */
export function weekStart(key) {
  const d = new Date(dayTs(key));
  const dow = (d.getDay() + 6) % 7;          // Mon=0
  d.setDate(d.getDate() - dow);
  return dayKey(d.getTime());
}

/** Last `weeks` weeks (oldest first), each {start, minutes, sessions}. */
export function weekly(records, { weeks = 12, now = Date.now() } = {}) {
  const buckets = [];
  const thisWeek = weekStart(dayKey(now));
  for (let i = weeks - 1; i >= 0; i--) {
    const start = dayKey(dayTs(thisWeek) - i * 7 * DAY);
    buckets.push({ start, minutes: 0, sessions: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.start, i]));
  for (const r of records || []) {
    const i = idx.get(weekStart(r.date));
    if (i != null) { buckets[i].minutes += r.minutes || 0; buckets[i].sessions += r.sessions || 0; }
  }
  return buckets;
}

/** Minutes of AI use in the `days` days ending at `ts` (inclusive of that day). */
export function exposureBefore(records, ts, days = 7) {
  const end = dayTs(dayKey(ts));
  const startTs = end - (days - 1) * DAY;
  let min = 0;
  for (const r of records || []) {
    const t = dayTs(r.date);
    if (t >= startTs - DAY / 2 && t <= end + DAY / 2) min += r.minutes || 0;
  }
  return min;
}

export function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/**
 * Line up each full assessment with the AI hours in the week before it.
 * @returns {{rows:Array<{ts, date, hours, composite, testScore}>, rComposite:number|null, rTest:number|null, n:number}}
 */
export function exposureVsSessions(records, sessions, testId = "critical", { days = 7 } = {}) {
  const rows = [];
  for (const s of sessions || []) {
    if (s.kind !== "full") continue;
    const vals = Object.values(s.scores || {}).filter((v) => typeof v === "number");
    if (!vals.length) continue;
    rows.push({
      ts: s.ts, date: dayKey(s.ts),
      hours: Math.round((exposureBefore(records, s.ts, days) / 60) * 10) / 10,
      composite: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      testScore: typeof s.scores?.[testId] === "number" ? s.scores[testId] : null,
    });
  }
  rows.sort((a, b) => a.ts - b.ts);
  const withTest = rows.filter((r) => r.testScore != null);
  return {
    rows, n: rows.length,
    rComposite: pearson(rows.map((r) => r.hours), rows.map((r) => r.composite)),
    rTest: pearson(withTest.map((r) => r.hours), withTest.map((r) => r.testScore)),
  };
}

/** Plain-English read of a correlation for a small within-person sample. */
export function describeR(r, n) {
  if (r == null || n < 4) return "Too few sessions to say — keep logging.";
  const a = Math.abs(r);
  const strength = a < 0.2 ? "no clear relationship" : a < 0.4 ? "a weak" : a < 0.7 ? "a moderate" : "a strong";
  if (a < 0.2) return `${strength} between your AI hours and your scores so far (n = ${n}).`;
  return `${strength} ${r < 0 ? "negative" : "positive"} relationship: weeks with more AI use go with ${r < 0 ? "lower" : "higher"} scores (r = ${r.toFixed(2)}, n = ${n}). Correlation, not proof.`;
}

/* ---------------------------- storage ---------------------------- */

const hasLS = () => typeof localStorage !== "undefined";
function read() {
  if (!hasLS()) return { version: 1, records: [] };
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && Array.isArray(v.records) ? v : { version: 1, records: [] }; }
  catch { return { version: 1, records: [] }; }
}
function write(db) { if (hasLS()) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* quota */ } } return db; }
const newId = () => `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function getUsage() { return read().records; }

export function addManual({ date, product, minutes, sessions = 1, messages = 0 }) {
  const db = read();
  const rec = { id: newId(), date, product: normalizeProduct(product), minutes: Number(minutes) || 0, sessions: Number(sessions) || 1, messages: Number(messages) || 0, source: "manual" };
  db.records.push(rec); write(db); return rec;
}

/** Imports are cumulative snapshots: replace what we had for that product from imports. */
export function replaceImport(product, records) {
  const db = read();
  db.records = db.records.filter((r) => !(r.source === "import" && r.product === product));
  for (const r of records) db.records.push({ id: newId(), ...r, product, source: "import" });
  write(db);
  return records.length;
}

export function deleteUsage(id) { const db = read(); db.records = db.records.filter((r) => r.id !== id); write(db); }
export function clearUsage() { if (hasLS()) localStorage.removeItem(KEY); }
export function exportUsage() { return read(); }
export function importUsageData(obj) {
  if (!obj || !Array.isArray(obj.records)) return 0;
  const db = read();
  const byId = new Map(db.records.map((r) => [r.id, r]));
  for (const r of obj.records) if (r && r.id) byId.set(r.id, r);
  db.records = [...byId.values()];
  write(db);
  return db.records.length;
}
