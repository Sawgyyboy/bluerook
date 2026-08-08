#!/usr/bin/env node
/*
 * One-time local helper: exchanges a Google OAuth consent for a refresh token
 * that lets the deployed endpoint read free/busy and create calendar events as
 * the Bluerook account.
 *
 * Run it on your own machine. It opens a loopback listener, prints a consent
 * URL, and writes the resulting refresh token straight into the gitignored
 * marketing-site/.env.local. The token is never printed to the terminal, so it
 * cannot end up in a screenshot or a chat transcript.
 *
 *   node voice-agent-demo/google-oauth-setup.js path/to/oauth-client.json
 *
 * The JSON is the OAuth *client* file downloaded from Google Cloud Console
 * (Credentials -> Create credentials -> OAuth client ID -> Desktop app).
 * That download is not affected by the service-account key policy.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];
const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;
const ENV_FILE = path.join(__dirname, '..', '.env.local');

function loadClient(file) {
  if (!file) {
    console.error('Usage: node voice-agent-demo/google-oauth-setup.js <oauth-client.json>');
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const block = raw.installed || raw.web || raw;
  if (!block.client_id || !block.client_secret) {
    console.error('That file does not look like an OAuth client download (no client_id/client_secret).');
    process.exit(1);
  }
  return { clientId: block.client_id, clientSecret: block.client_secret };
}

function upsertEnv(entries) {
  let contents = '';
  try {
    contents = fs.readFileSync(ENV_FILE, 'utf8');
  } catch {
    contents = '';
  }
  for (const [key, value] of Object.entries(entries)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    contents = pattern.test(contents)
      ? contents.replace(pattern, line)
      : `${contents.replace(/\s*$/, '')}\n${line}\n`;
  }
  fs.writeFileSync(ENV_FILE, contents.replace(/^\n/, ''), { encoding: 'utf8' });
}

async function main() {
  const { clientId, clientSecret } = loadClient(process.argv[2]);

  const consentUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  consentUrl.searchParams.set('client_id', clientId);
  consentUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  consentUrl.searchParams.set('response_type', 'code');
  consentUrl.searchParams.set('scope', SCOPES.join(' '));
  // Both are required to be issued a refresh token rather than only an access token.
  consentUrl.searchParams.set('access_type', 'offline');
  consentUrl.searchParams.set('prompt', 'consent');

  console.log('\n1. Open this URL in the browser where you are signed in as hatim@bluerook.co:\n');
  console.log(consentUrl.toString());
  console.log('\n2. Approve the calendar permissions. This window will finish automatically.\n');

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const incoming = new URL(request.url, REDIRECT_URI);
      const received = incoming.searchParams.get('code');
      const failure = incoming.searchParams.get('error');
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(received
        ? 'Bluerook: calendar access granted. You can close this tab.'
        : `Bluerook: authorization failed (${failure || 'no code returned'}).`);
      server.close();
      if (received) resolve(received);
      else reject(new Error(failure || 'no_code_returned'));
    });
    server.on('error', reject);
    server.listen(PORT);
  });

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok || !tokens.refresh_token) {
    console.error('Token exchange failed:', tokens.error_description || tokens.error || tokenResponse.status);
    if (tokenResponse.ok && !tokens.refresh_token) {
      console.error('No refresh token was returned. Revoke prior access at');
      console.error('https://myaccount.google.com/permissions and run this again.');
    }
    process.exit(1);
  }

  upsertEnv({
    GOOGLE_OAUTH_CLIENT_ID: clientId,
    GOOGLE_OAUTH_CLIENT_SECRET: clientSecret,
    GOOGLE_OAUTH_REFRESH_TOKEN: tokens.refresh_token,
    GOOGLE_CALENDAR_ID: 'hatim@bluerook.co',
  });

  console.log('Done. Four values were written to marketing-site/.env.local');
  console.log('(gitignored and vercelignored). The refresh token was not printed.');
  console.log('\nNext: add those four to Vercel as Sensitive, Production + Preview.');
}

main().catch((error) => {
  console.error('Setup failed:', error.message);
  process.exit(1);
});
