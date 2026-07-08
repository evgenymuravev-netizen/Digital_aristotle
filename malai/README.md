# mal.ai — the AI-agentic Islamic bank (prototype)

A product site and a clickable prototype for **mal.ai** (مال — *mal*, "wealth"),
a concept for an **AI-agentic-first Islamic digital bank** with the **financing
(lending) experience** at its core.

**Live (GitHub Pages):** https://evgenymuravev-netizen.github.io/Digital_aristotle/malai/

> Published under `/malai/` so it coexists with the repository's root site and the
> other case studies (`/tradepay/`) without disturbing them.

| Surface | Path | What it is |
| --- | --- | --- |
| **Product site** | [`/`](index.html) | The story: why Islamic financing is broken, why the agent is the bank, how Murabaha becomes a conversation. |
| **Prototype** | [`/prototype/`](prototype/) | A clickable, guided walkthrough of the agentic financing journey — from "I need a car" to a signed Murabaha contract, plus servicing. |
| **PRD** | [`/prd/`](prd/agentic-financing-prd.md) | The agentic-financing PRD, written in the [Product Owner Toolkit](https://github.com/davidjwhenry/productownertoolkit) format. |

## The product in one line

> The agent **is** the bank. mal.ai turns Sharia-compliant financing — Murabaha,
> Tawarruq, Ijarah — from a branch-and-paperwork ordeal into a five-minute
> conversation, with every riyal of profit disclosed before you say yes.

## Why lending is the accent

Financing is where Islamic banking wins or loses trust:

- **Structures are opaque.** Most customers can't explain what their own Murabaha
  is, or how the bank's profit differs from interest. mal.ai's agent explains the
  structure it recommends, shows the *cost price + fixed profit = total* math, and
  gives an APR-equivalent so offers can be compared honestly.
- **Origination is slow.** Branch visits, wet signatures, days of waiting. Here the
  agent underwrites in the conversation — open-banking cashflow, SIMAH bureau,
  SAMA responsible-lending DBR — with every tool call visible and permission-scoped.
- **Servicing is adversarial.** Conventional lending monetises failure (late fees,
  penalty interest). mal.ai charges **no late fees** (a charity pledge instead, per
  AAOIFI), grants **ibra'** (profit rebate) on early settlement, and restructures
  hardship without increasing the debt — and the agent does all three proactively.

## How the prototype is organized

The prototype is hash-routed as `#/<screen>` and driven by a **guided tour**
(`←` / `→` keys, or the "Next" button) through four acts:

1. **The front door.** Home is the agent, not a dashboard. Balance, Mudarabah
   savings and zakat sit one glance deep; everything else is a sentence away.
2. **The financing conversation** *(the heart)*. Sara asks for SAR 85,000 toward a
   car. The agent checks affordability with visible tool calls, compares Murabaha
   vs Tawarruq, presents a fully transparent offer, then executes the Murabaha
   sequence step by step (bank buys → owns the risk → sells at cost + disclosed
   profit → Nafath e-sign).
3. **Living with financing.** The servicing surface: schedule, early settlement
   with a live ibra' computation, and a hardship restructure that defers instead
   of penalising.
4. **The trust layer.** Sharia governance: the board, per-product fatwas, AAOIFI
   standards, and the profit-vs-interest explainer.

Each stop pairs the phone screen with a **"Why it's built this way"** panel — the
product rationale, in the PO's voice.

## Method

Rebuilt from the working method of
[davidjwhenry/productownertoolkit](https://github.com/davidjwhenry/productownertoolkit):
shape the thinking (JTBD, assumptions), write the PRD, then ship a clickable
prototype and a stakeholder-facing site from the same source of truth. The PRD in
`prd/` follows the toolkit's front-matter and section conventions.

## Tech

Static HTML/CSS/JS. No build step, no dependencies, no backend — every "agent"
response is scripted and deterministic so the walkthrough is reliable in a demo.
Fonts are the only external requests.

## Disclaimer

A concept prototype for product-craft demonstration. Not a real bank, not Sharia
advice; figures (profit rates, DBR thresholds, rebates) are illustrative.
