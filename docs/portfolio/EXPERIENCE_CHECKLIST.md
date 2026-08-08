# Portfolio experience checklist

Every checked item was exercised in a rendered local browser on 2026-08-02
(functional DOM interaction, state assertions, and console-error checks), not
inferred from file existence.

## Shared experience

- [x] Cinematic portfolio lobby (`/work/`)
- [x] Fragmented signals become controlled operations (signal board resolve/reset)
- [x] Story mode
- [x] Inspect mode (auto-generated route-contract panel + inspectors)
- [x] Summary mode (story/inspect content hidden; summary anchored and focusable)
- [x] Chapter progress and direct chapter links (rail + progress meter)
- [x] Pause, replay, skip, and reset controls (pause on all routes; replay/skip on
      lobby; reset on every stateful demo — voice and managed-operations reset
      buttons were added this session)
- [x] Reduced-motion mode and system preference (manual toggle + `prefers-reduced-motion`;
      timed sequences complete instantly; reveals forced visible)
- [x] Keyboard-only operation (skip links, focus-visible styles, roving arrow-key
      focus on workflow nodes and tabs, menu focus trap with Escape + inert background)
- [x] Mobile and tablet substitutions (no horizontal overflow on any route at 375
      or 768; chapter rail hidden ≤1180; mobile menu verified)
- [x] Static readable fallback (reveal-hiding is gated on the JS-added
      `portfolio-js` class; all content present in HTML without JS)
- [x] Final conversion scene (lobby conversion board; every route closes with
      booking CTA and summary)

## Commerce

- [x] Brand construction sequence and inspector (`#brand-system` chapter, 4 inspect targets)
- [x] Storefront and fictional Shopify state synchronization (edit → save → storefront/dashboard/log update)
- [x] Product-description suggestion, approval, and rejection (guards verified: approve-before-generate refused)
- [x] Controlled asset-discovery terminal and image population (6 lines, 5 slots populated, 1 rejected match, instant under reduced motion)
- [x] Order-state synchronization and exception routes (5 exception types; stage advance blocked while exception active; human resolution required)
- [x] Support conversation and fictional CRM record (answers from approved state; escalates when exception active)
- [x] E-commerce management view (dashboard counters synchronized)

## Sports and workflows

- [x] Multi-channel campaign/form intake (channel selection normalizes into one lead event)
- [x] Live qualification and synthetic lead record (deterministic hot/warm/cold)
- [x] Programme-specific agent routing (4 agents; qualification re-routes agent)
- [x] CRM creation and lead-temperature classification
- [x] Trial booking and capacity update (capacity decrements once; double-booking refused; full sessions require handoff)
- [x] Follow-up paths and human handoff (48h clock; intent-dependent next action; priority routing by reason)
- [x] Audit-agent recommendation, human approval, controlled update, and retest (4-step gate; out-of-order steps refused)
- [x] Management dashboard (qualified/booked/handoff metrics update)
- [x] Clickable workflow visualizer: business, workflow, and data views (node inspector with purpose/input/validation/output/failure/boundary/completion)
- [x] Workflow failure, retry, queue, alert, and log behavior (4 failure types → 4-step recovery path)
- [x] Follow-Up Gap Detector (scan flags 5 gaps / excludes 1 healthy; prepare-before-scan refused; healthy records excluded from drafting; approval logs task, sends nothing)
- [x] Sports Operations OS guided scenario and reset (3 scenarios × 6 steps; loaded/loading/empty/error view states)

## Capabilities and products

- [x] Arden prepared voice scenarios and local-only microphone permission path
      (6 scenarios; ringing→connected→ended lifecycle; mic is opt-in, permission-gated,
      local-only — not triggered during automated testing by design)
- [x] Speed-to-lead timer and outcome paths (validation of empty fields; outcomes locked until sequence completes; 6 outcome→CRM-action mappings)
- [x] Lead reactivation, consent, opt-out, and audit trail (consent-based strategy gating; healthy record fully locked; audit line records id · strategy · outcome)
- [x] Managed operational execution: inbox, files, brief, ownership, exceptions (triage one/all, file organization, meeting structuring, founder brief composed from actual local state)
- [x] Process to SOP transformation and review (products page preview)
- [x] Steal This Workflow #01 (validate/structure/preview; failure model; delivery disabled)
- [x] Steal This Workflow #02 (scan/digest preview)
- [x] Brand and digital infrastructure inspector (`/capabilities/`)
- [x] Interactive system builder (4 decisions → path + plain-language summary + mailto brief)
- [x] Technical portfolio and print stylesheet (print CSS + button present; see
      visual review log — full print preview inspection remains open)
