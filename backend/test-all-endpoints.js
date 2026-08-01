// Auto-testing script for all API endpoints
// Tests connectivity, response codes, and basic response shape
// Run: node test-all-endpoints.js

import http from 'http';

const BASE = 'http://localhost:3000/api/v1';
let accessToken = null;
let testUserId = null;
let testItemId = null;

const results = [];
let pass = 0;
let fail = 0;

function logResult(name, status, code, note = '') {
  const ok = status === 'PASS';
  if (ok) pass++; else fail++;
  results.push({ name, status, code, note });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [${status}] ${name} → HTTP ${code} ${note}`);
}

function request(method, path, body = null, headers = {}, isMultipart = false) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { ...headers },
      timeout: 10000,
    };

    let payload = null;
    if (body && !isMultipart) {
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
  console.log('\n=== AUTO-TESTING ALL API ENDPOINTS ===\n');
  const ts = Date.now();
  const testEmail = `test_${ts}@example.com`;

  // 1. POST /user/register
  let r = await request('POST', '/user/register', {
    name: 'Test User',
    email: testEmail,
    password: 'TestPass123!',
  });
  if (r.status === 201 || r.status === 200) {
    accessToken = r.body?.accessToken;
    testUserId = r.body?.user?.id;
    logResult('POST /user/register', 'PASS', r.status, `userId=${testUserId}`);
  } else {
    logResult('POST /user/register', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));
  }

  // 2. POST /user/login
  r = await request('POST', '/user/login', { email: testEmail, password: 'TestPass123!' });
  if (r.status === 200 && r.body?.accessToken) {
    accessToken = r.body.accessToken;
    logResult('POST /user/login', 'PASS', r.status, 'token received');
  } else {
    logResult('POST /user/login', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));
  }

  // 3. POST /user/login (wrong password)
  r = await request('POST', '/user/login', { email: testEmail, password: 'wrong' });
  if (r.status === 401) logResult('POST /user/login (wrong pw)', 'PASS', r.status, 'correctly rejected');
  else logResult('POST /user/login (wrong pw)', 'FAIL', r.status, 'should be 401');

  const auth = { Authorization: `Bearer ${accessToken}` };

  // 4. POST /profile/upload/profile
  r = await request('POST', '/profile/upload/profile', {
    heightCm: 175, weightKg: 70, age: 28, gender: 'male', skinTone: 'warm',
  }, auth);
  if (r.status === 200 || r.status === 201) logResult('POST /profile/upload/profile', 'PASS', r.status);
  else logResult('POST /profile/upload/profile', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 5. PUT /profile/update/profile
  r = await request('PUT', '/profile/update/profile', {
    heightCm: 176, weightKg: 71, age: 29, gender: 'male', skinTone: 'cool',
  }, auth);
  if (r.status === 200) logResult('PUT /profile/update/profile', 'PASS', r.status);
  else logResult('PUT /profile/update/profile', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 6. GET /profile/get/profile
  r = await request('GET', '/profile/get/profile', null, auth);
  if (r.status === 200 && r.body?.userId) logResult('GET /profile/get/profile', 'PASS', r.status);
  else logResult('GET /profile/get/profile', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 7. POST /wardrobe/add/item
  r = await request('POST', '/wardrobe/add/item', {
    name: 'Blue T-shirt', category: 'top', color: 'blue', formality: 'casual',
  }, auth);
  if (r.status === 201 || r.status === 200) {
    testItemId = r.body?.item?._id || r.body?._id;
    logResult('POST /wardrobe/add/item', 'PASS', r.status, `itemId=${testItemId}`);
  } else {
    logResult('POST /wardrobe/add/item', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));
  }

  // 8. GET /wardrobe/get/wardrobe
  r = await request('GET', '/wardrobe/get/wardrobe', null, auth);
  if (r.status === 200) logResult('GET /wardrobe/get/wardrobe', 'PASS', r.status);
  else logResult('GET /wardrobe/get/wardrobe', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 9. GET /wardrobe/get/suggestions
  r = await request('GET', '/wardrobe/get/suggestions', null, auth);
  if (r.status === 200 || r.status === 404) logResult('GET /wardrobe/get/suggestions', 'PASS', r.status, r.status === 404 ? '(empty wardrobe)' : '');
  else logResult('GET /wardrobe/get/suggestions', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 10. GET /wardrobe/api/suggestions/occasion
  r = await request('GET', '/wardrobe/api/suggestions/occasion?occasion=office', null, auth);
  if (r.status === 200 || r.status === 404) logResult('GET /wardrobe/api/suggestions/occasion', 'PASS', r.status);
  else logResult('GET /wardrobe/api/suggestions/occasion', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 11. POST /scan/outfit (no file - should 400)
  r = await request('POST', '/scan/outfit', {}, auth);
  if (r.status === 400) logResult('POST /scan/outfit (no file)', 'PASS', r.status, 'correctly rejected');
  else logResult('POST /scan/outfit (no file)', 'FAIL', r.status, 'should be 400');

  // 12. POST /agent/chat (no message - should 400)
  r = await request('POST', '/agent/chat', { userId: testUserId }, auth);
  if (r.status === 400) logResult('POST /agent/chat (no msg)', 'PASS', r.status, 'correctly rejected');
  else logResult('POST /agent/chat (no msg)', 'FAIL', r.status, 'should be 400');

  // 13. GET /suggestion/get/occasion/suggestions
  r = await request('GET', '/suggestion/get/occasion/suggestions?occasion=office', null, auth);
  if (r.status === 200 || r.status === 404) logResult('GET /suggestion/get/occasion/suggestions', 'PASS', r.status);
  else logResult('GET /suggestion/get/occasion/suggestions', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 14. GET /suggestion/get/daily/recommendations
  r = await request('GET', '/suggestion/get/daily/recommendations', null, auth);
  if (r.status === 200 || r.status === 404) logResult('GET /suggestion/get/daily/recommendations', 'PASS', r.status);
  else logResult('GET /suggestion/get/daily/recommendations', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 15. GET /suggestion/get/shopping
  r = await request('GET', '/suggestion/get/shopping', null, auth);
  if (r.status === 200 || r.status === 404) logResult('GET /suggestion/get/shopping', 'PASS', r.status);
  else logResult('GET /suggestion/get/shopping', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 16. GET /progress/get/progress
  r = await request('GET', '/progress/get/progress', null, auth);
  if (r.status === 200) logResult('GET /progress/get/progress', 'PASS', r.status);
  else logResult('GET /progress/get/progress', 'FAIL', r.status, JSON.stringify(r.body).slice(0, 100));

  // 17. POST /outfit/rate (no imageUrl - should 400)
  r = await request('POST', '/outfit/rate', {}, auth);
  if (r.status === 400) logResult('POST /outfit/rate (no imageUrl)', 'PASS', r.status, 'correctly rejected');
  else logResult('POST /outfit/rate (no imageUrl)', 'FAIL', r.status, 'should be 400');

  // 18. POST /outfit/rate-saved (no items - should 400)
  r = await request('POST', '/outfit/rate-saved', {}, auth);
  if (r.status === 400) logResult('POST /outfit/rate-saved (no items)', 'PASS', r.status, 'correctly rejected');
  else logResult('POST /outfit/rate-saved (no items)', 'FAIL', r.status, 'should be 400');

  // 19. Auth check - no token (should 401)
  r = await request('GET', '/profile/get/profile');
  if (r.status === 401) logResult('GET /profile/get/profile (no auth)', 'PASS', r.status, 'correctly rejected');
  else logResult('GET /profile/get/profile (no auth)', 'FAIL', r.status, 'should be 401');

  console.log('\n=== SUMMARY ===');
  console.log(`Total: ${pass + fail} | Passed: ${pass} | Failed: ${fail}`);
  console.log('========================\n');
  process.exit(fail > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});