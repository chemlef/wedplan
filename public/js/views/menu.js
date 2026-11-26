import { h, icon, sheet, menu, toast, field, input, select, seg, toggle, confirmBox, emptyState, plural, money, printHtml, esc, download, toCsv, sortable } from '../lib/ui.js';
import { store, list, can, create, patch, remove, bulk, saveWedding, isPlanner, guestName, currency, coupleNames } from '../lib/store.js';
import { DISHES, COURSES, STYLES, fits, TAG_LABELS } from '../lib/menudata.js';
import { DIETARY } from '../lib/templates.js';

const ui = { tab: 'menu', style: '', course: '', format: 'plated' };
const TAGS = ['V', 'VG', 'GF', 'DF', 'NF', 'EF', 'FI', 'SH', 'M'];
const tagChips = (tags) => (tags || []).filter((t) => TAG_LABELS[t]).map((t) => h('span', { class: ['chip', ['V', 'VG'].includes(t) ? 'green' : ['GF', 'DF', 'NF', 'EF'].includes(t) ? 'blue' : ''], title: TAG_LABELS[t], style: { height: '20px', fontSize: '11px' } }, t));

function dishSheet(d0, defaults = {}) {
  const d = d0 ? structuredClone(d0) : { name: '', course: 'Main', tags: [], onMenu: true, ...defaults };
  const editable = can('menu', 'edit');
  const s = sheet({
    title: d0 ? d0.name : 'New dish', doneLabel: d0 ? 'Save' : 'Add',
    body: h('div', { class: 'form' },
      field('Dish', input({ value: d.name, oninput: (e) => { d.name = e.target.value; } })),
      field('Description', input({ value: d.desc || '', oninput: (e) => { d.desc = e.target.value; } })),
      h('div', { class: 'form-row' },
        field('Course', select(COURSES, d.course, (v) => { d.course = v; })),
        field('Cost per guest', input({ type: 'number', min: 0, value: d.cost ?? '', oninput: (e) => { d.cost = e.target.value === '' ? null : Number(e.target.value); } }))),
      field('Suitable for / contains', h('div', { class: 'chips' }, TAGS.map((t) => {
        const b = h('button', { type: 'button', class: ['chip', d.tags.includes(t) && 'on'], onclick: () => { d.tags = d.tags.includes(t) ? d.tags.filter((x) => x !== t) : [...d.tags, t]; b.classList.toggle('on'); } }, TAG_LABELS[t]);
        return b;
      })), 'Used to check every guest with dietary needs has something to eat.'),
      h('label', { class: 'row' }, h('span', { class: 'grow' }, 'On the final menu'), toggle(!!d.onMenu, (v) => { d.onMenu = v; })),
      field('Notes for the caterer', input({ value: d.notes || '', oninput: (e) => { d.notes = e.target.value; } }))),
    done: editable ? async () => {
      if (!d.name.trim()) return false;
      const { id, type, _sort, _updated, _by, ...data } = d;
      if (d0) await patch('dish', d0.id, data); else await create('dish', data);
    } : null,
    footer: d0 && editable ? [h('button', { class: 'btn danger', onclick: () => { s.close(); remove('dish', d0.id, { label: d0.name }); } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

function dietSummary() {
  const guests = list('guest').filter((g) => g.rsvp !== 'no');
  const counts = Object.fromEntries(DIETARY.map((d) => [d, guests.filter((g) => (g.dietary || []).includes(d))]));
  const notes = guests.filter((g) => g.dietaryNote);
  const meals = {};
  guests.forEach((g) => { if (g.meal) meals[g.meal] = (meals[g.meal] || 0) + 1; });
  return { guests, counts, notes, meals };
}

function coverage(summary) {
  const onMenu = list('dish').filter((d) => d.onMenu);
  const issues = [];
  for (const [r, gs] of Object.entries(summary.counts)) {
    if (!gs.length || r === 'Child menu' || r === 'Low sodium' || r === 'Diabetic') continue;
    for (const course of ['Starter', 'Main', 'Dessert']) {
      const dishes = onMenu.filter((d) => d.course === course);
      if (!dishes.length) continue;
      if (!dishes.some((d) => fits(d.tags, r))) issues.push({ r, course, n: gs.length });
    }
  }
  if (summary.counts['Child menu']?.length && !onMenu.some((d) => d.course === 'Kids')) issues.push({ r: 'Child menu', course: 'Kids', n: summary.counts['Child menu'].length });
  return issues;
}

function suggestMenus(style, format, summary) {
  const needs = Object.entries(summary.counts).filter(([, gs]) => gs.length).map(([r]) => r);
  const courses = format === 'cocktail' ? ['Canapés', 'Late-night', 'Dessert', 'Drinks']
    : format === 'buffet' ? ['Starter', 'Salad', 'Main', 'Side', 'Dessert', 'Wedding cake', 'Drinks']
      : format === 'four' ? ['Canapés', 'Starter', 'Soup', 'Main', 'Dessert', 'Wedding cake', 'Drinks']
        : ['Canapés', 'Starter', 'Main', 'Dessert', 'Wedding cake', 'Drinks'];
  const pool = (course) => DISHES.filter((d) => d.course === course && (!style || d.styles.includes(style) || d.styles.includes('Classic')));
  const options = [];
  for (let seed = 0; seed < 3; seed++) {
    const pick = [];
    for (const course of courses) {
      const p = pool(course);
      if (!p.length) continue;
      const count = course === 'Canapés' ? (format === 'cocktail' ? 6 : 3) : course === 'Main' ? (format === 'buffet' ? 3 : 2) : format === 'buffet' && course !== 'Wedding cake' ? 2 : 1;
      const rot = p.slice(seed % p.length).concat(p.slice(0, seed % p.length));
      const chosen = [];
      // Start with the best match for the style, then make sure dietary needs are covered.
      rot.sort((a, b) => (b.styles[0] === style) - (a.styles[0] === style));
      for (const d of rot) { if (chosen.length >= count) break; chosen.push(d); }
      if (['Starter', 'Main', 'Dessert'].includes(course)) {
        for (const r of needs) {
          if (['Child menu', 'Low sodium', 'Diabetic'].includes(r)) continue;
          if (!chosen.some((d) => fits(d.tags, r))) {
            const alt = DISHES.find((d) => d.course === course && fits(d.tags, r) && !chosen.includes(d));
            if (alt) chosen.push({ ...alt, forDiet: r });
          }
        }
      }
      pick.push(...chosen);
    }
    if (summary.counts['Child menu']?.length) pick.push(...DISHES.filter((d) => d.course === 'Kids').slice(seed % 2, (seed % 2) + 1));
    options.push(pick);
  }
  return options;
}

function generatorSheet(summary) {
  let style = store.wedding.tradition === 'greek' ? 'Greek' : 'Mediterranean'; let format = 'plated'; let options = null; let chosen = 0;
  const out = h('div', { class: 'col' });
  const draw = () => {
    out.replaceChildren(
      h('div', { class: 'form-row' },
        field('Cuisine', select(STYLES, style, (v) => { style = v; options = null; draw(); })),
        field('Format', select([{ value: 'plated', label: 'Plated, 3 courses' }, { value: 'four', label: 'Plated, 4 courses' }, { value: 'buffet', label: 'Buffet / family style' }, { value: 'cocktail', label: 'Cocktail reception' }], format, (v) => { format = v; options = null; draw(); }))),
      h('div', { class: 'small muted' }, Object.entries(summary.counts).filter(([, g]) => g.length).length
        ? `Covers your guests’ needs: ${Object.entries(summary.counts).filter(([, g]) => g.length).map(([r, g]) => `${r} (${g.length})`).join(', ')}.` : 'No dietary needs recorded yet. Add them in the guest list or collect them with the RSVP.'),
      !options ? h('button', { class: 'btn primary', onclick: () => { options = suggestMenus(style, format, summary); draw(); } }, icon('wand'), 'Suggest menus') : [
        seg(options.map((_, i) => ({ value: i, label: `Option ${i + 1}` })), chosen, (v) => { chosen = v; draw(); }),
        h('div', { class: 'list' }, COURSES.map((c) => {
          const ds = options[chosen].filter((d) => d.course === c);
          if (!ds.length) return null;
          return h('div', { class: 'list-item', style: { alignItems: 'flex-start' } }, h('div', { class: 'small muted', style: { width: '100px', paddingTop: '2px' } }, c),
            h('div', { class: 'grow col gap-s' }, ds.map((d) => h('div', null, h('span', null, d.name), ' ', tagChips(d.tags), d.forDiet ? h('span', { class: 'xs warn' }, ` for ${d.forDiet.toLowerCase()} guests`) : null, d.desc ? h('div', { class: 'xs muted' }, d.desc) : null))));
        })),
        h('button', { class: 'btn plain', onclick: () => { options = null; draw(); } }, icon('refresh'), 'Start over')],
    );
  };
  draw();
  sheet({
    title: 'Menu ideas', size: 'wide', body: out, doneLabel: 'Add to my menu',
    done: async () => {
      if (!options) { toast('Generate some options first', { error: true }); return false; }
      const have = new Set(list('dish').map((d) => d.name));
      const ops = options[chosen].filter((d) => !have.has(d.name)).map((d, i) => ({ op: 'create', type: 'dish', data: { name: d.name, course: d.course, desc: d.desc, tags: d.tags, onMenu: true, _sort: Date.now() / 1e6 + i / 1e6 } }));
      await bulk(ops, 'added a suggested menu');
      toast(`Added ${plural(ops.length, 'dish', 'dishes')}`);
    },
  });
}

function mealOptionsSheet() {
  let opts = (store.wedding.mealOptions || []).map((m) => (typeof m === 'string' ? { name: m } : { ...m }));
  const box = h('div', { class: 'col gap-s' });
  const draw = () => box.replaceChildren(...opts.map((o, i) => h('div', { class: 'row' },
    input({ value: o.name, placeholder: 'e.g. Lamb kleftiko', oninput: (e) => { o.name = e.target.value; } }),
    input({ value: o.desc || '', placeholder: 'Short description (optional)', oninput: (e) => { o.desc = e.target.value; } }),
    h('button', { class: 'btn plain icon s', 'aria-label': 'Remove', onclick: () => { opts.splice(i, 1); draw(); } }, icon('x')))),
  h('div', { class: 'row' }, h('button', { class: 'btn s', onclick: () => { opts.push({ name: '' }); draw(); } }, icon('plus'), 'Add option'),
    list('dish').some((d) => d.onMenu && d.course === 'Main') && h('button', { class: 'btn s plain', onclick: () => { opts = list('dish').filter((d) => d.onMenu && d.course === 'Main').map((d) => ({ name: d.name, desc: d.desc || '' })); draw(); } }, 'Use my menu’s mains')));
  draw();
  sheet({
    title: 'Meal choices on the RSVP', size: 'wide',
    body: h('div', { class: 'form' }, h('p', { class: 'small muted' }, 'Guests pick one of these when they RSVP. Leave empty if guests don’t choose a meal.'), box),
    doneLabel: 'Save',
    done: () => saveWedding({ mealOptions: opts.filter((o) => o.name.trim()).map((o) => ({ name: o.name.trim(), desc: o.desc || '' })) }),
  });
}

function printMenu() {
  const onMenu = list('dish').filter((d) => d.onMenu && d.course !== 'Kids' && d.course !== 'Drinks');
  const w = store.wedding;
  printHtml('Menu', `<div style="max-width:120mm;margin:10mm auto;text-align:center;font-family:'Cormorant Garamond',serif">
    <div style="font-family:'Great Vibes',cursive;font-size:38pt">${esc(coupleNames())}</div>
    <div style="letter-spacing:.3em;text-transform:uppercase;font-size:10pt;margin:6px 0 26px">${esc(w.date ? new Date(`${w.date}T12:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '')}</div>
    ${COURSES.filter((c) => onMenu.some((d) => d.course === c)).map((c) => `<div style="margin-bottom:20px"><div style="letter-spacing:.25em;text-transform:uppercase;font-size:9pt;color:#888">${esc(c)}</div>
    ${onMenu.filter((d) => d.course === c).map((d) => `<div style="font-size:15pt;margin-top:4px">${esc(d.name)}</div>${d.desc ? `<div style="font-style:italic;font-size:11pt;color:#666">${esc(d.desc)}</div>` : ''}`).join('')}</div>`).join('<div style="color:#bbb">❦</div>')}</div>`);
}

function kitchenSheet(summary) {
  const tables = Object.fromEntries(list('table').map((t) => [t.id, t.name]));
  printHtml('Dietary requirements', `<h1>${esc(coupleNames())}</h1><div class="muted">Dietary requirements for the caterer · ${summary.guests.length} guests</div>
    <h2>Meal choices</h2><table><tr><th>Meal</th><th>Guests</th></tr>${Object.entries(summary.meals).map(([m, n]) => `<tr><td>${esc(m)}</td><td>${n}</td></tr>`).join('') || '<tr><td colspan=2>No meal choices recorded</td></tr>'}</table>
    <h2>Guests with dietary needs</h2><table><tr><th>Guest</th><th>Table</th><th>Meal</th><th>Needs</th><th>Notes</th></tr>
    ${summary.guests.filter((g) => g.dietary?.length || g.dietaryNote).map((g) => `<tr><td>${esc(guestName(g))}</td><td>${esc(tables[g.table] || '')}</td><td>${esc(g.meal || '')}</td><td>${esc((g.dietary || []).join(', '))}</td><td>${esc(g.dietaryNote || '')}</td></tr>`).join('')}</table>`);
}

export default {
  title: 'Menu',
  render() {
    const editable = can('menu', 'edit');
    const dishes = list('dish');
    const onMenu = dishes.filter((d) => d.onMenu);
    const ideas = dishes.filter((d) => !d.onMenu);
    const summary = dietSummary();
    const issues = coverage(summary);
    const perHead = onMenu.reduce((s, d) => s + (Number(d.cost) || 0), 0);
    const dietCount = summary.guests.filter((g) => g.dietary?.length || g.dietaryNote).length;

    const dishRow = (d) => h('div', { class: 'list-item tap', 'data-id': d.id, onclick: () => dishSheet(d) },
      editable && h('span', { class: 'handle', onclick: (e) => e.stopPropagation() }, icon('grip')),
      h('div', { class: 'grow' }, h('div', { class: 'title' }, d.name), d.desc && h('div', { class: 'meta' }, d.desc)),
      h('div', { class: 'chips' }, tagChips(d.tags)),
      d.cost ? h('span', { class: 'small muted num' }, money(d.cost, currency())) : null,
      editable && h('button', { class: 'btn plain icon s', title: d.onMenu ? 'Move to ideas' : 'Add to menu', 'aria-label': d.onMenu ? 'Move to ideas' : 'Add to menu', onclick: (e) => { e.stopPropagation(); patch('dish', d.id, { onMenu: !d.onMenu }); } }, icon(d.onMenu ? 'x' : 'plus')));

    const courseLists = (ds) => COURSES.filter((c) => ds.some((d) => d.course === c)).map((c) => {
      const l = h('div', { class: 'list' }, ds.filter((d) => d.course === c).map(dishRow));
      if (editable) sortable(l, (ids) => bulk(ids.map((id, i) => ({ op: 'patch', type: 'dish', id, data: { _sort: i } }))));
      return [h('div', { class: 'section-h' }, c), l];
    });

    const library = () => {
      const have = new Set(dishes.map((d) => d.name));
      const lib = DISHES.filter((d) => (!ui.style || d.styles.includes(ui.style)) && (!ui.course || d.course === ui.course));
      return h('div', null,
        h('div', { class: 'toolbar' },
          select([{ value: '', label: 'All cuisines' }, ...STYLES], ui.style, (v) => { ui.style = v; rr(); }, { class: 'input s', style: { width: 'auto' } }),
          select([{ value: '', label: 'All courses' }, ...COURSES], ui.course, (v) => { ui.course = v; rr(); }, { class: 'input s', style: { width: 'auto' } })),
        h('div', { class: 'grid auto' }, lib.map((d) => h('div', { class: 'card', style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
          h('div', { class: 'xs muted', style: { textTransform: 'uppercase', letterSpacing: '.05em' } }, `${d.course} · ${d.styles.join(', ')}`),
          h('b', null, d.name), d.desc && h('div', { class: 'small muted' }, d.desc), h('div', { class: 'chips' }, tagChips(d.tags)),
          editable && h('div', { class: 'row', style: { marginTop: 'auto' } }, have.has(d.name) ? h('span', { class: 'small pos' }, '✓ Added')
            : [h('button', { class: 'btn s tinted', onclick: () => create('dish', { name: d.name, course: d.course, desc: d.desc, tags: d.tags, onMenu: true }).then(() => toast('Added to menu')) }, 'Add to menu'),
              h('button', { class: 'btn s plain', onclick: () => create('dish', { name: d.name, course: d.course, desc: d.desc, tags: d.tags, onMenu: false }).then(() => toast('Saved to ideas')) }, 'Save idea')])))));
    };

    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Menu & dietary needs'), h('div', { class: 'sub' }, `${plural(onMenu.length, 'dish', 'dishes')} on the menu · ${dietCount} guests with dietary needs${perHead ? ` · ≈ ${money(perHead, currency())} per guest` : ''}`)),
        h('div', { class: 'actions' },
          h('button', { class: 'btn', onclick: (e) => menu(e.currentTarget, [
            { label: 'Print menu card', icon: 'print', onClick: printMenu },
            { label: 'Print dietary sheet for the caterer', icon: 'clipboard', onClick: () => kitchenSheet(summary) },
            { label: 'Export dietary list (CSV)', icon: 'download', onClick: () => download('dietary.csv', toCsv([['Guest', 'RSVP', 'Meal', 'Dietary', 'Notes'], ...summary.guests.filter((g) => g.meal || g.dietary?.length || g.dietaryNote).map((g) => [guestName(g), g.rsvp, g.meal, (g.dietary || []).join('; '), g.dietaryNote])]), 'text/csv') },
            isPlanner() && { label: 'Meal choices on the RSVP…', icon: 'invite', onClick: mealOptionsSheet },
          ]) }, icon('more')),
          editable && h('button', { class: 'btn', onclick: () => generatorSheet(summary) }, icon('wand'), 'Suggest a menu'),
          editable && h('button', { class: 'btn primary', onclick: () => dishSheet(null) }, icon('plus'), 'Dish'))),
      h('div', { class: 'grid c3' },
        h('div', { class: 'card span2' },
          h('div', { class: 'card-title' }, 'Dietary needs', h('span', { class: 'more small muted' }, `from ${plural(summary.guests.length, 'guest')} not declined`)),
          Object.values(summary.counts).some((g) => g.length) ? h('div', { class: 'chips mt' }, Object.entries(summary.counts).filter(([, g]) => g.length).map(([r, g]) =>
            h('button', { class: 'chip orange', title: g.map(guestName).join(', '), onclick: (e) => menu(e.currentTarget, [{ header: r }, ...g.map((x) => ({ label: guestName(x), icon: 'person', onClick: () => import('./guests.js').then((m) => m.guestSheet(x)) }))]) }, `${r} · ${g.length}`)))
            : h('p', { class: 'small muted mt' }, 'None recorded yet. Guests can tell you with their RSVP, or add them in the guest list.'),
          summary.notes.length ? h('div', { class: 'mt small' }, h('div', { class: 'label' }, 'Allergies & kitchen notes'), summary.notes.map((g) => h('div', null, h('b', null, guestName(g)), `: ${g.dietaryNote}`))) : null,
          issues.length ? h('div', { class: 'mt col gap-s' }, issues.map((i) => h('div', { class: 'row small warn' }, icon('alert'), `${i.n} ${i.r.toLowerCase()} guest${i.n > 1 ? 's' : ''}: no suitable ${i.course.toLowerCase()} on the menu yet`)))
            : onMenu.length && dietCount ? h('div', { class: 'row small pos mt' }, icon('check'), 'Every dietary need has a dish in each course.') : null),
        h('div', { class: 'card' },
          h('div', { class: 'card-title' }, 'Meal choices', isPlanner() && h('button', { class: 'more btn plain s', onclick: mealOptionsSheet }, 'Edit')),
          (store.wedding.mealOptions || []).length ? h('div', { class: 'col gap-s mt' }, store.wedding.mealOptions.map((m) => {
            const n = typeof m === 'string' ? m : m.name;
            const c = summary.meals[n] || 0;
            return h('div', { class: 'small' }, h('div', { class: 'row between' }, h('span', null, n), h('b', { class: 'num' }, c)),
              h('div', { class: 'progress', style: { marginTop: '3px' } }, h('span', { style: { width: `${summary.guests.length ? (c / summary.guests.length) * 100 : 0}%` } })));
          }), h('div', { class: 'xs muted' }, `${summary.guests.filter((g) => !g.meal && g.rsvp === 'yes').length} attending guests haven’t chosen`))
            : h('p', { class: 'small muted mt' }, 'Let guests choose their main course when they RSVP.', isPlanner() ? h('div', null, h('button', { class: 'btn s tinted mt', onclick: mealOptionsSheet }, 'Set up meal choices')) : null))),
      h('div', { class: 'mt-l' }, seg([{ value: 'menu', label: `Our menu (${onMenu.length})` }, { value: 'ideas', label: `Saved ideas (${ideas.length})` }, { value: 'library', label: 'Browse dishes' }], ui.tab, (v) => { ui.tab = v; rr(); })),
      ui.tab === 'library' ? h('div', { class: 'mt' }, library())
        : ui.tab === 'ideas' ? (ideas.length ? courseLists(ideas) : h('div', { class: 'card center muted mt' }, 'Save dishes you’re considering from “Browse dishes”.'))
          : onMenu.length ? courseLists(onMenu)
            : emptyState('menu_food', 'Build your menu', 'Browse Greek, Mediterranean and classic wedding dishes, or let WedPlan suggest complete menus that cover your guests’ dietary needs.',
              editable && h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn', onclick: () => { ui.tab = 'library'; rr(); } }, 'Browse dishes'), h('button', { class: 'btn primary', onclick: () => generatorSheet(summary) }, icon('wand'), 'Suggest a menu'))));
  },
};
function rr() { import('../lib/store.js').then((m) => m.emit()); }
