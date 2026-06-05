/* ============================================================
   norms.js — what each test measures, and how a result compares
   to the wider population.

   There is no server and no pool of other users (your data never
   leaves the device), so "how you compare" is computed against
   *published population norms*: a mean and standard deviation for
   each test's raw metric, taken from the literature where solid
   ones exist and flagged as rough estimates where they don't.

   A percentile is then the normal-CDF of your standardized score —
   an approximation meant to give context, not a clinical ranking.
   ============================================================ */

import { clamp } from "./ui.js";

/* Per-test descriptions + the population reference for its raw metric.
   norm.mean / norm.sd describe the *raw* value each test reports:
     reaction   → median reaction time, ms        (lower is better)
     nback      → 2-back balanced accuracy, %      (higher is better)
     digitspan  → forward digit span, # digits     (higher is better)
     stroop     → Stroop interference, ms          (lower is better)
     mentalmath → correct answers in 60 s          (higher is better)
     sequences  → series solved out of 8           (higher is better)
   `established: true` = grounded in published norms; `false` = a
   rough in-app reference for context only. */
export const TESTINFO = {
  reaction: {
    measures: "Processing speed — the latency of the simplest sense → decide → act loop.",
    why: "It's the clock speed the rest of cognition runs on. It sags first with fatigue, distraction and disengagement, so it's an early canary for mental fog.",
    realWorld: "Braking in traffic, returning a serve, catching a glass before it hits the floor.",
    norm: {
      metricLabel: "Median reaction time", unit: "ms", mean: 270, sd: 45, lowerBetter: true, established: true,
      source: "≈273 ms median across ~81M web trials (Human Benchmark); lab simple visual RT ≈220–250 ms in young adults.",
    },
  },
  nback: {
    measures: "Working memory — holding a moving window of items in mind and updating it on the fly.",
    why: "Working memory is the desk space of thought: it caps how much you can reason about at once. Lean on notes and AI and it gets rehearsed less.",
    realWorld: "Following a multi-step recipe, doing arithmetic in your head, tracking the threads of a conversation.",
    norm: {
      metricLabel: "2-back balanced accuracy", unit: "%", mean: 85, sd: 10, lowerBetter: false, established: false,
      source: "Healthy adults typically score ~80–90% balanced accuracy on a standard 2-back; exact norms vary with timing and stimuli.",
    },
  },
  digitspan: {
    measures: "Short-term verbal memory capacity — how many items you can hold for a few seconds.",
    why: "The classic measure of raw memory span. We rarely memorise numbers anymore, so it's directly exposed to outsourcing.",
    realWorld: "Holding a phone number or address long enough to use it; remembering an order at the counter.",
    norm: {
      metricLabel: "Forward digit span", unit: "digits", mean: 6.6, sd: 1.3, lowerBetter: false, established: true,
      source: "Span is famously 7±2 (Miller, 1956); forward-span norms average ≈6.6 digits in healthy adults.",
    },
  },
  stroop: {
    measures: "Selective attention & inhibitory control — overriding the automatic response (reading) to follow the rule (name the ink).",
    why: "Inhibition is how you stay on-task and resist the obvious-but-wrong pull. It underlies focus and is sensitive to fatigue.",
    realWorld: "Ignoring a buzzing phone to finish a thought; not blurting the first answer that springs to mind.",
    norm: {
      metricLabel: "Stroop interference", unit: "ms", mean: 100, sd: 60, lowerBetter: true, established: false,
      source: "Interference (incongruent − congruent RT) is commonly ~50–200 ms in healthy adults; varies with format.",
    },
  },
  mentalmath: {
    measures: "Numeracy & calculation fluency under time pressure — arithmetic with no calculator.",
    why: "The skill we hand to devices most completely. If anything atrophies in the AI age, expect it to surface here first.",
    realWorld: "Splitting a bill, sanity-checking a price or statistic, estimating on the fly.",
    norm: {
      metricLabel: "Correct in 60 s", unit: "correct", mean: 13, sd: 5, lowerBetter: false, established: false,
      source: "No standard population norm exists for this exact sprint — a rough in-app reference, not a validated benchmark.",
    },
  },
  sequences: {
    measures: "Fluid reasoning — inferring an unseen rule and extending it (figuring things out from scratch).",
    why: "Fluid reasoning is general problem-solving horsepower, independent of learned facts. It's exactly what we lean on AI to do for us.",
    realWorld: "Debugging something new, spotting a pattern in data, planning around an unfamiliar problem.",
    norm: {
      metricLabel: "Series solved", unit: "of 8", mean: 5, sd: 1.6, lowerBetter: false, established: false,
      source: "Difficulty is item-dependent, so there's no clean external norm — a rough in-app reference.",
    },
  },
};

/* ---------------------------- math ---------------------------- */

/** erf via Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7). */
function erf(x) {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

/** Standard-normal CDF. */
export function normalCdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }

function round1(v) { return Number.isInteger(v) ? String(v) : (Math.round(v * 10) / 10).toFixed(1); }

/** Format a value in a test's units for display. */
export function fmtNorm(v, unit) {
  if (v == null || Number.isNaN(v)) return "—";
  switch (unit) {
    case "ms": return `${Math.round(v)} ms`;
    case "%": return `${Math.round(v)}%`;
    case "digits": return `${round1(v)} digits`;
    case "correct": return `${Math.round(v)} correct`;
    case "of 8": return `${Math.round(v)} / 8`;
    default: return round1(v);
  }
}

/** Qualitative band for a percentile (0–100). */
export function bandFor(pct) {
  if (pct >= 90) return { label: "Exceptional", cls: "up" };
  if (pct >= 75) return { label: "Well above average", cls: "up" };
  if (pct >= 60) return { label: "Above average", cls: "up" };
  if (pct > 40) return { label: "About average", cls: "flat" };
  if (pct >= 25) return { label: "Below average", cls: "down" };
  return { label: "Well below average", cls: "down" };
}

/**
 * Compare a raw result for `id` against the population norm.
 * @returns null when there's no norm or no value, else a display bundle.
 */
export function compareToNorm(id, raw) {
  const info = TESTINFO[id];
  if (!info || !info.norm || raw == null || Number.isNaN(raw)) return null;
  const n = info.norm;
  const z = (n.lowerBetter ? (n.mean - raw) : (raw - n.mean)) / n.sd;
  const pct = clamp(Math.round(normalCdf(z) * 100), 1, 99);
  const band = bandFor(pct);
  return {
    pct, z, band: band.label, cls: band.cls,
    typical: fmtNorm(n.mean, n.unit),
    yourValue: fmtNorm(raw, n.unit),
    metricLabel: n.metricLabel, unit: n.unit, lowerBetter: n.lowerBetter,
    established: !!n.established, source: n.source,
    phrase: `Better than about ${pct}% of people`,
  };
}

/** Compact reference for the Method page. */
export function normReference(id) {
  const info = TESTINFO[id];
  if (!info || !info.norm) return null;
  const n = info.norm;
  return { metricLabel: n.metricLabel, typical: fmtNorm(n.mean, n.unit), established: !!n.established, source: n.source };
}

/** "78th", "1st", etc. */
export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
