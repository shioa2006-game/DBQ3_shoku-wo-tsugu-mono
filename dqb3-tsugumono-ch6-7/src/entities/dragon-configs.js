// ドラゴンの設定。共通リグ（dragon.js）へは埋め込まず、ここで差し替える。
//
// 三頭魔竜ヴァルガ: 造形の値（頭の配置・倍率・色・翼）は Storybook Character Studio の
// prototypes/varuga-8dir/rig-profile.mjs（VARUGA_PROFILE）と同じにする（Studioのテストが確かめる）。
// 頭・開口頭・胴は Studio でコードから描いた画像（docs/CHARACTER_ART.md）。
// 戦闘値（battle）はこのゲームのもの（docs/DESIGN.md の「9. ヴァルガ戦」）。

const DRAGONS = (file) => new URL(`../../assets/dragons/${file}`, import.meta.url).href;

export const VARUGA_CONFIG = {
  name: "三頭魔竜ヴァルガ", bodyScale: 2.1, headScale: 1.65,
  neckColor: 0x963e2c, tint: 0xffffff, hover: 1.5,
  metal: { specular: 0x795044, shininess: 32 },
  neckSegments: 32,
  wings: { span: 4.6, height: 3.1, flapSpeed: 2.3, membraneColor: 0x792d30, boneColor: 0x713b2a },
  heads: [
    { side: -2, forward: 2, up: 5.3, swoop: { period: 4.2, down: 0.2, forward: 0.12 } },
    { side: 0, forward: 0.8, up: 5.6, swoop: { period: 5.4, down: 0.18, forward: 0.1 } },
    { side: 2, forward: 2, up: 5.3, swoop: { period: 4.8, down: 0.2, forward: 0.12 } },
  ],
  headUrl: DRAGONS("varuga_code_head_8dir.png"),
  bodyUrl: DRAGONS("varuga_code_body_8dir.png"),
  openHeadUrl: DRAGONS("varuga_code_head_open_8dir.png"),
  headNames: ["左の頭", "中央の頭", "右の頭"],
  // 戦闘値（varuga-battle.js が使う）。
  battle: {
    flyHeight: 8, // 飛んでいるときの、前庭からの高さ
    flySpeed: 3.2,
    // 空からの火炎（屋根・射台を狙う）。予告 → 吐射。
    airFlame: { interval: 6.5, telegraph: 1.2, radius: 2.6, roofBurn: 7, altarDamage: 14, playerDamage: 6 },
    // 初襲来: 低く降りた首（噛みつき）。この間だけ頭を攻撃できる。
    swoop: { duration: 3.2, damage: 5, range: 2.6, staggerHp: 40 },
    firstVolleyBurn: 11, // 最初の一吹きで必ず焼ける屋根板の数
    // 最終決戦・対空: 翼に当てる大矢の数。
    wingHits: 5,
    // 最終決戦・地上: 頭ごとの耐久と攻撃。
    headHp: [80, 100, 80],
    bite: { interval: 7.5, damage: 6, range: 3.0 },
    groundFlame: { interval: 9, sweepDamage: 5, sweepRange: 9, sweepHalfAngle: 0.55, focusAltarDamage: 12, focusBurn: 3 },
    contactRange: 2.2,
    contactDamage: 4,
  },
};
