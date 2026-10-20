/* 18 Palet papier: de Röntgenlens, het commandopalet (Ctrl+K) en de beweging. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
   Het palet werkt ook zonder effecten. De beweging draait alleen als <html> de class «fx» heeft; anders staat alles op zijn eindplek. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var fx = root.classList.contains('fx');

  /* ---------- menu op smalle schermen ---------- */
  (function () {
    var btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav'), top = document.querySelector('.top');
    if (!btn || !nav || !top) return;
    btn.hidden = false;
    var set = function (open, refocus) {
      top.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open && refocus) btn.focus();
    };
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (ev) { if (ev.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true' && document.getElementById('pal').hidden) { set(false, true); }
    });
    document.addEventListener('click', function (ev) { if (!top.contains(ev.target)) set(false); });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) set(false); });
  })();

  /* ---------- commandopalet ---------- */
  var pal = document.getElementById('pal');
  if (pal) (function () {
    var box = pal.querySelector('.pal-box');
    var input = document.getElementById('pal-input');
    var closeBtn = pal.querySelector('.pal-x');
    var opts = $('.pal-o', pal);
    var heads = $('.pal-g', pal);
    var empty = document.getElementById('pal-empty');
    var live = document.getElementById('pal-live');
    var list = document.getElementById('pal-list');
    var openers = $('[data-pal-open]');
    var outside = $('.previewbar, .skip, .top, main, .foot');
    var isOpen = false, lastFocus = null, vis = opts.slice(), cur = 0;

    // knoppen en tips tonen (zonder JavaScript blijft de gewone navigatie staan)
    openers.forEach(function (b) { b.hidden = false; });
    $('.js-only').forEach(function (n) { n.hidden = false; });
    var plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
    if (/Mac|iPhone|iPad/i.test(plat)) {
      $('[data-mod]').forEach(function (m) {
        m.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 6V4.2A1.7 1.7 0 1 0 4.2 6H6zm0 0h4m-4 0v4m4-4V4.2A1.7 1.7 0 1 1 11.8 6H10zm0 0v4m0 0h1.8a1.7 1.7 0 1 1-1.8 1.8V10zm0 0H6m0 0H4.2A1.7 1.7 0 1 0 6 11.8V10z"/></svg>';
      });
    }

    var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var hay = opts.map(function (o) { return norm(o.getAttribute('data-label') + ' ' + o.getAttribute('data-k')); });

    function mark(o, terms) {
      var label = o.getAttribute('data-label'), el = o.querySelector('.pal-ol'), n = norm(label);
      if (!terms.length || n.length !== label.length) { el.textContent = label; return; }
      var at = -1, len = 0;
      terms.forEach(function (t) { var i = n.indexOf(t); if (i > -1 && (at === -1 || i < at)) { at = i; len = t.length; } });
      if (at === -1) { el.textContent = label; return; }
      el.innerHTML = esc(label.slice(0, at)) + '<b>' + esc(label.slice(at, at + len)) + '</b>' + esc(label.slice(at + len));
    }
    function setActive(i, keepView) {
      cur = clamp(i, 0, Math.max(0, vis.length - 1));
      opts.forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      var o = vis[cur];
      if (o) {
        o.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', o.id);
        if (!keepView) o.scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    }
    function render(q) {
      var terms = norm(q).split(/\s+/).filter(Boolean);
      vis = [];
      opts.forEach(function (o, i) {
        var ok = terms.every(function (t) { return hay[i].indexOf(t) > -1; });
        o.hidden = !ok;
        if (ok) { vis.push(o); mark(o, terms); }
      });
      // eerst wat met het zoekwoord begint
      if (terms.length) {
        vis.sort(function (a, b) {
          var sa = norm(a.getAttribute('data-label')).indexOf(terms[0]) === 0 ? 0 : 1, sb = norm(b.getAttribute('data-label')).indexOf(terms[0]) === 0 ? 0 : 1;
          return sa - sb || opts.indexOf(a) - opts.indexOf(b);
        });
        vis.forEach(function (o) { list.appendChild(o); });
        heads.forEach(function (h) { h.hidden = true; });
      } else {
        // oorspronkelijke volgorde met groepskoppen terug
        var order = [];
        heads.forEach(function (h, gi) { order.push(h); opts.forEach(function (o) { if (o.getAttribute('data-g') === String(gi)) order.push(o); }); });
        order.forEach(function (n) { list.appendChild(n); });
        heads.forEach(function (h) { h.hidden = false; });
      }
      empty.hidden = vis.length > 0;
      list.hidden = vis.length === 0;
      setActive(0, true);
      live.textContent = vis.length ? vis.length + (vis.length === 1 ? ' resultaat' : ' resultaten') : 'Niets gevonden';
    }
    // groepsnummer per optie onthouden (voor het terugzetten van de volgorde)
    (function () {
      var g = -1;
      Array.prototype.slice.call(list.children).forEach(function (n) {
        if (n.classList.contains('pal-g')) g++;
        else n.setAttribute('data-g', String(g));
      });
    })();

    function open() {
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;
      pal.hidden = false;
      root.classList.add('pal-open');
      outside.forEach(function (n) { n.setAttribute('inert', ''); });
      input.value = '';
      render('');
      input.focus();
    }
    function close(refocus) {
      if (!isOpen) return;
      isOpen = false;
      pal.hidden = true;
      root.classList.remove('pal-open');
      outside.forEach(function (n) { n.removeAttribute('inert'); });
      if (refocus && lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus();
    }
    function run(o) {
      if (!o) return;
      var href = o.getAttribute('data-href');
      if (href.charAt(0) === '#') {
        close(false);
        var t = document.getElementById(href.slice(1));
        if (t) {
          t.scrollIntoView({ behavior: fx ? 'smooth' : 'auto', block: 'start' });
          if (t.focus) t.focus({ preventScroll: true });
          try { history.replaceState(null, '', href); } catch (er) { /* file:// mag weigeren */ }
        }
      } else if (/^https?:/.test(href)) {
        close(true);
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        close(false);
        location.href = href;
      }
    }

    openers.forEach(function (b) { b.addEventListener('click', open); });
    pal.addEventListener('mousedown', function (ev) {
      if (ev.target.closest('.pal-o')) ev.preventDefault();
    });
    pal.addEventListener('click', function (ev) {
      var o = ev.target.closest('.pal-o');
      if (o) { run(o); return; }
      if (ev.target.closest('[data-pal-close]')) close(true);
    });
    list.addEventListener('mousemove', function (ev) {
      var o = ev.target.closest('.pal-o');
      if (o && vis.indexOf(o) > -1 && vis.indexOf(o) !== cur) setActive(vis.indexOf(o), true);
    });
    input.addEventListener('input', function () { render(input.value); });
    document.addEventListener('keydown', function (ev) {
      var k = ev.key;
      if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && (k === 'k' || k === 'K')) {
        ev.preventDefault();
        if (isOpen) close(true); else open();
        return;
      }
      if (!isOpen) return;
      if (k === 'Escape') { ev.preventDefault(); close(true); }
      else if (k === 'ArrowDown') { ev.preventDefault(); if (vis.length) setActive((cur + 1) % vis.length); }
      else if (k === 'ArrowUp') { ev.preventDefault(); if (vis.length) setActive((cur - 1 + vis.length) % vis.length); }
      else if (k === 'Home' && document.activeElement === input && !input.value) { ev.preventDefault(); setActive(0); }
      else if (k === 'End' && document.activeElement === input && !input.value) { ev.preventDefault(); setActive(vis.length - 1); }
      else if (k === 'Enter' && document.activeElement === input) { ev.preventDefault(); run(vis[cur]); }
      else if (k === 'Tab') {
        // focus gevangen: alleen het zoekveld en de sluitknop
        ev.preventDefault();
        var f = [input, closeBtn], i = f.indexOf(document.activeElement);
        f[(i + (ev.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
    // valt de focus er toch uit (bijvoorbeeld door een klik naast het venster), dan terug erin
    document.addEventListener('focusin', function (ev) {
      if (isOpen && !box.contains(ev.target)) input.focus();
    });
  })();

  /* ---------- Röntgenlens ----------
     Keuzerondjes (de drie knoppen), een tik op de lens en het toetsenbord werken ook zonder effecten. De volgbeweging en het slepen draaien alleen met .fx; zonder .fx staat de lens vast in het midden. Eén rAF-lus, alleen zolang de lens nog onderweg is. */
  var lx = document.querySelector('.lx');
  if (lx) (function () {
    var win = lx.querySelector('.lx-win'), clip = lx.querySelector('.lx-clip'), ring = lx.querySelector('.lx-ring');
    var radios = $('.lx-opts input', lx), live = document.getElementById('lx-live');
    var NAMES = ['Scherm', 'Logica', 'Gegevens'];
    var KEYS = ' Pijltjestoetsen verplaatsen de lens, plus en min wisselen van laag, Enter gaat een laag dieper.';
    var FIXED_KEYS = ' Pijltje omhoog of omlaag en plus en min wisselen van laag, Enter gaat een laag dieper.';
    var layer = 0;
    var W = 0, H = 0, lw = 0, lh = 0, em = 16, docL = 0, docT = 0;
    var cx = 0, cy = 0, tx = 0, ty = 0, raf = 0, last = 0;

    function setLayer(n, quiet) {
      n = clamp(n, 0, 2);
      if (n === layer && quiet !== 'force') return;
      layer = n;
      lx.style.setProperty('--ly', String(n));
      radios[n].checked = true;
      ring.setAttribute('aria-label', 'Röntgenlens, laag ' + (n + 1) + ' van 3: ' + NAMES[n] + '.' + (fx ? KEYS : FIXED_KEYS));
      if (!quiet) live.textContent = 'Laag ' + (n + 1) + ' van 3: ' + NAMES[n];
    }
    var cycle = function () { setLayer((layer + 1) % 3); };
    radios.forEach(function (r, i) { r.addEventListener('change', function () { if (r.checked) setLayer(i); }); });
    setLayer(0, 'force');
    // zonder effecten: de lens staat vast in het midden; een tik of klik op het venster gaat een laag dieper, pijltjes omhoog of omlaag wisselen ook
    if (!fx) {
      win.addEventListener('click', cycle);
      ring.addEventListener('keydown', function (ev) {
        var k = ev.key, d = (k === 'ArrowUp' || k === 'ArrowRight' || k === '+' || k === '=' || k === 'PageDown') ? 1 : (k === 'ArrowDown' || k === 'ArrowLeft' || k === '-' || k === '_' || k === 'PageUp') ? -1 : 0;
        if (d) { ev.preventDefault(); setLayer(layer + d); }
      });
      return;
    }

    /* ---- met effecten: de lens volgt ---- */
    function measure() {
      var r = win.getBoundingClientRect();
      docL = r.left + window.pageXOffset + win.clientLeft; docT = r.top + window.pageYOffset + win.clientTop;
      var w0 = W, h0 = H;
      W = win.clientWidth; H = win.clientHeight; lw = ring.offsetWidth; lh = ring.offsetHeight;
      em = parseFloat(getComputedStyle(win).fontSize) || 16;
      if (!w0) { cx = tx = W / 2; cy = ty = H / 2; } else if (w0 !== W || h0 !== H) { tx = cx = cx / w0 * W; ty = cy = cy / h0 * H; }
    }
    function draw() {
      var x = cx - lw / 2, y = cy - lh / 2;
      ring.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      clip.style.clipPath = 'inset(' + y.toFixed(1) + 'px ' + (W - x - lw).toFixed(1) + 'px ' + (H - y - lh).toFixed(1) + 'px ' + x.toFixed(1) + 'px round ' + (em * .7).toFixed(1) + 'px)';
    }
    function tick(now) {
      raf = 0;
      var k = 1 - Math.exp(-Math.min(64, now - last) / 42);
      last = now;
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      if (Math.abs(tx - cx) < .2 && Math.abs(ty - cy) < .2) { cx = tx; cy = ty; draw(); return; }
      draw();
      raf = requestAnimationFrame(tick);
    }
    // doel instellen; snap = direct (slepen), anders een zachte beweging die in het eerste beeld al een flink stuk aflegt
    function go(x, y, snap) {
      tx = clamp(x, lw / 2, W - lw / 2); ty = clamp(y, lh / 2, H - lh / 2);
      if (snap) { cx = tx; cy = ty; draw(); return; }
      if (!raf) { last = performance.now() - 16; raf = requestAnimationFrame(tick); }
    }
    var local = function (ev) { return { x: ev.pageX - docL, y: ev.pageY - docT }; };
    measure();
    draw();
    window.addEventListener('resize', function () { measure(); draw(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); draw(); });

    var down = null;
    win.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') measure(); });
    win.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      measure();
      var p = local(ev);
      down = { id: ev.pointerId, mouse: ev.pointerType === 'mouse', sx: p.x, sy: p.y, lx: cx, ly: cy, moved: false, onRing: !!ev.target.closest('.lx-ring') };
    });
    win.addEventListener('pointermove', function (ev) {
      var p = local(ev);
      if (ev.pointerType === 'mouse') { go(p.x, p.y); return; }
      if (!down || down.id !== ev.pointerId) return;
      var dx = p.x - down.sx, dy = p.y - down.sy;
      if (!down.moved && Math.abs(dx) + Math.abs(dy) > 7) down.moved = true;
      if (down.moved) { if (down.onRing) go(down.lx + dx, down.ly + dy, true); else go(p.x, p.y, true); }
    });
    var up = function (ev) {
      var d = down; down = null;
      if (!d || d.id !== ev.pointerId || ev.type === 'pointercancel') return;
      var p = local(ev);
      if (d.mouse) { if (Math.abs(p.x - d.sx) + Math.abs(p.y - d.sy) < 7) cycle(); return; }
      if (d.moved) return;
      if (d.onRing) cycle(); else go(p.x, p.y);
    };
    win.addEventListener('pointerup', up);
    win.addEventListener('pointercancel', up);

    // toetsenbord: pijltjes verplaatsen (Shift: grotere stap), plus en min wisselen van laag, Home zet de lens terug in het midden; Enter en spatie via de knop
    ring.addEventListener('click', function (ev) { if (ev.detail === 0) cycle(); });
    ring.addEventListener('keydown', function (ev) {
      var k = ev.key, s = (ev.shiftKey ? 6 : 2) * em, handled = true;
      if (k === 'ArrowLeft') go(tx - s, ty);
      else if (k === 'ArrowRight') go(tx + s, ty);
      else if (k === 'ArrowUp') go(tx, ty - s);
      else if (k === 'ArrowDown') go(tx, ty + s);
      else if (k === '+' || k === '=' || k === 'PageDown') setLayer(layer + 1);
      else if (k === '-' || k === '_' || k === 'PageUp') setLayer(layer - 1);
      else if (k === 'Home') go(W / 2, H / 2);
      else handled = false;
      if (handled) ev.preventDefault();
    });
  })();

  if (!fx) return;
  window.__fx = 1;

  /* ---------- 1. Hoofdkop: woord voor woord omhoog ---------- */
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
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('go'); }); });
  });

  /* ---------- 2. Onthullen bij scrollen; lussen alleen als ze in beeld zijn ---------- */
  var reveal = function (list) {
    list.sort(function (a, b) { var x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return (x.top - y.top) || (x.left - y.left); })
      .forEach(function (el, k) {
        el.style.setProperty('--i', k + (el.closest('.hero') ? 4 : 0));
        el.classList.add('in');
        setTimeout(function () { el.classList.add('done'); }, 2400);
      });
  };
  var els = $('[data-r], .hero-t > :not(h1)');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var v = entries.filter(function (e) { return e.isIntersecting; });
      v.forEach(function (e) { io.unobserve(e.target); });
      reveal(v.map(function (e) { return e.target; }));
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('live', e.isIntersecting); });
    }, { threshold: 0.15 });
    $('.hero-stage, .fg, .chat, .cl-in').forEach(function (el) { io2.observe(el); });
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('open'); io3.unobserve(e.target); } });
    }, { threshold: 0.25 });
    $('.cl-stack').forEach(function (el) { io3.observe(el); });
  } else {
    reveal(els);
    $('.hero-stage, .fg, .chat, .cl-in').forEach(function (el) { el.classList.add('live'); });
    $('.cl-stack').forEach(function (el) { el.classList.add('open'); });
  }
  // pauzeren bij een verborgen tabblad: animaties staan dan stil (CSS-lussen lopen niet door op de achtergrond, dit is extra zeker)
  document.addEventListener('visibilitychange', function () { root.classList.toggle('tab-hidden', document.hidden); });

  /* ---------- 3. De werkbank: scrollen stuurt de gebeurtenissen ---------- */
  var B = document.querySelector('.bench');
  var bench = null;
  if (B) {
    bench = {
      el: B, win: B.querySelector('.bw'), cur: B.querySelector('.bcur'), rowT: B.querySelector('.row-t'), send: B.querySelector('.send'),
      typed: B.querySelector('.palm-t b'), steps: $('.steps li', B), geo: null, last: {}, active: -1
    };
    bench.offset = function (el) {
      var x = 0, y = 0, n = el;
      while (n && n !== bench.win) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x, y: y };
    };
    bench.measure = function () {
      var w = bench.win.offsetWidth, h = bench.win.offsetHeight, r = bench.offset(bench.rowT), s = bench.offset(bench.send);
      var em = parseFloat(getComputedStyle(bench.win).fontSize) || 12;
      bench.geo = {
        start: { x: w * 0.96, y: h * 1.04 },
        row: { x: r.x + bench.rowT.offsetWidth * 0.34, y: r.y + bench.rowT.offsetHeight * 0.55 },
        btn: { x: s.x + bench.send.offsetWidth * 0.5, y: s.y + bench.send.offsetHeight * 0.5 },
        away: { x: w * 0.22, y: h * 0.7 }, em: em
      };
    };
    bench.pos = function (p) {
      var g = bench.geo, a, b, t;
      if (p < .14) { a = g.start; b = g.row; t = ease(seg(p, .0, .14)); }
      else if (p < .40) { a = b = g.row; t = 0; }
      else if (p < .58) { a = g.row; b = g.btn; t = ease(seg(p, .40, .58)); }
      else if (p < .70) { a = b = g.btn; t = 0; }
      else { a = g.btn; b = g.away; t = ease(seg(p, .70, .80)); }
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
    };
    bench.set = function (key, val, fn) { if (bench.last[key] !== val) { bench.last[key] = val; fn(val); } };
    bench.update = function () {
      var r = B.getBoundingClientRect(), hh = bench.hh || (bench.hh = parseFloat(getComputedStyle(root).getPropertyValue('--hh')) || 56);
      var total = r.height - window.innerHeight + hh;
      var p = total > 0 ? clamp((hh - r.top) / total, 0, 1) : 0;
      if (!bench.geo) bench.measure();
      var W = bench.win, set = bench.set;
      // gescrubd: cursor en paneel
      var c = bench.pos(p), cx = c.x.toFixed(1) + 'px', cy = c.y.toFixed(1) + 'px';
      set('cx', cx, function (v) { bench.cur.style.setProperty('--cx', v); });
      set('cy', cy, function (v) { bench.cur.style.setProperty('--cy', v); });
      var co = (seg(p, 0, .05) * (1 - seg(p, .8, .86))).toFixed(2);
      set('co', co, function (v) { bench.cur.style.opacity = v; });
      var dx = ((1 - ease(seg(p, .2, .36))) * 104).toFixed(2) + '%';
      set('dx', dx, function (v) { W.querySelector('.bp').style.setProperty('--dx', v); });
      // met drempels: klassen met een korte overgang
      var on = function (cls, cond) { set(cls, cond, function (v) { W.classList.toggle(cls, v); }); };
      on('s-hov', p >= .11); on('s-sel', p >= .17);
      on('s-chk1', p >= .38); on('s-chk2', p >= .44); on('s-chk3', p >= .50); on('s-ok', p >= .52);
      on('s-press', p >= .60 && p < .68); on('s-sent', p >= .62);
      on('s-toast', p >= .64 && p < .82);
      on('s-k1', p >= .80); on('s-pal', p >= .84);
      var n = Math.floor(seg(p, .86, .95) * 4 + 0.0001);
      set('typed', n, function (v) { bench.typed.textContent = 'plan'.slice(0, v); });
      var step = p < .2 ? 0 : p < .5 ? 1 : p < .8 ? 2 : 3;
      set('step', step, function (v) {
        bench.steps.forEach(function (li, k) {
          li.classList.toggle('active', k === v);
          if (k === v) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
        });
      });
    };
    bench.measure();
  }

  /* ---------- 4. Werkwijze: statusbolletjes en voortgang ---------- */
  var F = document.querySelector('.flow');
  var flow = null;
  if (F) {
    flow = { el: F, steps: $('.ws', F), cyc: $('.cyc-l li', F), bar: F.querySelector('.cyc-bar i'), list: F.querySelector('.wsl'), last: '' };
    flow.update = function () {
      var vh = window.innerHeight, rl = flow.list.getBoundingClientRect();
      if (rl.bottom < -200 || rl.top > vh + 200) return;
      var read = vh * 0.6, tops = flow.steps.map(function (s) { return s.getBoundingClientRect().top; });
      var reached = 0;
      tops.forEach(function (t, i) { if (t <= read) reached = i + 1; });
      var cur = reached - 1;
      var allDone = flow.list.getBoundingClientRect().bottom <= read + 40;
      var key = reached + ':' + allDone;
      if (key !== flow.last) {
        flow.last = key;
        var apply = function (list) {
          list.forEach(function (n, i) {
            var done = allDone ? true : i < cur, now = !allDone && i === cur;
            n.classList.toggle('is-done', done); n.classList.toggle('is-cur', now);
          });
        };
        apply(flow.steps); apply(flow.cyc);
        F.setAttribute('data-cur', String(clamp(allDone ? 3 : Math.max(cur, 0), 0, 3)));
      }
      var p = clamp((read - rl.top) / Math.max(1, rl.height), 0, 1);
      flow.bar.style.setProperty('--p', p.toFixed(3));
    };
    flow.update();
  }

  /* ---------- 5. Eén lus voor alles wat aan scrollen hangt ---------- */
  var heroStage = document.querySelector('.hero-stage'), hero = document.querySelector('.hero');
  var queued = false;
  var frame = function () {
    queued = false;
    if (heroStage && hero) {
      var y = window.scrollY;
      if (y < hero.offsetHeight + 80) heroStage.style.setProperty('--sy', Math.round(y));
    }
    if (bench) {
      var r = B.getBoundingClientRect();
      if (r.bottom > -100 && r.top < window.innerHeight + 100) bench.update();
    }
    if (flow) flow.update();
  };
  var ask = function () { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', function () { if (bench) { bench.geo = null; bench.last = {}; } if (flow) flow.last = ''; ask(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (bench) { bench.geo = null; bench.last = {}; } ask(); });
  frame();
})();
