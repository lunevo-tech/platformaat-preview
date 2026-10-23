/* Gedeelde bewegingsmotor voor de premium voorbeeldontwerpen.
   Vereist: gsap, ScrollTrigger (en optioneel Lenis). Alles bestuurd met data-attributen:
   data-split, data-load, data-reveal, data-mask, data-parallax, data-words, data-stack, data-hscroll,
   data-expand, data-marquee, data-magnetic, data-cursor, data-roll, data-bg, data-tilt, data-draw. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ZM = window.ZM = { started: false, queue: [] };
  window.__zm = true;

  /* ---------- video: alleen afspelen als zichtbaar, nooit bij minder beweging ---------- */
  function videos() {
    $('video[data-loop]').forEach(function (v) {
      v.muted = true; v.loop = true; v.playsInline = true;
      var wrap = v.closest('[data-vwrap]') || v.parentNode;
      var btn = wrap.querySelector('.vid-toggle');
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
        }, { threshold: 0.2 }).observe(v);
      } else if (!userPaused) v.play().catch(function () {});
      label();
    });
  }
  videos();

  /* ---------- rolletekst ---------- */
  $('[data-roll]').forEach(function (el) {
    var t = el.textContent;
    el.innerHTML = '<span class="roll"><span>' + t + '</span><span aria-hidden="true">' + t + '</span></span>';
  });

  if (reduce || !window.gsap || !window.ScrollTrigger) { root.classList.remove('anim'); return; }

  gsap.registerPlugin(ScrollTrigger);
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- zachte scroll ---------- */
  var lenis = null;
  if (window.Lenis && fine) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    ZM.lenis = lenis;
    $('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var t = document.querySelector(id); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: 0, duration: 1.6 });
      });
    });
  }

  /* ---------- tekst opsplitsen ---------- */
  function split(el, mode) {
    var out = [];
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi';
            if (mode === 'chars') {
              Array.prototype.forEach.call(p, function (ch) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; i.appendChild(s); });
              out.push(i);
            } else { i.textContent = p; out.push(i); }
            w.appendChild(i); frag.appendChild(w);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.matches('img,svg,video,br,[data-nosplit]')) walk(c);
        else if (c.nodeType === 1 && c.matches('[data-nosplit]')) out.push(c);
      });
    })(el);
    el.classList.add('is-split');
    return out;
  }

  var loadItems = [];
  function startLoad() {
    if (ZM.started) return; ZM.started = true;
    loadItems.forEach(function (fn) { fn(); });
    ZM.queue.forEach(function (fn) { fn(); });
  }
  ZM.start = startLoad;

  var mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 901px)', mob: '(max-width: 900px)' }, function (ctx) {
    var desk = ctx.conditions.desk;

    /* beeld en tekst bij het laden (hero) */
    $('[data-load]').forEach(function (el) {
      var delay = parseFloat(el.getAttribute('data-delay') || 0);
      if (el.hasAttribute('data-split')) {
        var parts = split(el, el.getAttribute('data-split') || 'words');
        gsap.set(parts, { yPercent: 115 });
        loadItems.push(function () { gsap.to(parts, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: el.getAttribute('data-split') === 'chars' ? 0.03 : 0.07, delay: delay }); });
      } else {
        gsap.set(el, { opacity: 0, y: 30 });
        loadItems.push(function () { gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: delay }); });
      }
    });

    /* koppen bij in beeld komen */
    $('[data-split]:not([data-load])').forEach(function (el) {
      var parts = split(el, el.getAttribute('data-split') || 'words');
      gsap.fromTo(parts, { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: el.getAttribute('data-split') === 'chars' ? 0.025 : 0.06,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    /* gewone onthulling */
    $('[data-reveal]').forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-delay') || 0);
      gsap.fromTo(el, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: d,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    /* beeldonthulling met afdekking */
    $('[data-mask]').forEach(function (el) {
      var cover = document.createElement('i'); cover.className = 'cover'; el.appendChild(cover);
      el.classList.add('is-ready');
      var dir = el.getAttribute('data-mask') || 'right';
      var origin = dir === 'left' ? '0% 50%' : dir === 'top' ? '50% 0%' : dir === 'bottom' ? '50% 100%' : '100% 50%';
      var prop = (dir === 'top' || dir === 'bottom') ? { scaleY: 0 } : { scaleX: 0 };
      var from = (dir === 'top' || dir === 'bottom') ? { scaleY: 1 } : { scaleX: 1 };
      var d = parseFloat(el.getAttribute('data-delay') || 0);
      var st = { trigger: el, start: 'top 88%', once: true };
      gsap.fromTo(cover, from, Object.assign({ transformOrigin: origin, duration: 1.3, ease: 'expo.inOut', delay: d, scrollTrigger: st }, prop));
      var im = el.querySelector('img,video');
      if (im) gsap.fromTo(im, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out', delay: d, scrollTrigger: st });
    });

    /* parallax */
    $('[data-parallax]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-parallax')) * (desk ? 1 : 0.5);
      var wrap = el.closest('[data-pwrap]') || el.parentElement;
      gsap.fromTo(el, { yPercent: -s }, { yPercent: s, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $('[data-drift]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-drift')) * (desk ? 1 : 0.4);
      gsap.to(el, { y: s, ease: 'none', scrollTrigger: { trigger: el.closest('[data-pwrap]') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $('[data-spin]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-spin'));
      gsap.fromTo(el, { rotate: -s }, { rotate: s, ease: 'none', scrollTrigger: { trigger: el.closest('[data-pwrap]') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* woorden die oplichten bij scrollen */
    $('[data-words]').forEach(function (el) {
      var parts = split(el, 'words');
      var tr = el.closest('[data-wtrig]');
      var st = tr ? { trigger: tr, start: 'top 20%', end: 'bottom bottom', scrub: 0.6 }
        : { trigger: el, start: desk ? 'top 70%' : 'top 85%', end: desk ? 'bottom 55%' : 'bottom 70%', scrub: 0.6 };
      gsap.fromTo(parts, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: st });
    });

    /* kaarten die over elkaar schuiven */
    $('[data-stack]').forEach(function (stack) {
      var cards = $('.card', stack);
      cards.forEach(function (card, i) {
        var next = cards[i + 1]; if (!next) return;
        var inner = card.querySelector('.card-in') || card;
        var shade = card.querySelector('.card-shade');
        var topPx = parseFloat(getComputedStyle(card).top) || 0;
        gsap.to(inner, { scale: 0.93 - (cards.length - i) * 0.004, ease: 'none', transformOrigin: '50% 0%',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top ' + (topPx + 30) + 'px', scrub: true } });
        if (shade) gsap.fromTo(shade, { opacity: 0 }, { opacity: 0.55, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top ' + (topPx + 30) + 'px', scrub: true } });
      });
    });

    /* horizontale scroll (alleen desktop) */
    if (desk) {
      $('[data-hscroll]').forEach(function (sec) {
        var track = sec.querySelector('[data-track]'); if (!track) return;
        sec.classList.add('is-pinned');
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + (parseFloat(sec.getAttribute('data-pad')) || 0)); };
        var tw = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: function (self) { sec.style.setProperty('--p', self.progress.toFixed(4)); } } });
        $('[data-hp]', sec).forEach(function (im) {
          gsap.fromTo(im, { xPercent: -9 }, { xPercent: 9, ease: 'none', scrollTrigger: { trigger: im.parentElement, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
        });
        $('[data-hdrift]', sec).forEach(function (el) {
          var s = parseFloat(el.getAttribute('data-hdrift'));
          gsap.fromTo(el, { x: -s }, { x: s, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
        });
        ZM.hs = tw;
      });
    }

    /* beeld dat uitzet tot volledig scherm */
    $('[data-expand]').forEach(function (sec) {
      var frame = sec.querySelector('[data-frame]'); if (!frame) return;
      var im = frame.querySelector('img,video');
      var from = desk ? 'inset(16% 26% 16% 26% round 26px)' : 'inset(14% 8% 14% 8% round 18px)';
      var tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: desk ? '+=130%' : '+=90%', pin: true, scrub: 0.6, anticipatePin: 1 } });
      tl.fromTo(frame, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 }, 0);
      if (im) tl.fromTo(im, { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1 }, 0);
      $('[data-ex-in]', sec).forEach(function (el) { tl.fromTo(el, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', duration: 0.5 }, 0.5); });
      $('[data-ex-slide]', sec).forEach(function (el) {
        var s = parseFloat(el.getAttribute('data-ex-slide'));
        tl.fromTo(el, { xPercent: -s }, { xPercent: s, ease: 'none', duration: 1.2 }, 0);
      });
    });

    /* lopende tekst die op scrollsnelheid reageert */
    $('[data-marquee]').forEach(function (m) {
      var track = m.firstElementChild; if (!track) return;
      track.innerHTML = track.innerHTML + track.innerHTML;
      var base = m.getAttribute('data-marquee') === 'reverse' ? -1 : 1;
      var dur = parseFloat(m.getAttribute('data-duration') || 40);
      var tw = gsap.fromTo(track, { xPercent: base > 0 ? 0 : -50 }, { xPercent: base > 0 ? -50 : 0, duration: dur, ease: 'none', repeat: -1 });
      var skew = m.hasAttribute('data-skew');
      ScrollTrigger.create({ onUpdate: function (self) {
        var v = self.getVelocity();
        gsap.to(tw, { timeScale: base * (v >= 0 ? 1 : -1) * Math.min(7, 1 + Math.abs(v) / 260), duration: 0.25, overwrite: true, onComplete: function () { gsap.to(tw, { timeScale: base, duration: 1.2 }); } });
        if (skew) gsap.to(m, { skewX: Math.max(-9, Math.min(9, -v / 160)), duration: 0.3, overwrite: 'auto', onComplete: function () { gsap.to(m, { skewX: 0, duration: 0.8 }); } });
      } });
    });

    /* achtergrondkleur per sectie */
    $('[data-bg]').forEach(function (sec) {
      function set() { gsap.to(document.body, { backgroundColor: sec.getAttribute('data-bg'), color: sec.getAttribute('data-fg') || '', duration: 0.7, ease: 'power2.out', overwrite: 'auto' }); }
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onEnter: set, onEnterBack: set });
    });

    /* lijn die zichzelf tekent */
    $('[data-draw]').forEach(function (el) {
      gsap.fromTo(el, { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 0', ease: 'none',
        scrollTrigger: { trigger: el.closest('[data-draw-wrap]') || el, start: 'top 70%', end: 'bottom 60%', scrub: true } });
    });

    /* scrollmeter */
    var bar = document.getElementById('progress');
    if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
  });

  /* ---------- muisgevoelige onderdelen (alleen met muis) ---------- */
  if (fine) {
    root.classList.add('has-cursor');
    var c = document.createElement('div'); c.className = 'zm-cursor is-hidden';
    c.innerHTML = '<i class="dot"></i><span class="ring"><b></b></span>';
    document.body.appendChild(c);
    var dot = c.querySelector('.dot'), ring = c.querySelector('.ring'), lab = c.querySelector('b');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('mousemove', function (e) { c.classList.remove('is-hidden'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('mouseleave', function () { c.classList.add('is-hidden'); });
    document.addEventListener('mouseover', function (e) {
      var l = e.target.closest && e.target.closest('[data-cursor]');
      var k = e.target.closest && e.target.closest('a,button,input,textarea,summary,[data-magnetic]');
      c.classList.toggle('is-label', !!l); c.classList.toggle('is-link', !l && !!k);
      if (l) lab.textContent = l.getAttribute('data-cursor');
    });
    $('[data-magnetic]').forEach(function (el) {
      var inner = el.querySelector('[data-mag-in]');
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2), my = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: mx * 0.35, y: my * 0.35, duration: 0.5, ease: 'power3.out' });
        if (inner) gsap.to(inner, { x: mx * 0.15, y: my * 0.15, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)' });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)' });
      });
    });
    $('[data-tilt]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-tilt')) || 8;
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotationY: px * amt * 2, rotationX: -py * amt * 2, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () { gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'elastic.out(1,.5)' }); });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (!document.querySelector('[data-intro]')) { requestAnimationFrame(function () { setTimeout(startLoad, 120); }); }
})();
