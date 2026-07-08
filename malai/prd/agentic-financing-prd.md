---
title: Agentic Financing — Murabaha in a Conversation
type: prd
source_skill: prd-writer
---

# Agentic Financing — Murabaha in a Conversation

Author: Product
Document Version: 0.2
Document Status: Reviewing
Document Type: PRD

## 1. TL;DR

- This PRD defines the `MVP` of mal.ai's financing experience: a customer obtains
  Sharia-compliant financing end-to-end inside a conversation with the bank's agent.
- The feature is for salaried retail customers in KSA who need asset or cash
  financing and want it to be fast, understandable, and genuinely Sharia-native.
- The agent underwrites in-conversation (open banking, SIMAH, SAMA DBR rules),
  recommends a structure (Murabaha vs Tawarruq), presents a fully transparent
  offer, and executes the contract sequence with Nafath e-signing.
- Servicing is part of the product, not an afterthought: ibra' (profit rebate) on
  early settlement, no late fees (charity pledge instead), penalty-free hardship
  restructuring — all initiated through the same agent.
- The main outcome is financing that customers can explain in their own words.
- The primary success metric is conversation-to-contract completion rate, with a
  guardrail on post-signing comprehension (customer can state total cost and
  structure unaided).

## 2. Product Shape

| Item | Decision |
| --- | --- |
| `PRD Phase` | `MVP` |
| `Lineage` | Greenfield — the financing journey is the bank's founding surface, not an add-on to an account app |
| `Product Posture` | The agent is the primary interface; screens are artefacts the agent produces, not destinations the customer hunts through |
| `Adjacent Surfaces` | Home (balance, Mudarabah savings, zakat), financing hub (active contracts, schedule), Sharia governance layer |
| `Entry Point Hypothesis` | Customers state a need in natural language ("I need a car", "I need SAR 30k cash") from anywhere in the app |

### 2.1. Assumptions To Test

| # | Assumption | Validation Method | Threshold |
| --- | --- | --- | --- |
| A1 | Customers will trust an agent-led underwriting flow if every tool call is visible and permission-scoped. | Prototype walkthroughs; drop-off at the consent step vs a silent-underwriting variant. | Consent completion ≥ 85% of started conversations. |
| A2 | Structure explanation (Murabaha vs Tawarruq) increases completion rather than adding friction. | A/B explanation-on vs minimal-disclosure variant. | No completion loss > 5%; comprehension uplift ≥ 30pp. |
| A3 | Ibra' and no-late-fee servicing measurably improve early settlement and cure rates vs market baseline. | Cohort tracking post-launch. | Early-settlement NPS ≥ +40; 30-day cure rate ≥ 1.3× market. |

## 3. Strategic Context

### 3.1. Job To Be Done

| JTBD Lens | Notes |
| --- | --- |
| **Main job** | Get financing for a real need — a car, an emergency, a home — without compromising faith, and without being confused about what it costs. |
| **Current approach** | Branch visits or clunky apps; contracts signed without being understood; "Islamic" products that feel like conventional loans with Arabic labels. |
| **Current friction** | Days-long origination, opaque profit math, punitive servicing (late fees dressed up), no way to ask "why?" and get an answer. |
| **Desired progress** | Customers should get a decision in minutes, understand exactly what the bank earns and why the structure is compliant, and be treated as a partner when life goes wrong. |

**Who experiences this:** Salaried KSA retail customers, 25–45, digitally native,
for whom Sharia compliance is a requirement rather than a preference — currently
underserved by both conventional digital banks and legacy Islamic banks.

### 3.2. Why This Stage Now

- Agentic UX is the first interface paradigm that can make a *structured* Islamic
  contract (multi-step, sequenced, disclosure-heavy) feel simpler than a
  conventional loan, not harder.
- Underwriting inputs (open banking via SAMA framework, SIMAH, Nafath identity)
  are now available as APIs — the conversation can be the underwriting session.
- Lending is chosen as the founding surface because it is the highest-trust,
  highest-margin moment; deposits follow trust, not the reverse.

### 3.3. Market, Competitive & Substitute Context

| Signal or Alternative | What it says about the job | Implication for mal.ai |
| --- | --- | --- |
| **Legacy Islamic banks** | Compliant but slow and opaque; the structure exists on paper, not in the customer's understanding. | Win on speed *and* comprehension, not compliance alone. |
| **Conventional digital lenders** | Fast, but not an option for the Sharia-conscious segment. | Match their time-to-money; beat them on trust and servicing ethics. |
| **BNPL players** | Prove the appetite for instant, transparent instalments in the region. | Bring the same instant-and-legible feel to larger, regulated tickets. |
| **AAOIFI / SAMA direction** | Standardisation and consumer-protection pressure keep rising. | Radical disclosure is a regulatory tailwind, not a cost. |

## 4. Goals & Rabbit Holes

### 4.1. What We Want To Achieve

| Goal | Why it matters now |
| --- | --- |
| **Financing you can explain** | Comprehension is the differentiator; a customer who can explain their Murabaha is a customer who trusts the bank. |
| **Decision inside the conversation** | Time-to-yes is the adoption driver; every handoff out of the conversation bleeds completion. |
| **Visible, consented tool use** | Agent autonomy without visible tool calls reads as a black box — the opposite of the trust position. |
| **Servicing that keeps its promises** | Ibra', no late fees, and penalty-free restructuring are the proof that "Islamic" is substance, not branding. |

### 4.2. Rabbit Holes We Will Avoid

- **Free-form agent underwriting.** The agent narrates and orchestrates; credit
  policy is deterministic and versioned. No LLM-decided approvals in `MVP`.
- **Structure maximalism.** `MVP` ships Murabaha (asset) and Tawarruq (cash) only.
  Ijarah and Musharakah Mutanaqisah (home) are roadmap, shown as "coming" surfaces.
- **Voice, Arabic-first NLU tuning, multi-agent handoffs** — deferred; the scripted
  demo proves the interaction contract first.

## 5. Scope (MVP)

1. **Conversation-led origination:** need capture → consented data pulls (open
   banking, SIMAH) → SAMA DBR affordability → structure recommendation with
   comparison → transparent offer (cost + fixed profit, APR-equivalent, schedule)
   → Murabaha execution sequence → Nafath e-sign → disbursement/delivery.
2. **Financing hub:** active contract card, schedule, paid/remaining progress.
3. **Servicing conversations:** early settlement with computed ibra'; hardship
   deferral with zero debt increase; late-payment flow that routes the pledge to
   charity instead of the bank's P&L.
4. **Sharia layer:** per-product fatwa references, board identity, AAOIFI standard
   citations, profit-vs-interest explainer.

## 6. Success Metrics

| Metric | Type | Target |
| --- | --- | --- |
| Conversation-to-contract completion | Primary | ≥ 35% of affordability-passed conversations |
| Time from need to signed contract | Supporting | Median ≤ 7 minutes |
| Post-signing comprehension (can state total cost + structure) | Guardrail | ≥ 80% |
| Consent-step completion | Supporting | ≥ 85% |
| Early-settlement NPS | Servicing | ≥ +40 |
