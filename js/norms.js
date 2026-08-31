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
    measures: "Short-term and working memory — holding digits for a few seconds (forward), then mentally reversing them (backward).",
    why: "The classic span measure. We rarely memorise numbers anymore, so it's directly exposed to outsourcing — and the backward half adds true mental manipulation.",
    realWorld: "Holding a phone number long enough to use it; reversing directions you just heard; mental bookkeeping.",
    norm: {
      metricLabel: "Total span (forward + backward)", unit: "digits", mean: 11.3, sd: 2.0, lowerBetter: false, established: true,
      source: "Wechsler-style norms: forward span ≈ 6.6, backward ≈ 4.8 in healthy adults; forward famously 7±2 (Miller, 1956).",
    },
  },
  corsi: {
    measures: "Visuospatial short-term memory — holding locations and their order in mind.",
    why: "Navigation, mental imagery and visual thinking all draw on this store — and GPS means we exercise it less than any generation before.",
    realWorld: "Remembering where you parked, retracing a route, recalling how things were laid out.",
    norm: {
      metricLabel: "Corsi span", unit: "blocks", mean: 6.0, sd: 1.2, lowerBetter: false, established: true,
      source: "Kessels et al. (2000) standardization of the Corsi block-tapping task: span ≈ 6 in healthy adults.",
    },
  },
  coding: {
    measures: "Processing speed with learning — how fast you absorb a new symbol→meaning key and execute it.",
    why: "Coding tasks are among the most sensitive general indicators in clinical batteries; they sag early with fatigue and cognitive load.",
    realWorld: "Picking up a new app's icons, learning keyboard shortcuts, reading unfamiliar notation.",
    norm: {
      metricLabel: "Correct matches in 60 s", unit: "correct", mean: 24, sd: 7, lowerBetter: false, established: false,
      source: "Inspired by SDMT / WAIS coding (≈55 pairings in 90 s on paper); this web format differs — rough in-app reference.",
    },
  },
  gonogo: {
    measures: "Response inhibition & sustained attention — acting fast, yet withholding when the rule says stop.",
    why: "Impulse control is the brake pedal of cognition. Constant notifications train the opposite reflex.",
    realWorld: "Not clicking the phishing link, holding your tongue, stopping at amber.",
    norm: {
      metricLabel: "No-go accuracy", unit: "%", mean: 82, sd: 11, lowerBetter: false, established: false,
      source: "Commission-error rates of 10–25% are typical in fast go/no-go tasks; depends heavily on pacing — rough reference.",
    },
  },
  switching: {
    measures: "Cognitive flexibility — shifting between rules without one bleeding into the other.",
    why: "Multitasking is mostly rapid switching, and every switch has an invisible time cost. This measures yours.",
    realWorld: "Jumping between email and a spreadsheet, switching languages mid-conversation, context-switching at work.",
    norm: {
      metricLabel: "Switch cost", unit: "ms", mean: 280, sd: 160, lowerBetter: true, established: false,
      source: "Mixed-block switch costs of ~150–400 ms are typical (Monsell, 2003); strongly format-dependent — rough reference.",
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

/** Inverse standard-normal CDF (probit), Acklam's rational approximation. */
export function probit(p) {
  if (p <= 0 || p >= 1) throw new RangeError("probit: p must be in (0,1)");
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let q, r;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= 1 - pl) {
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
          ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

function round1(v) { return Number.isInteger(v) ? String(v) : (Math.round(v * 10) / 10).toFixed(1); }

/** Format a value in a test's units for display. */
export function fmtNorm(v, unit) {
  if (v == null || Number.isNaN(v)) return "—";
  switch (unit) {
    case "ms": return `${Math.round(v)} ms`;
    case "%": return `${Math.round(v)}%`;
    case "digits": return `${round1(v)} digits`;
    case "blocks": return `${round1(v)} blocks`;
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

/**
 * Overall standing across a set of results: average of per-test z-scores
 * (each capped at ±3 so one extreme test can't dominate) → percentile.
 * @param {Array<{id:string, raw:number}>} results
 * @returns {{z:number, pct:number, n:number}|null}
 */
export function overallNorm(results) {
  const zs = [];
  for (const r of results || []) {
    const n = compareToNorm(r.id, r.raw);
    if (n) zs.push(clamp(n.z, -3, 3));
  }
  if (!zs.length) return null;
  const z = zs.reduce((a, b) => a + b, 0) / zs.length;
  const pct = clamp(Math.round(normalCdf(z) * 100), 1, 99);
  return { z, pct, n: zs.length };
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
