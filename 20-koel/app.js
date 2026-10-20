/* 20 Koel: de Regel-koppelaar, het commandopalet (Ctrl+K) en het menu. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
   Alles werkt ook zonder effecten. De beweging draait alleen als <html> de class «fx» heeft; anders staat alles op zijn eindplek en verschijnt de lijn direct. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
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

  /* ---------- Regel-koppelaar ---------- */
  (function () {
    var fig = document.getElementById('koppelaar');
    if (!fig) return;
    var stage = fig.querySelector('.kp-stage'), svg = fig.querySelector('.kp-svg');
    var path = svg.querySelector('.kp-path'), na = svg.querySelector('.kp-na'), nb = svg.querySelector('.kp-nb');
    var status = document.getElementById('kp-status');
    var docL = fig.querySelector('.doc-l'), docR = fig.querySelector('.doc-r');
    var lists = $('.rows', fig), rows = $('.ln', fig);
    var side = { l: [], r: [] };
    rows.forEach(function (li) { side[li.getAttribute('data-s')].push(li); });
    var wide = window.matchMedia('(min-width: 761px)');
    var SHIFT = 6;

    var pidOf = function (li) { return +li.getAttribute('data-p'); };
    var rowOf = function (s, p) { return side[s].filter(function (li) { return pidOf(li) === p; })[0]; };
    var text = function (li, sel) { return li.querySelector(sel).textContent.trim(); };

    // toestand: muis, toetsenbordfocus, vaste keuze (begint met regel 1, zoals ook in de HTML staat)
    var hov = null, foc = null, pin = 0;
    var lastShown = -2, lastPin = -2, lastKey = '';
    var shown = function () { return hov !== null ? hov : foc !== null ? foc : pin; };

    // rollen en toetsenbordbediening (een tabstop; pijltjes binnen en tussen de offertes)
    lists.forEach(function (ul) { ul.setAttribute('role', 'listbox'); ul.setAttribute('aria-label', ul.getAttribute('data-label')); });
    rows.forEach(function (li) { li.setAttribute('role', 'option'); li.setAttribute('tabindex', '-1'); li.setAttribute('aria-selected', pidOf(li) === pin ? 'true' : 'false'); });
    side.l[0].setAttribute('tabindex', '0');

    function message(p) {
      if (p === null) return status.getAttribute('data-none');
      var a = rowOf('l', p), b = rowOf('r', p);
      return 'Regel ' + (p + 1) + ': «' + text(a, '.ln-t') + '» wordt «' + text(b, '.ln-t') + '» in de klantofferte, ' + text(b, '.ln-l') + '.';
    }

    // meetpunt in het coördinatenstelsel van het tekenvlak, zonder transform (offsets)
    function off(el) {
      var x = 0, y = 0, n = el;
      while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x, y: y };
    }
    function draw(p, animate) {
      if (p === null || !wide.matches) { svg.classList.remove('on'); lastKey = ''; return; }
      var a = rowOf('l', p), b = rowOf('r', p), pa = off(a), pb = off(b);
      var sh = fx ? SHIFT : 0;
      var x1 = pa.x + a.offsetWidth + sh, y1 = pa.y + a.offsetHeight / 2;
      var x2 = pb.x - sh, y2 = pb.y + b.offsetHeight / 2;
      var xm = (off(docL).x + docL.offsetWidth + off(docR).x) / 2;
      var dy = y2 - y1, r = Math.min(8, Math.abs(dy) / 2), sg = dy >= 0 ? 1 : -1;
      var d = Math.abs(dy) < 1 ? 'M' + x1 + ' ' + y1 + 'H' + x2
        : 'M' + x1 + ' ' + y1 + 'H' + (xm - r) + 'Q' + xm + ' ' + y1 + ' ' + xm + ' ' + (y1 + sg * r) + 'V' + (y2 - sg * r) + 'Q' + xm + ' ' + y2 + ' ' + (xm + r) + ' ' + y2 + 'H' + x2;
      var w = stage.clientWidth, h = stage.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      path.setAttribute('d', d);
      na.setAttribute('cx', x1); na.setAttribute('cy', y1);
      nb.setAttribute('cx', x2); nb.setAttribute('cy', y2);
      svg.classList.add('on');
      var key = p + ':' + d;
      if (animate && fx && key !== lastKey && path.animate) {
        path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' });
        na.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
        nb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 240, fill: 'backwards' });
      }
      lastKey = key;
    }
    function render() {
      var s = shown();
      if (s !== lastShown) {
        rows.forEach(function (li) { li.classList.toggle('is-on', s !== null && pidOf(li) === s); });
        status.textContent = message(s);
        draw(s, true);
        lastShown = s;
      }
      if (pin !== lastPin) {
        rows.forEach(function (li) { li.setAttribute('aria-selected', pin !== null && pidOf(li) === pin ? 'true' : 'false'); });
        lastPin = pin;
      }
    }

    rows.forEach(function (li) {
      var p = pidOf(li);
      li.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') { hov = p; render(); } });
      li.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse') { hov = null; render(); } });
      li.addEventListener('click', function () { pin = p; render(); });
      li.addEventListener('focus', function () {
        rows.forEach(function (o) { o.setAttribute('tabindex', o === li ? '0' : '-1'); });
        foc = p; render();
      });
      li.addEventListener('blur', function () { foc = null; render(); });
      li.addEventListener('keydown', function (ev) {
        var k = ev.key, s = li.getAttribute('data-s'), list = side[s], i = list.indexOf(li), to = null;
        if (k === 'ArrowDown') to = list[Math.min(i + 1, list.length - 1)];
        else if (k === 'ArrowUp') to = list[Math.max(i - 1, 0)];
        else if (k === 'Home') to = list[0];
        else if (k === 'End') to = list[list.length - 1];
        else if (k === 'ArrowRight' && s === 'l') to = rowOf('r', p);
        else if (k === 'ArrowLeft' && s === 'r') to = rowOf('l', p);
        else if (k === 'Enter' || k === ' ') { ev.preventDefault(); pin = p; render(); return; }
        else if (k === 'Escape') { ev.preventDefault(); pin = null; render(); return; }
        else return;
        ev.preventDefault();
        if (to) to.focus();
      });
    });

    // opnieuw tekenen bij een andere maat of nadat de lettertypen geladen zijn (zonder animatie)
    var again = function () { draw(shown(), false); };
    if (window.ResizeObserver) new ResizeObserver(again).observe(stage); else window.addEventListener('resize', again);
    if (wide.addEventListener) wide.addEventListener('change', again);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastKey = ''; draw(shown(), false); });
    draw(shown(), fx);
    lastShown = shown(); lastPin = pin;
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

  if (!fx) return;
  window.__fx = 1;

  /* ---------- Hoofdkop: woord voor woord omhoog, eenmalig bij het laden ---------- */
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

  // pauzeren bij een verborgen tabblad
  document.addEventListener('visibilitychange', function () { root.classList.toggle('tab-hidden', document.hidden); });
})();
