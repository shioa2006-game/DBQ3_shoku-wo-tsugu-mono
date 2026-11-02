// BGMの切り替えの回帰テスト。
// - タイトルでは鳴らさない（自動再生制限にかからないよう、開始操作の後から）
// - ゲーム開始で通常曲、防衛戦の開始でボス曲、終了で通常曲へ戻る
// - Mキーで効果音とBGMをまとめてON/OFFする

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });

  const onTitle = await page.evaluate(() => window.__game.bgm.current);
  expect(onTitle === null, `タイトルでは曲を鳴らさない (${onTitle})`);

  await newGame(page);
  const started = await page.evaluate(() => window.__game.bgm.current);
  expect(started === "field", `ゲーム開始で通常曲 (${started})`);

  // 防衛戦の開始から終了まではボス曲（ザコの波も含む）。
  await page.evaluate(() => window.__game.startDefense());
  const inRaid = await page.evaluate(() => window.__game.bgm.current);
  expect(inRaid === "boss", `防衛戦の開始でボス曲 (${inRaid})`);

  await page.evaluate(() => window.__game.defense.finish(true));
  await waitForCond(page, () => window.__game.bgm.current === "field", undefined, {
    label: "防衛戦の終了で通常曲へ戻る", timeout: 10000,
  });

  // Mキーは効果音とBGMをまとめて切り替える。
  // 押下の検出はフレーム単位（input.endFrame）なので、連打せず間を空ける。
  await page.keyboard.press("m");
  await page.waitForTimeout(300);
  const muted = await page.evaluate(() => window.__game.bgm.muted);
  expect(muted === true, "MキーでBGMもミュートされる");
  await page.keyboard.press("m");
  await page.waitForTimeout(300);
  const unmuted = await page.evaluate(() => window.__game.bgm.muted);
  expect(unmuted === false, "もう一度押すと解除される");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("bgm.test: PASS");
} finally {
  await browser.close();
}
