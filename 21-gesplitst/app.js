/* 21 Gesplitst: het menu op smalle schermen, de voor/na-schuif en de beweging bij het laden. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
   De schuif werkt ook zonder effecten (class «fx» op <html>): dan springt de lijn zonder glijden. Niets hangt van scrollen af. */
(function () {
  'use strict';
  var root = document.documentElement;
  var fx = root.classList.contains('fx');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

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
      if (ev.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') set(false, true);
    });
    document.addEventListener('click', function (ev) { if (!top.contains(ev.target)) set(false); });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) set(false); });
  })();

  /* ---------- de voor/na-schuif ----------
     Links van de lijn de leveranciersofferte, rechts de klantofferte. Waarde = plaats van de lijn in procent van links.
     Bediening: slepen met muis of vinger, ergens tikken (de lijn springt daarheen), pijltjestoetsen (stap per 5 %), Home en End.
     Beide versies staan ook als gewone tekst onder het beeld; niets is alleen via slepen bereikbaar. */
  (function () {
    var cmp = document.querySelector('[data-cmp]');
    if (!cmp) return;
    var frame = cmp.querySelector('.cmp-frame'), handle = cmp.querySelector('[role="slider"]'), out = cmp.querySelector('[data-val]');
    var target = 50, shown = 50, tween = 0;
    var dragging = false, pending = false, id = null, sx = 0, sy = 0, onHandle = false;

    var text = function (n) {
      return 'Lijn op ' + n + ' %: links de leveranciersofferte (' + n + ' % zichtbaar), rechts de klantofferte (' + (100 - n) + ' % zichtbaar)';
    };
    var paint = function (v) { shown = v; cmp.style.setProperty('--p', v.toFixed(2) + '%'); };
    var report = function (v) {
      var n = Math.round(v);
      handle.setAttribute('aria-valuenow', String(n));
      handle.setAttribute('aria-valuetext', text(n));
      if (out) out.textContent = String(n);
    };
    // zet de waarde: de aanduiding is meteen goed; de lijn volgt in hetzelfde beeld (bij slepen) of glijdt heel kort (bij een sprong, alleen met effecten)
    var set = function (v, glide) {
      v = clamp(v, 0, 100);
      target = v;
      report(v);
      cancelAnimationFrame(tween);
      if (!glide || !fx) { paint(v); return; }
      var from = shown, t0 = performance.now(), D = 150;
      paint(from + (v - from) * 0.4);
      var step = function (now) {
        var t = clamp((now - t0) / D, 0, 1), k = 1 - Math.pow(1 - t, 3);
        paint(from + (v - from) * (0.4 + 0.6 * k));
        if (t < 1) tween = requestAnimationFrame(step); else paint(v);
      };
      tween = requestAnimationFrame(step);
    };
    var fromX = function (x) {
      var r = frame.getBoundingClientRect();
      return r.width ? (x - r.left) / r.width * 100 : 50;
    };
    var begin = function (ev) {
      dragging = true; pending = false;
      try { frame.setPointerCapture(ev.pointerId); } catch (er) { /* niet elke browser laat dit toe */ }
      cmp.classList.add('is-drag');
      set(fromX(ev.clientX), !onHandle);
      if (document.activeElement !== handle) handle.focus({ preventScroll: true });
    };
    var end = function () { dragging = false; pending = false; id = null; cmp.classList.remove('is-drag'); };

    frame.addEventListener('pointerdown', function (ev) {
      if (ev.button > 0 || id !== null) return;
      id = ev.pointerId; sx = ev.clientX; sy = ev.clientY;
      onHandle = handle.contains(ev.target);
      // vinger buiten de greep: pas beslissen als duidelijk is of het slepen of scrollen wordt (verticaal scrollen blijft werken)
      if (ev.pointerType === 'touch' && !onHandle) { pending = true; return; }
      begin(ev);
    });
    frame.addEventListener('pointermove', function (ev) {
      if (ev.pointerId !== id) return;
      if (dragging) { set(fromX(ev.clientX), false); return; }
      if (pending) {
        var dx = Math.abs(ev.clientX - sx), dy = Math.abs(ev.clientY - sy);
        if (dx > 6 && dx > dy) begin(ev);
        else if (dy > 10) { pending = false; }
      }
    });
    frame.addEventListener('pointerup', function (ev) {
      if (ev.pointerId !== id) return;
      if (pending && Math.abs(ev.clientX - sx) < 10 && Math.abs(ev.clientY - sy) < 10) { onHandle = false; set(fromX(ev.clientX), true); handle.focus({ preventScroll: true }); }
      end();
    });
    frame.addEventListener('pointercancel', function (ev) { if (ev.pointerId === id) end(); });
    frame.addEventListener('dragstart', function (ev) { ev.preventDefault(); });

    handle.addEventListener('keydown', function (ev) {
      var k = ev.key, v = Math.round(target), n = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') n = v - 5;
      else if (k === 'ArrowRight' || k === 'ArrowUp') n = v + 5;
      else if (k === 'PageDown') n = v - 10;
      else if (k === 'PageUp') n = v + 10;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = 100;
      if (n === null) return;
      ev.preventDefault();
      set(n, false);
    });
    Array.prototype.forEach.call(cmp.querySelectorAll('[data-to]'), function (b) {
      b.addEventListener('click', function () { set(parseFloat(b.getAttribute('data-to')), true); });
    });
    report(50);
  })();

  if (!fx) return;
  window.__fx = 1;

  /* ---------- Hoofdkop: woord voor woord omhoog, eenmalig bij het laden ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.hero h1'), function (h) {
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
