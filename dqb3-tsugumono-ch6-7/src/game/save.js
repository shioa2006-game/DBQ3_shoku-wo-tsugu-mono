import { createSaveSlot } from "../../../game-shared/save-slot.mjs";
// localStorage save / load. Only diffs from the generated world are stored.
// ダーマ再興編（第6〜7章）専用のセーブキーを使う。ジパング復興編（ch1-3）・火山島編（ch4-5）の
// セーブとは独立で、互いに読み書きしない。

import { WORLD } from "../world/world.js";

export const SAVE_KEY = "shoku_wo_tsugumono_dharma_save_v1";

// 共通の v1 形式に、この編の項目 dharma（矢倉の矢・祭壇の耐久・罠の傷み）を足す。
export const { hasSave, writeSave, readSave, clearSave } = createSaveSlot(SAVE_KEY, WORLD, (game) => ({
  dharma: game.dharma.serialize(),
}));
