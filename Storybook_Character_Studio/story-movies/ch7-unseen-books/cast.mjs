// このムービーに登場する人物と向き（shared/cast.mjs への依頼）。build.mjs とテストが使う。
//   正面: 神殿のスズハ・アサギ・ガンゾウ（第1場面）、船の上の六人（第2・5場面）、ジパングのピノ・イナホ・ジンベエ（第3場面）、
//         火山島のベルク・ナギ・カヤ・ロク・ヨモギ（第4場面）
//   後ろ姿: 桟橋で見送るスズハ・アサギ・ガンゾウ（第2場面）
export const CAST = {
  hero2: ['front'], mina: ['front'], gonta: ['front'], watari: ['front'], pino: ['front'], belk: ['front'],
  suzuha: ['front', 'back'], asagi: ['front', 'back'], ganzou: ['front', 'back'],
  inaho: ['front'], jinbei: ['front'], nagi: ['front'], kaya: ['front'], roku: ['front'], yomogi: ['front'],
};
