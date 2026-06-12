/* ============ app shell: state · router · sidebar · boot ============ */
(function(){
const TABS = ['home','money','pay','insights','goals'];
const LS_KEY = 'noorProtoV1';

window.A = {
  S:{ onboarded:false, linked:[], hideBal:false, frozen:false },
  tmp:{}, stack:[], route:null, _scn:null, _hashLock:false,

  persist(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(this.S)); }catch(e){} },
  load(){ try{ const v=JSON.parse(localStorage.getItem(LS_KEY)); if(v) this.S=Object.assign(this.S,v); }catch(e){} },
  ensureApp(){ this.S.onboarded=true; this.S.linked=['fab','wio','ei','careem','tabby','binance']; this.persist(); },
  ensureFresh(){ this.S.onboarded=false; this.S.linked=[]; this.persist(); },

  /* ---------- routing ---------- */
  go(route, replace=false){
    if(route==='chat-card'){ Chat.reset(); this.tmp.chatScript='findCard'; route='chat'; }
    if(route==='chat-ps5'){ Chat.reset(); this.tmp.chatScript='ps5'; route='chat'; }
    if(this.route && !replace && this.route!==route) this.stack.push(this.route);
    if(this.stack.length>30) this.stack.shift();
    this.route=route; this.render(); this.syncHash();
  },
  back(){
    const p=this.stack.pop();
    if(p){ this.route=p; this.render(false,true); this.syncHash(); }
    else this.go(this.S.onboarded?'home':'welcome', true);
  },
  refresh(){
    const scr=document.querySelector('#screen .scr'); const st=scr?scr.scrollTop:0;
    this.render(true);
    const scr2=document.querySelector('#screen .scr'); if(scr2) scr2.scrollTop=st;
  },
  render(noAnim=false, isBack=false){
    this.closeSheet(); if(window.Story && Story.timer){ Story.close(); }
    const [name, ...rest]=this.route.split('/');
    const param=decodeURIComponent(rest.join('/'));
    const fn=SCREENS[name]||SCREENS.home;
    const host=document.getElementById('screen');
    host.querySelectorAll('.iosnotif').forEach(n=>n.remove());
    host.innerHTML=fn(param);
    const scr=host.querySelector('.scr');
    if(scr){ if(noAnim) scr.style.animation='none'; else if(isBack) scr.classList.add('back-anim'); }
    /* status bar tone */
    document.getElementById('statusbar').classList.toggle('dark-sb', !!(scr&&scr.classList.contains('light')));
    /* bottom nav + AI fab */
    const tab=TABS.includes(name);
    document.getElementById('navHost').innerHTML = tab?navbar(name):'';
    document.body.classList.toggle('show-fab', tab && this.S.onboarded!==false);
    if(AFTER[name]) try{ AFTER[name](param); }catch(e){ console.warn(e); }
    /* Arabic / RTL pass */
    host.classList.toggle('rtl', this.S.lang==='ar');
    if(this.S.lang==='ar'){ applyAr(host); applyAr(document.getElementById('navHost')); }
  },
  syncHash(){
    if(this._running) return;                     /* scenario sets one #s/N hash at the end instead */
    const h='#/'+this.route; if(location.hash===h) return;
    this._scn=null;
    this._hashLock=true; location.hash=h; setTimeout(()=>this._hashLock=false,0);
  },
  setHash(h){ if(location.hash===h) return; this._hashLock=true; location.hash=h; setTimeout(()=>this._hashLock=false,0); },

  /* ---------- sheets / toasts / confirm ---------- */
  sheet(html){
    const lt=document.querySelector('#screen .scr.light');
    const host=document.getElementById('sheetHost');
    host.classList.add('on');
    host.innerHTML=`<div class="sheet-back" onclick="A.closeSheet()"></div>
      <div class="sheet ${lt?'lt':''}" ${this.S.lang==='ar'?'style="direction:rtl"':''}><div class="sheet-grab"></div>${html}</div>`;
    if(this.S.lang==='ar') applyAr(host);
  },
  closeSheet(){ const h=document.getElementById('sheetHost'); h.classList.remove('on'); h.innerHTML=''; },
  confirm(title, body, fn){
    this._cf=fn;
    this.sheet(`<div class="h2">${title}</div><div class="sub mt8">${body}</div>
      <div class="btnrow mt16">
        <button class="btn ghost" onclick="A.closeSheet()">Cancel</button>
        <button class="btn danger" onclick="A.closeSheet();A._cf&&A._cf()">Confirm</button>
      </div>`);
  },
  toast(msg, icon='check'){
    const host=document.getElementById('screen');
    host.querySelectorAll('.toastp').forEach(t=>t.remove());
    const el=document.createElement('div'); el.className='toastp';
    el.innerHTML=`<span style="color:var(--lime)">${ic(icon,18)}</span><span>${t(msg)}</span>`;
    host.appendChild(el);
    setTimeout(()=>{ el.style.transition='all .35s'; el.style.opacity='0'; el.style.transform='translate(-50%,-12px)'; setTimeout(()=>el.remove(),360); },2600);
  },

  /* ---------- scenarios ---------- */
  run(no){
    const s=SCN_FLAT[no-1]; if(!s) return;
    this._scn=no; this.tmp={}; this.stack=[]; CN.replica=false;
    if(s.prep==='fresh') this.ensureFresh(); else this.ensureApp();
    this._running=true;
    try{ if(typeof s.run==='function') s.run(); else this.go(s.run, true); }
    finally{ this._running=false; }
    this.setHash('#s/'+no);
    this.markScn(no);
    document.body.classList.remove('side-open');
    const cap=document.getElementById('caption');
    if(cap) cap.innerHTML=`<span class="cap-no">#${no}</span> · <b>${s.t}</b> — ${s.d} <span style="opacity:.6">(${s.group})</span>`;
  },
  markScn(no){
    document.querySelectorAll('.scn-item').forEach(el=>{
      const n=+el.dataset.no;
      el.classList.toggle('active', n===no);
      if(n===no) el.classList.add('seen');
    });
    const act=document.querySelector('.scn-item.active');
    if(act) act.scrollIntoView({block:'nearest'});
  },
  filterScenarios(q){
    q=(q||'').toLowerCase();
    document.querySelectorAll('.scn-group').forEach(g=>{
      let any=false;
      g.querySelectorAll('.scn-item').forEach(it=>{
        const hit=!q || it.textContent.toLowerCase().includes(q);
        it.style.display=hit?'':'none'; if(hit) any=true;
      });
      g.style.display=any?'':'none';
      if(q) g.classList.remove('closed');
    });
  },

  /* ---------- demo controls ---------- */
  demoReset(){ try{ localStorage.removeItem(LS_KEY); }catch(e){} location.hash=''; location.reload(); },
  demoOnboard(){ this.ensureFresh(); this.tmp={}; this.stack=[]; this._scn=null; this.go('splash', true); },
  demoSkip(){ this.ensureApp(); this.tmp={}; this.stack=[]; this.go('home', true); },
};

/* ---------- chat deep-link glue ---------- */
window.chatDeep = (script) => { Chat.reset(); A.tmp.chatScript=script; if(A.route==='chat') A.refresh(); else A.go('chat'); };
AFTER.chat = () => {
  Chat.mount();
  const s=A.tmp.chatScript; A.tmp.chatScript=null;
  if(s) setTimeout(()=>Chat.play(s, true), 250);
  else if(!CHAT.msgs.length) setTimeout(()=>Chat.play('hello'), 250);
};

/* ---------- sidebar ---------- */
function buildSidebar(){
  const host=document.getElementById('scnList');
  host.innerHTML = SCN_GROUPS.map(g=>`
    <div class="scn-group">
      <div class="scn-group-h" onclick="this.parentElement.classList.toggle('closed')">
        <span>${g.g}</span><span class="cnt">${g.items.length}</span>
      </div>
      <div class="scn-items">
        ${g.items.map(it=>`
          <div class="scn-item" data-no="${it.no}" onclick="A.run(${it.no})">
            <span class="scn-no">${it.no}</span>
            <div><div class="scn-t">${it.t}</div><div class="scn-d">${it.d}</div></div>
          </div>`).join('')}
      </div>
    </div>`).join('');
  const c=document.getElementById('scnCount'); if(c) c.textContent=SCN_FLAT.length;
}

/* ---------- phone scaling ---------- */
function fitPhone(){
  if(document.documentElement.classList.contains('kioskroot')) return;
  if(window.innerWidth<=560) return;
  const stage=document.getElementById('stage'), phone=document.getElementById('phone'), wrap=document.getElementById('phoneWrap');
  const availH=stage.clientHeight-70, availW=stage.clientWidth-30;
  const s=Math.min(availH/852, availW/393, 1.06);
  phone.style.transform=`scale(${s})`; phone.style.transformOrigin='top left';
  wrap.style.width=393*s+'px'; wrap.style.height=852*s+'px';
}

/* ---------- boot ---------- */
function handleHash(){
  const h=location.hash||'';
  if(h.startsWith('#s/')){
    const n=parseInt(h.slice(3),10);
    if(n===A._scn) return true;                /* already running — never re-enter */
    if(SCN_FLAT[n-1]){ A.run(n); return true; }
  }
  if(h.startsWith('#/')){
    const r=decodeURIComponent(h.slice(2));
    if(r===A.route) return true;               /* already there */
    const fresh=/^(splash|welcome|ob-|connect-)/.test(r);
    fresh ? A.ensureFresh() : A.ensureApp();
    if(/^(connect-)/.test(r)) A.S.linked=[], A.persist();
    A.go(r, true); return true;
  }
  return false;
}
window.addEventListener('hashchange', ()=>{ if(!A._hashLock) handleHash(); });
window.addEventListener('resize', fitPhone);

document.addEventListener('DOMContentLoaded', ()=>{
  A.load(); buildSidebar(); fitPhone();
  if(!handleHash()){
    if(A.S.onboarded) A.go('home', true);
    else A.go('splash', true);
  }
});
})();
