import { defineInventory } from "../../../game-shared/inventory.mjs";
import { B, drawTileIcon } from "../world/blocks.js";
import ICON_ATLAS from "../../assets/items/item_icons_16.json" with { type: "json" };

// kind: block | tool | weapon | armor | food | material | seed
// tool: { tier, speed } hammers. weapon: { atk }. food: { heal }.
export const ITEMS = {
  // placeable blocks
  dirt: { name: "土", kind: "block", block: B.DIRT, tile: "dirt", stack: 99 },
  stone: { name: "石", kind: "block", block: B.STONE, tile: "stone", stack: 99 },
  sand: { name: "すな", kind: "block", block: B.SAND, tile: "sand", stack: 99 },
  black_sand: { name: "黒砂", kind: "block", block: B.BLACK_SAND, tile: "black_sand", stack: 99 },
  log: { name: "木材", kind: "block", block: B.LOG, tile: "log_side", stack: 99 },
  plank: { name: "板材", kind: "block", block: B.PLANK, tile: "plank", stack: 99 },
  wall: { name: "白かべ", kind: "block", block: B.WALL, tile: "wall", stack: 99 },
  thatch: { name: "かやぶき", kind: "block", block: B.THATCH, tile: "thatch", stack: 99 },
  farmland: { name: "耕した土", kind: "block", block: B.FARMLAND, tile: "farmland", stack: 99 },
  bamboo: { name: "竹材", kind: "block", block: B.BAMBOO, tile: "bamboo_side", stack: 99 },
  bamboo_channel: { name: "竹の導水路", kind: "block", block: B.BAMBOO_CHANNEL, tile: "channel_top", stack: 99 },
  fence: { name: "柵", kind: "block", block: B.FENCE, icon: "🪵", stack: 99 },
  spikes: { name: "とげ罠", kind: "block", block: B.SPIKES, icon: "📌", stack: 99 },
  torch: { name: "たいまつ", kind: "block", block: B.TORCH, icon: "🔥", stack: 99 },
  mine_lamp: { name: "坑道灯", kind: "block", block: B.MINE_LAMP, icon: "🏮", stack: 99 },
  door: { name: "木の扉", kind: "block", block: B.DOOR, icon: "🚪", stack: 20 },
  workbench: { name: "作業台", kind: "block", block: B.WORKBENCH, icon: "🛠️", stack: 5 },
  chest: { name: "収納箱", kind: "block", block: B.CHEST, icon: "📦", stack: 10 },
  bed: { name: "わらのベッド", kind: "block", block: B.BED, icon: "🛏️", stack: 10 },
  altar: { name: "職業の祭壇", kind: "block", block: B.ALTAR, icon: "🔮", stack: 3 },
  torii: { name: "鳥居", kind: "block", block: B.TORII, icon: "⛩️", stack: 5 },
  kamado: { name: "かまど", kind: "block", block: B.KAMADO, icon: "🍳", stack: 3 },
  table: { name: "ちゃぶ台", kind: "block", block: B.TABLE, icon: "🪑", stack: 5 },
  kiln: { name: "炭焼き窯", kind: "block", block: B.KILN, icon: "🏭", stack: 3 },
  forge: { name: "炉", kind: "block", block: B.FORGE, icon: "🔥", stack: 3 },
  anvil: { name: "金床", kind: "block", block: B.ANVIL, icon: "🧱", stack: 3 },
  trough: { name: "水桶", kind: "block", block: B.TROUGH, icon: "🪣", stack: 5 },
  iron_pot: { name: "鉄鍋", kind: "block", block: B.IRON_POT, icon: "🍲", stack: 1 },
  sail: { name: "帆", kind: "block", block: B.SAIL, tile: "sail", stack: 20 },
  shipwall: { name: "船の外板", kind: "block", block: B.SHIPWALL, tile: "shipwall", stack: 99 },
  helm: { name: "舵輪", kind: "block", block: B.HELM, icon: "☸", stack: 3 },
  // materials
  straw: { name: "わら", kind: "material", icon: "🌾", stack: 99 },
  clay: { name: "ねん土", kind: "material", icon: "🟤", stack: 99 },
  hide: { name: "けもの皮", kind: "material", icon: "🐾", stack: 99 },
  fish: { name: "さかな", kind: "material", icon: "🐟", stack: 99 },
  mushroom: { name: "きのこ", kind: "material", icon: "🍄", stack: 99 },
  wing: { name: "こうもりのはね", kind: "material", icon: "🦇", stack: 99 },
  // --- 第4章: 鍛冶の素材 ------------------------------------------------------------
  iron_ore: { name: "鉄鉱石", kind: "material", icon: "🪨", stack: 99 },
  charcoal: { name: "木炭", kind: "material", icon: "⬛", stack: 99 },
  iron: { name: "鉄", kind: "material", icon: "🔩", stack: 99 },
  iron_fitting: { name: "鉄の金具", kind: "material", icon: "⚙️", stack: 99 },
  wisp_ember: { name: "鬼火のかけら", kind: "material", icon: "🔥", stack: 99 },
  volcano_grain: { name: "火山穀物", kind: "material", icon: "🌾", stack: 99 },
  volcano_grain_seed: { name: "火山穀物の種", kind: "seed", icon: "🌱", stack: 99 },
  // --- 第5章: 竹林の素材 ---------------------------------------------------------------
  herb: { name: "やくそう", kind: "food", heal: 5, icon: "🌿", stack: 99 },
  incense_herb: { name: "清めの香草", kind: "material", icon: "🌸", stack: 99 },
  black_scale: { name: "無銘の黒鱗", kind: "material", icon: "🖤", stack: 9 },
  // tools / weapons / armor
  hammer_wood: { name: "木のハンマー", kind: "tool", tier: 0, speed: 1, icon: "🔨" },
  hammer_stone: { name: "石のハンマー", kind: "tool", tier: 1, speed: 2, icon: "⚒️" },
  hammer_iron: { name: "鉄のハンマー", kind: "tool", tier: 2, speed: 3, icon: "⛏️" },
  machete: { name: "鉄の山刀", kind: "tool", tier: 2, speed: 3, icon: "🔪" },
  club: { name: "こん棒", kind: "weapon", atk: 2, icon: "🏏" },
  sword_stone: { name: "石の剣", kind: "weapon", atk: 4, icon: "🗡️" },
  sword_copper: { name: "銅の剣", kind: "weapon", atk: 7, icon: "⚔️" },
  sword_iron: { name: "鉄の剣", kind: "weapon", atk: 10, icon: "⚔️" },
  iron_armor: { name: "鉄の胸あて", kind: "armor", def: 3, hp: 8, icon: "🛡️" },
  // food
  // buff: 食べると一定時間の満腹バフ {t: 秒, atk: 攻撃+, regen: HP自動回復/秒}。
  // 空腹ペナルティは無し（バフ型）。かまど・鉄鍋料理ほど強いバフがつく。
  onigiri: { name: "おにぎり", kind: "food", heal: 12, icon: "🍙", stack: 99, buff: { t: 60, atk: 1, regen: 0 } },
  grilled_fish: { name: "焼き魚", kind: "food", heal: 16, icon: "🍢", stack: 99, buff: { t: 90, atk: 1, regen: 0.5 } },
  mushroom_soup: { name: "きのこ汁", kind: "food", heal: 14, icon: "🍲", stack: 99, buff: { t: 90, atk: 0, regen: 1.0 } },
  grain_meal: { name: "火山穀物の飯", kind: "food", heal: 18, icon: "🍚", stack: 99, buff: { t: 110, atk: 1, regen: 0.6 } },
  miner_feast: { name: "山の衆の膳", kind: "food", heal: 30, icon: "🍱", stack: 20, buff: { t: 150, atk: 2, regen: 1.0 } },
  // 第5章: 薬草の煎じ湯（一定時間、瘴気の継続ダメージを防ぐ）と病人の粥。
  herb_tea: { name: "薬草の煎じ湯", kind: "food", heal: 6, icon: "🍵", stack: 99, buff: { t: 120, atk: 0, regen: 0.3, taint: true } },
  porridge: { name: "火山穀物の粥", kind: "food", heal: 22, icon: "🥣", stack: 99, buff: { t: 90, atk: 0, regen: 1.0 } },
};

// unlock: quest stage id at which the recipe appears (see quests.js STAGE_ORDER).
export const RECIPES = [
  // --- 基本（上陸直後から） -----------------------------------------------------------
  { out: "workbench", n: 1, cost: { log: 3 }, station: "hand", unlock: "CH4_ARRIVAL" },
  { out: "plank", n: 4, cost: { log: 1 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "chest", n: 1, cost: { plank: 4 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "door", n: 1, cost: { plank: 2 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "bed", n: 1, cost: { plank: 2, straw: 2 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "torch", n: 2, cost: { log: 1, straw: 1 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "wall", n: 2, cost: { dirt: 2 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "club", n: 1, cost: { log: 2 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "hammer_stone", n: 1, cost: { stone: 3, log: 2 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "sword_stone", n: 1, cost: { stone: 3, log: 1 }, station: "bench", unlock: "CH4_ARRIVAL" },
  { out: "grilled_fish", n: 1, cost: { fish: 1 }, station: "kamado", unlock: "CH4_ARRIVAL" },
  // --- 住民が戻り、町の暮らしを立て直す ---------------------------------------------------
  { out: "farmland", n: 2, cost: { dirt: 2 }, station: "bench", unlock: "CH4_GATHER_PEOPLE" },
  { out: "fence", n: 3, cost: { log: 2 }, station: "bench", unlock: "CH4_GATHER_PEOPLE" },
  { out: "mushroom_soup", n: 1, cost: { mushroom: 2, herb: 1 }, station: "kamado", unlock: "CH4_GATHER_PEOPLE" },
  // --- 廃鉱を開く -----------------------------------------------------------------------
  { out: "mine_lamp", n: 2, cost: { log: 1, wisp_ember: 1 }, station: "bench", unlock: "CH4_MINE" },
  // --- 炭と炉 ---------------------------------------------------------------------------
  { out: "kiln", n: 1, cost: { stone: 4, clay: 2 }, station: "bench", unlock: "CH4_FORGE" },
  { out: "forge", n: 1, cost: { stone: 6, clay: 2 }, station: "bench", unlock: "CH4_FORGE" },
  { out: "trough", n: 1, cost: { plank: 3 }, station: "bench", unlock: "CH4_FORGE" },
  { out: "charcoal", n: 2, cost: { log: 2 }, station: "kiln", unlock: "CH4_FORGE" },
  { out: "iron", n: 1, cost: { iron_ore: 2, charcoal: 1 }, station: "forge", unlock: "CH4_FORGE" },
  // --- 暮らしの鉄（ベルクとの共同鍛造） ----------------------------------------------------
  { out: "hammer_iron", n: 1, cost: { iron: 3, log: 2 }, station: "forge", unlock: "CH4_WORK_TOGETHER" },
  { out: "iron_fitting", n: 2, cost: { iron: 1 }, station: "forge", unlock: "CH4_WORK_TOGETHER" },
  { out: "iron_pot", n: 1, cost: { iron: 3, stone: 2 }, station: "forge", unlock: "CH4_WORK_TOGETHER" },
  // 舵輪: 船の補修部品（ワタリの船の舵を壊してしまった時の作り直し用）。
  { out: "helm", n: 1, cost: { plank: 2, iron_fitting: 1 }, station: "bench", unlock: "CH4_WORK_TOGETHER" },
  { out: "grain_meal", n: 1, cost: { volcano_grain: 2 }, station: "kamado", unlock: "CH4_WORK_TOGETHER" },
  { out: "table", n: 1, cost: { plank: 3 }, station: "bench", unlock: "CH4_WORK_TOGETHER" },
  { out: "miner_feast", n: 1, cost: { volcano_grain: 2, fish: 1, mushroom: 1 }, station: "kamado", unlock: "CH4_WORK_TOGETHER" },
  // --- 鍛冶屋の書の復活後: 町を守る鉄 ------------------------------------------------------
  { out: "sword_iron", n: 1, cost: { iron: 3, log: 1 }, station: "forge", unlock: "CH4_BOOK" },
  { out: "iron_armor", n: 1, cost: { iron: 4, hide: 1 }, station: "forge", unlock: "CH4_BOOK" },
  { out: "spikes", n: 2, cost: { iron: 1, stone: 1 }, station: "bench", unlock: "CH4_BOOK" },
  { out: "anvil", n: 1, cost: { iron: 3, stone: 2 }, station: "forge", unlock: "CH4_BOOK" },
  { out: "onigiri", n: 1, cost: { volcano_grain: 2 }, station: "hand", unlock: "CH4_BOOK" },
  // --- 第4章クリア後（町を広げられるように） ----------------------------------------------
  { out: "thatch", n: 2, cost: { straw: 2 }, station: "bench", unlock: "CH4_DONE" },
  { out: "kamado", n: 1, cost: { stone: 4, clay: 2 }, station: "bench", unlock: "CH4_DONE" },
  // --- 第5章「眠る竹林の社」 ---------------------------------------------------------------
  // 鉄の山刀: ベルクとの短い共同作業で最初の1本をもらう。失くした時の作り直し用レシピ。
  { out: "machete", n: 1, cost: { iron: 2, log: 1 }, station: "forge", unlock: "CH5_BAMBOO_GATE" },
  { out: "porridge", n: 1, cost: { volcano_grain: 2, herb: 1 }, station: "kamado", unlock: "CH5_LODGE" },
  { out: "herb_tea", n: 1, cost: { herb: 2 }, station: "kamado", unlock: "CH5_HERB_GARDEN" },
  { out: "altar", n: 1, cost: { stone: 3, iron: 1 }, station: "bench", unlock: "CH5_OUTER_SHRINE" },
  // 清めの香草は竹林の採取地点が正規の入手先。摘み尽くした時の予備レシピ。
  { out: "incense_herb", n: 1, cost: { herb: 3 }, station: "hand", unlock: "CH5_OUTER_SHRINE" },
  // 竹の導水路: 薬草園（水路の終端）から泉の導水路まで使う。宿坊の段階で解放。
  { out: "bamboo_channel", n: 2, cost: { bamboo: 2 }, station: "bench", unlock: "CH5_LODGE" },
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

export const Inventory = defineInventory(ITEMS);
