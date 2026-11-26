// Bomboniere (μπομπονιέρες): containers, koufeta, decorations, tag — drawn as SVG.
import { shade } from './color.js';
import { drawFlower, flowerById } from './flowers.js';

export const CONTAINERS = [
  { value: 'tulle', label: 'Tulle bundle', greek: 'Τούλι', price: [1.5, 4], note: 'The classic: koufeta wrapped in tulle and tied with ribbon.' },
  { value: 'pouch', label: 'Linen pouch', greek: 'Λινό πουγκί', price: [2.5, 6], note: 'Natural linen or cotton bag with a drawstring; can be printed.' },
  { value: 'box', label: 'Gift box', greek: 'Κουτάκι', price: [2, 6], note: 'Paper or card box tied with ribbon.' },
  { value: 'jar', label: 'Glass jar', greek: 'Γυάλινο βαζάκι', price: [3, 7], note: 'Koufeta show through the glass. Reusable.' },
  { value: 'dish', label: 'Ceramic dish', greek: 'Κεραμικό πιατάκι', price: [5, 12], note: 'A small handmade plate or bowl with koufeta wrapped on top.' },
  { value: 'bottle', label: 'Mini olive oil bottle', greek: 'Μπουκαλάκι λάδι', price: [4, 9], note: 'Local olive oil, ouzo or liqueur with a personalised label.' },
  { value: 'candle', label: 'Candle', greek: 'Κερί', price: [4, 10], note: 'Scented candle in glass; koufeta tied to the lid.' },
  { value: 'pot', label: 'Mini olive tree', greek: 'Ελαιόδεντρο σε γλαστράκι', price: [5, 12], note: 'A living favour in a terracotta pot.' },
  { value: 'cone', label: 'Paper cone', greek: 'Χάρτινο χωνάκι', price: [1, 3], note: 'Simple and budget friendly.' },
  { value: 'organza', label: 'Organza bag', greek: 'Οργάντζα πουγκί', price: [1, 3], note: 'Sheer drawstring bag: quick to fill, koufeta stay visible.' },
  { value: 'crate', label: 'Wooden box', greek: 'Ξύλινο κουτάκι', price: [4, 9], note: 'Natural wood with a sliding or hinged lid; can be engraved.' },
  { value: 'basket', label: 'Mini basket', greek: 'Ψάθινο καλαθάκι', price: [3, 7], note: 'Woven straw basket — rustic and summery.' },
  { value: 'tin', label: 'Round tin', greek: 'Μεταλλικό κουτάκι', price: [2, 5], note: 'Metal tin with a printed or stickered lid.' },
  { value: 'pillow', label: 'Pillow box', greek: 'Κουτί μαξιλαράκι', price: [1.5, 4], note: 'Curved paper box that folds shut; elegant and flat-packed.' },
  { value: 'soap', label: 'Olive oil soap', greek: 'Σαπούνι ελαιολάδου', price: [3, 6], note: 'Handmade Greek olive-oil soap wrapped in paper and twine, koufeta tied on.' },
  { value: 'honey', label: 'Mini honey jar', greek: 'Βαζάκι μέλι', price: [3, 7], note: 'Greek thyme honey with a wooden dipper — sweetness for the new life.' },
  { value: 'seeds', label: 'Seed packet', greek: 'Φακελάκι σπόρων', price: [1, 3], note: 'Wildflower or herb seeds: “let love grow”.' },
];
export const KOUFETA = [
  { value: '#fbfaf6', label: 'White' }, { value: '#f3ead6', label: 'Ivory' }, { value: '#f6d1d6', label: 'Pink' }, { value: '#bcd4ea', label: 'Light blue' },
  { value: '#d6d8dc', label: 'Silver' }, { value: '#e2c47a', label: 'Gold' }, { value: '#d9c6e8', label: 'Lilac' }, { value: '#c9dcc0', label: 'Sage' }, { value: '#6b4a35', label: 'Chocolate' },
];
export const DECOS = [
  { value: 'none', label: 'None' }, { value: 'flower', label: 'Dried flower' }, { value: 'olive', label: 'Olive sprig' }, { value: 'lavender', label: 'Lavender sprig' },
  { value: 'mati', label: 'Mati (evil eye) charm' }, { value: 'heart', label: 'Heart charm' }, { value: 'lace', label: 'Lace band' }, { value: 'seal', label: 'Wax seal' },
];
export const MATERIALS = ['#ffffff', '#f3ead6', '#e8dcc4', '#f6d1d6', '#d9e6f2', '#c9dcc0', '#d9c6e8', '#c4a484', '#1d1d1f'];

const n2 = (v) => Math.round(v * 10) / 10;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function almond(x, y, c, a = 0, s = 1) {
  return `<g transform="translate(${n2(x)} ${n2(y)}) rotate(${n2(a)}) scale(${s})"><ellipse rx="9" ry="6" fill="${c}" stroke="${shade(c, -14)}" stroke-width=".6"/><ellipse cx="-3" cy="-2.2" rx="3.5" ry="1.5" fill="#fff" opacity=".55"/></g>`;
}
function pile(cx, cy, count, colors, spread = 1) {
  const pos = [];
  const rows = count <= 3 ? [count] : count <= 5 ? [3, 2] : count <= 7 ? [4, 3] : count <= 9 ? [4, 3, 2] : [5, 4, 2];
  let k = 0;
  rows.forEach((n, ri) => { for (let i = 0; i < n && k < count; i++, k++) pos.push([cx + (i - (n - 1) / 2) * 15 * spread, cy - ri * 9 * spread, (i * 37 + ri * 21) % 50 - 25]); });
  return pos.map(([x, y, a], i) => almond(x, y, colors[i % colors.length], a)).join('');
}
function bow(x, y, c, s = 1) {
  const d = shade(c, -15);
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-22 -16 -28 8 -2 3Z M0 0 C22 -16 28 8 2 3Z" fill="${c}" stroke="${d}"/><path d="M-1 3 C-6 14 -10 22 -14 30 M1 3 C6 14 10 22 14 30" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/><circle r="4" fill="${shade(c, -6)}" stroke="${d}"/></g>`;
}
function tag(x, y, d) {
  if (!d.tagText1 && !d.tagText2) return '';
  const font = d.font || '"Great Vibes", cursive';
  const shape = d.tagShape || 'round';
  const body = shape === 'rect' ? '<rect x="-38" y="-20" width="76" height="40" rx="3" fill="#fffdf8" stroke="#d8cfc0"/>'
    : shape === 'label' ? '<path d="M-36 -18 L30 -18 L40 0 L30 18 L-36 18Z" fill="#fffdf8" stroke="#d8cfc0"/>'
      : '<circle r="26" fill="#fffdf8" stroke="#d8cfc0"/>';
  return `<g transform="translate(${x} ${y}) rotate(${d.tagTilt ?? -6})"><path d="M0 ${shape === 'round' ? -26 : -18} L-6 -44" stroke="${shade(d.ribbon || '#ccc', -10)}" stroke-width="1"/>${body}
    <text y="${d.tagText2 ? -1 : 4}" text-anchor="middle" font-family='${font}' font-size="${shape === 'round' ? 10 : 11}" fill="${d.tagInk || '#3a3a3a'}">${esc(d.tagText1 || '')}</text>
    ${d.tagText2 ? `<text y="11" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="6.5" letter-spacing=".8" fill="#777">${esc(d.tagText2)}</text>` : ''}</g>`;
}
function deco(kind, x, y, d) {
  if (kind === 'flower') { const f = flowerById(d.decoFlower || 'gypsophila'); return f ? `<g transform="translate(${x} ${y}) scale(${f.shape === 'gypsophila' || f.shape === 'waxflower' || f.shape === 'lavender' ? 0.45 : 0.32}) rotate(-20)">${drawFlower(f.shape, d.decoColor || f.colors[0])}</g>` : ''; }
  if (kind === 'olive') return `<g transform="translate(${x} ${y}) rotate(-35) scale(.5)">${drawFlower('olive', '#7d8f69')}</g>`;
  if (kind === 'lavender') return `<g transform="translate(${x} ${y}) rotate(-25) scale(.55)">${drawFlower('lavender', '#8f7bbf')}</g><g transform="translate(${x + 6} ${y}) rotate(-12) scale(.55)">${drawFlower('lavender', '#8f7bbf')}</g>`;
  if (kind === 'mati') return `<g transform="translate(${x} ${y})"><circle r="8" fill="#1f5fae"/><circle r="5.2" fill="#fff"/><circle r="3.4" fill="#6fb3e8"/><circle r="1.7" fill="#0c1f3a"/></g>`;
  if (kind === 'heart') return `<path transform="translate(${x} ${y}) scale(.6)" d="M0 8 C-14 -2 -12 -14 -4 -14 C0 -14 0 -10 0 -10 C0 -10 0 -14 4 -14 C12 -14 14 -2 0 8Z" fill="#d4af37" stroke="#a8862a"/>`;
  if (kind === 'seal') return `<g transform="translate(${x} ${y})"><path d="M-11 0 C-12 -8 -6 -12 0 -11 C7 -12 12 -7 11 0 C12 7 7 12 0 11 C-7 12 -12 7 -11 0Z" fill="${d.ribbon ? shade(d.ribbon, -25) : '#8a1c2b'}"/><circle r="6.5" fill="none" stroke="#fff" stroke-opacity=".35"/><text y="3" text-anchor="middle" font-size="8" font-family="Cormorant Garamond, serif" fill="#fff" fill-opacity=".8">${esc((d.initials || '').slice(0, 3))}</text></g>`;
  return '';
}

export function favorSvg(d) {
  const mat = d.material || '#ffffff'; const rib = d.ribbon || '#c9a9a6';
  const k = Math.max(1, Math.min(11, Number(d.count) || 5)); const kc = d.koufeta?.length ? d.koufeta : ['#fbfaf6'];
  const dk = d.deco || 'none';
  let s = '';
  switch (d.container || 'tulle') {
    case 'tulle':
      s = `<ellipse cx="100" cy="168" rx="58" ry="10" fill="#000" opacity=".06"/>${pile(100, 150, k, kc)}
      <path d="M44 160 C40 120 70 96 92 92 L108 92 C130 96 160 120 156 160 C150 176 50 176 44 160Z" fill="${mat}" fill-opacity=".45" stroke="${shade(mat, -20)}" stroke-opacity=".6"/>
      <path d="M92 92 C84 70 70 60 60 56 C74 66 82 64 90 60 C92 70 98 66 100 58 C102 66 108 70 110 60 C118 64 126 66 140 56 C130 60 116 70 108 92Z" fill="${mat}" fill-opacity=".6" stroke="${shade(mat, -20)}" stroke-opacity=".6"/>
      ${bow(100, 92, rib)}`;
      if (dk === 'lace') s += `<path d="M58 136 Q100 150 142 136" stroke="#fff" stroke-width="7" fill="none" stroke-dasharray="2 2" opacity=".95"/>`;
      s += tag(150, 118, d) + deco(dk, 112, 88, d);
      break;
    case 'pouch':
      s = `<ellipse cx="100" cy="172" rx="52" ry="9" fill="#000" opacity=".07"/><path d="M52 170 C46 140 50 100 60 82 L140 82 C150 100 154 140 148 170Z" fill="${mat}" stroke="${shade(mat, -18)}"/>
      <path d="M60 82 C56 70 64 64 72 70 C80 62 90 70 100 64 C110 70 120 62 128 70 C136 64 144 70 140 82" fill="${shade(mat, -4)}" stroke="${shade(mat, -18)}"/>
      <path d="M58 92 Q100 100 142 92" stroke="${rib}" stroke-width="3" fill="none"/><path d="M100 96 C96 112 90 120 84 130 M100 96 C104 112 112 122 118 128" stroke="${rib}" stroke-width="2.5" fill="none"/>
      <text x="100" y="140" text-anchor="middle" font-family='${d.font || '"Great Vibes", cursive'}' font-size="15" fill="${shade(mat, -50)}">${esc(d.tagText1 || '')}</text>
      <text x="100" y="154" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="8" letter-spacing="1" fill="${shade(mat, -40)}">${esc(d.tagText2 || '')}</text>`;
      s += deco(dk, 118, 98, d);
      break;
    case 'box':
      s = `<ellipse cx="100" cy="174" rx="56" ry="8" fill="#000" opacity=".07"/><path d="M54 98 L146 98 L146 168 L54 168Z" fill="${mat}" stroke="${shade(mat, -18)}"/>
      <path d="M48 84 L152 84 L152 104 L48 104Z" fill="${shade(mat, 4)}" stroke="${shade(mat, -18)}"/>
      <rect x="94" y="84" width="12" height="84" fill="${rib}"/><rect x="48" y="90" width="104" height="8" fill="${rib}" opacity=".95"/>${bow(100, 84, rib)}`;
      if (dk === 'lace') s += `<rect x="54" y="140" width="92" height="9" fill="#fff" opacity=".9"/><path d="M54 149 ${Array.from({ length: 23 }, (_, i) => `L${56 + i * 4} ${i % 2 ? 149 : 152}`).join(' ')}" fill="none" stroke="#fff"/>`;
      s += tag(132, 132, { ...d, tagShape: d.tagShape || 'rect' }) + deco(dk, 112, 80, d);
      break;
    case 'jar':
      s = `<ellipse cx="100" cy="174" rx="44" ry="7" fill="#000" opacity=".08"/>${pile(100, 160, k, kc)}${k > 5 ? pile(100, 135, Math.max(1, k - 5), kc.slice().reverse()) : ''}
      <path d="M62 96 C56 104 56 112 58 120 L58 162 C58 172 142 172 142 162 L142 120 C144 112 144 104 138 96Z" fill="#e8f3f6" fill-opacity=".35" stroke="#b9cfd6" stroke-width="2"/>
      <path d="M70 104 L70 160" stroke="#fff" stroke-width="5" opacity=".55" stroke-linecap="round"/>
      <rect x="64" y="78" width="72" height="18" rx="4" fill="${d.lid || '#c9a46a'}" stroke="${shade(d.lid || '#c9a46a', -20)}"/>
      <path d="M62 100 Q100 108 138 100" stroke="${rib}" stroke-width="5" fill="none"/>${bow(100, 104, rib, 0.7)}`;
      s += tag(138, 132, d) + deco(dk, 112, 74, d);
      break;
    case 'dish':
      s = `<ellipse cx="100" cy="166" rx="70" ry="12" fill="#000" opacity=".07"/><path d="M30 140 Q100 176 170 140 L162 156 Q100 182 38 156Z" fill="${mat}" stroke="${shade(mat, -20)}"/>
      <ellipse cx="100" cy="140" rx="70" ry="14" fill="${shade(mat, 5)}" stroke="${shade(mat, -20)}"/>
      <ellipse cx="100" cy="140" rx="52" ry="9" fill="none" stroke="${d.accent || '#2a6f97'}" stroke-width="2" stroke-dasharray="4 3"/>
      ${pile(100, 134, k, kc)}<path d="M60 136 C58 104 84 92 100 92 C116 92 142 104 140 136 Q100 146 60 136Z" fill="#fff" fill-opacity=".35" stroke="#ddd" stroke-opacity=".7"/>${bow(100, 94, rib, 0.8)}`;
      s += tag(152, 112, d) + deco(dk, 114, 88, d);
      break;
    case 'bottle':
      s = `<ellipse cx="100" cy="176" rx="30" ry="6" fill="#000" opacity=".08"/><path d="M90 40 L110 40 L110 70 C128 84 130 96 130 112 L130 168 C130 176 70 176 70 168 L70 112 C70 96 72 84 90 70Z" fill="#b9c46a" fill-opacity=".55" stroke="#8a9640" stroke-width="1.5"/>
      <path d="M78 110 L78 160" stroke="#fff" stroke-width="4" opacity=".4" stroke-linecap="round"/><rect x="90" y="28" width="20" height="16" rx="3" fill="#c4a484" stroke="#8e6f4e"/>
      <rect x="74" y="118" width="52" height="40" rx="4" fill="#fffdf8" stroke="#d8cfc0"/>
      <text x="100" y="138" text-anchor="middle" font-family='${d.font || '"Great Vibes", cursive'}' font-size="11" fill="#3a3a3a">${esc(d.tagText1 || '')}</text>
      <text x="100" y="150" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="6" letter-spacing=".8" fill="#777">${esc(d.tagText2 || '')}</text>
      <path d="M90 66 Q100 72 110 66" stroke="${rib}" stroke-width="5" fill="none"/>${bow(100, 68, rib, 0.6)}`;
      s += deco(dk, 112, 62, d);
      break;
    case 'candle':
      s = `<ellipse cx="100" cy="172" rx="44" ry="7" fill="#000" opacity=".08"/><path d="M60 96 L140 96 L140 166 C140 174 60 174 60 166Z" fill="#eef4f6" fill-opacity=".5" stroke="#b9cfd6" stroke-width="2"/>
      <path d="M64 112 L136 112 L136 164 C136 170 64 170 64 164Z" fill="${mat}"/><path d="M100 112 L100 102" stroke="#333" stroke-width="1.5"/>
      <rect x="56" y="84" width="88" height="14" rx="3" fill="${d.lid || '#c9a46a'}" stroke="${shade(d.lid || '#c9a46a', -20)}"/>
      ${pile(100, 78, Math.min(k, 5), kc, 0.8)}<path d="M74 82 C72 62 90 56 100 56 C110 56 128 62 126 82" fill="#fff" fill-opacity=".4" stroke="#ddd"/>${bow(100, 60, rib, 0.6)}
      <rect x="74" y="126" width="52" height="28" rx="3" fill="#fffdf8" stroke="#d8cfc0"/><text x="100" y="142" text-anchor="middle" font-family='${d.font || '"Great Vibes", cursive'}' font-size="10" fill="#3a3a3a">${esc(d.tagText1 || '')}</text>
      <text x="100" y="150.5" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="5.5" fill="#777">${esc(d.tagText2 || '')}</text>`;
      s += deco(dk, 114, 56, d);
      break;
    case 'pot':
      s = `<ellipse cx="100" cy="176" rx="40" ry="7" fill="#000" opacity=".08"/><g transform="translate(100 128)">${[-40, -10, 25, 50, -65].map((a) => `<g transform="rotate(${a}) scale(.62)">${drawFlower('olive', '#7d8f69')}</g>`).join('')}</g>
      <path d="M70 124 L130 124 L122 172 L78 172Z" fill="#c56a3c" stroke="#9a4f2a"/><rect x="66" y="118" width="68" height="12" rx="2" fill="#d27b4c" stroke="#9a4f2a"/>
      <path d="M70 126 Q100 134 130 126" stroke="${rib}" stroke-width="4" fill="none"/>${bow(118, 128, rib, 0.55)}`;
      s += tag(146, 150, d) + deco(dk, 80, 132, d);
      break;
    case 'cone':
      s = `<path d="M60 70 L140 70 L100 176Z" fill="${mat}" stroke="${shade(mat, -20)}"/><path d="M60 70 L140 70 L100 176Z" fill="url(#pp)" opacity=".07"/>${pile(100, 72, k, kc)}
      <path d="M78 116 Q100 122 122 116" stroke="${rib}" stroke-width="4" fill="none"/>${bow(100, 118, rib, 0.6)}`;
      s += tag(140, 128, d) + deco(dk, 112, 62, d);
      break;
    case 'organza':
      s = `<ellipse cx="100" cy="172" rx="48" ry="8" fill="#000" opacity=".06"/>${pile(100, 158, k, kc)}
      <path d="M58 168 C52 140 56 104 64 86 L136 86 C144 104 148 140 142 168 Q100 176 58 168Z" fill="${mat}" fill-opacity=".38" stroke="${shade(mat, -25)}" stroke-opacity=".6"/>
      <path d="M64 86 C60 72 70 66 78 72 C86 64 94 72 100 66 C106 72 114 64 122 72 C130 66 140 72 136 86" fill="${mat}" fill-opacity=".5" stroke="${shade(mat, -25)}" stroke-opacity=".5"/>
      <path d="M62 96 Q100 104 138 96" stroke="${rib}" stroke-width="2.5" fill="none"/>${bow(100, 100, rib, 0.7)}`;
      s += tag(146, 128, d) + deco(dk, 112, 92, d);
      break;
    case 'crate':
      s = `<ellipse cx="100" cy="174" rx="58" ry="8" fill="#000" opacity=".07"/><path d="M48 104 L152 104 L152 168 L48 168Z" fill="#d9b98c" stroke="#9c7a50"/>
      ${[118, 132, 146, 160].map((y) => `<path d="M48 ${y} L152 ${y}" stroke="#b8956a" stroke-width=".8"/>`).join('')}
      <path d="M44 88 L156 88 L156 106 L44 106Z" fill="#e3c69c" stroke="#9c7a50"/><path d="M60 96 C80 94 120 98 140 96" stroke="#b8956a" stroke-width=".8" fill="none"/>
      <text x="100" y="142" text-anchor="middle" font-family='${d.font || '"Great Vibes", cursive'}' font-size="15" fill="#6b4a2a" opacity=".85">${esc(d.tagText1 || '')}</text>
      <text x="100" y="156" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="7.5" letter-spacing="1" fill="#6b4a2a" opacity=".8">${esc(d.tagText2 || '')}</text>
      <path d="M44 97 Q100 102 156 97" stroke="#b49a6a" stroke-width="2.4" fill="none"/>${bow(100, 96, rib, 0.7)}`;
      s += deco(dk, 116, 86, d);
      break;
    case 'basket':
      s = `<ellipse cx="100" cy="172" rx="56" ry="8" fill="#000" opacity=".07"/><path d="M100 120 C60 120 58 60 100 58 C142 60 140 120 100 120" fill="none" stroke="#c9a66b" stroke-width="5"/>
      ${pile(100, 124, k, kc)}<path d="M48 120 L152 120 L140 168 L60 168Z" fill="#dcbf86" stroke="#a7854c"/>
      ${[0, 1, 2, 3].map((i) => `<path d="M${50 + i * 3} ${130 + i * 10} L${150 - i * 3} ${130 + i * 10}" stroke="#b8955a" stroke-width="1.6" stroke-dasharray="6 3"/>`).join('')}
      <path d="M48 122 Q100 130 152 122" stroke="${rib}" stroke-width="4" fill="none"/>${bow(70, 124, rib, 0.6)}`;
      s += tag(150, 142, d) + deco(dk, 80, 108, d);
      break;
    case 'tin':
      s = `<ellipse cx="100" cy="166" rx="56" ry="10" fill="#000" opacity=".07"/><path d="M46 120 L46 150 C46 164 154 164 154 150 L154 120Z" fill="${shade(mat, -6)}" stroke="${shade(mat, -25)}"/>
      <ellipse cx="100" cy="118" rx="58" ry="20" fill="${mat}" stroke="${shade(mat, -25)}"/><ellipse cx="100" cy="118" rx="46" ry="14" fill="#fffdf8" stroke="#d8cfc0"/>
      <text x="100" y="118" text-anchor="middle" font-family='${d.font || '"Great Vibes", cursive'}' font-size="12" fill="#3a3a3a">${esc(d.tagText1 || '')}</text>
      <text x="100" y="128" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="6" letter-spacing=".8" fill="#777">${esc(d.tagText2 || '')}</text>
      <path d="M46 134 Q100 146 154 134" stroke="${rib}" stroke-width="5" fill="none"/>`;
      s += deco(dk, 140, 108, d);
      break;
    case 'pillow':
      s = `<ellipse cx="100" cy="164" rx="60" ry="8" fill="#000" opacity=".07"/><path d="M44 96 Q100 80 156 96 L156 150 Q100 134 44 150Z" fill="${mat}" stroke="${shade(mat, -22)}"/>
      <path d="M44 96 Q56 123 44 150 M156 96 Q144 123 156 150" fill="none" stroke="${shade(mat, -22)}"/>
      <rect x="94" y="87" width="12" height="58" fill="${rib}"/>${bow(100, 92, rib, 0.75)}`;
      s += tag(140, 122, { ...d, tagShape: d.tagShape || 'rect' }) + deco(dk, 116, 86, d);
      break;
    case 'soap':
      s = `<ellipse cx="100" cy="168" rx="60" ry="8" fill="#000" opacity=".07"/><path d="M46 112 L154 112 L154 160 L46 160Z" fill="#c9cf9a" stroke="#98a060"/>
      <path d="M50 104 L150 104 L150 154 L50 154Z" fill="${mat === '#ffffff' ? '#efe6d2' : mat}" stroke="${shade(mat === '#ffffff' ? '#efe6d2' : mat, -22)}"/>
      <rect x="62" y="112" width="76" height="34" rx="2" fill="#fffdf8" stroke="#d8cfc0"/>
      <text x="100" y="129" text-anchor="middle" font-family='${d.font || '"Great Vibes", cursive'}' font-size="11" fill="#3a3a3a">${esc(d.tagText1 || '')}</text>
      <text x="100" y="140" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="6" letter-spacing=".8" fill="#777">${esc(d.tagText2 || '')}</text>
      <path d="M70 104 L70 154 M50 132 L150 132" stroke="#b49a6a" stroke-width="1.6" opacity=".9"/>${pile(100, 98, Math.min(k, 5), kc, 0.8)}
      <path d="M74 102 C72 80 90 74 100 74 C110 74 128 80 126 102" fill="#fff" fill-opacity=".4" stroke="#ddd"/>${bow(100, 78, rib, 0.55)}`;
      s += deco(dk, 112, 74, d);
      break;
    case 'honey':
      s = `<ellipse cx="100" cy="174" rx="40" ry="7" fill="#000" opacity=".08"/><path d="M64 98 C60 106 60 114 62 122 L62 164 C62 172 138 172 138 164 L138 122 C140 114 140 106 136 98Z" fill="#e8a930" fill-opacity=".85" stroke="#b67a14" stroke-width="1.5"/>
      <path d="M72 108 L72 160" stroke="#fff" stroke-width="4" opacity=".35" stroke-linecap="round"/>
      <rect x="66" y="84" width="68" height="16" rx="4" fill="${mat}" stroke="${shade(mat, -22)}"/><path d="M62 84 L72 76 L128 76 L138 84Z" fill="${mat}" stroke="${shade(mat, -22)}" opacity=".9"/>
      <path d="M128 52 L112 118" stroke="#c49a63" stroke-width="3.5" stroke-linecap="round"/>${[0, 1, 2].map((i) => `<ellipse cx="${131 - i * 2}" cy="${44 - i * 5}" rx="6" ry="2.6" fill="#c49a63" stroke="#9b7440"/>`).join('')}
      <rect x="72" y="124" width="56" height="30" rx="3" fill="#fffdf8" stroke="#d8cfc0"/>
      <text x="100" y="139" text-anchor="middle" font-family='${d.font || '"Great Vibes", cursive'}' font-size="10" fill="#3a3a3a">${esc(d.tagText1 || '')}</text>
      <text x="100" y="149" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="5.5" fill="#777">${esc(d.tagText2 || '')}</text>
      <path d="M64 102 Q100 110 136 102" stroke="${rib}" stroke-width="3" fill="none"/>${bow(78, 104, rib, 0.5)}`;
      s += deco(dk, 90, 82, d);
      break;
    case 'seeds':
      s = `<ellipse cx="100" cy="172" rx="44" ry="7" fill="#000" opacity=".07"/><rect x="58" y="62" width="84" height="108" rx="3" fill="${mat === '#ffffff' ? '#f3ead6' : mat}" stroke="${shade(mat === '#ffffff' ? '#f3ead6' : mat, -22)}"/>
      <path d="M58 62 L100 84 L142 62" fill="${shade(mat === '#ffffff' ? '#f3ead6' : mat, -6)}" stroke="${shade(mat === '#ffffff' ? '#f3ead6' : mat, -22)}"/>
      <g transform="translate(100 150) scale(.5)">${drawFlower('daisy', '#ffffff')}</g><g transform="translate(78 160) scale(.32)">${drawFlower('lavender', '#8f7bbf')}</g><g transform="translate(122 160) scale(.32) rotate(10)">${drawFlower('gypsophila', '#ffffff')}</g>
      <text x="100" y="108" text-anchor="middle" font-family='${d.font || '"Great Vibes", cursive'}' font-size="12" fill="#3a3a3a">${esc(d.tagText1 || '')}</text>
      <text x="100" y="119" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="6" letter-spacing="1" fill="#777">LET LOVE GROW</text>
      <text x="100" y="128" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="6" letter-spacing=".8" fill="#777">${esc(d.tagText2 || '')}</text>`;
      if (dk === 'seal' || dk === 'heart' || dk === 'mati') s += deco(dk, 100, 82, d);
      break;
    default: break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 20 160 170"><defs><pattern id="pp" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 L6 0" stroke="#000"/></pattern></defs>${s}</svg>`;
}

export const KOUFETA_INFO = 'Koufeta (sugared almonds) are always given in odd numbers — usually 5 or 7. An odd number can’t be divided, just like the newly married couple. The bitter almond and sweet coating stand for the bitter and sweet moments of married life.';
