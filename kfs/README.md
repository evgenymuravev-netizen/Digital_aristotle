# 🧮 UAE Card Intelligence — the Key Facts Engine

**A parser + a universal comparison algorithm that reads the Key Facts Statement
of every UAE credit card and tells a given customer which one is actually best
for _them_ — and how much it's worth in AED/year.**

> **The thesis in one line:** there is no globally "best" credit card. Value is a
> function of behaviour — `V = V(card | profile)` — so the only honest answer is a
> *per-customer* ranking. The card that's #1 for a grocery-heavy family is mid-table
> for a frequent traveller and **actively harmful** for someone who carries a balance.

This folder is a self-contained build that does four things the brief asked for:

| # | Ask | Where |
| - | --- | ----- |
| 1 | **Parse all the Key Facts Statements** (61 banks, all cards + cashback programs) | [`pipeline/`](pipeline/) — extraction framework (PDF + HTML + generic KFS heuristics), a [bank registry](pipeline/banks.json), offline fixtures and tests |
| 2 | **A universal algorithm to compare cards across many parameters** | [`engine/value_engine.py`](engine/value_engine.py) + [`docs/algorithm.md`](docs/algorithm.md) — net-value scoring, eligibility, a 5-axis scorecard, robustness |
| 3 | **Best card for which profile / best value for money** | [`data/profiles.json`](data/profiles.json) + the engine's per-profile ranking, explorable in the [web demo](web/) |
| 4 | **Aggregator accuracy + Perfios hyper-personalisation** | [`docs/aggregators.md`](docs/aggregators.md), [`docs/perfios-hyperpersonalization.md`](docs/perfios-hyperpersonalization.md) |

---

## Try it in 30 seconds

```bash
# 1) the algorithm, every profile, as a report (pure stdlib, no deps)
python3 kfs/engine/value_engine.py

# 2) one profile, as JSON
python3 kfs/engine/value_engine.py --profile revolver-carries-balance --json

# 3) the tests (engine logic + JS/Python parity)
python3 kfs/engine/tests/test_value_engine.py
node    kfs/web/engine.test.mjs

# 4) the interactive demo — pick a profile, tune the spend, watch the ranking move
#    (serve from the repo root so ../data resolves; GitHub Pages serves it directly)
python3 -m http.server 8000        # then open http://localhost:8000/kfs/web/

# 5) the extraction pipeline, offline against fixtures (live run needs the bank sites)
python3 kfs/pipeline/run.py --offline
```

A taste of the output — same algorithm, different people, opposite answers:

```
PROFILE: Family — Groceries & School Fees
  1. ADIB Cashback Visa Card        net AED 4,077/yr  (4% on groceries/fuel/school/dining)
PROFILE: Digital Native — Online & Mobile Wallet
  1. Standard Chartered X           net AED 2,029/yr  (10% on mobile-wallet taps)
PROFILE: Revolver — Carries a Balance
  ! interest dominates — every card is net-NEGATIVE; the real advice is "stop revolving"
  1. ADIB Cashback Visa Card        net AED -2,218/yr
```

---

## How it fits together

```
kfs/
├── data/                      # the contract + the inputs
│   ├── schema.json            #   normalized card record (what every extractor emits)
│   ├── categories.json        #   canonical UAE spend-category taxonomy (the shared vocabulary)
│   ├── cards.json             #   seed dataset: real UAE cards, each with provenance + confidence
│   └── profiles.json          #   archetypal cardholder profiles (spend vector + behaviour)
│
├── engine/                    # the universal comparison algorithm (the core IP)
│   ├── value_engine.py        #   V(card|profile) = rewards + benefits − costs; ranking; scorecard; robustness
│   └── tests/                 #   14 zero-dependency unit tests
│
├── pipeline/                  # the KFS parser / ETL  ──►  data/cards.json shape
│   ├── banks.json             #   registry of UAE banks + their KFS URLs + which extractor handles them
│   ├── fetch.py               #   polite fetcher (UA, retry, cache, --offline mode)
│   ├── extractors/            #   base · pdf · html · generic_kfs (heuristic) · fab · enbd adapters
│   ├── normalize.py           #   "AED 1,000" → 1000.0, "3.25% p.m." → 3.25, category mapping
│   ├── run.py                 #   orchestrator CLI
│   ├── fixtures/              #   sample KFS text so the pipeline runs/test offline
│   └── tests/
│
├── web/                       # interactive demo (dependency-free, GitHub-Pages-ready)
│   ├── index.html · styles.css
│   ├── engine.js              #   1:1 browser port of value_engine.py (parity-tested)
│   └── app.js                 #   profile editor + ranking + canvas radar
│
└── docs/
    ├── algorithm.md           #   the comparison algorithm, formally specified, with worked examples
    ├── aggregators.md         #   creditcardfinder.ae & yallacompare: coverage, bias, accuracy methodology
    └── perfios-hyperpersonalization.md   # turning real statements into real profiles
```

**The pipeline produces what the engine consumes.** `data/schema.json` is the single
contract between them; the web demo and the Python engine share the exact same logic
(enforced by [`web/engine.test.mjs`](web/engine.test.mjs), which asserts identical
net-value figures).

---

## The algorithm, briefly

For each `(card, profile)` pair the engine computes an **annual net value in AED**:

```
V = annual_rewards + benefits_value − annual_costs

annual_rewards  per-category cashback rate × spend, honouring per-category caps,
                an overall monthly cap, a minimum-spend gate, whole-card spend-tier
                bands (e.g. CBD Super Saver 3/5/10%), and a non-AED bonus split.
                Points/miles are converted to an effective cashback % via value_per_point.
benefits_value  lounges, travel insurance, BOGO — monetised by ACTUAL usage from the
                profile (a lounge you never visit is worth zero).
annual_costs    annual fee (after waiver logic) + FX markup on foreign spend
                + interest = carried_balance × APR  — but ONLY if the profile revolves.
```

Eligible cards are ranked by `V`. On top of the money ranking, a **normalised 0–100
scorecard across five axes** (value · low-cost · simplicity · flexibility · perks)
powers the radar so you can see *trade-offs*, not just a single number. A
**robustness** pass re-ranks under spend perturbations and flags winners that only
win under one exact spending assumption. Full spec + worked examples in
[`docs/algorithm.md`](docs/algorithm.md).

The single most important switch is `revolves`. For a transactor, cashback rules. For
a revolver, ~40% APR dwarfs any cashback and the ranking correctly collapses to
"cheapest to borrow" — and the engine says so out loud instead of pretending a 5%
cashback card is a good idea while you pay 40% interest.

---

## Coverage: from these cards to all 61 banks

The CBUAE licenses ~60 banks (≈20 national + foreign + digital), and its **Consumer
Protection Regulation (2020) + Standards (2021)** require every bank to publish a
**Key Facts Statement** per card in a semi-standardised format (interest/profit rate +
APR, fees, FX markup, caps, min income, rewards). *That standardisation is exactly
what makes a generic parser feasible.*

- [`pipeline/banks.json`](pipeline/banks.json) is the registry to expand — each bank
  maps to its KFS URL, source type (PDF/HTML), and an extractor. Two are wired with
  concrete adapters (FAB consolidated PDF, Emirates NBD HTML); the rest fall back to
  the heuristic `generic_kfs` extractor and are flagged `to_verify`.
- **This sandbox blocks outbound traffic to bank sites**, so the live crawl runs in
  *your* environment. The pipeline therefore ships with offline fixtures and runs/tests
  end-to-end with `--offline`. See [`pipeline/README.md`](pipeline/README.md).
- The seed [`data/cards.json`](data/cards.json) (~17 real cards across FAB, ENBD, ADCB,
  Mashreq, ADIB, RAKBANK, HSBC, Citi, Standard Chartered, CBD, DIB, Emirates Islamic,
  Liv) was curated from bank pages + KFS + aggregator cross-checks so the engine has
  real data to run on today, with **per-record `confidence` and `provenance_notes`**.

---

## Data provenance & honesty

Reward **rates, caps, and min-income** are card-specific where `confidence` is
`high`/`medium`. Some **fee fields** (FX markup, cash-advance, APR where not separately
sourced) are UAE-typical or **CBUAE regulatory caps** (late fee AED 230, over-limit
AED 273.50) and flagged as such. Aggregators (creditcardfinder.ae, yallacompare) are
treated as **discovery/coverage** sources, not ground truth — the **KFS is the source
of truth for values** (see [`docs/aggregators.md`](docs/aggregators.md)).

> ⚠️ Educational tool, **not financial advice**. Net-value figures are model estimates
> under documented assumptions. **Always re-verify against the live KFS before acting.**
> Card terms change; re-run the pipeline.

---

## Why this generalises

The same `V()` function ranks *any* card set for *any* profile. Hand-built archetypes
prove the mechanism; [`docs/perfios-hyperpersonalization.md`](docs/perfios-hyperpersonalization.md)
shows how a customer's real bank-statement data (via Perfios) becomes a *real* profile —
including the revolver signal that aggregators can't see — so "best card for you" stops
being a listicle and becomes a calculation.
