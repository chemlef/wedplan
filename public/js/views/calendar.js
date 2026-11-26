import { h, icon, sheet, menu, toast, field, input, select, toggle, fmtDate, relDay, today, isoDate, addDays, money, copyText, download, emptyState } from '../lib/ui.js';
import { store, list, can, create, patch, remove, taskDue, isPlanner, currency, coupleNames } from '../lib/store.js';
import { api } from '../lib/api.js';
import { taskSheet } from './timeline.js';
import { upcomingPayments } from './dashboard.js';
import { navigate } from '../app.js';

const ui = { month: null };
export const EVENT_TYPES = [
  { value: 'appointment', label: 'Appointment', cls: '' }, { value: 'meeting', label: 'Vendor meeting', cls: 'meet' },
  { value: 'tasting', label: 'Tasting', cls: 'meet' }, { value: 'fitting', label: 'Fitting', cls: '' },
  { value: 'payment', label: 'Payment reminder', cls: 'pay' }, { value: 'deadline', label: 'Deadline', cls: 'task' },
  { value: 'party', label: 'Party / celebration', cls: '' }, { value: 'other', label: 'Other', cls: '' },
];

export function eventSheet(ev, defaults = {}) {
  const d = ev ? { ...ev } : { title: '', type: 'appointment', date: today(), time: '', allDay: false, duration: 60, ...defaults };
  const timeInp = input({ type: 'time', value: d.time || '', oninput: (e) => { d.time = e.target.value; } });
  const timeRow = h('div', { class: 'form-row' }, field('Time', timeInp), field('Duration (minutes)', input({ type: 'number', min: 0, step: 15, value: d.duration || 60, oninput: (e) => { d.duration = Number(e.target.value); } })));
  if (d.allDay) timeRow.style.display = 'none';
  const editable = can('calendar', 'edit');
  const s = sheet({
    title: ev ? 'Event' : 'New event', doneLabel: ev ? 'Save' : 'Add',
    body: h('div', { class: 'form' },
      field('Title', input({ value: d.title, placeholder: 'e.g. Cake tasting at Bakery Mimosa', oninput: (e) => { d.title = e.target.value; } })),
      h('div', { class: 'form-row' },
        field('Type', select(EVENT_TYPES, d.type, (v) => { d.type = v; })),
        field('Date', input({ type: 'date', value: d.date, oninput: (e) => { d.date = e.target.value; } }))),
      h('label', { class: 'row' }, h('span', { class: 'grow' }, 'All day'), toggle(!!d.allDay, (v) => { d.allDay = v; timeRow.style.display = v ? 'none' : ''; })),
      timeRow,
      field('Location', input({ value: d.location || '', oninput: (e) => { d.location = e.target.value; } })),
      field('Amount (for payment reminders)', input({ type: 'number', min: 0, value: d.amount || '', oninput: (e) => { d.amount = Number(e.target.value) || null; } })),
      field('Notes', h('textarea', { class: 'input', rows: 3, oninput: (e) => { d.notes = e.target.value; } }, d.notes || ''))),
    done: editable ? async () => {
      if (!d.title.trim() || !d.date) { toast('Add a title and date', { error: true }); return false; }
      const { id, type: _, _sort, _updated, _by, ...data } = d;
      data.type = d.type;
      if (ev) await patch('event', ev.id, data); else await create('event', data);
    } : null,
    footer: ev && editable ? [h('button', { class: 'btn danger', onclick: () => { s.close(); remove('event', ev.id, { label: 'Event' }); } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

function collect() {
  const items = [];
  const w = store.wedding;
  if (w.date) items.push({ date: w.date, title: `💍 ${coupleNames()}`, cls: 'wed', time: w.time });
  if (can('timeline')) list('task').forEach((t) => { const due = taskDue(t); if (due) items.push({ date: due, title: t.title, cls: `task${t.done ? ' done' : ''}`, onClick: () => taskSheet(t), kind: 'Task' }); });
  if (can('calendar')) list('event').forEach((e) => items.push({ date: e.date, title: e.title, time: e.allDay ? null : e.time, cls: EVENT_TYPES.find((x) => x.value === e.type)?.cls || '', onClick: () => eventSheet(e), kind: EVENT_TYPES.find((x) => x.value === e.type)?.label, ev: e }));
  if (can('budget')) upcomingPayments().forEach((p) => items.push({ date: p.date, title: `€ ${p.title}`, cls: 'pay', amount: p.amount, onClick: () => navigate('/budget'), kind: 'Payment due' }));
  return items.sort((a, b) => a.date.localeCompare(b.date) || String(a.time || '').localeCompare(String(b.time || '')));
}

function icsFile(items) {
  const escI = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WedPlan//EN', `X-WR-CALNAME:${escI(coupleNames())}`];
  items.forEach((it, i) => {
    const d = it.date.replace(/-/g, '');
    lines.push('BEGIN:VEVENT', `UID:${d}-${i}@wedplan`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`);
    if (it.time) lines.push(`DTSTART:${d}T${it.time.replace(':', '')}00`);
    else lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${addDays(it.date, 1).replace(/-/g, '')}`);
    lines.push(`SUMMARY:${escI(it.title)}`, 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function subscribeSheet() {
  const url = `${location.origin}/api/ical/${store.wedding.icalToken}.ics`;
  const webcal = url.replace(/^https?:/, 'webcal:');
  sheet({
    title: 'Subscribe on your phone', size: 'narrow',
    body: h('div', { class: 'form' },
      h('p', { class: 'small' }, 'Add the wedding calendar to Apple Calendar, Google Calendar or Outlook. Tasks, events, payments and the wedding day stay in sync automatically.'),
      h('div', { class: 'input-group' }, input({ value: url, readonly: true, onclick: (e) => e.target.select() }), h('button', { class: 'btn plain', onclick: () => copyText(url, 'Calendar link copied') }, icon('copy'))),
      h('a', { class: 'btn primary', href: webcal }, icon('calendar'), 'Open in Calendar app'),
      h('div', { class: 'small muted' }, 'Google Calendar: Other calendars → + → From URL, then paste the link.'),
      h('button', { class: 'btn plain danger', onclick: async () => {
        const r = await api.post(`/api/w/${store.wedding.id}/ical-token`);
        store.wedding.icalToken = r.icalToken; toast('New link created. The old one no longer works.');
      } }, icon('refresh'), 'Reset link (stops old subscriptions)')),
  });
}

export default {
  title: 'Calendar',
  mounted(ctx) { if (ctx.query.get('new') === '1' && can('calendar', 'edit')) { history.replaceState({}, '', '/calendar'); eventSheet(null); } },
  render() {
    const now = new Date();
    if (!ui.month) ui.month = [now.getFullYear(), now.getMonth()];
    const [y, m] = ui.month;
    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday first
    const start = new Date(y, m, 1 - startOffset);
    const items = collect();
    const byDay = new Map();
    items.forEach((it) => { if (!byDay.has(it.date)) byDay.set(it.date, []); byDay.get(it.date).push(it); });
    const t0 = today();
    const editable = can('calendar', 'edit');
    const weeks = Math.ceil((startOffset + new Date(y, m + 1, 0).getDate()) / 7);

    const cells = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = isoDate(d);
      const its = byDay.get(iso) || [];
      cells.push(h('div', {
        class: ['cal-day', d.getMonth() !== m && 'out', iso === t0 && 'today', iso === store.wedding.date && 'wedding'],
        onclick: () => (editable ? eventSheet(null, { date: iso }) : null),
      },
      h('div', { class: 'dn' }, d.getDate()),
      its.slice(0, 3).map((it) => h('div', { class: ['cal-ev', it.cls], title: `${it.kind ? `${it.kind}: ` : ''}${it.title}${it.time ? ` · ${it.time}` : ''}`, onclick: (e) => { e.stopPropagation(); it.onClick?.(); } }, it.time ? `${it.time} ` : '', it.title)),
      its.length > 3 ? h('div', { class: 'cal-more', onclick: (e) => { e.stopPropagation(); menu(e.currentTarget, its.map((it) => ({ label: it.title, icon: it.cls.includes('task') ? 'timeline' : it.cls === 'pay' ? 'euro' : 'calendar', onClick: () => it.onClick?.() }))); } }, `+${its.length - 3} more`) : null));
    }
    const agenda = items.filter((it) => it.date >= t0).slice(0, 14);

    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, fmtDate(isoDate(first), 'month')), h('div', { class: 'sub' }, 'Tasks, appointments, payments and the big day in one place.')),
        h('div', { class: 'actions' },
          h('button', { class: 'btn icon', 'aria-label': 'Previous month', onclick: () => { ui.month = m === 0 ? [y - 1, 11] : [y, m - 1]; rr(); } }, icon('chevronL')),
          h('button', { class: 'btn', onclick: () => { ui.month = null; rr(); } }, 'Today'),
          h('button', { class: 'btn icon', 'aria-label': 'Next month', onclick: () => { ui.month = m === 11 ? [y + 1, 0] : [y, m + 1]; rr(); } }, icon('chevron')),
          store.wedding.date && h('button', { class: 'btn', onclick: () => { const d = new Date(`${store.wedding.date}T12:00`); ui.month = [d.getFullYear(), d.getMonth()]; rr(); } }, icon('ring'), h('span', { class: 'hide-m' }, 'Wedding month')),
          h('button', { class: 'btn', onclick: (e) => menu(e.currentTarget, [
            isPlanner() && store.wedding.icalToken && { label: 'Subscribe on phone / Google…', icon: 'calendar', onClick: subscribeSheet },
            { label: 'Download .ics file', icon: 'download', onClick: () => download('wedding-calendar.ics', icsFile(items), 'text/calendar') },
          ]) }, icon('more')),
          editable && h('button', { class: 'btn primary', onclick: () => eventSheet(null) }, icon('plus'), 'Event'))),
      h('div', { class: 'row wrap mb', style: { gap: '6px' } },
        h('span', { class: 'cal-ev wed', style: { display: 'inline-block' } }, 'Wedding'), h('span', { class: 'cal-ev task', style: { display: 'inline-block' } }, 'Checklist task'),
        h('span', { class: 'cal-ev', style: { display: 'inline-block' } }, 'Appointment'), h('span', { class: 'cal-ev meet', style: { display: 'inline-block' } }, 'Meeting / tasting'), h('span', { class: 'cal-ev pay', style: { display: 'inline-block' } }, 'Payment')),
      h('div', { class: 'cal' },
        h('div', { class: 'cal-head' }, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => h('div', null, d))),
        h('div', { class: 'cal-grid' }, cells)),
      h('div', { class: 'section-h' }, 'Coming up'),
      agenda.length ? h('div', { class: 'list' }, agenda.map((it) => h('div', { class: 'list-item tap', onclick: () => it.onClick?.() },
        h('div', { style: { width: '54px', textAlign: 'center', flexShrink: 0 } }, h('div', { class: 'xs muted', style: { textTransform: 'uppercase' } }, new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(`${it.date}T12:00`))), h('div', { style: { fontSize: '20px', fontWeight: 600 } }, Number(it.date.slice(8)))),
        h('span', { class: ['cal-ev', it.cls], style: { width: '6px', height: '32px', padding: 0, fontSize: 0 } }),
        h('div', { class: 'grow' }, h('div', { class: 'title' }, it.title), h('div', { class: 'meta' }, [it.kind, it.time, it.ev?.location, it.amount ? money(it.amount, currency()) : null].filter(Boolean).join(' · '))),
        h('span', { class: 'small muted nowrap' }, relDay(it.date)))))
        : emptyState('calendar', 'Nothing coming up', 'Add appointments, tastings, fittings and payment reminders. Checklist tasks appear here automatically.'));
  },
};
function rr() { import('../lib/store.js').then((m) => m.emit()); }
