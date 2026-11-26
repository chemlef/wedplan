// Colour helpers, curated wedding palettes and palette suggestions.

export function hexToRgb(hex) {
  const n = parseInt(String(hex).replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgbToHex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  let hh = 0; let s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh *= 60;
  }
  return [hh, s * 100, l * 100];
}
export function hslToHex(hh, s, l) {
  s /= 100; l /= 100; hh = ((hh % 360) + 360) % 360;
  const k = (n) => (n + hh / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
export const hexToHsl = (hex) => rgbToHsl(...hexToRgb(hex));
export function shade(hex, amt) {
  const [hh, s, l] = hexToHsl(hex);
  return hslToHex(hh, s, Math.max(0, Math.min(100, l + amt)));
}
export function mix(a, b, t = 0.5) {
  const x = hexToRgb(a); const y = hexToRgb(b);
  return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const textOn = (hex) => (luminance(hex) > 0.45 ? '#1d1d1f' : '#ffffff');

// Perceptual-ish distance (CIE76 on Lab).
function toLab(hex) {
  let [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; });
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  [x, y, z] = [x, y, z].map((v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116));
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export function colorDistance(a, b) {
  const x = toLab(a); const y = toLab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

const NAMED = {
  '#ffffff': 'White', '#f8f1e5': 'Ivory', '#f3e9dc': 'Cream', '#e8d9c5': 'Champagne', '#d8b4a0': 'Nude', '#f4c9c4': 'Blush', '#e98aa0': 'Pink', '#d9467a': 'Fuchsia',
  '#f08a6c': 'Coral', '#f6b78c': 'Peach', '#e07a3f': 'Orange', '#c56a3c': 'Terracotta', '#a0522d': 'Rust', '#f3d36b': 'Butter yellow', '#d4af37': 'Gold', '#c9b037': 'Mustard',
  '#b3122e': 'Red', '#7b1e3a': 'Burgundy', '#5e1a2e': 'Wine', '#6b2d5c': 'Plum', '#9b7bc4': 'Lavender', '#c8a8d8': 'Lilac', '#7a5c9e': 'Purple', '#b9c4e6': 'Periwinkle',
  '#a7c4d9': 'Dusty blue', '#5b7c99': 'Slate blue', '#1f3a5f': 'Navy', '#2a6f97': 'Aegean blue', '#8fb8b0': 'Sage teal', '#9caf88': 'Sage', '#6b8e5a': 'Olive green', '#3e5c3a': 'Forest green',
  '#7c8a96': 'Slate grey', '#c0c0c0': 'Silver', '#2b2b2b': 'Charcoal', '#000000': 'Black', '#b08d57': 'Bronze', '#e6cfc0': 'Rose quartz', '#c9a9a6': 'Dusty rose', '#8a9a5b': 'Moss',
};
export function colorName(hex) {
  let best = 'Colour'; let bd = Infinity;
  for (const [h, n] of Object.entries(NAMED)) { const d = colorDistance(hex, h); if (d < bd) { bd = d; best = n; } }
  return best;
}

export const PALETTES = [
  { name: 'Blush & sage', colors: ['#f8f1e5', '#f4c9c4', '#c9a9a6', '#9caf88', '#6b8e5a'], season: 'Spring' },
  { name: 'Aegean summer', colors: ['#ffffff', '#f3e9dc', '#a7c4d9', '#2a6f97', '#1f3a5f'], season: 'Summer' },
  { name: 'Olive grove', colors: ['#f8f1e5', '#e8d9c5', '#b5b48b', '#6b8e5a', '#3e5c3a'], season: 'Any' },
  { name: 'Terracotta sunset', colors: ['#f3e9dc', '#f6b78c', '#e07a3f', '#c56a3c', '#7b3f2a'], season: 'Autumn' },
  { name: 'Burgundy & gold', colors: ['#f3e9dc', '#d4af37', '#b3122e', '#7b1e3a', '#3e1a24'], season: 'Winter' },
  { name: 'Dusty blue', colors: ['#ffffff', '#d9e3ec', '#a7c4d9', '#7c8a96', '#5b7c99'], season: 'Any' },
  { name: 'Lavender fields', colors: ['#f8f1e5', '#e6e0f0', '#c8a8d8', '#9b7bc4', '#7c8a96'], season: 'Summer' },
  { name: 'Ivory & champagne', colors: ['#ffffff', '#f8f1e5', '#e8d9c5', '#d8b4a0', '#b08d57'], season: 'Any' },
  { name: 'Peach & coral', colors: ['#fff4ec', '#f6b78c', '#f08a6c', '#e98aa0', '#9caf88'], season: 'Spring' },
  { name: 'Emerald & navy', colors: ['#f8f1e5', '#d4af37', '#2e6b4f', '#1f3a5f', '#14213d'], season: 'Winter' },
  { name: 'Wildflower meadow', colors: ['#f3d36b', '#f6b78c', '#c8a8d8', '#a7c4d9', '#9caf88'], season: 'Summer' },
  { name: 'Moody plum', colors: ['#e6cfc0', '#c9a9a6', '#6b2d5c', '#5e1a2e', '#2b2b2b'], season: 'Autumn' },
  { name: 'Lemon & white', colors: ['#ffffff', '#fbf6d9', '#f3d36b', '#9caf88', '#5b7c99'], season: 'Summer' },
  { name: 'Rose garden', colors: ['#fdf2f4', '#f4c9c4', '#e98aa0', '#d9467a', '#6b8e5a'], season: 'Spring' },
  { name: 'Black tie', colors: ['#ffffff', '#e8d9c5', '#c0c0c0', '#2b2b2b', '#000000'], season: 'Any' },
  { name: 'Rust & cream', colors: ['#f8f1e5', '#e8d9c5', '#c9b037', '#a0522d', '#5c3a21'], season: 'Autumn' },
];

// Suggest palettes from one or more chosen colours using colour harmony, softened for weddings.
export function suggestPalettes(base) {
  const seeds = (base || []).filter(Boolean);
  if (!seeds.length) return [];
  const [h0, s0, l0] = hexToHsl(seeds[0]);
  const soft = (hh, s, l) => hslToHex(hh, Math.min(s, 70), l);
  const neutral = hslToHex(h0, Math.min(25, s0 * 0.3), 95);
  const out = [
    { name: 'Monochrome', colors: [neutral, soft(h0, s0 * 0.6, Math.min(90, l0 + 28)), soft(h0, s0, Math.min(80, l0 + 14)), seeds[0], soft(h0, s0, Math.max(15, l0 - 22))] },
    { name: 'Analogous', colors: [neutral, soft(h0 - 30, s0 * 0.8, Math.min(85, l0 + 15)), seeds[0], soft(h0 + 30, s0 * 0.9, l0), soft(h0 + 15, s0, Math.max(20, l0 - 20))] },
    { name: 'Complementary', colors: [neutral, soft(h0, s0 * 0.5, Math.min(88, l0 + 22)), seeds[0], soft(h0 + 180, s0 * 0.6, Math.min(75, l0 + 5)), soft(h0 + 180, s0 * 0.7, Math.max(22, l0 - 18))] },
    { name: 'Split complementary', colors: [neutral, seeds[0], soft(h0 + 150, s0 * 0.55, Math.min(78, l0 + 10)), soft(h0 + 210, s0 * 0.55, Math.min(70, l0)), soft(h0, s0, Math.max(18, l0 - 25))] },
    { name: 'Triadic', colors: [neutral, seeds[0], soft(h0 + 120, s0 * 0.5, Math.min(80, l0 + 8)), soft(h0 + 240, s0 * 0.5, Math.min(80, l0 + 8)), hslToHex(h0, 10, 25)] },
    { name: 'Soft & neutral', colors: ['#ffffff', hslToHex(h0, 18, 92), mix(seeds[0], '#ffffff', 0.45), seeds[0], hslToHex(h0, 12, 40)] },
    { name: 'With greenery', colors: [neutral, mix(seeds[0], '#ffffff', 0.4), seeds[0], '#9caf88', '#3e5c3a'] },
  ];
  if (seeds.length > 1) {
    out.unshift({ name: 'Your colours', colors: [neutral, ...seeds.slice(0, 3), seeds.length < 4 ? mix(seeds[0], seeds[1], 0.5) : seeds[3]].slice(0, 5) });
  }
  return out;
}
