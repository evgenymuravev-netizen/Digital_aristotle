# Detecting cheating & AI use — an honest strategy

The blunt truth first: **you cannot reliably stop someone using AI on an
unproctored, online multiple-choice test.** The cheat that defeats every
client-side trick is trivial — read the question off the screen, type it into
an AI on a *phone*, read the answer back. The test device sees nothing.

So the goal isn't "prove they didn't cheat" from the browser. It's a **layered
system**: cheap deterrents + flags in the browser, statistical detection on the
server, and — for anything an employer will rely on — a **proctored or live
tier** that is actually trustworthy. Below is what each layer buys you, what's
already built here, and what to build next.

---

## Layer 1 — Client-side behavioural signals (built: `integrity.js`)

Runs entirely in the browser during the test, writes an integrity report to the
results screen + `localStorage`, and feeds the certificate. **Deterrent-grade.**

What it captures while the exam is active:
| Signal | Why it matters | Beaten by… |
|---|---|---|
| Tab/visibility changes + time hidden | Alt-tabbing to an AI/search tab | a second device |
| Window blur / focus loss | Switching apps mid-question | a second device |
| Paste / copy / cut events | Pasting answers in, or copying questions out | retyping / phone |
| Right-click / context menu | Copying text, opening devtools | a second device |
| Per-answer timing | "Too fast to have read it"; robotic uniformity | pacing the cheat |

It turns these into a 0–100 score and a `clean / review / flagged` verdict.
**Weaknesses (by design, stated in the UI):** all of it is client JS — it can
be disabled, and none of it sees a second device. Treat it as *friction and a
triage flag*, never as proof.

Cheap hardening still worth adding:
- **Request fullscreen** on start; count fullscreen exits (another alt-tab tell).
- **Disable paste** into answers and copy on the question text (deterrent only).
- **Blur the question** when the tab loses focus (raises the cost of off-screen capture).
- Log signals to the server as they happen (so disabling JS/localStorage is itself suspicious).

## Layer 2 — Server-side statistical detection (needs the backend)

This is where real signal lives, because it compares a candidate against the
**population**, which they can't see or game.

- **Speed-vs-difficulty curve.** Humans are slower on hard items and faster on
  easy ones. AI-assisted takers are often *fast and flat*, or invert the curve
  (nailing an obscure item quickly but fumbling an easy phrasing). Flag takers
  whose per-difficulty timing is many SDs from the norm.
- **Too-good, too-fast.** High accuracy on `diff:3` items with sub-read-time
  latency is the single strongest online tell.
- **Answer-pattern fingerprinting.** LLMs have consistent option preferences and
  fail on specific misconceptions. Correlate a taker's choices with a known
  "model answer key" — high correlation on the *hard* subset is suspicious.
- **Canary / honeypot items.** Seed a few questions whose *most confident wrong
  answer is the one an LLM reliably gives* (a popular misconception). A human who
  knows the topic avoids it; a copy-paste-into-AI taker walks into it. This is
  cheap, powerful, and invisible to the candidate. (Tag them in `questions.js`
  and score them separately server-side.)
- **Keystroke / interaction dynamics.** Cadence, mouse paths, no scrolling on
  long prompts → automation or off-screen reading.
- **Environment & network.** Impossible travel, datacenter IPs, multiple
  attempts from one device, headless-browser fingerprints.
- **Cross-attempt correlation.** Same wrong-answer signature across "different"
  candidates → a shared answer key doing the rounds.

Score these into a risk model; auto-`review` the borderline, auto-`flag` the
egregious, and never hard-fail on client signals alone.

## Layer 3 — Proctoring (needs backend + consent)

The only client-side path to genuine assurance, and it's heavy:
- **Record + review**: webcam, screen, and mic captured, reviewed by AI then a
  human on flag. Detects phones, second screens, other people, lip-syncing.
- **Live proctor** for high stakes.
- **Lockdown browser**: blocks new tabs, copy/paste, VMs, screen-share.
- **ID verification** at the door (match face to a government ID).

All of this needs explicit consent, a privacy/DPA basis, storage, and a review
queue. It's the difference between "practice score" and "certified".

## Layer 4 — Make the test AI-resistant by design (cheapest, most durable)

Don't only detect the cheat — reduce its payoff:
- **Personalized / scenario items.** "Given *this* attached OpenAPI spec / this
  RabbitMQ topology, what breaks?" Pasting a bespoke artifact into an AI is
  slower and often wrong; it also lets you grade reasoning, not recall.
- **Oral / video follow-up.** A 5-minute recorded "explain your answer to Q7"
  is brutally hard to fake and is what actually convinces an employer.
- **Item churn + large pools.** Rotate items, retire leaked ones, randomize
  order and option order (already interleaved here).
- **Time pressure** (already 15 min) compresses the room to consult AI.

---

## The product answer (what to tell employers)

Model it as **tiers**, and make the employer-facing badge mean the top tier:

1. **Practice / self-assessment** — unproctored, client signals only. Great for
   learning; *not* a hiring signal. (This is what the site is today.)
2. **Screened** — unproctored + Layer-2 server analysis. "No red flags" — a
   filter, not a guarantee.
3. **Verified** — proctored (Layer 3) and/or an oral follow-up (Layer 4). This
   is the one an employer should trust; the certificate/directory should show
   the tier explicitly.

Honesty is a feature: showing employers *how* a result was obtained (and its
integrity tier) is more valuable — and more defensible — than a green checkmark
that pretends an unproctored MCQ is proof.

## What's implemented here vs. next

- ✅ **Built:** Layer 1 signals (`integrity.js`), verdict on results + profile,
  integrity tier carried on the certificate, employer view shows the tier.
- ⏳ **Next (needs backend, see `BACKOFFICE.md`):** stream signals server-side;
  Layer-2 statistical model; canary-item scoring; proctoring integration
  (e.g. a provider SDK) for the Verified tier.
