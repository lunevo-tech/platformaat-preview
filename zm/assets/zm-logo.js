/* Zichtbaar Media-logo: gestapeld woordmerk met vier zoekerhoeken, in de kleur van de omgeving (currentColor).
   Gebruik: <span class="zmlogo" data-logo role="img" aria-label="Zichtbaar Media"></span> en geef de breedte via CSS. */
(function () {
  var svg = '<svg viewBox="0 0 780 400" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
    '<g fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="square">' +
    '<path d="M20 20H62M20 20V62"/><path d="M760 20H718M760 20V62"/><path d="M20 380H62M20 380V338"/><path d="M760 380H718M760 380V338"/></g>' +
    '<text x="86" y="214" fill="currentColor" font-family="\'Hanken Grotesk\',\'Helvetica Neue\',Helvetica,Arial,sans-serif" font-weight="800" font-size="136" letter-spacing="-6">zichtbaar</text>' +
    '<text x="86" y="326" fill="currentColor" fill-opacity=".82" font-family="\'Hanken Grotesk\',\'Helvetica Neue\',Helvetica,Arial,sans-serif" font-style="italic" font-weight="300" font-size="120" letter-spacing="-4">media</text>' +
    '</svg>';
  Array.prototype.forEach.call(document.querySelectorAll('[data-logo]'), function (el) {
    el.innerHTML = svg;
    if (!el.hasAttribute('role')) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Zichtbaar Media'); }
  });
})();
