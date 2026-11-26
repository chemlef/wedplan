import { h, icon, sheet, menu, toast, field, input, select, toggle, confirmBox, money, fmtDate, relDay, today, download, toCsv, emptyState, plural, parseNum, promptBox } from '../lib/ui.js';
import { store, list, get, can, create, patch, remove, bulk, saveWedding, currency, isPlanner } from '../lib/store.js';
import { BUDGET_CATEGORIES, BUDGET_EXTRA } from '../lib/templates.js';
import { budgetTotals, upcomingPayments } from './dashboard.js';

const ui = { open: new Set(), view: 'categories' };
const cost = (e) => Number(e.actual) || Number(e.estimate) || 0;
const paidOf = (e) => (e.payments?.length ? e.payments.filter((p) => p.paid).reduce((s, p) => s + (Number(p.amount) || 0), 0) : e.paid ? cost(e) : 0);
const PALETTE = ['#c0587e', '#d98a5f', '#6f8fb3', '#7aa37a', '#9b7bc4', '#d4a64a', '#8fb8b0', '#b58aa5', '#c9a227', '#7c8a96', '#e3a0a8', '#a0a0a8'];

function donut(segments, size = 180) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 70; const c = 2 * Math.PI * r;
  let acc = 0;
  const svg = h('svg', { viewBox: '0 0 180 180', width: size, height: size, role: 'img', 'aria-label': 'Budget allocation' });
  svg.append(h('circle', { cx: 90, cy: 90, r, fill: 'none', stroke: 'var(--fill-2)', 'stroke-width': 22 }));
  segments.filter((x) => x.value > 0).forEach((sgm) => {
    const len = (sgm.value / total) * c;
    const circ = h('circle', { cx: 90, cy: 90, r, fill: 'none', stroke: sgm.color, 'stroke-width': 22, 'stroke-dasharray': `${Math.max(0, len - 1.5)} ${c}`, 'stroke-dashoffset': -acc, transform: 'rotate(-90 90 90)' });
    circ.append(h('title', null, `${sgm.label}: ${money(sgm.value, currency())} (${Math.round((sgm.value / total) * 100)}%)`));
    svg.append(circ);
    acc += len;
  });
  return svg;
}

export function expenseSheet(e, defaults = {}) {
  const d = e ? structuredClone(e) : { name: '', cat: list('budget_cat')[0]?.id || '', estimate: '', actual: '', payments: [], ...defaults };
  d.payments = d.payments || [];
  const payBox = h('div', { class: 'col gap-s' });
  const drawPays = () => {
    payBox.replaceChildren(...d.payments.map((p, i) => h('div', { class: 'row' },
      input({ class: 'input s', type: 'number', min: 0, placeholder: 'Amount', value: p.amount ?? '', style: { width: '110px' }, oninput: (ev) => { p.amount = Number(ev.target.value) || 0; } }),
      input({ class: 'input s', type: 'date', value: p.due || '', style: { width: '150px' }, oninput: (ev) => { p.due = ev.target.value; } }),
      input({ class: 'input s grow', placeholder: 'Deposit, balance…', value: p.note || '', oninput: (ev) => { p.note = ev.target.value; } }),
      h('label', { class: 'row xs muted', style: { gap: '4px' } }, h('input', { type: 'checkbox', checked: !!p.paid, onchange: (ev) => { p.paid = ev.target.checked; p.paidAt = p.paid ? today() : null; } }), 'Paid'),
      h('button', { class: 'btn plain icon s', 'aria-label': 'Remove payment', onclick: () => { d.payments.splice(i, 1); drawPays(); } }, icon('x')))),
    h('div', { class: 'row' },
      h('button', { class: 'btn s', onclick: () => { d.payments.push({ amount: '', due: '', paid: false }); drawPays(); } }, icon('plus'), 'Add payment'),
      !d.payments.length && h('button', { class: 'btn s plain', onclick: () => {
        const total = Number(d.actual) || Number(d.estimate) || 0;
        d.payments = [{ amount: Math.round(total * 0.3), due: today(), note: 'Deposit (30%)' }, { amount: total - Math.round(total * 0.3), due: store.wedding.date || '', note: 'Balance' }];
        drawPays();
      } }, 'Split into deposit + balance')));
  };
  drawPays();
  const vendors = list('vendor');
  const editable = can('budget', 'edit');
  const s = sheet({
    title: e ? e.name : 'New expense', doneLabel: e ? 'Save' : 'Add', size: 'wide',
    body: h('div', { class: 'form' },
      h('div', { class: 'form-row' },
        field('What', input({ value: d.name, placeholder: 'e.g. Photographer package', oninput: (ev) => { d.name = ev.target.value; } })),
        field('Category', select(list('budget_cat').map((c) => ({ value: c.id, label: c.name })), d.cat, (v) => { d.cat = v; }))),
      h('div', { class: 'form-row' },
        field('Estimated cost', input({ type: 'number', min: 0, value: d.estimate, oninput: (ev) => { d.estimate = ev.target.value; } })),
        field('Actual / agreed cost', input({ type: 'number', min: 0, value: d.actual, oninput: (ev) => { d.actual = ev.target.value; } })),
        vendors.length ? field('Vendor', select([{ value: '', label: '—' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))], d.vendor || '', (v) => { d.vendor = v || null; })) : null),
      field('Payments', payBox, 'Payment due dates appear in the calendar and on the overview.'),
      !d.payments.length ? h('div', { class: 'form-row' },
        field('Due date', input({ type: 'date', value: d.due || '', oninput: (ev) => { d.due = ev.target.value; } })),
        field('Paid in full', h('div', { style: { paddingTop: '6px' } }, toggle(!!d.paid, (v) => { d.paid = v; })))) : null,
      field('Notes', h('textarea', { class: 'input', rows: 2, oninput: (ev) => { d.notes = ev.target.value; } }, d.notes || ''))),
    done: editable ? async () => {
      if (!d.name.trim()) { toast('Name the expense', { error: true }); return false; }
      const data = { name: d.name.trim(), cat: d.cat, estimate: parseNum(d.estimate) || null, actual: parseNum(d.actual) || null, vendor: d.vendor || null,
        payments: d.payments.filter((p) => p.amount || p.due).map((p) => ({ amount: Number(p.amount) || 0, due: p.due || null, note: p.note || '', paid: !!p.paid, paidAt: p.paidAt || null })),
        due: d.due || null, paid: !!d.paid, notes: d.notes || null };
      if (e) await patch('expense', e.id, data); else await create('expense', data);
    } : null,
    footer: e && editable ? [h('button', { class: 'btn danger', onclick: () => { s.close(); remove('expense', e.id, { label: e.name }); } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

function catSheet(c) {
  const d = c ? { ...c } : { name: '', planned: 0, color: PALETTE[list('budget_cat').length % PALETTE.length] };
  const s = sheet({
    title: c ? c.name : 'New category', doneLabel: c ? 'Save' : 'Add', size: 'narrow',
    body: h('div', { class: 'form' },
      field('Name', h('span', null, input({ value: d.name, list: 'bc-sugg', oninput: (e) => { d.name = e.target.value; } }), h('datalist', { id: 'bc-sugg' }, [...BUDGET_CATEGORIES.map((x) => x.name), ...BUDGET_EXTRA].map((x) => h('option', { value: x }))))),
      field('Planned amount', input({ type: 'number', min: 0, value: d.planned || '', oninput: (e) => { d.planned = Number(e.target.value) || 0; } })),
      field('Colour', h('div', { class: 'row wrap' }, PALETTE.map((col) => h('button', { class: ['color-dot', d.color === col && 'on'], style: { background: col, width: '26px', height: '26px' }, 'aria-label': col, onclick: (e) => {
        d.color = col; e.currentTarget.parentElement.querySelectorAll('.color-dot').forEach((x) => x.classList.remove('on')); e.currentTarget.classList.add('on');
      } }))))),
    done: async () => {
      if (!d.name.trim()) return false;
      if (c) await patch('budget_cat', c.id, { name: d.name.trim(), planned: d.planned, color: d.color });
      else await create('budget_cat', { name: d.name.trim(), planned: d.planned, color: d.color });
    },
    footer: c ? [h('button', { class: 'btn danger', onclick: async () => {
      const n = list('expense').filter((e) => e.cat === c.id).length;
      if (n && !(await confirmBox({ title: `Delete “${c.name}”?`, message: `${plural(n, 'expense')} in it will move to “Uncategorised”.`, confirm: 'Delete', destructive: true }))) return;
      s.close(); remove('budget_cat', c.id, { label: c.name });
    } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

async function autoAllocate() {
  const total = Number(store.wedding.budget) || 0;
  if (!total) return toast('Set a total budget first', { error: true });
  const cats = list('budget_cat');
  const known = cats.map((c) => ({ c, pct: BUDGET_CATEGORIES.find((t) => t.name.toLowerCase() === c.name.toLowerCase())?.pct ?? 3 }));
  const sum = known.reduce((s, x) => s + x.pct, 0);
  if (!(await confirmBox({ title: 'Suggest amounts?', message: `Splits ${money(total, currency())} across your categories using typical wedding proportions. Your current planned amounts will be replaced.`, confirm: 'Suggest' }))) return;
  await bulk(known.map(({ c, pct }) => ({ op: 'patch', type: 'budget_cat', id: c.id, data: { planned: Math.round((total * pct) / sum / 10) * 10 } })));
  toast('Amounts suggested');
}

function exportCsv() {
  const cats = Object.fromEntries(list('budget_cat').map((c) => [c.id, c.name]));
  const vendors = Object.fromEntries(list('vendor').map((v) => [v.id, v.name]));
  download('budget.csv', toCsv([['Category', 'Item', 'Vendor', 'Estimated', 'Actual', 'Paid', 'Outstanding', 'Next payment due', 'Notes'],
    ...list('expense').map((e) => [cats[e.cat] || 'Uncategorised', e.name, vendors[e.vendor] || '', e.estimate || '', e.actual || '', paidOf(e), cost(e) - paidOf(e),
      (e.payments || []).filter((p) => !p.paid && p.due).map((p) => p.due).sort()[0] || (e.paid ? '' : e.due || ''), e.notes || '']),
    [], ['Planned per category'], ...list('budget_cat').map((c) => [c.name, '', '', c.planned || 0])]), 'text/csv');
}

export default {
  title: 'Budget',
  mounted(ctx) { if (ctx.query.get('new') === '1' && can('budget', 'edit')) { history.replaceState({}, '', '/budget'); expenseSheet(null); } },
  render() {
    const cur = currency();
    const editable = can('budget', 'edit');
    const cats = list('budget_cat');
    const exps = list('expense');
    const b = budgetTotals();
    const plannedSum = cats.reduce((s, c) => s + (Number(c.planned) || 0), 0);
    const attending = list('guest').filter((g) => g.rsvp === 'yes').length || list('guest').filter((g) => g.rsvp !== 'no').length;
    const t0 = today();
    const pays = upcomingPayments();
    const uncategorised = exps.filter((e) => !cats.find((c) => c.id === e.cat));

    const catCard = (c, items) => {
      const spent = items.reduce((s, e) => s + cost(e), 0);
      const planned = Number(c?.planned) || 0;
      const over = planned && spent > planned;
      const open = ui.open.has(c?.id || 'none') || items.length <= 3;
      return h('div', { class: 'card flush' },
        h('div', { class: 'list-item tap', onclick: () => { const k = c?.id || 'none'; ui.open.has(k) ? ui.open.delete(k) : ui.open.add(k); rr(); } },
          h('span', { class: 'dot', style: { background: c?.color || 'var(--label-3)', width: '12px', height: '12px' } }),
          h('div', { class: 'grow' }, h('div', { class: 'title' }, c?.name || 'Uncategorised'),
            h('div', { class: 'progress', style: { marginTop: '6px', maxWidth: '360px' } }, h('span', { class: over ? 'r' : spent / (planned || 1) > 0.9 ? 'o' : '', style: { width: `${planned ? Math.min(100, (spent / planned) * 100) : spent ? 100 : 0}%`, background: over ? undefined : c?.color } }))),
          h('div', { class: 'right' }, h('div', { class: ['num', over && 'neg'], style: { fontWeight: 600 } }, money(spent, cur)), h('div', { class: 'xs muted num' }, planned ? `of ${money(planned, cur)}` : 'no plan')),
          editable && c && h('button', { class: 'btn plain icon s', 'aria-label': 'Category options', onclick: (e) => { e.stopPropagation(); menu(e.currentTarget, [
            { label: 'Edit category', icon: 'edit', onClick: () => catSheet(c) },
            { label: 'Add expense here', icon: 'plus', onClick: () => expenseSheet(null, { cat: c.id }) }]); } }, icon('more'))),
        open ? items.map((e) => {
          const paid = paidOf(e); const total = cost(e);
          const next = (e.payments || []).filter((p) => !p.paid && p.due).sort((x, y) => x.due.localeCompare(y.due))[0];
          return h('div', { class: 'list-item tap', style: { paddingLeft: '40px' }, onclick: () => expenseSheet(e) },
            h('div', { class: 'grow' }, h('div', null, e.name, e.vendor && get('vendor', e.vendor) ? h('span', { class: 'muted small' }, ` · ${get('vendor', e.vendor).name}`) : ''),
              h('div', { class: 'meta' }, paid >= total && total ? h('span', { class: 'pos' }, 'Paid ✓') : paid ? `${money(paid, cur)} paid · ${money(total - paid, cur)} to go` : e.actual ? 'Agreed' : 'Estimate',
                next ? h('span', { class: next.due < t0 ? 'neg' : '' }, ` · next ${money(next.amount, cur)} ${relDay(next.due).toLowerCase()}`) : (!e.paid && e.due ? h('span', { class: e.due < t0 ? 'neg' : '' }, ` · due ${relDay(e.due).toLowerCase()}`) : ''))),
            h('div', { class: 'num right' }, money(total, cur), e.actual && e.estimate && Number(e.actual) !== Number(e.estimate) ? h('div', { class: ['xs', Number(e.actual) > Number(e.estimate) ? 'neg' : 'pos'] }, `${Number(e.actual) > Number(e.estimate) ? '+' : '−'}${money(Math.abs(e.actual - e.estimate), cur)} vs estimate`) : null));
        }) : null,
        open && editable && c ? h('div', { class: 'list-item tap', style: { paddingLeft: '40px', color: 'var(--accent)' }, onclick: () => expenseSheet(null, { cat: c.id }) }, icon('plus', 'faint'), 'Add expense') : null,
        !open ? h('div', { class: 'list-item tap small muted', style: { paddingLeft: '40px' }, onclick: () => { ui.open.add(c.id); rr(); } }, `Show ${plural(items.length, 'expense')}`) : null);
    };

    const totalInput = isPlanner() ? input({ type: 'number', min: 0, value: b.total || '', 'data-k': 'budget-total', class: 'input', style: { fontSize: '22px', fontWeight: 700, height: '44px', maxWidth: '220px' },
      onchange: (e) => saveWedding({ budget: Number(e.target.value) || 0 }) }) : h('div', { class: 'stat' }, h('div', { class: 'v' }, money(b.total, cur)));

    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Budget'), h('div', { class: 'sub' }, `${plural(exps.length, 'expense')} in ${plural(cats.length, 'category', 'categories')}`)),
        h('div', { class: 'actions' },
          h('button', { class: 'btn', onclick: (e) => menu(e.currentTarget, [
            { label: 'Export to CSV', icon: 'download', onClick: exportCsv },
            editable && { label: 'Suggest amounts from total', icon: 'wand', onClick: autoAllocate },
            editable && { label: 'Add category', icon: 'plus', onClick: () => catSheet(null) },
          ]) }, icon('more')),
          editable && h('button', { class: 'btn primary', onclick: () => expenseSheet(null), disabled: !cats.length }, icon('plus'), 'Expense'))),
      h('div', { class: 'grid c4' },
        h('div', { class: 'card stat' }, h('div', { class: 'l' }, 'Total budget'), totalInput),
        h('div', { class: 'card stat' }, h('div', { class: 'l' }, 'Committed'), h('div', { class: ['v', b.committed > b.total && b.total && 'neg'] }, money(b.committed, cur)), h('div', { class: 'l' }, b.total ? `${Math.round((b.committed / b.total) * 100)}% of budget` : '')),
        h('div', { class: 'card stat' }, h('div', { class: 'l' }, 'Paid so far'), h('div', { class: 'v pos' }, money(b.paid, cur)), h('div', { class: 'l' }, `${money(b.committed - b.paid, cur)} still to pay`)),
        h('div', { class: 'card stat' }, h('div', { class: 'l' }, 'Left to allocate'), h('div', { class: ['v', b.total - b.committed < 0 && 'neg'] }, money(b.total - b.committed, cur)),
          h('div', { class: 'l' }, attending ? `${money(b.committed / attending, cur)} per guest (${attending})` : ''))),
      cats.length ? h('div', { class: 'grid c2 mt-l', style: { gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)' } },
        h('div', { class: 'card' },
          h('div', { class: 'card-title' }, 'Budget allocation', h('span', { class: 'more muted small' }, plannedSum !== b.total && b.total ? h('span', { class: plannedSum > b.total ? 'neg' : 'warn' }, `Planned ${money(plannedSum, cur)} ${plannedSum > b.total ? 'exceeds' : 'is under'} total`) : '')),
          h('div', { class: 'row top wrap mt', style: { gap: '18px' } },
            h('div', { style: { position: 'relative', flexShrink: 0 } }, donut(cats.map((c) => ({ label: c.name, value: Number(c.planned) || 0, color: c.color || '#999' }))),
              h('div', { style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' } }, h('div', null, h('div', { class: 'xs muted' }, 'Planned'), h('b', null, money(plannedSum, cur))))),
            h('div', { class: 'col gap-s grow small' }, cats.map((c) => h('div', { class: 'row', style: { gap: '8px' } }, h('span', { class: 'dot', style: { background: c.color } }), h('span', { class: 'grow ellipsis' }, c.name),
              h('span', { class: 'muted num' }, plannedSum ? `${Math.round(((Number(c.planned) || 0) / plannedSum) * 100)}%` : ''), h('span', { class: 'num', style: { width: '78px', textAlign: 'right' } }, money(c.planned || 0, cur))))))),
        h('div', { class: 'card' },
          h('div', { class: 'card-title' }, 'Spent vs planned'),
          h('div', { class: 'col mt' }, cats.map((c) => {
            const spent = exps.filter((e) => e.cat === c.id).reduce((s, e) => s + cost(e), 0);
            const max = Math.max(...cats.map((x) => Math.max(Number(x.planned) || 0, exps.filter((e) => e.cat === x.id).reduce((s, e) => s + cost(e), 0))), 1);
            return h('div', { class: 'small' }, h('div', { class: 'row between' }, h('span', null, c.name), h('span', { class: ['num', spent > (c.planned || 0) && c.planned ? 'neg' : 'muted'] }, `${money(spent, cur)} / ${money(c.planned || 0, cur)}`)),
              h('div', { style: { position: 'relative', height: '10px', background: 'var(--fill-2)', borderRadius: '5px', marginTop: '4px' } },
                h('div', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((c.planned || 0) / max) * 100}%`, borderRadius: '5px', background: c.color, opacity: 0.25 } }),
                h('div', { style: { position: 'absolute', left: 0, top: '2px', bottom: '2px', width: `${(spent / max) * 100}%`, borderRadius: '4px', background: spent > (c.planned || 0) && c.planned ? 'var(--red)' : c.color } })));
          })))) : null,
      pays.length ? [h('div', { class: 'section-h' }, 'Upcoming payments'),
        h('div', { class: 'list' }, pays.slice(0, 6).map((p) => h('div', { class: 'list-item tap', onclick: () => expenseSheet(p.expense) },
          h('div', { class: 'icon-tile', style: { background: p.date < t0 ? 'var(--red)' : 'var(--orange)' } }, icon('euro')),
          h('div', { class: 'grow' }, h('div', { class: 'title' }, p.title), h('div', { class: 'meta' }, fmtDate(p.date, 'long'))),
          h('b', { class: 'num' }, money(p.amount, cur)), h('span', { class: ['small', p.date < t0 ? 'neg' : 'muted'] }, relDay(p.date)),
          editable && p.index !== undefined ? h('button', { class: 'btn s tinted', onclick: (e) => { e.stopPropagation(); const pp = structuredClone(p.expense.payments); pp[p.index].paid = true; pp[p.index].paidAt = today(); patch('expense', p.expense.id, { payments: pp }); toast('Marked as paid'); } }, 'Mark paid') : null)))] : null,
      h('div', { class: 'section-h' }, 'Categories', editable && h('button', { class: 'more btn plain s', onclick: () => catSheet(null) }, icon('plus'), 'Category')),
      cats.length ? h('div', { class: 'col' }, cats.map((c) => catCard(c, exps.filter((e) => e.cat === c.id))), uncategorised.length ? catCard(null, uncategorised) : null)
        : emptyState('budget', 'Plan your budget', 'Start with the usual wedding categories and suggested amounts, or create your own.',
          editable && h('button', { class: 'btn primary', onclick: async () => {
            const total = Number(store.wedding.budget) || Number(await promptBox({ title: 'Total budget', label: `In ${cur}`, value: '25000', confirm: 'Continue' })) || 0;
            if (!store.wedding.budget && total && isPlanner()) await saveWedding({ budget: total });
            await bulk(BUDGET_CATEGORIES.map((c, i) => ({ op: 'create', type: 'budget_cat', data: { name: c.name, color: c.color, planned: Math.round((total * c.pct) / 100), _sort: i } })));
          } }, icon('sparkle'), 'Use suggested categories')));
  },
};
function rr() { import('../lib/store.js').then((m) => m.emit()); }
