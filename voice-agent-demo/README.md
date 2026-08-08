# Bluerook Retell AI voice concierge

This folder contains the test package for a client-facing Bluerook voice agent
built with Retell AI.

The agent is intentionally a pre-sales concierge, not an autonomous salesperson:

- answers questions using the approved Bluerook knowledge base;
- identifies whether the caller has an operational bottleneck Bluerook can help with;
- invites suitable callers to a free 30-minute strategy call;
- never invents prices, availability, clients, results, or guarantees.

## Files

- `agent-prompt.md` — paste into the Retell LLM general prompt.
- `knowledge-base.md` — upload as a Retell knowledge-base document.
- `retell-settings.md` — field-by-field recommended Retell configuration.
- `calendar-setup.md` — secure Calendly and Retell connection checklist.
- `product-systems-draft.md` — AI System VA catalogue and future workflow-visual direction.
- `test-cases.md` — manual acceptance tests and launch gate.
- `index.html`, `styles.css`, `app.js` — branded Retell voice-widget test page.

## 1. Create the Retell voice agent

1. Sign in to the Retell dashboard.
2. Open **Agents**, select **Create an agent**, and create a **Voice Agent** using
   the single-prompt / Retell LLM option.
3. Name it `Bluerook — Arden — Inbound Sales Concierge — Test`.
4. Paste the contents of `agent-prompt.md` into the **General Prompt**.
5. Set the start speaker to **Agent**.
6. Set the begin message to:

   `Thanks for calling Bluerook. I’m Arden, Bluerook’s AI concierge. What part of your operations would you like to improve?`

7. Choose English and a calm, professional voice. Keep speaking rate near the
   default for the first test.
8. Enable Retell's **Scope Boundaries** handbook preset. Keep AI disclosure enabled;
   the custom begin message already discloses AI immediately.
9. Add the built-in **End Call** tool so the agent can end naturally when the caller
   asks to stop or clearly finishes.
10. Publish the test agent and copy its **Voice Agent ID**.

Apply the remaining values in `retell-settings.md`.

Start with a single prompt. A Conversation Flow agent is unnecessary until real
tests show that the sales conversation needs deterministic stages or multiple
actions.

## 2. Add the knowledge base

1. Open **Knowledge Base** in Retell and create
   `Bluerook Approved Sales Knowledge`.
2. Upload `knowledge-base.md`.
3. Attach the knowledge base to the voice agent.
4. Start with Retell's default retrieval settings: 3 chunks and 0.60 similarity.
5. Publish the agent again after attaching the knowledge base.

## 3. Configure the client test widget

1. In Retell, open **Settings → Public Keys**.
2. Create a public key named `Bluerook Voice Demo`.
3. Allow only the domains used for testing:
   - `127.0.0.1` and/or `localhost` for local testing;
   - `bluerook.co` when the page is deployed.
4. Copy the public key. A Retell public key is intended for the website widget and
   is safe in frontend code. A private Retell API key is not.

## 4. Preview locally

From the marketing-site repository:

```powershell
python -m http.server 5173
```

Open:

```text
http://127.0.0.1:5173/voice-agent-demo/?voiceAgentId=YOUR_AGENT_ID&publicKey=YOUR_PUBLIC_KEY
```

The page injects Retell's official website widget in voice-only mode. The visitor
uses the **Talk to Bluerook AI** button in the lower-right corner to start.

The voice agent ID and widget public key are stored only in the URL for the current
visit. Never place `RETELL_API_KEY` or another private key in this folder, URL, or
browser-side code.

## Booking behavior

Arden is designed to book inside the voice conversation through two protected
Retell custom functions:

- `check_strategy_call_availability` reads live slots from Bluerook's 30-minute
  Calendly event type;
- `book_strategy_call` re-checks the selected slot and creates the invitee only
  after the caller confirms their name, email, local time, and timezone.

The booking-page link remains the fallback when the caller does not want to share
an email by voice or the calendar tools are unavailable. The implementation and
exact Retell fields are documented in `retell-settings.md`. The server endpoint is
`/api/retell-calendar`; it remains unavailable until the required Calendly and
shared-tool secrets are configured in Vercel.

## Client testing

Do not share the page until every required case in `test-cases.md` passes. For a
small controlled pilot, deploy this folder with the marketing site and send:

```text
https://bluerook.co/voice-agent-demo/?voiceAgentId=YOUR_AGENT_ID&publicKey=YOUR_PUBLIC_KEY
```

Before wider public use:

- restrict the Retell public key to `bluerook.co`;
- enable Retell's supported reCAPTCHA v3 protection;
- review call recording, transcript retention, and PII storage settings;
- verify the disclosure and consent requirements that apply to each caller;
- review the first 10–20 call transcripts and rerun the acceptance tests.
