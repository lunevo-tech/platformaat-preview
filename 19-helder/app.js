/* 19 Helder: het menu op smalle schermen en «Kies jouw situatie». Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
   «Kies jouw situatie» markeert één onderdeel van het aanbod (accentrand en label «Past bij jou»); er wordt nooit iets verborgen of gedimd.
   De beweging (kop woord voor woord, schuivende markering) draait alleen als <html> de class «fx» heeft; anders staat alles direct op zijn plek. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
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
      if (ev.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') set(false, true);
    });
    document.addEventListener('click', function (ev) { if (!top.contains(ev.target)) set(false); });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) set(false); });
  })();

  /* ---------- Kies jouw situatie ---------- */
  (function () {
    var kies = document.getElementById('kies'), wrap = document.getElementById('ab-wrap'), mark = document.getElementById('mark'), uitleg = document.getElementById('uitleg');
    if (!kies || !wrap || !mark || !uitleg) return;
    var btns = $('.kies-b', kies);
    var rows = $('.ab-row', wrap);
    var pin = -1, hover = -1, supp = -1, timer = 0, curRow = null, markOn = false;

    function fillUitleg(host, i) {
      while (host.firstChild) host.removeChild(host.firstChild);
      var p, b;
      if (i < 0) {
        p = document.createElement('p'); p.className = 'u-0'; p.textContent = 'Nog niets gekozen. Tik of beweeg over een zin hierboven.';
        host.appendChild(p);
        return;
      }
      b = btns[i];
      var t = document.createElement('div'); t.className = 'u-t';
      p = document.createElement('p');
      var k = document.createElement('span'); k.className = 'u-k'; k.textContent = 'Past bij jou: ' + b.getAttribute('data-title');
      p.appendChild(k); t.appendChild(p);
      p = document.createElement('p'); p.textContent = b.getAttribute('data-text'); t.appendChild(p);
      host.appendChild(t);
      var s = document.createElement('div'); s.className = 'u-s';
      var a = document.createElement('a'); a.className = 'u-l'; a.href = '#' + b.getAttribute('data-row');
      a.appendChild(document.createTextNode('Naar dit onderdeel'));
      var ar = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      ar.setAttribute('class', 'ar'); ar.setAttribute('viewBox', '0 0 16 16'); ar.setAttribute('aria-hidden', 'true'); ar.setAttribute('focusable', 'false');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', 'M3 8h9.5M8.5 4l4 4-4 4');
      ar.appendChild(path); a.appendChild(ar);
      s.appendChild(a);
      if (pin === i) {
        var h = document.createElement('p'); h.className = 'u-h'; h.textContent = 'Tik nog eens op dezelfde zin om de aanduiding te wissen.';
        s.appendChild(h);
      }
      host.appendChild(s);
    }
    function setUitleg(i) { fillUitleg(uitleg, i); }
    // ruimte voor de langste uitleg vrijhouden (breder dan een gsm), zodat het aanbod eronder niet verspringt bij een andere keuze
    function reserve() {
      uitleg.style.minHeight = '';
      if (window.matchMedia('(max-width: 640px)').matches) return;
      var g = document.createElement('div'), max = 0;
      g.className = 'uitleg'; g.setAttribute('aria-hidden', 'true');
      g.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;min-height:0;width:' + uitleg.offsetWidth + 'px';
      uitleg.parentNode.insertBefore(g, uitleg.nextSibling);
      btns.forEach(function (b, k) { fillUitleg(g, k); max = Math.max(max, g.offsetHeight); });
      uitleg.parentNode.removeChild(g);
      uitleg.style.minHeight = max + 'px';
    }
    function place(row, snap) {
      var w = wrap.getBoundingClientRect(), r = row.getBoundingClientRect();
      if (snap) mark.classList.add('snap');
      mark.style.transform = 'translate3d(0,' + Math.round(r.top - w.top) + 'px,0)';
      mark.style.height = Math.round(r.height) + 'px';
      if (snap) { void mark.offsetWidth; requestAnimationFrame(function () { mark.classList.remove('snap'); }); }
    }
    function render() {
      var i = hover > -1 ? hover : pin;
      btns.forEach(function (b, k) {
        b.classList.toggle('is-on', pin === k);
        b.classList.toggle('is-peek', hover === k && pin !== k);
        b.setAttribute('aria-pressed', pin === k ? 'true' : 'false');
      });
      setUitleg(i);
      var row = i > -1 ? document.getElementById(btns[i].getAttribute('data-row')) : null;
      rows.forEach(function (r) {
        var on = r === row, m = r.querySelector('.ab-m');
        if (on) r.setAttribute('data-match', ''); else r.removeAttribute('data-match');
        if (m) m.hidden = !on;
      });
      kies.setAttribute('data-keuze', i > -1 ? btns[i].getAttribute('data-row') : '');
      kies.setAttribute('data-vast', pin > -1 ? btns[pin].getAttribute('data-row') : '');
      if (row) {
        place(row, !markOn);
        mark.classList.add('on'); markOn = true; curRow = row;
      } else {
        mark.classList.remove('on'); markOn = false; curRow = null;
      }
    }

    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        clearTimeout(timer);
        if (pin === i) { pin = -1; supp = i; hover = -1; } else { pin = i; supp = -1; }
        render();
      });
      b.addEventListener('pointerenter', function (ev) {
        if (ev.pointerType !== 'mouse') return;
        clearTimeout(timer);
        if (supp === i) return;
        hover = i; render();
      });
      b.addEventListener('pointerleave', function (ev) {
        if (ev.pointerType !== 'mouse') return;
        if (supp === i) supp = -1;
        clearTimeout(timer);
        // korte wachttijd: over de ruimte tussen twee knoppen knippert de markering niet
        timer = setTimeout(function () { if (hover === i) { hover = -1; render(); } }, 140);
      });
      b.addEventListener('focus', function () {
        btns.forEach(function (x) { x.tabIndex = x === b ? 0 : -1; });
      });
    });
    // pijltjes tussen de vier knoppen; Enter en spatie kiezen (gewone knop); Escape wist
    kies.addEventListener('keydown', function (ev) {
      var cur = btns.indexOf(document.activeElement);
      if (cur < 0) return;
      var k = ev.key, to = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') to = (cur + 1) % btns.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (cur - 1 + btns.length) % btns.length;
      else if (k === 'Home') to = 0;
      else if (k === 'End') to = btns.length - 1;
      else if (k === 'Escape' && (pin > -1 || hover > -1)) { ev.preventDefault(); pin = -1; hover = -1; render(); return; }
      if (to > -1) { ev.preventDefault(); btns[to].focus(); }
    });

    var again = function () { reserve(); if (curRow) place(curRow, true); };
    if ('ResizeObserver' in window) new ResizeObserver(again).observe(wrap);
    window.addEventListener('resize', again);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
    reserve();
    render();
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
