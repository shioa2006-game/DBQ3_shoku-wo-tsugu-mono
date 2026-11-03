import * as THREE from "three";
import { Entity, GRAVITY } from "./entity.js";
import { HumanoidRig, submersionAt } from "./rig.js";
import { PLACES, WORLD } from "../world/world.js";

import { MINA_RIG_PROFILE } from "../content/rig-profiles/mina.mjs";
import { PINO_RIG_PROFILE } from "../content/rig-profiles/pino.mjs";
import { INAHO_RIG_PROFILE } from "../content/rig-profiles/inaho.mjs";
import { GONTA_RIG_PROFILE } from "../content/rig-profiles/gonta.mjs";
import { JINBEI_RIG_PROFILE } from "../content/rig-profiles/jinbei.mjs";
import { WATARI_RIG_PROFILE } from "../content/rig-profiles/watari.mjs";

const HUMANOIDS = (file) => new URL(`../../assets/humanoids/${file}`, import.meta.url).href;

// 浜から乗船する順。乗船口は幅1マスなので、両側で中央に揃えてから横断する。
const dockLanding = { x: PLACES.pier.x + 1, z: PLACES.pier.z - 2.2 };
const pierGate = { x: PLACES.pier.x + 1, z: PLACES.ship.z + 2.5 };
const shipGate = { x: PLACES.ship.x + 3.5, z: pierGate.z };
const dockRoutes = {
  land: { pier: [dockLanding], ship: [dockLanding, pierGate, shipGate] },
  pier: { land: [dockLanding], ship: [pierGate, shipGate] },
  ship: { land: [shipGate, pierGate, dockLanding], pier: [shipGate, pierGate] },
};
const WAYPOINT_RADIUS = 0.15;

function dockZone({ x, z }, completed) {
  const p = PLACES.pier;
  const s = PLACES.ship;
  if (completed.has("pier") && x >= p.x && x < p.x + 2 && z >= p.z && z < p.z + 11) return "pier";
  if (completed.has("ship_hull") && x >= s.x && x < s.x + 5 && z >= s.z && z < s.z + 9) return "ship";
  return "land";
}

export const VILLAGER_DEFS = {
  pino: {
    name: "ピノ",
    title: "大工見習い",
    sheet: HUMANOIDS("pino_code_body_8dir.png"),
    headSheet: HUMANOIDS("pino_code_head_layer_8dir.png"),
    torsoSheet: HUMANOIDS("pino_code_torso_layer_8dir.png"),
    rig: PINO_RIG_PROFILE,
    colors: { sleeve: 0x9c3b22, hand: 0xe6b285, pants: 0x6b5233, boot: 0x40301d, headBack: 0x2b3a66, bodyBack: 0x7c2d1a },
    fighter: true,
    atk: 2,
    weapon: "club",
  },
  mina: {
    name: "ミナ",
    title: "農家の少女",
    sheet: HUMANOIDS("mina_code_body_8dir.png"),
    headSheet: HUMANOIDS("mina_code_head_layer_8dir.png"),
    torsoSheet: HUMANOIDS("mina_code_torso_layer_8dir.png"),
    rig: MINA_RIG_PROFILE,
    colors: { sleeve: 0x2f6f6d, hand: 0xeec39a, pants: 0x8a5a33, boot: 0x5a3a24, headBack: 0x8a5a33, bodyBack: 0x265755 },
    fighter: false,
    healer: true,
  },
  gonta: {
    name: "ゴンタ",
    title: "村の若者",
    sheet: HUMANOIDS("gonta_code_body_8dir.png"),
    headSheet: HUMANOIDS("gonta_code_head_layer_8dir.png"),
    torsoSheet: HUMANOIDS("gonta_code_torso_layer_8dir.png"),
    rig: GONTA_RIG_PROFILE,
    colors: { sleeve: 0x55703c, hand: 0xd9a878, pants: 0x6b5233, boot: 0x4a3320, headBack: 0x5d4326, bodyBack: 0x435a2f },
    fighter: true,
    atk: 3,
    weapon: "sword_stone",
  },
  jinbei: {
    name: "ジンベエ",
    title: "村の長老",
    sheet: HUMANOIDS("jinbei_code_body_8dir.png"),
    headSheet: HUMANOIDS("jinbei_code_head_layer_8dir.png"),
    torsoSheet: HUMANOIDS("jinbei_code_torso_layer_8dir.png"),
    rig: JINBEI_RIG_PROFILE,
    colors: { sleeve: 0x4a6440, hand: 0xcfa070, pants: 0x57503f, boot: 0x3a2f26, headBack: 0xa1aaa9, bodyBack: 0x3a4f33 },
    fighter: false,
  },
  inaho: {
    name: "イナホ",
    title: "料理見習い",
    sheet: HUMANOIDS("inaho_code_body_8dir.png"),
    headSheet: HUMANOIDS("inaho_code_head_layer_8dir.png"),
    torsoSheet: HUMANOIDS("inaho_code_torso_layer_8dir.png"),
    rig: INAHO_RIG_PROFILE,
    colors: { sleeve: 0xf2e6d0, hand: 0xeec39a, pants: 0x8a4a2a, boot: 0x5a3a24, headBack: 0x1c1a18, bodyBack: 0xb5832e },
    fighter: false,
  },
  watari: {
    name: "ワタリ",
    title: "船乗り",
    sheet: HUMANOIDS("watari_code_body_8dir.png"),
    headSheet: HUMANOIDS("watari_code_head_layer_8dir.png"),
    torsoSheet: HUMANOIDS("watari_code_torso_layer_8dir.png"),
    rig: WATARI_RIG_PROFILE,
    colors: { sleeve: 0x24506b, hand: 0xcaa079, pants: 0x2f2a24, boot: 0x38302a, headBack: 0x3a3630, bodyBack: 0x1d3b50 },
    fighter: true,
    atk: 3,
    weapon: "sword_stone",
  },
};

function makeLabelSprite(text, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 34px 'Hiragino Maru Gothic ProN', 'Meiryo', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(20,17,15,0.85)";
  ctx.strokeText(text, 128, 32);
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(1.5, 0.375, 1);
  return sprite;
}

export class Villager extends Entity {
  constructor(id, x, y, z) {
    super("villager", 0.3, 1.1);
    this.id = id;
    this.def = VILLAGER_DEFS[id];
    this.maxHp = 16;
    this.hp = 16;
    this.pos.set(x, y, z);
    this.home = new THREE.Vector3(x, y, z);
    this.rig = new HumanoidRig({
      sheetUrl: this.def.sheet, headSheetUrl: this.def.headSheet, bodySheetUrl: this.def.torsoSheet,
      colors: this.def.colors, tuning: this.def.rig,
    });
    this.root = new THREE.Group();
    this.root.add(this.rig.group);
    this.root.position.copy(this.pos);

    this.nameLabel = makeLabelSprite(this.def.name);
    this.nameLabel.position.y = 1.55;
    this.root.add(this.nameLabel);
    this.marker = makeLabelSprite("！", "#ffd94a");
    this.marker.scale.set(0.9, 0.225, 1);
    this.marker.position.y = 1.85;
    this.marker.visible = false;
    this.root.add(this.marker);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.root.add(this.shadow);

    this.mode = "wander"; // wander | work | fight | cheer | down
    this.moveTarget = null;
    this.dockRoute = null;
    this.thinkTimer = 1;
    this.workTimer = 0;
    this.attackCd = 0;
    this.healPulse = 0;
    this.down = false;
    this.stayDown = false; // ストーリー演出で倒れたまま（防衛戦の被弾ダウンと違い自動復帰しない）
    this.facing = new THREE.Vector2(0, 1);
    this.walking = false;
    this.talkPause = 0;
    this.blockedT = 0; // 壁に当たり続けている時間（迂回の判断用）
    this.detour = null; // 一時的な迂回目標
    this.detourT = 0;
  }

  setDown(v) {
    this.down = v;
    this.rig.inner.rotation.z = v ? Math.PI / 2 : 0;
    this.rig.inner.position.y = v ? 0.3 : 0;
    if (v) this.hp = Math.max(1, this.hp);
  }

  update(dt, ctx) {
    this.invuln = Math.max(0, this.invuln - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.talkPause = Math.max(0, this.talkPause - dt);
    this.thinkTimer -= dt;

    if (this.down) {
      // Recover after the raid ends. Story-scripted knockdowns (stayDown) stay
      // collapsed until the quest logic clears the flag.
      if (!ctx.raidActive && !this.stayDown) {
        this.setDown(false);
        this.hp = this.maxHp;
      }
      this.rootSync(ctx);
      return;
    }

    // 水中に長く留まったら最寄りの陸（桟橋・甲板の床も可）へ救出する。
    // ルーティングで水へは入らなくなったが、船・桟橋の下は真上が床で塞がれて
    // いて自力で登れず、物理的に詰まる。押し出された場合や既存セーブで
    // すでに詰まっている住民の最終保険。
    if (this.inWater) {
      this.waterT = (this.waterT ?? 0) + dt;
      if (this.waterT > 8) {
        this.waterT = 0;
        const spot = this.findRescueSpot(ctx.world);
        if (spot) {
          this.pos.set(spot.x, spot.y + 0.1, spot.z);
          this.vel.set(0, 0, 0);
          this.moveTarget = null;
          this.dockRoute = null;
        }
      }
    } else {
      this.waterT = 0;
    }

    let desired = null; // move destination
    let sprint = 1;

    if (ctx.raidActive) {
      this.rig.setTool(this.def.fighter ? this.def.weapon : null);
      if (this.def.fighter) {
        // Chase the monster nearest to the banner.
        let best = null;
        let bestD = Infinity;
        for (const m of ctx.monsters) {
          if (m.dead) continue;
          const d = m.pos.distanceTo(ctx.bannerPos);
          if (d < bestD) {
            bestD = d;
            best = m;
          }
        }
        if (best) {
          sprint = 1.35;
          // 水上の敵（イカ・触手）は泳いで追わない。敵に最も近い歩ける床
          // （桟橋・船の甲板・岸）を立ち位置にし、縁から届く間合いで叩く
          // （触手は設計上、甲板・桟橋の縁から剣が届く位置に配置されている）。
          const overWater = ctx.world.terrainSurfaceY(best.pos.x, best.pos.z) <= WORLD.WATER_LEVEL;
          desired = overWater
            ? this.standCellNear(ctx.world, best.pos) ?? ctx.rallyPos ?? ctx.bannerPos
            : best.pos;
          const reach = overWater ? 1.9 : 1.1;
          const d = this.pos.distanceTo(best.pos);
          if (d < reach && this.attackCd <= 0) {
            this.attackCd = 1.0;
            this.rig.startAttack();
            // 章ボスへの与ダメージは半分。住民の集中攻撃で、ボスが固有行動を
            // 見せる前に溶けてしまわないように（ザコへは従来どおり）。
            const dmg = best.def.boss ? Math.max(1, Math.floor(this.def.atk / 2)) : this.def.atk;
            ctx.hurtMonster(best, dmg, this.pos, {});
          }
        } else {
          desired = ctx.rallyPos ?? ctx.bannerPos;
        }
      } else {
        // Non-fighters rally at the banner; Mina cheers allies back to health.
        // 守る対象が水上（クラーケン戦の船）の防衛では、config の rally
        // （桟橋のデッキ）に集まり、海へ入らない。
        desired = ctx.rallyPos ?? ctx.bannerPos;
        if (this.def.healer) {
          this.healPulse += dt;
          if (this.healPulse > 2.2) {
            this.healPulse = 0;
            ctx.healAlliesNear(this.pos, 4.5, 1);
          }
        }
      }
    } else if (ctx.mealPos) {
      // 食事シーン: 食堂のちゃぶ台のまわりに集まる（1日1回の団らん）。
      this.rig.setTool(null);
      if (!this.mealSeat) {
        const hash = [...this.id].reduce((n, c) => n + c.charCodeAt(0), 0);
        const a = (hash % 8) * (Math.PI / 4);
        this.mealSeat = new THREE.Vector3(ctx.mealPos.x + Math.cos(a) * 1.2, this.pos.y, ctx.mealPos.z + Math.sin(a) * 1.2);
      }
      desired = this.mealSeat;
      if (this.pos.distanceTo(this.mealSeat) < 0.8) {
        this.facing.set(ctx.mealPos.x - this.pos.x, ctx.mealPos.z - this.pos.z);
      }
    } else if (this.id === "inaho" && ctx.kitchenPos) {
      // 料理人はかまどの前が持ち場。ときどき鍋をかき回す。
      this.rig.setTool(null);
      this.mealSeat = null;
      desired = ctx.kitchenPos;
      const d = Math.hypot(ctx.kitchenPos.x - this.pos.x, ctx.kitchenPos.z - this.pos.z);
      if (d < 1.4 && this.thinkTimer <= 0) {
        this.thinkTimer = 2.4 + Math.random() * 1.6;
        this.rig.startAttack(); // かき混ぜモーション
      }
    } else if (ctx.farmWork && this.id === "mina") {
      this.mealSeat = null;
      this.rig.setTool(null);
      // Tend the crops: walk to a random crop cell, "water" it for a moment.
      if (this.workTimer > 0) {
        this.workTimer -= dt;
        ctx.boostCropsNear(this.pos, 2.2, dt);
      } else if (!this.moveTarget && this.thinkTimer <= 0) {
        const cell = ctx.pickFarmCell();
        this.thinkTimer = 2;
        if (cell) this.moveTarget = new THREE.Vector3(cell.x + 0.5, cell.y, cell.z + 0.5);
      }
      desired = this.moveTarget;
    } else {
      this.rig.setTool(null);
      this.mealSeat = null;
      if (this.inWater) {
        // 水に落ちたら立ち泳ぎで待機せず持ち場へ戻る。橋・桟橋のルーティングを
        // 経由するので、既存セーブで海に詰まっている住民も自力で上陸できる。
        this.moveTarget = null;
        desired = this.home;
      } else {
        if (this.thinkTimer <= 0) {
          this.thinkTimer = 3 + Math.random() * 4;
          this.moveTarget = Math.random() < 0.65 ? this.pickWanderTarget(ctx.world) : null;
        }
        desired = this.moveTarget;
      }
    }

    const destination = desired;
    desired = this.routeViaDock(destination, ctx.completedBlueprints);

    // 住民は直線移動しかしないため、木の幹など飛び越えられない障害物に
    // 当たり続けたら、進行方向に対して横へ数ブロック外した一時目標で迂回する
    //（ジャンプは段差1マスまでしか越えられない。モンスターの sidestep と同趣旨）。
    if (desired && this.walking && this.hitWall) this.blockedT += dt;
    else this.blockedT = Math.max(0, this.blockedT - dt * 2);
    if (desired && this.blockedT > 1.0) {
      this.blockedT = 0;
      const dx = desired.x - this.pos.x;
      const dz = desired.z - this.pos.z;
      const len = Math.hypot(dx, dz) || 1;
      const sign = Math.random() < 0.5 ? 1 : -1;
      const candidate = {
        x: this.pos.x - (dz / len) * 2.5 * sign + (dx / len) * 1.5,
        z: this.pos.z + (dx / len) * 2.5 * sign + (dz / len) * 1.5,
      };
      // 舷側や桟橋から海へ踏み出す迂回は避け、元の目標への段差ジャンプを続ける。
      const zone = dockZone(this.pos, ctx.completedBlueprints);
      if (zone === "land" || dockZone(candidate, ctx.completedBlueprints) === zone) {
        this.detour = candidate;
        this.detourT = 1.4;
      }
    }
    if (this.detourT > 0 && desired) {
      this.detourT -= dt;
      desired = this.detour;
    }

    // Walk toward the destination.
    this.walking = false;
    if (desired && this.talkPause <= 0) {
      const dx = desired.x - this.pos.x;
      const dz = desired.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      const destinationRadius = ctx.raidActive && this.def.fighter ? 0.9 : 0.5;
      const arrive = desired === destination ? destinationRadius : WAYPOINT_RADIUS;
      if (d > arrive) {
        const speed = 2.3 * sprint;
        this.vel.x = (dx / d) * speed;
        this.vel.z = (dz / d) * speed;
        this.facing.set(dx, dz);
        this.walking = true;
      } else {
        this.vel.x = 0;
        this.vel.z = 0;
        if (this.moveTarget === desired) {
          this.moveTarget = null;
          if (ctx.farmWork && this.id === "mina") this.workTimer = 2.5;
        }
      }
    } else {
      this.vel.x *= Math.max(0, 1 - dt * 8);
      this.vel.z *= Math.max(0, 1 - dt * 8);
    }

    this.vel.y += GRAVITY * dt;
    this.hitWall = false;
    this.moveWithCollision(ctx.world, dt, this.inWater ? 1.05 : 0);
    if (this.hitWall && this.onGround) this.vel.y = 7.2;

    this.rootSync(ctx);
  }

  rootSync(ctx) {
    this.root.position.copy(this.pos);
    this.rig.group.rotation.y = ctx.cameraYaw;
    this.rig.faceWorld(this.facing.x, this.facing.y, ctx.cameraYaw);
    this.rig.update(1 / 60, this.walking);
    this.rig.setSubmersion(submersionAt(ctx.world, this.pos, this.inWater));
    const gy = ctx.world.groundYBelow(this.pos.x, this.pos.z, this.pos.y + 0.1);
    this.shadow.position.y = gy - this.pos.y + 0.02;
    this.rig.group.visible = this.invuln <= 0 || Math.floor(this.invuln * 14) % 2 === 0;
  }

  // 世界停止中（会話・メニュー）の見た目だけの同期。ビルボードの向き・待機アニメ・
  // 影を更新し、AI・移動・戦闘は動かさない。これが無いと、停止中にカメラと
  // スプライトの向きがずれて、キャラが「ペラペラの板」に見えてしまう。
  syncVisual(dt, cameraYaw, world) {
    this.root.position.copy(this.pos);
    this.rig.group.rotation.y = cameraYaw;
    this.rig.faceWorld(this.facing.x, this.facing.y, cameraYaw);
    this.rig.update(dt, false);
    this.rig.setSubmersion(submersionAt(world, this.pos, this.inWater));
    const gy = world.groundYBelow(this.pos.x, this.pos.z, this.pos.y + 0.1);
    this.shadow.position.y = gy - this.pos.y + 0.02;
  }

  facePlayer(playerPos) {
    this.facing.set(playerPos.x - this.pos.x, playerPos.z - this.pos.z);
    this.talkPause = 4;
    this.vel.x = 0;
    this.vel.z = 0;
  }

  // 平時の徘徊先を home のまわりから選ぶ。**水没した列は選ばない**（波打ち際に
  // home があると徘徊円の半分が海になり、住民がしょっちゅう海の中に立ってしまう。
  // 第3章で持ち場が漂着の浜になった後に顕在化）。桟橋などの水上の床は
  // terrainSurfaceY が床の高さを返すため、徘徊先として選べる。
  pickWanderTarget(world) {
    for (let i = 0; i < 4; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 4;
      const x = this.home.x + Math.cos(a) * r;
      const z = this.home.z + Math.sin(a) * r;
      if (world.terrainSurfaceY(x, z) > WORLD.WATER_LEVEL) {
        return new THREE.Vector3(x, this.home.y, z);
      }
    }
    return null; // まわりが海ばかりなら今回はその場で過ごす
  }

  // 北の島(z<橋北端)と南の村(z>橋南端)をまたぐ移動は、直進せず必ず橋
  // （x30-31, z57-72）を渡るように途中目標を差し替える。直進すると海峡を
  // 泳ぐことになり、第3章で海峡に建つ桟橋・船の船体に水中で引っかかって
  // 上陸できなくなる（食事シーンや防衛戦の島またぎ移動で発生）。
  // 海峡の水中にいる場合も最寄り側でなく行き先側のたもとへ退避させ、
  // すでに詰まっている住民（既存セーブ）も自力で脱出できる。
  // 海峡内が目的地の場合（クラーケン防衛の船など）は従来どおり直進。
  routeViaBridge(dest) {
    if (!dest) return dest;
    const bx = PLACES.bridge.x + 1; // 桁(x30,31)の中央
    const deckN = PLACES.bridge.z; // 桁の北端 z
    const deckS = PLACES.bridge.z + 15; // 桁の南端 z（D=16）
    const side = (z) => (z < deckN ? -1 : z > deckS + 0.9 ? 1 : 0);
    const mySide = side(this.pos.z);
    const destSide = side(dest.z);
    if (destSide === 0 || mySide === destSide) return dest;
    // たもとは side 判定の境界より十分外側に置く。境界ぎりぎりだと、到着半径の
    // ぶん手前（＝まだ海峡内判定）で立ち止まり、目標が実目的地に切り替わらない。
    const landing = (s) => ({ x: bx, z: s < 0 ? deckN - 2.2 : deckS + 2.2 });
    // 海峡内（橋の上か水中）→ 行き先側のたもとへ。
    if (mySide === 0) return landing(destSide);
    // 反対側へ渡る: 橋の軸線に乗っていれば対岸のたもとへ、外れていればまず自分側のたもとへ。
    return Math.abs(this.pos.x - bx) <= 1 - this.halfW ? landing(destSide) : landing(mySide);
  }

  // 水中救出の行き先: 自分のまわりを近い順に走査し、水没していない床
  // （浜・桟橋・甲板）を返す。真上が塞がれた船の下からは「登る」のでなく
  // この床へ引き上げる。
  findRescueSpot(world) {
    for (let r = 2; r <= 10; r += 1) {
      for (let a = 0; a < 16; a += 1) {
        const ang = (a / 16) * Math.PI * 2;
        const x = Math.floor(this.pos.x + Math.cos(ang) * r) + 0.5;
        const z = Math.floor(this.pos.z + Math.sin(ang) * r) + 0.5;
        const y = world.terrainSurfaceY(x, z);
        if (y > WORLD.WATER_LEVEL) return { x, y, z };
      }
    }
    return null;
  }

  // 水上の敵を叩くときの立ち位置: 敵のまわり±3列から、水没していない
  // いちばん敵に寄れる床（桟橋・船の甲板・岸）を選ぶ。無ければ null。
  standCellNear(world, p) {
    let best = null;
    let bestD = Infinity;
    const px = Math.floor(p.x);
    const pz = Math.floor(p.z);
    for (let dx = -3; dx <= 3; dx += 1) {
      for (let dz = -3; dz <= 3; dz += 1) {
        const x = px + dx + 0.5;
        const z = pz + dz + 0.5;
        if (world.terrainSurfaceY(x, z) <= WORLD.WATER_LEVEL) continue;
        const d = Math.hypot(x - p.x, z - p.z);
        if (d < bestD) {
          bestD = d;
          best = { x, z };
        }
      }
    }
    return best;
  }

  // 桟橋（2×11・水上デッキ）や船の甲板と陸をまたぐ移動は、直進して海へ降りず、
  // 桟橋の付け根（北の浜）と乗船口（桟橋に接した舷側の開口）を経由する。
  // ワタリの食事往復や防衛戦の立ち位置移動で、デッキの脇から海峡へ泳ぎ出す
  // のを防ぐ。水中にいる間は「デッキ上」と扱わないので、海に落ちた住民も
  // 付け根の浜へ泳いで自力で上陸できる。
  routeViaDock(dest, completed) {
    if (!dest || !completed.has("pier")) {
      this.dockRoute = null;
      return this.routeViaBridge(dest);
    }
    const to = dockZone(dest, completed);
    // 通過中は境界を踏むたびに経路を作り直さない。食事・戦闘などで行き先の
    // 区域が変わった時は、その時点の立ち位置から乗り降りを組み直す。
    if (this.dockRoute?.to !== to || this.inWater) {
      const from = this.pos.y > WORLD.WATER_LEVEL + 1.35 ? dockZone(this.pos, completed) : "land";
      const steps = dockRoutes[from][to];
      this.dockRoute = steps ? { to, steps, index: 0 } : null;
    }
    const route = this.dockRoute;
    if (route) {
      const step = route.steps[route.index];
      if (step && Math.hypot(this.pos.x - step.x, this.pos.z - step.z) <= WAYPOINT_RADIUS) route.index++;
      const next = route.steps[route.index];
      // 対岸から港へ来るときは、まず島を結ぶ橋を渡ってから浜へ。
      if (next) return next === dockLanding && to !== "land" ? this.routeViaBridge(next) : next;
    }
    // 下船後は浜の目的地への直線が桟橋の付け根をかすめても、下船をやり直さない。
    return to === "land" ? this.routeViaBridge(dest) : dest;
  }
}
