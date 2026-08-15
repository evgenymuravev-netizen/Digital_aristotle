# noor — Agentic Islamic Finance Platform · Clickable Prototype

A deep, clickable HTML prototype of the **Noor** app from the May 2026 investor deck
(“Banking Products in 1-Click · Agentic Islamic Finance Platform”).

**Live demo (GitHub Pages):** https://evgenymuravev-netizen.github.io/Digital_aristotle/mal/ — the
**Mal** prototype is the live build. The original Noor-branded build is retired from the site
(source kept in `noor-prototype/`, unpublished). The site root serves `main`'s own landing page.

## What’s inside

- **175 key scenarios**, deep-linked from the scenario explorer (left panel / ☰ button on mobile) —
  onboarding, bank linking, payments, cards, AI agent, insights, goals, Islamic suite, consents, rewards,
  a “Beyond banks” group (wallets/BNPL/crypto linking, Tabby-vs-Tamara-vs-Noor-Split checkout, invest upsell),
  and a “Zakat, properly” group: dual nisab (85 g gold / 595 g silver), declared assets banks can’t see
  (home cash, trade stock, jewellery), an AI interview citing the four schools with a scholar picker
  (Taqi Usmani / UAE Awqaf / Ibn ‘Uthaymeen / AAOIFI SS 35), family wakāla mode, and Ramadan-eve timing.
- **Deck moments, pixel-faithful:** “Hi, John” home with *My money AED 275 900,76*, the credit-card
  agent (“I have selected three offers with a pre-approved limit for you”), the PS5 purchase,
  one-click Murabaha financing activation.
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

GitHub Pages serves the `gh-pages` branch. `.github/workflows/deploy-pages.yml` re-syncs
`noor-prototype/` to `gh-pages` on every push, so edits publish automatically.

---

*All data is fictional. Bank marks are illustrative monograms. Not affiliated with Lean Technologies —
the flow replica exists for product-research purposes only.*

## iPhone standalone demo (no explorer menu)

Separate link: **https://evgenymuravev-netizen.github.io/Digital_aristotle/app.html** — loads the phone
UI fullscreen (kiosk mode, no scenario sidebar). On iPhone: open in Safari → Share → **Add to Home
Screen** → launches standalone with the noor icon like an installed app. Scenario deep links still
work (`app.html#s/27`). Arabic/RTL: Profile → Language → العربية.

## mal.ai-branded twin (unofficial concept)

The same prototype re-branded for **mal.ai** (radiant gold on midnight indigo, «مال» wordmark):

- Explorer: **https://evgenymuravev-netizen.github.io/Digital_aristotle/mal/**
- iPhone standalone: **https://evgenymuravev-netizen.github.io/Digital_aristotle/mal/app.html**

Canonical source lives on branch `claude/mal-ai-prototype` (`mal-prototype/`, PR #8);
`noor-prototype/mal/` is a vendored publish copy — re-vendor it when that branch changes.
Unofficial concept, not affiliated with or endorsed by mal.ai.

## How this Pages site is assembled

Pages runs in **GitHub Actions** mode. `.github/workflows/deploy-pages.yml` on this branch builds
the composite site, force-pushes it to `gh-pages`, then dispatches `deploy-pages.yml` on `main`
(the only ref the `github-pages` environment accepts) to deploy it:

| Path | Content |
| --- | --- |
| `/` | `main`'s root, verbatim — the Digital Aristotle / MMAT landing page, `tradepay/`, `test/` |
| `/mal/` | the Mal clickable prototype (from `noor-prototype/mal/`) |
| `/aristotle/` | redirect to `/` (kept for older links) |

⚠️ **`deploy.yml` on `main` publishes main's root alone on every push to `main`, which removes
`/mal/` from the live site.** That is what happened on 14 Aug 2026. To restore it, re-run
*Actions → Publish Mal prototype to GitHub Pages → Run workflow*. To make it permanent, copy
`mal/` into `main` (then main's own deploy serves it) or adjust `deploy.yml` there.
