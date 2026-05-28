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
      '.svc-card, .step, .why-cell, .trust__item, ' +
      '.castling__caption, .problem__statement, ' +
      '.hero__title, .hero__lead, .hero__eyebrow, .hero__rook-wrap'
    );
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
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
    const scene = document.querySelector('[data-castling-mobile]');
    if (!scene) return;
    const section = scene.closest('.castling');
    const replay = scene.querySelector('[data-castling-replay]');
    let inView = false;
    let progress = 0;
    let manualProgress = null; // when set, overrides scroll-driven (for replay)
    let manualStart = 0;

    const setProg = (p) => {
      progress = Math.max(0, Math.min(1, p));
      scene.style.setProperty('--castle-progress', progress.toFixed(3));
    };

    const update = () => {
      if (manualProgress !== null) {
        const t = (performance.now() - manualStart) / 1400;
        if (t >= 1) {
          setProg(1);
          manualProgress = null;
        } else {
          // ease-in-out cubic
          const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          setProg(e);
        }
        requestAnimationFrame(update);
        return;
      }
      if (!inView) return;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Map scroll: when section top is at 60% vh → progress 0; at -20% vh → progress 1
      const start = vh * 0.6;
      const end   = -vh * 0.2;
      const raw = (start - r.top) / (start - end);
      setProg(raw);
      // Reveal replay button after first full castle
      if (raw >= 0.95 && replay && !replay.classList.contains('is-shown')) {
        replay.classList.add('is-shown');
      }
    };

    // Observe section to gate scroll listener
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        inView = e.isIntersecting;
        if (inView) update();
      });
    }, { threshold: 0, rootMargin: '20% 0px 20% 0px' });
    io.observe(section);

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

    // Initial paint
    update();
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
