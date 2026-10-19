/* 09 Lijn: menu, intro, kopregels, zijwaartse panelen, lopende banden en cursorlabel. Gewone JavaScript, geen bibliotheek,
   geen externe verzoeken, geen cookies. Het menu werkt ook zonder effecten; al het andere draait alleen als <html> de class «fx» heeft. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var fx = root.classList.contains('fx');

  /* ---------- menu (ook zonder effecten) ---------- */
  var menu = document.getElementById('menu');
  var openers = $('[data-menu-open]');
  var lastFocus = null;
  var behind = $('#main, .top, .foot, .previewbar, .skip');
  function setMenu(open) {
    if (!menu || menu.classList.contains('open') === open) return;
    menu.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    openers.forEach(function (o) { o.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    behind.forEach(function (b) { if (open) b.setAttribute('inert', ''); else b.removeAttribute('inert'); });
    if (open) {
      lastFocus = document.activeElement;
      var x = menu.querySelector('.menu-x');
      if (x) x.focus({ preventScroll: true });
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }
  }
  if (menu) {
    openers.forEach(function (o) { o.addEventListener('click', function () { setMenu(true); }); });
    $('[data-menu-close]').forEach(function (c) { c.addEventListener('click', function () { setMenu(false); }); });
    $('.mlink', menu).forEach(function (a, i) {
      a.parentNode.style.setProperty('--i', i);
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (ev) {
      if (!menu.classList.contains('open')) return;
      if (ev.key === 'Escape') { setMenu(false); return; }
      if (ev.key === 'Tab') {
        var f = $('a[href], button', menu).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
    });
  }

  if (!fx) return;
  window.__fx = 1;

  var fine = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  var sy0 = window.scrollY;

  /* ---------- kopregels: elk woord in een masker, woorden op dezelfde regel delen hun vertraging ---------- */
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
  var held = [], holding = false;
  var els = $('[data-r], [data-lines]');
  var reveal = function (list) {
    list.sort(function (a, b) { var x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return (x.top - y.top) || (x.left - y.left); })
      .forEach(function (el, k) {
        if (holding && el.closest('.hero')) { held.push(el); return; }
        el.style.setProperty('--i', k);
        el.classList.add('in');
      });
  };
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      vis.forEach(function (e) { io.unobserve(e.target); });
      reveal(vis.map(function (e) { return e.target; }));
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { reveal(els); }

  /* ---------- intro: idee, ontwerp, bouwen, beheer; daarna veegt het scherm open ---------- */
  var intro = document.querySelector('.intro');
  function release() { holding = false; var h = held.slice(); held = []; reveal(h); }
  var seen = false; try { seen = sessionStorage.getItem('pm-intro09') === '1'; sessionStorage.setItem('pm-intro09', '1'); } catch (err) { /* geen opslag: intro elke keer */ }
  if (intro && !location.hash && sy0 < 40 && !seen) {
    holding = true;
    var words = $('.intro-words span', intro), chain = $('.intro-chain > span', intro), cnt = intro.querySelector('.intro-count b');
    var STEP = 300, N = words.length, t0 = performance.now(), ci = -1, over = false;
    root.classList.add('intro-on');
    var out = function () {
      if (over) return; over = true;
      intro.classList.add('out');
      setTimeout(release, 300);
      setTimeout(function () { intro.classList.add('gone'); root.classList.remove('intro-on'); }, 900);
    };
    var step = function (now) {
      var t = now - t0, i = Math.min(N - 1, Math.floor(t / STEP));
      if (i !== ci) {
        if (ci >= 0) words[ci].className = 'past';
        words[i].className = 'on';
        chain.forEach(function (c, k) { c.classList.toggle('lit', k <= i); });
        ci = i;
      }
      var p = Math.min(1, t / (STEP * N + 60));
      cnt.textContent = String(Math.round(100 * (1 - Math.pow(1 - p, 2)))).padStart(3, '0');
      if (t < STEP * N + 120) requestAnimationFrame(step); else out();
    };
    requestAnimationFrame(step);
    setTimeout(out, 3000);
  } else if (intro) { intro.classList.add('gone'); }

  /* ---------- zijwaartse panelen (signatuur) ---------- */
  var hs = document.querySelector('.hs');
  var H = null;
  if (hs) {
    H = {
      stage: hs.querySelector('.hs-stage'), track: hs.querySelector('.hs-track'), view: hs.querySelector('.hs-view'),
      panels: $('.panel', hs), ticks: $('.tick', hs), fill: hs.querySelector('.hs-fill i'), cnt: hs.querySelector('.hs-cnt b'),
      top: 0, h: 0, dist: 0, vw: 0, left: [], w: [], shift: 0, active: -1
    };
    H.o = H.panels.map(function () { return 99; });
    H.v = H.panels.map(function () { return -1; });
  }
  function measure() {
    if (!H) return;
    H.view.style.width = '';
    hs.style.height = '';
    var vw = H.view.clientWidth, vh = H.stage.offsetHeight;
    H.vw = vw;
    H.dist = Math.max(0, H.track.scrollWidth - vw);
    hs.style.height = Math.round(H.dist + vh + vh * 0.2) + 'px';
    H.h = hs.offsetHeight;
    H.top = hs.getBoundingClientRect().top + window.scrollY;
    H.left = H.panels.map(function (p) { return p.offsetLeft; });
    H.w = H.panels.map(function (p) { return p.offsetWidth; });
    H.vh = vh;
  }
  function hsFrame() {
    var target = clamp(window.scrollY - H.top, 0, H.dist), busy = false;
    if (fine) {
      H.shift += (target - H.shift) * 0.14;
      if (Math.abs(target - H.shift) < 0.5) H.shift = target; else busy = true;
    } else H.shift = target;
    H.track.style.transform = 'translate3d(' + (-H.shift).toFixed(2) + 'px,0,0)';
    var p = H.dist ? H.shift / H.dist : 0;
    H.fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    var best = 0, bestD = 1e9, vc = H.vw / 2;
    H.panels.forEach(function (pn, i) {
      var cx = H.left[i] + H.w[i] / 2 - H.shift, o = (cx - vc) / H.vw;
      var d = Math.abs(cx - vc); if (d < bestD) { bestD = d; best = i; }
      var v = clamp(1 - (o - 0.1) / 0.38, 0, 1);
      if (Math.abs(o - H.o[i]) > 0.002) { H.o[i] = o; pn.style.setProperty('--o', o.toFixed(3)); }
      if (Math.abs(v - H.v[i]) > 0.004) { H.v[i] = v; pn.style.setProperty('--v', v.toFixed(3)); }
    });
    if (best !== H.active) {
      H.active = best;
      H.ticks.forEach(function (t, i) { t.classList.toggle('on', i === best); if (i === best) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
      H.cnt.textContent = String(best + 1).padStart(2, '0');
    }
    return busy;
  }
  if (H) {
    H.ticks.forEach(function (t) {
      t.addEventListener('click', function () {
        var i = +t.getAttribute('data-go');
        var want = clamp(H.left[i] + H.w[i] / 2 - H.vw / 2, 0, H.dist);
        window.scrollTo({ top: H.top + want, behavior: 'smooth' });
      });
    });
  }

  /* ---------- lopende banden: sneller bij snel scrollen, pauze buiten beeld ---------- */
  var mqs = $('.marquee').map(function (m) { return { el: m, track: m.querySelector('.mq-track'), rate: 1 }; });
  if ('IntersectionObserver' in window) {
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('off', !e.isIntersecting); });
    }, { rootMargin: '100px 0px' });
    mqs.forEach(function (m) { mio.observe(m.el); });
  }

  /* ---------- cursor met label (alleen met een echte muis) ---------- */
  var cur = null, cx = -100, cy = -100, tx = -100, ty = -100, curOn = false;
  if (fine) {
    cur = document.createElement('div');
    cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cur-i"></span>';
    document.body.appendChild(cur);
    var curI = cur.firstChild;
    document.addEventListener('pointermove', function (ev) { tx = ev.clientX; ty = ev.clientY; wake(); }, { passive: true });
    document.addEventListener('pointerover', function (ev) {
      var t = ev.target.closest && ev.target.closest('[data-cursor]');
      if (t) { var lb = t.getAttribute('data-cursor'); curI.setAttribute('data-l', lb); cur.classList.toggle('dark', lb === 'Case' || lb === 'Plan'); cur.classList.add('show'); curOn = true; }
      else { cur.classList.remove('show'); curOn = false; }
    });
    document.documentElement.addEventListener('pointerleave', function () { cur.classList.remove('show'); curOn = false; });
  }

  /* ---------- één lus ---------- */
  var running = false, lastY = sy0, vel = 0;
  function tick() {
    running = false;
    var y = window.scrollY, dy = y - lastY; lastY = y;
    vel += (Math.abs(dy) - vel) * 0.2;
    var again = false;
    if (H && y > H.top - H.vh * 1.5 && y < H.top + H.h + H.vh) { if (hsFrame()) again = true; }
    var rate = 1 + clamp(vel / 7, 0, 5);
    mqs.forEach(function (m) {
      if (Math.abs(rate - m.rate) > 0.03 || (rate === 1 && m.rate !== 1)) {
        m.rate += (rate - m.rate) * 0.25;
        if (Math.abs(m.rate - 1) < 0.03) m.rate = 1;
        m.track.getAnimations().forEach(function (a) { a.updatePlaybackRate(m.rate); });
        again = true;
      }
    });
    if (vel > 0.05) again = true;
    if (cur) {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) again = true;
    }
    if (again) { running = true; requestAnimationFrame(tick); }
  }
  function wake() { if (!running) { running = true; requestAnimationFrame(tick); } }
  window.addEventListener('scroll', wake, { passive: true });

  var rt = 0, lastW = window.innerWidth;
  var relayout = function () {
    measure();
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; indexLines(); }
    wake();
  };
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 120); });
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  if ('ResizeObserver' in window) {
    var ro = null, rbusy = 0;
    ro = new ResizeObserver(function () { clearTimeout(rbusy); rbusy = setTimeout(relayout, 150); });
    ro.observe(document.body);
  }
  relayout();
  if (H) { H.shift = clamp(window.scrollY - H.top, 0, H.dist); hsFrame(); }
})();
