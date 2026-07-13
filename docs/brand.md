# Brand — Bluerook

Brand Standards **Vol. II — Midnight / Paper / Blue / Brass**.
All values below are mirrored in [`tokens.css`](../tokens.css) (desktop) and the
`@media (max-width:768px)` `:root` block in [`styles.css`](../styles.css) (mobile,
prefixed `--m-`). `tokens.css` is the single source of truth — never hard-code hexes.

## Name & mark

- **Name:** Bluerook (one word, capital B).
- **Mark:** a **rook** (chess castle tower) with 4 crenellations, on a 100×115 grid,
  finished with a single brass rule underneath.
- **Metaphor (used everywhere):** chess. The **King = the founder/client**, the
  **Rook = Bluerook**. **"Castling"** is the signature move — the King and Rook swap
  so the founder steps back to focus on the kingdom while Bluerook runs the board.

## Voice & tone

Editorial, confident, premium, restrained. Short declarative lines. No hype, no
emoji in body copy, no exclamation marks. Chess / kingdom / empire metaphor.
Signature phrases:

- **"We run your operations. You run your empire."** (primary slogan)
- **"You focus on the kingdom. We run the board."** (castling payoff line)
- **"premium execution"**, **"the standard holds whether you're watching or not."**

Typographic voice rule: *accent words* are set in the italic display serif; the rest
is the grotesque sans. Brass is a jewellery point — **appears once per composition,
never twice.**

## Color palette

| Token | Hex | Name | Role |
|-------|-----|------|------|
| `--color-bg` | `#08111E` | Midnight | Page background — "carries the page" |
| `--color-surface` | `#0D1828` | Midnight raised | Cards, panels |
| `--color-surface-2` | `#11203A` | Midnight raised ×2 | Nested surfaces |
| `--color-line` | `#1A2B47` | — | Hairlines, borders |
| `--color-text` | `#F4EDE0` | Paper | All type — "carries the type" |
| `--color-text-muted` | paper @ 70% | — | Secondary text |
| `--color-text-dim` | paper @ 50% | — | Tertiary text |
| `--color-accent` | `#D4A437` | Brass | The single jewellery point per spread |
| `--color-mark` | `#1C3F8A` | Bluerook Blue | The mark only — structural callouts, **never type** |

Very-dark theme variant (`.theme-very-dark`) pulls Midnight toward `#03070D`. Mobile
mirrors these as `--m-bg`, `--m-text`, `--m-gold`, `--m-slate`, etc.

Rule of thumb: **Midnight carries the page · Paper carries the type · Blue carries the
mark · Brass appears once, never twice.**

## Typography

| Role | Family | Usage |
|------|--------|-------|
| Display | **Cormorant Garamond** (italic) | Accent words only — headlines, emphasis |
| Sans / body / UI | **Geist** | All body copy and interface |
| Mono | **Geist Mono** | Eyebrows, meta labels, numbers, page markers |

Loaded from Google Fonts (see `<head>` in `index.html`). Fluid type scale via
`clamp()` — see `--fs-*` tokens. Eyebrow letter-spacing is `0.22em`, uppercase.

## Logo & favicon assets

See [`assets.md`](assets.md) for the full file catalog. Key brand primitives:

**Rook path** (viewBox `0 0 100 115`):
```
M 26,0 L 32,0 L 32,14 L 40,14 L 40,0 L 46,0 L 46,14 L 54,14 L 54,0 L 60,0 L 60,14
L 68,14 L 68,0 L 74,0 L 74,26 L 90,94 L 96,94 L 96,104 L 4,104 L 4,94 L 10,94 L 26,26 Z
```
Fill Paper `#F4EDE0` (on Midnight) or Bluerook Blue `#1C3F8A` (favicon). Always
followed by the brass rule: `<rect x="4" y="111" width="92" height="4" fill="#D4A437"/>`.

**King** (stepped-crown construction) lives in the castling section of `index.html`
(`.castling__piece--king`) — a spire + two stepped shoulders + tiara band + tapered
body + brass rule.

Favicon/logo tile: **navy rounded square + Paper rook + brass rule** (see
`favicon-src.svg` → `favicon.ico`, `linkedin-logo.png`, `web-app-manifest-*`).

## Motion

GSAP + ScrollTrigger drive the desktop cinematics; mobile uses CSS + a bespoke
scroll-scrubbed castling animation. Easings/timings are tokenized (`--ease-*`,
`--dur-*`). The hero, "diagnosis," "castling," and "why" sections are all
scroll-linked — see [`tech.md`](tech.md) for how they're wired.
