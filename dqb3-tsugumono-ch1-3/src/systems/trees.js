import { B } from "../world/blocks.js";
import { WORLD } from "../world/world.js";

// 木の再生システム。木を伐ると根元に「切り株」を記録し、数日かけて元の木へ育て直す。
// 成長モデルは farming.js の作物成長と同型（進行度 0..1 を tick で進める）。
//
// 設計上の要点:
// - モデルは「伐った跡地を埋め戻す」だけ。新規地点には生えないので森は元の本数を
//   超えて増殖しない（＝上限は自動的に元の森サイズ）。
// - 満了時に根元が自然の草地(GRASS)で、幹の伸びる列が空いているときだけ育つ。
//   プレイヤーが跡地に建てた/耕したマスは塞がっているので育たない（＝建てた場所に
//   木は戻らない）。占有チェックだけで判定し、拠点まわりの恒久禁止ゾーンは設けない。
// - 保留中の再生はワールドから復元できない純セーブ状態なので、rescanWorld では触らず
//   save.js で serialize/load する。

const REGROW_RATE = 1 / 750; // 満了まで約750秒 = ゲーム内2.5日（1日=300秒）
const TRUNK_CLEARANCE = 5; // 幹(最大4段)＋余裕。この列が「空き」なら育てる

// 幹が突き抜けても構わないセル（空気か、自分/隣の木の葉）。プレイヤーが置いた
// 固体ブロックはここに含めない＝構造物を上書きして再生することはない。
function passable(id) {
  return id === B.AIR || id === B.LEAVES;
}

export class TreeSystem {
  constructor(game) {
    this.game = game;
    this.regrow = new Map(); // 切り株の根元セル "x,y,z" -> 進行度 0..1
  }

  clearIndex() {
    this.regrow.clear();
  }

  // 伐採時に main.breakBlock から呼ぶ。LOG の真下が自然の草(GRASS)なら幹の根元＝
  // 切り株とみなし、その位置に再生を予約する（北の島の草地のみ・重複は無視）。
  onLogBroken(x, y, z) {
    if (z >= WORLD.NORTH_D) return; // 南の島(第2章)は対象外
    if (this.game.world.get(x, y - 1, z) !== B.GRASS) return; // 幹の根元だけ拾う
    const key = `${x},${y},${z}`;
    if (!this.regrow.has(key)) this.regrow.set(key, 0);
  }

  // 満了時の発火条件: 自然の草地に立ち、幹の列が空いている（建物で塞がっていない）。
  canGrow(x, y, z) {
    if (this.game.world.get(x, y - 1, z) !== B.GRASS) return false;
    for (let i = 0; i < TRUNK_CLEARANCE; i += 1) {
      if (!passable(this.game.world.get(x, y + i, z))) return false;
    }
    return true;
  }

  update(dt) {
    if (this.regrow.size === 0) return;
    for (const [key, t] of this.regrow) {
      const nt = t + dt * REGROW_RATE;
      if (nt < 1) {
        this.regrow.set(key, nt);
        continue;
      }
      // 満了。空いていれば育て、塞がっていればキャンセル（どちらも予約は消す）。
      const [x, y, z] = key.split(",").map(Number);
      if (this.canGrow(x, y, z)) {
        // 実行時なので silent=false（チャンク再メッシュ＆インデックス更新を通知）。
        this.game.world.plantTree(x, y, z, Math.random, false);
      }
      this.regrow.delete(key);
    }
  }

  serialize() {
    return [...this.regrow].map(([key, t]) => {
      const [x, y, z] = key.split(",").map(Number);
      return [x, y, z, Number(t.toFixed(3))];
    });
  }

  load(list) {
    this.regrow.clear();
    for (const entry of list ?? []) {
      const [x, y, z, t] = entry;
      this.regrow.set(`${x},${y},${z}`, t);
    }
  }
}
