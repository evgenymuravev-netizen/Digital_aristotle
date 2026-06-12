/* ============ payments · insights · goals · rules · story ============ */
(function(){

/* ---------------- PAY hub ---------------- */
SCREENS.pay = () => `
  <div class="scr" style="padding-bottom:170px">
    ${hdr('Payments',{big:true})}
    <div class="grid4">
      ${[['send','Send','send'],['recv','Request','request'],['qr','Scan QR','qr'],['swap','Between','between'],
         ['globe','Abroad','intl'],['zap','Bills','bills'],['split','Split','split-bill'],['cal','Scheduled','upcoming']]
        .map(([i,t,r])=>`<button class="qa" onclick="A.go('${r}')"><span class="qa-ic">${ic(i,22)}</span><span>${t}</span></button>`).join('')}
    </div>
    <div class="flex between mt20 mb8"><span class="lbl">Frequent</span><span class="micro">Aani · instant, by phone number</span></div>
    <div class="hscroll">
      ${CONTACTS.filter(c=>c.fav).map(c=>`
        <button class="qa" style="min-width:74px" onclick="A.go('send/${esc(c.n)}')">${avx(c.n)}<span>${c.n.split(' ')[0]}</span></button>`).join('')}
      <button class="qa" style="min-width:74px" onclick="A.go('send')"><span class="avx" style="background:var(--glass2)">${ic('plus',18)}</span><span>New</span></button>
    </div>
    <div class="lbl mt20 mb8">Today</div>
    <div class="listcard">
      ${TXNS.filter(t=>t.cat==='transfer'&&t.d.includes('Today')).map(rowTxn).join('')}
    </div>
    <div class="card soft mt12 flex" style="gap:12px">${ic('spark',20,'lime-t')}
      <div class="micro">“Send 200 to Sara every Friday” — just tell Noor AI, it becomes a rule.</div></div>
  </div>`;

/* ---------------- send flow ---------------- */
SCREENS.send = (name) => {
  if (!name) return `
  <div class="scr">
    ${hdr('Send money')}
    <div class="input flex">${ic('search',18)} <span style="color:var(--tx3)">Name, +971 phone, or IBAN</span></div>
    <div class="lbl mt16 mb8">Contacts on Aani</div>
    <div class="listcard">
      ${CONTACTS.map(c=>`
        <div class="row" onclick="A.go('send/${esc(c.n)}')">
          ${avx(c.n)}
          <div class="row-main"><div class="row-t">${c.n}</div><div class="row-d">${c.ph} · ${BANKS[c.bank].name}</div></div>
          <span class="chev">${ic('chevR',16)}</span>
        </div>`).join('')}
    </div>
  </div>`;
  const amt = A.tmp.payAmt || '0';
  return `
  <div class="scr">
    ${hdr('Send to '+name.split(' ')[0])}
    <div style="text-align:center">${avx(name,'lg')}
      <div class="h3 mt8">${name}</div><div class="micro">Aani · arrives instantly · free</div></div>
    <div style="text-align:center;font:800 52px/1 Inter,sans-serif;letter-spacing:-.04em;margin-top:22px" class="tnum">
      <span style="font-size:24px;color:var(--tx3)">AED</span> ${fm(parseFloat(amt)||0,0)}</div>
    <div class="chips mt16" style="justify-content:center">
      ${[50,100,250,500].map(v=>`<button class="chip" onclick="A.tmp.payAmt='${v}';A.refresh()">AED ${v}</button>`).join('')}
    </div>
    <div class="keypad">
      ${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="Pay.kp('${n}','${esc(name)}')">${n}</button>`).join('')}
      <button class="ghosted" onclick="Pay.kp('00','${esc(name)}')">00</button>
      <button onclick="Pay.kp('0','${esc(name)}')">0</button>
      <button class="ghosted" onclick="Pay.kp('del','${esc(name)}')">⌫</button>
    </div>
    <button class="btn lime mt16" ${parseFloat(amt)>0?'':'disabled'} onclick="Pay.review('${esc(name)}')">Continue</button>
  </div>`;
};
window.Pay = {
  kp(k, name){
    let v = A.tmp.payAmt||'';
    if(k==='del') v=v.slice(0,-1); else if(v.length<6) v+=k;
    A.tmp.payAmt=v; A.refresh();
  },
  review(name){
    const amt=parseFloat(A.tmp.payAmt)||0;
    A.sheet(`
      <div class="h2">Confirm transfer</div>
      <div class="kv mt12"><span class="k">To</span><span class="v">${name} · Aani</span></div>
      <div class="kv"><span class="k">Amount</span><span class="v tnum">AED ${fm(amt,0)}</span></div>
      <div class="kv"><span class="k">From</span><span class="v">FAB Salary ··5689</span></div>
      <div class="kv"><span class="k">Fee · arrival</span><span class="v">Free · instant</span></div>
      <button class="btn lime mt12" onclick="A.closeSheet();Pay.done('${esc(name)}',${amt})">${ic('faceid',20)} Confirm with Face ID</button>`);
  },
  done(name, amt){
    A.tmp.payAmt='';
    A.go('pay-success/'+encodeURIComponent(name)+'|'+amt);
  },
  buyPS5(store, price, split){
    if(!A.tmp.bnpl) A.tmp.bnpl = split ? 'noor' : 'full';
    const offers = BNPL_OFFERS(price);
    const sel = offers.find(o=>o.id===A.tmp.bnpl) || offers[0];
    A.sheet(`
      <div class="h2">Order PlayStation 5 Pro 2 Tb</div>
      <div class="kv mt8"><span class="k">Store · delivery</span><span class="v">${store} · today 2–4 h</span></div>
      <div class="kv"><span class="k">Price</span><span class="v tnum">AED ${fm(price,0)}</span></div>
      <div class="lbl mt8 mb8">How do you want to pay? <span class="tag lime" style="margin-left:4px">✦ all pre-approved</span></div>
      <div class="listcard" style="padding:2px 14px">
        ${offers.map(o=>`
          <div class="row" onclick="A.tmp.bnpl='${o.id}';Pay.buyPS5('${esc(store)}',${price},true)">
            ${blg(o.bank)}
            <div class="row-main">
              <div class="row-t" style="font-size:13.5px">${o.t}</div>
              <div class="row-d" style="white-space:normal">${o.d}</div>
              <div class="row-sub mt4" style="color:${o.rec?'var(--lime)':'var(--grn)'}">${o.tag}${o.pre?' · '+o.pre:''}</div>
            </div>
            <div class="row-r">
              <div class="row-amt tnum">${fm(o.today,2)}</div>
              <div class="row-sub">${o.parts>1?'× '+o.parts:'once'}</div>
            </div>
            <span class="bigico" style="width:26px;height:26px;min-width:26px;border-radius:50%;background:${A.tmp.bnpl===o.id?'var(--lime)':'var(--glass2)'};color:var(--ink)">${A.tmp.bnpl===o.id?ic('check',14):''}</span>
          </div>`).join('')}
      </div>
      ${sel.parts>1?`<div class="micro mt8">Today AED ${fm(sel.today)} · then ${sel.parts-1} × AED ${fm(sel.today)} monthly · total AED ${fm(price,0)} — no interest, no late-fee traps.</div>`:''}
      <button class="btn lime mt12" onclick="A.closeSheet();Pay.ps5Done('${esc(store)}',${price})">${ic('faceid',20)} Confirm with Face ID — ${sel.parts>1?`${sel.parts} × AED ${fm(sel.today)}`:'AED '+fm(price,0)}</button>`);
  },
  ps5Done(store, price){
    const offers = BNPL_OFFERS(price);
    const sel = offers.find(o=>o.id===A.tmp.bnpl) || offers[0];
    confetti(document.getElementById('screen'));
    A.toast('Order placed — courier today 2–4 h','check');
    if (document.getElementById('chWrap')) {
      const how = sel.id==='full'
        ? `for AED ${fm(price,0)} on your FAB card (+AED ${fm(price*0.05,0)} cashback)`
        : `with <b>${sel.t}</b> — AED ${fm(sel.today)} today, ${sel.parts-1} more monthly, 0 fees${sel.id==='noor'?', Shariah-compliant':''}`;
      Chat.push({from:'ai', html:`Done ✅ Ordered from <b>${store}</b> ${how}. I compared Tabby, Tamara and Noor Split — all pre-approved; ${sel.id==='noor'?'Noor Split won on total cost':'your pick is locked in'}. Tracking lands in your briefing tomorrow.`});
    }
  },
};
SCREENS['pay-success'] = (arg) => {
  const [name, amt] = decodeURIComponent(arg).split('|');
  return `
  <div class="scr center">
    <div class="checkpop">${ic('check',46,'',2.4)}</div>
    <div class="h1 mt20">AED ${fm(parseFloat(amt),0)} sent</div>
    <div class="sub mt8">${name} received it instantly via Aani.</div>
    <div class="card mt20" style="width:100%">
      <div class="kv"><span class="k">Reference</span><span class="v tnum">AANI-2026-0611-88412</span></div>
      <div class="kv"><span class="k">From</span><span class="v">FAB Salary ··5689</span></div>
      <div class="kv"><span class="k">Fee</span><span class="v">AED 0,00</span></div>
    </div>
    <div class="btnrow mt16" style="width:100%">
      <button class="btn ghost" onclick="A.toast('Receipt shared','share')">${ic('share',18)} Receipt</button>
      <button class="btn pri" onclick="A.go('home')">Done</button>
    </div>
  </div>`;
};
AFTER['pay-success'] = () => confetti(document.getElementById('screen'));

/* ---------------- request / between / qr ---------------- */
SCREENS.request = () => `
  <div class="scr">
    ${hdr('Request money')}
    <div class="card" style="text-align:center">
      <div class="lbl">Your Aani QR</div>
      <div style="width:170px;height:170px;margin:14px auto;border-radius:18px;background:#fff;display:flex;align-items:center;justify-content:center;color:#0B1410">${ic('qr',120,'',1)}</div>
      <div class="h3">${USER.first} ${USER.last} · +971 50 482 7791</div>
      <div class="micro mt4">Anyone scans → money lands in FAB ··5689</div>
    </div>
    <div class="btnrow mt12">
      <button class="btn ghost" onclick="A.toast('Payment link copied: noor.ae/p/john','link')">${ic('link',18)} Copy link</button>
      <button class="btn pri" onclick="A.toast('Request sent to Sara — AED 350','check')">Request from Sara</button>
    </div>
  </div>`;
SCREENS.between = () => `
  <div class="scr">
    ${hdr('Between my accounts')}
    <div class="card">
      <div class="lbl mb8">From</div>
      <div class="row static">${blg('wio')}<div class="row-main"><div class="row-t">Wio Current ··2204</div><div class="row-d tnum">AED 17 865,90</div></div></div>
      <div style="display:flex;justify-content:center;margin:2px 0"><span class="bigico" style="width:34px;height:34px;min-width:34px">${ic('swap',17)}</span></div>
      <div class="lbl mb8">To</div>
      <div class="row static">${blg('fab')}<div class="row-main"><div class="row-t">FAB Salary ··5689</div><div class="row-d">Arrives in seconds</div></div></div>
    </div>
    <div class="chips mt12" style="justify-content:center">${[1000,3000,5000].map(v=>`<button class="chip ${v===3000?'on':''}">AED ${fm(v,0)}</button>`).join('')}</div>
    <button class="btn lime mt16" onclick="A.toast('AED 3 000 moved Wio → FAB','check');A.back()">Move AED 3 000</button>
    <div class="micro mt12" style="text-align:center">Cross-bank transfers between your own accounts — one tap, no IBANs.</div>
  </div>`;
SCREENS.qr = () => `
  <div class="scr nopad" style="background:#04150F;display:flex;flex-direction:column;padding:64px 18px 40px">
    ${hdr('Scan & pay',{right:'<button class="iconbtn" onclick="A.toast(\'Torch on\',\'zap\')">'+ic('zap',18)+'</button>'})}
    <div class="qr-frame"><div class="qr-scanline"></div></div>
    <div class="sub" style="text-align:center">Point at any <b style="color:var(--tx)">Aani</b> or merchant QR</div>
    <div id="qrHit" class="mt16"></div>
    <div class="btnrow mt16">
      <button class="btn ghost" onclick="A.go('request')">My QR</button>
      <button class="btn ghost" onclick="A.toast('Gallery (mock)','doc')">From photo</button>
    </div>
  </div>`;
AFTER.qr = () => setTimeout(()=>{
  const el=document.getElementById('qrHit'); if(!el) return;
  el.innerHTML = `<div class="card lime tap" onclick="Pay.qrSheet()">
    <div class="flex between"><b>QR detected — Caffe Nero</b><span class="tnum">AED 24,50</span></div>
    <div class="micro mt4">Tap to pay</div></div>`;
},1900);
Pay.qrSheet = () => A.sheet(`
  <div class="h2">Caffe Nero · JLT</div>
  <div class="kv mt12"><span class="k">Amount</span><span class="v tnum">AED 24,50</span></div>
  <div class="kv"><span class="k">Pay with</span><span class="v">FAB Visa · 5% back</span></div>
  <button class="btn lime mt12" onclick="A.closeSheet();A.toast('Paid AED 24,50 — receipt saved','check');A.go('home')">${ic('faceid',18)} Pay AED 24,50</button>`);

/* ---------------- split bill ---------------- */
SCREENS['split-bill'] = () => {
  const sel = A.tmp.split || (A.tmp.split=new Set(['Sara AlBlooshi','Ahmed Hassan']));
  const share = 1244.75/(sel.size+1);
  return `
  <div class="scr">
    ${hdr('Split a bill')}
    <div class="card flex" style="gap:12px">${catIc('shopping')}<div class="f1"><div class="row-t">IKEA Festival City</div><div class="row-d">3 Jun · FAB Visa</div></div><b class="tnum">AED 1 244,75</b></div>
    <div class="lbl mt16 mb8">Split with</div>
    <div class="listcard">
      ${CONTACTS.slice(0,5).map(c=>`
        <div class="row" onclick="A.tmp.split.has('${esc(c.n)}')?A.tmp.split.delete('${esc(c.n)}'):A.tmp.split.add('${esc(c.n)}');A.refresh()">
          ${avx(c.n)}
          <div class="row-main"><div class="row-t">${c.n}</div></div>
          <span class="bigico" style="width:28px;height:28px;min-width:28px;border-radius:9px;background:${sel.has(c.n)?'var(--lime)':'var(--glass2)'};color:var(--ink)">${sel.has(c.n)?ic('check',15):''}</span>
        </div>`).join('')}
    </div>
    <div class="card soft mt12 flex between"><span class="sub">Each pays (incl. you)</span><b class="tnum">AED ${fm(share)}</b></div>
    <button class="btn lime mt12" ${sel.size?'':'disabled'} onclick="A.toast('Aani requests sent to ${sel.size} people','check');A.back()">Request AED ${fm(share)} × ${sel.size}</button>
  </div>`;
};

/* ---------------- bills ---------------- */
SCREENS.bills = () => `
  <div class="scr">
    ${hdr('Bills & utilities')}
    <div class="card lime tap" onclick="A.toast('DEWA paid — AED 412,60','check')">
      <div class="flex between"><b>DEWA due in 4 days</b><b class="tnum">AED 412,60</b></div>
      <div class="micro mt4">Tap to pay now · or it autopays on the 15th</div>
    </div>
    <div class="listcard mt12">
      ${BILLERS.map((b,i)=>`
        <div class="row" onclick="A.sheet(Bills.sheet(${i}))">
          <span class="bigico" style="background:${b.c}1f;color:${b.c}">${ic(b.ic,21)}</span>
          <div class="row-main"><div class="row-t">${b.n}</div><div class="row-d">${b.d}</div></div>
          <div class="row-r">${b.due?`<div class="row-amt tnum">AED ${fm(b.due)}</div>`:'<span class="tag grn">Paid ✓</span>'}
            <div class="row-sub">${b.autopay?'Autopay on':'Manual'}</div></div>
        </div>`).join('')}
    </div>
    <div class="micro mt12" style="text-align:center">Billers detected from your transaction history — zero setup.</div>
  </div>`;
window.Bills = { sheet(i){ const b=BILLERS[i]; return `
  <div class="h2">${b.n}</div><div class="sub mt4">${b.d}</div>
  ${b.due?`<div class="kv mt8"><span class="k">Outstanding</span><span class="v tnum">AED ${fm(b.due)}</span></div>
  <button class="btn lime mt8" onclick="A.closeSheet();A.toast('${esc(b.n)} paid — AED ${fm(b.due)}','check')">Pay now</button>`
  :'<div class="card soft mt12"><div class="sub">Nothing due. You’re all clear ✓</div></div>'}
  <div class="card soft mt8 flex between"><div><div class="row-t" style="font-size:13.5px">Autopay</div><div class="row-d">2 days before due, from FAB ··5689</div></div>
  <button class="switch lime ${b.autopay?'on':''}" onclick="this.classList.toggle('on')"></button></div>`; } };

/* ---------------- international ---------------- */
SCREENS.intl = () => {
  const fx = FX[A.tmp.fxI||0];
  const amt = 2000;
  return `
  <div class="scr">
    ${hdr('Send abroad')}
    <div class="chips scroll">${FX.map((f,i)=>`<button class="chip ${i===(A.tmp.fxI||0)?'on':''}" onclick="A.tmp.fxI=${i};A.refresh()">${f.flag} ${f.c}</button>`).join('')}</div>
    <div class="card mt16">
      <div class="lbl">You send</div>
      <div class="flex between mt8"><span style="font:800 30px Inter,sans-serif" class="tnum">AED ${fm(amt,0)}</span><span class="tag gray">FAB ··5689</span></div>
      <div class="hr"></div>
      <div class="lbl">${fx.n} — they receive</div>
      <div class="flex between mt8"><span style="font:800 30px Inter,sans-serif;color:var(--lime)" class="tnum">${fx.flag} ${fm(amt*fx.rate,0)} ${fx.c}</span></div>
    </div>
    <div class="listcard mt12">
      <div class="kv" style="padding:11px 2px"><span class="k">Rate (mid-market, locked 30 min)</span><span class="v tnum">1 AED = ${fx.rate} ${fx.c}</span></div>
      <div class="kv" style="padding:11px 2px"><span class="k">Noor fee</span><span class="v grn-t">AED 0 — free</span></div>
      <div class="kv" style="padding:11px 2px"><span class="k">Arrives</span><span class="v">Within minutes</span></div>
    </div>
    <div class="card soft mt12 flex" style="gap:10px">${ic('trendUp',18,'grn-t')}<div class="micro">30-day high. Banks would charge ~AED 47 + 1.2% margin for this transfer.</div></div>
    <button class="btn lime mt16" onclick="A.toast('Transfer created — recipient gets it in minutes','check');A.back()">Continue</button>
  </div>`;
};

/* ---------------- INSIGHTS ---------------- */
SCREENS.insights = () => {
  const over = CATSPEND.filter(c=>c.amt>c.bud);
  return `
  <div class="scr" style="padding-bottom:170px">
    <div class="flex between"><div class="h1">Insights</div><button class="chip" onclick="Story.open()">✦ Money Story</button></div>
    <div class="chips mt12"><button class="chip">April</button><button class="chip">May</button><button class="chip on">June</button></div>
    <div class="card mt16" style="display:flex;gap:18px;align-items:center">
      ${donut(CATSPEND.map(c=>({v:c.amt,c:CATS[c.cat].c})),132,15,
        `<div class="lbl">Spent</div><div style="font:800 19px Inter,sans-serif" class="tnum">${fm(BUDGET.spent,0)}</div><div class="micro">of ${fm(BUDGET.total,0)}</div>`)}
      <div class="f1">
        <div class="sub">June pace: <b style="color:var(--red)">18% above</b> normal</div>
        <div class="mt8">${meter(BUDGET.spent/BUDGET.total,'#FFB050')}</div>
        <div class="micro mt8">AED ${fm(BUDGET.total-BUDGET.spent,0)} left · 19 days to go</div>
        <button class="chip mt8" onclick="chatDeep('spend')">Ask why ✦</button>
      </div>
    </div>
    ${over.length?`<div class="card mt12" style="border-color:rgba(255,176,80,.4)">
      <b style="font-size:13.5px">⚠️ Over budget: ${over.map(c=>CATS[c.cat].n).join(', ')}</b>
      <div class="micro mt4">Dining is +38% vs May — mostly delivery. Want a cap?</div>
      <button class="chip mt8" onclick="A.go('rule-new')">Set a smart cap</button></div>`:''}
    <div class="lbl mt20 mb8">Categories</div>
    <div class="listcard">
      ${CATSPEND.map(c=>`
        <div class="row" onclick="A.go('cat/${c.cat}')">
          ${catIc(c.cat)}
          <div class="row-main"><div class="row-t">${CATS[c.cat].n}</div>
            <div class="mt4">${meter(c.amt/c.bud, c.amt>c.bud?'#FF7A6B':CATS[c.cat].c)}</div></div>
          <div class="row-r"><div class="row-amt tnum">${fm(c.amt,0)}</div><div class="row-sub tnum">of ${fm(c.bud,0)}</div></div>
        </div>`).join('')}
    </div>
    <div class="lbl mt20 mb8">Top merchants</div>
    <div class="listcard">
      ${MERCHANTS_TOP.slice(0,4).map(m=>`
        <div class="row" onclick="A.toast('${esc(m.m)}: ${m.n} purchases in June','info')">
          ${catIc(m.cat,38)}
          <div class="row-main"><div class="row-t">${m.m}</div><div class="row-d">${m.n} purchase${m.n>1?'s':''}</div></div>
          <div class="row-amt tnum">${fm(m.amt)}</div>
        </div>`).join('')}
    </div>
    <div class="card lime mt16 tap" onclick="A.tmp.bizI=0;A.go('biz')">
      <div class="flex between"><b style="font-size:14px">🏪 Business insights — 3 new stories</b>${ic('chevR',18)}</div>
      <div class="micro mt4">Sales +30% · rejections ↓12% · CAC vs category — your SME side, story-style</div>
    </div>
    <div class="grid2 mt16">
      <div class="card tap" onclick="A.go('subs')"><span class="lbl">Subscriptions</span><div class="h3 mt8 tnum">AED 972 / mo</div><div class="micro mt4">2 look wasteful</div></div>
      <div class="card tap" onclick="A.go('forecast')"><span class="lbl">Safe to spend</span><div class="h3 mt8 tnum lime-t">AED 9 540</div><div class="micro mt4">until salary day</div></div>
      <div class="card tap" onclick="A.go('health')"><span class="lbl">Financial health</span><div class="h3 mt8">78 / 100</div><div class="micro mt4">▲ 4 this month</div></div>
      <div class="card tap" onclick="A.go('score')"><span class="lbl">AECB score</span><div class="h3 mt8">745</div><div class="micro mt4">Very good</div></div>
    </div>
  </div>`;
};

SCREENS.cat = (id) => {
  const c = CATSPEND.find(x=>x.cat===id)||CATSPEND[0];
  const tx = TXNS.filter(t=>t.cat===id);
  return `
  <div class="scr">
    ${hdr(CATS[id].n)}
    <div class="card" style="text-align:center">
      ${catIc(id,56)}
      <div style="font:800 32px Inter,sans-serif" class="tnum mt12">AED ${fm(c.amt)}</div>
      <div class="micro mt4">June · budget AED ${fm(c.bud,0)} ${c.amt>c.bud?'· <b style="color:var(--red)">over by '+fm(c.amt-c.bud,0)+'</b>':''}</div>
      <div class="barrow mt16">
        ${[0.5,0.7,0.62,0.9,1].map((v,i)=>`<div class="bcol"><div class="b ${i===4?'hot':''}" style="height:${v*70}px"></div><span>${['Feb','Mar','Apr','May','Jun'][i]}</span></div>`).join('')}
      </div>
    </div>
    <div class="btnrow mt12">
      <button class="btn ghost sm" onclick="Insights.budgetSheet('${id}')">Edit budget</button>
      <button class="btn ghost sm" onclick="A.go('rule-new')">Add a cap rule</button>
    </div>
    <div class="lbl mt16 mb8">Transactions</div>
    <div class="listcard">${tx.length?tx.map(rowTxn).join(''):'<div class="row static"><div class="row-d">No June transactions in this category.</div></div>'}</div>
  </div>`;
};

/* ---------------- subscriptions hunter ---------------- */
SCREENS.subs = () => {
  const total = SUBS.reduce((s,x)=>s+x.amt,0);
  return `
  <div class="scr">
    ${hdr('Subscriptions')}
    <div class="card">
      <div class="flex between"><span class="lbl">Detected automatically</span><span class="tag lime">${SUBS.length} active</span></div>
      <div style="font:800 30px Inter,sans-serif" class="tnum mt8">AED ${fm(total)} <span style="font-size:15px;color:var(--tx2)">/ month</span></div>
      <div class="micro mt4">≈ AED ${fm(total*12,0)} a year · across 3 banks</div>
    </div>
    <div class="card mt12" style="border-color:rgba(215,240,80,.45)">
      <b style="font-size:13.5px">✦ Noor found AED 527/yr to save</b>
      <div class="micro mt4">Anghami unused 6 weeks · Spotify duplicates it</div>
      <button class="chip mt8" onclick="Subs.cancel('Anghami Plus')">Cancel Anghami for me</button>
    </div>
    <div class="listcard mt12">
      ${SUBS.map((s,i)=>`
        <div class="row" onclick="A.sheet(Subs.sheet(${i}))">
          <span class="bigico" style="background:${s.c}1f;color:${s.c}">${ic(s.ic,21)}</span>
          <div class="row-main"><div class="row-t">${s.m}</div><div class="row-d">${s.next} · ${s.used}${s.flag?' · <b style=color:var(--gold)>'+s.flag+'</b>':''}</div></div>
          <div class="row-amt tnum">${fm(s.amt)}</div>
        </div>`).join('')}
    </div>
  </div>`;
};
window.Subs = {
  sheet(i){ const s=SUBS[i]; return `
    <div class="h2">${s.m}</div><div class="sub mt4 tnum">AED ${fm(s.amt)} / month · bills on the ${s.day} · ${s.acc.includes('cc')?'FAB Visa':'FAB account'}</div>
    <div class="card soft mt12"><div class="micro">${s.used}. ${s.flag||'Usage looks healthy.'}</div></div>
    <div class="btnrow mt12">
      <button class="btn ghost" onclick="A.closeSheet();A.toast('Reminder 2 days before each ${esc(s.m)} debit','bell')">Remind me</button>
      <button class="btn danger" onclick="A.closeSheet();Subs.cancel('${esc(s.m)}')">Cancel it</button>
    </div>`; },
  cancel(name, fromChat){
    A.toast(`Cancellation for ${name} filed via your bank — refund requested`,'check');
    if(fromChat && document.getElementById('chWrap'))
      Chat.push({from:'ai', html:`Done ✅ I filed the <b>${name}</b> cancellation through FAB and requested a refund of the unused period. You’ll save <b>AED 240/yr</b>. I’ll confirm within 24 h.`});
  }
};

/* ---------------- forecast / health ---------------- */
SCREENS.forecast = () => `
  <div class="scr">
    ${hdr('Cashflow forecast')}
    <div class="card">
      <span class="lbl">Safe to spend until salary (25 Jun)</span>
      <div style="font:800 36px Inter,sans-serif;color:var(--lime)" class="tnum mt8">AED 9 540</div>
      <div class="mt12">${spark([27.5,26.9,26.1,25.8,24.9,24.2,23.6,25.1,24.4,23.8,56.3,54.9],330,84,'#53DE8E')}</div>
      <div class="micro mt8">Balance projection across all banks — the jump is salary day. Floor never drops below AED 8 000 ✓</div>
    </div>
    <div class="lbl mt16 mb8">Already accounted for</div>
    <div class="listcard">
      ${UPCOMING.filter(u=>!u.inc).map(u=>`
        <div class="row static"><span class="bigico" style="background:${u.c}1f;color:${u.c}">${ic(u.ic,20)}</span>
        <div class="row-main"><div class="row-t">${u.t}</div><div class="row-d">${u.d}</div></div><div class="row-amt tnum">−${fm(u.amt)}</div></div>`).join('')}
    </div>
    <div class="card soft mt12 flex" style="gap:10px">${ic('spark',18,'lime-t')}<div class="micro">Forecast learns your burn-rate per weekday — accuracy currently 94%.</div></div>
  </div>`;

SCREENS.health = () => `
  <div class="scr">
    ${hdr('Financial health')}
    <div class="card" style="display:flex;flex-direction:column;align-items:center">
      ${gaugeSemi(0.78, 220, '#D7F050', `<div style="font:800 40px Inter,sans-serif" class="tnum">78</div><div class="micro">of 100 · ▲4</div>`)}
      <div class="sub mt8">Better than <b style="color:var(--lime)">81%</b> of Noor users your age</div>
    </div>
    <div class="listcard mt12">
      ${[['Savings rate','18% of income','Excellent — aim 20%',true],
         ['Debt burden','19% of income','Healthy (UAE cap: 50%)',true],
         ['Emergency fund','3.2 months','Target 6 months',false],
         ['Spending discipline','2 of 9 budgets over','Dining needs a cap',false]]
        .map(([t,v,d,ok])=>`<div class="row static">
          <span class="bigico" style="color:${ok?'var(--grn)':'var(--gold)'}">${ic(ok?'check':'alert',20)}</span>
          <div class="row-main"><div class="row-t">${t} — ${v}</div><div class="row-d">${d}</div></div></div>`).join('')}
    </div>
    <button class="btn lime mt16" onclick="chatDeep('save')">✦ Make me a plan</button>
  </div>`;

/* ---------------- Money Story (stories UX) ---------------- */
const STORY_SLIDES = [
  ()=>`<div class="lbl">June · Money story</div><div class="st-big mt12">You kept<br><span class="st-em">AED 18 287</span><br>this month.</div><div class="sub mt16">Income 32 500 − spent 14 213. A 56% save rate — elite tier. 🏆</div>`,
  ()=>`<div class="lbl">Biggest splurge</div><div class="st-big mt12">IKEA<br><span class="st-em">AED 1 244,75</span></div><div class="sub mt16">3 June · Festival City. The new sofa better be worth it. 🛋️</div>`,
  ()=>`<div class="lbl">Habit watch</div><div class="st-big mt12">Dining<br><span class="st-em">+38%</span></div><div class="sub mt16">AED 1 932 on eating out — 7 Talabat orders. May was 1 400. Cap it?</div>`,
  ()=>`<div class="lbl">Quiet win</div><div class="st-big mt12">Round-ups<br><span class="st-em">+1,2 g gold</span></div><div class="sub mt16">AED 184 of spare change became gold without you noticing. ✨</div>`,
  ()=>`<div class="lbl">June forecast</div><div class="st-big mt12">On track for<br><span class="st-em">AED 19 400</span><br>saved.</div><div class="sub mt16">Keep this pace → Hajj fund full 3 months early. 🕋</div>`,
];
window.Story = {
  i:0,
  open(){ this.i=0; this.render(); },
  render(){
    const host=document.getElementById('storyHost'); host.classList.add('on');
    host.innerHTML = `
      <div class="story" onclick="Story.next()">
        <div class="story-bars">${STORY_SLIDES.map((_,k)=>`<i class="${k<Story.i?'done':k===Story.i?'act':''}"></i>`).join('')}</div>
        <button class="story-x" onclick="event.stopPropagation();Story.close()">✕</button>
        <div class="glowblob" style="background:#D7F050;bottom:-90px;right:-90px;opacity:.18"></div>
        <div style="margin-top:40px">${STORY_SLIDES[this.i]()}</div>
        <div class="micro" style="margin-top:auto;text-align:center">tap to continue · ${this.i+1}/${STORY_SLIDES.length}</div>
      </div>`;
    if(this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(()=>this.next(), 3600);
  },
  next(){ if(++this.i>=STORY_SLIDES.length) return this.close(); this.render(); },
  close(){ if(this.timer) clearTimeout(this.timer); const h=document.getElementById('storyHost'); h.classList.remove('on'); h.innerHTML=''; },
};

/* ---------------- GOALS ---------------- */
SCREENS.goals = () => `
  <div class="scr" style="padding-bottom:170px">
    <div class="flex between"><div class="h1">Goals</div><button class="chip" onclick="A.go('goal-new')">${ic('plus',15)} New</button></div>
    <div class="card mt12 flex" style="gap:14px">
      ${donut([{v:57700,c:'#D7F050'},{v:138300,c:'rgba(255,255,255,.1)'}],86,10,`<div style="font:800 14px Inter,sans-serif">29%</div>`)}
      <div class="f1"><div class="h3">AED 57 700 saved</div><div class="micro mt4">across 4 goals · AED 3 184/mo on autopilot</div>
      <div class="micro mt4" style="color:var(--lime)">✦ Profit on goal balances: 3,1% p.a. (Mudarabah)</div></div>
    </div>
    <div class="grid2 mt16">
      ${GOALS.map(g=>`
        <div class="tile" onclick="A.go('goal/${g.id}')">
          <div class="flex between"><span style="font-size:30px">${g.em}</span><span class="tag gray tnum">${Math.round(g.cur/g.tgt*100)}%</span></div>
          <div class="t-t">${g.n}</div>
          <div class="t-d tnum">${fm(g.cur,0)} / ${fm(g.tgt,0)}</div>
          <div class="mt8">${meter(g.cur/g.tgt, g.c)}</div>
        </div>`).join('')}
    </div>
    <div class="card mt16 flex between tap" onclick="A.go('roundups')">
      <div class="flex" style="gap:12px"><span class="bigico" style="background:rgba(232,194,104,.16);color:var(--gold)">${ic('coins',22)}</span>
      <div><div class="row-t">Round-ups → Gold</div><div class="row-d">Every spend rounds to AED 5 · ×2 boost on</div></div></div>
      <button class="switch lime on" onclick="event.stopPropagation();this.classList.toggle('on')"></button>
    </div>
  </div>`;

SCREENS.goal = (id) => {
  const g = GOALS.find(x=>x.id===id)||GOALS[0];
  const pct = g.cur/g.tgt;
  return `
  <div class="scr">
    ${hdr(g.n)}
    <div class="card" style="text-align:center">
      <div style="font-size:52px">${g.em}</div>
      ${donut([{v:g.cur,c:g.c},{v:g.tgt-g.cur,c:'rgba(255,255,255,.1)'}],150,13,
        `<div style="font:800 24px Inter,sans-serif" class="tnum">${Math.round(pct*100)}%</div><div class="micro">funded</div>`)}
      <div class="h3 mt12 tnum">AED ${fm(g.cur,0)} <span style="color:var(--tx3)">of ${fm(g.tgt,0)}</span></div>
      <div class="micro mt4">Target: ${g.by} · on pace ${pct>0.4?'✓':'· tight'}</div>
    </div>
    <div class="listcard mt12">
      <div class="row static"><span class="bigico">${ic('zap',20)}</span><div class="row-main"><div class="row-t">Auto-save</div><div class="row-d">${g.auto}</div></div><button class="switch lime on" onclick="this.classList.toggle('on')"></button></div>
      <div class="row" onclick="A.toast('Boosted +AED 500 from FAB ··5689','check')"><span class="bigico">${ic('plus',20)}</span><div class="row-main"><div class="row-t">Boost now</div><div class="row-d">One-off top-up</div></div><span class="chev">${ic('chevR',16)}</span></div>
      <div class="row" onclick="A.toast('Goal balance earns 3,1% p.a. — Mudarabah pool','info')"><span class="bigico">${ic('moon',20)}</span><div class="row-main"><div class="row-t">Earning profit</div><div class="row-d">3,1% p.a. expected · Shariah-compliant</div></div></div>
    </div>
    ${id==='hajj'?`<div class="card soft mt12 flex" style="gap:10px">${ic('spark',18,'lime-t')}<div class="micro">At AED 1 000/salary you’ll reach AED 60 000 by <b>Sep 2027</b> — 3 months early. Nusuk package prices tracked weekly.</div></div>`:''}
  </div>`;
};

SCREENS['goal-new'] = () => `
  <div class="scr">
    ${hdr('New goal')}
    <div class="lbl mb8">Pick a template</div>
    <div class="grid2">
      ${[['🕋','Hajj & Umrah'],['🎓','School fees'],['✈️','Travel'],['🏠','Home deposit'],['💍','Wedding'],['🛟','Emergency']]
        .map(([em,t])=>`<div class="tile" onclick="A.tmp.goalT='${t}';A.refresh()" style="${A.tmp.goalT===t?'outline:2px solid var(--lime)':''}">
          <span style="font-size:26px">${em}</span><div class="t-t">${t}</div></div>`).join('')}
    </div>
    <div class="lbl mt16 mb8">Target</div>
    <div class="chips">${[5000,15000,30000,60000].map(v=>`<button class="chip ${v===15000?'on':''}">AED ${fm(v,0)}</button>`).join('')}</div>
    <div class="lbl mt16 mb8">Fund it with</div>
    <div class="chips">
      <button class="chip on">AED 500 / month</button><button class="chip">10% of salary</button><button class="chip">Round-ups ×2</button>
    </div>
    <button class="btn lime mt20" onclick="A.toast('Goal created — first AED 500 moves on the 25th','check');A.go('goals')">Create goal</button>
  </div>`;

SCREENS.roundups = () => `
  <div class="scr">
    ${hdr('Round-ups → Gold')}
    <div class="card" style="text-align:center">
      <div style="font-size:44px">🪙</div>
      <div class="h3 mt8">AED 184,20 saved in May</div>
      <div class="micro mt4">= 0,38 g of gold · without noticing</div>
    </div>
    <div class="listcard mt12">
      <div class="row static"><div class="row-main"><div class="row-t">Round every spend to</div></div>
        <div class="chips"><button class="chip">AED 1</button><button class="chip on">AED 5</button><button class="chip">AED 10</button></div></div>
      <div class="row static"><div class="row-main"><div class="row-t">Multiplier</div><div class="row-d">Doubles each round-up</div></div>
        <div class="chips"><button class="chip">×1</button><button class="chip on">×2</button><button class="chip">×10</button></div></div>
      <div class="row static"><div class="row-main"><div class="row-t">Destination</div></div><span class="tag gold">Noor Gold (vaulted, 999.9)</span></div>
    </div>
    <div class="micro mt12" style="text-align:center">Jar-style micro-saving — physical gold custody, Shariah-certified, sell anytime.</div>
  </div>`;

/* ---------------- RULES (Fi-style automations) ---------------- */
SCREENS.rules = () => `
  <div class="scr">
    ${hdr('Noor Rules',{right:`<button class="chip" onclick="A.go('rule-new')">${ic('plus',14)} New</button>`})}
    <div class="sub">If-this-then-that for your money — runs across all linked banks.</div>
    <div class="listcard mt12">
      ${RULES.map(r=>`
        <div class="row static">
          <span class="bigico">${ic(r.ic,20)}</span>
          <div class="row-main"><div class="row-t" style="white-space:normal">WHEN ${r.when}</div>
            <div class="row-d" style="white-space:normal">THEN ${r.then}</div>
            <div class="row-sub mt4">${r.ran}</div></div>
          <button class="switch lime ${r.on?'on':''}" onclick="this.classList.toggle('on');A.toast('Rule ${r.on?'paused':'activated'}','check')"></button>
        </div>`).join('')}
    </div>
    <div class="micro mt12" style="text-align:center">Inspired by Fi’s FIT rules — extended to multi-bank, gold and sadaqah.</div>
  </div>`;
SCREENS['rule-new'] = () => `
  <div class="scr">
    ${hdr('New rule')}
    <div class="lbl mb8">WHEN…</div>
    <div class="chips">
      ${['Salary arrives','Dining > AED 1 500/mo','Any card spend','Balance < AED 2 000','Every Friday','AECB score changes']
        .map((w,i)=>`<button class="chip ${i===1?'on':''}">${w}</button>`).join('')}
    </div>
    <div class="lbl mt16 mb8">THEN…</div>
    <div class="chips">
      ${['Alert me','Move money to a goal','Round up to Gold','Freeze a category','Give Sadaqah','Top up from another bank']
        .map((w,i)=>`<button class="chip ${i===0?'on':''}">${w}</button>`).join('')}
    </div>
    <div class="card soft mt16">
      <div class="row-t" style="font-size:13.5px">Preview</div>
      <div class="sub mt4">WHEN dining passes AED 1 500 in a month → THEN alert me and pause food-delivery cards for 48 h (you can override).</div>
    </div>
    <button class="btn lime mt16" onclick="A.toast('Rule active — watching dining in real time','check');A.go('rules')">Activate rule</button>
  </div>`;
window.Rules = { fromChat(){ A.go('rule-new'); } };
window.Insights = {
  budgetSheet(id){
    A.sheet(`<div class="h2">Budget for ${CATS[id].n}</div>
      <div class="chips" style="margin-top:14px">
        ${[800,1000,1400,2000,3000].map(v=>`<button class="chip" onclick="A.closeSheet();A.toast('Budget set: AED ${fm(v,0)} for ${CATS[id].n}','check')">AED ${fm(v,0)}</button>`).join('')}
      </div>
      <div class="micro mt12">Noor warns you at 80% and can auto-freeze the category at 100%.</div>`);
  }
};
})();
