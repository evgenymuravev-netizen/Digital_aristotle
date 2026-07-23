# Pre-launch checklist

What's already built vs. what you still need before charging real money. Grouped
by "must have before launch", "do soon after", and "nice to have". Most config
lives in `config.js`; deployment + growth details are in `STRATEGY.md`.

Legend: ✅ built · ⚙️ built but needs your config · ⬜ not started (your action).

---

## 1. Payments & access
- ⚙️ **Checkout** — create the Lemon Squeezy product, set `buyUrl` + `provider:"lemonsqueezy"` + `storeId`/`productId` in `config.js`. (Gumroad fallback documented in STRATEGY.md.)
- ⚙️ **Promo/comp codes** — `accessCodes` in `config.js` (currently `ARISTOTLE-ALL-ACCESS`, `MMAT-FREE-2026`). Rotate before launch if you shared them publicly.
- ⬜ **Test a real purchase end-to-end** — buy at $0.01 (or use a coupon), confirm the emailed licence key unlocks, then refund. Do this on the live domain.
- ⬜ **Refund policy** — write one (e.g. "no-quibble 14-day refund"). Reduces chargebacks; Merchant-of-Record (Lemon Squeezy/Gumroad) handles the mechanics.
- ✅ Client-side gate degrades gracefully (disabled "Checkout coming soon" while unconfigured).

## 2. Legal & privacy (needed to take payments + run analytics)
- ⬜ **Privacy Policy** — required by Google Sign-In, analytics, and app stores; say what you store (local only + any analytics/auth). Generate one and link it in the footer.
- ⬜ **Terms of Service** — what the product is, no-warranty, the McQuaig disclaimer (already on-page), acceptable use.
- ⬜ **Cookie / consent notice** — *not needed* if you use **Plausible/Fathom** (cookieless). **Required** if you enable **GA4** (it sets cookies) — add a consent banner for EU/UK/CA visitors.
- ⬜ **"Not affiliated with McQuaig" disclaimer** — ✅ already shown on the home page, guide and footer; keep it.
- ⬜ **Contact/business identity** — a real support email and, if selling in the EU, a business name/address (your MoR may require it).

## 3. Analytics & tracking
- ⚙️ **Web analytics** — set ONE of `analytics.plausibleDomain`, `analytics.fathomSiteId`, or `analytics.ga4Id` in `config.js` (loader is built; nothing loads until set). **Recommendation: Plausible or Fathom** — cookieless, no consent banner, ~$9–14/mo.
- ⬜ **Conversion tracking** — decide your key events (start free test → finish → hit paywall → purchase). Add simple event calls at those points (I can wire `plausible()`/`gtag()` events on request).
- ⬜ **Bing Webmaster Tools + Google Search Console** — verify the domain, submit `sitemap.xml`. Bing indexation ≈ ChatGPT-search eligibility (see STRATEGY.md).
- ⬜ **AI-answer tracking** — the weekly prompt-log + GA4 "AI Traffic" channel from STRATEGY.md.

## 4. Accounts / auth
- ⚙️ **Google Sign-In** — create an OAuth Web client (Google Cloud Console), add your live domain to *Authorized JavaScript origins*, paste the id into `config.google.clientId`. Button appears automatically; nothing loads if blank.
- ⬜ **Honest limitation** — with no backend this is identity display + local personalisation only; progress still lives in each browser. If you want real cross-device accounts + saved history, you need a small backend (Supabase/Firebase are the quickest). Flag on the roadmap.

## 5. Support
- ⚙️ **Support tickets** — built (Support screen). Set `support.endpoint` (Formspree/Web3Forms) or it falls back to a pre-filled email to `support.email`. Set a real address.
- ⬜ **Auto-reply + SLA** — a simple "we reply within 1 business day" line sets expectations.
- ⬜ **FAQ/help** — the guide's FAQ covers the test; add 3–4 *product* FAQs (refunds, "code not working", "does it work on mobile").

## 6. SEO / social / discovery
- ✅ Structured data (Article/FAQ/Breadcrumb/WebApplication), semantic HTML, answer-first content, `robots.txt` (AI crawlers allowed), `sitemap.xml`, `llms.txt`.
- ⬜ **Set the real domain** — replace `YOURDOMAIN.com` in `robots.txt` + `sitemap.xml`, and make the `<link rel="canonical">` / `og:*` URLs absolute in `index.html` + `guide.html`.
- ⬜ **Social share image** — add a real `og:image` (1200×630 PNG) so links unfurl nicely on X/LinkedIn/WhatsApp. (Currently none — links will look plain.)
- ⬜ **Favicon set** — you have an emoji SVG favicon; add PNG/apple-touch-icon for older devices (optional).

## 7. Quality / trust
- ⬜ **Cross-browser + mobile pass** — Safari/Chrome/Firefox + a phone. The layout is responsive; verify the exam bar, palette and paywall on a small screen.
- ✅ **Accessibility basics** — semantic landmarks, focus states, reduced-motion, ARIA on the timer/options. Do a quick keyboard-only run before launch.
- ✅ **Automated checks** — `validate.mjs`, `check-answers.mjs`, `test-engine.mjs`. Run them in CI on every change (add a tiny GitHub Action).
- ⬜ **Error monitoring** — optional Sentry (free tier) to catch client-side exceptions in the wild.
- ⬜ **Performance** — it's a static site, so it's already fast; just compress the (future) og-image and keep `questions.js` lean.

## 8. Growth (post-launch, from STRATEGY.md)
- ⬜ Email capture (offer a bonus tip sheet for an address) — needs an ESP (e.g. Buttondown/MailerLite).
- ⬜ Reddit/Quora presence, brand mentions, a YouTube walkthrough.
- ⬜ More long-tail guide pages ("what is a good MMAT score", "MMAT vs Wonderlic").

---

## Minimum to launch (the short list)
1. Real domain + deploy `mmat/` as root, fix the `YOURDOMAIN`/canonical placeholders.
2. Lemon Squeezy product live + a successful test purchase.
3. Privacy Policy + Terms + refund policy linked in the footer.
4. Analytics on (Plausible/Fathom = no consent banner).
5. Real `support.email` (and ideally a Formspree endpoint).
6. `og:image` so shared links look legit.
7. Verify in Bing + Google Search Console, submit the sitemap.

Everything else can be a fast-follow.
