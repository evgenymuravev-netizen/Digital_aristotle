/* ============================================================
   TradePay — "precision instrument" interaction layer
   ============================================================ */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- masthead scrolled state ---------- */
  const masthead = $('#masthead');
  const onScroll = () => masthead.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const burger = $('#navBurger');
  const navIndex = $('.nav-index');
  burger.addEventListener('click', () => {
    const open = navIndex.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-index a').forEach((a) =>
    a.addEventListener('click', () => {
      navIndex.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    })
  );

  /* ---------- live Riyadh clock ---------- */
  const clock = $('[data-clock]');
  if (clock) {
    const tick = () => {
      try {
        const t = new Date().toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        clock.textContent = 'RIYADH ' + t;
      } catch (_) { /* tz unsupported */ }
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- ticker: duplicate for seamless marquee ---------- */
  const ticker = $('#ticker');
  if (ticker) ticker.innerHTML += ticker.innerHTML;

  /* ---------- set stagger delays ---------- */
  $$('[data-reveal-delay]').forEach((el) => el.style.setProperty('--rd', el.dataset.revealDelay));

  /* ---------- frontier chart draw ---------- */
  let frontierDrawn = false;
  const drawFrontier = () => {
    if (frontierDrawn) return;
    frontierDrawn = true;
    if (reduce) return;
    ['#frField', '#frEngine'].forEach((sel, i) => {
      const p = $(sel);
      if (!p) return;
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.transition = `stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1) ${i * 0.18}s`;
      requestAnimationFrame(() => requestAnimationFrame(() => { p.style.strokeDashoffset = '0'; }));
    });
    const gap = $('#frGap');
    if (gap) {
      gap.style.opacity = '0';
      gap.style.transition = 'opacity .5s ease 1s';
      requestAnimationFrame(() => requestAnimationFrame(() => { gap.style.opacity = '1'; }));
    }
  };

  /* ---------- bulletproof reveal (rAF scroll check) ---------- */
  const items = $$('.reveal, .mask, .rule, .display, .hero, .band, .paper, .system');
  if (reduce) {
    items.forEach((el) => el.classList.add('in'));
    drawFrontier();
  } else {
    let pending = items.slice();
    let ticking = false;
    const check = () => {
      ticking = false;
      const trigger = window.innerHeight * 0.88;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < trigger) {
          el.classList.add('in');
          if (el.classList.contains('frontier')) drawFrontier();
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', onReveal);
        window.removeEventListener('resize', onReveal);
      }
    };
    const onReveal = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    window.addEventListener('scroll', onReveal, { passive: true });
    window.addEventListener('resize', onReveal);
    check();
    setTimeout(check, 320); // safety net after fonts/layout settle
  }

  /* ---------- pinned chapters tracker ---------- */
  const arts = { 1: $('.art-1'), 2: $('.art-2'), 3: $('.art-3') };
  const roms = $$('.stage-rom span');
  const bar = $('#stageBar');
  const setChapter = (n) => {
    Object.entries(arts).forEach(([k, el]) => el && el.classList.toggle('on', k === String(n)));
    roms.forEach((r) => r.classList.toggle('on', r.dataset.rom === String(n)));
    if (bar) bar.style.width = (n / 3) * 100 + '%';
  };
  const chapters = $$('.chapter');
  if (chapters.length) {
    setChapter(1);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setChapter(e.target.dataset.chapter); }),
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );
    chapters.forEach((c) => obs.observe(c));
  }

  /* ---------- scrollspy: active nav link ---------- */
  const spy = $$('.nav-index a');
  const byId = {};
  spy.forEach((a) => { byId[a.getAttribute('href').slice(1)] = a; });
  const sections = Object.keys(byId).map((id) => document.getElementById(id)).filter(Boolean);
  if (sections.length) {
    const spyObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            spy.forEach((a) => a.classList.remove('active'));
            const a = byId[e.target.id];
            if (a) a.classList.add('active');
          }
        });
      },
      { rootMargin: '-18% 0px -72% 0px', threshold: 0 }
    );
    sections.forEach((s) => spyObs.observe(s));
  }

  /* ---------- solutions tabs (accessible) ---------- */
  const tabs = $$('.tab');
  if (tabs.length) {
    const panels = $$('.tabpanel');
    const activate = (id) => {
      tabs.forEach((t) => {
        const on = t.dataset.tab === id;
        t.classList.toggle('on', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => {
        const on = p.dataset.panel === id;
        p.classList.toggle('on', on);
        p.hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activate(t.dataset.tab));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = tabs[(i + dir + tabs.length) % tabs.length];
          activate(next.dataset.tab);
          next.focus();
        }
      });
    });
  }

  /* ---------- magnetic ---------- */
  if (!reduce && finePointer) {
    $$('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.28}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- pause hero SVG under reduced motion ---------- */
  if (reduce) {
    const s = $('#schematic');
    if (s && s.pauseAnimations) { try { s.pauseAnimations(); } catch (_) {} }
  }

  /* ---------- merchant app: subtle limit flicker ---------- */
  if (!reduce) {
    const amt = $('#phAmt');
    if (amt) {
      const states = ['18,000', '19,500', '18,000'];
      let i = 0;
      amt.style.transition = 'opacity .22s ease';
      setInterval(() => {
        i = (i + 1) % states.length;
        amt.style.opacity = '0.35';
        setTimeout(() => { amt.textContent = states[i]; amt.style.opacity = '1'; }, 220);
      }, 4200);
    }
  }

  /* ---------- contact form (demo) ---------- */
  const form = $('#contactForm');
  if (form) {
    const note = $('#formNote');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#cf-email');
      const name = $('#cf-name');
      note.classList.remove('err');
      if (!name.value.trim() || !email.value.trim() || !email.checkValidity()) {
        note.textContent = '// add a company and a valid work email';
        note.classList.add('err');
        return;
      }
      note.textContent = '✓ received — we’ll be in touch about your flow';
      form.querySelector('button').disabled = true;
    });
  }
})();
