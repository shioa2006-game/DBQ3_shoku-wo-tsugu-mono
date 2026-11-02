import { B, drawTileIcon } from "../world/blocks.js";
import ICON_ATLAS from "../../assets/items/item_icons_16.json" with { type: "json" };

// kind: block | tool | weapon | armor | food | material
// tool: { tier, speed } hammers. weapon: { atk }. food: { heal }.
export const ITEMS = {
  // placeable blocks
  dirt: { name: "土", kind: "block", block: B.DIRT, tile: "dirt", stack: 99 },
  stone: { name: "石", kind: "block", block: B.STONE, tile: "stone", stack: 99 },
  sand: { name: "すな", kind: "block", block: B.SAND, tile: "sand", stack: 99 },
  log: { name: "木材", kind: "block", block: B.LOG, tile: "log_side", stack: 99 },
  plank: { name: "板材", kind: "block", block: B.PLANK, tile: "plank", stack: 99 },
  wall: { name: "白かべ", kind: "block", block: B.WALL, tile: "wall", stack: 99 },
  thatch: { name: "かやぶき", kind: "block", block: B.THATCH, tile: "thatch", stack: 99 },
  farmland: { name: "耕した土", kind: "block", block: B.FARMLAND, tile: "farmland", stack: 99 },
  fence: { name: "柵", kind: "block", block: B.FENCE, icon: "🪵", stack: 99 },
  spikes: { name: "とげ罠", kind: "block", block: B.SPIKES, icon: "📌", stack: 99 },
  torch: { name: "たいまつ", kind: "block", block: B.TORCH, icon: "🔥", stack: 99 },
  door: { name: "木の扉", kind: "block", block: B.DOOR, icon: "🚪", stack: 20 },
  workbench: { name: "作業台", kind: "block", block: B.WORKBENCH, icon: "🛠️", stack: 5 },
  chest: { name: "収納箱", kind: "block", block: B.CHEST, icon: "📦", stack: 10 },
  bed: { name: "わらのベッド", kind: "block", block: B.BED, icon: "🛏️", stack: 10 },
  altar: { name: "職業の祭壇", kind: "block", block: B.ALTAR, icon: "🔮", stack: 3 },
  torii: { name: "鳥居", kind: "block", block: B.TORII, icon: "⛩️", stack: 5 },
  scarecrow: { name: "かかし", kind: "block", block: B.SCARECROW, icon: "🎃", stack: 5 },
  waterway: { name: "用水路", kind: "block", block: B.WATERWAY, tile: "waterway_top", stack: 99 },
  kamado: { name: "かまど", kind: "block", block: B.KAMADO, icon: "🍳", stack: 3 },
  table: { name: "ちゃぶ台", kind: "block", block: B.TABLE, icon: "🪑", stack: 5 },
  sail: { name: "帆", kind: "block", block: B.SAIL, tile: "sail", stack: 20 },
  shipwall: { name: "船の外板", kind: "block", block: B.SHIPWALL, tile: "shipwall", stack: 99 },
  helm: { name: "舵輪", kind: "block", block: B.HELM, icon: "☸", stack: 3 },
  // materials
  straw: { name: "わら", kind: "material", icon: "🌾", stack: 99 },
  copper: { name: "銅こうせき", kind: "material", icon: "🟠", stack: 99 },
  jelly: { name: "スライムゼリー", kind: "material", icon: "🫧", stack: 99 },
  wing: { name: "こうもりのはね", kind: "material", icon: "🦇", stack: 99 },
  rice: { name: "米", kind: "material", icon: "🍚", stack: 99 },
  seed: { name: "種もみ", kind: "seed", icon: "🌱", stack: 99 },
  clay: { name: "ねん土", kind: "material", icon: "🟤", stack: 99 },
  hide: { name: "けもの皮", kind: "material", icon: "🐾", stack: 99 },
  fish: { name: "さかな", kind: "material", icon: "🐟", stack: 99 },
  mushroom: { name: "きのこ", kind: "material", icon: "🍄", stack: 99 },
  // 第3章
  rope: { name: "ロープ", kind: "material", icon: "🪢", stack: 99 },
  sailcloth: { name: "帆布", kind: "material", icon: "🧵", stack: 99 },
  squid_ink: { name: "イカスミ", kind: "material", icon: "⚫", stack: 99 },
  fitting: { name: "銅の金具", kind: "material", icon: "🔩", stack: 99 },
  // tools / weapons / armor
  hammer_wood: { name: "木のハンマー", kind: "tool", tier: 0, speed: 1, icon: "🔨" },
  hammer_stone: { name: "石のハンマー", kind: "tool", tier: 1, speed: 2, icon: "⚒️" },
  club: { name: "こん棒", kind: "weapon", atk: 2, icon: "🏏" },
  sword_stone: { name: "石の剣", kind: "weapon", atk: 4, icon: "🗡️" },
  sword_copper: { name: "銅の剣", kind: "weapon", atk: 7, icon: "⚔️" },
  cape: { name: "こうもりのマント", kind: "armor", def: 2, hp: 6, icon: "🧣" },
  // food
  // buff: 食べると一定時間の満腹バフ {t: 秒, atk: 攻撃+, regen: HP自動回復/秒}。
  // 空腹ペナルティは無し（バフ型）。かまど料理ほど強いバフがつく。
  herb: { name: "やくそう", kind: "food", heal: 5, icon: "🌿", stack: 99 },
  onigiri: { name: "おにぎり", kind: "food", heal: 12, icon: "🍙", stack: 99, buff: { t: 60, atk: 1, regen: 0 } },
  grilled_fish: { name: "焼き魚", kind: "food", heal: 16, icon: "🍢", stack: 99, buff: { t: 90, atk: 1, regen: 0.5 } },
  mushroom_soup: { name: "きのこ汁", kind: "food", heal: 14, icon: "🍲", stack: 99, buff: { t: 90, atk: 0, regen: 1.0 } },
  feast: { name: "ごちそう膳", kind: "food", heal: 30, icon: "🍱", stack: 20, buff: { t: 150, atk: 2, regen: 1.0 } },
  squid_soup: { name: "イカスミ汁", kind: "food", heal: 18, icon: "🍜", stack: 99, buff: { t: 110, atk: 1, regen: 0.8 } },
};

// unlock: quest stage id at which the recipe appears (see quests.js STAGES).
export const RECIPES = [
  { out: "workbench", n: 1, cost: { log: 3 }, station: "hand", unlock: "GATHER_WOOD" },
  { out: "chest", n: 1, cost: { plank: 4 }, station: "bench", unlock: "BUILD_HUT" },
  { out: "plank", n: 4, cost: { log: 1 }, station: "bench", unlock: "BUILD_HUT" },
  { out: "door", n: 1, cost: { plank: 2 }, station: "bench", unlock: "BUILD_HUT" },
  { out: "bed", n: 1, cost: { plank: 2, straw: 2 }, station: "bench", unlock: "BUILD_HUT" },
  { out: "torch", n: 2, cost: { log: 1, jelly: 1 }, station: "bench", unlock: "BUILD_HUT" },
  { out: "club", n: 1, cost: { log: 2 }, station: "bench", unlock: "BUILD_HUT" },
  { out: "wall", n: 2, cost: { dirt: 2 }, station: "bench", unlock: "BUILD_HUT" },
  { out: "farmland", n: 2, cost: { dirt: 2 }, station: "bench", unlock: "BUILD_FARM" },
  { out: "fence", n: 3, cost: { log: 2 }, station: "bench", unlock: "BUILD_FARM" },
  { out: "scarecrow", n: 1, cost: { log: 2, straw: 2 }, station: "bench", unlock: "BUILD_FARM" },
  { out: "hammer_stone", n: 1, cost: { stone: 3, log: 2 }, station: "bench", unlock: "BUILD_FARM" },
  { out: "sword_stone", n: 1, cost: { stone: 3, log: 1 }, station: "bench", unlock: "FARMING" },
  { out: "onigiri", n: 1, cost: { rice: 2 }, station: "hand", unlock: "PREPARE" },
  { out: "sword_copper", n: 1, cost: { copper: 3, log: 1 }, station: "bench", unlock: "PREPARE" },
  { out: "cape", n: 1, cost: { wing: 4, jelly: 2 }, station: "bench", unlock: "PREPARE" },
  { out: "spikes", n: 2, cost: { stone: 2, jelly: 1 }, station: "bench", unlock: "PREPARE" },
  { out: "thatch", n: 2, cost: { straw: 2 }, station: "bench", unlock: "BUILD_SHRINE" },
  { out: "altar", n: 1, cost: { stone: 3, copper: 1 }, station: "bench", unlock: "BUILD_SHRINE" },
  { out: "torii", n: 1, cost: { log: 4 }, station: "bench", unlock: "BUILD_SHRINE" },
  // --- 第2章 ---------------------------------------------------------------
  { out: "waterway", n: 2, cost: { stone: 2, clay: 1 }, station: "bench", unlock: "REPAIR_PADDY" },
  { out: "kamado", n: 1, cost: { stone: 4, clay: 2 }, station: "bench", unlock: "BUILD_KITCHEN" },
  { out: "table", n: 1, cost: { plank: 3 }, station: "bench", unlock: "BUILD_KITCHEN" },
  // かまど料理（station: "kamado" はかまどの近くでだけ作れる）
  { out: "grilled_fish", n: 1, cost: { fish: 1 }, station: "kamado", unlock: "COOK_TOGETHER" },
  { out: "mushroom_soup", n: 1, cost: { mushroom: 2, herb: 1 }, station: "kamado", unlock: "COOK_TOGETHER" },
  { out: "feast", n: 1, cost: { rice: 2, fish: 1, mushroom: 1 }, station: "kamado", unlock: "COOK_TOGETHER" },
  // --- 第3章「旅立ちの港」---------------------------------------------------
  { out: "squid_soup", n: 1, cost: { squid_ink: 1, mushroom: 1 }, station: "kamado", unlock: "CH3_LIGHTHOUSE" },
  // 銅の金具: 余りがちな銅こうせきの回収先。外板・舵輪の材料になる。
  { out: "fitting", n: 1, cost: { copper: 2 }, station: "bench", unlock: "CH3_HULL" },
  // 船の外板: 板材＋ねん土（防水）＋銅の金具（船釘）。船体の舷側・船首に使う。
  { out: "shipwall", n: 8, cost: { plank: 2, clay: 1, fitting: 1 }, station: "bench", unlock: "CH3_HULL" },
  { out: "rope", n: 1, cost: { hide: 2 }, station: "bench", unlock: "CH3_HULL" }, // 未利用だったけもの皮の回収
  { out: "helm", n: 1, cost: { plank: 2, fitting: 1 }, station: "bench", unlock: "CH3_MAST" },
  { out: "sailcloth", n: 1, cost: { straw: 3 }, station: "bench", unlock: "CH3_SAIL" },
  { out: "sail", n: 4, cost: { sailcloth: 2, rope: 1 }, station: "bench", unlock: "CH3_SAIL" },
];

// Item id for a block id (for drops / blueprint material lists).
export function itemForBlock(blockId) {
  for (const [id, def] of Object.entries(ITEMS)) {
    if (def.kind === "block" && def.block === blockId) return id;
  }
  return null;
}

// --- item icons -------------------------------------------------------------------
// 16px pixel-art icons drawn in Storybook_Character_Studio/prototypes/item-icons/ and
// exported with `npm.cmd run export:items -- --preview-game`. Until the atlas has
// loaded (or for an id without a cell), icons fall back to the block tile / emoji.
const ICON_ATLAS_URL = new URL("../../assets/items/item_icons_16.png", import.meta.url).href;
let iconAtlas = null;
const iconReadyListeners = [];
const iconCache = new Map();

// Node.js (tests that import RECIPES etc.) has no Image; the icons are browser-only.
if (typeof Image !== "undefined") {
  const atlasImage = new Image();
  atlasImage.onload = () => {
    iconAtlas = atlasImage;
    iconCache.clear();
    for (const fn of iconReadyListeners) fn();
  };
  atlasImage.onerror = () => console.warn("item icon atlas failed to load; using fallback icons");
  atlasImage.src = ICON_ATLAS_URL;
}

// Called once the atlas has loaded, so already shown icons can be redrawn.
export function onItemIconsReady(fn) {
  if (iconAtlas) fn();
  else iconReadyListeners.push(fn);
}

// "atlas" | "tile" | "emoji": which source itemIcon() uses for an id right now.
export function itemIconSource(itemId) {
  if (iconAtlas && ICON_ATLAS.cells[itemId]) return "atlas";
  return ITEMS[itemId].tile ? "tile" : "emoji";
}

// Which items still use a fallback icon (for tests and debugging).
export function itemIconReport() {
  const ids = Object.keys(ITEMS);
  return { loaded: !!iconAtlas, total: ids.length, fallback: ids.filter((id) => itemIconSource(id) !== "atlas") };
}

// 36px icon as a data URL. Atlas icons are drawn at 2x (32px) with a 2px margin,
// the same footprint as the old block tile icons, so pixels stay square.
export function itemIcon(itemId) {
  if (iconCache.has(itemId)) return iconCache.get(itemId);
  const def = ITEMS[itemId];
  const canvas = document.createElement("canvas");
  canvas.width = 36;
  canvas.height = 36;
  const ctx = canvas.getContext("2d");
  const source = itemIconSource(itemId);
  if (source === "atlas") {
    const size = ICON_ATLAS.cellSize;
    const [col, row] = ICON_ATLAS.cells[itemId];
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(iconAtlas, col * size, row * size, size, size, 2, 2, size * 2, size * 2);
  } else if (def.tile) {
    drawTileIcon(ctx, def.tile, 2, 2, 32);
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.strokeRect(2.5, 2.5, 31, 31);
  } else {
    ctx.font = "26px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.icon ?? "❓", 18, 20);
  }
  const url = canvas.toDataURL();
  iconCache.set(itemId, url);
  return url;
}

export class Inventory {
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
    const stack = ITEMS[id].stack ?? 1;
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
    const stack = ITEMS[id].stack ?? 1;
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
}
