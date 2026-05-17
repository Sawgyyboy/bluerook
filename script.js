/* =========================================================
   BLUEROOK — Motion layer (three-tier architecture)
   - heavy  ( >1024px ): full GSAP + Lenis + ScrollTriggers + particles + tilt
   - light  ( 769–1024 ): Lenis + simple fade-ins only
   - mobile (  ≤768   ): CSS only, no GSAP
   ========================================================= */

(() => {
  const prefersReduced =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = window.innerWidth;

  // Tier selection
  let tier = 'heavy';
  if (W <= 768) tier = 'mobile';
  else if (W <= 1024) tier = 'light';
  if (prefersReduced) tier = 'mobile';

  // Expose tier as a body class for CSS fallbacks (e.g. unhide split words)
  document.body.classList.add('js-' + tier);

  /* ---------- Loading screen fade-out (every tier) ---------- */
  const hideLoader = () => {
    const l = document.querySelector('[data-loader]');
    if (!l) return;
    l.classList.add('is-hidden');
    setTimeout(() => l.remove(), 500);
  };
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);

  /* ---------- Universal: nav scroll state, theme toggle, ambient cursor ---------- */
  initUniversal();

  /* ---------- Lenis smooth scroll on ALL tiers (mobile included) ---------- */
  let lenis = null;
  const startLenis = () => {
    if (!window.Lenis) { setTimeout(startLenis, 60); return; }
    lenis = new window.Lenis({
      duration: tier === 'mobile' ? 0.7 : 1.2,
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

  if (tier === 'mobile') {
    // No GSAP on mobile — CSS-only animations + IntersectionObserver reveals
    initMobileReveals();
    initMobileCastling();
    return;
  }

  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- Staggered init on load ---------- */
  const onLoad = (fn) => {
    if (document.readyState === 'complete') fn();
    else window.addEventListener('load', fn);
  };

  if (tier === 'light') {
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
     UNIVERSAL — runs on every tier (no GSAP cost)
     ========================================================== */
  function initUniversal() {
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

    // Mobile hamburger toggle
    const menuBtn   = document.querySelector('[data-menu-toggle]');
    const menuClose = document.querySelector('[data-menu-close]');
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
        if (mobileMenu.classList.contains('is-open')) closeMenu();
        else openMenu();
      });
      if (menuClose) menuClose.addEventListener('click', closeMenu);
      mobileMenu.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', closeMenu);
      });
      // Close on Escape
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
      });
    }

    // Reveal-on-view (CSS keyframe driven, mobile-safe)
    const revealEls = document.querySelectorAll('.reveal-on-view');
    if (revealEls.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
      revealEls.forEach((el) => io.observe(el));
    }

    // Ambient cursor glow (desktop only — pointer-based)
    const cursorGlow = document.querySelector('[data-cursor-glow]');
    if (cursorGlow && !('ontouchstart' in window) && tier === 'heavy') {
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let cmx = mx, cmy = my;
      let raf = null;
      const loop = () => {
        cmx += (mx - cmx) * 0.12;
        cmy += (my - cmy) * 0.12;
        cursorGlow.style.setProperty('--mx', cmx + 'px');
        cursorGlow.style.setProperty('--my', cmy + 'px');
        if (Math.abs(mx - cmx) > 0.5 || Math.abs(my - cmy) > 0.5) {
          raf = requestAnimationFrame(loop);
        } else { raf = null; }
      };
      window.addEventListener('pointermove', (e) => {
        mx = e.clientX; my = e.clientY;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
    }
  }

  /* ==========================================================
     LIGHT TIER (769–1024px)
     Only simple opacity fades + Lenis. No splittext, particles,
     pins, scrubs, mouse parallax, or tilt.
     ========================================================== */
  function initLightFades() {
    // Hero entrance — fade everything in once
    gsap.from('[data-fade], .hero__title, .hero__lead, .hero__ctas, .hero__eyebrow', {
      opacity: 0, y: 16, duration: 0.7, ease: 'power2.out', stagger: 0.08,
    });
  }

  function initLightScroll() {
    // Section reveals — once on enter, no scrub
    const targets = document.querySelectorAll('[data-reveal], [data-stack], .why-cell, .step, .svc-card, .castling__caption');
    targets.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          el.classList.add('is-in');
          gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
        },
      });
    });
  }

  /* ==========================================================
     HEAVY TIER ( >1024px ) — full motion layer
     ========================================================== */
  function initHeroAnimations() {
    // Split text reveal
    const splitTargets = document.querySelectorAll('[data-split]');
    splitTargets.forEach((el) => {
      el.querySelectorAll('.hero__title-line').forEach((line) => {
        const words = line.textContent.trim().split(/\s+/);
        line.innerHTML = words
          .map((w) => `<span class="split-word"><span>${w}</span></span>`)
          .join(' ');
      });
    });
    gsap.to('[data-split] .split-word > span', {
      y: 0, duration: 1.0, ease: 'expo.out', stagger: 0.05, delay: 0.1,
    });

    // Hero fade-ins
    gsap.from('[data-fade]', {
      opacity: 0, y: 24, duration: 0.9, ease: 'power3.out',
      stagger: 0.12, delay: 0.4,
    });

    // Hero mouse parallax
    const heroSection = document.querySelector('.hero');
    const heroTitle   = document.querySelector('.hero__title');
    const heroRook    = document.querySelector('[data-rook]');
    if (heroSection && heroTitle) {
      let raf, tx = 0, ty = 0, cx = 0, cy = 0;
      const loop = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        heroTitle.style.transform = `translate3d(${cx * 0.5}px, ${cy * 0.5}px, 0)`;
        if (heroRook) heroRook.style.setProperty('--mx', `${cx}px`);
        if (heroRook) heroRook.style.setProperty('--my', `${cy}px`);
        if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) {
          raf = requestAnimationFrame(loop);
        } else { raf = null; }
      };
      heroSection.addEventListener('mousemove', (e) => {
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
    document.querySelectorAll('.ambient__orb').forEach((orb, i) => {
      gsap.to(orb, {
        x: `+=${(i % 2 ? 1 : -1) * (60 + i * 20)}`,
        y: `+=${(i % 2 ? -1 : 1) * (50 + i * 18)}`,
        duration: 22 + i * 4, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
    });
  }

  function initScrollAnimations() {
    // Hero parallax layers
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
      gsap.to(el, {
        yPercent: -speed * 50,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    // Trust bar stack
    gsap.utils.toArray('[data-stack]').forEach((el) => {
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
        onUpdate: (self) => {
          const idx = Math.min(statements.length - 1, Math.floor(self.progress * statements.length));
          statements.forEach((s, i) => s.classList.toggle('is-active', i === idx));
          bars.forEach((b, i) => b.classList.toggle('is-active', i <= idx));
        },
      });
    }

    // Services — horizontal on vertical
    const track = document.querySelector('[data-track]');
    const trackWrap = document.querySelector('.services__track-wrap');
    if (track && trackWrap) {
      const dist = () => track.scrollWidth - trackWrap.clientWidth + 64;
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: trackWrap, start: 'top top',
          end: () => `+=${dist()}`,
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        },
      });
    }

    // Process — sticky stack
    const steps = gsap.utils.toArray('.step');
    steps.forEach((step, i) => {
      if (i === steps.length - 1) return;
      gsap.to(step, {
        scale: 0.96, opacity: 0.55, yPercent: -4,
        transformOrigin: 'top center', ease: 'none',
        scrollTrigger: { trigger: steps[i + 1], start: 'top 80%', end: 'top 20%', scrub: true },
      });
    });

    // CASTLING swap — bidirectional via scrub
    const castlingStage = document.querySelector('[data-castling-stage]');
    const castlingSection = document.querySelector('.castling');
    const cKing = document.querySelector('[data-castling-king]');
    const cRook = document.querySelector('[data-castling-rook]');
    const tKing = document.querySelector('[data-castling-trail-king]');
    const tRook = document.querySelector('[data-castling-trail-rook]');
    const cCap  = document.querySelector('[data-castling-caption]');
    if (castlingStage && cKing && cRook && castlingSection) {
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

    // Why-grid reveal
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 80%', once: true,
        onEnter: () => el.classList.add('is-in'),
      });
    });

    // Section heads
    gsap.utils.toArray('.services__head, .process__head, .why__head').forEach((el) => {
      gsap.from(el, {
        opacity: 0, y: 30, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });
  }

  function initParticles() {
    const particlesEl = document.getElementById('particles');
    if (!particlesEl) return;
    const COUNT = 5;
    for (let i = 0; i < COUNT; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = (50 + Math.random() * 60) + '%';
      const size = 1 + Math.random() * 2;
      p.style.width = p.style.height = size + 'px';
      particlesEl.appendChild(p);
      gsap.to(p, {
        y: -window.innerHeight * (0.7 + Math.random() * 0.6),
        x: (Math.random() - 0.5) * 120,
        opacity: 0.7,
        duration: 8 + Math.random() * 10,
        delay: Math.random() * 6,
        repeat: -1, ease: 'sine.inOut',
        onRepeat: () => {
          p.style.left = Math.random() * 100 + '%';
          gsap.set(p, { y: 0, x: 0 });
        },
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
     MOBILE — IntersectionObserver reveals (CSS only)
     ========================================================== */
  function initMobileReveals() {
    const SELECTOR = 'section, .card, .svc-card, .stat-item, .trust__item, .step, .why-cell, .castling__caption, .problem__statement';
    const targets = document.querySelectorAll(SELECTOR);

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(el => observer.observe(el));

    // Safety net — anything in the initial viewport that didn't fire IO within
    // 600ms (some embeds/headless contexts) gets revealed manually.
    setTimeout(() => {
      targets.forEach(el => {
        if (el.classList.contains('is-visible')) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add('is-visible');
        }
      });
    }, 600);
  }

  function initMobileCastling() {
    if (!('IntersectionObserver' in window)) return;
    const section = document.querySelector('.castling');
    if (!section) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('is-visible');
          io.unobserve(section);
        }
      });
    }, { threshold: 0.4 });
    io.observe(section);
  }

  /* ---------- Anchor smooth-scroll via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -80 });
      else t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
