/* ============ core screens: home · money · accounts · chat ============ */
(function(){
const hideable = v => A.S.hideBal ? '•••••' : v;

/* ---------------- HOME (deck slide 1 / 11) ---------------- */
SCREENS.home = () => `
  <div class="scr" style="padding-bottom:170px">
    <div class="flex between">
      <button class="iconbtn" onclick="A.go('profile')">${ic('user',20)}</button>
      <div class="flex" style="gap:8px">
        <button class="iconbtn" onclick="A.go('search')">${ic('search',20)}</button>
        <button class="iconbtn" onclick="A.go('notifs')">${ic('bell',20)}<span class="bdg">3</span></button>
      </div>
    </div>

    <div class="mt16">
      <div class="h0">${t('Hi, '+USER.first+'.')}</div>
      <div class="h2 mt8" style="font-weight:600;color:var(--tx2);line-height:1.45" onclick="A.go('briefing')">
        ${BR().line.replace(/<b>/g,'<b style="color:var(--tx);font-weight:700">')}
      </div>
      <button class="chip mt12" onclick="A.go('briefing')">${ic('spark',15)} Morning briefing · ${BR().items.length} items</button>
    </div>

    <div class="card mt16 tap" onclick="A.go('money')">
      <div class="flex between">
        <span class="lbl">My money</span>
        <button class="iconbtn" style="width:30px;height:30px;min-width:30px;border:none" onclick="event.stopPropagation();A.S.hideBal=!A.S.hideBal;A.persist();A.refresh()">${ic(A.S.hideBal?'eyeOff':'eye',17)}</button>
      </div>
      <div class="flex between mt8">
        <div style="font:800 32px/1 Inter,sans-serif;letter-spacing:-.03em" class="tnum">${hideable('AED '+fm(LIQUID_TOTAL))}</div>
      </div>
      <div class="flex between mt12">
        <span class="logo-stack">${blg('fab','sm')}${blg('wio','sm')}${blg('ei','sm')}</span>
        ${spark([24.1,24.6,24.2,25.1,25.6,25.2,26.4,27.0,26.8,27.59],110,30)}
      </div>
    </div>

    <div class="grid2 mt12">
      <div class="card tap" onclick="A.go('insights')">
        <span class="lbl">Budget</span>
        <div class="micro mt4">Trends for June</div>
        <div class="mt8" style="display:flex;justify-content:center">
          ${rings([{p:6660/7500,c:'#53DE8E'},{p:5967.95/5100,c:'#FFB050'},{p:1586.6/2400,c:'#5EE6D0'}],88,9,3)}
        </div>
        <div class="flex mt8" style="justify-content:center;gap:6px">
          <span class="tag red" style="font-size:9.5px">● Over budget</span>
          <span class="micro">Lifestyle 117%</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:11px">
        <div class="card tap f1" onclick="A.go('upcoming')">
          <span class="lbl">Payments</span>
          <div class="row-t mt8" style="white-space:normal;font-size:13.5px"><b class="tnum">AED 29</b> will be debited tomorrow</div>
          <div class="flex mt8">${catIc('entertainment',30)}${catIc('bills',30)}${catIc('card',30)}</div>
        </div>
        <div class="card tap f1" onclick="A.go('pay')">
          <span class="lbl">Transfers</span>
          <div class="row-t mt8 tnum" style="font-size:13.5px">${hideable('AED 567,08')} today</div>
          <div class="flex mt8" style="gap:4px">${avx('Sara AlBlooshi','sm')}${avx('Ahmed Hassan','sm')}<span class="avx sm" style="background:var(--glass2)">${ic('plus',15)}</span></div>
        </div>
      </div>
    </div>

    <div class="lbl mt20 mb8">For you</div>
    <div class="hscroll">
      <div class="card lime tap" style="min-width:218px" onclick="A.go('chat-card')">
        <span class="tag" style="background:rgba(11,20,16,.14);color:#0B1410">⚡ Pre-approved</span>
        <div class="h3 mt8">FAB card · AED 20 000 limit</div>
        <div class="micro mt4">3.99% · 55 days grace · 1-click</div>
      </div>
      <div class="card tap" style="min-width:215px" onclick="A.go('approvals')">
        <span class="tag solid">🔔 3 to approve</span>
        <div class="h3 mt8">Agent approvals</div>
        <div class="micro mt4">Review today’s actions · approve all</div>
      </div>
      <div class="card tap" style="min-width:215px" onclick="A.go('agents')">
        <span class="tag lime">🤖 Agents</span>
        <div class="h3 mt8">They earned AED 1 643</div>
        <div class="micro mt4">Groceries · Careem · promo codes · yield</div>
      </div>
      <div class="card tap" style="min-width:190px" onclick="Story.open()">
        <span class="tag lime">✦ New</span>
        <div class="h3 mt8">June Money Story</div>
        <div class="micro mt4">Your month in 30 seconds</div>
      </div>
      <div class="card tap" style="min-width:200px" onclick="A.go('invest-upsell')">
        <span class="tag blu">📈 Upsell moment</span>
        <div class="h3 mt8">Add your investments</div>
        <div class="micro mt4">IBKR · Sarwa · eToro — read-only</div>
      </div>
      <div class="card tap" style="min-width:190px" onclick="A.go('rewards')">
        <span class="tag gold">🎁 2 to scratch</span>
        <div class="h3 mt8">Scratch cards</div>
        <div class="micro mt4">5-day streak reward</div>
      </div>
      <div class="card tap" style="min-width:190px" onclick="A.go('score')">
        <span class="tag grn">▲ +7 pts</span>
        <div class="h3 mt8">AECB score 745</div>
        <div class="micro mt4">Very good · updated today</div>
      </div>
      <div class="card tap" style="min-width:210px" onclick="A.go('zakat')">
        <span class="tag gold">🌙 Ramadan tomorrow</span>
        <div class="h3 mt8">Zakat — pay on day 1</div>
        <div class="micro mt4">Nisab checked · scholar-matched · family mode</div>
      </div>
    </div>

    <div class="grid4 mt20">
      ${[['send','Send','pay'],['recv','Request','request'],['qr','Scan','qr'],['swap','Between','between']]
        .map(([i,t,r])=>`<button class="qa" onclick="A.go('${r}')"><span class="qa-ic">${ic(i,23)}</span><span>${t}</span></button>`).join('')}
    </div>

    <div class="flex between mt20 mb8"><span class="lbl">Upcoming</span><button class="chip" onclick="A.go('upcoming')">All</button></div>
    <div class="listcard">
      ${UPCOMING.slice(0,3).map(u=>`
        <div class="row" onclick="A.go('upcoming')">
          <span class="bigico" style="background:${u.c}1f;color:${u.c}">${ic(u.ic,21)}</span>
          <div class="row-main"><div class="row-t">${u.t}</div><div class="row-d">${u.d} · ${u.acc}</div></div>
          <div class="row-amt tnum ${u.inc?'grn-t':''}">${u.inc?'+':''}${fm(u.amt,2)}</div>
        </div>`).join('')}
    </div>
  </div>`;

/* ---------------- briefing ---------------- */
SCREENS.briefing = () => `
  <div class="scr">
    ${hdr('Morning briefing')}
    <div class="flex" style="gap:8px"><span class="tag lime">✦ Noor AI</span><span class="micro">Generated 07:00 from calendar, inbox receipts & accounts</span></div>
    <div class="h1 mt12">${A.S.lang==='ar'?BR().items.length+' مهام<br>لليوم يا جون':BR().items.length+' things for<br>today, '+USER.first}</div>
    <div class="mt16" style="display:flex;flex-direction:column;gap:11px">
      ${BR().items.map((b,i)=>`
        <div class="card">
          <div class="flex" style="gap:12px;align-items:flex-start">
            <span class="bigico" style="background:${b.c}1f;color:${b.c}">${ic(b.ic,21)}</span>
            <div class="f1"><div class="row-t" style="white-space:normal">${b.t}</div><div class="row-d mt4" style="white-space:normal">${b.d}</div></div>
          </div>
          <div class="btnrow mt12">
            <button class="btn ghost sm" onclick="A.toast('Snoozed to tomorrow 07:00','clock')">Snooze</button>
            <button class="btn pri sm" onclick="${b.act==='gift'?"A.go('gift')":b.act==='paybill'?"A.go('paybill/fab-cc')":b.act==='subs'?"A.go('subs')":"A.toast('Done — marked complete','check')"}">${b.cta}</button>
          </div>
        </div>`).join('')}
    </div>
    <button class="btn ghost mt16" onclick="A.go('chat')">${ic('spark',18)} Ask Noor anything</button>
  </div>`;

/* ---------------- notifications ---------------- */
SCREENS.notifs = () => `
  <div class="scr">
    ${hdr('Notifications',{right:`<button class="chip" onclick="A.toast('All caught up','check');A.back()">Clear</button>`})}
    <div class="listcard">
      ${NOTIFS.map(n=>`
        <div class="row" onclick="${n.act==='story'?'Story.open()':n.act==='chat-card'?"A.go('chat-card')":`A.go('${n.act}')`}">
          <span class="bigico" style="background:${n.c}1f;color:${n.c}">${ic(n.ic,21)}</span>
          <div class="row-main"><div class="row-t" style="white-space:normal">${n.t}</div><div class="row-d" style="white-space:normal">${n.d} · ${n.when}</div></div>
          <span class="chev">${ic('chevR',16)}</span>
        </div>`).join('')}
    </div>
    <div class="micro mt16" style="text-align:center">Smart alerts: balance drops, debits, salary, score, consents — tuned in Settings.</div>
  </div>`;

/* ---------------- search ---------------- */
SCREENS.search = () => `
  <div class="scr">
    ${hdr('Search')}
    <div class="input flex" onclick="A.toast('Search is mocked — try the chips','search')">${ic('search',18)} <span style="color:var(--tx3)">Merchants, people, IBANs, products…</span></div>
    <div class="lbl mt20 mb8">Try</div>
    <div class="chips">
      ${[['Carrefour spend','insights'],['Sara transfers','pay'],['My IBAN','accounts-iban'],['Zakat','zakat'],['PS5','chat-ps5'],['Best card','chat-card']]
        .map(([t,r])=>`<button class="chip" onclick="A.go('${r}')">${t}</button>`).join('')}
    </div>
    <div class="lbl mt20 mb8">Recent</div>
    <div class="listcard">
      ${TXNS.slice(2,6).map(rowTxn).join('')}
    </div>
  </div>`;
SCREENS['accounts-iban'] = () => `
  <div class="scr">
    ${hdr('My IBAN & details')}
    <div class="card">
      <div class="lbl">Noor wallet · AED</div>
      <div class="h3 mt8 tnum">${USER.iban}</div>
      <div class="micro mt4">${USER.first} ${USER.last} · Noor Financial Platform</div>
      <div class="btnrow mt12">
        <button class="btn ghost sm" onclick="A.toast('IBAN copied','check')">${ic('doc',16)} Copy</button>
        <button class="btn pri sm" onclick="A.toast('Shared via WhatsApp (mock)','share')">${ic('share',16)} Share</button>
      </div>
    </div>
    <div class="micro mt12">Salary? Share this IBAN with HR — Noor routes it and runs your salary rules automatically.</div>
  </div>`;

/* ---------------- MONEY — all balances across banks ---------------- */
SCREENS.money = () => {
  const mode = A.tmp.moneyMode || 'cash';
  const extra = b => A.S.linked.includes(b);   /* wallets/BNPL/crypto appear once linked */
  const groups = [
    {bank:'fab', accs:ACCOUNTS.filter(a=>a.bank==='fab')},
    {bank:'wio', accs:ACCOUNTS.filter(a=>a.bank==='wio')},
    {bank:'ei',  accs:ACCOUNTS.filter(a=>a.bank==='ei')},
    {bank:'careem', accs:extra('careem')?ACCOUNTS.filter(a=>a.bank==='careem'):[], label:'Careem Pay · wallet'},
    {bank:'tabby',  accs:extra('tabby')?ACCOUNTS.filter(a=>a.bank==='tabby'):[],   label:'Tabby · pay later'},
    {bank:'binance',accs:extra('binance')?ACCOUNTS.filter(a=>a.bank==='binance'):[],label:'Binance · crypto'},
    {bank:'noor',accs:ACCOUNTS.filter(a=>a.bank==='noor'), label:'Noor wealth'},
    {bank:'dib', accs:ACCOUNTS.filter(a=>a.bank==='dib'), label:'DIB · financing'},
  ];
  const visibleAccs = groups.flatMap(g=>g.accs);
  const assets = visibleAccs.filter(a=>a.bal>0).reduce((s,a)=>s+a.bal,0);
  const liab   = -visibleAccs.filter(a=>a.bal<0).reduce((s,a)=>s+a.bal,0);
  const net = assets - liab;
  const big = mode==='cash' ? LIQUID_TOTAL : net;
  const nSources = 3 + ['careem','tabby','binance'].filter(extra).length;
  return `
  <div class="scr" style="padding-bottom:170px">
    <div class="flex between">
      <div class="h1">Money</div>
      <div class="flex" style="gap:8px">
        <button class="iconbtn" id="syncBtn" onclick="Money.sync()">${ic('refresh',19)}</button>
        <button class="iconbtn" onclick="A.S.hideBal=!A.S.hideBal;A.persist();A.refresh()">${ic(A.S.hideBal?'eyeOff':'eye',19)}</button>
      </div>
    </div>
    <div class="seg mt12" style="max-width:240px">
      <button class="${mode==='cash'?'on':''}" onclick="A.tmp.moneyMode='cash';A.refresh()">Cash</button>
      <button class="${mode==='net'?'on':''}" onclick="A.tmp.moneyMode='net';A.refresh()">Net worth</button>
    </div>
    <div class="mt16">
      <div style="font:800 38px/1 Inter,sans-serif;letter-spacing:-.035em" class="tnum">${hideable('AED '+fm(big))}</div>
      <div class="flex mt8" style="gap:8px">
        <span class="tag grn">▲ 2,4% this month</span>
        <span class="micro">${nSources} banks & sources · ${visibleAccs.length} accounts · synced <b id="syncTime">2 min ago</b></span>
      </div>
    </div>
    ${mode==='net' ? `
    <div class="card mt16">
      <div class="kv"><span class="k">Assets</span><span class="v tnum grn-t">${hideable(aed(assets))}</span></div>
      <div style="display:flex;height:10px;border-radius:6px;overflow:hidden;gap:2px;margin:6px 0">
        <i style="flex:${assets};background:var(--grn)"></i><i style="flex:${liab};background:var(--red)"></i>
      </div>
      <div class="kv"><span class="k">Liabilities</span><span class="v tnum red-t">−${hideable(fm(liab))}</span></div>
      <div class="micro">Cards −10 094,80 · Auto finance −36 200,00${extra('tabby')?' · BNPL plans −1 575,00':''}</div>
    </div>`:''}

    ${groups.map(g=>{
      const visible = g.accs;
      if(!visible.length) return '';
      const sum = visible.reduce((s,a)=>s+a.bal,0);
      return `
      <div class="flex between mt20 mb8">
        <span class="flex" style="gap:8px">${blg(g.bank,'sm')}<span class="h3">${g.label||BANKS[g.bank].name}</span></span>
        <span class="row-amt tnum" style="color:${sum<0?'var(--red)':'var(--tx2)'}">${hideable(aed(sum))}</span>
      </div>
      <div class="listcard">
        ${visible.map(a=>`
          <div class="row" onclick="A.go('account/${a.id}')">
            <span class="bigico">${ic(a.kind==='card'?'card':a.kind==='invest'?'trendUp':a.kind==='gold'?'coins':a.kind==='finance'?'car':a.kind==='bnpl'?'bag':a.kind==='crypto'?'trendUp':'wallet',21)}</span>
            <div class="row-main">
              <div class="row-t">${a.name}${a.mask?' ··'+a.mask:''}</div>
              <div class="row-d">${a.kind==='card'?`Due ${a.due} · min AED ${fm(a.min)}`:a.kind==='finance'?a.left:a.kind==='gold'?'486,32 / g · ▲3,6% this month':a.kind==='invest'?'Sukuk · halal ETFs · ▲1,24% today':a.kind==='bnpl'?`Next: ${a.next} · limit left AED ${fm(a.limit-Math.abs(a.bal),0)}`:a.kind==='crypto'?'BTC 0,061 · ETH 0,80 · ▲2,1% today':a.kind==='wallet'?'Wallet · top up from any bank':'Available balance'}</div>
            </div>
            <div class="row-r">
              <div class="row-amt tnum" style="color:${a.bal<0?'var(--red)':'var(--tx)'}">${hideable(aed(a.bal))}</div>
              ${a.kind==='card'?`<div class="row-sub"><button class="chip" style="padding:4px 10px;font-size:10.5px" onclick="event.stopPropagation();A.go('paybill/${a.id}')">Pay</button></div>`:''}
            </div>
          </div>`).join('')}
      </div>`;
    }).join('')}

    <div class="btnrow mt20">
      <button class="btn ghost" onclick="CN.start()">${ic('plus',18)} Add source</button>
      <button class="btn ghost" onclick="A.go('consents')">${ic('shieldCheck',18)} Consents</button>
    </div>
    <div class="card lime mt12 tap" onclick="A.go('invest-upsell')">
      <div class="flex between"><b style="font-size:14px">📈 Complete the picture — link investments</b>${ic('chevR',18)}</div>
      <div class="micro mt4">IBKR, Sarwa, eToro — read-only, counts into net worth & zakat</div>
    </div>
    <div class="micro mt12" style="text-align:center">Banks, wallets, BNPL and crypto — aggregated read-only via Noor Connect (CBUAE Open Finance).</div>
  </div>`;
};
window.Money = {
  sync(){
    const b=document.getElementById('syncBtn'); if(b){ b.firstElementChild && b.firstElementChild.animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:700,iterations:2}); }
    setTimeout(()=>{ const t=document.getElementById('syncTime'); if(t)t.textContent='just now'; A.toast('All 3 banks refreshed','check'); },1400);
  }
};

/* ---------------- account detail ---------------- */
SCREENS.account = (id) => {
  const a = ACCOUNTS.find(x=>x.id===id) || ACCOUNTS[0];
  const tx = TXNS.filter(t=>t.acc===a.id);
  const isCard = a.kind==='card';
  return `
  <div class="scr">
    ${hdr(BANKS[a.bank].name,{right:`<button class="iconbtn" onclick="A.go('bank/${a.bank}')">${ic('gear',18)}</button>`})}
    <div class="card" style="text-align:center">
      <div class="flex" style="justify-content:center">${blg(a.bank,'sm')}</div>
      <div class="lbl mt8">${a.name}${a.mask?' ··'+a.mask:''}</div>
      <div style="font:800 34px/1.1 Inter,sans-serif;letter-spacing:-.03em;color:${a.bal<0?'var(--red)':'var(--tx)'}" class="tnum mt8">${hideable(aed(a.bal))}</div>
      ${isCard?`<div class="micro mt8">of AED ${fm(a.limit,0)} limit · statement due ${a.due}</div>${meter(Math.abs(a.bal)/a.limit,'#FFB050')}`:''}
      <div class="grid4 mt16">
        ${[['swap','Move','between'],['doc','Statement','statement'],['qr','Details','accounts-iban'],[isCard?'card':'refresh',isCard?'Pay':'Sync', isCard?('paybill/'+a.id):'money']]
          .map(([i,t,r])=>`<button class="qa" onclick="${r==='money'?'Money.sync()':`A.go('${r}')`}"><span class="qa-ic" style="width:46px;height:46px">${ic(i,20)}</span><span>${t}</span></button>`).join('')}
      </div>
    </div>
    ${isCard?`<div class="card lime mt12 tap" onclick="A.go('paybill/${a.id}')">
      <div class="flex between"><b style="font-size:14px">Pay card bill — earn 120 Noor pts</b>${ic('chevR',18)}</div>
      <div class="micro mt4">CRED-style: pay any bank’s card from any account, get rewarded.</div>
    </div>`:''}
    <div class="flex between mt20 mb8"><span class="lbl">Transactions</span>
      <button class="chip" onclick="A.toast('Filters: date, amount, category (mock)','filter')">${ic('filter',14)} Filter</button></div>
    <div class="listcard">${tx.length?tx.map(rowTxn).join(''):'<div class="row static"><div class="row-d">Synced just now — no recent activity.</div></div>'}</div>
  </div>`;
};

/* ---------------- transaction detail ---------------- */
SCREENS.txn = (id) => {
  const t = TXNS.find(x=>x.id===id) || TXNS[0];
  const a = ACCOUNTS.find(x=>x.id===t.acc);
  const c = CATS[t.cat];
  return `
  <div class="scr">
    ${hdr('Transaction')}
    <div class="card" style="text-align:center">
      ${catIc(t.cat,56)}
      <div class="h2 mt12">${t.m}</div>
      <div style="font:800 32px Inter,sans-serif;letter-spacing:-.03em" class="tnum mt8 ${t.amt>0?'grn-t':''}">${aedS(t.amt)}</div>
      <div class="micro mt4">${t.d} · ${a?BANKS[a.bank].name+' ··'+a.mask:''} · Completed ✓</div>
    </div>
    <div class="lbl mt16 mb8">Category</div>
    <div class="chips">${Object.keys(CATS).slice(0,8).map(k=>`<button class="chip ${k===t.cat?'on':''}" onclick="A.toast('Recategorised — Noor learns this merchant','check')">${CATS[k].n}</button>`).join('')}</div>
    <div class="listcard mt16">
      <div class="row" onclick="A.go('split-bill')">${catIc('transfer',38)}<div class="row-main"><div class="row-t">Split with friends</div></div><span class="chev">${ic('chevR',16)}</span></div>
      <div class="row" onclick="A.toast('Receipt scanned & attached (mock)','doc')">${catIc('other',38)}<div class="row-main"><div class="row-t">Attach receipt</div></div><span class="chev">${ic('chevR',16)}</span></div>
      <div class="row" onclick="A.go('dispute')">${catIc('health',38)}<div class="row-main"><div class="row-t">Report a problem</div><div class="row-d">Dispute, fraud, wrong amount</div></div><span class="chev">${ic('chevR',16)}</span></div>
    </div>
    <div class="card soft mt12 flex between">
      <div><div class="row-t" style="font-size:13.5px">Exclude from analytics</div><div class="row-d">Won’t count in budgets</div></div>
      <button class="switch" onclick="this.classList.toggle('on')"></button>
    </div>
    ${t.m.includes('Carrefour')?`<div class="micro mt12" style="text-align:center">You’ve spent AED 1 240,30 at Carrefour this month (9 visits).</div>`:''}
  </div>`;
};

/* ---------------- bank connection mgmt ---------------- */
SCREENS.bank = (id) => {
  const B = BANKS[id];
  const cs = CONSENTS.find(c=>c.bank===id);
  return `
  <div class="scr">
    ${hdr(B.name)}
    <div class="card flex" style="gap:14px">${blg(id)}<div class="f1"><div class="h3">${B.full}</div><div class="micro mt4">Connected via Noor Connect · ${cs?cs.freq:'4× / day'} refresh</div></div><span class="tag grn">Live</span></div>
    <div class="listcard mt12">
      <div class="row" onclick="Money.sync()"><span class="bigico">${ic('refresh',20)}</span><div class="row-main"><div class="row-t">Sync now</div><div class="row-d">Last: 2 minutes ago</div></div></div>
      <div class="row" onclick="A.go('consent/${id}')"><span class="bigico">${ic('shieldCheck',20)}</span><div class="row-main"><div class="row-t">Consent & data sharing</div><div class="row-d">${cs?cs.scope:'Accounts · Balances · Transactions'}</div></div><span class="chev">${ic('chevR',16)}</span></div>
      <div class="row" onclick="A.go('connect-login/${id}')"><span class="bigico">${ic('link',20)}</span><div class="row-main"><div class="row-t">Re-link connection</div><div class="row-d">If the bank session expires</div></div><span class="chev">${ic('chevR',16)}</span></div>
    </div>
    <button class="btn danger mt16" onclick="A.confirm('Unlink ${B.name}?','Balances and history stay visible but stop refreshing. You can re-link anytime.',()=>{A.toast('${B.name} unlinked — consent revoked','check');A.go('money')})">Unlink bank</button>
  </div>`;
};

/* ---------------- upcoming ---------------- */
SCREENS.upcoming = () => `
  <div class="scr">
    ${hdr('Upcoming')}
    <div class="card lime">
      <b style="font-size:14px">Forecast: all bills covered ✓</b>
      <div class="micro mt4">AED 2 523,23 leaves before salary day (25th). Buffer stays above AED 8 000.</div>
    </div>
    <div class="listcard mt12">
      ${UPCOMING.map(u=>`
        <div class="row" onclick="A.toast('Reminder set for ${esc(u.d)}','bell')">
          <span class="bigico" style="background:${u.c}1f;color:${u.c}">${ic(u.ic,21)}</span>
          <div class="row-main"><div class="row-t">${u.t}</div><div class="row-d">${u.d} · ${u.acc}</div></div>
          <div class="row-amt tnum ${u.inc?'grn-t':''}">${u.inc?'+':'−'}${fm(u.amt)}</div>
        </div>`).join('')}
    </div>
    <div class="micro mt12" style="text-align:center">Detected automatically from recurring patterns across all linked banks.</div>
  </div>`;

/* ---------------- CHAT ---------------- */
SCREENS.chat = () => `
  <div class="scr ch-scr">
    <div class="apphdr">
      <button class="iconbtn" onclick="A.back()">${ic('back',20)}</button>
      <div style="flex:1;text-align:center">
        <div class="h3 flex" style="justify-content:center;gap:7px"><span style="color:var(--lime)">${ic('spark',18)}</span>Noor AI</div>
        <div class="micro" style="color:var(--grn)">● agent online · acts with your approval</div>
      </div>
      <button class="iconbtn" onclick="Chat.reset();A.refresh()">${ic('edit',18)}</button>
    </div>
    <div class="ch-wrap" id="chWrap"></div>
    <div class="ch-quick">
      ${[['💳 Best card','Help me find a credit card with the best terms'],
         ['🎮 PS 5','I want to buy a PS 5, 2 Tb'],
         ['🏦 Best financing','Get me the best financing with one-click activation'],
         ['📉 My spending','Why did I spend so much in June?'],
         ['☪ Zakat','How much zakat do I owe?'],
         ['✈️ Afford a trip?','Can I afford a AED 6 500 trip in August?']]
        .map(([c,q])=>`<button class="chip" onclick="Chat.send('${esc(q)}')">${c}</button>`).join('')}
    </div>
    <div class="ch-input">
      <input id="chInp" placeholder="Ask your question..." onkeydown="if(event.key==='Enter')Chat.sendInput()">
      <button class="ch-mic" onclick="(document.getElementById('chInp').value||'').trim()?Chat.sendInput():Chat.play('hello')">${ic('mic',20)}</button>
    </div>
  </div>`;
AFTER.chat = () => { Chat.mount(); if(!CHAT.msgs.length) Chat.play('hello'); };

/* chat deep-links ('chat-card' / 'chat-ps5') are intercepted in A.go — see app.js */
})();
