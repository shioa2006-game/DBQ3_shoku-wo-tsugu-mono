import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, face, shell, neck, compose, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// Nagi: keeper of the bamboo-grove shrine, drawn as a shrine maiden. Long black hair
// with straight-cut bangs and side locks, tied low with white paper; white robe with a
// red under-collar and red hakama. Neck, collar and hakama belong to the torso.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#2a2328', skin: '#f9d3ae', skinLight: '#ffe8cc', skinDark: '#d9a079',
  hair: '#24252e', hairLight: '#525a72', hairDark: '#0c0c12',
  robe: '#f2eee4', robeLight: '#ffffff', robeDark: '#c4bcaa',
  red: '#b52b25', redLight: '#e05242', redDark: '#6c1611',
  iris: '#3b4f76', irisLight: '#7f9fc8', irisDark: '#121a2b',
});
const DEFS = definitions(['hair', 'robe', 'red', 'iris']);
const LINE = '#94644a';

function torso(view) {
  const { l, r, s: robe } = shell(view, [25, 23, 17, 23, 25], grad('robe'), '#8a8270');
  // Three-quarter: a slimmer neck set under the chin, so it does not look long beside the collar.
  let s = (view === 1 ? path('M53 64 L66 62 L68 74 Q60 79 51 75Z', grad('skin'), LINE, .8) : neck(view, { line: LINE })) + robe;
  // Soft folds of the white robe.
  s += line(`M${l + 5} 82 Q${l + 2} 92 ${l + 4} 100 M${r - 5} 82 Q${r - 2} 92 ${r - 4} 100`, 'var(--robeDark)', .9);
  if (view === 0) {
    s += path('M51 73 L56 72 L65 87 L63 91Z', grad('robe'), 'var(--robeDark)', .8)
      + path('M75 73 L70 72 L61 87 L63 91Z', grad('robe'), 'var(--robeDark)', .8)
      + path('M55 73 Q63 78 71 73 L63 84Z', grad('skin'), 'none')
      + line('M53.5 72.5 L63 89 L72.5 72.5', 'var(--red)', 1.3)
      + line('M58 84 Q55 90 54 98 M68 84 Q71 90 72 98', 'var(--robeDark)', .7);
  } else if (view === 1) {
    // The collar stands up around the neck and crosses just under the chin.
    s += path('M46 72 L51 70.5 L58.5 84 L56.5 88Z', grad('robe'), 'var(--robeDark)', .8)
      + path('M70 69 L64.5 69.5 L54.5 84 L56.5 88Z', grad('robe'), 'var(--robeDark)', .8)
      + path('M50.5 71 Q57 75 65 70 L56.5 81Z', grad('skin'), 'none')
      + line('M48.5 71.5 L56.5 86 L67.5 69.5', 'var(--red)', 1.3);
  } else if (view === 2) {
    s += path('M48 78 Q60 75 74 67 L77 73 Q64 82 52 92 L48 90Z', grad('robe'), 'var(--robeDark)', .85)
      + line('M49 80 Q61 76 74 69', 'var(--red)', 1.2);
  } else {
    s += path('M46 73 Q63 67 80 73 L79 79 Q63 74 47 79Z', grad('robe'), 'var(--robeDark)', .85)
      + line('M47 76 Q63 71 79 76', 'var(--red)', 1.1)
      + line('M63 80 Q62 90 63 99', 'var(--robeDark)', .8);
  }
  // Red hakama tied high at the waist, pleats below the ties.
  s += path(`M${l + 1} 100 Q63 104 ${r - 1} 100 L${r - 1} 118 Q63 123 ${l + 1} 118Z`, grad('red'), 'var(--redDark)', .95)
    + line(`M${l + 2} 103 Q63 107 ${r - 2} 103`, 'var(--redDark)', .9);
  for (const x of [l + 8, 63 - (view === 2 ? 4 : 0), r - 8]) s += line(`M${x} 106 L${x + (x - 63) * .05} 120`, 'var(--redDark)', .8);
  if (view <= 2) {
    const c = [63, 55, 47][view], k = view === 2 ? .6 : 1;
    s += path(`M${c} 102 Q${c - 7 * k} 98 ${c - 9 * k} 102 Q${c - 7 * k} 106 ${c} 103Z`, grad('red'), 'var(--redDark)', .8)
      + path(`M${c} 102 Q${c + 7 * k} 98 ${c + 9 * k} 102 Q${c + 7 * k} 106 ${c} 103Z`, grad('red'), 'var(--redDark)', .8)
      + path(`M${c - 1} 103 L${c - 3 * k} 112 L${c} 111Z M${c + 1} 103 L${c + 3 * k} 112 L${c} 111Z`, 'var(--red)', 'var(--redDark)', .7);
  } else {
    // Stiff back plate of the hakama.
    s += path('M53 101 L73 101 L71 109 L55 109Z', grad('robe'), 'var(--robeDark)', .8);
  }
  return s;
}

// Long straight hair behind the face; it falls behind the shoulders.
const BACK = [
  'M33 40 C33 18 47 8 63 8 C79 8 93 18 93 40 Q94 56 92 70 L86 72 L84 52 Q63 44 42 52 L40 72 L34 70 Q32 56 33 40Z',
  'M34 38 C33 18 47 8 63 8 C80 8 94 20 93 40 Q94 56 92 70 L86 72 L80 50 Q60 44 42 52 L40 70 L35 68Z',
  'M36 40 C34 20 47 9 62 9 C80 9 93 22 93 42 Q95 58 93 73 L80 75 Q76 62 70 52 L56 44 L44 42 L40 48Z',
  'M34 40 C33 19 47 8 63 8 C80 8 93 20 93 41 Q95 58 92 74 Q76 77 62 76 Q48 77 36 73 Q33 56 34 40Z',
  'M33 40 C33 18 47 8 63 8 C79 8 93 18 93 40 Q95 58 91 75 Q76 77 63 76 Q50 77 35 75 Q31 58 33 40Z',
];
// Straight-cut bangs and side locks that cover the ears (hime cut).
const FRONT = [
  'M35 46 C34 24 47 11 63 11 C79 11 92 24 91 46 L89 66 L85 68 L84 46 L81 40 Q72 42.5 63 41.5 Q54 42.5 45 40 L42 46 L41 68 L37 66Z',
  'M35 46 C34 24 46 12 61 12 C78 12 89 24 88 46 L86 66 L82 68 L80 44 Q70 41.5 60 41.5 Q50 41.5 43 40 L40 46 L39 63 L36 61Z',
  'M37 46 C36 26 46 13 60 12 C72 12 80 18 82 28 Q76 33 73 41 Q75 50 74 66 L63 68 Q62 50 58 43 L50 41.5 L43 42 L41 48Z',
];
function hairBack(view) {
  const d = BACK[view];
  let inner = '';
  for (let i = 0; i < 14; i++) {
    const x = 35 + i * 4.3;
    inner += line(`M63 9 Q${x} ${14 + Math.abs(x - 63) * .3} ${(x + (x - 63) * .08).toFixed(1)} 76`, i % 2 ? 'var(--hairDark)' : '#3a3d4c', .7);
  }
  inner += line('M48 14 Q40 24 38 40 M78 14 Q86 24 88 40', 'var(--hairLight)', 1);
  let s = path(d, grad('hair'), '#08080c', 1.1) + clipped(`nagi-back-${view}`, d, inner);
  // White paper tie holding the hair low on the back.
  if (view >= 3) {
    const x = view === 3 ? 66 : 63;
    s += path(`M${x - 6} 60 h12 v7 h-12Z`, grad('robe'), 'var(--robeDark)', .8) + line(`M${x - 6} 63.5 h12`, 'var(--red)', 1.1);
  }
  return s;
}
function fringe(view) {
  if (view >= 3) return '';
  const d = FRONT[view];
  let inner = '';
  for (let i = 0; i < 16; i++) {
    const x = 36 + i * 3.6;
    inner += line(`M${[63, 59, 55][view]} 12 Q${x} 20 ${x.toFixed(1)} ${x < 44 || x > 82 ? 68 : 42}`, i % 2 ? 'var(--hairDark)' : '#3a3d4c', .65);
  }
  inner += line(`M${[52, 48, 46][view]} 16 Q${[46, 42, 42][view]} 22 ${[44, 40, 40][view]} 32 M${[74, 70, 64][view]} 16 Q${[80, 76, 70][view]} 22 ${[82, 78, 74][view]} 32`, 'var(--hairLight)', 1.1);
  return path(d, grad('hair'), '#08080c', 1) + clipped(`nagi-front-${view}`, d, inner);
}
const FACE = { shape: 'female', line: LINE, blush: '#f2a08a', eye: { size: .8, irisStroke: '#26344e', pupil: '#0e1420', glint: '#a8c4ea' }, brow: { thick: .65, tilt: -.25, color: '#2a2a34' }, mouthColor: '#b0604a' };
function head(view) {
  return hairBack(view) + face(view, FACE) + fringe(view);
}
export const nagiMarkup = (direction, part = 'combined') => compose(direction, part, { head, torso });
export const buildNagiSheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, nagiMarkup);
