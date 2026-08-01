// Diagnostic: capture the full error from the chat endpoint
import http from 'http';

const BASE = 'http://localhost:3000/api/v1';
let accessToken = null;
let userId = null;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
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
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (err) => resolve({ status: 0, body: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const ts = Date.now();
  // Register
  let r = await request('POST', '/user/register', {
    name: 'Debug User',
    email: `debug_${ts}@example.com`,
    password: 'TestPass123!',
  });
  try {
    const parsed = JSON.parse(r.body);
    accessToken = parsed.accessToken;
    userId = parsed.user?.id;
  } catch (e) { console.log('Register raw:', r.body.slice(0, 300)); }

  if (!accessToken) {
    r = await request('POST', '/user/login', { email: `debug_${ts}@example.com`, password: 'TestPass123!' });
    try {
      const parsed = JSON.parse(r.body);
      accessToken = parsed.accessToken;
      userId = parsed.user?.id;
    } catch (e) { console.log('Login raw:', r.body.slice(0, 300)); }
  }

  console.log('userId:', userId);
  console.log('accessToken:', accessToken ? 'OK' : 'MISSING');

  const auth = { Authorization: `Bearer ${accessToken}` };

  // Send chat
  console.log('\n--- Sending chat message ---');
  r = await request('POST', '/agent/chat', { userId, message: 'Hello, what should I wear today?' }, auth);
  console.log('Status:', r.status);
  console.log('Full body (first 2000 chars):\n', r.body.slice(0, 2000));
}

main().catch((e) => console.error('Crash:', e));