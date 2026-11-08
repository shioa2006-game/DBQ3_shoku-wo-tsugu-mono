import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, noise, poly, spikyArc, spikyLine, tufts, scaleAt, face, waistShell, sideShade, neck, waistBelt, WAIST_BELT, compose, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// Roku: miner and charcoal burner. Spiky black hair, sun-darkened skin, thick brows,
// clean-shaven (unlike Belk), black stand-collar shirt under a leather vest
// with rust piping. Neck and collar belong to the torso.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#241a14', skin: '#c7773e', skinLight: '#e5995a', skinDark: '#8a4a22',
  hair: '#2b2521', hairLight: '#5b4d42', hairDark: '#100d0b',
  cloth: '#3b281c', clothLight: '#5a3e2b', clothDark: '#1c130d',
  shirt: '#2b2927', shirtLight: '#4d4844', shirtDark: '#131110',
  rust: '#a5532a', rustLight: '#d27c45', rustDark: '#592811',
  iron: '#76726c', ironLight: '#c9c4ba', ironDark: '#363431', leather: '#4c2f1b',
  iris: '#2f2620', irisLight: '#6e5a48', irisDark: '#0c0a08',
});
const DEFS = definitions(['hair', 'cloth', 'shirt', 'rust', 'iron', 'iris'], '<linearGradient id="hairU" gradientUnits="userSpaceOnUse" x1="40" y1="8" x2="86" y2="70"><stop stop-color="var(--hairLight)"/><stop offset=".48" stop-color="var(--hair)"/><stop offset="1" stop-color="var(--hairDark)"/></linearGradient>');
const LINE = '#663a1e';

// Prototype 02 (2026-11-08): the belt sits at the waist and the vest's skirt shows below it down to the old hem
// (humanoid-kit waistShell / waistBelt). The 3D arms hang at the sides, so the armhole piping stops at the
// armpit and the sides are shaded.
function torso(view) {
  const { l, r, d: outline, s: body } = waistShell(`roku-body-${view}`, view, [28, 25, 18, 25, 28], grad('cloth'), '#1a110b');
  const B = WAIST_BELT;
  let s = neck(view, { line: LINE }) + body;
  let wear = '';
  for (let i = 0; i < 48; i++) {
    const x = l + 3 + noise(i * 5 + 2) * (r - l - 6), y = 84 + noise(i * 9 + 1) * 34;
    wear += ellipse(x.toFixed(1), y.toFixed(1), (.8 + noise(i) * 1.6).toFixed(1), (.6 + noise(i * 2) * 1).toFixed(1), i % 3 ? 'var(--clothDark)' : 'var(--clothLight)', 'none', 0, 'opacity=".22"');
  }
  s += clipped(`roku-wear-${view}`, outline, wear);
  // Rust piping on the armholes and on the vest's front edges.
  if (view !== 2) s += line(`M${l + 4} 79 Q${l} 86 ${l + 1.5} 93 M${r - 4} 79 Q${r} 86 ${r - 1.5} 93`, 'var(--rust)', 1.5);
  else s += line('M70 80 Q75 87 74 93', 'var(--rust)', 1.5);
  if (view === 0) {
    // Black stand collar with a small notch; the vest opens in a deep V over the shirt down to the belt.
    s += path('M50 82 L63 100 L76 82 L74 78 Q63 80 52 78Z', grad('shirt'), '#0c0b0a', .8)
      + path('M50 70 Q63 66 76 70 L77 79 Q70 77 66 80 L63 85 L60 80 Q56 77 49 79Z', grad('shirt'), '#0c0b0a', .9)
      + line('M52 73 Q63 70 74 73', 'var(--shirtLight)', .7) + line('M63 85 V98', '#0c0b0a', .8)
      + line('M48 79 Q55 90 63 101 Q71 90 78 79', 'var(--rust)', 1.5);
  } else if (view === 1) {
    s += path('M45 82 L55 99 L70 80 L68 76 Q57 79 47 77Z', grad('shirt'), '#0c0b0a', .8)
      + path('M44 71 Q58 65 74 68 L75 77 Q67 76 62 79 L58 84 L55 79 Q51 76 44 79Z', grad('shirt'), '#0c0b0a', .9)
      + line('M46 73 Q59 68 72 70', 'var(--shirtLight)', .7)
      + line('M43 79 Q49 90 55 100 Q64 89 72 77', 'var(--rust)', 1.5);
  } else if (view === 2) {
    s += path('M46 77 Q60 73 74 66 L77 73 Q66 80 54 87 L47 86Z', grad('shirt'), '#0c0b0a', .9)
      + line('M49 79 Q62 75 73 69', 'var(--shirtLight)', .7)
      + line(`M46 87 Q47.5 94 47 ${B}`, 'var(--rust)', 1.5);
  } else {
    s += path('M45 72 Q63 65 81 72 L80 80 Q63 75 46 80Z', grad('shirt'), '#0c0b0a', .9)
      + line('M48 75 Q63 70 78 75', 'var(--shirtLight)', .7)
      + line(`M${l + 3} 82 Q63 77 ${r - 3} 82`, 'var(--rust)', 1.4)
      + line(`M63 84 Q61 92 63 ${B}`, 'var(--clothDark)', 1);
  }
  // The vest below the belt: its front edges with rust piping (the back seam), two folds.
  if (view <= 1) {
    const c = [63, 55][view];
    s += line(`M${c} ${B + 7} V120.5`, '#120c08', .9) + line(`M${c - 2} ${B + 7} Q${c - 3} 114 ${c - 3} 120 M${c + 2} ${B + 7} Q${c + 3} 114 ${c + 3} 120`, 'var(--rust)', 1.3);
  } else if (view === 2) s += line(`M47 ${B + 7} Q46.5 114 46 120`, 'var(--rust)', 1.5);
  else s += line(`M63 ${B + 8} V120.5`, 'var(--clothDark)', 1);
  s += line(view === 2 ? `M66 ${B + 9} Q67 114 69 119` : `M${l + 10} ${B + 9} Q${l + 9} 114 ${l + 7} 119 M${r - 10} ${B + 9} Q${r - 9} 114 ${r - 7} 119`, 'var(--clothDark)', .7);
  return s + waistBelt(view, l, r, { leather: 'var(--leather)', stitch: '#8a5a32', buckleFill: grad('iron'), buckleInk: 'var(--ironDark)', buckleLight: 'var(--ironLight)' });
}

// Spiky black hair: longer, sharper tips than Belk's, swept up and back.
function hairOutline(view) {
  const arc = (cx, from, to, seed) => spikyArc({ cx, cy: 41.5, rx: 28, ry: 27.5, from, to, count: 16, depth: .12, sweep: 6, seed });
  if (view === 0) return [...arc(63, 194, -14, 31), [89, 50], [86, 54], [84, 44], [70, 34], [56, 34], [42, 44], [40, 54], [37, 50]];
  if (view === 1) return [...arc(65, 198, -18, 33), [91, 53], [87, 57], [82, 48], [72, 34], [50, 34], [38, 46]];
  if (view === 2) return [...arc(67, 196, -50, 35), ...spikyLine([86, 61], [74, 56], 3, [0, 6], 32), [66, 44], [52, 36], [41, 44]];
  return [...arc(view === 3 ? 64 : 63, 194, -14, 37 + view), [89, 53], ...spikyLine([88, 57], [38, 57], 9, [0, 6], 34 + view), [37, 53]];
}
function hairBack(view) {
  const d = poly(hairOutline(view)), whorl = view >= 3 ? [64, 30] : [63 + (view === 2 ? 6 : view * 2), 24];
  const inner = tufts({ box: [32, 8, 94, 66], cx: whorl[0], cy: whorl[1], count: 130, len: [3, 8], colors: ['var(--hairLight)', 'var(--hairDark)', '#3d342d'], seed: 50 + view, width: .75 });
  return path(d, grad('hairU'), '#0b0908', 1) + clipped(`roku-hair-${view}`, d, inner);
}
// Forelocks: only the hanging edge is outlined; the cap blends into the crown (same
// user-space gradient and texture), so the bangs do not look pasted on. In profile and
// three-quarter views the same piece covers the hair above the ear and the sideburn.
const FRINGE = [
  { edge: [[38, 50], [41, 44], [44, 30], [46, 37], [50, 28], [53, 35], [59, 28], [62, 37], [68, 28], [72, 36], [77, 29], [80, 37], [84, 33], [85, 43], [88, 50]], cap: [[90, 35], [83, 23], [63, 18], [43, 23], [36, 35]] },
  { edge: [[35, 46], [38, 33], [39, 40], [42, 30], [46, 34], [51, 28], [55, 35], [61, 28], [65, 36], [71, 29], [74, 37], [76, 45], [79.5, 45.6], [83, 46.3], [86, 47], [88.5, 48]], cap: [[89, 34], [83, 22], [64, 17], [44, 22], [35, 32]] },
  { edge: [[38, 45], [40, 35], [43, 40], [48, 31], [52, 38], [57, 31], [58.5, 40], [61.4, 50.5], [65.2, 50.5], [66.4, 45.5], [69, 44.6], [72, 44.8], [75, 46], [78, 47.5]], cap: [[82, 40], [86, 28], [74, 20], [63, 19], [47, 22], [37, 31]] },
];
function fringe(view) {
  const f = FRINGE[view];
  if (!f) return '';
  const d = poly([...f.edge, ...f.cap]);
  const inner = tufts({ box: [33, 16, 92, 52], cx: 63 + view * 2, cy: 14, count: 110, len: [3, 7], colors: ['var(--hairLight)', 'var(--hairDark)', '#3d342d'], seed: 70 + view, width: .75 });
  return path(d, grad('hairU'), 'none', 0) + clipped(`roku-fringe-${view}`, d, inner)
    + line(`M${f.edge.map(([x, y]) => `${x} ${y}`).join(' L')}`, '#0b0908', .85);
}
const FACE = { shape: 'male', line: LINE, nose: 'adult', lid: '#1a110b', eye: { size: .7, width: 1.02, squash: .8, irisStroke: '#2a1f18', glint: '#8a7a68' }, brow: { thick: 1.65, tilt: .55, color: '#16110d' }, mouthColor: '#5e3018', smile: true };
const backEars = () => ellipse(36.5, 50, 3.6, 5.4, grad('skin'), LINE, .85) + ellipse(89.5, 50, 3.6, 5.4, grad('skin'), LINE, .85);
// Back views: the nape continues below the short hair so the head meets the torso's neck in the rig
// (the head mesh sits a little above the torso, which left a gap under the hair).
const NAPE = ['M52 46 H75 L76 73 Q63 76 50 73Z', 'M51 46 H76 L77 73 Q63 76 49 73Z'];
const nape = view => view >= 3 ? path(NAPE[view - 3], grad('skin'), LINE, .8) + line('M57 66 Q63 68 70 66', 'var(--skinDark)', .7) : '';
function head(view) {
  return scaleAt(63, 76, 1.05, 1.07, nape(view) + (view === 4 ? backEars() : '') + hairBack(view) + face(view, FACE) + fringe(view));
}
export const rokuMarkup = (direction, part = 'combined') => compose(direction, part, { head, torso });
export const buildRokuSheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, rokuMarkup);
