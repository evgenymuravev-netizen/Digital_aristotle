/* ============ Noor AI — scripted agent engine ============ */
(function(){
window.CHAT = { msgs:[], busy:false };

const el = () => document.getElementById('chWrap');

function nodeFor(m){
  const d = document.createElement('div');
  if (m.from==='user'){ d.className='ch-msg user'; d.innerHTML=m.html; }
  else if (m.from==='ai'){ d.className='ch-msg ai'; d.innerHTML=m.html; }
  else { d.className='ch-card'; d.innerHTML=m.html; }
  return d;
}
function scrollEnd(){ const w=el(); if(w) w.scrollTop = w.scrollHeight+999; }

const Chat = window.Chat = {
  reset(){ CHAT.msgs=[]; CHAT.busy=false; },
  mount(){ const w=el(); if(!w) return; w.innerHTML=''; CHAT.msgs.forEach(m=>w.appendChild(nodeFor(m))); scrollEnd(); },
  push(m){ CHAT.msgs.push(m); const w=el(); if(w){ w.appendChild(nodeFor(m)); scrollEnd(); } },
  typing(on){
    const w=el(); if(!w) return;
    let t=w.querySelector('.typing');
    if(on && !t){ t=document.createElement('div'); t.className='typing'; t.innerHTML='<i></i><i></i><i></i>'; w.appendChild(t); scrollEnd(); }
    if(!on && t) t.remove();
  },
  user(text){ this.push({from:'user', html:text}); },
  ai(html, delay=900){
    return new Promise(res=>{ this.typing(true);
      setTimeout(()=>{ this.typing(false); this.push({from:'ai', html}); res(); }, delay); });
  },
  card(html, delay=700){
    return new Promise(res=>{ this.typing(true);
      setTimeout(()=>{ this.typing(false); this.push({from:'card', html}); res(); }, delay); });
  },

  send(text){
    text = (text||'').trim(); if(!text || CHAT.busy) return;
    const inp = document.getElementById('chInp'); if (inp) inp.value='';
    this.user(text);
    this.route(text.toLowerCase());
  },
  sendInput(){ const inp=document.getElementById('chInp'); this.send(inp ? inp.value : ''); },
  chipSend(text, script){ this.user(text); this.play(script, false); },

  route(t){
    const go = s => this.play(s,false);
    /* mid-interview: a typed number answers the pending zakat question */
    if (window.ZKChat && ZKChat.pending){
      const v = parseFloat(t.replace(/[^\d.]/g,''));
      if (isFinite(v) && v>=0){ const p=ZKChat.pending; ZKChat.pending=null; ZKChat.applyTyped(p, v); return; }
    }
    if (/(credit )?card/.test(t) && /find|best|help|need|new/.test(t)) return go('findCard');
    if (/ps ?5|playstation/.test(t)) return go('ps5');
    if (/birthday|present|anniversar|gift for/.test(t)) return go('gift');
    if (/agent|delegat|fazaa|booking|promo code/.test(t)) return go('agents');
    if (/advice|advis|portfolio|allocat/.test(t)) return go('advise');
    if (/refinanc|expensive|cheaper|too much.*pay/.test(t)) return go('refi');
    if (/loan|borrow|financ/.test(t)) return go('loan');
    if (/spend|spent|where.*money|expense/.test(t)) return go('spend');
    if (/subscri/.test(t)) return go('subs');
    if (/scholar|madhhab|nisab|jewell|ramadan|properly/.test(t)) return go('zakatFull');
    if (/zakat/.test(t)) return go('zakat');
    if (/afford/.test(t)) return go('afford');
    if (/salary/.test(t)) return go('salary');
    if (/save|saving/.test(t)) return go('save');
    if (/school/.test(t)) return go('school');
    if (/insur|takaful/.test(t)) return go('takaful');
    if (/rate|inr|usd|fx|exchange|rupee/.test(t)) return go('fx');
    if (/send|transfer/.test(t)) return go('xferHint');
    return go('fallback');
  },

  async play(id, withUser=true){
    if (CHAT.busy) return; CHAT.busy=true;
    try{
      const s = SCRIPTS[id]; if(!s){ CHAT.busy=false; return; }
      if (withUser && s.user) this.user(s.user);
      await s.run(this);
    } finally { CHAT.busy=false; }
  },
};

/* ---------- reusable chat cards ---------- */
const offerCard = (o,i) => {
  const b = BANKS[o.bank];
  return `<div class="offer-card ${o.rec?'rec':''}">
    <div class="flex between">${blg(o.bank)}${o.rec?`<span class="tag solid">⚡ Recommended</span>`:(o.shariah?'<span class="tag gold">☪ Shariah</span>':'')}</div>
    <div class="offer-amt tnum">AED ${fm(o.limit,0)}</div>
    <div class="offer-sub">Pre-approved limit</div>
    <div class="offer-terms tnum">${o.rate.toFixed(2)}%, ${o.grace} days</div>
    <button class="btn pri sm mt12" style="width:100%" onclick="A.go('apply/${o.id}')">Get a card</button>
  </div>`;
};
window.offersRow = () => `<div class="hscroll">${CARD_OFFERS.map(offerCard).join('')}</div>`;

const psCard = p => `
  <div class="pcard">
    <div class="p-img">${ART[p.art]}</div>
    <div class="p-body">
      <div class="row-t">PlayStation 5 Pro 2 Tb</div>
      <div class="row-d">${p.store} · ${p.eta}</div>
      <span class="tag lime mt8" style="margin-top:8px">${p.tag}</span>
      <button class="btn pri sm mt8" style="width:100%" onclick="Pay.buyPS5('${esc(p.store)}',${p.price})">Buy for AED ${fm(p.price,0)}</button>
    </div>
  </div>`;
window.ps5Row = () => `<div class="hscroll">${PS5_OFFERS.map(psCard).join('')}</div>`;

const chips = items => `<div class="ch-quick">${items.map(c=>`<button class="chip" onclick="${c.fn}">${c.t}</button>`).join('')}</div>`;

const loanCard = () => {
  const L = LOAN_OFFER;
  return `<div class="offer-card rec" style="min-width:0">
    <div class="flex between">${blg(L.bank)}<span class="tag gold">☪ ${L.type}</span></div>
    <div class="offer-amt tnum">AED ${fm(L.amount,0)}</div>
    <div class="offer-sub">Pre-approved · zero paperwork</div>
    <div class="kv" style="padding-top:12px"><span class="k">Monthly instalment</span><span class="v tnum">AED ${fm(L.monthly,0)} × ${L.months}</span></div>
    <div class="kv"><span class="k">Profit rate</span><span class="v tnum">${L.rate}% p.a. reducing</span></div>
    <div class="kv"><span class="k">Early settlement</span><span class="v">Free, anytime</span></div>
    <button class="btn lime mt8" onclick="A.go('loan-activate')">${ic('zap',18)} Activate in 1 click</button>
  </div>`;
};

const spendCard = () => {
  const top = CATSPEND.slice(0,4);
  return `<div class="offer-card" style="min-width:0">
    <div class="flex" style="gap:16px">
      ${donut(top.map(c=>({v:c.amt,c:CATS[c.cat].c})),110,12,`<div class="h3 tnum">${fm(BUDGET.spent,0)}</div><div class="micro">of ${fm(BUDGET.total,0)}</div>`)}
      <div class="legend f1">${top.map(c=>`<div class="lg-i"><span class="lg-dot" style="background:${CATS[c.cat].c}"></span><span class="f1">${CATS[c.cat].n}</span><b class="tnum">${fm(c.amt,0)}</b></div>`).join('')}</div>
    </div>
    <button class="btn ghost sm mt12" style="width:100%" onclick="A.go('insights')">Open full insights</button>
  </div>`;
};

const zakatCard = () => {
  const z=ZAKAT, total=z.cash+z.gold+z.invest, due=total*z.rate;
  return `<div class="offer-card" style="min-width:0">
    <div class="flex between"><span class="tag gold">☪ Zakat al-Maal</span><span class="micro">Nisab: AED ${fm(z.nisab,0)} ✓</span></div>
    <div class="offer-amt tnum">AED ${fm(due)}</div>
    <div class="offer-sub">2.5% of AED ${fm(total)} zakatable wealth</div>
    <div class="kv" style="padding-top:10px"><span class="k">Cash across 3 banks</span><span class="v tnum">${fm(z.cash)}</span></div>
    <div class="kv"><span class="k">Gold 12.4 g</span><span class="v tnum">${fm(z.gold)}</span></div>
    <div class="kv"><span class="k">Halal investments</span><span class="v tnum">${fm(z.invest)}</span></div>
    <button class="btn lime mt8" onclick="A.go('zakat')">Review & pay zakat</button>
  </div>`;
};

const affordCard = () => `
  <div class="offer-card" style="min-width:0">
    <div class="flex between"><b>Yes — comfortably ✅</b><span class="tag grn">Safe</span></div>
    <div class="sub mt8">Projected cash after the AED 6 500 trip, next salary on the 25th and all known bills:</div>
    <div class="mt12">${spark([27,24,31,28,26,33,30,36],300,64,'#53DE8E')}</div>
    <div class="kv"><span class="k">End-of-August buffer</span><span class="v tnum grn-t">AED 11 940</span></div>
    <div class="micro">Stays above your AED 8 000 safety floor the whole time.</div>
  </div>`;

/* ---------- scripts ---------- */
const SCRIPTS = {
  hello:{ async run(c){
    await c.ai(A.S.lang==='ar' ? `أهلاً يا <b>جون</b>. ${BR().line}` : `Hi, <b>${USER.first}</b>. ${BR().line}`, 700);
    await c.card(chips([
      {t:'📋 Open today’s briefing', fn:"A.go('briefing')"},
      {t:'💳 Find me a credit card', fn:"Chat.chipSend('Help me find a credit card with the best terms','findCard')"},
      {t:'🎮 I want to buy a PS 5', fn:"Chat.chipSend('I want to buy a PS 5, 2 Tb','ps5')"},
    ]), 300);
  }},

  findCard:{ user:'Help me find a credit card with the best terms', async run(c){
    await c.ai('I compared <b>14 cards</b> across your linked banks using your real income and spending. I have selected three offers with a <b>pre-approved limit</b> for you.');
    await c.card(offersRow());
    await c.card(chips([
      {t:'See other offers', fn:"Chat.chipSend('See other offers','moreOffers')"},
      {t:'Tell more about each proposal', fn:"Chat.chipSend('Tell more about each proposal','offerDetails')"},
      {t:'Why these?', fn:"Chat.chipSend('Why these?','whyOffers')"},
    ]), 250);
  }},

  moreOffers:{ async run(c){
    await c.ai('Two more matches — slightly higher rates, different perks:');
    await c.card(`<div class="hscroll">
      <div class="offer-card"><div class="flex between">${blg('mashreq')}<span class="tag gray">Cashback</span></div>
        <div class="offer-amt tnum">AED 15 000</div><div class="offer-sub">Pre-approved limit</div>
        <div class="offer-terms tnum">5.99%, 50 days</div>
        <button class="btn pri sm mt12" style="width:100%" onclick="A.go('apply/fab')">Get a card</button></div>
      <div class="offer-card"><div class="flex between">${blg('adib')}<span class="tag gold">☪ Shariah</span></div>
        <div class="offer-amt tnum">AED 12 000</div><div class="offer-sub">Pre-approved limit</div>
        <div class="offer-terms tnum">4.25%, 55 days</div>
        <button class="btn pri sm mt12" style="width:100%" onclick="A.go('apply/ei')">Get a card</button></div>
    </div>`);
  }},

  offerDetails:{ async run(c){
    await c.ai(`Here’s the honest comparison:\n\n<b>FAB Cashback</b> — best everyday value: 5% back on groceries & fuel ≈ <b>AED 154/mo</b> for your basket. 3.99%, 55-day grace, free year one.\n\n<b>Emirates Islamic Skywards</b> — lowest rate (3.69%) and Shariah-compliant (Tawarruq). Earns ~9 400 Skywards miles/year on your spend.\n\n<b>Wio</b> — biggest limit (25 000) and instant virtual card, but the highest rate (5.5%). Good if you want it in Apple Pay today.`, 1400);
    await c.ai(`If you pay in full each month — rates don’t matter, perks do. Based on your last 3 months, <b>FAB saves you the most</b>. Want it?`);
    await c.card(chips([
      {t:'⚡ Get the FAB card', fn:"A.go('apply/fab')"},
      {t:'Get the EI card', fn:"A.go('apply/ei')"},
    ]), 250);
  }},

  whyOffers:{ async run(c){
    await c.ai(`Because they’re <b>pre-approved against your verified data</b> — not generic ads:\n\n· Salary AED 32 500 seen 14× via Noor Connect\n· Card utilisation 27%, perfect payment history\n· AECB score 745\n\nSo approval is instant — no documents, no branch.`);
  }},

  ps5:{ user:'I want to buy a PS 5, 2 Tb', async run(c){
    await c.ai('Ok, I checked, here’s the best offer for you', 800);
    await c.card(ps5Row());
    await c.card(chips([
      {t:'Split it — Tabby vs Tamara vs Noor', fn:"Pay.buyPS5('Sharaf DG',3150,true)"},
      {t:'See other offers', fn:"Chat.chipSend('See other offers','ps5More')"},
      {t:'Tell more about each proposal', fn:"Chat.chipSend('Tell more about each proposal','ps5Details')"},
    ]), 250);
  }},
  ps5More:{ async run(c){
    await c.ai('Also in stock: <b>Virgin Megastore</b> AED 3 299 (pickup Dubai Mall today) and <b>noon</b> AED 3 285 (tomorrow). Sharaf DG is still the winner on price + speed.');
  }},
  ps5Details:{ async run(c){
    await c.ai(`<b>Sharaf DG — AED 3 150</b>: cheapest, delivery in 2–4 h, 2-yr warranty.\n<b>Jumbo — AED 3 249</b>: free HDMI 2.1 cable (worth ~AED 120), tomorrow.\n<b>Amazon.ae — AED 3 329</b>: easiest returns.\n\nFor paying: you’re <b>pre-approved on Tabby (AED 4 500)</b> and <b>Tamara (AED 3 800)</b> — both 0 fees — or <b>Noor Split in 4</b> (Murabaha). Paying in full on FAB earns AED 157 cashback. Tap “Split it” and pick.`);
  }},

  refi:{ user:'Should I refinance anything?', async run(c){
    await c.ai(`I priced every facility you have. The honest read:\n\n🔴 <b>Close</b> — invoice financing 22 000 @ 14,5%: your most expensive dirham. Settle it from idle e-Saver cash → <b>save 3 190/yr</b>.\n\n🟢 <b>Transfer</b> — business 45 000 @ 9,2% and personal 18 000 @ 8,5% → <b>deposit-secured financing</b> (your e-Saver pledges as rahn): 4,95% / 4,25% → <b>save 2 677/yr</b>. Car 36 200 @ 5,9% → 4,49% → <b>510/yr</b>. Purchase financing → 6,9% → <b>512/yr</b>.\n\n⚪ <b>Keep</b> — home Ijarah at 3,99% is market-best (switching costs you — and yes, we’d earn if you switched). BNPL at 0 fees is free money. B2B BNPL is 0% inside 60 days — I’ll ping you day 55.\n\nTotal: <b>AED 6 889/yr back in your pocket.</b>`, 2000);
    await c.card(`<div class="ch-quick">
      <button class="chip" onclick="A.go('refi')">⚡ Open the plan — apply in 1 tap</button>
      <button class="chip" onclick="A.go('dsf')">🔐 Deposit-secured — how it works</button>
      <button class="chip" onclick="A.go('debts')">Full check-up</button>
    </div>`,250);
  }},

  loan:{ user:'Get me the best financing with one-click activation', async run(c){
    await c.ai('You have a <b>pre-approved Murabaha personal finance</b> ready. ' + LOAN_OFFER.note, 1000);
    await c.card(loanCard());
    await c.card(chips([
      {t:'Change amount', fn:"Chat.chipSend('Can I take AED 60 000 instead?','loanCustom')"},
      {t:'Is this Shariah-compliant?', fn:"Chat.chipSend('Is this Shariah-compliant?','loanShariah')"},
    ]), 250);
  }},
  loanCustom:{ async run(c){
    await c.ai('Of course. <b>AED 60 000</b> over 48 months → <b>AED 1 321/mo</b> at the same 5.49% p.a. Your debt-burden ratio stays at a healthy 19%. Activation is still 1 click — tap the card above and adjust the slider.');
  }},
  loanShariah:{ async run(c){
    await c.ai('Yes — it’s a <b>Murabaha</b> structure approved by Emirates Islamic’s Shariah board: the bank buys a commodity and sells it to you at a disclosed fixed mark-up. No interest, no hidden compounding, free early settlement.');
  }},

  spend:{ user:'Why did I spend so much in June?', async run(c){
    await c.ai(`June so far: <b>AED ${fm(BUDGET.spent)}</b> — about <b>18% above</b> your typical month.\n\nThe jump comes from <b>Shopping (AED 3 421,75)</b> — mostly IKEA AED 1 244,75 — and <b>Dining, +38%</b> vs May. Everything else is normal.`, 1300);
    await c.card(spendCard());
    await c.card(chips([
      {t:'Set a dining cap', fn:"Rules.fromChat()"},
      {t:'Show subscriptions', fn:"Chat.chipSend('Show my subscriptions','subs')"},
      {t:'June Money Story', fn:"Story.open()"},
    ]), 250);
  }},

  subs:{ user:'Show my subscriptions', async run(c){
    const total = SUBS.reduce((s,x)=>s+x.amt,0);
    await c.ai(`I track <b>${SUBS.length} subscriptions</b> ≈ <b>AED ${fm(total)}/mo</b>. Three findings, AED 2 076/yr total:\n\n🎧 <b>Three music apps overlap.</b> Hours listened this month: Anghami <b>31 h ▲24%</b> · Spotify <b>2,1 h ▼67%</b> · Apple Music <b>0,4 h ▼81%</b>. Keep Anghami — it’s your player (and the Arabic catalogue is unmatched). Cancel the other two → <b>AED 552/yr</b>.\n\n📱 <b>du Mobile is overprovisioned</b> — you use 6,2 GB of 25 GB. The 12 GB plan saves <b>AED 1 080/yr</b>.\n\n☁️ <b>You and Aisha both pay for iCloud.</b> One iCloud+ 2TB shares with the whole family — cancel hers via Family Sharing → <b>AED 444/yr</b>.\n\nAlso watching: <b>Claude API</b> AED 142,67 in May, tokens ▲38% — caching would cut ~40%.`);
    await c.card(chips([
      {t:'Cancel Spotify & Apple Music', fn:"Subs.cancel('Spotify + Apple Music',true)"},
      {t:'Switch du plan — save 1 080/yr', fn:"A.toast('Plan switch requested with du — active next cycle','check')"},
      {t:'Set up iCloud Family Sharing', fn:"A.toast('Setup guide sent to you and Aisha — her duplicate flagged for cancellation','share')"},
      {t:'Open subscriptions', fn:"A.go('subs')"},
    ]), 250);
  }},

  zakat:{ user:'How much zakat do I owe?', async run(c){
    await c.ai('🌙 <b>Ramadan starts tomorrow</b> — perfect timing. Here’s the quick version from your linked balances, gold and halal investments (above nisab, so zakat is due):', 1100);
    await c.card(zakatCard());
    await c.card(`<div class="ch-quick">
      <button class="chip" onclick="Chat.chipSend('Do it properly — ask me everything','zakatFull')">✦ Do it properly — full interview</button>
      <button class="chip" onclick="A.go('zakat')">Open the calculator</button>
    </div>`, 250);
  }},

  /* ---- the proper zakat interview: hidden assets · scholar matching · family ---- */
  zakatFull:{ user:'Calculate my zakat properly — ask me everything', async run(c){
    const auto = ZAKAT.auto.reduce((x,a)=>x+a.v,0);
    await c.ai(`🌙 <b>Ramadan starts tomorrow</b>, so let’s anchor your hawl to 1 Ramadan and do this right.\n\nI can already see <b>AED ${fm(auto)}</b> of zakatable wealth: bank cash, your Careem wallet, Binance, halal investments and vaulted gold.\n\nNow the things <b>no bank can show me</b> — answer honestly:`, 1300);
    await c.card(ZKChat.menu(), 300);
  }},

  afford:{ user:'Can I afford a AED 6 500 trip in August?', async run(c){
    await c.ai('Let me project your cashflow: salary on the 25th, all detected bills, instalments and your usual burn-rate…', 1100);
    await c.card(affordCard());
    await c.card(chips([
      {t:'Create a Travel goal', fn:"A.go('goal-new')"},
      {t:'Watch flight prices', fn:"A.toast('Watching DXB fares — I\\'ll ping you on drops','spark')"},
    ]), 250);
  }},

  salary:{ user:'When is my salary coming?', async run(c){
    await c.ai(`Your salary <b>AED ${fm(USER.salary,0)}</b> from <b>${USER.employer}</b> lands on the <b>25th</b> (14 consecutive months on time). The moment it arrives I’ll run your rule: <b>move 20% to Saving spaces</b>. Want me to also top up your Hajj fund?`);
    await c.card(chips([
      {t:'Yes, +AED 1 000 to Hajj', fn:"A.toast('Rule updated: AED 1 000 → Hajj fund on salary day','check')"},
      {t:'Show my rules', fn:"A.go('rules')"},
    ]), 250);
  }},

  save:{ user:'Help me save more', async run(c){
    await c.ai(`Three moves, zero effort — together ≈ <b>AED 1 670/mo</b>:\n\n1. <b>Round-ups ×2</b> to Gold → ~AED 370/mo\n2. Cancel 2 unused subscriptions → AED 44/mo\n3. Sweep salary-day leftovers above AED 8 000 → ~AED 1 250/mo`);
    await c.card(chips([
      {t:'Apply all three', fn:"A.toast('Done — 3 automations active','check');A.go('rules')"},
      {t:'Open Goals', fn:"A.go('goals')"},
    ]), 250);
  }},

  school:{ user:'Plan school fees', async run(c){
    await c.ai(`GEMS invoice season is September — typically <b>AED 24 800/term</b> for two kids at your school (based on your last payment). I’d set aside <b>AED 8 270/mo</b> for 3 months, or split the invoice in 4 with 0 fees when it arrives.`);
    await c.card(chips([
      {t:'Create School goal', fn:"A.go('goal-new')"},
      {t:'Remind me 1 Sep', fn:"A.toast('Reminder set for 1 September','check')"},
    ]), 250);
  }},

  takaful:{ user:'I need travel insurance', async run(c){
    await c.ai(`For your <b>DXB → LHR</b> trip in August I compared 6 Takaful plans. Best fit: <b>Salama Travel Plus</b> — AED 94, covers medical AED 500k, baggage, delays >4 h. Family option AED 212.`);
    await c.card(chips([
      {t:'Buy for AED 94', fn:"A.toast('Takaful issued — policy in Documents','check')"},
      {t:'See all 6 plans', fn:"A.go('market')"},
    ]), 250);
  }},

  fx:{ user:'What’s the INR rate today?', async run(c){
    await c.ai(`<b>AED 1 = ₹${FX[0].rate}</b> right now — a 30-day high. Sending ₹2 00 000 today costs <b>AED 8 540</b> (zero Noor fees, mid-market rate). Yesterday it was AED 8 612.`);
    await c.card(chips([
      {t:'Send to India now', fn:"A.go('intl')"},
      {t:'Alert me at 23.60', fn:"A.toast('Rate alert set: AED→INR 23.60','bell')"},
    ]), 250);
  }},

  xferHint:{ async run(c){
    await c.ai('Sure — who is it for? Your frequent contacts are one tap away, or scan any Aani QR.');
    await c.card(chips([
      {t:'Send to Sara', fn:"A.go('send/Sara AlBlooshi')"},
      {t:'Send to Ahmed', fn:"A.go('send/Ahmed Hassan')"},
      {t:'Scan QR', fn:"A.go('qr')"},
    ]), 250);
  }},

  advise:{ user:'Give me advice on my whole portfolio', async run(c){
    await c.ai(`Looking at <b>everything</b> you own — banks, gold, funds, crypto, property exposure:\n\n· Cash <b>AED 276k (78%)</b> — far too heavy. Inflation quietly eats ~3%/yr of it\n· Halal equities & funds <b>38,5k (11%)</b> · Gold <b>6k (1,7%)</b> · Crypto <b>9,8k (2,8%)</b>\n\nMy read for your profile (stable salary, 3.2-month emergency fund, Hajj goal 2027):`, 1700);
    await c.card(`<div class="offer-card" style="min-width:0">
      <div class="kv"><span class="k">🪙 Buy more gold → 8% target</span><span class="v">+AED 22 000</span></div>
      <div class="micro">Your hedge is underweight — round-ups alone won’t get you there.</div>
      <div class="kv" style="padding-top:10px"><span class="k">🏠 Property for lease (Ijarah)</span><span class="v">AED 80 000 entry</span></div>
      <div class="micro">Fractional rental units, ~6,8% net yield, Shariah lease structure — turns dead cash into income.</div>
      <div class="kv" style="padding-top:10px"><span class="k">📈 Your shares</span><span class="v grn-t">Hold</span></div>
      <div class="micro">Sukuk + halal ETFs are doing their job (▲4,8%). Don’t touch what works.</div>
      <div class="kv" style="padding-top:10px"><span class="k">⚠️ Crypto</span><span class="v">Cap at 3%</span></div>
      <div class="micro">Fine as-is — just don’t add more before the emergency fund hits 6 months.</div>
      <button class="btn lime mt12" onclick="A.toast('Plan drafted — review each move before anything executes','check')">Draft this plan — I approve each step</button>
    </div>`);
    await c.card(chips([
      {t:'🪙 Buy AED 22 000 gold now', fn:"A.toast('Bought 45,2 g at spot — vaulted in DMCC','check')"},
      {t:'🏠 Show lease-property options', fn:"A.toast('3 Ijarah units shortlisted — in your briefing tomorrow','home')"},
      {t:'Open portfolio', fn:"A.go('invest')"},
    ]), 250);
  }},

  gift:{ user:'What should I get Aisha for her birthday?', async run(c){
    await c.ai(`🎂 <b>14 days out</b> — good timing. With <b>her consented signals</b> (she shared gift categories from her own Noor app), the strongest ideas:\n\n👜 <b>Cult Gaia “Hana” bag · AED 690</b> — searched 6× this month\n🌸 <b>Jo Malone Oud & Bergamot · 540</b> — her ~8-month rebuy is due\n🧘‍♀️ <b>Talise Spa day for two · 750</b> — wellness spends ▲40%\n🎶 <b>Fairuz tribute ×2 · 380</b> — her #1 Anghami artist\n\nI’d reserve <b>AED 800</b> into a hidden Gift pot — fits your safe-to-spend, and the purchase stays <b>masked from shared views</b>.`, 2000);
    await c.card(chips([
      {t:'🎁 Open the gift planner', fn:"A.go('gift')"},
      {t:'Reserve AED 800 quietly', fn:"A.toast('AED 800 set aside in a hidden Gift pot 🤫','check')"},
    ]), 250);
  }},

  agents:{ user:'What did my agents do this week?', async run(c){
    await c.ai(`Your fleet earned <b>AED ${fm(AGENTS.earned,0)} ${AGENTS.period}</b> — receipts attached. This week:\n\n🛒 <b>Grocery</b> — basket follows “eat healthy + local brands”: swapped imported berries → Elite Agro 🇦🇪 (−18%), saved AED 142 in May\n🚗 <b>Careem</b> — tonight’s call: 3% Tabby cashback (AED 1,15) vs <b>1 500 Skywards miles</b> → took the miles (55× more value — you’re 4 300 from the London upgrade), paid with the EI Skywards Visa\n✈️ <b>Booking.com</b> — rebooked your August hotel on a price drop, <b>AED 230 back</b>\n🎟 <b>Promo</b> — 9 working codes + Fazaa partner pricing twice\n🏦 <b>Watchdog</b> — even opened products get re-shopped: e-Saver moved 3,1% → <b>3,4%</b>`, 2200);
    await c.card(chips([
      {t:'🤖 Open agents hub', fn:"A.go('agents')"},
      {t:'⚡ Try the P2P risk strategy', fn:"A.tmp.ag={healthy:true,local:true,promo:true,risk:true,careem:'agent'};A.go('agents')"},
    ]), 250);
  }},

  fallback:{ async run(c){
    await c.ai(`I can act on anything money-related across your <b>3 linked banks</b> — try one of these:`);
    await c.card(chips([
      {t:'💳 Best credit card', fn:"Chat.chipSend('Help me find a credit card with the best terms','findCard')"},
      {t:'📉 Why did I spend so much?', fn:"Chat.chipSend('Why did I spend so much in June?','spend')"},
      {t:'☪ Zakat', fn:"Chat.chipSend('How much zakat do I owe?','zakat')"},
      {t:'✈️ Can I afford a trip?', fn:"Chat.chipSend('Can I afford a AED 6 500 trip in August?','afford')"},
    ]), 250);
  }},
};
window.CHAT_SCRIPTS = SCRIPTS;

/* ---------- zakat interview helper (stateful chips) ---------- */
window.ZKChat = {
  menu(){ return `<div class="ch-quick">
    <button class="chip" onclick="ZKChat.homecash()">🏠 Cash at home</button>
    <button class="chip" onclick="ZKChat.trade()">📦 Goods I sell</button>
    <button class="chip" onclick="ZKChat.debtsBiz()">🏢 My debts & payroll</button>
    <button class="chip" onclick="ZKChat.points()">✈️ Miles & cashback</button>
    <button class="chip" onclick="ZKChat.company()">📜 Company shares & funds</button>
    <button class="chip" onclick="ZKChat.jewel()">💍 Family gold</button>
    <button class="chip" onclick="ZKChat.owed()">🤝 Money owed to me</button>
    <button class="chip" onclick="ZKChat.family()">👫 My wife’s wealth too</button>
    <button class="chip" onclick="ZKChat.verdict()">✅ That’s everything — verdict</button>
  </div>`; },
  debtsBiz(){ this.guard(async()=>{
    Chat.user('I have financing and I owe my team payroll — does that reduce zakat?');
    await Chat.ai(`Yes — <b>debts you owe reduce the zakat base</b> (Hanafi & Hanbali view, adopted by AAOIFI; the Shafi‘i school differs — I’ll respect your method either way).\n\nFrom your linked accounts I already see all of it:\n\n· Card statements <b>10 094,80</b>\n· BNPL plans <b>1 995</b>\n· Islamic home finance — <b>next 12 months only: 76 200</b> (long-term rule)\n· Car <b>19 680</b> · personal <b>7 920</b> (12-month slices)\n· <b>Team payroll due 9 800</b> — wages owed are a debt on you\n· Business financing <b>30 000</b> · invoice <b>22 000</b> · purchase <b>12 500</b> · B2B BNPL <b>8 400</b>\n\nTotal deduction: <b>AED ${fm(ZK.debtTotal(),0)}</b>. Each line has a toggle in the calculator.`, 1700);
    await Chat.ai(`One more thing — those facilities cost you <b>≈ AED 12 371/yr</b> in profit charges (excluding the home, which is priced well). Want my refinancing read: what to close, what to transfer?`, 1100);
    await Chat.card(`<div class="ch-quick">
      <button class="chip" onclick="Chat.chipSend('Yes — should I refinance anything?','refi')">⚡ Yes — refinance check</button>
      <button class="chip" onclick="ZKChat.verdict()">Later — verdict first</button>
    </div>`,250);
  });},
  async guard(fn){ if(CHAT.busy) return; CHAT.busy=true; try{ await fn(); } finally{ CHAT.busy=false; } },
  pending:null,
  LBL:{homecash:'Cash at home', trade:'Trade stock', owed:'Receivables', points:'Cashback'},
  amountChips(id, vals){
    this.pending=id;
    return `<div class="ch-quick">${vals.map(v=>`<button class="chip" onclick="ZKChat.setManual('${id}',${v},'${this.LBL[id]}')">AED ${fm(v,0)}</button>`).join('')}
      <button class="chip" onclick="A.toast('Just type the number below — e.g. 199 or 12 500','edit');document.getElementById('chInp')&&document.getElementById('chInp').focus()">✏️ Type any amount</button></div>`;
  },
  applyTyped(id, v){ const self=this;
    this.guard(async()=>{
      ZK.st().manual[id]={on:v>0, v};
      await Chat.ai(`Got it ✓ — <b>${self.LBL[id]||id}: AED ${fm(v)}</b>. Recalculated. Anything else?`, 800);
      await Chat.card(self.menu(),200);
    });
  },

  homecash(){ this.guard(async()=>{
    Chat.user('There’s some cash at home');
    await Chat.ai('Cash is zakatable wherever it sleeps — drawer, safe or bank. That’s <b>unanimous</b> across all schools. Roughly how much?');
    await Chat.card(this.amountChips('homecash',[1000,3500,10000]),250);
  });},
  trade(){ this.guard(async()=>{
    Chat.user('I keep goods for sale — I trade on the side');
    await Chat.ai('Then you’re a merchant for zakat purposes 🤝. <b>Trade goods are zakatable at today’s selling price</b> — agreed by <b>all four schools</b> (Hanafi, Maliki, Shafi‘i, Hanbali) and codified in <b>AAOIFI Shari‘ah Standard No. 35</b>. Count what’s in stock for resale — not your equipment. What’s the stock worth today?');
    await Chat.card(this.amountChips('trade',[10000,18000,40000]),250);
  });},
  owed(){ this.guard(async()=>{
    Chat.user('People owe me money');
    await Chat.ai('Receivables you <b>expect to collect</b> (“strong debts”) are zakatable now per the majority; hopeless debts are zakated only if recovered — a Hanafi nuance worth knowing. How much is realistically coming back?');
    await Chat.card(this.amountChips('owed',[2000,8000,20000]),250);
  });},
  setManual(id,v,label){ this.pending=null; this.guard(async()=>{
    ZK.st().manual[id]={on:v>0,v};
    Chat.user(`About AED ${fm(v,0)}`);
    await Chat.ai(`Added ✓ — <b>${label}: AED ${fm(v,0)}</b>. Anything else from the list, or shall I give the verdict?`,800);
    await Chat.card(this.menu(),200);
  });},

  points(){ this.guard(async()=>{
    Chat.user('What about my airline miles and cashback — are they zakatable? Is parking money in points a smart way to avoid zakat?');
    await Chat.ai(`Two different things:\n\n💳 <b>Cashback</b> — once it’s credited to your account it’s simply <b>money → zakatable</b>. I can see <b>AED 230</b> pending payout; I’ve added it.\n\n✈️ <b>Miles & points</b> — per most contemporary fatwa bodies they’re <b>not māl (wealth) yet</b>: you can’t sell or transfer them, the airline can void them, they’re a revocable licence. So <b>no zakat until you redeem them for something monetary</b>.`, 1700);
    await Chat.ai(`As for the “lifehack” — converting wealth into points <b>to dodge zakat</b> is a classic <b>ḥīlah (evasion trick)</b>, and scholars condemn it: deliberately engineering your wealth right before hawl to drop the obligation is sinful even when the maths technically works. The Qur’an’s garden-owners (al-Qalam 17–33) tried exactly this. Earn points naturally? Halal, enjoy them. Park wealth in them to escape the poor’s right? That defeats the entire point of zakat — and you’d be answerable for the intent.`, 1900);
    await Chat.card(this.menu(),200);
  });},
  company(){ this.guard(async()=>{
    Chat.user('I own 30% of an LLC and some fund units — how does zakat work there?');
    await Chat.ai(`Good question — this is where most calculators give up. Per <b>AAOIFI SS 35</b>:\n\n📜 <b>Shares held for dividends</b> (your LLC 30%) → zakat on the <b>company’s zakatable assets, pro-rata</b>: 30% × AED 84 000 net current assets = <b>AED 25 200</b> into your base. Fixed assets, brand, equipment — exempt.\n\n📈 <b>Shares held for trading</b> → full market value instead.\n\n🏛 <b>Funds</b> → use the fund’s reported zakatable ratio (your PE fund: 42% × 15 000 = <b>6 300</b>). Your Sukuk fund pays zakat <b>at fund level</b> — already covered, excluded.\n\nI’ve switched your scope to <b>Both (B2B + B2C)</b> — every business asset is itemised with a toggle.`, 2000);
    ZK.st().scope='both';
    await Chat.card(this.menu(),200);
  });},
  jewel(){ this.guard(async()=>{
    Chat.user('My wife has gold jewellery — does it count?');
    await Chat.ai(`This is a famous <b>khilaf</b> (scholarly difference):\n\n· <b>Hanafi school</b> — jewellery <b>is zakatable</b> (also the recorded view of <b>Sh. Ibn Baz</b> and <b>Sh. Ibn ‘Uthaymeen</b>)\n· <b>Maliki, Shafi‘i, Hanbali (majority)</b> — <b>personal-use</b> jewellery is exempt; only hoarded or trading gold counts\n\nWhich scholar or school do you follow? I’ll set the whole calculation to match.`, 1500);
    await Chat.card(`<div class="ch-quick">
      <button class="chip" onclick="ZKChat.scholar('hanafi','Mufti Taqi Usmani — Hanafi')">Mufti Taqi Usmani / Hanafi</button>
      <button class="chip" onclick="ZKChat.scholar('majority','the UAE Awqaf line — majority view')">UAE Awqaf / Majority</button>
      <button class="chip" onclick="ZKChat.scholar('precaution','Sh. Ibn ‘Uthaymeen — include jewellery, to be safe')">Ibn ‘Uthaymeen — include it</button>
      <button class="chip" onclick="ZKChat.scholar('aaoifi','AAOIFI Standard No. 35 — the institutional method')">AAOIFI standard</button>
    </div>`,250);
  });},
  scholar(method, label){ this.guard(async()=>{
    const s=ZK.st(); s.method=method;
    if(ZK_METHODS[method].jewellery){ s.rel.aisha=true; s.wak.aisha=true; }
    Chat.user(`I follow ${label.split('—')[0].trim()}`);
    await Chat.ai(`Set ✓ — calculating per <b>${label}</b>.\n\n${ZK_METHODS[method].who}\n\nNisab basis: <b>${ZK_METHODS[method].nisab==='silver'?'silver (595 g ≈ AED '+fm(ZAKAT.nisabSilverG*ZAKAT.silverPerG,0)+') — the cautious one':'gold (85 g ≈ AED '+fm(ZAKAT.nisabGoldG*ZAKAT.goldPerG,0)+')'}</b> · jewellery: <b>${ZK_METHODS[method].jewellery?'counted':'exempt (personal use)'}</b>.`, 1400);
    await Chat.card(this.menu(),200);
  });},

  family(){ this.guard(async()=>{
    Chat.user('We have two incomes — my wife works too. I handle zakat for the family.');
    await Chat.ai(`Important nuance: <b>zakat is an individual obligation</b> — each person owes on <b>their own</b> wealth. There’s no “household zakat” in fiqh.\n\nBut you <b>can calculate and pay on their behalf as wakīl</b> — wife, elderly parents, anyone — valid in all four schools, <b>as long as they give permission</b> (and the niyyah is theirs). One payment from you, clean separate ledgers inside.`, 1600);
    await Chat.card(`<div class="ch-quick">
      <button class="chip" onclick="ZKChat.addSpouse()">Add Aisha — she consented</button>
      <button class="chip" onclick="ZKChat.addParents()">Add my elderly parents — they consented</button>
      <button class="chip" onclick="ZKChat.spouseSolo()">Keep it separate — just remind them</button>
    </div>`,250);
  });},
  addParents(){ this.guard(async()=>{
    const s=ZK.st(); s.rel.dad=true; s.wak.dad=true; s.rel.mum=true; s.wak.mum=true;
    Chat.user('Add my parents — they gave me permission');
    await Chat.ai(`Done ✓ — <b>wakāla on for both</b>.\n\n👴 <b>Dad</b>: pension savings AED 88 400 → due <b>AED ${fm(ZK.relDue('dad',ZK.st().method)||2210)}</b> under every school.\n\n👵 <b>Mum</b> is the textbook case: cash AED 12 600 + <b>210 g of gold jewellery</b>. Under <b>Majority/AAOIFI</b> she owes <b>nothing</b> (cash below nisab, jewellery exempt). Under <b>Hanafi / Ibn ‘Uthaymeen</b> the gold counts → <b>AED ${fm(ZK.relUnder('mum','hanafi')*ZAKAT.rate)}</b>. Whose school should I follow for her — hers, not yours, ideally?`, 2000);
    await Chat.card(this.menu(),200);
  });},
  addSpouse(){ this.guard(async()=>{
    const s=ZK.st(); s.rel.aisha=true; s.wak.aisha=true;
    Chat.user('Add her — she consented');
    await Chat.ai(`Done ✓ — <b>wakāla on</b>. Her ledger: salary savings <b>AED ${fm(ZAKAT.spouse.cash,0)}</b> + gold jewellery <b>${ZAKAT.spouse.jewelleryG} g</b> (≈ AED ${fm(ZAKAT.spouse.jewelleryG*ZAKAT.goldPerG,0)}) — ${ZK.meth().jewellery?'<b>counted</b> under your chosen method':'<b>exempt</b> as personal use under your chosen method'}. She’s above nisab either way.`,1300);
    await Chat.card(this.menu(),200);
  });},
  spouseSolo(){ this.guard(async()=>{
    const s=ZK.st(); s.rel.aisha=true; s.wak.aisha=false;
    Chat.user('Keep it separate');
    await Chat.ai(`Respect ✓ — I’ll compute her side so she can verify it, and send her the breakdown to pay herself. Her obligation stays hers.`,1000);
    await Chat.card(this.menu(),200);
  });},

  verdict(){ this.guard(async()=>{
    Chat.user('That’s everything — give me the verdict');
    const m=ZK.meth(), s=ZK.st();
    const john=ZK.john(), D=ZK.due(), dueJ=D.j;
    await Chat.ai(`Here it is — <b>${m.n} method</b>, hawl anchored to 1 Ramadan 1447 (tomorrow):`, 1100);
    await Chat.card(`<div class="offer-card" style="min-width:0">
      <div class="flex between"><span class="tag gold">☪ Zakat 1447H</span><span class="micro">nisab ${m.nisab} basis ✓ exceeded</span></div>
      <div class="offer-amt tnum">AED ${fm(D.t)}</div>
      <div class="offer-sub">2,5% · after deducting AED ${fm(ZK.debtTotal(),0)} of due debts (incl. payroll & business financing)</div>
      <div class="kv" style="padding-top:10px"><span class="k">${USER.first} — base AED ${fm(john,0)}</span><span class="v tnum">${fm(dueJ)}</span></div>
      ${ZAKAT.family.filter(f=>s.rel[f.id]).map(f=>`<div class="kv"><span class="k">${f.name} ${s.wak[f.id]?'(you pay, wakīl)':'(own payment)'}</span><span class="v tnum">${ZK.relDue(f.id,s.method)>0?fm(ZK.relDue(f.id,s.method)):'0 — below nisab'}</span></div>`).join('')}
      <div class="micro mt8">${m.who}</div>
      <button class="btn lime mt12" onclick="A.go('zakat')">Review & pay tomorrow — 1 Ramadan</button>
    </div>`);
    await Chat.ai(`May it be accepted 🤲. I’ll recalculate at <b>live gold/silver prices tomorrow morning</b> before paying, and remind you to niyyah. <i>Educational prototype — confirm with your local mufti.</i>`, 1200);
  });},
};
})();
