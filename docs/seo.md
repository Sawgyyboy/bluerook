# SEO — Bluerook

Status snapshot (keep updated as things change).

## What's in place ✅

All in `index.html` `<head>` unless noted:

- **Title:** "Bluerook — AI System VAs & Automation Systems | We run your operations"
- **Meta:** description, keywords, author, `robots` (`index, follow,
  max-image-preview:large, max-snippet:-1, max-video-preview:-1`).
- **Canonical:** `https://bluerook.co/` (apex — see [`deployment.md`](deployment.md#canonical-domain)).
- **Open Graph** + **Twitter Card** — title, description, `og:image` = `/og-image.png`
  (1200×630), dimensions, alt, locale.
- **Structured data (JSON-LD):**
  - `Organization` (`@id` `…/#organization`) — name, url, logo (ImageObject 512),
    image, description, slogan, email, areaServed Worldwide, `knowsAbout` (services),
    `contactPoint` (sales, email + booking url). **`sameAs` is currently empty.**
  - `WebSite` (`@id` `…/#website`) — publisher → the Organization.
- **Favicons:** real crawlable files (`favicon.ico` 16/32/48, `favicon-96x96.png`,
  `favicon-src.svg`, `apple-touch-icon.png` 180). Navy tile + Paper rook so it reads at
  16px on white. (Replaced an old inline `data:` URI that Google wouldn't index.)
- **`site.webmanifest`** — PWA name/colors + 192/512 maskable icons.
- **`robots.txt`** — allow all + `Sitemap: https://bluerook.co/sitemap.xml`.
- **`sitemap.xml`** — single URL (`/`), the homepage.

## Google Search Console

- Property: **URL-prefix `https://bluerook.co/`**, verified.
- **Sitemap submitted → Success** (1 page discovered).
- **Homepage indexed** — URL Inspection reports "URL is on Google / Page is indexed,"
  indexing requested (priority crawl queue).
- Verified via Rich Results Test: structured data valid (Organization).

## Open items ⏳

1. **Flip apex/www redirect** so the live host matches the canonical apex — see
   [`deployment.md`](deployment.md#canonical-domain). Until then, signals split across
   two hostnames (the sitemap still fetched because Google followed the redirect).
2. **Add `sameAs`** to the Organization JSON-LD once the LinkedIn page (and any other
   socials) are confirmed live — e.g. `"sameAs": ["https://www.linkedin.com/company/bluerook/"]`.
   Links the site and brand profiles as one entity.

## Growth levers (for ranking, not just indexing)

Indexing ≠ ranking. The site is indexed; ranking for real queries takes weeks–months
and depends on signals the page alone can't provide. Biggest levers for this young
domain, roughly in order:

1. **Time** — new domains sit in a trust-building period.
2. **Backlinks** — LinkedIn, directories (Clutch, GoodFirms for BPO/agencies), partner
   and client sites. Single biggest lever early. Add each new profile to `sameAs`.
3. **Google Business Profile** — helps brand searches even for a remote agency.
4. **More content/pages** — a 1-page site ranks for very little; add services/about/
   blog pages targeting real client questions. (Would also expand `sitemap.xml`.)
5. **Brand mentions** — more "Bluerook" across the web → Google treats it as a real
   entity faster.

Note: the brand term "bluerook" competes with established similarly-named entities
(e.g. "Bluerock"); brand ranking may take time. Verify presence with
`site:bluerook.co`.

## Handy validators

- Rich Results: https://search.google.com/test/rich-results
- Search Console: https://search.google.com/search-console
- Facebook OG debugger: https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
