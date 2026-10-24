/* W3c-fix: de lijnen in het schema bovenaan lopen altijd van het midden van een kaartje naar het midden van de kern (berekend uit de echte plek, bij laden en bij elke verandering van breedte). */
'use strict';
(function () {
  /* ---- de lijnen in het schema bovenaan: altijd van het midden van een kaartje naar het midden van de kern ---- */
  var bp = document.querySelector('.hero-stage .blueprint');
  if (bp) {
    var svg = bp.querySelector('svg.connections');
    var NS = 'http://www.w3.org/2000/svg';
    var teken = function () {
      var core = bp.querySelector('.core'), nodes = [].slice.call(bp.querySelectorAll('.node'));
      if (!svg || !core || nodes.length < 4) return;
      var W = bp.clientWidth, H = bp.clientHeight;
      var cx = W / 2, cy = H / 2, cw = core.offsetWidth, ch = core.offsetHeight;
      var kern = { l: cx - cw / 2, r: cx + cw / 2, t: cy - ch / 2, b: cy + ch / 2 };
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('preserveAspectRatio', 'none');
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var maak = function (naam, attrs) { var el = document.createElementNS(NS, naam); for (var k in attrs) el.setAttribute(k, attrs[k]); svg.appendChild(el); return el; };
      nodes.forEach(function (n) {
        var x1 = n.offsetLeft, x2 = n.offsetLeft + n.offsetWidth, y1 = n.offsetTop, y2 = n.offsetTop + n.offsetHeight;
        var ny = (y1 + y2) / 2, nx = (x1 + x2) / 2, links = nx < cx, boven = ny < cy;
        var sx = links ? x2 : x1, ex = links ? kern.l : kern.r, d, bx, by;
        if (links ? sx < ex - 12 : sx > ex + 12) {
          /* genoeg ruimte ernaast: vanaf het midden van de zijkant, een halve stap opzij, dan naar het midden van de kern */
          bx = (sx + ex) / 2; by = cy;
          d = 'M' + sx + ' ' + ny + ' H' + bx + ' V' + cy + ' H' + ex;
        } else {
          /* smal scherm: de kaartjes staan deels boven de kern; dan vanaf het midden van onder- of bovenkant, recht naar het midden van de zijkant van de kern */
          var sy = boven ? y2 : y1; bx = nx; by = cy;
          d = 'M' + nx + ' ' + sy + ' V' + cy + ' H' + ex;
        }
        maak('path', { d: d });
        maak('circle', { cx: bx, cy: by, r: 4 });
      });
    };
    teken();
    if (window.ResizeObserver) new ResizeObserver(teken).observe(bp);
    window.addEventListener('load', teken); window.addEventListener('resize', teken);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(teken);
  }
})();
