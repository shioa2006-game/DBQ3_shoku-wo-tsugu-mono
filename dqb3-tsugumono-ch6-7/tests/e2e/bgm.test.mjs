// BGMの切り替えの回帰テスト。
// - タイトルでは鳴らさない（自動再生制限にかからないよう、開始操作の後から）
// - ゲーム開始で通常曲、第7章の防衛（波）とヴァルガ戦でボス曲、勝っても負けても通常曲へ戻る
// - Mキーで効果音とBGMをまとめてON/OFFする
// 大岩ガニ戦の曲は chapter6.test.mjs が確かめる。

import {
  launchBrowser, openGame, newGame, expect, waitForCond,
  skipToChapter7, completeActiveBlueprint, settle, talk, choose, go,
} from "../helpers.mjs";

const bgm = (page) => page.evaluate(() => window.__game.bgm.current);
const waitForBgm = (page, id, label) =>
  waitForCond(page, (want) => window.__game.bgm.current === want, id, { label, timeout: 10000 });

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });

  const onTitle = await bgm(page);
  expect(onTitle === null, `タイトルでは曲を鳴らさない (${onTitle})`);

  await newGame(page);
  const started = await bgm(page);
  expect(started === "field", `ゲーム開始で通常曲 (${started})`);

  // 第7章の防衛: ゴンタへの合図から決着までボス曲（飛来の間も含む）。
  await skipToChapter7(page);
  await completeActiveBlueprint(page);
  await settle(page);
  expect((await bgm(page)) === "field", "そなえの間は通常曲のまま");
  await talk(page, "gonta");
  await choose(page, 0);
  await waitForCond(page, () => window.__game.defense.active, undefined, { label: "wave 1 started" });
  const inWave = await bgm(page);
  expect(inWave === "boss", `防衛（第1波）の開始でボス曲 (${inWave})`);

  await page.evaluate(() => window.__game.defense.finish(true));
  await waitForBgm(page, "field", "防衛の勝利で通常曲へ戻る");
  expect(true, "防衛の勝利で通常曲へ戻る");
  await go(page, "CH7_PREP2");

  // ヴァルガ戦は防衛（波）とは別の仕組みだが、同じくボス曲を使う。
  await page.evaluate(() => window.__game.quests.setStage("CH7_OMEN", true));
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA1");
  await waitForCond(page, () => window.__game.varuga.active, undefined, { label: "varuga started" });
  const inVaruga = await bgm(page);
  expect(inVaruga === "boss", `ヴァルガ戦の開始でボス曲 (${inVaruga})`);

  // 祭壇の灯が消えて負けても、通常曲へ戻る（開始直前の状態へ戻った後も通常曲）。
  await page.evaluate(() => { window.__game.dharma.altarHp = 0; });
  await waitForCond(page, () => !window.__game.varuga.active, undefined, { label: "varuga lost" });
  await waitForBgm(page, "field", "ヴァルガ戦の敗北で通常曲へ戻る");
  expect(true, "ヴァルガ戦の敗北で通常曲へ戻る");
  await go(page, "CH7_OMEN");
  const restored = await bgm(page);
  expect(restored === "field", `開始直前の状態へ戻った後も通常曲 (${restored})`);

  // Mキーは効果音とBGMをまとめて切り替える。
  // 押下の検出はフレーム単位（input.endFrame）なので、切り替わりを待ってから次を押す。
  await page.keyboard.press("m");
  await waitForCond(page, () => window.__game.bgm.muted === true, undefined, { label: "muted", timeout: 5000 });
  expect(true, "MキーでBGMもミュートされる");
  await page.keyboard.press("m");
  await waitForCond(page, () => window.__game.bgm.muted === false, undefined, { label: "unmuted", timeout: 5000 });
  expect(true, "もう一度押すと解除される");
  const afterMute = await bgm(page);
  expect(afterMute === "field", `ミュートを解除しても、鳴らす曲は変わらない (${afterMute})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("bgm.test: PASS");
} finally {
  await browser.close();
}
