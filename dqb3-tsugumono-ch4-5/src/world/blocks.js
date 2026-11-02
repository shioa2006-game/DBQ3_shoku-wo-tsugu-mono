import * as THREE from "three";
import { mulberry32 } from "../core/utils.js";

// Block ids. 0 is air. "prop" blocks live in the voxel grid for placement /
// save / blueprint logic but are rendered as individual meshes (see props.js)
// instead of being merged into the chunk geometry.
//
// 火山島編: 本島編の基本ブロックを引き継ぎ、火山・鉱山・鍛冶・竹林の
// ブロックを追加する。id は新ワールド（GEN_VERSION=1）なので自由に振り直せる。
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
  ALTAR: 22,
  TORII: 23,
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
  // --- 第4章: 火山島 -----------------------------------------------------------
  BLACK_SAND: 40, // 黒砂の浜
  BASALT: 41, // 玄武岩（火山の地肌）
  ASH: 42, // 火山灰土（鉱山町の地面）
  IRON_ORE: 43, // 鉄鉱脈
  LAVA: 44, // 赤熱した溶岩（壊せない・触れない景観）
  MINE_LAMP: 45, // 坑道灯（鬼火のかけらの灯り）
  KILN: 46, // 炭焼き窯
  FORGE: 47, // 炉
  ANVIL: 48, // 金床
  TROUGH: 49, // 水桶
  IRON_POT: 50, // 鉄鍋（かまど扱いの固有調理設備）
  // --- 第5章地域（第4章時点で地形生成だけ行う） ---------------------------------
  MOSS: 51, // 苔むした土（竹林側の地面）
  BAMBOO: 52, // 竹
  BLACK_BAMBOO: 53, // 峠を塞ぐ黒竹
  // --- 第5章: 瘴気と浄化 ---------------------------------------------------------
  TAINT_STONE: 54, // グロムが打ち込んだ穢れ石（ナギの浄化で取り除く）
  INCENSE_PLANT: 55, // 清めの香草（竹林の採取地点）
  BAMBOO_CHANNEL: 56, // 竹の導水路（泉の水を町へ運ぶ）
  PRAYER_PILLAR: 57, // 祈り柱（穢れ石の浄化で立て直す）
};

// tex: atlas tile ids for [top, side, bottom] (cube blocks only).
// hardness: seconds to break with the matching-tier hammer. tier: minimum
// hammer tier required (0 = wood, 1 = stone, 2 = iron). drops: item id or null.
export const BLOCK_DEFS = {
  [B.GRASS]: { name: "草地", solid: true, opaque: true, tex: ["grass_top", "grass_side", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.DIRT]: { name: "土", solid: true, opaque: true, tex: ["dirt", "dirt", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.STONE]: { name: "石", solid: true, opaque: true, tex: ["stone", "stone", "stone"], hardness: 1.4, tier: 0, drops: "stone" },
  [B.SAND]: { name: "すな", solid: true, opaque: true, tex: ["sand", "sand", "sand"], hardness: 0.45, tier: 0, drops: "sand" },
  [B.WATER]: { name: "水", solid: false, opaque: false, tex: ["water", "water", "water"], hardness: Infinity, tier: 9 },
  [B.LOG]: { name: "木材", solid: true, opaque: true, tex: ["log_top", "log_side", "log_top"], hardness: 0.9, tier: 0, drops: "log" },
  [B.LEAVES]: { name: "木の葉", solid: true, opaque: false, tex: ["leaves", "leaves", "leaves"], hardness: 0.25, tier: 0, drops: null, bonusDrops: [["straw", 0.35]] },
  [B.PLANK]: { name: "板材", solid: true, opaque: true, tex: ["plank", "plank", "plank"], hardness: 0.7, tier: 0, drops: "plank" },
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
  [B.CROP1]: { name: "穀物のなえ", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "volcano_grain_seed" },
  [B.CROP2]: { name: "育つ穀物", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "volcano_grain_seed" },
  [B.CROP3]: { name: "実った火山穀物", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: null, interact: "harvest" },
  [B.ALTAR]: { name: "職業の祭壇", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 0, drops: "altar", interact: "altar" },
  [B.TORII]: { name: "鳥居", solid: true, opaque: false, prop: true, hardness: 1.0, tier: 0, drops: "torii" },
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
  // --- 第4章: 火山島 -----------------------------------------------------------
  [B.BLACK_SAND]: { name: "黒砂", solid: true, opaque: true, tex: ["black_sand", "black_sand", "black_sand"], hardness: 0.45, tier: 0, drops: "black_sand" },
  [B.BASALT]: { name: "玄武岩", solid: true, opaque: true, tex: ["basalt", "basalt", "basalt"], hardness: 1.6, tier: 1, drops: "stone" },
  [B.ASH]: { name: "火山灰土", solid: true, opaque: true, tex: ["ash_top", "ash_side", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.IRON_ORE]: { name: "鉄鉱脈", solid: true, opaque: true, tex: ["iron_ore", "iron_ore", "iron_ore"], hardness: 2.0, tier: 1, drops: "iron_ore" },
  [B.LAVA]: { name: "溶岩", solid: true, opaque: true, tex: ["lava", "lava", "lava"], hardness: Infinity, tier: 9 },
  [B.MINE_LAMP]: { name: "坑道灯", solid: false, opaque: false, prop: true, hardness: 0.2, tier: 0, drops: "mine_lamp" },
  [B.KILN]: { name: "炭焼き窯", solid: true, opaque: false, prop: true, hardness: 1.0, tier: 0, drops: "kiln", interact: "kiln" },
  [B.FORGE]: { name: "炉", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 0, drops: "forge", interact: "forge" },
  [B.ANVIL]: { name: "金床", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 0, drops: "anvil" },
  [B.TROUGH]: { name: "水桶", solid: true, opaque: false, prop: true, hardness: 0.5, tier: 0, drops: "trough" },
  [B.IRON_POT]: { name: "鉄鍋", solid: true, opaque: false, prop: true, hardness: 0.9, tier: 0, drops: "iron_pot", interact: "cook" },
  // --- 第5章地域 ---------------------------------------------------------------
  [B.MOSS]: { name: "苔むした土", solid: true, opaque: true, tex: ["moss_top", "moss_side", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.BAMBOO]: { name: "竹", solid: true, opaque: true, tex: ["bamboo_top", "bamboo_side", "bamboo_top"], hardness: 0.7, tier: 0, drops: "bamboo" },
  [B.BLACK_BAMBOO]: { name: "黒竹", solid: true, opaque: true, tex: ["black_bamboo_top", "black_bamboo_side", "black_bamboo_top"], hardness: 1.6, tier: 2, drops: "bamboo" },
  // --- 第5章: 瘴気と浄化 ---------------------------------------------------------
  [B.TAINT_STONE]: { name: "穢れ石", solid: true, opaque: false, prop: true, hardness: Infinity, tier: 9, interact: "taint" },
  [B.INCENSE_PLANT]: { name: "清めの香草", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "incense_herb" },
  [B.BAMBOO_CHANNEL]: { name: "竹の導水路", solid: true, opaque: true, tex: ["channel_top", "bamboo_side", "bamboo_top"], hardness: 0.7, tier: 0, drops: "bamboo_channel" },
  [B.PRAYER_PILLAR]: { name: "祈り柱", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 0, drops: null },
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
  // --- 火山島 -------------------------------------------------------------------
  black_sand(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#3c3a3d", ["#46444a", "#333136", "#524e52", "#2b292d"], rand, 50);
  },
  basalt(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#4a4a50", ["#3e3e44", "#56565c", "#333338"], rand, 40);
    ctx.fillStyle = "#333338";
    ctx.fillRect(ox + 1, oy + 6, 6, 1);
    ctx.fillRect(ox + 8, oy + 12, 6, 1);
    ctx.fillRect(ox + 10, oy + 2, 4, 1);
  },
  ash_top(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#6d6660", ["#787069", "#5f5952", "#847b73", "#565049"], rand, 50);
  },
  ash_side(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#8a5f36", ["#7a5230", "#96693c", "#6f4a2a"], rand, 40);
    ctx.fillStyle = "#6d6660";
    ctx.fillRect(ox, oy, TILE, 4);
    for (let x = 0; x < TILE; x += 1) {
      if (rand() < 0.5) ctx.fillRect(ox + x, oy + 4, 1, 1 + Math.floor(rand() * 2));
    }
  },
  iron_ore(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#4a4a50", ["#3e3e44", "#56565c"], rand, 30);
    ctx.fillStyle = "#b0632f";
    for (const [x, y] of [[3, 3], [10, 5], [5, 10], [12, 12], [8, 8]]) {
      ctx.fillRect(ox + x, oy + y, 2, 2);
      ctx.fillStyle = rand() < 0.5 ? "#d68b4a" : "#8f4f26";
    }
  },
  lava(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#d8491f", ["#f26a24", "#b53414", "#ff9a3d", "#8f2810"], rand, 60);
    ctx.fillStyle = "#ffd24a";
    for (const [x, y] of [[4, 6], [11, 3], [7, 12], [13, 9]]) ctx.fillRect(ox + x, oy + y, 2, 1);
  },
  moss_top(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#4c7a45", ["#5a8a51", "#3f6a39", "#6a9a5e", "#37582f"], rand, 60);
  },
  moss_side(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#5c4a33", ["#4f3f2b", "#6a563c"], rand, 40);
    ctx.fillStyle = "#4c7a45";
    ctx.fillRect(ox, oy, TILE, 4);
    for (let x = 0; x < TILE; x += 1) {
      if (rand() < 0.5) ctx.fillRect(ox + x, oy + 4, 1, 1 + Math.floor(rand() * 2));
    }
  },
  bamboo_top(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#7fae4e", ["#8fbe5c", "#6f9e42"], rand, 16);
    ctx.strokeStyle = "#5a7d34";
    ctx.strokeRect(ox + 4.5, oy + 4.5, 7, 7);
  },
  bamboo_side(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#7fae4e", ["#8fbe5c", "#6f9e42", "#95c464"], rand, 24);
    ctx.fillStyle = "#5a7d34";
    ctx.fillRect(ox, oy + 4, TILE, 1);
    ctx.fillRect(ox, oy + 11, TILE, 1);
    for (const x of [4, 10]) ctx.fillRect(ox + x, oy, 1, TILE);
  },
  black_bamboo_top(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#3a4034", ["#444a3e", "#30362b"], rand, 16);
    ctx.strokeStyle = "#262b22";
    ctx.strokeRect(ox + 4.5, oy + 4.5, 7, 7);
  },
  black_bamboo_side(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#3a4034", ["#444a3e", "#30362b", "#4c5246"], rand, 24);
    ctx.fillStyle = "#262b22";
    ctx.fillRect(ox, oy + 4, TILE, 1);
    ctx.fillRect(ox, oy + 11, TILE, 1);
    for (const x of [4, 10]) ctx.fillRect(ox + x, oy, 1, TILE);
  },
  channel_top(ctx, ox, oy, rand) {
    // 竹の縁 + 中央を流れる水（導水路の天面）。
    paintNoise(ctx, ox, oy, "#7fae4e", ["#8fbe5c", "#6f9e42"], rand, 16);
    ctx.fillStyle = "#3f7fd0";
    ctx.fillRect(ox + 3, oy, TILE - 6, TILE);
    for (let y = 0; y < TILE; y += 1) {
      if (rand() < 0.4) {
        ctx.fillStyle = rand() < 0.5 ? "#5b9be6" : "#4a8cdd";
        ctx.fillRect(ox + 4 + Math.floor(rand() * (TILE - 8)), oy + y, 2, 1);
      }
    }
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
