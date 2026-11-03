import * as THREE from "three";
import { B, drawTileIcon } from "./blocks.js";
import { createPropModels } from "./prop-models.js";
import { WORLD } from "./world.js";
import { cellKey } from "../core/utils.js";

// Prop blocks are rendered as individual little meshes. Builders return a group
// whose origin sits at the cell's min corner ground center (x+0.5, y, z+0.5).

const MAT = {
  steel: new THREE.MeshToonMaterial({ color: 0xaeb6bb }),
};

const BUILDERS = {
  [B.FISH_SPOT]() {
    const g = new THREE.Group();
    const tileMat = new THREE.MeshBasicMaterial({
      color: 0x4a8cdd,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    const tile = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.04, 1.04), tileMat);
    tile.position.y = 0.02;
    g.add(tile);

    // 水面の波紋と背びれ。sway で揺らす。
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.58, depthWrite: false });
    for (const r of [0.18, 0.32]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.04, 20), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.045;
      g.add(ring);
    }
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), MAT.steel);
    fin.position.y = 0.14;
    fin.rotation.z = 0.35;
    g.add(fin);
    g.userData.sway = true;
    return g;
  },
};

// 作り直した設置物は Storybook_Character_Studio/prototypes/props-3d/ の原本から
// 書き出した prop-models.js で作る（輪郭線つき・ブロック模様を貼った基本形状）。
// 原本にまだ無い設置物は、上の BUILDERS のまま。
const propTiles = new Map();
function propTile(name) {
  if (!propTiles.has(name)) {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    drawTileIcon(canvas.getContext("2d"), name, 0, 0, 16);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    propTiles.set(name, texture);
  }
  return propTiles.get(name);
}
const PROP_MODELS = createPropModels(THREE, { tile: propTile, spikes: "iron", grain: "volcano" });
// 柵は隣の柵・扉へ横木を渡すので、隣のマスを ctx.connects で教える。
for (const [name, build] of Object.entries(PROP_MODELS)) {
  if (B[name] === undefined) continue;
  BUILDERS[B[name]] = (world, x, y, z) => build({
    connects: (dx, dz) => {
      const id = world.get(x + dx, y, z + dz);
      return id === B.FENCE || id === B.DOOR;
    },
  });
}
const MAX_TORCH_LIGHTS = 8;

export class PropRenderer {
  constructor(world, scene) {
    this.world = world;
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.props = new Map(); // cellKey -> group
    this.time = 0;
    this.lightPool = [];
    for (let i = 0; i < MAX_TORCH_LIGHTS; i += 1) {
      const light = new THREE.PointLight(0xffa54f, 0, 7, 1.6);
      light.visible = false;
      scene.add(light);
      this.lightPool.push(light);
    }
    this.lightTimer = 0;

    world.onChange((x, y, z, id, prev) => {
      this.syncCell(x, y, z);
      // Fences/doors connect visually to neighbours.
      if ([id, prev].some((v) => v === B.FENCE || v === B.DOOR)) {
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (this.world.get(x + dx, y, z + dz) === B.FENCE) this.syncCell(x + dx, y, z + dz);
        }
      }
    });
    this.buildAll();
  }

  buildAll() {
    for (let z = 0; z < WORLD.D; z += 1) {
      for (let x = 0; x < WORLD.W; x += 1) {
        for (let y = 0; y < WORLD.H; y += 1) {
          if (BUILDERS[this.world.get(x, y, z)]) this.syncCell(x, y, z);
        }
      }
    }
  }

  // Full rebuild after bulk world edits (e.g. loading a save).
  rebuildAll() {
    for (const prop of this.props.values()) this.group.remove(prop);
    this.props.clear();
    this.buildAll();
  }

  syncCell(x, y, z) {
    const key = cellKey(x, y, z);
    const existing = this.props.get(key);
    if (existing) {
      this.group.remove(existing);
      this.props.delete(key);
    }
    const id = this.world.get(x, y, z);
    const builder = BUILDERS[id];
    if (!builder) return;
    const prop = builder(this.world, x, y, z);
    prop.position.set(x + 0.5, y, z + 0.5);
    prop.userData.cell = { x, y, z };
    prop.userData.blockId = id;
    this.group.add(prop);
    this.props.set(key, prop);
  }

  update(dt, playerPos, isNight) {
    this.time += dt;
    for (const prop of this.props.values()) {
      if (prop.userData.door) {
        const hinge = prop.getObjectByName("hinge");
        const d = Math.hypot(prop.position.x - playerPos.x, prop.position.z - playerPos.z);
        const target = d < 1.6 ? -Math.PI / 2.2 : 0;
        hinge.rotation.y += (target - hinge.rotation.y) * Math.min(1, dt * 8);
      }
      if (prop.userData.banner) {
        const flag = prop.getObjectByName("flag");
        const positions = flag.geometry.attributes.position;
        for (let i = 0; i < positions.count; i += 1) {
          const x = positions.getX(i);
          positions.setZ(i, Math.sin(this.time * 4 + x * 3.5) * 0.06 * (x + 0.45));
        }
        positions.needsUpdate = true;
      }
      if (prop.userData.sway) {
        prop.rotation.z = Math.sin(this.time * 1.8 + prop.position.x) * 0.05;
      }
      if (prop.userData.torch) {
        const flame = prop.getObjectByName("flame");
        if (flame) {
          const s = 1 + Math.sin(this.time * 9 + prop.position.x * 7) * 0.18;
          flame.scale.set(s, 1.15 - s * 0.15, s);
        }
      }
    }

    // Reassign the point-light pool to the torches nearest the player (throttled).
    this.lightTimer -= dt;
    if (this.lightTimer <= 0) {
      this.lightTimer = 0.5;
      const torches = [];
      for (const prop of this.props.values()) {
        if (!prop.userData.torch) continue;
        const d = prop.position.distanceToSquared(playerPos);
        torches.push([d, prop]);
      }
      torches.sort((a, b) => a[0] - b[0]);
      for (let i = 0; i < this.lightPool.length; i += 1) {
        const light = this.lightPool[i];
        if (i < torches.length) {
          const prop = torches[i][1];
          light.position.set(prop.position.x, prop.position.y + 0.8, prop.position.z);
          light.visible = true;
          light.intensity = isNight ? 14 : 5;
        } else {
          light.visible = false;
        }
      }
    }
  }
}
