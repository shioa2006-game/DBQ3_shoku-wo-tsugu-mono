import * as THREE from "three";
import { Entity, GRAVITY } from "./entity.js";
import { MonsterSprite, submersionAt } from "./rig.js";
import { B, BLOCK_DEFS } from "../world/blocks.js";
import { WORLD, PLACES, CAVE_SPAWNS, inCave } from "../world/world.js";
import { MONSTER_TYPES } from "./monster-types.js";

export { MONSTER_TYPES };

// ダーマ再興編のモンスター。画像はすべて Storybook Character Studio でコードから描いたもの
// （docs/CHARACTER_ART.md）。種類と数値は monster-types.js、行動はここ（docs/DESIGN.md の「6. 敵」）。
//
// def.ai:
//   (なし)    跳ねて近づく（山ねずみ）／飛んで近づく（洞窟こうもり）
//   "charge"  岩角ヤギ: 足を踏み鳴らしてから、まっすぐ突進。かわされると隙ができる
//   "guard"   小岩ガニ: 近づくとハサミを上げて構え、正面からの攻撃を通しにくい
//   "slam"    大岩ガニ: 爪を振り上げてから前へ振り下ろす。その後しばらく向きを変えない
//   "gargoyle" 海から飛来 → 着地 → 道順に沿って祭壇へ進軍（門・防壁をかじる）
//   "crusher" 岩砕きのガーゴイル: 門・防壁・神殿の壁の前で振りかぶり、砕く

const FLYIN_SPEED = 9;

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
    // 状態ごとの絵（地上／飛行／攻撃）。1つしか無い敵は main だけ。
    this.sprites = {};
    this.root = new THREE.Group();
    for (const [name, urls] of Object.entries(def.sheets)) {
      const sprite = new MonsterSprite({
        sheetAUrl: urls[0],
        sheetBUrl: urls[1],
        scale: def.scale,
        tint: def.tint,
        yOffset: def.flying || name === "flight" ? 0.4 : 0,
      });
      sprite.group.visible = false;
      this.root.add(sprite.group);
      this.sprites[name] = sprite;
    }
    this.sprite = null;
    this.setSprite("main");
    this.root.position.copy(this.pos);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.3 * def.scale, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.root.add(this.shadow);

    // Tiny HP bar (hidden until damaged).
    this.hpBar = new THREE.Group();
    const bgW = 0.72 * def.scale;
    const fgW = 0.68 * def.scale;
    const bgGeom = new THREE.PlaneGeometry(bgW, 0.09);
    bgGeom.translate(bgW / 2, 0, 0);
    const fgGeom = new THREE.PlaneGeometry(fgW, 0.06);
    fgGeom.translate(fgW / 2, 0, 0);
    const bg = new THREE.Mesh(bgGeom, new THREE.MeshBasicMaterial({ color: 0x201810, depthWrite: false, side: THREE.DoubleSide }));
    const fg = new THREE.Mesh(fgGeom, new THREE.MeshBasicMaterial({ color: 0xe0503a, depthWrite: false, side: THREE.DoubleSide }));
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
    // 行動の状態（ai ごと）。
    this.state = "idle";
    this.stateT = 0;
    this.actionCd = 1 + Math.random();
    this.holdPose = null; // "a" | "b" | null（null は2枚を交互に）
    this.armoredNow = false; // いま正面が硬いか（小岩ガニの構え・大岩ガニ）
    this.untargetable = false; // 飛来中は攻撃が届かない
    this.dormant = false; // 積み石のふりをしている大岩ガニ
    this.routeIndex = 0;
    this.routeOffsetX = 0; // 岩砕きは入口ではなく壁へ向かう（道順の最後を左右へずらす）
    if (def.ai === "slam") this.armoredNow = true;
  }

  setSprite(name) {
    const next = this.sprites[name] ?? this.sprites.main;
    if (this.sprite === next) return;
    if (this.sprite) this.sprite.group.visible = false;
    this.sprite = next;
    this.sprite.group.visible = true;
  }

  // 2枚の絵の片方を保つ（予告の姿勢）。null で交互へ戻す。
  setPose(pose) {
    this.holdPose = pose;
    if (!pose) return;
    const s = this.sprite;
    s.usingA = pose === "a";
    s.material.map = s.usingA ? s.texA : s.texB;
  }

  enter(state, t = 0) {
    this.state = state;
    this.stateT = t;
  }

  // 飛来を始める（防衛戦の湧き）。to = 着地する場所。
  startFlyIn(to) {
    this.flyTo = new THREE.Vector3(to.x, to.y, to.z);
    this.untargetable = true;
    this.setSprite("flight");
    this.enter("flyin");
  }

  // 積み石のふりをやめて動き出す（大岩ガニ）。
  awaken() {
    this.dormant = false;
    this.untargetable = false;
    this.enter("idle");
    this.actionCd = 1.2;
  }

  chooseTarget(ctx) {
    if (this.raid) {
      // Raiders head for the defense target, but peel off onto nearby defenders.
      let best = null;
      let bestD = this.def.ai === "crusher" ? 2.2 : 4.2;
      // 相手にするのは、プレイヤーと戦える住民だけ（本堂へ避難した住民は狙わず、祭壇の灯へ向かう）。
      for (const e of [ctx.player, ...ctx.villagers]) {
        if (e.dead || e.down) continue;
        if (e !== ctx.player && !e.def?.fighter) continue;
        const d = this.pos.distanceTo(e.pos);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      if (best) return { entity: best, pos: best.pos, chase: true };
      return { entity: ctx.bannerEntity, pos: ctx.bannerEntity.pos };
    }
    const d = this.pos.distanceTo(ctx.player.pos);
    const aggro = this.def.aggro * (ctx.isNight ? 1.3 : 1);
    if (!ctx.player.dead && d < aggro && Math.abs(ctx.player.pos.y - this.pos.y) < 6) {
      return { entity: ctx.player, pos: ctx.player.pos, chase: true };
    }
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
    this.actionCd = Math.max(0, this.actionCd - dt);
    this.stateT += dt;

    if (this.dormant) {
      this.visualSync(dt, ctx);
      return;
    }
    if (this.state === "flyin") {
      this.updateFlyIn(dt, ctx);
      this.visualSync(dt, ctx);
      return;
    }

    const target = this.chooseTarget(ctx);
    let contact = true; // 触れたら攻撃するか（予告・隙の間は切る）
    switch (this.def.ai) {
      case "charge":
        contact = this.updateCharger(dt, ctx, target);
        break;
      case "guard":
        this.updateGuard(dt, ctx, target);
        break;
      case "slam":
        contact = this.updateSlammer(dt, ctx, target);
        break;
      case "gargoyle":
      case "crusher":
        contact = this.updateRaider(dt, ctx, target);
        break;
      default:
        if (this.def.flying) this.updateFlyer(dt, ctx, target, this.def.speed);
        else this.updateWalker(dt, ctx, target, this.def.speed);
        this.gnawWhenStuck(ctx);
        break;
    }

    // Spike traps.
    const sx = Math.floor(this.pos.x);
    const sy = Math.floor(this.pos.y + 0.1);
    const sz = Math.floor(this.pos.z);
    if (ctx.world.get(sx, sy, sz) === B.SPIKES && this.spikeCd <= 0) {
      // 門の前で列になって踏み続けると強すぎるので、同じ敵には間を空けて効かせる。
      this.spikeCd = 2.0;
      ctx.hurtMonster(this, 3, null);
      ctx.onSpike?.(sx, sy, sz);
    }

    // Contact attack.
    if (contact && target?.entity && this.attackCd <= 0) {
      const e = target.entity;
      const d = this.pos.distanceTo(e.pos);
      const reach = this.halfW + e.halfW + (e.isBanner ? 0.9 : 0.35);
      if (d < reach && Math.abs(this.pos.y - e.pos.y) < 1.6) {
        this.attackCd = 1.1;
        ctx.attackEntity(e, this.def.atk, this.pos);
      }
    }

    this.visualSync(dt, ctx);
  }

  visualSync(dt, ctx) {
    this.root.position.copy(this.pos);
    this.sprite.faceWorld(this.facingDir.x, this.facingDir.y, ctx.cameraYaw);
    this.sprite.mesh.rotation.y = ctx.cameraYaw;
    if (!this.holdPose && !this.dormant) this.sprite.update(dt);
    this.updateWaterAppearance(ctx.world);
    const gy = ctx.world.groundYBelow(this.pos.x, this.pos.z, this.pos.y + 0.1);
    this.shadow.position.y = gy - this.pos.y + 0.02;
    this.hpBar.visible = this.hp < this.maxHp && !this.untargetable;
    this.hpBar.rotation.y = ctx.cameraYaw;
    this.hpBarFg.scale.x = Math.max(0, this.hp / this.maxHp);
    this.sprite.group.visible = this.invuln <= 0.3 || Math.floor(this.invuln * 16) % 2 === 0;
  }

  // --- 跳ねて進む敵（山ねずみ） ---------------------------------------------------------

  updateWalker(dt, ctx, target, speed) {
    this.vel.y += GRAVITY * dt;
    if (this.onGround) {
      this.vel.x *= Math.max(0, 1 - dt * 6);
      this.vel.z *= Math.max(0, 1 - dt * 6);
    }
    this.moveTimer -= dt;
    if (this.onGround && this.moveTimer <= 0) {
      let dir = null;
      if (target) {
        dir = new THREE.Vector2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
        this.moveTimer = 0.55 + Math.random() * 0.3;
      } else {
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
        this.vel.y = 6.4;
      }
    }
    this.moveBody(ctx, dt);
    const squash = this.onGround ? 1 : 1 + Math.min(0.25, Math.abs(this.vel.y) * 0.02);
    this.sprite.mesh.scale.set(this.def.scale * (2 - squash), this.def.scale * squash, this.def.scale);
  }

  // --- 歩いて進む敵（ヤギ・カニ・ガーゴイル）。段差1マスは跳んで越える。 ----------------------

  walkToward(dt, ctx, pos, speed) {
    this.vel.y += GRAVITY * dt;
    let moving = false;
    if (pos) {
      const dx = pos.x - this.pos.x;
      const dz = pos.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.25) {
        this.facingDir.set(dx / d, dz / d);
        this.vel.x += ((dx / d) * speed - this.vel.x) * Math.min(1, dt * 8);
        this.vel.z += ((dz / d) * speed - this.vel.z) * Math.min(1, dt * 8);
        moving = true;
      }
    }
    if (!moving) {
      this.vel.x *= Math.max(0, 1 - dt * 8);
      this.vel.z *= Math.max(0, 1 - dt * 8);
    }
    this.moveBody(ctx, dt);
    // 1段の段差を越える。7.0 だと頂点が約1.1マスで、1フレームが長い（dt=0.05）と届かず、
    // 山道の段で足止めになる。余裕を持たせる。
    if (this.hitWall && this.onGround && moving) this.vel.y = 8.0;
    return moving;
  }

  wander(dt, ctx, speed) {
    this.moveTimer -= dt;
    if (this.moveTimer <= 0) {
      this.moveTimer = 2 + Math.random() * 3;
      const back = this.anchor.distanceTo(this.pos) > 6;
      const a = Math.random() * Math.PI * 2;
      this.wanderTo = back || Math.random() < 0.6
        ? { x: this.anchor.x + Math.cos(a) * 3, z: this.anchor.z + Math.sin(a) * 3 }
        : null;
    }
    this.walkToward(dt, ctx, this.wanderTo, speed * 0.5);
  }

  moveBody(ctx, dt) {
    this.hitWall = false;
    this.moveWithCollision(ctx.world, dt, this.inWater ? 1.05 : 0);
    if (this.hitWall) this.stuckTime += dt;
    else this.stuckTime = Math.max(0, this.stuckTime - dt * 2);
  }

  // 目の前の、魔物が壊せるブロック（門・柵・防壁）。siege=true なら神殿の壁なども含む。
  blockAhead(ctx, siege) {
    const fx = Math.floor(this.pos.x + this.facingDir.x * (this.halfW + 0.6));
    const fz = Math.floor(this.pos.z + this.facingDir.y * (this.halfW + 0.6));
    for (let dy = 0; dy <= 1; dy += 1) {
      const y = Math.floor(this.pos.y + 0.1) + dy;
      const def = BLOCK_DEFS[ctx.world.get(fx, y, fz)];
      if (def?.raidTarget || (siege && def?.siegeHp)) return { x: fx, y, z: fz };
    }
    return null;
  }

  // 防衛戦の魔物は、門・柵・防壁に引っかかったらかじって壊す。
  gnawWhenStuck(ctx) {
    if (!this.raid || this.stuckTime <= 1.0) return;
    const cell = this.blockAhead(ctx, false);
    if (cell) {
      ctx.damageBlock(cell.x, cell.y, cell.z, 2);
      this.stuckTime = 0;
    } else if (this.stuckTime > 2.4) {
      this.facingDir.rotateAround(new THREE.Vector2(), (Math.random() - 0.5) * 2);
      this.stuckTime = 0;
    }
  }

  // --- 岩角ヤギ: 踏み鳴らし → 突進 → 隙 ---------------------------------------------------

  updateCharger(dt, ctx, target) {
    const c = this.def.charge;
    if (this.state === "windup") {
      // 頭を下げて踏ん張る（姿勢B）。小刻みに揺らして予告する。
      this.walkToward(dt, ctx, null, 0);
      this.sprite.mesh.position.x = Math.sin(this.stateT * 40) * 0.03;
      if (target) this.facingDir.set(target.pos.x - this.pos.x, target.pos.z - this.pos.z).normalize();
      if (this.stateT >= c.windup) {
        this.sprite.mesh.position.x = 0;
        this.chargeDir = this.facingDir.clone();
        this.chargeHit = false;
        this.enter("dash");
      }
      return false;
    }
    if (this.state === "dash") {
      this.vel.y += GRAVITY * dt;
      this.vel.x = this.chargeDir.x * c.speed;
      this.vel.z = this.chargeDir.y * c.speed;
      this.moveBody(ctx, dt);
      if (!this.chargeHit && target?.entity && !target.entity.isBanner) {
        const e = target.entity;
        if (this.pos.distanceTo(e.pos) < this.halfW + e.halfW + 0.45) {
          this.chargeHit = true;
          ctx.attackEntity(e, c.damage, this.pos);
        }
      }
      if (this.stateT >= c.dash || this.hitWall) {
        this.setPose(null);
        this.enter("recover");
      }
      return false;
    }
    if (this.state === "recover") {
      // かわされた後の隙。動かず、反撃を受けやすい。
      this.walkToward(dt, ctx, null, 0);
      if (this.stateT >= c.recover) {
        this.actionCd = c.cooldown;
        this.enter("idle");
      }
      return false;
    }
    if (target?.chase) {
      const d = this.pos.distanceTo(target.pos);
      if (d < c.range && this.actionCd <= 0 && this.onGround) {
        this.setPose("b");
        this.enter("windup");
        return false;
      }
      this.walkToward(dt, ctx, target.pos, this.def.speed);
    } else {
      this.wander(dt, ctx, this.def.speed);
    }
    return true;
  }

  // --- 小岩ガニ: 近づくとハサミを上げて構える（正面が硬い） -----------------------------------

  updateGuard(dt, ctx, target) {
    const near = target?.chase && this.pos.distanceTo(target.pos) < 3.4;
    if (near !== this.armoredNow) {
      this.armoredNow = near;
      this.setPose(near ? "b" : null);
    }
    if (target?.chase) this.walkToward(dt, ctx, target.pos, this.def.speed * (near ? 0.75 : 1));
    else this.wander(dt, ctx, this.def.speed);
  }

  // --- 大岩ガニ: 爪を振り上げる → 前へ振り下ろす → 隙（向きを変えない） -----------------------

  updateSlammer(dt, ctx, target) {
    const s = this.def.slam;
    if (this.state === "windup") {
      this.walkToward(dt, ctx, null, 0);
      this.sprite.mesh.position.y = 0.5 * this.def.scale + Math.sin(this.stateT * 9) * 0.05 + this.stateT * 0.18;
      if (this.stateT >= s.windup) {
        this.sprite.mesh.position.y = 0.5 * this.def.scale;
        this.slamNow(ctx);
        this.setPose("a");
        this.enter("recover");
      }
      return false;
    }
    if (this.state === "recover") {
      this.walkToward(dt, ctx, null, 0);
      if (this.stateT >= s.recover) {
        this.setPose(null);
        this.actionCd = s.cooldown;
        this.enter("idle");
      }
      return false;
    }
    if (!target) {
      this.wander(dt, ctx, this.def.speed);
      return true;
    }
    const d = Math.hypot(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
    if (d < s.range * 0.8 && this.actionCd <= 0 && this.onGround) {
      this.facingDir.set(target.pos.x - this.pos.x, target.pos.z - this.pos.z).normalize();
      this.setPose("b");
      this.enter("windup");
      ctx.onBossTelegraph?.(this);
      return false;
    }
    this.walkToward(dt, ctx, d > 1.6 ? target.pos : null, this.def.speed);
    return true;
  }

  // 振り下ろし: 正面の扇形にいる相手へダメージ。
  slamNow(ctx) {
    const s = this.def.slam;
    for (const e of [ctx.player, ...ctx.villagers]) {
      if (e.dead || e.down) continue;
      const dx = e.pos.x - this.pos.x;
      const dz = e.pos.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > s.range || Math.abs(e.pos.y - this.pos.y) > 2) continue;
      const dot = d < 0.01 ? 1 : (dx * this.facingDir.x + dz * this.facingDir.y) / d;
      if (dot > Math.cos(s.halfAngle)) ctx.attackEntity(e, s.damage, this.pos);
    }
    ctx.onSlam?.(this);
  }

  // --- ガーゴイル: 飛来 → 着地 ------------------------------------------------------------

  updateFlyIn(dt, ctx) {
    const to = this.flyTo;
    const dx = to.x - this.pos.x;
    const dz = to.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.3) {
      this.facingDir.set(dx / d, dz / d);
      const step = Math.min(d, FLYIN_SPEED * dt);
      this.pos.x += (dx / d) * step;
      this.pos.z += (dz / d) * step;
      // 遠くは高く、近づくにつれて降りる。
      const wantY = to.y + Math.min(12, d * 0.55) + Math.sin(ctx.time * 3 + this.anchor.x) * 0.3;
      this.pos.y += (wantY - this.pos.y) * Math.min(1, dt * 3);
    } else {
      this.pos.y -= 5 * dt;
      if (this.pos.y <= to.y + 0.05) {
        this.pos.y = to.y + 0.05;
        this.vel.set(0, 0, 0);
        this.untargetable = false;
        this.setSprite("main");
        this.enter("march");
        this.actionCd = 0.6; // 着地の間（翼を畳む）
        ctx.onLanded?.(this);
      }
    }
  }

  // --- ガーゴイル／岩砕き: 道順に沿って進軍 --------------------------------------------------

  routePoint(ctx) {
    const route = ctx.route ?? [];
    while (this.routeIndex < route.length) {
      const p = route[this.routeIndex];
      const last = this.routeIndex >= route.length - 2;
      const px = p.x + (last ? this.routeOffsetX : 0);
      if (Math.hypot(px - this.pos.x, p.z - this.pos.z) > 1.4) return { x: px, z: p.z };
      this.routeIndex += 1;
    }
    return null;
  }

  updateRaider(dt, ctx, target) {
    const crusher = this.def.ai === "crusher";
    if (this.state === "windup") {
      // 岩砕き: 両腕を振りかぶる（攻撃の絵A）。この間に攻撃を当てられると止まる。
      this.walkToward(dt, ctx, null, 0);
      if (this.stateT >= this.def.smash.windup) {
        this.setPose("b");
        const cell = this.smashCell;
        if (cell) {
          ctx.damageBlock(cell.x, cell.y, cell.z, this.def.smash.damage, true);
          ctx.damageBlock(cell.x, cell.y + 1, cell.z, this.def.smash.damage, true);
        }
        ctx.onSmash?.(this);
        this.enter("smash");
      }
      return false;
    }
    if (this.state === "smash") {
      this.walkToward(dt, ctx, null, 0);
      if (this.stateT >= 0.45) {
        this.setPose(null);
        this.setSprite("main");
        this.actionCd = 0.5;
        this.enter("march");
      }
      return false;
    }
    if (this.state === "stagger") {
      this.walkToward(dt, ctx, null, 0);
      if (this.stateT >= 0.9) this.enter("march");
      return false;
    }
    if (this.actionCd > 0 && this.state === "march" && this.stateT < 0.6) {
      this.walkToward(dt, ctx, null, 0); // 着地直後
      return false;
    }
    // 近くの守り手へ向かうか、道順に沿って祭壇へ。
    const dest = target?.chase ? target.pos : this.routePoint(ctx) ?? target?.pos ?? null;
    this.walkToward(dt, ctx, dest, this.def.speed);
    this.siegeT = Math.max(0, (this.siegeT ?? 0) - dt);
    if (this.stuckTime > 0.5) {
      const cell = this.blockAhead(ctx, crusher);
      if (cell) this.siegeT = 1.6; // 門・防壁・壁を壊している最中
      if (cell && crusher && this.actionCd <= 0) {
        this.smashCell = cell;
        this.setSprite("attack");
        this.setPose("a");
        this.stuckTime = 0;
        this.enter("windup");
        return false;
      }
      if (cell && !crusher && this.stuckTime > 1.0) {
        ctx.damageBlock(cell.x, cell.y, cell.z, 3);
        this.stuckTime = 0;
      } else if (!cell && this.stuckTime > 2.4) {
        this.facingDir.rotateAround(new THREE.Vector2(), (Math.random() - 0.5) * 2);
        this.vel.x = this.facingDir.x * this.def.speed;
        this.vel.z = this.facingDir.y * this.def.speed;
        this.stuckTime = 0;
      }
    }
    this.trackProgress(dt, ctx, dest, target);
    return true;
  }

  // 進めなくなった者（道の脇の土手へ落ちた、谷へ誘い込まれた、物に引っかかった）は、
  // 飛び上がって踊り場へ降り直す。1体が動けないまま波が終わらなくなるのを防ぐ。
  // 壊している最中・相手に届いている間は数えない。
  trackProgress(dt, ctx, dest, target) {
    const e = target?.entity;
    const reach = e ? this.halfW + e.halfW + (e.isBanner ? 0.9 : 0.35) + 0.6 : 0;
    const engaged = e && Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < reach && Math.abs(e.pos.y - this.pos.y) < 2.5;
    const key = dest ? `${Math.round(dest.x)},${Math.round(dest.z)}` : "";
    if (!dest || engaged || this.siegeT > 0 || this.progressKey !== key) {
      this.progressKey = key;
      this.progressBest = Infinity;
      this.lostT = 0;
      return;
    }
    const d = Math.hypot(dest.x - this.pos.x, dest.z - this.pos.z);
    if (d < this.progressBest - 0.4) {
      this.progressBest = d;
      this.lostT = 0;
      return;
    }
    this.lostT += dt;
    if (this.lostT > 7) {
      this.lostT = 0;
      this.progressBest = Infinity;
      ctx.onRaiderLost?.(this);
    }
  }

  // --- 飛ぶ敵（洞窟こうもり） --------------------------------------------------------------

  updateFlyer(dt, ctx, target, speed) {
    // 洞窟や屋根の下でも天井へ上がらないよう、足もとの床から高さを取る。
    const floorY = ctx.world.groundYBelow(this.pos.x, this.pos.z, this.pos.y + 0.5);
    const cruiseY = floorY + 1.7 + Math.sin(ctx.time * 2.1 + this.anchor.x) * 0.3;
    let dir;
    if (target) {
      dir = new THREE.Vector2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
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
      const t = ctx.time * 0.7 + this.anchor.z;
      const tx = this.anchor.x + Math.cos(t) * 1.6;
      const tz = this.anchor.z + Math.sin(t) * 1.6;
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
    if (this.hitWall) this.stuckTime += dt;
    else this.stuckTime = Math.max(0, this.stuckTime - dt * 2);
  }

  updateWaterAppearance(world) {
    const submersion = submersionAt(world, this.pos, this.inWater);
    const base = this.dormant ? 0xb8b0a0 : this.def.tint;
    const visualTint = this.flashT > 0 ? 0xff4040 : base;
    this.sprite.setVisualTint(visualTint, submersion);
  }

  // 世界停止中（会話・メニュー）の見た目だけの同期。AI・移動・攻撃は動かさない。
  syncVisual(dt, cameraYaw, world) {
    this.sprite.faceWorld(this.facingDir.x, this.facingDir.y, cameraYaw);
    this.sprite.mesh.rotation.y = cameraYaw;
    if (!this.holdPose && !this.dormant) this.sprite.update(dt);
    this.updateWaterAppearance(world);
    this.hpBar.rotation.y = cameraYaw;
  }

  onHit() {
    this.flashT = 0.15;
    // 岩砕きは、振りかぶりの間に攻撃を受けると止まる。
    if (this.def.ai === "crusher" && this.state === "windup") {
      this.setPose(null);
      this.setSprite("main");
      this.enter("stagger");
      this.actionCd = 1.2;
    }
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
    if (m.root) this.scene.remove(m.root);
    const i = this.monsters.indexOf(m);
    if (i >= 0) this.monsters.splice(i, 1);
  }

  count(raidOnly = false) {
    return this.monsters.filter((m) => !m.dead && (!raidOnly || m.raid)).length;
  }

  // 通常の敵の出現。洞窟の中は小岩ガニと洞窟こうもり、山道と森は岩角ヤギと山ねずみ。
  // 神殿の台地と集落には湧かせない。
  updateAmbient(dt, ctx) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = 2.5;
    const p = ctx.player.pos;
    const ambient = this.monsters.filter((m) => !m.raid && !m.dead && !m.persist);
    if (inCave(p.x, p.y, p.z)) {
      if (ambient.filter((m) => inCave(m.pos.x, m.pos.y, m.pos.z)).length >= 4) return;
      const spots = CAVE_SPAWNS.filter((s) => {
        const d = Math.hypot(s.x - p.x, s.z - p.z);
        return d > 6 && d < 22 && !this.monsters.some((m) => Math.hypot(m.pos.x - s.x, m.pos.z - s.z) < 2);
      });
      if (!spots.length) return;
      const s = spots[Math.floor(Math.random() * spots.length)];
      const type = ctx.pickAmbient?.("cave");
      if (!type) return;
      this.spawn(type, s.x + 0.5, s.y + (MONSTER_TYPES[type].flying ? 1.6 : 0.1), s.z + 0.5);
      return;
    }
    if (!ctx.surfaceSpawns) return;
    const cap = ctx.isNight ? 9 : 6;
    if (ambient.length >= cap) return;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const x = 5 + Math.floor(Math.random() * (WORLD.W - 10));
      const z = 53 + Math.floor(Math.random() * 44);
      if (Math.abs(x - 32) < 5) continue; // 坂道の上
      if (z >= 68 && z <= 75) continue; // 谷のへり
      if (z >= 85 && x >= 17 && x <= 47) continue; // 集落
      const distPlayer = Math.hypot(x - p.x, z - p.z);
      if (distPlayer < 9 || distPlayer > 34) continue;
      const y = ctx.world.terrainSurfaceY(x, z);
      if (y <= WORLD.WATER_LEVEL + 1) continue;
      if (ctx.world.get(x, y - 1, z) !== B.GRASS) continue;
      const type = ctx.pickAmbient?.("slope");
      if (!type) return;
      const pack = MONSTER_TYPES[type].pack ?? 1;
      for (let i = 0; i < pack; i += 1) {
        const px = x + 0.5 + (i ? (Math.random() - 0.5) * 2.4 : 0);
        const pz = z + 0.5 + (i ? (Math.random() - 0.5) * 2.4 : 0);
        this.spawn(type, px, ctx.world.terrainSurfaceY(px, pz) + 0.1, pz);
      }
      return;
    }
  }

  update(dt, ctx) {
    for (const m of [...this.monsters]) {
      m.update(dt, ctx);
      if (m.dead && m.deathT > 0.4) this.remove(m);
      // 遠くへ離れた通常の敵は消す。persist 付き（大岩ガニなど）は消さない。
      if (!m.dead && !m.raid && !m.persist) {
        const far = Math.hypot(m.pos.x - ctx.player.pos.x, m.pos.z - ctx.player.pos.z) > 40;
        const otherLayer = inCave(m.pos.x, m.pos.y, m.pos.z) !== inCave(ctx.player.pos.x, ctx.player.pos.y, ctx.player.pos.z);
        if (far || (otherLayer && Math.random() < dt * 0.2)) this.remove(m);
      }
    }
    this.separateRaiders(dt, ctx);
  }

  // 進軍する軍勢は、同じ道順をたどるので1点に重なりやすい。地上にいる者どうしを少しずつ
  // 押し離して、列・群れに見えるようにする（門の前では横へ広がり、防壁もかじる）。
  separateRaiders(dt, ctx) {
    const list = this.monsters.filter((m) => m.raid && !m.dead && !m.isDragonHead && m.state !== "flyin" && m.root);
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (Math.abs(a.pos.y - b.pos.y) > 1.2) continue;
        let dx = b.pos.x - a.pos.x;
        let dz = b.pos.z - a.pos.z;
        let d = Math.hypot(dx, dz);
        const min = (a.halfW + b.halfW) * 1.15;
        if (d >= min) continue;
        if (d < 0.01) {
          // ぴったり重なったら、決まった向きへ（乱数を使わず、番号から）。
          const ang = (i * 2.4 + j * 1.3) % (Math.PI * 2);
          dx = Math.cos(ang);
          dz = Math.sin(ang);
          d = 1;
        }
        const push = Math.min(min - d, dt * 2.2) * 0.5;
        const ux = (dx / d) * push;
        const uz = (dz / d) * push;
        nudge(a, ctx.world, -ux, -uz);
        nudge(b, ctx.world, ux, uz);
      }
    }
  }
}

// 壁へめり込まない範囲で、水平に少し動かす。
function nudge(m, world, dx, dz) {
  if (!m.collides(world, m.pos.x + dx, m.pos.y, m.pos.z)) m.pos.x += dx;
  if (!m.collides(world, m.pos.x, m.pos.y, m.pos.z + dz)) m.pos.z += dz;
}

// 防衛戦などでボスの湧き位置調整に使う拠点の中心（defense.js から参照）。
export const BASE_CENTER = PLACES.forecourt;
