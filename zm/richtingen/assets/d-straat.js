/* Straat: de reis loopt zijwaarts terwijl je naar beneden scrolt. Een bestelwagen rijdt mee op de weg. Op gsm staan de haltes onder elkaar. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sec = document.getElementById('straat');
  if (!sec || reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', function () {
    var track = sec.querySelector('.track'), van = sec.querySelector('.road .van-w'), dash = sec.querySelector('.road .dash'), mile = sec.querySelector('.mile-n');
    var panels = sec.querySelectorAll('.sp:not(.gate)');
    var dist = function () { return track.scrollWidth - window.innerWidth; };
    var tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: {
      trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: sec.querySelector('.pinwrap'), scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: function (s) {
        van.style.left = (4 + s.progress * 84) + '%';
        dash.style.backgroundPositionX = (-s.progress * dist() * 1.0) + 'px';
        var n = Math.min(panels.length, Math.max(1, Math.round(s.progress * (panels.length - 1)) + 1));
        mile.textContent = 'Km ' + (n < 10 ? '0' : '') + n;
      } } });
    panels.forEach(function (p) {
      var im = p.querySelector('img');
      gsap.fromTo(im, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    return function () { van.style.left = ''; };
  });
})();
