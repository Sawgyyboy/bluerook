const RETELL_WEB_CALL_URL = 'https://api.retellai.com/v2/create-web-call';
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

/*
 * Every call minted here costs Retell minutes, so the request has to prove it
 * came from a Bluerook page. Browsers always send Origin on a cross-origin POST
 * and Referer on a same-origin one; a bare script sends neither. Treating a
 * missing header as trusted previously let anyone drain the account with curl.
 */
function isAllowedCaller(request) {
  const origin = request.headers.origin;
  if (origin) return isAllowedUrl(origin);
  const referer = request.headers.referer;
  if (referer) return isAllowedUrl(referer);
  return false;
}

/*
 * Best-effort per-address cooldown. Serverless instances are recycled, so this
 * is a speed bump rather than a quota; it stops a single client looping the
 * endpoint on one warm instance.
 */
const MIN_MS_BETWEEN_CALLS = 10000;
const RECENT_CALLERS_LIMIT = 500;
const recentCallers = new Map();

function isRateLimited(request) {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const key = forwarded || request.socket?.remoteAddress || 'unknown';
  const now = Date.now();

  for (const [caller, at] of recentCallers) {
    if (now - at > MIN_MS_BETWEEN_CALLS) recentCallers.delete(caller);
  }
  if (recentCallers.size > RECENT_CALLERS_LIMIT) recentCallers.clear();

  const last = recentCallers.get(key);
  if (last && now - last < MIN_MS_BETWEEN_CALLS) return true;
  recentCallers.set(key, now);
  return false;
}

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

  if (isRateLimited(request)) {
    response.setHeader('Retry-After', String(MIN_MS_BETWEEN_CALLS / 1000));
    return response.status(429).json({ error: 'too_many_requests' });
  }

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return response.status(503).json({ error: 'voice_trial_unconfigured' });
  }

  try {
    const retellResponse = await fetch(RETELL_WEB_CALL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: ARDEN_AGENT_ID,
        metadata: { source: 'bluerook_website_voice_trial' },
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!retellResponse.ok) {
      return response.status(502).json({ error: 'retell_call_creation_failed' });
    }

    const call = await retellResponse.json();
    return response.status(201).json({
      accessToken: call.access_token,
      callId: call.call_id,
    });
  } catch {
    return response.status(502).json({ error: 'retell_unavailable' });
  }
};
