import { db } from '../db.js';
import { fail, readJson, send } from '../http.js';
import {
  newId, newCode, newToken, hashPassword, verifyPassword, sessionCookie, clearCookie, getSession,
  requireSession, requireUser, weddingAccess, isPlanner, can, requirePerm, requirePlanner,
} from '../auth.js';
import { TYPE_MODULE, MODULES, ROLE_PRESETS } from '../schema.js';

const now = () => Date.now();
const clean = (s, max = 200) => String(s ?? '').trim().slice(0, max);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function toRecord(r) {
  return { id: r.id, type: r.type, ...JSON.parse(r.data || '{}'), _sort: r.sort, _updated: r.updated_at, _by: r.updated_by };
}
function cleanData(d) {
  const o = { ...(d && typeof d === 'object' ? d : {}) };
  delete o.id; delete o.type;
  for (const k of Object.keys(o)) if (k.startsWith('_')) delete o[k];
  return o;
}
const label = (d) => clean(d?.name || d?.title || d?.label || '', 60);
const TYPE_LABEL = {
  guest: 'guest', table: 'table', design: 'design', budget_cat: 'budget category', expense: 'expense',
  palette: 'palette', bouquet: 'bouquet', favor: 'bomboniera', dish: 'dish', vendor: 'vendor', vendor_cat: 'vendor category',
  task: 'task', event: 'event', song: 'song', inspo: 'inspiration', dayof: 'schedule item', note: 'note',
};
const logStmt = (wid, who, action) => ({
  sql: 'INSERT INTO activity (wedding_id, who, action, created_at) VALUES (?, ?, ?, ?)', args: [wid, who, action, now()],
});

// ---------------------------------------------------------------- auth
async function signup(req, res) {
  const b = await readJson(req);
  const email = clean(b.email, 200).toLowerCase();
  const name = clean(b.name, 100);
  if (!emailOk(email)) fail(400, 'Enter a valid email address');
  if (String(b.password || '').length < 8) fail(400, 'Use a password of at least 8 characters');
  if (await db.get('SELECT id FROM users WHERE email = ?', [email])) fail(409, 'An account with this email already exists');
  const id = newId();
  await db.run('INSERT INTO users (id, email, name, pass, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, email, name, await hashPassword(String(b.password)), now()]);
  send(res, 200, { ok: true, kind: 'user', user: { id, email, name } }, { 'Set-Cookie': sessionCookie({ t: 'u', id }) });
}

async function login(req, res) {
  const b = await readJson(req);
  const u = await db.get('SELECT * FROM users WHERE email = ?', [clean(b.email).toLowerCase()]);
  if (!u || !(await verifyPassword(b.password || '', u.pass))) fail(401, 'Email or password is incorrect');
  send(res, 200, { ok: true, kind: 'user', user: { id: u.id, email: u.email, name: u.name } },
    { 'Set-Cookie': sessionCookie({ t: 'u', id: u.id }) });
}

async function memberLogin(req, res) {
  const b = await readJson(req);
  const w = await db.get('SELECT id FROM weddings WHERE code = ?', [clean(b.code, 12).toUpperCase()]);
  const m = w && await db.get('SELECT * FROM members WHERE wedding_id = ? AND username = ?', [w.id, clean(b.username, 60).toLowerCase()]);
  if (!m || !(await verifyPassword(b.password || '', m.pass))) fail(401, 'Wedding code, username or password is incorrect');
  await db.run('UPDATE members SET last_login = ? WHERE id = ?', [now(), m.id]);
  send(res, 200, { ok: true, kind: 'member', weddingId: w.id }, { 'Set-Cookie': sessionCookie({ t: 'm', id: m.id }) });
}

async function logout(req, res) { send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() }); }

async function me(req, res) {
  const s = await getSession(req);
  if (!s) return send(res, 200, { kind: null });
  if (s.kind === 'user') return send(res, 200, { kind: 'user', user: s.user });
  const { pass, ...m } = s.member;
  send(res, 200, { kind: 'member', member: m, weddingId: m.wedding_id });
}

async function changePassword(req, res) {
  const s = await requireSession(req);
  const b = await readJson(req);
  if (String(b.next || '').length < 8) fail(400, 'Use a password of at least 8 characters');
  const table = s.kind === 'user' ? 'users' : 'members';
  const id = s.kind === 'user' ? s.user.id : s.member.id;
  const row = await db.get(`SELECT pass FROM ${table} WHERE id = ?`, [id]);
  if (!(await verifyPassword(b.current || '', row.pass))) fail(401, 'Current password is incorrect');
  await db.run(`UPDATE ${table} SET pass = ? WHERE id = ?`, [await hashPassword(String(b.next)), id]);
  send(res, 200, { ok: true });
}

async function updateProfile(req, res) {
  const u = await requireUser(req);
  const b = await readJson(req);
  await db.run('UPDATE users SET name = ? WHERE id = ?', [clean(b.name, 100), u.id]);
  send(res, 200, { ok: true });
}

// ---------------------------------------------------------------- weddings
async function listWeddings(req, res) {
  const s = await requireSession(req);
  if (s.kind === 'member') {
    const w = await db.get('SELECT id, code, data FROM weddings WHERE id = ?', [s.member.wedding_id]);
    return send(res, 200, { weddings: w ? [{ id: w.id, code: w.code, role: 'member', ...JSON.parse(w.data) }] : [] });
  }
  const rows = await db.all(
    `SELECT w.id, w.code, w.data, w.owner_id, w.created_at,
       (SELECT COUNT(*) FROM records r WHERE r.wedding_id = w.id AND r.type = 'guest') AS guests
     FROM weddings w
     WHERE w.owner_id = ? OR w.id IN (SELECT wedding_id FROM wedding_planners WHERE user_id = ?)
     ORDER BY w.created_at DESC`, [s.user.id, s.user.id]);
  send(res, 200, {
    weddings: rows.map((w) => ({ id: w.id, code: w.code, role: w.owner_id === s.user.id ? 'owner' : 'planner', guests: w.guests, ...JSON.parse(w.data) })),
  });
}

async function createWedding(req, res) {
  const u = await requireUser(req);
  const b = await readJson(req);
  const id = newId();
  let code = newCode();
  while (await db.get('SELECT id FROM weddings WHERE code = ?', [code])) code = newCode();
  const data = cleanData(b.data);
  data.icalToken = newToken();
  await db.batch([
    { sql: 'INSERT INTO weddings (id, owner_id, code, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', args: [id, u.id, code, JSON.stringify(data), now(), now()] },
    { sql: 'INSERT INTO tokens (token, wedding_id, kind, ref, created_at) VALUES (?, ?, ?, ?, ?)', args: [data.icalToken, id, 'ical', id, now()] },
  ]);
  send(res, 200, { wedding: { id, code, role: 'owner', ...data } });
}

async function bootstrap(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  const types = Object.entries(TYPE_MODULE).filter(([, m]) => can(a, m, 'view')).map(([t]) => t);
  const rows = types.length
    ? await db.all(`SELECT * FROM records WHERE wedding_id = ? AND type IN (${types.map(() => '?').join(',')}) ORDER BY sort, created_at`, [wid, ...types])
    : [];
  const records = Object.fromEntries(types.map((t) => [t, []]));
  for (const r of rows) records[r.type].push(toRecord(r));
  const integ = await db.all('SELECT provider, data FROM integrations WHERE wedding_id = ?', [wid]);
  const integrations = Object.fromEntries(integ.map((i) => {
    const d = JSON.parse(i.data);
    return [i.provider, { connected: true, user: d.user || null, playlistUrl: d.playlistUrl || null }];
  }));
  const out = {
    wedding: a.wedding,
    me: { role: a.role, perms: a.perms, name: a.who, kind: a.session.kind },
    records,
    integrations,
    config: {
      spotify: !!process.env.SPOTIFY_CLIENT_ID,
      pinterest: !!process.env.PINTEREST_APP_ID,
    },
  };
  if (isPlanner(a)) {
    out.members = (await db.all('SELECT id, username, name, role, perms, created_at, last_login FROM members WHERE wedding_id = ? ORDER BY created_at', [wid]))
      .map((m) => ({ ...m, perms: JSON.parse(m.perms || '{}') }));
    out.planners = await db.all(
      `SELECT u.id, u.email, u.name, 'owner' AS role FROM users u JOIN weddings w ON w.owner_id = u.id WHERE w.id = ?
       UNION ALL SELECT u.id, u.email, u.name, p.role FROM wedding_planners p JOIN users u ON u.id = p.user_id WHERE p.wedding_id = ?`, [wid, wid]);
  } else {
    delete out.wedding.icalToken;
  }
  send(res, 200, out);
}

async function updateWedding(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  requirePlanner(a);
  const b = await readJson(req);
  const patch = cleanData(b.data);
  delete patch.icalToken; delete patch.code; delete patch.owner_id;
  const [r] = await db.batch([
    { sql: 'UPDATE weddings SET data = json_patch(data, ?), updated_at = ? WHERE id = ? RETURNING id, code, owner_id, data', args: [JSON.stringify(patch), now(), wid] },
    logStmt(wid, a.who, 'updated the wedding details'),
  ]);
  const w = r.rows[0];
  send(res, 200, { wedding: { id: w.id, code: w.code, owner_id: w.owner_id, ...JSON.parse(w.data) } });
}

async function deleteWedding(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  if (a.role !== 'owner') fail(403, 'Only the owner can delete a wedding');
  await db.batch(['records', 'tokens', 'members', 'wedding_planners', 'integrations', 'activity']
    .map((t) => ({ sql: `DELETE FROM ${t} WHERE wedding_id = ?`, args: [wid] }))
    .concat([{ sql: 'DELETE FROM weddings WHERE id = ?', args: [wid] }]));
  send(res, 200, { ok: true });
}

async function rotateIcal(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  requirePlanner(a);
  const token = newToken();
  await db.batch([
    { sql: "DELETE FROM tokens WHERE wedding_id = ? AND kind = 'ical'", args: [wid] },
    { sql: 'INSERT INTO tokens (token, wedding_id, kind, ref, created_at) VALUES (?, ?, ?, ?, ?)', args: [token, wid, 'ical', wid, now()] },
    { sql: "UPDATE weddings SET data = json_set(data, '$.icalToken', ?) WHERE id = ?", args: [token, wid] },
  ]);
  send(res, 200, { icalToken: token });
}

async function activity(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  requirePlanner(a);
  send(res, 200, { activity: await db.all('SELECT who, action, created_at FROM activity WHERE wedding_id = ? ORDER BY created_at DESC LIMIT 60', [wid]) });
}

// ---------------------------------------------------------------- team: planners & helper logins
async function addPlanner(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  requirePlanner(a);
  const b = await readJson(req);
  const u = await db.get('SELECT id, email, name FROM users WHERE email = ?', [clean(b.email).toLowerCase()]);
  if (!u) fail(404, 'No planner account uses that email yet. Ask them to sign up first, then add them.');
  if (u.id === a.wedding.owner_id) fail(409, 'That person already owns this wedding');
  await db.run('INSERT OR IGNORE INTO wedding_planners (wedding_id, user_id, role) VALUES (?, ?, ?)', [wid, u.id, 'planner']);
  send(res, 200, { planner: { ...u, role: 'planner' } });
}
async function removePlanner(req, res, { wid, uid }) {
  const a = await weddingAccess(req, wid);
  requirePlanner(a);
  await db.run('DELETE FROM wedding_planners WHERE wedding_id = ? AND user_id = ?', [wid, uid]);
  send(res, 200, { ok: true });
}

function normPerms(p, role) {
  const base = ROLE_PRESETS[role] || ROLE_PRESETS.viewer;
  return Object.fromEntries(MODULES.map((m) => [m, ['none', 'view', 'edit'].includes(p?.[m]) ? p[m] : base[m]]));
}
async function createMember(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  requirePlanner(a);
  const b = await readJson(req);
  const username = clean(b.username, 40).toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (!username) fail(400, 'Choose a username (letters and numbers)');
  if (String(b.password || '').length < 6) fail(400, 'Use a password of at least 6 characters');
  if (await db.get('SELECT id FROM members WHERE wedding_id = ? AND username = ?', [wid, username])) fail(409, 'That username is already taken for this wedding');
  const m = { id: newId(), username, name: clean(b.name, 80), role: clean(b.role, 30) || 'koumbaros' };
  m.perms = normPerms(b.perms, m.role);
  await db.batch([
    { sql: 'INSERT INTO members (id, wedding_id, username, name, pass, role, perms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [m.id, wid, m.username, m.name, await hashPassword(String(b.password)), m.role, JSON.stringify(m.perms), now()] },
    logStmt(wid, a.who, `gave ${m.name || m.username} access`),
  ]);
  send(res, 200, { member: { ...m, created_at: now() } });
}
async function updateMember(req, res, { wid, mid }) {
  const a = await weddingAccess(req, wid);
  requirePlanner(a);
  const b = await readJson(req);
  const m = await db.get('SELECT * FROM members WHERE id = ? AND wedding_id = ?', [mid, wid]);
  if (!m) fail(404, 'Not found');
  const role = b.role !== undefined ? clean(b.role, 30) : m.role;
  const perms = b.perms !== undefined ? normPerms(b.perms, role) : JSON.parse(m.perms);
  const name = b.name !== undefined ? clean(b.name, 80) : m.name;
  let pass = m.pass;
  if (b.password) {
    if (String(b.password).length < 6) fail(400, 'Use a password of at least 6 characters');
    pass = await hashPassword(String(b.password));
  }
  await db.run('UPDATE members SET name = ?, role = ?, perms = ?, pass = ? WHERE id = ?', [name, role, JSON.stringify(perms), pass, mid]);
  send(res, 200, { member: { id: mid, username: m.username, name, role, perms, created_at: m.created_at, last_login: m.last_login } });
}
async function deleteMember(req, res, { wid, mid }) {
  const a = await weddingAccess(req, wid);
  requirePlanner(a);
  await db.run('DELETE FROM members WHERE id = ? AND wedding_id = ?', [mid, wid]);
  send(res, 200, { ok: true });
}

// ---------------------------------------------------------------- records (all feature data)
function checkType(a, type, level) {
  const module = TYPE_MODULE[type];
  if (!module) fail(400, `Unknown record type "${type}"`);
  requirePerm(a, module, level);
}

function createStmts(wid, a, type, data, sort) {
  const id = newId();
  const d = cleanData(data);
  const stmts = [];
  if (type === 'guest') {
    d.token = newToken();
    stmts.push({ sql: 'INSERT INTO tokens (token, wedding_id, kind, ref, created_at) VALUES (?, ?, ?, ?, ?)', args: [d.token, wid, 'rsvp', id, now()] });
  }
  stmts.unshift({
    sql: 'INSERT INTO records (id, wedding_id, type, data, sort, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
    args: [id, wid, type, JSON.stringify(d), Number(sort ?? data?._sort ?? now() / 1e6) || 0, now(), now(), a.who],
  });
  return stmts;
}
function patchStmts(wid, a, type, id, data) {
  const d = cleanData(data);
  if (type === 'guest') delete d.token;
  const sort = data?._sort;
  return [{
    sql: `UPDATE records SET data = json_patch(data, ?), updated_at = ?, updated_by = ?, sort = COALESCE(?, sort)
          WHERE id = ? AND wedding_id = ? AND type = ? RETURNING *`,
    args: [JSON.stringify(d), now(), a.who, typeof sort === 'number' ? sort : null, id, wid, type],
  }];
}
function deleteStmts(wid, type, id) {
  const stmts = [{ sql: 'DELETE FROM records WHERE id = ? AND wedding_id = ? AND type = ?', args: [id, wid, type] }];
  if (type === 'guest') stmts.push({ sql: "DELETE FROM tokens WHERE wedding_id = ? AND kind = 'rsvp' AND ref = ?", args: [wid, id] });
  if (type === 'table') {
    stmts.push({ sql: "UPDATE records SET data = json_remove(data, '$.table', '$.seat') WHERE wedding_id = ? AND type = 'guest' AND json_extract(data, '$.table') = ?", args: [wid, id] });
  }
  return stmts;
}

async function listRecords(req, res, { wid, type }) {
  const a = await weddingAccess(req, wid);
  checkType(a, type, 'view');
  const rows = await db.all('SELECT * FROM records WHERE wedding_id = ? AND type = ? ORDER BY sort, created_at', [wid, type]);
  send(res, 200, { records: rows.map(toRecord) });
}

async function createRecord(req, res, { wid, type }) {
  const a = await weddingAccess(req, wid);
  checkType(a, type, 'edit');
  const b = await readJson(req);
  const out = await db.batch([...createStmts(wid, a, type, b.data, b.data?._sort), logStmt(wid, a.who, `added ${TYPE_LABEL[type]} “${label(b.data)}”`)]);
  send(res, 200, { record: toRecord(out[0].rows[0]) });
}

async function patchRecord(req, res, { wid, type, id }) {
  const a = await weddingAccess(req, wid);
  checkType(a, type, 'edit');
  const b = await readJson(req);
  const out = await db.batch(patchStmts(wid, a, type, id, b.data));
  if (!out[0].rows.length) fail(404, 'Not found');
  const rec = toRecord(out[0].rows[0]);
  if (!isPlanner(a)) {
    const log = logStmt(wid, a.who, `updated ${TYPE_LABEL[type]} “${label(rec)}”`);
    await db.run(log.sql, log.args);
  }
  send(res, 200, { record: rec });
}

async function deleteRecord(req, res, { wid, type, id }) {
  const a = await weddingAccess(req, wid);
  checkType(a, type, 'edit');
  const row = await db.get('SELECT data FROM records WHERE id = ? AND wedding_id = ?', [id, wid]);
  await db.batch([...deleteStmts(wid, type, id), logStmt(wid, a.who, `removed ${TYPE_LABEL[type]} “${label(row ? JSON.parse(row.data) : {})}”`)]);
  send(res, 200, { ok: true });
}

// Many changes in one atomic request: imports, auto-seating, generated timelines, reordering.
async function bulk(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  const b = await readJson(req);
  const ops = Array.isArray(b.ops) ? b.ops : [];
  if (ops.length > 1500) fail(400, 'Too many changes at once');
  const stmts = [];
  const map = [];
  for (const op of ops) {
    checkType(a, op.type, 'edit');
    let s;
    if (op.op === 'create') s = createStmts(wid, a, op.type, op.data, op.data?._sort);
    else if (op.op === 'patch') s = patchStmts(wid, a, op.type, op.id, op.data);
    else if (op.op === 'delete') s = deleteStmts(wid, op.type, op.id);
    else fail(400, 'Unknown operation');
    map.push({ index: stmts.length, op: op.op, ref: op.ref });
    stmts.push(...s);
  }
  if (b.log) stmts.push(logStmt(wid, a.who, clean(b.log, 120)));
  const out = await db.batch(stmts);
  const results = map.map((m) => ({
    op: m.op, ref: m.ref, record: out[m.index]?.rows?.[0] ? toRecord(out[m.index].rows[0]) : null,
  }));
  send(res, 200, { results });
}

async function regenerateGuestToken(req, res, { wid, id }) {
  const a = await weddingAccess(req, wid);
  requirePerm(a, 'guests', 'edit');
  const token = newToken();
  const out = await db.batch([
    { sql: "DELETE FROM tokens WHERE wedding_id = ? AND kind = 'rsvp' AND ref = ?", args: [wid, id] },
    { sql: 'INSERT INTO tokens (token, wedding_id, kind, ref, created_at) VALUES (?, ?, ?, ?, ?)', args: [token, wid, 'rsvp', id, now()] },
    { sql: "UPDATE records SET data = json_set(data, '$.token', ?) WHERE id = ? AND wedding_id = ? AND type = 'guest' RETURNING *", args: [token, id, wid] },
  ]);
  send(res, 200, { record: toRecord(out[2].rows[0]) });
}

export const coreRoutes = [
  ['POST', '/api/auth/signup', signup],
  ['POST', '/api/auth/login', login],
  ['POST', '/api/auth/member-login', memberLogin],
  ['POST', '/api/auth/logout', logout],
  ['GET', '/api/auth/me', me],
  ['POST', '/api/auth/password', changePassword],
  ['POST', '/api/auth/profile', updateProfile],
  ['GET', '/api/weddings', listWeddings],
  ['POST', '/api/weddings', createWedding],
  ['GET', '/api/w/:wid/bootstrap', bootstrap],
  ['PATCH', '/api/w/:wid', updateWedding],
  ['DELETE', '/api/w/:wid', deleteWedding],
  ['POST', '/api/w/:wid/ical-token', rotateIcal],
  ['GET', '/api/w/:wid/activity', activity],
  ['POST', '/api/w/:wid/planners', addPlanner],
  ['DELETE', '/api/w/:wid/planners/:uid', removePlanner],
  ['POST', '/api/w/:wid/members', createMember],
  ['PATCH', '/api/w/:wid/members/:mid', updateMember],
  ['DELETE', '/api/w/:wid/members/:mid', deleteMember],
  ['POST', '/api/w/:wid/bulk', bulk],
  ['POST', '/api/w/:wid/guests/:id/token', regenerateGuestToken],
  ['GET', '/api/w/:wid/records/:type', listRecords],
  ['POST', '/api/w/:wid/records/:type', createRecord],
  ['PATCH', '/api/w/:wid/records/:type/:id', patchRecord],
  ['DELETE', '/api/w/:wid/records/:type/:id', deleteRecord],
];
