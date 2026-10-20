/* 15 Palet amber (variant van 12): het commandopalet (Ctrl+K), de Systeemkaart en de beweging. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
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

  /* ---------- Systeemkaart: netwerk dat reageert op muis, tik en toetsenbord ----------
     Muis: hover toont het onderdeel meteen (klassen in dezelfde frame), klikken of tikken kiest het vast. Toetsenbord: Tab, pijltjes, Enter/Space, Esc.
     Leeg vlak of Esc wist de keuze. Zonder effecten (geen .fx) blijft alles bedienbaar, maar zonder tekenanimatie, stip en magnetische beweging. */
  (function () {
    var map = document.getElementById('sk-map'), panel = document.getElementById('sk-panel');
    if (!map || !panel) return;
    var cv = map.querySelector('.sk-cv'), svg = cv.querySelector('.sk-svg'), clearBtn = map.querySelector('.sk-clear');
    var nodes = {}, list = [];
    $('.sk-n', cv).forEach(function (li) {
      var n = { id: li.getAttribute('data-id'), li: li, btn: li.querySelector('.sk-b'), links: (li.getAttribute('data-links') || '').split(' ').filter(Boolean), cx: 0, cy: 0, ox: 0, oy: 0 };
      nodes[n.id] = n;
      if (n.btn) list.push(n);
    });
    var edges = $('.sk-e', svg).map(function (g) {
      return { g: g, a: nodes[g.getAttribute('data-a')], b: nodes[g.getAttribute('data-b')], base: g.querySelector('.e-b'), hi: g.querySelector('.e-h') };
    });
    var dots = $('.sk-dot', svg).map(function (c) { return { el: c, from: null, to: null, t0: 0, on: false }; });
    var sel = null, hov = null, cur, leaveT = 0, lastType = 'mouse';
    var inView = true, hasMouse = false, mx = 0, my = 0, rect = null, rectDirty = true, running = false, prev = 0;
    var DUR = 1900, R = 260, MAXOFF = 10;
    var narrow = window.matchMedia('(max-width: 1000px)');

    var line = function (a, b) { return 'M' + a.cx.toFixed(1) + ' ' + a.cy.toFixed(1) + 'L' + b.cx.toFixed(1) + ' ' + b.cy.toFixed(1); };
    var nodeOf = function (t) { var li = t && t.closest ? t.closest('.sk-n') : null; return li ? nodes[li.getAttribute('data-id')] : null; };

    // metingen: één keer en bij elke maatverandering (niet per muisbeweging)
    function measure() {
      svg.setAttribute('viewBox', '0 0 ' + cv.clientWidth + ' ' + cv.clientHeight);
      Object.keys(nodes).forEach(function (k) { nodes[k].cx = nodes[k].li.offsetLeft; nodes[k].cy = nodes[k].li.offsetTop; });
      edges.forEach(function (e) { var d = line(e.a, e.b); e.base.setAttribute('d', d); e.hi.setAttribute('d', d); });
      rectDirty = true;
      render(true);
    }

    function current() { return hov || sel; }
    function render(force) {
      var act = current();
      if (act === cur && !force) { syncSel(); return; }
      cur = act;
      var rel = act ? act.links : [];
      Object.keys(nodes).forEach(function (k) {
        var n = nodes[k], isAct = n === act, isRel = !!act && rel.indexOf(n.id) > -1;
        n.li.classList.toggle('is-act', isAct);
        n.li.classList.toggle('is-rel', isRel);
        n.li.classList.toggle('is-dim', !!act && !isAct && !isRel);
      });
      var used = [];
      edges.forEach(function (e) {
        var on = !!act && (e.a === act || e.b === act);
        if (on) { var o = e.a === act ? e.b : e.a; e.hi.setAttribute('d', line(act, o)); used.push({ from: act, to: o }); }
        e.g.classList.toggle('on', on);
      });
      panel.setAttribute('data-act', act ? act.id : '');
      var now = performance.now();
      dots.forEach(function (d, i) {
        var u = used[i];
        if (u) { d.from = u.from; d.to = u.to; d.t0 = now + 280 + i * 360; d.on = true; }
        else { d.on = false; d.el.style.opacity = 0; }
      });
      if (used.length) kick();
      syncSel();
    }
    function syncSel() {
      list.forEach(function (n) { n.btn.setAttribute('aria-pressed', n === sel ? 'true' : 'false'); });
      clearBtn.hidden = !sel;
    }

    // één lus: magnetische beweging van de knooppunten en de stip langs de lijn; stopt als er niets meer beweegt of buiten beeld
    function kick() {
      if (!fx || running) return;
      running = true; prev = performance.now();
      requestAnimationFrame(tick);
    }
    function tick(now) {
      if (!inView || document.hidden) { running = false; return; }
      var dt = Math.max(1, Math.min(64, now - prev)), busy = false;
      prev = now;
      var k = 1 - Math.pow(0.8, dt / 16.7);
      list.forEach(function (n) {
        var tx = 0, ty = 0;
        if (hasMouse) {
          var dx = mx - n.cx, dy = my - n.cy, d = Math.sqrt(dx * dx + dy * dy);
          if (d > 0.5 && d < R) { var m = MAXOFF * (1 - d / R) * Math.min(1, d / 40); tx = dx / d * m; ty = dy / d * m; }
        }
        var nx = n.ox + (tx - n.ox) * k, ny = n.oy + (ty - n.oy) * k;
        if (Math.abs(tx - nx) < 0.02 && Math.abs(ty - ny) < 0.02) { nx = tx; ny = ty; } else busy = true;
        if (nx !== n.ox || ny !== n.oy) {
          n.ox = nx; n.oy = ny;
          n.li.style.transform = (nx || ny) ? 'translate3d(' + nx.toFixed(2) + 'px,' + ny.toFixed(2) + 'px,0)' : '';
        }
      });
      dots.forEach(function (d) {
        if (!d.on) return;
        busy = true;
        var t = (now - d.t0) / DUR;
        if (t < 0) { d.el.style.opacity = 0; return; }
        t = t % 1;
        var e = ease(t);
        d.el.style.transform = 'translate3d(' + lerp(d.from.cx, d.to.cx, e).toFixed(1) + 'px,' + lerp(d.from.cy, d.to.cy, e).toFixed(1) + 'px,0)';
        d.el.style.opacity = Math.min(1, t / 0.12, (1 - t) / 0.12).toFixed(2);
      });
      if (busy) requestAnimationFrame(tick); else running = false;
    }

    function clearAll() { clearTimeout(leaveT); sel = null; hov = null; render(); }
    function showPanel() {
      if (!narrow.matches) return;
      var r = panel.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 8 || r.top < 64) panel.scrollIntoView({ block: 'nearest', behavior: fx ? 'smooth' : 'auto' });
    }
    function select(n) {
      clearTimeout(leaveT); hov = null; sel = n; render();
      if (lastType === 'touch') showPanel();
    }

    document.addEventListener('pointerdown', function (ev) { lastType = ev.pointerType || 'mouse'; }, true);
    list.forEach(function (n) { n.btn.addEventListener('click', function () { select(n); }); });
    panel.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-go]');
      if (!b || !nodes[b.getAttribute('data-go')]) return;
      var n = nodes[b.getAttribute('data-go')];
      select(n);
      n.btn.focus({ preventScroll: true });
    });
    clearBtn.addEventListener('click', function () { var from = sel; clearAll(); if (from) from.btn.focus({ preventScroll: true }); });
    // een tik of klik op een leeg vlak wist de keuze
    document.addEventListener('click', function (ev) {
      if (!sel && !hov) return;
      if (ev.target.closest && ev.target.closest('.sk-n, .sk-panel, .sk-clear')) return;
      clearAll();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && (sel || hov) && (!pal || pal.hidden)) clearAll();
    });
    // pijltjes bewegen de focus naar het dichtstbijzijnde onderdeel in die richting
    cv.addEventListener('keydown', function (ev) {
      var dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
      if (!dir || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var from = list.filter(function (n) { return n.btn === document.activeElement; })[0];
      if (!from) return;
      var best = null, bs = Infinity;
      list.forEach(function (n) {
        if (n === from) return;
        var dx = n.cx - from.cx, dy = n.cy - from.cy, proj = dx * dir[0] + dy * dir[1], perp = Math.abs(dx * dir[1] - dy * dir[0]);
        if (proj < 8) return;
        var s = proj + perp * 2.5;
        if (s < bs) { bs = s; best = n; }
      });
      ev.preventDefault();
      if (best) best.btn.focus();
    });

    // muis: hover kiest direct; kort uitstel bij weggaan zodat een lijn of tussenruimte niet flikkert
    cv.addEventListener('pointerover', function (ev) {
      if (ev.pointerType === 'touch') return;
      var n = nodeOf(ev.target);
      if (!n || !n.btn) return;
      clearTimeout(leaveT); hov = n; render();
    });
    var leave = function () { clearTimeout(leaveT); leaveT = setTimeout(function () { hov = null; render(); }, 220); };
    cv.addEventListener('pointerout', function (ev) {
      if (ev.pointerType === 'touch') return;
      var n = nodeOf(ev.target);
      if (!n || !n.btn || (ev.relatedTarget && n.li.contains(ev.relatedTarget))) return;
      leave();
    });
    panel.addEventListener('pointerenter', function (ev) { if (ev.pointerType !== 'touch') clearTimeout(leaveT); });
    panel.addEventListener('pointerleave', function (ev) { if (ev.pointerType !== 'touch' && hov) leave(); });
    if (fx) {
      cv.addEventListener('pointerenter', function () { rectDirty = true; });
      cv.addEventListener('pointermove', function (ev) {
        if (ev.pointerType === 'touch') return;
        if (rectDirty || !rect) { rect = cv.getBoundingClientRect(); rectDirty = false; }
        mx = ev.clientX - rect.left; my = ev.clientY - rect.top; hasMouse = true;
        kick();
      });
      cv.addEventListener('pointerleave', function () { hasMouse = false; kick(); });
      window.addEventListener('scroll', function () { rectDirty = true; }, { passive: true });
      document.addEventListener('visibilitychange', kick);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { inView = en[en.length - 1].isIntersecting; if (inView) kick(); }, { threshold: 0 }).observe(cv);
      }
    }

    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(cv);
    else window.addEventListener('resize', measure);
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

  /* ---------- 2. Lussen draaien alleen als ze in beeld zijn. Niets verschijnt of verandert door scrollen: alle inhoud staat er bij het laden. ---------- */
  var loops = $('.hero-stage, .fg, .cl-in');
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('live', e.isIntersecting); });
    }, { threshold: 0.15 });
    loops.forEach(function (el) { io2.observe(el); });
  } else {
    loops.forEach(function (el) { el.classList.add('live'); });
  }
  // pauzeren bij een verborgen tabblad
  document.addEventListener('visibilitychange', function () { root.classList.toggle('tab-hidden', document.hidden); });

  /* ---------- 3. De werkbank: staat bij het laden in zijn eindtoestand; «Speel af» (of een klik op de scène) speelt het verhaal één keer af ---------- */
  var B = document.querySelector('.bench');
  if (B) {
    var bench = {
      win: B.querySelector('.bw'), cur: B.querySelector('.bcur'), rowT: B.querySelector('.row-t'), send: B.querySelector('.send'),
      typed: B.querySelector('.palm-t b'), steps: $('.steps li', B), geo: null, last: {}, p: 0
    };
    var REST = 0.74, playing = false;
    bench.offset = function (el) {
      var x = 0, y = 0, n = el;
      while (n && n !== bench.win) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x, y: y };
    };
    bench.measure = function () {
      var w = bench.win.offsetWidth, h = bench.win.offsetHeight, r = bench.offset(bench.rowT), s = bench.offset(bench.send);
      bench.geo = {
        start: { x: w * 0.96, y: h * 1.04 },
        row: { x: r.x + bench.rowT.offsetWidth * 0.34, y: r.y + bench.rowT.offsetHeight * 0.55 },
        btn: { x: s.x + bench.send.offsetWidth * 0.5, y: s.y + bench.send.offsetHeight * 0.5 },
        away: { x: w * 0.22, y: h * 0.7 }
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
    // p loopt van 0 tot 1 (tijd, geen scrollpositie); quiet = geen stapmarkering
    bench.apply = function (p, quiet) {
      bench.p = p;
      if (!bench.geo) bench.measure();
      var W = bench.win, set = bench.set;
      var c = bench.pos(p), cx = c.x.toFixed(1) + 'px', cy = c.y.toFixed(1) + 'px';
      set('cx', cx, function (v) { bench.cur.style.setProperty('--cx', v); });
      set('cy', cy, function (v) { bench.cur.style.setProperty('--cy', v); });
      var co = (seg(p, 0, .05) * (1 - seg(p, .8, .86))).toFixed(2);
      set('co', co, function (v) { bench.cur.style.opacity = v; });
      var dx = ((1 - ease(seg(p, .2, .36))) * 104).toFixed(2) + '%';
      set('dx', dx, function (v) { W.querySelector('.bp').style.setProperty('--dx', v); });
      var on = function (cls, cond) { set(cls, cond, function (v) { W.classList.toggle(cls, v); }); };
      on('s-hov', p >= .11); on('s-sel', p >= .17);
      on('s-chk1', p >= .38); on('s-chk2', p >= .44); on('s-chk3', p >= .50); on('s-ok', p >= .52);
      on('s-press', p >= .60 && p < .68); on('s-sent', p >= .62);
      on('s-toast', p >= .64 && p < .82);
      on('s-k1', p >= .80); on('s-pal', p >= .84);
      var n = Math.floor(seg(p, .86, .95) * 4 + 0.0001);
      set('typed', n, function (v) { bench.typed.textContent = 'plan'.slice(0, v); });
      var step = quiet ? -1 : p < .2 ? 0 : p < .5 ? 1 : p < .8 ? 2 : 3;
      set('step', step, function (v) {
        bench.steps.forEach(function (li, k) {
          li.classList.toggle('active', k === v);
          if (k === v) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
        });
      });
    };
    var btn = B.querySelector('.bench-btn'), act = B.querySelector('.bench-act');
    var rest = function () { bench.apply(REST, true); };
    var play = function () {
      if (playing) return;
      playing = true;
      if (btn) { btn.setAttribute('aria-pressed', 'true'); btn.textContent = 'Speelt af'; }
      var t0 = performance.now(), D = 11000;
      var stepFn = function () {
        var p = clamp((performance.now() - t0) / D, 0, 1);
        bench.apply(p);
        if (p < 1) { requestAnimationFrame(stepFn); return; }
        setTimeout(function () {
          rest(); playing = false;
          if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.textContent = 'Speel af'; }
        }, 1200);
      };
      bench.apply(0);
      requestAnimationFrame(stepFn);
    };
    bench.measure();
    rest();
    if (act) act.hidden = false;
    if (btn) btn.addEventListener('click', play);
    bench.win.addEventListener('click', play);
    var onSize = function () { bench.geo = null; bench.last = {}; if (playing) bench.apply(bench.p); else rest(); };
    window.addEventListener('resize', onSize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onSize);
  }
})();
