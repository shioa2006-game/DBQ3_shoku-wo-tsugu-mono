// このムービーに登場する人物と向き（shared/cast.mjs への依頼）。build.mjs とテストが使う。
//   正面: 桟橋で見送る三人（第2場面）、船の上の四人（第3場面）
//   背面: 桟橋から船を見送る三人の後ろ姿（第3場面）
export const CAST = {
  hero2: ['front'], mina: ['front'], gonta: ['front'], watari: ['front'],
  pino: ['front', 'back'], inaho: ['front', 'back'], jinbei: ['front', 'back'],
};
