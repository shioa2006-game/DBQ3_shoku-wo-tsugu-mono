// ダーマ再興編の固定 New Game 状態（docs/DESIGN.md の「1. 開始状態」）。
// ジパング復興編・火山島編（第1〜5章）の正史を踏まえ、CH6_ARRIVAL から開始する。
// 第1〜5章のセーブは読まない。火山島で打った鉄の装備と、ベルクが持たせた船荷を持つ。
export const NEW_GAME_STATE = {
  stage: "CH6_ARRIVAL",
  // 夜明けの海から着岸した朝。
  hour: 9,
  // [itemId, count]
  items: [
    ["hammer_iron", 1], // 基本道具（採取・瓦礫の除去・神殿の石）
    ["sword_iron", 1], // ベルクと打った鉄の剣
    ["iron_armor", 1], // 鉄の胸あて（持っているだけで効く）
    ["herb", 6],
    ["onigiri", 6],
    ["torch", 8],
    ["iron", 8], // 船荷: ベルクの鉄
    ["iron_fitting", 4],
  ],
  // 職業の書は六冊とも読める（jobs.js の startRevived）。新しい書は復活しない。
};
