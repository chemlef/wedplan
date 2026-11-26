// Invitation designs: data model, templates and the renderer shared by the editor and the guest RSVP page.
import { flowerById, flowerSvg, bouquetSvg } from './flowers.js';

export const SIZES = [
  { value: '5x7', label: 'Invitation 5×7″', w: 500, h: 700 },
  { value: 'a5', label: 'A5 portrait', w: 525, h: 742 },
  { value: 'square', label: 'Square', w: 600, h: 600 },
  { value: 'landscape', label: 'Save the date 6×4″', w: 600, h: 400 },
  { value: 'story', label: 'Phone / story', w: 450, h: 800 },
  { value: 'menu', label: 'Menu card (tall)', w: 400, h: 900 },
  { value: 'place', label: 'Place card', w: 350, h: 200 },
];
export const KINDS = [
  { value: 'invitation', label: 'Invitation' }, { value: 'savethedate', label: 'Save the date' }, { value: 'menu', label: 'Menu card' },
  { value: 'program', label: 'Ceremony programme' }, { value: 'thankyou', label: 'Thank-you card' }, { value: 'sign', label: 'Welcome sign' }, { value: 'other', label: 'Other' },
];
export const PLACEHOLDERS = [
  ['{couple}', 'Couple'], ['{partner1}', 'Partner 1'], ['{partner2}', 'Partner 2'], ['{guest}', 'Guest name'], ['{date_long}', 'Date (long)'], ['{date}', 'Date'],
  ['{day}', 'Day'], ['{month}', 'Month'], ['{year}', 'Year'], ['{weekday}', 'Weekday'], ['{time}', 'Time'], ['{ceremony}', 'Ceremony venue'], ['{ceremony_address}', 'Ceremony address'],
  ['{reception}', 'Reception venue'], ['{reception_address}', 'Reception address'], ['{rsvp_by}', 'RSVP date'], ['{hashtag}', 'Hashtag'], ['{dress_code}', 'Dress code'],
];

export function weddingVars(w, guestName, lang) {
  const L = lang || w.lang || 'en';
  const loc = L === 'el' ? 'el-GR' : 'en-GB';
  const d = w.date ? new Date(`${w.date}T12:00:00`) : null;
  const fmt = (o) => (d ? new Intl.DateTimeFormat(loc, o).format(d) : '');
  const rsvp = w.rsvpBy ? new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long' }).format(new Date(`${w.rsvpBy}T12:00:00`)) : '';
  return {
    couple: [w.partner1, w.partner2].filter(Boolean).join(' & ') || 'Maria & Nikos', partner1: w.partner1 || 'Maria', partner2: w.partner2 || 'Nikos',
    guest: guestName || (L === 'el' ? 'Αγαπητοί μας φίλοι' : 'Dear guest'), date_long: fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    date: d ? `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}` : '', day: fmt({ day: 'numeric' }), month: fmt({ month: 'long' }),
    year: fmt({ year: 'numeric' }), weekday: fmt({ weekday: 'long' }), time: w.time || '', ceremony: w.ceremony?.name || '', ceremony_address: w.ceremony?.address || '',
    reception: w.reception?.name || '', reception_address: w.reception?.address || '', rsvp_by: rsvp, hashtag: w.hashtag || '', dress_code: w.dressCode || '',
  };
}
export const fill = (text, vars) => String(text ?? '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));

// ------------------------------------------------------------------ ornaments
export const ORNAMENTS = [
  { value: 'flourish', label: 'Flourish' }, { value: 'leaves', label: 'Leaf divider' }, { value: 'wreath', label: 'Olive wreath' }, { value: 'dots', label: 'Dots' },
  { value: 'heart', label: 'Heart line' }, { value: 'rings', label: 'Rings' }, { value: 'corner', label: 'Corner flourish' }, { value: 'meander', label: 'Greek key border' },
];
export function ornamentSvg(kind, color = '#b08d57') {
  const c = color;
  const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">${body}</svg>`;
  switch (kind) {
    case 'leaves': return svg('0 0 300 40', `<path d="M10 20 H120 M180 20 H290" stroke="${c}" stroke-width="1.2"/>${[-1, 1].map((s) => [0, 1, 2].map((i) => `<path d="M${150 + s * (10 + i * 10)} 20 c${s * 6} -10 ${s * 14} -10 ${s * 16} -12 c-4 8 -10 12 ${-s * 16} 12z" fill="${c}"/><path d="M${150 + s * (10 + i * 10)} 20 c${s * 6} 10 ${s * 14} 10 ${s * 16} 12 c-4 -8 -10 -12 ${-s * 16} -12z" fill="${c}" opacity=".7"/>`).join('')).join('')}<circle cx="150" cy="20" r="3.5" fill="${c}"/>`);
    case 'wreath': return svg('0 0 200 200', `${Array.from({ length: 2 }, (_, s) => Array.from({ length: 11 }, (_, i) => { const a = (s ? -1 : 1) * (0.35 + i * 0.24); const x = 100 + Math.sin(a) * 82; const y = 112 + Math.cos(a) * 82; const rot = (-a * 180) / Math.PI + (s ? 140 : 40); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="12" ry="4.2" fill="${c}" opacity="${0.6 + (i % 3) * 0.15}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join('')).join('')}<path d="M100 194 A82 82 0 0 1 22 80 M100 194 A82 82 0 0 0 178 80" fill="none" stroke="${c}" stroke-width="1.4"/><circle cx="78" cy="170" r="4" fill="${c}"/><circle cx="126" cy="168" r="4" fill="${c}"/>`);
    case 'dots': return svg('0 0 300 20', `${Array.from({ length: 9 }, (_, i) => `<circle cx="${110 + i * 10}" cy="10" r="${i === 4 ? 3.5 : 2}" fill="${c}"/>`).join('')}`);
    case 'heart': return svg('0 0 300 40', `<path d="M20 20 H128 M172 20 H280" stroke="${c}" stroke-width="1.2"/><path d="M150 30 C136 22 134 10 142 9 C147 8 150 12 150 14 C150 12 153 8 158 9 C166 10 164 22 150 30Z" fill="none" stroke="${c}" stroke-width="1.6"/>`);
    case 'rings': return svg('0 0 120 80', `<circle cx="48" cy="44" r="26" fill="none" stroke="${c}" stroke-width="3.5"/><circle cx="74" cy="44" r="26" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M42 12 l6 -8 6 8 -6 6z" fill="${c}"/>`);
    case 'corner': return svg('0 0 100 100', `<path d="M5 95 V40 C5 18 18 5 40 5 H95" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M14 95 V46 C14 26 26 14 46 14 H95" fill="none" stroke="${c}" stroke-width=".8"/><path d="M5 40 C20 40 40 20 40 5 M30 30 c6 -2 10 -8 10 -14 M30 30 c-2 6 -8 10 -14 10" fill="none" stroke="${c}" stroke-width="1.2"/><circle cx="30" cy="30" r="3" fill="${c}"/>`);
    case 'meander': {
      let p = '';
      for (let i = 0; i < 10; i++) { const x = i * 30; p += `M${x} 28 V4 H${x + 24} V22 H${x + 10} V12 H${x + 16}`; }
      return svg('0 0 300 32', `<path d="${p}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="miter"/><path d="M0 30 H300" stroke="${c}" stroke-width="1.6"/>`);
    }
    default: return svg('0 0 300 60', `<path d="M150 30 C120 6 80 54 40 30 C60 26 70 18 76 10 M150 30 C180 6 220 54 260 30 C240 26 230 18 224 10 M150 30 C140 40 130 44 118 42 M150 30 C160 40 170 44 182 42" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/><circle cx="150" cy="30" r="4" fill="${c}"/><circle cx="34" cy="31" r="2.5" fill="${c}"/><circle cx="266" cy="31" r="2.5" fill="${c}"/>`);
  }
}

// ------------------------------------------------------------------ element rendering
export function elementInner(el, vars) {
  switch (el.type) {
    case 'text': return null;
    case 'flower': {
      if (el.bouquet) return bouquetSvg(el.bouquet);
      const f = flowerById(el.flower);
      return f ? flowerSvg(f, el.color || f.colors[0]) : '';
    }
    case 'ornament': return ornamentSvg(el.ornament, el.color);
    default: return null;
  }
}

export function styleFor(el) {
  const s = { left: `${el.x}px`, top: `${el.y}px`, width: `${el.w}px`, height: `${el.h}px`, transform: el.rot ? `rotate(${el.rot}deg)` : '', opacity: el.opacity ?? 1 };
  if (el.type === 'text') {
    Object.assign(s, {
      fontFamily: el.font || '"Cormorant Garamond", serif', fontSize: `${el.size || 24}px`, color: el.color || '#3a3a3a', fontWeight: el.weight || 400,
      fontStyle: el.italic ? 'italic' : 'normal', textAlign: el.align || 'center', letterSpacing: `${el.spacing || 0}em`, lineHeight: el.lineHeight || 1.25,
      textTransform: el.upper ? 'uppercase' : 'none', height: 'auto', minHeight: `${el.h}px`,
    });
  } else if (el.type === 'shape') {
    const sw = Number(el.strokeWidth) || 0;
    Object.assign(s, {
      background: el.fill === 'none' ? 'transparent' : el.fill || '#f4c9c4', border: sw ? `${sw}px ${el.dashed ? 'dashed' : 'solid'} ${el.stroke || '#b08d57'}` : 'none',
      borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'arch' ? `${el.w / 2}px ${el.w / 2}px ${el.radius || 0}px ${el.radius || 0}px` : `${el.radius || 0}px`,
      boxShadow: el.double && sw ? `inset 0 0 0 ${sw + 3}px ${el.fill === 'none' ? 'transparent' : el.fill || 'transparent'}, inset 0 0 0 ${sw + 4}px ${el.stroke || '#b08d57'}` : 'none',
    });
  } else if (el.type === 'line') {
    Object.assign(s, { height: '0', borderTop: `${el.thickness || 1}px ${el.style || 'solid'} ${el.color || '#b08d57'}`, top: `${el.y + (el.h || 0) / 2}px` });
  } else if (el.type === 'image') {
    Object.assign(s, { backgroundImage: el.src ? `url("${el.src}")` : 'none', backgroundSize: el.fit || 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'arch' ? `${el.w / 2}px ${el.w / 2}px 0 0` : `${el.radius || 0}px` });
  }
  return s;
}

export function backgroundStyle(bg = {}) {
  const base = bg.color2 ? `linear-gradient(${bg.angle ?? 180}deg, ${bg.color || '#fff'}, ${bg.color2})` : bg.color || '#ffffff';
  return base;
}

// Static rendering (guest page, thumbnails, print).
export function renderDesign(design, vars, { scale = 1 } = {}) {
  const c = design.canvas || { w: 500, h: 700 };
  const outer = document.createElement('div');
  outer.style.cssText = `width:${c.w * scale}px;height:${c.h * scale}px;position:relative;overflow:hidden;flex-shrink:0`;
  outer.append(artboard(design, vars, scale));
  return outer;
}
export function artboard(design, vars, scale = 1) {
  const c = design.canvas || { w: 500, h: 700 };
  const bg = design.background || {};
  const board = document.createElement('div');
  board.className = 'artboard';
  board.style.cssText = `width:${c.w}px;height:${c.h}px;transform:scale(${scale});transform-origin:0 0;position:absolute;left:0;top:0;background:${backgroundStyle(bg)};overflow:hidden`;
  if (bg.image) {
    const im = document.createElement('div');
    im.style.cssText = `position:absolute;inset:0;background:url("${bg.image}") center/cover no-repeat;opacity:${bg.imageOpacity ?? 1}`;
    board.append(im);
  }
  (design.elements || []).forEach((el) => board.append(elementNode(el, vars)));
  return board;
}
export function elementNode(el, vars) {
  const n = document.createElement('div');
  n.className = `el el-${el.type}`;
  n.dataset.id = el.id;
  Object.assign(n.style, styleFor(el));
  if (el.type === 'text') { n.classList.add('el-text'); n.textContent = fill(el.text, vars); }
  const inner = elementInner(el, vars);
  if (inner) { n.innerHTML = inner; const svg = n.querySelector('svg'); if (svg) { svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); } }
  return n;
}

// ------------------------------------------------------------------ templates
const id = () => Math.random().toString(36).slice(2, 9);
const T = (o) => ({ id: id(), type: 'text', opacity: 1, rot: 0, ...o });
export function templates(lang = 'en') {
  const el = lang === 'el';
  const t = (en, gr) => (el ? gr : en);
  return [
    {
      name: t('Classic', 'Κλασικό'), canvas: { w: 500, h: 700 }, background: { color: '#fbf8f2' },
      elements: [
        { id: id(), type: 'shape', shape: 'rect', x: 22, y: 22, w: 456, h: 656, fill: 'none', stroke: '#b08d57', strokeWidth: 1.5, double: true, radius: 0 },
        { id: id(), type: 'ornament', ornament: 'flourish', color: '#b08d57', x: 150, y: 70, w: 200, h: 40 },
        T({ text: t('TOGETHER WITH THEIR FAMILIES', 'ΜΑΖΙ ΜΕ ΤΙΣ ΟΙΚΟΓΕΝΕΙΕΣ ΤΟΥΣ'), x: 60, y: 130, w: 380, h: 20, size: 12, spacing: 0.25, font: '"Cormorant Garamond", serif', color: '#6b6b6b' }),
        T({ text: '{partner1}', x: 40, y: 175, w: 420, h: 70, size: 58, font: '"Cormorant Garamond", serif', color: '#2f2f2f' }),
        T({ text: '&', x: 200, y: 250, w: 100, h: 50, size: 40, font: '"Great Vibes", cursive', color: '#b08d57' }),
        T({ text: '{partner2}', x: 40, y: 300, w: 420, h: 70, size: 58, font: '"Cormorant Garamond", serif', color: '#2f2f2f' }),
        T({ text: t('request the pleasure of your company\nat the celebration of their marriage', 'σας προσκαλούν να μοιραστείτε μαζί τους\nτη χαρά του γάμου τους'), x: 50, y: 395, w: 400, h: 50, size: 17, italic: true, font: '"Cormorant Garamond", serif', color: '#555' }),
        { id: id(), type: 'line', x: 200, y: 462, w: 100, h: 2, color: '#b08d57', thickness: 1 },
        T({ text: '{date_long}', x: 40, y: 480, w: 420, h: 26, size: 20, upper: true, spacing: 0.12, font: '"Cormorant Garamond", serif', color: '#2f2f2f' }),
        T({ text: '{time}  ·  {ceremony}', x: 40, y: 515, w: 420, h: 24, size: 17, font: '"Cormorant Garamond", serif', color: '#555' }),
        T({ text: '{ceremony_address}', x: 40, y: 545, w: 420, h: 22, size: 14, font: '"Cormorant Garamond", serif', color: '#777' }),
        T({ text: t('Kindly reply by {rsvp_by}', 'Παρακαλούμε απαντήστε έως {rsvp_by}'), x: 40, y: 610, w: 420, h: 20, size: 13, spacing: 0.08, italic: true, font: '"Cormorant Garamond", serif', color: '#8a8a8a' }),
      ],
    },
    {
      name: t('Romantic florals', 'Ρομαντικό με λουλούδια'), canvas: { w: 500, h: 700 }, background: { color: '#fdf6f4', color2: '#f8e7e3', angle: 180 },
      elements: [
        { id: id(), type: 'flower', flower: 'peony', color: '#f4cdc6', x: -40, y: -50, w: 220, h: 220, rot: 25, opacity: 0.95 },
        { id: id(), type: 'flower', flower: 'eucalyptus', color: '#8fa89a', x: 110, y: -30, w: 130, h: 160, rot: 70 },
        { id: id(), type: 'flower', flower: 'rose', color: '#f6efe1', x: 350, y: 540, w: 180, h: 180, rot: -20 },
        { id: id(), type: 'flower', flower: 'gypsophila', color: '#fbfaf6', x: 300, y: 520, w: 120, h: 150, rot: -50 },
        T({ text: t('You are invited to the wedding of', 'Σας προσκαλούμε στον γάμο μας'), x: 50, y: 190, w: 400, h: 26, size: 18, italic: true, font: '"Cormorant Garamond", serif', color: '#8a5a62' }),
        T({ text: '{partner1}\n& {partner2}', x: 30, y: 230, w: 440, h: 170, size: 66, lineHeight: 1.1, font: '"Great Vibes", cursive', color: '#a2475e' }),
        T({ text: '{weekday}', x: 50, y: 430, w: 400, h: 22, size: 15, upper: true, spacing: 0.3, font: 'Montserrat, sans-serif', weight: 300, color: '#6b5257' }),
        T({ text: '{day} {month} {year}', x: 50, y: 455, w: 400, h: 34, size: 28, font: '"Cormorant Garamond", serif', color: '#4a3a3d' }),
        T({ text: '{time} · {ceremony}\n{reception}', x: 50, y: 500, w: 400, h: 50, size: 16, font: '"Cormorant Garamond", serif', color: '#6b5257' }),
      ],
    },
    {
      name: t('Modern minimal', 'Μοντέρνο μίνιμαλ'), canvas: { w: 500, h: 700 }, background: { color: '#ffffff' },
      elements: [
        T({ text: '{partner1}', x: 40, y: 150, w: 420, h: 50, size: 40, upper: true, spacing: 0.3, font: 'Jost, sans-serif', weight: 300, color: '#1d1d1f' }),
        T({ text: t('and', 'και'), x: 40, y: 205, w: 420, h: 30, size: 22, italic: true, font: '"Cormorant Garamond", serif', color: '#8a8a8a' }),
        T({ text: '{partner2}', x: 40, y: 240, w: 420, h: 50, size: 40, upper: true, spacing: 0.3, font: 'Jost, sans-serif', weight: 300, color: '#1d1d1f' }),
        { id: id(), type: 'line', x: 225, y: 330, w: 50, h: 2, color: '#1d1d1f', thickness: 1 },
        T({ text: '{date}', x: 40, y: 360, w: 420, h: 60, size: 46, spacing: 0.08, font: 'Jost, sans-serif', weight: 300, color: '#1d1d1f' }),
        T({ text: '{ceremony}\n{ceremony_address}', x: 40, y: 440, w: 420, h: 50, size: 14, upper: true, spacing: 0.2, lineHeight: 1.7, font: 'Jost, sans-serif', weight: 400, color: '#555' }),
        T({ text: t('RSVP by {rsvp_by}', 'RSVP έως {rsvp_by}'), x: 40, y: 600, w: 420, h: 20, size: 11, upper: true, spacing: 0.3, font: 'Jost, sans-serif', color: '#8a8a8a' }),
      ],
    },
    {
      name: t('Greek olive', 'Ελληνική ελιά'), canvas: { w: 500, h: 700 }, background: { color: '#f7f4ea' },
      elements: [
        { id: id(), type: 'ornament', ornament: 'wreath', color: '#7d8f69', x: 110, y: 60, w: 280, h: 280 },
        T({ text: '{partner1}', x: 110, y: 150, w: 280, h: 44, size: 34, font: 'Cinzel, serif', color: '#3e4a32' }),
        T({ text: '&', x: 200, y: 192, w: 100, h: 40, size: 34, font: '"Pinyon Script", cursive', color: '#7d8f69' }),
        T({ text: '{partner2}', x: 110, y: 232, w: 280, h: 44, size: 34, font: 'Cinzel, serif', color: '#3e4a32' }),
        T({ text: t('invite you to celebrate their wedding', 'σας προσκαλούν στον γάμο τους'), x: 50, y: 370, w: 400, h: 26, size: 19, italic: true, font: '"EB Garamond", serif', color: '#5a5a4a' }),
        T({ text: '{date_long}', x: 40, y: 420, w: 420, h: 26, size: 19, font: 'Cinzel, serif', color: '#3e4a32' }),
        T({ text: '{time}\n{ceremony}\n{ceremony_address}', x: 40, y: 455, w: 420, h: 80, size: 16, lineHeight: 1.45, font: '"EB Garamond", serif', color: '#5a5a4a' }),
        T({ text: t('The reception follows at {reception}', 'Η δεξίωση θα ακολουθήσει στο {reception}'), x: 40, y: 560, w: 420, h: 24, size: 15, italic: true, font: '"EB Garamond", serif', color: '#5a5a4a' }),
        { id: id(), type: 'ornament', ornament: 'meander', color: '#7d8f69', x: 100, y: 630, w: 300, h: 22 },
      ],
    },
    {
      name: t('Aegean arch', 'Αιγαίο'), canvas: { w: 500, h: 700 }, background: { color: '#ffffff' },
      elements: [
        { id: id(), type: 'shape', shape: 'arch', x: 60, y: 60, w: 380, h: 580, fill: '#eef4f9', stroke: '#2a6f97', strokeWidth: 2, radius: 0 },
        { id: id(), type: 'flower', flower: 'bougainvillea', color: '#d9467a', x: 300, y: 30, w: 170, h: 170, rot: 10 },
        { id: id(), type: 'flower', flower: 'olive', color: '#7d8f69', x: 20, y: 500, w: 140, h: 180, rot: -30 },
        T({ text: t('SAVE THE DATE', 'ΚΡΑΤΗΣΤΕ ΤΗΝ ΗΜΕΡΟΜΗΝΙΑ'), x: 80, y: 200, w: 340, h: 20, size: 13, spacing: 0.35, font: 'Montserrat, sans-serif', weight: 600, color: '#2a6f97' }),
        T({ text: '{partner1}\n&\n{partner2}', x: 80, y: 240, w: 340, h: 200, size: 46, lineHeight: 1.15, font: '"Playfair Display", serif', italic: true, color: '#1f3a5f' }),
        T({ text: '{date}', x: 80, y: 460, w: 340, h: 40, size: 30, spacing: 0.1, font: '"Playfair Display", serif', color: '#1f3a5f' }),
        T({ text: '{ceremony}', x: 80, y: 510, w: 340, h: 24, size: 15, upper: true, spacing: 0.2, font: 'Montserrat, sans-serif', weight: 300, color: '#2a6f97' }),
      ],
    },
    {
      name: t('Save the date (landscape)', 'Save the date (οριζόντιο)'), canvas: { w: 600, h: 400 }, background: { color: '#f8f1e5' },
      elements: [
        { id: id(), type: 'shape', shape: 'rect', x: 300, y: 0, w: 300, h: 400, fill: '#c9a9a6', strokeWidth: 0, radius: 0 },
        { id: id(), type: 'ornament', ornament: 'rings', color: '#ffffff', x: 390, y: 120, w: 120, h: 80 },
        T({ text: 'Save\nthe date', x: 330, y: 220, w: 240, h: 110, size: 44, lineHeight: 1, font: '"Great Vibes", cursive', color: '#ffffff' }),
        T({ text: '{couple}', x: 30, y: 120, w: 240, h: 80, size: 34, font: '"Cormorant Garamond", serif', color: '#3a3a3a' }),
        { id: id(), type: 'line', x: 110, y: 210, w: 80, h: 2, color: '#c9a9a6', thickness: 1 },
        T({ text: '{date_long}', x: 30, y: 230, w: 240, h: 50, size: 16, upper: true, spacing: 0.12, font: '"Cormorant Garamond", serif', color: '#555' }),
        T({ text: t('Invitation to follow', 'Ακολουθεί πρόσκληση'), x: 30, y: 300, w: 240, h: 20, size: 13, italic: true, font: '"Cormorant Garamond", serif', color: '#8a8a8a' }),
      ],
    },
    {
      name: t('Menu card', 'Μενού'), canvas: { w: 400, h: 900 }, background: { color: '#fbf8f2' },
      elements: [
        { id: id(), type: 'ornament', ornament: 'leaves', color: '#7d8f69', x: 75, y: 60, w: 250, h: 34 },
        T({ text: 'Menu', x: 40, y: 110, w: 320, h: 70, size: 56, font: '"Great Vibes", cursive', color: '#3a3a3a' }),
        T({ text: '{couple} · {date}', x: 40, y: 190, w: 320, h: 20, size: 12, upper: true, spacing: 0.2, font: '"Cormorant Garamond", serif', color: '#8a8a8a' }),
        T({ text: 'TO START\nGreek meze platter\n\nMAIN\nSlow-roasted lamb kleftiko\nor sea bass with lemon & olive oil\n\nDESSERT\nGalaktoboureko with thyme honey', x: 40, y: 260, w: 320, h: 420, size: 18, lineHeight: 1.6, font: '"Cormorant Garamond", serif', color: '#3a3a3a' }),
        { id: id(), type: 'ornament', ornament: 'dots', color: '#b08d57', x: 100, y: 800, w: 200, h: 16 },
      ],
    },
  ];
}
