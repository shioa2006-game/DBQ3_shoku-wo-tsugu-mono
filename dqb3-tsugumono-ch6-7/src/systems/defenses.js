import * as THREE from "three";
import { cellKey } from "../core/utils.js";
import { B, CROSSBOW_DIRS } from "../world/blocks.js";
import { SFX } from "../game/sfx.js";

// 第7章の防衛の持ち物: 祭壇の灯の守り（耐久）、ボウガンと共用の矢倉、とげ罠の傷み。
// docs/DESIGN.md の「8. 第7章の防衛」。セーブの `dharma` に入る。

export const ALTAR_MAX_HP = 200;
const CROSSBOW_RANGE = 7.5;
const CROSSBOW_RANGE_DRAGON = 12;
const CROSSBOW_INTERVAL = 1.7;
const CROSSBOW_DAMAGE = 3;
const CROSSBOW_CONE = Math.cos((50 * Math.PI) / 180); // 前方およそ90度
const SPIKE_USES = 12;

export class DharmaDefense {
  constructor(game) {
    this.game = game;
    this.altarMax = ALTAR_MAX_HP;
    this.altarHp = ALTAR_MAX_HP;
    this.bolts = 0; // 矢倉の矢（すべてのボウガンで共用）
    this.crossbows = new Map(); // cellKey -> { x, y, z, dir: [dx, dz], cd }
    this.spikeUses = new Map(); // cellKey -> 作動した回数
    this.tracers = [];
    this.tracerMaterial = new THREE.MeshBasicMaterial({ color: 0xf2e6c0 });
    this.tracerGeometry = new THREE.BoxGeometry(0.05, 0.05, 1);
  }

  // --- 祭壇の灯 ---------------------------------------------------------------------

  resetAltar() {
    this.altarHp = this.altarMax;
  }

  repairAltar(amount) {
    this.altarHp = Math.min(this.altarMax, this.altarHp + amount);
  }

  // --- ボウガンの索引（ワールドの変更に追従） -------------------------------------------

  clearIndex() {
    this.crossbows.clear();
  }

  indexCell(key, id, x, y, z) {
    if (CROSSBOW_DIRS[id]) this.crossbows.set(key, { x, y, z, dir: CROSSBOW_DIRS[id], cd: Math.random() });
  }

  onWorldChange(x, y, z, id, prev) {
    const key = cellKey(x, y, z);
    if (CROSSBOW_DIRS[id]) this.indexCell(key, id, x, y, z);
    else if (CROSSBOW_DIRS[prev]) this.crossbows.delete(key);
    if (prev === B.SPIKES && id !== B.SPIKES) this.spikeUses.delete(key);
  }

  // ボウガンを調べた: 持っている矢をすべて矢倉へ入れる。
  loadBolts() {
    const g = this.game;
    const n = g.inventory.count("bolt");
    if (n > 0) {
      g.inventory.remove("bolt", n);
      this.bolts += n;
      SFX.place();
      g.ui.toast(`🏹 矢を ${n}本 矢倉へ入れた（矢倉 ${this.bolts}本）`);
    } else {
      g.ui.toast(`🏹 矢倉の矢 ${this.bolts}本…ボウガンの矢は 作業台で作れる`);
    }
  }

  // とげ罠が作動した。決まった回数で壊れる。
  onSpike(x, y, z) {
    const key = cellKey(x, y, z);
    const n = (this.spikeUses.get(key) ?? 0) + 1;
    if (n >= SPIKE_USES) {
      this.spikeUses.delete(key);
      this.game.world.set(x, y, z, B.AIR);
      SFX.breakBlock();
      this.game.throttledToast("spike", "📌 とげ罠が 壊れた");
    } else {
      this.spikeUses.set(key, n);
    }
  }

  // --- ボウガンの自動射撃 --------------------------------------------------------------

  update(dt) {
    const g = this.game;
    this.updateTracers(dt);
    if (!this.crossbows.size) return;
    // 狙うのは、攻めてきた軍勢と竜の頭だけ（山道の通常の敵には矢を使わない）。
    const targets = g.monsters.monsters.filter((m) => !m.dead && !m.untargetable && !m.dormant && (m.raid || m.isDragonHead));
    for (const bow of this.crossbows.values()) {
      bow.cd -= dt;
      if (bow.cd > 0) continue;
      if (this.bolts <= 0 || !targets.length) {
        bow.cd = 0.4;
        continue;
      }
      const ox = bow.x + 0.5, oy = bow.y + 0.6, oz = bow.z + 0.5;
      let best = null;
      let bestD = Infinity;
      for (const m of targets) {
        const dx = m.pos.x - ox;
        const dz = m.pos.z - oz;
        const d = Math.hypot(dx, dz);
        const range = m.isDragonHead ? CROSSBOW_RANGE_DRAGON : CROSSBOW_RANGE;
        if (d > range || d < 0.6 || Math.abs(m.pos.y - bow.y) > (m.isDragonHead ? 8 : 4)) continue;
        if ((dx * bow.dir[0] + dz * bow.dir[1]) / d < CROSSBOW_CONE) continue;
        if (d < bestD) {
          bestD = d;
          best = m;
        }
      }
      if (!best) {
        bow.cd = 0.3;
        continue;
      }
      bow.cd = CROSSBOW_INTERVAL;
      this.bolts -= 1;
      const from = new THREE.Vector3(ox, oy, oz);
      g.hurtMonster(best, CROSSBOW_DAMAGE, null, {});
      this.addTracer(from, best.pos.clone().add(new THREE.Vector3(0, 0.5, 0)));
      SFX.swing();
      if (this.bolts === 0) g.throttledToast("bolts", "🏹 矢倉の矢が 尽きた！");
    }
  }

  // 矢の軌跡（短い時間だけ見せる線）。
  addTracer(from, to) {
    const mesh = new THREE.Mesh(this.tracerGeometry, this.tracerMaterial);
    const len = from.distanceTo(to);
    mesh.position.copy(from).lerp(to, 0.5);
    mesh.scale.set(1, 1, Math.max(0.2, len));
    mesh.lookAt(to);
    this.game.scene.add(mesh);
    this.tracers.push({ mesh, t: 0.14 });
  }

  updateTracers(dt) {
    for (const tr of [...this.tracers]) {
      tr.t -= dt;
      if (tr.t <= 0) {
        this.game.scene.remove(tr.mesh);
        this.tracers.splice(this.tracers.indexOf(tr), 1);
      }
    }
  }

  // --- save / load -------------------------------------------------------------------

  serialize() {
    return { altarHp: this.altarHp, bolts: this.bolts, spikes: [...this.spikeUses] };
  }

  load(data) {
    this.altarHp = Math.min(this.altarMax, data?.altarHp ?? this.altarMax);
    this.bolts = data?.bolts ?? 0;
    this.spikeUses = new Map(data?.spikes ?? []);
  }
}
