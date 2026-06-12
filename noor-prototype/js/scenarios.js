/* ============ 100+ key scenarios (deep links into the prototype) ============ */
/* prep: 'app' = onboarded with 3 banks linked (default) · 'fresh' = nothing linked yet */
(function(){
const S = (t, d, run, prep) => ({t, d, run, prep});

window.SCN_GROUPS = [

{g:'First run & onboarding', items:[
  S('Splash & brand reveal','Noor wordmark on deep emerald, auto-advances','splash','fresh'),
  S('Welcome story','3-slide value prop: 1-click products · all banks · Shariah-first','welcome','fresh'),
  S('Sign up with phone','UAE number — tap the field, it types itself','ob-phone','fresh'),
  S('SMS code autofill','iOS-style “From Messages” chip fills the OTP','ob-otp','fresh'),
  S('Emirates ID scan','Chip read → ICP match → sanctions screen, animated','ob-eid','fresh'),
  S('Selfie liveness check','Face match against the ID with progress ring','ob-face','fresh'),
  S('Create a passcode','6-digit keypad, then confirm','ob-pin','fresh'),
  S('Enable Face ID','Biometric opt-in moment','ob-bio','fresh'),
  S('Notifications opt-in','Honest pitch + native-style dialog','ob-notif','fresh'),
  S('Personalisation quiz','Goals multi-select that tunes the agent','ob-quiz','fresh'),
]},

{g:'Connect banks — Lean flow, enhanced', items:[
  S('Connect intro (deck slide 11)','“Track your entire budget in one place” + bank toggles','connect-intro','fresh'),
  S('“Let’s connect your account”','The Lean-style trust sheet, Noor Connect branded',()=>{CN.replica=false;A.go('connect-sheet');},'fresh'),
  S('Select your bank','Search types “Wio” by itself — like the recording','connect-banks','fresh'),
  S('Suggested banks ✦','Noor pre-detects FAB/Wio/EI from salary & SIM','connect-banks','fresh'),
  S('Bank login — FAB','Credentials exchanged with the bank, never stored','connect-login/fab','fresh'),
  S('Validation error state','Tap “Connect account” with an empty field (replica detail)','connect-login/wio','fresh'),
  S('Authorize — OTP autofill','“From Messages: 605 658” — lifted from the recording','connect-otp/fab','fresh'),
  S('Wio two-step (replica)','“Verify it’s you / authorise sharing” step list','connect-2fa','fresh'),
  S('Wio FacePass (replica)','Camera permission fails — where the recording dead-ends','connect-facepass','fresh'),
  S('✦ No-dead-end fallback','Noor auto-switches to SMS — the key enhancement','connect-fallback','fresh'),
  S('Live linking progress ✦','4 transparent steps instead of a spinner','connect-progress/fab','fresh'),
  S('Choose what to share ✦','Granular account selection with balances','connect-accounts/fab','fresh'),
  S('Consent receipt ✦','AA-style: purpose-, time-bound, revocable artefact','connect-consent/fab','fresh'),
  S('Bank linked + instant value ✦','Confetti + salary & subscriptions found immediately','connect-success/fab','fresh'),
  S('🎬 Full Lean replica run','Every screen flagged: replica vs lime enhancements',()=>CN.startReplica(),'fresh'),
  S('Aggregation finale','“One number, John” — total counts up live','connect-finale'),
]},

{g:'Home & daily agent', items:[
  S('Home dashboard (deck slide 1)','“Hi, John” + briefing line + My money AED 275 900,76','home'),
  S('Agentic morning briefing','Trip docs · doctor tomorrow · Netflix debit · card due','briefing'),
  S('Hide balances everywhere','Privacy eye masks every amount',()=>{A.S.hideBal=true;A.persist();A.go('home');A.toast('Balances hidden — tap the eye to reveal','eyeOff');}),
  S('Notification centre','Story · debit alerts · score · consent expiry','notifs'),
  S('“For you” smart feed','Pre-approved card, Money Story, scratch, zakat, score','home'),
  S('Universal search','Merchants, people, IBANs, products','search'),
  S('My IBAN & details','Copy/share salary details in two taps','accounts-iban'),
  S('Upcoming payments radar','Every debit predicted across all banks','upcoming'),
]},

{g:'Money — all banks, one screen', items:[
  S('All balances across banks','FAB + Wio + EI grouped, AED 275 900,76 cash, live','money'),
  S('Net worth view','Assets vs liabilities bar — INDmoney-style',()=>{A.tmp.moneyMode='net';A.go('money');}),
  S('Sync all banks now','Spinning refresh, “synced just now”',()=>{A.go('money');setTimeout(()=>Money.sync(),700);}),
  S('Account detail & history','FAB salary account with full feed','account/fab-sal'),
  S('Savings & spaces','Wio Saving spaces — rule-fed','account/wio-spc'),
  S('Transaction details','Carrefour txn: receipt, category, actions','txn/t05'),
  S('Recategorise a transaction','One tap — Noor learns the merchant','txn/t06'),
  S('Bank connection settings','Sync, consent, re-link, unlink','bank/fab'),
  S('Re-link an expired session','Same Lean-style flow, resumed','connect-login/ei','fresh'),
  S('Unlink a bank safely','Confirmation with consequences explained','bank/wio'),
]},

{g:'Noor AI — agentic scenarios', items:[
  S('Meet Noor AI','Greeting + your day, proactive chips',()=>chatDeep('hello')),
  S('Find the best credit card (deck)','3 pre-approved offers with limits — exact deck moment',()=>chatDeep('findCard')),
  S('Honest offer comparison','“Tell more about each proposal” — real trade-offs',()=>chatDeep('offerDetails')),
  S('Why am I pre-approved?','Transparency: salary 14×, utilisation, AECB 745',()=>chatDeep('whyOffers')),
  S('Buy a PS 5, 2 Tb (deck)','“Ok, I checked, here’s the best offer for you”',()=>chatDeep('ps5')),
  S('Split-in-4 checkout','AED 787,50 × 4 · 0 fees · Murabaha — Tabby-style',()=>{chatDeep('ps5');setTimeout(()=>Pay.buyPS5('Sharaf DG',3150,true),2800);}),
  S('One-click financing (deck killer)','Pre-approved AED 120 000 Murabaha in chat',()=>chatDeep('loan')),
  S('Spending forensics','“Why did I spend so much?” — named culprits',()=>chatDeep('spend')),
  S('Subscription cleanup by agent','Keeps Anghami (31 h ▲), cancels Spotify+Apple Music, fixes the du tariff',()=>chatDeep('subs')),
  S('Zakat in chat','Live calculation from all linked wealth',()=>chatDeep('zakat')),
  S('“Can I afford this trip?”','Cashflow simulation with a verdict',()=>chatDeep('afford')),
  S('Salary radar','Lands on the 25th — rules fire automatically',()=>chatDeep('salary')),
  S('FX advice','AED→INR at a 30-day high, send in minutes',()=>chatDeep('fx')),
  S('Personal savings plan','3 automations worth AED 1 670/mo',()=>chatDeep('save')),
]},

{g:'Payments & transfers', items:[
  S('Payments hub','Send, request, QR, bills, abroad, split','pay'),
  S('Send via Aani','Pick Sara → keypad → instant, free','send/Sara AlBlooshi'),
  S('Confirm with Face ID','Review sheet with fee = AED 0',()=>{A.go('send/Sara AlBlooshi');A.tmp.payAmt='350';setTimeout(()=>A.refresh(),50);}),
  S('Transfer receipt + confetti','Reference, share receipt, done','pay-success/'+encodeURIComponent('Sara AlBlooshi|350')),
  S('Request money / my QR','Personal Aani QR + payment link','request'),
  S('Scan & pay any QR','Scanner finds Caffe Nero — AED 24,50','qr'),
  S('Between my accounts','Wio → FAB cross-bank in one tap','between'),
  S('Split a bill','IKEA AED 1 244,75 across friends','split-bill'),
  S('Bills & autopay','DEWA, Etisalat, du, Salik — auto-detected','bills'),
  S('International transfer','Zero-fee, mid-market FX to 6 corridors','intl'),
  S('Rate alerts','“Alert me at 23.60” from chat',()=>chatDeep('fx')),
  S('Scheduled payments','Everything queued before salary day','upcoming'),
]},

{g:'Cards', items:[
  S('Card wallet','Real card art from both banks','cards'),
  S('Card controls','Freeze, limits, PIN, channels','card/fab-cc'),
  S('Freeze everything (panic)','One red button, all banks at once','security'),
  S('Virtual disposable card','Burns after one payment','vcard'),
  S('Pay card bill — CRED-style','From any bank + 120 pts reward','paybill/fab-cc'),
  S('Fee watchdog ✦','Found AED 36 of disputable fees on your statement','dispute'),
  S('1-click card application','Income verified via Connect → Face ID sign','apply/fab'),
  S('Card approved instantly','Virtual card live + Apple Pay + confetti','apply-done/fab'),
]},

{g:'Insights & budgets', items:[
  S('June insights','Donut, budgets, pace warning — “ask why ✦”','insights'),
  S('Category drill-down','Dining +38% with 5-month trend','cat/dining'),
  S('Top merchants','IKEA, Carrefour, Talabat ranked','insights'),
  S('Subscription hunter','11 detected · AED 1 426/mo · AED 2 076/yr to save','subs'),
  S('Cancel via your bank ✦','Noor files the cancellation + refund request','subs'),
  S('Safe-to-spend forecast','AED 9 540 until salary, 94% accuracy','forecast'),
  S('Financial health score','78/100 with named fixes','health'),
  S('June Money Story','Spotify-Wrapped for your month — tap through',()=>{A.go('insights');setTimeout(()=>Story.open(),450);}),
]},

{g:'Goals, rules & saving', items:[
  S('Goals overview','AED 57 700 on autopilot, earning 3,1% halal','goals'),
  S('Hajj fund','AED 12 000 / 60 000 — finishing 3 months early','goal/hajj'),
  S('Emergency fund coach','3.2 of 6 months covered','goal/emrg'),
  S('Create a goal','Templates: Hajj, school, travel, wedding','goal-new'),
  S('Round-ups → Gold','Spare change becomes vaulted gold (Jar-style)','roundups'),
  S('Noor Rules','Fi-style if-this-then-that across banks','rules'),
  S('Create a rule','WHEN dining > 1 500 THEN alert + pause delivery','rule-new'),
  S('Salary-day auto-split','20% moved the second salary lands','rules'),
]},

{g:'Products, wealth & financing', items:[
  S('Marketplace','Ranked by true cost for you — not commission','market'),
  S('Halal portfolio','Sukuk + Islamic ETFs + screened US stocks','invest'),
  S('Halal stock screener','AAPL ✓ · TSLA ✓ · BUD ✗ — instant verdicts',()=>{A.go('invest');setTimeout(()=>A.sheet(Halal.sheet()),500);}),
  S('Noor Gold','12,4 g vaulted · buy/sell at spot','gold'),
  S('Murabaha financing — activate','3 checks run themselves, then Face ID','loan-activate'),
  S('Funds in ~2 minutes','Disbursement success + schedule','loan-done'),
  S('AECB credit score','745 · free · with reason codes','score'),
  S('Score simulator','“What if I pay in full?” → +6','score'),
]},

{g:'Islamic suite', items:[
  S('Zakat — calculated live','2,5% over nisab from real balances','zakat'),
  S('Sadaqah automation','AED 100 every Friday — a standing rule','rules'),
  S('Takaful in chat','Travel cover for the August trip, AED 94',()=>chatDeep('takaful')),
  S('Mudarabah profit on goals','Savings earn 3,1% — compliant by design','goal/hajj'),
]},

{g:'Trust, consents & care', items:[
  S('Consent centre (AA-style)','Every permission: scope, expiry, revoke','consents'),
  S('Consent receipt & revoke','DIB expiring — renew or kill it','consent/dib'),
  S('Access log','142 reads this month, zero third parties','consents'),
  S('Security centre','Face ID, alerts, device list','security'),
  S('Profile & verified salary','KYC badge · AED 32 500/mo verified','profile'),
  S('Statements & documents','Combined statements, consent receipts, zakat cert','statement'),
  S('6 launch languages','Mirroring UAE’s 88% expat population','language'),
  S('Human support 24/7','38-second median first reply','support'),
]},

{g:'Rewards & delight', items:[
  S('Rewards & streak','2 340 pts · 5-day streak · Gold tier','rewards'),
  S('Scratch card — for real','Rub it with your finger 🎉','scratch'),
  S('Refer a friend','500 pts each on first bank link','rewards'),
  S('Points for paying bills','120 pts on the EI card bill','paybill/ei-cc'),
]},

{g:'Beyond banks ✦', items:[
  S('Wallets · BNPL · crypto in Money','Careem Pay, Tabby plans and Binance join the one-screen view','money'),
  S('Provider picker — 5 categories','Banks · wallets · BNPL · crypto · brokers in Noor Connect',()=>{A.tmp.cnCat='all';A.go('connect-banks');},'fresh'),
  S('Link Careem Pay (wallet)','Same Lean-style flow, wallet balance imported','connect-login/careem','fresh'),
  S('Link Tabby (BNPL)','Plans, limits and due dates land in Upcoming','connect-login/tabby','fresh'),
  S('Link Binance (crypto)','Read-only API — balances only, keys never stored','connect-login/binance','fresh'),
  S('Tabby vs Tamara vs Noor Split','Pre-approved BNPL comparison right at checkout',()=>{chatDeep('ps5');setTimeout(()=>Pay.buyPS5('Sharaf DG',3150,true),2800);}),
  S('Invest upsell — after onboarding','Brokers pitched once banking is in, never during first run','invest-upsell'),
]},

{g:'Zakat, properly ✦', items:[
  S('Nisab — gold vs silver, live','85 g gold vs 595 g silver thresholds; method decides which applies','zakat'),
  S('Declare what banks can’t see','Cash at home, trade stock, jewellery, receivables — with fiqh notes','zakat'),
  S('AI interview — every asset','Noor asks about merchant stock & hidden wealth, citing the four schools',()=>chatDeep('zakatFull')),
  S('Pick your scholar','Taqi Usmani · UAE Awqaf · Ibn ‘Uthaymeen · AAOIFI — math follows the fatwa',()=>chatDeep('zakatFull')),
  S('Family zakat — wakāla','Two incomes, individual obligations; husband pays with her consent',()=>{const st=ZK.st();st.rel.aisha=true;st.wak.aisha=true;A.go('zakat');}),
  S('Pay tomorrow — 1 Ramadan','Hawl anchored to Ramadan; recalculated at live prices on the day','zakat'),
  S('Debts that reduce zakat','Payroll, BNPL, 12-month slices of mortgage/car/personal, business facilities — itemised toggles','zakat'),
]},

{g:'Debt intelligence ✦', items:[
  S('Financing check-up','All 9 facilities, true profit cost per year — AED 49 079 (12 371 ex-home)','debts'),
  S('Refinance plan — close · transfer · keep','Honest line-by-line: settle invoice financing, move 4, keep the well-priced ones','refi'),
  S('Deposit-secured financing','Rahn over your e-Saver: 4,25% while savings keep earning 3,1%','dsf'),
  S('💰 Investor lens — unit economics','Toggle reveals what Noor earns per recommendation (and the AED 0 trust plays)',()=>{A.tmp.refiLens=true;A.go('refi');}),
  S('Refi advice in chat','“Should I refinance anything?” — close/transfer/keep with numbers',()=>chatDeep('refi')),
  S('New value proposition','Control · always-compliant (AI + scholars) · most accurate Zakat · local community','welcome','fresh'),
]},

{g:'Global & polish ✦', items:[
  S('العربية — full RTL','Whole app flips right-to-left with translated core screens',()=>{A.S.lang='ar';A.persist();A.go('home');}),
  S('Back to English','Language switch round-trip',()=>{A.S.lang='en';A.persist();A.go('language');}),
  S('Score projections','6-month AECB paths: refi plan +27 · minimums −27 · new financing dip-and-recover',()=>{A.tmp.scProj='plan';A.go('score');}),
  S('Halal strictness dial','Strict (AAOIFI-only) vs Balanced — grey-area local names with purification',()=>{A.tmp.invMode='balanced';A.go('invest');}),
  S('Local champions 🇦🇪🇸🇦','Aramco, Alinma, Salik ✓ halal · Emaar, stc, Air Arabia — grey, disclosed',()=>{A.tmp.invMode='balanced';A.go('invest');}),
  S('iPhone standalone link','app.html — no menu, fullscreen, Add-to-Home-Screen ready',()=>{A.go('home');A.sheet(`<div class="h2">📱 Run it like a real app</div><div class="sub mt8">Open this on your iPhone:</div><div class="card soft mt8" style="word-break:break-all"><b style="font-size:13px">evgenymuravev-netizen.github.io/Digital_aristotle/app.html</b></div><div class="sub mt12">1. Open in Safari → the demo loads fullscreen, no explorer menu.<br>2. Share → <b>Add to Home Screen</b> → launches standalone with the noor icon, like an installed app.<br>3. Scenario deep-links still work: app.html#s/27.</div><button class="btn pri mt12" onclick="A.closeSheet()">Got it</button>`);}),
]},

{g:'Business & advisor ✦', items:[
  S('SME insight stories','Sales +30%, rejections ↓12% after financing, CAC vs category — Tabby-Business style',()=>{A.tmp.bizI=0;A.go('biz');}),
  S('Notifications → insights','The thesis: nothing nags, every business signal lands as a story card',()=>{A.tmp.bizI=1;A.go('biz');}),
  S('Portfolio advice — whole picture','Buy gold to 8%, property-for-lease at 6,8%, hold shares, cap crypto',()=>chatDeep('advise')),
  S('Zakat — split into auto-payments','% of salary or monthly parts with hawl-end guarantee — one-tap rule',()=>{ZK.st().step=3;ZK.st().plan='income';A.go('zakat');}),
  S('Miles & cashback — zakatable?','Cashback yes once credited; points no — and the ḥīlah “lifehack” ruling',()=>{chatDeep('zakatFull');setTimeout(()=>ZKChat.points(),2800);}),
  S('B2B · B2C zakat switch','Solo proprietorship, 30% LLC look-through, fund zakatable ratios — one toggle',()=>{ZK.st().scope='both';A.go('zakat');}),
]},

{g:'Zakat journey 2.0 ✦', items:[
  S('3-step journey','Calculate → choose the cause → pay; method chips now carry YOUR total under each',()=>{ZK.st().step=1;A.go('zakat');}),
  S('Charity trust screen','First-timer friendly: licence, zakat handling, fees, track record per charity',()=>{ZK.st().step=2;A.go('zakat');}),
  S('Pay later — Qard Ḥasan','Noor advances 100% to charity today; you repay 4 parts, 0 fees — never late',()=>{ZK.st().step=3;ZK.st().plan='later';A.go('zakat');}),
  S('% of salary until covered','1/2/5% per payday + hawl-end top-up guarantee',()=>{ZK.st().step=3;ZK.st().plan='income';A.go('zakat');}),
  S('Zakat Pot — save ahead','Monthly Mudarabah pot earns ~3,1% halal profit, pays next hawl in one go',()=>{ZK.st().step=3;ZK.st().plan='pot';A.go('zakat');}),
  S('Custom amounts everywhere','Type any number in chat mid-interview, or use the input in every asset sheet',()=>{chatDeep('zakatFull');setTimeout(()=>ZKChat.homecash(),2800);}),
  S('Helping elderly parents','Son calculates & pays for Dad and Mum — with their permission (wakāla)',()=>{const st=ZK.st();['dad','mum'].forEach(id=>{st.rel[id]=true;st.wak[id]=true;});A.go('zakat');}),
  S('Mum’s gold — schools split live','210 g jewellery, little cash: Majority says 0, Hanafi says 2 868 — chips show it',()=>{const st=ZK.st();st.rel.mum=true;st.wak.mum=true;st.method='hanafi';A.go('zakat');}),
]},

{g:'Insights 2.0 ✦', items:[
  S('Budget rings — Apple style','Three rings (Essentials · Lifestyle · Travel) close toward plan; red ⚠️ = over, with the why',()=>A.go('insights')),
  S('Tooltips everywhere','Tap ⓘ on nisab, wakāla, Qard Ḥasan, pre-approved, rings, safe-to-spend…',()=>{A.go('zakat');setTimeout(()=>A.tip('Like this — every tricky concept has a one-tap explanation now.'),900);}),
  S('Birthday radar — gift planner','Aisha’s birthday in 14 days: budget it + ideas from her consent-shared spends, searches & listening',()=>A.go('gift')),
  S('Gift advice in chat','“What should I get Aisha?” — signals, budget, hidden Gift pot',()=>chatDeep('gift')),
]},
];

window.SCN_FLAT = [];
SCN_GROUPS.forEach(g => g.items.forEach(it => { it.no = SCN_FLAT.length+1; it.group = g.g; SCN_FLAT.push(it); }));
})();
