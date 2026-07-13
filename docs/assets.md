# Assets — Bluerook

Catalog of every image/icon file, its size, purpose, and where it's used.
⚠️ Files at **repo root** are served by absolute URL and referenced in
`index.html` — **do not move or rename them** without updating the references.

## Web-served (root — wired into the site)

| File | Size | Purpose | Referenced by |
|------|------|---------|---------------|
| `favicon.ico` | 16/32/48 multi | Primary favicon (search + tabs) | `<link rel=icon>` |
| `favicon-96x96.png` | 96×96 | PNG favicon fallback | `<link rel=icon>` |
| `favicon-src.svg` | vector | SVG favicon (source of all icons) | `<link rel=icon svg>` |
| `apple-touch-icon.png` | 180×180 | iOS home-screen icon | `<link rel=apple-touch-icon>` |
| `web-app-manifest-192x192.png` | 192×192 | PWA/Android icon (maskable) | `site.webmanifest` |
| `web-app-manifest-512x512.png` | 512×512 | PWA icon + JSON-LD `logo` | `site.webmanifest`, JSON-LD |
| `og-image.png` | 1200×630 | Open Graph / Twitter share card | `og:image`, `twitter:image`, JSON-LD `image` |
| `site.webmanifest` | — | PWA manifest | `<link rel=manifest>` |
| `robots.txt` | — | Crawl directives + sitemap pointer | crawlers |
| `sitemap.xml` | — | Page list for search engines | Search Console |

All icons are the same design: **navy rounded tile + Paper rook + brass rule**,
generated from `favicon-src.svg` via ImageMagick.

## Brand source / off-site (not wired into the page)

| File | Size | Purpose |
|------|------|---------|
| `linkedin-logo.png` | 400×400 | Uploaded as the LinkedIn company-page logo (same navy tile). |
| `bluerooklogodark.png` | 1145×311 | Legacy landscape wordmark; was the first OG image before `og-image.png`. |
| `assets/bluerook-logo-blue.png` | 1600×1920 | High-res blue rook logo (source). |
| `assets/bluerook-logo-paper.png` | 1600×1920 | High-res paper rook logo (source). |
| `assets/logo-tower.png` | 1200×1440 | Rook tower logo (source). |

## Regenerating icons

All favicons/icons derive from `favicon-src.svg`. To rebuild (requires ImageMagick):

```bash
magick -background none favicon-src.svg -resize 96x96  favicon-96x96.png
magick -background none favicon-src.svg -resize 180x180 apple-touch-icon.png
magick -background none favicon-src.svg -resize 192x192 web-app-manifest-192x192.png
magick -background none favicon-src.svg -resize 512x512 web-app-manifest-512x512.png
magick -background none favicon-src.svg -define icon:auto-resize=16,32,48 favicon.ico
magick -background none favicon-src.svg -resize 400x400 linkedin-logo.png
```

The **OG image** (`og-image.png`) is a composed 1200×630 card (Midnight gradient +
blue rook + headline + tagline), also built with ImageMagick — see the git history of
the commit "SEO: add Open Graph…" for the exact draw command if it needs rebuilding.

## In-SVG brand primitives (inline in `index.html`, no file)

The rook and king marks used in the hero/castling sections are inline `<svg>` paths,
not image files — see [`brand.md`](brand.md#logo--favicon-assets) for the rook path and
the king construction.
