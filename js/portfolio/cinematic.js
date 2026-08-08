/* Cinematic layer: ambient life and reactive feedback for the portfolio.
   Adds no synthetic events and changes no demo state — it decorates the
   deterministic simulations the page modules already run. */
(function () {
  'use strict';

  const api = window.BluerookPortfolio;
  if (!api || !document.body.classList.contains('portfolio-page')) return;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* 1 — Stagger indices for choreographed groups. */
  ['.signal', '.workflow-node', '.architecture-node', '.inspector-targets .inspect-target']
    .forEach((selector) => {
      const groups = new Map();
      $$(selector).forEach((element) => {
        const parent = element.parentElement;
        const index = groups.get(parent) || 0;
        element.style.setProperty('--cine-i', String(index));
        groups.set(parent, index + 1);
      });
    });

  /* 2 — Mark interactive scenes as live (pulsing dot in the topline). */
  $$('.scene').forEach((scene) => {
    if (!scene.querySelector('.scene__topline')) return;
    const interactive = scene.querySelector(
      'button:not([data-print-page]), select, input, textarea, .activity-log, .terminal'
    );
    if (interactive) scene.setAttribute('data-live', '');
  });

  /* 3 — Activity logs animate entries only after initial paint. */
  window.setTimeout(() => {
    $$('.activity-log').forEach((log) => log.classList.add('is-live'));
  }, 400);

  /* 4 — Terminal lines type themselves under full motion. */
  $$('[data-asset-terminal]').forEach((terminal) => {
    const typeLine = (line) => {
      const text = line.textContent;
      if (!text || api.isReduced()) return;
      line.textContent = '';
      let position = 0;
      const step = () => {
        if (!line.isConnected) return;
        if (api.isReduced()) { line.textContent = text; return; }
        position += 1 + (text.length > 44 ? 1 : 0);
        line.textContent = text.slice(0, position);
        if (position < text.length) api.schedule(step, 14);
      };
      api.schedule(step, 14);
    };
    new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList.contains('terminal-line') && !node.dataset.cineTyped) {
            node.dataset.cineTyped = '1';
            typeLine(node);
          }
        });
      });
    }).observe(terminal, { childList: true });
  });

  /* 5 — Any simulated value that changes ripples with a brief flash. */
  const FLASH_ROOTS = '.scene__body, .scene-grid, .dashboard, .state-strip, .record-list, .inspector, .summary-facts';
  const FLASH_TARGETS = 'strong, dd, output, small, span, p, time, td';
  const FLASH_SKIP = '.activity-log, .terminal, form, .builder-output, .signal-board, nav, .chapter-head';

  const flash = (element) => {
    if (!element || element.classList.contains('value-flash')) return;
    element.classList.add('value-flash');
    element.addEventListener('animationend', () => element.classList.remove('value-flash'), { once: true });
    window.setTimeout(() => element.classList.remove('value-flash'), 1200);
  };

  /* Page modules rewrite every field on render, changed or not; flash only
     values whose text actually differs from the last observed state. */
  const lastText = new WeakMap();
  const seedFlashCache = () => {
    $$(FLASH_ROOTS).forEach((root) => {
      $$(FLASH_TARGETS, root).forEach((element) => lastText.set(element, element.textContent));
    });
  };
  seedFlashCache();

  let armed = false;
  window.setTimeout(() => { armed = true; }, 900);

  const flashObserver = new MutationObserver((records) => {
    const suppressed = !armed || api.isReduced();
    const seen = new Set();
    records.forEach((record) => {
      const source = record.target.nodeType === 3 ? record.target.parentElement : record.target;
      if (!source || !(source instanceof Element) || !source.isConnected) return;
      if (source.closest(FLASH_SKIP)) return;
      const target = source.matches(FLASH_TARGETS) ? source : source.closest(FLASH_TARGETS);
      if (!target || target.closest(FLASH_SKIP) || seen.has(target)) return;
      seen.add(target);
      const now = target.textContent;
      if (lastText.get(target) === now) return;
      lastText.set(target, now);
      if (!suppressed) flash(target);
    });
  });
  $$(FLASH_ROOTS).forEach((root) => {
    flashObserver.observe(root, { childList: true, characterData: true, subtree: true });
  });

  /* Re-arm suppression during full resets so the page doesn't strobe. */
  document.addEventListener('bluerook:reset', () => {
    armed = false;
    window.setTimeout(() => { armed = true; }, 700);
  });

  /* 6 — Ambient world: drifting orbs + cursor bloom, matching the main site. */
  (function ambientWorld() {
    const orbs = $$('.ambient__orb');
    if (orbs.length && !api.isReduced()) {
      orbs.forEach((orb, i) => {
        const dx = (i % 2 ? 1 : -1) * (60 + i * 20);
        const dy = (i % 2 ? -1 : 1) * (50 + i * 18);
        orb.animate(
          [{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${dx}px, ${dy}px, 0)` }],
          { duration: (22 + i * 4) * 1000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
        );
      });
    }

    const glow = $('[data-cursor-glow]');
    if (!glow || 'ontouchstart' in window || api.isReduced() || window.innerWidth < 1024) return;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my, raf = null;
    const loop = () => {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      glow.style.setProperty('--mx', `${cx}px`);
      glow.style.setProperty('--my', `${cy}px`);
      raf = (Math.abs(mx - cx) > 0.5 || Math.abs(my - cy) > 0.5) ? requestAnimationFrame(loop) : null;
    };
    window.addEventListener('pointermove', (event) => {
      mx = event.clientX; my = event.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  })();

  /* 7 — Nav gains weight once the page leaves the top. */
  (function navShade() {
    const nav = $('.portfolio-nav');
    if (!nav) return;
    const paint = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    paint();
    window.addEventListener('scroll', paint, { passive: true });
  })();

  /* 8 — Crossfade the stage when the visitor changes mode. */
  const main = document.querySelector('.portfolio-main');
  if (main) {
    document.addEventListener('bluerook:modechange', () => {
      if (api.isReduced()) return;
      main.classList.remove('mode-anim');
      void main.offsetWidth;
      main.classList.add('mode-anim');
      main.addEventListener('animationend', () => main.classList.remove('mode-anim'), { once: true });
    });
  }
})();
