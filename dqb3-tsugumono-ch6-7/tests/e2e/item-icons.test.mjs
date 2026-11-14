// アイテムのアイコンは、Studio で描いた 16px のアトラス（assets/items/item_icons_16.png）から出す。
// - すべてのアイテムにアトラスのマスがある
// - ホットバーとドロップが アトラスのアイコンを使う
// - アトラスがエラーなく読み込める
// ブロック模様や絵文字の代わりのアイコンは、アトラスが無いときだけのもの。

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";
import { ITEMS } from "../../src/game/items.js";

const ITEM_IDS = Object.keys(ITEMS);
// 表示を確かめるアイテム（どちらも、ほかの編と共通のアトラスに入っている）。
const HOTBAR_ITEM = "forge";
const DROP_ITEM = "iron_ore";

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
  expect(atlasStatus === 200, `アイコンのアトラスが配信される (${atlasStatus})`);
  expect(report.total === ITEM_IDS.length, `すべてのアイテムを調べている (${report.total}/${ITEM_IDS.length})`);

  const shown = await page.evaluate(async ({ hotbarItem, dropItem }) => {
    const g = window.__game;
    g.inventory.slots[0] = { id: hotbarItem, count: 1 };
    g.inventory.emit();
    const img = document.querySelector(".hotbar .slot .icon");
    await img.decode();
    g.spawnDrop(dropItem, 1, g.player.pos.x, g.player.pos.y, g.player.pos.z);
    const drop = g.drops[g.drops.length - 1];
    return {
      hotbarIsItem: img.src === g.itemIcons.icon(hotbarItem),
      size: [img.naturalWidth, img.naturalHeight],
      dropIsItem: drop.sprite.material.map.image.src === g.itemIcons.icon(dropItem),
      distinct: g.itemIcons.icon(hotbarItem) !== g.itemIcons.icon(dropItem),
    };
  }, { hotbarItem: HOTBAR_ITEM, dropItem: DROP_ITEM });
  expect(
    !report.fallback.includes(HOTBAR_ITEM) && !report.fallback.includes(DROP_ITEM),
    `${HOTBAR_ITEM} と ${DROP_ITEM} はアトラスから描かれる`,
  );
  expect(shown.hotbarIsItem && shown.distinct, "ホットバーに アトラスのアイコンが出る");
  expect(shown.size[0] === 36 && shown.size[1] === 36, `アイコンは 36px の大きさを保つ (${shown.size})`);
  expect(shown.dropIsItem, "落ちているアイテムも アトラスのアイコンを使う");
  expect(errors.length === 0, `コンソールエラーなし (${JSON.stringify(errors)})`);

  // 最後に確かめる（足りないマスがあっても、上の結果が隠れないようにする）。
  expect(
    report.fallback.length === 0,
    `すべてのアイテムに アトラスのアイコンがある (代わりのアイコン ${report.fallback.length}個: ${report.fallback.join(", ")})`,
  );
  console.log("item-icons.test: PASS");
} finally {
  await browser.close();
}
