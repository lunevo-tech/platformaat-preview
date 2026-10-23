/* Laptop: bij het laden gaat de laptop vanzelf open, de camera zoomt in op het scherm en de echte site neemt over. Geen scrollen nodig.
   Wie scrolt, tikt of een toets indrukt, slaat de animatie over. Bij "minder beweging" of zonder script staat meteen de site er. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = document.getElementById('stage');
  if (!stage) return;
  if (reduce || !window.gsap) { root.classList.add('lap-static'); return; }
  root.classList.add('lap-run', 'lap-lock');
  var cam = stage.querySelector('.cam'), lap = stage.querySelector('.lap'), lid = stage.querySelector('.lid'),
      copy = stage.querySelector('.stage-copy'), real = stage.querySelector('.hero-real'), floor = stage.querySelector('.floor');
  var portrait = window.innerWidth < 761;
  var vw = window.innerWidth, vh = window.innerHeight;
  var k = Math.min(vw * (portrait ? 0.8 : 0.62) / 1000, vh * 0.52 / 640);        /* laptop past op het podium */
  var cover = portrait ? vw / 960 * 1.04 : Math.max(vw / 960, vh / 600);            /* scherm vult het beeld */
  var hingeY0 = vh * 0.62;
  var endY = vh / 2 + 320 * cover - hingeY0;                                        /* scherm komt in het midden */
  gsap.set(cam, { scale: k, y: 0, transformOrigin: '0 0' });
  gsap.set(lid, { rotationX: -90 });
  gsap.set(lap, { rotationX: -24 });
  gsap.set(real, { opacity: 0 });
  gsap.set(copy, { opacity: 0, y: 14 });
  var finished = false, tl;
  var evs = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  function finish() {
    if (finished) return; finished = true;
    root.classList.remove('lap-lock'); root.classList.add('hd-on');
    evs.forEach(function (t) { window.removeEventListener(t, skip, true); });
  }
  function skip() { if (tl && tl.progress() < 1) { tl.progress(1); } finish(); }
  tl = gsap.timeline({ defaults: { ease: 'none' }, delay: 0.2, onComplete: finish });
  tl.to(copy, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0)                          /* "Kom binnen." */
    .to(copy, { opacity: 0, y: -30, duration: 0.6, ease: 'power2.in' }, 1.7)
    .to(lid, { rotationX: 6, duration: 1.9, ease: 'power2.inOut' }, 1.2)                          /* klapt open */
    .to(lap, { rotationX: -15, duration: 1.9, ease: 'power2.inOut' }, 1.2)
    .to(lid, { rotationX: 0, duration: 1.4, ease: 'power1.inOut' }, 3.3)                          /* richt zich op */
    .to(lap, { rotationX: 0, duration: 1.4, ease: 'power1.inOut' }, 3.3)
    .to(cam, { scale: cover, y: endY, duration: 2.3, ease: 'power2.inOut' }, 3.3)                 /* zoom in op het scherm */
    .to(floor, { opacity: 0, duration: 0.8 }, 3.5)
    .to(real, { opacity: 1, duration: portrait ? 0.5 : 0.25 }, portrait ? 5.1 : 5.55);            /* de echte site neemt over */
  evs.forEach(function (t) { window.addEventListener(t, skip, { capture: true, passive: true }); });
})();
