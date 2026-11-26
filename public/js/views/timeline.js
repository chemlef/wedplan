import { h, icon, sheet, menu, toast, field, input, select, seg, toggle, confirmBox, checkCircle, fmtDate, relDay, today, daysBetween, plural, emptyState, sortable } from '../lib/ui.js';
import { store, list, can, create, patch, remove, bulk, taskDue, isPlanner } from '../lib/store.js';
import { TASKS, GREEK_TASKS, CIVIL_TASKS } from '../lib/templates.js';
import { fitOffset } from '../app.js';

const ui = { showDone: false, cat: '', who: '', view: 'timeline' };

const PERIODS = [
  { min: 365, label: '12+ months before' }, { min: 270, label: '9–12 months before' }, { min: 180, label: '6–9 months before' },
  { min: 120, label: '4–6 months before' }, { min: 60, label: '2–4 months before' }, { min: 30, label: '1–2 months before' },
  { min: 14, label: '2–4 weeks before' }, { min: 1, label: 'The final two weeks' }, { min: 0, label: 'Wedding day' }, { min: -Infinity, label: 'After the wedding' },
];

export function people() {
  const names = new Set();
  if (store.wedding.partner1) names.add(store.wedding.partner1);
  if (store.wedding.partner2) names.add(store.wedding.partner2);
  (store.planners || []).forEach((p) => names.add(p.name || p.email));
  (store.members || []).forEach((m) => names.add(m.name || m.username));
  if (store.me?.name) names.add(store.me.name);
  return [...names].filter(Boolean);
}

export function taskSheet(t, defaults = {}) {
  const d = t ? { ...t } : { title: '', cat: '', offset: null, date: today(), ...defaults };
  const w = store.wedding;
  let mode = t ? (t.offset != null ? 'relative' : t.date ? 'date' : 'none') : (defaults.offset != null ? 'relative' : 'date');
  let amount = Math.abs(Number(d.offset) || 30); let unit = 'days'; let dir = Number(d.offset) < 0 ? 'after' : 'before';
  if (amount % 30 === 0 && amount >= 30) { amount /= 30; unit = 'months'; } else if (amount % 7 === 0 && amount >= 7) { amount /= 7; unit = 'weeks'; }
  const relBox = h('div', { class: 'row' },
    input({ type: 'number', min: 0, value: amount, style: { width: '80px' }, oninput: (e) => { amount = Number(e.target.value); } }),
    select(['days', 'weeks', 'months'], unit, (v) => { unit = v; }, { style: { width: 'auto' } }),
    select([{ value: 'before', label: 'before the wedding' }, { value: 'after', label: 'after the wedding' }], dir, (v) => { dir = v; }, { style: { width: 'auto' } }));
  const dateBox = input({ type: 'date', value: d.date || today(), oninput: (e) => { d.date = e.target.value; } });
  const whenBody = h('div');
  const drawWhen = () => whenBody.replaceChildren(mode === 'relative' ? relBox : mode === 'date' ? dateBox : h('div', { class: 'small muted' }, 'No due date'));
  const modeSeg = seg([{ value: 'relative', label: 'Relative to wedding' }, { value: 'date', label: 'Fixed date' }, { value: 'none', label: 'None' }], mode, (v) => {
    mode = v; modeSeg.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', ['relative', 'date', 'none'][i] === v)); drawWhen();
  });
  drawWhen();
  const editable = can('timeline', 'edit');
  const s = sheet({
    title: t ? 'Task' : 'New task', doneLabel: t ? 'Save' : 'Add',
    body: h('div', { class: 'form' },
      field('Task', input({ value: d.title, oninput: (e) => { d.title = e.target.value; }, placeholder: 'e.g. Book the florist' })),
      field('Due', h('div', { class: 'col' }, modeSeg, whenBody), mode === 'relative' && !w.date ? 'Set the wedding date in settings to see the actual date.' : 'Relative dates move automatically if the wedding date changes.'),
      h('div', { class: 'form-row' },
        field('Category', h('span', null, input({ value: d.cat || '', list: 'cats', oninput: (e) => { d.cat = e.target.value; } }), h('datalist', { id: 'cats' }, [...new Set(list('task').map((x) => x.cat).filter(Boolean))].map((c) => h('option', { value: c }))))),
        field('Who’s on it', h('span', null, input({ value: d.who || '', list: 'whos', placeholder: 'Anyone', oninput: (e) => { d.who = e.target.value; } }), h('datalist', { id: 'whos' }, people().map((c) => h('option', { value: c })))))),
      field('Notes', h('textarea', { class: 'input', rows: 3, oninput: (e) => { d.notes = e.target.value; } }, d.notes || '')),
      t?.link && h('a', { class: 'btn tinted', href: t.link, onclick: () => s.close() }, 'Open related page', icon('chevron'))),
    done: editable ? async () => {
      if (!d.title.trim()) { toast('Give the task a name', { error: true }); return false; }
      const mult = unit === 'months' ? 30 : unit === 'weeks' ? 7 : 1;
      const data = { title: d.title.trim(), cat: d.cat || null, who: d.who || null, notes: d.notes || null,
        offset: mode === 'relative' ? amount * mult * (dir === 'after' ? -1 : 1) : null, date: mode === 'date' ? d.date : null };
      if (t) await patch('task', t.id, data); else await create('task', data);
    } : null,
    footer: t && editable ? [h('button', { class: 'btn danger', onclick: () => { s.close(); remove('task', t.id, { label: 'Task' }); } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

async function rebuild() {
  const w = store.wedding;
  const choice = await new Promise((resolve) => {
    let trad = w.tradition || 'greek';
    sheet({
      title: 'Add tasks from the template', doneLabel: 'Add missing tasks', size: 'narrow',
      body: h('div', { class: 'form' },
        h('p', { class: 'small muted' }, 'Adds the standard wedding-planning tasks you don’t already have. Your own tasks and changes stay as they are.'),
        field('Ceremony type', select([{ value: 'greek', label: 'Greek Orthodox' }, { value: 'civil', label: 'Civil' }, { value: 'other', label: 'Other' }], trad, (v) => { trad = v; }))),
      done: () => resolve(trad), onClose: () => resolve(null),
    });
  });
  if (!choice) return;
  const have = new Set(list('task').map((t) => t.title.toLowerCase()));
  const tpl = [...TASKS, ...(choice === 'greek' ? GREEK_TASKS : choice === 'civil' ? CIVIL_TASKS : [])].filter((t) => !have.has(t.title.toLowerCase()));
  if (!tpl.length) return toast('You already have every template task');
  await bulk(tpl.map((t, i) => ({ op: 'create', type: 'task', data: { title: t.title, offset: fitOffset(t.offset, w.date), cat: t.cat, link: t.link || null, auto: true, _sort: Date.now() / 1e6 + i / 1e6 } })), `added ${tpl.length} template tasks`);
  toast(`Added ${plural(tpl.length, 'task')}`);
}

export default {
  title: 'Checklist',
  mounted(ctx) { if (ctx.query.get('new') === '1') { history.replaceState({}, '', '/timeline'); taskSheet(null); } },
  render() {
    const w = store.wedding;
    const editable = can('timeline', 'edit');
    const all = list('task').map((t) => ({ ...t, due: taskDue(t) }));
    const done = all.filter((t) => t.done).length;
    const t0 = today();
    const cats = [...new Set(all.map((t) => t.cat).filter(Boolean))].sort();
    const whos = [...new Set(all.map((t) => t.who).filter(Boolean))].sort();
    let tasks = all.filter((t) => (ui.showDone || !t.done) && (!ui.cat || t.cat === ui.cat) && (!ui.who || t.who === ui.who));
    const overdue = all.filter((t) => !t.done && t.due && t.due < t0).length;

    const row = (t) => h('div', { class: 'list-item tap', 'data-id': t.id, onclick: () => taskSheet(list('task').find((x) => x.id === t.id)) },
      editable ? checkCircle(t.done, () => patch('task', t.id, { done: !t.done, doneAt: t.done ? null : Date.now() })) : h('span', { class: ['check', t.done && 'on'] }, icon('check')),
      h('div', { class: 'grow' },
        h('div', { class: ['title', t.done && 'done-text'] }, t.title),
        h('div', { class: 'meta' }, [t.cat, t.who && `👤 ${t.who}`, t.notes && '📝'].filter(Boolean).join(' · '))),
      t.due && h('span', { class: ['small nowrap', !t.done && t.due < t0 ? 'neg' : 'muted'], title: fmtDate(t.due, 'long') }, t.done ? fmtDate(t.due, 'short') : relDay(t.due)),
      t.link && h('a', { class: 'btn plain icon s', href: t.link, 'aria-label': 'Open related page', onclick: (e) => e.stopPropagation() }, icon('chevron')));

    let body;
    if (ui.view === 'timeline' && w.date) {
      const groups = PERIODS.map((p) => ({ ...p, items: [] }));
      const noDate = [];
      for (const t of tasks.sort((a, b) => (a.due || '9').localeCompare(b.due || '9'))) {
        if (!t.due) { noDate.push(t); continue; }
        const before = daysBetween(t.due, w.date);
        groups.find((g) => before >= g.min).items.push(t);
      }
      const nowBefore = daysBetween(t0, w.date);
      body = h('div', null, groups.filter((g) => g.items.length).map((g, i, arr) => {
        const next = PERIODS[PERIODS.indexOf(PERIODS.find((p) => p.label === g.label)) - 1];
        const isNow = nowBefore >= g.min && (!next || nowBefore < next.min);
        const isPast = nowBefore < g.min;
        return h('div', { class: ['tl-period', isNow && 'now', isPast && 'past'], style: { paddingBottom: '22px' } },
          h('div', { class: 'tl-dot' }),
          h('div', { class: 'tl-head' }, h('h3', null, g.label), isNow && h('span', { class: 'chip accent' }, 'You are here'),
            h('span', { class: 'small muted' }, `${g.items.filter((t) => t.done).length}/${g.items.length}`)),
          h('div', { class: 'list' }, g.items.map(row)));
      }), noDate.length ? h('div', { class: 'tl-period', style: { paddingBottom: '20px' } }, h('div', { class: 'tl-dot' }), h('div', { class: 'tl-head' }, h('h3', null, 'No due date')), h('div', { class: 'list' }, noDate.map(row))) : null);
    } else {
      const sorted = ui.view === 'manual' ? tasks : tasks.sort((a, b) => (a.due || '9').localeCompare(b.due || '9'));
      const l = h('div', { class: 'list' }, sorted.map((t) => { const r = row(t); if (ui.view === 'manual' && editable) r.prepend(h('span', { class: 'handle', onclick: (e) => e.stopPropagation() }, icon('grip'))); return r; }));
      if (ui.view === 'manual' && editable) sortable(l, (ids) => bulk(ids.map((id, i) => ({ op: 'patch', type: 'task', id, data: { _sort: i } }))));
      body = l;
    }

    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Checklist'), h('div', { class: 'sub' }, `${done} of ${all.length} done${overdue ? ` · ` : ''}`, overdue ? h('span', { class: 'neg' }, `${overdue} overdue`) : '',
          !w.date ? ' · set the wedding date to see due dates' : '')),
        h('div', { class: 'actions' },
          h('button', { class: 'btn', onclick: (e) => menu(e.currentTarget, [
            { label: ui.showDone ? 'Hide completed' : 'Show completed', icon: 'check', onClick: () => { ui.showDone = !ui.showDone; rr(); } },
            editable && isPlanner() && { label: 'Add tasks from the template…', icon: 'sparkle', onClick: rebuild },
            editable && isPlanner() && { label: 'Delete completed tasks', icon: 'trash', danger: true, onClick: async () => {
              const ids = list('task').filter((t) => t.done).map((t) => t.id);
              if (ids.length && await confirmBox({ title: `Delete ${plural(ids.length, 'completed task')}?`, confirm: 'Delete', destructive: true })) bulk(ids.map((id) => ({ op: 'delete', type: 'task', id })));
            } },
          ]) }, icon('more')),
          editable && h('button', { class: 'btn primary', onclick: () => taskSheet(null) }, icon('plus'), 'Add task'))),
      all.length ? h('div', { class: 'toolbar' },
        seg([{ value: 'timeline', label: 'By stage' }, { value: 'date', label: 'By date' }, { value: 'manual', label: 'My order' }], ui.view, (v) => { ui.view = v; rr(); }),
        cats.length ? select([{ value: '', label: 'All categories' }, ...cats], ui.cat, (v) => { ui.cat = v; rr(); }, { class: 'input s', style: { width: 'auto' } }) : null,
        whos.length ? select([{ value: '', label: 'Everyone' }, ...whos], ui.who, (v) => { ui.who = v; rr(); }, { class: 'input s', style: { width: 'auto' } }) : null,
        h('label', { class: 'row small muted' }, 'Show completed', toggle(ui.showDone, (v) => { ui.showDone = v; rr(); })),
        h('div', { class: 'progress grow', style: { minWidth: '120px', maxWidth: '260px', marginLeft: 'auto' } }, h('span', { style: { width: `${all.length ? (done / all.length) * 100 : 0}%` } }))) : null,
      all.length ? (tasks.length ? body : h('div', { class: 'card center muted' }, 'All caught up 🎉 ', h('button', { class: 'btn plain', onclick: () => { ui.showDone = true; rr(); } }, 'Show completed')))
        : emptyState('timeline', 'No tasks yet', 'Start from a full wedding-planning checklist with due dates worked out from your wedding date, or add your own.',
          editable && h('div', { class: 'row', style: { justifyContent: 'center' } }, isPlanner() && h('button', { class: 'btn', onclick: rebuild }, icon('sparkle'), 'Use the template'), h('button', { class: 'btn primary', onclick: () => taskSheet(null) }, icon('plus'), 'Add task'))));
  },
};
function rr() { import('../lib/store.js').then((m) => m.emit()); }
