/* Local, deterministic managed-operations demonstration. */
(function () {
  'use strict';

  const page = document.querySelector('[data-managed-page]');
  const api = window.BluerookPortfolio;
  const records = window.BluerookPortfolioData?.operations?.inbox;
  if (!page || !api || !records) return;

  const $ = (selector, scope = page) => scope.querySelector(selector);
  const $$ = (selector, scope = page) => Array.from(scope.querySelectorAll(selector));
  let processed = new Set();
  let timers = [];
  let filesOrganized = false;
  let meetingStructured = false;

  function setText(selector, value) {
    $$(selector).forEach((element) => { element.textContent = value; });
  }

  function clearTimers() {
    timers.forEach((cancel) => cancel());
    timers = [];
  }

  function renderCounts() {
    setText('[data-managed-count-processed]', String(processed.size));
    setText('[data-managed-count-routine]', String(Array.from(processed).filter((id) => id === 'M-03' || id === 'M-04').length));
    setText('[data-managed-count-decisions]', String(Array.from(processed).filter((id) => ['M-01', 'M-02', 'M-03'].includes(id)).length));
    const status = processed.size < records.length
      ? `${records.length - processed.size} synthetic items awaiting triage`
      : filesOrganized && meetingStructured
        ? 'Ready to prepare brief · three decisions visible'
        : 'Inbox triaged · continue file and meeting steps';
    setText('[data-managed-status]', status);
  }

  function processRecord(record, announce = true) {
    if (!record || processed.has(record.id)) return;
    processed.add(record.id);
    const row = $(`[data-managed-item="${record.id}"]`);
    if (row) {
      row.dataset.state = 'processed';
      row.querySelector('[data-item-type]').textContent = record.type;
      row.querySelector('[data-item-owner]').textContent = record.owner;
      row.querySelector('[data-item-action]').textContent = record.action;
      row.querySelector('[data-item-state]').textContent = 'Classified · assigned';
    }
    renderCounts();
    if (announce) api.announce(`${record.subject} classified and assigned to ${record.owner}.`);
  }

  function processNext() {
    const next = records.find((record) => !processed.has(record.id));
    if (!next) {
      api.announce('Every synthetic inbox item is already classified.');
      return;
    }
    processRecord(next);
  }

  function processAll() {
    clearTimers();
    const pending = records.filter((record) => !processed.has(record.id));
    if (!pending.length) {
      api.announce('Every synthetic inbox item is already classified.');
      return;
    }
    pending.forEach((record, index) => {
      const cancel = api.schedule(() => {
        processRecord(record, false);
        if (index === pending.length - 1) api.announce('All synthetic inbox items classified. Three decisions remain with people.');
      }, index * 280);
      timers.push(cancel);
    });
  }

  function organizeFiles() {
    const tree = $('[data-file-tree]');
    if (!tree) return;
    tree.classList.add('is-organized');
    filesOrganized = true;
    const destinations = ['01_Client-delivery / Scope', '02_Exceptions / Replacement-route', '03_Campaign / Approved-assets', '04_Revenue / Follow-up-queue', '99_Archive / Source-notes', 'README / Naming-and-owner'];
    $$('[data-file-node]', tree).forEach((node, index) => {
      node.querySelector('small').textContent = `Governed path ${String(index + 1).padStart(2, '0')}`;
      node.querySelector('strong').textContent = destinations[index];
    });
    setText('[data-file-status]', 'Named · grouped · owner visible');
    renderCounts();
    api.announce('Synthetic files organized into governed paths.');
  }

  function structureMeeting() {
    meetingStructured = true;
    $$('[data-meeting-action]').forEach((row) => { row.hidden = false; });
    setText('[data-meeting-status]', 'Three owned actions extracted');
    renderCounts();
    api.announce('Synthetic meeting notes converted into three owned actions.');
  }

  function revealBrief(announce = true) {
    const brief = $('[data-managed-brief]');
    if (brief) brief.hidden = false;
    setText('[data-brief-date]', `Prepared from current local state · ${processed.size}/4 inbox items triaged`);
    const routine = [
      processed.size === records.length ? 'Four inbox signals classified and assigned.' : `${processed.size} of four inbox signals classified.`,
      filesOrganized ? 'Six synthetic files organized.' : 'File organization not yet run.',
      meetingStructured ? 'Meeting notes structured into three actions.' : 'Meeting notes not yet structured.'
    ];
    setText('[data-brief-routine]', routine.join(' '));
    const decisions = [];
    if (processed.has('M-01')) decisions.push('Approve revised scope');
    if (processed.has('M-02')) decisions.push('Confirm replacement route');
    if (processed.has('M-03') || meetingStructured) decisions.push('Approve campaign release window');
    setText('[data-brief-decisions]', decisions.length ? `${decisions.join('; ')}.` : 'No decision has been surfaced yet.');
    setText('[data-brief-risks]', processed.has('M-02') ? 'The synthetic customer delivery exception remains time-sensitive.' : 'No risk has been classified yet.');
    if (announce) api.announce(`Current founder brief prepared. ${decisions.length} decision${decisions.length === 1 ? '' : 's'} surfaced; incomplete steps remain explicitly marked.`);
  }

  function reset() {
    clearTimers();
    processed = new Set();
    filesOrganized = false;
    meetingStructured = false;
    records.forEach((record) => {
      const row = $(`[data-managed-item="${record.id}"]`);
      if (!row) return;
      row.dataset.state = 'waiting';
      row.querySelector('[data-item-type]').textContent = 'Unclassified';
      row.querySelector('[data-item-owner]').textContent = 'No owner';
      row.querySelector('[data-item-action]').textContent = 'Awaiting triage';
      row.querySelector('[data-item-state]').textContent = 'Waiting';
    });
    const tree = $('[data-file-tree]');
    tree?.classList.remove('is-organized');
    const sourceNames = ['final-v4-new.pdf', 'notes latest.docx', 'assets-use-these.zip', 'followups.csv', 'misc-old', 'untitled.txt'];
    $$('[data-file-node]').forEach((node, index) => {
      node.querySelector('small').textContent = 'Unsorted';
      node.querySelector('strong').textContent = sourceNames[index];
    });
    setText('[data-file-status]', 'Six loose synthetic items');
    $$('[data-meeting-action]').forEach((row) => { row.hidden = true; });
    setText('[data-meeting-status]', 'Unstructured notes');
    const brief = $('[data-managed-brief]');
    if (brief) brief.hidden = true;
    renderCounts();
  }

  $('[data-managed-next]')?.addEventListener('click', processNext);
  $('[data-managed-all]')?.addEventListener('click', processAll);
  $('[data-managed-organize]')?.addEventListener('click', organizeFiles);
  $('[data-managed-meeting]')?.addEventListener('click', structureMeeting);
  $('[data-managed-brief-button]')?.addEventListener('click', () => revealBrief());

  api.registerReset(reset);
  reset();
})();
