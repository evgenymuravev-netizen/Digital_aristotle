# 🦉 Digital Aristotle

**A web app that reliably tests whether AI is making you dumber.**

Offloading thinking to machines is convenient — but cognition follows *use it or
lose it*. Digital Aristotle measures the mental skills that AI tends to atrophy
(working memory, attention, processing speed, numeracy, short-term memory and
fluid reasoning), tracks them over time, and uses simple statistics to tell you
**reliably** whether your performance is holding steady, improving, or declining.

> **▶ Live app:** https://mypabbeb-star.github.io/digital-aristotle/

It is fully client-side, works offline, stores everything in your browser, and
has **zero dependencies** and **no build step**.

---

## The battery

Ten standard paradigms from cognitive psychology, each producing a 0–100 sub-score:

| Test | Domain | Measures |
| --- | --- | --- |
| ⚡ **Reaction Time** | Processing speed | Simple reaction time (median of 7 trials, anticipations rejected) |
| 🔣 **Symbol Coding** | Coding speed | SDMT-style symbol→digit substitution against the clock |
| 🧠 **N-Back (2-back)** | Working memory | Holding & updating a moving window; balanced accuracy + d′ |
| 🧊 **Corsi Blocks** | Spatial memory | Adaptive visuospatial span — digit span's visual twin |
| 🎯 **Stroop** | Attention & inhibition | Naming ink colour while suppressing the word (12/12 design) |
| 🚦 **Go / No-Go** | Impulse control | Respond fast to GO, withhold on NO-GO |
| 🔢 **Digit Span** | Memory | Adaptive recall — **forward and backward** halves |
| 🔀 **Task Switching** | Mental flexibility | Letter/number rule switches; measures your switch cost |
| ➗ **Mental Math** | Numeracy | 60-second no-calculator arithmetic sprint |
| 🧩 **Number Series** | Fluid reasoning | Inferring a hidden rule; difficulty-weighted scoring |

The **Aristotle Index** is the average of every test in one sitting.

What makes a session friendlier and the score sharper:

- **See how you compare.** Every result shows a **percentile** against published
  population norms (e.g. *"faster than ~78% of people"*), with the reference and
  source for each test on the Method tab. A full session also gets an **overall
  percentile**. Norms only — your data never leaves the device.
- **Resume, and never lose work.** Every finished test is **checkpointed**
  immediately, so stopping a full assessment midway keeps what you did. Starting it
  again offers to **reuse anything from the last hour** and only run what's left,
  then combines it into one composite.
- **Manage your history.** Settings lists every session with a per-session delete,
  so you can prune an interrupted or unrepresentative run from your trend.

## Why the verdict is *reliable*

A single score is noise. Reliability comes from how the history is read:

1. **Baseline, not a number.** Recent sessions are compared against a baseline
   built from your earlier ones — distributions, not single points.
2. **Change measured in your own noise.** The recent-vs-baseline difference is
   expressed in standard deviations (σ) — a simplified **Reliable Change Index**.
   A 5-point dip means nothing if you usually swing 8; a lot if you're steady within 2.
3. **A measurement-noise floor** keeps ordinary day-to-day variation from
   triggering false alarms.
4. **Practice effects handled.** Your first session is treated as calibration;
   early gains are flagged as part practice. Genuine decline shows up as a
   downward break from an established plateau.

| Recent vs baseline | Verdict |
| --- | --- |
| ≥ +0.8σ | 📈 Improving |
| −0.8σ … +0.8σ | 🛡️ Holding steady — no reliable decline |
| −0.8σ … −1.5σ | 👀 Slight dip — likely noise, retest |
| < −1.5σ | ⚠️ Reliable decline |

At least **3 full assessments** (ideally on different days) are required before
any verdict is shown. See the in-app **Method** tab for the full write-up.

## Privacy

Everything runs locally. Results live only in your browser's `localStorage` —
no account, no upload, no trackers. Export/import your data anytime from Settings.

> Not a medical or clinical instrument. Treat the Index like a step count:
> useful as a trend, not a diagnosis.

---

## Run it locally

Because it uses ES modules, open it through a tiny static server (not `file://`):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project layout

```
index.html          # shell & screens
styles.css          # theming (dark/light) + components
js/
  app.js            # router, home, results, trends, settings
  storage.js        # versioned localStorage + export/import
  stats.js          # baseline / reliable-change verdict engine + resume planning
  norms.js          # per-test explainers + population norms, percentiles, probit
  chart.js          # dependency-free canvas charts + radial dial
  ui.js             # DOM & test-flow helpers
  tests/            # ten test modules + registry
test/run.mjs        # unit tests for the pure logic (norms, stats, scoring)
.github/workflows/deploy.yml   # builds & deploys to GitHub Pages
```

## Tests

Pure logic (percentile math, resume planning, the verdict engine) has a
dependency-free unit suite that runs under plain Node:

```bash
node test/run.mjs
```

## Deploy your own copy

The whole site is static files at the repo root, so either route works:

**A. GitHub Actions (zero config).** Push this repo to a **public** GitHub repo.
The included `.github/workflows/deploy.yml` self-enables Pages (via
`actions/configure-pages`) and publishes on every push to `main`.

**B. Deploy from a branch (no workflow needed).** In a public repo, go to
**Settings → Pages → Build and deployment → Source: Deploy from a branch**,
pick `main` and `/ (root)`. Done — `index.html` is served directly.

```bash
# starting from the unzipped folder:
git init -b main
git add -A
git commit -m "Digital Aristotle"
git remote add origin https://github.com/<you>/digital-aristotle.git
git push -u origin main
```

> GitHub Pages on a **private** repo requires a paid plan; on the free plan use a
> **public** repo.
