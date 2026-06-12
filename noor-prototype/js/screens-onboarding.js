/* ============ onboarding screens ============ */
window.SCREENS = window.SCREENS || {};
window.AFTER   = window.AFTER   || {};
(function(){
const S = () => A.S;

/* ---------- splash ---------- */
SCREENS.splash = () => `
  <div class="scr center nopad" style="padding:40px">
    <div class="glowblob" style="background:#D7F050;top:-80px;right:-90px;opacity:.25"></div>
    <div style="font:800 64px/1 Inter,sans-serif;letter-spacing:-.03em;color:var(--lime)" class="logo-pop">noor</div>
    <div class="sub mt12">Agentic Islamic Finance Platform</div>
    <div class="spinner lm" style="position:absolute;bottom:90px"></div>
  </div>`;
AFTER.splash = () => setTimeout(()=>A.go('welcome', true), 1400);

/* ---------- welcome carousel ---------- */
const W_SLIDES = [
  {h:'Be in control<br>of <span class="lime-t">your finances</span>', d:'Every bank, wallet, BNPL plan, debt and dirham — one live picture, one number you can trust.',
   art:`<div style="display:flex;flex-direction:column;gap:14px;align-items:center">
        <div class="logo-stack" style="transform:scale(1.6)">${blg('fab')}${blg('wio')}${blg('ei')}${blg('tabby')}</div>
        <div style="margin-top:26px;font:800 44px Inter,sans-serif;letter-spacing:-.03em" class="tnum">AED 275 900<span style="font-size:26px">,76</span></div>
        <span class="tag lime">Live · banks, wallets, BNPL & crypto</span></div>`},
  {h:'100% compliant.<br><span class="lime-t">Always.</span>', d:'Every product is tracked by AI and confirmed by leading scholars — you will never violate Shariah without knowing. No interest, anywhere, ever.',
   art:`<div style="width:200px;height:200px;border-radius:60px;background:rgba(255,255,255,.06);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--lime)">${ic('shieldCheck',92,'',1.2)}</div>`},
  {h:'The most accurate<br><span class="lime-t">Zakat, ever.</span>', d:'Every asset and every debt — even trade stock and payroll — calculated to the dirham, by your scholar’s method. This is our craft.',
   art:`<div style="width:200px;height:200px;border-radius:60px;background:radial-gradient(circle at 30% 25%,rgba(232,194,104,.35),rgba(232,194,104,.08));border:1px solid rgba(232,194,104,.35);display:flex;align-items:center;justify-content:center;color:var(--gold)">${ic('moon',88,'',1.2)}</div>`},
  {h:'Support your<br><span class="lime-t">local community</span>', d:'Your savings back the best Shariah-compliant local businesses — and the strictness dial is yours: stay 100% strict, or add local UAE & Saudi champions with purification handled.',
   art:`<div style="width:200px;height:200px;border-radius:60px;background:radial-gradient(circle at 30% 25%,#EDFA9B,#D7F050 55%,#9DBE17);display:flex;align-items:center;justify-content:center;color:#0B1410;box-shadow:0 30px 80px rgba(215,240,80,.35)">${ic('heart',86,'',1.4)}</div>`},
];
SCREENS.welcome = () => {
  const i = A.tmp.slide||0;
  const s = (A.S.lang==='ar' && window.AR_WELCOME) ? {...W_SLIDES[i], ...AR_WELCOME[i]} : W_SLIDES[i];
  return `
  <div class="scr nopad" style="display:flex;flex-direction:column;padding:70px 26px 46px">
    <div class="flex between"><span style="font:800 26px Inter,sans-serif;color:var(--lime)">noor</span>
      <button class="chip" onclick="A.demoSkip()">Skip demo →</button></div>
    <div class="f1" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:30px">
      ${s.art}
      <div><div class="h0">${s.h}</div><div class="sub mt12" style="max-width:300px">${s.d}</div></div>
    </div>
    <div class="dots mb12">${W_SLIDES.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
    ${i < W_SLIDES.length-1
      ? `<button class="btn lime mt12" onclick="A.tmp.slide=${i+1};A.refresh()">Continue</button>`
      : `<button class="btn lime mt12" onclick="A.tmp.slide=0;A.go('ob-phone')">Get started</button>`}
    <button class="btn ghost mt8" onclick="A.demoSkip()">I already have an account</button>
  </div>`;
};

/* ---------- phone ---------- */
SCREENS['ob-phone'] = () => `
  <div class="scr">
    ${hdr('Step 1 of 6')}
    <div class="h1">What’s your<br>mobile number?</div>
    <div class="sub mt8">UAE Pass and Emirates ID verification follow — full onboarding takes about 3 minutes.</div>
    <div class="flex mt20" style="gap:9px">
      <div class="input" style="width:96px;display:flex;align-items:center;justify-content:center;gap:6px">🇦🇪 +971</div>
      <input id="obPhone" class="input tnum f1" placeholder="50 000 0000" readonly onclick="OB.fillPhone()" value="${A.tmp.phone||''}">
    </div>
    <div class="micro mt8">${ic('lock',12)} Your number is verified against telecom records (mock).</div>
    <button class="btn lime mt20" id="obPhoneBtn" ${A.tmp.phone?'':'disabled'} onclick="A.go('ob-otp')">Send code</button>
    <div class="card soft mt20 flex" style="gap:12px">${ic('info',20,'lime-t')}<div class="micro">Prototype tip: tap the field — it types for you. Every input in this demo self-fills.</div></div>
  </div>`;
window.OB = {
  fillPhone(){
    const el = document.getElementById('obPhone'); if(!el || A.tmp.phoneTyping) return;
    A.tmp.phoneTyping = true;
    const num = '50 482 7791'; let k = 0;
    const t = setInterval(()=>{ el.value = num.slice(0,++k);
      if(k>=num.length){ clearInterval(t); A.tmp.phone=num; A.tmp.phoneTyping=false; document.getElementById('obPhoneBtn').disabled=false; }
    }, 55);
  },
  otpFill(targetRoute){
    if (A.tmp.otpBusy) return; A.tmp.otpBusy = true;
    const code='482917'; let k=0;
    const t=setInterval(()=>{
      const box=document.getElementById('ob'+k); if(box){box.textContent=code[k]; box.classList.add('focus');}
      if(++k>=6){ clearInterval(t); A.tmp.otpBusy=false;
        setTimeout(()=>A.go(targetRoute), 450); }
    },120);
    const af=document.getElementById('otpAuto'); if(af) af.style.display='none';
  },
};
SCREENS['ob-otp'] = () => `
  <div class="scr">
    ${hdr('Step 1 of 6')}
    <div class="h1">Enter the code</div>
    <div class="sub mt8">Sent by SMS to <b style="color:var(--tx)">+971 ${A.tmp.phone||'50 482 7791'}</b></div>
    <div class="otp-wrap mt28">${[0,1,2,3].map(i=>`<div class="otp-box" id="ob${i}"></div>`).join('')}<span class="otp-dash">–</span>${[4,5].map(i=>`<div class="otp-box" id="ob${i}"></div>`).join('')}</div>
    <div class="micro mt12" style="text-align:center">Didn’t receive it? Resend in 24 s</div>
    <div style="position:absolute;bottom:120px;left:0;right:0;display:flex;justify-content:center">
      <div class="autofill" id="otpAuto" onclick="OB.otpFill('ob-eid')">${ic('lock',15)} From Messages: <span class="k">482 917</span> — tap to fill</div>
    </div>
  </div>`;
AFTER['ob-otp'] = () => setTimeout(()=>{ const a=document.getElementById('otpAuto'); if(a) a.classList.add('pop'); }, 600);

/* ---------- Emirates ID ---------- */
SCREENS['ob-eid'] = () => `
  <div class="scr">
    ${hdr('Step 2 of 6')}
    <div class="h1">Verify your identity</div>
    <div class="sub mt8">Scan your Emirates ID — KYC runs against UAE Pass & ICP (mock).</div>
    <div class="card mt20" style="padding:0;overflow:hidden">
      <div id="eidCard" style="height:212px;position:relative;background:linear-gradient(120deg,#2C5E4A,#13382B);display:flex;flex-direction:column;justify-content:space-between;padding:18px">
        <div class="flex between"><span class="lbl" style="color:rgba(255,255,255,.7)">UNITED ARAB EMIRATES</span><span style="font-size:22px">🇦🇪</span></div>
        <div class="flex" style="gap:14px">
          <div style="width:64px;height:78px;border-radius:10px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center">${ic('user',34)}</div>
          <div><div class="h3">${USER.first} ${USER.last}</div><div class="micro tnum" style="margin-top:5px">${USER.eid}</div><div class="micro">Resident · ${USER.emirate}</div></div>
        </div>
        <div id="eidScan" style="position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,var(--lime),transparent);top:10%;display:none"></div>
      </div>
    </div>
    <div id="eidStatus" class="mt16"></div>
    <button class="btn lime mt16" id="eidBtn" onclick="OB.eidScan()">${ic('cam',18)} Scan Emirates ID</button>
  </div>`;
OB.eidScan = () => {
  const scan=document.getElementById('eidScan'), st=document.getElementById('eidStatus'), btn=document.getElementById('eidBtn');
  if(!scan||A.tmp.eidBusy) return; A.tmp.eidBusy=true;
  btn.disabled=true; scan.style.display='block';
  scan.animate([{top:'6%'},{top:'92%'},{top:'6%'}],{duration:1600,iterations:1});
  const steps=['Reading chip…','Matching ICP records…','Sanctions & PEP screening…','✓ Identity verified'];
  let i=0;
  const t=setInterval(()=>{
    st.innerHTML=`<div class="flex" style="gap:10px">${i<3?'<div class="spinner lm" style="width:16px;height:16px;border-width:2px"></div>':ic('check',18,'lime-t')}<span class="sub" style="color:${i<3?'var(--tx2)':'var(--lime)'}">${steps[i]}</span></div>`;
    if(++i>=steps.length){ clearInterval(t); A.tmp.eidBusy=false; setTimeout(()=>A.go('ob-face'),650); }
  },620);
};

/* ---------- selfie ---------- */
SCREENS['ob-face'] = () => `
  <div class="scr center">
    ${hdr('Step 3 of 6')}
    <div class="h1">Quick selfie check</div>
    <div class="sub mt8" style="max-width:280px">Liveness + face match against your Emirates ID. One look — no documents.</div>
    <div class="mt28" style="position:relative;width:210px;height:210px">
      <svg width="210" height="210" style="position:absolute;inset:0;transform:rotate(-90deg)">
        <circle cx="105" cy="105" r="98" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="5"/>
        <circle id="faceRing" cx="105" cy="105" r="98" fill="none" stroke="var(--lime)" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 616"/>
      </svg>
      <div style="position:absolute;inset:14px;border-radius:50%;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:74px" id="faceEmoji">🙂</div>
    </div>
    <div class="sub mt16" id="faceMsg">Tap to start</div>
    <button class="btn lime mt16" style="max-width:280px" id="faceBtn" onclick="OB.face()">Start scan</button>
  </div>`;
OB.face = () => {
  if(A.tmp.faceBusy) return; A.tmp.faceBusy=true;
  const ring=document.getElementById('faceRing'), msg=document.getElementById('faceMsg'), em=document.getElementById('faceEmoji');
  document.getElementById('faceBtn').disabled=true;
  const msgs=['Hold still…','Turn slightly left…','Blink…','✓ Matched to Emirates ID'];
  let p=0,i=0;
  const t=setInterval(()=>{
    p+=25; ring.setAttribute('stroke-dasharray', `${616*p/100} 616`);
    msg.textContent=msgs[i]; if(i===3){em.textContent='😄';}
    if(++i>=4){clearInterval(t); A.tmp.faceBusy=false; setTimeout(()=>A.go('ob-pin'),700);}
  },800);
};

/* ---------- passcode ---------- */
SCREENS['ob-pin'] = () => `
  <div class="scr">
    ${hdr('Step 4 of 6')}
    <div class="h1">${A.tmp.pin1?'Confirm your passcode':'Create a passcode'}</div>
    <div class="sub mt8">6 digits — your key to Noor on this device.</div>
    <div class="pin-dots" id="pinDots">${'<i></i>'.repeat(6)}</div>
    <div class="keypad">
      ${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="OB.pin(${n})">${n}</button>`).join('')}
      <button class="ghosted"></button><button onclick="OB.pin(0)">0</button><button class="ghosted" onclick="OB.pinDel()">⌫</button>
    </div>`;
OB.pinBuf='';
OB.pin = n => {
  if(OB.pinBuf.length>=6) return;
  OB.pinBuf+=n;
  [...document.getElementById('pinDots').children].forEach((d,i)=>d.classList.toggle('on', i<OB.pinBuf.length));
  if(OB.pinBuf.length===6){
    setTimeout(()=>{
      if(!A.tmp.pin1){ A.tmp.pin1=OB.pinBuf; OB.pinBuf=''; A.refresh(); }
      else { OB.pinBuf=''; A.go('ob-bio'); }
    },250);
  }
};
OB.pinDel = () => { OB.pinBuf=OB.pinBuf.slice(0,-1);
  [...document.getElementById('pinDots').children].forEach((d,i)=>d.classList.toggle('on', i<OB.pinBuf.length)); };

/* ---------- Face ID ---------- */
SCREENS['ob-bio'] = () => `
  <div class="scr center">
    ${hdr('Step 5 of 6')}
    <div style="color:var(--lime)">${ic('faceid',96,'',1.2)}</div>
    <div class="h1 mt20">Sign in with Face ID</div>
    <div class="sub mt8" style="max-width:280px">Skip the passcode — approve payments and log in with a glance.</div>
    <div style="position:absolute;bottom:60px;left:26px;right:26px">
      <button class="btn lime" onclick="A.toast('Face ID enabled','check');A.go('ob-notif')">Enable Face ID</button>
      <button class="btn ghost mt8" onclick="A.go('ob-notif')">Maybe later</button>
    </div>
  </div>`;

/* ---------- notifications ---------- */
SCREENS['ob-notif'] = () => `
  <div class="scr center">
    ${hdr('Step 6 of 6')}
    <div style="color:var(--lime)">${ic('bell',86,'',1.2)}</div>
    <div class="h1 mt20">Stay one step ahead</div>
    <div class="sub mt8" style="max-width:300px">Debits before they happen, salary the second it lands, score changes, smart nudges. No spam — promise.</div>
    <div class="card mt20" style="width:100%;max-width:320px;text-align:left">
      <div class="h3" style="text-align:center">“noor” would like to send you notifications</div>
      <div class="micro mt8" style="text-align:center">Alerts may include balances, payments and reminders.</div>
      <div class="hr"></div>
      <div class="btnrow">
        <button class="btn ghost sm" style="flex:1" onclick="A.go('ob-quiz')">Don’t allow</button>
        <button class="btn lime sm" style="flex:1" onclick="A.toast('Notifications on','bell');A.go('ob-quiz')">Allow</button>
      </div>
    </div>
  </div>`;

/* ---------- personalisation quiz ---------- */
SCREENS['ob-quiz'] = () => {
  const picked = A.tmp.quiz || (A.tmp.quiz = new Set(['Track all my banks']));
  const opts = ['Track all my banks','Grow savings','Pay zakat properly','Get a credit card','Buy a home','Invest halal','Cut my spending','Send money home'];
  return `
  <div class="scr">
    ${hdr('Almost there')}
    <div class="h1">What brings you<br>to Noor?</div>
    <div class="sub mt8">Pick any — your agent personalises around this.</div>
    <div class="chips mt20">${opts.map(o=>`<button class="chip ${picked.has(o)?'on':''}" onclick="OB.quiz('${esc(o)}')">${o}</button>`).join('')}</div>
    <button class="btn lime mt28" onclick="A.go('connect-intro')">Continue</button>
  </div>`;
};
OB.quiz = o => { const q=A.tmp.quiz; q.has(o)?q.delete(o):q.add(o); A.refresh(); };
})();
