# SAA — go-to-market & wiring notes

Concise notes for turning this from a working demo into a launched product. All of it is
config-driven (`config.js`) — no code changes required for the common paths.

## Positioning
A focused, vendor-neutral **systems-analyst knowledge check**: API/REST design, protocols,
the OSI model, messaging (RabbitMQ) and databases — the things asked in real analyst/BA
interviews and design reviews. Differentiators vs. generic quiz sites: a **free full-length
timed test**, a **deep per-choice "why"**, a **speed × accuracy** profile, and an **adaptive
weak-areas round**.

## Pricing
Set in `config.js` (`price`, `subPrice`, `buyUrl`). Default is a one-time **$17.99** (all ten
assessments + study guide, lifetime) with an optional **$5.99/mo**. Keep the one-time option
prominent — it's the main reason to choose this over subscription quiz sites.

## Payments (pick one — no backend needed)
- **Promo/comp codes** (default): `paywall.provider: "code"`, list codes in `accessCodes`.
  Ships in page source, so treat as promo/testing, not security.
- **Lemon Squeezy**: `provider: "lemonsqueezy"` + `storeId` + `productId`; validates license
  keys against Lemon Squeezy's public License API from the browser.
- **Gumroad**: `provider: "gumroad"` + `productId`; its verify endpoint often needs a tiny
  CORS proxy (a one-line Cloudflare Worker).

## Leaderboard (going global)
Blank `leaderboard.endpoint` = a local, this-device board (works now). For a true all-time
board, point it at a tiny endpoint that stores `{name,pct,pctile,title,at}` on POST and returns
the rows on GET. Easiest: a **Supabase** table + REST, or a one-file serverless function.

## Analytics
Set exactly one of `plausibleDomain` / `fathomSiteId` / `ga4Id`. Plausible/Fathom are cookieless
(usually no consent banner); GA4 needs a consent notice.

## SEO / GEO (be found by search *and* AI answer engines)
- Structured data is already embedded (WebApplication, WebSite, Article, FAQPage, BreadcrumbList).
- `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended.
- `llms.txt` gives answer engines a clean summary + topic list.
- Update the base URLs in `sitemap.xml` / `robots.txt` when you pick a domain, and set `siteUrl`
  in `config.js` so share text uses it.
- Target long-tail queries: "system analyst interview questions API REST", "OSI model quiz",
  "RabbitMQ exchange types explained", "REST vs SOAP", "database isolation levels quiz".

## Content roadmap
- Grow each form from 15 → 20–25 questions (the MMAT bank's size); add more `deep.js` entries.
- Add domains as needed: caching/CDNs, security (authn/authz, OWASP), system-design trade-offs,
  UML/requirements, observability.
