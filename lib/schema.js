// Tables are created on first use (idempotent). Feature data lives in `records` as JSON documents
// grouped by type, which keeps every module flexible and customisable without migrations.
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, pass TEXT NOT NULL,
    created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS weddings (
    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, code TEXT UNIQUE NOT NULL,
    data TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS wedding_planners (
    wedding_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'planner',
    PRIMARY KEY (wedding_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY, wedding_id TEXT NOT NULL, username TEXT NOT NULL, name TEXT,
    pass TEXT NOT NULL, role TEXT, perms TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL, last_login INTEGER, UNIQUE (wedding_id, username))`,
  `CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY, wedding_id TEXT NOT NULL, type TEXT NOT NULL, data TEXT NOT NULL,
    sort REAL NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
    updated_by TEXT)`,
  `CREATE INDEX IF NOT EXISTS records_by_wedding ON records (wedding_id, type)`,
  `CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY, wedding_id TEXT NOT NULL, kind TEXT NOT NULL, ref TEXT,
    created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS tokens_by_ref ON tokens (wedding_id, kind, ref)`,
  `CREATE TABLE IF NOT EXISTS integrations (
    wedding_id TEXT NOT NULL, provider TEXT NOT NULL, data TEXT NOT NULL,
    PRIMARY KEY (wedding_id, provider))`,
  `CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT, wedding_id TEXT NOT NULL, who TEXT, action TEXT NOT NULL,
    created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS activity_by_wedding ON activity (wedding_id, created_at)`,
];

// Which permission area guards each record type.
export const TYPE_MODULE = {
  guest: 'guests',
  table: 'seating',
  design: 'invitations',
  budget_cat: 'budget',
  expense: 'budget',
  palette: 'style',
  bouquet: 'style',
  favor: 'style',
  dish: 'menu',
  vendor: 'vendors',
  vendor_cat: 'vendors',
  task: 'timeline',
  event: 'calendar',
  song: 'music',
  inspo: 'inspiration',
  dayof: 'dayof',
  note: 'notes',
};

export const MODULES = ['guests', 'seating', 'invitations', 'budget', 'style', 'menu', 'vendors',
  'timeline', 'calendar', 'music', 'inspiration', 'dayof', 'notes'];

export const ROLE_PRESETS = {
  koumbaros: { guests: 'edit', seating: 'edit', invitations: 'view', budget: 'none', style: 'edit', menu: 'view',
    vendors: 'view', timeline: 'edit', calendar: 'edit', music: 'edit', inspiration: 'edit', dayof: 'edit', notes: 'edit' },
  couple: Object.fromEntries(MODULES.map((m) => [m, 'edit'])),
  family: { guests: 'view', seating: 'view', invitations: 'view', budget: 'none', style: 'view', menu: 'view',
    vendors: 'none', timeline: 'view', calendar: 'view', music: 'edit', inspiration: 'view', dayof: 'view', notes: 'none' },
  viewer: Object.fromEntries(MODULES.map((m) => [m, m === 'budget' ? 'none' : 'view'])),
};
