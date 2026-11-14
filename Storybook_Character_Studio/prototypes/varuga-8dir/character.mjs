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
