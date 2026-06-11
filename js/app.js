/* ============================================================
   app.js — controller: routing, home, running tests, results,
   trends, methodology and settings.
   ============================================================ */

import { el, clear, showScreen, toast, setProgress, instructions, sleep } from "./ui.js";
import {
  getSessions, saveSession, deleteSessions, clearAll, exportJSON, importJSON, getSettings, setSetting,
} from "./storage.js";
import {
  summarize, verdictFromSeries, testSeries, fmtDate, fmtRelative, STABLE_MIN,
  planFullAssessment, RESUME_WINDOW_MS, compositeForSession,
} from "./stats.js";
import { drawLineChart, drawSparkline, indexDial } from "./chart.js";
import { TESTS, META, byId, NEW_IDS } from "./tests/index.js";
import { TESTINFO, compareToNorm, normReference, ordinal, overallNorm } from "./norms.js";

const state = { controller: null };

/* ----------------------------- theme ----------------------------- */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

/* ----------------------------- router ----------------------------- */
function go(screen) {
  if (state.controller && screen !== "stage") { state.controller.abort(); state.controller = null; }
  if (screen === "home") renderHome();
  else if (screen === "trends") renderTrends();
  else if (screen === "about") renderAbout();
  else if (screen === "settings") renderSettings();
  showScreen(screen);
}

/* ----------------------------- verdict pill ----------------------------- */
function verdictPill(v) {
  return el("span", { class: `verdict-pill ${v.cls}` }, [el("span", { class: "dot", "aria-hidden": "true" }), ` ${v.icon} ${v.label}`]);
}

/* ============================================================
   HOME
   ============================================================ */
function latestScorePerTest(sessions) {
  const map = {};
  for (const s of sessions) for (const [id, score] of Object.entries(s.scores)) map[id] = { score, ts: s.ts };
  return map;
}

function renderHome() {
  const sessions = getSessions();
  const sum = summarize(sessions, META);

  // --- index card ---
  const card = document.getElementById("index-card");
  clear(card);
  const dial = indexDial(sum.latestComposite, 156);

  const meta = el("div", { class: "index-meta" });
  if (sum.fullCount === 0) {
    meta.append(
      el("h3", { text: "Your Aristotle Index" }),
      el("p", { class: "muted", text: "Take your first full assessment to establish your baseline cognitive index." }),
    );
  } else {
    meta.append(
      el("h3", {}, ["Aristotle Index ", verdictPill(sum.verdict)]),
      el("p", { class: "muted", html: sum.verdict.message }),
      el("div", { class: "index-stats" }, [
        el("span", {}, ["Full assessments: ", el("b", { text: String(sum.fullCount) })]),
        el("span", {}, ["Best: ", el("b", { text: sum.bestComposite != null ? String(sum.bestComposite) : "—" })]),
        el("span", {}, ["Streak: ", el("b", { text: `${sum.streak} day${sum.streak === 1 ? "" : "s"}` })]),
        el("span", {}, ["Last: ", el("b", { text: sum.lastTs ? fmtRelative(sum.lastTs) : "—" })]),
      ]),
    );
  }
  card.append(dial, meta);

  // --- test grid ---
  const grid = document.getElementById("test-grid");
  clear(grid);
  const latest = latestScorePerTest(sessions);
  for (const m of TESTS) {
    const last = latest[m.meta.id];
    const card = el("button", { class: "test-card", type: "button" }, [
      el("div", { class: "tc-top" }, [
        el("span", { class: "tc-icon", text: m.meta.icon }),
        el("span", { class: "tc-domain", text: m.meta.domain }),
        NEW_IDS.includes(m.meta.id) ? el("span", { class: "new-badge", text: "NEW" }) : null,
      ]),
      el("h3", { text: m.meta.name }),
      el("p", { text: m.meta.blurb }),
      el("div", { class: "tc-foot" }, [
        el("span", { class: "tc-score", html: last ? `Last: <b>${last.score}</b>/100` : "<span class='muted'>Not taken yet</span>" }),
        el("span", { class: "muted", text: `${m.meta.duration} ▸` }),
      ]),
    ]);
    card.addEventListener("click", () => runSequence([m], "single"));
    grid.append(card);
  }
}

/* ============================================================
   RUNNING TESTS
   ============================================================ */
async function interstitial(stage, doneCount, total, nextMeta, signal, lastResult) {
  let scoreLine = "";
  if (lastResult) {
    const n = compareToNorm(lastResult.id, lastResult.raw);
    scoreLine = `<div class="inter-score">✓ <b>${lastResult.name}: ${Math.round(lastResult.score)}/100</b>${n ? ` <span class="muted">· better than ~${n.pct}% of people</span>` : ""}</div>`;
  }
  return instructions(stage, {
    domain: `${doneCount} of ${total} complete`,
    title: "Nice — keep going",
    bodyHTML: `${scoreLine}<p>Next up: <b>${nextMeta.icon} ${nextMeta.name}</b> <span class="muted">(${nextMeta.domain})</span>.</p>
               <p class="muted">Take a breath, then continue when you're ready. Your progress is saved after every test.</p>`,
    button: `Continue ▸`, signal,
  });
}

/** Re-create a result object from a stored recent single, to fold into a full session. */
function buildReusedResult(r) {
  const m = byId[r.id];
  return {
    ...m.meta, score: r.score, raw: r.raw,
    rawLabel: r.label || `Score ${Math.round(r.score)}/100`,
    reused: true,
  };
}

/**
 * Run a list of test modules and save the combined result.
 * @param {Array}  modules  test modules to actually run now
 * @param {string} kind     "full" | "single"
 * @param {object} opts     { preResults: [], absorbIds: [] }
 *   preResults — already-collected results to merge in (e.g. tests done earlier)
 *   absorbIds  — session ids to delete once merged (so they aren't double-counted)
 */
async function runSequence(modules, kind, opts = {}) {
  const { preResults = [], absorbIds = [] } = opts;
  const controller = new AbortController();
  state.controller = controller;
  showScreen("stage");
  const stage = document.getElementById("stage");
  const titleEl = document.querySelector(".stage-title");
  document.getElementById("abort-test").onclick = () => go("home");

  const total = modules.length + preResults.length;
  const fresh = [];
  const checkpointIds = [];   // per-test sessions saved as we go (full runs only)
  try {
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      titleEl.textContent = `${m.meta.icon} ${m.meta.name}`;
      setProgress(0, m.meta.name);
      const res = await m.run(stage, { signal: controller.signal });
      fresh.push(res);
      if (kind === "full") {
        // Checkpoint: if the run is interrupted, finished tests survive as
        // singles and the next "Start full assessment" resumes from them.
        checkpointIds.push(saveSession([res], "single").id);
        if (i < modules.length - 1) {
          const done = preResults.length + i + 1;
          const cont = await interstitial(stage, done, total, modules[i + 1].meta, controller.signal, res);
          if (!cont) throw new DOMException("aborted", "AbortError");
        }
      }
    }
  } catch (err) {
    setProgress(null);
    state.controller = null;
    if (err?.name === "AbortError") {
      toast(fresh.length && kind === "full"
        ? `Stopped — ${fresh.length} completed test${fresh.length === 1 ? "" : "s"} saved. Start the full assessment again within an hour to resume.`
        : "Test stopped — no data saved.");
      return;
    }
    console.error(err);
    toast("Something went wrong — returning home.");
    go("home");
    return;
  }

  setProgress(null);
  state.controller = null;

  // Merge reused + freshly-run, ordered canonically by the registry.
  const combined = [...preResults, ...fresh];
  const ordered = TESTS.map((t) => combined.find((r) => r.id === t.meta.id)).filter(Boolean);
  const finalResults = ordered.length ? ordered : combined;

  const session = saveSession(finalResults, kind);
  const toDelete = [...absorbIds, ...checkpointIds];
  if (toDelete.length) deleteSessions(toDelete);
  renderResults(finalResults, kind, session);
  showScreen("results");
}

/* ----------------------------- full assessment (with resume) ----------------------------- */
/** Rough wall-clock estimate for running these tests back to back. */
function minutesFor(ids) {
  const secs = ids.reduce((a, id) => a + (byId[id]?.meta.seconds || 60), 0) + Math.max(0, ids.length - 1) * 8;
  return Math.max(1, Math.round(secs / 60));
}

function startFullAssessment() {
  const plan = planFullAssessment(getSessions(), META, Date.now(), RESUME_WINDOW_MS);
  showScreen("stage");
  const stage = document.getElementById("stage");
  document.querySelector(".stage-title").textContent = "▶ Full assessment";
  setProgress(null);
  document.getElementById("abort-test").onclick = () => go("home");
  renderPreflight(stage, plan);
}

function renderPreflight(stage, plan) {
  clear(stage);
  const remaining = plan.remainingIds.length;
  const reused = plan.reusableCount;
  const mins = minutesFor(plan.remainingIds);

  const list = el("div", { class: "preflight-list" });
  for (const t of TESTS) {
    const meta = t.meta;
    const r = plan.recent[meta.id];
    list.append(el("div", { class: `preflight-item ${r ? "done" : "todo"}` }, [
      el("span", { class: "pf-mark", text: r ? "✓" : "○" }),
      el("span", { class: "tc-icon", text: meta.icon }),
      el("div", { class: "pf-body" }, [
        el("b", { text: meta.name }),
        el("div", { class: "muted pf-sub" }, [
          r ? `Done ${fmtRelative(r.ts)} · ${Math.round(r.score)}/100 — will be reused`
            : `${meta.domain}${meta.duration ? ` · ${meta.duration}` : ""}`,
        ]),
      ]),
    ]));
  }

  const runBtn = el("button", { class: "btn btn-primary btn-lg", type: "button" },
    remaining === 0 ? "Combine into full assessment ▸"
      : reused > 0 ? `Run remaining ${remaining} ▸ ~${mins} min`
        : `Begin ▸ ~${mins} min`);
  runBtn.addEventListener("click", () => {
    const preResults = plan.reusable.map(buildReusedResult);
    const modules = plan.remainingIds.map((id) => byId[id]);
    runSequence(modules, "full", { preResults, absorbIds: plan.reusable.map((r) => r.sessionId) });
  });
  const buttons = [runBtn];
  if (reused > 0) {
    const redoBtn = el("button", { class: "btn", type: "button", text: "Redo all" });
    redoBtn.addEventListener("click", () => runSequence(TESTS, "full"));
    buttons.push(redoBtn);
  }
  const cancelBtn = el("button", { class: "btn btn-ghost", type: "button", text: "Cancel" });
  cancelBtn.addEventListener("click", () => go("home"));
  buttons.push(cancelBtn);

  const blurb = reused > 0
    ? `You've taken <b>${reused} of ${TESTS.length}</b> tests in the last hour — they'll be reused${remaining > 0 ? `, only <b>${remaining}</b> to go` : ""}. Progress is saved after every test, so stopping never loses finished work.`
    : `${TESTS.length} short tests covering ${TESTS.length} cognitive domains. Progress is saved after every test — if you stop midway, finished tests are kept and you can resume within an hour.`;

  stage.append(el("div", { class: "instr preflight" }, [
    el("div", { class: "tc-domain", text: reused > 0 ? "Resume" : "Full assessment" }),
    el("h2", { text: remaining === 0 ? "Everything's done — combine it" : reused > 0 ? "Pick up where you left off" : "The full battery" }),
    el("p", { class: "muted", html: blurb }),
    list,
    el("div", { class: "cta-row preflight-cta" }, buttons),
  ]));
  runBtn.focus();
}

/* ============================================================
   RESULTS
   ============================================================ */
function compareToBaseline(testId) {
  const series = testSeries(getSessions(), testId).map((s) => s.score);
  if (series.length < 2) return { txt: "first reading", cls: "flat", arrow: "•" };
  const prev = series.slice(0, -1);
  const baseline = prev.reduce((a, b) => a + b, 0) / prev.length;
  const delta = series[series.length - 1] - baseline;
  const arrow = delta > 2 ? "▲" : delta < -2 ? "▼" : "▬";
  const cls = delta > 2 ? "up" : delta < -2 ? "down" : "flat";
  return { txt: `${delta >= 0 ? "+" : ""}${delta.toFixed(0)} vs your avg`, cls, arrow };
}

/* ----------------------------- population comparison ----------------------------- */
/** Small table cell: where this result sits vs the population. */
function normCell(r) {
  const n = compareToNorm(r.id, r.raw);
  if (!n) return el("span", { class: "muted", text: "—" });
  return el("span", {
    class: n.cls,
    title: `Typical ${n.metricLabel}: ${n.typical}${n.established ? "" : " (rough estimate)"}`,
  }, `${ordinal(n.pct)} pct`);
}

/** A visual "how you compare" panel for a single test. */
function normPanel(id, raw) {
  const n = compareToNorm(id, raw);
  if (!n) return null;
  return el("div", { class: "norm-panel" }, [
    el("div", { class: "norm-head" }, [
      el("span", { class: `band ${n.cls}`, text: n.band }),
      el("span", { class: "muted", text: `${ordinal(n.pct)} percentile` }),
    ]),
    el("div", { class: "normbar" }, [
      el("div", { class: "normbar-track" }, el("span", { style: { width: `${n.pct}%` } })),
      el("span", { class: "normbar-mark", style: { left: `${n.pct}%` } }),
    ]),
    el("div", { class: "norm-foot" }, [
      `Your ${n.metricLabel.toLowerCase()}: `, el("b", { text: n.yourValue }),
      el("span", { class: "muted", text: `  ·  typical ≈ ${n.typical}` }),
    ]),
    el("div", { class: "norm-src muted", text: `${n.established ? "Source" : "Rough reference"}: ${n.source}` }),
  ]);
}

/** "What this measures" explainer for a single test. */
function measuresPanel(id) {
  const info = TESTINFO[id];
  if (!info) return null;
  return el("div", { class: "measures" }, [
    el("h3", { text: "What this measures" }),
    el("p", {}, el("b", { text: info.measures })),
    el("p", { class: "muted", text: info.why }),
    el("p", { class: "muted", html: `<b>In daily life:</b> ${info.realWorld}` }),
  ]);
}

function renderResults(results, kind, session) {
  const body = document.getElementById("results-body");
  clear(body);

  const composite = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);

  if (kind === "full") {
    const sum = summarize(getSessions(), META);
    const ov = overallNorm(results);
    const head = el("div", { class: "panel" }, [
      el("div", { class: "verdict-hero" }, [
        indexDial(composite, 130),
        el("div", {}, [
          el("h2", {}, [`Composite: ${composite}/100 `, verdictPill(sum.verdict)]),
          el("p", { html: sum.verdict.message }),
          ov ? el("p", { class: "muted", html: `Overall vs population: ≈ <b>${ordinal(ov.pct)} percentile</b> — your per-test standings averaged (rough norms, ${ov.n} tests).` }) : null,
          el("p", { class: "muted", text: `Saved ${fmtDate(session.ts)} · assessment #${sum.fullCount}` }),
        ]),
      ]),
    ]);
    body.append(head);
  } else {
    const r0 = results[0];
    body.append(el("div", { class: "panel center" }, [
      el("div", { class: "tc-domain", text: r0.domain }),
      el("h2", { text: r0.name }),
      el("div", { class: "score-big", style: { fontFamily: "var(--font-serif)", fontSize: "3rem", color: "var(--accent)" }, text: String(Math.round(r0.score)) }),
      el("div", { class: "muted", text: r0.rawLabel }),
    ]));
    const np = normPanel(r0.id, r0.raw);
    if (np) {
      body.append(el("div", { class: "panel" }, [
        el("h2", { text: "How you compare" }),
        np,
        el("p", { class: "muted", style: { marginTop: "10px" }, text: "Compared against published population norms — not other users. Your data never leaves this device." }),
      ]));
    }
    const mp = measuresPanel(r0.id);
    if (mp) body.append(el("div", { class: "panel" }, [mp]));

    // nudge: recent singles roll into a full assessment automatically
    const plan = planFullAssessment(getSessions(), META, Date.now(), RESUME_WINDOW_MS);
    if (plan.reusableCount > 0 && plan.remainingIds.length > 0) {
      const btn = el("button", { class: "btn btn-primary", type: "button", text: `Finish the set ▸ ~${minutesFor(plan.remainingIds)} min` });
      btn.addEventListener("click", () => startFullAssessment());
      body.append(el("div", { class: "panel center" }, [
        el("p", { class: "muted", html: `<b>${plan.reusableCount} of ${TESTS.length}</b> tests done in the last hour — they already count toward a full assessment.` }),
        btn,
      ]));
    }
  }

  // breakdown table
  const rows = results.map((r) => {
    const cmp = compareToBaseline(r.id);
    return el("tr", {}, [
      el("td", {}, [el("span", { class: "tc-icon", text: r.icon }), " ", r.domain]),
      el("td", {}, el("b", { text: r.name })),
      el("td", { class: "muted" }, [r.rawLabel, r.reused ? el("span", { class: "reused-tag", text: " ↺ reused" }) : null]),
      el("td", { class: "num" }, [normCell(r)]),
      el("td", { class: "num" }, [el("span", { class: cmp.cls, text: `${cmp.arrow} ${cmp.txt}` })]),
      el("td", { class: "num" }, [
        el("div", { style: { display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" } }, [
          el("div", { class: "bar", style: { width: "110px" } }, el("span", { style: { width: `${Math.round(r.score)}%` } })),
          el("b", { text: String(Math.round(r.score)) }),
        ]),
      ]),
    ]);
  });
  const table = el("table", { class: "score-table" }, [
    el("thead", {}, el("tr", {}, [
      el("th", { text: "Domain" }), el("th", { text: "Test" }), el("th", { text: "Result" }),
      el("th", { class: "num", text: "vs others" }), el("th", { class: "num", text: "Trend" }), el("th", { class: "num", text: "Score" }),
    ])),
    el("tbody", {}, rows),
  ]);
  body.append(el("div", { class: "panel" }, [
    table,
    el("p", { class: "muted", style: { marginTop: "10px" }, text: "“vs others” is your percentile against published population norms (not other users). See the Method tab for the references behind each one." }),
  ]));

  if (getSessions().length < STABLE_MIN) {
    body.append(el("div", { class: "callout", html: `<b>Building your baseline.</b> One session can't tell you much — scores bounce around day to day. Do a few full assessments on different days and the <b>Trends</b> tab will start telling you, reliably, whether you're holding steady.` }));
  }
}

/* ============================================================
   TRENDS
   ============================================================ */
let trendsRedraw = null;

function renderTrends() {
  const body = document.getElementById("trends-body");
  clear(body);
  trendsRedraw = null;
  const sessions = getSessions();
  const sum = summarize(sessions, META);

  if (sessions.length === 0) {
    body.append(el("div", { class: "empty" }, [
      el("div", { class: "big", text: "🦉" }),
      el("h2", { text: "No data yet" }),
      el("p", { text: "Take an assessment and your results will start charting here." }),
      el("button", { class: "btn btn-primary", type: "button", onClick: () => go("home"), text: "Go to assessments" }),
    ]));
    return;
  }

  // verdict hero
  body.append(el("div", { class: "panel" }, [
    el("div", { class: "verdict-hero" }, [
      el("div", { class: "vh-icon", text: sum.verdict.icon }),
      el("div", {}, [
        el("h2", {}, [`${sum.verdict.label} `, verdictPill(sum.verdict)]),
        el("p", { html: sum.verdict.message }),
      ]),
    ]),
    el("div", { class: "index-stats", style: { marginTop: "14px" } }, [
      el("span", {}, ["Sessions: ", el("b", { text: String(sum.sessionsCount) })]),
      el("span", {}, ["Full assessments: ", el("b", { text: String(sum.fullCount) })]),
      el("span", {}, ["Current index: ", el("b", { text: sum.latestComposite != null ? String(sum.latestComposite) : "—" })]),
      el("span", {}, ["Best: ", el("b", { text: sum.bestComposite != null ? String(sum.bestComposite) : "—" })]),
      el("span", {}, ["Tracking since: ", el("b", { text: sum.firstTs ? fmtDate(sum.firstTs) : "—" })]),
    ]),
  ]));

  // composite chart
  const chartPanel = el("div", { class: "panel" });
  chartPanel.append(el("h2", { text: "Aristotle Index over time" }));
  if (sum.fullCount === 0) {
    chartPanel.append(el("p", { class: "muted", text: "Complete a full assessment (all six tests) to chart your composite index." }));
  } else {
    const canvas = el("canvas", { class: "chart" });
    chartPanel.append(el("div", { class: "chart-wrap" }, canvas));
    if (sum.fullCount < STABLE_MIN) {
      chartPanel.append(el("p", { class: "muted", text: `Calibrating — ${STABLE_MIN - sum.fullCount} more full assessment(s) until the verdict is statistically meaningful.` }));
    }
    trendsRedraw = () => drawLineChart(canvas, sum.composites, { height: 250 });
    requestAnimationFrame(trendsRedraw);
  }
  body.append(chartPanel);

  // per-domain table
  const sparks = [];
  const rows = sum.perDomain.map((d) => {
    const sparkCanvas = el("canvas", { class: "spark" });
    sparks.push(() => drawSparkline(sparkCanvas, d.values));
    return el("tr", {}, [
      el("td", {}, [el("span", { class: "tc-icon", text: d.icon }), " ", el("b", { text: d.name }), el("div", { class: "muted", style: { fontSize: ".8rem" }, text: d.domain })]),
      el("td", { class: "num" }, el("b", { text: d.latest != null ? String(d.latest) : "—" })),
      el("td", {}, sparkCanvas),
      el("td", {}, [el("span", { class: `trend-arrow ${d.arrow === "up" ? "up" : d.arrow === "down" ? "down" : "flat"}` }, d.arrow === "up" ? "▲ improving" : d.arrow === "down" ? "▼ watch" : "▬ steady")]),
    ]);
  });
  body.append(el("div", { class: "panel" }, [
    el("h2", { text: "By cognitive domain" }),
    el("table", { class: "score-table" }, [
      el("thead", {}, el("tr", {}, [
        el("th", { text: "Domain" }), el("th", { class: "num", text: "Latest" }),
        el("th", { text: "History" }), el("th", { text: "Read" }),
      ])),
      el("tbody", {}, rows),
    ]),
    el("p", { class: "muted", style: { marginTop: "10px" }, text: "Per-domain reads use the same baseline-vs-recent logic as the overall verdict. See the Method tab for how that works." }),
  ]));

  const drawAll = () => { trendsRedraw && trendsRedraw(); sparks.forEach((fn) => fn()); };
  requestAnimationFrame(drawAll);
  trendsRedraw = drawAll;
}

/* ============================================================
   ABOUT / METHOD
   ============================================================ */
const SCORING = {
  reaction: "Median of 7 trials, anticipations (&lt;120&nbsp;ms) rejected. 200&nbsp;ms → 100, 500&nbsp;ms → 0.",
  coding: "Correct symbol→digit matches in 60&nbsp;s; key shuffled every session. 36 → 100.",
  nback: "2-back, scored by <i>balanced accuracy</i> (hit-rate &amp; correct-rejection-rate averaged, so ignoring everything can't game it); d′ reported alongside.",
  corsi: "Longest block sequence tapped back in order. Span 2 → 0, span 8 → 100.",
  stroop: "Guaranteed 12/12 congruent–incongruent mix. Accuracy (60%) and speed (40%) on the conflicting trials.",
  gonogo: "Balanced go/no-go accuracy (80%) plus speed on correct GO responses (20%).",
  digitspan: "Forward and backward halves averaged. Forward: span 2 → 0, 9 → 100. Backward: 1 → 0, 8 → 100.",
  switching: "Accuracy above chance (60%) plus the speed cost of switching rules (40%).",
  mentalmath: "Correct answers in the 60-second sprint. 20 → 100.",
  sequences: "Problems run easy → hard and are difficulty-weighted; score = weighted % solved.",
};

function renderAbout() {
  const body = document.getElementById("about-body");
  if (body.dataset.filled) return; // static content
  body.dataset.filled = "1";

  const testCards = TESTS.map((t) => {
    const m = t.meta, info = TESTINFO[m.id], ref = normReference(m.id);
    return `<div class="method-test">
      <h3>${m.icon} ${m.name} <span class="chip">${m.domain}</span></h3>
      <p><b>${info.measures}</b></p>
      <p class="muted">${info.why}</p>
      <p class="muted"><b>Everyday:</b> ${info.realWorld}</p>
      <p class="muted small"><b>Scored:</b> ${SCORING[m.id]}</p>
      <p class="ref"><b>Typical ${ref.metricLabel.toLowerCase()}:</b> ≈ ${ref.typical}. ${ref.established ? "" : "<i>Rough in-app estimate.</i> "}<span class="src">${ref.source}</span></p>
    </div>`;
  }).join("");

  body.innerHTML = `
    <p class="lede">Digital Aristotle is a self-experiment. It can't prove AI is or isn't making you sharper or duller — but by measuring the same skills under the same conditions over time, it can tell you <em>reliably</em> whether your own performance is drifting.</p>

    <div class="callout"><b>The premise.</b> Cognitive skills follow "use it or lose it." When we offload arithmetic, memory, navigation, and reasoning to machines, the underlying circuits get less practice. This tool stress-tests exactly those skills so a decline would show up here before you'd notice it in daily life.</div>

    <h2>The battery — what each test measures</h2>
    <p>Each is a long-standing paradigm from cognitive psychology, chosen to cover the abilities most exposed to automation. Every test yields a 0–100 sub-score; the <b>Aristotle Index</b> is the average of every test in a sitting (ten in the current battery).</p>
    <div class="method-tests">${testCards}</div>

    <h2>How you compare to others</h2>
    <p>After each test we show a <b>percentile</b> — where your result sits among adults generally. Because everything runs locally and there's no pool of other users, this is computed against <b>published population norms</b>, never other people using the app.</p>
    <p>For each test we take a population <b>mean</b> and <b>spread</b> (standard deviation) for its raw metric, standardize your result against them, and read the percentile off the normal curve. “78th percentile” means you'd be expected to outperform about 78% of adults. A full session also gets an <b>overall percentile</b> — your per-test standings averaged in standardized units.</p>
    <div class="callout"><b>Take the percentile lightly.</b> Reaction time and digit span rest on solid published norms; the rest are approximate or rough in-app references (each test lists its source above). Percentiles assume a bell curve and a healthy-adult reference, so treat them as friendly context — not a clinical ranking. Your <em>own trend over time</em> is the number that actually matters.</div>

    <h2>Why the verdict is reliable</h2>
    <p>A single score is almost meaningless — you'll vary with sleep, caffeine, mood, and luck. Reliability comes from how the history is read:</p>
    <h3>1. A baseline, not a number</h3>
    <p>Once you have a few sessions, the app forms a <b>baseline</b> from your earlier results and compares your <b>most recent</b> sessions against it. We compare distributions, not single points.</p>
    <h3>2. Change measured in your own noise</h3>
    <p>The difference between recent and baseline is divided by the baseline's own standard deviation, giving a z-score (σ). This is a simplified <b>Reliable Change Index</b>: a 5-point drop means little if you normally swing 8 points, but a lot if you're usually steady within 2.</p>
    <table>
      <tr><th>Recent vs baseline</th><th>Verdict</th></tr>
      <tr><td>≥ +0.8σ</td><td>📈 Improving</td></tr>
      <tr><td>between −0.8σ and +0.8σ</td><td>🛡️ Holding steady — no reliable decline</td></tr>
      <tr><td>−0.8σ to −1.5σ</td><td>👀 Slight dip — likely noise, retest</td></tr>
      <tr><td>below −1.5σ</td><td>⚠️ Reliable decline</td></tr>
    </table>
    <h3>3. A measurement-noise floor</h3>
    <p>If your baseline is unusually tight, we floor its standard deviation at <code>4 points</code> so ordinary day-to-day variation can't masquerade as a real change.</p>
    <h3>4. Practice effects, handled</h3>
    <p>You <i>will</i> improve at these tasks the first few times simply from familiarity. So your very first full session is treated as calibration and dropped once enough data exists, and early gains are flagged as part practice. Genuine decline shows up as a downward break from an established plateau — which is what the baseline comparison detects.</p>
    <p class="muted"><i>Battery versions:</i> the battery expanded from six to ten tests in June 2026. Older sessions keep counting — a session's composite is simply the average of the tests it contains, and your baseline adapts within a few sessions. A full assessment also checkpoints after every test, so an interrupted run resumes instead of restarting.</p>

    <div class="callout"><b>For a trustworthy read:</b> do the full battery a handful of times across different days first (to build a baseline past the practice bump), then test regularly under similar conditions — same time of day, not exhausted, no interruptions. ${STABLE_MIN}+ full sessions are required before any verdict is shown.</div>

    <h2>Honest limitations</h2>
    <ul>
      <li>These are screening-style tasks, not a validated clinical battery. Treat the Index as a personal fitness number, like steps — useful as a <i>trend</i>, not a diagnosis.</li>
      <li>It can show <i>correlation</i> with your AI habits, never proof of <i>causation</i>. To experiment: change one habit, keep testing, watch the trend.</li>
      <li>Device, browser, and input method affect reaction-based scores. Compare like with like.</li>
      <li>It is not a medical instrument. If you're genuinely worried about your cognition, talk to a clinician.</li>
    </ul>

    <h2>Privacy</h2>
    <p>Everything runs in your browser. Your results are stored only in this device's <code>localStorage</code> — nothing is uploaded, there's no account, and there are no trackers. Back up or move your data with Export/Import in Settings. Clearing your browser data will erase your history.</p>
  `;
}

/* ============================================================
   SETTINGS
   ============================================================ */
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderSettings() {
  const body = document.getElementById("settings-body");
  clear(body);
  const settings = getSettings();
  const sessions = getSessions();

  // theme
  const themeSwitch = el("div", { class: "switch" });
  for (const t of ["dark", "light"]) {
    const b = el("button", { type: "button", class: settings.theme === t ? "on" : "", text: t[0].toUpperCase() + t.slice(1) });
    b.addEventListener("click", () => {
      applyTheme(t); setSetting("theme", t);
      for (const x of themeSwitch.children) x.classList.toggle("on", x.textContent.toLowerCase() === t);
    });
    themeSwitch.append(b);
  }

  // import input (hidden)
  const fileInput = el("input", { type: "file", accept: "application/json,.json", style: { display: "none" } });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0]; if (!file) return;
    try { const n = importJSON(await file.text()); toast(`Imported — ${n} session${n === 1 ? "" : "s"} total.`); renderSettings(); }
    catch (e) { toast(e.message || "Import failed."); }
    fileInput.value = "";
  });

  body.append(el("div", { class: "panel" }, [
    el("div", { class: "setting-row" }, [
      el("div", {}, [el("b", { text: "Appearance" }), el("div", { class: "desc", text: "Switch between dark and light." })]),
      themeSwitch,
    ]),
    el("div", { class: "setting-row" }, [
      el("div", {}, [el("b", { text: "Your data" }), el("div", { class: "desc", text: `${sessions.length} session(s) stored locally in this browser. Export to back up or move to another device.` })]),
      el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } }, [
        el("button", { class: "btn", type: "button", text: "⬇ Export", onClick: () => { downloadText(`digital-aristotle-${new Date().toISOString().slice(0, 10)}.json`, exportJSON()); toast("Exported."); } }),
        el("button", { class: "btn", type: "button", text: "⬆ Import", onClick: () => fileInput.click() }),
      ]),
    ]),
    el("div", { class: "setting-row" }, [
      el("div", {}, [el("b", { text: "Reset" }), el("div", { class: "desc", text: "Permanently delete all sessions on this device. This cannot be undone." })]),
      el("button", {
        class: "btn btn-danger", type: "button", text: "Delete all data",
        onClick: () => { if (confirm("Delete all your Digital Aristotle data on this device? This cannot be undone.")) { clearAll(); toast("All data deleted."); renderSettings(); } },
      }),
    ]),
    fileInput,
  ]));

  // session history with per-session delete (data hygiene: drop interrupted
  // or unrepresentative sessions so they don't pollute the trend)
  const hist = el("div", { class: "history" });
  const recent = [...sessions].reverse().slice(0, 25);
  if (!recent.length) {
    hist.append(el("p", { class: "muted", text: "No sessions yet — your history will appear here." }));
  }
  for (const s of recent) {
    const isFull = s.kind === "full";
    const ids = Object.keys(s.scores || {});
    const label = isFull
      ? `Aristotle Index ${Math.round(compositeForSession(s, ids) ?? 0)} · ${ids.length} tests`
      : ids.map((id) => `${byId[id]?.meta.icon || ""} ${byId[id]?.meta.name || id} — ${s.scores[id]}`).join(" · ");
    const del = el("button", { class: "btn btn-ghost btn-sm", type: "button", "aria-label": "Delete this session", text: "🗑" });
    del.addEventListener("click", () => {
      if (confirm("Delete this session? This cannot be undone.")) {
        deleteSessions([s.id]);
        toast("Session deleted.");
        renderSettings();
      }
    });
    hist.append(el("div", { class: "history-row" }, [
      el("span", { class: `hist-kind ${isFull ? "full" : "single"}`, text: isFull ? "FULL" : "SINGLE" }),
      el("div", { class: "hist-main" }, [
        el("b", { text: label }),
        el("div", { class: "muted hist-date", text: `${fmtDate(s.ts)} · ${fmtRelative(s.ts)}` }),
      ]),
      del,
    ]));
  }
  body.append(el("div", { class: "panel" }, [
    el("h2", { text: "History" }),
    el("p", { class: "muted", text: "Delete a session if it was interrupted or unrepresentative (sick, distracted, wrong device) — pruning bad data makes your trend more reliable." }),
    hist,
  ]));

  body.append(el("div", { class: "callout", html: "Tip: your history lives only in this browser. If you clear site data or switch devices, use <b>Export</b> first." }));
}

/* ============================================================
   INIT
   ============================================================ */
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

function init() {
  applyTheme(getSettings().theme);

  // delegated navigation for any [data-nav]
  document.body.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav) { e.preventDefault(); go(nav.dataset.nav); }
  });
  document.getElementById("start-full").addEventListener("click", () => startFullAssessment());
  const durEl = document.getElementById("full-duration");
  if (durEl) durEl.textContent = `· ~${minutesFor(META.map((m) => m.id))} min · resumable`;

  // redraw canvases on resize for the active data screens
  window.addEventListener("resize", debounce(() => {
    const active = document.querySelector(".screen.active");
    if (!active) return;
    if (active.id === "screen-home") renderHome();
    else if (active.id === "screen-trends" && trendsRedraw) trendsRedraw();
  }, 200));

  // redraw dial/charts if the tab becomes visible again
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const active = document.querySelector(".screen.active");
      if (active?.id === "screen-home") renderHome();
    }
  });

  go("home");
}

document.addEventListener("DOMContentLoaded", init);
