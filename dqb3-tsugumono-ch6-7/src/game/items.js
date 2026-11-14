import { defineInventory } from "../../../game-shared/inventory.mjs";
import { B, CROSSBOW_BLOCKS, drawTileIcon } from "../world/blocks.js";
import ICON_ATLAS from "../../assets/items/item_icons_16.json" with { type: "json" };

// kind: block | tool | weapon | armor | food | material | seed
// tool: { tier, speed } hammers. weapon: { atk }. food: { heal }. armor: { def, hp }.
// model: 手に持ったときの3Dの道具（rig.js の TOOL_BUILDERS の名前）。無ければ id をそのまま使う。
// blocks: 同じアイテムで置ける別のブロック（ボウガンの4方向）。
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
  kamado: { name: "かまど", kind: "block", block: B.KAMADO, icon: "🍳", stack: 3 },
  table: { name: "ちゃぶ台", kind: "block", block: B.TABLE, icon: "🪑", stack: 5 },
  kiln: { name: "炭焼き窯", kind: "block", block: B.KILN, icon: "🏭", stack: 3 },
  forge: { name: "炉", kind: "block", block: B.FORGE, icon: "🔥", stack: 3 },
  anvil: { name: "金床", kind: "block", block: B.ANVIL, icon: "🧱", stack: 3 },
  trough: { name: "水桶", kind: "block", block: B.TROUGH, icon: "🪣", stack: 5 },
  sail: { name: "帆", kind: "block", block: B.SAIL, tile: "sail", stack: 20 },
  shipwall: { name: "船の外板", kind: "block", block: B.SHIPWALL, tile: "shipwall", stack: 99 },
  helm: { name: "舵輪", kind: "block", block: B.HELM, icon: "☸", stack: 3 },
  // --- 第6章: 神殿の建材 ------------------------------------------------------------
  dharma_stone: { name: "神殿の石", kind: "block", block: B.DHARMA_STONE, tile: "dharma_stone", stack: 99 },
  dharma_pillar: { name: "神殿の柱", kind: "block", block: B.DHARMA_PILLAR, tile: "pillar_side", stack: 99 },
  roof: { name: "屋根板", kind: "block", block: B.ROOF, tile: "roof_top", stack: 99 },
  emblem: { name: "書の紋章", kind: "block", block: B.EMBLEM, tile: "emblem", stack: 3 },
  lantern: { name: "提灯", kind: "block", block: B.LANTERN, icon: "🏮", stack: 20 },
  bookshelf: { name: "本棚", kind: "block", block: B.BOOKSHELF, tile: "bookshelf", stack: 20 },
  keystone: { name: "要石", kind: "block", block: B.KEYSTONE, tile: "keystone", stack: 1 },
  flame_bowl: { name: "授職の灯の石皿", kind: "block", block: B.FLAME_BOWL, icon: "🔥", stack: 1 },
  select_pillar: { name: "選択の柱", kind: "block", block: B.SELECT_PILLAR0, icon: "🗿", stack: 1 },
  // --- 第7章: 防衛 ------------------------------------------------------------------
  palisade: { name: "丸太の防壁", kind: "block", block: B.PALISADE, tile: "palisade_side", stack: 99 },
  gate: { name: "門", kind: "block", block: B.GATE, icon: "🚪", stack: 5 },
  crossbow: { name: "ボウガン", kind: "block", block: B.CROSSBOW_S, blocks: CROSSBOW_BLOCKS, icon: "🏹", stack: 10 },
  great_ballista: { name: "大型対空ボウガン", kind: "block", block: B.GREAT_BALLISTA, icon: "🎯", stack: 1 },
  // materials
  straw: { name: "わら", kind: "material", icon: "🌾", stack: 99 },
  clay: { name: "ねん土", kind: "material", icon: "🟤", stack: 99 },
  hide: { name: "けもの皮", kind: "material", icon: "🐾", stack: 99 },
  fish: { name: "さかな", kind: "material", icon: "🐟", stack: 99 },
  mushroom: { name: "きのこ", kind: "material", icon: "🍄", stack: 99 },
  wing: { name: "こうもりのはね", kind: "material", icon: "🦇", stack: 99 },
  iron_ore: { name: "鉄鉱石", kind: "material", icon: "🪨", stack: 99 },
  charcoal: { name: "木炭", kind: "material", icon: "⬛", stack: 99 },
  iron: { name: "鉄", kind: "material", icon: "🔩", stack: 99 },
  iron_fitting: { name: "鉄の金具", kind: "material", icon: "⚙️", stack: 99 },
  steel: { name: "鋼", kind: "material", icon: "🔷", stack: 99 },
  meat: { name: "けもの肉", kind: "material", icon: "🍖", stack: 99 },
  crab_meat: { name: "カニの身", kind: "material", icon: "🦀", stack: 99 },
  barley: { name: "山麦", kind: "material", icon: "🌾", stack: 99 },
  barley_seed: { name: "山麦の種", kind: "seed", icon: "🌱", stack: 99 },
  wedge: { name: "くさび", kind: "material", icon: "🔺", stack: 9 },
  bolt: { name: "ボウガンの矢", kind: "material", icon: "➶", stack: 99 },
  great_bolt: { name: "大矢", kind: "material", icon: "🏹", stack: 99 },
  book_copy: { name: "職業の書の写し", kind: "material", icon: "📗", stack: 1 },
  // tools / weapons / armor
  hammer_stone: { name: "石のハンマー", kind: "tool", tier: 1, speed: 2, icon: "⚒️" },
  hammer_iron: { name: "鉄のハンマー", kind: "tool", tier: 2, speed: 3, icon: "⛏️" },
  sword_stone: { name: "石の剣", kind: "weapon", atk: 4, icon: "🗡️" },
  sword_iron: { name: "鉄の剣", kind: "weapon", atk: 10, icon: "⚔️" },
  sword_steel: { name: "鋼の剣", kind: "weapon", atk: 14, icon: "⚔️", model: "sword_iron" },
  iron_armor: { name: "鉄の胸あて", kind: "armor", def: 3, hp: 8, icon: "🛡️" },
  steel_armor: { name: "鋼の胸あて", kind: "armor", def: 5, hp: 12, icon: "🛡️" },
  // food
  // buff: 食べると一定時間の満腹バフ {t: 秒, atk: 攻撃+, regen: HP自動回復/秒}。
  herb: { name: "やくそう", kind: "food", heal: 5, icon: "🌿", stack: 99 },
  nuts: { name: "木の実", kind: "food", heal: 3, icon: "🌰", stack: 99 },
  onigiri: { name: "おにぎり", kind: "food", heal: 12, icon: "🍙", stack: 99, buff: { t: 60, atk: 1, regen: 0 } },
  grilled_fish: { name: "焼き魚", kind: "food", heal: 16, icon: "🍢", stack: 99, buff: { t: 90, atk: 1, regen: 0.5 } },
  mushroom_soup: { name: "きのこ汁", kind: "food", heal: 14, icon: "🍲", stack: 99, buff: { t: 90, atk: 0, regen: 1.0 } },
  grilled_meat: { name: "山の焼き肉", kind: "food", heal: 18, icon: "🍖", stack: 99, buff: { t: 100, atk: 2, regen: 0.3 } },
  crab_soup: { name: "カニ汁", kind: "food", heal: 20, icon: "🍜", stack: 99, buff: { t: 110, atk: 1, regen: 1.0 } },
  barley_porridge: { name: "麦がゆ", kind: "food", heal: 16, icon: "🥣", stack: 99, buff: { t: 90, atk: 0, regen: 0.8 } },
  builder_feast: { name: "普請の膳", kind: "food", heal: 32, icon: "🍱", stack: 20, buff: { t: 160, atk: 2, regen: 1.2 } },
};

// unlock: quest stage id at which the recipe appears (see quests.js STAGE_ORDER).
export const RECIPES = [
  // --- 基本（上陸直後から） -----------------------------------------------------------
  { out: "workbench", n: 1, cost: { log: 3 }, station: "hand", unlock: "CH6_ARRIVAL" },
  { out: "plank", n: 4, cost: { log: 1 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "fence", n: 3, cost: { log: 2 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "chest", n: 1, cost: { plank: 4 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "door", n: 1, cost: { plank: 2 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "bed", n: 1, cost: { plank: 2, straw: 2 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "torch", n: 2, cost: { log: 1, straw: 1 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "wall", n: 2, cost: { dirt: 2 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "hammer_stone", n: 1, cost: { stone: 3, log: 2 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "sword_stone", n: 1, cost: { stone: 3, log: 1 }, station: "bench", unlock: "CH6_ARRIVAL" },
  { out: "grilled_fish", n: 1, cost: { fish: 1 }, station: "kamado", unlock: "CH6_ARRIVAL" },
  // --- 共同小屋（暮らしの拠点） ---------------------------------------------------------
  { out: "thatch", n: 2, cost: { straw: 2 }, station: "bench", unlock: "CH6_RUINS" },
  { out: "kamado", n: 1, cost: { stone: 4, clay: 2 }, station: "bench", unlock: "CH6_RUINS" },
  { out: "table", n: 1, cost: { plank: 3 }, station: "bench", unlock: "CH6_RUINS" },
  { out: "mushroom_soup", n: 1, cost: { mushroom: 2, herb: 1 }, station: "kamado", unlock: "CH6_RUINS" },
  { out: "grilled_meat", n: 1, cost: { meat: 1 }, station: "kamado", unlock: "CH6_RUINS" },
  { out: "barley_porridge", n: 1, cost: { barley: 2 }, station: "kamado", unlock: "CH6_RUINS" },
  { out: "onigiri", n: 1, cost: { barley: 2, nuts: 1 }, station: "hand", unlock: "CH6_RUINS" },
  // --- 基壇と神殿の石 -------------------------------------------------------------------
  { out: "dharma_stone", n: 2, cost: { stone: 2 }, station: "bench", unlock: "CH6_FOUNDATION" },
  { out: "farmland", n: 2, cost: { dirt: 2 }, station: "bench", unlock: "CH6_FOUNDATION" },
  // --- 採石洞（脇道の鉄で鍛冶ができる） ---------------------------------------------------
  { out: "kiln", n: 1, cost: { stone: 4, clay: 2 }, station: "bench", unlock: "CH6_QUARRY" },
  { out: "forge", n: 1, cost: { stone: 6, clay: 2 }, station: "bench", unlock: "CH6_QUARRY" },
  { out: "trough", n: 1, cost: { plank: 3 }, station: "bench", unlock: "CH6_QUARRY" },
  { out: "charcoal", n: 2, cost: { log: 2 }, station: "kiln", unlock: "CH6_QUARRY" },
  { out: "iron", n: 1, cost: { iron_ore: 2, charcoal: 1 }, station: "forge", unlock: "CH6_QUARRY" },
  { out: "iron_fitting", n: 2, cost: { iron: 1 }, station: "forge", unlock: "CH6_QUARRY" },
  { out: "hammer_iron", n: 1, cost: { iron: 3, log: 2 }, station: "forge", unlock: "CH6_QUARRY" },
  { out: "sword_iron", n: 1, cost: { iron: 3, log: 1 }, station: "forge", unlock: "CH6_QUARRY" },
  { out: "iron_armor", n: 1, cost: { iron: 4, hide: 1 }, station: "forge", unlock: "CH6_QUARRY" },
  { out: "crab_soup", n: 1, cost: { crab_meat: 2, mushroom: 1 }, station: "kamado", unlock: "CH6_QUARRY" },
  // --- 柱と大屋根 -----------------------------------------------------------------------
  { out: "dharma_pillar", n: 1, cost: { dharma_stone: 2 }, station: "bench", unlock: "CH6_ROOF" },
  { out: "roof", n: 2, cost: { plank: 2 }, station: "bench", unlock: "CH6_ROOF" },
  { out: "lantern", n: 2, cost: { plank: 1, torch: 1 }, station: "bench", unlock: "CH6_ROOF" },
  { out: "emblem", n: 1, cost: { plank: 2, iron_fitting: 1 }, station: "bench", unlock: "CH6_ROOF" },
  { out: "builder_feast", n: 1, cost: { meat: 1, fish: 1, mushroom: 1 }, station: "kamado", unlock: "CH6_ROOF" },
  // --- 祭壇と暮らしの設備 ---------------------------------------------------------------
  { out: "flame_bowl", n: 1, cost: { dharma_stone: 3, torch: 1 }, station: "bench", unlock: "CH6_ALTAR" },
  { out: "select_pillar", n: 1, cost: { dharma_stone: 3 }, station: "bench", unlock: "CH6_ALTAR" },
  { out: "bookshelf", n: 1, cost: { plank: 3 }, station: "bench", unlock: "CH6_LIVING" },
  // --- 第7章: 防衛 ----------------------------------------------------------------------
  { out: "palisade", n: 2, cost: { log: 2 }, station: "bench", unlock: "CH7_ALARM" },
  { out: "gate", n: 1, cost: { plank: 3, iron_fitting: 1 }, station: "bench", unlock: "CH7_ALARM" },
  { out: "crossbow", n: 1, cost: { log: 2, iron_fitting: 1, hide: 1 }, station: "bench", unlock: "CH7_ALARM" },
  { out: "bolt", n: 6, cost: { log: 1, stone: 1 }, station: "bench", unlock: "CH7_ALARM" },
  { out: "spikes", n: 2, cost: { iron: 1, stone: 1 }, station: "bench", unlock: "CH7_ALARM" },
  // --- ベルクの合流後 --------------------------------------------------------------------
  { out: "great_bolt", n: 3, cost: { log: 1, iron: 1 }, station: "forge", unlock: "CH7_BALLISTA" },
  { out: "steel", n: 1, cost: { iron: 2, charcoal: 1 }, station: "forge", unlock: "CH7_BALLISTA" },
  { out: "sword_steel", n: 1, cost: { steel: 3, log: 1 }, station: "forge", unlock: "CH7_BALLISTA" },
  { out: "steel_armor", n: 1, cost: { steel: 4, hide: 1 }, station: "forge", unlock: "CH7_BALLISTA" },
  { out: "anvil", n: 1, cost: { iron: 3, stone: 2 }, station: "forge", unlock: "CH7_BALLISTA" },
];

// Item id for a block id (for drops / blueprint material lists).
export function itemForBlock(blockId) {
  for (const [id, def] of Object.entries(ITEMS)) {
    if (def.kind !== "block") continue;
    if (def.block === blockId || def.blocks?.includes(blockId)) return id;
  }
  return null;
}

// いちばん強い所持中の防具（装備欄は無く、持っているだけで効く）。
export function bestArmor(inventory) {
  let best = null;
  for (const [id, def] of Object.entries(ITEMS)) {
    if (def.kind !== "armor" || !inventory.has(id)) continue;
    if (!best || def.def > best.def) best = { id, ...def };
  }
  return best;
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

export const Inventory = defineInventory(ITEMS);
