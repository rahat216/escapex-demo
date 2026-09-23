/* Escape X Marketing — shared site behaviour */
(function () {
  'use strict';
  var d = document, b = d.body;
  d.documentElement.classList.remove('no-js');

  // Mobile nav
  var burger = d.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = b.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && b.classList.contains('nav-open')) { b.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1020) b.classList.remove('nav-open'); });
  }

  // Dropdown (click toggles on touch / small screens; hover handles desktop)
  d.querySelectorAll('.dd-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var dd = btn.parentElement;
      var open = !dd.classList.contains('open');
      d.querySelectorAll('.dd.open').forEach(function (x) { x.classList.remove('open'); x.querySelector('.dd-toggle').setAttribute('aria-expanded', 'false'); });
      dd.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      e.stopPropagation();
    });
  });
  d.addEventListener('click', function (e) {
    if (!e.target.closest('.dd')) d.querySelectorAll('.dd.open').forEach(function (x) { x.classList.remove('open'); x.querySelector('.dd-toggle').setAttribute('aria-expanded', 'false'); });
  });

  // Header: clean at the top, aurora glass after scrolling
  var hdr = d.querySelector('.site-header');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Reveal on scroll
  var rev = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rev.forEach(function (x) { io.observe(x); });
  } else rev.forEach(function (x) { x.classList.add('in'); });

  // Count-up numbers: <span data-count="4.33" data-decimals="2" data-prefix="$" data-suffix="x">
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nums = d.querySelectorAll('[data-count]');
  function run(elm) {
    var to = parseFloat(elm.dataset.count), dec = parseInt(elm.dataset.decimals || '0', 10);
    var pre = elm.dataset.prefix || '', suf = elm.dataset.suffix || '';
    if (reduce) { elm.textContent = pre + to.toFixed(dec) + suf; return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur); k = 1 - Math.pow(1 - k, 3);
      elm.textContent = pre + (to * k).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io2.unobserve(en.target); } });
    }, { threshold: 0.4 });
    nums.forEach(function (x) { io2.observe(x); });
  } else nums.forEach(run);

  // Year
  d.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
