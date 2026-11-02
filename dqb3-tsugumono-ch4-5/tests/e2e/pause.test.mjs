// 会話・メニュー中の世界停止と、閉じた直後の被弾猶予の回帰テスト。
// - モーダルUI（会話・メニュー等）が開いている間はモンスターが動かず、攻撃も通らない
// - 閉じた直後は約1.5秒の被弾猶予（graceT）があり、その後は通常どおり被弾する

import { launchBrowser, openGame, dlg, expect, waitForCond, sleep } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });

  // 開幕の導入会話（世界停止中）でも、プレイヤーの実体(root)が pos に同期され
  // 画面内に表示される（世界停止の導入時にこの同期が漏れ、rootが原点に残って
  // 開幕の会話中だけキャラクターが見えなかった回帰の防止）。
  await page.click(".btn-new");
  await page.waitForTimeout(600);
  const introRig = await page.evaluate(() => {
    const g = window.__game;
    const wp = new (Object.getPrototypeOf(g.player.pos).constructor)();
    g.player.rig.group.getWorldPosition(wp);
    return {
      open: g.ui.dialogue.open,
      dx: Math.abs(wp.x - g.player.pos.x),
      dz: Math.abs(wp.z - g.player.pos.z),
    };
  });
  expect(introRig.open, "導入会話が開いている");
  expect(introRig.dx < 0.01 && introRig.dz < 0.01, `会話中もプレイヤーの実体がposへ同期される (${JSON.stringify(introRig)})`);
  await dlg(page);

  // プレイヤーの隣にモンスターを湧かせ、メニューを開いて世界を止める。
  const before = await page.evaluate(() => {
    const g = window.__game;
    const p = g.player.pos;
    const m = g.monsters.spawn("lava_lizard", p.x + 1.2, p.y + 0.1, p.z);
    g.ui.openMenu(g.menuCtx());
    return { hp: g.player.hp, mx: m.pos.x, mz: m.pos.z };
  });
  await sleep(1800);
  const during = await page.evaluate(() => {
    const g = window.__game;
    const m = g.monsters.monsters[0];
    return { hp: g.player.hp, mx: m?.pos.x, mz: m?.pos.z, paused: g.wasPaused };
  });
  expect(during.paused === true, "メニュー中は世界停止フラグが立つ");
  expect(during.hp === before.hp, `メニュー中はダメージを受けない (hp ${before.hp}→${during.hp})`);
  expect(
    Math.abs(during.mx - before.mx) < 0.01 && Math.abs(during.mz - before.mz) < 0.01,
    "メニュー中はモンスターが動かない",
  );

  // メニューを閉じる → 直後は被弾猶予（graceT）で攻撃が通らない。
  await page.evaluate(() => window.__game.ui.closeMenu());
  await waitForCond(page, () => window.__game.graceT > 0, undefined, { label: "graceT > 0" });
  const grace = await page.evaluate(() => {
    const g = window.__game;
    g.combat.attackEntity(g.player, 5, null);
    return { hp: g.player.hp, graceT: g.graceT };
  });
  expect(grace.hp === before.hp, `猶予中は被弾しない (graceT=${grace.graceT.toFixed(2)}, hp=${grace.hp})`);

  // 猶予が切れた後は通常どおり被弾する。
  await waitForCond(page, () => window.__game.graceT === 0, undefined, { label: "graceT expired", timeout: 30000 });
  const after = await page.evaluate(() => {
    const g = window.__game;
    g.combat.attackEntity(g.player, 5, null);
    return g.player.hp;
  });
  expect(after < before.hp, `猶予後は通常どおり被弾する (hp ${before.hp}→${after})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("pause.test: PASS");
} finally {
  await browser.close();
}
