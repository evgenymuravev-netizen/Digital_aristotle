# TradePay — marketing site (Synthesis edition)

An award-grade single-page marketing site for **TradePay**, the settlement-and-credit
rail for traditional trade in the Gulf.

> Credit that rides the flow. Finance the order, capture repayment at the source,
> approve more merchants at the same loss.

**Lives at** `/tradepay/synthesis/` so it sits **side-by-side** with the repository's
other TradePay surfaces without disturbing them:

| Surface | Path |
| --- | --- |
| This site (Synthesis edition) | `/tradepay/synthesis/` |
| Product site | `/tradepay/` |
| Clickable prototype | `/tradepay/prototype/` |
| Strategy brief | `/tradepay/strategy/` |

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Semantic, accessible page structure + content |
| `styles.css` | Full design system, layout, and animations |
| `app.js` | Scroll reveals, count-ups, sticky-chapter tracker, magnetic buttons, form |

No build step, no dependencies — pure HTML/CSS/JS. Open `index.html` in a browser,
or serve the folder statically.

## Design language

- **Palette** — near-black canvas (`#0a0a0c`) with a gold accent (`#FFC53D`)
- **Type** — Instrument Serif (display) · JetBrains Mono (annotation) · Geist (body)
- **Motif** — precise, technical, restrained luxury: hairline grid, crosshairs,
  an animated settlement-rail diagram, and a live merchant-app mockup

## Sections

Hero · key specs · the problem (collections) · the three chapters (Rail → Engine → Arm,
pinned scroll on desktop) · merchant experience · for distributors · the Engine ·
built for the Kingdom · the north-star metric · request access.

## Accessibility & polish

- Skip link, focus-visible rings, ARIA labels, semantic landmarks
- Full `prefers-reduced-motion` support (animations and SVG motion paused)
- Responsive from 360px to ultrawide; bulletproof scroll reveals that never strand content

## Notes

Performance figures shown on the page are design targets, not reported results.
