import * as THREE from "three";
import { B } from "../world/blocks.js";
import { SFX } from "../game/sfx.js";

// 大型対空ボウガン（docs/DESIGN.md の「9. ヴァルガ戦」）。射台のボウガンを調べて乗り、
// A・D（←→）で向きを変え、マウスで狙い、クリックで大矢を撃つ。F・Esc・右クリックで降りる。
// 矢は少しだけ落ちながらまっすぐ飛び、ヴァルガの翼・胴に当たると main.varuga へ知らせる。

const TURN_SPEED = 1.5; // rad/秒
const RELOAD = 1.2;
const BOLT_SPEED = 44;
const BOLT_LIFE = 2.4;
const BOLT_GRAVITY = -3.5;
const CAMERA_BACK = 4.2;
const CAMERA_UP = 2.4;
const CAMERA_PITCH = 0.32; // 見上げる角度（rad）

export class Ballista {
  constructor(game) {
    this.game = game;
    this.cell = null; // 設置されているマス（ワールドの変更に追従）
    this.mounted = false;
    this.yaw = Math.PI; // 0 = +z（南）を向く。既定は北ではなく、前庭と海の側
    this.cooldown = 0;
    this.bolts = [];
    this.boltGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
    this.boltGeometry.rotateX(Math.PI / 2);
    this.boltMaterial = new THREE.MeshBasicMaterial({ color: 0x3d4147 });
    this.tipMaterial = new THREE.MeshBasicMaterial({ color: 0xd7dde2 });
    this.aimPoint = new THREE.Vector3();
  }

  clearIndex() {
    this.cell = null;
  }

  indexCell(id, x, y, z) {
    if (id === B.GREAT_BALLISTA) this.cell = { x, y, z };
  }

  onWorldChange(x, y, z, id, prev) {
    if (id === B.GREAT_BALLISTA) this.cell = { x, y, z };
    else if (prev === B.GREAT_BALLISTA && this.cell && this.cell.x === x && this.cell.y === y && this.cell.z === z) {
      this.cell = null;
      this.dismount();
    }
  }

  // 砲口の位置。
  muzzle() {
    const c = this.cell;
    return new THREE.Vector3(c.x + 0.5, c.y + 1.1, c.z + 0.5);
  }

  mount() {
    if (!this.cell || this.mounted) return;
    const g = this.game;
    this.mounted = true;
    // 竜がいればそちらへ、いなければ前庭の中央へ向ける。
    const m = this.muzzle();
    const t = g.varuga.active ? g.varuga.pos : new THREE.Vector3(32.5, 0, 46.5);
    this.yaw = Math.atan2(t.x - m.x, t.z - m.z);
    g.ui.setAim(true, this.hint());
    SFX.place();
  }

  dismount() {
    if (!this.mounted) return;
    this.mounted = false;
    this.game.ui.setAim(false);
  }

  hint() {
    const n = this.game.inventory.count("great_bolt");
    return `🎯 大型対空ボウガン　大矢 ${n}本　｜　A・D／←→: 向き　クリック: 発射　F・Esc: 降りる`;
  }

  // 乗っている間の入力（main.handleInput から。通常の移動・攻撃の代わり）。
  handleInput(dt, input) {
    const g = this.game;
    const turn = (input.down("a") || input.down("arrowleft") ? 1 : 0) - (input.down("d") || input.down("arrowright") ? 1 : 0);
    this.yaw += turn * TURN_SPEED * dt;
    if (input.pressed("f") || input.rawButtonPressed(2)) {
      this.dismount();
      return;
    }
    if (input.buttonPressed(0)) this.fire();
    g.ui.setAim(true, this.hint());
  }

  // 乗っている間のカメラ（砲の後ろ上から、向いている方を少し見上げる）。
  placeCamera(camera) {
    const m = this.muzzle();
    const dir = new THREE.Vector3(Math.sin(this.yaw) * Math.cos(CAMERA_PITCH), Math.sin(CAMERA_PITCH), Math.cos(this.yaw) * Math.cos(CAMERA_PITCH));
    const pos = m.clone().addScaledVector(dir, -CAMERA_BACK);
    pos.y += CAMERA_UP;
    camera.position.lerp(pos, 0.35);
    camera.lookAt(m.clone().addScaledVector(dir, 14));
  }

  fire() {
    const g = this.game;
    if (this.cooldown > 0) return;
    if (!g.inventory.has("great_bolt", 1)) {
      g.throttledToast("greatbolt", "🎯 大矢が無い！（炉で 木材1・鉄1 から3本）");
      return;
    }
    g.inventory.remove("great_bolt", 1);
    this.cooldown = RELOAD;
    // カーソルの先（カメラから見た遠くの点）へ、砲口から撃つ。
    g.raycaster.setFromCamera({ x: g.input.mouse.ndcX, y: g.input.mouse.ndcY }, g.camera);
    const ray = g.raycaster.ray;
    this.aimPoint.copy(ray.origin).addScaledVector(ray.direction, 60);
    const from = this.muzzle();
    const dir = this.aimPoint.clone().sub(from).normalize();
    const mesh = new THREE.Group();
    const shaft = new THREE.Mesh(this.boltGeometry, this.boltMaterial);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), this.tipMaterial);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.85;
    mesh.add(shaft, tip);
    mesh.position.copy(from);
    g.scene.add(mesh);
    this.bolts.push({ mesh, pos: from.clone(), vel: dir.multiplyScalar(BOLT_SPEED), life: BOLT_LIFE });
    SFX.swing();
  }

  update(dt) {
    const g = this.game;
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (const bolt of [...this.bolts]) {
      bolt.life -= dt;
      const prev = bolt.pos.clone();
      bolt.vel.y += BOLT_GRAVITY * dt;
      bolt.pos.addScaledVector(bolt.vel, dt);
      bolt.mesh.position.copy(bolt.pos);
      bolt.mesh.lookAt(bolt.pos.clone().add(bolt.vel));
      let done = bolt.life <= 0;
      if (!done && g.varuga.active && g.varuga.hitByBolt(prev, bolt.pos)) done = true;
      if (!done) {
        // 地形に刺さったら消える。
        const id = g.world.get(Math.floor(bolt.pos.x), Math.floor(bolt.pos.y), Math.floor(bolt.pos.z));
        if (id !== B.AIR && id !== B.WATER && id !== B.GREAT_BALLISTA && id !== B.FENCE) done = true;
      }
      if (done) {
        g.scene.remove(bolt.mesh);
        this.bolts.splice(this.bolts.indexOf(bolt), 1);
      }
    }
  }

  // 飛んでいる矢を片づける（敗北からの復元など）。
  clearBolts() {
    for (const bolt of this.bolts) this.game.scene.remove(bolt.mesh);
    this.bolts = [];
  }
}
