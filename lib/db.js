// Database access.
// Production: Turso (libSQL) through its HTTP "pipeline" API, so no driver dependency is needed.
// Local development: Node's built-in SQLite (node:sqlite) when TURSO_DATABASE_URL is unset or "file:".
import { SCHEMA } from './schema.js';

const RAW_URL = process.env.TURSO_DATABASE_URL || '';
const TOKEN = process.env.TURSO_AUTH_TOKEN || '';
const useTurso = /^(libsql|https?|wss?):\/\//.test(RAW_URL);

function toArg(v) {
  if (v === null || v === undefined) return { type: 'null' };
  if (typeof v === 'boolean') return { type: 'integer', value: v ? '1' : '0' };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { type: 'integer', value: String(v) } : { type: 'float', value: v };
  }
  if (typeof v === 'object') return { type: 'text', value: JSON.stringify(v) };
  return { type: 'text', value: String(v) };
}

function fromVal(c) {
  switch (c.type) {
    case 'null': return null;
    case 'integer': return Number(c.value);
    case 'float': return Number(c.value);
    case 'blob': return Buffer.from(c.base64 || '', 'base64');
    default: return c.value;
  }
}

function tursoBase() {
  return RAW_URL.replace(/^libsql:\/\//, 'https://').replace(/^wss:\/\//, 'https://').replace(/\/+$/, '');
}

async function tursoPipeline(requests) {
  const res = await fetch(`${tursoBase()}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [...requests, { type: 'close' }] }),
  });
  if (!res.ok) throw new Error(`Database error (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return json.results.slice(0, requests.length);
}

function shapeResult(result) {
  const cols = result.cols.map((c) => c.name);
  return {
    rows: result.rows.map((row) => Object.fromEntries(row.map((c, i) => [cols[i], fromVal(c)]))),
    changes: result.affected_row_count,
  };
}

const turso = {
  async exec(sql, args = []) {
    const [r] = await tursoPipeline([{ type: 'execute', stmt: { sql, args: args.map(toArg) } }]);
    if (r.type === 'error') throw new Error(r.error.message);
    return shapeResult(r.response.result);
  },
  // Runs statements atomically: each step only runs if the previous one succeeded, else rollback.
  async batch(stmts) {
    if (!stmts.length) return [];
    const steps = [{ stmt: { sql: 'BEGIN' } }];
    stmts.forEach((s, i) => steps.push({
      stmt: { sql: s.sql, args: (s.args || []).map(toArg) },
      condition: { type: 'ok', step: i },
    }));
    const commitIdx = steps.length;
    steps.push({ stmt: { sql: 'COMMIT' }, condition: { type: 'ok', step: commitIdx - 1 } });
    steps.push({ stmt: { sql: 'ROLLBACK' }, condition: { type: 'not', cond: { type: 'ok', step: commitIdx } } });
    const [r] = await tursoPipeline([{ type: 'batch', batch: { steps } }]);
    if (r.type === 'error') throw new Error(r.error.message);
    const { step_results: results, step_errors: errors } = r.response.result;
    const firstErr = errors.find((e) => e);
    if (firstErr) throw new Error(firstErr.message);
    return results.slice(1, commitIdx).map((x) => (x ? shapeResult(x) : { rows: [], changes: 0 }));
  },
};

let localDb;
async function local() {
  if (process.env.VERCEL) {
    const e = new Error('The database isn’t connected yet. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the Vercel project settings, then redeploy.');
    e.status = 503;
    throw e;
  }
  if (!localDb) {
    const { DatabaseSync } = await import('node:sqlite');
    const fs = await import('node:fs');
    const file = RAW_URL.startsWith('file:') ? RAW_URL.slice(5) : './data/wedplan.db';
    fs.mkdirSync(file.split('/').slice(0, -1).join('/') || '.', { recursive: true });
    localDb = new DatabaseSync(file);
    localDb.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  }
  return localDb;
}
const norm = (args) => args.map((v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0)
  : (v && typeof v === 'object') ? JSON.stringify(v) : v));
function localRun(db, sql, args = []) {
  const stmt = db.prepare(sql);
  if (/^\s*(select|with|pragma)\b/i.test(sql) || /\breturning\b/i.test(sql)) {
    const rows = stmt.all(...norm(args));
    return { rows: rows.map((r) => ({ ...r })), changes: rows.length };
  }
  const info = stmt.run(...norm(args));
  return { rows: [], changes: Number(info.changes) };
}
const sqlite = {
  async exec(sql, args) { return localRun(await local(), sql, args); },
  async batch(stmts) {
    const db = await local();
    db.exec('BEGIN');
    try {
      const out = stmts.map((s) => localRun(db, s.sql, s.args));
      db.exec('COMMIT');
      return out;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },
};

const driver = useTurso ? turso : sqlite;

let ready;
function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      for (const sql of SCHEMA) await driver.exec(sql);
    })().catch((e) => { ready = null; throw e; });
  }
  return ready;
}

export const db = {
  async all(sql, args = []) { await ensureSchema(); return (await driver.exec(sql, args)).rows; },
  async get(sql, args = []) { return (await this.all(sql, args))[0] || null; },
  async run(sql, args = []) { await ensureSchema(); return driver.exec(sql, args); },
  async batch(stmts) { await ensureSchema(); return driver.batch(stmts.filter(Boolean)); },
  usingTurso: useTurso,
};
