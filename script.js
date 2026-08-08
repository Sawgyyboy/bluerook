/* =========================================================
   BLUEROOK — Motion layer
   - heavy  ( >1024px ): full GSAP + Lenis + ScrollTriggers + particles + tilt
   - light  ( 769–1024 ): Lenis + GSAP fades + castling
   - mobile (  ≤768   ): native scroll + one-shot IntersectionObserver motion
   ========================================================= */

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = window.innerWidth;

  /*
   * Phones use one native document scroll. Translated rails and pinned workflow
   * stories both failed the real-device test: they hid context, made sections
   * feel cropped, and asked Safari to composite too much while the page moved.
   */
  const MOBILE_SCROLL_TRACKS = false;

  let tier = 'heavy';
  if (W <= 768)  tier = 'mobile';
  else if (W <= 1024) tier = 'light';
  if (prefersReduced) tier = 'mobile';

  document.body.classList.add('js-' + tier);

  /* ---------- Loading screen ---------- */
  const loaderStart = performance.now();
  let loaderSeen = false;
  let loaderHideStarted = false;
  try { loaderSeen = sessionStorage.getItem('bluerook-loader-seen') === 'true'; } catch (e) {}
  const MIN_LOADER_MS = prefersReduced ? 0 : (loaderSeen ? 0 : 900);
  const hideLoader = () => {
    const l = document.querySelector('[data-loader]');
    if (!l || loaderHideStarted) return;
    loaderHideStarted = true;
    const elapsed = performance.now() - loaderStart;
    const wait = Math.max(0, MIN_LOADER_MS - elapsed);
    setTimeout(() => {
      l.classList.add('is-hidden');
      try { sessionStorage.setItem('bluerook-loader-seen', 'true'); } catch (e) {}
      setTimeout(() => l.remove(), 700);
    }, wait);
  };
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);
  // Third-party fonts or embeds must never leave the local/public page behind
  // the intro overlay when their load event is slow or unavailable.
  setTimeout(hideLoader, Math.max(1200, MIN_LOADER_MS + 600));

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

  const onLoad = (fn) => {
    if (document.readyState === 'complete') fn();
    else window.addEventListener('load', fn);
  };

  if (tier === 'mobile') {
    // Mobile exits before GSAP registration. Motion acknowledges each chapter
    // once; it never scrubs transforms against the document scroll position.
    const initMobileMotion = () => {
      initMobileCastlingMoment();
      initMobileDiagnosis();
      initMobileNarrativeMotion();
    };

    // Returning visitors should never see content flash visible, disappear, and
    // reveal again. Because this deferred script runs after parsing, setting the
    // ready state here still happens before first paint in the usual path.
    if (loaderSeen || prefersReduced) {
      initMobileMotion();
    } else {
      // On a first visit, begin the reveal as the branded loader hands off.
      setTimeout(initMobileMotion, Math.max(80, MIN_LOADER_MS + 80));
    }

    onLoad(() => {
      setTimeout(() => {
        initMobileServicesAccordion();
        initMobileProcessAccordion();
        initMobileServiceTheatre();
        initMobileStackTheatres();
      }, 100);
    });
    return;
  }

  /* ---------- GSAP — TABLET + DESKTOP ---------- */
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
     UNIVERSAL — every tier, no GSAP cost
     ========================================================== */
  function initUniversal() {
    // Privileges accordion (works on every tier, no GSAP needed)
    initPrivileges();
    initSystemsFloor();
    initVoiceTrial();

    // Nav scroll state
    const nav = document.querySelector('[data-nav]');
    if (nav) {
      const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Re-apply deep links after pinned-scroll geometry has been measured.
    // Without this, loading directly on #voice-trial can land inside Services.
    if (window.location.hash) {
      window.addEventListener('load', () => {
        window.setTimeout(() => {
          const target = document.querySelector(window.location.hash);
          if (!target) return;
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
          target.scrollIntoView({ block: 'start', behavior: 'auto' });
        }, 700);
      }, { once: true });
    }

    // Theme toggle now lives in js/nav.js so every page shares one handler.
    // Binding it here too would toggle twice per click and cancel itself out.

    // Mobile hamburger
    const menuBtn    = document.querySelector('[data-menu-toggle]');
    const menuClose  = document.querySelector('[data-menu-close]');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (menuBtn && mobileMenu) {
      const openMenu = () => {
        mobileMenu.classList.add('is-open');
        mobileMenu.removeAttribute('inert');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        if (menuClose) menuClose.focus();
      };
      const closeMenu = () => {
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('inert', '');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        menuBtn.focus();
      };
      menuBtn.addEventListener('click', () => {
        mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
      });
      if (menuClose) menuClose.addEventListener('click', closeMenu);
      mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
      window.addEventListener('keydown', e => {
        if (!mobileMenu.classList.contains('is-open')) return;
        if (e.key === 'Escape') {
          closeMenu();
          return;
        }
        if (e.key !== 'Tab') return;
        const focusable = Array.from(
          mobileMenu.querySelectorAll('a[href], button:not([disabled])')
        ).filter(element => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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

  /* ---------- Systems floor — blueprint switching + scroll handoff ---------- */
  function initSystemsFloor() {
    const root = document.querySelector('[data-systems]');
    if (!root) return;

    const viewport = root.querySelector('[data-system-viewport]');
    const selectors = Array.from(root.querySelectorAll('[data-system-select]'));
    if (!viewport || !selectors.length) return;

    const blueprints = {
      reception: {
        status: 'Illustrative blueprint · inbound coverage',
        pattern: 'Routing tree · three outcomes',
        role: 'Own every inbound enquiry',
        control: 'Exceptions and sensitive actions',
        complete: 'Booked, routed, or logged',
        nodes: {
          trigger: ['Incoming call', 'Voice · web · after-hours'],
          context: ['Knowledge + caller', 'Services · history · source'],
          agent: ['Reception controller', 'Answer · qualify · route'],
          approval: ['Approval gate', 'Escalate sensitive requests'],
          action: ['Book or route', 'Calendar · SMS · transfer'],
          record: ['CRM updated', 'Summary · owner · next step'],
        },
      },
      speed: {
        status: 'Illustrative blueprint · response clock',
        pattern: 'Three-source fan-in · parallel response',
        role: 'Respond while intent is warm',
        control: 'Pricing and qualification boundaries',
        complete: 'Contacted, qualified, and assigned',
        nodes: {
          trigger: ['New lead captured', 'Form · ad · referral'],
          context: ['Enrich the lead', 'Source · company · prior activity'],
          agent: ['Speed-to-lead operator', 'Personalize · contact · qualify'],
          approval: ['Commercial guardrail', 'Protect claims and pricing'],
          action: ['Start outreach', 'Voice · SMS · email'],
          record: ['Pipeline advanced', 'Owner · stage · next action'],
        },
      },
      activation: {
        status: 'Illustrative blueprint · dormant segment',
        pattern: 'Consent-gated sequence · timed loop',
        role: 'Reopen qualified dormant demand',
        control: 'Consent, suppression, and offer rules',
        complete: 'Replied, booked, or suppressed',
        nodes: {
          trigger: ['Activation window', 'Dormant lead · event · segment'],
          context: ['Rebuild context', 'History · objections · last touch'],
          agent: ['Activation operator', 'Segment · personalize · follow up'],
          approval: ['Campaign controls', 'Consent · offer · frequency'],
          action: ['Run sequence', 'Voice · SMS · email'],
          record: ['Lifecycle updated', 'Reply · reason · next step'],
        },
      },
      crm: {
        status: 'Illustrative blueprint · synchronized workspace',
        pattern: 'Command hub · protected write fan-out',
        role: 'Keep the CRM operationally true',
        control: 'Destructive edits and sensitive fields',
        complete: 'Record, task, and owner aligned',
        nodes: {
          trigger: ['Team request', 'Chat command · event · schedule'],
          context: ['Resolve the record', 'Account · contact · open work'],
          agent: ['CRM operations agent', 'Find · update · assign · follow'],
          approval: ['Change control', 'Delete · merge · sensitive data'],
          action: ['Execute workflow', 'Update · task · notify'],
          record: ['Audit trail written', 'Before · after · operator'],
        },
      },
      chat: {
        status: 'Illustrative blueprint · approved knowledge',
        pattern: 'Retrieval tree · confidence split',
        role: 'Resolve questions and capture intent',
        control: 'Low-confidence answers and escalation',
        complete: 'Answered, handed off, or booked',
        nodes: {
          trigger: ['Visitor message', 'Website · portal · campaign'],
          context: ['Retrieve knowledge', 'Approved pages · account context'],
          agent: ['Website service agent', 'Answer · qualify · guide'],
          approval: ['Confidence gate', 'Unknown · sensitive · high value'],
          action: ['Resolve or hand off', 'Answer · ticket · booking'],
          record: ['Conversation logged', 'Intent · summary · source'],
        },
      },
      dashboard: {
        status: 'Illustrative blueprint · normalized events',
        pattern: 'Data pipeline · decision outputs',
        role: 'Turn operations into decision signals',
        control: 'Thresholds and escalation ownership',
        complete: 'Briefed, assigned, or escalated',
        nodes: {
          trigger: ['System events', 'CRM · calls · workflows · revenue'],
          context: ['Normalize signals', 'Definitions · windows · owners'],
          agent: ['Reporting operator', 'Measure · explain · prioritize'],
          approval: ['Decision threshold', 'Material exceptions only'],
          action: ['Publish the brief', 'Dashboard · digest · alert'],
          record: ['Decision log', 'Metric · owner · due date'],
        },
      },
    };

    /*
     * Each system owns a distinct architecture. Node coordinates are
     * percentages of the canvas box. Connections are declared as
     * [from, to] node indexes and the wires are generated at render time from
     * the measured node boxes, so a blueprint stays correct at any canvas
     * size — and can be re-laid out as a vertical stack on phones.
     */
    const maps = {
      reception: {
        nodes: [
          ['Trigger', 'Incoming call', 'Phone · web · after-hours', 3, 38, 'trigger'],
          ['Context', 'Caller + knowledge', 'CRM history · services · rules', 23, 12, 'context'],
          ['AI System VA', 'Reception controller', 'Answer · qualify · classify', 42, 38, 'agent'],
          ['Action', 'Qualified enquiry', 'Calendar · confirmation · SMS', 71, 7, 'action'],
          ['Action', 'Known department', 'Warm transfer · owner alert', 75, 38, 'action'],
          ['Human control', 'Sensitive request', 'Complaint · pricing · urgency', 53, 72, 'control'],
          ['Record', 'CRM + call log', 'Summary · outcome · next step', 80, 71, 'record'],
        ],
        edges: [[0, 1], [1, 2], [2, 3], [2, 4], [2, 5], [3, 6], [4, 6], [5, 6]],
      },
      speed: {
        nodes: [
          ['Trigger', 'Website form', 'Intent · page · offer', 2, 7, 'trigger'],
          ['Trigger', 'Paid lead', 'Campaign · creative · source', 2, 38, 'trigger'],
          ['Trigger', 'Referral', 'Partner · note · priority', 2, 69, 'trigger'],
          ['Logic', 'Dedupe + enrich', 'Identity · company · territory', 25, 38, 'context'],
          ['AI System VA', 'Response operator', 'Personalize · contact · qualify', 47, 38, 'agent'],
          ['Control', 'Commercial rules', 'Claims · pricing · exclusions', 48, 7, 'control'],
          ['Channel router', 'Parallel first touch', 'Voice · SMS · email', 69, 38, 'action'],
          ['Handoff', 'Qualified lead', 'Owner · SLA · meeting', 83, 7, 'action'],
          ['Record', 'No response', 'Follow-up clock · next attempt', 83, 69, 'record'],
        ],
        edges: [[0, 3], [1, 3], [2, 3], [3, 4], [5, 4], [4, 6], [6, 7], [6, 8]],
      },
      activation: {
        nodes: [
          ['Trigger', 'Activation window', '90 days quiet · new offer', 3, 38, 'trigger'],
          ['Audience logic', 'Dormant pool', 'Stage · value · last outcome', 22, 38, 'context'],
          ['Hard gate', 'Consent + suppression', 'Opt-out · frequency · region', 41, 7, 'control'],
          ['AI System VA', 'Activation operator', 'Rebuild context · personalize', 42, 42, 'agent'],
          ['Sequence', 'Timed outreach', 'Email → wait → SMS → wait', 64, 42, 'action'],
          ['Branch', 'Reply detected', 'Positive · objection · stop', 79, 12, 'action'],
          ['Completion', 'Meeting or handoff', 'Calendar · owner · context', 83, 42, 'record'],
          ['Completion', 'Suppressed', 'Reason · date · audit trail', 79, 72, 'record'],
        ],
        edges: [[0, 1], [1, 2], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7]],
      },
      crm: {
        nodes: [
          ['Trigger', 'Team command', 'Chat · voice note · form', 2, 14, 'trigger'],
          ['Trigger', 'System event', 'Call ended · email · stage', 2, 63, 'trigger'],
          ['Identity', 'Resolve CRM record', 'Contact · account · opportunity', 23, 39, 'context'],
          ['AI System VA', 'CRM operations agent', 'Interpret · validate · plan', 44, 39, 'agent'],
          ['Human control', 'Protected change', 'Merge · delete · sensitive field', 46, 7, 'control'],
          ['Action', 'Update record', 'Fields · stage · summary', 68, 8, 'action'],
          ['Action', 'Create next work', 'Task · owner · due date', 69, 39, 'action'],
          ['Action', 'Notify owner', 'Context · priority · link', 68, 70, 'action'],
          ['Audit', 'Traceable change log', 'Before · after · source · actor', 85, 39, 'record'],
        ],
        edges: [[0, 2], [1, 2], [2, 3], [4, 3], [3, 5], [3, 6], [3, 7], [5, 8], [6, 8], [7, 8]],
      },
      chat: {
        nodes: [
          ['Trigger', 'Visitor message', 'Website · portal · campaign', 3, 39, 'trigger'],
          ['Classifier', 'Intent + risk', 'Question · sales · support', 22, 39, 'context'],
          ['Knowledge', 'Approved retrieval', 'Pages · policy · account context', 40, 7, 'context'],
          ['AI System VA', 'Website service agent', 'Answer · qualify · guide', 42, 42, 'agent'],
          ['Decision', 'Confidence gate', 'Grounded · unknown · sensitive', 63, 42, 'control'],
          ['Completion', 'Answer visitor', 'Cited source · next step', 81, 7, 'action'],
          ['Completion', 'Qualified intent', 'Booking page · summary', 81, 38, 'action'],
          ['Human handoff', 'Escalate safely', 'Ticket · context · urgency', 81, 70, 'control'],
          ['Record', 'Conversation log', 'Intent · confidence · outcome', 63, 75, 'record'],
        ],
        edges: [[0, 1], [1, 2], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [4, 8]],
      },
      dashboard: {
        nodes: [
          ['Source', 'CRM events', 'Stage · activity · owner', 2, 6, 'trigger'],
          ['Source', 'Call outcomes', 'Intent · disposition · duration', 2, 38, 'trigger'],
          ['Source', 'Workflow runs', 'Success · latency · exception', 2, 70, 'trigger'],
          ['Data layer', 'Normalize + validate', 'Definitions · windows · quality', 24, 39, 'context'],
          ['Data layer', 'Operations model', 'Metrics · events · ownership', 42, 10, 'record'],
          ['AI System VA', 'Reporting operator', 'Measure · explain · prioritize', 44, 51, 'agent'],
          ['Control', 'Decision thresholds', 'Materiality · owner · urgency', 63, 12, 'control'],
          ['Output', 'Live dashboard', 'Health · trend · queue', 81, 6, 'action'],
          ['Output', 'Operator brief', 'What changed · what matters', 81, 38, 'action'],
          ['Exception', 'Escalation alert', 'Owner · evidence · due time', 81, 70, 'control'],
          ['Record', 'Decision log', 'Action · owner · due date', 64, 77, 'record'],
        ],
        edges: [[0, 3], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6], [6, 7], [6, 8], [6, 9], [5, 10]],
      },
    };

    /*
     * Mobile keeps the same operational truth without squeezing an entire
     * desktop architecture into a phone. Each system is reduced to the
     * decisions a founder needs to understand: signal, context, operator,
     * control, outcomes, and record. Branches live inside a stage as compact
     * outcome chips instead of becoming another column of tiny nodes.
     */
    const mobileMaps = {
      reception: {
        shape: 'routing',
        stages: [
          { type: 'Signal', title: 'Incoming enquiry', detail: 'Voice · web · after-hours', tone: 'trigger' },
          { type: 'AI System VA', title: 'Answer and qualify', detail: 'Intent · identity · urgency', tone: 'agent' },
          {
            type: 'Routing',
            title: 'Choose the safe outcome',
            detail: 'Rules decide the next owned action.',
            tone: 'action',
            chips: ['Book', 'Transfer', 'Escalate'],
          },
          { type: 'Record', title: 'CRM + call log', detail: 'Summary · outcome · next step', tone: 'record' },
        ],
      },
      speed: {
        shape: 'fan-in',
        stages: [
          {
            type: 'Signals',
            title: 'New lead captured',
            detail: 'Three sources enter one response clock.',
            tone: 'trigger',
            chips: ['Form', 'Paid lead', 'Referral'],
          },
          { type: 'Context', title: 'Dedupe + enrich', detail: 'Identity · company · territory', tone: 'context' },
          { type: 'AI System VA', title: 'Personalize and qualify', detail: 'Commercial rules stay protected.', tone: 'agent' },
          {
            type: 'Parallel action',
            title: 'Start the first touch',
            detail: 'Contact begins while intent is warm.',
            tone: 'action',
            chips: ['Voice', 'SMS', 'Email'],
          },
          {
            type: 'Completion',
            title: 'Advance or continue',
            detail: 'Every lead keeps an owner and next action.',
            tone: 'record',
            chips: ['Qualified', 'Follow-up'],
          },
        ],
      },
      activation: {
        shape: 'gated-loop',
        stages: [
          { type: 'Segment', title: 'Dormant opportunity', detail: 'Stage · value · last outcome', tone: 'trigger' },
          { type: 'Hard gate', title: 'Consent + suppression', detail: 'Opt-out · frequency · region', tone: 'control' },
          { type: 'AI System VA', title: 'Rebuild the context', detail: 'Personalize from approved CRM history.', tone: 'agent' },
          {
            type: 'Timed sequence',
            title: 'Run the controlled loop',
            detail: 'Stop immediately when intent changes.',
            tone: 'action',
            chips: ['Email', 'Wait', 'SMS'],
          },
          {
            type: 'Outcome',
            title: 'Close the loop',
            detail: 'The lifecycle record stays current.',
            tone: 'record',
            chips: ['Book', 'Handoff', 'Suppress'],
          },
        ],
      },
      crm: {
        shape: 'protected-write',
        stages: [
          {
            type: 'Command',
            title: 'Operational request',
            detail: 'People and systems can request work.',
            tone: 'trigger',
            chips: ['Chat', 'Event', 'Schedule'],
          },
          { type: 'Context', title: 'Resolve the CRM record', detail: 'Contact · account · open work', tone: 'context' },
          { type: 'AI System VA', title: 'Interpret and validate', detail: 'Plan the changes before writing.', tone: 'agent' },
          { type: 'Human control', title: 'Protect sensitive changes', detail: 'Merge · delete · restricted fields', tone: 'control' },
          {
            type: 'Execution + audit',
            title: 'Write the owned outcome',
            detail: 'Changes are designed to leave a traceable audit record.',
            tone: 'record',
            chips: ['Update', 'Task', 'Notify', 'Log'],
          },
        ],
      },
      chat: {
        shape: 'confidence-split',
        stages: [
          { type: 'Signal', title: 'Visitor message', detail: 'Website · portal · campaign', tone: 'trigger' },
          { type: 'Knowledge', title: 'Retrieve approved context', detail: 'Pages · policy · account history', tone: 'context' },
          { type: 'AI System VA', title: 'Answer and qualify', detail: 'Ground the response before sending.', tone: 'agent' },
          { type: 'Decision', title: 'Confidence gate', detail: 'Unknown and sensitive requests stop here.', tone: 'control' },
          {
            type: 'Completion',
            title: 'Resolve the intent',
            detail: 'The full conversation is logged.',
            tone: 'record',
            chips: ['Answer', 'Book', 'Handoff'],
          },
        ],
      },
      dashboard: {
        shape: 'decision-pipeline',
        stages: [
          {
            type: 'Event stream',
            title: 'Operational signals',
            detail: 'The live stack enters one data layer.',
            tone: 'trigger',
            chips: ['CRM', 'Calls', 'Workflows', 'Revenue'],
          },
          { type: 'Data layer', title: 'Normalize + validate', detail: 'Definitions · windows · quality', tone: 'context' },
          { type: 'Operations model', title: 'Measure what matters', detail: 'Metrics retain owners and meaning.', tone: 'record' },
          { type: 'AI System VA', title: 'Explain and prioritize', detail: 'Thresholds surface material exceptions.', tone: 'agent' },
          {
            type: 'Decision outputs',
            title: 'Publish the next move',
            detail: 'Every signal becomes visible work.',
            tone: 'action',
            chips: ['Dashboard', 'Brief', 'Escalate', 'Decision log'],
          },
        ],
      },
    };

    const canvas = root.querySelector('[data-system-canvas]');
    const rail = root.querySelector('.systems__catalog');
    const stackQuery = window.matchMedia('(max-width: 768px)');
    const mobileStoryQuery = window.matchMedia(
      '(max-width: 768px) and (min-height: 640px) and (orientation: portrait)'
    );
    // Matches the width at which the blueprint is pinned beside the titles.
    const pinnedQuery = window.matchMedia('(min-width: 1200px) and (min-height: 740px)');
    /*
     * Phones use a single pinned systems stage with discrete scroll sentinels.
     * The document still owns the vertical gesture; there is no nested scroller
     * and no transform is rewritten on every scroll frame.
     */
    const mobileStoryEnabled = () => mobileStoryQuery.matches && !prefersReduced;
    const isStacked = () => stackQuery.matches;

    /* A title must win the guide line by this much, and hold it this long,
       before the pinned blueprint commits to it. Fast scrolls therefore pass
       over titles instead of strobing six architectures in one flick. */
    const DWELL_MS = 150;
    const MAX_HOLD_MS = 460;
    const HYSTERESIS_PX = 28;

    let activeKey = 'reception';
    let renderedKey = null;
    let renderedMode = null;
    let switchTimer = null;
    let scrollFrame = null;
    let dwellTimer = null;
    let pendingKey = null;
    let pendingSince = 0;
    let lastCommit = 0;
    let suppressUntil = 0;
    let mobileStory = null;
    let mobileReadout = null;
    let mobileReelTrack = null;
    let mobileInspector = null;
    let mobileStoryObserver = null;

    const ROOK_MARK =
      '<svg viewBox="0 0 100 115">' +
      '<path d="M 26,0 L 32,0 L 32,14 L 40,14 L 40,0 L 46,0 L 46,14 L 54,14 L 54,0 L 60,0 L 60,14 L 68,14 L 68,0 L 74,0 L 74,26 L 90,94 L 96,94 L 96,104 L 4,104 L 4,94 L 10,94 L 26,26 Z"/>' +
      '<rect x="4" y="111" width="92" height="4"/>' +
      '</svg>';

    const setText = (selector, value) => {
      const element = root.querySelector(selector);
      if (element) element.textContent = value;
    };

    const nodeMarkup = ([type, title, detail, x, y, tone], positioned, order = 0) => `
      <article class="system-node system-node--${tone}${positioned ? '' : ' system-node--flow'}"${
        positioned
          ? ` style="--node-x:${x}%;--node-y:${y}%"`
          : ` style="--node-order:${order}" role="button" tabindex="0" aria-label="${type}: ${title}. ${detail}"`}>
        ${tone === 'agent'
          ? `<div class="system-node__agent-mark" aria-hidden="true">${ROOK_MARK}</div>`
          : ''}
        <span class="system-node__type">${type}</span>
        <strong>${title}</strong>
        <small>${detail}</small>
        ${tone === 'agent' ? '<span class="system-node__run"><i aria-hidden="true"></i> Processing</span>' : ''}
      </article>`;

    /* Wires are derived from where the nodes actually landed, so the canvas
       can be any size without the architecture drifting off its ports. */
    const drawWires = () => {
      if (!canvas || canvas.dataset.mode !== 'canvas') return;
      const svg = canvas.querySelector('.systems__wires');
      const map = maps[renderedKey];
      const nodes = Array.from(canvas.querySelectorAll('.system-node'));
      if (!svg || !map || nodes.length !== map.nodes.length) return;

      const frame = canvas.getBoundingClientRect();
      if (frame.width < 4 || frame.height < 4) return;

      const round = value => Math.round(value * 10) / 10;
      const boxes = nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left - frame.left,
          right: rect.right - frame.left,
          top: rect.top - frame.top,
          bottom: rect.bottom - frame.top,
          cx: rect.left - frame.left + rect.width / 2,
          cy: rect.top - frame.top + rect.height / 2,
        };
      });

      const ports = [];
      const wires = map.edges.map(([from, to]) => {
        const a = boxes[from];
        const b = boxes[to];
        if (!a || !b) return '';
        let x1;
        let y1;
        let x2;
        let y2;
        let d;
        if (b.left >= a.right - 4) {
          // Clear horizontal run: leave the right face, enter the left face.
          x1 = a.right; y1 = a.cy; x2 = b.left; y2 = b.cy;
          const bend = Math.max(34, (x2 - x1) * 0.55);
          d = `M${round(x1)} ${round(y1)} C${round(x1 + bend)} ${round(y1)} ${round(x2 - bend)} ${round(y2)} ${round(x2)} ${round(y2)}`;
        } else if (b.cy > a.cy) {
          // Drop to a branch that sits underneath — gate, exception, record.
          x1 = a.cx; y1 = a.bottom; x2 = b.cx; y2 = b.top;
          const bend = Math.max(26, (y2 - y1) * 0.62);
          d = `M${round(x1)} ${round(y1)} C${round(x1)} ${round(y1 + bend)} ${round(x2)} ${round(y2 - bend)} ${round(x2)} ${round(y2)}`;
        } else {
          // Rise into a control or model that sits above the operator.
          x1 = a.cx; y1 = a.top; x2 = b.cx; y2 = b.bottom;
          const bend = Math.max(26, (y1 - y2) * 0.62);
          d = `M${round(x1)} ${round(y1)} C${round(x1)} ${round(y1 - bend)} ${round(x2)} ${round(y2 + bend)} ${round(x2)} ${round(y2)}`;
        }
        ports.push(`<circle class="system-port" cx="${round(x1)}" cy="${round(y1)}" r="3"/>`);
        ports.push(`<circle class="system-port system-port--in" cx="${round(x2)}" cy="${round(y2)}" r="2.4"/>`);
        return `<path class="system-wire" d="${d}"/>`;
      });

      svg.setAttribute('viewBox', `0 0 ${round(frame.width)} ${round(frame.height)}`);
      svg.innerHTML = wires.join('') + ports.join('');
    };

    const systemKeys = selectors
      .map(button => button.dataset.systemSelect)
      .filter(key => key && maps[key] && blueprints[key]);

    const selectorCopy = (key, selector) => {
      const button = selectors.find(item => item.dataset.systemSelect === key);
      return button?.querySelector(selector)?.textContent.trim() || '';
    };

    const mobileStageMarkup = (stage, order) => `
      <article
        class="system-node system-node--${stage.tone} system-node--flow"
        style="--node-order:${order}"
        role="button"
        tabindex="0"
        aria-label="${stage.type}: ${stage.title}. ${stage.detail}"
      >
        ${stage.tone === 'agent'
          ? `<div class="system-node__agent-mark" aria-hidden="true">${ROOK_MARK}</div>`
          : ''}
        <span class="system-node__type">${stage.type}</span>
        <strong>${stage.title}</strong>
        <small>${stage.detail}</small>
        ${stage.chips?.length
          ? `<span class="system-node__chips" aria-hidden="true">${stage.chips.map(chip => `<i>${chip}</i>`).join('')}</span>`
          : ''}
      </article>`;

    const mobileBlueprintMarkup = (key, index) => {
      const mobileMap = mobileMaps[key];
      const blueprint = blueprints[key];
      const rows = mobileMap.stages
        .map((stage, stageIndex) => `
          <li class="systems__flow-row" data-stage="${stageIndex + 1}">
            ${mobileStageMarkup(stage, stageIndex)}
          </li>`)
        .join('<li class="systems__flow-link" aria-hidden="true"><i></i></li>');

      return `
        <section
          class="systems__blueprint${index === 0 ? ' is-active' : ''}"
          data-system-blueprint="${key}"
          data-mobile-shape="${mobileMap.shape}"
          aria-hidden="${index === 0 ? 'false' : 'true'}"
        >
          <header class="systems__blueprint-heading">
            <span>${String(index + 1).padStart(2, '0')} / ${String(systemKeys.length).padStart(2, '0')}</span>
            <div>
              <strong>${selectorCopy(key, 'strong')}</strong>
              <small>${selectorCopy(key, 'small')}</small>
            </div>
          </header>
          <p class="systems__flow-caption">${blueprint.pattern}</p>
          <ol class="systems__flow">${rows}</ol>
        </section>`;
    };

    const renderMobileBlueprints = (key) => {
      if (!canvas) return;
      if (canvas.dataset.mobileBlueprints !== 'ready') {
        canvas.innerHTML = systemKeys.map(mobileBlueprintMarkup).join('');
        canvas.dataset.mobileBlueprints = 'ready';
        root.classList.add('systems--mobile-blueprints');
      }

      const showEveryBlueprint = !mobileStoryEnabled();
      const activeIndex = Math.max(0, systemKeys.indexOf(key));
      canvas.querySelectorAll('[data-system-blueprint]').forEach(panel => {
        const isActive = panel.dataset.systemBlueprint === key;
        const panelIndex = systemKeys.indexOf(panel.dataset.systemBlueprint);
        panel.classList.toggle('is-active', isActive);
        panel.classList.toggle('is-before', panelIndex < activeIndex);
        panel.classList.toggle('is-after', panelIndex > activeIndex);
        panel.setAttribute('aria-hidden', String(!showEveryBlueprint && !isActive));
      });
    };

    const render = (key) => {
      const map = maps[key];
      const blueprint = blueprints[key];
      if (!canvas || !map || !blueprint) return;
      const stacked = isStacked();

      canvas.dataset.map = key;
      canvas.dataset.mode = stacked ? 'stack' : 'canvas';

      if (stacked) {
        renderMobileBlueprints(key);
      } else {
        delete canvas.dataset.mobileBlueprints;
        root.classList.remove('systems--mobile-blueprints', 'systems--story-ready');
        canvas.innerHTML = `
          <svg class="systems__wires" aria-hidden="true"></svg>
          ${map.nodes.map(node => nodeMarkup(node, true)).join('')}
          <span class="systems__map-signature" aria-hidden="true">${blueprint.pattern}</span>`;
      }

      renderedKey = key;
      renderedMode = canvas.dataset.mode;
      // Measure and wire in the same frame the nodes are written, so a switch
      // never shows a frame of nodes without their connections.
      if (!stacked) drawWires();
    };

    const centerSelector = (key) => {
      if (!rail || !isStacked()) return;
      const button = selectors.find(item => item.dataset.systemSelect === key);
      if (!button || rail.scrollWidth <= rail.clientWidth + 4) return;
      const offset = button.getBoundingClientRect().left - rail.getBoundingClientRect().left;
      const target = rail.scrollLeft + offset - (rail.clientWidth - button.offsetWidth) / 2;
      rail.scrollTo({
        left: Math.max(0, target),
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
    };

    const centerMobileReel = (key, instant = false) => {
      if (!mobileReelTrack) return;
      if (mobileStoryEnabled()) {
        mobileReelTrack.style.removeProperty('transform');
        mobileReelTrack.style.removeProperty('transition-duration');
        return;
      }
      const reelWindow = mobileReelTrack.parentElement;
      const active = mobileReelTrack.querySelector(`[data-system-reel-key="${key}"]`);
      if (!reelWindow || !active) return;
      const offset = reelWindow.clientWidth / 2 - (active.offsetLeft + active.offsetWidth / 2);
      mobileReelTrack.style.transitionDuration = instant ? '0ms' : '';
      mobileReelTrack.style.transform = `translate3d(${Math.round(offset)}px,0,0)`;
      if (instant) requestAnimationFrame(() => {
        mobileReelTrack.style.transitionDuration = '';
      });
    };

    const resetMobileInspector = (key) => {
      if (!mobileInspector) return;
      const title = mobileInspector.querySelector('[data-system-inspector-title]');
      const detail = mobileInspector.querySelector('[data-system-inspector-detail]');
      if (title) title.textContent = selectorCopy(key, 'strong');
      if (detail) detail.textContent = 'Tap a node to inspect its role in this workflow.';
    };

    const updateMobileStoryUI = (key) => {
      const index = Math.max(0, systemKeys.indexOf(key));
      if (mobileReadout) {
        const current = mobileReadout.querySelector('[data-system-mobile-current]');
        if (current) current.textContent = String(index + 1).padStart(2, '0');
        mobileReadout.style.setProperty('--system-progress', String((index + 1) / systemKeys.length));
        mobileReadout.querySelectorAll('[data-system-reel-key]').forEach((title, titleIndex) => {
          const isCurrent = titleIndex === index;
          const isPrevious = titleIndex === index - 1;
          const isNext = titleIndex === index + 1;
          title.classList.toggle('is-current', isCurrent);
          title.classList.toggle('is-prev', isPrevious);
          title.classList.toggle('is-next', isNext);
          title.classList.toggle('is-distant', !isCurrent && !isPrevious && !isNext);
          title.setAttribute('aria-current', isCurrent ? 'true' : 'false');
        });
        centerMobileReel(key);
        resetMobileInspector(key);
      }
      if (mobileStory) {
        mobileStory.querySelectorAll('[data-system-step]').forEach(step => {
          step.classList.toggle('is-current', step.dataset.systemStep === key);
        });
      }
    };

    const activate = (key) => {
      const blueprint = blueprints[key];
      if (!blueprint) return;
      const mode = isStacked() ? 'stack' : 'canvas';
      if (key === activeKey && renderedKey === key && renderedMode === mode) return;

      activeKey = key;
      pendingKey = null;
      lastCommit = performance.now();

      selectors.forEach(button => {
        const isActive = button.dataset.systemSelect === key;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
        const state = button.querySelector('.system-selector__state');
        if (state) state.textContent = isActive ? 'Selected' : 'View';
      });

      render(key);

      setText('[data-system-status]', blueprint.status);
      setText('[data-system-pattern]', blueprint.pattern);
      setText('[data-system-role]', blueprint.role);
      setText('[data-system-control]', blueprint.control);
      setText('[data-system-complete]', blueprint.complete);
      updateMobileStoryUI(key);

      viewport.classList.remove('is-switching');
      requestAnimationFrame(() => {
        viewport.classList.add('is-switching');
        clearTimeout(switchTimer);
        switchTimer = setTimeout(() => viewport.classList.remove('is-switching'), 260);
      });
    };

    const setupMobileStory = () => {
      const viewportWrap = root.querySelector('.systems__viewport-wrap');
      const topline = root.querySelector('.systems__viewport-topline');
      if (!viewportWrap || !topline || !systemKeys.length) return;

      mobileReadout = document.createElement('div');
      mobileReadout.className = 'systems__mobile-readout';
      mobileReadout.setAttribute('aria-label', 'Choose a system blueprint');
      mobileReadout.innerHTML = `
        <div class="systems__mobile-reel-window">
          <div class="systems__mobile-reel-track">
            ${systemKeys.map((key, index) => `
              <button
                class="systems__mobile-reel-title${index === 0 ? ' is-current' : ''}"
                type="button"
                data-system-reel-key="${key}"
                aria-current="${index === 0 ? 'true' : 'false'}"
              >
                <span>${String(index + 1).padStart(2, '0')}</span>
                ${selectorCopy(key, 'strong')}
              </button>`).join('')}
          </div>
        </div>
        <div class="systems__mobile-meter" aria-hidden="true">
          <span><b data-system-mobile-current>01</b> / ${String(systemKeys.length).padStart(2, '0')}</span>
          <i></i>
        </div>
        <div class="systems__mobile-inspector" aria-live="polite">
          <strong data-system-inspector-title>${selectorCopy(systemKeys[0], 'strong')}</strong>
          <span data-system-inspector-detail>Tap a node to inspect its role in this workflow.</span>
        </div>`;
      topline.insertAdjacentElement('afterend', mobileReadout);
      mobileReelTrack = mobileReadout.querySelector('.systems__mobile-reel-track');
      mobileInspector = mobileReadout.querySelector('.systems__mobile-inspector');

      mobileStory = document.createElement('ol');
      mobileStory.className = 'systems__mobile-story';
      mobileStory.setAttribute('aria-hidden', 'true');
      mobileStory.innerHTML = systemKeys.map((key, index) => `
        <li
          class="systems__mobile-step${index === 0 ? ' is-current' : ''}"
          data-system-step="${key}"
        >
          <span>${String(index + 1).padStart(2, '0')}</span>
        </li>`).join('');
      viewportWrap.insertAdjacentElement('afterend', mobileStory);

      mobileReadout.querySelectorAll('[data-system-reel-key]').forEach(button => {
        button.addEventListener('click', () => {
          const key = button.dataset.systemReelKey;
          const step = mobileStory?.querySelector(`[data-system-step="${key}"]`);
          if (!key || !step) return;
          const rect = step.getBoundingClientRect();
          const stageRect = viewportWrap.getBoundingClientRect();
          const guide = stageRect.top + stageRect.height * 0.52;
          const target = window.scrollY + rect.top + rect.height / 2 - guide;
          window.scrollTo({
            top: Math.max(0, target),
            behavior: prefersReduced ? 'auto' : 'smooth',
          });
          activate(key);
        });
      });

      /*
       * The phone stage commits one adjacent workflow at a time. Reading scroll
       * position is frame-coalesced, but no style is rewritten until a discrete
       * state wins both dwell and hysteresis. This prevents a single inertial
       * flick from strobing through several maps.
       */
      const mobileSteps = Array.from(mobileStory.querySelectorAll('[data-system-step]'));
      let mobileFrame = null;
      let mobileCandidate = null;
      let mobileCandidateSince = 0;
      let mobileDwellTimer = null;

      const syncMobileStory = () => {
        mobileFrame = null;
        if (!mobileStoryEnabled()) return;

        const stageRect = viewportWrap.getBoundingClientRect();
        const guide = stageRect.top + stageRect.height * 0.52;
        const activeIndex = Math.max(0, systemKeys.indexOf(activeKey));
        let nearestIndex = activeIndex;
        let nearestDistance = Number.POSITIVE_INFINITY;

        mobileSteps.forEach((step, index) => {
          const rect = step.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - guide);
          if (distance < nearestDistance) {
            nearestIndex = index;
            nearestDistance = distance;
          }
        });

        if (nearestIndex === activeIndex) {
          mobileCandidate = null;
          return;
        }

        const direction = Math.sign(nearestIndex - activeIndex);
        const candidateIndex = activeIndex + direction;
        const candidateStep = mobileSteps[candidateIndex];
        const activeStep = mobileSteps[activeIndex];
        if (!candidateStep || !activeStep) return;

        const activeRect = activeStep.getBoundingClientRect();
        const candidateRect = candidateStep.getBoundingClientRect();
        const activeDistance = Math.abs(activeRect.top + activeRect.height / 2 - guide);
        const candidateDistance = Math.abs(candidateRect.top + candidateRect.height / 2 - guide);
        if (activeDistance - candidateDistance < 34) {
          mobileCandidate = null;
          return;
        }

        const candidateKey = candidateStep.dataset.systemStep;
        const now = performance.now();
        if (candidateKey !== mobileCandidate) {
          mobileCandidate = candidateKey;
          mobileCandidateSince = now;
        }

        const dwellComplete = now - mobileCandidateSince >= 190;
        const transitionSettled = now - lastCommit >= 520;
        if (dwellComplete && transitionSettled) {
          activate(candidateKey);
          mobileCandidate = null;
          window.clearTimeout(mobileDwellTimer);
          mobileDwellTimer = window.setTimeout(requestMobileStorySync, 540);
          return;
        }

        window.clearTimeout(mobileDwellTimer);
        mobileDwellTimer = window.setTimeout(
          requestMobileStorySync,
          Math.max(60, 540 - (now - lastCommit)),
        );
      };

      function requestMobileStorySync() {
        if (mobileFrame !== null) return;
        mobileFrame = requestAnimationFrame(syncMobileStory);
      }

      window.addEventListener('scroll', requestMobileStorySync, { passive: true });
      window.addEventListener('resize', requestMobileStorySync, { passive: true });
      requestMobileStorySync();
    };

    const syncMobileStoryMode = () => {
      const enabled = isStacked() && mobileStoryEnabled();
      root.classList.toggle('systems--story-ready', enabled);
      if (canvas?.dataset.mode === 'stack') renderMobileBlueprints(activeKey);
    };

    selectors.forEach(button => {
      button.addEventListener('click', () => {
        const key = button.dataset.systemSelect;
        activate(key);
        if (!pinnedQuery.matches && !mobileStoryEnabled()) {
          if (isStacked()) {
            const panel = canvas?.querySelector(`[data-system-blueprint="${key}"]`);
            panel?.scrollIntoView({
              block: 'start',
              behavior: prefersReduced ? 'auto' : 'smooth',
            });
          } else {
            centerSelector(key);
          }
          return;
        }
        if (mobileStoryEnabled()) return;
        // Desktop: bring the chosen title to the guide line so the pinned
        // blueprint and the travelling list stay in agreement.
        const rect = button.getBoundingClientRect();
        const target = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
        suppressUntil = performance.now() + 900;
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(target, { duration: prefersReduced ? 0 : 0.8 });
        } else {
          window.scrollTo({ top: target, behavior: prefersReduced ? 'auto' : 'smooth' });
        }
      });
    });

    const syncSystemToScroll = () => {
      scrollFrame = null;
      if (!pinnedQuery.matches || isStacked()) return;

      const now = performance.now();
      if (now < suppressUntil) return;

      const guide = window.innerHeight / 2;
      const rootRect = root.getBoundingClientRect();
      if (rootRect.top > guide || rootRect.bottom < guide) return;

      let nearest = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      let activeDistance = Number.POSITIVE_INFINITY;
      selectors.forEach(button => {
        const rect = button.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - guide);
        if (button.dataset.systemSelect === activeKey) activeDistance = distance;
        if (distance < nearestDistance) {
          nearest = button;
          nearestDistance = distance;
        }
      });
      if (!nearest) return;

      const key = nearest.dataset.systemSelect;
      if (key === activeKey) {
        pendingKey = null;
        return;
      }
      // Ignore a candidate that has only just edged ahead of the current one.
      if (activeDistance - nearestDistance < HYSTERESIS_PX) {
        pendingKey = null;
        return;
      }

      if (key !== pendingKey) {
        pendingKey = key;
        pendingSince = now;
      }
      if (now - pendingSince >= DWELL_MS || now - lastCommit >= MAX_HOLD_MS) {
        activate(key);
        return;
      }
      // Scrolling may stop before the dwell elapses — re-check without it.
      clearTimeout(dwellTimer);
      dwellTimer = setTimeout(requestSystemSync, DWELL_MS + 20);
    };

    function requestSystemSync() {
      if (scrollFrame !== null) return;
      scrollFrame = requestAnimationFrame(syncSystemToScroll);
    }

    let pinnedScrollAttached = false;
    const syncPinnedScrollListener = () => {
      const shouldAttach = pinnedQuery.matches && !isStacked();
      if (shouldAttach === pinnedScrollAttached) return;
      pinnedScrollAttached = shouldAttach;
      if (shouldAttach) {
        window.addEventListener('scroll', requestSystemSync, { passive: true });
      } else {
        window.removeEventListener('scroll', requestSystemSync);
      }
    };

    const syncMode = () => {
      const mode = isStacked() ? 'stack' : 'canvas';
      if (mode !== renderedMode) render(activeKey);
      else drawWires();
      syncMobileStoryMode();
      syncPinnedScrollListener();
    };

    window.addEventListener('resize', () => {
      syncMode();
      requestSystemSync();
      if (mobileStoryEnabled()) centerMobileReel(activeKey, true);
    }, { passive: true });

    if (typeof stackQuery.addEventListener === 'function') {
      stackQuery.addEventListener('change', syncMode);
    }
    if (typeof mobileStoryQuery.addEventListener === 'function') {
      mobileStoryQuery.addEventListener('change', syncMode);
    }
    if (typeof pinnedQuery.addEventListener === 'function') {
      pinnedQuery.addEventListener('change', syncPinnedScrollListener);
    }
    if ('ResizeObserver' in window && canvas) {
      new ResizeObserver(() => drawWires()).observe(canvas);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(drawWires).catch(() => {});
    }

    if (mobileStoryEnabled()) setupMobileStory();

    if (canvas) {
      const inspectNode = (node) => {
        if (!mobileStoryEnabled() || !mobileInspector || !node) return;
        canvas.querySelectorAll('.system-node--flow.is-inspected').forEach(item => {
          item.classList.remove('is-inspected');
        });
        node.classList.add('is-inspected');
        const type = node.querySelector('.system-node__type')?.textContent.trim();
        const title = node.querySelector('strong')?.textContent.trim();
        const detail = node.querySelector('small')?.textContent.trim();
        const inspectorTitle = mobileInspector.querySelector('[data-system-inspector-title]');
        const inspectorDetail = mobileInspector.querySelector('[data-system-inspector-detail]');
        if (inspectorTitle) inspectorTitle.textContent = [type, title].filter(Boolean).join(' · ');
        if (inspectorDetail) inspectorDetail.textContent = detail || 'This node participates in the active workflow.';
      };
      canvas.addEventListener('click', event => {
        inspectNode(event.target.closest('.system-node--flow'));
      });
      canvas.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const node = event.target.closest('.system-node--flow');
        if (!node) return;
        event.preventDefault();
        inspectNode(node);
      });
    }

    activate('reception');
    syncMobileStoryMode();
    syncPinnedScrollListener();
    requestSystemSync();
    if (mobileStoryEnabled()) requestAnimationFrame(() => centerMobileReel(activeKey, true));
  }

  /* ---------- Voice trial — branded Retell Web SDK experience ---------- */
  function initVoiceTrial() {
    const root = document.querySelector('[data-voice-console]');
    const start = document.querySelector('[data-voice-start]');
    if (!root || !start) return;

    const state = root.querySelector('[data-voice-state]');
    const note = root.querySelector('[data-voice-note]');
    const startLabel = root.querySelector('[data-voice-start-label]');
    const consent = root.querySelector('[data-voice-consent]');
    const mute = root.querySelector('[data-voice-mute]');
    const end = root.querySelector('[data-voice-end]');
    const transcript = root.querySelector('[data-voice-transcript]');
    const connection = root.querySelector('[data-voice-connection]');
    const timer = root.querySelector('[data-voice-time]');
    // Keep the voice SDK out of the initial page workload. It is fetched only
    // after a visitor deliberately starts the trial.
    let sdkPromise = null;
    const loadVoiceSDK = () => {
      if (!sdkPromise) {
        sdkPromise = import('https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.8/+esm');
      }
      return sdkPromise;
    };
    let client;
    let elapsedTimer;
    let startedAt;
    let isMuted = false;
    let isLive = false;
    let voiceLevel = 0;
    let pendingVoiceTarget = 0;
    let voiceMeterFrame = null;
    const reduceVoiceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const setCopy = (headline, detail) => {
      if (state) state.textContent = headline;
      if (note) note.textContent = detail;
    };

    const updateTimer = () => {
      if (!timer || !startedAt) return;
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      timer.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
    };

    /*
     * Retell exposes Arden's playback as raw PCM when requested. Convert it to
     * a smoothed RMS level so the console moves with the voice being heard.
     */
    const resetVoiceMeter = () => {
      voiceLevel = 0;
      pendingVoiceTarget = 0;
      if (voiceMeterFrame !== null) {
        cancelAnimationFrame(voiceMeterFrame);
        voiceMeterFrame = null;
      }
      root.classList.remove('has-reactive-audio');
      root.style.removeProperty('--voice-level');
    };

    const updateVoiceMeter = (samples) => {
      if (
        reduceVoiceMotion.matches ||
        document.hidden ||
        !(samples instanceof Float32Array) ||
        !samples.length
      ) return;

      let energy = 0;
      let count = 0;
      for (let index = 0; index < samples.length; index += 4) {
        energy += samples[index] * samples[index];
        count += 1;
      }

      const rms = Math.sqrt(energy / Math.max(1, count));
      pendingVoiceTarget = Math.min(1, Math.max(0, (rms - 0.006) * 9));
      if (voiceMeterFrame !== null) return;
      voiceMeterFrame = requestAnimationFrame(() => {
        voiceMeterFrame = null;
        const smoothing = pendingVoiceTarget > voiceLevel ? 0.56 : 0.18;
        voiceLevel += (pendingVoiceTarget - voiceLevel) * smoothing;
        root.style.setProperty('--voice-level', voiceLevel.toFixed(3));
        root.classList.add('has-reactive-audio');
      });
    };

    /* Retell streams the transcript as an array of {role, content} turns.
       Render them as attributed lines instead of stringifying the array. */
    const speakerLabel = (role) => {
      const normalized = String(role || '').toLowerCase();
      if (normalized.includes('agent') || normalized.includes('assistant')) return 'Arden';
      if (normalized.includes('user') || normalized.includes('human')) return 'You';
      return '';
    };

    const renderTranscript = (payload) => {
      if (!transcript) return;
      const turns = (Array.isArray(payload) ? payload : [payload])
        .map(turn => {
          if (turn == null) return null;
          if (typeof turn === 'string') return { role: '', text: turn };
          const text = turn.content ?? turn.transcript ?? turn.text ?? '';
          if (typeof text === 'string') return { role: turn.role, text };
          if (typeof text === 'number') return { role: turn.role, text: String(text) };
          return { role: turn.role, text: '' };
        })
        .filter(turn => turn && turn.text.trim());

      if (!turns.length) return;

      transcript.innerHTML = '';
      turns.slice(-3).forEach(turn => {
        const line = document.createElement('p');
        line.className = 'voice-console__line';
        const label = speakerLabel(turn.role);
        if (label) {
          line.dataset.speaker = label === 'Arden' ? 'agent' : 'user';
          const tag = document.createElement('span');
          tag.textContent = label;
          line.appendChild(tag);
        }
        line.appendChild(document.createTextNode(turn.text.trim()));
        transcript.appendChild(line);
      });
    };

    const resetCall = (headline = 'Conversation ended', detail = 'Start another voice trial whenever you are ready.') => {
      isLive = false;
      isMuted = false;
      window.clearInterval(elapsedTimer);
      elapsedTimer = null;
      root.classList.remove('is-connecting', 'is-live', 'is-speaking', 'is-muted');
      root.classList.add('is-ended');
      resetVoiceMeter();
      start.hidden = false;
      start.disabled = !consent?.checked;
      if (startLabel) startLabel.textContent = 'Start another call';
      if (mute) {
        mute.hidden = true;
        mute.textContent = 'Mute';
        mute.setAttribute('aria-pressed', 'false');
      }
      if (end) end.hidden = true;
      if (connection) connection.textContent = 'Call complete';
      setCopy(headline, detail);
    };

    const bindClient = async () => {
      if (client) return client;
      const { RetellWebClient } = await loadVoiceSDK();
      client = new RetellWebClient();

      client.on('call_started', () => {
        isLive = true;
        startedAt = Date.now();
        updateTimer();
        elapsedTimer = window.setInterval(updateTimer, 1000);
        root.classList.remove('is-connecting', 'is-ended', 'is-unconfigured');
        root.classList.add('is-live');
        start.hidden = true;
        if (mute) mute.hidden = false;
        if (end) end.hidden = false;
        if (connection) connection.textContent = 'Call live';
        setCopy('Arden is joining', 'Your microphone is live. Arden will speak in a moment.');
      });

      client.on('call_ready', () => {
        setCopy('Arden is listening', 'Ask about a system, an operational bottleneck, or your existing booking.');
      });

      client.on('agent_start_talking', () => {
        root.classList.add('is-speaking');
        setCopy('Arden is speaking', 'You can interrupt naturally at any time.');
      });

      client.on('agent_stop_talking', () => {
        root.classList.remove('is-speaking');
        setCopy(isMuted ? 'Microphone muted' : 'Arden is listening', isMuted ? 'Unmute when you are ready to continue.' : 'Speak naturally. The agent can hear you.');
      });

      client.on('audio', updateVoiceMeter);

      client.on('update', (update) => {
        if (!transcript || !update) return;
        renderTranscript(update.transcript);
      });

      client.on('call_ended', () => {
        resetCall();
      });

      client.on('error', () => {
        if (client) client.stopCall();
        resetCall('The call was interrupted', 'Check your microphone permission and connection, then try again.');
        root.classList.add('is-unconfigured');
      });

      return client;
    };

    start.addEventListener('click', async () => {
      if (!consent?.checked) {
        setCopy('Consent required', 'Confirm the third-party audio and transcript processing disclosure before starting the live trial.');
        consent?.focus();
        return;
      }
      if (!window.isSecureContext || !navigator.mediaDevices) {
        root.classList.add('is-unconfigured');
        setCopy('Microphone access is blocked', 'Open this page over HTTPS or localhost, then allow microphone access.');
        return;
      }

      start.disabled = true;
      root.classList.remove('is-unconfigured', 'is-ended');
      root.classList.add('is-connecting');
      if (transcript) {
        transcript.innerHTML = '<p class="voice-console__line">Waiting for the first turn…</p>';
      }
      if (connection) connection.textContent = 'Creating third-party call';
      setCopy('Connecting to Arden', 'Retell AI will process the call after you allow microphone access.');

      try {
        const response = await fetch('/api/create-web-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ? await response.json() : {};

        if (!response.ok || !payload.accessToken) {
          const localStaticPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)
            && !contentType.includes('application/json');
          const isUnconfigured = payload.error === 'voice_trial_unconfigured'
            || response.status === 404
            || localStaticPreview;
          if (response.status === 429) throw new Error('too_soon');
          throw new Error(isUnconfigured ? 'unconfigured' : 'unavailable');
        }

        const retellClient = await bindClient();
        await retellClient.startCall({
          accessToken: payload.accessToken,
          emitRawAudioSamples: true,
        });
      } catch (error) {
        root.classList.remove('is-connecting');
        root.classList.add('is-unconfigured');
        start.disabled = !consent?.checked;
        if (connection) connection.textContent = 'Voice trial offline';
        if (error.message === 'too_soon') {
          root.classList.remove('is-unconfigured');
          if (connection) connection.textContent = 'Ready when you are';
          setCopy('One moment before the next call', 'Give it a few seconds, then start the conversation again.');
        } else if (error.message === 'unconfigured') {
          setCopy('Branded voice trial needs its secure key', 'Add RETELL_API_KEY to the site environment, then refresh this preview.');
        } else {
          setCopy('Arden could not connect', 'Check microphone access and the network, then try again.');
        }
      }
    });

    if (consent) {
      start.disabled = !consent.checked;
      consent.addEventListener('change', () => {
        if (!isLive && !root.classList.contains('is-connecting')) start.disabled = !consent.checked;
      });
    }

    if (mute) {
      mute.addEventListener('click', () => {
        if (!client || !isLive) return;
        isMuted = !isMuted;
        if (isMuted) client.mute();
        else client.unmute();
        root.classList.toggle('is-muted', isMuted);
        mute.textContent = isMuted ? 'Unmute' : 'Mute';
        mute.setAttribute('aria-pressed', String(isMuted));
        setCopy(isMuted ? 'Microphone muted' : 'Arden is listening', isMuted ? 'Arden cannot hear you until you unmute.' : 'Speak naturally. The agent can hear you.');
      });
    }

    if (end) {
      end.addEventListener('click', () => {
        if (client && isLive) client.stopCall();
      });
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
    fab.classList.add('is-hidden');
    document.body.appendChild(fab);

    const hero = document.querySelector('.hero');
    if (!hero || !('IntersectionObserver' in window)) {
      fab.classList.remove('is-hidden');
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        fab.classList.toggle('is-hidden', entry.isIntersecting);
      });
    }, { threshold: 0.08 });
    observer.observe(hero);
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
        diag.classList.toggle('is-theatre-visible', inView);
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
    // Scroll-driven tracks have nothing to swipe; a "swipe" pill would lie.
    if (MOBILE_SCROLL_TRACKS && !prefersReduced) return;

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
      // No timeout fallback — the hint stays until the user actually
      // swipes the carousel. The drift animation is intentionally slow
      // so it never becomes visually noisy.
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

    diag.classList.add('diag--theatre-ready');
    let inView = false;
    let lastIdx = -1;

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
  function initMobileScrollTracks() {
    if (!MOBILE_SCROLL_TRACKS || window.innerWidth > 768 || prefersReduced) return;

    const buildTrack = (wrap, rail, pace) => {
      if (!wrap || !rail || wrap.dataset.scrollTrack === 'ready') return null;
      wrap.dataset.scrollTrack = 'ready';
      rail.dataset.scrollTrackRail = '';

      const items = Array.from(rail.children).filter(el => el.nodeType === 1);
      if (items.length < 2) return null;

      let offsets = [];
      let runway = 0;
      let stickTop = 0;
      let current = -1;
      let frame = null;

      /*
       * The legacy mobile carousel rule sets `transform: none !important`, and
       * an !important declaration beats an inline style — so the rail has to be
       * moved with an important inline value or it silently never moves.
       */
      const setOffset = (px) => {
        rail.style.setProperty('transform', `translate3d(${px}px,0,0)`, 'important');
      };

      const measure = () => {
        setOffset(0);
        const railBox = rail.getBoundingClientRect();
        const middle = window.innerWidth / 2;

        /*
         * One resting position per card, each centring that card. Translating
         * continuously left the rail parked between two cards, so a reader saw
         * two half-cards and no whole one. Stepping also means the transform is
         * written once per card instead of once per scroll frame, which is
         * where the jank came from.
         */
        offsets = items.map((item) => {
          const box = item.getBoundingClientRect();
          return Math.round(middle - (box.left - railBox.left) - box.width / 2);
        });

        // Sit the rail in the middle of the screen rather than jammed up top.
        const railHeight = rail.offsetHeight;
        stickTop = Math.max(76, Math.round((window.innerHeight - railHeight) / 2));
        rail.style.top = `${stickTop}px`;

        // One comfortable screenful of scroll per card.
        runway = Math.round(items.length * window.innerHeight * pace);
        wrap.style.height = `${railHeight + runway}px`;

        current = -1;
        apply();
      };

      const apply = () => {
        frame = null;
        const top = wrap.getBoundingClientRect().top + window.scrollY;
        const progress = Math.min(1, Math.max(0, (window.scrollY + stickTop - top) / runway));
        const index = Math.min(items.length - 1, Math.floor(progress * items.length));
        if (index === current) return;
        current = index;

        setOffset(offsets[index]);
        items.forEach((item, i) => {
          const isFocal = i === index;
          item.classList.toggle('is-focal', isFocal);
          // Privileges are accordions; open the one being read, close the rest.
          if (item.classList.contains('privilege')) {
            item.toggleAttribute('data-open', isFocal);
            const head = item.querySelector('.privilege__head');
            if (head) head.setAttribute('aria-expanded', String(isFocal));
          }
        });
      };

      const request = () => {
        if (frame === null) frame = requestAnimationFrame(apply);
      };

      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', measure, { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(measure).observe(rail);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(() => {});
      measure();
      return { measure };
    };

    // Services: the wrapper already exists.
    buildTrack(
      document.querySelector('.services__track-wrap'),
      document.querySelector('.services__track'),
      0.72,
    );

    /*
     * "How it works" is already a vertical list, so it needs no rail — it just
     * needs to stop hiding itself behind taps. Each step opens as it reaches
     * the middle of the screen and closes again once it leaves, so the whole
     * process reads by scrolling alone.
     */
    const steps = Array.from(document.querySelectorAll('.process .step'));
    if (steps.length && 'IntersectionObserver' in window) {
      const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const step = entry.target;
          step.toggleAttribute('data-open', entry.isIntersecting);
          step.setAttribute('aria-expanded', String(entry.isIntersecting));
        });
      }, { rootMargin: '-38% 0px -38% 0px' });
      steps.forEach((step) => stepObserver.observe(step));
    }

    // Privileges: the list has no wrapper of its own, so give it one.
    const privileges = document.querySelector('.privileges__list');
    if (privileges && !privileges.parentElement.dataset.scrollTrack) {
      const wrap = document.createElement('div');
      wrap.className = 'privileges__track-wrap';
      privileges.parentElement.insertBefore(wrap, privileges);
      wrap.appendChild(privileges);
      buildTrack(wrap, privileges, 0.72);
    }
  }

  function initMobileServicesAccordion() {
    const cards = document.querySelectorAll('.services .svc-card:not(.svc-card--pillar)');
    if (!cards.length) return;

    // One-line tagline per service (keyed by data-svc-bg or title)
    const taglines = {
      va:     'Role-based systems with defined ownership.',
      social: 'Channel management — not posts.',
      auto:   'Monitoring, recovery, and controlled change.',
      build:  'Connected operations, engineered end to end.',
      audit:  'Map priority leaks. Blueprint the response.',
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

      /*
       * Mobile cards are editorial briefs, not mystery boxes. Keep the useful
       * copy visible in normal flow so scrolling never mutates page height and
       * every service is read without a second gesture.
       */
      card.setAttribute('data-open', '');
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

      // The four steps remain expanded in document flow on phones.
      step.setAttribute('data-open', '');
    });
  }

  /* ==========================================================
     MOBILE SERVICES THEATRE
     ── Seven vertical beats drive one full-screen stage.
     ── Service covers open a single in-page focus layer.
     ========================================================== */
  function initMobileServiceTheatre() {
    const theatreQuery = window.matchMedia(
      '(max-width: 768px) and (min-height: 640px) and (orientation: portrait)'
    );
    if (!theatreQuery.matches || prefersReduced) return;

    const section = document.querySelector('.services');
    const wrap = section?.querySelector('.services__track-wrap');
    const track = section?.querySelector('.services__track');
    const cards = Array.from(track?.children || []).filter(card => card.classList.contains('svc-card'));
    if (!section || !wrap || !track || cards.length < 2 || section.dataset.mobileTheatre === 'ready') return;

    section.dataset.mobileTheatre = 'ready';
    section.classList.add('services--theatre-ready');

    const runway = document.createElement('ol');
    runway.className = 'services__runway';
    runway.setAttribute('aria-hidden', 'true');
    runway.innerHTML = cards.map((card, index) => `
      <li class="services__beat${index === 0 ? ' is-current' : ''}" data-service-beat="${index}">
        <span>${String(index + 1).padStart(2, '0')}</span>
      </li>`).join('');
    wrap.insertAdjacentElement('afterend', runway);

    const currentCounter = section.querySelector('[data-services-current]');
    let activeIndex = -1;
    let requestedIndex = -1;
    let stageTransitionTimer = null;
    let lastServiceCommit = 0;

    const renderServiceIndex = (index) => {
      const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
      activeIndex = safeIndex;
      requestedIndex = safeIndex;
      cards.forEach((card, cardIndex) => {
        const isCurrent = cardIndex === safeIndex;
        card.classList.remove('is-stage-leaving');
        card.classList.toggle('is-stage-current', isCurrent);
        card.classList.toggle('is-stage-past', cardIndex < safeIndex);
        card.classList.toggle('is-stage-next', cardIndex === safeIndex + 1);
        card.setAttribute('aria-hidden', String(!isCurrent));
        if (!card.classList.contains('svc-card--pillar')) {
          card.setAttribute('tabindex', isCurrent ? '0' : '-1');
        }
      });
      runway.querySelectorAll('[data-service-beat]').forEach((beat, beatIndex) => {
        beat.classList.toggle('is-current', beatIndex === safeIndex);
      });
      if (currentCounter) {
        currentCounter.textContent = String(safeIndex + 1).padStart(2, '0');
      }
      section.style.setProperty('--service-progress', String((safeIndex + 1) / cards.length));
      lastServiceCommit = performance.now();
    };

    const activate = (index) => {
      const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
      if (safeIndex === activeIndex || safeIndex === requestedIndex) return;
      requestedIndex = safeIndex;
      window.clearTimeout(stageTransitionTimer);

      const outgoing = cards[activeIndex];
      if (!outgoing) {
        renderServiceIndex(safeIndex);
        return;
      }

      section.classList.add('is-service-switching');
      outgoing.classList.remove('is-stage-current');
      outgoing.classList.add('is-stage-leaving');
      outgoing.setAttribute('aria-hidden', 'true');
      if (!outgoing.classList.contains('svc-card--pillar')) {
        outgoing.setAttribute('tabindex', '-1');
      }

      cards.forEach((card, cardIndex) => {
        if (cardIndex === activeIndex) return;
        card.classList.remove('is-stage-current', 'is-stage-leaving');
        card.setAttribute('aria-hidden', 'true');
      });

      stageTransitionTimer = window.setTimeout(() => {
        renderServiceIndex(safeIndex);
        section.classList.remove('is-service-switching');
      }, 220);
    };

    const focusLayer = document.createElement('div');
    focusLayer.className = 'service-focus';
    focusLayer.hidden = true;
    focusLayer.innerHTML = `
      <div class="service-focus__scrim" data-service-focus-close></div>
      <section class="service-focus__panel" role="dialog" aria-modal="true" aria-labelledby="service-focus-title">
        <div class="service-focus__topline">
          <span data-service-focus-number></span>
          <button type="button" class="service-focus__close" data-service-focus-close aria-label="Close service details">
            <span></span><span></span>
          </button>
        </div>
        <div class="service-focus__icon" data-service-focus-icon aria-hidden="true"></div>
        <p class="service-focus__kicker">Bluerook operating system</p>
        <h3 class="service-focus__title" id="service-focus-title" data-service-focus-title></h3>
        <p class="service-focus__tag" data-service-focus-tag></p>
        <p class="service-focus__body" data-service-focus-body></p>
        <ul class="service-focus__list" data-service-focus-list></ul>
        <span class="service-focus__foot">Designed around your stack, controls, and completion condition.</span>
      </section>`;
    document.body.appendChild(focusLayer);

    const panel = focusLayer.querySelector('.service-focus__panel');
    const closeButton = focusLayer.querySelector('.service-focus__close');
    let sourceCard = null;
    let returnFocus = null;
    let closing = false;

    const focusable = () => Array.from(
      focusLayer.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
    );

    const fillFocusLayer = (card) => {
      const number = card.querySelector('.svc-card__num')?.textContent.trim() || '';
      const title = card.querySelector('.svc-card__title-text, .svc-card__title')?.textContent.trim() || '';
      const tag = card.querySelector('.svc-card__tag')?.textContent.trim() || '';
      const body = card.querySelector('.svc-card__body')?.textContent.trim() || '';
      const icon = card.querySelector('.svc-card__icon')?.innerHTML || '';
      const bullets = Array.from(card.querySelectorAll('.svc-card__list li')).map(item => item.textContent.trim());

      focusLayer.querySelector('[data-service-focus-number]').textContent = number;
      focusLayer.querySelector('[data-service-focus-title]').textContent = title;
      focusLayer.querySelector('[data-service-focus-tag]').textContent = tag;
      focusLayer.querySelector('[data-service-focus-body]').textContent = body;
      focusLayer.querySelector('[data-service-focus-icon]').innerHTML = icon;
      focusLayer.querySelector('[data-service-focus-list]').innerHTML =
        bullets.map(bullet => `<li>${bullet}</li>`).join('');
    };

    const openFocusLayer = (card) => {
      if (!card || !focusLayer.hidden) return;
      sourceCard = card;
      returnFocus = document.activeElement;
      fillFocusLayer(card);
      const from = card.getBoundingClientRect();
      focusLayer.hidden = false;
      document.body.classList.add('service-focus-open');
      focusLayer.offsetHeight;
      focusLayer.classList.add('is-open');

      const to = panel.getBoundingClientRect();
      if (panel.animate && !prefersReduced) {
        panel.animate([
          {
            transform: `translate3d(${from.left - to.left}px,${from.top - to.top}px,0) scale(${Math.max(0.12, from.width / to.width)},${Math.max(0.12, from.height / to.height)})`,
            borderRadius: '18px',
            opacity: 0.72,
          },
          { transform: 'translate3d(0,0,0) scale(1)', borderRadius: '0px', opacity: 1 },
        ], {
          duration: 620,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        });
      }
      window.setTimeout(() => closeButton?.focus(), prefersReduced ? 0 : 180);
    };

    const closeFocusLayer = () => {
      if (focusLayer.hidden || closing) return;
      closing = true;
      const from = sourceCard?.getBoundingClientRect();
      const to = panel.getBoundingClientRect();
      const finish = () => {
        focusLayer.classList.remove('is-open');
        focusLayer.hidden = true;
        document.body.classList.remove('service-focus-open');
        closing = false;
        if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll: true });
      };

      if (panel.animate && from && !prefersReduced) {
        const animation = panel.animate([
          { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
          {
            transform: `translate3d(${from.left - to.left}px,${from.top - to.top}px,0) scale(${Math.max(0.12, from.width / to.width)},${Math.max(0.12, from.height / to.height)})`,
            opacity: 0.2,
          },
        ], {
          duration: 360,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'both',
        });
        animation.finished.then(finish).catch(finish);
      } else {
        finish();
      }
    };

    focusLayer.querySelectorAll('[data-service-focus-close]').forEach(control => {
      control.addEventListener('click', closeFocusLayer);
    });
    focusLayer.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeFocusLayer();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    cards.forEach((card, index) => {
      card.style.setProperty('--service-index', String(index));
      if (card.classList.contains('svc-card--pillar')) return;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-haspopup', 'dialog');
      card.removeAttribute('data-open');
      const open = () => {
        if (!card.classList.contains('is-stage-current')) return;
        openFocusLayer(card);
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
      });
    });

    const beats = Array.from(runway.querySelectorAll('[data-service-beat]'));
    let serviceFrame = null;
    let serviceCandidate = -1;
    let serviceCandidateSince = 0;
    let serviceDwellTimer = null;

    const syncServiceStage = () => {
      serviceFrame = null;
      if (!theatreQuery.matches || activeIndex < 0) return;

      const stageRect = wrap.getBoundingClientRect();
      const guide = stageRect.top + stageRect.height * 0.52;
      let nearestIndex = activeIndex;
      let nearestDistance = Number.POSITIVE_INFINITY;
      beats.forEach((beat, index) => {
        const rect = beat.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - guide);
        if (distance < nearestDistance) {
          nearestIndex = index;
          nearestDistance = distance;
        }
      });

      if (nearestIndex === activeIndex) {
        serviceCandidate = -1;
        return;
      }

      const direction = Math.sign(nearestIndex - activeIndex);
      const candidateIndex = activeIndex + direction;
      const activeRect = beats[activeIndex]?.getBoundingClientRect();
      const candidateRect = beats[candidateIndex]?.getBoundingClientRect();
      if (!activeRect || !candidateRect) return;
      const activeDistance = Math.abs(activeRect.top + activeRect.height / 2 - guide);
      const candidateDistance = Math.abs(candidateRect.top + candidateRect.height / 2 - guide);
      if (activeDistance - candidateDistance < 34) {
        serviceCandidate = -1;
        return;
      }

      const now = performance.now();
      if (serviceCandidate !== candidateIndex) {
        serviceCandidate = candidateIndex;
        serviceCandidateSince = now;
      }

      const dwellComplete = now - serviceCandidateSince >= 190;
      const transitionSettled = now - lastServiceCommit >= 540;
      if (dwellComplete && transitionSettled) {
        activate(candidateIndex);
        serviceCandidate = -1;
        window.clearTimeout(serviceDwellTimer);
        serviceDwellTimer = window.setTimeout(requestServiceSync, 580);
        return;
      }

      window.clearTimeout(serviceDwellTimer);
      serviceDwellTimer = window.setTimeout(
        requestServiceSync,
        Math.max(70, 580 - (now - lastServiceCommit)),
      );
    };

    function requestServiceSync() {
      if (serviceFrame !== null) return;
      serviceFrame = requestAnimationFrame(syncServiceStage);
    }

    window.addEventListener('scroll', requestServiceSync, { passive: true });
    window.addEventListener('resize', requestServiceSync, { passive: true });

    if (typeof theatreQuery.addEventListener === 'function') {
      theatreQuery.addEventListener('change', event => {
        if (event.matches) {
          renderServiceIndex(Math.max(0, activeIndex));
          return;
        }
        if (!focusLayer.hidden) closeFocusLayer();
        cards.forEach(card => {
          card.removeAttribute('aria-hidden');
          if (!card.classList.contains('svc-card--pillar')) card.setAttribute('tabindex', '0');
        });
      });
    }

    renderServiceIndex(0);
    requestServiceSync();
  }

  /* ==========================================================
     MOBILE STACK THEATRES
     ── The four-step process is the page's single stacked-card sequence.
     ── Standard stays an accordion; principles stay editorial.
     ========================================================== */
  function initMobileStackTheatres() {
    if (
      window.innerWidth > 768 ||
      window.innerHeight < 640 ||
      window.matchMedia('(orientation: landscape)').matches ||
      prefersReduced ||
      !('IntersectionObserver' in window)
    ) return;

    // Process is the single theatrical card stack on phones. The Standard is a
    // true accordion and Operating Principles use an editorial normal-flow
    // reveal, so the page never repeats the same full-screen mechanism three
    // times in succession.
    const groups = [
      {
        root: document.querySelector('.process'),
        items: Array.from(document.querySelectorAll('.process .step')),
        kind: 'process',
      },
    ];

    groups.forEach(({ root, items, kind }) => {
      if (!root || items.length < 2) return;
      root.classList.add('mobile-stack-theatre', `mobile-stack-theatre--${kind}`);

      const activate = (index) => {
        items.forEach((item, itemIndex) => {
          const isCurrent = itemIndex === index;
          item.classList.toggle('is-stack-current', isCurrent);
          item.classList.toggle('is-stack-past', itemIndex < index);
          item.classList.toggle('is-stack-future', itemIndex > index);
          if (item.classList.contains('privilege')) {
            item.toggleAttribute('data-open', isCurrent);
            item.querySelector('.privilege__head')
              ?.setAttribute('aria-expanded', String(isCurrent));
          }
        });
      };

      items.forEach((item, index) => {
        item.style.setProperty('--stack-index', String(index));
      });

      const observer = new IntersectionObserver(() => {
        const guide = window.innerHeight * 0.46;
        let nearestIndex = 0;
        let distance = Number.POSITIVE_INFINITY;
        items.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          const nextDistance = Math.abs(rect.top + Math.min(rect.height * 0.35, 180) - guide);
          if (nextDistance < distance) {
            nearestIndex = index;
            distance = nextDistance;
          }
        });
        activate(nearestIndex);
      }, {
        threshold: 0.01,
        rootMargin: '-34% 0px -46% 0px',
      });

      items.forEach(item => observer.observe(item));
      activate(0);
    });
  }

  /*
   * MOBILE NARRATIVE MOTION
   * Small IntersectionObservers give supporting phone content an authored
   * arrival without introducing another gesture or nested carousel. The two
   * bounded sticky chapters own their state separately.
   */
  function initMobileNarrativeMotion() {
    if (
      window.innerWidth > 768 ||
      prefersReduced ||
      !('IntersectionObserver' in window)
    ) return;

    const register = (selector, kind) => {
      return Array.from(document.querySelectorAll(selector)).map((element, index) => {
        element.classList.add('mobile-motion-item', `mobile-motion--${kind}`);
        element.style.setProperty('--mobile-motion-order', String(index % 3));
        return element;
      });
    };

    const hero = register(
      '.hero__eyebrow, .hero__parallax, .hero__lead, .hero__ctas, .hero__rook-wrap',
      'hero'
    );
    const systemsRoot = document.querySelector('[data-systems]');
    const blueprints = register('.systems__blueprint', 'blueprint');
    const supporting = [
      ...register('.trust .trust__item', 'support'),
      ...register('.services .svc-card', 'support'),
      ...register('.privileges .privilege', 'support'),
      ...register('.process .step', 'support'),
      ...register('.why .why-cell', 'support'),
    ];
    const items = [...hero, ...blueprints, ...supporting];
    if (!items.length) return;

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-mobile-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -10% 0px',
    });

    const focusObserver = new IntersectionObserver(() => {
      const bandTop = window.innerHeight * 0.28;
      const bandBottom = window.innerHeight * 0.44;
      const guide = (bandTop + bandBottom) / 2;
      const current = blueprints
        .filter((blueprint) => {
          const rect = blueprint.getBoundingClientRect();
          return rect.bottom > bandTop && rect.top < bandBottom;
        })
        .sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();
          // A chapter becomes current when its heading reaches the reading
          // guide. Comparing panel centres made two long, adjacent dossiers
          // compete for the same band and could leave the previous index lit.
          return Math.abs(aRect.top - guide) - Math.abs(bRect.top - guide);
        })[0];
      if (!current) return;

      blueprints.forEach(blueprint => blueprint.classList.remove('is-mobile-current'));
      current.classList.add('is-mobile-current');
      const key = current.dataset.systemBlueprint;
      document.querySelectorAll('[data-system-select]').forEach((button) => {
        const isCurrent = button.dataset.systemSelect === key;
        button.classList.toggle('is-active', isCurrent);
        button.setAttribute('aria-pressed', String(isCurrent));
        const state = button.querySelector('.system-selector__state');
        if (state) state.textContent = isCurrent ? 'Reading' : 'Jump to';
      });
    }, {
      threshold: 0,
      rootMargin: '-28% 0px -56% 0px',
    });

    items.forEach(item => revealObserver.observe(item));
    // The pinned portrait-phone story has its own dwell-aware state owner.
    // Absolute blueprint panels share one rect there, so a second observer
    // would continually disagree about which workflow is current.
    if (!systemsRoot?.classList.contains('systems--story-ready')) {
      blueprints.forEach(blueprint => focusObserver.observe(blueprint));
    }
    document.body.classList.add('mobile-motion-ready');
  }

  /*
   * MOBILE CASTLING MOMENT
   * A literal king/rook handoff plays once when the board reaches the reading
   * area. It uses bounded Web Animations and leaves responsive final positions
   * to CSS custom properties, so resizing never preserves a stale pixel offset.
   */
  function initMobileCastlingMoment() {
    if (window.innerWidth > 768) return;

    const stage = document.querySelector('[data-castling-stage]');
    const king = document.querySelector('[data-castling-king]');
    const rook = document.querySelector('[data-castling-rook]');
    const caption = document.querySelector('[data-castling-caption]');
    const kingTrail = document.querySelector('[data-castling-trail-king]');
    const rookTrail = document.querySelector('[data-castling-trail-rook]');
    const section = stage?.closest('.castling');
    if (!stage || !king || !rook || !caption || !section) return;

    const measure = () => {
      // offsetLeft is layout geometry and ignores the completed transforms.
      // getBoundingClientRect() would reverse the distance after the swap and
      // make an orientation change snap both pieces back across the board.
      const distance =
        (rook.offsetLeft + rook.offsetWidth / 2) -
        (king.offsetLeft + king.offsetWidth / 2);
      stage.style.setProperty('--castle-distance', `${distance}px`);
      stage.style.setProperty('--castle-distance-back', `${-distance}px`);
      return distance;
    };

    section.classList.add('mobile-castling-ready');
    measure();

    if (
      prefersReduced ||
      !('IntersectionObserver' in window) ||
      typeof king.animate !== 'function'
    ) {
      section.classList.add('is-castled');
      return;
    }

    let played = false;
    let resizeFrame = 0;
    const play = () => {
      if (played) return;
      played = true;
      const distance = measure();
      const timing = {
        duration: 1120,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      };

      section.classList.add('is-castling');

      const kingMove = king.animate([
        { transform: 'translate3d(0, 0, 0)', offset: 0 },
        { transform: `translate3d(${distance * 0.42}px, -18px, 0)`, offset: 0.48 },
        { transform: `translate3d(${distance}px, 0, 0)`, offset: 1 },
      ], timing);
      const rookMove = rook.animate([
        { transform: 'translate3d(0, 0, 0)', offset: 0 },
        { transform: `translate3d(${-distance * 0.56}px, 12px, 0)`, offset: 0.5 },
        { transform: `translate3d(${-distance}px, 0, 0)`, offset: 1 },
      ], timing);

      [kingTrail, rookTrail].forEach((trail, index) => {
        trail?.animate([
          { transform: 'translateY(-50%) scaleX(0)', opacity: 0 },
          { transform: 'translateY(-50%) scaleX(1)', opacity: 0.95, offset: 0.42 },
          { transform: 'translateY(-50%) scaleX(1)', opacity: 0, offset: 1 },
        ], {
          duration: 900,
          delay: 90 + index * 70,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        });
      });

      Promise.allSettled([kingMove.finished, rookMove.finished]).then(() => {
        section.classList.remove('is-castling');
        section.classList.add('is-castled');
        kingMove.cancel();
        rookMove.cancel();
      });
    };

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      play();
    }, {
      threshold: 0.76,
      rootMargin: '0px 0px -6% 0px',
    });
    observer.observe(stage);

    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measure);
    }, { passive: true });
  }

  /*
   * MOBILE DIAGNOSIS STORY
   * The three sentences stay in normal document flow and remain readable.
   * A narrow observer band promotes one thought at a time into the light.
   */
  function initMobileDiagnosisStory() {
    if (window.innerWidth > 768) return;

    const diag = document.querySelector('[data-diag]');
    const statements = Array.from(diag?.querySelectorAll('.diag__stmt') || []);
    const dots = Array.from(diag?.querySelectorAll('.diag__dot') || []);
    if (!diag || !statements.length) return;

    diag.setAttribute('aria-hidden', 'false');
    diag.classList.add('mobile-diag-ready');

    const activate = (index) => {
      statements.forEach((statement, statementIndex) => {
        statement.classList.toggle('is-mobile-current', statementIndex === index);
        statement.classList.toggle('is-mobile-past', statementIndex < index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === index);
        dot.classList.toggle('is-past', dotIndex < index);
      });
    };

    activate(0);
    if (prefersReduced || !('IntersectionObserver' in window)) {
      statements.forEach(statement => statement.classList.add('is-mobile-seen'));
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-mobile-seen');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px',
    });

    const focusObserver = new IntersectionObserver(() => {
      const guide = window.innerHeight * 0.48;
      const current = statements
        .filter((statement) => {
          const rect = statement.getBoundingClientRect();
          return rect.bottom > window.innerHeight * 0.3 &&
            rect.top < window.innerHeight * 0.66;
        })
        .sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();
          return Math.abs((aRect.top + aRect.height / 2) - guide) -
            Math.abs((bRect.top + bRect.height / 2) - guide);
        })[0];
      if (!current) return;
      activate(statements.indexOf(current));
    }, {
      threshold: 0,
      rootMargin: '-30% 0px -34% 0px',
    });

    statements.forEach((statement) => {
      revealObserver.observe(statement);
      focusObserver.observe(statement);
    });
  }

  /*
   * A quiet focus band gives long editorial sections pacing without hiding
   * anything or moving the layout. IntersectionObserver runs only when a row
   * enters or leaves the band; there is no document-level scroll handler.
   */
  function initMobileEditorialFocus() {
    if (window.innerWidth > 768 || !('IntersectionObserver' in window)) return;
    const groups = [
      Array.from(document.querySelectorAll('.services .svc-card:not(.svc-card--pillar)')),
      Array.from(document.querySelectorAll('.privileges .privilege')),
      Array.from(document.querySelectorAll('.process .step')),
    ];

    groups.forEach(items => {
      if (!items.length) return;
      const observer = new IntersectionObserver(() => {
        const guide = window.innerHeight * 0.52;
        let nearest = null;
        let distance = Number.POSITIVE_INFINITY;
        items.forEach(item => {
          const rect = item.getBoundingClientRect();
          const nextDistance = Math.abs(rect.top + rect.height / 2 - guide);
          if (nextDistance < distance) {
            nearest = item;
            distance = nextDistance;
          }
        });
        items.forEach(item => item.classList.toggle('is-current', item === nearest));
      }, {
        rootMargin: '-42% 0px -42% 0px',
        threshold: 0.01,
      });
      items.forEach(item => observer.observe(item));
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

    /* Swap distance, derived from the board rather than from the pieces'
       live positions.

       It used to be measured by clearing `x` on BOTH pieces inside the
       tweens' value functions. Because the rook's tween evaluates after the
       king's, every scrubbed frame wiped the king's transform immediately
       after it was set: the rook crossed the board alone and the King never
       moved, so the signature castling read as a single piece on an empty
       board. Caching a measurement at init doesn't work either — this runs
       before the tier class lands, when the stage is still unlaid-out and
       every rect is zero.

       Stage width minus piece width is the distance either piece travels to
       reach the other's square. It depends on no transform, so it is safe to
       read during render and correct however late layout settles. */
    const swapDx = () => {
      const stageW = castlingStage.getBoundingClientRect().width;
      const pieceW = cKing.getBoundingClientRect().width || 88;
      return Math.max(0, stageW - pieceW);
    };

    const castlingTL = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    castlingTL
      .to(cKing, { x: () => swapDx(),  duration: 1.2 }, 0)
      .to(cRook, { x: () => -swapDx(), duration: 1.2 }, 0);
    if (tKing) castlingTL.to(tKing, { scaleX: 1, opacity: 0.35, duration: 1.0 }, 0.05);
    if (tRook) castlingTL.to(tRook, { scaleX: 1, opacity: 0.35, duration: 1.0 }, 0.05);
    if (cCap)  castlingTL.to(cCap,  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.0);

    ScrollTrigger.create({
      trigger: castlingSection,
      start: 'top center',
      end: 'bottom center',
      scrub: 1,
      animation: castlingTL,
      // Re-reads swapDx() on refresh, so a resize still lands the pieces on
      // each other's squares.
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
      const cards = Array.from(track.children);
      const progressFill = document.querySelector('[data-services-progress]');
      const current = document.querySelector('[data-services-current]');
      const setServiceState = (progress) => {
        const index = Math.min(cards.length - 1, Math.round(progress * (cards.length - 1)));
        cards.forEach((card, cardIndex) => card.classList.toggle('is-current', cardIndex === index));
        if (progressFill) progressFill.style.transform = `scaleX(${Math.max(0.03, progress)})`;
        if (current) current.textContent = String(index + 1).padStart(2, '0');
      };
      setServiceState(0);
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: trackWrap, start: 'top top',
          end: () => `+=${dist()}`,
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: self => setServiceState(self.progress),
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
    if (window.innerWidth <= 768) {
      rows.forEach(row => {
        row.removeAttribute('data-open');
        const head = row.querySelector('.privilege__head');
        if (head) {
          head.setAttribute('aria-expanded', 'false');
          head.removeAttribute('aria-disabled');
          head.removeAttribute('tabindex');
          head.addEventListener('click', () => {
            const willOpen = !row.hasAttribute('data-open');
            rows.forEach(item => {
              item.removeAttribute('data-open');
              item.querySelector('.privilege__head')?.setAttribute('aria-expanded', 'false');
            });
            if (willOpen) {
              row.setAttribute('data-open', '');
              head.setAttribute('aria-expanded', 'true');
            }
          });
        }
      });
      if (rows[0]) {
        rows[0].setAttribute('data-open', '');
        rows[0].querySelector('.privilege__head')
          ?.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    if (rows.length && !rows.some(row => row.hasAttribute('data-open'))) {
      rows[0].setAttribute('data-open', '');
      rows[0].querySelector('.privilege__head')?.setAttribute('aria-expanded', 'true');
    }
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
