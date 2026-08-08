# Bluerook marketing repository — agent instructions

This repository owns the public `bluerook.co` marketing site and currently contains
the `process-to-sop/` subproject.

## Shared company context

When available, first read the centralized workspace entry point and control files:

- `C:/Projects/BLUEROOK_WORKSPACE/AGENTS.md`
- `C:/Projects/BLUEROOK_WORKSPACE/bluerook-agent-control/BRAND.md`
- `C:/Projects/BLUEROOK_WORKSPACE/bluerook-agent-control/NOW.md`

The central brand system applies to all Bluerook work. The local `docs/` directory
then supplies website-specific content and implementation detail.

## Repository rules

1. For root website work, read `CLAUDE.md` and the relevant file in `docs/`.
2. Keep the root website vanilla HTML/CSS/JavaScript with no build step.
3. Treat `tokens.css` as the website token authority; never invent project-local
   brand colors.
4. Use the approved logo assets in `assets/`; never substitute a generic rook.
5. Validate customer-facing changes visually on desktop and mobile, then run the
   central brand QA checklist.
6. `process-to-sop/` is a separate Next.js application but currently shares this
   Git repository. Run its commands from that directory.
7. Never commit `.env*`, `.vercel/`, `node_modules/`, `.next/`, raw agent history,
   or credential values.
8. Update the central `NOW.md` when project state or handoff information changes.

