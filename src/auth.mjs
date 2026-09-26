import { createHmac, randomBytes, scryptSync, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export const SESSION_SECONDS = 60 * 60 * 24 * 30;
const permissions = { reader: new Set(['reply:create']), visitor: new Set() };
export function can(session, appId, permission) {
  return Boolean(session && session.appId === appId && permissions[session.role]?.has(permission));
}
export function createAuth(apps, secret) {
  const prepared = new Map([...apps].map(([id, app]) => {
    const salt = randomBytes(16);
    return [id, { salt, hash: scryptSync(app.code, salt, 32), version: createHmac('sha256', secret).update(`${id}:${app.code}`).digest('hex') }];
  }));
  const sign = data => createHmac('sha256', secret).update(data).digest('base64url');
  return {
    async checkCode(id, code) {
      const entry = prepared.get(id);
      if (!entry || typeof code !== 'string' || code.length > 100) return false;
      const hash = await derive(code.trim(), entry.salt, 32);
      return timingSafeEqual(hash, entry.hash);
    },
    issue(id, now = Date.now()) {
      const data = Buffer.from(JSON.stringify({ appId: id, role: 'reader', version: prepared.get(id).version, exp: Math.floor(now / 1000) + SESSION_SECONDS })).toString('base64url');
      return `${data}.${sign(data)}`;
    },
    verify(id, token, now = Date.now()) {
      try {
        if (typeof token !== 'string' || token.length > 2048) return null;
        const pieces = token.split('.');
        if (pieces.length !== 2) return null;
        const [data, signature] = pieces;
        const expected = Buffer.from(sign(data));
        const received = Buffer.from(signature);
        if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
        const session = JSON.parse(Buffer.from(data, 'base64url').toString());
        if (session.appId !== id || session.role !== 'reader' || session.version !== prepared.get(id)?.version || !Number.isFinite(session.exp) || session.exp <= Math.floor(now / 1000)) return null;
        return session;
      } catch { return null; }
    }
  };
}
export const cookieName = id => `aiclab_${id.replaceAll('-', '_')}`;
export function readCookie(header, id) {
  return (header || '').split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName(id)}=`))?.slice(cookieName(id).length + 1);
}
export function sessionCookie(id, token, secure, clear = false) {
  return `${cookieName(id)}=${token}; Path=/api/apps/${id}; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}
