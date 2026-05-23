/* ──────────────────────────────────────────────────────────
   PORTFOLIO v3 — INTERACTIONS
   ────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // STICKY NAV
  // ──────────────────────────────────────────────────────────
  const nav = document.getElementById('nav');
  if (nav) {
    const onScrollNav = () => {
      if (window.scrollY > 24) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScrollNav, { passive: true });
    onScrollNav();
  }

  // ──────────────────────────────────────────────────────────
  // TYPEWRITER (hero)
  // ──────────────────────────────────────────────────────────
  (function () {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const phrases = [
      'AI Systems Engineer',
      'Autonomous Robotics Builder',
      'From Sensor to Intelligence',
      'Deployed in the Real World',
      'Sustainable Tech for Lebanon'
    ];
    let p = 0, i = 0, dir = 1, hold = 0;
    function tick() {
      const phrase = phrases[p];
      if (dir === 1) {
        i++;
        el.textContent = phrase.slice(0, i);
        if (i >= phrase.length) { dir = -1; hold = 32; }
      } else if (hold > 0) { hold--; }
      else {
        i--;
        el.textContent = phrase.slice(0, i);
        if (i <= 0) { dir = 1; p = (p + 1) % phrases.length; }
      }
      const delay = dir === 1 ? 65 : 30;
      setTimeout(tick, hold > 0 ? 80 : delay);
    }
    tick();
  })();

  // ──────────────────────────────────────────────────────────
  // TEXT SCRAMBLE on section titles
  // ──────────────────────────────────────────────────────────
  class Scramble {
    constructor(el) {
      this.el = el;
      this.original = el.textContent;
      this.chars = '!<>-_\\/[]{}—=+*^?#________';
      this.queue = [];
      this.frame = 0;
      this.frameRequest = null;
      this.resolve = null;
      this.update = this.update.bind(this);
    }
    setText(newText) {
      const oldText = this.el.textContent;
      const len = Math.max(oldText.length, newText.length);
      const promise = new Promise(r => this.resolve = r);
      this.queue = [];
      for (let i = 0; i < len; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 36);
        const end = start + Math.floor(Math.random() * 36);
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return promise;
    }
    update() {
      let output = '';
      let complete = 0;
      for (let i = 0, n = this.queue.length; i < n; i++) {
        const q = this.queue[i];
        if (this.frame >= q.end) { complete++; output += q.to; }
        else if (this.frame >= q.start) {
          if (!q.char || Math.random() < 0.28) {
            q.char = this.chars[Math.floor(Math.random() * this.chars.length)];
          }
          output += `<span style="color:#1A56DB;opacity:0.85">${q.char}</span>`;
        } else {
          output += q.from;
        }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) { this.resolve(); }
      else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }
  }

  function scrambleIn(el) {
    if (el.dataset.scrambleDone) return;
    el.dataset.scrambleDone = '1';
    const target = el.dataset.text || el.textContent;
    const s = new Scramble(el);
    s.setText(target);
  }

  // ──────────────────────────────────────────────────────────
  // COUNT-UP for stats
  // ──────────────────────────────────────────────────────────
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const isK = el.dataset.k === '1';
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      let val = target * eased;
      let display;
      if (isK) {
        if (val >= 1000) display = (val / 1000).toFixed(0) + 'K';
        else display = Math.round(val).toString();
      } else {
        display = Math.round(val).toString();
      }
      el.firstChild.nodeValue = display;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ──────────────────────────────────────────────────────────
  // SCROLL REVEALS via IntersectionObserver
  // ──────────────────────────────────────────────────────────
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      // text scramble on section titles
      e.target.querySelectorAll('.scramble').forEach(scrambleIn);
      // counters
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      // stagger experience bullets
      e.target.querySelectorAll('.exp-list li').forEach((li, i) => {
        setTimeout(() => li.classList.add('visible'), 80 * i);
      });
      // stagger pub rows
      e.target.querySelectorAll('.pub-row').forEach((row, i) => {
        setTimeout(() => row.classList.add('visible'), 80 * i);
      });
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('.reveal, .reveal-stagger, .sec-head, .stats, .exp-section, .pubs-section')
    .forEach(el => revealObs.observe(el));

  // Also observe section titles in isolation for early-trigger scramble
  document.querySelectorAll('.scramble').forEach(el => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { scrambleIn(el); obs.disconnect(); }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
  });

  // ──────────────────────────────────────────────────────────
  // MAGNETIC CURSOR on .btn-magnetic
  // ──────────────────────────────────────────────────────────
  const radius = 80;
  const strength = 0.35;
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (ev) => {
      const r = btn.getBoundingClientRect();
      const bx = r.left + r.width / 2;
      const by = r.top + r.height / 2;
      const dx = ev.clientX - bx;
      const dy = ev.clientY - by;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        btn.style.setProperty('--magnet-x', (dx * strength) + 'px');
        btn.style.setProperty('--magnet-y', (dy * strength) + 'px');
      }
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.setProperty('--magnet-x', '0px');
      btn.style.setProperty('--magnet-y', '0px');
    });
  });

  // ──────────────────────────────────────────────────────────
  // PROJECTS — native horizontal scroller progress
  // ──────────────────────────────────────────────────────────
  (function () {
    const scroller = document.querySelector('.projects-scroller');
    const track    = document.querySelector('.projects-track');
    const fill     = document.querySelector('.projects-progress-fill');
    const countEl  = document.querySelector('.projects-progress-count');
    if (!scroller || !track) return;
    const cards = track.children.length;

    function update() {
      const max = scroller.scrollWidth - scroller.clientWidth;
      const p = max > 0 ? scroller.scrollLeft / max : 0;
      if (fill) fill.style.width = (p * 100) + '%';
      if (countEl) {
        const idx = Math.min(cards, Math.floor(p * (cards - 0.0001)) + 1);
        countEl.textContent = `${String(idx).padStart(2, '0')} / ${String(cards).padStart(2, '0')}`;
      }
    }
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  // ──────────────────────────────────────────────────────────
  // PARALLAX on hero shader blobs
  // ──────────────────────────────────────────────────────────
  const blobs = document.querySelectorAll('.hero-shader .blob');
  if (blobs.length) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      blobs.forEach((b, i) => {
        const speed = [0.15, 0.10, 0.22][i] || 0.12;
        b.style.translate = `0px ${y * speed}px`;
      });
    }, { passive: true });
  }

  // ──────────────────────────────────────────────────────────
  // EXPERIENCE TIMELINE — line draws in
  // ──────────────────────────────────────────────────────────
  (function () {
    const wrap = document.querySelector('.exp-wrap');
    const line = document.querySelector('.exp-line');
    if (!wrap || !line) return;
    function tick() {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.7;
      const end = vh * 0.1;
      const totalDist = r.height + (start - end);
      const passed = start - r.top;
      const p = Math.max(0, Math.min(1, passed / totalDist));
      line.style.background =
        `linear-gradient(180deg, var(--blue) ${p * 100}%, var(--rule) ${p * 100}%)`;
    }
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  })();

})();
