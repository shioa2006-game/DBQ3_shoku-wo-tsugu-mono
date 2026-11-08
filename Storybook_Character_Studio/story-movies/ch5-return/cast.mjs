// このムービーに登場する人物と向き（shared/cast.mjs への依頼）。build.mjs とテストが使う。
//   正面: 町の人々（第2場面）、船の上の四人（第3場面）
//   背面: 桟橋から船を見送るベルク・ナギ・カヤの後ろ姿（第3場面）
export const CAST = {
  hero2: ['front'], mina: ['front'], gonta: ['front'], watari: ['front'],
  belk: ['front', 'back'], nagi: ['front', 'back'], yomogi: ['front'],
  roku: ['front'], kaya: ['front', 'back'], sumi: ['front'], teru: ['front'],
};
