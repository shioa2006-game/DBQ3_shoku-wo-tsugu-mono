// 各編が持つ保存キー・地形定義・固有項目を使い、共通の v1 データを読み書きする。
export function createSaveSlot(key, world, chapterState) {
  function hasSave() {
    try {
      return !!localStorage.getItem(key);
    } catch {
      return false;
    }
  }

  function writeSave(game) {
    try {
      const data = {
        version: 1,
        // 生成世代とサイズを記録しておく。将来 generate() を変えた時に
        // 不一致を検出でき、サイズが分かれば flat index の座標変換移行も可能。
        world: { version: world.GEN_VERSION, seed: world.SEED, size: [world.W, world.D, world.H] },
        savedAt: Date.now(),
        stage: game.quests.serialize(),
        jobs: game.jobs.serialize(),
        trees: game.trees.serialize(),
        mushrooms: game.mushrooms.serialize(),
        pendingRewards: game.pendingRewards,
        ...chapterState?.(game),
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
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (err) {
      console.warn("save failed", err);
      return false;
    }
  }

  function readSave() {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearSave() {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  return { hasSave, writeSave, readSave, clearSave };
}
