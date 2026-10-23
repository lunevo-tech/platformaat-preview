/* Twee kanten: de helften klappen uit bij aanwijzen of aantikken, en de schuifbalk toont straat naast scherm. */
(function () {
  var split = document.getElementById('kant');
  if (split) {
    var sides = split.querySelectorAll('.side');
    sides.forEach(function (s) {
      s.addEventListener('mouseenter', function () { if (window.matchMedia('(hover:hover)').matches) { sides.forEach(function (o) { o.classList.toggle('big', o === s); }); } });
      s.addEventListener('focusin', function () { sides.forEach(function (o) { o.classList.toggle('big', o === s); }); });
      s.addEventListener('click', function (e) { if (e.target.closest('a')) return; sides.forEach(function (o) { o.classList.toggle('big', o === s && !s.classList.contains('big')); }); });
    });
    split.addEventListener('mouseleave', function () { sides.forEach(function (o) { o.classList.remove('big'); }); });
  }
  var box = document.getElementById('cmp'), rng = box && box.querySelector('.rng');
  if (box && rng) {
    var set = function () { box.style.setProperty('--p', rng.value + '%'); };
    rng.addEventListener('input', set); set();
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
      var done = false;
      new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting || done) return; done = true;
        var t0 = performance.now();
        (function step(now) { var k = Math.min(1, (now - t0) / 1800); rng.value = 50 + 38 * Math.sin(k * Math.PI * 2) * (1 - k); set(); if (k < 1) requestAnimationFrame(step); else { rng.value = 50; set(); } })(t0);
      }, { threshold: 0.6 }).observe(box);
    }
  }
})();
