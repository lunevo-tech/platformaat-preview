/* Gedeelde beweging voor de voorbeeldontwerpen.
   Principe: zonder script of bij "minder beweging" is alles meteen zichtbaar. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  if (reduce) root.classList.add('reduce');

  /* Kop opsplitsen in woorden voor een gestaffelde onthulling */
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = part;
            inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-split]'), function (el) {
    if (!reduce) splitWords(el);
  });

  /* Onthullen bij in beeld komen */
  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal],[data-split]'));
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (t) { t.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* Parallax en voortgangsbalk */
  var para = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  var bar = document.getElementById('progress');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    if (!reduce) {
      para.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var off = ((r.top + r.height / 2) - vh / 2) * parseFloat(el.getAttribute('data-speed'));
        var m = r.height * 0.08; off = Math.max(-m, Math.min(m, off));
        el.style.setProperty('--py', off.toFixed(1) + 'px');
      });
    }
    if (bar) {
      var h = document.documentElement.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(4) + ')';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* Video: alleen spelen als zichtbaar, nooit bij "minder beweging", altijd met stopknop */
  Array.prototype.forEach.call(document.querySelectorAll('video[data-loop]'), function (v) {
    v.muted = true; v.loop = true; v.playsInline = true;
    var btn = v.parentNode.querySelector('.vid-toggle');
    var userPaused = reduce;
    function label() { if (btn) { btn.textContent = v.paused ? 'Speel af' : 'Pauzeer'; btn.setAttribute('aria-pressed', v.paused ? 'true' : 'false'); } }
    if (btn) btn.addEventListener('click', function () {
      if (v.paused) { userPaused = false; v.play().catch(function () {}); } else { userPaused = true; v.pause(); }
      label();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !userPaused) v.play().catch(function () {});
          else if (!e.isIntersecting) v.pause();
          label();
        });
      }, { threshold: 0.25 }).observe(v);
    } else if (!userPaused) v.play().catch(function () {});
    label();
  });
})();
