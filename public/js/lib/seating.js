// Automatic seating: households stay together, friends sit together, "keep apart" pairs never share a table.
// Greedy placement followed by simulated annealing, run with a few different weightings to offer options.

export const PRESETS = [
  { key: 'friends', name: 'Friends together', desc: 'Prioritises people who know each other.', w: { knows: 12, group: 4, side: 2, mix: 0, kids: 4, lonely: 8 } },
  { key: 'groups', name: 'By family & group', desc: 'Keeps each side’s families and friend groups at the same tables.', w: { knows: 6, group: 9, side: 5, mix: 0, kids: 3, lonely: 5 } },
  { key: 'mingle', name: 'Mix & mingle', desc: 'Keeps friends close but mixes both sides of the family.', w: { knows: 9, group: 1, side: -2, mix: 2.5, kids: 2, lonely: 7 } },
];

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; };
}

export function capacity(t) { return Math.max(0, Number(t.seats) || 0); }

// Pairwise affinity between two guests.
export function makeAffinity(guests, w) {
  const byId = new Map(guests.map((g) => [g.id, g]));
  const knows = new Map(); const avoid = new Map();
  const link = (m, a, b) => { if (!m.has(a)) m.set(a, new Set()); m.get(a).add(b); };
  for (const g of guests) {
    for (const k of g.knows || []) if (byId.has(k)) { link(knows, g.id, k); link(knows, k, g.id); }
    for (const k of g.avoid || []) if (byId.has(k)) { link(avoid, g.id, k); link(avoid, k, g.id); }
    if (g.plusOneOf && byId.has(g.plusOneOf)) { link(knows, g.id, g.plusOneOf); link(knows, g.plusOneOf, g.id); }
  }
  const cache = new Map();
  const aff = (a, b) => {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (cache.has(key)) return cache.get(key);
    const A = byId.get(a); const B = byId.get(b);
    let v = 0;
    if (avoid.get(a)?.has(b)) v -= 1000;
    if (knows.get(a)?.has(b)) v += w.knows;
    if (A.party && A.party === B.party) v += w.knows;
    if (A.group && A.group === B.group && (A.side === B.side || !A.side || !B.side)) v += w.group;
    if (A.side && B.side && A.side !== 'both' && B.side !== 'both') v += A.side === B.side ? w.side : w.mix;
    if (A.child && B.child) v += w.kids;
    cache.set(key, v);
    return v;
  };
  const isFriend = (a, b) => knows.get(a)?.has(b) || (byId.get(a).party && byId.get(a).party === byId.get(b).party);
  return { aff, avoid, knows, byId, isFriend };
}

// Group guests into units that must sit together (households + plus-ones), split if a unit can't fit anywhere.
function buildUnits(guests, maxCap) {
  const parent = new Map(guests.map((g) => [g.id, g.id]));
  const find = (x) => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x))), parent.get(x)));
  const union = (a, b) => { if (parent.has(a) && parent.has(b)) parent.set(find(a), find(b)); };
  const byParty = new Map();
  for (const g of guests) {
    if (g.party) { if (byParty.has(g.party)) union(g.id, byParty.get(g.party)); else byParty.set(g.party, g.id); }
    if (g.plusOneOf) union(g.id, g.plusOneOf);
  }
  const groups = new Map();
  for (const g of guests) { const r = find(g.id); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(g.id); }
  const units = [];
  for (const ids of groups.values()) {
    if (ids.length <= maxCap) units.push(ids);
    else for (let i = 0; i < ids.length; i += maxCap) units.push(ids.slice(i, i + maxCap));
  }
  return units;
}

export function evaluate(assign, guests, tables, w = PRESETS[0].w) {
  const { aff, avoid, isFriend } = makeAffinity(guests, w);
  const at = new Map(tables.map((t) => [t.id, []]));
  for (const g of guests) { const t = assign.get(g.id); if (t && at.has(t)) at.get(t).push(g.id); }
  let score = 0; let conflicts = 0; let withFriend = 0; let seated = 0; let lonely = 0;
  for (const [, ids] of at) {
    for (let i = 0; i < ids.length; i++) {
      seated++;
      let friend = false;
      for (let j = 0; j < ids.length; j++) {
        if (i === j) continue;
        if (j > i) { score += aff(ids[i], ids[j]); if (avoid.get(ids[i])?.has(ids[j])) conflicts++; }
        if (isFriend(ids[i], ids[j])) friend = true;
      }
      if (friend) withFriend++; else if (ids.length > 1) lonely++;
    }
  }
  return { score, conflicts, withFriend, seated, lonely, unseated: guests.length - seated, happiness: seated ? Math.round((withFriend / seated) * 100) : 0 };
}

export function arrange({ guests, tables, preset, seed = 1, keepExisting = false, iterations = 25000 }) {
  const w = preset.w;
  const rand = rng(seed * 2654435761);
  const usable = tables.filter((t) => !t.decor && !t.reserved && capacity(t) > 0);
  const fixed = new Map(); // guestId -> tableId (locked, or reserved tables, or keepExisting)
  for (const g of guests) {
    const t = tables.find((x) => x.id === g.table);
    if (t && (g.locked || t.reserved || keepExisting)) fixed.set(g.id, t.id);
  }
  const free = guests.filter((g) => !fixed.has(g.id));
  const maxCap = Math.max(1, ...usable.map(capacity));
  const units = buildUnits(free, maxCap);
  const { aff } = makeAffinity(guests, w);
  const kidsBonus = (ids, t) => (t.kids ? ids.reduce((s, id) => s + (guests.find((g) => g.id === id)?.child ? 25 : -25), 0) : 0);

  const members = new Map(usable.map((t) => [t.id, []]));
  const remaining = new Map(usable.map((t) => [t.id, capacity(t)]));
  for (const [gid, tid] of fixed) { if (members.has(tid)) { members.get(tid).push(gid); remaining.set(tid, remaining.get(tid) - 1); } }
  const tableById = new Map(usable.map((t) => [t.id, t]));
  const gain = (ids, tid) => {
    let s = 0;
    for (const m of members.get(tid)) for (const id of ids) s += aff(id, m);
    // Penalise placing someone where they know nobody
    if (w.lonely && members.get(tid).length && s <= 0) s -= w.lonely * ids.length;
    return s + kidsBonus(ids, tableById.get(tid));
  };

  // Greedy: biggest, most connected units first.
  const degree = (ids) => ids.reduce((s, id) => s + free.reduce((a, g) => a + Math.max(0, aff(id, g.id)), 0), 0);
  const order = units.map((u) => ({ u, k: u.length * 100 + degree(u) + rand() * 5 })).sort((a, b) => b.k - a.k).map((x) => x.u);
  const unitTable = new Map();
  const unseated = [];
  for (const u of order) {
    let best = null; let bestV = -Infinity;
    for (const t of usable) {
      if (remaining.get(t.id) < u.length) continue;
      const emptyPenalty = members.get(t.id).length === 0 ? -0.5 : 0;
      const v = gain(u, t.id) + emptyPenalty + rand() * 0.8;
      if (v > bestV) { bestV = v; best = t.id; }
    }
    if (!best) { unseated.push(...u); continue; }
    members.get(best).push(...u); remaining.set(best, remaining.get(best) - u.length); unitTable.set(u, best);
  }

  // Simulated annealing: move or swap units between tables.
  const placed = [...unitTable.keys()];
  const removeFrom = (tid, ids) => { const set = new Set(ids); members.set(tid, members.get(tid).filter((x) => !set.has(x))); remaining.set(tid, remaining.get(tid) + ids.length); };
  const addTo = (tid, ids) => { members.get(tid).push(...ids); remaining.set(tid, remaining.get(tid) - ids.length); };
  let T = 6;
  const iters = Math.min(iterations, 120 * (guests.length + 10));
  for (let i = 0; i < iters && placed.length > 1 && usable.length > 1; i++) {
    T = 6 * (1 - i / iters) + 0.05;
    const u = placed[Math.floor(rand() * placed.length)];
    const from = unitTable.get(u);
    const to = usable[Math.floor(rand() * usable.length)].id;
    if (to === from) continue;
    if (remaining.get(to) >= u.length && rand() < 0.5) {
      removeFrom(from, u);
      const delta = gain(u, to) - gain(u, from);
      if (delta >= 0 || rand() < Math.exp(delta / T)) { addTo(to, u); unitTable.set(u, to); } else addTo(from, u);
    } else {
      // swap with a unit at the destination that fits
      const cands = placed.filter((v) => unitTable.get(v) === to && v.length <= remaining.get(from) + u.length && u.length <= remaining.get(to) + v.length);
      if (!cands.length) continue;
      const v = cands[Math.floor(rand() * cands.length)];
      removeFrom(from, u); removeFrom(to, v);
      const before = gain(u, from) + gain(v, to);
      const after = gain(u, to) + gain(v, from);
      const delta = after - before;
      if (delta >= 0 || rand() < Math.exp(delta / T)) { addTo(to, u); addTo(from, v); unitTable.set(u, to); unitTable.set(v, from); } else { addTo(from, u); addTo(to, v); }
    }
  }

  const assign = new Map();
  for (const [gid, tid] of fixed) assign.set(gid, tid);
  for (const [tid, ids] of members) for (const id of ids) assign.set(id, tid);
  return { assign, unseated, stats: evaluate(assign, guests, tables, w) };
}

export function generateOptions({ guests, tables, keepExisting }) {
  return PRESETS.map((p, i) => {
    // Keep the best of a few seeds for each preset.
    let best = null;
    for (let s = 1; s <= 3; s++) {
      const r = arrange({ guests, tables, preset: p, seed: s + i * 7, keepExisting });
      const key = r.stats.score - r.stats.unseated * 50 - r.stats.conflicts * 1000;
      if (!best || key > best.key) best = { ...r, key };
    }
    return { preset: p, ...best };
  });
}

// Rank tables for one guest: how many people they know there, conflicts, space.
export function suggestTables(guest, guests, tables) {
  const { aff, avoid, isFriend } = makeAffinity(guests, PRESETS[0].w);
  return tables.filter((t) => !t.decor).map((t) => {
    const here = guests.filter((g) => g.table === t.id && g.id !== guest.id);
    const free = capacity(t) - here.length;
    const friends = here.filter((g) => isFriend(guest.id, g.id));
    const conflict = here.some((g) => avoid.get(guest.id)?.has(g.id));
    const score = here.reduce((s, g) => s + aff(guest.id, g.id), 0) - (free <= 0 ? 500 : 0);
    return { table: t, free, friends, conflict, score };
  }).sort((a, b) => b.score - a.score);
}
