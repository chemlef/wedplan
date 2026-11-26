// Flower library: colours, seasons, symbolism and hand-drawn SVG illustrations, plus the bouquet composer.
import { shade, mix, colorDistance, hexToHsl } from './color.js';

// ---------------------------------------------------------------- data
const W = '#fbfaf6'; const IV = '#f6efe1'; const BL = '#f4cdc6'; const PK = '#e98aa0'; const HP = '#d9467a'; const RD = '#b3122e'; const BG = '#6d1a2a';
const PE = '#f6b78c'; const CO = '#f08a6c'; const OR = '#ec8a3a'; const YE = '#f3d36b'; const LA = '#c8a8d8'; const PU = '#7a4f9e'; const BU = '#6f8fd0'; const GR = '#9fbf7a';

const F = (id, name, greek, kind, shape, colors, months, meaning, price = 2, note = '') => ({ id, name, greek, kind, shape, colors, months, meaning, price, note });
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const R = (a, b) => (a <= b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [...R(a, 12), ...R(1, b)]);

export const FLOWERS = [
  F('rose', 'Rose', 'Τριαντάφυλλο', 'focal', 'rose', [W, IV, BL, PK, RD, BG, PE, CO, YE, LA], ALL, 'Love. Red for passion, white for new beginnings, blush for grace and admiration.', 2),
  F('gardenrose', 'Garden rose', 'Τριαντάφυλλο κήπου', 'focal', 'peony', [IV, BL, PE, PK, CO, '#e7b98c'], R(5, 10), 'Romance and gratitude. Many-petalled and fragrant: the classic garden-style bloom.', 3),
  F('peony', 'Peony', 'Παιώνια', 'focal', 'peony', [W, BL, PK, HP, CO, BG], R(4, 6), 'A happy marriage, prosperity and honour. Named after Paeon, physician of the Greek gods.', 3, 'Short season: late spring.'),
  F('ranunculus', 'Ranunculus', 'Νεραγκούλα', 'secondary', 'ranunculus', [W, BL, PE, OR, YE, PK, BG, RD], R(1, 5), 'Radiant charm: “I am dazzled by you.”', 2),
  F('anemone', 'Anemone', 'Ανεμώνη', 'secondary', 'anemone', [W, BL, RD, PU, '#3b4fa8'], R(11, 5), 'Anticipation and protection. In myth it sprang from Aphrodite’s tears for Adonis.', 2, 'White with a dark centre is a modern bridal favourite.'),
  F('tulip', 'Tulip', 'Τουλίπα', 'secondary', 'tulip', [W, BL, PK, RD, YE, OR, PU, CO], R(1, 5), 'Perfect, declared love.', 1),
  F('calla', 'Calla lily', 'Κάλλα', 'focal', 'calla', [W, IV, YE, PE, BG, '#4b1e3f'], ALL, 'Magnificent beauty (from the Greek “kallos”). Sleek and modern.', 2),
  F('hydrangea', 'Hydrangea', 'Ορτανσία', 'focal', 'hydrangea', [W, BL, PK, '#a7c4d9', BU, LA, '#c4d8b0'], R(5, 10), 'Heartfelt gratitude and abundance. One stem fills a lot of space.', 2),
  F('orchid', 'Orchid', 'Ορχιδέα', 'focal', 'orchid', [W, BL, PK, HP, LA, PU], ALL, 'Love, luxury and strength. Elegant in cascades.', 3),
  F('lily', 'Oriental lily', 'Κρίνος', 'focal', 'lily', [W, BL, PK, YE, OR], ALL, 'Purity and devotion. The white lily is a symbol of the Virgin Mary.', 2, 'Strong scent; remove pollen before the ceremony.'),
  F('lisianthus', 'Lisianthus', 'Λυσίανθος', 'secondary', 'lisianthus', [W, IV, BL, LA, PU, '#d9e6c5'], ALL, 'Appreciation and a lifelong bond. A gentle, rose-like bloom that lasts.', 1),
  F('carnation', 'Carnation', 'Γαρύφαλλο', 'secondary', 'carnation', [W, BL, PK, RD, BG, PE, YE], ALL, 'Fascination and devoted love. In Greek tradition, a symbol of the Mediterranean summer.', 1),
  F('dahlia', 'Dahlia', 'Ντάλια', 'focal', 'dahlia', [W, BL, PE, CO, BG, '#e4c2a4', YE], R(7, 10), 'Commitment and an everlasting bond.', 2),
  F('sunflower', 'Sunflower', 'Ηλίανθος', 'focal', 'sunflower', ['#f4c430', '#e8a33a', '#f3e4a0'], R(6, 10), 'Adoration, loyalty and warmth.', 1),
  F('gerbera', 'Gerbera', 'Ζέρμπερα', 'secondary', 'gerbera', [W, PK, CO, OR, YE, RD], ALL, 'Cheerfulness and innocence.', 1),
  F('daisy', 'Daisy / chamomile', 'Μαργαρίτα / Χαμομήλι', 'filler', 'daisy', [W], R(4, 9), 'Innocence and loyal love. Wild and rustic.', 1),
  F('cosmos', 'Cosmos', 'Κόσμος', 'secondary', 'cosmos', [W, BL, PK, HP, '#7b2d3b'], R(6, 10), 'Harmony and order (from the Greek “kosmos”).', 1),
  F('scabiosa', 'Scabiosa', 'Σκαμπιόζα', 'secondary', 'scabiosa', [W, LA, PU, BG, BL], R(5, 10), 'Today: admiration and purity of heart. (In old flower language it meant unlucky love.)', 2),
  F('protea', 'King protea', 'Πρωτέα', 'focal', 'protea', [BL, PK, '#f2e2d4', '#c97b84'], ALL, 'Courage and transformation. Named after Proteus, the shape-shifting Greek sea god.', 3),
  F('gardenia', 'Gardenia', 'Γαρδένια', 'secondary', 'cup', [W, IV], R(5, 8), 'Joy, purity and secret love.', 2, 'Very fragrant; bruises easily.'),
  F('magnolia', 'Magnolia', 'Μανόλια', 'focal', 'magnolia', [W, IV, BL, PK], R(3, 6), 'Dignity and nobility.', 3),
  F('camellia', 'Camellia', 'Καμέλια', 'secondary', 'camellia', [W, BL, PK, RD], R(11, 4), 'Longing and adoration: “my destiny is in your hands”.', 2),
  F('sweetpea', 'Sweet pea', 'Μοσχομπίζελο', 'filler', 'sweetpea', [W, BL, PK, LA, PU, '#b0446e'], R(3, 7), 'Blissful pleasure and “thank you for a lovely time”. Traditional for guest favours.', 2),
  F('freesia', 'Freesia', 'Φρέζια', 'filler', 'freesia', [W, YE, PK, LA, OR], R(1, 6), 'Trust, friendship and innocence.', 1),
  F('lavender', 'Lavender', 'Λεβάντα', 'line', 'lavender', ['#8f7bbf'], R(6, 8), 'Devotion and serenity. Lovely dried in bomboniere.', 1),
  F('delphinium', 'Delphinium', 'Δελφίνιο', 'line', 'delphinium', [W, BU, '#a7c4d9', LA, PU], R(5, 10), 'Big-heartedness and joy (from the Greek “delphis”, dolphin).', 2),
  F('snapdragon', 'Snapdragon', 'Αντίρρινο (σκυλάκι)', 'line', 'snapdragon', [W, BL, PK, YE, PE, BG], R(4, 10), 'Graciousness and strength.', 1),
  F('stock', 'Stock', 'Βιολέτα', 'line', 'stock', [W, IV, BL, LA, PU, PK], R(2, 6), 'Lasting beauty and a happy life. Smells of cloves.', 1),
  F('astilbe', 'Astilbe', 'Αστίλβη', 'line', 'astilbe', [W, BL, PK, BG], R(5, 9), 'Patience: “I’ll still be waiting.”', 2),
  F('gypsophila', 'Baby’s breath', 'Γυψοφίλη', 'filler', 'gypsophila', [W, BL], ALL, 'Everlasting love and purity.', 1),
  F('waxflower', 'Waxflower', 'Κηρολούλουδο', 'filler', 'waxflower', [W, BL, PK, LA], R(11, 5), 'Lasting love and riches.', 1),
  F('statice', 'Statice', 'Λιμόνιο (στατίκη)', 'filler', 'statice', [W, LA, PU, BL, YE], ALL, 'Remembrance and success. Dries beautifully.', 1),
  F('lilyvalley', 'Lily of the valley', 'Μιγκέ', 'filler', 'lilyvalley', [W], R(4, 6), 'Return of happiness and humility. Carried at royal weddings.', 3),
  F('orangeblossom', 'Orange blossom', 'Άνθος πορτοκαλιάς', 'filler', 'blossom', [W], R(3, 5), 'Eternal love and fertility. The traditional bridal flower; worn in Greek brides’ hair for generations.', 2),
  F('jasmine', 'Jasmine', 'Γιασεμί', 'filler', 'jasmine', [W], R(5, 9), 'Grace, elegance and sweet love. A Greek summer garden staple.', 1),
  F('iris', 'Iris', 'Ίρις', 'secondary', 'iris', [PU, BU, W, YE, '#3b4fa8'], R(3, 6), 'Faith, wisdom and hope. Named after Iris, the Greek messenger goddess of the rainbow.', 2),
  F('narcissus', 'Narcissus', 'Νάρκισσος', 'secondary', 'narcissus', [W, YE, '#fff4c2'], R(12, 4), 'New beginnings and renewal (and a famous Greek myth about vanity).', 1),
  F('poppy', 'Poppy', 'Παπαρούνα', 'secondary', 'anemone', [RD, CO, W, BL, OR], R(4, 6), 'Imagination and pleasure. The red poppy is a symbol of the Greek spring.', 2, 'Delicate: sear stems so they last.'),
  F('hellebore', 'Hellebore', 'Ελλέβορος', 'secondary', 'fivepetal', [W, '#d9e6c5', BL, '#8a4f6d', '#5e2a46'], R(12, 4), 'Serenity and tranquillity. A winter wedding favourite.', 2),
  F('oleander', 'Oleander', 'Πικροδάφνη', 'filler', 'fivepetal', [W, BL, PK, HP], R(6, 9), 'Grace and charm. Grows everywhere in Greek summers (not for eating — it is toxic).', 1),
  F('zinnia', 'Zinnia', 'Ζίννια', 'secondary', 'dahlia', [PK, CO, OR, YE, RD, W], R(7, 10), 'Lasting affection and remembrance of friends.', 1),
  F('chrysanthemum', 'Chrysanthemum', 'Χρυσάνθεμο', 'secondary', 'carnation', [W, YE, '#e8c4a0', BG, LA], R(9, 12), 'Joy, optimism and long life (from the Greek “chrysos anthemon”, golden flower).', 1),
  F('alstroemeria', 'Alstroemeria', 'Αλστρομέρια', 'filler', 'lily', [W, BL, PK, YE, OR, LA], ALL, 'Friendship and devotion. Long-lasting and affordable.', 1),
  F('hyacinth', 'Hyacinth', 'Υάκινθος', 'line', 'stock', [W, BU, LA, PK, PU], R(1, 4), 'Sincerity and playfulness. Named after Hyacinthus, beloved of Apollo.', 2),
  F('veronica', 'Veronica', 'Βερόνικα', 'line', 'lavender', ['#7a6fbf', W, PK, '#4f5fa8'], R(5, 9), 'Fidelity. Adds slender lines.', 1),
  F('bougainvillea', 'Bougainvillea', 'Βουκαμβίλια', 'filler', 'bougainvillea', [HP, '#b0446e', W, CO, '#e7a1c0'], R(5, 10), 'Passion and the island summer: the colour of Santorini walls.', 2),
  F('bouvardia', 'Bouvardia', 'Μπουβάρντια', 'filler', 'blossom', [W, BL, PK], ALL, 'Enthusiasm and zest for life. Pretty in buttonholes.', 2),
  F('thistle', 'Eryngium (sea holly)', 'Ερύγγιο', 'filler', 'thistle', ['#7f8fb8', '#a7b4d0', '#c9d6c8'], R(6, 10), 'Independence and protection. Spiky and boho.', 2),
  F('craspedia', 'Craspedia (billy buttons)', 'Κρασπέντια', 'filler', 'ball', [YE, '#e8b23a'], ALL, 'Good health and cheer. Playful pops of yellow.', 1),
  F('pomegranate', 'Pomegranate', 'Ρόδι', 'secondary', 'pomegranate', ['#b3122e', '#c4453a', '#d8a28a'], R(9, 12), 'Fertility, abundance and good luck — a traditional Greek symbol for newlyweds.', 2),
  F('wheat', 'Wheat ears', 'Στάχυα', 'greenery', 'wheat', ['#d9b86a', '#c9a24f', '#e6d3a3'], ALL, 'Fertility and prosperity. Long used in Greek wedding wreaths and the koulouri bread.', 1),
  F('laurel', 'Bay laurel', 'Δάφνη', 'greenery', 'ruscus', ['#3f5f34'], ALL, 'Victory and honour. Sacred to Apollo; laurel crowns crowned champions.', 1),
  F('ivy', 'Ivy', 'Κισσός', 'greenery', 'ivy', ['#456b3a', '#6f8f5a'], ALL, 'Fidelity and wedded love. Perfect trailing from cascades.', 1),
  F('dustymiller', 'Dusty miller', 'Κινεράρια', 'greenery', 'olive', ['#b9c2bf'], ALL, 'Silvery texture; often taken to mean gratitude.', 1),
  F('mimosa', 'Mimosa', 'Μιμόζα', 'filler', 'statice', [YE], R(1, 3), 'Sensitivity and secret love. Bright winter yellow.', 1),
  F('eucalyptus', 'Eucalyptus', 'Ευκάλυπτος', 'greenery', 'eucalyptus', ['#8fa89a'], ALL, 'Protection and abundance.', 1),
  F('olive', 'Olive branch', 'Κλαδί ελιάς', 'greenery', 'olive', ['#7d8f69'], ALL, 'Peace, wisdom and fertility. Ancient Greek wedding crowns were woven from olive.', 1),
  F('myrtle', 'Myrtle', 'Μυρτιά', 'greenery', 'myrtle', ['#3f6b3a'], ALL, 'Love and marriage: sacred to Aphrodite and carried in royal bouquets.', 1),
  F('ruscus', 'Italian ruscus', 'Ρούσκους', 'greenery', 'ruscus', ['#4f7a3a'], ALL, 'Long-lasting texture and a sense of flow.', 1),
  F('fern', 'Fern', 'Φτέρη', 'greenery', 'fern', ['#5d8a45'], ALL, 'Sincerity and magic.', 1),
  F('pampas', 'Pampas grass', 'Πάμπας', 'greenery', 'pampas', ['#e8dcc4', '#d7c3a5', '#f2ede4'], ALL, 'No traditional meaning: soft, airy and boho.', 1),
];
export const flowerById = (id) => FLOWERS.find((f) => f.id === id);
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const KIND_LABEL = { focal: 'Focal flower', secondary: 'Secondary flower', filler: 'Filler', line: 'Line flower', greenery: 'Greenery' };

// ---------------------------------------------------------------- drawing helpers
const n2 = (v) => Math.round(v * 10) / 10;
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const roundPetal = (l, w) => `M0 0 C${n2(w)} ${n2(-l * 0.2)} ${n2(w * 1.1)} ${n2(-l * 0.85)} 0 ${n2(-l)} C${n2(-w * 1.1)} ${n2(-l * 0.85)} ${n2(-w)} ${n2(-l * 0.2)} 0 0Z`;
const pointPetal = (l, w) => `M0 0 C${n2(w)} ${n2(-l * 0.3)} ${n2(w * 0.8)} ${n2(-l * 0.75)} 0 ${n2(-l)} C${n2(-w * 0.8)} ${n2(-l * 0.75)} ${n2(-w)} ${n2(-l * 0.3)} 0 0Z`;
const ruffle = (l, w) => `M0 0 C${n2(w)} ${n2(-l * 0.3)} ${n2(w)} ${n2(-l * 0.8)} ${n2(w * 0.5)} ${n2(-l)} Q${n2(w * 0.25)} ${n2(-l * 0.9)} 0 ${n2(-l)} Q${n2(-w * 0.25)} ${n2(-l * 0.9)} ${n2(-w * 0.5)} ${n2(-l)} C${n2(-w)} ${n2(-l * 0.8)} ${n2(-w)} ${n2(-l * 0.3)} 0 0Z`;
const ring = (n, path, fill, stroke, off = 0, sw = 1) => rep(n, (i) => `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" transform="rotate(${n2(off + (360 / n) * i)})"/>`);
function rng(seed) { let s = (seed >>> 0) || 7; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }
const STEM = '#5f7d45';

// Each renderer draws a flower head centred on (0,0) within ~50 units, or (upright kinds) a stem growing up from (0,0) to ~-100.
const DRAW = {
  rose(c) {
    const d = shade(c, -16); const l = shade(c, 9);
    return ring(5, roundPetal(46, 28), c, d, 0) + ring(5, roundPetal(35, 22), l, d, 36)
      + `<circle r="18" fill="${c}" stroke="${d}"/><path d="M-9 3 C-11 -11 9 -15 11 -2 C12 9 -3 13 -5 4 C-6 -3 3 -5 3 1" fill="none" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>`;
  },
  peony(c) {
    const d = shade(c, -12); const l = shade(c, 8); const ll = shade(c, 15);
    return ring(9, ruffle(48, 22), shade(c, -3), d, 0) + ring(8, ruffle(38, 20), c, d, 20) + ring(7, ruffle(27, 16), l, d, 10)
      + ring(6, ruffle(16, 11), ll, d, 30) + `<circle r="7" fill="${ll}" stroke="${d}" stroke-width=".8"/>`;
  },
  lisianthus(c) {
    const d = shade(c, -14); const l = shade(c, 10);
    return ring(6, ruffle(44, 26), c, d, 0) + ring(5, ruffle(30, 20), l, d, 30) + `<circle r="9" fill="#d9e3a8" stroke="${d}" stroke-width=".8"/>`;
  },
  ranunculus(c) {
    const d = shade(c, -18); const l = shade(c, 10);
    let s = `<circle r="44" fill="${c}" stroke="${d}"/>`;
    [36, 28, 20, 13].forEach((r, k) => {
      s += `<circle r="${r}" fill="${k % 2 ? c : l}" stroke="${d}" stroke-width=".9"/>`;
      s += rep(8, (i) => { const a = ((i * 45 + k * 20) * Math.PI) / 180; const x = r * Math.cos(a); const y = r * Math.sin(a); return `<path d="M${n2(x * 0.9)} ${n2(y * 0.9)} Q${n2(x * 1.08)} ${n2(y * 1.08)} ${n2(x * 0.9 + y * 0.3)} ${n2(y * 0.9 - x * 0.3)}" fill="none" stroke="${d}" stroke-width=".6"/>`; });
    });
    return `${s}<circle r="6" fill="#86a05a"/>`;
  },
  anemone(c) {
    const d = shade(c, -14);
    return ring(6, roundPetal(46, 30), c, d, 0) + `<circle r="16" fill="#2a2440" opacity=".25"/>${rep(16, (i) => { const a = (i / 16) * Math.PI * 2; return `<circle cx="${n2(Math.cos(a) * 15)}" cy="${n2(Math.sin(a) * 15)}" r="1.8" fill="#1d1a2b"/>`; })}<circle r="11" fill="#1d1a2b"/>`;
  },
  tulip(c) {
    const d = shade(c, -15); const l = shade(c, 10);
    return `<path d="M-24 -4 C-27 -36 -12 -50 0 -44 C12 -50 27 -36 24 -4 C20 16 -20 16 -24 -4Z" fill="${c}" stroke="${d}"/><path d="M-11 -6 C-13 -32 -3 -50 0 -50 C3 -50 13 -32 11 -6 C6 6 -6 6 -11 -6Z" fill="${l}" stroke="${d}" stroke-width=".8"/>`;
  },
  calla(c) {
    const d = shade(c, -15); const l = shade(c, 10);
    return `<path d="M0 34 C-20 12 -26 -24 -6 -46 C4 -56 24 -52 22 -40 C15 -38 10 -30 12 -14 C14 8 8 24 0 34Z" fill="${c}" stroke="${d}"/><path d="M-6 -46 C2 -40 6 -30 4 -14" fill="none" stroke="${l}" stroke-width="3" opacity=".7"/><path d="M2 20 C4 0 6 -14 8 -22" stroke="#f0c43a" stroke-width="5" stroke-linecap="round"/>`;
  },
  hydrangea(c, seed = 3) {
    const r = rng(seed); let s = '';
    for (let i = 0; i < 30; i++) {
      const a = i * 2.39996; const rad = 7.6 * Math.sqrt(i + 0.5);
      const x = Math.cos(a) * rad; const y = Math.sin(a) * rad;
      const col = mix(c, r() > 0.5 ? '#ffffff' : shade(c, -18), r() * 0.35);
      s += `<g transform="translate(${n2(x)} ${n2(y)}) rotate(${n2(r() * 90)})">${ring(4, roundPetal(8, 6), col, shade(c, -22), 0, 0.5)}<circle r="1.3" fill="${shade(c, -30)}"/></g>`;
    }
    return s;
  },
  orchid(c) {
    const d = shade(c, -15); const l = shade(c, 12);
    return [0, 125, 235].map((a) => `<path d="${pointPetal(40, 10)}" fill="${l}" stroke="${d}" transform="rotate(${a})"/>`).join('')
      + [65, 295].map((a) => `<path d="${roundPetal(36, 22)}" fill="${c}" stroke="${d}" transform="rotate(${a})"/>`).join('')
      + `<path d="M-9 4 C-12 18 -4 26 0 26 C4 26 12 18 9 4 C5 0 -5 0 -9 4Z" fill="${shade(c, -25)}" stroke="${d}"/><circle cy="-2" r="5" fill="#f3d36b"/>`;
  },
  lily(c) {
    const d = shade(c, -15);
    return ring(6, pointPetal(50, 15), c, d, 0) + rep(6, (i) => `<path d="M0 -6 L0 -36" stroke="${shade(c, -30)}" stroke-width=".8" stroke-dasharray="2 3" transform="rotate(${i * 60})"/>`)
      + rep(6, (i) => `<g transform="rotate(${i * 60 + 30})"><path d="M0 0 L0 -26" stroke="#9cae6a" stroke-width="1.2"/><ellipse cy="-28" rx="2" ry="4" fill="#c4622d"/></g>`) + '<circle r="4" fill="#b7c98a"/>';
  },
  carnation(c) {
    const d = shade(c, -16); const l = shade(c, 10);
    const jag = (R, n, amp) => `M${Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; const rr = R + (i % 2 ? amp : -amp); return `${n2(Math.cos(a) * rr)} ${n2(Math.sin(a) * rr)}`; }).join(' L')}Z`;
    return `<path d="${jag(44, 60, 3)}" fill="${shade(c, -4)}" stroke="${d}"/><path d="${jag(33, 48, 3)}" fill="${c}" stroke="${d}"/><path d="${jag(21, 36, 2.5)}" fill="${l}" stroke="${d}"/><path d="${jag(10, 24, 2)}" fill="${shade(c, 16)}" stroke="${d}" stroke-width=".7"/>`;
  },
  dahlia(c) {
    const d = shade(c, -14);
    return ring(16, pointPetal(48, 9), shade(c, -5), d, 0) + ring(12, pointPetal(36, 8), c, d, 15) + ring(9, pointPetal(24, 7), shade(c, 8), d, 5) + ring(6, pointPetal(13, 6), shade(c, 14), d, 30) + `<circle r="4" fill="${shade(c, -20)}"/>`;
  },
  sunflower(c) {
    return ring(22, pointPetal(48, 8), shade(c, -6), shade(c, -22), 8) + ring(20, pointPetal(42, 8), c, shade(c, -22), 0)
      + `<circle r="22" fill="#5a3a1c"/>${rep(40, (i) => { const a = i * 2.4; const rr = 3 * Math.sqrt(i); return `<circle cx="${n2(Math.cos(a) * rr)}" cy="${n2(Math.sin(a) * rr)}" r="1.4" fill="#3a2410"/>`; })}`;
  },
  gerbera(c) {
    const d = shade(c, -14);
    return ring(22, `M0 -14 C4 -20 4 -44 0 -48 C-4 -44 -4 -20 0 -14Z`, c, d, 0) + ring(18, `M0 -12 C3 -18 3 -32 0 -35 C-3 -32 -3 -18 0 -12Z`, shade(c, 8), d, 10)
      + `<circle r="13" fill="#5b4b20"/><circle r="8" fill="#9aa84a"/>`;
  },
  daisy(c) {
    return ring(18, `M0 -8 C3 -12 3 -40 0 -42 C-3 -40 -3 -12 0 -8Z`, c, '#d8d2c4', 0, 0.7) + `<circle r="11" fill="#f3c623" stroke="#d9a816"/>${rep(10, (i) => `<circle cx="${n2(Math.cos(i * 2.4) * 2.3 * Math.sqrt(i))}" cy="${n2(Math.sin(i * 2.4) * 2.3 * Math.sqrt(i))}" r="1" fill="#c48a10"/>`)}`;
  },
  cosmos(c) {
    const d = shade(c, -15);
    return ring(8, 'M0 -6 C14 -14 18 -38 10 -46 L5 -42 L0 -47 L-5 -42 L-10 -46 C-18 -38 -14 -14 0 -6Z', c, d, 0) + '<circle r="9" fill="#f0c43a" stroke="#c99a1d"/>';
  },
  scabiosa(c) {
    const d = shade(c, -15);
    return ring(14, ruffle(46, 13), c, d, 0) + ring(10, ruffle(30, 11), shade(c, 8), d, 18) + `<circle r="15" fill="${shade(c, -10)}"/>${rep(24, (i) => { const a = i * 2.4; const rr = 2.8 * Math.sqrt(i); return `<circle cx="${n2(Math.cos(a) * rr)}" cy="${n2(Math.sin(a) * rr)}" r="1.6" fill="${shade(c, 20)}"/>`; })}`;
  },
  protea(c) {
    const d = shade(c, -18);
    return rep(13, (i) => `<path d="${pointPetal(54, 10)}" fill="${i % 2 ? c : shade(c, -6)}" stroke="${d}" transform="translate(0 18) rotate(${-78 + i * 13})"/>`)
      + `<ellipse cy="-4" rx="20" ry="24" fill="${shade(c, 22)}" stroke="${d}"/>${rep(16, (i) => `<path d="M${-14 + (i % 8) * 4} ${i < 8 ? -18 : -4} q2 -6 4 0" fill="none" stroke="${shade(c, -10)}" stroke-width=".8"/>`)}`;
  },
  cup(c) {
    const d = shade(c, -10); const l = shade(c, 4);
    return ring(6, roundPetal(46, 28), shade(c, -3), d, 0) + ring(5, roundPetal(32, 20), l, d, 30) + ring(4, roundPetal(18, 12), c, d, 10);
  },
  camellia(c) {
    const d = shade(c, -14);
    return ring(7, roundPetal(46, 26), c, d, 0) + ring(6, roundPetal(30, 18), shade(c, 8), d, 25) + `<circle r="9" fill="#f3d36b"/>${rep(12, (i) => `<circle cx="${n2(Math.cos(i * 0.52) * 8)}" cy="${n2(Math.sin(i * 0.52) * 8)}" r="1.4" fill="#d9a816"/>`)}`;
  },
  magnolia(c) {
    const d = shade(c, -12); const pink = mix(c, '#c0587e', 0.25);
    return [-60, -20, 20, 60, -100, 100].map((a, i) => `<path d="${roundPetal(i > 3 ? 40 : 50, 16)}" fill="${i > 3 ? pink : c}" stroke="${d}" transform="rotate(${a})"/>`).join('') + '<ellipse cy="-6" rx="6" ry="10" fill="#d8c27a"/>';
  },
  fivepetal(c) {
    const d = shade(c, -14);
    return ring(5, roundPetal(44, 27), c, d, 0) + `<circle r="11" fill="#c9d68a"/>${rep(18, (i) => { const a = (i / 18) * Math.PI * 2; return `<path d="M0 0 L${n2(Math.cos(a) * 16)} ${n2(Math.sin(a) * 16)}" stroke="#d9c25a" stroke-width=".9"/><circle cx="${n2(Math.cos(a) * 16)}" cy="${n2(Math.sin(a) * 16)}" r="1.4" fill="#e3b83a"/>`; })}`;
  },
  iris(c) {
    const d = shade(c, -18); const l = shade(c, 12);
    return [-40, 40].map((a) => `<path d="${roundPetal(40, 14)}" fill="${l}" stroke="${d}" transform="rotate(${a})"/>`).join('') + `<path d="${roundPetal(44, 14)}" fill="${l}" stroke="${d}"/>`
      + [130, 230, 180].map((a) => `<path d="${roundPetal(44, 17)}" fill="${c}" stroke="${d}" transform="rotate(${a})"/>`).join('')
      + [130, 230, 180].map((a) => `<path d="M0 8 L0 30" stroke="#f3c623" stroke-width="3.2" stroke-linecap="round" transform="rotate(${a - 180})"/>`).join('');
  },
  narcissus(c) {
    const d = shade(c, -10);
    return ring(6, pointPetal(42, 17), c, d, 0) + '<circle r="15" fill="#f2b53a" stroke="#d98f1d"/><circle r="10" fill="#f7cd5a" stroke="#e0a02a"/><circle r="3" fill="#c97a12"/>';
  },
  bougainvillea(c, seed = 4) {
    const r = rng(seed); let s = '';
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9; const rad = k ? 22 + r() * 10 : 0;
      s += `<g transform="translate(${n2(Math.cos(a) * rad)} ${n2(Math.sin(a) * rad)}) rotate(${n2(r() * 120)}) scale(.55)">${ring(3, roundPetal(30, 22), shade(c, (r() - 0.5) * 14), shade(c, -15), 0, 0.8)}<circle r="3" fill="#f5f1dc"/></g>`;
    }
    return s;
  },
  thistle(c) {
    let s = '<path d="M0 0 L0 -70 M0 -55 L-22 -82 M0 -50 L22 -84" stroke="#7f8fb8" stroke-width="1.6" fill="none"/>';
    [[0, -78], [-22, -88], [22, -90]].forEach(([x, y]) => {
      s += ring(8, pointPetal(18, 3), shade(c, 10), shade(c, -15), 0, 0.5).replace(/rotate\(/g, `translate(${x} ${y + 6}) rotate(`);
      s += `<ellipse cx="${x}" cy="${y}" rx="7" ry="9" fill="${c}" stroke="${shade(c, -18)}"/>${rep(6, (i) => `<circle cx="${x + (i % 3 - 1) * 3.5}" cy="${y - 4 + Math.floor(i / 3) * 6}" r="1" fill="${shade(c, 25)}"/>`)}`;
    });
    return s;
  },
  ball(c) {
    let s = '<path d="M0 0 C1 -30 -1 -60 0 -86" stroke="#7a8f4a" stroke-width="1.6" fill="none"/>';
    s += `<circle cy="-94" r="12" fill="${c}" stroke="${shade(c, -16)}"/>${rep(22, (i) => { const a = i * 2.4; const rr = 2.4 * Math.sqrt(i); return `<circle cx="${n2(Math.cos(a) * rr)}" cy="${n2(-94 + Math.sin(a) * rr)}" r="1.4" fill="${shade(c, -12)}"/>`; })}`;
    return s;
  },
  ivy(c) {
    let s = '<path d="M0 0 C-10 -30 12 -60 -4 -104" fill="none" stroke="#6b5a3a" stroke-width="1.3"/>';
    const leaf = (x, y, a, sc, col) => `<path d="M0 0 C-6 -4 -12 -2 -12 -8 C-8 -10 -6 -14 -4 -18 C-2 -14 0 -16 0 -20 C0 -16 2 -14 4 -18 C6 -14 8 -10 12 -8 C12 -2 6 -4 0 0Z" fill="${col}" stroke="${shade(col, -15)}" stroke-width=".6" transform="translate(${x} ${y}) rotate(${a}) scale(${sc})"/>`;
    [[-2, -14, -60], [4, -30, 60], [-4, -46, -55], [6, -62, 50], [-2, -78, -50], [2, -94, 40]].forEach(([x, y, a], i) => { s += leaf(x, y, a, 1 - i * 0.07, shade(c, i % 2 ? 6 : 0)); });
    return s;
  },
  wheat(c) {
    let s = '<path d="M0 0 C1 -40 0 -60 2 -104" stroke="#c9a24f" stroke-width="1.4" fill="none"/>';
    for (let i = 0; i < 9; i++) { const y = -64 - i * 4.6; s += `<ellipse cx="-3.2" cy="${y}" rx="2.6" ry="4.8" fill="${shade(c, i % 2 ? 4 : -4)}" transform="rotate(-25 -3.2 ${y})"/><ellipse cx="3.2" cy="${y - 2}" rx="2.6" ry="4.8" fill="${shade(c, i % 2 ? -4 : 4)}" transform="rotate(25 3.2 ${y - 2})"/><path d="M${i % 2 ? -4 : 4} ${y - 4} l${i % 2 ? -5 : 5} -12" stroke="${shade(c, -10)}" stroke-width=".5"/>`; }
    return s;
  },
  pomegranate(c) {
    const d = shade(c, -18);
    return `<path d="M-6 -40 L-10 -50 L-4 -46 L0 -54 L4 -46 L10 -50 L6 -40Z" fill="${d}"/><circle r="40" fill="${c}" stroke="${d}"/><ellipse cx="-14" cy="-14" rx="10" ry="6" fill="#fff" opacity=".22" transform="rotate(-35 -14 -14)"/><path d="M-40 0 A40 40 0 0 0 40 0" fill="none" stroke="${d}" stroke-width=".8" opacity=".4"/>`;
  },
  // ---- upright kinds: base at (0,0), growing to about (0,-100)
  sweetpea(c) {
    const d = shade(c, -15);
    const bloom = (x, y, s, a) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="${ruffle(20, 14)}" fill="${c}" stroke="${d}" transform="rotate(-35)"/><path d="${ruffle(20, 14)}" fill="${shade(c, 8)}" stroke="${d}" transform="rotate(35)"/><path d="M-5 0 C-4 8 4 8 5 0Z" fill="${shade(c, -8)}"/></g>`;
    return `<path d="M0 0 C2 -40 -6 -70 4 -100" fill="none" stroke="${STEM}" stroke-width="2"/>${bloom(4, -96, 1, 10)}${bloom(-6, -74, 0.9, -20)}${bloom(6, -52, 0.85, 25)}${bloom(-2, -32, 0.7, -15)}`;
  },
  freesia(c) {
    const d = shade(c, -15);
    const f = (x, y, s, a) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 0 C-10 -6 -12 -20 -4 -24 C0 -26 4 -26 6 -22 C12 -16 10 -6 0 0Z" fill="${c}" stroke="${d}"/><path d="M-3 -20 C0 -14 2 -14 4 -20" fill="none" stroke="#f3d36b" stroke-width="2"/></g>`;
    return `<path d="M0 0 C0 -50 4 -70 30 -86" fill="none" stroke="${STEM}" stroke-width="2"/>${f(2, -58, 1, -10)}${f(10, -70, 0.9, 20)}${f(20, -80, 0.7, 45)}<ellipse cx="29" cy="-87" rx="3" ry="6" fill="#9fbf7a" transform="rotate(60 29 -87)"/>`;
  },
  lavender(c) {
    let s = `<path d="M0 0 L0 -100" stroke="#7d8f69" stroke-width="1.6"/>`;
    for (let i = 0; i < 18; i++) { const y = -50 - i * 3; s += `<ellipse cx="${i % 2 ? 2.5 : -2.5}" cy="${y}" rx="2.6" ry="3.6" fill="${shade(c, (i % 3) * 5 - 5)}"/>`; }
    return s;
  },
  delphinium(c) {
    const d = shade(c, -14);
    let s = `<path d="M0 0 L0 -104" stroke="${STEM}" stroke-width="2"/>`;
    for (let i = 0; i < 7; i++) { const y = -36 - i * 10; const sc = 1 - i * 0.09; s += `<g transform="translate(${i % 2 ? 5 : -5} ${y}) scale(${n2(sc)})">${ring(5, roundPetal(9, 6), c, d, i * 20, 0.6)}<circle r="2" fill="${shade(c, -30)}"/></g>`; }
    return s;
  },
  snapdragon(c) {
    const d = shade(c, -14);
    let s = `<path d="M0 0 L0 -100" stroke="${STEM}" stroke-width="2"/>`;
    for (let i = 0; i < 7; i++) { const y = -38 - i * 9.5; const sc = 1 - i * 0.08; s += `<g transform="translate(${i % 2 ? 5 : -5} ${y}) scale(${n2(sc)})"><path d="${ruffle(12, 9)}" fill="${c}" stroke="${d}" stroke-width=".7"/><path d="M-6 0 C-6 6 6 6 6 0Z" fill="${shade(c, 10)}" stroke="${d}" stroke-width=".7"/></g>`; }
    return s;
  },
  stock(c) {
    const d = shade(c, -12);
    let s = `<path d="M0 0 L0 -96" stroke="${STEM}" stroke-width="2.2"/>`;
    for (let i = 0; i < 9; i++) { const y = -40 - i * 7; const sc = 1 - i * 0.07; s += `<g transform="translate(${(i % 3 - 1) * 6} ${y}) scale(${n2(sc)})">${ring(4, ruffle(8, 7), i % 2 ? c : shade(c, 7), d, i * 25, 0.5)}</g>`; }
    return s;
  },
  astilbe(c) {
    const r = rng(11); let s = `<path d="M0 0 L0 -96" stroke="${STEM}" stroke-width="1.6"/>`;
    for (let i = 0; i < 70; i++) { const t = r(); const y = -40 - t * 58; const w = (1 - t) * 13; s += `<circle cx="${n2((r() - 0.5) * 2 * w)}" cy="${n2(y)}" r="${n2(1.2 + r())}" fill="${shade(c, (r() - 0.5) * 16)}"/>`; }
    return s;
  },
  gypsophila(c) {
    const r = rng(5); let s = ''; const pts = [];
    const branch = (x, y, a, len, depth) => {
      const x2 = x + Math.sin(a) * len; const y2 = y - Math.cos(a) * len;
      s += `<path d="M${n2(x)} ${n2(y)} L${n2(x2)} ${n2(y2)}" stroke="#8aa06a" stroke-width="${depth > 1 ? 1.1 : 0.7}"/>`;
      if (depth === 0) { pts.push([x2, y2]); return; }
      branch(x2, y2, a - 0.5 - r() * 0.2, len * 0.62, depth - 1); branch(x2, y2, a + 0.45 + r() * 0.2, len * 0.6, depth - 1);
      if (depth > 1) branch(x2, y2, a + (r() - 0.5) * 0.3, len * 0.55, depth - 1);
    };
    branch(0, 0, 0, 44, 3);
    pts.forEach(([x, y]) => { for (let k = 0; k < 3; k++) s += `<circle cx="${n2(x + (r() - 0.5) * 6)}" cy="${n2(y + (r() - 0.5) * 6)}" r="2.3" fill="${c}" stroke="#ddd" stroke-width=".4"/>`; });
    return s;
  },
  waxflower(c) {
    const r = rng(9); let s = '';
    const pts = [[0, -90], [-18, -78], [16, -80], [-26, -60], [24, -62], [-8, -70], [8, -58], [-14, -44], [14, -46]];
    pts.forEach(([x, y]) => { s += `<path d="M0 0 Q${x * 0.4} ${y * 0.5} ${x} ${y}" fill="none" stroke="#6f7f4a" stroke-width=".9"/>`; });
    pts.forEach(([x, y]) => { s += `<g transform="translate(${x} ${y}) rotate(${n2(r() * 70)})">${ring(5, roundPetal(5.5, 3.5), c, shade(c, -18), 0, 0.4)}<circle r="1.6" fill="${shade(c, -35)}"/></g>`; });
    return s;
  },
  statice(c) {
    const r = rng(4); let s = '<path d="M0 0 L0 -60 M0 -60 L-16 -84 M0 -60 L14 -88 M0 -40 L18 -62" stroke="#7d9a5a" stroke-width="1.4" fill="none"/>';
    [[-16, -84], [14, -88], [18, -62], [0, -62]].forEach(([x, y]) => { for (let k = 0; k < 9; k++) s += `<circle cx="${n2(x + (r() - 0.5) * 12)}" cy="${n2(y + (r() - 0.5) * 10)}" r="${n2(2.4 + r() * 1.4)}" fill="${shade(c, (r() - 0.5) * 18)}"/>`; });
    return s;
  },
  lilyvalley(c) {
    let s = '<path d="M0 0 C2 -50 10 -80 34 -92" fill="none" stroke="#6f9a4a" stroke-width="1.6"/><path d="M-4 0 C-30 -40 -24 -80 -6 -96 C-2 -70 -2 -30 -4 0Z" fill="#5f8f45" opacity=".9"/>';
    [[6, -58], [12, -70], [20, -80], [28, -87]].forEach(([x, y], i) => { s += `<path d="M${x} ${y} l0 6" stroke="#6f9a4a"/><path d="M${x - 5} ${y + 6} Q${x} ${y + 18 - i} ${x + 5} ${y + 6} Q${x} ${y + 2} ${x - 5} ${y + 6}Z" fill="${c}" stroke="#d6d6cf" stroke-width=".5"/>`; });
    return s;
  },
  blossom(c) {
    const r = rng(2); let s = '<path d="M0 0 C0 -30 -4 -60 0 -80" fill="none" stroke="#5a6b3a" stroke-width="2"/>';
    [[-14, -50, -40], [14, -40, 40], [-10, -76, -30], [12, -70, 30]].forEach(([x, y, a]) => { s += `<path d="${pointPetal(22, 9)}" fill="#3f6b2f" transform="translate(0 ${y + 10}) rotate(${a})"/>`; });
    [[0, -86], [-10, -80], [9, -79], [-4, -70], [6, -92]].forEach(([x, y]) => { s += `<g transform="translate(${x} ${y}) rotate(${n2(r() * 70)})">${ring(5, roundPetal(8, 5), c, '#e6e2d6', 0, 0.5)}<circle r="2" fill="#f0d36a"/></g>`; });
    return s;
  },
  jasmine(c) {
    const r = rng(8); let s = '<path d="M0 0 C-6 -30 6 -60 -2 -90" fill="none" stroke="#5a7a3a" stroke-width="1.6"/>';
    [[-10, -40, -50], [8, -56, 50], [-8, -72, -40]].forEach(([x, y, a]) => { s += `<path d="${pointPetal(16, 7)}" fill="#4f7a3a" transform="translate(0 ${y}) rotate(${a})"/>`; });
    [[-2, -92], [-12, -84], [8, -84], [2, -76], [-14, -66], [12, -64]].forEach(([x, y]) => { s += `<g transform="translate(${x} ${y}) rotate(${n2(r() * 70)})">${ring(5, `M0 0 C3 -3 3 -8 0 -9 C-3 -8 -3 -3 0 0Z`, c, '#e7e2d8', 0, 0.4)}</g>`; });
    return s;
  },
  eucalyptus(c) {
    let s = '<path d="M0 0 C-4 -40 6 -80 0 -104" fill="none" stroke="#7a6a5a" stroke-width="1.6"/>';
    for (let i = 0; i < 7; i++) { const y = -14 - i * 13; const rr = 9 - i * 0.6; s += `<circle cx="${n2(-rr - 1)}" cy="${y}" r="${n2(rr)}" fill="${shade(c, i % 2 ? 4 : -4)}" stroke="${shade(c, -15)}" stroke-width=".6"/><circle cx="${n2(rr + 1)}" cy="${y - 6}" r="${n2(rr)}" fill="${shade(c, i % 2 ? -4 : 4)}" stroke="${shade(c, -15)}" stroke-width=".6"/>`; }
    return s;
  },
  olive(c) {
    let s = '<path d="M0 0 C2 -40 -4 -70 2 -104" fill="none" stroke="#6b5e4a" stroke-width="1.5"/>';
    for (let i = 0; i < 9; i++) { const y = -12 - i * 10.5; const side = i % 2 ? 1 : -1; s += `<path d="${pointPetal(26 - i, 4.5)}" fill="${i % 3 ? c : shade(c, 12)}" transform="translate(0 ${y}) rotate(${side * 52})"/>`; }
    s += '<ellipse cx="-7" cy="-40" rx="3.4" ry="4.6" fill="#3d3a2a"/><ellipse cx="8" cy="-66" rx="3.4" ry="4.6" fill="#556b2f"/>';
    return s;
  },
  myrtle(c) {
    let s = '<path d="M0 0 L0 -100" stroke="#5a5040" stroke-width="1.4"/>';
    for (let i = 0; i < 12; i++) { const y = -8 - i * 8; s += `<path d="${pointPetal(13, 4.5)}" fill="${shade(c, (i % 3) * 5)}" transform="translate(0 ${y}) rotate(${i % 2 ? 58 : -58})"/>`; }
    [[0, -100], [-7, -84], [7, -60]].forEach(([x, y]) => { s += `<g transform="translate(${x} ${y})">${ring(5, roundPetal(5, 3.2), '#ffffff', '#ddd', 0, 0.4)}<circle r="1.6" fill="#f3e3a8"/></g>`; });
    return s;
  },
  ruscus(c) {
    let s = '<path d="M0 0 C-4 -40 4 -70 -6 -104" fill="none" stroke="#4a6a32" stroke-width="1.3"/>';
    for (let i = 0; i < 8; i++) { const y = -16 - i * 11; s += `<path d="${pointPetal(20, 7)}" fill="${shade(c, i % 2 ? 6 : 0)}" transform="translate(0 ${y}) rotate(${i % 2 ? 40 : -40})"/>`; }
    return s;
  },
  fern(c) {
    let s = '<path d="M0 0 C0 -50 6 -80 16 -106" fill="none" stroke="#4a6a32" stroke-width="1.3"/>';
    for (let i = 0; i < 16; i++) { const t = i / 16; const y = -14 - i * 5.8; const x = t * t * 14; const len = 22 * (1 - t * 0.75); s += `<path d="${pointPetal(len, 3)}" fill="${c}" transform="translate(${n2(x)} ${n2(y)}) rotate(${-62 + t * 8})"/><path d="${pointPetal(len, 3)}" fill="${shade(c, 6)}" transform="translate(${n2(x)} ${n2(y)}) rotate(${62 + t * 12})"/>`; }
    return s;
  },
  pampas(c) {
    const r = rng(6); let s = '<path d="M0 0 C2 -40 6 -70 14 -110" fill="none" stroke="#c9b48c" stroke-width="1.6"/>';
    for (let i = 0; i < 46; i++) { const t = 0.35 + r() * 0.65; const y = -110 * t; const x = 14 * t * t; const a = (r() - 0.5) * 1.6; const l = 10 + r() * 14 * (1 - Math.abs(t - 0.7)); s += `<path d="M${n2(x)} ${n2(y)} q${n2(Math.sin(a) * l * 0.5)} ${n2(-l * 0.4)} ${n2(Math.sin(a) * l)} ${n2(-Math.cos(a) * l * 0.8)}" fill="none" stroke="${shade(c, (r() - 0.5) * 10)}" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>`; }
    return s;
  },
};
export const UPRIGHT = new Set(['sweetpea', 'freesia', 'lavender', 'delphinium', 'snapdragon', 'stock', 'astilbe', 'gypsophila', 'waxflower', 'statice', 'lilyvalley', 'blossom', 'jasmine', 'eucalyptus', 'olive', 'myrtle', 'ruscus', 'fern', 'pampas', 'thistle', 'ball', 'ivy', 'wheat']);

export function drawFlower(shape, color, seed) { return (DRAW[shape] || DRAW.rose)(color, seed); }

// A single flower on its stem, for cards and the designer.
export function flowerSvg(f, color = f.colors[0], { width, height } = {}) {
  const c = color;
  let body;
  if (UPRIGHT.has(f.shape)) body = `<g transform="translate(0 50)">${drawFlower(f.shape, c)}</g>`;
  else {
    body = `<path d="M0 0 C2 25 -2 40 0 58" stroke="${STEM}" stroke-width="3" fill="none"/><path d="M0 32 C-18 24 -26 30 -30 38 C-18 40 -8 38 0 32Z" fill="#6f9a4a"/>`
      + (f.shape === 'tulip' || f.shape === 'calla' ? `<g transform="translate(0 -6)">${drawFlower(f.shape, c)}</g>` : `<g transform="scale(.9)">${drawFlower(f.shape, c)}</g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -62 120 122"${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''}>${body}</svg>`;
}

// ---------------------------------------------------------------- bouquet composer
export const BOUQUET_STYLES = [
  { value: 'round', label: 'Classic round' }, { value: 'garden', label: 'Loose garden' }, { value: 'cascade', label: 'Cascade' },
  { value: 'posy', label: 'Small posy' }, { value: 'boho', label: 'Boho & dried' },
];
export const BOUQUET_SIZES = [
  { value: 'bridal', label: 'Bridal bouquet' }, { value: 'bridesmaid', label: 'Bridesmaid' }, { value: 'boutonniere', label: 'Buttonhole' }, { value: 'centerpiece', label: 'Centrepiece' },
];
const STYLE_BONUS = {
  round: { rose: 12, peony: 12, hydrangea: 10, ranunculus: 8, lisianthus: 6, gypsophila: 6, eucalyptus: 6 },
  garden: { gardenrose: 14, peony: 10, sweetpea: 12, ranunculus: 8, cosmos: 8, scabiosa: 8, astilbe: 6, snapdragon: 6, eucalyptus: 6, jasmine: 6, olive: 6 },
  cascade: { orchid: 16, calla: 12, rose: 6, jasmine: 12, fern: 12, ruscus: 12, lilyvalley: 6, stock: 4, ivy: 14 },
  posy: { rose: 8, ranunculus: 10, lilyvalley: 12, anemone: 8, sweetpea: 8, myrtle: 8, waxflower: 6 },
  boho: { protea: 16, pampas: 20, dahlia: 8, eucalyptus: 10, statice: 10, scabiosa: 8, astilbe: 4, olive: 6, gardenrose: 6, thistle: 10, wheat: 8, craspedia: 6 },
};

function bestColor(f, palette) {
  if (f.kind === 'greenery') return { color: f.colors[0], dist: 0 };
  let best = { color: f.colors[0], dist: Infinity };
  for (const fc of f.colors) for (const pc of palette) { const d = colorDistance(fc, pc); if (d < best.dist) best = { color: fc, dist: d, pc }; }
  return best;
}

export function suggestBouquets({ palette, month, style = 'round', size = 'bridal', greek = false, count = 3, seed = 1 }) {
  const pal = (palette || []).filter(Boolean);
  const out = [];
  for (let k = 0; k < count; k++) {
    const r = rng(seed * 97 + k * 131 + 1);
    const scored = FLOWERS.map((f) => {
      const bc = bestColor(f, pal.length ? pal : ['#f8f1e5', '#f4c9c4']);
      const inSeason = !month || f.months.includes(month);
      let score = -bc.dist * 1.1 + (inSeason ? 18 : -22) + (STYLE_BONUS[style]?.[f.id] || 0) + r() * 22;
      if (greek && ['olive', 'myrtle', 'orangeblossom', 'jasmine', 'laurel', 'wheat', 'pomegranate', 'bougainvillea'].includes(f.id)) score += 10;
      if (style === 'boho' && f.id === 'pampas') score += 10;
      return { f, ...bc, score, inSeason };
    }).sort((a, b) => b.score - a.score);
    const take = (kinds, n, used) => {
      const res = [];
      for (const s of scored) {
        if (res.length >= n) break;
        if (!kinds.includes(s.f.kind) || used.has(s.f.id)) continue;
        // prefer colour variety within the bouquet
        if (res.some((x) => colorDistance(x.color, s.color) < 8) && r() < 0.6) continue;
        res.push(s); used.add(s.f.id);
      }
      return res;
    };
    const used = new Set();
    const isSmall = size === 'boutonniere';
    const focal = take(['focal'], isSmall ? 1 : style === 'posy' ? 1 : 2, used);
    const secondary = isSmall ? [] : take(['secondary'], style === 'posy' ? 1 : 2, used);
    const filler = take(['filler', 'line'], isSmall ? 1 : style === 'garden' || style === 'boho' ? 2 : 1, used);
    const green = take(['greenery'], isSmall ? 1 : 2, used);
    const items = [
      ...focal.map((x) => ({ id: x.f.id, color: x.color, role: 'focal' })),
      ...secondary.map((x) => ({ id: x.f.id, color: x.color, role: 'secondary' })),
      ...filler.map((x) => ({ id: x.f.id, color: x.color, role: 'filler' })),
      ...green.map((x) => ({ id: x.f.id, color: x.color, role: 'greenery' })),
    ];
    const ribbon = pal.length ? pal[Math.floor(r() * pal.length)] : '#f8f1e5';
    out.push({ style, size, items, ribbon, seed: Math.floor(r() * 1e6) });
  }
  return out;
}

export function bouquetMeaning(items) {
  return items.map((i) => flowerById(i.id)).filter(Boolean).map((f) => ({ name: f.name, meaning: f.meaning.split('.')[0] }));
}

// Compose a bouquet illustration. bouquet = { style, size, items:[{id,color,role}], ribbon, seed }
export function bouquetSvg(b) {
  const r = rng(b.seed || 1);
  const style = b.style || 'round'; const size = b.size || 'bridal';
  const items = (b.items || []).map((i) => ({ ...i, f: flowerById(i.id) })).filter((i) => i.f);
  const heads = items.filter((i) => !UPRIGHT.has(i.f.shape));
  const uprights = items.filter((i) => UPRIGHT.has(i.f.shape));
  const isCenter = size === 'centerpiece'; const isBout = size === 'boutonniere';
  const scaleAll = size === 'bridesmaid' ? 0.82 : style === 'posy' ? 0.78 : 1;
  const C = isCenter ? [200, 250] : [200, 185];
  const back = []; const front = []; const stems = [];
  const handle = [200, 410];

  // Head positions
  let nHeads = isBout ? 1 : isCenter ? 16 : style === 'posy' ? 9 : style === 'cascade' ? 14 : 15;
  if (size === 'bridesmaid') nHeads = Math.round(nHeads * 0.7);
  const rx = (isCenter ? 165 : style === 'garden' || style === 'boho' ? 128 : 112) * scaleAll;
  const ry = (isCenter ? 55 : 100) * scaleAll;
  const pts = [];
  for (let i = 0; i < nHeads; i++) {
    const a = i * 2.39996; const rad = Math.sqrt((i + 0.6) / nHeads);
    let x = C[0] + Math.cos(a) * rad * rx * 0.86; let y = C[1] + Math.sin(a) * rad * ry * 0.86;
    if (style === 'garden' || style === 'boho') { x += (r() - 0.5) * 26; y += (r() - 0.5) * 22; }
    pts.push([x, y, rad]);
  }
  if (style === 'cascade' && !isBout) {
    for (let i = 0; i < 6; i++) pts.push([C[0] + (r() - 0.5) * 70 * (1 - i / 7), C[1] + 70 + i * 32, 1]);
  }
  pts.sort((p, q) => p[2] - q[2]); // centre first
  // Assign heads: focal in the middle, secondary around
  const order = [];
  const focal = heads.filter((x) => x.role === 'focal'); const sec = heads.filter((x) => x.role !== 'focal');
  pts.forEach((p, i) => {
    const pool = (i < Math.ceil(pts.length * 0.45) && focal.length) || !sec.length ? focal : sec;
    const it = pool.length ? pool[i % pool.length] : heads[i % Math.max(1, heads.length)];
    if (it) order.push({ it, p });
  });
  // Uprights (fillers, greenery) radiate outwards
  const nUp = isBout ? 3 : isCenter ? 16 : style === 'posy' ? 8 : 14;
  const ups = [];
  for (let i = 0; i < nUp && uprights.length; i++) {
    const it = uprights[i % uprights.length];
    const isGreen = it.role === 'greenery';
    let ang;
    if (isCenter) ang = (i % 2 ? 1 : -1) * (60 + r() * 40);
    else if (style === 'cascade' && isGreen && i % 3 === 0) ang = 160 + (r() - 0.5) * 50;
    else ang = -95 + (i / nUp) * 190 + (r() - 0.5) * 18;
    const dist = (isGreen ? 0.55 : 0.35) * rx;
    const x = C[0] + Math.sin((ang * Math.PI) / 180) * dist * 0.5; const y = C[1] - Math.cos((ang * Math.PI) / 180) * dist * 0.4;
    const sc = (isGreen ? 1.25 : 1.05) * scaleAll * (isBout ? 0.75 : 1) * (0.85 + r() * 0.3);
    ups.push({ it, x, y, ang, sc, isGreen });
  }
  if (style === 'boho' && !isBout) {
    const pampas = uprights.find((u) => u.id === 'pampas');
    if (pampas) [-55, 48, 75].forEach((a) => ups.push({ it: pampas, x: C[0], y: C[1], ang: a, sc: 1.6 * scaleAll, isGreen: true }));
  }

  // Stems
  if (!isCenter) {
    const nStems = isBout ? 3 : 11;
    for (let i = 0; i < nStems; i++) {
      const sx = C[0] + (i - nStems / 2) * (isBout ? 4 : 9) * scaleAll;
      stems.push(`<path d="M${n2(sx)} ${C[1] + 20} Q${n2(handle[0] + (sx - 200) * 0.4)} ${handle[1] - 60} ${n2(handle[0] + (sx - 200) * 0.25)} ${isBout ? 300 : 470}" stroke="${shade(STEM, (i % 3) * 4)}" stroke-width="${isBout ? 4 : 5}" fill="none"/>`);
    }
  }

  ups.filter((u) => u.isGreen).forEach((u) => back.push(`<g transform="translate(${n2(u.x)} ${n2(u.y)}) rotate(${n2(u.ang)}) scale(${n2(u.sc)})">${drawFlower(u.it.f.shape, u.it.color, Math.floor(r() * 99))}</g>`));
  ups.filter((u) => !u.isGreen).forEach((u) => back.push(`<g transform="translate(${n2(u.x)} ${n2(u.y)}) rotate(${n2(u.ang)}) scale(${n2(u.sc)})">${drawFlower(u.it.f.shape, u.it.color, Math.floor(r() * 99))}</g>`));
  order.slice().reverse().forEach(({ it, p }) => {
    const base = it.role === 'focal' ? 0.95 : 0.72;
    const sc = base * scaleAll * (isBout ? 1.25 : 1) * (0.9 + r() * 0.2);
    front.push(`<g transform="translate(${n2(p[0])} ${n2(p[1])}) rotate(${n2((r() - 0.5) * 60)}) scale(${n2(sc)})">${drawFlower(it.f.shape, it.color, Math.floor(r() * 99))}</g>`);
  });

  const rib = b.ribbon || '#f8f1e5'; const ribD = shade(rib, -14);
  let base = '';
  if (isCenter) {
    base = `<path d="M110 300 Q200 330 290 300 L270 360 Q200 380 130 360Z" fill="#d6c7a8" stroke="#b39d72"/><rect x="180" y="360" width="40" height="40" fill="#cdb98f"/><ellipse cx="200" cy="402" rx="58" ry="10" fill="#bfa97b"/>`;
  } else if (isBout) {
    base = `<rect x="191" y="250" width="18" height="44" rx="4" fill="${rib}" stroke="${ribD}"/><path d="M200 252 l-6 -2 M200 300 l0 0" stroke="${ribD}"/><line x1="214" y1="210" x2="214" y2="320" stroke="#b8b8b8" stroke-width="1.5"/>`;
  } else {
    const y0 = handle[1] - 70;
    base = `<path d="M182 ${y0} L218 ${y0} L212 ${handle[1] + 40} L188 ${handle[1] + 40}Z" fill="${rib}" stroke="${ribD}"/>${rep(5, (i) => `<path d="M183 ${y0 + 12 + i * 20} L217 ${y0 + 6 + i * 20}" stroke="${ribD}" stroke-width=".8" opacity=".6"/>`)}
      <path d="M200 ${y0 + 4} C170 ${y0 - 20} 160 ${y0 + 20} 198 ${y0 + 8}Z M200 ${y0 + 4} C230 ${y0 - 20} 240 ${y0 + 20} 202 ${y0 + 8}Z" fill="${rib}" stroke="${ribD}"/>
      <path d="M198 ${y0 + 8} C190 ${y0 + 40} 178 ${y0 + 70} 170 ${y0 + 96}" stroke="${rib}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M202 ${y0 + 8} C212 ${y0 + 40} 224 ${y0 + 64} 236 ${y0 + 90}" stroke="${rib}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="200" cy="${y0 + 6}" r="6" fill="${shade(rib, -6)}" stroke="${ribD}"/>`;
  }
  const vb = isBout ? '110 70 180 260' : '0 0 400 500';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${isCenter ? base : ''}${stems.join('')}${back.join('')}${front.join('')}${isCenter ? '' : base}</svg>`;
}

export function flowerPaletteFit(f, palette) { return bestColor(f, palette); }
export const hueOf = (hex) => hexToHsl(hex)[0];
