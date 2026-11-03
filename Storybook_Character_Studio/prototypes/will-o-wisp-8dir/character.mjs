import { path, ellipse, line } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { monsterSheet } from '../shared/monster-export.mjs';
export { DIRECTIONS, LABELS };

// Will-o'-wisp (鬼火): a flame spirit that haunts furnaces, drawn like a classic flame icon. A round
// bulb at the bottom rises into one tall main tongue; separate side tongues curl up and inward with
// gaps between them, and small fragments flick off at the top. A violet rim shades through magenta
// and orange; a pale inner flame sits low in the bulb with the face. Pose A stands tall; pose B
// flares wide and low and throws off embers. The game reuses these sheets for 瘴気の鬼火 and the boss
// 炉喰らいの大鬼火 (tint and scale only).
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#22103e', rim: '#3b1f72', violet: '#6a35a8', magenta: '#b0448f',
  orange: '#f0802a', yellow: '#ffcf55', core: '#fff3cf', pale: '#e6f2ff',
  eye: '#f8f4ff', iris: '#9c2a6c', pupil: '#2a0a26', brow: '#2a1240',
});
const f = n => n.toFixed(1);

// The flame in a 100 × 120 box, bottom centre at (50, 120).
const MAIN = 'M50 120 C24 120 11 104 13 84 C15 66 28 58 36 46 C44 34 42 18 56 4 C58 22 66 30 72 42 C80 56 90 66 88 86 C86 106 74 120 50 120Z';
const LEFT = 'M24 82 C12 70 12 52 22 40 C24 34 28 30 32 28 C28 40 30 50 36 58 C32 62 28 70 24 82Z';
const RIGHT = 'M80 84 C92 72 94 56 86 42 C84 38 82 36 80 34 C82 46 78 56 72 62 C76 68 80 74 80 84Z';
const FLICK = 'M34 20 C30 14 32 8 38 4 C36 10 38 14 42 16 C40 19 37 21 34 20Z';
const FLICK_R = 'M88 30 C92 26 92 20 88 16 C90 22 86 26 82 28 C84 30 86 31 88 30Z';
const MID = 'M50 118 C30 118 20 106 22 90 C24 76 34 70 40 60 C46 50 46 40 54 30 C56 44 62 50 66 58 C74 70 80 80 78 94 C76 110 66 118 50 118Z';
const INNER = 'M50 117 C36 117 29 108 30 97 C31 88 38 84 43 76 C46 82 52 88 58 86 C64 84 64 76 62 70 C70 78 73 88 71 99 C69 110 62 117 50 117Z';
const SWIRL = 'M42 66 C40 76 44 82 48 84 M60 40 C58 50 62 56 66 60';

// Per view: lean of the tip (degrees of skew), horizontal squash and the face. Pose B flares the
// flame wide and low. The whole box is placed with its bottom centre on the cell's ground point.
const VIEW = [
  { skew: 0, sx: 1, face: 'front' },
  { skew: -8, sx: .96, face: 'near' },
  { skew: -14, sx: .86, face: 'side' },
  { skew: -15, sx: .88, face: null },
  { skew: 0, sx: 1, face: null },
];
const POSE = { a: { sx: .95, sy: .95 }, b: { sx: 1.04, sy: .78 } };
function placement(view, frame) {
  const v = VIEW[view], p = POSE[frame], sx = v.sx * p.sx, sy = p.sy, t = Math.tan(v.skew * Math.PI / 180);
  const at = (x, y) => { const qx = (x - 50) * sx, qy = (y - 120) * sy; return [63 + qx + t * qy, 121 + qy]; };
  return { at, transform: `translate(63 121) skewX(${v.skew}) scale(${sx} ${sy}) translate(-50 -120)` };
}
function eye(x, y, s = 1, dir = 1) {
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s * dir} ${s})">`
    + path('M-5.5 1 Q-5 -3.6 0 -3.8 Q5.2 -3.6 5.6 .6 Q5 4 0 4.2 Q-5 4 -5.5 1Z', 'var(--eye)', 'var(--ink)', .9)
    + ellipse(1.2, .6, 2.6, 3, 'var(--iris)', 'none') + ellipse(1.4, .8, 1.2, 1.6, 'var(--pupil)', 'none') + ellipse(.4, -.6, .7, .7, '#ffffff', 'none')
    + path('M-6.5 -4.5 L6 -1.5 L6.2 -3.6 L-6 -6.3Z', 'var(--brow)', 'none') + '</g>';
}
// The face sits in the bulb; it is placed with the flame's transform but drawn upright.
function face(kind, at, frame) {
  if (!kind) return '';
  const y = frame === 'a' ? 92 : 96, P = (x, yy) => at(x, yy);
  if (kind === 'front') {
    const [l, r, m] = [P(40, y), P(60, y), P(50, y + 10)];
    return eye(l[0], l[1], 1.2, 1) + eye(r[0], r[1], 1.2, -1) + line(`M${f(m[0] - 5)} ${f(m[1])} Q${f(m[0])} ${f(m[1] + 3)} ${f(m[0] + 5)} ${f(m[1])}`, 'var(--ink)', 1);
  }
  if (kind === 'near') {
    const [l, r, m] = [P(32, y), P(52, y), P(41, y + 10)];
    return eye(l[0], l[1], .95, 1) + eye(r[0], r[1], 1.2, -1) + line(`M${f(m[0] - 5)} ${f(m[1])} Q${f(m[0])} ${f(m[1] + 3)} ${f(m[0] + 5)} ${f(m[1])}`, 'var(--ink)', 1);
  }
  const [e, m] = [P(24, y + 1), P(18, y + 10)];
  return eye(e[0], e[1], 1.05, -1) + line(`M${f(m[0] - 3)} ${f(m[1])} Q${f(m[0])} ${f(m[1] + 2)} ${f(m[0] + 3)} ${f(m[1] - .5)}`, 'var(--ink)', .9);
}
// A small teardrop spark with a bright centre (pose B), placed in cell coordinates.
function ember([x, y]) {
  return path(`M${f(x)} ${f(y - 6)} C${f(x + 1.5)} ${f(y - 3)} ${f(x + 3.2)} ${f(y - 1)} ${f(x + 3)} ${f(y + 1.6)} C${f(x + 2.8)} ${f(y + 4)} ${f(x - 2.8)} ${f(y + 4)} ${f(x - 3)} ${f(y + 1.6)} C${f(x - 3.2)} ${f(y - 1)} ${f(x - 1.5)} ${f(y - 3)} ${f(x)} ${f(y - 6)}Z`, 'var(--magenta)', 'var(--ink)', .7)
    + ellipse(x, y + 1, 1.3, 1.6, 'var(--yellow)', 'none');
}
const EMBERS = [[8, 60], [16, 32], [90, 26], [96, 58], [68, 10]];
function draw(view, frame) {
  const id = `wisp-${frame}-${view}`, { at, transform } = placement(view, frame);
  const outer = [MAIN, LEFT, RIGHT, FLICK, FLICK_R];
  const defs = `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="120"><stop stop-color="var(--rim)"/><stop offset=".35" stop-color="var(--violet)"/><stop offset=".7" stop-color="var(--magenta)"/><stop offset="1" stop-color="var(--orange)"/></linearGradient>`
    + `<linearGradient id="${id}-mid" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="118"><stop stop-color="var(--magenta)"/><stop offset=".45" stop-color="var(--orange)"/><stop offset="1" stop-color="var(--yellow)"/></linearGradient>`
    + `<radialGradient id="${id}-in" gradientUnits="userSpaceOnUse" cx="50" cy="104" r="26"><stop stop-color="var(--pale)"/><stop offset=".45" stop-color="var(--core)"/><stop offset="1" stop-color="var(--yellow)"/></radialGradient></defs>`;
  // Outline every piece first and fill on top, so touching pieces share one smooth contour.
  const flame = outer.map(d => path(d, `url(#${id})`, 'var(--ink)', 2.6)).join('') + outer.map(d => path(d, `url(#${id})`, 'none', 0)).join('')
    + path(MID, `url(#${id}-mid)`, 'none', 0) + path(INNER, `url(#${id}-in)`, 'none', 0) + line(SWIRL, 'var(--core)', 2.2);
  let s = `<g transform="${transform}">${defs}${flame}</g>` + face(VIEW[view].face, at, frame);
  if (frame === 'b') s = EMBERS.map(([x, y]) => ember(at(x, y))).join('') + s;
  return s;
}
export const buildWillOWispSheet = (options = {}) => monsterSheet(options, DEFAULT_PALETTE, '', draw);
