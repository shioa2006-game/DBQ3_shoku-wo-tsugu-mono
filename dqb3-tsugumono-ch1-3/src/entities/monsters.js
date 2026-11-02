import * as THREE from "three";
import { Entity, GRAVITY } from "./entity.js";
import { MonsterSprite, applySubmersionColor, submersionAt } from "./rig.js";
import { B } from "../world/blocks.js";
import { WORLD } from "../world/world.js";
import { SFX } from "../game/sfx.js";

const SLIME_A = new URL("../../assets/nonhumanoids/slime_code_idle_a_8dir.png", import.meta.url).href;
const SLIME_B = new URL("../../assets/nonhumanoids/slime_code_idle_b_8dir.png", import.meta.url).href;
const BAT_A = new URL("../../assets/nonhumanoids/night_bat_code_idle_a_8dir.png", import.meta.url).href;
const BAT_B = new URL("../../assets/nonhumanoids/night_bat_code_idle_b_8dir.png", import.meta.url).href;
const RAT_A = new URL("../../assets/nonhumanoids/field_rat_code_idle_a_8dir.png", import.meta.url).href;
const RAT_B = new URL("../../assets/nonhumanoids/field_rat_code_idle_b_8dir.png", import.meta.url).href;
const DORO_A = new URL("../../assets/nonhumanoids/dorotabo_code_idle_a_8dir.png", import.meta.url).href;
const DORO_B = new URL("../../assets/nonhumanoids/dorotabo_code_idle_b_8dir.png", import.meta.url).href;
const SQUID_A = new URL("../../assets/nonhumanoids/squid_code_idle_a_8dir.png", import.meta.url).href;
const SQUID_B = new URL("../../assets/nonhumanoids/squid_code_idle_b_8dir.png", import.meta.url).href;

export const MONSTER_TYPES = {
  slime: {
    name: "スライム",
    sheets: [SLIME_A, SLIME_B],
    hp: 7, atk: 2, scale: 0.9, flying: false, aggro: 6, speed: 3.0,
    drops: [["jelly", 1, 2]],
    tint: 0xffffff,
  },
  bat: {
    name: "おおこうもり",
    sheets: [BAT_A, BAT_B],
    hp: 5, atk: 2, scale: 0.85, flying: true, aggro: 8, speed: 2.9,
    drops: [["wing", 1, 2]],
    tint: 0xffffff,
  },
  boss: {
    name: "書喰いのスライム",
    sheets: [SLIME_A, SLIME_B],
    hp: 70, atk: 5, scale: 2.6, flying: false, aggro: 40, speed: 2.4,
    drops: [["jelly", 6, 10], ["copper", 2, 3]],
    tint: 0xff8f8f,
    boss: true,
    special: "charge", // 固有行動: 予兆つきの突進
  },
  // --- 第2章: 南の田の村 -------------------------------------------------------
  field_rat: {
    // 速い・弱い・群れる地上ザコ。昼、田を食い荒らす。
    name: "おおねずみ",
    sheets: [RAT_A, RAT_B],
    hp: 4, atk: 2, scale: 0.9, flying: false, aggro: 8, speed: 3.6,
    drops: [["hide", 1, 1], ["seed", 0, 1]],
    tint: 0xffffff,
  },
  dorotabo: {
    // 遅い・硬い・一撃が重い泥の妖怪。夜、泥だまりから湧く。
    name: "どろたぼう",
    sheets: [DORO_A, DORO_B],
    hp: 16, atk: 4, scale: 1.15, flying: false, aggro: 6, speed: 1.9,
    drops: [["clay", 1, 2]],
    tint: 0xffffff,
  },
  paddy_boss: {
    // 第2章の章末ボス: どろたぼうの大型化（scale+tint、画像は共用）。
    name: "泥田の主",
    sheets: [DORO_A, DORO_B],
    hp: 90, atk: 6, scale: 2.4, flying: false, aggro: 40, speed: 2.2,
    drops: [["clay", 6, 10], ["copper", 2, 3]],
    tint: 0xd08a6a,
    boss: true,
    special: "slam", // 固有行動: 予兆つきの泥はね（周囲への薙ぎ払い）
  },
  // --- 第3章: 旅立ちの港 -------------------------------------------------------
  squid: {
    // 夜の海峡の水面に湧く。flying 扱いで海面上をふわふわ漂う。
    // 平時はプレイヤーに気づくと陸まで追ってくる。襲撃時（クラーケン戦の波）は
    // 常に守り手を狙って浜・桟橋へ上陸する（chooseTarget 参照）。
    name: "イカ",
    sheets: [SQUID_A, SQUID_B],
    hp: 6, atk: 2, scale: 0.95, flying: true, aggro: 7, speed: 2.6,
    drops: [["squid_ink", 1, 2]],
    tint: 0xffffff,
  },
  kraken: {
    // 章ボス本体（8方向ビルボードの拡大＋色替え）。触手を全て折るまで無敵。
    name: "クラーケン",
    sheets: [SQUID_A, SQUID_B],
    hp: 60, atk: 5, scale: 2.8, flying: true, aggro: 40, speed: 0,
    drops: [["squid_ink", 8, 12], ["copper", 2, 3]],
    tint: 0x6a4a7a,
    boss: true,
    rooted: true,
    shielded: true, // 触手が全滅するまで本体はダメージを受けない
  },
  kraken_arm: {
    // クラーケンの触手。3D の円錐メッシュで表現し、各本にHPがある。
    name: "触手",
    sheets: [SQUID_A, SQUID_B],
    hp: 14, atk: 4, scale: 1.0, flying: true, aggro: 40, speed: 0,
    drops: [["squid_ink", 0, 1]],
    tint: 0x7a5a8a,
    rooted: true,
    tentacle: true,
  },
};

export class Monster extends Entity {
  constructor(type, x, y, z, opts = {}) {
    const def = MONSTER_TYPES[type];
    super("monster", def.flying ? 0.32 : 0.36 * def.scale, def.flying ? 0.6 : 0.75 * def.scale);
    this.type = type;
    this.def = def;
    this.raid = !!opts.raid;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.pos.set(x, y, z);
    this.anchor = new THREE.Vector3(x, y, z);
    this.sprite = new MonsterSprite({
      sheetAUrl: def.sheets[0],
      sheetBUrl: def.sheets[1],
      scale: def.scale,
      tint: def.tint,
      yOffset: def.flying ? 0.4 : 0,
    });
    this._visualBase = new THREE.Color(def.tint);
    this.root = new THREE.Group();
    this.root.add(this.sprite.group);
    this.root.position.copy(this.pos);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.3 * def.scale, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.root.add(this.shadow);

    // Tiny HP bar (hidden until damaged). Plane meshes keep the red fill and
    // black background in one camera-facing local coordinate system.
    this.hpBar = new THREE.Group();
    const bgW = 0.72 * def.scale;
    const fgW = 0.68 * def.scale;
    const bgGeom = new THREE.PlaneGeometry(bgW, 0.09);
    bgGeom.translate(bgW / 2, 0, 0);
    const fgGeom = new THREE.PlaneGeometry(fgW, 0.06);
    fgGeom.translate(fgW / 2, 0, 0);
    const bg = new THREE.Mesh(
      bgGeom,
      new THREE.MeshBasicMaterial({ color: 0x201810, depthWrite: false, side: THREE.DoubleSide }),
    );
    const fg = new THREE.Mesh(
      fgGeom,
      new THREE.MeshBasicMaterial({ color: 0xe0503a, depthWrite: false, side: THREE.DoubleSide }),
    );
    bg.position.x = -bgW / 2;
    fg.position.set(-fgW / 2, 0, 0.002);
    this.hpBar.add(bg, fg);
    this.hpBarFg = fg;
    this.hpBar.position.y = def.scale * (def.flying ? 1.55 : 1.15);
    this.hpBar.visible = false;
    this.root.add(this.hpBar);

    // 章ボス: 触手を折るまで本体は無敵（DefenseEvent が解除する）。
    this.shielded = !!def.shielded;
    // 触手は 3D の鞭メッシュで描く（イカのビルボードは隠す）。先細りの円柱4節を
    // 親子チェーンにし、各節の回転に位相差の正弦波を与えてS字にしならせる
    //（全長 約5.4＝旧円錐の2倍）。マテリアルは共有し、水中色・被弾フラッシュが
    // 全節へ一括で効くようにする。
    if (def.tentacle) {
      this.sprite.group.visible = false;
      const SEG_LEN = 1.35;
      const RADII = [0.34, 0.22, 0.14, 0.08, 0.03]; // 節ごとの根元→先端半径
      const mat = new THREE.MeshStandardMaterial({ color: def.tint, roughness: 0.85, metalness: 0.0 });
      this.tentacleSegs = [];
      let parentSeg = null;
      for (let i = 0; i < 4; i += 1) {
        const g = new THREE.CylinderGeometry(RADII[i + 1], RADII[i], SEG_LEN, 7);
        g.translate(0, SEG_LEN / 2, 0); // 根元を原点に置く（根元支点でしなる）
        const seg = new THREE.Mesh(g, mat);
        if (parentSeg) {
          seg.position.y = SEG_LEN;
          parentSeg.add(seg);
        } else {
          this.root.add(seg);
        }
        this.tentacleSegs.push(seg);
        parentSeg = seg;
      }
      this.tentacle = this.tentacleSegs[0]; // 既存参照（点滅・死亡縮小・水中色）は根元へ
      this.hpBar.position.y = 3.4;
    }

    this.moveTimer = Math.random() * 2;
    this.attackCd = 0;
    this.stuckTime = 0;
    this.facingDir = new THREE.Vector2(0, 1);
    this.deathT = 0;
    this.flashT = 0;
    this.spikeCd = 0;
    this.windupT = 0; // 薙ぎの予備動作の残り時間（rooted型）
    this.diveT = 10; // 浮上後の本体が次に潜航するまでの時間
    this.diving = null; // 潜航移動の状態 {target, phase}
    this.surfacePoints = null; // 浮上ポイント（防衛イベントが本体へ設定）
    this.surfaceY = y;
    this.specialCd = 4; // 章ボスの固有行動（突進・泥はね）のクールダウン
    this.bossAct = null; // 固有行動の状態 {phase, t, dur}
  }

  chooseTarget(ctx) {
    if (this.raid) {
      // Raiders head for the banner, but peel off onto nearby defenders.
      // イカの襲撃団は距離によらず常に守り手（人）を狙う: 浜・桟橋の上の相手へ
      // 上陸して襲いかかり、水中から船をかじる水中戦にしない（クラーケン戦の
      // 船ダメージ源は触手のかじりが担う）。
      let best = null;
      let bestD = this.type === "squid" ? Infinity : 5.0;
      for (const e of [ctx.player, ...ctx.villagers]) {
        if (e.dead || e.down) continue;
        const d = this.pos.distanceTo(e.pos);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      if (best) return { entity: best, pos: best.pos };
      // Otherwise gnaw on the banner itself.
      return { entity: ctx.bannerEntity, pos: ctx.bannerEntity.pos };
    }
    const d = this.pos.distanceTo(ctx.player.pos);
    const aggro = this.def.aggro * (ctx.isNight ? 1.4 : 1);
    if (!ctx.player.dead && d < aggro) return { entity: ctx.player, pos: ctx.player.pos };
    return null;
  }

  update(dt, ctx) {
    if (this.dead) {
      this.deathT += dt;
      const s = Math.max(0, 1 - this.deathT * 3);
      this.sprite.group.scale.setScalar(s);
      if (this.tentacle) this.tentacle.scale.setScalar(s);
      this.root.position.copy(this.pos);
      return;
    }
    this.invuln = Math.max(0, this.invuln - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    this.spikeCd = Math.max(0, this.spikeCd - dt);

    const target = this.chooseTarget(ctx);
    const speed = this.def.speed;

    if (this.def.rooted) {
      this.updateRooted(dt, ctx);
    } else if (this.def.flying) {
      this.updateBat(dt, ctx, target, speed);
    } else {
      this.updateSlime(dt, ctx, target, speed);
    }

    // Spike traps.
    const cellId = ctx.world.get(Math.floor(this.pos.x), Math.floor(this.pos.y + 0.1), Math.floor(this.pos.z));
    if (cellId === B.SPIKES && this.spikeCd <= 0) {
      this.spikeCd = 0.8;
      ctx.hurtMonster(this, 3, null);
    }

    // Contact attack.
    if (target?.entity && this.attackCd <= 0) {
      const e = target.entity;
      const d = this.pos.distanceTo(e.pos);
      if (d < this.halfW + e.halfW + 0.35 && Math.abs(this.pos.y - e.pos.y) < 1.4) {
        this.attackCd = 1.1;
        ctx.attackEntity(e, this.def.atk, this.pos);
      }
    }

    // Raiders gnaw through fences/doors when stuck.
    if (this.raid && this.stuckTime > 1.0) {
      const fx = Math.floor(this.pos.x + this.facingDir.x * 0.9);
      const fz = Math.floor(this.pos.z + this.facingDir.y * 0.9);
      for (let dy = 0; dy <= 1; dy += 1) {
        const y = Math.floor(this.pos.y) + dy;
        const id = ctx.world.get(fx, y, fz);
        if (id === B.FENCE || id === B.DOOR) {
          ctx.damageBlock(fx, y, fz, this.def.boss ? 6 : 2);
          this.stuckTime = 0;
          break;
        }
      }
      if (this.stuckTime > 2.4) {
        // Give up and sidestep.
        this.facingDir.rotateAround(new THREE.Vector2(), (Math.random() - 0.5) * 2);
        this.stuckTime = 0;
      }
    }

    // Visuals.
    this.root.position.copy(this.pos);
    this.sprite.faceWorld(this.facingDir.x, this.facingDir.y, ctx.cameraYaw);
    this.sprite.mesh.rotation.y = ctx.cameraYaw;
    this.sprite.update(dt);
    this.updateWaterAppearance(ctx.world);
    const gy = ctx.world.groundYBelow(this.pos.x, this.pos.z, this.pos.y + 0.1);
    this.shadow.position.y = gy - this.pos.y + 0.02;
    this.hpBar.visible = this.hp < this.maxHp;
    this.hpBar.rotation.y = ctx.cameraYaw;
    this.hpBarFg.scale.x = Math.max(0, this.hp / this.maxHp);
    // 被弾点滅。触手はイカのビルボードを常に隠し、鞭メッシュ側を点滅させる
    //（従来はこの行が constructor の非表示設定を毎フレーム上書きし、
    // 触手の根元にイカの絵が重なって見えていた）。
    const blink = this.invuln <= 0.3 || Math.floor(this.invuln * 16) % 2 === 0;
    this.sprite.group.visible = !this.def.tentacle && blink;
    if (this.tentacle) this.tentacle.visible = blink;
  }

  updateSlime(dt, ctx, target, speed) {
    // 章ボスの固有行動（予兆つき突進・泥はね）。実行中はこちらで移動まで扱う。
    if (this.def.special && target && this.updateBossSpecial(dt, ctx, target, speed)) return;
    this.vel.y += GRAVITY * dt;
    // Ground friction between hops.
    if (this.onGround) {
      this.vel.x *= Math.max(0, 1 - dt * 6);
      this.vel.z *= Math.max(0, 1 - dt * 6);
    }
    this.moveTimer -= dt;
    if (this.onGround && this.moveTimer <= 0) {
      let dir = null;
      if (target) {
        dir = new THREE.Vector2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
        this.moveTimer = this.def.boss ? 0.9 : 0.55 + Math.random() * 0.3;
      } else {
        // Lazy wander around the anchor.
        this.moveTimer = 1.6 + Math.random() * 2.2;
        const back = this.anchor.distanceTo(this.pos) > 7;
        dir = back
          ? new THREE.Vector2(this.anchor.x - this.pos.x, this.anchor.z - this.pos.z)
          : new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5);
      }
      if (dir.lengthSq() > 0.01) {
        dir.normalize();
        this.facingDir.copy(dir);
        this.vel.x = dir.x * speed;
        this.vel.z = dir.y * speed;
        this.vel.y = this.def.boss ? 7.5 : 6.4;
      }
    }
    this.hitWall = false;
    this.moveWithCollision(ctx.world, dt, this.inWater ? 1.05 : 0);
    if (this.hitWall) this.stuckTime += dt;
    else this.stuckTime = Math.max(0, this.stuckTime - dt * 2);
    // Squash & stretch with the hop.
    const squash = this.onGround ? 1 : 1 + Math.min(0.25, Math.abs(this.vel.y) * 0.02);
    this.sprite.mesh.scale.set(this.def.scale * (2 - squash), this.def.scale * squash, this.def.scale);
  }

  // 章ボスの固有行動: 予兆（赤点滅＋膨らみ）を見せてから、狙った相手への突進
  //（charge＝書喰いのスライム）または周囲への泥はね（slam＝泥田の主）を放つ。
  // 住民に削られるだけの的にならず、「予兆を見て離れる→隙に反撃する」の
  // リズムを作る。true を返した間は通常のスライム移動を行わない。
  updateBossSpecial(dt, ctx, target, speed) {
    this.specialCd = Math.max(0, this.specialCd - dt);
    if (!this.bossAct) {
      if (this.specialCd > 0 || !this.onGround) return false;
      const d = this.pos.distanceTo(target.pos);
      const want = this.def.special === "charge" ? d > 2.0 && d < 9 : d < 4.0;
      if (!want) return false;
      this.bossAct = { phase: "windup", t: 0.75, dur: 0.75 };
    }
    const act = this.bossAct;
    act.t -= dt;
    if (act.phase === "windup") {
      // 予兆: その場で赤く点滅しながら大きく膨らむ（見てから離れられる）。
      this.vel.x = 0;
      this.vel.z = 0;
      this.flashT = Math.max(this.flashT, 0.08);
      const swell = 1 + 0.3 * (1 - Math.max(0, act.t) / act.dur);
      this.sprite.mesh.scale.set(this.def.scale * swell, this.def.scale * swell, this.def.scale);
      if (act.t <= 0) {
        this.sprite.mesh.scale.setScalar(this.def.scale);
        if (this.def.special === "charge") {
          // 突進: 狙いを付けた方向へ大きく跳びかかる（当たれば通常の接触攻撃）。
          const dir = new THREE.Vector2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
          if (dir.lengthSq() > 0.01) dir.normalize();
          this.facingDir.copy(dir);
          this.vel.x = dir.x * speed * 3.0;
          this.vel.z = dir.y * speed * 3.0;
          this.vel.y = 5.0;
          this.bossAct = { phase: "charge", t: 0.8, dur: 0.8 };
        } else {
          // 泥はね: 周囲を薙ぎ払う（範囲は膨らみの見た目より少し広い程度）。
          SFX.swing();
          for (const e of [ctx.player, ...ctx.villagers]) {
            if (e.dead || e.down) continue;
            if (this.pos.distanceTo(e.pos) < 3.2) ctx.attackEntity(e, this.def.atk - 1, this.pos);
          }
          this.bossAct = null;
          this.specialCd = 6 + Math.random() * 3;
          return true;
        }
      }
      this.hitWall = false;
      this.vel.y += GRAVITY * dt;
      this.moveWithCollision(ctx.world, dt, this.inWater ? 1.05 : 0);
      return true;
    }
    // 突進中: 勢いを保って跳ぶ（接触ダメージは update() の共通処理が扱う）。
    this.hitWall = false;
    this.vel.y += GRAVITY * dt;
    this.moveWithCollision(ctx.world, dt, this.inWater ? 1.05 : 0);
    const squash = this.onGround ? 1 : 1 + Math.min(0.25, Math.abs(this.vel.y) * 0.02);
    this.sprite.mesh.scale.set(this.def.scale * (2 - squash), this.def.scale * squash, this.def.scale);
    if (act.t <= 0) {
      this.bossAct = null;
      this.specialCd = 6 + Math.random() * 3;
    }
    return true;
  }

  updateBat(dt, ctx, target, speed) {
    const gx = Math.floor(this.pos.x);
    const gz = Math.floor(this.pos.z);
    const cruiseY = ctx.world.groundY(gx, gz) + 1.9 + Math.sin(ctx.time * 2.1 + this.anchor.x) * 0.35;
    let dir;
    if (target) {
      dir = new THREE.Vector2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
      // Dive at the target when close.
      const d = dir.length();
      const targetY = d < 2.2 ? target.pos.y + 0.5 : cruiseY;
      this.vel.y += (targetY - this.pos.y) * 4 * dt - this.vel.y * 2.5 * dt;
      if (d > 0.01) {
        dir.normalize();
        this.vel.x += (dir.x * speed - this.vel.x) * dt * 3;
        this.vel.z += (dir.y * speed - this.vel.z) * dt * 3;
        this.facingDir.copy(dir);
      }
    } else {
      // Circle the anchor.
      const t = ctx.time * 0.7 + this.anchor.z;
      const tx = this.anchor.x + Math.cos(t) * 3;
      const tz = this.anchor.z + Math.sin(t) * 3;
      dir = new THREE.Vector2(tx - this.pos.x, tz - this.pos.z);
      if (dir.lengthSq() > 0.04) {
        dir.normalize();
        this.vel.x += (dir.x * speed * 0.6 - this.vel.x) * dt * 2;
        this.vel.z += (dir.y * speed * 0.6 - this.vel.z) * dt * 2;
        this.facingDir.copy(dir);
      }
      this.vel.y += (cruiseY - this.pos.y) * 3 * dt - this.vel.y * 2 * dt;
    }
    this.hitWall = false;
    this.moveWithCollision(ctx.world, dt, this.inWater ? 1.05 : 0);
    if (this.hitWall) {
      this.stuckTime += dt;
      this.vel.y = Math.max(this.vel.y, 2.2);
    } else {
      this.stuckTime = Math.max(0, this.stuckTime - dt * 2);
    }
  }

  // クラーケン本体／触手: 定位置でしなりながら周期的に叩く。
  // バランス設計: 船へのダメージ源は触手の「かじり」（固定2・3.2秒ごと）のみ。
  // 触手を1本折るごとに船へのダメージが確実に減る＝部位破壊の手応えを作る。
  // 本体は触手が残っているあいだ海中で船を掴んでいるだけで攻撃しない
  //（初版は本体＋触手全員が毎1.7秒フル攻撃で、船HP100が約8秒で全壊し勝負にならなかった）。
  // 浮上後の本体は、汀線沿いの浮上ポイントを潜航して移り歩きながら戦う
  //（据え置きだと張り付いて一方的に殴るだけの戦いになるため）。
  updateRooted(dt, ctx) {
    this.vel.set(0, 0, 0); // 自走しない（潜航移動は updateDive が直接 pos を動かす）

    // 最も近い相手の方を向く（8方向スプライトの向き替え。薙ぎの対象も兼ねる）。
    let mark = null;
    let markD = Infinity;
    for (const e of [ctx.player, ...ctx.villagers]) {
      if (e.dead || e.down) continue;
      const d = this.pos.distanceTo(e.pos);
      if (d < markD) {
        markD = d;
        mark = e;
      }
    }
    if (mark) this.facingDir.set(mark.pos.x - this.pos.x, mark.pos.z - this.pos.z);

    // 鞭のしなり: 根元から先端へ波が伝わるよう、節ごとに位相をずらす。
    if (this.tentacleSegs) {
      const t = ctx.time * 1.7 + this.anchor.x;
      for (let i = 0; i < this.tentacleSegs.length; i += 1) {
        const seg = this.tentacleSegs[i];
        const p = t - i * 0.9;
        seg.rotation.z = Math.sin(p) * (i === 0 ? 0.38 : 0.3);
        seg.rotation.x = Math.cos(p * 0.8) * (i === 0 ? 0.22 : 0.18);
      }
    }

    // 浮上後の本体の潜航移動。潜航中は攻撃しない。
    if (this.updateDive(dt)) return;

    const REACH = 3.2; // 鞭の見た目（全長約5.4）に合わせた薙ぎの間合い

    // 予備動作つきの薙ぎ: 0.5秒かけて体を膨らませてから振り抜く（見てから離脱できる）。
    if (this.windupT > 0) {
      this.windupT -= dt;
      const swell = 1 + 0.25 * (1 - Math.max(0, this.windupT) / 0.5);
      this.sprite.group.scale.setScalar(swell);
      if (this.tentacle) this.tentacle.scale.setScalar(swell);
      if (this.windupT <= 0) {
        this.sprite.group.scale.setScalar(1);
        if (this.tentacle) this.tentacle.scale.setScalar(1);
        if (mark && markD < REACH + 0.4) ctx.attackEntity(mark, this.def.atk, this.pos);
      }
      return;
    }

    if (this.attackCd > 0) return;
    this.attackCd = 3.2;
    if (this.shielded) return; // 無敵中の本体は攻撃しない
    if (mark && markD < REACH) {
      this.windupT = 0.5;
      return;
    }
    // 誰も間合いにいなければ船をかじる（少しずつ）。
    if (ctx.bannerEntity) ctx.attackEntity(ctx.bannerEntity, 2, this.pos);
  }

  // 浮上後のクラーケン本体の潜航移動。true を返している間は行動を止める。
  // 一定時間ごとに潜り、今いる場所以外の浮上ポイントへ移動して再浮上する。
  // 潜航中は combat.hurtMonster が攻撃を無効化する（diving フラグ）。
  updateDive(dt) {
    if (!this.surfacePoints || this.surfacePoints.length < 2 || this.shielded) return false;
    if (!this.diving) {
      if (this.windupT > 0) return false; // 薙ぎの最中は潜らない
      this.diveT -= dt;
      if (this.diveT <= 0) {
        const others = this.surfacePoints.filter(
          (p) => Math.hypot(p.x - this.pos.x, p.z - this.pos.z) > 1.5,
        );
        const target = others[Math.floor(Math.random() * others.length)] ?? this.surfacePoints[0];
        this.diving = { target, phase: "down" };
      }
      return false;
    }
    const dv = this.diving;
    if (dv.phase === "down") {
      this.pos.y -= dt * 2.2;
      if (this.pos.y <= this.surfaceY - 2.2) dv.phase = "move";
    } else if (dv.phase === "move") {
      const dx = dv.target.x - this.pos.x;
      const dz = dv.target.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      const step = dt * 5;
      if (d <= step) {
        this.pos.x = dv.target.x;
        this.pos.z = dv.target.z;
        dv.phase = "up";
      } else {
        this.pos.x += (dx / d) * step;
        this.pos.z += (dz / d) * step;
      }
    } else {
      this.pos.y += dt * 2.2;
      if (this.pos.y >= this.surfaceY) {
        this.pos.y = this.surfaceY;
        this.diving = null;
        this.diveT = 9 + Math.random() * 3;
      }
    }
    return true;
  }

  updateWaterAppearance(world) {
    const submersion = submersionAt(world, this.pos, this.inWater);
    const visualTint = this.flashT > 0 ? 0xff4040 : this.def.tint;
    this.sprite.setVisualTint(visualTint, submersion);
    if (this.tentacle) {
      this._visualBase.setHex(visualTint);
      applySubmersionColor(this.tentacle.material.color, this._visualBase, submersion);
    }
  }

  // 世界停止中（会話・メニュー）の見た目だけの同期。ビルボードをカメラへ向け、
  // 2ポーズの揺らぎだけ続ける。AI・移動・攻撃は動かさない。
  syncVisual(dt, cameraYaw, world) {
    this.sprite.faceWorld(this.facingDir.x, this.facingDir.y, cameraYaw);
    this.sprite.mesh.rotation.y = cameraYaw;
    this.sprite.update(dt);
    this.updateWaterAppearance(world);
    this.hpBar.rotation.y = cameraYaw;
  }

  onHit() {
    this.flashT = 0.15;
  }
}

// --- spawning ---------------------------------------------------------------------

export class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    this.spawnTimer = 3;
  }

  spawn(type, x, y, z, opts = {}) {
    const m = new Monster(type, x, y, z, opts);
    this.monsters.push(m);
    this.scene.add(m.root);
    return m;
  }

  remove(m) {
    this.scene.remove(m.root);
    const i = this.monsters.indexOf(m);
    if (i >= 0) this.monsters.splice(i, 1);
  }

  count(raidOnly = false) {
    return this.monsters.filter((m) => !m.dead && (!raidOnly || m.raid)).length;
  }

  // Ambient spawns in the wild ring away from the settlement.
  updateAmbient(dt, ctx) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = 2.5;
    const cap = ctx.isNight ? 14 : 8;
    const ambient = this.monsters.filter((m) => !m.raid && !m.dead).length;
    if (ambient >= cap) return;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const x = 4 + Math.floor(Math.random() * (WORLD.W - 8));
      const z = 4 + Math.floor(Math.random() * (WORLD.D - 8));
      const distBase = Math.hypot(x - ctx.basePos.x, z - ctx.basePos.z);
      const distPlayer = Math.hypot(x - ctx.player.pos.x, z - ctx.player.pos.z);
      if (distPlayer < 9) continue;
      // 第3章: 夜、北の島と南をへだてる海峡の水面にイカが湧く（海面上に漂う）。
      if (
        ctx.ch3 && ctx.isNight &&
        z >= WORLD.NORTH_D - 14 && z <= WORLD.NORTH_D + 2 &&
        ctx.world.get(x, WORLD.WATER_LEVEL, z) === B.WATER
      ) {
        this.spawn("squid", x + 0.5, WORLD.WATER_LEVEL + 1.2, z + 0.5);
        return;
      }
      if (distBase < 17) continue;
      const y = ctx.world.terrainSurfaceY(x, z); // real ground, not a tree canopy
      if (y <= WORLD.WATER_LEVEL + 1) continue; // no spawning in the sea
      // エリア別スポーン: 南の田の村（z >= NORTH_D+6）は昼=おおねずみ、
      // 夜=どろたぼう。北の島は従来どおりスライム/こうもり。
      let type;
      if (z >= WORLD.NORTH_D + 6) {
        type = ctx.isNight
          ? (Math.random() < 0.65 ? "dorotabo" : "bat")
          : (Math.random() < 0.75 ? "field_rat" : "slime");
      } else {
        type = ctx.isNight && Math.random() < 0.45 ? "bat" : "slime";
      }
      this.spawn(type, x + 0.5, y + (type === "bat" ? 2 : 0.1), z + 0.5);
      return;
    }
  }

  update(dt, ctx) {
    for (const m of [...this.monsters]) {
      m.update(dt, ctx);
      if (m.dead && m.deathT > 0.4) this.remove(m);
      // Despawn far-away ambient monsters (day bats burn off at dawn).
      if (!m.dead && !m.raid) {
        const far = Math.hypot(m.pos.x - ctx.player.pos.x, m.pos.z - ctx.player.pos.z) > 42;
        const dayBurn = (m.type === "bat" || m.type === "squid") && !ctx.isNight && Math.random() < dt * 0.15;
        if (far || dayBurn) this.remove(m);
      }
    }
  }
}
