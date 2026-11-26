// Guest-facing invitation + RSVP page: /rsvp/<token>
import { h, icon, loadFonts, toast } from './lib/ui.js';
import { api } from './lib/api.js';
import { renderDesign, weddingVars } from './lib/design.js';
import { DIETARY } from './lib/templates.js';

const STR = {
  en: {
    dear: 'Dear', invited: 'You’re invited to celebrate the wedding of', when: 'When', ceremony: 'Ceremony', reception: 'Reception', map: 'Open in Maps', dress: 'Dress code',
    reply: 'Will you join us?', replyBy: (d) => `Please reply by ${d}`, yes: 'Joyfully accepts', no: 'Regretfully declines', meal: 'Meal', chooseMeal: 'Choose…',
    diet: 'Dietary needs', dietNote: 'Allergies or anything the kitchen should know', plusOne: 'Bringing a guest?', plusOneName: 'Their full name', song: 'A song that will get you dancing',
    songTitle: 'Song', songArtist: 'Artist', message: 'A message for the couple (optional)', email: 'Email', phone: 'Phone', contact: 'Your contact details',
    send: 'Send reply', update: 'Update reply', thanks: 'Thank you!', thanksYes: 'We can’t wait to celebrate with you.', thanksNo: 'We’ll miss you — thank you for letting us know.',
    change: 'Change my reply', addCal: 'Add to calendar', schedule: 'The day', gifts: 'Gifts', notFound: 'Invitation not found', answerAll: 'Please answer for everyone first.',
    already: 'You replied on', for: 'for',
  },
  el: {
    dear: 'Αγαπητέ/ή', invited: 'Σας προσκαλούμε να γιορτάσουμε μαζί τον γάμο των', when: 'Πότε', ceremony: 'Τελετή', reception: 'Δεξίωση', map: 'Άνοιγμα στον χάρτη', dress: 'Ενδυμασία',
    reply: 'Θα είστε μαζί μας;', replyBy: (d) => `Παρακαλούμε απαντήστε έως ${d}`, yes: 'Θα έρθω με χαρά', no: 'Δυστυχώς δεν θα μπορέσω', meal: 'Κυρίως πιάτο', chooseMeal: 'Επιλέξτε…',
    diet: 'Διατροφικές ανάγκες', dietNote: 'Αλλεργίες ή κάτι που πρέπει να ξέρει η κουζίνα', plusOne: 'Θα φέρετε συνοδό;', plusOneName: 'Ονοματεπώνυμο συνοδού', song: 'Ένα τραγούδι που θα σας σηκώσει να χορέψετε',
    songTitle: 'Τραγούδι', songArtist: 'Καλλιτέχνης', message: 'Ένα μήνυμα για το ζευγάρι (προαιρετικό)', email: 'Email', phone: 'Τηλέφωνο', contact: 'Τα στοιχεία σας',
    send: 'Αποστολή απάντησης', update: 'Ενημέρωση απάντησης', thanks: 'Ευχαριστούμε!', thanksYes: 'Ανυπομονούμε να γιορτάσουμε μαζί σας.', thanksNo: 'Θα μας λείψετε — ευχαριστούμε που μας ενημερώσατε.',
    change: 'Αλλαγή απάντησης', addCal: 'Προσθήκη στο ημερολόγιο', schedule: 'Το πρόγραμμα', gifts: 'Δώρα', notFound: 'Η πρόσκληση δεν βρέθηκε', answerAll: 'Παρακαλούμε απαντήστε για όλους.',
    already: 'Απαντήσατε στις', for: 'για',
  },
};
const DIET_EL = { Vegetarian: 'Χορτοφάγος', Vegan: 'Vegan', Pescatarian: 'Τρώω μόνο ψάρι', 'Gluten-free': 'Χωρίς γλουτένη', 'Dairy-free': 'Χωρίς γαλακτοκομικά', 'Nut allergy': 'Αλλεργία σε ξηρούς καρπούς', 'Shellfish allergy': 'Αλλεργία σε οστρακοειδή', 'Egg allergy': 'Αλλεργία στο αυγό', Halal: 'Halal', Kosher: 'Kosher', 'Low sodium': 'Χαμηλό αλάτι', Diabetic: 'Διαβήτης', 'Fasting (νηστεία)': 'Νηστεία', 'Child menu': 'Παιδικό μενού' };

const token = location.pathname.split('/').filter(Boolean)[1];
const root = document.getElementById('root');
let data; let S; let state; let sent = false;

function applyAccent(hex) {
  const c = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#c0587e';
  const n = parseInt(c.slice(1), 16);
  document.documentElement.style.setProperty('--accent', c);
  document.documentElement.style.setProperty('--accent-rgb', [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', '));
}
const mapLink = (q) => `https://maps.google.com/?q=${encodeURIComponent(q)}`;

function ics() {
  const w = data.wedding; if (!w.date) return;
  const d = w.date.replace(/-/g, ''); const t = (w.time || '17:00').replace(':', '');
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WedPlan//EN', 'BEGIN:VEVENT', `UID:${token}@wedplan`, `DTSTART:${d}T${t}00`, `DTEND:${d}T235900`,
    `SUMMARY:${[w.partner1, w.partner2].filter(Boolean).join(' & ')}`, `LOCATION:${[w.ceremony?.name, w.ceremony?.address].filter(Boolean).join(', ').replace(/[,;]/g, (m) => `\\${m}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = h('a', { href: URL.createObjectURL(new Blob([body], { type: 'text/calendar' })), download: 'wedding.ics' });
  document.body.append(a); a.click(); a.remove();
}

function render() {
  const w = data.wedding;
  const lang = w.lang === 'el' ? 'el' : 'en';
  S = STR[lang];
  document.documentElement.lang = lang;
  const couple = [w.partner1, w.partner2].filter(Boolean).join(' & ');
  document.title = couple || 'Invitation';
  const v = weddingVars(w, data.party.map((p) => p.first || p.name).join(lang === 'el' ? ' & ' : ' & '), lang);
  const meals = (w.mealOptions || []).map((m) => (typeof m === 'string' ? { name: m } : m));
  const people = data.party;

  const designBox = data.design ? (() => {
    const maxW = Math.min(560, window.innerWidth - 32);
    const scale = Math.min(1, maxW / (data.design.canvas?.w || 500));
    return h('div', { class: 'rsvp-design' }, renderDesign(data.design, v, { scale }));
  })() : h('div', { class: 'rsvp-hero' }, h('div', { class: 'small muted' }, S.invited), h('div', { class: 'names' }, couple), h('div', { class: 'date' }, v.date_long));

  const details = h('div', { class: 'card' },
    v.date_long && h('div', { class: 'detail-row' }, icon('calendar'), h('div', { class: 'grow' }, h('b', null, S.when), h('div', null, `${v.date_long}${w.time ? ` · ${w.time}` : ''}`)),
      h('button', { class: 'btn s tinted', onclick: ics }, S.addCal)),
    w.ceremony?.name && h('div', { class: 'detail-row' }, icon('ring'), h('div', { class: 'grow' }, h('b', null, S.ceremony), h('div', null, w.ceremony.name), w.ceremony.address && h('div', { class: 'small muted' }, w.ceremony.address)),
      (w.ceremony.address || w.ceremony.name) && h('a', { class: 'btn s', href: mapLink(w.ceremony.address || w.ceremony.name), target: '_blank', rel: 'noopener' }, icon('map'))),
    w.reception?.name && h('div', { class: 'detail-row' }, icon('sparkle'), h('div', { class: 'grow' }, h('b', null, S.reception), h('div', null, `${w.reception.name}${w.reception.time ? ` · ${w.reception.time}` : ''}`), w.reception.address && h('div', { class: 'small muted' }, w.reception.address)),
      (w.reception.address || w.reception.name) && h('a', { class: 'btn s', href: mapLink(w.reception.address || w.reception.name), target: '_blank', rel: 'noopener' }, icon('map'))),
    w.dressCode && h('div', { class: 'detail-row' }, icon('heart'), h('div', null, h('b', null, S.dress), h('div', null, w.dressCode))),
    data.schedule?.length ? h('div', { class: 'detail-row' }, icon('dayof'), h('div', { class: 'grow' }, h('b', null, S.schedule), data.schedule.map((s) => h('div', { class: 'row', style: { gap: '12px' } }, h('span', { class: 'num muted', style: { width: '48px' } }, s.time), h('span', null, s.title))))) : null,
    w.publicNote && h('div', { class: 'detail-row' }, icon('info'), h('div', { style: { whiteSpace: 'pre-wrap' } }, w.publicNote)),
    w.giftNote && h('div', { class: 'detail-row' }, icon('gift'), h('div', null, h('b', null, S.gifts), h('div', { style: { whiteSpace: 'pre-wrap' } }, w.giftNote))),
    w.hashtag && h('div', { class: 'detail-row' }, icon('camera'), h('div', null, w.hashtag)));

  if (sent) {
    const anyYes = people.some((p) => state.responses[p.id].rsvp === 'yes');
    root.replaceChildren(h('div', { class: 'rsvp-wrap' }, designBox,
      h('div', { class: 'card center', style: { padding: '30px 20px' } }, h('div', { class: 'serif', style: { fontSize: '34px', color: 'var(--accent)' } }, S.thanks),
        h('p', { class: 'mt' }, anyYes ? S.thanksYes : S.thanksNo),
        h('div', { class: 'row mt', style: { justifyContent: 'center' } }, anyYes && w.date && h('button', { class: 'btn tinted', onclick: ics }, icon('calendar'), S.addCal),
          h('button', { class: 'btn', onclick: () => { sent = false; render(); } }, S.change))),
      details));
    return;
  }

  const personBlock = (p) => {
    const r = state.responses[p.id];
    const po = state.plusOnes[p.id];
    return h('div', { class: 'rsvp-person' },
      h('div', { class: 'who' }, p.name),
      h('div', { class: 'yn' },
        h('button', { class: ['yes', r.rsvp === 'yes' && 'on'], onclick: () => { r.rsvp = 'yes'; render(); } }, `✓ ${S.yes}`),
        h('button', { class: ['no', r.rsvp === 'no' && 'on'], onclick: () => { r.rsvp = 'no'; render(); } }, S.no)),
      r.rsvp === 'yes' ? [
        meals.length ? h('div', { class: 'field' }, h('label', null, S.meal), h('select', { class: 'input', onchange: (e) => { r.meal = e.target.value; } },
          h('option', { value: '' }, S.chooseMeal), meals.map((m) => h('option', { value: m.name, selected: r.meal === m.name }, m.desc ? `${m.name} — ${m.desc}` : m.name)))) : null,
        w.askDietary !== false ? h('div', { class: 'field' }, h('label', null, S.diet), h('div', { class: 'chips' }, DIETARY.map((d) => h('button', { type: 'button', class: ['chip', r.dietary.includes(d) && 'on'], onclick: (e) => {
          r.dietary = r.dietary.includes(d) ? r.dietary.filter((x) => x !== d) : [...r.dietary, d]; e.currentTarget.classList.toggle('on');
        } }, lang === 'el' ? DIET_EL[d] || d : d))),
        h('input', { class: 'input', placeholder: S.dietNote, value: r.dietaryNote || '', oninput: (e) => { r.dietaryNote = e.target.value; } })) : null,
        p.plusOne ? h('div', { class: 'field' }, h('label', { class: 'row' }, h('span', { class: 'grow' }, S.plusOne), h('input', { type: 'checkbox', checked: po.on, onchange: (e) => { po.on = e.target.checked; render(); } })),
          po.on ? [h('input', { class: 'input', placeholder: S.plusOneName, value: po.name, oninput: (e) => { po.name = e.target.value; } }),
            meals.length ? h('select', { class: 'input', onchange: (e) => { po.meal = e.target.value; } }, h('option', { value: '' }, `${S.meal}: ${S.chooseMeal}`), meals.map((m) => h('option', { value: m.name, selected: po.meal === m.name }, m.name))) : null,
            w.askDietary !== false ? h('input', { class: 'input', placeholder: `${S.diet} / ${S.dietNote}`, value: po.dietaryNote || '', oninput: (e) => { po.dietaryNote = e.target.value; } }) : null] : null) : null,
      ] : null);
  };

  const form = h('div', { class: 'card col', style: { gap: '14px' } },
    h('div', null, h('h2', { style: { fontSize: '22px' } }, S.reply), w.rsvpBy && h('div', { class: 'small muted' }, S.replyBy(v.rsvp_by)),
      data.guest.rsvp !== 'pending' && state.repliedBefore ? h('div', { class: 'small muted' }, `${S.already} ${new Date(state.repliedBefore).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB')}`) : null),
    people.map(personBlock),
    w.askSong !== false && people.some((p) => state.responses[p.id].rsvp === 'yes') ? h('div', { class: 'field' }, h('label', null, `🎵 ${S.song}`),
      h('div', { class: 'form-row' }, h('input', { class: 'input', placeholder: S.songTitle, value: state.song.title, oninput: (e) => { state.song.title = e.target.value; } }),
        h('input', { class: 'input', placeholder: S.songArtist, value: state.song.artist, oninput: (e) => { state.song.artist = e.target.value; } }))) : null,
    w.askMessage !== false ? h('div', { class: 'field' }, h('label', null, S.message), h('textarea', { class: 'input', rows: 3, oninput: (e) => { state.message = e.target.value; } }, state.message)) : null,
    h('div', { class: 'field' }, h('label', null, S.contact), h('div', { class: 'form-row' },
      h('input', { class: 'input', type: 'email', placeholder: S.email, value: state.email, oninput: (e) => { state.email = e.target.value; } }),
      h('input', { class: 'input', type: 'tel', placeholder: S.phone, value: state.phone, oninput: (e) => { state.phone = e.target.value; } }))),
    h('button', { class: 'btn primary l', onclick: submit }, state.repliedBefore ? S.update : S.send));

  root.replaceChildren(h('div', { class: 'rsvp-wrap' }, designBox,
    h('div', { class: 'rsvp-greet' }, `${S.dear} ${people.map((p) => p.first || p.name).join(' & ')},`),
    details, form,
    h('div', { class: 'center xs faint' }, 'WedPlan')));
}

async function submit(e) {
  const people = data.party;
  if (people.some((p) => !['yes', 'no'].includes(state.responses[p.id].rsvp))) { toast(S.answerAll, { error: true }); return; }
  e.target.disabled = true;
  try {
    await api.post(`/api/public/rsvp/${token}`, {
      responses: people.map((p) => {
        const r = state.responses[p.id]; const po = state.plusOnes[p.id];
        return { id: p.id, rsvp: r.rsvp, meal: r.meal || null, dietary: r.dietary, dietaryNote: r.dietaryNote,
          plusOneGuest: p.plusOne ? (po.on && po.name.trim() ? { name: po.name, meal: po.meal, dietary: [], dietaryNote: po.dietaryNote } : { remove: true }) : undefined };
      }),
      message: state.message, song: state.song.title ? state.song : undefined, email: state.email || undefined, phone: state.phone || undefined,
    });
    sent = true; state.repliedBefore = Date.now();
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (x) { toast(x.message, { error: true }); e.target.disabled = false; }
}

(async () => {
  loadFonts();
  try {
    data = await api.get(`/api/public/rsvp/${token}`);
  } catch (e) {
    root.replaceChildren(h('div', { class: 'rsvp-wrap' }, h('div', { class: 'card center', style: { padding: '40px' } }, h('h2', null, 'Invitation not found · Η πρόσκληση δεν βρέθηκε'), h('p', { class: 'muted mt' }, e.message))));
    return;
  }
  applyAccent(data.wedding.accent);
  state = {
    responses: Object.fromEntries(data.party.map((p) => [p.id, { rsvp: p.rsvp, meal: p.meal, dietary: [...(p.dietary || [])], dietaryNote: p.dietaryNote }])),
    plusOnes: Object.fromEntries(data.party.map((p) => { const po = data.plusOnes.find((x) => x.plusOneOf === p.id && x.rsvp !== 'no'); return [p.id, { on: !!po, name: po ? po.name : '', meal: po?.meal || '', dietaryNote: po?.dietaryNote || '' }]; })),
    song: { title: '', artist: '' }, message: data.message || '', email: data.contact.email, phone: data.contact.phone,
    repliedBefore: Math.max(0, ...data.party.map((p) => p.rsvpAt || 0)) || null,
  };
  if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
  render();
  window.addEventListener('resize', () => { if (data.design) render(); });
})();
