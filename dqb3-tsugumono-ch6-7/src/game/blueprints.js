import { defineBlueprintManager } from "../../../game-shared/blueprints.mjs";
import * as THREE from "three";
import { B } from "../world/blocks.js";
import { FLOOR_Y, PLACES, TEMPLE_BASE_GAPS, TEMPLE_BASE_RUBBLE, TERRACE_Y, CAVE_LOWER_Y, CAVE_UPPER_Y } from "../world/world.js";
import { itemForBlock } from "./items.js";

// ダーマ再興編の設計図。マスはすべてワールドの絶対座標で書き、アンカー (0,0)・基準高さ 0 で
// 広げる（main.js の activateBlueprint）。寸法と形は docs/DESIGN.md の「3. 神殿の形」「4. 建築」。
export const BLUEPRINT_ORIGIN = { x: 0, z: 0 };

const cell = (x, y, z, block) => ({ dx: x, dy: y, dz: z, block });

// --- 第6章 ---------------------------------------------------------------------------

function slopeBridgeCells() {
  // 水運びの橋: 谷（z70..73）に渡す幅5の板の橋。両端の列に手すり。
  const cells = [];
  const y = PLACES.bridgeDeckY;
  for (let z = 70; z <= 73; z += 1) {
    for (let x = 30; x <= 34; x += 1) cells.push(cell(x, y, z, B.PLANK));
    cells.push(cell(30, y + 1, z, B.FENCE));
    cells.push(cell(34, y + 1, z, B.FENCE));
  }
  return cells;
}

function commonHutCells() {
  // 共同小屋: 屋根・寝床2・かまどのある小屋と、外の作業台・資材置き場の収納箱。
  // のちに「書庫と共同台所」で軒を足して共同台所へ広げる。
  const cells = [];
  const { x: x0, z: z0 } = PLACES.hut; // 5×4（x37..41, z40..43）
  const y = TERRACE_Y;
  for (let dz = 0; dz < 4; dz += 1) {
    for (let dx = 0; dx < 5; dx += 1) {
      const border = dx === 0 || dx === 4 || dz === 0 || dz === 3;
      if (border) {
        const isDoor = dx === 2 && dz === 3; // 南の中央が戸口
        if (isDoor) cells.push(cell(x0 + dx, y, z0 + dz, B.DOOR));
        else {
          cells.push(cell(x0 + dx, y, z0 + dz, B.PLANK));
          cells.push(cell(x0 + dx, y + 1, z0 + dz, B.PLANK));
        }
      }
      cells.push(cell(x0 + dx, y + 2, z0 + dz, B.THATCH));
    }
  }
  cells.push(cell(x0 + 1, y, z0 + 1, B.BED));
  cells.push(cell(x0 + 3, y, z0 + 1, B.BED));
  cells.push(cell(x0 - 1, y, z0 + 2, B.KAMADO)); // 小屋の西の炊事場
  cells.push(cell(PLACES.siteChest.x, y, PLACES.siteChest.z, B.CHEST)); // 資材置き場
  cells.push(cell(PLACES.siteChest.x + 1, y, PLACES.siteChest.z, B.WORKBENCH));
  cells.push(cell(x0 - 4, y, z0 + 3, B.TORCH));
  cells.push(cell(x0 + 5, y, z0 + 4, B.TORCH));
  return cells;
}

function templeBaseCells() {
  // 基壇と石段: 欠けたマスへ石を補い、食い込んだ瓦礫（赤い枠）をどけて据え直す。
  return [...TEMPLE_BASE_GAPS, ...TEMPLE_BASE_RUBBLE].map(([x, y, z]) => cell(x, y, z, B.DHARMA_STONE));
}

function quarryScaffoldCells() {
  // 採石洞の足場: 4段の落差に板の階段（x7..9）を組み、上と下に灯りを置く。
  const cells = [];
  const L = CAVE_LOWER_Y;
  for (let x = 7; x <= 9; x += 1) {
    cells.push(cell(x, L + 2, 27, B.PLANK));
    cells.push(cell(x, L + 1, 26, B.PLANK));
    cells.push(cell(x, L, 25, B.PLANK));
  }
  for (const x of [7, 9]) {
    cells.push(cell(x, L, 27, B.LOG));
    cells.push(cell(x, L + 1, 27, B.LOG));
    cells.push(cell(x, L, 26, B.LOG));
  }
  cells.push(cell(7, CAVE_UPPER_Y, 28, B.TORCH));
  cells.push(cell(9, L, 24, B.TORCH));
  return cells;
}

function quarryBridgeCells() {
  // 採石洞の橋: 地の裂け目（z12..15）へ幅2の板を渡し、両岸に灯り。
  const cells = [];
  const y = CAVE_LOWER_Y - 1;
  for (let z = 12; z <= 15; z += 1) {
    cells.push(cell(7, y, z, B.PLANK));
    cells.push(cell(8, y, z, B.PLANK));
  }
  cells.push(cell(9, CAVE_LOWER_Y, 16, B.TORCH));
  cells.push(cell(6, CAVE_LOWER_Y, 11, B.TORCH));
  return cells;
}

function haulRoadCells() {
  // 搬出路: 橋を幅3に広げて下に丸太を通し、足場の階段を丸太で埋めて、大きな要石が通る道にする。
  const cells = [];
  const L = CAVE_LOWER_Y;
  for (let z = 12; z <= 15; z += 1) cells.push(cell(9, L - 1, z, B.PLANK));
  cells.push(cell(8, L - 2, 12, B.LOG));
  cells.push(cell(8, L - 2, 15, B.LOG));
  cells.push(cell(8, L, 27, B.LOG));
  cells.push(cell(8, L + 1, 27, B.LOG));
  cells.push(cell(8, L, 26, B.LOG));
  return cells;
}

// 正面（南面 z35）の柱の位置。中央（x32）は入口なので柱を立てず、x30・x34 は古い柱が残る。
const NEW_PILLAR_X = [24, 26, 28, 36, 38, 40];
const FRONT_BAY_X = [25, 27, 29, 35, 37, 39];
const WINDOW_Y = FLOOR_Y + 2;

function templeFrameCells() {
  // 柱と壁: 新しい柱6本、柱の間の壁（窓あき）、入口のアーチ、東西と北の壁、横の入口の扉。
  const cells = [];
  const y0 = FLOOR_Y, y1 = FLOOR_Y + 3;
  for (const x of NEW_PILLAR_X) {
    for (let y = y0; y <= y1; y += 1) cells.push(cell(x, y, 35, B.DHARMA_PILLAR));
  }
  for (const x of FRONT_BAY_X) {
    for (let y = y0; y <= y1; y += 1) {
      if (y !== WINDOW_Y) cells.push(cell(x, y, 35, B.DHARMA_STONE));
    }
  }
  // 入口のアーチ（幅3・高さ3。上の両肩を石で丸める）。
  cells.push(cell(31, y0 + 2, 35, B.DHARMA_STONE));
  cells.push(cell(33, y0 + 2, 35, B.DHARMA_STONE));
  for (let x = 31; x <= 33; x += 1) cells.push(cell(x, y1, 35, B.DHARMA_STONE));
  // 西の壁（窓2つ）と東の壁（窓2つ・横の入口）。
  for (let z = 26; z <= 34; z += 1) {
    for (let y = y0; y <= y1; y += 1) {
      const westWindow = y === WINDOW_Y && (z === 29 || z === 32);
      if (!westWindow) cells.push(cell(24, y, z, B.DHARMA_STONE));
      const sideDoor = z === PLACES.sideDoor.z && y <= y0 + 1;
      const eastWindow = y === WINDOW_Y && (z === 28 || z === 34);
      if (!sideDoor && !eastWindow) cells.push(cell(40, y, z, B.DHARMA_STONE));
    }
  }
  cells.push(cell(PLACES.sideDoor.x, y0, PLACES.sideDoor.z, B.DOOR));
  // 北の壁（窓2つ）。
  for (let x = 25; x <= 39; x += 1) {
    for (let y = y0; y <= y1; y += 1) {
      const window = y === WINDOW_Y && (x === 28 || x === 36);
      if (!window) cells.push(cell(x, y, 26, B.DHARMA_STONE));
    }
  }
  return cells;
}

// 大屋根の層（下から）。寄棟: 軒は壁から1マス張り出し、上の層ほど内へ寄る。
const ROOF_LAYERS = [
  { y: FLOOR_Y + 5, x0: 23, x1: 41, z0: 25, z1: 36 },
  { y: FLOOR_Y + 6, x0: 25, x1: 39, z0: 27, z1: 34 },
  { y: FLOOR_Y + 7, x0: 27, x1: 37, z0: 29, z1: 32 },
];

function templeRoofCells() {
  // 梁と大屋根: 壁の上の梁（木材）、板葺きの三層と棟、四隅の反り、正面の破風と書の紋章、軒の提灯。
  const cells = [];
  const beamY = FLOOR_Y + 4;
  for (let x = 24; x <= 40; x += 1) {
    cells.push(cell(x, beamY, 26, B.LOG));
    cells.push(cell(x, beamY, 35, B.LOG));
  }
  for (let z = 27; z <= 34; z += 1) {
    for (const x of [24, 28, 32, 36, 40]) cells.push(cell(x, beamY, z, B.LOG));
  }
  ROOF_LAYERS.forEach((layer, i) => {
    const inner = ROOF_LAYERS[i + 1];
    for (let z = layer.z0; z <= layer.z1; z += 1) {
      for (let x = layer.x0; x <= layer.x1; x += 1) {
        if (inner && x >= inner.x0 && x <= inner.x1 && z >= inner.z0 && z <= inner.z1) continue;
        cells.push(cell(x, layer.y, z, B.ROOF));
      }
    }
  });
  // 棟。
  for (let x = 28; x <= 36; x += 1) {
    cells.push(cell(x, FLOOR_Y + 8, 30, B.ROOF));
    cells.push(cell(x, FLOOR_Y + 8, 31, B.ROOF));
  }
  // 四隅の反り。
  for (const [x, z] of [[23, 25], [41, 25], [23, 36], [41, 36]]) cells.push(cell(x, FLOOR_Y + 6, z, B.ROOF));
  // 正面の破風（入口の上）と職業の書の紋章。
  for (const x of [31, 33]) {
    cells.push(cell(x, FLOOR_Y + 6, 36, B.ROOF));
    cells.push(cell(x, FLOOR_Y + 6, 35, B.ROOF));
  }
  cells.push(cell(32, FLOOR_Y + 6, 36, B.EMBLEM));
  cells.push(cell(32, FLOOR_Y + 6, 35, B.ROOF));
  cells.push(cell(32, FLOOR_Y + 7, 36, B.ROOF));
  cells.push(cell(32, FLOOR_Y + 7, 35, B.ROOF));
  // 軒の提灯（南の軒の下）。
  for (const x of [23, 25, 27, 29, 35, 37, 39, 41]) cells.push(cell(x, FLOOR_Y + 4, 36, B.LANTERN));
  return cells;
}

function altarCells() {
  // 要石の祭壇: 下の段の中央に要石、その上に授職の灯。奥に一段。祭壇の東に選択の柱。
  const { x, z } = PLACES.altar;
  return [
    cell(x - 1, FLOOR_Y, z, B.DHARMA_STONE),
    cell(x + 1, FLOOR_Y, z, B.DHARMA_STONE),
    cell(x - 1, FLOOR_Y, z - 1, B.DHARMA_STONE),
    cell(x, FLOOR_Y, z - 1, B.DHARMA_STONE),
    cell(x + 1, FLOOR_Y, z - 1, B.DHARMA_STONE),
    cell(x, FLOOR_Y + 1, z - 1, B.DHARMA_STONE),
    cell(x, FLOOR_Y, z, B.KEYSTONE),
    cell(x, FLOOR_Y + 1, z, B.FLAME_BOWL),
  ];
}

function altarKeystoneCells() {
  return [...altarCells(), cell(PLACES.pillar.x, FLOOR_Y, PLACES.pillar.z, B.SELECT_PILLAR0)];
}

function templeLivingCells() {
  // 横の入口と水場: 東の肩から横の入口へ、段差のない渡り廊下。水場の水桶。本堂の東に休める部屋。
  const cells = [];
  for (let z = 30; z <= 32; z += 1) {
    cells.push(cell(41, FLOOR_Y - 1, z, B.PLANK));
    cells.push(cell(42, FLOOR_Y - 1, z, B.PLANK));
    cells.push(cell(42, FLOOR_Y - 2, z, B.PLANK));
    cells.push(cell(43, FLOOR_Y - 1, z, B.PLANK));
  }
  cells.push(cell(43, FLOOR_Y - 3, 31, B.LOG));
  cells.push(cell(43, FLOOR_Y - 2, 31, B.LOG));
  cells.push(cell(44, FLOOR_Y, 29, B.TROUGH)); // 水場
  cells.push(cell(44, FLOOR_Y, 33, B.TORCH));
  for (const x of [37, 38, 39]) cells.push(cell(x, FLOOR_Y, 27, B.BED)); // 休める部屋
  cells.push(cell(38, FLOOR_Y, 29, B.TABLE));
  cells.push(cell(36, FLOOR_Y + 3, 28, B.LANTERN));
  return cells;
}

function templeLibraryCells() {
  // 書庫と共同台所: 本堂の西の壁ぞいに本棚と机。共同小屋の炊事場に軒を足し、かまどと食卓を増やす。
  const cells = [];
  for (const z of [27, 28, 30, 31, 33, 34]) {
    cells.push(cell(25, FLOOR_Y, z, B.BOOKSHELF));
    cells.push(cell(25, FLOOR_Y + 1, z, B.BOOKSHELF));
  }
  cells.push(cell(26, FLOOR_Y, 29, B.TABLE));
  cells.push(cell(26, FLOOR_Y, 32, B.TABLE));
  cells.push(cell(28, FLOOR_Y + 3, 30, B.LANTERN));
  const y = TERRACE_Y;
  for (const z of [41, 44]) {
    cells.push(cell(34, y, z, B.LOG));
    cells.push(cell(34, y + 1, z, B.LOG));
  }
  for (let z = 41; z <= 44; z += 1) {
    for (let x = 34; x <= 36; x += 1) cells.push(cell(x, y + 2, z, B.THATCH));
  }
  cells.push(cell(35, y, 42, B.KAMADO));
  cells.push(cell(35, y, 44, B.TABLE));
  cells.push(cell(36, y, 44, B.TABLE));
  return cells;
}

// --- 第7章 ---------------------------------------------------------------------------

function defenseLineCells() {
  // 山道の防衛線: 道の口（z51）に丸太の防壁と門。内側に台を置いたボウガン2基、外側にとげ罠。
  const cells = [];
  const y = TERRACE_Y;
  const { x: gx, z: gz } = PLACES.gate;
  for (let x = 28; x <= 36; x += 1) {
    if (x === gx) continue;
    cells.push(cell(x, y, gz, B.PALISADE));
    cells.push(cell(x, y + 1, gz, B.PALISADE));
  }
  cells.push(cell(gx, y, gz, B.GATE));
  for (const x of [30, 34]) {
    cells.push(cell(x, y, gz - 1, B.PALISADE));
    cells.push(cell(x, y + 1, gz - 1, B.CROSSBOW_S));
  }
  // とげ罠は門のすぐ前ではなく、1段下の道（z53・z54）へ。門をかじる敵が乗り続けないよう、
  // 通り抜けるときに1度ずつ踏む位置にする。
  for (let x = 31; x <= 33; x += 1) {
    cells.push(cell(x, y - 1, gz + 2, B.SPIKES));
    cells.push(cell(x, y - 1, gz + 3, B.SPIKES));
  }
  return cells;
}

function ballistaTowerCells() {
  // ピノの射台: 前庭の西の、高さ2の木組みの台（3×3）。東に階段、北と西に手すり。
  const cells = [];
  const { x: x0, z: z0 } = PLACES.tower;
  const y = TERRACE_Y;
  for (const [dx, dz] of [[0, 0], [2, 0], [0, 2], [2, 2]]) {
    cells.push(cell(x0 + dx, y, z0 + dz, B.LOG));
    cells.push(cell(x0 + dx, y + 1, z0 + dz, B.LOG));
  }
  for (let dz = 0; dz < 3; dz += 1) {
    for (let dx = 0; dx < 3; dx += 1) cells.push(cell(x0 + dx, y + 2, z0 + dz, B.PLANK));
  }
  cells.push(cell(x0 + 3, y, z0 + 2, B.PLANK)); // 階段（1段目）
  cells.push(cell(x0 + 3, y, z0 + 1, B.PLANK));
  cells.push(cell(x0 + 3, y + 1, z0 + 1, B.PLANK)); // 2段目
  for (const [dx, dz] of [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]]) cells.push(cell(x0 + dx, y + 3, z0 + dz, B.FENCE));
  return cells;
}

// 射台の上の、大型対空ボウガンを据えるマス。
export const BALLISTA_CELL = { x: PLACES.tower.x + 1, y: TERRACE_Y + 3, z: PLACES.tower.z + 1 };

function greatBallistaCells() {
  return [cell(BALLISTA_CELL.x, BALLISTA_CELL.y, BALLISTA_CELL.z, B.GREAT_BALLISTA)];
}

// 神殿の修理（修復ガイド）: 戦いで壊れ得る建物をまとめて1枚の設計図にする。
// 壊れていないマスは完成済みとして隠れるので、足りないブロックだけが半透明の枠で出る。
// どの建物を含めるかは、進行に合わせて setRepairParts で切り替える。
const REPAIR_PART_BUILDERS = {
  frame: templeFrameCells,
  roof: templeRoofCells,
  altar: altarCells,
  defense: defenseLineCells,
  tower: ballistaTowerCells,
  ballista: greatBallistaCells,
};
let repairParts = ["frame", "roof", "altar"];
export function setRepairParts(parts) {
  repairParts = parts.filter((p) => REPAIR_PART_BUILDERS[p]);
}
export function repairCells(parts = repairParts) {
  return parts.flatMap((p) => REPAIR_PART_BUILDERS[p]());
}

function templeRepairCells() {
  return repairCells();
}

function reopenRepairCells() {
  // 神殿の再開: 住民を迎えるのに最低限要る、祭壇と正面の入口（アーチ・その上の梁と破風）。
  const cells = [...altarCells()];
  const y0 = FLOOR_Y, y1 = FLOOR_Y + 3;
  cells.push(cell(31, y0 + 2, 35, B.DHARMA_STONE));
  cells.push(cell(33, y0 + 2, 35, B.DHARMA_STONE));
  for (let x = 31; x <= 33; x += 1) {
    cells.push(cell(x, y1, 35, B.DHARMA_STONE));
    cells.push(cell(x, y1 + 1, 35, B.LOG));
  }
  for (const x of [31, 33]) cells.push(cell(x, FLOOR_Y + 6, 36, B.ROOF));
  cells.push(cell(32, FLOOR_Y + 6, 36, B.EMBLEM));
  return cells;
}

// 入口のアーチ（最終決戦の最期のあがきで崩れる場所）。quests7.js が使う。
export const ENTRANCE_ARCH_CELLS = [
  [31, FLOOR_Y + 2, 35, B.DHARMA_STONE], [33, FLOOR_Y + 2, 35, B.DHARMA_STONE],
  [31, FLOOR_Y + 3, 35, B.DHARMA_STONE], [32, FLOOR_Y + 3, 35, B.DHARMA_STONE], [33, FLOOR_Y + 3, 35, B.DHARMA_STONE],
];

export const BLUEPRINTS = {
  slope_bridge: { name: "水運びの橋", build: slopeBridgeCells },
  common_hut: { name: "共同小屋", build: commonHutCells },
  temple_base: { name: "基壇と石段", build: templeBaseCells },
  quarry_scaffold: { name: "採石洞の足場", build: quarryScaffoldCells },
  quarry_bridge: { name: "採石洞の橋", build: quarryBridgeCells },
  haul_road: { name: "搬出路", build: haulRoadCells },
  temple_frame: { name: "柱と壁", build: templeFrameCells },
  temple_roof: { name: "梁と大屋根", build: templeRoofCells },
  altar_keystone: { name: "要石の祭壇", build: altarKeystoneCells },
  temple_living: { name: "横の入口と水場", build: templeLivingCells },
  temple_library: { name: "書庫と共同台所", build: templeLibraryCells },
  defense_line: { name: "山道の防衛線", build: defenseLineCells },
  ballista_tower: { name: "ピノの射台", build: ballistaTowerCells },
  great_ballista: { name: "大型対空ボウガン", build: greatBallistaCells },
  temple_repair: { name: "神殿の修理", build: templeRepairCells },
  reopen_repair: { name: "神殿の再開", build: reopenRepairCells },
};

// 大工たち（ピノ・アサギ・ガンゾウ）が資材置き場の資材で手伝う設計図。
export const CREW_BLUEPRINTS = new Set(["temple_base", "temple_frame", "temple_roof", "temple_repair", "reopen_repair"]);

// 大屋根のマス（ヴァルガの火炎が焼く対象。上の層から順に調べる）。
export function roofCellList() {
  return templeRoofCells().filter((c) => c.block === B.ROOF || c.block === B.EMBLEM).map((c) => ({ x: c.dx, y: c.dy, z: c.dz, block: c.block }));
}

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
  [B.TORCH]: 0xffb347,
  [B.WORKBENCH]: 0xc99c5f,
  [B.CHEST]: 0x8a5a2c,
  [B.KILN]: 0x4a4a50,
  [B.FORGE]: 0xff7a3d,
  [B.ANVIL]: 0x5d6166,
  [B.TROUGH]: 0x8a5a2c,
  [B.KAMADO]: 0x8b9196,
  [B.TABLE]: 0xc99c5f,
  [B.DHARMA_STONE]: 0xe4dccb,
  [B.DHARMA_PILLAR]: 0xf6f0e2,
  [B.ROOF]: 0x8a5a36,
  [B.EMBLEM]: 0xd9b545,
  [B.LANTERN]: 0xffd98a,
  [B.BOOKSHELF]: 0x7c5730,
  [B.KEYSTONE]: 0x9fb0bf,
  [B.FLAME_BOWL]: 0xff9a3a,
  [B.SELECT_PILLAR0]: 0xddd4c2,
  [B.PALISADE]: 0x7c5730,
  [B.GATE]: 0x5a3f24,
  [B.CROSSBOW_S]: 0xaeb6bb,
  [B.SPIKES]: 0xaeb6bb,
  [B.GREAT_BALLISTA]: 0x5d6166,
};

export const BlueprintManager = defineBlueprintManager({
  THREE, blocks: B, blueprints: BLUEPRINTS, ghostColors: GHOST_COLORS, itemForBlock,
});
