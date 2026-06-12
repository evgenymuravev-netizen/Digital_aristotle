/* ============ cards · products · wealth · islamic · score · rewards · settings ============ */
(function(){

/* ---------------- cards wallet ---------------- */
const cardVisual = (a, mini=false) => `
  <div class="ccvisual ${A.S.frozen?'frozen':''}" style="background:${a.art};${mini?'height:150px':''}" onclick="A.go('card/${a.id}')">
    <div class="flex between"><span style="font:800 15px Inter,sans-serif">${BANKS[a.bank].name}</span><span class="cc-small">${a.name}</span></div>
    <div class="cc-chip"></div>
    <div>
      <div class="cc-num">•••• •••• •••• ${a.mask}</div>
      <div class="flex between mt8"><span class="cc-small">${USER.first} ${USER.last}</span><span style="font:800 14px Inter,sans-serif;font-style:italic">VISA</span></div>
    </div>
  </div>`;
SCREENS.cards = () => {
  const cards = ACCOUNTS.filter(a=>a.kind==='card');
  return `
  <div class="scr">
    ${hdr('Cards',{right:`<button class="chip" onclick="A.go('vcard')">${ic('plus',14)} Virtual</button>`})}
    <div style="display:flex;flex-direction:column;gap:14px">${cards.map(a=>cardVisual(a)).join('')}</div>
    <div class="card lime mt16 tap" onclick="A.go('chat-card')">
      <div class="flex between"><b style="font-size:14px">⚡ 3 pre-approved offers waiting</b>${ic('chevR',18)}</div>
      <div class="micro mt4">Up to AED 25 000 limit · activated in 1 click</div>
    </div>
    <div class="listcard mt12">
      <div class="row" onclick="A.S.frozen=!A.S.frozen;A.persist();A.refresh();A.toast(A.S.frozen?'All cards frozen':'Cards unfrozen','shield')">
        <span class="bigico" style="color:var(--blu)">${ic('shield',20)}</span>
        <div class="row-main"><div class="row-t">Freeze all cards</div><div class="row-d">Instant, reversible — across banks</div></div>
        <button class="switch ${A.S.frozen?'on':''}"></button>
      </div>
    </div>
  </div>`;
};
SCREENS.card = (id) => {
  const a = ACCOUNTS.find(x=>x.id===id)||ACCOUNTS[5];
  return `
  <div class="scr">
    ${hdr(BANKS[a.bank].name+' card')}
    ${cardVisual(a)}
    <div class="grid4 mt16">
      ${[['lock','Freeze'],['eye','Show PIN'],['gear','Limits'],['doc','Statement']]
        .map(([i,t])=>`<button class="qa" onclick="${t==='Statement'?`A.go('statement')`:t==='Limits'?`A.sheet(Cards.limits())`:t==='Show PIN'?`A.toast('PIN: •••• — visible after Face ID','lock')`:`A.S.frozen=!A.S.frozen;A.persist();A.refresh()`}"><span class="qa-ic" style="width:48px;height:48px">${ic(i,20)}</span><span>${t}</span></button>`).join('')}
    </div>
    <div class="card mt16">
      <div class="kv"><span class="k">Statement balance</span><span class="v tnum red-t">${aed(a.bal)}</span></div>
      <div class="kv"><span class="k">Due date</span><span class="v">${a.due} · min AED ${fm(a.min)}</span></div>
      <div class="kv"><span class="k">Available credit</span><span class="v tnum">AED ${fm(a.limit-Math.abs(a.bal))}</span></div>
      <button class="btn lime mt8" onclick="A.go('paybill/${a.id}')">Pay card bill</button>
    </div>
    <div class="listcard mt12">
      ${[['globe','Online & international','on'],['qr','Contactless','on'],['bag','ATM withdrawals','off']]
        .map(([i,t,s])=>`<div class="row static"><span class="bigico">${ic(i,20)}</span><div class="row-main"><div class="row-t">${t}</div></div><button class="switch lime ${s==='on'?'on':''}" onclick="this.classList.toggle('on')"></button></div>`).join('')}
    </div>
  </div>`;
};
window.Cards = { limits(){ return `
  <div class="h2">Spending limits</div>
  <div class="kv mt12"><span class="k">Online · per day</span><span class="v tnum">AED 5 000</span></div>${meter(0.42)}
  <div class="kv mt12"><span class="k">In-store · per day</span><span class="v tnum">AED 10 000</span></div>${meter(0.2)}
  <div class="kv mt12"><span class="k">ATM · per day</span><span class="v tnum">AED 3 000</span></div>${meter(0.1)}
  <button class="btn pri mt16" onclick="A.closeSheet();A.toast('Limits updated','check')">Save</button>`; } };

SCREENS.vcard = () => `
  <div class="scr">
    ${hdr('Virtual card')}
    <div class="ccvisual" style="background:linear-gradient(130deg,#3A4D0E,#141D03 70%)">
      <div class="flex between"><span style="font:800 17px Inter,sans-serif;color:var(--lime)">noor</span><span class="cc-small">Virtual · disposable</span></div>
      <div class="cc-chip"></div>
      <div><div class="cc-num">5311 88•• •••• 4092</div>
      <div class="flex between mt8"><span class="cc-small">Exp 06/29 · CVV •••</span><span style="font:800 14px Inter,sans-serif">VISA</span></div></div>
    </div>
    <div class="listcard mt16">
      <div class="row static"><div class="row-main"><div class="row-t">Single-use mode</div><div class="row-d">Number burns after one payment</div></div><button class="switch lime on" onclick="this.classList.toggle('on')"></button></div>
      <div class="row static"><div class="row-main"><div class="row-t">Monthly cap</div><div class="row-d">AED 1 000 for subscriptions</div></div><span class="chev">${ic('chevR',16)}</span></div>
    </div>
    <button class="btn lime mt16" onclick="A.toast('Added to Apple Pay','check')"> Add to Apple Pay</button>
  </div>`;

/* ---------------- pay card bill (CRED-style) ---------------- */
SCREENS.paybill = (id) => {
  const a = ACCOUNTS.find(x=>x.id===id)||ACCOUNTS[5];
  const amt = Math.abs(a.bal);
  const mode = A.tmp.payMode||'full';
  return `
  <div class="scr">
    ${hdr('Pay card bill')}
    <div class="card flex" style="gap:13px">${blg(a.bank)}<div class="f1"><div class="row-t">${a.name} ··${a.mask}</div><div class="row-d">Due ${a.due} — in 9 days</div></div>
      <div class="row-amt tnum red-t">${fm(amt)}</div></div>
    <div class="card mt12" style="border-color:rgba(215,240,80,.4)">
      <div class="flex between"><b style="font-size:13.5px">🔍 Fee watchdog found AED 36,00</b><span class="tag lime">✦</span></div>
      <div class="micro mt4">Late-payment fee (28 Feb) AED 25 + FX markup AED 11 look disputable.</div>
      <button class="chip mt8" onclick="A.go('dispute')">Dispute both</button>
    </div>
    <div class="lbl mt16 mb8">Amount</div>
    <div class="seg">
      <button class="${mode==='full'?'on':''}" onclick="A.tmp.payMode='full';A.refresh()">Full — ${fm(amt,0)}</button>
      <button class="${mode==='min'?'on':''}" onclick="A.tmp.payMode='min';A.refresh()">Min — ${fm(a.min,0)}</button>
      <button class="${mode==='c'?'on':''}" onclick="A.tmp.payMode='c';A.refresh()">Custom</button>
    </div>
    ${mode==='min'?'<div class="micro mt8" style="color:var(--gold)">⚠️ Minimum keeps you revolving at ~42% APR-equivalent. Full saves AED 287 next month.</div>':''}
    <div class="lbl mt16 mb8">Pay from any bank</div>
    <div class="listcard">
      ${[['fab-sal','FAB Salary ··5689',78865.05],['wio-cur','Wio Current ··2204',17865.90],['ei-sav','EI e-Saver ··8841',37629.69]]
        .map(([aid,n,b],i)=>`<div class="row" onclick="A.tmp.payFrom=${i};A.refresh()">
          ${blg(aid.split('-')[0])}
          <div class="row-main"><div class="row-t">${n}</div><div class="row-d tnum">AED ${fm(b)}</div></div>
          <span class="bigico" style="width:26px;height:26px;min-width:26px;border-radius:50%;background:${(A.tmp.payFrom||0)===i?'var(--lime)':'var(--glass2)'}"></span></div>`).join('')}
    </div>
    <button class="btn lime mt16" onclick="confetti(document.getElementById('screen'));A.toast('Paid — +120 Noor pts earned 🎉','gift');setTimeout(()=>A.go('rewards'),900)">
      Pay ${mode==='min'?'AED '+fm(a.min):mode==='full'?'AED '+fm(amt):'custom amount'} & earn 120 pts</button>
  </div>`;
};
SCREENS.dispute = () => `
  <div class="scr">
    ${hdr('Raise a dispute')}
    <div class="listcard">
      ${[['Late-payment fee · 28 Feb','AED 25,00 — first offence, banks usually waive'],['FX markup · Amazon US','AED 11,00 — charged despite AED billing']]
        .map(([t,d])=>`<div class="row static"><span class="bigico" style="color:var(--gold)">${ic('alert',20)}</span>
        <div class="row-main"><div class="row-t" style="white-space:normal">${t}</div><div class="row-d" style="white-space:normal">${d}</div></div>
        <span class="bigico" style="width:26px;height:26px;min-width:26px;border-radius:9px;background:var(--lime);color:var(--ink)">${ic('check',14)}</span></div>`).join('')}
    </div>
    <div class="card soft mt12"><div class="micro">Noor files the dispute with FAB on your behalf and tracks it. Typical waiver rate for first-time fees: 84%.</div></div>
    <button class="btn lime mt16" onclick="A.toast('Disputes filed — tracking in your briefing','check');A.back()">File 2 disputes</button>
  </div>`;
SCREENS.statement = () => `
  <div class="scr">
    ${hdr('Statements & documents')}
    <div class="listcard">
      ${[['May 2026 statement','PDF · all accounts combined'],['April 2026 statement','PDF'],['Consent receipts (4)','Noor Connect artefacts'],['Zakat certificate 1447H','For your records'],['Salary certificates','Auto-generated from verified income']]
        .map(([t,d])=>`<div class="row" onclick="A.toast('Downloading ${esc(t)}…','doc')"><span class="bigico">${ic('doc',20)}</span>
        <div class="row-main"><div class="row-t">${t}</div><div class="row-d">${d}</div></div><span class="chev">${ic('chevR',16)}</span></div>`).join('')}
    </div>
  </div>`;

/* ---------------- 1-click card application ---------------- */
SCREENS.apply = (id) => {
  const o = CARD_OFFERS.find(x=>x.id===id)||CARD_OFFERS[0];
  return `
  <div class="scr">
    ${hdr('1-click application')}
    <div class="card flex" style="gap:13px">${blg(o.bank)}
      <div class="f1"><div class="row-t">${BANKS[o.bank].name} credit card</div><div class="row-d tnum">AED ${fm(o.limit,0)} pre-approved · ${o.rate}% · ${o.grace} days</div></div>
      ${o.rec?'<span class="tag solid">⚡</span>':''}</div>
    <div class="lbl mt16 mb8">Why it’s instant</div>
    <div class="psteps mt8" id="apSteps">
      ${['Income verified via Noor Connect','AECB soft-check — no score impact','KYC reused from your Noor profile',(o.shariah?'Shariah contract (Tawarruq) prepared':'Card agreement prepared')]
        .map((s,i)=>`<div class="pstep dark" id="ap${i}"><div class="pdot">${i+1}</div><div><div class="ps-t">${s}</div></div></div>`).join('')}
    </div>
    <div class="card soft mt8"><div class="micro">Perks: ${o.perks.join(' · ')}</div></div>
    <button class="btn lime mt16" id="apBtn" disabled onclick="A.go('apply-done/${o.id}')">${ic('faceid',20)} Sign with Face ID</button>
    <div class="micro mt8" style="text-align:center">No documents. No branch. Cancel free within 14 days.</div>
  </div>`;
};
AFTER.apply = () => { let i=0; const step=()=>{ const el=document.getElementById('ap'+i); if(!el) return;
  el.classList.add('act'); setTimeout(()=>{ el.classList.remove('act'); el.classList.add('done'); el.querySelector('.pdot').innerHTML=ic('check',15);
    if(++i<4) step(); else { const b=document.getElementById('apBtn'); if(b) b.disabled=false; } },520); }; step(); };
SCREENS['apply-done'] = (id) => {
  const o = CARD_OFFERS.find(x=>x.id===id)||CARD_OFFERS[0];
  return `
  <div class="scr center">
    <div class="checkpop">${ic('check',46,'',2.4)}</div>
    <div class="h1 mt20">Card approved</div>
    <div class="sub mt8">AED ${fm(o.limit,0)} limit · virtual card is live now,<br>plastic arrives in 2 days.</div>
    <div class="mt16" style="width:100%">${`
      <div class="ccvisual" style="background:linear-gradient(130deg,#0A2E5C,#06182F 70%)">
        <div class="flex between"><span style="font:800 15px Inter,sans-serif">${BANKS[o.bank].name}</span><span class="cc-small">just issued</span></div>
        <div class="cc-chip"></div>
        <div><div class="cc-num">5402 33•• •••• 9018</div>
        <div class="flex between mt8"><span class="cc-small">${USER.first} ${USER.last}</span><span style="font:800 14px Inter,sans-serif;font-style:italic">VISA</span></div></div>
      </div>`}</div>
    <div class="btnrow mt16" style="width:100%">
      <button class="btn ghost" onclick="A.toast('Added to Apple Pay','check')"> Apple Pay</button>
      <button class="btn pri" onclick="A.go('cards')">Done</button>
    </div>
  </div>`;
};
AFTER['apply-done'] = () => confetti(document.getElementById('screen'));

/* ---------------- 1-click financing activation ---------------- */
SCREENS['loan-activate'] = () => `
  <div class="scr">
    ${hdr('Activate financing')}
    <div class="card flex" style="gap:13px">${blg('ei')}
      <div class="f1"><div class="row-t">Murabaha personal finance</div><div class="row-d tnum">AED 120 000 · 5,49% p.a. · 48 months</div></div>
      <span class="tag gold">☪</span></div>
    <div class="chips mt12">${[60,90,120].map(v=>`<button class="chip ${v===120?'on':''}">AED ${v} 000</button>`).join('')}</div>
    <div class="psteps mt16" id="lnSteps">
      ${['Debt-burden ratio check — 19%, healthy','Shariah board contract (commodity Murabaha)','Funds routing to FAB ··5689']
        .map((s,i)=>`<div class="pstep dark" id="ln${i}"><div class="pdot">${i+1}</div><div><div class="ps-t">${s}</div></div></div>`).join('')}
    </div>
    <div class="card soft mt8">
      <div class="kv"><span class="k">Monthly instalment</span><span class="v tnum">AED 2 641 × 48</span></div>
      <div class="kv"><span class="k">Total profit (disclosed)</span><span class="v tnum">AED 6 768</span></div>
      <div class="kv"><span class="k">Early settlement</span><span class="v grn-t">Free, anytime</span></div>
    </div>
    <button class="btn lime mt16" id="lnBtn" disabled onclick="A.go('loan-done')">${ic('faceid',20)} Activate — funds in ~2 min</button>
  </div>`;
AFTER['loan-activate'] = () => { let i=0; const step=()=>{ const el=document.getElementById('ln'+i); if(!el) return;
  el.classList.add('act'); setTimeout(()=>{ el.classList.remove('act'); el.classList.add('done'); el.querySelector('.pdot').innerHTML=ic('check',15);
    if(++i<3) step(); else { const b=document.getElementById('lnBtn'); if(b) b.disabled=false; } },600); }; step(); };
SCREENS['loan-done'] = () => `
  <div class="scr center">
    <div class="checkpop">${ic('check',46,'',2.4)}</div>
    <div class="h1 mt20">AED 120 000<br>on its way</div>
    <div class="sub mt8">Disbursing to FAB Salary ··5689 — arrives in about 2 minutes. Contract saved to Documents.</div>
    <div class="card mt16" style="width:100%">
      <div class="kv"><span class="k">First instalment</span><span class="v">25 July · AED 2 641</span></div>
      <div class="kv"><span class="k">Auto-pay</span><span class="v grn-t">On · from salary account</span></div>
    </div>
    <button class="btn pri mt16" style="width:100%" onclick="A.go('home')">Done</button>
  </div>`;
AFTER['loan-done'] = () => confetti(document.getElementById('screen'));

/* ---------------- invest upsell (post-onboarding, not in the first run) ---------------- */
SCREENS['invest-upsell'] = () => `
  <div class="scr">
    ${hdr('',{right:`<button class="chip" onclick="A.go('home')">Later</button>`})}
    <span class="tag lime">✦ Suggested after onboarding — never in your first run</span>
    <div class="h1 mt12">Your banking is in.<br>Now the <span class="lime-t">whole picture.</span></div>
    <div class="sub mt8">Plug in brokers and pensions — read-only. Net worth, financial health and zakat instantly get smarter.</div>
    <div class="listcard mt16">
      ${[['ibkr','AED portfolio + US stocks'],['sarwa','Robo & trade accounts'],['etoro','Stocks & copy-portfolios']]
        .map(([b,d])=>`
        <div class="row" onclick="A.go('connect-login/${b}')">
          ${blg(b)}
          <div class="row-main"><div class="row-t">${BANKS[b].name}</div><div class="row-d">${d}</div></div>
          <span class="chev">${ic('chevR',18)}</span>
        </div>`).join('')}
      <div class="row" onclick="A.tmp.cnCat='invest';A.go('connect-banks')">
        <span class="bigico">${ic('plus',20)}</span>
        <div class="row-main"><div class="row-t">More providers</div><div class="row-d">Pensions, NPS-style schemes, other brokers</div></div>
        <span class="chev">${ic('chevR',18)}</span>
      </div>
    </div>
    <div class="card soft mt12 flex" style="gap:10px">${ic('moon',18,'gold-t')}<div class="micro">Linked investments are screened for Shariah compliance automatically — purification amounts calculated for you.</div></div>
  </div>`;

/* ---------------- marketplace ---------------- */
SCREENS.market = () => `
  <div class="scr">
    ${hdr('Products',{big:true})}
    <div class="card lime tap" onclick="A.go('chat-card')">
      <b style="font-size:14px">⚡ Pre-approved for you</b>
      <div class="micro mt4">3 cards · AED 120 000 financing · all 1-click</div>
    </div>
    <div class="grid2 mt12">
      ${MARKET.map(m=>`
        <div class="tile" onclick="${m.id==='cards'?`A.go('chat-card')`:m.id==='loan'?`A.go('loan-activate')`:m.id==='invest'?`A.go('invest')`:m.id==='dsf'?`A.go('dsf')`:m.id==='refi'?`A.go('refi')`:`A.toast('${esc(m.t)} — flow mocked in this build','info')`}">
          <span class="bigico" style="background:${m.c}1f;color:${m.c}">${ic(m.ic,22)}</span>
          <div class="t-t">${m.t}</div><div class="t-d">${m.d}</div>
        </div>`).join('')}
    </div>
    <div class="micro mt16" style="text-align:center">Every offer is ranked by true cost for <i>your</i> data — not by commission.</div>
  </div>`;

/* ---------------- invest & gold ---------------- */
SCREENS.invest = () => `
  <div class="scr">
    ${hdr('Invest')}
    <div class="card">
      <span class="lbl">Portfolio</span>
      <div class="flex between mt8"><span style="font:800 30px Inter,sans-serif" class="tnum">AED ${fm(INVEST.total,0)}</span><span class="tag grn">▲ ${INVEST.day}% today</span></div>
      <div class="mt12">${spark([31,32.4,31.8,33.5,34.1,35.2,36.4,37.1,38.5],330,70,'#53DE8E')}</div>
    </div>
    <div class="listcard mt12">
      ${INVEST.positions.map(p=>`
        <div class="row" onclick="A.toast('${esc(p.n)} — detail mocked','trendUp')">
          <span class="avx" style="background:${p.c}22;color:${p.c};font-size:20px">${p.em}</span>
          <div class="row-main"><div class="row-t">${p.n}</div><div class="row-d">${p.d}</div></div>
          <div class="row-r"><div class="row-amt tnum">${fm(p.amt,0)}</div><div class="row-sub" style="color:${p.chg>0?'var(--grn)':'var(--red)'}">${p.chg>0?'▲':'▼'} ${Math.abs(p.chg)}%</div></div>
        </div>`).join('')}
    </div>
    <div class="card mt12 tap" onclick="A.go('gold')">
      <div class="flex between"><div class="flex" style="gap:12px"><span class="bigico" style="background:rgba(232,194,104,.18);color:var(--gold)">${ic('coins',22)}</span>
        <div><div class="row-t">Noor Gold</div><div class="row-d">${INVEST.gold.grams} g vaulted · ▲${INVEST.gold.mo}% this month</div></div></div>
        <div class="row-amt tnum">${fm(INVEST.gold.val,0)}</div></div>
    </div>
    ${(()=>{ const strict=(A.tmp.invMode||'strict')==='strict'; return `
    <div class="lbl mt16 mb8">Compliance — your dial</div>
    <div class="seg">
      <button class="${strict?'on':''}" onclick="A.tmp.invMode='strict';A.refresh()">Strict halal</button>
      <button class="${!strict?'on':''}" onclick="A.tmp.invMode='balanced';A.refresh()">Balanced + local</button>
    </div>
    <div class="micro mt8">${strict
      ?'100% AAOIFI-strict — only fully compliant businesses. Grey-area names are hidden.'
      :'Adds local KSA/UAE champions in the grey area — not fully compliant, flagged honestly, with purification auto-calculated and donated. Your financial health, your call.'}</div>
    <div class="lbl mt16 mb8">Local champions 🇦🇪 🇸🇦 — support local business</div>
    <div class="listcard">
      ${INVEST.locals.filter(l=>!strict||l.s==='halal').map(l=>`
        <div class="row" onclick="A.toast('${esc(l.n)} ${l.s==='grey'?'added — purification '+String(l.purif).replace('.',',')+'% auto-donated':'added to your halal portfolio'}','check')">
          <span class="avx" style="background:${l.s==='halal'?'rgba(83,222,142,.18)':'rgba(232,194,104,.18)'};color:${l.s==='halal'?'var(--grn)':'var(--gold)'};font-size:11px;font-weight:800">${l.mkt}</span>
          <div class="row-main"><div class="row-t">${l.n}</div><div class="row-d" style="white-space:normal">${l.note}</div></div>
          <span class="tag ${l.s==='halal'?'grn':'gold'}">${l.s==='halal'?'✓ Halal':'Grey · purify '+String(l.purif).replace('.',',')+'%'}</span>
        </div>`).join('')}
      ${strict?`<div class="row static"><div class="row-d" style="white-space:normal">3 grey-area locals hidden by Strict mode — switch to Balanced to see them.</div></div>`:''}
    </div>
    <div class="card soft mt12 flex" style="gap:10px">${ic('heart',18,'lime-t')}
      <div class="micro">${strict?'Local impact: 24% of your portfolio backs GCC businesses — all fully compliant.':'Local impact: 38% of your portfolio backs GCC businesses. Purification this year: AED 86, donated to Dubai Cares.'}</div></div>`;})()}
    <div class="listcard mt12">
      <div class="row static"><span class="bigico">${ic('refresh',20)}</span><div class="row-main"><div class="row-t">Auto-invest</div><div class="row-d">AED 1 000/mo into Sukuk fund · on the 26th</div></div><button class="switch lime on" onclick="this.classList.toggle('on')"></button></div>
      <div class="row" onclick="A.sheet(Halal.sheet())"><span class="bigico" style="color:var(--gold)">${ic('moon',20)}</span><div class="row-main"><div class="row-t">Halal screener</div><div class="row-d">Check any stock in a second</div></div><span class="chev">${ic('chevR',16)}</span></div>
    </div>
    <div class="micro mt12" style="text-align:center">Strict mode: everything passes AAOIFI screening. Balanced mode: grey names disclosed + purified — never hidden riba.</div>
  </div>`;
window.Halal = { sheet(){ return `
  <div class="h2">Halal screener</div>
  <div class="input mt12 flex">${ic('search',18)} <span style="color:var(--tx3)">Ticker — try AAPL, TSLA, BUD…</span></div>
  <div class="listcard mt12">
    ${[['AAPL · Apple','Pass — debt 18%, no haram revenue','grn','✓ Halal'],['TSLA · Tesla','Pass — watch interest income 3,2%','grn','✓ Halal'],['BUD · AB InBev','Fail — alcohol is core business','red','✗ Not compliant']]
      .map(([t,d,c,v])=>`<div class="row static"><div class="row-main"><div class="row-t">${t}</div><div class="row-d" style="white-space:normal">${d}</div></div><span class="tag ${c}">${v}</span></div>`).join('')}
  </div>`; } };
SCREENS.gold = () => `
  <div class="scr">
    ${hdr('Noor Gold')}
    <div class="card" style="text-align:center;background:linear-gradient(150deg,rgba(232,194,104,.16),var(--glass))">
      <div style="font-size:44px">🪙</div>
      <div style="font:800 32px Inter,sans-serif" class="tnum mt8">${INVEST.gold.grams} g</div>
      <div class="micro mt4">≈ AED ${fm(INVEST.gold.val)} · 999.9 vaulted in DMCC · Shariah-certified</div>
      <div class="mt12">${spark([440,452,448,461,458,470,479,486],300,60,'#E8C268')}</div>
      <div class="micro">AED ${fm(INVEST.gold.perGram)} / g · ▲${INVEST.gold.mo}% this month</div>
    </div>
    <div class="btnrow mt12">
      <button class="btn pri" onclick="A.toast('Bought 1 g — AED 486,32','check')">Buy</button>
      <button class="btn ghost" onclick="A.toast('Sold instantly at spot — no spread games','check')">Sell</button>
    </div>
    <div class="listcard mt12">
      <div class="row static"><span class="bigico">${ic('coins',20)}</span><div class="row-main"><div class="row-t">Round-ups feed gold</div><div class="row-d">AED 184,20 added in May</div></div><button class="switch lime on" onclick="this.classList.toggle('on')"></button></div>
      <div class="row" onclick="A.toast('Physical delivery from 10 g — DMCC vault','info')"><span class="bigico">${ic('bag',20)}</span><div class="row-main"><div class="row-t">Physical delivery</div><div class="row-d">From 10 g, anywhere in UAE</div></div><span class="chev">${ic('chevR',16)}</span></div>
    </div>
  </div>`;

/* ---------------- AECB score ---------------- */
SCREENS.score = () => `
  <div class="scr">
    ${hdr('AECB score')}
    <div class="card" style="display:flex;flex-direction:column;align-items:center">
      ${gaugeSemi(SCORE.v/SCORE.max, 230, '#53DE8E', `<div style="font:800 44px Inter,sans-serif" class="tnum">${SCORE.v}</div><div class="micro">${SCORE.band} · ▲${SCORE.delta} this month</div>`)}
      <div class="mt12" style="width:100%">${spark(SCORE.hist,330,54,'#53DE8E')}</div>
      <div class="micro mt4">Free forever · soft-pull · refreshed monthly</div>
    </div>
    <div class="lbl mt16 mb8">What’s driving it</div>
    <div class="listcard">
      ${SCORE.factors.map(f=>`
        <div class="row static"><span class="bigico" style="color:${f.good?'var(--grn)':'var(--gold)'}">${ic(f.good?'check':'alert',20)}</span>
        <div class="row-main"><div class="row-t">${f.t} — ${f.s}</div><div class="row-d" style="white-space:normal">${f.d}</div></div></div>`).join('')}
    </div>
    ${(()=>{ const k=A.tmp.scProj||'plan', P=SCORE_PROJ[k]; return `
    <div class="card mt12">
      <div class="flex between"><b style="font-size:13.5px">Projection — next 6 months</b>
        <span class="tag ${P.end>=SCORE.v?'grn':'red'}">Dec 2026: ${P.end} (${P.end>=SCORE.v?'+':''}${P.end-SCORE.v})</span></div>
      <div class="chips mt8">
        ${Object.entries(SCORE_PROJ).map(([id,p])=>`<button class="chip ${k===id?'on':''}" onclick="A.tmp.scProj='${id}';A.refresh()">${p.t}</button>`).join('')}
      </div>
      <div class="mt12">${spark(P.arr,330,64, P.end>=SCORE.v?'#53DE8E':'#FF7A6B')}</div>
      <div class="flex between"><span class="micro">Jun</span><span class="micro">Aug</span><span class="micro">Oct</span><span class="micro">Dec</span></div>
      <div class="micro mt8">${P.note}.</div>
      ${k==='plan'?`<button class="chip mt8" onclick="A.go('refi')">⚡ Open the refi plan</button>`:''}
    </div>`;})()}
    <div class="card soft mt12">
      <b style="font-size:13.5px">Quick what-ifs</b>
      <div class="chips mt8">
        <button class="chip" onclick="A.toast('Projected: 751 (+6) next cycle','trendUp')">Pay card in full</button>
        <button class="chip" onclick="A.toast('Projected: 741 (−4) — new enquiry','alert')">Apply for auto finance</button>
        <button class="chip" onclick="A.toast('Projected: 757 (+12) in 3 months','trendUp')">Lower utilisation to 15%</button>
      </div>
    </div>
  </div>`;

/* ---------------- rewards & scratch ---------------- */
SCREENS.rewards = () => `
  <div class="scr">
    ${hdr('Rewards')}
    <div class="card lime">
      <div class="flex between"><span class="lbl" style="color:rgba(11,20,16,.55)">Noor points</span><span class="tag" style="background:rgba(11,20,16,.14);color:#0B1410">${REWARDS.tier} tier</span></div>
      <div style="font:800 36px Inter,sans-serif" class="tnum mt8">${fm(REWARDS.pts,0)}</div>
      <div class="micro mt4">≈ AED ${fm(REWARDS.pts/20,0)} · redeem on fees, gold or charity</div>
    </div>
    <div class="card mt12">
      <div class="flex between"><b style="font-size:14px">🔥 ${REWARDS.streak}-day money streak</b><span class="micro">opened the app & stayed on budget</span></div>
      <div class="flex mt12" style="gap:7px">
        ${['M','T','W','T','F','S','S'].map((d,i)=>`<div style="flex:1;text-align:center"><div class="bigico" style="width:100%;height:40px;border-radius:12px;background:${i<5?'rgba(215,240,80,.2)':'var(--glass)'};color:${i<5?'var(--lime)':'var(--tx3)'}">${i<5?ic('check',16):d}</div></div>`).join('')}
      </div>
    </div>
    <div class="lbl mt16 mb8">Scratch cards · ${REWARDS.scratch} waiting</div>
    <div class="grid2">
      <div class="tile" style="background:linear-gradient(135deg,#2A3F12,#15240A);text-align:center" onclick="A.go('scratch')">
        <div style="font-size:34px">🎁</div><div class="t-t">Scratch me</div><div class="t-d">From the 5-day streak</div></div>
      <div class="tile" style="background:linear-gradient(135deg,#3A2F12,#241D0A);text-align:center" onclick="A.go('scratch')">
        <div style="font-size:34px">🎁</div><div class="t-t">Scratch me</div><div class="t-d">Card bill paid on time</div></div>
    </div>
    <div class="card mt16 flex between tap" onclick="A.toast('Invite link copied — you both get 500 pts','gift')">
      <div><div class="row-t">Refer a friend</div><div class="row-d">500 pts each when they link a bank</div></div>${ic('share',20)}
    </div>
  </div>`;
SCREENS.scratch = () => `
  <div class="scr center">
    ${hdr('Scratch card')}
    <div class="sub">Scratch with your finger ✨</div>
    <div class="scratch-wrap mt16" style="width:100%">
      <div class="scratch-under">
        <div style="font-size:40px">🎉</div>
        <div class="h2">+250 points</div>
        <div class="micro">added to your balance</div>
      </div>
      <canvas id="scCv"></canvas>
    </div>
    <button class="btn ghost mt20" style="max-width:240px" onclick="A.go('rewards')">Back to rewards</button>
  </div>`;
AFTER.scratch = () => {
  const cv=document.getElementById('scCv'); if(!cv) return;
  const wrap=cv.parentElement, r=wrap.getBoundingClientRect();
  cv.width=r.width; cv.height=r.height;
  const x=cv.getContext('2d');
  const grd=x.createLinearGradient(0,0,r.width,r.height); grd.addColorStop(0,'#3C4C18'); grd.addColorStop(1,'#202B0B');
  x.fillStyle=grd; x.fillRect(0,0,r.width,r.height);
  x.fillStyle='rgba(215,240,80,.8)'; x.font='700 15px Inter,sans-serif'; x.textAlign='center';
  x.fillText('scratch here', r.width/2, r.height/2+5);
  let scratched=0, done=false;
  const rub=(e)=>{ const p=e.touches?e.touches[0]:e; const b=cv.getBoundingClientRect();
    x.globalCompositeOperation='destination-out'; x.beginPath();
    x.arc((p.clientX-b.left)*(cv.width/b.width),(p.clientY-b.top)*(cv.height/b.height),26,0,7); x.fill();
    if(++scratched>26 && !done){ done=true; cv.style.transition='opacity .5s'; cv.style.opacity=0;
      confetti(document.getElementById('screen')); A.toast('+250 points 🎉','gift'); setTimeout(()=>cv.remove(),600);} };
  let downFlag=false;
  cv.addEventListener('mousedown',()=>downFlag=true); window.addEventListener('mouseup',()=>downFlag=false);
  cv.addEventListener('mousemove',e=>downFlag&&rub(e));
  cv.addEventListener('touchmove',e=>{e.preventDefault();rub(e);},{passive:false});
};

/* ---------------- zakat — full module (1447H) ---------------- */
window.ZK = {
  st(){ if(!A.tmp.zk) A.tmp.zk = { method:'majority', scope:'both', pay:'once',
    rel:Object.fromEntries(ZAKAT.family.map(f=>[f.id,false])), wak:Object.fromEntries(ZAKAT.family.map(f=>[f.id,false])),
    debts:Object.fromEntries(ZK_DEDUCT_ALL().map(d=>[d.id,true])),
    biz:Object.fromEntries(ZAKAT.bizAssets.map(b=>[b.id,b.on])),
    manual:Object.fromEntries(ZAKAT.manual.map(m=>[m.id,{on:m.on,v:m.v}])) };
    return A.tmp.zk; },
  meth(){ return ZK_METHODS[this.st().method]; },
  nisab(){ const m=this.meth(); return m.nisab==='silver' ? ZAKAT.nisabSilverG*ZAKAT.silverPerG : ZAKAT.nisabGoldG*ZAKAT.goldPerG; },
  debtTotal(){ const s=this.st();
    const grp = s.scope==='personal' ? ZAKAT.deduct.personal : s.scope==='business' ? ZAKAT.deduct.business : ZK_DEDUCT_ALL();
    return grp.reduce((x,d)=> x + (s.debts[d.id]?d.v:0), 0); },
  baseUnder(mid){ const s=this.st(), M=ZK_METHODS[mid];
    const persAuto = ZAKAT.auto.reduce((x,a)=>x+a.v,0);
    const man = id => s.manual[id].on ? s.manual[id].v : 0;
    /* personal-use jewellery only counts under methods that zakat it */
    const persMan = ['homecash','silver','owed','points'].reduce((x,id)=>x+man(id),0) + (M.jewellery?man('jewel'):0);
    const biz = ZAKAT.bizAssets.reduce((x,b)=> x + (s.biz[b.id]?b.v:0), 0) + man('trade');
    const base = (s.scope==='personal') ? persAuto+persMan
               : (s.scope==='business') ? biz
               : persAuto+persMan+biz;
    return Math.max(base - this.debtTotal(), 0); },
  john(){ return this.baseUnder(this.st().method); },
  relUnder(fid, mid){ const f=ZAKAT.family.find(x=>x.id===fid);
    return f.cash + (ZK_METHODS[mid].jewellery ? f.jewelleryG*ZAKAT.goldPerG : 0); },
  relDue(fid, mid){ const s=this.st(); if(!s.rel[fid]) return 0;
    const b=this.relUnder(fid,mid); return b>=this.nisabUnder(mid) ? b*ZAKAT.rate : 0; },
  aisha(){ return this.st().rel.aisha ? this.relUnder('aisha', this.st().method) : 0; },
  nisabUnder(mid){ return ZK_METHODS[mid].nisab==='silver' ? ZAKAT.nisabSilverG*ZAKAT.silverPerG : ZAKAT.nisabGoldG*ZAKAT.goldPerG; },
  dueUnder(mid){ const nis=this.nisabUnder(mid);
    const bj=this.baseUnder(mid);
    const dj = bj>=nis ? bj*ZAKAT.rate : 0;
    const rels = ZAKAT.family.reduce((x,f)=>x+this.relDue(f.id,mid),0);
    return {j:dj, rels, t:dj+rels}; },
  due(){ return this.dueUnder(this.st().method); },
  set(k,v){ this.st()[k]=v; A.refresh(); },
  toggleManual(id){ const m=this.st().manual[id]; m.on=!m.on; if(m.on&&!m.v) this.editSheet(id); else A.refresh(); },
  editSheet(id){ const def=ZAKAT.manual.find(m=>m.id===id);
    const vals = id==='jewel'?[24319,48632,70516]:id==='silver'?[1124,3344,5620]:id==='owed'?[2000,8000,20000]:id==='points'?[100,230,600]:[1000,3500,10000,18000];
    A.sheet(`<div class="h2">${def.em} ${def.t}</div><div class="sub mt4">${def.note}.</div>
      <div class="chips" style="margin-top:14px">
        ${vals.map(v=>`<button class="chip" onclick="ZK.st().manual['${id}']={on:true,v:${v}};A.closeSheet();A.refresh()">AED ${fm(v,0)}</button>`).join('')}
        <button class="chip" onclick="ZK.st().manual['${id}']={on:false,v:0};A.closeSheet();A.refresh()">None</button>
      </div>
      <div class="lbl mt12 mb8">Or type any amount</div>
      <div class="flex" style="gap:8px">
        <input id="zkCustom" class="input tnum" type="number" inputmode="decimal" placeholder="AED 0,00" style="flex:1"
          onkeydown="if(event.key==='Enter')ZK.custom('${id}')">
        <button class="btn pri sm" onclick="ZK.custom('${id}')">Set</button>
      </div>
      ${id==='jewel'?'<div class="micro mt12">Tip: 50 g ≈ AED 24 319 · 100 g ≈ 48 632 · 145 g ≈ 70 516 at today’s price.</div>':''}`); },
  custom(id){
    const el=document.getElementById('zkCustom');
    const v=parseFloat(String(el&&el.value||'').replace(/[ ,]/g,''));
    if(!isFinite(v)||v<0){ if(el){el.classList.add('err'); setTimeout(()=>el.classList.remove('err'),400);} return; }
    this.st().manual[id]={on:v>0, v}; A.closeSheet(); A.refresh();
    A.toast(`Set: AED ${fm(v)} — recalculated`,'check');
  },
};
SCREENS.zakat = () => {
  const s = ZK.st(), m = ZK.meth(), z = ZAKAT;
  const step = s.step||1;
  const nis = ZK.nisab(), john = ZK.john(), aisha = ZK.aisha();
  const D = ZK.due(), due = D.t;
  const stepper = `
    <div class="chips mb12" style="justify-content:center">
      ${[[1,'1 · Calculate'],[2,'2 · Cause'],[3,'3 · Pay']].map(([n,tt])=>
        `<button class="chip ${step===n?'on':''}" ${n<step?`onclick="ZK.set('step',${n})"`:''} style="${n>step?'opacity:.45':''}">${tt}</button>`).join('')}
    </div>`;

  /* ---------- STEP 2 · choose the cause ---------- */
  if(step===2){
    const sel = s.charity||0;
    return `
    <div class="scr">
      ${hdr('Where your zakat goes',{back:"ZK.set('step',1)"})}
      ${stepper}
      <div class="sub">First time paying through an app? Fair question — here’s exactly who these organisations are and why they can be trusted with a religious duty.</div>
      ${z.charityInfo.map((c,i)=>`
        <div class="card mt12 tap" style="${sel===i?'outline:2px solid var(--lime)':''}" onclick="ZK.set('charity',${i})">
          <div class="flex" style="gap:12px">
            <span class="avx" style="background:rgba(215,240,80,.14);font-size:24px">${c.em}</span>
            <div class="f1"><div class="row-t">${c.n}</div><div class="row-d">${c.focus} · since ${c.since}</div></div>
            ${sel===i?`<span class="bigico" style="width:26px;height:26px;min-width:26px;border-radius:50%;background:var(--lime);color:var(--ink)">${ic('check',14)}</span>`:''}
          </div>
          <div class="hr" style="margin:10px 0"></div>
          <div class="kv" style="padding:4px 0"><span class="k">Licence</span><span class="v" style="font-size:12px;max-width:60%">${c.lic}</span></div>
          <div class="kv" style="padding:4px 0"><span class="k">Zakat handling</span><span class="v" style="font-size:12px;max-width:60%">${c.zk}</span></div>
          <div class="kv" style="padding:4px 0"><span class="k">Fees</span><span class="v" style="font-size:12px;max-width:60%">${c.fee}</span></div>
          <div class="kv" style="padding:4px 0"><span class="k">Track record</span><span class="v" style="font-size:12px;max-width:60%">${c.reach}</span></div>
        </div>`).join('')}
      <div class="card soft mt12 flex" style="gap:10px">${ic('shieldCheck',20,'lime-t')}
        <div class="micro"><b>Noor takes 0%.</b> Every receipt lands in your Documents within minutes, with the charity’s zakat-fund reference — auditable end-to-end.</div></div>
      <button class="btn lime mt16" onclick="ZK.set('step',3)">Continue — ${z.charityInfo[sel].n}</button>
    </div>`;
  }

  /* ---------- STEP 3 · how & when to pay ---------- */
  if(step===3){
    const plan = s.plan||'now', pct = s.pct||2;
    const salary = USER.salary, perSal = salary*pct/100;
    const months = Math.max(1, Math.ceil(due/perSal));
    const MONTHS = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan ’27','Feb ’27','Mar ’27','Apr ’27','May ’27','Jun ’27'];
    const finish = MONTHS[Math.min(months-1, MONTHS.length-1)];
    const PLANS = [
      ['now','Pay in full now', `AED ${fm(due)} · done before Ramadan starts`],
      ['ramadan','Tomorrow · 1 Ramadan', 'The most rewarded day — amount refreshed at live prices'],
      ['later','Pay later — Noor advances it (Qard Ḥasan)', `Charity receives 100% today · you repay 4 × AED ${fm(due/4)} · 0 fees — zakat is never late`],
      ['income','A % of each salary', `${pct}% = AED ${fm(perSal,0)}/salary · finishes by ${finish} — Noor tops up any gap at hawl-end`],
      ['pot','Zakat Pot — save ahead (Mudarabah)', `AED ${fm(due/12,0)}/mo set aside for NEXT year · earns ~3,1% profit · paid in one payment at hawl-end`],
    ];
    return `
    <div class="scr">
      ${hdr('How to pay',{back:"ZK.set('step',2)"})}
      ${stepper}
      <div class="card" style="background:linear-gradient(150deg,rgba(232,194,104,.16),var(--glass))">
        <div class="kv"><span class="k">Zakat due · ${m.n} method</span><span class="v tnum" style="font-size:18px">AED ${fm(due)}</span></div>
        <div class="kv"><span class="k">Going to</span><span class="v">${z.charityInfo[s.charity||0].n}</span></div>
        ${ZAKAT.family.some(f=>s.rel[f.id])?`<div class="kv"><span class="k">Covers</span><span class="v">You + ${ZAKAT.family.filter(f=>s.rel[f.id]).map(f=>f.name.split(' ')[0]).join(' + ')} (wakāla)</span></div>`:''}
      </div>
      <div class="lbl mt16 mb8">Choose a plan ${tipi('All five plans end with zakat fully paid on time. Qard Hasan = Noor pays the charity today and you repay an interest-free advance; the Pot saves ahead for NEXT year.')}</div>
      <div class="listcard">
        ${PLANS.map(([id,tt,dd])=>`
          <div class="row" onclick="ZK.set('plan','${id}')">
            <span class="bigico" style="width:26px;height:26px;min-width:26px;border-radius:50%;background:${plan===id?'var(--lime)':'var(--glass2)'};color:var(--ink)">${plan===id?ic('check',14):''}</span>
            <div class="row-main"><div class="row-t" style="font-size:13.5px;white-space:normal">${tt}</div>
              <div class="row-d" style="white-space:normal">${dd}</div></div>
          </div>`).join('')}
      </div>
      ${plan==='income'?`<div class="chips mt8">${[1,2,5].map(p=>`<button class="chip ${pct===p?'on':''}" onclick="ZK.set('pct',${p})">${p}% of salary</button>`).join('')}</div>`:''}
      ${plan==='later'?`<div class="micro mt8">Fiqh note: delaying zakat without need is discouraged — so Noor pays it <b>on time, in full</b> as an interest-free loan to you (Qard Ḥasan). Your repayment is a debt, not zakat.</div>`:''}
      ${plan==='pot'?`<div class="micro mt8">Honesty note: the Pot is still your wealth, so it stays inside next year’s zakat base automatically. Profit is Mudarabah — no interest anywhere.</div>`:''}
      <button class="btn lime mt16" onclick="ZK.activate()">${
        plan==='now'?`Pay AED ${fm(due)} now`:
        plan==='ramadan'?'Schedule for tomorrow · 1 Ramadan':
        plan==='later'?'Advance my zakat today — repay in 4':
        plan==='income'?`Activate ${pct}% salary rule`:
        'Open my Zakat Pot'}</button>
      <div class="micro mt12" style="text-align:center">Educational prototype — confirm with your local mufti.</div>
    </div>`;
  }

  /* ---------- STEP 1 · calculate ---------- */
  const allDues = Object.keys(ZK_METHODS).map(id=>({id, t:ZK.dueUnder(id).t}));
  const allEqual = allDues.every(x=>Math.abs(x.t-allDues[0].t)<0.01);
  return `
  <div class="scr">
    ${hdr('Zakat · 1447H',{right:`<button class="iconbtn" onclick="chatDeep('zakatFull')" title="Ask Noor">${ic('spark',18)}</button>`})}
    ${stepper}
    <div class="card lime">
      <div class="flex between"><b style="font-size:14px">🌙 ${z.hijri}</b></div>
      <div class="micro mt4">Anchor your hawl to 1 Ramadan and pay tomorrow — Noor recalculates on the day at live prices.</div>
    </div>

    <div class="lbl mt16 mb8">Scope — B2C · B2B</div>
    <div class="seg">
      ${[['personal','Personal'],['business','Business'],['both','Both']].map(([id,tt])=>
        `<button class="${s.scope===id?'on':''}" onclick="ZK.set('scope','${id}')">${tt}</button>`).join('')}
    </div>
    <div class="micro mt8">${s.scope==='personal'?'Only your personal wealth and personal debts.':s.scope==='business'?'Solo-proprietorship view: trade stock, business cash, receivables, your company share and fund units — minus business debts.':'The full picture — most owners need exactly this. Each side stays itemised below.'}</div>

    <div class="lbl mt16 mb8">Method — each shows YOUR total under it ${tipi('The four approaches differ only on two things: which nisab basis applies, and whether personal-use gold jewellery is zakatable. Tap a chip to recalculate everything.')}</div>
    <div class="chips">
      ${allDues.map(({id,t})=>`<button class="chip ${s.method===id?'on':''}" onclick="ZK.set('method','${id}')">${ZK_METHODS[id].n} · ${fm(t,0)}</button>`).join('')}
    </div>
    <div class="micro mt8">${m.who}</div>
    ${allEqual?`<div class="card soft mt8"><div class="micro">ℹ️ <b>Why all four match right now:</b> you’re above both nisabs and have no personal-use jewellery declared — the methods only diverge on jewellery and the nisab line. Add jewellery, or include Mum below (210 g of gold, little cash) — and watch them split hard.</div></div>`:''}
    <button class="chip mt8" onclick="chatDeep('zakatFull')">✦ Not sure? Noor interviews you & matches your scholar</button>

    <div class="card mt16">
      <div class="flex between"><span class="lbl">Nisab today ${tipi('Nisab is the wealth threshold below which no zakat is due — 85 g of gold or 595 g of silver, at live prices. Your method decides which basis applies.')}</span>
        ${john>=nis?'<span class="tag grn">Above nisab — zakat due ✓</span>':'<span class="tag gray">Below nisab in this scope — no zakat due</span>'}</div>
      <div class="kv mt8"><span class="k">Gold basis · 85 g</span><span class="v tnum" style="${m.nisab==='gold'?'color:var(--lime)':''}">AED ${fm(z.nisabGoldG*z.goldPerG)} ${m.nisab==='gold'?'← used':''}</span></div>
      <div class="kv"><span class="k">Silver basis · 595 g</span><span class="v tnum" style="${m.nisab==='silver'?'color:var(--lime)':''}">AED ${fm(z.nisabSilverG*z.silverPerG)} ${m.nisab==='silver'?'← used':''}</span></div>
      <div class="micro">Silver basis is lower — the cautious choice; it makes zakat due for more people.</div>
    </div>

    <div class="lbl mt16 mb8">Seen by Noor (live)</div>
    <div class="listcard">
      ${z.auto.map(a=>`<div class="kv" style="padding:11px 2px"><span class="k">${a.t}<br><span class="micro">${a.src}</span></span><span class="v tnum">${fm(a.v)}</span></div>`).join('')}
    </div>

    <div class="flex between mt16 mb8"><span class="lbl">Declared by you</span><span class="micro">tap a row for presets or a custom amount</span></div>
    <div class="listcard">
      ${z.manual.map(mn=>`
        <div class="row" onclick="ZK.editSheet('${mn.id}')">
          <span style="font-size:22px">${mn.em}</span>
          <div class="row-main"><div class="row-t" style="font-size:13px;white-space:normal">${mn.t}</div><div class="row-d" style="white-space:normal">${mn.note}</div></div>
          <div class="row-r"><div class="row-amt tnum">${s.manual[mn.id].on?fm(s.manual[mn.id].v,0):'—'}</div></div>
          <button class="switch lime ${s.manual[mn.id].on?'on':''}" onclick="event.stopPropagation();ZK.toggleManual('${mn.id}')"></button>
        </div>`).join('')}
    </div>

    ${s.scope!=='personal'?`
    <div class="flex between mt16 mb8"><span class="lbl">Business assets (B2B)</span><span class="micro">LLC shares · fund units · look-through</span></div>
    <div class="listcard">
      ${ZAKAT.bizAssets.map(b=>`
        <div class="row static">
          <span style="font-size:22px">${b.em}</span>
          <div class="row-main"><div class="row-t" style="font-size:13px;white-space:normal">${b.t}</div>
            <div class="row-d" style="white-space:normal">${b.note}</div></div>
          ${b.locked
            ?'<span class="tag grn">✓ paid by fund</span>'
            :`<div class="row-amt tnum" style="font-size:13px">${fm(b.v,0)}</div>
              <button class="switch lime ${s.biz[b.id]?'on':''}" onclick="ZK.st().biz['${b.id}']=!ZK.st().biz['${b.id}'];A.refresh()"></button>`}
        </div>`).join('')}
    </div>
    <div class="micro mt8">Shares held for dividends → zakat on the company’s zakatable assets, pro-rata (AAOIFI SS 35). Held for trading → full market value instead.</div>`:''}

    <div class="flex between mt16 mb8"><span class="lbl">Debts to deduct — AED ${fm(ZK.debtTotal())}</span>
      <button class="chip" onclick="A.go('debts')">Check-up ↗</button></div>
    <div class="micro mb8">Short-term & due debts deduct in full; long-term financing — next 12 months only (AAOIFI, Qaradawi). The Shafi‘i school doesn’t deduct debts — toggle all off to follow it.</div>
    ${['personal','business'].filter(g=>s.scope==='both'||s.scope===g).map(grp=>`
      <div class="lbl mt8 mb8" style="font-size:9.5px">${grp==='personal'?'Personal':'Business — incl. your team’s payroll'}</div>
      <div class="listcard">
        ${ZAKAT.deduct[grp].map(d=>`
          <div class="row static">
            <div class="row-main"><div class="row-t" style="font-size:13px;white-space:normal">${d.t}</div>
              <div class="row-d" style="white-space:normal">${d.note}</div></div>
            <div class="row-amt tnum" style="font-size:13px">−${fm(d.v,0)}</div>
            <button class="switch lime ${s.debts[d.id]?'on':''}" onclick="ZK.st().debts['${d.id}']=!ZK.st().debts['${d.id}'];A.refresh()"></button>
          </div>`).join('')}
      </div>`).join('')}

    <div class="flex between mt16 mb8"><span class="lbl">Helping relatives — wakāla ${tipi('Wakāla = authorised agency. You may calculate and pay zakat for your wife or elderly parents only with their permission — the obligation and intention (niyyah) remain theirs.')}</span><span class="micro">each is an individual obligation</span></div>
    <div class="micro mb8">A son or spouse may calculate and pay for elderly parents or each other — <b>with their permission</b> (wakāla, valid in all four schools). The niyyah belongs to them.</div>
    <div class="listcard">
      ${z.family.map(f=>{
        const on=s.rel[f.id], b=ZK.relUnder(f.id, s.method), dueF=ZK.relDue(f.id, s.method);
        return `
      <div class="row static">
        ${avx(f.name)}
        <div class="row-main"><div class="row-t">${f.rel} — ${f.name}</div>
          <div class="row-d" style="white-space:normal">Cash AED ${fm(f.cash,0)}${f.jewelleryG?` · gold ${f.jewelleryG} g ${m.jewellery?'(counted)':'(exempt — personal use)'}`:''} · ${f.note}</div>
          ${on?`<div class="row-sub mt4" style="color:${dueF>0?'var(--gold)':'var(--grn)'}">${dueF>0?`Due under ${m.n}: AED ${fm(dueF)}`:`Below nisab under ${m.n} — no zakat due ✓`}</div>
          <div class="flex mt4" style="gap:8px"><span class="micro">Authorised me to pay (wakāla)</span>
            <button class="switch lime ${s.wak[f.id]?'on':''}" style="transform:scale(.8)" onclick="ZK.st().wak['${f.id}']=!ZK.st().wak['${f.id}'];A.refresh()"></button></div>`:''}
        </div>
        <button class="switch lime ${on?'on':''}" onclick="ZK.st().rel['${f.id}']=!ZK.st().rel['${f.id}'];ZK.st().wak['${f.id}']=true;A.refresh()"></button>
      </div>`;}).join('')}
    </div>
    ${s.rel.mum?`<div class="card soft mt8"><div class="micro">💡 <b>Mum is the textbook case:</b> cash AED 12 600 is below the gold nisab and her jewellery is personal-use — so <b>Majority/AAOIFI: nothing due</b>. Under <b>Hanafi</b>, 210 g counts → AED ${fm(ZK.relUnder('mum','hanafi')*z.rate)}. Pick her school in the chips above and watch the totals move.</div></div>`:''}

    <div class="card mt16" style="background:linear-gradient(150deg,rgba(232,194,104,.16),var(--glass))">
      <div class="flex between"><span class="tag gold">☪ Total zakat due · ${m.n} method</span><span class="micro">2,5% (lunar year)</span></div>
      <div style="font:800 38px Inter,sans-serif" class="tnum mt8">AED ${fm(due)}</div>
      <div class="kv mt8"><span class="k">${USER.first} — on AED ${fm(john)}</span><span class="v tnum">${fm(D.j)}</span></div>
      ${z.family.filter(f=>s.rel[f.id]).map(f=>{
        const dueF=ZK.relDue(f.id,s.method);
        return `<div class="kv"><span class="k">${f.name} — on AED ${fm(ZK.relUnder(f.id,s.method),0)} ${s.wak[f.id]?'(you pay)':'(own payment)'}</span><span class="v tnum">${dueF>0?fm(dueF):'0 — below nisab'}</span></div>
        ${s.wak[f.id]?'':`<div class="micro">Wakāla off — share the breakdown: <b onclick="A.toast('Breakdown sent to ${f.name.split(' ')[0]}','share')" style="color:var(--lime);cursor:pointer">Send ↗</b></div>`}`;}).join('')}
    </div>
    <button class="btn lime mt16" onclick="ZK.set('step',2)">Continue — choose where it goes</button>
    <div class="micro mt12" style="text-align:center">Educational prototype — method notes are honest simplifications; confirm with your local mufti. Hawl tracking per asset is on.</div>
  </div>`;
};
ZK.activate = function(){
  const s=this.st(), due=this.due().t, ch=ZAKAT.charityInfo[s.charity||0].n, plan=s.plan||'now';
  if(plan==='now'){ confetti(document.getElementById('screen')); A.toast(`Zakat paid to ${ch} — certificate in Documents`,'check'); }
  else if(plan==='ramadan'){ A.toast(`Scheduled for tomorrow, 1 Ramadan — recalculated at live prices, then paid to ${ch}`,'moon'); }
  else if(plan==='later'){ confetti(document.getElementById('screen'));
    A.toast(`${ch} received AED ${fm(due)} today — Qard Ḥasan repayment 4 × AED ${fm(due/4)} starts 25 Jul`,'check'); }
  else if(plan==='income'){ const pct=s.pct||2;
    RULES.unshift({id:'rzi', on:true, when:'Salary arrives (25th)', then:`Pay ${pct}% (AED ${fm(USER.salary*pct/100,0)}) of salary as zakat to ${ch} until AED ${fm(due)} is covered`, ic:'moon', ran:'Hawl-end top-up guarantee on — you can never end the year short'});
    A.toast('Salary-percentage zakat rule active','moon'); A.go('rules'); return; }
  else { RULES.unshift({id:'rzp', on:true, when:'1st of every month', then:`Move AED ${fm(due/12,0)} into the Zakat Pot (Mudarabah ~3,1%) — auto-pays next hawl-end`, ic:'coins', ran:'Pot opened today · projected AED '+fm(due*1.016,0)+' by next Ramadan'});
    A.toast('Zakat Pot opened — saving ahead, earning halal profit','coins'); A.go('rules'); return; }
};

/* ---------------- agents hub — delegated purchasing ---------------- */
SCREENS.agents = () => {
  const st = A.tmp.ag || (A.tmp.ag = {healthy:true, local:true, promo:true, risk:false, careem:'agent'});
  return `
  <div class="scr">
    ${hdr('Your agents',{right:`<button class="iconbtn" onclick="chatDeep('agents')">${ic('spark',18)}</button>`})}
    <div class="card lime">
      <div class="flex between"><span class="lbl" style="color:rgba(11,20,16,.55)">Agents earned you ${tipi('Verified value: price differences vs. your old habits, refunds recovered, cashback routed, yield bumps — receipts attached to every line.')}</span><span class="tag" style="background:rgba(11,20,16,.14);color:#0B1410">${AGENTS.period}</span></div>
      <div style="font:800 36px Inter,sans-serif" class="tnum mt8">AED ${fm(AGENTS.earned,0)}</div>
      <div class="micro mt4">${AGENTS.breakdown.map(([t,v])=>`${t} ${fm(v,0)}`).join(' · ')} — plus ${AGENTS.timeSaved}</div>
    </div>

    <div class="lbl mt16 mb8">Strategies — how they decide</div>
    <div class="listcard">
      <div class="row static"><span style="font-size:20px">🛡</span><div class="row-main"><div class="row-t" style="font-size:13.5px">Shariah-strict only</div><div class="row-d" style="white-space:normal">Agents never touch non-compliant products — locked on</div></div><span class="tag grn">Always</span></div>
      ${[['healthy','🥗','Eat healthy','Groceries: whole foods first, sugar −30%, organic when ≤10% premium'],
         ['local','🇦🇪','Support local brands','UAE & GCC brands always ranked first — your community, funded'],
         ['promo','🎟','Hunt promo codes','Every working code on the internet gets tried at checkout']]
        .map(([id,em,t,d])=>`
        <div class="row static"><span style="font-size:20px">${em}</span>
          <div class="row-main"><div class="row-t" style="font-size:13.5px">${t}</div><div class="row-d" style="white-space:normal">${d}</div></div>
          <button class="switch lime ${st[id]?'on':''}" onclick="A.tmp.ag.${id}=!A.tmp.ag.${id};A.refresh()"></button>
        </div>`).join('')}
      <div class="row static"><span style="font-size:20px">⚡</span>
        <div class="row-main"><div class="row-t" style="font-size:13.5px">Riskier yield — P2P business financing ${tipi('Musharaka: you share real profit and real loss with vetted SMEs. No interest anywhere — and no guarantees either. The most Shariah-native risk there is.')}</div>
          <div class="row-d" style="white-space:normal">${AGENTS.p2p.exp} · ${AGENTS.p2p.platforms}</div>
          ${st.risk?`<div class="row-sub mt4" style="color:var(--gold)">⚠️ ${AGENTS.p2p.risk}</div>
          <div class="chips mt4">${AGENTS.p2p.alloc.map(p=>`<button class="chip ${p===10?'on':''}" onclick="A.toast('${p}% of savings allocated to Musharaka deals — drip-funded, diversified over 12+ SMEs','check')">${p}% of savings</button>`).join('')}</div>`:''}
        </div>
        <button class="switch lime ${st.risk?'on':''}" onclick="A.tmp.ag.risk=!A.tmp.ag.risk;A.refresh()"></button>
      </div>
    </div>

    <div class="lbl mt16 mb8">The fleet — delegated to act for you</div>
    ${AGENTS.fleet.map(f=>`
      <div class="card mt8">
        <div class="flex" style="gap:12px">
          <span class="avx" style="background:rgba(215,240,80,.12);font-size:22px">${f.em}</span>
          <div class="f1"><div class="row-t" style="font-size:14px">${f.t}</div><div class="row-d" style="white-space:normal">${f.sub}${f.strat?' · '+f.strat:''}</div></div>
          <button class="switch lime on" onclick="this.classList.toggle('on')"></button>
        </div>
        <div class="kv mt8" style="padding:6px 0"><span class="k">Report</span><span class="v" style="font-size:12px;max-width:64%;font-weight:500">${f.report}</span></div>
        ${f.last?`<div class="micro">${f.last}</div>`:''}
        ${f.collab?`<div class="micro mt4" style="color:var(--lime)">🤝 ${f.collab}</div>`:''}
        ${f.decision?`
        <div class="card soft mt8">
          <b style="font-size:13px">Live decision ${tipi('The agent shows its math before money moves. Override anytime — or let it decide.')}</b>
          <div class="sub mt4" style="font-size:12.5px">${f.decision.q}</div>
          <div class="chips mt8">
            ${[['cash','Always cashback'],['miles','Always miles'],['agent','Agent decides ✦']].map(([id,t])=>`<button class="chip ${st.careem===id?'on':''}" onclick="A.tmp.ag.careem='${id}';A.refresh()">${t}</button>`).join('')}
          </div>
          ${st.careem==='agent'?`<div class="micro mt8"><b style="color:var(--lime)">Picked: ${f.decision.pick}.</b> ${f.decision.why}</div>`:`<div class="micro mt8">Override saved — the agent will stop optimising this one.</div>`}
        </div>`:''}
      </div>`).join('')}

    <div class="card soft mt12 flex" style="gap:10px">${ic('shieldCheck',20,'lime-t')}
      <div class="micro"><b>Linked for better deals:</b> Fazaa Gold (partner pricing) and Booking.com (instant booking) — every agent purchase needs your spend rules; big-ticket always asks first.</div></div>
    <div class="btnrow mt12">
      <button class="btn ghost" onclick="A.tmp.cnCat='life';A.go('connect-banks')">${ic('plus',18)} Link Fazaa · Booking</button>
      <button class="btn pri" onclick="A.toast('Monthly agent report scheduled — 1st of each month','doc')">Email me reports</button>
    </div>
  </div>`;
};

/* ---------------- birthday gift planner (consent-shared signals) ---------------- */
SCREENS.gift = () => {
  const g = GIFT, bud = A.tmp.giftBud||800;
  return `
  <div class="scr">
    ${hdr('Gift planner')}
    <div class="card" style="background:linear-gradient(150deg,rgba(255,143,192,.16),var(--glass))">
      <div class="flex between"><b style="font-size:15px">🎂 ${g.who}’s birthday</b><span class="tag" style="background:rgba(255,143,192,.2);color:#FF8FC0">in ${g.inDays} days</span></div>
      <div class="micro mt4">${g.date} · reminder set — I won’t let it sneak up on you.</div>
    </div>
    <div class="card soft mt12 flex" style="gap:10px;align-items:flex-start">${ic('shieldCheck',20,'lime-t')}
      <div class="micro"><b>With her consent:</b> ${g.consent} ${tipi('These signals come from Aisha’s own Noor app — she chose to share gift-relevant categories with you. You see ideas, never her raw transactions or searches.')}</div></div>

    <div class="lbl mt16 mb8">Budget it ${tipi('Reserved into a hidden Gift pot — masked from shared views and her insights, so the surprise survives.')}</div>
    <div class="chips">
      ${g.budgets.map(v=>`<button class="chip ${bud===v?'on':''}" onclick="A.tmp.giftBud=${v};A.refresh()">AED ${fm(v,0)}</button>`).join('')}
      <button class="chip" onclick="A.tip('Type any amount in the chat — “budget 1 200 for the gift” works too.')">✏️ Custom</button>
    </div>
    <button class="btn pri sm mt8" onclick="A.toast('AED ${fm(bud,0)} set aside in a hidden Gift pot 🤫 — fits your safe-to-spend','check')">Reserve AED ${fm(bud,0)} now</button>

    <div class="lbl mt20 mb8">Ideas from her signals</div>
    ${g.ideas.map(i=>`
      <div class="card mt8">
        <div class="flex" style="gap:12px">
          <span class="avx" style="background:rgba(255,143,192,.14);font-size:22px">${i.em}</span>
          <div class="f1"><div class="row-t" style="font-size:14px">${i.t}</div>
            <div class="row-d" style="white-space:normal">${i.store}</div></div>
          <div class="row-amt tnum">${fm(i.price,0)}</div>
        </div>
        <div class="flex mt8" style="gap:8px"><span class="tag" style="background:rgba(255,143,192,.14);color:#FF8FC0">${i.src}</span>
          <span class="micro f1">${i.why}</span></div>
        <button class="btn ghost sm mt8" onclick="confetti(document.getElementById('screen'));A.toast('${esc(i.t)} reserved — delivery before the 26th, spend masked in shared views','gift')">Buy with the Gift pot</button>
      </div>`).join('')}

    <div class="card soft mt12 flex" style="gap:10px">${ic('eyeOff',18,'lime-t')}
      <div class="micro"><b>Surprise protection:</b> gift purchases are hidden from her shared dashboards and family insights until the 26th.</div></div>
    <div class="chips mt12">
      ${[['1 week before','19 Jun'],['3 days before','23 Jun'],['On the day','26 Jun']].map(([t,d])=>`<button class="chip" onclick="A.toast('Reminder set — ${d}, 09:00','bell')">🔔 ${t}</button>`).join('')}
    </div>
  </div>`;
};

/* ---------------- SME insight stories — notifications become insights ---------------- */
const BIZ_CARDS = [
  {ic:'🚀', icBg:'#FCE7F3',
   h:'Your sales this month rocketed 30% vs last month',
   chart:`<div style="display:flex;align-items:flex-end;justify-content:center;gap:34px;height:170px;margin:18px 0 6px">
      <div style="text-align:center"><div class="micro" style="color:#6B7280;font-weight:700">32K</div>
        <div style="width:84px;height:104px;background:#E935D8;border-radius:10px;margin-top:6px"></div>
        <div class="micro mt8" style="color:#6B7280">Last month</div></div>
      <div style="text-align:center"><div class="micro" style="color:#111;font-weight:800">41.6K</div>
        <div style="width:84px;height:140px;background:#E935D8;border-radius:10px;margin-top:6px"></div>
        <div class="micro mt8" style="color:#6B7280">This month</div></div>
    </div>`,
   src:'Based on your sales report', cta:'Keep tracking'},
  {ic:'💳', icBg:'#D8F8EA',
   h:'Rejected orders dropped to 12% after adding long-term financing at checkout',
   chart:`<div style="display:flex;align-items:flex-end;justify-content:center;gap:16px;height:180px;margin:16px 0 4px">
      ${[['Sep',38,[0,34,28]],['Oct',32,[0,40,28]],['Nov',18,[26,36,20]],['Dec',12,[38,34,16]]].map(([mn,rej,seg])=>`
        <div style="text-align:center">
          <div class="micro" style="color:${rej===12?'#fff':'#6B7280'};font-weight:800;${rej===12?'background:#16191C;border-radius:8px;padding:2px 7px':''}">${rej}%</div>
          <div style="width:56px;height:130px;display:flex;flex-direction:column;justify-content:flex-end;border-radius:10px;overflow:hidden;background:#E9EBF0;margin-top:5px">
            <div style="height:${seg[0]}%;background:#F7E96B"></div>
            <div style="height:${seg[1]}%;background:#3ECB7E"></div>
            <div style="height:${seg[2]}%;background:#A45CFF"></div>
          </div>
          <div class="micro mt4" style="color:#6B7280">${mn}</div></div>`).join('')}
    </div>
    <div class="chips" style="justify-content:center">
      <span class="tag" style="background:#FBF3C6;color:#6B5E00">Long-term financing</span>
      <span class="tag" style="background:#D8F8EA;color:#0B7A45">Pay in 4</span>
      <span class="tag" style="background:#EFE2FF;color:#6B2BD9">Noor card</span>
      <span class="tag gray">Rejected</span>
    </div>`,
   src:'Based on your sales report', cta:'Keep tracking'},
  {ic:'👕', icBg:'#EFE2FF',
   h:'Your customer acquisition cost is 30% higher than average in your category',
   sub:'Streetwear category, UAE',
   chart:`<div style="margin:26px 0 10px">
      <div class="kv" style="font-size:15px"><span class="k" style="color:#6B7280">Average CAC</span><span class="v tnum" style="font-size:22px;font-weight:800;color:#9AA3AD">AED 3,20</span></div>
      <div class="kv" style="font-size:15px"><span class="k" style="color:#6B7280">Your CAC</span><span class="v tnum" style="font-size:22px;font-weight:800;color:#111">AED 4,21</span></div>
    </div>`,
   src:'Based on Noor merchant data', cta:'Show this in a week'},
];
SCREENS.biz = () => {
  const i = Math.min(A.tmp.bizI||0, BIZ_CARDS.length-1), c = BIZ_CARDS[i];
  return `
  <div class="scr light" style="display:flex;flex-direction:column">
    ${hdr('Business insights',{right:`<span class="tag lime" style="color:#5d6e0d">${i+1}/${BIZ_CARDS.length}</span>`})}
    <div class="card white f1" style="display:flex;flex-direction:column;justify-content:center;text-align:center;border:1px solid var(--lt-line)">
      <div style="width:74px;height:74px;border-radius:50%;background:${c.icBg};display:flex;align-items:center;justify-content:center;font-size:34px;margin:0 auto">${c.ic}</div>
      <div class="h2 mt16" style="line-height:1.35">${c.h}</div>
      ${c.sub?`<div class="sub mt4">${c.sub}</div>`:''}
      ${c.chart}
      <div class="micro mt12">${c.src}</div>
    </div>
    <div class="btnrow mt12">
      <button class="btn ltghost" onclick="A.tmp.bizI=${i+1>=BIZ_CARDS.length?0:i+1};${i+1>=BIZ_CARDS.length?`A.toast('All caught up — new insights land here, not in notifications','check');`:''}A.refresh()">Skip</button>
      <button class="btn dark" onclick="A.toast('${c.cta==='Keep tracking'?'Tracking — weekly updates in this feed':'Scheduled — back in 7 days'}','check');A.tmp.bizI=${i+1>=BIZ_CARDS.length?0:i+1};A.refresh()">${c.cta}</button>
    </div>
    <div class="micro mt8" style="text-align:center">Every business notification becomes an insight story — nothing nags, everything lands here.</div>
  </div>`;
};

/* ---------------- financing check-up · refinance plan · deposit-secured ---------------- */
SCREENS.debts = () => {
  const totOut = DEBTS.reduce((s,d)=>s+d.out,0), totCost = DEBTS.reduce((s,d)=>s+d.costYr,0);
  const exMortg = totCost - 36708;
  return `
  <div class="scr">
    ${hdr('Financing check-up')}
    <div class="card">
      <span class="lbl">All financing & obligations</span>
      <div style="font:800 32px Inter,sans-serif" class="tnum mt8">AED ${fm(totOut,0)}</div>
      <div class="micro mt4">9 facilities across 4 providers · auto-detected via Noor Connect</div>
      <div class="hr"></div>
      <div class="kv"><span class="k">Profit charges you pay per year</span><span class="v tnum red-t">AED ${fm(totCost,0)}</span></div>
      <div class="kv"><span class="k">…excluding the home (rate is fine)</span><span class="v tnum">AED ${fm(exMortg,0)}</span></div>
      <div class="micro">That’s AED ${fm(exMortg/12,0)}/month burning on expensive facilities — most of it fixable.</div>
    </div>
    <div class="card lime mt12 tap" onclick="A.go('refi')">
      <div class="flex between"><b style="font-size:14px">⚡ Refinance plan ready — save AED 6 889/yr</b>${ic('chevR',18)}</div>
      <div class="micro mt4">Close 1 · transfer 4 · keep 4 — economics checked line by line</div>
    </div>
    ${['Personal','Business'].map(kind=>`
      <div class="lbl mt16 mb8">${kind}</div>
      <div class="listcard">
        ${DEBTS.filter(d=>d.kind===kind).map(d=>`
          <div class="row" onclick="A.go('refi')">
            ${blg(d.bank)}
            <div class="row-main"><div class="row-t" style="font-size:13.5px">${d.t}</div>
              <div class="row-d">${d.rate?d.rate.toFixed(2).replace('.',',')+'% profit'+(d.monthly?' · AED '+fm(d.monthly,0)+'/mo':''):'0% — free terms'}</div></div>
            <div class="row-r"><div class="row-amt tnum">${fm(d.out,0)}</div>
              <div class="row-sub" style="color:${d.costYr>1500?'var(--red)':'var(--tx3)'}">${d.costYr?'costs '+fm(d.costYr,0)+'/yr':'—'}</div></div>
          </div>`).join('')}
      </div>`).join('')}
    <div class="micro mt12" style="text-align:center">All facilities are Shariah structures — no interest anywhere; “profit rate” is the disclosed Murabaha/Ijarah cost.</div>
  </div>`;
};

SCREENS.refi = () => {
  const lens = !!A.tmp.refiLens;
  const saves = DEBTS.reduce((s,d)=>s+d.save,0), rev = DEBTS.reduce((s,d)=>s+d.noorRev,0);
  const REC = {close:['red','Close it'],transfer:['lime','Transfer'],keep:['grn','Keep'],schedule:['blu','Schedule']};
  return `
  <div class="scr">
    ${hdr('Refinance plan',{right:`<button class="chip ${lens?'on':''}" onclick="A.tmp.refiLens=!A.tmp.refiLens;A.refresh()">💰 Investor lens</button>`})}
    <div class="card lime">
      <b style="font-size:14px">Follow the plan → save AED ${fm(saves,0)}/yr</b>
      <div class="micro mt4">Every recommendation is ranked by <b>your</b> savings — including four “keep”s that earn Noor nothing.</div>
      ${lens?`<div class="hr" style="background:rgba(11,20,16,.15)"></div>
      <div class="micro"><b>💰 Noor unit economics (demo):</b> refinancing fees + financing margin ≈ <b>AED ${fm(rev,0)}</b> first-year revenue from this one customer. Honest advice still pays.</div>`:''}
    </div>
    ${DEBTS.map(d=>{
      const [c,label]=REC[d.rec];
      return `
      <div class="card mt12">
        <div class="flex" style="gap:12px">
          ${blg(d.bank)}
          <div class="f1"><div class="row-t" style="font-size:14px">${d.t}</div>
            <div class="row-d">AED ${fm(d.out,0)}${d.rate?' · '+d.rate.toFixed(2).replace('.',',')+'%':''}</div></div>
          <span class="tag ${c}">${label}</span>
        </div>
        <div class="sub mt8" style="font-size:12.5px">${d.why}</div>
        ${d.to?`<div class="kv mt4"><span class="k">→ ${d.to}</span><span class="v tnum grn-t">save ${fm(d.save,0)}/yr</span></div>`:''}
        ${lens&&d.noorRev?`<div class="micro" style="color:var(--gold)">💰 Noor earns ≈ AED ${fm(d.noorRev,0)} (1% switch fee + margin share)</div>`:lens?`<div class="micro" style="color:var(--tx3)">💰 Noor earns AED 0 — trust play</div>`:''}
        ${d.rec==='transfer'?`<button class="btn pri sm mt8" onclick="A.toast('${esc(d.t)} — buyout initiated, old facility settles in 2 days','check')">Transfer in 1 tap</button>`
        :d.rec==='close'?`<button class="btn pri sm mt8" onclick="A.toast('Settled from e-Saver — AED 3 190/yr stays yours','check')">Settle from e-Saver</button>`
        :d.rec==='schedule'?`<button class="btn pri sm mt8" onclick="A.toast('Payroll scheduled — 28th, from FAB ··5689','cal')">Schedule payroll</button>`:''}
      </div>`;}).join('')}
    <div class="card soft mt12 tap" onclick="A.go('dsf')">
      <div class="flex between"><b style="font-size:13.5px">🔐 How deposit-secured financing works</b>${ic('chevR',16)}</div>
      <div class="micro mt4">The engine behind two of these transfers — rahn over your e-Saver</div>
    </div>
    <button class="btn lime mt16" onclick="confetti(document.getElementById('screen'));A.toast('Plan applied — 5 actions queued, savings start this month','check')">Apply the whole plan</button>
  </div>`;
};

SCREENS.dsf = () => `
  <div class="scr">
    ${hdr('Deposit-secured financing')}
    <div class="card" style="text-align:center;background:linear-gradient(150deg,rgba(215,240,80,.12),var(--glass))">
      <div style="font-size:40px">🔐</div>
      <div class="h2 mt8">Borrow against your own savings</div>
      <div class="sub mt8">${DSF.blurb}</div>
    </div>
    <div class="listcard mt12">
      <div class="kv" style="padding:11px 2px"><span class="k">Your e-Saver (stays earning ${DSF.earn.toFixed(1).replace('.',',')}%)</span><span class="v tnum">AED ${fm(DSF.deposit)}</span></div>
      <div class="kv" style="padding:11px 2px"><span class="k">Pledge up to ${DSF.pledge*100}% (rahn)</span><span class="v tnum">AED ${fm(DSF.deposit*DSF.pledge,0)}</span></div>
      <div class="kv" style="padding:11px 2px"><span class="k">Personal rate</span><span class="v tnum">${DSF.rate.toFixed(2).replace('.',',')}% p.a.</span></div>
      <div class="kv" style="padding:11px 2px"><span class="k">Business rate</span><span class="v tnum">${DSF.bizRate.toFixed(2).replace('.',',')}% p.a.</span></div>
      <div class="kv" style="padding:11px 2px"><span class="k">Net cost after deposit profit ${tipi('You pay 4,25% on the financing while your pledged deposit keeps earning ~3,1% Mudarabah profit — so the true cost is the difference, about 1,15%.')}</span><span class="v tnum grn-t">≈ 1,15% — cheapest financing in the app</span></div>
    </div>
    <div class="card soft mt12 flex" style="gap:10px">${ic('moon',18,'gold-t')}<div class="micro">Structure: commodity Murabaha with a pledge (rahn) over the deposit — reviewed by the Noor Shariah board; no interest at any step.</div></div>
    <button class="btn lime mt16" onclick="A.go('refi')">Use it in my refinance plan</button>
  </div>`;

/* ---------------- consents (AA-style) ---------------- */
SCREENS.consents = () => `
  <div class="scr">
    ${hdr('Consent centre')}
    <div class="sub">Every data-sharing permission you’ve granted — purpose-bound, time-bound, revocable. Like India’s Account Aggregator, built for the UAE.</div>
    <div class="listcard mt12">
      ${CONSENTS.map(c=>`
        <div class="row" onclick="A.go('consent/${c.bank}')">
          ${blg(c.bank)}
          <div class="row-main"><div class="row-t">${BANKS[c.bank].name}</div><div class="row-d">${c.scope}</div></div>
          <span class="tag ${c.status==='Active'?'grn':'gold'}">${c.status}</span>
        </div>`).join('')}
    </div>
    <div class="card soft mt12 flex" style="gap:10px">${ic('shieldCheck',20,'lime-t')}<div class="micro">Noor never sells data. Access logs are auditable below — 142 reads this month, all by you or your rules.</div></div>
    <button class="btn ghost mt12" onclick="A.toast('Access log: 142 reads · 0 third parties','doc')">View access log</button>
  </div>`;
SCREENS.consent = (bank) => {
  const c = CONSENTS.find(x=>x.bank===bank)||CONSENTS[0];
  return `
  <div class="scr">
    ${hdr(BANKS[c.bank].name+' consent')}
    <div class="card">
      <div class="kv"><span class="k">Status</span><span class="v" style="color:${c.status==='Active'?'var(--grn)':'var(--gold)'}">${c.status}</span></div>
      <div class="kv"><span class="k">Scope</span><span class="v" style="max-width:60%">${c.scope}</span></div>
      <div class="kv"><span class="k">Granted</span><span class="v">${c.granted}</span></div>
      <div class="kv"><span class="k">Expires</span><span class="v">${c.expires}</span></div>
      <div class="kv"><span class="k">Refresh frequency</span><span class="v">${c.freq}</span></div>
      <div class="kv"><span class="k">Consent receipt</span><span class="v lime-t" onclick="A.toast('Receipt downloaded','doc')">Download ↓</span></div>
    </div>
    ${c.status!=='Active'?`<button class="btn lime mt12" onclick="A.toast('Consent renewed for 12 months','check');A.back()">Renew consent</button>`:''}
    <button class="btn danger mt12" onclick="A.confirm('Revoke ${BANKS[c.bank].name} consent?','Syncing stops immediately. Existing data stays on your device until you delete it.',()=>{A.toast('Consent revoked — bank notified','check');A.go('consents')})">Revoke consent</button>
  </div>`;
};

/* ---------------- profile & settings ---------------- */
SCREENS.profile = () => `
  <div class="scr">
    ${hdr('Profile')}
    <div class="card flex" style="gap:14px">
      ${avx(USER.first+' '+USER.last,'lg')}
      <div class="f1"><div class="h3">${USER.first} ${USER.last}</div>
        <div class="micro mt4">${USER.phone} · with Noor since ${USER.since}</div>
        <div class="flex mt8" style="gap:6px"><span class="tag grn">KYC verified</span><span class="tag gold">${REWARDS.tier}</span></div></div>
    </div>
    <div class="listcard mt12">
      ${[['shieldCheck','Security & privacy','security'],['bank','Linked banks & consents','consents'],['doc','Statements & documents','statement'],
         ['zap','Noor Rules','rules'],['gift','Rewards','rewards'],['headset','Support — humans, 24/7','support'],['globe',A.S.lang==='ar'?'اللغة · العربية':'Language · English','language']]
        .map(([i,t,r])=>`<div class="row" onclick="A.go('${r}')"><span class="bigico">${ic(i,20)}</span><div class="row-main"><div class="row-t">${t}</div></div><span class="chev">${ic('chevR',16)}</span></div>`).join('')}
    </div>
    <div class="card soft mt12">
      <div class="kv"><span class="k">Verified salary</span><span class="v tnum">AED ${fm(USER.salary,0)} / mo · ${USER.employer}</span></div>
      <div class="kv"><span class="k">Prototype</span><span class="v">v1 · Jun 2026 · fictional data</span></div>
    </div>
    <button class="btn ghost mt12" onclick="A.demoReset()">${ic('logout',18)} Restart demo</button>
  </div>`;
SCREENS.security = () => `
  <div class="scr">
    ${hdr('Security')}
    <button class="btn danger" onclick="A.S.frozen=!A.S.frozen;A.persist();A.refresh();A.toast(A.S.frozen?'Everything frozen — cards, transfers, logins':'Unfrozen','shield')">
      ${ic('shield',20)} ${A.S.frozen?'Unfreeze everything':'Freeze everything'}</button>
    <div class="micro mt8" style="text-align:center">Panic button: blocks cards, outgoing transfers and new devices across all linked banks.</div>
    <div class="listcard mt16">
      ${[['faceid','Face ID','on'],['lock','6-digit passcode','set'],['bell','Login alerts','on'],['eye','Hide balances on open','off']]
        .map(([i,t,s])=>`<div class="row static"><span class="bigico">${ic(i,20)}</span><div class="row-main"><div class="row-t">${t}</div></div>
        ${s==='set'?`<button class="chip" onclick="A.toast('Passcode change flow (mock)','lock')">Change</button>`:`<button class="switch lime ${s==='on'?'on':''}" onclick="this.classList.toggle('on')"></button>`}</div>`).join('')}
    </div>
    <div class="lbl mt16 mb8">Devices</div>
    <div class="listcard">
      <div class="row static"><span class="bigico">${ic('phone',20)}</span><div class="row-main"><div class="row-t">iPhone 17 Pro — this device</div><div class="row-d">Dubai · active now</div></div><span class="tag grn">You</span></div>
      <div class="row static"><span class="bigico">${ic('phone',20)}</span><div class="row-main"><div class="row-t">iPad Air</div><div class="row-d">Last seen 3 May</div></div><button class="chip" onclick="A.toast('Signed out everywhere else','check')">Sign out</button></div>
    </div>
  </div>`;
SCREENS.language = () => `
  <div class="scr">
    ${hdr('Language')}
    <div class="listcard">
      <div class="row" onclick="A.S.lang='en';A.persist();A.go('home');A.toast('Switched to English','globe')">
        <div class="row-main"><div class="row-t">English</div><div class="row-d">English (UAE)</div></div>
        ${A.S.lang!=='ar'?`<span class="bigico" style="width:26px;height:26px;min-width:26px;border-radius:50%;background:var(--lime);color:var(--ink)">${ic('check',14)}</span>`:''}</div>
      <div class="row" onclick="A.S.lang='ar';A.persist();A.go('home');A.toast('تم التبديل إلى العربية 🇦🇪','globe')">
        <div class="row-main"><div class="row-t">العربية</div><div class="row-d">${A.S.lang==='ar'?'واجهة عربية كاملة مع اتجاه من اليمين لليسار':'Arabic — full RTL, live in this prototype'}</div></div>
        ${A.S.lang==='ar'?`<span class="bigico" style="width:26px;height:26px;min-width:26px;border-radius:50%;background:var(--lime);color:var(--ink)">${ic('check',14)}</span>`:''}</div>
      ${[['اردو','Urdu'],['हिन्दी','Hindi'],['Русский','Russian'],['Filipino','Tagalog']]
        .map(([tt,d])=>`<div class="row" onclick="A.toast('${esc(tt)} — mocked in prototype','globe')">
        <div class="row-main"><div class="row-t">${tt}</div><div class="row-d">${d}</div></div></div>`).join('')}
    </div>
    <div class="micro mt12" style="text-align:center">${A.S.lang==='ar'?'الأرقام تبقى لاتينية كما هو معتاد في تطبيقات البنوك الإماراتية. الشاشات الرئيسية معرّبة بالكامل؛ والبقية تتبع في النسخة النهائية.':'Arabic flips the whole app to RTL with translated core screens; numbers stay Western per UAE banking convention. Launch languages mirror UAE demographics — 88% expat population.'}</div>
  </div>`;
SCREENS.support = () => `
  <div class="scr">
    ${hdr('Support')}
    <div class="card flex" style="gap:12px">${avx('Noor Care','', '🤝')}<div class="f1"><div class="row-t">Humans, 24/7, in 6 languages</div><div class="row-d">Median first reply: 38 seconds</div></div><span class="tag grn">Online</span></div>
    <div class="listcard mt12">
      ${[['Report fraud or a scam','Instant freeze + case officer','alert'],['A payment looks wrong','Dispute with one tap','card'],['Talk about Shariah compliance','Certified advisors, free','moon'],['Anything else','Chat with us','headset']]
        .map(([t,d,i])=>`<div class="row" onclick="A.toast('Connecting you to a human… (mock)','headset')"><span class="bigico">${ic(i,20)}</span><div class="row-main"><div class="row-t">${t}</div><div class="row-d">${d}</div></div><span class="chev">${ic('chevR',16)}</span></div>`).join('')}
    </div>
  </div>`;
})();
