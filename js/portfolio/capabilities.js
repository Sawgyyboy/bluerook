/* Synthetic speed-to-lead and lead-reactivation capability prototypes. */
(function () {
  'use strict';
  const root = document.querySelector('[data-capabilities-page]');
  if (!root || !window.BluerookPortfolioData) return;
  const $ = (selector, scope = root) => scope.querySelector(selector);
  const $$ = (selector, scope = root) => Array.from(scope.querySelectorAll(selector));
  let speedRun = 0;
  let speedComplete = false;
  let selectedLead = window.BluerookPortfolioData.dormantLeads[0];
  let selectedStrategy = 'Email';

  const speedMilestones = [
    ['00:00', 'Lead submitted'], ['00:12', 'Synthetic CRM record created'], ['00:18', 'Required fields verified'], ['00:27', 'Prepared contact attempt initiated'], ['00:49', 'Intent outcome recorded'], ['01:22', 'Next action assigned']
  ];

  $('[data-speed-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    speedRun += 1; const run = speedRun; speedComplete = false;
    const name = $('[data-speed-name]')?.value.trim() || '';
    const company = $('[data-speed-company]')?.value.trim() || '';
    const need = $('#speed-need')?.value || 'High-intent service enquiry';
    const clock = $('[data-speed-clock]'); const status = $('[data-speed-status]'); const record = $('[data-speed-record]');
    $$('[data-speed-outcome]').forEach((button) => { button.disabled = true; button.setAttribute('aria-pressed', 'false'); });
    $$('[data-speed-step]').forEach((step) => step.classList.remove('is-active', 'is-complete'));
    if (clock?.childNodes[0]) clock.childNodes[0].nodeValue = '00:00';
    if (record) record.textContent = 'No lead submitted';
    const preparedAction = $('[data-speed-action]'); if (preparedAction) preparedAction.textContent = 'No CRM action prepared.';
    if (!name || !company) {
      if (status) status.textContent = 'Required fictional fields are missing';
      const missing = !name ? $('[data-speed-name]') : $('[data-speed-company]');
      missing?.focus();
      window.BluerookPortfolio?.announce('Enter both fictional lead and company fields before running the sequence.');
      return;
    }
    if (record) record.textContent = `${name} · ${company} · ${need} · synthetic local record`;
    if (status) status.textContent = 'Prepared sequence running · no real contact';
    speedMilestones.forEach(([time, label], index) => {
      window.BluerookPortfolio?.schedule(() => {
        if (run !== speedRun) return;
        if (clock) clock.childNodes[0].nodeValue = time;
        const step = $$('[data-speed-step]')[index];
        if (step) { step.classList.add('is-active'); step.querySelector('p').textContent = label; }
        $$('[data-speed-step]').slice(0, index).forEach((prior) => { prior.classList.remove('is-active'); prior.classList.add('is-complete'); });
        if (index === speedMilestones.length - 1) {
          speedComplete = true;
          if (status) status.textContent = 'Prepared sequence complete · choose a fictional outcome';
          $$('[data-speed-outcome]').forEach((button) => { button.disabled = false; });
          window.BluerookPortfolio?.announce('Synthetic speed-to-lead sequence complete. Choose an outcome.');
        }
      }, index * 520);
    });
  });

  const speedActions = {
    Interested: 'Create meeting-selection task and assign revenue owner.',
    'Not now': 'Record timing reason and schedule one permission-aware follow-up.',
    'Wrong person': 'Stop sequence and create a task to identify the appropriate contact.',
    'No answer': 'Record attempt, enforce frequency limit and queue the next permitted window.',
    'Request callback': 'Assign callback owner at the requested synthetic time.',
    'Opt out': 'Suppress all future automated contact and preserve the audit event.'
  };

  $$('[data-speed-outcome]').forEach((button) => button.addEventListener('click', () => {
    if (!speedComplete) { window.BluerookPortfolio?.announce('Run the synthetic sequence before choosing an outcome.'); return; }
    const outcome = button.dataset.speedOutcome; const output = $('[data-speed-action]');
    if (output) output.textContent = speedActions[outcome];
    $$('[data-speed-outcome]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
    const status = $('[data-speed-status]'); if (status) status.textContent = `${outcome} · CRM action prepared`;
    window.BluerookPortfolio?.announce(`${outcome} selected. ${speedActions[outcome]}`);
  }));

  function renderLead() {
    const mapping = { name: $('[data-reactivation-name]'), reason: $('[data-reactivation-reason]'), age: $('[data-reactivation-age]'), consent: $('[data-reactivation-consent]'), status: $('[data-reactivation-status]'), suggested: $('[data-reactivation-suggested]') };
    mapping.name.textContent = selectedLead.name; mapping.reason.textContent = selectedLead.reason; mapping.age.textContent = selectedLead.age; mapping.consent.textContent = selectedLead.consent; mapping.status.textContent = selectedLead.status; mapping.suggested.textContent = selectedLead.suggested;
    $$('[data-reactivation-lead]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.reactivationLead === selectedLead.id)));
    syncAllowedStrategies();
  }

  function allowedStrategies() {
    if (selectedLead.status === 'Healthy') return [];
    if (selectedLead.consent === 'Human review only') return ['Human review only'];
    if (selectedLead.consent === 'Voice + SMS permitted') return ['SMS', 'Voice', 'Voice + SMS', 'Human review only'];
    return ['Email', 'Human review only'];
  }

  function syncAllowedStrategies() {
    const allowed = allowedStrategies();
    if (!allowed.includes(selectedStrategy)) selectedStrategy = allowed[0] || 'Human review only';
    $$('[data-reactivation-strategy]').forEach((button) => {
      const permitted = allowed.includes(button.dataset.reactivationStrategy);
      button.disabled = !permitted;
      button.setAttribute('aria-pressed', String(permitted && button.dataset.reactivationStrategy === selectedStrategy));
    });
    $$('[data-reactivation-outcome]').forEach((button) => { button.disabled = selectedLead.status === 'Healthy'; });
    const plan = $('[data-reactivation-plan]');
    if (plan) plan.textContent = selectedLead.status === 'Healthy'
      ? 'Healthy record excluded. Strategy and outcome controls are disabled.'
      : `${selectedStrategy} is compatible with the synthetic consent state. Contact window, frequency limit and human review remain required; no contact occurs.`;
    const action = $('[data-reactivation-action]');
    if (selectedLead.status === 'Healthy' && action) action.textContent = 'Healthy record excluded. No reactivation action allowed.';
  }

  $$('[data-reactivation-lead]').forEach((button) => button.addEventListener('click', () => {
    selectedLead = window.BluerookPortfolioData.dormantLeads.find((lead) => lead.id === button.dataset.reactivationLead) || window.BluerookPortfolioData.dormantLeads[0];
    $$('[data-reactivation-outcome]').forEach((candidate) => candidate.setAttribute('aria-pressed', 'false'));
    const action = $('[data-reactivation-action]'); if (action) action.textContent = 'No outcome recorded.';
    const audit = $('[data-reactivation-audit]'); if (audit) audit.textContent = 'No audit event.';
    const activeCard = $('[data-reactivation-active-card]'); if (activeCard) { activeCard.hidden = true; activeCard.classList.remove('is-returned'); }
    renderLead();
  }));

  $$('[data-reactivation-strategy]').forEach((button) => button.addEventListener('click', () => {
    if (button.disabled) return;
    selectedStrategy = button.dataset.reactivationStrategy;
    $$('[data-reactivation-strategy]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
    const plan = $('[data-reactivation-plan]'); if (plan) plan.textContent = `${selectedStrategy} is compatible with the synthetic consent state. Contact window, frequency limit and human approval must still pass; no contact occurs.`;
  }));

  const reactActions = {
    Interested: 'Return to active pipeline · owner assigned · next conversation prepared.',
    Later: 'Record requested future window · no contact before that date.',
    'Not interested': 'Close with reason · suppress campaign re-entry.',
    'Invalid contact': 'Mark channel invalid · do not retry through the same route.',
    'Opt out': 'Apply global suppression · audit event retained.',
    'Needs human review': 'Pause all automation · assign relationship owner with context.'
  };

  $$('[data-reactivation-outcome]').forEach((button) => button.addEventListener('click', () => {
    const outcome = button.dataset.reactivationOutcome; const action = $('[data-reactivation-action]'); const audit = $('[data-reactivation-audit]');
    if (selectedLead.status === 'Healthy') { if (action) action.textContent = 'Healthy record excluded. No reactivation action allowed.'; return; }
    if (action) action.textContent = reactActions[outcome];
    if (audit) audit.textContent = `${selectedLead.id} · ${selectedStrategy} · ${outcome} · human-reviewed synthetic outcome`;
    const activeCard = $('[data-reactivation-active-card]');
    if (activeCard) {
      activeCard.hidden = outcome !== 'Interested';
      activeCard.classList.toggle('is-returned', outcome === 'Interested');
      const name = $('strong', activeCard); if (name) name.textContent = selectedLead.name;
    }
    $$('[data-reactivation-outcome]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
    window.BluerookPortfolio?.announce(`${outcome} outcome recorded. ${reactActions[outcome]}`);
  }));

  function reset() {
    speedRun += 1; speedComplete = false;
    const clock = $('[data-speed-clock]'); if (clock) clock.childNodes[0].nodeValue = '00:00';
    const status = $('[data-speed-status]'); if (status) status.textContent = 'Ready · no real contact';
    const record = $('[data-speed-record]'); if (record) record.textContent = 'No lead submitted';
    const action = $('[data-speed-action]'); if (action) action.textContent = 'No CRM action prepared.';
    const speedName = $('[data-speed-name]'); if (speedName) speedName.value = 'Jordan Vale';
    const speedCompany = $('[data-speed-company]'); if (speedCompany) speedCompany.value = 'Northstar Studio';
    const speedNeed = $('#speed-need'); if (speedNeed) speedNeed.selectedIndex = 0;
    $$('[data-speed-step]').forEach((step) => step.classList.remove('is-active', 'is-complete'));
    $$('[data-speed-outcome]').forEach((button) => { button.disabled = true; button.setAttribute('aria-pressed', 'false'); });
    selectedLead = window.BluerookPortfolioData.dormantLeads[0]; selectedStrategy = 'Email'; renderLead();
    syncAllowedStrategies();
    $$('[data-reactivation-outcome]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
    const plan = $('[data-reactivation-plan]'); if (plan) plan.textContent = 'Select a strategy. No contact will occur.';
    const reactAction = $('[data-reactivation-action]'); if (reactAction) reactAction.textContent = 'No outcome recorded.';
    const audit = $('[data-reactivation-audit]'); if (audit) audit.textContent = 'No audit event.';
    const activeCard = $('[data-reactivation-active-card]'); if (activeCard) { activeCard.hidden = true; activeCard.classList.remove('is-returned'); }
  }
  window.BluerookPortfolio?.registerReset(reset);
  renderLead();
})();
