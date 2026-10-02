# noor — clickable prototype

A deep, clickable HTML prototype for **Noor Finance**, built to the brand book
*Logo & Brand Identity* (Jul 2026): **terracotta `#FF6757`**, **electric blue `#337DFF`**,
the two-moon mark, Outfit type, and the *Know. Think. Act.* voice.

**Live:** https://evgenymuravev-netizen.github.io/noor/ · iPhone standalone: `/noor/app.html`

## What's inside
**204 deep-linked scenarios** across onboarding (UAE PASS / Apple / Google sign-in with
progressive KYC), open-finance account linking + a Perfios statement fallback, an all-banks
money view with personal/business scope, the agentic AI layer (reachable from every screen,
context-aware), a full Zakat engine (dual nisab, scholar picker, family wakāla), debt
intelligence and refinancing, cross-border family wealth, and the financing suite:

- **Qard Hasan salary line** — interest-free, capped at 10% of salary, AED 0 forever
- **Noor Ujrah Card** — revolving limit, flat monthly ujrah, interchange-funded
- **SME financing by video** — 10-step KYB journey: company docs, signatory, UBOs (with
  reused retail KYC), Ejari read from the trade licence, premises tour and a 15-minute plan
  video, the AED 100,000 offer, a timestamped Murabaha signing cascade, and direct debits

## Run
No build step — plain HTML/CSS/JS:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy
GitHub Pages serves this repo's `gh-pages` branch at `/noor/`.

---
*All data is fictional. Bank and fintech marks are illustrative. Noor is a technology company
and not a bank.*
