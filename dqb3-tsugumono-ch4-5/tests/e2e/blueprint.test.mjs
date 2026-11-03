// Blueprint water-cell regression:
// - a ghost over water can be aimed and filled through the real mouse path
// - wrong solid blocks remain obstacles and are never auto-overwritten

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";
import { aimAtCell } from "../../../game-shared/tests/aim-at-cell.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  const waterSetup = await page.evaluate(() => {
    const g = window.__game;
    const anchor = { x: 30, z: 89 };
    const baseY = g.world.pristineSurfaceY(anchor.x + 2, anchor.z + 5);
    // The test moves directly to the chapter 5 build site; keep the chapter gate
    // from clamping the player back to the northern region during camera settling.
    g.quests.flags.bambooPassOpen = true;
    const bp = g.blueprints.activate("spring_works", anchor, baseY);
    const cell = bp.cells.find((c) => c.block === 3); // B.STONE foundation cell
    g.world.set(cell.x, cell.y, cell.z, 5); // B.WATER
    for (const c of bp.cells) if (c !== cell) c.ghost.visible = false;
    g.inventory.add("stone", 2);
    g.inventory.selected = g.inventory.slots.findIndex((s) => s?.id === "stone");
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
      stones: g.inventory.count("stone"),
    };
  });
  expect(waterBefore.target !== null && waterBefore.current === 5, "水中の設計図ゴーストがaimGhostになる: "+JSON.stringify(waterBefore));

  await page.mouse.click(waterSp.x, waterSp.y);
  await waitForCond(page,c=>window.__game.world.get(c.x,c.y,c.z)===c.block,waterSetup,{label:"water ghost click places the required block"});
  const waterAfter = await page.evaluate((c) => ({
    block: window.__game.world.get(c.x, c.y, c.z),
    stones: window.__game.inventory.count("stone"),
  }), waterBefore.target);
  expect(waterAfter.block === waterBefore.target.block, `水中セルへ要求ブロックが設置される (水→${waterAfter.block})`);
  expect(waterAfter.stones === waterBefore.stones - 1, `水中設置の資材が1個減る (${waterBefore.stones}→${waterAfter.stones})`);

  const obstacleSetup = await page.evaluate((filled) => {
    const g = window.__game;
    const bp = g.blueprints.active;
    const cell = bp.cells.find(
      (c) => c.block === 3 && (c.x !== filled.x || c.y !== filled.y || c.z !== filled.z),
    );
    g.world.set(cell.x, cell.y, cell.z, 1); // B.DIRT: wrong solid block
    for (const c of bp.cells) c.ghost.visible = c === cell;
    const emptySlot = g.inventory.slots.findIndex((s) => !s);
    g.inventory.selected = emptySlot;
    g.player.pos.set(cell.x + 1.6, cell.y + 0.1, cell.z + 0.5);
    g.player.vel.set(0, 0, 0);
    return {
      x: cell.x,
      y: cell.y,
      z: cell.z,
      obstacle: cell.obstacle,
      stones: g.inventory.count("stone"),
    };
  }, waterBefore.target);
  expect(obstacleSetup.obstacle === true, "水以外の誤ブロックは障害物として維持される");
  const obstacleSp = await aimAtCell(page, obstacleSetup, { target: "block" });
  const obstacleAim = await page.evaluate(() => {
    window.__game.updateAim();
    return window.__game.aimGhost;
  });
  expect(obstacleAim === null, "誤ブロック上のゴーストはaimGhostにならない");

  await page.mouse.click(obstacleSp.x, obstacleSp.y);
  await waitForCond(page,()=>!window.__game.input.pressedButtons.has(0),undefined,{label:"obstacle click processed"});
  const obstacleAfter = await page.evaluate((c) => ({
    block: window.__game.world.get(c.x, c.y, c.z),
    stones: window.__game.inventory.count("stone"),
  }), obstacleSetup);
  expect(obstacleAfter.block === 1, "クリックしても誤ブロックを自動上書きしない");
  expect(obstacleAfter.stones === obstacleSetup.stones, "障害物クリックでは資材を消費しない");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("blueprint.test: PASS");
} finally {
  await browser.close();
}
