import { B, BLOCK_DEFS, isSolidFor } from "./blocks.js";
import { mulberry32, clamp, lerp } from "../core/utils.js";

export const WORLD = {
  W: 64, // x (west -> east)
  D: 112, // z (north -> south): 0-63 = 第1章の北の島 / 64-111 = 第2章の南の田の村
  H: 24, // y
  NORTH_D: 64, // 北の島の奥行き（初期リリースのマップ全体）
  GATE_Z: 68, // 見えない壁: southOpen まで z がこれを超えられない（海峡の中央）
  WATER_LEVEL: 3, // top water cell
  SEED: 20260702,
  // ワールド生成の世代番号。セーブは「生成直後(pristine)との差分」を
  // flat index [i, id] で保存するため、generate() の出力が変わる変更
  // （アルゴリズム・シード・W/D/H）を入れたら必ずこれを上げること。
  // 特にサイズ変更は index の並びが変わり、旧セーブの全編集が別セルへ
  // 化ける。version 不一致時の扱いは main.js の loadGame() が行う。
  // v2: D 64→112（南に田の村を増設）。index=(z*W+x)*H+y は W/H 不変なら
  // z<64 のセルで並びが変わらないため、v1 セーブは無変換で安全に読める。
  GEN_VERSION: 2,
};

// Landmark positions the story references (kept in one place).
export const PLACES = {
  spawn: { x: 33, z: 54 }, // beach where the hero washes ashore
  base: { x: 32, z: 44 }, // flattened plateau: the settlement
  banner: { x: 32, y: 0, z: 44 }, // y resolved after generation
  hut: { x: 26, z: 42 }, // blueprint anchors (min corner)
  farm: { x: 36, z: 44 },
  shrine: { x: 28, z: 16 }, // on the mountain slope
  mountain: { x: 30, z: 12 },
  // --- 第2章: 南の田の村 -----------------------------------------------------
  bridge: { x: 30, z: 57 }, // 橋の設計図アンカー（min corner）。桁は y=4 固定
  village: { x: 38, z: 84 }, // 村の中心（イナホの居場所）
  waterway: { x: 24, z: 87 }, // 用水路の列（x24..38, y3）
  paddy: { x: 25, z: 89 }, // 田んぼ設計図アンカー（8×4, y3 に FARMLAND）
  kitchen: { x: 38, z: 80 }, // 台所・食堂の設計図アンカー
  bossPool: { x: 31, z: 100 }, // 大きな泥だまり（泥田の主のねぐら）
  // --- 第3章: 旅立ちの港（漂着の浜の東の海峡沿い）-----------------------------
  pier: { x: 39, z: 51 }, // 桟橋の設計図アンカー（min corner）。北の浜から海峡へ south に伸びる（2×11・桁 y=4 固定）
  lighthouse: { x: 45, z: 50 }, // 灯台の設計図アンカー（浜の東端の高台）
  ship: { x: 34, z: 59 }, // 船（5×9・3段階）の設計図アンカー。桟橋の西舷に横付け係留、船首は南の外海へ
};

// 毎朝わき直す魚のかげ（プロップ）。水面(y=WATER_LEVEL+1)に置く。
export const FISH_SPOTS = [
  { x: 43, z: 90 },
  { x: 45, z: 92 },
  { x: 28, z: 66 },
  { x: 34, z: 68 },
];

export class VoxelWorld {
  constructor() {
    const { W, D, H } = WORLD;
    this.data = new Uint8Array(W * D * H);
    this.pristine = null;
    this.listeners = [];
    this.blockDamage = new Map(); // cellKey -> accumulated raid damage (fences/doors)
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
    return isSolidFor(this.get(x, y, z), kind);
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
  // and blueprints flush on the terrain even under an overhanging canopy (plain
  // groundY would return the leaf ceiling and float the building in mid-air).
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

  // Ground surface Y computed from the PRISTINE (as-generated) terrain, ignoring
  // both foliage and anything the player has built. Blueprint base heights use this
  // so a structure's anchor stays fixed across save/load and build progress — a
  // partially-built structure must NOT raise its own blueprint (which drifts it up).
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
  // Used for shadows so an entity under a tree casts its shadow on the ground it
  // stands on, not on the canopy above it (groundY scans from the very top and
  // would return the leaf ceiling because leaves are solid).
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
      // 範囲外セルは照準に当てない。世界の外（特に底より下）は get() が
      // 物理用に「石」を返すが set() では消せないため、ここが照準に当たると
      // 「掘っても消えず、ドロップだけ湧き続ける無限の石」になってしまう。
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
    // 北の島（z < NORTH_D）＝第1章の島。生成コードと乱数消費順を初期リリース
    // から一切変えないこと。セーブは pristine との差分なので、ここが1ブロック
    // でも変わると既存セーブの世界が壊れる（WORLD.GEN_VERSION の規約参照）。
    // 南の村は独立した乱数列で生成し、北の列に影響を与えない。
    this.generateNorthIsland(mulberry32(seed));
    this.generateSouthVillage(mulberry32(seed + 101));
    this.pristine = this.data.slice();
  }

  applySteppedShallows(heights, z0, z1) {
    const { W } = WORLD;
    const originalHeights = new Int16Array(heights);
    const idxOf = (x, z) => (z - z0) * W + x;
    for (let z = z0; z < z1; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const idx = idxOf(x, z);
        if (originalHeights[idx] > WORLD.WATER_LEVEL) continue;
        let shoreDist = Infinity;
        for (let dz = -2; dz <= 2; dz += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            if (dx === 0 && dz === 0) continue;
            const nx = x + dx;
            const nz = z + dz;
            if (nx < 0 || nx >= W || nz < z0 || nz >= z1) continue;
            const n = originalHeights[idxOf(nx, nz)];
            if (n <= WORLD.WATER_LEVEL) continue;
            shoreDist = Math.min(shoreDist, Math.max(Math.abs(dx), Math.abs(dz)));
          }
        }
        if (shoreDist === 1) heights[idx] = Math.max(heights[idx], WORLD.WATER_LEVEL);
        else if (shoreDist === 2) heights[idx] = Math.max(heights[idx], WORLD.WATER_LEVEL - 1);
      }
    }
  }
  generateNorthIsland(rand) {
    const { W, H } = WORLD;
    const D = WORLD.NORTH_D;

    // Coarse value-noise grid, bilinearly sampled.
    const NG = 9;
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

    const cx = 32, cz = 32;
    const heights = new Int16Array(W * D);
    for (let z = 0; z < D; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const dx = x - cx;
        const dz = (z - cz) * 1.08;
        const d = Math.hypot(dx, dz) / 29;
        const edge = d + (sampleNoise(x * 2.3 + 40, z * 2.3) - 0.5) * 0.24;
        const land = clamp((1 - edge) * 3.2, 0, 1);
        let h = land <= 0 ? 1 : 2 + land * (2.4 + sampleNoise(x, z) * 2.4);
        // Mountain in the north.
        const mdx = x - PLACES.mountain.x;
        const mdz = z - PLACES.mountain.z;
        const md = Math.hypot(mdx, mdz);
        if (land > 0.4) {
          h += Math.max(0, 1 - md / 14) ** 1.7 * 11 * (0.75 + sampleNoise(x * 3, z * 3) * 0.5);
        }
        // Flatten the settlement plateau and the beach approach.
        const bd = Math.hypot(x - PLACES.base.x, z - PLACES.base.z);
        if (bd < 11) h = lerp(5, h, clamp((bd - 6) / 5, 0, 1));
        const sd = Math.hypot(x - PLACES.spawn.x, z - PLACES.spawn.z);
        if (sd < 7) h = lerp(4, h, clamp((sd - 4) / 3, 0, 1));
        // Shrine ledge on the mountain slope.
        const hd = Math.hypot(x - (PLACES.shrine.x + 3), z - (PLACES.shrine.z + 2));
        if (hd < 7) h = lerp(11, h, clamp((hd - 4.5) / 2.5, 0, 1));
        let hh = clamp(Math.round(h), 1, H - 8);
        // Carve a proper basin around the island: columns at/below the waterline
        // that are clearly open sea drop to the sea floor, so the ocean is a solid
        // ~3-deep body instead of see-through 1-block shallows that read as land.
        if (hh <= WORLD.WATER_LEVEL && land < 0.4) hh = 1;
        heights[z * W + x] = hh;
      }
    }

    this.applySteppedShallows(heights, 0, D);

    for (let z = 0; z < D; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const h = heights[z * W + x];
        const beach = h <= WORLD.WATER_LEVEL + 1;
        for (let y = 0; y < h; y += 1) {
          const isTop = y === h - 1;
          let id;
          if (h >= 10) id = isTop && rand() < 0.1 ? B.ORE : B.STONE;
          else if (beach) id = B.SAND;
          else if (isTop) id = B.GRASS;
          else id = y < h - 3 ? B.STONE : B.DIRT;
          this.set(x, y, z, id, true);
        }
        for (let y = h; y <= WORLD.WATER_LEVEL; y += 1) {
          this.set(x, y, z, B.WATER, true);
        }
      }
    }

    // Copper veins embedded in the mountain flanks (exposed by digging).
    for (let i = 0; i < 40; i += 1) {
      const x = PLACES.mountain.x + Math.floor((rand() - 0.5) * 22);
      const z = PLACES.mountain.z + Math.floor((rand() - 0.5) * 22);
      if (!this.inBounds(x, 0, z)) continue;
      const h = heights[z * WORLD.W + x];
      const y = 2 + Math.floor(rand() * Math.max(1, h - 3));
      if (this.get(x, y, z) === B.STONE) this.set(x, y, z, B.ORE, true);
    }

    // Trees and straw bushes on grass, denser forest in the west.
    for (let z = 2; z < D - 2; z += 1) {
      for (let x = 2; x < W - 2; x += 1) {
        const h = heights[z * W + x];
        if (this.get(x, h - 1, z) !== B.GRASS) continue;
        const nearBase = Math.hypot(x - PLACES.base.x, z - PLACES.base.z) < 9;
        const treeP = nearBase ? 0.008 : x < 26 ? 0.05 : 0.016;
        const r = rand();
        if (r < treeP) this.plantTree(x, h, z, rand);
        else if (r < treeP + 0.03) this.set(x, h, z, B.BUSH, true);
      }
    }

    // A few starter trees close to spawn so the first quest flows. Use the real
    // terrain surface so an overhang from a nearby tree can't float the trunk.
    this.plantTree(29, this.terrainSurfaceY(29, 51), 51, rand);
    this.plantTree(37, this.terrainSurfaceY(37, 52), 52, rand);
    this.plantTree(35, this.terrainSurfaceY(35, 49), 49, rand);
  }

  // 第2章「荒れた田の村」: 島の南（z 64..111）。低く平らな農村の島で、北の島
  // とは海峡で隔てられ、橋（設計図）でのみ渡れる。壊れた用水路・ひび割れた
  // 田・泥だまり・廃屋を pristine として生成し、復旧は設計図で行う。
  generateSouthVillage(rand) {
    const { W, H } = WORLD;
    const D0 = WORLD.NORTH_D;
    const D1 = WORLD.D;

    const NG = 9;
    const noise = [];
    for (let i = 0; i < NG * NG; i += 1) noise.push(rand());
    const sampleNoise = (fx, fz) => {
      const gx = clamp((fx / W) * (NG - 1), 0, NG - 1.001);
      const gz = clamp(((fz - D0) / (D1 - D0)) * (NG - 1), 0, NG - 1.001);
      const x0 = Math.floor(gx), z0 = Math.floor(gz);
      const tx = gx - x0, tz = gz - z0;
      const n00 = noise[z0 * NG + x0], n10 = noise[z0 * NG + x0 + 1];
      const n01 = noise[(z0 + 1) * NG + x0], n11 = noise[(z0 + 1) * NG + x0 + 1];
      return lerp(lerp(n00, n10, tx), lerp(n01, n11, tx), tz);
    };

    // 低平な島の高さマップ。村・田の一帯（x20..46, z76..96）は h=4 に均す。
    const cx = 32, cz = 90;
    const heights = new Int16Array(W * (D1 - D0));
    for (let z = D0; z < D1; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const dx = x - cx;
        const dz = (z - cz) * 1.3;
        const d = Math.hypot(dx, dz) / 26;
        const edge = d + (sampleNoise(x * 2.1 + 13, z * 2.1) - 0.5) * 0.22;
        const land = clamp((1 - edge) * 3.2, 0, 1);
        let h = land <= 0 ? 1 : 3 + land * (1.1 + sampleNoise(x, z) * 1.7);
        const insetX = Math.min(x - 20, 46 - x);
        const insetZ = Math.min(z - 76, 96 - z);
        const inset = Math.min(insetX, insetZ);
        if (inset > -3 && land > 0.2) h = lerp(h, 4, clamp((inset + 3) / 4, 0, 1));
        let hh = clamp(Math.round(h), 1, H - 8);
        if (hh <= WORLD.WATER_LEVEL && land < 0.4) hh = 1;
        heights[(z - D0) * W + x] = hh;
      }
    }
    this.applySteppedShallows(heights, D0, D1);
    for (let z = D0; z < D1; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const h = heights[(z - D0) * W + x];
        // 南は低平地(h=4)が村の中心なので、砂浜は水面下〜際(h<=3)だけにする
        //（北の h<=4 だと村全体が砂地になってしまう）。
        const beach = h <= WORLD.WATER_LEVEL;
        for (let y = 0; y < h; y += 1) {
          const isTop = y === h - 1;
          let id;
          if (beach) id = B.SAND;
          else if (isTop) id = B.GRASS;
          else id = y < h - 3 ? B.STONE : B.DIRT;
          this.set(x, y, z, id, true);
        }
        for (let y = h; y <= WORLD.WATER_LEVEL; y += 1) {
          this.set(x, y, z, B.WATER, true);
        }
      }
    }

    // ため池（用水路の水源。魚も釣れる）。
    for (let z = 88; z <= 93; z += 1) {
      for (let x = 41; x <= 46; x += 1) {
        if (Math.hypot(x - 43.5, z - 90.5) > 2.6) continue;
        this.set(x, 3, z, B.WATER, true);
        this.set(x, 2, z, B.WATER, true);
      }
    }

    // 壊れた用水路（x24..38, y3, z87）: 断片だけ残し、他は干からびた溝。
    for (let x = 24; x <= 38; x += 1) {
      const intact = x <= 26 || x === 33 || x === 34;
      this.set(x, 3, 87, intact ? B.WATERWAY : B.DIRT, true);
    }

    // ひび割れた田んぼ跡（x25..32, z89..92）: 乾いた土と泥。
    for (let z = 89; z <= 92; z += 1) {
      for (let x = 25; x <= 32; x += 1) {
        this.set(x, 3, z, rand() < 0.2 ? B.MUD : B.DIRT, true);
      }
    }

    // 泥だまり（どろたぼうのねぐら）。bossPool は大きめ。
    const pools = [
      [28, 97, 2, 2],
      [36, 95, 2, 2],
      [PLACES.bossPool.x, PLACES.bossPool.z, 3, 2],
    ];
    for (const [px, pz, pw, pd] of pools) {
      for (let z = pz; z < pz + pd; z += 1) {
        for (let x = px; x < px + pw; x += 1) {
          this.set(x, 3, z, B.MUD, true);
        }
      }
    }

    // 廃屋の残骸: 台所跡（設計図が重なる位置＝一部は障害物としてハンマー撤去を
    // 誘導）と、村の外れの壊れた家。
    for (const [x, z] of [[38, 80], [42, 80], [38, 83], [24, 80], [26, 80], [24, 82]]) {
      this.set(x, 4, z, B.WALL, true);
    }
    this.set(40, 4, 83, B.LOG, true);
    this.set(25, 4, 81, B.PLANK, true);

    // まばらな木・わら草・きのこ（南はきのこの産地）。
    for (let z = D0 + 8; z < D1 - 2; z += 1) {
      for (let x = 2; x < W - 2; x += 1) {
        const h = heights[(z - D0) * W + x];
        if (this.get(x, h - 1, z) !== B.GRASS) continue;
        const nearVillage = x >= 22 && x <= 46 && z >= 78 && z <= 94;
        const r = rand();
        if (!nearVillage && r < 0.016) this.plantTree(x, h, z, rand);
        else if (r < 0.036) this.set(x, h, z, B.BUSH, true);
        else if (r < 0.05) this.set(x, h, z, B.MUSHROOM, true);
      }
    }

    // 魚のかげ（毎朝わき直し）。水面の上に置く。
    for (const spot of FISH_SPOTS) {
      if (this.get(spot.x, WORLD.WATER_LEVEL, spot.z) === B.WATER) {
        this.set(spot.x, WORLD.WATER_LEVEL + 1, spot.z, B.FISH_SPOT, true);
      }
    }
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
}
