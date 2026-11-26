import { h, icon, fmtDate, relDay, daysBetween, today, money, plural, timeAgo, checkCircle, addDays } from '../lib/ui.js';
import { store, list, can, isPlanner, coupleNames, currency, taskDue, patch, guestName } from '../lib/store.js';
import { api } from '../lib/api.js';

let activity = null;
let activityFor = null;

function countdown(date) {
  if (!date) return null;
  const ms = new Date(`${date}T${store.wedding.time || '17:00'}:00`) - Date.now();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  return [[d, d === 1 ? 'day' : 'days'], [Math.floor((ms % 86400000) / 3600000), 'hours']];
}

function statCard(href, ic, title, value, label, bar) {
  return h('a', { class: 'card stat-card', href },
    h('div', { class: 'head' }, icon(ic), title, h('span', { style: { marginLeft: 'auto' } }, icon('chevron', 'faint'))),
    h('div', { class: 'stat' }, h('div', { class: 'v' }, value), h('div', { class: 'l' }, label)),
    bar);
}

export function budgetTotals() {
  const cats = list('budget_cat');
  const exp = list('expense');
  const total = Number(store.wedding.budget) || cats.reduce((s, c) => s + (Number(c.planned) || 0), 0);
  const committed = exp.reduce((s, e) => s + (Number(e.actual) || Number(e.estimate) || 0), 0);
  const paid = exp.reduce((s, e) => s + (e.payments?.length ? e.payments.filter((p) => p.paid).reduce((a, p) => a + (Number(p.amount) || 0), 0) : (e.paid ? Number(e.actual) || Number(e.estimate) || 0 : 0)), 0);
  return { total, committed, paid };
}

export function upcomingPayments() {
  const out = [];
  for (const e of list('expense')) {
    if (e.payments?.length) e.payments.forEach((p, i) => { if (!p.paid && p.due) out.push({ date: p.due, title: e.name, amount: p.amount, expense: e, index: i }); });
    else if (e.due && !e.paid) out.push({ date: e.due, title: e.name, amount: Number(e.actual) || Number(e.estimate) || 0, expense: e });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export default {
  title: 'Overview',
  render() {
    const w = store.wedding;
    const cd = countdown(w.date);
    const daysLeft = w.date ? daysBetween(today(), w.date) : null;
    const guests = list('guest');
    const yes = guests.filter((g) => g.rsvp === 'yes').length;
    const no = guests.filter((g) => g.rsvp === 'no').length;
    const pending = guests.length - yes - no;
    const tasks = list('task');
    const done = tasks.filter((t) => t.done).length;
    const t0 = today();
    const open = tasks.filter((t) => !t.done).map((t) => ({ ...t, due: taskDue(t) }));
    const overdue = open.filter((t) => t.due && t.due < t0).sort((a, b) => a.due.localeCompare(b.due));
    const soon = open.filter((t) => t.due && t.due >= t0 && t.due <= addDays(t0, 30)).sort((a, b) => a.due.localeCompare(b.due));
    const undated = open.filter((t) => !t.due);
    const seated = guests.filter((g) => g.table && g.rsvp !== 'no').length;
    const toSeat = guests.filter((g) => g.rsvp !== 'no').length;

    const hero = h('div', { class: 'hero' },
      h('div', null,
        h('div', { class: 'names' }, coupleNames()),
        h('div', { class: 'when' }, w.date ? `${fmtDate(w.date, 'long')}${w.time ? ` · ${w.time}` : ''}` : 'Set your wedding date in settings',
          w.ceremony?.name ? ` · ${w.ceremony.name}` : '')),
      cd ? h('div', { class: 'count' }, cd.map(([n, l]) => h('div', null, h('b', null, n), h('span', null, l))))
        : daysLeft !== null && daysLeft <= 0 ? h('div', { class: 'count' }, h('div', null, h('b', null, '♥'), h('span', null, daysLeft === 0 ? 'Today' : 'Married'))) : null,
      decoRings());

    const stats = [];
    if (can('guests')) {
      stats.push(statCard('/guests', 'guests', 'Guests', guests.length ? `${yes} / ${guests.length}` : '0',
        guests.length ? `attending · ${pending} awaiting reply${no ? ` · ${no} declined` : ''}` : 'Start your guest list',
        h('div', { class: 'progress' }, h('span', { class: 'g', style: { width: `${guests.length ? (yes / guests.length) * 100 : 0}%` } }),
          h('span', { class: 'r', style: { width: `${guests.length ? (no / guests.length) * 100 : 0}%`, opacity: 0.6 } }))));
    }
    if (can('timeline')) {
      stats.push(statCard('/timeline', 'timeline', 'Checklist', `${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%`,
        `${done} of ${tasks.length} tasks done${overdue.length ? ` · ${overdue.length} overdue` : ''}`,
        h('div', { class: 'progress' }, h('span', { style: { width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` } }))));
    }
    if (can('budget')) {
      const b = budgetTotals();
      const pct = b.total ? (b.committed / b.total) * 100 : 0;
      stats.push(statCard('/budget', 'budget', 'Budget', money(b.total - b.committed, currency()),
        `left of ${money(b.total, currency())} · ${money(b.paid, currency())} paid`,
        h('div', { class: 'progress' }, h('span', { class: pct > 100 ? 'r' : pct > 90 ? 'o' : '', style: { width: `${Math.min(100, pct)}%` } }))));
    }
    if (can('seating')) {
      stats.push(statCard('/seating', 'seating', 'Seating', `${seated} / ${toSeat}`, `guests seated at ${plural(list('table').length, 'table')}`,
        h('div', { class: 'progress' }, h('span', { style: { width: `${toSeat ? (seated / toSeat) * 100 : 0}%` } }))));
    }

    const taskRow = (t) => h('div', { class: 'list-item' },
      checkCircle(t.done, () => patch('task', t.id, { done: !t.done, doneAt: t.done ? null : Date.now() })),
      h('div', { class: 'grow' }, h('div', { class: 'title' }, t.title), t.cat && h('div', { class: 'meta' }, t.cat)),
      t.due && h('span', { class: ['small nowrap', t.due < t0 ? 'neg' : 'muted'] }, relDay(t.due)),
      t.link && h('a', { class: 'btn plain icon s', href: t.link, 'aria-label': 'Open' }, icon('chevron')));

    const nextTasks = [...overdue, ...soon].slice(0, 8);
    const canTasks = can('timeline', 'edit');

    // Upcoming: events + payments, next 45 days
    const upcoming = [];
    if (can('calendar')) list('event').filter((e) => e.date >= t0 && e.date <= addDays(t0, 45)).forEach((e) => upcoming.push({ date: e.date, title: e.title, time: e.time, icon: 'calendar', href: '/calendar' }));
    if (can('budget')) upcomingPayments().filter((p) => p.date <= addDays(t0, 45)).forEach((p) => upcoming.push({ date: p.date, title: `Payment: ${p.title}`, amount: p.amount, icon: 'euro', href: '/budget', overdue: p.date < t0 }));
    upcoming.sort((a, b) => a.date.localeCompare(b.date));

    const replies = can('guests') ? guests.filter((g) => g.rsvpAt).sort((a, b) => b.rsvpAt - a.rsvpAt).slice(0, 6) : [];

    if (isPlanner() && activityFor !== store.wedding.id) {
      activityFor = store.wedding.id;
      api.get(`/api/w/${store.wedding.id}/activity`).then((r) => { activity = r.activity; import('../lib/store.js').then((m) => m.emit()); }).catch(() => {});
    }

    const quick = [
      can('guests', 'edit') && { href: '/guests?new=1', icon: 'plus', label: 'Add guest' },
      can('seating', 'edit') && { href: '/seating', icon: 'wand', label: 'Arrange seating' },
      can('invitations', 'edit') && { href: '/invitations', icon: 'invite', label: 'Design invitation' },
      can('budget', 'edit') && { href: '/budget?new=1', icon: 'euro', label: 'Log expense' },
      can('calendar', 'edit') && { href: '/calendar?new=1', icon: 'calendar', label: 'Add event' },
      can('style') && { href: '/style', icon: 'flower', label: 'Build a bouquet' },
    ].filter(Boolean);

    return h('div', null,
      hero,
      quick.length && h('div', { class: 'row wrap mt' }, quick.map((q) => h('a', { class: 'btn tinted', href: q.href }, icon(q.icon), q.label))),
      stats.length && h('div', { class: 'grid c4 mt-l' }, stats),
      h('div', { class: 'grid c2 mt-l' },
        can('timeline') && h('div', null,
          h('div', { class: 'section-h' }, overdue.length ? h('span', { class: 'neg' }, `Overdue (${overdue.length}) & next 30 days`) : 'Next 30 days', h('a', { class: 'more', href: '/timeline' }, 'All tasks')),
          h('div', { class: 'list' }, nextTasks.length ? nextTasks.map(canTasks ? taskRow : (t) => taskRow({ ...t, link: null }))
            : h('div', { class: 'list-empty' }, !w.date ? 'Set the wedding date to see due dates.' : undated.length ? 'Nothing due soon — nice work!' : 'Nothing due in the next 30 days.'))),
        h('div', null,
          upcoming.length || can('calendar') ? [
            h('div', { class: 'section-h' }, 'Coming up', can('calendar') && h('a', { class: 'more', href: '/calendar' }, 'Calendar')),
            h('div', { class: 'list' }, upcoming.length ? upcoming.slice(0, 7).map((u) => h('a', { class: 'list-item tap with-icon', href: u.href, style: { color: 'inherit', textDecoration: 'none' } },
              h('div', { class: 'icon-tile', style: { background: u.overdue ? 'var(--red)' : u.icon === 'euro' ? 'var(--orange)' : 'var(--accent)' } }, icon(u.icon)),
              h('div', { class: 'grow' }, h('div', { class: 'title' }, u.title), h('div', { class: 'meta' }, `${fmtDate(u.date, 'long')}${u.time ? ` · ${u.time}` : ''}`)),
              u.amount ? h('span', { class: 'num small' }, money(u.amount, currency())) : null,
              h('span', { class: ['small nowrap', u.overdue ? 'neg' : 'muted'] }, relDay(u.date))))
              : h('div', { class: 'list-empty' }, 'No events or payments in the next 45 days.'))] : null,
          replies.length ? [
            h('div', { class: 'section-h' }, 'Latest RSVPs', h('a', { class: 'more', href: '/guests' }, 'Guest list')),
            h('div', { class: 'list' }, replies.map((g) => h('div', { class: 'list-item' },
              h('div', { class: 'avatar' }, (g.first || '?')[0]),
              h('div', { class: 'grow' }, h('div', { class: 'title' }, guestName(g)), g.rsvpMessage && h('div', { class: 'meta ellipsis' }, `“${g.rsvpMessage}”`)),
              h('span', { class: ['chip', g.rsvp === 'yes' ? 'green' : g.rsvp === 'no' ? 'red' : 'orange'] }, g.rsvp === 'yes' ? 'Attending' : g.rsvp === 'no' ? 'Declined' : 'Pending'),
              h('span', { class: 'xs faint nowrap' }, timeAgo(g.rsvpAt)))))] : null)),
      isPlanner() && activity?.length ? [
        h('div', { class: 'section-h' }, 'Recent activity', h('a', { class: 'more', href: '/team' }, 'Team')),
        h('div', { class: 'list' }, activity.slice(0, 8).map((a) => h('div', { class: 'list-item' },
          h('div', { class: 'avatar' }, (a.who || '?')[0]),
          h('div', { class: 'grow small' }, h('b', null, a.who), ' ', a.action),
          h('span', { class: 'xs faint nowrap' }, timeAgo(a.created_at)))))] : null);
  },
};

function decoRings() {
  const s = h('svg', { class: 'deco', viewBox: '0 0 200 160' });
  s.innerHTML = '<g fill="none" stroke="#fff" stroke-width="10"><circle cx="75" cy="90" r="55"/><circle cx="125" cy="90" r="55"/></g>';
  return s;
}
