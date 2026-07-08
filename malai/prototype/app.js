'use strict';
/* mal.ai clickable prototype — hash-routed guided tour.
   Everything is scripted and deterministic so the demo never stalls. */

const $ = s => document.querySelector(s);

/* ---------------------------------------------------------------- chat scripts
   A script is an array of BEATS; a beat is an array of items:
   {sys} divider · {u} user msg · {m} Mal msg (HTML) · {tools:[{t,r}]} tool calls
   {card, cls} rich card HTML · {chips:[...]} tappable suggestions (last beat only) */

const FIN_CHAT = [
  [ // beat 0 — the need, and consent asked in the open
    { sys: 'Today · 9:41' },
    { m: 'Sabah al-khair, Sara ☀️ What can I do for you today?' },
    { u: 'I need a car. I’m looking at a Hyundai Tucson — around SAR 85,000.' },
    { m: 'Nice choice. I can finance that — first let me check what fits your budget <b>comfortably</b>. May I look at your salary-account cashflow (6 months) and your SIMAH credit file? I’ll use them for this decision only.' },
    { card: `
      <h4><small>Consent · single use · expires in 15 min</small>Mal is requesting access to</h4>
      <div class="krow"><span>◧ Open banking — salary account cashflow</span><b>read-only</b></div>
      <div class="krow"><span>◫ SIMAH — credit bureau file</span><b>one pull</b></div>
      <div class="note">You’ll see every check Mal runs, live, with its result. Nothing is pulled silently.</div>` },
    { chips: ['Allow both', 'What exactly will you see?'] },
  ],
  [ // beat 1 — underwriting happens in the open
    { u: 'Allow both.' },
    { tools: [
      { t: 'open_banking.cashflow(months=6)', r: 'salary SAR 18,500/mo · stable · avg spend SAR 11,200' },
      { t: 'simah.credit_file()', r: 'score 812 · 1 obligation SAR 1,900/mo · 0 defaults' },
      { t: 'policy.dbr_check(new_instalment=2,054)', r: 'DBR 21.4% — under SAMA 33.3% cap ✓' },
    ]},
    { m: 'Good news — you qualify comfortably. With the Tucson instalment you’d commit <b>21.4%</b> of income, well under SAMA’s 33.3% responsible-lending ceiling. Headroom stays for savings and zakat.' },
    { card: `
      <h4><small>Affordability · SAMA responsible lending</small>What you can carry</h4>
      <div class="krow"><span>Monthly salary (verified)</span><b>SAR 18,500</b></div>
      <div class="krow"><span>Existing obligations</span><b>SAR 1,900</b></div>
      <div class="krow"><span>New car instalment</span><b>~SAR 2,054</b></div>
      <div class="krow total"><span>Debt-burden ratio</span><b class="ok">21.4% ✓</b></div>
      <div class="note">Your ceiling at 33.3% would be SAR 4,260/mo — Mal will never structure you to the ceiling.</div>` },
  ],
  [ // beat 2 — the structure, explained before it's chosen
    { u: 'How would the financing work? I don’t want anything that feels like a disguised loan.' },
    { m: 'Fair ask. For a <b>car — a real asset</b> — the cleanest structure is <b>Murabaha</b>: mal.ai buys the Tucson, owns it (and carries the risk), then sells it to you at cost plus one fixed, disclosed profit. The alternative, <b>Tawarruq</b>, raises cash through commodity trades — flexible, but costlier and less direct. Side by side:' },
    { card: `
      <div class="compare">
        <div class="opt pick"><b>Murabaha</b><small>We buy the car and sell it to you at cost + fixed profit. A real sale — you know every riyal on day one.</small><div class="price">profit SAR 13,600 · APR-eq 7.6%</div></div>
        <div class="opt"><b>Tawarruq</b><small>Commodity bought &amp; resold to put cash in your account. For needs with no asset behind them.</small><div class="price">profit SAR 15,300 · APR-eq 8.5%</div></div>
      </div>
      <div class="note">Both are Sharia-board approved (Fatwa #014, #019 · AAOIFI SS 8, SS 30). For an asset purchase, Murabaha is cheaper and structurally cleaner.</div>`, cls: 'gold' },
    { chips: ['Go with Murabaha', 'Explain the difference more'] },
  ],
  [ // beat 3 — the honest offer
    { u: 'Go with Murabaha.' },
    { tools: [
      { t: 'pricing.murabaha(cost=85,000, tenor=48mo)', r: 'fixed profit SAR 13,600 · schedule built' },
    ]},
    { m: 'Here is your offer — <b>all of it</b>. This number is frozen the moment you sign; nothing can ever make it grow:' },
    { card: `
      <h4><small>Murabaha offer · Hyundai Tucson 2026</small>The whole cost, before you say yes</h4>
      <div class="krow"><span>Car — cost price (invoice shown)</span><b>SAR 85,000</b></div>
      <div class="krow"><span>mal.ai profit — fixed, disclosed</span><b>SAR 13,600</b></div>
      <div class="krow total"><span>Total you repay — ever</span><b>SAR 98,600</b></div>
      <div class="krow"><span>48 monthly payments</span><b>SAR 2,054 <span style="font-weight:400">(final 2,062)</span></b></div>
      <div class="krow"><span>APR-equivalent, for comparison</span><b>7.6%</b></div>
      <div class="note ok">No late fees — a missed month triggers a SAR 100 pledge to charity, none of it to mal.ai. Settle early and unearned profit is rebated (ibra’).</div>`, cls: 'gold' },
    { chips: ['Accept the offer', 'Show the full schedule'] },
  ],
  [ // beat 4 — the Murabaha sequence, executed in the open
    { u: 'Accept the offer.' },
    { m: 'Executing your Murabaha now — watch each step. The order <b>is</b> the compliance: a real purchase, real ownership, then a real sale:' },
    { card: `
      <div class="seq">
        <div class="st done"><span class="dot">✓</span><div><b>mal.ai buys the Tucson</b><small>Al Majdouie Motors, Riyadh — SAR 85,000 paid</small><span class="stamp">10:07:12 ✓</span></div></div>
        <div class="st done"><span class="dot">✓</span><div><b>Ownership &amp; risk pass to mal.ai</b><small>Vehicle insured under the bank — if it’s damaged now, that’s our loss</small><span class="stamp">10:07:58 ✓</span></div></div>
        <div class="st now"><span class="dot">3</span><div><b>Sale offered to you</b><small>Cost SAR 85,000 + disclosed profit SAR 13,600 = SAR 98,600</small></div></div>
        <div class="st"><span class="dot">4</span><div><b>You accept &amp; sign</b><small>Nafath e-signature — the price freezes at SAR 98,600, forever</small></div></div>
      </div>` },
    { card: `
      <div class="signbox"><div class="nafath">NAFATH · NATIONAL SINGLE SIGN-ON</div>
      <div class="num">47</div><small>Open the Nafath app and tap <b>47</b> to sign the Murabaha sale contract</small></div>` },
    { chips: ['I signed — 47'] },
  ],
  [ // beat 5 — done, and the relationship begins
    { tools: [
      { t: 'nafath.verify(challenge=47)', r: 'identity confirmed · contract sealed' },
      { t: 'contracts.register(MRB-2026-0847)', r: 'schedule live · dealer notified' },
    ]},
    { m: 'Mabrouk, Sara 🎉 The Tucson is yours — pickup at Al Majdouie Riyadh from Thursday. Contract <b>MRB-2026-0847</b> is live in your Financing tab.' },
    { card: `
      <h4><small>Contract MRB-2026-0847 · live</small>What happens next</h4>
      <div class="krow"><span>First payment — 1 Aug</span><b>SAR 2,054</b></div>
      <div class="krow"><span>Total — fixed forever</span><b>SAR 98,600</b></div>
      <div class="krow"><span>Early settlement</span><b class="ok">ibra’ anytime</b></div>
      <div class="note">If a month ever looks tight, tell me <i>before</i> it happens — deferring costs nothing here.</div>` },
    { m: 'One more thing — I set your debit date 3 days after payday, as your cashflow suggests. Want me to round up card spend into your Mudarabah savings pot too?' },
  ],
];

const SETTLE_CHAT = [[
  { sys: '18 months later · March 2028' },
  { u: 'I got a bonus 🎉 What would it cost to settle the car financing today?' },
  { tools: [
    { t: 'contracts.get(MRB-2026-0847)', r: 'paid 18 of 48 · remaining instalments SAR 61,628' },
    { t: 'ibra.compute(policy=v3)', r: 'unearned profit SAR 6,375 · rebate 80%' },
  ]},
  { m: 'Great news — settling early means you <b>don’t pay most of the future profit</b>. Here’s the math, nothing hidden:' },
  { card: `
    <h4><small>Early settlement · ibra’ (profit rebate)</small>Settle today</h4>
    <div class="krow"><span>Remaining instalments (30)</span><b class="strike">SAR 61,628</b></div>
    <div class="krow"><span>Unearned future profit</span><b>SAR 6,375</b></div>
    <div class="krow"><span>Ibra’ rebate — waived for you</span><b class="ok">− SAR 5,100</b></div>
    <div class="krow total"><span>Pay today &amp; own it outright</span><b>SAR 56,528</b></div>
    <div class="note ok">You keep SAR 5,100 versus paying to schedule. The rebate is policy, not a favour — it’s in your contract.</div>`, cls: 'gold' },
  { u: 'Settle now.' },
  { tools: [ { t: 'payments.debit(SAR 56,528)', r: 'settled · contract closed' } ]},
  { m: 'Done. The Tucson’s title is fully yours, and your SIMAH file now shows the contract <b>settled early, in full</b> — the best line a credit file can carry. A pleasure doing this one, Sara.' },
]];

const HARDSHIP_CHAT = [[
  { sys: 'An alternate path · when a month goes wrong' },
  { u: 'Mal, I’m being laid off at the end of this month. I’m worried about the car payment.' },
  { m: 'Thank you for telling me early, Sara — that’s exactly the right move. And breathe: <b>your debt cannot grow</b>. It was fixed at SAR 98,600 the day you signed. This is only a question of timing.' },
  { tools: [
    { t: 'hardship.assess(reason=job_loss)', r: 'eligible · deferral up to 3 instalments' },
    { t: 'schedule.defer(months=3)', r: 'tenor 48 → 51 · total unchanged' },
  ]},
  { card: `
    <h4><small>Hardship restructure · no penalty, ever</small>Your new schedule</h4>
    <div class="krow"><span>Instalments paused</span><b>Aug – Oct</b></div>
    <div class="krow"><span>Payments resume</span><b>1 Nov · SAR 2,054</b></div>
    <div class="krow"><span>Tenor</span><b>48 → 51 months</b></div>
    <div class="krow total"><span>Total owed — before and after</span><b>SAR 98,600</b></div>
    <div class="krow"><span>Fees, penalties, added profit</span><b class="ok">SAR 0</b></div>
    <div class="note">SIMAH impact: none, as long as the new plan is kept. Deferral is a contract right, not a collections concession.</div>` },
  { m: 'Done — three months of room, and not one halala added. Penalty interest doesn’t exist here, and late-payment pledges go to charity, never to us. Focus on the search; I’ll check in before November.' },
]];

/* ---------------------------------------------------------------- app screens */

const screenHome = () => `
  <div class="scr-head"><div class="avatar">س</div>
    <div class="who"><b>Sabah al-khair, Sara</b><small>Riyadh · Thursday 24 Jul</small></div>
    <span class="pill">● mal.ai</span></div>
  <div class="balance-card"><small>Current account · SA03 8000 ···· 4512</small>
    <div class="amt">SAR 32,410<em>.55</em></div>
    <div class="sub">Salary landed Sunday · SAR 18,500</div></div>
  <div class="tile-row">
    <div class="tile"><small>Mudarabah savings</small><div class="v">SAR 24,300</div><div class="s ok">+SAR 96 profit share last month · 70/30</div></div>
    <div class="tile"><small>Zakat tracker</small><div class="v">SAR 685</div><div class="s">due this year · nisab met ✓</div></div>
  </div>
  <div class="tile-row">
    <div class="tile"><small>Spending · July</small><div class="v">SAR 7,240</div><div class="s">on pace · 61% of typical</div></div>
    <div class="tile"><small>Financing</small><div class="v">—</div><div class="s">none yet · ask Mal</div></div>
  </div>
  <div class="sec-label">The front door</div>
  <button class="ask-mal" data-go-stop="1"><span class="spark">✦</span>Ask Mal anything… <i>“I need a car”</i></button>
  <p class="home-note">There is no products menu. You state the need — Mal structures it, in the open.</p>`;

function chatHTML(script, upto) {
  let out = '<div class="chat">';
  for (let b = 0; b <= upto && b < script.length; b++) {
    const last = b === upto;
    let i = 0;
    for (const item of script[b]) {
      const anim = last ? ` appear" style="animation-delay:${Math.min(i++ * 140, 1100)}ms` : '';
      if (item.sys)  out += `<div class="sys${anim}">${item.sys}</div>`;
      if (item.u)    out += `<div class="msg user${anim}">${item.u}</div>`;
      if (item.m)    out += `<div class="msg mal${anim}"><b>Mal · </b>${item.m}</div>`;
      if (item.tools) for (const tl of item.tools)
        out += `<div class="tool${anim}"><span class="tick">✓</span> <b>${tl.t}</b><br>&nbsp;&nbsp;↳ ${tl.r}</div>`;
      if (item.card) out += `<div class="rich ${item.cls || ''}${anim}">${item.card}</div>`;
      if (item.chips && last) out +=
        `<div class="chips${anim}">${item.chips.map(c => `<button data-chip>${c}</button>`).join('')}</div>`;
    }
  }
  return out + '</div>';
}

const screenChat = (script, upto) => `
  <div class="scr-head"><div class="avatar">✦</div>
    <div class="who"><b>Mal</b><small>your banking agent · fatwa-governed</small></div>
    <span class="pill">● live</span></div>
  ${chatHTML(script, upto)}`;

const screenHub = () => `
  <div class="scr-head"><div class="avatar">◫</div>
    <div class="who"><b>Financing</b><small>your contracts, in the open</small></div>
    <span class="pill">1 active</span></div>
  <div class="contract-card"><small>Auto Murabaha · MRB-2026-0847</small>
    <div class="t">Hyundai Tucson 2026</div>
    <div class="progressbar"><i style="width:37.5%"></i></div>
    <div class="meta"><span>paid <b>SAR 36,972</b></span><span>of <b>SAR 98,600</b></span><span>next <b>1 Sep · 2,054</b></span><span><b>30</b> payments left</span></div></div>
  <table class="schedule">
    <tr class="paid"><td>17 · 1 Jul</td><td>paid ✓</td><td>SAR 2,054</td></tr>
    <tr class="paid"><td>18 · 1 Aug</td><td>paid ✓</td><td>SAR 2,054</td></tr>
    <tr class="next"><td>19 · 1 Sep</td><td>next</td><td>SAR 2,054</td></tr>
    <tr><td>20 · 1 Oct</td><td>scheduled</td><td>SAR 2,054</td></tr>
    <tr><td>48 · 1 Jun 2030</td><td>final</td><td>SAR 2,062</td></tr>
  </table>
  <div class="action-row">
    <button data-go-stop="8">Settle early — ibra’</button>
    <button data-go-stop="9">Defer a payment</button>
    <button data-go-stop="1">Ask Mal why</button>
    <button>Statement (PDF)</button>
  </div>
  <div class="sec-label">Coming to mal.ai</div>
  <div class="tile-row">
    <div class="tile"><small>Home · Ijarah</small><div class="v">🔒</div><div class="s">lease-to-own · 2027</div></div>
    <div class="tile"><small>Home · Musharakah</small><div class="v">🔒</div><div class="s">diminishing partnership · 2027</div></div>
  </div>`;

const screenSharia = () => `
  <div class="scr-head"><div class="avatar">۞</div>
    <div class="who"><b>Sharia &amp; trust</b><small>the supply chain of every promise</small></div>
    <span class="pill">AAOIFI</span></div>
  <div class="board">
    <div class="m"><div class="face">ش</div><b>Sh. Al-Rashid</b><small>Chair · AAOIFI</small></div>
    <div class="m"><div class="face">د</div><b>Dr. Al-Zahrani</b><small>Fiqh al-Muamalat</small></div>
    <div class="m"><div class="face">د</div><b>Dr. Hassan</b><small>Audit &amp; review</small></div>
  </div>
  <div class="sec-label">Every product carries its fatwa</div>
  <div class="fatwa"><b>Auto &amp; goods Murabaha <span>Fatwa #014 · AAOIFI SS 8</span></b><small>Declared-profit sale. The bank must own and bear the risk of the asset before selling. Profit fixed at contract; can never increase.</small></div>
  <div class="fatwa"><b>Tawarruq cash financing <span>Fatwa #019 · AAOIFI SS 30</span></b><small>Organised commodity purchase and resale. Permitted for genuine cash needs; Mal always offers Murabaha first when an asset exists.</small></div>
  <div class="fatwa"><b>Mudarabah savings <span>Fatwa #007 · AAOIFI SS 13</span></b><small>Profit-sharing investment, 70/30 customer/bank. Returns are earned, not guaranteed — and are shown as “profit share”, never “interest”.</small></div>
  <div class="rich" style="margin-top:10px"><h4><small>Why profit ≠ interest</small>One sentence</h4>
    <div class="note" style="border:0;padding-top:0;margin-top:0">Interest charges for <i>time on money</i> and grows when you slip. Murabaha profit is the margin on a <i>real sale of a real asset</i> — fixed on day one, incapable of growing after.</div></div>
  <div class="rich gold" style="margin-top:8px"><h4><small>Charity ledger · 2026</small>Late-payment pledges</h4>
    <div class="krow"><span>Routed to registered charities</span><b>SAR 41,230</b></div>
    <div class="krow"><span>Retained by mal.ai</span><b class="ok">SAR 0</b></div></div>`;

/* ---------------------------------------------------------------- the tour */

const TOUR = [
  { id: 'home', act: 'Act I · The front door', title: 'Home is the agent, not a dashboard', dock: 'home',
    render: screenHome,
    r: { h: 'The agent is the front door.',
      points: [
        '<b>No products menu.</b> Customers don’t know product names — they know needs. The “Ask Mal” bar is the primary navigation; the dashboard is one glance of state, not a maze.',
        '<b>The balance sheet is Sharia-native at a glance:</b> savings are Mudarabah profit-share (70/30, disclosed), and zakat is computed by the bank — trust signals placed before any lending happens.',
        '<b>Financing shows “none yet — ask Mal”.</b> The empty state teaches the interaction model: state a need, get a structure.'],
      po: 'Everything after this screen is one conversation. If the front door needed a tutorial, we’d have already lost.' } },

  { id: 'need', act: 'Act II · The financing conversation', title: 'State the need — consent in the open', dock: 'agent',
    render: () => screenChat(FIN_CHAT, 0),
    r: { h: 'Origination starts in plain language.',
      points: [
        '<b>“I need a car, around SAR 85,000”</b> is the entire application form. Amount, purpose, and asset-vs-cash are extracted from the sentence.',
        '<b>Consent is a first-class moment,</b> not a checkbox: Mal names each data source, its scope (read-only, one pull), and its expiry — before touching anything.',
        '<b>Assumption A1:</b> visible, permission-scoped tool use is what makes agent-led underwriting trustworthy. This screen is that bet.'],
      po: 'The consent card is the whole trust architecture in miniature: the agent asks, shows, then acts — never the reverse.' } },

  { id: 'underwrite', act: 'Act II · The financing conversation', title: 'Underwriting as visible tool calls', dock: 'agent',
    render: () => screenChat(FIN_CHAT, 1),
    r: { h: 'The credit decision happens in front of the customer.',
      points: [
        '<b>Three tool calls, three receipts:</b> open-banking cashflow, SIMAH file, SAMA DBR check — each with its actual result inline. The black box is opened on purpose.',
        '<b>Policy is deterministic;</b> the agent narrates it. Approvals come from versioned credit policy under SAMA responsible-lending rules — no LLM decides a limit.',
        '<b>The affordability card leads with headroom,</b> not with “approved amount”. Mal never structures a customer to the 33.3% ceiling — that’s a product value, stated as policy.'],
      po: 'Time-to-yes here is ~40 seconds. The branch equivalent is 3 visits. That delta is the business case for the whole bank.' } },

  { id: 'structure', act: 'Act II · The financing conversation', title: 'Murabaha vs Tawarruq — the structure, explained', dock: 'agent',
    render: () => screenChat(FIN_CHAT, 2),
    r: { h: 'The customer chooses a structure knowingly.',
      points: [
        '<b>“I don’t want a disguised loan”</b> is the segment’s core anxiety, voiced. The answer is a comparison, not reassurance: what each structure is, what each costs.',
        '<b>Murabaha is recommended for assets</b> — cheaper (13,600 vs 15,300) and structurally cleaner. Tawarruq stays available for genuine cash needs. The recommendation logic is fatwa-governed.',
        '<b>Assumption A2:</b> explanation increases completion rather than adding friction. Comprehension is the differentiator, so we spend a beat on it.'],
      po: 'Legacy banks hide the structure to avoid questions. We surface it to avoid churn. A customer who can explain their Murabaha defends it at the majlis.' } },

  { id: 'offer', act: 'Act II · The financing conversation', title: 'The honest offer — every riyal, before yes', dock: 'agent',
    render: () => screenChat(FIN_CHAT, 3),
    r: { h: 'Radical cost honesty is the conversion strategy.',
      points: [
        '<b>Cost + fixed profit = total,</b> with the dealer invoice shown. SAR 98,600 is presented as “the total you repay — ever”, because it literally cannot grow.',
        '<b>APR-equivalent (7.6%) is shown voluntarily</b> so the offer can be compared against conventional lenders. Transparency that survives comparison is the only kind worth having.',
        '<b>The servicing promises are in the offer,</b> not the T&amp;Cs: no late fees (charity pledge instead), ibra’ on early settlement. They’re priced in, so they’re printed on.'],
      po: 'Note what’s absent: “from SAR 2,054/mo*”, asterisks, admin fees. The offer card is the ad, the disclosure, and the contract summary — one artefact.' } },

  { id: 'execute', act: 'Act II · The financing conversation', title: 'The Murabaha sequence, executed live', dock: 'agent',
    render: () => screenChat(FIN_CHAT, 4),
    r: { h: 'The order of steps is the compliance — so show the steps.',
      points: [
        '<b>Bank buys → bank owns the risk → bank sells → customer accepts.</b> If that order breaks, it’s not a Murabaha. The timeline makes the Sharia mechanics legible instead of burying them in a PDF.',
        '<b>The risk moment is stated plainly:</b> “if it’s damaged now, that’s our loss.” That sentence is the difference between a sale and a loan — and most customers have never seen it.',
        '<b>Nafath closes the loop</b> — national identity rail for a qualified e-signature. No branch, no wet ink, full legal force.'],
      po: 'This screen is the answer to “isn’t Islamic banking just theatre?” — we make the theatre real by performing it where the customer can watch.' } },

  { id: 'done', act: 'Act II · The financing conversation', title: 'Signed — and the relationship begins', dock: 'agent',
    render: () => screenChat(FIN_CHAT, 5),
    r: { h: 'Origination ends; the agent relationship doesn’t.',
      points: [
        '<b>Under 7 minutes,</b> need to contract — the PRD’s primary journey metric, demonstrated end to end.',
        '<b>The recap re-states the promises</b> (fixed total, ibra’, talk-before-you-slip) at the moment of highest attention. Comprehension is measured here: can the customer state total cost and structure unaided?',
        '<b>The agent’s first proactive move</b> — debit date 3 days after payday, from observed cashflow — previews servicing: the same agent, now working for the contract’s health.'],
      po: 'Banks celebrate disbursement because it books revenue. We celebrate it as the start of 48 months of kept promises — that’s where the deposit franchise comes from.' } },

  { id: 'financing', act: 'Act III · Living with financing', title: 'The financing hub — state, in the open', dock: 'financing',
    render: screenHub,
    r: { h: 'Servicing is a surface, not a call centre.',
      points: [
        '<b>The contract card leads with progress</b> — paid vs total against the fixed SAR 98,600 — because a debt that can’t grow deserves a progress bar, not a “balance”.',
        '<b>Every escape hatch is a button:</b> settle early, defer a payment, ask why. The expensive servicing actions of a legacy bank are the cheap self-serve actions here.',
        '<b>The roadmap is honest:</b> Ijarah and diminishing Musharakah for homes are shown locked, with dates — scope discipline from the PRD, visible in the product.'],
      po: 'A customer who can see everything asks support nothing. The hub is a cost line and a trust line at once.' } },

  { id: 'settle', act: 'Act III · Living with financing', title: 'Early settlement — ibra’, computed live', dock: 'agent',
    render: () => screenChat(SETTLE_CHAT, 0),
    r: { h: 'The bank gives money back, and shows the math.',
      points: [
        '<b>Ibra’ is a contract right, not a favour:</b> unearned profit SAR 6,375, rebate SAR 5,100, settle for SAR 56,528 instead of SAR 61,628 — computed by a visible tool call, confirmed in one tap.',
        '<b>The strike-through does the marketing.</b> Nothing says “we’re not a conventional lender” like a bank enthusiastically shrinking its own receivable.',
        '<b>The SIMAH note</b> (“settled early, in full”) turns settlement into a credit-file gift — one more reason the relationship survives the contract.'],
      po: 'Servicing metric from the PRD: early-settlement NPS ≥ +40. This interaction is where that number is won.' } },

  { id: 'hardship', act: 'Act III · Living with financing', title: 'Hardship — deferral without penalty', dock: 'agent',
    render: () => screenChat(HARDSHIP_CHAT, 0),
    r: { h: 'The ethics live in the worst month, not the best.',
      points: [
        '<b>“Your debt cannot grow”</b> is the load-bearing sentence of the entire bank, said at the moment it matters most. Fixed at signing means fixed through a layoff.',
        '<b>Three months deferred, tenor 48 → 51, total unchanged, fees zero</b> — the restructure card is deliberately boring. Boring is the point; drama is what penalty pricing creates.',
        '<b>Telling Mal early is rewarded,</b> never punished — which is how the bank gets the early-warning data conventional collections teams pay dearly to reconstruct.'],
      po: 'Guardrail metric: 30-day cure rate ≥ 1.3× market. We believe kindness, properly instrumented, collects better than fees.' } },

  { id: 'sharia', act: 'Act IV · The trust layer', title: 'Sharia governance — the supply chain of trust', dock: 'sharia',
    render: screenSharia,
    r: { h: 'Compliance is a feature with a UI.',
      points: [
        '<b>Named scholars, per-product fatwas, AAOIFI standard citations</b> — in the app, one tap deep. The agent’s explanations are fatwa-governed artefacts, reviewed like code.',
        '<b>The charity ledger is the receipt for “no late fees”:</b> SAR 41,230 routed to charities, SAR 0 retained. A promise without a ledger is a slogan.',
        '<b>Profit ≠ interest in one sentence,</b> because the whole bank fails if customers can’t repeat it: margin on a real sale, fixed on day one, incapable of growing.'],
      po: 'End of the tour. The PRD, product site, and this walkthrough were built from one source of truth — the Product Owner Toolkit method: shape, write, ship. ← back to the start, or open the site.' } },
];

/* ---------------------------------------------------------------- routing & render */

let stop = 0;

function stopFromHash() {
  const id = location.hash.replace(/^#\/?/, '');
  const i = TOUR.findIndex(s => s.id === id);
  return i >= 0 ? i : 0;
}

function go(i) {
  i = Math.max(0, Math.min(TOUR.length - 1, i));
  location.hash = '#/' + TOUR[i].id;
}

function render() {
  stop = stopFromHash();
  const s = TOUR[stop];

  const screen = $('#screen');
  screen.innerHTML = s.render();
  // chat screens read best pinned to the latest beat
  if (screen.querySelector('.chat')) screen.scrollTop = screen.scrollHeight;
  else screen.scrollTop = 0;

  $('#rationale').innerHTML = `
    <div class="r-act">${s.act} · stop ${stop + 1} of ${TOUR.length}</div>
    <h2>${s.r.h}</h2>
    <ul>${s.r.points.map(p => `<li>${p}</li>`).join('')}</ul>
    <div class="po-note">${s.r.po}</div>`;

  $('#crumb').innerHTML = `${s.act} — <b>${s.title}</b>`;
  $('#dots').innerHTML = TOUR.map((t, i) =>
    `<i class="${i < stop ? 'done' : ''}${i === stop ? 'on' : ''}" data-dot="${i}" title="${t.title}"></i>`).join('');

  document.querySelectorAll('.dock button').forEach(b =>
    b.classList.toggle('on', b.dataset.go === s.dock));

  $('#prev').disabled = stop === 0;
  $('#next').textContent = stop === TOUR.length - 1 ? 'Restart the journey ↺' : 'Next in the journey →';
}

/* ---------------------------------------------------------------- wiring */

$('#prev').addEventListener('click', () => go(stop - 1));
$('#next').addEventListener('click', () => go(stop === TOUR.length - 1 ? 0 : stop + 1));

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') go(stop + 1);
  if (e.key === 'ArrowLeft') go(stop - 1);
});

document.addEventListener('click', e => {
  const chip = e.target.closest('[data-chip]');
  if (chip) { go(stop + 1); return; }
  const jump = e.target.closest('[data-go-stop]');
  if (jump) { go(+jump.dataset.goStop); return; }
  const dot = e.target.closest('[data-dot]');
  if (dot) { go(+dot.dataset.dot); return; }
  const dock = e.target.closest('.dock button');
  if (dock) {
    const first = TOUR.findIndex(s => s.dock === dock.dataset.go);
    if (first >= 0) go(first);
  }
});

window.addEventListener('hashchange', render);
render();
