import { B, BLOCK_DEFS, isSolidFor } from "./blocks.js";
import { mulberry32, clamp, lerp } from "../core/utils.js";

// ダーマの島（第6〜7章の共通マップ）。docs/DESIGN.md の「2. マップ」を参照。
// 南（z大）が海、北（z小）へ山が続く。海岸の桟橋から麓の集落、水運びの坂道、
// 神殿の台地へ登る。採石洞は台地の西の山腹の中にある。
export const WORLD = {
  W: 64, // x (west -> east)
  D: 120, // z (north -> south)
  H: 40, // y
  WATER_LEVEL: 3, // top water cell
  SEED: 20261114,
  // ワールド生成の世代番号。セーブは「生成直後(pristine)との差分」を flat index [i, id] で
  // 保存するため、generate() の出力が変わる変更を入れたら必ずこれを上げること。
  GEN_VERSION: 1,
};

// 本堂の床（基壇の上の段の上面）と、台地の高さ。
export const FLOOR_Y = 19;
export const TERRACE_Y = 16;
// 採石洞の床（上の坑道 / 下の坑道と採石場）。
export const CAVE_UPPER_Y = 16;
export const CAVE_LOWER_Y = 12;

// Landmark positions the story references (kept in one place).
export const PLACES = {
  // --- 海岸と麓の集落 ---------------------------------------------------------------
  spawn: { x: 32, z: 99 }, // 上陸地点（桟橋のたもとの砂浜。桟橋の陰に隠れないよう、少し陸側）
  pier: { x: 31, z: 102 }, // 桟橋（x31..33、z102..113）
  ship: { x: 26, z: 105 }, // ワタリの船（5×9・船首は南）。桟橋の西に係留（既定のカメラは南東から見るので、東に置くと視界をふさぐ）
  watariPost: { x: 33, z: 102 }, // 船番のワタリの持ち場（桟橋のたもと）
  village: { x: 31, z: 92 }, // 集落の中心（井戸）
  suzuhaHome: { x: 33, z: 95 }, // スズハと出会う場所（坂道の入口）
  // --- 水運びの坂道 -----------------------------------------------------------------
  bridge: { x: 30, z: 70 }, // 橋の設計図アンカー（谷 z70..73）
  bridgeDeckY: 10, // 橋板のブロックの y（上に立つと 11）
  landing: { x: 32, z: 58 }, // 山道の踊り場（第7章でガーゴイルが着地する）
  gate: { x: 32, z: 51 }, // 防衛線の門
  // --- 神殿の台地 -------------------------------------------------------------------
  forecourt: { x: 32, z: 44 }, // 前庭の中央
  hut: { x: 37, z: 40 }, // 共同小屋の設計図アンカー（5×4）
  siteChest: { x: 36, z: 45 }, // 資材置き場の収納箱（共同小屋の設計図に含む）
  banner: { x: 34, z: 47 }, // 職業の旗
  tower: { x: 20, z: 42 }, // ピノの射台の設計図アンカー（3×3）
  temple: { x: 22, z: 24 }, // 基壇の北西の角（外の段）
  entrance: { x: 32, z: 35 }, // 正面の入口
  altar: { x: 32, z: 28 }, // 祭壇（要石）
  pillar: { x: 35, z: 28 }, // 選択の柱
  sideDoor: { x: 40, z: 31 }, // 横の入口
  shoulder: { x: 46, z: 32 }, // 東の肩（横の入口へ続く高い道）
  // --- 採石洞 -----------------------------------------------------------------------
  caveMouth: { x: 16, z: 34 }, // 入口（前庭の西の崖）
  scaffold: { x: 7, z: 25 }, // 足場の設計図アンカー
  caveBridge: { x: 7, z: 12 }, // 洞窟の橋の設計図アンカー
  quarry: { x: 9, z: 7 }, // 採石場の中央（大岩ガニ）
  keystoneRock: { x: 9, z: 2 }, // 要石の岩盤（北の壁）
};

// 第7章の地上軍の道順: 踊り場 → 道の口の門 → 前庭 → 正面の入口 → 祭壇。
export const RAID_ROUTE = [
  { x: 32.5, z: 57.5 },
  { x: 32.5, z: 52.5 },
  { x: 32.5, z: 44.5 },
  { x: 32.5, z: 37.5 },
  { x: 32.5, z: 31.5 },
];

// 毎朝わき直す魚のかげ（プロップ）。南の海の水面(y=WATER_LEVEL+1)に置く。
export const FISH_SPOTS = [
  { x: 22, z: 106 },
  { x: 36, z: 108 },
  { x: 41, z: 106 },
  { x: 45, z: 105 },
];

// 採石洞の中で通常の敵が湧く位置（山の上に湧かないよう、床の高さを明示する）。
export const CAVE_SPAWNS = [
  { x: 11, y: CAVE_UPPER_Y, z: 34 },
  { x: 8, y: CAVE_UPPER_Y, z: 30 },
  { x: 8, y: CAVE_LOWER_Y, z: 21 },
  { x: 12, y: CAVE_LOWER_Y, z: 20 },
  { x: 16, y: CAVE_LOWER_Y, z: 19 },
  { x: 8, y: CAVE_LOWER_Y, z: 17 },
];

// 洞窟の中か（空と光を暗くする・通常の敵の種類を切り替える）。
export function inCave(x, y, z) {
  if (x < 15.9 && z < 36.5 && y < 20.5) return true; // 坑道と採石場（山の地表は y22 以上）
  return x < 19.5 && z < 22 && y < 15.5; // 脇道の奥の小部屋（台地の下）
}

// ワタリの船のマス（船首は南）。出航・帰港で丸ごと外したり戻したりする。
export function shipCells() {
  const { x: sx, z: sz } = PLACES.ship;
  const DECK_Y = 4;
  const cells = [];
  const put = (dx, dy, dz, block) => cells.push({ x: sx + dx, y: DECK_Y + dy, z: sz + dz, block });
  const shipRow = (dz) => (dz <= 6 ? [0, 4] : dz === 7 ? [1, 3] : [2, 2]);
  for (let dz = 0; dz <= 8; dz += 1) {
    const [a, b] = shipRow(dz);
    for (let dx = a; dx <= b; dx += 1) put(dx, 0, dz, B.PLANK);
    for (const dx of new Set([a, b])) {
      if (dx === 4 && dz === 2) continue; // 乗船口（東舷。桟橋と同じ高さで渡れる）
      put(dx, 1, dz, B.SHIPWALL);
    }
  }
  for (let dx = 1; dx <= 3; dx += 1) put(dx, 1, 0, B.SHIPWALL); // 船尾の横板
  put(2, 2, 8, B.SHIPWALL); // へさきの立ち上がり
  for (let dy = 1; dy <= 6; dy += 1) put(2, dy, 5, B.LOG); // 帆柱
  put(1, 6, 5, B.PLANK);
  put(3, 6, 5, B.PLANK);
  for (let dx = 1; dx <= 3; dx += 1) put(dx, 1, 1, B.PLANK); // 船尾楼
  put(2, 2, 1, B.HELM);
  put(0, 2, 0, B.TORCH);
  put(4, 2, 0, B.TORCH);
  for (let dy = 2; dy <= 5; dy += 1) {
    for (let dx = 0; dx <= 4; dx += 1) put(dx, dy, 4, B.SAIL);
  }
  return cells;
}

export class VoxelWorld {
  constructor() {
    const { W, D, H } = WORLD;
    this.data = new Uint8Array(W * D * H);
    this.pristine = null;
    this.listeners = [];
    this.blockDamage = new Map(); // cellKey -> accumulated raid damage (gates/walls)
  }

  idx(x, y, z) {
    return (z * WORLD.W + x) * WORLD.H + y;
  }

  inBounds(x, y, z) {
    return x >= 0 && x < WORLD.W && y >= 0 && y < WORLD.H && z >= 0 && z < WORLD.D;
  }

  get(x, y, z) {
    if (!this.inBounds(x, y, z)) return y < 0 ? B.STONE : B.AIR;
    return this.data[this.idx(x, y, z)];
  }

  set(x, y, z, id, silent = false) {
    if (!this.inBounds(x, y, z)) return;
    const i = this.idx(x, y, z);
    const prev = this.data[i];
    if (prev === id) return;
    this.data[i] = id;
    if (!silent) {
      for (const fn of this.listeners) fn(x, y, z, id, prev);
    }
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  isSolidAt(x, y, z, kind = "player") {
    if (isSolidFor(this.get(x, y, z), kind)) return true;
    // 門・扉は1マスのブロックだが、見た目は2マスの高さ。魔物が上を跳び越えないよう、
    // 真上のマスも魔物には壁にする。
    if (kind === "monster") {
      const below = this.get(x, y - 1, z);
      return below === B.GATE || below === B.DOOR;
    }
    return false;
  }

  // Ground level (y you can stand at) at a column: 1 above the topmost solid block.
  groundY(x, z) {
    for (let y = WORLD.H - 1; y >= 0; y -= 1) {
      const id = this.get(x, y, z);
      if (id !== B.AIR && BLOCK_DEFS[id]?.solid === true) return y + 1;
    }
    return 1;
  }

  isWaterAt(x, y, z) {
    return this.get(x, y, z) === B.WATER;
  }

  // Ground surface Y ignoring tree foliage (logs/leaves), for placing structures
  // and blueprints flush on the terrain even under an overhanging canopy.
  terrainSurfaceY(x, z) {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    for (let y = WORLD.H - 1; y >= 0; y -= 1) {
      const id = this.get(xi, y, zi);
      if (id === B.LOG || id === B.LEAVES) continue;
      if (id !== B.AIR && BLOCK_DEFS[id]?.solid === true) return y + 1;
    }
    return 1;
  }

  // Ground surface Y computed from the PRISTINE (as-generated) terrain.
  pristineSurfaceY(x, z) {
    const src = this.pristine ?? this.data;
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    for (let y = WORLD.H - 1; y >= 0; y -= 1) {
      const id = src[this.idx(xi, y, zi)];
      if (id === B.LOG || id === B.LEAVES) continue;
      if (id !== B.AIR && BLOCK_DEFS[id]?.solid === true) return y + 1;
    }
    return 1;
  }

  // Top surface Y of the first real ground block at or below `fromY` in a column.
  // 洞窟・屋根の下では、頭上の岩や屋根ではなく、足もとの床を返す。
  groundYBelow(x, z, fromY) {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    for (let y = Math.min(WORLD.H - 1, Math.floor(fromY)); y >= 0; y -= 1) {
      const id = this.get(xi, y, zi);
      if (id !== B.AIR && BLOCK_DEFS[id]?.solid === true) return y + 1;
    }
    return 1;
  }

  // World Y of the water surface in a column (top of the highest water cell), or
  // null if the column has no water. Used for swim buoyancy.
  waterSurfaceY(x, z) {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    for (let y = WORLD.H - 1; y >= 0; y -= 1) {
      if (this.get(xi, y, zi) === B.WATER) return y + 1;
    }
    return null;
  }

  // Amanatides & Woo voxel traversal. Returns {x,y,z,id,nx,ny,nz,dist} or null.
  raycast(origin, dir, maxDist) {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);
    const stepX = Math.sign(dir.x) || 1;
    const stepY = Math.sign(dir.y) || 1;
    const stepZ = Math.sign(dir.z) || 1;
    const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;
    const frac = (v) => v - Math.floor(v);
    let tMaxX = dir.x !== 0 ? (dir.x > 0 ? (1 - frac(origin.x)) : frac(origin.x)) * tDeltaX : Infinity;
    let tMaxY = dir.y !== 0 ? (dir.y > 0 ? (1 - frac(origin.y)) : frac(origin.y)) * tDeltaY : Infinity;
    let tMaxZ = dir.z !== 0 ? (dir.z > 0 ? (1 - frac(origin.z)) : frac(origin.z)) * tDeltaZ : Infinity;
    let nx = 0, ny = 0, nz = 0;
    let dist = 0;
    for (let i = 0; i < 256; i += 1) {
      // 範囲外セルは照準に当てない（世界の外の仮想の石は set() で消せないため）。
      if (this.inBounds(x, y, z)) {
        const id = this.get(x, y, z);
        if (id !== B.AIR && id !== B.WATER) {
          return { x, y, z, id, nx, ny, nz, dist };
        }
      }
      if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
        dist = tMaxX;
        x += stepX;
        tMaxX += tDeltaX;
        nx = -stepX; ny = 0; nz = 0;
      } else if (tMaxY <= tMaxZ) {
        dist = tMaxY;
        y += stepY;
        tMaxY += tDeltaY;
        nx = 0; ny = -stepY; nz = 0;
      } else {
        dist = tMaxZ;
        z += stepZ;
        tMaxZ += tDeltaZ;
        nx = 0; ny = 0; nz = -stepZ;
      }
      if (dist > maxDist) return null;
    }
    return null;
  }

  // --- generation ---------------------------------------------------------------

  generate(seed = WORLD.SEED) {
    this.data.fill(B.AIR);
    this.generateDharmaIsland(mulberry32(seed));
    this.pristine = this.data.slice();
  }

  // 直方体を埋める（生成用。通知なし）。
  fill(x0, x1, y0, y1, z0, z1, id) {
    for (let z = z0; z <= z1; z += 1) {
      for (let x = x0; x <= x1; x += 1) {
        for (let y = y0; y <= y1; y += 1) this.set(x, y, z, id, true);
      }
    }
  }

  generateDharmaIsland(rand) {
    const { W, D, H } = WORLD;

    // Coarse value-noise grid, bilinearly sampled.
    const NG = 12;
    const noise = [];
    for (let i = 0; i < NG * NG; i += 1) noise.push(rand());
    const sampleNoise = (fx, fz) => {
      const gx = clamp((fx / W) * (NG - 1), 0, NG - 1.001);
      const gz = clamp((fz / D) * (NG - 1), 0, NG - 1.001);
      const x0 = Math.floor(gx), z0 = Math.floor(gz);
      const tx = gx - x0, tz = gz - z0;
      const n00 = noise[z0 * NG + x0], n10 = noise[z0 * NG + x0 + 1];
      const n01 = noise[(z0 + 1) * NG + x0], n11 = noise[(z0 + 1) * NG + x0 + 1];
      return lerp(lerp(n00, n10, tx), lerp(n01, n11, tx), tz);
    };

    const CX = 32;
    // 水運びの坂道の高さ（立つ位置の y）。踊り場(z55..61)=14、道の口(z51..52)=16。
    const pathH = (z) => {
      if (z <= 52) return 16;
      if (z <= 54) return 15;
      if (z <= 61) return 14;
      if (z >= 88) return 6;
      return Math.round(13 - (z - 62) * (7 / 26));
    };

    // --- 高さマップ -----------------------------------------------------------------
    const heights = new Int16Array(W * D);
    const kind = new Uint8Array(W * D); // 0 海底 / 1 砂浜 / 2 草地 / 3 岩山 / 4 台地 / 5 道
    for (let z = 0; z < D; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const dx = Math.abs(x - CX);
        const side = Math.max(0, dx - 13); // 谷の両側の斜面（左右の尾根へ登る）
        const n = sampleNoise(x * 1.9 + 11, z * 1.9);
        let h;
        let k = 2;
        if (z >= 104) {
          h = 1; // 海
          k = 0;
        } else if (z >= 98) {
          // 砂浜: なだらかに海へ。両端は尾根が海へ落ちる岩場。
          h = z <= 98 ? 6 : z <= 100 ? 5 : 4;
          k = 1;
          if (side > 6) {
            h += Math.round((side - 6) * 1.1);
            k = 3;
          }
        } else if (z >= 51) {
          // 集落・坂道・踊り場: 谷底は坂道と同じ高さ、両側は尾根へ登る。
          let base = pathH(z);
          if (z <= 54 && dx > 4) base = 12; // 台地の下の土手（道の口だけが台地へつながる）
          h = base + Math.round(side * 0.95 + (side > 0 ? (n - 0.5) * 2.4 : 0));
          if (side > 9) k = 3;
        } else {
          // 山。神殿の台地と東の肩を切り取り、ほかは岩壁。
          const onTerrace = x >= 16 && x <= 43 && z >= 22;
          const onShoulder = x >= 44 && x <= 50 && z >= 24 && z <= 40;
          const onRamp = x >= 44 && x <= 47 && z >= 41;
          if (onTerrace) {
            h = TERRACE_Y;
            k = 4;
          } else if (onShoulder) {
            h = 19;
            k = 4;
          } else if (onRamp) {
            h = z <= 43 ? 18 : z <= 46 ? 17 : 16;
            k = 4;
          } else {
            const east = z >= 41 ? x - 47 : x - 50;
            const d = Math.max(16 - x, east, 22 - z, 1);
            h = 21 + Math.round(d * 1.25 + (n - 0.5) * 3);
            k = 3;
          }
        }
        // 谷（z70..73）: 島を東西に横切る深い切れ込み。底に沢の水。
        if (z >= 70 && z <= 73) {
          h = 2;
          k = 3;
        }
        heights[z * W + x] = clamp(Math.round(h), 1, H - 4);
        kind[z * W + x] = k;
      }
    }
    // 水汲みの段: 谷の南の壁に沿って、沢まで下りる石の段（落ちても南側へ上がれる）。
    for (let i = 0; i <= 7; i += 1) {
      const x = 24 - i;
      heights[70 * W + x] = 10 - i; // x24=10 … x17=3
      kind[70 * W + x] = 3;
    }
    // 坂道と集落の道（x30..34）。
    for (let z = 51; z <= 103; z += 1) {
      if (z >= 70 && z <= 73) continue;
      for (let x = 30; x <= 34; x += 1) {
        if (z <= 97) kind[z * W + x] = 5;
      }
    }
    for (let z = 51; z <= 54; z += 1) for (let x = 28; x <= 36; x += 1) kind[z * W + x] = 5;

    // --- ブロックの敷設 --------------------------------------------------------------
    for (let z = 0; z < D; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const h = heights[z * W + x];
        const k = kind[z * W + x];
        for (let y = 0; y < h; y += 1) {
          const isTop = y === h - 1;
          let id;
          if (k === 0) id = B.SAND;
          else if (k === 1) id = B.SAND;
          else if (k === 3) id = B.MOUNTAIN_ROCK;
          else if (k === 4) id = isTop ? B.GRASS : y < h - 3 ? B.MOUNTAIN_ROCK : B.DIRT;
          else if (k === 5) id = isTop ? B.PATH : y < h - 3 ? B.STONE : B.DIRT;
          else id = isTop ? B.GRASS : y < h - 3 ? B.STONE : B.DIRT;
          this.set(x, y, z, id, true);
        }
        for (let y = h; y <= WORLD.WATER_LEVEL; y += 1) this.set(x, y, z, B.WATER, true);
      }
    }
    const surfaceOf = (x, z) => heights[z * W + x];

    // 沢のほとりと砂浜のねん土（泥だまり）。
    for (const [x, z] of [[17, 70], [18, 70], [16, 71], [17, 71], [22, 101], [23, 101], [23, 102], [42, 101], [43, 102]]) {
      this.set(x, Math.max(2, surfaceOf(x, z) - 1), z, B.MUD, true);
    }

    this.generateTempleRuins();
    this.generateCave();
    this.generateVillage(surfaceOf);
    this.generateShore();

    // --- 木・わら草・きのこ -----------------------------------------------------------
    for (let z = 52; z <= 97; z += 1) {
      for (let x = 4; x < W - 4; x += 1) {
        if (z >= 69 && z <= 74) continue; // 谷のへり
        if (x >= 28 && x <= 36) continue; // 坂道のまわりは開けておく
        if (z >= 55 && z <= 61 && x >= 22 && x <= 42) continue; // 踊り場
        // 道の口の両脇（台地の下の土手）。木の葉が防衛線の脇の足場にならないよう、木を生やさない。
        if (z <= 56 && x >= 22 && x <= 42) continue;
        if (z >= 86 && x >= 18 && x <= 46) continue; // 集落
        const h = surfaceOf(x, z);
        if (this.get(x, h - 1, z) !== B.GRASS || this.get(x, h, z) !== B.AIR) continue;
        const r = rand();
        if (r < 0.07) this.plantTree(x, h, z, rand);
        else if (r < 0.12) this.set(x, h, z, B.BUSH, true);
        else if (r < 0.14) this.set(x, h, z, B.MUSHROOM, true);
      }
    }
    // 集落のまわりのわら草と、確定の木（最初の橋の材料が近くで採れるように）。
    for (const [x, z] of [[20, 88], [44, 88], [19, 94], [45, 95], [24, 86], [40, 86]]) {
      const h = surfaceOf(x, z);
      if (this.get(x, h, z) === B.AIR && this.get(x, h - 1, z) === B.GRASS) this.plantTree(x, h, z, rand);
    }
    for (const [x, z] of [[22, 87], [42, 87], [21, 96], [43, 97], [26, 97], [38, 97], [27, 88], [37, 88]]) {
      const h = surfaceOf(x, z);
      if (this.get(x, h, z) === B.AIR && this.get(x, h - 1, z) === B.GRASS) this.set(x, h, z, B.BUSH, true);
    }
    // 台地の端の木とわら草（前庭の外れ）。
    for (const [x, z] of [[17, 48], [18, 39], [42, 49]]) this.plantTree(x, TERRACE_Y, z, rand);
    for (const [x, z] of [[19, 49], [17, 44], [41, 39], [24, 49], [40, 48]]) this.set(x, TERRACE_Y, z, B.BUSH, true);

    // 魚のかげ（毎朝わき直し）。水面の上に置く。
    for (const spot of FISH_SPOTS) {
      if (this.get(spot.x, WORLD.WATER_LEVEL, spot.z) === B.WATER) {
        this.set(spot.x, WORLD.WATER_LEVEL + 1, spot.z, B.FISH_SPOT, true);
      }
    }
  }

  // 崩れた旧ダーマ神殿: 三段の基壇（欠けと瓦礫）、二本だけ立つ古い柱、折れた根元、
  // 中央の石が欠けた祭壇。形は Studio の story-movies/shared/temple.py（M10）と同じ。
  generateTempleRuins() {
    const S = B.DHARMA_STONE;
    // 基壇の三段（下から y16・17・18）。
    this.fill(22, 42, 16, 16, 24, 37, S);
    this.fill(23, 41, 17, 17, 25, 36, S);
    this.fill(24, 40, 18, 18, 26, 35, S);
    // 欠けた角と割れ（空いたマス＝基壇の設計図で補う）。
    for (const [x, y, z] of TEMPLE_BASE_GAPS) this.set(x, y, z, B.AIR, true);
    // 基壇に食い込んだ瓦礫（設計図では赤い枠＝どけて石を据え直す）。
    for (const [x, y, z] of TEMPLE_BASE_RUBBLE) this.set(x, y, z, B.RUBBLE, true);
    // 崩れずに残った二本の古い柱（入口の両脇）。
    for (const x of [30, 34]) this.fill(x, x, FLOOR_Y, FLOOR_Y + 3, 35, 35, B.OLD_PILLAR);
    // 折れた柱の根元（正面の柱の位置）。
    for (const [x, hgt] of [[24, 1], [26, 2], [28, 1], [36, 2], [38, 1], [40, 1]]) {
      this.fill(x, x, FLOOR_Y, FLOOR_Y + hgt - 1, 35, 35, B.BROKEN_PILLAR);
    }
    // 壁の線の上に残る瓦礫と、焼け焦げた梁の残り。
    for (const [x, y, z, id] of TEMPLE_WALL_DEBRIS) this.set(x, y, z, id, true);
    // 祭壇の跡: 両脇の石だけが残り、中央（要石の場所）が欠けている。
    this.set(31, FLOOR_Y, 28, S, true);
    this.set(33, FLOOR_Y, 28, S, true);
    // 東の坂の落石（横の入口へ続く道をふさぐ）。
    for (const [x, y, z] of [[44, 17, 45], [45, 17, 45], [46, 17, 45], [47, 17, 45], [45, 18, 45], [46, 18, 45], [45, 17, 44], [46, 17, 46]]) {
      this.set(x, y, z, B.ROCKFALL, true);
    }
  }

  // 採石洞: 入口の坑道 → 北への坑道 → 崩れた足場（4段の落差）→ 下の坑道（脇道）→
  // 地の裂け目 → 採石場。山は中まで岩で埋まっているので、空洞を掘り抜く。
  generateCave() {
    const A = B.AIR;
    const U = CAVE_UPPER_Y, L = CAVE_LOWER_Y;
    // 入口の坑道（x8..15, z33..35）と北への坑道（x7..9, z28..35）。高さ4。
    this.fill(8, 15, U, U + 3, 33, 35, A);
    this.fill(7, 9, U, U + 3, 28, 35, A);
    // 崩れた足場の竪穴（床が y16 → y12 へ落ちる）。
    this.fill(7, 9, L, U + 3, 25, 27, A);
    // 下の坑道と脇道、脇道の奥の小部屋。
    this.fill(7, 9, L, L + 3, 16, 24, A);
    this.fill(10, 13, L, L + 3, 19, 21, A);
    this.fill(14, 18, L, L + 3, 16, 21, A); // 台地（z22〜）の下へ掘り抜かないよう、z21 まで・高さ4
    // 地の裂け目（幅4。底は y8）。
    this.fill(5, 11, 8, L + 5, 12, 15, A);
    // 裂け目の南の壁の石段（落ちても南へ上がれる）。
    this.fill(9, 9, 8, 10, 15, 15, B.MOUNTAIN_ROCK);
    this.fill(10, 10, 8, 9, 15, 15, B.MOUNTAIN_ROCK);
    this.fill(11, 11, 8, 8, 15, 15, B.MOUNTAIN_ROCK);
    // 採石場（x3..15, z3..11。高さ7）。まわりの壁と床は神殿と同じ石。
    this.fill(2, 16, L - 1, L + 7, 2, 11, B.DHARMA_STONE);
    this.fill(3, 15, L, L + 6, 3, 11, A);
    // 切り出して積んだままの石（積み石）。
    for (const [x0, x1, y1, z0, z1] of [[4, 5, L + 1, 4, 5], [13, 14, L + 1, 9, 10], [12, 12, L, 4, 4], [4, 4, L, 9, 9], [14, 14, L, 5, 5]]) {
      this.fill(x0, x1, L, y1, z0, z1, B.DHARMA_STONE);
    }
    // 要石の岩盤（北の壁の中央）。
    this.fill(7, 11, L, L + 3, 2, 2, B.KEYSTONE_ROCK);
    // 入口をふさぐ落石（第6章の途中、ガンゾウがどけるまで動かせない）。
    this.fill(15, 15, U, U + 3, 33, 35, B.BOULDER);
    // 脇道の鉄鉱脈・ねん土・きのこ。
    for (const [x, y, z] of [
      [10, L + 1, 18], [12, L + 2, 18], [11, L, 22], [13, L + 1, 22], [19, L + 1, 18], [19, L + 2, 20],
      [15, L + 4, 19], [17, L - 1, 19], [16, L + 1, 15], [14, L + 2, 15], [15, L, 22], [14, L + 1, 22],
      [6, L + 1, 20], [6, L + 2, 22], [10, L + 1, 17], [6, L + 1, 18],
    ]) {
      if (this.get(x, y, z) === B.MOUNTAIN_ROCK) this.set(x, y, z, B.IRON_ORE, true);
    }
    for (const [x, z] of [[15, 20], [16, 20], [16, 21]]) this.set(x, L - 1, z, B.MUD, true);
    for (const [x, z] of [[14, 17], [18, 21], [17, 16]]) this.set(x, L, z, B.MUSHROOM, true);
    // 足場の残骸（竪穴の底に落ちた板と丸太）。
    this.set(7, L, 24, B.LOG, true);
    this.set(9, L, 23, B.PLANK, true);
  }

  // 麓の集落: 地元の三人の小さな家、井戸、作業台と収納箱、山麦の小さな畑。
  generateVillage(surfaceOf) {
    const hut = (x0, z0, doorDx) => {
      const y = 6;
      for (let dz = 0; dz < 3; dz += 1) {
        for (let dx = 0; dx < 3; dx += 1) {
          const border = dx !== 1 || dz !== 1;
          if (border) {
            for (let dy = 0; dy < 2; dy += 1) {
              if (dz === 2 && dx === doorDx) {
                if (dy === 0) this.set(x0 + dx, y, z0 + dz, B.DOOR, true);
                continue;
              }
              this.set(x0 + dx, y + dy, z0 + dz, B.WALL, true);
            }
          }
          this.set(x0 + dx, y + 2, z0 + dz, B.THATCH, true);
        }
      }
      this.set(x0 + 1, y, z0 + 1, B.BED, true);
    };
    hut(22, 89, 1); // スズハの家
    hut(39, 89, 1); // ガンゾウの家
    hut(24, 94, 1); // アサギの家
    const y = surfaceOf(31, 92);
    this.set(PLACES.village.x, y, PLACES.village.z, B.TROUGH, true); // 井戸がわりの水桶
    this.set(27, y, 91, B.WORKBENCH, true);
    this.set(26, y, 91, B.CHEST, true);
    this.set(29, y, 89, B.TORCH, true);
    this.set(35, y, 89, B.TORCH, true);
    this.set(29, y, 96, B.TORCH, true);
    this.set(35, y, 96, B.TORCH, true);
    // 山麦の畑（3×2。実った株が少し残っている）。
    for (let dz = 0; dz < 2; dz += 1) {
      for (let dx = 0; dx < 3; dx += 1) {
        this.set(38 + dx, y - 1, 94 + dz, B.FARMLAND, true);
        this.set(38 + dx, y, 94 + dz, (dx + dz) % 2 === 0 ? B.CROP3 : B.CROP2, true);
      }
    }
    for (let dx = -1; dx <= 3; dx += 1) this.set(38 + dx, y, 93, B.FENCE, true);
    // 坂道の入口の道しるべ（スズハと出会う場所）。
    this.set(29, surfaceOf(29, 87), 87, B.TORCH, true);
  }

  // 桟橋とワタリの船。
  generateShore() {
    const { x: px } = PLACES.pier;
    for (let z = 102; z <= 113; z += 1) {
      for (let x = px; x <= px + 2; x += 1) this.set(x, 4, z, B.PLANK, true);
    }
    // 桟橋の杭と灯り。
    for (const z of [104, 108, 112]) {
      this.set(px, 5, z, B.FENCE, true);
    }
    // 灯りは桟橋の先だけ（上陸地点のすぐ南東に置くと、既定のカメラの視線をふさぐ）。
    this.set(px, 5, 113, B.TORCH, true);
    this.set(px + 2, 5, 113, B.TORCH, true);
    for (const c of shipCells()) this.set(c.x, c.y, c.z, c.block, true);
  }

  // silent=true（既定）はワールド生成用でリスナ通知を省く。実行時の再生
  // （systems/trees.js）は silent=false で呼び、チャンク再メッシュ等を通知させる。
  plantTree(x, y, z, rand, silent = true) {
    const trunk = 3 + Math.floor(rand() * 2);
    for (let i = 0; i < trunk; i += 1) this.set(x, y + i, z, B.LOG, silent);
    const ty = y + trunk;
    for (let dy = -1; dy <= 1; dy += 1) {
      const r = dy === 1 ? 0 : 1;
      for (let dx = -r; dx <= r; dx += 1) {
        for (let dz = -r; dz <= r; dz += 1) {
          if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && rand() < 0.4) continue;
          const cx = x + dx, cy = ty + dy, cz = z + dz;
          if (this.get(cx, cy, cz) === B.AIR) this.set(cx, cy, cz, B.LEAVES, silent);
        }
      }
    }
  }

  // --- save / load ----------------------------------------------------------------

  serializeEdits() {
    const out = [];
    for (let i = 0; i < this.data.length; i += 1) {
      if (this.data[i] !== this.pristine[i]) out.push([i, this.data[i]]);
    }
    return out;
  }

  applyEdits(edits) {
    for (const [i, id] of edits) this.data[i] = id;
  }

  // 生成直後の地形へ戻してから差分を当てる（敗北時に「開始直前の状態」へ戻すのに使う）。
  resetToEdits(edits) {
    this.data.set(this.pristine);
    this.applyEdits(edits);
    this.blockDamage.clear();
  }
}

// 基壇の欠け（空いたマス）と、食い込んだ瓦礫。blueprints.js の「基壇と石段」が同じ表を使う。
export const TEMPLE_BASE_GAPS = [
  // 南西の角（外の段）
  [22, 16, 37], [23, 16, 37], [22, 16, 36], [24, 16, 37],
  // 正面の石段の中央の割れ
  [31, 16, 37], [32, 16, 37], [32, 17, 36], [33, 17, 36], [33, 16, 37],
  // 南東の角
  [42, 16, 37], [41, 16, 37], [42, 16, 36], [41, 17, 36],
  // 北東の角（中の段）
  [41, 17, 25], [40, 17, 25], [41, 17, 26], [42, 16, 24], [42, 16, 25],
  // 上の段のふち
  [27, 18, 35], [29, 18, 35], [40, 18, 26], [39, 18, 26], [24, 18, 26],
  // 床の割れ
  [28, 18, 31], [29, 18, 31], [36, 18, 29], [36, 18, 30],
];
export const TEMPLE_BASE_RUBBLE = [
  [27, 16, 37], [28, 16, 37], [37, 16, 37], [23, 17, 36], [38, 17, 36], [39, 17, 36],
  [26, 18, 33], [27, 18, 33], [34, 18, 32], [38, 18, 30], [30, 18, 28], [22, 16, 30], [42, 16, 31],
];
// 壁・柱の線の上の瓦礫と焦げた梁（「柱と壁」の設計図では赤い枠になる）。
export const TEMPLE_WALL_DEBRIS = [
  [24, FLOOR_Y, 30, B.RUBBLE], [24, FLOOR_Y, 31, B.RUBBLE], [24, FLOOR_Y + 1, 30, B.RUBBLE],
  [40, FLOOR_Y, 28, B.RUBBLE], [40, FLOOR_Y, 33, B.RUBBLE],
  [27, FLOOR_Y, 26, B.RUBBLE], [28, FLOOR_Y, 26, B.RUBBLE], [35, FLOOR_Y, 26, B.RUBBLE], [35, FLOOR_Y + 1, 26, B.RUBBLE],
  [25, FLOOR_Y, 35, B.LOG], [37, FLOOR_Y, 35, B.LOG], [39, FLOOR_Y, 35, B.RUBBLE],
];
