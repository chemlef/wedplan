import { h, icon, sheet, menu, toast, field, input, select, seg, toggle, confirmBox, promptBox, pickFile, imageToDataUrl, emptyState, plural, copyText, printHtml, loadFonts, FONTS, FONT_URL, debounce, clamp, timeAgo } from '../lib/ui.js';
import { store, list, get, can, create, patch, remove, guestName, rsvpLink, isPlanner, saveWedding, coupleNames } from '../lib/store.js';
import { SIZES, KINDS, PLACEHOLDERS, ORNAMENTS, weddingVars, templates, artboard, elementNode, styleFor, backgroundStyle, fill } from '../lib/design.js';
import { FLOWERS, flowerById } from '../lib/flowers.js';
import { emailSheet, rsvpChip } from './guests.js';
import { ourPalette } from './style.js';

const ed = { id: null, doc: null, sel: null, undo: [], redo: [], tab: 'design', scale: 1, editingText: false };
let container;
let stageEl; let boardEl; let propsEl; let saveState;
const uid = () => Math.random().toString(36).slice(2, 9);
const vars = () => weddingVars(store.wedding, null);
const editable = () => can('invitations', 'edit');

function current() { return ed.doc; }
function selEl() { return ed.doc?.elements.find((e) => e.id === ed.sel); }

// ------------------------------------------------------------------ persistence
const persist = debounce(async () => {
  if (!ed.id || !ed.doc) return;
  saveState && (saveState.textContent = 'Saving…');
  try {
    await patch('design', ed.id, { canvas: ed.doc.canvas, background: ed.doc.background, elements: ed.doc.elements });
    saveState && (saveState.textContent = 'Saved');
  } catch { saveState && (saveState.textContent = 'Not saved'); }
}, 900);
function snapshot() { ed.undo.push(JSON.stringify({ canvas: ed.doc.canvas, background: ed.doc.background, elements: ed.doc.elements })); if (ed.undo.length > 60) ed.undo.shift(); ed.redo = []; }
function changed({ board = true, props = false } = {}) {
  if (board) drawBoard();
  if (props) drawProps();
  saveState && (saveState.textContent = 'Editing…');
  persist();
}
function undo() { if (!ed.undo.length) return; ed.redo.push(JSON.stringify({ canvas: ed.doc.canvas, background: ed.doc.background, elements: ed.doc.elements })); Object.assign(ed.doc, JSON.parse(ed.undo.pop())); changed({ props: true }); }
function redoFn() { if (!ed.redo.length) return; ed.undo.push(JSON.stringify({ canvas: ed.doc.canvas, background: ed.doc.background, elements: ed.doc.elements })); Object.assign(ed.doc, JSON.parse(ed.redo.pop())); changed({ props: true }); }

function open(d) {
  ed.id = d.id; ed.doc = structuredClone({ canvas: d.canvas || { w: 500, h: 700 }, background: d.background || { color: '#ffffff' }, elements: d.elements || [] });
  ed.sel = null; ed.undo = []; ed.redo = [];
}

// ------------------------------------------------------------------ artboard
function fitScale() {
  const c = ed.doc.canvas;
  const avail = Math.max(260, (stageEl?.clientWidth || 600) - 40);
  const availH = Math.max(420, window.innerHeight - 200);
  return Math.min(1.2, avail / c.w, availH / c.h);
}

function drawBoard() {
  if (!stageEl || !ed.doc) return;
  const c = ed.doc.canvas;
  ed.scale = fitScale();
  const wrap = h('div', { style: { width: `${c.w * ed.scale}px`, height: `${c.h * ed.scale}px`, position: 'relative', flexShrink: 0, boxShadow: 'var(--shadow-3)' } });
  boardEl = artboard(ed.doc, vars(), ed.scale);
  boardEl.addEventListener('pointerdown', (e) => { if (e.target === boardEl || e.target.parentElement === boardEl && !e.target.dataset.id) { ed.sel = null; drawBoard(); drawProps(); } });
  if (editable()) {
    boardEl.querySelectorAll('.el').forEach((n) => wireElement(n));
    const s = selEl();
    if (s) {
      const n = boardEl.querySelector(`[data-id="${s.id}"]`);
      if (n) {
        n.classList.add('sel');
        n.append(h('div', { class: 'h se', dataset: { h: 'se' } }), h('div', { class: 'h e', dataset: { h: 'e' } }), h('div', { class: 'h r', dataset: { h: 'r' } }));
      }
    }
  }
  wrap.append(boardEl);
  stageEl.replaceChildren(wrap);
}

function wireElement(n) {
  const el = ed.doc.elements.find((x) => x.id === n.dataset.id);
  if (!el) return;
  if (el.type === 'line') n.style.paddingTop = '0';
  n.addEventListener('dblclick', () => { if (el.type === 'text') startTextEdit(n, el); });
  n.addEventListener('pointerdown', (e) => {
    if (ed.editingText && n.isContentEditable) return;
    e.stopPropagation(); e.preventDefault();
    const handle = e.target.dataset?.h;
    if (ed.sel !== el.id) { ed.sel = el.id; drawBoard(); drawProps(); }
    const node = boardEl.querySelector(`[data-id="${el.id}"]`);
    const sx = e.clientX; const sy = e.clientY;
    const o = { x: el.x, y: el.y, w: el.w, h: el.h, rot: el.rot || 0, size: el.size };
    let moved = false; let snapped = false;
    const guide = h('div', { style: { position: 'absolute', background: '#ff2d92', pointerEvents: 'none', display: 'none' } });
    boardEl.append(guide);
    const r0 = node.getBoundingClientRect();
    const cx0 = r0.left + r0.width / 2; const cy0 = r0.top + r0.height / 2;
    const mv = (ev) => {
      const dx = (ev.clientX - sx) / ed.scale; const dy = (ev.clientY - sy) / ed.scale;
      if (!moved && Math.hypot(dx, dy) < 2) return;
      if (!moved) { snapshot(); moved = true; }
      if (handle === 'r') {
        const a = (Math.atan2(ev.clientY - cy0, ev.clientX - cx0) * 180) / Math.PI + 90;
        el.rot = Math.round(ev.shiftKey ? a : Math.round(a / 5) * 5) % 360;
        if (Math.abs(el.rot) < 3) el.rot = 0;
      } else if (handle === 'se') {
        const ratio = o.h / o.w;
        el.w = Math.max(10, Math.round(o.w + dx));
        el.h = el.type === 'text' ? o.h : (el.type === 'flower' || el.type === 'ornament' || ev.shiftKey) ? Math.round(el.w * ratio) : Math.max(4, Math.round(o.h + dy));
        if (el.type === 'text' && o.size) el.size = Math.max(6, Math.round(o.size * (el.w / o.w)));
      } else if (handle === 'e') {
        el.w = Math.max(10, Math.round(o.w + dx));
      } else {
        el.x = Math.round(o.x + dx); el.y = Math.round(o.y + dy);
        const W = ed.doc.canvas.w; const H = ed.doc.canvas.h;
        const ch = el.type === 'text' ? node.offsetHeight : el.h;
        snapped = false;
        if (Math.abs(el.x + el.w / 2 - W / 2) < 6) { el.x = Math.round(W / 2 - el.w / 2); Object.assign(guide.style, { display: 'block', left: `${W / 2}px`, top: 0, width: '1px', height: `${H}px` }); snapped = true; }
        else if (Math.abs(el.y + ch / 2 - H / 2) < 6) { el.y = Math.round(H / 2 - ch / 2); Object.assign(guide.style, { display: 'block', top: `${H / 2}px`, left: 0, height: '1px', width: `${W}px` }); snapped = true; }
        if (!snapped) guide.style.display = 'none';
      }
      Object.assign(node.style, styleFor(el));
    };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      guide.remove();
      if (moved) changed({ props: true });
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
}

function startTextEdit(n, el) {
  if (!editable()) return;
  ed.editingText = true;
  n.textContent = el.text;
  n.contentEditable = 'true';
  n.focus();
  document.getSelection().selectAllChildren(n);
  const done = () => {
    n.contentEditable = 'false'; ed.editingText = false;
    if (n.innerText !== el.text) { snapshot(); el.text = n.innerText.replace(/\n$/, ''); }
    changed({ props: true });
  };
  n.addEventListener('blur', done, { once: true });
  n.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); n.blur(); } });
}

// ------------------------------------------------------------------ adding things
function add(el) {
  snapshot();
  const c = ed.doc.canvas;
  const e = { id: uid(), rot: 0, opacity: 1, x: Math.round(c.w / 2 - (el.w || 200) / 2), y: Math.round(c.h / 2 - (el.h || 40) / 2), ...el };
  ed.doc.elements.push(e);
  ed.sel = e.id;
  changed({ props: true });
}
const accent = () => (ourPalette() || [])[3] || '#b08d57';
const TEXT_PRESETS = [
  { label: 'Names (script)', el: { type: 'text', text: '{partner1} & {partner2}', w: 420, h: 70, size: 54, font: '"Great Vibes", cursive', color: '#3a3a3a' } },
  { label: 'Heading', el: { type: 'text', text: 'Heading', w: 360, h: 40, size: 32, font: '"Cormorant Garamond", serif', color: '#2f2f2f' } },
  { label: 'Small caps', el: { type: 'text', text: 'TOGETHER WITH THEIR FAMILIES', w: 360, h: 20, size: 12, spacing: 0.25, font: '"Cormorant Garamond", serif', color: '#6b6b6b' } },
  { label: 'Body text', el: { type: 'text', text: 'Write your message here', w: 360, h: 50, size: 17, font: '"Cormorant Garamond", serif', color: '#555' } },
  { label: 'Date', el: { type: 'text', text: '{date_long}', w: 400, h: 26, size: 20, upper: true, spacing: 0.12, font: '"Cormorant Garamond", serif', color: '#2f2f2f' } },
  { label: 'Guest name', el: { type: 'text', text: 'Dear {guest}', w: 400, h: 36, size: 30, font: '"Great Vibes", cursive', color: '#3a3a3a' } },
];

async function addImage(target) {
  const f = await pickFile('image/*');
  if (!f) return;
  const src = await imageToDataUrl(f, 1400, 0.82);
  if (target === 'bg') { snapshot(); ed.doc.background.image = src; changed({ props: true }); return; }
  const img = new Image();
  img.onload = () => { const w = 260; add({ type: 'image', src, w, h: Math.round((w * img.height) / img.width), fit: 'cover' }); };
  img.src = src;
}

function flowerPicker() {
  const pal = ourPalette();
  const s = sheet({
    title: 'Add a flower', size: 'wide',
    body: h('div', null,
      list('bouquet').length ? [h('div', { class: 'section-h' }, 'Your bouquets'), h('div', { class: 'grid auto-s' }, list('bouquet').map((b) => {
        const d = h('div', { class: 'card', style: { cursor: 'pointer', padding: '8px' }, onclick: () => { s.close(); add({ type: 'flower', bouquet: { style: b.style, size: b.size, items: b.items, ribbon: b.ribbon, seed: b.seed }, w: 220, h: 275 }); } });
        import('../lib/flowers.js').then((m) => { d.innerHTML = m.bouquetSvg(b) + `<div class="small" style="text-align:center">${b.name || 'Bouquet'}</div>`; });
        return d;
      }))] : null,
      h('div', { class: 'section-h' }, 'Flowers'),
      h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))', gap: '8px' } }, FLOWERS.map((f) => {
        const col = pal && f.kind !== 'greenery' ? import('../lib/flowers.js').then((m) => m.flowerPaletteFit(f, pal).color) : Promise.resolve(f.colors[0]);
        const d = h('button', { class: 'card', style: { padding: '6px', cursor: 'pointer', textAlign: 'center' } });
        col.then((c) => {
          import('../lib/flowers.js').then((m) => { d.innerHTML = `<div style="height:70px">${m.flowerSvg(f, c, { height: 70 })}</div><div class="xs">${f.name}</div>`; });
          d.onclick = () => { s.close(); add({ type: 'flower', flower: f.id, color: c, w: 140, h: 140 }); };
        });
        return d;
      }))),
  });
}

// ------------------------------------------------------------------ properties panel
function propRow(label, control, block) { return h('div', { class: ['prop-row', block && 'block'] }, h('span', null, label), control); }
function num(val, on, props = {}) {
  return input({ class: 'input s', type: 'number', value: val ?? '', ...props, onfocus: () => snapshot(), oninput: (e) => on(e.target.value === '' ? null : Number(e.target.value)) });
}
function colorInput(val, on) {
  return h('div', { class: 'row', style: { gap: '6px' } },
    input({ type: 'color', class: 'input s', value: /^#[0-9a-f]{6}$/i.test(val || '') ? val : '#000000', style: { width: '40px', padding: '2px' }, onfocus: () => snapshot(), oninput: (e) => on(e.target.value) }),
    ...[...(ourPalette() || []), '#ffffff', '#1d1d1f', '#b08d57'].slice(0, 7).map((c) => h('button', { class: 'color-dot', style: { background: c }, title: c, 'aria-label': c, onclick: () => { snapshot(); on(c); drawProps(); } })));
}

function drawProps() {
  if (!propsEl || !ed.doc) return;
  const el = selEl();
  const set = (k, { board = true } = {}) => (v) => { el[k] = v; changed({ board }); };
  let body;
  if (!editable()) body = h('div', { class: 'small muted' }, 'You can view this design but not change it.');
  else if (!el) {
    const bg = ed.doc.background;
    const c = ed.doc.canvas;
    body = h('div', null,
      h('div', { class: 'card-title', style: { fontSize: '15px', marginBottom: '10px' } }, 'Card'),
      propRow('Size', select(SIZES.map((s) => ({ value: s.value, label: s.label })), SIZES.find((s) => s.w === c.w && s.h === c.h)?.value || '', (v) => {
        const s = SIZES.find((x) => x.value === v); if (!s) return; snapshot();
        const fx = s.w / c.w; const fy = s.h / c.h;
        ed.doc.elements.forEach((e) => { e.x = Math.round(e.x * fx); e.y = Math.round(e.y * fy); });
        ed.doc.canvas = { w: s.w, h: s.h }; changed({ props: true });
      }, { class: 'input s' })),
      propRow('Width × height', h('div', { class: 'row', style: { gap: '4px' } }, num(c.w, (v) => { if (v > 50) { c.w = v; changed(); } }), num(c.h, (v) => { if (v > 50) { c.h = v; changed(); } }))),
      propRow('Background', colorInput(bg.color || '#ffffff', (v) => { bg.color = v; changed(); })),
      propRow('Gradient', h('div', { class: 'row' }, toggle(!!bg.color2, (v) => { snapshot(); bg.color2 = v ? '#f4c9c4' : null; changed({ props: true }); }))),
      bg.color2 ? propRow('To colour', colorInput(bg.color2, (v) => { bg.color2 = v; changed(); })) : null,
      bg.color2 ? propRow('Angle', input({ type: 'range', min: 0, max: 360, value: bg.angle ?? 180, onfocus: () => snapshot(), oninput: (e) => { bg.angle = Number(e.target.value); changed(); } })) : null,
      propRow('Photo', h('div', { class: 'row', style: { gap: '4px' } }, h('button', { class: 'btn s', onclick: () => addImage('bg') }, bg.image ? 'Replace' : 'Upload'), bg.image && h('button', { class: 'btn s danger', onclick: () => { snapshot(); bg.image = null; changed({ props: true }); } }, 'Remove'))),
      bg.image ? propRow('Photo opacity', input({ type: 'range', min: 0, max: 1, step: 0.05, value: bg.imageOpacity ?? 1, onfocus: () => snapshot(), oninput: (e) => { bg.imageOpacity = Number(e.target.value); changed(); } })) : null,
      h('div', { class: 'section-h' }, 'Layers'),
      h('div', null, [...ed.doc.elements].reverse().map((e) => h('div', { class: ['layer-row', e.id === ed.sel && 'on'], onclick: () => { ed.sel = e.id; drawBoard(); drawProps(); } },
        icon({ text: 'text', image: 'image', shape: 'square', line: 'line', flower: 'flower', ornament: 'sparkle' }[e.type] || 'square'),
        h('span', { class: 'ellipsis grow' }, e.type === 'text' ? fill(e.text, vars()).slice(0, 28) : e.type === 'flower' ? (e.bouquet ? 'Bouquet' : flowerById(e.flower)?.name) : e.type)))),
      h('div', { class: 'xs faint mt' }, 'Tip: double-click text to edit it on the card. Arrow keys nudge, ⌘/Ctrl+D duplicates, Delete removes.'));
  } else {
    const common = [
      h('div', { class: 'section-h' }, 'Position'),
      propRow('X / Y', h('div', { class: 'row', style: { gap: '4px' } }, num(el.x, (v) => { el.x = v ?? 0; changed(); }), num(el.y, (v) => { el.y = v ?? 0; changed(); }))),
      propRow('W / H', h('div', { class: 'row', style: { gap: '4px' } }, num(el.w, (v) => { if (v > 4) { el.w = v; changed(); } }), el.type !== 'text' && el.type !== 'line' ? num(el.h, (v) => { if (v > 2) { el.h = v; changed(); } }) : null)),
      propRow('Rotation', input({ type: 'range', min: -180, max: 180, value: el.rot || 0, onfocus: () => snapshot(), oninput: (e) => { el.rot = Number(e.target.value); changed(); } })),
      propRow('Opacity', input({ type: 'range', min: 0.05, max: 1, step: 0.05, value: el.opacity ?? 1, onfocus: () => snapshot(), oninput: (e) => { el.opacity = Number(e.target.value); changed(); } })),
      h('div', { class: 'row wrap', style: { gap: '4px', marginTop: '10px' } },
        h('button', { class: 'btn s', onclick: () => center('x') }, 'Centre ↔'),
        h('button', { class: 'btn s', onclick: () => center('y') }, 'Centre ↕'),
        h('button', { class: 'btn s icon', title: 'Bring forward', 'aria-label': 'Bring forward', onclick: () => layer(1) }, icon('up')),
        h('button', { class: 'btn s icon', title: 'Send backward', 'aria-label': 'Send backward', onclick: () => layer(-1) }, icon('down')),
        h('button', { class: 'btn s icon', title: 'Duplicate', 'aria-label': 'Duplicate', onclick: duplicate }, icon('copy')),
        h('button', { class: 'btn s icon danger', title: 'Delete', 'aria-label': 'Delete', onclick: del }, icon('trash'))),
    ];
    let specific = [];
    if (el.type === 'text') {
      const ta = h('textarea', { class: 'input', rows: 3, onfocus: () => snapshot(), oninput: (e) => { el.text = e.target.value; changed(); } }, el.text);
      specific = [
        ta,
        h('div', { class: 'row', style: { margin: '6px 0 10px' } }, h('button', { class: 'btn s', onclick: (e) => menu(e.currentTarget, PLACEHOLDERS.map(([k, l]) => ({ label: `${l}  ${k}`, onClick: () => { snapshot(); const p = ta.selectionStart ?? ta.value.length; el.text = ta.value.slice(0, p) + k + ta.value.slice(ta.selectionEnd ?? p); ta.value = el.text; changed(); } }))) }, icon('plus'), 'Insert detail'),
          h('span', { class: 'xs faint' }, 'Filled in automatically')),
        propRow('Font', select(FONTS.map((f) => ({ value: f.css, label: f.name })), el.font, (v) => { snapshot(); el.font = v; changed(); }, { class: 'input s' })),
        propRow('Size', num(el.size, (v) => { if (v > 3) { el.size = v; changed(); } })),
        propRow('Colour', colorInput(el.color, (v) => { el.color = v; changed(); })),
        propRow('Style', h('div', { class: 'row', style: { gap: '4px' } },
          seg([{ value: 300, label: 'Light' }, { value: 400, label: 'Reg' }, { value: 600, label: 'Bold' }], el.weight || 400, (v) => { snapshot(); el.weight = v; changed({ props: true }); }),
          h('button', { class: ['btn s icon', el.italic && 'tinted'], 'aria-label': 'Italic', onclick: () => { snapshot(); el.italic = !el.italic; changed({ props: true }); } }, h('i', { class: 'serif' }, 'I')),
          h('button', { class: ['btn s icon', el.upper && 'tinted'], 'aria-label': 'Uppercase', onclick: () => { snapshot(); el.upper = !el.upper; changed({ props: true }); } }, 'Aa')), true),
        propRow('Align', seg([{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }], el.align || 'center', (v) => { snapshot(); el.align = v; changed({ props: true }); }), true),
        propRow('Letter spacing', input({ type: 'range', min: -0.05, max: 0.5, step: 0.01, value: el.spacing || 0, onfocus: () => snapshot(), oninput: (e) => { el.spacing = Number(e.target.value); changed(); } })),
        propRow('Line height', input({ type: 'range', min: 0.8, max: 2.2, step: 0.05, value: el.lineHeight || 1.25, onfocus: () => snapshot(), oninput: (e) => { el.lineHeight = Number(e.target.value); changed(); } })),
      ];
    } else if (el.type === 'shape') {
      specific = [
        propRow('Shape', select([{ value: 'rect', label: 'Rectangle' }, { value: 'circle', label: 'Circle / oval' }, { value: 'arch', label: 'Arch' }], el.shape, (v) => { snapshot(); el.shape = v; changed(); }, { class: 'input s' })),
        propRow('Fill', h('div', { class: 'col gap-s' }, colorInput(el.fill === 'none' ? '#ffffff' : el.fill, (v) => { el.fill = v; changed(); }), h('label', { class: 'row xs muted' }, h('input', { type: 'checkbox', checked: el.fill === 'none', onchange: (e) => { snapshot(); el.fill = e.target.checked ? 'none' : '#f4c9c4'; changed({ props: true }); } }), 'No fill (frame only)'))),
        propRow('Border', colorInput(el.stroke || '#b08d57', (v) => { el.stroke = v; changed(); })),
        propRow('Border width', num(el.strokeWidth, (v) => { el.strokeWidth = v || 0; changed(); }, { min: 0, max: 20 })),
        propRow('Double border', toggle(!!el.double, (v) => { snapshot(); el.double = v; changed(); })),
        propRow('Dashed', toggle(!!el.dashed, (v) => { snapshot(); el.dashed = v; changed(); })),
        el.shape !== 'circle' ? propRow('Corner radius', num(el.radius, (v) => { el.radius = v || 0; changed(); }, { min: 0 })) : null,
      ];
    } else if (el.type === 'line') {
      specific = [
        propRow('Colour', colorInput(el.color, (v) => { el.color = v; changed(); })),
        propRow('Thickness', num(el.thickness || 1, (v) => { el.thickness = v || 1; changed(); }, { min: 1, max: 20 })),
        propRow('Style', select(['solid', 'dashed', 'dotted', 'double'], el.style || 'solid', (v) => { snapshot(); el.style = v; changed(); }, { class: 'input s' })),
      ];
    } else if (el.type === 'image') {
      specific = [
        propRow('Image', h('button', { class: 'btn s', onclick: async () => { const f = await pickFile('image/*'); if (f) { snapshot(); el.src = await imageToDataUrl(f, 1400, 0.82); changed(); } } }, 'Replace')),
        propRow('Fit', seg([{ value: 'cover', label: 'Fill' }, { value: 'contain', label: 'Fit' }], el.fit || 'cover', (v) => { snapshot(); el.fit = v; changed({ props: true }); })),
        propRow('Shape', select([{ value: 'rect', label: 'Rectangle' }, { value: 'circle', label: 'Circle' }, { value: 'arch', label: 'Arch' }], el.shape || 'rect', (v) => { snapshot(); el.shape = v; changed(); }, { class: 'input s' })),
        propRow('Corner radius', num(el.radius, (v) => { el.radius = v || 0; changed(); }, { min: 0 })),
      ];
    } else if (el.type === 'flower') {
      const f = flowerById(el.flower);
      specific = el.bouquet ? [h('div', { class: 'small muted' }, 'Bouquet illustration. Edit bouquets in Colours & flowers, then add it again.')] : [
        propRow('Flower', select(FLOWERS.map((x) => ({ value: x.id, label: x.name })), el.flower, (v) => { snapshot(); el.flower = v; el.color = flowerById(v).colors[0]; changed({ props: true }); }, { class: 'input s' })),
        f ? propRow('Colour', h('div', { class: 'row wrap', style: { gap: '4px' } }, f.colors.map((c) => h('button', { class: ['color-dot', c === el.color && 'on'], style: { background: c }, 'aria-label': c, onclick: () => { snapshot(); el.color = c; changed({ props: true }); } })))) : null,
        propRow('Flip', h('button', { class: 'btn s', onclick: () => { snapshot(); el.rot = ((el.rot || 0) + 180) % 360; changed({ props: true }); } }, 'Turn upside down')),
      ];
    } else if (el.type === 'ornament') {
      specific = [
        propRow('Design', select(ORNAMENTS, el.ornament, (v) => { snapshot(); el.ornament = v; changed(); }, { class: 'input s' })),
        propRow('Colour', colorInput(el.color, (v) => { el.color = v; changed(); })),
      ];
    }
    body = h('div', null, h('div', { class: 'card-title', style: { fontSize: '15px', marginBottom: '10px' } }, { text: 'Text', image: 'Photo', shape: 'Shape', line: 'Line', flower: 'Flower', ornament: 'Ornament' }[el.type],
      h('button', { class: 'more btn plain s', onclick: () => { ed.sel = null; drawBoard(); drawProps(); } }, 'Done')), specific, common);
  }
  propsEl.replaceChildren(body);
}

function center(axis) { const el = selEl(); if (!el) return; snapshot(); if (axis === 'x') el.x = Math.round(ed.doc.canvas.w / 2 - el.w / 2); else { const n = boardEl?.querySelector(`[data-id="${el.id}"]`); const hh = el.type === 'text' && n ? n.offsetHeight : el.h; el.y = Math.round(ed.doc.canvas.h / 2 - hh / 2); } changed({ props: true }); }
function layer(dir) { const a = ed.doc.elements; const i = a.findIndex((x) => x.id === ed.sel); const j = i + dir; if (i < 0 || j < 0 || j >= a.length) return; snapshot(); [a[i], a[j]] = [a[j], a[i]]; changed({ props: true }); }
function duplicate() { const el = selEl(); if (!el) return; snapshot(); const c = { ...structuredClone(el), id: uid(), x: el.x + 14, y: el.y + 14 }; ed.doc.elements.push(c); ed.sel = c.id; changed({ props: true }); }
function del() { if (!ed.sel) return; snapshot(); ed.doc.elements = ed.doc.elements.filter((x) => x.id !== ed.sel); ed.sel = null; changed({ props: true }); }

function onKey(e) {
  if (!container?.isConnected || ed.tab !== 'design' || !ed.doc || !editable()) return;
  if (ed.editingText || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.querySelector('.backdrop')) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redoFn() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redoFn(); return; }
  const el = selEl();
  if (!el) return;
  if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); del(); return; }
  if (e.key === 'Escape') { ed.sel = null; drawBoard(); drawProps(); return; }
  const step = e.shiftKey ? 10 : 1;
  const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (mv) { e.preventDefault(); snapshot(); el.x += mv[0]; el.y += mv[1]; changed({ props: true }); }
}
document.addEventListener('keydown', onKey);
window.addEventListener('resize', debounce(() => { if (container?.isConnected && ed.tab === 'design') drawBoard(); }, 150));

// ------------------------------------------------------------------ designs: create / manage
async function newDesign(fromTpl) {
  const kind = fromTpl?.canvas?.h === 900 ? 'menu' : fromTpl?.canvas?.w > fromTpl?.canvas?.h ? 'savethedate' : 'invitation';
  const first = !list('design').length;
  const d = await create('design', {
    name: fromTpl?.name || 'Untitled design', kind, primary: first && kind === 'invitation',
    canvas: fromTpl?.canvas || { w: 500, h: 700 }, background: fromTpl?.background || { color: '#ffffff' }, elements: fromTpl?.elements || [],
  });
  open(d); build();
}

function templatesSheet() {
  loadFonts();
  const tpls = templates(store.wedding.lang);
  const s = sheet({
    title: 'Start from a template', size: 'xwide',
    body: h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '14px' } },
      h('button', { class: 'card', style: { cursor: 'pointer', display: 'grid', placeItems: 'center', minHeight: '240px', border: '2px dashed var(--sep-strong)', boxShadow: 'none', background: 'none', color: 'var(--accent)' }, onclick: () => { s.close(); newDesign(null); } }, h('div', null, icon('plus'), h('div', null, 'Blank'))),
      tpls.map((t) => {
        const scale = 170 / t.canvas.w;
        const thumb = h('div', { class: 'tpl-thumb', style: { width: '170px', height: `${t.canvas.h * scale}px`, position: 'relative' }, onclick: () => { s.close(); newDesign(t); } });
        thumb.append(artboard(t, vars(), scale));
        return h('div', { class: 'col gap-s' }, thumb, h('div', { class: 'small center' }, t.name));
      })),
  });
}

function designMenu(anchor, d) {
  menu(anchor, [
    { label: 'Rename', icon: 'edit', onClick: async () => { const n = await promptBox({ title: 'Rename design', value: d.name }); if (n) patch('design', d.id, { name: n }); } },
    { label: 'Type', icon: 'list', onClick: () => menu(anchor, KINDS.map((k) => ({ label: k.label, checked: d.kind === k.value, onClick: () => patch('design', d.id, { kind: k.value }) }))) },
    { label: 'Duplicate', icon: 'copy', onClick: async () => { const { id, _sort, _updated, _by, type, ...rest } = get('design', d.id); const c = await create('design', { ...rest, name: `${d.name} copy`, primary: false }); open(c); build(); } },
    { label: d.primary ? 'Shown on the RSVP page ✓' : 'Show on the guests’ RSVP page', icon: 'eye', onClick: async () => { for (const x of list('design')) if (x.primary && x.id !== d.id) await patch('design', x.id, { primary: false }); await patch('design', d.id, { primary: true }); toast('Guests will see this design with their RSVP'); build(); } },
    '-',
    { label: 'Delete', icon: 'trash', danger: true, onClick: async () => { if (await confirmBox({ title: `Delete “${d.name}”?`, confirm: 'Delete', destructive: true })) { await remove('design', d.id, { label: d.name }); ed.id = null; ed.doc = null; build(); } } },
  ]);
}

function printDesign(personalised) {
  const d = ed.doc; const c = d.canvas;
  const guests = personalised ? list('guest').filter((g) => g.rsvp !== 'no' && !g.plusOneOf) : [null];
  const pages = guests.map((g) => {
    const v = weddingVars(store.wedding, g ? guestName(g) : null);
    const host = document.createElement('div');
    host.append(artboard(d, v, 1));
    return `<div class="page" style="width:${c.w}px;height:${c.h}px;position:relative;overflow:hidden;break-after:page;margin:0 auto">${host.innerHTML}</div>`;
  }).join('');
  const css = `body{margin:0}.el{position:absolute}.el-text{white-space:pre-wrap;word-break:break-word}.artboard{position:absolute}@page{size:${c.w}px ${c.h}px;margin:0}`;
  printHtml(`${coupleNames()} – design`, pages, css);
}

// ------------------------------------------------------------------ RSVP tab
function rsvpTab() {
  const guests = list('guest');
  const yes = guests.filter((g) => g.rsvp === 'yes'); const no = guests.filter((g) => g.rsvp === 'no'); const pend = guests.filter((g) => (g.rsvp || 'pending') === 'pending');
  const replies = guests.filter((g) => g.rsvpAt).sort((a, b) => b.rsvpAt - a.rsvpAt);
  const sample = guests.find((g) => g.token);
  const w = store.wedding;
  return h('div', null,
    h('div', { class: 'grid c4' },
      h('div', { class: 'card stat' }, h('div', { class: 'l' }, 'Attending'), h('div', { class: 'v pos' }, yes.length)),
      h('div', { class: 'card stat' }, h('div', { class: 'l' }, 'Awaiting reply'), h('div', { class: 'v warn' }, pend.length)),
      h('div', { class: 'card stat' }, h('div', { class: 'l' }, 'Declined'), h('div', { class: 'v neg' }, no.length)),
      h('div', { class: 'card stat' }, h('div', { class: 'l' }, 'Reply by'), h('div', { class: 'v', style: { fontSize: '20px' } }, w.rsvpBy || '—'))),
    h('div', { class: 'card mt-l' },
      h('div', { class: 'card-title' }, icon('link'), 'Online invitation & RSVP'),
      h('p', { class: 'small muted', style: { margin: '6px 0 12px' } }, 'Every guest has a personal link. It shows your invitation design, the wedding details and a reply form for their whole household (meal choice, dietary needs, plus-one, song request and a message). Replies update your guest list instantly.'),
      h('div', { class: 'row wrap' },
        sample && h('a', { class: 'btn', href: rsvpLink(sample), target: '_blank' }, icon('eye'), 'Preview as a guest'),
        can('guests', 'edit') && h('button', { class: 'btn primary', onclick: () => emailSheet(pend.length ? pend : guests) }, icon('send'), `Prepare emails (${pend.length ? 'awaiting reply' : 'everyone'})`),
        can('guests') && h('button', { class: 'btn', onclick: () => copyText(guests.map((g) => `${guestName(g)}: ${rsvpLink(g)}`).join('\n'), 'All links copied') }, icon('copy'), 'Copy all links'),
        isPlanner() && h('a', { class: 'btn plain', href: '/settings' }, 'RSVP settings', icon('chevron')))),
    h('div', { class: 'section-h' }, `Replies (${replies.length})`),
    replies.length ? h('div', { class: 'list' }, replies.map((g) => h('div', { class: 'list-item', style: { alignItems: 'flex-start' } },
      h('div', { class: 'grow' }, h('div', { class: 'title' }, guestName(g)),
        h('div', { class: 'meta' }, [g.meal, ...(g.dietary || []), g.dietaryNote].filter(Boolean).join(' · ')),
        g.rsvpMessage ? h('div', { class: 'serif', style: { fontSize: '16px', marginTop: '4px' } }, `“${g.rsvpMessage}”`) : null),
      rsvpChip(g.rsvp), h('span', { class: 'xs faint nowrap' }, timeAgo(g.rsvpAt)))))
      : h('div', { class: 'card small muted' }, 'Replies from guests will appear here.'));
}

// ------------------------------------------------------------------ view
function build() {
  if (!container) return;
  loadFonts();
  const designs = list('design');
  if (ed.id && !get('design', ed.id)) { ed.id = null; ed.doc = null; }
  if (!ed.doc && designs.length) open(designs.find((d) => d.primary) || designs[0]);
  const cur = ed.id && get('design', ed.id);
  saveState = h('span', { class: 'xs faint' }, '');
  const head = h('div', { class: 'page-head' },
    h('div', null, h('h1', null, 'Invitations & RSVP'), h('div', { class: 'sub' }, 'Design invitations, save-the-dates and menus. Guests see the invitation with their personal RSVP link.')),
    h('div', { class: 'actions' }, seg([{ value: 'design', label: 'Designer', icon: 'edit' }, { value: 'rsvp', label: 'RSVP', icon: 'guests' }], ed.tab, (v) => { ed.tab = v; build(); })));

  if (ed.tab === 'rsvp') { container.replaceChildren(head, rsvpTab()); return; }
  if (!designs.length) {
    container.replaceChildren(head, emptyState('invite', 'Design your invitation', 'Start from a template (classic, romantic florals, modern, Greek olive, Aegean…) and make it yours: fonts, colours, flowers from your palette and photos.',
      editable() && h('button', { class: 'btn primary', onclick: templatesSheet }, icon('sparkle'), 'Choose a template')));
    return;
  }

  const toolbar = h('div', { class: 'toolbar' },
    select(designs.map((d) => ({ value: d.id, label: `${d.name}${d.primary ? ' ★' : ''}` })), ed.id, (v) => { open(get('design', v)); build(); }, { class: 'input s', style: { width: 'auto', maxWidth: '260px' } }),
    cur && editable() && h('button', { class: 'btn s icon', 'aria-label': 'Design options', onclick: (e) => designMenu(e.currentTarget, cur) }, icon('more')),
    editable() && h('button', { class: 'btn s', onclick: templatesSheet }, icon('plus'), 'New'),
    h('span', { class: 'grow' }), saveState,
    editable() && h('button', { class: 'btn s icon', 'aria-label': 'Undo', title: 'Undo (⌘Z)', onclick: undo }, icon('undo')),
    editable() && h('button', { class: 'btn s icon', 'aria-label': 'Redo', title: 'Redo (⇧⌘Z)', onclick: redoFn, style: { transform: 'scaleX(-1)' } }, icon('undo')),
    h('button', { class: 'btn s', onclick: (e) => menu(e.currentTarget, [
      { label: 'Print / save as PDF', icon: 'print', onClick: () => printDesign(false) },
      { label: 'Print one per guest (with names)', icon: 'guests', onClick: () => printDesign(true) },
      list('guest').find((g) => g.token) && { label: 'Preview as a guest', icon: 'eye', onClick: () => window.open(rsvpLink(list('guest').find((g) => g.token)), '_blank') },
    ]) }, icon('download'), 'Export'));

  const tools = !editable() ? h('div', { class: 'card panel small muted' }, 'View only. Ask a planner if you need to change the design.') : h('div', { class: 'card panel', style: { padding: '10px' } },
    h('div', { class: 'label', style: { padding: '4px 6px' } }, 'Add'),
    h('button', { class: 'tool-btn', onclick: (e) => menu(e.currentTarget, TEXT_PRESETS.map((p) => ({ label: p.label, onClick: () => add({ ...p.el }) }))) }, icon('text'), 'Text'),
    h('button', { class: 'tool-btn', onclick: () => addImage() }, icon('image'), 'Photo'),
    h('button', { class: 'tool-btn', onclick: flowerPicker }, icon('flower'), 'Flower or bouquet'),
    h('button', { class: 'tool-btn', onclick: (e) => menu(e.currentTarget, ORNAMENTS.map((o) => ({ label: o.label, onClick: () => add({ type: 'ornament', ornament: o.value, color: accent(), w: o.value === 'wreath' ? 220 : o.value === 'corner' ? 110 : o.value === 'rings' ? 110 : 260, h: o.value === 'wreath' ? 220 : o.value === 'corner' ? 110 : o.value === 'rings' ? 74 : o.value === 'dots' ? 16 : 36 }) }))) }, icon('sparkle'), 'Ornament'),
    h('button', { class: 'tool-btn', onclick: (e) => menu(e.currentTarget, [
      { label: 'Frame', onClick: () => add({ type: 'shape', shape: 'rect', fill: 'none', stroke: accent(), strokeWidth: 1.5, double: true, x: 20, y: 20, w: ed.doc.canvas.w - 40, h: ed.doc.canvas.h - 40 }) },
      { label: 'Rectangle', onClick: () => add({ type: 'shape', shape: 'rect', fill: (ourPalette() || [])[1] || '#f4c9c4', strokeWidth: 0, w: 200, h: 140 }) },
      { label: 'Circle', onClick: () => add({ type: 'shape', shape: 'circle', fill: (ourPalette() || [])[1] || '#f4c9c4', strokeWidth: 0, w: 160, h: 160 }) },
      { label: 'Arch', onClick: () => add({ type: 'shape', shape: 'arch', fill: (ourPalette() || [])[0] || '#eef4f9', stroke: accent(), strokeWidth: 1.5, w: 300, h: 420 }) },
      { label: 'Line', onClick: () => add({ type: 'line', color: accent(), thickness: 1, w: 160, h: 2 }) },
    ]) }, icon('square'), 'Shape or line'),
    h('div', { class: 'label', style: { padding: '14px 6px 4px' } }, 'Palette'),
    ourPalette() ? h('div', { class: 'swatches s', style: { margin: '0 6px' } }, ourPalette().map((c) => h('div', { style: { background: c }, title: c, onclick: () => { const el = selEl(); if (!el) return; snapshot(); if (el.type === 'shape') el.fill = c; else el.color = c; changed({ props: true }); } })))
      : h('a', { class: 'small', href: '/style', style: { padding: '0 6px' } }, 'Choose a palette'),
    h('div', { class: 'xs faint', style: { padding: '6px' } }, ourPalette() ? 'Click a colour to apply it to the selected item.' : ''));
  stageEl = h('div', { class: 'stage-wrap' });
  propsEl = h('div', { class: 'card panel props' });
  container.replaceChildren(head, toolbar, h('div', { class: 'designer' }, tools, stageEl, propsEl));
  requestAnimationFrame(() => { drawBoard(); drawProps(); });
  if (document.fonts?.ready) document.fonts.ready.then(() => drawBoard());
}

export default {
  title: 'Invitations',
  manual: true,
  wide: true,
  render() { container = h('div'); build(); return container; },
  refresh() { if (ed.tab === 'rsvp' || !ed.doc) build(); },
};
