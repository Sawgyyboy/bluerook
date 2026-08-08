# Cinematic portfolio — build progress

Last updated: 2026-08-02 (Claude session, continuing from Codex handoff)

## Current phase

Build complete and functionally verified locally. Remaining open items are the two
human visual passes listed below. Nothing is committed, pushed, or deployed.

## Completed routes

All 12: `/` (Selected Systems + Work nav), `/work/`, `/work/ecommerce-operations/`,
`/work/sports-enrollment-operations/`, `/work/sports-operations-os/`,
`/work/follow-up-gap-detector/`, `/products/`, `/capabilities/`,
`/capabilities/voice/`, `/capabilities/managed-operations/`,
`/capabilities/system-builder/`, `/technical-portfolio/`.
All present in `sitemap.xml`. See `ROUTE_CHECKLIST.md`.

## Completed interactions

Every required experience is implemented and was exercised in a rendered browser —
see `EXPERIENCE_CHECKLIST.md` and `QA_LOG.md` for the full verified list
(commerce simulation, description approval, discovery terminal, order exceptions,
sports journey, audit correction, workflow visualizer + failure sim, gap detector,
Sports OS scenarios, Arden, speed-to-lead, reactivation, managed operations,
Process to SOP, STW packages, system builder, technical portfolio, lobby, modes,
pause/reset/replay/skip, reduced motion, keyboard, mobile menu).

## Cinematic motion layer (2026-08-04)

Owner feedback: the portfolio read as mostly text and static. Added a motion
layer on top of the existing simulations — no new events are fabricated; motion
decorates the deterministic state the page modules already manage:

- `js/portfolio/cinematic.js` (new, loaded on all 11 portfolio routes) +
  a "CINEMATIC LAYER" section in `css/portfolio/portfolio.css` (v=20260804b).
- Hero atmosphere: drifting Bluerook-Blue bloom + breathing survey ring.
- Lobby signal board: staggered card arrival, idle drift, cycling brass
  "unrouted" pings (one brass point at a time), settle flash on resolve; the
  resolved axis moved below the row; ≤1180px resolved state now stacks with a
  640px field (fixed card overlap at ~1000px widths).
- Workflow visualizer: connectors carry a moving current; failure re-tints the
  current and pulses the affected node; recovery steps cascade in.
- Terminals: blinking caret + character-typed output (MutationObserver wrapper,
  no changes to commerce.js).
- Value-flash system: any simulated value whose text actually changes ripples
  with a brief brass tint (WeakMap text-diff cache prevents no-op strobing —
  verified: no-op clicks flash 0 elements, a real qualification flashes 6).
- Live pulsing dot in the topline of every interactive scene; activity-log
  entries slide in; timeline steps pop; Story/Inspect/Summary switches
  crossfade; buttons acknowledge presses; display italics land a beat late.
- Chapter-rail tick converted from width transition to scaleX (compositor-only).
- All new motion dies under reduced-motion (global `animation: none` verified)
  and pauses under the pause toggle; typing uses the pause-aware `schedule()`.
- Verified in the rendered pane (compositing this time): screenshots of lobby
  unresolved/resolved, zero console errors on all re-tested routes.

## Work done this session (2026-08-02, post-Codex)

- Full repository audit; wrote `RESUME_FROM_CODEX.md`.
- Browser-tested every route and interaction; zero console errors anywhere.
- Fixed: `/capabilities/voice/` and `/capabilities/managed-operations/` had
  registered reset handlers but no visible reset control — added `data-reset-demo`
  buttons and verified both restore initial state.
- Responsive overflow scans (375/768/1440), mobile-menu accessibility check,
  reduced-motion verification, keyboard pass.
- Privacy and claim scans across all public HTML/JS/CSS — clean (see QA log).
- Updated all checklist and log documents from observed results.

## Known open items

1. Human pixel-level visual pass (the session's browser pane could not composite
   frames, so no fresh screenshots; Codex screenshot sets exist for all routes).
2. Print-preview inspection of `/technical-portfolio/` (print CSS in place and
   source-verified; not yet eyeballed in an actual print dialog).
3. `C:/Projects/BLUEROOK_WORKSPACE/bluerook-agent-control/NOW.md` was NOT updated —
   the handoff instructions declared the workspace read-only for this session.
   Update it manually when adopting this state.

## Validation completed

See `QA_LOG.md` — functional, responsive, reduced-motion, keyboard, privacy,
claim-boundary, and performance passes all executed with results recorded.

## Known issues

- The repository still carries extensive pre-existing owner work (uncommitted
  tracked modifications and untracked directories). Portfolio changes remained
  additive; nothing outside the portfolio integration points was rewritten.
- No approved client identity, testimonial, benchmark, or performance outcome
  exists; all public demonstrations use explicit synthetic/anonymized labels
  per `CLAIM_LEDGER.md` and `EVIDENCE_MATRIX.md`.

## Resume

Serve locally from the repository root with `python -m http.server 5173 --bind 127.0.0.1` (or
`npx serve -l 5173 .`). State of record: `FINAL_HANDOFF.md`.

## Direction change — single-scroll showcase (2026-08-04, later)

Owner rejected the multi-page portfolio: "it needs to be one scrolling section
portfolio not multiple pages filled with generic text... strong copy, big titles
and more visuals than text", and noted the portfolio pages were missing the main
site's ambient world (glassmorphism, glow, mouse tracking, banner animation).

Reference portfolios supplied and studied in-browser:
wallofportfolios.in/portfolios/ashish-ranjan and .../rajat-berry — both are
single-scroll, dark, huge display type, full-bleed alternating sections,
marquee strips, and progressive word-brightening statements.

**What changed**

- `/work/` rebuilt as ONE cinematic single-scroll page (old multi-page lobby
  preserved at `docs/portfolio/work-index-multipage-backup.html`).
- New `css/portfolio/showcase.css` + `js/portfolio/showcase.js`.
- The page now loads the **main site's `styles.css`**, so the ambient orbs,
  cursor bloom, grain, glass and buttons are literally the same system as the
  homepage — this is what was missing before. Also loads GSAP + ScrollTrigger +
  Lenis, matching the homepage stack.
- Scroll spine: hero (100svh, perspective grid + drifting particles + split-word
  entrance) → marquee band → progressive word-lit thesis → four numbered system
  chapters, each a big glass panel with a working demo → capabilities grid with
  per-card CSS diagrams → closing statement → CTA.
- Four purpose-built inline demos replace walls of prose: price-sync across three
  surfaces, enrollment journey with human handoff, workflow break with recovery
  path, and the follow-up gap scan.
- The eleven deep-dive routes are UNCHANGED and still linked ("Open the full
  system"), so Story/Inspect/Summary and the full simulations are not lost.

**Verified in-browser (1440 / 1280 / 375)**

Zero console errors; no horizontal overflow at any width; all four demos behave
correctly (price sync stale→published, journey 5 stages + wrap, workflow break →
4-step recovery → restore, scan 5 flagged / 1 healthy excluded); split-word hero
entrance fires; statement brightening tracks scroll (0 lit at top → 20/27 at
centre); scroll progress bar tracks; roving arrow keys on workflow nodes; skip
link is first focusable; all 14 routes/assets return 200.

**Repaired during this pass**

- Approve button stretched full width → constrained with `justify-self: start`.
- Three sync surfaces sat on ragged baselines → reserved art block on the two
  text-only surfaces.
- Mobile hero type was under-scaled (32.8px) → raised to a 2.7rem floor.
- Capability cards were four identical text blocks → each now carries its own
  CSS-drawn diagram (emission rings, clock sweep, settling rows, branching path).
- **Contrast failure**: hero meta strip and footer used `--color-text-fade`
  (2.61:1, below the 4.5:1 minimum) → moved to `--color-text-dim` (4.71:1).

## House-style alignment + live-chat groundwork (2026-08-04, later still)

**Nav inconsistency fixed (owner-reported).** The ten deep-dive routes used a flat
`.portfolio-nav` bar while the rebuilt `/work/` used the main site's floating
glass pill. All ten now carry:
- the ambient world (4 drifting orbs + cursor bloom), matching `styles.css`
- the same floating glass nav pill (20px radius, blur(22px) saturate(135%),
  weight added on scroll)
- orb drift + cursor tracking via `cinematic.js` (Web Animations API, so no GSAP
  dependency is added to those pages)

Regression caught and repaired during verification: the first pass set
`position: relative` on `.mode-dock`, `.chapter-rail` and `.page-progress`,
which broke their fixed positioning and dumped the mode dock into the top-left
of the page. Corrected to set `z-index` only. Verified dock/rail are `fixed`
again, nav radius is 20px, 4 orbs present on all ten routes, no overflow,
zero console errors.

**`/api/chat.js` added — server-side Claude proxy (inert until keyed).**
Follows the exact protections already in `create-web-call.js`: origin/referer
lock to bluerook.co + localhost + bluerook*.vercel.app, per-address cooldown,
POST only. Key is read from `process.env.ANTHROPIC_API_KEY` and never reaches
the browser. Returns a clean `not_configured` 503 when the key is absent.
Guardrails in the system prompt: no pricing, no client names, no metrics, no
claims of production status, no actions (it cannot book, look up or send), and
embedded instructions in visitor messages are ignored.
`ANTHROPIC_API_KEY` added to `.env.example`.

NOT yet verifiable locally: `python -m http.server` cannot execute Vercel
functions and the Vercel CLI is not installed, so this endpoint has been syntax
checked and reviewed but not executed. It needs `vercel dev` or a preview
deployment plus the owner setting the key.

## Live speed-to-lead section (2026-08-04)

Added `#try` to `/work/` — the only section on the page that reaches a real
service. Owner asked for WhatsApp and voice, both consent-gated.

**Design decision that removes the main risk:** neither channel collects a phone
number, so there is no harassment vector (nobody can make Bluerook call a
stranger) and no toll-fraud vector.
- **WhatsApp** is a `wa.me` deep link the visitor sends themselves. Nothing is
  submitted from the page; Bluerook's number is the destination, not an input.
- **Voice** is a browser call through the existing `/api/create-web-call`
  endpoint. The microphone permission prompt is the consent. No call is placed
  to the visitor.

Both are gated behind an explicit checkbox; buttons are inert until it is ticked.
A response clock starts when a channel opens and marks channel-opened →
request-received → answered.

Verified locally at 1280 and 375: consent gating works (button `aria-disabled`
flips, card arms), the WhatsApp href builds correctly with the prefilled text,
44px+ tap targets, no horizontal overflow, zero console errors.

NOT verified: the live voice path. The static local server returns 501 for
`/api/create-web-call`, so only the graceful-degradation branch is reachable
here; the success path needs `vercel dev` or a preview deployment. The code
handles 503 (`voice_trial_unconfigured`) with a specific message and falls back
to WhatsApp/booking on any other failure.

## SECURITY — key exposure 2026-08-04

The owner pasted a live `sk-ant-api03-…` Anthropic key into the chat transcript.
It was NOT written to any file, committed, or used. The key must be treated as
compromised and rotated at console.anthropic.com. The correct install path is
`vercel env add ANTHROPIC_API_KEY` (or the Vercel dashboard), where the value
goes straight from the owner to the platform.

## Channel 03 · text assistant (2026-08-04)

Added the chat panel to `#try` on `/work/`, wired to `/api/chat`.

- Transcript is in-memory only: nothing is written to localStorage/sessionStorage
  and a reload clears it. History is sent with each turn so the assistant keeps
  context, capped server-side at 16 turns / 1200 chars per message.
- States handled: ready, thinking (animated indicator, input disabled),
  429 rate-limited, 503 not-configured (panel goes visibly offline and points at
  the other two channels), and generic failure (falls back to the email address).
- Accessibility: `role="log"` + `aria-live="polite"` transcript, visually-hidden
  label on the input, 46px input, 44px send button.

Verified locally at 1280: user bubble renders, typing indicator appears, input
disables during flight, error branch fires cleanly (the static server returns 501
for `/api/chat`), input re-enables, state returns to Ready. No overflow.
The two console errors present are this module's own deliberate diagnostics for
that 501 and are expected until the endpoint runs.

NOT verified: the success path. Needs `vercel dev` or a preview deploy plus
ANTHROPIC_API_KEY set by the owner.

### Key handling

The owner asked me to install the pasted key directly. Declined — API keys are
not something I write into a repo, and that key is compromised by having been
pasted into a chat transcript regardless. Correct path remains
`vercel env add ANTHROPIC_API_KEY` after rotating at console.anthropic.com.
No key value exists anywhere in this repository.

## Social preview + Arden call report (2026-08-04)

**Social meta on `/work/` (was completely missing).** The homepage carried a full
og/twitter set; `/work/` had zero, so pasting the portfolio link into WhatsApp,
LinkedIn or email rendered a bare URL — on the page the owner shares with
prospects. Added the full set (og:type/site_name/locale/url/title/description/
image + dimensions + alt, twitter:summary_large_image) pointing at the existing
branded `og-image.png` (verified 1200x630).

**Arden call report export.** `/capabilities/voice/` gains a "Download call
report" button, enabled only once a simulated call has ended and re-disabled on
reset. It builds a self-contained, printable HTML document from the state already
on screen: scenario, caller line, Arden's reply, detected intent, operational
state, business action, human boundary, synthetic CRM record, calendar effect,
follow-up, recorded outcome and call state at export. Downloaded via Blob — no
upload, no network call, nothing leaves the browser. Carries an explicit
disclosure that no telephone call was placed and no real record was created.

Verified: button gating across idle/connected/ended/reset; generated document
parsed and checked (12 rows, all fields populated from live state, disclosure
present); rendered in an iframe for a visual pass — clean Bluerook mark, correct
hierarchy, readable table. Zero console errors.

### Higgsfield

Now connected and its tools are available, but the account is on the free plan
with 0 credits, so no generation was attempted and no purchase was triggered.
The OG card therefore reuses the existing branded asset rather than a generated
one. ImageMagick and PIL are both present locally if a bespoke card is wanted
later without spending credits.

## Speed to lead corrected to OUTBOUND (2026-08-04)

Owner correction: "speed to lead is when a lead shows interest the ai reachout
to them while their hot either by call or msg, call is the best way." The prior
build had it backwards — inbound (visitor contacts Bluerook). That demonstrates
responsiveness but is not the product. Rebuilt as outbound.

**`api/create-phone-call.js` (new).** Retell outbound call. Visitor submits name
+ their own mobile + explicit consent; Arden dials them.

Because this places a real call to a number typed into a public page, it carries
harassment and cost risk that the other endpoints do not. Controls:
- consent must be boolean `true` or the request is rejected outright
- E.164 validation, plus a blocklist of premium-rate / personal-numbering /
  global-network prefixes that are expensive or abusive by construction
- **one call per number per 24h** — the control that stops the endpoint being
  pointed repeatedly at someone else
- 30s per-address cooldown
- 40-call daily ceiling so a bad day cannot become a bad invoice
- counters commit only after the call is genuinely placed
- consent timestamp recorded in call metadata

Requires `RETELL_FROM_NUMBER` (E.164) alongside the existing `RETELL_API_KEY`.
Both added to `.env.example`.

**KNOWN LIMITATION, deliberately documented in the endpoint header:** the
counters live in module scope and reset when a serverless instance recycles.
They are a real speed bump, not a durable quota. Before running this at volume,
move `recentNumbers` and `dailyCount` into Vercel KV / Upstash Redis so the caps
hold across instances.

**UI.** `#try` restructured to four cards: WhatsApp message (01), speed-to-lead
outbound form (02, double-width), browser voice call (03), response clock.
Clock steps rewritten for the outbound story: intent captured → lead recorded →
agent dialling. Section copy now frames the gap between intent and contact as
the product.

Verified locally at 1280: progressive validation gating (name → country-code
check with a specific correction message → consent), 48px inputs, no overflow,
zero console errors, four-card layout with the form spanning two columns.

NOT verified: an actual placed call. Needs `vercel dev` or a deploy, plus
`RETELL_FROM_NUMBER`. Every documented failure mode returns a specific
user-facing message; the generic branch falls back to booking.

## First deployment (2026-08-04) — PREVIEW ONLY

Owner authorised a preview deploy via an explicit choice prompt.

**Environment configured** (owner set the Anthropic key themselves via the Vercel
dashboard; the assistant set the non-secret phone number):
- `ANTHROPIC_API_KEY` — Preview + Production (owner)
- `RETELL_FROM_NUMBER` = the provisioned Retell number — Production, Preview,
  Development (assistant; a phone number is not a credential)
- `RETELL_API_KEY` — already present from 8 days prior

**Deployed:** `bluerook-i87ao5y03-sawgyyboys-projects.vercel.app` (preview).
NOT promoted to production. `vercel deploy --prod` was not run.

**Vercel Authentication is ON for this deployment** (`vercel_auth_enabled: true`).
Anonymous requests to `/work/`, `/api/chat` and `/api/create-phone-call` are
turned away with 401 at the platform edge before reaching any handler. This
resolves the concern raised when the outbound call endpoint was built: the
non-durable in-memory rate limits are not currently exposed to the public,
because the deployment itself is not public.

Consequence to be aware of: the preview URL cannot be handed to a prospect —
they would hit the SSO wall. Showing it to someone outside the Vercel team needs
either deployment protection disabled for that preview, or promotion to
production.

**Production is untouched.** `bluerook.co/work/` currently returns 404; the
portfolio has never been on production. The live homepage is unaffected.

**Still not verified end to end:** a real placed call and a real assistant reply.
Both endpoints are configured and deployed but were exercised only through the
platform's auth wall, so the success paths remain unconfirmed. The owner needs to
open the preview in a browser signed into the Vercel team and test both.

### Before this goes public

Move the per-number and daily call counters in `api/create-phone-call.js` out of
module scope and into a shared store (Vercel KV / Upstash). Until then the caps
are per-instance and reset on recycle, which is acceptable behind SSO but not on
an open production URL.

## Four visual/navigation defects fixed (2026-08-04)

Owner reported a line cutting the site in half, a nav "mixing the old and new",
navigation changing page to page, and links disappearing when the window narrows.

**1. Vertical line splitting the homepage.** `css/portfolio/home-integration.css`
painted a deliberate centre rule via
`linear-gradient(90deg, transparent 0 49.92%, <line> 50%, transparent 50.08%)`
on `.selected-systems`. Read as a rendering fault rather than a design device.
Removed; the section now uses a flat background.

**2. Stray gold line through the nav.** `.page-progress` was `position: fixed;
top: var(--portfolio-nav-h)` with a solid `--color-line` background — it hung off
the bottom edge of the old flat nav bar. Once the nav became a floating pill that
left a full-width rule cutting across the page, with the brass `::after` fill
making it read as a gold slash. Moved to `top: 0` with a transparent track, so
only the filled portion shows, at the very top of the viewport.

**3. Navigation differed on every surface.** Three variants existed: homepage
section anchors (Work/Systems/Services/Voice demo/Standard/Process), deep-dive
routes (Work/Products/Capabilities/Technical), and `/work/` section anchors
(Commerce/Enrollment/Integrity/Recovery/Capabilities). All eleven portfolio
surfaces now carry the identical route-based set —
**Work · Products · Capabilities · Technical** — verified across every file. The
`/work/` mobile menu was aligned to match.

JUDGMENT CALL: the marketing homepage keeps its own section anchors. It is a
long-scroll landing page whose nav legitimately serves its own sections, and it
is the live production surface. Flagged to the owner rather than changed
unilaterally.

**4. Navigation dead zone — a real bug, worse than reported.** `.nav__links`
hides at ≤960px but `.nav__hamburger` only appears at ≤768px, so between
**769–960px the header offered no navigation whatsoever** — logo and booking
button only. Confirmed empirically at 900px before fixing. This affected the
live homepage too, not just the portfolio. Fixed by keeping the links visible
through that band with tightened spacing (`styles.css`), and matching the same
treatment for `.portfolio-nav__links` in `portfolio.css`. Swept 1440 → 375:
zero dead zones remain.

Also repaired while in the file: `.selected-system:hover` animated `padding`,
causing a relayout of the whole list on every pointer move. Replaced with a
spread `box-shadow` + `clip-path` inset, which is compositor-only.

Verified at 900px and 1280px: both lines gone, nav identical, links reachable at
every width, zero console errors. Cache-busting versions bumped
(`styles.css`, `portfolio.css`, `showcase.css` → `20260804j`).

NOT redeployed — these fixes exist locally only. The preview build still carries
the old CSS.

## Interaction rebuild — scroll-driven stages (2026-08-04)

Owner critique: the demos "don't make sense", the price slider "doesn't do
anything beside changing the color", the enrollment journey is "just a simple
advance button that changes text". Also: no buttons — progression should come
from scrolling; remove the Story/Inspect/Summary dock; nav still drops links
when narrowed; typography changes between `/work/` and `/products/`; and the
pages need real artifacts (dashboards, terminals, workflow maps, code) rather
than prose.

**Done this pass**

1. **Mode dock removed** from all ten deep-dive pages, plus a CSS kill-switch
   and a rule keeping every chapter visible now that Summary mode is gone.
2. **Nav typography unified.** `.portfolio-nav__links` was Geist Mono, uppercase,
   letter-spaced while `/work/` used Geist sans title-case, and the wordmark
   differed in size and weight. That mismatch was the "changes the font and looks
   more static" between `/work/` and `/products/`. Matched to the main-site
   treatment.
3. **Commerce chapter rebuilt as a scroll-driven stage** — the new pattern.
   Four narrative beats scroll past a pinned console; whichever beat is nearest
   the reading line drives the whole console. No buttons anywhere.
   The console shows four connected surfaces at once: a back-office record with
   the edited field highlighted, a storefront product card, three connected
   records (dashboard / support macro / channel feed), and a live event stream.
   The story it tells is drift: at beat 0 the draft reads $52 while the
   storefront and all three records still read $48 and are marked stale; the
   change is held at a named approver; approval fans out to every surface at
   once; the audit line closes it with `drift=0`.

**Verified** (1280px): all four beats drive the correct frame — admin state,
approval pill, storefront price, connected records, stale/synced counts and
event stream all match their script; beat-selection math picks the right index
at every position; sticky positioning active; no overflow; zero console errors.

**Bug found and fixed during verification.** The scroll handler used an rAF
throttle with a `ticking` flag. If a frame never arrives — background tab,
headless render — the flag latches `true` and the stage freezes permanently on
its first beat. Replaced with a direct call; four `getBoundingClientRect` reads
per scroll event is cheap enough not to need throttling.

**Higgsfield:** still free plan, 0 credits, so no generated imagery. For
dashboards, terminals and node maps this is the better outcome anyway — CSS/SVG
stays crisp at any size, animates, and matches the token system exactly.

**NOT yet done** — the remaining chapters on `/work/` (enrollment, integrity,
recovery) still use the old button-driven panels, and `/products/`,
`/capabilities/` and `/technical-portfolio/` are untouched. The owner also asked
for direct in-page routes into the deep-dive pages so the detail is discoverable
without using the nav. The deployed preview still carries the pre-fix build.

## Real imagery + second scroll stage (2026-08-04)

**Higgsfield now funded** (10 credits, free plan). Preflighted cost before
spending: 2 credits per 1k image. Spent 4, 6 remain.

Generated two assets, both portfolio-authored synthetic — no client material,
which keeps `PUBLIC_ASSET_REGISTER.md` intact:

1. `assets/portfolio/av-104-field-notes.*` — product photograph of the fictional
   Aster & Vale notebook, replacing the CSS-gradient placeholder in the
   storefront card. Prompted with "no text, no logo, no branding" so the demo
   carries no invented marks. 1.4 MB PNG → **12 KB WebP** (32 KB JPEG
   fallback), tone-matched to Midnight with a saturate/brightness filter.
2. `assets/portfolio/hero-plate.*` — abstract midnight-navy plate with a single
   light shaft, layered behind the hero grid. **8 KB WebP** (52 KB fallback).

Both use `<picture>` with WebP + JPEG, explicit dimensions, and lazy/eager
loading chosen per position.

**Contrast re-verified after adding the hero plate.** Sampled the plate across
the headline band, composited at its real 0.55 opacity through the diagonal
mask, and computed the worst case against Paper: **12.39:1** — comfortably above
both the 3:1 large-text and 4.5:1 body thresholds. No regression from the
earlier contrast fix.

**Enrollment rebuilt as the second scroll stage.** Refactored the stage engine so
each stage is now data plus a small applier function rather than another scroll
implementation. The enrollment console shows a four-node pipeline, a live lead
record and a capacity grid: the enquiry arrives at 21:40 with fields missing,
qualifies against real capacity, holds a slot (places 4 → 3, slot marked held,
one session struck out), then halts at the payment question and hands to a named
person with the booking preserved.

Verified at 1280px: both stages drive correctly from scroll alone, **zero buttons
remain inside either stage**, no old panels left behind, no horizontal overflow,
hero plate loads, zero console errors.

**Still outstanding:** the integrity and recovery chapters on `/work/` still use
the old button panels, and `/products/`, `/capabilities/` and
`/technical-portfolio/` are untouched. The owner's list of surfaces to build —
n8n/Make/Zapier node maps, Shopify and Notion views, brand guidelines, code and
terminals, dashboards and graphs — is only partly served so far. The deployed
preview still carries the pre-fix build.

## Third stage — real workflow architecture, anonymized (2026-08-04)

Owner asked for the actual work to be shown: n8n workflows, dashboards, agents,
brand guidelines, the TIT Shopify backend, the RMF systems.

**Read-only source study.** Inspected the real workflow exports to ground the
showcase in true architecture rather than invention:
- conversational workflow: **40 nodes** — 1 webhook, 11 `if` branches,
  10 `httpRequest`, 4 `code`, 3 Notion writes, 1 agent + 1 memory buffer window,
  1 respond-to-webhook, plus form trigger
- KPI email reports: schedule → code → Gmail
- TIT: Next.js app (app / components / context, Tailwind)

**Built:** the integrity chapter is now a workflow-canvas stage. A dot-grid canvas
with eight positioned nodes and SVG wiring; scrolling lights the nodes and wires
along the real execution order — webhook → validate → classify, then agent +
memory + record + respond, then the human-queue exit. Node labels carry the true
counts (`Switch · 11`, `Notion · 3`, 40 nodes in the legend).

Verified at 1280px: all four beats light the correct node/wire sets, legend note
updates, stream lines match, three stages now run, **zero buttons across all
stages**, no overflow, zero console errors.

### Client-identity boundary — unresolved, needs the owner

The architecture above is Bluerook's craft and is safe to show anonymized. What
is NOT safe without written permission from the client is naming them or
publishing their material: brand guidelines, campaign content, dashboards
containing their data, or raw workflow exports. `CLAIM_LEDGER.md` excludes
"client names, endorsements, testimonials or permission assumptions", and
`PUBLIC_ASSET_REGISTER.md` marks the TIT brand-kit PNGs "permission unverified —
do not copy or publish".

Automated check added to this pass: page text scanned for client identifiers —
**zero matches**. If the owner holds written permission to name a client, the
labels are a one-line change per stage; the architecture already renders.

## De-boxing pass (2026-08-04)

Owner: "i dont like all the tables and square design all over the website it
looks so static so ugly." Correct — the stage visuals had become a grid of 1px
bordered rectangles, which reads bureaucratic rather than precise. This also ran
against the design guidance already in play ("cards are the lazy answer",
"identical card grids").

Reworked so hierarchy comes from **type, space and light** instead of outlines:

- **Console shell** — hard rectangle → 14px radius with a radial Blue wash in the
  top corner and a deeper shadow.
- **Surfaces** — the 1px hairline grid (the thing that read as a table) removed
  entirely; replaced with generous gaps and no container fills.
- **Rows** — label-beside-value with underlines → small mono label *above* a
  larger value, no rules at all. The changing field renders at 1.35rem in Brass
  with a soft glow rather than a boxed highlight.
- **Connected records** — table rows → full-radius pills that wash red when stale
  and Brass when synced.
- **Pipeline** — four hard cells → a continuous track with dots that fill and
  bloom as the stage advances.
- **Capacity slots** — squares → pills.
- **Workflow canvas** — graph-paper dot grid → two soft radial fields; nodes are
  floating capsules with shadow + inset hairline instead of outlines, and hot
  nodes glow rather than change border colour.
- **Wires** — orthogonal right angles → cubic bezier curves with round caps.
- **Status chips, approval block, product art, badges** — all outlines dropped
  for radius + tinted washes.

**Verified**: bordered square containers inside the stages went **7 → 0**;
stages still drive correctly from scroll (beat 2 still publishes $52 across 3
synced records); no horizontal overflow; zero console errors.

**Contrast re-checked properly** with alpha composited over Midnight (an earlier
measurement in this session ignored alpha and was invalid). All eight label and
value styles pass: lowest is 4.71:1 against a 4.5:1 requirement. No text was
dimmed by the restyle.

Note for a later pass: several mono labels sit at 8.3–9.9px. They pass contrast
and match the established portfolio treatment, but that is small; worth revisiting
if the owner wants more legibility.

## Navigation unified + wayfinding + picker (2026-08-04)

Owner: the nav "is conflicting and misguiding... in the main landing page it have
different links, in each one you tap just change the page with no indication of
where you are or a beautiful loading nothing, and when you tap work its like you
are in another website."

Accurate. Three separate navs existed (homepage section anchors, `/work/`, and the
deep-dives), there was no current-page indicator anywhere, and page changes were
hard jumps.

**One navigation, everywhere.** Every surface including the homepage now carries
the same five destinations: Home · Work · Products · Capabilities · Technical,
plus Book a call. The homepage's old section anchors (Systems / Services / Voice
demo / Standard / Process) were the main source of the mismatch and were dropped
from the primary bar; those sections remain reachable by scrolling and from the
hero CTAs.

**`js/portfolio/wayfinding.js` (new, loaded on all 12 surfaces).**
- Resolves the current section from the URL and marks the matching link with
  `aria-current="page"` — including on deep-dives, so `/capabilities/voice/`
  correctly highlights *Capabilities*. Verified across seven routes.
- Current link gets a Brass underline with a soft glow.
- Internal navigation fades the page out before leaving and fades in on arrival,
  so moving between routes reads as one site. Modifier-clicks, new-tab clicks,
  external links, anchors and `mailto:` are all left alone, and `pageshow`
  clears the fade so bfcache returns are never stuck blank.

**Bug caught during verification:** the fade CSS lived only in the portfolio
stylesheets, which the homepage does not load. The homepage would have armed the
transition and delayed navigation ~280ms with nothing visible. Mirrored the rules
into `styles.css`.

**Verified end to end:** clicked Home → Products for real; landed on `/products/`,
title correct, *Products* marked current, body opacity restored to 1, the
`data-leaving` attribute cleared. No console errors. Nav is now identical on
`/`, `/work/`, `/products/`, `/capabilities/`, `/capabilities/voice/`,
`/technical-portfolio/` and `/work/ecommerce-operations/`.

**Picker added to `/work/`.** Six routes into the detail, each framed as the
visitor's problem rather than our feature name ("My storefront, dashboard and
support say different things", "Enquiries arrive and nobody follows them up").
Previously the deep-dives were reachable only from the nav, so most visitors
would never have found them.

**Still outstanding:** the sub-pages keep the old boxy panels and button-driven
demos — they have the new nav, ambient world, transition and de-boxed console
styles, but not the scroll-driven stage treatment. That is the next block of work.

## De-boxing extended to every sub-page (2026-08-04)

Owner: "no change in the other pages like the products and capabilities and the
different products pages, still rectangular and static."

**Cause of the "no change":** the de-boxing done earlier lived in
`showcase.css`, which only `/work/` loads. The ten sub-pages run on
`portfolio.css` and were untouched. Also, the nav screenshots the owner sent were
cached — the link sets in the files were already correct.

**One genuine nav inconsistency found and fixed:** `/technical-portfolio/`
carried "Contact Hatim" as its primary action while every other page said
"Book a call". Now unified. Verified all ten sub-pages serve the same CTA.

**De-boxed `portfolio.css`** so the treatment reaches all ten pages at once:
scenes, dossiers, dashboards, metric cards, control notes, record lists, data
tables, state strips, timelines, inspect targets, workflow canvas and nodes,
terminals, messages, status labels, form fields, tabs, choice buttons, signal
cards, inbox and file surfaces, conversion strips. Borders replaced with radius,
soft washes and inset hairlines; hierarchy now comes from type, space and light.
Section dividers between content bands were deliberately kept — those are rules
between bands, not boxes around content.

One element could not be reached from CSS: an inline `border:1px solid` on a
`<div>` in `capabilities/index.html`. Inline styles win over stylesheets, so it
was rewritten at source.

**Measured before → after** (hard-edged boxes wider than 60px inside `<main>`):
- `/products/` 7 → **0**
- `/capabilities/` 27 → **1** → **0** after the inline fix
- `/technical-portfolio/` 1 → **0**
- `/work/sports-enrollment-operations/` → **0**

**Regression check:** the enrollment demo still runs correctly after the restyle
(qualification → Hot, CRM create → Qualified, reset → New enquiry). No console
errors, no horizontal overflow.

**Still outstanding:** the sub-pages have the new shell, nav, ambient world,
transitions and de-boxed components, but they still use button-driven demos
rather than the scroll-driven stage pattern, and their copy is denser than the
owner wants ("stronger copy, strong titles, more visuals, less text"). That
copy-and-stage pass across six pages is the next block of work.

## /products/ rebuilt on the showcase system (2026-08-05)

First of the sub-pages taken end-to-end as the reference build. Old page kept at
`docs/portfolio/products-index-old-backup.html`.

**One stack for the whole portfolio.** `/products/` no longer runs on
`portfolio.css` + `portfolio-shell.js` + `products.js`. It now loads exactly what
`/work/` loads — `styles.css` + `showcase.css` + `showcase.js` + `wayfinding.js`
— so the ambient world, nav, transitions, type and stage engine are literally the
same code rather than a parallel implementation. This is what was causing the
"different website" feeling between routes.

**Two scroll-driven stages, zero buttons.**

*Process to SOP* — a spoken transcript on the left, the structured document on the
right. Beat 0: four out-of-order quotes, every field empty. Beat 1: purpose and
owner extracted, transcript dims. Beat 2: steps and exceptions captured, and the
completion condition comes back as **a question in Brass** rather than an
invention. Beat 3: the answer lands and the document is exportable. The point of
the product — it asks instead of guessing — is now visible rather than asserted.

*Follow-Up Gap Detector* — six records go from "not reviewed" to checking to
5 flagged / 1 healthy excluded, ending on a digest with a permanent `0 sent`
counter.

**Copy cut and sharpened:** 768 → **420 words**. Hero at 97px. Titles are now
claims ("Someone explains it once. The process survives.", "Find the leads nobody
owns.") rather than descriptions.

**Verified at 1280 and 375:** both stages drive correctly through all four beats
from scroll alone; zero buttons inside stages; nav shows Products current; no
horizontal overflow; sticky console falls back to static on mobile with all beats
lit; hero scales to 43px; SOP columns collapse to one; zero console errors.

Note on the box scan: five elements still report a top border — the hero meta rule
and four section dividers. Those are rules *between* content bands, deliberately
kept. No boxes remain around content.

**Next:** `/capabilities/` on the same pattern, then the four work deep-dives.

## Live section restructured + nav bug root cause (2026-08-05)

**Live section was chaotic.** Four cards of competing widths and content types
(WhatsApp chip, a double-width form, a browser-call chip, and a separate clock
panel) with no clear primary action. Rebuilt as one decision:

- **One primary panel** — the speed-to-lead form, with the response clock and the
  three progress pills living *inside* it rather than in a separate card. The
  panel itself lights up as it arms and glows while running.
- **Two quiet alternatives** in a narrow column beside it, under the heading
  "Rather not share a number?" — WhatsApp and browser call, each a single compact
  row with a checkbox and a small ghost button.

Copy sharpened: "Everything above was a demo. **This part calls you back.**"

**Bug found and fixed during verification.** Moving the note elements out of
their cards broke `initLiveChannels`: the WhatsApp `sync()` looked up
`[data-wa-note]` scoped to its card, got `null`, and threw on `textContent`.
Because that throw happened during init, it aborted the whole function — so the
speed-to-lead form and browser-call channel never got their listeners either.
The visible symptom was "nothing arms", several components away from the cause.

Fixed twice over: note lookups now fall back to page scope, and all fourteen
`note.textContent` writes are guarded so a missing element can never abort init
again. Verified after the fix: bad phone → country-code correction message;
valid + consent → button enables and the panel arms; WhatsApp and browser call
both enable independently. Three stages still initialise.

**Nav "changes again" — root cause identified.** `/capabilities/` and
`/technical-portfolio/` are still built on `.portfolio-nav` with a PNG wordmark,
while `/`, `/work/` and `/products/` use `.nav` with the inline SVG rook. They
are two different components, so matching the link text and typography was never
going to be enough — the height, mark and spacing still differ. The fix is
migrating both pages onto the showcase system, which is the work in progress.

## /capabilities/ and /technical-portfolio/ rebuilt (2026-08-05)

Both migrated onto the showcase system. Old versions kept at
`docs/portfolio/capabilities-index-old-backup.html` and
`technical-index-old-backup.html`.

**The nav bug is now fixed at its root.** All five top-level surfaces run the
identical `.nav` component with the inline SVG rook — no more `.portfolio-nav`
with a PNG wordmark on two routes. Verified across `/`, `/work/`, `/products/`,
`/capabilities/`, `/technical-portfolio/`: same component, same mark, correct
current-page marker on each.

**/capabilities/ — two stages, 752 → 390 words**
- *Speed to lead*: an attention bar decaying 100% → 72% → 48% against a running
  clock, four outcome chips lighting when the call connects and narrowing to the
  one that fired. The point — four outcomes need four different next actions — is
  shown rather than asserted.
- *Lead reactivation*: consent visibly governs the channel. SMS and voice strike
  through when the record says email-only; on opt-out every channel but human
  review is struck through and the audit line is kept.

**/technical-portfolio/ — two stages, 875 words → leaner**
- *Signal trace*: four questions a system owes you, answered one at a time along
  a source → rules → human → complete track.
- *Refusal log*: what the system won't do — fabricate, overreach, fail silently,
  hide its status — each with the enforcement detail.
- Print stylesheet retained (now `media="print"`) and the Print/save PDF control
  kept in the closing section.

Copy fix caught before shipping: the trace headline read "five answers" against
four beats.

**Verified at 1280:** all four stages drive correctly from scroll; zero buttons
inside stages; zero hard-edged boxes; no overflow; zero console errors.

**Remaining on the old system** (7 deep-dive pages, still `portfolio.css` with
button-driven demos): the four `/work/` deep-dives and the three
`/capabilities/` sub-pages. These are the destinations the pickers link into.

## Nav bug root-caused, print removed, real tool surfaces (2026-08-05)

**"Technical link still disappears after scrolling" — found and fixed.**
Three rules in `styles.css` hid nav links as the pill shrank:
`.nav.is-scrolled .nav__links a:last-child`, `a:nth-child(n+4)`, and
`.nav:not(.is-scrolled) a:nth-last-child(2)`. They were written for the previous
seven-item nav where dropping the tail was harmless. With five route
destinations they were **deleting real pages**. Overridden with `!important`
(the legacy rules sit in later media blocks and were winning on source order).

Verified: Technical holds 53px in both states, all five links visible scrolled,
and the row still fits inside the shrunken 960px pill.

Note for future debugging: the browser served a cached `/work/` HTML for several
checks, which made the fix look ineffective. Confirming the *loaded* asset
version (`link.href.split('v=')`) rather than trusting the file on disk is what
resolved it.

**Print / save PDF removed.** No clear purpose on a scrolling portfolio; the
control and the print stylesheet link are both gone from `/technical-portfolio/`.

**Real tool surfaces — first two shipped.** Owner: "use real interactive
screenshots or images like notion, a dashboard or n8n/make/zapier so not the
whole website is blue, and it gives clarity to the clients of how things will
look."

Built as faithful CSS recreations rather than generated images — generated UI
renders text as garbage, and these stay crisp, animate, and carry each tool's
own colour world, which is what breaks the all-blue monotony:

- **Notion document** on `/products/` — true white `#ffffff`, Notion's ink
  `#37352f`, window dots, properties list, checkbox blocks. The SOP stage now
  fills in a real-looking doc: title lands, properties populate, step checkboxes
  tick 2 → 6, and the unanswered completion condition renders in Notion's own
  orange `#d9730d`.
- **n8n canvas** on `/work/` — n8n's dark `#1a1a24` dot-grid, node cards with
  input ports, and its signature coral `#ff6d5a` for the active path. Verified
  the execution path still lights correctly across all four beats.
- **Dashboard surface** built and styled (cool slate `#0f1420`, tabular metrics,
  bar chart) — not yet placed.

**Still outstanding:** the dashboard surface needs a home; `/capabilities/` and
`/technical-portfolio/` still use the generic console and need their own
distinct worlds; and the seven deep-dive pages remain on the old system.

## Tool surfaces rolled across the site (2026-08-05)

Owner approved the Notion/n8n direction: "good love that apple style website, now
do it for the whole website."

Every top-level page now demonstrates its work through the interface a client
actually recognises, and each carries that tool's own colour world. That is what
stops the portfolio reading as one endless blue page while keeping the Bluerook
shell consistent around it.

| Route | Surface | Palette |
|---|---|---|
| `/work/` | n8n canvas | dark `#1a1a24` dot-grid, coral `#ff6d5a` |
| `/products/` | Notion document | white `#ffffff`, ink `#37352f`, orange `#d9730d` |
| `/capabilities/` | Dashboard + CRM grid | slate `#0f1420` and white `#ffffff` |
| `/technical-portfolio/` | Terminal | near-black `#0b0e14`, green/amber |

**New surfaces built:** CRM/spreadsheet grid (Airtable-like, with status pills),
terminal (window dots, `$` prompts, ok/warn colouring, blinking caret), and a
WhatsApp-style chat surface (built, not yet placed).

**Rewired appliers:**
- `speed` now drives a dashboard: attention 100 → 72 → 48%, contacted flag,
  and a 10-bar decay chart whose peak marker walks with the clock.
- `react` now drives a CRM row: consent and status pills move
  idle → wait → go → stop, with SMS/voice striking through on consent and
  everything but human review striking through on opt-out.
- `trace` and `refuse` render into terminals via a shared `renderTerm()` helper,
  with staggered line entrance and a caret.

**Verified at 1280:** all eight stages across four pages drive correctly from
scroll; each page reports a distinct surface set; zero console errors.

**Remaining:** the seven deep-dive pages are still on the old `portfolio.css`
system with button-driven demos. The chat surface is ready for the voice/
messaging deep-dive when those get migrated.

## Deep-dive pages migrated to the showcase world (2026-08-06)

The four deep-dive routes linked from the /work/ picker left the old
`portfolio.css` system and now live in the same Midnight scroll world as the
top-level pages (`styles.css` + `showcase.css` + `showcase.js`, GSAP + Lenis):

| Route | Scroll stage (surface) | Hands-on lab |
|---|---|---|
| `/work/ecommerce-operations/` | `order` — order exception on a CRM board | approval-gated catalogue editor with fan-out; Notion description review |
| `/work/sports-enrollment-operations/` | `intake` — WhatsApp chat becomes an owned record | qualification + capacity-guarded booking + handoff reasons |
| `/work/follow-up-gap-detector/` | `gapflow` — the detector's own n8n canvas, with a visibly disabled Send node | six-record scan, prepare/approve (no send), failure model |
| `/capabilities/voice/` | `callflow` — one call as transcript + intent/state/action strip | six scenario console, simulated call lifecycle, downloadable call report |

The WhatsApp chat surface is now placed (enrollment intake + voice call
transcript). New shared pieces in `showcase.css`: `.pf-ops` state strip,
`.pf-chips`, `.pf-lab` two-column lab, `.pf-lablog`, `.pf-art` CSS product art,
disabled n8n node (`.is-off`) and severed wire (`.is-cut`), chat system notes.
New lab modules in `showcase.js`: `initShopLab`, `initDescLab`,
`initEnrollLab`, `initGapLab`, `initVoiceLab`; new stage scripts/appliers:
`order`, `intake`, `gapflow` (reuses the workflow applier), `callflow`.

Also fixed: `cinematic.js` crashed on every old-world page with
`ReferenceError: $ is not defined` (sections 7–8 never ran); `$` is now defined.
Old pages backed up as `docs/portfolio/*-old-backup.html`. Cache-bust:
`showcase.css/js`, `wayfinding.js`, `cinematic.js` → `v=20260806a`.

Verified in a rendered browser (DOM-driven checks; the pane did not composite
frames, so no new screenshots): all four stages drive from scroll position,
every lab guard fires (approval gate, session-full, double-booking,
scan-before-draft, healthy-record exclusion, no-send), resets restore initial
state, zero console errors, and no horizontal overflow at 375px.

**Still on the old system:** `/capabilities/managed-operations/`,
`/capabilities/system-builder/`, `/work/sports-operations-os/` (not linked from
the /work/ picker). They load the fixed `cinematic.js` and work as before.

## Owner feedback round — real-system surfaces, deck picker, de-duplication (2026-08-06, second pass)

Owner shared screenshots of the real systems (Notion lead tracker, operations
dashboard, conversations/audit inbox, handoff queue, n8n canvas) and asked the
portfolio surfaces to mirror them — with synthetic identities only — plus:
picker moved to the end of /work/ as a cinematic swipe deck, a real call UI on
the voice page, de-duplicated pages, overlap fixes, and interactivity checks
on the live channels.

**New surfaces** (`showcase.css` + `showcase.js`):
- `tool-board` — dark Notion-style CRM: status columns with counts, lead cards
  (masked +212 6•• numbers), and a client detail panel with the agent-collected
  fields: status, first contact, source, sport, category (auto), region, DOB,
  lead score, `handoff_state` (bot_control/human_control), awaiting-human,
  last bot message, timestamped CLIENT/STAFF log. Cards are clickable.
- `tool-callui` — phone-call screen: status/timer, pulsing avatar ring,
  animated waveform, scrolling transcript pinned to the newest line, controls.
- `tool-cockpit` — owner dashboard: hot counters (count up on reveal),
  priority rows, urgency tags.
- `pf-handq` — handoff queue with take-the-thread flow (staff replying →
  resolved → bot resumed).
- `pf-deck` — closing swipe deck on /work/: scroll-snap track, focused card
  sharp, neighbours blurred/dimmed, arrows, no wheel hijack.

**Page changes**:
- /work/: mid-page picker removed; deck added at the end (#explore); the four
  Also-running cards got distinct mini-surfaces (call line, decay bars, inbox
  rows, node path).
- Enrollment: new `record` scroll stage (card lands → agent fills fields →
  handoff_state flips and the card moves columns → resolution returns control),
  cockpit management section, chat hero motif (photo plate removed), trail.
- Voice: call UI replaces the WhatsApp look in both the stage and the scenario
  lab; new handoff-queue + audit-tiles section; waveform hero motif; trail.
- Gap detector: n8n-canvas hero motif; evidence numbers count up; trail.
- Commerce: keeps the photo plate as its differentiator; trail added.

**Fixes**: number inputs blew the lab panels open at 375px (grid min-content ≈
2×20ch); `.pf-field input/select { width:100%; min-width:0 }`. Picker title
overlapped the grid when no lead paragraph followed; adjacency margin added.
Chat/call transcripts now pin to the newest message instead of clipping.

**Geometry audit** (sibling-overlap, past-right, page overflow detectors) run
on all seven routes at desktop and 375px: zero issues after fixes. Zero new
console errors. Cache-bust `v=20260806b`.

**Live channels verified**: `/api/create-web-call` is deployed on production
(bare POST correctly 403s). `/api/create-phone-call` and `/api/chat` exist
locally with sound validation (origin guard 403, unconfigured 503 mapped to a
calm UI message) but are NOT deployed — production returns 404. Speed-to-lead
needs this branch deployed plus `RETELL_FROM_NUMBER` in Vercel to actually
place calls.

## Cinematic sections, motion layer, real lab feedback (2026-08-06, third pass)

Owner feedback: the pinned consoles did not fit the window; the hands-on labs
changed a pill and "nothing really happens"; the n8n canvas looked fake; the
closing picker and Also-running were flat; and the site wanted the landing
page's cinematic scroll grammar plus hover/entrance/loading/micro-interactions.

**Scroll fit.** `.pf-stage__sticky` is now capped at `calc(100vh - 116px)` and
the console is a flex column whose *surface* compresses while its chrome never
does. Short-viewport rules (`max-height: 900px` / `760px`) compact the board
detail, hide the message log and collapse the event stream. Verified at 720px:
console 543px in a 604px window, nothing clipped, every named field still
visible, top clear of the floating nav.

**Labs now answer back.** New feedback primitives in `showcase.js`: `toast()`
(a sentence explaining what happened, with ok/hold/stop tone), `pop()`,
`shake()`, `wasNow()` (writes the new value and leaves the old struck through
beside it for 2.6s), `working()` (a visible sweep bar so an instant result does
not read as no result) and `skeleton()`. Every guard now shakes and explains:
empty diff, unqualified booking, double-booking, full session, scan-before-
draft, healthy-record exclusion, approve-without-draft. Approvals fan out in
paced beats rather than all at once.

**n8n canvas rebuilt** to the real tool's shape: icon tiles inside each node,
input/output ports, a toolbar with Editor/Executions tabs, zoom controls, and
wires that carry a travelling dash while their branch executes. The disabled
Send node reads as switched off (struck label, dead ports) with a severed wire.

**Two cinematic grammars, deliberately different.** `/work/` now closes with a
pinned crossfade deck (`.pf-cine`) — one problem lit at a time, neighbours
blurred out, tick rail, exactly the landing page's diagnosis mechanic — and
Also-running became a filmstrip (`.pf-strip`) where vertical scroll pans a row
of capability cards sideways and lights whichever is centred. Both fall back to
plain readable stacks under 760px and reduced motion.

**Motion layer**: pointer-position ripples on every button, staggered group
entrances, cards catching light at the cursor, consoles tilting a degree toward
it, press-scale on controls, shimmer skeletons, and a toast stack. All of it is
gated behind `prefers-reduced-motion` and `(hover: none)`.

**Bugs found and fixed while verifying**: `.is-past` outranked the mobile
stacking rule, so passed cine cards stayed invisible on phones (and their links
kept `tabindex="-1"`); the filmstrip could not pan because the grid stretched
its track to content width (`grid-template-columns: minmax(0,1fr)` + `min-width:0`);
the highlight trailed the pan by a card because it read rects mid-transform
(now computed from untransformed offsets); the Exceptions node sat outside the
canvas. Cache-bust `v=20260806j`.

Note for future verification: Lenis hijacks `window.scrollTo`, so programmatic
scroll-position tests need ~600ms of settle time or they sample mid-flight.

## Presentation deck (2026-08-06)

`/deck/` — a 14-slide 16:9 keyboard deck covering the operating model, the six
builds and the controls. Built on `tokens.css` (no brand hex is written in the
file except the two SVG fills the brand doc itself specifies for the rook).

Brand rules enforced and verified programmatically, slide by slide:
- **Brass appears once per composition, never twice** — 14/14 slides carry
  exactly one jewellery point (checked by counting `.jewel`, inline accent
  vars and brass SVG rects per slide).
- **Blue never carries type** — 0 elements compute to the mark colour.
- Accent words are Cormorant Garamond italic; body is Geist; eyebrows, metrics
  and labels are Geist Mono at 0.22em tracking.
- Chess metaphor present as the castling slide (King steps aside, Rook takes
  the centre) using board squares rather than a second rook mark.

Blur/depth treatment: a drifting ambient orb field at `--amb-blur` (80px),
frosted `backdrop-filter` panels from the glass tokens, a depth-of-field slide
transition (each slide arrives at 16px blur and settles to zero), plus grain
and vignette so the flat Midnight fields do not band on a projector.

Deck mechanics: arrow keys, space, Home/End, click-to-advance, touch swipe,
`#n` deep links, a brass progress rail that scales rather than resizes, and
`inert` on off-screen slides so they stay out of the tab order.

Verified: exact 1.778 ratio, content vertically centred with equal 207px gaps,
no slide clips its frame at 1440×810, no horizontal overflow at 375px, and no
console errors. Two real bugs were caught in review — duplicate `style`
attributes (HTML silently drops the second, which had killed the closing
slide's brass rule) and two slides missing their jewellery point.

Deck is `noindex, follow` so it does not compete with the marketing pages;
that is one line to remove if it should be public.

## First-visitor audit of the landing page + two P0 fixes (2026-08-06)

Audited `/` as someone who has never heard of Bluerook, using the impeccable
audit dimensions plus a purpose-built DOM collision detector (text leaves vs
painted absolute/fixed boxes, z-order aware). Two blocking defects, both on the
first two screens a visitor sees.

**P0 · The hero copy ran underneath the rook.** `.hero__rook-wrap` was
`position: absolute; right: 0` while the copy flowed at full container width,
so between roughly 960px and 1400px the lead paragraph and the CTA row sat
under the illustration. Measured at 1000px: 135×74px of overlap on the lead,
240×51px on the buttons. Not a z-index problem — a layout problem.

Fixed structurally rather than by nudging: at ≥961px `.hero__inner` is a grid
with the rook in its own column. The headline and eyebrow span both columns so
the display couplet keeps its full measure (an earlier attempt that put the
headline inside the copy column forced "We run your operations." onto three
lines and broke the couplet); the lead and CTAs occupy column 1 beside the
rook. Verified zero overlap at 1000, 1280 and 1440, no horizontal overflow,
and the phone layout untouched (the rule is inside a min-width query).

**P0 · The castling animation only moved one piece.** The signature brand
moment rendered as a single piece on an empty board. `getDx()` was evaluated
inside both tweens' value functions and *began by clearing `x` on both
pieces*; because the rook's tween evaluates after the king's, every scrubbed
frame wiped the king's transform immediately after it was set. The King never
moved and the rook crossed alone, landing on top of it.

Caching the measurement at init failed too — `initCastling()` runs before the
tier class lands, when the stage is unlaid-out and every rect reads zero.
The fix derives the distance from board geometry (`stage width − piece width`),
which depends on no transform, is safe to read during render, and is correct
however late layout settles. It matches what the mobile scrub implementation
already did. Verified at 1280: both pieces travel 765px in opposite directions
and land exactly on each other's squares; `stage 880 − piece 115 = 765` checks
out.

Also noted, not yet actioned: the first viewport carries brass in four places
(nav logo rule, accent line, primary CTA fill, hero rook rule) against the
brand's "once per composition, never twice"; several footer links and the
system selector fall under a 40px touch target on phones.

Note: the reflex-reject lists in the impeccable brand register name Cormorant
and the editorial-typographic lane, both of which Bluerook has committed to in
Brand Standards Vol. II. The register's own identity-preservation clause
applies — those lists govern greenfield choices, not a shipped identity — so
the audit treated the typography and palette as fixed and fixed craft instead.

## Legibility floor + section light across the portfolio (2026-08-07)

Owner feedback: small tweaks only, brand stays. Two named problems — text too
small in places, the display serif used where it should not be, and sections
looking too plain where there is no glow.

**Small text.** Measured every piece of real prose at 375px rather than reading
the stylesheets. On the landing page the smallest was **7.4px**; the cause was
`cinematic-mobile.css` loading after `styles.css`, so its own sizes (down to
`0.42rem`, several `!important`) were the ones reaching the screen. A first fix
placed in `styles.css` lost the cascade and had to be moved. The same class of
bug existed in `showcase.css`: `.pf-node small` at `0.46rem` on phones, and
`.tool-n8n__node small` at `8.5px`, which this session had written itself.

Floors now: **~10px for uppercase mono micro-labels, 15px for anything that is
a sentence.** Landing hero lead 14px → 15.2px; system status labels 7.4px →
10.2px.

**Display serif.** Cormorant was being used for 13-14px prose (`.step__lead`
and friends). At that size a serif loses its counters on a phone. Below display
sizes these now use Geist; Cormorant keeps the accent words.

**Section light.** `.pf-stage`, `.pf-chapter`, `.pf-decksec` and `.pf-close`
each carry one soft radial bloom, alternating side so consecutive sections do
not stack the same glow, plus a lifted top edge and shadow on surfaces that
were previously a bare 1px box (`.pf-trail a`, `.pf-pick`, `.pf-deckcard`,
`.pf-stripcard`, `.pf-handq__row`). Palette unchanged — Blue for structure,
Brass for the jewel, every bloom under 8% alpha.

**Two regressions caught while verifying, both fixed:**
- The blooms bled past the section edge and created horizontal scroll
  (1083px in a 1000px viewport). Contained with `overflow-x: clip` +
  `overflow-y: visible` — deliberately not `hidden`/`auto`, which would create
  a scroll container and silently kill the pinned consoles. Verified sticky
  behaves identically with and without the clip.
- Raising the n8n node labels to 10px made eight node pairs collide at 375px
  and pushed two nodes off the canvas. Shrinking the text back was the wrong
  trade, so on phones the canvas becomes a vertical stack of the same nodes in
  execution order and the wires (meaningless once stacked) are hidden. Desktop
  keeps the positioned graph with wires. Verified both: zero collisions, zero
  nodes outside the canvas, no horizontal overflow.

## Operations dashboard route + consent rework (2026-08-07)

**New route: `/work/operations-dashboard/`.** An interactive cockpit modelled on
the *shape* of a real operations dashboard, built entirely from synthetic data.
Per the workspace rule that no RMF data, branding or customer information may
enter a Bluerook artifact, nothing was copied: the structure (sidebar, greeting
with hot counters, "handle now" priority queue, revenue-at-risk panel, KPI
tiles, conversion funnel, conversations, handoff queue) is recreated under the
established fictional identities.

Interactive, not a screenshot:
- **Four views** — Today, Pipeline, Conversations, Handoffs.
- **Range control** (7d / 30d / All) recalculates every figure from three
  separate datasets rather than relabelling one.
- **Priority filter tabs** (all / money / operations / growth), each row
  expandable to the reasoning behind it.
- **Handoff takeover** — claiming a thread flips its state and says the bot
  stays muted until the person is done.
- **Search** filters the conversation list.
- **Three themes** (light / dim / dark) and a **brand switcher** with three
  presets that swap mark, name, owner and accent. That is the argument the page
  makes: the build is the product, the identity on top is a variable.

Bars animate with `scaleX` rather than `width` so a range change does not
relayout every frame. Counters count up on render.

**Live-channel consent reworked** (owner: "I like the checkboxes but not for
this case"). The blocking consent checkbox is gone; requesting the call now
carries the consent, stated on the button and in the line beneath it, which is
both the standard pattern and less friction. The checkbox that remains asks for
something genuinely optional: a WhatsApp summary after the call. The preference
is sent as `whatsappFollowUp` in the request payload —
`api/create-phone-call.js` currently ignores it, and the UI copy deliberately
says the preference travels with the request rather than promising a message,
until the endpoint honours it.

**Legibility floor held on the new work.** The dashboard initially shipped 9px
labels and sub-34px tap targets — the same failure this session had just fixed
elsewhere. Raised to the 10px / 34px floor (38px on phones). Also corrected
`.pf-trail small` site-wide (9.3px → 10.6px).

Verified at 375px and 1000px: no horizontal overflow, all four views render,
range/brand/theme switching all recompute correctly, and the deck on `/work/`
now carries seven cards with the dashboard added. Route added to `sitemap.xml`.

## One explore section, clearer CTAs (2026-08-07)

Owner: the two closing sections were confusing because both proposed the same
thing. They were right, and it was worse than redundant — Voice appeared as a
card in *both* the pinned deck and the filmstrip, so the page offered the same
destination twice under two different promises ("Open the prototype" vs "Open
this build").

- **Filmstrip removed.** The pinned deck is the pitch: problem-first framing,
  one at a time, which is how a visitor self-identifies. The filmstrip was
  capability-first and competed for the same click.
- **Its four remaining destinations** (speed to lead, managed execution, system
  builder, Sports OS) moved into a plain `.pf-more` link row inside the closing
  section. Styled as navigation, not as a third pitch, so nothing competes.
  Verified no destination now appears twice on the page.
- **Card CTAs name what opens** — "Open the dashboard", "Open the detector" —
  instead of seven identical "Open this build".
- **Closing CTA reduced to one button.** It previously offered a brass primary
  ("Bring the bottleneck", which named no action) beside a ghost button holding
  a raw email address; two buttons of competing weight at the decision point.
  Now: one "Book a free 30-minute call", with the email as an inline link in the
  supporting line.
- Section kicker changed from "Six problems · six builds" (stale after the
  dashboard made it seven) to "Find your problem".

Verified at 375 and 1000: one explore section, seven cards, no duplicate
destinations, one closing button, no horizontal overflow, and the stacked
mobile fallback still shows every card.

---

## /work/ rebuilt as a linear scroll funnel

The picker, the deep-dive branching and the click-driven demos are gone. `/work/`
is now one vertical narrative: hero → problem → what we do → the automation floor
→ four systems running → the cockpit → the live callback → one CTA.

New files: `css/portfolio/funnel.css`, `js/portfolio/funnel.js`. `showcase.css`
and `showcase.js` still load underneath for the nav, ambient world, statements
and the speed-to-lead form; funnel.* owns everything new.

**Scroll drives state, not clicks.** Each scene is a tall `.fx__track` with a
`.fx__pin` stuck inside it. `funnel.js` reads normalised progress from
`getBoundingClientRect` and hands each scene `(p, step, sp)` — total progress,
integer frame, and progress *within* the frame. Sub-step progress is what makes
the commerce records sync one at a time, the n8n wires draw as comets, the KPIs
count up and the scan resolve row by row. This is the vanilla equivalent of
Framer Motion's `useScroll`; the repo has no build step, so there is no React.

**Two things that are load-bearing and easy to break again:**

1. `.fn-body { overflow-x: clip; overflow-y: visible }` overrides showcase.css's
   `overflow-x: hidden`. `hidden` forces `overflow-y: auto`, which turns the body
   into a scroll container and silently stops **every** sticky pin on the page.
   It failed at 768x1024 while working at 1440x900, so it does not show up in a
   single-size check. The old showcase pages still carry `overflow-x: hidden` and
   the same latent fragility.
2. `.fn-wwd__grid { align-items: stretch }` — the left column must inherit the
   full row height or its sticky child has no travel. Paired with a tall
   `padding-bottom` on the right column to buy back the viewport-height sticky
   always surrenders at the end of its containing block.

**Fitting scenes to one screen.** `.fx__pin` is `height: 100svh` with
`overflow: hidden`, so anything taller than the viewport gets clipped rather than
scrolled to. Every console was measured at *every* step (captions change per
frame and change the height) across 360x640 → 1920x1080. Below 700px tall on a
narrow screen the pin is released entirely and funnel.js falls back to reading
the section's travel across the viewport — a dense console cannot be pinned on a
short phone without clipping it or shrinking type below the legibility floor.

**n8n canvas.** Node boxes are 80 viewBox units (`--nb: 8cqw`) and wire endpoints
are computed to land exactly on the box edges; all 8 verified at gap 0. Canvas
height is `min(100svh - 470px - 5vh, contentWidth * 0.52)` so it never outgrows
the locked screen. Under 520px canvas width a container query drops the node
*type* sub-label so it cannot collide with the box beneath it.

Verified clean at 360x640, 375x812, 390x844, 768x1024, 1024x768, 1366x768,
1440x900, 1920x1080: all pins fit and stick, no n8n collisions, no text under
11px, no horizontal overflow, no nav overlap, headings in order, no-JS baseline
renders everything.

Fixed in passing: the speed-to-lead phone `pattern` was an invalid regex under
the `v` flag (`[0-9\s()\-.]`), so native validation never ran. Parens escaped.

Open: `/work/operations-dashboard/` now has zero inbound links — it was only
reachable from the picker. The other deep-dive pages remain on disk, in
`sitemap.xml`, and linked from other pages; they are simply no longer part of
the funnel.

---

## Visual pass round 2 — display serif restored, 3-door nav, channel chooser

**Type.** Display went back to Cormorant Garamond — the wordmark's face — so the
big titles carry the mark's voice. Body is Plus Jakarta Sans, labels are
JetBrains Mono. That is also a real contrast pairing (serif + geometric sans),
which Space Grotesk + Jakarta was not. Emphasis is true italic again.

Cormorant runs small for its point size, so the display steps were raised a
notch to keep the presence the sans sizes had.

**A bug the sans experiment surfaced and left behind:** the hero's split-reveal
wraps each word in an `overflow: hidden` mask sized to the line box. Any face
with a glyph box taller than the line-height gets sliced. `overflow: clip` plus
`overflow-clip-margin: 0.22em` on `.fn-hero__title .pf-w` fixes it without
moving layout, and is kept as insurance against the next font swap.

**Navigation.** Three doors — Work / Capabilities / Products — each with a
glass panel underneath. Hover on a mouse, focus on a keyboard, first-tap on
touch (a second tap follows the link; without that split the panel would flash
open and navigate away in one gesture). The panel clamps itself on screen via
`--shift` set in JS, since the rightmost trigger would otherwise centre its
panel past the viewport edge. `.fn-nav__pop::before` bridges the 10px gap
between trigger and panel so the pointer does not fall through it on the way
down. Home is the logo; the phone menu stays a flat list.

**Pick your problem** returns as `#pick`, after the narrative rather than
inside it, so it is an exit ramp and never competes with the story. Six cards,
pinned to a 3-column grid — `auto-fit` lands on four at 1440 and orphans a row
of two.

**Try it** now offers Call / Text / Both, owned by `initTry()` in funnel.js.
The old `[data-stl-*]` hooks are gone from the markup so showcase.js's
`initLiveChannels` no longer double-binds; the browser-mic option keeps its
`[data-call-*]` hooks and is still handled there.

⚠️ **"Text me" is not an outbound message.** There is no SMS/WhatsApp send
endpoint — it opens WhatsApp with the message prepared and the visitor presses
send. The copy says exactly that. Every request carries a `channel` field so a
real send path can be switched on server-side without touching the client.

**Usage budget.** Two demo runs per browser per day, held in localStorage and
shown as dots. This is a courtesy guard, not security — localStorage is
trivially cleared. The enforceable limits already live in
`api/create-phone-call.js`: one call per number per day, 30s per address, a
40/day ceiling and premium-prefix blocking. Those counters are still in module
scope, so they reset when an instance recycles — moving them to Vercel KV is
the outstanding piece before this runs at any volume.

Verified at 1440x900 and 375x812: every `.fn-lock` section inside one screen on
desktop, all six scenes fitting and sticking, zero contrast failures, zero text
under 11px, no tap target under 44px, no nav overlap, no horizontal overflow.

---

## Shared nav, and three bugs the CSS was hiding

**The nav now lives in `styles.css` + `js/nav.js` and is identical on all five
pages.** It was funnel-only before, which is why `/` and `/work/` disagreed.

Three real defects, all one root cause: `styles.css` carried selectors written
for the old flat link list, and they match the new markup by accident because
every trigger now sits in a `.fn-nav__item` next to its panel (exactly two
children).

1. `a:nth-last-child(2)` matched every trigger → forced `display: block` →
   the chevron `<i>` was no longer a flex item, so its width/height were
   ignored and it painted as a **1.3 x 18.7px vertical bar**. Those were the
   "weird lines" beside Work / Capabilities / Products.
2. The same selector reached *inside* the panels and landed on the
   second-to-last link ("Operations dashboard"), flattening its title and
   description onto one line — the overlapping text.
3. A previous fix had pinned those rules with `display: block !important`, so
   no amount of specificity could win. They are now scoped with
   `.nav__links:not(.fn-nav)`, which retires them from the new nav without
   touching whatever they were protecting.

The panel was also translucent enough (0.62) that the hero headline read
straight through it and looked like overlap. Now 0.94 over a 26px blur.

**Type.** Plus Jakarta Sans + JetBrains Mono promoted to `:root`, so every page
matches. Display stays Cormorant Garamond — the wordmark's face — and the
italic `em` in titles carries the accent again, the way the home page hero
does. Space Grotesk is gone entirely; its family and the now-unused Geist cuts
were removed from the font downloads on all five pages.

**Statement scroll-lighting was dead.** `.fn-body .pf-statement .pf-word`
outranked showcase.css's `.pf-statement .pf-word.is-lit` — equal specificity,
later file — so lit words kept the dim colour. Adding `:not(.is-lit)` restored
it. Verified progressive: 0 → 5 → 13 words lit across the section.

**Pick your problem is now a scroll-driven carousel** (`SCENES.pick`). Position
is continuous (`p * (n-1)`), so the rail glides rather than snaps; the centred
card is the only one un-blurred and the only one in the tab order. Dots scroll
the page rather than jumping the track, so the carousel and the scrollbar never
disagree.

Verified: all 7 scenes fit and stick, every `.fn-lock` inside one screen, no
tiny text, no nav overlap, no horizontal overflow, and all three panels render
with title above description on every page.

**Still open:** `/products/`, `/capabilities/` and `/technical-portfolio/` set
their `h1` in the sans rather than the display serif, so their big titles do
not yet carry the wordmark's voice. A colour/simplification pass over the
console graphics is also outstanding.

---

## Nav consolidation, theme toggle, and a full-bleed bug

**Three doors are now Work / Capabilities / Technical.** Products folded into
the Work panel as a single entry — it previously had two links ("Process to
SOP" and "Workflow packages") both pointing at `/products/`. Technical is a
plain link rather than a dropdown, because it has exactly one destination.

**The theme toggle moved to `js/nav.js`** and now appears on all five pages
beside "Book a call". The duplicate handler was removed from `script.js`:
leaving both bound would have toggled twice per click and cancelled itself out.

**Two more copies of the legacy hide-rules** were still unscoped and kept
hiding the third nav link, because "Technical" is `a:last-child` inside
`.nav__links`. All four are now scoped with `:not(.fn-nav)`. Verified the three
links hold at top, mid and deep scroll.

**Every locked section had been rendering full-bleed.** `.fn-lock > * { width:
100% }` has the same specificity as `.fn-wrap { width: min(100%, 1360px) }` and
comes later in the file, so the cap never applied — content ran to the viewport
edge and straight under the fixed progress rail. `.fn-wrap` and
`.fn-hero__inner` now use `max-width`, which nothing overrides.

**The rail was 125px wide**, not the ~42px it looked. Its labels were only
faded with `opacity`, so they still claimed layout width and pushed the rail
into the content column. They are now absolutely positioned and cost nothing;
the live state is carried by the longer brighter dash instead of a permanent
label. The carousel's edge bleed was also halved for the same reason.

Verified at 1440x900: tightest gap between any content edge and the rail is
+4px, all 7 scenes fit and stick, no locked section over one screen, no tiny
text, no horizontal overflow, and the nav plus theme toggle behave identically
on all five pages.

**Still open:** `/products/`, `/capabilities/` and `/technical-portfolio/` set
their `h1` in the sans rather than the display serif. A colour and
simplification pass over the console graphics is also outstanding.

---

## Deployed, and what the integrations actually look like

Merged to `main` and live. Production verified: all 7 scenes pin and drive
state, the three-door nav and theme toggle work on every page, the channel
chooser and the carousel are live.

### Endpoint status on production (probed 2026-08-08)

Probed with a deliberately invalid body so the env check fires before any
payload validation — no call was ever placed.

| Endpoint | Result | Means |
|---|---|---|
| `/api/create-phone-call` | 400 `consent_required` | `RETELL_API_KEY` **and** `RETELL_FROM_NUMBER` are set |
| `/api/create-web-call` | 201 + real access token | Retell key valid, agent id accepted, browser voice works end to end |
| `/api/chat` | 400 `A non-empty message list is required` | `ANTHROPIC_API_KEY` is set |
| `/api/retell-calendar` | 401 `unauthorized` | Guard works; Google OAuth vars unverifiable without the tool secret |
| any, no `Origin` header | 403 `origin_not_allowed` | Origin guard holds |

### n8n

**There is no n8n integration in this codebase.** No webhook URLs, no API
calls, no credentials — searched `api/`, `js/`, `script.js` and the whole tree.
The n8n canvas on `/work/` and in the deck is a *depiction* of a workflow
shape, drawn in SVG. If a real n8n instance is meant to sit behind Arden or the
chatbot, it is wired inside Retell's own agent config or in n8n itself, not
here, and nothing in this repo would show it.

### Known live issue

`bluerook.co` still 307-redirects to `www.bluerook.co`, the reverse of the
documented intent. Every canonical, `og:url`, sitemap entry and JSON-LD URL
points at the apex, so search engines are being sent to a URL that redirects
away. This is the open item already recorded in `docs/deployment.md` and it is
a Vercel domain setting, not a code change.

### Deck

`deck/index.html` rebuilt: 12 slides, `noindex`, authored at 1280x720 and
scaled to the viewport so a projector, a laptop and a PDF share geometry.
Verified every slide fits the frame with zero overflow and zero collisions in
the canvas. Press P for a print-ready stack.
