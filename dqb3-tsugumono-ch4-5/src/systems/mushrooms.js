import { B } from "../world/blocks.js";

export const MUSHROOM_REGROW_SECONDS = 300; // one simulated day, paused with the world

// Only original natural gathering sites regrow. Buildings and occupants are never replaced.
export class MushroomSystem {
  constructor(game) {
    this.game = game;
    this.regrow = new Map();
  }

  naturalSite(x, y, z) {
    const w = this.game.world;
    return w.inBounds(x, y, z) && w.pristine[w.idx(x, y, z)] === B.MUSHROOM;
  }

  onWorldChange(x, y, z, id, prev) {
    if (prev !== B.MUSHROOM || id === B.MUSHROOM || !this.naturalSite(x, y, z)) return;
    const key = `${x},${y},${z}`;
    if (!this.regrow.has(key)) this.regrow.set(key, MUSHROOM_REGROW_SECONDS);
  }

  update(dt) {
    const w = this.game.world;
    for (const [key, remaining] of this.regrow) {
      const left = Math.max(0, remaining - dt);
      this.regrow.set(key, left);
      if (left > 0) continue;
      const [x, y, z] = key.split(",").map(Number);
      const soil = w.get(x, y - 1, z);
      // Shrine generation leaves one natural site on stone. Accept its original
      // support too, without allowing a new stone floor at a moss-soil site.
      const originalSoil = w.pristine[w.idx(x, y - 1, z)];
      const supportsRegrowth = soil === originalSoil || [B.MOSS, B.GRASS, B.DIRT].includes(soil);
      if (w.get(x, y, z) !== B.AIR || !supportsRegrowth) continue;
      if (this.game.placeBlockedByEntity({ x, y, z })) continue;
      this.regrow.delete(key);
      w.set(x, y, z, B.MUSHROOM);
    }
  }

  serialize() {
    return [...this.regrow].map(([key, remaining]) => [...key.split(",").map(Number), remaining]);
  }

  load(list) {
    this.regrow.clear();
    for (const [x, y, z, remaining] of list) {
      if (this.naturalSite(x, y, z) && Number.isFinite(remaining)) {
        this.regrow.set(`${x},${y},${z}`, Math.max(0, remaining));
      }
    }
  }
}
