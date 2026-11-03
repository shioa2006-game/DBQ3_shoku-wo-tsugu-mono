import { PLACES } from "../world/world.js";
import { B } from "../world/blocks.js";
import { MONSTER_TYPES } from "../entities/monsters.js";
import { SFX } from "./sfx.js";

import { createRaidSpawner } from "../../../game-shared/raid-spawn.mjs";
import { WaveDefense } from "../../../game-shared/wave-defense.mjs";

const CH1_CONFIG = {
  label: "🚩 職業の旗",
  waves: [
    { label: "第1波", spawns: [["slime", 5]] },
    { label: "第2波", spawns: [["slime", 3], ["bat", 4]] },
    { label: "最終波", spawns: [["boss", 1], ["slime", 2], ["bat", 2]] },
  ],
  // Spawn gates around the plateau (resolved to ground height at spawn time).
  gates: [
    { x: 32, z: 26 },
    { x: 16, z: 44 },
    { x: 46, z: 48 },
  ],
  target: null, // null = main の bannerEntity（職業の旗）を守る
};

const CLEARABLE_BOSS_SPAWN_BLOCKS = new Set([B.GRASS, B.DIRT, B.STONE, B.SAND, B.LOG, B.LEAVES, B.ORE, B.BUSH]);

const spawnRaider = createRaidSpawner({
  monsterTypes: MONSTER_TYPES, base: PLACES.base,
  clearableBlocks: CLEARABLE_BOSS_SPAWN_BLOCKS, airBlock: B.AIR,
  spawnOffset: (type) => type === "bat" ? 2 : 0.2,
});

export class DefenseEvent extends WaveDefense {
  constructor(monsterManager, world) {
    super(monsterManager, world, spawnRaider, SFX);
    this.cfg = CH1_CONFIG;
    this.rallyPos = null;
    this.krakenBody = null;
    this.krakenArms = [];
  }

  start(config) {
    const raid = config ?? CH1_CONFIG;
    this.rallyPos = raid.rally ?? null;
    this.krakenBody = null;
    this.krakenArms = [];
    super.start(raid);
  }

  spawnSpecial(type, i) {
    // クラーケンは湧き口でなく決め打ち位置へ。本体は船から離れた海中、
    // 触手は浜の汀線・桟橋の縁に沿った水際（陸から剣が届く距離）に配置する。
    if (type === "kraken" && this.cfg.kraken) {
      const k = this.cfg.kraken.body;
      const m = this.monsters.spawn("kraken", k.x, k.y, k.z, { raid: true });
      this.boss = m;
      this.krakenBody = m;
      return true;
    }
    if (type === "kraken_arm" && this.cfg.kraken) {
      const k = this.cfg.kraken.arms;
      const s = k.spots[i % k.spots.length];
      const m = this.monsters.spawn("kraken_arm", s.x, k.y, s.z, { raid: true });
      this.krakenArms.push(m);
      return true;
    }
    return false;
  }

  onWaveUpdate(ui) {
    this.updateKraken(ui);
  }

  // 触手が全て折れたらクラーケン本体の無敵を解き、桟橋の先端そばへ浮上させる
  //（沖に浮いたままだと陸から剣が届かないため、露出時に岸へ寄せる）。
  updateKraken(ui) {
    const body = this.krakenBody;
    if (!body || body.dead || !body.shielded) return;
    if (this.krakenArms.length === 0) return;
    if (!this.krakenArms.every((a) => a.dead)) return;
    body.shielded = false;
    const surface = this.cfg.kraken?.surface;
    if (surface) {
      body.pos.x = surface.x;
      body.pos.z = surface.z;
    }
    body.pos.y += 0.9;
    // 浮上後は汀線沿いの浮上ポイントを潜航して移り歩く（Monster.updateDive）。
    body.surfaceY = body.pos.y;
    body.surfacePoints = this.cfg.kraken?.surfacePoints ?? null;
    body.diveT = 9;
    body.onHit();
    ui.toast("💥 触手を すべて断った！ クラーケンの 本体が 浮上した！");
    SFX.raidHorn();
  }

  finish(win) {
    this.rallyPos = null;
    this.krakenBody = null;
    this.krakenArms = [];
    super.finish(win);
  }
}
