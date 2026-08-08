@AGENTS.md

# CLAUDE.md — Bluerook

> Entry point for any AI/agent session working in this repo. Read this first, then
> open the relevant file in `docs/`. Everything here is the source of truth for the
> Bluerook brand, site, and business.

## What this is

Bluerook is an **AI operations and business-process agency** for high-performing
entrepreneurs. Its VA offer means role-based **AI System VAs**, not human virtual
assistants. This repo is its **marketing website** — a single-page, hand-built
vanilla frontend plus one serverless voice-token endpoint (no build step),
deployed on Vercel at **https://bluerook.co**.

## The 30-second orientation

| You need… | Open |
|-----------|------|
| Brand identity, colors, type, logo, voice | [`docs/brand.md`](docs/brand.md) |
| Every word of site copy (services, process, etc.) | [`docs/content.md`](docs/content.md) |
| What Bluerook sells, ICP, offer, contact, socials | [`docs/business.md`](docs/business.md) |
| Stack, file map, how to run locally, conventions | [`docs/tech.md`](docs/tech.md) |
| Vercel, domain, DNS, GitHub, deploy flow | [`docs/deployment.md`](docs/deployment.md) |
| SEO setup, Search Console, structured data, open items | [`docs/seo.md`](docs/seo.md) |
| Every image/icon file, size, purpose, where used | [`docs/assets.md`](docs/assets.md) |

## Hard rules (don't break these)

1. **Canonical domain is the apex: `https://bluerook.co`** (no `www`). All
   `<link rel=canonical>`, `og:url`, sitemap, robots, and JSON-LD URLs use the apex.
   ⚠️ Known open item: production currently still redirects apex → www at the Vercel
   domain level. The intended end state is the reverse (www → apex). See
   [`docs/deployment.md`](docs/deployment.md#canonical-domain).
2. **No build system.** Do not introduce a bundler, framework, or `npm run build`.
   Edit `index.html` / `styles.css` / `tokens.css` / `script.js` directly.
3. **`tokens.css` is the single source of truth for design values.** Pull colors,
   type, spacing, motion from CSS variables there — never hard-code brand hexes.
4. **Deploy = push to `main`.** Vercel auto-deploys on push (GitHub integration).
   There is no separate deploy command.
5. **Web-served assets live at repo root** (`/favicon.ico`, `/og-image.png`, etc.)
   because `index.html` references them by absolute path. Do not move them.
6. **Verify UI changes in the browser preview before pushing** (mobile 390×844 and
   desktop). Mobile has a completely separate stylesheet block — see `docs/tech.md`.

## Brand one-liner

**"We run your operations. You run your empire."**
Chess metaphor throughout: the **King** is the founder, the **Rook** is Bluerook, and
"castling" is the move where the founder steps back to focus while Bluerook runs the
board. Palette is **Midnight / Paper / Blue / Brass** (Brand Standards Vol. II).

## Contact / owner

- Founder: **Hatim** — hatim@bluerook.co
- Repo: github.com/Sawgyyboy/bluerook · Host: Vercel project `bluerook`
