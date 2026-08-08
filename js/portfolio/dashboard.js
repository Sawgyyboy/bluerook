/* Operations dashboard demo.
   One synthetic dataset, four views, three themes and three brands. Every
   number below is invented; nothing here reads a customer system. The brand
   switcher exists to make one point: the build is the product, and the
   identity on top of it is a variable. */
(function () {
  'use strict';

  const root = document.querySelector('[data-dash]');
  if (!root) return;

  const $  = (s, scope = root) => scope.querySelector(s);
  const $$ = (s, scope = root) => Array.from(scope.querySelectorAll(s));
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const announce = (msg) => {
    const region = document.querySelector('[data-pf-live]');
    if (!region) return;
    region.textContent = '';
    window.setTimeout(() => { region.textContent = msg; }, 20);
  };

  /* ═══════════ Synthetic data ═══════════
     Ranges exist so the 7d / 30d / All control changes real numbers rather
     than re-rendering the same figures with a new label. */
  const DATA = {
    7:   { hot: 12, convert: 3, waiting: 1,
           priorities: [
             { n: 3,  kind: 'money',  tone: 'hot',  title: 'To convert, payment not taken',
               meta: '9,000 in prepared places', tag: 'Urgent',
               detail: 'Three families accepted a place this week and no payment link was opened. The agent has drafted the follow-up; it will not send until someone releases it.' },
             { n: 1,  kind: 'ops',    tone: 'warm', title: 'Waiting on a human',
               meta: 'Longest wait 14 minutes', tag: 'Owed a reply',
               detail: 'One thread is on human_control. The bot is muted on that conversation only; every other lead is still moving.' },
             { n: 12, kind: 'growth', tone: 'ok',   title: 'Hot leads this week',
               meta: 'Average score 64 / 100', tag: 'Working',
               detail: 'Scored on deterministic rules: recency, stated intent, and whether a slot was ever offered. No model guesses a number here.' }
           ],
           risk: [
             { label: 'Accepted, unpaid',        amount: 9000,  pct: 1,    tone: 'hot',  note: '3 families' },
             { label: 'Trial booked, no show',   amount: 3500,  pct: 0.39, tone: 'mid',  note: '2 families' }
           ],
           tiles: [
             { label: 'Leads',        value: '312',   note: 'All channels' },
             { label: 'Members',      value: '66',    note: 'Active this term' },
             { label: 'Trials held',  value: '18',    note: 'This week' },
             { label: 'Agent replies',value: '193',   note: '93% resolved' }
           ],
           funnel: [
             { label: 'Open prospects',  value: 312, pct: 1 },
             { label: 'Contactable',     value: 311, pct: 0.997 },
             { label: 'Qualified',       value: 148, pct: 0.474 },
             { label: 'To convert',      value: 3,   pct: 0.01 }
           ] },
    30:  { hot: 41, convert: 7, waiting: 2,
           priorities: [
             { n: 7,  kind: 'money',  tone: 'hot',  title: 'To convert, payment not taken',
               meta: '27,000 in prepared places', tag: 'Urgent',
               detail: 'Seven families accepted a place and never completed payment. The agent prepared each follow-up with the correct amount and deadline. Nothing sends without a person releasing it.' },
             { n: 2,  kind: 'ops',    tone: 'warm', title: 'Waiting on a human',
               meta: 'Longest wait 41 minutes', tag: 'Owed a reply',
               detail: 'A billing question and a complaint. Both were stopped by the agent on purpose: sensitive intent routes to a person with the full thread attached.' },
             { n: 41, kind: 'growth', tone: 'ok',   title: 'Hot leads in the window',
               meta: 'Average score 62 / 100', tag: 'Working',
               detail: 'Every one of these has an owner and a next action written on the record. None of them is waiting on the agent.' },
             { n: 4,  kind: 'ops',    tone: 'warm', title: 'Records missing a next action',
               meta: 'Found by the nightly scan', tag: 'Review',
               detail: 'The follow-up gap detector flagged four records with no owner or no next step. It prepared a review digest and sent nothing.' },
             { n: 12, kind: 'growth', tone: 'ok',   title: 'Reactivation eligible',
               meta: 'Consent checked, within frequency cap', tag: 'Ready',
               detail: 'Dormant records that are contactable and not currently owned by anyone. Consent was read before the list was built, not after.' }
           ],
           risk: [
             { label: 'Accepted, unpaid',       amount: 27000, pct: 1,    tone: 'hot', note: '7 families' },
             { label: 'Trial booked, no show',  amount: 11500, pct: 0.43, tone: 'mid', note: '6 families' },
             { label: 'Dormant, still eligible',amount: 8000,  pct: 0.3,  tone: 'mid', note: '12 records' }
           ],
           tiles: [
             { label: 'Leads',         value: '1,090', note: 'All channels' },
             { label: 'Members',       value: '66',    note: 'Active this term' },
             { label: 'Trials held',   value: '74',    note: 'Last 30 days' },
             { label: 'Agent replies', value: '826',   note: '93% resolved' }
           ],
           funnel: [
             { label: 'Open prospects', value: 1090, pct: 1 },
             { label: 'Contactable',    value: 1088, pct: 0.998 },
             { label: 'Qualified',      value: 531,  pct: 0.487 },
             { label: 'To convert',     value: 7,    pct: 0.0064 }
           ] },
    all: { hot: 118, convert: 19, waiting: 2,
           priorities: [
             { n: 19, kind: 'money',  tone: 'hot',  title: 'To convert, payment not taken',
               meta: '71,500 across the season', tag: 'Urgent',
               detail: 'The full backlog of accepted-but-unpaid places. This is the single number most owners cannot see without asking someone to build a report.' },
             { n: 2,  kind: 'ops',    tone: 'warm', title: 'Waiting on a human',
               meta: 'Longest wait 41 minutes', tag: 'Owed a reply',
               detail: 'Handoffs never queue silently. If nobody answers, the wait time is on this screen until somebody does.' },
             { n: 118,kind: 'growth', tone: 'ok',   title: 'Hot leads on record',
               meta: 'Average score 59 / 100', tag: 'Working',
               detail: 'Season to date. Score is deterministic and readable, so a disagreement about a lead is a disagreement about a rule.' },
             { n: 31, kind: 'ops',    tone: 'warm', title: 'Records missing a next action',
               meta: 'Cumulative', tag: 'Review',
               detail: 'Found and reported. Not messaged: the detector prepares a digest and stops.' }
           ],
           risk: [
             { label: 'Accepted, unpaid',        amount: 71500, pct: 1,    tone: 'hot', note: '19 families' },
             { label: 'Trial booked, no show',   amount: 38000, pct: 0.53, tone: 'mid', note: '24 families' },
             { label: 'Dormant, still eligible', amount: 26000, pct: 0.36, tone: 'mid', note: '43 records' }
           ],
           tiles: [
             { label: 'Leads',         value: '3,062', note: 'All channels' },
             { label: 'Members',       value: '208',   note: 'Season to date' },
             { label: 'Trials held',   value: '267',   note: 'Season to date' },
             { label: 'Agent replies', value: '2,940', note: '93% resolved' }
           ],
           funnel: [
             { label: 'Open prospects', value: 3062, pct: 1 },
             { label: 'Contactable',    value: 3050, pct: 0.996 },
             { label: 'Qualified',      value: 1402, pct: 0.458 },
             { label: 'To convert',     value: 19,   pct: 0.0062 }
           ] }
  };

  const CONVERSATIONS = [
    { who: 'Samira C.', ch: 'WhatsApp', last: 'Yes please, book the Saturday one.',
      thread: [
        ['in',  'Hi, is there basketball for an 11-year-old on weekends?'],
        ['out', 'There is. Two weekend groups run locally. Which area are you in, and has she played before?'],
        ['in',  'Near the centre. First time, she just wants to try it.'],
        ['out', 'The Saturday 10:00 development group fits her age and has places this month.'],
        ['in',  'Yes please, book the Saturday one.'],
        ['sys', 'Trial held · places 4 → 3 · confirmation queued']
      ] },
    { who: 'Omar L.', ch: 'WhatsApp', last: 'That needs a person, not me.',
      thread: [
        ['in',  'We had a payment problem last season, can that be sorted first?'],
        ['out', 'That needs a person, not me. Dana owns this now and will call you tomorrow morning. Your place is safe either way.'],
        ['sys', 'handoff_state · bot_control → human_control']
      ] },
    { who: 'Nora P.', ch: 'Instagram', last: 'Confirmed for Sunday 11:30.',
      thread: [
        ['in',  'Can we move to Sunday?'],
        ['out', 'Sunday 11:30 has two places. Shall I move it?'],
        ['in',  'Yes'],
        ['out', 'Confirmed for Sunday 11:30. See you there.']
      ] },
    { who: 'Jon B.', ch: 'WhatsApp', last: 'Is there a camp during the break?',
      thread: [
        ['in',  'Is there a camp during the school break?'],
        ['out', 'The holiday camp runs in two weekly blocks. Would mornings work?']
      ] }
  ];

  const HANDOFFS = [
    { n: 41, tone: 'hot',  title: 'Billing question', meta: 'Waiting 41 min · bot muted on this thread', tag: 'Take it',
      detail: 'The caller asked about a charge from last season. The agent stopped rather than guess, and attached the full history.' },
    { n: 12, tone: 'warm', title: 'Complaint, tone flagged', meta: 'Waiting 12 min · raised by the audit', tag: 'Take it',
      detail: 'Flagged automatically before anyone had to complain twice. The thread is on human_control until it is resolved.' }
  ];

  const BRANDS = {
    northline: { name: 'Northline Athletics', mark: 'N', kind: 'Operations cockpit', owner: 'Dana',  accent: '#D4A437', ink: '#0A0F18' },
    aster:     { name: 'Aster & Vale',        mark: 'A', kind: 'Commerce cockpit',    owner: 'Mara',  accent: '#4FB286', ink: '#04140D' },
    bluerook:  { name: 'Bluerook',            mark: 'B', kind: 'Internal operations', owner: 'Hatim', accent: '#3D7FD6', ink: '#04101F' }
  };

  let range = '30';
  let prioFilter = 'all';

  /* ═══════════ Render ═══════════ */
  const set = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };

  function countUp(el, target) {
    const n = Number(String(target).replace(/[^\d]/g, ''));
    if (!Number.isFinite(n) || reduced()) { el.textContent = String(target); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 700);
      el.textContent = String(Math.round(n * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick); else el.textContent = String(target);
    };
    requestAnimationFrame(tick);
  }

  function renderHots(d) {
    $$('[data-count]').forEach((el, i) => {
      const v = [d.hot, d.convert, d.waiting][i];
      el.dataset.count = String(v);
      countUp(el, v);
    });
    set('[data-hello-line]', d.waiting > 0
      ? `${d.convert} conversions and ${d.waiting} threads need a person. Everything else is running.`
      : `${d.convert} conversions need a decision. Nothing is waiting on a human.`);
  }

  function renderPriorities(d) {
    const host = $('[data-prio]');
    if (!host) return;
    host.replaceChildren();
    const rows = d.priorities.filter(p => prioFilter === 'all' || p.kind === prioFilter);
    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = '<b>Nothing in this group</b>Which is the point. An empty queue is a working system.';
      host.append(empty);
      return;
    }
    rows.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `prio__row prio__row--${p.tone}`;
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML =
        `<span class="prio__n">${p.n}</span>` +
        `<span class="prio__t"><strong></strong><span></span></span>` +
        `<span class="prio__tag"></span>`;
      btn.querySelector('strong').textContent = p.title;
      btn.querySelector('.prio__t span').textContent = p.meta;
      btn.querySelector('.prio__tag').textContent = p.tag;

      const detail = document.createElement('div');
      detail.className = 'prio__detail';
      detail.hidden = true;
      detail.textContent = p.detail;

      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        detail.hidden = open;
        if (!open) announce(p.title + '. ' + p.detail);
      });
      host.append(btn, detail);
      if (i === 0) btn.focus?.({ preventScroll: true });
    });
  }

  function renderRisk(d) {
    const host = $('[data-risk]');
    if (!host) return;
    host.replaceChildren();
    const total = d.risk.reduce((s, r) => s + r.amount, 0);
    set('[data-risk-total]', total.toLocaleString('en-US') + ' at risk');
    d.risk.forEach((r, i) => {
      const item = document.createElement('div');
      item.className = 'risk__item' + (r.tone === 'mid' ? ' risk__item--mid' : '');
      item.innerHTML =
        `<div class="risk__top"><b></b><span></span></div>` +
        `<div class="risk__bar"><i></i></div><small></small>`;
      item.querySelector('b').textContent = r.label;
      item.querySelector('.risk__top span').textContent = r.amount.toLocaleString('en-US');
      item.querySelector('small').textContent = r.note;
      host.append(item);
      const bar = item.querySelector('.risk__bar i');
      // Start collapsed, then grow, so the panel reads as measured not printed.
      window.setTimeout(() => bar.style.setProperty('--v', String(r.pct)), reduced() ? 0 : 60 + i * 90);
    });
  }

  function renderTiles(d, sel) {
    const host = $(sel);
    if (!host) return;
    host.replaceChildren();
    d.tiles.forEach(t => {
      const el = document.createElement('div');
      el.className = 'tile';
      el.innerHTML = `<small></small><strong></strong><span></span>`;
      el.querySelector('small').textContent = t.label;
      el.querySelector('span').textContent = t.note;
      host.append(el);
      countUp(el.querySelector('strong'), t.value);
    });
  }

  function renderFunnel(d) {
    const host = $('[data-funnel]');
    if (!host) return;
    host.replaceChildren();
    d.funnel.forEach((f, i) => {
      const step = document.createElement('div');
      step.className = 'funnel__step';
      step.innerHTML = `<div class="funnel__top"><b></b><span></span></div><div class="funnel__bar"><i></i></div>`;
      step.querySelector('b').textContent = f.label;
      step.querySelector('.funnel__top span').textContent =
        f.value.toLocaleString('en-US') + '  ·  ' + (f.pct * 100).toFixed(f.pct < 0.05 ? 1 : 0) + '%';
      host.append(step);
      const bar = step.querySelector('.funnel__bar i');
      window.setTimeout(() => bar.style.setProperty('--v', String(Math.max(f.pct, 0.004))), reduced() ? 0 : 80 + i * 110);
    });
    const worst = document.createElement('p');
    worst.className = 'funnel__loss';
    const qualified = d.funnel[2].value, converting = d.funnel[3].value;
    const lost = qualified - converting;
    worst.innerHTML = `<b>Biggest drop</b> — qualified to converting loses ${lost.toLocaleString('en-US')} records. ` +
      `That gap is the whole business case, and it is visible without anyone building a report.`;
    host.append(worst);
  }

  function renderConversations() {
    const list = $('[data-conv-list]');
    const thread = $('[data-conv-thread]');
    if (!list || !thread) return;
    set('[data-conv-count]', CONVERSATIONS.length + ' open');
    list.replaceChildren();

    const paint = (i) => {
      $$('.conv__item', list).forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
      thread.replaceChildren();
      CONVERSATIONS[i].thread.forEach(([dir, text], k) => {
        const m = document.createElement('div');
        m.className = 'msg msg--' + dir;
        m.textContent = text;
        if (!reduced()) m.style.animation = `pf-rise 320ms cubic-bezier(.22,.61,.36,1) ${k * 55}ms backwards`;
        thread.append(m);
      });
      thread.scrollTop = thread.scrollHeight;
    };

    CONVERSATIONS.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'conv__item';
      b.innerHTML = `<strong></strong><span></span>`;
      b.querySelector('strong').textContent = c.who + ' · ' + c.ch;
      b.querySelector('span').textContent = c.last;
      b.addEventListener('click', () => { paint(i); announce(c.who + ' thread opened.'); });
      list.append(b);
    });
    paint(0);
  }

  function renderHandoffs() {
    const host = $('[data-hand]');
    if (!host) return;
    set('[data-hand-count]', HANDOFFS.length + ' waiting');
    host.replaceChildren();
    HANDOFFS.forEach(h => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `prio__row prio__row--${h.tone}`;
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = `<span class="prio__n">${h.n}m</span><span class="prio__t"><strong></strong><span></span></span><span class="prio__tag"></span>`;
      btn.querySelector('strong').textContent = h.title;
      btn.querySelector('.prio__t span').textContent = h.meta;
      const tag = btn.querySelector('.prio__tag');
      tag.textContent = h.tag;

      const detail = document.createElement('div');
      detail.className = 'prio__detail';
      detail.hidden = true;
      detail.textContent = h.detail;

      let taken = false;
      btn.addEventListener('click', () => {
        if (!taken) {
          taken = true;
          tag.textContent = 'You have it';
          btn.classList.remove('prio__row--hot', 'prio__row--warm');
          btn.classList.add('prio__row--ok');
          detail.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
          announce(h.title + ' taken over. The bot stays muted on that thread until you are done.');
          return;
        }
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        detail.hidden = open;
      });
      host.append(btn, detail);
    });
  }

  function renderAll() {
    const d = DATA[range] || DATA[30];
    renderHots(d);
    renderPriorities(d);
    renderRisk(d);
    renderTiles(d, '[data-tiles]');
    renderTiles(d, '[data-tiles-2]');
    renderFunnel(d);
  }

  /* ═══════════ Controls ═══════════ */
  $$('[data-view]').forEach(btn => btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    $$('[data-view]').forEach(b => b.setAttribute('aria-current', String(b === btn)));
    $$('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== view; });
    announce(btn.textContent.trim() + ' view.');
  }));

  $$('[data-prio-tab]').forEach(tab => tab.addEventListener('click', () => {
    prioFilter = tab.dataset.prioTab;
    $$('[data-prio-tab]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    renderPriorities(DATA[range] || DATA[30]);
  }));

  $$('[data-range]').forEach(chip => chip.addEventListener('click', () => {
    range = chip.dataset.range;
    $$('[data-range]').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    renderAll();
    announce('Range changed. Every figure recalculated.');
  }));

  $$('[data-theme-set]').forEach(btn => btn.addEventListener('click', () => {
    root.dataset.theme = btn.dataset.themeSet;
    $$('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  }));

  $$('[data-brand-set]').forEach(btn => btn.addEventListener('click', () => {
    const b = BRANDS[btn.dataset.brandSet];
    if (!b) return;
    $$('[data-brand-set]').forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
    root.style.setProperty('--d-accent', b.accent);
    root.style.setProperty('--d-accent-ink', b.ink);
    set('[data-brand-name]', b.name);
    set('[data-brand-kind]', b.kind);
    set('[data-brand-mark]', b.mark);
    set('[data-brand-owner]', b.owner);
    announce(b.name + ' branding applied. Same build, same data.');
  }));

  // Search filters the conversation list; a dashboard that cannot find a
  // person by name is not a dashboard anyone opens twice.
  const search = $('[data-dash-search]');
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    $$('.conv__item').forEach(item => {
      item.style.display = !q || item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  renderAll();
  renderConversations();
  renderHandoffs();
})();
