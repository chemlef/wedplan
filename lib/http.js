export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new HttpError(status, message); };

const MAX_BODY = 4 * 1024 * 1024;

export async function readJson(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return {};
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) fail(413, 'Request is too large');
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { fail(400, 'Invalid JSON'); }
}

export function send(res, status, body, headers = {}) {
  const isText = typeof body === 'string';
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', isText ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', res.getHeader('Cache-Control') || 'no-store');
  res.end(isText ? body : JSON.stringify(body));
}

export function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name, value, { maxAge, secure } = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax`;
  if (maxAge !== undefined) c += `; Max-Age=${maxAge}`;
  if (secure) c += '; Secure';
  return c;
}

export function appUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}
