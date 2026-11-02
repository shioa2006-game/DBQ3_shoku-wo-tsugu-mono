// localStorage save / load. Only diffs from the generated world are stored.
// 火山島編（第4〜5章）専用のセーブキーを使う。本島編（ch1-3）のセーブとは独立。

import { WORLD } from "../world/world.js";

const KEY = "shoku_wo_tsugumono_kazan_save_v1";

export function hasSave() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function writeSave(game) {
  try {
    const data = {
      version: 1,
      // 生成世代とサイズを記録しておく。将来 generate() を変えた時に
      // 不一致を検出でき、サイズが分かれば flat index の座標変換移行も可能。
      world: { version: WORLD.GEN_VERSION, seed: WORLD.SEED, size: [WORLD.W, WORLD.D, WORLD.H] },
      savedAt: Date.now(),
      stage: game.quests.serialize(),
      jobs: game.jobs.serialize(),
      trees: game.trees.serialize(),
      mushrooms: game.mushrooms.serialize(),
      pendingRewards: game.pendingRewards,
      purification: game.purification.serialize(),
      inventory: game.inventory.serialize(),
      storages: game.storage.serialize(),
      player: {
        pos: [game.player.pos.x, game.player.pos.y, game.player.pos.z],
        hp: game.player.hp,
      },
      time: { hour: game.daynight.hour, day: game.daynight.day },
      baseLevel: game.baseLevel,
      villagers: game.villagers.map((v) => ({ id: v.id, pos: [v.pos.x, v.pos.y, v.pos.z] })),
      blueprint: game.blueprints.active
        ? { id: game.blueprints.active.id, baseY: game.blueprints.active.baseY }
        : null,
      blueprintsDone: [...game.blueprints.completed],
      edits: game.world.serializeEdits(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn("save failed", err);
    return false;
  }
}

export function readSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
