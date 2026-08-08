/* Shared progressive enhancement for every Bluerook portfolio route. */
(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowQuery = window.matchMedia('(max-width: 760px)');
  const MODE_KEY = 'bluerook.portfolio.mode';
  const MOTION_KEY = 'bluerook.portfolio.motion';
  const validModes = new Set(['story', 'inspect', 'summary']);
  const resetters = new Set();
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const storage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (_) { /* preference remains session-only */ }
    }
  };

  const announce = (message) => {
    const region = $('[data-portfolio-live]');
    if (!region) return;
    region.textContent = '';
    window.setTimeout(() => { region.textContent = message; }, 20);
  };

  const query = new URLSearchParams(window.location.search);
  let mode = validModes.has(query.get('mode'))
    ? query.get('mode')
    : (validModes.has(storage.get(MODE_KEY)) ? storage.get(MODE_KEY) : 'story');
  let motionSetting = query.get('motion') === 'reduce'
    ? 'reduce'
    : (storage.get(MOTION_KEY) || 'system');
  let paused = false;

  function syncModeControls() {
    root.dataset.portfolioMode = mode;
    $$('[data-mode-option]').forEach((button) => {
      const selected = button.dataset.modeOption === mode;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-active', selected);
    });
  }

  function setMode(nextMode, options = {}) {
    if (!validModes.has(nextMode)) return;
    const previousMode = mode;
    const activeBeforeChange = document.activeElement;
    const returningFromSummary = previousMode === 'summary' && nextMode !== 'summary';
    const focusWouldHide = nextMode === 'summary'
      ? activeBeforeChange?.closest?.('[data-story-content], [data-inspect-content]')
      : activeBeforeChange?.closest?.('.portfolio-summary');
    mode = nextMode;
    storage.set(MODE_KEY, mode);
    syncModeControls();
    document.dispatchEvent(new CustomEvent('bluerook:modechange', { detail: { mode } }));

    if (options.scroll !== false && mode === 'summary') {
      const summary = $('[data-summary-anchor]');
      if (focusWouldHide && summary) {
        summary.tabIndex = -1;
        summary.focus({ preventScroll: true });
      }
      summary?.scrollIntoView({ behavior: isReduced() || paused ? 'auto' : 'smooth', block: 'start' });
    } else if ((focusWouldHide || returningFromSummary) && mode !== 'summary') {
      const first = $('[data-chapter][id]') || $('.portfolio-main');
      if (first) {
        first.tabIndex = -1;
        first.focus({ preventScroll: true });
        if (options.scroll !== false) first.scrollIntoView({ behavior: isReduced() || paused ? 'auto' : 'smooth', block: 'start' });
      }
    }
    if (options.announce !== false) announce(`${mode[0].toUpperCase()}${mode.slice(1)} mode active.`);
  }

  function isReduced() {
    return motionSetting === 'reduce' || (motionSetting === 'system' && reduceQuery.matches);
  }

  function syncMotionControls() {
    const reduced = isReduced();
    root.dataset.reducedMotion = reduced ? 'true' : 'false';
    root.dataset.motionPaused = paused ? 'true' : 'false';

    $$('[data-motion-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(reduced));
      const label = $('[data-motion-label]', button);
      if (label) label.textContent = reduced ? 'Reduced' : 'Motion';
      button.setAttribute('aria-label', reduced ? 'Use full motion' : 'Use reduced motion');
    });

    $$('[data-pause-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(paused));
      const label = $('[data-pause-label]', button);
      if (label) label.textContent = paused ? 'Resume' : 'Pause';
    });

    document.dispatchEvent(new CustomEvent('bluerook:motionchange', {
      detail: { reduced, paused }
    }));
  }

  function setMotionSetting(setting) {
    motionSetting = setting;
    storage.set(MOTION_KEY, setting);
    syncMotionControls();
    announce(isReduced() ? 'Reduced motion active.' : 'Full motion active.');
  }

  root.classList.add('portfolio-js');
  syncModeControls();
  syncMotionControls();

  $$('[data-mode-option]').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.modeOption));
  });

  $$('[data-motion-toggle]').forEach((button) => {
    button.addEventListener('click', () => setMotionSetting(isReduced() ? 'full' : 'reduce'));
  });

  $$('[data-pause-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      paused = !paused;
      syncMotionControls();
      document.dispatchEvent(new CustomEvent('bluerook:pausechange', { detail: { paused } }));
      announce(paused ? 'Portfolio animation paused.' : 'Portfolio animation resumed.');
    });
  });

  reduceQuery.addEventListener?.('change', () => {
    if (motionSetting === 'system') {
      syncMotionControls();
    }
  });

  function initMenu() {
    const toggle = $('[data-portfolio-menu-toggle]');
    const menu = $('[data-portfolio-menu]');
    if (!toggle || !menu) return;
    const closeButton = $('[data-portfolio-menu-close]', menu);
    let priorFocus = null;
    let isolated = [];

    const isolateBackground = (open) => {
      if (open) {
        isolated = Array.from(body.children)
          .filter((element) => element !== menu && !['SCRIPT', 'STYLE'].includes(element.tagName))
          .map((element) => ({
            element,
            inert: element.hasAttribute('inert'),
            ariaHidden: element.getAttribute('aria-hidden')
          }));
        isolated.forEach(({ element }) => {
          element.setAttribute('inert', '');
          element.setAttribute('aria-hidden', 'true');
        });
      } else {
        isolated.forEach(({ element, inert, ariaHidden }) => {
          if (!inert) element.removeAttribute('inert');
          if (ariaHidden === null) element.removeAttribute('aria-hidden');
          else element.setAttribute('aria-hidden', ariaHidden);
        });
        isolated = [];
      }
    };

    const setOpen = (open) => {
      menu.hidden = !open;
      menu.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      body.classList.toggle('portfolio-menu-open', open);
      if ('inert' in menu) menu.inert = !open;
      if (open) {
        priorFocus = document.activeElement;
        closeButton?.focus();
        isolateBackground(true);
      } else {
        isolateBackground(false);
        if (priorFocus instanceof HTMLElement) priorFocus.focus();
      }
    };

    setOpen(false);
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    closeButton?.addEventListener('click', () => setOpen(false));
    $$('a', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
      if (event.key !== 'Tab' || toggle.getAttribute('aria-expanded') !== 'true') return;
      const focusable = $$('a, button:not([disabled])', menu).filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function initChapterProgress() {
    const chapters = $$('[data-chapter][id]');
    const links = $$('[data-chapter-link]');
    const meter = $('[data-page-progress]');
    if (!chapters.length) return;

    const setCurrent = (id) => {
      links.forEach((link) => {
        const active = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-current', active);
        if (active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
      root.dataset.currentChapter = id;
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setCurrent(visible.target.id);
      }, { rootMargin: '-24% 0px -58% 0px', threshold: [0.01, 0.2, 0.55] });

      chapters.forEach((chapter) => observer.observe(chapter));
    } else {
      const updateCurrent = () => {
        const readingLine = window.innerHeight * 0.35;
        const current = chapters.reduce((selected, chapter) => (
          chapter.getBoundingClientRect().top <= readingLine ? chapter : selected
        ), chapters[0]);
        setCurrent(current.id);
      };
      updateCurrent();
      window.addEventListener('scroll', updateCurrent, { passive: true });
    }
    setCurrent(chapters[0].id);

    const updateMeter = () => {
      if (!meter) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      meter.style.setProperty('--page-progress', progress.toFixed(4));
      meter.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    };
    updateMeter();
    window.addEventListener('scroll', updateMeter, { passive: true });
    window.addEventListener('resize', updateMeter, { passive: true });
  }

  function initReveals() {
    const items = $$('[data-reveal]');
    if (!items.length) return;
    if (isReduced() || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    items.forEach((item) => observer.observe(item));
  }

  function initTabs() {
    $$('[data-tabs]').forEach((tabs) => {
      const buttons = $$('[role="tab"][data-tab]', tabs);
      const panels = $$('[role="tabpanel"]', tabs);
      if (!buttons.length) return;

      const activate = (button, focus = false) => {
        const id = button.getAttribute('aria-controls');
        buttons.forEach((candidate) => {
          const selected = candidate === button;
          candidate.setAttribute('aria-selected', String(selected));
          candidate.tabIndex = selected ? 0 : -1;
          candidate.classList.toggle('is-active', selected);
        });
        panels.forEach((panel) => { panel.hidden = panel.id !== id; });
        if (focus) button.focus();
      };

      buttons.forEach((button, index) => {
        button.addEventListener('click', () => activate(button));
        button.addEventListener('keydown', (event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          let next = index;
          if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
          if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = buttons.length - 1;
          activate(buttons[next], true);
        });
      });
      activate(buttons.find((button) => button.getAttribute('aria-selected') === 'true') || buttons[0]);
    });
  }

  function initInspectors() {
    $$('[data-inspector-scope]').forEach((scope) => {
      const panel = $('[data-inspector]', scope);
      const targets = $$('[data-inspect-title]', scope);
      if (!panel || !targets.length) return;

      const fields = {
        title: $('[data-inspector-title]', panel),
        purpose: $('[data-inspector-purpose]', panel),
        input: $('[data-inspector-input]', panel),
        output: $('[data-inspector-output]', panel),
        failure: $('[data-inspector-failure]', panel),
        boundary: $('[data-inspector-boundary]', panel),
        complete: $('[data-inspector-complete]', panel)
      };

      const select = (target, options = {}) => {
        targets.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === target)));
        Object.entries(fields).forEach(([key, field]) => {
          if (!field) return;
          const value = target.dataset[`inspect${key[0].toUpperCase()}${key.slice(1)}`];
          if (value) field.textContent = value;
        });
        panel.classList.add('is-active');
        if (options.focusPanel && narrowQuery.matches) {
          panel.tabIndex = -1;
          panel.focus({ preventScroll: true });
          panel.scrollIntoView({ behavior: isReduced() || paused ? 'auto' : 'smooth', block: 'nearest' });
        }
      };

      targets.forEach((target) => target.addEventListener('click', () => select(target, { focusPanel: true })));
      select(targets.find((target) => target.getAttribute('aria-pressed') === 'true') || targets[0]);
    });
  }

  function initSignalBoards() {
    $$('[data-signal-board]').forEach((board) => {
      const button = $('[data-resolve-signals]', board)
        || (board.id ? $(`[data-resolve-signals][aria-controls="${board.id}"]`) : null);
      if (!button) return;
      const setResolved = (resolved) => {
        board.classList.toggle('is-resolved', resolved);
        button.setAttribute('aria-pressed', String(resolved));
        button.textContent = resolved ? 'Reset signal board' : 'Resolve the operation';
        $$('.signal[data-signal-card]', board).forEach((signal) => {
          const detail = $('[data-signal-detail]', signal);
          if (detail) detail.textContent = resolved ? signal.dataset.resolvedDetail : signal.dataset.initialDetail;
        });
        const field = $('.signal-board__field', board);
        if (field) field.setAttribute('aria-label', resolved
          ? 'Five operational signals with assigned owners and prepared next actions'
          : 'Five disconnected operational signals');
        const status = $('[data-signal-status]', board);
        if (status) status.textContent = resolved
          ? 'Every signal now has an owner, next action, human boundary, and completion condition.'
          : 'Signals are disconnected. Ownership is unclear.';
      };
      button.addEventListener('click', () => setResolved(!board.classList.contains('is-resolved')));
      resetters.add(() => setResolved(false));
    });
  }

  function initScrollableTables() {
    $$('.scene__body').forEach((region) => {
      if (!region.querySelector(':scope > .data-table')) return;
      region.tabIndex = 0;
      region.setAttribute('role', 'region');
      const title = $('.scene__topline span', region.closest('.scene'))?.textContent?.trim();
      region.setAttribute('aria-label', `${title || 'Evidence'} table`);
    });
  }

  function initInspectModePanel() {
    const main = $('.portfolio-main');
    if (!main || $('[data-inspect-mode-panel]')) return;

    const panel = document.createElement('aside');
    panel.className = 'inspect-mode-panel';
    panel.dataset.inspectModePanel = '';
    panel.setAttribute('aria-label', 'Inspect mode route contract');

    const wrap = document.createElement('div');
    wrap.className = 'portfolio-wrap inspect-mode-panel__grid';
    const pageName = body.dataset.page || document.title.split('—')[0].trim();
    const statuses = Array.from(new Set($$('.status-label').map((label) => label.textContent.trim()).filter(Boolean)));
    const localControls = $$('button, input, select, textarea, [role="tab"]').length;
    const chapters = $$('[data-chapter]').length;
    const isVoice = body.hasAttribute('data-voice-page');

    const blocks = [
      ['Inspecting', pageName],
      ['Evidence labels', statuses.join(' · ') || 'Route context only'],
      ['Interaction surface', `${localControls} local controls · ${chapters} chapters`],
      ['Data and action boundary', isVoice
        ? 'Synthetic fixtures; microphone is optional, permission-gated and local. Demo state stays local and no operational connector runs.'
        : 'Synthetic or explicitly labelled evidence; interactions change browser-local state and no operational connector runs.']
    ];

    blocks.forEach(([label, value], index) => {
      const block = document.createElement('div');
      if (index === 0) {
        const small = document.createElement('small');
        small.textContent = label;
        const title = document.createElement('strong');
        title.className = 'inspect-mode-panel__title';
        title.textContent = value;
        block.append(small, title);
      } else {
        const small = document.createElement('small');
        small.textContent = label;
        const strong = document.createElement('strong');
        strong.textContent = value;
        block.append(small, strong);
      }
      wrap.append(block);
    });
    panel.append(wrap);
    main.prepend(panel);
  }

  function runReset(message = true) {
    resetters.forEach((reset) => reset());
    document.dispatchEvent(new CustomEvent('bluerook:reset'));
    if (message) announce('Fictional demonstration reset to its starting state.');
  }

  $$('[data-reset-demo]').forEach((button) => button.addEventListener('click', () => runReset()));
  $$('[data-replay-experience]').forEach((button) => button.addEventListener('click', () => {
    runReset(false);
    setMode('story', { scroll: false, announce: false });
    const first = $('[data-chapter][id]');
    if (first) {
      first.tabIndex = -1;
      first.focus({ preventScroll: true });
    }
    first?.scrollIntoView({ behavior: isReduced() || paused ? 'auto' : 'smooth', block: 'start' });
    announce('Story replayed from the beginning.');
  }));
  $$('[data-skip-experience]').forEach((button) => button.addEventListener('click', () => setMode('summary')));
  $$('[data-print-page]').forEach((button) => button.addEventListener('click', () => window.print()));

  window.BluerookPortfolio = Object.freeze({
    getMode: () => mode,
    isReduced,
    isPaused: () => paused,
    announce,
    reset: runReset,
    schedule(callback, delay = 0) {
      if (typeof callback !== 'function') return () => {};
      let cancelled = false;
      let remaining = Math.max(0, Number(delay) || 0);
      let last = performance.now();
      let timer = 0;
      const tick = () => {
        if (cancelled) return;
        const now = performance.now();
        if (!paused) remaining -= now - last;
        last = now;
        if (!paused && (remaining <= 0 || isReduced())) {
          callback();
          return;
        }
        timer = window.setTimeout(tick, paused ? 50 : Math.min(50, Math.max(0, remaining)));
      };
      timer = window.setTimeout(tick, paused ? 50 : Math.min(50, Math.max(0, remaining)));
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    },
    registerReset(callback) {
      if (typeof callback !== 'function') return () => {};
      resetters.add(callback);
      return () => resetters.delete(callback);
    }
  });

  [
    ['menu', initMenu],
    ['inspect mode panel', initInspectModePanel],
    ['chapter progress', initChapterProgress],
    ['reveals', initReveals],
    ['tabs', initTabs],
    ['inspectors', initInspectors],
    ['signal boards', initSignalBoards],
    ['scrollable tables', initScrollableTables]
  ].forEach(([feature, initialize]) => {
    try {
      initialize();
    } catch (error) {
      console.error(`[Bluerook portfolio] ${feature} initialization failed.`, error);
    }
  });
})();
