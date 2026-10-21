/* 12c Platform (op basis van 12b Palet): het commandopalet (Ctrl+K) en de beweging. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
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
  var EN = root.getAttribute('lang') === 'en';

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
      live.textContent = vis.length ? vis.length + (EN ? (vis.length === 1 ? ' result' : ' results') : (vis.length === 1 ? ' resultaat' : ' resultaten')) : (EN ? 'Nothing found' : 'Niets gevonden');
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

  /* ---------- Aanbod: de rij waar je op wijst of tikt laat zijn schermvoorbeeld zien in het vaste vlak ernaast ---------- */
  (function () {
    var wrap = document.querySelector('.ab-wrap');
    if (!wrap) return;
    var stage = wrap.querySelector('.ab-stage-in'), rows = $('.ab-row', wrap), cur = null;
    var set = function (row) {
      if (row === cur) return;
      cur = row;
      rows.forEach(function (r) { r.classList.toggle('is-on', r === row); });
      var fg = row.querySelector('.fg');
      stage.innerHTML = fg ? fg.outerHTML : '';
      var cap = wrap.querySelector('.ab-cap b'), h = row.querySelector('h3');
      if (cap && h) cap.textContent = h.textContent;
    };
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { set(r); });
      r.addEventListener('click', function () { set(r); });
      r.addEventListener('focusin', function () { set(r); });
    });
    var fromHash = function () {
      var r = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (r && rows.indexOf(r) > -1) set(r);
    };
    window.addEventListener('hashchange', fromHash);
    set(rows[0]);
    fromHash();
    wrap.classList.add('is-live');
  })();

  /* ---------- Werk: de filters boven de projectenlijst werken echt ---------- */
  (function () {
    var win = document.querySelector('.ww');
    if (!win) return;
    var tabs = $('.tab[data-f]', win), items = $('.pr', win), live = document.getElementById('werk-live');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var f = t.getAttribute('data-f'), n = 0;
        tabs.forEach(function (o) { var on = o === t; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        items.forEach(function (li) {
          var show = f === 'alle' || li.getAttribute('data-k') === f;
          li.hidden = !show;
          if (show) n++;
        });
        if (live) live.textContent = n + (EN ? (n === 1 ? ' project' : ' projects') : (n === 1 ? ' project' : ' projecten'));
      });
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
