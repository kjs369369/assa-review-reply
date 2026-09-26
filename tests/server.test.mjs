import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../src/server.mjs';
import { createLimiter } from '../src/limits.mjs';
import { createApps } from '../src/config.mjs';
const base = { review: '잘 먹고 갑니다', menu: '', sentiment: 'positive', tone: 'warm', variant: 0 };
const apps = new Map(['review-reply', 'another-app'].map(id => [id, { id, name: id, code: `${id}-private-code`, channels: { general: { label: 'test' } } }]));
test('public review app works with no cookie or secret, keeps request limits and CSRF protection', async t => {
  const origin = 'http://127.0.0.1:43200';
  const server = createServer({ apps: createApps({}), origin });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const call = (action, method = 'GET', data, requestOrigin = origin) => new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: `/api/apps/review-reply/${action}`, method, headers: { host: '127.0.0.1:43200', origin: requestOrigin, 'content-type': 'application/json' } }, res => {
      const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    req.on('error', reject); req.end(data ? JSON.stringify(data) : undefined);
  });
  const state = await call('session');
  assert.equal(state.body.access, 'public'); assert.equal(state.body.accessible, true); assert.equal(state.body.authenticated, false);
  const result = await call('reply', 'POST', base);
  assert.equal(result.status, 200); assert.equal(result.body.replies.length, 3); assert.equal(result.headers['set-cookie'], undefined);
  assert.equal((await call('unlock', 'POST', { code: 'anything' })).status, 404);
  assert.equal((await call('reply', 'POST', base, 'https://evil.example')).status, 403);
  for (let i = 1; i < 60; i++) assert.equal((await call('reply', 'POST', base)).status, 200);
  assert.equal((await call('reply', 'POST', base)).status, 429);
});
test('HTTP boundaries: unlock, validation, app scope, CSRF, private files, logout, throttling', async t => {
  // Bind first with a temporary origin, then expose requests through the test origin header.
  const origin = 'http://127.0.0.1:43199';
  const server = createServer({ apps, secret: 'server-test-secret-'.repeat(3), origin, limiter: createLimiter() });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = `http://127.0.0.1:${server.address().port}`;
  const call = (path, options = {}) => new Promise((resolve, reject) => {
    const req = http.request(address + path, { method: options.method || 'GET', headers: { host: new URL(origin).host, ...options.headers } }, res => {
      const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => resolve({ status: res.statusCode, headers: { get: name => Array.isArray(res.headers[name]) ? res.headers[name].join(', ') : res.headers[name] }, json: async () => JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    req.on('error', reject); req.end(options.body);
  });
  const post = (action, body, cookie = '', app = 'review-reply', extraHeaders = {}) => call(`/api/apps/${app}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie, ...extraHeaders }, body: JSON.stringify(body) });
  assert.equal((await post('reply', base)).status, 401);
  assert.equal((await post('unlock', { code: 'wrong' })).status, 401);
  assert.equal((await post('unlock', { code: 'review-reply-private-code' }, '', 'review-reply', { Origin: 'https://evil.example' })).status, 403);
  const unlocked = await post('unlock', { code: 'review-reply-private-code' });
  assert.equal(unlocked.status, 200);
  const cookie = unlocked.headers.get('set-cookie').split(';')[0];
  const result = await post('reply', base, cookie);
  assert.equal(result.status, 200); assert.equal((await result.json()).replies.length, 3);
  assert.equal((await post('reply', base, cookie, 'another-app')).status, 401);
  assert.equal((await post('reply', { ...base, menu: '가'.repeat(21) }, cookie)).status, 400);
  assert.equal((await post('reply', { ...base, review: '가'.repeat(4000) }, cookie)).status, 413);
  assert.equal((await post('reply', base, cookie, 'review-reply', { 'Content-Type': 'text/plain' })).status, 415);
  for (const path of ['/.env.local', '/src/config.mjs', '/docs/README.md', '/api/apps/no-such-app/session']) assert.equal((await call(path)).status, 404);
  const page = await call('/apps/review-reply'); assert.equal(page.status, 200); assert.ok(page.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
  const locked = await post('logout', {}, cookie); assert.match(locked.headers.get('set-cookie'), /Max-Age=0/);
  for (let i = 0; i < 8; i++) await post('unlock', { code: 'wrong' });
  assert.equal((await post('unlock', { code: 'wrong' })).status, 429);
  assert.equal((await call('/api/apps/review-reply/session', { headers: { host: 'evil.example' } })).status, 403);
});
