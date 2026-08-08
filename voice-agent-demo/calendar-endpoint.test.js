const assert = require('node:assert/strict');
const handler = require('../api/retell-calendar.js');

process.env.RETELL_CALENDAR_TOOL_SECRET = 'test-secret';
process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client';
process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret-value';
process.env.GOOGLE_OAUTH_REFRESH_TOKEN = 'test-refresh';
process.env.GOOGLE_CALENDAR_ID = 'hatim@bluerook.co';

function createResponse() {
  return {
    headers: {},
    statusCode: 0,
    payload: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

function call(body) {
  const response = createResponse();
  return handler(
    { method: 'POST', headers: { 'x-bluerook-tool-key': 'test-secret' }, body },
    response,
  ).then(() => response);
}

/*
 * A Tuesday well inside working hours, far enough ahead that the minimum-notice
 * rule never trims it. Recomputed per run so the suite does not rot.
 */
function nextTuesdayAt(hourInCasablanca) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7);
  while (date.getUTCDay() !== 2) date.setUTCDate(date.getUTCDate() + 1);
  // Casablanca is UTC+1; expressing the wall-clock hour as UTC-1 keeps it exact.
  date.setUTCHours(hourInCasablanca - 1, 0, 0, 0);
  return date;
}

/* Google's token endpoint plus whatever calendar call the test needs. */
function mockGoogle({ busy = [], createStatus = 200, onCreate } = {}) {
  global.fetch = async (url, options = {}) => {
    const target = String(url);
    if (target.includes('oauth2.googleapis.com/token')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'test-access', expires_in: 3600 }) };
    }
    if (target.includes('/freeBusy')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ calendars: { 'hatim@bluerook.co': { busy } } }),
      };
    }
    if (target.includes('/events')) {
      if (onCreate) onCreate(JSON.parse(options.body), target);
      return {
        ok: createStatus < 400,
        status: createStatus,
        json: async () => (createStatus < 400
          ? { id: 'evt_1', hangoutLink: 'https://meet.google.com/abc-defg-hij', htmlLink: 'https://calendar.google.com/event?eid=x' }
          : { error: { message: 'boom' } }),
      };
    }
    if (target.includes('/calendars/')) {
      return { ok: true, status: 200, json: async () => ({ summary: 'hatim@bluerook.co', timeZone: 'Africa/Casablanca' }) };
    }
    throw new Error(`unexpected fetch: ${target}`);
  };
}

async function testAvailabilityRespectsWorkingHours() {
  mockGoogle();
  const from = new Date(Date.now() + 2 * 86400000);
  const to = new Date(from.getTime() + 5 * 86400000);
  const response = await call({
    name: 'check_strategy_call_availability',
    args: { start_time: from.toISOString(), end_time: to.toISOString(), timezone: 'Africa/Casablanca' },
  });

  assert.equal(response.statusCode, 200);
  assert.ok(response.payload.slots.length > 0, 'expected bookable slots');

  for (const slot of response.payload.slots) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Casablanca', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(slot.start_time_utc));
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    assert.ok(!['Sat', 'Sun'].includes(map.weekday), `weekend slot offered: ${slot.spoken_time}`);
    const hour = Number(map.hour);
    assert.ok(hour >= 9 && hour < 18, `out-of-hours slot offered: ${slot.spoken_time} (${hour}h)`);
  }
}

/* Regression: "GMT+1" was being read aloud as "G M T plus one". */
async function testSpokenTimeIsSpeakable() {
  mockGoogle();
  const from = new Date(Date.now() + 2 * 86400000);
  const response = await call({
    name: 'check_strategy_call_availability',
    args: {
      start_time: from.toISOString(),
      end_time: new Date(from.getTime() + 5 * 86400000).toISOString(),
      timezone: 'Africa/Casablanca',
    },
  });
  const spoken = response.payload.slots[0].spoken_time;
  assert.ok(!/GMT|UTC|[+-]\d/.test(spoken), `spoken_time must be speakable, got "${spoken}"`);
}

async function testBusySlotsAreExcluded() {
  const target = nextTuesdayAt(10);
  mockGoogle({
    busy: [{ start: target.toISOString(), end: new Date(target.getTime() + 30 * 60000).toISOString() }],
  });
  const response = await call({
    name: 'check_strategy_call_availability',
    args: {
      start_time: new Date(target.getTime() - 3600000).toISOString(),
      end_time: new Date(target.getTime() + 6 * 3600000).toISOString(),
      timezone: 'Africa/Casablanca',
    },
  });
  const offered = response.payload.slots.map((s) => s.start_time_utc);
  assert.ok(!offered.includes(target.toISOString()), 'a busy slot was offered');
}

async function testBookingCreatesEventWithAttendee() {
  let sent = null;
  let sentUrl = '';
  mockGoogle({ onCreate: (payload, url) => { sent = payload; sentUrl = url; } });

  const target = nextTuesdayAt(11);
  const response = await call({
    name: 'book_strategy_call',
    call: { call_id: 'call_test' },
    args: {
      name: 'Alex Smith',
      email: 'alex@example.com',
      timezone: 'Africa/Casablanca',
      start_time: target.toISOString(),
      confirmed: true,
    },
  });

  assert.equal(response.statusCode, 201, JSON.stringify(response.payload));
  assert.equal(response.payload.booking_status, 'confirmed');
  // The invite is the whole point; a booking nobody is invited to is a failure.
  assert.deepEqual(sent.attendees.map((a) => a.email), ['alex@example.com']);
  assert.ok(sentUrl.includes('sendUpdates=all'), 'invitation email must be requested');
  assert.ok(response.payload.meeting_link, 'expected a meet link');
}

async function testBookingRefusesUnconfirmed() {
  mockGoogle();
  const response = await call({
    name: 'book_strategy_call',
    args: {
      name: 'Alex Smith',
      email: 'alex@example.com',
      timezone: 'Africa/Casablanca',
      start_time: nextTuesdayAt(11).toISOString(),
      confirmed: false,
    },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, 'booking_details_not_confirmed');
}

async function testBookingRefusesOutsideWorkingHours() {
  mockGoogle();
  const response = await call({
    name: 'book_strategy_call',
    args: {
      name: 'Alex Smith',
      email: 'alex@example.com',
      timezone: 'Africa/Casablanca',
      start_time: nextTuesdayAt(3).toISOString(), // 3am
      confirmed: true,
    },
  });
  assert.equal(response.statusCode, 409);
  assert.equal(response.payload.error, 'slot_not_bookable');
}

async function testBookingLosesRaceToBusySlot() {
  const target = nextTuesdayAt(12);
  mockGoogle({
    busy: [{ start: target.toISOString(), end: new Date(target.getTime() + 30 * 60000).toISOString() }],
  });
  const response = await call({
    name: 'book_strategy_call',
    args: {
      name: 'Alex Smith',
      email: 'alex@example.com',
      timezone: 'Africa/Casablanca',
      start_time: target.toISOString(),
      confirmed: true,
    },
  });
  assert.equal(response.statusCode, 409);
  assert.equal(response.payload.error, 'slot_no_longer_available');
}

async function testAuthorization() {
  const response = createResponse();
  await handler(
    {
      method: 'POST',
      headers: { 'x-bluerook-tool-key': 'wrong-secret' },
      body: { name: 'check_strategy_call_availability', args: {} },
    },
    response,
  );
  assert.equal(response.statusCode, 401);
}

async function run() {
  await testAvailabilityRespectsWorkingHours();
  await testSpokenTimeIsSpeakable();
  await testBusySlotsAreExcluded();
  await testBookingCreatesEventWithAttendee();
  await testBookingRefusesUnconfirmed();
  await testBookingRefusesOutsideWorkingHours();
  await testBookingLosesRaceToBusySlot();
  await testAuthorization();
  console.log('calendar endpoint tests passed (8)');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
