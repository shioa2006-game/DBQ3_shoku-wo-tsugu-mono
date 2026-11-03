// 設計図まわりの回帰テスト。
// - ゴースト直接クリックのオートスナップ（実マウス経路）
// - 材料不足時は設置されない
// - 障害物セルの赤フラグ
// - ハンマー選択中は破壊優先（オートスナップ無効）
// - 橋の水中橋脚をゴーストクリックで設置できる
// - 全マス充填で設計図が完成扱いになる

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";
import { aimAtCell } from "../../../game-shared/tests/aim-at-cell.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // ストーリーに依存せず、平地に小屋の設計図を直接起動する。
  const setup = await page.evaluate(() => {
    const g = window.__game;
    const P = { x: 20, z: 20 };
    const baseY = g.world.terrainSurfaceY(P.x + 2, P.z + 2);
    const bp = g.blueprints.activate("hut", P, baseY);
    g.inventory.add("wall", 40);
    g.inventory.add("plank", 20);
    g.inventory.add("door", 3);
    g.inventory.add("bed", 4);
    g.inventory.add("hammer_wood", 1);
    g.inventory.selected = g.inventory.slots.findIndex((s) => s?.id === "wall");
    const wall = bp.cells
      .filter((c) => c.block === 10 && g.world.get(c.x, c.y, c.z) === 0 && c.y === baseY)
      .sort((a, b) => a.y - b.y)[0];
    g.player.pos.set(wall.x + 1.6, baseY + 0.1, wall.z + 0.5);
    return { wall: { x: wall.x, y: wall.y, z: wall.z }, baseY };
  });
  // 小屋では輪郭が重なる。クリック前後で同じ最前面のセルを検証する。
  const sp = await aimAtCell(page, setup.wall, { allowOverlap: true });

  // --- ブロック所持: オートスナップがゴーストを狙う -----------------------------
  const caseBlock = await page.evaluate(() => {
    const g = window.__game;
    g.updateAim();
    return g.aimGhost ? { x: g.aimGhost.x, y: g.aimGhost.y, z: g.aimGhost.z } : null;
  });
  expect(caseBlock !== null, `ブロック所持中はaimGhostがゴーストを指す (${JSON.stringify(caseBlock)})`);

  // --- ハンマー所持: 破壊優先でオートスナップ無効 --------------------------------
  const caseTool = await page.evaluate(() => {
    const g = window.__game;
    g.inventory.selected = g.inventory.slots.findIndex((s) => s && s.id === "hammer_wood");
    g.updateAim();
    return g.aimGhost;
  });
  expect(caseTool === null, "ハンマー所持中はaimGhostがnull（破壊優先）");

  // --- 実マウスクリックでオートスナップ設置 --------------------------------------
  // カメラ角度によってはカーソル前方の別ゴーストが最寄りになるため、期待セルは
  // ゲームが実際に照準しているセル(aimGhost)から取る。
  const before = await page.evaluate(() => {
    const g = window.__game;
    g.inventory.selected = g.inventory.slots.findIndex((s) => s && s.id === "wall");
    g.updateAim();
    const c = g.aimGhost;
    const mats = ["wall", "plank", "door", "bed"].reduce((n, id) => n + g.inventory.count(id), 0);
    return { target: { x: c.x, y: c.y, z: c.z, block: c.block }, mats };
  });
  await page.mouse.click(sp.x, sp.y);
  await waitForCond(page, c => window.__game.world.get(c.x, c.y, c.z) === c.block, before.target, { label: "小屋のマスに設置" });
  const after = await page.evaluate(
    (t) => ({
      block: window.__game.world.get(t.x, t.y, t.z),
      mats: ["wall", "plank", "door", "bed"].reduce((n, id) => n + window.__game.inventory.count(id), 0),
    }),
    before.target,
  );
  expect(after.block === before.target.block, `クリックで必要ブロックが設置される (0 -> ${after.block}, 要求${before.target.block})`);
  expect(after.mats === before.mats - 1, `材料が1消費される (${before.mats} -> ${after.mats})`);

  // --- 材料不足: 設置されない ------------------------------------------------------
  const noMat = await page.evaluate(() => {
    const g = window.__game;
    const bp = g.blueprints.active;
    const door = bp.cells.find((c) => c.block === 16 && g.world.get(c.x, c.y, c.z) === 0);
    g.inventory.remove("door", g.inventory.count("door"));
    g.fillGhostCell(door);
    return g.world.get(door.x, door.y, door.z);
  });
  expect(noMat === 0, "扉の材料が無いと設置されない");

  // --- 障害物: 赤フラグ -------------------------------------------------------------
  const obstacle = await page.evaluate(() => {
    const g = window.__game;
    const bp = g.blueprints.active;
    const wall = bp.cells.find((c) => c.block === 10 && g.world.get(c.x, c.y, c.z) === 0);
    g.world.set(wall.x, wall.y, wall.z, 3); // B.STONE を障害物として置く
    g.blueprints.refresh();
    const cell = bp.cells.find((c) => c.x === wall.x && c.y === wall.y && c.z === wall.z);
    const res = { obstacle: cell.obstacle, color: cell.ghost.material.color.getHexString() };
    g.world.set(wall.x, wall.y, wall.z, 0); // 片付け
    return res;
  });
  expect(obstacle.obstacle === true, "誤ブロックのセルはobstacle=true");
  expect(obstacle.color === "ff5a4a", `障害物ゴーストは赤 (#${obstacle.color})`);

  // --- 全マス充填で完成 --------------------------------------------------------------
  const done = await page.evaluate(() => {
    const g = window.__game;
    const bp = g.blueprints.active;
    g.inventory.add("door", 3);
    // Completion is tested in a cleared, unoccupied plot. Safety rejection is
    // checked separately; the fixture must not build through the player/terrain.
    g.player.pos.set(8.5, g.world.terrainSurfaceY(8, 8) + 0.1, 8.5);
    g.player.vel.set(0, 0, 0);
    for (const c of bp.cells) {
      const current = g.world.get(c.x, c.y, c.z);
      if (current !== c.block && current !== 0 && current !== 5) g.world.set(c.x, c.y, c.z, 0);
      if (g.placeBlockedByEntity(c)) throw new Error("completion fixture is occupied");
    }
    for (const c of [...bp.cells]) {
      if (g.blueprints.active && g.world.get(c.x, c.y, c.z) !== c.block) g.fillGhostCell(c);
    }
    return { completed: g.blueprints.completed.has("hut"), active: !!g.blueprints.active };
  });
  expect(done.completed && !done.active, "全マス充填で設計図が完成扱いになる");

  // --- 水中セル: 橋脚のゴーストクリックで水を丸太へ置換 ----------------------------
  const waterSetup = await page.evaluate(() => {
    const g = window.__game;
    const bp = g.blueprints.activate("bridge", { x: 30, z: 57 }, 4);
    g.inventory.add("log", 2);
    g.inventory.selected = g.inventory.slots.findIndex((s) => s?.id === "log");
    const cell = bp.cells
      .filter((c) => g.world.get(c.x, c.y, c.z) === 5) // B.WATER
      .sort((a, b) => b.y - a.y)[0];
    // 投影した1セルだけを照準候補にして、カメラ角度による別ゴースト選択を防ぐ。
    for (const c of bp.cells) if (c !== cell) c.ghost.visible = false;
    g.player.pos.set(cell.x + 1.6, cell.y + 0.1, cell.z + 0.5);
    g.player.vel.set(0, 0, 0);
    return { x: cell.x, y: cell.y, z: cell.z, block: cell.block };
  });
  const waterSp = await aimAtCell(page, waterSetup);

  const waterBefore = await page.evaluate(() => {
    const g = window.__game;
    g.updateAim();
    const c = g.aimGhost;
    return {
      target: c ? { x: c.x, y: c.y, z: c.z, block: c.block } : null,
      current: c ? g.world.get(c.x, c.y, c.z) : null,
      logs: g.inventory.count("log"),
    };
  });
  expect(waterBefore.target !== null && waterBefore.current === 5, "水中の橋脚ゴーストがaimGhostになる");

  await page.mouse.click(waterSp.x, waterSp.y);
  await waitForCond(page, c => window.__game.world.get(c.x, c.y, c.z) === c.block, waterSetup, { label: "水中の橋脚に設置" });
  const waterAfter = await page.evaluate((c) => ({
    block: window.__game.world.get(c.x, c.y, c.z),
    logs: window.__game.inventory.count("log"),
  }), waterBefore.target);
  expect(waterAfter.block === waterBefore.target.block, `水中セルへ丸太が設置される (水→${waterAfter.block})`);
  expect(waterAfter.logs === waterBefore.logs - 1, `水中橋脚の資材が1個減る (${waterBefore.logs}→${waterAfter.logs})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("blueprint.test: PASS");
} finally {
  await browser.close();
}
