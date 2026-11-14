// 設計図の光る枠の回帰テスト（基壇と石段・共同小屋の設計図で確かめる）:
// - 水に沈んだ枠も、実際のマウス操作で狙えて、要るブロックで埋まる
// - 瓦礫など別の固いブロックがあるマスは障害物（赤い枠）のまま。クリックしても自動では上書きしない
// - 住民が立つマスは住民がよけて置ける（通り抜けのブロックは住民ごと置ける。魔物がいれば置けない）

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";
import { aimAtCell } from "../../../game-shared/tests/aim-at-cell.mjs";
import { B } from "../../src/world/blocks.js";

// 基壇と石段の設計図のマス（どちらも前庭から手が届く、正面の石段の下の段）。
const GAP_CELL = { x: 32, y: 16, z: 37 }; // 石段の中央の割れ（空いたマス）
const RUBBLE_CELL = { x: 28, y: 16, z: 37 }; // 石段に食い込んだ瓦礫（設計図では赤い枠）
// 共同小屋の設計図のマス。
const CHEST_CELL = { x: 36, y: 16, z: 45, item: "chest" }; // 資材置き場の収納箱（固い）
const BED_CELL = { x: 38, y: 16, z: 41, item: "bed" }; // 小屋の中のベッド（通り抜けられる）

// 設計図のマスに魔物・住民がいるときの設置を確かめる。1回の page.evaluate の中で完結させ、
// 検査の途中にフレームが進まないようにする。手順は game-shared/tests/build-step-aside.mjs と同じだが、
// 魔物は本物を立たせる（この編の設置の判定は、実体のある魔物だけを数えるため。共有の検査が使う
// 実体のない仮の魔物は、この編では障害にならない）。
async function checkStepAside(page, { villagerId, monsterType, solid, passThrough }) {
  return page.evaluate(({ villagerId, monsterType, solid, passThrough }) => {
    const g = window.__game;
    const bp = g.blueprints.active;
    const at = (c) => bp.cells.find((k) => k.x === c.x && k.y === c.y && k.z === c.z);
    const blocks = (e, c, p = e.pos) =>
      Math.abs(p.x - (c.x + 0.5)) < e.halfW + 0.5 &&
      Math.abs(p.z - (c.z + 0.5)) < e.halfW + 0.5 &&
      p.y < c.y + 1 &&
      p.y + e.height > c.y;
    const v = g.villager(villagerId);
    const savedPlayer = g.player.pos.clone();
    g.player.pos.set(solid.x + 0.5, solid.y + 40, solid.z + 0.5); // 主人公は判定から外しておく
    const standOn = (e, c) => {
      e.pos.set(c.x + 0.5, c.y + 0.001, c.z + 0.5);
      e.vel.set(0, 0, 0);
    };
    const out = { cellsFree: g.world.get(solid.x, solid.y, solid.z) === 0 && g.world.get(passThrough.x, passThrough.y, passThrough.z) === 0 };

    // 魔物が立つマスには、今までどおり置けない（材料も減らない）。
    g.inventory.add(solid.item, 2);
    const monster = g.monsters.spawn(monsterType, solid.x + 0.5, solid.y + 0.001, solid.z + 0.5);
    standOn(v, { x: solid.x + 3, y: solid.y, z: solid.z + 3 });
    const matsBeforeMonster = g.inventory.count(solid.item);
    g.fillGhostCell(at(solid));
    out.monsterBlocked = g.world.get(solid.x, solid.y, solid.z) === 0;
    out.monsterKeptMats = g.inventory.count(solid.item) === matsBeforeMonster;
    g.monsters.remove(monster);

    // 固いブロック: 住民は近くへよけ、ブロックが置かれ、材料が1つ減る。
    const solidCell = at(solid);
    standOn(v, solid);
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
    const passCell = at(passThrough);
    g.inventory.add(passThrough.item, 1);
    standOn(v, passThrough);
    const stood = { x: v.pos.x, z: v.pos.z };
    g.fillGhostCell(passCell);
    out.passPlaced = g.world.get(passThrough.x, passThrough.y, passThrough.z) === passCell.block;
    out.passStayed = v.pos.x === stood.x && v.pos.z === stood.z;

    g.player.pos.copy(savedPlayer);
    return out;
  }, { villagerId, monsterType, solid, passThrough });
}

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- 水に沈んだ枠 ---------------------------------------------------------------
  const waterSetup = await page.evaluate(({ cell, WATER }) => {
    const g = window.__game;
    g.monsters.spawnTimer = 1e6; // 照準を合わせている間に、山道の敵を出さない
    const bp = g.activateBlueprint("temple_base");
    const target = bp.cells.find((c) => c.x === cell.x && c.y === cell.y && c.z === cell.z);
    const empty = g.world.get(target.x, target.y, target.z);
    g.world.set(target.x, target.y, target.z, WATER); // 石段の割れに水がたまった状態
    for (const c of bp.cells) if (c !== target) c.ghost.visible = false;
    g.inventory.add("dharma_stone", 2);
    g.inventory.selected = g.inventory.slots.findIndex((s) => s?.id === "dharma_stone");
    g.player.pos.set(target.x + 0.5, target.y + 0.1, target.z + 1.6); // 前庭から石段を見る
    g.player.vel.set(0, 0, 0);
    return { x: target.x, y: target.y, z: target.z, block: target.block, empty, obstacle: target.obstacle, ghost: target.ghost.visible };
  }, { cell: GAP_CELL, WATER: B.WATER });
  expect(waterSetup.empty === B.AIR && waterSetup.block === B.DHARMA_STONE, `基壇の設計図の空いたマス（神殿の石を置く） (${JSON.stringify(waterSetup)})`);
  expect(waterSetup.ghost === true && waterSetup.obstacle === false, "水に沈んだマスは 障害物にならず、枠が出たまま");
  const waterSp = await aimAtCell(page, waterSetup);

  const waterBefore = await page.evaluate(() => {
    const g = window.__game;
    g.updateAim();
    const c = g.aimGhost;
    return {
      target: c ? { x: c.x, y: c.y, z: c.z, block: c.block } : null,
      current: c ? g.world.get(c.x, c.y, c.z) : null,
      stones: g.inventory.count("dharma_stone"),
    };
  });
  expect(waterBefore.target !== null && waterBefore.current === B.WATER, "水中の設計図ゴーストがaimGhostになる: " + JSON.stringify(waterBefore));
  expect(waterBefore.target.x === waterSetup.x && waterBefore.target.y === waterSetup.y && waterBefore.target.z === waterSetup.z, "狙っているのは その水のマス");

  await page.mouse.click(waterSp.x, waterSp.y);
  await waitForCond(page, (c) => window.__game.world.get(c.x, c.y, c.z) === c.block, waterSetup, { label: "water ghost click places the required block" });
  const waterAfter = await page.evaluate((c) => ({
    block: window.__game.world.get(c.x, c.y, c.z),
    stones: window.__game.inventory.count("dharma_stone"),
  }), waterBefore.target);
  expect(waterAfter.block === waterBefore.target.block, `水中セルへ要求ブロックが設置される (水→${waterAfter.block})`);
  expect(waterAfter.stones === waterBefore.stones - 1, `水中設置の資材が1個減る (${waterBefore.stones}→${waterAfter.stones})`);

  // --- 瓦礫のあるマス（赤い枠） -----------------------------------------------------
  const obstacleSetup = await page.evaluate((cell) => {
    const g = window.__game;
    const bp = g.blueprints.active;
    const target = bp.cells.find((c) => c.x === cell.x && c.y === cell.y && c.z === cell.z);
    for (const c of bp.cells) c.ghost.visible = c === target;
    g.inventory.selected = g.inventory.slots.findIndex((s) => !s); // 素手（ハンマーを持てば崩せる）
    g.player.pos.set(target.x + 0.5, target.y + 0.1, target.z + 1.6);
    g.player.vel.set(0, 0, 0);
    return {
      x: target.x, y: target.y, z: target.z,
      current: g.world.get(target.x, target.y, target.z),
      wanted: target.block,
      obstacle: target.obstacle,
      stones: g.inventory.count("dharma_stone"),
    };
  }, RUBBLE_CELL);
  expect(obstacleSetup.current === B.RUBBLE && obstacleSetup.wanted === B.DHARMA_STONE, `石段に食い込んだ瓦礫のマス (block ${obstacleSetup.current})`);
  expect(obstacleSetup.obstacle === true, "水以外の別のブロックがあるマスは 障害物（赤い枠）として残る");
  const obstacleSp = await aimAtCell(page, obstacleSetup, { target: "block" });
  const obstacleAim = await page.evaluate(() => {
    window.__game.updateAim();
    const c = window.__game.aimGhost;
    return c ? { x: c.x, y: c.y, z: c.z } : null; // マスの座標だけを返す（3Dの枠ごと返さない）
  });
  expect(obstacleAim === null, "瓦礫のあるマスのゴーストはaimGhostにならない");

  await page.mouse.click(obstacleSp.x, obstacleSp.y);
  await waitForCond(page, () => !window.__game.input.pressedButtons.has(0), undefined, { label: "obstacle click processed" });
  const obstacleAfter = await page.evaluate((c) => ({
    block: window.__game.world.get(c.x, c.y, c.z),
    stones: window.__game.inventory.count("dharma_stone"),
  }), obstacleSetup);
  expect(obstacleAfter.block === B.RUBBLE, "クリックしても瓦礫を自動で上書きしない");
  expect(obstacleAfter.stones === obstacleSetup.stones, "障害物クリックでは資材を消費しない");

  // --- 住民が立つマス ---------------------------------------------------------------
  // 共同小屋の資材置き場の収納箱のマスは、ミナが立っていてもよけて置ける。
  // 通り抜けられるベッドはミナごと置け、魔物（岩角ヤギ）が立つマスには今までどおり置けない。
  await page.evaluate(() => { window.__game.activateBlueprint("common_hut"); });
  const aside = await checkStepAside(page, {
    villagerId: "mina",
    monsterType: "rock_goat",
    solid: CHEST_CELL,
    passThrough: BED_CELL,
  });
  expect(aside.cellsFree, "収納箱とベッドのマスは まだ空いている");
  expect(aside.monsterBlocked && aside.monsterKeptMats, `魔物が立つマスには置けず材料も減らない (${JSON.stringify(aside)})`);
  expect(aside.blockedBefore, "ミナが収納箱のマスに立っている（判定に掛かる位置）");
  expect(aside.solidPlaced && aside.usedOne, `ミナが立つ収納箱のマスにも置け、材料が1つ減る (${JSON.stringify(aside)})`);
  expect(aside.movedOff && !aside.inSolid && aside.onGround && !aside.inWater, `ミナは床の上へよけ、ブロックに埋まらない (${JSON.stringify(aside)})`);
  expect(aside.stepDistance < 4.6, `よけ先は近く (${aside.stepDistance.toFixed(2)})`);
  expect(aside.onRemaining.length === 0, `よけたミナはまだ埋まっていないマスに掛からない (${aside.onRemaining.join(" ")})`);
  expect(aside.passPlaced && aside.passStayed, `ベッドはミナが立っていても動かさずに置ける (${JSON.stringify(aside)})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("blueprint.test: PASS");
} finally {
  await browser.close();
}
