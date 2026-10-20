/* 23 Groot: menu op smalle schermen, «Alles openklappen», het reagerende «Snel contact» en het terugbelformulier.
   Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies. Alles werkt met muis, tik en toetsenbord.
   De beweging (kop woord voor woord omhoog) draait alleen als <html> de class «fx» heeft. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fx = root.classList.contains('fx');

  // iOS Safari toont :active pas als er een aanraak-luisteraar bestaat
  document.addEventListener('touchstart', function () {}, { passive: true });

  // knoppen die zonder JavaScript niets doen, tonen we nu
  $('.js-only').forEach(function (n) { n.hidden = false; });

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
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') set(false, true); });
    document.addEventListener('click', function (ev) { if (!top.contains(ev.target)) set(false); });
    window.matchMedia('(min-width: 1120px)').addEventListener('change', function (m) { if (m.matches) set(false); });
  })();

  /* ---------- «Alles openklappen / dichtklappen» per groep ---------- */
  $('[data-group]').forEach(function (g) {
    var sec = g.closest('section');
    var btn = sec && sec.querySelector('[data-toggle-all]');
    if (!btn) return;
    var all = $('details', g);
    var label = btn.getAttribute('aria-label').replace(/^[^:]*:\s*/, '');
    var sync = function () {
      var every = all.every(function (d) { return d.open; });
      btn.querySelector('.tog-t').textContent = every ? 'Alles dichtklappen' : 'Alles openklappen';
      btn.setAttribute('aria-label', (every ? 'Alles dichtklappen: ' : 'Alles openklappen: ') + label);
      btn.setAttribute('data-all', every ? 'open' : 'dicht');
    };
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var every = all.every(function (d) { return d.open; });
      all.forEach(function (d) { d.open = !every; });
      sync();
    });
    all.forEach(function (d) { d.addEventListener('toggle', sync); });
    sync();
  });

  /* ---------- Snel contact: drie reusachtige tikvlakken die direct reageren ---------- */
  (function () {
    var tiles = $('.sc');
    if (!tiles.length) return;
    var picked = null;
    var rest = function (t) { return picked === t ? 'picked' : 'idle'; };
    var set = function (t, s) { if (t.getAttribute('data-state') !== s) t.setAttribute('data-state', s); };
    tiles.forEach(function (t) {
      t.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse' && t.getAttribute('data-state') !== 'press') set(t, 'hover'); });
      t.addEventListener('pointerleave', function () { set(t, rest(t)); });
      t.addEventListener('pointerdown', function () { set(t, 'press'); });
      t.addEventListener('pointerup', function (ev) { set(t, ev.pointerType === 'mouse' ? 'hover' : rest(t)); });
      t.addEventListener('pointercancel', function () { set(t, rest(t)); });
      t.addEventListener('focus', function () { if (t.matches(':focus-visible')) set(t, 'focus'); });
      t.addEventListener('blur', function () { set(t, rest(t)); });
      t.addEventListener('click', function () {
        if (picked && picked !== t) set(picked, 'idle');
        picked = t;
        set(t, 'picked');
      });
    });
  })();

  /* ---------- terugbelformulier: verstuurt niets ---------- */
  (function () {
    var form = document.getElementById('terugbel');
    if (!form) return;
    var naam = document.getElementById('cb-naam'), nr = document.getElementById('cb-nr');
    var status = document.getElementById('cb-status');
    var err = function (inp, show) {
      var m = document.getElementById(inp.getAttribute('aria-describedby'));
      if (m) m.hidden = !show;
      if (show) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
    };
    [naam, nr].forEach(function (inp) { inp.addEventListener('input', function () { if (inp.getAttribute('aria-invalid')) err(inp, !valid(inp)); }); });
    var valid = function (inp) {
      if (inp === naam) return naam.value.trim().length > 0;
      return (nr.value.match(/\d/g) || []).length >= 8;
    };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var bad = [naam, nr].filter(function (i) { var ok = valid(i); err(i, !ok); return !ok; });
      if (bad.length) { status.hidden = true; bad[0].focus(); return; }
      status.hidden = false;
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
})();
