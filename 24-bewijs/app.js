/* 24 Bewijs: «Controleer zelf» (Waar staat dit?), kopieerknop voor het ondernemingsnummer en het gsm-menu.
   Alles werkt met muis, tik en toetsenbord. Geen externe verzoeken, geen cookies. Zonder dit script staan alle bronregels gewoon zichtbaar.
   Beweging (CSS) draait alleen als <html> de class «fx» heeft. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  if (root.classList.contains('fx')) window.__fx = 1;

  // 1. «Waar staat dit?»: voegt een bronregel toe, verbergt niets.
  var btns = $('.wd');
  var all = document.querySelector('.alle');
  var panel = function (b) { return document.getElementById(b.getAttribute('aria-controls')); };
  var setOpen = function (b, open) {
    var p = panel(b);
    if (!p) return;
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    p.classList.toggle('is-open', open);
    if (b.closest('.bl')) b.closest('.bl').classList.toggle('is-open', open);
  };
  var syncAll = function () {
    if (!all) return;
    var every = btns.every(function (b) { return b.getAttribute('aria-expanded') === 'true'; });
    all.setAttribute('aria-pressed', every ? 'true' : 'false');
    all.firstElementChild.textContent = every ? 'Verberg alle bronnen' : 'Toon alle bronnen';
  };
  btns.forEach(function (b) {
    b.addEventListener('click', function () { setOpen(b, b.getAttribute('aria-expanded') !== 'true'); syncAll(); });
  });
  if (all) all.addEventListener('click', function () {
    var open = all.getAttribute('aria-pressed') !== 'true';
    btns.forEach(function (b) { setOpen(b, open); });
    syncAll();
  });
  // Een link naar #belofte-3 opent meteen de bron van die belofte.
  var m = /^#belofte-(\d+)$/.exec(location.hash);
  if (m) { var hb = document.querySelector('#belofte-' + m[1] + ' .wd'); if (hb) { setOpen(hb, true); syncAll(); } }

  // 2. Kopieer het ondernemingsnummer, met bevestiging «Gekopieerd».
  var kb = document.querySelector('.kopieer');
  var status = document.getElementById('kop-ok');
  var nrEl = document.getElementById('ondnr');
  var timer = 0;
  var fallbackCopy = function (t) {
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      if (ok) res(); else rej(new Error('kopiëren mislukt'));
    });
  };
  var copy = function (t) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(t).catch(function () { return fallbackCopy(t); });
    }
    return fallbackCopy(t);
  };
  if (kb) kb.addEventListener('click', function () {
    var t = kb.getAttribute('data-copy');
    var lab = kb.querySelector('.k-lab');
    copy(t).then(function () {
      kb.setAttribute('data-state', 'ok');
      lab.textContent = 'Gekopieerd';
      status.textContent = 'Gekopieerd: ' + t;
      clearTimeout(timer);
      timer = setTimeout(function () { kb.removeAttribute('data-state'); lab.textContent = 'Kopieer'; status.textContent = ''; }, 3000);
    }, function () {
      // Lukt het kopiëren niet (strenge browserinstelling), dan selecteren we het nummer zodat Ctrl+C of lang tikken werkt.
      status.textContent = 'Kopiëren lukt hier niet. Het nummer is geselecteerd: kopieer het zelf.';
      var r = document.createRange(); r.selectNodeContents(nrEl);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    });
  });

  // 3. Menu op gsm.
  var mb = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  if (mb && nav) {
    var close = function () { nav.classList.remove('is-open'); mb.setAttribute('aria-expanded', 'false'); };
    mb.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open); mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (ev) { if (ev.target.closest('a')) close(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && nav.classList.contains('is-open')) { close(); mb.focus(); } });
  }
})();
