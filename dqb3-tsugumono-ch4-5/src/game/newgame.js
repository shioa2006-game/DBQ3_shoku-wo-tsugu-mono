// 火山島編の固定 New Game 状態。
// 本島編（第1〜3章）の正史を組み込み、CH4_ARRIVAL から開始する。
// 長い航海で本島の資材は使い切っており、開始直後の採取と戦闘が可能な
// 最低限の固定装備だけを持つ（実装ガイド 5 章）。
export const NEW_GAME_STATE = {
  stage: "CH4_ARRIVAL",
  // 第4章導入に適した朝の固定時刻。
  hour: 9,
  // [itemId, count]
  items: [
    ["hammer_stone", 1], // 基本道具（採取・落石の除去）
    ["sword_copper", 1], // 基本武器（ジパングで打った銅の剣）
    ["herb", 4], // 少量の食料
    ["onigiri", 4],
    ["torch", 4],
  ],
  // 復活済みの書は jobs.js の startRevived で定義する
  // （ビルダー・農民・料理人・船乗り = true / 鍛冶屋・僧侶 = false）。
};
