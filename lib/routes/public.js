// Guest-facing endpoints (no login): RSVP / online invitation, and the calendar feed.
import { db } from '../db.js';
import { fail, readJson, send } from '../http.js';
import { newId } from '../auth.js';
import { toRecord } from './core.js';

const clean = (s, max = 300) => String(s ?? '').trim().slice(0, max);
const DAY = 86400000;

async function guestByToken(token) {
  const t = await db.get("SELECT * FROM tokens WHERE token = ? AND kind = 'rsvp'", [token]);
  if (!t) fail(404, 'This invitation link is not valid. Please check with the couple.');
  const g = await db.get("SELECT * FROM records WHERE id = ? AND wedding_id = ? AND type = 'guest'", [t.ref, t.wedding_id]);
  if (!g) fail(404, 'This invitation link is no longer valid.');
  const w = await db.get('SELECT * FROM weddings WHERE id = ?', [t.wedding_id]);
  return { guest: toRecord(g), wedding: { id: w.id, ...JSON.parse(w.data) } };
}

async function partyOf(wid, guest) {
  const all = (await db.all("SELECT * FROM records WHERE wedding_id = ? AND type = 'guest'", [wid])).map(toRecord);
  const members = guest.party ? all.filter((g) => g.party === guest.party && !g.plusOneOf) : [guest];
  if (!members.find((g) => g.id === guest.id)) members.unshift(guest);
  const ids = new Set(members.map((g) => g.id));
  const plusOnes = all.filter((g) => g.plusOneOf && ids.has(g.plusOneOf));
  return { members, plusOnes };
}

const publicGuest = (g) => ({
  id: g.id, first: g.first || '', last: g.last || '', name: g.name || `${g.first || ''} ${g.last || ''}`.trim(),
  rsvp: g.rsvp || 'pending', meal: g.meal || '', dietary: g.dietary || [], dietaryNote: g.dietaryNote || '',
  plusOne: !!g.plusOne, child: !!g.child, plusOneOf: g.plusOneOf || null, rsvpAt: g.rsvpAt || null,
});

function publicWedding(w) {
  const keys = ['partner1', 'partner2', 'date', 'time', 'ceremony', 'reception', 'rsvpBy', 'rsvpNote', 'mealOptions',
    'askSong', 'askMessage', 'askDietary', 'lang', 'accent', 'dressCode', 'publicNote', 'hashtag', 'giftNote', 'schedulePublic'];
  return Object.fromEntries(keys.map((k) => [k, w[k] ?? null]));
}

async function getRsvp(req, res, { token }) {
  const { guest, wedding } = await guestByToken(token);
  const { members, plusOnes } = await partyOf(wedding.id, guest);
  const designs = (await db.all("SELECT * FROM records WHERE wedding_id = ? AND type = 'design'", [wedding.id])).map(toRecord);
  const design = designs.find((d) => d.primary) || designs.find((d) => d.kind === 'invitation') || null;
  let schedule = [];
  if (wedding.schedulePublic) {
    schedule = (await db.all("SELECT * FROM records WHERE wedding_id = ? AND type = 'dayof' ORDER BY sort", [wedding.id]))
      .map(toRecord).filter((s) => s.public).map((s) => ({ time: s.time, title: s.title, location: s.location || '' }))
      .sort((x, y) => String(x.time).localeCompare(String(y.time)));
  }
  send(res, 200, {
    wedding: publicWedding(wedding),
    guest: publicGuest(guest),
    party: members.map(publicGuest),
    plusOnes: plusOnes.map(publicGuest),
    message: guest.rsvpMessage || '',
    design: design ? { canvas: design.canvas, elements: design.elements, background: design.background } : null,
    schedule,
    contact: { email: guest.email || '', phone: guest.phone || '' },
  });
}

async function postRsvp(req, res, { token }) {
  const { guest, wedding } = await guestByToken(token);
  const wid = wedding.id;
  const { members, plusOnes } = await partyOf(wid, guest);
  const b = await readJson(req);
  const byId = new Map(members.map((g) => [g.id, g]));
  const meals = Array.isArray(wedding.mealOptions) ? wedding.mealOptions.map((m) => (typeof m === 'string' ? m : m.name)) : [];
  const ts = Date.now();
  const stmts = [];
  const patch = (id, d) => stmts.push({
    sql: "UPDATE records SET data = json_patch(data, ?), updated_at = ?, updated_by = 'RSVP' WHERE id = ? AND wedding_id = ?",
    args: [JSON.stringify(d), ts, id, wid],
  });
  let yes = 0; let no = 0;
  for (const r of Array.isArray(b.responses) ? b.responses : []) {
    const g = byId.get(r.id);
    if (!g) continue;
    const rsvp = r.rsvp === 'yes' ? 'yes' : r.rsvp === 'no' ? 'no' : 'pending';
    if (rsvp === 'yes') yes++; else if (rsvp === 'no') no++;
    patch(g.id, {
      rsvp, rsvpAt: ts,
      meal: meals.includes(r.meal) ? r.meal : (r.meal ? clean(r.meal, 60) : null),
      dietary: Array.isArray(r.dietary) ? r.dietary.slice(0, 12).map((x) => clean(x, 40)) : [],
      dietaryNote: clean(r.dietaryNote, 300) || null,
    });
    // Plus-ones become real guests so they show up in seating, menus and counts.
    const po = r.plusOneGuest;
    const existing = plusOnes.find((p) => p.plusOneOf === g.id);
    if (g.plusOne && po && rsvp === 'yes' && clean(po.name)) {
      const [first, ...rest] = clean(po.name, 80).split(/\s+/);
      const d = {
        first, last: rest.join(' '), rsvp: 'yes', rsvpAt: ts, plusOneOf: g.id, party: g.party || null,
        side: g.side || null, group: g.group || null, knows: [g.id],
        meal: meals.includes(po.meal) ? po.meal : null,
        dietary: Array.isArray(po.dietary) ? po.dietary.slice(0, 12).map((x) => clean(x, 40)) : [],
        dietaryNote: clean(po.dietaryNote, 300) || null,
      };
      if (existing) patch(existing.id, d);
      else {
        stmts.push({
          sql: "INSERT INTO records (id, wedding_id, type, data, sort, created_at, updated_at, updated_by) VALUES (?, ?, 'guest', ?, ?, ?, ?, 'RSVP')",
          args: [newId(), wid, JSON.stringify({ ...d, notes: `Plus-one of ${g.first || g.name || ''} ${g.last || ''}`.trim() }), ts / 1e6, ts, ts],
        });
      }
    } else if (existing && (rsvp === 'no' || (po && po.remove))) {
      patch(existing.id, { rsvp: 'no', rsvpAt: ts });
    }
  }
  const extra = {};
  if (b.message !== undefined) extra.rsvpMessage = clean(b.message, 1000) || null;
  if (b.email) extra.email = clean(b.email, 200);
  if (b.phone) extra.phone = clean(b.phone, 40);
  if (Object.keys(extra).length) patch(guest.id, extra);
  if (b.song && clean(b.song.title)) {
    stmts.push({
      sql: "INSERT INTO records (id, wedding_id, type, data, sort, created_at, updated_at, updated_by) VALUES (?, ?, 'song', ?, ?, ?, ?, 'RSVP')",
      args: [newId(), wid, JSON.stringify({
        title: clean(b.song.title, 120), artist: clean(b.song.artist, 120), section: 'requests',
        requestedBy: `${guest.first || guest.name || ''} ${guest.last || ''}`.trim(),
      }), ts / 1e6, ts, ts],
    });
  }
  const who = `${guest.first || guest.name || 'A guest'} ${guest.last || ''}`.trim();
  stmts.push({
    sql: 'INSERT INTO activity (wedding_id, who, action, created_at) VALUES (?, ?, ?, ?)',
    args: [wid, who, `replied to the invitation (${yes} attending${no ? `, ${no} declined` : ''})`, ts],
  });
  await db.batch(stmts);
  send(res, 200, { ok: true });
}

// ------------------------------------------------------------------ iCal feed
const icsEsc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
function fold(line) {
  const out = [];
  let l = line;
  while (l.length > 74) { out.push(l.slice(0, 74)); l = ` ${l.slice(74)}`; }
  out.push(l);
  return out.join('\r\n');
}
export function taskDue(task, weddingDate) {
  if (task.date) return task.date;
  if (!weddingDate || task.offset === undefined || task.offset === null) return null;
  const d = new Date(`${weddingDate}T12:00:00Z`);
  return new Date(d.getTime() - Number(task.offset) * DAY).toISOString().slice(0, 10);
}

async function ical(req, res, { token }) {
  const t = await db.get("SELECT * FROM tokens WHERE token = ? AND kind = 'ical'", [String(token).replace(/\.ics$/, '')]);
  if (!t) fail(404, 'Calendar not found');
  const w = await db.get('SELECT * FROM weddings WHERE id = ?', [t.wedding_id]);
  const wd = JSON.parse(w.data);
  const recs = (await db.all("SELECT * FROM records WHERE wedding_id = ? AND type IN ('task','event','expense')", [w.id])).map(toRecord);
  const events = [];
  const add = (uid, date, title, desc, time, durationMin = 60) => {
    if (!date) return;
    const lines = ['BEGIN:VEVENT', `UID:${uid}@wedplan`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`];
    if (time && /^\d{2}:\d{2}$/.test(time)) {
      const start = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
      const end = new Date(new Date(`${date}T${time}:00Z`).getTime() + durationMin * 60000).toISOString().replace(/[-:]/g, '').slice(0, 15);
      lines.push(`DTSTART:${start}`, `DTEND:${end}`);
    } else {
      const d = new Date(`${date}T00:00:00Z`);
      lines.push(`DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(new Date(d.getTime() + DAY))}`);
    }
    lines.push(`SUMMARY:${icsEsc(title)}`);
    if (desc) lines.push(`DESCRIPTION:${icsEsc(desc)}`);
    lines.push('END:VEVENT');
    events.push(...lines.map(fold));
  };
  const couple = [wd.partner1, wd.partner2].filter(Boolean).join(' & ') || 'Our wedding';
  if (wd.date) add(`wedding-${w.id}`, wd.date, `💍 ${couple}`, wd.ceremony?.name || '', wd.time, 600);
  for (const r of recs) {
    if (r.type === 'task' && !r.done) add(r.id, taskDue(r, wd.date), `☐ ${r.title}`, r.notes || '');
    if (r.type === 'event') add(r.id, r.date, r.title, [r.location, r.notes].filter(Boolean).join('\n'), r.allDay ? null : r.time, Number(r.duration) || 60);
    if (r.type === 'expense') {
      (r.payments || []).forEach((p, i) => { if (!p.paid && p.due) add(`${r.id}-${i}`, p.due, `💶 Payment: ${r.name} ${p.amount ? `(${p.amount})` : ''}`, p.note || ''); });
      if (!r.payments?.length && r.due && !r.paid) add(`${r.id}-due`, r.due, `💶 Payment due: ${r.name}`, '');
    }
  }
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MyWedPlan//EN', 'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsEsc(`${couple} – Wedding plan`)}`, ...events, 'END:VCALENDAR'].join('\r\n');
  send(res, 200, body, { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="wedding.ics"', 'Cache-Control': 'max-age=900' });
}

export const publicRoutes = [
  ['GET', '/api/public/rsvp/:token', getRsvp],
  ['POST', '/api/public/rsvp/:token', postRsvp],
  ['GET', '/api/ical/:token', ical],
];
