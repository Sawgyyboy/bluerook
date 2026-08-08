/*
 * Speed to lead.
 *
 * A visitor signals intent and the system reaches them while they are still on
 * the page. This is the real product behaviour, not a depiction of it, so it
 * carries two risks an ordinary endpoint does not: someone entering a number
 * they do not own, and someone looping it. The gate in n8n bounds both, and
 * the guards here bound what reaches the gate.
 *
 * The response carries the actual step trace with real elapsed milliseconds.
 * The page draws its progress list from that and nothing else, so what the
 * visitor watches is what happened.
 *
 * See api/_lead-core.js for the split between this function and the gate.
 */

const {
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
  retellConfigured,
  placeCall,
  MIN_MS_BETWEEN_REQUESTS
} = require('./_lead-core.js');

/* Why the request stopped, and what the browser should do about it. */
const STATUS = {
  consent_required: 400,
  name_required: 400,
  invalid_number: 400,
  invalid_channel: 400,
  number_already_called: 429,
  recently_submitted: 429,
  too_many_requests: 429,
  daily_cap_reached: 429,
  speed_to_lead_unconfigured: 503,
  call_creation_failed: 502,
  retell_unavailable: 502
};

function fail(response, reason, extra) {
  return response.status(STATUS[reason] || 400).json({ error: reason, ...extra });
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

  const began = Date.now();
  const since = () => Date.now() - began;

  const body = request.body || {};

  // Consent is not a formality: it is the record that this person asked to be
  // contacted and confirmed the number is theirs.
  if (body.consent !== true) return fail(response, 'consent_required');

  const name = cleanName(body.name);
  if (!name) return fail(response, 'name_required');

  const channel = cleanChannel(body.channel);
  const wantsCall = channel === 'call' || channel === 'both';
  const phone = normalizePhone(body.phone);

  // "Text me" is the one channel that can proceed without a number, because
  // the thread opens on the visitor's own device.
  if (wantsCall && !phone) return fail(response, 'invalid_number');
  if (!wantsCall && body.phone && !phone) return fail(response, 'invalid_number');

  if (tooSoon(request)) {
    response.setHeader('Retry-After', String(MIN_MS_BETWEEN_REQUESTS / 1000));
    return fail(response, 'too_many_requests');
  }
  markAddress(request);

  if (wantsCall && !retellConfigured()) {
    return fail(response, 'speed_to_lead_unconfigured');
  }

  const gatePayload = {
    name,
    phone,
    channel,
    consent: true,
    addressKey: addressKey(request),
    source: typeof body.source === 'string' ? body.source.slice(0, 60) : 'bluerook.co/work'
  };

  const verdict = await askGate(gatePayload);
  if (!verdict.ok) return fail(response, verdict.reason || 'too_many_requests', { degraded: verdict.degraded });

  // Steps are timed from this handler, not from the gate, so they match what
  // the visitor experienced rather than what the gate saw.
  const steps = [
    { id: 'captured', label: 'Intent captured', ms: 0 },
    { id: 'recorded', label: 'Lead recorded', ms: since() }
  ];
  const notified = verdict.steps.find((step) => step.id === 'notified');
  if (notified) steps.push({ ...notified, ms: since() });

  let call = null;
  if (wantsCall) {
    try {
      call = await placeCall({ name, phone, leadId: verdict.leadId });
    } catch (error) {
      // The slot was spent at the decision. The call never happened, so give it
      // back rather than locking this number out for a day over our failure.
      await releaseGate(gatePayload);
      const reason = error.message === 'call_creation_failed' ? 'call_creation_failed' : 'retell_unavailable';
      return fail(response, reason, { leadId: verdict.leadId });
    }
    if (verdict.degraded) commitLocal(phone);
    steps.push({ id: 'dialling', label: 'Agent dialling', ms: since() });
  }

  return response.status(201).json({
    leadId: verdict.leadId || null,
    // Kept for the older caller in showcase.js, which reads these two.
    callId: call?.call_id || null,
    status: call?.call_status || (wantsCall ? 'registered' : 'recorded'),
    channel,
    dispatched: { call: Boolean(call), text: channel === 'text' || channel === 'both' },
    remainingToday: typeof verdict.remainingToday === 'number' ? verdict.remainingToday : null,
    degraded: Boolean(verdict.degraded),
    steps
  });
};
