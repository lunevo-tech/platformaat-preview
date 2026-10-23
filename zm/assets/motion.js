/* Beweging voor de A- en B-versies. Geen bibliotheken. Wordt na calm.js geladen.
   Doet niets bij "minder beweging". */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var B = root.classList.contains('mo-b');
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var q = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var main = document.querySelector('main') || document.body;
  var home = /(^|\/)(index\.html)?$/.test(location.pathname) || /\/index\.html$/.test(location.pathname);
  var isHome = /\/f\d+-[a-z0-9-]+-[ab]\/(index\.html)?$/.test(location.pathname) || /\/index\.html$/.test(location.pathname);
  var h1 = document.querySelector('main h1');
  var hfont = h1 ? getComputedStyle(h1) : null;
  function hstyle(el) { if (hfont) { el.style.fontFamily = hfont.fontFamily; el.style.textTransform = hfont.textTransform; el.style.fontStyle = hfont.fontStyle; el.style.fontWeight = hfont.fontWeight; el.style.letterSpacing = hfont.letterSpacing; } }

  /* 1. kop splitsen en laten inschuiven */
  function split(el) {
    var i = 0;
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'mo-w';
            var s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.matches('img,svg,video,br')) walk(c);
      });
    })(el);
  }
  q('main h1').slice(0, 1).forEach(function (h) {
    /* niet splitsen als de kop al zijn eigen animatie heeft */
    if (h.classList.contains('rv') || true) { h.classList.remove('rv'); h.style.opacity = 1; h.style.transform = 'none'; split(h); }
  });

  /* 2. paginagordijn: bij het laden (CSS) en bij het verlaten */
  var cur = document.querySelector('.mo-curtain');
  if (cur) {
    q('a[href]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var h = a.getAttribute('href');
        if (!h || h.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(h) || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        if (!/\.html(#.*)?$|\/$/.test(h) && h.indexOf('.') > -1) return;
        e.preventDefault();
        cur.classList.add('go');
        setTimeout(function () { location.href = a.href; }, B ? 560 : 400);
      });
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { cur.classList.remove('go'); cur.style.display = 'none'; } });
  }

  /* 3. lopende regel */
  var WORDS = ['Online', 'Offline', 'Op straat', 'Op scherm', 'Gevel', 'Feed', 'Drukwerk', 'Zoekmachine', 'Affiches', 'Sociale media', 'Radio', 'Beurzen'];
  function marquee(rev) {
    var m = document.createElement('div'); m.className = 'mo-marq' + (rev ? ' rev b2' : ''); m.setAttribute('aria-hidden', 'true');
    hstyle(m);
    var set = (rev ? WORDS.slice().reverse() : WORDS).map(function (w) { return '<span>' + w + '</span>'; }).join('');
    m.innerHTML = '<div class="tr">' + set + set + '</div>';
    return m;
  }
  var first = main.querySelector('section');
  var anchor = first || main.firstElementChild;
  var after = anchor;
  function put(el) { after.parentNode.insertBefore(el, after.nextSibling); after = el; }
  var m1 = marquee(false); put(m1);
  if (B) put(marquee(true));

  /* 4. filmband met roterend woord en fotostrook (alleen startpagina) */
  if (isHome) {
    var vids = ['neonreclame', 'team-vergadering', 'webontwikkelaar', 'microfoon', 'microfoon-zaal'];
    var nr = parseInt((document.title.match(/ontwerp (\d+)/) || [0, 14])[1], 10);
    var v = vids[nr % vids.length];
    var band = document.createElement('section'); band.className = 'mo-band'; band.setAttribute('aria-label', 'Bewegend beeld');
    hstyle(band);
    band.innerHTML = '<video muted loop playsinline preload="metadata" poster="../assets/media/video/' + v + '.jpg" aria-hidden="true"><source src="../assets/media/video/' + v + '.mp4" type="video/mp4"></video>' +
      '<div class="tx"><span class="l1" style="font-family:\'Hanken Grotesk\',sans-serif;font-style:normal;text-transform:uppercase">Wij maken zaken zichtbaar op</span><span class="rot" aria-live="off"></span></div>' +
      '<button class="pb" type="button" aria-pressed="false">Pauzeer</button><i class="bar"></i>';
    put(band);
    var phr = ['de straat', 'het scherm', 'papier', 'de weg', 'de radio', 'je gsm', 'de gevel', 'de beurs'];
    var rot = band.querySelector('.rot'); rot.style.fontFamily = hfont ? hfont.fontFamily : ''; rot.style.textTransform = hfont ? hfont.textTransform : ''; rot.style.fontStyle = hfont ? hfont.fontStyle : '';
    rot.innerHTML = phr.map(function (p) { return '<b>' + p + '</b>'; }).join('');
    var bs = q('b', rot), k = 0, bar = band.querySelector('.bar');
    bs[0].className = 'on';
    var dur = B ? 2200 : 3400;
    function tick() { bs[k].className = 'off'; var o = k; setTimeout(function () { bs[o].className = ''; }, 700); k = (k + 1) % bs.length; bs[k].className = 'on'; bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)'; requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.transition = 'transform ' + dur + 'ms linear'; bar.style.transform = 'scaleX(1)'; }); }); }
    function startBar() { bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)'; requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.transition = 'transform ' + dur + 'ms linear'; bar.style.transform = 'scaleX(1)'; }); }); }
    startBar(); setInterval(tick, dur);
    var vid = band.querySelector('video'), pb = band.querySelector('.pb'), userPaused = false;
    pb.addEventListener('click', function () { if (vid.paused) { userPaused = false; vid.play().catch(function () {}); } else { userPaused = true; vid.pause(); } pb.textContent = vid.paused ? 'Speel af' : 'Pauzeer'; pb.setAttribute('aria-pressed', vid.paused ? 'true' : 'false'); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !userPaused) vid.play().catch(function () {}); else if (!e.isIntersecting) vid.pause(); pb.textContent = vid.paused ? 'Speel af' : 'Pauzeer'; }); }, { threshold: 0.25 }).observe(band);

    var imgs = ['gevel-winkel', 'drukpers', 'bestelwagen-b', 'wireframe', 'radiostudio', 'affiche-plakken', 'beurshal', 'raamfolie', 'bakkerij-rek', 'cijfers-bureau'];
    var strip = document.createElement('div'); strip.className = 'mo-strip'; strip.setAttribute('aria-hidden', 'true');
    var set = imgs.map(function (n) { return '<figure><img loading="lazy" alt="" src="../assets/media/foto/' + n + '.jpg"></figure>'; }).join('');
    strip.innerHTML = '<div class="tr">' + set + set + '</div>';
    put(strip);
  }

  /* 5. B: zwevende vormen, cursor, magnetische knoppen, kantelende kaarten */
  if (B) {
    if (anchor && !anchor.matches('.mo-band,.mo-marq')) {
      var cs = getComputedStyle(anchor); if (cs.position === 'static') anchor.style.position = 'relative';
      ['o1', 'o2', 'o3'].forEach(function (c) { var o = document.createElement('i'); o.className = 'mo-orb ' + c; o.setAttribute('aria-hidden', 'true'); anchor.insertBefore(o, anchor.firstChild); });
    }
    if (fine) {
      root.classList.add('mo-cursor');
      var c = document.createElement('div'); c.className = 'mo-cur'; c.innerHTML = '<i class="d"></i><i class="r"></i>'; document.body.appendChild(c);
      var d = c.querySelector('.d'), r = c.querySelector('.r'), mx = 0, my = 0, rx = 0, ry = 0;
      window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; d.style.left = mx + 'px'; d.style.top = my + 'px'; });
      (function loop() { rx += (mx - rx) * .16; ry += (my - ry) * .16; r.style.left = rx + 'px'; r.style.top = ry + 'px'; requestAnimationFrame(loop); })();
      document.addEventListener('mouseover', function (e) { c.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,summary,input,textarea'))); });
      q('.btn,.pill').forEach(function (b) {
        b.addEventListener('mousemove', function (e) { var bb = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - bb.left - bb.width / 2) * .3) + 'px,' + ((e.clientY - bb.top - bb.height / 2) * .35) + 'px)'; });
        b.addEventListener('mouseleave', function () { b.style.transform = ''; });
      });
      q('.s-card,.cs figure,.kaart,.dien .c,.gr .t,.case,.dubbel .ph').forEach(function (el) {
        el.addEventListener('mousemove', function (e) { var bb = el.getBoundingClientRect(); var px = (e.clientX - bb.left) / bb.width - .5, py = (e.clientY - bb.top) / bb.height - .5; el.style.transition = 'transform .12s'; el.style.transform = 'perspective(900px) rotateY(' + (px * 7) + 'deg) rotateX(' + (-py * 7) + 'deg)'; });
        el.addEventListener('mouseleave', function () { el.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)'; el.style.transform = ''; });
      });
    }
  }
})();
