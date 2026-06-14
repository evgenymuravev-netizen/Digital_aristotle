/* ============ Arabic localisation + RTL ============ */
(function(){
const D = {
/* navigation */
'Overview':'نظرة عامة','Money':'أموالي','Insights':'الرؤى','Goals':'الأهداف',
/* home */
'Hi, John.':'أهلاً يا جون.','Morning briefing · 4 items':'الإحاطة الصباحية · 4 مهام','Morning briefing · 5 items':'الإحاطة الصباحية · 5 مهام',
'My money':'أموالي','Budget':'الميزانية','Trends for June':'اتجاهات شهر يونيو',
'Payments':'المدفوعات','Transfers':'التحويلات','For you':'لك خصيصاً','Upcoming':'القادم','All':'الكل',
'will be debited tomorrow':'سيُخصم غداً',
'Send':'إرسال','Request':'طلب','Scan':'مسح','Between':'تحويل بيني',
'Netflix':'نتفليكس','DEWA · autopay':'ديوا · دفع تلقائي','FAB card · min due':'بطاقة FAB · الحد الأدنى',
'Salary expected':'الراتب المتوقع','Auto finance · DIB':'تمويل السيارة · DIB',
'⚡ Pre-approved':'⚡ موافقة مسبقة','FAB card · AED 20 000 limit':'بطاقة FAB · حد 20 000 د.إ',
'3.99% · 55 days grace · 1-click':'3,99% · سماح 55 يوماً · بنقرة واحدة',
'✦ New':'✦ جديد','June Money Story':'قصة أموالك · يونيو','Your month in 30 seconds':'شهرك في 30 ثانية',
'🌙 Ramadan tomorrow':'🌙 رمضان غداً','Zakat — pay on day 1':'الزكاة — ادفع في اليوم الأول',
'Nisab checked · scholar-matched · family mode':'نصاب مُتحقق · بحسب مذهبك · وضع العائلة',
'📈 Upsell moment':'📈 لحظة العرض','Add your investments':'أضف استثماراتك','IBKR · Sarwa · eToro — read-only':'IBKR · ثروة · eToro — قراءة فقط',
'🎁 2 to scratch':'🎁 بطاقتا حظ','Scratch cards':'بطاقات الحظ','5-day streak reward':'مكافأة 5 أيام متتالية',
'▲ +7 pts':'▲ +7 نقاط','AECB score 745':'تقييم AECB ‏745','Very good · updated today':'جيد جداً · حُدّث اليوم',
/* money screen */
'Cash':'النقد','Net worth':'صافي الثروة','Assets':'الأصول','Liabilities':'الالتزامات',
'Salary account':'حساب الراتب','Current account':'الحساب الجاري','Saving spaces':'مساحات الادخار',
'Available balance':'الرصيد المتاح','Noor wealth':'ثروة نور','DIB · financing':'DIB · التمويل',
'Careem Pay · wallet':'محفظة كريم باي','Tabby · pay later':'تابي · ادفع لاحقاً','Binance · crypto':'بينانس · عملات رقمية',
'Add source':'إضافة مصدر','Consents':'الموافقات','▲ 2,4% this month':'▲ 2,4% هذا الشهر',
'📈 Complete the picture — link investments':'📈 أكمل الصورة — اربط استثماراتك',
'IBKR, Sarwa, eToro — read-only, counts into net worth & zakat':'قراءة فقط — تُحتسب في صافي الثروة والزكاة',
'Banks, wallets, BNPL and crypto — aggregated read-only via Noor Connect (CBUAE Open Finance).':'البنوك والمحافظ والشراء الآن والدفع لاحقاً والعملات الرقمية — مجمّعة للقراءة فقط عبر نور كونكت (التمويل المفتوح، المصرف المركزي).',
/* common headers */
'Zakat · 1447H':'الزكاة · 1447هـ','Cards':'البطاقات','Rewards':'المكافآت','Profile':'الملف الشخصي',
'Security':'الأمان','Subscriptions':'الاشتراكات','Notifications':'الإشعارات','Morning briefing':'الإحاطة الصباحية',
'Send money':'إرسال الأموال','Invest':'الاستثمار','Noor Gold':'ذهب نور','AECB score':'تقييم AECB',
'Financing check-up':'فحص التمويل','Refinance plan':'خطة إعادة التمويل','Deposit-secured financing':'تمويل مضمون بالوديعة',
'Bills & utilities':'الفواتير والخدمات','Send abroad':'تحويل دولي','Scan & pay':'امسح وادفع','Request money':'طلب أموال',
'Between my accounts':'بين حساباتي','Split a bill':'تقسيم فاتورة','Transaction':'العملية','Statements & documents':'الكشوف والمستندات',
'Consent centre':'مركز الموافقات','Language':'اللغة','Support':'الدعم','Virtual card':'البطاقة الافتراضية',
'Pay card bill':'سداد فاتورة البطاقة','1-click application':'طلب بنقرة واحدة','Activate financing':'تفعيل التمويل',
'Products':'المنتجات','New goal':'هدف جديد','Noor Rules':'قواعد نور','New rule':'قاعدة جديدة',
'Cashflow forecast':'توقعات التدفق النقدي','Financial health':'الصحة المالية','Round-ups → Gold':'تقريب المشتريات → ذهب',
/* buttons & common */
'Continue':'متابعة','Get started':'ابدأ الآن','Pay now':'ادفع الآن','Done':'تم','Save':'حفظ','Cancel':'إلغاء','Confirm':'تأكيد',
'Skip demo →':'تخطي العرض','I already have an account':'لدي حساب بالفعل','Open my dashboard':'افتح لوحتي',
'Pay tomorrow · 1 Ramadan':'ادفع غداً · 1 رمضان','Apply the whole plan':'طبّق الخطة كاملة',
'Sync now':'زامِن الآن','Filter':'تصفية','Edit budget':'تعديل الميزانية','Add a cap rule':'أضف قاعدة حد',
/* zakat */
'Calculation method':'طريقة الحساب','Majority':'الجمهور','Hanafi':'الحنفية','AAOIFI':'أيوفي','Safest':'الأحوط',
'Nisab today':'النصاب اليوم','Gold basis · 85 g':'أساس الذهب · 85 غ','Silver basis · 595 g':'أساس الفضة · 595 غ',
'Above nisab — zakat due ✓':'فوق النصاب — الزكاة واجبة ✓','Seen by Noor (live)':'ما يراه نور (مباشر)',
'Declared by you':'ما صرّحت به أنت','things no bank can see':'ما لا يراه أي بنك',
'Family zakat':'زكاة العائلة','Give to':'تصدّق إلى','Cash across 3 banks':'النقد في 3 بنوك',
'Careem Pay wallet':'محفظة كريم باي','Crypto — Binance spot':'عملات رقمية — بينانس','Halal investments':'استثمارات حلال',
'Noor Gold · 12,4 g':'ذهب نور · 12,4 غ','Cash at home':'نقد في المنزل','Trade goods in stock':'بضاعة معدّة للبيع',
'Gold jewellery (personal use)':'مصوغات ذهبية (استعمال شخصي)','Silver':'الفضة','Money owed to me (strong debts)':'ديون لي (مرجوّة السداد)',
'Personal':'شخصي','Business — incl. your team’s payroll':'تجاري — يشمل رواتب فريقك',
'zakat is individual — but you can pay as wakīl':'الزكاة فردية — ويمكنك الدفع وكيلاً',
/* chat */
'Noor AI':'نور AI','● agent online · acts with your approval':'● الوكيل متصل · يتصرف بموافقتك',
'💳 Best card':'💳 أفضل بطاقة','🏦 Best financing':'🏦 أفضل تمويل','📉 My spending':'📉 إنفاقي','☪ Zakat':'☪ الزكاة','✈️ Afford a trip?':'✈️ أتحمّل رحلة؟',
/* connect */
'Select your provider':'اختر مزوّدك','Select your bank':'اختر بنكك','Banks':'البنوك','Digital wallets':'المحافظ الرقمية',
'BNPL accounts':'حسابات الدفع الآجل','Crypto':'العملات الرقمية','Invest & brokers':'الاستثمار والوسطاء',
'Suggested for you':'مقترح لك','All banks':'كل البنوك',
};
/* regex rules for strings with embedded numbers */
const R = [
  [/^AED ([\d\s.,]+) today$/, 'AED $1 اليوم'],
  [/^Confirm with Face ID(.*)$/, 'تأكيد عبر Face ID$1'],
  [/^☪ Total zakat due · (.+) method$/, '☪ إجمالي الزكاة · طريقة $1'],
  [/^Due (.+) · min AED ([\d\s.,]+)$/, 'الاستحقاق $1 · الحد الأدنى $2 د.إ'],
];

window.t = s => (window.A && A.S && A.S.lang==='ar' && D[s]) || s;

window.applyAr = (root) => {
  if(!root || !(window.A && A.S && A.S.lang==='ar')) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n=>{
    const raw=n.textContent, k=raw.trim(); if(!k) return;
    if(D[k]){ n.textContent = raw.replace(k, D[k]); return; }
    for(const [re,sub] of R){ if(re.test(k)){ n.textContent = raw.replace(k, k.replace(re,sub)); return; } }
  });
  root.querySelectorAll('[placeholder]').forEach(el=>{
    if(el.placeholder==='Ask your question...') el.placeholder='اسأل سؤالك...';
    if(el.placeholder==='Search banks') el.placeholder='ابحث عن بنك';
  });
};

/* fully translated briefing + welcome (used at source level) */
const AR_BRIEFING = {
  line:`اليوم عليك <b>إرسال مستندات الرحلة</b>، ولديك <b>موعد طبيب</b> <b>غداً</b>.`,
  items:[
    {ic:'gift', c:'#FF8FC0', t:'عيد ميلاد عائشة — بعد 14 يوماً', d:'الخميس 26 يونيو · خطة الهدية جاهزة من إشاراتها المشتركة', cta:'خطط لهديتها', act:'gift'},
    {ic:'doc',  c:'#6FB6FF', t:'أرسل مستندات الرحلة', d:'حجز طيران الإمارات RF8Q2P · نسخ التأشيرة مطلوبة اليوم 18:00', cta:'افتح القائمة'},
    {ic:'heart',c:'#FF7A6B', t:'موعد الطبيب', d:'د. منصور · العدس الطبية · غداً 09:30 — آخر زيارة 390 د.إ', cta:'أضف للتقويم'},
    {ic:'film', c:'#E50914', t:'نتفليكس سيخصم 29 د.إ غداً', d:'من بطاقة FAB كاش باك ··4412', cta:'إدارة'},
    {ic:'card', c:'#FFB050', t:'استحقاق بطاقة FAB بعد 9 أيام', d:'كشف بـ 8 240,50 د.إ · ادفع كاملاً لتبقى بلا رسوم', cta:'ادفع الآن'},
  ]
};
window.BR = () => (window.A && A.S && A.S.lang==='ar') ? AR_BRIEFING : BRIEFING;

window.AR_WELCOME = [
  {h:'تحكَّم تماماً<br>في <span class="lime-t">أموالك</span>', d:'كل بنك ومحفظة وخطة دفع آجل ودَين ودرهم — صورة حيّة واحدة، ورقم واحد تثق به.'},
  {h:'متوافق 100%.<br><span class="lime-t">دائماً.</span>', d:'كل منتج يتتبعه الذكاء الاصطناعي ويعتمده كبار العلماء — لن تخالف الشريعة دون أن تدري. لا فوائد، في أي مكان، أبداً.'},
  {h:'أدقّ حساب<br><span class="lime-t">زكاة على الإطلاق</span>', d:'كل أصل وكل دَين — حتى بضاعة التجارة ورواتب الفريق — يُحسب حتى الدرهم، وفق مذهبك.'},
  {h:'ادعم<br><span class="lime-t">مجتمعك المحلي</span>', d:'مدخراتك تدعم أفضل الشركات المحلية المتوافقة مع الشريعة — ودرجة الصرامة بيدك: التزم تماماً أو أضف روّاد الإمارات والسعودية مع التطهير التلقائي.'},
];
})();
