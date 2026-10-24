/* W3c: onderdelen-verkenner en beweging. Alles beweegt vanzelf vanaf het laden; niets hangt van scrollen af.
   Pauzeknop: bevriest de beweging op de hele pagina (ook het voorbeeldplatform in het venster). Bij «minder beweging» in het besturingssysteem
   staat elke scène in zijn eindtoestand tot de bezoeker zelf op «Speel beweging af» drukt. De keuze blijft alleen in dit tabblad (sessionStorage). */
'use strict';
(function () {
  var d = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var stored = null;
  try { stored = sessionStorage.getItem('pm-beweging'); } catch (e) { /* mag ontbreken */ }
  var playing = stored ? stored === 'aan' : !reduce;
  var buttons = [].slice.call(document.querySelectorAll('.mv-btn'));
  var listeners = [];

  function apply() {
    d.classList.toggle('mv-play', playing);
    d.classList.toggle('mv-pause', !playing);
    [].forEach.call(document.querySelectorAll('svg'), function (s) {
      if (s.pauseAnimations) { if (playing) s.unpauseAnimations(); else s.pauseAnimations(); }
    });
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(!playing));
      var l = b.querySelector('.lbl'); if (l) l.textContent = playing ? 'Pauzeer beweging' : 'Speel beweging af';
    });
    [].forEach.call(document.querySelectorAll('iframe.pf-frame'), function (f) {
      try { f.contentWindow.postMessage({ pmBeweging: playing ? 'aan' : 'uit' }, '*'); } catch (e) { /* mag ontbreken */ }
    });
    listeners.forEach(function (fn) { fn(playing); });
  }
  function set(v) {
    playing = v;
    try { sessionStorage.setItem('pm-beweging', playing ? 'aan' : 'uit'); } catch (e) { /* mag ontbreken */ }
    apply();
  }
  buttons.forEach(function (b) { b.addEventListener('click', function () { set(!playing); }); });
  window.addEventListener('message', function (e) {
    if (e.data && e.data.pmVraagBeweging) { try { e.source.postMessage({ pmBeweging: playing ? 'aan' : 'uit' }, '*'); } catch (err) { /* mag ontbreken */ } }
  });

  /* ---- de verkenner ---- */
  var ex = document.querySelector('[data-explorer]');
  if (ex) {
    var tabs = [].slice.call(ex.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var CYCLE = 9000, cur = 0, timer = null, touched = false, hoverT = null;
    ex.style.setProperty('--cycle', CYCLE / 1000 + 's');
    var select = function (i, byUser) {
      cur = i;
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; panels[j].hidden = j !== i; });
      var tl = tabs[0].parentNode; if (tl.scrollWidth > tl.clientWidth + 2) tl.scrollTo({ left: Math.max(0, tabs[i].offsetLeft - 16), behavior: 'smooth' });
      if (byUser) { touched = true; stop(); } else if (!touched && playing) start();
    };
    var stop = function () { clearTimeout(timer); timer = null; ex.classList.remove('auto'); };
    var start = function () {
      clearTimeout(timer); if (touched || !playing || document.hidden) { ex.classList.remove('auto'); return; }
      ex.classList.remove('auto'); void ex.offsetWidth; ex.classList.add('auto');
      timer = setTimeout(function () { select((cur + 1) % tabs.length, false); }, CYCLE);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, true); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault(); tabs[n].focus(); select(n, true);
      });
      t.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(hoverT); hoverT = setTimeout(function () { if (cur !== i) select(i, true); else { touched = true; stop(); } }, 140);
      });
      t.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
    });
    ex.classList.add('js');
    document.documentElement.classList.add('js');
    select(0, false);
    listeners.push(function (p) { if (p && !touched) start(); else stop(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (playing && !touched) start(); });
    ex.addEventListener('focusin', function () { touched = true; stop(); });
  }
  apply();
})();
