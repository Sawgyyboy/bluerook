const { timingSafeEqual } = require('node:crypto');

/*
 * Arden's scheduling backend, on Google Calendar.
 *
 * Replaces the Calendly bridge, whose Scheduling API is paid-plan only. The
 * external contract is unchanged: same two function names, same argument
 * schemas, same response shapes, so the Retell configuration and the agent
 * prompt did not have to change.
 *
 * Google gives free/busy and event creation but no notion of bookable slots,
 * so the working-hours grid Calendly used to own is defined here.
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_URL = 'https://www.googleapis.com/calendar/v3';

// Bookable window, expressed in the business timezone below.
const BUSINESS_TIMEZONE = 'Africa/Casablanca';
const WORKING_DAYS = [1, 2, 3, 4, 5]; // Monday to Friday
const WORKING_START_MINUTES = 9 * 60;
const WORKING_END_MINUTES = 18 * 60;
const SLOT_MINUTES = 30;
const MINIMUM_NOTICE_MINUTES = 60;

const MAX_AVAILABILITY_DAYS = 31;
const MAX_RETURNED_SLOTS = 5;
const EVENT_SUMMARY = 'Bluerook strategy call';

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

async function readBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return request.body ? JSON.parse(request.body) : {};
  let raw = '';
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function getConfiguration() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!clientId || !clientSecret || !refreshToken || !calendarId) return null;
  return { clientId, clientSecret, refreshToken, calendarId };
}

/* Access tokens last an hour; a warm instance should not re-mint per request. */
let cachedToken = null;

async function getAccessToken(configuration) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.value;
  }
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      refresh_token: configuration.refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(9000),
  });
  const payload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !payload.access_token) {
    const error = new Error('google_token_refresh_failed');
    error.status = tokenResponse.status;
    error.detail = payload;
    throw error;
  }
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
  };
  return cachedToken.value;
}

async function calendarRequest(path, token, options = {}) {
  return fetch(`${GOOGLE_CALENDAR_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(9000),
  });
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

/*
 * Speech-ready: no "GMT+1" for the agent to read aloud as "G M T plus one".
 * The caller's timezone is named in words by the prompt instead.
 */
function formatSlot(isoTime, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoTime));
}

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/*
 * Where an instant falls in the business timezone. Derived through Intl rather
 * than fixed offsets so the grid stays correct across DST changes — Morocco
 * shifts around Ramadan, which a hardcoded +01:00 would get wrong.
 */
function businessLocalParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIMEZONE,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    weekday: WEEKDAY_INDEX[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function isWithinWorkingHours(date) {
  const { weekday, minutes } = businessLocalParts(date);
  if (!WORKING_DAYS.includes(weekday)) return false;
  return minutes >= WORKING_START_MINUTES && minutes + SLOT_MINUTES <= WORKING_END_MINUTES;
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}

function normalizeText(value, maxLength) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text && text.length <= maxLength ? text : null;
}

async function getBusyPeriods(configuration, token, from, to) {
  const busyResponse = await calendarRequest('/freeBusy', token, {
    method: 'POST',
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: [{ id: configuration.calendarId }],
    }),
  });
  if (!busyResponse.ok) {
    const error = new Error('google_freebusy_failed');
    error.status = busyResponse.status;
    error.detail = await busyResponse.json().catch(() => null);
    throw error;
  }
  const payload = await busyResponse.json();
  const calendar = (payload.calendars || {})[configuration.calendarId] || {};
  return (calendar.busy || []).map((period) => ({
    start: new Date(period.start).getTime(),
    end: new Date(period.end).getTime(),
  }));
}

function overlapsBusy(startMs, busyPeriods) {
  const endMs = startMs + SLOT_MINUTES * 60000;
  return busyPeriods.some((period) => startMs < period.end && endMs > period.start);
}

/* Round up to the next :00 or :30 boundary. */
function alignToSlot(ms) {
  const step = SLOT_MINUTES * 60000;
  return Math.ceil(ms / step) * step;
}

function buildSlots(from, to, busyPeriods, limit) {
  const earliest = Date.now() + MINIMUM_NOTICE_MINUTES * 60000;
  let cursor = alignToSlot(Math.max(from.getTime(), earliest));
  const end = to.getTime();
  const slots = [];

  while (cursor < end && slots.length < limit) {
    const candidate = new Date(cursor);
    if (isWithinWorkingHours(candidate) && !overlapsBusy(cursor, busyPeriods)) {
      slots.push(candidate.toISOString());
    }
    cursor += SLOT_MINUTES * 60000;
  }
  return slots;
}

function validateAvailabilityWindow(args) {
  const startTime = parseDate(args.start_time);
  const endTime = parseDate(args.end_time);
  const timezone = String(args.timezone || '');

  if (!startTime || !endTime || endTime <= startTime) return null;
  if (!isValidTimezone(timezone)) return null;
  if ((endTime.getTime() - startTime.getTime()) / 86400000 > MAX_AVAILABILITY_DAYS) return null;
  if (endTime.getTime() < Date.now() - 60000) return null;

  return { startTime, endTime, timezone };
}

async function checkAvailability(args, configuration, token) {
  const window = validateAvailabilityWindow(args);
  if (!window) {
    return {
      status: 400,
      payload: {
        success: false,
        error: 'invalid_availability_request',
        message: 'Use valid UTC start and end times no more than 31 days apart, plus an IANA timezone.',
      },
    };
  }

  const busyPeriods = await getBusyPeriods(configuration, token, window.startTime, window.endTime);
  const slots = buildSlots(window.startTime, window.endTime, busyPeriods, MAX_RETURNED_SLOTS).map(
    (isoTime) => ({
      start_time_utc: isoTime,
      spoken_time: formatSlot(isoTime, window.timezone),
      timezone: window.timezone,
    }),
  );

  /*
   * The agent has no reliable clock. Without this it labelled today's slots as
   * "tomorrow" and told a caller that 1pm tomorrow was unavailable when it was
   * free. Dates are supplied here so the agent never has to guess one.
   */
  const dayName = (offsetDays) => new Intl.DateTimeFormat('en-US', {
    timeZone: window.timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(Date.now() + offsetDays * 86400000));

  return {
    status: 200,
    payload: {
      success: true,
      timezone: window.timezone,
      today: dayName(0),
      tomorrow: dayName(1),
      slots,
      message: slots.length
        ? 'Offer no more than three of these exact slots and ask the caller to choose one. State each slot using its own spoken_time; do not relabel one as today or tomorrow.'
        : 'No matching times are available in this range. Ask for another date range.',
    },
  };
}

async function bookAppointment(args, call, configuration, token) {
  const name = normalizeText(args.name, 120);
  const email = normalizeEmail(args.email);
  const timezone = String(args.timezone || '');
  const startTime = parseDate(args.start_time);

  if (!name || !email || !startTime || !isValidTimezone(timezone) || args.confirmed !== true) {
    return {
      status: 400,
      payload: {
        success: false,
        error: 'booking_details_not_confirmed',
        message: 'Name, valid email, IANA timezone, exact start time, and confirmed=true are required.',
      },
    };
  }

  const startMs = startTime.getTime();
  const endTime = new Date(startMs + SLOT_MINUTES * 60000);

  // The agent must not invent a time outside the bookable grid.
  if (!isWithinWorkingHours(startTime) || startMs < Date.now() + MINIMUM_NOTICE_MINUTES * 60000) {
    return {
      status: 409,
      payload: {
        success: false,
        error: 'slot_not_bookable',
        message: 'That time is outside bookable hours. Check availability again and offer another slot.',
      },
    };
  }

  // Re-check immediately before writing, so a slot taken mid-conversation loses.
  const busyPeriods = await getBusyPeriods(configuration, token, startTime, endTime);
  if (overlapsBusy(startMs, busyPeriods)) {
    return {
      status: 409,
      payload: {
        success: false,
        error: 'slot_no_longer_available',
        message: 'That time is no longer available. Check availability again and offer another slot.',
      },
    };
  }

  if (args.dry_run === true) {
    return {
      status: 200,
      payload: {
        success: true,
        dry_run: true,
        booking_status: 'would_book',
        start_time_utc: startTime.toISOString(),
        spoken_time: formatSlot(startTime.toISOString(), timezone),
        timezone,
        invitee_email: email,
        message: 'Slot is free and bookable. No event was created.',
      },
    };
  }

  const company = normalizeText(args.company, 160);
  const bottleneck = normalizeText(args.bottleneck, 600);
  const callId = normalizeText(call && call.call_id, 100);

  const description = [
    'Booked by Arden, Bluerook’s AI voice concierge.',
    `Caller: ${name} <${email}>`,
    company ? `Company: ${company}` : null,
    bottleneck ? `Stated bottleneck: ${bottleneck}` : null,
    callId ? `Retell call id: ${callId}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const event = {
    summary: `${EVENT_SUMMARY} — ${name}`,
    description,
    start: { dateTime: startTime.toISOString(), timeZone: timezone },
    end: { dateTime: endTime.toISOString(), timeZone: timezone },
    attendees: [{ email, displayName: name }],
    reminders: { useDefault: true },
    conferenceData: {
      createRequest: {
        requestId: `bluerook-${callId || Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const createResponse = await calendarRequest(
    `/calendars/${encodeURIComponent(configuration.calendarId)}/events?sendUpdates=all&conferenceDataVersion=1`,
    token,
    { method: 'POST', body: JSON.stringify(event) },
  );

  if (!createResponse.ok) {
    const detail = await createResponse.json().catch(() => null);
    if (args.diagnose === true) {
      return {
        status: 200,
        payload: {
          success: false,
          diagnose: true,
          error: 'google_event_create_failed',
          upstream_status: createResponse.status,
          upstream_body: JSON.stringify(detail || {}).slice(0, 600),
        },
      };
    }
    const error = new Error('google_event_create_failed');
    error.status = createResponse.status;
    error.detail = detail;
    throw error;
  }

  const created = await createResponse.json();

  return {
    status: 201,
    payload: {
      success: true,
      booking_status: 'confirmed',
      start_time_utc: startTime.toISOString(),
      spoken_time: formatSlot(startTime.toISOString(), timezone),
      timezone,
      invitee_email: email,
      meeting_link: created.hangoutLink || null,
      event_link: created.htmlLink || null,
      message: 'The appointment is confirmed. Repeat the time, timezone, and email address to the caller.',
    },
  };
}

async function verifySetup(configuration) {
  const report = {
    success: true,
    present: {
      GOOGLE_OAUTH_CLIENT_ID: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
      GOOGLE_OAUTH_CLIENT_SECRET: Boolean(process.env.GOOGLE_OAUTH_CLIENT_SECRET),
      GOOGLE_OAUTH_REFRESH_TOKEN: Boolean(process.env.GOOGLE_OAUTH_REFRESH_TOKEN),
      GOOGLE_CALENDAR_ID: Boolean(process.env.GOOGLE_CALENDAR_ID),
    },
    working_hours: {
      timezone: BUSINESS_TIMEZONE,
      days: 'Mon-Fri',
      from: '09:00',
      to: '18:00',
      slot_minutes: SLOT_MINUTES,
      minimum_notice_minutes: MINIMUM_NOTICE_MINUTES,
    },
  };

  if (!configuration) {
    report.success = false;
    report.error = 'google_calendar_unconfigured';
    return { status: 200, payload: report };
  }

  let token;
  try {
    token = await getAccessToken(configuration);
    report.token_refresh_ok = true;
  } catch (error) {
    report.success = false;
    report.token_refresh_ok = false;
    report.error = 'google_token_refresh_failed';
    report.detail = JSON.stringify(error.detail || {}).slice(0, 300);
    return { status: 200, payload: report };
  }

  const calendarResponse = await calendarRequest(
    `/calendars/${encodeURIComponent(configuration.calendarId)}`,
    token,
  );
  if (calendarResponse.ok) {
    const calendar = await calendarResponse.json();
    report.calendar = { summary: calendar.summary, timezone: calendar.timeZone };
  } else {
    report.success = false;
    report.error = `calendar_read_failed_${calendarResponse.status}`;
    return { status: 200, payload: report };
  }

  const from = new Date(Date.now() + 3600000);
  const to = new Date(from.getTime() + 7 * 86400000);
  const busyPeriods = await getBusyPeriods(configuration, token, from, to);
  report.busy_blocks_next_7_days = busyPeriods.length;
  report.bookable_slots_next_7_days = buildSlots(from, to, busyPeriods, 500).length;
  if (report.bookable_slots_next_7_days === 0) report.success = false;

  return { status: 200, payload: report };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return send(response, 405, { error: 'method_not_allowed' });
  }
  if (!isAuthorized(request)) {
    return send(response, 401, { error: 'unauthorized' });
  }

  let body;
  try {
    body = await readBody(request);
  } catch {
    return send(response, 400, { error: 'invalid_request_body' });
  }

  const configuration = getConfiguration();

  if (body && body.name === 'verify_calendar_setup') {
    try {
      const result = await verifySetup(configuration);
      return send(response, result.status, result.payload);
    } catch {
      return send(response, 502, { error: 'calendar_verification_failed' });
    }
  }

  if (!configuration) {
    return send(response, 503, { error: 'calendar_unconfigured' });
  }

  try {
    const name = body.name;
    const args = body.args && typeof body.args === 'object' ? body.args : body;
    const token = await getAccessToken(configuration);

    if (name === 'check_strategy_call_availability') {
      const result = await checkAvailability(args, configuration, token);
      return send(response, result.status, result.payload);
    }

    if (name === 'book_strategy_call') {
      const result = await bookAppointment(args, body.call, configuration, token);
      return send(response, result.status, result.payload);
    }

    return send(response, 400, { error: 'unsupported_function' });
  } catch (error) {
    const upstreamStatus = Number(error && error.status);
    if (upstreamStatus === 401 || upstreamStatus === 403) {
      return send(response, 503, { error: 'calendar_authorization_failed' });
    }
    return send(response, 502, { error: 'calendar_temporarily_unavailable' });
  }
};
