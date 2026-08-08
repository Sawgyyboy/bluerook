/*
 * Speed to lead — outbound call.
 *
 * A visitor signals intent, and Arden calls them back within seconds. This is
 * the real product behaviour: the system reaches out while the lead is hot.
 *
 * Because this endpoint places a real telephone call to a number typed into a
 * public web page, it carries two risks that ordinary endpoints do not:
 * someone entering a number they do not own (harassment), and someone looping
 * it (cost). The controls below bound both.
 *
 * Required env:
 *   RETELL_API_KEY      already used by create-web-call.js
 *   RETELL_FROM_NUMBER  the provisioned Retell number, E.164 (e.g. +441234567890)
 *
 * NOTE ON DURABILITY: the counters here live in module scope, so they reset
 * when a serverless instance recycles. They are a real speed bump, not a quota.
 * Before running this at volume, move `recentNumbers` and `dailyCount` into a
 * shared store (Vercel KV / Upstash Redis) so the caps hold across instances.
 */

const RETELL_PHONE_CALL_URL = 'https://api.retellai.com/v2/create-phone-call';
const ARDEN_AGENT_ID = 'agent_85268269ae1b5361ea8250e5a3';

function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
    const isProduction = ['bluerook.co', 'www.bluerook.co'].includes(url.hostname);
    const isPreview = url.hostname.endsWith('.vercel.app') && url.hostname.startsWith('bluerook');
    return isLocal || isProduction || isPreview;
  } catch {
    return false;
  }
}

function isAllowedCaller(request) {
  const origin = request.headers.origin;
  if (origin) return isAllowedUrl(origin);
  const referer = request.headers.referer;
  if (referer) return isAllowedUrl(referer);
  return false;
}

/* ---- Controls ---------------------------------------------------------- */

const MIN_MS_BETWEEN_REQUESTS = 30000;   // per address
const NUMBER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // one call per number per day
const DAILY_CALL_CAP = 40;               // hard ceiling on spend per instance/day
const MAP_LIMIT = 1000;

const recentCallers = new Map();
const recentNumbers = new Map();
let dailyCount = 0;
let dailyWindowStart = Date.now();

function prune(map, ttl) {
  const now = Date.now();
  if (map.size <= MAP_LIMIT) return;
  for (const [key, seen] of map) if (now - seen > ttl) map.delete(key);
}

function addressOf(request) {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || request.socket?.remoteAddress || 'unknown';
}

/*
 * Premium-rate and non-dialable ranges. Calls here are expensive or abusive by
 * construction, so they never reach the provider.
 */
const BLOCKED_PREFIXES = [
  '+1900', '+1976', '+1809', '+1829', '+1849', // US premium / known toll traps
  '+449', '+4470', '+4484', '+4487',           // UK premium and personal-numbering
  '+882', '+883', '+87',                        // global networks
  '+666', '+000'
];

function normalizePhone(raw) {
  if (typeof raw !== 'string') return null;
  const compact = raw.replace(/[\s()\-.]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) return null;
  if (BLOCKED_PREFIXES.some((prefix) => compact.startsWith(prefix))) return null;
  return compact;
}

function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^\p{L}\p{M}'\-. ]/gu, '').trim().slice(0, 40);
}

/* ---- Handler ----------------------------------------------------------- */

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'method_not_allowed' });
  }
  if (!isAllowedCaller(request)) {
    return response.status(403).json({ error: 'origin_not_allowed' });
  }

  const apiKey = process.env.RETELL_API_KEY;
  const fromNumber = process.env.RETELL_FROM_NUMBER;
  if (!apiKey || !fromNumber) {
    return response.status(503).json({ error: 'speed_to_lead_unconfigured' });
  }

  const body = request.body || {};

  // Consent is not a formality here: it is the record that the person asked to
  // be called and confirmed the number is theirs.
  if (body.consent !== true) {
    return response.status(400).json({ error: 'consent_required' });
  }

  const phone = normalizePhone(body.phone);
  if (!phone) {
    return response.status(400).json({ error: 'invalid_number' });
  }

  const name = cleanName(body.name);
  const now = Date.now();

  // Per-address speed bump.
  const address = addressOf(request);
  const lastFromAddress = recentCallers.get(address);
  if (lastFromAddress && now - lastFromAddress < MIN_MS_BETWEEN_REQUESTS) {
    response.setHeader('Retry-After', String(MIN_MS_BETWEEN_REQUESTS / 1000));
    return response.status(429).json({ error: 'too_many_requests' });
  }

  // One call per number per day. This is the control that stops the endpoint
  // being pointed at someone else repeatedly.
  const lastToNumber = recentNumbers.get(phone);
  if (lastToNumber && now - lastToNumber < NUMBER_COOLDOWN_MS) {
    return response.status(429).json({ error: 'number_already_called' });
  }

  // Daily ceiling, so a bad day cannot become a bad invoice.
  if (now - dailyWindowStart > 24 * 60 * 60 * 1000) {
    dailyWindowStart = now;
    dailyCount = 0;
  }
  if (dailyCount >= DAILY_CALL_CAP) {
    return response.status(429).json({ error: 'daily_cap_reached' });
  }

  try {
    const retellResponse = await fetch(RETELL_PHONE_CALL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_number: fromNumber,
        to_number: phone,
        override_agent_id: ARDEN_AGENT_ID,
        retell_llm_dynamic_variables: {
          lead_name: name || 'there',
          lead_source: 'bluerook_portfolio_speed_to_lead'
        },
        metadata: {
          source: 'bluerook_portfolio_speed_to_lead',
          consent_given_at: new Date(now).toISOString()
        }
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!retellResponse.ok) {
      const detail = await retellResponse.text();
      console.error('[bluerook speed-to-lead] retell error', retellResponse.status, detail.slice(0, 300));
      return response.status(502).json({ error: 'call_creation_failed' });
    }

    const call = await retellResponse.json();

    // Only commit the counters once the call is genuinely placed.
    recentCallers.set(address, now);
    recentNumbers.set(phone, now);
    dailyCount += 1;
    prune(recentCallers, MIN_MS_BETWEEN_REQUESTS * 10);
    prune(recentNumbers, NUMBER_COOLDOWN_MS);

    return response.status(201).json({
      callId: call.call_id || null,
      status: call.call_status || 'registered'
    });
  } catch (error) {
    console.error('[bluerook speed-to-lead] request failed', error);
    return response.status(502).json({ error: 'retell_unavailable' });
  }
};
