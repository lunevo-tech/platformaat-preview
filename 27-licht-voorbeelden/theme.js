'use strict';
const themeButton = document.querySelector('.theme-switch');
function showTheme(isDark) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.setAttribute('aria-label', isDark ? 'Schakel naar de lichte versie' : 'Schakel naar de donkere versie');
  themeButton.querySelector('.theme-label').textContent = isDark ? 'Bekijk lichte versie' : 'Bekijk donkere versie';
  themeButton.querySelector('.theme-symbol').textContent = isDark ? '☀' : '☾';
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#0b101b' : '#f7f8fb';
}
themeButton.addEventListener('click', () => showTheme(document.documentElement.dataset.theme !== 'dark'));
showTheme(document.documentElement.dataset.theme === 'dark');
