/* 16 Palet-groen (variant van 12): het commandopalet (Ctrl+K), het werkbon-bord en de beweging. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
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

  /* ---------- werkbon-bord: tikken, klikken, slepen en toetsenbord; werkt ook zonder effecten (dan zonder animatie) ---------- */
  (function () {
    var board = document.getElementById('bk');
    if (!board) return;
    var win = board.closest('.bk-win');
    var cols = $('.bk-col', board);
    var lists = cols.map(function (c) { return c.querySelector('.bk-list'); });
    var counts = cols.map(function (c) { return c.querySelector('.bk-c b'); });
    var names = cols.map(function (c) { return c.querySelector('h3').textContent; });
    var items = $('.bk-li', board);
    var live = document.getElementById('bk-live');
    var toast = document.getElementById('bk-toast');
    var toastT = toast.querySelector('.bk-toast-t');
    var home = lists.map(function (l) { return Array.prototype.slice.call(l.children); });
    var EASE = 'cubic-bezier(.2,.7,.2,1)';
    var drag = null, flipTick = false, toastTimer = 0;
    var N = cols.length;

    var btnOf = function (li) { return li.firstElementChild; };
    var colOf = function (li) { return lists.indexOf(li.parentNode); };
    var animates = function () { return fx && !!Element.prototype.animate; };

    /* label en toegankelijke naam van een kaartje volgen de kolom */
    function paint(li) {
      var b = btnOf(li), c = colOf(li), ai = b.hasAttribute('data-ai'), ok = ai && c > 0, extra = '';
      b.querySelector('.bk-ds').textContent = names[c];
      if (ai) {
        var chk = b.querySelector('[data-chk]'), txt = ok ? 'Gecontroleerd door een mens' : 'Wacht op controle door een mens';
        if (ok) chk.setAttribute('data-ok', ''); else chk.removeAttribute('data-ok');
        chk.querySelector('.bk-ct').textContent = txt;
        extra = ' Je gebruikt een AI-assistent. ' + txt + '.';
      }
      b.setAttribute('aria-label', b.getAttribute('data-title') + '. ' + b.getAttribute('data-kind') + '. Status: ' + names[c] + '.' + extra);
    }
    function recount() {
      lists.forEach(function (l, i) {
        var n = String(l.children.length);
        if (counts[i].textContent === n) return;
        counts[i].textContent = n;
        if (animates()) counts[i].animate([{ transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 300, easing: EASE });
      });
    }
    function say(msg) { flipTick = !flipTick; live.textContent = msg + (flipTick ? '' : ' '); }
    function showToast(msg) {
      toastT.textContent = msg;
      toast.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('on'); }, 1900);
    }

    /* FLIP: eerst de oude plekken meten, dan verplaatsen, dan elk kaartje van de oude naar de nieuwe plek laten glijden (alleen transform) */
    function rects() { return items.map(function (li) { return li.getBoundingClientRect(); }); }
    function play(first, mover) {
      items.forEach(function (li, i) {
        var a = first[i], b = li.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        var big = li === mover;
        if (big) li.classList.add('fly');
        var an = li.animate([{ transform: 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)' }, { transform: 'none' }], { duration: big ? 380 : 280, easing: EASE });
        if (big) an.onfinish = an.oncancel = function () { li.classList.remove('fly'); };
      });
    }
    function place(li, to, atY) {
      var list = lists[to], ref = null;
      if (atY != null) {
        var sibs = Array.prototype.slice.call(list.children);
        for (var i = 0; i < sibs.length; i++) {
          if (sibs[i] === li) continue;
          var r = sibs[i].getBoundingClientRect();
          if (atY < r.top + r.height / 2) { ref = sibs[i]; break; }
        }
      }
      list.insertBefore(li, ref);
    }
    function moveTo(li, to, opts) {
      opts = opts || {};
      if (to === colOf(li)) return false;
      var b = btnOf(li), hadFocus = document.activeElement === b || opts.focus;
      var first = animates() ? rects() : null; /* ook de sleepplek van het kaartje zelf */
      li.classList.remove('is-drag');
      li.style.transform = '';
      b.style.transform = '';
      if (hv.btn === b) hv.btn = null;
      place(li, to, opts.y);
      paint(li);
      recount();
      if (first) play(first, li);
      if (hadFocus) b.focus({ preventScroll: true });
      say(b.getAttribute('data-title') + ' staat nu in ' + names[to] + '.' + (b.hasAttribute('data-ai') && to > 0 ? ' Gecontroleerd door een mens.' : ''));
      showToast('Status bijgewerkt');
      return true;
    }
    function tap(li, back) { moveTo(li, (colOf(li) + (back ? N - 1 : 1)) % N, { focus: true }); }
    function reset() {
      var first = animates() ? rects() : null;
      home.forEach(function (arr, c) { arr.forEach(function (li) { lists[c].appendChild(li); }); });
      items.forEach(paint);
      recount();
      if (first) play(first, null);
      say('Het bord is teruggezet.');
      showToast('Bord teruggezet');
    }

    /* muis: het kaartje komt licht omhoog (CSS) en kantelt zacht mee met de aanwijzer (één rAF, metingen in de cache) */
    var hv = { btn: null, rect: null, x: 0, y: 0, raf: 0, dirty: true };
    function hvFrame() {
      hv.raf = 0;
      if (!hv.btn) return;
      if (hv.dirty) { hv.rect = hv.btn.parentNode.getBoundingClientRect(); hv.dirty = false; }
      var r = hv.rect, px = clamp((hv.x - r.left) / (r.width || 1), 0, 1) - .5, py = clamp((hv.y - r.top) / (r.height || 1), 0, 1) - .5;
      hv.btn.style.transform = 'perspective(700px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg)';
    }
    function hvLeave() { if (hv.btn) { hv.btn.style.transform = ''; hv.btn = null; } }
    if (fx) {
      board.addEventListener('pointermove', function (ev) {
        if (ev.pointerType === 'touch' || drag) return;
        var b = ev.target.closest('.bk');
        if (b !== hv.btn) { hvLeave(); hv.btn = b; hv.dirty = true; }
        if (!b) return;
        hv.x = ev.clientX; hv.y = ev.clientY;
        if (!hv.raf) hv.raf = requestAnimationFrame(hvFrame);
      });
      board.addEventListener('pointerleave', hvLeave);
      window.addEventListener('scroll', function () { hv.dirty = true; }, { passive: true });
    }

    /* slepen met muis of vinger; blijft het bij een tik (minder dan 8 px), dan gaat het kaartje naar de volgende kolom */
    function measure() {
      drag.rects = cols.map(function (c) { return c.getBoundingClientRect(); });
      drag.area = board.getBoundingClientRect();
    }
    function overAt(x, y) {
      var r = drag.rects, a = drag.area, best = -1, bd = 1e9;
      if (!r || y < a.top - 40 || y > a.bottom + 40 || x < a.left - 30 || x > a.right + 30) return -1;
      r.forEach(function (c, i) { var d = Math.abs(x - (c.left + c.right) / 2); if (d < bd) { bd = d; best = i; } });
      return best === colOf(drag.li) ? -1 : best;
    }
    function dragFrame() {
      if (!drag) return;
      drag.raf = 0;
      drag.li.style.transform = 'translate3d(' + (drag.x - drag.x0) + 'px,' + (drag.y - drag.y0) + 'px,0)';
      if (!drag.rects) measure();
      var over = overAt(drag.x, drag.y);
      if (over !== drag.over) {
        drag.over = over;
        cols.forEach(function (c, i) { c.classList.toggle('is-over', i === over); });
      }
    }
    function snapBack(li) {
      var t = li.style.transform;
      li.classList.remove('is-drag');
      li.style.transform = '';
      if (animates() && t) {
        li.classList.add('fly');
        var an = li.animate([{ transform: t }, { transform: 'none' }], { duration: 240, easing: EASE });
        an.onfinish = an.oncancel = function () { li.classList.remove('fly'); };
      }
    }
    function finish(x, y, cancel) {
      var d = drag;
      if (!d) return;
      if (d.raf) cancelAnimationFrame(d.raf);
      if (!d.on) { drag = null; if (!cancel) tap(d.li); return; }
      if (!d.rects) measure();
      var to = cancel ? -1 : overAt(x, y);
      board.classList.remove('is-dragging');
      cols.forEach(function (c) { c.classList.remove('is-over'); });
      try { d.btn.releasePointerCapture(d.id); } catch (er) { /* al los */ }
      drag = null;
      if (to > -1) moveTo(d.li, to, { y: y }); else snapBack(d.li);
    }
    if (window.PointerEvent) {
      board.addEventListener('pointerdown', function (ev) {
        if (drag || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
        var b = ev.target.closest('.bk');
        if (!b) return;
        drag = { li: b.parentNode, btn: b, id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, on: false, over: -1, raf: 0, rects: null, area: null, type: ev.pointerType };
        hvLeave();
      });
      board.addEventListener('pointermove', function (ev) {
        if (!drag || ev.pointerId !== drag.id) return;
        drag.x = ev.clientX; drag.y = ev.clientY;
        if (!drag.on) {
          var dx = drag.x - drag.x0, dy = drag.y - drag.y0;
          if (Math.hypot(dx, dy) < 8) return;
          if (drag.type === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.2) return; /* verticaal vegen is scrollen */
          drag.on = true;
          try { drag.btn.setPointerCapture(drag.id); } catch (er) { /* niet nodig */ }
          drag.li.classList.add('is-drag');
          board.classList.add('is-dragging');
          measure();
        }
        if (!drag.raf) drag.raf = requestAnimationFrame(dragFrame);
      });
      board.addEventListener('pointerup', function (ev) { if (drag && ev.pointerId === drag.id) finish(ev.clientX, ev.clientY, false); });
      board.addEventListener('pointercancel', function (ev) { if (drag && ev.pointerId === drag.id) finish(ev.clientX, ev.clientY, true); });
      window.addEventListener('resize', function () { if (drag) drag.rects = null; });
      window.addEventListener('scroll', function () { if (drag && drag.on) drag.rects = null; }, { passive: true });
    } else {
      /* geen pointer events: terugvallen op tikken */
      board.addEventListener('click', function (ev) {
        var b = ev.target.closest('.bk');
        if (b && ev.detail !== 0) tap(b.parentNode);
      });
    }
    board.addEventListener('dragstart', function (ev) { ev.preventDefault(); });
    board.addEventListener('contextmenu', function (ev) { if (drag && drag.on) ev.preventDefault(); });

    /* toetsenbord: Enter of spatie vooruit, Shift+Enter of Shift+spatie achteruit, Escape stopt een sleepgebaar */
    board.addEventListener('keydown', function (ev) {
      var b = ev.target.closest('.bk');
      if (!b) return;
      if (ev.key === 'Escape' && drag && drag.on) { ev.preventDefault(); finish(0, 0, true); return; }
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        if (!ev.repeat) tap(b.parentNode, ev.shiftKey);
      }
    });
    board.addEventListener('keyup', function (ev) { if ((ev.key === ' ' || ev.key === 'Spacebar') && ev.target.closest('.bk')) ev.preventDefault(); });

    var rb = win && win.querySelector('.bk-reset');
    if (rb) rb.addEventListener('click', reset);
    items.forEach(paint);
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

  /* ---------- 2. De hero-scène speelt bij het laden (staat in het eerste scherm). Niets in de pagina wacht op scrollen. ---------- */
  $('.hero-stage').forEach(function (el) { el.classList.add('live'); });
  // pauzeren bij een verborgen tabblad: animaties staan dan stil (CSS-lussen lopen niet door op de achtergrond, dit is extra zeker)
  document.addEventListener('visibilitychange', function () { root.classList.toggle('tab-hidden', document.hidden); });

  /* ---------- 3. De werkbank staat als volledige eindtoestand op de pagina. «Speel af» speelt het verhaaltje eenmalig, op een klik. ---------- */
  var B = document.querySelector('.bench');
  if (B) (function () {
    var btn = B.querySelector('[data-play]'), W = B.querySelector('.bw');
    if (!btn || !W) return;
    var label = btn.querySelector('.pl-t'), cur = B.querySelector('.bcur'), rowT = B.querySelector('.row-t'), send = B.querySelector('.send');
    var typed = B.querySelector('.palm-t b'), steps = $('.steps li', B), panel = W.querySelector('.bp');
    var REST = 'win bw s-hov s-sel s-chk1 s-chk2 s-chk3 s-ok s-sent';
    var geo = null, last = {}, playing = false;
    var offset = function (el) {
      var x = 0, y = 0, n = el;
      while (n && n !== W) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x, y: y };
    };
    var measure = function () {
      var w = W.offsetWidth, h = W.offsetHeight, r = offset(rowT), s = offset(send);
      geo = {
        start: { x: w * 0.96, y: h * 1.04 },
        row: { x: r.x + rowT.offsetWidth * 0.34, y: r.y + rowT.offsetHeight * 0.55 },
        btn: { x: s.x + send.offsetWidth * 0.5, y: s.y + send.offsetHeight * 0.5 },
        away: { x: w * 0.22, y: h * 0.7 }
      };
    };
    var pos = function (p) {
      var g = geo, a, b, t;
      if (p < .14) { a = g.start; b = g.row; t = ease(seg(p, .0, .14)); }
      else if (p < .40) { a = b = g.row; t = 0; }
      else if (p < .58) { a = g.row; b = g.btn; t = ease(seg(p, .40, .58)); }
      else if (p < .70) { a = b = g.btn; t = 0; }
      else { a = g.btn; b = g.away; t = ease(seg(p, .70, .80)); }
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
    };
    var set = function (key, val, fn) { if (last[key] !== val) { last[key] = val; fn(val); } };
    var update = function (p) {
      if (!geo) measure();
      var c = pos(p), cx = c.x.toFixed(1) + 'px', cy = c.y.toFixed(1) + 'px';
      set('cx', cx, function (v) { cur.style.setProperty('--cx', v); });
      set('cy', cy, function (v) { cur.style.setProperty('--cy', v); });
      set('co', (seg(p, 0, .05) * (1 - seg(p, .8, .86))).toFixed(2), function (v) { cur.style.opacity = v; });
      set('dx', ((1 - ease(seg(p, .2, .36))) * 104).toFixed(2) + '%', function (v) { panel.style.setProperty('--dx', v); });
      var on = function (cls, cond) { set(cls, cond, function (v) { W.classList.toggle(cls, v); }); };
      on('s-hov', p >= .11); on('s-sel', p >= .17);
      on('s-chk1', p >= .38); on('s-chk2', p >= .44); on('s-chk3', p >= .50); on('s-ok', p >= .52);
      on('s-press', p >= .60 && p < .68); on('s-sent', p >= .62);
      on('s-toast', p >= .64 && p < .82);
      on('s-k1', p >= .80); on('s-pal', p >= .84);
      set('typed', Math.floor(seg(p, .86, .95) * 4 + 0.0001), function (v) { typed.textContent = 'plan'.slice(0, v); });
      var step = p < .2 ? 0 : p < .5 ? 1 : p < .8 ? 2 : 3;
      set('step', step, function (v) {
        steps.forEach(function (li, k) {
          li.classList.toggle('active', k === v);
          if (k === v) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
        });
      });
    };
    var rest = function () {
      last = {};
      W.className = REST;
      panel.style.setProperty('--dx', '0%');
      cur.style.opacity = 0;
      typed.textContent = 'plan';
      steps.forEach(function (li) { li.classList.remove('active'); li.removeAttribute('aria-current'); });
    };
    btn.addEventListener('click', function () {
      if (playing) return;
      playing = true;
      btn.disabled = true;
      label.textContent = 'Speelt af…';
      last = {};
      measure();
      var t0 = performance.now(), D = 10000;
      update(0);
      var tick = function (now) {
        var p = clamp((now - t0) / D, 0, 1);
        update(p);
        if (p < 1) { requestAnimationFrame(tick); return; }
        setTimeout(function () {
          rest();
          playing = false;
          btn.disabled = false;
          label.textContent = 'Speel het voorbeeld opnieuw af';
        }, 1200);
      };
      requestAnimationFrame(tick);
    });
    window.addEventListener('resize', function () { geo = null; });
  })();
})();
