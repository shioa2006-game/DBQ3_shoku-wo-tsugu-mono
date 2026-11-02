import { WORLD, PLACES } from "../world/world.js";
import { B } from "../world/blocks.js";

// 瘴気と浄化のシステム（第5章）。
//
// - 竹林側（峠より南〜源泉盆地の手前）は瘴気領域。中にいると一定間隔で
//   小ダメージを受け、画面に薄い紫の霞がかかる。
// - 薬草の煎じ湯（buff.taint）を飲んでいる間はダメージを受けない。
// - 外社と、浄化済みの穢れ石のまわりは安全地帯になる（清めた道を後ろに残す）。
// - 穢れ石は3か所。それぞれ「番の魔物を倒す → 祈り柱を立て直す → ナギが清める」
//   のサイクルで浄化する（進行は quests5.js、ここは状態と判定だけを持つ）。
// - 泉を清める（springPurified）と、竹林の瘴気はすべて消える。

const TAINT_Z0 = WORLD.PASS_Z1 + 1; // 瘴気領域の北端（峠の南）
const TAINT_Z1 = 93; // 南端（源泉盆地には持ち込まない）
const SAFE_RADIUS = 9; // 浄化済み地点・外社の安全半径
const DAMAGE_INTERVAL = 3.0; // 継続ダメージの間隔（秒）
const DAMAGE = 1;

export class PurificationSystem {
  constructor(game) {
    this.game = game;
    // 穢れ石ごとの状態: guardsDown（番の魔物を倒した）/ pillarBuilt（柱を立て直した）
    // / purified（ナギが清めた）。
    this.taintStones = PLACES.taintStones.map(() => ({
      guardsDown: false,
      pillarBuilt: false,
      purified: false,
    }));
    this.springPurified = false;
    this.damageTimer = 0;
  }

  purifiedCount() {
    return this.taintStones.filter((s) => s.purified).length;
  }

  allStonesPurified() {
    return this.taintStones.every((s) => s.purified);
  }

  // その座標に瘴気が満ちているか。
  isTainted(x, z) {
    if (this.springPurified) return false;
    if (z < TAINT_Z0 || z > TAINT_Z1) return false;
    // 外社のまわりは修復後に安全になる。
    if (this.game.blueprints.completed.has("outer_shrine")) {
      const o = PLACES.outerShrine;
      if (Math.hypot(x - (o.x + 2), z - (o.z + 1)) < SAFE_RADIUS) return false;
    }
    // 浄化済みの穢れ石のまわりも安全。
    for (let i = 0; i < this.taintStones.length; i += 1) {
      if (!this.taintStones[i].purified) continue;
      const s = PLACES.taintStones[i];
      if (Math.hypot(x - s.x, z - s.z) < SAFE_RADIUS) return false;
    }
    return true;
  }

  // プレイヤーが今、瘴気ダメージを受ける状態か（煎じ湯で防げる）。
  playerExposed() {
    const g = this.game;
    const p = g.player.pos;
    if (!this.isTainted(p.x, p.z)) return false;
    const buff = g.cooking.buff;
    if (buff.t > 0 && buff.taint) return false; // 薬草の煎じ湯が効いている
    return true;
  }

  update(dt) {
    const g = this.game;
    // 第5章の開通前（峠が閉じている間）は南側を更新しない。
    if (!g.passOpen && !this.springPurified) {
      g.ui.setTaint(false);
      return;
    }
    const exposed = this.playerExposed();
    const inTaint = this.isTainted(g.player.pos.x, g.player.pos.z);
    g.ui.setTaint(inTaint);
    if (!exposed) {
      this.damageTimer = 0;
      return;
    }
    this.damageTimer += dt;
    if (this.damageTimer >= DAMAGE_INTERVAL) {
      this.damageTimer = 0;
      g.player.hp = Math.max(1, g.player.hp - DAMAGE); // 瘴気では倒れない（HP1で止まる）
      g.throttledToast("taint", "🟣 瘴気が肌を刺す……（薬草の煎じ湯で防げる）");
    }
  }

  // ナギが穢れ石 i を清めた（quests5 から呼ばれる）。石を取り除き、祈り柱を立てる。
  purifyStone(i) {
    const s = PLACES.taintStones[i];
    const g = this.game;
    this.taintStones[i].purified = true;
    for (let y = 0; y < WORLD.H; y += 1) {
      if (g.world.get(s.x, y, s.z) === B.TAINT_STONE) g.world.set(s.x, y, s.z, B.AIR);
    }
    const gy = g.world.terrainSurfaceY(s.x, s.z);
    g.world.set(s.x, gy, s.z, B.PRAYER_PILLAR);
  }

  // 泉を清めた。竹林の瘴気がすべて消える。
  purifySpring() {
    this.springPurified = true;
    this.game.ui.setTaint(false);
  }

  serialize() {
    return {
      taintStones: this.taintStones.map((s) => ({ ...s })),
      springPurified: this.springPurified,
    };
  }

  load(data) {
    if (!data) return;
    for (let i = 0; i < this.taintStones.length; i += 1) {
      if (data.taintStones?.[i]) this.taintStones[i] = { ...this.taintStones[i], ...data.taintStones[i] };
    }
    this.springPurified = !!data.springPurified;
  }
}
