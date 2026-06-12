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
    if (/(credit )?card/.test(t) && /find|best|help|need|new/.test(t)) return go('findCard');
    if (/ps ?5|playstation/.test(t)) return go('ps5');
    if (/loan|borrow|financ/.test(t)) return go('loan');
    if (/spend|spent|where.*money|expense/.test(t)) return go('spend');
    if (/subscri/.test(t)) return go('subs');
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
    await c.ai(`Hi, <b>${USER.first}</b>. ${BRIEFING.line}`, 700);
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

  loan:{ user:'Get me the best loan with one-click activation', async run(c){
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
    await c.ai(`I track <b>${SUBS.length} subscriptions</b> ≈ <b>AED ${fm(total)}/mo</b>. Two look wasteful:\n\n· <b>Anghami Plus</b> — unused for 6 weeks\n· <b>Spotify</b> — overlaps with Anghami\n\nCancelling both saves <b>AED 527/yr</b>.`);
    await c.card(chips([
      {t:'Cancel Anghami for me', fn:"Subs.cancel('Anghami Plus',true)"},
      {t:'Open subscriptions', fn:"A.go('subs')"},
    ]), 250);
  }},

  zakat:{ user:'How much zakat do I owe?', async run(c){
    await c.ai('I calculated it live from your linked balances, gold and halal investments — wealth is above nisab, so zakat is due:', 1100);
    await c.card(zakatCard());
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
})();
