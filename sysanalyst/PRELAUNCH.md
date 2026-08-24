# SAA — pre-launch checklist

Everything below is optional to *run* the app, but worth doing before a public launch.

## Must do
- [ ] Set real **pricing** and a working **`buyUrl`** in `config.js` (or keep promo codes for a soft launch).
- [ ] Choose a **payment provider** (`paywall.provider`) and test an unlock end-to-end.
- [ ] Pick a **domain**; set `siteUrl` in `config.js` and update base URLs in `sitemap.xml` + `robots.txt`.
- [ ] Run `node sysanalyst/validate.mjs` and `node sysanalyst/test-engine.mjs` — both must be green.
- [ ] Proofread the bank once more; every answer key is human-authored (validators check structure, not truth).

## Should do
- [ ] Wire **analytics** (one of Plausible / Fathom / GA4) so you can see traffic and funnel.
- [ ] Wire **support** — a Formspree/Web3Forms endpoint (else it falls back to a mailto).
- [ ] Decide on the **leaderboard**: keep it local, or point `leaderboard.endpoint` at a backend.
- [ ] Add an **OG image** for nicer link previews (referenced by `og:*` tags).

## Google Sign-In (optional)
- Create an OAuth 2.0 **Web** client in Google Cloud Console → paste the client ID into
  `config.google.clientId`; add your live origin to "Authorized JavaScript origins".
- ⚠️ With no backend this is **identity display + local personalisation only** — it is *not*
  server-verified auth and must not gate anything sensitive. For real accounts, add a backend
  that verifies the Google ID token server-side.

## Data & privacy
- All progress, best scores, NPS, reports and the local leaderboard live in the browser's
  `localStorage` under the `saa:v1:` namespace — nothing is sent anywhere unless you configure
  an endpoint. If you add analytics/GA4 or a leaderboard backend, update your privacy note.

## Nice to have
- [ ] Grow forms to 20–25 questions and expand `deep.js`.
- [ ] A short explainer/demo for the landing page.
- [ ] Cross-link from the study guide to the specific weak topics after a result.
