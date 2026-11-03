// 本人・収納箱・クラフト試算の複製が、同じ編のアイテム表とスタック上限を使う。
export function defineInventory(items) {
  return class Inventory {
    constructor(size = 24) {
      this.slots = new Array(size).fill(null); // {id, count}
      this.hotbarSize = 8;
      this.selected = 0;
      this.listeners = [];
    }

    onChange(fn) {
      this.listeners.push(fn);
    }

    emit() {
      for (const fn of this.listeners) fn();
    }

    count(id) {
      return this.slots.reduce((sum, s) => sum + (s && s.id === id ? s.count : 0), 0);
    }

    add(id, n = 1) {
      const stack = items[id].stack ?? 1;
      let left = n;
      for (const s of this.slots) {
        if (left <= 0) break;
        if (s && s.id === id && s.count < stack) {
          const take = Math.min(stack - s.count, left);
          s.count += take;
          left -= take;
        }
      }
      for (let i = 0; i < this.slots.length && left > 0; i += 1) {
        if (!this.slots[i]) {
          const take = Math.min(stack, left);
          this.slots[i] = { id, count: take };
          left -= take;
        }
      }
      this.emit();
      return left === 0;
    }

    remove(id, n = 1) {
      if (this.count(id) < n) return false;
      let left = n;
      for (let i = this.slots.length - 1; i >= 0 && left > 0; i -= 1) {
        const s = this.slots[i];
        if (s && s.id === id) {
          const take = Math.min(s.count, left);
          s.count -= take;
          left -= take;
          if (s.count <= 0) this.slots[i] = null;
        }
      }
      this.emit();
      return true;
    }

    removeFromSlot(index, n = 1) {
      const s = this.slots[index];
      if (!s) return;
      s.count -= n;
      if (s.count <= 0) this.slots[index] = null;
      this.emit();
    }

    held() {
      return this.slots[this.selected];
    }

    has(id, n = 1) {
      return this.count(id) >= n;
    }

    clone() {
      const inv = new Inventory(this.slots.length);
      inv.slots = this.slots.map((s) => (s ? { ...s } : null));
      inv.selected = this.selected;
      return inv;
    }

    canAdd(id, n = 1) {
      const stack = items[id].stack ?? 1;
      let room = 0;
      for (const s of this.slots) {
        if (s && s.id === id) room += Math.max(0, stack - s.count);
        else if (!s) room += stack;
        if (room >= n) return true;
      }
      return false;
    }

    canCraftMaterials(recipe) {
      return Object.entries(recipe.cost).every(([id, n]) => this.count(id) >= n);
    }

    canCraft(recipe) {
      if (!this.canCraftMaterials(recipe)) return false;
      const trial = this.clone();
      for (const [id, n] of Object.entries(recipe.cost)) trial.remove(id, n);
      return trial.canAdd(recipe.out, recipe.n);
    }

    craft(recipe) {
      if (!this.canCraft(recipe)) return false;
      for (const [id, n] of Object.entries(recipe.cost)) this.remove(id, n);
      return this.add(recipe.out, recipe.n);
    }

    serialize() {
      return { slots: this.slots, selected: this.selected };
    }

    load(data) {
      if (!data) return;
      const size = this.slots.length;
      this.slots = (data.slots ?? []).slice(0, size).map((s) => (s ? { ...s } : null));
      while (this.slots.length < size) this.slots.push(null);
      this.selected = Math.max(0, Math.min(size - 1, data.selected ?? 0));
      this.emit();
    }
  };
}
