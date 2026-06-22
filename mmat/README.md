# ⚡ Mental Agility Test (MMAT-style)

A self-contained, browser-based **Mental Agility Test** in the spirit of the
McQuaig Mental Agility Test (MMAT): ten independent **forms**, each a fresh
**15-minute** sprint of verbal, numerical and logical reasoning.

It is fully client-side — no build step, no dependencies, no network — and
results stay in your browser's `localStorage`.

> **Original content.** Every question was written for this project. This tool
> is not affiliated with, endorsed by, or derived from The McQuaig Institute®;
> “McQuaig” and “MMAT” are used only to describe the style of test. It is for
> self-practice and is **not** a clinical or hiring instrument.

## What's here

| Form | Questions | Time | Mix (Verbal / Numerical / Logical) |
| --- | --- | --- | --- |
| Test 1 – Test 10 | 25 each (250 total) | 15:00 each | 10 / 9 / 6 |

Item types: synonyms, antonyms, verbal analogies, odd-one-out, number series,
arithmetic & word problems, letter series, syllogisms / deductions and
number classification — graded **easy → hard** within each form.

## Features

- **15-minute countdown** per form that starts on *Start*, warns under 2:00,
  turns red under 1:00, and **auto-submits** at zero.
- **Question navigator** — jump to any item, see answered/flagged at a glance,
  and flag items for review.
- **Resume on refresh** — closing or reloading the tab keeps your answers and
  the *time that remains*; an expired form is graded automatically.
- **Keyboard:** `1`–`5` to answer, `←` / `→` to move, `F` to flag.
- **Results** — overall score, a banded interpretation, a per-category
  breakdown and a full worked-answer **review** with filters.
- **Best score per form** is remembered on the device.

## Run it

It uses plain (non-module) scripts, so you can simply open `index.html` in a
browser — or serve it with the rest of the site:

```bash
python3 -m http.server 8000      # from the repo root
# then visit http://localhost:8000/mmat/
```

## Project layout

```
mmat/
  index.html        # shell & screens
  styles.css        # theming (matches Digital Aristotle) + components
  app.js            # engine: timer, navigation, grading, review, resume
  questions.js      # the 10 forms (window.MMAT) — all original items
  validate.mjs      # structural checks for the question bank
  check-answers.mjs # independent re-computation of every numerical key
  test-engine.mjs   # end-to-end grading test via a tiny DOM shim
```

## Tests

Pure Node, no dependencies:

```bash
node mmat/validate.mjs        # schema / answer-index / duplicate-option checks
node mmat/check-answers.mjs   # recompute every numerical answer independently
node mmat/test-engine.mjs     # boot the real engine, answer a form, check the score
```

## Adding or editing questions

Each form lives in `questions.js` under `window.MMAT.tests`. A question is:

```js
{
  cat: "verbal",            // "verbal" | "numerical" | "logical"
  topic: "Synonym",         // shown as a chip
  prompt: "…",              // may contain inline HTML
  options: ["…", "…", "…"], // 3–5 choices
  answer: 0,                // index of the correct option
  explain: "…"              // one-line worked answer shown in review
}
```

Change `window.MMAT.config.durationSec` to adjust the per-form time limit
(default `900` = 15 minutes). After any edit, run the three checks above.
