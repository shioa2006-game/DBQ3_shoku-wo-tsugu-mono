import { path, ellipse, line, grad } from './svg.mjs';
import { EYE_OPENINGS, eye, nose } from './face-parts.mjs';
import { DIRECTIONS } from './sheet-format.mjs';

// 第4～5章の人型（ベルク・ロク・カヤ・ナギ・ヨモギ・スミ・テル）の共通部品。
// 描画の土台（グラデーション・顔の部品・胴の外形・ベルト・左右反転・シート組み立て）だけを共有し、
// 髪・服・顔の特徴は各キャラクターの character.mjs で描く。
// view: 0=正面 1=左斜め前 2=左 3=左斜め後 4=背面。右側の3方向は左側を反転する。

export const gradient = (id, x1 = 20, x2 = 80) =>
  `<linearGradient id="${id}" x1="${x1}%" y1="0%" x2="${x2}%" y2="100%"><stop stop-color="var(--${id}Light)"/><stop offset=".48" stop-color="var(--${id})"/><stop offset="1" stop-color="var(--${id}Dark)"/></linearGradient>`;

export function definitions(ids, extra = '') {
  return `<defs>${Object.entries(EYE_OPENINGS).map(([id, d]) => `<clipPath id="eye-${id}"><path d="${d}"/></clipPath>`).join('')}${ids.map(id => gradient(id)).join('')}
  <radialGradient id="skin" cx="40%" cy="30%" r="85%"><stop stop-color="var(--skinLight)"/><stop offset=".65" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient>${extra}</defs>`;
}

// 輪郭パスの内側だけに陰影・毛流れを描く。
export const clipped = (id, d, inner) => `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g>`;
export const scaleAt = (x, y, sx, sy, inner) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy}) translate(${-x} ${-y})">${inner}</g>`;

// 決まった並びの擬似乱数（同じコードから同じ絵を再生成するため Math.random は使わない）。
export const noise = n => { const x = Math.sin(n * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
export const poly = pts => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}Z`;

// ぼさぼさ髪の外周。楕円の弧に沿って、谷と毛先を交互に置く（角度は度、0=右・90=上）。
// sweep で毛先を流れる向きへ倒し、depth で毛先の長さを決める。
export function spikyArc({ cx, cy, rx, ry, from, to, count, depth = .12, sweep = 0, seed = 1 }) {
  const pts = [];
  for (let i = 0; i <= count * 2; i++) {
    const tip = i % 2 === 1, a = (from + (to - from) * i / (count * 2) + (tip ? sweep : 0)) * Math.PI / 180;
    const k = tip ? 1 + depth * (.65 + .7 * noise(seed + i)) : 1 - .03 * noise(seed + i * 3);
    pts.push([cx + Math.cos(a) * rx * k, cy - Math.sin(a) * ry * k]);
  }
  return pts;
}
// 二点の間を、下向き（dy>0）または任意方向の毛先でつなぐ。前髪・襟足に使う。
export function spikyLine([x1, y1], [x2, y2], count, [dx, dy], seed = 1) {
  const pts = [];
  for (let i = 1; i < count * 2; i++) {
    const t = i / (count * 2), tip = i % 2 === 1, k = tip ? .7 + .6 * noise(seed + i) : .1 * noise(seed + i);
    pts.push([x1 + (x2 - x1) * t + dx * k, y1 + (y2 - y1) * t + dy * k]);
  }
  return pts;
}
// 毛流れ。つむじ（cx, cy）から外へ伸びる短い曲線を、髪の輪郭の内側に描く。
export function strands({ cx, cy, count, inner = 4, outer = 34, colors, width = .6, seed = 1, from = 0, to = 360 }) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = (from + (to - from) * noise(seed + i * 7)) * Math.PI / 180, r0 = inner + 6 * noise(seed + i * 11), r1 = outer * (.55 + .45 * noise(seed + i * 13));
    const bend = (noise(seed + i * 17) - .5) * 10;
    const p = r => [cx + Math.cos(a) * r, cy - Math.sin(a) * r];
    const [x0, y0] = p(r0), [x1, y1] = p(r1), [mx, my] = p((r0 + r1) / 2);
    s += line(`M${x0.toFixed(1)} ${y0.toFixed(1)} Q${(mx + bend).toFixed(1)} ${(my + bend * .3).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`, colors[i % colors.length], width);
  }
  return s;
}

// 細かな毛束。範囲内に短い線を散らし、つむじ（cx, cy）から外へ流れる向きにそろえる。
// 放射状の長い線は「うに」のように見えるので、髪の質感には短い線を使う。
export function tufts({ box: [x0, y0, x1, y1], cx, cy, count, len = [4, 8], colors, width = .7, seed = 1, droop = .35 }) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + (x1 - x0) * noise(seed + i * 7), y = y0 + (y1 - y0) * noise(seed + i * 11);
    let dx = x - cx, dy = y - cy + droop * 12; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
    const l = len[0] + (len[1] - len[0]) * noise(seed + i * 13), bend = (noise(seed + i * 17) - .5) * 2.4;
    s += line(`M${x.toFixed(1)} ${y.toFixed(1)} q${(dx * l / 2 - dy * bend).toFixed(1)} ${(dy * l / 2 + dx * bend).toFixed(1)} ${(dx * l).toFixed(1)} ${(dy * l).toFixed(1)}`, colors[i % colors.length], width);
  }
  return s;
}

// 顔の輪郭。male=顎の広い大人、female=丸い頬の若い女性、elder=頬のこけた年配。
const OUTLINES = {
  male: [
    'M42 34 Q62 26 83 35 Q87 47 83 59 Q80 68 72 72 Q63 75 54 72 Q45 69 42 62 Q37 51 42 34Z',
    'M38 35 Q57 27 78 36 L80 53 Q78 63 70 69 Q61 74 51 72 Q42 70 39 62 Q35 51 38 35Z',
    'M42 35 Q58 29 75 39 L76 54 Q68 60 62 67 Q55 72 48 71 Q43 69 41 64 L40 60 Q34 59 35 56 L40 52Z',
  ],
  female: [
    'M42 30 Q64 22 84 32 C87 44 85 54 81.5 59.5 C77 65 69.5 68 63 68 C55 68 47 64.5 43 59.5 C39 54 38 42 42 30Z',
    'M37 31 Q57 23 79 34 L81 53 C78.8 61 69.5 66 60 68 C51 69 43 65.5 39.5 60 C36.5 54 35.5 44 37 31Z',
    'M37 31 Q55 23 76 35 L77 53 Q70 58 65 61 C58 66 51 68 45 67.5 C40.5 67 38 64.5 36.8 61 Q35.5 59.5 35.5 58 Q29 56 32 54 Q35 51 36 47Z',
  ],
  elder: [
    'M43 30 Q63 22 82 30 L84 48 Q84 57 79 64 L76 69 Q64 73 52 69 L47 64 Q41 58 41 48Z',
    'M39 30 Q56 23 76 31 L80 49 Q78 59 71 66 L67 70 Q57 72 48 69 L43 64 Q37 59 37 50Z',
    'M41 32 Q56 26 73 37 L75 53 Q67 60 62 66 L58 70 L47 69 Q41 68 41 64 L39 60 Q33 59 35 56 L39 51Z',
  ],
};
// 耳の位置（正面の左右・斜め前の奥・横）。輪郭ごとに顎・頬に合わせる。
const EARS = {
  male: { front: [[39.5, 53], [85.5, 53]], near: [79, 53], side: [69, 52] },
  female: { front: [[39, 52], [86, 52]], near: [79, 52], side: [69, 51] },
  elder: { front: [[40, 50], [85, 50]], near: [79, 50], side: [68, 50] },
};
// 目・眉・鼻・口の高さ。輪郭ごとに目の高さを変え、顔の縦の比率を保つ。
const FEATURES = {
  male: { eyeY: 52, browY: 43, noseY: 60.5, mouthY: 65.5 },
  female: { eyeY: 50, browY: 40.5, noseY: 58, mouthY: 62 },
  elder: { eyeY: 48.5, browY: 40, noseY: 56.5, mouthY: 62 },
};

const skinPath = (d, o, w = 1) => path(d, grad('skin'), o.line, w);

function ear(x, y, o, rx = 3.8, ry = 5.6) {
  return ellipse(x, y, rx, ry, grad('skin'), o.line, .85) + line(`M${x + .8} ${y - 2.5} Q${x - 2.4} ${y - 2.6} ${x - 1.2} ${y + 3}`, 'var(--skinDark)', .75);
}

// 眉: 太さ（thick）と角度（tilt: 正で眉頭が下がり険しく、負で困り眉）を指定する。
// dir は眉尻の向き（1=左、-1=右）。x1 が眉尻、x2 が眉頭。
function brow(x, y, w, o, dir = 1) {
  const t = o.brow?.thick ?? 1, tilt = o.brow?.tilt ?? 0, c = o.brow?.color ?? '#3b2b1c';
  const x1 = x - w / 2 * dir, x2 = x + w / 2 * dir;
  return path(`M${x1} ${y + 1 - tilt} Q${x} ${y - 2.6 * t} ${x2} ${y + 1 + tilt} L${x2} ${y + 1 + tilt + 1.6 * t} Q${x} ${y - .6 * t} ${x1} ${y + 2.4 * t - tilt}Z`, c, 'none');
}

// 目は共通部品（face-parts.mjs）。squash で縦を細め、年配や大人の目元にする。
function eyeAt(x, y, o, extra = {}) {
  const e = o.eye ?? {};
  const inner = eye(x, y, { size: e.size ?? .74, width: e.width ?? 1, irisStroke: e.irisStroke ?? '#4b3a26', pupil: e.pupil ?? '#1c1a18', glint: e.glint ?? '#c9a46a', ...extra });
  const squash = e.squash ?? 1;
  return squash === 1 ? inner : scaleAt(0, y, 1, squash, inner);
}

// 大人の鼻（o.nose='adult'）: 鼻筋と小鼻を線で描く。子どもの丸い鼻（共通部品）より高く長い。
function adultNose(view, f, o) {
  const c = o.noseLine ?? 'var(--skinDark)', y = f.noseY;
  if (view === 0) return line(`M61.5 ${y - 10} Q60.5 ${y - 4} 59.5 ${y}`, c, .8) + line(`M58.5 ${y + .3} Q63 ${y + 2.6} 67.5 ${y + .3}`, c, .9) + ellipse(61.8, y - 3, .8, 2.2, 'var(--skinLight)', 'none');
  if (view === 1) return line(`M53.5 ${y - 10} Q51 ${y - 4} 48 ${y}`, c, .85) + line(`M47.5 ${y} Q51 ${y + 2.4} 55 ${y + .4}`, c, .9);
  return '';
}
// 横顔の大人の鼻は、別の部品を足さず顔の輪郭そのものに鼻筋と鼻先を入れる（離れて見えないように）。
const ADULT_PROFILE = {
  male: 'M42 35 Q58 29 75 39 L76 54 Q68 60 62 67 Q55 72 48 71 Q43 69 41.5 64 L40.5 61.5 Q36 61.8 33.8 59.2 Q34.6 56.5 37.4 52.5 Q39.4 48 40 43 L42 35Z',
};
const adultNostril = f => line(`M37.2 ${f.noseY - .6} Q39.4 ${f.noseY - 1.4} 39.6 ${f.noseY + .6}`, 'var(--skinDark)', .75)
  + line(`M38.6 ${f.noseY - 9} Q37.6 ${f.noseY - 5} 36.4 ${f.noseY - 2.6}`, 'var(--skinLight)', .7);
// 上まぶたの重い線（o.lid）。大人や年配の目元を、目そのものを小さくせずに締める。
function lid(x, y, w, o, dir = 1) {
  return line(`M${x - w / 2 * dir} ${y - 3.2} Q${x} ${y - 6.2} ${x + w / 2 * dir} ${y - 3.6}`, o.lid, 1.15);
}

// 顔（頭の前側）。正面・斜め前・横の輪郭と部品、斜め後ろは耳だけを描く。背面は描かない。
export function face(view, o) {
  const shape = o.shape ?? 'male', f = { ...FEATURES[shape], ...o.features }, ears = EARS[shape];
  if (view === 4) return '';
  if (view === 3) return path('M37 47 Q30 46 33 54 Q34 61 40 60Z', grad('skin'), o.line, .85)
    + line('M35 49 Q33 51 36 56', 'var(--skinDark)', .75);
  const profile = view === 2 && o.nose === 'adult' && ADULT_PROFILE[shape];
  let s = skinPath(profile || OUTLINES[shape][view], o);
  const mouth = o.mouthColor ?? '#835032', blush = o.blush;
  if (view === 0) {
    s += ear(...ears.front[0], o) + ear(...ears.front[1], o);
    s += eyeAt(52, f.eyeY, o) + eyeAt(74, f.eyeY, o, { nose: -1 });
    s += brow(51, f.browY, 13, o, 1) + brow(75, f.browY, 13, o, -1);
    s += o.nose === 'adult' ? adultNose(0, f, o) : nose(63, f.noseY);
    if (o.lid) s += lid(52, f.eyeY, 11, o) + lid(74, f.eyeY, 11, o, -1);
    if (o.folds) s += line(`M54 ${f.noseY + 1} Q52 ${f.mouthY} 54.5 ${f.mouthY + 3} M72 ${f.noseY + 1} Q74 ${f.mouthY} 71.5 ${f.mouthY + 3}`, o.folds, .7);
    s += o.smile ? line(`M57 ${f.mouthY} Q63 ${f.mouthY + 3.4} 69 ${f.mouthY}`, mouth, 1) : line(`M58 ${f.mouthY + .4} Q63 ${f.mouthY + 1.8} 68 ${f.mouthY + .2}`, mouth, 1);
    if (blush) s += ellipse(45.5, f.eyeY + 8, 2.8, 1.1, blush, 'none', 0, 'opacity=".5"') + ellipse(80.5, f.eyeY + 8, 2.8, 1.1, blush, 'none', 0, 'opacity=".5"');
    if (o.wrinkles) s += line(`M44 ${f.eyeY + 5} Q47 ${f.eyeY + 7} 50 ${f.eyeY + 6} M76 ${f.eyeY + 6} Q79 ${f.eyeY + 7} 82 ${f.eyeY + 5} M55 ${f.mouthY - 3} Q53 ${f.mouthY + 1} 55 ${f.mouthY + 4} M71 ${f.mouthY - 3} Q73 ${f.mouthY + 1} 71 ${f.mouthY + 4}`, 'var(--skinDark)', .65);
  } else if (view === 1) {
    s += eyeAt(45, f.eyeY, o, { width: .66, view: 'far' }) + eyeAt(63.5, f.eyeY + .4, o, { nose: -1, view: 'near' });
    s += ear(...ears.near, o, 4.1, 5.9);
    s += brow(44, f.browY, 10, o, 1) + brow(64, f.browY, 12, o, -1);
    s += o.nose === 'adult' ? adultNose(1, f, o) : nose(50, f.noseY, -1);
    if (o.lid) s += lid(45, f.eyeY, 7.5, o) + lid(63.5, f.eyeY + .4, 11, o, -1);
    if (o.folds) s += line(`M58 ${f.noseY + 1} Q61 ${f.mouthY} 59 ${f.mouthY + 3}`, o.folds, .7);
    s += o.smile ? line(`M48 ${f.mouthY - .3} Q54 ${f.mouthY + 3} 60 ${f.mouthY - .5}`, mouth, .95) : line(`M48.5 ${f.mouthY} Q54 ${f.mouthY + 1.7} 59.5 ${f.mouthY - .2}`, mouth, .95);
    if (blush) s += ellipse(69.5, f.eyeY + 8.5, 2.6, 1, blush, 'none', 0, 'opacity=".5"');
    if (o.wrinkles) s += line(`M68 ${f.eyeY + 6} Q71 ${f.eyeY + 7} 73 ${f.eyeY + 5} M52 ${f.mouthY - 3} Q50 ${f.mouthY + 1} 52 ${f.mouthY + 4}`, 'var(--skinDark)', .65);
  } else {
    if (profile) s += adultNostril(f);
    s += eyeAt(47, f.eyeY - .5, o, { width: .74, nose: -1, view: 'side' });
    if (o.lid) s += lid(47, f.eyeY - .5, 8.5, o, -1);
    s += brow(47.5, f.browY - .5, 10, o, -1);
    s += ear(...ears.side, o, 4.1, 6);
    // The adult profile's lips sit further back, under the longer nose; keep the mouth inside the outline.
    s += profile ? line(`M42.6 ${f.mouthY - .6} Q44.4 ${f.mouthY + .6} 46.6 ${f.mouthY - .6}`, mouth, .9)
      : line(`M37.5 ${f.mouthY + .2} Q40 ${f.mouthY + 1.4} 43 ${f.mouthY}`, mouth, .9);
    if (blush) s += ellipse(51, f.eyeY + 8, 2.6, 1, blush, 'none', 0, 'opacity=".5"');
    if (o.wrinkles) s += line(`M52 ${f.eyeY + 1} Q55 ${f.eyeY + 3} 56 ${f.eyeY + 5} M44 ${f.mouthY - 3} Q47 ${f.mouthY + 1} 45 ${f.mouthY + 4}`, 'var(--skinDark)', .65);
  }
  return s;
}

// 胴の外形（肩から裾まで）。width は肩の半幅、方向ごとに配列で渡す。
export function shell(view, widths, fill, stroke = 'var(--ink)', top = 78) {
  const w = widths[view], l = 63 - w, r = 63 + w;
  const d = `M${l + 5} ${top} Q63 ${top - 6} ${r - 5} ${top} Q${r + 2} ${top + 6} ${r} 99 L${r - 1} 118 Q63 123 ${l + 1} 118 L${l} 99 Q${l - 2} ${top + 7} ${l + 5} ${top}Z`;
  return { l, r, d, s: path(d, fill, stroke, 1) };
}

// 首。正面・斜め前・横・後ろの形を分け、顎の奥から胴へつなぐ。
export function neck(view, o = {}) {
  const d = [
    'M54 64 H72 L75 79 Q63 86 51 79Z',
    'M58 64 L73 61 L76 75 L57 86 L49 77Z',
    'M61 64 L73 61 L76 73 Q65 81 54 85 L49 77Z',
  ][view] ?? 'M53 64 H74 L78 79 H48Z';
  return path(d, grad('skin'), o.line ?? '#755135', .8);
}

// 革のベルトと四角い留め金（正面・斜め前・横）。
export function belt(view, l, r, o = {}) {
  const leather = o.leather ?? 'var(--leather)', stitch = o.stitch ?? '#ab7c3e', top = o.top ?? 111;
  let s = path(`M${l + 1} ${top} Q63 ${top + 5} ${r - 1} ${top} L${r - 1} ${top + 7} Q63 ${top + 12} ${l + 1} ${top + 7}Z`, leather, o.ink ?? '#3a2a1a', .9)
    + line(`M${l + 2} ${top + 2} Q63 ${top + 7} ${r - 2} ${top + 2} M${l + 2} ${top + 6} Q63 ${top + 11} ${r - 2} ${top + 6}`, stitch, .6);
  if (view <= 2 && o.buckle !== false) {
    const c = [63, 55, 48][view], w = view === 2 ? 2.4 : 4.6;
    s += path(`M${c - w} ${top + 1} h${w * 2} v8 h${-w * 2}Z`, o.buckleFill ?? grad('gold'), o.buckleInk ?? 'var(--goldDark)', .85)
      + path(`M${c - w + 1.4} ${top + 3} h${w * 2 - 2.8} v4 h${2.8 - w * 2}Z`, leather, 'none')
      + line(`M${c} ${top + 2.5} v5`, o.buckleLight ?? 'var(--goldLight)', .8);
  }
  return s;
}

// 左右反転と、頭・胴・比較用合成の切り替え。
export function compose(direction, part, draw) {
  const index = DIRECTIONS.indexOf(direction);
  if (index < 0) throw Error(`Unknown direction: ${direction}`);
  if (!['combined', 'head', 'torso'].includes(part)) throw Error(`Unknown part: ${part}`);
  const mirror = index > 4, view = mirror ? 8 - index : index;
  const head = draw.head(view), torso = draw.torso(view);
  const content = part === 'head' ? head : part === 'torso' ? torso : (draw.combined?.(view, head, torso) ?? torso + head);
  return `<g ${mirror ? 'transform="translate(126 0) scale(-1 1)"' : ''}>${content}</g>`;
}

export function buildSheet({ cellSize = 128, palette = {}, part = 'combined' } = {}, defaults, defs, markup) {
  if (!Number.isInteger(cellSize) || cellSize < 128 || cellSize > 1024) throw Error('cellSize must be an integer from 128 to 1024');
  const colors = { ...defaults, ...palette };
  for (const color of Object.values(colors)) if (!/^#[0-9a-f]{6}$/i.test(color)) throw Error('Invalid palette color');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize * 4}" height="${cellSize * 2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k, v]) => `--${k}:${v}`).join(';')}">${defs}${DIRECTIONS.map((d, i) => `<g transform="translate(${i % 4 * 128} ${Math.floor(i / 4) * 128})">${markup(d, part)}</g>`).join('')}</svg>`;
}
