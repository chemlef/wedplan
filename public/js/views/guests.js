import {
  h, icon, sheet, menu, toast, field, input, select, seg, toggle, confirmBox, tagInput, download, toCsv, parseCsv, pickFile,
  copyText, plural, emptyState, initials, fmtDate, promptBox,
} from '../lib/ui.js';
import { store, list, get, can, create, patch, remove, bulk, guestName, rsvpLink, coupleNames } from '../lib/store.js';
import { fill, emailHtml, buildEml, zip, safeFile } from '../lib/mailexport.js';
import { DIETARY, DIET_TAGS, GUEST_GROUPS } from '../lib/templates.js';

const ui = { q: '', rsvp: 'all', side: '', group: '', diet: '', sort: 'name', dir: 1, selected: new Set() };

export const sideLabel = (v) => (v === 'p1' ? store.wedding.partner1 || 'Partner 1' : v === 'p2' ? store.wedding.partner2 || 'Partner 2' : v === 'both' ? 'Both' : '');
export const sideOptions = () => [{ value: '', label: '—' }, { value: 'p1', label: store.wedding.partner1 || 'Partner 1' }, { value: 'p2', label: store.wedding.partner2 || 'Partner 2' }, { value: 'both', label: 'Both' }];
const mealNames = () => (store.wedding.mealOptions || []).map((m) => (typeof m === 'string' ? m : m.name)).filter(Boolean);
const groups = () => [...new Set([...GUEST_GROUPS, ...list('guest').map((g) => g.group).filter(Boolean)])];
const parties = () => [...new Set(list('guest').map((g) => g.party).filter(Boolean))].sort();
export const rsvpChip = (r) => h('span', { class: ['chip', r === 'yes' ? 'green' : r === 'no' ? 'red' : 'orange'] }, r === 'yes' ? 'Attending' : r === 'no' ? 'Declined' : 'Awaiting');

function filtered() {
  const q = ui.q.toLowerCase();
  let gs = list('guest').filter((g) => {
    if (q && !`${guestName(g)} ${g.email || ''} ${g.phone || ''} ${g.party || ''} ${g.group || ''} ${g.notes || ''}`.toLowerCase().includes(q)) return false;
    if (ui.rsvp !== 'all' && (g.rsvp || 'pending') !== ui.rsvp) return false;
    if (ui.side && g.side !== ui.side) return false;
    if (ui.group && g.group !== ui.group) return false;
    if (ui.diet === '__any' && !(g.dietary?.length || g.dietaryNote)) return false;
    if (ui.diet && ui.diet !== '__any' && !(g.dietary || []).includes(ui.diet)) return false;
    return true;
  });
  const tables = Object.fromEntries(list('table').map((t) => [t.id, t.name]));
  const key = {
    name: (g) => `${g.last || ''} ${g.first || ''}`.toLowerCase(),
    first: (g) => `${g.first || ''} ${g.last || ''}`.toLowerCase(),
    group: (g) => `${g.group || 'zz'} ${g.party || ''}`.toLowerCase(),
    rsvp: (g) => ({ yes: 0, pending: 1, no: 2 }[g.rsvp || 'pending']),
    table: (g) => tables[g.table] || 'zzz',
    side: (g) => g.side || 'z',
  }[ui.sort] || ((g) => guestName(g));
  gs = gs.sort((a, b) => { const x = key(a); const y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * ui.dir; });
  return gs;
}

// ------------------------------------------------------------------ guest picker (multi-select by search)
export function guestPicker(selected, onChange, { exclude = [], placeholder = 'Search guests…' } = {}) {
  let ids = [...(selected || [])];
  const wrap = h('div', { class: 'col gap-s' });
  const chips = h('div', { class: 'chips' });
  const inp = input({ class: 'input s', placeholder });
  const drop = h('div', { class: 'list', style: { display: 'none', maxHeight: '220px', overflowY: 'auto', boxShadow: 'var(--shadow-2)' } });
  const draw = () => {
    chips.replaceChildren(...ids.map((id) => get('guest', id)).filter(Boolean).map((g) => h('span', { class: 'chip accent' }, guestName(g),
      h('button', { class: 'btn plain s', style: { height: '18px', padding: '0 2px' }, 'aria-label': `Remove ${guestName(g)}`, onclick: () => { ids = ids.filter((x) => x !== g.id); onChange(ids); draw(); } }, '×'))));
  };
  const search = () => {
    const q = inp.value.trim().toLowerCase();
    if (!q) { drop.style.display = 'none'; return; }
    const res = list('guest').filter((g) => !ids.includes(g.id) && !exclude.includes(g.id) && guestName(g).toLowerCase().includes(q)).slice(0, 8);
    drop.replaceChildren(...(res.length ? res.map((g) => h('div', { class: 'list-item tap', style: { minHeight: '38px', padding: '7px 12px' }, onmousedown: (e) => {
      e.preventDefault(); ids.push(g.id); onChange(ids); inp.value = ''; drop.style.display = 'none'; draw();
    } }, h('span', { class: 'grow' }, guestName(g)), h('span', { class: 'xs muted' }, g.party || g.group || ''))) : [h('div', { class: 'list-empty small' }, 'No matches')]));
    drop.style.display = 'block';
  };
  inp.addEventListener('input', search);
  inp.addEventListener('blur', () => setTimeout(() => { drop.style.display = 'none'; }, 150));
  draw();
  wrap.append(chips, inp, drop);
  return wrap;
}

// ------------------------------------------------------------------ guest editor
export function guestSheet(existing, defaults = {}) {
  const g = existing ? structuredClone(existing) : { rsvp: 'pending', side: '', group: '', dietary: [], knows: [], avoid: [], ...defaults };
  const editable = can('guests', 'edit');
  const set = (k) => (e) => { g[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; };
  const meals = mealNames();
  const tables = list('table').filter((t) => !t.decor);
  const partyList = h('datalist', { id: 'party-list' }, parties().map((p) => h('option', { value: p })));
  const groupList = h('datalist', { id: 'group-list' }, groups().map((p) => h('option', { value: p })));
  let rsvpSeg;
  const drawRsvp = () => { const n = seg([{ value: 'pending', label: 'Awaiting' }, { value: 'yes', label: 'Attending' }, { value: 'no', label: 'Declined' }], g.rsvp || 'pending', (v) => { g.rsvp = v; drawRsvp(); }); rsvpSeg?.replaceWith(n); rsvpSeg = n; };
  drawRsvp();
  let sideSeg;
  const drawSide = () => { const n = seg(sideOptions().slice(1), g.side, (v) => { g.side = g.side === v ? '' : v; drawSide(); }); sideSeg?.replaceWith(n); sideSeg = n; };
  drawSide();

  const body = h('div', { class: 'form' },
    h('div', { class: 'form-row' }, field('First name', input({ value: g.first || '', oninput: set('first'), autocomplete: 'off' })), field('Last name', input({ value: g.last || '', oninput: set('last'), autocomplete: 'off' }))),
    h('div', { class: 'form-row' }, field('Email', input({ type: 'email', value: g.email || '', oninput: set('email') })), field('Phone', input({ type: 'tel', value: g.phone || '', oninput: set('phone') }))),
    field('Address', input({ value: g.address || '', oninput: set('address'), placeholder: 'For printed invitations' })),
    field('Guest of', sideSeg),
    h('div', { class: 'form-row' },
      field('Group', h('span', null, input({ value: g.group || '', oninput: set('group'), list: 'group-list', placeholder: 'Family, Friends, Work…' }), groupList)),
      field('Household / invitation', h('span', null, input({ value: g.party || '', oninput: set('party'), list: 'party-list', placeholder: 'e.g. Papadopoulos family' }), partyList), 'People in the same household share one invitation and RSVP together.')),
    h('div', { class: 'list' },
      h('label', { class: 'list-item' }, h('span', { class: 'grow' }, 'Can bring a plus-one'), toggle(!!g.plusOne, (v) => { g.plusOne = v; })),
      h('label', { class: 'list-item' }, h('span', { class: 'grow' }, 'Child'), toggle(!!g.child, (v) => { g.child = v; })),
      h('label', { class: 'list-item' }, h('span', { class: 'grow' }, 'VIP / immediate family'), toggle(!!g.vip, (v) => { g.vip = v; }))),
    h('div', { class: 'section-h' }, 'RSVP & food'),
    field('RSVP', rsvpSeg),
    meals.length ? field('Meal choice', select([{ value: '', label: '—' }, ...meals], g.meal || '', (v) => { g.meal = v; })) : null,
    field('Dietary needs', h('div', { class: 'chips' }, DIETARY.map((d) => {
      const b = h('button', { type: 'button', class: ['chip', (g.dietary || []).includes(d) && 'on'], onclick: () => {
        g.dietary = (g.dietary || []).includes(d) ? g.dietary.filter((x) => x !== d) : [...(g.dietary || []), d];
        b.classList.toggle('on');
      } }, d);
      return b;
    }))),
    field('Allergies or notes for the kitchen', input({ value: g.dietaryNote || '', oninput: set('dietaryNote'), placeholder: 'e.g. severe peanut allergy' })),
    h('div', { class: 'section-h' }, 'Seating preferences'),
    field('Knows / wants to sit with', guestPicker(g.knows, (v) => { g.knows = v; }, { exclude: [g.id] }), 'Used by automatic seating to put friends together.'),
    field('Keep apart from', guestPicker(g.avoid, (v) => { g.avoid = v; }, { exclude: [g.id] }), 'They won’t be seated at the same table.'),
    tables.length ? h('div', { class: 'form-row' },
      field('Table', select([{ value: '', label: 'Not seated' }, ...tables.map((t) => ({ value: t.id, label: t.name }))], g.table || '', (v) => { g.table = v || null; })),
      field('Keep at this table', h('div', { style: { paddingTop: '6px' } }, toggle(!!g.locked, (v) => { g.locked = v; })), 'Auto-arrange won’t move them.')) : null,
    h('div', { class: 'section-h' }, 'Gifts & notes'),
    h('div', { class: 'form-row' }, field('Gift', input({ value: g.gift || '', oninput: set('gift'), placeholder: 'What they gave' })),
      field('Thank-you sent', h('div', { style: { paddingTop: '6px' } }, toggle(!!g.thanked, (v) => { g.thanked = v; })))),
    field('Notes', h('textarea', { class: 'input', rows: 3, oninput: set('notes') }, g.notes || '')),
    existing && g.token ? h('div', { class: 'list' },
      h('div', { class: 'list-item tap', onclick: () => copyText(rsvpLink(g), 'RSVP link copied') }, icon('link', 'faint'), h('span', { class: 'grow' }, 'Copy personal RSVP link'), h('span', { class: 'xs muted' }, g.emailedAt ? `Emailed ${fmtDate(new Date(g.emailedAt).toISOString().slice(0, 10), 'short')}` : '')),
      h('a', { class: 'list-item tap', href: rsvpLink(g), target: '_blank', style: { color: 'inherit', textDecoration: 'none' } }, icon('eye', 'faint'), h('span', { class: 'grow' }, 'Open their invitation')),
      h('div', { class: 'list-item tap', onclick: () => emailSheet([existing]) }, icon('invite', 'faint'), h('span', { class: 'grow' }, 'Prepare an email draft'))) : null,
    g.rsvpMessage ? h('div', { class: 'card', style: { background: 'var(--fill-3)', boxShadow: 'none' } }, h('div', { class: 'label' }, 'Message with their RSVP'), h('p', { class: 'serif', style: { fontSize: '17px', marginTop: '4px' } }, `“${g.rsvpMessage}”`)) : null);

  const s = sheet({
    title: existing ? guestName(existing) : 'New guest',
    body,
    doneLabel: existing ? 'Save' : 'Add',
    done: editable ? async () => {
      if (!(g.first || g.last || '').trim()) { toast('Enter a name', { error: true }); return false; }
      const { id, token, type, _sort, _updated, _by, ...data } = g;
      data.first = (data.first || '').trim(); data.last = (data.last || '').trim();
      data.party = (data.party || '').trim() || null; data.group = (data.group || '').trim() || null;
      if (!data.table) { data.table = null; data.seat = null; }
      if (existing) {
        if (data.rsvp !== existing.rsvp) data.rsvpAt = Date.now();
        // Keep relationships symmetric
        await syncRelations(existing.id, existing, data);
        await patch('guest', existing.id, data);
        toast('Saved');
      } else {
        const rec = await create('guest', data);
        await syncRelations(rec.id, {}, data);
        toast(`${guestName(rec)} added`, { action: { label: 'Add another', onClick: () => guestSheet(null, { side: data.side, group: data.group, party: data.party }) } });
      }
    } : null,
    footer: existing && editable ? [h('button', { class: 'btn danger', onclick: async () => {
      if (await confirmBox({ title: `Delete ${guestName(existing)}?`, confirm: 'Delete', destructive: true })) { s.close(); remove('guest', existing.id, { label: guestName(existing) }); }
    } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
  if (!editable) s.el.querySelectorAll('input,select,textarea,.chip,.seg button').forEach((x) => { x.disabled = true; });
}

async function syncRelations(id, before, after) {
  const ops = [];
  for (const key of ['knows', 'avoid']) {
    const was = new Set(before[key] || []); const now = new Set(after[key] || []);
    for (const other of now) if (!was.has(other)) { const o = get('guest', other); if (o && !(o[key] || []).includes(id)) ops.push({ op: 'patch', type: 'guest', id: other, data: { [key]: [...(o[key] || []), id] } }); }
    for (const other of was) if (!now.has(other)) { const o = get('guest', other); if (o && (o[key] || []).includes(id)) ops.push({ op: 'patch', type: 'guest', id: other, data: { [key]: o[key].filter((x) => x !== id) } }); }
  }
  if (ops.length) await bulk(ops);
}

// ------------------------------------------------------------------ email
const TEMPLATES = {
  invite: { label: 'Invitation with RSVP', subject: 'You’re invited: {couple}', body: 'Dear {first},\n\nWe would love for you to celebrate our wedding with us on {date}.\n\nPlease let us know if you can make it using your personal link below.\n\nWith love,\n{couple}' },
  savedate: { label: 'Save the date', subject: 'Save the date — {couple}', body: 'Dear {first},\n\nWe’re getting married! Please save the date: {date}.\n\nA formal invitation will follow.\n\n{couple}' },
  reminder: { label: 'RSVP reminder', subject: 'A gentle reminder to RSVP', body: 'Hi {first},\n\nWe’re finalising numbers for {date} and haven’t heard from you yet. Could you let us know if you’re coming? It only takes a minute.\n\nThank you!\n{couple}' },
  info: { label: 'Information update', subject: 'Wedding update from {couple}', body: 'Hi {first},\n\n\n\nSee you soon,\n{couple}' },
  thanks: { label: 'Thank you', subject: 'Thank you from {couple}', body: 'Dear {first},\n\nThank you so much for celebrating with us and for your generous gift. It meant the world to us.\n\nWith love,\n{couple}' },
};
export function emailSheet(guests) {
  const withEmail = guests.filter((g) => g.email);
  const st = { tpl: 'invite', ...TEMPLATES.invite, includeLink: true, from: '', markSent: true };
  const subj = input({ value: st.subject, oninput: (e) => { st.subject = e.target.value; } });
  const bodyEl = h('textarea', { class: 'input', rows: 9, oninput: (e) => { st.body = e.target.value; } }, st.body);
  const linkToggle = toggle(st.includeLink, (v) => { st.includeLink = v; });
  const w = store.wedding;
  const couple = coupleNames();
  const vars = (g) => ({
    first: g.first || g.name || '', last: g.last || '', name: guestName(g), couple,
    date: w.date ? fmtDate(w.date, 'long') : '', venue: w.ceremony?.name || '', rsvp_link: rsvpLink(g),
  });
  const render = (g) => {
    const v = vars(g);
    const text = fill(st.body, v) + (st.includeLink ? `\n\nView the invitation and RSVP: ${v.rsvp_link}` : '');
    return { subject: fill(st.subject, v), text, html: emailHtml({ body: fill(st.body, v), link: st.includeLink ? v.rsvp_link : null, accent: w.accent, couple }) };
  };
  const mark = () => {
    if (!st.markSent || !can('guests', 'edit')) return;
    const ts = Date.now();
    bulk(withEmail.map((g) => ({ op: 'patch', type: 'guest', id: g.id, data: { emailedAt: ts, emailKind: st.tpl } })), `prepared ${withEmail.length} ${TEMPLATES[st.tpl].label.toLowerCase()} emails`);
  };
  const exportEml = () => {
    if (!withEmail.length) return toast('None of these guests has an email address', { error: true });
    const used = new Set();
    const files = withEmail.map((g) => {
      const r = render(g);
      let name = safeFile(guestName(g)); let i = 2;
      while (used.has(name)) name = `${safeFile(guestName(g))}-${i++}`;
      used.add(name);
      return { name: `${name}.eml`, data: buildEml({ to: g.email, toName: guestName(g), from: st.from || null, ...r }) };
    });
    download(`${safeFile(TEMPLATES[st.tpl].label)}-drafts.zip`, zip(files));
    mark();
    toast(`${plural(files.length, 'draft')} downloaded`);
  };
  const exportMerge = () => {
    download(`${safeFile(TEMPLATES[st.tpl].label)}-mail-merge.csv`, toCsv([
      ['Email', 'First name', 'Last name', 'Full name', 'Household', 'Subject', 'Message', 'RSVP link'],
      ...guests.map((g) => { const r = render(g); return [g.email, g.first, g.last, guestName(g), g.party, r.subject, r.text, rsvpLink(g)]; }),
    ]), 'text/csv');
    mark();
    toast('Mail-merge file downloaded');
  };
  sheet({
    title: 'Prepare emails', size: 'wide',
    body: h('div', { class: 'form' },
      h('div', { class: 'small muted' }, `${plural(withEmail.length, 'guest')} with an email address${guests.length - withEmail.length ? ` · ${guests.length - withEmail.length} without one (included in the mail-merge file only)` : ''}. MyWedPlan doesn’t send email: download drafts to send from your own mail account.`),
      field('Template', select(Object.entries(TEMPLATES).map(([value, t]) => ({ value, label: t.label })), st.tpl, (v) => {
        st.tpl = v; st.subject = TEMPLATES[v].subject; st.body = TEMPLATES[v].body; subj.value = st.subject; bodyEl.value = st.body;
        st.includeLink = v !== 'thanks'; linkToggle.querySelector('input').checked = st.includeLink;
      })),
      field('Subject', subj),
      field('Message', bodyEl, 'Placeholders: {first} {name} {couple} {date} {venue} {rsvp_link}'),
      h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Add a “View invitation & RSVP” button with each guest’s personal link'), linkToggle),
      field('From (optional)', input({ type: 'email', placeholder: 'your@email.com — otherwise your mail app picks it', oninput: (e) => { st.from = e.target.value.trim(); } })),
      can('guests', 'edit') && h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Mark these guests as emailed'), toggle(st.markSent, (v) => { st.markSent = v; })),
      h('div', { class: 'grid c2' },
        h('div', { class: 'card', style: { background: 'var(--card-2)' } },
          h('div', { class: 'card-title' }, icon('invite'), 'Email drafts (.eml)'),
          h('p', { class: 'small muted', style: { margin: '6px 0 12px' } }, 'A ZIP with one ready-to-send draft per guest. Double-click a draft to open it in Apple Mail, Outlook or Thunderbird, then press Send.'),
          h('button', { class: 'btn primary', onclick: exportEml, disabled: !withEmail.length }, icon('download'), `Download ${plural(withEmail.length, 'draft')}`)),
        h('div', { class: 'card', style: { background: 'var(--card-2)' } },
          h('div', { class: 'card-title' }, icon('list'), 'Mail merge (.csv)'),
          h('p', { class: 'small muted', style: { margin: '6px 0 12px' } }, 'One row per guest with the personalised subject, message and RSVP link. Use it with Word mail merge, Outlook, or Gmail add-ons such as YAMM or GMass.'),
          h('button', { class: 'btn', onclick: exportMerge }, icon('download'), 'Download mail-merge CSV'))),
      withEmail[0] ? h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer', color: 'var(--accent)' } }, `Preview for ${guestName(withEmail[0])}`),
        h('div', { class: 'card mt', style: { background: 'var(--card-2)', whiteSpace: 'pre-wrap' } }, (() => { const r = render(withEmail[0]); return [h('b', null, r.subject), '\n\n', r.text]; })())) : null),
  });
}

// ------------------------------------------------------------------ import / export
function exportCsv(gs) {
  const tables = Object.fromEntries(list('table').map((t) => [t.id, t.name]));
  download(`guests-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([
    ['First name', 'Last name', 'Email', 'Phone', 'Address', 'Guest of', 'Group', 'Household', 'RSVP', 'Meal', 'Dietary', 'Kitchen notes', 'Plus-one allowed', 'Child', 'Table', 'Gift', 'Thank-you sent', 'Notes', 'RSVP link'],
    ...gs.map((g) => [g.first, g.last, g.email, g.phone, g.address, sideLabel(g.side), g.group, g.party, g.rsvp || 'pending', g.meal, (g.dietary || []).join('; '), g.dietaryNote,
      g.plusOne ? 'yes' : '', g.child ? 'yes' : '', tables[g.table] || '', g.gift, g.thanked ? 'yes' : '', g.notes, g.token ? rsvpLink(g) : '']),
  ]), 'text/csv');
}

async function importCsv() {
  const file = await pickFile('.csv,text/csv,text/plain');
  if (!file) return;
  const rows = parseCsv(await file.text());
  if (rows.length < 2) return toast('That file has no guest rows', { error: true });
  const head = rows[0].map((x) => x.toLowerCase().trim());
  const col = (...names) => head.findIndex((x) => names.some((n) => x === n || x.includes(n)));
  const c = {
    first: col('first', 'όνομα'), last: col('last', 'surname', 'επώνυμο'), name: col('full name', 'name'), email: col('email', 'e-mail'), phone: col('phone', 'mobile', 'τηλ'),
    address: col('address', 'διεύθυνση'), group: col('group', 'category', 'ομάδα'), party: col('household', 'party', 'family', 'invitation'), side: col('side', 'guest of'),
    rsvp: col('rsvp', 'status'), dietary: col('dietary', 'diet', 'allerg'), notes: col('note'), plusOne: col('plus'), child: col('child', 'kid'),
  };
  const val = (r, k) => (c[k] >= 0 ? (r[c[k]] || '').trim() : '');
  const p1 = (store.wedding.partner1 || '').toLowerCase(); const p2 = (store.wedding.partner2 || '').toLowerCase();
  const guests = rows.slice(1).map((r) => {
    let first = val(r, 'first'); let last = val(r, 'last');
    if (!first && !last && c.name >= 0) { const parts = val(r, 'name').split(/\s+/); first = parts.shift() || ''; last = parts.join(' '); }
    const side = val(r, 'side').toLowerCase();
    const rs = val(r, 'rsvp').toLowerCase();
    return {
      first, last, email: val(r, 'email') || null, phone: val(r, 'phone') || null, address: val(r, 'address') || null, group: val(r, 'group') || null, party: val(r, 'party') || null,
      side: side && (side === p1 || side.includes('bride') || side === '1' || side === 'p1') ? 'p1' : side && (side === p2 || side.includes('groom') || side === '2' || side === 'p2') ? 'p2' : side ? 'both' : null,
      rsvp: /^(y|yes|attending|ναι|accept)/.test(rs) ? 'yes' : /^(n|no|declin|όχι|οχι)/.test(rs) ? 'no' : 'pending',
      dietary: val(r, 'dietary') ? val(r, 'dietary').split(/[;,/]/).map((x) => x.trim()).filter(Boolean).map((x) => DIETARY.find((d) => d.toLowerCase().startsWith(x.toLowerCase())) || x) : [],
      notes: val(r, 'notes') || null, plusOne: /^(y|yes|1|true|ναι)/i.test(val(r, 'plusOne')), child: /^(y|yes|1|true|ναι)/i.test(val(r, 'child')),
      knows: [], avoid: [],
    };
  }).filter((g) => g.first || g.last);
  if (!guests.length) return toast('Couldn’t find names in that file. Use columns like “First name”, “Last name” or “Name”.', { error: true });
  if (!(await confirmBox({ title: `Import ${plural(guests.length, 'guest')}?`, message: `From ${file.name}. Detected columns: ${Object.entries(c).filter(([, i]) => i >= 0).map(([k]) => k).join(', ')}.`, confirm: 'Import' }))) return;
  await bulk(guests.map((data) => ({ op: 'create', type: 'guest', data })), `imported ${guests.length} guests`);
  toast(`Imported ${plural(guests.length, 'guest')}`);
}

function bulkSet(ids, data, msg) {
  bulk([...ids].map((id) => ({ op: 'patch', type: 'guest', id, data: typeof data === 'function' ? data(get('guest', id)) : data }))).then(() => toast(msg));
}

// ------------------------------------------------------------------ view
export default {
  title: 'Guests',
  mounted(ctx) {
    if (ctx.query.get('new') === '1' && can('guests', 'edit')) { history.replaceState({}, '', '/guests'); guestSheet(null); }
  },
  render() {
    const all = list('guest');
    const gs = filtered();
    const editable = can('guests', 'edit');
    const yes = all.filter((g) => g.rsvp === 'yes');
    const kids = all.filter((g) => g.child && g.rsvp !== 'no').length;
    const dietary = all.filter((g) => g.rsvp !== 'no' && (g.dietary?.length || g.dietaryNote)).length;
    const tables = Object.fromEntries(list('table').map((t) => [t.id, t.name]));
    ui.selected = new Set([...ui.selected].filter((id) => get('guest', id)));
    const sel = ui.selected;

    const head = h('div', { class: 'page-head' },
      h('div', null, h('h1', null, 'Guest list'), h('div', { class: 'sub' },
        `${plural(all.length, 'guest')} · ${yes.length} attending · ${all.filter((g) => (g.rsvp || 'pending') === 'pending').length} awaiting · ${all.filter((g) => g.rsvp === 'no').length} declined`,
        store.wedding.guestTarget ? ` · target ${store.wedding.guestTarget}` : '')),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', onclick: (e) => menu(e.currentTarget, [
          editable && { label: 'Import from CSV / Excel', icon: 'upload', onClick: importCsv },
          { label: 'Export to CSV', icon: 'download', onClick: () => exportCsv(gs) },
          { label: 'Print guest list', icon: 'print', onClick: () => printList(gs) },
          editable && '-',
          editable && { label: `Prepare emails for ${ui.rsvp === 'pending' ? 'guests awaiting reply' : 'these guests'} (${gs.length})`, icon: 'send', onClick: () => emailSheet(gs) },
          editable && { label: 'Copy all RSVP links', icon: 'link', onClick: () => copyText(gs.map((g) => `${guestName(g)}: ${rsvpLink(g)}`).join('\n'), 'Links copied') },
        ]) }, icon('more'), h('span', { class: 'hide-m' }, 'More')),
        editable && h('button', { class: 'btn primary', onclick: () => guestSheet(null) }, icon('plus'), 'Add guest')));

    const filters = h('div', { class: 'toolbar' },
      h('div', { class: 'search' }, icon('search'), input({ placeholder: 'Search name, email, household…', value: ui.q, 'data-k': 'guest-search', oninput: (e) => { ui.q = e.target.value; import('../lib/store.js').then((m) => m.emit()); } })),
      seg([{ value: 'all', label: 'All' }, { value: 'yes', label: 'Attending' }, { value: 'pending', label: 'Awaiting' }, { value: 'no', label: 'Declined' }], ui.rsvp, (v) => { ui.rsvp = v; rerender(); }),
      select([{ value: '', label: 'Both sides' }, ...sideOptions().slice(1, 4)], ui.side, (v) => { ui.side = v; rerender(); }, { class: 'input s', style: { width: 'auto' } }),
      select([{ value: '', label: 'All groups' }, ...groups()], ui.group, (v) => { ui.group = v; rerender(); }, { class: 'input s', style: { width: 'auto' } }),
      select([{ value: '', label: 'Any diet' }, { value: '__any', label: 'Has dietary needs' }, ...DIETARY], ui.diet, (v) => { ui.diet = v; rerender(); }, { class: 'input s', style: { width: 'auto' } }));

    const stats = all.length ? h('div', { class: 'row wrap mb', style: { gap: '6px' } },
      h('span', { class: 'chip' }, `${all.filter((g) => g.rsvp !== 'no').length - kids} adults · ${kids} children`),
      h('span', { class: 'chip' }, `${all.filter((g) => g.plusOneOf).length} plus-ones`),
      dietary ? h('button', { class: 'chip orange', onclick: () => { ui.diet = '__any'; rerender(); } }, `${dietary} with dietary needs`) : null,
      ...['p1', 'p2'].map((s) => h('span', { class: 'chip' }, `${sideLabel(s)}: ${all.filter((g) => g.side === s).length}`)),
      all.filter((g) => !g.email && !g.phone).length ? h('span', { class: 'chip red' }, `${all.filter((g) => !g.email && !g.phone).length} missing contact details`) : null) : null;

    const bulkBar = sel.size ? h('div', { class: 'bulkbar' },
      h('b', { class: 'grow' }, `${sel.size} selected`),
      h('button', { class: 'btn s', onclick: (e) => menu(e.currentTarget, [
        { label: 'Attending', onClick: () => bulkSet(sel, { rsvp: 'yes', rsvpAt: Date.now() }, 'Marked attending') },
        { label: 'Awaiting reply', onClick: () => bulkSet(sel, { rsvp: 'pending' }, 'Marked awaiting') },
        { label: 'Declined', onClick: () => bulkSet(sel, { rsvp: 'no', rsvpAt: Date.now(), table: null }, 'Marked declined') }]) }, 'RSVP'),
      h('button', { class: 'btn s', onclick: (e) => menu(e.currentTarget, sideOptions().slice(1).map((o) => ({ label: o.label, onClick: () => bulkSet(sel, { side: o.value }, 'Updated') }))) }, 'Side'),
      h('button', { class: 'btn s', onclick: (e) => menu(e.currentTarget, groups().map((gr) => ({ label: gr, onClick: () => bulkSet(sel, { group: gr }, 'Updated') }))) }, 'Group'),
      h('button', { class: 'btn s', onclick: async () => {
        const last = [...sel].map((id) => get('guest', id)?.last).find(Boolean);
        const name = await promptBox({ title: 'Household', label: 'These guests will share one invitation and RSVP together.', value: last ? `${last} family` : '', confirm: 'Group' });
        if (name) bulkSet(sel, { party: name.trim() }, 'Grouped into a household');
      } }, 'Household'),
      h('button', { class: 'btn s', onclick: () => {
        const ids = [...sel];
        bulkSet(sel, (g) => ({ knows: [...new Set([...(g.knows || []), ...ids.filter((x) => x !== g.id)])] }), 'They’ll be seated together where possible');
      } }, 'Know each other'),
      h('button', { class: 'btn s', onclick: () => emailSheet([...sel].map((id) => get('guest', id))) }, icon('send'), 'Emails'),
      h('button', { class: 'btn s', onclick: async () => {
        if (await confirmBox({ title: `Delete ${plural(sel.size, 'guest')}?`, confirm: 'Delete', destructive: true })) {
          await bulk([...sel].map((id) => ({ op: 'delete', type: 'guest', id })), `removed ${sel.size} guests`); sel.clear(); toast('Deleted');
        }
      } }, icon('trash')),
      h('button', { class: 'btn s icon', 'aria-label': 'Clear selection', onclick: () => { sel.clear(); rerender(); } }, icon('x'))) : null;

    const sortTh = (key, label, cls) => h('th', { class: ['sortable', cls], onclick: () => { if (ui.sort === key) ui.dir *= -1; else { ui.sort = key; ui.dir = 1; } rerender(); } },
      label, ui.sort === key ? (ui.dir > 0 ? ' ↑' : ' ↓') : '');

    const allChecked = gs.length && gs.every((g) => sel.has(g.id));
    const table = all.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null,
        editable && h('th', { style: { width: '36px' } }, h('input', { type: 'checkbox', checked: allChecked, 'aria-label': 'Select all', onchange: (e) => { gs.forEach((g) => (e.target.checked ? sel.add(g.id) : sel.delete(g.id))); rerender(); } })),
        sortTh('name', 'Name'), sortTh('side', 'Guest of', 'hide-m'), sortTh('group', 'Group / household', 'hide-m'), sortTh('rsvp', 'RSVP'),
        h('th', { class: 'hide-m' }, 'Meal & diet'), sortTh('table', 'Table', 'hide-m'), h('th', { class: 'hide-m' }, 'Contact'))),
      h('tbody', null, gs.map((g) => h('tr', { class: ['tap', sel.has(g.id) && 'sel'], onclick: (e) => { if (!e.target.closest('input,button,a')) guestSheet(g); } },
        editable && h('td', null, h('input', { type: 'checkbox', checked: sel.has(g.id), 'aria-label': `Select ${guestName(g)}`, onchange: (e) => { e.target.checked ? sel.add(g.id) : sel.delete(g.id); rerender(); } })),
        h('td', null, h('div', { class: 'row', style: { gap: '8px' } },
          h('div', { class: 'avatar' }, initials(guestName(g))),
          h('div', { style: { minWidth: 0 } },
            h('div', { style: { fontWeight: 500 } }, guestName(g), g.vip ? ' ★' : '', g.child ? h('span', { class: 'chip', style: { marginLeft: '6px', height: '18px', fontSize: '11px' } }, 'child') : null),
            (g.plusOneOf || g.plusOne || g.avoid?.length) ? h('div', { class: 'xs muted' }, [g.plusOneOf && `+1 of ${guestName(get('guest', g.plusOneOf))}`, g.plusOne && 'may bring +1', g.avoid?.length && `keep apart from ${g.avoid.length}`].filter(Boolean).join(' · ')) : null))),
        h('td', { class: 'hide-m small' }, sideLabel(g.side)),
        h('td', { class: 'hide-m small' }, g.group || '', g.party ? h('div', { class: 'xs muted' }, g.party) : null),
        h('td', null, rsvpChip(g.rsvp)),
        h('td', { class: 'hide-m small' }, g.meal || '', (g.dietary?.length || g.dietaryNote) ? h('div', { class: 'chips', style: { marginTop: g.meal ? '3px' : 0 } },
          (g.dietary || []).map((d) => h('span', { class: 'chip orange', title: d, style: { height: '20px', fontSize: '11px' } }, DIET_TAGS[d] || d)), g.dietaryNote ? h('span', { class: 'chip red', title: g.dietaryNote, style: { height: '20px', fontSize: '11px' } }, '!') : null) : null),
        h('td', { class: 'hide-m small' }, tables[g.table] || h('span', { class: 'faint' }, '—')),
        h('td', { class: 'hide-m' }, h('div', { class: 'row gap-s faint' }, g.email && h('a', { href: `mailto:${g.email}`, title: g.email, class: 'btn plain icon s' }, icon('at')), g.phone && h('a', { href: `tel:${g.phone}`, title: g.phone, class: 'btn plain icon s' }, icon('phone')),
          g.emailedAt ? h('span', { class: 'xs', title: 'Emailed' }, '✓') : null)))))),
    gs.length ? null : h('div', { class: 'list-empty' }, 'No guests match these filters.')) : null;

    return h('div', null, head,
      all.length ? [filters, stats, bulkBar, table]
        : emptyState('guests', 'Start your guest list', 'Add guests one by one, or import a spreadsheet with names, emails and households. Their dietary needs and seating preferences live here too.',
          editable && h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn', onclick: importCsv }, icon('upload'), 'Import CSV'), h('button', { class: 'btn primary', onclick: () => guestSheet(null) }, icon('plus'), 'Add guest'))));
  },
};

function rerender() { import('../lib/store.js').then((m) => m.emit()); }

function printList(gs) {
  const tables = Object.fromEntries(list('table').map((t) => [t.id, t.name]));
  import('../lib/ui.js').then(({ printHtml, esc }) => printHtml('Guest list', `<h1>${esc(coupleNames())}</h1><div class="muted">Guest list · ${gs.length} guests</div>
    <table style="margin-top:14px"><tr><th>Name</th><th>Household</th><th>RSVP</th><th>Meal</th><th>Dietary</th><th>Table</th></tr>
    ${gs.map((g) => `<tr><td>${esc(guestName(g))}</td><td>${esc(g.party || '')}</td><td>${g.rsvp === 'yes' ? 'Attending' : g.rsvp === 'no' ? 'Declined' : 'Awaiting'}</td><td>${esc(g.meal || '')}</td><td>${esc([...(g.dietary || []), g.dietaryNote].filter(Boolean).join(', '))}</td><td>${esc(tables[g.table] || '')}</td></tr>`).join('')}</table>`));
}
