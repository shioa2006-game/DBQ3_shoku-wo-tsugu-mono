const SPAWN_SEARCH_RADIUS = 6;
const SPAWN_SEARCH_STEP = 0.5;
const BOSS_EXIT_CLEARANCE_STEPS = [0, 0.5, 1.0, 1.5];

// 拠点へ出られる位置を探す。ボスの通り道を空けるときは、各編が指定したブロックだけを除去する。
export function createRaidSpawner({ monsterTypes, base, clearableBlocks, airBlock, spawnOffset }) {
  function monsterBounds(type) {
    const def = monsterTypes[type];
    return {
      halfW: def.flying ? 0.32 : 0.36 * def.scale,
      height: def.flying ? 0.6 : 0.75 * def.scale,
    };
  }

  function spawnY(world, type, x, z) {
    return world.terrainSurfaceY(x, z) + spawnOffset(type);
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
    const def = monsterTypes[type];
    return !!def.boss && monsterBlockers(world, type, x, y, z).every((cell) => clearableBlocks.has(cell.id));
  }

  function bossExitDirection(x, z) {
    const dx = base.x - x;
    const dz = base.z - z;
    const len = Math.hypot(dx, dz) || 1;
    return { x: dx / len, z: dz / len };
  }

  function hasExitTowardBase(world, type, x, y, z, allowClearing = false) {
    const def = monsterTypes[type];
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
    const def = monsterTypes[type];
    if (!def.boss) return;
    const dir = bossExitDirection(x, z);
    for (const d of BOSS_EXIT_CLEARANCE_STEPS) {
      const px = x + dir.x * d;
      const pz = z + dir.z * d;
      for (const cell of monsterBlockers(world, type, px, y, pz)) {
        if (clearableBlocks.has(cell.id)) world.set(cell.x, cell.y, cell.z, airBlock);
      }
    }
  }

  function findRaidSpawn(world, type, x, z) {
    const def = monsterTypes[type];
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

  return function spawnRaider(monsters, world, type, gate) {
    const x = gate.x + (Math.random() - 0.5) * 4;
    const z = gate.z + (Math.random() - 0.5) * 4;
    const spawn = findRaidSpawn(world, type, x, z);
    if (spawn.clearBossSpawn) clearBossSpawnVolume(world, type, spawn.x, spawn.y, spawn.z);
    return monsters.spawn(type, spawn.x, spawn.y, spawn.z, { raid: true });
  };
}
