import { h, icon, sheet, toast, field, input, toggle, emptyState, printHtml, esc, fmtDate, plural } from '../lib/ui.js';
import { store, list, can, create, patch, remove, bulk, coupleNames, isPlanner, saveWedding } from '../lib/store.js';
import { DAYOF, GREEK_DAYOF } from '../lib/templates.js';
import { people } from './timeline.js';

// Times before 06:00 belong to the night after the wedding.
const key = (t) => (t && t < '06:00' ? `3${t}` : t || '9');
const sorted = () => list('dayof').slice().sort((a, b) => key(a.time).localeCompare(key(b.time)));

function itemSheet(it, defaults = {}) {
  const d = it ? { ...it } : { time: '', title: '', who: '', location: '', public: false, ...defaults };
  const editable = can('dayof', 'edit');
  const s = sheet({
    title: it ? it.title : 'Add to the schedule', doneLabel: it ? 'Save' : 'Add',
    body: h('div', { class: 'form' },
      h('div', { class: 'form-row' }, field('Time', input({ type: 'time', value: d.time, oninput: (e) => { d.time = e.target.value; } })), field('Until (optional)', input({ type: 'time', value: d.end || '', oninput: (e) => { d.end = e.target.value; } }))),
      field('What happens', input({ value: d.title, oninput: (e) => { d.title = e.target.value; } })),
      field('Who’s responsible', h('span', null, input({ value: d.who || '', list: 'dayof-who', oninput: (e) => { d.who = e.target.value; } }), h('datalist', { id: 'dayof-who' }, [...people(), ...list('vendor').filter((v) => v.status === 'booked').map((v) => v.name)].map((p) => h('option', { value: p }))))),
      field('Where', input({ value: d.location || '', oninput: (e) => { d.location = e.target.value; } })),
      field('Details', h('textarea', { class: 'input', rows: 3, oninput: (e) => { d.notes = e.target.value; } }, d.notes || '')),
      h('label', { class: 'row' }, h('div', { class: 'grow' }, 'Show to guests', h('div', { class: 'xs muted' }, 'Appears on the invitation page when the schedule is published.')), toggle(!!d.public, (v) => { d.public = v; }))),
    done: editable ? async () => {
      if (!d.title.trim()) return false;
      const { id, type, _sort, _updated, _by, ...data } = d;
      if (it) await patch('dayof', it.id, data); else await create('dayof', data);
    } : null,
    footer: it && editable ? [h('button', { class: 'btn danger', onclick: () => { s.close(); remove('dayof', it.id, { label: it.title }); } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

function print() {
  const w = store.wedding;
  const vendors = list('vendor').filter((v) => v.status === 'booked');
  printHtml('Day-of schedule', `<h1>${esc(coupleNames())}</h1><div class="muted">${esc(w.date ? fmtDate(w.date, 'long') : '')} · Run sheet</div>
  <table style="margin-top:16px"><tr><th style="width:90px">Time</th><th>What</th><th>Who</th><th>Where</th></tr>
  ${sorted().map((x) => `<tr><td><b>${esc(x.time || '')}${x.end ? `–${esc(x.end)}` : ''}</b></td><td>${esc(x.title)}${x.notes ? `<div class="muted">${esc(x.notes)}</div>` : ''}</td><td>${esc(x.who || '')}</td><td>${esc(x.location || '')}</td></tr>`).join('')}</table>
  ${vendors.length ? `<h2>Vendor contacts</h2><table>${vendors.map((v) => `<tr><td><b>${esc(v.name)}</b></td><td>${esc(v.contact || '')}</td><td>${esc(v.phone || '')}</td><td>${esc(v.email || '')}</td></tr>`).join('')}</table>` : ''}`);
}

export default {
  title: 'Day-of schedule',
  render() {
    const w = store.wedding;
    const editable = can('dayof', 'edit');
    const items = sorted();
    const vendors = can('vendors') ? list('vendor').filter((v) => v.status === 'booked') : [];
    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Day-of schedule'), h('div', { class: 'sub' }, `${w.date ? fmtDate(w.date, 'long') : 'Wedding day'} · ${plural(items.length, 'moment')}`)),
        h('div', { class: 'actions' },
          h('button', { class: 'btn', onclick: print, disabled: !items.length }, icon('print'), 'Print run sheet'),
          editable && h('button', { class: 'btn primary', onclick: () => itemSheet(null) }, icon('plus'), 'Add'))),
      isPlanner() ? h('div', { class: 'card mb row' }, h('div', { class: 'grow' }, h('b', null, 'Publish the schedule to guests'), h('div', { class: 'small muted' }, `Items marked “show to guests” appear on everyone’s invitation page (${items.filter((x) => x.public).length} marked).`)),
        toggle(!!w.schedulePublic, (v) => saveWedding({ schedulePublic: v }))) : null,
      h('div', { class: 'grid c3' },
        h('div', { class: 'span2' }, items.length ? h('div', { class: 'list' }, items.map((x) => h('div', { class: 'list-item tap', onclick: () => itemSheet(x), style: { alignItems: 'flex-start' } },
          h('div', { style: { width: '62px', flexShrink: 0, fontWeight: 700, fontVariantNumeric: 'tabular-nums', paddingTop: '1px' } }, x.time || '—', x.end ? h('div', { class: 'xs muted' }, `to ${x.end}`) : null),
          h('div', { class: 'grow' }, h('div', { class: 'title' }, x.title, x.public ? h('span', { class: 'chip', style: { marginLeft: '6px', height: '18px', fontSize: '11px' } }, 'guests') : null),
            h('div', { class: 'meta' }, [x.who && `👤 ${x.who}`, x.location && `📍 ${x.location}`].filter(Boolean).join('  ')), x.notes ? h('div', { class: 'small muted', style: { marginTop: '2px' } }, x.notes) : null))))
          : emptyState('dayof', 'Plan the day hour by hour', 'A run sheet keeps the couple, koumbaroi and vendors on the same page. Start from a typical wedding day and adjust.',
            editable && h('button', { class: 'btn primary', onclick: () => bulk((w.tradition === 'greek' ? [...DAYOF, ...GREEK_DAYOF] : DAYOF).map((x, i) => ({ op: 'create', type: 'dayof', data: { ...x, public: !!x.public, _sort: i } }))) }, icon('sparkle'), 'Use a sample day'))),
        h('div', null,
          h('div', { class: 'section-h' }, 'Who to call'),
          vendors.length ? h('div', { class: 'list' }, vendors.map((v) => h('div', { class: 'list-item' }, h('div', { class: 'grow' }, h('div', { class: 'title' }, v.name), h('div', { class: 'meta' }, v.contact || '')),
            v.phone && h('a', { class: 'btn s icon tinted', href: `tel:${v.phone}`, 'aria-label': `Call ${v.name}` }, icon('phone')))))
            : h('div', { class: 'card small muted' }, 'Booked vendors and their phone numbers show up here for the big day.'))));
  },
};
