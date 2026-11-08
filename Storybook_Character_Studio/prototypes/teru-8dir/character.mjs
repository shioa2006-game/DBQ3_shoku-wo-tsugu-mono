import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, face, shell, neck, sideShade, compose, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// Teru: a young woman who hid in the charcoal-kiln hut (no dedicated original art;
// shared Kaya's sheet before). Choppy brown bob under a rust headband knotted at the
// side, freckles and a smudge of soot, olive work clothes with a cream under-collar.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#30261c', skin: '#f3c497', skinLight: '#ffdcb6', skinDark: '#cc8f60',
  hair: '#6a4126', hairLight: '#a4704a', hairDark: '#331f14',
  cloth: '#6b6b3b', clothLight: '#91915c', clothDark: '#3f3f20',
  ivory: '#e9dab4', ivoryLight: '#fff2d6', ivoryDark: '#ab9870',
  band: '#a8442a', bandLight: '#d66a48', bandDark: '#5e2414',
  sash: '#5a3f26', sashLight: '#87633e', sashDark: '#2e1f12',
  iris: '#6a4020', irisLight: '#b88446', irisDark: '#26160c',
});
const DEFS = definitions(['hair', 'cloth', 'ivory', 'band', 'sash', 'iris']);
const LINE = '#8a5a38';

function torso(view) {
  const { l, r, d, s: coat } = shell(view, [24, 22, 17, 22, 24], grad('cloth'), '#2a2a14');
  let s = neck(view, { line: LINE }) + coat
    // The 3D arms hang at the sides, so the sides are shaded instead of drawn with arm lines (2026-11-08).
    + sideShade(`teru-body-${view}`, view, d, l, r, 'var(--clothDark)');
  // Work jacket crossing over a cream under-collar; dark olive collar bands.
  if (view === 0) {
    s += path('M53 74 Q63 79 73 74 L63 90Z', grad('ivory'), 'var(--ivoryDark)', .7)
      + path('M50 73 L55 72 L65.5 88 L63 92Z', 'var(--clothDark)', '#22220f', .8)
      + path('M76 73 L71 72 L60.5 88 L63 92Z', 'var(--clothDark)', '#22220f', .8)
      + path('M56 74 Q63 78 70 74 L63 84Z', grad('skin'), 'none');
  } else if (view === 1) {
    s += path('M47 74 Q56 78 67 72 L56 89Z', grad('ivory'), 'var(--ivoryDark)', .7)
      + path('M44 74 L49 73 L58 87 L55 91Z', 'var(--clothDark)', '#22220f', .8)
      + path('M71 71 L65 71 L53 87 L56 91Z', 'var(--clothDark)', '#22220f', .8)
      + path('M50 73 Q56 77 64 72 L56 83Z', grad('skin'), 'none');
  } else if (view === 2) {
    s += path('M48 78 Q60 75 74 67 L77 73 Q64 82 52 92 L48 90Z', 'var(--clothDark)', '#22220f', .85)
      + line('M50 79 Q61 76 73 69', 'var(--ivory)', 1);
  } else {
    s += path('M46 73 Q63 67 80 73 L79 79 Q63 74 47 79Z', 'var(--clothDark)', '#22220f', .85);
  }
  // Plain sash knotted at the side, then the trousers below.
  s += path(`M${l + 1} 101 Q63 105 ${r - 1} 101 L${r - 1} 107 Q63 111 ${l + 1} 107Z`, grad('sash'), 'var(--sashDark)', .9);
  const k = [r - 9, r - 8, 52, l + 9, r - 10][view];
  s += path(`M${k - 3} 102 h6 v6 h-6Z`, grad('sash'), 'var(--sashDark)', .7) + path(`M${k - 1} 108 l-2 9 l3 -1 l1 -8Z M${k + 1} 108 l3 8 l1 -2 l-2 -6Z`, 'var(--sash)', 'var(--sashDark)', .6);
  s += line(`M${l + 9} 110 L${l + 8} 120 M63 111 V121 M${r - 9} 110 L${r - 8} 120`, 'var(--clothDark)', .8);
  return s;
}

const BACK = [
  'M34 40 C33 20 47 9 63 9 C79 9 93 20 92 40 Q93 54 89 64 L84 66 L84 52 Q63 44 42 52 L42 66 L37 64 Q33 54 34 40Z',
  'M34 39 C33 19 47 9 63 9 C80 9 94 21 93 41 Q94 54 90 63 L84 65 L80 50 Q60 44 42 52 L40 63 L36 60Z',
  'M36 40 C34 21 47 10 62 10 C80 10 93 22 93 42 Q94 56 89 64 L76 64 Q70 56 68 50 L56 44 L44 42 L40 48Z',
  'M34 40 C33 20 47 9 63 9 C80 9 93 20 93 41 Q94 55 90 64 L84 62 L80 66 L74 63 L68 67 L62 64 L56 67 L50 63 L44 66 L40 62 L36 64 Q33 54 34 40Z',
  'M33 40 C33 19 47 9 63 9 C79 9 93 19 93 40 Q94 55 90 64 L85 62 L80 66 L74 63 L68 67 L62 64 L56 67 L50 63 L44 66 L40 62 L36 64 Q32 54 33 40Z',
];
// Choppy bangs and side locks to the jaw.
const FRONT = [
  'M35 46 C34 24 47 12 63 12 C79 12 92 24 91 46 L89 62 L85 64 L84 46 L80 40 L76 44 L72 38 L67 43 L63 37 L58 43 L54 38 L50 44 L46 39 L42 46 L42 64 L37 62Z',
  'M35 46 C34 24 46 12 61 12 C78 12 89 24 88 46 L86 61 L82 63 L80 44 L76 39 L72 43 L68 37 L63 42 L58 37 L54 43 L50 38 L46 43 L42 39 L40 46 L39 58 L36 57Z',
  // Profile: the bob covers the whole side of the head except the ear (above and behind it
  // too), with the choppy bangs in front and a lock in front of the ear.
  'M37 46 C36 26 46 13 60 12 C76 11 90 20 93 34 Q95 48 90 63 L77 64 Q74.8 58 74.6 54 Q74.2 48.5 71.5 46 Q68 45.5 66 47 Q66.5 56 65.5 64 L61.5 63 Q62 52 59 44 L55 40 L51 44 L48 39 L44 44 L41 48Z',
];
function hairBack(view) {
  const d = BACK[view];
  let inner = '';
  for (let i = 0; i < 12; i++) {
    const x = 35 + i * 5;
    inner += line(`M63 10 Q${x} ${16 + Math.abs(x - 63) * .3} ${(x + (x - 63) * .1).toFixed(1)} 66`, i % 2 ? 'var(--hairDark)' : '#4e3020', .7);
  }
  inner += line('M48 15 Q41 24 39 36 M78 15 Q85 24 87 36', 'var(--hairLight)', .9);
  return path(d, grad('hair'), '#2a180e', 1.1) + clipped(`teru-back-${view}`, d, inner);
}
function fringe(view) {
  if (view >= 3) return '';
  const d = FRONT[view];
  let inner = '';
  for (let i = 0; i < 14; i++) {
    const x = 36 + i * 4;
    inner += line(`M${[63, 59, 55][view]} 13 Q${x} 20 ${x.toFixed(1)} ${x < 44 || x > 82 ? 64 : 44}`, i % 2 ? 'var(--hairDark)' : '#4e3020', .65);
  }
  inner += line(`M${[52, 48, 46][view]} 17 Q${[46, 42, 42][view]} 23 ${[44, 40, 40][view]} 32`, 'var(--hairLight)', 1);
  return path(d, grad('hair'), '#2a180e', 1) + clipped(`teru-front-${view}`, d, inner);
}
// Rust headband over the hair, knotted on her right with two short tails.
const BAND = [
  'M34 33 Q63 22 92 33 L92 38.5 Q63 28 34 38.5Z',
  'M34 32 Q58 21 88 30 L90 36 Q58 27 35 37.5Z',
  'M38 31 Q60 21 88 30 Q92 34 92 38 Q86 34 80 33 Q60 28 39 36.5Z',
  'M34 34 Q63 26 92 31 L92 37 Q63 32 34 39.5Z',
  'M33 34 Q63 26 93 34 L93 39.5 Q63 32 33 39.5Z',
];
const KNOT = [[89, 34, 1], [86, 31, 1], [90, 34, 1], [36, 36, -1], [37, 36, -1]];
function band(view) {
  const d = BAND[view], [x, y, dir] = KNOT[view];
  let s = path(d, grad('band'), 'var(--bandDark)', .9) + clipped(`teru-band-${view}`, d, line('M30 30 Q63 21 96 30', 'var(--bandLight)', .8));
  s += ellipse(x, y, 2.8, 2.6, grad('band'), 'var(--bandDark)', .8)
    + path(`M${x} ${y + 1.5} l${4 * dir} 7 l${2 * dir} -1 l${-3 * dir} -6Z M${x} ${y + 1.5} l${7 * dir} 4 l${1 * dir} -2 l${-5 * dir} -3Z`, grad('band'), 'var(--bandDark)', .7);
  return s;
}
// Freckles and a smudge of soot on the near cheek.
function marks(view) {
  if (view >= 3) return '';
  const spots = [[[46, 56], [48.5, 57.5], [45.5, 58.6], [78, 56], [80.5, 57.4], [79, 58.8]], [[40.5, 57], [42.5, 58.4], [69, 57], [71, 58.4], [70, 59.8]], [[50, 56], [52, 57.4], [51, 58.8]]][view];
  return spots.map(([x, y]) => ellipse(x, y, .45, .45, '#b06a44', 'none')).join('')
    + ellipse([79, 72, 53][view], [61, 61.5, 61][view], 3.2, 1.6, '#5a524c', 'none', 0, 'opacity=".35"');
}
const FACE = { shape: 'female', line: LINE, smile: true, blush: '#f09a78', eye: { size: .8, irisStroke: '#4a2a12', pupil: '#24160c', glint: '#e0b070' }, brow: { thick: .75, tilt: -.1, color: '#5a3820' }, mouthColor: '#a45a3a' };
function head(view) {
  return hairBack(view) + face(view, FACE) + marks(view) + fringe(view) + band(view);
}
export const teruMarkup = (direction, part = 'combined') => compose(direction, part, { head, torso });
export const buildTeruSheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, teruMarkup);
