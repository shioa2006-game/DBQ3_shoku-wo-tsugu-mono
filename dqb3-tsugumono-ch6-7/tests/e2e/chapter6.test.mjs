// 第6章「よみがえるダーマ神殿」の通しテスト。
// New Game から CH6_DONE まで、全ステージ・船の出入り・大岩ガニ・要石・授職を検証する。
// 素材集め・移動はスクリプトで代行し、ステージ遷移と状態の整合を確認する
// （実際の採掘・設置の操作は quality-input.test.mjs、資材不足からの復帰は shortage.test.mjs）。

import {
  launchBrowser, openGame, newGame, stage, expect, SAVE_KEY,
  waitForCond, go, settle, completeActiveBlueprint, reloadAndContinue, talk, activeBlueprint,
} from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  expect((await stage(page)) === "CH6_ARRIVAL", "開幕: CH6_ARRIVAL");

  const start = await page.evaluate(() => {
    const g = window.__game;
    return {
      villagers: g.villagers.map((v) => v.id).sort(),
      ship: g.shipPresent,
      marker: g.villager("suzuha")?.marker.visible,
      z: g.player.pos.z,
    };
  });
  expect(start.villagers.join() === "gonta,mina,suzuha,watari", `着岸時の人物（${start.villagers}）`);
  expect(start.ship, "船は桟橋に停泊している");
  expect(start.marker, "スズハに ！ が付く");
  expect(start.z > 96, `開始位置は南の砂浜 (z=${start.z.toFixed(1)})`);

  // ① スズハと話す → 水運びの橋。
  await talk(page, "suzuha");
  await waitForCond(page, () => window.__game.blueprints.active?.id === "slope_bridge", undefined, { label: "slope_bridge active" });
  expect(true, "スズハとの会話で 水運びの橋 の設計図が開く");

  // ② 橋の完成 → CH6_RUINS。スズハは神殿跡へ先に上がる。
  await completeActiveBlueprint(page);
  await go(page, "CH6_RUINS");
  await talk(page, "suzuha");
  await waitForCond(page, () => window.__game.blueprints.active?.id === "common_hut", undefined, { label: "common_hut active" });
  const ruins = await page.evaluate(() => ({ straw: window.__game.inventory.count("straw"), clay: window.__game.inventory.count("clay") }));
  expect(ruins.straw >= 24 && ruins.clay >= 4, `スズハから わら・ねん土を受け取る (${ruins.straw}/${ruins.clay})`);

  // ③ 共同小屋 → CH6_FOUNDATION。アサギとガンゾウが加わり、旗が立つ。
  await completeActiveBlueprint(page);
  await go(page, "CH6_FOUNDATION");
  await waitForCond(page, () => window.__game.blueprints.active?.id === "temple_base", undefined, { label: "temple_base active" });
  const found = await page.evaluate(() => {
    const g = window.__game;
    return {
      asagi: !!g.villager("asagi"), ganzou: !!g.villager("ganzou"),
      baseLevel: g.baseLevel, bannerZ: g.bannerEntity.pos.z,
      stone: g.inventory.count("dharma_stone"), kamado: g.kamados.size,
    };
  });
  expect(found.asagi && found.ganzou, "アサギとガンゾウが加わる");
  expect(found.baseLevel === 1, `拠点レベル1 (${found.baseLevel})`);
  expect(found.bannerZ > 40 && found.bannerZ < 50, `職業の旗が前庭に立つ (z=${found.bannerZ.toFixed(1)})`);
  expect(found.stone >= 16, `ガンゾウから 神殿の石を受け取る (${found.stone})`);
  expect(found.kamado >= 1, "共同小屋のかまどが調理設備として登録される");

  // 建築途中のセーブ・ロード: 設計図と住民が戻る。
  await reloadAndContinue(page);
  const reload1 = await page.evaluate(() => {
    const g = window.__game;
    return { stage: g.quests.stage, bp: g.blueprints.active?.id, villagers: g.villagers.map((v) => v.id).sort().join(), ship: g.shipPresent };
  });
  expect(reload1.stage === "CH6_FOUNDATION" && reload1.bp === "temple_base", `建築途中のロード: ステージと設計図が戻る (${reload1.stage}/${reload1.bp})`);
  expect(reload1.villagers === "asagi,ganzou,gonta,mina,suzuha,watari", `住民が重複せず戻る (${reload1.villagers})`);

  // ④ 住民の手伝い: 資材置き場の箱へ石を入れると、大工たちが基壇を組む。
  const crew = await page.evaluate(async () => {
    const g = window.__game;
    const before = g.missingCells("temple_base").filter((c) => g.world.get(c.x, c.y, c.z) === 0).length;
    const storage = g.crew.siteStorage();
    storage.add("dharma_stone", 12);
    for (let i = 0; i < 400; i += 1) g.crew.update(0.05);
    const after = g.missingCells("temple_base").filter((c) => g.world.get(c.x, c.y, c.z) === 0).length;
    return { before, after, left: storage.count("dharma_stone"), members: g.crew.members().length };
  });
  expect(crew.members >= 2, `大工たちが工事場にいる (${crew.members}人)`);
  expect(crew.after < crew.before && crew.left < 12, `資材置き場の石で 大工たちが基壇を組む (空きマス ${crew.before}→${crew.after}、石の残り ${crew.left})`);

  // ⑤ 基壇の完成 → CH6_VOYAGE。ガンゾウが採石洞の入口で待つ。
  await completeActiveBlueprint(page);
  await go(page, "CH6_VOYAGE");
  expect(await page.evaluate(() => window.__game.baseLevel === 2), "拠点レベル2");
  expect(await page.evaluate(() => window.__game.world.get(15, 16, 34) !== 0), "採石洞の入口は まだ大岩でふさがっている");

  // ⑥ 入口のガンゾウと話す → 大岩がどき、船が出航する（ワタリも不在）。
  await talk(page, "ganzou");
  await go(page, "CH6_QUARRY");
  const voyage = await page.evaluate(() => {
    const g = window.__game;
    return {
      open: g.world.get(15, 16, 34) === 0 && g.world.get(15, 19, 33) === 0,
      ship: g.shipPresent, watari: !!g.villager("watari"),
      bp: g.blueprints.active?.id, escort: g.quests.ch6.escort,
    };
  });
  expect(voyage.open, "採石洞の入口が開く");
  expect(!voyage.ship && !voyage.watari, "ワタリと船が出航して不在になる");
  expect(voyage.bp === "quarry_scaffold", `採石洞の足場の設計図が開く (${voyage.bp})`);
  expect(voyage.escort, "ゴンタが採石洞へ同行する");

  // 航海中のセーブ・ロード: 船とワタリは不在のまま。
  await reloadAndContinue(page);
  const reload2 = await page.evaluate(() => {
    const g = window.__game;
    return { stage: g.quests.stage, ship: g.shipPresent, watari: !!g.villager("watari"), bp: g.blueprints.active?.id };
  });
  expect(reload2.stage === "CH6_QUARRY" && !reload2.ship && !reload2.watari, `航海中のロード: 船とワタリは不在のまま (${JSON.stringify(reload2)})`);
  expect(reload2.bp === "quarry_scaffold", "航海中のロード: 設計図が戻る");

  // ⑦ 足場 → 橋 → 採石場に大岩ガニが潜む。
  await completeActiveBlueprint(page);
  await settle(page);
  await waitForCond(page, () => window.__game.blueprints.active?.id === "quarry_bridge", undefined, { label: "quarry_bridge active" });
  await completeActiveBlueprint(page);
  await settle(page);
  const dormant = await page.evaluate(() => {
    const c = window.__game.quests.ch6.crab;
    return c ? { dormant: c.dormant, untargetable: c.untargetable, type: c.type } : null;
  });
  expect(dormant?.dormant && dormant.untargetable, `大岩ガニが積み石のふりをして潜む (${JSON.stringify(dormant)})`);

  // ⑧ 採石場へ近づくと動き出す → CH6_CRAB。
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(8.5, 12.1, 10.5);
    g.player.vel.set(0, 0, 0);
  });
  await go(page, "CH6_CRAB");
  const awake = await page.evaluate(() => {
    const c = window.__game.quests.ch6.crab;
    return { dormant: c.dormant, bgm: window.__game.bgm.current, battle: window.__game.battleActive };
  });
  expect(!awake.dormant && awake.battle, "大岩ガニが動き出し、戦いになる");
  expect(awake.bgm === "boss", `ボス曲に切り替わる (${awake.bgm})`);

  // 正面は硬く、横腹は通る。
  const armor = await page.evaluate(() => {
    const g = window.__game;
    const c = g.quests.ch6.crab;
    c.facingDir.set(0, 1);
    const hp0 = c.hp;
    g.hurtMonster(c, 10, { x: c.pos.x, y: c.pos.y, z: c.pos.z + 3 }, {}); // 正面から
    const front = hp0 - c.hp;
    const hp1 = c.hp;
    g.hurtMonster(c, 10, { x: c.pos.x + 3, y: c.pos.y, z: c.pos.z }, {}); // 横から
    return { front, side: hp1 - c.hp };
  });
  expect(armor.front < armor.side && armor.side === 10, `正面は硬く、横腹は通る (正面${armor.front}/横${armor.side})`);

  // ⑨ 倒す → くさびの印が付く → CH6_KEYSTONE。
  await page.evaluate(() => {
    const g = window.__game;
    const c = g.quests.ch6.crab;
    g.hurtMonster(c, 9999, { x: c.pos.x + 3, y: c.pos.y, z: c.pos.z }, {});
  });
  await go(page, "CH6_KEYSTONE");
  const keystone = await page.evaluate(() => ({ wedges: window.__game.inventory.count("wedge"), bgm: window.__game.bgm.current }));
  expect(keystone.wedges === 3, `くさびを3本受け取る (${keystone.wedges})`);
  expect(keystone.bgm === "field", "通常曲へ戻る");

  // ⑩ くさびを3つ打ち、最後の一打 → 要石が切り出される → CH6_HAULING。
  for (const [x, y, z] of [[8, 13, 3], [9, 14, 3], [10, 13, 3]]) {
    await page.evaluate(([cx, cy, cz]) => window.__game.quests.onInteract("wedge", { x: cx, y: cy, z: cz }), [x, y, z]);
    await settle(page);
  }
  expect(await page.evaluate(() => window.__game.quests.counters.wedges === 3), "くさびを3つ打った");
  await page.evaluate(() => window.__game.quests.onInteract("keystone_rock", { x: 9, y: 13, z: 2 }));
  await go(page, "CH6_HAULING");
  await waitForCond(page, () => window.__game.blueprints.active?.id === "haul_road", undefined, { label: "haul_road active" });
  expect(true, "要石が切り出され、搬出路の設計図が開く");

  // ⑪ 搬出路 → 住民と運び出す。その間にワタリとピノが帰港する → CH6_ROOF。
  await completeActiveBlueprint(page);
  await go(page, "CH6_ROOF", { timeout: 40000 });
  const back = await page.evaluate(() => {
    const g = window.__game;
    return {
      ship: g.shipPresent, watari: !!g.villager("watari"), pino: !!g.villager("pino"),
      px: g.player.pos.x, py: g.player.pos.y, escort: g.quests.ch6.escort,
      gontaY: g.villager("gonta").pos.y, marker: g.villager("pino").marker.visible,
    };
  });
  expect(back.ship && back.watari && back.pino, "船が戻り、ワタリとピノが島にいる");
  expect(back.px > 16 && back.py >= 16, `プレイヤーは採石洞の外へ出ている (x=${back.px.toFixed(1)}, y=${back.py.toFixed(1)})`);
  expect(!back.escort && back.gontaY >= 16, "ゴンタも外へ戻る");
  expect(back.marker, "ピノに ！ が付く");

  // 帰港後のセーブ・ロード: 船と人物が重複しない。
  await reloadAndContinue(page);
  const reload3 = await page.evaluate(() => {
    const g = window.__game;
    return { ship: g.shipPresent, villagers: g.villagers.map((v) => v.id).sort().join() };
  });
  expect(reload3.ship && reload3.villagers === "asagi,ganzou,gonta,mina,pino,suzuha,watari", `帰港後のロード: 船と人物が一致 (${reload3.villagers})`);

  // ⑫ ピノと話す → 柱と壁 → 梁と大屋根 → CH6_ALTAR。
  await talk(page, "pino");
  await waitForCond(page, () => window.__game.blueprints.active?.id === "temple_frame", undefined, { label: "temple_frame active" });
  const gifts = await page.evaluate(() => {
    const g = window.__game;
    const total = (id) => g.inventory.count(id) + g.pendingRewards.filter(([i]) => i === id).reduce((n, [, c]) => n + c, 0);
    return { roof: total("roof"), stone: total("dharma_stone"), pillar: total("dharma_pillar"), emblem: total("emblem") };
  });
  expect(gifts.roof >= 200 && gifts.stone >= 120 && gifts.pillar >= 24 && gifts.emblem >= 1, `ピノとガンゾウの資材を受け取る (${JSON.stringify(gifts)})`);
  await completeActiveBlueprint(page);
  await settle(page);
  await waitForCond(page, () => window.__game.blueprints.active?.id === "temple_roof", undefined, { label: "temple_roof active" });
  const oldPillars = await page.evaluate(() => {
    const g = window.__game;
    return [30, 34].every((x) => [19, 20, 21, 22].every((y) => g.world.get(x, y, 35) === 67));
  });
  expect(oldPillars, "入口の両脇に、崩れずに残った二本の古い柱がそのまま立つ");
  await completeActiveBlueprint(page);
  await go(page, "CH6_ALTAR");
  const roof = await page.evaluate(() => ({
    baseLevel: window.__game.baseLevel, keystone: window.__game.inventory.count("keystone"), bp: window.__game.blueprints.active?.id,
  }));
  expect(roof.baseLevel === 3, `拠点レベル3 (${roof.baseLevel})`);
  expect(roof.keystone === 1 && roof.bp === "altar_keystone", `要石を受け取り、祭壇の設計図が開く (${JSON.stringify(roof)})`);

  // ⑬ 要石の祭壇 → CH6_LIVING → 横の入口と水場 → 書庫と共同台所 → CH6_ORDINATION。
  await completeActiveBlueprint(page);
  await go(page, "CH6_LIVING");
  expect(await page.evaluate(() => window.__game.baseLevel === 4 && window.__game.quests.flags.altarLit === true), "祭壇に灯がともり、拠点レベル4");
  expect((await activeBlueprint(page)) === "temple_living", "横の入口と水場の設計図が開く");
  await completeActiveBlueprint(page);
  await settle(page);
  await waitForCond(page, () => window.__game.blueprints.active?.id === "temple_library", undefined, { label: "temple_library active" });
  expect(await page.evaluate(() => window.__game.inventory.count("barley_seed") >= 6), "ミナから山麦の種を受け取る");
  await completeActiveBlueprint(page);
  await go(page, "CH6_ORDINATION");
  const hall = await page.evaluate(() => {
    const g = window.__game;
    const a = g.villager("asagi");
    return { y: a.pos.y, z: a.pos.z, marker: a.marker.visible, free: !a.collides(g.world, a.pos.x, a.pos.y, a.pos.z) };
  });
  expect(hall.marker && hall.y >= 19 && hall.z < 35 && hall.free, `アサギが本堂で待つ (${JSON.stringify(hall)})`);

  // ⑭ 最初の授職 → 選択の柱に大工の印 → 第6章・完。
  await talk(page, "asagi");
  await go(page, "CH6_DONE", { timeout: 40000 });
  const done = await page.evaluate((SAVE_KEY) => {
    const g = window.__game;
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    return {
      pillar: g.world.get(35, 19, 28), marks: g.quests.flags.pillarMarks, baseLevel: g.baseLevel,
      saved: raw?.stage?.stage, books: g.jobs.bookData().filter((b) => b.revived).length,
    };
  }, SAVE_KEY);
  expect(done.pillar === 81 && done.marks === 1, `選択の柱にアサギの大工の印が刻まれる (block ${done.pillar})`);
  expect(done.baseLevel === 5, `拠点レベル5 (${done.baseLevel})`);
  expect(done.saved === "CH6_DONE", `章末でオートセーブされる (${done.saved})`);
  expect(done.books === 6, `職業の書は六冊のまま（新しい書は復活しない）(${done.books})`);

  // ⑮ 翌日の日中に第7章が始まる。
  await page.evaluate(() => {
    const g = window.__game;
    g.daynight.day += 1;
    g.daynight.hour = 9;
  });
  await go(page, "CH7_ALARM");
  expect((await activeBlueprint(page)) === "defense_line", "第7章: 山道の防衛線の設計図が開く");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("chapter6.test: PASS");
} finally {
  await browser.close();
}
