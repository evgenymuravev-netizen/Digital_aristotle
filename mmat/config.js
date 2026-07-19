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
};
