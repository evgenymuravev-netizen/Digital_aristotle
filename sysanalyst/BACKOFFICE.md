# Back office — architecture (candidate + employer)

The current back office is a **working front-end prototype** with no server:

- `profile.html` — candidate profile: edit details, see results by domain, an
  integrity summary, and a checksum-stamped certificate. Reads the exam engine's
  own `localStorage`.
- `employers.html` — employer view: a directory (seeded demo candidates + your
  own profile if visible) with filters, and a **certificate verifier**.
- `store.js` — a **pluggable data layer** (`window.SAA_STORE`). Every method that
  today reads `localStorage` is the seam where you drop in `fetch()` calls to a
  real API. Swap the internals, keep the pages.

This is deliberately a prototype: profiles and the directory live per-device, and
certificates use a **public checksum** (tamper-evident, not forgery-proof). A real
product — where employers browse *shared, consented* candidates and trust a
badge — needs the backend below.

---

## Why a backend is unavoidable here

An employer browsing candidates who passed is, by definition, **multi-user shared
data with consent and identity**. That cannot be done in a static site:
- Candidate and employer **accounts** (server-verified, not the display-only
  Google button the engine ships with).
- A **database** of users, attempts, certificates, and employer orgs.
- **Consent & privacy** controls (a candidate must opt in to be discoverable;
  GDPR/PDPL rights: access, deletion, purpose limitation).
- **Server-signed certificates** so a badge can't be forged.

## Roles & data model

```
User        (id, email, auth_provider, role: candidate|employer|admin, created_at)
Candidate   (user_id, display_name, handle, headline, visible, region)
Employer    (user_id, org_name, seats, verified_org)
Attempt     (id, user_id, test_id, kind, score_pct, correct, total,
             per_cat jsonb, per_topic jsonb, elapsed_s, integrity jsonb,
             integrity_tier: practice|screened|verified, started_at, submitted_at)
Certificate (id 'SAA-XXXX-XXXX', user_id, attempt_id, payload jsonb,
             sig text, integrity_tier, issued_at, revoked_at)
IntegrityEvent (id, attempt_id, type, meta jsonb, ts)   -- streamed from the client
Consent     (user_id, scope, granted_at, revoked_at)     -- e.g. 'directory', 'proctoring'
```

## Auth
- OAuth (Google/GitHub/LinkedIn) or email magic-link → your own session/JWT.
- The client JWT is **display + convenience only**; every read/write is
  authorized **server-side** against the DB (never trust the client claim).
- Separate employer onboarding (verify the org/domain before directory access).

## API surface (what `store.js` should call)
```
GET  /me                          → profile + latest stats           (getProfile/stats)
PUT  /me                          → update profile, visibility        (saveProfile)
GET  /me/attempts                 → attempt history
POST /attempts                    → submit a graded attempt + integrity signals
POST /integrity/events            → stream signals during the test (Layer 2)
POST /certificates                → issue a server-SIGNED certificate  (makeCert)
GET  /certificates/:id            → public verify (or POST the code)   (verifyCert)
GET  /directory?min=&domain=&tier=&proctored=  → consented candidates  (directory)
POST /directory/contact           → employer → candidate outreach (with consent)
```
Keep the method names/shapes identical to `store.js` so the swap is mechanical.

## Certificates (do it properly)
- Server holds a private key. Payload = `{sub, name, stats, integrity_tier,
  issued_at, id}`; sign as a **JWS/JWT** (or Ed25519 detached sig).
- Verification is `GET /certificates/:id` (authoritative: reflects revocation and
  the *server's* integrity tier) — a pasted code is a convenience/offline check.
- Show the **integrity tier** on the badge (practice/screened/verified). The tier,
  not a checkmark, is the trust signal (see `INTEGRITY.md`).
- Support **revocation** (leaked item, retroactive flag) — the demo checksum can't.

## Privacy / consent (non-negotiable for the directory)
- Candidates are **invisible by default**; the directory only returns those with
  an active `directory` consent. Easy opt-out + hard delete.
- Data minimization: employers see scores/tiers/handle, not raw signal logs.
- Region + lawful-basis handling (GDPR/UAE PDPL); a DPA with any proctoring vendor.
- Audit who viewed/contacted whom.

## Suggested stack (fastest credible path)
- **Supabase** (Postgres + Auth + Row-Level Security + storage) — RLS enforces
  "candidates see only themselves; employers see only consented rows" in the DB.
- Or a thin serverless API (Cloudflare Workers / Vercel functions) + Postgres.
- Keep the site static; the pages just talk to the API via `store.js`.

## Migration path from this prototype
1. Stand up auth + the `User/Candidate/Employer` tables.
2. Point `store.js` `getProfile/saveProfile/stats` at `/me*` (drop `localStorage`).
3. Move attempt submission server-side; stream integrity events (`/integrity/events`).
4. Replace the checksum certificate with server-signed JWS + `/certificates/:id`.
5. Replace the demo directory with `/directory` behind consent + RLS.
6. Add the integrity tiers and (for Verified) a proctoring provider.

Everything the pages render already exists client-side; production is mostly
moving the **data layer** behind an authenticated API and making certificates +
consent real.
