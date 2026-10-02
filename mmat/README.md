# ⚡ Mental Agility Test (MMAT-style practice)

A self-contained, browser-based **Mental Agility Test** in the spirit of the
McQuaig Mental Agility Test (MMAT): a **free 5-minute taster** plus **ten timed
15-minute forms** of verbal, numerical and logical reasoning — with worked
answers, a skills dashboard, an adaptive weak-areas round, and a strategy guide.

Fully client-side — no build step, no dependencies, no network needed to run.
Results stay in the browser's `localStorage`.

> **Original content.** Every question and guide was written for this project.
> It is not affiliated with, endorsed by, or derived from The McQuaig Institute®;
> “McQuaig” and “MMAT” describe the *style* of test. For self-practice only.

## What's inside

- **Free 5-minute taster** — 12 mixed questions, no sign-up.
- **Ten full forms** — 25 harder questions in 15 minutes each (250 total), graded
  easy → hard, mixing synonyms, antonyms, analogies, odd-one-out, number series,
  arithmetic & word problems, percentages, ratios, letter series, syllogisms,
  logical deduction, coding, directions and blood relations.
- **Interleaving** — the engine reorders each form so **no two adjacent questions
  share a topic**, matching the gear-shifting feel of the real test.
- **Skills dashboard + adaptive round** — your results build a per-topic snapshot
  and a custom practice round from the topics you miss most.
- **Serverless paywall** — a free taster with the ten forms behind a one-time
  unlock; license-key validation runs client-side (Lemon Squeezy / Gumroad) with a
  demo mode for testing. See `STRATEGY.md`.
- **Strategy guide** (`guide.html`) — overall tactics plus step-by-step methods for
  every question type, structured for search + AI-answer visibility.

## Features (engine)

- 15-minute / 5-minute countdowns that warn, turn red, and **auto-submit** at zero.
- Question navigator with flags; **resume on refresh** (keeps answers + remaining time).
- Keyboard: `1`–`5` answer, `←/→` move, `F` flag.
- Results: banded score, per-category breakdown, full worked-answer review with filters.
- **Finish celebration** (confetti) + an **estimated percentile** vs. the average, with a bell-curve — modeled transparently, labelled as an estimate (not an official norm).
- **Speed × accuracy profile**: per-question timing (accumulated across revisits) → per-topic verdicts (Strength / Rushing / Too slow / Needs work) + recommendations.
- **Personalized test**: after 3 completed tests, a round built only from your weakest topics.
- **Google Sign-In**, **support tickets**, and **analytics** — all optional and config-gated in `config.js`.
- Best score per form saved on the device.

## Run it

Plain (non-module) scripts, so you can open `index.html` directly — or serve the site:

```bash
python3 -m http.server 8000     # from the repo root
# then visit http://localhost:8000/mmat/
```

## Project layout

```
mmat/
  index.html        # app shell (home, exam, results, paywall) + structured data
  guide.html        # strategy guide (original) with Article/FAQ/Breadcrumb schema
  styles.css        # theming + components
  app.js            # engine: timer, interleaving, gating, dashboard, adaptive round, unlock
  questions.js      # free taster + 10 forms (window.MMAT) — all original items
  config.js         # merchant/paywall + Google/support/analytics config — edit this
  robots.txt        # allows AI retrieval crawlers (edit domain)
  sitemap.xml       # edit YOURDOMAIN before use
  llms.txt          # minimal AI hint file
  STRATEGY.md       # pricing, paywall wiring, domain, deployment, AI-search plan
  PRELAUNCH.md      # pre-launch checklist (payments, legal, analytics, support…)
  validate.mjs      # structural checks for the question bank
  check-answers.mjs # independent re-computation of every numerical key
  test-engine.mjs   # end-to-end engine test via a tiny DOM shim
```

## Tests (pure Node, no dependencies)

```bash
node mmat/validate.mjs        # schema / answer-index / duplicate-option checks
node mmat/check-answers.mjs   # recompute all 94 numerical answers independently
node mmat/test-engine.mjs     # boot the real engine: grading, interleaving, paywall, adaptive round
```

## Going live

Set your price/checkout/provider in `config.js`, deploy `mmat/` as the site root,
point a domain at it, and fill in the real URL in `robots.txt`, `sitemap.xml` and
the `canonical`/`og:` tags. Full playbook (pricing, paywall, domain, AI-search) is
in **`STRATEGY.md`**.

## Editing questions

Each item in `questions.js`:

```js
{ cat: "verbal", topic: "Synonyms", diff: 2,
  prompt: "…", options: ["…","…","…"], answer: 0, explain: "…" }
```

`cat` is `verbal | numerical | logical`; `topic` drives interleaving + weak-area
analysis; `diff` is 1–3. Change `config.durationSec` / `freeDurationSec` for the
timers. Re-run the three checks above after any edit.
