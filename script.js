/* =========================================================
   BLUEROOK — Motion layer
   - heavy  ( >1024px ): full GSAP + Lenis + ScrollTriggers + particles + tilt
   - light  ( 769–1024 ): Lenis + GSAP fades + castling
   - mobile (  ≤768   ): Lenis smoothTouch + GSAP light + castling + ambient
   ========================================================= */

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = window.innerWidth;

  let tier = 'heavy';
  if (W <= 768)  tier = 'mobile';
  else if (W <= 1024) tier = 'light';
  if (prefersReduced) tier = 'mobile';

  document.body.classList.add('js-' + tier);

  /* ---------- Loading screen ---------- */
  const loaderStart = performance.now();
  const MIN_LOADER_MS = 2600; // let the construction animation play through
  const hideLoader = () => {
    const l = document.querySelector('[data-loader]');
    if (!l) return;
    const elapsed = performance.now() - loaderStart;
    const wait = Math.max(0, MIN_LOADER_MS - elapsed);
    setTimeout(() => {
      l.classList.add('is-hidden');
      setTimeout(() => l.remove(), 700);
    }, wait);
  };
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);

  initUniversal();

  /* ---------- Lenis — ALL tiers (smoothTouch on mobile for premium inertia) ---------- */
  let lenis = null;
  const startLenis = () => {
    if (tier === 'mobile') return; // scroll-snap handles mobile — no Lenis
    if (!window.Lenis) { setTimeout(startLenis, 60); return; }
    lenis = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  };
  startLenis();

  /* ---------- GSAP — ALL tiers ---------- */
  if (!window.gsap || !window.ScrollTrigger) {
    // No GSAP available: CSS-only IO reveals fallback
    initCSSReveals();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());

  const onLoad = (fn) => {
    if (document.readyState === 'complete') fn();
    else window.addEventListener('load', fn);
  };

  if (tier === 'mobile') {
    // Mobile: CSS-driven. Native smooth scroll. IO fade-up reveals + bottom CTA bar.
    initMobileBottomCTA();
    onLoad(() => {
      setTimeout(initMobileFadeUp, 80);
      setTimeout(initMobileCastling3D, 100);
      setTimeout(initMobileCastlingScrub, 120);
      setTimeout(initMobileSwipeHints, 140);
      setTimeout(initMobileDiagnosis, 100);
      setTimeout(initMobileServicesAccordion, 100);
      setTimeout(initMobileProcessAccordion, 100);
      setTimeout(initMobileScrollPolish, 100);
      setTimeout(initMobileTouchRipple, 100);
      setTimeout(initMobileSectionInView, 100);
    });
    return; // skip all desktop/heavy GSAP wiring
  } else if (tier === 'light') {
    onLoad(() => {
      setTimeout(initLightFades, 100);
      setTimeout(initLightScroll, 300);
    });
  } else {
    onLoad(() => {
      setTimeout(initHeroAnimations, 100);
      setTimeout(initScrollAnimations, 300);
      setTimeout(initParticles, 500);
      setTimeout(initTilt, 600);
    });
  }

  /* ==========================================================
     UNIVERSAL — every tier, no GSAP cost
     ========================================================== */
  function initUniversal() {
    // Privileges accordion (works on every tier, no GSAP needed)
    initPrivileges();

    // Nav scroll state
    const nav = document.querySelector('[data-nav]');
    if (nav) {
      const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Theme toggle
    const THEME_KEY = 'bluerook-theme';
    const body = document.body;
    const themeBtn = document.querySelector('[data-theme-toggle]');
    const applyTheme = (t) => {
      body.classList.toggle('theme-very-dark', t === 'very-dark');
      body.setAttribute('data-theme', t === 'very-dark' ? 'very-dark' : 'navy');
      if (themeBtn) themeBtn.setAttribute('aria-pressed', t === 'very-dark');
    };
    applyTheme(localStorage.getItem(THEME_KEY) || 'navy');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = body.classList.contains('theme-very-dark') ? 'navy' : 'very-dark';
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    }

    // Mobile hamburger
    const menuBtn    = document.querySelector('[data-menu-toggle]');
    const menuClose  = document.querySelector('[data-menu-close]');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (menuBtn && mobileMenu) {
      const openMenu = () => {
        mobileMenu.classList.add('is-open');
        menuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      };
      const closeMenu = () => {
        mobileMenu.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      };
      menuBtn.addEventListener('click', () => {
        mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
      });
      if (menuClose) menuClose.addEventListener('click', closeMenu);
      mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
      });
    }

    // .reveal-on-view (CSS keyframe driven, always runs)
    const revealEls = document.querySelectorAll('.reveal-on-view');
    if (revealEls.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
      revealEls.forEach(el => io.observe(el));
    }

    // Ambient cursor glow — pointer devices / heavy tier only
    const cursorGlow = document.querySelector('[data-cursor-glow]');
    if (cursorGlow && !('ontouchstart' in window) && tier === 'heavy') {
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let cmx = mx, cmy = my, raf = null;
      const loop = () => {
        cmx += (mx - cmx) * 0.12; cmy += (my - cmy) * 0.12;
        cursorGlow.style.setProperty('--mx', cmx + 'px');
        cursorGlow.style.setProperty('--my', cmy + 'px');
        raf = (Math.abs(mx - cmx) > 0.5 || Math.abs(my - cmy) > 0.5) ? requestAnimationFrame(loop) : null;
      };
      window.addEventListener('pointermove', e => {
        mx = e.clientX; my = e.clientY;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
    }
  }

  /* ==========================================================
     LIGHT TIER + MOBILE — shared entrance & scroll reveals
     ========================================================== */
  /* ==========================================================
     MOBILE — IntersectionObserver fade-up reveals (CSS-driven)
     ========================================================== */
  function initMobileFadeUp() {
    const targets = document.querySelectorAll(
      '[data-fade], [data-reveal], [data-stack], ' +
      '.svc-card, .step, .why-cell, .trust__item, .privilege, ' +
      '.castling__caption, .problem__statement, ' +
      '.hero__title, .hero__lead, .hero__eyebrow, .hero__rook-wrap'
    );
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    // Stagger reveals inside sibling groups so cards cascade in cinematically
    // (e.g. four why-cells: 0ms, 90ms, 180ms, 270ms). Each element's own delay
    // is set once at observation time so it persists across re-runs.
    const groupCounters = new WeakMap();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Compute stagger from element's index within its parent (cards only)
        if (el.matches('.why-cell, .trust__item, .privilege, .svc-card, .step')) {
          const parent = el.parentElement;
          if (parent && !groupCounters.has(parent)) {
            groupCounters.set(parent, 0);
          }
          if (parent) {
            const n = groupCounters.get(parent);
            el.style.transitionDelay = `${n * 90}ms`;
            groupCounters.set(parent, n + 1);
          }
        }
        // Add BOTH classes so legacy + new CSS selectors both match
        el.classList.add('is-visible', 'is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(el => io.observe(el));
  }

  /* ==========================================================
     MOBILE — Inject sticky bottom CTA bar (glassmorphism)
     ========================================================== */
  function initMobileBottomCTA() {
    if (document.querySelector('.m-fab')) return;
    const fab = document.createElement('a');
    fab.className = 'm-fab';
    fab.href = 'https://calendar.app.google/pjQKiGLntog19k9Y9';
    fab.target = '_blank';
    fab.rel = 'noopener';
    fab.setAttribute('aria-label', 'Book a Call');
    fab.innerHTML =
      '<span class="m-fab__label">Book a Call</span>' +
      '<svg class="m-fab__icon" viewBox="0 0 16 16" aria-hidden="true">' +
        '<path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="square"/>' +
      '</svg>';
    document.body.appendChild(fab);
  }

  /* ==========================================================
     MOBILE CASTLING 3D — scroll-driven cinematic castling
     The --castle-progress CSS variable (0 → 1) drives all the
     transforms on the 3D scene. We compute progress from the
     section's position relative to the viewport.
     ========================================================== */
  function initMobileCastling3D() {
    const scene = document.querySelector('[data-cast3d]');
    if (!scene) return;

    // ── 3D EXTRUSION: clone each piece's SVG into a stack of Z-receding layers.
    // Preserves the brand silhouette (rook crenellations / king stepped crown)
    // while extruding it into space — pure CSS transform-style: preserve-3d.
    const LAYERS = 7;                // total depth slices behind the front face
    const buildExtrusion = (selector) => {
      const piece = scene.querySelector(selector);
      if (!piece) return;
      const stand = piece.querySelector('.cast3d__piece-stand');
      const front = stand && stand.querySelector('svg');
      if (!stand || !front) return;
      // Bail if already built
      if (stand.dataset.extruded === '1') return;
      stand.dataset.extruded = '1';

      // Insert back-to-front so the original SVG (z=0) sits ON TOP visually
      for (let i = LAYERS; i >= 1; i--) {
        const clone = front.cloneNode(true);
        clone.classList.add('cast3d__piece-layer');
        clone.style.setProperty('--z', String(i));
        // Darken paths progressively — fakes side-wall shading
        const shade = Math.max(0.32, 1 - (i / LAYERS) * 0.62);
        clone.querySelectorAll('[fill="#F4EDE0"]').forEach(el => {
          el.setAttribute('fill', `rgba(244,237,224,${shade.toFixed(2)})`);
        });
        clone.querySelectorAll('g[fill="#F4EDE0"]').forEach(el => {
          el.setAttribute('fill', `rgba(244,237,224,${shade.toFixed(2)})`);
        });
        // Brass rule keeps full strength on every layer (it's the spine of the brand)
        stand.insertBefore(clone, front);
      }

      // Top brass cap — sits a hair in front of the front face for a "crown" feel
      const cap = front.cloneNode(true);
      cap.classList.add('cast3d__piece-cap');
      cap.querySelectorAll('[fill="#F4EDE0"]').forEach(el => {
        el.setAttribute('fill', 'rgba(244,237,224,0.96)');
      });
      cap.querySelectorAll('g[fill="#F4EDE0"]').forEach(el => {
        el.setAttribute('fill', 'rgba(244,237,224,0.96)');
      });
      stand.appendChild(cap);
    };
    buildExtrusion('[data-cast3d-king]');
    buildExtrusion('[data-cast3d-rook]');

    const replay = scene.querySelector('[data-cast3d-replay]');
    // Replay button removed from UX — kept here as a no-op fallback only.
    let inView = false;
    let progress = 0;
    let manualProgress = null; // when set, overrides scroll-driven (for replay)
    let manualStart = 0;
    let entryAmount = 0;       // 0 → 1 chapter card fade

    // Eased phase mapper — turns a (start, end) window of master progress
    // into a smooth 0→1 sub-progress, with cubic ease-in-out for cinematic feel.
    const ease = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
    const phase = (p, start, end) => {
      if (p <= start) return 0;
      if (p >= end)   return 1;
      return ease((p - start) / (end - start));
    };

    const setProg = (p) => {
      progress = Math.max(0, Math.min(1, p));
      scene.style.setProperty('--cast-progress', progress.toFixed(3));
      // King moves first (deliberate 2 steps): progress 0.05 → 0.42
      // Then rook leaps over: progress 0.42 → 0.86 (single full rotation + arc)
      const kingP = phase(progress, 0.05, 0.42);
      const rookP = phase(progress, 0.42, 0.86);
      scene.style.setProperty('--king-phase', kingP.toFixed(3));
      scene.style.setProperty('--rook-phase', rookP.toFixed(3));
    };
    const setEntry = (e) => {
      entryAmount = Math.max(0, Math.min(1, e));
      scene.style.setProperty('--cast-in', entryAmount.toFixed(3));
    };

    const update = () => {
      if (manualProgress !== null) {
        const t = (performance.now() - manualStart) / 1600;
        if (t >= 1) {
          setProg(1);
          manualProgress = null;
        } else {
          // ease-in-out cubic
          const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          setProg(e);
          requestAnimationFrame(update);
          return;
        }
      }
      if (!inView) return;
      const r = scene.getBoundingClientRect();
      const vh = window.innerHeight;
      // Chapter card entry — fades in as the stage approaches center
      const entryRaw = (vh * 0.85 - r.top) / (vh * 0.85);
      setEntry(entryRaw);
      // Castle progress — when stage top hits 50%vh → 0; when stage bottom hits 50%vh → 1
      const start = vh * 0.5;
      const end   = -r.height + vh * 0.5;
      const raw = (start - r.top) / (start - end);
      setProg(raw);
      // Reveal replay once stage has played through
      if (raw >= 0.92 && replay && !replay.classList.contains('is-shown')) {
        replay.classList.add('is-shown');
      }
    };

    // Observe stage to gate the scroll listener
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        inView = e.isIntersecting;
        if (inView) update();
      });
    }, { threshold: 0, rootMargin: '30% 0px 30% 0px' });
    io.observe(scene);

    // Scroll listener (rAF-throttled)
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }, { passive: true });

    // Replay handler
    if (replay) {
      replay.addEventListener('click', () => {
        setProg(0);
        manualProgress = 1;
        manualStart = performance.now();
        requestAnimationFrame(update);
      });
    }

    update();
  }

  /* ==========================================================
     MOBILE CASTLING · GSAP ScrollTrigger scrub
     ── .castling is position: sticky, height 220svh. We scrub the
        King/Rook horizontal swap + caption reveal across the full
        scroll distance. Reverses perfectly on scroll-up.
     ========================================================== */
  function initMobileCastlingScrub() {
    if (window.innerWidth > 768) return;
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = document.querySelector('.castling');
    const stage   = document.querySelector('.castling__stage');
    const king    = document.querySelector('.castling__piece--king');
    const rook    = document.querySelector('.castling__piece--rook');
    const caption = document.querySelector('.castling__caption');
    if (!section || !stage || !king || !rook) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (caption) {
        caption.style.opacity = '1';
        caption.style.transform = 'none';
      }
      return;
    }

    gsap.set([king, rook], { x: 0, y: 0, force3D: true });
    if (caption) gsap.set(caption, { opacity: 0, y: 20, force3D: true });

    // True swap distance: end with King where Rook started and vice versa.
    // King sits at the left grid column, Rook at the right; both need to
    // travel (stage_width − piece_width) horizontally to swap centers.
    const swap = () => {
      const sw = stage.getBoundingClientRect().width;
      const pw = king.getBoundingClientRect().width || 88;
      return Math.max(0, sw - pw);
    };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // 0.0 – 0.65 : the actual castling move — pieces fully swap positions.
    // King lifts over the rank so it visibly leaps the Rook (real castling).
    tl.to(king, {
        x: () => swap(),
        ease: 'power2.inOut',
        duration: 0.65,
      }, 0)
      .to(king, {
        y: -28,
        ease: 'power2.out',
        duration: 0.32,
      }, 0)
      .to(king, {
        y: 0,
        ease: 'power2.in',
        duration: 0.33,
      }, 0.32)
      .to(rook, {
        x: () => -swap(),
        ease: 'power2.inOut',
        duration: 0.65,
      }, 0);

    // Elevate the King so it reads as passing over the Rook
    gsap.set(king, { zIndex: 3 });
    gsap.set(rook, { zIndex: 2 });

    // 0.65 – 1.0 : caption rises after the swap resolves
    if (caption) {
      tl.to(caption, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.35 }, 0.65);
    }
  }

  /* ==========================================================
     MOBILE SWIPE HINTS
     ── Injects a "Swipe →" pill under each horizontal carousel
        on mobile, then fades it once the user actually scrolls
        that carousel — so the affordance disappears as soon as
        it has done its job.
     ========================================================== */
  function initMobileSwipeHints() {
    if (window.innerWidth > 768) return;

    const carousels = [
      { wrap: '.services',   track: '.services__track',   label: 'Swipe to explore' },
      { wrap: '.privileges', track: '.privileges__list',  label: 'Swipe · tap to expand' },
    ];

    carousels.forEach(({ wrap, track, label }) => {
      const section = document.querySelector(wrap);
      const scroller = document.querySelector(track);
      if (!section || !scroller) return;
      if (section.querySelector('.swipe-hint')) return;

      const hint = document.createElement('div');
      hint.className = 'swipe-hint';
      hint.setAttribute('aria-hidden', 'true');
      hint.innerHTML =
        '<span>' + label + '</span>' +
        '<span class="swipe-hint__arrow">→</span>';

      // Insert ABOVE the scroller (or its wrapper) so the hint reads
      // while the cards are still in view — not after the user has
      // already scrolled past the section.
      const anchor = scroller.parentElement === section
        ? scroller
        : scroller.parentElement;
      anchor.insertAdjacentElement('beforebegin', hint);

      // Only fade after a *real* user interaction with the carousel —
      // not on layout-driven scroll events (scrollIntoView, snap
      // re-anchoring, etc.) which would prematurely hide the affordance.
      let faded = false;
      let userTouched = false;
      const fade = () => {
        if (faded) return;
        faded = true;
        hint.classList.add('is-faded');
        scroller.removeEventListener('scroll', onScroll);
      };
      const markUser = () => { userTouched = true; };
      const onScroll = () => {
        if (userTouched && scroller.scrollLeft > 24) fade();
      };
      scroller.addEventListener('pointerdown', markUser, { passive: true });
      scroller.addEventListener('touchstart',  markUser, { passive: true });
      scroller.addEventListener('wheel',       markUser, { passive: true });
      scroller.addEventListener('scroll', onScroll, { passive: true });
      // Also fade after 15s so the hint doesn't loop forever
      setTimeout(fade, 15000);
    });
  }

  /* ==========================================================
     MOBILE DIAGNOSIS — full-screen statement progression
     ── Pins .diag__stage; crossfades 3 statements with blur.
     ── Drives .diag.--diag-progress (0→1) + .is-active/.is-past
        on each .diag__stmt + matching .diag__dot.
     ========================================================== */
  function initMobileDiagnosis() {
    const diag = document.querySelector('[data-diag]');
    if (!diag) return;
    const stmts = Array.from(diag.querySelectorAll('.diag__stmt'));
    const dots  = Array.from(diag.querySelectorAll('.diag__dot'));
    if (!stmts.length) return;

    let inView = false;
    let lastIdx = -1;

    const setProg = (p) => {
      diag.style.setProperty('--diag-progress', p.toFixed(3));
    };

    const setActive = (idx) => {
      if (idx === lastIdx) return;
      lastIdx = idx;
      stmts.forEach((el, i) => {
        el.classList.remove('is-active', 'is-past');
        if (i === idx) el.classList.add('is-active');
        else if (i < idx) el.classList.add('is-past');
      });
      dots.forEach((d, i) => {
        d.classList.remove('is-active', 'is-past');
        if (i === idx) d.classList.add('is-active');
        else if (i < idx) d.classList.add('is-past');
      });
    };

    const update = () => {
      if (!inView) return;
      const r = diag.getBoundingClientRect();
      const vh = window.innerHeight;
      // Stage is pinned while diag top is between 0 and -(height-vh)
      // Map scrolled distance to progress 0→1
      const scrolled = Math.max(0, -r.top);
      const range = Math.max(1, r.height - vh);
      const p = Math.max(0, Math.min(1, scrolled / range));
      setProg(p);
      // Pick statement: split progress into N equal bands
      const n = stmts.length;
      // Each statement occupies its own band; we bias slightly so users
      // settle on each before transitioning.
      const idx = Math.min(n - 1, Math.floor(p * n));
      setActive(idx);
    };

    // Default active state
    setActive(0);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        inView = e.isIntersecting;
        if (inView) update();
      });
    }, { threshold: 0, rootMargin: '20% 0px 20% 0px' });
    io.observe(diag);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }, { passive: true });

    update();
  }

  /* ==========================================================
     MOBILE SERVICES ACCORDION
     ── Compresses each .svc-card to title-only by default.
     ── Tap reveals body + list with grid-template-rows animation.
     ── Injects a per-card tagline + chevron.
     ========================================================== */
  function initMobileServicesAccordion() {
    const cards = document.querySelectorAll('.services .svc-card:not(.svc-card--pillar)');
    if (!cards.length) return;

    // One-line tagline per service (keyed by data-svc-bg or title)
    const taglines = {
      va:     'Always-on execution squads, tied to SLAs.',
      social: 'Channel management — not posts.',
      auto:   'Continuous oversight. Bi-weekly audits.',
      build:  'Bespoke architectures, milestone-priced.',
      audit:  'Map every leak. Blueprint the fix.',
    };

    cards.forEach((card) => {
      // 1) Wrap body + list inside a collapsible details container
      const body = card.querySelector('.svc-card__body');
      const list = card.querySelector('.svc-card__list');
      if (!body && !list) return;

      const details = document.createElement('div');
      details.className = 'svc-card__details';
      const inner = document.createElement('div');
      inner.className = 'svc-card__details-inner';
      details.appendChild(inner);

      // Move body + list into the inner container
      const parent = body ? body.parentNode : list.parentNode;
      if (body) inner.appendChild(body);
      if (list) inner.appendChild(list);
      parent.appendChild(details);

      // 2) Inject tagline directly after title
      const title = card.querySelector('.svc-card__title');
      if (title) {
        // Wrap title text in a span + append chevron inside title
        const titleText = title.textContent.trim();
        title.textContent = '';
        const span = document.createElement('span');
        span.className = 'svc-card__title-text';
        span.textContent = titleText;
        title.appendChild(span);

        const chev = document.createElement('span');
        chev.className = 'svc-card__chev';
        chev.setAttribute('aria-hidden', 'true');
        chev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><path d="M12 5v14M5 12h14"/></svg>';
        title.appendChild(chev);

        // Tagline node
        const key = card.dataset.svcBg;
        const tag = taglines[key];
        if (tag) {
          const p = document.createElement('p');
          p.className = 'svc-card__tag';
          p.textContent = tag;
          title.insertAdjacentElement('afterend', p);
        }
      }

      // 3) ARIA + tap handling
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-expanded', 'false');
      const toggle = () => {
        const isOpen = card.hasAttribute('data-open');
        if (isOpen) {
          card.removeAttribute('data-open');
          card.setAttribute('aria-expanded', 'false');
        } else {
          card.setAttribute('data-open', '');
          card.setAttribute('aria-expanded', 'true');
        }
      };
      card.addEventListener('click', (e) => {
        // Don't toggle if user is interacting with text-select inside an open card
        if (e.target.closest('a, button')) return;
        toggle();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /* ==========================================================
     MOBILE PROCESS ACCORDION
     ── Each step shows: number + title + one-line lead.
     ── Tap reveals .step__copy with a smooth height animation.
     ========================================================== */
  function initMobileProcessAccordion() {
    const steps = document.querySelectorAll('.process .step');
    if (!steps.length) return;

    steps.forEach((step) => {
      const copy = step.querySelector('.step__copy');
      if (!copy) return;

      // Wrap copy in collapsible container
      const details = document.createElement('div');
      details.className = 'step__details';
      const inner = document.createElement('div');
      inner.className = 'step__details-inner';
      inner.appendChild(copy);
      details.appendChild(inner);
      step.querySelector('.step__body')?.appendChild(details);

      // Chevron
      const lead = step.querySelector('.step__lead');
      if (lead) {
        const chev = document.createElement('span');
        chev.className = 'step__chev';
        chev.setAttribute('aria-hidden', 'true');
        chev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><path d="M12 5v14M5 12h14"/></svg>';
        lead.appendChild(chev);
      }

      step.setAttribute('role', 'button');
      step.setAttribute('tabindex', '0');
      step.setAttribute('aria-expanded', 'false');
      const toggle = () => {
        const isOpen = step.hasAttribute('data-open');
        if (isOpen) {
          step.removeAttribute('data-open');
          step.setAttribute('aria-expanded', 'false');
        } else {
          step.setAttribute('data-open', '');
          step.setAttribute('aria-expanded', 'true');
        }
      };
      step.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        toggle();
      });
      step.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /* ==========================================================
     MOBILE SCROLL POLISH — bespoke micro-effects driven by --m-scroll
     ========================================================== */
  function initMobileScrollPolish() {
    const root = document.documentElement;
    let ticking = false;
    const updateScrollVar = () => {
      root.style.setProperty('--m-scroll', String(window.scrollY));
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScrollVar);
    }, { passive: true });
    updateScrollVar();
  }

  /* ==========================================================
     MOBILE TOUCH RIPPLE — brass+blue glow follows every tap
     ========================================================== */
  function initMobileTouchRipple() {
    if (!('ontouchstart' in window)) return;
    const onTouch = (e) => {
      const t = e.changedTouches ? e.changedTouches[0] : null;
      if (!t) return;
      const r = document.createElement('span');
      r.className = 'm-touch-ripple';
      r.style.left = t.clientX + 'px';
      r.style.top  = t.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 760);
    };
    document.addEventListener('touchstart', onTouch, { passive: true });
  }

  /* ==========================================================
     MOBILE SECTION-IN-VIEW — adds .is-in-view to <section> on entry
     Powers the brass underline sweep on eyebrows + scale-in headings.
     ========================================================== */
  function initMobileSectionInView() {
    const sections = document.querySelectorAll('section[data-section]');
    if (!sections.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in-view');
        } else if (e.boundingClientRect.top > 0) {
          // Section scrolled off the bottom — reset so it animates again on return
          e.target.classList.remove('is-in-view');
        }
      });
    }, { threshold: 0.18 });
    sections.forEach(s => io.observe(s));
  }

  /* ==========================================================
     MOBILE CASTLING — IntersectionObserver one-shot (unused — fade-up handles it)
     ========================================================== */
  function initMobileCastlingIO() {
    const section = document.querySelector('.castling');
    const cKing = document.querySelector('[data-castling-king]');
    const cRook = document.querySelector('[data-castling-rook]');
    const cCap  = document.querySelector('[data-castling-caption]');
    if (!section || !cKing || !cRook) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        io.unobserve(section);
        gsap.set([cKing, cRook], { clearProps: 'x' });
        const kRect = cKing.getBoundingClientRect();
        const rRect = cRook.getBoundingClientRect();
        const dx = (rRect.left + rRect.width / 2) - (kRect.left + kRect.width / 2);
        const tl = gsap.timeline();
        tl.to(cKing, { x: dx * 0.5,  duration: 0.9, ease: 'power2.inOut' }, 0)
          .to(cRook, { x: -dx * 0.5, duration: 0.9, ease: 'power2.inOut' }, 0);
        if (cCap) tl.to(cCap, { opacity: 1, y: 0, duration: 0.6 }, 0.7);
      });
    }, { threshold: 0.4 });
    io.observe(section);
  }

  /* ==========================================================
     MOBILE PROBLEM — IO-triggered auto-cycling statements
     ========================================================== */
  function initMobileProblemCycle() {
    const section    = document.querySelector('.problem');
    const statements = Array.from(document.querySelectorAll('.problem__statement'));
    const bars       = Array.from(document.querySelectorAll('.problem__progress .bar'));
    if (!section || !statements.length) return;
    let idx = 0, timer = null;
    const showStatement = (i) => {
      statements.forEach((s, j) => s.classList.toggle('is-active', j === i));
      bars.forEach((b, j) => b.classList.toggle('is-active', j <= i));
    };
    showStatement(0);
    const startCycle = () => {
      if (timer) return;
      timer = setInterval(() => { idx = (idx + 1) % statements.length; showStatement(idx); }, 2500);
    };
    const stopCycle = () => {
      if (timer) { clearInterval(timer); timer = null; }
      idx = 0; showStatement(0);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) startCycle(); else stopCycle(); });
    }, { threshold: 0.5 });
    io.observe(section);
  }

  function initLightFades() {
    // Include hero__rook-wrap so the rook fades in too
    gsap.from('[data-fade], .hero__title, .hero__lead, .hero__ctas, .hero__eyebrow, .hero__rook-wrap', {
      opacity: 0, y: 20, duration: 0.85, ease: 'power2.out', stagger: 0.07,
    });
  }

  function initLightScroll() {
    // Section element reveals — castling__caption handled separately by initCastling()
    const targets = document.querySelectorAll(
      '[data-reveal], [data-stack], .why-cell, .step, .svc-card'
    );
    targets.forEach(el => {
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => {
          gsap.fromTo(el,
            { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', clearProps: 'transform' }
          );
        },
      });
    });

    // Section headings
    gsap.utils.toArray('.services__head, .process__head, .why__head').forEach(el => {
      gsap.from(el, {
        opacity: 0, y: 32, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  /* ==========================================================
     MOBILE PROBLEM — pinned statement cycling (same as desktop)
     ========================================================== */
  function initMobileProblem() {
    const problemSection = document.querySelector('.problem');
    const statements = gsap.utils.toArray('.problem__statement');
    const bars = gsap.utils.toArray('.problem__progress .bar');
    if (!problemSection || !statements.length) return;

    // Each statement gets ~280px of scroll travel + 200px lead-out
    const total = 280 * statements.length + 200;
    ScrollTrigger.create({
      trigger: problemSection,
      start: 'top top',
      end: `+=${total}`,
      pin: '.problem__sticky',
      pinSpacing: true,
      scrub: 0.5,
      onUpdate: self => {
        const idx = Math.min(statements.length - 1, Math.floor(self.progress * statements.length));
        statements.forEach((s, i) => s.classList.toggle('is-active', i === idx));
        bars.forEach((b, i) => b.classList.toggle('is-active', i <= idx));
      },
    });
  }

  /* ==========================================================
     MOBILE PROCESS — sticky stacked cards with scale-down
     ========================================================== */
  function initMobileProcess() {
    const steps = gsap.utils.toArray('.step');
    if (steps.length < 2) return;
    steps.forEach((step, i, arr) => {
      if (i === arr.length - 1) return;
      gsap.to(step, {
        scale: 0.94, opacity: 0.5, yPercent: -2,
        transformOrigin: 'top center', ease: 'none',
        scrollTrigger: {
          trigger: arr[i + 1],
          start: 'top 82%',
          end: 'top 28%',
          scrub: true,
        },
      });
    });
  }

  /* ==========================================================
     CASTLING — shared across all tiers
     ========================================================== */
  function initCastling() {
    const castlingSection = document.querySelector('.castling');
    const castlingStage   = document.querySelector('[data-castling-stage]');
    const cKing = document.querySelector('[data-castling-king]');
    const cRook = document.querySelector('[data-castling-rook]');
    const tKing = document.querySelector('[data-castling-trail-king]');
    const tRook = document.querySelector('[data-castling-trail-rook]');
    const cCap  = document.querySelector('[data-castling-caption]');
    if (!castlingStage || !cKing || !cRook || !castlingSection) return;

    const getDx = () => {
      gsap.set([cKing, cRook], { clearProps: 'x' });
      const kRect = cKing.getBoundingClientRect();
      const rRect = cRook.getBoundingClientRect();
      return (rRect.left + rRect.width / 2) - (kRect.left + kRect.width / 2);
    };

    const castlingTL = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    castlingTL
      .to(cKing, { x: () => getDx(),  duration: 1.2 }, 0)
      .to(cRook, { x: () => -getDx(), duration: 1.2 }, 0);
    if (tKing) castlingTL.to(tKing, { scaleX: 1, opacity: 0.35, duration: 1.0 }, 0.05);
    if (tRook) castlingTL.to(tRook, { scaleX: 1, opacity: 0.35, duration: 1.0 }, 0.05);
    if (cCap)  castlingTL.to(cCap,  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.0);

    ScrollTrigger.create({
      trigger: castlingSection,
      start: 'top center',
      end: 'bottom center',
      scrub: 1,
      animation: castlingTL,
      invalidateOnRefresh: true,
    });
  }

  /* ==========================================================
     AMBIENT ORBS — heavy + mobile (fewer on mobile)
     ========================================================== */
  function initAmbientOrbs() {
    document.querySelectorAll('.ambient__orb').forEach((orb, i) => {
      gsap.to(orb, {
        x: `+=${(i % 2 ? 1 : -1) * (60 + i * 20)}`,
        y: `+=${(i % 2 ? -1 : 1) * (50 + i * 18)}`,
        duration: 22 + i * 4, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
    });
  }

  /* ==========================================================
     HEAVY TIER ( >1024px ) — full motion layer
     ========================================================== */
  function initHeroAnimations() {
    // Split-text reveal
    document.querySelectorAll('[data-split]').forEach(el => {
      el.querySelectorAll('.hero__title-line').forEach(line => {
        const words = line.textContent.trim().split(/\s+/);
        line.innerHTML = words.map(w => `<span class="split-word"><span>${w}</span></span>`).join(' ');
      });
    });
    gsap.to('[data-split] .split-word > span', {
      y: 0, duration: 1.0, ease: 'expo.out', stagger: 0.05, delay: 0.1,
    });

    // Hero fade-ins
    gsap.from('[data-fade]', {
      opacity: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.4,
    });

    // Hero mouse parallax
    const heroSection = document.querySelector('.hero');
    const heroTitle   = document.querySelector('.hero__title');
    const heroRook    = document.querySelector('[data-rook]');
    if (heroSection && heroTitle) {
      let raf, tx = 0, ty = 0, cx = 0, cy = 0;
      const loop = () => {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        heroTitle.style.transform = `translate3d(${cx * 0.5}px, ${cy * 0.5}px, 0)`;
        if (heroRook) heroRook.style.setProperty('--mx', `${cx}px`);
        if (heroRook) heroRook.style.setProperty('--my', `${cy}px`);
        raf = (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) ? requestAnimationFrame(loop) : null;
      };
      heroSection.addEventListener('mousemove', e => {
        const r = heroSection.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width  - 0.5) * 40;
        ty = ((e.clientY - r.top)  / r.height - 0.5) * 40;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      heroSection.addEventListener('mouseleave', () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    }

    // Ambient orb drift
    initAmbientOrbs();
  }

  function initScrollAnimations() {
    // Hero parallax layers
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
      gsap.to(el, {
        yPercent: -speed * 50, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    // Trust bar stack
    gsap.utils.toArray('[data-stack]').forEach(el => {
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => el.classList.add('is-in'),
      });
    });

    // Problem — pinned scrub
    const problemSection = document.querySelector('.problem');
    const statements = gsap.utils.toArray('.problem__statement');
    const bars = gsap.utils.toArray('.problem__progress .bar');
    if (problemSection && statements.length) {
      const total = 320 * statements.length + 200;
      ScrollTrigger.create({
        trigger: problemSection,
        start: 'top top', end: `+=${total}`,
        pin: '.problem__sticky', pinSpacing: true, scrub: 0.5,
        onUpdate: self => {
          const idx = Math.min(statements.length - 1, Math.floor(self.progress * statements.length));
          statements.forEach((s, i) => s.classList.toggle('is-active', i === idx));
          bars.forEach((b, i) => b.classList.toggle('is-active', i <= idx));
        },
      });
    }

    // Services — horizontal on vertical
    const track    = document.querySelector('[data-track]');
    const trackWrap = document.querySelector('.services__track-wrap');
    if (track && trackWrap) {
      const dist = () => track.scrollWidth - trackWrap.clientWidth + 64;
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: trackWrap, start: 'top top',
          end: () => `+=${dist()}`,
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        },
      });
    }

    // Process — sticky stack
    gsap.utils.toArray('.step').forEach((step, i, arr) => {
      if (i === arr.length - 1) return;
      gsap.to(step, {
        scale: 0.96, opacity: 0.55, yPercent: -4,
        transformOrigin: 'top center', ease: 'none',
        scrollTrigger: { trigger: arr[i + 1], start: 'top 80%', end: 'top 20%', scrub: true },
      });
    });

    // Castling (shared function)
    initCastling();

    // Why-grid reveal
    gsap.utils.toArray('[data-reveal]').forEach(el => {
      ScrollTrigger.create({
        trigger: el, start: 'top 80%', once: true,
        onEnter: () => el.classList.add('is-in'),
      });
    });

    // Section headings
    gsap.utils.toArray('.services__head, .privileges__head, .process__head, .why__head').forEach(el => {
      gsap.from(el, {
        opacity: 0, y: 30, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    // Privileges — staggered row reveal
    gsap.utils.toArray('.privilege').forEach((row, i) => {
      gsap.from(row, {
        opacity: 0, y: 28, duration: 0.7, ease: 'power3.out',
        delay: i * 0.08,
        scrollTrigger: { trigger: row, start: 'top 88%', once: true },
      });
    });
  }

  /* ---------- Privileges accordion (universal — runs on every tier) ---------- */
  function initPrivileges() {
    const list = document.querySelector('[data-privileges]');
    if (!list) return;
    const rows = Array.from(list.querySelectorAll('.privilege'));
    rows.forEach(row => {
      const head = row.querySelector('.privilege__head');
      if (!head) return;
      head.addEventListener('click', () => {
        const isOpen = row.hasAttribute('data-open');
        // Single-open behaviour: close all, open clicked (unless it was already open)
        rows.forEach(r => {
          r.removeAttribute('data-open');
          const h = r.querySelector('.privilege__head');
          if (h) h.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          row.setAttribute('data-open', '');
          head.setAttribute('aria-expanded', 'true');
        }
        // Nudge ScrollTrigger so pinned sections recalculate on layout shift
        if (window.ScrollTrigger) {
          requestAnimationFrame(() => window.ScrollTrigger.refresh());
        }
      });
    });
  }

  function initParticles() {
    const particlesEl = document.getElementById('particles');
    if (!particlesEl) return;
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top  = (50 + Math.random() * 60) + '%';
      const size = 1 + Math.random() * 2;
      p.style.width = p.style.height = size + 'px';
      particlesEl.appendChild(p);
      gsap.to(p, {
        y: -window.innerHeight * (0.7 + Math.random() * 0.6),
        x: (Math.random() - 0.5) * 120, opacity: 0.7,
        duration: 8 + Math.random() * 10, delay: Math.random() * 6,
        repeat: -1, ease: 'sine.inOut',
        onRepeat: () => { p.style.left = Math.random() * 100 + '%'; gsap.set(p, { y: 0, x: 0 }); },
      });
    }
  }

  function initTilt() {
    if (!window.VanillaTilt) return;
    const els = document.querySelectorAll('[data-tilt]');
    if (els.length) {
      window.VanillaTilt.init(els, {
        max: 12, speed: 600, glare: true, 'max-glare': 0.18,
        perspective: 1200, scale: 1.02, gyroscope: false,
      });
    }
  }

  /* ==========================================================
     FALLBACK — CSS-only IO reveals (no GSAP available)
     ========================================================== */
  function initCSSReveals() {
    const SELECTOR = 'section, .card, .svc-card, .stat-item, .trust__item, .step, .why-cell, .castling__caption, .problem__statement';
    const targets = document.querySelectorAll(SELECTOR);
    if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(el => observer.observe(el));
    // Safety net: anything in the initial viewport that didn't fire IO within 600ms
    setTimeout(() => {
      targets.forEach(el => {
        if (el.classList.contains('is-visible')) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    }, 600);
  }

  /* ---------- Anchor smooth-scroll via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -80 });
      else t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
