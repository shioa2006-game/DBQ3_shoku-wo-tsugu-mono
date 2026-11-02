import { PLACES } from "../world/world.js";
import { B } from "../world/blocks.js";
import { MONSTER_TYPES } from "../entities/monsters.js";
import { SFX } from "./sfx.js";

// Base-defense raid event: waves of monsters converge on a defense target.
// 第4章は鍛冶場の炉を守る（構成は quests4.js の forgeDefenseConfig）。
// start(config) で波構成・湧き口・守る対象を差し替えられる。

const SPAWN_SEARCH_RADIUS = 6;
const SPAWN_SEARCH_STEP = 0.5;
const BOSS_EXIT_CLEARANCE_STEPS = [0, 0.5, 1.0, 1.5];
const CLEARABLE_BOSS_SPAWN_BLOCKS = new Set([
  B.GRASS, B.DIRT, B.STONE, B.SAND, B.LOG, B.LEAVES, B.BUSH,
  B.BLACK_SAND, B.BASALT, B.ASH, B.IRON_ORE, B.MOSS, B.BAMBOO,
]);

function monsterBounds(type) {
  const def = MONSTER_TYPES[type];
  return {
    halfW: def.flying ? 0.32 : 0.36 * def.scale,
    height: def.flying ? 0.6 : 0.75 * def.scale,
  };
}

function spawnY(world, type, x, z) {
  return world.terrainSurfaceY(x, z) + (MONSTER_TYPES[type].flying ? 2 : 0.2);
}

function monsterBlockers(world, type, px, py, pz) {
  const { halfW, height } = monsterBounds(type);
  const x0 = Math.floor(px - halfW);
  const x1 = Math.floor(px + halfW);
  const y0 = Math.floor(py);
  const y1 = Math.floor(py + height - 0.02);
  const z0 = Math.floor(pz - halfW);
  const z1 = Math.floor(pz + halfW);
  const blockers = [];
  for (let x = x0; x <= x1; x += 1) {
    for (let y = y0; y <= y1; y += 1) {
      for (let z = z0; z <= z1; z += 1) {
        if (world.isSolidAt(x, y, z, "monster")) blockers.push({ x, y, z, id: world.get(x, y, z) });
      }
    }
  }
  return blockers;
}

function monsterCollides(world, type, px, py, pz) {
  return monsterBlockers(world, type, px, py, pz).length > 0;
}

function canClearBossVolume(world, type, x, y, z) {
  const def = MONSTER_TYPES[type];
  return !!def.boss && monsterBlockers(world, type, x, y, z).every((cell) => CLEARABLE_BOSS_SPAWN_BLOCKS.has(cell.id));
}

function bossExitDirection(x, z) {
  const dx = PLACES.town.x - x;
  const dz = PLACES.town.z - z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len };
}

function hasExitTowardBase(world, type, x, y, z, allowClearing = false) {
  const def = MONSTER_TYPES[type];
  if (def.flying) return true;
  const dir = bossExitDirection(x, z);
  for (const d of BOSS_EXIT_CLEARANCE_STEPS.slice(1)) {
    const px = x + dir.x * d;
    const pz = z + dir.z * d;
    if (!monsterCollides(world, type, px, y, pz)) continue;
    if (!allowClearing || !canClearBossVolume(world, type, px, y, pz)) return false;
  }
  return true;
}

function clearBossSpawnVolume(world, type, x, y, z) {
  const def = MONSTER_TYPES[type];
  if (!def.boss) return;
  const dir = bossExitDirection(x, z);
  for (const d of BOSS_EXIT_CLEARANCE_STEPS) {
    const px = x + dir.x * d;
    const pz = z + dir.z * d;
    for (const cell of monsterBlockers(world, type, px, y, pz)) {
      if (CLEARABLE_BOSS_SPAWN_BLOCKS.has(cell.id)) world.set(cell.x, cell.y, cell.z, B.AIR);
    }
  }
}

function findRaidSpawn(world, type, x, z) {
  const def = MONSTER_TYPES[type];
  const y = spawnY(world, type, x, z);
  if (def.boss && canClearBossVolume(world, type, x, y, z) && hasExitTowardBase(world, type, x, y, z, true)) {
    const clearBossSpawn = monsterCollides(world, type, x, y, z) || !hasExitTowardBase(world, type, x, y, z);
    return { x, y, z, clearBossSpawn };
  }

  let fallback = null;
  for (let r = 0; r <= SPAWN_SEARCH_RADIUS; r += SPAWN_SEARCH_STEP) {
    for (let dx = -r; dx <= r; dx += SPAWN_SEARCH_STEP) {
      for (let dz = -r; dz <= r; dz += SPAWN_SEARCH_STEP) {
        if (r > 0 && Math.abs(dx) < r && Math.abs(dz) < r) continue;
        const px = x + dx;
        const pz = z + dz;
        const py = spawnY(world, type, px, pz);
        if (monsterCollides(world, type, px, py, pz)) continue;
        const candidate = { x: px, y: py, z: pz, clearBossSpawn: false };
        if (hasExitTowardBase(world, type, px, py, pz)) return candidate;
        fallback ??= candidate;
      }
    }
  }

  if (def.boss) {
    for (let r = 0; r <= SPAWN_SEARCH_RADIUS; r += SPAWN_SEARCH_STEP) {
      for (let dx = -r; dx <= r; dx += SPAWN_SEARCH_STEP) {
        for (let dz = -r; dz <= r; dz += SPAWN_SEARCH_STEP) {
          if (r > 0 && Math.abs(dx) < r && Math.abs(dz) < r) continue;
          const px = x + dx;
          const pz = z + dz;
          const py = spawnY(world, type, px, pz);
          if (!canClearBossVolume(world, type, px, py, pz)) continue;
          if (hasExitTowardBase(world, type, px, py, pz, true)) return { x: px, y: py, z: pz, clearBossSpawn: true };
        }
      }
    }
  }

  return fallback ?? { x, y: spawnY(world, type, x, z), z, clearBossSpawn: false };
}

export class DefenseEvent {
  constructor(monsterManager, world) {
    this.monsters = monsterManager;
    this.world = world;
    this.active = false;
    this.wave = 0;
    this.bannerHp = 100;
    this.bannerMaxHp = 100;
    this.interWave = 0;
    this.onEnd = null;
    this.boss = null;
    this.cfg = null;
    // 守る対象（isBanner 付きの仮想エンティティ）。null のままなら main が
    // bannerEntity（職業の旗）を使う。第4章の炉防衛では炉の位置に置く。
    this.targetEntity = null;
  }

  start(config) {
    this.cfg = config;
    // pos は {x,y,z} のプレーンオブジェクトで足りる（distanceTo の引数側と
    // 座標参照にしか使われない）。
    this.targetEntity = this.cfg.target
      ? { pos: { x: this.cfg.target.x, y: this.cfg.target.y, z: this.cfg.target.z }, halfW: this.cfg.target.halfW, dead: false, isBanner: true }
      : null;
    this.active = true;
    this.wave = 0;
    this.bannerMaxHp = this.cfg.targetHp ?? 100; // 守る対象のHP（章ごとに可変）
    this.bannerHp = this.bannerMaxHp;
    this.interWave = 2.5;
    this.boss = null;
    SFX.raidHorn();
  }

  spawnWave(index) {
    const def = this.cfg.waves[index];
    let gateIndex = 0;
    for (const [type, count] of def.spawns) {
      for (let i = 0; i < count; i += 1) {
        const gate = this.cfg.gates[gateIndex % this.cfg.gates.length];
        gateIndex += 1;
        const x = gate.x + (Math.random() - 0.5) * 4;
        const z = gate.z + (Math.random() - 0.5) * 4;
        const spawn = findRaidSpawn(this.world, type, x, z);
        if (spawn.clearBossSpawn) clearBossSpawnVolume(this.world, type, spawn.x, spawn.y, spawn.z);
        const m = this.monsters.spawn(type, spawn.x, spawn.y, spawn.z, { raid: true });
        if (MONSTER_TYPES[type].boss) this.boss = m;
      }
    }
    return def.label;
  }

  damageBanner(amount) {
    if (!this.active) return;
    this.bannerHp = Math.max(0, this.bannerHp - amount);
    SFX.hurt();
    if (this.bannerHp <= 0) this.finish(false);
  }

  update(dt, ui) {
    if (!this.active) return;
    if (this.interWave > 0) {
      this.interWave -= dt;
      if (this.interWave <= 0) {
        const label = this.spawnWave(this.wave);
        ui.toast(`⚔️ ${label}が やってきた！`);
        SFX.raidHorn();
      }
      return;
    }
    if (this.monsters.count(true) === 0) {
      this.wave += 1;
      if (this.wave >= this.cfg.waves.length) {
        this.finish(true);
      } else {
        this.interWave = 4;
        ui.toast(`🛡️ ${this.cfg.waves[this.wave].label}が せまっている……！`);
      }
    }
  }

  finish(win) {
    this.active = false;
    this.targetEntity = null;
    // Clear any leftover raiders.
    for (const m of [...this.monsters.monsters]) {
      if (m.raid) this.monsters.remove(m);
    }
    this.boss = null;
    if (this.onEnd) this.onEnd(win);
  }
}
