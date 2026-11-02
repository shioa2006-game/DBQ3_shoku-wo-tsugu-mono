import * as THREE from "three";
import { Entity, GRAVITY } from "./entity.js";
import { HumanoidRig, submersionAt } from "./rig.js";
import { PLACES, WORLD } from "../world/world.js";

const HUMANOIDS = (file) => new URL(`../../assets/humanoids/${file}`, import.meta.url).href;

// 火山島編の登場人物。
// 旅の仲間（ミナ・ゴンタ・ワタリ）は本島編の画像を流用し、
// ベルク・ロク・カヤ・ナギは火山島の新規画像を使う。
// 追加の背景住民（スミ・テル）はカヤの画像を流用し、手足の色で差を付ける。
export const VILLAGER_DEFS = {
  mina: {
    name: "ミナ",
    title: "農民",
    sheet: HUMANOIDS("village_girl_body_8dir.png"),
    colors: { sleeve: 0x2f6f6d, hand: 0xeec39a, pants: 0x8a5a33, boot: 0x5a3a24, headBack: 0x8a5a33, bodyBack: 0x265755 },
    fighter: false,
    healer: true,
  },
  gonta: {
    name: "ゴンタ",
    title: "守り手",
    sheet: HUMANOIDS("adult_male_villager_body_8dir.png"),
    colors: { sleeve: 0x55703c, hand: 0xd9a878, pants: 0x6b5233, boot: 0x4a3320, headBack: 0x5d4326, bodyBack: 0x435a2f },
    fighter: true,
    atk: 3,
    weapon: "sword_stone",
  },
  watari: {
    name: "ワタリ",
    title: "船乗り",
    sheet: HUMANOIDS("sailor_body_8dir.png"),
    colors: { sleeve: 0x24506b, hand: 0xcaa079, pants: 0x2f2a24, boot: 0x38302a, headBack: 0x3a3630, bodyBack: 0x1d3b50 },
    fighter: true,
    atk: 3,
    weapon: "sword_stone",
  },
  belk: {
    name: "ベルク",
    title: "槌を置いた鍛冶職人",
    sheet: HUMANOIDS("blacksmith_body_8dir.png"),
    colors: { sleeve: 0x6b3a26, hand: 0xc98f66, pants: 0x4a4440, boot: 0x2e2a26, headBack: 0x3a332e, bodyBack: 0x54301f },
    fighter: true,
    atk: 3,
    weapon: "hammer_stone",
  },
  roku: {
    name: "ロク",
    title: "鉱夫兼炭焼き",
    sheet: HUMANOIDS("miner_body_8dir.png"),
    colors: { sleeve: 0x5c5a52, hand: 0xd0a074, pants: 0x4f4436, boot: 0x332b20, headBack: 0x44403a, bodyBack: 0x4a483f },
    fighter: true,
    atk: 2,
    weapon: "hammer_stone",
  },
  kaya: {
    name: "カヤ",
    title: "町へ帰る住民",
    sheet: HUMANOIDS("volcano_villager_body_8dir.png"),
    colors: { sleeve: 0x8a4a3a, hand: 0xeec39a, pants: 0x6b5233, boot: 0x4a3320, headBack: 0x3c2c22, bodyBack: 0x6e392c },
    fighter: false,
  },
  nagi: {
    name: "ナギ",
    title: "竹林の社守り",
    sheet: HUMANOIDS("shrine_keeper_body_8dir.png"),
    colors: { sleeve: 0xf2ecdc, hand: 0xeec39a, pants: 0xa03024, boot: 0x3a2f26, headBack: 0x2b2b33, bodyBack: 0xd8d2c2 },
    fighter: false,
    healer: true,
  },
  yomogi: {
    name: "ヨモギ",
    title: "薬草の知恵を持つ住民",
    sheet: HUMANOIDS("herbalist_body_8dir.png"),
    colors: { sleeve: 0x6a7a4a, hand: 0xd8b08a, pants: 0x57503f, boot: 0x3a2f26, headBack: 0x5a6a42, bodyBack: 0xcfc4a4 },
    fighter: false,
    healer: true,
  },
  // 背景住民（カヤの画像を流用し、手足の色と配置で差を付ける）。
  sumi: {
    name: "スミ",
    title: "鉱山町の住民",
    sheet: HUMANOIDS("volcano_villager_body_8dir.png"),
    colors: { sleeve: 0x4a5a6b, hand: 0xd8b08a, pants: 0x57503f, boot: 0x3a2f26, headBack: 0x3c2c22, bodyBack: 0x3c4a58 },
    fighter: false,
  },
  teru: {
    name: "テル",
    title: "鉱山町の住民",
    sheet: HUMANOIDS("volcano_villager_body_8dir.png"),
    colors: { sleeve: 0x6b6b3a, hand: 0xeec39a, pants: 0x4f4436, boot: 0x332b20, headBack: 0x3c2c22, bodyBack: 0x565626 },
    fighter: false,
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
    this.weapon = this.def.weapon ?? null; // 章の進行で持ち替えられる（ベルクの打った剣など）
    this.rig = new HumanoidRig({ sheetUrl: this.def.sheet, colors: this.def.colors, tuning: this.def.rig });
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
    this.thinkTimer = 1;
    this.workTimer = 0;
    this.attackCd = 0;
    this.healPulse = 0;
    this.down = false;
    this.waterT = 0; // 水中に留まっている時間（救出テレポートの判定用）
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
      // ナギ（章末）は倒れたまま。防衛戦で倒れた住民は戦い終わりに起き上がる。
      if (!ctx.raidActive && !this.stayDown) {
        this.setDown(false);
        this.hp = this.maxHp;
      }
      this.rootSync(ctx);
      return;
    }

    // 水中（または水没した波打ち際）に長く留まったら、最寄りの乾いた床へ
    // 救出する。崖の海岸線では水際から陸へ2段以上の段差があり自力で登れない。
    // ジャンプで一瞬水から出ても諦めないよう、乾いた陸に立つまで時間を積算する。
    const wetZone = this.inWater || ctx.world.terrainSurfaceY(this.pos.x, this.pos.z) <= WORLD.WATER_LEVEL;
    if (wetZone) {
      this.waterT += dt;
      if (this.waterT > 8) {
        this.waterT = 0;
        const spot = this.findRescueSpot(ctx.world);
        if (spot) {
          this.pos.set(spot.x, spot.y + 0.1, spot.z);
          this.vel.set(0, 0, 0);
          this.moveTarget = null;
        }
      }
    } else {
      this.waterT = 0;
    }

    let desired = null; // move destination
    let sprint = 1;

    if (ctx.raidActive) {
      this.rig.setTool(this.def.fighter ? this.weapon : null);
      if (this.def.fighter) {
        // Chase the monster nearest to the defense target.
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
          desired = best.pos;
          sprint = 1.35;
          // ドラゴンの頭は低空に浮くため、水平距離で「切りつけ届く」を判定する。
          const d = best.isDragonHead
            ? Math.hypot(best.pos.x - this.pos.x, best.pos.z - this.pos.z)
            : this.pos.distanceTo(best.pos);
          if (d < (best.isDragonHead ? 2.2 : 1.1) && this.attackCd <= 0) {
            this.attackCd = 1.0;
            this.rig.startAttack();
            ctx.hurtMonster(best, this.def.atk, this.pos, {});
          }
        } else {
          desired = ctx.bannerPos;
        }
      } else {
        // Non-fighters rally at the banner; Mina cheers allies back to health.
        desired = ctx.bannerPos;
        if (this.def.healer) {
          this.healPulse += dt;
          if (this.healPulse > 2.2) {
            this.healPulse = 0;
            ctx.healAlliesNear(this.pos, 4.5, 1);
          }
        }
      }
    } else if (ctx.mealPos) {
      // 食事シーン: 鉄鍋（かまど）のまわりに集まる（1日1回の団らん）。
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
    } else if (this.id === "belk" && ctx.forgePos) {
      // 鍛冶屋は炉の前が持ち場。ときどき槌を振る。
      this.mealSeat = null;
      desired = ctx.forgePos;
      const d = Math.hypot(ctx.forgePos.x - this.pos.x, ctx.forgePos.z - this.pos.z);
      if (d < 1.4) {
        this.rig.setTool(this.weapon);
        if (this.thinkTimer <= 0) {
          this.thinkTimer = 2.2 + Math.random() * 1.6;
          this.rig.startAttack(); // 槌打ちモーション
        }
      } else {
        this.rig.setTool(null);
      }
    } else if (this.id === "roku" && ctx.minePos) {
      // 鉱夫は坑道の入口あたりが持ち場。
      this.mealSeat = null;
      this.rig.setTool(null);
      if (this.thinkTimer <= 0) {
        this.thinkTimer = 3 + Math.random() * 4;
        const a = Math.random() * Math.PI * 2;
        this.moveTarget = new THREE.Vector3(
          ctx.minePos.x + Math.cos(a) * 2.2,
          this.pos.y,
          ctx.minePos.z + Math.sin(a) * 1.6,
        );
      }
      desired = this.moveTarget;
    } else if (this.id === "kaya" && ctx.kitchenPos) {
      // カヤは鉄鍋の火の番。ときどき鍋をかき回す。
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
      if (wetZone) {
        // 水に落ちたら立ち泳ぎで待機せず持ち場へ戻る。水から上がっても波打ち際の
        // 水没地形（濡れた砂）の上で立ち止まらず、乾いた陸まで歩き切る。
        // 峠のルーティングを経由するので、水に詰まっている住民も自力で上陸できる。
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

    // 火山側と竹林側をまたぐ移動は、必ず峠の通路を経由する。
    desired = this.routeViaPass(desired);

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
      this.detour = {
        x: this.pos.x - (dz / len) * 2.5 * sign + (dx / len) * 1.5,
        z: this.pos.z + (dx / len) * 2.5 * sign + (dz / len) * 1.5,
      };
      this.detourT = 1.4;
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
      const arrive = ctx.raidActive && this.def.fighter ? 0.9 : 0.5;
      if (d > arrive) {
        const speed = 2.3 * sprint;
        this.vel.x = (dx / d) * speed;
        this.vel.z = (dz / d) * speed;
        this.facing.set(dx, dz);
        this.walking = true;
      } else {
        this.vel.x = 0;
        this.vel.z = 0;
        if (this.moveTarget && d <= arrive) {
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

  // 水中救出の行き先: 自分のまわりを近い順に走査し、水没していない床を返す。
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

  // 平時の徘徊先を home のまわりから選ぶ。**水没した列は選ばない**（波打ち際に
  // home があると徘徊円の半分が海になり、住民がしょっちゅう海の中に立ってしまう）。
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

  // 火山側(z<峠北端)と竹林側(z>峠南端)をまたぐ移動は、直進せず必ず峠の巻き道
  // （火山東中腹・x43..45）を通るように途中目標を差し替える。直進すると火山の
  // 斜面に引っかかり続ける（第5章開通後の往復・防衛集合で発生し得る）。
  routeViaPass(dest) {
    if (!dest) return dest;
    const px = PLACES.pass.x; // 回廊の中央 x
    const passN = WORLD.PASS_Z0;
    const passS = WORLD.PASS_Z1;
    const side = (z) => (z < passN ? -1 : z > passS + 0.9 ? 1 : 0);
    const mySide = side(this.pos.z);
    const destSide = side(dest.z);
    if (destSide === 0 || mySide === destSide) return dest;
    // たもとは side 判定の境界より十分外側に置く。境界ぎりぎりだと、到着半径の
    // ぶん手前（＝まだ峠内判定）で立ち止まり、目標が実目的地に切り替わらない。
    const landing = (s) => ({ x: px, z: s < 0 ? passN - 2.2 : passS + 2.2 });
    // 峠の回廊内 → 行き先側のたもとへ。
    if (mySide === 0) return landing(destSide);
    // 反対側へ渡る: 回廊の軸線に乗っていれば対岸のたもとへ、外れていればまず自分側のたもとへ。
    return Math.abs(this.pos.x - px) <= 1.2 ? landing(destSide) : landing(mySide);
  }
}
