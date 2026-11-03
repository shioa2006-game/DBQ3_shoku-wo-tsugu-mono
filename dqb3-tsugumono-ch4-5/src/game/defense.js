import { PLACES } from "../world/world.js";
import { B } from "../world/blocks.js";
import { MONSTER_TYPES } from "../entities/monsters.js";
import { SFX } from "./sfx.js";

import { createRaidSpawner } from "../../../game-shared/raid-spawn.mjs";
import { WaveDefense } from "../../../game-shared/wave-defense.mjs";

const CLEARABLE_BOSS_SPAWN_BLOCKS = new Set([
  B.GRASS, B.DIRT, B.STONE, B.SAND, B.LOG, B.LEAVES, B.BUSH,
  B.BLACK_SAND, B.BASALT, B.ASH, B.IRON_ORE, B.MOSS, B.BAMBOO,
]);

const spawnRaider = createRaidSpawner({
  monsterTypes: MONSTER_TYPES, base: PLACES.town,
  clearableBlocks: CLEARABLE_BOSS_SPAWN_BLOCKS, airBlock: B.AIR,
  spawnOffset: (type) => MONSTER_TYPES[type].flying ? 2 : 0.2,
});

export class DefenseEvent extends WaveDefense {
  constructor(monsterManager, world) {
    super(monsterManager, world, spawnRaider, SFX);
  }
}
