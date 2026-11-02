// Character sheet recovery regression:
// - the first request may fail when a character appears for the first time
// - the existing character must recover without a page reload
// - retries must stop after the next successful request

import { launchBrowser, openGame, expect, waitForCond } from "../helpers.mjs";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  let headRequests = 0;
  let torsoRequests = 0;
  await page.route(/inaho_code_(head|torso)_layer_8dir.*\.png$/, async (route) => {
    if (route.request().url().includes("head_layer")) {
      headRequests += 1;
      if (headRequests === 1) return route.abort("failed");
    } else torsoRequests += 1;
    await route.continue();
  });

  await openGame(page);
  const before = await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("inaho", 38, 84);
    return {
      headLoaded: Boolean(v.rig.headTexture.image?.complete),
      bodyLoaded: Boolean(v.rig.bodyTexture.image?.complete),
    };
  });
  expect(!before.headLoaded && !before.bodyLoaded, "初回失敗直後はイナホの画像が未読込");

  const recovered = await waitForCond(page, () => {
    const rig = window.__game.villager("inaho")?.rig;
    if (!rig) return false;
    const head = rig.headTexture.image;
    const body = rig.bodyTexture.image;
    if (!head?.complete || !body?.complete || head.naturalWidth <= 0 || body.naturalWidth <= 0) return false;
    return {
      sameSource: rig.headTexture.source === rig.bodyTexture.source,
      width: head.naturalWidth,
      height: head.naturalHeight,
    };
  }, undefined, { timeout: 5000, label: "character sheet retry" });
  expect(!recovered.sameSource, "頭の読込を再試行しても頭・胴の画像が混ざらない");
  expect(recovered.width > 0 && recovered.height > 0, `イナホ画像が自動復旧 (${recovered.width}x${recovered.height})`);

  await page.waitForTimeout(1800);
  expect(headRequests === 2 && torsoRequests === 1, `失敗した頭だけ再試行し成功後に停止 (head=${headRequests}, torso=${torsoRequests})`);
  await page.close();

  const failedPage = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const failedRequests = { head: 0, torso: 0 };
  await failedPage.route(/inaho_code_(head|torso)_layer_8dir.*\.png$/, async (route) => {
    failedRequests[route.request().url().includes("head_layer") ? "head" : "torso"] += 1;
    await route.abort("failed");
  });
  await openGame(failedPage);
  await failedPage.evaluate(() => window.__game.spawnVillager("inaho", 38, 84));
  await failedPage.waitForTimeout(2800);
  expect(failedRequests.head === 3 && failedRequests.torso === 3, `連続失敗時は各画像3回で打ち切る (${JSON.stringify(failedRequests)})`);
  await failedPage.waitForTimeout(1400);
  expect(failedRequests.head === 3 && failedRequests.torso === 3, "打ち切り後に無限再試行しない");
  await failedPage.close();

  console.log("texture-retry.test: PASS");
} finally {
  await browser.close();
}
