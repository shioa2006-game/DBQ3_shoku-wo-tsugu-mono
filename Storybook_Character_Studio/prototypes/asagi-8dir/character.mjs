import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { buildSheet, clipped } from '../shared/humanoid-kit.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
export { DIRECTIONS, LABELS };

// アサギ・試作01。承認済み references/asagi-8dir-v2.png を見て描いたベクター原本。
// 写真や設定画の画素はSVGに含めない。目・眼鏡・面長の輪郭・鼻・波打つ毛束を個別に編集できる。
// 頭は顔・耳・髪・眼鏡、胴は首・襟・服・腰。腕・脚は3Dリグで付ける。
// view: 正面=0、左斜め前=1、左=2、左斜め後=3、背面=4。
// 右側は頭と衣装を反転し、本人の左腰の道具入れだけは方向別に描き分ける。
export const DEFAULT_PALETTE = Object.freeze({
  ink: '#2c241f', skin: '#f4c99d', skinLight: '#ffe2ba', skinDark: '#cd936b',
  hair: '#3e332e', hairLight: '#6d5b50', hairDark: '#241f1c',
  cloth: '#536d70', clothLight: '#698083', clothDark: '#3b5358',
  ivory: '#e6d5b4', ivoryLight: '#f7e9ce', ivoryDark: '#b6a181',
  leather: '#8d6342', leatherLight: '#b4865c', leatherDark: '#5b3e2c',
  gold: '#c6a160', goldLight: '#edcc87', goldDark: '#80613a',
  glasses: '#252323', eye: '#4b3625', pencil: '#c66e5c',
});
const gradients = ['hair', 'cloth', 'ivory', 'leather', 'gold'].map(id =>
  `<linearGradient id="${id}" x1="12%" y1="5%" x2="86%" y2="95%"><stop stop-color="var(--${id}Light)"/><stop offset=".48" stop-color="var(--${id})"/><stop offset="1" stop-color="var(--${id}Dark)"/></linearGradient>`).join('');
const DEFS = `<defs>${gradients}<radialGradient id="skin" cx="35%" cy="28%" r="90%"><stop stop-color="var(--skinLight)"/><stop offset=".7" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient></defs>`;
const P = (d, fill, stroke = 'var(--ink)', w = .85) => path(d, fill, stroke, w);
const L = (d, color = 'var(--ink)', w = .65) => line(d, color, w);
const E = (x, y, rx, ry, fill, stroke = 'none', w = .7) => ellipse(x, y, rx, ry, fill, stroke, w);
const group = (name, svg) => `<g data-part="${name}">${svg}</g>`;
export const ASAGI_LAYOUT = Object.freeze({ referenceWidth: 1774, referenceHeight: 887, referenceCell: 443.5, referenceScale: .27, center: 63.232 });

// 曲がり目を残した毛束の輪郭。後頭部・耳前・襟足をひと続きにし、短髪のとげに置き換えない。
const HAIR = [
  'M30 43 C26 39 30 32 34 29 C33 20 41 14 48 12 C52 8 58 9 61 10 C63 4 70 5 74 9 C83 9 91 16 93 23 Q96 28 100 27 Q99 34 95 36 Q100 41 99 46 L102 44 Q102 51 96 52 Q99 56 96 61 L99 60 Q97 67 89 66 Q92 70 95 69 Q91 75 84 73 L85 76 Q78 76 74 71 Q69 76 65 73 Q61 77 56 73 Q51 77 46 72 Q41 75 38 72 Q43 72 41 68 Q34 69 32 64 Q36 65 36 61 Q29 61 29 55 Q33 56 32 52 Q26 51 28 46Z',
  'M28 42 Q25 37 31 31 Q29 22 38 17 Q40 11 49 12 Q56 6 65 10 Q68 4 73 8 Q83 7 90 15 Q93 21 99 20 Q97 25 93 27 Q101 34 99 39 L103 38 Q102 45 97 48 Q102 50 99 54 L104 53 Q101 61 94 61 Q97 66 100 64 Q98 71 88 69 L90 73 Q84 75 79 72 Q78 77 71 74 Q67 78 62 73 Q56 76 52 72 Q45 76 41 70 Q36 73 33 69 Q38 68 35 65 Q30 65 29 60 L33 60 Q26 56 28 51 Q23 49 28 42Z',
  'M28 31 Q26 25 33 20 Q33 13 43 13 Q48 7 58 10 Q62 5 68 8 Q78 6 86 14 Q94 15 97 23 L103 25 Q102 30 98 31 Q105 39 101 45 L105 44 Q105 50 99 54 Q103 56 102 60 Q99 65 92 64 Q95 69 99 67 Q97 73 89 72 Q87 76 80 72 Q78 77 71 74 Q67 78 63 73 Q58 76 54 71 Q49 74 44 69 L49 65 Q42 65 42 59 Q40 52 38 48 Q34 47 34 42 Q27 44 25 39 Q31 40 30 35 Q27 35 28 31Z',
  'M29 36 Q25 30 31 23 Q31 16 40 14 Q46 8 56 10 Q60 5 67 8 Q75 7 83 14 Q92 15 95 22 Q101 27 99 33 Q105 39 100 46 L103 46 Q103 53 97 56 Q100 61 95 65 Q94 71 87 69 Q87 74 80 73 Q76 78 70 73 Q66 77 61 73 Q56 77 51 73 Q44 75 41 69 Q35 69 35 62 Q29 60 31 53 Q27 49 29 43 Q25 40 29 36Z',
  'M28 37 Q25 31 30 25 Q31 17 41 14 Q46 8 57 10 Q62 5 68 8 Q77 8 83 14 Q92 15 95 24 Q100 29 99 35 Q104 42 99 47 L102 46 Q103 54 96 56 Q100 62 94 66 Q93 73 86 71 Q83 77 77 73 Q73 78 67 73 Q62 78 57 74 Q51 78 47 73 Q39 75 37 69 Q31 68 33 62 Q26 60 29 54 Q25 49 28 44 Q24 41 28 37Z',
];
const LOCKS = [
  [
    'M63 16 C51 8 39 21 37 32 Q35 42 29 44 Q37 46 43 35 C46 26 49 20 58 22',
    'M60 13 Q49 12 43 19 Q38 24 37 29',
    'M63 19 Q52 16 47 28 Q44 43 33 47',
    'M65 16 C75 9 87 19 90 29 Q92 35 98 34 Q93 40 85 34 Q77 25 72 23',
    'M69 12 Q79 12 87 22',
    'M67 19 Q76 18 81 28 Q85 40 96 41',
    'M38 46 Q32 54 39 60 Q43 65 39 68',
    'M88 43 Q96 47 90 55 Q84 62 91 65',
    'M43 56 Q39 66 48 70 Q48 74 43 73',
    'M84 56 Q88 66 80 70 Q79 74 85 73',
    'M48 66 Q47 73 54 73 M77 66 Q80 73 73 74',
  ],
  [
    'M61 15 Q49 10 40 23 Q36 33 30 36 Q34 39 40 36 Q45 26 50 23',
    'M58 12 Q43 12 38 22',
    'M62 19 Q51 17 45 29 Q42 43 30 44',
    'M64 16 Q73 10 83 19 Q87 28 97 27 Q96 32 87 32 Q80 30 73 24',
    'M68 11 Q80 10 88 21',
    'M67 22 Q77 21 81 30 Q85 40 98 37',
    'M65 29 Q72 42 88 43 Q96 43 99 40',
    'M78 40 Q90 52 99 48',
    'M85 48 Q92 59 100 55',
    'M76 57 Q86 67 94 64',
    'M66 64 Q76 72 84 70 Q81 74 75 73',
    'M59 65 Q66 74 72 73 M44 61 Q36 65 42 70 M34 48 Q29 56 35 58',
  ],
  [
    'M51 16 Q40 14 34 26 Q32 34 28 35',
    'M56 14 Q61 9 72 13 Q85 17 88 29 Q94 35 100 33',
    'M53 19 Q41 16 39 31 Q36 41 29 41',
    'M57 19 C70 12 78 29 77 36 Q83 42 96 38',
    'M52 24 Q49 39 38 44 Q45 47 53 41 Q59 34 56 25',
    'M62 25 Q72 31 69 41 Q66 49 57 51 Q66 55 76 45 Q87 47 99 43',
    'M82 19 Q92 22 96 28',
    'M82 47 Q86 56 99 51',
    'M73 51 Q81 63 97 59',
    'M69 59 Q74 70 89 66',
    'M62 64 Q68 74 80 71 M54 64 Q56 71 64 72',
  ],
  [
    'M58 15 Q43 11 35 26 Q34 35 29 37',
    'M62 13 Q72 9 81 18 Q86 24 94 25',
    'M57 19 Q46 17 43 30 Q40 42 30 44 Q38 47 47 36',
    'M62 18 Q69 20 68 31 Q67 44 52 49 Q62 52 75 39 Q81 30 77 21',
    'M81 26 Q92 33 100 32',
    'M80 35 Q89 43 100 39',
    'M47 27 Q57 26 55 40 Q51 52 36 54 Q39 59 48 55',
    'M73 43 Q85 53 96 47',
    'M53 53 Q62 58 75 50 Q83 51 87 58 Q92 61 97 57',
    'M43 59 Q54 68 66 57 Q67 67 57 71',
    'M71 59 Q78 69 91 64',
    'M67 68 Q76 76 84 69 M42 66 Q45 72 51 70',
  ],
  [
    'M60 15 Q46 12 38 25 Q33 38 28 38',
    'M64 12 Q77 10 85 22',
    'M59 20 Q48 17 45 29 Q42 44 30 45 Q39 48 46 41',
    'M64 18 Q72 22 70 34 Q65 47 53 49 Q64 52 77 39 Q84 29 78 21',
    'M81 24 Q89 33 99 33',
    'M48 28 Q59 31 55 41 Q50 54 35 55',
    'M80 38 Q89 45 98 42',
    'M72 46 Q81 55 96 50',
    'M47 53 Q53 61 63 54 Q62 65 49 69 Q43 69 39 65',
    'M68 55 Q73 65 88 59 Q90 65 96 62',
    'M62 64 Q67 74 78 69 Q81 74 88 69',
    'M54 68 Q56 74 62 72 M71 68 Q71 75 77 72',
  ],
];
// 少数の面で光を描き、髪の一枚ごとの輪郭は閉じない。黒髪が帽子や木目に見えないようにする。
const LIGHTS = [
  ['M39 28 Q43 17 54 16 L50 19 Q43 24 43 31 L38 37Z', 'M67 14 Q78 11 87 25 L81 21 L83 28 Q78 21 72 20Z', 'M45 32 Q46 25 53 23 L50 28 L49 35 L43 41Z', 'M75 25 Q82 29 83 34 L89 37 L84 38 Q76 34 75 25Z', 'M32 49 Q33 55 39 58 L36 59 Q30 54 32 49Z', 'M91 49 Q92 56 87 60 L87 56Z'],
  ['M36 28 Q40 17 50 16 L48 20 Q41 24 40 30 L35 34Z', 'M66 13 Q77 11 86 23 L79 19 L80 23 Q74 20 71 21Z', 'M48 30 Q51 22 57 23 L52 29 L50 35 L43 41Z', 'M69 25 Q75 25 80 34 L88 37 L81 38 Q73 34 69 25Z', 'M83 47 Q88 52 94 52 L91 54 Q86 53 83 47Z'],
  ['M35 24 Q40 17 46 17 L44 21 L40 24 L38 31 L34 33Z', 'M56 15 Q66 10 76 21 L72 20 L74 26 Q66 20 62 21Z', 'M48 24 Q51 23 53 26 Q52 35 45 39 L47 33Z', 'M61 27 Q68 29 68 36 L64 39 L64 35Z', 'M83 18 Q90 21 94 28 L89 25Z', 'M77 48 Q83 53 91 52 L86 55Z', 'M67 58 Q72 65 80 65 L75 67Z'],
  ['M34 27 Q39 16 49 16 L45 21 Q39 25 38 31 L33 35Z', 'M62 13 Q71 11 78 19 L72 17 L73 22 L67 20Z', 'M61 22 Q66 25 64 33 L60 35 L61 29Z', 'M46 31 Q50 28 52 33 Q52 43 43 47 L45 42Z', 'M78 31 Q85 37 95 36 L91 39 L84 38Z', 'M73 46 Q80 50 85 49 L82 52Z', 'M53 57 Q58 56 61 54 Q60 60 53 64 L50 64Z'],
  ['M37 25 Q42 16 52 16 L47 20 Q42 23 41 29 L36 34Z', 'M65 13 Q75 12 81 21 L76 18 L77 23 L71 20Z', 'M48 32 Q53 31 53 36 Q51 43 45 46 L47 40Z', 'M63 23 Q68 28 65 34 L62 36 L63 30Z', 'M82 30 Q88 36 96 35 L92 38 L86 37Z', 'M74 45 Q80 49 87 48 L83 51Z', 'M53 58 L60 56 Q58 63 52 65 L49 64Z', 'M69 59 Q76 63 83 61 L79 65 L73 64Z'],
];
function backHair(view, key) {
  return group('hair-back', P(HAIR[view], grad('hair'), 'var(--ink)', 1)
    + clipped(`hair-${key}`, HAIR[view],
      LIGHTS[view].map(d => P(d, 'var(--hairLight)', 'none')).join('')
      + LOCKS[view].map(d => `<g transform="translate(-.7 -1.3)" opacity=".33">${L(d, 'var(--hairLight)', 1.5)}</g>`).join('')
      + LOCKS[view].map(d => L(d, 'var(--hairDark)', .75)).join('')
      + LOCKS[view].map(d => `<g transform="translate(.4 -.6)" opacity=".6">${L(d, 'var(--hairLight)', .42)}</g>`).join('')));
}

const FACE = [
  'M48 27 Q62 21 77 27 Q81 37 80 47 L80.5 54 Q79.5 64 73.5 71 Q69 75 63 75 Q57 74 51 68 Q46 62 44.5 53 L45 40Z',
  'M39 30 Q50 24 65 30 Q75 33 78 44 L77 56 Q74 64 63 70 Q57 74 51 74 Q44 73 40 66 L38 57 L37 42Z',
  'M36 29 Q48 24 64 33 Q76 39 75 51 Q72 59 62 65 Q55 71 47 73 Q43 74 40 71 L40 66 Q42 64 40 62 L40 60 Q35 60 33 58 Q31 57 34 53 Q37 48 38 44 L36 38Z',
];
function ear(x, y, sx = 1) {
  return `<g transform="translate(${x} ${y}) scale(${sx} 1)">${P('M-2-4 Q4-6 4 0 Q4 5-1 6 Q-4 5-4 1Z', grad('skin'), 'var(--skinDark)', .65)}${L('M-1-2 Q2-3 2 0 Q0 0 0 3', 'var(--skinDark)', .6)}</g>`;
}
// アサギの切れ長の目。虹彩を目の開きで切り抜き、白目を目尻に残す。
function eye(x, y, width, key, far = false) {
  const h = far ? 2.8 : 3.1;
  const opening = `M${-width / 2} 0 Q0 ${-h} ${width / 2} -.2 Q1 ${h} ${-width / 2} 0Z`;
  return `<g data-part="eye" transform="translate(${x} ${y})">${P(opening, '#fff5dc', '#614a32', .5)}${clipped(`eye-${key}`, opening,
    E(-.35, -.25, 2, 2.9, 'var(--eye)') + E(-.5, -.5, .85, 2, '#221e1b') + E(-.95, -1, .48, .5, '#fff7e7'))}
    ${L(`M${-width / 2} 0 Q-.6 ${-h} ${width / 2} -.2`, '#30251e', .95)}</g>`;
}
function glasses(view) {
  const color = 'var(--glasses)';
  if (view === 0) return group('glasses',
    L('M44 45 Q52 42.5 61 45 Q61.5 49.5 58.3 52 Q52 54 47 51.6 Q44.5 49.8 44 45Z', color, 1.15)
    + L('M65 45 Q73 42.5 82 45 Q81.8 49.8 79 52 Q72 54 67.8 51.5 Q65 49.3 65 45Z', color, 1.15)
    + L('M61 46 Q63 44.8 65 46 M44 45.3 L40 44.4 M82 45.3 L85 44.4', color, 1.2)
    + L('M46 45.5 Q51 44.3 55 44.6 M67 45.5 Q72 44.3 77 44.6', '#9b9180', .32));
  if (view === 1) return group('glasses',
    L('M36.5 44.4 Q41 42.7 46.7 44.4 Q47 49.8 43.5 51.5 Q38.5 52.2 37 48.9Z', color, 1.05)
    + L('M51 44.4 Q59 42.4 66.7 44.5 Q66.4 50.4 62.3 52 Q56 53.4 52.3 50.1Z', color, 1.15)
    + L('M47 45.8 Q49 44.3 51 45.7 M66.7 44.7 L77 44', color, 1.15)
    + L('M53 45 Q58 43.8 62 44.2', '#9b9180', .3));
  return group('glasses',
    L('M37.6 43.5 Q42.5 42.5 48.2 44 Q48 49.8 44 51.8 Q40 53 38.8 49Z', color, 1.05)
    + L('M48.2 44.4 L61.7 47.2 L66 46.5 M37.6 44.3 L35.8 45.5', color, 1.05));
}
function face(view, key) {
  if (view >= 3) return '';
  let svg = P(FACE[view], grad('skin'));
  if (view === 0) {
    svg += ear(42.3, 53, -.85) + ear(83.4, 53, .85);
    svg += P('M46 56 Q47 65 56 71 L63 75 Q51 73 46 64Z', '#dca67b', 'none');
    svg += eye(52.6, 47.2, 11.3, `${key}-l`) + eye(73.2, 47.2, 11.3, `${key}-r`);
    svg += P('M46 40 Q52 36.8 58 40.2 L58.7 41.1 Q52 39.7 46 41.3Z', 'var(--hairDark)', 'none')
      + P('M67 40.2 Q74 36.7 80 40.4 L80.4 41.3 Q74 39.5 67 41.3Z', 'var(--hairDark)', 'none');
    svg += group('nose', P('M62 46 Q61 52 59.2 56.2 Q57.6 59.7 61 60.9 Q63.2 62.8 65.7 60.7 Q69 60.5 67.2 57 Q65.5 53 65 46', grad('skin'), '#b37e54', .65)
      + P('M61.8 47.2 Q60.8 54 60.4 56.9 Q60.7 59.4 63.2 59.6 Q65.8 59.5 65.5 57.7 L64 47Z', '#ffdeb1', 'none')
      + L('M59 59.7 Q60.2 58.9 61.2 60 M65 60 Q66.2 58.8 67.2 59.6', '#7b5137', .7));
    svg += L('M57.5 65.8 Q63 67 68.8 65.7', '#79503a', .7)
      + L('M59.8 69 Q63.4 69.7 66 68.9', '#d49c74', .45);
  } else if (view === 1) {
    svg += ear(75, 53, 1.05);
    svg += P('M73 57 Q67 67 53 73 Q62 72 70 66 L76 58Z', '#dba279', 'none');
    svg += eye(41.5, 46.4, 7.5, `${key}-l`, true) + eye(58.8, 47, 11.2, `${key}-r`);
    svg += P('M37 39.8 Q42 37.3 46 39.5 L46.2 40.5 L37.3 41Z', 'var(--hairDark)', 'none')
      + P('M52 40 Q58 36.8 64.7 39.8 L65.5 40.9 Q59 39.7 52 41.2Z', 'var(--hairDark)', 'none');
    svg += group('nose', P('M49 45.6 Q47 51 44 56.5 Q41 59.4 44.3 60.7 Q46.6 62.2 49.4 60.7 Q52.5 60.8 52.5 58.4 Q51.8 56.4 51.2 55.5', grad('skin'), '#a97550', .65)
      + L('M48.2 48 Q46.6 52.4 45.4 56.8', '#ffe3ba', 1)
      + L('M48.2 60 Q49.6 58.8 51.2 59.7', '#775038', .7));
    svg += L('M44.2 65.8 Q49 67.3 55 65.2', '#79503a', .7) + L('M47 69.1 Q50 69.8 53 68.5', '#d49c74', .45);
  } else {
    svg += ear(65.2, 52.5, 1.08);
    svg += P('M73 55 Q65 64 49 72 L47 73 Q62 70 71 61Z', '#dca67c', 'none');
    svg += eye(44.4, 46.4, 7.4, `${key}-near`, true)
      + P('M38 39.9 Q42 37.5 48 40.4 L48.5 41.4 Q42 40.5 38 41Z', 'var(--hairDark)', 'none');
    svg += group('nose', L('M36 57.4 Q38.2 55.6 39.6 58.1', '#865839', .65)
      + L('M37.6 47 Q36.4 51 34.6 54.6', '#ffe0b5', .8));
    svg += L('M40.7 63 Q43.2 64 45.7 62.8', '#79503a', .7) + L('M41.7 66.8 L45.3 66.8', '#d49c74', .45);
  }
  const result = group('face', svg) + glasses(view);
  return view === 2 ? `<g transform="translate(-2.5 0)">${result}</g>` : result;
}
// 前髪：額中央を大きく開け、根元から耳へ流れる曲線をつなぐ。
const FRINGE = [
  [
    'M63 22 Q58 16 52 20 Q46 21 43 32 Q41 42 32 44 Q37 48 45 41 Q50 35 51 28 Q53 23 58 24 L62 26Z',
    'M63 22 Q68 16 74 22 Q80 24 83 33 Q88 41 97 39 Q93 45 84 44 Q76 41 73 31 Q71 24 68 24 L64 26Z',
    'M39 43 Q44 44 43 50 Q39 57 43 61 Q35 59 36 52Z',
    'M84 43 Q90 45 87 51 Q82 55 84 61 Q77 60 79 54 Q83 50 81 46Z',
  ],
  [
    'M57 22 Q49 17 43 24 Q41 35 34 39 Q29 42 28 45 Q35 47 40 40 Q44 34 44 28 Q48 24 52 26 L56 28Z',
    'M57 22 Q65 15 72 25 Q76 34 84 38 Q91 41 97 37 Q94 45 84 45 Q73 42 68 33 Q64 25 60 26 L57 29Z',
    'M69 42 Q78 43 78 48 Q75 55 68 56 Q72 52 69 49 L65 48Z',
    'M35 47 Q33 55 37 59 Q30 60 29 54Z',
  ],
  [
    'M48 23 Q39 19 36 29 Q34 38 28 41 Q36 44 43 37 Q46 31 45 27Z',
    'M49 23 Q54 18 61 24 Q68 31 65 39 Q61 47 52 48 L48 46 Q56 42 55 36 Q54 29 49 27Z',
    'M62 38 Q69 41 69 47 Q66 52 58 54 Q61 51 58 48 L55 47Z',
  ],
];
function frontHair(view) {
  if (view >= 3) return '';
  return group('hair-front', FRINGE[view].map(d => P(d, grad('hair'), 'var(--hairDark)', .7)).join('')
    + L([
      'M58 22 Q49 20 47 31 Q44 41 37 43 M67 22 Q75 20 80 34 Q86 42 92 41 M39 49 Q38 55 41 57',
      'M51 23 Q44 23 42 34 Q39 41 33 43 M62 23 Q68 22 72 33 Q80 42 89 42 M72 46 Q75 49 71 52',
      'M43 25 Q39 27 38 33 Q34 40 31 41 M53 25 Q61 28 61 36 Q59 43 53 45 M63 43 Q65 47 61 50',
    ][view], 'var(--hairLight)', .8));
}
function head(view, key) {
  // 後ろ斜めは耳と頬だけ。顔は後ろ髪の背後に置き、目・鼻・眼鏡を見せない。
  const rearFace = view === 3 ? group('rear-ear', P('M31 48 Q39 44 43 51 L47 61 Q45 67 38 68 Q32 62 31 55Z', grad('skin')) + ear(36.4, 55, -.8)) : '';
  return rearFace + backHair(view, key) + face(view, key) + frontHair(view)
    + (view === 3 ? group('rear-ear',
      P('M30 50 Q34 49 38 53 L43 60 L46 65 Q44 69 39 70 Q34 67 31 61Z', grad('skin'), 'var(--ink)', .75)
      + ear(35.8, 56, -.8)
      + P('M29 45 Q35 46 34 53 Q34 58 37 59 Q31 60 30 53Z', grad('hair'), 'var(--hairDark)', .65)
      + P('M38 50 Q44 52 42 58 Q39 62 43 64 Q47 64 49 61 Q49 68 42 68 Q37 68 38 62Z', grad('hair'), 'var(--hairDark)', .65)
      + L('M41 54 Q43 58 40 61', 'var(--hairLight)', .7)) : '');
}

// 胴は腰を絞ってベルト下の裾まで描く。腕の境界線・肩の丸いパッチは描かない。
const TORSO = [
  'M53 77 Q63 75 74 77 Q82 79 83 85 L81 99 Q81 106 86 118 Q63 124 41 118 Q46 106 46 99 L44 86 Q44 81 53 77Z',
  'M56 76 Q66 73 77 78 Q83 81 82 87 L80 99 Q81 109 85 118 Q65 124 42 118 Q45 107 45 99 L43 88 Q43 81 56 76Z',
  'M62 75 Q74 75 78 79 Q83 82 81 89 L78 100 Q80 108 84 118 Q64 124 44 118 Q47 108 47 100 L48 86 Q51 80 62 75Z',
  'M50 76 Q62 74 74 77 Q82 79 83 85 L81 100 Q81 109 85 118 Q64 124 42 118 Q46 109 46 100 L43 85 Q43 80 50 76Z',
  'M51 77 Q63 75 75 77 Q82 79 83 86 L80 100 Q81 109 85 118 Q63 124 42 118 Q46 109 46 100 L44 86 Q44 80 51 77Z',
];
const NECK = [
  'M55 69 L72 69 L73 78 L64 85 L53 78Z',
  'M57 68 L71 64 L74 76 L57 85 L51 78Z',
  'M61 63 L72 62 L74 75 L56 83 L52 77Z',
  'M51 65 L72 66 L75 79 L49 80Z',
  'M53 66 L73 66 L75 79 L51 79Z',
];
const COLLAR = [
  'M54 75 L62 79 L63 84 L66 79 L72 75 L76 78 L73 82 L68 83 L63 89 L59 84 L52 82 L50 79Z',
  'M54 75 L58 79 L56 84 L62 80 L70 73 L75 76 L72 80 L63 83 L55 88 L53 83 L48 81Z',
  'M55 76 L66 71 L73 73 L78 78 L70 78 L57 83 L52 87 L52 81Z',
  'M47 77 Q60 73 74 77 L77 80 Q62 79 48 81Z',
  'M50 77 Q63 80 75 77 L77 80 Q63 84 48 80Z',
];
const APRON = [
  'M54 102 L72 102 L77 120 Q63 122 49 120Z',
  'M49 102 L66 103 L69 121 Q56 122 44 118Z',
  'M47 101 L55 104 L57 121 Q50 120 44 118Z',
];
const BELT = [
  'M46 98 Q63 101 81 98 L81.7 104 Q63 108 45.5 104Z',
  'M45 98 Q61 102 80 98 L81 104 Q61 108 45 104Z',
  'M47 98 Q61 102 78 98 L79 104 Q63 109 47 104Z',
  'M46 98 Q63 102 81 98 L81 104 Q63 108 46 104Z',
  'M46 99 Q63 102 80 99 L81 105 Q63 108 45 105Z',
];
function pouch(view, mirror) {
  // 左腰：正面では画面右、背面では画面左。右横・右斜め後ろは胴の向こうに隠れる。
  if (mirror && (view === 2 || view === 3)) return '';
  const [x, y, sx] = mirror ? [43.2, 100, -.45] : [[77, 100, .94], [73.5, 100, 1.05], [68, 100, 1.1], [44, 100, .85], [42, 101, .75]][view];
  return group('left-hip-pouch', `<g transform="translate(${x} ${y}) scale(${sx} 1)">
    ${P('M1-1 L3-1 L3 4 L1 4Z', 'var(--leather)', '#5b3e2c', .65)}
    ${P('M4-4 Q5-5 6-4 L6 7 L3.6 7Z', 'var(--ivory)', '#745543', .55)}
    ${P('M4-4 Q5-5.6 6-4 L6-2 L3.9-2Z', 'var(--pencil)', '#835448', .5)}
    ${L('M4.5-1 L4.5 5', 'var(--ivoryLight)', .4)}
    ${P('M-1 3 Q4 4 10 2 L11 16 Q6 20-2 17Z', grad('leather'), '#513c2e', .8)}
    ${P('M-1 3 Q4 4 10 2 L9.7 8 Q5 11-.8 8Z', grad('leather'), '#6a4b35', .65)}
    ${E(4.5, 8.5, .7, .7, 'var(--gold)')}
    ${L('M-.5 10 L-.6 16 Q5 18 9.5 16', 'var(--leatherLight)', .45)}
  </g>`);
}
function torso(view, key, mirror) {
  let svg = P(TORSO[view], grad('cloth'), '#303e3d', .9);
  svg += clipped(`cloth-${key}`, TORSO[view],
    P('M43 82 Q47 89 48 100 L45 117 L50 121 L39 123 L39 82Z', 'var(--clothDark)', 'none')
    + P('M80 80 L87 82 L87 124 L77 123 Q81 109 78 101 Q81 90 80 80Z', 'var(--clothDark)', 'none')
    + (view < 3 ? P(APRON[view], grad('ivory'), '#7f7864', .65) : '')
    + L('M46 117 Q63 122 82 117', 'var(--clothLight)', .55));
  svg += P(NECK[view], grad('skin'), '#805b40', .65)
    + P(COLLAR[view], grad('ivory'), '#665541', .75);
  if (view === 0) svg += L('M54 78 L60 81 M69 80 L73 78', '#bfa785', .55);
  if (view === 1) svg += L('M56 78 L54.5 82 M61 81 L71 76', '#bfa785', .55);
  if (view === 2) svg += L('M56 79 L68 75 L75 77', '#bfa785', .55);
  svg += P(BELT[view], grad('leather'), '#4c392b', .8)
    + L(view === 4 ? 'M47 100.5 Q63 103.5 79 100.5 M46 104 Q63 107 80 104' : 'M48 100 Q63 103 78 100 M47 103 Q63 106 79 103', '#bc9060', .45);
  if (view <= 2) {
    const [cx, half] = [[63, 4.9], [54, 4.6], [49.2, 2.3]][view];
    svg += `<g data-part="buckle" transform="translate(${cx} 103)">${P(`M${-half}-4 Q0-4.8 ${half}-4 L${half}3.6 Q0 4.3 ${-half}3.6Z`, grad('gold'), '#4d3c28', .75)}
      ${P(`M${-half + 1.2}-2.4 H${half - 1.2} V2 H${-half + 1.2}Z`, 'var(--leatherDark)', '#9a7a48', .4)}
      ${L(`M${-half + 1.1} 0 H1.2`, 'var(--goldLight)', .65)}</g>`;
  }
  return group('torso', svg + pouch(view, mirror));
}
export function asagiMarkup(direction, part = 'combined') {
  const index = DIRECTIONS.indexOf(direction);
  if (index < 0) throw Error(`Unknown direction: ${direction}`);
  if (!['combined', 'head', 'torso'].includes(part)) throw Error(`Unknown part: ${part}`);
  const mirror = index > 4, view = mirror ? 8 - index : index;
  const content = (part === 'head' ? '' : torso(view, direction, mirror)) + (part === 'torso' ? '' : head(view, direction));
  return `<g data-direction="${direction}"${mirror ? ' transform="translate(126.464 0) scale(-1 1)"' : ''}>${content}</g>`;
}
export function buildAsagiSheet(options = {}) {
  return buildSheet(options, DEFAULT_PALETTE, DEFS, asagiMarkup);
}
