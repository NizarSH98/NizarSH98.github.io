/*!
=========================================================
* Portfolio enhancements for Nizar Shehayeb
=========================================================
*/

(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    initNavToggle();
    initSmoothScroll();
    initMetricCounters();
    initCurrentYear();
    initGalleries();
  });

  function initNavToggle() {
    const nav = document.querySelector('.primary-nav');
    const toggle = document.querySelector('[data-nav-toggle]');
    if (!nav || !toggle) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('primary-nav--open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('primary-nav--open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initSmoothScroll() {
    if ('scrollBehavior' in document.documentElement.style === false) {
      return;
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        if (typeof target.tabIndex !== 'number' || target.tabIndex < 0) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
      });
    });
  }

  function initMetricCounters() {
    const counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length || prefersReducedMotion) return;

    const animateCounter = (el) => {
      const target = Number(el.dataset.countTo);
      if (!Number.isFinite(target)) return;
      const duration = 1200;
      let start = null;

      const step = (timestamp) => {
        if (!start) {
          start = timestamp;
        }
        const progress = Math.min((timestamp - start) / duration, 1);
        const value = Math.floor(progress * target);
        el.textContent = value.toLocaleString();
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach((counter) => observer.observe(counter));
  }

  function initCurrentYear() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  function initGalleries() {
    const galleries = document.querySelectorAll('[data-gallery]');
    if (!galleries.length) return;

    galleries.forEach((gallery) => {
      const buttons = gallery.querySelectorAll('button[data-gallery-item]');
      const preview = gallery.querySelector('[data-gallery-preview]');
      if (!buttons.length || !preview) return;

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          const template = button.querySelector('template');
          if (!template) return;
          preview.innerHTML = template.innerHTML;
          preview.querySelectorAll('img').forEach((img) => img.removeAttribute('loading'));
          buttons.forEach((btn) => btn.classList.remove('is-active'));
          button.classList.add('is-active');
        });
      });

      const activeButton = gallery.querySelector('button.is-active[data-gallery-item]') || buttons[0];
      if (activeButton) {
        activeButton.click();
      }
    });
  }
})();
