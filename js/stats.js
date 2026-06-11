/* ============================================================
   stats.js — turning a history of sessions into a *reliable*
   verdict about whether cognition is stable / improving / declining.

   The core idea (a simplified Reliable Change Index):
     • The very first full session is treated as calibration and dropped
       once we have enough data, because practice effects are largest then.
     • A baseline is formed from earlier sessions; the most recent few are
       compared against it.
     • Change is expressed in units of the baseline's own variability (z),
       with a measurement-noise floor so tiny real dips don't trip alarms.
   This is intentionally conservative: it would rather say "stable" than
   cry "decline" on a single bad day.
   ============================================================ */

import { mean } from "./ui.js";

export const STABLE_MIN = 3;        // full sessions needed before any verdict
const RECENT_MAX = 3;               // how many recent sessions form the "now" window
const NOISE_FLOOR = 4;              // min SD (points) — day-to-day measurement noise

function sampleSD(a) {
  if (a.length < 2) return NOISE_FLOOR;
  const m = mean(a);
  const v = a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1);
  return Math.sqrt(v);
}

/** Linear regression slope (per session) via least squares. */
function slope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xs = values.map((_, i) => i);
  const mx = mean(xs), my = mean(values);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (values[i] - my); den += (xs[i] - mx) ** 2; }
  return den ? num / den : 0;
}

/* ---------------------------- series extraction ---------------------------- */

/** Composite (mean of available sub-scores) for one session. */
export function compositeForSession(session, testIds) {
  const vals = testIds.map((id) => session.scores[id]).filter((v) => typeof v === "number");
  return vals.length ? mean(vals) : null;
}

/** The original six-test battery (v1). Sessions recorded before the battery
    expanded still count as full assessments for the composite chart. */
export const CORE_V1_IDS = ["reaction", "nback", "digitspan", "stroop", "mentalmath", "sequences"];

const covers = (s, ids) => ids.every((id) => typeof s.scores[id] === "number");

/** Composite series across *full* sessions — those covering the whole current
    battery, or the whole v1 battery (legacy data keeps charting). A session's
    composite is the mean of whichever sub-scores it contains. */
export function fullCompositeSeries(sessions, testIds) {
  return sessions
    .filter((s) => covers(s, testIds) || covers(s, CORE_V1_IDS))
    .map((s) => ({ ts: s.ts, score: Math.round(compositeForSession(s, Object.keys(s.scores))) }));
}

/** Per-test score series across any session that includes that test. */
export function testSeries(sessions, testId) {
  return sessions
    .filter((s) => typeof s.scores[testId] === "number")
    .map((s) => ({ ts: s.ts, score: s.scores[testId] }));
}

/* ---------------------------- the verdict ---------------------------- */

const VERDICTS = {
  insufficient: { cls: "v-info", label: "Calibrating", icon: "📊" },
  improving:    { cls: "v-good", label: "Improving",   icon: "📈" },
  stable:       { cls: "v-good", label: "Holding steady", icon: "🛡️" },
  watch:        { cls: "v-warn", label: "Slight dip",  icon: "👀" },
  decline:      { cls: "v-bad",  label: "Reliable decline", icon: "⚠️" },
};

/**
 * @param {number[]} values  scores oldest → newest
 * @returns full verdict object
 */
export function verdictFromSeries(values) {
  const n = values.length;
  if (n < STABLE_MIN) {
    return {
      status: "insufficient", ...VERDICTS.insufficient,
      message: `Take ${STABLE_MIN - n} more full assessment${STABLE_MIN - n === 1 ? "" : "s"} to establish a baseline. Spread them across different days for a trustworthy reading.`,
      stats: { n },
    };
  }

  // Drop the first session as calibration once we have a buffer.
  let v = values.slice();
  let warmupDropped = false;
  if (v.length >= 4) { v = v.slice(1); warmupDropped = true; }

  const k = Math.min(RECENT_MAX, Math.max(1, Math.floor(v.length / 2)));
  const baseline = v.slice(0, v.length - k);
  const recent = v.slice(v.length - k);

  const baselineMean = mean(baseline);
  const recentMean = mean(recent);
  const sd = Math.max(sampleSD(baseline), NOISE_FLOOR);
  const delta = recentMean - baselineMean;
  const z = delta / sd;
  const drift = slope(v) * (v.length - 1); // total modeled change across the window

  let status;
  if (z >= 0.8) status = "improving";
  else if (z > -0.8) status = "stable";
  else if (z >= -1.5) status = "watch";
  else status = "decline";

  const deltaTxt = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pts vs baseline (${z >= 0 ? "+" : ""}${z.toFixed(1)}σ)`;
  const messages = {
    improving: `Your recent scores are reliably above your baseline — ${deltaTxt}. Likely a mix of genuine gains and practice; keep it up.`,
    stable: `No reliable decline detected. Recent scores sit within normal day-to-day variation of your baseline — ${deltaTxt}. AI isn't dulling these skills.`,
    watch: `A slight downward drift — ${deltaTxt}. This is within the range of noise, fatigue, or an off day. Retest when well-rested before reading anything into it.`,
    decline: `Recent scores are reliably below your baseline — ${deltaTxt}. This exceeds normal noise. Consider whether you've been offloading these skills to AI, and test again over the next few days to confirm.`,
  };

  return {
    status, ...VERDICTS[status], message: messages[status],
    stats: { n, baselineMean, recentMean, sd, delta, z, drift, warmupDropped, baselineN: baseline.length, recentN: recent.length },
  };
}

/* ---------------------------- streaks & dates ---------------------------- */

const DAY = 86400000;
const dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

export function streakDays(sessions) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => dayKey(s.ts)));
  let streak = 0;
  let cursor = new Date();
  // Allow the streak to "start" today or yesterday.
  if (!days.has(dayKey(cursor.getTime()))) cursor = new Date(cursor.getTime() - DAY);
  while (days.has(dayKey(cursor.getTime()))) { streak++; cursor = new Date(cursor.getTime() - DAY); }
  return streak;
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtRelative(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / 3600000)} h ago`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return fmtDate(ts);
}

/* ---------------------------- top-level summary ---------------------------- */

/**
 * @param {Array} sessions
 * @param {Array} tests  registry [{id,name,domain,icon}]
 */
export function summarize(sessions, tests) {
  const ids = tests.map((t) => t.id);
  const composites = fullCompositeSeries(sessions, ids);
  const compValues = composites.map((c) => c.score);
  const verdict = verdictFromSeries(compValues);

  const perDomain = tests.map((t) => {
    const series = testSeries(sessions, t.id);
    const values = series.map((s) => s.score);
    const v = verdictFromSeries(values);
    const latest = values.length ? values[values.length - 1] : null;
    const arrow = v.status === "improving" ? "up" : (v.status === "watch" || v.status === "decline") ? "down" : "flat";
    return { ...t, values, series, latest, verdict: v, arrow };
  });

  return {
    sessionsCount: sessions.length,
    fullCount: composites.length,
    composites,
    latestComposite: compValues.length ? compValues[compValues.length - 1] : null,
    bestComposite: compValues.length ? Math.max(...compValues) : null,
    firstTs: sessions.length ? sessions[0].ts : null,
    lastTs: sessions.length ? sessions[sessions.length - 1].ts : null,
    streak: streakDays(sessions),
    verdict,
    perDomain,
  };
}

/* ---------------------------- resuming a full assessment ---------------------------- */

/** A standalone test taken within this long still counts toward a full assessment. */
export const RESUME_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Most recent *single* result per test within the window.
 * @returns {Object<string,{id,score,raw,label,sessionId,ts}>}
 */
export function recentSingleResults(sessions, ids, now = Date.now(), windowMs = RESUME_WINDOW_MS) {
  const map = {};
  for (const s of sessions) {
    if (s.kind !== "single") continue;
    if (now - s.ts > windowMs) continue;
    for (const id of ids) {
      if (typeof s.scores?.[id] !== "number") continue;
      const prev = map[id];
      if (!prev || s.ts > prev.ts) {
        map[id] = { id, score: s.scores[id], raw: s.raw?.[id], label: s.labels?.[id], sessionId: s.id, ts: s.ts };
      }
    }
  }
  return map;
}

/**
 * Plan a full assessment given what was already done recently.
 * @returns {{ recent, reusable: Array, remainingIds: string[], reusableCount: number }}
 */
export function planFullAssessment(sessions, tests, now = Date.now(), windowMs = RESUME_WINDOW_MS) {
  const ids = tests.map((t) => t.id);
  const recent = recentSingleResults(sessions, ids, now, windowMs);
  const reusable = ids.filter((id) => recent[id]).map((id) => recent[id]);
  const remainingIds = ids.filter((id) => !recent[id]);
  return { recent, reusable, remainingIds, reusableCount: reusable.length };
}
