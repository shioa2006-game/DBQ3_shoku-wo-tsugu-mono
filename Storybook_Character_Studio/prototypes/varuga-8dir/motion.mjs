// Studioの演出用タイミング。命中・ダメージ・AIとは分離する。
export const MOTIONS = Object.freeze({
  flight: { label: '飛行', duration: 0 },
  landing: { label: '着地する', duration: 2.6 },
  ground: { label: '地上待機', duration: 0 },
  bite: { label: '三頭の噛みつき', duration: 4.6 },
  flame: { label: '三頭の火炎', duration: 4.5 },
  air_flame: { label: '飛行中の火炎', duration: 4.5 },
});
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const ramp = (t, a, b) => smooth((t - a) / (b - a));

export function sampleMotion(mode, time) {
  if (!MOTIONS[mode]) throw new Error(`Unknown motion: ${mode}`);
  const t = Math.max(0, time);
  const state = { grounded: ['flight', 'air_flame'].includes(mode) ? 0 : 1, compression: 0,
    heads: Array.from({ length: 3 }, () => ({ forward: 0, down: 0, mouth: false, flame: null, fireTime: 0 })),
    phase: mode === 'flight' ? '飛行' : '待機', done: false };
  if (mode === 'landing') {
    state.grounded = ramp(t, 0, 1.6);
    state.compression = .13 * (ramp(t, 1.35, 1.65) - ramp(t, 1.65, 2.5));
    state.phase = t < 1.6 ? '降下・翼を畳む' : t < 2.5 ? '接地・踏ん張る' : '地上待機';
  }
  if (mode === 'bite') {
    // 左→中央→右。引く、突き出す、閉じる、戻すを頭ごとにずらす。
    state.heads.forEach((h, i) => {
      const u = t - i * 1.05;
      const windup = ramp(u, 0, .5) - ramp(u, .5, .72);
      const strike = ramp(u, .5, .72) - ramp(u, .9, 1.65);
      h.forward = -.45 * windup + 1.65 * strike;
      h.down = .18 * windup + 1.25 * strike;
      h.mouth = u > .2 && u < .84;
    });
    state.phase = t < 3.8 ? '左・中央・右の順に噛みつく' : '構えへ戻る';
  }
  if (mode === 'flame' || mode === 'air_flame') {
    const ready = ramp(t, 0, .7) - ramp(t, 3.2, 4.4);
    state.heads.forEach((h, i) => {
      const start = 1 + i * .18, end = 2.75 + i * .18;
      h.forward = .65 * ready; h.down = .7 * ready;
      h.flame = t >= .25 && t < start ? 'telegraph' : t >= start && t < end ? 'fire' : null;
      h.mouth = t > .55 && t < end + .15;
      h.fireTime = h.flame === 'fire' ? t - start : 0;
    });
    state.phase = t < 1 ? '口元に火を溜める' : t < 3.15 ? '三頭から火炎を吐く' : '構えへ戻る';
  }
  const duration = MOTIONS[mode].duration;
  state.done = duration > 0 && t >= duration;
  return state;
}
