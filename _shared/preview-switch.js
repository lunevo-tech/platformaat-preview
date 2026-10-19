/* Schakelaar «Effecten aan/uit» in de voorbeeldbalk. Werkt samen met het kopscript (FX_HEAD) dat <html> de class «fx» of «no-fx» geeft.
   ?motion=aan toont de effecten ook als Windows op «minder beweging» staat; ?motion=uit zet ze uit; ?motion=auto volgt Windows. */
(function () {
  'use strict';
  var root = document.documentElement, bar = document.querySelector('.previewbar');
  if (!bar) return;
  var isOn = root.classList.contains('fx'), mode = root.getAttribute('data-motion'), os = root.getAttribute('data-os');
  var sw = document.createElement('button');
  sw.type = 'button'; sw.className = 'fxsw';
  sw.textContent = isOn ? 'Effecten: aan (klik om uit te zetten)'
    : (os === 'minder' && mode === 'auto' ? 'Effecten staan uit door je Windows-instelling. Klik om ze toch te tonen' : 'Effecten: uit (klik om aan te zetten)');
  sw.addEventListener('click', function () {
    var u = new URL(location.href); u.searchParams.set('motion', isOn ? 'uit' : 'aan'); location.href = u.href;
  });
  bar.appendChild(document.createTextNode(' · ')); bar.appendChild(sw);
})();
