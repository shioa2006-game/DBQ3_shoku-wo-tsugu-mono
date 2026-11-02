// Item icons come from the Studio-made 16px atlas (assets/items/item_icons_16.png):
// every item has a cell, the hotbar / drops use the atlas icon, and the atlas
// loads without errors. Fallback tiles / emoji are only for a missing atlas.

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  let atlasStatus = null;
  page.on("response", (res) => {
    if (/item_icons_16[^/]*\.png$/.test(res.url())) atlasStatus = res.status();
  });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  const report = await waitForCond(page, () => {
    const r = window.__game.itemIcons.report();
    return r.loaded ? r : false;
  }, undefined, { label: "item icon atlas loaded" });
  expect(atlasStatus === 200, `icon atlas is served (${atlasStatus})`);
  expect(report.total >= 63, `all items are checked (${report.total})`);
  expect(report.fallback.length === 0, `every item has an atlas icon (fallback: ${report.fallback.join(", ")})`);

  const shown = await page.evaluate(async () => {
    const g = window.__game;
    g.inventory.slots[0] = { id: "forge", count: 1 };
    g.inventory.emit();
    const img = document.querySelector(".hotbar .slot .icon");
    await img.decode();
    g.spawnDrop("iron_ore", 1, g.player.pos.x, g.player.pos.y, g.player.pos.z);
    const drop = g.drops[g.drops.length - 1];
    return {
      hotbarIsForge: img.src === g.itemIcons.icon("forge"),
      size: [img.naturalWidth, img.naturalHeight],
      dropIsOre: drop.sprite.material.map.image.src === g.itemIcons.icon("iron_ore"),
    };
  });
  expect(shown.hotbarIsForge, "hotbar shows the atlas icon");
  expect(shown.size[0] === 36 && shown.size[1] === 36, `icons keep the 36px footprint (${shown.size})`);
  expect(shown.dropIsOre, "dropped items use the atlas icon");
  expect(errors.length === 0, `no console errors (${JSON.stringify(errors)})`);
} finally {
  await browser.close();
}
