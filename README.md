# noor — Agentic Islamic Finance Platform · Clickable Prototype

A deep, clickable HTML prototype of the **Noor** app from the May 2026 investor deck
(“Banking Products in 1-Click · Agentic Islamic Finance Platform”).

**Live demo (GitHub Pages):** https://evgenymuravev-netizen.github.io/Digital_aristotle/

## What’s inside

- **118 key scenarios**, deep-linked from the scenario explorer (left panel / ☰ button on mobile) —
  onboarding, bank linking, payments, cards, AI agent, insights, goals, Islamic suite, consents, rewards.
- **Deck moments, pixel-faithful:** “Hi, John” home with *My money AED 275 900,76*, the credit-card
  agent (“I have selected three offers with a pre-approved limit for you”), the PS5 purchase,
  one-click Murabaha loan activation.
- **Onboarding modelled on the Lean Link recording (Apr 2026)** — same flow (intro sheet → bank picker →
  credentials → OTP “From Messages” → Wio two-step → FacePass), rebuilt as **Noor Connect** on CBUAE
  Open Finance rails and **enhanced**: bank-side auth (no credential storage), live progress steps,
  granular account selection, AA-style consent receipts, and an automatic SMS fallback where the
  original recording dead-ends on FacePass camera failure. Run scenario **#25 “Full Lean replica run”**.
- **All-banks balance screen** (scenario #35): FAB + Wio + Emirates Islamic grouped with per-bank
  subtotals, cash vs. net-worth toggle, sync state, add-bank and consent entry points.
- **Indian-fintech “wow” features, UAE-adapted:** INDmoney-style net worth, Fi-style Rules,
  Jar-style round-ups → gold, CRED-style card-bill pay with fee watchdog + rewards & scratch cards,
  Moneyview-style auto expense tracking, free AECB score with simulator, Sahamati/AA-style consent centre,
  plus a “Money Story” monthly recap.

## Run locally

No build step — plain HTML/CSS/JS:

```bash
cd noor-prototype && python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

`.github/workflows/deploy-pages.yml` publishes `noor-prototype/` to GitHub Pages on every push
to this branch (auto-enables Pages via `actions/configure-pages`).

---

*All data is fictional. Bank marks are illustrative monograms. Not affiliated with Lean Technologies —
the flow replica exists for product-research purposes only.*
