import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, noise, poly, spikyArc, spikyLine, tufts, scaleAt, face, waistShell, sideShade, neck, waistBelt, WAIST_BELT, compose, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// Belk: weathered blacksmith. Tousled brown hair, short full beard, heavy brows,
// burgundy stand collar on a dark leather jerkin and an iron-buckled belt.
// Neck and collar belong to the torso; beard and hair belong to the head.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#2c2118', skin: '#c47a47', skinLight: '#e4a06a', skinDark: '#8a4c2b',
  hair: '#6b4b2d', hairLight: '#a07a4c', hairDark: '#382618',
  beard: '#6c5844', beardLight: '#a28b70', beardDark: '#3b2c20',
  cloth: '#3f281b', clothLight: '#614030', clothDark: '#1f130c',
  red: '#6e2621', redLight: '#a2463a', redDark: '#3a1210',
  iron: '#7b7b76', ironLight: '#cfcfc6', ironDark: '#393937', leather: '#4f321c',
  iris: '#4a3322', irisLight: '#9a7650', irisDark: '#140e0a',
});
const DEFS = definitions(['hair', 'beard', 'cloth', 'red', 'iron', 'iris'], '<linearGradient id="hairU" gradientUnits="userSpaceOnUse" x1="40" y1="8" x2="86" y2="70"><stop stop-color="var(--hairLight)"/><stop offset=".48" stop-color="var(--hair)"/><stop offset="1" stop-color="var(--hairDark)"/></linearGradient>');
const LINE = '#6b4028';

// Prototype 02 (2026-11-08): the belt sits at the waist and the jerkin's skirt shows below it down to the old hem,
// buttoned with iron (humanoid-kit waistShell / waistBelt). No apron (decided 2026-11-08). The 3D arms hang at the
// sides, so the armhole piping stops at the armpit and the sides are shaded.
function torso(view) {
  const { l, r, d: outline, s: body } = waistShell(`belk-body-${view}`, view, [29, 26, 19, 26, 29], grad('cloth'), '#1f140c');
  const B = WAIST_BELT;
  let s = neck(view, { line: LINE }) + body;
  // Worn leather: mottled patches clipped to the jerkin.
  let wear = '';
  for (let i = 0; i < 48; i++) {
    const x = l + 3 + noise(i * 5) * (r - l - 6), y = 84 + noise(i * 9) * 34;
    wear += ellipse(x.toFixed(1), y.toFixed(1), (.8 + noise(i) * 1.6).toFixed(1), (.6 + noise(i * 2) * 1).toFixed(1), i % 3 ? 'var(--clothDark)' : 'var(--clothLight)', 'none', 0, 'opacity=".22"');
  }
  s += clipped(`belk-wear-${view}`, outline, wear);
  // Burgundy piping round the armholes, where the 3D sleeves meet the jerkin.
  if (view !== 2) s += line(`M${l + 4} 79 Q${l} 86 ${l + 1.5} 93 M${r - 4} 79 Q${r} 86 ${r - 1.5} 93`, 'var(--red)', 1.6);
  else s += line('M71 80 Q76 87 75 93', 'var(--red)', 1.6);
  if (view === 0) {
    // Stand collar opens in a V over a dark red shirt; the jerkin buttons below the belt.
    s += path('M50 70 Q63 66 76 70 L77 76 Q63 72 49 76Z', 'var(--redDark)', '#2a0c0a', .8)
      + path('M56 76 L63 95 L70 76 Q63 79 56 76Z', 'var(--redDark)', '#2a0c0a', .7)
      + path('M57 75 Q63 78 69 75 L66 82 Q63 84 60 82Z', grad('skin'), 'none')
      + path('M48 72 L55 71 L63 95 L58 97 Q50 88 45 78Z', grad('red'), 'var(--redDark)', .85)
      + path('M78 72 L71 71 L63 95 L68 97 Q76 88 81 78Z', grad('red'), 'var(--redDark)', .85)
      + line('M51 75 L59 90 M75 75 L67 90', 'var(--redLight)', .65);
  } else if (view === 1) {
    s += path('M44 72 Q58 66 74 68 L75 74 Q59 71 44 78Z', 'var(--redDark)', '#2a0c0a', .8)
      + path('M50 76 L56 94 L64 74 Q56 77 50 76Z', 'var(--redDark)', '#2a0c0a', .7)
      + path('M51 75 Q57 77 63 74 L59 81 Q56 83 54 81Z', grad('skin'), 'none')
      + path('M43 74 L49 73 L56 94 L52 95 Q45 86 41 79Z', grad('red'), 'var(--redDark)', .85)
      + path('M75 70 L66 71 L56 94 L61 96 Q71 86 78 76Z', grad('red'), 'var(--redDark)', .85)
      + line('M46 77 L53 89 M71 73 L60 90', 'var(--redLight)', .65);
  } else if (view === 2) {
    // Profile collar climbs toward the nape instead of a flat ring.
    s += path('M47 77 Q60 74 74 66 L78 72 Q67 81 54 88 L48 88Z', grad('red'), 'var(--redDark)', .9)
      + line('M50 80 Q62 77 74 69', 'var(--redLight)', .7)
      + line(`M48 89 Q49 95 48 ${B}`, '#1a110b', .9);
  } else {
    s += path('M45 72 Q63 65 81 72 L80 80 Q63 75 46 80Z', grad('red'), 'var(--redDark)', .9)
      + line('M48 75 Q63 70 78 75', 'var(--redLight)', .7)
      + line(`M63 81 Q61 91 63 ${B}`, 'var(--clothDark)', 1);
  }
  // The jerkin below the belt: its two front edges (one in profile; the back seam), iron buttons, two folds.
  const c = [63, 56.5, 48, 63, 63][view];
  if (view <= 1) {
    s += line(`M${c - 3} ${B + 7} Q${c - 2} 113 ${c - 3} 120.5 M${c + 3} ${B + 7} Q${c + 2} 113 ${c + 3} 120.5`, '#1a110b', .9);
    for (const y of [111, 116]) s += ellipse(c, y, 1.4, 1.4, 'var(--ironLight)', 'var(--ironDark)', .5);
  } else s += line(`M${c} ${B + 8} V120.5`, view === 2 ? '#1a110b' : 'var(--clothDark)', view === 2 ? .9 : 1);
  s += line(view === 2 ? `M67 ${B + 9} Q68 114 70 119` : `M${l + 10} ${B + 9} Q${l + 9} 114 ${l + 7} 119 M${r - 10} ${B + 9} Q${r - 9} 114 ${r - 7} 119`, 'var(--clothDark)', .7);
  return s + waistBelt(view, l, r, { leather: 'var(--leather)', stitch: '#8a6238', buckleFill: grad('iron'), buckleInk: 'var(--ironDark)', buckleLight: 'var(--ironLight)' });
}

// Tousled hair: a spiky crown outline plus strands radiating from the whorl.
function hairOutline(view) {
  const arc = (cx, from, to, seed) => spikyArc({ cx, cy: 41, rx: 28.5, ry: 28.5, from, to, count: 19, depth: .075, sweep: 3, seed });
  // Short at the temples so the ears show, as in the reference.
  if (view === 0) return [...arc(63, 192, -12, 3), [89, 49], [86, 52], [84, 44], [70, 34], [56, 34], [42, 44], [40, 52], [37, 49]];
  if (view === 1) return [...arc(65, 196, -16, 5), [91, 52], [87, 56], [82, 48], [72, 34], [50, 34], [38, 46]];
  if (view === 2) return [...arc(67, 196, -48, 7), ...spikyLine([86, 60], [74, 56], 4, [0, 5], 2), [66, 44], [52, 36], [41, 44]];
  return [...arc(view === 3 ? 64 : 63, 194, -14, 9 + view), [89, 53], ...spikyLine([88, 57], [38, 57], 12, [0, 5], 4 + view), [37, 53]];
}
function hairBack(view) {
  const d = poly(hairOutline(view)), whorl = view >= 3 ? [64, 30] : [63 + (view === 2 ? 6 : view * 2), 24];
  const inner = tufts({ box: [32, 10, 94, 68], cx: whorl[0], cy: whorl[1], count: 150, len: [3, 7], colors: ['var(--hairDark)', 'var(--hairLight)', '#4e3620', 'var(--hairDark)'], seed: 20 + view, width: .75 });
  return path(d, grad('hairU'), '#2f2015', 1) + clipped(`belk-hair-${view}`, d, inner);
}
// Forelocks: only the hanging edge is outlined; the cap blends into the crown (same
// user-space gradient and texture), so the bangs do not look pasted on. In profile and
// three-quarter views the same piece covers the hair above the ear and the sideburn.
const FRINGE = [
  { edge: [[38, 50], [41, 44], [44, 31], [46, 38], [50, 29], [57, 27], [60, 35], [66, 27], [71, 29], [75, 38], [79, 30], [84, 34], [85, 44], [88, 50]], cap: [[90, 36], [83, 24], [63, 19], [43, 24], [36, 36]] },
  { edge: [[35, 46], [38, 34], [40, 40], [44, 31], [50, 29], [53, 36], [59, 28], [65, 29], [69, 38], [73, 30], [75.5, 37], [76, 45], [79.5, 45.6], [83, 46.3], [86, 47], [88.5, 48]], cap: [[89, 35], [83, 23], [64, 18], [44, 22], [35, 32]] },
  { edge: [[37, 46], [40, 36], [43, 42], [47, 35], [51, 41], [54, 35], [58, 41], [61.4, 50.5], [65.2, 50.5], [66.4, 45.5], [69, 44.6], [72, 44.8], [75, 46], [78, 47.5]], cap: [[82, 40], [86, 28], [74, 20], [63, 19], [47, 22], [37, 31]] },
];
function fringe(view) {
  const f = FRINGE[view];
  if (!f) return '';
  const d = poly([...f.edge, ...f.cap]);
  const inner = tufts({ box: [33, 16, 92, 56], cx: 63 + view * 2, cy: 14, count: 110, len: [3, 7], colors: ['var(--hairDark)', 'var(--hairLight)', '#4e3620', 'var(--hairDark)'], seed: 40 + view, width: .75 });
  return path(d, grad('hairU'), 'none', 0) + clipped(`belk-fringe-${view}`, d, inner)
    + line(`M${f.edge.map(([x, y]) => `${x} ${y}`).join(' L')}`, '#2f2015', .85);
}
// Short full beard along the jaw and chin, joined to the sideburns, with a moustache.
const BEARD = [
  'M44 50 L46.5 51 Q47 57 50 60 Q54 62 57 66 Q60 67 63 66.5 Q66 67 69 66 Q72 62 76 60 Q79 57 79.5 51 L82 50 Q84 64 79 69 Q72 73.5 63 74.5 Q54 73.5 47 69 Q42 64 44 50Z',
  'M38 48 L41 49 Q42 56 46 59 Q49 62 51 65 Q54 66 57 65.5 Q60 66 62 65 Q66 61 70 59 Q76 56 77 50 L80 49 Q80 63 73 69 Q65 73.5 56 73.5 Q46 72.5 41 67 Q36 60 38 48Z',
  'M62 45 L66 45 Q68 56 64 62 Q58 70 49 72 Q42 72 39 66 L38 61 Q42 63 45 60 Q50 57 55 57 Q59 55 60 50Z',
];
const MOUSTACHE = [
  'M55 63.6 Q59 60.8 63 62 Q67 60.8 71 63.6 L69.5 64.7 Q66 63.1 63 63.9 Q60 63.1 56.5 64.7Z',
  'M46 63.2 Q50 60.4 54.5 61.6 Q58 60.6 61 63.2 L59.6 64.4 Q56.5 62.8 54 63.6 Q51 63 47.4 64.5Z',
  'M35.5 62.4 Q39.5 59.4 45 61 L44.5 62.8 Q41 62 37 64Z',
];
function beard(view) {
  if (view >= 3) return '';
  let inner = '';
  for (let i = 0; i < 60; i++) {
    const x = 33 + noise(i * 3) * 56, y = 46 + noise(i * 5) * 31;
    inner += line(`M${x.toFixed(1)} ${y.toFixed(1)} l.5 1.4`, i % 3 ? 'var(--beardDark)' : 'var(--beardLight)', .65);
  }
  let s = path(BEARD[view], grad('beard'), 'none', 0, 'opacity=".88"') + clipped(`belk-beard-${view}`, BEARD[view], inner);
  if (view < 3) s += path(MOUSTACHE[view], grad('beard'), '#3a2a1c', .6);
  if (view === 0) s += line('M58.5 65.4 Q63 66.6 67.5 65.4', '#5a2c1a', 1) + line('M60.5 67.6 Q63 68.4 65.5 67.6', 'var(--skinLight)', .6);
  if (view === 1) s += line('M49 65 Q53.5 66.2 58.5 64.8', '#5a2c1a', .95);
  return s;
}
const FACE = { shape: 'male', line: LINE, nose: 'adult', lid: '#24170e', folds: 'var(--skinDark)', eye: { size: .66, width: 1.04, squash: .74, irisStroke: '#3b2a1c', glint: '#a88a5c' }, brow: { thick: 1.5, tilt: 1, color: '#3a2716' }, mouthColor: '#6a3c26' };
// Ears stick out past the short hair at the back.
const backEars = () => ellipse(36.5, 50, 3.6, 5.4, grad('skin'), LINE, .85) + ellipse(89.5, 50, 3.6, 5.4, grad('skin'), LINE, .85);
// Back views: the nape continues below the short hair so the head meets the torso's neck in the rig
// (the head mesh sits a little above the torso, which left a gap under the hair).
const NAPE = ['M52 46 H75 L76 73 Q63 76 50 73Z', 'M51 46 H76 L77 73 Q63 76 49 73Z'];
const nape = view => view >= 3 ? path(NAPE[view - 3], grad('skin'), LINE, .8) + line('M57 66 Q63 68 70 66', 'var(--skinDark)', .7) : '';
// The reference head is larger than the villagers'; grow it from the chin so the neck joint stays put.
function head(view) {
  return scaleAt(63, 76, 1.06, 1.08, nape(view) + (view === 4 ? backEars() : '') + hairBack(view) + face(view, FACE) + beard(view) + fringe(view));
}
export const belkMarkup = (direction, part = 'combined') => compose(direction, part, { head, torso });
export const buildBelkSheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, belkMarkup);
