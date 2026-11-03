import { defineStorage } from "../../../game-shared/storage.mjs";
import { B } from "../world/blocks.js";
import { Inventory } from "../game/items.js";

export const StorageSystem = defineStorage(Inventory, B.CHEST);
