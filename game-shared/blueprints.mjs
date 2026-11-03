// 各編の設計図を共通の建築ルールで扱う。描画にはシーンを作ったゲームと同じ THREE を使う。
export function defineBlueprintManager({ THREE, blocks, blueprints, ghostColors, itemForBlock }) {
  return class BlueprintManager {
    constructor(world, scene) {
      this.world = world;
      this.scene = scene;
      this.active = null; // {id, name, cells: [{x,y,z,block,ghost}], group}
      this.onComplete = null;
      this.completed = new Set();
      world.onChange(() => this.refresh());
    }

    activate(id, anchor, baseY) {
      this.clear();
      const def = blueprints[id];
      const group = new THREE.Group();
      const cells = def.build().map((c) => {
        const x = anchor.x + c.dx;
        const y = baseY + c.dy;
        const z = anchor.z + c.dz;
        const mat = new THREE.MeshBasicMaterial({
          color: ghostColors[c.block] ?? 0xffffff,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
        });
        const ghost = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.92), mat);
        ghost.position.set(x + 0.5, y + 0.5, z + 0.5);
        // Edge wireframe drawn with depthTest off so a still-empty cell's outline is
        // visible THROUGH placed blocks (roof/walls) — the last hidden floor/interior
        // cells stay findable instead of being buried under the structure.
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(ghost.geometry),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthTest: false }),
        );
        edge.renderOrder = 6;
        ghost.add(edge);
        group.add(ghost);
        return { x, y, z, block: c.block, ghost };
      });

      // Locator beacon: a tall soft beam of light at the footprint centre so the
      // build site is findable from across the island (blueprints sit at fixed
      // spots that can be far from the player when they activate).
      let sx = 0, sz = 0;
      for (const c of cells) {
        sx += c.x;
        sz += c.z;
      }
      const cx = sx / cells.length + 0.5;
      const cz = sz / cells.length + 0.5;
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.6, 24, 10, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xffe08a,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      beam.position.set(cx, baseY + 12, cz);
      beam.renderOrder = 3;
      group.add(beam);

      this.scene.add(group);
      // baseY is persisted in the save so a reload re-anchors at exactly the same
      // height it was first activated at (never recomputed from mutable terrain).
      this.active = { id, name: def.name, cells, group, beam, baseY, done: false };
      this.refresh();
      return this.active;
    }

    clear() {
      if (this.active) {
        this.scene.remove(this.active.group);
        this.active = null;
      }
    }

    // A cell is satisfied when the world block matches the requirement. Cells that
    // are blocked by a wrong solid block (e.g. an existing solid block) are
    // flagged as obstacles and coloured red so the player knows to clear them.
    refresh() {
      const bp = this.active;
      if (!bp || bp.done) return;
      let remaining = 0;
      for (const cell of bp.cells) {
        const world = this.world.get(cell.x, cell.y, cell.z);
        const ok = world === cell.block;
        cell.ghost.visible = !ok;
        const obstacle = !ok && world !== blocks.AIR && world !== blocks.WATER;
        cell.obstacle = obstacle;
        cell.ghost.material.color.setHex(obstacle ? 0xff5a4a : ghostColors[cell.block] ?? 0xffffff);
        // Edge wireframe (drawn through walls): red for obstacles, gold otherwise.
        const edge = cell.ghost.children[0];
        if (edge) edge.material.color.setHex(obstacle ? 0xff5a4a : 0xffe08a);
        if (!ok) remaining += 1;
      }
      if (remaining === 0) {
        bp.done = true;
        this.completed.add(bp.id);
        const id = bp.id;
        this.clear();
        if (this.onComplete) this.onComplete(id);
      }
    }

    // Ghost cell at a world position (so placement can auto-match requirements).
    requiredAt(x, y, z) {
      if (!this.active) return null;
      return this.active.cells.find((c) => c.x === x && c.y === y && c.z === z && this.world.get(x, y, z) !== c.block) ?? null;
    }

    // Remaining material list: {itemId: count}
    remainingMaterials() {
      if (!this.active) return null;
      const out = new Map();
      for (const cell of this.active.cells) {
        if (this.world.get(cell.x, cell.y, cell.z) === cell.block) continue;
        const item = itemForBlock(cell.block);
        if (!item) continue;
        out.set(item, (out.get(item) ?? 0) + 1);
      }
      return out;
    }

    update(time) {
      if (!this.active) return;
      const pulse = 0.22 + (Math.sin(time * 3) + 1) * 0.09;
      const obstaclePulse = 0.4 + (Math.sin(time * 6) + 1) * 0.15; // brighter, faster = "clear me"
      for (const cell of this.active.cells) {
        if (cell.ghost.visible) cell.ghost.material.opacity = cell.obstacle ? obstaclePulse : pulse;
      }
      if (this.active.beam) {
        this.active.beam.material.opacity = 0.22 + (Math.sin(time * 2) + 1) * 0.07;
        this.active.beam.rotation.y = time * 0.3;
      }
    }
  };
}
