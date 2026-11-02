import * as THREE from "three";
import { MonsterSprite } from "./rig.js";

// 共通ドラゴン型リグ（第5章グロム／第6〜7章リポジトリのヴァルガで共用する基盤）。
//
// 構成（デザイン図: 頭⇔細長い首⇔胴手足、胴に翼と尾）:
//   - 胴体+四肢: 8方向ビルボード（4×2シート1枚）
//   - 頭: 8方向ビルボード（4×2シート1枚）。config.heads の数だけ複製する
//   - 首: 頭と胴体をつなぐ、細長い3Dのセグメント列（ベジェ曲線に沿って並べる）
//   - 翼: config.wings があれば、胴体の左右に付けて羽ばたく3Dの三角翼
//   - 尾: 後方へ曲線を描く3Dのセグメント列
//   - 火炎エフェクト: 3Dプリミティブ
//
// 各ドラゴン固有の設定（双頭・翼・浮遊高さ・寸法・攻撃値）は dragon-configs.js に
// 置き、リグ本体へは埋め込まない。

const NECK_SEGMENTS = 7;
const TAIL_SEGMENTS = 11; // 隣同士の球が重なって連続した尾に見える密度
const FLAME_PARTICLES = 48; // 1つの頭あたりの炎パーティクル数（プール）

// 炎パーティクル用のやわらかい円のテクスチャ（プロシージャル・共有）。
let flameTexture = null;
function getFlameTexture() {
  if (flameTexture) return flameTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,240,200,0.9)");
  grad.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  flameTexture = new THREE.CanvasTexture(canvas);
  return flameTexture;
}

// 炎の色段階（寿命の進行 u=0..1 で 黄白 → オレンジ → 赤 → 煙色）。
const FLAME_STAGES = [
  [0.2, 0xfff6c8],
  [0.5, 0xffb04a],
  [0.75, 0xf06a2a],
  [1.01, 0x7a5a4a],
];

// 口から吹き出す炎のパーティクル噴射器。予兆（口元の光球と火の粉）と
// 放射（連続噴射＋点光源の明滅）を持つ。dragon-battle.js からは
// rig.setFlame(i, "telegraph" | "fire" | null) で従来どおり操作する。
class FlameJet {
  constructor(parent) {
    this.particles = [];
    for (let i = 0; i < FLAME_PARTICLES; i += 1) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getFlameTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0,
      }));
      sprite.visible = false;
      parent.add(sprite);
      this.particles.push({ sprite, age: 0, life: 0, vel: new THREE.Vector3() });
    }
    // 口元の光球（予兆で脈動し、放射中はまぶしく光る）。
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getFlameTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffc36a,
      opacity: 0,
    }));
    this.glow.visible = false;
    parent.add(this.glow);
    // 口元の点光源（放射中にオレンジで明滅して周囲を照らす）。
    this.light = new THREE.PointLight(0xff9a40, 0, 10, 1.7);
    this.light.visible = false;
    parent.add(this.light);

    this.phase = null;
    this.mouth = new THREE.Vector3();
    this.dir = new THREE.Vector3(0, 0, 1);
    this.emitAcc = 0;
    this.time = Math.random() * 10;
  }

  setPhase(phase) {
    this.phase = phase;
    if (!phase) {
      this.glow.visible = false;
      this.light.visible = false;
    }
  }

  setMouth(mouth, dir) {
    this.mouth.copy(mouth);
    this.dir.copy(dir);
  }

  spawnParticle(small) {
    const p = this.particles.find((q) => q.age >= q.life);
    if (!p) return;
    p.age = 0;
    p.life = small ? 0.25 + Math.random() * 0.15 : 0.35 + Math.random() * 0.25;
    p.small = small;
    p.sprite.position.copy(this.mouth);
    p.sprite.position.x += (Math.random() - 0.5) * 0.2;
    p.sprite.position.y += (Math.random() - 0.5) * 0.2;
    p.sprite.position.z += (Math.random() - 0.5) * 0.2;
    if (small) {
      // 予兆の火の粉: 口元でちらちら舞い上がる。
      p.vel.set((Math.random() - 0.5) * 1.2, 1.2 + Math.random() * 1.2, (Math.random() - 0.5) * 1.2);
    } else {
      // 放射: 口の向きへ勢いよく。扇状の拡散と、炎らしい浮力を足す。
      const speed = 6.5 + Math.random() * 3.5;
      const spread = 0.4;
      p.vel.set(
        this.dir.x * speed + (Math.random() - 0.5) * spread * speed,
        this.dir.y * speed + (Math.random() - 0.5) * spread * speed * 0.6 + 0.6,
        this.dir.z * speed + (Math.random() - 0.5) * spread * speed,
      );
    }
  }

  update(dt) {
    this.time += dt;
    // 予兆: 口元の光球が脈動し、火の粉が舞う。放射: 連続噴射＋光球とライトの明滅。
    if (this.phase === "telegraph") {
      this.glow.visible = true;
      this.glow.position.copy(this.mouth);
      const pulse = 0.55 + (Math.sin(this.time * 10) + 1) * 0.2;
      this.glow.scale.setScalar(pulse);
      this.glow.material.opacity = 0.85;
      this.light.visible = true;
      this.light.position.copy(this.mouth);
      this.light.intensity = 4 + Math.sin(this.time * 12) * 2;
      this.emitAcc += dt * 8;
    } else if (this.phase === "fire") {
      this.glow.visible = true;
      this.glow.position.copy(this.mouth);
      this.glow.scale.setScalar(1.1 + Math.random() * 0.25);
      this.glow.material.opacity = 1;
      this.light.visible = true;
      this.light.position.copy(this.mouth).addScaledVector(this.dir, 2.0);
      this.light.intensity = 11 + Math.random() * 6;
      this.emitAcc += dt * 70;
    }
    while (this.emitAcc >= 1) {
      this.emitAcc -= 1;
      this.spawnParticle(this.phase === "telegraph");
    }

    for (const p of this.particles) {
      if (p.age >= p.life) {
        p.sprite.visible = false;
        continue;
      }
      p.age += dt;
      const u = Math.min(1, p.age / p.life);
      p.vel.y += 1.6 * dt; // 炎の浮力（後半ほど上へ流れる）
      p.sprite.position.addScaledVector(p.vel, dt);
      const stage = FLAME_STAGES.find(([limit]) => u < limit);
      p.sprite.material.color.setHex(stage[1]);
      p.sprite.material.opacity = (1 - u) * (p.small ? 0.8 : 1);
      const size = p.small ? 0.22 + u * 0.2 : 0.5 + u * 1.4;
      p.sprite.scale.setScalar(size);
      p.sprite.visible = true;
    }
  }
}

// コウモリ型の翼（+X が外側、根元は x=0）。
// 前縁の腕骨 → 翼端、後縁は指の間の膜がスカラップ（弧のへこみ）を描く。
// 膜と骨（腕・3本の指）を別マテリアルで重ね、意匠を出す。
function buildWing(span, height, membraneMat, boneMat) {
  const wing = new THREE.Group();

  // 指先（膜の外周の頂点）と、その間の谷（根元側へ引いた制御点）。
  const tip = [span, height * 0.02]; // 翼端の爪
  const fingers = [
    [span * 0.68, -height * 0.52],
    [span * 0.4, -height * 0.62],
    [span * 0.14, -height * 0.5],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(0, height * 0.18); // 付け根の上端
  shape.quadraticCurveTo(span * 0.3, height * 0.55, span * 0.7, height * 0.34); // 腕の山
  shape.quadraticCurveTo(span * 0.92, height * 0.26, tip[0], tip[1]); // 翼端へ
  // 後縁: 指の間の膜（谷を根元側へ引いた凹みの連続）。
  shape.quadraticCurveTo(span * 0.78, -height * 0.2, fingers[0][0], fingers[0][1]);
  shape.quadraticCurveTo(span * 0.52, -height * 0.3, fingers[1][0], fingers[1][1]);
  shape.quadraticCurveTo(span * 0.24, -height * 0.28, fingers[2][0], fingers[2][1]);
  shape.quadraticCurveTo(span * 0.05, -height * 0.28, 0, -height * 0.18); // 付け根の下端
  shape.closePath();
  const membraneGeom = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
  membraneGeom.translate(0, 0, -0.03);
  wing.add(new THREE.Mesh(membraneGeom, membraneMat));

  // 骨: 前縁の腕と、付け根から各指先へ走る3本の指。
  const bone = (x0, y0, x1, y1, w) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, w, 0.1), boneMat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    m.rotation.z = Math.atan2(y1 - y0, x1 - x0);
    return m;
  };
  wing.add(bone(0, height * 0.14, span * 0.7, height * 0.34, 0.14)); // 腕
  wing.add(bone(span * 0.7, height * 0.34, tip[0], tip[1], 0.1)); // 翼端の骨
  for (const [fx, fy] of fingers) {
    wing.add(bone(span * 0.16, height * 0.05, fx, fy, 0.07)); // 指
  }
  return wing;
}

export class DragonRig {
  constructor(config) {
    this.config = config;
    this.group = new THREE.Group();

    // 胴体+手足（8方向ビルボード）。idle 2ポーズは持たないため同じシートをA/Bに渡す。
    this.body = new MonsterSprite({
      sheetAUrl: config.bodyUrl,
      sheetBUrl: config.bodyUrl,
      scale: config.bodyScale,
      tint: config.tint ?? 0xffffff,
    });
    this.group.add(this.body.group);

    const partMat = new THREE.MeshToonMaterial({ color: config.neckColor });

    // 頭（左右など、config.heads の取り付け位置ぶん）と、細長い首。
    this.heads = config.heads.map(() => {
      const sprite = new MonsterSprite({
        sheetAUrl: config.headUrl,
        sheetBUrl: config.headUrl,
        scale: config.headScale,
        tint: config.tint ?? 0xffffff,
      });
      this.group.add(sprite.group);
      const neck = [];
      for (let i = 0; i < NECK_SEGMENTS; i += 1) {
        const t = i / (NECK_SEGMENTS - 1);
        // 首の太さは頭の大きさに合わせ、根元を太く・先端へ向かって絞る。
        const r = (0.24 - t * 0.09) * config.headScale;
        const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), partMat);
        this.group.add(seg);
        neck.push(seg);
      }
      // 火炎の予兆・放射エフェクト（口から吹き出すパーティクルの炎）。
      const flame = new FlameJet(this.group);
      return { sprite, neck, flame, lunge: 0, dead: false };
    });

    // 翼（config.wings があるドラゴンだけ）。胴体の左右で羽ばたく。
    this.wings = [];
    if (config.wings) {
      const membraneMat = new THREE.MeshToonMaterial({
        color: config.wings.membraneColor ?? 0x3a4666,
        side: THREE.DoubleSide,
      });
      const boneMat = new THREE.MeshToonMaterial({ color: config.wings.boneColor ?? 0x161d30 });
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group(); // 付け根（yaw で外向きに回す）
        const flapGroup = new THREE.Group(); // 羽ばたき（付け根を軸に翼端を上下）
        const mesh = buildWing(config.wings.span, config.wings.height, membraneMat, boneMat);
        // 膜を約45度「寝かせる」（垂直の帆ではなく、上面が外へ倒れて左右へ
        // 広がる翼のシルエット。見下ろしカメラから翼の面が見える角度）。
        // 付け根の yaw が左右で180度違うため、同じ符号だと傾きがワールドで
        // 逆向きに出る — side で符号を反転させ、左右を鏡写しにする。
        mesh.rotation.x = (Math.PI / 4) * side;
        flapGroup.add(mesh);
        pivot.add(flapGroup);
        this.group.add(pivot);
        this.wings.push({ side, pivot, flapGroup, mesh });
      }
    }

    // 尾: 後方へ長い曲線を描くセグメント列。小さめの胴体でも目立つ太さにする。
    this.tail = [];
    for (let i = 0; i < TAIL_SEGMENTS; i += 1) {
      const t = i / (TAIL_SEGMENTS - 1);
      const r = (0.3 - t * 0.19) * config.bodyScale;
      const seg = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.08, r), 9, 7), partMat);
      this.group.add(seg);
      this.tail.push(seg);
    }

    this.facing = new THREE.Vector2(0, 1);
    this.time = Math.random() * 10;
  }

  // facing（ワールド方向）から、前方・右手方向のローカル基底を作る。
  basis() {
    const f = this.facing.clone().normalize();
    return { fx: f.x, fz: f.y, rx: f.y, rz: -f.x }; // r = 右手方向
  }

  headWorldPos(i, origin) {
    const { fx, fz, rx, rz } = this.basis();
    const m = this.config.heads[i];
    const h = this.heads[i];
    // 首のうねり: 取り付け位置から前方斜め下へスッと下がり、また戻る周期運動。
    // 頭ごとに別の周期を持たせ、揃ったりズレたりさせる（破壊された頭は動かない）。
    // ここに入れることで、当たり判定・火炎の口元・噛みつき距離も頭の実位置に追従する。
    const sw = m.swoop ?? { period: 3.2 + i * 1.3, down: 0.9, forward: 0.6 };
    const p = h.dead ? 0 : Math.max(0, Math.sin((this.time * Math.PI * 2) / sw.period + i * 2.1)) ** 2;
    const fwd = m.forward + h.lunge + p * (sw.forward ?? 0.6);
    return new THREE.Vector3(
      origin.x + rx * m.side + fx * fwd,
      origin.y + m.up - p * (sw.down ?? 0.9),
      origin.z + rz * m.side + fz * fwd,
    );
  }

  // origin = 胴体の足元中心（ワールド座標。飛行型は呼び出し側が浮遊高さを足す）。
  update(dt, origin, cameraYaw, moving) {
    this.time += dt;
    const c = this.config;
    const flying = !!c.wings;
    // 飛行型はゆったり上下に漂い、地上型は歩行で弾む。
    const bob = flying
      ? Math.sin(this.time * 1.4) * 0.22
      : moving
        ? Math.abs(Math.sin(this.time * 6)) * 0.12
        : Math.sin(this.time * 1.6) * 0.05;

    this.body.group.position.set(origin.x, origin.y + bob, origin.z);
    this.body.faceWorld(this.facing.x, this.facing.y, cameraYaw);
    this.body.mesh.rotation.y = cameraYaw;
    this.body.update(dt);

    const { fx, fz, rx, rz } = this.basis();
    // カメラの奥方向。ビルボード（頭・胴体）と3D部位（首・尾）の接続部を
    // 毎フレームこの向きへ押し込み、どの角度から見ても3D部位が絵の裏へ
    // 潜り込んで「つながって」見えるようにする。
    const camAway = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));

    // 翼: 胴体の左右の肩から外へ。羽ばたきは付け根の傾き。
    if (this.wings.length) {
      const flap = Math.sin(this.time * (c.wings.flapSpeed ?? 3)) * 0.55 + 0.15;
      for (const w of this.wings) {
        const sx = rx * w.side;
        const sz = rz * w.side;
        w.pivot.position.set(
          origin.x + sx * 0.35 * c.bodyScale,
          origin.y + bob + 0.75 * c.bodyScale,
          origin.z + sz * 0.35 * c.bodyScale,
        );
        // +X（翼の外向き）を自分の側のワールド外向きへ。
        w.pivot.rotation.y = Math.atan2(-sz, sx);
        w.flapGroup.rotation.z = flap; // 羽ばたき（付け根を軸に翼端を上下）
      }
    }

    // 尾: 胴体スプライトの内側（腰）から始めて後方へ長く垂らし、ゆっくり左右に振る。
    // 根元（t=0）を胴体へ食い込ませ、付け根が分離して見えないようにする。
    const wag = Math.sin(this.time * 1.8) * 0.7;
    for (let s = 0; s < this.tail.length; s += 1) {
      const t = s / (this.tail.length - 1);
      const back = (0.15 + t * 2.1) * c.bodyScale;
      const lateral = wag * t * t * c.bodyScale * 0.5;
      const droop = (flying ? -0.8 : -0.25) * t; // 飛行中は下へ流れる
      this.tail[s].position.set(
        origin.x - fx * back + rx * lateral,
        origin.y + bob + 0.5 * c.bodyScale + droop + Math.sin(this.time * 2 + t * 2.4) * 0.08,
        origin.z - fz * back + rz * lateral,
      );
      // 根元側はカメラの奥へ押し込み、胴体の絵の裏へつなげる。
      this.tail[s].position.addScaledVector(camAway, (1 - t) * 0.35);
    }

    // 頭と首。
    for (let i = 0; i < this.heads.length; i += 1) {
      const h = this.heads[i];
      const m = this.config.heads[i];
      const sway = h.dead ? 0 : Math.sin(this.time * 1.8 + i * 2.4) * 0.14;
      const target = this.headWorldPos(i, origin);
      target.x += rx * sway;
      target.z += rz * sway;
      target.y += bob + (h.dead ? -m.up * 0.55 : 0); // 破壊された頭は垂れる
      h.sprite.group.position.copy(target);
      h.sprite.faceWorld(this.facing.x, this.facing.y, cameraYaw);
      h.sprite.mesh.rotation.y = cameraYaw;
      h.sprite.update(dt);

      // 首: 胴体の最上部（スプライトの上端を覆う高さ）から、頭の真下まで
      // 外へ膨らむベジェ曲線に沿って球を並べる。
      // - 根元（t=0）は胴体の上端に食い込ませ、胴体の上部が首の後ろに見えないようにする。
      // - 終端（t=1）は頭スプライトの下半分に食い込ませ、頭が常に首の上へ乗って見えるようにする。
      const base = new THREE.Vector3(
        origin.x + rx * m.side * 0.15,
        origin.y + bob + 0.92 * c.bodyScale, // 胴体スプライトの上端
        origin.z + rz * m.side * 0.15,
      );
      const headBase = target.clone();
      headBase.y += 0.2 * c.headScale; // 頭スプライトの下半分の内側（首を食い込ませる）
      const controlSide = m.side >= 0 ? 1 : -1;
      const control = new THREE.Vector3(
        (base.x + headBase.x) / 2 + rx * controlSide * 0.5,
        (base.y + headBase.y) / 2 + 0.35,
        (base.z + headBase.z) / 2 + rz * controlSide * 0.5,
      );
      for (let s = 0; s < h.neck.length; s += 1) {
        const t = s / (h.neck.length - 1); // t=0（胴体上端）〜 t=1（頭の内側）
        // 2次ベジェ: (1-t)^2*base + 2(1-t)t*control + t^2*headBase
        const a = (1 - t) * (1 - t);
        const b = 2 * (1 - t) * t;
        const d = t * t;
        h.neck[s].position.set(
          a * base.x + b * control.x + d * headBase.x,
          a * base.y + b * control.y + d * headBase.y,
          a * base.z + b * control.z + d * headBase.z,
        );
        // 首の先端側はカメラの奥へ押し込み、頭の絵の裏へつなげる
        //（頭はビルボードなので、斜め・横から見た時のずれをこれで吸収する）。
        if (t > 0.6) h.neck[s].position.addScaledVector(camAway, (t - 0.6) * 1.1);
      }

      // 火炎エフェクト: 頭の口のあたり（スプライト中央やや下・前方）から吹き出す。
      {
        const mouth = target.clone();
        mouth.y += 0.42 * c.headScale;
        mouth.x += fx * 0.35;
        mouth.z += fz * 0.35;
        const dir = new THREE.Vector3(fx, -0.12, fz).normalize();
        h.flame.setMouth(mouth, dir);
        h.flame.update(dt);
      }
    }
  }

  setHeadDead(i) {
    this.heads[i].dead = true;
    this.heads[i].flame.setPhase(null);
    this.heads[i].sprite.material.color.setHex(0x777777);
  }

  // 予兆（口元の光球と火の粉）→ 放射（パーティクルの連続噴射）。
  setFlame(i, phase) {
    this.heads[i].flame.setPhase(phase);
  }

  dispose(scene) {
    scene.remove(this.group);
  }
}
