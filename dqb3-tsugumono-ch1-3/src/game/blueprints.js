import { defineBlueprintManager } from "../../../game-shared/blueprints.mjs";
import * as THREE from "three";
import { B } from "../world/blocks.js";
import { itemForBlock } from "./items.js";

// Blueprint cell lists are generated relative to an anchor (min x/z corner) and
// a base y resolved from the terrain when the blueprint activates.

function hutCells() {
  const cells = [];
  const W = 4, D = 3, H = 2; // outer footprint, wall height
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
        cells.push({ dx: x, dy: y, dz: z, block: B.WALL });
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
  return cells;
}

function farmCells() {
  const cells = [];
  for (let x = 0; x < 4; x += 1) {
    for (let z = 0; z < 3; z += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.FARMLAND }); // sunk into the ground
    }
  }
  cells.push({ dx: 4, dy: 0, dz: 1, block: B.SCARECROW });
  return cells;
}

function shrineCells() {
  const cells = [];
  const W = 5, D = 4;
  for (let x = 0; x < W; x += 1) {
    for (let z = 0; z < D; z += 1) {
      cells.push({ dx: x, dy: 0, dz: z, block: B.STONE }); // raised platform
    }
  }
  for (const [x, z] of [[0, 0], [W - 1, 0], [0, D - 1], [W - 1, D - 1]]) {
    cells.push({ dx: x, dy: 1, dz: z, block: B.LOG });
    cells.push({ dx: x, dy: 2, dz: z, block: B.LOG });
  }
  for (let x = 0; x < W; x += 1) {
    for (let z = 0; z < D; z += 1) {
      cells.push({ dx: x, dy: 3, dz: z, block: B.THATCH });
    }
  }
  cells.push({ dx: 2, dy: 1, dz: 1, block: B.ALTAR });
  cells.push({ dx: 2, dy: 0, dz: D + 1, block: B.TORII }); // gate in front
  // たいまつは土台より1列手前(dz=D)に立つので、真下に石を敷いて浮きを防ぐ。
  cells.push({ dx: 0, dy: 0, dz: D, block: B.STONE });
  cells.push({ dx: W - 1, dy: 0, dz: D, block: B.STONE });
  cells.push({ dx: 0, dy: 1, dz: D, block: B.TORCH });
  cells.push({ dx: W - 1, dy: 1, dz: D, block: B.TORCH });
  return cells;
}

// --- 第2章 -----------------------------------------------------------------------

function bridgeCells() {
  // A richer bridge to the south island. The walkable deck stays two blocks wide;
  // rails and supports sit outside the deck so they do not narrow the path.
  const cells = [];
  const W = 2;
  const D = 16;

  for (let z = 0; z < D; z += 1) {
    for (let x = 0; x < W; x += 1) {
      cells.push({ dx: x, dy: 0, dz: z, block: B.PLANK });
    }
  }

  for (let z = 0; z < D; z += 1) {
    cells.push({ dx: -1, dy: 1, dz: z, block: B.FENCE });
    cells.push({ dx: W, dy: 1, dz: z, block: B.FENCE });
  }

  for (const z of [0, 4, 8, 12, D - 1]) {
    for (const x of [-1, W]) {
      cells.push({ dx: x, dy: 0, dz: z, block: B.LOG });
    }
  }

  for (const z of [3, 7, 11]) {
    for (const x of [-1, W]) {
      for (const dy of [-3, -2, -1, 0]) {
        cells.push({ dx: x, dy, dz: z, block: B.LOG });
      }
    }
  }

  return cells;
}

function paddyCells() {
  // 用水路の列（dz0: 生成時に残った断片はそのまま「完成済み」になる）と、
  // その南の田んぼ 8×4。どちらも地面の天面(dy-1)に埋め込む。
  const cells = [];
  for (let x = 0; x < 15; x += 1) {
    cells.push({ dx: x, dy: -1, dz: 0, block: B.WATERWAY });
  }
  for (let z = 2; z <= 5; z += 1) {
    for (let x = 1; x <= 8; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.FARMLAND });
    }
  }
  return cells;
}

function kitchenCells() {
  // 村の食堂: 板の間・かまど・ちゃぶ台・灯り・北側の壁。生成済みの廃屋の壁の
  // 一部はそのまま「完成済み」になり、要求と違う残骸は赤ゴースト＝ハンマーで
  // 撤去する流れを自然に教える。
  const cells = [];
  for (let z = 0; z < 4; z += 1) {
    for (let x = 0; x < 5; x += 1) {
      cells.push({ dx: x, dy: -1, dz: z, block: B.PLANK }); // 板の間
    }
  }
  for (let x = 0; x < 5; x += 1) cells.push({ dx: x, dy: 0, dz: 0, block: B.WALL });
  cells.push({ dx: 0, dy: 1, dz: 0, block: B.WALL });
  cells.push({ dx: 4, dy: 1, dz: 0, block: B.WALL });
  cells.push({ dx: 2, dy: 0, dz: 1, block: B.KAMADO });
  cells.push({ dx: 2, dy: 0, dz: 2, block: B.TABLE });
  cells.push({ dx: 0, dy: 0, dz: 2, block: B.TORCH });
  cells.push({ dx: 4, dy: 0, dz: 2, block: B.TORCH });
  return cells;
}

// --- 第3章「旅立ちの港」-----------------------------------------------------------

function pierCells() {
  // 海峡へ south に伸びる 2×11 の板の桟橋（桁 y=4 固定）。船（西舷に横付け）に
  // 沿って走り、そのまま乗船通路になる。浜側にかかるマスは地面と重なれば
  // 赤ゴースト＝ハンマーで撤去する流れ（食堂と同じ作法）。
  const cells = [];
  const W = 2, D = 11;
  for (let z = 0; z < D; z += 1) {
    for (let x = 0; x < W; x += 1) {
      cells.push({ dx: x, dy: 0, dz: z, block: B.PLANK });
    }
  }
  // 先端の灯り。
  cells.push({ dx: 0, dy: 1, dz: D - 1, block: B.TORCH });
  cells.push({ dx: W - 1, dy: 1, dz: D - 1, block: B.TORCH });
  return cells;
}

function lighthouseCells() {
  // 石積みの塔＋頂上の灯。夜、海峡を照らす港の目印。
  const cells = [];
  const H = 6;
  for (let y = 0; y < H; y += 1) {
    for (const [x, z] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      cells.push({ dx: x, dy: y, dz: z, block: B.STONE });
    }
  }
  // 灯室と灯り。
  for (const [x, z] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    cells.push({ dx: x, dy: H, dz: z, block: B.PLANK });
  }
  cells.push({ dx: 0, dy: H + 1, dz: 0, block: B.TORCH });
  cells.push({ dx: 1, dy: H + 1, dz: 1, block: B.TORCH });
  return cells;
}

// 船は 5×9（dx0..4 × dz0..8、dz8=南=船首）。桟橋(東側)の西舷に横付けする。
// 各 dz 行の甲板幅（船首に向けて先細り）。
const SHIP_ROW = (dz) => (dz <= 6 ? [0, 4] : dz === 7 ? [1, 3] : [2, 2]);

function shipHullCells() {
  // 船体（第1段階）: 板の甲板（船首テーパー付き）＋タール塗り外板の舷側。
  // 海面 y=4 に浮かぶ。東舷 dz2 は桟橋への乗船口として開けてある。
  const cells = [];
  for (let dz = 0; dz <= 8; dz += 1) {
    const [a, b] = SHIP_ROW(dz);
    for (let dx = a; dx <= b; dx += 1) cells.push({ dx, dy: 0, dz, block: B.PLANK }); // 甲板
    for (const dx of new Set([a, b])) {
      if (dx === 4 && dz === 2) continue; // 乗船口（桟橋と同じ高さで歩いて渡れる）
      cells.push({ dx, dy: 1, dz, block: B.SHIPWALL }); // 舷側
    }
  }
  for (let dx = 1; dx <= 3; dx += 1) cells.push({ dx, dy: 1, dz: 0, block: B.SHIPWALL }); // 船尾の横板
  cells.push({ dx: 2, dy: 2, dz: 8, block: B.SHIPWALL }); // へさきの立ち上がり
  return cells;
}

function shipMastCells() {
  // 帆柱と艤装（第2段階）: 6段の帆柱＋帆桁、一段高い船尾楼、舵輪、船尾灯。
  const cells = [];
  for (let dy = 1; dy <= 6; dy += 1) cells.push({ dx: 2, dy, dz: 5, block: B.LOG }); // 帆柱
  cells.push({ dx: 1, dy: 6, dz: 5, block: B.PLANK }); // 帆桁
  cells.push({ dx: 3, dy: 6, dz: 5, block: B.PLANK });
  for (let dx = 1; dx <= 3; dx += 1) cells.push({ dx, dy: 1, dz: 1, block: B.PLANK }); // 船尾楼の床
  cells.push({ dx: 2, dy: 2, dz: 1, block: B.HELM }); // 舵輪（銅の金具）
  cells.push({ dx: 0, dy: 2, dz: 0, block: B.TORCH }); // 船尾灯
  cells.push({ dx: 4, dy: 2, dz: 0, block: B.TORCH });
  return cells;
}

function shipSailCells() {
  // 帆（第3段階）: 帆柱の前(dz4)に張る 5×4 の大きな帆。帆布＋ロープで仕立てる。
  const cells = [];
  for (let dy = 2; dy <= 5; dy += 1) {
    for (let dx = 0; dx <= 4; dx += 1) {
      cells.push({ dx, dy, dz: 4, block: B.SAIL });
    }
  }
  return cells;
}

export const BLUEPRINTS = {
  hut: { name: "ちいさな小屋", build: hutCells },
  farm: { name: "はじまりの畑", build: farmCells },
  shrine: { name: "職業の社", build: shrineCells },
  bridge: { name: "南へ渡る橋", build: bridgeCells },
  paddy: { name: "田んぼと用水路", build: paddyCells },
  kitchen: { name: "村の食堂とかまど", build: kitchenCells },
  pier: { name: "港の桟橋", build: pierCells },
  lighthouse: { name: "港の灯台", build: lighthouseCells },
  ship_hull: { name: "船体", build: shipHullCells },
  ship_mast: { name: "帆柱", build: shipMastCells },
  ship_sail: { name: "帆", build: shipSailCells },
};

const GHOST_COLORS = {
  [B.WALL]: 0xf2ecdc,
  [B.PLANK]: 0xc99c5f,
  [B.DOOR]: 0x8a5a2c,
  [B.FENCE]: 0x8a5a2c,
  [B.BED]: 0xc2a557,
  [B.FARMLAND]: 0x6d4a28,
  [B.SCARECROW]: 0xc2a557,
  [B.STONE]: 0x8b9196,
  [B.LOG]: 0x7c5730,
  [B.THATCH]: 0xc2a557,
  [B.ALTAR]: 0x9fd8ff,
  [B.TORII]: 0xc23b2a,
  [B.TORCH]: 0xffb347,
  [B.WATERWAY]: 0x4a8cdd,
  [B.KAMADO]: 0x8b9196,
  [B.TABLE]: 0xc99c5f,
  [B.SAIL]: 0xf3efe4,
  [B.SHIPWALL]: 0x5a3f24,
  [B.HELM]: 0xd9b545,
};

export const BlueprintManager = defineBlueprintManager({
  THREE, blocks: B, blueprints: BLUEPRINTS, ghostColors: GHOST_COLORS, itemForBlock,
});
