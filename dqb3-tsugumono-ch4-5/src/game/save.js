import { createSaveSlot } from "../../../game-shared/save-slot.mjs";
// localStorage save / load. Only diffs from the generated world are stored.
// 火山島編（第4〜5章）専用のセーブキーを使う。本島編（ch1-3）のセーブとは独立。

import { WORLD } from "../world/world.js";

const KEY = "shoku_wo_tsugumono_kazan_save_v1";

export const { hasSave, writeSave, readSave, clearSave } = createSaveSlot(KEY, WORLD, (game) => ({
  purification: game.purification.serialize(),
}));
