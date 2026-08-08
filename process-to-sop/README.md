# Process to SOP

Turn a messy description of a recurring business process into a clear, structured
SOP — steps, owners, decisions, controls, risks and automation opportunities.
A free operations tool by [Bluerook](https://bluerook.co).

Built with Next.js (App Router), TypeScript, Tailwind CSS, the AI SDK and Zod.
No database, no accounts — drafts persist in the browser's localStorage.

> **Note:** this app is a self-contained subproject inside the Bluerook static-site
> repo. Everything it needs lives in `process-to-sop/`; the marketing site at the
> repo root is untouched and still has no build step.

## How it works

1. The user describes a process in plain language (name and industry optional).
2. `POST /api/generate` sends it to Claude with a strict operations-consultant
   system prompt and a Zod-validated output schema.
3. The model either returns the structured SOP or asks up to three clarification
   questions when essential information is missing. Unconfirmed inferences are
   listed as assumptions, never stated as fact.
4. The SOP renders as an editable paper memo. Every field can be edited inline,
   copied per section, copied whole as plain text, downloaded as Markdown, or
   printed to PDF via the browser.

## Installation

```bash
cd process-to-sop
npm install
```

## Environment variables

Copy the sample file and fill in a key:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | one of these two | Direct Anthropic API key ([console.anthropic.com](https://console.anthropic.com)) |
| `AI_GATEWAY_API_KEY` | one of these two | Route through the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) instead |
| `SOP_MODEL` | no | Model override (default `claude-sonnet-5`) |
| `SOP_MOCK` | no | `1` returns a canned SOP without calling the AI — for UI development only. Add `[clarify]` to the description to exercise the clarification flow. Never set in production. |
| `NEXT_PUBLIC_SITE_URL` | no | Public URL used for canonical / Open Graph tags |

The API key is only ever read server-side (in the API route). Nothing secret is
shipped to the client.

## Local development

```bash
npm run dev      # http://localhost:3000
npm run build    # production build + type check
npm run lint     # eslint
npm run start    # serve the production build
```

## Deployment to Vercel

Deploy as a **separate Vercel project** (do not point it at the repo root — that's
the static marketing site):

1. Vercel dashboard → **Add New → Project** → import `Sawgyyboy/bluerook`.
2. Set **Root Directory** to `process-to-sop`. Framework preset: Next.js
   (auto-detected).
3. Add `ANTHROPIC_API_KEY` (or `AI_GATEWAY_API_KEY`) under
   **Settings → Environment Variables** for Production and Preview.
4. Optionally set `NEXT_PUBLIC_SITE_URL` to the final URL (e.g.
   `https://tools.bluerook.co`) and attach that domain under **Settings → Domains**.
5. Deploy. Pushes to `main` that touch `process-to-sop/` redeploy automatically.

## Project layout

```
app/
  layout.tsx            fonts, metadata, Open Graph
  page.tsx              renders the tool
  globals.css           Bluerook design tokens, print styles
  api/generate/route.ts server route: prompt, AI call, Zod validation
components/
  Tool.tsx              state machine: input → clarify → loading → output/error
  InputForm.tsx         input state
  ClarifyPanel.tsx      up-to-three clarification questions
  LoadingPanel.tsx      cycling operational status messages
  ErrorPanel.tsx        failure state with retry
  SopDocument.tsx       the editable paper memo (9 sections)
  Editable.tsx          inline contentEditable field
lib/
  sop.ts                Zod schemas: SOP, request, model output
  serialize.ts          plain-text / Markdown serializers
  examples.ts           three example processes (lead follow-up, onboarding, events)
  mock.ts               canned SOP for SOP_MOCK=1
```

## Design

Bluerook Brand Standards Vol. II — Midnight `#08111E`, Paper `#F4EDE0`,
Bluerook Blue `#1C3F8A`, Brass `#D4A437`, Harbour `#0E1A2B`, Slate `#7A8AA0`.
Cormorant Garamond for display, Geist for body, Geist Mono for labels.
The output is styled as a private operations memo: a paper panel on a midnight
page, thin rules, small mono labels, brass used sparingly.
