# MMAT practice — go-to-market strategy

Everything here is research-backed (sources linked inline). It covers **pricing**,
the **paywall** (already scaffolded in `config.js` + `app.js`), a **domain**
shortlist, **deployment**, and how to get **found in AI search** (ChatGPT / Claude /
Gemini / Perplexity). Dates and prices were gathered June–July 2026 — eyeball any
headline number on the live page before you spend money.

---

## TL;DR — the plan

1. **Price:** `$15.99` one-time for Full Access (all 10 tests + guides), plus an optional `$4.99/mo`. That's ~5× cheaper than the mainstream competitors ($79–$89).
2. **Sell + unlock with Lemon Squeezy** (Merchant of Record, so it handles VAT/sales tax; its License API validates keys straight from the browser — no backend). Gumroad is the fallback.
3. **Domain:** register a `.com` at **Porkbun** (~$11/yr) — e.g. `mmatpractice.com` / `mindmettle.com`. Grab it before the **1 Nov 2026** `.com` price rise.
4. **Deploy** the `mmat/` folder as its own site root and point the domain at it; then set the real URL in `config.js`, the `<link rel=canonical>` tags, `sitemap.xml` and `robots.txt`.
5. **Get cited by AI:** the site is already static HTML with the right schema, robots rules and answer-first content. The rest is off-site — brand mentions, a Reddit presence, Bing Webmaster Tools.

---

## 1. Pricing (≈5× cheaper than competitors)

**What competitors charge (one-time practice product, USD):**

| Vendor | Product | Price | Model |
| --- | --- | --- | --- |
| JobTestPrep | Single PrepPack (incl. McQuaig) | **$79–$89** | one-time, time-limited |
| GraduatesFirst | Go Premium | $67 (list $160) | one-time, lifetime |
| JobAssessmentHelp | "Get Everything" bundle | $59 | one-time |
| Prepterminal | Per course | ~$49–$98 | one-time |
| Assessment-Training | All-tests package | £29.95 (~$38) | one-time, 30-day |
| Aptitude-Test.com | McQuaig prep account | $29 | one-time, 6-month |
| How2Become | McQuaig pack | £9.99 (~$13) | one-time |
| TestHQ | Premium membership | from $119/£99 | subscription |

- **Typical one-time price: ~$50–$80; median ≈ $49–$59.** Mainstream branded players cluster at **$59–$89**.
- Sources: [JobTestPrep McQuaig](https://www.jobtestprep.com/mcquaig-mental-agility-test), [Aptitude-Test.com McQuaig](https://aptitude-test.com/publishers/mcquaig/mmat/), [Assessment-Training](https://www.assessment-training.com/mcquaig-mental-agility-test), [TestHQ](https://www.testhq.com/premium-membership), [How2Become](https://www.how2become.com/mcquaig-assessment-practice-tests/). The official McQuaig Institute sells the real MMAT **B2B to employers only** (~$1,500/quarter+), not to candidates — so all candidate practice is third-party.

**Our price (set in `config.js`):**
- **`$15.99` one-time — Full Access, lifetime, all 10 tests + guides.** ~5× cheaper than $79; undercuts everyone except How2Become's thin pack while offering far more.
- **`$4.99/mo`** optional on-ramp. Keep the one-time deal the hero to dodge the auto-renew complaints competitors get on Trustpilot.
- Alt: `$19.99` if you want more margin — still reads "~4–5× cheaper."
- **Free tier stays free** (the 5-minute taster) — it's the top of the funnel and your best SEO/AI-citation asset.

---

## 2. Paywall — serverless, already scaffolded

The engine ships a working unlock flow (`renderPaywall` / `validateCode` in `app.js`). It runs in **demo mode** now: any non-empty code unlocks so you can test. To go live, edit **`config.js`**.

### Recommended: Lemon Squeezy (Merchant of Record + browser-callable licences)
It's the only platform that is *both* MoR (you never touch VAT/sales tax) *and* has a public, unauthenticated License API meant for exactly this no-backend pattern. Fee: **5% + $0.50**.

1. Create the product in Lemon Squeezy; enable **license keys** (set an activation limit + optional expiry).
2. Copy your **store id** and **product id** into `config.js`:
   ```js
   paywall: { provider: "lemonsqueezy", storeId: 12345, productId: 67890 }
   ```
3. Set `buyUrl` to your checkout link. Buyers get a key by email; they paste it into the site, which validates it via `POST https://api.lemonsqueezy.com/v1/licenses/validate` (no secret — the code is already written and checks `status: active` **and** that the key belongs to *your* store/product).
4. Docs: [License API](https://docs.lemonsqueezy.com/api/license-api) · [Validate](https://docs.lemonsqueezy.com/api/license-api/validate-license-key). Note Lemon Squeezy is being folded into **Stripe** ([2026 update](https://www.lemonsqueezy.com/blog/2026-update)) — the License API still works; confirm it's onboarding new sellers.

### Fallback: Gumroad
Also Merchant of Record (since Jan 2025); `verify` needs no secret. Catch: its endpoint often **fails browser CORS**, so you'll likely need a tiny **Cloudflare Worker** proxy (free). Set `provider: "gumroad"` + `productId`. Fee is ~10% (confirm whether processing stacks on top at the $5–10 level).

### Honest security note
Any static/client-side paywall is **bypassable** — the content ships to the browser to be shown, so a determined user can extract it. That's fine friction for a cheap product (it stops casual sharing) but it isn't DRM. If you ever want hard protection, move validation **and** content delivery behind a small serverless function.

---

## 3. Domain

**Where to buy:** **Cloudflare Registrar** is at-cost (wholesale + ICANN, ~$10.44 `.com`) but only for domains you transfer in and run on Cloudflare DNS. **Porkbun** is the cheapest full-service registrar (~$11 `.com`, free WHOIS privacy/SSL) and the best place to register fresh. **Avoid `.io`/`.co`** — expensive renewals. **Namecheap** is priciest on renewal.
Sources: [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/), [Porkbun](https://porkbun.com/products/domains).

**Timing:** the `.com` wholesale fee rises ~7% on **1 Nov 2026** ([DomainNameWire](https://domainnamewire.com/2026/04/23/breaking-verisign-raising-wholesale-com-prices/)) — register before then to lock the lower rate.

**Candidate names** (check availability — I can't verify registration): `mmatpractice.com`, `mmatprep.com` (great search-intent match), `mentalagility.com` (likely taken), `agilityprep.com`, `mindmettle.com`, `quickwits.com`, `cognisharp.com`, `sharpenmind.com`, `mindaptitude.com`, `aptitudesharp.com`. Exact-match (`mmatpractice`) is strongest for SEO; `mindmettle`/`quickwits` are more brandable if you expand beyond one test.

---

## 4. Deployment

The product lives in `mmat/`. To publish it on its own domain:
- **Serve `mmat/` as the site root** (point the host/domain at that folder), so `robots.txt` and `sitemap.xml` sit at the domain root where crawlers expect them. On GitHub Pages you can deploy the repo and use `/mmat/`, but a custom domain mapped to the folder is cleaner for SEO.
- After the domain is live, **find-and-replace `YOURDOMAIN.com`** in `sitemap.xml` and `robots.txt`, and set absolute URLs in the `<link rel="canonical">` and `og:*` tags of `index.html` and `guide.html`.
- It's a static site (no build step) — the whole folder can go on Pages, Netlify, Cloudflare Pages, etc.

---

## 5. Get found in AI search (GEO) + classic SEO

The single biggest technical risk for AI visibility is client-side rendering — **AI crawlers (GPTBot, ClaudeBot, PerplexityBot) don't run JavaScript**, only Gemini does ([Vercel, 500M+ crawls](https://vercel.com/blog/the-rise-of-the-ai-crawler)). Our **content is in the raw HTML** (the guide especially), so we're on the right side of this. What's already done vs. what you must do:

**Already implemented ✅**
- Static HTML with the answer text in the source (view-source shows it).
- `robots.txt` allowing the **retrieval/citation** bots (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot) — being allowed here is what makes you *citable* ([OpenAI bots](https://developers.openai.com/api/docs/bots), [Anthropic](https://support.claude.com/en/articles/8896518)).
- **Answer-first structure:** every guide section is a real user question (H2) with a 40–60-word direct answer, then detail — the format AI engines extract.
- **Concrete stats + sources:** the guide states the format (≈50 Q / 15 min / ~18 s each) and cites its claims. Adding statistics/quotes/citations is the only on-page lever with peer-reviewed backing ([Princeton/GT GEO paper, KDD 2024](https://arxiv.org/abs/2311.09735) — quotes +41%, stats +31%, cite-sources +30%; keyword stuffing does nothing).
- **Structured data:** `Article` + `BreadcrumbList` + `FAQPage` on the guide; `WebApplication` + `Offer` on the home page.
- **"Updated" date** on the guide (recency is a consistent signal).

**Your off-site to-do (this is ~75% of the game — [Ahrefs, 75k brands](https://ahrefs.com/blog/ai-brand-visibility-correlations/)):**
1. **Verify in [Bing Webmaster Tools](https://www.bing.com/webmasters)** and submit the sitemap. ChatGPT search runs on Bing (~87% of SearchGPT citations match Bing's top results) — Bing indexation ≈ ChatGPT eligibility. Do the same in [Google Search Console](https://search.google.com/search-console).
2. **Earn brand mentions** across independent sites (career/HR blogs, roundups, a YouTube walkthrough of the MMAT). Branded mentions correlate with AI visibility ~3× more than backlinks; YouTube mentions are the single strongest factor.
3. **Authentic Reddit/Quora presence** (r/jobs, r/recruitinghell, test threads). Reddit is a top-cited domain in AI answers; write complete, genuinely helpful comments — no astroturfing. Expect 60–90 days to show up.
4. **Publish more long-tail question pages** over time (one per query cluster): "what is a good MMAT score", "MMAT vs Wonderlic", "McQuaig test free practice". Comparison/listicle formats get cited most.
5. **Track it (free):** run ~10 prompts weekly across ChatGPT/Perplexity/Claude/Gemini and log mentions; add a GA4 "AI Traffic" channel; watch server logs for the retrieval bots.

**Skip:** `llms.txt` as a growth lever — [evidence shows it's essentially unread today](https://ahrefs.com/blog/llmstxt-study/) (we included a minimal one only as a harmless hedge). Don't expect schema alone to drive citations either (Google [retired FAQ rich *results* on 7 May 2026](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/), though the markup is still parsed).

---

## 6. Launch checklist

- [ ] Pick + register a domain (Porkbun `.com`, before 1 Nov 2026).
- [ ] Create the Lemon Squeezy product with license keys; set `provider`, `storeId`, `productId`, `buyUrl` in `config.js`.
- [ ] Do a real $0.01 test purchase → confirm the emailed key unlocks the site.
- [ ] Deploy `mmat/` as the site root; set absolute URLs in canonical/OG/`sitemap.xml`/`robots.txt`.
- [ ] Verify Bing Webmaster Tools + Google Search Console; submit sitemap.
- [ ] Seed 2–3 genuinely useful Reddit answers and one YouTube walkthrough.
- [ ] Start the weekly AI-prompt tracking sheet.
