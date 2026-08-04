# Leveraging Perfios Hyperpersonalization

*A solution-architecture note on connecting our value engine (the **supply** side — a normalized card catalogue and the value function `V`) to Perfios's Hyperpersonalization product (the **demand** side — a customer's real, categorized financial behaviour). Together they turn "what is the best card?" into "what is the best card **for you**, with the numbers and the why."*

> **Method note.** Vendor sites are not directly fetchable in this environment, so Perfios capabilities below are drawn from web-search result snippets and product/marketing copy and are marked **[confirmed]** (corroborated by a search result) or **[inferred]** (a reasoned architectural conclusion). API field names and the exact contract are illustrative until validated against Perfios's integration documentation.

---

## 1. The core insight: two halves of one machine

Our engine already does something most "best card" products cannot: it computes `V(card | profile)` — the true net annual value of a card to a *specific* person — honouring caps, gates, spend-tier bands, FX, eligibility and, decisively, **revolver interest** (see `algorithm.md`). But it has one dependency it cannot satisfy by itself:

**It needs a real `profile`.**

Today our `profiles.json` are **hand-built archetypes** — "Family — Groceries & School Fees," "Revolver — Carries a Balance." They are excellent for demonstrating the engine and for letting a user tune sliders, but they are *fictional*. The engine's output is only as real as the profile fed into it, and a hand-built archetype is, at best, the customer's *guess* about their own spending — and people are notoriously wrong about how much they spend on dining, how much of their spend is foreign, and above all **whether they revolve a balance**.

This is exactly the gap Perfios fills.

- **Our engine = SUPPLY.** A normalized, KFS-grounded card catalogue + `V()`. Given a profile, it produces the correct, attributed, robustness-checked ranking.
- **Perfios = DEMAND.** Perfios ingests a customer's actual bank statements / transaction history (via upload, internet banking, or account-aggregator rails) and emits a categorized, analysed financial picture: a **categorized monthly spend vector**, **monthly income**, **obligations/affordability**, and crucially **behavioural signals** — including repayment behaviour. Perfios describes itself as building a **360° customer profile** over a multi-year data lake, doing **customer spend profiling**, and even running a **personalized credit-card recommendation engine** to drive activation and reduce abandonment. **[confirmed]**

Perfios produces, from real data, **exactly the inputs our `profiles` schema is defined in terms of.** Plug Perfios's output into our engine's input and the archetypes become **real, per-customer profiles** — and the recommendation stops being "best card for a person like you" and becomes "best card for *you*, given your actual September–February statements."

Company context (so the dependency is on a serious vendor): Perfios began in 2008 as a personal-finance-management/account-aggregation company, was doing AA-style aggregation before India's RBI formalised the framework, is a financial-data-analytics unicorn (~$435M+ raised, IPO-track), and has an expanding footprint across the **Middle East / UAE** and Southeast Asia. **[confirmed]** Bank-statement analysis is a core product: it extracts and categorizes transactions and returns structured **JSON/Excel** with fraud/manipulation checks. **[confirmed]**

---

## 2. Field-mapping: Perfios output → our profile schema

Our profile contract (from `profiles.json` / the engine's `evaluate_card` inputs):

```jsonc
{
  "monthly_income_aed": 28000,
  "monthly_spend_by_category": { "groceries": 3500, "education": 3000, "...": 0 },
  "international_share": 0.05,
  "behavior": {
    "revolves": false,
    "revolving_balance_aed": 0,
    "lounge_visits_per_year": 1,
    "values_travel_insurance": false
  },
  "preferences": { "islamic_only": false }
}
```

The mapping from Perfios analytics to those fields:

| Perfios output (statement / AA analytics) | → Our profile field | Notes & derivation |
| --- | --- | --- |
| Categorized debit transactions, aggregated monthly by MCC/merchant | `monthly_spend_by_category` | Map Perfios categories → our `categories.json` keys (groceries, dining, fuel, education, utilities, telecom, transport, travel, online, entertainment, health, …). A merchant/MCC crosswalk is the main integration artifact. **[inferred mapping; categorization is confirmed]** |
| Recurring salary credits / income identification | `monthly_income_aed` | Perfios income/affordability assessment identifies regular salary inflows. Drives **eligibility** filtering directly. **[confirmed capability]** |
| Foreign-currency / cross-border transaction share | `international_share` | Fraction of total spend that is non-AED (FX-marked txns). Feeds the FX-cost term and the international reward split. **[inferred from txn-level data]** |
| **Repayment behaviour**: full-payment vs. minimum/partial payment, revolving-balance trend, interest charges seen on inflows/outflows | `behavior.revolves`, `behavior.revolving_balance_aed` | **The single most valuable field.** Detectable from statements (does the customer clear the statement, or carry a balance and incur finance charges?). Invisible to aggregators; this flips the entire ranking (see §6 and `algorithm.md` §4). **[inferred from statement analysis; behavioural profiling is confirmed]** |
| Existing obligations / EMIs / DBR (debt-burden ratio), affordability | (gates eligibility; future `affordability` term) | Used for **pre-eligibility & affordability** (§4d) and to avoid recommending a card whose spend the customer can't sustain. **[confirmed capability]** |
| Travel/airline/lounge & hotel spend signals, trip frequency | `behavior.lounge_visits_per_year`, `behavior.values_travel_insurance` | Travel-merchant frequency proxies how much a lounge/insurance perk is actually worth to this person — the input that makes `benefits_value` real instead of brochure-value. **[inferred from txn categories]** |
| Account-aggregator multi-account view (all banks, not one) | improves *every* field above | A single bank's statement under-counts; AA/Open-Finance consolidation gives the *true* total spend, income and revolving picture across all the customer's accounts. **[confirmed capability]** |
| Stated/derived product preferences (e.g. Sharia-compliant banking pattern) | `preferences.islamic_only` | Can be inferred (Islamic-bank relationships) or captured explicitly at consent. **[inferred]** |

The key point: **this is a near-1:1 mapping.** Our schema was designed around the variables that determine card value; Perfios produces those same variables from ground-truth data. There is no impedance mismatch — only a category crosswalk and a behavioural-signal extraction to agree on.

---

## 3. Integration architecture

The two systems compose as a clean pipeline: Perfios converts **statements → a structured profile**; our engine converts **profile + live catalogue → a ranked, eligibility-filtered, fully-explained recommendation**. The customer's data is touched only under explicit, revocable consent on CBUAE Open Finance rails.

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer
    participant App as Our App / Bank Channel
    participant OF as CBUAE Open Finance / Account Aggregator
    participant Perf as Perfios Hyperpersonalization
    participant Eng as Value Engine V(card | profile)
    participant Cat as KFS-Normalized Card Catalogue

    Cust->>App: "Find my best card"
    App->>OF: Request consent (scoped, time-boxed)
    OF-->>Cust: Consent screen (which data, which purpose, how long)
    Cust->>OF: Grant explicit consent
    OF-->>Perf: Authorized access to account/transaction data
    Perf->>Perf: Ingest & categorize statements; identify income;<br/>compute FX share; detect repayment behaviour (revolver?)
    Perf-->>App: Structured profile (spend vector, income,<br/>international_share, behavior.revolves, travel signals)
    App->>Eng: profile + Params
    Eng->>Cat: Load live card catalogue (rates, caps, gates, fees, APR)
    Eng->>Eng: Eligibility filter -> evaluate_card per card -><br/>rank by net AED value -> scorecard -> robustness
    Eng-->>App: Ranked recommendation + net-value math + "why" + flags
    App-->>Cust: "Best card for YOU: AED X/yr, here's the breakdown"
    Note over Cust,Cat: Consent is revocable; post-issue spend later<br/>refines both the profile and catalogue value estimates
```

**Architectural notes**

- **Perfios owns ingestion + understanding; we own valuation + ranking.** Clean separation of concerns: Perfios is the *sensor* that reads the customer; our engine is the *optimizer* that matches them to the catalogue. Neither reaches into the other's domain.
- **The contract is the `profile` object.** Perfios's emitted structured profile is the integration boundary — the same shape `profiles.json` already defines. The engine doesn't know or care whether a profile came from a slider or from Perfios; that is exactly the generality argued in `algorithm.md` §8 ("everything that varies is data, not code").
- **The catalogue stays KFS-grounded.** Per `aggregators.md`, values come from the KFS, not marketing copy. Perfios makes the *demand* side real; the KFS keeps the *supply* side honest. Both halves must be ground-truth for the output to be trustworthy.
- **Eligibility is enforced engine-side** using Perfios-derived income (and affordability), so the customer only ever sees cards they can actually get and sustain.

---

## 4. Use cases

**(a) In-app "best card for you" — with real numbers.**
Instead of "5% cashback!", show: *"Based on your actual spend, the ADIB Cashback Visa is worth **AED 4,077/yr** to you — AED 1,680 from groceries, AED 1,440 from school fees, minus AED 99 fee and AED 192 FX."* The math is the engine's `Evaluation` receipt; the spend vector is Perfios's. This is Perfios's stated *personalized credit-card recommendation* use case **[confirmed]**, upgraded with our explainable net-value engine.

**(b) Acquisition / marketing personalization.**
For prospects who consent during onboarding, lead with the *one* card that maximises *their* net value and the AED figure — a far stronger hook than a generic "up to 10%" banner, and one that survives scrutiny because it's computed from their own data. Perfios markets exactly this lift in activation and reduced abandonment. **[confirmed]**

**(c) Cross-sell / upgrade triggers when spend shifts.**
Because Perfios sees behaviour continuously, a *change* is a signal. When a customer's travel or FX spend climbs past a threshold, re-running `V()` may surface a premium/travel card that now wins (recall the engine's `robustness` scenarios already model "more_international"). Fire an upgrade prompt with the new net-value delta — event-driven, not calendar-driven.

**(d) Pre-eligibility & affordability gating.**
Use Perfios income identification and obligations/DBR to **filter before recommending**, so the engine's eligibility step runs on verified income rather than a self-declared number, and affordability concerns suppress cards the customer shouldn't take on. Fewer declined applications, better outcomes, lighter regulatory risk. **[confirmed capability]**

**(e) "You're leaving AED X on the table" win-back.**
Estimate the net value of the customer's *current* card from their statement behaviour, compute the best alternative with `V()`, and present the gap: *"Your current card earns you ~AED 1,400/yr; the best fit for your spend earns ~AED 4,100/yr — you're leaving ~AED 2,700 on the table."* This is the most persuasive, most defensible retention/switch message possible because it's arithmetic on the customer's own data — and for a **revolver**, the same machinery delivers the more important message: *"no cashback card beats clearing your ~40% APR balance"* (engine `headline` + `INTEREST DOMINATES` flag).

---

## 5. Privacy, consent & regulatory framing

This is consent-first by construction; the architecture is built on the UAE's own open-finance rails:

- **CBUAE Open Finance.** The UAE mandated Open Finance via the CBUAE Open Finance Regulation (Circular 7 of 2023, updated by Circular 3 of 2025, in force 10 July 2025). It provides a Trust Framework, API Hub and common infrastructure for **consent-driven, cross-sectoral data sharing**, with the first phase covering banks and insurers. Data sharing is *in all cases subject to the User's express consent*, strong authentication, and secure communication. **[confirmed]**
- **Consent-driven & revocable.** Nothing is read without an explicit, scoped, time-boxed consent grant; the customer can revoke at any time, after which ingestion stops.
- **Data minimization & purpose limitation.** Request only the fields the engine needs (the §2 mapping), for the stated purpose (card recommendation / affordability), retained only as long as necessary. The engine itself needs only a *derived* profile (spend vector, income, FX share, revolver flag) — not raw transaction lines — so the recommendation layer can operate on minimized, aggregated inputs.
- **Authoritative, not exhaust.** Open-Finance/AA data is *authorized* customer-permissioned data, distinct from scraped or inferred third-party data — which is precisely why it can carry the **revolver signal** that aggregators (per `aggregators.md`) structurally cannot.

**Closing the loop.** After a card is issued, the customer's *post-issue* spend (still consent-bound) flows back in and improves both sides: it (i) **sharpens the profile** (real category mix vs. the pre-issue estimate, and confirms/updates the revolver signal) and (ii) **calibrates the catalogue's value estimates** (realised cashback vs. modelled, redemption efficiency for points cards — directly addressing a limitation flagged in `algorithm.md` §7). The system gets more accurate the longer the consented relationship runs.

---

## 6. What Perfios gives us that we cannot get otherwise

Most of a profile can, in principle, be approximated: a customer *could* tell us their rough spend mix, and an aggregator *could* tell us which cards exist. But two things are obtainable **only** from real, consented financial data, and Perfios is purpose-built to extract them:

1. **Ground-truth behaviour at the category level** — the *actual* spend vector, *actual* income, and *actual* foreign-spend share, consolidated across **all** the customer's accounts via account-aggregator/Open-Finance rails, not one bank's partial view and not a self-reported guess. This makes the engine's output real instead of illustrative.

2. **Revolver propensity — the single biggest driver of true value, and invisible everywhere else.** Whether a customer *clears the statement or carries a balance* is the one input that can flip every ranking and turn a "5% cashback winner" into a **net-negative** choice (engine: AED 1,488 cashback − AED 3,510 interest = **−AED 2,218/yr** for our revolver archetype). An aggregator cannot know it. A marketing banner cannot infer it. A slider-built archetype only *assumes* it. Perfios can **detect it from statement behaviour** — and that single bit (`behavior.revolves`) is worth more to the quality of the recommendation than every reward rate in the catalogue combined.

In one line: **our engine knows what every card is worth to any profile; Perfios is the only thing that tells us, from reality, *which profile the customer actually is* — most importantly, whether they revolve.** Supply meets demand, and the recommendation finally becomes both *true* and *yours*.

---

## Sources

- [Hyperpersonalization — Perfios](https://perfios.ai/products/hyperpersonalization/)
- [Perfios Hyperpersonalization (perfios.com)](https://www.perfios.com/perfios-hyperpersonalization)
- [What is Hyper-Personalisation and its impact on the BFSI sector — Perfios](https://perfios.ai/resources/blogs/what-is-hyper-personalisation-and-its-impact-on-the-bfsi-sector/)
- [Best Bank Statement Analyser — Perfios](https://www.perfios.com/solutions/bank-statement-analyzer)
- [Perfios DPI Stack | Account Aggregator (AA) Lending Hub — Perfios](https://perfios.ai/in/products/perfios-dpi-stack/)
- [Perfios — How this fintech is shaping financial data (StartupTalky)](https://startuptalky.com/perfios-success-story/)
- [Open Finance Regulation — CBUAE Rulebook](https://rulebook.centralbank.ae/en/rulebook/open-finance-regulation)
- [Open finance in the UAE: laws and regulation — Pinsent Masons](https://www.pinsentmasons.com/out-law/guides/uae-open-finance)
- [Open Finance — Central Bank of the UAE](https://www.centralbank.ae/en/our-operations/fintech-digital-transformation/open-finance/)
