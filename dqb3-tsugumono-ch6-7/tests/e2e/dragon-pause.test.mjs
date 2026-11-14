// ヴァルガ戦の最中のポーズの回帰テスト。
// 竜の頭（判定だけを持つ DragonHead）は、魔物の標的としてポーズ中の見た目の同期（syncVisual）にも応える。
// - 地上へ降りて三つの頭が出ている間に、ポーズ → セーブ → もどる をしてもエラーが出ない
// - ポーズの間、戦いは進まない。もどった後も三つの頭と戦いがそのまま続く
// - 戦いの最中のポーズのセーブは「開始直前の状態」（合図の前のステージ）を書く
// 戦いそのものの流れは chapter7.test.mjs が確かめる。

import {
  launchBrowser, openGame, newGame, expect, waitForCond, SAVE_KEY,
  skipToChapter7, talk, choose, go, settle, fastForward,
} from "../helpers.mjs";

const browser = await launchBrowser();
const errors = [];
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // 最終決戦を合図から始める（合図のときに「開始直前の状態」が保存される）。
  await skipToChapter7(page);
  await page.evaluate(() => window.__game.quests.setStage("CH7_FINAL_PREP", true));
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA2");
  await waitForCond(page, () => window.__game.varuga.active && window.__game.varuga.phase === "air", undefined, { label: "final battle started" });

  // 翼を射抜いて前庭へ降ろす → 三つの頭が標的として現れる。
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(17.5, 16.1, 46.5); // 竜の体当たりが届かない前庭の西の端で見る
    g.player.vel.set(0, 0, 0);
    while (g.varuga.phase === "air") g.varuga.onWingHit();
  });
  await fastForward(page, 4);
  await settle(page);
  const ground = await page.evaluate(() => {
    const g = window.__game;
    return { phase: g.varuga.phase, heads: g.varuga.heads.filter(Boolean).length, targets: g.monsters.monsters.filter((m) => m.isDragonHead).length };
  });
  expect(ground.phase === "ground" && ground.heads === 3 && ground.targets === 3, `三つの頭が標的として出ている (${JSON.stringify(ground)})`);

  // Esc でポーズ → セーブ → しばらく待つ → もどる。
  await page.keyboard.press("Escape");
  await page.waitForSelector(".btn-save", { state: "visible" });
  const frozen = await page.evaluate((SAVE_KEY) => {
    const g = window.__game;
    localStorage.removeItem(SAVE_KEY); // セーブのボタンが書いたことを確かめるため、合図のときのセーブを消しておく
    return { t: g.varuga.t, hp: g.varuga.heads.map((h) => h.hp).join(), altar: g.dharma.altarHp, hour: g.daynight.hour };
  }, SAVE_KEY);
  await page.click(".btn-save");
  await waitForCond(page, (key) => localStorage.getItem(key) !== null, SAVE_KEY, { label: "saved by the pause button" });
  await page.waitForTimeout(800);
  const paused = await page.evaluate((SAVE_KEY) => {
    const g = window.__game;
    return {
      t: g.varuga.t, hp: g.varuga.heads.map((h) => h.hp).join(), altar: g.dharma.altarHp, hour: g.daynight.hour,
      wasPaused: g.wasPaused,
      saved: JSON.parse(localStorage.getItem(SAVE_KEY)).stage.stage,
    };
  }, SAVE_KEY);
  expect(paused.wasPaused && paused.t === frozen.t && paused.hp === frozen.hp && paused.altar === frozen.altar && paused.hour === frozen.hour,
    `ポーズの間、ヴァルガ戦は進まない (${JSON.stringify(paused)})`);
  expect(paused.saved === "CH7_FINAL_PREP", `戦いの最中のポーズのセーブは 開始直前の状態を書く (${paused.saved})`);

  await page.locator(".btn-resume").click();
  await waitForCond(page, () => !window.__game.ui.modalOpen, undefined, { label: "resumed" });
  await waitForCond(page, (t) => window.__game.varuga.t > t, frozen.t, { label: "battle goes on" });
  const resumed = await page.evaluate(() => {
    const g = window.__game;
    return {
      active: g.varuga.active, phase: g.varuga.phase, stage: g.quests.stage,
      heads: g.varuga.heads.filter((h) => h && !h.dead).length,
      targets: g.monsters.monsters.filter((m) => m.isDragonHead).length,
    };
  });
  expect(resumed.active && resumed.phase === "ground" && resumed.stage === "CH7_VARUGA2", `もどった後も戦いが続く (${JSON.stringify(resumed)})`);
  expect(resumed.heads === 3 && resumed.targets === 3, "三つの頭もそのまま残る");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 4))})`);
  console.log("dragon-pause.test: PASS");
} finally {
  await browser.close();
}
