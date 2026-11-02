import * as THREE from "three";
import { mulberry32 } from "../core/utils.js";

// Block ids. 0 is air. "prop" blocks live in the voxel grid for placement /
// save / blueprint logic but are rendered as individual meshes (see props.js)
// instead of being merged into the chunk geometry.
export const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  LOG: 6,
  LEAVES: 7,
  ORE: 8,
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
  SCARECROW: 24,
  BANNER: 25,
  BUSH: 26,
  CHEST: 27,
  MUD: 28,
  WATERWAY: 29,
  KAMADO: 30,
  TABLE: 31,
  MUSHROOM: 32,
  FISH_SPOT: 33,
  SAIL: 34,
  SHIPWALL: 35,
  HELM: 36,
};

// tex: atlas tile ids for [top, side, bottom] (cube blocks only).
// hardness: seconds to break with the matching-tier hammer. tier: minimum
// hammer tier required (0 = wood, 1 = stone). drops: item id (string) or null.
export const BLOCK_DEFS = {
  [B.GRASS]: { name: "草原", solid: true, opaque: true, tex: ["grass_top", "grass_side", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.DIRT]: { name: "土", solid: true, opaque: true, tex: ["dirt", "dirt", "dirt"], hardness: 0.5, tier: 0, drops: "dirt" },
  [B.STONE]: { name: "石", solid: true, opaque: true, tex: ["stone", "stone", "stone"], hardness: 1.4, tier: 0, drops: "stone" },
  [B.SAND]: { name: "すな", solid: true, opaque: true, tex: ["sand", "sand", "sand"], hardness: 0.45, tier: 0, drops: "sand" },
  [B.WATER]: { name: "水", solid: false, opaque: false, tex: ["water", "water", "water"], hardness: Infinity, tier: 9 },
  [B.LOG]: { name: "木材", solid: true, opaque: true, tex: ["log_top", "log_side", "log_top"], hardness: 0.9, tier: 0, drops: "log" },
  [B.LEAVES]: { name: "木の葉", solid: true, opaque: false, tex: ["leaves", "leaves", "leaves"], hardness: 0.25, tier: 0, drops: null, bonusDrops: [["straw", 0.35]] },
  [B.ORE]: { name: "銅こうせき", solid: true, opaque: true, tex: ["ore", "ore", "ore"], hardness: 1.8, tier: 1, drops: "copper" },
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
  [B.CROP1]: { name: "稲のなえ", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "seed" },
  [B.CROP2]: { name: "育つ稲", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "seed" },
  [B.CROP3]: { name: "実った稲", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: null, interact: "harvest" },
  [B.ALTAR]: { name: "職業の祭壇", solid: true, opaque: false, prop: true, hardness: 1.2, tier: 0, drops: "altar", interact: "altar" },
  [B.TORII]: { name: "鳥居", solid: true, opaque: false, prop: true, hardness: 1.0, tier: 0, drops: "torii" },
  [B.SCARECROW]: { name: "かかし", solid: false, opaque: false, prop: true, hardness: 0.4, tier: 0, drops: "scarecrow" },
  [B.BANNER]: { name: "職業の旗", solid: false, opaque: false, prop: true, hardness: Infinity, tier: 9, interact: "banner" },
  [B.BUSH]: { name: "わら草", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "straw", bonusDrops: [["herb", 0.3]] },
  [B.MUD]: { name: "泥だまり", solid: true, opaque: true, tex: ["mud", "mud", "dirt"], hardness: 0.6, tier: 0, drops: "clay" },
  [B.WATERWAY]: { name: "用水路", solid: true, opaque: true, tex: ["waterway_top", "stone", "stone"], hardness: 0.9, tier: 0, drops: "waterway" },
  [B.KAMADO]: { name: "かまど", solid: true, opaque: false, prop: true, hardness: 0.8, tier: 0, drops: "kamado", interact: "cook" },
  [B.TABLE]: { name: "ちゃぶ台", solid: true, opaque: false, prop: true, hardness: 0.5, tier: 0, drops: "table" },
  [B.MUSHROOM]: { name: "きのこ", solid: false, opaque: false, prop: true, hardness: 0.1, tier: 0, drops: "mushroom" },
  [B.FISH_SPOT]: { name: "魚のかげ", solid: false, opaque: false, prop: true, hardness: 0.12, tier: 0, drops: "fish" },
  [B.SAIL]: { name: "帆", solid: true, opaque: true, tex: ["sail", "sail", "sail"], hardness: 0.4, tier: 0, drops: "sail" },
  [B.SHIPWALL]: { name: "船の外板", solid: true, opaque: true, tex: ["shipwall", "shipwall", "shipwall"], hardness: 0.9, tier: 0, drops: "shipwall" },
  [B.HELM]: { name: "舵輪", solid: true, opaque: false, prop: true, hardness: 0.6, tier: 0, drops: "helm" },
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
  ore(ctx, ox, oy, rand) {
    paintNoise(ctx, ox, oy, "#8b9196", ["#7c8287", "#9aa1a6"], rand, 30);
    ctx.fillStyle = "#c77b3d";
    for (const [x, y] of [[3, 3], [10, 5], [5, 10], [12, 12], [8, 8]]) {
      ctx.fillRect(ox + x, oy + y, 2, 2);
      ctx.fillStyle = rand() < 0.5 ? "#de9455" : "#c77b3d";
    }
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
  waterway_top(ctx, ox, oy, rand) {
    // 石の縁 + 中央を流れる水。
    paintNoise(ctx, ox, oy, "#8b9196", ["#7c8287", "#9aa1a6"], rand, 20);
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
