/* Bluerook — Selected Work (single-scroll showcase)
   Ambient world + scroll choreography + four deterministic, browser-local
   demonstrations. Every record is synthetic; nothing here calls a service. */
(function () {
  'use strict';

  const doc = document;
  const body = doc.body;
  const $  = (s, scope = doc) => scope.querySelector(s);
  const $$ = (s, scope = doc) => Array.from(scope.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced = () => reduce.matches;
  const hasGsap = () => typeof window.gsap !== 'undefined';

  body.classList.add('pf-js');

  const announce = (message) => {
    const region = $('[data-pf-live]');
    if (!region) return;
    region.textContent = '';
    window.setTimeout(() => { region.textContent = message; }, 20);
  };

  const safe = (name, fn) => {
    try { fn(); } catch (error) { console.error(`[Bluerook work] ${name} failed.`, error); }
  };

  /* ═══════════ Feedback primitives ═══════════
     Every control on this site should answer three questions at once:
     what changed, where it changed, and what it means. `toast` carries the
     meaning, `pop`/`wasNow` carry the change, `working` carries the wait. */

  let toastHost = null;
  const toast = (message, tone = '') => {
    announce(message);
    if (!toastHost) {
      toastHost = doc.createElement('div');
      toastHost.className = 'pf-toasts';
      toastHost.setAttribute('aria-hidden', 'true');
      body.append(toastHost);
    }
    const item = doc.createElement('div');
    item.className = `pf-toast${tone ? ` pf-toast--${tone}` : ''}`;
    item.append(doc.createElement('i'), doc.createTextNode(message));
    toastHost.append(item);
    while (toastHost.children.length > 3) toastHost.firstChild.remove();
    window.setTimeout(() => {
      item.classList.add('is-out');
      window.setTimeout(() => item.remove(), 340);
    }, isReduced() ? 2200 : 3400);
  };

  const pop = (el) => {
    if (!el || isReduced()) return;
    el.classList.remove('pf-pop');
    void el.offsetWidth;
    el.classList.add('pf-pop');
    el.addEventListener('animationend', () => el.classList.remove('pf-pop'), { once: true });
  };

  const shake = (el) => {
    if (!el || isReduced()) return;
    el.classList.remove('pf-shake');
    void el.offsetWidth;
    el.classList.add('pf-shake');
    el.addEventListener('animationend', () => el.classList.remove('pf-shake'), { once: true });
  };

  /* Writes a new value and leaves the old one struck through beside it, so a
     change reads as a change rather than as a different screen. */
  const wasNow = (el, next, previous) => {
    if (!el) return;
    el.textContent = next;
    if (previous != null && previous !== next && !isReduced()) {
      const was = doc.createElement('span');
      was.className = 'pf-was';
      was.textContent = previous;
      el.append(was);
      window.setTimeout(() => was.remove(), 2600);
    }
    pop(el);
  };

  /* A short, visible wait. Without one, an instant result reads as "nothing
     happened" — the work has to be legible to be believed. */
  const working = (host, ms, done) => {
    if (!host) { done(); return; }
    if (isReduced()) { done(); return; }
    const bar = doc.createElement('div');
    bar.className = 'pf-working';
    host.prepend(bar);
    window.setTimeout(() => { bar.remove(); done(); }, ms);
  };

  const skeleton = (elements, ms) => {
    if (isReduced()) return;
    elements.filter(Boolean).forEach((el) => el.classList.add('pf-skeleton'));
    window.setTimeout(() => elements.filter(Boolean).forEach((el) => el.classList.remove('pf-skeleton')), ms);
  };

  /* ═══════════ Smooth scroll ═══════════ */
  function initLenis() {
    if (isReduced() || typeof window.Lenis === 'undefined' || window.innerWidth < 900) return;
    const lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9 });
    if (hasGsap()) {
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = $(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -70 });
      });
    });
  }

  /* ═══════════ Ambient orbs + cursor bloom (same system as the main site) ═══════════ */
  function initAmbient() {
    if (hasGsap() && !isReduced()) {
      $$('.ambient__orb').forEach((orb, i) => {
        window.gsap.to(orb, {
          x: `+=${(i % 2 ? 1 : -1) * (60 + i * 20)}`,
          y: `+=${(i % 2 ? -1 : 1) * (50 + i * 18)}`,
          duration: 22 + i * 4, repeat: -1, yoyo: true, ease: 'sine.inOut'
        });
      });
    }

    const glow = $('[data-cursor-glow]');
    if (!glow || 'ontouchstart' in window || isReduced() || window.innerWidth < 1024) return;
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
  }

  /* ═══════════ Hero particles ═══════════ */
  function initParticles() {
    const field = $('[data-pf-particles]');
    if (!field || isReduced()) return;
    const count = window.innerWidth < 760 ? 14 : 30;
    const fragment = doc.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const dot = doc.createElement('span');
      dot.className = 'pf-particle';
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${55 + Math.random() * 45}%`;
      dot.style.setProperty('--dur', `${11 + Math.random() * 12}s`);
      dot.style.setProperty('--delay', `${Math.random() * 12}s`);
      if (Math.random() > 0.72) dot.style.background = 'var(--color-text)';
      fragment.append(dot);
    }
    field.append(fragment);
  }

  /* ═══════════ Hero word entrance ═══════════ */
  function initSplit() {
    const title = $('[data-pf-split]');
    if (!title) return;

    $$('.pf-line', title).forEach((line) => {
      const fragment = doc.createDocumentFragment();
      Array.from(line.childNodes).forEach((node) => {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach((chunk) => {
            if (!chunk.trim()) { fragment.append(doc.createTextNode(chunk)); return; }
            const outer = doc.createElement('span');
            const inner = doc.createElement('span');
            outer.className = 'pf-w';
            inner.textContent = chunk;
            outer.append(inner);
            fragment.append(outer);
          });
        } else {
          const outer = doc.createElement('span');
          const inner = node.cloneNode(true);
          outer.className = 'pf-w';
          outer.append(inner);
          fragment.append(outer);
        }
      });
      line.replaceChildren(fragment);
    });

    const words = $$('.pf-w > span', title);
    if (isReduced() || !hasGsap()) {
      words.forEach((word) => { word.style.transform = 'none'; });
      return;
    }
    window.gsap.to(words, { y: 0, duration: 1.05, ease: 'expo.out', stagger: 0.045, delay: 0.15 });
  }

  /* ═══════════ Scroll reveals ═══════════ */
  function initReveals() {
    const items = $$('[data-pf-fade]');
    if (!items.length) return;
    if (isReduced() || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = $$('[data-pf-fade]', entry.target.parentElement)
          .filter((node) => node.parentElement === entry.target.parentElement);
        const index = Math.max(0, siblings.indexOf(entry.target));
        window.setTimeout(() => entry.target.classList.add('is-in'), Math.min(index, 5) * 85);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach((item) => observer.observe(item));
  }

  /* ═══════════ Statements brighten word by word ═══════════ */
  function initStatements() {
    $$('[data-pf-words]').forEach((statement) => {
      const source = statement.textContent.replace(/\s+/g, ' ').trim();
      const fragment = doc.createDocumentFragment();
      source.split(' ').forEach((word, index, all) => {
        const span = doc.createElement('span');
        span.className = 'pf-word';
        span.textContent = word;
        fragment.append(span);
        if (index < all.length - 1) fragment.append(doc.createTextNode(' '));
      });
      statement.replaceChildren(fragment);

      const words = $$('.pf-word', statement);
      if (isReduced()) { words.forEach((word) => word.classList.add('is-lit')); return; }

      const paint = () => {
        const rect = statement.getBoundingClientRect();
        const start = window.innerHeight * 0.86;
        const end = window.innerHeight * 0.3;
        const progress = (start - rect.top) / Math.max(1, start - end + rect.height * 0.55);
        const lit = Math.round(Math.min(1, Math.max(0, progress)) * words.length);
        words.forEach((word, index) => word.classList.toggle('is-lit', index < lit));
      };
      paint();
      window.addEventListener('scroll', paint, { passive: true });
      window.addEventListener('resize', paint, { passive: true });
    });
  }

  /* ═══════════ Scroll progress ═══════════ */
  function initProgress() {
    const bar = $('[data-pf-progress]');
    if (!bar) return;
    const paint = () => {
      const scrollable = doc.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.setProperty('--pf-p', Math.min(1, Math.max(0, progress)).toFixed(4));
    };
    paint();
    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint, { passive: true });
  }

  /* ═══════════ Marquee (duplicate the track so the loop is seamless) ═══════════ */
  function initMarquee() {
    const track = $('[data-pf-marquee]');
    if (!track) return;
    track.append(...Array.from(track.children).map((child) => child.cloneNode(true)));
  }

  /* ═══════════ Mobile menu ═══════════ */
  function initMenu() {
    const toggle = $('[data-pf-menu-toggle]');
    const menu = $('[data-pf-menu]');
    if (!toggle || !menu) return;
    const close = $('[data-pf-menu-close]', menu);
    let priorFocus = null;

    const setOpen = (open) => {
      menu.hidden = !open;
      menu.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      doc.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) { priorFocus = doc.activeElement; close?.focus(); }
      else if (priorFocus instanceof HTMLElement) priorFocus.focus();
    };

    setOpen(false);
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    close?.addEventListener('click', () => setOpen(false));
    $$('a', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
      if (event.key !== 'Tab' || toggle.getAttribute('aria-expanded') !== 'true') return;
      const focusable = $$('a, button', menu);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  /* ═══════════ Nav shade on scroll ═══════════ */
  function initNav() {
    const nav = $('[data-nav]');
    if (!nav) return;
    const paint = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    paint();
    window.addEventListener('scroll', paint, { passive: true });
  }

  /* ═══════════ 01 · Connected commerce ═══════════ */
  function initSync() {
    const root = $('[data-sync-demo]');
    if (!root) return;
    const range = $('[data-sync-range]', root);
    const value = $('[data-sync-value]', root);
    const apply = $('[data-sync-apply]', root);
    const log = $('[data-sync-log] span', root);
    const surfaces = $$('[data-sync-surface]', root);
    const money = (n) => `$${Number(n).toFixed(2)}`;
    let published = Number(range.value);

    const paintDraft = () => {
      const draft = Number(range.value);
      value.textContent = Number(draft).toFixed(2);
      const dirty = draft !== published;
      surfaces.forEach((surface) => {
        surface.classList.toggle('is-stale', dirty);
        surface.classList.remove('is-synced');
      });
      $('[data-sync-store-state]', root).textContent = dirty ? 'Awaiting approval' : 'Published';
      $('[data-sync-dash-state]', root).textContent = dirty ? 'Draft differs' : 'In sync';
      $('[data-sync-crm-state]', root).textContent = dirty
        ? 'Still answering with the old approved price'
        : 'Answering from approved state';
      if (log) log.textContent = dirty
        ? `Draft ${money(draft)} is not live. Nothing publishes without a person.`
        : 'Every surface matches the approved price.';
    };

    const publish = () => {
      published = Number(range.value);
      ['store', 'dash', 'crm'].forEach((key, index) => {
        window.setTimeout(() => {
          $(`[data-sync-${key}]`, root).textContent = money(published);
          const surface = $(`[data-sync-surface="${key}"]`, root);
          surface.classList.remove('is-stale');
          surface.classList.add('is-synced');
          window.setTimeout(() => surface.classList.remove('is-synced'), 900);
        }, isReduced() ? 0 : index * 220);
      });
      window.setTimeout(() => {
        paintDraft();
        if (log) log.textContent = `Approved ${money(published)} reached storefront, dashboard and support record.`;
      }, isReduced() ? 10 : 700);
      announce(`Price ${money(published)} approved and synchronized across three synthetic surfaces.`);
    };

    range.addEventListener('input', paintDraft);
    apply.addEventListener('click', publish);
    paintDraft();
  }

  /* ═══════════ 02 · Enrollment journey ═══════════ */
  function initJourney() {
    const root = $('[data-journey-demo]');
    if (!root) return;
    const steps = $$('[data-journey-step]', root);
    const stage = $('[data-journey-stage]', root);
    const owner = $('[data-journey-owner]', root);
    const next = $('[data-journey-next]', root);
    const advance = $('[data-journey-next-btn]', root);
    const reset = $('[data-journey-reset]', root);

    const script = [
      ['Enquiry', 'Unassigned', 'Qualify the enquiry'],
      ['Qualified · hot', 'Enrollment desk', 'Offer a trial booking'],
      ['Record created', 'Enrollment desk', 'Hold a weekend session'],
      ['Trial booked', 'Enrollment desk', 'Confirm attendance'],
      ['Human review', 'Customer care lead', 'A person answers the payment question']
    ];
    let index = 0;

    const paint = () => {
      steps.forEach((step, i) => {
        step.classList.toggle('is-done', i < index);
        step.classList.toggle('is-live', i === index);
        step.classList.toggle('is-human', i === 4);
      });
      const [s, o, n] = script[index];
      stage.textContent = s;
      owner.textContent = o;
      next.textContent = n;
      advance.textContent = index >= script.length - 1 ? 'Replay' : 'Advance';
    };

    advance.addEventListener('click', () => {
      index = index >= script.length - 1 ? 0 : index + 1;
      paint();
      announce(`${script[index][0]}. Owner ${script[index][1]}.`);
    });
    reset.addEventListener('click', () => { index = 0; paint(); announce('Synthetic lead reset.'); });
    paint();
  }

  /* ═══════════ 03 · Workflow integrity ═══════════ */
  function initFlow() {
    const root = $('[data-flow-demo]');
    if (!root) return;
    const track = $('[data-flow-track]', root);
    const nodes = $$('[data-flow-node]', root);
    const recovery = $('[data-flow-recovery]', root);
    const log = $('[data-flow-log] span', root);
    const breakBtn = $('[data-flow-break]', root);
    const resetBtn = $('[data-flow-reset]', root);

    const detail = [
      'Receives the prepared record. No production system is connected.',
      'Rejects unusable input before any rule runs.',
      'Deterministic rules only. Ambiguity is never guessed.',
      'A person approves anything sensitive or irreversible.',
      'Owner, outcome and next action are written down.'
    ];

    const pick = (node) => {
      nodes.forEach((candidate) => {
        candidate.classList.toggle('is-picked', candidate === node);
        candidate.setAttribute('aria-pressed', String(candidate === node));
      });
      if (log) log.textContent = detail[Number(node.dataset.flowNode)] || '';
    };

    nodes.forEach((node, i) => {
      node.setAttribute('aria-pressed', 'false');
      node.addEventListener('click', () => pick(node));
      node.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let target = i;
        if (event.key === 'ArrowLeft') target = (i - 1 + nodes.length) % nodes.length;
        if (event.key === 'ArrowRight') target = (i + 1) % nodes.length;
        if (event.key === 'Home') target = 0;
        if (event.key === 'End') target = nodes.length - 1;
        nodes[target].focus();
        pick(nodes[target]);
      });
    });

    breakBtn.addEventListener('click', () => {
      track.classList.add('is-broken');
      recovery.hidden = false;
      if (log) log.textContent = 'Rule step failed. Retry checked, work queued, owner alerted, exception logged. Nothing was lost.';
      announce('Workflow failure simulated. The recovery path is displayed.');
    });

    resetBtn.addEventListener('click', () => {
      track.classList.remove('is-broken');
      recovery.hidden = true;
      nodes.forEach((node) => { node.classList.remove('is-picked'); node.setAttribute('aria-pressed', 'false'); });
      if (log) log.textContent = 'Workflow healthy. Current is flowing.';
      announce('Workflow restored.');
    });
  }

  /* ═══════════ 04 · Follow-up recovery ═══════════ */
  function initScan() {
    const root = $('[data-scan-demo]');
    if (!root) return;
    const rows = $$('[data-scan-row]', root);
    const count = $('[data-scan-count]', root);
    const healthy = $('[data-scan-healthy]', root);
    const run = $('[data-scan-run]', root);
    const reset = $('[data-scan-reset]', root);
    let token = 0;

    const clear = () => {
      token += 1;
      rows.forEach((row) => {
        row.classList.remove('is-scanning', 'is-flagged', 'is-healthy');
        $('[data-scan-result]', row).textContent = 'Awaiting scan';
      });
      count.textContent = '0';
      healthy.textContent = '0';
      run.disabled = false;
    };

    run.addEventListener('click', () => {
      token += 1;
      const active = token;
      let flagged = 0;
      let excluded = 0;
      run.disabled = true;
      rows.forEach((row) => {
        row.classList.remove('is-flagged', 'is-healthy');
        $('[data-scan-result]', row).textContent = 'Awaiting scan';
      });

      rows.forEach((row, i) => {
        const step = isReduced() ? 0 : i * 260;
        window.setTimeout(() => {
          if (active !== token) return;
          row.classList.add('is-scanning');
          window.setTimeout(() => {
            if (active !== token) return;
            row.classList.remove('is-scanning');
            const result = $('[data-scan-result]', row);
            if (row.dataset.healthy) {
              row.classList.add('is-healthy');
              result.textContent = 'Excluded · owner and next action current';
              excluded += 1;
              healthy.textContent = String(excluded);
            } else {
              row.classList.add('is-flagged');
              result.textContent = `Flagged · ${row.dataset.gap}`;
              flagged += 1;
              count.textContent = String(flagged);
            }
            if (i === rows.length - 1) {
              run.disabled = false;
              announce(`${flagged} gaps flagged. ${excluded} healthy record excluded. No message was sent.`);
            }
          }, isReduced() ? 0 : 190);
        }, step);
      });
    });

    reset.addEventListener('click', () => { clear(); announce('Scan reset.'); });
  }

  /* ═══════════ LIVE · speed to lead ═══════════
     The only part of this page that reaches a real service. Both channels are
     visitor-initiated and consent-gated, and neither collects a phone number:
     WhatsApp is a deep link the visitor sends themselves, and the voice channel
     is a browser call where the microphone prompt is the consent. */
  const WHATSAPP_NUMBER = '447716623966';
  const WHATSAPP_TEXT = 'Hi Bluerook — I just came from the portfolio and want to test the speed-to-lead system.';

  function initClock() {
    const face = $('[data-clock-face]');
    const note = $('[data-clock-note]');
    const steps = $$('[data-clock-step]');
    if (!face) return null;

    let started = 0;
    let timer = 0;

    const paint = () => {
      const elapsed = Date.now() - started;
      const m = String(Math.floor(elapsed / 60000)).padStart(2, '0');
      const s = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
      face.textContent = `${m}:${s}`;
    };

    return {
      start(label) {
        if (started) return;
        started = Date.now();
        face.classList.add('is-running');
        steps[0]?.classList.add('is-done');
        if (note) note.textContent = `${label} · clock running.`;
        paint();
        timer = window.setInterval(paint, 500);
      },
      step(index, message) {
        steps[index]?.classList.add('is-done');
        if (note && message) if (note) note.textContent = message;
      },
      stop(message) {
        window.clearInterval(timer);
        face.classList.remove('is-running');
        if (note && message) if (note) note.textContent = message;
      }
    };
  }

  function initLiveChannels() {
    const clock = initClock();

    /* --- WhatsApp: a deep link the visitor sends themselves --- */
    const waCard = $('[data-wa-card]');
    if (waCard) {
      const consent = $('[data-wa-consent]', waCard);
      const go = $('[data-wa-go]', waCard);
      // The note may sit outside the card in some layouts; fall back to page scope.
      const note = $('[data-wa-note]', waCard) || $('[data-wa-note]');
      const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;

      const sync = () => {
        const ok = consent.checked;
        go.setAttribute('aria-disabled', String(!ok));
        waCard.classList.toggle('is-armed', ok);
        if (ok) {
          go.href = href;
          if (note) note.textContent = 'Opens WhatsApp with the message ready. You choose whether to send it.';
        } else {
          go.href = '#try';
          if (note) note.textContent = 'Tick the box to enable this channel.';
        }
      };

      consent.addEventListener('change', sync);
      go.addEventListener('click', (event) => {
        if (go.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
        waCard.classList.add('is-running');
        clock?.start('WhatsApp opened');
        clock?.step(1, 'Message handed to WhatsApp. Send it and the reply lands on this number.');
        announce('WhatsApp opened with a prepared message. Nothing was sent for you.');
      });
      sync();
    }

    /* --- Speed to lead: the system calls the visitor back --- */
    const stlCard = $('[data-stl-card]');
    if (stlCard) {
      const form = stlCard.matches('[data-stl-form]') ? stlCard : $('[data-stl-form]', stlCard);
      const nameField = $('[data-stl-name]', stlCard);
      const phoneField = $('[data-stl-phone]', stlCard);
      /* Consent is no longer a checkbox that gates the form: requesting the
         call is the consent, and the button and the line beneath it say so.
         The checkbox that remains asks for something genuinely optional. */
      const wantsWhatsapp = $('[data-stl-whatsapp]', stlCard);
      const go = $('[data-stl-go]', stlCard);
      const label = $('[data-stl-label]', stlCard);
      const note = $('[data-stl-note]', stlCard) || $('[data-stl-note]');
      let sent = false;

      const validPhone = () => /^\+[1-9][\d\s()\-.]{7,20}$/.test(phoneField.value.trim());

      const sync = () => {
        if (sent) return;
        const ready = nameField.value.trim().length > 0 && validPhone();
        go.disabled = !ready;
        stlCard.classList.toggle('is-armed', ready);
        if (!ready) {
          if (note) note.textContent = !validPhone() && phoneField.value.trim()
            ? 'Include the country code, for example +44 7700 900123.'
            : 'Add your name and mobile to enable the call.';
        } else {
          if (note) note.textContent = 'Ready. The agent will dial this number once.';
        }
      };

      [nameField, phoneField].forEach((field) => field.addEventListener('input', sync));
      wantsWhatsapp?.addEventListener('change', () => {
        if (!note || go.disabled) return;
        note.textContent = wantsWhatsapp.checked
          ? 'Ready. The agent will dial once, and your WhatsApp preference travels with the request.'
          : 'Ready. The agent will dial this number once.';
      });

      const failures = {
        consent_required: 'Consent is required before any call is placed.',
        invalid_number: 'That number was not accepted. Use the full international format.',
        number_already_called: 'This number has already been called today. That limit is deliberate.',
        too_many_requests: 'Give it a moment before trying again.',
        daily_cap_reached: 'The demo has hit its daily call limit. Book a call instead and we will talk properly.',
        speed_to_lead_unconfigured: 'The outbound channel is not switched on for this environment yet.'
      };

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (go.disabled || sent) return;

        go.disabled = true;
        label.textContent = 'Placing the call…';
        if (note) note.textContent = 'Recording the lead and handing it to the agent.';
        clock?.start('Intent captured');
        clock?.step(1, 'Lead recorded. Handing to the agent.');

        try {
          const response = await fetch('/api/create-phone-call', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              name: nameField.value.trim(),
              phone: phoneField.value.trim(),
              // Submitting the form is the consent; the copy beside the button
              // states it in the words the visitor is agreeing to.
              consent: true,
              // Preference travels with the request. api/create-phone-call.js
              // currently ignores it — wire it there before the UI promises a
              // message rather than a recorded preference.
              whatsappFollowUp: Boolean(wantsWhatsapp && wantsWhatsapp.checked)
            })
          });

          const payload = await response.json().catch(() => ({}));

          if (!response.ok) {
            const message = failures[payload.error] || 'The call could not be placed. Book a call and we will speak directly.';
            if (note) note.textContent = message;
            clock?.stop('Call not placed.');
            label.textContent = 'Call me now';
            go.disabled = false;
            announce(message);
            return;
          }

          sent = true;
          stlCard.classList.add('is-running');
          label.textContent = 'Calling you now';
          if (note) note.textContent = 'Answer your phone. That number is now on a one-call-per-day limit.';
          clock?.step(2, 'Agent dialling. This is the gap that matters.');
          announce('The agent is calling you now.');
        } catch (error) {
          console.error('[Bluerook speed-to-lead] request failed.', error);
          if (note) note.textContent = 'The outbound channel is unreachable from here. Try WhatsApp, or book a call.';
          clock?.stop('Outbound channel unreachable.');
          label.textContent = 'Call me now';
          go.disabled = false;
        }
      });

      sync();
    }

    /* --- Voice: browser call with Arden --- */
    const callCard = $('[data-call-card]');
    if (!callCard) return;
    const consent = $('[data-call-consent]', callCard);
    const go = $('[data-call-go]', callCard);
    const label = $('[data-call-label]', callCard);
    const note = $('[data-call-note]', callCard) || $('[data-call-note]');
    let client = null;
    let live = false;

    const setNote = (message) => { if (note) note.textContent = message; };

    const sync = () => {
      go.disabled = !consent.checked && !live;
      callCard.classList.toggle('is-armed', consent.checked && !live);
      if (!live) setNote(consent.checked
        ? 'Your browser will ask for microphone access when you start.'
        : 'Tick the box to enable this channel.');
    };
    consent.addEventListener('change', sync);

    const endCall = async () => {
      try { await client?.stopCall?.(); } catch (_) { /* already closed */ }
      client = null;
      live = false;
      callCard.classList.remove('is-running');
      label.textContent = 'Start the call';
      go.disabled = !consent.checked;
      clock?.stop('Call ended. Nothing from it was stored on this page.');
      announce('Call ended.');
    };

    go.addEventListener('click', async () => {
      if (live) { endCall(); return; }
      if (!consent.checked) return;

      go.disabled = true;
      label.textContent = 'Connecting…';
      setNote('Requesting a call token.');
      clock?.start('Voice channel opened');

      try {
        const response = await fetch('/api/create-web-call', { method: 'POST' });
        if (response.status === 503) {
          setNote('The voice channel is not configured on this environment yet. Try WhatsApp, or book a call.');
          clock?.stop('Voice channel unavailable here.');
          label.textContent = 'Start the call';
          go.disabled = false;
          return;
        }
        if (!response.ok) throw new Error(`token request failed: ${response.status}`);
        const { accessToken } = await response.json();
        if (!accessToken) throw new Error('no access token');

        clock?.step(1, 'Token issued. Connecting the audio channel.');
        setNote('Allow microphone access to begin.');

        const { RetellWebClient } = await import('https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.5/+esm');
        client = new RetellWebClient();

        client.on('call_started', () => {
          live = true;
          callCard.classList.add('is-running');
          label.textContent = 'End the call';
          go.disabled = false;
          clock?.step(2, 'Arden is answering. Speak normally.');
          setNote('Live. Say what your operational bottleneck is.');
          announce('Call connected. Arden is listening.');
        });
        client.on('call_ended', endCall);
        client.on('error', () => {
          setNote('The call dropped. You can start another, or book a call instead.');
          endCall();
        });

        await client.startCall({ accessToken });
      } catch (error) {
        console.error('[Bluerook live] voice channel failed.', error);
        setNote('The voice channel could not start. Try WhatsApp, or book a call.');
        clock?.stop('Voice channel could not start.');
        label.textContent = 'Start the call';
        live = false;
        go.disabled = !consent.checked;
      }
    });

    window.addEventListener('pagehide', () => { if (live) endCall(); });
    sync();
  }

  /* ═══════════ Channel 03 · text assistant ═══════════
     Talks to /api/chat, which holds the key server-side. The transcript lives
     in memory only: nothing is written to storage and a reload clears it. */
  function initChat() {
    const root = $('[data-chat]');
    if (!root) return;
    const log = $('[data-chat-log]', root);
    const form = $('[data-chat-form]', root);
    const input = $('[data-chat-input]', root);
    const send = $('[data-chat-send]', root);
    const state = $('[data-chat-state]', root);
    const note = $('[data-chat-note]', root);

    const history = [];
    let busy = false;

    const bubble = (role, text, variant) => {
      const wrap = doc.createElement('div');
      wrap.className = `pf-msg pf-msg--${role}${variant ? ` pf-msg--${variant}` : ''}`;
      const who = doc.createElement('small');
      who.textContent = role === 'you' ? 'You' : 'Bluerook';
      const body = doc.createElement('p');
      body.textContent = text;
      wrap.append(who, body);
      log.append(wrap);
      log.scrollTop = log.scrollHeight;
      return wrap;
    };

    const thinking = () => {
      const wrap = doc.createElement('div');
      wrap.className = 'pf-msg pf-msg--bot pf-msg--typing';
      const who = doc.createElement('small');
      who.textContent = 'Bluerook';
      const body = doc.createElement('p');
      body.append(doc.createElement('i'), doc.createElement('i'), doc.createElement('i'));
      wrap.append(who, body);
      log.append(wrap);
      log.scrollTop = log.scrollHeight;
      return wrap;
    };

    const setBusy = (value) => {
      busy = value;
      input.disabled = value;
      send.disabled = value;
      if (state) state.textContent = value ? 'Thinking' : 'Ready';
    };

    const goOffline = (message) => {
      root.classList.add('is-offline');
      if (state) state.textContent = 'Offline';
      if (note) note.textContent = message;
      input.disabled = true;
      send.disabled = true;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text || busy) return;

      bubble('you', text);
      history.push({ role: 'user', content: text });
      input.value = '';
      setBusy(true);
      const pending = thinking();

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: history })
        });

        pending.remove();

        if (response.status === 503) {
          bubble('bot', 'The assistant is not switched on for this environment yet. WhatsApp and the voice channel above still work, or book a call.', 'error');
          goOffline('Assistant offline on this environment. The other two channels still work.');
          setBusy(false);
          return;
        }
        if (response.status === 429) {
          bubble('bot', 'One moment between messages, please.', 'error');
          setBusy(false);
          return;
        }
        if (!response.ok) throw new Error(`chat failed: ${response.status}`);

        const { reply } = await response.json();
        if (!reply) throw new Error('empty reply');
        bubble('bot', reply);
        history.push({ role: 'assistant', content: reply });
        announce('The assistant replied.');
      } catch (error) {
        console.error('[Bluerook chat] request failed.', error);
        pending.remove();
        bubble('bot', 'That did not get through. Try again, or reach Hatim directly at hatim@bluerook.co.', 'error');
      } finally {
        setBusy(false);
        if (!input.disabled) input.focus();
      }
    });
  }

  /* ═══════════ Scroll-driven stages ═══════════
     No buttons. The beat that is closest to the reading line drives the
     console, so the demonstration plays as a consequence of scrolling. */
  const STAGE_SCRIPTS = {
    commerce: [
      {
        admin: 'Editing', adminPrice: '$52.00', approval: 'Awaiting',
        store: '$48.00', storeState: 'Live', badge: 'In stock',
        recs: { dash: ['$48.00', 'stale'], crm: ['$48.00', 'stale'], feed: ['$48.00', 'stale'] },
        stream: [['product.price.changed  AV-104  48.00 → 52.00', ''],
                 ['diff.held  reason=requires_approval', 'is-hold']]
      },
      {
        admin: 'Draft held', adminPrice: '$52.00', approval: 'In review',
        store: '$48.00', storeState: 'Live · unchanged', badge: 'In stock',
        recs: { dash: ['$48.00', 'stale'], crm: ['$48.00', 'stale'], feed: ['$48.00', 'stale'] },
        stream: [['approval.requested  owner=commerce_lead', 'is-hold'],
                 ['publish.blocked  surfaces=4  customer_impact=none', '']]
      },
      {
        admin: 'Approved', adminPrice: '$52.00', approval: 'Approved',
        store: '$52.00', storeState: 'Updated', badge: 'In stock',
        recs: { dash: ['$52.00', 'synced'], crm: ['$52.00', 'synced'], feed: ['$52.00', 'synced'] },
        stream: [['approval.granted  by=commerce_lead', 'is-ok'],
                 ['fanout.write  storefront · dashboard · macro · feed', ''],
                 ['surfaces.reconciled  4/4', 'is-ok']]
      },
      {
        admin: 'Recorded', adminPrice: '$52.00', approval: 'Approved',
        store: '$52.00', storeState: 'Live', badge: 'In stock',
        recs: { dash: ['$52.00', 'synced'], crm: ['$52.00', 'synced'], feed: ['$52.00', 'synced'] },
        stream: [['audit.write  actor · approver · delta · timestamp', 'is-ok'],
                 ['state.complete  drift=0', 'is-ok']]
      }
    ]
  };

  /* Each stage declares how a frame is applied, so adding a stage is data plus
     one small applier rather than another scroll implementation. */
  const STAGE_APPLIERS = {
    commerce(console_, frame, $in) {
      const set = (sel, v) => { const el = $in(sel); if (el) el.textContent = v; };
      set('[data-admin-state]', frame.admin);
      set('[data-admin-price]', frame.adminPrice);
      set('[data-approval-pill]', frame.approval);
      set('[data-store-price]', frame.store);
      set('[data-store-state]', frame.storeState);
      set('[data-store-badge]', frame.badge);
      Object.entries(frame.recs).forEach(([key, [value, state]]) => {
        const row = $in(`[data-rec="${key}"]`);
        if (!row) return;
        const cell = $(`[data-rec-${key}]`, row);
        if (cell) cell.textContent = value;
        row.classList.toggle('is-stale', state === 'stale');
        row.classList.toggle('is-synced', state === 'synced');
      });
    },
    enrollment(console_, frame, $in, index) {
      const set = (sel, v) => { const el = $in(sel); if (el) el.textContent = v; };
      set('[data-enr-state]', frame.state);
      set('[data-enr-prog]', frame.prog);
      set('[data-enr-age]', frame.age);
      set('[data-enr-owner]', frame.owner);
      set('[data-enr-next]', frame.next);
      set('[data-enr-cap-state]', frame.capState);
      set('[data-enr-places]', frame.places);
      $$('[data-pipe-node]', console_).forEach((node, i) => {
        node.classList.toggle('is-done', i < index);
        node.classList.toggle('is-live', i === index);
        node.classList.toggle('is-human', i === 3);
      });
      $$('[data-slot]', console_).forEach((slot, i) => {
        slot.classList.toggle('is-held', frame.held === i);
        slot.classList.toggle('is-gone', Array.isArray(frame.gone) && frame.gone.includes(i));
      });
    }
  };

  /* Node/wire highlighting mirrors the real workflow's execution order. The
     hot wires also carry a travelling dash while the branch is executing,
     which is what the real canvas does when you watch a run. */
  STAGE_APPLIERS.workflow = (console_, frame, $in) => {
    $$('[data-node]', console_).forEach((node) => {
      const on = frame.nodes.includes(node.dataset.node);
      node.classList.toggle('is-hot', on);
      node.classList.toggle('is-dim', frame.nodes.length > 0 && !on);
    });
    $$('[data-wire]', console_).forEach((wire) => {
      const on = frame.wires.includes(wire.dataset.wire);
      wire.classList.toggle('is-hot', on);
      wire.classList.toggle('is-running', on && !isReduced());
    });
    const note = $in('[data-legend-note]');
    if (note) note.textContent = frame.note;
  };

  STAGE_SCRIPTS.workflow = [
    { nodes: [], wires: [], note: '11 branches · 10 service calls · 3 record writes',
      stream: [['workflow.loaded  nodes=40  active=true', ''],
               ['surface.note  architecture shown, client identity withheld', 'is-hold']] },
    { nodes: ['trigger', 'validate', 'router'], wires: ['a', 'b'],
      note: 'Validation rejects malformed input before any branch runs',
      stream: [['webhook.received  channel=messaging', ''],
               ['validate.pass  schema ok', 'is-ok'],
               ['route.match  branch=enquiry  confidence=high', 'is-ok']] },
    { nodes: ['router', 'memory', 'agent', 'record', 'respond'], wires: ['c', 'd', 'e', 'f'],
      note: 'Windowed memory + approved knowledge only',
      stream: [['agent.run  memory=window  knowledge=approved', ''],
               ['agent.reply  grounded  no price quoted', 'is-ok'],
               ['record.write  contact · intent · outcome', 'is-ok']] },
    { nodes: ['router', 'human'], wires: ['g'],
      note: 'Designed exit — context travels with the handoff',
      stream: [['confidence.low  intent=payment_issue', 'is-hold'],
               ['automation.stop  reason=requires_judgement', 'is-hold'],
               ['queue.push  owner assigned  full context attached', 'is-ok']] }
  ];

  /* Renders a terminal transcript into a tool-term body. */
  const renderTerm = (host, lines, caret = true) => {
    if (!host) return;
    host.replaceChildren();
    lines.forEach(([text, cls], i) => {
      const line = doc.createElement('span');
      line.className = 'tool-term__line' + (cls ? ` ${cls}` : '');
      line.style.animationDelay = `${i * 55}ms`;
      line.textContent = text;
      host.append(line);
    });
    if (caret) {
      const c = doc.createElement('span');
      c.className = 'tool-term__line tool-term__caret';
      c.textContent = '▍';
      host.append(c);
    }
  };

  /* ---- Technical: signal trace ---- */
  STAGE_APPLIERS.trace = (console_, frame, $in) => {
    $$('[data-trace-node]', console_).forEach((node, i) => {
      node.classList.toggle('is-on', i <= frame.reached);
      node.classList.toggle('is-live', i === frame.reached);
    });
    renderTerm($in('[data-trace-term]'), frame.term);
  };

  STAGE_SCRIPTS.trace = [
    { reached: 0,
      term: [['trace signal --id 4f2a', ''],
             ['source     web_form', 'is-out'],
             ['received   21:40:07', 'is-out'],
             ['session    traced end-to-end', 'is-ok']],
      stream: [['signal.received  source recorded', 'is-ok']] },
    { reached: 1,
      term: [['trace signal --id 4f2a --rules', ''],
             ['schema     valid', 'is-ok'],
             ['branches   11 available', 'is-out'],
             ['selected   enquiry  (confidence high)', 'is-ok']],
      stream: [['moves.legal  decided before execution', 'is-ok']] },
    { reached: 2,
      term: [['trace signal --id 4f2a --gates', ''],
             ['gate       requires_judgement', 'is-warn'],
             ['approver   named  (not a role)', 'is-out'],
             ['automation paused pending decision', 'is-warn']],
      stream: [['gate.reached  requires_judgement', 'is-hold']] },
    { reached: 3,
      term: [['trace signal --id 4f2a --final', ''],
             ['owner      assigned', 'is-ok'],
             ['next       written', 'is-ok'],
             ['outcome    recorded  · drift 0', 'is-ok']],
      stream: [['done  a state, not a feeling', 'is-ok']] }
  ];

  /* ---- Technical: refusals ---- */
  STAGE_APPLIERS.refuse = (console_, frame, $in) => {
    renderTerm($in('[data-refusal-term]'), frame.term);
  };

  STAGE_SCRIPTS.refuse = [
    { term: [['[guard] fabrication', ''],
             ['asked      "what does it cost?"', 'is-out'],
             ['knowledge  no approved price', 'is-warn'],
             ['action     answer withheld · routed to a person', 'is-ok']],
      stream: [['refuse.fabrication  answer withheld', 'is-hold']] },
    { term: [['[guard] permission', ''],
             ['attempt    sms → contact', 'is-out'],
             ['consent    email_only', 'is-warn'],
             ['action     channel blocked · refusal logged', 'is-ok']],
      stream: [['refuse.overreach  sms blocked', 'is-hold']] },
    { term: [['[guard] silent failure', ''],
             ['job        write_record  attempt 1/3', 'is-warn'],
             ['queue      held with full context', 'is-out'],
             ['action     owner alerted · nothing dropped', 'is-ok']],
      stream: [['failure.caught  queued, not lost', 'is-ok']] },
    { term: [['[guard] hidden status', ''],
             ['surface    public portfolio', 'is-out'],
             ['label      prototype / product / demonstration', 'is-out'],
             ['action     status shown at point of use', 'is-ok']],
      stream: [['claim.bounded  evidence before assertion', 'is-ok']] }
  ];

  /* ---- Capabilities: speed to lead ---- */
  STAGE_APPLIERS.speed = (console_, frame, $in) => {
    const set = (sel, v) => { const el = $in(sel); if (el) el.textContent = v; };
    set('[data-speed-clock]', frame.clock);
    set('[data-speed-elapsed]', frame.clock);
    set('[data-speed-att]', frame.attention);
    set('[data-speed-trend]', frame.trend);
    set('[data-speed-contacted]', frame.contacted);
    set('[data-speed-state]', frame.note);
    set('[data-speed-action]', frame.action);
    const chart = $in('[data-speed-chart]');
    if (chart) {
      chart.replaceChildren();
      frame.bars.forEach((h, i) => {
        const bar = doc.createElement('i');
        bar.style.height = `${h}%`;
        if (i === frame.peak) bar.classList.add('is-peak');
        chart.append(bar);
      });
    }
    $$('[data-outcome]', console_).forEach((chip) => {
      chip.classList.toggle('is-on', frame.outcomes.includes(chip.dataset.outcome));
    });
  };

  STAGE_SCRIPTS.speed = [
    { clock: '00:00', attention: '100%', trend: 'peak', contacted: 'No', note: 'waiting',
      action: '—', outcomes: [], bars: [96,88,74,60,48,38,30,24,19,15], peak: 0,
      stream: [['lead.received  source=web_form', ''], ['window.open  attention=100%', '']] },
    { clock: '00:47', attention: '72%', trend: 'falling', contacted: 'Yes', note: 'inside window',
      action: 'Contact now', outcomes: [], bars: [96,88,74,60,48,38,30,24,19,15], peak: 2,
      stream: [['record.created  owner assigned', 'is-ok'],
               ['contact.initiated  inside the window', 'is-ok']] },
    { clock: '01:22', attention: '48%', trend: 'falling', contacted: 'Yes', note: 'connected',
      action: 'Route by outcome', outcomes: ['interested','wrong','noanswer','optout'],
      bars: [96,88,74,60,48,38,30,24,19,15], peak: 4,
      stream: [['outcome.captured  4 possible routes', ''],
               ['note  one inbox rule cannot do this', 'is-hold']] },
    { clock: '01:22', attention: '48%', trend: 'held', contacted: 'Yes', note: 'routed',
      action: 'Meeting task · revenue owner', outcomes: ['interested'],
      bars: [96,88,74,60,48,38,30,24,19,15], peak: 4,
      stream: [['interested → meeting task + owner', 'is-ok'],
               ['wrong_person → find correct contact', 'is-ok'],
               ['opt_out → suppress + keep audit', 'is-ok']] }
  ];

  /* ---- Capabilities: reactivation ---- */
  STAGE_APPLIERS.react = (console_, frame, $in) => {
    const set = (sel, v, cls) => {
      const el = $in(sel); if (!el) return;
      el.textContent = v;
      if (cls) el.className = `tool-crm__pill tool-crm__pill--${cls}`;
    };
    set('[data-react-consent]', frame.consent, frame.consentTone);
    set('[data-react-status]', frame.state, frame.stateTone);
    const outcome = $in('[data-react-outcome]');
    if (outcome) outcome.textContent = frame.outcome;
    $$('[data-ch]', console_).forEach((chip) => {
      const key = chip.dataset.ch;
      chip.classList.toggle('is-allowed', frame.allowed.includes(key));
      chip.classList.toggle('is-blocked', frame.blocked.includes(key));
    });
  };

  STAGE_SCRIPTS.react = [
    { state: 'Dormant', stateTone: 'idle', consent: 'Email permitted', consentTone: 'idle',
      outcome: '—', allowed: [], blocked: [],
      stream: [['record.found  dormant  94d', ''], ['demand.already_paid_for', 'is-hold']] },
    { state: 'Checking', stateTone: 'wait', consent: 'Email only', consentTone: 'wait',
      outcome: '—', allowed: ['email','human'], blocked: ['sms','voice'],
      stream: [['consent.read  email_only', ''],
               ['channel.block  sms · voice', 'is-hold'],
               ['note  convenience does not override consent', 'is-hold']] },
    { state: 'Eligible', stateTone: 'go', consent: 'Email only', consentTone: 'wait',
      outcome: 'Contact prepared', allowed: ['email','human'], blocked: ['sms','voice'],
      stream: [['health.check  not currently owned', 'is-ok'],
               ['frequency.check  within limit', 'is-ok'],
               ['contact.prepared  awaiting human release', 'is-hold']] },
    { state: 'Closed', stateTone: 'stop', consent: 'Opted out', consentTone: 'stop',
      outcome: 'Suppressed · audit kept', allowed: ['human'], blocked: ['email','sms','voice'],
      stream: [['reply.received  not interested', ''],
               ['suppression.applied  all channels', 'is-ok'],
               ['audit.retained  proof of the request', 'is-ok']] }
  ];

  /* ---- Products: Process to SOP (renders into a Notion-style doc) ---- */
  STAGE_APPLIERS.sop = (console_, frame, $in) => {
    const title = $in('[data-sop-title]');
    if (title) title.textContent = frame.title;
    Object.entries(frame.doc).forEach(([key, value]) => {
      const cell = $in(`[data-sop-f="${key}"]`);
      if (!cell) return;
      const empty = value === null;
      const question = typeof value === 'string' && value.endsWith('?');
      cell.textContent = empty ? 'Empty' : value;
      cell.classList.toggle('is-empty', empty);
      cell.classList.toggle('is-question', question);
    });
    const steps = $in('[data-sop-steps]');
    if (steps) {
      steps.replaceChildren();
      frame.steps.forEach((text, i) => {
        const row = doc.createElement('div');
        row.className = 'tool-notion__cb' + (i < frame.stepsDone ? ' is-done' : '');
        const box = doc.createElement('i');
        const label = doc.createElement('span');
        label.textContent = text;
        row.append(box, label);
        steps.append(row);
      });
    }
    const state = $in('[data-sop-state]');
    if (state) state.textContent = frame.state;
  };

  STAGE_SCRIPTS.sop = [
    { title: 'Untitled', state: 'Raw capture',
      doc: { purpose: null, owner: null, exceptions: null, done: null },
      steps: [], stepsDone: 0,
      stream: [['transcript.captured  spoken  out of order', ''],
               ['document.empty  0 of 4 properties', 'is-hold']] },
    { title: 'Delivery exceptions', state: 'Structuring',
      doc: { purpose: 'Resolve inbound delivery exceptions', owner: 'Commerce operations lead',
             exceptions: null, done: null },
      steps: ['Validate the order reference', 'Locate the approved state'], stepsDone: 2,
      stream: [['extract.purpose  ok', 'is-ok'], ['extract.owner  ok', 'is-ok']] },
    { title: 'Delivery exceptions', state: 'Clarifying',
      doc: { purpose: 'Resolve inbound delivery exceptions', owner: 'Commerce operations lead',
             exceptions: 'Refunds → Sam · over £200 → flag', done: 'What counts as resolved?' },
      steps: ['Validate the order reference', 'Locate the approved state',
              'Classify the exception', 'Assign owner and deadline'], stepsDone: 2,
      stream: [['rules.captured  2 exceptions', 'is-ok'],
               ['gap.found  completion condition unstated', 'is-hold'],
               ['question.raised  asked, not invented', 'is-hold']] },
    { title: 'Delivery exceptions', state: 'Ready to export',
      doc: { purpose: 'Resolve inbound delivery exceptions', owner: 'Commerce operations lead',
             exceptions: 'Refunds → Sam · over £200 → flag', done: 'Customer updated · outcome recorded' },
      steps: ['Validate the order reference', 'Locate the approved state',
              'Classify the exception', 'Assign owner and deadline',
              'Prepare the customer update', 'Record the outcome'], stepsDone: 6,
      stream: [['answer.received  completion condition set', 'is-ok'],
               ['document.ready  6 steps · owner · exceptions', 'is-ok']] }
  ];

  /* ---- Products: Follow-Up Gap Detector ---- */
  const GAP_ROWS = [
    { id: 'L-047', gap: 'No owner' }, { id: 'L-043', gap: 'Overdue 41 days' },
    { id: 'L-018', gap: 'No next action' }, { id: 'L-027', gap: 'Trial never booked' },
    { id: 'L-049', gap: 'Missing context' }, { id: 'L-052', gap: null }
  ];

  STAGE_APPLIERS.gap = (console_, frame, $in) => {
    $$('[data-gap-row]', console_).forEach((row, i) => {
      const label = $('small', row);
      const data = GAP_ROWS[i];
      row.classList.remove('is-scanning', 'is-flagged', 'is-healthy');
      if (frame.mode === 'idle') { if (label) label.textContent = 'Not reviewed'; }
      else if (frame.mode === 'scanning') { row.classList.add('is-scanning'); if (label) label.textContent = 'Checking…'; }
      else if (data.gap) { row.classList.add('is-flagged'); if (label) label.textContent = data.gap; }
      else { row.classList.add('is-healthy'); if (label) label.textContent = 'Healthy · owner current'; }
    });
    const set = (sel, v) => { const el = $in(sel); if (el) el.textContent = v; };
    set('[data-gap-count]', frame.count);
    set('[data-gap-well]', frame.well);
    set('[data-gap-sent]', '0');
  };

  STAGE_SCRIPTS.gap = [
    { mode: 'idle', count: '0', well: '0',
      stream: [['records.loaded  6', ''], ['last.review  none on file', 'is-hold']] },
    { mode: 'scanning', count: '0', well: '0',
      stream: [['rules.apply  no_owner · overdue · no_next_action', ''],
               ['note  deterministic — no scoring, no guesswork', '']] },
    { mode: 'done', count: '5', well: '1',
      stream: [['flagged  5', 'is-ok'], ['excluded  1 healthy record', 'is-ok']] },
    { mode: 'done', count: '5', well: '1',
      stream: [['digest.prepared  for human review', 'is-ok'],
               ['contact_fields.withheld  from analysis', 'is-hold'],
               ['messages.sent  0', 'is-ok']] }
  ];

  STAGE_SCRIPTS.enrollment = [
    { state: 'Unqualified', prog: '—', age: '—', owner: 'Unassigned', next: 'None',
      capState: 'Open', places: '4', held: -1, gone: [],
      stream: [['enquiry.received  channel=web_form  21:40', ''],
               ['fields.missing  age_band, schedule', 'is-hold']] },
    { state: 'Qualified · hot', prog: 'Basketball', age: '11–12', owner: 'Unassigned', next: 'Offer a trial',
      capState: 'Checking', places: '4', held: -1, gone: [2],
      stream: [['qualify.run  age=11  location=Rabat  pref=weekend', ''],
               ['capacity.check  2 of 3 sessions viable', 'is-ok']] },
    { state: 'Trial booked', prog: 'Basketball', age: '11–12', owner: 'Enrollment desk', next: 'Confirm attendance',
      capState: 'Held', places: '3', held: 0, gone: [2],
      stream: [['slot.hold  Sat 10:00  places 4 → 3', 'is-ok'],
               ['crm.write  owner=enrollment_desk  next=confirm', 'is-ok'],
               ['confirmation.queued  not sent by demo', '']] },
    { state: 'Human review', prog: 'Basketball', age: '11–12', owner: 'Customer care lead', next: 'A person answers',
      capState: 'Protected', places: '3', held: 0, gone: [2],
      stream: [['intent.detected  payment_problem', 'is-hold'],
               ['automation.halt  reason=requires_judgement', 'is-hold'],
               ['handoff.created  context attached  booking preserved', 'is-ok']] }
  ];

  /* ═══════════ Deep-dive stages ═══════════
     The four case-study routes reuse the same engine: a script per stage,
     one small applier per surface. */

  /* Renders chat bubbles into a tool-chat body. dir: in | out | sys */
  const renderChat = (host, msgs) => {
    if (!host) return;
    host.replaceChildren();
    msgs.forEach(([text, dir, time], i) => {
      const msg = doc.createElement('div');
      msg.className = `tool-chat__msg tool-chat__msg--${dir || 'in'}`;
      msg.style.animationDelay = `${Math.min(i, 6) * 70}ms`;
      msg.append(doc.createTextNode(text));
      if (time && dir !== 'sys') {
        const stamp = doc.createElement('small');
        stamp.textContent = time;
        msg.append(stamp);
      }
      host.append(msg);
    });
    // Pin the window to the newest message; the clipped area above is history.
    host.scrollTop = host.scrollHeight;
  };

  /* Renders call-transcript lines into a tool-callui log.
     lines: [speaker: 'caller' | 'arden' | 'sys', text] */
  const renderCallLines = (host, lines) => {
    if (!host) return;
    host.replaceChildren();
    lines.forEach(([speaker, text], i) => {
      const line = doc.createElement('div');
      line.className = `tool-callui__line tool-callui__line--${speaker}`;
      line.style.animationDelay = `${Math.min(i, 6) * 70}ms`;
      if (speaker === 'sys') {
        line.textContent = text;
      } else {
        const who = doc.createElement('small');
        who.textContent = speaker === 'arden' ? 'Arden' : 'Caller';
        const body = doc.createElement('p');
        body.textContent = text;
        line.append(who, body);
      }
      host.append(line);
    });
    host.scrollTop = host.scrollHeight;
  };

  /* ---- Commerce deep-dive: an order exception, owned ---- */
  STAGE_APPLIERS.order = (console_, frame, $in) => {
    const pill = $in('[data-ord-stage]');
    if (pill) {
      pill.textContent = frame.stage;
      pill.className = `tool-crm__pill tool-crm__pill--${frame.tone}`;
    }
    const set = (sel, v) => { const el = $in(sel); if (el) el.textContent = v; };
    set('[data-ord-owner]', frame.owner);
    set('[data-ord-cust]', frame.cust);
    set('[data-ord-macro]', frame.macro);
    set('[data-ord-auto]', frame.auto);
    const auto = $in('[data-ord-auto]');
    if (auto) auto.classList.toggle('is-hold', Boolean(frame.autoHold));
  };

  STAGE_SCRIPTS.order = [
    { stage: 'Shipped', tone: 'go', owner: 'Commerce desk',
      cust: 'On its way · arriving Wednesday', macro: 'Answering from approved state', auto: 'Running', autoHold: false,
      stream: [['order.shipped  AV-2408  tracking attached', 'is-ok'],
               ['surfaces.agree  customer · support · dashboard', 'is-ok']] },
    { stage: 'Delayed', tone: 'wait', owner: 'Commerce desk',
      cust: 'On its way · arriving Wednesday', macro: 'Held — no promise until a person decides', auto: 'Paused', autoHold: true,
      stream: [['carrier.exception  missed depot window', 'is-hold'],
               ['automation.pause  reason=customer_promise', 'is-hold'],
               ['note  a wrong apology is worse than a slow one', '']] },
    { stage: 'Delayed · owned', tone: 'wait', owner: 'Mara at the desk',
      cust: 'Revised: arriving Thursday, with an apology', macro: 'Answering with the revised promise', auto: 'Paused', autoHold: true,
      stream: [['human.decision  revised_delivery=thursday', 'is-ok'],
               ['customer.update  approved and queued', 'is-ok'],
               ['surfaces.fanout  customer · support · dashboard', 'is-ok']] },
    { stage: 'Delivered', tone: 'go', owner: 'Commerce desk',
      cust: 'Delivered Thursday · as revised', macro: 'Answering from approved state', auto: 'Running', autoHold: false,
      stream: [['order.delivered  matches the revised promise', 'is-ok'],
               ['audit.write  exception · decision · owner · outcome', 'is-ok'],
               ['state.complete  drift=0', 'is-ok']] }
  ];

  /* ---- Enrollment deep-dive: WhatsApp intake becomes an owned record ---- */
  STAGE_APPLIERS.intake = (console_, frame, $in) => {
    renderChat($in('[data-int-chat]'), frame.chat);
    const set = (sel, v) => { const el = $in(sel); if (el) el.textContent = v; };
    set('[data-int-record]', frame.record);
    set('[data-int-owner]', frame.owner);
    set('[data-int-next]', frame.next);
    const record = $in('[data-int-record]');
    if (record) record.classList.toggle('is-hold', Boolean(frame.hold));
  };

  const INTAKE_OPEN = [
    ['Hi — is there basketball for an 11-year-old on weekends?', 'in', '21:40'],
    ['There is. Two weekend groups run in Rabat. Which area are you in, and has Lea played before?', 'out', '21:40']
  ];
  STAGE_SCRIPTS.intake = [
    { chat: INTAKE_OPEN, record: 'Not created', owner: 'Unassigned', next: 'None', hold: true,
      stream: [['enquiry.received  channel=whatsapp  21:40', ''],
               ['note  after hours — on most setups this waits until morning', 'is-hold']] },
    { chat: [...INTAKE_OPEN,
        ['Rabat, near Agdal. First time — she just wants to try it.', 'in', '21:42'],
        ['Perfect. The Saturday 10:00 development group fits her age and has places this month.', 'out', '21:42']],
      record: 'Qualified · hot', owner: 'Unassigned', next: 'Offer a trial', hold: false,
      stream: [['qualify.run  age=11  location=rabat  pref=weekend', ''],
               ['capacity.check  2 of 3 sessions viable', 'is-ok']] },
    { chat: [...INTAKE_OPEN,
        ['Rabat, near Agdal. First time — she just wants to try it.', 'in', '21:42'],
        ['Perfect. The Saturday 10:00 development group fits her age and has places this month.', 'out', '21:42'],
        ['Yes please — book the Saturday one.', 'in', '21:44'],
        ['Done. Lea is booked for Saturday 10:00. You will get a confirmation with everything she needs.', 'out', '21:44'],
        ['Trial held · Sat 10:00 · places 4 → 3 · confirmation queued', 'sys']],
      record: 'Trial booked', owner: 'Enrollment desk', next: 'Confirm attendance', hold: false,
      stream: [['slot.hold  sat_10:00  places 4 → 3', 'is-ok'],
               ['crm.write  owner=enrollment_desk  next=confirm', 'is-ok'],
               ['confirmation.queued  not sent by this demo', '']] },
    { chat: [...INTAKE_OPEN,
        ['Rabat, near Agdal. First time — she just wants to try it.', 'in', '21:42'],
        ['Perfect. The Saturday 10:00 development group fits her age and has places this month.', 'out', '21:42'],
        ['Yes please — book the Saturday one.', 'in', '21:44'],
        ['Done. Lea is booked for Saturday 10:00. You will get a confirmation with everything she needs.', 'out', '21:44'],
        ['One thing — we had a payment problem last season. Can that be sorted first?', 'in', '21:46'],
        ['That needs a person, not me. Dana owns this now and will call you tomorrow morning — the booking is safe either way.', 'out', '21:46'],
        ['Automation stopped · full context handed to Dana · booking preserved', 'sys']],
      record: 'Human review', owner: 'Dana · customer care', next: 'A person answers', hold: true,
      stream: [['intent.detected  payment_problem', 'is-hold'],
               ['automation.halt  reason=requires_judgement', 'is-hold'],
               ['handoff.created  context attached  booking preserved', 'is-ok']] }
  ];

  /* ---- Gap-detector deep-dive: the workflow itself, on its own canvas ---- */
  STAGE_APPLIERS.gapflow = STAGE_APPLIERS.workflow;
  STAGE_SCRIPTS.gapflow = [
    { nodes: [], wires: [],
      note: 'Runs on a schedule · 6 synthetic records · outreach disabled',
      stream: [['records.loaded  6', ''],
               ['last.review  none on file', 'is-hold']] },
    { nodes: ['cron', 'validate', 'rules'], wires: ['a', 'b'],
      note: 'Deterministic rules — readable, arguable, no scoring',
      stream: [['cron.fire  07:00  scan.start', ''],
               ['validate.pass  columns and dates ok', 'is-ok'],
               ['rules.apply  no_owner · overdue · no_next_action', '']] },
    { nodes: ['rules', 'context', 'digest', 'review'], wires: ['c', 'd', 'e'],
      note: 'Privacy-bounded — phone and email never reach the analysis',
      stream: [['flagged  5', 'is-ok'],
               ['excluded  1 healthy record', 'is-ok'],
               ['digest.prepared  for human review', 'is-ok']] },
    { nodes: ['validate', 'human', 'review'], wires: ['g'],
      note: 'Failure has a path too — and Send stays disabled either way',
      stream: [['column.missing  next_action', 'is-hold'],
               ['scan.stop  nothing changed  owner alerted', 'is-hold'],
               ['messages.sent  0  — by design', 'is-ok']] }
  ];

  /* ---- Voice deep-dive: one call on a phone screen, three synchronized views ---- */
  STAGE_APPLIERS.callflow = (console_, frame, $in) => {
    const ui = $in('[data-cf-ui]');
    if (ui) ui.classList.toggle('is-live', Boolean(frame.live));
    renderCallLines($in('[data-cf-log]'), frame.lines);
    const set = (sel, v) => { const el = $in(sel); if (el) el.textContent = v; };
    set('[data-cf-phase]', frame.phase);
    set('[data-cf-timer]', frame.timer);
    set('[data-cf-intent]', frame.intent);
    set('[data-cf-state]', frame.state);
    set('[data-cf-action]', frame.action);
    const state = $in('[data-cf-state]');
    if (state) state.classList.toggle('is-hold', Boolean(frame.hold));
  };

  const CALL_OPEN = [
    ['sys', 'Incoming call · 21:47 · office closed'],
    ['arden', 'Good evening, this is Arden at Bluerook. The team is offline, but I can help right now.']
  ];
  STAGE_SCRIPTS.callflow = [
    { lines: CALL_OPEN, phase: 'Connected · after hours', timer: '00:06', live: true,
      intent: '—', state: 'Answering after hours', action: 'Call recorded', hold: false,
      stream: [['call.received  21:47  outside hours', ''],
               ['coverage.open  approved knowledge only', 'is-ok']] },
    { lines: [...CALL_OPEN,
        ['caller', 'What actually happens after the strategy call?'],
        ['arden', 'We map the bottleneck, define the owner and controls, then recommend the smallest useful first system.']],
      phase: 'Live · answering', timer: '00:31', live: true,
      intent: 'Approved information', state: 'Knowledge answer available', action: 'Answered and logged', hold: false,
      stream: [['intent.classify  approved_information', 'is-ok'],
               ['answer.grounded  no price invented, no promise made', 'is-ok']] },
    { lines: [...CALL_OPEN,
        ['caller', 'What actually happens after the strategy call?'],
        ['arden', 'We map the bottleneck, define the owner and controls, then recommend the smallest useful first system.'],
        ['caller', 'Can I book one for next Tuesday?'],
        ['arden', 'I can hold Tuesday 10:00 or 15:30. Which should I keep?'],
        ['sys', 'Calendar hold prepared · confirmation required before anything books']],
      phase: 'Live · booking', timer: '00:58', live: true,
      intent: 'Booking', state: 'Availability check', action: 'Calendar hold prepared', hold: false,
      stream: [['availability.read  two prepared slots', ''],
               ['hold.prepared  awaiting explicit confirmation', 'is-hold']] },
    { lines: [...CALL_OPEN,
        ['caller', 'What actually happens after the strategy call?'],
        ['arden', 'We map the bottleneck, define the owner and controls, then recommend the smallest useful first system.'],
        ['caller', 'Can I book one for next Tuesday?'],
        ['arden', 'I can hold Tuesday 10:00 or 15:30. Which should I keep?'],
        ['caller', 'Actually — the billing question I have needs a person.'],
        ['arden', 'Of course. I am passing your context to the right person now; you will not repeat yourself.'],
        ['sys', 'Automation stopped · owner assigned · full context attached']],
      phase: 'Ended · handed off', timer: '01:24', live: false,
      intent: 'Human request', state: 'Automation stopped', action: 'Callback task created', hold: true,
      stream: [['request.human  overrides the automated path', 'is-hold'],
               ['handoff.create  context · reason · preference', 'is-ok'],
               ['call.close  outcome and owner recorded', 'is-ok']] }
  ];

  /* ---- Enrollment deep-dive: inside the CRM record ----
     Mirrors the real lead tracker's shape — status columns, one lead card,
     and the agent-collected detail with its handoff state. All synthetic. */
  const BOARD_DETAILS = {
    lea: {
      name: 'Samira Cole · for Lea', sub: 'WhatsApp · +212 6•• ••• •37',
      status: ['New lead', ''], first: 'Tue 21:40', source: 'WhatsApp inbound',
      sport: null, category: null, region: null, dob: null, score: null,
      handoff: 'bot', awaiting: false,
      lastBot: 'Which area are you in, and has Lea played before?',
      log: [['21:40', 'CLIENT', 'Hi — is there basketball for an 11-year-old on weekends?']]
    },
    amina: {
      name: 'Amina Reed', sub: 'WhatsApp · +212 6•• ••• •12',
      status: ['Follow-up', ''], first: '94 days ago', source: 'Website form',
      sport: 'Swimming', category: 'U12 · auto', region: 'Rabat', dob: 'May 2015', score: '41 / 100',
      handoff: 'bot', awaiting: false,
      lastBot: 'Shall I keep the Saturday assessment on your shortlist?',
      log: [['09:12', 'CLIENT', 'We are still deciding between two clubs.']]
    },
    jon: {
      name: 'Jon Bell', sub: 'Instagram · +212 6•• ••• •88',
      status: ['New lead', ''], first: 'Today 10:02', source: 'Instagram enquiry',
      sport: 'Football', category: 'U9 · auto', region: 'Casablanca', dob: 'Feb 2018', score: '58 / 100',
      handoff: 'bot', awaiting: false,
      lastBot: 'The holiday camp runs in two weekly blocks — would mornings work?',
      log: [['10:02', 'CLIENT', 'Is there a camp during the school break?']]
    },
    nora: {
      name: 'Nora Patel', sub: 'WhatsApp · +212 6•• ••• •54',
      status: ['Trial confirmed', 'go'], first: '12 days ago', source: 'WhatsApp inbound',
      sport: 'Basketball', category: 'U15 · auto', region: 'Rabat', dob: 'Oct 2011', score: '84 / 100',
      handoff: 'bot', awaiting: false,
      lastBot: 'Confirmed for Sunday 11:30 — see you there.',
      log: [['18:44', 'CLIENT', 'Sunday works, thank you!']]
    }
  };

  const fillBoardDetail = ($in, detail) => {
    const set = (sel, v) => { const el = $in(sel); if (el) el.textContent = v; };
    set('[data-bd-name]', detail.name);
    set('[data-bd-sub]', detail.sub);
    const status = $in('[data-bd-status]');
    if (status) {
      status.textContent = detail.status[0];
      status.className = `tool-board__pill${detail.status[1] ? ` tool-board__pill--${detail.status[1]}` : ''}`;
    }
    set('[data-bd-first]', detail.first);
    set('[data-bd-source]', detail.source);
    [['sport', detail.sport], ['category', detail.category], ['region', detail.region],
     ['dob', detail.dob], ['score', detail.score]].forEach(([key, value]) => {
      const cell = $in(`[data-bd-${key}]`);
      if (!cell) return;
      cell.textContent = value || 'Empty';
      cell.classList.toggle('is-empty', !value);
    });
    const handoff = $in('[data-bd-handoff]');
    if (handoff) {
      handoff.textContent = detail.handoff === 'human' ? 'human_control' : 'bot_control';
      handoff.className = `tool-board__pill tool-board__pill--${detail.handoff === 'human' ? 'human' : 'bot'}`;
    }
    set('[data-bd-awaiting]', detail.awaiting ? 'Yes — staff owes the next reply' : 'No');
    set('[data-bd-lastbot]', detail.lastBot);
    const log = $in('[data-bd-log]');
    if (log) {
      log.replaceChildren();
      detail.log.forEach(([time, who, text], i) => {
        const line = doc.createElement('i');
        line.style.animationDelay = `${Math.min(i, 5) * 60}ms`;
        const stamp = doc.createElement('b');
        stamp.textContent = `[${time}] ${who}: `;
        line.append(stamp, doc.createTextNode(text));
        log.append(line);
      });
    }
  };

  STAGE_APPLIERS.record = (console_, frame, $in) => {
    const card = $in('[data-bd-card="lea"]');
    const target = $in(`[data-bd-col="${frame.col}"] .tool-board__cards`);
    if (card && target && card.parentElement !== target) target.prepend(card);
    Object.entries(frame.counts).forEach(([key, value]) => {
      const cell = $in(`[data-bd-col="${key}"] .tool-board__colhead small`);
      if (cell) cell.textContent = value;
    });
    const statusTag = $in('[data-bd-cardstatus]');
    if (statusTag) statusTag.textContent = frame.cardTag;
    fillBoardDetail($in, frame.detail);
  };

  const LEA_BASE = BOARD_DETAILS.lea;
  STAGE_SCRIPTS.record = [
    { col: 'new', counts: { new: 2, hand: 0, trial: 1 }, cardTag: 'New lead',
      detail: LEA_BASE,
      stream: [['record.create  channel=whatsapp  dedupe=phone', 'is-ok'],
               ['note  instagram, forms and calls land in this same board', '']] },
    { col: 'new', counts: { new: 2, hand: 0, trial: 1 }, cardTag: 'Qualifying',
      detail: { ...LEA_BASE, status: ['Engaged', ''], score: '62 / 100',
        sport: 'Basketball', category: 'U12 · auto', region: 'Rabat', dob: 'Jul 2015',
        lastBot: 'The Saturday 10:00 development group fits her age and has places this month.',
        log: [...LEA_BASE.log, ['21:42', 'CLIENT', 'Rabat, near Agdal. First time — she just wants to try it.']] },
      stream: [['extract.fields  sport · age → category · region · dob', 'is-ok'],
               ['score.compute  62/100  deterministic rules', 'is-ok'],
               ['note  the agent fills the record, nobody retypes a form', '']] },
    { col: 'hand', counts: { new: 1, hand: 1, trial: 1 }, cardTag: 'Human handoff',
      detail: { ...LEA_BASE, status: ['Human handoff', ''], score: '62 / 100',
        sport: 'Basketball', category: 'U12 · auto', region: 'Rabat', dob: 'Jul 2015',
        handoff: 'human', awaiting: true,
        lastBot: 'That needs a person, not me — Dana will call you tomorrow morning.',
        log: [...LEA_BASE.log,
          ['21:42', 'CLIENT', 'Rabat, near Agdal. First time — she just wants to try it.'],
          ['21:46', 'CLIENT', 'One thing — we had a payment problem last season.']] },
      stream: [['handoff_state  bot_control → human_control', 'is-hold'],
               ['bot.mute  this thread only — every other lead continues', 'is-hold'],
               ['alert.staff  reason=payment  full context attached', 'is-ok']] },
    { col: 'trial', counts: { new: 1, hand: 0, trial: 2 }, cardTag: 'Trial confirmed',
      detail: { ...LEA_BASE, status: ['Trial confirmed', 'go'], score: '62 / 100',
        sport: 'Basketball', category: 'U12 · auto', region: 'Rabat', dob: 'Jul 2015',
        handoff: 'bot', awaiting: false,
        lastBot: 'You are all set for Saturday 10:00 — Lea just needs sports shoes and water.',
        log: [...LEA_BASE.log,
          ['21:42', 'CLIENT', 'Rabat, near Agdal. First time — she just wants to try it.'],
          ['21:46', 'CLIENT', 'One thing — we had a payment problem last season.'],
          ['09:05', 'STAFF', 'Payment plan agreed by phone. Resolved.']] },
      stream: [['resolution.logged  by=dana  outcome=payment_plan', 'is-ok'],
               ['handoff_state  human_control → bot_control', 'is-ok'],
               ['state.complete  one record · every channel · zero retyping', 'is-ok']] }
  ];

  /* ═══════════ Motion layer ═══════════ */

  /* Buttons acknowledge the press at the point of contact. */
  function initRipple() {
    doc.addEventListener('pointerdown', (event) => {
      if (isReduced() || event.button !== 0) return;
      const target = event.target.closest?.('.btn, .pf-chip, .pf-handq__row button, .pf-deck__nav button');
      if (!target || target.disabled) return;
      target.classList.add('pf-ripple');
      const rect = target.getBoundingClientRect();
      const ink = doc.createElement('span');
      ink.className = 'pf-ripple__ink';
      ink.style.setProperty('--rx', `${event.clientX - rect.left}px`);
      ink.style.setProperty('--ry', `${event.clientY - rect.top}px`);
      target.append(ink);
      ink.addEventListener('animationend', () => ink.remove(), { once: true });
    }, { passive: true });
  }

  /* Groups arrive one item after another instead of all at once. */
  function initStagger() {
    const groups = $$('[data-pf-stagger]');
    if (!groups.length) return;
    groups.forEach((group) => {
      Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', String(i)));
    });
    if (isReduced() || !('IntersectionObserver' in window)) {
      groups.forEach((group) => group.classList.add('is-in'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    groups.forEach((group) => observer.observe(group));
  }

  /* Cards catch the light where the pointer is; consoles lean a degree toward
     it. Both are pointer-only, both are cheap, both stop on touch. */
  function initPointerMotion() {
    if (isReduced() || window.matchMedia('(hover: none)').matches) return;

    $$('.pf-cap').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      }, { passive: true });
    });

    $$('.pf-console, .pf-panel').forEach((panel) => {
      if (panel.closest('.pf-cine__stage')) return;
      panel.classList.add('pf-tilt');
      let raf = 0;
      let tx = 0, ty = 0;
      const apply = () => {
        raf = 0;
        panel.style.transform = `perspective(1400px) rotateX(${ty}deg) rotateY(${tx}deg)`;
      };
      panel.addEventListener('pointermove', (event) => {
        const rect = panel.getBoundingClientRect();
        tx = (((event.clientX - rect.left) / rect.width) - 0.5) * 1.6;
        ty = (0.5 - ((event.clientY - rect.top) / rect.height)) * 1.2;
        panel.classList.add('is-tracking');
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      panel.addEventListener('pointerleave', () => {
        panel.classList.remove('is-tracking');
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
    });
  }

  /* ═══════════ Cinematic focus ═══════════
     The same grammar the landing page uses for its three diagnosis lines:
     a tall rail, a pinned stage, and scroll deciding which card is lit.
     Phones fall back to a plain stack — the CSS already handles that, so the
     driver simply does nothing when the stage is not sticky. */
  function initCinema() {
    $$('[data-cine]').forEach((section) => {
      const cards = $$('[data-cine-card]', section);
      const ticks = $$('[data-cine-tick]', section);
      if (!cards.length) return;
      let current = -1;

      const stackedNow = () => getComputedStyle($('[data-cine-stage]', section) || section).position !== 'sticky';

      const paint = (index) => {
        if (index === current) return;
        current = index;
        const stack = stackedNow();
        cards.forEach((card, i) => {
          card.classList.toggle('is-live', i === index);
          card.classList.toggle('is-past', i < index);
          // Only the lit card is reachable by keyboard — unless the cards are
          // stacked, where every one of them is on screen and focusable.
          $$('a, button', card).forEach((el) => { el.tabIndex = (stack || i === index) ? 0 : -1; });
        });
        ticks.forEach((tick, i) => {
          tick.classList.toggle('is-live', i === index);
          tick.classList.toggle('is-past', i < index);
          tick.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
      };

      const stacked = stackedNow;

      const choose = () => {
        if (stacked()) { paint(cards.length - 1); return; }
        const rect = section.getBoundingClientRect();
        const range = Math.max(1, rect.height - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / range));
        // Bias so each card settles before the next takes over.
        paint(Math.min(cards.length - 1, Math.floor(progress * cards.length * 0.999)));
      };

      ticks.forEach((tick, i) => tick.addEventListener('click', () => {
        if (stacked()) { cards[i].scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth', block: 'center' }); return; }
        const range = Math.max(1, section.offsetHeight - window.innerHeight);
        const target = section.offsetTop + range * ((i + 0.5) / cards.length);
        window.scrollTo({ top: target, behavior: isReduced() ? 'auto' : 'smooth' });
      }));

      paint(0);
      window.addEventListener('scroll', choose, { passive: true });
      window.addEventListener('resize', choose, { passive: true });
      choose();
    });
  }

  /* Vertical scroll pans the filmstrip sideways. Same input, different
     grammar from the crossfade deck, so the two closing sections do not
     read as the same section twice. */
  function initStrip() {
    $$('[data-strip]').forEach((section) => {
      const track = $('[data-strip-track]', section);
      const cards = $$('.pf-stripcard', track || section);
      const meter = $('[data-strip-progress] i', section);
      if (!track || !cards.length) return;
      let raf = 0;

      const paint = () => {
        raf = 0;
        const stage = $('[data-strip-stage]', section);
        if (!stage || getComputedStyle(stage).position !== 'sticky') {
          track.style.transform = '';
          cards.forEach((card) => card.style.setProperty('--lit', '1'));
          return;
        }
        const rect = section.getBoundingClientRect();
        const range = Math.max(1, rect.height - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / range));
        // The track's own scrollWidth ignores flex children that overflow a
        // visible box, so measure the last card instead of trusting it.
        const last = cards[cards.length - 1];
        const padRight = parseFloat(getComputedStyle(track).paddingRight) || 0;
        const travel = Math.max(0, last.offsetLeft + last.offsetWidth + padRight - track.clientWidth);
        const x = travel * progress;
        track.style.transform = `translate3d(${-x}px, 0, 0)`;
        if (meter) meter.style.width = `${(progress * 100).toFixed(1)}%`;

        // Light whichever card is nearest the middle of the window. Measured
        // from untransformed offsets, not live rects: a rect read mid-transform
        // reports where the card is on its way from, and the highlight lags a
        // card behind the pan.
        const centre = x + track.clientWidth / 2;
        cards.forEach((card) => {
          const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre);
          const lit = Math.max(0, 1 - distance / (card.offsetWidth * 1.15));
          card.style.setProperty('--lit', lit.toFixed(3));
        });
      };
      const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };

      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue, { passive: true });
      paint();
    });
  }

  /* ---- Board interactivity: click any lead card to open its record ---- */
  function initBoard() {
    const board = $('[data-board]');
    if (!board) return;
    const scope = (sel) => board.querySelector(sel);
    $$('button[data-bd-card]', board).forEach((card) => {
      card.addEventListener('click', () => {
        const detail = BOARD_DETAILS[card.dataset.bdCard];
        if (!detail) return;
        $$('[data-bd-card]', board).forEach((candidate) => candidate.classList.toggle('is-focus', candidate === card));
        fillBoardDetail(scope, detail);
        announce(`${detail.name} opened. Every field below was collected by the agent.`);
      });
    });
  }

  /* ---- Handoff queue: the bot paused; a person takes the thread ---- */
  function initHandq() {
    const root = $('[data-handq]');
    if (!root) return;
    const count = $('[data-handq-count]', root);
    const rows = $$('[data-handq-row]', root);
    let open = rows.length;

    rows.forEach((row) => {
      const button = row.querySelector('button');
      const note = row.querySelector('[data-handq-note]');
      button?.addEventListener('click', () => {
        if (row.classList.contains('is-taken')) return;
        row.classList.add('is-taken');
        button.textContent = 'Staff replying…';
        window.setTimeout(() => {
          button.textContent = 'Resolved · bot resumed';
          if (note) note.textContent = 'Outcome logged · handoff_state back to bot_control';
          open -= 1;
          if (count) count.textContent = String(open);
          announce('Thread resolved. The bot resumes only after the person is done.');
        }, isReduced() ? 30 : 900);
        announce('Thread taken over. The bot stays muted on this conversation.');
      });
    });
    if (count) count.textContent = String(open);
  }

  /* ---- Swipe deck: the closing picker ---- */
  function initDeck() {
    const deck = $('[data-deck]');
    if (!deck) return;
    const track = $('[data-deck-track]', deck);
    const cards = $$('.pf-deckcard', track);
    if (!track || !cards.length) return;
    let raf = 0;

    const paint = () => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const distance = Math.abs(r.left + r.width / 2 - mid);
        const focus = Math.max(0, 1 - distance / (r.width * 1.05));
        card.style.setProperty('--focus', focus.toFixed(3));
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };

    const centerOf = (card) => card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    const focusedIndex = () => {
      let best = 0, bestFocus = -1;
      cards.forEach((card, i) => {
        const focus = parseFloat(card.style.getPropertyValue('--focus') || '0');
        if (focus > bestFocus) { bestFocus = focus; best = i; }
      });
      return best;
    };
    const go = (delta) => {
      const next = Math.min(cards.length - 1, Math.max(0, focusedIndex() + delta));
      track.scrollTo({ left: centerOf(cards[next]), behavior: isReduced() ? 'auto' : 'smooth' });
    };

    track.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    $('[data-deck-prev]', deck)?.addEventListener('click', () => go(-1));
    $('[data-deck-next]', deck)?.addEventListener('click', () => go(1));
    paint();
  }

  /* ---- Numbers that count up when they enter the viewport ---- */
  function initCountups() {
    const items = $$('[data-countup]');
    if (!items.length) return;
    const finish = (el) => { el.textContent = el.dataset.countup + (el.dataset.countupSuffix || ''); };
    const animate = (el) => {
      const target = parseFloat(el.dataset.countup);
      if (!Number.isFinite(target) || isReduced()) { finish(el); return; }
      const suffix = el.dataset.countupSuffix || '';
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 900);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3)))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { items.forEach(finish); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.55 });
    items.forEach((el) => observer.observe(el));
  }

  /* ═══════════ Hands-on labs ═══════════
     Button-driven counterparts to the scroll stages. Deterministic,
     browser-local, and every guard is visible. */

  const SHOP_PRODUCTS = {
    'AV-104': { name: 'Field Notes No. 04', price: 48, stock: 12, availability: 'Published', art: 'field', collection: 'Field Editions' },
    'AV-218': { name: 'Studio Vessel No. 02', price: 72, stock: 4, availability: 'Published', art: 'vessel', collection: 'Objects' },
    'AV-331': { name: 'Night Archive Set', price: 94, stock: 0, availability: 'Draft', art: 'archive', collection: 'Archive' }
  };

  function initShopLab() {
    const root = $('[data-shop]');
    if (!root) return;
    const money = (n) => `$${Number(n).toFixed(2)}`;
    const published = {};
    Object.entries(SHOP_PRODUCTS).forEach(([sku, p]) => { published[sku] = { ...p }; });
    let sku = 'AV-104';
    let held = null;

    const el = {
      picks: $$('[data-shop-pick]', root),
      price: $('[data-shop-price-field]', root),
      stock: $('[data-shop-stock-field]', root),
      avail: $('[data-shop-avail-field]', root),
      save: $('[data-shop-save]', root),
      approve: $('[data-shop-approve]', root),
      pill: $('[data-shop-pill]', root),
      name: $('[data-shop-name]', root),
      cardPrice: $('[data-shop-card-price]', root),
      badge: $('[data-shop-badge]', root),
      art: $('[data-shop-art]', root),
      log: $('[data-shop-log]', root),
      recs: { dash: $('[data-shop-rec-dash]', root), crm: $('[data-shop-rec-crm]', root), feed: $('[data-shop-rec-feed]', root) }
    };

    const log = (text, cls) => {
      if (!el.log) return;
      const line = doc.createElement('i');
      if (cls) line.className = cls;
      line.textContent = text;
      el.log.prepend(line);
      while (el.log.children.length > 6) el.log.lastChild.remove();
    };

    const badgeFor = (p) => (p.availability === 'Draft' ? 'Hidden · draft' : p.stock <= 0 ? 'Sold out' : 'In stock');

    const paintStore = () => {
      const p = published[sku];
      el.name.textContent = p.name;
      el.cardPrice.textContent = money(p.price);
      el.badge.textContent = badgeFor(p);
      if (el.art) {
        el.art.className = `pf-art${p.art === 'field' ? '' : ` pf-art--${p.art}`}`;
        const img = el.art.querySelector('img, picture');
        if (img) img.hidden = p.art !== 'field';
      }
      Object.values(el.recs).forEach((cell) => {
        if (!cell) return;
        cell.textContent = money(p.price);
        cell.closest('[data-rec]')?.classList.remove('is-stale', 'is-synced');
      });
    };

    const paintForm = () => {
      const p = published[sku];
      el.price.value = String(p.price);
      el.stock.value = String(p.stock);
      el.avail.value = p.availability;
      el.pill.textContent = 'No draft';
      el.approve.disabled = true;
      el.picks.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.shopPick === sku)));
    };

    el.picks.forEach((chip) => chip.addEventListener('click', () => {
      if (chip.dataset.shopPick === sku) return;
      if (held) log('draft.discarded  product switched before approval', 'is-hold');
      held = null;
      sku = chip.dataset.shopPick;
      paintStore();
      paintForm();
      announce(`${published[sku].name} loaded into the back office.`);
    }));

    el.save.addEventListener('click', () => {
      const draft = {
        price: Math.max(0, Number(el.price.value) || 0),
        stock: Math.max(0, Math.round(Number(el.stock.value) || 0)),
        availability: el.avail.value
      };
      const p = published[sku];
      const changes = [];
      if (draft.price !== p.price) changes.push(`price ${money(p.price)} → ${money(draft.price)}`);
      if (draft.stock !== p.stock) changes.push(`stock ${p.stock} → ${draft.stock}`);
      if (draft.availability !== p.availability) changes.push(`${p.availability.toLowerCase()} → ${draft.availability.toLowerCase()}`);
      if (!changes.length) {
        shake(el.pill);
        log('diff.empty  nothing to hold', '');
        toast('Nothing changed yet. Edit a field, then save.', 'stop');
        return;
      }

      el.save.disabled = true;
      working(el.log, 520, () => {
        held = draft;
        el.pill.textContent = 'Held · awaiting approval';
        pop(el.pill);
        el.approve.disabled = false;
        el.save.disabled = false;
        // The storefront visibly disagrees with the draft until someone approves.
        Object.values(el.recs).forEach((cell) => cell?.closest('[data-rec]')?.classList.add('is-stale'));
        el.cardPrice.classList.add('is-stale-note');
        log(`diff.held  ${sku}  ${changes.join(' · ')}`, 'is-hold');
        toast(`Held: ${changes.join(', ')}. The storefront still shows the approved value.`, 'hold');
      });
    });

    el.approve.addEventListener('click', () => {
      if (!held) {
        shake(el.approve);
        toast('There is no draft to approve. Save a change first.', 'stop');
        return;
      }
      const before = { ...published[sku] };
      published[sku] = { ...published[sku], ...held };
      held = null;
      el.approve.disabled = true;
      el.pill.textContent = 'Approved';
      pop(el.pill);
      log('approval.granted  by=commerce_lead', 'is-ok');

      // The fan-out is the point of the demonstration, so it is paced to be
      // watchable: storefront, then dashboard, macro, feed — each one lands.
      const steps = [
        () => {
          paintStore();
          el.cardPrice.classList.remove('is-stale-note');
          wasNow(el.cardPrice, money(published[sku].price), before.price !== published[sku].price ? money(before.price) : null);
          el.badge.textContent = badgeFor(published[sku]);
        },
        ...Object.entries(el.recs).map(([key, cell]) => () => {
          if (!cell) return;
          const row = cell.closest('[data-rec]');
          cell.textContent = money(published[sku].price);
          row?.classList.remove('is-stale');
          row?.classList.add('is-synced');
          pop(cell);
          window.setTimeout(() => row?.classList.remove('is-synced'), 1000);
        })
      ];
      steps.forEach((step, i) => window.setTimeout(step, isReduced() ? 0 : i * 240));
      window.setTimeout(() => {
        el.pill.textContent = 'No draft';
        log('surfaces.reconciled  storefront · dashboard · macro · feed  drift=0', 'is-ok');
        toast('Approved. Four surfaces reconciled in one pass, and the audit line is written.', 'ok');
      }, isReduced() ? 10 : steps.length * 240 + 120);
    });

    const reset = $('[data-shop-reset]', root);
    reset?.addEventListener('click', () => {
      Object.entries(SHOP_PRODUCTS).forEach(([key, p]) => { published[key] = { ...p }; });
      held = null;
      sku = 'AV-104';
      el.log?.replaceChildren();
      paintStore();
      paintForm();
      log('workspace.reset  synthetic state restored', '');
      announce('Commerce workspace reset.');
    });

    paintStore();
    paintForm();
    log('workspace.ready  synthetic retailer · no live commerce service', '');
  }

  /* ---- Commerce: description review in a Notion-style doc ---- */
  function initDescLab() {
    const root = $('[data-desc]');
    if (!root) return;
    const tag = $('[data-desc-tag]', root);
    const draft = $('[data-desc-draft]', root);
    const approved = $('[data-desc-approved]', root);
    const state = $('[data-desc-state]', root);
    const APPROVED_COPY = 'A compact edition for notes, sketches and field observations.';
    const DRAFT_COPY = 'A pocket notebook for people who write outdoors: 64 pages of rain-tolerant paper, a sewn spine that opens flat, and a cover that earns its scuffs. Facts only — no claims a reviewer has not seen.';

    const paint = (mode) => {
      if (mode === 'suggested') {
        draft.textContent = DRAFT_COPY;
        draft.classList.remove('is-empty');
        tag.textContent = 'Suggested · awaiting review';
        tag.className = 'tool-notion__tag tool-notion__tag--wait';
        state.textContent = 'A person owns publication. The live copy has not moved.';
      } else if (mode === 'approved') {
        approved.textContent = DRAFT_COPY;
        draft.textContent = 'Empty';
        draft.classList.add('is-empty');
        tag.textContent = 'Approved · live copy';
        tag.className = 'tool-notion__tag tool-notion__tag--go';
        state.textContent = 'Approved by the reviewer. Only now does the storefront copy change.';
      } else {
        draft.textContent = 'Empty';
        draft.classList.add('is-empty');
        approved.textContent = APPROVED_COPY;
        tag.textContent = 'No suggestion';
        tag.className = 'tool-notion__tag';
        state.textContent = mode === 'rejected'
          ? 'Rejected. The approved description stays live — a rejection is a decision, not a failure.'
          : 'Generate a structured suggestion. Approval and rejection are separate, visible actions.';
      }
    };

    $('[data-desc-generate]', root)?.addEventListener('click', () => {
      paint('suggested');
      announce('Structured description prepared from raw facts. Awaiting human review.');
    });
    $('[data-desc-approve]', root)?.addEventListener('click', () => {
      if (!draft.textContent || draft.classList.contains('is-empty')) {
        state.textContent = 'Nothing to approve — generate a suggestion first.';
        announce('No suggestion to approve.');
        return;
      }
      paint('approved');
      announce('Suggestion approved and published to the synthetic storefront.');
    });
    $('[data-desc-reject]', root)?.addEventListener('click', () => {
      if (!draft.textContent || draft.classList.contains('is-empty')) {
        state.textContent = 'Nothing to reject — the approved copy is already live.';
        return;
      }
      paint('rejected');
      announce('Suggestion rejected. The existing approved description remains active.');
    });
    $('[data-desc-reset]', root)?.addEventListener('click', () => { paint('idle'); });

    paint('idle');
  }

  /* ---- Enrollment: qualify, book, and hit the human boundary ---- */
  function initEnrollLab() {
    const root = $('[data-enroll]');
    if (!root) return;

    const el = {
      programme: $('[data-en-programme]', root),
      age: $('[data-en-age-field]', root),
      schedule: $('[data-en-schedule]', root),
      qualify: $('[data-en-qualify]', root),
      stage: $('[data-en-stage]', root),
      owner: $('[data-en-owner]', root),
      next: $('[data-en-next]', root),
      sessions: $$('[data-en-session]', root),
      confirm: $('[data-en-confirm]', root),
      cal: $('[data-en-cal]', root),
      conf: $('[data-en-conf]', root),
      reasons: $$('[data-en-reason]', root),
      hreason: $('[data-en-hreason]', root),
      howner: $('[data-en-howner]', root),
      hurgency: $('[data-en-hurgency]', root),
      resolve: $('[data-en-resolve]', root),
      log: $('[data-en-log]', root)
    };

    const capacity = {};
    let qualified = false;
    let picked = null;
    let booked = null;

    const log = (text, cls) => {
      if (!el.log) return;
      const line = doc.createElement('i');
      if (cls) line.className = cls;
      line.textContent = text;
      el.log.prepend(line);
      while (el.log.children.length > 6) el.log.lastChild.remove();
    };

    const setPill = (text, tone) => {
      el.stage.textContent = text;
      el.stage.className = `tool-crm__pill tool-crm__pill--${tone}`;
    };

    const paintSessions = () => {
      el.sessions.forEach((chip) => {
        const left = capacity[chip.dataset.enSession];
        const label = chip.querySelector('small');
        if (label) label.textContent = left <= 0 ? 'Full — offer an alternative' : `${left} place${left === 1 ? '' : 's'} left`;
        chip.classList.toggle('is-gone', left <= 0 && booked !== chip.dataset.enSession);
        chip.setAttribute('aria-pressed', String(picked === chip.dataset.enSession));
      });
    };

    el.qualify.addEventListener('click', () => {
      el.qualify.disabled = true;
      skeleton([el.stage, el.owner, el.next], isReduced() ? 0 : 620);
      working(el.log, 620, () => {
        qualified = true;
        setPill('Qualified · hot', 'go');
        pop(el.stage);
        wasNow(el.owner, 'Enrollment desk', 'Unassigned');
        wasNow(el.next, 'Offer a trial', 'Complete qualification');
        el.qualify.disabled = false;
        log(`qualify.pass  ${el.programme.value.toLowerCase()}  age=${el.age.value}  ${el.schedule.value.toLowerCase()}`, 'is-ok');
        toast(`Qualified against real capacity: ${el.programme.value.toLowerCase()}, age ${el.age.value}, ${el.schedule.value.toLowerCase()}. The desk now owns it.`, 'ok');
      });
    });

    el.sessions.forEach((chip) => chip.addEventListener('click', () => {
      const key = chip.dataset.enSession;
      if (booked) {
        shake(chip);
        log('change.requested  routes to the desk — booking preserved', 'is-hold');
        toast('Already booked. Changing a held trial is a desk decision, not an automation decision.', 'hold');
        return;
      }
      if (capacity[key] <= 0) {
        shake(chip);
        log(`session.full  ${key} — alternative required`, 'is-hold');
        toast('That session is full. The system offers an alternative rather than overbooking it.', 'stop');
        return;
      }
      picked = key;
      paintSessions();
      toast(`${key} selected. Confirm to hold the place.`);
    }));

    el.confirm.addEventListener('click', () => {
      if (booked) {
        shake(el.confirm);
        log('booking.exists  double-booking blocked', 'is-hold');
        toast('Blocked: this lead already holds a place. The guard exists so nobody books twice.', 'stop');
        return;
      }
      if (!qualified) {
        shake(el.confirm);
        pop(el.stage);
        log('booking.blocked  qualification incomplete', 'is-hold');
        toast('Blocked: qualify the enquiry first. A booking without context is a future exception.', 'stop');
        return;
      }
      if (!picked) {
        shake(el.confirm);
        log('booking.blocked  no session selected', 'is-hold');
        toast('Pick a session window first.', 'stop');
        return;
      }

      el.confirm.disabled = true;
      const chip = el.sessions.find((candidate) => candidate.dataset.enSession === picked);
      working(el.log, 640, () => {
        booked = picked;
        const before = capacity[booked];
        capacity[booked] -= 1;
        setPill('Trial booked', 'go');
        pop(el.stage);
        el.confirm.disabled = false;
        paintSessions();
        if (chip) pop(chip.querySelector('small'));
        // Three systems move on one confirmation: show them land in order.
        const beats = [
          () => wasNow(el.cal, `Hold · ${booked}`, 'No hold'),
          () => wasNow(el.conf, 'Queued · not sent by this demo', 'Not queued'),
          () => wasNow(el.next, 'Confirm attendance', 'Offer a trial')
        ];
        beats.forEach((beat, i) => window.setTimeout(beat, isReduced() ? 0 : i * 230));
        log(`slot.hold  ${booked}  places ${before} → ${capacity[booked]}`, 'is-ok');
        toast(`Held ${booked}. Capacity ${before} → ${capacity[booked]}, calendar, record and confirmation all moved together.`, 'ok');
      });
    });

    el.reasons.forEach((chip) => chip.addEventListener('click', () => {
      el.reasons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === chip)));
      const reason = chip.dataset.enReason;
      const urgent = /payment|complaint/i.test(reason);
      wasNow(el.hreason, reason, 'No handoff');
      window.setTimeout(() => wasNow(el.howner, 'Dana · customer care', '—'), isReduced() ? 0 : 200);
      window.setTimeout(() => wasNow(el.hurgency, urgent ? 'High · same day' : 'Normal · next window', 'None'), isReduced() ? 0 : 380);
      setPill('Human review', 'wait');
      pop(el.stage);
      wasNow(el.next, 'A person answers', el.next.textContent);
      log(`automation.halt  ${reason.toLowerCase().replace(/\s+/g, '_')}`, 'is-hold');
      toast(`${reason}: automation stops here. Dana inherits the thread with full context${booked ? ', and the booking is preserved' : ''}.`, 'hold');
    }));

    el.resolve.addEventListener('click', () => {
      if (el.hreason.textContent.startsWith('No handoff')) {
        shake(el.resolve);
        toast('No active handoff to resolve. Trigger one first.', 'stop');
        return;
      }
      el.resolve.disabled = true;
      working(el.log, 560, () => {
        el.resolve.disabled = false;
        wasNow(el.hreason, 'No handoff', 'Payment issue');
        el.hurgency.textContent = 'None';
        el.howner.textContent = '—';
        el.reasons.forEach((chip) => chip.setAttribute('aria-pressed', 'false'));
        setPill(booked ? 'Trial booked' : qualified ? 'Qualified · hot' : 'New enquiry', booked || qualified ? 'go' : 'idle');
        pop(el.stage);
        wasNow(el.next, booked ? 'Confirm attendance' : qualified ? 'Offer a trial' : 'Complete qualification', 'A person answers');
        log('resolution.recorded  outcome and owner logged  control → bot', 'is-ok');
        toast('Resolution logged on the same record. Control returns to the bot, nothing was retyped.', 'ok');
      });
    });

    const reset = () => {
      qualified = false;
      picked = null;
      booked = null;
      el.sessions.forEach((chip) => { capacity[chip.dataset.enSession] = Number(chip.dataset.enPlaces); });
      setPill('New enquiry', 'idle');
      el.owner.textContent = 'Unassigned';
      el.next.textContent = 'Complete qualification';
      el.cal.textContent = 'No hold';
      el.conf.textContent = 'Not queued';
      el.hreason.textContent = 'No handoff';
      el.hurgency.textContent = 'None';
      el.howner.textContent = '—';
      el.reasons.forEach((chip) => chip.setAttribute('aria-pressed', 'false'));
      el.log?.replaceChildren();
      paintSessions();
      log('workspace.ready  synthetic enrollment desk', '');
    };
    $('[data-en-reset]', root)?.addEventListener('click', () => { reset(); announce('Enrollment demo reset.'); });
    reset();
  }

  /* ---- Gap detector: scan, inspect, approve — never send ---- */
  const GAP_LEADS = [
    { id: 'L-018', name: 'Amina Reed', reason: 'No next action', age: '94 days', consent: 'Email permitted', healthy: false, suggested: 'Confirm whether the spring programme is still relevant.' },
    { id: 'L-027', name: 'Jon Bell', reason: 'Trial never booked', age: '61 days', consent: 'Voice + SMS permitted', healthy: false, suggested: 'Offer two current trial windows after staff review.' },
    { id: 'L-043', name: 'Nora Patel', reason: 'Overdue follow-up', age: '12 days', consent: 'Email permitted', healthy: false, suggested: 'Reply to the pricing question with approved programme information.' },
    { id: 'L-047', name: 'Milan Shah', reason: 'No owner', age: '18 days', consent: 'Human review only', healthy: false, suggested: 'Assign a responsible person before any contact is prepared.' },
    { id: 'L-049', name: 'Tessa Young', reason: 'Missing context', age: '35 days', consent: 'Email permitted', healthy: false, suggested: 'Recover the last approved interaction before drafting a response.' },
    { id: 'L-052', name: 'Eli North', reason: 'Healthy record', age: '2 days', consent: 'Email permitted', healthy: true, suggested: 'No action. Owner and next step are current.' }
  ];

  function initGapLab() {
    const root = $('[data-gaplab]');
    if (!root) return;
    const rows = $$('[data-gl-row]', root);
    const el = {
      run: $('[data-gl-run]', root),
      count: $('[data-gl-count]', root),
      well: $('[data-gl-well]', root),
      sent: $('[data-gl-sent]', root),
      id: $('[data-gl-id]', root),
      name: $('[data-gl-name]', root),
      reason: $('[data-gl-reason]', root),
      age: $('[data-gl-age]', root),
      consent: $('[data-gl-consent]', root),
      suggested: $('[data-gl-suggested]', root),
      draft: $('[data-gl-draft]', root),
      outcome: $('[data-gl-outcome]', root),
      prepare: $('[data-gl-prepare]', root),
      approve: $('[data-gl-approve]', root),
      failSelect: $('[data-gl-fail-type]', root),
      fail: $('[data-gl-fail]', root),
      failOut: $('[data-gl-fail-out]', root)
    };
    let scanned = false;
    let selected = GAP_LEADS[0];
    let token = 0;

    const paintSelected = () => {
      el.id.textContent = selected.id;
      el.name.textContent = selected.name;
      el.reason.textContent = selected.reason;
      el.age.textContent = selected.age;
      el.consent.textContent = selected.consent;
      el.suggested.textContent = selected.suggested;
      el.draft.textContent = selected.healthy
        ? 'No draft. Healthy records stay outside the review queue.'
        : 'Prepare a privacy-bounded context summary before drafting.';
      el.outcome.textContent = 'No outcome logged.';
      rows.forEach((row) => {
        const button = row.querySelector('button');
        button?.setAttribute('aria-pressed', String(row.dataset.glRow === selected.id));
      });
    };

    rows.forEach((row) => row.querySelector('button')?.addEventListener('click', () => {
      selected = GAP_LEADS.find((lead) => lead.id === row.dataset.glRow) || GAP_LEADS[0];
      paintSelected();
      announce(`${selected.name} selected. ${selected.reason}.`);
    }));

    el.run.addEventListener('click', () => {
      token += 1;
      const active = token;
      let flagged = 0;
      let excluded = 0;
      el.run.disabled = true;
      rows.forEach((row) => {
        row.classList.remove('is-flagged', 'is-healthy', 'is-approved');
        const result = row.querySelector('small');
        if (result) result.textContent = 'Awaiting scan';
      });
      rows.forEach((row, i) => {
        window.setTimeout(() => {
          if (active !== token) return;
          row.classList.add('is-scanning');
          window.setTimeout(() => {
            if (active !== token) return;
            row.classList.remove('is-scanning');
            const lead = GAP_LEADS[i];
            const result = row.querySelector('small');
            if (lead.healthy) {
              row.classList.add('is-healthy');
              if (result) result.textContent = 'Excluded · owner and next action current';
              excluded += 1;
              el.well.textContent = String(excluded);
            } else {
              row.classList.add('is-flagged');
              if (result) result.textContent = `Flagged · ${lead.reason}`;
              flagged += 1;
              el.count.textContent = String(flagged);
            }
            if (i === rows.length - 1) {
              scanned = true;
              el.run.disabled = false;
              pop(el.count);
              toast(`${flagged} gaps flagged, ${excluded} healthy record excluded, 0 messages sent.`, 'ok');
            }
          }, isReduced() ? 0 : 190);
        }, isReduced() ? 0 : i * 240);
      });
    });

    el.prepare.addEventListener('click', () => {
      if (selected.healthy) {
        shake(el.prepare);
        el.draft.textContent = 'No draft created. The record has a current owner and next action.';
        pop(el.draft);
        toast('Healthy record: correctly excluded. A queue that flags everything is a queue nobody opens.', 'stop');
        return;
      }
      if (!scanned) {
        shake(el.prepare);
        el.draft.textContent = 'Run the deterministic scan first — context is prepared from scan results, not assumptions.';
        pop(el.draft);
        toast('Blocked: run the scan first. Context comes from results, never from assumptions.', 'stop');
        return;
      }
      el.prepare.disabled = true;
      skeleton([el.draft], isReduced() ? 0 : 620);
      working(el.draft.parentElement, 620, () => {
        el.prepare.disabled = false;
        el.draft.textContent = `Prepared for human review: ${selected.suggested} Contact permission: ${selected.consent}. No phone number or email address is included in the analysis context.`;
        pop(el.draft);
        toast('Context prepared without the contact fields. Drafting is not sending.', 'hold');
      });
    });

    el.approve.addEventListener('click', () => {
      if (selected.healthy || !el.draft.textContent.startsWith('Prepared')) {
        shake(el.approve);
        toast('Prepare context on a flagged record before approving.', 'stop');
        return;
      }
      el.outcome.textContent = 'Human approval recorded · task assigned · no message sent by this page.';
      pop(el.outcome);
      const row = rows.find((candidate) => candidate.dataset.glRow === selected.id);
      if (row) {
        row.classList.add('is-approved');
        const result = row.querySelector('small');
        if (result) { result.textContent = 'Approved · task assigned · nothing sent'; pop(result); }
      }
      pop(el.sent);
      toast(`Approved for ${selected.name}. A task exists, an owner exists, and the sent counter is still zero.`, 'ok');
    });

    el.fail?.addEventListener('click', () => {
      const type = el.failSelect?.value || 'CRM unavailable';
      el.fail.disabled = true;
      working(el.failOut.parentElement, 520, () => {
        el.fail.disabled = false;
        el.failOut.textContent = `${type}: the scan stops, no record changes, the owner is alerted and the failure is logged. Recovery is a path, not an apology.`;
        pop(el.failOut);
        shake(el.failOut);
        toast(`${type}: scan halted, zero records changed, owner alerted.`, 'stop');
      });
    });

    const reset = () => {
      token += 1;
      scanned = false;
      selected = GAP_LEADS[0];
      rows.forEach((row) => {
        row.classList.remove('is-scanning', 'is-flagged', 'is-healthy', 'is-approved');
        const result = row.querySelector('small');
        if (result) result.textContent = 'Awaiting scan';
      });
      el.count.textContent = '0';
      el.well.textContent = '0';
      el.sent.textContent = '0';
      el.failOut.textContent = 'No failure active.';
      el.run.disabled = false;
      paintSelected();
    };
    $('[data-gl-reset]', root)?.addEventListener('click', () => { reset(); announce('Detector reset.'); });
    reset();
  }

  /* ---- Voice: prepared scenarios with synchronized state ---- */
  const VOICE_SCENARIOS = {
    faq: { label: 'Ask a common question', caller: 'What happens after the strategy call?', reply: 'We map the bottleneck, define the owner and controls, then recommend the smallest useful first system.', intent: 'Approved information', state: 'Knowledge answer available', action: 'Answered and logged', calendar: 'No calendar change', boundary: 'Only approved information is used; uncertainty routes to a person.' },
    book: { label: 'Book an appointment', caller: 'Can I book a strategy call next Tuesday?', reply: 'I can offer two prepared fictional slots. Which one should I hold?', intent: 'Booking', state: 'Availability check required', action: 'Calendar hold prepared', calendar: 'Prepared hold awaiting confirmation', boundary: 'A hold can be prepared; a confirmed booking needs explicit caller confirmation.' },
    change: { label: 'Change a booking', caller: 'I need to move my appointment.', reply: 'I can record the change request and hand it to the scheduling owner with your current booking context.', intent: 'Reschedule', state: 'Customer record located', action: 'Human scheduling task created', calendar: 'Change request awaiting owner', boundary: 'The existing booking is not changed automatically in this prototype.' },
    problem: { label: 'Report a problem', caller: 'The form failed after I submitted it.', reply: 'I have captured the failure, the affected step, and your contact preference for the operations owner.', intent: 'Service exception', state: 'Human escalation required', action: 'Priority exception created', calendar: 'No calendar change', boundary: 'Arden records the exception and stops. A person owns diagnosis and resolution.' },
    person: { label: 'Request a person', caller: 'I would rather speak to someone.', reply: 'Of course. I will pass your reason and contact preference to the appropriate person.', intent: 'Human request', state: 'Immediate handoff', action: 'Callback task created', calendar: 'No calendar change', boundary: 'The request for a person overrides the automated path immediately.' },
    after: { label: 'Call after hours', caller: 'Is anyone available now?', reply: 'The team is offline. I can answer approved questions or prepare a callback with the context you share.', intent: 'After-hours enquiry', state: 'Coverage window closed', action: 'Next-window follow-up prepared', calendar: 'No calendar change', boundary: 'After-hours coverage is limited to approved information and callback preparation.' }
  };

  function initVoiceLab() {
    const root = $('[data-voicelab]');
    if (!root) return;
    let active = 'faq';
    let callState = 'idle';
    let connectTimer = 0;

    const el = {
      chips: $$('[data-vl-scenario]', root),
      log: $('[data-vl-log]', root),
      status: $('[data-vl-status]', root),
      intent: $('[data-vl-intent]', root),
      state: $('[data-vl-state]', root),
      action: $('[data-vl-action]', root),
      calendar: $('[data-vl-calendar]', root),
      boundary: $('[data-vl-boundary]', root),
      outcome: $('[data-vl-outcome]', root),
      start: $('[data-vl-start]', root),
      end: $('[data-vl-end]', root),
      report: $('[data-vl-report]', root)
    };

    const paintScenario = (key, announceIt = true) => {
      const s = VOICE_SCENARIOS[key];
      if (!s) return;
      active = key;
      el.chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.vlScenario === key)));
      renderCallLines(el.log, [
        ['sys', callState === 'connected' ? 'Simulated call · live' : 'Prepared scenario · no call placed'],
        ['caller', s.caller],
        ['arden', s.reply]
      ]);
      el.intent.textContent = s.intent;
      el.state.textContent = s.state;
      el.action.textContent = s.action;
      el.calendar.textContent = s.calendar;
      el.boundary.textContent = s.boundary;
      if (announceIt) announce(`${s.label} scenario loaded. Conversation, state and business action updated together.`);
    };

    const setCall = (state) => {
      callState = state;
      const labels = {
        idle: 'Ready · no real call',
        ringing: 'Ringing · simulated',
        connected: 'Connected · local simulation',
        ended: 'Ended · outcome recorded locally'
      };
      el.status.textContent = labels[state];
      root.querySelector('[data-vl-ui]')?.classList.toggle('is-live', state === 'connected');
      el.start.disabled = state === 'ringing' || state === 'connected';
      el.start.textContent = state === 'ended' ? 'Start another simulated call' : 'Start simulated call';
      el.end.disabled = state !== 'connected';
      if (el.report) el.report.disabled = state !== 'ended';
    };

    el.chips.forEach((chip) => chip.addEventListener('click', () => paintScenario(chip.dataset.vlScenario)));

    el.start.addEventListener('click', () => {
      window.clearTimeout(connectTimer);
      setCall('ringing');
      announce('Simulated phone ringing. No call is being placed.');
      connectTimer = window.setTimeout(() => {
        setCall('connected');
        paintScenario(active, false);
        announce('Local call simulation connected.');
      }, isReduced() ? 30 : 850);
    });

    el.end.addEventListener('click', () => {
      if (callState !== 'connected') return;
      setCall('ended');
      el.outcome.textContent = `${VOICE_SCENARIOS[active].action} · complete`;
      announce('Simulated call ended. Synthetic outcome recorded only in this page.');
    });

    el.report?.addEventListener('click', () => {
      const s = VOICE_SCENARIOS[active];
      const escape = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const rows = [
        ['Scenario', s.label], ['Caller said', s.caller], ['Arden replied', s.reply],
        ['Detected intent', s.intent], ['Operational state', s.state], ['Business action', s.action],
        ['Human boundary', s.boundary], ['Calendar effect', s.calendar],
        ['Recorded outcome', el.outcome.textContent], ['Call state at export', callState]
      ];
      const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Arden call report — ${escape(s.label)}</title>
<style>body{margin:0;padding:48px 40px;background:#fff;color:#10151d;font:15px/1.6 ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:760px;margin:0 auto}.mark{display:flex;align-items:center;gap:10px;margin-bottom:34px;font-weight:600;font-size:18px}
.mark span{width:10px;height:13px;background:#1C3F8A;box-shadow:0 3px 0 0 #D4A437}
h1{margin:0 0 6px;font-size:30px;letter-spacing:-0.02em}.sub{margin:0 0 30px;color:#5b6472;font-size:13px}
table{width:100%;border-collapse:collapse}th,td{padding:12px 0;border-bottom:1px solid #e3e6ea;text-align:left;vertical-align:top}
th{width:210px;color:#5b6472;font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:0.09em}
.note{margin-top:32px;padding:16px 18px;border:1px solid #e3e6ea;background:#f7f8f9;color:#3c4450;font-size:13px}
.foot{margin-top:26px;color:#5b6472;font-size:12px}</style></head><body><div class="wrap">
<div class="mark"><span></span>Bluerook</div><h1>Arden call report</h1>
<p class="sub">Generated ${escape(new Date().toLocaleString())} · capability prototype</p>
<table><tbody>${rows.map(([k, v]) => `<tr><th>${escape(k)}</th><td>${escape(v)}</td></tr>`).join('')}</tbody></table>
<p class="note"><strong>What this is.</strong> A local demonstration of how a voice interaction resolves into
operational state and an owned next action. The conversation above is a prepared scenario. No telephone call was
placed, no customer system was connected, no recording was made and no real record was created.</p>
<p class="foot">Bluerook · hatim@bluerook.co · bluerook.co</p></div></body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = doc.createElement('a');
      link.href = url;
      link.download = `bluerook-arden-call-report-${active}.html`;
      doc.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce('Call report downloaded. It contains only the synthetic state shown on this page.');
    });

    const reset = () => {
      window.clearTimeout(connectTimer);
      callState = 'idle';
      el.outcome.textContent = 'No outcome recorded';
      setCall('idle');
      paintScenario('faq', false);
    };
    $('[data-vl-reset]', root)?.addEventListener('click', () => { reset(); announce('Arden prototype reset.'); });
    reset();
  }

  function initStages() {
    $$('[data-stage]').forEach((stage) => {
      const script = STAGE_SCRIPTS[stage.dataset.stage];
      const console_ = $('[data-console]', stage);
      const beats = $$('.pf-beat', stage);
      if (!script || !console_ || !beats.length) return;

      const stream = $('[data-stream]', console_);
      const stepLabel = $('[data-console-step]', console_);
      let current = -1;

      const paint = (index) => {
        if (index === current) return;
        current = index;
        const frame = script[index];
        console_.dataset.beatState = String(index);

        beats.forEach((beat, i) => beat.classList.toggle('is-live', i === index));
        if (stepLabel) stepLabel.textContent = `0${index + 1} / 0${script.length}`;

        const applier = STAGE_APPLIERS[stage.dataset.stage];
        if (applier) applier(console_, frame, (selector) => $(selector, console_), index);

        if (stream) {
          stream.replaceChildren();
          frame.stream.forEach(([text, cls]) => {
            const line = doc.createElement('i');
            if (cls) line.className = cls;
            line.textContent = text;
            stream.append(line);
          });
        }
      };

      paint(0);

      // Pick the beat nearest the reading line. Cheap, and it works identically
      // whether the visitor scrolls, drags the bar, or jumps with a keyboard.
      const choose = () => {
        const line = window.innerHeight * 0.42;
        let best = 0;
        let bestDistance = Infinity;
        beats.forEach((beat, i) => {
          const rect = beat.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - line);
          if (distance < bestDistance) { bestDistance = distance; best = i; }
        });
        paint(best);
      };

      /* Four rect reads per event is cheap enough to run inline. An rAF throttle
         here would latch permanently if a frame never arrives (background tab,
         headless render), leaving the stage frozen on its first beat. */
      window.addEventListener('scroll', choose, { passive: true });
      window.addEventListener('resize', choose, { passive: true });
      choose();
    });
  }

  /* ═══════════ Boot ═══════════ */
  function boot() {
    [
      ['lenis', initLenis], ['ambient', initAmbient], ['particles', initParticles],
      ['split', initSplit], ['reveals', initReveals], ['statements', initStatements],
      ['progress', initProgress], ['marquee', initMarquee], ['menu', initMenu],
      ['nav', initNav], ['sync', initSync], ['journey', initJourney],
      ['flow', initFlow], ['scan', initScan], ['live channels', initLiveChannels],
      ['chat', initChat], ['shop lab', initShopLab], ['description lab', initDescLab],
      ['enrollment lab', initEnrollLab], ['gap lab', initGapLab],
      ['voice lab', initVoiceLab], ['board', initBoard], ['handoff queue', initHandq],
      ['deck', initDeck], ['countups', initCountups],
      ['ripple', initRipple], ['stagger', initStagger], ['pointer motion', initPointerMotion],
      ['cinema', initCinema], ['strip', initStrip], ['stages', initStages]
    ].forEach(([name, fn]) => safe(name, fn));
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
