// このムービーに登場する人物と向き（shared/cast.mjs への依頼）と、ヴァルガの書き出す方向。build.mjs とテストが使う。
//   正面: 朝の神殿の前に集まる九人（第3場面）
//   ヴァルガ: 地上へ落ちた竜の胴と三つの頭（第1場面。頭は正面と左右の斜め前）
export const CAST = {
  hero2: ['front'], mina: ['front'], gonta: ['front'], watari: ['front'], pino: ['front'], belk: ['front'],
  suzuha: ['front'], asagi: ['front'], ganzou: ['front'],
};
export const VARGA = ['front', 'front_left', 'front_right'];
