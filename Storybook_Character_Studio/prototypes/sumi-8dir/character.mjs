import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, face, shell, neck, compose, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// Sumi: a motherly townswoman (no dedicated original art; shared Kaya's sheet before).
// Greying hair swept back into a top bun held by a wooden comb, kind smiling eyes,
// slate-blue kimono with a cream collar, a narrow indigo sash and a work apron.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#30261f', skin: '#efbf94', skinLight: '#ffd9b3', skinDark: '#c58a5e',
  hair: '#5c4c42', hairLight: '#a4968a', hairDark: '#2f251f',
  cloth: '#4b5c6e', clothLight: '#7488a0', clothDark: '#2c3948',
  ivory: '#ecdcb8', ivoryLight: '#fff4dc', ivoryDark: '#ad9a74',
  apron: '#d9cbaa', apronLight: '#f1e6cc', apronDark: '#a39272',
  sash: '#2f3e5c', sashLight: '#52658a', sashDark: '#1a2338',
  wood: '#8a5a2c', iris: '#5c3c24', irisLight: '#a07a50', irisDark: '#22160e',
});
const DEFS = definitions(['hair', 'cloth', 'ivory', 'apron', 'sash', 'iris']);
const LINE = '#8a5c3e';

function torso(view) {
  const { l, r, s: kimono } = shell(view, [25, 23, 17, 23, 25], grad('cloth'), '#1e2832');
  let s = neck(view, { line: LINE }) + kimono;
  s += line(`M${l + 5} 82 Q${l + 2} 92 ${l + 4} 100 M${r - 5} 82 Q${r - 2} 92 ${r - 4} 100`, 'var(--clothDark)', .9);
  if (view === 0) {
    s += path('M50 73 L55 72 L65.5 87 L63 91Z', grad('ivory'), 'var(--ivoryDark)', .8)
      + path('M76 73 L71 72 L60.5 87 L63 91Z', grad('ivory'), 'var(--ivoryDark)', .8)
      + path('M55 73 Q63 78 71 73 L63 85Z', grad('skin'), 'none');
  } else if (view === 1) {
    s += path('M44 74 L49 73 L58 86 L55 90Z', grad('ivory'), 'var(--ivoryDark)', .8)
      + path('M71 71 L65 71 L53 86 L56 90Z', grad('ivory'), 'var(--ivoryDark)', .8)
      + path('M49 73 Q56 77 65 72 L56 84Z', grad('skin'), 'none');
  } else if (view === 2) {
    s += path('M48 78 Q60 75 74 67 L77 73 Q64 82 52 92 L48 90Z', grad('ivory'), 'var(--ivoryDark)', .85);
  } else {
    s += path('M46 73 Q63 67 80 73 L79 79 Q63 74 47 79Z', grad('ivory'), 'var(--ivoryDark)', .85);
  }
  // Narrow indigo sash; a work apron hangs from it on the front.
  s += path(`M${l + 1} 99 Q63 103 ${r - 1} 99 L${r - 1} 105 Q63 109 ${l + 1} 105Z`, grad('sash'), 'var(--sashDark)', .9)
    + line(`M${l + 2} 101 Q63 105 ${r - 2} 101`, 'var(--sashLight)', .6);
  if (view <= 2) {
    const a = [[l + 4, r - 4], [l + 2, r - 7], [44, r - 2]][view];
    s += path(`M${a[0]} 105 Q63 108 ${a[1]} 105 L${a[1] + 1} 119 Q63 123 ${a[0] - 1} 119Z`, grad('apron'), 'var(--apronDark)', .85)
      + line(`M${(a[0] + a[1]) / 2 - 6} 108 L${(a[0] + a[1]) / 2 - 7} 119 M${(a[0] + a[1]) / 2 + 6} 108 L${(a[0] + a[1]) / 2 + 7} 119`, 'var(--apronDark)', .7)
      + line(`M${a[0] + 1} 104.5 Q63 107.5 ${a[1] - 1} 104.5`, 'var(--apronLight)', .9);
  } else {
    s += path('M56 100 h14 l2 6 h-18Z', grad('sash'), 'var(--sashDark)', .8)
      + line(`M${l + 4} 104 L${l + 6} 112 M${r - 4} 104 L${r - 6} 112`, 'var(--apronDark)', 1.1);
  }
  return s;
}

const BACK = [
  'M34 42 C33 20 47 10 63 10 C79 10 93 20 92 42 Q92 52 88 58 L84 50 Q63 44 42 50 L38 58 Q34 52 34 42Z',
  'M34 40 C33 20 47 10 63 10 C80 10 94 21 93 42 Q93 52 89 58 L82 50 Q60 44 42 50 L39 56Z',
  'M39 34 C40 21 48 12 62 11 C80 11 92 23 92 42 Q91 54 85 58 L74 58 Q69 54 68 49 L56 44 L44 40Z',
  // Back of the head: full like the original townsperson sheet; the hem sits low on the nape.
  'M34 41 C33 20 47 10 63 10 C80 10 93 21 93 42 Q93 56 88 62 Q76 66 63 65 Q50 66 39 62 Q34 56 34 41Z',
  'M33 41 C33 20 47 10 63 10 C79 10 93 20 93 41 Q94 56 88 63 Q76 67 63 66 Q50 67 38 63 Q32 56 33 41Z',
];
// Hair swept back from a smooth hairline that shows the forehead.
const FRONT = [
  'M36 44 C35 25 47 14 63 14 C79 14 91 25 90 44 L87 51 Q86 38 80 32 Q72 27 63 28 Q54 27 46 32 Q40 38 39 51Z',
  'M35 44 C34 25 46 14 61 14 C78 14 89 25 88 44 L85 50 Q84 38 78 32 Q70 27 60 28 Q52 28 45 33 Q39 39 38 48Z',
  // Profile: the forehead stays bare; the hairline runs from its top back to the ear and the
  // hair is combed up toward the bun.
  'M37.6 31.5 Q36 24 42 18 C48 13 55 11.5 62 11.5 C80 11 92 23 92 42 Q91 54 86 58 L77 58 Q74 55 73.4 50 Q73 44.5 68.5 42.8 Q64.5 42.4 61.5 44 Q57 39 50 34.5 Q43 30.5 37.6 31.5Z',
];
const BUN = [[63, 15, 8], [69, 15, 8], [82, 18, 8], [70, 16, 9], [63, 16, 9]];
function bun(view) {
  const [x, y, r] = BUN[view];
  return line(`M${x - r - 4} ${y + 2} L${x + r + 4} ${y - 3}`, 'var(--wood)', 1.6)
    + ellipse(x, y, r, r * .78, grad('hair'), '#2a201a', 1)
    + line(`M${x - r * .7} ${y} Q${x} ${y - r * .8} ${x + r * .7} ${y} M${x - r * .5} ${y + r * .4} Q${x + r * .1} ${y} ${x + r * .6} ${y + r * .35}`, 'var(--hairDark)', .7)
    + line(`M${x - r * .4} ${y - r * .45} Q${x} ${y - r * .65} ${x + r * .4} ${y - r * .45}`, 'var(--hairLight)', .8)
    + path(`M${x + r - 2} ${y - 6} l6 -2 l1 3 l-6 2Z`, 'var(--wood)', '#4a2e14', .6);
}
function hairBack(view) {
  const d = BACK[view];
  let inner = '';
  // Combed lines run up toward the bun; grey streaks are few and soft.
  for (let i = 0; i < 9; i++) {
    const x = 36 + i * 6.8;
    inner += line(`M${x} ${view >= 3 ? 65 : 52} Q${x + (63 - x) * .2} 30 ${63 + (x - 63) * .25} 12`, 'var(--hairDark)', .55);
  }
  inner += line('M44 40 Q47 26 58 17 M80 38 Q78 26 70 17', 'var(--hairLight)', .9);
  const s = path(d, grad('hair'), '#2a201a', 1.1) + clipped(`sumi-back-${view}`, d, inner);
  return view >= 3 ? s + bun(view) : bun(view) + s;
}
function fringe(view) {
  if (view >= 3) return '';
  const d = FRONT[view];
  let inner = '';
  if (view === 2) {
    // Combed from the hairline up and back into the bun.
    for (let i = 0; i < 9; i++) inner += line(`M${39 + i * 3.4} ${32 + i * 1.8} Q${58 + i * 2} ${18 + i * 2.4} ${82} ${18}`, 'var(--hairDark)', .55);
    inner += line('M42 24 Q58 14 76 16 M66 46 Q78 40 84 26', 'var(--hairLight)', .9);
    return path(d, grad('hair'), '#2a201a', 1) + clipped(`sumi-front-${view}`, d, inner);
  }
  for (let i = 0; i < 8; i++) {
    const x = 38 + i * 7;
    inner += line(`M${x} 46 Q${x + (63 - x) * .3} 30 ${63 + (x - 63) * .3} 14`, 'var(--hairDark)', .55);
  }
  inner += line('M45 36 Q50 24 60 18', 'var(--hairLight)', .9);
  return path(d, grad('hair'), '#2a201a', 1) + clipped(`sumi-front-${view}`, d, inner);
}
const FACE = { shape: 'elder', line: LINE, smile: true, blush: '#eb9878', folds: 'var(--skinDark)', eye: { size: .74, squash: .7, irisStroke: '#3e2816', glint: '#c9a070' }, brow: { thick: .75, tilt: -.35, color: '#4a3a30' }, mouthColor: '#9a5038' };
// The hair is gathered up, so in back views the nape shows; it belongs to the head so the
// head meets the torso's neck in the rig (the head mesh sits a little above the torso).
const NAPE = ['M52 48 H75 L76 73 Q63 76 50 73Z', 'M51 48 H76 L77 73 Q63 76 49 73Z'];
const nape = view => view >= 3 ? path(NAPE[view - 3], grad('skin'), LINE, .8) + line('M57 66 Q63 68 70 66', 'var(--skinDark)', .7) : '';
function head(view) {
  return nape(view) + hairBack(view) + face(view, FACE) + fringe(view);
}
export const sumiMarkup = (direction, part = 'combined') => compose(direction, part, { head, torso });
export const buildSumiSheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, sumiMarkup);
