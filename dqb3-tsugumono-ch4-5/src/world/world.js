import { B, BLOCK_DEFS, isSolidFor } from "./blocks.js";
import { mulberry32, clamp, lerp } from "../core/utils.js";

// 火山島（第4〜5章の共通マップ）。
// 島の中央に大きな火山がそびえ、その山体そのものが北（第4章: 海岸・鉱山町）と
// 南（第5章: 竹林・源泉盆地）を分ける。峠は火山の東中腹を巻く山道で、
// 第4章のあいだは落石と黒竹で塞がり、GATE_Z の座標制限で開通まで越えられない。
// 第4章時点で島全体（竹林・内社・源泉盆地まで）を生成する。
export const WORLD = {
  W: 64, // x (west -> east)
  D: 112, // z (north -> south): 0-51 = 火山側 / 52-63 = 峠 / 64-111 = 竹林側
  H: 32, // y（火山と谷の高低差を確保するため本島編の24から拡張）
  GATE_Z: 54, // 見えない壁: 峠開通(bambooPassOpen)まで z がこれを超えられない
  PASS_Z0: 52, // 峠の北端
  PASS_Z1: 63, // 峠の南端
  WATER_LEVEL: 3, // top water cell
  SEED: 20260712,
  // ワールド生成の世代番号。セーブは「生成直後(pristine)との差分」を
  // flat index [i, id] で保存するため、generate() の出力が変わる変更
  // （アルゴリズム・シード・W/D/H）を入れたら必ずこれを上げること。
  // v2: 峠の人工壁を撤去し、火山を島中央(32,52)へ移して主地形にした。
  // v3: ワタリの船を第3章建造時と同じ 5×9 の形にし、北岸に係留用の入り江を掘った。
  // v4: 鉄鉱脈を増量（坑道 13→20 ブロック、斜面の露頭の生成数 26→40 試行）。
  // v5: 廃鉱の落石を前庭へこぼれた山にし、鉱山入口の設計図の灯りのマスへ重ねた
  //     （赤ゴーストで「落石をどける」を教える）。
  // v6: 第5章の生成要素を追加（穢れ石3か所と倒れた祈り柱、清めの香草の採取地点）。
  GEN_VERSION: 6,
};

// Landmark positions the story references (kept in one place).
export const PLACES = {
  // --- 北岸（CH4_ARRIVAL の仮拠点） ------------------------------------------------
  spawn: { x: 33, z: 7 }, // 上陸地点（黒砂の浜）
  coastBase: { x: 26, z: 6 }, // 海岸拠点（小屋）の設計図アンカー（min corner）
  coastBanner: { x: 32, z: 8 }, // 仮拠点の旗
  coastCave: { x: 11, z: 8 }, // 住民が避難していた海岸の洞窟
  // ワタリの船（第3章で建造した 5×9・船首は南）。北岸の入り江に係留する。
  ship: { x: 40, z: 1 },
  // --- 鉱山町（第4〜5章の恒久拠点） -------------------------------------------------
  town: { x: 32, z: 21 }, // 町の中心
  townBanner: { x: 32, z: 20 }, // 拠点機能移転後の旗
  forge: { x: 25, z: 21 }, // 鍛冶場の設計図アンカー（5×4）
  anvil: { x: 26, z: 23 }, // ベルクの冷えた金床（生成時から存在）
  kiln: { x: 37, z: 23 }, // 炭焼き窯の設計図アンカー（3×3）
  ashFarm: { x: 40, z: 16 }, // 火山灰畑の設計図アンカー
  canteen: { x: 33, z: 15 }, // 鉱山町の食堂の設計図アンカー（鉄鍋を据える）
  lodgePlot: { x: 43, z: 13 }, // 第5章: 宿坊の予約地
  herbPlot: { x: 44, z: 26 }, // 第5章: 薬草園の予約地
  charcoalHut: { x: 47, z: 28 }, // 古い炭焼き小屋（住民の避難先）
  // --- 火山斜面・廃鉱 ---------------------------------------------------------------
  mine: { x: 22, z: 36 }, // 鉱山入口の設計図アンカー
  volcano: { x: 32, z: 52 }, // 島中央の火口（山頂は登れる。頂に溶岩湖）
  // --- 峠と第5章地域（第4章では進入不可） --------------------------------------------
  // 峠＝火山の東中腹を巻く山道（x43..45）。封鎖はこの道の上に置く。
  pass: { x: 44, z: 57 }, // 峠の中央（落石・黒竹の封鎖）
  nagiFound: { x: 44, z: 52 }, // 章末にナギが倒れている場所（巻き道の途中）
  bambooGate: { x: 42, z: 57 }, // 竹林の門の設計図アンカー（巻き道の封鎖跡）
  outerShrine: { x: 29, z: 74 }, // 外社（第5章）
  // 外社から内社へ続く参道を分断する穢れ石（3か所。戦闘→柱の立て直し→浄化）。
  taintStones: [
    { x: 40, z: 72 },
    { x: 30, z: 80 },
    { x: 34, z: 87 },
  ],
  innerShrine: { x: 29, z: 91 }, // 内社（第5章）
  spring: { x: 32, z: 100 }, // 清めの泉（第5章・グロム戦の源泉盆地）
  springWorks: { x: 30, z: 89 }, // 泉の祭壇・水門・導水路の設計図アンカー
};

// 毎朝わき直す魚のかげ（プロップ）。北岸の海の水面(y=WATER_LEVEL+1)に置く。
export const FISH_SPOTS = [
  { x: 20, z: 2 },
  { x: 36, z: 2 },
  { x: 12, z: 4 },
  { x: 52, z: 3 },
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
      if (id === B.LOG || id === B.LEAVES || id === B.BAMBOO) continue;
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
      if (id === B.LOG || id === B.LEAVES || id === B.BAMBOO) continue;
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
    this.generateVolcanoIsland(mulberry32(seed));
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

  generateVolcanoIsland(rand) {
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
    // 島の半幅（z ごと）。火山の山体でくびれ、南北の端は海へテーパーする。
    // くびれた海岸へ火山の斜面がそのまま落ち込み、崖の海岸線になる。
    const halfWidth = (z) => {
      if (z < 4 || z > 108) return -1; // 外海
      let hw;
      if (z <= 42) hw = 27;
      else if (z <= WORLD.PASS_Z1 + 3) hw = 18; // 火山の山体で島がくびれる
      else hw = 25;
      if (z < 10) hw -= (10 - z) * 1.4; // 北岸テーパー
      if (z > 100) hw -= (z - 100) * 1.6; // 南端テーパー
      return hw;
    };

    // 島中央の火山。裾野半径24・山頂約22。勾配を1ブロック/セル以下に抑え、
    // 北側から歩いて登頂できる（火口を覗ける）大きさと形にする。
    const VR = 24; // 裾野の半径
    const VAMP = 16; // 山の高さ（基準6 + 16 = 山頂約22）
    const volcanoDist = (x, z) => Math.hypot(x - PLACES.volcano.x, (z - PLACES.volcano.z) * 1.1);

    // 峠＝火山の東中腹を巻く山道（x43..45）。町の東(z38,h6)から肩(z50,h12)へ
    // 登り、竹林(z66,h5)へ下る。高低差は1段ずつで歩いて越えられる。
    const TRAIL_X0 = 43;
    const TRAIL_X1 = 45;
    const trailH = (z) => {
      if (z <= 50) return Math.round(6 + (z - 38) * 0.5);
      return Math.max(5, Math.round(12 - (z - 50) * 0.45));
    };

    // --- 高さマップ -----------------------------------------------------------------
    const heights = new Int16Array(W * D);
    for (let z = 0; z < D; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const hw = halfWidth(z);
        const edge = hw - Math.abs(x - CX) + (sampleNoise(x * 2.1 + 17, z * 2.1) - 0.5) * 5;
        const land = clamp(edge / 5, 0, 1);
        let h;
        if (land <= 0) {
          h = 1; // 海底
        } else {
          // 基準となる緩やかな地形。
          h = 4 + land * (1.2 + sampleNoise(x, z) * 1.8);

          // 島中央の火山（このマップの主役）。人工の壁は置かず、
          // 山体そのものが第4章地域と第5章地域を分ける。
          const cd = volcanoDist(x, z);
          if (cd < VR) {
            h = Math.max(h, 6 + (1 - cd / VR) ** 1.5 * VAMP * (0.9 + sampleNoise(x * 3, z * 3) * 0.2));
          }
          // 山頂の火口（縁は歩けて、底には溶岩湖が見える）。
          if (cd < 3.4) h -= 4.5;

          // 鉱山町の台地（x18..46, z13..30 を h=6 に均す）。
          const insetX = Math.min(x - 18, 46 - x);
          const insetZ = Math.min(z - 13, 30 - z);
          const inset = Math.min(insetX, insetZ);
          if (inset > -3) h = lerp(h, 6, clamp((inset + 3) / 4, 0, 1));

          // 廃鉱前の小さな踊り場。
          if (x >= 20 && x <= 28 && z >= 32 && z <= 37) h = lerp(h, 7, 0.85);

          // 北岸の浜はなだらかに海へ。
          if (z <= 11) h = Math.min(h, 4 + land * 1.2);

          // 船の入り江: 5×9 の船（第3章で建造したもの）を丸ごと浮かべられる
          // 湾を北岸の東寄りに掘る。船が浜にめり込まないための地形側の調整。
          if (z <= 10 && x >= 38 && x <= 46) h = 1;

          // 竹林の谷（湿潤な低地）。火山の南裾からなだらかに谷へ溶かす。
          if (z >= 64 && z <= 87) {
            const valleyH = 4.6 + sampleNoise(x * 1.7, z * 1.7) * 1.8;
            h = lerp(h, valleyH, clamp((z - 64) / 6, 0, 1));
            if (z >= 70) h = valleyH;
          }

          // 源泉盆地（古い火口状の窪地）: 中央が低く、縁が立ち上がる。
          if (z >= 88) {
            const bd = Math.hypot(x - PLACES.spring.x, z - (PLACES.spring.z - 2));
            h = bd < 8 ? 5 : Math.min(Math.max(h, 5 + (bd - 8) * 1.1), 12);
          }
        }
        let hh = clamp(Math.round(h), 1, H - 6);
        if (hh <= WORLD.WATER_LEVEL && land < 0.4) hh = 1;
        heights[z * W + x] = hh;
      }
    }

    // 峠＝東中腹の巻き道を山肌に刻む（3幅・1段ずつの上り下り）。
    for (let z = 38; z <= 66; z += 1) {
      for (let x = TRAIL_X0; x <= TRAIL_X1; x += 1) {
        heights[z * W + x] = trailH(z);
      }
    }

    this.applySteppedShallows(heights, 0, D);

    // --- ブロックの敷設 --------------------------------------------------------------
    for (let z = 0; z < D; z += 1) {
      for (let x = 0; x < W; x += 1) {
        const h = heights[z * W + x];
        const underwater = h <= WORLD.WATER_LEVEL;
        for (let y = 0; y < h; y += 1) {
          const isTop = y === h - 1;
          let id;
          if (underwater) {
            id = B.BLACK_SAND; // 海底も黒砂
          } else if (z <= 11) {
            // 北岸: 低地は黒砂の浜、高台は草地（漂着林）。
            id = h <= 5 ? B.BLACK_SAND : isTop ? B.GRASS : y < h - 3 ? B.STONE : B.DIRT;
          } else if (z <= 30) {
            // 鉱山町: 灰の積もった土。
            id = isTop ? B.ASH : y < h - 3 ? B.STONE : B.DIRT;
          } else if (z <= WORLD.PASS_Z1) {
            // 火山斜面と峠: 玄武岩。低いすそ野だけ灰土。
            id = h >= 9 || z >= WORLD.PASS_Z0 ? B.BASALT : isTop ? B.ASH : B.STONE;
          } else if (z <= 87) {
            // 竹林の谷: 苔むした土。
            id = isTop ? B.MOSS : y < h - 3 ? B.STONE : B.DIRT;
          } else {
            // 源泉盆地: 縁の岩と、苔の底。
            id = h >= 10 ? B.BASALT : isTop ? B.MOSS : y < h - 3 ? B.STONE : B.DIRT;
          }
          this.set(x, y, z, id, true);
        }
        for (let y = h; y <= WORLD.WATER_LEVEL; y += 1) {
          this.set(x, y, z, B.WATER, true);
        }
      }
    }

    const surfaceOf = (x, z) => heights[z * W + x];

    // --- 火山の演出: 火口の溶岩湖・斜面の亀裂 -----------------------------------------
    for (let z = PLACES.volcano.z - 4; z <= PLACES.volcano.z + 4; z += 1) {
      for (let x = PLACES.volcano.x - 4; x <= PLACES.volcano.x + 4; x += 1) {
        const cd = volcanoDist(x, z);
        if (cd < 2.6) this.set(x, surfaceOf(x, z) - 1, z, B.LAVA, true);
      }
    }
    // 北斜面（第4章側）に赤熱した亀裂。巻き道(x43..45)には置かない。
    for (let i = 0; i < 16; i += 1) {
      const a = rand() * Math.PI * 2;
      const r = 5 + rand() * 11;
      const x = Math.round(PLACES.volcano.x + Math.cos(a) * r);
      const z = Math.round(PLACES.volcano.z + Math.sin(a) * r * 0.8);
      if (!this.inBounds(x, 0, z) || z > WORLD.PASS_Z0 + 2) continue;
      if (x >= TRAIL_X0 - 1 && x <= TRAIL_X1 + 1) continue;
      const y = surfaceOf(x, z) - 1;
      if (this.get(x, y, z) === B.BASALT) this.set(x, y, z, B.LAVA, true);
    }

    // --- 鉄鉱脈: 斜面の露頭と坑道内 ---------------------------------------------------
    // 露頭は火山の北斜面〜山腹に散らす。鉄装備一式（ハンマー・金具・鍋・剣・
    // 胸あて・金床）を全部打てるだけの量を確保する（坑道の固定鉱脈と合わせて調整）。
    for (let i = 0; i < 40; i += 1) {
      const x = PLACES.volcano.x + Math.floor((rand() - 0.5) * 28);
      const z = 34 + Math.floor(rand() * 19);
      if (!this.inBounds(x, 0, z)) continue;
      const h = surfaceOf(x, z);
      const y = Math.max(2, h - 1 - Math.floor(rand() * 3));
      if (this.get(x, y, z) === B.BASALT || this.get(x, y, z) === B.STONE) {
        this.set(x, y, z, B.IRON_ORE, true);
      }
    }

    // --- 廃鉱: 短い坑道（x23..24 の2幅、z38..44）と奥の採掘室 -------------------------
    for (let z = 38; z <= 44; z += 1) {
      for (let x = 23; x <= 24; x += 1) {
        for (let y = 6; y <= 7; y += 1) this.set(x, y, z, B.AIR, true);
        this.set(x, 5, z, B.STONE, true); // 坑道の床
      }
    }
    for (let z = 43; z <= 45; z += 1) {
      for (let x = 21; x <= 26; x += 1) {
        for (let y = 6; y <= 7; y += 1) this.set(x, y, z, B.AIR, true);
        this.set(x, 5, z, B.STONE, true);
      }
    }
    // 坑道の壁の鉄鉱脈（ハンマーで掘る）。
    const veinCells = [
      [22, 6, 39], [22, 7, 41], [25, 6, 40], [25, 7, 42], [22, 6, 43],
      [20, 6, 44], [27, 6, 44], [21, 7, 45], [26, 7, 45], [23, 5, 44], [24, 5, 43],
      [22, 6, 46], [25, 6, 46],
      // v4: 鉄装備一式を打てるように増量（壁・床・天井にもう一列）。
      [22, 7, 39], [25, 7, 39], [23, 5, 40], [24, 5, 41], [25, 6, 43],
      [26, 6, 45], [20, 7, 44],
    ];
    for (const [x, y, z] of veinCells) {
      const cur = this.get(x, y, z);
      if (cur === B.BASALT || cur === B.STONE) this.set(x, y, z, B.IRON_ORE, true);
    }
    // 入口の落石（玄武岩の瓦礫。石のハンマーでどける）。坑道の口から前庭へ
    // こぼれ出た山にして、鉱山入口の設計図の坑道灯のマスにも重ねる。
    // 重なったマスは赤ゴーストで点滅し、「落石をどけろ」を視覚的に教える
    //（第2章の廃屋の壁と同じ作法）。
    for (const [x, y, z] of [
      [23, 6, 38], [24, 6, 38], [23, 7, 38], [24, 6, 39], [23, 6, 39], // 坑道の口の中
      [23, 7, 37], [24, 7, 37], [24, 8, 37], // 口からこぼれた山
      [23, 7, 36], [24, 7, 36], // 前庭まで転がった岩（設計図の灯りのマスに重なる）
    ]) {
      this.set(x, y, z, B.BASALT, true);
    }

    // --- 鉱山町の焼け跡: 壊れた家・冷えた金床 ------------------------------------------
    const townY = 6;
    for (const [x, z] of [[22, 17], [23, 17], [22, 19], [36, 17], [37, 17], [30, 26], [31, 26], [36, 27]]) {
      this.set(x, townY, z, B.WALL, true);
    }
    for (const [x, z] of [[24, 19], [35, 18], [30, 27]]) {
      this.set(x, townY, z, B.LOG, true);
    }
    // ベルクの冷えた金床（鍛冶場の設計図はこれを取り込む位置に広がる）。
    this.set(PLACES.anvil.x, townY, PLACES.anvil.z, B.ANVIL, true);

    // --- 古い炭焼き小屋（住民の避難先） -----------------------------------------------
    {
      const { x: cx, z: cz } = PLACES.charcoalHut;
      for (const [dx, dz] of [[0, 0], [2, 0], [0, 2], [2, 2]]) {
        this.set(cx + dx, townY, cz + dz, B.LOG, true);
      }
      this.set(cx + 1, townY, cz, B.WALL, true);
      this.set(cx, townY + 1, cz, B.LOG, true);
    }

    // --- 海岸の洞窟（丘をくり抜いた避難所） --------------------------------------------
    {
      const { x: cx, z: cz } = PLACES.coastCave; // 内部の基準
      // 丘を盛る。
      for (let z = cz - 3; z <= cz + 3; z += 1) {
        for (let x = cx - 3; x <= cx + 4; x += 1) {
          if (!this.inBounds(x, 0, z)) continue;
          const d = Math.hypot(x - cx, z - cz);
          const hh = Math.max(surfaceOf(x, z), Math.round(9 - d * 1.2));
          for (let y = 0; y < hh; y += 1) {
            if (this.get(x, y, z) === B.AIR || this.get(x, y, z) === B.WATER) {
              this.set(x, y, z, B.BASALT, true);
            }
          }
        }
      }
      // 内部の空洞と、東向きの入口。
      for (let z = cz - 1; z <= cz + 1; z += 1) {
        for (let x = cx - 1; x <= cx + 1; x += 1) {
          for (let y = 4; y <= 6; y += 1) this.set(x, y, z, B.AIR, true);
          this.set(x, 3, z, B.BLACK_SAND, true);
        }
      }
      for (let y = 4; y <= 5; y += 1) {
        this.set(cx + 2, y, cz, B.AIR, true);
        this.set(cx + 3, y, cz, B.AIR, true);
      }
      this.set(cx + 2, 3, cz, B.BLACK_SAND, true);
      this.set(cx + 3, 3, cz, B.BLACK_SAND, true);
    }

    // --- ワタリの船と壊れた船着き場（北岸の入り江） ------------------------------------
    // 船は第3章「旅立ちの港」で建造したものと同じ形（blueprints.js の
    // ship_hull / ship_mast / ship_sail の 5×9・甲板y4・船首は南）をそのまま再現する。
    {
      const { x: sx, z: sz } = PLACES.ship;
      const DECK_Y = 4; // 甲板の高さ（水面+1）。第3章と同じ。
      const shipRow = (dz) => (dz <= 6 ? [0, 4] : dz === 7 ? [1, 3] : [2, 2]);
      // 船体: 甲板（船首テーパー付き）＋タール塗り外板の舷側。
      for (let dz = 0; dz <= 8; dz += 1) {
        const [a, b] = shipRow(dz);
        for (let dx = a; dx <= b; dx += 1) this.set(sx + dx, DECK_Y, sz + dz, B.PLANK, true);
        for (const dx of new Set([a, b])) {
          if (dx === 4 && dz === 2) continue; // 乗船口（船着き場と同じ高さで渡れる）
          this.set(sx + dx, DECK_Y + 1, sz + dz, B.SHIPWALL, true);
        }
      }
      for (let dx = 1; dx <= 3; dx += 1) this.set(sx + dx, DECK_Y + 1, sz, B.SHIPWALL, true); // 船尾の横板
      this.set(sx + 2, DECK_Y + 2, sz + 8, B.SHIPWALL, true); // へさきの立ち上がり
      // 帆柱と艤装: 6段の帆柱＋帆桁、一段高い船尾楼、舵輪、船尾灯。
      for (let dy = 1; dy <= 6; dy += 1) this.set(sx + 2, DECK_Y + dy, sz + 5, B.LOG, true);
      this.set(sx + 1, DECK_Y + 6, sz + 5, B.PLANK, true);
      this.set(sx + 3, DECK_Y + 6, sz + 5, B.PLANK, true);
      for (let dx = 1; dx <= 3; dx += 1) this.set(sx + dx, DECK_Y + 1, sz + 1, B.PLANK, true);
      this.set(sx + 2, DECK_Y + 2, sz + 1, B.HELM, true);
      this.set(sx, DECK_Y + 2, sz, B.TORCH, true);
      this.set(sx + 4, DECK_Y + 2, sz, B.TORCH, true);
      // 帆: 帆柱の前(dz4)に張る 5×4 の大きな帆。
      for (let dy = 2; dy <= 5; dy += 1) {
        for (let dx = 0; dx <= 4; dx += 1) {
          this.set(sx + dx, DECK_Y + dy, sz + 4, B.SAIL, true);
        }
      }
      // 壊れた船着き場: 乗船口（東舷 dz2）の脇に残る板の残骸。
      for (const [dx, dz] of [[5, 2], [5, 3], [6, 3], [5, 5]]) {
        this.set(sx + dx, DECK_Y, sz + dz, B.PLANK, true);
      }
    }

    // --- ねん土の採れる潮だまり（湯気の立つ泥地） --------------------------------------
    for (const [x, z] of [[16, 5], [17, 5], [17, 6], [45, 6], [46, 6], [46, 7]]) {
      if (this.inBounds(x, 0, z)) this.set(x, Math.max(3, surfaceOf(x, z) - 1), z, B.MUD, true);
    }

    // --- 峠の封鎖: 巻き道の上に落石と黒竹 ----------------------------------------------
    // 道の山側（西）は火山の斜面、谷側（東）は海へ落ちる崖なので、
    // 巻き道さえ塞げば通行は閉じる（保険の座標制限は GATE_Z）。
    for (let z = 55; z <= 57; z += 1) {
      for (let x = TRAIL_X0 - 1; x <= TRAIL_X1 + 1; x += 1) {
        const gy = surfaceOf(x, z);
        const pile = 2 + ((x + z) % 2);
        for (let y = gy; y < gy + pile; y += 1) this.set(x, y, z, B.BASALT, true);
      }
    }
    for (let z = 58; z <= 61; z += 1) {
      for (let x = TRAIL_X0 - 1; x <= TRAIL_X1 + 1; x += 1) {
        if ((x + z * 3) % 2 === 0) continue;
        const gy = surfaceOf(x, z);
        for (let y = gy; y < gy + 3; y += 1) this.set(x, y, z, B.BLACK_BAMBOO, true);
      }
    }

    // --- 竹林（第5章地域。第4章時点で生成だけしておく） --------------------------------
    for (let z = 65; z <= 90; z += 1) {
      for (let x = 4; x < W - 4; x += 1) {
        if (Math.abs(x - (TRAIL_X0 + 1)) <= 2 && z <= 74) continue; // 巻き道からの参道は開けておく
        if (PLACES.taintStones.some((s) => Math.hypot(x - s.x, z - s.z) < 2.6)) continue; // 穢れ石の周りは開ける
        const h = surfaceOf(x, z);
        if (this.get(x, h - 1, z) !== B.MOSS) continue;
        const r = rand();
        if (r < 0.055) this.plantBamboo(x, h, z, rand);
        else if (r < 0.075) this.set(x, h, z, B.MUSHROOM, true);
        else if (r < 0.09) this.set(x, h, z, B.BUSH, true);
        else if (r < 0.098) this.set(x, h, z, B.INCENSE_PLANT, true); // 清めの香草の採取地点
      }
    }

    // --- 穢れ石と倒れた祈り柱（第5章の浄化サイクル） -----------------------------------
    // グロムが参道へ打ち込んだ穢れ石。浄化まで取り除けない（hardness ∞）。
    // そばに崩れた祈り柱の石を転がし、「柱を立て直して清める」目印にする。
    for (const s of PLACES.taintStones) {
      const gy = surfaceOf(s.x, s.z);
      this.set(s.x, gy, s.z, B.TAINT_STONE, true);
      this.set(s.x + 1, surfaceOf(s.x + 1, s.z + 1), s.z + 1, B.STONE, true);
      this.set(s.x - 1, surfaceOf(s.x - 1, s.z), s.z, B.STONE, true);
    }

    // --- 外社と内社の跡（第5章で修復する） --------------------------------------------
    {
      const { x: ox, z: oz } = PLACES.outerShrine;
      for (let dz = 0; dz < 3; dz += 1) {
        for (let dx = 0; dx < 5; dx += 1) {
          this.set(ox + dx, surfaceOf(ox + dx, oz + dz) - 1, oz + dz, B.STONE, true);
        }
      }
      this.set(ox + 2, surfaceOf(ox + 2, oz + 4), oz + 4, B.TORII, true);
    }
    {
      const { x: ix, z: iz } = PLACES.innerShrine;
      for (let dz = 0; dz < 3; dz += 1) {
        for (let dx = 0; dx < 5; dx += 1) {
          this.set(ix + dx, surfaceOf(ix + dx, iz + dz) - 1, iz + dz, B.STONE, true);
        }
      }
      this.set(ix, surfaceOf(ix, iz + 3), iz + 3, B.LOG, true);
      this.set(ix + 4, surfaceOf(ix + 4, iz + 3), iz + 3, B.LOG, true);
    }

    // --- 濁った清めの泉（源泉盆地の底） ------------------------------------------------
    for (let z = PLACES.spring.z - 3; z <= PLACES.spring.z + 3; z += 1) {
      for (let x = PLACES.spring.x - 4; x <= PLACES.spring.x + 4; x += 1) {
        if (Math.hypot(x - PLACES.spring.x, z - PLACES.spring.z) > 3.4) continue;
        this.set(x, 1, z, B.BLACK_SAND, true);
        this.set(x, 2, z, B.WATER, true);
        this.set(x, 3, z, B.WATER, true);
      }
    }

    // --- 北岸の漂着林とわら草 ----------------------------------------------------------
    for (let z = 4; z <= 13; z += 1) {
      for (let x = 4; x < W - 4; x += 1) {
        const h = surfaceOf(x, z);
        if (this.get(x, h - 1, z) !== B.GRASS) continue;
        const r = rand();
        if (r < 0.06) this.plantTree(x, h, z, rand);
        else if (r < 0.1) this.set(x, h, z, B.BUSH, true);
      }
    }
    // 町のまわりのまばらな木・わら草（灰土にも根を張る強い木）。
    for (let z = 12; z <= 32; z += 1) {
      for (let x = 4; x < W - 4; x += 1) {
        const h = surfaceOf(x, z);
        if (this.get(x, h - 1, z) !== B.ASH) continue;
        // 町の建設予定地（畑・鍛冶・窯・宿坊予約地）には生やさない。
        if (x >= 22 && x <= 46 && z >= 13 && z <= 28) {
          if (rand() < 0.02) this.set(x, h, z, B.BUSH, true);
          continue;
        }
        const r = rand();
        if (r < 0.02) this.plantTree(x, h, z, rand);
        else if (r < 0.05) this.set(x, h, z, B.BUSH, true);
      }
    }

    // 最初のクエストが流れるよう、上陸地点のそばに数本の確定木を置く
    // （船の入り江 x38..46 / z<=10 の中には植えない）。
    this.plantTree(30, this.terrainSurfaceY(30, 10), 10, rand);
    this.plantTree(36, this.terrainSurfaceY(36, 11), 11, rand);
    this.plantTree(28, this.terrainSurfaceY(28, 12), 12, rand);
    this.plantTree(44, this.terrainSurfaceY(44, 12), 12, rand);

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

  // 竹: 3〜5段の一本柱。葉は付けない（竹林の抜け感を保つ）。
  plantBamboo(x, y, z, rand, silent = true) {
    const height = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < height; i += 1) this.set(x, y + i, z, B.BAMBOO, silent);
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
