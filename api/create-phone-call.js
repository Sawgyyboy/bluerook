/*
 * Speed to lead — original entry point, kept as a delegate.
 *
 * The logic moved to api/lead.js when the decision moved into the n8n gate.
 * This stays for two reasons: a browser holding a cached copy of the old
 * script still works, and leaving a second implementation alive here would be
 * a way around the gate's per-number and daily limits.
 *
 * There is one code path. This is a door onto it.
 */

const lead = require('./lead.js');

module.exports = function handler(request, response) {
  const body = request.body;
  if (body && typeof body === 'object' && !Array.isArray(body) && !body.channel) {
    // The old caller sent a WhatsApp preference rather than a channel choice,
    // and nothing ever acted on it. Every call through this door is a call.
    body.channel = 'call';
  }
  return lead(request, response);
};
