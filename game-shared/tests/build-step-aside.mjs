// 設計図のマスに住民が立っていても置けることを、両編の e2e テストから確かめる。
// game-shared/build-clearance.mjs と各編の fillGhostCell の組み合わせを、実際のゲームで検査する。
// どちらの関数も1回の page.evaluate の中で完結させ、検査の途中にフレームが進まないようにする。

// solid: 住民がよける固いブロックのマス、passThrough: 住民がいても置ける通り抜けのマス。
// どちらも { x, y, z, item }。住民がいなければ spawnAt に出し、cleanup で片付ける。
export async function checkStepAside(page, { villagerId, solid, passThrough, spawnAt, cleanup = false }) {
  return page.evaluate(({ villagerId, solid, passThrough, spawnAt, cleanup }) => {
    const g = window.__game;
    const bp = g.blueprints.active;
    const blocks = (e, c, p = e.pos) =>
      Math.abs(p.x - (c.x + 0.5)) < e.halfW + 0.5 &&
      Math.abs(p.z - (c.z + 0.5)) < e.halfW + 0.5 &&
      p.y < c.y + 1 &&
      p.y + e.height > c.y;
    const spawned = !g.villager(villagerId);
    const v = g.villager(villagerId) ?? g.spawnVillager(villagerId, spawnAt.x, spawnAt.z);
    const savedPlayer = g.player.pos.clone();
    g.player.pos.set(solid.x + 0.5, solid.y + 40, solid.z + 0.5); // 主人公は判定から外しておく
    const standOn = (c) => {
      v.pos.set(c.x + 0.5, c.y + 0.001, c.z + 0.5);
      v.vel.set(0, 0, 0);
    };
    const clear = (c) => {
      if (g.world.get(c.x, c.y, c.z) !== 0) g.world.set(c.x, c.y, c.z, 0);
    };
    const out = {};

    // 魔物が立つマスには、今までどおり置けない（材料も減らない）。
    clear(solid);
    g.inventory.add(solid.item, 2);
    const fake = { pos: { x: solid.x + 0.5, y: solid.y + 0.001, z: solid.z + 0.5 }, halfW: 0.4, height: 1, dead: false };
    g.monsters.monsters.push(fake);
    const matsBeforeMonster = g.inventory.count(solid.item);
    standOn({ x: solid.x + 3, y: solid.y, z: solid.z + 3 });
    g.fillGhostCell(bp.cells.find((c) => c.x === solid.x && c.y === solid.y && c.z === solid.z));
    g.monsters.monsters.splice(g.monsters.monsters.indexOf(fake), 1);
    out.monsterBlocked = g.world.get(solid.x, solid.y, solid.z) === 0;
    out.monsterKeptMats = g.inventory.count(solid.item) === matsBeforeMonster;

    // 固いブロック: 住民は近くへよけ、ブロックが置かれ、材料が1つ減る。
    const solidCell = bp.cells.find((c) => c.x === solid.x && c.y === solid.y && c.z === solid.z);
    standOn(solid);
    out.blockedBefore = blocks(v, solid);
    const matsBefore = g.inventory.count(solid.item);
    g.fillGhostCell(solidCell);
    out.solidPlaced = g.world.get(solid.x, solid.y, solid.z) === solidCell.block;
    out.usedOne = g.inventory.count(solid.item) === matsBefore - 1;
    out.movedOff = !blocks(v, solid);
    out.inSolid = v.collides(g.world, v.pos.x, v.pos.y, v.pos.z);
    out.onGround = v.collides(g.world, v.pos.x, v.pos.y - 0.05, v.pos.z);
    out.inWater = g.world.get(Math.floor(v.pos.x), Math.floor(v.pos.y + 0.3), Math.floor(v.pos.z)) === 5;
    out.stepDistance = Math.hypot(v.pos.x - (solid.x + 0.5), v.pos.z - (solid.z + 0.5));
    out.onRemaining = (g.blueprints.active?.cells ?? [])
      .filter((c) => g.world.get(c.x, c.y, c.z) !== c.block && blocks(v, c))
      .map((c) => `${c.x},${c.y},${c.z}`);

    // 通り抜けられるブロック: 住民は動かず、そのまま置かれる。
    const passCell = bp.cells.find((c) => c.x === passThrough.x && c.y === passThrough.y && c.z === passThrough.z);
    clear(passThrough);
    g.inventory.add(passThrough.item, 1);
    standOn(passThrough);
    const stood = { x: v.pos.x, z: v.pos.z };
    g.fillGhostCell(passCell);
    out.passPlaced = g.world.get(passThrough.x, passThrough.y, passThrough.z) === passCell.block;
    out.passStayed = v.pos.x === stood.x && v.pos.z === stood.z;

    g.player.pos.copy(savedPlayer);
    if (cleanup && spawned) {
      g.scene.remove(v.root);
      g.villagers.splice(g.villagers.indexOf(v), 1);
    }
    return out;
  }, { villagerId, solid, passThrough, spawnAt, cleanup });
}

// 料理番の持ち場（かまど・鉄鍋の東隣）が設計図のマスに掛からず、
// 鍋の前（ちゃぶ台）に立たれていてもちゃぶ台を置けることを確かめる。
// stove/table: { x, y, z, item }、standPos: 持ち場を返すゲームのメソッド名。
export async function checkCookStand(page, { villagerId, stove, table, standPos }) {
  return page.evaluate(({ villagerId, stove, table, standPos }) => {
    const g = window.__game;
    const bp = g.blueprints.active;
    const v = g.villager(villagerId);
    const at = (c) => bp.cells.find((k) => k.x === c.x && k.y === c.y && k.z === c.z);
    const blocks = (e, c, p = e.pos) =>
      Math.abs(p.x - (c.x + 0.5)) < e.halfW + 0.5 &&
      Math.abs(p.z - (c.z + 0.5)) < e.halfW + 0.5 &&
      p.y < c.y + 1 &&
      p.y + e.height > c.y;
    const savedPlayer = g.player.pos.clone();
    g.player.pos.set(stove.x + 0.5, stove.y + 40, stove.z + 0.5);
    const out = { id: bp.id };
    for (const c of [stove, table]) {
      if (g.world.get(c.x, c.y, c.z) !== 0) g.world.set(c.x, c.y, c.z, 0);
      g.inventory.add(c.item, 1);
    }
    v.pos.set(stove.x + 3.5, stove.y + 0.001, stove.z + 3.5); // 鍋を置くあいだは離れておく
    g.fillGhostCell(at(stove));
    out.stovePlaced = g.world.get(stove.x, stove.y, stove.z) === at(stove).block;

    const p = g[standPos]();
    out.stand = p;
    const probe = { x: p.x, y: stove.y + 0.001, z: p.z };
    out.standBlocks = bp.cells.filter((c) => blocks(v, c, probe)).map((c) => `${c.x},${c.y},${c.z}`);
    out.standSolid = g.world.isSolidAt(Math.floor(p.x), stove.y, Math.floor(p.z), "villager");

    // 以前の持ち場（鍋の前＝ちゃぶ台）に立っていても、ちゃぶ台を置ける。
    v.pos.set(table.x + 0.5, table.y + 0.001, table.z + 0.5);
    v.vel.set(0, 0, 0);
    g.fillGhostCell(at(table));
    out.tablePlaced = g.world.get(table.x, table.y, table.z) === at(table).block;
    out.movedOff = !blocks(v, table);
    out.inSolid = v.collides(g.world, v.pos.x, v.pos.y, v.pos.z);
    g.player.pos.copy(savedPlayer);
    return out;
  }, { villagerId, stove, table, standPos });
}
