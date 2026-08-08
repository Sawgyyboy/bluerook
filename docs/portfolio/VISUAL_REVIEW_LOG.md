# Portfolio visual review log

Screenshots are stored under `docs/portfolio/screenshots/`. Every row must be based
on a rendered browser inspection, not source review.

Method note (2026-08-02, Claude session): the browser pane in this session rendered
DOM and CSS but did not composite frames, so no new screenshots could be captured.
Verification per cell below therefore used rendered-DOM metrics (viewport resize,
`scrollWidth` overflow scans, computed styles, live interaction state) rather than
pixel screenshots. The Codex-era screenshot sets (1440 / 1280 / 1024 / 390 story
tops, Inspect and Summary mode sheets, and interactive-state captures) exist for
every route and are the best current pixel evidence; a final human eyeball pass
over them (or one live scroll-through) is the remaining open item.

Legend: ✔ = DOM-verified this session · ◐ = Codex screenshot exists, not re-verified
at pixel level this session.

| Route | 1440 | 1280 | 1024/tablet | Mobile | Reduced motion | Interactive states | Findings repaired |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | — |
| `/work/` | ✔ | ◐ | ◐ | ✔ | ✔ | ✔ | — |
| `/work/ecommerce-operations/` | ✔ | ◐ | ✔ | ✔ | ✔ | ✔ | — |
| `/work/sports-enrollment-operations/` | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | — |
| `/work/sports-operations-os/` | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | — |
| `/work/follow-up-gap-detector/` | ✔ | ◐ | ◐ | ✔ | ✔ | ✔ | — |
| `/products/` | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | — |
| `/capabilities/` | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | — |
| `/capabilities/voice/` | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | reset control added |
| `/capabilities/managed-operations/` | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | reset control added |
| `/capabilities/system-builder/` | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | — |
| `/technical-portfolio/` | ✔ | ◐ | ◐ | ✔ | ✔ | ✔ | — |

Overflow scans: all 12 routes clean at 375px; dense routes re-checked clean at
768px and 1440px. Chapter rail correctly hidden ≤1180px; mobile menu verified.

## Print review

- [ ] `/technical-portfolio/` print preview has logical page breaks, readable
      contrast, visible URLs, and no interface-only controls. — `technical-print.css`
      is linked and the print button works (`window.print()`), and the stylesheet
      hides nav/dock/rail and forces light contrast, but an actual print-preview
      inspection has not been run. Open item for a human pass (Ctrl+P on the route).
