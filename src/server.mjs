import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createApps, BOOK } from './config.mjs';
import { createAuth, can, readCookie, sessionCookie } from './auth.mjs';
import { createLimiter } from './limits.mjs';
import { generateReplies, InputError } from './replies.mjs';

const publicDir = new URL('../public/', import.meta.url);
const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/apps/review-reply', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/mark.svg', ['mark.svg', 'image/svg+xml']]
  ,['/og-image.png', ['og-image.png', 'image/png']]
  ,['/engine/replies.mjs', ['../src/replies.mjs', 'text/javascript; charset=utf-8']]
  ,['/engine/config.mjs', ['../src/config.mjs', 'text/javascript; charset=utf-8']]
]);
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
async function readJson(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new HttpError(415, '입력 형식을 확인해 주세요.');
  if (Number(req.headers['content-length']) > 8192) throw new HttpError(413, '입력 내용이 너무 깁니다.');
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw new HttpError(413, '입력 내용이 너무 깁니다.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, '입력 내용을 다시 확인해 주세요.'); }
}
export function createServer({ apps, secret, origin, limiter = createLimiter() }) {
  const protectedApps = new Map([...apps].filter(([, app]) => app.access !== 'public'));
  if (protectedApps.size && (!secret || secret.length < 32 || [...protectedApps.values()].some(app => !app.code || app.code.length < 12))) throw new Error('Protected apps require a strong secret and app code.');
  const auth = createAuth(protectedApps, secret);
  const expectedOrigin = new URL(origin).origin;
  const secure = expectedOrigin.startsWith('https://');
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cache-Control', 'no-store');
    if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    try {
      if (req.headers.host !== new URL(expectedOrigin).host) throw new HttpError(403, '올바른 앱 주소로 접속해 주세요.');
      const url = new URL(req.url, expectedOrigin);
      if (url.pathname.startsWith('/api/')) {
        const match = url.pathname.match(/^\/api\/apps\/([a-z0-9-]+)\/(session|unlock|reply|logout)$/);
        if (!match || !apps.has(match[1])) throw new HttpError(404, '앱을 찾을 수 없습니다.');
        const [, id, action] = match;
        const app = apps.get(id);
        const publicAccess = app.access === 'public';
        const session = publicAccess ? null : auth.verify(id, readCookie(req.headers.cookie, id));
        if (action === 'session') {
          if (req.method !== 'GET') throw new HttpError(405, '지원하지 않는 요청입니다.');
          const channel = Object.hasOwn(app.channels, url.searchParams.get('channel')) ? url.searchParams.get('channel') : 'general';
          return json(200, { authenticated: !!session, accessible: publicAccess || !!session, access: publicAccess ? 'public' : 'code', app: { id, name: app.name }, channel, guide: app.channels[channel], book: channel === 'book' ? BOOK : null, mode: 'templates' });
        }
        if (req.method !== 'POST') throw new HttpError(405, '지원하지 않는 요청입니다.');
        if (req.headers.origin !== expectedOrigin || req.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, '앱 화면에서 다시 시도해 주세요.');
        if (publicAccess && ['unlock', 'logout'].includes(action)) throw new HttpError(404, '사용하지 않는 기능입니다.');
        const client = req.socket.remoteAddress || 'unknown';
        const limitKey = `${id}:${action}:${client}`;
        if (!limiter.take(limitKey, action === 'unlock' ? 10 : 60, action === 'unlock' ? 15 * 60_000 : 60_000)) {
          res.setHeader('Retry-After', action === 'unlock' ? '900' : '60');
          throw new HttpError(429, action === 'unlock' ? '코드 입력을 여러 번 시도했습니다. 15분 뒤 다시 입력해 주세요.' : '요청이 많습니다. 잠시 후 다시 시도해 주세요.');
        }
        if (action === 'unlock') {
          const body = await readJson(req);
          if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => key !== 'code') || !(await auth.checkCode(id, body.code))) throw new HttpError(401, '이 앱의 이용코드가 맞는지 확인해 주세요.');
          res.setHeader('Set-Cookie', sessionCookie(id, auth.issue(id), secure));
          return json(200, { authenticated: true });
        }
        if (action === 'logout') {
          res.setHeader('Set-Cookie', sessionCookie(id, '', secure, true));
          return json(200, { authenticated: false });
        }
        if (!publicAccess && !can(session, id, 'reply:create')) throw new HttpError(401, '앱 이용코드를 입력해 주세요.');
        const result = generateReplies(await readJson(req));
        return json(200, result);
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new HttpError(405, '지원하지 않는 요청입니다.');
      const asset = staticFiles.get(url.pathname);
      if (!asset) throw new HttpError(404, '페이지를 찾을 수 없습니다.');
      const content = await readFile(new URL(asset[0], publicDir));
      res.writeHead(200, { 'Content-Type': asset[1] });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (res.headersSent || res.destroyed) return;
      json(error instanceof InputError ? 400 : error.status || 500, { error: error instanceof InputError || error instanceof HttpError ? error.message : '잠시 후 다시 시도해 주세요.' });
    }
  });
  server.requestTimeout = 15_000; server.headersTimeout = 10_000; server.maxHeadersCount = 40;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4317);
  const origin = process.env.PUBLIC_ORIGIN || `http://127.0.0.1:${port}`;
  if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) throw new Error('Production requires HTTPS PUBLIC_ORIGIN.');
  const server = createServer({ apps: createApps(process.env), secret: process.env.SESSION_SECRET, origin });
  server.listen(port, '127.0.0.1', () => console.log(`앗싸, 답글! 실행: ${origin}/apps/review-reply?channel=book`));
}
