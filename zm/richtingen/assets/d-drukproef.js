/* Drukproef: de goedkeuringsstempel valt neer als de laatste pagina in beeld komt. */
(function () {
  var s = document.getElementById('stamp');
  if (!s) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { s.classList.add('on'); return; }
  new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { setTimeout(function () { s.classList.add('on'); }, 500); io.disconnect(); } }, { threshold: 0.6 }).observe(s.parentNode);
})();
