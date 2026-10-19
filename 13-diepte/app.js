/* 13 Diepte: de doorvlucht. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
   Alles draait alleen als <html> de class «fx» heeft (zie de kop van de pagina); anders staat alles op zijn eindplek.
   Breed scherm: scrollen beweegt de camera (één custom transform op .world) door objecten op verschillende diepte; de dichtheid (opacity)
   volgt de afstand tot de camera. Smal scherm: gestapelde secties die één voor één uit de diepte komen. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  if (!root.classList.contains('fx')) return;
  window.__fx = 1;

  // 1. Hoofdkop: woord voor woord omhoog.
  $('.o-hero h1').forEach(function (h) {
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

  // 2. Gestapelde secties: onthullen bij scrollen (de CSS gebruikt dit alleen op smalle schermen).
  var rev = $('[data-r], .o-hero');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  // 3. De doorvlucht.
  var flight = document.getElementById('flight');
  if (!flight || !window.matchMedia) return;
  var stage = flight.querySelector('.stage'), world = flight.querySelector('.world');
  var mqFly = matchMedia('(min-width: 900px) and (min-height: 560px)');
  // diepte van elk station (px voor de camera); de afstanden groeien: elk paneel ligt verder dan het vorige
  var DEPTH = [0, 1500, 3100, 4800, 6600, 8500, 10500, 12500, 14100, 15700, 17300, 19300, 21200, 23200];
  var N = DEPTH.length;
  var LABEL = ['Begin', 'Aanbod', 'Aanbod', 'Aanbod', 'Aanbod', 'Aanbod', 'Werk', 'Werkwijze', 'Werkwijze', 'Werkwijze', 'Werkwijze', 'Afspraken', 'Voor wie', 'Contact'];
  var SEG = 0.86, TAIL = 0.7;        // scrollafstand per stuk (schermhoogtes) en rust aan het eind
  var items = [];
  var hudN = flight.querySelector('.hud-n'), hudT = flight.querySelector('.hud-t'), hudR = $('.hud-r li', flight), cue = flight.querySelector('.cue');

  $('.o', world).forEach(function (el) {
    items.push({ el: el, kind: 'o', s: +el.getAttribute('data-s') || 0, x: +el.getAttribute('data-x') || 0, y: +el.getAttribute('data-y') || 0,
      dz: +el.getAttribute('data-z') || 0, ry: +el.getAttribute('data-ry') || 0, far: +el.getAttribute('data-far') || 2800, a: -1, zw: 0 });
  });

  var W = 0, H = 0, flightTop = 0, flightH = 0, hh = 64, hold = 0;
  var tgt = 0, cur = 0, mx = 0, my = 0, rx = 0, ry = 0, t0 = 0, last = 0, raf = 0;
  var active = false, inView = true, decorBuilt = false, station = -1;

  // decor: kaders en kruisjes verspreid over de hele vlucht (vaste reeks, geen toeval)
  function buildDecor() {
    decorBuilt = true;
    var d = document.createElement('div');
    d.className = 'decor'; d.setAttribute('aria-hidden', 'true');
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var k, el;
    for (k = 0; k < 32; k++) {
      el = document.createElement('i'); el.className = 'deco-f';
      items.push({ el: el, kind: 'f', fw: 0.66 + 0.3 * ((k * 0.618) % 1), ox: (rnd() - 0.5) * 0.16, oy: (rnd() - 0.5) * 0.12, zw: -(260 + k * 740), far: 3600, a: -1 });
      d.appendChild(el);
    }
    for (k = 0; k < 44; k++) {
      el = document.createElement('i'); el.className = 'deco-t';
      var sx = (rnd() - 0.5) * 1.3, sy = (rnd() - 0.5) * 1.2;
      items.push({ el: el, kind: 't', ox: sx, oy: sy, sz: 12 + Math.round(rnd() * 12), zw: 300 - rnd() * 23800, far: 3000, a: -1 });
      d.appendChild(el);
    }
    world.appendChild(d);
  }

  function place(it) {
    var el = it.el;
    if (it.kind === 'o') {
      it.zw = -DEPTH[it.s] + it.dz;
      el.style.transform = 'translate3d(' + Math.round(it.x * W) + 'px,' + Math.round(it.y * H) + 'px,' + it.zw + 'px) translate(-50%,-50%)' + (it.ry ? ' rotateY(' + it.ry + 'deg)' : '');
    } else if (it.kind === 'f') {
      el.style.width = Math.round(W * it.fw) + 'px'; el.style.height = Math.round(H * it.fw) + 'px';
      el.style.transform = 'translate3d(' + Math.round(it.ox * W) + 'px,' + Math.round(it.oy * H) + 'px,' + it.zw + 'px) translate(-50%,-50%)';
    } else {
      el.style.width = el.style.height = it.sz + 'px';
      el.style.transform = 'translate3d(' + Math.round(it.ox * W) + 'px,' + Math.round(it.oy * H) + 'px,' + it.zw + 'px) translate(-50%,-50%)';
    }
    it.a = -1;
  }

  function measure() {
    W = stage.clientWidth; H = stage.clientHeight;
    var hd = document.querySelector('.top'); hh = hd ? hd.getBoundingClientRect().height : 64;
    var seg = Math.round(H * SEG), tail = Math.round(H * TAIL);
    flightH = seg * (N - 1) + tail + H;
    hold = tail / (flightH - H);
    flight.style.height = flightH + 'px';
    flightTop = flight.getBoundingClientRect().top + window.scrollY;
    items.forEach(place);
  }
  var startY = function () { return flightTop - hh; };
  var scrollFor = function (s) { return Math.round(startY() + (s / (N - 1)) * (1 - hold) * (flightH - H)); };
  var progress = function () { return clamp((window.scrollY - startY()) / Math.max(1, flightH - H), 0, 1); };

  // de camera blijft even stilstaan bij elk station (rustmoment), en glijdt er tussenin
  function camAt(p) {
    var t = clamp(p / (1 - hold), 0, 1) * (N - 1);
    var i = Math.min(N - 2, Math.floor(t)), f = t - i;
    var a = 0.2, b = 0.8, e = f <= a ? 0 : f >= b ? 1 : (function (u) { return u * u * (3 - 2 * u); })((f - a) / (b - a));
    return { z: DEPTH[i] + (DEPTH[i + 1] - DEPTH[i]) * e, t: i + e };
  }
  function alphaOf(d, far, near) {
    if (near && d > 20) return clamp(1 - (d - 20) / 220, 0, 1);
    if (d > 60) return clamp(1 - (d - 60) / 460, 0, 1);
    if (d > -240) return 1;
    var a = 1 - (-d - 240) / (far - 240);
    return a <= 0 ? 0 : Math.pow(a, 3.6);
  }

  function setStation(n) {
    station = n;
    items.forEach(function (it) { if (it.kind === 'o') it.el.classList.toggle('on', it.s === n); });
    if (hudN) hudN.textContent = String(n + 1).padStart(2, '0');
    if (hudT) hudT.textContent = LABEL[n];
    hudR.forEach(function (li, i) { li.classList.toggle('on', i === n); });
  }

  function render(intro) {
    var c = camAt(cur), camz = c.z - intro;
    world.style.transform = 'rotateX(' + rx.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg) translate3d(0,0,' + camz.toFixed(1) + 'px)';
    for (var i = 0; i < items.length; i++) {
      var it = items[i], a = alphaOf(it.zw + camz, it.far, it.kind !== 'o');
      if (Math.abs(a - it.a) > 0.004 || (a === 0) !== (it.a === 0)) {
        it.a = a; it.el.style.opacity = a.toFixed(3);
        if (it.kind !== 'o') it.el.style.visibility = a < 0.01 ? 'hidden' : 'visible';
      }
    }
    var n = Math.round(c.t);
    if (n !== station) setStation(n);
  }

  function frame(now) {
    raf = 0;
    if (!active) return;
    var dt = Math.min(64, last ? now - last : 16); last = now;
    var k = 1 - Math.pow(1 - 0.13, dt / 16.7), moving = false;
    var dp = tgt - cur;
    if (Math.abs(dp) > 0.00012) { cur += dp * k; moving = true; } else cur = tgt;
    var ddx = mx * 2.3 - ry, ddy = -my * 1.5 - rx;
    if (Math.abs(ddx) > 0.01 || Math.abs(ddy) > 0.01) { ry += ddx * k * 0.6; rx += ddy * k * 0.6; moving = true; }
    var it = (now - t0) / 2600, intro = 0;
    if (it < 1) { intro = 2000 * Math.pow(1 - it, 3); moving = true; }
    if (inView) render(intro);
    if (moving) request(); else last = 0;
  }
  function request() { if (!raf && active) raf = requestAnimationFrame(frame); }

  function enable() {
    active = true;
    if (!decorBuilt) buildDecor();
    measure();
    tgt = cur = progress();
    t0 = performance.now(); station = -1;
    world.classList.add('ready');
    request();
  }
  function disable() {
    active = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    world.classList.remove('ready');
    world.style.transform = '';
    flight.style.height = '';
    items.forEach(function (it) { it.el.style.transform = ''; it.el.style.opacity = ''; it.el.style.visibility = ''; it.el.classList.remove('on'); });
  }

  window.addEventListener('scroll', function () {
    if (!active) return;
    tgt = progress();
    if (cue && window.scrollY > 40) cue.classList.add('off');
    request();
  }, { passive: true });
  var rz = 0;
  window.addEventListener('resize', function () {
    if (rz) cancelAnimationFrame(rz);
    rz = requestAnimationFrame(function () { rz = 0; if (active) { measure(); tgt = progress(); request(); } });
  });
  window.addEventListener('load', function () { if (active) { measure(); tgt = progress(); request(); } });
  var onMq = function () { if (mqFly.matches) enable(); else disable(); };
  if (mqFly.addEventListener) mqFly.addEventListener('change', onMq); else if (mqFly.addListener) mqFly.addListener(onMq);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) request(); }).observe(flight);
  }

  // Muis: de camera draait licht mee (alleen met een echte muis).
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.addEventListener('pointermove', function (ev) {
      var r = stage.getBoundingClientRect();
      mx = clamp((ev.clientX - r.left) / r.width * 2 - 1, -1, 1); my = clamp((ev.clientY - r.top) / r.height * 2 - 1, -1, 1);
      request();
    }, { passive: true });
    stage.addEventListener('pointerleave', function () { mx = 0; my = 0; request(); });
  }

  // Links naar een onderdeel (#aanbod …): vlieg erheen. Toetsenbord: wie een link in een ander station focust, komt daar ook aan.
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a || !active) return;
    var tgtEl = document.getElementById(a.getAttribute('href').slice(1));
    var s = tgtEl && tgtEl.getAttribute('data-s');
    if (s == null) return;
    ev.preventDefault();
    window.scrollTo({ top: scrollFor(+s), behavior: 'smooth' });
    var h = '#' + a.getAttribute('href').slice(1);
    if (location.hash !== h) { try { history.pushState(null, '', h); } catch (e) { /* bestand zonder geschiedenis: de hash blijft zoals hij was */ } }
  });
  // Terugknop of een gedeelde link met #onderdeel: vlieg naar dat station.
  var toHash = function (instant) {
    if (!active || location.hash.length < 2) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    var s = el && el.getAttribute('data-s');
    if (s == null) return;
    window.scrollTo({ top: scrollFor(+s), behavior: instant ? 'instant' : 'smooth' });
    if (instant) { tgt = cur = progress(); request(); }
  };
  window.addEventListener('hashchange', function () { toHash(false); });
  flight.addEventListener('focusin', function (ev) {
    if (!active) return;
    var o = ev.target.closest && ev.target.closest('.o');
    if (!o) return;
    var s = +o.getAttribute('data-s');
    if (s === station && Math.abs(tgt - cur) < 0.02) return;
    window.scrollTo({ top: scrollFor(s), behavior: 'instant' });
    tgt = cur = progress();
    request();
  });

  if (mqFly.matches) { enable(); toHash(true); window.addEventListener('load', function () { toHash(true); }); }
})();
