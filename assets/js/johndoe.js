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
    initCaseStudies();
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
      const precision = Number(el.dataset.countPrecision || 0);
      const duration = 1200;
      let start = null;

      const zeroValue = precision > 0
        ? (0).toLocaleString(undefined, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          })
        : '0';
      el.textContent = zeroValue;

      const step = (timestamp) => {
        if (!start) {
          start = timestamp;
        }
        const progress = Math.min((timestamp - start) / duration, 1);
        const value = progress * target;
        if (precision > 0) {
          el.textContent = value.toLocaleString(undefined, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          });
        } else {
          el.textContent = Math.floor(value).toLocaleString();
        }
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

  function initCaseStudies() {
    const grid = document.querySelector('[data-case-studies-grid]');
    if (!grid) return;

    const loading = grid.querySelector('[data-case-studies-loading]');

    fetch('data/case-studies.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load case studies: ${response.status}`);
        }
        return response.json();
      })
      .then((caseStudies) => {
        grid.innerHTML = '';
        if (!Array.isArray(caseStudies) || !caseStudies.length) {
          const empty = document.createElement('p');
          empty.className = 'text-center';
          empty.textContent = 'Case studies coming soon.';
          grid.appendChild(empty);
          return;
        }

        caseStudies.forEach((study) => {
          const col = document.createElement('div');
          col.className = 'col-md-6 col-lg-6';

          const card = document.createElement('article');
          card.className = 'project-card case-study-card';
          card.setAttribute('id', `case-study-${study.slug}`);

          const title = document.createElement('h3');
          title.textContent = study.title;
          card.appendChild(title);

          if (study.role) {
            const role = document.createElement('p');
            role.className = 'case-study-card__role';
            role.textContent = study.role;
            card.appendChild(role);
          }

          if (study.problem) {
            const problem = document.createElement('p');
            problem.innerHTML = `<strong>Problem:</strong> ${study.problem}`;
            card.appendChild(problem);
          }

          if (study.solution) {
            const solution = document.createElement('p');
            solution.innerHTML = `<strong>Solution:</strong> ${study.solution}`;
            card.appendChild(solution);
          }

          if (Array.isArray(study.stack) && study.stack.length) {
            const stackHeading = document.createElement('h4');
            stackHeading.className = 'case-study-card__subhead';
            stackHeading.textContent = 'Stack';
            card.appendChild(stackHeading);

            const stackList = document.createElement('ul');
            stackList.className = 'case-study-card__stack';
            study.stack.forEach((tool) => {
              const item = document.createElement('li');
              item.textContent = tool;
              stackList.appendChild(item);
            });
            card.appendChild(stackList);
          }

          if (Array.isArray(study.impact) && study.impact.length) {
            const impactHeading = document.createElement('h4');
            impactHeading.className = 'case-study-card__subhead';
            impactHeading.textContent = 'Impact';
            card.appendChild(impactHeading);

            const impactList = document.createElement('ul');
            impactList.className = 'case-study-card__impact';
            study.impact.forEach((result) => {
              const item = document.createElement('li');
              item.textContent = result;
              impactList.appendChild(item);
            });
            card.appendChild(impactList);
          }

          if (Array.isArray(study.media) && study.media.length) {
            const media = study.media[0];
            if (media && media.src) {
              const link = document.createElement('a');
              link.className = 'btn btn-text case-study-card__media';
              link.href = media.src;
              const isPlaceholder = media.src.startsWith('[');
              link.textContent = media.type === 'image' ? 'View image' : 'Watch demo';
              if (isPlaceholder) {
                link.setAttribute('aria-disabled', 'true');
                link.classList.add('is-placeholder');
                link.textContent += ' (add link)';
              } else {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener');
              }
              card.appendChild(link);
            }
          }

          if (Array.isArray(study.links) && study.links.length) {
            const linksList = document.createElement('div');
            linksList.className = 'case-study-card__links';
            study.links.forEach((resource) => {
              if (!resource || !resource.url) return;
              const anchor = document.createElement('a');
              anchor.className = 'btn btn-text';
              anchor.textContent = resource.label || 'View link';
              anchor.href = resource.url;
              if (!resource.url.startsWith('http')) {
                anchor.setAttribute('aria-disabled', 'true');
                anchor.classList.add('is-placeholder');
                anchor.textContent += ' (add link)';
              } else {
                anchor.target = '_blank';
                anchor.rel = 'noopener';
              }
              linksList.appendChild(anchor);
            });
            if (linksList.childElementCount) {
              card.appendChild(linksList);
            }
          }

          if (study.media && study.media[0] && study.media[0].type === 'image' && study.media[0].src && !study.media[0].src.startsWith('[')) {
            const figure = document.createElement('figure');
            figure.className = 'case-study-card__media-figure';
            const img = document.createElement('img');
            img.src = study.media[0].src;
            img.alt = `${study.title} preview`;
            img.loading = 'lazy';
            img.width = 60;
            img.height = 60;
            figure.appendChild(img);
            card.insertBefore(figure, card.firstChild);
          }

          col.appendChild(card);
          grid.appendChild(col);
        });
      })
      .catch(() => {
        if (loading) {
          loading.textContent = 'Unable to load case studies.';
        }
      });
  }
})();
