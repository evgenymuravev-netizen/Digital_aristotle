# Tradepay — product site & clickable prototype

A marketing website and an interactive, multi-year clickable prototype for **Tradepay**,
the settlement-and-credit rail for GCC traditional trade (Tradepay CPO case study).

**Live (GitHub Pages):** https://evgenymuravev-netizen.github.io/Digital_aristotle/tradepay/

> Published under `/tradepay/` so it coexists with the repository's root site without disturbing it.

| Surface | Path | What it is |
| --- | --- | --- |
| **Website** | [`/`](index.html) | The product story: problem, three chapters, mobile, integrations & distribution, trust. |
| **Prototype** | [`/prototype/`](prototype/) | A clickable walkthrough across three eras with the rationale for each evolution. |
| **Strategy brief** | [`/strategy/`](strategy/) | The 30-slide CPO strategy deck the product is built from. |

## The product in one line

> Credit that rides a payment rail collects itself. Tradepay settles the flow between FMCG
> distributors and the Kingdom's corner-store merchants, and finances every order riding on it —
> repayment captured at the source of cash, not chased after it.

## How the prototype shows 3–5 years of evolution

The prototype is hash-routed as `#/<era>/<persona>/<screen>` and is organized into three
sequenced chapters. A **guided tour** (`←` / `→` keys, or the "Next in tour" button) walks the
whole 2026 → 2031 arc; a **"Why it evolves"** drawer lays out the dependency-chain rationale.

1. **The Rail — 2026.** Settlement between distributors and merchants; repayment captured on-rail.
   Surfaces: rep tablet, distributor console, merchant onboarding. *Why first: collections is the
   binding constraint of the whole category.*
2. **The Engine — 2027–28.** Approval-at-constant-loss underwriting fed by the rail's own data,
   ZATCA and SIMAH; the merchant app; the "+15pp or you don't pay" test. *Why second: the rail's
   exhaust is the data no off-rail lender can copy.*
3. **The Arm — 2029–31.** White-label the proven stack so distributors run their own financing arms
   on Tradepay; securitization; FMCG trade intelligence. *Why last: nobody rents an unproven machine —
   and the named threat becomes the customer base.*

Each chapter unlocks only when the previous one's exit criteria hold — the sequence **is** the strategy.

## Mobile & integrations

- **Mobile** is first-class: Arabic-first device mockups for the rep app, the merchant app, and
  white-label tenant apps, shown on the website and inside the prototype's phone frames.
- **Integrations / distribution** are documented on the website: national infrastructure
  (ZATCA, sarie, Nafath, SIMAH) and channel partners (distributor ERP/DMS, rep tablet SDK,
  WhatsApp, marketplace checkout, accounting/POS, the engine API, the white-label Arm, and a
  bank funder portal) — each one simultaneously plumbing and go-to-market.

## Tech

Static HTML/CSS/JS, no build step. Deployed by `.github/workflows/deploy-pages.yml`
(GitHub Actions → Pages). `.nojekyll` disables Jekyll processing.

## Disclaimer

Concept prototype for a case study. All figures are targets, public benchmarks, or modeling
assumptions from the strategy brief. Company names referenced (Square, Shopify, Tienda Pago,
MaxAB-Wasoko, Lendo, Tamara, Sary, Retailo, Mala, etc.) are public-market evidence, not partnerships.
