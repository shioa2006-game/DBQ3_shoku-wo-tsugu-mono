// グロムの鱗・角・腹板の作画を継承。三頭の配置は rig-profile.mjs が担当する。
import { buildGromHeadSheet, buildGromBodySheet } from '../grom-8dir/character.mjs';
export { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';

// 外見確認用の試作色。ストーリー上の確定色ではない。
export const VARUGA_PALETTE = Object.freeze({
  ink: '#291516', scale: '#a2392b', scaleLight: '#f0aa7d', scaleDark: '#461c21',
  belly: '#b88744', bellyLight: '#f4d394', bellyDark: '#68462d',
  horn: '#a4a3ad', hornLight: '#faf1de', hornDark: '#494650',
  eye: '#ffc13c', eyeLight: '#fff6b7', pupil: '#210e0d', claw: '#d1c9c5',
});
// 鱗の面に細い明部を置き、赤銅の反射を表現する。流用元グロムの原本は変更しない。
const copperFinish = svg => svg.replace(/(<linearGradient id="scale"[^>]*>).*?(<\/linearGradient>)/,
  '$1<stop stop-color="var(--scaleLight)"/><stop offset=".28" stop-color="var(--scale)"/><stop offset=".43" stop-color="var(--scaleDark)"/><stop offset=".51" stop-color="var(--scaleLight)"/><stop offset=".64" stop-color="var(--scale)"/><stop offset="1" stop-color="var(--scaleDark)"/>$2');
export const buildVarugaHeadSheet = (options = {}) => copperFinish(buildGromHeadSheet({ ...options, palette: { ...VARUGA_PALETTE, ...options.palette } }));
export const buildVarugaBodySheet = (options = {}) => copperFinish(buildGromBodySheet({ ...options, palette: { ...VARUGA_PALETTE, ...options.palette } }));

// 開口は頭の輪郭内に描く。通常頭とセルの中心・下端を揃え、切り替えで頭を動かさない。
const mouths = [
  '<path d="M40 103 Q63 110 86 103 L80 116 Q63 122 46 116Z"/>',
  '<path d="M15 108 Q40 112 68 96 L66 107 Q42 122 20 117Z"/>',
  '<path d="M12 104 Q40 106 73 92 L73 105 Q42 119 14 114Z"/>',
  '<path d="M17 100 L30 103 L31 114 L22 112Z"/>',
  '',
];
const teeth = [
  'M45 106 L49 113 L53 108 M59 109 L63 115 L67 109 M74 108 L78 113 L82 106',
  'M21 110 L25 116 L29 111 M37 110 L42 116 L46 108 M53 105 L59 111 L62 101',
  'M18 106 L23 113 L28 107 M36 105 L42 112 L47 103 M56 100 L63 106 L67 96',
  'M20 102 L25 108 L28 104', '',
];
export const buildVarugaOpenHeadSheet = (options = {}) => {
  const svg = buildVarugaHeadSheet(options);
  const mouthsSvg = Array.from({ length: 8 }, (_, i) => {
    const mirror = i > 4, view = mirror ? 8 - i : i;
    return `<g transform="translate(${i % 4 * 128} ${Math.floor(i / 4) * 128})"><g ${mirror ? 'transform="translate(126 0) scale(-1 1)"' : ''}><g fill="#271117" stroke="var(--ink)" stroke-width="1">${mouths[view]}</g><path d="${teeth[view]}" fill="var(--hornLight)" stroke="var(--hornDark)" stroke-width=".6"/></g></g>`;
  }).join('');
  return svg.replace('</svg>', `${mouthsSvg}</svg>`);
};
