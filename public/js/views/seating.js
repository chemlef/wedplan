import {
  h, icon, sheet, menu, toast, field, input, select, seg, toggle, confirmBox, draggable, droppable, download, toCsv, printHtml, esc,
  plural, emptyState, initials, clamp, frag,
} from '../lib/ui.js';
import { list, get, can, create, patch, remove, bulk, guestName, coupleNames } from '../lib/store.js';
import { generateOptions, suggestTables, makeAffinity, PRESETS, capacity } from '../lib/seating.js';
import { guestSheet, sideLabel } from './guests.js';

const ui = { mode: localStorage.getItem('wp_seat_mode') || 'floor', zoom: 1, selected: null, q: '', includePending: true, scroll: [0, 0] };
let container;
const SHAPES = [{ value: 'round', label: 'Round' }, { value: 'rect', label: 'Rectangle' }, { value: 'square', label: 'Square' }, { value: 'long', label: 'Head table' }, { value: 'sweetheart', label: 'Sweetheart' }];
const DECOR = [
  { decor: 'dance', name: 'Dance floor', w: 240, h: 200 }, { decor: 'stage', name: 'Stage / band', w: 260, h: 100 },
  { decor: 'dj', name: 'DJ booth', w: 120, h: 70 }, { decor: 'bar', name: 'Bar', w: 220, h: 60 }, { decor: 'cake', name: 'Cake table', w: 90, h: 90, round: true },
  { decor: 'gifts', name: 'Gift table', w: 140, h: 60 }, { decor: 'photo', name: 'Photo booth', w: 120, h: 100 }, { decor: 'entrance', name: 'Entrance', w: 140, h: 30 },
];

const activeGuests = () => list('guest').filter((g) => g.rsvp !== 'no' && (ui.includePending || g.rsvp === 'yes'));
const atTable = (tid) => list('guest').filter((g) => g.table === tid && g.rsvp !== 'no')
  .sort((a, b) => (a.seat ?? 999) - (b.seat ?? 999) || guestName(a).localeCompare(guestName(b)));

function conflictSet() {
  const guests = list('guest');
  const { avoid } = makeAffinity(guests, PRESETS[0].w);
  const bad = new Set();
  for (const t of list('table')) {
    const ids = atTable(t.id).map((g) => g.id);
    for (const a of ids) for (const b of ids) if (a !== b && avoid.get(a)?.has(b)) bad.add(a);
  }
  return bad;
}

async function assign(guestId, tableId) {
  const g = get('guest', guestId);
  const t = tableId && get('table', tableId);
  if (!g) return;
  if (t && atTable(t.id).filter((x) => x.id !== g.id).length >= capacity(t)) {
    if (!(await confirmBox({ title: `${t.name} is full`, message: `Seat ${guestName(g)} there anyway? The table will be over capacity.`, confirm: 'Seat anyway' }))) return;
  }
  const seat = t ? Math.max(-1, ...atTable(t.id).map((x) => x.seat ?? -1)) + 1 : null;
  await patch('guest', guestId, { table: tableId || null, seat });
}

// ------------------------------------------------------------------ geometry
function geometry(t) {
  const n = capacity(t);
  if (t.decor) return { w: t.w || 140, h: t.h || 80, round: !!t.round, seats: [] };
  const S = 36;
  let w; let hh; let round = false; const seats = [];
  if (t.shape === 'round' || !t.shape) {
    round = true;
    w = hh = clamp(62 + n * 7, 80, 200);
    const r = w / 2 + 21;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; seats.push([w / 2 + Math.cos(a) * r, hh / 2 + Math.sin(a) * r]); }
  } else if (t.shape === 'square') {
    const per = Math.ceil(n / 4);
    w = hh = Math.max(90, per * S + 20);
    for (let i = 0; i < n; i++) {
      const side = i % 4; const k = Math.floor(i / 4); const cnt = Math.ceil((n - side) / 4);
      const pos = ((k + 0.5) / cnt);
      seats.push(side === 0 ? [pos * w, -21] : side === 1 ? [w + 21, pos * hh] : side === 2 ? [(1 - pos) * w, hh + 21] : [-21, (1 - pos) * hh]);
    }
  } else if (t.shape === 'long' || t.shape === 'sweetheart') {
    w = Math.max(t.shape === 'sweetheart' ? 90 : 120, n * S + 16); hh = 50;
    for (let i = 0; i < n; i++) seats.push([((i + 0.5) / n) * w, -21]);
  } else {
    const top = Math.ceil(n / 2); const bottom = n - top;
    w = Math.max(100, top * S + 16); hh = 66;
    for (let i = 0; i < top; i++) seats.push([((i + 0.5) / top) * w, -21]);
    for (let i = 0; i < bottom; i++) seats.push([((i + 0.5) / bottom) * w, hh + 21]);
  }
  return { w, h: hh, round, seats };
}

// ------------------------------------------------------------------ floor plan
function floorTable(t, bad, editable) {
  const g = geometry(t);
  const pad = t.decor ? 0 : 40;
  const W = g.w + pad * 2; const H = g.h + pad * 2;
  const guests = atTable(t.id);
  const n = capacity(t);
  const conflict = guests.some((x) => bad.has(x.id));
  const wrap = h('div', { class: ['ftable', t.decor && 'deco', ui.selected === t.id && 'sel'], style: { left: `${(t.x || 0) - W / 2}px`, top: `${(t.y || 0) - H / 2}px`, width: `${W}px`, height: `${H}px` } });
  const shape = h('div', {
    class: ['shape', !t.decor && guests.length === n && 'full', guests.length > n && 'over', conflict && 'conflict'],
    style: { left: `${pad}px`, top: `${pad}px`, width: `${g.w}px`, height: `${g.h}px`, borderRadius: g.round ? '50%' : t.decor ? '10px' : '8px' },
    title: t.decor ? t.name : `${t.name}: ${guests.length}/${n}${t.note ? ` — ${t.note}` : ''}`,
  }, h('div', null, h('div', { class: 'tn' }, t.name), !t.decor && h('div', { class: 'tc' }, `${guests.length}/${n}${t.kids ? ' · kids' : ''}${t.reserved ? ' · 🔒' : ''}`)));
  if (!t.decor) droppable(shape, (p) => p.guest && assign(p.guest, t.id));
  wrap.append(shape);
  g.seats.forEach(([sx, sy], i) => {
    const guest = guests[i];
    const s = h('div', { class: ['seat', guest && 'taken', guest && bad.has(guest.id) && 'bad'], style: { left: `${sx + pad}px`, top: `${sy + pad}px` }, title: guest ? `${guestName(guest)}${guest.dietary?.length ? ` · ${guest.dietary.join(', ')}` : ''}` : 'Empty seat' },
      guest ? initials(guestName(guest)) : '');
    if (guest && editable) draggable(s, { guest: guest.id }, { onClick: () => guestMenu(guest, s) });
    if (!guest && editable) droppable(s, (p) => p.guest && assign(p.guest, t.id));
    wrap.append(s);
  });
  if (editable) moveable(shape, wrap, t);
  else shape.addEventListener('click', () => { ui.selected = t.id; build(); });
  return wrap;
}

function moveable(handle, wrap, t) {
  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const sx = e.clientX; const sy = e.clientY;
    const ox = t.x || 0; const oy = t.y || 0;
    let moved = false;
    const startLeft = parseFloat(wrap.style.left); const startTop = parseFloat(wrap.style.top);
    const mv = (ev) => {
      const dx = (ev.clientX - sx) / ui.zoom; const dy = (ev.clientY - sy) / ui.zoom;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      wrap.style.left = `${startLeft + dx}px`; wrap.style.top = `${startTop + dy}px`;
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (!moved) { ui.selected = ui.selected === t.id ? null : t.id; build(); return; }
      const snap = (v) => Math.round(v / 10) * 10;
      const nx = Math.max(60, snap(ox + (ev.clientX - sx) / ui.zoom)); const ny = Math.max(60, snap(oy + (ev.clientY - sy) / ui.zoom));
      patch('table', t.id, { x: nx, y: ny });
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
}

function floorPlan(bad, editable) {
  const tables = list('table');
  const maxX = Math.max(1200, ...tables.map((t) => (t.x || 0) + 300));
  const maxY = Math.max(800, ...tables.map((t) => (t.y || 0) + 300));
  const inner = h('div', { class: 'floor-inner', style: { width: `${maxX}px`, height: `${maxY}px`, transform: `scale(${ui.zoom})` } }, tables.map((t) => floorTable(t, bad, editable)));
  const outer = h('div', { class: 'floor', onclick: (e) => { if (e.target === outer || e.target === inner) { if (ui.selected) { ui.selected = null; build(); } } } },
    h('div', { style: { width: `${maxX * ui.zoom}px`, height: `${maxY * ui.zoom}px`, position: 'relative' } }, inner));
  outer.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    ui.zoom = clamp(ui.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.35, 2);
    build();
  }, { passive: false });
  return outer;
}

// ------------------------------------------------------------------ unseated pool & chips
function chip(g, bad, editable) {
  const c = h('div', { class: ['gchip', g.locked && 'locked'], title: [guestName(g), g.party, g.group, sideLabel(g.side)].filter(Boolean).join(' · ') },
    h('span', { class: 'dot', style: { background: g.side === 'p1' ? 'var(--accent)' : g.side === 'p2' ? 'var(--blue)' : 'var(--label-3)' } }),
    h('span', { class: 'nm' }, guestName(g), g.rsvp !== 'yes' ? h('span', { class: 'faint' }, ' ?') : ''),
    g.child ? h('span', { class: 'xs faint' }, 'child') : null,
    (g.dietary?.length || g.dietaryNote) ? h('span', { class: 'xs warn', title: [...(g.dietary || []), g.dietaryNote].filter(Boolean).join(', ') }, '●') : null,
    bad.has(g.id) ? icon('alert', 'ic-warn') : null,
    g.locked ? icon('lock', 'faint') : null);
  if (editable) draggable(c, { guest: g.id }, { onClick: () => guestMenu(g, c) });
  else c.addEventListener('click', () => guestSheet(g));
  return c;
}

function guestMenu(g, anchor) {
  const guests = list('guest').filter((x) => x.rsvp !== 'no');
  const sug = suggestTables(g, guests, list('table')).slice(0, 4);
  menu(anchor, [
    { header: guestName(g) },
    ...sug.filter((s) => s.table.id !== g.table).slice(0, 3).map((s) => ({
      label: `${s.table.name} — ${s.friends.length ? `knows ${s.friends.length}` : 'no one they know'}${s.conflict ? ' ⚠️' : ''} · ${Math.max(0, s.free)} free`,
      icon: s.conflict ? 'alert' : s.friends.length ? 'heart' : 'seating', onClick: () => assign(g.id, s.table.id),
    })),
    { label: 'Choose another table…', icon: 'list', onClick: () => menu(anchor, list('table').filter((t) => !t.decor).map((t) => ({ label: `${t.name} (${atTable(t.id).length}/${capacity(t)})`, checked: t.id === g.table, onClick: () => assign(g.id, t.id) }))) },
    '-',
    g.table && { label: g.locked ? 'Unlock seat' : 'Lock at this table', icon: g.locked ? 'unlock' : 'lock', onClick: () => patch('guest', g.id, { locked: !g.locked }) },
    g.table && { label: 'Unseat', icon: 'x', onClick: () => patch('guest', g.id, { table: null, seat: null, locked: false }) },
    { label: 'Guest details…', icon: 'person', onClick: () => guestSheet(g) },
  ]);
}

function pool(bad, editable) {
  const q = ui.q.toLowerCase();
  const unseated = activeGuests().filter((g) => !g.table || !get('table', g.table)).filter((g) => !q || guestName(g).toLowerCase().includes(q) || (g.party || '').toLowerCase().includes(q));
  const byParty = new Map();
  for (const g of unseated) { const k = g.party || (g.plusOneOf ? get('guest', g.plusOneOf)?.party : null) || ''; if (!byParty.has(k)) byParty.set(k, []); byParty.get(k).push(g); }
  const listEl = h('div', { class: 'pool-list' },
    unseated.length ? [...byParty.entries()].sort(([a], [b]) => (a ? 0 : 1) - (b ? 0 : 1) || a.localeCompare(b)).map(([party, gs]) => [
      party ? h('div', { class: 'xs faint', style: { padding: '6px 2px 0' } }, party) : (byParty.size > 1 ? h('div', { class: 'xs faint', style: { padding: '6px 2px 0' } }, 'Others') : null),
      gs.map((g) => chip(g, bad, editable))]) : h('div', { class: 'small muted center', style: { padding: '20px 8px' } }, activeGuests().length ? 'Everyone has a seat 🎉' : 'No guests yet. Add guests first.'));
  if (editable) droppable(listEl, (p) => p.guest && patch('guest', p.guest, { table: null, seat: null, locked: false }));
  return h('div', { class: 'card flush seat-pool' },
    h('div', { style: { padding: '12px 12px 8px', borderBottom: '1px solid var(--sep)' } },
      h('div', { class: 'row between' }, h('b', null, `Unseated (${unseated.length})`), h('label', { class: 'row xs muted', title: 'Include guests who haven’t replied yet' }, 'Awaiting', toggle(ui.includePending, (v) => { ui.includePending = v; build(); }))),
      h('div', { class: 'search mt', style: { marginTop: '8px' } }, icon('search'), input({ placeholder: 'Find guest…', value: ui.q, 'data-k': 'seat-q', oninput: (e) => { ui.q = e.target.value; const pos = e.target.selectionStart; build(); const el = container.querySelector('[data-k="seat-q"]'); el?.focus(); el?.setSelectionRange(pos, pos); } })),
      editable && h('div', { class: 'xs faint', style: { marginTop: '6px' } }, 'Drag guests onto a table, or tap a guest for suggestions.')),
    listEl);
}

// ------------------------------------------------------------------ table cards (list mode)
function tableCards(bad, editable) {
  const tables = list('table').filter((t) => !t.decor);
  return h('div', { class: 'tcards' }, tables.map((t) => {
    const gs = atTable(t.id);
    const tl = h('div', { class: 'tlist', 'data-table': t.id }, gs.map((g) => chip(g, bad, editable)),
      gs.length < capacity(t) ? h('div', { class: 'xs faint', style: { padding: '4px' } }, `${capacity(t) - gs.length} empty seat${capacity(t) - gs.length === 1 ? '' : 's'}`) : null);
    const card = h('div', { class: ['card', gs.some((g) => bad.has(g.id)) && 'conflict'], style: gs.some((g) => bad.has(g.id)) ? { boxShadow: '0 0 0 2px var(--red)' } : null },
      h('div', { class: 'row', style: { marginBottom: '8px' } },
        h('div', { class: 'grow' }, h('b', null, t.name), h('div', { class: 'xs muted' }, `${SHAPES.find((s) => s.value === (t.shape || 'round'))?.label} · ${gs.length}/${capacity(t)}${t.kids ? ' · kids' : ''}${t.reserved ? ' · reserved' : ''}`)),
        h('div', { class: 'progress', style: { width: '50px' } }, h('span', { class: gs.length > capacity(t) ? 'r' : gs.length === capacity(t) ? 'g' : '', style: { width: `${Math.min(100, (gs.length / Math.max(1, capacity(t))) * 100)}%` } })),
        editable && h('button', { class: 'btn plain icon s', 'aria-label': 'Table options', onclick: (e) => tableMenu(t, e.currentTarget) }, icon('more'))),
      tl);
    if (editable) droppable(card, (p) => p.guest && assign(p.guest, t.id));
    return card;
  }));
}

function tableMenu(t, anchor) {
  menu(anchor, [
    { label: 'Edit table…', icon: 'edit', onClick: () => tableSheet(t) },
    { label: 'Duplicate', icon: 'copy', onClick: () => { const { id, _sort, _updated, _by, type, ...d } = t; create('table', { ...d, name: `${t.name} copy`, x: (t.x || 0) + 60, y: (t.y || 0) + 60 }); } },
    !t.decor && { label: 'Clear this table', icon: 'x', onClick: () => bulk(atTable(t.id).filter((g) => !g.locked).map((g) => ({ op: 'patch', type: 'guest', id: g.id, data: { table: null, seat: null } }))) },
    '-',
    { label: 'Delete', icon: 'trash', danger: true, onClick: () => remove('table', t.id, { label: t.name }) },
  ]);
}

function tableSheet(t) {
  const d = { ...t };
  sheet({
    title: t.decor ? t.name : `Table: ${t.name}`, doneLabel: 'Save',
    body: h('div', { class: 'form' },
      field('Name', input({ value: d.name, oninput: (e) => { d.name = e.target.value; } })),
      !t.decor && field('Shape', (() => { const el = seg(SHAPES, d.shape || 'round', (v) => { d.shape = v; el.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', SHAPES[i].value === v)); }); return el; })()),
      !t.decor && field('Seats', input({ type: 'number', min: 1, max: 40, value: d.seats, oninput: (e) => { d.seats = Number(e.target.value); } })),
      t.decor && h('div', { class: 'form-row' }, field('Width', input({ type: 'number', value: d.w, oninput: (e) => { d.w = Number(e.target.value); } })), field('Depth', input({ type: 'number', value: d.h, oninput: (e) => { d.h = Number(e.target.value); } }))),
      !t.decor && h('div', { class: 'list' },
        h('label', { class: 'list-item' }, h('div', { class: 'grow' }, 'Reserved', h('div', { class: 'xs muted' }, 'Auto-arrange leaves this table alone (head table, family).')), toggle(!!d.reserved, (v) => { d.reserved = v; })),
        h('label', { class: 'list-item' }, h('div', { class: 'grow' }, 'Kids’ table', h('div', { class: 'xs muted' }, 'Auto-arrange seats children here.')), toggle(!!d.kids, (v) => { d.kids = v; }))),
      field('Note', input({ value: d.note || '', placeholder: 'e.g. near the dance floor', oninput: (e) => { d.note = e.target.value; } }))),
    done: () => patch('table', t.id, { name: d.name, shape: d.shape, seats: d.seats, reserved: !!d.reserved, kids: !!d.kids, note: d.note || null, w: d.w, h: d.h }),
  });
}

function addTablesSheet() {
  const d = { count: 8, shape: 'round', seats: 10, prefix: 'Table', start: list('table').filter((t) => !t.decor).length + 1 };
  const guestsNeeding = activeGuests().length;
  const seatsNow = list('table').filter((t) => !t.decor).reduce((s, t) => s + capacity(t), 0);
  if (guestsNeeding > seatsNow) d.count = Math.max(1, Math.ceil((guestsNeeding - seatsNow) / d.seats));
  const s = sheet({
    title: 'Add tables', doneLabel: 'Add',
    body: h('div', { class: 'form' },
      h('div', { class: 'small muted' }, `${guestsNeeding} guests to seat · ${seatsNow} seats so far.`),
      field('Shape', (() => { const el = seg(SHAPES.slice(0, 3), d.shape, (v) => { d.shape = v; el.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', SHAPES[i].value === v)); }); return el; })()),
      h('div', { class: 'form-row' },
        field('How many', input({ type: 'number', min: 1, max: 60, value: d.count, oninput: (e) => { d.count = Number(e.target.value); } })),
        field('Seats each', input({ type: 'number', min: 1, max: 30, value: d.seats, oninput: (e) => { d.seats = Number(e.target.value); } }))),
      h('div', { class: 'form-row' },
        field('Name', input({ value: d.prefix, oninput: (e) => { d.prefix = e.target.value; } })),
        field('Start numbering at', input({ type: 'number', value: d.start, oninput: (e) => { d.start = Number(e.target.value); } }))),
      h('div', { class: 'section-h' }, 'Special tables & floor items'),
      h('div', { class: 'chips' },
        h('button', { class: 'chip', onclick: () => { s.close(); addSpecial({ name: 'Head table', shape: 'long', seats: 8, reserved: true }); } }, '+ Head table'),
        h('button', { class: 'chip', onclick: () => { s.close(); addSpecial({ name: 'Sweetheart table', shape: 'sweetheart', seats: 2, reserved: true }); } }, '+ Sweetheart table'),
        h('button', { class: 'chip', onclick: () => { s.close(); addSpecial({ name: 'Kids’ table', shape: 'rect', seats: 10, kids: true }); } }, '+ Kids’ table'),
        DECOR.map((x) => h('button', { class: 'chip', onclick: () => { s.close(); addSpecial({ ...x }); } }, `+ ${x.name}`)))),
    done: async () => {
      const existing = list('table');
      const startY = existing.length ? Math.max(...existing.map((t) => t.y || 0)) + 240 : 160;
      const ops = [];
      for (let i = 0; i < d.count; i++) {
        ops.push({ op: 'create', type: 'table', data: { name: `${d.prefix} ${d.start + i}`.trim(), shape: d.shape, seats: d.seats, x: 170 + (i % 5) * 250, y: startY + Math.floor(i / 5) * 240, _sort: Date.now() / 1e6 + i / 1e6 } });
      }
      await bulk(ops, `added ${d.count} tables`);
      toast(`Added ${plural(d.count, 'table')}`);
    },
  });
}

function addSpecial(data) {
  const existing = list('table');
  const y = existing.length ? Math.min(...existing.map((t) => t.y || 0)) : 120;
  create('table', { ...data, x: 160 + Math.round(Math.random() * 400), y: Math.max(80, y - (existing.length ? 150 : 0)) });
}

// ------------------------------------------------------------------ auto-arrange
function autoSheet() {
  let keep = false;
  let chosen = 0;
  let options = null;
  const out = h('div', { class: 'col' });
  const tables = () => list('table').filter((t) => !t.decor);
  const draw = () => {
    const guests = activeGuests();
    const seats = tables().filter((t) => !t.reserved).reduce((s, t) => s + capacity(t), 0) + tables().filter((t) => t.reserved).reduce((s, t) => s + atTable(t.id).length, 0);
    const relations = guests.filter((g) => g.knows?.length || g.avoid?.length || g.party).length;
    out.replaceChildren(frag(
      h('div', { class: 'list' },
        h('label', { class: 'list-item' }, h('div', { class: 'grow' }, 'Include guests awaiting a reply'), toggle(ui.includePending, (v) => { ui.includePending = v; options = null; draw(); })),
        h('label', { class: 'list-item' }, h('div', { class: 'grow' }, 'Keep guests who already have a seat', h('div', { class: 'xs muted' }, 'Off: rearrange everyone except locked guests and reserved tables.')), toggle(keep, (v) => { keep = v; options = null; draw(); }))),
      h('div', { class: 'small muted' }, `${guests.length} guests · ${seats} seats at ${plural(tables().length, 'table')}. Households stay together, “keep apart” pairs are separated${relations < guests.length / 3 ? '. Tip: add who knows whom in each guest’s details for better results.' : '.'}`),
      guests.length > seats ? h('div', { class: 'card', style: { background: 'rgba(255,59,48,.08)', boxShadow: 'none' } }, h('b', { class: 'neg' }, `Not enough seats: ${guests.length - seats} short. `),
        h('button', { class: 'btn s tinted', onclick: () => addTablesSheet() }, 'Add tables')) : null,
      !options ? h('button', { class: 'btn primary l', disabled: !tables().length || !guests.length, onclick: (e) => {
        e.target.textContent = 'Working out the best seating…'; e.target.disabled = true;
        setTimeout(() => { options = generateOptions({ guests, tables: list('table'), keepExisting: keep }); chosen = options.reduce((bi, o, i, arr) => (o.stats.happiness > arr[bi].stats.happiness ? i : bi), 0); draw(); }, 30);
      } }, icon('wand'), 'Suggest seating plans') : [
        h('div', { class: 'grid c3' }, options.map((o, i) => h('div', { class: ['card opt-card', i === chosen && 'on'], style: { background: 'var(--card-2)' }, onclick: () => { chosen = i; draw(); } },
          h('div', { class: 'row between' }, h('b', null, o.preset.name), i === chosen ? h('span', { class: 'chip accent' }, 'Selected') : null),
          h('div', { class: 'xs muted', style: { margin: '4px 0 10px' } }, o.preset.desc),
          h('div', { class: 'row wrap', style: { gap: '6px' } },
            h('span', { class: 'chip green' }, `${o.stats.happiness}% sit with someone they know`),
            o.stats.conflicts ? h('span', { class: 'chip red' }, `${o.stats.conflicts} conflicts`) : h('span', { class: 'chip' }, 'No conflicts'),
            o.unseated.length ? h('span', { class: 'chip orange' }, `${o.unseated.length} without a seat`) : null)))),
        h('div', { class: 'section-h' }, `Preview: ${options[chosen].preset.name}`),
        h('div', { class: 'mini-tables' }, tables().map((t) => {
          const ids = [...options[chosen].assign.entries()].filter(([, tid]) => tid === t.id).map(([gid]) => get('guest', gid)).filter(Boolean);
          return h('div', { class: 'mini-table' }, h('b', null, `${t.name} (${ids.length}/${capacity(t)})`), h('div', { class: 'muted' }, ids.map((g) => guestName(g)).join(', ') || '—'));
        })),
        h('button', { class: 'btn plain', onclick: () => { options = null; draw(); } }, icon('refresh'), 'Start over')],
    ));
  };
  draw();
  sheet({
    title: 'Auto-arrange seating', size: 'wide', body: out, doneLabel: 'Apply plan',
    done: async () => {
      if (!options) { toast('Generate a plan first', { error: true }); return false; }
      const o = options[chosen];
      const ops = [];
      const counters = new Map();
      for (const g of activeGuests()) {
        const tid = o.assign.get(g.id) || null;
        const seat = tid ? (counters.set(tid, (counters.get(tid) ?? -1) + 1), counters.get(tid)) : null;
        if (g.table !== tid || g.seat !== seat) ops.push({ op: 'patch', type: 'guest', id: g.id, data: { table: tid, seat } });
      }
      await bulk(ops, `applied the “${o.preset.name}” seating plan`);
      toast('Seating plan applied');
    },
  });
}

// ------------------------------------------------------------------ export
function exportMenu(anchor) {
  const tables = list('table').filter((t) => !t.decor);
  const title = coupleNames();
  menu(anchor, [
    { label: 'Download CSV', icon: 'download', onClick: () => download('seating-plan.csv', toCsv([['Table', 'Seat', 'Guest', 'Household', 'Meal', 'Dietary', 'Kitchen notes'],
      ...tables.flatMap((t) => atTable(t.id).map((g, i) => [t.name, i + 1, guestName(g), g.party, g.meal, (g.dietary || []).join('; '), g.dietaryNote]))]), 'text/csv') },
    { label: 'Print table plan', icon: 'print', onClick: () => printHtml('Table plan', `<h1>${esc(title)}</h1><div class="muted">Table plan</div><div class="grid" style="margin-top:16px">${tables.map((t) => `<div class="box"><b>${esc(t.name)}</b> <span class="muted">(${atTable(t.id).length})</span><ol style="margin:6px 0 0;padding-left:18px">${atTable(t.id).map((g) => `<li>${esc(guestName(g))}</li>`).join('')}</ol></div>`).join('')}</div>`) },
    { label: 'Print “find your seat” list (A–Z)', icon: 'list', onClick: () => {
      const rows = list('guest').filter((g) => g.table && get('table', g.table)).sort((a, b) => `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`));
      printHtml('Find your seat', `<h1 style="text-align:center;font-family:'Cormorant Garamond',serif">${esc(title)}</h1><p class="muted" style="text-align:center">Please find your seat</p><div style="columns:3;column-gap:28px;margin-top:20px">${rows.map((g) => `<div style="display:flex;justify-content:space-between;border-bottom:1px dotted #ccc;padding:4px 0;break-inside:avoid"><span>${esc(g.last ? `${g.last}, ${g.first}` : guestName(g))}</span><b>${esc(get('table', g.table).name)}</b></div>`).join('')}</div>`);
    } },
    { label: 'Print place cards', icon: 'invite', onClick: () => {
      const rows = tables.flatMap((t) => atTable(t.id).map((g) => ({ g, t })));
      printHtml('Place cards', `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0">${rows.map(({ g, t }) => `<div style="height:62mm;border:1px dashed #ccc;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding-bottom:10mm;break-inside:avoid"><div style="font-family:'Great Vibes',cursive;font-size:30pt">${esc(guestName(g))}</div><div style="font-family:'Cormorant Garamond',serif;font-size:13pt;letter-spacing:.15em;text-transform:uppercase;margin-top:4px">${esc(t.name)}</div></div>`).join('')}</div>`, '@page{margin:10mm}');
    } },
    { label: 'Print kitchen sheet (meals & diets by table)', icon: 'menu_food', onClick: () => printHtml('Kitchen sheet', `<h1>${esc(title)}</h1><div class="muted">Meals and dietary needs by table</div>
      <table style="margin-top:14px"><tr><th>Table</th><th>Guests</th><th>Meals</th><th>Dietary needs</th></tr>${tables.map((t) => {
        const gs = atTable(t.id); const meals = {};
        gs.forEach((g) => { if (g.meal) meals[g.meal] = (meals[g.meal] || 0) + 1; });
        return `<tr><td><b>${esc(t.name)}</b></td><td>${gs.length}</td><td>${Object.entries(meals).map(([m, n]) => `${n}× ${esc(m)}`).join('<br>')}</td><td>${gs.filter((g) => g.dietary?.length || g.dietaryNote).map((g) => `${esc(guestName(g))}: ${esc([...(g.dietary || []), g.dietaryNote].filter(Boolean).join(', '))}`).join('<br>')}</td></tr>`;
      }).join('')}</table>`) },
    { label: 'Print floor plan', icon: 'seating', onClick: () => { if (ui.mode !== 'floor') { ui.mode = 'floor'; build(); } setTimeout(() => window.print(), 100); } },
  ]);
}

// ------------------------------------------------------------------ view
function build() {
  if (!container) return;
  const oldFloor = container.querySelector('.floor');
  if (oldFloor) ui.scroll = [oldFloor.scrollLeft, oldFloor.scrollTop];
  const editable = can('seating', 'edit');
  const tables = list('table').filter((t) => !t.decor);
  const guests = activeGuests();
  const seated = guests.filter((g) => g.table && get('table', g.table)).length;
  const seats = tables.reduce((s, t) => s + capacity(t), 0);
  const bad = conflictSet();
  const sel = ui.selected && get('table', ui.selected);

  const head = h('div', { class: 'page-head' },
    h('div', null, h('h1', null, 'Seating'), h('div', { class: 'sub' }, `${seated} of ${guests.length} guests seated · ${seats} seats at ${plural(tables.length, 'table')}`,
      bad.size ? h('span', { class: 'neg' }, ` · ${bad.size} guests seated with someone to keep apart`) : '')),
    h('div', { class: 'actions' },
      seg([{ value: 'floor', label: 'Floor plan', icon: 'seating' }, { value: 'list', label: 'Tables', icon: 'grid' }], ui.mode, (v) => { ui.mode = v; localStorage.setItem('wp_seat_mode', v); build(); }),
      h('button', { class: 'btn', onclick: (e) => exportMenu(e.currentTarget) }, icon('download'), h('span', { class: 'hide-m' }, 'Export')),
      editable && h('button', { class: 'btn', onclick: addTablesSheet }, icon('plus'), h('span', { class: 'hide-m' }, 'Tables')),
      editable && h('button', { class: 'btn primary', onclick: autoSheet, disabled: !tables.length }, icon('wand'), 'Auto-arrange')));

  if (!list('table').length) {
    container.replaceChildren(head, emptyState('seating', 'Set up your tables', 'Add tables in the shapes and sizes your venue has. Then drag guests onto them, or let MyWedPlan suggest a seating plan based on who knows whom.',
      editable && h('button', { class: 'btn primary', onclick: addTablesSheet }, icon('plus'), 'Add tables')));
    return;
  }

  const inspector = sel ? h('div', { class: 'card no-print', style: { marginBottom: '12px' } },
    h('div', { class: 'row wrap' },
      h('div', { class: 'grow' }, h('b', null, sel.name), !sel.decor && h('span', { class: 'muted small' }, ` · ${atTable(sel.id).length}/${capacity(sel)} seated${sel.note ? ` · ${sel.note}` : ''}`)),
      editable && h('button', { class: 'btn s', onclick: () => tableSheet(sel) }, icon('edit'), 'Edit'),
      editable && h('button', { class: 'btn s', onclick: (e) => tableMenu(sel, e.currentTarget) }, icon('more')),
      h('button', { class: 'btn s icon', 'aria-label': 'Close', onclick: () => { ui.selected = null; build(); } }, icon('x'))),
    !sel.decor && atTable(sel.id).length ? h('div', { class: 'chips', style: { marginTop: '10px' } }, atTable(sel.id).map((g) => chip(g, bad, editable))) : null) : null;

  const main = ui.mode === 'floor'
    ? h('div', null, inspector,
      h('div', { class: 'row no-print', style: { marginBottom: '8px', justifyContent: 'flex-end' } },
        h('span', { class: 'xs faint grow' }, editable ? 'Drag tables to arrange the room. Drag guests between seats. Ctrl/⌘ + scroll to zoom.' : ''),
        h('button', { class: 'btn s icon', 'aria-label': 'Zoom out', onclick: () => { ui.zoom = clamp(ui.zoom / 1.2, 0.35, 2); build(); } }, icon('zoomout')),
        h('span', { class: 'xs muted num', style: { width: '40px', textAlign: 'center' } }, `${Math.round(ui.zoom * 100)}%`),
        h('button', { class: 'btn s icon', 'aria-label': 'Zoom in', onclick: () => { ui.zoom = clamp(ui.zoom * 1.2, 0.35, 2); build(); } }, icon('zoomin'))),
      floorPlan(bad, editable))
    : h('div', null, tableCards(bad, editable));

  container.replaceChildren(head, h('div', { class: 'seat-layout' }, pool(bad, editable), main));
  const floor = container.querySelector('.floor');
  if (floor) { floor.scrollLeft = ui.scroll[0]; floor.scrollTop = ui.scroll[1]; }
}

export default {
  title: 'Seating',
  manual: true,
  render() {
    container = h('div');
    build();
    return container;
  },
  refresh() { build(); },
};
