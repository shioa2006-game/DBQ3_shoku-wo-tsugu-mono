import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  const fullState = await page.evaluate(() => {
    const g = window.__game;
    for (const drop of [...g.drops]) g.scene.remove(drop.sprite);
    g.drops = [];
    g.inventory.slots = Array.from({ length: g.inventory.slots.length }, () => ({ id: "stone", count: 99 }));
    g.inventory.emit();
    g.spawnDrop("dirt", 1, g.player.pos.x, g.player.pos.y, g.player.pos.z);
    const drop = g.drops[0];
    drop.age = 1;
    drop.vel.set(0, 0, 0);
    return { drops: g.drops.length, dirt: g.inventory.count("dirt") };
  });
  expect(fullState.drops === 1, `test drop exists (${fullState.drops})`);
  expect(fullState.dirt === 0, `inventory starts without dirt (${fullState.dirt})`);

  await page.waitForTimeout(900);
  const afterFullPickup = await page.evaluate(() => ({
    drops: window.__game.drops.length,
    dirt: window.__game.inventory.count("dirt"),
  }));
  expect(afterFullPickup.drops === 1, `full inventory keeps drop in world (${afterFullPickup.drops})`);
  expect(afterFullPickup.dirt === 0, `full inventory does not add item (${afterFullPickup.dirt})`);

  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.slots[0] = null;
    g.inventory.emit();
    const drop = g.drops[0];
    drop.pos.copy(g.player.pos);
    drop.vel.set(0, 0, 0);
    drop.collected = false;
    drop.age = 1;
  });
  await page.waitForTimeout(900);
  const afterSpacePickup = await page.evaluate(() => ({
    drops: window.__game.drops.length,
    dirt: window.__game.inventory.count("dirt"),
  }));
  expect(afterSpacePickup.drops === 0, `pickup succeeds after freeing space (${afterSpacePickup.drops})`);
  expect(afterSpacePickup.dirt === 1, `item is added after freeing space (${afterSpacePickup.dirt})`);
  const dropResting = await page.evaluate(() => {
    const g = window.__game;
    for (const drop of [...g.drops]) g.scene.remove(drop.sprite);
    g.drops = [];
    g.spawnDrop("stone", 1, g.player.pos.x, 5, g.player.pos.z);
    const drop = g.drops[0];
    drop.pos.y = 12;
    drop.vel.set(0, 0, 0);
    drop.age = 0;
    const farPlayer = g.player.pos.clone();
    farPlayer.x += 20;
    const mockWorld = {
      groundYBelow(_x, _z, fromY) {
        return fromY > 10 ? 20 : 4;
      },
    };
    drop.update(0.016, mockWorld, farPlayer);
    const ignoredUpperGroundY = drop.pos.y;
    drop.pos.y = 3;
    drop.vel.set(0, 0, 0);
    drop.update(0.016, mockWorld, farPlayer);
    return { ignoredUpperGroundY, landedNearSpawnY: drop.pos.y };
  });
  expect(dropResting.ignoredUpperGroundY < 13, `drop ignores ground above spawn (${dropResting.ignoredUpperGroundY.toFixed(2)})`);
  expect(Math.abs(dropResting.landedNearSpawnY - 4.3) < 0.01, `drop rests on ground below spawn (${dropResting.landedNearSpawnY.toFixed(2)})`);
  expect(errors.length === 0, `no console errors (${JSON.stringify(errors)})`);
} finally {
  await browser.close();
}