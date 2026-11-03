import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, face, shell, neck, belt, compose, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// Yomogi: elderly herbalist. Silver hair in a low bun under a green headscarf with
// leaf embroidery, round brass spectacles, a cream vest embroidered with leaves over a
// green high-collared shirt. Collar and vest belong to the torso; scarf and glasses to the head.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#30281f', skin: '#f2c8a0', skinLight: '#ffe2c4', skinDark: '#c69068',
  hair: '#b8b7bd', hairLight: '#efeef2', hairDark: '#7a7a84',
  scarf: '#6e7f48', scarfLight: '#9aac6c', scarfDark: '#404d27',
  vest: '#e6d9bb', vestLight: '#fbf3df', vestDark: '#b2a27e',
  shirt: '#5b7146', shirtLight: '#83996a', shirtDark: '#354529',
  gold: '#b38a3a', goldLight: '#ecc96e', goldDark: '#6a4f1f', leather: '#6a4426',
  iris: '#6b4a2e', irisLight: '#ad8a5c', irisDark: '#271a10',
});
const DEFS = definitions(['hair', 'scarf', 'vest', 'shirt', 'gold', 'iris']);
const LINE = '#8d6146';

const leaf = (x, y, a = 0, s = 1, color = 'var(--scarfLight)') =>
  `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${path('M0 -3.2 Q2 -1 0 3.2 Q-2 -1 0 -3.2Z', color, 'none')}${line('M0 -2.4 V2.6', 'var(--scarfDark)', .35)}</g>`;
const sprig = (x, y, a, s = 1, color) =>
  `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${line('M0 6 V-6', 'var(--shirt)', .7)}${[-4, -1, 2].map((k, i) => leaf(-1.6, k, -35, .62, color) + leaf(1.6, k + 1, 35, .62, color)).join('')}</g>`;

function torso(view) {
  const { l, r, s: shirt } = shell(view, [25, 23, 17, 23, 25], grad('shirt'), '#26331d');
  let s = neck(view, { line: LINE }) + shirt;
  if (view === 0) {
    // Cream vest panels leave the green placket showing down the front.
    s += path(`M${l + 4} 79 Q${l} 90 ${l + 1} 110 L58 110 L57 84 Q55 77 51 75 Q${l + 8} 76 ${l + 4} 79Z`, grad('vest'), 'var(--vestDark)', .85)
      + path(`M${r - 4} 79 Q${r} 90 ${r - 1} 110 L68 110 L69 84 Q71 77 75 75 Q${r - 8} 76 ${r - 4} 79Z`, grad('vest'), 'var(--vestDark)', .85)
      + sprig(48, 96, -12, 1, 'var(--scarf)') + sprig(78, 96, 12, 1, 'var(--scarf)')
      + path('M53 69 Q63 66 73 69 L74 76 Q63 74 52 76Z', grad('shirt'), 'var(--shirtDark)', .85)
      + line('M63 76 V110', 'var(--shirtDark)', .8)
      + ellipse(63, 79, 1.8, 1.8, grad('gold'), 'var(--goldDark)', .6) + ellipse(63, 90, 1.6, 1.6, grad('gold'), 'var(--goldDark)', .6);
  } else if (view === 1) {
    s += path(`M${l + 4} 79 Q${l} 90 ${l + 1} 110 L51 110 L50 84 Q48 77 45 75 Q${l + 8} 76 ${l + 4} 79Z`, grad('vest'), 'var(--vestDark)', .85)
      + path(`M${r - 4} 79 Q${r} 90 ${r - 1} 110 L61 110 L62 84 Q64 77 70 73 Q${r - 8} 75 ${r - 4} 79Z`, grad('vest'), 'var(--vestDark)', .85)
      + sprig(73, 96, 12, 1, 'var(--scarf)')
      + path('M46 69 Q58 64 70 66 L71 73 Q58 71 46 76Z', grad('shirt'), 'var(--shirtDark)', .85)
      + line('M56 75 V110', 'var(--shirtDark)', .8)
      + ellipse(56, 79, 1.7, 1.7, grad('gold'), 'var(--goldDark)', .6) + ellipse(56, 90, 1.5, 1.5, grad('gold'), 'var(--goldDark)', .6);
  } else if (view === 2) {
    s += path(`M50 80 Q47 92 48 110 L${r - 1} 110 Q${r} 90 ${r - 4} 80 Q63 76 50 80Z`, grad('vest'), 'var(--vestDark)', .85)
      + sprig(64, 96, 6, 1, 'var(--scarf)')
      + path('M48 75 Q60 72 74 65 L77 71 Q64 78 51 82Z', grad('shirt'), 'var(--shirtDark)', .85);
  } else {
    s += path(`M${l + 3} 79 Q${l} 90 ${l + 1} 110 L${r - 1} 110 Q${r} 90 ${r - 3} 79 Q63 74 ${l + 3} 79Z`, grad('vest'), 'var(--vestDark)', .85)
      + path('M47 71 Q63 66 79 71 L78 77 Q63 73 48 77Z', grad('shirt'), 'var(--shirtDark)', .85)
      + line('M63 80 Q62 95 63 109', 'var(--vestDark)', .8);
  }
  return s + belt(view, l, r, { leather: 'var(--leather)', stitch: '#a77c48' });
}

// Silver hair: soft waves at the temples and a low bun at the nape.
const HAIR = [
  'M32 48 Q30 38 38 32 L88 32 Q96 38 94 48 Q95 57 89 61 L84 50 L42 50 L37 61 Q31 57 32 48Z',
  'M33 47 Q31 36 40 31 L84 31 Q95 37 93 48 Q93 57 87 61 L80 50 L42 50 L37 58Z',
  'M44 40 Q46 32 56 30 L84 31 Q93 40 91 52 Q89 60 82 62 L70 58 L64 46 L50 42Z',
  'M36 46 Q34 36 41 31 L86 31 Q93 38 91 48 Q90 58 82 61 Q63 64 44 61 Q36 57 36 46Z',
  'M35 46 Q33 36 40 31 L86 31 Q94 36 91 46 Q91 58 84 61 Q63 64 42 61 Q35 57 35 46Z',
];
const BUN = [null, [87, 58, 6.5], [84, 62, 9], [68, 62, 10], [63, 62, 10.5]];
// Thick silver front hair under the kerchief (as in the original sheet): it starts above the
// kerchief's hem, so no skin shows between them, parts in the middle and covers the forehead
// to just above the brows and the temples.
const WAVES = [
  'M36 50 Q34 36 42 28 Q52 22 63 23 Q74 22 84 28 Q92 36 90 50 L86 52 Q85 42 78 37 Q70 34 64 38 Q63 33 62 38 Q56 34 48 37 Q41 42 40 52Z',
  'M33 50 Q31 36 39 28 Q48 22 58 23 Q72 22 82 29 Q88 37 87 50 L83 52 Q81 42 74 37 Q66 34 59 38 Q57 33 55 38 Q48 35 42 39 Q37 44 37 52Z',
  'M36 44 Q32 34 37 27 Q42 22 50 22.5 Q60 24 69 30.5 Q76 36 77 44 L73 45 Q70 43 66 45 Q63 39 57 36.5 Q50 34 44 36 Q40 40 40 46Z',
];
const WAVE_LINES = [
  'M42 46 Q44 34 54 29 M84 46 Q82 34 72 29 M50 33 Q57 29 62 31 M64 31 Q70 29 76 33',
  'M39 46 Q41 34 50 29 M80 46 Q79 35 70 30 M47 33 Q53 29 57 31 M60 31 Q66 29 73 33',
  'M38 40 Q40 30 50 26.5 M46 32 Q58 28 68 35 M58 28 Q68 30 74 38',
];
// Green headscarf: the hem crosses the forehead, the sides drape behind the ears and
// the corner hangs at the back.
const SCARF = [
  // The kerchief sits back on the head; its hem crosses high on the forehead.
  'M28 47 Q31 26 45 13 Q63 4 81 13 Q95 26 98 47 L91 49 Q88 36 80 28 Q63 22 46 28 Q38 36 35 49Z',
  'M28 45 Q31 25 45 13 Q64 4 84 14 Q96 27 98 50 L90 52 Q86 40 78 31 Q60 23 42 29 Q35 36 34 47Z',
  'M40 25 C40 14 50 7 64 7 C82 7 94 22 98 47 L89 54 Q83 44 75 38 Q66 31 58 26 Q49 23 40 25Z',
  'M30 46 Q32 24 46 13 Q63 5 82 13 Q96 26 97 50 L88 54 L70 56 L65 62 L59 56 L38 54Z',
  'M28 48 Q31 26 45 14 Q63 5 81 14 Q95 26 98 48 L88 53 L70 55 L63 62 L56 55 L38 53Z',
];
function scarf(view) {
  const d = SCARF[view];
  let inner = line([
    'M33 48 Q36 32 45 20 Q63 9 81 20 Q90 32 93 48', 'M33 46 Q35 30 45 19 Q63 9 82 19 Q92 31 94 48', 'M41 35 Q60 29 75 38 M42 34 Q43 20 54 13', 'M33 46 Q36 27 47 17 Q63 9 81 17 Q93 28 94 48', 'M31 47 Q34 28 46 18 Q63 9 80 18 Q92 28 95 47',
  ][view], 'var(--scarfLight)', 1.1);
  const spots = [[[48, 22], [63, 17], [78, 22]], [[52, 21], [68, 17], [82, 24]], [[60, 18], [76, 24], [86, 36]], [[50, 24], [66, 20], [80, 30], [62, 40]], [[48, 26], [63, 20], [78, 26], [63, 40]]][view];
  for (const [i, [x, y]] of spots.entries()) inner += sprig(x, y, i % 2 ? 15 : -15, .85);
  inner += line('M45 14 Q63 9 81 14', 'var(--scarfLight)', .8);
  let s = path(d, grad('scarf'), '#2f3a1c', 1) + clipped(`yomogi-scarf-${view}`, d, inner);
  if (view >= 3) s += path(`M${view === 3 ? 66 : 63} 58 l-3 4 l3 3 l3 -3Z`, grad('scarf'), '#2f3a1c', .8);
  return s;
}
function bun(view) {
  const b = BUN[view];
  if (!b) return '';
  const [x, y, r] = b;
  return ellipse(x, y, r, r * .9, grad('hair'), '#5c5c66', .9)
    + line(`M${x - r * .7} ${y - r * .1} Q${x} ${y - r * .8} ${x + r * .7} ${y} M${x - r * .5} ${y + r * .45} Q${x + r * .1} ${y} ${x + r * .6} ${y + r * .45}`, 'var(--hairDark)', .7);
}
function hair(view) {
  const d = HAIR[view];
  let inner = '';
  for (let i = 0; i < 10; i++) inner += line(`M${36 + i * 6} 32 Q${38 + i * 6} 44 ${35 + i * 6} 60`, i % 2 ? 'var(--hairDark)' : 'var(--hairLight)', .7);
  const back = view === 1 || view === 2 ? bun(view) : '';
  return back + path(d, grad('hair'), '#5c5c66', 1) + clipped(`yomogi-hair-${view}`, d, inner) + (view >= 3 ? bun(view) : '');
}
function waves(view) {
  if (view >= 3) return '';
  const d = WAVES[view];
  return path(d, grad('hair'), '#5c5c66', .9) + clipped(`yomogi-waves-${view}`, d, line(WAVE_LINES[view], 'var(--hairLight)', .9) + line(WAVE_LINES[view], 'var(--hairDark)', .4));
}
// Round brass spectacles sit on the eyes; the arms run back to the ears.
function glasses(view) {
  const c = 'var(--gold)', w = .95;
  if (view === 0) return ellipse(52, 48.5, 6, 5.4, 'rgba(255,255,255,.12)', c, w) + ellipse(74, 48.5, 6, 5.4, 'rgba(255,255,255,.12)', c, w) + line('M58 47.5 Q63 45.5 68 47.5 M46 47.5 L41 46.5 M80 47.5 L85 46.5', c, w);
  if (view === 1) return ellipse(45, 48.5, 4.4, 5.2, 'rgba(255,255,255,.12)', c, w) + ellipse(63.5, 49, 6, 5.4, 'rgba(255,255,255,.12)', c, w) + line('M49.4 48 Q53 46.4 57.5 48 M69.5 48 L78 47', c, w);
  if (view === 2) return ellipse(46.5, 48, 3.4, 5.2, 'rgba(255,255,255,.12)', c, w) + line('M50 47.5 L66 47', c, w);
  if (view === 3) return line('M33 47 L39 47.5', c, w);
  return '';
}
const FACE = { shape: 'elder', line: LINE, smile: true, wrinkles: true, blush: '#e8a088', eye: { size: .7, squash: .72, irisStroke: '#4a3220', glint: '#c8a070' }, brow: { thick: .7, tilt: -.3, color: '#8a8a92' }, mouthColor: '#9a5a40' };
function head(view) {
  return hair(view) + face(view, FACE) + waves(view) + scarf(view) + glasses(view);
}
export const yomogiMarkup = (direction, part = 'combined') => compose(direction, part, { head, torso });
export const buildYomogiSheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, yomogiMarkup);
