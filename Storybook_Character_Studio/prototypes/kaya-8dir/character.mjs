import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, face, shell, neck, sideShade, compose, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// Kaya: young woman of the mining town. Centre-parted brown hair with side locks
// and a low bun, mustard short coat over a blue kimono, cream wrap collar and a
// sash tied in a bow. Neck, collar and sash belong to the torso; the bun to the head.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#33251c', skin: '#f6c69a', skinLight: '#ffe1bf', skinDark: '#d39466',
  hair: '#6d4426', hairLight: '#a87344', hairDark: '#361f10',
  vest: '#cc9636', vestLight: '#ecc263', vestDark: '#8a5f1f',
  blue: '#4d6d98', blueLight: '#7a96bd', blueDark: '#2c4264',
  ivory: '#efdcb2', ivoryLight: '#fff3d8', ivoryDark: '#b19a70',
  sash: '#d8c196', sashLight: '#f3e3c1', sashDark: '#9c865e',
  iris: '#7b4a22', irisLight: '#c4924e', irisDark: '#2c1a10',
});
const DEFS = definitions(['hair', 'vest', 'blue', 'ivory', 'sash', 'iris']);
const LINE = '#8a5a3a';

// Wrapped kimono front: cream collar crossing left over right, blue under-kimono,
// a wide sash with a front bow, and the blue skirt with cream stripes below.
function torso(view) {
  const { l, r, d, s: coat } = shell(view, [25, 23, 17, 23, 25], grad('vest'), '#5c3e14');
  let s = neck(view, { line: LINE }) + coat
    // The 3D arms hang at the sides, so the sides are shaded instead of drawn with arm lines (2026-11-08).
    + sideShade(`kaya-body-${view}`, view, d, l, r, 'var(--vestDark)');
  s += path(`M${l + 1} 108 Q63 112 ${r - 1} 108 L${r - 1} 118 Q63 123 ${l + 1} 118Z`, grad('blue'), 'var(--blueDark)', .9);
  for (const x of [l + 6, l + 14, r - 14, r - 6]) s += line(`M${x} 110 L${x} 120`, 'var(--ivory)', 1);
  if (view === 0) {
    s += path('M52 74 Q63 80 74 74 L63 90Z', grad('blue'), 'var(--blueDark)', .8)
      + path('M50 73 L55 72 L65.5 87 L63 91Z', grad('ivory'), 'var(--ivoryDark)', .8)
      + path('M76 73 L71 72 L60.5 87 L63 91Z', grad('ivory'), 'var(--ivoryDark)', .8)
      + line('M50 73 L63 91 L76 73', 'var(--blue)', 1.1)
      + path('M55 73 Q63 78 71 73 L63 84Z', grad('skin'), 'none');
  } else if (view === 1) {
    s += path('M46 74 Q56 79 68 72 L56 89Z', grad('blue'), 'var(--blueDark)', .8)
      + path('M44 74 L49 73 L58 86 L55 90Z', grad('ivory'), 'var(--ivoryDark)', .8)
      + path('M71 71 L65 71 L53 86 L56 90Z', grad('ivory'), 'var(--ivoryDark)', .8)
      + line('M44 74 L55 90 L71 71', 'var(--blue)', 1.1)
      + path('M49 73 Q56 77 65 72 L56 83Z', grad('skin'), 'none');
  } else if (view === 2) {
    // The collar climbs from the front crossing to the nape.
    s += path('M48 78 Q60 75 74 67 L77 73 Q64 82 52 92 L48 90Z', grad('ivory'), 'var(--ivoryDark)', .85)
      + line('M48 78 Q61 75 74 68 M51 91 Q63 82 77 72', 'var(--blue)', 1);
  } else {
    s += path('M46 73 Q63 67 80 73 L79 79 Q63 74 47 79Z', grad('ivory'), 'var(--ivoryDark)', .85)
      + line('M47 79 Q63 74 79 79', 'var(--blue)', 1);
  }
  // Wide sash; the bow and tails sit on the front, a flat knot on the back.
  s += path(`M${l + 1} 99 Q63 103 ${r - 1} 99 L${r - 1} 108 Q63 112 ${l + 1} 108Z`, grad('sash'), 'var(--sashDark)', .9)
    + line(`M${l + 2} 101.5 Q63 105.5 ${r - 2} 101.5`, 'var(--sashLight)', .7);
  if (view <= 2) {
    const c = [63, 54, 47][view], k = view === 2 ? .6 : 1;
    s += path(`M${c} 104 Q${c - 9 * k} 97 ${c - 11 * k} 102 Q${c - 9 * k} 109 ${c} 105Z`, grad('sash'), 'var(--sashDark)', .8)
      + path(`M${c} 104 Q${c + 9 * k} 97 ${c + 11 * k} 102 Q${c + 9 * k} 109 ${c} 105Z`, grad('sash'), 'var(--sashDark)', .8)
      + path(`M${c - 1.5} 105 L${c - 5 * k} 117 L${c - 1 * k} 116 L${c} 106Z`, grad('sash'), 'var(--sashDark)', .75)
      + path(`M${c + 1.5} 105 L${c + 5 * k} 116 L${c + 1 * k} 117 L${c} 106Z`, grad('sash'), 'var(--sashDark)', .75)
      + ellipse(c, 104.5, 2.4 * k + .6, 2.6, grad('sash'), 'var(--sashDark)', .8);
  }
  return s;
}

// Hair behind the face: crown and the side locks that fall to the jaw.
const BACK = [
  'M33 39 C33 18 47 8 63 8 C79 8 93 18 93 39 Q93 52 90 61 L86 64 L84 52 Q63 44 42 52 L40 64 L36 61 Q33 52 33 39Z',
  'M34 38 C33 18 47 8 63 8 C80 8 94 20 93 40 Q93 52 90 60 L84 62 L80 50 Q60 44 42 52 L40 62 L36 58Z',
  'M39 34 C40 20 48 11 60 10.5 C78 10 92 19 96 34 Q98.5 46 94 56 Q90 63 83 64 L76 62 Q72 57 70 50 L56 44 L44 40Z',
  'M34 40 C33 19 47 8 63 8 C80 8 93 20 93 41 Q92 54 87 61 Q75 65 62 63 Q48 64 39 60 Q34 53 34 40Z',
  'M33 40 C33 18 47 8 63 8 C79 8 93 18 93 40 Q93 54 88 61 Q76 66 63 64 Q50 66 38 61 Q33 54 33 40Z',
];
// Curtain fringe from the centre part, framing the face down to the jaw.
const FRONT = [
  'M35 44 C34 23 47 11 63 11 C79 11 92 23 91 44 Q90 54 87 62 L83 63 Q84 50 80 40 Q74 30 64 24 L63 28 L62 24 Q52 30 46 40 Q42 50 43 63 L39 62 Q36 54 35 44Z',
  // Three-quarter: the part sits over the face centre and the hair falls evenly to both
  // temples; the far lock reaches the chin, the near one stops above the ear.
  'M39 72 Q35 60 35 50 C34 30 44 15 58 12 C77 11 89 22 90 40 Q90 47 87 52 L84 50 Q83 58 80 65 L78 64 Q80 54 79 44 Q76 32 66 26 Q60 24 57.5 21 Q55 24 50 27 Q42 32 40 42 Q39 54 41.5 71Z',
  // Profile: one rounded mass over the whole skull. The centre-parted bangs sweep to the sides,
  // so the forehead stays bare and the hairline runs from the top of the forehead down to the
  // ear; a thin lock hangs in front of the ear and the hair behind it runs into the bun.
  'M37.6 31.5 Q35.6 24 41 18 C47 12.5 54 10.5 60 10.5 C77 10 90 18 95.5 32 Q98.5 44 95 54 Q91 61 84 64 L77 62.5 Q73.6 59 73.4 54 Q73.2 48.5 70.5 46 Q67 45.2 64 46.5 Q65 56 64.2 66 L61.4 64.6 Q61.8 55 59.6 48 Q55 40 48 34.5 Q42.5 30.5 37.6 31.5Z',
];
const BUN = [null, [88, 59, 6.5], [90, 66, 8.5], [70, 63, 9], [63, 65, 9.5]];
function bun(view) {
  const b = BUN[view];
  if (!b) return '';
  const [x, y, r] = b;
  return ellipse(x, y, r, r * .92, grad('hair'), '#3a2416', 1)
    + line(`M${x - r * .7} ${y - r * .2} Q${x} ${y - r * .9} ${x + r * .7} ${y - r * .1} M${x - r * .6} ${y + r * .3} Q${x} ${y - r * .3} ${x + r * .6} ${y + r * .4} M${x - r * .4} ${y + r * .7} Q${x + r * .2} ${y + r * .3} ${x + r * .6} ${y + r * .7}`, 'var(--hairDark)', .7)
    + line(`M${x - r * .5} ${y - r * .45} Q${x} ${y - r * .75} ${x + r * .4} ${y - r * .5}`, 'var(--hairLight)', .7);
}
function hairBack(view) {
  const d = BACK[view], part = [63, 58, 56, 64, 63][view];
  let inner = '';
  for (let i = 0; i < 12; i++) {
    const t = i / 11, x = 34 + t * 58, end = view >= 3 ? [63 + (x - 63) * .4, 64] : [x + (x - 63) * .15, 62];
    inner += line(`M${part} 9 Q${x} ${14 + Math.abs(x - 63) * .3} ${end[0].toFixed(1)} ${end[1]}`, i % 2 ? 'var(--hairDark)' : '#5e3a20', .7);
  }
  inner += line(`M${part - 14} 14 Q${part - 22} 24 ${part - 24} 36 M${part + 14} 14 Q${part + 22} 24 ${part + 24} 36`, 'var(--hairLight)', .9);
  const behind = view === 1 || view === 2 ? bun(view) : '';
  return behind + path(d, grad('hair'), '#3a2416', 1.1) + clipped(`kaya-back-${view}`, d, inner) + (view >= 3 ? bun(view) : '');
}
function fringe(view) {
  if (view >= 3) return '';
  const d = FRONT[view], part = [63, 57.5, 50][view];
  let inner = '';
  if (view === 2) {
    // Strands follow the skull from the hairline back to the bun; light streaks on the crown.
    // Nested arcs around the skull keep the strands parallel instead of meeting at one point.
    for (let i = 0; i < 9; i++) {
      const r = 32 - i * 2.6, x = 64, y = 46;
      inner += line(`M${(x - r).toFixed(1)} ${(y - r * .2).toFixed(1)} Q${(x - r * .2).toFixed(1)} ${(y - r * 1.25).toFixed(1)} ${(x + r * .95).toFixed(1)} ${(y + r * .15).toFixed(1)}`, i % 2 ? 'var(--hairDark)' : '#5e3a20', .7);
    }
    inner += line('M42 24 Q60 12 82 20 M48 30 Q64 21 86 30', 'var(--hairLight)', 1)
      + line('M62.4 50 Q63 58 62.8 64', 'var(--hairDark)', .65)
      + line('M76 50 Q80 58 86 62', 'var(--hairDark)', .7);
    return path(d, grad('hair'), '#3a2416', 1) + clipped(`kaya-front-${view}`, d, inner);
  }
  for (let i = 0; i < 10; i++) {
    const side = i < 5 ? -1 : 1, k = i % 5;
    const x = part + side * (6 + k * 6);
    inner += line(`M${part} 12 Q${x} ${18 + k * 2} ${x + side * 3} ${44 + k * 4}`, k % 2 ? 'var(--hairDark)' : '#5e3a20', .7);
  }
  inner += line(`M${part - 3} 15 Q${part - 14} 22 ${part - 18} 38 M${part + 3} 15 Q${part + 14} 22 ${part + 18} 38`, 'var(--hairLight)', 1);
  return path(d, grad('hair'), '#3a2416', 1) + clipped(`kaya-front-${view}`, d, inner);
}
const FACE = { shape: 'female', line: LINE, smile: true, blush: '#f09a7a', eye: { size: .8, irisStroke: '#5a3418', pupil: '#2a1a10', glint: '#e2b878' }, brow: { thick: .7, tilt: -.2, color: '#6a4228' }, mouthColor: '#a25a3a' };
function head(view) {
  return hairBack(view) + face(view, FACE) + fringe(view);
}
export const kayaMarkup = (direction, part = 'combined') => compose(direction, part, { head, torso });
export const buildKayaSheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, kayaMarkup);
