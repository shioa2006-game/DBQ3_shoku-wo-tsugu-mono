import * as THREE from "three";
import { Entity, GRAVITY } from "./entity.js";
import { MonsterSprite, submersionAt } from "./rig.js";
import { B } from "../world/blocks.js";
import { WORLD, PLACES } from "../world/world.js";

const WISP_A = new URL("../../assets/nonhumanoids/will_o_wisp_code_idle_a_8dir.png", import.meta.url).href;
const WISP_B = new URL("../../assets/nonhumanoids/will_o_wisp_code_idle_b_8dir.png", import.meta.url).href;
const SCORPION_A = new URL("../../assets/nonhumanoids/armored_scorpion_code_idle_a_8dir.png", import.meta.url).href;
const SCORPION_B = new URL("../../assets/nonhumanoids/armored_scorpion_code_idle_b_8dir.png", import.meta.url).href;
const LIZARD_A = new URL("../../assets/nonhumanoids/volcano_lizard_code_idle_a_8dir.png", import.meta.url).href;
const LIZARD_B = new URL("../../assets/nonhumanoids/volcano_lizard_code_idle_b_8dir.png", import.meta.url).href;
const BAT_A = new URL("../../assets/nonhumanoids/night_bat_code_idle_a_8dir.png", import.meta.url).href;
const BAT_B = new URL("../../assets/nonhumanoids/night_bat_code_idle_b_8dir.png", import.meta.url).href;
const DORO_A = new URL("../../assets/nonhumanoids/dorotabo_code_idle_a_8dir.png", import.meta.url).href;
const DORO_B = new URL("../../assets/nonhumanoids/dorotabo_code_idle_b_8dir.png", import.meta.url).href;

// 第4章のモンスター。画像はすべて Storybook Character Studio でコードから描いたもの（docs/CHARACTER_ART.md）。
// 新規画像は鬼火・鉄甲サソリ・火山トカゲの3種。既存色替えは
// 火喰いこうもり（night_bat の tint）と灰どろたぼう（dorotabo の tint）の2種に固定する。
// 章ボス「炉喰らいの大鬼火」は鬼火画像の拡大・色替え（専用画像は持たない）。
export const MONSTER_TYPES = {
  will_o_wisp: {
    // 浮遊して炉と灯りに寄る妖火。坑道灯の素材「鬼火のかけら」を落とす。
    name: "鬼火",
    sheets: [WISP_A, WISP_B],
    hp: 6, atk: 2, scale: 0.85, flying: true, aggro: 8, speed: 3.0,
    drops: [["wisp_ember", 1, 2]],
    tint: 0xffffff,
  },
  iron_scorpion: {
    // 正面が硬い坑道の耐久敵。回り込んで叩く。
    name: "鉄甲サソリ",
    sheets: [SCORPION_A, SCORPION_B],
    hp: 18, atk: 3, scale: 1.05, flying: false, aggro: 7, speed: 2.2,
    drops: [["iron_ore", 0, 1], ["hide", 0, 1]],
    tint: 0xffffff,
    armored: true, // 正面からの攻撃を通しにくい
  },
  lava_lizard: {
    // 溶岩帯の高速敵。灰の中の穀物をあさっているのか、まれに種を落とす
    //（0〜1個=50%。鉄甲サソリの鉄鉱石と同じ確率）。
    name: "火山トカゲ",
    sheets: [LIZARD_A, LIZARD_B],
    hp: 8, atk: 3, scale: 0.95, flying: false, aggro: 9, speed: 4.0,
    drops: [["hide", 1, 1], ["volcano_grain_seed", 0, 1]],
    tint: 0xffffff,
  },
  fire_bat: {
    // 火喰いこうもり: 既存こうもりの色替え。夜、噴気孔のまわりを飛ぶ。
    name: "火喰いこうもり",
    sheets: [BAT_A, BAT_B],
    hp: 6, atk: 2, scale: 0.85, flying: true, aggro: 8, speed: 3.0,
    drops: [["wing", 1, 2]],
    tint: 0xff9a66,
  },
  ash_dorotabo: {
    // 灰どろたぼう: 既存どろたぼうの色替え。夜、灰の積もる低地から湧く。
    name: "灰どろたぼう",
    sheets: [DORO_A, DORO_B],
    hp: 16, atk: 4, scale: 1.15, flying: false, aggro: 6, speed: 1.9,
    drops: [["clay", 1, 2]],
    tint: 0x98a8c0, // Studioのどろたぼう（明るい茶）を灰色寄りにする
  },
  // --- 第5章: 瘴気に染まった竹林の敵（既存画像の紫灰色 tint） -----------------------
  taint_wisp: {
    name: "瘴気の鬼火",
    sheets: [WISP_A, WISP_B],
    hp: 8, atk: 3, scale: 0.9, flying: true, aggro: 9, speed: 3.2,
    drops: [["wisp_ember", 1, 2], ["herb", 0, 1]],
    tint: 0xb08ad0,
  },
  taint_bat: {
    name: "瘴気こうもり",
    sheets: [BAT_A, BAT_B],
    hp: 8, atk: 3, scale: 0.9, flying: true, aggro: 9, speed: 3.2,
    drops: [["wing", 1, 2]],
    tint: 0x9a7ab8,
  },
  taint_dorotabo: {
    name: "瘴気どろたぼう",
    sheets: [DORO_A, DORO_B],
    hp: 20, atk: 5, scale: 1.2, flying: false, aggro: 7, speed: 2.0,
    drops: [["clay", 1, 2], ["herb", 0, 1]],
    tint: 0x7a6ac8, // 茶色の上でも紫が残るよう青を強める
  },
  great_will_o_wisp: {
    // 章ボス: 炉喰らいの大鬼火。鬼火画像の拡大・色替えで、黒い爪痕を帯びる。
    name: "炉喰らいの大鬼火",
    sheets: [WISP_A, WISP_B],
    hp: 80, atk: 5, scale: 2.6, flying: true, aggro: 40, speed: 2.4,
    drops: [["wisp_ember", 6, 10], ["iron", 2, 3]],
    tint: 0xff6a3a,
    boss: true,
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

    this.moveTimer = Math.random() * 2;
    this.attackCd = 0;
    this.stuckTime = 0;
    this.facingDir = new THREE.Vector2(0, 1);
    this.deathT = 0;
    this.flashT = 0;
    this.spikeCd = 0;
  }

  chooseTarget(ctx) {
    if (this.raid) {
      // Raiders head for the defense target, but peel off onto nearby defenders.
      let best = null;
      let bestD = 5.0;
      for (const e of [ctx.player, ...ctx.villagers]) {
        if (e.dead || e.down) continue;
        const d = this.pos.distanceTo(e.pos);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      if (best) return { entity: best, pos: best.pos };
      // Otherwise gnaw on the target itself.
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
      this.root.position.copy(this.pos);
      return;
    }
    this.invuln = Math.max(0, this.invuln - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    this.spikeCd = Math.max(0, this.spikeCd - dt);
    const target = this.chooseTarget(ctx);
    const speed = this.def.speed;

    if (this.def.flying) {
      this.updateFlyer(dt, ctx, target, speed);
    } else {
      this.updateWalker(dt, ctx, target, speed);
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
    this.sprite.group.visible = this.invuln <= 0.3 || Math.floor(this.invuln * 16) % 2 === 0;
  }

  updateWalker(dt, ctx, target, speed) {
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

  updateFlyer(dt, ctx, target, speed) {
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

  // 世界停止中（会話・メニュー）の見た目だけの同期。ビルボードをカメラへ向け、
  // 2ポーズの揺らぎだけ続ける。AI・移動・攻撃は動かさない。
  updateWaterAppearance(world) {
    const submersion = submersionAt(world, this.pos, this.inWater);
    const visualTint = this.flashT > 0 ? 0xff4040 : this.def.tint;
    this.sprite.setVisualTint(visualTint, submersion);
  }

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
  // 第4章中（passOpen=false）は峠より南（竹林側）には一切湧かせない。
  updateAmbient(dt, ctx) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = 2.5;
    const cap = ctx.isNight ? 14 : 8;
    const ambient = this.monsters.filter((m) => !m.raid && !m.dead).length;
    if (ambient >= cap) return;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const x = 4 + Math.floor(Math.random() * (WORLD.W - 8));
      const zMax = ctx.passOpen ? WORLD.D - 8 : WORLD.PASS_Z0 - 4;
      const z = 4 + Math.floor(Math.random() * (zMax - 4));
      const distBase = Math.hypot(x - ctx.basePos.x, z - ctx.basePos.z);
      const distPlayer = Math.hypot(x - ctx.player.pos.x, z - ctx.player.pos.z);
      if (distPlayer < 9) continue;
      if (distBase < 15) continue;
      const y = ctx.world.terrainSurfaceY(x, z); // real ground, not a tree canopy
      if (y <= WORLD.WATER_LEVEL + 1) continue; // no spawning in the sea
      // エリア別スポーン:
      // - 竹林側（z>峠。開通後のみ）: 瘴気に染まった敵。泉を清めた後は湧かない。
      // - 火山斜面（z>=31）: 昼は火山トカゲと鉄甲サソリ。鬼火は昼夜を問わず漂う。
      // - 海岸・町の外れ（z<31）: 昼は火山トカゲ、夜は灰どろたぼうと火喰いこうもり。
      let type;
      if (z > WORLD.PASS_Z1) {
        if (ctx.springPurified) continue; // 浄化後の竹林は安らかな土地になる
        const r = Math.random();
        type = r < 0.4 ? "taint_wisp" : r < 0.7 ? "taint_bat" : "taint_dorotabo";
      } else if (z >= 31) {
        if (Math.random() < 0.35) type = "will_o_wisp";
        else if (ctx.isNight) type = Math.random() < 0.5 ? "fire_bat" : "iron_scorpion";
        else type = Math.random() < 0.6 ? "lava_lizard" : "iron_scorpion";
      } else {
        type = ctx.isNight
          ? (Math.random() < 0.6 ? "ash_dorotabo" : "fire_bat")
          : (Math.random() < 0.75 ? "lava_lizard" : "will_o_wisp");
      }
      const flying = MONSTER_TYPES[type].flying;
      this.spawn(type, x + 0.5, y + (flying ? 2 : 0.1), z + 0.5);
      return;
    }
  }

  update(dt, ctx) {
    for (const m of [...this.monsters]) {
      m.update(dt, ctx);
      if (m.dead && m.deathT > 0.4) this.remove(m);
      // Despawn far-away ambient monsters (day bats burn off at dawn).
      // persist 付き（穢れ石の番の魔物など、位置に意味のある敵）は消さない。
      if (!m.dead && !m.raid && !m.persist) {
        const far = Math.hypot(m.pos.x - ctx.player.pos.x, m.pos.z - ctx.player.pos.z) > 42;
        const dayBurn = m.type === "fire_bat" && !ctx.isNight && Math.random() < dt * 0.15;
        if (far || dayBurn) this.remove(m);
      }
    }
  }
}

// 防衛戦などでボスの湧き位置調整に使う町の中心（defense.js から参照）。
export const TOWN_CENTER = PLACES.town;
