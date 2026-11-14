import * as THREE from "three";
import { mulberry32 } from "../core/utils.js";

// Block ids. 0 is air. "prop" blocks live in the voxel grid for placement /
// save / blueprint logic but are rendered as individual meshes (see props.js)
// instead of being merged into the chunk geometry.
//
// ダーマ再興編: 火山島編の基本ブロックを引き継ぎ、神殿・採石洞・防衛のブロックを足す。
// 新しいワールド（専用セーブ）なので id は振り直してある。
export const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  LOG: 6,
  LEAVES: 7,
  PLANK: 9,
  WALL: 10,
  THATCH: 11,
  FARMLAND: 12,
  FENCE: 13,
  SPIKES: 14,
  TORCH: 15,
  DOOR: 16,
  WORKBENCH: 17,
  BED: 18,
  CROP1: 19,
  CROP2: 20,
  CROP3: 21,
  BANNER: 25,
  BUSH: 26,
  CHEST: 27,
  MUD: 28,
  KAMADO: 30,
  TABLE: 31,
  MUSHROOM: 32,
  FISH_SPOT: 33,
  SAIL: 34,
  SHIPWALL: 35,
  HELM: 36,
  // --- 鍛冶（火山島編から引き継ぐ） -----------------------------------------------
  IRON_ORE: 43, // 鉄鉱脈（採石洞の脇道）
  KILN: 46, // 炭焼き窯
  FORGE: 47, // 炉
  ANVIL: 48, // 金床
  TROUGH: 49, // 水桶（水場・井戸）
  // --- 第6章: 島と神殿 -------------------------------------------------------------
  MOUNTAIN_ROCK: 60, // 山の岩
  PATH: 61, // 踏み固めた道
  BOULDER: 62, // 採石洞の入口をふさぐ大岩（物語で取り除く）
  ROCKFALL: 63, // 落石
  RUBBLE: 64, // 神殿跡の瓦礫
  DHARMA_STONE: 65, // 神殿の石
  DHARMA_PILLAR: 66, // 神殿の柱
  OLD_PILLAR: 67, // 崩れずに残った古い柱（壊せない）
  BROKEN_PILLAR: 68, // 折れた柱の根元
  ROOF: 69, // 屋根板（板葺きの大屋根）
  EMBLEM: 70, // 職業の書の紋章
  LANTERN: 71, // 提灯
  BOOKSHELF: 72, // 本棚
  KEYSTONE: 73, // 要石（祭壇に据える）
  FLAME_BOWL: 74, // 授職の灯の石皿
  KEYSTONE_ROCK: 75, // 要石の岩盤（採石場の北の壁）
  KEYSTONE_RAW: 76, // 切り出した要石（運び出すまで採石場に置く）
  WEDGE_MARK: 77, // くさびを打つ印
  WEDGE_SET: 78, // 打ったくさび
  SELECT_PILLAR0: 80, // 選択の柱（印なし）
  SELECT_PILLAR1: 81, // 印1（大工）
  SELECT_PILLAR2: 82, // 印2（石）
  SELECT_PILLAR3: 83, // 印3（食）
  SELECT_PILLAR4: 84, // 印4（守り）＝完成
  // --- 第7章: 防衛 -----------------------------------------------------------------
  PALISADE: 90, // 丸太の防壁
  GATE: 91, // 門（人は通れ、魔物は壊すまで通れない）
  CROSSBOW_N: 92, // ボウガン（北向き）
  CROSSBOW_E: 93,
  CROSSBOW_S: 94,
  CROSSBOW_W: 95,
  GREAT_BALLISTA: 96, // 大型対空ボウガン
};

export const CROSSBOW_BLOCKS = [B.CROSSBOW_N, B.CROSSBOW_E, B.CROSSBOW_S, B.CROSSBOW_W];
// ボウガンの向き（x, z）。北 = -z。
export const CROSSBOW_DIRS = {
  [B.CROSSBOW_N]: [0, -1],
  [B.CROSSBOW_E]: [1, 0],
  [B.CROSSBOW_S]: [0, 1],
  [B.CROSSBOW_W]: [-1, 0],
};
export const SELECT_PILLARS = [B.SELECT_PILLAR0, B.SELECT_PILLAR1, B.SELECT_PILLAR2, B.SELECT_PILLAR3, B.SELECT_PILLAR4];

// tex: atlas tile ids for [top, side, bottom] (cube blocks only).
// hardness: seconds to break with the matching-tier hammer. tier: minimum
// hammer tier required (0 = wood, 1 = stone, 2 = iron). drops: item id or null.
// raidTarget + hp: 防衛戦で魔物がかじって壊せる（門・柵・防壁）。
// siegeHp: 岩砕きのガーゴイルだけが砕ける（神殿の壁・柱・屋根）。
// burnable: ヴァルガの火炎で焼け落ちる（屋根）。
export const BLOCK_DEFS = {
  [B.GRASS]: { name: "草地", solid: true, opaque: true, tex: ["grass_top", "grass_side", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.DIRT]: { name: "土", solid: true, opaque: true, tex: ["dirt", "dirt", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.STONE]: { name: "石", solid: true, opaque: true, tex: ["stone", "stone", "stone"], hardness: 1.4, tier: 0, drops: "stone" },
  [B.SAND]: { name: "すな", solid: true, opaque: true, tex: ["sand", "sand", "sand"], hardness: 0.45, tier: 0, drops: "sand" },
  [B.WATER]: { name: "水", solid: false, opaque: false, tex: ["water", "water", "water"], hardness: Infinity, tier: 9 },
  [B.LOG]: { name: "木材", solid: true, opaque: true, tex: ["log_top", "log_side", "log_top"], hardness: 0.9, tier: 0, drops: "log", siegeHp: 20, burnable: true },
  [B.LEAVES]: { name: "木の葉", solid: true, opaque: false, tex: ["leaves", "leaves", "leaves"], hardness: 0.25, tier: 0, drops: null, bonusDrops: [["straw", 0.3], ["nuts", 0.18]] },
  [B.PLANK]: { name: "板材", solid: true, opaque: true, tex: ["plank", "plank", "plank"], hardness: 0.7, tier: 0, drops: "plank", siegeHp: 16, burnable: true },
  [B.WALL]: { name: "白かべ", solid: true, opaque: true, tex: ["wall", "wall", "wall"], hardness: 0.8, tier: 0, drops: "wall" },
  [B.THATCH]: { name: "かやぶき", solid: true, opaque: true, tex: ["thatch", "thatch", "thatch"], hardness: 0.5, tier: 0, drops: "thatch" },
  [B.FARMLAND]: { name: "耕した土", solid: true, opaque: true, tex: ["farmland", "dirt", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.FENCE]: { name: "柵", solid: true, opaque: false, prop: true, hardness: 0.5, tier: 0, drops: "fence", raidTarget: true, hp: 8 },
  [B.SPIKES]: { name: "とげ罠", solid: false, opaque: false, prop: true, hardness: 0.4, tier: 0, drops: "spikes" },
  [B.TORCH]: { name: "たいまつ", solid: false, opaque: false, prop: true, hardness: 0.15, tier: 0, drops: "torch" },
  [B.DOOR]: { name: "木の扉", solid: "monsters", opaque: false, prop: true, hardness: 0.5, tier: 0, drops: "door", raidTarget: true, hp: 12 },
  [B.WORKBENCH]: { name: "作業台", solid: true, opaque: false, prop: true, hardness: 0.6, tier: 0, drops: "workbench", interact: "craft" },
  [B.CHEST]: { name: "収納箱", solid: true, opaque: false, prop: true, hardness: 0.5, tier: 0, drops: "chest", interact: "storage" },
  [B.BED]: { name: "わらのベッド", solid: false, opaque: false, prop: true, hardness: 0.4, tier: 0, drops: "bed", interact: "sleep" },
  [B.CROP1]: { name: "山麦のなえ", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "barley_seed" },
  [B.CROP2]: { name: "育つ山麦", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "barley_seed" },
  [B.CROP3]: { name: "実った山麦", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: null, interact: "harvest" },
  [B.BANNER]: { name: "職業の旗", solid: false, opaque: false, prop: true, hardness: Infinity, tier: 9, interact: "banner" },
  [B.BUSH]: { name: "わら草", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "straw", bonusDrops: [["herb", 0.3]] },
  [B.MUD]: { name: "泥だまり", solid: true, opaque: true, tex: ["mud", "mud", "dirt"], hardness: 0.6, tier: 0, drops: "clay" },
  [B.KAMADO]: { name: "かまど", solid: true, opaque: false, prop: true, hardness: 0.8, tier: 0, drops: "kamado", interact: "cook" },
  [B.TABLE]: { name: "ちゃぶ台", solid: true, opaque: false, prop: true, hardness: 0.5, tier: 0, drops: "table" },
  [B.MUSHROOM]: { name: "きのこ", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "mushroom" },
  [B.FISH_SPOT]: { name: "魚のかげ", solid: false, opaque: false, prop: true, hardness: 0.12, tier: 0, drops: "fish" },
  [B.SAIL]: { name: "帆", solid: true, opaque: true, tex: ["sail", "sail", "sail"], hardness: 0.4, tier: 0, drops: "sail" },
  [B.SHIPWALL]: { name: "船の外板", solid: true, opaque: true, tex: ["shipwall", "shipwall", "shipwall"], hardness: 0.9, tier: 0, drops: "shipwall" },
  [B.HELM]: { name: "舵輪", solid: true, opaque: false, prop: true, hardness: 0.6, tier: 0, drops: "helm" },
  // --- 鍛冶 ---------------------------------------------------------------------
  [B.IRON_ORE]: { name: "鉄鉱脈", solid: true, opaque: true, tex: ["iron_ore", "iron_ore", "iron_ore"], hardness: 2.0, tier: 1, drops: "iron_ore" },
  [B.KILN]: { name: "炭焼き窯", solid: true, opaque: false, prop: true, hardness: 1.0, tier: 0, drops: "kiln", interact: "kiln" },
  [B.FORGE]: { name: "炉", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 0, drops: "forge", interact: "forge" },
  [B.ANVIL]: { name: "金床", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 0, drops: "anvil" },
  [B.TROUGH]: { name: "水桶", solid: true, opaque: false, prop: true, hardness: 0.5, tier: 0, drops: "trough" },
  // --- 第6章: 島と神殿 -----------------------------------------------------------
  [B.MOUNTAIN_ROCK]: { name: "山の岩", solid: true, opaque: true, tex: ["mountain_rock", "mountain_rock", "mountain_rock"], hardness: 1.6, tier: 1, drops: "stone" },
  [B.PATH]: { name: "踏み固めた道", solid: true, opaque: true, tex: ["path", "dirt", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.BOULDER]: { name: "大岩", solid: true, opaque: true, tex: ["boulder", "boulder", "boulder"], hardness: Infinity, tier: 9 },
  [B.ROCKFALL]: { name: "落石", solid: true, opaque: true, tex: ["boulder", "boulder", "boulder"], hardness: 1.4, tier: 1, drops: "stone" },
  [B.RUBBLE]: { name: "神殿の瓦礫", solid: true, opaque: true, tex: ["rubble", "rubble", "rubble"], hardness: 0.9, tier: 1, drops: "dharma_stone" },
  [B.DHARMA_STONE]: { name: "神殿の石", solid: true, opaque: true, tex: ["dharma_stone", "dharma_stone", "dharma_stone"], hardness: 1.5, tier: 1, drops: "dharma_stone", siegeHp: 30 },
  [B.DHARMA_PILLAR]: { name: "神殿の柱", solid: true, opaque: true, tex: ["pillar_top", "pillar_side", "pillar_top"], hardness: 1.5, tier: 1, drops: "dharma_pillar", siegeHp: 45 },
  [B.OLD_PILLAR]: { name: "古い柱", solid: true, opaque: true, tex: ["pillar_top", "old_pillar_side", "pillar_top"], hardness: Infinity, tier: 9 },
  [B.BROKEN_PILLAR]: { name: "折れた柱", solid: true, opaque: true, tex: ["rubble", "old_pillar_side", "pillar_top"], hardness: 1.2, tier: 1, drops: "dharma_stone" },
  [B.ROOF]: { name: "屋根板", solid: true, opaque: true, tex: ["roof_top", "roof_side", "plank"], hardness: 0.6, tier: 0, drops: "roof", siegeHp: 12, burnable: true },
  [B.EMBLEM]: { name: "書の紋章", solid: true, opaque: true, tex: ["roof_top", "emblem", "plank"], hardness: 0.8, tier: 0, drops: "emblem", burnable: true },
  [B.LANTERN]: { name: "提灯", solid: false, opaque: false, prop: true, hardness: 0.15, tier: 0, drops: "lantern" },
  [B.BOOKSHELF]: { name: "本棚", solid: true, opaque: true, tex: ["plank", "bookshelf", "plank"], hardness: 0.7, tier: 0, drops: "bookshelf" },
  [B.KEYSTONE]: { name: "要石", solid: true, opaque: true, tex: ["keystone_raw", "keystone", "keystone_raw"], hardness: 2.4, tier: 2, drops: "keystone" , noStand: true },
  [B.FLAME_BOWL]: { name: "授職の灯", solid: true, opaque: false, prop: true, hardness: 1.0, tier: 1, drops: "flame_bowl", interact: "altar" },
  [B.KEYSTONE_ROCK]: { name: "要石の岩盤", solid: true, opaque: true, tex: ["keystone_raw", "keystone_raw", "keystone_raw"], hardness: Infinity, tier: 9, interact: "keystone_rock" },
  [B.KEYSTONE_RAW]: { name: "切り出した要石", solid: true, opaque: true, tex: ["keystone_raw", "keystone_raw", "keystone_raw"], hardness: Infinity, tier: 9 },
  [B.WEDGE_MARK]: { name: "くさびの印", solid: false, opaque: false, prop: true, hardness: Infinity, tier: 9, interact: "wedge" },
  [B.WEDGE_SET]: { name: "打ったくさび", solid: false, opaque: false, prop: true, hardness: Infinity, tier: 9 },
  [B.SELECT_PILLAR0]: { name: "選択の柱", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 1, drops: "select_pillar", interact: "pillar" },
  [B.SELECT_PILLAR1]: { name: "選択の柱", solid: true, opaque: false, prop: true, hardness: Infinity, tier: 9, interact: "pillar" },
  [B.SELECT_PILLAR2]: { name: "選択の柱", solid: true, opaque: false, prop: true, hardness: Infinity, tier: 9, interact: "pillar" },
  [B.SELECT_PILLAR3]: { name: "選択の柱", solid: true, opaque: false, prop: true, hardness: Infinity, tier: 9, interact: "pillar" },
  [B.SELECT_PILLAR4]: { name: "選択の柱", solid: true, opaque: false, prop: true, hardness: Infinity, tier: 9, interact: "pillar" },
  // --- 第7章: 防衛 ---------------------------------------------------------------
  [B.PALISADE]: { name: "丸太の防壁", solid: true, opaque: true, tex: ["palisade_top", "palisade_side", "log_top"], hardness: 0.9, tier: 0, drops: "palisade", raidTarget: true, hp: 60 },
  [B.GATE]: { name: "門", solid: "monsters", opaque: false, prop: true, hardness: 0.8, tier: 0, drops: "gate", raidTarget: true, hp: 90 },
  [B.CROSSBOW_N]: { name: "ボウガン", solid: true, opaque: false, prop: true, hardness: 0.6, tier: 0, drops: "crossbow", interact: "crossbow" },
  [B.CROSSBOW_E]: { name: "ボウガン", solid: true, opaque: false, prop: true, hardness: 0.6, tier: 0, drops: "crossbow", interact: "crossbow" },
  [B.CROSSBOW_S]: { name: "ボウガン", solid: true, opaque: false, prop: true, hardness: 0.6, tier: 0, drops: "crossbow", interact: "crossbow" },
  [B.CROSSBOW_W]: { name: "ボウガン", solid: true, opaque: false, prop: true, hardness: 0.6, tier: 0, drops: "crossbow", interact: "crossbow" },
  [B.GREAT_BALLISTA]: { name: "大型対空ボウガン", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 1, drops: "great_ballista", interact: "ballista" },
};

export const isSolidFor = (id, kind) => {
  const def = BLOCK_DEFS[id];
  if (!def) return false;
  if (def.solid === "monsters") return kind === "monster";
  return !!def.solid;
};

export const isProp = (id) => !!BLOCK_DEFS[id]?.prop;
export const isCube = (id) => id !== B.AIR && !!BLOCK_DEFS[id] && !BLOCK_DEFS[id].prop;

// --- procedural texture atlas --------------------------------------------------

const TILE = 16;
const ATLAS_COLS = 8;
const tileIndex = new Map();

function paintNoise(ctx, ox, oy, base, spots, rand, count = 34) {
  ctx.fillStyle = base;
  ctx.fillRect(ox, oy, TILE, TILE);
  for (let i = 0; i < count; i += 1) {
    ctx.fillStyle = spots[Math.floor(rand() * spots.length)];
    ctx.fillRect(ox + Math.floor(rand() * TILE), oy + Math.floor(rand() * TILE), 1, 1);
  }
}

// 金の円に開いた本（職業の書の紋章）。破風の飾りと要石の面で共用する。
function paintBookEmblem(ctx, ox, oy, gold) {
  ctx.fillStyle = "#3e3226";
  ctx.fillRect(ox + 4, oy + 3, 8, 10);
  ctx.fillRect(ox + 3, oy + 4, 10, 8);
  ctx.fillStyle = gold;
  ctx.fillRect(ox + 5, oy + 4, 6, 8);
  ctx.fillRect(ox + 4, oy + 5, 8, 6);
  ctx.fillStyle = "#3e3226";
  ctx.fillRect(ox + 5, oy + 6, 6, 4);
  ctx.fillStyle = "#fff3c4";
  ctx.fillRect(ox + 5, oy + 6, 2, 3);
  ctx.fillRect(ox + 9, oy + 6, 2, 3);
  ctx.fillRect(ox + 7, oy + 7, 2, 2);
  ctx.fillStyle = "#3e3226";
  ctx.fillRect(ox + 8, oy + 6, 1, 4);
}

const TILE_PAINTERS = {
  grass_top(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#5fa53f", ["#6fb54c", "#549638", "#7cc158", "#4c8a33"], rand, 60);
  },
  grass_side(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#8a5f36", ["#7a5230", "#96693c", "#6f4a2a"], rand, 40);
    ctx.fillStyle = "#5fa53f";
    ctx.fillRect(ox, oy, TILE, 4);
    for (let x = 0; x < TILE; x += 1) {
      if (rand() < 0.5) ctx.fillRect(ox + x, oy + 4, 1, 1 + Math.floor(rand() * 2));
    }
  },
  dirt(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#8a5f36", ["#7a5230", "#96693c", "#6f4a2a", "#9c7145"], rand, 46);
  },
  stone(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#8b9196", ["#7c8287", "#9aa1a6", "#70767b"], rand, 40);
    ctx.fillStyle = "#70767b";
    ctx.fillRect(ox + 2, oy + 5, 5, 1);
    ctx.fillRect(ox + 9, oy + 11, 5, 1);
  },
  sand(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#e0cf8f", ["#d5c383", "#eadb9f", "#c9b878"], rand, 44);
  },
  water(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#3f7fd0", ["#4a8cdd", "#3a74c0", "#5b9be6"], rand, 30);
  },
  log_top(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#a97d47", ["#b98a51", "#99713f"], rand, 16);
    ctx.strokeStyle = "#7c5a30";
    for (let r = 2; r < 8; r += 2) {
      ctx.strokeRect(ox + 8 - r + 0.5, oy + 8 - r + 0.5, r * 2 - 1, r * 2 - 1);
    }
  },
  log_side(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#7c5730", ["#8a6238", "#6d4c29", "#966c3e"], rand, 30);
    ctx.fillStyle = "#654523";
    for (const x of [3, 8, 13]) ctx.fillRect(ox + x, oy, 1, TILE);
  },
  leaves(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#3e7d33", ["#4c9440", "#356b2b", "#5aa54c", "#2f6127"], rand, 70);
  },
  plank(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#c99c5f", ["#d3a869", "#bf9256", "#b8894c"], rand, 24);
    ctx.fillStyle = "#a67c42";
    ctx.fillRect(ox, oy + 5, TILE, 1);
    ctx.fillRect(ox, oy + 11, TILE, 1);
    ctx.fillRect(ox + 4, oy, 1, 5);
    ctx.fillRect(ox + 11, oy + 5, 1, 6);
    ctx.fillRect(ox + 7, oy + 11, 1, 5);
  },
  wall(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#efe7d6", ["#e6ddc8", "#f6efdf", "#ded4bc"], rand, 26);
    ctx.fillStyle = "#c9bfa6";
    ctx.fillRect(ox, oy + TILE - 2, TILE, 2);
    ctx.fillRect(ox, oy, TILE, 1);
  },
  thatch(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#c2a557", ["#b3964c", "#d1b465", "#a5893f"], rand, 30);
    ctx.fillStyle = "#96793a";
    for (let y = 2; y < TILE; y += 4) {
      for (let x = 0; x < TILE; x += 2) {
        if (rand() < 0.7) ctx.fillRect(ox + x, oy + y + Math.floor(rand() * 2), 1, 2);
      }
    }
  },
  farmland(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#6d4a28", ["#5f3f21", "#7b552f"], rand, 30);
    ctx.fillStyle = "#4f3319";
    for (let y = 1; y < TILE; y += 4) ctx.fillRect(ox, oy + y, TILE, 2);
  },
  mud(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#4f3a26", ["#453221", "#5c452e", "#3a2a1a", "#66503a"], rand, 50);
    ctx.fillStyle = "#6d5942";
    for (const [x, y] of [[3, 4], [10, 8], [6, 12], [12, 3]]) {
      if (rand() < 0.8) ctx.fillRect(ox + x, oy + y, 2, 1); // ぬめった照り
    }
  },
  shipwall(ctx, ox, oy, rand) {
    // タール塗りの船体外板。濃い板目＋継ぎ目＋銅鋲の照り。
    paintNoise(ctx, ox, oy, "#5a3f24", ["#4c3520", "#66482a", "#3f2d18"], rand, 32);
    ctx.fillStyle = "#332412";
    ctx.fillRect(ox, oy + 4, TILE, 1);
    ctx.fillRect(ox, oy + 10, TILE, 1);
    ctx.fillStyle = "#c97b3f"; // 銅鋲
    for (const [x, y] of [[2, 2], [13, 7], [6, 13], [11, 1]]) ctx.fillRect(ox + x, oy + y, 1, 1);
  },
  sail(ctx, ox, oy, rand) {
    // 白い帆布。縦の縫い目とわずかな影で布らしさを出す。
    paintNoise(ctx, ox, oy, "#f3efe4", ["#eae4d4", "#faf6ec", "#e2dcc9"], rand, 18);
    ctx.fillStyle = "#d8d0bd";
    for (const x of [4, 8, 12]) ctx.fillRect(ox + x, oy, 1, TILE);
    ctx.fillStyle = "#cfc6b0";
    ctx.fillRect(ox, oy + TILE - 1, TILE, 1);
  },
  // 炭焼き窯・炉の設置物が使う岩の模様（火山島編から引き継ぐ）。
  basalt(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#4a4a50", ["#3e3e44", "#56565c", "#333338"], rand, 40);
    ctx.fillStyle = "#333338";
    ctx.fillRect(ox + 1, oy + 6, 6, 1);
    ctx.fillRect(ox + 8, oy + 12, 6, 1);
    ctx.fillRect(ox + 10, oy + 2, 4, 1);
  },
  iron_ore(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#7d7668", ["#6f685b", "#8a8375"], rand, 30);
    ctx.fillStyle = "#b0632f";
    for (const [x, y] of [[3, 3], [10, 5], [5, 10], [12, 12], [8, 8]]) {
      ctx.fillRect(ox + x, oy + y, 2, 2);
      ctx.fillStyle = rand() < 0.5 ? "#d68b4a" : "#8f4f26";
    }
  },
  // --- ダーマの島 ---------------------------------------------------------------
  mountain_rock(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#7d7668", ["#6f685b", "#8a8375", "#625c50", "#958e7f"], rand, 46);
    ctx.fillStyle = "#5a5449";
    ctx.fillRect(ox + 2, oy + 4, 6, 1);
    ctx.fillRect(ox + 9, oy + 10, 5, 1);
    ctx.fillRect(ox + 4, oy + 13, 4, 1);
  },
  path(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#b39b72", ["#a68f68", "#bfa77d", "#9a845e", "#c9b38a"], rand, 54);
    ctx.fillStyle = "#8f7a55";
    for (const [x, y] of [[3, 5], [11, 3], [7, 11], [13, 13]]) ctx.fillRect(ox + x, oy + y, 2, 1);
  },
  boulder(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#6a665f", ["#5c5852", "#77736b", "#514d47"], rand, 40);
    ctx.fillStyle = "#45423d";
    ctx.fillRect(ox + 1, oy + 7, 8, 1);
    ctx.fillRect(ox + 8, oy + 7, 1, 5);
    ctx.fillRect(ox + 8, oy + 12, 7, 1);
    ctx.fillStyle = "#8d8980";
    ctx.fillRect(ox + 2, oy + 2, 4, 1);
    ctx.fillRect(ox + 10, oy + 9, 3, 1);
  },
  rubble(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#a69b8a", ["#93897a", "#b8ad9b", "#857b6d", "#d9d0be"], rand, 60);
    ctx.fillStyle = "#70675a";
    for (const [x, y, w] of [[1, 4, 5], [7, 2, 4], [10, 8, 5], [3, 10, 4], [6, 14, 6]]) ctx.fillRect(ox + x, oy + y, w, 1);
    ctx.fillStyle = "#3b342d";
    ctx.fillRect(ox + 12, oy + 3, 2, 2); // すすの跡
  },
  dharma_stone(ctx, ox, oy, rand) {
    // 段積みの切り石（ムービーの神殿の壁と同じ明るい石）。
    paintNoise(ctx, ox, oy, "#d9d0be", ["#cfc6b3", "#e4dccb", "#c6bca8"], rand, 26);
    ctx.fillStyle = "#a69b8a";
    ctx.fillRect(ox, oy + 7, TILE, 1);
    ctx.fillRect(ox, oy + 15, TILE, 1);
    ctx.fillRect(ox + 7, oy, 1, 7);
    ctx.fillRect(ox + 3, oy + 8, 1, 7);
    ctx.fillRect(ox + 12, oy + 8, 1, 7);
    ctx.fillStyle = "#f2ead9";
    ctx.fillRect(ox, oy, TILE, 1);
    ctx.fillRect(ox, oy + 8, TILE, 1);
  },
  pillar_top(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#e4dccb", ["#d9d0be", "#f2ead9"], rand, 20);
    ctx.strokeStyle = "#a69b8a";
    ctx.strokeRect(ox + 2.5, oy + 2.5, 11, 11);
  },
  pillar_side(ctx, ox, oy, rand) {
    // 縦の溝のある柱。
    paintNoise(ctx, ox, oy, "#e4dccb", ["#d9d0be", "#f2ead9"], rand, 18);
    ctx.fillStyle = "#b8ad9b";
    for (const x of [2, 6, 10, 14]) ctx.fillRect(ox + x, oy, 1, TILE);
    ctx.fillStyle = "#f6f0e2";
    for (const x of [4, 8, 12]) ctx.fillRect(ox + x, oy, 1, TILE);
  },
  old_pillar_side(ctx, ox, oy, rand) {
    // 崩れずに残った古い柱: 色がくすみ、すすの跡と苔が残る。
    paintNoise(ctx, ox, oy, "#c2b8a4", ["#b3a995", "#cdc4b1", "#a69b8a"], rand, 30);
    ctx.fillStyle = "#978d7b";
    for (const x of [2, 6, 10, 14]) ctx.fillRect(ox + x, oy, 1, TILE);
    ctx.fillStyle = "#5e554b";
    ctx.fillRect(ox + 8, oy + 3, 3, 6);
    ctx.fillRect(ox + 9, oy + 9, 2, 4);
    ctx.fillStyle = "#7f9a55";
    ctx.fillRect(ox + 1, oy + 13, 4, 2);
    ctx.fillRect(ox + 11, oy + 14, 3, 1);
  },
  roof_top(ctx, ox, oy, rand) {
    // 板葺き: 葺き板の段と継ぎ目。
    paintNoise(ctx, ox, oy, "#8a5a36", ["#7c4f2e", "#96663f", "#6f4628"], rand, 30);
    ctx.fillStyle = "#4e301a";
    for (const y of [3, 7, 11, 15]) ctx.fillRect(ox, oy + y, TILE, 1);
    for (const [x, y] of [[4, 0], [12, 0], [8, 4], [2, 8], [10, 8], [6, 12], [14, 12]]) ctx.fillRect(ox + x, oy + y, 1, 3);
    ctx.fillStyle = "#a8774a";
    for (const y of [0, 4, 8, 12]) ctx.fillRect(ox, oy + y, TILE, 1);
  },
  roof_side(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#7c4f2e", ["#6f4628", "#8a5a36"], rand, 26);
    ctx.fillStyle = "#4e301a";
    ctx.fillRect(ox, oy + 4, TILE, 1);
    ctx.fillRect(ox, oy + 10, TILE, 1);
    ctx.fillStyle = "#c99c5f"; // 垂木の木口
    for (const x of [1, 6, 11]) ctx.fillRect(ox + x, oy + 12, 3, 3);
  },
  emblem(ctx, ox, oy, rand) {
    // 破風の木の面に、職業の書の紋章。
    paintNoise(ctx, ox, oy, "#8a5a36", ["#7c4f2e", "#96663f"], rand, 20);
    paintBookEmblem(ctx, ox, oy, "#d9b545");
  },
  bookshelf(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#7c5730", ["#8a6238", "#6d4c29"], rand, 14);
    ctx.fillStyle = "#3e2a18";
    ctx.fillRect(ox + 1, oy + 1, 14, 6);
    ctx.fillRect(ox + 1, oy + 9, 14, 6);
    const spines = ["#a03024", "#2f5db0", "#3e7d33", "#d9b545", "#6a4a8a", "#c97b3f", "#e6ddc8"];
    for (const row of [2, 10]) {
      let x = 2;
      while (x < 14) {
        const w = rand() < 0.4 ? 2 : 1;
        ctx.fillStyle = spines[Math.floor(rand() * spines.length)];
        ctx.fillRect(ox + x, oy + row, Math.min(w, 14 - x), 5);
        x += w + (rand() < 0.2 ? 1 : 0);
      }
    }
  },
  keystone_raw(ctx, ox, oy, rand) {
    // 青みのある石（要石の岩盤・切り出した要石）。
    paintNoise(ctx, ox, oy, "#9fb0bf", ["#8fa0b0", "#afc0cd", "#7f90a2"], rand, 40);
    ctx.fillStyle = "#6f8092";
    ctx.fillRect(ox + 2, oy + 5, 7, 1);
    ctx.fillRect(ox + 8, oy + 11, 6, 1);
    ctx.fillStyle = "#c9d8e2";
    ctx.fillRect(ox + 10, oy + 3, 3, 1);
    ctx.fillRect(ox + 3, oy + 12, 3, 1);
  },
  keystone(ctx, ox, oy, rand) {
    // 祭壇の要石: 青みの石の面に、光る職業の書の紋章。
    paintNoise(ctx, ox, oy, "#9fb0bf", ["#8fa0b0", "#afc0cd", "#7f90a2"], rand, 30);
    paintBookEmblem(ctx, ox, oy, "#f0c860");
  },
  palisade_side(ctx, ox, oy, rand) {
    // 丸太を縦に並べて縄で締めた防壁。
    paintNoise(ctx, ox, oy, "#7c5730", ["#8a6238", "#6d4c29", "#966c3e"], rand, 30);
    ctx.fillStyle = "#4e3518";
    for (const x of [0, 5, 10, 15]) ctx.fillRect(ox + x, oy, 1, TILE);
    ctx.fillStyle = "#c2a557";
    ctx.fillRect(ox, oy + 4, TILE, 1);
    ctx.fillRect(ox, oy + 11, TILE, 1);
  },
  palisade_top(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#4e3518", ["#5a3f1e"], rand, 10);
    ctx.fillStyle = "#b98a51";
    for (const x of [1, 6, 11]) for (const y of [1, 6, 11]) ctx.fillRect(ox + x, oy + y, 4, 4);
    ctx.fillStyle = "#7c5a30";
    for (const x of [2, 7, 12]) for (const y of [2, 7, 12]) ctx.fillRect(ox + x, oy + y, 2, 2);
  },
};

let atlas = null;

export function getBlockAtlas() {
  if (atlas) return atlas;
  const names = Object.keys(TILE_PAINTERS);
  const rows = Math.ceil(names.length / ATLAS_COLS);
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLS * TILE;
  canvas.height = rows * TILE;
  const ctx = canvas.getContext("2d");
  const rand = mulberry32(1234);
  names.forEach((name, i) => {
    const ox = (i % ATLAS_COLS) * TILE;
    const oy = Math.floor(i / ATLAS_COLS) * TILE;
    TILE_PAINTERS[name](ctx, ox, oy, rand);
    tileIndex.set(name, i);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  atlas = { texture, canvas, cols: ATLAS_COLS, rows, tile: TILE };
  return atlas;
}

// UV rect (u0, v0, u1, v1) for a named tile, inset slightly to avoid bleeding.
export function tileUV(name) {
  const { cols, rows } = getBlockAtlas();
  const i = tileIndex.get(name) ?? 0;
  const eps = 0.02;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const u0 = (col + eps) / cols;
  const u1 = (col + 1 - eps) / cols;
  const v1 = 1 - (row + eps) / rows;
  const v0 = 1 - (row + 1 - eps) / rows;
  return [u0, v0, u1, v1];
}

// Draw one atlas tile into a 2D canvas (for item icons).
export function drawTileIcon(ctx, name, x, y, size) {
  const { canvas, cols, tile } = getBlockAtlas();
  const i = tileIndex.get(name) ?? 0;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, (i % cols) * tile, Math.floor(i / cols) * tile, tile, tile, x, y, size, size);
}
