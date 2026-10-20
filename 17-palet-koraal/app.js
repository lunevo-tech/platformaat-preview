/* 17 Palet Koraal: het commandopalet (Ctrl+K), de koppelingsschakelaar en de beweging. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
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

  /* ---------- Koppelingsschakelaar: muis, tikken, slepen en toetsenbord.
     Werkt ook zonder effecten: dan staan de lijnen er meteen en beweegt er niets. Eén rAF-lus, alleen als het onderdeel in beeld is. ---------- */
  (function () {
    var K = document.getElementById('kp');
    if (!K) return;
    var stage = document.getElementById('kp-stage'), svg = stage.querySelector('.kp-svg'), tool = K.querySelector('.kp-tool');
    var packs = $('.pk', K), rows = $('.tr', K), dots = $('.kd', K), lines = $('.kn', K);
    var prev = svg.querySelector('.kn-p'), tip = svg.querySelector('.kp-tip');
    var logEl = document.getElementById('kp-log'), empty = logEl.querySelector('.kl-0'), offBtn = document.getElementById('kp-off');
    var N = packs.length, TN = 40, T = 3600;
    var names = packs.map(function (p) { return p.querySelector('.pk-n').textContent; });
    var msgs = packs.map(function (p) { return p.getAttribute('data-msg'); });
    var firstCheck = logEl.querySelector('.kl-c');
    var tplCheck = firstCheck ? firstCheck.innerHTML : '';
    var on = packs.map(function (p) { return p.getAttribute('aria-pressed') === 'true'; });
    var anyOn = false, geo = null, origin = { x: 0, y: 0 }, tables = [], start = [0, 0, 0], arrived = [false, false, false];
    var hoverAim = -1, focusAim = -1, aim = -1, pointer = null, drag = null, blockClick = false, inView = true, raf = 0, last = 0;
    var sp = { x: 0, y: 0, vx: 0, vy: 0, i: -1, live: false };

    offBtn.hidden = false;
    // met effecten begint het onderdeel leeg (de HTML toont de rustige eindtoestand: alles gekoppeld)
    if (fx) {
      on = on.map(function () { return false; });
      $('.kl-i', logEl).forEach(function (n) { n.parentNode.removeChild(n); });
    }

    /* ----- meten (alleen bij laden, formaatwijziging en als de muis het onderdeel binnenkomt) ----- */
    var rel = function (el, s) { var r = el.getBoundingClientRect(); return { x: r.left - s.x, y: r.top - s.y, w: r.width, h: r.height }; };
    var ctr = function (el, s) { var r = rel(el, s); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
    var curve = function (a, b) {
      var k = clamp(Math.abs(b.x - a.x) * .5, 0, 140);
      return 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'C' + (a.x + k).toFixed(1) + ' ' + a.y.toFixed(1) + ' ' + (b.x - k).toFixed(1) + ' ' + b.y.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
    };
    function setLine(i) {
      var p = lines[i];
      p.setAttribute('d', curve(geo.from[i], geo.to[i]));
      var len = p.getTotalLength(), t = [];
      for (var j = 0; j <= TN; j++) { var q = p.getPointAtLength(len * j / TN); t.push(q.x, q.y); }
      tables[i] = t;
    }
    function placeStatic() {
      // zonder effecten: de «gegevens»-stip staat stil halverwege de lijn
      dots.forEach(function (d, i) {
        if (on[i] && tables[i]) { d.style.transform = 'translate3d(' + tables[i][TN].toFixed(1) + 'px,' + tables[i][TN + 1].toFixed(1) + 'px,0)'; d.style.opacity = 1; }
        else d.style.opacity = 0;
      });
    }
    function measure() {
      var r = stage.getBoundingClientRect(), s = { x: r.left + stage.clientLeft, y: r.top + stage.clientTop };
      origin = { x: s.x + window.pageXOffset, y: s.y + window.pageYOffset };
      geo = {
        pk: packs.map(function (p) { return rel(p, s); }),
        from: packs.map(function (p) { return ctr(p.querySelector('.pt'), s); }),
        to: rows.map(function (q) { return ctr(q.querySelector('.pt'), s); }),
        tool: rel(tool, s)
      };
      svg.setAttribute('viewBox', '0 0 ' + stage.clientWidth + ' ' + stage.clientHeight);
      for (var i = 0; i < N; i++) if (on[i]) setLine(i);
      if (!fx) placeStatic();
    }
    var local = function (ev) { return { x: ev.pageX - origin.x, y: ev.pageY - origin.y }; };
    var inBox = function (p, b, pad) { return p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad; };
    var hit = function (p) { for (var i = 0; i < N; i++) if (inBox(p, geo.pk[i], 0)) return i; return -1; };

    /* ----- toestand: een koppeling aan of uit ----- */
    function sync() {
      anyOn = false;
      packs.forEach(function (p, i) {
        var v = on[i];
        if (v) anyOn = true;
        p.classList.toggle('is-on', v);
        p.setAttribute('aria-pressed', v ? 'true' : 'false');
        rows[i].classList.toggle('is-on', v);
        rows[i].querySelector('.tr-s').textContent = v ? 'Verbonden' : 'Wacht';
        lines[i].classList.toggle('on', v);
        if (!v) dots[i].style.opacity = 0;
      });
      offBtn.setAttribute('aria-disabled', anyOn ? 'false' : 'true');
      if (!fx && geo) placeStatic();
    }
    function push(li) {
      var first = logEl.querySelector('.kl-i');
      logEl.insertBefore(li, first);
      var items = $('.kl-i', logEl);
      while (items.length > 4) logEl.removeChild(items.pop());
      empty.hidden = items.length > 0;
    }
    function logAdd(i, v) {
      var li = document.createElement('li');
      li.className = 'kl-i' + (v ? '' : ' off') + (fx ? ' new' : '');
      li.innerHTML = '<p class="kl-a"><span class="kl-d" aria-hidden="true"></span><b>' + names[i] + ':</b> ' + (v ? 'Koppeling actief.' : 'Losgekoppeld.') + '</p>' +
        (v ? '<p class="kl-b">' + msgs[i] + '.</p><p class="kl-c">' + tplCheck + '</p>' : '');
      push(li);
    }
    function setOn(i, v, log) {
      if (on[i] === v) return;
      if (!geo) measure();
      on[i] = v;
      if (v) {
        setLine(i);
        start[i] = performance.now() + (fx ? 650 : 0);
        arrived[i] = false;
        if (sp.i === i) sp.live = false;
      }
      sync();
      if (log) logAdd(i, v);
      recalc();
    }
    function offAll() {
      if (!anyOn) return;
      for (var i = 0; i < N; i++) on[i] = false;
      sync();
      var li = document.createElement('li');
      li.className = 'kl-i off' + (fx ? ' new' : '');
      li.innerHTML = '<p class="kl-a"><span class="kl-d" aria-hidden="true"></span><b>Alles losgekoppeld.</b></p>';
      push(li);
      recalc();
    }

    /* ----- richten: welk pakket wijst de muis of het toetsenbord aan ----- */
    function recalc() {
      var a = hoverAim > -1 ? hoverAim : focusAim;
      aim = a;
      packs.forEach(function (p, i) { p.classList.toggle('is-aim', i === aim); rows[i].classList.toggle('is-aim', i === aim); });
      lines.forEach(function (l, i) { l.classList.toggle('hot', i === hoverAim && on[i]); });
      if (!fx || !geo) return;
      if (aim > -1 && !on[aim]) {
        if (sp.i !== aim || !sp.live) { sp.i = aim; sp.x = geo.from[aim].x; sp.y = geo.from[aim].y; sp.vx = sp.vy = 0; sp.live = true; paintSpring(); }
        svg.classList.add('show');
      } else svg.classList.remove('show');
      ask();
    }

    /* ----- de elastische voorbeeldlijn ----- */
    function target() {
      var i = sp.i, f = geo.from[i], t = geo.to[i];
      if (!(aim === i && !on[i])) return f;
      if (!pointer) return t;
      if (drag && drag.active) return pointer;
      var b = geo.pk[i], p = pointer;
      if (inBox(p, geo.tool, 28)) return t;
      if (inBox(p, b, 0)) return { x: f.x + (t.x - f.x) * .42, y: f.y + (t.y - f.y) * .42 + (p.y - (b.y + b.h / 2)) * .3 };
      var m = clamp(1 - Math.hypot(p.x - t.x, p.y - t.y) / 90, 0, 1);
      return { x: Math.max(f.x + 4, lerp(p.x, t.x, m)), y: lerp(p.y, t.y, m) };
    }
    function paintSpring() {
      prev.setAttribute('d', curve(geo.from[sp.i], sp));
      tip.setAttribute('cx', sp.x.toFixed(1)); tip.setAttribute('cy', sp.y.toFixed(1));
    }
    function stepSpring(dt) {
      var t = target(), k = 260, c = 19;
      sp.vx += ((t.x - sp.x) * k - sp.vx * c) * dt; sp.x += sp.vx * dt;
      sp.vy += ((t.y - sp.y) * k - sp.vy * c) * dt; sp.y += sp.vy * dt;
      paintSpring();
      var settled = Math.abs(t.x - sp.x) < .4 && Math.abs(t.y - sp.y) < .4 && Math.abs(sp.vx) < 6 && Math.abs(sp.vy) < 6;
      if (settled && !(aim === sp.i && !on[sp.i])) sp.live = false;
      return !settled;
    }

    /* ----- de «gegevens»-stip die over de lijn loopt ----- */
    function pulse(i) {
      var d = rows[i].querySelector('.tr-d');
      if (d && d.animate) d.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.9)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    }
    function stepDots(now) {
      for (var i = 0; i < N; i++) {
        var tb = tables[i];
        if (!on[i] || !tb) continue;
        var u = (now - start[i]) / (T + i * 450);
        if (u < 0) continue;
        u -= Math.floor(u);
        var a = 0, p = 1;
        if (u < .74) { p = ease(u / .74); a = Math.min(1, u / .06, (.74 - u) / .09); }
        var f = p * TN, j = Math.min(TN - 1, Math.floor(f)), r = f - j;
        var x = tb[2 * j] + (tb[2 * j + 2] - tb[2 * j]) * r, y = tb[2 * j + 1] + (tb[2 * j + 3] - tb[2 * j + 1]) * r;
        dots[i].style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
        dots[i].style.opacity = a.toFixed(2);
        if (u > .66 && !arrived[i]) { arrived[i] = true; pulse(i); } else if (u < .3) arrived[i] = false;
      }
    }

    /* ----- één lus ----- */
    function ask() { if (!fx || raf || !inView || !geo) return; last = performance.now(); raf = requestAnimationFrame(tick); }
    function tick(now) {
      raf = 0;
      if (!inView) return;
      var dt = Math.min(.034, Math.max(.001, (now - last) / 1000)), more = false;
      last = now;
      if (sp.live && stepSpring(dt)) more = true;
      if (anyOn) { stepDots(now); more = true; }
      if (more) raf = requestAnimationFrame(tick);
    }

    /* ----- invoer: muis, tikken, slepen ----- */
    packs.forEach(function (p, i) {
      p.addEventListener('click', function (ev) {
        if (blockClick) { blockClick = false; ev.preventDefault(); return; }
        setOn(i, !on[i], true);
      });
      p.addEventListener('pointerdown', function (ev) {
        if (ev.button > 0) return;
        blockClick = false;
        if (!geo || ev.pointerType === 'touch') measure();
        drag = { i: i, id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, active: false, type: ev.pointerType };
        p.classList.add('is-press');
        pointer = local(ev);
        if (ev.pointerType === 'touch') { hoverAim = i; recalc(); }
        ask();
      });
      p.addEventListener('focus', function () { if (p.matches(':focus-visible')) { focusAim = i; if (!geo) measure(); recalc(); } });
      p.addEventListener('blur', function () { if (focusAim === i) { focusAim = -1; recalc(); } });
      p.addEventListener('keydown', function (ev) {
        var d = (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') ? 1 : (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') ? -1 : 0;
        if (!d) return;
        ev.preventDefault();
        packs[(i + d + N) % N].focus();
      });
    });
    stage.addEventListener('pointerenter', function (ev) { if (ev.pointerType !== 'touch') measure(); });
    stage.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      if (!geo) measure();
      pointer = local(ev);
      if (!(drag && drag.active)) {
        var h = hit(pointer);
        if (h > -1 && h !== hoverAim) { hoverAim = h; recalc(); }
      }
      ask();
    });
    stage.addEventListener('pointerleave', function (ev) {
      if (ev.pointerType === 'touch' || (drag && drag.active)) return;
      pointer = null; hoverAim = -1; recalc(); ask();
    });
    document.addEventListener('pointermove', function (ev) {
      if (!drag || ev.pointerId !== drag.id) return;
      if (!drag.active) {
        if (on[drag.i]) return;
        var dx = ev.clientX - drag.sx, dy = ev.clientY - drag.sy;
        if (Math.hypot(dx, dy) < 9) return;
        if (drag.type === 'touch' && Math.abs(dx) < Math.abs(dy)) return;
        drag.active = true;
        try { packs[drag.i].setPointerCapture(drag.id); } catch (er) { /* niet nodig */ }
        K.classList.add('is-drag');
        hoverAim = drag.i; recalc();
      }
      pointer = local(ev); ask();
    });
    function endPointer(ev, cancel) {
      if (!drag || ev.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      packs[d.i].classList.remove('is-press');
      if (d.active) {
        K.classList.remove('is-drag');
        blockClick = true;
        setTimeout(function () { blockClick = false; }, 80);
        if (!cancel && pointer && inBox(pointer, geo.tool, 28)) setOn(d.i, true, true);
      }
      if (d.type === 'touch') { hoverAim = -1; pointer = null; }
      recalc(); ask();
    }
    document.addEventListener('pointerup', function (ev) { endPointer(ev, false); });
    document.addEventListener('pointercancel', function (ev) { endPointer(ev, true); });

    /* ----- invoer: toetsenbord en de knop ----- */
    offBtn.addEventListener('click', offAll);
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape' || !anyOn) return;
      var pl = document.getElementById('pal');
      if (pl && !pl.hidden) return;
      if (pointer || K.contains(document.activeElement)) offAll();
    });

    /* ----- start ----- */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) ask(); }, { threshold: 0 }).observe(stage);
    }
    if (window.ResizeObserver) new ResizeObserver(function () { measure(); ask(); }).observe(stage);
    else window.addEventListener('resize', function () { measure(); ask(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); ask(); });
    measure();
    sync();
    if (fx) { dots.forEach(function (d) { d.style.opacity = 0; }); empty.hidden = false; }
    recalc();
    K.classList.add('ready');
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

  /* ---------- 2. Bij het laden: de tekst naast de hero komt eenmalig omhoog; niets wacht op scrollen ---------- */
  $('.hero-t > :not(h1)').forEach(function (el, k) {
    el.style.setProperty('--i', k + 4);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
  });

  /* ---------- 3. Kleine lussen in de getekende schermen: lopen vanaf het laden, staan stil buiten beeld of bij een verborgen tabblad ---------- */
  var loops = $('.hero-stage, .fg, .chat, .cl-in');
  loops.forEach(function (el) { el.classList.add('live'); });
  // pas na de intro-animaties (die moeten altijd afspelen, ook als het onderdeel nog onder het eerste scherm staat)
  if ('IntersectionObserver' in window) {
    setTimeout(function () {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle('paused', !e.isIntersecting); });
      }, { threshold: 0 });
      loops.forEach(function (el) { io.observe(el); });
    }, 2500);
  }
  document.addEventListener('visibilitychange', function () { root.classList.toggle('tab-hidden', document.hidden); });
})();
