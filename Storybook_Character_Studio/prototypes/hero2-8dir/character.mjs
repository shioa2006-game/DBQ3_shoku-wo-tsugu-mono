import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, face, shell, neck, belt, compose, buildSheet, spikyArc, tufts, noise } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// 主人公の新デザイン案（references/hero-redesign-4dir-v1.png）。
// ふわふわの金髪とアホ毛、青い瞳。生成りのケープ、紺のチュニック、真鍮の留め金の革ベルト、
// 左腰の小物入れ、本を挿した革の背負いかばん。手足（紺の袖・焦げ茶のズボン・茶色のブーツ）はリグが描く。
// 頭（顔・耳・髪）と胴（首・襟・ケープ・服・ベルト・かばん）を別のシートに分ける。
// 左右非対称なのは腰の小物入れだけ。反転した右側の向きでは、体の向こう側に来るので描かない。
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#3a2614', skin: '#f8d0a6', skinLight: '#ffe7cc', skinDark: '#dc9f74',
  hair: '#f3bf2c', hairLight: '#ffe57a', hairDark: '#c98912',
  tunic: '#2f4b95', tunicLight: '#4d6fc2', tunicDark: '#1b2b60',
  cape: '#eedfb4', capeLight: '#fff6de', capeDark: '#c7ad7a',
  pack: '#8d5a31', packLight: '#b37d4b', packDark: '#563217',
  leather: '#7a4a26', gold: '#d8a53a', goldLight: '#ffe08a', goldDark: '#8a6218',
  iris: '#2f6bd0', irisLight: '#86c4ff', irisDark: '#163a8a',
  book: '#27397a', paper: '#f4e8c8',
});
const DEFS = definitions(['hair', 'tunic', 'cape', 'pack', 'gold', 'iris']);
const LINE = '#9b6640';
const HAIR_INK = '#5a360e';
const TUNIC_INK = '#121c40';
const PACK_INK = '#3a2210';

// ---------------------------------------------------------------- hair
// Curved clumps: each segment bends the same way, so the tips hook like soft locks.
function curvy(pts, bend = .18, close = true) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const n = close ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    const cx = (x0 + x1) / 2 - (y1 - y0) * bend, cy = (y0 + y1) / 2 + (x1 - x0) * bend;
    d += ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return close ? d + 'Z' : d;
}
const arcPts = (cx, cy, rx, ry, from, to, steps) => Array.from({ length: steps + 1 }, (_, i) => {
  const a = (from + (to - from) * i / steps) * Math.PI / 180;
  return [cx + Math.cos(a) * rx, cy - Math.sin(a) * ry];
});

// Outer silhouette of the fluffy hair for each view: spiky arcs whose tips droop outward on each side,
// closed underneath behind the face (front views) or along the nape (back views).
const MASS = [
  { cx: 63, cy: 43, rx: 32, ry: 28, right: [-28, 90, 5, -12], left: [90, 208, 5, 12], under: [[84, 60], [63, 63], [42, 60]] },
  { cx: 65, cy: 43, rx: 32, ry: 28, right: [-35, 90, 5, -12], left: [90, 200, 5, 12], under: [[80, 62], [60, 64], [42, 56]] },
  { cx: 66, cy: 42, rx: 31, ry: 28, right: [-58, 90, 6, -12], left: [90, 168, 3, 10], under: [[38, 44], [56, 52], [72, 62], [80, 67]] },
  { cx: 63, cy: 43, rx: 32, ry: 28, right: [-40, 90, 5, -12], left: [90, 220, 6, 12], nape: [[36, 62], [88, 63]] },
  { cx: 63, cy: 43, rx: 32, ry: 28, right: [-35, 90, 5, -12], left: [90, 215, 5, 12], nape: [[35, 61], [91, 61]] },
];
function massPoints(view) {
  const m = MASS[view];
  const side = ([from, to, count, sweep], seed) => spikyArc({ cx: m.cx, cy: m.cy, rx: m.rx, ry: m.ry, from, to, count, depth: .22, sweep, seed });
  const right = side(m.right, 3 + view * 5), left = side(m.left, 41 + view * 7);
  // The crown stays rounded: tips near the top are pulled in, the side flicks keep their length.
  let pts = [...right, ...left.slice(1)].map(([x, y]) => {
    const a = Math.atan2(m.cy - y, x - m.cx) * 180 / Math.PI;
    if (a < 45 || a > 135) return [x, y];
    const r = Math.hypot((x - m.cx) / m.rx, (y - m.cy) / m.ry), k = (1 + (r - 1) * .4) / r;
    return [m.cx + (x - m.cx) * k, m.cy + (y - m.cy) * k];
  });
  if (m.nape) {
    // Back views: a ragged nape edge with locks pointing down toward the collar.
    const [[x0, y0], [x1, y1]] = m.nape, napePts = [];
    const count = 5;
    for (let i = 0; i <= count * 2; i++) {
      const t = i / (count * 2), tip = i % 2 === 1;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 3;
      napePts.push([x + (tip ? (t - .5) * 3 : 0), y + (tip ? 4 + 2.5 * noise(view * 13 + i) : -1)]);
    }
    pts = [...pts, ...napePts];
  } else pts = [...pts, ...m.under];
  return pts;
}
// Clump partings: from each valley of the outline, a curved line runs back toward the crown.
function partings(pts, cx, cy, reach, color, width, start = 0) {
  let s = '';
  for (let i = start; i < pts.length; i += 2) {
    const [x, y] = pts[i], tx = x + (cx - x) * reach, ty = y + (cy - y) * reach;
    const bend = (noise(i * 5 + cx) - .5) * 5;
    s += line(`M${x.toFixed(1)} ${y.toFixed(1)} Q${((x + tx) / 2 + bend).toFixed(1)} ${((y + ty) / 2 - bend * .4).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`, color, width);
  }
  return s;
}
function hairBack(view) {
  const pts = massPoints(view), d = curvy(pts, .2);
  const m = MASS[view];
  const inner = partings(pts, m.cx, m.cy - 14, .42, '#c4840e', .9)
    + tufts({ box: [m.cx - 30, 14, m.cx + 30, 64], cx: m.cx - 2, cy: 18, count: 16, len: [6, 11], colors: ['#d6981c', 'var(--hairLight)'], width: .6, seed: 7 + view, droop: .2 })
    + line(`M${m.cx - 18} 18 Q${m.cx - 27} 27 ${m.cx - 28} 40 M${m.cx + 12} 16 Q${m.cx + 22} 22 ${m.cx + 25} 32`, 'var(--hairLight)', 1.4)
    + path(`M${m.cx - 34} 52 Q${m.cx} 70 ${m.cx + 34} 52 L${m.cx + 40} 72 L${m.cx - 40} 72Z`, 'var(--hairDark)', 'none', 0, 'opacity=".45"');
  return path(d, grad('hair'), HAIR_INK, 1.1) + clipped(`hero2-back-${view}`, d, inner);
}

// Fringe: the top of the head and the bangs over the forehead. Only the lower (bang) edge is outlined,
// so the scalp joins the hair mass without a helmet line.
const FRINGE = [
  // Front: locks at both temples, a pointed lock between the eyes.
  { arc: [63, 44, 30.5, 29, 188, -8], edge: [[87, 50], [83.5, 37.5], [78.5, 43.5], [74.5, 32.5], [69.5, 41.5], [66.5, 35], [62.5, 43.5], [58, 32.5], [52.5, 41.5], [47.5, 33.5], [43, 43], [41, 39], [39.5, 50]], bend: .22 },
  // Front-left: bangs shifted toward the face, a lock in front of the near ear.
  { arc: [63, 44, 30, 29, 192, -6], edge: [[80, 49], [78.5, 37.5], [73.5, 42.5], [70, 32], [65, 41], [62, 34.5], [57, 43], [52.5, 32], [47.5, 41.5], [43.5, 33], [39.5, 42.5], [37.5, 37], [35.5, 46]], bend: .22 },
  // Profile (facing left): bangs over the brow, a sideburn lock in front of the ear, hair above the ear.
  { arc: [64, 42, 30, 29, 196, 8], edge: [[93, 46], [86, 44], [79, 47], [74, 42.5], [67.5, 43], [64.5, 55], [62.5, 42], [58, 37], [55, 43], [51.5, 33], [48, 41.5], [44.5, 32], [40, 41], [37.5, 34], [33.5, 42]], bend: .2 },
];
function fringe(view) {
  if (view >= 3) return '';
  const f = FRINGE[view], [cx, cy, rx, ry, from, to] = f.arc;
  const top = arcPts(cx, cy, rx, ry, from, to, 16);
  const edgeD = curvy(f.edge, f.bend, false);
  const valleys = f.edge.filter((_, i) => i % 2 === 1);
  const d = `M${top.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} L${f.edge[0][0]} ${f.edge[0][1]} ${edgeD.slice(edgeD.indexOf('Q'))} Z`;
  const inner = partings(valleys, cx - 2, 14, .45, '#c4840e', .85)
    + tufts({ box: [cx - 26, 16, cx + 26, 40], cx: cx - 4, cy: 12, count: 12, len: [5, 9], colors: ['#d6981c', 'var(--hairLight)'], width: .6, seed: 91 + view, droop: .6 })
    + line(`M${cx - 15} 20 Q${cx - 22} 26 ${cx - 23} 34 M${cx + 6} 18 Q${cx + 14} 22 ${cx + 17} 30`, 'var(--hairLight)', 1.3);
  return path(d, grad('hair'), 'none', 0) + clipped(`hero2-fringe-${view}`, d, inner) + line(edgeD, HAIR_INK, 1);
}
// Ahoge: one lock rising from the crown and curling over.
const AHOGE = [[60, 15, 1], [61, 15, 1], [61, 15, 1], [63, 15, -1], [64, 15, -1]];
function ahoge(view) {
  const [x, y, k] = AHOGE[view];
  const d = `M${x - 3 * k} ${y + 2} C${x - 5 * k} ${y - 6} ${x + 2 * k} ${y - 10} ${x + 10 * k} ${y - 7} C${x + 5 * k} ${y - 6.5} ${x + 1 * k} ${y - 4} ${x + 3 * k} ${y + 2}Z`;
  return path(d, grad('hair'), HAIR_INK, 1) + line(`M${x - 1 * k} ${y - 1} C${x - 1 * k} ${y - 5} ${x + 3 * k} ${y - 7.5} ${x + 7 * k} ${y - 7.2}`, 'var(--hairLight)', .9);
}
// Ears peek out below the hair in the back view.
const backEars = () => [[34.5, 1], [91.5, -1]].map(([x, k]) => ellipse(x, 54, 3.6, 5.4, grad('skin'), LINE, .85) + line(`M${x + .8 * k} 51 Q${x - 1.6 * k} 53 ${x} 57`, 'var(--skinDark)', .7)).join('');

const FACE = {
  shape: 'female', line: LINE, smile: true, blush: '#f3988a',
  features: { eyeY: 52.5, browY: 43.6, noseY: 59, mouthY: 63.2 },
  eye: { size: .9, irisStroke: '#123070', pupil: '#0d1b42', glint: '#7cc4ff' },
  brow: { thick: .62, tilt: -.25, color: '#8a5418' }, mouthColor: '#8e3e2c',
};
function head(view) {
  const ears = view === 4 ? backEars() : '';
  return hairBack(view) + ears + face(view, FACE) + fringe(view) + ahoge(view);
}

// ---------------------------------------------------------------- torso
// A thick hardcover book carried upright on top of the small backpack.
// From behind it shows its navy cover (brass corners and an emblem), never the pages;
// only the side views show the cream fore-edge between the two covers.
const bookSide = (x, y, w, h) => path(`M${x} ${y + 1} q0 -1 1 -1 h${w - 2} q1 0 1 1 v${h - 1} h${-w}Z`, 'var(--book)', TUNIC_INK, .85)
  + path(`M${x + 2} ${y + 1.2} h${w - 4} v${h - 1.6} h${-(w - 4)}Z`, 'var(--paper)', '#b9a57c', .5)
  + Array.from({ length: Math.max(1, Math.floor((h - 3) / 1.7)) }, (_, i) => line(`M${x + 2.6} ${(y + 2.6 + i * 1.7).toFixed(1)} h${w - 5.2}`, '#d3c29a', .4)).join('');
function bookCover(x, y, w, h, emblem = true) {
  const corner = (cx, cy, kx) => path(`M${cx} ${cy} h${4.2 * kx} l${-4.2 * kx} 4.2Z`, grad('gold'), 'var(--goldDark)', .55);
  let s = path(`M${x} ${y + 1.2} q0 -1.2 1.2 -1.2 h${w - 2.4} q1.2 0 1.2 1.2 v${h - 1.2} h${-w}Z`, 'var(--book)', TUNIC_INK, .9)
    + path(`M${x + 2.4} ${y + 2.4} h${w - 4.8} v${h - 3.6} h${-(w - 4.8)}Z`, 'none', '#c99a3a', .5)
    + line(`M${x + 1.2} ${y + 1} h${w - 2.4}`, '#4a63b0', .8)
    + corner(x + .4, y + .4, 1) + corner(x + w - .4, y + .4, -1);
  if (emblem) {
    const cx = x + w / 2, cy = y + h * .5;
    s += path(`M${cx} ${cy - 3.6} L${cx + 3.2} ${cy} L${cx} ${cy + 3.6} L${cx - 3.2} ${cy}Z`, grad('gold'), 'var(--goldDark)', .6)
      + ellipse(cx, cy, 1.1, 1.1, 'var(--book)', 'none');
  }
  return s;
}
// Spine of the book seen at an angle from behind: a darker navy band with two raised bands.
const bookSpine = (x, y, w, h) => path(`M${x} ${y + 1.2} q0 -1.2 1.2 -1.2 h${w - 1.2} v${h} h${-w}Z`, '#1c2a5c', TUNIC_INK, .85)
  + line(`M${x + .6} ${y + 4} h${w - 1} M${x + .6} ${y + 9} h${w - 1}`, '#c99a3a', .6);
function pouch(x, y, w = 11, h = 14) {
  return path(`M${x} ${y + 2} q0 -2 2 -2 h${w - 4} q2 0 2 2 v${h - 5} q0 3 -3 3 h${-(w - 6)} q-3 0 -3 -3Z`, grad('pack'), PACK_INK, .85)
    + path(`M${x - .5} ${y + 1.5} q0 -2 2 -2 h${w - 3} q2 0 2 2 v4 q${-w / 2 - .5} 3.5 ${-w - 1} 0Z`, 'var(--packDark)', PACK_INK, .75)
    + ellipse(x + w / 2, y + 5.6, 1.2, 1.2, grad('gold'), 'var(--goldDark)', .6)
    + line(`M${x + 1.5} ${y + h - 2.5} h${w - 3}`, 'var(--packLight)', .5);
}
function tunicMarks(l, r) {
  return line(`M${l + 4} 99 Q${l + 3} 106 ${l + 4} 117 M${r - 4} 99 Q${r - 3} 106 ${r - 4} 117`, 'var(--tunicDark)', .9)
    + line(`M${l + 2} 117.5 Q63 123 ${r - 2} 117.5`, 'var(--tunicLight)', .6);
}

function torso(view, mirror) {
  const widths = [24, 22, 17, 22, 24];
  let s = '';
  // Behind the body: the book stack above the shoulders (front views) and the pack beside the back.
  if (view === 0) s += bookCover(42, 69, 42, 12, false);
  if (view === 1) s += bookSide(80, 68, 11, 16) + path('M81 86 h9 q3 0 3 3 v19 q0 3 -3 3 h-9Z', grad('pack'), PACK_INK, .9);
  // Far-side pouch peeking out behind the hip (front-right only).
  if (view === 1 && mirror) s += pouch(36, 102, 8, 13);
  s += neck(view, { line: LINE });
  const { l, r, s: body } = shell(view, widths, grad('tunic'), TUNIC_INK);
  s += body + tunicMarks(l, r);
  // High navy collar around the neck.
  s += [
    path('M54.5 71.5 Q63 75 71.5 71.5 L72.5 79 Q63 82.5 53.5 79Z', 'var(--tunicDark)', TUNIC_INK, .8),
    path('M49 71 Q57.5 74 66 70 L68 77.5 Q57.5 81.5 48 78.5Z', 'var(--tunicDark)', TUNIC_INK, .8),
    path('M51 73.5 Q62 71 74 67.5 L76.5 74 Q64 79 52 81Z', 'var(--tunicDark)', TUNIC_INK, .8),
    path('M47 73 Q63 69 79 73 L79 79 Q63 75 47 79Z', 'var(--tunicDark)', TUNIC_INK, .8),
    path('M45 74 Q63 69 81 74 L81 80 Q63 75 45 80Z', 'var(--tunicDark)', TUNIC_INK, .8),
  ][view];
  // Belt with a brass buckle (front three views); plain at the back.
  s += belt(view, l, r, { top: 100, leather: 'var(--leather)', stitch: '#b5854a', ink: PACK_INK });
  // Near-side pouch on his left hip.
  if (!mirror && view === 0) s += pouch(77.5, 103);
  if (!mirror && view === 1) s += pouch(75.5, 103);
  if (!mirror && view === 2) s += pouch(42.5, 102.5, 10, 14);
  if (!mirror && view === 3) s += pouch(37, 102.5, 8, 13);
  s += cape(view);
  s += pack(view);
  return s;
}

// Cream capelet over the shoulders: two front flaps open at the centre; one piece at the back.
function cape(view) {
  const shade = (d, id) => path(d, grad('cape'), '#8f7748', .95) + clipped(`hero2-cape-${id}`, d,
    path('M20 93 Q63 104 106 93 L106 110 L20 110Z', 'var(--capeDark)', 'none', 0, 'opacity=".55"')
    + line('M20 80 Q63 70 106 80', 'var(--capeLight)', 1.6));
  if (view === 0) return shade('M62.5 76 Q52 75 42 78.5 Q34.5 82.5 33.8 92 Q34.5 96.5 39.5 97 Q50 98.5 60.6 97.2 Q61.5 87 62.5 76Z', 'f0')
    + shade('M63.5 76 Q74 75 84 78.5 Q91.5 82.5 92.2 92 Q91.5 96.5 86.5 97 Q76 98.5 65.4 97.2 Q64.5 87 63.5 76Z', 'f1')
    + line('M44 82 Q41 88 42 94 M82 82 Q85 88 84 94', 'var(--capeDark)', .7);
  if (view === 1) return shade('M56 75 Q48 75 42 78 Q36.5 83 36.8 92 Q39.5 96 46 96 Q51 96 54.4 95.4 Q55 85 56 75Z', 'q0')
    + shade('M57 75 Q70 74 80 78 Q88 83 88.5 92 Q87.5 96.5 82 97 Q70 98.5 58.4 96.6 Q57.6 86 57 75Z', 'q1')
    + line('M78 81 Q81 87 80 94', 'var(--capeDark)', .7);
  if (view === 2) return shade('M50 75 Q62 71 76 75 Q83 81 82 93 Q71 98 57 96.5 Q47 95.5 45 90 Q45 81 50 75Z', 's')
    + line('M57 80 Q55 88 57 95', 'var(--capeDark)', .7);
  if (view === 3) return shade('M41 78 Q60 71 82 76 Q90 82 89.5 92 Q70 99 40 95 Q35 90 36 84 Q37 80 41 78Z', 'b3');
  return shade('M41 77 Q63 70 85 77 Q92.5 83 92 93 Q63 100 34 93 Q33.5 83 41 77Z', 'b4');
}

// Backpack: strap over the shoulder in profile, the full pack with a buttoned pocket from behind.
function pack(view) {
  const strap = (d, w = 3) => line(d, PACK_INK, w + 1.4) + line(d, 'var(--pack)', w);
  // A leather band ties the book to the pack; its buckle sits on the book.
  const tie = (x0, x1, y) => path(`M${x0} ${y} H${x1} v3 H${x0}Z`, 'var(--leather)', PACK_INK, .7)
    + path(`M${(x0 + x1) / 2 - 2} ${y - .6} h4 v4.2 h-4Z`, grad('gold'), 'var(--goldDark)', .55);
  if (view === 2) {
    return strap('M79 84 Q67 70 56 76 Q51.5 80 52 90')
      + bookSide(80, 66, 11, 22)
      + path('M77 87 Q77 84.5 80 84.5 L89 84.5 Q92.5 85 92.5 88.5 L92.5 106.5 Q92.5 110.5 88.5 110.5 L80.5 110.5 Q77.5 110.5 77.5 107Z', grad('pack'), PACK_INK, .95)
      + path('M77 86.5 h15.5 v9 q-7.75 4 -15.5 0Z', 'var(--packDark)', PACK_INK, .8)
      + ellipse(84.8, 96.2, 1.2, 1.2, grad('gold'), 'var(--goldDark)', .6)
      + path('M79.4 75 h12.6 v3 h-12.6Z', 'var(--leather)', PACK_INK, .7);
  }
  if (view === 3) {
    return strap('M58 97 Q51 82 45 77') + strap('M85 97 Q88 82 85 75.5', 2.5)
      + bookSpine(56, 69, 4.5, 29) + bookCover(60.5, 69, 26, 29)
      + path('M57 98 Q57 95.5 60 95.5 L83.5 95.5 Q87 96 87 99 L87 112.5 Q87 115.5 83.5 115.5 L60.5 115.5 Q57 115.5 57 112.5Z', grad('pack'), PACK_INK, .95)
      + path('M57 98.5 L60.5 96.5 L60.5 115.4 L57 112.5Z', 'var(--packDark)', 'none')
      + pocket(73.5, 17, 102, 113)
      + tie(60.5, 86.5, 90.5);
  }
  if (view === 4) {
    return strap('M52 97 Q46 82 41 77') + strap('M74 97 Q80 82 85 77')
      + bookCover(47, 69, 32, 29)
      + path('M49 99 Q49 96 52 96 L74 96 Q77 96 77 99 L77 112.5 Q77 116 73.5 116 L52.5 116 Q49 116 49 112.5Z', grad('pack'), PACK_INK, .95)
      + pocket(63, 19, 102.5, 113.5)
      + tie(47, 79, 90.5);
  }
  return '';
}
// Front pocket of the backpack: body, a rounded flap and the brass button.
function pocket(cx, w, top, bottom) {
  const l = cx - w / 2, r = cx + w / 2;
  return path(`M${l} ${top} H${r} V${bottom - 3} Q${r} ${bottom} ${r - 3} ${bottom} H${l + 3} Q${l} ${bottom} ${l} ${bottom - 3}Z`, grad('pack'), PACK_INK, .85)
    + path(`M${l - 1} ${top - 1} H${r + 1} V${top + 6} Q${cx} ${top + 10} ${l - 1} ${top + 6}Z`, 'var(--packDark)', PACK_INK, .85)
    + line(`M${l + 1} ${top + 5} Q${cx} ${top + 8.6} ${r - 1} ${top + 5}`, 'var(--packLight)', .55)
    + ellipse(cx, top + 8, 1.9, 1.9, grad('gold'), 'var(--goldDark)', .7);
}

export function hero2Markup(direction, part = 'combined') {
  const mirror = DIRECTIONS.indexOf(direction) > 4;
  return compose(direction, part, { head, torso: view => torso(view, mirror) });
}
export const buildHero2Sheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, hero2Markup);
