/* 22 Warm: «Zie het in jouw kleur» met contrastmeter, menu op smalle schermen en de hoofdkop bij het laden.
   Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen opslag. De kleurkiezer werkt ook zonder effecten:
   met <html class="no-fx"> verandert de kleur direct, zonder overgang (de overgangen staan in style.css achter .fx). */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fx = root.classList.contains('fx');

  /* ---------- kleurrekenwerk (WCAG 2.2: relatieve luminantie en contrastverhouding) ---------- */
  var PAPER = '#F4EDE4', INK = '#2A1F1A', DEFAULT = '#B4441F';
  var toRgb = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); };
  var toHex = function (c) { return '#' + c.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join('').toUpperCase(); };
  var lin = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  var lum = function (c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); };
  var ratio = function (a, b) { var x = lum(toRgb(a)), y = lum(toRgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // afgekapt, niet afgerond: 4,46 mag geen 4,5 worden
  var fmt = function (r) { return (Math.floor(r * 10) / 10).toFixed(1).replace('.', ',') + ':1'; };
  var grade = function (r) { return r >= 4.5 ? 'ok' : r >= 3 ? 'mid' : 'no'; };
  var GRADE_TXT = { ok: 'Voldoende voor tekst', mid: 'Alleen voor grote tekst en vlakken', no: 'Onvoldoende' };
  var ICON = {
    ok: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.2"/><path d="M5 8.2l2.2 2.2L11.2 6"/></svg>',
    mid: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.2"/><path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" class="fill"/></svg>',
    no: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.2"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8"/></svg>'
  };
  var barPos = function (r) { return Math.max(0, Math.min(1, Math.log(r) / Math.log(21))); };

  function rgbToHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToRgb(a) {
    var h = a[0], s = a[1], l = a[2];
    if (!s) return [l * 255, l * 255, l * 255];
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    var f = function (t) { t = (t + 1) % 1; return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p); };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  }
  // zelfde tint, donkerder, tot er genoeg contrast is met papier (voor gekleurde tekst en randen)
  function darkenTo(hex, target) {
    if (ratio(hex, PAPER) >= target) return hex;
    var hsl = rgbToHsl(toRgb(hex)), out = hex;
    for (var l = hsl[2]; l > 0; l -= 0.005) {
      out = toHex(hslToRgb([hsl[0], hsl[1], l]));
      if (ratio(out, PAPER) >= target) return out;
    }
    return out;
  }
  // beste tekstkleur op een vlak: wit of inkt; haalt geen van beide 4,5:1, dan zwart
  function onColor(hex) {
    var w = ratio('#FFFFFF', hex), k = ratio(INK, hex);
    var best = w >= k ? { c: '#FFFFFF', r: w, n: 'witte' } : { c: INK, r: k, n: 'inktkleurige' };
    if (best.r >= 4.5) return best;
    var z = ratio('#000000', hex);
    return z > best.r ? { c: '#000000', r: z, n: 'zwarte' } : best;
  }

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
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (m) { if (m.matches) set(false); });
  })();

  /* ---------- Zie het in jouw kleur ---------- */
  (function () {
    var sec = document.getElementById('kleur');
    if (!sec) return;
    var pv = document.getElementById('pv'), meter = sec.querySelector('.meter');
    var radios = $('input[name="kleur"]', sec), pick = document.getElementById('cm-pick'), hexIn = document.getElementById('cm-hex');
    var msg = document.getElementById('cm-msg'), reset = document.getElementById('cm-reset'), live = document.getElementById('cm-live');
    var nameEl = document.getElementById('cm-name'), hexEl = document.getElementById('cm-hexo'), stEl = document.getElementById('cm-st'), dot = document.getElementById('cm-dot');
    var sum = document.getElementById('cm-sum'), figState = document.getElementById('cm-state-fig');
    var rows = {};
    $('.mr', meter).forEach(function (li) { rows[li.getAttribute('data-k')] = li; });
    var cur = { hex: DEFAULT, name: 'Terracotta' };   // wat gekozen is
    var shown = null;                                 // wat nu in voorbeeld en meter staat
    var liveTimer = 0;
    var VARS = ['--accent', '--on-accent', '--accent-ink', '--accent-edge'];

    var vars = function (hex) {
      var on = onColor(hex);
      return { '--accent': hex, '--on-accent': on.c, '--accent-ink': darkenTo(hex, 4.55), '--accent-edge': darkenTo(hex, 3.05), on: on };
    };
    var setVars = function (el, v) { VARS.forEach(function (k) { el.style.setProperty(k, v[k]); }); };

    function fillRow(key, r) {
      var li = rows[key], g = grade(r);
      li.setAttribute('data-g', g);
      li.style.setProperty('--p', barPos(r).toFixed(3));
      li.querySelector('.mr-r').textContent = fmt(r);
      li.querySelector('.mr-l').innerHTML = ICON[g] + '<span>' + GRADE_TXT[g] + '</span>';
    }
    // beeld en meter voor één kleur; status: 'Gekozen' of 'Voorbeeld'
    function showMeter(hex, name, status) {
      shown = hex;
      var v = vars(hex), rBg = ratio(hex, PAPER);
      fillRow('bg', rBg); fillRow('wit', ratio('#FFFFFF', hex)); fillRow('ink', ratio(INK, hex));
      nameEl.textContent = name; hexEl.textContent = hex; dot.style.setProperty('--c', hex);
      stEl.textContent = status; figState.textContent = status === 'Gekozen' ? 'gekozen kleur' : 'voorbeeld, klik of tik om te kiezen';
      var t = 'De knoppen gebruiken ' + v.on.n + ' tekst (' + fmt(v.on.r) + ').';
      if (rBg < 4.5) t += ' Als tekst op papier is deze kleur te zwak; gekleurde tekst op deze pagina gebruikt een donkerdere variant (' + v['--accent-ink'] + ').';
      sum.textContent = t;
      return v;
    }
    function bounce() { if (!fx) return; pv.classList.remove('tick'); void pv.offsetWidth; pv.classList.add('tick'); }
    function announce(hex, name) {
      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () {
        var v = vars(hex);
        live.textContent = name + ' ' + hex + ' gekozen. Op papier ' + fmt(ratio(hex, PAPER)) + ', ' + GRADE_TXT[grade(ratio(hex, PAPER))].toLowerCase() + '. Knoppen gebruiken ' + v.on.n + ' tekst, ' + fmt(v.on.r) + '.';
      }, 450);
    }

    // vastleggen: de hele pagina krijgt dit accent
    function commit(hex, name, from) {
      hex = hex.toUpperCase();
      var match = radios.filter(function (r) { return r.value.toUpperCase() === hex; })[0];
      if (match) name = match.getAttribute('data-name');
      cur = { hex: hex, name: name };
      setVars(root, vars(hex));
      VARS.forEach(function (k) { pv.style.removeProperty(k); });
      showMeter(hex, name, 'Gekozen');
      radios.forEach(function (r) { r.checked = r === match; });
      if (from !== 'hex') hexIn.value = hex;
      if (from !== 'pick') pick.value = hex.toLowerCase();
      if (from !== 'hex') { hexIn.removeAttribute('aria-invalid'); msg.textContent = ''; }
      bounce();
      announce(hex, name);
    }
    // alleen kijken (muis over een staal): voorbeeld en meter, de pagina blijft zoals ze was
    function preview(hex, name) {
      if (hex.toUpperCase() === cur.hex.toUpperCase()) { showMeter(cur.hex, cur.name, 'Gekozen'); return; }
      setVars(pv, vars(hex));
      showMeter(hex.toUpperCase(), name, 'Voorbeeld');
    }
    function unpreview() {
      VARS.forEach(function (k) { pv.style.removeProperty(k); });
      showMeter(cur.hex, cur.name, 'Gekozen');
    }

    // hexcode lezen: #abc, abc, #aabbcc, aabbcc
    function parseHex(s) {
      s = String(s).trim().replace(/^#/, '');
      if (!/^[0-9a-fA-F]+$/.test(s)) return { bad: 'chars' };
      if (s.length === 3) s = s.split('').map(function (c) { return c + c; }).join('');
      if (s.length !== 6) return { bad: 'len', n: s.length };
      return { hex: '#' + s.toUpperCase() };
    }
    function hexInput(final) {
      var raw = hexIn.value, p = parseHex(raw), t = raw.trim().replace(/^#/, '');
      if (p.hex && (t.length === 6 || final)) {
        hexIn.removeAttribute('aria-invalid'); msg.textContent = '';
        if (final) hexIn.value = p.hex;
        if (p.hex !== cur.hex) commit(p.hex, 'Eigen kleur', 'hex');
        return;
      }
      if (p.bad === 'chars') { hexIn.setAttribute('aria-invalid', 'true'); msg.textContent = 'Dit is geen hexcode. Gebruik 3 of 6 tekens uit 0-9 en a-f, zoals #B4441F.'; return; }
      if (final && p.bad === 'len') { hexIn.setAttribute('aria-invalid', 'true'); msg.textContent = 'Een hexcode heeft 3 of 6 tekens, zoals #B4441F. Nu zijn het er ' + p.n + '.'; return; }
      hexIn.removeAttribute('aria-invalid'); msg.textContent = '';
    }

    radios.forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) commit(r.value, r.getAttribute('data-name'), 'swatch'); });
    });
    $('.sw', sec).forEach(function (l) {
      var r = l.querySelector('input');
      l.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') preview(r.value, r.getAttribute('data-name')); });
      l.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse') unpreview(); });
    });
    pick.addEventListener('input', function () { commit(pick.value, 'Eigen kleur', 'pick'); });
    hexIn.addEventListener('input', function () { hexInput(false); });
    hexIn.addEventListener('change', function () { hexInput(true); });
    hexIn.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); hexInput(true); } });
    reset.addEventListener('click', function () { commit(DEFAULT, 'Terracotta', 'reset'); });

    // beginstand uit de HTML naar de variabelen (zelfde uitkomst als de bouwer rekende)
    setVars(root, vars(DEFAULT));
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
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('go'); }); });
  });
})();
