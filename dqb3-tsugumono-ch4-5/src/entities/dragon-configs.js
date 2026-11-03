// ドラゴンごとの設定。共通リグ（dragon.js）へは埋め込まず、ここで差し替える。
// 第6〜7章リポジトリのヴァルガは、同じ形式の設定（翼あり・単頭など）を追加する。

// 頭・胴は Storybook Character Studio でコードから描いた画像（docs/CHARACTER_ART.md）。
const GROM_HEAD = new URL("../../assets/dragons/grom_code_head_8dir.png", import.meta.url).href;
const GROM_BODY = new URL("../../assets/dragons/grom_code_body_8dir.png", import.meta.url).href;

// 瘴泉竜グロム: 二つの頭と長い首、左右の翼を持つ双頭の翼竜。
// 低空を羽ばたきながら泉の上を漂う。「無銘の主」が清めの泉を汚すために
// 放った眷属（第5章の章ボス）。
export const GROM_CONFIG = {
  name: "瘴泉竜グロム",
  headUrl: GROM_HEAD,
  bodyUrl: GROM_BODY,
  // 胴体は小さめにして、翼と尾のシルエットを主役にする。
  bodyScale: 1.6,
  headScale: 1.5,
  neckColor: 0x2a3350,
  tint: 0xffffff,
  // 飛行: 足元中心を地面からこの高さに浮かせる（0なら地上型）。
  hover: 1.5,
  // 翼（3D。コウモリ型: 前縁の腕骨＋3本の指＋スカラップの膜）。
  wings: { span: 3.8, height: 2.6, flapSpeed: 3.0, membraneColor: 0x3a4666, boneColor: 0x161d30 },
  // 頭の取り付け位置（胴体の足元中心からのオフセット）。side=右手方向、
  // forward=向いている方向、up=高さ。細長い首がここまで伸びる。
  // lunge（噛みつきの踏み込み）は forward に足される。
  // swoop = 首のうねり（前方斜め下へ下がって戻る周期運動）。頭ごとに周期を
  // 変えて、二つの頭が別々に動くようにする。
  heads: [
    { side: -1.4, forward: 0.9, up: 2.6, swoop: { period: 3.2, down: 0.9, forward: 0.6 } }, // 左の頭
    { side: 1.4, forward: 0.9, up: 2.6, swoop: { period: 4.5, down: 0.9, forward: 0.6 } }, // 右の頭
  ],
  // 戦闘値（dragon-battle.js が使う）。
  battle: {
    headHp: 60, // 左右それぞれの頭の耐久
    walkSpeed: 1.6, // 低空での滑空移動
    // 火炎: 予兆 → 前方への吐射。左右の頭が交互に使う。
    flame: { interval: 5.0, telegraph: 1.3, duration: 1.2, range: 8.5, halfAngle: 0.5, damage: 5 },
    // 噛みつき: 近づいた相手へ首を伸ばす攻撃。
    bite: { range: 3.4, damage: 4, cooldown: 2.2, lunge: 1.2 },
    contactRange: 1.8, // 胴体の体当たり判定（胴体を小さくしたぶん狭める）
    contactDamage: 3,
  },
};
