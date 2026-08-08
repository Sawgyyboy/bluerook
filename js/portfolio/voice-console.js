/* Bluerook — browser voice console
   ------------------------------------------------------------------
   The phone network refuses a long list of countries, so for a large
   part of the world this is not the fallback: it is the demo. It has
   to look like the product rather than a checkbox and a button.

   What is real here:
     · the ring moves on actual audio, agent PCM from the Retell SDK
       and microphone level from an AnalyserNode
     · the transcript is the one Retell sends, not a replay
     · the export is that transcript, written in the browser

   Nothing is stored. Close the tab and the conversation is gone,
   which is why the export exists at all.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  const doc = document;
  const $ = (s, scope = doc) => scope.querySelector(s);
  const SDK = 'https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.5/+esm';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── the ring ───────────────────────────────────────────────────
     Bars around a circle. Length is amplitude, hue says who is
     talking. Under reduced motion it draws once and stops. */
  function ring(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    const BARS = 64;
    const level = { agent: 0, user: 0 };
    const bars = new Float32Array(BARS);
    let frame = 0;
    let running = false;
    let t = 0;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(box.width));
      const h = Math.max(1, Math.round(box.height));
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    };

    const draw = () => {
      const { w, h } = size();
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.30;
      ctx.clearRect(0, 0, w, h);

      // Ties go to the agent, so silence sits in Bluerook's amber rather
      // than defaulting to a grey that looks like the thing is broken.
      const speaking = level.agent >= level.user ? 'agent' : 'user';
      const loud = Math.max(level.agent, level.user);
      const tint = speaking === 'agent' ? '255, 182, 39' : '244, 237, 224';

      const breath = reduceMotion.matches ? 0 : Math.sin(t / 26) * 0.012;

      for (let i = 0; i < BARS; i += 1) {
        const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2;
        // A fixed pseudo-random weight per bar keeps the shape organic
        // instead of a perfect circle pulsing in and out.
        const weight = 0.45 + 0.55 * Math.abs(Math.sin(i * 12.9898));
        const target = loud * weight;
        bars[i] += (target - bars[i]) * (target > bars[i] ? 0.5 : 0.12);

        // At rest the bars must not all be the same length, or the ring
        // reads as a mechanical gear. A slow travelling wave keeps it
        // looking like a voice that is listening.
        const idle = reduceMotion.matches
          ? 0.055
          : 0.055 + 0.045 * Math.sin(t / 17 + i * 0.55);

        const inner = base * (1 + breath);
        const outer = inner + base * (idle + bars[i] * 0.62);
        const alpha = 0.30 + idle * 0.9 + bars[i] * 0.62;

        ctx.strokeStyle = `rgba(${tint}, ${Math.min(1, alpha).toFixed(3)})`;
        ctx.lineWidth = Math.max(2, base * 0.052);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
        ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
        ctx.stroke();
      }

      // Core disc, brightening with the loudest voice.
      const glow = ctx.createRadialGradient(cx, cy, base * 0.08, cx, cy, base);
      glow.addColorStop(0, `rgba(${tint}, ${(0.16 + loud * 0.34).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, base, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${tint}, ${(0.34 + loud * 0.4).toFixed(3)})`;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(cx, cy, base * (1 + breath), 0, Math.PI * 2);
      ctx.stroke();
    };

    const loop = () => {
      if (!running) return;
      t += 1;
      // Decay, so a bar falls when the voice stops rather than sticking.
      level.agent *= 0.90;
      level.user *= 0.90;
      draw();
      frame = requestAnimationFrame(loop);
    };

    return {
      start() {
        if (running) return;
        running = true;
        if (reduceMotion.matches) { draw(); return; }
        frame = requestAnimationFrame(loop);
      },
      stop() {
        running = false;
        cancelAnimationFrame(frame);
        level.agent = 0;
        level.user = 0;
        bars.fill(0);
        draw();
      },
      feed(who, value) {
        if (value > level[who]) level[who] = value;
        if (reduceMotion.matches) draw();
      }
    };
  }

  /* RMS of a PCM block, scaled to something a bar can use. Matches the
     curve already used by the homepage meter so both react alike. */
  function rms(samples) {
    if (!samples || !samples.length) return 0;
    let energy = 0;
    let count = 0;
    for (let i = 0; i < samples.length; i += 4) {
      const v = samples[i];
      energy += v * v;
      count += 1;
    }
    const value = Math.sqrt(energy / Math.max(1, count));
    return Math.min(1, Math.max(0, (value - 0.006) * 9));
  }

  /* ── microphone level ───────────────────────────────────────────
     The SDK owns the call's mic. This is a second read-only tap on the
     same device purely to drive the ring, and it is optional: if the
     browser refuses, the ring still shows Arden and the call is fine. */
  async function micLevel(onLevel) {
    if (!navigator.mediaDevices?.getUserMedia) return null;
    let stream = null;
    let audio = null;
    let raf = 0;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audio = new Ctx();
      const source = audio.createMediaStreamSource(stream);
      const analyser = audio.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        onLevel(rms(buf));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } catch (error) {
      return null;
    }
    return {
      stop() {
        cancelAnimationFrame(raf);
        try { stream?.getTracks().forEach((t) => t.stop()); } catch (e) { /* gone */ }
        try { audio?.close(); } catch (e) { /* gone */ }
      },
      tracks: () => (stream ? stream.getAudioTracks() : [])
    };
  }

  /* ── transcript ─────────────────────────────────────────────────
     Retell resends the whole array each update, so this replaces
     rather than appends, and keeps a copy for the export. */
  function speaker(role) {
    const r = String(role || '').toLowerCase();
    if (r.includes('agent') || r.includes('assistant')) return 'Arden';
    if (r.includes('user') || r.includes('human')) return 'You';
    return '';
  }

  function normalise(payload) {
    return (Array.isArray(payload) ? payload : [payload])
      .map((turn) => {
        if (turn == null) return null;
        if (typeof turn === 'string') return { who: '', text: turn };
        const text = turn.content ?? turn.transcript ?? turn.text ?? '';
        return { who: speaker(turn.role), text: typeof text === 'string' ? text : String(text ?? '') };
      })
      .filter((turn) => turn && turn.text.trim());
  }

  function initVoiceConsole() {
    const card = $('[data-vc-card]');
    const panel = $('[data-vc]');
    if (!card || !panel) return;

    const consent = $('[data-vc-consent]', card);
    const go = $('[data-vc-go]', card);
    const goLabel = $('[data-vc-label]', card);
    const cardNote = $('[data-vc-cardnote]');

    const canvas = $('[data-vc-canvas]', panel);
    const stateEl = $('[data-vc-state]', panel);
    const timerEl = $('[data-vc-timer]', panel);
    const whoEl = $('[data-vc-who]', panel);
    const logEl = $('[data-vc-log]', panel);
    const noteEl = $('[data-vc-note]', panel);
    const muteBtn = $('[data-vc-mute]', panel);
    const endBtn = $('[data-vc-end]', panel);
    const exportBtn = $('[data-vc-export]', panel);
    const grid = panel.closest('.fn-try');

    const viz = canvas ? ring(canvas) : null;
    let client = null;
    let mic = null;
    let live = false;
    let began = 0;
    let timer = 0;
    let turns = [];

    const setState = (text) => { if (stateEl) stateEl.textContent = text; };
    const setNote = (text) => { if (noteEl) noteEl.textContent = text; };
    const setWho = (text) => { if (whoEl) whoEl.textContent = text; };

    const tickTimer = () => {
      if (!timerEl || !began) return;
      const s = (Date.now() - began) / 1000;
      timerEl.textContent = s < 60
        ? `${s.toFixed(1)}s`
        : `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };

    const paint = () => {
      if (!logEl) return;
      logEl.replaceChildren();
      turns.forEach((turn) => {
        const row = doc.createElement('p');
        row.className = 'vc__line';
        if (turn.who) row.dataset.who = turn.who === 'Arden' ? 'agent' : 'user';
        const tag = doc.createElement('span');
        tag.textContent = turn.who || '—';
        const body = doc.createElement('b');
        body.textContent = turn.text;
        row.append(tag, body);
        logEl.append(row);
      });
      logEl.scrollTop = logEl.scrollHeight;
      if (exportBtn) exportBtn.disabled = turns.length === 0;
    };

    /* The transcript only exists in this tab. Downloading it is the one
       way to keep it, which is the honest version of "nothing is stored". */
    const exportTranscript = () => {
      if (!turns.length) return;
      const when = new Date();
      const seconds = began ? Math.round((Date.now() - began) / 1000) : 0;
      const lines = [
        'Bluerook — conversation with Arden',
        when.toLocaleString(),
        seconds ? `Length: ${Math.floor(seconds / 60)}m ${seconds % 60}s` : '',
        '',
        'Arden is an AI voice agent. Every figure quoted on bluerook.co is',
        'synthetic demonstration data, not a client result.',
        '',
        '----------------------------------------',
        ''
      ].filter(Boolean);
      turns.forEach((turn) => lines.push(`${turn.who || '—'}: ${turn.text}`, ''));

      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = doc.createElement('a');
      a.href = url;
      a.download = `bluerook-arden-${when.toISOString().slice(0, 10)}.txt`;
      doc.body.append(a);
      a.click();
      a.remove();
      // Revoke on the next turn so the click has definitely been handled.
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNote('Transcript saved to your downloads.');
    };

    const openPanel = () => {
      panel.hidden = false;
      grid?.classList.add('is-voice-live');
      // Start the ring on open, not on connect. Waiting for the token takes
      // a second or two, and an empty canvas in that gap reads as broken.
      viz?.start();
      panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    const closePanel = () => {
      grid?.classList.remove('is-voice-live');
      // The panel stays up after the call so the transcript can be exported.
      panel.classList.add('is-ended');
    };

    const teardown = () => {
      window.clearInterval(timer);
      viz?.stop();
      mic?.stop();
      mic = null;
      client = null;
      live = false;
      panel.classList.remove('is-live');
      closePanel();
      setState('Ended');
      setWho(turns.length ? 'Call finished' : 'No conversation recorded');
      setNote(turns.length
        ? 'Nothing was stored. Export it now if you want to keep it.'
        : 'Nothing was said, so there is nothing to keep.');
      if (goLabel) goLabel.textContent = 'Start again';
      go.disabled = !consent.checked;
      if (muteBtn) { muteBtn.disabled = true; muteBtn.setAttribute('aria-pressed', 'false'); }
      if (endBtn) endBtn.disabled = true;
      tickTimer();
    };

    const endCall = async () => {
      if (!live) { teardown(); return; }
      try { await client?.stopCall?.(); } catch (error) { /* already closed */ }
      teardown();
    };

    const sync = () => {
      if (live) return;
      go.disabled = !consent.checked;
      card.classList.toggle('is-armed', consent.checked);
      if (cardNote) {
        cardNote.textContent = consent.checked
          ? 'Your browser will ask for the microphone when you start.'
          : 'Tick the box to enable the microphone.';
      }
    };
    consent.addEventListener('change', sync);

    go.addEventListener('click', async () => {
      if (live) return;
      if (!consent.checked) return;

      go.disabled = true;
      if (goLabel) goLabel.textContent = 'Connecting…';
      turns = [];
      paint();
      panel.classList.remove('is-ended');
      openPanel();
      setState('Connecting');
      setWho('Requesting a channel');
      setNote('Asking for a call token.');
      if (endBtn) endBtn.disabled = false;

      try {
        const response = await fetch('/api/create-web-call', { method: 'POST' });
        if (response.status === 503) {
          setState('Unavailable');
          setWho('Not switched on here');
          setNote('The voice channel is not configured for this environment. Book a call instead.');
          if (goLabel) goLabel.textContent = 'Start';
          go.disabled = false;
          if (endBtn) endBtn.disabled = true;
          return;
        }
        if (!response.ok) throw new Error('token request failed: ' + response.status);
        const { accessToken } = await response.json();
        if (!accessToken) throw new Error('no access token');

        setNote('Allow microphone access to begin.');
        const { RetellWebClient } = await import(SDK);
        client = new RetellWebClient();

        client.on('call_started', async () => {
          live = true;
          began = Date.now();
          panel.classList.add('is-live');
          setState('Live');
          setWho('Listening');
          setNote('Say what keeps breaking in your operation.');
          if (goLabel) goLabel.textContent = 'In progress';
          window.clearInterval(timer);
          timer = window.setInterval(tickTimer, 100);
          tickTimer();

          mic = await micLevel((value) => viz?.feed('user', value));
          if (muteBtn) {
            const canMute = typeof client.mute === 'function' || (mic && mic.tracks().length);
            muteBtn.hidden = !canMute;
            muteBtn.disabled = !canMute;
          }
        });

        client.on('agent_start_talking', () => setWho('Arden'));
        client.on('agent_stop_talking', () => setWho('Listening'));
        client.on('audio', (samples) => {
          if (samples instanceof Float32Array) viz?.feed('agent', rms(samples));
        });
        client.on('update', (payload) => {
          if (!payload) return;
          const next = normalise(payload.transcript);
          if (!next.length) return;
          turns = next;
          paint();
        });
        client.on('call_ended', teardown);
        client.on('error', () => {
          setState('Dropped');
          setNote('The call dropped. Start another, or book a call instead.');
          teardown();
        });

        await client.startCall({ accessToken });
      } catch (error) {
        console.error('[Bluerook voice] channel failed.', error);
        setState('Failed');
        setWho('Could not connect');
        setNote('The voice channel could not start. Book a call and we will speak directly.');
        if (goLabel) goLabel.textContent = 'Start';
        go.disabled = !consent.checked;
        if (endBtn) endBtn.disabled = true;
        live = false;
      }
    });

    endBtn?.addEventListener('click', endCall);
    exportBtn?.addEventListener('click', exportTranscript);

    muteBtn?.addEventListener('click', () => {
      const muted = muteBtn.getAttribute('aria-pressed') === 'true';
      const next = !muted;
      // Prefer the SDK's own control; fall back to the tracks we opened.
      if (next && typeof client?.mute === 'function') client.mute();
      else if (!next && typeof client?.unmute === 'function') client.unmute();
      else mic?.tracks().forEach((track) => { track.enabled = !next; });
      muteBtn.setAttribute('aria-pressed', String(next));
      muteBtn.textContent = next ? 'Unmute' : 'Mute';
      setNote(next ? 'Microphone off. Arden cannot hear you.' : 'Microphone on.');
    });

    window.addEventListener('pagehide', () => { if (live) endCall(); });
    window.addEventListener('resize', () => { if (!live) viz?.stop(); });

    sync();
    paint();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', initVoiceConsole, { once: true });
  } else {
    initVoiceConsole();
  }
})();
