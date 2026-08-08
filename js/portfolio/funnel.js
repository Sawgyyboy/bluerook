/* Bluerook — The Operation (linear scroll funnel)
   ------------------------------------------------------------------
   Every panel on this page derives its state from scroll position.
   There is no "next" button anywhere: a scene is a sticky pin plus a
   tall track, and progress through that track is the only input.

   `p`    0..1 across the whole scene
   `step` integer frame, floor(p * steps)
   `sp`   0..1 within the current frame — this is what makes a wire
          draw, a counter climb or a row resolve *while* you move.

   The project has no build step, so this is the vanilla equivalent of
   Framer Motion's useScroll: the same normalised progress value, read
   from getBoundingClientRect instead of a hook.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  const doc = document;
  const $  = (s, scope = doc) => scope.querySelector(s);
  const $$ = (s, scope = doc) => Array.from(scope.querySelectorAll(s));
  const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
  const between = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

  const readers = [];

  /* ═══════════ Captions ═══════════
     One line of copy per frame. The swap is a crossfade so the eye is
     not dragged back up to re-read a paragraph that changed silently. */
  function captioner(section, lines) {
    const el = $('[data-fx-cap]', section);
    let shown = -1;
    return (step) => {
      if (!el || step === shown || !lines[step]) return;
      shown = step;
      el.classList.add('is-swap');
      window.setTimeout(() => {
        el.textContent = lines[step];
        el.classList.remove('is-swap');
      }, 180);
    };
  }

  const pad = (n) => String(n).padStart(2, '0');

  function stepLabel(section, steps) {
    const el = $('[data-fx-step]', section);
    return (step) => { if (el) el.textContent = `${pad(step + 1)} / ${pad(steps)}`; };
  }

  /* Log/stream lines are rewritten wholesale per frame rather than
     appended, so scrolling backwards rewinds honestly. */
  function streamer(host) {
    let shown = -1;
    return (step, lines) => {
      if (!host || step === shown) return;
      shown = step;
      host.replaceChildren();
      (lines || []).forEach(([text, cls]) => {
        const line = doc.createElement('i');
        if (cls) line.className = cls;
        line.textContent = text;
        host.append(line);
      });
    };
  }

  /* ═══════════ Scene registry ═══════════ */
  const SCENES = {};

  /* ---------- 03 · The system floor (n8n canvas) ---------- */
  SCENES.floor = (section, steps) => {
    const nodes = $$('[data-node]', section);
    const wires = $$('[data-wire]', section);
    const log = $('[data-n8n-log]', section);
    const exec = $('[data-n8n-exec]', section);
    if (!nodes.length) return null;

    // Which frame each node and each wire belongs to. -1 means "designed,
    // but not taken on this run" — the human exit has to be visible even
    // when it is not used.
    const NODE_AT = [0, 1, 2, 3, 3, -1, 4, -1];
    const WIRE_AT = [1, 2, 3, 3, -1, 4, 4, -1];

    // Captions are two lines at most on a phone. Anything longer pushes
    // the console it is describing off the bottom of the locked screen.
    const caps = [
      'A message arrives. Nothing has run yet.',
      'Validated first. Malformed input never reaches the agent.',
      'Eleven branches. The message picks exactly one.',
      'Capacity checked. The agent replies inside its bounds.',
      'Three writes. The exit to a human stays open, unused.'
    ];
    const logs = [
      [['▸ POST /webhook/intake · 200', 'ok'], ['  payload 1 item']],
      [['✓ webhook 142ms', 'ok'], ['▸ normalize · 11 fields mapped', 'ok']],
      [['✓ normalize 38ms', 'ok'], ['▸ switch · matched "availability"', 'hold']],
      [['▸ http capacity · 2 slots free', 'ok'], ['▸ agent · bounded reply generated', 'ok']],
      [['✓ notion · 3 records written', 'ok'], ['◦ human queue idle — not required this run', 'hold']]
    ];

    const setCap = captioner(section, caps);
    const setLog = streamer(log);
    let shownStep = -1;

    return (p, step, sp) => {
      nodes.forEach((node, i) => {
        const at = NODE_AT[i];
        node.classList.toggle('is-run', at === step);
        node.classList.toggle('is-done', at > -1 && at < step);
      });

      wires.forEach((wire, i) => {
        const at = WIRE_AT[i];
        const running = at === step;
        wire.classList.toggle('is-run', running);
        wire.classList.toggle('is-done', at > -1 && at < step);
        // The comet is the scroll: dashoffset is literally sub-step progress.
        wire.style.strokeDashoffset = running ? String(1 - sp) : '';
      });

      setCap(step);
      setLog(step, logs[step]);
      if (exec && step !== shownStep) { shownStep = step; exec.textContent = String(4182 + step); }
    };
  };

  /* ---------- 04 · Connected commerce ---------- */
  SCENES.commerce = (section, steps) => {
    const price   = $('[data-c-price]', section);
    const state   = $('[data-c-state]', section);
    const gate    = $('[data-c-gate]', section);
    const pill    = $('[data-c-pill]', section);
    const store   = $('[data-c-store]', section);
    const storeSt = $('[data-c-store-state]', section);
    const recs    = { dash: $('[data-c-rec="dash"]', section), crm: $('[data-c-rec="crm"]', section), feed: $('[data-c-rec="feed"]', section) };
    if (!price) return null;

    const caps = [
      'A price changes in the back office.',
      'Nothing publishes. A named human approves it first.',
      'One approval writes to every surface in the same pass.',
      'Who changed it, who approved it, when. That is the deliverable.'
    ];
    const streams = [
      [['edit · price field focused'], ['draft AV-104 created']],
      [['gate · approval requested', 'hold'], ['0 surfaces changed']],
      [['approved by commerce lead', 'ok'], ['fan-out running…', 'hold']],
      [['✓ 4 surfaces in agreement', 'ok'], ['audit · AV-104 48.00 → 42.00 · commerce lead · 14:06', 'ok']]
    ];

    const setCap = captioner(section, caps);
    const setStream = streamer($('[data-stream]', section));
    const setStep = stepLabel(section, steps);
    // Sub-step thresholds: the three connected records do not update
    // together — you watch them catch up one at a time as you scroll.
    const ORDER = [['dash', 0.10], ['crm', 0.34], ['feed', 0.58]];

    return (p, step, sp) => {
      price.textContent = step >= 1 ? '$42.00' : '$48.00';
      if (state) state.textContent = ['Editing', 'Draft held', 'Publishing', 'Published'][step];

      if (gate) {
        gate.classList.toggle('is-held', step === 1);
        gate.classList.toggle('is-ok', step >= 2);
      }
      if (pill) pill.textContent = step === 0 ? 'Awaiting' : step === 1 ? 'Held' : 'Approved';

      if (store) {
        store.textContent = step >= 2 ? '$42.00' : '$48.00';
        store.classList.toggle('is-new', step >= 2);
      }
      if (storeSt) storeSt.textContent = step >= 2 ? 'Updated' : 'Live';

      ORDER.forEach(([key, at]) => {
        const row = recs[key];
        if (!row) return;
        const synced = step > 2 || (step === 2 && sp >= at);
        const stale = step === 1 || (step === 2 && !synced);
        row.classList.toggle('is-sync', synced);
        row.classList.toggle('is-stale', stale);
        const value = $('b', row);
        if (value) value.textContent = synced ? '$42.00' : '$48.00';
      });

      setCap(step);
      setStream(step, streams[step]);
      setStep(step);
    };
  };

  /* ---------- 05 · Enrollment operations ---------- */
  SCENES.enrollment = (section, steps) => {
    const pipes = $$('[data-e-node]', section);
    const slots = $$('[data-e-slot]', section);
    const f = {
      state: $('[data-e-state]', section), prog: $('[data-e-prog]', section),
      age: $('[data-e-age]', section), owner: $('[data-e-owner]', section),
      next: $('[data-e-next]', section), places: $('[data-e-places]', section),
      capState: $('[data-e-cap-state]', section)
    };
    if (!pipes.length) return null;

    const FRAMES = [
      { state: 'Unqualified', prog: '—', age: '—', owner: 'Unassigned', next: 'None', places: '4', capState: 'Open' },
      { state: 'Qualified', prog: 'Junior squad', age: 'U12', owner: 'Unassigned', next: 'Hold a trial slot', places: '4', capState: 'Checking' },
      { state: 'Booked', prog: 'Junior squad', age: 'U12', owner: 'Reception system', next: 'Send confirmation', places: '3', capState: 'Held' },
      { state: 'With a human', prog: 'Junior squad', age: 'U12', owner: 'Dana · enrollment', next: 'Call back re payment', places: '3', capState: 'Held' }
    ];
    const caps = [
      '21:40, from a phone, half the fields blank.',
      'Checked against real capacity, not an autoresponder.',
      'The slot is held, the record written. Nobody typed anything.',
      'A payment question. Not an automation decision, so it stops.'
    ];
    const streams = [
      [['inbound · web form 21:40'], ['record created · unqualified']],
      [['✓ matched programme + age band', 'ok'], ['capacity check running…', 'hold']],
      [['✓ Sat 10:00 held · places 4 → 3', 'ok'], ['✓ confirmation queued', 'ok']],
      [['! intent: payment arrangement', 'hold'], ['✓ handed to Dana with full context', 'ok']]
    ];

    const setCap = captioner(section, caps);
    const setStream = streamer($('[data-stream]', section));
    const setStep = stepLabel(section, steps);

    return (p, step) => {
      const frame = FRAMES[step];
      Object.keys(f).forEach((key) => { if (f[key]) f[key].textContent = frame[key]; });

      pipes.forEach((node, i) => {
        node.classList.toggle('is-live', i === step);
        node.classList.toggle('is-done', i < step);
      });
      slots.forEach((slot, i) => {
        slot.classList.toggle('is-held', step >= 2 && i === 0);
        slot.classList.toggle('is-gone', step >= 2 && i === 0);
      });

      setCap(step);
      setStream(step, streams[step]);
      setStep(step);
    };
  };

  /* ---------- 06 · Follow-up recovery ---------- */
  SCENES.recovery = (section, steps) => {
    const rows = $$('[data-scan-row]', section);
    const count = $('[data-scan-count]', section);
    const healthy = $('[data-scan-healthy]', section);
    const meter = $('[data-scan-progress]', section);
    if (!rows.length) return null;

    const caps = [
      'L-047 — checking the owner field.',
      'L-043 — last contact was nine days ago.',
      'L-018 — no next action set.',
      'L-052 is healthy. It is left alone, on purpose.',
      'L-027 — enquired, never booked the trial.',
      'Five gaps, one clean record, nothing sent.'
    ];
    const setCap = captioner(section, caps);

    return (p, step, sp) => {
      let gaps = 0;
      let clean = 0;
      rows.forEach((row, i) => {
        const done = i < step;
        const active = i === step;
        const result = $('small', row);
        row.classList.toggle('is-scanning', active && sp < 0.55);
        if (done || (active && sp >= 0.55)) {
          const gap = row.dataset.gap;
          row.classList.toggle('is-gap', Boolean(gap));
          row.classList.toggle('is-ok', !gap);
          if (result) result.textContent = gap || 'Healthy · skipped';
          if (gap) gaps += 1; else clean += 1;
        } else {
          row.classList.remove('is-gap', 'is-ok');
          if (result) result.textContent = active ? 'Scanning…' : 'Queued';
        }
      });

      if (count) count.textContent = String(gaps);
      if (healthy) healthy.textContent = String(clean);
      if (meter) meter.textContent = `${Math.round(p * 100)}%`;
      setCap(step);
    };
  };

  /* ---------- 07 · Voice reception ---------- */
  SCENES.voice = (section, steps) => {
    const host = $('[data-v-lines]', section);
    const wave = $('[data-v-wave]', section);
    const timer = $('[data-v-timer]', section);
    const intent = $('[data-v-intent]', section);
    const action = $('[data-v-action]', section);
    const record = $('[data-v-record]', section);
    if (!host) return null;

    const LINES = [
      ['caller', 'Hi — have you got any spaces left for the under-tens on Saturday?'],
      ['agent',  'We do. There is a 10am and a 3pm this Saturday. Which suits you better?'],
      ['caller', 'The 10am. And what does it cost?'],
      ['agent',  'It is £14 a session, or £48 for a block of four.'],
      ['caller', 'Could I pay that in two instalments?'],
      ['agent',  'That is not a decision I make. I have asked Dana to call you before nine tomorrow, and you will get a text to confirm.']
    ];
    const META = [
      ['Availability enquiry', 'Listening', 'Not yet written'],
      ['Availability enquiry', 'Checked live capacity', 'Draft · unsaved'],
      ['Price enquiry', 'Held two slots', 'Draft · unsaved'],
      ['Price enquiry', 'Quoted from the approved list', 'Draft · unsaved'],
      ['Payment arrangement', 'Refused to improvise', 'Draft · unsaved'],
      ['Payment arrangement', 'Escalated to a named owner', 'Written · L-088']
    ];
    const caps = [
      '22:14. Unknown number, nobody in the building.',
      'Answered on the second ring, from the real calendar.',
      'The caller moves the conversation. So does the agent.',
      'Every figure comes from the approved list. It invents nothing.',
      'Here is the boundary — a question it may not answer.',
      'It says so, hands over to a named person, writes the record.'
    ];

    const setCap = captioner(section, caps);

    // 28 bars given a fixed phase each, so the waveform reads as speech
    // while still being a pure function of scroll position.
    const bars = [];
    if (wave) {
      wave.replaceChildren();
      for (let i = 0; i < 28; i += 1) {
        const bar = doc.createElement('i');
        wave.append(bar);
        bars.push(bar);
      }
    }

    let shown = -1;
    return (p, step, sp) => {
      if (step !== shown) {
        shown = step;
        host.replaceChildren();
        // Only the most recent lines stay in the DOM. A transcript tall
        // enough to need its own scrollbar would swallow the wheel and
        // strand the visitor mid-scene.
        LINES.slice(Math.max(0, step - 3), step + 1).forEach(([who, text]) => {
          const line = doc.createElement('div');
          line.className = `fn-tline fn-tline--${who}`;
          const tag = doc.createElement('span');
          tag.textContent = who === 'agent' ? 'Arden · reception' : 'Caller';
          const body = doc.createElement('p');
          body.textContent = text;
          line.append(tag, body);
          host.append(line);
        });
        host.scrollTop = host.scrollHeight;

        const meta = META[step];
        if (intent) intent.textContent = meta[0];
        if (action) action.textContent = meta[1];
        if (record) record.textContent = meta[2];
        setCap(step);
      }

      const seconds = Math.round(p * 72);
      if (timer) timer.textContent = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

      // Amplitude peaks mid-frame (someone is speaking) and drops at the
      // edges (the handover between speakers) — but never to nothing, or
      // the line would look dead at every frame boundary.
      const energy = 0.32 + Math.sin(sp * Math.PI) * 0.68;
      bars.forEach((bar, i) => {
        const phase = Math.sin(i * 0.9 + sp * 14) * 0.5 + 0.5;
        bar.style.setProperty('--h', (0.14 + energy * phase * 0.86).toFixed(3));
      });
    };
  };

  /* ---------- 08 · The cockpit ---------- */
  SCENES.cockpit = (section, steps) => {
    const counters = $$('[data-k-count]', section);
    const deltas = $$('[data-k-delta]', section);
    const bars = $$('.fn-bar i', section);
    const rows = $$('[data-q-row]', section);
    const qCount = $('[data-q-count]', section);
    const range = $('[data-k-range]', section);
    if (!counters.length) return null;

    const caps = [
      'Empty. The night has run, nothing is gathered yet.',
      'Seven days of work, counted — including what never reached you.',
      'Where it came from, so you know which channel to feed.',
      'And the only part that is your job: four decisions, and their price.'
    ];
    const DELTAS = [['+18% vs last week', 'up'], ['−31% vs last week', 'up'], ['−4s vs last week', 'up'], ['4 open decisions', 'down']];
    const setCap = captioner(section, caps);

    return (p) => {
      const raw = p * steps;

      const fill = between(raw, 0.3, 1.5);
      counters.forEach((el) => {
        const to = Number(el.dataset.to || 0);
        const value = Math.round(to * fill);
        el.textContent = `${el.dataset.prefix || ''}${value.toLocaleString('en-GB')}${el.dataset.suffix || ''}`;
      });
      deltas.forEach((el, i) => {
        const on = fill >= 1;
        el.textContent = on ? DELTAS[i][0] : '—';
        el.className = on ? DELTAS[i][1] : '';
      });
      if (range) range.textContent = fill < 1 ? 'syncing…' : 'last 7 days';

      const grow = between(raw, 1.4, 2.5);
      bars.forEach((bar) => bar.style.setProperty('--grow', grow.toFixed(3)));

      const queue = between(raw, 2.4, 3.7) * rows.length;
      let shown = 0;
      rows.forEach((row, i) => {
        const on = queue > i;
        row.classList.toggle('is-in', on);
        if (on) shown += 1;
      });
      if (qCount) qCount.textContent = String(shown);

      setCap(Math.min(steps - 1, Math.floor(raw)));
    };
  };

  /* ---------- 10 · Pick your problem (scroll-driven carousel) ---------- */
  SCENES.pick = (section, steps) => {
    const track = $('[data-pick-track]', section);
    const cards = $$('[data-pick-card]', section);
    const dots = $$('[data-pick-dot]', section);
    if (!track || cards.length < 2) return null;

    const caps = [
      'Every surface quoting a different number.',
      'The enquiry that arrived while everyone was asleep.',
      'The lead that went quiet and nobody noticed.',
      'The call that rang out, then rang a competitor.',
      'Running a business you cannot actually see.',
      'Something you can run yourself, without hiring.'
    ];
    const setCap = captioner(section, caps);

    const centreOf = (card) => card.offsetLeft + card.offsetWidth / 2;

    dots.forEach((dot, i) => dot.addEventListener('click', () => {
      // Dots scroll the page rather than jumping the track, so the carousel
      // and the scrollbar never disagree about where you are.
      const t = $('.fx__track', section);
      const pin = $('.fx__pin', section);
      const travel = t.offsetHeight - pin.offsetHeight;
      const top = t.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + travel * (i / (cards.length - 1)), behavior: 'smooth' });
    }));

    return (p) => {
      // Continuous position, so the rail glides between cards instead of
      // snapping — the scroll is the transport.
      const raw = p * (cards.length - 1);
      const lo = Math.floor(raw);
      const hi = Math.min(cards.length - 1, lo + 1);
      const t = raw - lo;
      const rail = track.parentElement;
      const target = centreOf(cards[lo]) * (1 - t) + centreOf(cards[hi]) * t;
      track.style.transform = `translate3d(${Math.round(rail.clientWidth / 2 - target)}px,0,0)`;

      const active = Math.round(raw);
      cards.forEach((card, i) => {
        card.classList.toggle('is-live', i === active);
        // Everything off-centre is inert, so a stray tab lands on the card
        // the visitor is actually looking at.
        card.tabIndex = i === active ? 0 : -1;
      });
      dots.forEach((dot, i) => dot.classList.toggle('is-live', i === active));
      setCap(active);
    };
  };

  /* ═══════════ Scene wiring ═══════════ */
  function initScenes() {
    $$('[data-fx]').forEach((section) => {
      const track = $('.fx__track', section);
      const pin = $('.fx__pin', section);
      const build = SCENES[section.dataset.fx];
      const steps = Number(section.dataset.fxSteps) || 4;
      if (!track || !pin || !build) return;

      const apply = build(section, steps);
      if (!apply) return;

      let last = -1;
      readers.push(() => {
        const travel = track.offsetHeight - pin.offsetHeight;
        let p;
        if (travel > 0) {
          // Pinned: progress is position within the track behind the pin.
          p = clamp(-track.getBoundingClientRect().top / travel, 0, 1);
        } else {
          /* Short viewports drop the pin, because a console taller than the
             screen can only be pinned by clipping it or shrinking its type
             below the point anyone can read. State still comes from scroll —
             it is the section crossing the viewport rather than the track
             sliding behind a pin. */
          const vh = window.innerHeight;
          const rect = section.getBoundingClientRect();
          p = clamp((vh * 0.9 - rect.top) / (rect.height + vh * 0.2), 0, 1);
        }
        if (Math.abs(p - last) < 0.0006) return;
        last = p;
        const raw = p * steps;
        const step = Math.min(steps - 1, Math.floor(raw));
        apply(p, step, clamp(raw - step, 0, 1));
      });

      apply(0, 0, 0);
    });
  }

  /* ═══════════ What we do — sticky left, scrolling right ═══════════ */
  function initWhatWeDo() {
    const section = $('[data-fn-wwd]');
    if (!section) return;
    const details = $$('[data-wwd-det]', section);
    const slides = $$('[data-wwd-slide]', section);
    const bar = $('[data-wwd-bar]', section);
    if (!details.length) return;

    let current = -1;
    readers.push(() => {
      // Whichever detail sits closest to the reading line owns the left column.
      const line = window.innerHeight * 0.46;
      let best = 0;
      let bestGap = Infinity;
      details.forEach((det, i) => {
        const rect = det.getBoundingClientRect();
        const gap = Math.abs(rect.top + rect.height / 2 - line);
        if (gap < bestGap) { bestGap = gap; best = i; }
      });
      if (best === current) return;
      current = best;

      details.forEach((det, i) => det.classList.toggle('is-live', i === best));
      const owner = details[best].dataset.wwdOf;
      slides.forEach((slide) => slide.classList.toggle('is-live', slide.dataset.wwdSlide === owner));
      if (bar) bar.style.setProperty('--p', (details.length > 1 ? best / (details.length - 1) : 1).toFixed(3));
    });
  }

  /* ═══════════ Try it — channel choice + usage budget ═══════════
     Owns the whole live block, so showcase.js's `initLiveChannels` no longer
     binds here (its `[data-stl-*]` hooks are gone from the markup).

     HONESTY NOTE: "Call me" is a real outbound call through
     /api/create-phone-call. "Text me" opens WhatsApp with the message
     prepared — the visitor presses send — because there is no outbound
     SMS/WhatsApp endpoint yet. The copy says exactly that. The `channel`
     field is sent with every request so a real send path can be switched on
     server-side without touching this file.

     The quota below is a courtesy guard, not security: localStorage is
     trivially cleared. The enforceable limits live in api/create-phone-call.js
     (one call per number per day, 30s per address, 40/day ceiling). */
  const TRY_QUOTA = 2;
  const TRY_KEY = 'bluerook.try.v1';
  const WA_NUMBER = '447716623966';
  const WA_TEXT = 'Hi Bluerook — I just came from the portfolio and want to test the speed-to-lead system.';

  function initTry() {
    const form = $('[data-try-form]');
    if (!form) return;

    const nameField = $('[data-try-name]', form);
    const phoneField = $('[data-try-phone]', form);
    const phoneWrap = $('[data-try-phonefield]', form);
    const go = $('[data-try-go]', form);
    const label = $('[data-try-label]', form);
    const note = $('[data-try-note]', form);
    const quotaText = $('[data-try-quotatext]', form);
    const dots = $('[data-try-dots]', form);
    const clockFace = $('[data-try-clock]', form);
    const clockNote = $('[data-try-clocknote]', form);
    const steps = $$('[data-try-step]', form);
    const channels = $$('[data-try-channel]', form);
    if (!nameField || !phoneField || !go) return;

    const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`;
    const today = () => new Date().toISOString().slice(0, 10);

    const readUsed = () => {
      try {
        const raw = JSON.parse(window.localStorage.getItem(TRY_KEY) || '{}');
        return raw.day === today() ? Number(raw.used) || 0 : 0;
      } catch (error) { return 0; }
    };
    const spend = () => {
      try {
        window.localStorage.setItem(TRY_KEY, JSON.stringify({ day: today(), used: readUsed() + 1 }));
      } catch (error) { /* private mode — the server caps still apply */ }
    };
    const left = () => Math.max(0, TRY_QUOTA - readUsed());

    const paintQuota = () => {
      const remaining = left();
      if (dots) {
        dots.replaceChildren();
        for (let i = 0; i < TRY_QUOTA; i += 1) {
          const dot = doc.createElement('i');
          if (i < remaining) dot.className = 'is-left';
          dots.append(dot);
        }
      }
      if (quotaText) {
        quotaText.textContent = remaining === 0
          ? 'Daily demo budget used. It resets tomorrow.'
          : `${remaining} of ${TRY_QUOTA} demo runs left today`;
      }
      form.classList.toggle('is-spent', remaining === 0);
    };

    const channel = () => (channels.find((c) => c.checked) || {}).value || 'call';
    const needsPhone = () => channel() !== 'text';
    const validPhone = () => /^\+[1-9][\d\s()\-.]{7,20}$/.test(phoneField.value.trim());

    const LABELS = { call: 'Call me now', text: 'Open WhatsApp', both: 'Call me, then open WhatsApp' };

    let sent = false;
    const sync = () => {
      if (sent) return;
      const remaining = left();
      const ready = nameField.value.trim().length > 0 && (!needsPhone() || validPhone()) && remaining > 0;
      go.disabled = !ready;
      if (label) label.textContent = LABELS[channel()];
      if (phoneWrap) phoneWrap.classList.toggle('is-optional', !needsPhone());
      phoneField.required = needsPhone();

      if (!note) return;
      if (remaining === 0) note.textContent = 'You have used today’s demo runs. Book a call instead and we will talk properly.';
      else if (!nameField.value.trim()) note.textContent = 'Add your name to enable it.';
      else if (needsPhone() && !validPhone()) {
        note.textContent = phoneField.value.trim()
          ? 'Include the country code, for example +44 7700 900123.'
          : 'Add your mobile to enable it.';
      } else if (channel() === 'text') note.textContent = 'Ready. WhatsApp opens with the message written — you press send.';
      else if (channel() === 'both') note.textContent = 'Ready. Arden dials once, and WhatsApp opens for the thread.';
      else note.textContent = 'Ready. Arden will dial this number once.';
    };

    /* --- clock --- */
    let timer = 0;
    const startClock = (message) => {
      const began = Date.now();
      window.clearInterval(timer);
      if (clockNote && message) clockNote.textContent = message;
      timer = window.setInterval(() => {
        if (!clockFace) return;
        const seconds = Math.floor((Date.now() - began) / 1000);
        clockFace.textContent = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
      }, 200);
    };
    const markStep = (index, message) => {
      steps.forEach((step, i) => step.classList.toggle('is-done', i <= index));
      if (clockNote && message) clockNote.textContent = message;
    };
    const stopClock = (message) => {
      window.clearInterval(timer);
      if (clockNote && message) clockNote.textContent = message;
    };

    const FAILURES = {
      consent_required: 'Consent is required before any call is placed.',
      invalid_number: 'That number was not accepted. Use the full international format.',
      number_already_called: 'This number has already been called today. That limit is deliberate.',
      too_many_requests: 'Give it a moment before trying again.',
      daily_cap_reached: 'The demo has hit its daily call limit. Book a call instead and we will talk properly.',
      speed_to_lead_unconfigured: 'The outbound channel is not switched on for this environment yet.'
    };

    channels.forEach((radio) => radio.addEventListener('change', () => {
      form.dataset.channel = channel();
      sync();
    }));
    [nameField, phoneField].forEach((field) => field.addEventListener('input', sync));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (go.disabled || sent) return;

      const mode = channel();
      const wantsCall = mode === 'call' || mode === 'both';
      const wantsText = mode === 'text' || mode === 'both';

      /* The WhatsApp tab is opened inside the gesture. Opening it after an
         await would be swallowed by the popup blocker. */
      if (wantsText) window.open(waHref, '_blank', 'noopener');

      if (!wantsCall) {
        spend();
        paintQuota();
        startClock('WhatsApp opened');
        markStep(1, 'Message handed to WhatsApp. Send it and the reply lands here.');
        stopClock('Message handed to WhatsApp. Send it and the reply lands here.');
        if (note) note.textContent = 'WhatsApp is open with the message ready. Nothing was sent for you.';
        sync();
        return;
      }

      go.disabled = true;
      sent = true;
      if (label) label.textContent = 'Placing the call…';
      startClock('Intent captured');
      markStep(0, 'Intent captured');
      if (note) note.textContent = 'Recording the lead and handing it to the agent.';

      try {
        const response = await fetch('/api/create-phone-call', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: nameField.value.trim(),
            phone: phoneField.value.trim(),
            consent: true,
            channel: mode,
            whatsappFollowUp: wantsText
          })
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const reason = FAILURES[payload.error] || 'That did not go through. Book a call instead and we will talk properly.';
          sent = false;
          if (label) label.textContent = LABELS[mode];
          stopClock('Not placed');
          if (note) note.textContent = reason;
          sync();
          return;
        }

        spend();
        paintQuota();
        markStep(2, 'Agent dialling. Answer when it rings.');
        if (label) label.textContent = 'Calling you now';
        if (note) note.textContent = wantsText
          ? 'On its way. WhatsApp is open too if you would rather type.'
          : 'On its way. Answer when it rings.';
      } catch (error) {
        sent = false;
        if (label) label.textContent = LABELS[mode];
        stopClock('Not placed');
        if (note) note.textContent = 'The network refused that request. Book a call instead and we will talk properly.';
        sync();
      }
    });

    form.dataset.channel = channel();
    paintQuota();
    sync();
  }

  /* ═══════════ Progress rail ═══════════ */
  function initRail() {
    const items = $$('[data-fn-railitem]');
    if (!items.length) return;
    const targets = items
      .map((item) => ({ item, section: $(item.getAttribute('href')) }))
      .filter((entry) => entry.section);
    if (!targets.length) return;

    let current = -1;
    readers.push(() => {
      const line = window.innerHeight * 0.5;
      let active = -1;
      targets.forEach((entry, i) => {
        const rect = entry.section.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) active = i;
        else if (rect.bottom <= line) active = Math.max(active, i);
      });
      if (active === current) return;
      current = active;
      targets.forEach((entry, i) => {
        entry.item.classList.toggle('is-live', i === active);
        entry.item.classList.toggle('is-past', i < active);
      });
    });
  }

  /* ═══════════ Read loop ═══════════
     Run inline on scroll rather than behind a rAF latch: a latch that
     never clears (background tab, headless render) freezes every scene
     on its first frame, which is exactly the failure this page cannot
     survive. The work per event is a handful of rect reads. */
  function pump() {
    for (let i = 0; i < readers.length; i += 1) {
      try { readers[i](); } catch (error) { /* one bad scene must not stop the rest */ }
    }
  }

  function boot() {
    initScenes();
    initWhatWeDo();
    initRail();
    initTry();
    if (!readers.length) return;
    window.addEventListener('scroll', pump, { passive: true });
    window.addEventListener('resize', pump, { passive: true });
    window.addEventListener('load', pump);
    pump();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
