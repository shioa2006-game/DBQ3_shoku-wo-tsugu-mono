import { path, ellipse, line } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { monsterSheet } from '../shared/monster-export.mjs';
import { tube, along, spline } from '../shared/monster-kit.mjs';
export { DIRECTIONS, LABELS };

// Armored scorpion (鉄甲サソリ): a stocky mine-dwelling scorpion in iron-dark plates seamed with red
// heat. Huge crescent pincers, four short thick legs a side, and a chunky segmented tail arching over
// the back to a stinger. Pose A holds the pincers low beside the head; pose B rears them up, open.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#0b090c', armor: '#3e3840', light: '#7a7280', dark: '#1d191e',
  crack: '#c33a18', glow: '#ff7c36', eye: '#f2e4d2', iris: '#8e1c10', sting: '#2a2228',
});
const DEFS = `<defs><linearGradient id="sc-plate" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="var(--light)"/><stop offset=".42" stop-color="var(--armor)"/><stop offset="1" stop-color="var(--dark)"/></linearGradient>
<linearGradient id="sc-far" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="var(--armor)"/><stop offset="1" stop-color="var(--dark)"/></linearGradient></defs>`;
const f = n => n.toFixed(1);

const fill = far => (far ? 'url(#sc-far)' : 'url(#sc-plate)');
// Red seams across a tube at even steps: each segment of the tail, body and arms reads as a plate.
function rings(points, radii, count, from = .1, to = .9) {
  const r = spline(radii.map((v, i) => [i, v]), 8).map(p => p[1]);
  let s = '';
  for (let k = 0; k < count; k++) {
    const t = from + (to - from) * k / Math.max(1, count - 1), p = along(points, t), n = Math.hypot(p.dx, p.dy) || 1;
    const rr = r[Math.round(t * (r.length - 1))] * .92, nx = -p.dy / n * rr, ny = p.dx / n * rr, bx = p.dx / n * 2.4, by = p.dy / n * 2.4;
    s += line(`M${f(p.x + nx)} ${f(p.y + ny)} Q${f(p.x + bx)} ${f(p.y + by)} ${f(p.x - nx)} ${f(p.y - ny)}`, 'var(--crack)', 1.1);
    s += line(`M${f(p.x + nx * .7 - bx * .4)} ${f(p.y + ny * .7 - by * .4)} Q${f(p.x)} ${f(p.y)} ${f(p.x - nx * .7 - bx * .4)} ${f(p.y - ny * .7 - by * .4)}`, 'var(--light)', .6);
  }
  return s;
}
function segmented(points, radii, count, far = false) {
  return path(tube(points, radii), fill(far), 'var(--ink)', 1.1) + rings(points, radii, count);
}
// Short thick leg: hip → knee → foot.
function leg([a, b, c], far = false) {
  return path(tube([a, b, c], [3.2, 2.6, 1.2]), fill(true), 'var(--ink)', .9) + (far ? '' : line(`M${f(b[0])} ${f(b[1] - 1)} l1.5 -1`, 'var(--light)', .6));
}
// A crescent pincer, local +x pointing out from the arm; `open` widens the gap between the tips.
function pincer(x, y, angle, s = 1, open = .4, far = false) {
  const o = open * 5;
  const d = `M-7 -6 Q2 -15 15 -11 Q23 -7 24 ${f(-2 - o)} Q16 ${f(-5 - o * .3)} 10 -2.5 Q8 0 10 2.5 Q16 ${f(5 + o * .3)} 23 ${f(3 + o)} Q22 10 13 12 Q1 14 -6 7 Q-10 0 -7 -6Z`;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)}) scale(${s})">${path(d, fill(far), 'var(--ink)', 1.1)}`
    + (far ? '' : line('M-3 -8 Q7 -12 16 -8', 'var(--light)', .9) + line('M-2 4 Q4 8 12 7', 'var(--crack)', .9)) + '</g>';
}
function eyes(pts, s = 1) {
  return pts.map(([x, y]) => ellipse(x, y, 2.6 * s, 2.2 * s, 'var(--eye)', 'var(--ink)', .7) + ellipse(x + .3, y + .3, 1.3 * s, 1.5 * s, 'var(--iris)', 'none')).join('');
}
function stinger(x, y, angle, s = 1) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)}) scale(${s})">${path('M-5 -5 Q5 -7 7 2 Q8 9 1 14 Q3 6 -1 3 Q-7 2 -5 -5Z', 'var(--sting)', 'var(--ink)', 1)}${line('M-2 -3 Q4 -3 4 2', 'var(--glow)', .7)}</g>`;
}
// A domed carapace with plate seams.
function carapace(cx, cy, rx, ry, rows = 3, far = false) {
  let s = ellipse(cx, cy, rx, ry, fill(far), 'var(--ink)', 1.2);
  for (let k = 1; k <= rows; k++) {
    const y = cy - ry + (2 * ry) * k / (rows + 1), w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) * .92;
    s += line(`M${f(cx - w)} ${f(y)} Q${f(cx)} ${f(y + 3)} ${f(cx + w)} ${f(y)}`, 'var(--crack)', 1.1);
  }
  return s + line(`M${f(cx)} ${f(cy - ry + 2)} L${f(cx)} ${f(cy + ry - 2)}`, 'var(--dark)', .8) + ellipse(cx - rx * .35, cy - ry * .45, rx * .3, ry * .18, 'var(--light)', 'none', 0, 'opacity=".5"');
}
// View recipes (the right side is mirrored from views 1–3).
// Front and front-left share one recipe. `turn` = 0 faces the viewer; turn = 1 is the three-quarter
// view (as in the original sheet): the head moves left of centre, the far (right) side narrows, and
// the tail rises on the right and curls back over toward the head.
function front(b, turn = 0) {
  let s = '';
  const near = 1 + .06 * turn, far = 1 - .22 * turn, headX = 63 - 7 * turn;
  const X = (side, o) => headX + side * o * (side < 0 ? near : far);
  const tail = turn ? [[72, 78], [76, 62], [74, 46], [66, 34], [56, 30]] : [[63, 78], [63, 62], [62, 46], [58, 34], [50, 28]];
  s += segmented(tail, [9, 8.5, 7.5, 6, 4.5], 5) + stinger(turn ? 51 : 46, turn ? 34 : 32, 205, 1.2);
  // Far-side legs and pincer sit behind the body in the turned view.
  const legsOf = side => [[[X(side, 14), 82], [X(side, 26), 80], [X(side, 32), 92]], [[X(side, 14), 86], [X(side, 25), 88], [X(side, 30), 100]], [[X(side, 12), 90], [X(side, 21), 96], [X(side, 24), 106]], [[X(side, 10), 92], [X(side, 16), 100], [X(side, 17), 109]]];
  const claw = side => {
    const ang = side < 0 ? 180 : 0, k = side < 0 ? near : far;
    if (b) return segmented([[X(side, 16), 86], [X(side, 28), 76], [X(side, 36), 60]], [5.5, 5, 4.5], 2, false) + pincer(X(side, 38), 46, side < 0 ? -100 : -80, 1.25 * k, .8, false);
    return segmented([[X(side, 16), 90], [X(side, 28), 88], [X(side, 36), 94]], [5.5, 5, 4.5], 2) + pincer(X(side, 40), 96, ang + side * 70, 1.25 * k, .35);
  };
  for (const side of [-1, 1]) legsOf(side).forEach(l => { s += leg(l); });
  s += carapace(headX + 4 * turn, 84, 22 - 2 * turn, 14, 3);
  const hx = headX, w = 15 - 2 * turn;
  s += path(`M${hx - w} 94 Q${hx - w + 2} 86 ${hx} 86 Q${hx + w - 2} 86 ${hx + w} 94 Q${hx + w - 2} 104 ${hx} 106 Q${hx - w + 2} 104 ${hx - w} 94Z`, 'url(#sc-plate)', 'var(--ink)', 1.1)
    + eyes(turn ? [[hx - 7, 95], [hx + 4, 95]] : [[57, 95], [69, 95]], 1.2)
    + line(`M${hx - 7} 101 l-2 4 M${hx - 3} 102 l-1 4 M${hx + 3} 102 l1 4 M${hx + 7} 101 l2 4`, 'var(--light)', 1);
  // In the turned view the far pincer is drawn before the near one, both in front of the head.
  for (const side of turn ? [1, -1] : [-1, 1]) s += claw(side);
  return s;
}
function back(b) {
  let s = '';
  for (const side of [-1, 1]) {
    const x = o => 63 + side * o;
    // The pincers are always visible from behind: raised in pose B, held low and out to the sides
    // in pose A (beyond the body's edge), so the two poses alternate instead of the claws blinking.
    if (b) s += segmented([[x(16), 84], [x(28), 74], [x(36), 58]], [5.5, 5, 4.5], 2, true) + pincer(x(38), 44, side < 0 ? -100 : -80, 1.25, .8, true);
    else s += segmented([[x(16), 84], [x(30), 80], [x(40), 84]], [5.5, 5, 4.5], 2, true) + pincer(x(44), 88, side < 0 ? 200 : -20, 1.2, .35, true);
    [[[x(14), 84], [x(26), 82], [x(32), 94]], [[x(14), 88], [x(25), 90], [x(30), 102]], [[x(12), 92], [x(21), 98], [x(24), 108]], [[x(10), 94], [x(16), 102], [x(17), 111]]].forEach(l => { s += leg(l); });
  }
  s += carapace(63, 88, 22, 16, 4);
  // From behind the tail stands straight up out of the body and bends away at the top.
  return s + segmented([[63, 98], [63, 82], [63, 64], [63, 46], [62, 34]], [9, 9, 8, 7, 5.5], 6) + stinger(62, 28, 180, 1.1);
}
const SIDE = {
  2: { body: [[34, 92], [48, 91], [64, 90], [80, 88]], br: [10, 12.5, 13, 11], tail: [[80, 86], [94, 76], [102, 58], [100, 42], [90, 34], [80, 34]], tr: [9, 8.5, 7.5, 6.5, 5, 4], st: [76, 38, 230],
       legs: [[44, 98], [56, 98], [68, 97], [80, 95]], eyes: [[30, 89]], near: [[36, 96], [26, 98], [20, 102]], far: [[42, 88], [32, 84], [26, 84]] },
  3: { body: [[38, 88], [52, 90], [66, 90], [78, 88]], br: [10, 13, 14, 12], tail: [[70, 84], [76, 66], [80, 50], [78, 36], [70, 28], [60, 30]], tr: [9.5, 9, 8, 7, 5.5, 4], st: [56, 34, 220],
       legs: [[46, 96], [58, 98], [68, 97], [78, 95]], eyes: [], near: [[40, 90], [28, 88], [22, 92]], far: [[60, 84], [72, 80], [80, 84]] },
};
function side(view, b) {
  const v = SIDE[view];
  let s = '';
  const legs = far => v.legs.map(([x, y], i) => leg(far ? [[x + 3, y - 4], [x + 8, y - 8], [x + 11 + i, y + 6]] : [[x, y], [x - 4, y + 2], [x - 6 - i, y + 13]], far)).join('');
  const raise = (pts, dy) => pts.map(([x, y], i) => [x + i * 2, y - dy * i]);
  const far = b ? raise(v.far, 14) : v.far, near = b ? raise(v.near, 16) : v.near;
  s += segmented(far, [5, 4.5, 4], 2, true) + pincer(far[2][0], far[2][1], b ? -110 : 190, 1.05, b ? .8 : .35, true);
  s += legs(true);
  s += segmented(v.tail, v.tr, 6) + stinger(v.st[0], v.st[1], v.st[2], 1.2);
  s += segmented(v.body, v.br, 4) + eyes(v.eyes, 1.15) + legs(false);
  return s + segmented(near, [5.5, 5, 4.5], 2) + pincer(near[2][0] - 4, near[2][1], b ? -110 : 180, 1.3, b ? .8 : .35);
}
function art(view, b) {
  if (view === 0) return front(b);
  if (view === 1) return front(b, 1);
  if (view === 4) return back(b);
  // Side views reach far forward with the pincer; shift them so the whole scorpion stays in its cell.
  return `<g transform="translate(10 0)">${side(view, b)}</g>`;
}
// The views are authored large; scale them about the ground point so pincers and stinger fit the cell.
const draw = (view, frame) => `<g transform="translate(63 118) scale(.8) translate(-63 -118)">${art(view, frame === 'b')}</g>`;
export const buildArmoredScorpionSheet = (options = {}) => monsterSheet(options, DEFAULT_PALETTE, DEFS, draw);
