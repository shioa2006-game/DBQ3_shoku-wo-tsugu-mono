import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// 主人公シオンの新デザイン案・試作02。正本は8方向の設定画 references/hero-redesign-8dir-v2.png。
// 各向きの形は、設定画の各セル（443.5px四方）の座標で書き、セル128pxへ縮小して置く（設定画の画素は使わない）。
// 頭（髪・顔・耳）と胴（首・襟・肩掛け・チュニック・ベルト・小物入れ・背中のホルダーと職業の書）を分ける。
// 腕・脚・手・足はゲームの3Dリグが描く（紺の袖・素手・焦げ茶のズボン・茶色のブーツ）。
//
// view: 0=正面 1=左斜め前 2=左 3=左斜め後 4=背面。右側の3方向は左側を反転する。
// 左右非対称なのは左腰の小物入れだけで、反転した向きでは向こう側として描き分ける。
// 斜め後ろの頭は、設定画の右斜め後ろ（耳と頬だけが見える）を基にする。設定画の左斜め後ろは
// 横顔（目・口）まで見えていて真横とほぼ同じになるため、回転のつながりを優先した。

export const DEFAULT_PALETTE = Object.freeze({
  ink: '#3a2212',
  skin: '#fde0c4', skinLight: '#fff1e2', skinDark: '#efb995',
  hair: '#f6bf3e', hairLight: '#ffe07a', hairDark: '#e29a2a',
  tunic: '#2c3b7e', tunicLight: '#41559e', tunicDark: '#1b2556',
  cape: '#ecd7ae', capeLight: '#f9ebd0', capeDark: '#cdb083',
  pack: '#8c5530', packLight: '#ad6f3f', packDark: '#5c3417',
  belt: '#7a4826', gold: '#e1ae3d', goldLight: '#ffe08c', goldDark: '#9a6a18',
  book: '#25336f', bookLight: '#37499a', bookDark: '#161f4c',
  paper: '#f6ecd2',
});
const EXTRA = `<linearGradient id="hairV" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--hairLight)"/><stop offset=".45" stop-color="var(--hair)"/><stop offset="1" stop-color="var(--hairDark)"/></linearGradient>
  <linearGradient id="iris2" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#14306e"/><stop offset=".48" stop-color="#2f78d6"/><stop offset="1" stop-color="#8fd2ff"/></linearGradient>`;
const DEFS = definitions(['tunic', 'cape', 'pack', 'gold', 'book'], EXTRA);

// Reference cell -> game cell. Every view keeps the same scale; the tunic centre lands on the
// rig's art centre (u = .494) so the 3D arms and legs attach under the drawn body.
const K = .345;
const ART_CENTER = 128 * .494;
const TOP = 6.5 - K * 12;
const TUNIC_CENTER = [305, 218, 153, 121, 305];

const INK = '#3a2212';      // hair, skin
const TINK = '#141a3a';     // tunic, book
const CINK = '#5e4426';     // capelet
const PINK = '#3e2210';     // leather
const HAIR_LINE = '#c57c18';
const W = 3;                // outline width in reference pixels (about 1px in the game cell)

const P = (d, fill, stroke = INK, w = W, extra = '') => path(d, fill, stroke, w, extra);
const f1 = n => (+n.toFixed(1)).toString();

// ---------------------------------------------------------------- hair outlines
// pts: [x, y, flag]. flag 't' = tip of a lock; 'h' = hidden (straight) segment into this point;
// a number = explicit bulge for the segment into this point. Points next to a tip are pulled toward the
// centre by `inset`, and the lock's edge toward the higher base is convex, the other concave, so each tip
// hooks like a soft curl.
function shape(pts, [cx, cy], inset) {
  const p = pts.map(([x, y, flag]) => ({ x, y, flag }));
  const n = p.length;
  return p.map((q, i) => {
    if (q.flag === 't' || q.flag === 'h' || !inset) return q;
    const nearTip = p[(i + 1) % n].flag === 't' || p[(i - 1 + n) % n].flag === 't';
    if (!nearTip) return q;
    const dx = cx - q.x, dy = cy - q.y, l = Math.hypot(dx, dy) || 1;
    return { ...q, x: q.x + dx / l * inset, y: q.y + dy / l * inset, base: true };
  });
}
function hairPath(pts, [cx, cy], { close = true, convex = .32, concave = .1, smooth = .1, inset = 4 } = {}) {
  const p = shape(pts, [cx, cy], inset);
  const n = p.length, segs = close ? n : n - 1;
  let d = `M${f1(p[0].x)} ${f1(p[0].y)}`;
  for (let i = 0; i < segs; i++) {
    const a = p[i], b = p[(i + 1) % n];
    if (b.flag === 'h') { d += ` L${f1(b.x)} ${f1(b.y)}`; continue; }
    let nx = -(b.y - a.y), ny = b.x - a.x; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
    let k = smooth;
    if (typeof b.flag === 'number') k = b.flag;
    else if (a.flag === 't' || b.flag === 't') {
      const ti = a.flag === 't' ? i : (i + 1) % n;
      const base = a.flag === 't' ? b : a, prev = p[(ti - 1 + n) % n], next = p[(ti + 1) % n];
      const other = base === prev ? next : prev;
      k = base.y <= other.y ? convex : -concave;
    }
    d += ` Q${f1(mx + nx * len * k)} ${f1(my + ny * len * k)} ${f1(b.x)} ${f1(b.y)}`;
  }
  return close ? d + 'Z' : d;
}
// Lock partings: from each base between two locks, a curved line runs toward the crown, with a soft
// darker band beside it (the shaded side of the lock).
function partings(pts, center, crown, reach = .42, inset = 4, swirl = 0) {
  const p = shape(pts, center, inset);
  let s = '';
  p.forEach((q, i) => {
    if (!q.base) return;
    const tx = q.x + (crown[0] - q.x) * reach, ty = q.y + (crown[1] - q.y) * reach;
    const side = swirl ? swirl * 9 : (i % 2 ? 1 : -1) * 7;
    const mx = (q.x + tx) / 2 + side * .6, my = (q.y + ty) / 2 - Math.abs(side) * .3;
    const d = `M${f1(q.x)} ${f1(q.y)} Q${f1(mx)} ${f1(my)} ${f1(tx)} ${f1(ty)}`;
    s += line(d, 'var(--hairDark)', 6).replace('/>', ' opacity=".35"/>') + line(d, HAIR_LINE, 2);
  });
  return s;
}
const strokes = (ds, color = HAIR_LINE, w = 2) => ds.map(d => line(d, 'var(--hairDark)', 6).replace('/>', ' opacity=".3"/>') + line(d, color, w)).join('');
const sheens = ds => ds.map(d => line(d, 'var(--hairLight)', 4).replace('/>', ' opacity=".9"/>')).join('');

// Bangs: an open edge of locks, then closed back over the scalp without an outline.
function fringe(tag, edgePts, center, closeBack, lines = [], sheen = []) {
  const edge = hairPath(edgePts, center, { close: false, convex: .24, concave: .16, inset: 4 });
  const region = `${edge} ${closeBack}Z`;
  return P(region, grad('hairV'), 'none', 0)
    + clipped(`hero2-fr-${tag}`, region, partings(edgePts, center, [center[0], center[1] + 14], .55, 4) + strokes(lines) + sheens(sheen))
    + line(edge, INK, W);
}
function mass(tag, pts, center, lines = [], sheen = [], crown = [center[0], center[1] - 50], swirl = 0) {
  const d = hairPath(pts, center);
  return P(d, grad('hairV'), INK, W)
    + clipped(`hero2-hm-${tag}`, d, P(`M${center[0] - 140} 168 Q${center[0]} 214 ${center[0] + 140} 168 L${center[0] + 140} 240 L${center[0] - 140} 240Z`, 'var(--hairDark)', 'none', 0, 'opacity=".22"')
      + partings(pts, center, crown, swirl ? .34 : .42, 4, swirl) + strokes(lines) + sheens(sheen));
}
// Ahoge: a crescent rooted on one side of the crown, arching over to a pointed tip that hangs in the
// air (an open gap remains under it, as in the design sheet). The root's bottom edge is not outlined.
function ahoge(d, strand) {
  const [outer, rest] = d.replace(/Z$/, '').split(' L');
  return P(d, grad('hairV'), 'none', 0) + line(outer, INK, W) + line(`M${rest}`, INK, W) + line(strand, HAIR_LINE, 1.8);
}

// ---------------------------------------------------------------- face parts
// Large chibi eye: rounded white, a big iris toward the nose, two highlights, a heavy upper lash.
function eye(x, y, w, h, { inner = 1, tag }) {
  const id = `hero2-eye-${tag}`;
  const white = `M${f1(x - w / 2)} ${f1(y + h * .05)} C${f1(x - w / 2)} ${f1(y - h * .55)} ${f1(x + w / 2)} ${f1(y - h * .55)} ${f1(x + w / 2)} ${f1(y + h * .05)} C${f1(x + w / 2)} ${f1(y + h * .5)} ${f1(x - w / 2)} ${f1(y + h * .5)} ${f1(x - w / 2)} ${f1(y + h * .05)}Z`;
  const ix = x + inner * w * .1;
  return P(white, '#ffffff', 'none', 0)
    + clipped(id, white,
      ellipse(f1(ix), f1(y + h * .06), f1(w * .38), f1(h * .44), 'url(#iris2)', '#10255a', 1.4)
      + ellipse(f1(ix), f1(y + h * .1), f1(w * .17), f1(h * .22), '#0f2350', 'none', 0)
      + ellipse(f1(ix + inner * w * .13), f1(y - h * .14), f1(w * .13), f1(h * .12), '#ffffff', 'none', 0)
      + ellipse(f1(ix - inner * w * .14), f1(y + h * .25), f1(w * .06), f1(h * .05), '#ffffff', 'none', 0, 'opacity=".85"'))
    + line(`M${f1(x - w / 2 - 1)} ${f1(y + h * .02)} C${f1(x - w / 2)} ${f1(y - h * .52)} ${f1(x + w / 2)} ${f1(y - h * .52)} ${f1(x + w / 2 + .5)} ${f1(y - h * .02)}`, '#2a1810', 4.2)
    + line(`M${f1(x - inner * w / 2 - inner * .5)} ${f1(y - h * .08)} l${f1(-inner * 4)} ${f1(-2.5)}`, '#2a1810', 2.6)
    + line(`M${f1(x - w * .3)} ${f1(y + h * .47)} Q${f1(x)} ${f1(y + h * .54)} ${f1(x + w * .3)} ${f1(y + h * .47)}`, '#a8714f', 1.3);
}
const brow = d => line(d, '#6b3a18', 2.6);
const mouth = d => line(d, '#7a3a26', 2.4);
function blush(x, y, rx, ry) {
  return ellipse(x, y, rx, ry, '#f6a3a0', 'none', 0, 'opacity=".55"')
    + line(`M${x - rx * .55} ${y + 2} l2.4 -3.6 M${x - rx * .05} ${y + 2} l2.4 -3.6 M${x + rx * .45} ${y + 2} l2.4 -3.6`, '#e98585', .9);
}
const skin = d => P(d, grad('skin'), INK, W);
function ear(d, innerD) { return skin(d) + line(innerD, 'var(--skinDark)', 1.8); }

// ---------------------------------------------------------------- heads
const HEADS = [
  // 0 front
  tag => {
    const c = [305, 112];
    return mass(tag, [
      [300, 46], [324, 43], [346, 49], [366, 56], [401, 62, 't'], [384, 80], [413, 114, 't'], [397, 124],
      [407, 148, 't'], [391, 158], [397, 177, 't'], [378, 190], [340, 199, 'h'], [270, 199, 'h'], [229, 190, 'h'],
      [207, 176, 't'], [214, 158], [196, 147, 't'], [208, 124], [191, 103, 't'], [211, 86], [212, 58, 't'], [238, 56],
      [256, 49], [278, 45],
    ], c, [], ['M262 72 Q300 58 340 70'])
      + ear('M248 160 C238 152 226 160 228 174 C230 188 242 194 252 188Z', 'M244 167 Q235 172 240 183')
      + ear('M360 160 C370 152 382 160 380 174 C378 188 366 194 356 188Z', 'M364 167 Q373 172 368 183')
      + skin('M251 104 C245 128 243 158 251 180 C260 198 280 206 304 206 C328 206 346 198 355 180 C363 158 361 128 356 104 Q304 92 251 104Z')
      + blush(258, 183, 9.5, 5) + blush(350, 183, 9.5, 5)
      + eye(277, 157, 31, 34, { inner: 1, tag: `${tag}a` }) + eye(333, 157, 31, 34, { inner: -1, tag: `${tag}b` })
      + brow('M263 121 Q276 114 290 118') + brow('M320 118 Q334 114 347 121')
      + line('M302 171 Q305 174 302 177', 'var(--skinDark)', 1.8) + mouth('M290 184 Q305 194 320 184')
      + fringe(tag, [[247, 167, 't'], [252, 128], [263, 121, 't'], [270, 104], [284, 138, 't'], [297, 108], [319, 149, 't'],
        [330, 110], [350, 131, 't'], [360, 113], [377, 152, 't'], [372, 168]], [305, 40],
        'L368 140 L374 96 Q342 58 305 56 Q266 58 238 96 L240 150',
        ['M300 60 Q302 112 318 146'],
        ['M266 76 Q290 66 314 68', 'M326 72 Q342 76 352 86'])
      + ahoge('M256 38 C266 18 296 10 316 14 C332 18 342 32 338 50 L318 52 C316 40 306 28 290 28 C276 28 264 33 256 38Z', 'M330 46 Q326 30 310 22');
  },
  // 1 front-left
  tag => {
    const c = [236, 112];
    return mass(tag, [
      [238, 48], [262, 46], [284, 51], [307, 42, 't'], [300, 62], [336, 77, 't'], [322, 92], [342, 120, 't'], [328, 129],
      [339, 150, 't'], [325, 160], [330, 182, 't'], [315, 192], [302, 199], [270, 200, 'h'], [190, 200, 'h'], [156, 168, 'h'],
      [140, 150, 't'], [150, 128], [128, 103, 't'], [148, 86], [143, 58, 't'], [168, 58], [195, 50], [216, 47],
    ], c, ['M290 70 Q318 100 318 150'], ['M190 70 Q230 56 270 66'])
      + skin('M161 104 C152 130 151 158 158 178 C166 196 182 205 203 206 C224 207 242 199 254 185 C262 170 264 140 260 104 Q210 92 161 104Z')
      + ear('M255 158 C262 148 278 151 278 168 C278 185 266 193 253 186Z', 'M262 161 Q271 167 266 180')
      + blush(222, 178, 9, 5) + blush(161, 176, 5, 4)
      + eye(168, 153, 17, 30, { inner: 1, tag: `${tag}a` }) + eye(211, 155, 32, 34, { inner: -1, tag: `${tag}b` })
      + brow('M161 121 Q168 117 176 118') + brow('M197 118 Q211 112 226 117')
      + line('M181 170 Q177 173 180 176', 'var(--skinDark)', 1.8) + mouth('M171 184 Q183 193 196 185')
      + fringe(tag, [[156, 152, 't'], [160, 121], [167, 130, 't'], [175, 104], [188, 130, 't'], [201, 104], [223, 148, 't'],
        [231, 118], [242, 157, 't'], [249, 136], [258, 150, 't'], [262, 140]], [215, 40],
        'L272 122 L282 84 Q262 56 236 56 Q190 58 160 90 L150 132',
        ['M226 60 Q222 104 223 146'],
        ['M196 76 Q220 66 246 70', 'M256 74 Q270 78 280 88'])
      + ahoge('M179 40 C188 19 220 9 240 12 C256 15 263 30 259 50 L242 51 C240 39 228 27 210 27 C197 27 186 33 179 40Z', 'M252 46 Q248 30 234 21');
  },
  // 2 left (profile)
  tag => {
    const c = [192, 120];
    return mass(tag, [
      [190, 46], [214, 44], [238, 47], [262, 48, 't'], [250, 64], [280, 84, 't'], [266, 98], [278, 126, 't'], [266, 138],
      [274, 160, 't'], [261, 170], [258, 188, 't'], [244, 195], [228, 204], [208, 206], [192, 200], [176, 192, 'h'],
      [140, 150, 'h'], [108, 128, 'h'], [92, 101, 't'], [110, 82], [96, 60, 't'], [122, 56], [148, 48], [170, 45],
    ], c, ['M200 70 Q236 90 232 140', 'M232 140 Q226 170 236 196'],
    ['M150 62 Q176 52 204 56'])
      + skin('M106 112 Q100 128 99 144 Q98 158 93 167 Q94 172 99 175 Q98 184 104 192 Q112 204 128 208 Q150 212 168 206 Q184 196 186 170 Q186 130 170 108 Q140 98 106 112Z')
      + ear('M170 160 C174 149 191 151 192 168 C193 186 180 194 167 188Z', 'M177 162 Q186 168 182 180')
      + blush(131, 180, 8, 4.5)
      + eye(118, 158, 22, 36, { inner: -1, tag: `${tag}a` })
      + brow('M106 125 Q115 120 125 123') + mouth('M101 186 Q106 190 112 187')
      + fringe(tag, [[101, 124, 't'], [111, 110], [118, 124, 't'], [128, 108], [147, 168, 't'], [153, 132], [166, 157, 't'],
        [172, 145], [186, 152, 't'], [190, 140]], [176, 60],
        'L204 130 L214 90 Q196 54 150 56 Q112 62 98 92',
        ['M168 64 Q150 110 147 166'],
        ['M134 72 Q154 64 176 66'])
      + ahoge('M129 38 C138 18 170 9 190 12 C206 15 214 30 210 50 L194 50 C190 38 178 26 160 26 C148 26 137 31 129 38Z', 'M203 46 Q200 30 186 20');
  },
  // 3 back-left: drawn in the coordinates of the reference's back-right cell and mirrored
  // (its tunic centre 234 lands on this view's tunic centre 121).
  tag => {
    const c = [236, 112];
    const inner = mass(tag, [
      [235, 44], [262, 45], [290, 48], [316, 54], [331, 55, 't'], [326, 72], [336, 92, 't'], [326, 104], [324, 123, 't'],
      [306, 128, 'h'], [290, 152, 'h'], [280, 190, 'h'], [266, 201, 't'], [250, 194], [238, 198, 't'], [222, 190], [208, 192, 't'],
      [194, 184], [184, 182, 't'], [172, 166], [160, 152, 't'], [163, 136], [150, 124, 't'], [156, 110], [136, 96, 't'], [152, 82],
      [164, 50, 't'], [186, 50], [210, 46],
    ], c, ['M252 52 Q224 64 228 94 Q234 118 268 120', 'M282 60 Q304 76 298 102'],
    ['M214 66 Q236 58 258 62'], [240, 70], 1)
      + skin('M296 128 Q318 120 322 140 Q326 168 314 186 Q300 196 280 194 L286 150Z')
      + ear('M299 146 C291 135 272 139 271 157 C270 176 285 185 297 177Z', 'M287 149 Q278 158 284 171')
      + P('M282 112 Q300 120 297 146 Q305 130 320 127 Q328 116 330 100 Q306 100 282 112Z', grad('hairV'), INK, W)
      + ahoge('M287 24 C277 10 249 5 229 11 C214 16 206 32 210 50 L227 50 C229 38 239 26 255 25 C269 24 280 26 287 24Z', 'M217 46 Q220 30 234 20');
    return `<g transform="translate(355 0) scale(-1 1)">${inner}</g>`;
  },
  // 4 back
  tag => {
    const c = [305, 112];
    const earL = ear('M248 150 C240 144 229 151 230 164 C231 177 240 182 249 177Z', 'M244 155 Q236 162 242 172');
    const earR = ear('M362 150 C370 144 381 151 380 164 C379 177 370 182 361 177Z', 'M366 155 Q374 162 368 172');
    return mass(tag, [
      [305, 44], [330, 46], [350, 54], [372, 56], [391, 54, 't'], [384, 74], [411, 100, 't'], [396, 110], [403, 137, 't'], [388, 146],
      [384, 166, 't'], [370, 172], [370, 186, 't'], [352, 184], [340, 193, 't'], [322, 188], [305, 195, 't'], [288, 188], [272, 192, 't'],
      [258, 183], [246, 183, 't'], [237, 171], [222, 160, 't'], [224, 146], [203, 142, 't'], [214, 124], [195, 104, 't'], [212, 88],
      [214, 60, 't'], [240, 56], [262, 48], [284, 44],
    ], c, ['M306 54 Q266 60 262 96 Q262 124 296 134', 'M330 60 Q352 76 348 104'],
    ['M276 72 Q296 62 320 68'], [305, 70], 1)
      + earL + earR
      + P('M226 138 Q236 152 250 150 Q246 140 238 136Z', grad('hairV'), INK, 2.2) + P('M384 138 Q374 152 360 150 Q364 140 372 136Z', grad('hairV'), INK, 2.2)
      + ahoge('M352 32 C342 16 314 9 294 14 C278 18 268 32 272 50 L291 52 C293 40 303 28 319 27 C333 27 345 30 352 32Z', 'M280 46 Q284 30 298 21');
  },
];

// ---------------------------------------------------------------- torso parts
const tunic = d => P(d, grad('tunic'), TINK);
const cape = (d, tag, shadeY) => P(d, grad('cape'), CINK) + clipped(`hero2-cp-${tag}`, d,
  P(`M0 ${shadeY} Q300 ${shadeY + 18} 600 ${shadeY} L600 ${shadeY + 60} L0 ${shadeY + 60}Z`, 'var(--capeDark)', 'none', 0, 'opacity=".55"')
  + line(`M0 ${shadeY - 34} Q300 ${shadeY - 46} 600 ${shadeY - 34}`, 'var(--capeLight)', 4));
const neck = d => P(d, grad('skin'), INK, 2.4);
const collar = d => P(d, grad('tunic'), TINK, 2.6);
function beltBand(x0, x1, y, sag = 3) {
  return P(`M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y} L${x1} ${y + 13} Q${(x0 + x1) / 2} ${y + 13 + sag * 2} ${x0} ${y + 13}Z`, 'var(--belt)', PINK, 2.4)
    + line(`M${x0 + 2} ${y + 3} Q${(x0 + x1) / 2} ${y + 3 + sag * 2} ${x1 - 2} ${y + 3}`, '#a0683a', 1);
}
function buckle(x, y, w = 26, h = 21) {
  return P(`M${x - w / 2 + 3} ${y - h / 2} h${w - 6} q3 0 3 3 v${h - 6} q0 3 -3 3 h${-(w - 6)} q-3 0 -3 -3 v${-(h - 6)} q0 -3 3 -3Z`, grad('gold'), 'var(--goldDark)', 2)
    + P(`M${x - w * .27} ${y - h * .25} h${w * .54} v${h * .5} h${-w * .54}Z`, '#5a3418', 'none', 0)
    + line(`M${x - w * .05} ${y - h * .3} v${h * .6}`, 'var(--goldLight)', 1.8);
}
function pouch(x, y, w = 35, h = 44) {
  return P(`M${x} ${y + 6} q0 -6 6 -6 h${w - 12} q6 0 6 6 v${h - 14} q0 8 -8 8 h${-(w - 16)} q-8 0 -8 -8Z`, grad('pack'), PINK, 2.6)
    + P(`M${x - 1} ${y + 4} q0 -5 5 -5 h${w - 8} q5 0 5 5 v12 q0 7 -8 7 h${-(w - 14)} q-7 0 -7 -7Z`, 'var(--packDark)', PINK, 2.4)
    + ellipse(x + w * .66, y + 15, 3.4, 3.4, grad('gold'), 'var(--goldDark)', 1.2)
    + line(`M${x + 4} ${y + h - 6} h${w - 8}`, 'var(--packLight)', 1.2);
}
// Open-book emblem of the Book of Jobs, in gold line on the navy cover.
function emblem(x, y, s = 1, sx = 1) {
  const g = `<g transform="translate(${x} ${y}) scale(${s * sx} ${s})">`
    + line('M-2 -9 Q-11 -14 -21 -11 L-21 9 Q-11 6 -2 11 Z M2 -9 Q11 -14 21 -11 L21 9 Q11 6 2 11 Z M-25 -6 L-25 13 Q-12 10 0 15 Q12 10 25 13 L25 -6', 'var(--gold)', 2.8 / s)
    + '</g>';
  return g;
}
// The thick hardcover book: cover (navy) and the fore-edge (cream page block between two covers).
function bookCover(x0, y0, x1, y1, ex, ey, es = 1, sx = 1) {
  return P(`M${x0} ${y0 + 6} q0 -6 6 -6 h${x1 - x0 - 12} q6 0 6 6 V${y1} H${x0}Z`, grad('book'), TINK)
    + line(`M${x0 + 5} ${y0 + 3.5} H${x1 - 5}`, 'var(--bookLight)', 1.6)
    + emblem(ex, ey, es, sx);
}
function bookEdge(x0, y0, x1, y1, cover = 6) {
  let s = P(`M${x0} ${y0 + 5} q0 -5 5 -5 h${x1 - x0 - 10} q5 0 5 5 V${y1} H${x0}Z`, grad('book'), TINK)
    + P(`M${x0 + cover} ${y0 + 3} H${x1 - cover} V${y1} H${x0 + cover}Z`, 'var(--paper)', '#b9a57c', 1.2);
  for (let x = x0 + cover + 4; x < x1 - cover - 2; x += 4.5) s += line(`M${f1(x)} ${y0 + 6} V${y1 - 2}`, '#dccca6', .9);
  return s;
}
// Small leather holder that covers only the lower part of the book; a darker rim at the top.
function holder(x0, x1, y0, y1, flare = 3) {
  return P(`M${x0 - flare} ${y0} H${x1 + flare} Q${x1 + flare + 1} ${y0 + 6} ${x1} ${y0 + 12} L${x1 - 2} ${y1 - 8} Q${x1 - 3} ${y1} ${x1 - 11} ${y1} H${x0 + 11} Q${x0 + 3} ${y1} ${x0 + 2} ${y1 - 8} L${x0} ${y0 + 12} Q${x0 - flare - 1} ${y0 + 6} ${x0 - flare} ${y0}Z`, grad('pack'), PINK)
    + P(`M${x0 - flare} ${y0} H${x1 + flare} Q${x1 + flare + 1} ${y0 + 5} ${x1 + .5} ${y0 + 10} H${x0 - .5} Q${x0 - flare - 1} ${y0 + 5} ${x0 - flare} ${y0}Z`, 'var(--packDark)', PINK, 2)
    + line(`M${x0 + 6} ${y1 - 10} Q${(x0 + x1) / 2} ${y1 - 6} ${x1 - 6} ${y1 - 10}`, 'var(--packLight)', 1.2);
}
const strap = d => line(d, PINK, 10) + line(d, 'var(--pack)', 6.6) + line(d, 'var(--packLight)', 1.2);

const TORSOS = [
  // 0 front: the book's top corners show behind both shoulders.
  (mirror, tag) => P('M252 216 Q252 208 260 208 H352 Q360 208 360 216 V250 H252Z', grad('book'), TINK)
    + line('M258 211.5 H354', 'var(--bookLight)', 1.6)
    + neck('M288 194 H320 V216 H288Z')
    + tunic('M262 220 Q305 213 348 220 Q366 238 364 270 L367 342 Q305 350 243 342 L246 270 Q244 238 262 220Z')
    + line('M256 306 Q254 324 256 338 M354 306 Q356 324 354 338', 'var(--tunicDark)', 2)
    + collar('M281 205 Q305 212 331 205 L333 219 Q320 221 307 228 Q294 221 279 219Z') + line('M307 213 V227', TINK, 2)
    + cape('M306 225 Q296 219 282 216 Q268 216 260 221 Q246 232 238 245 Q232 254 234 258 Q262 265 295 271 Q300 248 306 225Z', `${tag}a`, 262)
    + cape('M308 225 Q318 219 332 216 Q346 216 354 221 Q368 232 376 245 Q382 254 380 258 Q352 265 319 271 Q314 248 308 225Z', `${tag}b`, 262)
    + beltBand(246, 366, 287) + buckle(306, 298)
    + (mirror ? '' : pouch(323, 297)),
  // 1 front-left: the book and holder behind the right shoulder; strap over the near shoulder.
  (mirror, tag) => (mirror ? pouch(143, 298, 22, 40) : '')
    + bookEdge(258, 209, 302, 272, 7)
    + holder(272, 304, 264, 326)
    + neck('M196 196 H230 V216 H196Z')
    + tunic('M168 220 Q220 210 272 216 Q284 240 280 270 L284 342 Q218 350 152 342 L156 270 Q156 240 168 220Z')
    + collar('M191 205 Q214 212 247 205 L248 219 Q226 223 204 229 Q194 222 189 219Z') + line('M204 214 V228', TINK, 2)
    + cape('M203 227 Q196 219 192 214 Q180 216 172 222 Q162 232 158 245 Q155 254 157 257 Q186 263 213 266 Q207 246 203 227Z', `${tag}a`, 262)
    + cape('M205 227 Q218 216 240 212 Q262 210 274 216 Q281 230 279 258 Q248 264 215 266 Q208 246 205 227Z', `${tag}b`, 262)
    + strap('M238 213 Q268 222 278 262')
    + beltBand(155, 282, 286) + buckle(197, 297, 24, 21)
    + (mirror ? '' : pouch(208, 297)),
  // 2 left: the book's fore-edge (pages between the covers) in the holder on the back.
  (mirror, tag) => bookEdge(186, 216, 232, 276, 7)
    + holder(192, 240, 271, 330, 2.5)
    + neck('M142 196 H176 V216 H142Z')
    + tunic('M120 222 Q150 214 188 222 Q196 250 194 290 L196 342 Q153.5 349 111 342 L114 290 Q112 250 120 222Z')
    + collar('M138 207 Q158 203 180 207 L182 221 Q160 225 140 221Z')
    + cape('M128 220 Q152 214 182 220 Q194 238 188 262 Q156 268 120 264 Q114 244 128 220Z', tag, 258)
    + strap('M140 222 Q184 210 196 240 Q202 256 202 272')
    + beltBand(111, 195, 285, 0) + P('M104 283 h12 v17 h-12Z', grad('gold'), 'var(--goldDark)', 1.8)
    + (mirror ? '' : pouch(138, 296, 30, 40)),
  // 3 back-left: the cover (with the emblem) and the fore-edge on its left, in the holder.
  (mirror, tag) => neck('M88 194 H120 V214 H88Z')
    + tunic('M70 218 Q120 208 170 216 Q182 250 180 290 L182 342 Q121 349 60 342 L62 290 Q60 250 70 218Z')
    + collar('M82 203 Q105 197 130 203 L130 216 Q105 212 82 218Z')
    + cape('M62 228 Q84 214 110 216 L176 218 Q186 232 184 252 Q140 262 60 262 Q54 244 62 228Z', tag, 256)
    + (mirror ? '' : pouch(52, 296, 20, 38))
    + strap('M76 222 Q100 234 106 272')
    + P('M108 222 Q108 216 114 216 H130 V276 H108Z', grad('book'), TINK) + P('M112 219 H128 V276 H112Z', 'var(--paper)', '#b9a57c', 1.2)
    + line('M116 222 V274 M120.5 222 V274 M125 222 V274', '#dccca6', .9)
    + bookCover(125, 213, 197, 276, 161, 246, .82, .9)
    + holder(105, 199, 270, 331),
  // 4 back: the navy cover with the gold open-book emblem; the holder covers only its lower part.
  (mirror, tag) => neck('M284 180 H326 V206 H284Z')
    + tunic('M240 216 Q305 206 370 216 Q388 250 386 290 L388 342 Q305 349 222 342 L224 290 Q222 250 240 216Z')
    + collar('M276 193 Q305 189 334 193 L336 208 Q305 204 274 208Z')
    + cape('M240 214 Q305 200 370 214 Q390 230 386 256 Q305 266 224 256 Q220 230 240 214Z', tag, 250)
    + beltBand(222, 388, 286)
    + bookCover(255, 200, 355, 276, 305, 236, 1.05)
    + holder(252, 358, 262, 330),
];

// ---------------------------------------------------------------- sheet
export function hero2Markup(direction, part = 'combined') {
  const index = DIRECTIONS.indexOf(direction);
  if (index < 0) throw Error(`Unknown direction: ${direction}`);
  if (!['combined', 'head', 'torso'].includes(part)) throw Error(`Unknown part: ${part}`);
  const mirror = index > 4, view = mirror ? 8 - index : index, tag = `${index}`;
  const head = part === 'torso' ? '' : HEADS[view](`h${tag}`);
  const torso = part === 'head' ? '' : TORSOS[view](mirror, `t${tag}`);
  const content = `<g transform="translate(${(ART_CENTER - K * TUNIC_CENTER[view]).toFixed(3)} ${TOP.toFixed(3)}) scale(${K})">${torso}${head}</g>`;
  // Mirror about the art centre so the tunic stays on u = .494 in the right-facing views too.
  return mirror ? `<g transform="translate(${(2 * ART_CENTER).toFixed(3)} 0) scale(-1 1)">${content}</g>` : content;
}
export const buildHero2Sheet = (options = {}) => buildSheet(options, DEFAULT_PALETTE, DEFS, hero2Markup);

// For the comparison tools: one view in reference-cell coordinates (no scaling).
export function hero2Local(view, { mirror = false, part = 'combined' } = {}) {
  const head = part === 'torso' ? '' : HEADS[view](`lh${view}`), torso = part === 'head' ? '' : TORSOS[view](mirror, `lt${view}`);
  return torso + head;
}
export const HERO2_LAYOUT = Object.freeze({ scale: K, artCenter: ART_CENTER, top: TOP, tunicCenter: TUNIC_CENTER, defs: DEFS, palette: DEFAULT_PALETTE });
