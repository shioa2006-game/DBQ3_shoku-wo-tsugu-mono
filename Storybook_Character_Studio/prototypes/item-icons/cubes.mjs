// 立方体ブロックのアイコン。斜め上から見た小さな立方体を描き、各面にブロックの模様を付ける。
// 色と模様はゲームの `src/world/blocks.js` の TILE_PAINTERS に合わせる。
// 面の明るさ: 上面1.0、左面0.84、右面0.66（光は左上から）。

const SHADE = { top: 1, left: 0.84, right: 0.66 };

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (hex, k) => toHex(rgb(hex).map((v) => v * k));

// 座標から決まる疑似乱数（0～1）。書き出すたびに同じ模様になる。
const hash = (x, y, seed) => {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const speckle = (base, spots, rate) => (f, x, y, seed) =>
  hash(x, y, seed) < rate ? spots[Math.floor(hash(y, x, seed + 7) * spots.length)] : base;

// 立方体の各画素について、どの面のどの位置か（a: 横 0～1、b: 縦 0～1）を求める。
function cubeFace(x, y) {
  const u = x + 0.5, v = y + 0.5;
  if (Math.abs(u - 8) / 7 + Math.abs(v - 4.5) / 3.5 <= 1) {
    const s = (u - 8) / 7, t = (v - 4.5) / 3.5;
    return { face: 'top', a: (s + t + 1) / 2, b: (t - s + 1) / 2 };
  }
  if (u >= 1 && u <= 8) {
    const top = 4.5 + (u - 1) * 0.5;
    if (v > top && v <= top + 7) return { face: 'left', a: (u - 1) / 7, b: (v - top) / 7 };
  }
  if (u >= 8 && u <= 15) {
    const top = 8 - (u - 8) * 0.5;
    if (v > top && v <= top + 7) return { face: 'right', a: (u - 8) / 7, b: (v - top) / 7 };
  }
  return null;
}

// paint(face, x, y, a, b) → 色（陰影前）。
export function cube(paint, seed = 1) {
  return (ic) => {
    for (let y = 1; y <= 14; y += 1) {
      for (let x = 1; x <= 14; x += 1) {
        const hit = cubeFace(x, y);
        if (!hit) continue;
        ic.px(x, y, shade(paint(hit.face, x, y, hit.a, hit.b, seed), SHADE[hit.face]));
      }
    }
  };
}

const dirt = speckle('#8a5f36', ['#7a5230', '#96693c', '#6f4a2a', '#9c7145'], 0.45);
const stone = speckle('#8b9196', ['#7c8287', '#9aa1a6', '#70767b'], 0.4);
const near = (v, at, w = 0.07) => Math.abs(v - at) < w;

export const CUBES = {
  dirt: cube((f, x, y, a, b, seed) => dirt(f, x, y, seed), 2),
  stone: cube((f, x, y, a, b, seed) => (near(b, 0.4) && a > 0.15 && a < 0.55) || (near(b, 0.75) && a > 0.5) ? '#70767b' : stone(f, x, y, seed), 3),
  sand: cube((f, x, y, a, b, seed) => speckle('#e0cf8f', ['#d5c383', '#eadb9f', '#c9b878'], 0.4)(f, x, y, seed), 4),
  log: cube((f, x, y, a, b, seed) => {
    if (f === 'top') {
      const r = Math.max(Math.abs(a - 0.5), Math.abs(b - 0.5));
      return near(r, 0.18, 0.06) || near(r, 0.36, 0.06) ? '#7c5a30' : '#a97d47';
    }
    return near(a, 0.3, 0.08) || near(a, 0.72, 0.08) ? '#654523' : speckle('#7c5730', ['#8a6238', '#6d4c29'], 0.3)(f, x, y, seed);
  }, 5),
  plank: cube((f, x, y, a, b, seed) => {
    const row = f === 'top' ? a : b;
    if (near(row, 0.34) || near(row, 0.7)) return '#a67c42';
    return speckle('#c99c5f', ['#d3a869', '#bf9256'], 0.25)(f, x, y, seed);
  }, 6),
  wall: cube((f, x, y, a, b, seed) => (f !== 'top' && (b > 0.86 || b < 0.1)) ? '#c9bfa6' : speckle('#efe7d6', ['#e6ddc8', '#f6efdf'], 0.25)(f, x, y, seed), 7),
  thatch: cube((f, x, y, a, b, seed) => {
    const row = f === 'top' ? a : b;
    return (near(row, 0.3, 0.06) || near(row, 0.65, 0.06)) && hash(x, y, seed) < 0.75 ? '#96793a' : speckle('#c2a557', ['#b3964c', '#d1b465'], 0.35)(f, x, y, seed);
  }, 8),
  farmland: cube((f, x, y, a, b, seed) => f === 'top' ? ((a * 3.5) % 1 < 0.38 ? '#4f3319' : '#7b552f') : dirt(f, x, y, seed), 9),
  waterway: cube((f, x, y, a, b, seed) => f === 'top' && b > 0.24 && b < 0.76 ? (hash(x, y, seed) < 0.3 ? '#5b9be6' : '#3f7fd0') : stone(f, x, y, seed), 10),
  sail: cube((f, x, y, a, b, seed) => near(a, 0.33, 0.06) || near(a, 0.66, 0.06) ? '#d8d0bd' : speckle('#f3efe4', ['#eae4d4', '#faf6ec'], 0.2)(f, x, y, seed), 11),
  shipwall: cube((f, x, y, a, b, seed) => {
    const row = f === 'top' ? a : b;
    if (near(row, 0.34) || near(row, 0.7)) return '#332412';
    if (hash(x, y, seed) < 0.06) return '#c97b3f';
    return speckle('#5a3f24', ['#4c3520', '#66482a'], 0.3)(f, x, y, seed);
  }, 12),
  // --- 第4～5章 ---
  black_sand: cube((f, x, y, a, b, seed) => speckle('#3c3a3d', ['#46444a', '#333136', '#524e52', '#2b292d'], 0.5)(f, x, y, seed), 13),
  bamboo: cube((f, x, y, a, b, seed) => bambooFace(f, x, y, a, b, seed), 14),
  bamboo_channel: cube((f, x, y, a, b, seed) => f === 'top' && b > 0.24 && b < 0.76
    ? (hash(x, y, seed) < 0.3 ? '#5b9be6' : '#3f7fd0')
    : bambooFace(f, x, y, a, b, seed), 15),
  // --- 第6～7章（ゲーム ch6-7 の blocks.js のタイルに合わせる） ---
  // 神殿の石: 明るい切り石を段に積む。横の面に目地。
  dharma_stone: cube((f, x, y, a, b, seed) => {
    const joint = f !== 'top' && (near(b, 0.48, 0.06) || (b < 0.48 ? near(a, 0.5) : near(a, 0.24) || near(a, 0.78)));
    return joint ? '#a69b8a' : speckle('#d9d0be', ['#cfc6b3', '#e4dccb', '#c6bca8'], 0.3)(f, x, y, seed);
  }, 16),
  // 神殿の柱: 縦の溝。上面は四角い縁。
  dharma_pillar: cube((f, x, y, a, b, seed) => {
    if (f === 'top') return Math.abs(Math.max(Math.abs(a - 0.5), Math.abs(b - 0.5)) - 0.33) < 0.07 ? '#a69b8a' : '#e4dccb';
    return near(a, 0.2) || near(a, 0.5) || near(a, 0.8) ? '#b8ad9b' : speckle('#e4dccb', ['#d9d0be', '#f2ead9'], 0.25)(f, x, y, seed);
  }, 17),
  // 屋根板: 上面は葺き板の段、横の面は垂木の木口。
  roof: cube((f, x, y, a, b, seed) => roofFace(f, x, y, a, b, seed), 18),
  // 書の紋章: 破風の木の面に、金の職業の書。
  emblem: cube((f, x, y, a, b, seed) => {
    if (f === 'top') return roofFace(f, x, y, a, b, seed);
    return bookMark(a, b) ? '#d9b545' : speckle('#8a5a36', ['#7c4f2e', '#96663f'], 0.25)(f, x, y, seed);
  }, 19),
  // 本棚: 木の枠に、色とりどりの背表紙が二段。
  bookshelf: cube((f, x, y, a, b, seed) => {
    if (f === 'top') return speckle('#c99c5f', ['#d3a869', '#bf9256'], 0.25)(f, x, y, seed);
    if (a < 0.14 || a > 0.86 || b < 0.1 || b > 0.9 || near(b, 0.5, 0.06)) return '#7c5730';
    const spines = ['#a03024', '#2f5db0', '#3e7d33', '#d9b545', '#6a4a8a', '#c97b3f', '#e6ddc8'];
    return spines[Math.floor(hash(x, b < 0.5 ? 1 : 2, seed) * spines.length)];
  }, 20),
  // 要石: 青みのある石に、光る職業の書の紋章。
  keystone: cube((f, x, y, a, b, seed) => {
    if (f !== 'top' && bookMark(a, b)) return '#f0c860';
    return speckle('#9fb0bf', ['#8fa0b0', '#afc0cd', '#7f90a2'], 0.35)(f, x, y, seed);
  }, 21),
  // 丸太の防壁: 縦に並べた丸太を縄で締める。上面は丸太の木口。
  palisade: cube((f, x, y, a, b, seed) => {
    if (f === 'top') return (a * 3) % 1 < 0.22 || (b * 3) % 1 < 0.22 ? '#4e3518' : '#b98a51';
    if (near(b, 0.28) || near(b, 0.74)) return '#c2a557';
    return near(a, 0.33, 0.06) || near(a, 0.67, 0.06) ? '#4e3518' : speckle('#7c5730', ['#8a6238', '#6d4c29', '#966c3e'], 0.3)(f, x, y, seed);
  }, 22),
};

// 屋根板の面（屋根板・書の紋章の上面で共用）。
function roofFace(f, x, y, a, b, seed) {
  if (f === 'top') return near(a, 0.3, 0.06) || near(a, 0.68, 0.06) ? '#4e301a' : speckle('#8a5a36', ['#7c4f2e', '#96663f', '#a8774a'], 0.3)(f, x, y, seed);
  if (near(b, 0.36, 0.06)) return '#4e301a';
  if (b > 0.62 && b < 0.92 && (near(a, 0.2, 0.1) || near(a, 0.55, 0.1) || near(a, 0.88, 0.1))) return '#c99c5f';
  return speckle('#7c4f2e', ['#6f4628', '#8a5a36'], 0.3)(f, x, y, seed);
}

// 横の面の中央に描く、開いた書の紋章（左右のページ。中央の綴じ目は地の色）。
const bookMark = (a, b) => Math.abs(a - 0.5) < 0.32 && Math.abs(b - 0.5) < 0.24 && !near(a, 0.5, 0.06);

// 竹: 横の面は節の線と縦の筋、上面は切り口の輪。
function bambooFace(f, x, y, a, b, seed) {
  if (f === 'top') return Math.abs(Math.max(Math.abs(a - 0.5), Math.abs(b - 0.5)) - 0.3) < 0.07 ? '#5a7d34' : '#8fbe5c';
  if (near(b, 0.28) || near(b, 0.72) || near(a, 0.28, 0.06) || near(a, 0.7, 0.06)) return '#5a7d34';
  return speckle('#7fae4e', ['#8fbe5c', '#6f9e42', '#95c464'], 0.3)(f, x, y, seed);
}
