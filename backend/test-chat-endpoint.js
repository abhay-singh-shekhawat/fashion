// Test script for the agentic chat endpoint + real-time socket updates
// Run: node test-chat-endpoint.js
// Prerequisites: server running on PORT (default 3000 per .env)

import http from 'http';
import { io as createSocketClient } from 'socket.io-client';

const BASE = `http://localhost:${process.env.PORT || 3000}/api/v1`;
const CHAT_EVENTS = {
  START: 'chat:start',
  TYPING: 'chat:typing',
  RESPONSE_CHUNK: 'chat:response:chunk',
  RESPONSE_COMPLETE: 'chat:response:complete',
  ERROR: 'chat:error',
};

const results = [];
let pass = 0;
let fail = 0;

function logResult(name, status, note = '') {
  const ok = status === 'PASS';
  if (ok) pass++; else fail++;
  results.push({ name, status, note });
  const icon = ok ? 'PASS' : 'FAIL';
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} ${note}`);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { ...headers },
      timeout: 60000,
    };
    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', (err) => resolve({ status: 0, body: { error: err.message } }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: { error: 'timeout' } }); });
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n=== CHAT ENDPOINT + REAL-TIME TEST ===\n');

  // 1. Register a test user
  const ts = Date.now();
  const testEmail = `chattest_${ts}@example.com`;
  let r = await request('POST', '/user/register', {
    name: 'Chat Test',
    email: testEmail,
    password: 'TestPass123!',
  });

  let accessToken = r.body?.accessToken;
  const userId = r.body?.user?.id;

  if (!accessToken) {
    r = await request('POST', '/user/login', { email: testEmail, password: 'TestPass123!' });
    accessToken = r.body?.accessToken;
  }

  if (!accessToken || !userId) {
    console.log('FAIL | Could not obtain access token / userId', JSON.stringify(r.body).slice(0, 200));
    process.exit(1);
  }
  logResult('Register/Login test user', 'PASS', `userId=${userId}`);

  const auth = { Authorization: `Bearer ${accessToken}` };

  // 2. Connect Socket.IO client to listen for real-time chat events
  const socketUrl = `http://localhost:${process.env.PORT || 3000}`;
  const socket = createSocketClient(socketUrl, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: false,
    timeout: 15000,
  });

  const socketEvents = [];
  let socketConnected = false;

  const socketConnectedPromise = new Promise((resolve) => {
    socket.on('connect', () => { socketConnected = true; resolve(true); });
    socket.on('connect_error', (err) => {
      console.log(`FAIL | Socket.IO connection error: ${err.message}`);
      resolve(false);
    });
  });

  const allEventNames = Object.values(CHAT_EVENTS);
  allEventNames.forEach((evt) => {
    socket.on(evt, (data) => { socketEvents.push({ event: evt, data }); });
  });

  const socketOk = await socketConnectedPromise;
  if (socketOk) {
    logResult('Socket.IO real-time connection', 'PASS');
  } else {
    logResult('Socket.IO real-time connection', 'FAIL', 'Could not connect (JWT_SECRET mismatch likely)');
  }

  // 3. Missing message validation (should 400)
  r = await request('POST', '/agent/chat', { userId }, auth);
  if (r.status === 400) {
    logResult('POST /agent/chat (missing message -> 400)', 'PASS');
  } else {
    logResult('POST /agent/chat (missing message -> 400)', 'FAIL', `got HTTP ${r.status}`);
  }

  // 4. Send a valid chat message
  console.log('\n--- Sending valid chat message (Gemini API call, may take ~10-30s) ---');
  const chatMessage = 'What should I wear for a job interview tomorrow? Keep it short.';
  const chatStartTime = Date.now();

  r = await request('POST', '/agent/chat', { userId, message: chatMessage }, auth);

  const chatDuration = Date.now() - chatStartTime;
  console.log(`Chat request completed in ${chatDuration}ms with HTTP ${r.status}`);

  if (r.status === 200) {
    logResult('POST /agent/chat (valid message -> 200)', 'PASS', `in ${chatDuration}ms`);
  } else if (r.status === 0) {
    logResult('POST /agent/chat (valid message -> 200)', 'FAIL', `network error: ${JSON.stringify(r.body)}`);
  } else {
    logResult('POST /agent/chat (valid message -> 200)', 'FAIL', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
  }

  // 5. Verify the response format
  if (r.status === 200 && r.body) {
    const { userId: respUserId, reply, success } = r.body;
    let fmtOk = typeof respUserId === 'string' && success === true;
    let replyDesc = '';

    if (reply && typeof reply === 'object') {
      const hasMessage = typeof reply.message === 'string';
      const hasText = typeof reply.text === 'string';
      if (hasMessage || hasText) {
        replyDesc = `{message: '${String(reply.message || reply.text).slice(0, 60)}...'}`;
      } else {
        replyDesc = `{keys: ${Object.keys(reply).join(',')}}`;
      }
      fmtOk = fmtOk && (hasMessage || hasText || Object.keys(reply).length > 0);
    } else if (typeof reply === 'string') {
      replyDesc = `{string: '${reply.slice(0, 60)}...'}`;
    } else {
      fmtOk = false;
    }

    if (fmtOk) {
      logResult('Response format {userId, reply, success}', 'PASS', replyDesc);
    } else {
      logResult('Response format {userId, reply, success}', 'FAIL', JSON.stringify(r.body).slice(0, 200));
    }
  } else {
    logResult('Response format {userId, reply, success}', 'FAIL', 'No 200 response body to inspect');
  }

  // 6. Wait for socket events to settle
  console.log('\n--- Waiting for socket events to settle (3s) ---');
  await delay(3000);

  // 7. Verify real-time socket events
  console.log(`\nSocket events captured (${socketEvents.length}):`);
  const eventCounts = {};
  socketEvents.forEach(({ event }) => {
    eventCounts[event] = (eventCounts[event] || 0) + 1;
  });
  allEventNames.forEach((evt) => {
    const c = eventCounts[evt] || 0;
    console.log(`  ${evt}: ${c}${c > 0 ? ' event(s)' : ''}`);
  });

  const expectedEvents = [CHAT_EVENTS.START, CHAT_EVENTS.RESPONSE_CHUNK, CHAT_EVENTS.RESPONSE_COMPLETE];
  const receivedExpected = expectedEvents.filter((evt) => eventCounts[evt] > 0);

  if (socketConnected) {
    if (receivedExpected.length === expectedEvents.length) {
      logResult('Real-time socket events (start, chunk, complete)', 'PASS',
        `received ${receivedExpected.length}/${expectedEvents.length} events`);
    } else {
      logResult('Real-time socket events (start, chunk, complete)', 'FAIL',
        `received ${receivedExpected.length}/${expectedEvents.length}: missing ${expectedEvents.filter(e => !eventCounts[e]).join(', ')}`);
    }

    if (eventCounts[CHAT_EVENTS.RESPONSE_CHUNK] >= 1) {
      logResult('Streaming chunks (word-by-word)', 'PASS', `${eventCounts[CHAT_EVENTS.RESPONSE_CHUNK]} chunks`);
    } else {
      logResult('Streaming chunks (word-by-word)', 'FAIL', 'no chunks received');
    }

    if (eventCounts[CHAT_EVENTS.TYPING] > 0) {
      logResult('Typing indicator events', 'PASS', `${eventCounts[CHAT_EVENTS.TYPING]} event(s)`);
    } else {
      logResult('Typing indicator events', 'FAIL', 'no typing events received');
    }

    const completeEvent = socketEvents.find(({ event }) => event === CHAT_EVENTS.RESPONSE_COMPLETE);
    if (completeEvent) {
      const { fullMessage, model, duration } = completeEvent.data;
      if (typeof fullMessage === 'string' && fullMessage.length > 0 && model && typeof duration === 'number') {
        logResult('Response-complete payload (fullMessage, model, duration)', 'PASS',
          `model=${model}, duration=${duration}ms`);
      } else {
        logResult('Response-complete payload (fullMessage, model, duration)', 'FAIL',
          `payload keys: ${Object.keys(completeEvent.data).join(',')}`);
      }
    }

    if (eventCounts[CHAT_EVENTS.ERROR] > 0) {
      logResult('No error events during successful chat', 'FAIL', `${eventCounts[CHAT_EVENTS.ERROR]} error event(s)`);
    } else {
      logResult('No error events during successful chat', 'PASS');
    }
  }

  socket.disconnect();

  console.log('\n=== SUMMARY ===');
  console.log(`Total: ${pass + fail} | Passed: ${pass} | Failed: ${fail}`);
  console.log('===================\n');

  console.log('\n--- SOCKET EVENT PAYLOADS (for documentation) ---');
  for (const { event, data } of socketEvents.slice(0, 15)) {
    let summary = '';
    if (event === CHAT_EVENTS.RESPONSE_CHUNK) summary = `index=${data?.index} chunk="${String(data?.chunk).slice(0, 30)}"`;
    else if (event === CHAT_EVENTS.RESPONSE_COMPLETE) summary = `len=${data?.fullMessage?.length} model=${data?.model}`;
    else if (event === CHAT_EVENTS.START) summary = `message="${String(data?.message).slice(0, 30)}"`;
    else if (event === CHAT_EVENTS.TYPING) summary = `isTyping=${data?.isTyping}`;
    console.log(`  ${event} -> ${summary}`);
  }

  process.exit(fail > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
