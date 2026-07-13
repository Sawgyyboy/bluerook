# Bluerook

Marketing website for **Bluerook** — a premium BPO & virtual-assistant agency for
high-performing entrepreneurs.

**Live:** https://bluerook.co · **Stack:** vanilla static site (HTML/CSS/JS, no build)
· **Host:** Vercel (auto-deploys on push to `main`).

> *We run your operations. You run your empire.*

## Repo layout

```
index.html              The entire single-page site (+ <head> SEO, Calendly init)
tokens.css              Design tokens — single source of truth for brand values
styles.css              All CSS (incl. a full separate mobile block @768px)
script.js               GSAP animations, mobile castling, carousels, nav, loader
CNAME                   bluerook.co
sitemap.xml robots.txt site.webmanifest   SEO / crawl files
favicon.* apple-touch-icon.png web-app-manifest-*.png og-image.png   icons & share card
linkedin-logo.png bluerooklogodark.png assets/            brand logo sources
docs/                   ← full knowledge base (read this)
CLAUDE.md               Entry point / rules for AI-agent sessions
```

## Documentation

Everything about the brand, site, and business lives in [`docs/`](docs/):

- **[brand.md](docs/brand.md)** — identity, colors, typography, logo, voice.
- **[content.md](docs/content.md)** — all site copy, section by section.
- **[business.md](docs/business.md)** — what it sells, ICP, offer, contact, socials.
- **[tech.md](docs/tech.md)** — stack, file map, libraries, how to run locally.
- **[deployment.md](docs/deployment.md)** — Vercel, domain, DNS, deploy flow.
- **[seo.md](docs/seo.md)** — SEO setup, Search Console, structured data, open items.
- **[assets.md](docs/assets.md)** — every image/icon file and how to regenerate it.

New AI/agent sessions should start with **[CLAUDE.md](CLAUDE.md)**.

## Working on it

No build step. Preview with any static server:

```bash
python -m http.server 5173   # → http://localhost:5173
```

Edit the files directly, verify at **mobile 390×844** and **desktop**, then:

```bash
git add . && git commit -m "…" && git push origin main   # Vercel auto-deploys
```

Pull brand values from `tokens.css` — never hard-code hexes. See
[CLAUDE.md](CLAUDE.md) for the full house rules (canonical domain, no-build, asset
locations, etc.).

## Open items

- Flip the Vercel apex/www redirect so the live host matches the canonical apex
  (`bluerook.co`). See [docs/deployment.md](docs/deployment.md#canonical-domain).
- Add the LinkedIn URL to the JSON-LD `sameAs` once the page is confirmed live. See
  [docs/seo.md](docs/seo.md#open-items).
