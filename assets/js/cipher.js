/* "Solve Your Growth Cipher" — 4-lock booking form
 * Submission: set data-endpoint="https://…" on #cipher (e.g. Formspree, HubSpot, your own API)
 * to POST the form. Without an endpoint it falls back to opening a pre-filled email to data-mailto.
 */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Title decode (glitch) effect — every character keeps the exact width of its final
  // glyph while scrambling, so the line never grows, wraps or jumps.
  document.querySelectorAll('[data-scramble]').forEach(function (el) {
    if (reduce) return;
    var final = el.textContent, glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@', frame = 0;
    el.textContent = '';
    var cells = final.split('').map(function (ch) {
      var s = document.createElement('span');
      s.textContent = ch;
      s.style.display = 'inline-block';
      s.style.whiteSpace = 'pre';
      el.appendChild(s);
      return s;
    });
    var start = function () {
      cells.forEach(function (s) {        // lock each cell to its real width
        s.style.width = s.getBoundingClientRect().width + 'px';
        s.style.textAlign = 'center';
        s.style.overflow = 'hidden';
        s.style.verticalAlign = 'bottom';
      });
      var t = setInterval(function () {
        frame++;
        cells.forEach(function (s, i) {
          var ch = final[i];
          s.textContent = (ch === ' ' || i < frame / 3) ? ch : glyphs[Math.floor(Math.random() * glyphs.length)];
        });
        if (frame / 3 > final.length) {  // done: back to plain text
          clearInterval(t);
          el.textContent = final;
        }
      }, 40);
    };
    // wait for the web font so the measured widths are the final ones
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  });

  var form = document.getElementById('cipher');
  if (!form) return;
  var steps = [].slice.call(form.querySelectorAll('.lock'));
  var dials = [].slice.call(form.querySelectorAll('.dial'));
  var next = form.querySelector('[data-next]');
  var back = form.querySelector('[data-back]');
  var err = form.querySelector('[data-err]');
  var bar = form.querySelector('[data-bar]');
  var label = form.querySelector('[data-steplabel]');
  var roman = ['I', 'II', 'III', 'IV'];
  var code = dials.map(function () { return Math.floor(Math.random() * 10); });
  var cur = 0;

  var range = form.querySelector('#f-budget');
  var out = form.querySelector('[data-budget-out]');
  function paintRange() {
    var v = +range.value, p = (v - range.min) / (range.max - range.min) * 100;
    range.style.setProperty('--p', p + '%');
    out.textContent = '$' + v.toLocaleString('en-US') + (v >= +range.max ? '+' : '');
  }
  range.addEventListener('input', paintRange); paintRange();

  function show(i) {
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    dials.forEach(function (d, k) { d.classList.toggle('current', k === i); });
    back.hidden = i === 0;
    next.innerHTML = (i === steps.length - 1 ? 'Unlock the Vault' : 'Crack Lock ' + roman[i]) + ' <span class="arrow">→</span>';
    label.textContent = 'LOCK ' + roman[i] + ' / IV';
    bar.style.width = (i / steps.length * 100) + '%';
    err.textContent = '';
    var first = steps[i].querySelector('input:not([type=radio]):not([type=checkbox]),select,textarea');
    if (first && cur !== i) setTimeout(function () { first.focus({ preventScroll: true }); }, 50);
    cur = i;
  }

  function validate(i) {
    var s = steps[i], ok = true, msg = '';
    s.querySelectorAll('.invalid').forEach(function (x) { x.classList.remove('invalid'); });
    s.querySelectorAll('input[required]:not([type=checkbox]),select[required],textarea[required]').forEach(function (inp) {
      var bad = !inp.value.trim() || (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim()));
      if (bad) { inp.classList.add('invalid'); inp.setAttribute('aria-invalid', 'true'); if (ok) inp.focus(); ok = false; }
      else inp.removeAttribute('aria-invalid');
    });
    if (!ok) msg = 'Wrong combination — check the highlighted fields.';
    if (ok && i === 2 && !s.querySelector('input[name=channels]:checked')) { ok = false; msg = 'Select at least one tool to crack this lock.'; }
    var consent = s.querySelector('input[name=consent]');
    if (ok && consent && !consent.checked) { ok = false; consent.closest('.consent').classList.add('invalid'); msg = 'Please accept the Privacy Policy to continue.'; }
    if (!ok) {
      err.textContent = msg;
      if (!reduce) { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
    }
    return ok;
  }

  function solve(i) {
    var d = dials[i];
    d.querySelector('span').textContent = code[i];
    d.classList.remove('spin'); void d.offsetWidth; d.classList.add('spin');
    d.classList.add('solved');
  }

  next.addEventListener('click', function () {
    if (!validate(cur)) return;
    solve(cur);
    if (cur < steps.length - 1) show(cur + 1);
    else submit();
  });
  back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); next.click(); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });

  function data() {
    var fd = new FormData(form), o = {};
    fd.forEach(function (v, k) { o[k] = o[k] ? o[k] + ', ' + v : v; });
    o.budget = out.textContent;
    return o;
  }

  function granted(o, note) {
    steps.forEach(function (s) { s.hidden = true; });
    form.querySelector('[data-nav]').hidden = true;
    dials.forEach(function (d) { d.classList.remove('current'); });
    bar.style.width = '100%';
    label.textContent = 'CODE ' + code.join('') + ' · SOLVED';
    var g = form.querySelector('[data-granted]');
    g.querySelector('[data-summary]').textContent =
      '\nAGENT     ' + o.name + '\nVENUE     ' + o.business + (o.city ? ' — ' + o.city : '') +
      '\nTOOLS     ' + (o.channels || '—') + '\nBUDGET    ' + o.budget + '/mo\nGOAL      ' + (o.goal || '—') + '\n' + (note ? '\n' + note + '\n' : '');
    g.hidden = false;
  }

  function submit() {
    var o = data();
    var endpoint = form.dataset.endpoint;
    next.disabled = true;
    if (endpoint) {
      fetch(endpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (r) { if (!r.ok) throw 0; granted(o); })
        .catch(function () { next.disabled = false; err.textContent = 'The vault jammed — please try again or email us directly.'; });
      return;
    }
    // No endpoint configured: open a pre-filled email
    var body = Object.keys(o).filter(function (k) { return k !== 'consent'; }).map(function (k) { return k.toUpperCase() + ': ' + o[k]; }).join('\n');
    var href = 'mailto:' + form.dataset.mailto + '?subject=' + encodeURIComponent('Free strategy call — ' + (o.business || o.name)) + '&body=' + encodeURIComponent(body);
    granted(o, 'Your email app is opening with these details — hit send to finish.');
    window.location.href = href;
  }

  show(0);
})();
