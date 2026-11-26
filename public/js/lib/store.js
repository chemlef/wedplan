// Client-side state for the open wedding, with optimistic updates.
import { api } from './api.js';
import { toast } from './ui.js';

export const store = {
  session: null, // { kind: 'user'|'member', user?, member? }
  weddings: [],
  wedding: null,
  me: null,
  records: {},
  members: [],
  planners: [],
  integrations: {},
  config: {},
};

const listeners = new Set();
let scheduled = false;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; listeners.forEach((fn) => fn()); });
}

export const wid = () => store.wedding?.id;
export const list = (type) => store.records[type] || [];
export const get = (type, id) => list(type).find((r) => r.id === id);
export const isPlanner = () => store.me?.role === 'owner' || store.me?.role === 'planner';
export function can(module, level = 'view') {
  if (!store.me) return false;
  if (isPlanner()) return true;
  const p = store.me.perms?.[module] || 'none';
  return level === 'view' ? p !== 'none' : p === 'edit';
}

// RFC 7396 merge patch (matches the server's json_patch).
export function mergePatch(target, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = target && typeof target === 'object' && !Array.isArray(target) ? { ...target } : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k];
    else if (typeof v === 'object' && !Array.isArray(v)) out[k] = mergePatch(out[k], v);
    else out[k] = v;
  }
  return out;
}

export async function loadWedding(id) {
  const d = await api.get(`/api/w/${id}/bootstrap`);
  Object.assign(store, d);
  store.members = d.members || [];
  store.planners = d.planners || [];
  emit();
  return d;
}

const sortRecs = (arr) => arr.sort((a, b) => (a._sort ?? 0) - (b._sort ?? 0));

export async function create(type, data) {
  const { record } = await api.post(`/api/w/${wid()}/records/${type}`, { data });
  store.records[type] = sortRecs([...list(type), record]);
  emit();
  return record;
}

export async function patch(type, id, data) {
  const arr = list(type);
  const i = arr.findIndex((r) => r.id === id);
  const before = arr[i];
  if (i >= 0) { arr[i] = mergePatch(before, data); emit(); }
  try {
    const { record } = await api.patch(`/api/w/${wid()}/records/${type}/${id}`, { data });
    const j = list(type).findIndex((r) => r.id === id);
    if (j >= 0) list(type)[j] = record;
    if (data._sort !== undefined) sortRecs(list(type));
    emit();
    return record;
  } catch (e) {
    if (i >= 0) { const j = list(type).findIndex((r) => r.id === id); if (j >= 0) list(type)[j] = before; emit(); }
    toast(e.message, { error: true });
    throw e;
  }
}

export async function remove(type, id, { undo = true, label } = {}) {
  const before = get(type, id);
  store.records[type] = list(type).filter((r) => r.id !== id);
  if (type === 'table') list('guest').forEach((g) => { if (g.table === id) { delete g.table; delete g.seat; } });
  emit();
  try {
    await api.del(`/api/w/${wid()}/records/${type}/${id}`);
    if (undo && before) {
      toast(`${label || 'Item'} deleted`, {
        action: { label: 'Undo', onClick: async () => { const { id: _, _sort, _updated, _by, type: __, token, ...data } = before; await create(type, { ...data, _sort }); } },
      });
    }
  } catch (e) {
    if (before) { store.records[type] = sortRecs([...list(type), before]); emit(); }
    toast(e.message, { error: true });
  }
}

// ops: [{ op: 'create'|'patch'|'delete', type, id?, data? }]
export async function bulk(ops, log) {
  if (!ops.length) return [];
  const out = [];
  for (let i = 0; i < ops.length; i += 1000) {
    const { results } = await api.post(`/api/w/${wid()}/bulk`, { ops: ops.slice(i, i + 1000), log: i === 0 ? log : undefined });
    out.push(...results);
  }
  ops.forEach((op, i) => {
    const r = out[i];
    if (op.op === 'create' && r.record) store.records[op.type] = [...list(op.type), r.record];
    else if (op.op === 'patch' && r.record) {
      const arr = list(op.type); const j = arr.findIndex((x) => x.id === op.id);
      if (j >= 0) arr[j] = r.record;
    } else if (op.op === 'delete') store.records[op.type] = list(op.type).filter((x) => x.id !== op.id);
  });
  Object.values(store.records).forEach(sortRecs);
  emit();
  return out;
}

export async function saveWedding(data) {
  const before = store.wedding;
  store.wedding = mergePatch(store.wedding, data);
  emit();
  try {
    const { wedding } = await api.patch(`/api/w/${wid()}`, { data });
    store.wedding = { ...store.wedding, ...wedding };
    emit();
  } catch (e) {
    store.wedding = before; emit();
    toast(e.message, { error: true });
    throw e;
  }
}

// ----------------------------------------------------------------- derived helpers used across views
export const guestName = (g) => (g ? (`${g.first || ''} ${g.last || ''}`.trim() || g.name || 'Unnamed guest') : '');
export const currency = () => store.wedding?.currency || 'EUR';
export const coupleNames = (w = store.wedding) => [w?.partner1, w?.partner2].filter(Boolean).join(' & ') || 'Our wedding';
export function taskDue(t, weddingDate = store.wedding?.date) {
  if (t.date) return t.date;
  if (!weddingDate || t.offset === undefined || t.offset === null || t.offset === '') return null;
  const d = new Date(`${weddingDate}T12:00:00`);
  d.setDate(d.getDate() - Number(t.offset));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function rsvpLink(g) { return `${location.origin}/rsvp/${g.token}`; }
