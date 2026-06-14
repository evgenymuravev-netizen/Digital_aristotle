/* ============================================================
   TradePay — interaction layer
   ============================================================ */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- nav: scrolled state ---------- */
  const nav = $('#nav');
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const toggle = $('#navToggle');
  const links = $('.nav-links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-links a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );

  /* ---------- reveal on scroll ----------
     Bulletproof, rAF-throttled scroll check (never strands content the way a
     missed IntersectionObserver entry can during fast/programmatic scrolling). */
  $$('.reveal[data-reveal-delay]').forEach((el) =>
    el.style.setProperty('--rd', el.dataset.revealDelay)
  );

  const revealEls = $$('.reveal');
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    let pending = revealEls.slice();
    let ticking = false;
    const checkReveals = () => {
      ticking = false;
      const trigger = window.innerHeight * 0.9;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < trigger) {
          el.classList.add('in');
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', onReveal);
        window.removeEventListener('resize', onReveal);
      }
    };
    const onReveal = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(checkReveals); }
    };
    window.addEventListener('scroll', onReveal, { passive: true });
    window.addEventListener('resize', onReveal);
    checkReveals();          // reveal whatever is already in view on load
    setTimeout(checkReveals, 300); // safety net after fonts/layout settle
  }

  /* ---------- count-up stats ---------- */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (reduceMotion || target === 0) {
      el.textContent = prefix + target.toLocaleString() + suffix;
      return;
    }
    const dur = 1100;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = prefix + val.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const countObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  $$('.stat .num[data-count]').forEach((el) => countObs.observe(el));

  /* ---------- sticky three-chapters tracker ---------- */
  const chapters = $$('.chapter');
  const visuals = { 1: $('.cv-1'), 2: $('.cv-2'), 3: $('.cv-3') };
  const indices = $$('.ch-index .ci');

  const setChapter = (n) => {
    Object.entries(visuals).forEach(([k, el]) => {
      if (el) el.classList.toggle('active', k === String(n));
    });
    indices.forEach((ci) => ci.classList.toggle('on', ci.dataset.ci === String(n)));
  };

  if (chapters.length) {
    setChapter(1);
    const chapterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setChapter(e.target.dataset.chapter);
        });
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );
    chapters.forEach((c) => chapterObs.observe(c));
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('[data-magnetic]').forEach((btn) => {
      const strength = 0.32;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });

    /* ---------- ambient glow follows cursor ---------- */
    const glow = $('#glow');
    let gx = window.innerWidth * 0.8;
    let gy = 0;
    let tx = gx;
    let ty = gy;
    let raf = null;
    const loop = () => {
      gx += (tx - gx) * 0.08;
      gy += (ty - gy) * 0.08;
      glow.style.left = gx + 'px';
      glow.style.top = gy + 'px';
      if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    };
    window.addEventListener(
      'mousemove',
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        glow.style.transition = 'none';
        if (!raf) raf = requestAnimationFrame(loop);
      },
      { passive: true }
    );
  }

  /* ---------- pause hero SVG animations under reduced motion ---------- */
  if (reduceMotion) {
    const railSvg = $('#railSvg');
    if (railSvg && railSvg.pauseAnimations) {
      try { railSvg.pauseAnimations(); } catch (_) {}
    }
  }

  /* ---------- live merchant-app amount flicker (subtle) ---------- */
  if (!reduceMotion) {
    const amount = $('#appAmount');
    if (amount) {
      const states = ['18,000', '19,500', '18,000'];
      let i = 0;
      setInterval(() => {
        i = (i + 1) % states.length;
        amount.style.opacity = '0.35';
        setTimeout(() => {
          amount.textContent = states[i];
          amount.style.opacity = '1';
        }, 220);
      }, 4200);
      amount.style.transition = 'opacity 0.22s ease';
    }
  }

  /* ---------- contact form (no backend; graceful demo) ---------- */
  const form = $('#contactForm');
  if (form) {
    const note = $('#formNote');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#cf-email');
      const name = $('#cf-name');
      note.classList.remove('err');
      if (!name.value.trim() || !email.value.trim() || !email.checkValidity()) {
        note.textContent = '// please add a company and a valid work email';
        note.classList.add('err');
        return;
      }
      note.textContent = '✓ thank you — we’ll be in touch about your flow';
      form.querySelector('button').disabled = true;
    });
  }

  /* ---------- year (footer) is static 2026; nothing to do ---------- */
})();
