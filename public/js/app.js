// App shell: authentication, wedding picker, navigation and view routing.
import { h, icon, toast, sheet, menu, field, input, select, seg, toggle, fmtDate, daysBetween, today, initials, confirmBox } from './lib/ui.js';
import { api } from './lib/api.js';
import { store, subscribe, loadWedding, can, isPlanner, coupleNames, list, bulk } from './lib/store.js';
import { TASKS, GREEK_TASKS, CIVIL_TASKS, BUDGET_CATEGORIES, DAYOF, GREEK_DAYOF, VENDOR_CATEGORIES, NOTE_TEMPLATES } from './lib/templates.js';

const root = document.getElementById('root');

export const NAV = [
  { section: null, items: [{ path: '/', label: 'Overview', icon: 'home', view: 'dashboard' }] },
  { section: 'Guests', items: [
    { path: '/guests', label: 'Guest list', icon: 'guests', view: 'guests', perm: 'guests' },
    { path: '/seating', label: 'Seating', icon: 'seating', view: 'seating', perm: 'seating' },
    { path: '/invitations', label: 'Invitations & RSVP', icon: 'invite', view: 'invitations', perm: 'invitations' },
  ] },
  { section: 'Planning', items: [
    { path: '/timeline', label: 'Checklist', icon: 'timeline', view: 'timeline', perm: 'timeline' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar', view: 'calendar', perm: 'calendar' },
    { path: '/budget', label: 'Budget', icon: 'budget', view: 'budget', perm: 'budget' },
    { path: '/vendors', label: 'Vendors & quotes', icon: 'vendors', view: 'vendors', perm: 'vendors' },
  ] },
  { section: 'Style & food', items: [
    { path: '/style', label: 'Colours & flowers', icon: 'flower', view: 'style', perm: 'style' },
    { path: '/menu', label: 'Menu & dietary', icon: 'menu_food', view: 'menu', perm: 'menu' },
    { path: '/music', label: 'Music', icon: 'music', view: 'music', perm: 'music' },
    { path: '/inspiration', label: 'Inspiration', icon: 'inspo', view: 'inspiration', perm: 'inspiration' },
  ] },
  { section: 'The day', items: [
    { path: '/dayof', label: 'Day-of schedule', icon: 'dayof', view: 'dayof', perm: 'dayof' },
    { path: '/notes', label: 'Notes', icon: 'notes', view: 'notes', perm: 'notes' },
  ] },
  { section: 'Settings', items: [
    { path: '/settings', label: 'Wedding settings', icon: 'settings', view: 'settings', planner: true },
    { path: '/team', label: 'Team & access', icon: 'team', view: 'team', planner: true },
    { path: '/account', label: 'My account', icon: 'person', view: 'account' },
  ] },
];
const ALL_ROUTES = NAV.flatMap((s) => s.items);
const visible = (it) => (it.planner ? isPlanner() : it.memberOnly ? !isPlanner() : !it.perm || can(it.perm, 'view'));

// ------------------------------------------------------------------ theme & accent
export function applyTheme(t = localStorage.getItem('wp_theme') || 'light') {
  const v = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
  document.documentElement.dataset.theme = v;
}
export function applyAccent(hex) {
  const c = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#c0587e';
  const n = parseInt(c.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  document.documentElement.style.setProperty('--accent', c);
  document.documentElement.style.setProperty('--accent-rgb', rgb.join(', '));
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  document.documentElement.style.setProperty('--accent-text', lum > 0.7 ? '#1d1d1f' : '#fff');
}

// ------------------------------------------------------------------ routing
export function navigate(path, { replace = false } = {}) {
  if (path === location.pathname + location.search) return render();
  history[replace ? 'replaceState' : 'pushState']({}, '', path);
  document.querySelector('.app')?.classList.remove('nav-open');
  currentPath = null;
  render();
  window.scrollTo(0, 0);
}
window.addEventListener('popstate', () => { currentPath = null; render(); });
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || a.target || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/rsvp/')) return;
  e.preventDefault();
  navigate(url.pathname + url.search);
});
window.addEventListener('wp:signedout', () => { store.session = null; store.wedding = null; navigate('/login', { replace: true }); });

// ------------------------------------------------------------------ boot
let booted = false;
async function boot() {
  applyTheme();
  try {
    const me = await api.get('/api/auth/me');
    store.session = me.kind ? me : null;
  } catch (e) {
    root.replaceChildren(h('div', { class: 'auth' }, h('div', { class: 'card center' }, h('h2', null, 'Can’t reach MyWedPlan'), h('p', { class: 'muted mt' }, e.message),
      h('button', { class: 'btn primary mt', onclick: () => location.reload() }, 'Try again'))));
    return;
  }
  booted = true;
  subscribe(() => render(true));
  render();
}

async function openWedding(id) {
  root.replaceChildren(h('div', { class: 'auth' }, h('div', { class: 'muted' }, 'Opening…')));
  try {
    await loadWedding(id);
    localStorage.setItem('wp_wedding', id);
    applyAccent(store.wedding.accent);
    document.title = `${coupleNames()} · MyWedPlan`;
  } catch (e) {
    localStorage.removeItem('wp_wedding');
    toast(e.message, { error: true });
    store.wedding = null;
  }
}

let currentPath = null;
let currentView = null;
let shell = null;
const viewCache = {};

async function render(fromStore = false) {
  if (!booted) return;
  const path = location.pathname;
  const s = store.session;

  if (path.startsWith('/join')) {
    if (!s || s.kind !== 'member' || fromStore === false) return renderMemberLogin(path.split('/')[2] || new URLSearchParams(location.search).get('code') || '');
  }
  if (!s) {
    if (path === '/signup') return renderAuth('signup');
    return renderAuth('login');
  }
  if (path === '/login' || path === '/signup' || path.startsWith('/join')) return navigate('/', { replace: true });

  if (s.kind === 'user' && (path === '/weddings' || !store.wedding)) {
    if (path !== '/weddings') {
      const saved = localStorage.getItem('wp_wedding');
      if (saved && !store.wedding && !fromStore) {
        await openWedding(saved);
        if (store.wedding) return render();
      }
    }
    if (!store.wedding || path === '/weddings') return renderWeddings(fromStore);
  }
  if (s.kind === 'member' && !store.wedding) {
    await openWedding(s.weddingId || s.member.wedding_id);
    if (!store.wedding) return renderAuth('login');
  }
  renderShell(path, fromStore);
}

// ------------------------------------------------------------------ auth screens
function logo(sub) {
  return h('div', { class: 'auth-logo' }, h('div', { class: 'mark' }, icon('ring')),
    h('h1', { class: 'wordmark' }, 'MyWed', h('b', null, 'Plan')), h('p', null, sub));
}
function renderAuth(mode) {
  currentPath = null; shell = null;
  const name = input({ placeholder: 'Your name', autocomplete: 'name' });
  const email = input({ type: 'email', placeholder: 'name@example.com', autocomplete: 'email' });
  const pass = input({ type: 'password', placeholder: mode === 'signup' ? 'At least 8 characters' : 'Password', autocomplete: mode === 'signup' ? 'new-password' : 'current-password' });
  const err = h('div', { class: 'small neg', role: 'alert' });
  const btn = h('button', { class: 'btn primary l block', type: 'submit' }, mode === 'signup' ? 'Create account' : 'Sign in');
  const form = h('form', { class: 'form', onsubmit: async (e) => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true;
    try {
      const r = mode === 'signup'
        ? await api.post('/api/auth/signup', { name: name.value, email: email.value, password: pass.value })
        : await api.post('/api/auth/login', { email: email.value, password: pass.value });
      store.session = r;
      store.wedding = null;
      navigate(mode === 'signup' ? '/weddings' : '/', { replace: true });
    } catch (x) { err.textContent = x.message; } finally { btn.disabled = false; }
  } },
  mode === 'signup' && field('Name', name), field('Email', email), field('Password', pass), err, btn);
  root.replaceChildren(h('div', { class: 'auth' }, h('div', { class: 'auth-card' },
    logo(mode === 'signup' ? 'Create a planner account to start planning.' : 'Plan the wedding together.'),
    h('div', { class: 'card' }, form),
    h('div', { class: 'switch-link' }, mode === 'signup'
      ? h('span', null, 'Already have an account? ', h('a', { href: '/login' }, 'Sign in'))
      : h('span', null, 'New here? ', h('a', { href: '/signup' }, 'Create a planner account'))),
    h('div', { class: 'switch-link' }, 'Koumbaros, koumbara or family? ', h('a', { href: '/join' }, 'Sign in with your wedding code')))));
  setTimeout(() => (mode === 'signup' ? name : email).focus(), 30);
}

function renderMemberLogin(code) {
  currentPath = null; shell = null;
  const c = input({ placeholder: 'e.g. K7M2QX', value: code, autocapitalize: 'characters', style: { textTransform: 'uppercase', letterSpacing: '.12em' } });
  const u = input({ placeholder: 'Username', autocapitalize: 'none', autocomplete: 'username' });
  const p = input({ type: 'password', placeholder: 'Password', autocomplete: 'current-password' });
  const err = h('div', { class: 'small neg', role: 'alert' });
  const btn = h('button', { class: 'btn primary l block', type: 'submit' }, 'Sign in');
  const form = h('form', { class: 'form', onsubmit: async (e) => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true;
    try {
      await api.post('/api/auth/member-login', { code: c.value, username: u.value, password: p.value });
      store.session = await api.get('/api/auth/me');
      store.wedding = null;
      navigate('/', { replace: true });
    } catch (x) { err.textContent = x.message; } finally { btn.disabled = false; }
  } }, field('Wedding code', c, 'The planner shares this code with you.'), field('Username', u), field('Password', p), err, btn);
  root.replaceChildren(h('div', { class: 'auth' }, h('div', { class: 'auth-card' },
    logo('Sign in to help plan the wedding.'), h('div', { class: 'card' }, form),
    h('div', { class: 'switch-link' }, 'Planning the wedding? ', h('a', { href: '/login' }, 'Planner sign-in')))));
  setTimeout(() => (code ? u : c).focus(), 30);
}

export async function signOut() {
  await api.post('/api/auth/logout').catch(() => {});
  store.session = null; store.wedding = null;
  localStorage.removeItem('wp_wedding');
  navigate('/login', { replace: true });
}

// ------------------------------------------------------------------ wedding picker
async function renderWeddings(fromStore) {
  currentPath = null; shell = null;
  applyAccent();
  document.title = 'Your weddings · MyWedPlan';
  if (!fromStore || !store.weddings.length) {
    try { store.weddings = (await api.get('/api/weddings')).weddings; } catch (e) { toast(e.message, { error: true }); }
  }
  const u = store.session.user;
  const cards = store.weddings.map((w) => {
    const days = w.date ? daysBetween(today(), w.date) : null;
    return h('div', { class: 'card wedding-card', tabindex: 0, role: 'button', onclick: async () => { await openWedding(w.id); navigate('/'); }, onkeydown: (e) => { if (e.key === 'Enter') e.currentTarget.click(); } },
      h('div', { class: 'band', style: { background: w.accent || 'var(--accent)' } }),
      h('div', { class: 'names' }, coupleNames(w)),
      h('div', { class: 'muted small' }, w.date ? fmtDate(w.date, 'long') : 'Date not set'),
      h('div', { class: 'row mt', style: { marginTop: 'auto' } },
        days !== null && h('span', { class: 'chip accent' }, days > 0 ? `${days} days to go` : days === 0 ? 'Today!' : 'Married'),
        h('span', { class: 'chip' }, `${w.guests || 0} guests`),
        w.role !== 'owner' && h('span', { class: 'chip blue' }, 'Shared with you')));
  });
  root.replaceChildren(h('div', { class: 'content', style: { maxWidth: '1100px' } },
    h('div', { class: 'page-head' },
      h('div', null, h('h1', { class: 'wordmark' }, 'MyWed', h('b', null, 'Plan')), h('div', { class: 'sub' }, `Welcome${u.name ? `, ${u.name.split(' ')[0]}` : ''}. Choose a wedding or start a new one.`)),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', onclick: (e) => menu(e.currentTarget, [
          { label: 'Light appearance', icon: 'sun', onClick: () => { localStorage.setItem('wp_theme', 'light'); applyTheme(); } },
          { label: 'Dark appearance', icon: 'moon', onClick: () => { localStorage.setItem('wp_theme', 'dark'); applyTheme(); } },
          '-', { label: 'Sign out', icon: 'logout', onClick: signOut }]) }, icon('person'), u.email),
        h('button', { class: 'btn primary', onclick: newWeddingSheet }, icon('plus'), 'New wedding'))),
    store.weddings.length ? null : h('div', { class: 'card mb' }, h('div', { class: 'row' }, h('div', { class: 'icon-tile' }, icon('sparkle')),
      h('div', null, h('b', null, 'Let’s plan your first wedding'), h('div', { class: 'small muted' }, 'You can manage as many weddings as you like and invite the couple, koumbaroi and family to each one.')))),
    h('div', { class: 'grid auto' }, cards, h('div', { class: 'card wedding-card new', role: 'button', tabindex: 0, onclick: newWeddingSheet }, icon('plus', 'ic'), 'New wedding'))));
}

function newWeddingSheet() {
  const d = { partner1: '', partner2: '', date: '', time: '17:30', ceremony: { name: '' }, reception: { name: '' }, city: '', guestTarget: 150, budget: 25000, currency: 'EUR', tradition: 'greek' };
  const opts = { tasks: true, budget: true, dayof: true, vendors: true, notes: true };
  const set = (k) => (e) => { d[k] = e.target.value; };
  sheet({
    title: 'New wedding', doneLabel: 'Create',
    body: h('div', { class: 'form' },
      h('div', { class: 'form-row' }, field('Partner 1', input({ placeholder: 'e.g. Maria', oninput: set('partner1') })), field('Partner 2', input({ placeholder: 'e.g. Nikos', oninput: set('partner2') }))),
      h('div', { class: 'form-row' }, field('Wedding date', input({ type: 'date', oninput: set('date') }), 'You can change it later.'), field('Ceremony time', input({ type: 'time', value: d.time, oninput: set('time') }))),
      h('div', { class: 'form-row' },
        field('Ceremony venue', input({ placeholder: 'Church / town hall', oninput: (e) => { d.ceremony.name = e.target.value; } })),
        field('Reception venue', input({ placeholder: 'Venue', oninput: (e) => { d.reception.name = e.target.value; } }))),
      h('div', { class: 'form-row' },
        field('Expected guests', input({ type: 'number', value: d.guestTarget, min: 0, oninput: (e) => { d.guestTarget = Number(e.target.value); } })),
        field('Total budget', input({ type: 'number', value: d.budget, min: 0, oninput: (e) => { d.budget = Number(e.target.value); } })),
        field('Currency', select(['EUR', 'USD', 'GBP', 'CHF', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK', 'PLN', 'RON', 'BGN', 'TRY', 'CZK'], d.currency, (v) => { d.currency = v; }))),
      field('Ceremony type', select([{ value: 'greek', label: 'Greek Orthodox' }, { value: 'civil', label: 'Civil' }, { value: 'other', label: 'Other / mixed' }], d.tradition, (v) => { d.tradition = v; }),
        'Adds the right tasks to your checklist (e.g. stefana, bomboniere, marriage licence).'),
      h('div', { class: 'list' },
        [['tasks', 'Planning checklist with due dates'], ['budget', 'Budget categories with suggested amounts'], ['vendors', 'Vendor categories for comparing quotes'], ['dayof', 'Sample day-of schedule'], ['notes', 'Starter notes (emergency kit, contacts)']]
          .map(([k, l]) => h('label', { class: 'list-item' }, h('span', { class: 'grow' }, l), toggle(opts[k], (v) => { opts[k] = v; }))))),
    done: async () => {
      const data = { ...d, accent: '#c0587e', lang: 'en', askDietary: true, askSong: true, askMessage: true, mealOptions: [] };
      const { wedding } = await api.post('/api/weddings', { data });
      await openWedding(wedding.id);
      await seedWedding(opts, d);
      toast('Wedding created');
      navigate('/');
    },
  });
}

// If the wedding is sooner than the usual 13-month plan, squeeze the checklist into the time left.
export function fitOffset(offset, date) {
  if (!date || offset <= 0) return offset;
  const left = daysBetween(today(), date);
  if (left >= 410 || left <= 2) return offset;
  return Math.max(1, Math.round(offset * (left - 2) / 410));
}

async function seedWedding(opts, d) {
  const ops = [];
  const add = (type, data, i) => ops.push({ op: 'create', type, data: { ...data, _sort: i } });
  if (opts.tasks) {
    const extra = d.tradition === 'greek' ? GREEK_TASKS : d.tradition === 'civil' ? CIVIL_TASKS : [];
    [...TASKS, ...extra].forEach((t, i) => add('task', { title: t.title, offset: fitOffset(t.offset, d.date), cat: t.cat, link: t.link || null, auto: true }, i));
  }
  if (opts.budget) BUDGET_CATEGORIES.forEach((c, i) => add('budget_cat', { name: c.name, color: c.color, planned: Math.round((d.budget || 0) * c.pct / 100) }, i));
  if (opts.vendors) VENDOR_CATEGORIES.forEach((c, i) => add('vendor_cat', { key: c.key, name: c.name, icon: c.icon, fields: c.fields }, i));
  if (opts.dayof) {
    const items = d.tradition === 'greek' ? [...DAYOF, ...GREEK_DAYOF] : DAYOF;
    items.sort((a, b) => (a.time < '06:00' ? `3${a.time}` : a.time).localeCompare(b.time < '06:00' ? `3${b.time}` : b.time))
      .forEach((x, i) => add('dayof', { ...x, public: !!x.public }, i));
  }
  if (opts.notes) NOTE_TEMPLATES.forEach((n, i) => add('note', n, i));
  if (ops.length) await bulk(ops, 'set up the wedding');
}

// ------------------------------------------------------------------ shell
function sidebar(path) {
  const w = store.wedding;
  const days = w.date ? daysBetween(today(), w.date) : null;
  const pendingRsvp = can('guests') ? list('guest').filter((g) => g.rsvpAt && Date.now() - g.rsvpAt < 3 * 86400000).length : 0;
  const s = store.session;
  const who = s.kind === 'user' ? (s.user.name || s.user.email) : (s.member.name || s.member.username);
  return h('nav', { class: 'sidebar', 'aria-label': 'Main' },
    h('button', { class: 'sb-wedding', onclick: (e) => weddingMenu(e.currentTarget) },
      h('div', { class: 'sb-mono' }, `${(w.partner1 || 'W')[0]}${(w.partner2 || '')[0] || ''}`),
      h('div', { class: 'grow' }, h('div', { class: 't ellipsis' }, coupleNames()),
        h('div', { class: 's' }, w.date ? (days > 0 ? `${days} days to go` : days === 0 ? 'Today!' : fmtDate(w.date)) : 'Set the date')),
      icon('chevronD', 'faint')),
    NAV.map((sec) => {
      const items = sec.items.filter(visible);
      if (!items.length) return null;
      return [sec.section && h('div', { class: 'sb-section' }, sec.section),
        items.map((it) => h('a', { class: ['sb-item', (it.path === '/' ? path === '/' : path.startsWith(it.path)) && 'active'], href: it.path },
          icon(it.icon), it.label, it.path === '/guests' && pendingRsvp ? h('span', { class: 'badge accent', title: 'New RSVP replies' }, pendingRsvp) : null))];
    }),
    h('div', { class: 'sb-foot' },
      h('div', { class: 'sb-user' }, h('div', { class: 'avatar' }, initials(who)),
        h('div', { class: 'grow' }, h('div', { class: 'ellipsis', style: { fontWeight: 500 } }, who),
          h('div', { class: 'xs muted' }, store.me.role === 'owner' ? 'Planner (owner)' : store.me.role === 'planner' ? 'Planner' : (s.member.role || 'Helper').replace(/^./, (c) => c.toUpperCase()))),
        h('button', { class: 'btn plain icon s', title: 'Appearance', 'aria-label': 'Appearance', onclick: (e) => menu(e.currentTarget, [
          { label: 'Light', icon: 'sun', onClick: () => { localStorage.setItem('wp_theme', 'light'); applyTheme(); } },
          { label: 'Dark', icon: 'moon', onClick: () => { localStorage.setItem('wp_theme', 'dark'); applyTheme(); } },
          { label: 'Match device', icon: 'refresh', onClick: () => { localStorage.setItem('wp_theme', 'auto'); applyTheme(); } }]) },
        icon(document.documentElement.dataset.theme === 'dark' ? 'moon' : 'sun')),
        h('button', { class: 'btn plain icon s', title: 'Sign out', 'aria-label': 'Sign out', onclick: signOut }, icon('logout')))));
}

function weddingMenu(anchor) {
  const items = [];
  if (store.session.kind === 'user') {
    items.push({ header: 'Weddings' });
    (store.weddings.length ? store.weddings : [store.wedding]).forEach((w) => items.push({
      label: coupleNames(w), checked: w.id === store.wedding.id, color: w.accent || '#c0587e',
      onClick: async () => { if (w.id !== store.wedding.id) { await openWedding(w.id); navigate('/'); } },
    }));
    items.push('-', { label: 'All weddings', icon: 'grid', onClick: () => navigate('/weddings') });
    items.push({ label: 'New wedding', icon: 'plus', onClick: newWeddingSheet });
  }
  if (isPlanner()) items.push({ label: 'Wedding settings', icon: 'settings', onClick: () => navigate('/settings') });
  items.push('-', { label: 'Sign out', icon: 'logout', onClick: signOut });
  menu(anchor, items);
  if (store.session.kind === 'user' && !store.weddings.length) api.get('/api/weddings').then((r) => { store.weddings = r.weddings; }).catch(() => {});
}

function tabbar(path) {
  const tabs = [
    { path: '/', label: 'Overview', icon: 'home' },
    { path: '/guests', label: 'Guests', icon: 'guests', perm: 'guests' },
    { path: '/timeline', label: 'Checklist', icon: 'timeline', perm: 'timeline' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar', perm: 'calendar' },
  ].filter(visible);
  return h('nav', { class: 'tabbar', 'aria-label': 'Quick navigation' },
    tabs.map((t) => h('a', { href: t.path, class: (t.path === '/' ? path === '/' : path.startsWith(t.path)) && 'active' }, icon(t.icon), t.label)),
    h('a', { href: '#', onclick: (e) => { e.preventDefault(); e.stopPropagation(); document.querySelector('.app').classList.add('nav-open'); } }, icon('hamburger'), 'More'));
}

async function loadView(name) {
  if (!viewCache[name]) viewCache[name] = (await import(`./views/${name}.js`)).default;
  return viewCache[name];
}

async function renderShell(path, fromStore) {
  const route = ALL_ROUTES.find((r) => (r.path === '/' ? path === '/' : path === r.path || path.startsWith(`${r.path}/`)));
  if (!route || !visible(route)) return navigate('/', { replace: true });
  const viewChanged = currentPath !== path + location.search;
  // Highly interactive views (designer, floor plan) refresh themselves instead of a full re-render.
  if (shell && fromStore && !viewChanged && currentView?.manual && document.body.contains(shell)) {
    shell.querySelector('.sidebar')?.replaceWith(sidebar(path));
    currentView.refresh?.();
    return;
  }
  if (!shell || viewChanged || !fromStore) {
    const view = await loadView(route.view);
    if (location.pathname !== path) return;
    currentView = view;
    currentPath = path + location.search;
  }
  // Preserve focus and caret between re-renders (inline editing).
  const active = document.activeElement;
  const focusKey = active?.dataset?.k;
  const sel = focusKey && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;

  const ctx = { path, query: new URLSearchParams(location.search), navigate, route };
  let content;
  try {
    content = currentView.render(ctx);
  } catch (e) {
    console.error(e);
    content = h('div', { class: 'empty' }, h('h3', null, 'Something went wrong showing this page'), h('p', null, e.message));
  }
  const main = h('main', { class: 'main' },
    h('div', { class: 'topbar' },
      h('button', { class: 'btn plain icon', 'aria-label': 'Menu', onclick: (e) => { e.stopPropagation(); document.querySelector('.app').classList.toggle('nav-open'); } }, icon('hamburger')),
      h('div', { class: 't' }, route.label), h('span', { style: { width: '34px' } })),
    h('div', { class: ['content', currentView.wide && 'wide'] }, content));
  const scrollY = window.scrollY;
  const app = h('div', { class: 'app', onclick: (e) => { if (e.currentTarget.classList.contains('nav-open') && !e.target.closest('.sidebar')) e.currentTarget.classList.remove('nav-open'); } },
    sidebar(path), main, tabbar(path));
  root.replaceChildren(app);
  shell = app;
  if (fromStore && !viewChanged) window.scrollTo(0, scrollY);
  if (focusKey) {
    const el = root.querySelector(`[data-k="${CSS.escape(focusKey)}"]`);
    if (el) { el.focus({ preventScroll: true }); if (sel) try { el.setSelectionRange(...sel); } catch { /* not a text input */ } }
  }
  currentView.mounted?.(ctx);
}

boot();
