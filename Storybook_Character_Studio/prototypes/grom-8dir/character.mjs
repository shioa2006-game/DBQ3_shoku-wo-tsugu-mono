import { path, ellipse, line } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { tube } from '../shared/monster-kit.mjs';
export { DIRECTIONS, LABELS };

// 瘴泉竜グロム: the two-headed dragon boss of chapter 5. The game builds it from two billboards (one
// head, used for both heads, and the body with its limbs) joined by 3D neck, wings and tail. Navy scales,
// a tan jaw and tan belly plates, grey horns (two great horns and a centre horn), a ridge of spikes
// down the back and amber eyes. One pose per sheet; 5 views are drawn and the right side is mirrored.
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#0f1424', scale: '#2f3d68', scaleLight: '#52669a', scaleDark: '#171f3c',
  belly: '#c9a464', bellyLight: '#ead09a', bellyDark: '#8a6a38',
  horn: '#8c8780', hornLight: '#d6d1c8', hornDark: '#4c4844',
  eye: '#f3b12c', eyeLight: '#ffe39a', pupil: '#1a0e06', claw: '#b9b4ab',
});
const f = n => n.toFixed(1);
const grad = id => `<linearGradient id="${id}" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="var(--${id}Light)"/><stop offset=".45" stop-color="var(--${id})"/><stop offset="1" stop-color="var(--${id}Dark)"/></linearGradient>`;
const DEFS = `<defs>${['scale', 'belly', 'horn'].map(grad).join('')}<radialGradient id="shade" cx="45%" cy="35%" r="70%"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="var(--ink)" stop-opacity=".55"/></radialGradient></defs>`;
let uid = 0;

// Small overlapping scale arcs, clipped to a shape.
function scaled(d, box, step = 6, fill = 'url(#scale)', w = 1.2) {
  const id = `grom-${uid++}`, [x0, y0, x1, y1] = box;
  let arcs = '', shine = '';
  for (let y = y0, r = 0; y <= y1; y += step * .62, r++) for (let x = x0 + (r % 2) * step / 2; x <= x1; x += step) {
    arcs += `M${f(x - step / 2)} ${f(y)} Q${f(x)} ${f(y + step * .95)} ${f(x + step / 2)} ${f(y)}`;
    shine += `M${f(x - step * .25)} ${f(y + step * .18)} Q${f(x)} ${f(y + step * .5)} ${f(x + step * .25)} ${f(y + step * .18)}`;
  }
  return path(d, fill, w ? 'var(--ink)' : 'none', w) + `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">${line(arcs, 'var(--scaleDark)', .8)}${line(shine, 'var(--scaleLight)', .55)}<path d="${d}" fill="url(#shade)"/></g>`;
}
// Tan belly or jaw plates: a fill with curved seams across it.
function plates(d, ys, [x0, x1], bend = 3) {
  const id = `grom-${uid++}`;
  return path(d, 'url(#belly)', 'var(--ink)', 1.1) + `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">`
    + line(ys.map(y => `M${x0} ${y} Q${(x0 + x1) / 2} ${y + bend} ${x1} ${y}`).join(' '), 'var(--bellyDark)', .9) + '</g>';
}
// A curved horn from its base (two points) to the tip.
function horn([ax, ay], [bx, by], [tx, ty], bend = 0) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2, w = Math.hypot(bx - ax, by - ay) / 2;
  const L = Math.hypot(tx - mx, ty - my) || 1, nx = -(ty - my) / L, ny = (tx - mx) / L;
  const mid = [mx + (tx - mx) * .5 + nx * bend, my + (ty - my) * .5 + ny * bend];
  const pts = [[mx, my], [mx + (tx - mx) * .25 + nx * bend * .6, my + (ty - my) * .25 + ny * bend * .6], mid, [mx + (tx - mx) * .78 + nx * bend * .7, my + (ty - my) * .78 + ny * bend * .7], [tx, ty]];
  const d = tube(pts, [w, w * .82, w * .58, w * .32, .4]);
  return path(d, 'url(#horn)', 'var(--ink)', 1.1)
    + line(`M${f(pts[0][0] - nx * w * .4)} ${f(pts[0][1] - ny * w * .4)} Q${f(mid[0] - nx * w * .3)} ${f(mid[1] - ny * w * .3)} ${f(pts[3][0])} ${f(pts[3][1])}`, 'var(--hornLight)', 1.1)
    + line(`M${f(pts[0][0] + nx * w * .5)} ${f(pts[0][1] + ny * w * .5)} Q${f(mid[0] + nx * w * .35)} ${f(mid[1] + ny * w * .35)} ${f(pts[3][0])} ${f(pts[3][1])}`, 'var(--hornDark)', .9);
}
function spike(x, y, dx, dy, w = 4) {
  const L = Math.hypot(dx, dy) || 1, k = 1.25, px = -dy / L * w, py = dx / L * w;
  const tip = [x + dx * k, y + dy * k];
  return path(`M${f(x + px)} ${f(y + py)} Q${f(x + dx * .6 + px * .4)} ${f(y + dy * .6 + py * .4)} ${f(tip[0])} ${f(tip[1])} Q${f(x + dx * .6 - px * .4)} ${f(y + dy * .6 - py * .4)} ${f(x - px)} ${f(y - py)}Z`, 'url(#horn)', 'var(--ink)', .9)
    + line(`M${f(x + px * .3)} ${f(y + py * .3)} L${f(x + dx * .8)} ${f(y + dy * .8)}`, 'var(--hornLight)', .7);
}
const scute = (x, y, w, h, a = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">${path(`M0 ${-h} Q${w} ${-h * .3} ${w * .7} ${h * .5} Q0 ${h} ${-w * .7} ${h * .5} Q${-w} ${-h * .3} 0 ${-h}Z`, 'url(#horn)', 'var(--ink)', .9)}${line(`M${-w * .25} ${-h * .5} Q${-w * .35} 0 ${-w * .2} ${h * .4}`, 'var(--hornLight)', .8)}</g>`;
function eye(x, y, s = 1, dir = 1) {
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s * dir} ${s})">`
    + path('M-6.5 1.5 Q-4.5 -4 1 -4.2 Q6.5 -3.6 7 .5 Q5.5 4.4 0 4.6 Q-5.5 4.4 -6.5 1.5Z', '#f4efe4', 'var(--ink)', 1)
    + ellipse(1.6, .4, 3.4, 3.6, 'var(--eye)', 'var(--ink)', .5) + ellipse(1.8, .4, 1.1, 3, 'var(--pupil)', 'none') + ellipse(.6, -1.2, .9, .9, '#ffffff', 'none')
    + path('M-8 -3.6 Q-1 -8.6 8.5 -2.2 L8.5 -4.8 Q-1 -11.5 -8 -6.4Z', 'var(--scaleDark)', 'var(--ink)', .8) + '</g>';
}

// Lower jaw: the head silhouette clipped to the jaw region, filled tan with plate seams.
function jaw(silhouette, region, seams, [x0, x1], bend = 3) {
  const a = `grom-${uid++}`, b = `grom-${uid++}`;
  return `<defs><clipPath id="${a}"><path d="${silhouette}"/></clipPath><clipPath id="${b}"><path d="${region}"/></clipPath></defs>`
    + `<g clip-path="url(#${a})"><g clip-path="url(#${b})">${path(region, 'url(#belly)', 'none', 0)}${line(seams.map(y => `M${x0} ${y} Q${(x0 + x1) / 2} ${y + bend} ${x1} ${y}`).join(' '), 'var(--bellyDark)', .9)}</g>${path(region, 'none', 'var(--ink)', 1.1)}</g>`
    + path(silhouette, 'none', 'var(--ink)', 1.2);
}
// ---- Head -------------------------------------------------------------------------------------
// Silhouettes, horn bases and tips are measured from the original sheet (cell pixels). Grom has three
// great horns: one rising from the middle of the head (between the brows) and one at each side toward
// the back of the skull, plus smaller spikes along the rear edge and a ridge down the back of the head.
function head(view) {
  if (view === 0) return horn([24, 60], [42, 44], [14, 8], -6) + horn([102, 60], [84, 44], [112, 8], 6)
    + spike(40, 44, -3, -9, 3.5) + spike(86, 44, 3, -9, 3.5) + spike(30, 62, -13, -1) + spike(96, 62, 13, -1) + spike(30, 78, -12, 2) + spike(96, 78, 12, 2)
    + scaled('M24 72 Q22 52 36 44 Q50 38 63 38 Q76 38 90 44 Q104 52 102 72 Q103 86 97 96 L72 120 L54 120 L29 96 Q23 86 24 72Z', [18, 34, 108, 124], 6)
    + jaw('M24 72 Q22 52 36 44 Q50 38 63 38 Q76 38 90 44 Q104 52 102 72 Q103 86 97 96 L72 120 L54 120 L29 96 Q23 86 24 72Z', 'M10 76 L24 77 Q31 89 41 98 Q51 104 63 104 Q75 104 85 98 Q95 89 102 77 L116 76 L116 128 L10 128Z', [94, 102, 110, 116], [20, 106], 4)
    + scaled('M42 87 Q44 76 63 74 Q82 76 84 87 Q84 99 63 104 Q42 99 42 87Z', [38, 70, 88, 106], 5)
    + path('M51 93 Q55 88 59 93 Q55 97 51 93Z M75 93 Q71 88 67 93 Q71 97 75 93Z', 'var(--ink)', 'none')
    + eye(44, 75, 1.45, 1) + eye(82, 75, 1.45, -1)
    + path('M27 66 Q40 58 57 72 L54 75 Q40 64 29 71Z M99 66 Q86 58 69 72 L72 75 Q86 64 97 71Z', 'url(#scale)', 'var(--ink)', 1)
    // The middle horn rises from the centre between the eyes, just above them, its base sunk in the forehead.
    + horn([56, 68], [70, 68], [63, 18]) + scaled('M53 66 Q63 60 73 66 Q71 73 63 74 Q55 73 53 66Z', [50, 58, 76, 76], 4);
  if (view === 1) return horn([24, 66], [38, 58], [36, 14], -3)
    + scaled('M12 98 Q10 84 22 77 Q30 64 36 52 Q46 40 62 38 Q82 36 96 48 Q108 60 106 80 Q104 94 96 100 L82 103 L50 118 Q30 122 20 116 Q12 110 12 98Z', [8, 34, 110, 124], 6)
    + jaw('M12 98 Q10 84 22 77 Q30 64 36 52 Q46 40 62 38 Q82 36 96 48 Q108 60 106 80 Q104 94 96 100 L82 103 L50 118 Q30 122 20 116 Q12 110 12 98Z', 'M0 108 L22 110 Q36 109 48 106 Q57 102 64 96 Q72 90 78 86 Q84 81 87 77 Q88 88 84 97 Q80 103 76 106 L72 128 L0 128Z', [111, 115, 119], [8, 80], 2)
    + path('M30 93 Q34 88 38 93 Q34 97 30 93Z M18 92 Q20 89 23 92 Q20 95 18 92Z', 'var(--ink)', 'none')
    + eye(27, 76, .85, 1) + eye(59, 76, 1.35, -1)
    + path('M17 70 Q25 64 35 71 L33 73 Q25 67 18 72Z M45 66 Q59 58 73 70 L70 73 Q59 63 47 70Z', 'url(#scale)', 'var(--ink)', 1)
    + spike(98, 60, 11, -2) + spike(101, 74, 10, 1) + spike(98, 90, 9, 4) + spike(70, 42, 2, -10, 4) + spike(86, 46, 5, -9, 4)
    + horn([76, 60], [96, 46], [114, 10], 6) + horn([37, 66], [51, 62], [52, 16], 2) + scaled('M34 65 Q43 58 53 62 Q52 69 44 71 Q36 71 34 65Z', [30, 56, 56, 74], 4);
  if (view === 2) return scaled('M10 100 Q10 86 22 80 Q34 72 42 62 Q52 50 70 48 Q96 46 110 58 Q118 72 116 92 Q114 112 100 119 Q90 119 82 114 L46 119 L30 120 Q14 116 10 106Z', [6, 40, 120, 124], 6)
    + jaw('M10 100 Q10 86 22 80 Q34 72 42 62 Q52 50 70 48 Q96 46 110 58 Q118 72 116 92 Q114 112 100 119 Q90 119 82 114 L46 119 L30 120 Q14 116 10 106Z', 'M0 103 L12 103 Q32 102 50 98 Q64 94 74 86 Q81 98 79 112 L78 128 L0 128Z', [106, 111, 116], [8, 80], 2)
    + path('M15 94 Q18 90 22 94 Q18 98 15 94Z', 'var(--ink)', 'none')
    + eye(43, 81, 1.25, -1) + path('M34 74 Q42 68 52 74 L50 77 Q42 72 35 77Z', 'url(#scale)', 'var(--ink)', 1)
    // A row of spikes down the side of the head behind the jaw, all pointing back.
    + spike(86, 62, 12, -4, 4) + spike(90, 75, 13, -1, 4) + spike(91, 89, 12, 2, 4) + spike(86, 102, 10, 5, 3.5) + spike(76, 52, 4, -10, 3.5)
    + horn([66, 62], [86, 50], [116, 18], 6) + horn([38, 70], [54, 60], [64, 32], 2) + scaled('M35 70 Q44 62 56 62 Q56 70 48 74 Q38 75 35 70Z', [32, 58, 58, 78], 4);
  if (view === 3) return scaled('M16 92 Q14 68 30 56 Q48 46 66 46 Q90 46 104 60 Q114 74 112 92 Q110 110 98 117 Q80 122 60 121 Q38 121 26 114 Q16 106 16 92Z', [12, 42, 116, 124], 7)
    + jaw('M16 92 Q14 68 30 56 Q48 46 66 46 Q90 46 104 60 Q114 74 112 92 Q110 110 98 117 Q80 122 60 121 Q38 121 26 114 Q16 106 16 92Z', 'M0 92 L31 92 Q29 106 35 117 L36 128 L0 128Z', [100, 108, 114], [10, 36], 1.5)
    + spike(22, 74, -9, -1) + spike(20, 92, -9, 2) + spike(52, 52, 2, -10, 4) + spike(70, 50, 3, -14, 4.5)
    + [60, 73, 86, 99].map((y, i) => scute(86 - i, y, 5.5, 8, -8)).join('')
    + horn([84, 58], [100, 54], [108, 26], 4) + horn([26, 76], [44, 60], [32, 24], -4);
  // Back: the side horns stand at the rear corners, the middle horn on top, a ridge of scutes down the back.
  return scaled('M20 92 Q18 68 34 58 Q48 50 63 50 Q78 50 92 58 Q108 68 106 92 Q104 110 92 117 Q78 122 63 121 Q48 122 34 117 Q22 110 20 92Z', [16, 46, 110, 124], 7)
    + spike(24, 68, -11, -1) + spike(22, 82, -10, 1) + spike(102, 68, 11, -1) + spike(104, 82, 10, 1) + spike(24, 96, -9, 3) + spike(102, 96, 9, 3)
    + spike(48, 52, -1, -9, 3.5) + spike(78, 52, 1, -9, 3.5)
    + [66, 79, 92, 105].map(y => scute(63, y, 5.5, 8)).join('')
    + horn([26, 66], [44, 54], [20, 24], -5) + horn([100, 66], [82, 54], [106, 24], 5) + horn([56, 58], [70, 58], [63, 30]);
}

// ---- Body -------------------------------------------------------------------------------------
// Each view is traced from the original sheet: the neck opening at the top, the belly plates on the
// side the body faces, arms bent with the hands (and their claws) toward the front, heavy haunches and
// feet whose toes and claws also point to the front. The legs and the arms are each drawn as one group
// (all outlines first, then all fills), so a limb reads as one smooth shape instead of pieced parts.
const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const E = (cx, cy, rx, ry) => [ell(cx, cy, rx, ry), [cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2]];
const T = (pts, r) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), m = Math.max(...r) + 2; return [tube(pts, r), [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m]]; };
const group = (items, far = false) => items.map(([d]) => path(d, 'none', 'var(--ink)', 2.8)).join('')
  + items.map(([d, box]) => scaled(d, box, 5, 'url(#scale)', 0)).join('')
  + (far ? items.map(([d]) => path(d, 'var(--scaleDark)', 'none', 0, 'opacity=".38"')).join('') : '');
// Claws: three hooks fanning from a point toward (dx, dy).
function claws(x, y, dx, dy, spread = 3.2) {
  const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, vx = -uy, vy = ux;
  return [-1, 0, 1].map(k => {
    const bx = x + vx * k * spread, by = y + vy * k * spread, tx = bx + ux * 6 + vx * k * 1.5, ty = by + uy * 6 + vy * k * 1.5;
    return path(`M${f(bx - vx * 1.3)} ${f(by - vy * 1.3)} Q${f(tx - vx * .4 - ux * 2)} ${f(ty - vy * .4 - uy * 2)} ${f(tx)} ${f(ty)} Q${f(tx + vx * .8 - ux * 3)} ${f(ty + vy * .8 - uy * 3)} ${f(bx + vx * 1.3)} ${f(by + vy * 1.3)}Z`, 'var(--claw)', 'var(--ink)', .7);
  }).join('');
}
const neckTop = (cx, cy, rx) => path(ell(cx, cy, rx, 3.6), 'var(--scaleDark)', 'var(--ink)', 1.1) + line(`M${cx - rx + 3} ${cy + 1} Q${cx} ${cy + 3.5} ${cx + rx - 3} ${cy + 1}`, 'var(--scaleLight)', .6);
const torso = (d, box) => group([[d, box]]);
function belly(torsoD, d, from, to, [x0, x1]) {
  const id = `grom-${uid++}`, ys = Array.from({ length: Math.floor((to - from) / 9) + 1 }, (_, i) => from + i * 9);
  return `<defs><clipPath id="${id}"><path d="${torsoD}"/></clipPath></defs><g clip-path="url(#${id})">${plates(d, ys, [x0, x1], 3)}</g>`;
}
const spine = pts => pts.map(([x, y]) => scute(x, y, 2.6, 4)).join('');
const mirrorX = (side, x) => (side < 0 ? x : 126 - x);

function body(view) {
  if (view === 0) {
    const T0 = 'M42 12 Q63 8 84 12 Q94 22 96 42 Q100 66 94 88 Q86 106 63 108 Q40 106 32 88 Q26 66 30 42 Q32 22 42 12Z';
    const legs = [-1, 1].flatMap(side => { const X = x => mirrorX(side, x); return [E(X(30), 86, 15, 19), T([[X(32), 100], [X(30), 112]], [9, 8]), T([[X(18), 116], [X(40), 116]], [5, 5])]; });
    const arms = [-1, 1].flatMap(side => { const X = x => mirrorX(side, x); return [T([[X(36), 22], [X(27), 44], [X(42), 64]], [9, 8, 7]), E(X(44), 66, 6.5, 6)]; });
    return torso(T0, [24, 6, 102, 110]) + group(legs)
      + belly(T0, 'M48 16 Q63 13 78 16 Q84 40 87 70 Q88 96 76 106 Q63 111 50 106 Q38 96 39 70 Q42 40 48 16Z', 24, 104, [36, 90])
      + [24, 35, 91, 102].map(x => claws(x, 119, 0, 1, 2.8)).join('')
      + group(arms) + claws(44, 70, 0, 1, 2.8) + claws(82, 70, 0, 1, 2.8) + neckTop(63, 12, 22);
  }
  if (view === 1) {
    const T1 = 'M46 14 Q68 10 88 14 Q98 30 98 56 Q100 84 90 98 Q78 106 62 104 Q44 100 39 80 Q36 54 40 34 Q42 20 46 14Z';
    return group([T([[40, 86], [38, 100], [36, 110]], [11, 8, 6.5]), T([[26, 113], [44, 113]], [4.4, 4.4])], true) + claws(23, 114, -1, .6, 2.8)
      + group([T([[42, 40], [28, 48], [20, 60]], [8, 7, 6]), E(19, 63, 6, 5.5)], true) + claws(18, 67, -.3, 1, 2.6)
      + torso(T1, [34, 8, 104, 108])
      + group([E(92, 86, 16, 22), T([[90, 100], [92, 112]], [10, 9]), T([[82, 117], [106, 117]], [5, 5])])
      + belly(T1, 'M46 16 Q58 13 72 16 Q76 40 78 66 Q82 92 72 100 Q60 104 50 96 Q40 84 40 60 Q40 36 46 16Z', 24, 98, [38, 82])
      + claws(84, 117, -.4, 1, 3) + claws(95, 117, -.2, 1, 3)
      + group([T([[90, 34], [100, 52], [78, 66]], [10, 9, 8]), E(72, 68, 7, 6)]) + claws(70, 72, -.3, 1, 2.8)
      + neckTop(67, 14, 21);
  }
  if (view === 2) {
    const T2 = 'M50 12 Q68 9 84 13 Q96 30 99 56 Q100 76 90 90 Q80 100 62 98 Q46 94 41 78 Q36 56 38 36 Q42 18 50 12Z';
    return group([T([[54, 113], [70, 113]], [4, 4])], true)
      + torso(T2, [34, 8, 104, 102])
      + belly(T2, 'M44 16 Q52 14 58 16 Q54 40 56 60 Q58 80 56 92 Q46 90 41 78 Q36 56 38 36 Q40 22 44 16Z', 22, 90, [36, 60])
      + group([E(74, 74, 24, 24), T([[70, 94], [68, 108]], [11, 9]), T([[48, 116], [80, 116]], [5.5, 5.5])]) + claws(45, 116, -1, .4, 3)
      + group([T([[66, 44], [46, 56], [30, 64]], [10, 9, 8]), E(28, 66, 7, 6)]) + claws(25, 69, -.6, 1, 2.6)
      + neckTop(66, 13, 17);
  }
  if (view === 3) {
    // Seen from behind-left: the back with the spine right of centre, the left arm reaching forward (to
    // the left) and both feet with their toes and claws pointing left, away from the viewer.
    const T3 = 'M48 12 Q68 9 88 13 Q102 26 104 52 Q106 74 98 90 Q86 98 66 96 Q44 92 36 76 Q32 56 36 36 Q40 20 48 12Z';
    return group([T([[94, 90], [96, 106]], [12, 9]), T([[80, 114], [100, 114]], [4.4, 4.4])], true) + claws(78, 115, -1, .4, 2.6)
      + torso(T3, [30, 6, 108, 100]) + spine([[82, 24], [84, 34], [86, 44], [87, 54], [88, 64]])
      + group([E(46, 86, 15, 17), T([[48, 98], [50, 110]], [10, 9]), T([[30, 116], [56, 116]], [5.5, 5.5])]) + claws(27, 116, -1, .4, 3)
      + group([T([[44, 46], [30, 54], [22, 62]], [10, 9, 8]), E(20, 64, 6.5, 6)]) + claws(16, 66, -1, .5, 2.6)
      + neckTop(68, 13, 20);
  }
  // Back: arms bulge at the sides with the hands hidden in front, the spine runs down the middle, the
  // haunches sit over the rump and only the tips of the outer toes show beside the heels.
  const T4 = 'M42 16 Q63 12 84 16 Q96 26 98 46 Q100 70 92 88 Q80 96 63 96 Q46 96 34 88 Q26 70 28 46 Q30 26 42 16Z';
  // Arms hang along the sides from the shoulders.
  const arms = [-1, 1].map(side => { const X = x => mirrorX(side, x); return T([[X(36), 30], [X(28), 48], [X(30), 64]], [9, 10, 8]); });
  const legs = [-1, 1].flatMap(side => { const X = x => mirrorX(side, x); return [E(X(36), 88, 15, 19), T([[X(34), 100], [X(34), 112]], [9, 8]), T([[X(22), 116], [X(44), 116]], [5.5, 5.5])]; });
  return group(arms) + torso(T4, [24, 10, 102, 100]) + group(legs) + claws(18, 117, -1, .3, 2.2) + claws(108, 117, 1, .3, 2.2)
    + spine([26, 34, 42, 50, 58, 66].map(y => [63, y])) + neckTop(63, 17, 21);
}

function sheet(draw, { cellSize = 128, palette = {} } = {}) {
  if (!Number.isInteger(cellSize) || cellSize < 128 || cellSize > 1024) throw Error('cellSize must be an integer from 128 to 1024');
  const colors = { ...DEFAULT_PALETTE, ...palette };
  for (const color of Object.values(colors)) if (!/^#[0-9a-f]{6}$/i.test(color)) throw Error('Invalid palette color');
  uid = 0;
  const cells = DIRECTIONS.map((d, i) => {
    const mirror = i > 4, view = mirror ? 8 - i : i;
    return `<g transform="translate(${i % 4 * 128} ${Math.floor(i / 4) * 128})"><g ${mirror ? 'transform="translate(126 0) scale(-1 1)"' : ''}>${draw(view)}</g></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize * 4}" height="${cellSize * 2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k, v]) => `--${k}:${v}`).join(';')}">${DEFS}${cells}</svg>`;
}
export const buildGromHeadSheet = (options = {}) => sheet(head, options);
export const buildGromBodySheet = (options = {}) => sheet(body, options);
