# AI Efficiency Test

Measures **how efficiently a person actually works with AI in their role** — not
what they know about AI, and not how good they are at the job itself.

Live: `/ai-efficiency/` · Roles: Product Manager, System Analyst, Project Manager.

## The design decision that shapes everything

**The scale is two-sided. "More AI" is not the answer.**

Most AI quizzes reward enthusiasm, so everyone scores well by picking the most
AI-forward option. This one punishes both failure modes:

- doing by hand what a machine does well costs you **time**;
- trusting output that needed checking costs you **something worse**.

Top marks go to matching the tool to the task — including the tasks where the
right answer is *not to use it*. Every question therefore contains an
under-use trap **and** an over-delegation trap, and the content validator fails
the build if either is missing, or if the best answer is not the balanced one.

## What comes out

1. **Score 0–100**, *chance-corrected*. Raw scoring gives ~54/100 for random
   answers, which would make a coin flip look competent — so the reported score
   is the share of the distance from random guessing to perfect. 0 means
   "indistinguishable from guessing". The raw score and the chance baseline are
   both kept in the result object for transparency.
2. **Calibration axis** — Under-user ↔ Balanced ↔ Over-truster. Deliberately
   *separate* from the score, because two people can score identically and need
   opposite advice.
3. **Six dimensions**: delegation judgment, context & framing, verification,
   iteration economics, risk & confidentiality, workflow leverage.
4. **Per-scenario review** — what you chose, why it costs you, and the
   strongest answer with its reasoning. This is where the teaching happens.

Scoring curve (measured, PM track): 50% best answers → 34 · 70% → 61 ·
80% → 73 · 90% → 86 · 100% → 100.

## Content model

32 scenarios: 8 shared core + 8 per role. Each test is 16 items, ~12 minutes.

```js
{ id: "C1", block: "core", dim: "verification",
  prompt: { en, ru },
  options: [{ id, text:{en,ru}, s:{ verification:2, risk:1 }, lean:0, why:{en,ru} }] }
```

- `s` — per-dimension points (−2…2). The best option is the one with the
  highest total **and** must be the maximum on every dimension it touches,
  otherwise "best answer everywhere" wouldn't produce 100% on the bars.
- `lean` — −1 under-use, 0 balanced, +1 over-delegation. Feeds the calibration
  axis only, never the score.
- `why` — shown in the review, for the chosen option and the best one.

The traps are written to be *plausible*, not silly. The most common wrong answer
in C1, for example, is "ask the AI to add sources" — which feels like
verification and is not, because a model that invents a figure will invent a
citation for it.

## Files

| File | Purpose |
|------|---------|
| `roles.js` | dimensions, roles, score/calibration bands (`window.AIE_MODEL`) |
| `questions.js` | the 32 scenarios (`window.AIE_QUESTIONS`) |
| `engine.js` | scoring, chance correction, content validator (`window.AIE_ENGINE`) |
| `app.js` | runner + results screen |
| `nav.js` | shared mobile nav (collapses menus of 4+ items) |
| `styles.css` | Alethia theme + this app's components |

Fully static: classic `<script>` tags, no build step, works over `file://`.
Everything is scored in the browser; nothing is uploaded or stored.

## Checks

```sh
node test-engine.mjs   # 70 assertions: content validity, scoring invariants,
                       # chance correction, calibration, skips, bilingual copy
```

Plus a Chromium walk (18 assertions) covering a full 16-scenario run at 390×844
and 1280×900: option tap targets, no horizontal overflow, results rendering,
review expansion, RU switch, and zero uncaught page errors.

## Honest limits

- Thresholds are **judgement-based, not norm-referenced**. Nobody has measured a
  population of PMs on this yet, so the bands say "this looks like X", not "you
  are in the Nth percentile".
- A scenario test measures **stated judgement**, not observed behaviour. People
  choose more carefully in a test than at 5pm on a Thursday.
- The content reflects what AI tools can and cannot do **as of writing**. The
  delegation boundary moves; this bank needs revisiting as it does.

## Adding a role

Add an entry to `AIE_MODEL.roles`, then 8 scenarios with `block: "<roleId>"`.
`test-engine.mjs` will fail until every dimension has at least two
discriminating items for that role, so the bars can't be built on one question.
