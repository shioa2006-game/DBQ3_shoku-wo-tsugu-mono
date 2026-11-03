import { path, ellipse, line } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { monsterSheet } from '../shared/monster-export.mjs';
import { tube, crackNet } from '../shared/monster-kit.mjs';
export { DIRECTIONS, LABELS };

// Volcano lizard (火山トカゲ): a fast lizard of the lava fields. Charcoal scales split by a net of
// glowing orange cracks, a big rounded head, thin splayed legs with long toes and a tail that
// arcs over the back. Pose A crouches low; pose B pushes up on its legs with the head raised.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#0d0908', body: '#3a3330', light: '#5e5550', dark: '#1b1514',
  crack: '#c43c16', glow: '#ff8a3c', eye: '#f3eadb', iris: '#d0541c', pupil: '#1a0905', claw: '#120d0c',
});
const DEFS = `<defs><linearGradient id="liz-skin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--light)"/><stop offset=".5" stop-color="var(--body)"/><stop offset="1" stop-color="var(--dark)"/></linearGradient></defs>`;
const f = n => n.toFixed(1);

// Skin with a clipped net of lava cracks.
function skin(d, id, box, step = 9, far = false) {
  if (far) return path(d, 'var(--dark)', 'var(--ink)', 1);
  const net = crackNet(box, step, id.length * 7 + box[0], .5);
  return path(d, 'url(#liz-skin)', 'var(--ink)', 1.1)
    + `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">${line(net, 'var(--crack)', .9)}${line(net, 'var(--glow)', .3)}</g>`;
}
// A thin leg: hip → elbow → foot, then four long toes fanning out.
function leg([hip, elbow, foot], id, far = false, r = 3) {
  const d = tube([hip, elbow, foot], [r * 1.5, r, r * .9]);
  let s = far ? path(d, 'var(--dark)', 'var(--ink)', .9) : path(d, 'url(#liz-skin)', 'var(--ink)', .9);
  const dir = Math.atan2(foot[1] - elbow[1], foot[0] - elbow[0]);
  for (const a of [-.9, -.3, .3, .9]) {
    const t = dir + a * .9, x = foot[0] + Math.cos(t) * 5.5, y = Math.max(foot[1] + .5, foot[1] + Math.sin(t) * 5.5);
    s += line(`M${f(foot[0])} ${f(foot[1])} L${f(x)} ${f(y)}`, far ? 'var(--dark)' : 'var(--body)', 1.8) + line(`M${f(foot[0])} ${f(foot[1])} L${f(x)} ${f(y)}`, 'var(--ink)', .5);
  }
  return s;
}
function eye(x, y, s = 1, dir = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s * dir} ${s})">`
    + ellipse(0, 0, 4, 3.6, 'var(--eye)', 'var(--ink)', .9) + ellipse(.9, .3, 2.6, 2.9, 'var(--iris)', 'none')
    + ellipse(1.1, .4, 1, 2.2, 'var(--pupil)', 'none') + ellipse(-.2, -1, .7, .7, '#ffffff', 'none')
    + path('M-4.8 -2.4 Q0 -5.2 4.8 -3.2 L4.8 -1.8 Q0 -3.4 -4.8 -1.2Z', 'var(--ink)', 'none') + '</g>';
}
// Side-on views: one tube from the snout through the body to the tail tip.
const SIDE = {
  1: {
    body: [[14, 94], [24, 89], [36, 86], [50, 82], [64, 78], [78, 74], [92, 70], [106, 60], [112, 46], [104, 36], [88, 32], [72, 32], [58, 34]],
    radii: [4.5, 9.5, 9, 11, 12, 11, 9, 7.5, 6, 5, 4, 3, 1.2],
    far: [[[54, 80], [62, 88], [66, 94]], [[86, 72], [82, 84], [80, 92]]],
    near: [[[40, 90], [32, 98], [26, 104]], [[76, 80], [84, 90], [90, 98]]],
    eye: [26, 88, 1],
  },
  2: {
    body: [[8, 92], [20, 88], [34, 89], [48, 87], [64, 87], [80, 87], [94, 84], [106, 74], [114, 60], [112, 46], [100, 38], [84, 36], [66, 38]],
    radii: [4.5, 10, 8.5, 10.5, 11.5, 11, 9, 7.5, 6.5, 5, 4, 3, 1.2],
    far: [[[50, 90], [56, 98], [60, 103]], [[86, 89], [80, 98], [76, 103]]],
    near: [[[42, 94], [38, 101], [32, 105]], [[78, 94], [84, 101], [90, 105]]],
    eye: [20, 86, 1],
  },
  3: {
    body: [[28, 80], [36, 82], [46, 84], [58, 86], [72, 88], [86, 86], [98, 78], [108, 64], [110, 50], [102, 40], [88, 36], [72, 37], [60, 40]],
    radii: [4, 7.5, 10, 13, 14, 12.5, 10, 8, 6.5, 5, 4, 3, 1.2],
    far: [[[40, 86], [30, 92], [22, 96]], [[56, 92], [48, 100], [42, 105]]],
    near: [[[50, 92], [44, 101], [38, 106]], [[80, 94], [88, 101], [94, 106]]],
  },
};
function side(view, frame, id) {
  const v = SIDE[view], b = frame === 'b';
  // Pose B: legs straighten (body lifts) and the head rises.
  const lift = b ? 4 : 0, body = v.body.map(([x, y], i) => [x, y - lift - (b && i < 3 ? (3 - i) * 3 : 0)]);
  const up = pts => pts.map(([x, y], i) => [x, i < 2 ? y - lift : y]);
  let s = v.far.map((l, i) => leg(up(l), `${id}-f${i}`, true)).join('');
  s += skin(tube(body, v.radii), `${id}-body`, [0, 20, 124, 112]);
  s += v.near.map((l, i) => leg(up(l), `${id}-n${i}`)).join('');
  if (v.eye) s += eye(v.eye[0], v.eye[1] - lift - (b ? 7 : 0), v.eye[2], -1);
  return s;
}
// Facing the viewer: the head rises from the front of the body (its upper half clear of the body's
// outline, with a crease at the neck) so it reads as a head; the tail arcs up behind on the right.
function front(frame, id) {
  const l = frame === 'b' ? 4 : 0;
  const tail = [[70, 78 - l], [86, 72 - l], [100, 62 - l], [108, 48 - l], [102, 38 - l], [88, 34 - l], [70, 34 - l], [56, 36 - l]];
  let s = skin(tube(tail, [8, 8, 7, 6, 5, 4, 3, 1.2]), `${id}-tail`, [50, 26, 118, 86]);
  s += leg([[48, 76 - l], [38, 72 - l], [30, 79]], `${id}-bl`, true) + leg([[78, 76 - l], [88, 72 - l], [96, 79]], `${id}-br`, true);
  const torso = `M40 ${88 - l} Q44 ${70 - l} 63 ${68 - l} Q82 ${70 - l} 86 ${88 - l} Q84 ${100 - l} 63 ${102 - l} Q42 ${100 - l} 40 ${88 - l}Z`;
  s += skin(torso, `${id}-torso`, [36, 64, 90, 104]);
  s += leg([[46, 94 - l], [35, 99 - l], [27, 106]], `${id}-fl`) + leg([[80, 94 - l], [91, 99 - l], [99, 106]], `${id}-fr`);
  // The head matches the side views' size; in pose B it lifts further than the body (head bob).
  const h = frame === 'b' ? 9 : 0;
  const head = `M52 ${68 - h} Q52 ${57 - h} 63 ${56 - h} Q74 ${57 - h} 74 ${68 - h} Q73 ${77 - h} 63 ${79 - h} Q53 ${77 - h} 52 ${68 - h}Z`;
  s += line(`M54 ${77 - h} Q63 ${82 - h} 72 ${77 - h}`, 'var(--ink)', 1.3) + skin(head, `${id}-head`, [48, 52, 78, 82], 5.5);
  return s + eye(58, 65 - h, .85, 1) + eye(68, 65 - h, .85, -1) + line(`M59.5 ${73 - h} Q63 ${75 - h} 66.5 ${73 - h}`, 'var(--ink)', .8);
}
// From behind: the round back and haunches, splayed hind legs, the tail curling up on the right.
function back(frame, id) {
  const l = frame === 'b' ? 4 : 0;
  let s = leg([[50, 76 - l], [40, 72 - l], [32, 78]], `${id}-fl`, true) + leg([[76, 76 - l], [86, 72 - l], [94, 78]], `${id}-fr`, true);
  // The back of the head shows above the shoulders, more than half of it clear of the body.
  const h = frame === 'b' ? 9 : 0;
  s += skin(`M53 ${65 - h} Q53 ${55 - h} 63 ${54 - h} Q73 ${55 - h} 73 ${65 - h} Q72 ${72 - h} 63 ${74 - h} Q54 ${72 - h} 53 ${65 - h}Z`, `${id}-head`, [49, 50, 77, 78], 5.5)
    + line(`M63 ${56 - h} L63 ${66 - h}`, 'var(--dark)', 1.1);
  const torso = `M42 ${86 - l} Q42 ${68 - l} 63 ${66 - l} Q84 ${68 - l} 84 ${86 - l} Q83 ${100 - l} 63 ${102 - l} Q43 ${100 - l} 42 ${86 - l}Z`;
  s += skin(torso, `${id}-torso`, [38, 60, 90, 106]);
  s += leg([[50, 94 - l], [39, 99 - l], [30, 105]], `${id}-hl`, false, 3.2) + leg([[76, 94 - l], [87, 99 - l], [96, 105]], `${id}-hr`, false, 3.2);
  const tail = [[66, 98 - l], [84, 94 - l], [100, 82 - l], [108, 64 - l], [104, 48 - l], [92, 40 - l], [76, 38 - l], [62, 40 - l]];
  return s + skin(tube(tail, [8, 8, 7, 6, 5, 4, 3, 1.2]), `${id}-tail`, [56, 30, 118, 104]);
}
function draw(view, frame) {
  const id = `liz-${frame}-${view}`;
  if (view === 0) return front(frame, id);
  if (view === 4) return back(frame, id);
  return side(view, frame, id);
}
export const buildVolcanoLizardSheet = (options = {}) => monsterSheet(options, DEFAULT_PALETTE, DEFS, draw);
