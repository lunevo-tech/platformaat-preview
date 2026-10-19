/* 07 Lagen: formulierstatus, schakelaar voor effecten en alle beweging. Gewone JavaScript, geen bibliotheek, geen externe verzoeken, geen cookies.
   De beweging draait alleen als <html> de class «fx» heeft (zie de kop van elke pagina); anders staat alles op zijn eindplek. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };

  var form = document.getElementById('formulier');
  if (form) form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var s = form.querySelector('.form-status');
    if (s) s.textContent = s.getAttribute('data-msg');
  });

  // Schakelaar in de voorbeeldbalk: effecten toch tonen (of uitzetten), ook als Windows op «minder beweging» staat.
  var pbar = document.querySelector('.previewbar');
  if (pbar) {
    var isOn = root.classList.contains('fx'), mode = root.getAttribute('data-motion'), os = root.getAttribute('data-os');
    var sw = document.createElement('button');
    sw.type = 'button'; sw.className = 'fxsw';
    sw.textContent = isOn ? 'Effecten: aan (klik om uit te zetten)'
      : (os === 'minder' && mode === 'auto' ? 'Effecten staan uit door je Windows-instelling. Klik om ze toch te tonen' : 'Effecten: uit (klik om aan te zetten)');
    sw.addEventListener('click', function () {
      var u = new URL(location.href); u.searchParams.set('motion', isOn ? 'uit' : 'aan'); location.href = u.href;
    });
    pbar.appendChild(document.createTextNode(' · ')); pbar.appendChild(sw);
  }

  if (!root.classList.contains('fx')) return;
  window.__fx = 1;

  // 1. Hoofdkoppen: woord voor woord omhoog (ook de cursieve woorden).
  $('.hero h1, .page-h h1').forEach(function (h) {
    var idx = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'), i = document.createElement('span');
            o.className = 'w'; i.className = 'wi'; i.style.setProperty('--w', idx++); i.textContent = t;
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h);
    h.classList.add('split');
  });

  // 2. Onthullen bij scrollen. Wie tegelijk in beeld komt, volgt elkaar op.
  var els = $('[data-r], .page-h > :not(h1), .hero-t > :not(h1)');
  var reveal = function (list) {
    list.sort(function (a, b) { var x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return (x.top - y.top) || (x.left - y.left); })
      .forEach(function (el, k) {
        el.style.setProperty('--i', k + (el.closest('.hero, .page-h') ? 6 : 0));
        el.classList.add('in');
        setTimeout(function () { el.classList.add('done'); }, 2400);
      });
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      vis.forEach(function (e) { io.unobserve(e.target); });
      reveal(vis.map(function (e) { return e.target; }));
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { reveal(els); }

  // 3. Aanbod-bladen: tekeningen starten als een blad in beeld komt.
  var sheets = $('.sheet');
  sheets.forEach(function (s) { $('.fig > *', s).forEach(function (n, j) { n.style.setProperty('--j', j); }); });
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io2.unobserve(e.target); } });
    }, { threshold: 0.3 });
    sheets.forEach(function (s) { io2.observe(s); });
  } else { sheets.forEach(function (s) { s.classList.add('on'); }); }

  // 4. Per beeld: stapel die over elkaar schuift (--cov), de offerte-demo (--s1…--s5), de bladen in de hero.
  var heroDeck = document.querySelector('.deck');
  var hero = document.querySelector('.hero');
  var demos = $('.demo').map(function (d) {
    return { el: d, steps: $('.steps li', d), rows: $('.q-sup .q-rows li', d), last: -1 };
  });
  var frame = function () {
    // bladen over elkaar
    for (var i = 0; i < sheets.length - 1; i++) {
      var cur = sheets[i], nxt = sheets[i + 1];
      var top = parseFloat(getComputedStyle(cur).top) || 0, h = cur.offsetHeight;
      var covered = (top + h - nxt.getBoundingClientRect().top) / Math.max(1, h - 36);
      cur.style.setProperty('--cov', clamp(covered, 0, 1).toFixed(3));
    }
    // demo
    demos.forEach(function (D) {
      var r = D.el.getBoundingClientRect(), total = r.height - window.innerHeight;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      var s = [seg(p, 0, .15), seg(p, .13, .45), seg(p, .4, .7), seg(p, .68, .88), seg(p, .86, 1)];
      s.forEach(function (v, k) { D.el.style.setProperty('--s' + (k + 1), v.toFixed(3)); });
      D.el.style.setProperty('--scan', s[1] > 0 && s[1] < 1 ? 1 : 0);
      var step = p < .4 ? 0 : p < .68 ? 1 : p < .88 ? 2 : 3;
      if (step !== D.last) {
        D.last = step;
        D.steps.forEach(function (li, k) { li.classList.toggle('active', k === step); if (k === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      }
      var n = Math.floor(s[1] * D.rows.length + 0.0001);
      D.rows.forEach(function (li, k) { li.classList.toggle('read', k < n); });
    });
    // hero: bladen drijven weg bij scrollen
    if (heroDeck && hero) {
      var y = window.scrollY;
      if (y < hero.offsetHeight * 1.3) heroDeck.style.setProperty('--sy', Math.round(y));
    }
  };
  var queued = false;
  var ask = function () { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; frame(); }); } };
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  frame();

  // 5. Muis: de bladen in de hero verschuiven licht, elk op eigen diepte (alleen met een echte muis).
  if (heroDeck && hero && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var pending = null;
    hero.addEventListener('pointermove', function (ev) {
      var r = hero.getBoundingClientRect();
      pending = { x: (ev.clientX - r.left) / r.width * 2 - 1, y: (ev.clientY - r.top) / r.height * 2 - 1 };
      if (!queued2) { queued2 = true; requestAnimationFrame(function () {
        queued2 = false;
        if (pending) { heroDeck.style.setProperty('--mx', pending.x.toFixed(3)); heroDeck.style.setProperty('--my', pending.y.toFixed(3)); }
      }); }
    });
    var queued2 = false;
  }
})();
