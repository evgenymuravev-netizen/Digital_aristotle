/* ============================================================
   storage.js — persistence of sessions in localStorage.
   A "session" is one or more test results recorded together.
   Schema is versioned so we can migrate later without data loss.
   ============================================================ */

const KEY = "digital-aristotle:v1";
const SETTINGS_KEY = "digital-aristotle:settings:v1";

const DEFAULT_DB = { version: 1, sessions: [] };
const DEFAULT_SETTINGS = { theme: "dark", difficulty: "standard" };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

/* ----------------------------- sessions ----------------------------- */

export function getDB() {
  const db = read(KEY, DEFAULT_DB);
  if (!Array.isArray(db.sessions)) db.sessions = [];
  return db;
}

export function getSessions() { return getDB().sessions; }

/**
 * Save a session.
 * @param {Array} results  array of { id, name, domain, score, raw, rawLabel, detail }
 * @param {string} kind    "full" | "single"
 */
export function saveSession(results, kind = "full") {
  const db = getDB();
  const session = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    kind,
    scores: Object.fromEntries(results.map((r) => [r.id, Math.round(r.score)])),
    raw: Object.fromEntries(results.map((r) => [r.id, r.raw])),
  };
  db.sessions.push(session);
  write(KEY, db);
  return session;
}

export function clearAll() {
  localStorage.removeItem(KEY);
}

/* ----------------------------- export / import ----------------------------- */

export function exportJSON() {
  return JSON.stringify({ ...getDB(), settings: getSettings(), exportedAt: new Date().toISOString() }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.sessions)) throw new Error("This file doesn't look like Digital Aristotle data.");
  // Merge by id to avoid duplicates, then sort by timestamp.
  const db = getDB();
  const byId = new Map(db.sessions.map((s) => [s.id, s]));
  for (const s of data.sessions) if (s && s.id) byId.set(s.id, s);
  db.sessions = [...byId.values()].sort((a, b) => a.ts - b.ts);
  write(KEY, db);
  if (data.settings) write(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...data.settings });
  return db.sessions.length;
}

/* ----------------------------- settings ----------------------------- */

export function getSettings() { return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, DEFAULT_SETTINGS) }; }

export function setSetting(key, value) {
  const s = getSettings();
  s[key] = value;
  write(SETTINGS_KEY, s);
  return s;
}
