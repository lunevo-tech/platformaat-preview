/* Zacht verschijnen bij in beeld komen. Geen scrolljacking, geen bibliotheek. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__zm = true;
  if (reduce) { root.classList.remove('anim'); root.classList.add('reduce'); }
  var els = Array.prototype.slice.call(document.querySelectorAll('.rv,.rvi'));
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  /* video: alleen spelen als zichtbaar, niet bij minder beweging, met stopknop */
  Array.prototype.forEach.call(document.querySelectorAll('video[data-loop]'), function (v) {
    v.muted = true; v.loop = true; v.playsInline = true;
    var wrap = v.closest('[data-vwrap]') || v.parentNode; var btn = wrap.querySelector('.vid-toggle');
    var userPaused = reduce;
    function label() { if (btn) { btn.textContent = v.paused ? 'Speel af' : 'Pauzeer'; btn.setAttribute('aria-pressed', v.paused ? 'true' : 'false'); } }
    if (btn) btn.addEventListener('click', function () { if (v.paused) { userPaused = false; v.play().catch(function () {}); } else { userPaused = true; v.pause(); } label(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !userPaused) v.play().catch(function () {}); else if (!e.isIntersecting) v.pause(); label(); }); }, { threshold: 0.25 }).observe(v);
    label();
  });
})();
