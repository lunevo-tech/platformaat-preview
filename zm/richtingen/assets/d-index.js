/* Index: klok, beeld dat de muis volgt, en tekst die woord voor woord donker wordt tijdens het scrollen. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clk = document.getElementById('clk');
  if (clk) { var tick = function () { try { clk.textContent = new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' }); } catch (e) {} }; tick(); setInterval(tick, 20000); }
  /* beeld volgt de muis */
  var peek = document.querySelector('.peek'), rows = document.querySelectorAll('.row');
  if (peek && rows.length && window.matchMedia('(hover:hover)').matches) {
    var im = null; var tx = 0, ty = 0, cx = 0, cy = 0, on = false;
    rows.forEach(function (r) { var p = new Image(); p.src = r.getAttribute('data-img'); });
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { if (!im) { im = document.createElement('img'); im.alt = ''; peek.appendChild(im); } im.src = r.getAttribute('data-img'); peek.classList.add('on'); document.querySelector('.rows').classList.add('hov'); r.classList.add('cur'); });
      r.addEventListener('mouseleave', function () { peek.classList.remove('on'); document.querySelector('.rows').classList.remove('hov'); r.classList.remove('cur'); });
      r.addEventListener('focus', function () { r.classList.add('cur'); });
    });
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!on) { cx = tx; cy = ty; on = true; } });
    (function loop() {
      cx += (tx - cx) * (reduce ? 1 : 0.14); cy += (ty - cy) * (reduce ? 1 : 0.14);
      peek.style.transform = 'translate3d(' + (cx + 28) + 'px,' + (cy - 150) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }
  /* woorden lichten op */
  var sec = document.getElementById('rvl'), p = document.querySelector('[data-reveal]');
  if (sec && p) {
    var words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map(function (w) { return '<span class="wl">' + w + '</span>'; }).join(' ');
    var spans = p.querySelectorAll('.wl');
    if (reduce) { spans.forEach(function (s) { s.classList.add('lit'); }); return; }
    var upd = function () {
      var r = sec.getBoundingClientRect(), pr = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
      var n = Math.round(pr * 1.15 * spans.length);
      spans.forEach(function (s, i) { s.classList.toggle('lit', i < n); });
    };
    window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  }
})();
