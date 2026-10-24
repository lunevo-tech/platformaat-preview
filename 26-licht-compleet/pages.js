/* W3b: menuknop voor de pagina's naast de startpagina (zelfde gedrag als in app.js) en hoogte van het voorbeeldvenster. */
'use strict';
(function () {
  var button = document.querySelector('.menu-toggle');
  var nav = document.querySelector('#navigation');
  if (button && nav) {
    var close = function () { button.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { close(); button.focus(); } });
    window.matchMedia('(min-width: 851px)').addEventListener('change', close);
  }
  var frame = document.querySelector('.pf-frame');
  if (frame) {
    window.addEventListener('message', function (e) {
      if (e.source !== frame.contentWindow || !e.data || typeof e.data.pmHoogte !== 'number') return;
      frame.style.height = Math.ceil(e.data.pmHoogte) + 'px';
    });
  }
})();
