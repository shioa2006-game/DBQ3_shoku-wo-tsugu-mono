// 会話・メニュー中の世界停止と、閉じた直後の被弾猶予の回帰テスト。
// - モーダルUIが開いている間は、世界時間・AI・防衛・バフ・オートセーブが進まない
// - 停止中もキャラクターのビルボードはカメラを向き続ける
// - 閉じた直後はプレイヤーと住民に約1.5秒の被弾猶予があり、防衛対象は対象外

import { launchBrowser, openGame, dlg, expect, waitForCond, sleep } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });

  // タイトルで変わったカメラ角を作ってから New Game を開始し、既定角へ戻ることを確認する。
  await page.evaluate(() => {
    window.__game.cameraYaw = 2.4;
    window.__game.cameraYawTarget = 2.4;
  });
  await page.click(".btn-new");
  await page.waitForTimeout(400);
  const camera = await page.evaluate(() => ({
    yaw: window.__game.cameraYaw,
    target: window.__game.cameraYawTarget,
    expected: Math.atan2(6.5, 8.0),
  }));
  expect(Math.abs(camera.yaw - camera.expected) < 0.01, "New Gameでカメラ角が既定値へ戻る");
  expect(Math.abs(camera.target - camera.expected) < 0.01, "カメラ目標角も既定値へ戻る");

  // 開幕の導入会話（世界停止中）でも、プレイヤーの実体(root)が pos に同期され
  // 画面内に表示される（世界停止の導入時にこの同期が漏れ、rootが原点に残って
  // 開幕の会話中だけキャラクターが見えなかった回帰の防止）。
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

  // プレイヤーの近くに住民とスライムを置き、複数の世界タイマーを設定してから停止する。
  const before = await page.evaluate(() => {
    const g = window.__game;
    const p = g.player.pos;
    const v = g.spawnVillager("pino", p.x + 2.5, p.z + 0.5);
    const m = g.monsters.spawn("slime", p.x + 1.2, p.y + 0.1, p.z);
    m.pauseTest = true;
    g.daynight.hour = 12;
    g.cooking.buff = { t: 10, atk: 1, regen: 0 };
    g.autosaveTimer = 20;
    g.defense.active = true;
    g.defense.interWave = 10;
    g.defense.bannerHp = 100;
    g.cameraYaw = 1.25;
    g.cameraYawTarget = 1.25;
    g.ui.openMenu(g.menuCtx());
    return {
      hp: g.player.hp,
      villagerHp: v.hp,
      mx: m.pos.x,
      mz: m.pos.z,
      vx: v.pos.x,
      vz: v.pos.z,
      hour: g.daynight.hour,
      buffT: g.cooking.buff.t,
      autosaveTimer: g.autosaveTimer,
      interWave: g.defense.interWave,
    };
  });

  await sleep(1800);
  const during = await page.evaluate(() => {
    const g = window.__game;
    const m = g.monsters.monsters.find((x) => x.pauseTest);
    const v = g.villager("pino");
    return {
      hp: g.player.hp,
      villagerHp: v.hp,
      mx: m.pos.x,
      mz: m.pos.z,
      vx: v.pos.x,
      vz: v.pos.z,
      hour: g.daynight.hour,
      buffT: g.cooking.buff.t,
      autosaveTimer: g.autosaveTimer,
      interWave: g.defense.interWave,
      paused: g.wasPaused,
      modalOpen: g.ui.modalOpen,
      yaw: g.cameraYaw,
      playerYaw: g.player.rig.group.rotation.y,
      villagerYaw: v.rig.group.rotation.y,
      monsterYaw: m.sprite.mesh.rotation.y,
      hpBarYaw: m.hpBar.rotation.y,
    };
  });

  expect(during.paused && during.modalOpen, "メニュー中は世界停止フラグが立つ");
  expect(during.hp === before.hp, `メニュー中はプレイヤーが被弾しない (hp ${before.hp}→${during.hp})`);
  expect(during.villagerHp === before.villagerHp, "メニュー中は住民が被弾しない");
  expect(Math.abs(during.mx - before.mx) < 0.01 && Math.abs(during.mz - before.mz) < 0.01, "メニュー中はモンスターが動かない");
  expect(Math.abs(during.vx - before.vx) < 0.01 && Math.abs(during.vz - before.vz) < 0.01, "メニュー中は住民が動かない");
  expect(Math.abs(during.hour - before.hour) < 0.0001, "メニュー中は昼夜時間が進まない");
  expect(Math.abs(during.buffT - before.buffT) < 0.0001, "メニュー中は満腹バフが減らない");
  expect(Math.abs(during.autosaveTimer - before.autosaveTimer) < 0.0001, "メニュー中はオートセーブ時間が進まない");
  expect(Math.abs(during.interWave - before.interWave) < 0.0001, "メニュー中は防衛戦タイマーが進まない");
  expect(Math.abs(during.playerYaw - during.yaw) < 0.01, "停止中もプレイヤーがカメラを向く");
  expect(Math.abs(during.villagerYaw - during.yaw) < 0.01, "停止中も住民がカメラを向く");
  expect(Math.abs(during.monsterYaw - during.yaw) < 0.01, "停止中もモンスターがカメラを向く");
  expect(Math.abs(during.hpBarYaw - during.yaw) < 0.01, "停止中もモンスターHPバーがカメラを向く");

  // メニューを閉じると、プレイヤーと住民だけに被弾猶予が付く。
  await page.evaluate(() => window.__game.ui.closeMenu());
  await waitForCond(page, () => window.__game.graceT > 0, undefined, { label: "graceT > 0" });
  const grace = await page.evaluate(() => {
    const g = window.__game;
    const v = g.villager("pino");
    const m = g.monsters.monsters.find((x) => x.pauseTest);
    const playerHp = g.player.hp;
    const villagerHp = v.hp;
    const bannerHp = g.defense.bannerHp;
    g.combat.attackEntity(g.player, 5, null);
    g.combat.attackEntity(v, 5, null);
    g.combat.attackEntity(g.bannerEntity, 2, null);
    g.monsters.remove(m);
    g.defense.active = false;
    return {
      playerHp,
      playerHpAfter: g.player.hp,
      villagerHp,
      villagerHpAfter: v.hp,
      bannerHp,
      bannerHpAfter: g.defense.bannerHp,
      graceT: g.graceT,
      invuln: g.player.invuln,
    };
  });
  expect(grace.playerHpAfter === grace.playerHp, `猶予中はプレイヤーが被弾しない (graceT=${grace.graceT.toFixed(2)})`);
  expect(grace.villagerHpAfter === grace.villagerHp, "猶予中は住民が被弾しない");
  expect(grace.bannerHpAfter === grace.bannerHp - 2, "防衛対象は被弾猶予の対象外");
  expect(grace.invuln <= 0, "被弾猶予は点滅用invulnを使わない");

  // 猶予が切れた後は通常どおり被弾する。
  await waitForCond(page, () => window.__game.graceT === 0, undefined, { label: "graceT expired", timeout: 30000 });
  const after = await page.evaluate(() => {
    const g = window.__game;
    const hp = g.player.hp;
    g.combat.attackEntity(g.player, 5, null);
    return { hp, hpAfter: g.player.hp };
  });
  expect(after.hpAfter < after.hp, `猶予後は通常どおり被弾する (hp ${after.hp}→${after.hpAfter})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("pause.test: PASS");
} finally {
  await browser.close();
}
