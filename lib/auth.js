import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { db } from './db.js';
import { parseCookies, cookie, fail } from './http.js';
import { MODULES } from './schema.js';

const scrypt = promisify(crypto.scrypt);
const SECRET = process.env.SESSION_SECRET
  || (process.env.TURSO_AUTH_TOKEN && crypto.createHash('sha256').update(`wedplan:${process.env.TURSO_AUTH_TOKEN}`).digest('hex'))
  || 'wedplan-local-development-secret';
const COOKIE = 'wp_session';
const MAX_AGE = 60 * 60 * 24 * 30;

const ALPHA = 'abcdefghijkmnopqrstuvwxyz23456789';
export function newId(len = 14) {
  const bytes = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHA[bytes[i] % ALPHA.length];
  return s;
}
export function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = crypto.randomBytes(6);
  return Array.from(b, (x) => A[x % A.length]).join('');
}
export const newToken = () => crypto.randomBytes(9).toString('base64url');

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password.normalize('NFKC'), salt, 64);
  return `s1$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [, salt, hash] = String(stored).split('$');
  if (!salt || !hash) return false;
  const key = await scrypt(String(password).normalize('NFKC'), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === key.length && crypto.timingSafeEqual(expected, key);
}

export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}
export function unsign(token) {
  if (!token || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (p.exp && p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}

const secure = () => process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
export function sessionCookie(payload) {
  return cookie(COOKIE, sign({ ...payload, exp: Date.now() + MAX_AGE * 1000 }), { maxAge: MAX_AGE, secure: secure() });
}
export const clearCookie = () => cookie(COOKIE, '', { maxAge: 0, secure: secure() });

// Returns { kind: 'user', user } | { kind: 'member', member } | null
export async function getSession(req) {
  if (req._session !== undefined) return req._session;
  const p = unsign(parseCookies(req)[COOKIE]);
  let s = null;
  if (p?.t === 'u') {
    const user = await db.get('SELECT id, email, name FROM users WHERE id = ?', [p.id]);
    if (user) s = { kind: 'user', user };
  } else if (p?.t === 'm') {
    const m = await db.get('SELECT id, wedding_id, username, name, role, perms FROM members WHERE id = ?', [p.id]);
    if (m) s = { kind: 'member', member: { ...m, perms: JSON.parse(m.perms || '{}') } };
  }
  req._session = s;
  return s;
}

export async function requireSession(req) {
  const s = await getSession(req);
  if (!s) fail(401, 'Please sign in');
  return s;
}

export async function requireUser(req) {
  const s = await requireSession(req);
  if (s.kind !== 'user') fail(403, 'Only planner accounts can do this');
  return s.user;
}

const FULL = Object.fromEntries(MODULES.map((m) => [m, 'edit']));

// Resolves the caller's access to a wedding: role, per-module permissions and display name.
export async function weddingAccess(req, weddingId) {
  const s = await requireSession(req);
  const w = await db.get('SELECT * FROM weddings WHERE id = ?', [weddingId]);
  if (!w) fail(404, 'Wedding not found');
  const wedding = { id: w.id, code: w.code, owner_id: w.owner_id, ...JSON.parse(w.data || '{}') };
  if (s.kind === 'user') {
    if (w.owner_id === s.user.id) return { wedding, role: 'owner', perms: FULL, who: s.user.name || s.user.email, session: s };
    const p = await db.get('SELECT role FROM wedding_planners WHERE wedding_id = ? AND user_id = ?', [w.id, s.user.id]);
    if (p) return { wedding, role: 'planner', perms: FULL, who: s.user.name || s.user.email, session: s };
    fail(403, 'You do not have access to this wedding');
  }
  if (s.member.wedding_id !== w.id) fail(403, 'You do not have access to this wedding');
  return { wedding, role: 'member', perms: s.member.perms || {}, who: s.member.name || s.member.username, session: s };
}

export const isPlanner = (access) => access.role === 'owner' || access.role === 'planner';
export function can(access, module, level = 'view') {
  if (isPlanner(access)) return true;
  const p = access.perms[module] || 'none';
  return level === 'view' ? p === 'view' || p === 'edit' : p === 'edit';
}
export function requirePerm(access, module, level) {
  if (!can(access, module, level)) {
    fail(403, level === 'edit' && can(access, module, 'view') ? 'You can view this section but not change it' : 'You do not have access to this section');
  }
}
export function requirePlanner(access) {
  if (!isPlanner(access)) fail(403, 'Only the wedding planners can do this');
}
