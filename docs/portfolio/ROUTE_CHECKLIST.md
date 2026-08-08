# Portfolio route checklist

Verified 2026-08-02 in a rendered local browser (`npx serve`/`python http.server`
equivalent on port 5173), not from source review alone.

- [x] Existing homepage preserved (hero, nav, existing sections intact; no console errors)
- [x] Homepage Selected Systems section added (4 cards linking into `/work/…`)
- [x] Existing navigation destinations preserved
- [x] Work navigation destination added (header, mobile menu, footer)
- [x] `/work/` — loads, lobby signal board works, links to all 11 other routes
- [x] `/work/ecommerce-operations/` — all interactions verified (see QA log)
- [x] `/work/sports-enrollment-operations/` — all interactions verified
- [x] `/work/sports-operations-os/` — scenarios, view states, reset verified
- [x] `/work/follow-up-gap-detector/` — visualizer, failure sim, detector verified
- [x] `/products/` — SOP structuring, STW #01/#02 previews verified
- [x] `/capabilities/` — speed-to-lead and reactivation verified
- [x] `/capabilities/voice/` — call simulation, scenarios, reset verified
- [x] `/capabilities/managed-operations/` — triage-to-brief flow, reset verified
- [x] `/capabilities/system-builder/` — form-to-architecture generation verified
- [x] `/technical-portfolio/` — content, print stylesheet + print button present
- [x] All header, chapter, cross-route, CTA, and footer links verified — every
      internal link resolves to one of the 12 routes (all return 200); chapter-rail
      anchors match section ids on each page
- [x] Sitemap includes every public route (12/12 in `sitemap.xml`)
