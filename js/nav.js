/* Bluerook — site navigation
   Three doors, each with a glass panel underneath. Shared by every page so the
   header is identical everywhere; funnel.js no longer owns it.
   Hover drives it on a mouse, focus on a keyboard, first-tap on a touch screen
   (a second tap follows the link — without that split, one gesture would flash
   the panel open and navigate away). */
(function () {
  'use strict';
  const doc = document;
  const $  = (s, scope = doc) => scope.querySelector(s);
  const $$ = (s, scope = doc) => Array.from(scope.querySelectorAll(s));

  /* ═══════════ Glass navigation ═══════════
     Three triggers, each with a panel underneath. Hover drives it on a mouse,
     focus drives it on a keyboard, and the first tap drives it on a touch
     screen (where hover does not exist and would otherwise swallow the link). */
  function initGlassNav() {
    const root = $('[data-fn-nav]');
    if (!root) return;
    const items = $$('[data-fn-navitem]', root);
    if (!items.length) return;

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let closeTimer = 0;

    const setOpen = (item, open) => {
      item.classList.toggle('is-open', open);
      const trigger = $('a[aria-haspopup]', item);
      if (trigger) trigger.setAttribute('aria-expanded', String(open));
      if (!open) return;
      // Keep the panel on screen: the rightmost trigger would otherwise centre
      // its panel past the viewport edge.
      const pop = $('[data-fn-pop]', item);
      if (!pop) return;
      pop.style.setProperty('--shift', '0px');
      const rect = pop.getBoundingClientRect();
      const margin = 12;
      let shift = 0;
      if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right;
      else if (rect.left < margin) shift = margin - rect.left;
      if (shift) pop.style.setProperty('--shift', `${Math.round(shift)}px`);
    };
    const closeAll = (except) => items.forEach((i) => { if (i !== except) setOpen(i, false); });

    items.forEach((item) => {
      const trigger = $('a[aria-haspopup]', item);
      const pop = $('[data-fn-pop]', item);
      const sheen = $('.fn-nav__sheen', item);

      if (canHover) {
        item.addEventListener('pointerenter', () => {
          window.clearTimeout(closeTimer);
          closeAll(item);
          setOpen(item, true);
        });
        item.addEventListener('pointerleave', () => {
          closeTimer = window.setTimeout(() => setOpen(item, false), 130);
        });
      } else if (trigger) {
        /* Touch: the first tap reveals, the second follows the link. Without
           this the panel would flash open and navigate away in one gesture. */
        trigger.addEventListener('click', (event) => {
          if (!item.classList.contains('is-open')) {
            event.preventDefault();
            closeAll(item);
            setOpen(item, true);
          }
        });
      }

      item.addEventListener('focusin', () => { closeAll(item); setOpen(item, true); });
      item.addEventListener('focusout', () => {
        window.setTimeout(() => { if (!item.contains(doc.activeElement)) setOpen(item, false); }, 0);
      });

      if (pop && sheen) {
        pop.addEventListener('pointermove', (event) => {
          const rect = pop.getBoundingClientRect();
          sheen.style.setProperty('--mx', `${Math.round(event.clientX - rect.left)}px`);
          sheen.style.setProperty('--my', `${Math.round(event.clientY - rect.top)}px`);
        });
      }
    });

    doc.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAll(); });
    doc.addEventListener('pointerdown', (event) => { if (!root.contains(event.target)) closeAll(); });
  }

  /* ═══════════ Theme toggle ═══════════
     Lives here rather than in script.js so every page gets it, and so only
     one handler is ever bound to the button. */
  const THEME_KEY = 'bluerook-theme';
  function initTheme() {
    const body = doc.body;
    const btn = $('[data-theme-toggle]');
    const apply = (t) => {
      const dark = t === 'very-dark';
      body.classList.toggle('theme-very-dark', dark);
      body.setAttribute('data-theme', dark ? 'very-dark' : 'navy');
      if (btn) btn.setAttribute('aria-pressed', String(dark));
    };
    let stored = 'navy';
    try { stored = window.localStorage.getItem(THEME_KEY) || 'navy'; } catch (e) {}
    apply(stored);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = body.classList.contains('theme-very-dark') ? 'navy' : 'very-dark';
      apply(next);
      try { window.localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  const boot = () => { initGlassNav(); initTheme(); };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
