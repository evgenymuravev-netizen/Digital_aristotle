# KFS extraction pipeline

Turns UAE banks' **Key Facts Statements** (KFS) into the normalized credit-card
records the value engine consumes (`../data/schema.json`).

In the UAE the Central Bank (CBUAE) **Consumer Protection Regulation (2020)** and
the accompanying **Standards (2021)** require every bank to publish a KFS per
credit card, in a *semi-standardized* format disclosing the same core facts:
interest/profit rate (monthly + APR), annual fee and waivers, the non-AED (FX)
markup, cash-advance fee, late-payment fee (capped at **AED 230**), over-limit fee
(capped at **AED 273.50**), minimum payment %, minimum income, and the
rewards/cashback terms. That shared structure is what makes a single, generic
extractor feasible across ~50+ banks.

KFS are published as **PDFs** (e.g. FAB's consolidated multi-card PDF) and as
**HTML pages** (e.g. Emirates NBD's KFS page that links per-card documents). The
pipeline handles both, normalizes the result, and writes draft records for a human
to verify.

> **These outputs are DRAFTS.** Heuristic parsing of regulatory prose is
> best-effort; every record carries `source.confidence` and
> `source.provenance_notes` saying what was recovered vs defaulted. A
> human-verify step is required before any customer-facing use (see *Limitations*).

---

## Quick start — run it offline (the demo + tests)

This sandbox (and CI) **blocks outbound HTTPS to bank hosts**, so the pipeline runs
fully **offline against local fixtures** in `fixtures/`. Nothing here needs the
network or any third-party package — it is pure Python 3 standard library.

```bash
# 1) run the extractor over the bundled fixtures, write out/cards.extracted.json
python3 kfs/pipeline/run.py --offline

# 2) run the test suite (self-runner, prints PASS/FAIL; also pytest-compatible)
python3 kfs/pipeline/tests/test_pipeline.py
```

Expected: `run.py --offline` reports `ok` for `fab`, `enbd`, `liv` and writes 4
records; the test suite prints `24 passed, 0 failed`.

Other handy flags:

```bash
python3 kfs/pipeline/run.py --offline --bank enbd      # one bank
python3 kfs/pipeline/run.py --offline --limit 1        # first N banks with a URL
python3 kfs/pipeline/run.py --offline --json           # records to stdout
python3 kfs/pipeline/fetch.py fab --offline            # peek at a fixture
```

## Run it live (your own environment)

Where the bank hosts are reachable, drop `--offline` and the pipeline performs
polite real fetches (browser User-Agent, timeout, retry/backoff, on-disk cache in
`cache/`). For an HTML KFS that links out to per-card PDFs (e.g. Emirates NBD),
`run.py` also discovers those links, fetches each PDF, and runs the PDF extractor
over it — so a landing page expands into one record per linked card.

```bash
python3 kfs/pipeline/run.py                 # all banks with a known kfs_url
python3 kfs/pipeline/run.py --bank fab      # just FAB's consolidated PDF
```

PDF text extraction needs **one** of these (probed in order, all optional):
`pip install pdfplumber` · `pip install pypdf` · the poppler `pdftotext` CLI
(`apt-get install poppler-utils`). If none is present the PDF path raises a clear
error; the HTML path and the offline tests need nothing.

---

## Architecture

```
banks.json            registry of UAE banks -> kfs_url + which extractor handles it
fetch.py              polite fetcher (UA, timeout, retry, cache, --offline, robots)
normalize.py          pure parsers: parse_aed / parse_pct / map_category / coerce_record
extractors/
  base.py             BaseExtractor ABC + name->class registry
  generic_kfs.py      THE core heuristic label-driven KFS field/reward parser
  pdf_extractor.py    PDF bytes -> text (pdfplumber|pypdf|pdftotext) -> generic parser
  html_extractor.py   HTML -> visible text + KFS links (stdlib html.parser) -> generic
  fab.py              First Abu Dhabi Bank adapter  (consolidated PDF hints)
  enbd.py             Emirates NBD adapter          (HTML page + linked PDFs)
run.py                orchestrator CLI -> out/cards.extracted.json
fixtures/             offline KFS samples (fab_consolidated.txt, enbd_cashback.txt)
tests/test_pipeline.py  zero-dependency test suite
out/cards.extracted.json   generated drafts (schema-shaped)
```

**Two concerns are kept separate so each is testable:**

1. **Source shape** (PDF vs HTML) — `PdfKfsExtractor` / `HtmlKfsExtractor` only
   know how to get *plain text* (and, for HTML, the document links).
2. **Content parsing** (label → field) — `generic_kfs.parse_kfs_text` finds the
   fees and reward tiers in that text. It has no I/O and no PDF/HTML knowledge.

**Bank adapters are thin.** `fab.py` and `enbd.py` subclass the source extractor
and pass bank-specific *hints* (network, per-card naming, CBUAE-cap fallbacks) down
to the same generic parser — which is exactly what the standardized KFS format lets
us get away with. Adding a bank is usually: a `banks.json` row (+ optionally a
small adapter for an awkward layout).

### How `generic_kfs` works

- **Label proximity.** Each field has label patterns ("Annual Fee", "Profit
  Rate", "Foreign Currency Transaction Fee", …). Find the label, read the value on
  the same line — or the next non-empty line for table layouts where the label and
  value are separate cells — and run it through `parse_aed`/`parse_pct`. Fee/charge
  lines are excluded from reward mining so an FX "non-AED markup: 2.99%" is never
  misread as a 2.99% cashback tier.
- **Cashback line mining.** `"5% cashback on supermarket (up to AED 200/month)"` →
  a `groceries` tier at 5% capped at 200. Category words map to the canonical keys
  in `../data/categories.json` via a synonym table (`supermarket→groceries`,
  `school fees→education`, `DEWA→utilities`, `non-AED→international`, …). Short
  abbreviations (`du`, `car`, `dh`) match only on word boundaries to avoid hits
  inside `due`/`card`/`Dhabi`. `"minimum spend AED 3,000"` sets the earn-gate.
- **Confidence.** Derived from how many core fields (annual fee, interest, FX, min
  income, ≥1 tier) were actually recovered: `high` ≥4, `medium` ≥2, else `low`.

The result is a partial record handed to `normalize.coerce_record`, which fills the
schema's required structure, drops non-canonical/incomplete reward tiers, and
returns something safe to serialize.

---

## Data contracts (read these, don't reinvent)

- `../data/schema.json` — the record shape every extractor must produce.
- `../data/categories.json` — the canonical spend-category keys for reward tiers
  (`groceries, dining, fuel, education, utilities, telecom, transport, travel,
  online, entertainment, mobile_wallet, health, government, other`) plus the
  literal `international` for the non-AED bonus tier.
- `../data/cards.json` — hand-curated examples of the finished output shape.

`banks.json` carries a top-level `note`: the bank list **must be reconciled against
the official CBUAE register of licensed financial institutions before production**.
Well-known banks are `verified` with real URLs; long-tail/uncertain entries are
`to_verify` with `kfs_url: null` rather than invented URLs.

---

## Limitations (why a human-verify step is non-negotiable)

Heuristic extraction from regulatory prose is a **drafting aid, not an oracle**:

- **Consolidated multi-card PDFs** (FAB) flatten to one text blob. `split_cards()`
  chops it on card headers, but a missed boundary can merge two cards or attach a
  fee to the wrong one.
- **Table geometry is lost** once a PDF/HTML table becomes flat text; a number can
  bind to the wrong label. Per-bank adapters and `-layout` PDF extraction mitigate
  this but don't eliminate it.
- **"Up to X%" ranges** are captured as the headline `X`, which can overstate the
  rate a typical customer actually earns. Flagged in provenance.
- **Promotional vs standing terms** aren't distinguished — a limited-time 10% offer
  can read like a permanent tier.
- **Caps/min-spend** are only captured when stated near the rate; otherwise they're
  left `null` (honest) rather than guessed.
- **CBUAE-cap fallbacks** (late AED 230, over-limit AED 273.50) are applied by the
  bank adapters *only where the document yielded nothing*, and are labelled as
  defaults in provenance — verify against the actual KFS.

Because of all this, `out/cards.extracted.json` is a **review queue**: a human
confirms each record against the live KFS (and bumps `source.confidence`) before it
feeds anything customer-facing. The seed `../data/cards.json` is what such a
verified set looks like.

## Testing

Pure logic has a dependency-free suite that runs under plain `python3` (and pytest
if installed), mirroring `../engine/tests/`:

```bash
python3 kfs/pipeline/tests/test_pipeline.py     # PASS/FAIL self-runner
python3 -m pytest kfs/pipeline/tests/           # if pytest is available
```

It covers the `normalize` parsers, the FAB-fixture extraction (annual fee 300, min
income 5000, a 5% groceries tier capped at 200, min-spend 3000), the ENBD HTML
fixture (dining 5%, non-AED 1%, APR 48.07, fee 200, link harvest, script-noise
exclusion), and that `run.py --offline` produces ≥1 record whose shape matches the
schema's required fields. The suite is **offline-only** by design.
