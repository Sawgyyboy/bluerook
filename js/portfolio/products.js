/* Deterministic previews for Bluerook-owned products and workflow packages. */
(function () {
  'use strict';
  const root = document.querySelector('[data-products-page]');
  if (!root) return;
  const $ = (selector, scope = root) => scope.querySelector(selector);
  const $$ = (selector, scope = root) => Array.from(scope.querySelectorAll(selector));
  let stw1Run = 0;

  const sopContent = {
    purpose: 'Turn weekly customer-exception notes into an owned resolution brief.',
    scope: 'New delivery exceptions received before the daily 15:00 review. Excludes refunds and legal disputes.',
    inputs: 'Approved order state, customer message, carrier update and current owner.',
    steps: '1. Validate the order reference. 2. Locate approved state. 3. Classify the exception. 4. Assign owner and deadline. 5. Prepare customer update. 6. Record outcome.',
    exceptions: 'Missing order, disputed payment, unclear carrier state and customer complaint require human review.',
    owner: 'Commerce operations lead.',
    completion: 'Customer receives an approved update; the exception has an owner, deadline and recorded resolution.',
    review: 'Human review required before any customer-facing message or refund decision.'
  };

  $('[data-structure-sop]')?.addEventListener('click', () => {
    Object.entries(sopContent).forEach(([key, value]) => { const element = $(`[data-sop-output="${key}"]`); if (element) element.textContent = value; });
    const status = $('[data-sop-status]'); if (status) status.textContent = 'Structured synthetic process ready for review';
    window.BluerookPortfolio?.announce('Synthetic process structured into ownership, steps, exceptions and completion.');
  });

  $('[data-run-stw1]')?.addEventListener('click', () => {
    stw1Run += 1;
    const run = stw1Run;
    const steps = $$('[data-stw1-step]');
    steps.forEach((step) => step.classList.remove('is-active'));
    steps.forEach((step, index) => {
      window.BluerookPortfolio?.schedule(() => {
        if (run === stw1Run) step.classList.add('is-active');
      }, index * 180);
    });
    const output = $('[data-stw1-output]');
    if (output) output.innerHTML = '<strong>Prepared recap · synthetic</strong><br>Decision: approve the revised launch sequence.<br>Owner: Maya, by Thursday 14:00.<br>Open question: confirm accessibility review.<br>Delivery: preview only; Slack disabled.';
    const status = $('[data-stw1-status]'); if (status) status.textContent = 'Validated · Slack-ready preview · not sent';
    window.BluerookPortfolio?.announce('Synthetic transcript validated and Slack-ready recap preview prepared. Nothing sent.');
  });

  $('[data-stw1-failure]')?.addEventListener('click', () => {
    const type = $('[data-stw1-failure-type]')?.value || 'Missing decision owner';
    const output = $('[data-stw1-failure-output]'); if (output) output.textContent = `Local failure model — ${type}: output is rejected, a clarification and logging requirement is shown, and delivery remains disabled.`;
    window.BluerookPortfolio?.announce(`${type} failure simulated. Delivery remains disabled.`);
  });

  $('[data-run-stw2]')?.addEventListener('click', () => {
    const count = $('[data-stw2-count]'); if (count) count.textContent = '6 scanned · 5 flagged · 1 healthy excluded';
    const digest = $('[data-stw2-digest]'); if (digest) digest.textContent = 'Review digest prepared: missing owner, overdue follow-up, no next action, trial not booked and missing context. Contact fields withheld from analysis. No outreach sent.';
    $$('[data-stw2-row]').forEach((row) => row.classList.add(row.dataset.stw2Row === 'healthy' ? 'is-complete' : 'is-active'));
    window.BluerookPortfolio?.announce('Follow-Up Gap Detector preview complete. Five gaps flagged and healthy record excluded.');
  });

  function reset() {
    stw1Run += 1;
    Object.keys(sopContent).forEach((key) => { const element = $(`[data-sop-output="${key}"]`); if (element) element.textContent = 'Awaiting structure'; });
    const sopStatus = $('[data-sop-status]'); if (sopStatus) sopStatus.textContent = 'Prepared transcript · not processed';
    $$('[data-stw1-step], [data-stw2-row]').forEach((step) => step.classList.remove('is-active', 'is-complete'));
    const stw1 = $('[data-stw1-output]'); if (stw1) stw1.textContent = 'Run the preview to create a structured recap.';
    const stw1Status = $('[data-stw1-status]'); if (stw1Status) stw1Status.textContent = 'Ready · delivery disabled';
    const stw1Failure = $('[data-stw1-failure-output]'); if (stw1Failure) stw1Failure.textContent = 'No failure active.';
    const stw2Count = $('[data-stw2-count]'); if (stw2Count) stw2Count.textContent = 'Not scanned';
    const stw2Digest = $('[data-stw2-digest]'); if (stw2Digest) stw2Digest.textContent = 'Run the package preview to prepare a review digest.';
  }
  window.BluerookPortfolio?.registerReset(reset);
})();
