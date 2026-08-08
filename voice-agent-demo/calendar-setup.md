# Arden live Calendly setup

The code and prompt are prepared for end-to-end voice scheduling. The remaining
steps connect Bluerook's private Calendly account to the deployed server and add
the two tools to Arden in Retell.

## Before starting

- Calendly's Scheduling API requires a paid Calendly plan.
- Use a personal access token because this is an internal Bluerook integration for
  one Calendly account. Do not create a public OAuth application for this pilot.
- Keep all tokens and shared secrets out of chat, Git, the system prompt, and the
  knowledge base.

## 1. Create the Calendly token

In Calendly, open **Integrations and apps → API and webhooks → Personal access
tokens** and create a token for the Bluerook scheduling integration.

Grant **all three** of these scopes:

| Scope | Why it is needed |
|---|---|
| `users:read` | Resolve the account and list its event types during setup, and power the `verify_calendar_setup` health check. |
| `event_types:read` | Read event types and event-type available times, which is the lookup Arden makes mid-conversation. |
| `scheduled_events:write` | Create the invitee that books the call. |

A token missing `users:read` still authenticates. Calendly answers
`403 Insufficient scope` with `required_scopes: ["users:read"]`, which reads like
a rejected token but is not one. An earlier revision of this guide omitted
`users:read`, which is how the first token was created without it.

## 2. Get the event type URI

Once the token has the scopes above, run the setup check against the deployed
site instead of calling Calendly by hand. It prints every active event type with
its API URI:

```bash
curl -s -X POST https://www.bluerook.co/api/retell-calendar -H 'Content-Type: application/json' -H 'X-Bluerook-Tool-Key: YOUR_TOOL_SECRET' -d '{"name":"verify_calendar_setup"}'
```

Copy the `uri` of the active 30-minute strategy call. It is shaped like
`https://api.calendly.com/event_types/EVENT_TYPE_UUID`. Do not use the public
scheduling URL as `CALENDLY_EVENT_TYPE_URI`.

The public URL is:

`https://calendly.com/hatim-bluerook/30min`

The server needs the corresponding API URI, shaped like:

`https://api.calendly.com/event_types/EVENT_TYPE_UUID`

## 3. Add Vercel environment variables

Open the Bluerook Vercel project's Environment Variables page and add these to
Production and Preview as **Sensitive**:

- `CALENDLY_ACCESS_TOKEN`
- `CALENDLY_EVENT_TYPE_URI`
- `RETELL_CALENDAR_TOOL_SECRET`

Create `RETELL_CALENDAR_TOOL_SECRET` as a new random value of at least 32 bytes.
It is not the Retell API key and not the Calendly token.

> Vercel masks Sensitive variables. `vercel env pull` writes the literal string
> `[encrypted]` in place of the value, and any tool that reads the variable back
> and sends it to Calendly will get a `401`. That is a masking artefact, not a
> bad token. Diagnose stored credentials with `verify_calendar_setup` against a
> deployed function, which sees the real value — never by reading them back.

Only add these optional values if the Calendly event type requires them:

- `CALENDLY_LOCATION_KIND`
- `CALENDLY_COMPANY_QUESTION`
- `CALENDLY_BOTTLENECK_QUESTION`

For the question variables, copy the exact question text configured on the
Calendly event type. If no matching question exists, leave the variable unset.

Redeploy the current site after saving the variables.

## 4. Add both custom functions in Retell

Open Arden's **Functions** section and create:

1. `check_strategy_call_availability`
2. `book_strategy_call`

For both:

- Type: **Custom Function**
- Method: `POST`
- Endpoint: `https://www.bluerook.co/api/retell-calendar`
- Timeout: `12000 ms`
- Payload: args only: **Off**
- Header name: `X-Bluerook-Tool-Key`
- Header value: the exact `RETELL_CALENDAR_TOOL_SECRET`

Copy the descriptions, parameter schemas, and speech settings from
`retell-settings.md`.

## 5. Update Arden

1. Replace Arden's prompt with `agent-prompt.md`.
2. Replace the attached knowledge-base content with `knowledge-base.md`.
3. Enable Echo Verification.
4. Set real-time transcription to Optimize for Accuracy.
5. Save a new Retell version named:

`AI System VA discovery + live Calendly scheduling v2`

## 6. Test before public use

Run tests T25–T32 in `test-cases.md`, including:

- timezone conversion;
- no more than three offered slots;
- exact-slot preservation;
- corrected email before confirmation;
- explicit confirmation before the write;
- slot conflict recovery;
- unavailable-tool fallback;
- no booking with missing details.

Use a real email address you control and cancel each test appointment from the
Calendly confirmation email. Do not test with client contact details.

