import { cellInReach } from "./blueprint-target.mjs";

const TALK_REACH = 2.6;
const FACING_REACH = 2.6;
const ACTIONS = {
  storage: "を開く", craft: "を使う", cook: "を使う", kiln: "を使う", forge: "を使う",
  sleep: "で休む", harvest: "を収穫する", altar: "を調べる", banner: "を調べる",
  taint: "を調べる", pillar: "を調べる", wedge: "を調べる", keystone_rock: "を調べる",
  crossbow: "に矢を補充する", ballista: "に乗る",
};

// F はマウスと無関係に、正面±60度の近い対象を選ぶ。壁の判定は呼び出し側で行う。
export function chooseFacingTarget(candidates, pos, facing, visible) {
  let best = null;
  let bestScore = Infinity;
  const facingLength = Math.hypot(facing.x, facing.y);
  for (const target of candidates) {
    const dx = target.point.x - pos.x, dz = target.point.z - pos.z;
    const horizontal = Math.hypot(dx, dz);
    const distance = Math.hypot(dx, target.point.y - (pos.y + 0.6), dz);
    if (distance > FACING_REACH) continue;
    const dot = horizontal < 0.01 ? 1 : facingLength > 0
      ? Math.min(1, (dx * facing.x + dz * facing.y) / (horizontal * facingLength)) : -1;
    if (dot < 0.5 || !visible(target)) continue;
    // 範囲は高さ込みで制限し、選び分けは床面上の距離・向きで行う。
    // 同じ位置のベッドと病人は、先に渡された人物を選ぶ。
    const score = horizontal + (1 - dot) * 1.5;
    if (score < bestScore) { best = target; bestScore = score; }
  }
  return best;
}

// 各編と同じ THREE を受け取り、対象選択・枠・操作案内を一つの結果から作る。
// 会話や設備の実際の動作は各編の interact() が担当する。
export class InteractionTargets {
  constructor({ THREE, game, blockDefs, reach }) {
    this.THREE = THREE;
    this.game = game;
    this.blockDefs = blockDefs;
    this.reach = reach;
    this.raycaster = new THREE.Raycaster();
    this.pixels = new WeakMap();
    this.pointerTarget = null;
    this.facingTarget = null;
    this.hint = document.createElement("div");
    this.hint.className = "interaction-hints";
    this.hint.hidden = true;
    this.hint.setAttribute("aria-live", "polite");
    this.rows = ["pointer", "facing"].map((kind) => {
      const row = document.createElement("div");
      row.className = `interaction-hint ${kind}`;
      this.hint.append(row);
      return row;
    });
    game.ui.root.append(this.hint);
    this.outlines = [0xffdf72, 0x83dfff].map((color) => {
      const outline = new THREE.Box3Helper(new THREE.Box3(), color);
      outline.material.transparent = true;
      outline.material.opacity = 0.9;
      outline.material.depthWrite = false;
      outline.visible = false;
      game.scene.add(outline);
      return outline;
    });
  }

  get enabled() {
    const g = this.game;
    return g.started && !g.ui.modalOpen && !g.quests.busy && !g.ballista?.mounted;
  }

  villagerTarget(v) {
    return {
      kind: "villager", key: `villager:${v.id}`, villager: v,
      point: v.pos.clone().add({ x: 0, y: v.down ? 0.3 : 0.6, z: 0 }),
      label: `${v.def.name}と話す`,
    };
  }

  propTarget(x, y, z, id) {
    const def = this.blockDefs[id];
    if (!def?.interact) return null;
    return {
      kind: "prop", key: `prop:${x},${y},${z}`, cell: { x, y, z }, id,
      point: new this.THREE.Vector3(x + 0.5, y + 0.5, z + 0.5),
      label: `${def.name}${ACTIONS[def.interact] ?? "を調べる"}`,
    };
  }

  // three.js の raycast は透明画素も拾うため、描いている画素だけを選択対象にする。
  // 名前の余白、影、隠れた面、輪郭の裏面が隣の箱を奪わないようにする。
  visiblePixel(hit) {
    const obj = hit.object;
    for (let p = obj; p; p = p.parent) if (!p.visible) return false;
    const material = Array.isArray(obj.material) ? obj.material[hit.face?.materialIndex ?? 0] : obj.material;
    if (!material || !material.visible || !material.colorWrite || material.opacity <= 0) return false;
    const texture = material.map;
    if (!texture || !hit.uv) return true;
    const source = texture.image;
    if (!source?.width || !source?.height) return false;
    let pixels = this.pixels.get(source);
    if (!pixels) {
      const canvas = document.createElement("canvas");
      canvas.width = source.width; canvas.height = source.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(source, 0, 0);
      pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.pixels.set(source, pixels);
    }
    texture.updateMatrix();
    const uv = texture.transformUv(hit.uv.clone());
    const x = Math.min(pixels.width - 1, Math.max(0, Math.floor(uv.x * pixels.width)));
    const y = Math.min(pixels.height - 1, Math.max(0, Math.floor(uv.y * pixels.height)));
    return pixels.data[(y * pixels.width + x) * 4 + 3] / 255 * material.opacity >= Math.max(0.2, material.alphaTest);
  }

  visibleFromPlayer(target) {
    const g = this.game;
    const start = g.player.pos.clone(); start.y += 0.8;
    const delta = target.point.clone().sub(start);
    const length = delta.length();
    if (length < 0.01) return true;
    // ベッドや稲など、人物が入れる設備を壁として扱わない。
    const hit = g.world.raycast(start, delta.divideScalar(length), length, id => this.blockDefs[id]?.solid === true);
    if (!hit || hit.dist >= length - 0.05) return true;
    return target.kind === "prop" && hit.x === target.cell.x && hit.y === target.cell.y && hit.z === target.cell.z;
  }

  pickPointer() {
    const g = this.game;
    if (!g.input.mouse.inside) return null;
    this.raycaster.setFromCamera({ x: g.input.mouse.ndcX, y: g.input.mouse.ndcY }, g.camera);
    const ray = this.raycaster.ray;
    const block = g.world.raycast(ray.origin, ray.direction, 80);
    const obstacle = block && this.blockDefs[block.id]?.solid === true ? block
      : g.world.raycast(ray.origin, ray.direction, 80, id => this.blockDefs[id]?.solid === true);
    let nearest = null;
    let distance = obstacle?.dist ?? 80;
    for (const v of g.villagers) {
      if (!v.root.visible) continue;
      // 姿勢の変わる実際のリグを使うので、倒れたワタリや病人にも話しかけられる。
      const hits = this.raycaster.intersectObjects([v.rig.group, v.nameLabel], true);
      for (const hit of hits) {
        if (hit.distance >= distance || !this.visiblePixel(hit)) continue;
        nearest = v; distance = hit.distance;
        break;
      }
    }
    if (nearest) {
      const target = this.villagerTarget(nearest);
      return nearest.pos.distanceTo(g.player.pos) < TALK_REACH && this.visibleFromPlayer(target) ? target : null;
    }
    if (!block || !cellInReach(block, g.player.pos, this.reach)) return null;
    const target = this.propTarget(block.x, block.y, block.z, block.id);
    return target && this.visibleFromPlayer(target) ? target : null;
  }

  pickFacing() {
    const g = this.game;
    const candidates = g.villagers.filter((v) => v.root.visible && v.pos.distanceTo(g.player.pos) < TALK_REACH)
      .map((v) => this.villagerTarget(v));
    const p = g.player.pos;
    for (let x = Math.floor(p.x - FACING_REACH); x <= Math.floor(p.x + FACING_REACH); x += 1) {
      for (let z = Math.floor(p.z - FACING_REACH); z <= Math.floor(p.z + FACING_REACH); z += 1) {
        for (let y = Math.floor(p.y - 2); y <= Math.floor(p.y + 2); y += 1) {
          if (!g.world.inBounds(x, y, z)) continue;
          const target = this.propTarget(x, y, z, g.world.get(x, y, z));
          if (target) candidates.push(target);
        }
      }
    }
    return chooseFacingTarget(candidates, p, g.player.facing, (t) => this.visibleFromPlayer(t));
  }

  update() {
    this.pointerTarget = null; this.facingTarget = null;
    this.hint.hidden = true;
    for (const outline of this.outlines) outline.visible = false;
    if (!this.enabled) return;
    const g = this.game;
    g.camera.updateMatrixWorld();
    for (const v of g.villagers) v.root.updateWorldMatrix(true, true);
    this.pointerTarget = this.pickPointer();
    this.facingTarget = this.pickFacing();
    const targets = [this.pointerTarget, this.facingTarget];
    const same = targets[0] && targets[0].key === targets[1]?.key;
    targets.forEach((target, i) => {
      const row = this.rows[i];
      row.hidden = !target || (i === 1 && same);
      if (row.hidden) { row.textContent = ""; delete row.dataset.target; return; }
      this.hint.hidden = false;
      row.dataset.target = target.key;
      const label = `${i === 0 ? (same ? "右クリック / F" : "右クリック") : "F"}：${target.label}`;
      if (row.textContent !== label) row.textContent = label;
      const box = this.outlines[i].box;
      if (target.kind === "villager") box.setFromObject(target.villager.rig.group);
      else {
        const { x, y, z } = target.cell;
        box.min.set(x, y, z); box.max.set(x + 1, y + 1, z + 1);
      }
      box.expandByScalar(0.04);
      this.outlines[i].visible = true;
    });
  }
}
