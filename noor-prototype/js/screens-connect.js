/* ============ Noor Connect — Lean-style linking flow (copied from the Apr 2026 recording, enhanced) ============ */
(function(){
window.CN = { bank:null, replica:false, accSel:{} };

const replicaBar = () => CN.replica
  ? `<div style="background:#16191C;color:#fff;border-radius:12px;padding:9px 13px;font:600 11px Inter,sans-serif;display:flex;gap:8px;align-items:center;margin-bottom:14px">
      🎬 1:1 flow replica of the Lean Link recording — <span style="color:var(--lime)">✦ lime = Noor enhancement</span></div>` : '';
const enh = t => `<span class="tag" style="background:rgba(215,240,80,.25);color:#5d6e0d;margin-left:6px">✦ ${t}</span>`;
const pby = () => `<div class="pby">${ic('shieldCheck',14)} powered by <span class="pby-n">noor connect</span> · CBUAE Open Finance</div>`;

/* ---------- intro (deck slide 11, screen 1) ---------- */
SCREENS['connect-intro'] = () => {
  const linked = A.S.linked;
  return `
  <div class="scr">
    <div class="glowblob" style="background:#E8C268;top:-60px;right:-100px;opacity:.22"></div>
    ${hdr('', {right:`<button class="chip" onclick="A.demoSkip()">Skip →</button>`})}
    <div style="color:var(--gold)">${ic('spark',40)}</div>
    <div class="h1 mt12">Connect your accounts to track your entire budget in one place</div>
    <div class="sub mt12">Read-only access over <b style="color:var(--tx)">CBUAE Open Finance</b>. We can’t move money and never see your passwords. Unlink anytime.</div>
    <div class="listcard mt20">
      ${['fab','wio','ei'].map(b=>`
        <div class="row static">
          ${blg(b)}
          <div class="row-main"><div class="row-t">${BANKS[b].name}</div>
            <div class="row-d">${linked.includes(b) ? (b==='fab'?'AED 78 865,05 · Salary ··5689 +1 more':b==='wio'?'AED 62 865,90 · 2 accounts':'AED 37 629,69 · e-Saver ··8841') : 'Not connected'}</div></div>
          <button class="switch lime ${linked.includes(b)?'on':''}" onclick="CN.toggleBank('${b}')"></button>
        </div>`).join('')}
    </div>
    <div class="lbl mt16 mb8">Wallets · BNPL · Crypto <span class="tag lime" style="margin-left:6px">✦ beyond banks</span></div>
    <div class="listcard">
      ${[['careem','Wallet balance & spends'],['tabby','Plans, limits & due dates'],['binance','Read-only API · balances']].map(([b,d])=>`
        <div class="row static">
          ${blg(b)}
          <div class="row-main"><div class="row-t">${BANKS[b].name}</div><div class="row-d">${linked.includes(b)?(b==='careem'?'AED 312,40 · wallet':b==='tabby'?'−AED 1 575,00 · 2 plans':'AED 9 840,00 · BTC, ETH'):d}</div></div>
          <button class="switch lime ${linked.includes(b)?'on':''}" onclick="CN.toggleBank('${b}')"></button>
        </div>`).join('')}
      <div class="row" onclick="CN.start()">
        <span class="bigico">${ic('plus',22)}</span>
        <div class="row-main"><div class="row-t">Add another provider</div><div class="row-d">14 banks · wallets · BNPL · crypto</div></div>
        <span class="chev">${ic('chevR',18)}</span>
      </div>
    </div>
    <div class="micro mt8">Investment accounts? Noor suggests them right after onboarding — no need to do everything now.</div>
    <button class="btn lime mt20" onclick="${linked.length?'CN.finale()':'CN.start()'}">${linked.length?'Continue':'Connect first bank'}</button>
    <button class="btn ghost mt8" onclick="A.sheet(CN.dataSheet())">Learn what data Noor uses</button>
  </div>`;
};
CN.toggleBank = b => { A.S.linked.includes(b) ? null : CN.start(b); };
CN.dataSheet = () => `
  <div class="h2">What Noor reads — and what it can’t</div>
  <div class="mt12">
    ${[['check','Account names, balances','Refreshed up to 4× a day'],
       ['check','12 months of transactions','To power budgets, zakat & offers'],
       ['check','Account holder name','To verify it’s really you'],
       ['x','Your bank password','Exchanged directly with your bank — never visible to Noor'],
       ['x','Moving your money','Payments always need your explicit approval']]
      .map(([i,t,d])=>`<div class="row static"><span class="bigico" style="color:${i==='check'?'var(--grn)':'var(--red)'}">${ic(i,20)}</span>
        <div class="row-main"><div class="row-t">${t}</div><div class="row-d">${d}</div></div></div>`).join('')}
  </div>
  <button class="btn pri mt12" onclick="A.closeSheet()">Got it</button>`;

CN.start = (bank) => { CN.replica=false; A.go(bank ? 'connect-login/'+bank : 'connect-sheet'); };
CN.startReplica = () => { CN.replica=true; A.go('connect-sheet'); };

/* ---------- "Let's connect your account" (Lean sheet) ---------- */
SCREENS['connect-sheet'] = () => `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div class="flex" style="gap:0">
      <span class="blg" style="background:#D7F050;color:#0B1410;z-index:1">n</span>
      <span class="blg" style="background:#fff;color:#16191C;margin-left:-8px;border:1px solid #E5E7EB">${ic('bank',20)}</span>
    </div>
    <div class="h1 mt16" style="font-size:24px">Let’s connect your account</div>
    <div class="sub mt8">Noor uses <b>Noor Connect</b> to read data from your bank account so you can see and manage all your money in one place.</div>
    <div class="mt20">
      <div class="row static">${ic('lock',20)}<div class="row-main"><div class="row-t" style="font-size:13.5px">Your data is protected and private.</div>
        <div class="row-d" style="white-space:normal">All the data, including your access details, is encrypted (AES-256).</div></div></div>
      <div class="row static">${ic('shieldCheck',20)}<div class="row-main"><div class="row-t" style="font-size:13.5px">Regulated in the UAE.</div>
        <div class="row-d" style="white-space:normal">Noor Connect is licensed by the Central Bank of the UAE under the Open Finance Regulation, licence OF-200133.</div></div></div>
      <div class="row static">${ic('clock',20)}<div class="row-main"><div class="row-t" style="font-size:13.5px">About 60 seconds. ${enh('time estimate')}</div>
        <div class="row-d" style="white-space:normal">Progress is saved — you can resume anytime.</div></div></div>
    </div>
    <div style="position:absolute;bottom:36px;left:18px;right:18px">
      <button class="btn dark" onclick="A.go('connect-banks')">Get started</button>
      <div class="micro mt8" style="text-align:center">First time connecting your bank? <b style="color:#121517">Learn more</b></div>
      ${pby()}
    </div>
  </div>`;

/* ---------- select your bank / provider (banks · wallets · BNPL · crypto · invest) ---------- */
SCREENS['connect-banks'] = () => {
  const q = (A.tmp.bankQ||'').toLowerCase();
  const cat = A.tmp.cnCat || 'all';
  const linked = A.S.linked;
  const cats = CONNECT_CATS.filter(c => cat==='all' || c.id===cat);
  const section = c => {
    const list = c.list.filter(b => !q || BANKS[b].name.toLowerCase().includes(q) || BANKS[b].full.toLowerCase().includes(q));
    if(!list.length) return '';
    return `<div class="lbl mt20" style="margin-bottom:4px">${c.id==='banks'?'All banks':c.t} ${c.id!=='banks'?enh('beyond banks'):''}</div>
      <div class="listcard">${list.map(b=>CN.bankRow(b)).join('')}</div>`;
  };
  return `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div class="h1" style="font-size:24px">${CN.replica?'Select your bank':'Select your provider'}</div>
    <div class="input lt mt16 flex" style="font-weight:500;color:${q?'#121517':'#9AA3AD'}" onclick="CN.typeSearch()">${ic('search',18)} <span id="bankQ">${A.tmp.bankQ||'Search banks'}</span></div>
    <div class="chips mt12" style="flex-wrap:nowrap;overflow-x:auto">
      ${[['all','All'],...CONNECT_CATS.map(c=>[c.id,c.t])].map(([id,t])=>`<button class="chip ${cat===id?'on':''}" onclick="A.tmp.cnCat='${id}';A.refresh()">${t}</button>`).join('')}
    </div>
    ${!q && cat==='all' ? `<div class="lbl mt20" style="margin-bottom:4px">Suggested for you ${enh('detected from salary & SIM')}</div>
    <div class="listcard">
      ${['fab','wio','ei','careem','tabby'].filter(b=>!linked.includes(b)).map(b=>CN.bankRow(b,'Detected on this phone')).join('') || '<div class="row static"><div class="row-d">All suggested providers connected ✓</div></div>'}
    </div>`:''}
    ${cats.map(section).join('')}
    <div style="height:18px"></div>
    ${pby()}
  </div>`;
};
CN.bankRow = (b, note) => `
  <div class="row" onclick="A.go('connect-login/${b}')">
    ${blg(b)}
    <div class="row-main"><div class="row-t">${BANKS[b].name} ${A.S.linked.includes(b)?'<span class="tag grn" style="margin-left:6px">Linked</span>':''}</div>
    <div class="row-d">${note||BANKS[b].full}</div></div>
    <span class="chev">${ic('chevR',18)}</span>
  </div>`;
CN.typeSearch = () => {
  if (A.tmp.bankTyping) return; A.tmp.bankTyping = true;
  const word='Wio'; let k=0;
  const t=setInterval(()=>{
    A.tmp.bankQ = word.slice(0,++k);
    const el=document.getElementById('bankQ'); if(el){el.textContent=A.tmp.bankQ; el.parentElement.style.color='#121517';}
    if(k>=word.length){ clearInterval(t); A.tmp.bankTyping=false; A.refresh(); }
  },160);
};

/* ---------- bank login ---------- */
SCREENS['connect-login'] = (bank) => {
  CN.bank = bank; const B = BANKS[bank];
  return `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div class="flex" style="gap:0">
      <span class="blg" style="background:#D7F050;color:#0B1410;z-index:1">n</span>
      <span style="margin-left:-8px">${blg(bank)}</span>
    </div>
    <div class="h1 mt16" style="font-size:24px">Connect your ${B.name} account</div>
    <div class="sub mt8">Enter your ${B.name} username to authorise Noor Connect to make this connection.</div>
    <div class="input lt mt20 flex tnum" id="cnUser" style="font-weight:500;color:#9AA3AD" onclick="CN.typeUser()">${ic('user',18)} <span id="cnUserTx">Email</span></div>
    <div id="cnErr"></div>
    <div class="flex mt12" style="gap:7px;justify-content:center">${ic('shieldCheck',15)} <span class="micro" style="color:#0F9D58;font-weight:600">Secure connection provided by Noor Connect.</span></div>
    <button class="btn dark mt12" onclick="CN.login()">${ic('lock',17)} Connect account</button>
    <button class="btn ltghost mt8" onclick="A.toast('A human joins in ~40 s in the real app','headset')">${ic('info',17)} Help me sign in</button>
    <div class="micro mt16" style="text-align:center;line-height:1.6">Noor Connect is regulated by the Central Bank of the UAE. Your credentials are exchanged <b>directly with ${B.name}</b> and are never visible to or stored by Noor ${enh('vs. credential sharing')}. By continuing, you agree to the Privacy Notice and End User Agreement.</div>
    ${pby()}
  </div>`;
};
CN.typeUser = () => {
  if(A.tmp.userTyping) return; A.tmp.userTyping=true;
  const v='john.reeves@gmail.com'; let k=0;
  const host=document.getElementById('cnUser'), tx=document.getElementById('cnUserTx');
  host.style.color='#121517';
  const t=setInterval(()=>{ tx.textContent=v.slice(0,++k);
    if(k>=v.length){ clearInterval(t); A.tmp.userTyping=false; A.tmp.cnUser=v; } },42);
};
CN.login = () => {
  if(!A.tmp.cnUser){
    document.getElementById('cnErr').innerHTML='<div class="in-err">Please enter a username</div>';
    document.getElementById('cnUser').classList.add('err');
    setTimeout(()=>document.getElementById('cnUser') && document.getElementById('cnUser').classList.remove('err'),400);
    return;
  }
  A.tmp.cnUser=null; A.go('connect-otp/'+CN.bank);
};

/* ---------- authorize / OTP (from the recording: "From Messages 605658") ---------- */
SCREENS['connect-otp'] = (bank) => {
  const B=BANKS[bank];
  return `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div class="flex" style="gap:0"><span class="blg" style="background:#D7F050;color:#0B1410;z-index:1">n</span><span style="margin-left:-8px">${blg(bank)}</span></div>
    <div class="h1 mt16" style="font-size:24px">Authorize this connection</div>
    <div class="sub mt8">Enter the 6-digit code sent via SMS or email by ${B.name}.</div>
    <div class="otp-wrap mt28">${[0,1,2].map(i=>`<div class="otp-box lt" id="cn${i}"></div>`).join('')}<span class="otp-dash" style="color:#9AA3AD">–</span>${[3,4,5].map(i=>`<div class="otp-box lt" id="cn${i}"></div>`).join('')}</div>
    <div class="micro mt10" style="text-align:center">Make sure the code isn’t expiring soon.</div>
    <button class="btn dark mt20" disabled id="cnAuthBtn">Authorize</button>
    <div class="micro mt10" style="text-align:center">Didn’t receive the OTP? <b id="cnResend">Resend in 10 s</b></div>
    <div style="position:absolute;bottom:46px;left:0;right:0;display:flex;justify-content:center">
      <div class="autofill" onclick="CN.otpFill('${bank}')" id="cnAuto">${ic('lock',15)} From Messages: <span class="k">605 658</span> — tap to fill ${CN.replica?'':''}</div>
    </div>
  </div>`;
};
AFTER['connect-otp'] = () => { let s=10; const t=setInterval(()=>{ const el=document.getElementById('cnResend'); if(!el){clearInterval(t);return;}
  el.textContent = --s>0 ? `Resend in ${s} s` : 'Resend code'; if(s<=0) clearInterval(t); },1000); };
CN.otpFill = (bank) => {
  if(A.tmp.cnOtpBusy) return; A.tmp.cnOtpBusy=true;
  const code='605658'; let k=0;
  const auto=document.getElementById('cnAuto'); if(auto) auto.style.display='none';
  const t=setInterval(()=>{
    const box=document.getElementById('cn'+k); if(box){box.textContent=code[k]; box.classList.add('focus');}
    if(++k>=6){ clearInterval(t); A.tmp.cnOtpBusy=false;
      const btn=document.getElementById('cnAuthBtn'); if(btn){btn.disabled=false; btn.innerHTML='<div class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.25)"></div>';}
      setTimeout(()=> A.go(bank==='wio' ? 'connect-2fa' : 'connect-progress/'+bank), 800);
    }
  },110);
};

/* ---------- Wio two-step (replica of the recording) ---------- */
SCREENS['connect-2fa'] = () => `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div style="text-align:center;margin-top:8px">
      <svg width="150" height="92" viewBox="0 0 150 92"><rect x="20" y="14" width="64" height="64" rx="12" transform="rotate(-8 52 46)" fill="#EDEFF2"/><rect x="62" y="8" width="68" height="72" rx="14" transform="rotate(6 96 44)" fill="#fff" stroke="#1B7A4E" stroke-width="2"/><circle cx="96" cy="38" r="14" fill="none" stroke="#1B7A4E" stroke-width="2.4"/><path d="M88 62c5 4 11 4 16 0" stroke="#1B7A4E" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>
    </div>
    <div class="h1 mt8" style="font-size:24px">Two-step verification</div>
    <div class="sub mt8">To protect your account, Wio may ask you to authenticate two times. First to verify it’s you, and once more to authorise data sharing.</div>
    <div class="listcard mt20">
      <div class="row static"><div class="row-main"><div class="row-t">Verify it’s you</div><div class="row-d">One-time code + Face Recognition</div></div><span class="tag gray">Pending</span></div>
      <div class="row static"><div class="row-main"><div class="row-t">Authorise data sharing</div><div class="row-d">One-time code + Face Recognition</div></div><span class="tag gray">Pending</span></div>
    </div>
    <div style="position:absolute;bottom:36px;left:18px;right:18px">
      <button class="btn dark" onclick="A.go('connect-facepass')">Continue</button>${pby()}
    </div>
  </div>`;

/* ---------- Wio FacePass → camera fail → ENHANCED fallback ---------- */
SCREENS['connect-facepass'] = () => `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div class="h1" style="font-size:24px">Wio FacePass</div>
    <div class="sub mt8">To approve your sign in, Wio needs to verify it’s you. Follow the instructions to authenticate using FacePass.</div>
    <div class="mt20">${ILL.faceOval}</div>
    <div id="fpStatus" class="mt16" style="text-align:center"></div>
    <div style="position:absolute;bottom:36px;left:18px;right:18px">
      <button class="btn ltghost" onclick="A.toast('FacePass tutorial (mock)','info')">How to use FacePass</button>
      <button class="btn dark mt8" id="fpBtn" onclick="CN.facepass()">Continue</button>${pby()}
    </div>
  </div>`;
CN.facepass = () => {
  const st=document.getElementById('fpStatus'), btn=document.getElementById('fpBtn');
  btn.disabled=true;
  st.innerHTML='<div class="flex" style="justify-content:center;gap:9px"><div class="spinner"></div><span class="sub">Requesting camera access…</span></div>';
  setTimeout(()=>{ st.innerHTML='<div class="in-err" style="text-align:center">⚠️ Wio cannot access your camera.<br>In the Lean recording, the flow <b>dead-ends here</b>.</div>';
    setTimeout(()=>A.go('connect-fallback'), 1600); }, 1600);
};
SCREENS['connect-fallback'] = () => `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div class="card" style="background:rgba(215,240,80,.2);border:1px solid #C9E23E;border-radius:18px">
      <div class="flex" style="gap:10px">${ic('spark',22)}<b style="font-size:14px">Noor enhancement — no dead-ends</b></div>
      <div class="micro mt8" style="color:#3D4708">Camera failed, so Noor Connect <b>automatically fell back to SMS verification</b>. The user never sees an error wall — the recording ended on “Wio couldn’t verify your identity”; we recover instead.</div>
    </div>
    <div class="h1 mt20" style="font-size:24px">Verify by SMS instead</div>
    <div class="sub mt8">No camera needed. Code sent to +971 ·· 7791.</div>
    <div class="otp-wrap mt20">${[0,1,2].map(i=>`<div class="otp-box lt" id="cn${i}"></div>`).join('')}<span class="otp-dash" style="color:#9AA3AD">–</span>${[3,4,5].map(i=>`<div class="otp-box lt" id="cn${i}"></div>`).join('')}</div>
    <div style="position:absolute;bottom:46px;left:0;right:0;display:flex;justify-content:center">
      <div class="autofill" onclick="CN.fallbackFill()">${ic('lock',15)} From Messages: <span class="k">311 904</span> — tap to fill</div>
    </div>
  </div>`;
CN.fallbackFill = () => {
  const code='311904'; let k=0;
  const t=setInterval(()=>{ const box=document.getElementById('cn'+k); if(box){box.textContent=code[k]; box.classList.add('focus');}
    if(++k>=6){ clearInterval(t); setTimeout(()=>A.go('connect-progress/wio'),500); } },110);
};

/* ---------- progress (enhanced transparency) ---------- */
SCREENS['connect-progress'] = (bank) => `
  <div class="scr light">
    ${hdr('',{noback:true})}
    ${replicaBar()}
    <div class="flex" style="gap:0"><span class="blg" style="background:#D7F050;color:#0B1410;z-index:1">n</span><span style="margin-left:-8px">${blg(bank)}</span></div>
    <div class="h1 mt16" style="font-size:24px">Connecting to ${BANKS[bank].name}…</div>
    <div class="sub mt8">Usually under 30 seconds. ${enh('live progress vs. a spinner')}</div>
    <div class="psteps mt28" id="cnSteps">
      ${['Establishing secure session','Verifying your identity','Fetching accounts & balances','Importing 12 months of transactions']
        .map((s,i)=>`<div class="pstep" id="ps${i}"><div class="pdot">${i+1}</div><div><div class="ps-t">${s}</div><div class="ps-d" id="psd${i}"></div></div></div>`).join('')}
    </div>
    ${pby()}
  </div>`;
AFTER['connect-progress'] = (bank) => {
  const notes=['TLS 1.3 · mutual auth','Token exchanged with the bank','Found accounts…','This powers your insights'];
  let i=0;
  const step=()=>{
    const el=document.getElementById('ps'+i); if(!el) return;
    el.classList.add('act'); document.getElementById('psd'+i).textContent=notes[i];
    setTimeout(()=>{ el.classList.remove('act'); el.classList.add('done'); el.querySelector('.pdot').innerHTML=ic('check',15);
      if(++i<4) step(); else setTimeout(()=>A.go('connect-accounts/'+bank), 500);
    }, 750 + Math.random()*500);
  };
  step();
};

/* ---------- choose accounts ---------- */
const BANK_ACCTS = {
  fab:[{n:'Salary account',m:'5689',b:78865.05},{n:'e-Saver',m:'2210',b:96540.12},{n:'Cashback Visa',m:'4412',b:-8240.50,card:true}],
  wio:[{n:'Current account',m:'2204',b:17865.90},{n:'Saving spaces',m:'8804',b:45000.00}],
  ei: [{n:'e-Saver',m:'8841',b:37629.69},{n:'Skywards Visa',m:'7733',b:-1854.30,card:true}],
  careem:[{n:'Careem Pay wallet',m:'',b:312.40}],
  tabby:[{n:'Active plans (2)',m:'',b:-1575.00},{n:'Spend limit · available',m:'',b:2925.00}],
  tamara:[{n:'Active plans (1)',m:'',b:-420.00}],
  binance:[{n:'Spot wallet · BTC, ETH',m:'',b:9840.00},{n:'Earn · staking',m:'',b:1120.00}],
  ibkr:[{n:'Brokerage account',m:'7104',b:14400.00}],
  def:[{n:'Current account',m:'1102',b:12480.00},{n:'Savings',m:'7719',b:30150.00}],
};
SCREENS['connect-accounts'] = (bank) => {
  const list = BANK_ACCTS[bank]||BANK_ACCTS.def;
  if(!CN.accSel[bank]) CN.accSel[bank]=list.map((_,i)=>true);
  return `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div class="h1" style="font-size:24px">Choose what to share</div>
    <div class="sub mt8">${BANKS[bank].name} returned ${list.length} accounts. Untick anything you’d rather keep private. ${enh('granular selection')}</div>
    <div class="listcard mt20">
      ${list.map((a,i)=>`
        <div class="row" onclick="CN.accSel['${bank}'][${i}]=!CN.accSel['${bank}'][${i}];A.refresh()">
          ${blg(bank)}
          <div class="row-main"><div class="row-t">${a.n} ··${a.m}</div><div class="row-d tnum">${aed(a.b)}</div></div>
          <span class="bigico" style="width:30px;height:30px;min-width:30px;border-radius:9px;background:${CN.accSel[bank][i]?'#16191C':'#EDEFF2'};color:#fff">${CN.accSel[bank][i]?ic('check',16):''}</span>
        </div>`).join('')}
    </div>
    <button class="btn dark mt20" onclick="A.go('connect-consent/${bank}')">Continue</button>
    ${pby()}
  </div>`;
};

/* ---------- consent summary ---------- */
SCREENS['connect-consent'] = (bank) => `
  <div class="scr light">
    ${hdr('',{right:'<button class="chip" onclick="A.go(\'connect-intro\')">Close</button>'})}
    ${replicaBar()}
    <div class="h1" style="font-size:24px">Review your consent</div>
    <div class="sub mt8">A digital consent receipt is saved to your documents. ${enh('AA-style consent receipt')}</div>
    <div class="card white mt20" style="border:1px solid var(--lt-line)">
      <div class="kv"><span class="k">You allow</span><span class="v">Noor · Noor Connect</span></div>
      <div class="kv"><span class="k">To read</span><span class="v">Accounts · Balances · 12m transactions</span></div>
      <div class="kv"><span class="k">From</span><span class="v">${BANKS[bank].name}</span></div>
      <div class="kv"><span class="k">Refresh</span><span class="v">Up to 4× / day</span></div>
      <div class="kv"><span class="k">Valid until</span><span class="v">11 June 2027 (12 months)</span></div>
      <div class="kv"><span class="k">Revocable</span><span class="v" style="color:#0F9D58">Anytime, in one tap</span></div>
    </div>
    <div class="micro mt12" style="text-align:center">Modelled on the India Account Aggregator consent artefact — purpose-bound, time-bound, auditable.</div>
    <button class="btn dark mt16" onclick="CN.approve('${bank}')">Approve & link</button>
    <button class="btn ltghost mt8" onclick="A.go('connect-intro')">Not now</button>
    ${pby()}
  </div>`;
CN.approve = (bank) => {
  if(!A.S.linked.includes(bank)) A.S.linked.push(bank);
  A.persist(); A.go('connect-success/'+bank);
};

/* ---------- success ---------- */
SCREENS['connect-success'] = (bank) => {
  const totals = {fab:'AED 167 164,67 across 3 accounts', wio:'AED 62 865,90 across 2 accounts', ei:'AED 35 775,39 across 2 accounts',
    careem:'AED 312,40 wallet balance', tabby:'2 plans · AED 787,50 due 11 Jul', tamara:'1 plan · AED 420,00 outstanding',
    binance:'AED 10 960,00 across spot & earn', ibkr:'AED 14 400,00 brokerage'};
  const remaining = ['fab','wio','ei','careem','tabby','binance'].filter(b=>!A.S.linked.includes(b));
  return `
  <div class="scr light" style="text-align:center">
    <div style="height:36px"></div>
    <div class="checkpop">${ic('check',46,'',2.4)}</div>
    <div class="h1 mt20" style="font-size:26px">${BANKS[bank].name} linked</div>
    <div class="sub mt8 tnum">${totals[bank]||'Accounts imported'} · synced just now</div>
    <div class="card mt20" style="background:#fff;border:1px solid var(--lt-line);text-align:left">
      <div class="lbl">Noor already found ${enh('instant value')}</div>
      <div class="row static">${catIc('income',38)}<div class="row-main"><div class="row-t" style="font-size:13.5px">Your salary — AED 32 500 on the 25th</div></div></div>
      <div class="row static">${catIc('entertainment',38)}<div class="row-main"><div class="row-t" style="font-size:13.5px">8 subscriptions ≈ AED 972/mo</div></div></div>
      <div class="row static">${catIc('bills',38)}<div class="row-main"><div class="row-t" style="font-size:13.5px">2 wasteful fees you can dispute</div></div></div>
    </div>
    ${remaining.length
      ? `<button class="btn dark mt20" onclick="A.go('connect-login/${remaining[0]}')">Link ${BANKS[remaining[0]].name} next</button>
         <button class="btn ltghost mt8" onclick="CN.finale()">Done for now</button>`
      : `<button class="btn dark mt20" onclick="CN.finale()">See all my money</button>`}
  </div>`;
};
AFTER['connect-success'] = () => confetti(document.getElementById('screen'));

/* ---------- finale ---------- */
CN.finale = () => { A.S.onboarded = true; A.persist(); A.go('connect-finale'); };
SCREENS['connect-finale'] = () => `
  <div class="scr center">
    <div class="glowblob" style="background:#D7F050;top:-70px;left:-80px;opacity:.2"></div>
    <span class="tag lime">${A.S.linked.length} sources connected — banks · wallet · BNPL · crypto</span>
    <div class="h1 mt16">One number,<br>${USER.first}.</div>
    <div class="mt16" style="font:800 46px/1 Inter,sans-serif;letter-spacing:-.03em" class="tnum">AED <span id="finTotal">0</span></div>
    <div class="sub mt8">Everything you own, live — banks, Careem Pay, Tabby plans and crypto in one place.</div>
    <div style="position:absolute;bottom:60px;left:26px;right:26px">
      <button class="btn lime" onclick="A.go('home')">Open my dashboard</button>
      <button class="btn ghost mt8" onclick="A.go('invest-upsell')">${ic('trendUp',18)} Also track my investments</button>
    </div>
  </div>`;
AFTER['connect-finale'] = () => { const el=document.getElementById('finTotal'); if(el) countUp(el, LIQUID_TOTAL); };
})();
