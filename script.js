/* =========================================================
   BLUEROOK — Motion layer
   - Lenis (smooth scroll)
   - GSAP + ScrollTrigger (named patterns)
   - VanillaTilt (3D cards)
   - Splittext + parallax + particles
   ========================================================= */

(() => {
  const prefersReduced =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  const motionOff = prefersReduced || isMobile;

  /* ---------- 1. Lenis smooth scroll ---------- */
  let lenis = null;
  if (!motionOff && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- 2. GSAP + ScrollTrigger setup ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    // Recompute pin positions once webfonts finish swapping — without this,
    // pins computed at load time can be off by 50-100px once Fraunces lands.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- 3. Nav scroll state ---------- */
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 3a. Theme toggle (navy ↔ very dark) ---------- */
  const THEME_KEY = 'bluerook-theme';
  const body = document.body;
  const themeBtn = document.querySelector('[data-theme-toggle]');

  const applyTheme = (theme) => {
    if (theme === 'very-dark') {
      body.classList.add('theme-very-dark');
      body.setAttribute('data-theme', 'very-dark');
    } else {
      body.classList.remove('theme-very-dark');
      body.setAttribute('data-theme', 'navy');
    }
    if (themeBtn) themeBtn.setAttribute('aria-pressed', theme === 'very-dark');
  };

  applyTheme(localStorage.getItem(THEME_KEY) || 'navy');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = body.classList.contains('theme-very-dark') ? 'navy' : 'very-dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ---------- 3b. Ambient cursor glow ---------- */
  const cursorGlow = document.querySelector('[data-cursor-glow]');
  if (cursorGlow && !('ontouchstart' in window)) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cmx = mx, cmy = my;
    let cursorRaf = null;
    const cursorLoop = () => {
      cmx += (mx - cmx) * 0.12;
      cmy += (my - cmy) * 0.12;
      cursorGlow.style.setProperty('--mx', cmx + 'px');
      cursorGlow.style.setProperty('--my', cmy + 'px');
      if (Math.abs(mx - cmx) > 0.5 || Math.abs(my - cmy) > 0.5) {
        cursorRaf = requestAnimationFrame(cursorLoop);
      } else {
        cursorRaf = null;
      }
    };
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorLoop);
    }, { passive: true });
  }

  // Heavy effects (mouse parallax, particles, orb drift, services horizontal pin)
  // are gated individually below — we do NOT bail the whole script here, because
  // ScrollTriggers for splittext, fades, problem pin, sticky-stack, etc. should
  // still run on tablets and narrow desktops.
  if (prefersReduced) return; // honour reduced-motion fully

  /* ---------- 3c. Ambient orb drift (slow, GPU-cheap) ---------- */
  if (!isMobile) document.querySelectorAll('.ambient__orb').forEach((orb, i) => {
    gsap.to(orb, {
      x: `+=${(i % 2 ? 1 : -1) * (60 + i * 20)}`,
      y: `+=${(i % 2 ? -1 : 1) * (50 + i * 18)}`,
      duration: 22 + i * 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  });

  /* ---------- 4. Split-text reveal (headline) ---------- */
  const splitTargets = document.querySelectorAll('[data-split]');
  splitTargets.forEach((el) => {
    el.querySelectorAll('.hero__title-line').forEach((line) => {
      const words = line.textContent.trim().split(/\s+/);
      line.innerHTML = words
        .map((w) => `<span class="split-word"><span>${w}</span></span>`)
        .join(' ');
    });
  });

  // Animate words in — pixel y so GSAP reads matrix-parsed start (from CSS
  // translateY(110%)) and tweens cleanly to y:0
  gsap.to('[data-split] .split-word > span', {
    y: 0,
    duration: 1.0,
    ease: 'expo.out',
    stagger: 0.05,
    delay: 0.2,
  });

  /* ---------- 5. Hero fade-ins ---------- */
  gsap.from('[data-fade]', {
    opacity: 0,
    y: 24,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.5,
  });

  /* ---------- 6. Hero parallax (background, logo, headline) ---------- */
  const parallaxLayers = document.querySelectorAll('[data-parallax]');
  parallaxLayers.forEach((el) => {
    const speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
    gsap.to(el, {
      yPercent: -speed * 50, // 0.1→-5%, 0.3→-15%, 0.6→-30%
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  /* ---------- 7. Hero mouse parallax on headline (desktop only) ---------- */
  const heroSection = document.querySelector('.hero');
  const heroTitle   = document.querySelector('.hero__title');
  const heroRook    = document.querySelector('[data-rook]');
  if (heroSection && heroTitle && !isMobile) {
    let raf;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    heroSection.addEventListener('mousemove', (e) => {
      const r = heroSection.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5; // -0.5..0.5
      const py = (e.clientY - r.top)  / r.height - 0.5;
      tx = px * 40; ty = py * 40; // 20px each direction
      if (!raf) raf = requestAnimationFrame(loop);
    });
    heroSection.addEventListener('mouseleave', () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      heroTitle.style.transform = `translate3d(${cx * 0.5}px, ${cy * 0.5}px, 0)`;
      if (heroRook) heroRook.style.setProperty('--mx', `${cx}px`);
      if (heroRook) heroRook.style.setProperty('--my', `${cy}px`);
      if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    };
  }

  /* ---------- 8. Gold particle drift (desktop only) ---------- */
  const particlesEl = document.getElementById('particles');
  if (particlesEl && !isMobile) {
    const COUNT = 10;
    for (let i = 0; i < COUNT; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top  = (50 + Math.random() * 60) + '%';
      const size = 1 + Math.random() * 2;
      p.style.width = p.style.height = size + 'px';
      particlesEl.appendChild(p);

      gsap.to(p, {
        y: -window.innerHeight * (0.7 + Math.random() * 0.6),
        x: (Math.random() - 0.5) * 120,
        opacity: 0.7,
        duration: 8 + Math.random() * 10,
        delay: Math.random() * 6,
        repeat: -1,
        ease: 'sine.inOut',
        onRepeat: () => {
          p.style.left = Math.random() * 100 + '%';
          gsap.set(p, { y: 0, x: 0 });
        },
      });
    }
  }

  /* ---------- 9. Trust bar sticky-stack fade-in ---------- */
  gsap.utils.toArray('[data-stack]').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => el.classList.add('is-in'),
      once: true,
    });
  });

  /* ---------- 10. Problem section — pinned-scrub ---------- */
  const problemSection = document.querySelector('.problem');
  const statements    = gsap.utils.toArray('.problem__statement');
  const bars          = gsap.utils.toArray('.problem__progress .bar');
  if (problemSection && statements.length) {
    // Each statement holds for ~300px of scroll → total = statements * 300 + buffer
    const SCROLL_PER_STMT = 320;
    const totalScroll = SCROLL_PER_STMT * statements.length + 200;

    ScrollTrigger.create({
      trigger: problemSection,
      start: 'top top',
      end: `+=${totalScroll}`,
      pin: '.problem__sticky',
      pinSpacing: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const idx = Math.min(
          statements.length - 1,
          Math.floor(self.progress * statements.length)
        );
        statements.forEach((s, i) => s.classList.toggle('is-active', i === idx));
        bars.forEach((b, i) => b.classList.toggle('is-active', i <= idx));
      },
    });
  }

  /* ---------- 11. Services — horizontal-on-vertical ---------- */
  const servicesSection = document.querySelector('.services');
  const track           = document.querySelector('[data-track]');
  const trackWrap       = document.querySelector('.services__track-wrap');

  if (servicesSection && track && trackWrap && window.innerWidth > 720) {
    const computeDistance = () => {
      return track.scrollWidth - trackWrap.clientWidth + 64; // small overshoot
    };

    let tween = gsap.to(track, {
      x: () => -computeDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: trackWrap,
        start: 'top top',
        end: () => `+=${computeDistance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  /* ---------- 12. Process — sticky-stack (cards stack & scale) ---------- */
  const steps = gsap.utils.toArray('.step');
  steps.forEach((step, i) => {
    const isLast = i === steps.length - 1;
    if (isLast) return;
    gsap.to(step, {
      scale: 0.96,
      opacity: 0.55,
      yPercent: -4,
      transformOrigin: 'top center',
      ease: 'none',
      scrollTrigger: {
        trigger: steps[i + 1],
        start: 'top 80%',
        end: 'top 20%',
        scrub: true,
      },
    });
  });

  /* ---------- 12b. CASTLING — king ⇄ rook swap timeline ----------
     Fires once when user scrolls ~40% into the castling section. Both pieces
     move simultaneously; gold trails scale from 0→1 along the way; caption
     fades in on complete. Duration 1.2s, ease power2.inOut. */
  const castlingStage = document.querySelector('[data-castling-stage]');
  const castlingKing  = document.querySelector('[data-castling-king]');
  const castlingRook  = document.querySelector('[data-castling-rook]');
  const trailKing     = document.querySelector('[data-castling-trail-king]');
  const trailRook     = document.querySelector('[data-castling-trail-rook]');
  const castlingCap   = document.querySelector('[data-castling-caption]');

  if (castlingStage && castlingKing && castlingRook) {
    const measureSwap = () => {
      const kRect = castlingKing.getBoundingClientRect();
      const rRect = castlingRook.getBoundingClientRect();
      return (rRect.left + rRect.width / 2) - (kRect.left + kRect.width / 2);
    };

    ScrollTrigger.create({
      trigger: castlingStage,
      start: 'top 60%', // ~40% scroll into the section
      once: true,
      onEnter: () => {
        const dx = measureSwap();
        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

        // Pieces swap simultaneously
        tl.to(castlingKing, { x:  dx, duration: 1.2 }, 0)
          .to(castlingRook, { x: -dx, duration: 1.2 }, 0);

        // Trails extend behind each piece during the move
        if (trailKing) tl.to(trailKing, { scaleX: 1, duration: 1.0 }, 0.05);
        if (trailRook) tl.to(trailRook, { scaleX: 1, duration: 1.0 }, 0.05);

        // After the swap, dim the trails so they don't dominate the rest of the page
        tl.to([trailKing, trailRook].filter(Boolean),
              { opacity: 0.35, duration: 0.6, ease: 'power2.out' }, '+=0.1');

        // Caption fades in after castling completes
        if (castlingCap) {
          tl.to(castlingCap,
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
                '-=0.2');
        }
      },
    });
  }

  /* ---------- 13. Why grid reveal ---------- */
  gsap.utils.toArray('[data-reveal]').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => el.classList.add('is-in'),
      once: true,
    });
  });

  /* ---------- 14. Section-head fade for h2's ---------- */
  gsap.utils.toArray('.services__head, .process__head, .why__head').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 30,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  /* ---------- 15. VanillaTilt on service cards ---------- */
  if (window.VanillaTilt) {
    const tiltEls = document.querySelectorAll('[data-tilt]');
    VanillaTilt.init(tiltEls, {
      max: 15,
      speed: 600,
      glare: true,
      'max-glare': 0.2,
      gyroscope: false,
      perspective: 1200,
    });
    // Tint the glare gold via DOM swap
    tiltEls.forEach((el) => {
      const glare = el.querySelector('.js-tilt-glare-inner');
      if (glare) {
        glare.style.background =
          'radial-gradient(circle at 50% 50%, rgba(201,168,76,0.55), rgba(201,168,76,0) 60%)';
      }
    });
  }

  /* ---------- 16. Anchor smooth scroll via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (target && lenis) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -40, duration: 1.2 });
      }
    });
  });

  /* ---------- 17. Refresh on load (font swap can shift layout) ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => ScrollTrigger.refresh(), 100);
  });

})();
