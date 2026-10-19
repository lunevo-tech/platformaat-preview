/* 10 Vlak: kleurvlakken die over elkaar vegen, de scrollgestuurde kleurwissel met bladen, zwevende vorm bij de cases,
   schuine lopende banden. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
   Alles draait alleen als <html> de class «fx» heeft (zie de kop van de pagina); anders staat alles op zijn eindplek. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* menu voor tablet en gsm (ook zonder effecten) */
  var mbtn = document.querySelector('.menu-btn'), mpanel = document.getElementById('menu');
  if (mbtn && mpanel) {
    var setMenu = function (open, back) {
      mpanel.classList.toggle('open', open);
      mbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open && back) mbtn.focus({ preventScroll: true });
    };
    mbtn.addEventListener('click', function () { setMenu(!mpanel.classList.contains('open')); });
    mpanel.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && mpanel.classList.contains('open')) setMenu(false, true); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1100) setMenu(false); });
  }

  if (!root.classList.contains('fx')) return;
  window.__fx = 1;

  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var fine = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  if (fine) root.classList.add('hl');

  /* ---------- kopregels: woorden in een masker, per regel dezelfde vertraging ---------- */
  var splits = $('[data-lines]');
  splits.forEach(function (el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'), i = document.createElement('span');
            o.className = 'w'; i.className = 'wi'; i.textContent = t;
            o.appendChild(i); frag.appendChild(o);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    el.classList.add('split');
  });
  function indexLines() {
    var rects = splits.map(function (el) { return $('.w', el).map(function (w) { return Math.round(w.getBoundingClientRect().top); }); });
    splits.forEach(function (el, k) {
      var tops = rects[k], sorted = tops.slice().sort(function (a, b) { return a - b; }), uniq = [];
      sorted.forEach(function (t) { if (!uniq.length || t - uniq[uniq.length - 1] > 6) uniq.push(t); });
      $('.wi', el).forEach(function (wi, j) {
        var line = 0;
        for (var u = 0; u < uniq.length; u++) if (tops[j] - uniq[u] > -7) line = u;
        wi.style.setProperty('--l', line);
      });
    });
  }
  indexLines();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(indexLines);

  /* ---------- onthullen bij scrollen ---------- */
  var els = $('[data-r], [data-lines]');
  var reveal = function (list) {
    list.sort(function (a, b) { var x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return (x.top - y.top) || (x.left - y.left); })
      .forEach(function (el, k) { el.style.setProperty('--i', k); el.classList.add('in'); });
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      vis.forEach(function (e) { io.unobserve(e.target); });
      reveal(vis.map(function (e) { return e.target; }));
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { reveal(els); }

  /* ---------- geometrie van de vastgepinde delen ---------- */
  var vl = { sec: document.querySelector('.vl-stage'), pin: document.querySelector('.vlaken'), panels: $('.vlak'), top: 0, dist: 0, p: 0, cur: 0, vh: 0 };
  var wx = { sec: document.querySelector('.wissel'), bg: document.querySelector('.wx-bg'), sheets: $('.sheet'), top: 0, dist: 0, p: 0, cur: 0, vh: 0 };
  var toneEls = $('[data-tone]').filter(function (el) { return !el.classList.contains('vlak') && !el.classList.contains('lead'); });
  var tones = [];
  function measure() {
    var vh = window.innerHeight;
    if (vl.sec) {
      vl.sec.style.height = '';
      vl.vh = vl.pin.offsetHeight;
      vl.dist = (vl.panels.length - 1) * vl.vh * 1.15;
      vl.sec.style.height = Math.round(vl.vh + vl.dist) + 'px';
      vl.top = vl.sec.getBoundingClientRect().top + window.scrollY;
    }
    if (wx.sec) {
      wx.sec.style.height = '';
      wx.vh = wx.sec.querySelector('.wx-stage').offsetHeight;
      wx.dist = wx.vh * 4.6;
      wx.sec.style.height = Math.round(wx.vh + wx.dist) + 'px';
      wx.top = wx.sec.getBoundingClientRect().top + window.scrollY;
    }
    tones = toneEls.map(function (el) { return { el: el, top: el.getBoundingClientRect().top + window.scrollY, tone: el.getAttribute('data-tone') }; });
    tones.sort(function (a, b) { return a.top - b.top; });
    vl.vh = vl.vh || vh;
  }

  var curTone = '';
  function setTone(t) {
    if (t && t !== curTone) { curTone = t; root.setAttribute('data-tone', t); }
  }
  function toneNow() {
    var y = window.scrollY, probe = y + window.innerHeight * 0.38, t = 'cream';
    tones.forEach(function (r) { if (r.top <= probe) t = r.tone; });
    if (vl.sec && probe >= vl.top && probe < vl.top + vl.vh + vl.dist + 1) {
      var act = 0;
      vl.panels.forEach(function (pn, i) { if (i === 0 || (+pn.getAttribute('data-t') || 0) > 0.5) act = i; });
      t = vl.panels[act].getAttribute('data-tone');
    }
    if (wx.sec && probe >= wx.top && probe < wx.top + wx.vh + wx.dist) t = wx.p < 0.11 ? 'cream' : 'warm';
    setTone(t);
  }

  /* ---------- vlakken die over elkaar vegen ---------- */
  function vlFrame() {
    var target = clamp((window.scrollY - vl.top) / (vl.dist || 1), 0, 1), busy = false;
    if (fine) { vl.cur += (target - vl.cur) * 0.14; if (Math.abs(target - vl.cur) < 0.0004) vl.cur = target; else busy = true; } else vl.cur = target;
    vl.p = vl.cur;
    var n = vl.panels.length - 1;
    vl.panels.forEach(function (pn, i) {
      if (!i) return;
      var s = vl.p * n - (i - 1), t = ease(clamp(s / 0.8, 0, 1));
      if (Math.abs(t - (pn._t === undefined ? -1 : pn._t)) > 0.0005) { pn._t = t; pn.style.setProperty('--t', t.toFixed(4)); pn.setAttribute('data-t', t.toFixed(3)); }
    });
    return busy;
  }

  /* ---------- kleurwissel: cirkelmasker groeit, daarna stapelen de bladen ---------- */
  function wxFrame() {
    var target = clamp((window.scrollY - wx.top) / (wx.dist || 1), 0, 1), busy = false;
    if (fine) { wx.cur += (target - wx.cur) * 0.14; if (Math.abs(target - wx.cur) < 0.0004) wx.cur = target; else busy = true; } else wx.cur = target;
    var p = wx.p = wx.cur;
    var r = ease(clamp(p / 0.15, 0, 1)) * 146;
    if (Math.abs(r - (wx.r === undefined ? -1 : wx.r)) > 0.05) { wx.r = r; wx.bg.style.setProperty('--r', r.toFixed(2)); }
    var s = wx.sheets.map(function (_, i) { return ease(clamp((p - (0.2 + i * 0.19)) / 0.17, 0, 1)); });
    wx.sheets.forEach(function (sh, i) {
      var b = s[i + 1] || 0;
      if (Math.abs(s[i] - (sh._s === undefined ? -1 : sh._s)) > 0.0005) { sh._s = s[i]; sh.style.setProperty('--s', s[i].toFixed(4)); }
      if (Math.abs(b - (sh._b === undefined ? -1 : sh._b)) > 0.0005) { sh._b = b; sh.style.setProperty('--b', b.toFixed(4)); }
    });
    return busy;
  }

  /* ---------- lopende banden: sneller bij snel scrollen, pauze buiten beeld ---------- */
  var bands = $('.bands');
  var bandAnims = [];
  var rate = 1;
  if ('IntersectionObserver' in window) {
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('off', !e.isIntersecting); });
    }, { rootMargin: '100px 0px' });
    bands.forEach(function (b) { bio.observe(b); });
  }

  /* ---------- hero: de vlakken verschuiven licht, elk op eigen diepte ---------- */
  var art = document.querySelector('.hero-art');
  $('.ly').forEach(function (g) { g.style.setProperty('--d', g.getAttribute('data-d')); });
  var hero = document.querySelector('.hero');
  var pm = { x: 0, y: 0, tx: 0, ty: 0 };
  if (fine && hero) {
    hero.addEventListener('pointermove', function (ev) {
      var r = hero.getBoundingClientRect();
      pm.tx = (ev.clientX - r.left) / r.width * 2 - 1; pm.ty = (ev.clientY - r.top) / r.height * 2 - 1; wake();
    });
  }

  /* ---------- cases: een vorm met tekstlogo volgt de cursor ---------- */
  var flo = document.querySelector('.flo'), cases = document.querySelector('.cases');
  var fx = { x: -300, y: -300, tx: -300, ty: -300, on: -1 };
  if (fine && flo && cases) {
    var shapes = $('.flo-s', flo);
    $('.case[data-flo]', cases).forEach(function (row) {
      var i = +row.getAttribute('data-flo');
      row.addEventListener('pointerenter', function () {
        fx.on = i; cases.classList.add('has-hover');
        shapes.forEach(function (s, k) { s.classList.toggle('on', k === i); });
        wake();
      });
      row.addEventListener('pointerleave', function () { fx.on = -1; shapes.forEach(function (s) { s.classList.remove('on'); }); cases.classList.remove('has-hover'); });
    });
    $('.case--next', cases).forEach(function (row) {
      row.addEventListener('pointerenter', function () { cases.classList.add('has-hover'); });
      row.addEventListener('pointerleave', function () { cases.classList.remove('has-hover'); });
    });
    document.addEventListener('pointermove', function (ev) { fx.tx = ev.clientX; fx.ty = ev.clientY; if (fx.on >= 0) wake(); }, { passive: true });
  }

  /* ---------- één lus ---------- */
  var running = false, lastY = window.scrollY, vel = 0;
  function tick() {
    running = false;
    var y = window.scrollY, dy = y - lastY; lastY = y;
    vel += (Math.abs(dy) - vel) * 0.2;
    var again = false;
    if (vl.sec && y > vl.top - vl.vh && y < vl.top + vl.vh + vl.dist + vl.vh) { if (vlFrame()) again = true; }
    if (wx.sec && y > wx.top - wx.vh && y < wx.top + wx.vh + wx.dist + wx.vh) { if (wxFrame()) again = true; }
    toneNow();
    var want = 1 + clamp(vel / 7, 0, 5);
    if (Math.abs(want - rate) > 0.03 || (want === 1 && rate !== 1)) {
      rate += (want - rate) * 0.25; if (Math.abs(rate - 1) < 0.03) rate = 1;
      if (!bandAnims.length) bandAnims = $('.bd-track').map(function (t) { return t; });
      bandAnims.forEach(function (t) { t.getAnimations().forEach(function (a) { a.updatePlaybackRate(rate); }); });
      again = true;
    }
    if (vel > 0.05) again = true;
    if (art) {
      art.style.setProperty('--sy', Math.round(Math.min(y, 2000)));
      pm.x += (pm.tx - pm.x) * 0.1; pm.y += (pm.ty - pm.y) * 0.1;
      art.style.setProperty('--mx', pm.x.toFixed(3)); art.style.setProperty('--my', pm.y.toFixed(3));
      if (Math.abs(pm.tx - pm.x) > 0.002 || Math.abs(pm.ty - pm.y) > 0.002) again = true;
    }
    if (flo && fine) {
      var px = fx.x;
      fx.x += (fx.tx - fx.x) * 0.2; fx.y += (fx.ty - fx.y) * 0.2;
      flo.style.transform = 'translate3d(' + fx.x.toFixed(1) + 'px,' + fx.y.toFixed(1) + 'px,0)';
      if (fx.on >= 0) {
        var s = flo.children[fx.on];
        if (s) s.style.setProperty('--rot', clamp((fx.x - px) * 0.9, -14, 14).toFixed(1) + 'deg');
        if (Math.abs(fx.tx - fx.x) > 0.3 || Math.abs(fx.ty - fx.y) > 0.3) again = true;
      }
    }
    if (again) { running = true; requestAnimationFrame(tick); }
  }
  function wake() { if (!running) { running = true; requestAnimationFrame(tick); } }
  window.addEventListener('scroll', wake, { passive: true });

  var rt = 0, lastW = window.innerWidth;
  var relayout = function () {
    measure();
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; indexLines(); }
    vl.cur = clamp((window.scrollY - vl.top) / (vl.dist || 1), 0, 1);
    wx.cur = clamp((window.scrollY - wx.top) / (wx.dist || 1), 0, 1);
    if (vl.sec) vlFrame();
    if (wx.sec) wxFrame();
    toneNow();
    wake();
  };
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 120); });
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  if ('ResizeObserver' in window) {
    var rbusy = 0;
    new ResizeObserver(function () { clearTimeout(rbusy); rbusy = setTimeout(relayout, 150); }).observe(document.body);
  }
  relayout();
})();
