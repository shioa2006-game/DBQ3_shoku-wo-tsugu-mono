// Character sheet recovery regression:
// - the first request may fail when a character appears for the first time
// - the existing character must recover without a page reload
// - retries must stop after the next successful request

import { launchBrowser, openGame, expect, waitForCond } from "../helpers.mjs";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  let blacksmithRequests = 0;
  await page.route(/blacksmith_body_8dir.*\.png$/, async (route) => {
    blacksmithRequests += 1;
    if (blacksmithRequests === 1) await route.abort("failed");
    else await route.continue();
  });

  await openGame(page);
  const before = await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("belk", 32, 21);
    return {
      headLoaded: Boolean(v.rig.headTexture.image?.complete),
      bodyLoaded: Boolean(v.rig.bodyTexture.image?.complete),
    };
  });
  expect(!before.headLoaded && !before.bodyLoaded, "初回失敗直後はベルクの画像が未読込");

  const recovered = await waitForCond(page, () => {
    const rig = window.__game.villager("belk")?.rig;
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
  expect(recovered.sameSource, "既存の頭・胴体テクスチャへ再試行画像が反映される");
  expect(recovered.width > 0 && recovered.height > 0, `ベルク画像が自動復旧 (${recovered.width}x${recovered.height})`);

  await page.waitForTimeout(1800);
  expect(blacksmithRequests === 2, `成功後は再試行を停止 (${blacksmithRequests} requests)`);
  await page.close();

  const failedPage = await browser.newPage({ viewport: { width: 960, height: 540 } });
  let failedRequests = 0;
  await failedPage.route(/blacksmith_body_8dir.*\.png$/, async (route) => {
    failedRequests += 1;
    await route.abort("failed");
  });
  await openGame(failedPage);
  await failedPage.evaluate(() => window.__game.spawnVillager("belk", 32, 21));
  await failedPage.waitForTimeout(2800);
  expect(failedRequests === 3, `連続失敗時は3回で打ち切る (${failedRequests} requests)`);
  await failedPage.waitForTimeout(1400);
  expect(failedRequests === 3, "打ち切り後に無限再試行しない");
  await failedPage.close();

  console.log("texture-retry.test: PASS");
} finally {
  await browser.close();
}
