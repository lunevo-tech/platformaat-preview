/* W3b: onthoudt de gekozen versie (licht of donker) tijdens het bladeren door deze preview, zodat de pagina's niet terugspringen.
   Alleen sessionStorage van dit tabblad; geen cookie, niets wordt verstuurd. Moet vóór theme.js laden. */
(function () {
  var d = document.documentElement;
  try { var t = sessionStorage.getItem('pm-thema'); if (t === 'dark' || t === 'light') d.setAttribute('data-theme', t); } catch (e) { /* mag ontbreken */ }
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest || !ev.target.closest('.theme-switch')) return;
    setTimeout(function () { try { sessionStorage.setItem('pm-thema', d.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'); } catch (e) { /* mag ontbreken */ } }, 0);
  });
})();
