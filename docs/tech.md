# Tech — Bluerook site

## Stack

**Vanilla static site. No build step, no framework, no bundler.** Plain HTML + CSS +
JS, served as-is. Node version pinned to **24.x** on Vercel (only relevant to the
platform runtime; the site itself ships no server code).

## File map (repo root)

| File | Role |
|------|------|
| `index.html` | The entire single-page site. All sections, `<head>` SEO, inline Calendly init script. |
| `tokens.css` | **Design tokens** — brand colors, type, spacing, motion, z-index. Single source of truth. Imported first. |
| `styles.css` | All component + layout CSS. Contains a large **`@media (max-width:768px)`** block that is effectively a **separate mobile stylesheet** (own `:root` tokens prefixed `--m-`). |
| `script.js` | All interactivity: GSAP scroll animations, mobile castling scrub, carousels, swipe hints, nav, loader, tilt init. |
| `CNAME` | `bluerook.co` (GitHub Pages legacy / domain marker). |

### Web-served assets (must stay at root — referenced by absolute path)
`favicon.ico`, `favicon-96x96.png`, `favicon-src.svg`, `apple-touch-icon.png`,
`web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`, `og-image.png`,
`linkedin-logo.png`, `site.webmanifest`, `robots.txt`, `sitemap.xml`. See
[`assets.md`](assets.md).

### Other
- `assets/` — source logo PNGs (blue/paper/tower). Not all are wired into the page.
- `bluerooklogodark.png` — legacy landscape logo (was the first OG image).
- `styles_backup.css`, `gemini_cli.py` — **untracked, unrelated to the live site.**
  Safe to ignore; candidates for an `archive/` folder if tidying.

## Third-party libraries (all via CDN, loaded in `index.html`)

| Library | Version | Purpose |
|---------|---------|---------|
| GSAP + ScrollTrigger | 3.12.2 | Desktop scroll-linked animations (hero, castling, diagnosis, stacking). |
| vanilla-tilt | 1.8.1 | Card tilt on service cards (`data-tilt`). |
| Calendly widget | external | Inline booking embed on contact section. |
| Google Fonts | — | Cormorant Garamond, Geist, Geist Mono. |

## Key implementation notes

- **Mobile is a distinct experience**, not just responsive tweaks. The
  `@media (max-width:768px)` block re-declares tokens and rebuilds the hero, castling
  (a bespoke scroll-scrubbed King⇄Rook swap in `script.js`), services & privileges as
  horizontal snap **carousels**, and a cinematic "diagnosis" stage (`.diag`).
- **Mobile-only cinematic stages** (`.cast3d`, `.diag`) are `display:none` by default
  and only shown inside the mobile media query — otherwise they leak onto desktop.
- **Scroll integrity:** `html`/`body` use `overflow-x: clip` (NOT `hidden` — `hidden`
  turns them into scroll containers and breaks every `position:sticky` +
  ScrollTrigger). Carousels use `touch-action: pan-x pan-y pinch-zoom` so vertical
  swipes fall through to the page.
- **Calendly scroll trap:** the embed is wrapped with a transparent click-to-activate
  "shield" (`[data-calendly-shield]`) so the page scrolls over the iframe until
  clicked; re-arms on mouseleave.

## Running / previewing locally

Any static server works (no build). Examples:
```
python -m http.server 5173        # then open http://localhost:5173
# or
npx serve .
```
In agent sessions this was previewed via the harness preview server on port 5173.
**Always verify UI changes at mobile 390×844 and desktop before pushing.**

## Conventions

- Pull design values from `tokens.css` variables; never hard-code brand hexes.
- Match surrounding code style; keep the no-build, single-file-per-concern shape.
- Commit messages: imperative subject + short body explaining *why*.
- Deploy is automatic on push to `main` (see [`deployment.md`](deployment.md)).
