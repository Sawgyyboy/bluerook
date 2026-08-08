/* Shared wayfinding for every Bluerook surface.
   Marks the current destination in the nav and fades the page out on an
   internal navigation so moving between routes reads as one site rather than
   a hard jump to a different one. */
(function () {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const $$ = (selector, scope = doc) => Array.from(scope.querySelectorAll(selector));

  /* --- Current destination -------------------------------------------- */
  const here = window.location.pathname.replace(/index\.html$/, '');

  const sectionOf = (path) => {
    if (path === '/' || path === '') return '/';
    const match = path.match(/^\/(work|products|capabilities|technical-portfolio)\//);
    return match ? `/${match[1]}/` : path;
  };
  const currentSection = sectionOf(here);

  $$('.nav__links a, .portfolio-nav__links a, .mobile-menu__nav a, .pf-menu nav a, [data-portfolio-menu] nav a')
    .forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      const target = sectionOf(href.replace(/index\.html$/, ''));
      if (target === currentSection) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

  /* --- Departure fade --------------------------------------------------- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const isInternal = (link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    if (link.target && link.target !== '_self') return false;
    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin && url.pathname !== window.location.pathname;
    } catch (_) {
      return false;
    }
  };

  doc.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || !isInternal(link)) return;
    if (reduce.matches) return;

    event.preventDefault();
    root.dataset.leaving = 'true';
    const go = () => { window.location.href = link.href; };
    // Navigate on the transition, with a timer as the backstop.
    let done = false;
    const once = () => { if (!done) { done = true; go(); } };
    doc.body.addEventListener('transitionend', once, { once: true });
    window.setTimeout(once, 280);
  });

  // Coming back via bfcache must not leave the page faded out.
  window.addEventListener('pageshow', () => { root.removeAttribute('data-leaving'); });
})();
