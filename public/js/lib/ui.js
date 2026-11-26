// Small UI toolkit: element builder, icons, sheets, alerts, menus, toasts, drag & drop, formatting.

export function h(tag, props, ...children) {
  const svgTags = /^(svg|path|circle|ellipse|g|rect|line|polyline|polygon|defs|linearGradient|radialGradient|stop|text|use|clipPath)$/;
  const el = svgTags.test(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'value' && 'value' in el && !svgTags.test(tag)) el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled' || k === 'multiple') el[k] = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false || c === true) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.append(c);
    else el.append(document.createTextNode(String(c)));
  }
}
export const frag = (...c) => { const f = document.createDocumentFragment(); append(f, c); return f; };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// --------------------------------------------------------------------------- icons (SF Symbols–style line icons)
const P = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9v11h4.5v-6h4v6h4.5V9',
  guests: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5zM20 19v-1.4a3.3 3.3 0 0 0-2.5-3.2M15.5 4.2a3.25 3.25 0 0 1 0 6.1',
  seating: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 3.5v1.5M12 19v1.5M3.5 12H5M19 12h1.5M6 6l1 1M17 17l1 1M6 18l1-1M17 7l1-1',
  invite: 'M3.5 6.5h17v11h-17zM3.8 7l8.2 6.3L20.2 7',
  timeline: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4.5 18h1',
  calendar: 'M4 6.5h16v13.5H4zM4 10.5h16M8.5 4v4M15.5 4v4',
  budget: 'M17.5 7.5A6.5 6.5 0 1 0 17.5 16.5M5 10.5h8M5 13.5h8',
  vendors: 'M4 9.5 5.5 4.5h13L20 9.5M4 9.5c0 1.4 1.1 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.1 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1 2.5 2.6 2.5S20 10.9 20 9.5M5.5 12v7.5h13V12M10 19.5v-4h4v4',
  style: 'M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2a4.6 4.6 0 0 0 4.6-4.6C21 6.9 17 3.5 12 3.5zM7.5 12.5h.01M9.5 8h.01M14.5 8h.01M17 11.5h.01',
  flower: 'M12 14.5v6.5M12 21c-3 0-5-2-5.5-4.5 2.5 0 4.6 1.5 5.5 4.5zM12 21c3 0 5-2 5.5-4.5-2.5 0-4.6 1.5-5.5 4.5zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 7c-1.2-3 1.2-4.5 0-4.5S10.8 4 12 7zm2 2c3-1.2 4.5 1.2 4.5 0S17 7.8 14 9zm-2 2c1.2 3-1.2 4.5 0 4.5S13.2 14 12 11zM10 9c-3 1.2-4.5-1.2-4.5 0S7 10.2 10 9z',
  menu_food: 'M6 3.5v7.5a2 2 0 0 0 4 0V3.5M8 3.5v17M16.5 20.5V3.5c-2 1-3.5 3.5-3.5 7s1.5 4 3.5 4',
  music: 'M9 18V5.5l11-2V16M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM9 9.5l11-2',
  inspo: 'M4 4.5h7v7H4zM13 4.5h7v4.5h-7zM13 11h7v8.5h-7zM4 13.5h7v6H4z',
  dayof: 'M12 21a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 7.5V12.5l3 2',
  notes: 'M6 3.5h9l4 4v13H6zM14.5 3.5V8H19M9 12h7M9 15.5h7M9 8.5h2',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  team: 'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20.5c0-3.6 3.1-6 7-6s7 2.4 7 6M18.5 4.5l1 1 2-2',
  plus: 'M12 5v14M5 12h14',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20',
  chevron: 'M9 5.5 15.5 12 9 18.5',
  chevronL: 'M15 5.5 8.5 12l6.5 6.5',
  chevronD: 'M5.5 9 12 15.5 18.5 9',
  x: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  trash: 'M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l.9 13h9.2l.9-13M10 10.5v6M14 10.5v6',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  more: 'M5.5 12h.01M12 12h.01M18.5 12h.01',
  download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
  upload: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14',
  print: 'M7 9V3.5h10V9M7 17.5H4.5V9h15v8.5H17M7 14h10v6.5H7z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  copy: 'M8.5 8.5h11v11h-11zM15.5 8.5v-4h-11v11h4',
  wand: 'M4 20 15 9M14 4l.6 1.9L16.5 6.5l-1.9.6L14 9l-.6-1.9-1.9-.6 1.9-.6zM19 10l.4 1.1 1.1.4-1.1.4L19 13l-.4-1.1-1.1-.4 1.1-.4zM8 3.5l.4 1.1 1.1.4-1.1.4L8 6.5l-.4-1.1L6.5 5l1.1-.4z',
  heart: 'M12 20s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.6-7.5 10-7.5 10z',
  star: 'M12 3.8l2.5 5.3 5.7.7-4.2 3.9 1.1 5.7L12 16.6l-5.1 2.8 1.1-5.7-4.2-3.9 5.7-.7z',
  lock: 'M6.5 10.5h11v9.5h-11zM8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3',
  unlock: 'M6.5 10.5h11v9.5h-11zM8.5 10.5V7.5a3.5 3.5 0 0 1 6.8-1.2',
  alert: 'M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.2h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.7h.01',
  ring: 'M12 21a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM9 8.5 7.5 5 9.5 3h5L16.5 5 15 8.5M9.5 3l2.5 3 2.5-3',
  hamburger: 'M4 7h16M4 12h16M4 17h16',
  logout: 'M15 4.5h4.5v15H15M10 8l-4 4 4 4M6 12h10',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z',
  text: 'M5 6.5V5h14v1.5M12 5v14M9 19h6',
  square: 'M5 5h14v14H5z',
  circle: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  line: 'M4 12h16',
  image: 'M4 5h16v14H4zM4 15.5l4.5-4.5 4 4 2.5-2.5 5 5M15.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  layers: 'M12 4 3 8.5l9 4.5 9-4.5zM3 12.5l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  phone: 'M5 4h3.5L10 8l-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.5 20 4 13.5 3.5 5.6A1.5 1.5 0 0 1 5 4z',
  at: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1',
  map: 'M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  send: 'M20.5 3.5 10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z',
  filter: 'M4 5.5h16l-6.2 7.3v5.7l-3.6 1.8v-7.5z',
  sliders: 'M5 20v-6M5 10V4M12 20v-8M12 8V4M19 20v-4M19 12V4M2.5 14h5M9.5 8h5M16.5 16h5',
  list: 'M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  shuffle: 'M3.5 7h3.5c4 0 6 10 10 10h3.5M18 14.5l2.5 2.5-2.5 2.5M3.5 17h3.5c1.5 0 2.6-1.3 3.5-3M18 4.5 20.5 7 18 9.5M13.5 10c.9-1.7 2-3 3.5-3h3.5',
  pin: 'M12 21v-6M7 4.5h10L15.5 9l2.5 3H6l2.5-3z',
  sparkle: 'M12 3.5l1.8 5.4 5.7 1.8-5.7 1.8L12 18l-1.8-5.5-5.7-1.8 5.7-1.8zM19 16l.6 1.6 1.4.4-1.4.5-.6 1.5-.5-1.5-1.5-.5 1.5-.4z',
  gift: 'M4 9.5h16v4H4zM5.5 13.5h13v7h-13zM12 9.5v11M12 9.5S10.5 4 8 4.5s-1 5 4 5zm0 0s1.5-5.5 4-5 1 5-4 5z',
  clipboard: 'M8.5 4.5h7v3h-7zM8.5 5.5H5.5v15h13v-15h-3M8.5 12h7M8.5 15.5h5',
  euro: 'M17.5 6.5a6 6 0 1 0 0 11M4.5 10.5h9M4.5 13.5h9',
  refresh: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
  undo: 'M9 14 4.5 9.5 9 5M5 9.5h9.5a5 5 0 0 1 0 10H11',
  expand: 'M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15',
  zoomin: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20M8 10.5h5M10.5 8v5',
  zoomout: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20M8 10.5h5',
  person: 'M12 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5zM5 20.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5',
  key: 'M14.5 13a4.5 4.5 0 1 0-4.2-2.9L3.5 17v3.5H7v-2h2v-2h2l1.9-1.9a4.5 4.5 0 0 0 1.6.4zM16 8.5h.01',
  cake: 'M4.5 20.5h15v-7h-15zM4.5 16c2 1 3.5-1 5-1s3 2 5 1 3.5-1 5-.5M7.5 13.5V11M12 13.5V11M16.5 13.5V11M12 8.5c-.8 0-1.3-.6-1.3-1.3S12 4.5 12 4.5s1.3 1.9 1.3 2.7-.5 1.3-1.3 1.3z',
  camera: 'M4 8h3.5l1.5-2.5h6L16.5 8H20v11.5H4zM12 16.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z',
};
const FILLED = { spotify: true, pinterest: true, instagram: true };
const BRAND = {
  spotify: '<path fill="currentColor" d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm4.4 13.7a.6.6 0 0 1-.8.2c-2.3-1.4-5.1-1.7-8.5-.9a.6.6 0 1 1-.3-1.2c3.7-.8 6.8-.5 9.4 1.1.3.2.4.5.2.8zm1.2-2.6a.7.7 0 0 1-1 .2c-2.6-1.6-6.5-2.1-9.6-1.1a.7.7 0 1 1-.4-1.4c3.5-1.1 7.8-.6 10.8 1.3.3.2.4.7.2 1zm.1-2.8C14.6 9 9.5 8.8 6.6 9.7a.85.85 0 1 1-.5-1.6c3.4-1 9-.8 12.5 1.3a.85.85 0 1 1-.9 1.4z"/>',
  pinterest: '<path fill="currentColor" d="M12 2.5a9.5 9.5 0 0 0-3.5 18.3c-.1-.8-.1-1.9 0-2.7l1.2-5.1s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-1.9 3.1-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.6 2.2-4.6 4.4 0 .9.3 1.8.8 2.3.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2.9-.9 2.1-1.3 2.8A9.5 9.5 0 1 0 12 2.5z"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/>',
};
export function icon(name, cls) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('aria-hidden', 'true');
  // Default size so an icon never stretches to fill its container; CSS rules can still resize it.
  el.setAttribute('width', '18');
  el.setAttribute('height', '18');
  el.setAttribute('class', `icon${cls ? ` ${cls}` : ''}`);
  if (FILLED[name]) el.innerHTML = BRAND[name];
  else el.innerHTML = `<path d="${P[name] || P.info}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  return el;
}

// --------------------------------------------------------------------------- formatting
const LOCALE = navigator.language || 'en-GB';
export function money(n, currency = 'EUR', opts = {}) {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency, maximumFractionDigits: opts.decimals ?? (Math.abs(v) % 1 ? 2 : 0), minimumFractionDigits: 0 }).format(v);
  } catch { return `${v.toFixed(0)} ${currency}`; }
}
export const num = (n) => new Intl.NumberFormat(LOCALE).format(Number(n) || 0);
export function parseNum(v) {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').replace(/[^\d,.-]/g, '');
  if (!s) return 0;
  // Accept both 1.234,56 and 1,234.56
  const lastComma = s.lastIndexOf(','); const lastDot = s.lastIndexOf('.');
  const dec = lastComma > lastDot ? ',' : '.';
  const clean = s.replace(dec === ',' ? /\./g : /,/g, '').replace(',', '.');
  return Number(clean) || 0;
}
export function toDate(iso) { return iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`) : null; }
export function isoDate(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
export const today = () => isoDate(new Date());
export function addDays(iso, n) { const d = toDate(iso); d.setDate(d.getDate() + n); return isoDate(d); }
export function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / 86400000); }
export function fmtDate(iso, style = 'medium') {
  if (!iso) return '';
  const d = toDate(iso);
  const o = style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : style === 'short' ? { day: 'numeric', month: 'short' }
      : style === 'month' ? { month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat(LOCALE, o).format(d);
}
export function relDay(iso) {
  if (!iso) return '';
  const n = daysBetween(today(), iso);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${-n} days ago`;
  if (n < 14) return `In ${n} days`;
  return fmtDate(iso, 'short');
}
export function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(isoDate(ts), 'short');
}
export const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('') || '?';
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const uid = () => Math.random().toString(36).slice(2, 10);
export function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// --------------------------------------------------------------------------- toasts
let toastRoot;
export function toast(message, { error = false, action, duration = 3200 } = {}) {
  if (!toastRoot) { toastRoot = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.append(toastRoot); }
  const t = h('div', { class: ['toast', error && 'err'] }, message,
    action && h('button', { onclick: () => { action.onClick(); t.remove(); } }, action.label));
  toastRoot.append(t);
  setTimeout(() => t.remove(), error ? 5500 : duration);
}

// --------------------------------------------------------------------------- sheets (modal dialogs)
const openSheets = [];
export function sheet({ title, body, done, doneLabel = 'Done', cancelLabel = 'Cancel', size, footer, onClose, noCancel, destructive }) {
  const content = h('div', { class: 'sheet-body' });
  const doneBtn = done ? h('button', { class: ['btn', 'primary', destructive && 'danger'], onclick: async () => {
    doneBtn.disabled = true;
    try { if ((await done()) !== false) close(); } catch (e) { toast(e.message, { error: true }); } finally { doneBtn.disabled = false; }
  } }, doneLabel) : null;
  const panel = h('div', { class: ['sheet', size], role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'grabber' }),
    h('div', { class: 'sheet-head' },
      noCancel ? h('span', { style: { minWidth: '70px' } }) : h('button', { class: 'btn plain', onclick: () => close() }, done ? cancelLabel : 'Close'),
      h('h2', null, title),
      doneBtn || h('span', { style: { minWidth: '70px' } })),
    content,
    footer ? h('div', { class: 'sheet-foot' }, footer) : null);
  const back = h('div', { class: 'backdrop', onmousedown: (e) => { if (e.target === back) close(); } }, panel);
  function close() {
    if (!back.isConnected) return;
    back.remove();
    openSheets.splice(openSheets.indexOf(api), 1);
    onClose?.();
  }
  const api = { close, el: panel, body: content, setBody(n) { content.replaceChildren(n); } };
  content.append(typeof body === 'function' ? body(api) : body);
  document.body.append(back);
  openSheets.push(api);
  setTimeout(() => { if (!panel.contains(document.activeElement)) panel.querySelector('input:not([type=checkbox]):not([type=color]),textarea,select')?.focus(); }, 60);
  return api;
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.querySelector('.menu-pop')) return closeMenu();
    openSheets.at(-1)?.close();
  }
});

export function confirmBox({ title, message, confirm = 'OK', cancel = 'Cancel', destructive = false }) {
  return new Promise((resolve) => {
    const finish = (v) => { back.remove(); resolve(v); };
    const back = h('div', { class: 'backdrop' },
      h('div', { class: 'sheet alert-box', role: 'alertdialog' },
        h('div', { class: 'sheet-body' }, h('h2', null, title), message && h('p', { class: 'small muted' }, message)),
        h('div', { class: 'btns' },
          h('button', { onclick: () => finish(false) }, cancel),
          h('button', { class: destructive ? 'destructive' : 'strong', onclick: () => finish(true) }, confirm))));
    document.body.append(back);
    back.querySelector('.btns button:last-child').focus();
  });
}

export function promptBox({ title, label, value = '', placeholder = '', confirm = 'Save', multiline = false }) {
  return new Promise((resolve) => {
    const inp = multiline ? h('textarea', { class: 'input', value, placeholder, rows: 4 }) : h('input', { class: 'input', value, placeholder });
    let result = null;
    sheet({
      title, size: 'narrow', doneLabel: confirm,
      body: h('div', { class: 'field' }, label && h('label', null, label), inp),
      done: () => { result = inp.value.trim(); },
      onClose: () => resolve(result),
    });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !multiline) { e.preventDefault(); inp.closest('.sheet').querySelector('.sheet-head .btn.primary').click(); } });
  });
}

// --------------------------------------------------------------------------- context menus
let menuEl;
export function closeMenu() { menuEl?.remove(); menuEl = null; }
export function menu(anchor, items) {
  closeMenu();
  menuEl = h('div', { class: 'menu-pop', role: 'menu' }, items.filter(Boolean).map((it) => {
    if (it === '-') return h('hr');
    if (it.header) return h('div', { class: 'mh' }, it.header);
    return h('button', { role: 'menuitem', class: it.danger && 'danger', onclick: () => { closeMenu(); it.onClick(); } },
      it.icon ? icon(it.icon) : it.color ? h('span', { class: 'color-dot', style: { background: it.color } }) : h('span', { style: { width: '16px' } }), it.label,
      it.checked ? h('span', { style: { marginLeft: 'auto' } }, icon('check')) : null);
  }));
  document.body.append(menuEl);
  const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: anchor.clientX, right: anchor.clientX, bottom: anchor.clientY, top: anchor.clientY };
  const mw = menuEl.offsetWidth; const mh = menuEl.offsetHeight;
  let left = r.right - mw; if (left < 8) left = Math.min(r.left, window.innerWidth - mw - 8);
  let top = r.bottom + 6; if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
  Object.assign(menuEl.style, { left: `${Math.max(8, left)}px`, top: `${top}px` });
  setTimeout(() => document.addEventListener('mousedown', function off(e) {
    if (menuEl && !menuEl.contains(e.target)) { closeMenu(); document.removeEventListener('mousedown', off); }
  }), 0);
}

// --------------------------------------------------------------------------- form controls
export function seg(options, value, onChange, cls) {
  const el = h('div', { class: ['seg', cls], role: 'tablist' }, options.map((o) => {
    const opt = typeof o === 'string' ? { value: o, label: o } : o;
    return h('button', { type: 'button', class: opt.value === value && 'on', role: 'tab', 'aria-selected': String(opt.value === value), title: opt.title,
      onclick: () => onChange(opt.value) }, opt.icon && icon(opt.icon), opt.label);
  }));
  return el;
}
export function toggle(checked, onChange, label) {
  const inp = h('input', { type: 'checkbox', checked, onchange: () => onChange(inp.checked), 'aria-label': label || 'Toggle' });
  return h('label', { class: 'switch' }, inp, h('span'));
}
export function field(label, control, hint) {
  return h('div', { class: 'field' }, label && h('label', null, label), control, hint && h('div', { class: 'hint' }, hint));
}
export function input(props = {}) { return h('input', { class: 'input', ...props }); }
export function select(options, value, onChange, props = {}) {
  const el = h('select', { class: 'input', ...props, onchange: () => onChange?.(el.value) }, options.map((o) => {
    const opt = typeof o === 'string' ? { value: o, label: o } : o;
    return h('option', { value: opt.value, selected: String(opt.value) === String(value ?? '') }, opt.label);
  }));
  return el;
}
export function checkCircle(on, onClick, label = 'Mark as done') {
  return h('button', { class: ['check', on && 'on'], onclick: (e) => { e.stopPropagation(); onClick(); }, 'aria-label': label, 'aria-pressed': String(!!on) }, icon('check'));
}
export function stars(value, onChange) {
  return h('span', { class: 'stars' }, [1, 2, 3, 4, 5].map((n) => h('button', {
    type: 'button', class: n <= (value || 0) && 'on', 'aria-label': `${n} star${n > 1 ? 's' : ''}`, onclick: (e) => { e.stopPropagation(); onChange?.(n === value ? 0 : n); },
  }, '★')));
}
export function emptyState(ic, title, text, action) {
  return h('div', { class: 'empty' }, h('div', { class: 'ic' }, icon(ic)), h('h3', null, title), text && h('p', null, text), action);
}
export function tagInput(values, onChange, { suggestions = [], placeholder = 'Add…' } = {}) {
  let vals = [...(values || [])];
  const wrap = h('div', { class: 'chips', style: { alignItems: 'center' } });
  const inp = h('input', { class: 'input s', placeholder, style: { width: '140px' }, list: '' });
  const dl = h('datalist', { id: `dl-${uid()}` }, suggestions.map((s) => h('option', { value: s })));
  inp.setAttribute('list', dl.id);
  const add = () => { const v = inp.value.trim(); if (v && !vals.includes(v)) { vals.push(v); onChange(vals); } inp.value = ''; render(); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } });
  inp.addEventListener('change', add);
  function render() {
    wrap.replaceChildren(...vals.map((v) => h('span', { class: 'chip accent' }, v, h('button', { class: 'btn plain s', style: { height: '18px', padding: '0 2px' }, 'aria-label': `Remove ${v}`, onclick: () => { vals = vals.filter((x) => x !== v); onChange(vals); render(); } }, '×'))), inp, dl);
  }
  render();
  return wrap;
}

// --------------------------------------------------------------------------- drag & drop (pointer based: mouse, pen and touch)
const dropHandlers = new WeakMap();
export function droppable(el, handler) { el.dataset.drop = '1'; dropHandlers.set(el, handler); return el; }
export function draggable(el, payload, { onClick, handleSelector } = {}) {
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (handleSelector && !e.target.closest(handleSelector)) return;
    if (!handleSelector && e.target.closest('button,input,select,textarea,a')) return;
    const sx = e.clientX; const sy = e.clientY;
    let ghost = null; let over = null;
    const move = (ev) => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        ghost = el.cloneNode(true);
        ghost.classList.add('drag-ghost');
        ghost.style.width = `${el.offsetWidth}px`;
        document.body.append(ghost);
        el.classList.add('dragging-src');
      }
      ev.preventDefault();
      ghost.style.left = `${ev.clientX}px`; ghost.style.top = `${ev.clientY}px`;
      const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-drop]');
      if (t !== over) { over?.classList.remove('drop-hover'); over = t; over?.classList.add('drop-hover'); }
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.classList.remove('dragging-src');
      over?.classList.remove('drop-hover');
      if (ghost) { ghost.remove(); if (over && ev.type === 'pointerup') dropHandlers.get(over)?.(payload, ev, over); }
      else if (ev.type === 'pointerup') onClick?.(ev);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
  return el;
}

// Drag to reorder rows inside a container. onReorder(idsInNewOrder)
export function sortable(container, onReorder, itemSelector = '[data-id]') {
  container.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.handle');
    if (!handle) return;
    const item = handle.closest(itemSelector);
    if (!item) return;
    e.preventDefault();
    item.style.opacity = '.5';
    const move = (ev) => {
      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(itemSelector);
      if (!target || target === item || target.parentElement !== item.parentElement) return;
      const r = target.getBoundingClientRect();
      target.parentElement.insertBefore(item, ev.clientY < r.top + r.height / 2 ? target : target.nextSibling);
    };
    const up = () => {
      item.style.opacity = '';
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onReorder([...item.parentElement.querySelectorAll(itemSelector)].map((x) => x.dataset.id));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

// --------------------------------------------------------------------------- files: download, CSV, print, images
export function download(filename, content, type = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function toCsv(rows) {
  return `﻿${rows.map((r) => r.map((c) => {
    const s = String(c ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\r\n')}`;
}
export function parseCsv(text) {
  const t = text.replace(/^﻿/, '');
  const firstLine = t.split(/\r?\n/)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : (firstLine.includes('\t') ? '\t' : ',');
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
export function printHtml(title, bodyHtml, extraCss = '') {
  const frame = h('iframe', { style: { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' } });
  document.body.append(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link href="${FONT_URL}" rel="stylesheet">
  <style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#1d1d1f;margin:28px;font-size:12pt}
  h1{font-family:ui-serif,Georgia,serif;font-weight:400;font-size:26pt;margin:0 0 4px}
  h2{font-size:14pt;margin:18px 0 6px} .muted{color:#6e6e73} table{border-collapse:collapse;width:100%}
  th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;font-size:10.5pt;vertical-align:top} th{font-size:9pt;color:#6e6e73;text-transform:uppercase;letter-spacing:.04em}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.box{border:1px solid #ddd;border-radius:10px;padding:12px;break-inside:avoid}
  @page{margin:14mm} ${extraCss}</style></head><body>${bodyHtml}</body></html>`);
  doc.close();
  const go = () => { frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(() => frame.remove(), 1500); };
  if (doc.fonts?.ready) doc.fonts.ready.then(() => setTimeout(go, 250)); else setTimeout(go, 600);
}
export function pickFile(accept = 'image/*') {
  return new Promise((resolve) => {
    const inp = h('input', { type: 'file', accept, style: { display: 'none' } });
    inp.addEventListener('change', () => { resolve(inp.files[0] || null); inp.remove(); });
    document.body.append(inp); inp.click();
  });
}
// Downscale an image file to a compact JPEG/PNG data URL suitable for storing in the database.
export function imageToDataUrl(file, maxSize = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = h('canvas', { width: Math.round(img.width * scale), height: Math.round(img.height * scale) });
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const png = file.type === 'image/png' && c.width * c.height < 400000;
      resolve(c.toDataURL(png ? 'image/png' : 'image/jpeg', quality));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = URL.createObjectURL(file);
  });
}
export async function copyText(text, msg = 'Copied') {
  try { await navigator.clipboard.writeText(text); toast(msg); } catch { await promptBox({ title: 'Copy this', value: text, confirm: 'Done' }); }
}

export const FONTS = [
  { name: 'Cormorant Garamond', css: '"Cormorant Garamond", serif' },
  { name: 'Playfair Display', css: '"Playfair Display", serif' },
  { name: 'EB Garamond', css: '"EB Garamond", serif' },
  { name: 'Cinzel', css: 'Cinzel, serif' },
  { name: 'Lora', css: 'Lora, serif' },
  { name: 'Great Vibes', css: '"Great Vibes", cursive' },
  { name: 'Parisienne', css: 'Parisienne, cursive' },
  { name: 'Allura', css: 'Allura, cursive' },
  { name: 'Pinyon Script', css: '"Pinyon Script", cursive' },
  { name: 'Dancing Script', css: '"Dancing Script", cursive' },
  { name: 'Montserrat', css: 'Montserrat, sans-serif' },
  { name: 'Jost', css: 'Jost, sans-serif' },
  { name: 'Manrope', css: 'Manrope, sans-serif' },
  { name: 'System', css: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
];
export const FONT_URL = 'https://fonts.googleapis.com/css2?family=Allura&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Dancing+Script:wght@400;600&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Jost:wght@300;400;600&family=Lora:ital,wght@0,400;0,600;1,400&family=Manrope:wght@300;400;700&family=Montserrat:wght@300;400;600&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap';
let fontsLoaded = false;
export function loadFonts() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  document.head.append(h('link', { rel: 'stylesheet', href: FONT_URL }));
}
