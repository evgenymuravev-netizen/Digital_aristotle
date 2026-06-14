# TradePay — sales site (Synthesis edition)

A buyer-facing **B2B sales site** for **TradePay**, the embedded settlement-and-credit
rail for traditional trade in the Gulf. Written to sell the product to prospects —
distributors, B2B marketplaces, and banks/lenders.

> Your merchants buy more. You get settled upfront. We carry the credit risk.

**Lives at** `/tradepay/synthesis/` so it sits **side-by-side** with the repository's
other TradePay surfaces without disturbing them:

| Surface | Path |
| --- | --- |
| This site (sales) | `/tradepay/synthesis/` |
| Product site | `/tradepay/` |
| Clickable prototype | `/tradepay/prototype/` |
| Strategy brief | `/tradepay/strategy/` |

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Semantic, accessible page structure + sales copy |
| `styles.css` | Full design system, layout, and animations |
| `app.js` | Scroll/mask reveals, scrollspy, pinned-platform tracker, solution tabs, chart draw, form |

No build step, no dependencies — pure HTML/CSS/JS. Open `index.html` in a browser,
or serve the folder statically.

## Design language

- **Palette** — near-black canvas (`#08080a`) with one gold accent (`#FFC53D`) and a
  deliberate light "paper" flip for editorial rhythm
- **Type** — Instrument Serif (display) · JetBrains Mono (annotation) · Geist (body)
- **Motif** — a precision financial instrument: terminal status bar, live settlement
  ticker, an engineering-blueprint schematic, a bespoke approval-frontier chart, a colophon

## Sections (the sales funnel)

Hero (outcome + *Book a demo*) · trust bar · pain → outcome split · how it works (3 steps) ·
the platform (Rail / Engine / Arm, pinned) · the **guarantee** (+15pp or you don't pay) ·
solutions by segment (tabbed) · what your merchants get · compliance · why TradePay
(comparison table) · FAQ · pricing + demo form.

## Accessibility & polish

- Skip link, focus-visible rings, ARIA tabs, semantic landmarks, native `<details>` FAQ
- Full `prefers-reduced-motion` support (animations and SVG motion paused)
- Responsive from 360px to ultrawide; bulletproof scroll reveals that never strand content

## Notes

Figures shown on the page (latency, uplift, NPL band, launch time, uptime) are
illustrative product targets, not reported results.
