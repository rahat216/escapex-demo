/* Case study detail template — renders ?case=<slug> from window.CASES */
(function () {
  'use strict';
  var C = window.CASES || {};
  var slugs = Object.keys(C);
  var q = new URLSearchParams(location.search).get('case');
  var c = C[q] || C[slugs[0]];
  if (!c) return;
  var $ = function (f) { return document.querySelector('[data-f="' + f + '"]'); };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  var set = function (f, v) { var e = $(f); if (e) e.textContent = v; };

  document.title = c.name + ' — Case Study | Escape X Marketing';
  set('name', c.name);
  set('channel', c.channel);
  set('title', c.fullname || c.name);
  set('location', c.location + ' — ' + c.summary);
  set('background', c.background);
  set('quote', '“' + c.quote + '”');
  set('author', c.author);
  set('role', c.role + ' · ' + c.location);

  $('kpis').innerHTML = c.kpis.map(function (k, i) {
    return '<div class="panel rivets stat"><div class="num' + (i % 2 ? ' cyan' : '') + '">' + esc(k[0]) + '</div><div class="lbl">' + esc(k[1]) + '</div></div>';
  }).join('');

  $('images').innerHTML = c.images.map(function (src) {
    return '<figure class="brass-frame" style="margin:0"><img src="' + src + '" alt="' + esc(c.name) + ' — campaign results screenshot" loading="lazy" onerror="this.closest(\'figure\').remove()"></figure>';
  }).join('');
  if (c.images.length === 1) $('images').style.gridTemplateColumns = '1fr';

  $('challenges').innerHTML = c.challenges.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');

  $('strategy').innerHTML = c.strategy.map(function (s, i) {
    var n = (i + 1 < 10 ? '0' : '') + (i + 1);
    return '<div class="step"><div class="knob"><span>' + n + '</span></div><div class="panel"><span class="tag">Lock ' + n + '</span><h3>' + esc(s[0]) + '</h3><p style="margin:0">' + esc(s[1]) + '</p></div></div>';
  }).join('');

  var res = '<span class="c">&gt; results.decrypt("' + esc(c.slug) + '")</span>\n';
  c.kpis.forEach(function (k) { res += '<span class="k">' + esc(k[1].toUpperCase()) + '</span>' + ' '.repeat(Math.max(1, 22 - k[1].length)) + '<span class="y">' + esc(k[0]) + '</span>\n'; });
  res += '\n' + c.results.map(esc).join('\n\n');
  $('results').innerHTML = res;

  $('more').innerHTML = slugs.filter(function (s) { return s !== c.slug; }).map(function (s) {
    var o = C[s];
    return '<a class="panel panel-glow" href="case-study-detail.html?case=' + s + '" style="display:block"><span class="loc">' + esc(o.location) + ' · ' + esc(o.channel) + '</span><h3>' + esc(o.name) + '</h3><p style="margin:0">' + esc(o.kpis[0][0]) + ' ' + esc(o.kpis[0][1]) + ' · ' + esc(o.kpis[1][0]) + ' ' + esc(o.kpis[1][1]) + '</p></a>';
  }).join('') + '<a class="panel panel-glow" href="case-studies.html" style="display:block"><span class="loc">All results</span><h3>Back to Case Studies</h3><p style="margin:0">See every breakout in one place.</p></a>';
})();
