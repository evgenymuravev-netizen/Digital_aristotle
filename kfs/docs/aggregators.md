# Aggregator Assessment: creditcardfinder.ae & yallacompare

*An honest, product-team-facing assessment of the two largest UAE credit-card comparison sites — what they are, how their business model bends their data, how accurate they actually are against the bank Key Facts Statement (KFS), and the exact division of labour we adopt: **aggregators for discovery, KFS for value.***

> **Scope & method note.** Direct fetches to bank and vendor sites are blocked in this environment, so company facts below are drawn from web-search result snippets and are marked **[confirmed]** (corroborated by a search result) or **[inferred]** (a reasoned conclusion from how this market works). The accuracy methodology in §4 is a *procedure* to be run against live data; the illustrative numbers in its tables are clearly labelled as templates, not measured results.

---

## 1. What each site is

### creditcardfinder.ae
A UAE-focused credit-card comparison and application portal. It lets users filter cards by salary requirement, features (lounge access, balance transfer, dining offers, travel insurance, etc.) and issuing bank, then **apply directly through the site**. Coverage spans the major UAE issuers — ADCB, ADIB, CBD, Citi, DIB, Emirates Islamic, Emirates NBD, FAB, HSBC, Mashreq, Najm, RAKBANK, Standard Chartered and others. **[confirmed]** Public listing pages surface on the order of ~20 featured cards at a time **[confirmed]**, though the addressable UAE market is far larger; comparable UAE portals advertise "200+ cards." **[confirmed]**

### yallacompare
The UAE's best-known financial aggregator (founded 2011 as *compareit4me*; rebranded yallacompare). It compares insurance, bank accounts, loans and credit cards across ~9 countries (UAE, Qatar, Bahrain, Kuwait and others), and was for a period the **largest insurance aggregator in the UAE** by sales. **[confirmed]** For credit cards it markets comparison of **200+ cards** by rate, benefits, minimum salary and fees. **[confirmed]**

Both are *comparison + application* businesses, not banks and not neutral registries.

---

## 2. The business model — and the biases it creates

Both sites are **lead-generation / affiliate** businesses. They earn when a user clicks through and applies (or is approved) for a card; banks pay per qualified lead or per approved application (a CPA model). yallacompare states its value to suppliers explicitly as *"lead generation at a lower cost,"* helping banks cut customer-acquisition spend. **[confirmed]**

That model is legitimate, but it creates **structural incentives that are not aligned with "show the user the card with the highest net value to them":**

1. **Commission-weighted prominence.** When ranking/placement can be influenced by payout, a card paying a higher commission tends to rank above an objectively better card paying less. This is a documented, repeatedly observed pattern in credit-card comparison sites globally (the economics are identical in the UAE). **[confirmed — pattern]** / **[inferred — for these two specific UAE sites]**
2. **"Up to X%" headline inflation.** The incentive is to make each card look as attractive as possible at a glance, so the headline is the *maximum theoretical* rate ("up to 10% cashback"), not the realistic blended rate after caps and gates. The qualifiers that destroy that number live in fine print or are omitted. **[inferred from incentives + observed marketing copy]**
3. **Selective coverage / "pay-to-play."** Issuers (or specific cards) that don't participate in the affiliate program can be under-represented or absent, so the "comparison" is really "a comparison of cards we monetise." A famous illustration from the US market: a top-three issuer was conspicuously missing from results because it didn't pay referral fees. **[confirmed — analogous market]**
4. **Disclosure is technically present but buried.** Commission relationships are usually disclosed somewhere (privacy policy, "about" page) but not next to the rankings, so users rarely connect the ranking to the payout. **[confirmed — pattern]**

**Net effect:** these sites optimise a different objective function than ours. We optimise `V(card | profile)` — net AED value to a specific person. They optimise *qualified, monetisable applications*. The two coincide sometimes and diverge exactly where it matters most (caps, gates, fees, and for revolvers, APR).

---

## 3. Their data model vs. ours

| Dimension | Aggregator | Our KFS-normalized model (`schema.json`) |
| --- | --- | --- |
| Reward rate | **Headline "up to" maximum**, marketing copy | Per-category `rate_pct` **plus** the binding constraints |
| Per-category caps | Frequently **omitted** | `tiers[].monthly_cap_aed` |
| Overall monthly cap | Frequently **omitted** | `monthly_cashback_cap_aed` |
| Minimum spend to earn | Rarely shown | `min_spend_to_earn_aed` (a hard reward gate) |
| Spend-tier bands | Shown as the **top** band only | full `spend_tiers[]` with thresholds & per-band caps |
| Annual fee | Headline (often "free for life" emphasised) | `annual_fee_aed` + structured `annual_fee_waiver` logic |
| FX markup | Often absent | `fx_markup_pct` (a real cost on foreign spend) |
| Interest / APR | Present but de-emphasised | `interest.apr_pct` — **decisive for revolvers** |
| Eligibility | Min salary shown | `eligibility.min_monthly_income_aed`, Islamic flag |
| Provenance / freshness | Implicit, undated | `source.as_of`, `source.confidence`, `provenance_notes` |

The structural difference: **aggregators publish the numerator (the attractive rate) and drop the denominators that determine realised value (the caps, gates, fees, and APR).** Our engine is built precisely around those denominators — `monthly_reward()` exists to apply caps/gates/tiers/FX, and the revolver logic exists to make APR dominate when it should (see `algorithm.md`).

### Concrete discrepancy classes

We classify aggregator-vs-KFS gaps into six repeatable types. Naming them makes them auditable:

| # | Class | What it looks like | Why it matters |
| --- | --- | --- | --- |
| **(a)** | **"Up to" headline inflation** | Card listed as "up to 10% cashback"; KFS shows 10% applies only to one category, capped at AED 150/mo | The realised blended rate can be a fraction of the headline; a user picks for 10% and earns ~1–2% |
| **(b)** | **Stale rate after repricing** | Aggregator still shows last quarter's rate/fee after a bank repriced (e.g. an APR or annual-fee change) | User budgets on a number that no longer exists |
| **(c)** | **Missing per-category & overall caps** | "5% groceries" with no mention of the AED 200/mo cap or the AED 1,000/mo overall cap | The cap, not the rate, sets the real ceiling — invisible here |
| **(d)** | **Omitted minimum-spend gate** | No mention that AED 3,000+/mo is required to earn *anything* | Below-threshold users earn **zero** but believe they're earning the headline rate |
| **(e)** | **Waiver conditions glossed** | "Free for life!" when the fee is only waived on an annual-spend threshold, or free for year 1 only | Year-2 fee is a surprise; net value is over-stated |
| **(f)** | **Selective card coverage** | A strong card from a non-partner bank is absent or buried | The "best" on the page may not be the best in the market |

---

## 4. Accuracy methodology — measuring an aggregator against the KFS ground truth

To move from "they're probably biased" to a **defensible, reproducible accuracy score**, we treat the **bank KFS as ground truth** and audit aggregator records against it, field by field. The procedure:

### 4.1 Procedure

1. **Sample.** Draw `N` cards (start `N = 25–40`) stratified across issuers and segments (core / premium / Islamic), so the score isn't dominated by one bank. Record the **capture date** — freshness is part of accuracy.
2. **Extract the field set from both sources.** For each sampled card pull the same canonical fields from (i) the aggregator listing and (ii) the bank KFS (PDF/HTML), normalising both into our `schema.json` shape. The audited field set:

   | Field key | Field |
   | --- | --- |
   | `headline_rate` | Top advertised reward rate |
   | `category_rates` | Per-category rates |
   | `category_caps` | Per-category monthly caps |
   | `overall_cap` | Overall monthly reward cap |
   | `min_spend_gate` | Minimum monthly spend to earn |
   | `annual_fee` | Annual fee |
   | `fee_waiver` | Waiver type & threshold |
   | `apr` | Purchase APR / profit rate |
   | `fx_markup` | Foreign-currency markup |
   | `min_income` | Minimum income eligibility |

3. **Compare per field.** For each (card, field), assign one of:
   - **MATCH** — values agree within tolerance (exact for booleans/enums; ±0.1pp for rates; ±AED for fees; for `headline_rate`, "match" means the headline is *achievable as stated*, i.e. not contradicted by an undisclosed cap/gate).
   - **MISMATCH** — values conflict (wrong number / wrong waiver type / contradicted headline).
   - **MISSING** — the KFS specifies the field but the aggregator omits it (counts against accuracy — omission of a value-determining field is an error, not a neutral).
   - **N/A** — the field genuinely doesn't apply to that card (excluded from the denominator).
4. **Classify each non-MATCH** into a discrepancy class (a)–(f) from §3.
5. **Score** per field and per aggregator (§4.2), and **tabulate** (§4.3).
6. **Re-run on a cadence** (e.g. quarterly) so class (b) staleness is tracked over time, and weight by how *consequential* each field is to `V` (caps/gates/APR matter more than a perk flag).

### 4.2 Scoring rubric

Per field, across the sample:

```
field_accuracy =        MATCH
                 ----------------------------------
                  MATCH + MISMATCH + MISSING        (N/A excluded)
```

Aggregate to an aggregator score by averaging field accuracies, optionally **value-weighted** by each field's leverage on `V`:

| Field | Suggested weight | Rationale |
| --- | --- | --- |
| `apr` | ×3 | Dominates value for revolvers |
| `overall_cap`, `category_caps`, `min_spend_gate` | ×3 | These *are* the realised-value determinants |
| `fee_waiver`, `annual_fee` | ×2 | Direct cost; commonly glossed |
| `category_rates`, `fx_markup`, `min_income` | ×1 | Important but lower leverage |
| `headline_rate` | ×1 | The marketing number; informative as a bias signal |

Per-field **trust tier** for downstream use:

| field_accuracy | Trust tier | How we treat the aggregator value |
| --- | --- | --- |
| ≥ 0.90 | **Trusted** | Usable for cross-check; still confirm caps |
| 0.70 – 0.89 | **Caution** | Display only with a "verify" caveat |
| < 0.70 | **Do not trust** | Discovery only; always override with KFS |

### 4.3 Output table templates

**Per-aggregator scorecard** (one row per audited field):

| Field | N (cards) | MATCH | MISMATCH | MISSING | N/A | field_accuracy | Dominant class | Trust tier |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| headline_rate | — | — | — | — | — | — | (a) | — |
| category_rates | — | — | — | — | — | — | — | — |
| category_caps | — | — | — | — | — | — | (c) | — |
| overall_cap | — | — | — | — | — | — | (c) | — |
| min_spend_gate | — | — | — | — | — | — | (d) | — |
| annual_fee | — | — | — | — | — | — | — | — |
| fee_waiver | — | — | — | — | — | — | (e) | — |
| apr | — | — | — | — | — | — | (b) | — |
| fx_markup | — | — | — | — | — | — | — | — |
| min_income | — | — | — | — | — | — | — | — |
| **Weighted total** | | | | | | **—** | | **—** |

**Per-card discrepancy log** (drives the counts above and is the audit trail):

| card_id | field | aggregator_value | kfs_value | verdict | class | capture_date | kfs_as_of |
| --- | --- | --- | --- | --- | --- | --- | --- |
| e.g. `rakbank-world-cashback` | category_caps | (none shown) | AED 150/mo on groceries | MISSING | (c) | YYYY-MM-DD | 2026-06 |

> The tables above are **templates**. We do not assert specific accuracy percentages here because they must be *measured* on a dated sample, not asserted — and an honest doc that hasn't run the audit yet should describe the mechanism, not invent the numbers. (The repo's own `cards.json` `provenance_notes` already flag, per card, which fields are KFS-confirmed vs. UAE-typical — the same discipline this audit formalises for third-party sources.)

---

## 5. How we use them anyway — explicit division of labour

The biases above are a reason to be disciplined, **not** a reason to ignore aggregators. They are genuinely excellent at one half of the problem and unreliable at the other. We split the roles cleanly:

| Job | Owner | Why |
| --- | --- | --- |
| **Discovery / coverage** — *which cards exist, from which banks, in which segments* | **Aggregators** | Their breadth (200+ cards across every issuer) is exactly what you want to **seed the bank/card registry** — they are a market map |
| **Cross-checking** — sanity-checking a value or catching a card we missed | **Aggregators (secondary)** | A second opinion that flags "did this reprice?" or "is there a variant we don't have?" |
| **Values / ground truth** — *the rate, cap, gate, fee, waiver, APR that decide `V`* | **The KFS** | The KFS is the bank's own regulated disclosure; it is authoritative where marketing copy is not |
| **Ranking** — *who actually wins for this customer* | **Our engine** on KFS-grade data | Only the engine applies caps/gates/FX/interest to a real profile |

Stated as a one-liner: **aggregators tell us *what to look at*; the KFS tells us *what it's worth*; the engine tells us *who it's worth it to*.** Aggregator output enters the pipeline as a *candidate list with `source.confidence: low` and `source_type: aggregator`*, and **every value-determining field is overwritten by KFS extraction** before it can influence a recommendation. An aggregator figure never reaches a customer unverified.

---

## 6. Verdict — how accurate are they, really?

**For discovery: high and useful.** As a map of *which cards exist* across UAE banks, both sites are strong; yallacompare's 200+ card breadth and creditcardfinder.ae's issuer coverage are real assets for seeding a registry. **[confirmed coverage]**

**For values: structurally unreliable in a predictable, field-specific way.** The unreliability is not random noise — it is *biased in a known direction by the business model*. Expect the practical trust level to fall by field roughly as:

| Field | Expected trust | Why |
| --- | --- | --- |
| Existence of card, issuer, network, broad type | **High** | Easy to get right; no incentive to distort |
| Minimum income / segment | **Medium–High** | Usually shown and fairly stable |
| Headline reward rate | **Medium** *as a headline*, **Low** as realised value | It's the marketing maximum, class (a) |
| Annual fee & "free for life" claim | **Medium** | Often true but waiver conditions glossed, class (e) |
| **Per-category caps, overall cap, min-spend gate** | **Low** | The most value-determining fields are the most omitted, classes (c)/(d) |
| **APR** | **Low–Medium**, and the **highest-stakes** to get right | De-emphasised, sometimes stale (class b), yet it *decides* value for any revolver |
| Freshness after a repricing | **Low** | No strong incentive to update promptly, class (b) |

The fields aggregators handle worst — caps, gates, APR — are precisely the fields that determine real value, and for a revolver the field they de-emphasise most (APR) is the **single biggest driver of true value**. That asymmetry is the whole case for keeping the KFS as source of truth and using aggregators strictly for discovery and cross-checking. **[inferred from §2 incentives + §3 data model; quantify per field via the §4 audit before publishing accuracy numbers]**

---

## Sources

- [Compare & Find the Right Credit Card in UAE — creditcardfinder.ae](https://creditcardfinder.ae/)
- [Creditcardfinder.ae launches comparison service (Zawya press release)](https://www.zawya.com/en/press-release/companies-news/creditcardfinderae-launches-comprehensive-comparison-service-for-credit-cards-in-the-uae-gxsehtlg)
- [Compare Credit Cards in Dubai & UAE — yallacompare](https://yallacompare.com/uae/en/credit-cards/)
- [yallacompare is the leading financial and insurance product comparison site — Dtec](https://dtec.ae/ventures/yallacompare-leading-financial-and-insurance-product-comparison-site/)
- [Generation start-up: yallacompare — The National](https://www.thenationalnews.com/business/money/generation-start-up-yallacompare-the-financial-aggregator-bringing-transparency-to-uae-consumers-1.877532)
- [Credit Card Comparison Tools — Affiliate Bias Exposed (honestmoney.in)](https://honestmoney.in/credit-cards/credit-card-comparison-tools-india-affiliate-bias-exposed)
- [Study: Credit Card Comparison Sites Don't Work as Promised — TIME](https://business.time.com/2012/11/09/study-credit-card-comparison-sites-fall-short-of-promises/)
- [Credit card comparison sites reflect referral fees, may be biased — NBC News](https://www.nbcnews.com/business/business-news/credit-card-comparison-sites-reflect-referral-fees-may-be-biased-flna1c6811747)
