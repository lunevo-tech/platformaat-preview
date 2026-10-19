/* 08 Zak: alle beweging. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies, geen lus (alles volgt de scrollpositie).
   De beweging draait alleen als <html> de class «fx» heeft (zie de kop van de pagina); anders staat alles op zijn eindplek. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* Menu op een smal scherm: knop met aria-expanded, Escape sluit, werkt ook zonder effecten. */
  var mb = document.querySelector('.menu-btn'), mn = document.getElementById('menu');
  if (mb && mn) {
    var setMenu = function (open, back) {
      mn.classList.toggle('open', open); mb.setAttribute('aria-expanded', open ? 'true' : 'false'); mb.textContent = open ? 'Sluiten' : 'Menu';
      if (!open && back) mb.focus();
    };
    mb.addEventListener('click', function () { setMenu(!mn.classList.contains('open')); });
    mn.addEventListener('click', function (ev) { if (ev.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && mn.classList.contains('open')) setMenu(false, true); });
    document.addEventListener('click', function (ev) { if (mn.classList.contains('open') && !ev.target.closest('.top')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 760 && mn.classList.contains('open')) setMenu(false); });
  }

  if (!root.classList.contains('fx')) return;
  window.__fx = 1;

  /* 1. Hoofdkop: woord voor woord omhoog. */
  $('.hero h1').forEach(function (h) {
    var idx = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'), i = document.createElement('span');
            o.className = 'w'; i.className = 'wi'; i.style.setProperty('--w', idx++); i.textContent = t;
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h);
    h.classList.add('split');
  });

  /* 2. Zachte onthullingen. */
  var els = $('[data-r], .hero-k, .hero-row');
  var reveal = function (list) {
    list.sort(function (a, b) { var x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return (x.top - y.top) || (x.left - y.left); })
      .forEach(function (el, k) {
        el.style.setProperty('--i', k + (el.closest('.hero') ? 5 : 0));
        el.classList.add('in');
        setTimeout(function () { el.classList.add('done'); }, 2400);
      });
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      vis.forEach(function (e) { io.unobserve(e.target); });
      reveal(vis.map(function (e) { return e.target; }));
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { reveal(els); }

  var mq = window.matchMedia('(max-width: 760px)');

  /* 3. De telefoon: vastgepind. Scrollen stuurt draaien, inzoomen en het wisselen van het scherm. */
  var stage = document.querySelector('.stage');
  var drawStage = function () {};
  var geomStage = function () {};
  if (stage) {
    var view = stage.querySelector('.view'), wrap = stage.querySelector('.phone-wrap'), reel = stage.querySelector('.reel');
    var rings = stage.querySelector('.rings'), nds = $('.nd', stage), lis = $('.layers li', stage), ticks = $('.rail i', stage);
    var N = lis.length, PH = 740;
    var G = { H: 900, W: 1440, m: false, smax: 1 };
    var lastKey = '', lastIdx = -1;
    view.style.perspective = '1800px';

    geomStage = function () {
      G.W = view.clientWidth; G.H = view.clientHeight; G.m = mq.matches;
      G.smax = G.m ? Math.min(1, G.H * 0.5 / PH) : Math.min(1, (G.H - 110) / PH);
      G.R = G.m ? 0 : Math.min(330, G.W * 0.23);
    };
    drawStage = function (vh) {
      var r = stage.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var total = Math.max(1, r.height - vh);
      var p = clamp(-r.top / total, 0, 1);
      var u = seg(p, 0.03, 0.97);
      var f = u * N, k = Math.min(N - 1, Math.floor(f)), fr = f - k;
      var fe = k + (k < N - 1 ? ease(seg(fr, 0.68, 1)) : 0);   // stilstaan, dan een sprong naar het volgende scherm
      var idx = clamp(Math.round(fe), 0, N - 1);

      // telefoon: draait heen en weer, zoomt licht in
      var ry = 15 * Math.cos(Math.PI * fe) + 5 * Math.sin(Math.PI * f);
      var rx = 4 * Math.cos(Math.PI * f);
      var rz = -2 + 2 * Math.cos(Math.PI * fe);
      var sc = G.smax * lerp(0.82, 1, ease(u));
      var rise = (1 - ease(seg(p, 0, 0.06))) * G.H * 0.1;
      if (G.m) ry *= 0.6;
      wrap.style.transform = 'translate3d(0,' + rise.toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
      reel.style.transform = 'translate3d(0,' + (-fe * 20).toFixed(3) + '%,0)';

      // ringen en vijf punten: het actieve punt wijst naar de tekst
      var rs = lerp(0.8, 1.15, u) * (G.m ? 0.5 : 1);
      rings.style.transform = 'scale(' + rs.toFixed(3) + ') rotate(' + (-fe * 72 * 0.2).toFixed(2) + 'deg)';
      if (!G.m) nds.forEach(function (nd, i) {
        var a = (i - fe) * 72;
        nd.style.transform = 'rotate(' + a.toFixed(2) + 'deg) translateX(' + G.R.toFixed(0) + 'px) rotate(' + (-a).toFixed(2) + 'deg)';
      });

      // tekst per onderdeel
      var key = idx + '';
      if (key !== lastKey) {
        lastKey = key;
        lis.forEach(function (li, j) { li.classList.toggle('on', j === idx); li.classList.toggle('past', j < idx); });
        ticks.forEach(function (t, j) { t.classList.toggle('on', j === idx); });
        nds.forEach(function (nd, j) { nd.classList.toggle('on', j === idx); });
      }
    };
  }

  /* 4. Horizontale rij: scrollen schuift zijwaarts. */
  var hz = document.querySelector('.hz');
  var drawHz = function () {};
  var geomHz = function () {};
  if (hz) {
    var pin = hz.querySelector('.hz-pin'), track = hz.querySelector('.hz-track'), cards = $('.hz-c', hz), bar = hz.querySelector('.hz-bar i');
    var H = { dist: 0 }, lastOn = -1;
    geomHz = function () {
      var vw = window.innerWidth, vh = window.innerHeight;
      H.dist = Math.max(0, track.scrollWidth - vw);
      hz.style.height = Math.round(vh + H.dist * 1.15) + 'px';
    };
    drawHz = function (vh) {
      var r = hz.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      var x = -p * H.dist;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      bar.style.setProperty('--p', p.toFixed(4));
      var mid = window.innerWidth * 0.5, on = 0, best = 1e9;
      cards.forEach(function (c, i) {
        var b = c.getBoundingClientRect(), d = Math.abs(b.left + Math.min(b.width, window.innerWidth * 0.5) * 0.5 - mid * 0.7);
        if (d < best) { best = d; on = i; }
      });
      if (on !== lastOn) { lastOn = on; cards.forEach(function (c, i) { c.classList.toggle('on', i === on); }); }
    };
  }

  /* Eén rAF per scroll- of resize-gebeurtenis; geen lus. */
  var queued = false;
  var frame = function () {
    queued = false;
    var vh = window.innerHeight;
    drawStage(vh); drawHz(vh);
  };
  var ask = function () { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  var geom = function () { geomStage(); geomHz(); };
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', function () { geom(); ask(); });
  geom();
  frame();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { geom(); ask(); });
})();
