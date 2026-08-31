# System Analyst Assessment (SAA)

A self-contained, dependency-free practice test for **systems / integration / technical
business analysts**. It reuses the engine built for the Mental Agility Test (`../mmat/`)
with an entirely new, vendor-neutral question bank covering the fundamentals a working
systems analyst is expected to know.

**Domains**
- **APIs & REST** — REST principles & maturity, HTTP methods/status codes, idempotency,
  versioning, pagination, auth (OAuth/JWT), caching, and **good-vs-bad API design**.
- **Protocols** — REST vs SOAP, SOAP/WSDL/WS-Security, gRPC, GraphQL, WebSockets/SSE, HTTP/2–3.
- **Networking & OSI** — the seven layers, TCP vs UDP, DNS, TLS/HTTPS, encapsulation, L4/L7 balancing.
- **Messaging & Queues** — RabbitMQ (exchanges, bindings, acks, prefetch, DLQ/TTL),
  delivery guarantees, Kafka vs RabbitMQ, async patterns (pub/sub, outbox, saga).
- **Databases & Data** — SQL vs NoSQL, normalization, indexing, ACID, isolation levels,
  transactions, joins, keys, CAP & scaling.

## What you get (all inherited from the engine)
- A **free full test** — 20 questions across all five domains, timed to 15 minutes, no sign-up.
- **Ten timed forms** of 15 questions each, graded easy → hard.
- **Runtime interleaving** so no two adjacent questions share a topic.
- A **15-minute countdown** with pacing signs and a submit confirmation.
- **Results**: celebration, an estimated percentile (modelled, clearly labelled), a
  speed × accuracy profile with recommendations, per-answer "closeness", and worked
  answers with a **deeper per-choice "why"** + a "report broken logic" option.
- A **personalized test** built from your weakest topics after 3 completed tests.
- Config-gated **paywall** (promo/comp codes now; Lemon Squeezy/Gumroad license keys documented),
  optional **Google sign-in**, **support tickets**, an **analytics** loader, **share** buttons,
  and a **leaderboard** (local now, remote-ready).
- A free **study guide** (`guide.html`) and SEO/GEO scaffolding (structured data, robots.txt,
  sitemap.xml, llms.txt).

## Files
| File | Purpose |
|---|---|
| `index.html` | App shell (loads config → questions → deep → app) |
| `styles.css` | Theme + all components (shared design with the MMAT engine) |
| `app.js` | The engine (timing, interleaving, scoring, results, paywall, leaderboard…) |
| `questions.js` | The question bank — free test + 10 forms (`window.MMAT`) |
| `deep.js` | Premium per-question "why" explanations (`window.MMAT_DEEP`) |
| `config.js` | Merchant/paywall/analytics config (`window.MMAT_CONFIG`) |
| `guide.html` | Study guide with 1-2-3 tactics per domain |
| `validate.mjs` | Schema + answer-key + deep-mapping checks |
| `test-engine.mjs` | End-to-end engine test through a DOM shim |
| `build-standalone.mjs` | Bundles everything into one `standalone.html` |
| `robots.txt`, `sitemap.xml`, `llms.txt` | SEO / GEO |

> Note: the engine's global objects are still named `window.MMAT` / `window.MMAT_CONFIG` /
> `window.MMAT_DEEP` because the code is shared with the MMAT project — the **content** is
> what makes this the System Analyst Assessment. If you split this into its own repo, you can
> rename those globals across `app.js` + the data files in one pass.

## Run it
Just open `index.html` in a browser (works from `file://` — classic scripts, no build step).

## Verify it (pure Node, no dependencies)
```bash
node sysanalyst/validate.mjs      # schema, answer keys, deep-explanation mapping
node sysanalyst/test-engine.mjs   # grading, interleaving, paywall unlock, adaptive round
node sysanalyst/build-standalone.mjs   # optional: produce standalone.html
```

## Current bank
Free test: **25** questions (5 per domain). Ten forms: **20** each (4 per domain) = **200**.
**225 original questions** total, plus **20** hand-written deep explanations on the highest-value
items; every other wrong answer still gets a topic-aware "why" from the engine's generator.
Expand any form to 20–25 questions the same way the MMAT bank did — the engine renders whatever
is in `questions.js`.

## Making it its own product
This folder is fully self-contained. To move it to a dedicated repo/domain:
1. Copy the whole `sysanalyst/` folder to the new repo root (or keep it in a subfolder).
2. Set `siteUrl`, pricing, `buyUrl` and `paywall.provider` in `config.js`; update the base URLs
   in `sitemap.xml` / `robots.txt`.
3. (Optional) rename the `window.MMAT*` globals as noted above.
4. Add a Pages/host deploy and point DNS.

All content is original and vendor-neutral; technology names are referenced for description only.
