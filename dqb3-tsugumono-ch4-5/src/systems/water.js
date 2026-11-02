import { B } from "../world/blocks.js";
import { WORLD } from "../world/world.js";

// 海面フラッドフィル。ルールは1つ:
//   「海面(WATER_LEVEL)以下の空気セルは、水に接していれば水になる」
// これを BFS で連鎖させることで、
//   - 水際/海底を掘った穴に水が満ちる（乾いた隙間ができない）
//   - 橋の下など掘った空間が本物の水中になる
//   - 海へ水路を掘れば水が流れ込む
// を実現する。連鎖は海面以下に厳密に閉じるので、地上が水没する事故は起きない。
//
// 水は既存どおり solid:false・硬度∞・照準の素通し（＝通過でき壊せない）なので、
// 描画・当たり判定・照準は一切変えず、「自動で水になる」1点だけを足す。

const NEIGH = [
  [1, 0, 0], [-1, 0, 0],
  [0, 1, 0], [0, -1, 0],
  [0, 0, 1], [0, 0, -1],
];

export class WaterSystem {
  constructor(game) {
    this.game = game;
    this.pending = new Set(); // 給水判定待ちの flat index（world.idx）
  }

  // world 変更の通知（main.onWorldChange から）。実際の set は update() で行い、
  // set→listener→ここ、の同期再帰を避ける（ここでは候補を積むだけ）。
  onWorldChange(x, y, z, id, prev) {
    if (id === B.AIR && prev !== B.AIR && y <= WORLD.WATER_LEVEL) {
      // 排水: 海面以下のセルが空いた → 満たせるか後で判定。
      this.enqueue(x, y, z);
    }
    if (id === B.WATER && prev !== B.WATER) {
      // 伝播: 新たに水になったセルの隣（海面以下の空気）を候補に。
      for (const [dx, dy, dz] of NEIGH) this.enqueue(x + dx, y + dy, z + dz);
    }
  }

  enqueue(x, y, z) {
    const w = this.game.world;
    if (y > WORLD.WATER_LEVEL || !w.inBounds(x, y, z)) return;
    if (w.get(x, y, z) !== B.AIR) return;
    this.pending.add(w.idx(x, y, z));
  }

  hasWaterNeighbor(x, y, z) {
    const w = this.game.world;
    for (const [dx, dy, dz] of NEIGH) {
      if (w.get(x + dx, y + dy, z + dz) === B.WATER) return true;
    }
    return false;
  }

  decode(i) {
    const y = i % WORLD.H;
    const t = (i - y) / WORLD.H;
    const x = t % WORLD.W;
    const z = (t - x) / WORLD.W;
    return [x, y, z];
  }

  // 1フレームあたり maxOps セルまで給水（じわっと流れ込む見た目になる）。
  // set が新たな候補を積むので、次フレーム以降に連鎖が続く。
  update(maxOps = 96) {
    const w = this.game.world;
    let ops = 0;
    while (this.pending.size > 0 && ops < maxOps) {
      const i = this.pending.values().next().value;
      this.pending.delete(i);
      const [x, y, z] = this.decode(i);
      if (y > WORLD.WATER_LEVEL || w.get(x, y, z) !== B.AIR) continue;
      if (this.hasWaterNeighbor(x, y, z)) w.set(x, y, z, B.WATER);
      ops += 1;
    }
  }

  // 海面以下の乾いた穴を一括で満たす（ロード時の補修・完了まで回す）。
  // 各セルは高々1度しか水にならないので必ず収束する。
  floodAll() {
    const w = this.game.world;
    for (let z = 0; z < WORLD.D; z += 1) {
      for (let x = 0; x < WORLD.W; x += 1) {
        for (let y = 0; y <= WORLD.WATER_LEVEL; y += 1) {
          if (w.get(x, y, z) === B.AIR && this.hasWaterNeighbor(x, y, z)) {
            this.pending.add(w.idx(x, y, z));
          }
        }
      }
    }
    this.update(Number.POSITIVE_INFINITY);
  }
}
