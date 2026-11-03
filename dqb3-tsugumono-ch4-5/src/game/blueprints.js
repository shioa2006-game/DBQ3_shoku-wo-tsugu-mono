import { defineBlueprintManager } from "../../../game-shared/blueprints.mjs";
import * as THREE from "three";
import { B } from "../world/blocks.js";
import { itemForBlock } from "./items.js";

// Blueprint cell lists are generated relative to an anchor (min x/z corner) and
// a base y resolved from the terrain when the blueprint activates.
//
// 第4章の施設: 海岸拠点の小屋 / 鉱山入口 / 炭焼き窯 / 鍛冶場 / 火山灰畑。
// 第5章の宿坊・薬草園・竹林の門は第5章実装時にここへ追加する。

function coastCampCells() {
  // 海岸拠点: 小屋（壁・扉・屋根・ベッド2）＋外の作業台・収納箱・灯り。
  const cells = [];
  const W = 4, D = 3, H = 2;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      for (let z = 0; z < D; z += 1) {
        const border = x === 0 || x === W - 1 || z === 0 || z === D - 1;
        if (!border) continue;
        const isDoor = x === 1 && z === D - 1; // front-center opening
        if (isDoor) {
          if (y === 0) cells.push({ dx: x, dy: 0, dz: z, block: B.DOOR });
          continue; // y=1 above the door stays open
        }
        cells.push({ dx: x, dy: y, dz: z, block: B.PLANK });
      }
    }
  }
  // Roof.
  for (let x = 0; x < W; x += 1) {
    for (let z = 0; z < D; z += 1) {
      cells.push({ dx: x, dy: H, dz: z, block: B.PLANK });
    }
  }
  // Interior beds.
  cells.push({ dx: 1, dy: 0, dz: 1, block: B.BED });
  cells.push({ dx: 2, dy: 0, dz: 1, block: B.BED });
  // 外の仕事場（作業台・収納箱・たいまつ）。
  cells.push({ dx: 5, dy: 0, dz: 1, block: B.WORKBENCH });
  cells.push({ dx: 5, dy: 0, dz: 2, block: B.CHEST });
  cells.push({ dx: -1, dy: 0, dz: 2, block: B.TORCH });
  cells.push({ dx: 5, dy: 0, dz: 0, block: B.TORCH });
  return cells;
}

function mineEntranceCells() {
  // 鉱山入口: 坑道の口（x23..24）を挟む支柱と梁、鬼火のかけらの坑道灯。
  // アンカー (22,36) 基準で、支柱は坑口の両脇 dx0/dx3・dz1(z37) に立つ。
  const cells = [];
  for (const dx of [0, 3]) {
    cells.push({ dx, dy: 0, dz: 1, block: B.LOG });
    cells.push({ dx, dy: 1, dz: 1, block: B.LOG });
  }
  for (let dx = 0; dx <= 3; dx += 1) {
    cells.push({ dx, dy: 2, dz: 1, block: B.PLANK }); // 梁
  }
  cells.push({ dx: 0, dy: 3, dz: 1, block: B.MINE_LAMP });
  cells.push({ dx: 3, dy: 3, dz: 1, block: B.MINE_LAMP });
  // 前庭の足元灯。
  cells.push({ dx: 1, dy: 0, dz: 0, block: B.TORCH });
  cells.push({ dx: 2, dy: 0, dz: 0, block: B.TORCH });
  return cells;
}

function kilnSiteCells() {
  // 炭焼き窯: 石の土間 3×3 の中央に窯。薪置きの丸太と灯り。
  const cells = [];
  for (let z = 0; z < 3; z += 1) {
    for (let x = 0; x < 3; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.STONE }); // 土間（地面に埋め込む）
    }
  }
  cells.push({ dx: 1, dy: 0, dz: 1, block: B.KILN });
  cells.push({ dx: 3, dy: 0, dz: 0, block: B.LOG }); // 薪置き
  cells.push({ dx: 3, dy: 0, dz: 1, block: B.LOG });
  cells.push({ dx: -1, dy: 0, dz: 1, block: B.TORCH });
  return cells;
}

function forgeCells() {
  // 鍛冶場: 5×4。石の土間、北の壁、炉・金床（ベルクの金床を取り込む）・水桶。
  // アンカー (25,21) 基準。金床セル (dx1,dz2) は生成済みの金床と一致し、
  // 設計図を広げた時点で「完成済み」になる（壊された場合だけ作り直す）。
  const cells = [];
  for (let z = 0; z < 4; z += 1) {
    for (let x = 0; x < 5; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.STONE }); // 土間
    }
  }
  for (let x = 0; x < 5; x += 1) cells.push({ dx: x, dy: 0, dz: 0, block: B.WALL }); // 北の壁
  cells.push({ dx: 0, dy: 1, dz: 0, block: B.WALL });
  cells.push({ dx: 4, dy: 1, dz: 0, block: B.WALL });
  cells.push({ dx: 2, dy: 0, dz: 1, block: B.FORGE }); // 炉
  cells.push({ dx: 1, dy: 0, dz: 2, block: B.ANVIL }); // 金床（生成済み）
  cells.push({ dx: 3, dy: 0, dz: 2, block: B.TROUGH }); // 水桶
  cells.push({ dx: 0, dy: 0, dz: 3, block: B.TORCH });
  cells.push({ dx: 4, dy: 0, dz: 3, block: B.TORCH });
  return cells;
}

function canteenCells() {
  // 鉱山町の食堂: 板の間・北の壁・ちゃぶ台・灯り。中央に共同鍛造で打った
  // 鉄鍋を据える（クラフトした鉄鍋そのものが設計図の1マスに納まる）。
  // 骨格は第2章でイナホと建てた村の食堂と同じ＝暮らしの継承を画で見せる。
  // 生成済みの焼け跡の壁が footprint に重なり、赤ゴースト＝ハンマー撤去を誘導する。
  const cells = [];
  for (let z = 0; z < 4; z += 1) {
    for (let x = 0; x < 5; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.PLANK }); // 板の間
    }
  }
  for (let x = 0; x < 5; x += 1) cells.push({ dx: x, dy: 0, dz: 0, block: B.WALL });
  cells.push({ dx: 0, dy: 1, dz: 0, block: B.WALL });
  cells.push({ dx: 4, dy: 1, dz: 0, block: B.WALL });
  cells.push({ dx: 2, dy: 0, dz: 1, block: B.IRON_POT }); // ベルクと打った鉄鍋
  cells.push({ dx: 2, dy: 0, dz: 2, block: B.TABLE });
  cells.push({ dx: 0, dy: 0, dz: 2, block: B.TORCH });
  cells.push({ dx: 4, dy: 0, dz: 2, block: B.TORCH });
  return cells;
}

function ashFarmCells() {
  // 火山灰畑: カヤの種をまく 3×3 の畑。柵で囲い、南に出入り口を開ける。
  const cells = [];
  for (let z = 0; z < 3; z += 1) {
    for (let x = 0; x < 3; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.FARMLAND }); // 地面に埋め込む
    }
  }
  for (let x = -1; x <= 3; x += 1) {
    cells.push({ dx: x, dy: 0, dz: -1, block: B.FENCE });
    if (x !== 1) cells.push({ dx: x, dy: 0, dz: 3, block: B.FENCE }); // 南中央は出入り口
  }
  for (let z = 0; z < 3; z += 1) {
    cells.push({ dx: -1, dy: 0, dz: z, block: B.FENCE });
    cells.push({ dx: 3, dy: 0, dz: z, block: B.FENCE });
  }
  return cells;
}

// --- 第5章「眠る竹林の社」 -----------------------------------------------------------

function bambooGateCells() {
  // 竹林の門: 峠の巻き道の封鎖跡（黒竹・落石）に建てる。竹の門柱と梁、
  // 峠を照らす坑道灯。封鎖の黒竹が footprint 内に残り、鉄の山刀で払う。
  const cells = [];
  for (const dx of [0, 4]) {
    for (let dy = 0; dy < 3; dy += 1) cells.push({ dx, dy, dz: 1, block: B.BAMBOO });
  }
  for (let dx = 0; dx <= 4; dx += 1) cells.push({ dx, dy: 3, dz: 1, block: B.PLANK }); // 梁
  cells.push({ dx: 1, dy: 4, dz: 1, block: B.MINE_LAMP });
  cells.push({ dx: 3, dy: 4, dz: 1, block: B.MINE_LAMP });
  return cells;
}

function lodgeCells() {
  // 宿坊: 病人が安全に休める療養所。板の間・壁・寝床3・囲炉裏・薬棚・灯り。
  const cells = [];
  for (let z = 0; z < 4; z += 1) {
    for (let x = 0; x < 5; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.PLANK }); // 板の間
    }
  }
  for (let x = 0; x < 5; x += 1) {
    cells.push({ dx: x, dy: 0, dz: 0, block: B.WALL });
    if (x !== 2) cells.push({ dx: x, dy: 0, dz: 3, block: B.WALL }); // 南中央は入り口
  }
  for (let z = 1; z < 3; z += 1) {
    cells.push({ dx: 0, dy: 0, dz: z, block: B.WALL });
    cells.push({ dx: 4, dy: 0, dz: z, block: B.WALL });
  }
  cells.push({ dx: 2, dy: 0, dz: 3, block: B.DOOR });
  cells.push({ dx: 1, dy: 0, dz: 1, block: B.BED }); // 寝床
  cells.push({ dx: 2, dy: 0, dz: 1, block: B.BED });
  cells.push({ dx: 3, dy: 0, dz: 1, block: B.BED });
  cells.push({ dx: 1, dy: 0, dz: 2, block: B.KAMADO }); // 囲炉裏（薬を温める）
  cells.push({ dx: 3, dy: 0, dz: 2, block: B.CHEST }); // 薬棚
  cells.push({ dx: 0, dy: 1, dz: 0, block: B.TORCH });
  cells.push({ dx: 4, dy: 1, dz: 0, block: B.TORCH });
  return cells;
}

function herbGardenCells() {
  // 薬草園: 宿坊の隣。薬草の畑と、南の泉から将来水を引く竹の水路の終端。
  const cells = [];
  for (let z = 0; z < 3; z += 1) {
    for (let x = 0; x < 3; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.FARMLAND });
    }
  }
  cells.push({ dx: 3, dy: -1, dz: 1, block: B.BAMBOO_CHANNEL }); // 水路の終端
  cells.push({ dx: 3, dy: -1, dz: 2, block: B.BAMBOO_CHANNEL });
  cells.push({ dx: 3, dy: 0, dz: 0, block: B.TROUGH }); // 貯水
  for (let x = -1; x <= 2; x += 1) cells.push({ dx: x, dy: 0, dz: -1, block: B.FENCE });
  for (let z = 0; z < 3; z += 1) cells.push({ dx: -1, dy: 0, dz: z, block: B.FENCE });
  return cells;
}

function outerShrineCells() {
  // 外社: 生成済みの石畳と鳥居を取り込み、拝殿（壁・かやぶき）、祭壇、
  // 手水舎、灯りを立て直す。
  const cells = [];
  for (let z = 0; z < 3; z += 1) {
    for (let x = 0; x < 5; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.STONE }); // 石畳（生成済み＝完成扱い）
    }
  }
  for (const dx of [0, 4]) {
    cells.push({ dx, dy: 0, dz: 0, block: B.WALL });
    cells.push({ dx, dy: 1, dz: 0, block: B.WALL });
  }
  for (let x = 0; x < 5; x += 1) cells.push({ dx: x, dy: 2, dz: 0, block: B.THATCH }); // 屋根
  cells.push({ dx: 2, dy: 0, dz: 0, block: B.ALTAR }); // 祭壇
  cells.push({ dx: 4, dy: 0, dz: 2, block: B.TROUGH }); // 手水舎
  cells.push({ dx: 0, dy: 0, dz: 2, block: B.MINE_LAMP });
  cells.push({ dx: 2, dy: 0, dz: 4, block: B.TORII }); // 参道の鳥居（生成済み＝完成扱い）
  return cells;
}

function springWorksCells() {
  // 泉の祭壇・水門・導水路: グロム撃破後に修復する。祭壇と石の基壇、
  // 泉の縁の水門（水桶）、北へ延びる竹の導水路。
  const cells = [];
  for (let x = 1; x <= 3; x += 1) {
    for (let z = 5; z <= 6; z += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.STONE }); // 基壇
    }
  }
  cells.push({ dx: 2, dy: 0, dz: 5, block: B.ALTAR }); // 泉の祭壇
  cells.push({ dx: 2, dy: 0, dz: 6, block: B.TROUGH }); // 水門
  cells.push({ dx: 1, dy: 0, dz: 6, block: B.MINE_LAMP });
  cells.push({ dx: 3, dy: 0, dz: 6, block: B.MINE_LAMP });
  for (let z = 0; z <= 4; z += 1) {
    cells.push({ dx: 2, dy: -1, dz: z, block: B.BAMBOO_CHANNEL }); // 北への導水路
  }
  return cells;
}

export const BLUEPRINTS = {
  coast_camp: { name: "海岸拠点", build: coastCampCells },
  mine_entrance: { name: "鉱山入口", build: mineEntranceCells },
  kiln_site: { name: "炭焼き窯", build: kilnSiteCells },
  forge: { name: "鍛冶場", build: forgeCells },
  ash_farm: { name: "火山灰畑", build: ashFarmCells },
  canteen: { name: "鉱山町の食堂", build: canteenCells },
  bamboo_gate: { name: "竹林の門", build: bambooGateCells },
  lodge: { name: "宿坊", build: lodgeCells },
  herb_garden: { name: "薬草園", build: herbGardenCells },
  outer_shrine: { name: "外社", build: outerShrineCells },
  spring_works: { name: "泉の祭壇と水門", build: springWorksCells },
};

const GHOST_COLORS = {
  [B.WALL]: 0xf2ecdc,
  [B.PLANK]: 0xc99c5f,
  [B.DOOR]: 0x8a5a2c,
  [B.FENCE]: 0x8a5a2c,
  [B.BED]: 0xc2a557,
  [B.FARMLAND]: 0x6d4a28,
  [B.STONE]: 0x8b9196,
  [B.LOG]: 0x7c5730,
  [B.THATCH]: 0xc2a557,
  [B.ALTAR]: 0x9fd8ff,
  [B.TORII]: 0xc23b2a,
  [B.TORCH]: 0xffb347,
  [B.MINE_LAMP]: 0x9fd8ff,
  [B.WORKBENCH]: 0xc99c5f,
  [B.CHEST]: 0x8a5a2c,
  [B.KILN]: 0x4a4a50,
  [B.FORGE]: 0xff7a3d,
  [B.ANVIL]: 0x5d6166,
  [B.TROUGH]: 0x8a5a2c,
  [B.KAMADO]: 0x8b9196,
  [B.IRON_POT]: 0x5d6166,
  [B.TABLE]: 0xc99c5f,
  [B.BAMBOO]: 0x7fae4e,
  [B.BAMBOO_CHANNEL]: 0x4a8cdd,
};

export const BlueprintManager = defineBlueprintManager({
  THREE, blocks: B, blueprints: BLUEPRINTS, ghostColors: GHOST_COLORS, itemForBlock,
});
