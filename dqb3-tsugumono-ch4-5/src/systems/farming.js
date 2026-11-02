import { B } from "../world/blocks.js";
import { SFX } from "../game/sfx.js";

// 農業システム: 耕地・作物の成長インデックスと、種まき後の成長／収穫処理。
// 第4章の作物は火山穀物（volcano_grain）。既存の米とは別作物で、
// 収穫物は第4章の食事と第5章の粥の材料になる。
// ワールド変更は Game.onWorldChange から通知される（インデックスの一元管理）。

const GROWTH_RATE = 1 / 70; // 1株が成長段階を1つ進めるのに約70秒

export class FarmingSystem {
  constructor(game) {
    this.game = game;
    this.farmland = new Set(); // 耕した土のセルキー
    this.cropGrowth = new Map(); // 成長中の作物セルキー -> 進行度0..1
  }

  clearIndex() {
    this.farmland.clear();
    this.cropGrowth.clear();
  }

  // rescanWorld からの全セル走査で呼ばれる。
  indexCell(key, id) {
    if (id === B.FARMLAND) this.farmland.add(key);
    if (id === B.CROP1 || id === B.CROP2) this.cropGrowth.set(key, 0);
  }

  onWorldChange(key, id, prev) {
    if (id === B.FARMLAND) this.farmland.add(key);
    else if (prev === B.FARMLAND) this.farmland.delete(key);
    if (id === B.CROP1 || id === B.CROP2) {
      if (id !== prev || !this.cropGrowth.has(key)) this.cropGrowth.set(key, 0);
    } else {
      this.cropGrowth.delete(key);
    }
  }

  // 住民AI(ミナ)が世話をしに向かうセル。成長中の作物を優先し、無ければ耕地。
  pickFarmCell() {
    const keys = [...this.cropGrowth.keys()];
    const pool = keys.length ? keys : [...this.farmland];
    if (!pool.length) return null;
    const [x, y, z] = pool[Math.floor(Math.random() * pool.length)].split(",").map(Number);
    return { x, y: y + 1, z };
  }

  // 住民が近くで世話をすると成長が3倍速になる。
  boostCropsNear(pos, radius, dt) {
    for (const [key, t] of this.cropGrowth) {
      const [x, , z] = key.split(",").map(Number);
      if (Math.hypot(x + 0.5 - pos.x, z + 0.5 - pos.z) < radius) {
        this.cropGrowth.set(key, t + dt * GROWTH_RATE * 3);
      }
    }
  }

  update(dt) {
    for (const [key, t] of this.cropGrowth) {
      let progress = t + dt * GROWTH_RATE;
      const [x, y, z] = key.split(",").map(Number);
      let id = this.game.world.get(x, y, z);
      // Carry only excess progress into the next stage (also for accelerated ticks).
      while (progress >= 1 && (id === B.CROP1 || id === B.CROP2)) {
        progress -= 1;
        id = id === B.CROP1 ? B.CROP2 : B.CROP3;
        this.game.world.set(x, y, z, id);
      }
      if (id === B.CROP1 || id === B.CROP2) this.cropGrowth.set(key, progress);
      else this.cropGrowth.delete(key);
    }
  }

  harvestCrop(cx, cy, cz) {
    this.game.spawnDrop("volcano_grain", 1, cx, cy, cz);
    this.game.spawnDrop("volcano_grain", 1, cx, cy, cz);
    if (Math.random() < 0.7) this.game.spawnDrop("volcano_grain_seed", 1, cx, cy, cz);
    this.game.quests.counters.harvested += 1;
    SFX.pickup();
  }
}
