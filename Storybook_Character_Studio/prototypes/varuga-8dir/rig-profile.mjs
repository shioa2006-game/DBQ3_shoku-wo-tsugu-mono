// Studio用の造形設定。ゲームの戦闘数値・頭別耐久は移植時に別途設定する。
export const VARUGA_PROFILE = Object.freeze({
  name: '三頭魔竜ヴァルガ', bodyScale: 2.1, headScale: 1.65,
  neckColor: 0x963e2c, tint: 0xffffff, hover: 1.5,
  metal: { specular: 0x795044, shininess: 32 },
  neckSegments: 32,
  wings: { span: 4.6, height: 3.1, flapSpeed: 2.3, membraneColor: 0x792d30, boneColor: 0x713b2a },
  heads: [
    { side: -2, forward: 2, up: 5.3, swoop: { period: 4.2, down: .20, forward: .12 } },
    { side: 0, forward: .8, up: 5.6, swoop: { period: 5.4, down: .18, forward: .10 } },
    { side: 2, forward: 2, up: 5.3, swoop: { period: 4.8, down: .20, forward: .12 } },
  ],
});
export const VARUGA_CONFIG = {
  ...VARUGA_PROFILE,
  headUrl: new URL('./output/varuga_code_head_8dir.png', import.meta.url).href,
  bodyUrl: new URL('./output/varuga_code_body_8dir.png', import.meta.url).href,
};
