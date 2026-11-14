import { PLACES, FLOOR_Y } from "../world/world.js";
import { B } from "../world/blocks.js";
import { MONSTER_TYPES } from "../entities/monsters.js";
import { SFX } from "./sfx.js";

import { createRaidSpawner } from "../../../game-shared/raid-spawn.mjs";
import { WaveDefense } from "../../../game-shared/wave-defense.mjs";

// 第7章の地上防衛（docs/DESIGN.md の「8. 第7章の防衛」）。波の進行・守る対象の耐久・勝敗は
// 共通の WaveDefense。ガーゴイル軍は海の上から飛来し、山道の踊り場へ着地してから進軍するので、
// 湧き方だけをここで差し替える（spawnSpecial）。

const CLEARABLE_BOSS_SPAWN_BLOCKS = new Set([B.GRASS, B.DIRT, B.STONE, B.SAND, B.LOG, B.LEAVES, B.BUSH]);

// 地上の湧き口から出る敵（いまの3波には無いが、共通の仕組みとして残す）。
const spawnRaider = createRaidSpawner({
  monsterTypes: MONSTER_TYPES, base: PLACES.forecourt,
  clearableBlocks: CLEARABLE_BOSS_SPAWN_BLOCKS, airBlock: B.AIR,
  spawnOffset: (type) => (MONSTER_TYPES[type].flying ? 2 : 0.2),
});

// 踊り場の着地点（x27..37, z55..60 を1マスおき。岩砕きは奥、ガーゴイルは手前から埋める）。
function landingSlots() {
  const slots = [];
  for (const z of [55.5, 57.5, 59.5]) {
    for (const x of [32.5, 29.5, 35.5, 27.5, 37.5, 31, 34]) slots.push({ x, z });
  }
  return slots;
}

export class DefenseEvent extends WaveDefense {
  constructor(monsterManager, world) {
    super(monsterManager, world, spawnRaider, SFX);
    this.landed = 0;
  }

  // 祭壇の灯を守る1波ぶんの防衛を始める。hp は祭壇の今の耐久（波をまたいで引き継ぐ）。
  startWave(wave, hp, maxHp) {
    this.slots = landingSlots();
    this.slotIndex = 0;
    this.flyIndex = 0;
    this.start({
      label: "🔥 授職の灯（祭壇）",
      targetHp: maxHp,
      waves: [wave],
      gates: [{ x: PLACES.landing.x, z: PLACES.landing.z }],
      target: { x: PLACES.altar.x + 0.5, y: FLOOR_Y, z: PLACES.altar.z + 0.5, halfW: 0.9 },
    });
    this.bannerHp = hp;
  }

  // ガーゴイル系は海の上から飛来して、踊り場へ着地する。
  spawnSpecial(type) {
    const def = MONSTER_TYPES[type];
    if (!def.sheets.flight) return false;
    const slot = this.slots[this.slotIndex % this.slots.length];
    this.slotIndex += 1;
    const n = this.flyIndex;
    this.flyIndex += 1;
    // 沖から列になって来る（後ろの者ほど遠く・高くから）。
    const sx = 32.5 + ((n % 5) - 2) * 4.5;
    const sz = 112 + n * 2.6;
    const m = this.monsters.spawn(type, sx, 26 + (n % 3), sz, { raid: true });
    const ground = this.world.terrainSurfaceY(slot.x, slot.z);
    m.startFlyIn({ x: slot.x, y: ground, z: slot.z });
    // 岩砕きは入口ではなく、左右の壁へ向かう。
    if (def.ai === "crusher") m.routeOffsetX = n % 2 === 0 ? -5 : 5;
    return true;
  }

  // 進めなくなった者が飛び上がり、踊り場へ降り直す（entities/monsters.js の trackProgress から）。
  relaunch(m) {
    if (!this.active || !this.slots) return;
    const slot = this.slots[this.slotIndex % this.slots.length];
    this.slotIndex += 1;
    m.routeIndex = 0;
    m.stuckTime = 0;
    m.setPose(null);
    m.startFlyIn({ x: slot.x, y: this.world.terrainSurfaceY(slot.x, slot.z), z: slot.z });
  }
}
