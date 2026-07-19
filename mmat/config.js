/* ============================================================
   MMAT — merchant / paywall configuration
   Edit THIS file to wire up real payments. The engine reads it
   from window.MMAT_CONFIG. Nothing here is secret (it ships to
   the browser), so only ever put public IDs here.
   ============================================================ */
window.MMAT_CONFIG = {
  /* ---- pricing shown on the paywall (research-backed: ~5x cheaper
         than the $79–$89 mainstream competitors) ---- */
  product:   "Mental Agility Test — Full Access",
  price:     "$15.99",
  priceNote: "one-time payment · all 10 tests + strategy guides · lifetime access",
  subPrice:  "$4.99/mo",
  subNote:   "or a monthly plan — cancel anytime",

  /* Where the Buy button sends people. Replace with your Lemon Squeezy
     (or Gumroad) checkout URL. */
  buyUrl: "https://example.lemonsqueezy.com/buy/REPLACE-ME",

  /* ---- access unlocking ----
     provider:
       "code"          → only the promo/comp codes in `accessCodes` unlock
                         (great for testing, reviewers, and giveaways — no
                          payment backend needed)
       "lemonsqueezy"  → validates the key against Lemon Squeezy's public
                         License API (no backend needed); set storeId + productId
       "gumroad"       → validates against Gumroad; set productId
                         (note: Gumroad's verify endpoint often needs a tiny
                          CORS proxy — see STRATEGY.md)
       "demo"          → ANY non-empty code unlocks (open testing)

     accessCodes ALWAYS work in every provider mode, so you can keep handing out
     comp codes even after wiring real payments. NOTE: these codes ship in the
     page source, so treat them as promo/testing codes, not hard security — the
     real paywall should use provider license keys once payments are live.
  */
  paywall: {
    provider: "code",
    accessCodes: ["ARISTOTLE-ALL-ACCESS", "MMAT-FREE-2026"],
    storeId:  null,   // Lemon Squeezy numeric store id (from your dashboard)
    productId: null,  // Lemon Squeezy product id  OR  Gumroad product_id
  },

  /* ---- Google Sign-In (optional) ----
     Paste an OAuth 2.0 Web client ID from Google Cloud Console
     (APIs & Services → Credentials). Leave blank to hide the button.
     Add your live domain to the client's "Authorized JavaScript origins".
     NOTE: with no backend this is identity display + local personalisation
     only — it is NOT server-verified auth. See PRELAUNCH.md. */
  google: {
    clientId: "",   // e.g. "1234567890-abc.apps.googleusercontent.com"
  },

  /* ---- Support tickets ----
     endpoint: a form backend that accepts a POST from the browser
       (Formspree / Web3Forms / Getform). Leave blank to fall back to a
       pre-filled email to `email`. */
  support: {
    endpoint: "",                 // e.g. "https://formspree.io/f/xxxxxxx"
    email: "support@example.com", // used for the mailto fallback
  },

  /* ---- Analytics (optional, privacy-friendly first) ----
     Set ONE of these. Plausible/Fathom are cookieless (no consent banner
     needed in most regions); GA4 needs a consent notice. */
  analytics: {
    plausibleDomain: "",  // e.g. "mmatpractice.com" → loads Plausible
    fathomSiteId: "",     // e.g. "ABCDEFGH"
    ga4Id: "",            // e.g. "G-XXXXXXX" (needs a cookie/consent notice)
  },

  /* ---- public site URL used in share text. Blank = the current page URL. */
  siteUrl: "",

  /* ---- leaderboard ----
     Blank endpoint = a local, this-device leaderboard (works immediately).
     For a true global all-time board, point this at a tiny backend that:
       • POST {name,pct,pctile,title,at}  → stores a row
       • GET                              → returns an array of those rows
     Easiest options: a Supabase table + REST endpoint, or a one-file
     serverless function (Cloudflare Worker / Vercel). See STRATEGY.md. */
  leaderboard: {
    endpoint: "",
  },
};
