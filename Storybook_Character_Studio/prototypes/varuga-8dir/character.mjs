// グロムの鱗・角・腹板の作画を継承。三頭の配置は rig-profile.mjs が担当する。
import { buildGromHeadSheet, buildGromBodySheet } from '../grom-8dir/character.mjs';
export { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';

// 外見確認用の試作色。ストーリー上の確定色ではない。
export const VARUGA_PALETTE = Object.freeze({
  ink: '#211a2b', scale: '#4d3b60', scaleLight: '#806b91', scaleDark: '#2b2339',
  belly: '#b3955c', bellyLight: '#dbc28a', bellyDark: '#76603d',
  horn: '#b4a794', hornLight: '#eee0bf', hornDark: '#75695e',
  eye: '#ec9d31', eyeLight: '#ffe5a3', pupil: '#210e0d', claw: '#d6c7a6',
});
export const buildVarugaHeadSheet = (options = {}) => buildGromHeadSheet({ ...options, palette: { ...VARUGA_PALETTE, ...options.palette } });
export const buildVarugaBodySheet = (options = {}) => buildGromBodySheet({ ...options, palette: { ...VARUGA_PALETTE, ...options.palette } });
