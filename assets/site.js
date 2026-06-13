// Tradepay marketing site — interactions
(function () {
  // mobile nav
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { nav.classList.toggle('open'); });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('open');
    });
  }

  // journey tabs (merchant / distributor)
  document.querySelectorAll('.jtabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.jtabs button').forEach(function (b) { b.classList.toggle('on', b === btn); });
      document.querySelectorAll('.jpanel').forEach(function (p) {
        p.classList.toggle('on', p.getAttribute('data-jp') === btn.getAttribute('data-j'));
      });
    });
  });

  // evolution era tabs
  document.querySelectorAll('#evoTabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#evoTabs button').forEach(function (b) { b.classList.toggle('on', b === btn); });
      document.querySelectorAll('.evo-panel').forEach(function (p) {
        p.classList.toggle('on', p.getAttribute('data-evop') === btn.getAttribute('data-evo'));
      });
    });
  });

  // reveal on scroll
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  // narrow screens: strategy grid stacks
  function stack() {
    var g = document.getElementById('stratGrid');
    if (g) g.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1.2fr .8fr';
  }
  window.addEventListener('resize', stack); stack();
})();
