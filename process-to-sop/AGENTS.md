# Process to SOP — agent instructions

Read the parent repository `AGENTS.md` and the centralized Bluerook `BRAND.md`
before working here.

- This is a Next.js application, separate from the root static site's runtime.
- Preserve the structured SOP schema in `lib/sop.ts` across the API, UI, and
  serializers.
- Never ship `SOP_MOCK=1` to production.
- API keys are server-only and must remain in ignored environment configuration.
- Use the Bluerook brand foundation; product semantic colors may extend it but may
  not replace it.
- Validate with `npm run lint` and `npm run build`, plus a visual and end-to-end
  generation check for customer-facing changes.
- The app is currently untracked by Git. Do not assume a deploy includes local
  changes until it has been deliberately reviewed and committed.

