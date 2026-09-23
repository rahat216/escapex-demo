/*!
 * scroll-world.js — full-page scroll-scrubbed cinematic backdrop (vanilla, no deps)
 * The film sits fixed behind the whole page; scrolling ANYWHERE on the page drives
 * video.currentTime. Each clip owns the stretch of page between its anchor and the next.
 *
 * mountScrollWorld({
 *   sections: [{ label, clip, clipMobile, still, anchor: '#services' }],  // first anchor = page top
 *   timer: { from: 3600 },   // escape-room countdown, reaches 00:00 at the bottom of the page
 *   rail: true,              // chapter buttons (jump to anchors)
 *   crossfade: 0.4           // viewport-heights used to blend one clip into the next
 * })
 *
 * Kept from the original engine: blob-loaded clips (seekable on any host, file:// fallback),
 * rAF smoothing + seek-coalescing, stills as posters until first paint, iOS priming on first
 * touch, prefers-reduced-motion (static still), URL-bar-safe resize.
 */
(function (global) {
  'use strict';
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  function mountScrollWorld(cfg) {
    var S = cfg.sections || [], N = S.length;
    if (!N) return;
    var mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
    var reduced = mm('(prefers-reduced-motion: reduce)');
    var isMobile = mm('(max-width: 860px), (pointer: coarse)');
    var CF = cfg.crossfade == null ? 0.4 : cfg.crossfade;
    var doc = document.documentElement;
    doc.classList.add('has-backdrop');

    var stage = el('div', 'bd-stage');
    stage.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(stage, document.body.firstChild);

    var layers = S.map(function (s, i) {
      var L = el('div', 'bd-layer');
      var img = new Image(); img.src = s.still; img.alt = ''; img.decoding = 'async';
      L.appendChild(img);
      var v = null;
      if (!reduced) {
        v = document.createElement('video');
        v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
        v.tabIndex = -1;
        L.appendChild(v);
      }
      stage.appendChild(L);
      return { el: L, v: v, dur: 8, target: 0, ready: false, loaded: false };
    });
    stage.appendChild(el('div', 'bd-tint'));
    stage.appendChild(el('div', 'bd-veil'));
    stage.appendChild(el('div', 'bd-crt'));
    var flash = el('div', 'bd-flash'); stage.appendChild(flash);

    // HUD — room label, countdown, progress
    var hud = el('div', 'bd-hud',
      (cfg.timer ? '<span class="bd-timer"><small>TIME LEFT</small><b>60:00</b></span>' : '') +
      '<i class="bd-progress"><i></i></i>');
    document.body.appendChild(hud);
    var timerEl = hud.querySelector('.bd-timer');
    var timerB = timerEl && timerEl.querySelector('b'), progI = hud.querySelector('.bd-progress i');

    var railBtns = [];
    if (cfg.rail) {
      var rail = el('nav', 'bd-rail'); rail.setAttribute('aria-label', 'Film chapters');
      railBtns = S.map(function (s, i) {
        var b = el('button'); b.type = 'button'; b.innerHTML = '<span>' + s.label + '</span>';
        b.setAttribute('aria-label', 'Jump to ' + s.label);
        b.addEventListener('click', function () { window.scrollTo({ top: i === 0 ? 0 : anchorEl(i).getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); });
        rail.appendChild(b); return b;
      });
      document.body.appendChild(rail);
    }

    if (reduced) { layers[0].el.style.opacity = 1; return; }

    // ---------- Geometry (anchors re-measured on resize / load / periodically) ----------
    var vh = window.innerHeight, lastW = window.innerWidth, A = [], END = 1;
    function anchorEl(i) { return S[i].anchor ? document.querySelector(S[i].anchor) : null; }
    function measure() {
      vh = window.innerHeight;
      END = Math.max(1, doc.scrollHeight - vh);
      A = S.map(function (s, i) {
        if (i === 0) return 0;
        var e = anchorEl(i);
        // a clip takes over when its section's top reaches the middle of the screen
        return e ? clamp(e.getBoundingClientRect().top + window.scrollY - vh * 0.5, 1, END - 1) : END * i / N;
      });
      A.push(END);
    }
    measure();
    window.addEventListener('load', measure);
    window.addEventListener('resize', function () {
      if (isMobile && window.innerWidth === lastW) return; // ignore URL-bar resizes
      lastW = window.innerWidth; measure();
    });
    window.addEventListener('orientationchange', function () { setTimeout(function () { lastW = window.innerWidth; measure(); }, 250); });
    setInterval(measure, 1500); // late images / fonts / accordions change page height

    // ---------- Loading ----------
    function load(i) {
      var L = layers[i];
      if (!L || L.loaded) return Promise.resolve();
      L.loaded = true;
      var url = (isMobile || cfg.lite) && S[i].clipMobile ? S[i].clipMobile : S[i].clip;
      var attach = function (src) {
        return new Promise(function (res) {
          L.v.addEventListener('loadedmetadata', function () { L.dur = L.v.duration || 8; res(); }, { once: true });
          L.v.addEventListener('error', function () { res(); }, { once: true });
          L.v.src = src; L.v.load();
        });
      };
      L.v.addEventListener('seeked', function () { if (!L.ready && L.v.readyState >= 2) { L.ready = true; L.v.classList.add('ready'); } });
      L.v.addEventListener('loadeddata', function () { L.v.currentTime = Math.max(0.001, L.target); });
      return (location.protocol === 'file:' || !window.fetch)
        ? attach(url)
        : fetch(url).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
            .then(function (b) { return attach(URL.createObjectURL(b)); })
            .catch(function () { return attach(url); });
    }
    (function chain(i) { if (i < N) load(i).then(function () { chain(i + 1); }); })(0);

    var primed = false;
    window.addEventListener('touchstart', function () {
      if (primed) return; primed = true;
      layers.forEach(function (L) { try { var p = L.v.play(); if (p && p.then) p.then(function () { L.v.pause(); }).catch(function () {}); } catch (e) {} });
    }, { passive: true, once: true });

    // ---------- Frame loop ----------
    var y = window.scrollY, lastRoom = -1, from = cfg.timer ? (cfg.timer.from || 3600) : 0;
    function frame() {
      y += (window.scrollY - y) * 0.18;
      if (Math.abs(window.scrollY - y) < 0.5) y = window.scrollY;
      var cf = CF * vh, active = 0, f = 0;
      for (var i = 0; i < N; i++) {
        var a = A[i], b = A[i + 1], L = layers[i];
        var local = clamp((y - a) / Math.max(1, b - a), 0, 1);
        L.target = local * Math.max(0, L.dur - 0.05);
        var op = i === 0 ? 1 : smooth((y - a) / cf);
        L.el.style.opacity = op;
        L.el.style.visibility = op <= 0.001 ? 'hidden' : 'visible';
        if (y >= a) active = i;
        if (i > 0) f = Math.max(f, 1 - clamp(Math.abs(y - (a + cf * 0.5)) / (cf * 0.7), 0, 1));
        if (L.v && L.v.readyState >= 1 && op > 0 && !L.v.seeking && Math.abs(L.v.currentTime - L.target) > 1 / 48) {
          try { L.v.currentTime = L.target; } catch (e) {}
        }
      }
      flash.style.opacity = (f * f * 0.8).toFixed(3);
      if (active !== lastRoom) {
        lastRoom = active;
        railBtns.forEach(function (bt, k) { bt.classList.toggle('on', k === active); });
      }
      var p = clamp(y / END, 0, 1);
      if (timerB) {
        var left = Math.max(0, Math.round(from * (1 - p))), done = p > 0.985;
        timerB.textContent = done ? 'ESCAPED' : pad(Math.floor(left / 60)) + ':' + pad(left % 60);
        timerEl.classList.toggle('done', done);
      }
      progI.style.width = (p * 100).toFixed(2) + '%';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  global.mountScrollWorld = mountScrollWorld;
})(window);
