// 収納システム: 設置式チェストの中身の管理と、プレイヤー⇔チェストの
// スタック移動。中身はセーブに永続化され、チェスト破壊時はドロップする。

export function defineStorage(Inventory, chestBlock) {
  return class StorageSystem {
    constructor(game) {
      this.game = game;
      this.storages = new Map(); // セルキー -> Inventory(16)
    }

    onWorldChange(key, id, prev) {
      if (prev === chestBlock && id !== chestBlock) this.storages.delete(key);
    }

    storageAt(key) {
      let storage = this.storages.get(key);
      if (!storage) {
        storage = new Inventory(16);
        this.storages.set(key, storage);
      }
      return storage;
    }

    open(key) {
      const storage = this.storageAt(key);
      this.game.ui.openStorage({ inventory: this.game.inventory, storage, title: "収納箱" });
    }

    moveStack(from, fromIndex, to) {
      const slot = from.slots[fromIndex];
      if (!slot) return false;
      if (!to.canAdd(slot.id, slot.count)) {
        this.game.throttledToast("storage-full", "移動先がいっぱいです");
        return false;
      }
      if (!to.add(slot.id, slot.count)) return false;
      from.slots[fromIndex] = null;
      from.emit();
      return true;
    }

    storeItem(index) {
      const storage = this.game.ui.storageCtx?.storage;
      if (!storage) return false;
      return this.moveStack(this.game.inventory, index, storage);
    }

    takeStoredItem(index) {
      const storage = this.game.ui.storageCtx?.storage;
      if (!storage) return false;
      return this.moveStack(storage, index, this.game.inventory);
    }

    dropInventory(inventory, x, y, z) {
      for (const slot of inventory.slots) {
        if (slot) this.game.spawnDrop(slot.id, slot.count, x, y, z);
      }
    }

    serialize() {
      return [...this.storages.entries()].map(([key, inventory]) => ({ key, inventory: inventory.serialize() }));
    }

    load(storages) {
      this.storages.clear();
      for (const entry of storages) {
        const [x, y, z] = entry.key.split(",").map(Number);
        if (this.game.world.get(x, y, z) !== chestBlock) continue;
        const inventory = new Inventory(16);
        inventory.load(entry.inventory);
        this.storages.set(entry.key, inventory);
      }
    }
  };
}
