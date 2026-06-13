/* ============ shared UI helpers ============ */
(function(){

/* ---- money formatting: "AED 275 900,76" (deck style) ---- */
window.fm = (n, dec=2) => {
  const neg = n < 0; n = Math.abs(n);
  const [i, f] = n.toFixed(dec).split('.');
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg?'−':'') + ii + (dec>0 ? ','+f : '');
};
window.aed  = (n, dec=2) => (n<0?'−':'') + 'AED ' + fm(Math.abs(n), dec);
window.aedS = (n, dec=2) => (n>0?'+':n<0?'−':'') + 'AED ' + fm(Math.abs(n), dec);

/* ---- tiny templating helpers ---- */
window.esc = s => String(s).replace(/'/g,"\\'").replace(/"/g,'&quot;');

/* ---- app header ---- */
window.hdr = (title, opts={}) => `
  <div class="apphdr">
    ${opts.noback ? '<span class="sp"></span>' : `<button class="iconbtn" onclick="${opts.back||'A.back()'}" aria-label="Back">${ic('back',20)}</button>`}
    <div class="${opts.big?'h2':'h3'}">${title}</div>
    ${opts.right || '<span class="sp"></span>'}
  </div>`;

/* ---- bottom navigation ---- */
const NAV = [
  {r:'home',     ic:'home',   t:'Overview'},
  {r:'money',    ic:'wallet', t:'Money'},
  {r:'qr',       ic:'qr',     t:''},
  {r:'insights', ic:'pie',    t:'Insights'},
  {r:'goals',    ic:'target', t:'Goals'},
];
window.navbar = act => `
  <div class="navbar">
    ${NAV.map(n => n.r==='qr'
      ? `<button class="nav-qr" onclick="A.go('qr')" aria-label="Scan to pay">${ic('qr',24,'',2)}</button>`
      : `<button class="nav-it ${act===n.r?'active':''}" onclick="A.go('${n.r}')">${ic(n.ic,22)}<span>${n.t}</span></button>`).join('')}
  </div>`;

/* ---- charts ---- */
window.donut = (segs, size=130, thick=14, center='') => {
  const r=(size-thick)/2, C=2*Math.PI*r, total=segs.reduce((s,x)=>s+x.v,0)||1;
  let off=0;
  const circles = segs.map(s=>{
    const len = s.v/total*C;
    const el = `<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${s.c}" stroke-width="${thick}"
      stroke-dasharray="${Math.max(len-3,0)} ${C-len+3}" stroke-dashoffset="${-off}" stroke-linecap="round"/>`;
    off+=len; return el;
  }).join('');
  return `<div class="donut-wrap" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${thick}"/>${circles}</svg>
    <div class="donut-c">${center}</div></div>`;
};

window.spark = (arr, w=120, h=36, color='#D7F050', fill=true) => {
  const mn=Math.min(...arr), mx=Math.max(...arr), sp=mx-mn||1;
  const pts = arr.map((v,i)=>`${(i/(arr.length-1)*w).toFixed(1)},${(h-3-(v-mn)/sp*(h-8)).toFixed(1)}`);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${fill?`<polygon points="0,${h} ${pts.join(' ')} ${w},${h}" fill="${color}" opacity=".12"/>`:''}
    <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${w}" cy="${pts[pts.length-1].split(',')[1]}" r="3" fill="${color}"/></svg>`;
};

window.gaugeSemi = (pct, size=210, color='#D7F050', center='') => {
  const th=16, r=(size-th)/2, half=Math.PI*r;
  return `<div class="gauge-wrap" style="width:${size}px;height:${size/2+10}px;overflow:hidden">
    <svg width="${size}" height="${size/2+10}" viewBox="0 0 ${size} ${size/2+10}">
      <path d="M ${th/2} ${size/2+2} A ${r} ${r} 0 0 1 ${size-th/2} ${size/2+2}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="${th}" stroke-linecap="round"/>
      <path d="M ${th/2} ${size/2+2} A ${r} ${r} 0 0 1 ${size-th/2} ${size/2+2}" fill="none" stroke="${color}" stroke-width="${th}" stroke-linecap="round"
        stroke-dasharray="${half*pct} ${half}" />
    </svg><div class="gauge-c">${center}</div></div>`;
};

/* Apple-Watch-style concentric budget rings. defs: outer→inner [{p:0..1+, c}] */
window.rings = (defs, size=140, th=13, gap=5) => {
  let svg='';
  defs.forEach((d,i)=>{
    const r=(size/2)-th/2-i*(th+gap), C=2*Math.PI*r, p=Math.min(d.p,1);
    const col = d.p>1 ? 'var(--red)' : d.c;
    svg += `<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${d.p>1?'rgba(255,122,107,.18)':'rgba(255,255,255,.09)'}" stroke-width="${th}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${th}" stroke-linecap="round"
        stroke-dasharray="${Math.max(C*p-2,2)} ${C}"/>`;
  });
  return `<div style="position:relative;width:${size}px;height:${size}px;min-width:${size}px">
    <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">${svg}</svg>
    ${defs.some(d=>d.p>1)?`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px">⚠️</div>`:''}
  </div>`;
};

/* tap-tooltip: small ⓘ that explains a concept */
window.tipi = (msg) => `<span class="tipi" onclick="event.stopPropagation();A.tip('${esc(msg)}')">ⓘ</span>`;

window.meter = (pct, color='#D7F050') =>
  `<div class="meter"><i style="width:${Math.min(pct*100,100)}%;background:${color}"></i></div>`;

/* ---- category icon chip ---- */
window.catIc = (cat, s=44) => {
  const c = CATS[cat]||CATS.other;
  return `<span class="bigico" style="width:${s}px;height:${s}px;min-width:${s}px;background:${c.c}1f;color:${c.c}">${ic(c.ic, s*0.48)}</span>`;
};

/* ---- transaction row ---- */
window.rowTxn = t => `
  <div class="row" onclick="A.go('txn/${t.id}')">
    ${catIc(t.cat)}
    <div class="row-main"><div class="row-t">${t.m}</div><div class="row-d">${t.d}${t.note?' · '+t.note:''}</div></div>
    <div class="row-r"><div class="row-amt ${t.amt>0?'grn-t':''}">${aedS(t.amt)}</div>
    ${t.sub?'<div class="row-sub">Subscription</div>':t.rule?'<div class="row-sub lime-t">Rule</div>':''}</div>
  </div>`;

/* ---- count-up animation ---- */
window.countUp = (el, target, dec=2, dur=900) => {
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now-t0)/dur, 1), e = 1-Math.pow(1-p,3);
    el.textContent = fm(target*e, dec);
    if (p<1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

/* ---- confetti ---- */
window.confetti = (host, n=70) => {
  const cv = document.createElement('canvas'); cv.className='conf';
  const r = host.getBoundingClientRect(); cv.width=r.width; cv.height=r.height;
  host.appendChild(cv);
  const ctx = cv.getContext('2d');
  const cols=['#D7F050','#53DE8E','#E8C268','#6FB6FF','#FFFFFF','#B89CFF'];
  const ps = Array.from({length:n},()=>({x:cv.width/2+(Math.random()-.5)*120, y:cv.height*0.38,
    vx:(Math.random()-.5)*7, vy:-(4+Math.random()*7), g:.22+Math.random()*.1,
    s:4+Math.random()*5, c:cols[Math.random()*cols.length|0], a:Math.random()*Math.PI, va:(Math.random()-.5)*.3}));
  let f=0;
  (function loop(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.a+=p.va;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle=p.c; ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6); ctx.restore();});
    if (++f<110) requestAnimationFrame(loop); else cv.remove();
  })();
};

/* ---- iOS notification banner ---- */
window.iosNotif = (title, body, iconHtml, onTap) => {
  const host = document.getElementById('screen');
  const el = document.createElement('div'); el.className='iosnotif';
  el.innerHTML = `<div class="ni-ic">${iconHtml}</div><div class="f1"><div class="ni-t">${title}</div><div class="ni-b">${body}</div></div><div class="ni-time">now</div>`;
  if (onTap) el.onclick = () => { el.remove(); onTap(); };
  host.appendChild(el);
  setTimeout(()=>{ el.style.transition='all .4s'; el.style.transform='translateY(-130%)'; setTimeout(()=>el.remove(),420); }, 4200);
};
})();
