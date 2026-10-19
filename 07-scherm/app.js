/* 07 Scherm: alle beweging. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies, geen lus (alles volgt de scrollpositie).
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

  /* 2. Zachte onthullingen. Wie tegelijk in beeld komt, volgt elkaar op. */
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

  /* 3. Grote kop: de woorden worden donkerder naarmate je scrolt. */
  var fills = $('.fill').map(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.textContent = '';
    var spans = words.map(function (w, i) {
      var s = document.createElement('span');
      s.className = 'fw'; s.textContent = w; h.appendChild(s);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
      return s;
    });
    return { el: h, spans: spans, last: [] };
  });
  var drawFill = function (vh) {
    fills.forEach(function (F) {
      var r = F.el.getBoundingClientRect();
      var p = clamp((vh * 0.86 - r.top) / (vh * 0.46 + r.height), 0, 1), n = F.spans.length;
      F.spans.forEach(function (s, k) {
        var f = Math.round(clamp(p * (n + 3) - k, 0, 1) * 50) / 50;
        if (F.last[k] !== f) { F.last[k] = f; s.style.setProperty('--f', f); }
      });
    });
  };

  /* 4. Werkwijze: de lijn volgt je scrollpositie, een stap licht op als de lijn hem bereikt. */
  var ws = document.querySelector('.wsteps');
  var wl = ws && ws.querySelector('.wline i');
  var wst = ws ? $('.wstep', ws) : [];
  var drawFlow = function (vh) {
    if (!ws) return;
    var r = ws.getBoundingClientRect(), read = vh * 0.62;
    wl.style.setProperty('--p', clamp((read - r.top - 14) / Math.max(1, r.height - 28), 0, 1).toFixed(4));
    wst.forEach(function (s) {
      var d = s.querySelector('.w-dot').getBoundingClientRect();
      s.classList.toggle('on', d.top + d.height / 2 <= read);
    });
  };

  /* 5. De scène: een getekend venster van vijf lagen, vastgepind. Scrollen stuurt kantelen, uit elkaar halen, dichtklappen en inzoomen. */
  var stage = document.querySelector('.stage');
  var drawStage = function () {};
  var geom = function () {};
  if (stage) {
    var view = stage.querySelector('.view'), obj = stage.querySelector('.obj');
    var plates = $('.plate', obj), lbls = $('.lbl', stage), lis = $('.layers li', stage), caps = $('.cap', stage), ticks = $('.rail i', stage);
    var rail = stage.querySelector('.rail'), layers = stage.querySelector('.layers');
    var rows = $('.rows li', stage), p0 = plates[0], p3 = plates[3], p4 = plates[4];
    var PW = 1000, PH = 640, PERSP = 1800, N = plates.length, RX = 72, RZ = -32;
    var mq = window.matchMedia('(max-width: 760px)');
    var rad = function (d) { return d * Math.PI / 180; };
    var G = { W: 0, H: 0 };
    view.style.perspective = PERSP + 'px';

    // Plaats van een punt (x, y, z in de eigen eenheden van het venster) op het scherm, relatief aan het midden van het beeld.
    var proj = function (x, y, z, st) {
      x *= st.sc; y *= st.sc; z *= st.sc;
      var c = Math.cos(st.rz), s = Math.sin(st.rz);
      var x1 = x * c - y * s, y1 = x * s + y * c;
      var cx = Math.cos(st.rx), sx = Math.sin(st.rx);
      var y2 = y1 * cx - z * sx, z2 = y1 * sx + z * cx;
      var k = PERSP / (PERSP - z2);
      return [(x1 + st.tx) * k, (y2 + st.ty) * k];
    };
    var corners = [[-PW / 2, -PH / 2], [PW / 2, -PH / 2], [PW / 2, PH / 2], [-PW / 2, PH / 2]];
    var bbox = function (st, gap) {
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (var i = 0; i < N; i++) corners.forEach(function (c) {
        var q = proj(c[0], c[1], (N - 1 - i) * gap, st);
        x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
      });
      return { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
    };

    geom = function () {
      var W = view.clientWidth, H = view.clientHeight, m = mq.matches;
      G.W = W; G.H = H; G.m = m;
      G.gap = m ? 320 : 260;
      G.lift = m ? 50 : 70;
      // dichtgeklapt: vlak voor je
      G.sc0 = Math.min(W * 0.9, m ? 600 : 720) / PW;
      G.ty0 = m ? H * 0.07 : H * 0.07;
      // uit elkaar: past in het vak naast de tekst (desktop) of boven de tekst (gsm)
      var aw = m ? W * 0.94 : W * 0.36, ah = m ? H * 0.5 : H * 0.8;
      var cx = m ? 0 : W * 0.115, cy = m ? -H * 0.17 : H * 0.03;
      var st = { sc: 1, rx: rad(RX), rz: rad(RZ - 3), tx: 0, ty: 0 };
      var b = bbox(st, G.gap);
      st.sc = Math.min(aw / b.w, ah / b.h);
      for (var k = 0; k < 3; k++) { b = bbox(st, G.gap); st.tx += cx - b.cx; st.ty += cy - b.cy; }
      G.scE = st.sc; G.txE = st.tx; G.tyE = st.ty;
      // ingezoomd: het scherm vult het beeld
      G.scZ = m ? W * 0.98 / 390 : Math.min(W * 0.96 / PW, (H - 56 - 110) / PH);
      G.txZ = m ? 75 * G.scZ : 0;
      G.tyZ = m ? -30 * G.scZ : -27;
    };

    var wasFlat = null, shownIdx = -9, shownSt = '', lastOn = [], lastCk = -1;
    drawStage = function (vh) {
      var r = stage.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var total = Math.max(1, r.height - vh);
      var p = clamp(-r.top / total, 0, 1);
      var m = G.m;
      // fasen
      var t = ease(seg(p, 0.1, 0.24)) * (1 - ease(seg(p, 0.72, 0.83)));   // kantelen en uit elkaar
      var z = ease(seg(p, 0.83, 1));                                      // inzoomen
      var u = seg(p, 0.24, 0.72);                                         // door de vijf lagen
      var f = clamp(u * N - 0.5, 0, N - 1);
      var idx = clamp(Math.floor(u * N), 0, N - 1);
      var show = t > 0.55 && p < 0.75;

      var sc = lerp(lerp(G.sc0, G.scE, t), G.scZ, z);
      var tx = lerp(G.txE * t, G.txZ, z);
      var ty = lerp(lerp(G.ty0, G.tyE, t), G.tyZ, z);
      var rx = RX * t, rz = (RZ - 6 * u) * t;
      var st = { sc: sc, rx: rad(rx), rz: rad(rz), tx: tx, ty: ty };
      // Dichtgeklapt of ingezoomd: gewone 2D-transformatie, zodat de tekst scherp getekend wordt. Alleen uit elkaar getrokken gebruikt 3D.
      var flat = t < 0.002;
      if (flat !== wasFlat) { wasFlat = flat; view.style.perspective = flat ? 'none' : PERSP + 'px'; obj.style.transformStyle = flat ? 'flat' : ''; }
      if (flat) obj.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + sc.toFixed(4) + ')';
      else obj.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg) scale3d(' + sc.toFixed(4) + ',' + sc.toFixed(4) + ',' + sc.toFixed(4) + ')';

      var gap = G.gap * t, vh2 = G.H / 2, vw2 = G.W / 2;
      plates.forEach(function (pl, i) {
        var a = Math.max(0, 1 - Math.abs(i - f));
        var zi = (N - 1 - i) * (gap + 1) + G.lift * t * a;
        pl.style.transform = flat ? 'none' : 'translateZ(' + zi.toFixed(1) + 'px)';
        if (i > 0) pl.style.visibility = t > 0.002 ? 'visible' : 'hidden';
        pl.style.setProperty('--v', (0.42 * t * (1 - a)).toFixed(3));
        var on = t > 0.4 && p < 0.76 && i === idx;
        if (lastOn[i] !== on) { lastOn[i] = on; pl.classList.toggle('is-on', on); }
        // label bij de rechterhoek van elke laag
        if (!m && lbls[i]) {
          var L = lbls[i];
          if (t < 0.02) { L.style.opacity = 0; return; }
          var best = null;
          corners.forEach(function (c) {
            var q = proj(c[0], c[1], zi, st);
            if (!best || q[0] > best[0]) best = q;
          });
          L.style.transform = 'translate(' + (best[0] + vw2 + 26).toFixed(1) + 'px,' + (best[1] + vh2).toFixed(1) + 'px)';
          L.style.opacity = (clamp((t - 0.5) * 3, 0, 1) * 1).toFixed(2);
          L.classList.toggle('on', i === idx);
        }
      });

      // tekst per laag
      var key = (show ? idx : -1) + '|' + (p > 0.5 ? 1 : 0);
      if (key !== shownIdx) {
        shownIdx = key;
        lis.forEach(function (li, k) {
          li.classList.toggle('on', show && k === idx);
          li.classList.toggle('past', show ? k < idx : p > 0.5);
        });
        ticks.forEach(function (tk, k) { tk.classList.toggle('on', show && k === idx); });
      }
      rail.style.opacity = clamp((t - 0.5) * 3, 0, 1).toFixed(2);

      // korte regels per scène
      var c0 = 1 - seg(p, 0.05, 0.1);
      var c1 = seg(p, 0.775, 0.805) * (1 - seg(p, 0.84, 0.87));
      var c2 = seg(p, 0.9, 0.935);
      [c0, c1, c2].forEach(function (o, k) {
        caps[k].style.opacity = o.toFixed(2);
        caps[k].style.transform = 'translateY(' + ((k === 0 ? -(1 - o) : (1 - Math.min(1, o * 2.2))) * 26).toFixed(1) + 'px)';
      });

      // het scherm vult zich in terwijl de camera inzoomt
      var n = Math.floor(seg(p, 0.87, 0.985) * (rows.length + 1) + 0.0001);
      if (n !== lastCk) {
        lastCk = n;
        rows.forEach(function (li, k) { li.classList.toggle('ck', k < n); });
        p0.classList.toggle('done-ck', n > rows.length);
      }
      p0.style.setProperty('--bw', (0.42 + 0.58 * clamp(z * 1.6, 0, 1)).toFixed(3));

      // koppelingen en bewaking volgen de scrollpositie
      if (t > 0.02) {
        var d = [p * 9 % 1, (p * 9 + 0.33) % 1, (p * 9 + 0.66) % 1], nm = ['a', 'b', 'c'];
        d.forEach(function (x, k) {
          p3.style.setProperty('--f' + nm[k], x.toFixed(3));
          p3.style.setProperty('--o' + nm[k], Math.sin(Math.PI * x).toFixed(2));
        });
        p4.style.setProperty('--hb', (1 - seg(p, 0.5, 0.7)).toFixed(3));
      }
    };
  }

  /* Eén rAF per scroll- of resize-gebeurtenis; geen lus. */
  var queued = false;
  var frame = function () {
    queued = false;
    var vh = window.innerHeight;
    drawFill(vh); drawFlow(vh); drawStage(vh);
  };
  var ask = function () { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', function () { geom(); ask(); });
  geom();
  frame();
})();
