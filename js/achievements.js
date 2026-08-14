/* ============================================================
   achievements.js — deciding when a result is worth celebrating.

   Two independent yardsticks, because they answer different questions:

     • vs the population  — "am I good at this?"   (percentile from norms)
     • vs your own history — "am I improving?"     (personal best, own average)

   Everything here is pure: given results and past sessions, return what
   to say and how loudly to say it. Rendering lives elsewhere.
   ============================================================ */

/** Celebration tiers, loudest first. `rank` drives confetti intensity. */
export const TIERS = {
  legendary: { rank: 4, cls: "t-legendary", icon: "🏆" },
  great:     { rank: 3, cls: "t-great",     icon: "🎉" },
  good:      { rank: 2, cls: "t-good",      icon: "✨" },
  solid:     { rank: 1, cls: "t-solid",     icon: "👏" },
  none:      { rank: 0, cls: "t-none",      icon: "" },
};

/**
 * Best score ever recorded for a test, excluding one session id.
 * @returns {number|null} null when there's no prior attempt.
 */
export function personalBest(sessions, testId, excludeSessionId = null) {
  let best = null;
  for (const s of sessions || []) {
    if (excludeSessionId && s.id === excludeSessionId) continue;
    const v = s.scores?.[testId];
    if (typeof v !== "number") continue;
    if (best == null || v > best) best = v;
  }
  return best;
}

/** How many times this test has been taken before (excluding one session). */
export function attemptCount(sessions, testId, excludeSessionId = null) {
  let n = 0;
  for (const s of sessions || []) {
    if (excludeSessionId && s.id === excludeSessionId) continue;
    if (typeof s.scores?.[testId] === "number") n++;
  }
  return n;
}

/** Mean of a test's past scores, or null if never taken. */
export function pastAverage(sessions, testId, excludeSessionId = null) {
  const vals = [];
  for (const s of sessions || []) {
    if (excludeSessionId && s.id === excludeSessionId) continue;
    const v = s.scores?.[testId];
    if (typeof v === "number") vals.push(v);
  }
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Population-standing tier from a percentile. */
export function tierForPercentile(pct) {
  if (pct == null) return "none";
  if (pct >= 95) return "legendary";
  if (pct >= 84) return "great";
  if (pct >= 70) return "good";
  if (pct >= 55) return "solid";
  return "none";
}

/**
 * Everything worth celebrating about one test result.
 *
 * @param {object} opts
 *   score      — 0..100 for this attempt
 *   pct        — population percentile (may be null when no norm exists)
 *   sessions   — full session history (including this one)
 *   testId     — which test
 *   sessionId  — the session just saved, excluded from "past" comparisons
 * @returns {{tier:string, badges:Array<{key,label,detail}>, isFirst:boolean,
 *            isPB:boolean, deltaVsAvg:number|null, headline:string|null}}
 */
export function achievementsFor({ score, pct, sessions, testId, sessionId = null }) {
  const prevBest = personalBest(sessions, testId, sessionId);
  const prevAvg = pastAverage(sessions, testId, sessionId);
  const attempts = attemptCount(sessions, testId, sessionId);
  const isFirst = attempts === 0;
  // A first-ever attempt is a baseline, not a "personal best".
  const isPB = !isFirst && prevBest != null && score > prevBest + 0.5;
  const deltaVsAvg = prevAvg == null ? null : score - prevAvg;

  const badges = [];
  if (pct != null && pct >= 99) badges.push({ key: "top1", label: "Top 1%", detail: `Better than ~99% of people` });
  else if (pct != null && pct >= 95) badges.push({ key: "top5", label: "Top 5%", detail: `Better than ~${pct}% of people` });
  else if (pct != null && pct >= 90) badges.push({ key: "top10", label: "Top 10%", detail: `Better than ~${pct}% of people` });
  else if (pct != null && pct >= 75) badges.push({ key: "top25", label: "Top 25%", detail: `Better than ~${pct}% of people` });

  if (isPB) badges.push({ key: "pb", label: "Personal best", detail: `Beat your previous best of ${Math.round(prevBest)}` });
  if (!isFirst && deltaVsAvg != null && deltaVsAvg >= 5) {
    badges.push({ key: "above-own", label: "Above your average", detail: `+${Math.round(deltaVsAvg)} vs your usual ${Math.round(prevAvg)}` });
  }
  if (isFirst) badges.push({ key: "baseline", label: "Baseline set", detail: "Your first reading on this test" });

  // The loudest of: population standing, or a personal best.
  let tier = tierForPercentile(pct);
  if (isPB && TIERS[tier].rank < TIERS.great.rank) tier = "great";
  if (!isPB && isFirst && tier === "none") tier = "none";

  return { tier, badges, isFirst, isPB, deltaVsAvg, prevBest, headline: headlineFor({ tier, pct, isPB, isFirst }) };
}

/** The one line shown biggest. Kept honest — no praise for a weak result. */
export function headlineFor({ tier, pct, isPB, isFirst }) {
  if (isPB && (pct == null || pct < 90)) return "New personal best";
  switch (tier) {
    case "legendary": return pct >= 99 ? "Top 1% — exceptional" : "Top 5% — exceptional";
    case "great":     return isPB ? "Personal best — and top 15%" : "Well above average";
    case "good":      return "Above average";
    case "solid":     return "Slightly above average";
    default:          return isFirst ? "Baseline recorded" : null;
  }
}

/**
 * Session-level celebration for a full assessment.
 * @param {object} opts overallPct, composite, sessions, sessionId
 */
export function sessionAchievements({ overallPct, composite, sessions, sessionId = null }) {
  const prevComposites = [];
  for (const s of sessions || []) {
    if (sessionId && s.id === sessionId) continue;
    if (s.kind !== "full") continue;
    const vals = Object.values(s.scores || {}).filter((v) => typeof v === "number");
    if (!vals.length) continue;
    prevComposites.push(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  const prevBest = prevComposites.length ? Math.max(...prevComposites) : null;
  const isFirst = prevComposites.length === 0;
  const isPB = !isFirst && prevBest != null && composite > prevBest + 0.5;

  let tier = tierForPercentile(overallPct);
  if (isPB && TIERS[tier].rank < TIERS.great.rank) tier = "great";

  const badges = [];
  if (overallPct != null && overallPct >= 90) badges.push({ key: "top10", label: `Top ${100 - overallPct}%`, detail: "Across the whole battery" });
  if (isPB) badges.push({ key: "pb", label: "Best session yet", detail: `Previous best composite ${Math.round(prevBest)}` });
  if (isFirst) badges.push({ key: "baseline", label: "Baseline set", detail: "Your first full assessment" });

  return {
    tier, badges, isFirst, isPB, prevBest,
    headline: isFirst ? "Baseline recorded"
      : isPB ? "Best session yet"
        : headlineFor({ tier, pct: overallPct, isPB, isFirst }),
  };
}

/** Rank a session's results to call out the standout and the weak spot. */
export function strongestAndWeakest(results, pctById) {
  let best = null, worst = null;
  for (const r of results || []) {
    const pct = pctById[r.id];
    if (pct == null) continue;
    if (!best || pct > best.pct) best = { ...r, pct };
    if (!worst || pct < worst.pct) worst = { ...r, pct };
  }
  // Only meaningful when they actually differ.
  if (best && worst && best.id === worst.id) worst = null;
  return { best, worst };
}
