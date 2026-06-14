// Tradepay marketing site — interactions (minimal edition)
(function () {
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { nav.classList.toggle('open'); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') nav.classList.remove('open'); });
  }

  // sticky topbar hairline on scroll
  var topbar = document.getElementById('topbar');
  function onScroll() { if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // segmented journey tabs (merchant / distributor)
  document.querySelectorAll('#jseg button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#jseg button').forEach(function (b) { b.classList.toggle('on', b === btn); });
      document.querySelectorAll('.jpanel').forEach(function (p) {
        p.classList.toggle('on', p.getAttribute('data-jp') === btn.getAttribute('data-j'));
      });
    });
  });

  // evolution era scrubber
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
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }
})();
