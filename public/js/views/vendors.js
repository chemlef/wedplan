import { h, icon, sheet, menu, toast, field, input, select, seg, toggle, confirmBox, stars, money, emptyState, plural, download, toCsv, printHtml, esc, today, parseNum } from '../lib/ui.js';
import { store, list, get, can, create, patch, remove, bulk, currency, coupleNames } from '../lib/store.js';
import { VENDOR_CATEGORIES, VENDOR_STATUS } from '../lib/templates.js';
import { eventSheet } from './calendar.js';

const ui = { cat: null, view: 'cards', hideDeclined: false };
const statusOf = (v) => VENDOR_STATUS.find((s) => s.value === (v || 'idea')) || VENDOR_STATUS[0];
const total = (v) => {
  if (v.price) return Number(v.price);
  const per = Number(v.fields?.pricePerHead);
  if (per) return per * (Number(store.wedding.guestTarget) || list('guest').filter((g) => g.rsvp !== 'no').length || 0);
  return 0;
};

function fmtField(f, val) {
  if (val === undefined || val === null || val === '') return h('span', { class: 'faint' }, '—');
  if (f.type === 'bool') return val ? h('span', { class: 'pos' }, '✓ Yes') : h('span', { class: 'neg' }, '✗ No');
  if (f.type === 'money') return money(val, currency());
  return String(val);
}

function fieldInput(f, val, set) {
  if (f.type === 'bool') return select([{ value: '', label: '—' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], val === true ? 'yes' : val === false ? 'no' : '', (v) => set(v === 'yes' ? true : v === 'no' ? false : null));
  if (f.type === 'select') return select([{ value: '', label: '—' }, ...(f.options || [])], val || '', (v) => set(v || null));
  return input({ type: f.type === 'number' || f.type === 'money' ? 'number' : 'text', value: val ?? '', oninput: (e) => set(f.type === 'number' || f.type === 'money' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value) });
}

export function vendorSheet(v, defaults = {}) {
  const d = v ? structuredClone(v) : { name: '', cat: ui.cat, status: 'idea', rating: 0, fields: {}, pros: [], cons: [], links: [], ...defaults };
  d.fields = d.fields || {};
  const cat = () => get('vendor_cat', d.cat);
  const fieldsBox = h('div', { class: 'form-row' });
  const drawFields = () => fieldsBox.replaceChildren(...(cat()?.fields || []).map((f) => field(f.label, fieldInput(f, d.fields[f.key], (x) => { d.fields[f.key] = x; }))));
  drawFields();
  const listEditor = (key, placeholder) => {
    const box = h('div', { class: 'col gap-s' });
    const draw = () => box.replaceChildren(...(d[key] || []).map((p, i) => h('div', { class: 'row' }, input({ class: 'input s', value: p, oninput: (e) => { d[key][i] = e.target.value; } }),
      h('button', { class: 'btn plain icon s', 'aria-label': 'Remove', onclick: () => { d[key].splice(i, 1); draw(); } }, icon('x')))),
    h('button', { class: 'btn s plain', style: { alignSelf: 'flex-start' }, onclick: () => { d[key] = [...(d[key] || []), '']; draw(); setTimeout(() => box.querySelectorAll('input')[d[key].length - 1]?.focus(), 10); } }, icon('plus'), placeholder));
    draw();
    return box;
  };
  const editable = can('vendors', 'edit');
  let starsEl;
  const drawStars = () => { const n = stars(d.rating, (r) => { d.rating = r; drawStars(); }); starsEl?.replaceWith(n); starsEl = n; };
  drawStars();
  const s = sheet({
    title: v ? v.name : 'New vendor', doneLabel: v ? 'Save' : 'Add', size: 'wide',
    body: h('div', { class: 'form' },
      h('div', { class: 'form-row' },
        field('Name', input({ value: d.name, placeholder: 'Business name', oninput: (e) => { d.name = e.target.value; } })),
        field('Category', select(list('vendor_cat').map((c) => ({ value: c.id, label: c.name })), d.cat, (x) => { d.cat = x; drawFields(); }))),
      h('div', { class: 'form-row' },
        field('Status', select(VENDOR_STATUS, d.status, (x) => { d.status = x; })),
        field('Your rating', h('div', { style: { paddingTop: '6px' } }, starsEl))),
      h('div', { class: 'section-h' }, 'Offer'),
      h('div', { class: 'form-row' },
        field('Quoted price (total)', input({ type: 'number', min: 0, value: d.price ?? '', oninput: (e) => { d.price = e.target.value === '' ? null : Number(e.target.value); } })),
        field('Deposit', input({ type: 'number', min: 0, value: d.deposit ?? '', oninput: (e) => { d.deposit = e.target.value === '' ? null : Number(e.target.value); } })),
        field('Offer valid until', input({ type: 'date', value: d.validUntil || '', oninput: (e) => { d.validUntil = e.target.value; } }))),
      field('What’s included', h('textarea', { class: 'input', rows: 2, placeholder: 'Package details, hours, extras…', oninput: (e) => { d.offer = e.target.value; } }, d.offer || '')),
      fieldsBox,
      h('div', { class: 'grid c2' }, field('Pros', listEditor('pros', 'Add a pro')), field('Cons', listEditor('cons', 'Add a con'))),
      h('div', { class: 'section-h' }, 'Contact'),
      h('div', { class: 'form-row' },
        field('Contact person', input({ value: d.contact || '', oninput: (e) => { d.contact = e.target.value; } })),
        field('Phone', input({ type: 'tel', value: d.phone || '', oninput: (e) => { d.phone = e.target.value; } })),
        field('Email', input({ type: 'email', value: d.email || '', oninput: (e) => { d.email = e.target.value; } }))),
      h('div', { class: 'form-row' },
        field('Website / Instagram', input({ value: d.website || '', placeholder: 'https://', oninput: (e) => { d.website = e.target.value; } })),
        field('Address', input({ value: d.address || '', oninput: (e) => { d.address = e.target.value; } }))),
      field('Links to quotes, contracts, photos', listEditor('links', 'Add link')),
      field('Notes', h('textarea', { class: 'input', rows: 3, oninput: (e) => { d.notes = e.target.value; } }, d.notes || ''))),
    done: editable ? async () => {
      if (!d.name.trim()) { toast('Add a name', { error: true }); return false; }
      const { id, type, _sort, _updated, _by, ...data } = d;
      data.pros = (data.pros || []).filter((x) => x.trim()); data.cons = (data.cons || []).filter((x) => x.trim()); data.links = (data.links || []).filter((x) => x.trim());
      if (v) await patch('vendor', v.id, data); else await create('vendor', data);
    } : null,
    footer: v && editable ? [
      h('button', { class: 'btn danger', onclick: () => { s.close(); remove('vendor', v.id, { label: v.name }); } }, icon('trash')),
      h('span', { class: 'grow' }),
      can('calendar', 'edit') && h('button', { class: 'btn', onclick: () => { s.close(); eventSheet(null, { title: `Meeting: ${v.name}`, type: 'meeting', location: v.address || '' }); } }, icon('calendar'), 'Schedule meeting'),
      v.status !== 'booked' && h('button', { class: 'btn tinted', onclick: () => { s.close(); bookVendor(v); } }, icon('check'), 'Book'),
    ] : null,
  });
}

async function bookVendor(v) {
  await patch('vendor', v.id, { status: 'booked' });
  if (!can('budget', 'edit')) return toast(`${v.name} booked`);
  if (list('expense').some((e) => e.vendor === v.id)) return toast(`${v.name} booked`);
  const cats = list('budget_cat');
  const catName = (get('vendor_cat', v.cat)?.name || '').toLowerCase();
  const guess = cats.find((c) => c.name.toLowerCase().split(/[ &]+/).some((w) => w.length > 3 && catName.includes(w.slice(0, 5)))) || cats[0];
  if (!cats.length) return toast(`${v.name} booked`);
  const amount = total(v);
  await create('expense', {
    name: v.name, cat: guess.id, vendor: v.id, actual: amount || null,
    payments: v.deposit ? [{ amount: v.deposit, due: today(), note: 'Deposit', paid: false }, { amount: Math.max(0, amount - v.deposit), due: store.wedding.date || null, note: 'Balance', paid: false }] : [],
  });
  toast(`${v.name} booked and added to the budget under ${guess.name}`);
}

function catSheet(c) {
  const d = c ? structuredClone(c) : { name: '', fields: [] };
  const box = h('div', { class: 'col gap-s' });
  const draw = () => box.replaceChildren(...d.fields.map((f, i) => h('div', { class: 'row' },
    input({ class: 'input s grow', value: f.label, placeholder: 'Field name', oninput: (e) => { f.label = e.target.value; if (!f.key || f.custom) { f.key = `c_${e.target.value.toLowerCase().replace(/\W+/g, '_')}`; f.custom = true; } } }),
    select([{ value: 'text', label: 'Text' }, { value: 'number', label: 'Number' }, { value: 'money', label: 'Price' }, { value: 'bool', label: 'Yes / no' }], f.type || 'text', (v) => { f.type = v; }, { class: 'input s', style: { width: '110px' } }),
    h('button', { class: 'btn plain icon s', 'aria-label': 'Remove field', onclick: () => { d.fields.splice(i, 1); draw(); } }, icon('x')))),
  h('button', { class: 'btn s plain', style: { alignSelf: 'flex-start' }, onclick: () => { d.fields.push({ key: '', label: '', type: 'text', custom: true }); draw(); } }, icon('plus'), 'Add field'));
  draw();
  const s = sheet({
    title: c ? c.name : 'New category', doneLabel: 'Save',
    body: h('div', { class: 'form' }, field('Name', input({ value: d.name, placeholder: 'e.g. Fireworks', oninput: (e) => { d.name = e.target.value; } })),
      field('What to compare', box, 'Price, rating, status, pros and cons are always included.')),
    done: async () => {
      if (!d.name.trim()) return false;
      const fields = d.fields.filter((f) => f.label.trim()).map((f) => ({ ...f, key: f.key || `c_${f.label.toLowerCase().replace(/\W+/g, '_')}` }));
      if (c) await patch('vendor_cat', c.id, { name: d.name.trim(), fields });
      else { const r = await create('vendor_cat', { name: d.name.trim(), fields, icon: 'vendors' }); ui.cat = r.id; }
    },
    footer: c ? [h('button', { class: 'btn danger', onclick: async () => {
      const n = list('vendor').filter((v) => v.cat === c.id).length;
      if (n && !(await confirmBox({ title: `Delete “${c.name}” and its ${plural(n, 'vendor')}?`, confirm: 'Delete', destructive: true }))) return;
      s.close();
      await bulk([...list('vendor').filter((v) => v.cat === c.id).map((v) => ({ op: 'delete', type: 'vendor', id: v.id })), { op: 'delete', type: 'vendor_cat', id: c.id }]);
      ui.cat = null;
    } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

function comparison(cat, vendors) {
  const cur = currency();
  const prices = vendors.map(total).filter(Boolean);
  const minP = prices.length ? Math.min(...prices) : null;
  const maxR = Math.max(0, ...vendors.map((v) => v.rating || 0));
  const rows = [
    ['Status', (v) => h('span', { class: ['chip', statusOf(v.status).chip] }, statusOf(v.status).label)],
    ['Total price', (v) => (total(v) ? h('b', { class: total(v) === minP && prices.length > 1 ? 'pos' : '' }, money(total(v), cur), total(v) === minP && prices.length > 1 ? ' · lowest' : '') : h('span', { class: 'faint' }, '—'))],
    ['Deposit', (v) => (v.deposit ? money(v.deposit, cur) : h('span', { class: 'faint' }, '—'))],
    ['Rating', (v) => h('span', { class: v.rating && v.rating === maxR ? 'pos' : '' }, v.rating ? '★'.repeat(v.rating) + '☆'.repeat(5 - v.rating) : '—')],
    ...(cat.fields || []).map((f) => [f.label, (v) => fmtField(f, v.fields?.[f.key])]),
    ['Included', (v) => h('span', { class: 'small' }, v.offer || '—')],
    ['Pros', (v) => (v.pros?.length ? h('ul', { style: { margin: 0, paddingLeft: '16px' }, class: 'small pos' }, v.pros.map((p) => h('li', null, p))) : '—')],
    ['Cons', (v) => (v.cons?.length ? h('ul', { style: { margin: 0, paddingLeft: '16px' }, class: 'small neg' }, v.cons.map((p) => h('li', null, p))) : '—')],
    ['Valid until', (v) => v.validUntil || '—'],
    ['Contact', (v) => h('div', { class: 'small' }, [v.contact, v.phone, v.email].filter(Boolean).join(' · ') || '—')],
    ['Notes', (v) => h('span', { class: 'small' }, v.notes || '—')],
  ];
  return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
    h('thead', null, h('tr', null, h('th', { style: { width: '150px' } }), vendors.map((v) => h('th', { style: { minWidth: '180px', cursor: 'pointer', fontSize: '14px', color: 'var(--label)' }, onclick: () => vendorSheet(v) }, v.name)))),
    h('tbody', null, rows.map(([label, fn]) => h('tr', null, h('td', { class: 'small muted', style: { fontWeight: 500 } }, label), vendors.map((v) => h('td', null, fn(v))))))));
}

function exportComparison(cat, vendors) {
  const rows = [['', ...vendors.map((v) => v.name)],
    ['Status', ...vendors.map((v) => statusOf(v.status).label)], ['Total price', ...vendors.map((v) => total(v) || '')], ['Deposit', ...vendors.map((v) => v.deposit || '')], ['Rating', ...vendors.map((v) => v.rating || '')],
    ...(cat.fields || []).map((f) => [f.label, ...vendors.map((v) => { const x = v.fields?.[f.key]; return x === true ? 'Yes' : x === false ? 'No' : x ?? ''; })]),
    ['Included', ...vendors.map((v) => v.offer || '')], ['Pros', ...vendors.map((v) => (v.pros || []).join('; '))], ['Cons', ...vendors.map((v) => (v.cons || []).join('; '))],
    ['Contact', ...vendors.map((v) => [v.contact, v.phone, v.email].filter(Boolean).join(' '))], ['Notes', ...vendors.map((v) => v.notes || '')]];
  return rows;
}

export default {
  title: 'Vendors',
  render() {
    const cats = list('vendor_cat');
    const editable = can('vendors', 'edit');
    if (!cats.length) {
      return h('div', null, h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Vendors & quotes'))),
        emptyState('vendors', 'Compare venues, caterers and more', 'Keep quotes, offers, pros and cons for every vendor side by side, then book the winner straight into your budget.',
          editable && h('button', { class: 'btn primary', onclick: () => bulk(VENDOR_CATEGORIES.map((c, i) => ({ op: 'create', type: 'vendor_cat', data: { key: c.key, name: c.name, icon: c.icon, fields: c.fields, _sort: i } }))) }, icon('sparkle'), 'Add the usual categories')));
    }
    if (!ui.cat || !get('vendor_cat', ui.cat)) ui.cat = cats[0].id;
    const cat = get('vendor_cat', ui.cat);
    const all = list('vendor').filter((v) => v.cat === cat.id);
    const vendors = all.filter((v) => !ui.hideDeclined || v.status !== 'declined');
    const cur = currency();
    const booked = all.find((v) => v.status === 'booked');

    const card = (v) => h('div', { class: 'card', style: { cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', opacity: v.status === 'declined' ? 0.55 : 1 }, onclick: () => vendorSheet(v) },
      h('div', { class: 'row top' }, h('div', { class: 'grow' }, h('div', { style: { fontWeight: 600, fontSize: '16px' } }, v.name), h('div', { class: 'xs muted' }, v.contact || v.address || '')),
        h('span', { class: ['chip', statusOf(v.status).chip] }, statusOf(v.status).label)),
      h('div', { class: 'row between' }, h('div', { style: { fontSize: '22px', fontWeight: 700 }, class: 'num' }, total(v) ? money(total(v), cur) : h('span', { class: 'faint small' }, 'No quote yet')),
        editable ? stars(v.rating, (r) => patch('vendor', v.id, { rating: r })) : stars(v.rating)),
      v.fields?.pricePerHead ? h('div', { class: 'xs muted' }, `${money(v.fields.pricePerHead, cur)} per guest`) : null,
      (v.pros?.length || v.cons?.length) ? h('div', { class: 'small' }, (v.pros || []).slice(0, 2).map((p) => h('div', { class: 'pos' }, `+ ${p}`)), (v.cons || []).slice(0, 2).map((p) => h('div', { class: 'neg' }, `− ${p}`))) : null,
      h('div', { class: 'row', style: { marginTop: 'auto', gap: '4px' } },
        v.phone && h('a', { class: 'btn s plain icon', href: `tel:${v.phone}`, onclick: (e) => e.stopPropagation(), 'aria-label': 'Call' }, icon('phone')),
        v.email && h('a', { class: 'btn s plain icon', href: `mailto:${v.email}`, onclick: (e) => e.stopPropagation(), 'aria-label': 'Email' }, icon('at')),
        v.website && h('a', { class: 'btn s plain icon', href: /^https?:/.test(v.website) ? v.website : `https://${v.website}`, target: '_blank', rel: 'noopener', onclick: (e) => e.stopPropagation(), 'aria-label': 'Website' }, icon('link')),
        h('span', { class: 'grow' }),
        editable && v.status !== 'booked' && h('button', { class: 'btn s tinted', onclick: (e) => { e.stopPropagation(); bookVendor(v); } }, 'Book')));

    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Vendors & quotes'), h('div', { class: 'sub' }, `${plural(list('vendor').length, 'vendor')} · ${list('vendor').filter((v) => v.status === 'booked').length} booked`)),
        h('div', { class: 'actions' },
          seg([{ value: 'cards', label: 'Cards', icon: 'grid' }, { value: 'compare', label: 'Compare', icon: 'list' }], ui.view, (v) => { ui.view = v; rr(); }),
          h('button', { class: 'btn', onclick: (e) => menu(e.currentTarget, [
            { label: ui.hideDeclined ? 'Show “not chosen”' : 'Hide “not chosen”', icon: 'eye', onClick: () => { ui.hideDeclined = !ui.hideDeclined; rr(); } },
            { label: 'Export comparison (CSV)', icon: 'download', onClick: () => download(`${cat.name}-comparison.csv`, toCsv(exportComparison(cat, vendors)), 'text/csv') },
            { label: 'Print comparison', icon: 'print', onClick: () => printHtml(`${cat.name} comparison`, `<h1>${esc(cat.name)}</h1><div class="muted">${esc(coupleNames())}</div><table style="margin-top:14px">${exportComparison(cat, vendors).map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</table>`, '@page{size:landscape}') },
            editable && '-',
            editable && { label: `Edit “${cat.name}” fields`, icon: 'sliders', onClick: () => catSheet(cat) },
            editable && { label: 'New category', icon: 'plus', onClick: () => catSheet(null) },
          ]) }, icon('more')),
          editable && h('button', { class: 'btn primary', onclick: () => vendorSheet(null) }, icon('plus'), 'Vendor'))),
      h('div', { class: 'chips mb' }, cats.map((c) => {
        const n = list('vendor').filter((v) => v.cat === c.id);
        return h('button', { class: ['chip', c.id === ui.cat && 'on'], style: { height: '30px', padding: '0 12px', fontSize: '13.5px' }, onclick: () => { ui.cat = c.id; rr(); } },
          c.name, n.length ? h('span', { style: { opacity: 0.7 } }, ` ${n.length}`) : null, n.some((v) => v.status === 'booked') ? ' ✓' : null);
      }), editable && h('button', { class: 'chip', style: { height: '30px' }, onclick: () => catSheet(null) }, '+ Category')),
      booked ? h('div', { class: 'card mb', style: { background: 'rgba(52,199,89,.08)', boxShadow: 'none' } }, h('div', { class: 'row' }, icon('check', 'pos'), h('span', null, h('b', null, booked.name), ` is booked for ${cat.name.toLowerCase()}${total(booked) ? ` at ${money(total(booked), cur)}` : ''}.`))) : null,
      vendors.length ? (ui.view === 'compare' ? comparison(cat, vendors) : h('div', { class: 'grid auto' }, vendors.map(card)))
        : emptyState(cat.icon || 'vendors', `No ${cat.name.toLowerCase()} yet`, 'Add each option you’re considering with its quote, what’s included and your impressions, then compare them side by side.',
          editable && h('button', { class: 'btn primary', onclick: () => vendorSheet(null) }, icon('plus'), 'Add vendor')));
  },
};
function rr() { import('../lib/store.js').then((m) => m.emit()); }
