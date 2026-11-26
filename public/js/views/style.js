import { h, icon, sheet, menu, toast, field, input, select, seg, toggle, emptyState, plural, copyText, printHtml, esc, money, confirmBox, promptBox, loadFonts, FONTS } from '../lib/ui.js';
import { store, list, get, can, create, patch, remove, saveWedding, coupleNames, currency, isPlanner } from '../lib/store.js';
import { PALETTES, suggestPalettes, colorName, textOn, colorDistance } from '../lib/color.js';
import { FLOWERS, flowerById, flowerSvg, MONTHS, KIND_LABEL, suggestBouquets, bouquetSvg, bouquetMeaning, BOUQUET_STYLES, BOUQUET_SIZES, flowerPaletteFit } from '../lib/flowers.js';
import { CONTAINERS, KOUFETA, DECOS, MATERIALS, favorSvg, KOUFETA_INFO } from '../lib/favors.js';

const weddingMonth = () => (store.wedding.date ? Number(store.wedding.date.slice(5, 7)) : 0);
const ui = {
  tab: 'palettes', seeds: ['#c9a9a6'], season: '',
  fKind: '', fInSeason: true, fMatch: false, fQ: '',
  b: null, bOptions: null, bPick: 0,
  fav: null,
};
const html = (markup, cls, style) => { const d = h('div', { class: cls, style }); d.innerHTML = markup; return d; };

export function ourPalette() {
  const p = list('palette').find((x) => x.id === store.wedding.paletteId) || list('palette').find((x) => x.chosen);
  return p?.colors || null;
}

function swatches(colors, small, onClick) {
  return h('div', { class: ['swatches', small && 's'] }, colors.map((c) => h('div', { style: { background: c, color: textOn(c) }, title: `${colorName(c)} ${c}`, onclick: (e) => { e.stopPropagation(); (onClick || ((x) => copyText(x, `${colorName(x)} ${x} copied`)))(c); } }, small ? null : h('span', null, c))));
}

// ------------------------------------------------------------------ palettes
function savePalette(name, colors) {
  return create('palette', { name, colors }).then((p) => { toast('Palette saved'); if (!store.wedding.paletteId && isPlanner()) saveWedding({ paletteId: p.id }); return p; });
}
function palettesTab(editable) {
  const saved = list('palette');
  const sugg = suggestPalettes(ui.seeds);
  const our = saved.find((p) => p.id === store.wedding.paletteId);
  const pickers = h('div', { class: 'row wrap' }, ui.seeds.map((c, i) => h('label', { class: 'swatch-pick', style: { background: c }, title: 'Choose a colour' },
    h('input', { type: 'color', value: c, onchange: (e) => { ui.seeds[i] = e.target.value; rr(); } }))),
  ui.seeds.length < 3 && h('button', { class: 'btn icon', 'aria-label': 'Add colour', onclick: () => { ui.seeds.push('#9caf88'); rr(); } }, icon('plus')),
  ui.seeds.length > 1 && h('button', { class: 'btn plain s', onclick: () => { ui.seeds.pop(); rr(); } }, 'Remove last'),
  h('span', { class: 'small muted' }, ui.seeds.map(colorName).join(' + ')));
  const matching = (colors) => FLOWERS.filter((f) => f.kind !== 'greenery').map((f) => ({ f, ...flowerPaletteFit(f, colors) })).sort((a, b) => a.dist - b.dist).slice(0, 8);

  return h('div', null,
    our ? h('div', { class: 'card mb' },
      h('div', { class: 'card-title' }, icon('heart'), `Our palette: ${our.name}`),
      h('div', { class: 'mt' }, swatches(our.colors)),
      h('div', { class: 'small muted mt' }, 'Flowers in these colours: ', matching(our.colors).map((m) => `${m.f.name} (${colorName(m.color).toLowerCase()})`).join(', '))) : null,
    h('div', { class: 'section-h' }, 'Start from your colours'),
    h('div', { class: 'card' }, h('div', { class: 'small muted mb' }, 'Pick one to three colours you love and get palettes built around them.'), pickers,
      h('div', { class: 'grid auto mt' }, sugg.map((p) => h('div', { class: 'col gap-s' }, swatches(p.colors, false),
        h('div', { class: 'row between' }, h('span', { class: 'small' }, p.name), editable && h('button', { class: 'btn s plain', onclick: () => savePalette(p.name, p.colors) }, 'Save')))))),
    h('div', { class: 'section-h' }, 'Ready-made palettes', h('span', { class: 'more' }, select([{ value: '', label: 'Any season' }, 'Spring', 'Summer', 'Autumn', 'Winter'], ui.season, (v) => { ui.season = v; rr(); }, { class: 'input s', style: { width: 'auto' } }))),
    h('div', { class: 'grid auto' }, PALETTES.filter((p) => !ui.season || p.season === ui.season || p.season === 'Any').map((p) => h('div', { class: 'card', style: { padding: '12px' } }, swatches(p.colors),
      h('div', { class: 'row between mt', style: { marginTop: '8px' } }, h('div', null, h('b', { class: 'small' }, p.name), h('div', { class: 'xs muted' }, p.season)),
        editable && h('button', { class: 'btn s tinted', onclick: () => savePalette(p.name, p.colors) }, 'Save'))))),
    h('div', { class: 'section-h' }, `Saved palettes (${saved.length})`),
    saved.length ? h('div', { class: 'grid auto' }, saved.map((p) => h('div', { class: 'card', style: { padding: '12px', outline: p.id === store.wedding.paletteId ? '2px solid var(--accent)' : 'none' } }, swatches(p.colors),
      h('div', { class: 'row mt', style: { marginTop: '8px' } }, h('b', { class: 'small grow' }, p.name), p.id === store.wedding.paletteId ? h('span', { class: 'chip accent' }, 'Ours') : null,
        editable && h('button', { class: 'btn plain icon s', 'aria-label': 'Palette options', onclick: (e) => menu(e.currentTarget, [
          isPlanner() && p.id !== store.wedding.paletteId && { label: 'Make this our palette', icon: 'heart', onClick: () => saveWedding({ paletteId: p.id }) },
          isPlanner() && { label: 'Use first colour as app accent', icon: 'style', onClick: () => import('../app.js').then((m) => saveWedding({ accent: p.colors.find((c) => colorDistance(c, '#ffffff') > 30) || p.colors[2] }).then(() => m.applyAccent(store.wedding.accent))) },
          { label: 'Build a bouquet from it', icon: 'flower', onClick: () => { ui.tab = 'bouquets'; ui.b = null; ui.bPalette = p.colors; ui.bOptions = null; rr(); } },
          { label: 'Rename', icon: 'edit', onClick: async () => { const n = await promptBox({ title: 'Rename palette', value: p.name }); if (n) patch('palette', p.id, { name: n }); } },
          { label: 'Delete', icon: 'trash', danger: true, onClick: () => remove('palette', p.id, { label: p.name }) }]) }, icon('more'))))))
      : h('div', { class: 'card small muted' }, 'Save palettes you like to compare them and use them for bouquets and invitations.'));
}

// ------------------------------------------------------------------ flowers
export function flowerSheet(f, color) {
  let c = color || f.colors[0];
  const art = html(flowerSvg(f, c), 'flower-art', { height: '220px', display: 'grid', placeItems: 'center' });
  art.querySelector('svg').style.height = '100%';
  const m = weddingMonth();
  sheet({
    title: f.name, size: 'wide',
    body: h('div', { class: 'grid c2' },
      h('div', { class: 'col' }, h('div', { class: 'bouquet-art', style: { padding: '20px' } }, art),
        h('div', { class: 'row wrap' }, f.colors.map((x) => h('button', { class: ['color-dot', x === c && 'on'], style: { background: x, width: '26px', height: '26px' }, title: colorName(x), 'aria-label': colorName(x), onclick: (e) => {
          c = x; art.innerHTML = flowerSvg(f, c); art.querySelector('svg').style.height = '100%';
          e.currentTarget.parentElement.querySelectorAll('.color-dot').forEach((d) => d.classList.remove('on')); e.currentTarget.classList.add('on');
        } })))),
      h('div', { class: 'col' },
        h('div', null, h('div', { class: 'serif', style: { fontSize: '26px' } }, f.name), h('div', { class: 'muted' }, f.greek)),
        h('div', { class: 'row wrap' }, h('span', { class: 'chip accent' }, KIND_LABEL[f.kind]), h('span', { class: 'chip' }, '€'.repeat(f.price)), m ? h('span', { class: ['chip', f.months.includes(m) ? 'green' : 'orange'] }, f.months.includes(m) ? 'In season for your date' : 'Out of season for your date') : null),
        h('div', null, h('div', { class: 'label' }, 'Meaning'), h('p', { class: 'serif', style: { fontSize: '18px', lineHeight: 1.4, marginTop: '4px' } }, f.meaning)),
        h('div', null, h('div', { class: 'label', style: { marginBottom: '6px' } }, 'Season'), h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: '2px' } }, MONTHS.map((mn, i) => h('div', {
          class: 'xs center', style: { padding: '5px 0', borderRadius: '4px', background: f.months.includes(i + 1) ? 'rgba(var(--accent-rgb),.18)' : 'var(--fill-3)', color: f.months.includes(i + 1) ? 'var(--accent)' : 'var(--label-3)', fontWeight: i + 1 === m ? 700 : 400, outline: i + 1 === m ? '1.5px solid var(--accent)' : 'none' },
        }, mn[0])))),
        f.note ? h('div', { class: 'small muted' }, f.note) : null,
        h('div', { class: 'small muted' }, `Available in: ${f.colors.map(colorName).join(', ').toLowerCase()}.`))),
  });
}

function flowersTab() {
  const m = weddingMonth();
  const pal = ourPalette();
  const q = ui.fQ.toLowerCase();
  let fs = FLOWERS.filter((f) => (!ui.fKind || f.kind === ui.fKind || (ui.fKind === 'filler' && f.kind === 'line')) && (!ui.fInSeason || !m || f.months.includes(m))
    && (!q || `${f.name} ${f.greek} ${f.meaning}`.toLowerCase().includes(q)));
  const fit = pal ? Object.fromEntries(FLOWERS.map((f) => [f.id, flowerPaletteFit(f, pal)])) : null;
  if (ui.fMatch && fit) fs = fs.filter((f) => f.kind === 'greenery' || fit[f.id].dist < 22).sort((a, b) => fit[a.id].dist - fit[b.id].dist);
  return h('div', null,
    h('div', { class: 'toolbar' },
      h('div', { class: 'search' }, icon('search'), input({ placeholder: 'Search flowers or meanings…', value: ui.fQ, 'data-k': 'f-q', oninput: (e) => { ui.fQ = e.target.value; rr(); } })),
      select([{ value: '', label: 'All types' }, { value: 'focal', label: 'Focal flowers' }, { value: 'secondary', label: 'Secondary' }, { value: 'filler', label: 'Fillers & spikes' }, { value: 'greenery', label: 'Greenery' }], ui.fKind, (v) => { ui.fKind = v; rr(); }, { class: 'input s', style: { width: 'auto' } }),
      m ? h('label', { class: 'row small muted' }, `In season in ${MONTHS[m - 1]}`, toggle(ui.fInSeason, (v) => { ui.fInSeason = v; rr(); })) : null,
      pal ? h('label', { class: 'row small muted' }, 'Matches our palette', toggle(ui.fMatch, (v) => { ui.fMatch = v; rr(); })) : null),
    h('div', { class: 'grid auto-s' }, fs.map((f) => {
      const c = fit && f.kind !== 'greenery' ? fit[f.id].color : f.colors[0];
      const art = html(flowerSvg(f, c), 'art');
      return h('div', { class: 'card flower-card', onclick: () => flowerSheet(f, c) }, art,
        h('div', null, h('div', { class: 'nm' }, f.name), h('div', { class: 'gr' }, f.greek)),
        h('div', { class: 'xs muted', style: { lineHeight: 1.35 } }, f.meaning.split('.')[0]),
        h('div', { class: 'row', style: { gap: '3px', marginTop: 'auto' } }, f.colors.slice(0, 8).map((x) => h('span', { class: 'color-dot', style: { background: x, width: '12px', height: '12px' } }))));
    })),
    !fs.length ? h('div', { class: 'card center muted' }, 'No flowers match these filters.') : null);
}

// ------------------------------------------------------------------ bouquets
function bouquetEditor(editable) {
  const b = ui.b;
  const pal = ui.bPalette || ourPalette() || PALETTES[0].colors;
  const artBox = html(bouquetSvg(b), 'bouquet-art', { padding: '10px', minHeight: '360px' });
  const redraw = () => { artBox.innerHTML = bouquetSvg(b); };
  const meanings = bouquetMeaning(b.items);
  return h('div', { class: 'grid c2', style: { gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' } },
    h('div', { class: 'col' }, artBox,
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn', onclick: () => { b.seed = Math.floor(Math.random() * 1e6); redraw(); } }, icon('shuffle'), 'Rearrange'),
        h('button', { class: 'btn', onclick: () => printBouquet(b) }, icon('print'), 'Print for the florist'))),
    h('div', { class: 'col' },
      field('Name', input({ value: b.name || '', placeholder: 'e.g. Bridal bouquet', oninput: (e) => { b.name = e.target.value; } })),
      h('div', { class: 'form-row' },
        field('Style', select(BOUQUET_STYLES, b.style, (v) => { b.style = v; redraw(); })),
        field('For', select(BOUQUET_SIZES, b.size, (v) => { b.size = v; redraw(); }))),
      field('Flowers', h('div', { class: 'list' }, b.items.map((it, i) => {
        const f = flowerById(it.id);
        return h('div', { class: 'list-item', style: { padding: '6px 10px', minHeight: '40px' } },
          h('span', { class: 'grow small' }, h('b', null, f?.name), h('span', { class: 'muted' }, ` · ${it.role}`)),
          h('div', { class: 'row', style: { gap: '3px' } }, (f?.colors || []).slice(0, 9).map((c) => h('button', { class: ['color-dot', c === it.color && 'on'], style: { background: c, width: '16px', height: '16px' }, 'aria-label': colorName(c), onclick: () => { it.color = c; rr(); } }))),
          h('button', { class: 'btn plain icon s', 'aria-label': 'Remove flower', onclick: () => { b.items.splice(i, 1); rr(); } }, icon('x')));
      }), h('div', { class: 'list-item', style: { padding: '6px 10px' } }, select([{ value: '', label: '+ Add a flower…' }, ...FLOWERS.map((f) => ({ value: f.id, label: `${f.name} (${KIND_LABEL[f.kind].toLowerCase()})` }))], '', (v) => {
        if (!v) return; const f = flowerById(v);
        b.items.push({ id: v, color: f.kind === 'greenery' ? f.colors[0] : flowerPaletteFit(f, pal).color, role: f.kind === 'focal' ? 'focal' : f.kind === 'greenery' ? 'greenery' : f.kind === 'secondary' ? 'secondary' : 'filler' });
        rr();
      }, { class: 'input s' })))),
      field('Ribbon', h('div', { class: 'row wrap' }, [...new Set([...pal, '#ffffff', '#f3ead6', '#d4af37'])].map((c) => h('button', { class: ['color-dot', c === b.ribbon && 'on'], style: { background: c, width: '24px', height: '24px' }, 'aria-label': colorName(c), onclick: () => { b.ribbon = c; rr(); } })))),
      meanings.length ? h('div', { class: 'card', style: { background: 'var(--fill-3)', boxShadow: 'none' } }, h('div', { class: 'label' }, 'What this bouquet says'),
        h('div', { class: 'col gap-s mt small' }, meanings.map((m) => h('div', null, h('b', null, m.name), ` — ${m.meaning.toLowerCase()}.`)))) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => { ui.b = null; rr(); } }, b.id ? 'Close' : 'Back to ideas'),
        h('span', { class: 'grow' }),
        editable && b.id && h('button', { class: 'btn danger', onclick: async () => { await remove('bouquet', b.id, { label: b.name || 'Bouquet' }); ui.b = null; } }, icon('trash')),
        editable && h('button', { class: 'btn primary', onclick: async () => {
          const data = { name: b.name || BOUQUET_SIZES.find((s) => s.value === b.size)?.label, style: b.style, size: b.size, items: b.items, ribbon: b.ribbon, seed: b.seed };
          if (b.id) await patch('bouquet', b.id, data); else { const r = await create('bouquet', data); b.id = r.id; }
          toast('Bouquet saved');
        } }, b.id ? 'Save changes' : 'Save bouquet'))));
}

function printBouquet(b) {
  const rows = b.items.map((it) => { const f = flowerById(it.id); return `<tr><td>${esc(f?.name)}</td><td>${esc(f?.greek)}</td><td>${esc(colorName(it.color))} <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${it.color};vertical-align:middle"></span></td><td>${esc(it.role)}</td></tr>`; }).join('');
  printHtml(b.name || 'Bouquet', `<h1>${esc(b.name || 'Bouquet')}</h1><div class="muted">${esc(coupleNames())} · ${esc(BOUQUET_STYLES.find((s) => s.value === b.style)?.label)} · ${esc(BOUQUET_SIZES.find((s) => s.value === b.size)?.label)}</div>
    <div style="display:flex;gap:24px;align-items:flex-start;margin-top:16px"><div style="width:300px">${bouquetSvg(b)}</div><div style="flex:1"><table><tr><th>Flower</th><th>Ελληνικά</th><th>Colour</th><th>Role</th></tr>${rows}</table>
    <p class="muted" style="margin-top:12px">Ribbon: ${esc(colorName(b.ribbon || '#fff'))} (${esc(b.ribbon || '')})</p></div></div>`);
}

function bouquetsTab(editable) {
  if (ui.b) return bouquetEditor(editable);
  const saved = list('bouquet');
  const pal = ui.bPalette || ourPalette() || PALETTES[0].colors;
  const st = ui.bSettings || (ui.bSettings = { style: 'round', size: 'bridal', month: weddingMonth() || 6, greek: store.wedding.tradition === 'greek' });
  const allPalettes = [...list('palette').map((p) => ({ name: p.name, colors: p.colors })), ...PALETTES];
  return h('div', null,
    h('div', { class: 'card' },
      h('div', { class: 'card-title' }, icon('wand'), 'Bouquet maker'),
      h('div', { class: 'card-sub' }, 'Choose colours, a style and the month — WedPlan picks flowers that match, are in season, and work together.'),
      h('div', { class: 'form-row mt' },
        field('Colours', select(allPalettes.map((p, i) => ({ value: i, label: p.name })), Math.max(0, allPalettes.findIndex((p) => p.colors.join() === pal.join())), (v) => { ui.bPalette = allPalettes[v].colors; ui.bOptions = null; rr(); })),
        field('Style', select(BOUQUET_STYLES, st.style, (v) => { st.style = v; ui.bOptions = null; rr(); })),
        field('For', select(BOUQUET_SIZES, st.size, (v) => { st.size = v; ui.bOptions = null; rr(); })),
        field('Month', select(MONTHS.map((m, i) => ({ value: i + 1, label: m })), st.month, (v) => { st.month = Number(v); ui.bOptions = null; rr(); }))),
      h('div', { class: 'row wrap mt' }, swatches(pal, true), h('label', { class: 'row small muted' }, 'Greek touches (olive, myrtle, jasmine)', toggle(st.greek, (v) => { st.greek = v; ui.bOptions = null; rr(); })),
        h('span', { class: 'grow' }),
        h('button', { class: 'btn primary', onclick: () => { ui.bOptions = suggestBouquets({ palette: pal, month: st.month, style: st.style, size: st.size, greek: st.greek, count: 3, seed: Math.floor(Math.random() * 1e5) }); rr(); } }, icon('sparkle'), ui.bOptions ? 'More ideas' : 'Suggest bouquets'))),
    ui.bOptions ? h('div', { class: 'grid c3 mt' }, ui.bOptions.map((o) => h('div', { class: 'card', style: { cursor: 'pointer' }, onclick: () => { ui.b = structuredClone(o); rr(); } },
      html(bouquetSvg(o), 'bouquet-art', { padding: '6px' }),
      h('div', { class: 'small mt' }, o.items.map((i) => flowerById(i.id)?.name).join(' · ')),
      h('div', { class: 'row mt' }, h('span', { class: 'xs muted grow' }, 'Tap to customise'), h('span', { class: 'color-dot', style: { background: o.ribbon }, title: 'Ribbon' }))))) : null,
    h('div', { class: 'section-h' }, `Saved bouquets & arrangements (${saved.length})`),
    saved.length ? h('div', { class: 'grid auto' }, saved.map((b) => h('div', { class: 'card', style: { cursor: 'pointer' }, onclick: () => { ui.b = structuredClone(b); rr(); } },
      html(bouquetSvg(b), 'bouquet-art', { padding: '6px', height: '240px' }),
      h('b', { class: 'mt', style: { display: 'block', marginTop: '8px' } }, b.name || 'Bouquet'),
      h('div', { class: 'xs muted' }, `${BOUQUET_SIZES.find((s) => s.value === b.size)?.label} · ${b.items.map((i) => flowerById(i.id)?.name).join(', ')}`))))
      : h('div', { class: 'card small muted' }, 'Bouquets you save appear here, ready to show your florist.'),
    h('div', { class: 'row mt' }, editable && h('button', { class: 'btn', onclick: () => { ui.b = { name: '', style: st.style, size: st.size, items: [], ribbon: pal[1] || '#ffffff', seed: 1 }; rr(); } }, icon('plus'), 'Build one from scratch')));
}

// ------------------------------------------------------------------ bomboniere
function favorDefaults() {
  const w = store.wedding;
  const d = w.date ? new Date(`${w.date}T12:00`) : null;
  return {
    name: '', container: 'tulle', material: '#ffffff', ribbon: (ourPalette() || [])[2] || '#c9a9a6', count: 5, koufeta: ['#fbfaf6'],
    deco: w.tradition === 'greek' ? 'olive' : 'flower', decoFlower: 'gypsophila', tagText1: [w.partner1, w.partner2].filter(Boolean).join(' & ') || 'Maria & Nikos',
    tagText2: d ? `${String(d.getDate()).padStart(2, '0')} · ${String(d.getMonth() + 1).padStart(2, '0')} · ${d.getFullYear()}` : '', font: '"Great Vibes", cursive', tagShape: 'round',
    initials: `${(w.partner1 || 'M')[0]}${(w.partner2 || 'N')[0]}`, spare: 10, price: null,
  };
}
function favorsTab(editable) {
  loadFonts();
  const f = ui.fav || (ui.fav = favorDefaults());
  const cont = CONTAINERS.find((c) => c.value === f.container);
  const guests = list('guest').filter((g) => g.rsvp !== 'no').length;
  const qty = Math.ceil(guests * (1 + (Number(f.spare) || 0) / 100));
  const price = f.price ?? (cont.price[0] + cont.price[1]) / 2;
  const preview = html(favorSvg(f), 'bouquet-art', { padding: '10px', height: '380px' });
  preview.querySelector('svg').style.height = '100%';
  const redraw = () => { preview.innerHTML = favorSvg(f); preview.querySelector('svg').style.height = '100%'; };
  const colorRow = (vals, cur, on, size = 24) => h('div', { class: 'row wrap', style: { gap: '6px' } }, vals.map((c) => h('button', { class: ['color-dot', c === cur && 'on'], style: { background: c, width: `${size}px`, height: `${size}px` }, title: colorName(c), 'aria-label': colorName(c), onclick: () => on(c) })),
    h('label', { class: 'swatch-pick', style: { width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', borderWidth: '2px' }, title: 'Custom colour' }, h('input', { type: 'color', value: cur, onchange: (e) => on(e.target.value) })));
  const saved = list('favor');

  return h('div', null,
    h('div', { class: 'grid c2', style: { gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)' } },
      h('div', { class: 'col' }, preview,
        h('div', { class: 'card small', style: { background: 'var(--fill-3)', boxShadow: 'none' } }, h('b', null, 'Κουφέτα '), KOUFETA_INFO),
        h('div', { class: 'card' },
          h('div', { class: 'card-title' }, 'Quantity & cost'),
          h('div', { class: 'form-row mt' },
            field('Spare (%)', input({ type: 'number', min: 0, max: 50, value: f.spare, onchange: (e) => { f.spare = Number(e.target.value); rr(); } })),
            field('Price per piece', input({ type: 'number', min: 0, step: 0.1, value: price, onchange: (e) => { f.price = Number(e.target.value); rr(); } }), `Typical: ${money(cont.price[0], currency())}–${money(cont.price[1], currency())}`)),
          h('div', { class: 'row wrap mt' },
            h('div', { class: 'stat grow' }, h('div', { class: 'v' }, qty), h('div', { class: 'l' }, `pieces for ${guests} guests + ${f.spare}% spare`)),
            h('div', { class: 'stat grow' }, h('div', { class: 'v' }, money(qty * price, currency())), h('div', { class: 'l' }, `≈ ${(qty * f.count).toLocaleString()} koufeta (${Math.ceil((qty * f.count * 4.2) / 1000)} kg)`))),
          can('budget', 'edit') && h('button', { class: 'btn tinted mt', onclick: async () => {
            const cat = list('budget_cat').find((c) => /favou?r|bombon|gift/i.test(c.name)) || list('budget_cat')[0];
            if (!cat) return toast('Add budget categories first', { error: true });
            await create('expense', { name: `Bomboniere (${qty} × ${cont.label.toLowerCase()})`, cat: cat.id, estimate: Math.round(qty * price), notes: `${f.count} koufeta each` });
            toast(`Added to the budget under ${cat.name}`);
          } }, icon('euro'), 'Add to budget'))),
      h('div', { class: 'col' },
        field('Container', h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: '8px' } }, CONTAINERS.map((c) => {
          const mini = html(favorSvg({ ...f, container: c.value, tagText1: '', tagText2: '' }), null, { height: '74px' });
          mini.querySelector('svg').style.height = '100%';
          return h('button', { class: 'card', style: { padding: '6px', cursor: 'pointer', border: c.value === f.container ? '2px solid var(--accent)' : '2px solid transparent', textAlign: 'center' }, onclick: () => { f.container = c.value; f.price = null; rr(); } },
            mini, h('div', { class: 'xs', style: { marginTop: '2px' } }, c.label));
        })), cont.note),
        h('div', { class: 'form-row' },
          field(['pouch', 'organza'].includes(f.container) ? 'Fabric' : f.container === 'tulle' ? 'Tulle' : f.container === 'honey' ? 'Lid cloth' : 'Colour', colorRow(MATERIALS, f.material, (c) => { f.material = c; rr(); })),
          field('Ribbon', colorRow([...new Set([...(ourPalette() || []), '#c9a9a6', '#9caf88', '#2a6f97', '#d4af37', '#ffffff'])].slice(0, 9), f.ribbon, (c) => { f.ribbon = c; rr(); }))),
        field('Koufeta', h('div', { class: 'col gap-s' },
          seg([3, 5, 7, 9].map((n) => ({ value: n, label: `${n}` })), f.count, (v) => { f.count = v; rr(); }),
          h('div', { class: 'row wrap', style: { gap: '6px' } }, KOUFETA.map((k) => h('button', { class: ['chip', f.koufeta.includes(k.value) && 'on'], onclick: () => {
            f.koufeta = f.koufeta.includes(k.value) ? f.koufeta.filter((x) => x !== k.value) : [...f.koufeta, k.value].slice(-2);
            if (!f.koufeta.length) f.koufeta = [k.value];
            rr();
          } }, h('span', { class: 'color-dot', style: { background: k.value, width: '12px', height: '12px' } }), k.label)))), 'Pick up to two colours.'),
        h('div', { class: 'form-row' },
          field('Decoration', select(DECOS, f.deco, (v) => { f.deco = v; rr(); })),
          f.deco === 'flower' ? field('Flower', select(FLOWERS.filter((x) => ['filler', 'line', 'secondary'].includes(x.kind)).map((x) => ({ value: x.id, label: x.name })), f.decoFlower, (v) => { f.decoFlower = v; f.decoColor = null; rr(); })) : null),
        h('div', { class: 'form-row' },
          field('Tag line 1', input({ value: f.tagText1, oninput: (e) => { f.tagText1 = e.target.value; redraw(); } })),
          field('Tag line 2', input({ value: f.tagText2, oninput: (e) => { f.tagText2 = e.target.value; redraw(); } }))),
        h('div', { class: 'form-row' },
          field('Font', select(FONTS.filter((x) => x.name !== 'System').map((x) => ({ value: x.css, label: x.name })), f.font, (v) => { f.font = v; redraw(); })),
          !['pouch', 'bottle', 'candle', 'crate', 'tin', 'soap', 'honey', 'seeds'].includes(f.container) ? field('Tag shape', seg([{ value: 'round', label: 'Round' }, { value: 'rect', label: 'Card' }, { value: 'label', label: 'Label' }], f.tagShape, (v) => { f.tagShape = v; rr(); })) : null),
        f.deco === 'seal' ? field('Initials on the seal', input({ value: f.initials, maxlength: 3, oninput: (e) => { f.initials = e.target.value; redraw(); } })) : null,
        field('Notes for the maker', h('textarea', { class: 'input', rows: 2, oninput: (e) => { f.notes = e.target.value; } }, f.notes || '')),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => printFavor(f, qty, price) }, icon('print'), 'Print order sheet'),
          f.id && h('button', { class: 'btn', onclick: () => { ui.fav = favorDefaults(); rr(); } }, 'New design'),
          h('span', { class: 'grow' }),
          editable && f.id && h('button', { class: 'btn danger icon', 'aria-label': 'Delete design', onclick: async () => { await remove('favor', f.id, { label: f.name || 'Design' }); ui.fav = favorDefaults(); } }, icon('trash')),
          editable && h('button', { class: 'btn primary', onclick: async () => {
            const { id, type, _sort, _updated, _by, ...data } = f;
            if (!data.name) data.name = (await promptBox({ title: 'Name this design', value: `${cont.label} with ${f.count} koufeta` })) || cont.label;
            f.name = data.name;
            if (f.id) await patch('favor', f.id, data); else { const r = await create('favor', data); f.id = r.id; }
            toast('Bomboniera saved');
          } }, f.id ? 'Save changes' : 'Save design')))),
    h('div', { class: 'section-h' }, `Saved designs (${saved.length})`),
    saved.length ? h('div', { class: 'grid auto-s' }, saved.map((s) => {
      const art = html(favorSvg(s), 'bouquet-art', { height: '170px', padding: '6px' });
      art.querySelector('svg').style.height = '100%';
      return h('div', { class: 'card', style: { cursor: 'pointer', padding: '10px', outline: s.id === f.id ? '2px solid var(--accent)' : 'none' }, onclick: () => { ui.fav = structuredClone(s); rr(); } }, art,
        h('div', { class: 'row', style: { marginTop: '6px' } }, h('b', { class: 'small grow ellipsis' }, s.name), s.chosen ? h('span', { class: 'chip green' }, 'Chosen') : null),
        editable && h('button', { class: 'btn s plain', onclick: (e) => { e.stopPropagation(); list('favor').forEach((x) => { if (x.chosen && x.id !== s.id) patch('favor', x.id, { chosen: false }); }); patch('favor', s.id, { chosen: !s.chosen }); } }, s.chosen ? 'Unmark' : 'Mark as our choice'));
    })) : h('div', { class: 'card small muted' }, 'Save a few designs to compare them with the couple.'));
}

function printFavor(f, qty, price) {
  const cont = CONTAINERS.find((c) => c.value === f.container);
  const kNames = f.koufeta.map((k) => KOUFETA.find((x) => x.value === k)?.label || k).join(' & ');
  printHtml('Bomboniere order', `<h1>Μπομπονιέρες · Bomboniere</h1><div class="muted">${esc(coupleNames())}${store.wedding.date ? ` · ${esc(store.wedding.date)}` : ''}</div>
  <div style="display:flex;gap:24px;margin-top:16px;align-items:flex-start"><div style="width:280px">${favorSvg(f)}</div><table style="flex:1">
  <tr><th>Item</th><td>${esc(cont.label)} (${esc(cont.greek)})</td></tr><tr><th>Colour</th><td>${esc(colorName(f.material))}</td></tr><tr><th>Ribbon</th><td>${esc(colorName(f.ribbon))} ${esc(f.ribbon)}</td></tr>
  <tr><th>Koufeta</th><td>${f.count} per piece · ${esc(kNames)}</td></tr><tr><th>Decoration</th><td>${esc(DECOS.find((d) => d.value === f.deco)?.label || '')}${f.deco === 'flower' ? ` (${esc(flowerById(f.decoFlower)?.name || '')})` : ''}</td></tr>
  <tr><th>Tag text</th><td>${esc(f.tagText1)}<br>${esc(f.tagText2)}</td></tr><tr><th>Quantity</th><td><b>${qty}</b></td></tr><tr><th>Price per piece</th><td>${money(price, currency())} · total ${money(qty * price, currency())}</td></tr>
  ${f.notes ? `<tr><th>Notes</th><td>${esc(f.notes)}</td></tr>` : ''}</table></div>`);
}

export default {
  title: 'Colours & flowers',
  render() {
    const editable = can('style', 'edit');
    const tabs = [{ value: 'palettes', label: 'Colour palettes' }, { value: 'flowers', label: 'Flowers' }, { value: 'bouquets', label: 'Bouquets' }, { value: 'favors', label: 'Bomboniere' }];
    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Colours & flowers'), h('div', { class: 'sub' }, `${plural(list('palette').length, 'palette')} · ${plural(list('bouquet').length, 'bouquet')} · ${plural(list('favor').length, 'bomboniera', 'bomboniere')} saved`)),
        h('div', { class: 'actions' }, seg(tabs, ui.tab, (v) => { ui.tab = v; rr(); }))),
      ui.tab === 'palettes' ? palettesTab(editable) : ui.tab === 'flowers' ? flowersTab() : ui.tab === 'bouquets' ? bouquetsTab(editable) : favorsTab(editable));
  },
};
function rr() { import('../lib/store.js').then((m) => m.emit()); }
