# Tech — Bluerook site

## Stack

**Vanilla site with one serverless voice-token endpoint. No build step, framework,
or bundler.** The page remains plain HTML + CSS + JS. Vercel runs the small
`/api/create-web-call` function on Node **24.x** so the Retell private API key never
ships to the browser.

## File map (repo root)

| File | Role |
|------|------|
| `index.html` | The entire single-page site. All sections, `<head>` SEO, and desktop-only Calendly loader. |
| `tokens.css` | **Design tokens** — brand colors, type, spacing, motion, z-index. Single source of truth. Imported first. |
| `styles.css` | All component + layout CSS. Contains a large **`@media (max-width:768px)`** block that is effectively a **separate mobile stylesheet** (own `:root` tokens prefixed `--m-`). |
| `cinematic-mobile.css` | Late portrait-phone layer for the bounded Diagnosis, Systems, Services, Process, and Arden scenes. |
| `script.js` | All interactivity: desktop GSAP scenes, discrete mobile narrative state, navigation, loader, service dossier, and lazy Retell SDK setup. |
| `api/create-web-call.js` | Vercel function that exchanges the server-only Retell API key for a single-call browser access token. |
| `api/retell-calendar.js` | Protected Retell custom-function endpoint for Google Calendar availability and confirmed event creation. |
| `api/lead.js` | Speed to lead. Validates, asks the n8n gate for a decision, then places the Retell call. Returns the real step trace the `/work/` page draws. |
| `api/_lead-core.js` | Shared spine for the two lead endpoints. Underscore prefix keeps Vercel from turning it into a function. |
| `api/create-phone-call.js` | The original speed-to-lead URL, now a delegate to `lead.js` so there is one code path and no way around the gate. |
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
| Calendly widget | external | Desktop-only inline booking alternative in the contact section. |
| Google Fonts | — | Cormorant Garamond, Geist, Geist Mono. |
| Retell Web SDK | 2.0.8 | Branded in-console browser voice call; loaded as a pinned ESM module when the trial starts. |

## Key implementation notes

- **Mobile is a distinct experience**, not just responsive tweaks. On portrait
  phones at least 640px tall, native vertical scroll advances bounded, discrete
  Diagnosis, Systems, and Services stages. There is no sideways gesture, nested
  scroller, or per-frame transform rewrite. Short, landscape, and reduced-motion
  phones retain normal-flow fallbacks.
- **Systems uses dedicated phone maps.** Each system renders as a four- or
  five-stage macro architecture rather than compressing its desktop node map.
  A 190ms dwell, 34px hysteresis, and adjacent-only state commit keep inertial
  scrolling from skipping or strobing workflows.
- **Mobile-only cinematic stages** (`.cast3d`, `.diag`) are `display:none` by default
  and only shown inside the mobile media query — otherwise they leak onto desktop.
- **Scroll integrity:** `html`/`body` use `overflow-x: clip` (NOT `hidden` — `hidden`
  turns them into scroll containers and breaks `position:sticky` + ScrollTrigger).
  The document's vertical gesture is the only gesture used by the mobile narrative.
- **Calendly is desktop-only.** Phones omit the iframe and its script, then show
  one Google Calendar booking action plus email fallback. Desktop retains the
  click-to-activate shield so the iframe cannot trap page scrolling.
- **Retell voice trial:** `/api/create-web-call` requires `RETELL_API_KEY` in the
  Vercel environment. It returns only a short-lived call token. The pinned Retell
  Web SDK is imported only after the visitor starts the trial, and playback PCM
  updates the branded voice meter through one `requestAnimationFrame`.
- **Voice booking:** `/api/retell-calendar` uses the Google OAuth client ID,
  client secret, refresh token, calendar ID, and `RETELL_CALENDAR_TOOL_SECRET`.
  It accepts only protected Retell POST requests, returns live timezone-aware
  slots, re-checks the selected slot immediately before booking, and sends the
  attendee invitation with the Google Meet event.
- **Speed to lead runs behind an n8n gate.** `/api/lead` validates the request,
  then asks the workflow `BLUEROOK — Speed to Lead` whether it may proceed. The
  gate holds the durable limits in workflow static data: one call per number per
  day, a 15-minute window per address for numberless "text me" leads, and a
  daily ceiling of 40. Vercel keeps a 30-second per-address speed bump in front
  so a flood costs nothing, and a copy of the quota as a fallback.

  The counters could not stay in the function: module scope dies with the
  instance, so a recycle reset every limit. That is the whole reason the
  decision moved out.

  Needs `N8N_LEAD_WEBHOOK_URL` and `N8N_LEAD_TOKEN`. Without them the endpoint
  still works but falls back to the in-memory counters and marks the response
  `degraded: true`. If the gate times out (5s) the same fallback applies, so the
  gate being down never takes the demo down.

  `POST {"mode":"health"}` to the webhook for a read-only status: whether Slack
  is reachable, how many numbers are being tracked, and the remaining budget.

  The gate spends the slot at the decision, not after the call connects. When
  Retell then fails, `/api/lead` sends `{"mode":"release"}` so the visitor's
  number is not locked out for a day over our error.
- **The `/work/` step list is a trace, not an animation.** Each row comes from
  the server response with the milliseconds it actually took. Nothing is drawn
  that the server did not report.

## Running / previewing locally

Any static server works (no build). Examples:
```
python -m http.server 5173 --bind 127.0.0.1        # then open http://localhost:5173
# or
npx serve .
```
In agent sessions this was previewed via the harness preview server on port 5173.
**Always verify UI changes at 360×800, 390×844, 430×932, 1280×720, and
1440×900 before pushing.**

## Conventions

- Pull design values from `tokens.css` variables; never hard-code brand hexes.
- Match surrounding code style; keep the no-build, single-file-per-concern shape.
- Commit messages: imperative subject + short body explaining *why*.
- Deploy is automatic on push to `main` (see [`deployment.md`](deployment.md)).
