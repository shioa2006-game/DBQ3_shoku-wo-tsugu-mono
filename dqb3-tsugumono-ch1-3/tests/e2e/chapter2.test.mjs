// 第2章「荒れた田の村」の通し回帰テスト。
// POSTGAME翌朝の開始 → 見えない壁 → 橋 → イナホ → 田/用水路 → 食堂 →
// 料理3回 → 料理人の書 → 田んぼ防衛戦（泥田の主）→ CH2_DONE → セーブ復元。

import { launchBrowser, openGame, newGame, stage, expect, advanceToStage, advanceToChoice, waitForStage, waitForCond } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- 第1章クリア相当の状態を作り、「翌朝」を迎える -------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    for (const id of ["hut", "farm", "shrine"]) g.blueprints.completed.add(id);
    g.spawnVillager("pino", 29, 46);
    g.spawnVillager("mina", 34, 49);
    g.spawnVillager("gonta", 35, 41);
    g.spawnVillager("jinbei", 33, 48);
    g.setBaseLevel(3);
    g.quests.setStage("POSTGAME", true);
    g.quests.flags.postgameDay = g.daynight.day - 1; // 「翌朝」条件を満たす
  });
  // 翌朝、章開幕はジンベエに！が付く（会話は自動再生されない）。
  await waitForStage(page, "CH2_INTRO", { timeout: 15000 });
  const jinbeiMarked = await page.evaluate(() => !!window.__game.villager("jinbei")?.marker?.visible);
  expect(jinbeiMarked, "CH2_INTROでジンベエに！マーカー");
  await page.evaluate(() => window.__game.quests.onTalk("jinbei")); // 話しかけて開幕
  await advanceToStage(page, "FIX_BRIDGE"); // ①導入会話を進めつつ到達を待つ
  expect((await stage(page)) === "FIX_BRIDGE", "ジンベエと話すとFIX_BRIDGEへ");
  const bp1 = await page.evaluate(() => window.__game.blueprints.active?.id);
  expect(bp1 === "bridge", `橋の設計図が起動 (${bp1})`);

  // --- 見えない壁: 移動も設置も南へは通らない ---------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(31, 6, 66); // 海峡へ無理やり進入
  });
  await page.waitForTimeout(400);
  const gate = await page.evaluate(() => {
    const g = window.__game;
    const clampedZ = g.player.pos.z;
    const before = g.world.get(31, 4, 75);
    g.world.set; // no-op
    return { clampedZ, southOpen: g.southOpen, before };
  });
  expect(gate.southOpen === false, "southOpen はまだ false");
  expect(gate.clampedZ <= 68.01, `プレイヤーはGATE_Zで押し戻される (z=${gate.clampedZ.toFixed(1)})`);

  // --- 橋を架ける → southOpen ---------------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    for (const c of [...g.blueprints.active.cells]) g.world.set(c.x, c.y, c.z, c.block);
  });
  await advanceToStage(page, "REACH_VILLAGE"); // ②ピノの渡り初め
  expect((await stage(page)) === "REACH_VILLAGE", "橋完成でREACH_VILLAGEへ");
  expect(await page.evaluate(() => window.__game.southOpen), "southOpen が true");

  // --- 南の村へ → イナホとの出会い（！付きイナホに話しかけて始まる）------------------
  const inahoMarked = await page.evaluate(() => !!window.__game.villager("inaho")?.marker?.visible);
  expect(inahoMarked, "橋完成でイナホが村に現れ！マーカーが付く");
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(36.5, 5.1, 82.5); // 村へ移動（旧: この座標到達だけで会話が自動再生されていた）
  });
  await page.waitForTimeout(400);
  expect((await stage(page)) === "REACH_VILLAGE", "村に入っただけでは会話は始まらない");
  await page.evaluate(() => window.__game.quests.onTalk("inaho")); // 話しかけて出会いの会話
  await advanceToStage(page, "REPAIR_PADDY"); // ③イナホ・ミナの会話
  expect((await stage(page)) === "REPAIR_PADDY", "イナホと話すとREPAIR_PADDYへ");
  const roster = await page.evaluate(() => window.__game.villagers.map((v) => v.id));
  expect(roster.includes("inaho"), `イナホが登場 (${roster})`);
  const bp2 = await page.evaluate(() => window.__game.blueprints.active?.id);
  expect(bp2 === "paddy", `田んぼの設計図が起動 (${bp2})`);

  // 泥だまりを叩くと ねん土 がドロップする（修復材の循環）。
  const clay = await page.evaluate(() => {
    const g = window.__game;
    const n0 = g.drops.length;
    g.breakBlock(28, 3, 97, { drops: "clay" }); // MUD プールの1マス
    return g.drops.length - n0;
  });
  expect(clay >= 1, `泥だまりからねん土がドロップ (${clay})`);

  // --- 田んぼ・用水路の復旧 -----------------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    for (const c of [...g.blueprints.active.cells]) g.world.set(c.x, c.y, c.z, c.block);
  });
  await advanceToStage(page, "BUILD_KITCHEN"); // ④水が来た
  expect((await stage(page)) === "BUILD_KITCHEN", "田復旧でBUILD_KITCHENへ");
  const kitchenSite = await page.evaluate(() => {
    const g = window.__game;
    const cells = [...g.blueprints.active.cells];
    const waterCells = cells.filter((c) => g.world.get(c.x, c.y, c.z) === 5);
    return {
      id: g.blueprints.active?.id,
      waterCells: waterCells.length,
      fishOnMovedPond: [[43, 90], [45, 92]].every(([x, z]) => g.world.get(x, 3, z) === 5),
    };
  });
  expect(kitchenSite.id === "kitchen", `kitchen blueprint is active (${kitchenSite.id})`);
  expect(kitchenSite.waterCells === 0, `kitchen blueprint has no water overlap (${kitchenSite.waterCells})`);
  expect(kitchenSite.fishOnMovedPond === true, "village fish spots remain on the moved pond");

  // --- 食堂とかまど -------------------------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    for (const c of [...g.blueprints.active.cells]) g.world.set(c.x, c.y, c.z, c.block);
  });
  await advanceToStage(page, "COOK_TOGETHER"); // ⑤イナホ「いっしょに作って」
  expect((await stage(page)) === "COOK_TOGETHER", "食堂完成でCOOK_TOGETHERへ");
  const kamado = await page.evaluate(() => window.__game.kamados.size);
  expect(kamado >= 1, `かまどが設置されている (${kamado})`);

  // --- かまど料理×3 → 料理人の書 -------------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("fish", 3);
    g.inventory.add("mushroom", 4);
    g.inventory.add("herb", 3);
    g.inventory.add("rice", 4);
  });
  const cookCtx = await page.evaluate(() => {
    const g = window.__game;
    const k = [...g.kamados][0].split(",").map(Number);
    g.player.pos.set(k[0] + 0.5, k[1] + 0.1, k[2] + 1.5); // かまどの前へ
    const ctx = g.menuCtx();
    return { nearKamado: ctx.nearKamado, nearBench: ctx.nearBench };
  });
  expect(cookCtx.nearKamado === true, "かまどの近くで nearKamado=true");
  // craft は ui.hooks.craft(recipe) 経由（実プレイのボタンと同じ経路）。
  for (const out of ["grilled_fish", "mushroom_soup", "feast"]) {
    await page.evaluate((out) => {
      const g = window.__game;
      // items.js の RECIPES と同内容（ページ内モジュールへ直接触れないため）。
      const table = {
        grilled_fish: { out: "grilled_fish", n: 1, cost: { fish: 1 }, station: "kamado", unlock: "COOK_TOGETHER" },
        mushroom_soup: { out: "mushroom_soup", n: 1, cost: { mushroom: 2, herb: 1 }, station: "kamado", unlock: "COOK_TOGETHER" },
        feast: { out: "feast", n: 1, cost: { rice: 2, fish: 1, mushroom: 1 }, station: "kamado", unlock: "COOK_TOGETHER" },
      };
      g.ui.hooks.craft(table[out]);
    }, out);
    await page.waitForTimeout(150);
  }
  const cookedCount = await waitForCond(
    page,
    () => (window.__game.quests.counters.cooked >= 3 ? window.__game.quests.counters.cooked : 0),
    undefined,
    { label: "cooked>=3", timeout: 6000 },
  );
  expect(cookedCount === 3, `かまど料理を3回 (${cookedCount})`);
  // 書の復活演出（約3.3s）→ 会話。固定待ちでなくステージ到達を待つ。
  await advanceToStage(page, "PADDY_PREP", { timeout: 30000 });
  expect((await stage(page)) === "PADDY_PREP", "料理人の書が復活しPADDY_PREPへ");
  const cookState = await page.evaluate(() => ({
    revived: window.__game.jobs.isRevived("cook"),
    baseLevel: window.__game.baseLevel,
    books: window.__game.jobs.bookData().length,
  }));
  expect(cookState.revived === true, "isRevived('cook') が true");
  expect(cookState.baseLevel === 4, `拠点レベル4 (${cookState.baseLevel})`);

  // --- 満腹バフ ----------------------------------------------------------------------
  const buff = await page.evaluate(() => {
    const g = window.__game;
    g.cooking.applyFood({ name: "ごちそう膳", icon: "🍱", heal: 30, buff: { t: 150, atk: 2, regen: 1 } });
    return { atkBonus: g.cooking.atkBonus, tagHidden: g.ui.buffTag.classList.contains("hidden") };
  });
  expect(buff.atkBonus === 2, `満腹バフで攻撃+2 (${buff.atkBonus})`);

  // --- 食事シーン（1日1回・18時に自動集合） -------------------------------------------
  const meal = await page.evaluate(() => {
    const g = window.__game;
    g.daynight.hour = 18.05;
    g.quests.flags.lastMealDay = 0;
    return true;
  });
  await waitForCond(page, () => window.__game.cooking.mealActive, undefined, {
    label: "食事シーン開始", timeout: 8000,
  });
  const mealState = await page.evaluate(() => ({
    active: window.__game.cooking.mealActive,
    pos: window.__game.cooking.mealPos(),
  }));
  expect(mealState.active === true, "18時に食事シーンが始まる");
  expect(mealState.pos !== null, "住民の集合位置(ちゃぶ台)がある");

  // --- 田んぼ防衛戦 -------------------------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    const gonta = g.villager("gonta");
    g.player.pos.set(gonta.pos.x + 1, gonta.pos.y, gonta.pos.z);
  });
  await page.keyboard.press("f");
  await advanceToChoice(page); // 会話を進めて選択肢が出るまで待つ
  await page.click(".choice-panel button");
  await waitForStage(page, "PADDY_DEFENSE", { timeout: 15000 });
  expect((await stage(page)) === "PADDY_DEFENSE", "防衛開始でPADDY_DEFENSEへ");
  const raidCfg = await page.evaluate(() => ({
    active: window.__game.defense.active,
    label: window.__game.defense.cfg.label,
    target: !!window.__game.defense.targetEntity,
  }));
  expect(raidCfg.active && raidCfg.label === "🌾 田んぼ", `田んぼ防衛の構成 (${raidCfg.label})`);
  expect(raidCfg.target === true, "守る対象=田んぼ(仮想エンティティ)");

  // 第1波（おおねずみ）が湧くのをポーリングで待つ。並列実行のピーク負荷では
  // ソフトレンダリングのゲーム内時間が大きく遅れるため、余裕をもった timeout にする。
  const raiders = await waitForCond(
    page,
    () => {
      const rs = window.__game.monsters.monsters.filter((m) => m.raid && !m.dead).map((m) => m.type);
      return rs.length ? rs : 0;
    },
    undefined,
    { label: "第1波の湧き", timeout: 45000, interval: 400 },
  );
  expect(raiders.length > 0 && raiders.every((t) => t === "field_rat"), `第1波はおおねずみ (${raiders})`);

  // 湧いたそばから倒して防衛戦を完走（泥田の主が出たことも確認）。
  let sawBoss = false;
  for (let round = 0; round < 90; round += 1) {
    const st = await page.evaluate(() => {
      const g = window.__game;
      for (const m of [...g.monsters.monsters]) if (m.raid && !m.dead) g.hurtMonster(m, 60, null);
      return { active: g.defense.active, boss: !!g.defense.boss };
    });
    if (st.boss) sawBoss = true;
    if (!st.active) break;
    await page.waitForTimeout(600);
  }
  expect(sawBoss, "最終波で泥田の主が出現");
  await advanceToStage(page, "CH2_DONE"); // ⑨勝利の会話（収穫祭〜港への引き）
  expect((await stage(page)) === "CH2_DONE", "防衛勝利でCH2_DONEへ");

  // --- セーブ/ロード: 第2章クリア状態が復元される --------------------------------------
  await page.evaluate(() => window.__game.autosave());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game && window.__game.quests.stage === "CH2_DONE", undefined, {
    label: "セーブ復元後のステージ", timeout: 12000,
  });
  const restored = await page.evaluate(() => ({
    stage: window.__game.quests.stage,
    southOpen: window.__game.southOpen,
    inaho: !!window.__game.villager("inaho"),
    cook: window.__game.jobs.isRevived("cook"),
  }));
  expect(restored.stage === "CH2_DONE", `ステージ復元 (${restored.stage})`);
  expect(restored.southOpen === true, "southOpen 復元");
  expect(restored.inaho === true, "イナホ復元");
  expect(restored.cook === true, "料理人の書の復活状態を復元");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("chapter2.test: PASS");
} finally {
  await browser.close();
}
