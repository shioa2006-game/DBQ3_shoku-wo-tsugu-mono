// Chapter integration via state injection; real mining/planting/attacks are in quality-input.test.mjs.
// 第4章「鬼火の山」の通しテスト。
// New Game から CH4_DONE まで、全ステージ・鍛冶屋の書・炉防衛・ナギ発見を検証する。
// 素材集め・移動はスクリプトで代行し、ステージ遷移と状態の整合を確認する。

import {
  launchBrowser, openGame, newGame, dlg, stage, expect,
  waitForCond, advanceToStage, advanceToChoice, completeActiveBlueprint, sleep,
} from "../helpers.mjs";
import { checkCookStand } from "../../../game-shared/tests/build-step-aside.mjs";
import { furnitureIdsOf, mealSummary, stepVillagers } from "../../../game-shared/tests/villager-footing-check.mjs";
import { BLOCK_DEFS } from "../../src/world/blocks.js";

const FURNITURE = furnitureIdsOf(BLOCK_DEFS);

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  expect((await stage(page)) === "CH4_ARRIVAL", "開幕: CH4_ARRIVAL");

  // ① カヤと話す → 海岸拠点の設計図。
  await page.evaluate(() => window.__game.quests.onTalk("kaya"));
  await dlg(page);
  await waitForCond(page, () => window.__game.blueprints.active?.id === "coast_camp", undefined, { label: "coast_camp active" });
  expect(true, "カヤとの会話で海岸拠点の設計図が開く");

  // ② 海岸拠点を完成 → CH4_COLD_FORGE。ベルクとロクが町に現れる。
  await completeActiveBlueprint(page);
  await advanceToStage(page, "CH4_COLD_FORGE");
  const coldForge = await page.evaluate(() => {
    const g = window.__game;
    const belk = g.villager("belk");
    return {
      belk: !!belk,
      roku: !!g.villager("roku"),
      // 金床の角に出ると体が金床に食い込み、押し出されて金床の上に立っていた。
      belkFree: !!belk && !belk.collides(g.world, belk.pos.x, belk.pos.y, belk.pos.z),
      baseLevel: g.baseLevel,
      bannerZ: g.bannerEntity.pos.z,
    };
  });
  expect(coldForge.belk && coldForge.roku, "ベルクとロクが配置される");
  expect(coldForge.belkFree, "ベルクは金床に食い込まない床に出る");
  expect(coldForge.baseLevel === 1, `拠点レベル1 (${coldForge.baseLevel})`);
  expect(coldForge.bannerZ < 12, `旗はまず海岸に立つ (z=${coldForge.bannerZ.toFixed(1)})`);

  // ③ ベルクの拒絶 → ロクの説明 → CH4_GATHER_PEOPLE。
  await page.evaluate(() => window.__game.quests.onTalk("belk"));
  await dlg(page);
  await waitForCond(page, () => window.__game.quests.flags.belkMet === true, undefined, { label: "belkMet" });
  await page.evaluate(() => window.__game.quests.onTalk("roku"));
  await advanceToStage(page, "CH4_GATHER_PEOPLE");
  const gather = await page.evaluate(() => ({
    sumi: !!window.__game.villager("sumi"),
    teru: !!window.__game.villager("teru"),
  }));
  expect(gather.sumi && gather.teru, "避難住民（スミ・テル）が配置される");

  // ④ 住民2人を救出 → カヤに報告 → 拠点機能が鉱山町へ移転、火山灰畑の設計図。
  await page.evaluate(() => window.__game.quests.onTalk("sumi"));
  await dlg(page);
  await waitForCond(page, () => window.__game.quests.flags.sumiRescued === true, undefined, { label: "sumiRescued" });
  await page.evaluate(() => window.__game.quests.onTalk("teru"));
  await dlg(page);
  await waitForCond(page, () => window.__game.quests.counters.rescued >= 2, undefined, { label: "rescued 2" });
  await page.evaluate(() => window.__game.quests.onTalk("kaya"));
  await dlg(page);
  await waitForCond(page, () => window.__game.quests.flags.townBaseActivated === true, undefined, { label: "townBaseActivated" });
  const town = await page.evaluate(() => ({
    bannerZ: window.__game.bannerEntity.pos.z,
    seeds: window.__game.inventory.count("volcano_grain_seed"),
    bp: window.__game.blueprints.active?.id,
    baseLevel: window.__game.baseLevel,
  }));
  expect(town.bannerZ > 12 && town.bannerZ < 32, `旗（復活地点）が鉱山町へ移る (z=${town.bannerZ.toFixed(1)})`);
  expect(town.seeds >= 6, `カヤから火山穀物の種を受け取る (${town.seeds})`);
  expect(town.bp === "ash_farm", `火山灰畑の設計図が開く (${town.bp})`);
  expect(town.baseLevel === 2, `拠点レベル2 (${town.baseLevel})`);

  // ⑤ 火山灰畑を完成 → CH4_MINE（鉱山入口の設計図）。
  await completeActiveBlueprint(page);
  await advanceToStage(page, "CH4_MINE");
  await waitForCond(page, () => window.__game.blueprints.active?.id === "mine_entrance", undefined, { label: "mine_entrance active" });
  expect(true, "鉱山入口の設計図が開く");

  // ⑥ 鉱山入口を完成 → 鉄鉱石6つで CH4_FORGE（炭焼き窯の設計図）。
  await completeActiveBlueprint(page);
  await dlg(page); // mineDone の会話
  await waitForCond(page, () => window.__game.quests.flags.mineOpen === true, undefined, { label: "mineOpen" });
  await page.evaluate(() => window.__game.inventory.add("iron_ore", 6));
  await advanceToStage(page, "CH4_FORGE");
  await waitForCond(page, () => window.__game.blueprints.active?.id === "kiln_site", undefined, { label: "kiln_site active" });
  expect(true, "鉄鉱石がそろい、炭焼き窯の設計図が開く");

  // ⑦ 炭焼き窯 → 鍛冶場 → CH4_WORK_TOGETHER（炉に火が戻る）。
  await completeActiveBlueprint(page);
  await dlg(page); // kilnDone の会話（会話末で鍛冶場の設計図が開く）
  await waitForCond(page, () => window.__game.blueprints.active?.id === "forge", undefined, { label: "forge blueprint active" });
  await completeActiveBlueprint(page);
  await advanceToStage(page, "CH4_WORK_TOGETHER");
  const forgeState = await page.evaluate(() => ({
    lit: window.__game.quests.flags.forgeLit,
    kiln: window.__game.kilns.size,
    forge: window.__game.forges.size,
  }));
  expect(forgeState.lit === true, "炉が復旧する (forgeLit)");
  expect(forgeState.kiln >= 1 && forgeState.forge >= 1, `窯と炉が設備として登録される (窯${forgeState.kiln}/炉${forgeState.forge})`);

  // ⑧ 暮らしの鉄3種の共同鍛造 → 食堂の設計図 → 初めての食事 → 書の復活 → CH4_BOOK。
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.onCrafted("hammer_iron");
    g.quests.onCrafted("iron_fitting");
    g.quests.onCrafted("iron_pot");
  });
  // 3つの鍛造演出を送り、食堂の設計図が開くのを待つ。
  for (let i = 0; i < 60; i += 1) {
    await dlg(page);
    const bp = await page.evaluate(() => window.__game.blueprints.active?.id);
    if (bp === "canteen") break;
    await sleep(250);
  }
  const canteenBp = await page.evaluate(() => window.__game.blueprints.active?.id);
  expect(canteenBp === "canteen", `鉄鍋の完成で食堂の設計図が開く (${canteenBp})`);
  // 鉄鍋→ちゃぶ台の順に置く。カヤの持ち場（鍋の東隣）は設計図のマスに掛からず、
  // 以前の持ち場（鍋の前＝ちゃぶ台）に立っていても、カヤがよけてちゃぶ台を置ける。
  const canteenY = await page.evaluate(() => window.__game.blueprints.active.baseY);
  const cook = await checkCookStand(page, {
    villagerId: "kaya",
    stove: { x: 35, y: canteenY, z: 16, item: "iron_pot" },
    table: { x: 35, y: canteenY, z: 17, item: "table" },
    standPos: "cookStandPos",
  });
  expect(cook.id === "canteen" && cook.stovePlaced, `食堂の鉄鍋を置ける (${JSON.stringify(cook)})`);
  expect(cook.standBlocks.length === 0 && !cook.standSolid, `カヤの持ち場は食堂の設計図のマスに掛からない (${JSON.stringify(cook)})`);
  expect(cook.tablePlaced && cook.movedOff && !cook.inSolid, `ちゃぶ台のマスに立つカヤがよけ、ちゃぶ台を置ける (${JSON.stringify(cook)})`);
  await completeActiveBlueprint(page);
  await advanceToStage(page, "CH4_BOOK", { timeout: 90000 }); // 食事シーン＋回想＋復活演出を挟む
  const book = await page.evaluate(() => ({
    revived: window.__game.jobs.isRevived("blacksmith"),
    progress: window.__game.jobs.bookData()[4].progress,
    baseLevel: window.__game.baseLevel,
    kamado: window.__game.kamados.size,
  }));
  expect(book.kamado >= 1, `食堂に鉄鍋が据えられ調理設備として登録される (${book.kamado})`);
  expect(book.revived === true, "鍛冶屋の書が復活する");
  expect(book.progress === 1, "書の進捗が1になる");
  expect(book.baseLevel === 3, `拠点レベル3 (${book.baseLevel})`);

  // 住民が家具の上に立たない: カヤ（鉄鍋の東隣）とベルク（金床・水桶・炉に囲まれた炉の前）の持ち場、
  // 食事の席（以前はカヤ・ベルク・スミの席が鉄鍋のマスの中で重なり、全員が何かの上に立っていた）、
  // 炉の防衛戦で戦わない住民が集まる場所（守る炉のマスの中心）。
  const posts = await stepVillagers(page, {
    ids: ["kaya", "belk"], seconds: 25, starts: { kaya: [33.5, 22.5], belk: [26.5, 25.5] }, furnitureIds: FURNITURE,
  });
  expect(
    posts.kaya.atPost && !posts.kaya.onFurniture && posts.kaya.post?.[0] === 36.5 && posts.kaya.post?.[2] === 16.5,
    `カヤは鉄鍋の東隣の床に立つ (${JSON.stringify(posts.kaya)})`,
  );
  expect(
    posts.belk.atPost && !posts.belk.onFurniture && posts.belk.post?.[0] === 27.5 && posts.belk.post?.[2] === 23.5,
    `ベルクは炉の前の床に立つ (${JSON.stringify(posts.belk)})`,
  );
  expect(posts.kaya.furnitureFrames < 120 && posts.belk.furnitureFrames < 120, `持ち場へ歩く途中も家具の上をほぼ通らない (${posts.kaya.furnitureFrames}/${posts.belk.furnitureFrames})`);
  const townIds = await page.evaluate(() => window.__game.villagers.filter((v) => !v.down).map((v) => v.id));
  const townStarts = { mina: [37.5, 21.5], gonta: [30.5, 18.5], watari: [34.5, 20.5], roku: [35.5, 22.5], sumi: [29.5, 24.5], teru: [36.5, 20.5], kaya: [33.5, 22.5], belk: [27.5, 25.5] };
  const canteenMeal = mealSummary(await stepVillagers(page, {
    ids: townIds, seconds: 45, meal: true, starts: townStarts, furnitureIds: FURNITURE,
  }));
  expect(canteenMeal.allSeated && canteenMeal.distinct, `食事では全員が別々の席の床に着き、家具の上に立たない (${JSON.stringify(canteenMeal.detail)})`);
  expect(canteenMeal.maxFurnitureFrames < 120, `食事へ歩く途中も家具の上をほぼ通らない (${JSON.stringify(canteenMeal.detail)})`);
  const rally = await page.evaluate((furniture) => {
    const g = window.__game;
    const v = g.villager("mina");
    v.postCache = null;
    const c = v.standPost({ x: 27.5, y: 6, z: 22.5 }, g.world); // 炉の防衛戦の守る対象（炉のマスの中心）
    return { at: [c.x, c.y, c.z], snapped: !!c.snapped, under: g.world.get(Math.floor(c.x), c.y - 1, Math.floor(c.z)), furniture };
  }, FURNITURE);
  expect(
    rally.snapped && !rally.furniture.includes(rally.under) && rally.at[1] === 6,
    `防衛戦では守る炉のそばの床に集まる（炉の上に乗らない） (${JSON.stringify(rally.at)})`,
  );

  // ⑨ ベルクに話して防衛開始 → CH4_DEFENSE。ゴンタが鉄の剣を受け取る。
  await page.evaluate(() => window.__game.quests.onTalk("belk"));
  await advanceToChoice(page);
  await page.evaluate(() => document.querySelectorAll(".choice-panel button")[0].click());
  await waitForCond(page, () => window.__game.defense.active === true, undefined, { label: "defense active" });
  expect((await stage(page)) === "CH4_DEFENSE", "炉の防衛戦が始まる");
  const sword = await page.evaluate(() => window.__game.villager("gonta")?.weapon);
  expect(sword === "sword_iron", `ゴンタがベルクの打った鉄の剣を持つ (${sword})`);

  // ⑩ 防衛戦に勝利 → ナギ発見 → CH4_DONE。
  await sleep(1200);
  await page.evaluate(() => window.__game.defense.finish(true));
  await advanceToStage(page, "CH4_DONE", { timeout: 60000 });
  const done = await page.evaluate(() => {
    const g = window.__game;
    const nagi = g.villager("nagi");
    return {
      nagi: !!nagi,
      down: nagi?.down,
      baseLevel: g.baseLevel,
      passOpen: g.passOpen,
    };
  });
  expect(done.nagi === true, "章末にナギが登場する");
  expect(done.down === true, "ナギは倒れたまま（第5章へ引き継ぐ）");
  expect(done.baseLevel === 4, `拠点レベル4 (${done.baseLevel})`);
  expect(done.passOpen === false, "峠は第4章クリア後も閉鎖されたまま（開通は第5章）");

  // ⑪ クリア後も自由建築できる（設計図なし・ステージ維持）。
  const post = await page.evaluate(() => ({
    bp: window.__game.blueprints.active,
    stage: window.__game.quests.stage,
  }));
  expect(post.bp === null && post.stage === "CH4_DONE", "クリア後は自由建築（アクティブな設計図なし）");

  // ⑫ セーブ → ロードでも章末状態が維持される。
  await page.evaluate(() => window.__game.autosave());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1800);
  const loaded = await page.evaluate(() => {
    const g = window.__game;
    const nagi = g.villager("nagi");
    return {
      stage: g.quests.stage,
      blacksmith: g.jobs.isRevived("blacksmith"),
      nagiDown: nagi?.down,
      gontaSword: g.villager("gonta")?.weapon,
    };
  });
  expect(loaded.stage === "CH4_DONE", `ロード後もステージ維持 (${loaded.stage})`);
  expect(loaded.blacksmith === true, "ロード後も鍛冶屋の書は復活済み");
  expect(loaded.nagiDown === true, "ロード後もナギは昏倒状態を維持");
  expect(loaded.gontaSword === "sword_iron", "ロード後もゴンタは鉄の剣を持つ");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("chapter4.test: PASS");
} finally {
  await browser.close();
}
