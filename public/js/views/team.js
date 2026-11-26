import { h, icon, sheet, menu, toast, field, input, select, confirmBox, copyText, timeAgo, initials, emptyState } from '../lib/ui.js';
import { store, isPlanner } from '../lib/store.js';
import { api } from '../lib/api.js';

const MODULE_LABELS = {
  guests: 'Guest list', seating: 'Seating', invitations: 'Invitations & RSVP', budget: 'Budget', style: 'Colours, flowers & bomboniere', menu: 'Menu & dietary',
  vendors: 'Vendors & quotes', timeline: 'Checklist', calendar: 'Calendar', music: 'Music', inspiration: 'Inspiration', dayof: 'Day-of schedule', notes: 'Notes',
};
const ROLES = [
  { value: 'koumbaros', label: 'Koumbaros / koumbara', perms: { guests: 'edit', seating: 'edit', invitations: 'view', budget: 'none', style: 'edit', menu: 'view', vendors: 'view', timeline: 'edit', calendar: 'edit', music: 'edit', inspiration: 'edit', dayof: 'edit', notes: 'edit' } },
  { value: 'couple', label: 'The couple', perms: Object.fromEntries(Object.keys(MODULE_LABELS).map((m) => [m, 'edit'])) },
  { value: 'bridesmaid', label: 'Bridesmaid / best man', perms: { guests: 'view', seating: 'view', invitations: 'view', budget: 'none', style: 'edit', menu: 'view', vendors: 'none', timeline: 'edit', calendar: 'view', music: 'edit', inspiration: 'edit', dayof: 'view', notes: 'edit' } },
  { value: 'family', label: 'Family', perms: { guests: 'view', seating: 'view', invitations: 'view', budget: 'none', style: 'view', menu: 'view', vendors: 'none', timeline: 'view', calendar: 'view', music: 'edit', inspiration: 'view', dayof: 'view', notes: 'none' } },
  { value: 'viewer', label: 'View only', perms: Object.fromEntries(Object.keys(MODULE_LABELS).map((m) => [m, m === 'budget' ? 'none' : 'view'])) },
];
const roleLabel = (r) => ROLES.find((x) => x.value === r)?.label || r || 'Helper';
let activity = null;

const GR = { α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o' };
const greeklish = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[α-ω]/g, (c) => GR[c] || '').replace(/[^a-z0-9]+/g, '');

function genPassword() {
  const words = ['rose', 'olive', 'lemon', 'peony', 'myrtle', 'jasmine', 'sea', 'sun', 'ring', 'dance', 'honey', 'almond'];
  const r = (n) => Math.floor(Math.random() * n);
  return `${words[r(words.length)]}-${words[r(words.length)]}-${10 + r(90)}`;
}

function permMatrix(perms) {
  const tbl = h('div', { class: 'list' }, Object.entries(MODULE_LABELS).map(([m, label]) => {
    const segEl = h('div', { class: 'seg' }, ['none', 'view', 'edit'].map((lvl) => h('button', { type: 'button', class: perms[m] === lvl && 'on', onclick: (e) => {
      perms[m] = lvl; e.currentTarget.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on');
    } }, lvl === 'none' ? 'Hidden' : lvl === 'view' ? 'View' : 'Edit')));
    return h('div', { class: 'list-item', style: { minHeight: '42px', padding: '6px 12px' } }, h('span', { class: 'grow small' }, label), segEl);
  }));
  return tbl;
}

function memberSheet(m) {
  const d = m ? { name: m.name, role: m.role, perms: { ...m.perms } } : { name: '', username: '', password: genPassword(), role: 'koumbaros', perms: { ...ROLES[0].perms } };
  const matrixBox = h('div');
  const drawMatrix = () => matrixBox.replaceChildren(permMatrix(d.perms));
  drawMatrix();
  const userInput = input({ value: d.username || '', autocapitalize: 'none', oninput: (e) => { d.username = e.target.value; d.userTouched = true; } });
  const pwInput = input({ value: m ? '' : d.password, placeholder: m ? 'Leave empty to keep the current password' : '', oninput: (e) => { d.password = e.target.value; } });
  const s = sheet({
    title: m ? (m.name || m.username) : 'Give someone access', size: 'wide', doneLabel: m ? 'Save' : 'Create login',
    body: h('div', { class: 'form' },
      h('div', { class: 'form-row' },
        field('Name', input({ value: d.name, placeholder: 'e.g. Sofia', oninput: (e) => { d.name = e.target.value; if (!m && !d.userTouched) { d.username = greeklish(e.target.value); userInput.value = d.username; } } })),
        !m && field('Username', userInput)),
      h('div', { class: 'form-row' },
        field('Role', select(ROLES.map((r) => ({ value: r.value, label: r.label })), d.role, (v) => { d.role = v; d.perms = { ...ROLES.find((r) => r.value === v).perms }; drawMatrix(); })),
        field(m ? 'New password' : 'Password', h('div', { class: 'input-group' }, pwInput, h('button', { class: 'btn plain', type: 'button', onclick: () => { d.password = genPassword(); pwInput.value = d.password; } }, icon('refresh'))))),
      field('What they can see and change', matrixBox, 'The budget is hidden from helpers by default.')),
    done: async () => {
      if (m) {
        const r = await api.patch(`/api/w/${store.wedding.id}/members/${m.id}`, { name: d.name, role: d.role, perms: d.perms, password: d.password || undefined });
        Object.assign(m, r.member);
        toast('Saved');
      } else {
        const r = await api.post(`/api/w/${store.wedding.id}/members`, { name: d.name, username: d.username, password: d.password, role: d.role, perms: d.perms });
        store.members.push(r.member);
        shareSheet(r.member, d.password);
      }
      import('../lib/store.js').then((x) => x.emit());
    },
    footer: m ? [h('button', { class: 'btn danger', onclick: async () => {
      if (!(await confirmBox({ title: `Remove ${m.name || m.username}’s access?`, confirm: 'Remove', destructive: true }))) return;
      await api.del(`/api/w/${store.wedding.id}/members/${m.id}`);
      store.members = store.members.filter((x) => x.id !== m.id);
      s.close(); import('../lib/store.js').then((x) => x.emit());
    } }, icon('trash'), 'Remove access'), h('span', { class: 'grow' })] : null,
  });
}

function shareSheet(m, password) {
  const url = `${location.origin}/join/${store.wedding.code}`;
  const text = `Hi ${m.name || ''}! You can help plan the wedding on MyWedPlan:\n${url}\nWedding code: ${store.wedding.code}\nUsername: ${m.username}${password ? `\nPassword: ${password}` : ''}`;
  sheet({
    title: 'Share their sign-in', size: 'narrow',
    body: h('div', { class: 'form' },
      h('p', { class: 'small muted' }, 'Send these details privately (e.g. by message). They can change the password after signing in.'),
      h('div', { class: 'card', style: { background: 'var(--card-2)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '13px' } }, text),
      h('button', { class: 'btn primary', onclick: () => copyText(text, 'Copied') }, icon('copy'), 'Copy'),
      navigator.share ? h('button', { class: 'btn', onclick: () => navigator.share({ text }).catch(() => {}) }, icon('send'), 'Share…') : null),
  });
}

async function addPlanner() {
  const email = await new Promise((resolve) => {
    const inp = input({ type: 'email', placeholder: 'their@email.com' });
    let v = null;
    sheet({ title: 'Add a co-planner', size: 'narrow', doneLabel: 'Add',
      body: h('div', { class: 'form' }, h('p', { class: 'small muted' }, 'Co-planners have full access, like you. They need their own MyWedPlan planner account first.'), field('Their account email', inp)),
      done: () => { v = inp.value.trim(); }, onClose: () => resolve(v) });
  });
  if (!email) return;
  try {
    const r = await api.post(`/api/w/${store.wedding.id}/planners`, { email });
    store.planners.push(r.planner);
    toast(`${r.planner.name || r.planner.email} can now plan this wedding`);
    import('../lib/store.js').then((x) => x.emit());
  } catch (e) { toast(e.message, { error: true }); }
}

export default {
  title: 'Team & access',
  render() {
    if (!isPlanner()) return h('div');
    if (activity === null) {
      activity = [];
      api.get(`/api/w/${store.wedding.id}/activity`).then((r) => { activity = r.activity; import('../lib/store.js').then((x) => x.emit()); }).catch(() => {});
    }
    const members = store.members || [];
    return h('div', { style: { maxWidth: '900px' } },
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Team & access'), h('div', { class: 'sub' }, 'Give koumbaroi, bridesmaids and family their own sign-in for this wedding.')),
        h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => memberSheet(null) }, icon('plus'), 'Add person'))),
      h('div', { class: 'card mb row wrap' },
        h('div', { class: 'icon-tile' }, icon('key')),
        h('div', { class: 'grow' }, h('div', null, 'Wedding code ', h('b', { style: { letterSpacing: '.15em' } }, store.wedding.code)), h('div', { class: 'small muted' }, `Helpers sign in at ${location.host}/join with this code, their username and password.`)),
        h('button', { class: 'btn s', onclick: () => copyText(`${location.origin}/join/${store.wedding.code}`, 'Sign-in link copied') }, icon('copy'), 'Copy link')),

      h('div', { class: 'section-h' }, 'Helpers', h('span', { class: 'badge' }, members.length)),
      members.length ? h('div', { class: 'list' }, members.map((m) => h('div', { class: 'list-item tap', onclick: () => memberSheet(m) },
        h('div', { class: 'avatar l' }, initials(m.name || m.username)),
        h('div', { class: 'grow' }, h('div', { class: 'title' }, m.name || m.username), h('div', { class: 'meta' }, `@${m.username} · ${roleLabel(m.role)} · ${m.last_login ? `last seen ${timeAgo(m.last_login)}` : 'hasn’t signed in yet'}`),
          h('div', { class: 'chips', style: { marginTop: '4px' } }, Object.entries(m.perms || {}).filter(([, v]) => v === 'edit').slice(0, 6).map(([k]) => h('span', { class: 'chip', style: { height: '20px', fontSize: '11px' } }, MODULE_LABELS[k])))),
        h('button', { class: 'btn plain icon s', 'aria-label': 'Options', onclick: (e) => { e.stopPropagation(); menu(e.currentTarget, [
          { label: 'Edit permissions', icon: 'sliders', onClick: () => memberSheet(m) },
          { label: 'Share sign-in details', icon: 'send', onClick: () => shareSheet(m) }]); } }, icon('more')))))
        : emptyState('team', 'No helpers yet', 'Create a login for each koumbaros or koumbara so they can update the guest list, seating, music and the day’s schedule. You choose exactly what they can see and change.',
          h('button', { class: 'btn primary', onclick: () => memberSheet(null) }, icon('plus'), 'Add person')),

      h('div', { class: 'section-h' }, 'Planners', h('button', { class: 'more btn plain s', onclick: addPlanner }, icon('plus'), 'Co-planner')),
      h('div', { class: 'list' }, (store.planners || []).map((p) => h('div', { class: 'list-item' },
        h('div', { class: 'avatar l' }, initials(p.name || p.email)),
        h('div', { class: 'grow' }, h('div', { class: 'title' }, p.name || p.email), h('div', { class: 'meta' }, `${p.email} · ${p.role === 'owner' ? 'Owner' : 'Co-planner'}`)),
        p.role !== 'owner' && store.me.role === 'owner' && h('button', { class: 'btn s danger', onclick: async () => {
          if (!(await confirmBox({ title: `Remove ${p.name || p.email}?`, confirm: 'Remove', destructive: true }))) return;
          await api.del(`/api/w/${store.wedding.id}/planners/${p.id}`); store.planners = store.planners.filter((x) => x.id !== p.id); import('../lib/store.js').then((x) => x.emit());
        } }, 'Remove')))),

      activity?.length ? [h('div', { class: 'section-h' }, 'Recent activity'),
        h('div', { class: 'list' }, activity.slice(0, 30).map((a) => h('div', { class: 'list-item' }, h('div', { class: 'avatar' }, (a.who || '?')[0]),
          h('div', { class: 'grow small' }, h('b', null, a.who), ' ', a.action), h('span', { class: 'xs faint nowrap' }, timeAgo(a.created_at)))))] : null);
  },
};
