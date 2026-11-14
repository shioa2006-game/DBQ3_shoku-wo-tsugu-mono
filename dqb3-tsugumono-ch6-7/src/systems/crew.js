import { buildCellBlockers, clearVillagersFromCell } from "../../../game-shared/build-clearance.mjs";
import { cellKey } from "../core/utils.js";
import { B, isSolidFor } from "../world/blocks.js";
import { PLACES, TERRACE_Y } from "../world/world.js";
import { CREW_BLUEPRINTS } from "../game/blueprints.js";
import { itemForBlock } from "../game/items.js";
import { SFX } from "../game/sfx.js";

// 住民の手伝い（docs/DESIGN.md の「4. 建築と住民の手伝い」）。
// 神殿の設計図が出ている間、大工たち（def.builder の住民）が、前庭の資材置き場の収納箱に
// 入っている資材で、数秒に1マスずつ組む。下の段から順に、空いているマスだけを埋める
// （赤い枠＝瓦礫はプレイヤーがどける）。

const BASE_INTERVAL = 2.4; // 1人のときの、1マスあたりの秒数
// 工事場の持ち場（神殿の正面の石段の下）。ここで槌を振る。
const WORK_SPOTS = [
  { x: 27.5, z: 38.5 },
  { x: 32.5, z: 39.5 },
  { x: 37.5, z: 38.5 },
];

export class BuildCrew {
  constructor(game) {
    this.game = game;
    this.timer = BASE_INTERVAL;
    this.turn = 0;
  }

  get chestKey() {
    return cellKey(PLACES.siteChest.x, TERRACE_Y, PLACES.siteChest.z);
  }

  members() {
    return this.game.villagers.filter((v) => v.def.builder && !v.down && v.pos.y > 15 && v.pos.x > 15.9);
  }

  // いま大工たちが手伝う設計図（無ければ null）。
  activeBlueprint() {
    const g = this.game;
    const bp = g.blueprints.active;
    if (!bp || !CREW_BLUEPRINTS.has(bp.id) || g.battleActive) return null;
    return bp;
  }

  // 資材置き場の収納箱の中身（箱が無ければ null）。
  siteStorage() {
    const g = this.game;
    const { x, z } = PLACES.siteChest;
    if (g.world.get(x, TERRACE_Y, z) !== B.CHEST) return null;
    return g.storage.storageAt(this.chestKey);
  }

  // 住民AIへ渡す持ち場（villagerContext.workPost）。
  workPost(v) {
    if (!v.def.builder || !this.activeBlueprint()) return null;
    const members = this.members();
    const i = members.indexOf(v);
    if (i < 0) return null;
    const spot = WORK_SPOTS[i % WORK_SPOTS.length];
    return { x: spot.x, z: spot.z, y: TERRACE_Y, tool: v.def.tool, swing: true, face: { x: spot.x, z: 35 } };
  }

  update(dt) {
    const g = this.game;
    const bp = this.activeBlueprint();
    if (!bp) return;
    const members = this.members();
    if (!members.length) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = Math.max(0.7, BASE_INTERVAL / members.length);
    const storage = this.siteStorage();
    if (!storage) return;
    // 下の段から、空いているマスを探す。
    const open = bp.cells
      .filter((c) => {
        const cur = g.world.get(c.x, c.y, c.z);
        return cur !== c.block && (cur === B.AIR || cur === B.WATER);
      })
      .sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
    for (const cell of open) {
      const item = itemForBlock(cell.block);
      if (!item || storage.count(item) < 1) continue;
      const blockers = buildCellBlockers(cell, {
        player: g.player,
        villagers: g.villagers,
        monsters: g.monsters.monsters.filter((m) => m.root),
        villagersPassThrough: !isSolidFor(cell.block, "villager"),
      });
      if (blockers.hard.length) continue;
      if (blockers.villagers.length && !clearVillagersFromCell(blockers.villagers, cell, g.stepAsideOptions())) continue;
      storage.remove(item, 1);
      g.world.set(cell.x, cell.y, cell.z, cell.block);
      const worker = members[this.turn % members.length];
      this.turn += 1;
      worker.rig.startAttack();
      if (worker.pos.distanceTo(g.player.pos) < 24) SFX.place();
      if (g.ui.storageOpen) g.ui.renderStorage();
      return;
    }
  }
}
