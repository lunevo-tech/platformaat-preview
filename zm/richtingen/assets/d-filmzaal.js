/* Filmzaal: beeld schuift mee in de hoofdstukken en de film wordt gepauzeerd als hij uit beeld is. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('.scene').forEach(function (sc) {
    var img = sc.querySelector('.bg img'), tx = sc.querySelector('.sc-in');
    gsap.fromTo(img, { scale: 1.18, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: sc, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from(tx.children, { y: 40, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: sc, start: 'top 55%', toggleActions: 'play none none reverse' } });
  });
  /* aftiteling: regels schuiven langzaam op bij het scrollen */
  var roll = document.querySelector('.roll');
  if (roll) gsap.fromTo(roll, { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: roll, start: 'top bottom', end: 'bottom top', scrub: true } });
})();
