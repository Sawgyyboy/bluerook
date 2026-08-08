/*
 * Shared spine for the speed-to-lead endpoints.
 *
 * Files in /api prefixed with an underscore are not turned into functions by
 * Vercel, so this is a plain module that lead.js and create-phone-call.js both
 * import.
 *
 * The division of labour matters:
 *
 *   here (Vercel)  origin, consent, phone shape, a per-address speed bump, and
 *                  the Retell call itself, because the Retell key lives in this
 *                  project's environment and nowhere else.
 *
 *   n8n (the gate) the decision. One call per number per day and the daily
 *                  budget are held in workflow static data, which survives
 *                  across executions. The counters below cannot do that: they
 *                  live in module scope and vanish when an instance recycles.
 *                  They are the fallback for when the gate is unreachable, not
 *                  the primary control.
 *
 * Required env:
 *   RETELL_API_KEY         also used by create-web-call.js
 *   RETELL_FROM_NUMBER     the provisioned Retell number, E.164
 *   N8N_LEAD_WEBHOOK_URL   the gate
 *   N8N_LEAD_TOKEN         value for the gate's x-bluerook-token header
 */

const crypto = require('crypto');

const RETELL_PHONE_CALL_URL = 'https://api.retellai.com/v2/create-phone-call';

/*
 * Speed to lead is an outbound call and the strategy booker is written for
 * inbound, so they want different agents: "Thanks for calling Bluerook" is
 * wrong when Bluerook is the one dialling. This is an env var rather than a
 * constant so the demo agent can be swapped without a deploy. The default is
 * the booker, which is better than nothing if the variable is missing.
 */
const ARDEN_AGENT_ID = process.env.RETELL_SPEED_TO_LEAD_AGENT_ID
  || 'agent_85268269ae1b5361ea8250e5a3';

const GATE_TIMEOUT_MS = 5000;
const RETELL_TIMEOUT_MS = 12000;

/* ---- Origin ------------------------------------------------------------ */

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

/* ---- Input ------------------------------------------------------------- */

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

const CHANNELS = ['call', 'text', 'both'];
function cleanChannel(raw) {
  return CHANNELS.includes(raw) ? raw : 'call';
}

/* ---- Address ----------------------------------------------------------- */

function addressOf(request) {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || request.socket?.remoteAddress || 'unknown';
}

/*
 * The gate needs something stable to dedupe phoneless "text me" leads against,
 * but it has no business holding visitor IP addresses. A truncated salted hash
 * is enough to spot the same person twice and useless for anything else.
 */
function addressKey(request) {
  const salt = process.env.N8N_LEAD_TOKEN || 'bluerook';
  return crypto.createHash('sha256').update(salt + '|' + addressOf(request)).digest('hex').slice(0, 24);
}

/* ---- Local speed bump -------------------------------------------------- */

const MIN_MS_BETWEEN_REQUESTS = 30000;
const MAP_LIMIT = 1000;
const recentCallers = new Map();

/* Fallback quota, used only when the gate cannot be reached. */
const NUMBER_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_CALL_CAP = 40;
const recentNumbers = new Map();
let dailyCount = 0;
let dailyWindowStart = Date.now();

function prune(map, ttl) {
  const now = Date.now();
  if (map.size <= MAP_LIMIT) return;
  for (const [key, seen] of map) if (now - seen > ttl) map.delete(key);
}

/* Runs before any network hop, so a flood costs nothing. */
function tooSoon(request) {
  const last = recentCallers.get(addressOf(request));
  return Boolean(last && Date.now() - last < MIN_MS_BETWEEN_REQUESTS);
}

function markAddress(request) {
  recentCallers.set(addressOf(request), Date.now());
  prune(recentCallers, MIN_MS_BETWEEN_REQUESTS * 10);
}

/* The gate's job, done badly, for the minutes when the gate is down. */
function localDecision(phone) {
  const now = Date.now();
  if (now - dailyWindowStart > 24 * 60 * 60 * 1000) {
    dailyWindowStart = now;
    dailyCount = 0;
  }
  if (phone) {
    const last = recentNumbers.get(phone);
    if (last && now - last < NUMBER_COOLDOWN_MS) return { ok: false, reason: 'number_already_called' };
  }
  if (dailyCount >= DAILY_CALL_CAP) return { ok: false, reason: 'daily_cap_reached' };
  return { ok: true, reason: null };
}

function commitLocal(phone) {
  if (!phone) return;
  recentNumbers.set(phone, Date.now());
  dailyCount += 1;
  prune(recentNumbers, NUMBER_COOLDOWN_MS);
}

function releaseLocal(phone) {
  if (!phone) return;
  recentNumbers.delete(phone);
  dailyCount = Math.max(0, dailyCount - 1);
}

/* ---- The gate ---------------------------------------------------------- */

function gateConfigured() {
  return Boolean(process.env.N8N_LEAD_WEBHOOK_URL && process.env.N8N_LEAD_TOKEN);
}

async function callGate(body) {
  const response = await fetch(process.env.N8N_LEAD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-bluerook-token': process.env.N8N_LEAD_TOKEN
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(GATE_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error('gate_status_' + response.status);
  return response.json();
}

/*
 * Ask the gate whether this lead may proceed.
 *
 * A gate that is down must never take the site down with it, so an unreachable
 * gate falls through to the local counters and says so. `degraded` travels all
 * the way to the response, because a demo that quietly changes its own rules is
 * worse than one that admits it.
 */
async function askGate(payload) {
  if (!gateConfigured()) {
    const local = localDecision(payload.phone);
    return { ...local, degraded: true, why: 'gate_not_configured', steps: [] };
  }
  try {
    const verdict = await callGate(payload);
    return {
      ok: verdict.ok === true,
      reason: verdict.reason || null,
      leadId: verdict.leadId || null,
      dispatch: verdict.dispatch || {},
      remainingToday: verdict.remainingToday,
      steps: Array.isArray(verdict.steps) ? verdict.steps : [],
      degraded: false
    };
  } catch (error) {
    console.error('[bluerook lead] gate unreachable', String(error.message).slice(0, 160));
    const local = localDecision(payload.phone);
    return { ...local, degraded: true, why: 'gate_unreachable', steps: [] };
  }
}

/* Hand the slot back when the dispatch we promised did not happen. */
async function releaseGate(payload) {
  releaseLocal(payload.phone);
  if (!gateConfigured()) return;
  try {
    await callGate({ mode: 'release', phone: payload.phone, addressKey: payload.addressKey });
  } catch (error) {
    console.error('[bluerook lead] release failed', String(error.message).slice(0, 160));
  }
}

/* ---- Retell ------------------------------------------------------------ */

function retellConfigured() {
  return Boolean(process.env.RETELL_API_KEY && process.env.RETELL_FROM_NUMBER);
}

/*
 * Retell rejects a call with a 400 and a sentence. Two of the things that
 * sentence can mean look identical from the outside and need opposite fixes:
 * a destination the network will not take, and an outbound line that is not
 * provisioned on the account. One is the visitor's problem, the other is ours.
 */
function classifyCallFailure(status, detail) {
  const text = String(detail || '').toLowerCase();
  if (status === 401 || status === 403) return 'outbound_not_authorised';
  if (status === 402) return 'outbound_billing';
  if (/from[_ ]?number|not owned|not purchased|no such number|does not exist/.test(text)) {
    return 'outbound_line_unavailable';
  }
  if (/to[_ ]?number|invalid number|not a valid|unreachable|destination|cannot be reached/.test(text)) {
    return 'destination_rejected';
  }
  return 'call_creation_failed';
}

/* Enough of the provider's wording to diagnose, with every phone number taken
   out of it, so the shape of the error can travel without the numbers doing so. */
function redactNumbers(detail) {
  return String(detail || '')
    .replace(/\+?\d[\d\s()\-.]{6,}\d/g, '<number>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

async function placeCall({ name, phone, leadId }) {
  const response = await fetch(RETELL_PHONE_CALL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from_number: process.env.RETELL_FROM_NUMBER,
      to_number: phone,
      override_agent_id: ARDEN_AGENT_ID,
      retell_llm_dynamic_variables: {
        lead_name: name || 'there',
        lead_source: 'bluerook_portfolio_speed_to_lead'
      },
      metadata: {
        source: 'bluerook_portfolio_speed_to_lead',
        lead_id: leadId || null,
        consent_given_at: new Date().toISOString()
      }
    }),
    signal: AbortSignal.timeout(RETELL_TIMEOUT_MS)
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('[bluerook lead] retell error', response.status, detail.slice(0, 300));
    const error = new Error(classifyCallFailure(response.status, detail));
    error.upstream = response.status;
    error.hint = redactNumbers(detail);
    throw error;
  }
  return response.json();
}

module.exports = {
  classifyCallFailure,
  redactNumbers,
  isAllowedCaller,
  normalizePhone,
  cleanName,
  cleanChannel,
  addressKey,
  tooSoon,
  markAddress,
  commitLocal,
  askGate,
  releaseGate,
  gateConfigured,
  retellConfigured,
  placeCall,
  MIN_MS_BETWEEN_REQUESTS
};
