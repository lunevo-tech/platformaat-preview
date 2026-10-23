/* Zaklamp: een lichtbundel volgt de muis of vinger. Zonder aanwijzer dwaalt het licht rustig rond. Bij "minder beweging" is alles gewoon verlicht. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.classList.add('lit-all'); return; }
  var lit = document.querySelector('.litx');
  var x = window.innerWidth * 0.6, y = window.innerHeight * 0.4, tx = x, ty = y, last = 0, t = 0;
  function set(e) { tx = e.clientX; ty = e.clientY; last = performance.now(); }
  window.addEventListener('pointermove', set, { passive: true });
  window.addEventListener('pointerdown', set, { passive: true });
  (function loop(now) {
    t += 0.008;
    if (now - last > 2500) { tx = window.innerWidth * (0.5 + 0.34 * Math.sin(t * 1.3)); ty = window.innerHeight * (0.45 + 0.3 * Math.sin(t * 1.9 + 1)); }
    x += (tx - x) * 0.12; y += (ty - y) * 0.12;
    root.style.setProperty('--x', x.toFixed(1) + 'px'); root.style.setProperty('--y', y.toFixed(1) + 'px');
    if (lit) { var r = lit.getBoundingClientRect(); lit.style.setProperty('--lx', (x - r.left).toFixed(1) + 'px'); lit.style.setProperty('--ly', (y - r.top).toFixed(1) + 'px'); }
    requestAnimationFrame(loop);
  })(0);
  /* kaarten lichten op waar de muis is */
  document.querySelectorAll('.spot').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
})();
