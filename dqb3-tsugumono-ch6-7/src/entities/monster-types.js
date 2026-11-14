// ダーマ再興編のモンスターの種類と数値（docs/DESIGN.md の「6. 敵」）。行動は monsters.js。
// 画像は Storybook Character Studio の出力（assets/nonhumanoids/）。
//   sheets: { main: [A, B] } のほか、状態ごとの絵（flight: 飛行、attack: 攻撃）を持つ敵がある。
// 敵は8種: 岩角ヤギ・山ねずみ（山道）、小岩ガニ・洞窟こうもり（採石洞）、大岩ガニ（第6章ボス）、
// ガーゴイル・岩砕きのガーゴイル（第7章の防衛）、三頭魔竜ヴァルガ（第7章ボス。dragon-configs.js）。

const NONHUMANOIDS = (file) => new URL(`../../assets/nonhumanoids/${file}`, import.meta.url).href;
const pair = (art) => [NONHUMANOIDS(`${art}_code_idle_a_8dir.png`), NONHUMANOIDS(`${art}_code_idle_b_8dir.png`)];

export const MONSTER_TYPES = {
  rock_goat: {
    // 岩角ヤギ: 足を踏み鳴らしてから短く突進。かわした後に隙ができる。
    name: "岩角ヤギ",
    sheets: { main: pair("rockhorn_goat") },
    hp: 16, atk: 3, scale: 1.05, flying: false, aggro: 8, speed: 2.4,
    drops: [["hide", 1, 1], ["meat", 0, 1]],
    tint: 0xffffff,
    ai: "charge",
    charge: { range: 5.5, windup: 0.8, dash: 0.7, speed: 9, damage: 5, recover: 1.2, cooldown: 2.2 },
  },
  mountain_rat: {
    // 山ねずみ: おおねずみの色替え（灰褐色）。素早く群れ、探索や採集を妨げる。
    name: "山ねずみ",
    sheets: { main: pair("field_rat") },
    hp: 5, atk: 2, scale: 0.8, flying: false, aggro: 7, speed: 3.8,
    drops: [["nuts", 0, 1], ["straw", 0, 1]],
    tint: 0xb9b0a2,
    pack: 3,
  },
  rock_crab: {
    // 小岩ガニ: 近づくとハサミを上げて構える。正面は硬い。大岩ガニの予告。
    name: "小岩ガニ",
    sheets: { main: pair("small_rock_crab") },
    hp: 12, atk: 3, scale: 0.95, flying: false, aggro: 6, speed: 2.0,
    drops: [["crab_meat", 1, 1], ["stone", 0, 1]],
    tint: 0xffffff,
    ai: "guard",
    armored: true,
  },
  cave_bat: {
    // 洞窟こうもり: おおこうもりの色替え（青みの灰色）。坑道で近づいてくる。
    name: "洞窟こうもり",
    sheets: { main: pair("night_bat") },
    hp: 7, atk: 3, scale: 0.85, flying: true, aggro: 7, speed: 3.0,
    drops: [["wing", 1, 2]],
    tint: 0x9fb4d8,
  },
  great_rock_crab: {
    // 第6章ボス: 大岩ガニ。小岩ガニと同じ造形の大型版（3倍）。積み石に紛れ、爪を振り下ろす。
    name: "大岩ガニ",
    sheets: { main: pair("small_rock_crab") },
    hp: 150, atk: 5, scale: 3.0, flying: false, aggro: 30, speed: 1.5,
    drops: [["crab_meat", 4, 6], ["dharma_stone", 6, 8]],
    tint: 0xe8e2d6,
    boss: true,
    ai: "slam",
    armored: true,
    slam: { range: 4.2, windup: 1.1, halfAngle: 1.0, damage: 8, recover: 1.6, cooldown: 1.2 },
  },
  gargoyle: {
    // ガーゴイル: ヴァルガの先兵。海を越えて飛来し、着地して群れで進軍する。
    name: "ガーゴイル",
    sheets: { main: pair("gargoyle_ground"), flight: pair("gargoyle_flight") },
    hp: 20, atk: 4, scale: 1.0, flying: false, aggro: 6, speed: 2.5,
    drops: [["stone", 0, 1]],
    tint: 0xffffff,
    ai: "gargoyle",
  },
  gargoyle_crusher: {
    // 岩砕きのガーゴイル: 大型・重装。門・防壁・神殿の壁の前で振りかぶり、砕く。
    name: "岩砕きのガーゴイル",
    sheets: { main: pair("gargoyle_heavy_ground"), flight: pair("gargoyle_heavy_flight"), attack: pair("gargoyle_heavy_attack") },
    hp: 56, atk: 6, scale: 1.3, flying: false, aggro: 4, speed: 1.7,
    drops: [["stone", 1, 2], ["iron_ore", 0, 1]],
    tint: 0xffffff,
    ai: "crusher",
    smash: { windup: 0.9, damage: 25 },
  },
};

// 通常の出現の抽選（zone: "cave" | "slope"）。
export function pickAmbientType(zone, isNight) {
  if (zone === "cave") return Math.random() < 0.6 ? "rock_crab" : "cave_bat";
  return Math.random() < (isNight ? 0.3 : 0.45) ? "rock_goat" : "mountain_rat";
}
