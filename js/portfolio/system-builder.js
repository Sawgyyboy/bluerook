/* Plain-language architecture builder; all state remains local. */
(function () {
  'use strict';

  const page = document.querySelector('[data-builder-page]');
  const form = page?.querySelector('[data-builder-form]');
  const api = window.BluerookPortfolio;
  if (!page || !form || !api) return;

  const $ = (selector, scope = page) => scope.querySelector(selector);
  const $$ = (selector, scope = page) => Array.from(scope.querySelectorAll(selector));

  function checkedValue(name) {
    return form.querySelector(`[name="${name}"]:checked`)?.value || 'Not selected';
  }

  function checkedValues(name) {
    return Array.from(form.querySelectorAll(`[name="${name}"]:checked`)).map((input) => input.value);
  }

  function addNode(container, label, value) {
    const node = document.createElement('div');
    node.className = 'builder-path__node';
    const small = document.createElement('small');
    small.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = value;
    node.append(small, strong);
    container.append(node);
  }

  function render(announce = false) {
    const origin = checkedValue('origin');
    const actions = checkedValues('actions');
    const destination = checkedValue('destination');
    const boundaries = checkedValues('boundaries');
    const path = $('[data-builder-path]');
    if (!path) return;
    path.replaceChildren();
    addNode(path, 'Work begins', origin);
    addNode(path, 'System carries', actions.length ? actions.join(' · ') : 'Select at least one action');
    addNode(path, 'Record of work', destination);
    addNode(path, 'Human control', boundaries.length ? boundaries.join(' · ') : 'Select at least one boundary');
    addNode(path, 'Completion', 'Owner, state and next action are visible');

    const summaryText = `When ${origin.toLowerCase()} arrives, the system can ${actions.length ? actions.join(', ').toLowerCase() : 'carry the selected routine work'}, record the result in ${destination.toLowerCase()}, and stop for ${boundaries.length ? boundaries.join(', ').toLowerCase() : 'the selected human decisions'}.`;
    const summary = $('[data-builder-summary]');
    if (summary) {
      summary.textContent = summaryText;
    }
    const mailLink = $('[data-builder-mail]');
    if (mailLink) {
      const body = `Illustrative system shape\n\n${summaryText}\n\nWork begins: ${origin}\nSystem carries: ${actions.length ? actions.join(', ') : 'Not selected'}\nRecord of work: ${destination}\nHuman controls: ${boundaries.length ? boundaries.join(', ') : 'Not selected'}\n\nThis is a planning aid, not a quote or production specification.`;
      mailLink.href = `mailto:hatim@bluerook.co?subject=${encodeURIComponent('System shape')}&body=${encodeURIComponent(body)}`;
    }
    const disclosure = $('[data-builder-disclosure]');
    if (disclosure) disclosure.textContent = 'Illustrative system shape · not a quote, guarantee or production specification.';
    if (announce) api.announce('Illustrative system shape updated.');
  }

  form.addEventListener('change', () => render(false));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render(true);
    $('[data-builder-output]')?.scrollIntoView({ behavior: api.isReduced() || api.isPaused() ? 'auto' : 'smooth', block: 'nearest' });
  });

  function reset() {
    form.reset();
    render(false);
  }

  api.registerReset(reset);
  reset();
})();
