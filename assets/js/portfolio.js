const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('#primary-navigation');
const yearEl = document.querySelector('#current-year');

if (navToggle && nav) {
  nav.dataset.open = 'false';
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    nav.dataset.open = (!expanded).toString();
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      nav.dataset.open = 'false';
    });
  });
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
