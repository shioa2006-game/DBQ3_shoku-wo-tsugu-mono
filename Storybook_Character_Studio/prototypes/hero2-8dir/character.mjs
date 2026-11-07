import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
import { definitions, clipped, buildSheet } from '../shared/humanoid-kit.mjs';
export { DIRECTIONS, LABELS };

// 主人公シオンの新デザイン案・試作03。頭（顔・髪）は試作02のまま（正本は8方向の設定画
// references/hero-redesign-8dir-v2.png）。胴は試作03で「生成りの服＋紺のベスト」と深緑の職業の書に
// 改めた（正本は references/hero-redesign-8dir-v3.png。02と同じ位置・大きさで描かれている）。
// 各向きの形は、設定画の各セル（443.5px四方）の座標で書き、セル128pxへ縮小して置く（設定画の画素は使わない）。
// 頭（髪・顔・耳）と胴（首・襟・生成りの服・紺のベスト・ベルト・小物入れ・背中のホルダーと職業の書）を分ける。
// 腕・脚・手・足はゲームの3Dリグが描く（紺の袖・素手・焦げ茶のズボン・茶色のブーツ）。
// 試作02の出力は v02/ に保存してある（比較用、再生成しない）。
//
// view: 0=正面 1=左斜め前 2=左 3=左斜め後 4=背面。右側の3方向は左側を反転する。
// 左右非対称なのは左腰の小物入れだけで、反転した向きでは向こう側として描き分ける。
// 斜め後ろの頭は、設定画の右斜め後ろ（耳と頬だけが見える）を基にする。設定画の左斜め後ろは
// 横顔（目・口）まで見えていて真横とほぼ同じになるため、回転のつながりを優先した。

export const DEFAULT_PALETTE = Object.freeze({
  ink: '#3a2212',
  skin: '#fde0c4', skinLight: '#fff1e2', skinDark: '#efb995',
  hair: '#f8b646', hairLight: '#ffd77e', hairDark: '#d98f2c',
  vest: '#293d75', vestLight: '#34497f', vestDark: '#1a2652',
  shirt: '#f1e3c4', shirtLight: '#fbf4e4', shirtDark: '#d8c49b',
  pack: '#805536', packLight: '#a2714a', packDark: '#55361f',
  belt: '#6e4224', gold: '#d6aa51', goldLight: '#f3d78f', goldDark: '#94701f',
  book: '#365c47', bookLight: '#437056', bookDark: '#203b31',
  paper: '#f4e8cc',
});
const EXTRA = `<linearGradient id="hairU" gradientUnits="userSpaceOnUse" x1="0" y1="25" x2="0" y2="205"><stop stop-color="var(--hairLight)"/><stop offset=".22" stop-color="var(--hair)"/><stop offset=".75" stop-color="var(--hair)"/><stop offset="1" stop-color="var(--hairDark)"/></linearGradient>
  <linearGradient id="iris2" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#14306e"/><stop offset=".48" stop-color="#2f78d6"/><stop offset="1" stop-color="#8fd2ff"/></linearGradient>`;
const DEFS = definitions(['vest', 'shirt', 'pack', 'gold', 'book'], EXTRA);

// Reference cell -> game cell. Every view keeps the same scale; the tunic centre lands on the
// rig's art centre (u = .494) so the 3D arms and legs attach under the drawn body.
const K = .345;
const ART_CENTER = 128 * .494;
const TOP = 6.5 - K * 12;
const TUNIC_CENTER = [305, 218, 153, 121, 305];

const INK = '#3a2212';      // hair, skin
const TINK = '#141a3a';     // vest
const SINK = '#6a5534';     // shirt collar
const BINK = '#10211a';     // book
const PINK = '#3e2210';     // leather
const HAIR_LINE = '#7a3f12';  // lock lines inside the hair (dark brown, thinner than the outline)
const W = 3;                // outline width in reference pixels (about 1px in the game cell)

const P = (d, fill, stroke = INK, w = W, extra = '') => path(d, fill, stroke, w, extra);
const f1 = n => (+n.toFixed(1)).toString();

// ---------------------------------------------------------------- hair
// The hair is authored from the design sheet's own outlines: the silhouette, the bangs over the face and
// the main lines between locks were measured on each cell (local coordinates) and are drawn here as
// smooth curves. Points flagged 'c', and points where the line turns sharply (the tips of locks), stay
// corners, so each lock keeps its pointed, upturned tip.
function smooth(pts, { close = false, corner = 62 } = {}) {
  const n = pts.length, at = i => pts[close ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  const turn = i => {
    const [a, b, c] = [at(i - 1), at(i), at(i + 1)];
    const ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1], l = Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1;
    return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / l))) * 180 / Math.PI;
  };
  const sharp = i => at(i)[2] === 'c' || (!close && (i <= 0 || i >= n - 1)) || turn(i) > corner;
  const tangent = i => {
    if (sharp(i)) return [0, 0];
    const a = at(i - 1), c = at(i + 1), l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
    return [(c[0] - a[0]) / l, (c[1] - a[1]) / l];
  };
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const a = at(i), b = at(i + 1), L = Math.hypot(b[0] - a[0], b[1] - a[1]) / 3, ta = tangent(i), tb = tangent(i + 1);
    d += ` C${f1(a[0] + ta[0] * L)} ${f1(a[1] + ta[1] * L)} ${f1(b[0] - tb[0] * L)} ${f1(b[1] - tb[1] * L)} ${f1(b[0])} ${f1(b[1])}`;
  }
  return close ? d + 'Z' : d;
}
// A line between two locks: the shade the upper lock casts on the one below (just under the line),
// then the dark line, thin over its whole length and thicker over the middle (it tapers at both ends).
const shade = d => line(d, 'var(--hairDark)', 7).replace('/>', ' opacity=".32" transform="translate(0 2.5)"/>');
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function lockLine(pts) {
  const d = smooth(pts);
  if (pts.length < 3) return shade(d) + line(d, HAIR_LINE, 2);
  const mid = pts.length === 3 ? [lerp(pts[0], pts[1], .45), pts[1], lerp(pts[2], pts[1], .45)] : pts.slice(1, -1);
  return shade(d) + line(d, HAIR_LINE, 1.4) + line(smooth(mid), HAIR_LINE, 2.6);
}
const lockLines = lines => lines.map(lockLine).join('');
// Highlights: a broken band of light streaks around the crown, each streak tapering away from it along
// the hair flow (the jagged "ring" highlight of the design sheet).
function sheenBand([cx, cy], rx, ry, a0, a1, count = 7, drop = 9) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const t0 = a0 + (a1 - a0) * (i + .12) / count, t1 = a0 + (a1 - a0) * (i + .88) / count, tm = (t0 + t1) / 2;
    const pt = (t, r = 1) => [cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r];
    const [x0, y0] = pt(t0), [x1, y1] = pt(t1), [xm, ym] = pt(tm, 1 + drop * (i % 2 ? .8 : 1.15) / ry);
    s += P(`M${f1(x0)} ${f1(y0)} Q${f1((x0 + x1) / 2)} ${f1((y0 + y1) / 2 - 2)} ${f1(x1)} ${f1(y1)} L${f1(xm)} ${f1(ym)}Z`, 'var(--hairLight)', 'none', 0, 'opacity=".7"');
  }
  return s;
}
// The hair mass: the measured silhouette (from the lower left, over the top and the ahoge, to the lower
// right), straight hidden segments under the face or the ear, and the visible lower edge (`nape`).
function hairMass(tag, view, { outline, hidden = [], nape = [], lines = [], sheen = '' }) {
  outline = FIT[view](outline); nape = FIT[view](nape); lines = lines.map(FIT[view]);
  const top = smooth(outline);
  const last = hidden.length ? hidden[hidden.length - 1] : outline[outline.length - 1];
  const bottom = nape.length ? smooth([last, ...nape, outline[0]]) : '';
  const d = top + hidden.map(([x, y]) => ` L${x} ${y}`).join('') + (bottom ? bottom.replace(/^M\S+ \S+/, '') : '') + 'Z';
  return P(d, grad('hairU'), 'none', 0) + clipped(`hero2-hm-${tag}`, d, sheen + lockLines(lines))
    + line(top, INK, W) + (bottom ? line(bottom, INK, W) : '');
}
// Bangs over the face: the measured lower edge, closed over the scalp without an outline. The lock lines
// are drawn again inside them (the bangs cover the mass).
function fringe(tag, edge, closeBack, lines = [], sheen = '') {
  const e = smooth(edge);
  const region = `${e} ${closeBack}Z`;
  return P(region, grad('hairU'), 'none', 0) + clipped(`hero2-fr-${tag}`, region, sheen + lockLines(lines)) + line(e, INK, W);
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
const PI = Math.PI;
// Fit the measured hair into the rig's head window (cell x 19.7-106.8, y 5.8-76.8): the ahoge's top
// (above y 30) is drawn 85% as tall in every view, and the back hair of the front-left view (behind x 300)
// and of the profile (behind x 215) is drawn less deep.
const fitter = (x0 = Infinity, k = 1) => pts => pts.map(([x, y, ...f]) => [x > x0 ? x0 + (x - x0) * k : x, y < 30 ? 30 - (30 - y) * .85 : y, ...f]);
const FIT = [fitter(), fitter(300, .85), fitter(215, .72), fitter(), fitter()];

const HEADS = [
  // 0 front. The face is a little wider than in the first drawing of this prototype (cheeks and jaw as
  // in the design sheet), and the eyes sit farther apart, the iris on the inner side of each white.
  tag => {
    const lines = [
      [[392, 85], [381, 92], [376, 91], [366, 87], [353, 71], [341, 61], [331, 58], [321, 58]],
      [[233, 133], [232, 148], [224, 151], [220, 150], [225, 140], [228, 120], [231, 112]],
      [[400, 127], [385, 129], [381, 125], [366, 88]],
      [[341, 83], [351, 97], [360, 129]],
      [[249, 133], [250, 113], [253, 103], [265, 85], [269, 82]],
      [[267, 62], [271, 59], [286, 54], [301, 52], [309, 55], [315, 55]],
      [[374, 134], [374, 144], [382, 150]],
      [[266, 110], [273, 96], [276, 97], [282, 77]],
      [[280, 75], [284, 74], [290, 66], [299, 59]],
      [[202, 113], [205, 116], [210, 117], [212, 121], [223, 117]],
      [[324, 68], [326, 73], [330, 75], [328, 78], [331, 92]],
      [[363, 168], [368, 159], [368, 154], [372, 150], [376, 149]],
      [[308, 35], [315, 40], [315, 45]],
      [[209, 146], [213, 142], [214, 138], [215, 121]],
      [[247, 78], [232, 81], [231, 84]],
    ];
    return hairMass(tag, 0, {
      outline: [[237, 189.5], [224, 183], [227, 177], [220, 172], [219, 163], [217, 161], [212, 161], [206, 158], [200.5, 152], [197.5, 146.5], [197.5, 144.5], [204.5, 145], [210.5, 141], [208.5, 136.5], [208.5, 128.5], [210.5, 125.5], [203.5, 122.5], [196.5, 115.5], [193.5, 107.5], [194.5, 102], [196.5, 101], [199.5, 104], [209.5, 103.5], [214.5, 100], [221.5, 87], [225.5, 84], [219.5, 79], [214.5, 70.5], [214.5, 58.5], [217.5, 52.5], [219.5, 56.5], [224.5, 60.5], [235.5, 62.5], [245.5, 58.5], [262, 47], [276.5, 41.5], [299, 40.5], [306, 42.5], [306.5, 40.5], [302, 35.5], [285.5, 30.5], [268.5, 32.5], [257, 39], [260, 30.5], [273.5, 18.5], [285.5, 14.5], [296, 13.5], [309, 15.5], [321.5, 21.5], [330.5, 32.5], [332, 46], [345, 46], [356, 50], [369.5, 61.5], [379.5, 74.5], [391.5, 73], [397.5, 67.5], [399.5, 71.5], [398.5, 84], [396.5, 88], [387.5, 95], [387.5, 97], [393.5, 111.5], [398.5, 116.5], [402.5, 118.5], [410.5, 116.5], [406.5, 127.5], [400.5, 133.5], [393.5, 136.5], [394.5, 146], [392.5, 150], [397.5, 153], [401.5, 152], [401.5, 155], [394, 163], [383, 167], [383, 173], [371, 184], [371, 189], [365, 191.5], [358, 191.5]],
      hidden: [[340, 199], [270, 199]],
      lines,
    })
      + ear('M244 160 C234 152 222 160 224 174 C226 188 238 194 248 188Z', 'M240 167 Q231 172 236 183')
      + ear('M364 160 C374 152 386 160 384 174 C382 188 370 194 360 188Z', 'M368 167 Q377 172 372 183')
      + skin('M247 104 C240 128 239 160 245 181 C250 196 292 209 305 209 C318 209 360 196 365 181 C371 160 370 128 363 104 Q305 92 247 104Z')
      + blush(255, 184, 9.5, 5) + blush(355, 184, 9.5, 5)
      + eye(273, 157, 31, 34, { inner: 1, tag: `${tag}a` }) + eye(337, 157, 31, 34, { inner: -1, tag: `${tag}b` })
      + brow('M259 121 Q272 114 286 118') + brow('M324 118 Q338 114 351 121')
      + line('M302 171 Q305 174 302 177', 'var(--skinDark)', 1.8) + mouth('M290 185 Q305 195 320 185')
      + fringe(tag, [[247, 171, 'c'], [250, 160], [253, 141], [256, 133, 'c'], [262, 121], [268, 112], [272, 108, 'c'], [277, 118], [281, 128],
        [287, 137, 'c'], [292, 135], [297, 139], [303, 146], [309, 151, 'c'], [312, 140], [315, 131], [321, 128], [327, 121], [332, 110, 'c'],
        [339, 112], [346, 121], [350, 131], [354, 142], [357, 155], [358, 167, 'c'], [363, 158], [368, 150]],
      'L372 140 L378 96 Q342 58 305 56 Q266 58 236 96 L241 150', lines.map(FIT[0]), sheenBand([305, 40], 60, 50, PI * .86, PI * .14, 7, 10));
  },
  // 1 front-left. The far cheek and the chin come out to the design sheet's width.
  tag => {
    const lines = [
      [[234, 64], [233, 69], [238, 83], [244, 96], [252, 106], [263, 114], [268, 115], [282, 114], [291, 110]],
      [[157, 120], [159, 100], [165, 85], [178, 68], [187, 62]],
      [[225, 108], [230, 116], [243, 123], [263, 125], [267, 122], [267, 118]],
      [[298, 117], [302, 125], [305, 140], [304, 150], [307, 152], [311, 151]],
      [[229, 56], [209, 54], [199, 56], [189, 61]],
      [[297, 180], [282, 163], [282, 155], [279, 150]],
      [[288, 133], [295, 158], [299, 161], [303, 158], [304, 153]],
      [[264, 143], [274, 143], [281, 135], [271, 133], [263, 126]],
      [[268, 184], [272, 188], [281, 185], [287, 172]],
      [[224, 29], [235, 39], [237, 44]],
      [[328, 94], [325, 98], [313, 104], [303, 101]],
      [[187, 104], [184, 124]],
      [[312, 128], [317, 137], [322, 137], [334, 132]],
      [[167, 110], [167, 125], [171, 133]],
      [[205, 76], [204, 98]],
      [[279, 70], [294, 72], [300, 75]],
    ];
    return hairMass(tag, 1, {
      outline: [[153, 164], [147, 163], [139, 158], [144, 156], [147, 153], [148.5, 149], [145.5, 145], [142.5, 146], [139.5, 143.5], [135.5, 131.5], [135.5, 122.5], [137.5, 116.5], [127.5, 109.5], [124.5, 103], [124.5, 99], [128.5, 101], [134.5, 101], [138.5, 99], [150.5, 85], [142.5, 75], [142.5, 64.5], [144.5, 60.5], [145.5, 59.5], [150.5, 65.5], [161.5, 66.5], [168.5, 63.5], [183, 51], [200, 44], [218.5, 43.5], [231.5, 47.5], [231, 42.5], [224.5, 34.5], [210.5, 28.5], [197, 28], [190, 30], [182, 35], [177, 41], [177, 35], [181, 27], [186, 22], [199.5, 15.5], [211.5, 12.5], [221.5, 12.5], [235, 15.5], [243, 19.5], [249.5, 26.5], [253.5, 35.5], [251.5, 45.5], [252.5, 47.5], [264, 46.5], [284, 54], [290, 54], [296.5, 51], [300, 48], [301, 43], [304, 44], [307.5, 52.5], [307.5, 59.5], [304.5, 67.5], [300.5, 72.5], [314.5, 86], [324.5, 85], [328.5, 82], [330.5, 77], [332.5, 79], [334.5, 88], [333.5, 95], [328.5, 103], [320.5, 108.5], [323.5, 112.5], [324.5, 120.5], [327.5, 123.5], [336.5, 124.5], [339.5, 121.5], [341.5, 122.5], [341.5, 128.5], [338.5, 135.5], [330.5, 142], [322, 145], [318, 159], [321, 162], [329, 161], [327, 167], [317, 175], [304, 175], [302, 180], [296, 185.5], [288.5, 189.5], [291.5, 193.5], [294.5, 193.5], [292.5, 196.5], [286.5, 198.5], [275.5, 197.5], [272.5, 202.5], [262.5, 202.5], [259.5, 204.5]],
      hidden: [[240, 206], [170, 196]],
      lines,
    })
      + skin('M157 104 C148 130 147 160 153 181 C160 199 178 208 199 208 C221 208 241 200 254 186 C262 170 264 140 260 104 Q208 92 157 104Z')
      + ear('M255 158 C262 148 278 151 278 168 C278 185 266 193 253 186Z', 'M262 161 Q271 167 266 180')
      + blush(223, 179, 9, 5) + blush(158, 177, 5, 4)
      + eye(165, 153, 17, 30, { inner: 1, tag: `${tag}a` }) + eye(212, 155, 32, 34, { inner: -1, tag: `${tag}b` })
      + brow('M158 121 Q165 117 173 118') + brow('M198 118 Q212 112 227 117')
      + line('M180 170 Q176 173 179 176', 'var(--skinDark)', 1.8) + mouth('M169 185 Q181 194 194 186')
      + fringe(tag, [[152, 163, 'c'], [157, 148], [159, 135], [160, 125, 'c'], [168, 128], [178, 138], [186, 146, 'c'], [189, 134], [194, 121],
        [200, 110], [204, 101, 'c'], [214, 104], [222, 113], [228, 126], [232, 143], [233, 158], [231, 167, 'c'], [238, 160], [245, 151], [252, 144], [262, 140]],
      'L272 122 L282 84 Q262 56 236 56 Q190 58 156 90 L146 132', lines.map(FIT[1]), sheenBand([222, 40], 58, 50, PI * .9, PI * .2, 7, 10));
  },
  // 2 left (profile)
  tag => {
    const lines = [
      [[151, 86], [151, 96], [154, 105], [169, 122], [186, 128], [196, 126], [207, 121]],
      [[186, 63], [183, 77], [191, 95], [204, 105], [218, 107]],
      [[241, 118], [245, 131], [246, 146], [244, 161], [240, 163], [237, 161]],
      [[207, 135], [214, 152], [218, 154], [220, 159], [224, 160], [226, 155], [226, 143]],
      [[133, 78], [127, 90], [125, 100], [120, 103], [112, 114]],
      [[187, 185], [194, 193], [204, 189], [204, 179], [200, 175], [195, 164]],
      [[181, 28], [191, 35], [195, 41], [196, 46]],
      [[185, 56], [180, 54], [165, 55], [155, 57], [144, 64]],
      [[245, 93], [259, 105], [264, 106], [278, 100]],
      [[231, 194], [231, 189], [227, 180], [217, 168], [216, 160]],
      [[266, 169], [256, 165], [259, 150], [263, 143]],
      [[150, 124], [164, 130], [176, 129]],
      [[241, 191], [241, 186], [222, 162]],
      [[229, 74], [213, 60], [208, 57], [201, 56]],
      [[260, 130], [265, 140], [268, 141], [283, 137]],
      [[248, 186], [236, 176], [243, 164]],
    ];
    return hairMass(tag, 2, {
      outline: ([[87.5, 116.5], [79.5, 111.5], [75.5, 105], [75.5, 101], [78.5, 103], [86.5, 102], [93.5, 96], [99.5, 86], [103.5, 83], [99.5, 79], [96.5, 70.5], [96.5, 66.5], [100.5, 58.5], [100.5, 60.5], [104.5, 64.5], [114.5, 66.5], [125.5, 62.5], [141.5, 50], [156, 44], [179.5, 43.5], [189.5, 47.5], [191.5, 46.5], [189.5, 41.5], [182.5, 34.5], [165, 27.5], [153, 27], [145, 29], [137, 33], [130, 40], [130, 35], [133, 29], [141, 21], [150, 16], [164.5, 12.5], [181.5, 12.5], [194, 15.5], [202, 19.5], [210, 27.5], [212.5, 34.5], [211.5, 47.5], [226, 48.5], [242, 56], [251, 56], [255, 54], [261, 47], [264.5, 54.5], [264.5, 60.5], [261.5, 68.5], [255.5, 75.5], [269.5, 88], [279.5, 87], [284.5, 82], [286.5, 85], [286.5, 95], [283.5, 101], [277.5, 106.5], [270.5, 109.5], [276.5, 124.5], [281.5, 127.5], [287.5, 127.5], [292.5, 124.5], [292.5, 130.5], [288.5, 138.5], [282, 144], [274, 146], [272, 148], [272, 154], [269, 160], [273, 164], [277, 164], [279, 162], [280, 164], [276, 171], [268, 176], [254, 175.5], [249.5, 184.5], [252.5, 187.5], [256.5, 187.5], [252.5, 192.5], [242.5, 195.5], [233.5, 192.5], [230.5, 195.5], [236.5, 199.5], [230.5, 203.5], [219, 202.5], [217, 206.5], [214, 207.5], [206, 207.5], [199, 204.5], [198, 207.5], [196, 207.5]]),
      hidden: [[176, 192], [140, 150], [108, 128]],
      lines,
      sheen: sheenBand([190, 46], 56, 46, PI * .95, PI * .1, 7, 9),
    })
      + skin('M106 112 Q100 128 99 144 Q98 158 93 167 Q94 172 99 175 Q98 184 104 192 Q112 204 128 208 Q150 212 168 206 Q184 196 186 170 Q186 130 170 108 Q140 98 106 112Z')
      + ear('M170 160 C174 149 191 151 192 168 C193 186 180 194 167 188Z', 'M177 162 Q186 168 182 180')
      + blush(131, 180, 8, 4.5)
      + eye(118, 158, 22, 36, { inner: -1, tag: `${tag}a` })
      + brow('M106 125 Q115 120 125 123') + mouth('M101 186 Q106 190 112 187')
      + fringe(tag, [[88, 116, 'c'], [95, 121], [101, 125, 'c'], [106, 116], [111, 109, 'c'], [115, 116], [118, 124, 'c'], [122, 115], [128, 106, 'c'], [134, 120], [140, 136],
        [145, 152], [147, 168, 'c'], [150, 150], [153, 133, 'c'], [160, 145], [166, 157, 'c'], [169, 150], [172, 145, 'c'], [179, 147], [186, 152, 'c'], [190, 140]],
      'L204 130 L214 90 Q196 54 150 56 Q112 62 96 88 L84 108', lines.map(FIT[2]));
  },
  // 3 back-left: drawn in the coordinates of the reference's back-right cell and mirrored
  // (its tunic centre 234 lands on this view's tunic centre 121).
  tag => {
    const inner = hairMass(tag, 3, {
      outline: [[191.5, 187.5], [185.5, 183.5], [178.5, 181.5], [177.5, 179.5], [182.5, 176.5], [182.5, 173.5], [176, 170.5], [173, 165], [164, 165], [156, 160], [155, 156], [158, 156], [162, 153], [160, 145], [148, 141], [140.5, 131.5], [140.5, 129.5], [148.5, 130], [152.5, 127], [153.5, 114.5], [141.5, 107.5], [137.5, 98.5], [137.5, 92], [138.5, 91], [143.5, 95], [153.5, 94], [159.5, 89], [163.5, 81], [172.5, 73], [166.5, 68.5], [163.5, 61.5], [163.5, 53.5], [166.5, 47.5], [171.5, 54.5], [180.5, 56.5], [186.5, 55], [199, 46], [211.5, 44.5], [210.5, 33.5], [213.5, 26.5], [222, 16.5], [228, 13.5], [236, 10.5], [260.5, 11.5], [275, 18], [282, 27], [281, 29], [269, 24], [251.5, 25.5], [242.5, 30.5], [237, 36.5], [237.5, 37.5], [247.5, 34.5], [264, 34], [272, 36], [286, 43], [298.5, 53.5], [307.5, 56.5], [317.5, 55.5], [321.5, 53.5], [324.5, 48.5], [326.5, 50.5], [328.5, 61.5], [326.5, 67], [320.5, 74], [327.5, 79], [335.5, 89], [338.5, 97], [338.5, 107.5], [334.5, 113.5], [332.5, 104.5], [328.5, 104.5], [329.5, 117.5], [324.5, 131.5]],
      hidden: [[306, 128], [290, 152], [280, 190]],
      nape: [[273, 193, 'c'], [265, 190], [250, 190], [244, 192, 'c'], [238, 189], [230, 192], [223, 192, 'c'], [216, 189], [203, 187]],
      lines: [
        [[241, 126], [233, 149], [232, 159], [236, 168], [245, 169], [255, 166], [255, 161], [249, 152], [251, 137], [254, 131]],
        [[208, 80], [201, 97], [202, 112], [204, 117], [214, 124], [217, 124]],
        [[217, 142], [215, 146], [215, 156], [208, 164], [203, 164], [201, 144], [193, 137], [186, 127]],
        [[175, 119], [174, 134], [178, 147], [177, 149], [172, 149], [169, 147], [160, 135], [161, 128]],
        [[259, 141], [260, 146], [264, 145], [273, 134], [269, 130], [280, 122], [277, 114], [286, 110]],
        [[285, 67], [288, 70], [293, 88], [290, 106], [287, 108]],
        [[278, 57], [275, 53], [255, 46], [235, 50], [230, 49]],
        [[266, 71], [267, 86], [264, 96], [254, 107], [246, 108]],
        [[191, 181], [191, 176], [197, 167], [197, 163], [192, 161], [179, 150]],
        [[305, 90], [311, 103], [311, 118], [314, 120]],
        [[180, 99], [178, 108], [179, 118], [184, 126]],
        [[207, 169], [217, 173], [232, 174], [236, 171]],
        [[248, 109], [250, 113], [257, 117], [266, 118], [275, 116]],
        [[241, 185], [244, 183], [244, 170]],
        [[239, 28], [230, 36]],
        [[293, 130], [288, 133], [278, 133], [270, 138]],
      ],
      sheen: sheenBand([238, 46], 58, 46, PI * .92, PI * .12, 7, 9),
    })
      + skin('M296 128 Q318 120 322 140 Q326 168 314 186 Q300 196 280 194 L286 150Z')
      + ear('M299 146 C291 135 272 139 271 157 C270 176 285 185 297 177Z', 'M287 149 Q278 158 284 171');
    return `<g transform="translate(355 0) scale(-1 1)">${inner}</g>`;
  },
  // 4 back: a round lock from the crown, the locks hanging over the nape, and the ears below the hair.
  tag => {
    const earL = ear('M248 150 C240 144 229 151 230 164 C231 177 240 182 249 177Z', 'M244 155 Q236 162 242 172');
    const earR = ear('M362 150 C370 144 381 151 380 164 C379 177 370 182 361 177Z', 'M366 155 Q374 162 368 172');
    return hairMass(tag, 4, {
      outline: [[258.5, 187.5], [258.5, 181.5], [255.5, 178.5], [238, 175], [238, 171], [229, 164], [227, 157], [216, 156], [207.5, 150], [203.5, 143.5], [209.5, 144.5], [216.5, 139.5], [214.5, 135.5], [214.5, 129.5], [216.5, 125.5], [202.5, 117.5], [198.5, 110.5], [197.5, 103], [205.5, 106], [213.5, 104], [217.5, 101], [221.5, 92], [225.5, 88], [217.5, 82], [213.5, 75], [212.5, 65.5], [216.5, 58.5], [217.5, 62.5], [220.5, 65.5], [227.5, 67.5], [232.5, 66.5], [250, 49], [262, 43], [277, 42.5], [278.5, 29.5], [286.5, 19.5], [296, 13.5], [309, 10.5], [322.5, 11.5], [334.5, 15.5], [347, 26.5], [349, 31], [348, 32], [336.5, 26.5], [320.5, 26.5], [311, 29.5], [304, 35.5], [305, 36.5], [311, 34.5], [329.5, 34.5], [337, 36.5], [352, 43], [369.5, 60.5], [372.5, 61.5], [382.5, 60.5], [390.5, 53.5], [394.5, 61.5], [394.5, 69.5], [390.5, 78], [382.5, 85], [393.5, 100], [401.5, 102], [409.5, 99], [407.5, 107.5], [404.5, 112.5], [397.5, 118.5], [389.5, 121.5], [389.5, 135.5], [396.5, 138.5], [401.5, 137.5], [401.5, 140.5], [397.5, 147], [388, 153], [381, 154], [379, 162], [368, 172], [370, 174], [353.5, 176.5], [349.5, 180.5], [352.5, 185.5], [348.5, 187.5]],
      nape: [[337, 190], [331, 187], [329, 192, 'c'], [316, 190], [308, 194, 'c'], [300, 193], [295, 190], [282, 192, 'c'], [276, 189], [262, 189]],
      lines: [
        [[276, 118], [266, 113], [263, 108], [261, 83], [264, 73], [277, 55], [287, 51]],
        [[329, 115], [333, 113], [339, 104], [340, 89], [338, 79], [334, 69], [328, 61], [313, 48]],
        [[351, 172], [343, 164], [345, 155], [344, 150], [340, 146], [347, 121], [345, 106], [341, 98]],
        [[367, 96], [374, 107], [374, 134], [372, 143], [374, 146], [391, 146]],
        [[287, 71], [287, 91], [294, 110], [304, 121], [315, 126]],
        [[299, 142], [298, 158], [286, 169], [289, 173], [294, 175], [301, 170]],
        [[269, 184], [272, 170], [262, 167], [255, 160], [253, 151], [256, 153], [257, 148], [254, 144]],
        [[263, 117], [265, 131], [270, 144], [268, 148]],
        [[218, 149], [223, 150], [231, 144], [233, 135], [230, 115]],
        [[248, 112], [247, 122], [249, 132], [251, 136], [256, 137], [256, 142]],
        [[284, 150], [286, 155], [286, 165], [283, 168], [275, 160], [269, 149]],
        [[277, 120], [293, 131], [303, 131], [313, 128]],
        [[330, 47], [320, 46], [300, 50]],
        [[387, 73], [375, 81], [365, 80], [360, 77]],
        [[391, 140], [384, 126], [385, 116], [382, 115]],
        [[221, 79], [234, 85], [248, 79]],
      ],
      sheen: sheenBand([300, 46], 64, 46, PI * .92, PI * .08, 8, 9),
    })
      + earL + earR
      + P('M226 138 Q236 152 250 150 Q246 140 238 136Z', grad('hairU'), INK, 2.2) + P('M384 138 Q374 152 360 150 Q364 140 372 136Z', grad('hairU'), INK, 2.2);
  },
];

// ---------------------------------------------------------------- torso parts
// Prototype 03: a cream shirt under a navy vest (no capelet). The vest's two front panels run straight down
// and the shirt shows between them; the navy 3D sleeves meet the navy vest at the shoulder, so no
// cream cloth lies between arm and body. A small cream stand collar; the book holder's leather straps
// run over the shoulders.
const vest = d => P(d, grad('vest'), TINK);
const shirt = d => P(d, grad('shirt'), 'none', 0);
// Shade the vest's sides (the body turning away) inside its outline.
const vestShade = (tag, body, bands) => clipped(`hero2-vs-${tag}`, body, bands.map(d => P(d, 'var(--vestDark)', 'none', 0, 'opacity=".45"')).join(''));
// The shirt between the vest panels: the cream panel, the panels' front edges (dark line + light rim).
function opening(tag, body, panel, edges) {
  return clipped(`hero2-sh-${tag}`, body, shirt(panel)
    + edges.map(([d, rim]) => line(rim, 'var(--vestLight)', 1.6) + line(d, TINK, 2.4)).join(''));
}
const neck = d => P(d, grad('skin'), INK, 2.4);
const collar = d => P(d, grad('shirt'), SINK, 2.4);
function beltBand(x0, x1, y, sag = 3) {
  return P(`M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y} L${x1} ${y + 13} Q${(x0 + x1) / 2} ${y + 13 + sag * 2} ${x0} ${y + 13}Z`, 'var(--belt)', PINK, 2.4)
    + line(`M${x0 + 2} ${y + 3} Q${(x0 + x1) / 2} ${y + 3 + sag * 2} ${x1 - 2} ${y + 3}`, '#9a6438', 1);
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
// Open-book emblem of the Book of Jobs, in gold line on the deep green cover.
function emblem(x, y, s = 1, sx = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s * sx} ${s})">`
    + line('M-2 -9 Q-11 -14 -21 -11 L-21 9 Q-11 6 -2 11 Z M2 -9 Q11 -14 21 -11 L21 9 Q11 6 2 11 Z M-25 -6 L-25 13 Q-12 10 0 15 Q12 10 25 13 L25 -6', 'var(--gold)', 2.8 / s)
    + '</g>';
}
// The thick hardcover book. The cover (deep green, darker rim, small gold corner fittings and the gold
// emblem); `top` shows the page block's top edge above the cover (seen from behind and above).
function bookCover(x0, y0, x1, y1, ex, ey, es = 1, sx = 1, top = false) {
  const corners = line(`M${x0 + 4} ${y0 + 13} V${y0 + 4} H${x0 + 13} M${x1 - 13} ${y0 + 4} H${x1 - 4} V${y0 + 13}`, 'var(--gold)', 1.8);
  return (top ? P(`M${x0 + 5} ${y0 - 5} H${x1 - 5} V${y0 + 4} H${x0 + 5}Z`, 'var(--paper)', '#a8946a', 1.4) : '')
    + P(`M${x0} ${y0 + 6} q0 -6 6 -6 h${x1 - x0 - 12} q6 0 6 6 V${y1} H${x0}Z`, grad('book'), BINK)
    + P(`M${x0 + 4} ${y0 + 8} q0 -4 4 -4 h${x1 - x0 - 16} q4 0 4 4 V${y1} H${x0 + 4}Z`, 'none', 'var(--bookDark)', 1.6)
    + line(`M${x0 + 7} ${y0 + 3} H${x1 - 7}`, 'var(--bookLight)', 1.6)
    + corners + emblem(ex, ey, es, sx);
}
// The book seen from its fore-edge: the cream page block between the two green covers.
function bookEdge(x0, y0, x1, y1, cover = 6) {
  let s = P(`M${x0} ${y0 + 5} q0 -5 5 -5 h${x1 - x0 - 10} q5 0 5 5 V${y1} H${x0}Z`, grad('book'), BINK)
    + P(`M${x0 + cover} ${y0 + 3} H${x1 - cover} V${y1} H${x0 + cover}Z`, 'var(--paper)', '#a8946a', 1.2);
  for (let x = x0 + cover + 4; x < x1 - cover - 2; x += 4.5) s += line(`M${f1(x)} ${y0 + 6} V${y1 - 2}`, '#d9c9a2', .9);
  return s + line(`M${x0 + 2.5} ${y0 + 8} V${y1 - 2} M${x1 - 2.5} ${y0 + 8} V${y1 - 2}`, 'var(--gold)', 1.2);
}
// Small leather holder that covers only the lower part of the book; a darker rim at the top.
function holder(x0, x1, y0, y1, flare = 3) {
  return P(`M${x0 - flare} ${y0} H${x1 + flare} Q${x1 + flare + 1} ${y0 + 6} ${x1} ${y0 + 12} L${x1 - 2} ${y1 - 8} Q${x1 - 3} ${y1} ${x1 - 11} ${y1} H${x0 + 11} Q${x0 + 3} ${y1} ${x0 + 2} ${y1 - 8} L${x0} ${y0 + 12} Q${x0 - flare - 1} ${y0 + 6} ${x0 - flare} ${y0}Z`, grad('pack'), PINK)
    + P(`M${x0 - flare} ${y0} H${x1 + flare} Q${x1 + flare + 1} ${y0 + 5} ${x1 + .5} ${y0 + 10} H${x0 - .5} Q${x0 - flare - 1} ${y0 + 5} ${x0 - flare} ${y0}Z`, 'var(--packDark)', PINK, 2)
    + line(`M${x0 + 6} ${y1 - 10} Q${(x0 + x1) / 2} ${y1 - 6} ${x1 - 6} ${y1 - 10}`, 'var(--packLight)', 1.2);
}
const strap = d => line(d, PINK, 10) + line(d, 'var(--pack)', 6.6) + line(d, 'var(--packLight)', 1.2);

const BODY = [
  'M262 221 Q305 213 348 221 Q362 230 364 252 L366 342 Q305 350 244 342 L246 252 Q248 230 262 221Z',
  'M168 221 Q218 211 270 217 Q282 238 280 268 L284 342 Q218 350 152 342 L156 268 Q156 238 168 221Z',
  'M120 222 Q150 214 188 222 Q196 250 194 290 L196 342 Q153.5 349 111 342 L114 290 Q112 250 120 222Z',
  'M70 218 Q120 208 170 216 Q182 250 180 290 L182 342 Q121 349 60 342 L62 290 Q60 250 70 218Z',
  'M262 219 Q305 211 348 219 Q362 230 364 252 L366 342 Q305 350 244 342 L246 252 Q248 230 262 219Z',
];

const TORSOS = [
  // 0 front: the shirt shows wide between the vest panels; the holder's straps run down the chest to the
  // belt. The book is hidden right behind the body (in the 3D rig its top corners only showed as small
  // green points beside the neck, between the hair and the arms, so they are not drawn).
  (mirror, tag) => neck('M288 194 H320 V216 H288Z')
    + vest(BODY[0])
    + vestShade(tag, BODY[0], ['M236 226 L262 222 L258 346 L236 346Z', 'M374 226 L348 222 L352 346 L374 346Z'])
    + opening(tag, BODY[0], 'M284 214 Q305 220 326 214 L331 346 Q305 350 279 346Z',
      [['M284 216 L279.5 344', 'M281 218 L276.5 344'], ['M326 216 L330.5 344', 'M329 218 L333.5 344']])
    + collar('M284 205 Q305 211 326 205 L328 218 Q317 221 307 227 Q296 221 282 218Z') + line('M305 213 L307 227', SINK, 1.8)
    + strap('M268 220 Q262 252 265 287') + strap('M342 220 Q348 252 345 287')
    + beltBand(246, 366, 287) + buckle(306, 298)
    + (mirror ? '' : pouch(323, 297)),
  // 1 front-left: the shirt panel narrows and moves toward the far side; the near vest panel turns
  // round the side. Book and holder behind the right shoulder; near strap over the shoulder to the
  // holder, far strap down the chest.
  (mirror, tag) => (mirror ? pouch(143, 298, 22, 40) : '')
    + bookEdge(258, 209, 302, 272, 7)
    + holder(272, 304, 264, 326)
    + neck('M196 196 H230 V216 H196Z')
    + vest(BODY[1])
    + vestShade(tag, BODY[1], ['M248 216 Q270 220 290 236 L290 346 L246 346Z', 'M146 226 L162 222 L160 346 L146 346Z'])
    + opening(tag, BODY[1], 'M189 214 Q201 219 214 213 L212 346 Q195 349 179 345Z',
      [['M189 216 L179.5 344', 'M186.5 218 L177 344'], ['M214 215 L212 345', 'M216.5 217 L214.5 345']])
    + collar('M191 205 Q212 211 238 205 L240 218 Q226 222 212 227 Q200 222 189 218Z') + line('M212 214 L212 227', SINK, 1.8)
    + strap('M176 221 Q171 252 174 287') + strap('M238 213 Q268 222 278 262')
    + beltBand(155, 282, 286) + buckle(197, 297, 24, 21)
    + (mirror ? '' : pouch(208, 297)),
  // 2 left: the vest covers the side; the shirt shows only as a narrow strip at the front edge.
  // The book's fore-edge (pages between the green covers) in the holder on the back.
  (mirror, tag) => bookEdge(186, 216, 232, 276, 7)
    + holder(192, 240, 271, 330, 2.5)
    + neck('M142 196 H176 V216 H142Z')
    + vest(BODY[2])
    + vestShade(tag, BODY[2], ['M172 216 L200 226 L200 346 L174 346Z'])
    + opening(tag, BODY[2], 'M104 220 L126 220 Q120 252 122 290 L120 346 L104 346Z',
      [['M126 222 Q120.5 252 122 290 L120 344', 'M128.5 224 Q123 252 124.5 290 L122.5 344']])
    + collar('M136 207 Q158 203 180 207 L182 220 Q160 224 138 220Z')
    + strap('M140 222 Q184 210 196 240 Q202 256 202 272')
    + beltBand(111, 195, 285, 0) + P('M104 283 h12 v17 h-12Z', grad('gold'), 'var(--goldDark)', 1.8)
    + (mirror ? '' : pouch(138, 296, 30, 40)),
  // 3 back-left: the vest's back; the cover (emblem) and the fore-edge on its left, in the holder.
  (mirror, tag) => neck('M88 194 H120 V214 H88Z')
    + vest(BODY[3])
    + vestShade(tag, BODY[3], ['M54 224 L80 220 L76 346 L54 346Z'])
    + collar('M84 203 Q106 198 130 203 L131 216 Q106 211 82 216Z')
    + beltBand(60, 182, 286)
    + (mirror ? '' : pouch(52, 296, 20, 38))
    + strap('M76 222 Q100 234 106 272')
    + P('M108 222 Q108 216 114 216 H130 V276 H108Z', grad('book'), BINK) + P('M112 219 H128 V276 H112Z', 'var(--paper)', '#a8946a', 1.2)
    + line('M116 222 V274 M120.5 222 V274 M125 222 V274', '#d9c9a2', .9)
    + bookCover(125, 213, 197, 276, 161, 246, .82, .9, true)
    + holder(105, 199, 270, 331),
  // 4 back: the vest's back with the straps beside the book; the deep green cover with the gold
  // emblem and the page block's top edge; the holder covers only the book's lower part.
  (mirror, tag) => neck('M284 180 H326 V206 H284Z')
    + vest(BODY[4])
    + vestShade(tag, BODY[4], ['M236 226 L258 222 L256 346 L236 346Z', 'M374 226 L352 222 L354 346 L374 346Z'])
    + collar('M278 193 Q305 189 332 193 L334 207 Q305 203 276 207Z')
    + beltBand(244, 366, 286)
    + strap('M262 214 Q250 236 252 262') + strap('M348 214 Q360 236 358 262')
    + bookCover(255, 202, 355, 276, 305, 237, 1.05, 1, true)
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
