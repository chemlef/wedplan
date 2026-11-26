import { h, icon, field, input, select, toggle, toast, confirmBox, promptBox, copyText, seg } from '../lib/ui.js';
import { store, saveWedding, coupleNames } from '../lib/store.js';
import { api } from '../lib/api.js';
import { navigate, applyAccent } from '../app.js';

const ACCENTS = ['#c0587e', '#b5838d', '#9d6b53', '#c08552', '#b89b5e', '#7a8b5c', '#5f8575', '#5b7c99', '#6c6fa8', '#8a6aa8', '#7b2d3b', '#2f3e5c', '#1d1d1f'];

function row(label, control, hint) {
  return h('div', { class: 'list-item', style: { flexWrap: 'wrap' } }, h('div', { class: 'grow', style: { minWidth: '180px' } }, h('div', null, label), hint && h('div', { class: 'xs muted' }, hint)), control);
}
// Text inputs save when you leave the field.
function txt(path, props = {}) {
  const parts = path.split('.');
  const val = parts.reduce((o, k) => o?.[k], store.wedding) ?? '';
  return input({ value: val, 'data-k': `set-${path}`, style: { maxWidth: '320px' }, ...props, onchange: (e) => {
    const v = props.type === 'number' ? Number(e.target.value) || 0 : e.target.value;
    saveWedding(parts.length === 1 ? { [path]: v } : { [parts[0]]: { [parts[1]]: v } }).then(() => toast('Saved'));
  } });
}
const tog = (key) => toggle(!!store.wedding[key], (v) => saveWedding({ [key]: v }));

export default {
  title: 'Wedding settings',
  render() {
    const w = store.wedding;
    const joinUrl = `${location.origin}/join/${w.code}`;
    return h('div', { style: { maxWidth: '820px' } },
      h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Wedding settings'), h('div', { class: 'sub' }, coupleNames()))),

      h('div', { class: 'section-h' }, 'The couple & the date'),
      h('div', { class: 'list' },
        row('Partner 1', txt('partner1')), row('Partner 2', txt('partner2')),
        row('Wedding date', txt('date', { type: 'date' })), row('Ceremony time', txt('time', { type: 'time' })),
        row('Ceremony type', select([{ value: 'greek', label: 'Greek Orthodox' }, { value: 'civil', label: 'Civil' }, { value: 'other', label: 'Other / mixed' }], w.tradition || 'other', (v) => saveWedding({ tradition: v }), { style: { maxWidth: '320px' } }))),

      h('div', { class: 'section-h' }, 'Venues'),
      h('div', { class: 'list' },
        row('Ceremony venue', txt('ceremony.name', { placeholder: 'e.g. Agios Nikolaos church' })),
        row('Ceremony address', txt('ceremony.address')),
        row('Reception venue', txt('reception.name')),
        row('Reception address', txt('reception.address')),
        row('Reception time', txt('reception.time', { type: 'time' }))),

      h('div', { class: 'section-h' }, 'Guests & budget'),
      h('div', { class: 'list' },
        row('Expected number of guests', txt('guestTarget', { type: 'number', min: 0 })),
        row('Total budget', txt('budget', { type: 'number', min: 0 })),
        row('Currency', select(['EUR', 'USD', 'GBP', 'CHF', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK', 'PLN', 'RON', 'BGN', 'TRY', 'CZK'], w.currency || 'EUR', (v) => saveWedding({ currency: v }), { style: { maxWidth: '320px' } }))),

      h('div', { class: 'section-h' }, 'Invitation & RSVP page'),
      h('div', { class: 'list' },
        row('Language for guests', seg([{ value: 'en', label: 'English' }, { value: 'el', label: 'Ελληνικά' }], w.lang || 'en', (v) => saveWedding({ lang: v }))),
        row('Reply by', txt('rsvpBy', { type: 'date' })),
        row('Ask for dietary needs', tog('askDietary')),
        row('Ask for a song request', tog('askSong')),
        row('Ask for a message to the couple', tog('askMessage')),
        row('Meal choices', h('button', { class: 'btn s', onclick: () => navigate('/menu') }, `${(w.mealOptions || []).length || 'None'} · edit in Menu`)),
        row('Dress code', txt('dressCode', { placeholder: 'e.g. Summer formal' })),
        row('Hashtag', txt('hashtag', { placeholder: '#MariaAndNikos' })),
        row('Message to guests', h('textarea', { class: 'input', rows: 2, style: { maxWidth: '320px' }, onchange: (e) => saveWedding({ publicNote: e.target.value }).then(() => toast('Saved')) }, w.publicNote || ''), 'Shown under the invitation, e.g. parking or accommodation info.'),
        row('Gifts', h('textarea', { class: 'input', rows: 2, style: { maxWidth: '320px' }, onchange: (e) => saveWedding({ giftNote: e.target.value }).then(() => toast('Saved')) }, w.giftNote || ''), 'e.g. a wedding list or bank details for gifts.'),
        row('Show the day’s schedule to guests', tog('schedulePublic'), 'Choose which moments are shown in Day-of schedule.')),

      h('div', { class: 'section-h' }, 'Appearance'),
      h('div', { class: 'card' },
        h('div', { class: 'small muted mb' }, 'Accent colour for the app, invitation page and emails.'),
        h('div', { class: 'row wrap' }, ACCENTS.map((c) => h('button', { class: ['color-dot', (w.accent || '#c0587e') === c && 'on'], style: { background: c, width: '30px', height: '30px' }, 'aria-label': `Use ${c}`,
          onclick: () => saveWedding({ accent: c }).then(() => applyAccent(store.wedding.accent)) })),
        h('label', { class: 'swatch-pick', style: { width: '30px', height: '30px', borderRadius: '50%', background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }, title: 'Custom colour' },
          h('input', { type: 'color', value: w.accent || '#c0587e', onchange: (e) => saveWedding({ accent: e.target.value }).then(() => applyAccent(store.wedding.accent)) })))),

      h('div', { class: 'section-h' }, 'Helpers’ sign-in'),
      h('div', { class: 'list' },
        row('Wedding code', h('b', { style: { letterSpacing: '.15em', fontSize: '18px' } }, w.code), 'Koumbaroi and family sign in with this code plus the username you give them.'),
        row('Sign-in link', h('button', { class: 'btn s', onclick: () => copyText(joinUrl, 'Link copied') }, icon('copy'), 'Copy link')),
        row('Manage people & permissions', h('button', { class: 'btn s', onclick: () => navigate('/team') }, 'Team & access', icon('chevron')))),

      h('div', { class: 'section-h' }, 'Danger zone'),
      h('div', { class: 'list' },
        store.me.role === 'owner' ? row('Delete this wedding', h('button', { class: 'btn s danger', onclick: async () => {
          const typed = await promptBox({ title: 'Delete wedding', label: `This permanently deletes every guest, table, design and note. Type DELETE to confirm.`, confirm: 'Delete' });
          if (typed !== 'DELETE') return;
          await api.del(`/api/w/${w.id}`);
          localStorage.removeItem('wp_wedding');
          store.wedding = null; store.weddings = [];
          toast('Wedding deleted');
          navigate('/weddings');
        } }, icon('trash'), 'Delete'), 'This can’t be undone.') : row('Leave this wedding', h('span', { class: 'small muted' }, 'Ask the owner to remove you'))));
  },
};
