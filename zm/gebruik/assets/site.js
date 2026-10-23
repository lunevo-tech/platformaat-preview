/* Gedeeld script voor de vijf sites: menu, zacht verschijnen, filmknop en contactformulier. Geen externe bibliotheken. */
(function () {
  var q = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  /* menu op gsm */
  var b = document.querySelector('.burger'), n = document.getElementById('nav');
  if (b && n) {
    b.addEventListener('click', function () { var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && n.classList.contains('open')) { n.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); b.focus(); } });
    q('a', n).forEach(function (a) { a.addEventListener('click', function () { n.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }); });
  }
  /* zacht verschijnen */
  var els = q('.rv,.rvi');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  /* film: alleen spelen als zichtbaar en niet bij "minder beweging" */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  q('video').forEach(function (v) {
    var tg = document.querySelector('.vtoggle'), paused = reduce;
    function lab() { if (tg) { tg.textContent = v.paused ? 'Speel film af' : 'Pauzeer film'; tg.setAttribute('aria-pressed', v.paused ? 'true' : 'false'); } }
    if (tg) tg.addEventListener('click', function () { if (v.paused) { paused = false; v.play().catch(function () {}); } else { paused = true; v.pause(); } lab(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !paused) v.play().catch(function () {}); else if (!e.isIntersecting) v.pause(); lab(); }); }, { threshold: 0.2 }).observe(v);
    lab();
  });
  /* contactformulier: stelt een e-mail samen in het mailprogramma van de bezoeker */
  var f = document.getElementById('cform');
  if (f) {
    var p = new URLSearchParams(location.search).get('onderwerp'), s = document.getElementById('onderwerp');
    if (p && s) { for (var i = 0; i < s.options.length; i++) if (s.options[i].value === p) s.selectedIndex = i; }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nota = document.getElementById('fnota');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var d = new FormData(f), mail = f.getAttribute('data-mail');
      if (!mail) { nota.textContent = 'Het e-mailadres van het bureau is nog niet ingevuld. Neem rechtstreeks contact op zodra het beschikbaar is.'; return; }
      var onderwerp = s && s.selectedIndex > 0 ? s.options[s.selectedIndex].text : 'Aanvraag via de website';
      var body = 'Naam: ' + d.get('naam') + '\nBedrijf: ' + (d.get('bedrijf') || '') + '\nE-mail: ' + d.get('email') + '\nTelefoon: ' + (d.get('telefoon') || '') + '\n\n' + d.get('bericht');
      location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent('Zichtbaar Media: ' + onderwerp) + '&body=' + encodeURIComponent(body);
      nota.textContent = 'Je e-mailprogramma is geopend. Verstuur het bericht om je aanvraag door te geven.';
    });
  }
})();
