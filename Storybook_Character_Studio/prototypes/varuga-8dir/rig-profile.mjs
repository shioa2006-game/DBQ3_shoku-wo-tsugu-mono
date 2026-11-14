// Studio用の造形設定。ゲームの戦闘数値・頭別耐久は移植時に別途設定する。
export const VARUGA_PROFILE = Object.freeze({
  name: '三頭魔竜ヴァルガ', bodyScale: 2.1, headScale: 1.65,
  neckColor: 0x4d3b60, tint: 0xffffff, hover: 1.5,
  wings: { span: 4.6, height: 3.1, flapSpeed: 2.3, membraneColor: 0x69506f, boneColor: 0x30263c },
  heads: [
    { side: -2.6, forward: 2.2, up: 2.7, swoop: { period: 4.2, down: .28, forward: .18 } },
    { side: 0, forward: -1, up: 4.3, swoop: { period: 5.4, down: .24, forward: .15 } },
    { side: 2.6, forward: 2.2, up: 2.7, swoop: { period: 4.8, down: .28, forward: .18 } },
  ],
});
export const VARUGA_CONFIG = {
  ...VARUGA_PROFILE,
  headUrl: new URL('./output/varuga_code_head_8dir.png', import.meta.url).href,
  bodyUrl: new URL('./output/varuga_code_body_8dir.png', import.meta.url).href,
};
