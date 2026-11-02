import * as THREE from "three";
import { DragonRig } from "../entities/dragon.js";
import { SFX } from "./sfx.js";

// ドラゴン討伐戦の進行（第5章グロム戦）。
// 左右の頭は独立した耐久を持つヒットボックスとして MonsterManager に登録し、
// プレイヤーの攻撃判定・住民AIの標的選択を既存の仕組みのまま流用する。
// フェーズ移行・増援・安全地帯は設けない（実装ガイド 10.3）。

// 頭のヒットボックス。Monster と同じ顔（pos/def/takeDamage/onHit/update）を持つ。
class DragonHead {
  constructor(battle, index, name, hp) {
    this.battle = battle;
    this.index = index;
    this.kind = "monster";
    this.def = { name, boss: true, drops: [] };
    this.pos = new THREE.Vector3();
    this.halfW = 0.9;
    this.height = 1.6;
    this.hp = hp;
    this.maxHp = hp;
    this.invuln = 0;
    this.receivedAttacks = new WeakSet();
    this.dead = false;
    this.deathT = 0;
    this.raid = true; // 周囲徘徊の対象外・防衛系の標的選択に乗せる
    this.isDragonHead = true;
  }

  takeDamage(dmg, fromPos, knockback, attack = null) {
    if (this.dead || (attack ? this.receivedAttacks.has(attack) : this.invuln > 0)) return false;
    if (attack) this.receivedAttacks.add(attack);
    this.hp -= dmg;
    this.invuln = 0.45;
    return true;
  }

  // Heads are hitboxes only; DragonRig owns their visuals. Pausing must not
  // advance the battle, but Game still calls the monster visual interface.
  syncVisual() {}

  onHit() {
    this.battle.flashT[this.index] = 0.15;
  }

  update(dt) {
    if (this.dead) {
      this.deathT += dt; // MonsterManager が 0.4 秒後にリストから外す
      return;
    }
    this.invuln = Math.max(0, this.invuln - dt);
  }
}

export class DragonBattle {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.rig = null;
    this.heads = [];
    this.onEnd = null;
  }

  start(config, spawnPos) {
    const g = this.game;
    this.cfg = config;
    this.active = true;
    this.rig = new DragonRig(config);
    g.scene.add(this.rig.group);
    this.pos = new THREE.Vector3(spawnPos.x, 0, spawnPos.z);
    this.pos.y = g.world.terrainSurfaceY(this.pos.x, this.pos.z);
    this.heads = config.heads.map((_, i) => {
      const head = new DragonHead(this, i, `${config.name}（${i === 0 ? "左" : "右"}の頭）`, config.battle.headHp);
      g.monsters.monsters.push(head);
      return head;
    });
    this.flashT = this.heads.map(() => 0);
    this.headDown = this.heads.map(() => false);
    this.flame = { head: 0, timer: config.battle.flame.interval * 0.6, phase: null, phaseT: 0 };
    this.biteCd = this.heads.map(() => 1.5);
    this.lungeT = this.heads.map(() => 0);
    SFX.raidHorn();
  }

  totalHp() {
    return this.heads.reduce((sum, h) => sum + Math.max(0, h.hp), 0);
  }

  totalMaxHp() {
    return this.heads.length * this.cfg.battle.headHp;
  }

  aliveHeads() {
    return this.heads.map((h, i) => i).filter((i) => !this.heads[i].dead);
  }

  update(dt) {
    if (!this.active) return;
    const g = this.game;
    const b = this.cfg.battle;
    const player = g.player;

    // プレイヤーへ向き直り、離れていればゆっくり詰める（源泉盆地から出ない）。
    const dx = player.pos.x - this.pos.x;
    const dz = player.pos.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.1) this.rig.facing.set(dx, dz);
    let walking = false;
    if (d > 4.2 && d < 26) {
      this.pos.x += (dx / d) * b.walkSpeed * dt;
      this.pos.z += (dz / d) * b.walkSpeed * dt;
      walking = true;
    }
    this.pos.x = Math.max(26, Math.min(38, this.pos.x));
    this.pos.z = Math.max(93, Math.min(106, this.pos.z));
    // 飛行型（config.hover）は地面からその高さを浮いて漂う。
    this.pos.y = g.world.terrainSurfaceY(this.pos.x, this.pos.z) + (this.cfg.hover ?? 0);

    // 頭のヒットボックス位置（首の先の頭そのもの。プレイヤーの攻撃は
    // ドラゴンの頭に限り届く高さを緩めてある — main.primaryAction 参照）。
    for (let i = 0; i < this.heads.length; i += 1) {
      const wp = this.rig.headWorldPos(i, this.pos);
      this.heads[i].pos.copy(wp);
    }

    // 被弾フラッシュ。
    for (let i = 0; i < this.heads.length; i += 1) {
      this.flashT[i] = Math.max(0, this.flashT[i] - dt);
      if (!this.heads[i].dead) {
        this.rig.heads[i].sprite.material.color.setHex(this.flashT[i] > 0 ? 0xff5050 : (this.cfg.tint ?? 0xffffff));
      }
    }

    // 火炎: 生きている頭が交互に、予兆 → 前方への吐射。
    const alive = this.aliveHeads();
    if (alive.length > 0) {
      if (this.flame.phase === null) {
        this.flame.timer -= dt;
        if (this.flame.timer <= 0) {
          if (!alive.includes(this.flame.head)) this.flame.head = alive[0];
          this.flame.phase = "telegraph";
          this.flame.phaseT = b.flame.telegraph;
          this.rig.setFlame(this.flame.head, "telegraph");
          SFX.raidHorn();
        }
      } else {
        this.flame.phaseT -= dt;
        if (this.flame.phase === "fire") {
          this.applyFlameDamage(this.flame.head);
        }
        if (this.flame.phaseT <= 0) {
          if (this.flame.phase === "telegraph" && !this.heads[this.flame.head].dead) {
            this.flame.phase = "fire";
            this.flame.phaseT = b.flame.duration;
            this.rig.setFlame(this.flame.head, "fire");
          } else {
            this.rig.setFlame(this.flame.head, null);
            this.flame.phase = null;
            this.flame.timer = b.flame.interval;
            // 次は反対側の頭。
            const next = alive.filter((i) => i !== this.flame.head);
            this.flame.head = next.length ? next[0] : alive[0];
          }
        }
      }
    }

    // 噛みつき: 頭の近くに寄った相手へ踏み込む。
    for (const i of alive) {
      this.biteCd[i] = Math.max(0, this.biteCd[i] - dt);
      this.lungeT[i] = Math.max(0, this.lungeT[i] - dt);
      this.rig.heads[i].lunge = this.lungeT[i] > 0 ? b.bite.lunge : 0;
      const head = this.heads[i];
      const hd = Math.hypot(player.pos.x - head.pos.x, player.pos.z - head.pos.z);
      if (this.biteCd[i] <= 0 && hd < b.bite.range) {
        this.biteCd[i] = b.bite.cooldown;
        this.lungeT[i] = 0.35;
        g.attackEntity(player, b.bite.damage, head.pos);
        SFX.swing();
      }
    }

    // 胴体の体当たり（密着へのお仕置き。無敵時間で自然に間引かれる）。
    if (d < b.contactRange) g.attackEntity(player, b.contactDamage, this.pos);

    // 頭の破壊判定。
    for (let i = 0; i < this.heads.length; i += 1) {
      if (this.heads[i].dead && !this.headDown[i]) {
        this.headDown[i] = true;
        this.rig.setHeadDead(i);
        if (this.flame.head === i && this.flame.phase !== null) {
          this.rig.setFlame(i, null);
          this.flame.phase = null;
          this.flame.timer = b.flame.interval * 0.5;
        }
        g.ui.toast(`💥 ${this.cfg.name}の${i === 0 ? "左" : "右"}の頭を 打ち砕いた！`);
        SFX.kill();
      }
    }
    if (this.heads.every((h) => h.dead)) {
      this.finish(true);
      return;
    }

    this.rig.update(dt, this.pos, g.cameraYaw, walking);
  }

  // 火炎の当たり判定: 頭の前方の扇形（2D）。プレイヤーの無敵時間が連続ヒットを間引く。
  applyFlameDamage(i) {
    const g = this.game;
    const b = this.cfg.battle;
    const head = this.heads[i];
    const f = this.rig.facing.clone().normalize();
    const dx = g.player.pos.x - head.pos.x;
    const dz = g.player.pos.z - head.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist > b.flame.range || dist < 0.01) return;
    const dot = (dx * f.x + dz * f.y) / dist;
    if (dot > Math.cos(b.flame.halfAngle)) {
      g.attackEntity(g.player, b.flame.damage, head.pos);
    }
  }

  finish(win) {
    const g = this.game;
    this.active = false;
    // 討伐の証: 無銘の黒鱗。
    if (win) g.giveItems([["black_scale", 1]]);
    // 残った頭のヒットボックスをリストから外す。
    for (const h of this.heads) {
      const idx = g.monsters.monsters.indexOf(h);
      if (idx >= 0) g.monsters.monsters.splice(idx, 1);
    }
    if (this.rig) {
      this.rig.dispose(g.scene);
      this.rig = null;
    }
    this.heads = [];
    if (this.onEnd) this.onEnd(win);
  }
}
