/* ============ Noor demo data (fictional) ============ */
(function(){

window.USER = {
  first:'John', last:'Reeves', phone:'+971 50 482 7791', email:'john.reeves@gmail.com',
  eid:'784-1990-63821-4', iban:'AE07 0331 2345 6789 0123 456', since:'June 2026', emirate:'Dubai',
  salary:32500, salaryDay:25, employer:'TABBY FZ-LLC',
};

/* Accounts aggregated via Noor Connect. Liquid total = 275 900.76 (deck). */
window.ACCOUNTS = [
  {id:'fab-sal',  bank:'fab', kind:'current', name:'Salary account',   mask:'5689', bal:78865.05,  liquid:true},
  {id:'fab-sav',  bank:'fab', kind:'savings', name:'e-Saver',          mask:'2210', bal:96540.12,  liquid:true},
  {id:'wio-cur',  bank:'wio', kind:'current', name:'Current account',  mask:'2204', bal:17865.90,  liquid:true},
  {id:'wio-spc',  bank:'wio', kind:'savings', name:'Saving spaces',    mask:'8804', bal:45000.00,  liquid:true},
  {id:'ei-sav',   bank:'ei',  kind:'savings', name:'e-Saver',          mask:'8841', bal:37629.69,  liquid:true},
  {id:'fab-cc',   bank:'fab', kind:'card',    name:'Cashback Visa',    mask:'4412', bal:-8240.50,  due:'20 Jun', min:412.03, limit:30000, art:'linear-gradient(130deg,#0A2E5C,#06182F 70%)'},
  {id:'ei-cc',    bank:'ei',  kind:'card',    name:'Skywards Visa',    mask:'7733', bal:-1854.30,  due:'28 Jun', min:92.72,  limit:18000, art:'linear-gradient(130deg,#0D5640,#06281D 70%)'},
  {id:'inv',      bank:'noor',kind:'invest',  name:'Noor Invest',      mask:'',     bal:38500.00},
  {id:'gold',     bank:'noor',kind:'gold',    name:'Noor Gold · 12.4 g', mask:'',   bal:6030.40},
  {id:'auto-fin', bank:'dib', kind:'finance', name:'Auto finance (Murabaha)', mask:'5520', bal:-36200.00, monthly:1640, left:'24 payments left'},
  /* beyond banks — wallets · BNPL · crypto (linked via Noor Connect too) */
  {id:'careem-w', bank:'careem', kind:'wallet', name:'Careem Pay wallet', mask:'', bal:312.40},
  {id:'tabby-b',  bank:'tabby',  kind:'bnpl',   name:'Tabby · 2 active plans', mask:'', bal:-1575.00, next:'AED 787,50 on 11 Jul', limit:4500},
  {id:'binance-c',bank:'binance',kind:'crypto', name:'Binance · BTC, ETH', mask:'', bal:9840.00},
];
window.LIQUID_TOTAL = 275900.76;

window.BANK_ORDER = ['adcb','adib','ajman','cbd','dib','ei','enbd','fab','hsbc','liv','mashreq','rak','sib','wio'];
/* connectable provider categories (enhanced Noor Connect — beyond banks) */
window.CONNECT_CATS = [
  {id:'banks',  t:'Banks',           list:BANK_ORDER},
  {id:'wallets',t:'Digital wallets', list:['careem','payit','emoney','botim']},
  {id:'bnpl',   t:'BNPL accounts',   list:['tabby','tamara','postpay','cashew']},
  {id:'crypto', t:'Crypto',          list:['binance','rain','bitoasis']},
  {id:'invest', t:'Invest & brokers',list:['ibkr','sarwa','etoro']},
];
/* BNPL checkout offers — pre-approved, pulled via linked accounts */
window.BNPL_OFFERS = (price) => ([
  {id:'noor',  bank:'noor',  t:'Noor Split in 4',  d:'0 fees · ☪ Murabaha · auto-debits any bank', parts:4, today:price/4,  tag:'Best — 0 total cost', rec:true,  pre:'No limit needed'},
  {id:'tabby', bank:'tabby', t:'Tabby · 4 payments', d:'0 fees · uses your linked Tabby account',  parts:4, today:price/4,  tag:'✓ Pre-approved · AED 4 500 limit', pre:'AED 2 925 left after this'},
  {id:'tamara',bank:'tamara',t:'Tamara · split in 3', d:'0 fees · first payment today',            parts:3, today:price/3,  tag:'✓ Pre-approved · AED 3 800 limit', pre:'Instant approval'},
  {id:'full',  bank:'fab',   t:'Pay in full · FAB Visa', d:'5% cashback = AED '+fm(price*0.05,0),  parts:1, today:price,    tag:'+'+fm(price*0.05,0)+' cashback', pre:''},
]);

/* ---------- transactions (June 2026) ---------- */
window.TXNS = [
  {id:'t01', acc:'fab-sal', d:'Today, 14:21',  m:'Transfer to Ahmed Hassan', cat:'transfer', amt:-217.08, note:'Padel court split'},
  {id:'t02', acc:'wio-cur', d:'Today, 11:03',  m:'Transfer to Sara AlBlooshi', cat:'transfer', amt:-350.00, note:'Birthday gift pool'},
  {id:'t03', acc:'fab-cc',  d:'Today, 09:48',  m:'Starbucks DIFC', cat:'dining', amt:-24.00},
  {id:'t04', acc:'wio-cur', d:'Today, 08:12',  m:'Careem', cat:'transport', amt:-38.50},
  {id:'t05', acc:'fab-cc',  d:'Yesterday',     m:'Carrefour Mall of Emirates', cat:'groceries', amt:-214.35},
  {id:'t06', acc:'fab-cc',  d:'Yesterday',     m:'Amazon.ae', cat:'shopping', amt:-329.00, note:'Headphones'},
  {id:'t07', acc:'fab-sal', d:'9 Jun',         m:'DEWA', cat:'bills', amt:-412.60, note:'Autopay'},
  {id:'t08', acc:'fab-cc',  d:'9 Jun',         m:'Talabat', cat:'dining', amt:-86.40},
  {id:'t09', acc:'wio-cur', d:'8 Jun',         m:'ENOC 1027', cat:'transport', amt:-180.00, note:'Fuel'},
  {id:'t10', acc:'fab-cc',  d:'8 Jun',         m:'Netflix.com', cat:'entertainment', amt:-29.00, sub:true},
  {id:'t11', acc:'fab-sal', d:'7 Jun',         m:'Fitness First', cat:'health', amt:-350.00, sub:true},
  {id:'t12', acc:'ei-cc',   d:'7 Jun',         m:'Emirates.com', cat:'travel', amt:-1099.00, note:'DXB → LHR · Aug'},
  {id:'t13', acc:'fab-cc',  d:'6 Jun',         m:'Spinneys Marina', cat:'groceries', amt:-167.20},
  {id:'t14', acc:'wio-cur', d:'6 Jun',         m:'Salik auto top-up', cat:'transport', amt:-50.00, sub:true},
  {id:'t15', acc:'fab-cc',  d:'5 Jun',         m:'Sharaf DG', cat:'shopping', amt:-499.00, note:'Smart watch strap'},
  {id:'t16', acc:'fab-sal', d:'5 Jun',         m:'Al Das Medical Clinic', cat:'health', amt:-390.00},
  {id:'t17', acc:'fab-cc',  d:'4 Jun',         m:'Spotify', cat:'entertainment', amt:-23.99, sub:true},
  {id:'t18', acc:'wio-cur', d:'4 Jun',         m:'Careem Food', cat:'dining', amt:-112.30},
  {id:'t19', acc:'fab-cc',  d:'3 Jun',         m:'du Home Internet', cat:'bills', amt:-389.00, sub:true},
  {id:'t20', acc:'fab-cc',  d:'3 Jun',         m:'IKEA Festival City', cat:'shopping', amt:-1244.75},
  {id:'t21', acc:'fab-sal', d:'2 Jun',         m:'Transfer to Wio ··2204', cat:'transfer', amt:-5000.00, note:'Monthly split'},
  {id:'t22', acc:'wio-cur', d:'2 Jun',         m:'From FAB ··5689', cat:'transfer', amt:5000.00},
  {id:'t23', acc:'fab-cc',  d:'2 Jun',         m:'iCloud+', cat:'entertainment', amt:-36.99, sub:true},
  {id:'t24', acc:'fab-cc',  d:'1 Jun',         m:'Carrefour City Walk', cat:'groceries', amt:-312.45},
  {id:'t25', acc:'fab-sal', d:'1 Jun',         m:'Zoom Pharmacy', cat:'health', amt:-86.00},
  {id:'t26', acc:'ei-sav',  d:'1 Jun',         m:'Profit distribution', cat:'income', amt:118.42, note:'Mudarabah profit · May'},
  {id:'t27', acc:'fab-cc',  d:'31 May',        m:'ChatGPT Plus', cat:'entertainment', amt:-73.41, sub:true},
  {id:'t28', acc:'fab-cc',  d:'30 May',        m:'Anghami Plus', cat:'entertainment', amt:-19.99, sub:true},
  {id:'t29', acc:'fab-sal', d:'25 May',        m:'TABBY FZ-LLC · Salary', cat:'income', amt:32500.00, note:'Salary'},
  {id:'t30', acc:'wio-spc', d:'25 May',        m:'Auto-save rule · Salary 20%', cat:'transfer', amt:1500.00, rule:true},
];

/* ---------- subscriptions (auto-detected) ---------- */
window.SUBS = [
  {m:'Netflix',        amt:29.00, day:'12th', next:'Tomorrow', ic:'film',  c:'#E50914', acc:'fab-cc', used:'Watched 14 h in May'},
  {m:'Fitness First',  amt:350.00,day:'7th',  next:'7 Jul',    ic:'heart', c:'#FF7A6B', acc:'fab-sal',used:'Visited 11× in May'},
  {m:'du Home Internet',amt:389.00,day:'3rd', next:'3 Jul',    ic:'zap',   c:'#6FB6FF', acc:'fab-cc', used:'Essential'},
  {m:'du Mobile · Power 25GB', amt:289.00, day:'1st', next:'1 Jul', ic:'phone', c:'#3FA9F5', acc:'fab-sal',
   used:'6,2 GB of 25 GB · 210 min', flag:'Overprovisioned — a cheaper plan fits you',
   usage:{gb:[6.2,25],min:'210 min (flexi unlimited)', rec:{plan:'du Smart 12GB', price:199, save:1080, why:'Your 6-month average is 6,8 GB — even 12 GB leaves headroom'}}},
  {m:'Claude API',     amt:142.67,day:'5th',  next:'Usage-based', ic:'spark', c:'#D97A4A', acc:'fab-cc',
   used:'AED 142,67 in May (≈ $38,85) · tokens ▲ 38%', flag:'Usage-based — caching could cut ~40%'},
  {m:'ChatGPT Plus',   amt:73.41, day:'31st', next:'30 Jun',   ic:'spark', c:'#B89CFF', acc:'fab-cc', used:'Used daily'},
  {m:'iCloud+ 2TB',    amt:36.99, day:'2nd',  next:'2 Jul',    ic:'doc',   c:'#9DB2A6', acc:'fab-cc',
   used:'1,1 TB used · Aisha pays AED 36,99 for her own', flag:'Family Sharing covers you both — one plan, save AED 444/yr',
   share:{who:'Aisha', herCost:36.99, save:444, why:'iCloud+ 2TB shares with up to 5 family members at no extra cost. You use 1,1 TB — plenty of room for both.'}},
  /* music cluster — main metric: hours listened + trend */
  {m:'Anghami Plus',   amt:19.99, day:'30th', next:'30 Jun',   ic:'film',  c:'#FF8FC0', acc:'fab-cc', music:true,
   hours:31, trend:+24, used:'31 h this month ▲ 24%', flag:'Keep — your main player, best Arabic catalogue'},
  {m:'Spotify Premium',amt:23.99, day:'4th',  next:'4 Jul',    ic:'film',  c:'#53DE8E', acc:'fab-cc', music:true,
   hours:2.1, trend:-67, used:'2,1 h this month ▼ 67%', flag:'Overlaps Anghami & Apple Music — cancel'},
  {m:'Apple Music',    amt:21.99, day:'9th',  next:'9 Jul',    ic:'film',  c:'#FA445C', acc:'fab-cc', music:true,
   hours:0.4, trend:-81, used:'0,4 h this month ▼ 81%', flag:'Overlaps Anghami & Spotify — cancel'},
  {m:'Salik auto top-up',amt:50.00,day:'~6th',next:'When low', ic:'car',   c:'#FFB050', acc:'wio-cur',used:'Balance-based'},
];

/* ---------- upcoming ---------- */
window.UPCOMING = [
  {t:'Netflix', d:'Tomorrow', amt:29.00, ic:'film', c:'#E50914', acc:'FAB ··4412'},
  {t:'DEWA · autopay', d:'15 Jun', amt:412.60, ic:'zap', c:'#6FB6FF', acc:'FAB ··5689'},
  {t:'FAB card · min due', d:'20 Jun', amt:412.03, ic:'card', c:'#FFB050', acc:'Pay from any bank'},
  {t:'Auto finance · DIB', d:'25 Jun', amt:1640.00, ic:'car', c:'#5EE6D0', acc:'Murabaha instalment'},
  {t:'Salary expected', d:'25 Jun', amt:32500.00, ic:'recv', c:'#53DE8E', acc:'TABBY FZ-LLC', inc:true},
];

/* ---------- briefing (agentic) ---------- */
window.BRIEFING = {
  line:`Today you need <b>to send the documents for the trip</b>. And a <b>doctor's appointment</b> is scheduled for <b>tomorrow</b>.`,
  items:[
    {ic:'doc',  c:'#6FB6FF', t:'Send trip documents', d:'Emirates booking RF8Q2P · visa copies due today 18:00', cta:'Open checklist'},
    {ic:'heart',c:'#FF7A6B', t:"Doctor's appointment", d:'Dr. Mansoor · Al Das Medical · tomorrow 09:30 — AED 390 last visit', cta:'Add to calendar'},
    {ic:'film', c:'#E50914', t:'Netflix will debit AED 29 tomorrow', d:'From FAB Cashback Visa ··4412', cta:'Manage'},
    {ic:'card', c:'#FFB050', t:'FAB card payment due in 9 days', d:'Statement AED 8 240,50 · pay in full to stay fee-free', cta:'Pay now'},
  ]
};

/* ---------- contacts ---------- */
window.CONTACTS = [
  {n:'Sara AlBlooshi', ph:'+971 50 884 2210', fav:true,  bank:'wio'},
  {n:'Ahmed Hassan',   ph:'+971 55 102 9384', fav:true,  bank:'fab'},
  {n:'Mariam Khaled',  ph:'+971 52 778 1145', fav:true,  bank:'enbd'},
  {n:'Omar Farouk',    ph:'+971 50 233 8867', fav:true,  bank:'adcb'},
  {n:'Layla Haddad',   ph:'+971 54 990 1276', fav:false, bank:'ei'},
  {n:'Yusuf Rahman',   ph:'+971 56 441 7733', fav:false, bank:'mashreq'},
  {n:'Dana Petrova',   ph:'+971 58 320 5512', fav:false, bank:'wio'},
];

/* ---------- offers (deck slide 2 & 10) ---------- */
window.CARD_OFFERS = [
  {id:'fab',  bank:'fab', limit:20000, rate:3.99, grace:55, rec:true,  perks:['5% cashback groceries & fuel','No annual fee · first year','Buy-1-get-1 cinema'] , shariah:false},
  {id:'ei',   bank:'ei',  limit:10000, rate:3.69, grace:55, rec:false, perks:['Skywards miles on every spend','Shariah-compliant (Tawarruq)','Airport lounge ×8 / year'], shariah:true},
  {id:'wio',  bank:'wio', limit:25000, rate:5.50, grace:60, rec:false, perks:['Virtual card instantly','3% on Wio Saving Spaces','No FX mark-up weekends'], shariah:false},
];
window.LOAN_OFFER = {amount:120000, monthly:2641, months:48, rate:5.49, type:'Murabaha personal finance', bank:'ei',
  note:'Pre-approved from your verified income (AED 32 500/mo, 14 salary credits seen via Noor Connect).'};

window.PS5_OFFERS = [
  {store:'Sharaf DG',        price:3150, eta:'Today, 2–4 h',  tag:'Best price', art:'ps5'},
  {store:'Jumbo Electronics',price:3249, eta:'Tomorrow',      tag:'Free HDMI 2.1 cable', art:'ps5'},
  {store:'Amazon.ae',        price:3329, eta:'Tomorrow',      tag:'Prime delivery', art:'ps5'},
];

/* ---------- budget ---------- */
window.BUDGET = {total:18000, spent:14213.40, month:'June'};
window.CATSPEND = [
  {cat:'shopping',  amt:3421.75, bud:3000},
  {cat:'groceries', amt:2845.10, bud:3200},
  {cat:'bills',     amt:2210.80, bud:2400},
  {cat:'dining',    amt:1932.55, bud:1400},
  {cat:'travel',    amt:1099.00, bud:1500},
  {cat:'transport', amt:864.20,  bud:1000},
  {cat:'health',    amt:740.00,  bud:900},
  {cat:'entertainment', amt:612.40, bud:700},
  {cat:'other',     amt:487.60,  bud:900},
];
window.MERCHANTS_TOP = [
  {m:'IKEA',      n:1, amt:1244.75, cat:'shopping'},
  {m:'Carrefour', n:9, amt:1240.30, cat:'groceries'},
  {m:'Emirates',  n:1, amt:1099.00, cat:'travel'},
  {m:'Amazon.ae', n:4, amt:980.50,  cat:'shopping'},
  {m:'Talabat',   n:7, amt:642.80,  cat:'dining'},
  {m:'Careem',    n:11,amt:388.20,  cat:'transport'},
];

/* ---------- goals ---------- */
window.GOALS = [
  {id:'hajj',  n:'Hajj fund',        em:'🕋', cur:12000, tgt:60000, by:'Dec 2027', auto:'AED 1 000 / salary', c:'#E8C268'},
  {id:'emrg',  n:'Emergency fund',   em:'🛟', cur:19500, tgt:36000, by:'6 months of expenses', auto:'20% of salary', c:'#53DE8E'},
  {id:'car',   n:'New car',          em:'🚙', cur:22000, tgt:85000, by:'Mar 2028', auto:'Round-ups ×10', c:'#6FB6FF'},
  {id:'umrah', n:'Umrah with family',em:'🌙', cur:4200,  tgt:15000, by:'Apr 2027', auto:'AED 500 / month', c:'#B89CFF'},
];

/* ---------- rules (Fi-style automations) ---------- */
window.RULES = [
  {id:'r1', on:true,  when:'Salary arrives',                then:'Move 20% to Saving spaces', ic:'recv',  ran:'Ran 25 May · moved AED 1 500'},
  {id:'r2', on:true,  when:'Every card spend',              then:'Round up to Noor Gold',     ic:'coins', ran:'AED 184,20 saved in May'},
  {id:'r3', on:true,  when:'Every Friday',                  then:'AED 100 Sadaqah to Dubai Cares', ic:'heart', ran:'Next: Friday 13 Jun'},
  {id:'r4', on:false, when:'Dining > AED 1 500 in a month', then:'Alert me + freeze food delivery', ic:'food', ran:'Triggered 28 May'},
  {id:'r5', on:true,  when:'FAB balance < AED 2 000',       then:'Top up AED 3 000 from Wio', ic:'swap',  ran:'Never triggered'},
];

/* ---------- billers ---------- */
window.BILLERS = [
  {n:'DEWA', d:'Electricity & water', ic:'zap', c:'#6FB6FF', due:412.60, autopay:true},
  {n:'Etisalat e&', d:'Mobile · 050 482 7791', ic:'phone', c:'#53DE8E', due:289.00, autopay:false},
  {n:'du Home', d:'Internet · account 884512', ic:'globe', c:'#B89CFF', due:389.00, autopay:true},
  {n:'Salik', d:'Toll · 2 tags', ic:'car', c:'#FFB050', due:0, autopay:true},
  {n:'Nol card', d:'Transport top-up', ic:'card', c:'#FF8FC0', due:0, autopay:false},
  {n:'Dubai Police', d:'Traffic fines', ic:'alert', c:'#FF7A6B', due:0, autopay:false},
];

/* ---------- AECB score ---------- */
window.SCORE = {
  v:745, max:900, band:'Very good', delta:+7,
  hist:[690,698,702,711,718,724,731,738,742,745],
  factors:[
    {t:'Payment history', s:'Excellent', d:'36 on-time payments in a row', good:true},
    {t:'Credit utilisation', s:'27%', d:'AED 10 095 used of AED 48 000 limits', good:true},
    {t:'Credit age', s:'4.2 years', d:'Oldest: FAB Cashback Visa', good:true},
    {t:'Recent enquiries', s:'2 in 6 months', d:'Each hard enquiry can cost a few points', good:false},
  ]
};

/* ---------- invest ---------- */
window.INVEST = {
  total:38500, day:+1.24, positions:[
    {n:'UAE Sukuk Fund', d:'Fixed income · AAA avg', amt:21000, chg:+2.1, c:'#53DE8E', em:'🕌'},
    {n:'MSCI World Islamic ETF', d:'Global equity · Halal screened', amt:12400, chg:+4.8, c:'#6FB6FF', em:'🌍'},
    {n:'US Stocks (Halal)', d:'AAPL · MSFT · TSLA via screen', amt:5100, chg:-1.2, c:'#B89CFF', em:'📈'},
  ],
  gold:{grams:12.4, perGram:486.32, val:6030.40, mo:+3.6},
  /* local GCC champions — strictness is the user's dial */
  locals:[
    {n:'Aramco',      mkt:'KSA', s:'halal', note:'Passes AAOIFI screens — core energy'},
    {n:'Alinma Bank', mkt:'KSA', s:'halal', note:'Fully Islamic bank'},
    {n:'Salik',       mkt:'UAE', s:'halal', note:'Toll operator — clean balance sheet'},
    {n:'Emaar',       mkt:'UAE', s:'grey',  purif:0.8, note:'Debt near the 33% line · conventional financing income'},
    {n:'stc',         mkt:'KSA', s:'grey',  purif:0.4, note:'Interest income ≈ 0,4% — purify it'},
    {n:'Air Arabia',  mkt:'UAE', s:'grey',  purif:1.1, note:'Conventional leasing exposure'},
  ],
};
/* AECB score projections (6 months forward) */
window.SCORE_PROJ = {
  plan:  {t:'Follow the refi plan', end:772, arr:[745,748,752,757,761,766,772], note:'Utilisation drops as facilities close + on-time history compounds'},
  min:   {t:'Pay minimums only',    end:718, arr:[745,741,736,731,726,722,718], note:'Revolving balances push utilisation up — the silent score killer'},
  newfin:{t:'Take new financing',   end:768, arr:[745,741,744,750,757,763,768], note:'Hard-enquiry dip (−4), recovers as the facility seasons'},
};

/* ---------- zakat (1447H — Ramadan starts tomorrow) ---------- */
window.ZAKAT = {
  cash:275900.76, gold:6030.40, invest:38500.00, nisab:41337.20, rate:0.025,
  charities:['Dubai Cares','Emirates Red Crescent','Al Jalila Foundation','Beit Al Khair'],
  /* rich charity profiles — built for a first-time payer's trust */
  charityInfo:[
    {n:'Dubai Cares', em:'🎓', since:2007, focus:'Education & child welfare',
     lic:'Licensed UAE charity · founded by H.H. Sheikh Mohammed', fee:'0% admin on zakat — Noor covers processing',
     reach:'21M children reached across 60 countries', zk:'Zakat programmes ringfenced & Shariah-audited yearly'},
    {n:'Emirates Red Crescent', em:'🌙', since:1983, focus:'Relief · orphans · debt relief (ghārimīn)',
     lic:'Federal-decree body · IFRC member', fee:'100% of zakat reaches beneficiaries',
     reach:'1,2M beneficiaries supported in 2025', zk:'Dedicated zakat fund with scholar oversight'},
    {n:'Al Jalila Foundation', em:'🏥', since:2013, focus:'Medical treatment for those who can’t afford it',
     lic:'Dubai decree · part of Dubai Health', fee:'0% on zakat donations',
     reach:'Funded treatment for 18 000+ patients', zk:'Treating the poor qualifies (fuqarā’/masākīn category)'},
    {n:'Beit Al Khair Society', em:'🤲', since:1989, focus:'Local UAE families — the closest poor come first',
     lic:'UAE Ministry of Community Development', fee:'In-house Shariah board',
     reach:'AED 2,1B distributed since 1989', zk:'Strict zakat ledger — the 8 maṣārif tracked separately'},
  ],
  /* live metal prices */
  goldPerG:486.32, silverPerG:5.62, nisabGoldG:85, nisabSilverG:595,
  hijri:'29 Sha’ban 1447 — Ramadan starts tomorrow',
  /* auto-detected via Noor Connect */
  auto:[
    {t:'Cash across 3 banks',      v:275900.76, src:'FAB · Wio · EI'},
    {t:'Careem Pay wallet',        v:312.40,    src:'Linked wallet'},
    {t:'Crypto — Binance spot',    v:9840.00,   src:'Treated as currency (AAOIFI view)'},
    {t:'Halal investments',        v:38500.00,  src:'Full market value · trading intent'},
    {t:'Noor Gold · 12,4 g',       v:6030.40,   src:'Vaulted, at today’s price'},
  ],
  /* assets Noor cannot see — declared by the user */
  manual:[
    {id:'homecash', t:'Cash at home',                em:'🏠', v:3500,  on:true,  note:'Zakatable wherever it sleeps — unanimous'},
    {id:'trade',    t:'Trade goods in stock',        em:'📦', v:18000, on:true,  note:'Merchant inventory at today’s selling price — agreed by all four schools'},
    {id:'jewel',    t:'Gold jewellery (personal use)',em:'💍', v:0,    on:false, note:'Khilaf: Hanafi & Ibn ‘Uthaymeen — zakatable · Majority — exempt'},
    {id:'silver',   t:'Silver',                      em:'🥈', v:0,    on:false, note:'595 g nisab on its own'},
    {id:'owed',     t:'Money owed to me (strong debts)', em:'🤝', v:0, on:false, note:'Expected receivables — zakatable now per the majority'},
    {id:'points',   t:'Cashback pending payout',     em:'💳', v:230,   on:true,  note:'Cash-back is money once credited. Miles & points are NOT māl until redeemed — see the chat for the “lifehack” ruling'},
  ],
  /* debts deductible from the zakat base — itemised.
     Long-term financing: deduct the next 12 months only (contemporary consensus — AAOIFI, Qaradawi).
     Short-term & due debts: deduct in full. Wages owed to your team are a debt on you. */
  deduct:{
    personal:[
      {id:'cards',   t:'Card statements due',                      v:10094.80, note:'FAB + EI Visas — due this cycle'},
      {id:'bnpl',    t:'BNPL outstanding — Tabby & Tamara',        v:1995.00,  note:'All remaining instalments'},
      {id:'mortg',   t:'Islamic home finance — next 12 months',    v:76200.00, note:'Ijarah, DIB · long-term → 12-month rule'},
      {id:'car',     t:'Islamic car finance — next 12 months',     v:19680.00, note:'Murabaha, DIB'},
      {id:'pers',    t:'Islamic personal finance — next 12 months',v:7920.00,  note:'Murabaha, EI'},
    ],
    business:[
      {id:'payroll', t:'Team payroll due — 2 staff',               v:9800.00,  note:'Wages owed are a debt on you — pay on time'},
      {id:'bizfin',  t:'Islamic business financing — next 12 months', v:30000.00, note:'Murabaha facility, Mashreq'},
      {id:'invoice', t:'Invoice financing — due in full',          v:22000.00, note:'Short-term — deduct fully'},
      {id:'po',      t:'Purchase financing — due 90 days',         v:12500.00, note:'PO finance for stock'},
      {id:'b2b',     t:'B2B BNPL — supplier terms',                v:8400.00,  note:'0% if settled in 60 days'},
    ],
  },
  spouse:{name:'Aisha', cash:42300.00, jewelleryG:145},
  /* helping relatives — each is an individual obligation; you pay as wakīl WITH their permission */
  family:[
    {id:'aisha', rel:'Wife',   name:'Aisha',         cash:42300.00, jewelleryG:145, note:'Salary savings + her jewellery'},
    {id:'dad',   rel:'Father', name:'Robert (Dad)',  cash:88400.00, jewelleryG:0,   note:'Retired — pension savings, no gold'},
    {id:'mum',   rel:'Mother', name:'Mary (Mum)',    cash:12600.00, jewelleryG:210, note:'Little cash, much gold — the classic elderly-parent case'},
  ],
  /* B2B — business-side zakatable assets (solo proprietorship · shares · funds) */
  bizAssets:[
    {id:'bizcash', t:'Business account balance',     em:'🏢', v:22400, on:true,  note:'Wio Business ··7741 — cash is cash'},
    {id:'bizrecv', t:'Business receivables (strong)',em:'🧾', v:8000,  on:true,  note:'Invoices you expect to collect'},
    {id:'llc',     t:'Reeves Trading LLC — your 30%',em:'📜', v:25200, on:true,  note:'Zakat flows through the company: 30% × AED 84 000 net current assets (AAOIFI look-through)'},
    {id:'pefund',  t:'PE fund units — zakatable 42%',em:'🏛', v:6300,  on:true,  note:'AED 15 000 units × 42% zakatable ratio reported by the fund'},
    {id:'sukfund', t:'Noor Sukuk Fund',              em:'✅', v:0,     on:false, locked:true, note:'Fund pays zakat at fund level — already covered, excluded here'},
  ],
};
window.ZK_DEDUCT_ALL = () => [...ZAKAT.deduct.personal, ...ZAKAT.deduct.business];

/* ---------- the debt book — financing check-up & refinancing ---------- */
window.DEBTS = [
  {id:'mortg',  t:'Home finance (Ijarah)',        bank:'dib',     out:920000, rate:3.99, monthly:6350, kind:'Personal', costYr:36708,
   rec:'keep', why:'Market-best rate — switching would cost you. We earn nothing by saying this.', save:0, noorRev:0},
  {id:'car',    t:'Car finance (Murabaha)',       bank:'dib',     out:36200,  rate:5.90, monthly:1640, kind:'Personal', costYr:2136,
   rec:'transfer', to:'Noor auto refinancing · 4,49%', save:510, noorRev:440, why:'Same car, lower profit rate — settled & re-papered in one tap.'},
  {id:'pers',   t:'Personal finance (Murabaha)',  bank:'ei',      out:18000,  rate:8.50, monthly:660,  kind:'Personal', costYr:1530,
   rec:'transfer', to:'Noor deposit-secured · 4,25%', save:765, noorRev:310, why:'Your e-Saver pledges as rahn — rate nearly halves while savings keep earning 3,1%.'},
  {id:'bnpl',   t:'BNPL plans — Tabby & Tamara',  bank:'tabby',   out:1995,   rate:0,    monthly:1208, kind:'Personal', costYr:0,
   rec:'keep', why:'0 fees — free money. Never refinance free money.', save:0, noorRev:0},
  {id:'invoice',t:'Invoice financing',            bank:'mashreq', out:22000,  rate:14.50,monthly:0,    kind:'Business', costYr:3190,
   rec:'close', why:'Your most expensive dirham — settle it from idle e-Saver cash earning 0% there.', save:3190, noorRev:0},
  {id:'bizfin', t:'Business financing (Murabaha)',bank:'mashreq', out:45000,  rate:9.20, monthly:2750, kind:'Business', costYr:4140,
   rec:'transfer', to:'Noor deposit-secured business · 4,95%', save:1912, noorRev:765, why:'Pledge part of your deposit — profit rate drops by nearly half.'},
  {id:'po',     t:'Purchase financing (PO)',      bank:'mashreq', out:12500,  rate:11.00,monthly:0,    kind:'Business', costYr:1375,
   rec:'transfer', to:'Noor purchase financing · 6,9%', save:512, noorRev:185, why:'Stock finance at a sane rate, repaid as inventory sells.'},
  {id:'b2b',    t:'B2B BNPL — supplier terms',    bank:'cashew',  out:8400,   rate:0,    monthly:0,    kind:'Business', costYr:0,
   rec:'keep', why:'0% inside 60 days — I’ll remind you on day 55.', save:0, noorRev:0},
  {id:'payroll',t:'Team payroll — due 28th',      bank:'noor',    out:9800,   rate:0,    monthly:0,    kind:'Business', costYr:0,
   rec:'schedule', why:'Not a financing — a trust. Scheduled from FAB ··5689 so it never slips.', save:0, noorRev:0},
];
window.DSF = {rate:4.25, bizRate:4.95, pledge:0.8, deposit:96540.12, earn:3.1,
  blurb:'Commodity Murabaha secured by a pledge (rahn) over your savings — your deposit keeps earning while you pay a near-deposit rate.'};
/* calculation methods — honest attributions, confirm with your local mufti */
window.ZK_METHODS = {
  majority:  {n:'Majority',  nisab:'gold',   jewellery:false,
    who:'Maliki · Shafi‘i · Hanbali: personal-use jewellery exempt; gold nisab for cash — the line generally followed by UAE Awqaf fatwas.'},
  hanafi:    {n:'Hanafi',    nisab:'silver', jewellery:true,
    who:'School of Imam Abu Hanifa: jewellery is zakatable, silver nisab preferred for caution — approach of many Hanafi muftis incl. Mufti Taqi Usmani.'},
  aaoifi:    {n:'AAOIFI',    nisab:'gold',   jewellery:false,
    who:'AAOIFI Shari‘ah Standard No. 35 (Zakah) — the institutional standard Islamic banks audit against; board long chaired by Mufti Taqi Usmani.'},
  precaution:{n:'Safest',    nisab:'silver', jewellery:true,
    who:'Most cautious combination: silver nisab + jewellery included — jewellery view also held by Sh. Ibn Baz and Sh. Ibn ‘Uthaymeen.'},
};

/* ---------- rewards ---------- */
window.REWARDS = {pts:2340, streak:5, tier:'Gold', scratch:2};

/* ---------- consents (AA-style) ---------- */
window.CONSENTS = [
  {bank:'fab', scope:'Accounts · Balances · 12m transactions', granted:'11 Jun 2026', expires:'11 Jun 2027', status:'Active', freq:'4× / day'},
  {bank:'wio', scope:'Accounts · Balances · 12m transactions', granted:'11 Jun 2026', expires:'11 Jun 2027', status:'Active', freq:'4× / day'},
  {bank:'ei',  scope:'Accounts · Balances · 12m transactions', granted:'11 Jun 2026', expires:'11 Jun 2027', status:'Active', freq:'4× / day'},
  {bank:'dib', scope:'Financing account · Balance only',            granted:'11 Jun 2026', expires:'11 Dec 2026', status:'Expiring soon', freq:'1× / day'},
  {bank:'careem', scope:'Wallet balance · transactions',       granted:'11 Jun 2026', expires:'11 Jun 2027', status:'Active', freq:'4× / day'},
  {bank:'tabby',  scope:'Plans · limits · upcoming payments',  granted:'11 Jun 2026', expires:'11 Jun 2027', status:'Active', freq:'2× / day'},
  {bank:'binance',scope:'Read-only API · balances only',       granted:'11 Jun 2026', expires:'11 Jun 2027', status:'Active', freq:'1× / hour'},
];

/* ---------- notifications ---------- */
window.NOTIFS = [
  {ic:'spark', c:'#D7F050', t:'Your June Money Story is ready', d:'See where your money went in 30 seconds', when:'Just now', act:'story'},
  {ic:'film',  c:'#E50914', t:'Netflix debits AED 29 tomorrow', d:'FAB Cashback Visa ··4412', when:'2 h ago', act:'subs'},
  {ic:'card',  c:'#FFB050', t:'Pre-approved: FAB card, AED 20 000 limit', d:'3.99% · 55 days grace · expires in 6 days', when:'5 h ago', act:'chat-card'},
  {ic:'trendUp',c:'#53DE8E',t:'AECB score up 7 points → 745', d:'On-time FAB card payment reported', when:'Yesterday', act:'score'},
  {ic:'gift',  c:'#B89CFF', t:'You earned a scratch card', d:'5-day saving streak — keep it up!', when:'Yesterday', act:'rewards'},
  {ic:'shieldCheck', c:'#5EE6D0', t:'DIB consent expires in 14 days', d:'Renew to keep your financing synced', when:'2 d ago', act:'consents'},
];

/* ---------- FX ---------- */
window.FX = [
  {c:'INR', flag:'🇮🇳', rate:23.42, n:'Indian rupee'},
  {c:'USD', flag:'🇺🇸', rate:0.2723, n:'US dollar'},
  {c:'PKR', flag:'🇵🇰', rate:76.40, n:'Pakistani rupee'},
  {c:'PHP', flag:'🇵🇭', rate:15.62, n:'Philippine peso'},
  {c:'EGP', flag:'🇪🇬', rate:13.08, n:'Egyptian pound'},
  {c:'GBP', flag:'🇬🇧', rate:0.2129, n:'British pound'},
];

/* products marketplace */
window.MARKET = [
  {id:'cards', t:'Credit cards', d:'3 pre-approved', ic:'card', c:'#6FB6FF'},
  {id:'loan',  t:'Personal finance', d:'Up to AED 120 000', ic:'dollar', c:'#53DE8E'},
  {id:'dsf',   t:'Deposit-secured financing', d:'4,25% — savings keep earning', ic:'lock', c:'#D7F050'},
  {id:'refi',  t:'Refinance my debts', d:'Save AED 6 889/yr', ic:'swap', c:'#53DE8E'},
  {id:'auto',  t:'Auto finance', d:'From 2.49% flat', ic:'car', c:'#FFB050'},
  {id:'home',  t:'Home finance', d:'Ijarah · from 3.99%', ic:'home', c:'#B89CFF'},
  {id:'takaful',t:'Takaful insurance', d:'Car · travel · health', ic:'shield', c:'#5EE6D0'},
  {id:'invest',t:'Invest & gold', d:'Sukuk · halal ETFs', ic:'trendUp', c:'#E8C268'},
];
})();
