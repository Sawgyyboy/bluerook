# Deployment — Bluerook

## Hosting

**Vercel** (static hosting). Deploys automatically from GitHub.

| Field | Value |
|-------|-------|
| Vercel project | `bluerook` |
| Project ID | `prj_9gxciAxoc3fG104BWar3Yzsy1oZR` |
| Team / org ID | `team_eABq60IxzVgA0zOru1sXRXjK` (team slug: sawgyyboys-projects) |
| Node version | 24.x |
| Repo | https://github.com/Sawgyyboy/bluerook |
| Production branch | `main` |
| Local link file | `.vercel/project.json` (holds projectId + orgId) |

## Deploy flow

**Push to `main` → Vercel builds & deploys to production automatically** (GitHub
integration). There is no `vercel deploy` step in the normal workflow and no build
command (static site). Typical loop:

```
# edit files → verify in preview →
git add <files>
git commit -m "..."
git push origin main          # Vercel auto-deploys within ~1 min
```

Preview/branch deploys happen for non-main branches. Production URL aliases:
`bluerook.co`, `www.bluerook.co`, `bluerook.vercel.app`.

## Domain & DNS

- **Registrar / DNS:** Namecheap (Advanced DNS for `bluerook.co`).
- **A record:** `@ → 76.76.21.21` (Vercel apex).
- **CNAME:** `www → <hash>.vercel-dns-017.com` (Vercel).
- **Email (Amazon SES):** SPF (`send` TXT `v=spf1 include:amazonses.com ~all`),
  DKIM (`default._domainkey`, `google._domainkey`, `resend._domainkey`),
  DMARC (`_dmarc` → `v=DMARC1; p=none; rua=mailto:hatim@bluerook.co`).
- **Google verification:** `google-site-verification` TXT record(s) on `@`.

## Canonical domain

**Intended canonical = apex `https://bluerook.co` (no www).** Every SEO tag in
`index.html` (canonical, `og:url`, JSON-LD `url`/`@id`), plus `sitemap.xml` and
`robots.txt`, use the apex.

⚠️ **Open item:** at the Vercel domain level, production currently still **redirects
apex → www** (`https://bluerook.co/` → 307 → `https://www.bluerook.co/`). This is the
*opposite* of the intended canonical and splits signals across two hostnames. To
finish:

> Vercel → project **bluerook** → **Settings → Domains**:
> - Set **`bluerook.co`** as primary / **No Redirect**.
> - Set **`www.bluerook.co`** to **Redirect → `bluerook.co`**.
>
> End state: `bluerook.co` → 200, `www.bluerook.co` → redirect → apex. Then re-check
> with `curl -I https://bluerook.co/` (expect `200`, not `307`).

There is **no API/MCP method** to flip a Vercel domain redirect — it must be done in
the dashboard.

## Verifying a deploy

- List recent deployments via the Vercel MCP (`list_deployments` with the project/team
  IDs above) — look for `state: READY`, `target: production`, and the matching commit
  SHA/message.
- Or `curl -I https://bluerook.co/` and check headers / that latest changes are live.
