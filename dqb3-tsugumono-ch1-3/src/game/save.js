import { createSaveSlot } from "../../../game-shared/save-slot.mjs";
// localStorage save / load. Only diffs from the generated world are stored.

import { WORLD } from "../world/world.js";

const KEY = "shoku_wo_tsugumono_save_v1";

export const { hasSave, writeSave, readSave, clearSave } = createSaveSlot(KEY, WORLD);
