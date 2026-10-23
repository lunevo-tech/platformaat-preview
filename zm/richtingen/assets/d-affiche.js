/* Affiche: sleepbare stickers en kaarten die meekantelen met de muis. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* stickers kun je verslepen (muis, touch en pen) */
  document.querySelectorAll('.stk').forEach(function (s) {
    var sx, sy, ox, oy, drag = false;
    s.setAttribute('tabindex', '0');
    s.addEventListener('pointerdown', function (e) { drag = true; sx = e.clientX; sy = e.clientY; ox = s.offsetLeft; oy = s.offsetTop; s.setPointerCapture(e.pointerId); s.classList.add('grab'); });
    s.addEventListener('pointermove', function (e) { if (!drag) return; s.style.left = (ox + e.clientX - sx) + 'px'; s.style.top = (oy + e.clientY - sy) + 'px'; s.style.right = 'auto'; s.style.bottom = 'auto'; });
    var up = function () { drag = false; s.classList.remove('grab'); };
    s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
  });
  if (reduce || !window.matchMedia('(hover:hover)').matches) return;
  /* kaarten kantelen naar de muis */
  document.querySelectorAll('.pcard,.pol').forEach(function (c) {
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg'); c.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
    });
    c.addEventListener('mouseleave', function () { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); });
  });
  /* banners scheeftrekken bij snel scrollen */
  var last = window.scrollY, skew = 0, bands = document.querySelectorAll('.band');
  function tick() {
    var y = window.scrollY, v = y - last; last = y;
    skew += (Math.max(-6, Math.min(6, v * 0.25)) - skew) * 0.15;
    bands.forEach(function (b, i) { b.style.setProperty('--sk', ((i % 2 ? -1 : 1) * skew).toFixed(2) + 'deg'); });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
