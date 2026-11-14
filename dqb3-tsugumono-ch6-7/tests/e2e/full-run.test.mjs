// 全編の通し: 「はじめから」から「ダーマ再興編・完」まで、途中の状態を作らずに1回で進める。
// 細かな検証は chapter6.test.mjs・chapter7.test.mjs にあるので、ここでは
// 「第6章を実際に終えた状態のまま、第7章を最後まで進められる」ことと、節目のセーブ・ロードを確かめる。
// 設計図はテスト用に直接完成させ、敵は直接倒す。

import {
  launchBrowser, openGame, newGame, stage, expect, SAVE_KEY,
  waitForCond, go, settle, talk, choose, completeActiveBlueprint, activeBlueprint,
  fastForward, killRaiders, reloadAndContinue,
} from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  expect((await stage(page)) === "CH6_ARRIVAL", "はじめから: CH6_ARRIVAL");

  const bp = (id) => waitForCond(page, (want) => window.__game.blueprints.active?.id === want, id, { label: `${id} active` });
  const build = async (id) => {
    await bp(id);
    await completeActiveBlueprint(page);
    await settle(page);
  };

  // --- 第6章 ---------------------------------------------------------------------------
  await talk(page, "suzuha");
  await build("slope_bridge");
  await go(page, "CH6_RUINS");
  await talk(page, "suzuha");
  await build("common_hut");
  await go(page, "CH6_FOUNDATION");
  await build("temple_base");
  await go(page, "CH6_VOYAGE");
  await talk(page, "ganzou");
  await go(page, "CH6_QUARRY");
  await build("quarry_scaffold");
  await build("quarry_bridge");
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(8.5, 12.1, 10.5);
    g.player.vel.set(0, 0, 0);
  });
  await go(page, "CH6_CRAB");
  await page.evaluate(() => {
    const g = window.__game;
    const c = g.quests.ch6.crab;
    g.hurtMonster(c, 9999, { x: c.pos.x + 3, y: c.pos.y, z: c.pos.z }, {});
  });
  await go(page, "CH6_KEYSTONE");
  for (const cell of [[8, 13, 3], [9, 14, 3], [10, 13, 3]]) {
    await page.evaluate(([x, y, z]) => window.__game.quests.onInteract("wedge", { x, y, z }), cell);
    await settle(page);
  }
  await page.evaluate(() => window.__game.quests.onInteract("keystone_rock", { x: 9, y: 13, z: 2 }));
  await go(page, "CH6_HAULING");
  await build("haul_road");
  await go(page, "CH6_ROOF", { timeout: 40000 });
  await talk(page, "pino");
  await build("temple_frame");
  await build("temple_roof");
  await go(page, "CH6_ALTAR");
  await build("altar_keystone");
  await go(page, "CH6_LIVING");
  await build("temple_living");
  await build("temple_library");
  await go(page, "CH6_ORDINATION");
  await talk(page, "asagi");
  await go(page, "CH6_DONE", { timeout: 40000 });
  const ch6 = await page.evaluate(() => {
    const g = window.__game;
    return { level: g.baseLevel, pillar: g.world.get(35, 19, 28), ship: g.shipPresent, people: g.villagers.map((v) => v.id).sort().join() };
  });
  expect(ch6.level === 5 && ch6.pillar === 81 && ch6.ship, `第6章・完（拠点レベル${ch6.level}・大工の印・船は桟橋）`);
  expect(ch6.people === "asagi,ganzou,gonta,mina,pino,suzuha,watari", `島にいる人: ${ch6.people}`);

  // 第6章を終えたセーブから、翌日に第7章が始まる。
  await reloadAndContinue(page);
  await page.evaluate(() => {
    const g = window.__game;
    g.daynight.day += 1;
    g.daynight.hour = 9;
    g.player.pos.set(32.5, 16.1, 45.5);
    g.player.vel.set(0, 0, 0);
  });
  await go(page, "CH7_ALARM");

  // --- 第7章 ---------------------------------------------------------------------------
  const signal = async () => {
    await talk(page, "gonta");
    await choose(page, 0);
  };
  await build("defense_line");
  await page.evaluate(() => window.__game.dharma.loadBolts());
  for (const [wave, next] of [[1, "CH7_PREP2"], [2, "CH7_PREP3"], [3, "CH7_OMEN"]]) {
    await signal();
    await waitForCond(page, () => window.__game.defense.active, undefined, { label: `wave ${wave} started` });
    await fastForward(page, 4);
    await killRaiders(page);
    await fastForward(page, 2);
    await go(page, next);
  }
  expect(await page.evaluate(() => window.__game.quests.flags.wavesCleared === 3), "3波を退けた");

  // 初襲来。
  await signal();
  await go(page, "CH7_VARUGA1");
  await page.evaluate(() => window.__game.player.pos.set(32.5, 16.1, 44.5));
  let swooped = false;
  for (let i = 0; i < 60 && !swooped; i += 1) {
    await fastForward(page, 0.5);
    swooped = await page.evaluate(() => {
      const g = window.__game;
      g.player.hp = g.player.maxHp;
      return g.varuga.state === "swoop" && g.varuga.heads.some(Boolean);
    });
  }
  expect(swooped, "初襲来: 首が降りてくる");
  await page.evaluate(() => {
    const g = window.__game;
    const head = g.varuga.heads.find(Boolean);
    for (let i = 0; i < 5; i += 1) g.hurtMonster(head, 10, g.player.pos, {});
  });
  await go(page, "CH7_REPAIR", { timeout: 40000 });
  expect(await page.evaluate(() => window.__game.missingCells("temple_roof").length >= 8), "初襲来の後、大屋根が傷ついている");

  // 修理 → 射台 → ベルクの到着 → 対空ボウガンと炊き出し。
  await build("temple_repair");
  await build("ballista_tower");
  await talk(page, "pino");
  await choose(page, 0);
  await go(page, "CH7_BALLISTA", { timeout: 40000 });
  await reloadAndContinue(page); // ベルクが着いた後のセーブ・ロード
  expect(await page.evaluate(() => !!window.__game.villager("belk") && window.__game.shipPresent), "ロード後も、ベルクと船が島にいる");
  await build("great_ballista");
  const cooked = await page.evaluate(() => {
    const g = window.__game;
    const inv = g.inventory;
    // 通しで受け取った資材で もちものが埋まっているので、余った建材を資材置き場へ移してから料理する。
    const chest = g.crew.siteStorage();
    const full = inv.slots.filter(Boolean).length;
    for (const id of ["roof", "dharma_stone", "dharma_pillar", "log", "lantern", "straw"]) {
      const n = inv.count(id);
      if (n > 0 && chest.add(id, n)) inv.remove(id, n);
    }
    const added = inv.add("fish", 3);
    const recipe = g.defs.RECIPES.find((r) => r.out === "grilled_fish");
    const made = [0, 1, 2].map(() => g.ui.hooks.craft(recipe));
    return { full, slots: inv.slots.length, added, made, count: g.quests.counters.ch7Cooked };
  });
  expect(cooked.count === 3, `かまどで料理を3回作った (${JSON.stringify(cooked)})`);
  await talk(page, "mina");
  await go(page, "CH7_FINAL_PREP");
  expect(await page.evaluate(() => window.__game.world.get(35, 19, 28) === 84), "選択の柱に四つの印がそろう");

  // 最終決戦。
  await signal();
  await go(page, "CH7_VARUGA2");
  await fastForward(page, 4);
  await page.evaluate(() => {
    const g = window.__game;
    while (g.varuga.phase === "air") g.varuga.onWingHit();
  });
  await fastForward(page, 4);
  await settle(page);
  await page.evaluate(() => {
    const g = window.__game;
    for (const head of g.varuga.heads) g.hurtMonster(head, 9999, g.player.pos, {});
  });
  await fastForward(page, 4);
  await go(page, "CH7_AFTERMATH", { timeout: 40000 });

  // 再開 → 継承 → 出航。
  await build("reopen_repair");
  await talk(page, "pino");
  await go(page, "CH7_SUCCESSION");
  await talk(page, "suzuha");
  await page.evaluate(() => window.__game.quests.onInteract("altar", { x: 32, y: 20, z: 28 }));
  await go(page, "CH7_DEPARTURE");
  await talk(page, "watari");
  await choose(page, 0);
  await go(page, "CH7_DONE", { timeout: 40000 });
  const done = await page.evaluate((key) => {
    const g = window.__game;
    return {
      level: g.baseLevel, saved: JSON.parse(localStorage.getItem(key)).stage.stage,
      books: g.jobs.bookData().filter((b) => b.revived).length, reopened: g.quests.flags.templeReopened,
    };
  }, SAVE_KEY);
  expect(done.level === 7 && done.saved === "CH7_DONE" && done.reopened, `ダーマ再興編・完（拠点レベル${done.level}・保存 ${done.saved}）`);
  expect(done.books === 6, "職業の書は六冊のまま（新しい書は復活しない）");

  // クリア後: 同じ島で続けられる。
  await reloadAndContinue(page);
  expect((await stage(page)) === "CH7_DONE" && (await activeBlueprint(page)) === null, "クリア後のセーブから、自由建築を続けられる");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("full-run.test: PASS");
} finally {
  await browser.close();
}
