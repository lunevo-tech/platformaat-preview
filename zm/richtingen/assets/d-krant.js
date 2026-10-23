/* Krant: datum van vandaag, kop die woord voor woord verschijnt en een kleine balk met logo na het scrollen. */
(function () {
  var d = document.querySelector('.kr-date');
  if (d) { try { d.textContent = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {} }
  var m = document.querySelector('.kr-mast'), hd = document.querySelector('.hd');
  if (m && hd && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { hd.classList.toggle('stuck', !es[0].isIntersecting); }, { threshold: 0 }).observe(m);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var h = document.querySelector('.split');
  if (h && !reduce) {
    var out = [];
    h.childNodes.forEach(function (n) {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function (w) { out.push(/^\s*$/.test(w) ? w : '<span class="wd"><span>' + w + '</span></span>'); });
      else out.push('<span class="wd"><span>' + n.outerHTML + '</span></span>');
    });
    h.innerHTML = out.join('');
    h.querySelectorAll('.wd > span').forEach(function (s, i) { s.style.animationDelay = (0.15 + i * 0.07) + 's'; });
  }
})();
