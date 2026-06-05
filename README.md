# 🦉 Digital Aristotle

**A web app that reliably tests whether AI is making you dumber.**

Offloading thinking to machines is convenient — but cognition follows *use it or
lose it*. Digital Aristotle measures the mental skills that AI tends to atrophy
(working memory, attention, processing speed, numeracy, short-term memory and
fluid reasoning), tracks them over time, and uses simple statistics to tell you
**reliably** whether your performance is holding steady, improving, or declining.

> **▶ Live app:** https://evgenymuravev-netizen.github.io/digital-aristotle/

It is fully client-side, works offline, stores everything in your browser, and
has **zero dependencies** and **no build step**.

---

## The battery

Six standard paradigms from cognitive psychology, each producing a 0–100 sub-score:

| Test | Domain | Measures |
| --- | --- | --- |
| ⚡ **Reaction Time** | Processing speed | Simple reaction time (median of 5 trials) |
| 🧠 **N-Back (2-back)** | Working memory | Holding & updating a moving window of info; scored by balanced accuracy |
| 🔢 **Digit Span** | Short-term memory | Adaptive recall of ever-longer digit strings |
| 🎯 **Stroop** | Attention & inhibition | Naming ink colour while suppressing the word |
| ➗ **Mental Math** | Numeracy | 60-second no-calculator arithmetic sprint |
| 🧩 **Number Series** | Fluid reasoning | Inferring a hidden rule to complete a sequence |

The **Aristotle Index** is the average of all six from one sitting.

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
  stats.js          # baseline / reliable-change verdict engine
  chart.js          # dependency-free canvas charts + radial dial
  ui.js             # DOM & test-flow helpers
  tests/            # one module per test (+ registry)
.github/workflows/deploy.yml   # builds & deploys to GitHub Pages
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
