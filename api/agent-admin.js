const { timingSafeEqual } = require('node:crypto');

const RETELL_API_URL = 'https://api.retellai.com';
const ARDEN_AGENT_ID = 'agent_85268269ae1b5361ea8250e5a3';

/*
 * Operator-only inspection of the live Retell agent. Read-only by design: it
 * reports what is actually configured so dashboard guidance is based on the
 * deployed state rather than on assumption. It never returns the Retell API
 * key, and it is never exposed to the agent as a callable function.
 */

function send(response, status, payload) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(status).json(payload);
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(request) {
  const expected = process.env.RETELL_CALENDAR_TOOL_SECRET;
  const provided = request.headers['x-bluerook-tool-key'];
  return Boolean(expected && provided && safeEqual(provided, expected));
}

async function retellGet(path, key) {
  const retellResponse = await fetch(`${RETELL_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(9000),
  });
  const body = await retellResponse.json().catch(() => null);
  return { status: retellResponse.status, ok: retellResponse.ok, body };
}

async function retellSend(path, key, method, payload) {
  const retellResponse = await fetch(`${RETELL_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });
  const body = await retellResponse.json().catch(() => null);
  return { status: retellResponse.status, ok: retellResponse.ok, body };
}

/*
 * Repairs two operator-entry mistakes on the booking tool: a two-minute timeout
 * typed with an extra zero, and a leading space in the URL. Everything else in
 * the tool — headers included — is carried through untouched, so the shared
 * secret is preserved without this code ever reading it.
 */
function repairTools(tools) {
  const changes = [];
  const repaired = tools.map((tool) => {
    if (tool.type !== 'custom') return tool;
    const next = { ...tool };

    if (typeof next.url === 'string' && next.url !== next.url.trim()) {
      changes.push({ tool: next.name, field: 'url', from: JSON.stringify(next.url), to: JSON.stringify(next.url.trim()) });
      next.url = next.url.trim();
    }
    if (next.timeout_ms != null && next.timeout_ms > 20000) {
      changes.push({ tool: next.name, field: 'timeout_ms', from: next.timeout_ms, to: 12000 });
      next.timeout_ms = 12000;
    }
    return next;
  });
  return { repaired, changes };
}

function summariseTool(tool) {
  const summary = {
    type: tool.type,
    name: tool.name || null,
  };
  if (tool.type === 'custom') {
    summary.url = tool.url || null;
    summary.timeout_ms = tool.timeout_ms ?? null;
    summary.response_variables = Boolean(tool.response_variables);
    summary.speak_during_execution = tool.speak_during_execution ?? null;
    summary.speak_after_execution = tool.speak_after_execution ?? null;
    summary.execution_message_description = tool.execution_message_description || null;
    // Never echo header values; the tool key lives in there.
    summary.header_names = tool.headers ? Object.keys(tool.headers) : [];
    summary.args_at_root = tool.args_at_root ?? null;
    summary.parameter_keys = tool.parameters && tool.parameters.properties
      ? Object.keys(tool.parameters.properties)
      : [];
    summary.required_parameters = (tool.parameters && tool.parameters.required) || [];
  }
  return summary;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return send(response, 405, { error: 'method_not_allowed' });
  }
  if (!isAuthorized(request)) {
    return send(response, 401, { error: 'unauthorized' });
  }

  const key = process.env.RETELL_API_KEY;
  if (!key) return send(response, 503, { error: 'retell_key_missing' });

  let body = {};
  try {
    if (request.body && typeof request.body === 'object') body = request.body;
    else if (typeof request.body === 'string' && request.body) body = JSON.parse(request.body);
  } catch {
    return send(response, 400, { error: 'invalid_request_body' });
  }

  /*
   * Replace the agent's system prompt from the repository copy. Hand-pasting
   * has already produced drift between agent-prompt.md and what is actually
   * live; this keeps the file as the single source of truth.
   */
  if (body.action === 'set_prompt') {
    if (body.confirm !== true) return send(response, 400, { error: 'confirmation_required' });
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    if (prompt.length < 2000) {
      return send(response, 400, { error: 'prompt_too_short', characters: prompt.length });
    }
    try {
      const agent = await retellGet(`/get-agent/${ARDEN_AGENT_ID}`, key);
      if (!agent.ok) return send(response, 200, { success: false, error: `get_agent_failed_${agent.status}` });
      const engine = (agent.body || {}).response_engine || {};
      if (engine.type !== 'retell-llm' || !engine.llm_id) {
        return send(response, 200, { success: false, error: 'unsupported_response_engine' });
      }

      const before = await retellGet(`/get-retell-llm/${engine.llm_id}`, key);
      const previousCharacters = ((before.body || {}).general_prompt || '').length;

      const update = await retellSend(
        `/update-retell-llm/${engine.llm_id}`,
        key,
        'PATCH',
        { general_prompt: prompt },
      );
      const result = {
        success: update.ok,
        previous_characters: previousCharacters,
        new_characters: prompt.length,
        update_status: update.status,
        published: false,
      };
      if (!update.ok) {
        result.detail = JSON.stringify(update.body || {}).slice(0, 300);
        return send(response, 200, result);
      }
      if (body.publish === true) {
        const publish = await retellSend(`/publish-agent/${ARDEN_AGENT_ID}`, key, 'POST');
        result.published = publish.ok;
        result.publish_status = publish.status;
        if (!publish.ok) result.success = false;
      }
      return send(response, 200, result);
    } catch (error) {
      return send(response, 502, { error: 'retell_unreachable', detail: String(error && error.message).slice(0, 120) });
    }
  }

  if (body.action === 'apply_fixes') {
    if (body.confirm !== true) {
      return send(response, 400, { error: 'confirmation_required' });
    }
    try {
      const agent = await retellGet(`/get-agent/${ARDEN_AGENT_ID}`, key);
      if (!agent.ok) {
        return send(response, 200, { success: false, error: `get_agent_failed_${agent.status}` });
      }
      const engine = (agent.body || {}).response_engine || {};
      if (engine.type !== 'retell-llm' || !engine.llm_id) {
        return send(response, 200, { success: false, error: 'unsupported_response_engine', engine });
      }

      const llm = await retellGet(`/get-retell-llm/${engine.llm_id}`, key);
      if (!llm.ok) {
        return send(response, 200, { success: false, error: `get_retell_llm_failed_${llm.status}` });
      }

      const tools = Array.isArray((llm.body || {}).general_tools) ? llm.body.general_tools : [];
      const { repaired, changes } = repairTools(tools);

      const result = { success: true, changes, applied: false, published: false };

      if (changes.length) {
        const update = await retellSend(
          `/update-retell-llm/${engine.llm_id}`,
          key,
          'PATCH',
          { general_tools: repaired },
        );
        result.applied = update.ok;
        result.update_status = update.status;
        if (!update.ok) {
          result.success = false;
          result.update_detail = JSON.stringify(update.body || {}).slice(0, 300);
          return send(response, 200, result);
        }
      }

      if (body.publish === true) {
        const publish = await retellSend(`/publish-agent/${ARDEN_AGENT_ID}`, key, 'POST');
        result.publish_status = publish.status;
        result.published = publish.ok;
        if (!publish.ok) {
          result.success = false;
          result.publish_detail = JSON.stringify(publish.body || {}).slice(0, 300);
        }
      }

      return send(response, 200, result);
    } catch (error) {
      return send(response, 502, { error: 'retell_unreachable', detail: String(error && error.message).slice(0, 120) });
    }
  }

  try {
    // Inspect a specific published version, not just the working draft.
    const versionSuffix = Number.isInteger(body.version) ? `?version=${body.version}` : '';
    const agent = await retellGet(`/get-agent/${ARDEN_AGENT_ID}${versionSuffix}`, key);
    if (!agent.ok) {
      return send(response, 200, {
        success: false,
        error: `get_agent_failed_${agent.status}`,
        detail: JSON.stringify(agent.body || {}).slice(0, 300),
      });
    }

    const a = agent.body || {};
    const engine = a.response_engine || {};
    const report = {
      success: true,
      agent: {
        agent_id: a.agent_id,
        agent_name: a.agent_name,
        version: a.version,
        is_published: a.is_published ?? null,
        language: a.language,
        voice_id: a.voice_id,
        response_engine_type: engine.type || null,
      },
    };

    if (engine.type === 'retell-llm' && engine.llm_id) {
      const llm = await retellGet(`/get-retell-llm/${engine.llm_id}`, key);
      if (llm.ok) {
        const l = llm.body || {};
        const tools = Array.isArray(l.general_tools) ? l.general_tools : [];
        report.llm = {
          llm_id: l.llm_id,
          model: l.model,
          version: l.version,
          prompt_characters: (l.general_prompt || '').length,
          // Fingerprints that tell us which revision of the prompt is live.
          prompt_has_pronunciation_section: /bluerook dot C-O/.test(l.general_prompt || ''),
          prompt_has_never_speak_section: /Never speak these aloud/.test(l.general_prompt || ''),
          prompt_still_has_raw_email: /hatim@bluerook\.co/.test(l.general_prompt || ''),
          tools: tools.map(summariseTool),
        };
      } else {
        report.llm_error = `get_retell_llm_failed_${llm.status}`;
      }
    } else {
      report.note = 'Response engine is not a retell-llm; prompt lives elsewhere.';
      report.response_engine = engine;
    }

    /*
     * Ground truth for "what does a caller actually get". The newest agent
     * version is a draft; the phone number serves whichever version is
     * published, so ask the number itself rather than inferring.
     */
    const numbers = await retellGet('/list-phone-numbers', key);
    if (numbers.ok && Array.isArray(numbers.body)) {
      report.phone_numbers = numbers.body.map((n) => ({
        number: n.phone_number,
        inbound_agent_id: n.inbound_agent_id || null,
        inbound_agent_version: n.inbound_agent_version ?? null,
        outbound_agent_id: n.outbound_agent_id || null,
      }));
    } else {
      report.phone_numbers_error = `list_phone_numbers_failed_${numbers.status}`;
    }

    const versions = await retellGet(`/get-agent-versions/${ARDEN_AGENT_ID}`, key);
    if (versions.ok && Array.isArray(versions.body)) {
      report.versions = versions.body
        .map((v) => ({ version: v.version, is_published: v.is_published ?? null }))
        .sort((a, b) => b.version - a.version)
        .slice(0, 6);
      const published = report.versions.filter((v) => v.is_published).map((v) => v.version);
      report.published_versions = published;
    } else {
      report.versions_error = `get_agent_versions_failed_${versions.status}`;
    }

    return send(response, 200, report);
  } catch (error) {
    return send(response, 502, { error: 'retell_unreachable', detail: String(error && error.message).slice(0, 120) });
  }
};
