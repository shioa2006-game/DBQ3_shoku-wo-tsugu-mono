import * as THREE from "three";
import { VarugaBattleRig } from "../entities/varuga-battle-rig.js";
import { VARUGA_CONFIG } from "../entities/dragon-configs.js";
import { MOTIONS } from "../entities/varuga-motion.mjs";
import { B, BLOCK_DEFS } from "../world/blocks.js";
import { PLACES, FLOOR_Y, TERRACE_Y } from "../world/world.js";
import { BALLISTA_CELL } from "./blueprints.js";
import { SFX } from "./sfx.js";

// 三頭魔竜ヴァルガとの戦い（docs/DESIGN.md の「9. ヴァルガ戦」）。
//   kind "assault"  初襲来: 空からの火炎と、低く降りた首への反撃。ひるませると勝ち（ゴンタの一矢で退却）
//   kind "final"    最終決戦: 対空ボウガンで翼を射抜いて地上へ降ろし、三つの頭を倒す
// どちらも、祭壇の灯（main.dharma.altarHp）が尽きると敗北。
// 頭は独立した耐久を持つヒットボックスとして MonsterManager に登録し、プレイヤーの攻撃判定・
// 住民AI・ボウガンの標的選択を既存の仕組みのまま使う。

const ORBIT_CENTER = { x: 32.5, z: 46.5 };
const LANDING = { x: 32.5, z: 43.5 };
// 空からの火炎が狙う屋根の場所（最初の一吹きは必ず西）。
const ROOF_ZONES = [
  { x: 27.5, z: 30.5 },
  { x: 37.5, z: 30.5 },
  { x: 32.5, z: 31.5 },
  { x: 30.5, z: 33.5 },
  { x: 35.5, z: 28.5 },
];
// 噛みつきの動作（motion.mjs の bite）で、左・中央・右の頭が突き出す時刻。
const BITE_TIMES = [0.72, 1.77, 2.82];

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
    this.raid = true; // 通常の出現の対象外・防衛系の標的選択に乗せる
    this.isDragonHead = true;
  }

  takeDamage(dmg, fromPos, knockback, attack = null) {
    if (this.dead || (attack ? this.receivedAttacks.has(attack) : this.invuln > 0)) return false;
    if (attack) this.receivedAttacks.add(attack);
    this.hp -= dmg;
    this.invuln = 0.45;
    this.battle.onHeadDamaged(this.index, dmg);
    return true;
  }

  // 頭は判定だけ。見た目は VarugaBattleRig が持つ。
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

export class VarugaBattle {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.kind = null;
    this.phase = null; // "air" | "falling" | "ground" | "dying"
    this.rig = null;
    this.heads = [null, null, null];
    this.pos = new THREE.Vector3();
    this.onEnd = null;
    this.onGrounded = null;
    // 火炎の予告（赤く光る柱と、足もとの輪）。
    this.marker = new THREE.Group();
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff4a2a, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }),
    );
    column.name = "column";
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 24),
      new THREE.MeshBasicMaterial({ color: 0xff6a3a, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.name = "disc";
    this.marker.add(column, disc);
    this.marker.visible = false;
    this.marker.renderOrder = 4;
  }

  get cfg() {
    return VARUGA_CONFIG;
  }

  start(kind) {
    const g = this.game;
    const b = this.cfg.battle;
    this.kind = kind;
    this.active = true;
    this.phase = "air";
    this.rig = new VarugaBattleRig(this.cfg);
    g.scene.add(this.rig.group);
    g.scene.add(this.marker);
    // 海の向こう（南）から飛んでくる。
    this.pos.set(ORBIT_CENTER.x, TERRACE_Y + b.flyHeight + 4, 74);
    this.rig.facing.set(0, -1);
    this.rig.setMotion("flight");
    this.t = 0;
    this.enter("enter");
    this.heads = [null, null, null];
    this.headDown = [false, false, false];
    this.flashT = [0, 0, 0];
    this.stagger = b.swoop.staggerHp;
    this.wingHits = 0;
    this.volleys = 0;
    this.swoopIndex = 0;
    this.wingFlash = 0;
    this.height = b.flyHeight;
    this.cruiseT = 1.0;
    SFX.raidHorn();
  }

  enter(state) {
    this.state = state;
    this.stateT = 0;
  }

  // --- 頭のヒットボックス ---------------------------------------------------------------

  registerHead(i, hp) {
    if (this.heads[i]) return;
    const head = new DragonHead(this, i, `${this.cfg.name}（${this.cfg.headNames[i]}）`, hp);
    this.heads[i] = head;
    this.game.monsters.monsters.push(head);
    head.pos.copy(this.rig.headWorldPos(i, this.pos));
  }

  unregisterHead(i) {
    const head = this.heads[i];
    if (!head) return;
    const list = this.game.monsters.monsters;
    const idx = list.indexOf(head);
    if (idx >= 0) list.splice(idx, 1);
    this.heads[i] = null;
  }

  onHeadDamaged(i, dmg) {
    if (this.kind === "assault") this.stagger -= dmg;
  }

  aliveHeads() {
    return [0, 1, 2].filter((i) => this.heads[i] && !this.heads[i].dead);
  }

  // --- HUD ---------------------------------------------------------------------------

  hudBars() {
    const g = this.game;
    const b = this.cfg.battle;
    const bars = [{ label: "🔥 授職の灯（祭壇）", hp: g.dharma.altarHp, max: g.dharma.altarMax, kind: "altar" }];
    if (this.kind === "assault") {
      bars.push({ label: "🐉 ヴァルガ（ひるむまで）", hp: Math.max(0, this.stagger), max: b.swoop.staggerHp });
    } else if (this.phase === "air" || this.phase === "falling") {
      bars.push({ label: "🐉 ヴァルガの翼", hp: Math.max(0, b.wingHits - this.wingHits), max: b.wingHits });
    } else {
      for (let i = 0; i < 3; i += 1) {
        const head = this.heads[i];
        bars.push({ label: `🐉 ${this.cfg.headNames[i]}`, hp: head ? Math.max(0, head.hp) : 0, max: b.headHp[i] });
      }
    }
    return bars;
  }

  // --- 毎フレーム ----------------------------------------------------------------------

  update(dt) {
    if (!this.active) return;
    const g = this.game;
    this.t += dt;
    this.stateT += dt;
    if (g.dharma.altarHp <= 0 && this.phase !== "dying") {
      this.finish(false);
      return;
    }
    let moving = false;
    if (this.phase === "air") moving = this.updateAir(dt);
    else if (this.phase === "falling") this.updateFalling(dt);
    else if (this.phase === "ground") moving = this.updateGround(dt);
    else if (this.phase === "dying") this.updateDying(dt);
    if (!this.active) return;

    // 頭のヒットボックスの位置と、被弾の色。
    for (let i = 0; i < 3; i += 1) {
      this.flashT[i] = Math.max(0, this.flashT[i] - dt);
      const head = this.heads[i];
      if (head && !head.dead) head.pos.copy(this.rig.headWorldPos(i, this.pos));
      if (this.phase !== "dying") this.rig.setHeadFlash(i, this.flashT[i] > 0 || this.wingFlash > 0);
    }
    this.wingFlash = Math.max(0, this.wingFlash - dt);
    this.rig.update(dt, this.pos, g.cameraYaw, moving);
    if (this.marker.visible) {
      const pulse = 0.16 + (Math.sin(this.t * 14) + 1) * 0.1;
      this.marker.getObjectByName("column").material.opacity = pulse;
      this.marker.getObjectByName("disc").material.opacity = pulse + 0.25;
    }
  }

  // 空の周回の位置（前庭の上を左右へ行き来する）。
  orbitPoint() {
    const a = this.t * 0.32;
    return { x: ORBIT_CENTER.x + Math.cos(a) * 8, z: ORBIT_CENTER.z + Math.sin(a * 2) * 3 };
  }

  flyToward(dt, x, z, y, speed) {
    const dx = x - this.pos.x;
    const dz = z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.05) {
      const step = Math.min(d, speed * dt);
      this.pos.x += (dx / d) * step;
      this.pos.z += (dz / d) * step;
    }
    this.pos.y += (y - this.pos.y) * Math.min(1, dt * 2.5);
    return d;
  }

  faceToward(x, z, dt, rate = 3) {
    const dx = x - this.pos.x;
    const dz = z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.01) return;
    const f = this.rig.facing;
    f.x += (dx / d - f.x) * Math.min(1, dt * rate);
    f.y += (dz / d - f.y) * Math.min(1, dt * rate);
    if (f.lengthSq() < 0.01) f.set(dx / d, dz / d);
  }

  // --- 空の戦い（初襲来の全体と、最終決戦の対空） ---------------------------------------

  updateAir(dt) {
    const g = this.game;
    const b = this.cfg.battle;
    const flyY = TERRACE_Y + b.flyHeight;
    const o = this.orbitPoint();
    if (this.state === "enter") {
      const d = this.flyToward(dt, o.x, o.z, flyY, 10);
      this.faceToward(PLACES.altar.x, PLACES.altar.z, dt);
      if (d < 1.5 || this.stateT > 5) {
        this.enter("cruise");
        this.cruiseT = 0.8;
      }
      return true;
    }
    if (this.state === "cruise") {
      this.flyToward(dt, o.x, o.z, flyY, b.flySpeed);
      this.faceToward(PLACES.altar.x, PLACES.altar.z, dt);
      this.cruiseT -= dt;
      if (this.cruiseT <= 0) this.beginAirFlame();
      return true;
    }
    if (this.state === "flame") {
      // 空で止まり、狙う場所へ向いて火を吐く（予告 → 吐射）。
      this.flyToward(dt, o.x, o.z, flyY, b.flySpeed * 0.25);
      this.faceToward(this.target.x, this.target.z, dt, 5);
      if (this.stateT >= 1.0 && !this.fired) {
        this.fired = true;
        this.applyAirFlame();
      }
      if (this.stateT >= 1.0 && this.stateT < 2.75) this.burnPlayerInTarget();
      if (this.stateT >= 2.75) this.marker.visible = false;
      if (this.stateT >= MOTIONS.air_flame.duration) {
        this.rig.setMotion("flight");
        if (this.kind === "assault") this.beginSwoop();
        else {
          this.enter("cruise");
          this.cruiseT = b.airFlame.interval - MOTIONS.air_flame.duration;
        }
      }
      return false;
    }
    if (this.state === "swoop") return this.updateSwoop(dt);
    if (this.state === "flinch") {
      // ひるんで高く退く。ここで勝ち（ゴンタの一矢は会話で描く）。
      this.pos.y += dt * 2.2;
      if (this.stateT > 1.1) this.finish(true);
      return true;
    }
    return false;
  }

  beginAirFlame() {
    const g = this.game;
    const b = this.cfg.battle;
    let target;
    const tower = g.ballista.cell;
    if (this.kind === "final" && tower && (g.ballista.mounted ? Math.random() < 0.6 : this.volleys % 3 === 2)) {
      target = { kind: "tower", x: tower.x + 0.5, z: tower.z + 0.5, y: tower.y, r: b.airFlame.radius };
    } else {
      // 初襲来の最初の一吹きは、必ず大屋根の西を焼く（アサギの補修へつなぐ）。
      const first = this.kind === "assault" && this.volleys === 0;
      const zone = first ? ROOF_ZONES[0] : ROOF_ZONES[1 + Math.floor(Math.random() * (ROOF_ZONES.length - 1))];
      target = { kind: "roof", x: zone.x, z: zone.z, y: FLOOR_Y, r: first ? 3.2 : b.airFlame.radius, first };
    }
    this.target = target;
    this.fired = false;
    this.volleys += 1;
    this.rig.setMotion("air_flame");
    this.enter("flame");
    this.showMarker(target);
    SFX.raidHorn();
    g.throttledToast("flamewarn", target.kind === "tower" ? "🔥 射台が狙われている！ 降りて離れろ！" : "🔥 火炎が来る！ 赤く光る場所から離れろ！");
  }

  showMarker(target) {
    const column = this.marker.getObjectByName("column");
    const disc = this.marker.getObjectByName("disc");
    const h = 14;
    column.scale.set(target.r, h, target.r);
    column.position.set(0, h / 2, 0);
    disc.scale.setScalar(target.r);
    disc.position.set(0, 0.06, 0);
    this.marker.position.set(target.x, target.y, target.z);
    this.marker.visible = true;
  }

  // 狙った場所の列（屋根のある範囲）。
  targetColumns() {
    const t = this.target;
    const cols = [];
    for (let x = Math.floor(t.x - t.r); x <= Math.ceil(t.x + t.r); x += 1) {
      for (let z = Math.floor(t.z - t.r); z <= Math.ceil(t.z + t.r); z += 1) {
        if (Math.hypot(x + 0.5 - t.x, z + 0.5 - t.z) > t.r) continue;
        if (x < 23 || x > 41 || z < 25 || z > 36) continue; // 大屋根の範囲
        cols.push([x, z]);
      }
    }
    return cols;
  }

  // 列のいちばん上の、焼ける屋根のブロック（無ければ null）。
  topBurnable(x, z) {
    const w = this.game.world;
    for (let y = FLOOR_Y + 10; y >= FLOOR_Y + 4; y -= 1) {
      const id = w.get(x, y, z);
      if (id === B.AIR || id === B.LANTERN) continue;
      return BLOCK_DEFS[id]?.burnable ? { x, y, z } : null;
    }
    return null;
  }

  // 列に屋根・梁が残っているか（穴なら false）。
  roofed(x, z) {
    const w = this.game.world;
    for (let y = FLOOR_Y + 4; y <= FLOOR_Y + 10; y += 1) {
      if (BLOCK_DEFS[w.get(x, y, z)]?.solid === true) return true;
    }
    return false;
  }

  // 空からの火炎が届いた: 屋根があれば屋根板が焼け落ち、穴が開いている分だけ祭壇の灯が傷つく。
  applyAirFlame() {
    const g = this.game;
    const b = this.cfg.battle;
    const t = this.target;
    SFX.breakBlock();
    if (t.kind !== "roof") return;
    const cols = this.targetColumns();
    const interior = cols.filter(([x, z]) => x >= 25 && x <= 39 && z >= 27 && z <= 34);
    const open = interior.filter(([x, z]) => !this.roofed(x, z)).length;
    const burn = t.first ? b.firstVolleyBurn : b.airFlame.roofBurn;
    // 中心に近い列から焼く（同じ場所なら毎回同じ形の穴になる）。
    const order = cols
      .map(([x, z]) => ({ x, z, d: Math.hypot(x + 0.5 - t.x, z + 0.5 - t.z) }))
      .sort((p, q) => p.d - q.d || p.x - q.x || p.z - q.z);
    let burned = 0;
    for (const c of order) {
      if (burned >= burn) break;
      const cell = this.topBurnable(c.x, c.z);
      if (!cell) continue;
      g.world.set(cell.x, cell.y, cell.z, B.AIR);
      burned += 1;
    }
    if (burned) g.throttledToast("roofburn", "🔥 大屋根が 焼け落ちた！");
    if (interior.length && open > 0) {
      const dmg = Math.round(b.airFlame.altarDamage * (open / interior.length));
      if (dmg > 0) {
        g.dharma.altarHp = Math.max(0, g.dharma.altarHp - dmg);
        SFX.hurt();
        g.throttledToast("altarburn", "🔥 屋根の穴から 炎が吹き込み、祭壇の灯が揺らいだ！");
      }
    }
  }

  // 吐射のあいだ、狙われた場所にいるプレイヤーは焼かれる。
  burnPlayerInTarget() {
    const g = this.game;
    const t = this.target;
    const p = g.player.pos;
    if (Math.hypot(p.x - t.x, p.z - t.z) > t.r) return;
    if (t.kind === "roof") {
      // 屋根の上にいるか、頭の上に屋根が無いときだけ届く。
      const covered = p.y < FLOOR_Y + 3.5 && this.roofed(Math.floor(p.x), Math.floor(p.z));
      if (covered) return;
    }
    g.attackEntity(g.player, this.cfg.battle.airFlame.playerDamage, this.pos);
  }

  // --- 初襲来: 低く降りた首 --------------------------------------------------------------

  beginSwoop() {
    const i = this.swoopIndex % 3;
    this.swoopIndex += 1;
    this.swoopHead = i;
    this.bitten = false;
    this.enter("swoop");
    this.registerHead(i, 99999);
    this.game.throttledToast("swoop", "🐉 首が降りてくる！ いまなら 攻撃が届く！");
  }

  updateSwoop(dt) {
    const g = this.game;
    const b = this.cfg.battle;
    const s = b.swoop;
    const i = this.swoopHead;
    const p = g.player.pos;
    // 前庭の上で低く降り、プレイヤーの手前で首を伸ばす。
    const px = Math.max(21, Math.min(43, p.x));
    const pz = Math.max(38, Math.min(50, p.z));
    this.faceToward(px, pz, dt, 4);
    const f = this.rig.facing.clone().normalize();
    const lowY = TERRACE_Y + 4.4;
    this.flyToward(dt, px - f.x * 5.2, pz - f.y * 5.2, lowY, 5.5);
    const k = this.stateT < 0.9 ? this.stateT / 0.9 : this.stateT > s.duration - 0.6 ? Math.max(0, (s.duration - this.stateT) / 0.6) : 1;
    const e = this.rig.extra[i];
    const mount = this.cfg.heads[i];
    e.forward = 2.4 * k;
    e.side = -mount.side * 0.6 * k;
    // 頭の高さを、プレイヤーの頭の少し上まで下げる。
    const headY = this.pos.y + mount.up;
    e.down = Math.max(0, headY - (p.y + 1.5)) * k;
    const head = this.heads[i];
    if (!this.bitten && this.stateT >= 1.5 && head) {
      this.bitten = true;
      if (Math.hypot(p.x - head.pos.x, p.z - head.pos.z) < s.range) g.attackEntity(g.player, s.damage, head.pos);
      SFX.swing();
    }
    if (this.stagger <= 0) {
      this.endSwoop();
      this.rig.setMotion("flight");
      this.wingFlash = 1.0;
      this.enter("flinch");
      SFX.kill();
      return true;
    }
    if (this.stateT >= s.duration) {
      this.endSwoop();
      this.enter("cruise");
      this.cruiseT = 1.6;
    }
    return true;
  }

  endSwoop() {
    const e = this.rig.extra[this.swoopHead];
    e.forward = 0;
    e.side = 0;
    e.down = 0;
    this.unregisterHead(this.swoopHead);
  }

  // --- 最終決戦: 対空 --------------------------------------------------------------------

  // 大矢の当たり判定（systems/ballista.js から）。当たったら true。
  hitByBolt(p0, p1) {
    if (this.kind !== "final") return false;
    const hit = (center, r) => segmentSphere(p0, p1, center, r);
    if (this.phase === "air") {
      const f = this.rig.facing.clone().normalize();
      const right = new THREE.Vector3(f.y, 0, -f.x);
      const body = this.pos.clone().add(new THREE.Vector3(0, 1.4, 0));
      const wings = [-1, 1].map((s) => body.clone().addScaledVector(right, s * 2.9).add(new THREE.Vector3(0, 0.6, 0)));
      if (wings.some((w) => hit(w, 2.3)) || hit(body, 1.9)) {
        this.onWingHit();
        return true;
      }
      return false;
    }
    if (this.phase === "ground") {
      for (const i of this.aliveHeads()) {
        if (hit(this.heads[i].pos, 1.4)) {
          this.game.hurtMonster(this.heads[i], 14, null, {});
          return true;
        }
      }
    }
    return false;
  }

  onWingHit() {
    const g = this.game;
    const b = this.cfg.battle;
    this.wingHits += 1;
    this.wingFlash = 0.3;
    SFX.hitMonster();
    g.ui.toast(`🎯 大矢が 翼を貫いた！（${Math.min(this.wingHits, b.wingHits)}/${b.wingHits}）`);
    if (this.wingHits >= b.wingHits) {
      // 翼を射抜かれて、前庭へ墜ちる。
      this.marker.visible = false;
      this.phase = "falling";
      this.fallFrom = this.pos.clone();
      this.rig.setMotion("landing");
      this.enter("fall");
      SFX.kill();
    }
  }

  updateFalling(dt) {
    const g = this.game;
    const k = Math.min(1, this.stateT / 1.6);
    const groundY = TERRACE_Y + this.cfg.hover;
    this.pos.x = this.fallFrom.x + (LANDING.x - this.fallFrom.x) * k;
    this.pos.z = this.fallFrom.z + (LANDING.z - this.fallFrom.z) * k;
    this.pos.y = this.fallFrom.y + (groundY - this.fallFrom.y) * k;
    this.faceToward(g.player.pos.x, g.player.pos.z, dt, 2);
    if (this.stateT >= MOTIONS.landing.duration) {
      this.phase = "ground";
      this.rig.setMotion("ground");
      this.enter("idle");
      const b = this.cfg.battle;
      for (let i = 0; i < 3; i += 1) this.registerHead(i, b.headHp[i]);
      this.biteT = 2.5;
      this.flameT = b.groundFlame.interval * 0.6;
      g.ballista.dismount();
      this.onGrounded?.();
    }
  }

  // --- 最終決戦: 地上 --------------------------------------------------------------------

  updateGround(dt) {
    const g = this.game;
    const b = this.cfg.battle;
    const p = g.player.pos;
    this.pos.y = TERRACE_Y + this.cfg.hover;
    let moving = false;

    // 頭が倒れたか。
    for (let i = 0; i < 3; i += 1) {
      const head = this.heads[i];
      if (head && head.dead && !this.headDown[i]) {
        this.headDown[i] = true;
        this.rig.setHeadDead(i);
        g.ui.toast(`💥 ヴァルガの${this.cfg.headNames[i]}を 倒した！`);
        SFX.kill();
      }
    }
    if (this.headDown.every(Boolean)) {
      this.phase = "dying";
      this.enter("dying");
      for (let i = 0; i < 3; i += 1) this.unregisterHead(i);
      return false;
    }
    const alive = [0, 1, 2].filter((i) => !this.headDown[i]);

    if (this.state === "idle") {
      // プレイヤーへ向き直り、離れていればゆっくり詰める（前庭から出ない）。
      this.faceToward(p.x, p.z, dt, 1.6);
      const d = Math.hypot(p.x - this.pos.x, p.z - this.pos.z);
      if (d > 6.5 && d < 30) {
        this.pos.x += ((p.x - this.pos.x) / d) * 1.2 * dt;
        this.pos.z += ((p.z - this.pos.z) / d) * 1.2 * dt;
        moving = true;
      }
      this.pos.x = Math.max(24, Math.min(41, this.pos.x));
      this.pos.z = Math.max(39.5, Math.min(48.5, this.pos.z));
      this.biteT -= dt;
      this.flameT -= dt;
      if (this.flameT <= 0) {
        this.rig.setMotion("flame");
        this.enter("flame");
        this.focusDone = false;
        SFX.raidHorn();
        g.throttledToast("gflame", "🔥 三つの頭が 火をためている！");
      } else if (this.biteT <= 0 && d < 8) {
        this.rig.setMotion("bite");
        this.enter("bite");
        this.struck = [false, false, false];
      }
    } else if (this.state === "bite") {
      for (const i of alive) {
        if (!this.struck[i] && this.stateT >= BITE_TIMES[i]) {
          this.struck[i] = true;
          const hp = this.rig.headWorldPos(i, this.pos);
          if (Math.hypot(p.x - hp.x, p.z - hp.z) < b.bite.range && Math.abs(p.y - TERRACE_Y) < 4) {
            g.attackEntity(g.player, b.bite.damage, hp);
          }
          SFX.swing();
        }
      }
      if (this.stateT >= MOTIONS.bite.duration) {
        this.rig.setMotion("ground");
        this.enter("idle");
        this.biteT = b.bite.interval;
      }
    } else if (this.state === "flame") {
      const f = this.rig.facing.clone().normalize();
      for (const i of alive) {
        const start = 1 + i * 0.18;
        const end = 2.75 + i * 0.18;
        if (this.stateT < start || this.stateT >= end) continue;
        if (i === 1) {
          // 中央の頭: 入口の奥の祭壇を狙う。
          if (!this.focusDone) {
            this.focusDone = true;
            this.focusFlame();
          }
        } else {
          // 左右の頭: 前庭を薙ぐ。
          const hp = this.rig.headWorldPos(i, this.pos);
          const dx = p.x - hp.x;
          const dz = p.z - hp.z;
          const dist = Math.hypot(dx, dz);
          if (dist < b.groundFlame.sweepRange && dist > 0.01 && (dx * f.x + dz * f.y) / dist > Math.cos(b.groundFlame.sweepHalfAngle)) {
            g.attackEntity(g.player, b.groundFlame.sweepDamage, hp);
          }
        }
      }
      if (this.stateT >= MOTIONS.flame.duration) {
        this.rig.setMotion("ground");
        this.enter("idle");
        this.flameT = b.groundFlame.interval;
      }
    }

    // 胴の体当たり（密着へのお仕置き）。
    if (Math.hypot(p.x - this.pos.x, p.z - this.pos.z) < b.contactRange && Math.abs(p.y - TERRACE_Y) < 3) {
      g.attackEntity(g.player, b.contactDamage, this.pos);
    }
    return moving;
  }

  // 中央の頭の火炎: 入口を焼き、奥の祭壇の灯を傷つける。
  focusFlame() {
    const g = this.game;
    const b = this.cfg.battle;
    g.dharma.altarHp = Math.max(0, g.dharma.altarHp - b.groundFlame.focusAltarDamage);
    SFX.hurt();
    g.throttledToast("focus", "🔥 中央の頭の炎が 入口から吹き込み、祭壇の灯が揺らいだ！");
    // 入口の上（破風・梁・アーチ）から順に焼け崩れる。
    const order = [
      [32, FLOOR_Y + 7, 36], [32, FLOOR_Y + 7, 35], [31, FLOOR_Y + 6, 36], [32, FLOOR_Y + 6, 36], [33, FLOOR_Y + 6, 36],
      [31, FLOOR_Y + 6, 35], [32, FLOOR_Y + 6, 35], [33, FLOOR_Y + 6, 35],
      [31, FLOOR_Y + 5, 36], [32, FLOOR_Y + 5, 36], [33, FLOOR_Y + 5, 36], [31, FLOOR_Y + 4, 35], [32, FLOOR_Y + 4, 35], [33, FLOOR_Y + 4, 35],
      [31, FLOOR_Y + 3, 35], [32, FLOOR_Y + 3, 35], [33, FLOOR_Y + 3, 35], [31, FLOOR_Y + 2, 35], [33, FLOOR_Y + 2, 35],
    ];
    let n = 0;
    for (const [x, y, z] of order) {
      if (n >= b.groundFlame.focusBurn) break;
      if (g.world.get(x, y, z) === B.AIR) continue;
      g.world.set(x, y, z, B.AIR);
      n += 1;
    }
    if (n) SFX.breakBlock();
  }

  // 三つの頭が倒れ、巨体は黒い霧へ崩れて消える（何も残さない）。
  updateDying() {
    this.rig.setFade(this.stateT / 1.5);
    if (this.stateT >= 1.5) this.finish(true);
  }

  finish(win) {
    const g = this.game;
    this.active = false;
    for (let i = 0; i < 3; i += 1) this.unregisterHead(i);
    if (this.rig) {
      this.rig.dispose(g.scene);
      this.rig = null;
    }
    this.marker.visible = false;
    g.scene.remove(this.marker);
    g.ballista.dismount();
    const kind = this.kind;
    this.phase = null;
    if (this.onEnd) this.onEnd(kind, win);
  }

  // 戦いを決着なしで片づける（敗北からの復元など）。
  abort() {
    if (!this.active) return;
    const end = this.onEnd;
    this.onEnd = null;
    this.finish(false);
    this.onEnd = end;
  }
}

// 線分 p0→p1 が、中心 c・半径 r の球に触れるか。
function segmentSphere(p0, p1, c, r) {
  const d = p1.clone().sub(p0);
  const len2 = d.lengthSq();
  const t = len2 > 0 ? Math.max(0, Math.min(1, c.clone().sub(p0).dot(d) / len2)) : 0;
  return p0.clone().addScaledVector(d, t).distanceToSquared(c) <= r * r;
}

// 射台の位置（テスト・HUD から参照）。
export const TOWER_CELL = BALLISTA_CELL;
