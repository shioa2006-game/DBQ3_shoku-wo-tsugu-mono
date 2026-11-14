import * as THREE from "three";
import { Entity, GRAVITY } from "./entity.js";
import { HumanoidRig, submersionAt } from "./rig.js";
import { WORLD } from "../world/world.js";
import { B, BLOCK_DEFS } from "../world/blocks.js";
import { findStandCell, furnitureAhead, guardFurnitureTop, isStandCell } from "../../../game-shared/villager-footing.mjs";
import { MINA_RIG_PROFILE } from "../content/rig-profiles/mina.mjs";
import { GONTA_RIG_PROFILE } from "../content/rig-profiles/gonta.mjs";
import { WATARI_RIG_PROFILE } from "../content/rig-profiles/watari.mjs";
import { BELK_RIG_PROFILE } from "../content/rig-profiles/belk.mjs";
import { PINO_RIG_PROFILE } from "../content/rig-profiles/pino.mjs";
import { SUZUHA_RIG_PROFILE, SUZUHA_RIG_COLORS } from "../content/rig-profiles/suzuha.mjs";
import { ASAGI_RIG_PROFILE, ASAGI_RIG_COLORS } from "../content/rig-profiles/asagi.mjs";
import { GANZOU_RIG_PROFILE, GANZOU_RIG_COLORS } from "../content/rig-profiles/ganzou.mjs";

const HUMANOIDS = (file) => new URL(`../../assets/humanoids/${file}`, import.meta.url).href;

// 床のマスの中央へ寄せた行き先は、体（半幅0.3）がそのマスに収まるまで歩き切る。
// 半径0.5のままだと手前で止まり、体の端が隣の家具に掛かったまま上に立ってしまう。
const POST_RADIUS = 0.12;

// 家具＝固体の設置物（かまど・ちゃぶ台・炉・金床・水桶・収納箱・柵・祭壇の灯・ボウガンなど）。住民はこの上に立たない。
// 要石（祭壇）は設置物ではないが、上に立たせない（noStand）。
const isFurniture = (id) => (!!BLOCK_DEFS[id]?.prop && BLOCK_DEFS[id]?.solid === true) || !!BLOCK_DEFS[id]?.noStand;
export const VILLAGER_FOOTING = {
  furniture: isFurniture,
  isProp: (id) => !!BLOCK_DEFS[id]?.prop,
  unsafe: (world, x, y, z) => world.get(x, y, z) === B.WATER,
};
// 跳び乗らない家具。柵だけは、囲われた畑へ入れるよう跳び越えてよい（行き先の床で降りる）。
const noJumpOnto = (id) => id !== B.FENCE && isFurniture(id);

// 水運びの坂道の背骨（x32）。集落（z>=88）と神殿の台地（z<=50）のあいだは、ここを通って行き来する。
const SPINE_X = 32;
const SPINE_NORTH_Z = 49;
const SPINE_SOUTH_Z = 89;

// ダーマ再興編の登場人物。全員、Storybook Character Studio でコードから描いた頭・胴の分離画像と
// リグ設定を使う（docs/CHARACTER_ART.md）。旅の仲間（ミナ・ゴンタ・ワタリ）と招聘する旧友（ピノ・ベルク）は
// 前の編と同じもの、スズハ・アサギ・ガンゾウはこの編のもの。
const def = (id, name, title, rig, colors, extra = {}) => ({
  name,
  title,
  sheet: HUMANOIDS(`${id}_code_body_8dir.png`),
  headSheet: HUMANOIDS(`${id}_code_head_layer_8dir.png`),
  torsoSheet: HUMANOIDS(`${id}_code_torso_layer_8dir.png`),
  rig,
  colors,
  fighter: false,
  ...extra,
});

export const VILLAGER_DEFS = {
  mina: def("mina", "ミナ", "農民", MINA_RIG_PROFILE,
    { sleeve: 0x2f6f6d, hand: 0xeec39a, pants: 0x8a5a33, boot: 0x5a3a24, headBack: 0x8a5a33, bodyBack: 0x265755 },
    { healer: true }),
  gonta: def("gonta", "ゴンタ", "守り手", GONTA_RIG_PROFILE,
    { sleeve: 0x55703c, hand: 0xd9a878, pants: 0x6b5233, boot: 0x4a3320, headBack: 0x5d4326, bodyBack: 0x435a2f },
    { fighter: true, atk: 5, weapon: "sword_iron" }),
  watari: def("watari", "ワタリ", "船乗り", WATARI_RIG_PROFILE,
    { sleeve: 0x24506b, hand: 0xcaa079, pants: 0x2f2a24, boot: 0x38302a, headBack: 0x3a3630, bodyBack: 0x1d3b50 },
    { fighter: true, atk: 3, weapon: "sword_stone" }),
  pino: def("pino", "ピノ", "大工の棟梁", PINO_RIG_PROFILE,
    { sleeve: 0x9c3b22, hand: 0xe6b285, pants: 0x6b5233, boot: 0x40301d, headBack: 0x2b3a66, bodyBack: 0x7c2d1a },
    { builder: true, tool: "hammer_wood" }),
  belk: def("belk", "ベルク", "鍛冶屋", BELK_RIG_PROFILE,
    { sleeve: 0x6b3a26, hand: 0xc98f66, pants: 0x4a4440, boot: 0x2e2a26, headBack: 0x3a332e, bodyBack: 0x54301f },
    { fighter: true, atk: 4, weapon: "hammer_iron" }),
  // ダーマの住民。手足の色は Studio の rig-profile.mjs（*_RIG_COLORS）のまま。
  suzuha: def("suzuha", "スズハ", "元水運び", SUZUHA_RIG_PROFILE, { ...SUZUHA_RIG_COLORS }, { healer: true }),
  asagi: def("asagi", "アサギ", "大工見習い", ASAGI_RIG_PROFILE, { ...ASAGI_RIG_COLORS }, { builder: true, tool: "hammer_wood" }),
  ganzou: def("ganzou", "ガンゾウ", "石切り職人", GANZOU_RIG_PROFILE, { ...GANZOU_RIG_COLORS }, { builder: true, tool: "hammer_stone" }),
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

    const raid = ctx.raidActive || ctx.fightAlong?.(this);
    if (raid) {
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
          desired = this.standPost(ctx.bannerPos, ctx.world);
        }
      } else {
        // Non-fighters rally at the banner; Mina cheers allies back to health.
        // 守る対象が炉などの家具なら、そのそばの床に集まる（炉の上に乗らない）。
        // 避難する場所が決まっていれば（第7章: 本堂の中、ミナは門の内側）そこへ。
        desired = this.standPost(ctx.shelterFor?.(this) ?? ctx.bannerPos, ctx.world);
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
      // 席はゲームが、ちゃぶ台のまわりの空いた床から1人1マスずつ割り当てる。
      this.rig.setTool(null);
      if (!this.mealSeat) {
        const seat = ctx.mealSeatFor?.(this);
        if (seat) {
          this.mealSeat = new THREE.Vector3(seat.x, seat.y, seat.z);
        } else {
          const hash = [...this.id].reduce((n, c) => n + c.charCodeAt(0), 0);
          const a = (hash % 8) * (Math.PI / 4);
          this.mealSeat = new THREE.Vector3(ctx.mealPos.x + Math.cos(a) * 1.2, this.pos.y, ctx.mealPos.z + Math.sin(a) * 1.2);
        }
      }
      desired = this.standPost(this.mealSeat, ctx.world);
      if (Math.hypot(desired.x - this.pos.x, desired.z - this.pos.z) < 0.8) {
        this.facing.set(ctx.mealPos.x - this.pos.x, ctx.mealPos.z - this.pos.z);
      }
    } else if (ctx.workPost?.(this)) {
      // 持ち場の仕事（工事場の大工たち、台所のミナ、炉の前のベルクなど）。近くへ来たら道具を振る。
      const post = ctx.workPost(this);
      this.mealSeat = null;
      const p = new THREE.Vector3(post.x, post.y ?? this.pos.y, post.z);
      desired = this.standPost(p, ctx.world);
      const d = Math.hypot(post.x - this.pos.x, post.z - this.pos.z);
      if (d < 1.6) {
        this.rig.setTool(post.tool ?? null);
        if (post.face) this.facing.set(post.face.x - this.pos.x, post.face.z - this.pos.z);
        if (post.swing && this.thinkTimer <= 0) {
          this.thinkTimer = 1.8 + Math.random() * 1.6;
          this.rig.startAttack();
        }
      } else {
        this.rig.setTool(null);
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
        if (cell) {
          const crop = new THREE.Vector3(cell.x + 0.5, cell.y, cell.z + 0.5);
          this.moveTarget = this.snapCell(crop, ctx.world, 1) ?? crop;
        }
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
        desired = this.standPost(this.home, ctx.world);
      } else {
        if (this.thinkTimer <= 0) {
          this.thinkTimer = 3 + Math.random() * 4;
          const wander = Math.random() < 0.65 ? this.pickWanderTarget(ctx.world) : null;
          this.moveTarget = wander && (this.snapCell(wander, ctx.world, 2) ?? wander);
        }
        desired = this.moveTarget;
      }
    }

    // 集落と神殿の台地をまたぐ移動は、水運びの坂道（橋・道の口）を通る。
    desired = this.routeViaPath(desired);

    // 住民は直線移動しかしないため、木の幹など飛び越えられない障害物に
    // 当たり続けたら、進行方向に対して横へ数ブロック外した一時目標で迂回する
    //（ジャンプは段差1マスまでしか越えられない。モンスターの sidestep と同趣旨）。
    if (desired && this.walking && (this.hitWall || this.ledgeBlocked)) this.blockedT += dt;
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
      const arrive = desired.snapped ? POST_RADIUS : raid && this.def.fighter ? 0.9 : 0.5;
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

    // 家具の天板へは歩いて渡らない（切り株や低い壁の上から隣の鉄鍋・ちゃぶ台へ移らず、迂回する）。
    this.ledgeBlocked = guardFurnitureTop(ctx.world, this, dt, isFurniture);

    this.vel.y += GRAVITY * dt;
    this.hitWall = false;
    this.moveWithCollision(ctx.world, dt, this.inWater ? 1.05 : 0);
    // 段差（地形・床・壁）は跳んで越えるが、家具には跳び乗らない。押し付け続けたら上の迂回で回り込む。
    if (this.hitWall && this.onGround && !furnitureAhead(ctx.world, this, this.facing.x, this.facing.y, noJumpOnto)) {
      this.vel.y = 7.2;
    }

    this.rootSync(ctx);
  }

  // 決まった立ち位置（持ち場・食事の席・集合場所）を、近くの「足もとが床で家具の上でない」
  // マスの中央へ寄せる。行き先が家具のマスの中や家具のすぐ隣でも、最後は床に立つ。
  // 同じ行き先のあいだは、そのマスに立てる限り前回の結果を使う。見つからなければ元の位置。
  standPost(p, world) {
    if (!p) return p;
    const key = `${p.x},${p.y},${p.z}`;
    const cache = this.postCache;
    if (cache?.key === key) {
      const c = cache.cell;
      if (c && isStandCell(world, Math.floor(c.x), c.y, Math.floor(c.z), VILLAGER_FOOTING)) return c;
      if (!c && (cache.retry -= 1) > 0) return p;
    }
    this.postCache = { key, cell: this.snapCell(p, world, 3), retry: 30 };
    return this.postCache.cell ?? p;
  }

  // p に近い、立てるマスの中央（snapped 付きの目標）。見つからなければ null。
  snapCell(p, world, maxRadius) {
    const s = findStandCell(world, p.x, p.z, p.y ?? world.terrainSurfaceY(p.x, p.z), VILLAGER_FOOTING, maxRadius);
    if (!s) return null;
    const cell = new THREE.Vector3(s.x, s.y, s.z);
    cell.snapped = true;
    return cell;
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

  // 集落（z>=89）と神殿の台地（z<=49）のあいだを行き来するときは、直進せず坂道の背骨（x32）に
  // 乗ってから上り下りする。直進すると谷に落ちたり、台地の下の土手で止まったりする。
  // 洞窟の中（山の下）の住民は対象外。
  routeViaPath(dest) {
    if (!dest || this.pos.y < 5.5 || this.pos.x < 16) return dest;
    const side = (z) => (z <= SPINE_NORTH_Z + 0.9 ? -1 : z >= SPINE_SOUTH_Z - 0.9 ? 1 : 0);
    const mySide = side(this.pos.z);
    const destSide = side(dest.z);
    if (mySide === destSide && mySide !== 0) return dest;
    const offSpine = Math.abs(this.pos.x - SPINE_X) > 1.2;
    const end = (s) => ({ x: SPINE_X + 0.5, z: s < 0 ? SPINE_NORTH_Z - 1.2 : SPINE_SOUTH_Z + 1.2 });
    if (mySide !== 0) {
      // まず自分の側の坂道の端へ寄り、そこから背骨に沿って進む。
      const myEnd = { x: SPINE_X + 0.5, z: mySide < 0 ? SPINE_NORTH_Z : SPINE_SOUTH_Z };
      return offSpine || Math.abs(this.pos.z - myEnd.z) > 1.5 ? myEnd : (destSide === 0 ? { x: SPINE_X + 0.5, z: dest.z } : end(destSide));
    }
    // 坂道の途中: 背骨から外れていたら戻り、行き先の側の端へ。
    if (offSpine && Math.abs(dest.z - this.pos.z) > 3) return { x: SPINE_X + 0.5, z: this.pos.z };
    if (destSide === 0) return Math.abs(dest.z - this.pos.z) > 2.5 ? { x: SPINE_X + 0.5, z: dest.z } : dest;
    return end(destSide);
  }
}
