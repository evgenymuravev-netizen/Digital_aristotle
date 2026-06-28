# The Universal Comparison Algorithm

*A rigorous specification of `kfs/engine/value_engine.py` — the engine that decides which UAE credit card is actually worth the most to a specific person.*

---

## 1. The thesis: there is no "best card"

Open any "Top 10 Credit Cards in the UAE 2026" listicle and you will find a ranked list. That list is structurally wrong — not because the author picked the wrong cards, but because **the question it answers does not exist**. A credit card has no intrinsic value. Its value is entirely a function of how a particular person spends and repays:

```
V = V(card | profile)
```

The same card that tops the table for a grocery-heavy family can be mid-pack for a frequent traveller and **actively wealth-destroying** for someone who carries a balance. A list that ranks cards in the abstract is implicitly ranking them *for one invisible, unstated profile* — usually a high-spending transactor who never pays interest — and then presenting that ranking as universal.

Concretely, in our seed dataset:

| Profile | #1 card (by net annual value) |
| --- | --- |
| Family — groceries & school fees | **ADIB Cashback Visa** (AED 4,077/yr) |
| Frequent traveller — premium | **ENBD Skywards Signature** (AED 5,290/yr) |
| High spender — maximizer | **CBD Super Saver** (AED 8,239/yr) |
| Revolver — carries a balance | **ADIB Cashback Visa** — but at **−AED 2,218/yr** |

No single card appears as the winner across all of these, and for the revolver *every* card is net-negative. There is no row you could put at the top of a one-size-fits-all list that would be correct for more than one of these people.

So the engine does not score cards. **It scores the `(card, profile)` pair**, then ranks per profile. The deliverable is not "the best card" — it is a function `V()` that, given any card catalogue and any customer profile, produces the *correct* ranking *for that customer*.

---

## 2. The model

```
V(card | profile)  =  annual_rewards  +  benefits_value  −  annual_costs
```

where

```
annual_rewards  =  12 × monthly_reward(card, spend_vector)
benefits_value  =  usage-weighted value of lounges / insurance / BOGO
annual_costs    =  annual_fee_after_waiver  +  fx_cost  +  interest
```

All money is in AED. All rates are stored as **percentages** (`5.0` means 5%, never `0.05`). The implementation is pure Python standard library and fully deterministic, so every number below is unit-testable and is mirrored 1:1 in the browser port (`kfs/web/engine.js`).

The three terms map to three questions:

1. **`annual_rewards`** — *how much do I earn back from spending?* (cashback, or points/miles converted to AED).
2. **`benefits_value`** — *how much are the perks worth to me, given what I actually use?*
3. **`annual_costs`** — *what does holding and using this card cost me?* (fee, FX markup, and — only if I revolve — interest).

The entry point is `evaluate_card(card, profile, params) -> Evaluation`, which returns a fully attributed `Evaluation` dataclass:

```python
Evaluation(
    card_id, card_name, bank, eligible, ineligible_reasons,
    annual_reward_aed, annual_fee_aed, annual_fx_cost_aed,
    annual_interest_aed, annual_benefits_aed, net_annual_value_aed,
    effective_reward_rate_pct, reward_breakdown, flags,
)
```

`net_annual_value_aed` is `V`. Everything else is the receipt that explains it.

---

### 2.1 Rewards — `monthly_reward(card, spend_by_cat)`

This is the heart of the engine and the part that headline "up to X%" marketing throws away. It computes one month of reward in AED and returns a breakdown plus two booleans (`gated`, `capped`). The annual figure is simply `× 12`.

The reward rules, in the exact order the code applies them:

**(a) Points/miles → effective-cashback conversion — `_effective_pct`.**
Before any rate is used it is normalised to a cashback-equivalent percentage:

```
cashback card:    effective% = rate                         (5.0 → 5%)
points / miles:   effective% = earn_rate × value_per_point_aed × 100
```

A miles card earning **2.5 miles/AED** at **AED 0.02/mile** is therefore worth `2.5 × 0.02 × 100 = 5%` effective cashback. This is what lets a Skywards miles card be compared on the same axis as a flat cashback card — the entire points-vs-cashback debate collapses into one number. *(See `test_effective_pct_miles_conversion`.)*

**(b) Minimum-spend gate.**
Many cards pay **nothing** unless monthly spend clears a floor (`min_spend_to_earn_aed`). The gate is checked first against *total* monthly spend; if you are below it, the function returns `{total: 0, gated: True}` and the card earns zero that cycle. This single rule reorders rankings for low spenders and is almost never shown on aggregators. *(See `test_min_spend_gate_zeros_reward`.)*

**(c) Whole-card spend-tier bands** (e.g. **CBD Super Saver**'s 3% / 5% / 10%).
Some cards tier the *rate itself* by **total monthly spend**: spend more overall, and a higher rate applies to a defined set of categories (`applies_to`). `_pick_spend_band` selects the band whose `[min_total, max_total]` window contains total spend; that band's rate is applied to the in-scope categories (subject to the band's own `monthly_cap_aed`), and everything outside the band's categories earns the card's `base_rate_pct`. For CBD Super Saver:

| Total monthly spend | Rate on bills / groceries / transport | Per-band cap |
| --- | --- | --- |
| AED 3,000 – 10,000 | 3% | AED 400 |
| AED 10,000 – 20,000 | 5% | AED 600 |
| AED 20,000 + | 10% | AED 1,000 |

This is why a high spender who routes *everything* through one card can unlock value that a moderate spender on the identical card never sees — and why such a winner is often **fragile** (§6). *(See `test_spend_tier_bands`.)*

**(d) Per-category tiers + the non-AED (international) bonus.**
For ordinary tiered cards, each category's spend earns its tier rate (or `base_rate_pct` if no tier matches), capped at any per-category `monthly_cap_aed`. The `international` "category" is special — it is **not** a spend bucket but a *bonus rate on the non-AED slice of every category*. Because foreign spend cross-cuts dining, shopping, fuel, etc., `international_share` is modelled as an orthogonal scalar (0..1) and each category's spend is split pro-rata:

```
domestic_amt = amt × (1 − international_share)   → earns the category rate
intl_amt     = amt × international_share          → earns the international rate
```

The international rewards are pooled and capped once at the international tier's cap. Keeping FX orthogonal to categories avoids double-counting (you cannot be "groceries" and "international" as two separate buckets — you are groceries *abroad*). *(See `test_international_split`.)*

**(e) Per-category caps.**
A 5% grocery rate with a AED 200/month cap is really "5% on your first AED 4,000 of groceries, then 0%." Each category reward is `min(amt × rate, monthly_cap_aed)`. Ignoring this is the single largest source of aggregator over-statement. *(See `test_category_caps_apply`.)*

**(f) Overall monthly cap.**
After all categories are summed, an overall `monthly_cashback_cap_aed` clips the total. Crucially, when the cap binds, the engine **scales the per-category breakdown down proportionally** (`scale = cap / total`) so the attribution still sums to the truth — you can see *which* categories were trimmed, not just that you hit a ceiling. *(See `test_overall_cap_scales_breakdown`.)*

The function returns `{total, by_category, gated, capped}`; `evaluate_card` annualises `total` and surfaces `gated`/`capped` as human-readable `flags`.

---

### 2.2 Benefits — `benefits_value(card, profile, params)`

Perks are monetised by **actual declared usage**, not by their sticker value. A card advertising "unlimited lounge access" is worth **zero** to someone who never flies. The valuation parameters live in a `Params` dataclass (documented, overridable assumptions):

| Parameter | Default | Meaning |
| --- | --- | --- |
| `lounge_value_aed` | 120 | value of one lounge visit |
| `travel_insurance_value_aed` | 300 | annual value *if the profile uses it* |
| `bogo_value_aed` | 150 | rough annual value of BOGO / Entertainer perks |

Logic:

- **Lounge** — `unlimited` access → `lounge_visits_per_year × lounge_value_aed`; `limited` access → `min(visits, visits_per_year) × lounge_value_aed`. The profile's *behaviour* (how often they actually visit) bounds the value, and the card's *limit* bounds it again.
- **Travel insurance** — counted only if the card offers it **and** `behavior.values_travel_insurance` is true.
- **BOGO** — counted when present (a coarse annual estimate).

This is deliberately conservative: it is far better to under-credit a perk than to let a brochure benefit inflate a recommendation. For the frequent traveller (18 lounge visits/yr, values insurance), the Skywards card's perks are worth **AED 2,460/yr** — material, and correctly so. For the family (1 lounge visit/yr), perks are worth almost nothing and the comparison is driven by cashback.

---

### 2.3 Costs

```
annual_costs  =  annual_fee_after_waiver  +  fx_cost  +  interest
```

**Annual fee — `annual_fee_after_waiver(card, annual_spend)`.** The headline fee is rarely what you pay. Waiver logic:

| Waiver type | Steady-state fee charged |
| --- | --- |
| `free_for_life` | 0 |
| `income` | 0 (an eligible holder is assumed to meet the income waiver) |
| `spend` | 0 if `annual_spend ≥ min_annual_spend_aed`, else full fee |
| `first_year` / `conditional` / `none` | full fee (steady state) |

Note the deliberate choice to model **steady state**: a "free first year" card is treated as charging its fee, because the engine values *holding the card on an ongoing basis*, not a one-year teaser. *(See `test_fee_waivers`.)*

**FX cost.** `fx_cost = annual_spend × international_share × (fx_markup_pct / 100)`. Foreign spend pays the markup over the scheme rate. For the frequent traveller (40% international on AED 147,600 annual spend, 2.99% markup) this is **AED 1,765/yr** — large enough to change the ranking, and a cost that "rewards-focused" comparisons routinely omit.

**Interest — the behavioural switch.** Interest is charged **only if `behavior.revolves` is true**:

```
interest = revolving_balance_aed × (apr_pct / 100)        # transactor → 0
```

For a transactor (pays in full), interest is exactly zero and cashback rules. For a revolver, interest on the carried balance is typically an **order of magnitude larger** than any cashback, so the ranking correctly collapses to "lowest APR, lowest fee," and the engine raises an explicit flag. This one boolean is the most important input in the entire model (see §4). *(See `test_revolver_interest_dominates_and_goes_negative`, `test_transactor_pays_no_interest`.)*

This is a **simple first-order interest model**: APR × average carried balance. It is intentionally honest about being first-order — it does not amortise paydown within the cycle (see §7). But for the question that matters — *does interest dominate cashback?* — the first-order term is decisive and is never close.

---

## 3. Eligibility filtering

Before a card can win, it must be *attainable*. `evaluate_card` computes eligibility and `rank_cards` drops ineligible cards from the ranking (they are reported separately with reasons, never silently). Two gates:

1. **Income** — if `profile.monthly_income_aed < card.eligibility.min_monthly_income_aed`, the card is ineligible with a reason like `"income AED 9,000 < required AED 15,000"`.
2. **Islamic-only** — if `profile.preferences.islamic_only` is set and the card is conventional, it is excluded for Sharia reasons.

A brilliant card the customer cannot get is worth nothing to them; surfacing it as a recommendation is a failure mode the filter prevents. *(See `test_eligibility_income_filter`.)*

---

## 4. The behavioural pivot: transactor vs. revolver

It is worth stating plainly because it is the thing most comparisons get catastrophically wrong. Consider the **revolver** profile — moderate spend (AED 4,500/month), but carries ~AED 9,000 unpaid month to month. Running the engine:

```
PROFILE: Revolver — Carries a Balance
  ! This profile carries a balance, so the comparison is dominated by interest,
    not cashback. The winner is the cheapest-to-borrow card; the real advice is to
    stop revolving — no cashback beats ~40% APR.
  1. ADIB Cashback Visa Card   net AED -2,218/yr
       = rewards AED 1,488 + perks AED 0 - fee AED 99 - FX AED 97 - interest AED 3,510
       * INTEREST DOMINATES: carried-balance interest exceeds all rewards
  2. Mashreq Cashback Card     net AED -2,353/yr   (interest AED 4,050)
  3. DIB Prime Cashback Card   net AED -2,515/yr   (interest AED 3,510)
```

Every eligible card is **net-negative**. The AED 1,488 of cashback is buried under AED 3,510 of interest (AED 9,000 × 39% APR). The "winner" is merely the *least bad* card — the cheapest to borrow on — and the engine says so in the `headline` and per-card `flags`. A listicle that hands this person a "5% cashback" card is steering them toward a wealth-destroying choice with a smiley face on it. The single most valuable thing the engine outputs for this customer is not a card — it is *"clear the balance first."* *(See `test_real_revolver_all_negative`.)*

---

## 5. The multi-parameter scorecard (the radar)

Net annual value is the right *ranking* key, but a single AED figure hides *why* a card wins and what you trade off to choose it. `scorecard(evals, cards_by_id)` produces a **0–100, min-max-normalised score across five orthogonal dimensions**, designed for a radar / spider chart so two or three finalists can be compared at a glance:

| Dimension | What it measures | Direction |
| --- | --- | --- |
| **value** | net annual value to *this* profile | higher = better |
| **cost** | annual fee + APR-weighted carrying cost | higher score = cheaper |
| **simplicity** | inverse of #caps / gates / tiers | higher = simpler to use |
| **flexibility** | breadth of above-base earning categories | higher = more places to earn |
| **perks** | richness of lounge / insurance / installment / BOGO / concierge | higher = more perks |

Normalisation is **min–max across the candidate set** (`_norm`), so each axis runs 0–100 *relative to the cards being compared* — the radar answers "which of these is simplest/cheapest/richest," not an absolute-universe score. `cost` and `simplicity` are inverted (`100 − norm`) so "more is better" holds on every axis. When a dimension has no spread across the set, `_norm` returns 50 (neutral) rather than dividing by zero.

Worked output for the **family** profile's top three:

| Card | value | cost | simplicity | flexibility | perks |
| --- | --- | --- | --- | --- | --- |
| ADIB Cashback Visa | 100.0 | 87.5 | 28.6 | 100.0 | 0.0 |
| Mashreq Cashback | 80.1 | 92.4 | 57.1 | 40.0 | 16.7 |
| FAB Cashback | 69.1 | 61.4 | 0.0 | 60.0 | 0.0 |

The shape tells the story instantly: ADIB **wins on value and flexibility** (a flat 4% across six everyday categories) but is **low on simplicity** (many tiers) and **bare on perks**. Mashreq is the **cheapest and simplest** with a couple of perks, at some cost to value. FAB is the **most complex** and middling. A customer who hates fiddly caps might rationally accept Mashreq's slightly lower value for its much higher simplicity — and the radar makes that trade-off legible. **This is the "compare across multiple parameters" deliverable**: one normalised picture, not one number.

---

## 6. Robustness — does the winner survive plausible spend changes?

A recommendation that is correct only if the customer's spend is *exactly* the assumed vector is dangerous. People mis-estimate their own spending. `robustness(cards, profile, params)` re-ranks the catalogue under a few deterministic perturbations and flags **fragile** winners:

- **base** — the profile as given.
- **heavier_top_category** — +30% on the dominant category.
- **lighter_top_category** — −30% on the dominant category.
- **more_international** — `international_share` +0.2 (capped at 1.0).

If the same card wins every scenario, the winner is **STABLE**; otherwise **FRAGILE**, with the scenario→winner map exposed. Two real outcomes:

- **Family — STABLE.** ADIB wins under every perturbation. Its flat 4%-across-everyday-spend structure is robust to exactly *where* the family spends, so the recommendation is safe.
- **High spender — FRAGILE.**
  ```
  robustness: winner FRAGILE
  { base: cbd-super-saver, heavier_top_category: cbd-super-saver,
    lighter_top_category: enbd-skywards-signature, more_international: cbd-super-saver }
  ```
  CBD Super Saver wins at base — but only because total spend (>AED 20k/month) unlocks its **10% top band**. Trim the dominant category 30% and total spend can drop below the band threshold; the rate collapses and the **Skywards card takes the lead**. The win is *real but conditional on staying in the band*. The honest product treatment is to surface this: "Best **as long as you keep spending AED 20k+/month**; below that, consider Skywards." A naïve single-number ranking would hide that cliff.

Robustness turns "here is the winner" into "here is the winner, and here is how confident we are."

---

## 7. Limitations & how to extend

The engine is deliberately a clean first-order model. Known simplifications, each a clear extension point:

- **Interest is not amortised.** We charge `APR × average carried balance` for a year. A fuller model would amortise paydown over the cycle (declining balance), apply the `min_payment_pct` schedule, and account for the grace-period mechanics whereby *new* purchases also accrue interest once a balance revolves. The first-order term is sufficient to establish *that interest dominates*; the amortised term would sharpen *by how much*.
- **Reward-redemption friction is ignored.** We assume cashback is taken at face value and points convert cleanly at `value_per_point_aed`. Real programs impose minimum redemption thresholds, expiry, blackout dates, statement-credit-only constraints, and devaluations. A `redemption_efficiency` haircut per program would make points cards more honest (most are worth *less* than their nominal conversion).
- **Welcome / sign-up bonuses are excluded.** A AED 500 joining bonus or first-90-days accelerator can dominate *year one*. We model steady state on purpose, but a `welcome_bonus` term with an amortisation horizon (1-year vs 3-year view) would let the engine answer both "best to get now" and "best to keep."
- **Sign-up churn / multi-card strategies are out of scope.** Sophisticated users hold several cards and route each category to its best earner. The engine ranks single cards; an extension could solve the *portfolio* optimisation (best 2–3 card combination) given category caps.
- **Statement-cycle timing is abstracted.** Caps reset monthly in the model; real cycle dates, billing lag, and lumpy spend (school fees once a term) interact with monthly caps in ways a daily-resolution simulation would capture.
- **Parameter sensitivity.** `lounge_value_aed`, `travel_insurance_value_aed`, and `value_per_point_aed` are assumptions. They are centralised in `Params` and per-card fields precisely so they can be tuned or personalised — and the robustness harness could be extended to perturb *them*, not just spend.

None of these change the *architecture*; each is a richer term inside the same `V = rewards + benefits − costs` frame.

---

## 8. Why this generalizes — the universal comparator

The engine is not a UAE-cashback gadget. It is a general statement of how to compare any set of products whose value depends on the consumer:

> Given a catalogue of cards `C` and a profile `p`, `V(c | p)` assigns every card a personalised net value, from which a correct, attributed, robustness-checked ranking follows.

Everything that varies — which cards exist, their rates and caps, the customer's spend and behaviour — is **data**, not code. The same `V()`:

- ranks **any** card set (swap `cards.json`; the engine neither knows nor cares how many cards or which banks),
- for **any** profile (a hand-built archetype today, a real customer's spend vector tomorrow — see `perfios-hyperpersonalization.md`),
- on a **single comparable axis** (AED of net value), because points/miles/cashback are all normalised to effective cashback and perks are normalised to AED of realised value,
- with a **multi-dimensional view** when one number is not enough (the scorecard radar),
- and a **confidence signal** on the result (robustness).

That is the whole contribution: not a leaderboard, but a *comparator*. Listicles answer "what is the best card?" — a question with no answer. This engine answers "what is the best card **for you**?" — the only question that was ever well-posed.

---

### Appendix — reproducing the worked numbers

```bash
python3 kfs/engine/value_engine.py --profile family-grocery-school
python3 kfs/engine/value_engine.py --profile revolver-carries-balance
python3 kfs/engine/value_engine.py --profile high-spender-maximizer
python3 kfs/engine/value_engine.py --json                 # full machine-readable output
python3 kfs/engine/tests/test_value_engine.py             # the worked cases as assertions
```

All figures in this document were produced by the committed engine and dataset (`as_of 2026-06`) and are reproduced as assertions in `kfs/engine/tests/test_value_engine.py`. Card data is research-grade and provenance-tagged; re-verify against the live KFS before any customer-facing use.
