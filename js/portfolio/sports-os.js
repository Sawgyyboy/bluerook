/* Guided public-safe presentation of the Bluerook-owned fictional Sports Operations OS. */
(function () {
  'use strict';
  const root = document.querySelector('[data-sports-os]');
  if (!root) return;
  const $ = (selector, scope = root) => scope.querySelector(selector);
  const $$ = (selector, scope = root) => Array.from(scope.querySelectorAll(selector));

  const scenarios = {
    basketball: [
      ['Parent enquiry', 'Prepared basketball question received.', 'New lead'],
      ['Qualification', 'Age, goal, location and schedule recorded.', 'Qualified'],
      ['CRM', 'Synthetic household and participant linked.', 'Qualified'],
      ['Trial booking', 'Prepared session selected; capacity reduced.', 'Trial booked'],
      ['Handoff', 'Accessibility question routed with context.', 'Human review'],
      ['Dashboard', 'Selected demo KPIs and activity updated.', 'Complete']
    ],
    payment: [
      ['Parent enquiry', 'Payment problem received.', 'Exception'],
      ['Qualification', 'Identity and affected booking located.', 'Paused'],
      ['CRM', 'Issue attached to the synthetic household.', 'Handoff'],
      ['Trial booking', 'Existing session retained; no duplicate booking.', 'Protected'],
      ['Handoff', 'Customer care owner records a resolution.', 'Resolved'],
      ['Dashboard', 'Exception closes and follow-up resumes.', 'Complete']
    ],
    returning: [
      ['Campaign response', 'Returning family responds to a prepared campaign.', 'Reactivated'],
      ['Qualification', 'Current interest and programme fit reconfirmed.', 'Qualified'],
      ['CRM', 'Existing synthetic record updated once.', 'Qualified'],
      ['Trial booking', 'New trial option prepared.', 'Trial offered'],
      ['Handoff', 'No judgement exception required.', 'Automation active'],
      ['Dashboard', 'Campaign response and interest state update.', 'Complete']
    ]
  };

  let scenario = 'basketball';
  let step = 0;

  function render() {
    const path = scenarios[scenario];
    $$('[data-os-step]').forEach((item, index) => {
      item.classList.toggle('is-complete', index < step);
      item.classList.toggle('is-active', index === step);
      const heading = item.querySelector('h4');
      if (heading) heading.textContent = path[index][0];
      const copy = $('[data-os-step-copy]', item);
      if (copy) copy.textContent = path[index][1];
    });
    const current = path[Math.min(step, path.length - 1)];
    const stage = $('[data-os-stage]'); const record = $('[data-os-record]'); const status = $('[data-os-status]');
    if (stage) stage.textContent = current[0];
    if (record) record.textContent = current[1];
    if (status) status.textContent = current[2];
    const progress = $('[data-os-progress]'); if (progress) progress.textContent = `${Math.min(step + 1, path.length)} / ${path.length}`;
    const next = $('[data-os-next]'); if (next) next.textContent = step >= path.length - 1 ? 'Replay scenario' : 'Advance scenario';

    const metrics = {
      leads: $('[data-os-metric="leads"]'), trials: $('[data-os-metric="trials"]'), handoffs: $('[data-os-metric="handoffs"]'), activity: $('[data-os-metric="activity"]')
    };
    if (metrics.leads) metrics.leads.textContent = step >= 1 ? '1' : '0';
    if (metrics.trials) metrics.trials.textContent = step >= 3 && scenario !== 'payment' ? '1' : '0';
    if (metrics.handoffs) metrics.handoffs.textContent = step >= 4 && scenario !== 'returning' ? '1' : '0';
    if (metrics.activity) metrics.activity.textContent = String(Math.min(step + 1, 6));
  }

  $$('[data-os-scenario]').forEach((button) => button.addEventListener('click', () => {
    scenario = button.dataset.osScenario; step = 0;
    $$('[data-os-scenario]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
    render();
    window.BluerookPortfolio?.announce(`${button.textContent.trim()} synthetic scenario selected.`);
  }));

  $('[data-os-next]')?.addEventListener('click', () => {
    const last = scenarios[scenario].length - 1;
    step = step >= last ? 0 : step + 1;
    render();
    window.BluerookPortfolio?.announce(`${scenarios[scenario][step][0]} step active.`);
  });

  $$('[data-os-view-state]').forEach((button) => button.addEventListener('click', () => {
    const state = button.dataset.osViewState;
    const panel = $('[data-os-state-panel]');
    if (!panel) return;
    panel.dataset.state = state;
    const content = {
      loaded: 'Synthetic records loaded. All demo controls remain browser-local.',
      loading: 'Loading state: the interface preserves orientation while prepared data resolves.',
      empty: 'Empty state: no matching synthetic records. Clear filters or run a prepared scenario.',
      error: 'Error state: data could not be read. Retry or reset the deterministic demo.'
    };
    panel.textContent = content[state] || content.loaded;
    $$('[data-os-view-state]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
  }));

  function reset() {
    scenario = 'basketball'; step = 0;
    $$('[data-os-scenario]').forEach((button, index) => button.setAttribute('aria-pressed', String(index === 0)));
    $$('[data-os-view-state]').forEach((button, index) => button.setAttribute('aria-pressed', String(index === 0)));
    const panel = $('[data-os-state-panel]'); if (panel) { panel.dataset.state = 'loaded'; panel.textContent = 'Synthetic records loaded. All demo controls remain browser-local.'; }
    render();
  }
  window.BluerookPortfolio?.registerReset(reset);
  render();
})();
