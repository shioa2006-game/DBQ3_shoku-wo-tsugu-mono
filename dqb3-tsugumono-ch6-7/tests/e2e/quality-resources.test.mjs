// 資源が失われない・増えないことの回帰テスト。実際のワールドの通知・持ち物・セーブ/ロードを通して確かめ、時間は明示的に進める。
// - 持ち物が満杯のときの報酬は「預かり」になり、空きができた分だけ受け取る。セーブ/ロードをまたいでも二重にならない
// - 章の進行の報酬（スズハの資材、要石、職業の書の写し）と、大岩ガニを倒した報酬（くさび）も、満杯で失われない
// - 自然のきのこは、採った場所にだけ1日で生え直す。建物・人・耕した土・水は上書きしない
import { launchBrowser, openGame, newGame, expect, waitForCond, dlg } from "../helpers.mjs";
import { B, BLOCK_DEFS } from "../../src/world/blocks.js";
import { WORLD } from "../../src/world/world.js";
const browser = await launchBrowser();
const errors = [];
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  // ポーズ（世界を止める）を開く／閉じる。
  const pause = async () => {
    await page.keyboard.press("Escape");
    await page.waitForSelector(".btn-save", { state: "visible" });
  };
  const unpause = async () => {
    await page.keyboard.press("Escape");
    await waitForCond(page, () => !window.__game.ui.modalOpen, undefined, { label: "pause closed" });
  };
  // ポーズの実際のボタンでセーブし、ページを読み直して「つづきから」。再びポーズで世界を止める。
  const saveAndReload = async () => {
    await page.click(".btn-save");
    await page.reload({ waitUntil: "networkidle" });
    await page.click(".btn-continue");
    await waitForCond(page, () => window.__game.started);
    await pause();
  };
  await pause();
  const rewards = await page.evaluate(() => {
    const g = window.__game;
    g.inventory.slots.fill(null);
    for (let i = 0; i < 24; i += 1) g.inventory.slots[i] = { id: "stone", count: 99 };
    g.inventory.slots[0] = { id: "barley_seed", count: 98 };
    g.giveItems([["barley_seed", 10], ["herb", 3]]);
    return { seeds: g.inventory.count("barley_seed"), pending: g.pendingRewards };
  });
  expect(rewards.seeds === 99 && JSON.stringify(rewards.pending) === JSON.stringify([["barley_seed", 9], ["herb", 3]]), "複数の報酬のうち 受け取りきれない分は預かりになる");
  // ポーズで世界が止まっている間に、実際の収納の操作で1マス空ける。
  await page.evaluate(() => {
    const g = window.__game;
    g.storage.open("1,1,1");
    g.ui.hooks.storeItem(1);
  });
  await waitForCond(page, () => window.__game.inventory.count("barley_seed") === 108);
  await page.evaluate(() => window.__game.ui.hideStorage());
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 1 && window.__game.pendingRewards[0][0] === "herb"), "空いたマスには 残りの種だけが入る");
  await saveAndReload();
  expect(await page.evaluate(() => window.__game.inventory.count("barley_seed") === 108 && window.__game.pendingRewards[0][1] === 3), "受け取った分と預かりの分が ロード後も残る");
  await page.evaluate(() => { const g = window.__game; g.inventory.remove("stone", 99); });
  await waitForCond(page, () => window.__game.inventory.count("herb") === 3);
  const once = await page.evaluate(() => {
    const g = window.__game;
    for (let i = 0; i < 5; i += 1) g.collectPendingRewards();
    return g.pendingRewards.length === 0 && g.inventory.count("barley_seed") === 108 && g.inventory.count("herb") === 3;
  });
  expect(once, "何度受け取ろうとしても 報酬は増えない");
  await saveAndReload();
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 0 && window.__game.inventory.count("herb") === 3), "受け取り終えた報酬は ロード後も受け取り済みのまま");

  // 章の進行の実際の報酬。持ち物を満杯にして受け取り、実際のセーブ/ロードをまたぐ。
  for (const reward of [
    // 神殿跡のスズハ: わらとねん土（共同小屋の材料）。
    { label: "スズハの わら・ねん土", stage: "CH6_RUINS", npc: "suzuha", flag: "ruinsTalked", items: [["straw", 24], ["clay", 4]] },
    // 大屋根の完成: 要石（祭壇へ据えるのに欠かせない）。
    { label: "要石", stage: "CH6_ROOF", bp: "temple_roof", items: [["keystone", 1]] },
    // スズハへの継承: 職業の書の写し（祭壇へ納めるのに欠かせない）。
    { label: "職業の書の写し", stage: "CH7_SUCCESSION", npc: "suzuha", flag: "copyGiven", items: [["book_copy", 1]] },
  ]) {
    await unpause();
    await page.evaluate((r) => {
      const g = window.__game; g.pendingRewards = [];
      g.inventory.slots = Array.from({ length: 24 }, () => ({ id: "stone", count: 99 }));
      g.quests.stage = r.stage; g.quests.busy = false;
      if (r.flag) g.quests.flags[r.flag] = false;
      if (r.npc) g.quests.onTalk(r.npc);
      else { g.blueprints.completed.add(r.bp); g.quests.onBlueprintComplete(r.bp); }
    }, reward);
    await dlg(page, 60);
    await waitForCond(page, () => !window.__game.quests.busy);
    expect(await page.evaluate((r) => {
      const g = window.__game;
      const again = r.npc ? g.quests.onTalk(r.npc) : false; // ふつうの話しかけ直しでは、もう一度もらえない
      return !again && r.items.every(([id]) => g.inventory.count(id) === 0) && JSON.stringify(g.pendingRewards) === JSON.stringify(r.items);
    }, reward), reward.label + ": 満杯でも 章の報酬がちょうど1回ぶん預かりになる");
    await pause();
    await saveAndReload();
    expect(await page.evaluate((r) => JSON.stringify(window.__game.pendingRewards) === JSON.stringify(r.items), reward), reward.label + ": 預かりはロード後も残る");
    await page.evaluate((r) => window.__game.inventory.remove("stone", 99 * r.items.length), reward);
    await waitForCond(page, (r) => r.items.every(([id, n]) => window.__game.inventory.count(id) === n), reward);
    expect(await page.evaluate(() => window.__game.pendingRewards.length === 0), reward.label + ": 空きを作ると ちょうど1回だけ受け取る");
  }

  // 大岩ガニを倒した報酬（くさび）は、その場のドロップではなく進行の報酬。満杯でも失われない。
  // （ヴァルガは何も残さないので、ボスの報酬はこれだけ）
  await unpause();
  await page.evaluate(() => {
    const g = window.__game; g.pendingRewards = [];
    g.inventory.slots = Array.from({ length: 24 }, () => ({ id: "stone", count: 99 }));
    g.quests.stage = "CH6_CRAB"; g.quests.busy = false; g.quests.flags.crabDefeated = false;
    g.quests.ch6.placeCrab();
    const crab = g.quests.ch6.crab;
    crab.awaken();
    g.hurtMonster(crab, 9999, { x: crab.pos.x + 3, y: crab.pos.y, z: crab.pos.z }, {}); // 横腹から
  });
  await dlg(page, 60);
  await waitForCond(page, () => !window.__game.quests.busy);
  expect(await page.evaluate(() => {
    const g = window.__game;
    return g.quests.stage === "CH6_KEYSTONE" && g.inventory.count("wedge") === 0 && JSON.stringify(g.pendingRewards) === JSON.stringify([["wedge", 3]]);
  }), "満杯でも 大岩ガニを倒した報酬のくさびが預かりになる");
  await pause();
  await saveAndReload();
  await page.evaluate(() => window.__game.inventory.remove("stone", 99));
  await waitForCond(page, () => window.__game.inventory.count("wedge") === 3);
  expect(await page.evaluate((mark) => {
    const g = window.__game;
    return g.quests.flags.crabDefeated === true && g.quests.stage === "CH6_KEYSTONE" && g.pendingRewards.length === 0 && g.world.get(8, 13, 3) === mark && !g.quests.ch6.crab;
  }, B.WEDGE_MARK), "くさびと撃破の記録（フラグ・くさびの印）が ロード後もそろって残り、大岩ガニは出直さない");

  // 自然のきのこ（山道の森と、採石洞の脇道）。
  const mushroom = await page.evaluate(({ B, def, dims }) => {
    const g = window.__game, w = g.world;
    const sites = [];
    for (let z = 0; z < dims.D; z += 1) for (let x = 0; x < dims.W; x += 1) for (let y = 1; y < dims.H; y += 1)
      if (w.get(x, y, z) === B.MUSHROOM) {
        if (w.pristine[w.idx(x, y, z)] !== B.MUSHROOM) throw Error("unexpected mushroom outside natural sites");
        sites.push({ x, y, z, soil: w.get(x, y - 1, z) });
      }
    for (const c of sites) g.breakBlock(c.x, c.y, c.z, def);
    const c = sites.find((s) => s.soil === B.GRASS), key = [c.x, c.y, c.z].join(",");
    g.mushrooms.update(150);
    return {
      c, key, count: sites.length, onRock: sites.filter((s) => s.soil === B.MOUNTAIN_ROCK).length,
      waiting: g.mushrooms.regrow.size, left: g.mushrooms.regrow.get(key), drops: g.drops.filter((d) => d.itemId === "mushroom").length,
    };
  }, { B, def: BLOCK_DEFS[B.MUSHROOM], dims: WORLD });
  expect(mushroom.count > 0 && mushroom.onRock > 0 && mushroom.count > mushroom.onRock, `自然のきのこは 森の草地と採石洞の岩の上にある (${mushroom.count}か所・うち岩の上 ${mushroom.onRock})`);
  expect(mushroom.waiting === mushroom.count && mushroom.drops === mushroom.count && mushroom.left === 150, "自然のきのこを すべて1回ずつ採った。生え直しまで あと半日");
  await saveAndReload();
  const growth = await page.evaluate(({ B, mushroom }) => {
    const g = window.__game, w = g.world, c = mushroom.c;
    const left = g.mushrooms.regrow.get(mushroom.key);
    // 建物があると生え直さない。どければ、期限を過ぎた場所はやり直す。
    w.set(c.x, c.y, c.z, B.WALL);
    g.mushrooms.update(151);
    const blocked = w.get(c.x, c.y, c.z) === B.WALL && g.mushrooms.regrow.has(mushroom.key);
    w.set(c.x, c.y, c.z, B.AIR);
    const pos = g.player.pos.clone();
    g.player.pos.set(c.x + 0.5, c.y, c.z + 0.5);
    g.mushrooms.update(1);
    const occupied = w.get(c.x, c.y, c.z) === B.AIR;
    g.player.pos.copy(pos);
    w.set(c.x, c.y - 1, c.z, B.FARMLAND);
    g.mushrooms.update(1);
    const farm = w.get(c.x, c.y, c.z) === B.AIR;
    w.set(c.x, c.y - 1, c.z, B.STONE); g.mushrooms.update(1);
    const newFloor = w.get(c.x, c.y, c.z) === B.AIR;
    w.set(c.x, c.y - 1, c.z, w.pristine[w.idx(c.x, c.y - 1, c.z)]);
    w.set(c.x, c.y, c.z, B.WATER);
    g.mushrooms.update(1);
    const water = w.get(c.x, c.y, c.z) === B.WATER;
    w.set(c.x, c.y, c.z, B.AIR);
    g.mushrooms.update(1);
    const regrown = w.get(c.x, c.y, c.z) === B.MUSHROOM;
    let total = 0, onRock = 0;
    for (let z = 0; z < mushroom.dims.D; z += 1) for (let x = 0; x < mushroom.dims.W; x += 1) for (let y = 1; y < mushroom.dims.H; y += 1)
      if (w.get(x, y, z) === B.MUSHROOM) { total += 1; if (w.get(x, y - 1, z) === B.MOUNTAIN_ROCK) onRock += 1; }
    return { left, blocked, occupied, farm, newFloor, water, regrown, total, onRock, waiting: g.mushrooms.regrow.size };
  }, { B, mushroom: { ...mushroom, dims: WORLD } });
  expect(growth.left > 149 && growth.left <= 150, "生え直しまでの残り時間が ロード後も続く");
  expect(growth.blocked && growth.occupied && growth.farm && growth.newFloor && growth.water && growth.regrown, "建物・人・耕した土・新しい床・水は上書きせず、空けば生え直す: " + JSON.stringify(growth));
  expect(growth.total === mushroom.count && growth.onRock === mushroom.onRock && growth.waiting === 0, "自然の場所は 採石洞の岩の上も含めて すべて生え直す");
  const second = await page.evaluate(({ B, def, c }) => {
    const g = window.__game;
    const before = g.drops.filter((d) => d.itemId === "mushroom").length;
    g.breakBlock(c.x, c.y, c.z, def);
    g.mushrooms.update(299);
    const notYet = g.world.get(c.x, c.y, c.z) === B.AIR;
    g.mushrooms.update(1.01);
    return { notYet, regrown: g.world.get(c.x, c.y, c.z) === B.MUSHROOM, drops: g.drops.filter((d) => d.itemId === "mushroom").length - before };
  }, { B, def: BLOCK_DEFS[B.MUSHROOM], c: mushroom.c });
  expect(second.notYet && second.regrown && second.drops === 1, "2回めも まる1日待ってから生え、ドロップは1つ");
  expect(await page.evaluate((B) => {
    const g = window.__game, w = g.world;
    const natural = w.pristine[w.idx(26, 16, 44)] === B.MUSHROOM;
    w.set(26, 16, 44, B.MUSHROOM); w.set(26, 16, 44, B.AIR);
    return !natural && !g.mushrooms.regrow.has("26,16,44");
  }, B), "自然の場所ではない前庭へ プレイヤーが置いたきのこは 生え直しを予約しない");
  await page.reload({ waitUntil: "networkidle" });
  await page.click(".btn-new");
  await waitForCond(page, () => window.__game.started);
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 0 && window.__game.mushrooms.regrow.size === 0), "「はじめから」は 預かりも生え直しの予約も無い状態で始まる");
  expect(errors.length === 0, `コンソールエラーなし (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("quality-resources.test: PASS");
} finally { await browser.close(); }
