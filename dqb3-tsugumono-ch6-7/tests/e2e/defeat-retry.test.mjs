// 敗北後の再挑戦（大岩ガニ・地上防衛の波）。
// - 大岩ガニ戦で倒れると、ボスは積み石へ戻り、下の坑道から再挑戦できる。
// - 波で祭壇の灯が尽きると、合図の直前の状態（建物・資材・矢倉・祭壇の耐久）へ戻り、もう一度迎え撃てる。
// - 波の途中でプレイヤーが倒れても、祭壇の前で立ち上がり、戦いは続く。
// - 波の途中でページを閉じても、つづきからは合図の直前から始まる。
// ヴァルガ戦の再戦は varuga-retry.test.mjs。

import {
  launchBrowser, openGame, newGame, stage, expect, SAVE_KEY,
  waitForCond, go, settle, talk, choose, completeActiveBlueprint,
  fastForward, skipToChapter7, killRaiders, pauseLoop,
} from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- ① 大岩ガニ戦の再挑戦 -----------------------------------------------------------
  // 橋を渡したところ（CH6_QUARRY・大岩ガニが潜む）まで進めた状態を作る。
  await page.evaluate(() => {
    const g = window.__game;
    for (const id of ["slope_bridge", "common_hut", "temple_base", "quarry_scaffold", "quarry_bridge"]) {
      for (const c of g.missingCells(id)) g.world.set(c.x, c.y, c.z, c.block);
      g.blueprints.completed.add(id);
    }
    for (let z = 33; z <= 35; z += 1) for (let y = 16; y <= 19; y += 1) g.world.set(15, y, z, 0);
    g.blueprints.clear();
    Object.assign(g.quests.flags, { suzuhaMet: true, ruinsTalked: true, caveOpen: true, caveBridgeDone: true, shipAway: true });
    g.setShip(false);
    g.quests.setStage("CH6_QUARRY", true);
    g.quests.applyHomes(true);
    g.quests.ch6.placeCrab();
    g.player.pos.set(8.5, 12.1, 10.5);
    g.player.vel.set(0, 0, 0);
  });
  await go(page, "CH6_CRAB");
  // 戦いの最中のポーズのセーブは、開始直前（大岩ガニが積み石のまま）の状態を書く。
  const crabSave = await page.evaluate((key) => {
    const ok = window.__game.saveNow();
    return { ok, stage: ok ? JSON.parse(localStorage.getItem(key)).stage.stage : null };
  }, SAVE_KEY);
  expect(crabSave.ok && crabSave.stage === "CH6_QUARRY", `大岩ガニ戦の最中もセーブでき、開始直前の状態が書かれる (${crabSave.stage})`);
  // 戦いの途中まで削ってから倒れる。
  await fastForward(page, 1.5);
  const hurt = await page.evaluate(() => {
    const g = window.__game;
    const c = g.quests.ch6.crab;
    g.hurtMonster(c, 40, { x: c.pos.x + 3, y: c.pos.y, z: c.pos.z }, {});
    const hp = c.hp;
    g.graceT = 0;
    g.player.invuln = 0;
    g.attackEntity(g.player, 999, c.pos);
    return { hp, max: c.maxHp };
  });
  expect(hurt.hp < hurt.max, `大岩ガニを削った (${hurt.hp}/${hurt.max})`);
  await waitForCond(page, () => window.__game.quests.stage === "CH6_QUARRY" && !window.__game.combat.playerDowned, undefined, { label: "crab retry respawn" });
  await settle(page);
  const retry = await page.evaluate(() => {
    const g = window.__game;
    const c = g.quests.ch6.crab;
    return {
      stage: g.quests.stage, dormant: c.dormant, untargetable: c.untargetable, hp: c.hp, max: c.maxHp,
      crabs: g.monsters.monsters.filter((m) => m.type === "great_rock_crab" && !m.dead).length,
      php: g.player.hp, pmax: g.player.maxHp, z: g.player.pos.z, y: g.player.pos.y,
      bgm: g.bgm.current, battle: g.battleActive,
    };
  });
  expect(retry.stage === "CH6_QUARRY" && retry.dormant && retry.untargetable, `倒れると、大岩ガニは積み石へ戻る (${JSON.stringify(retry)})`);
  expect(retry.hp === retry.max && retry.crabs === 1, "大岩ガニの体力は元に戻り、1体だけいる");
  expect(retry.php === retry.pmax && retry.z > 18 && retry.y < 14, `下の坑道で立ち上がる (z=${retry.z.toFixed(1)})`);
  expect(retry.bgm === "field" && !retry.battle, "通常曲へ戻り、戦いは終わっている");
  // もう一度近づけば、また戦いになり、倒せる。
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
  expect(await page.evaluate(() => window.__game.inventory.count("wedge") === 3), "再挑戦で大岩ガニを倒し、先へ進める");

  // --- ② 第1波の敗北 → 合図の直前へ戻る ------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.flags.shipAway = false;
    g.setShip(true);
  });
  await skipToChapter7(page);
  await completeActiveBlueprint(page);
  await settle(page);
  const before = await page.evaluate(() => {
    const g = window.__game;
    g.dharma.loadBolts();
    g.inventory.add("log", 5);
    return {
      bolts: g.dharma.bolts, altar: g.dharma.altarHp, logs: g.inventory.count("log"),
      gate: g.world.get(32, 16, 51), palisade: g.world.get(30, 16, 51), spikes: g.world.get(32, 15, 53),
      hour: g.daynight.hour, day: g.daynight.day,
    };
  });
  await talk(page, "gonta");
  await pauseLoop(page, true);
  await choose(page, 0);
  await waitForCond(page, () => window.__game.defense.active, undefined, { label: "wave 1 started" });
  // 戦いの間に、矢を使い、門と防壁が壊れ、資材も使ったことにする。
  await fastForward(page, 22);
  const during = await page.evaluate(() => {
    const g = window.__game;
    g.world.set(32, 16, 51, 0);
    g.world.set(30, 16, 51, 0);
    g.world.set(30, 17, 51, 0);
    g.inventory.remove("log", 5);
    return { bolts: g.dharma.bolts, raid: g.monsters.count(true) };
  });
  expect(during.bolts < before.bolts && during.raid > 0, `戦いの間に矢が減る (${before.bolts}→${during.bolts})`);
  // 祭壇の灯が尽きる。
  await page.evaluate(() => window.__game.defense.damageBanner(9999));
  await pauseLoop(page, false);
  await waitForCond(page, () => !window.__game.defense.active, undefined, { label: "wave lost" });
  await go(page, "CH7_ALARM", { timeout: 40000 });
  await waitForCond(page, () => !window.__game.quests.busy && window.__game.dharma.bolts > 0, undefined, { label: "checkpoint restored" });
  const after = await page.evaluate(() => {
    const g = window.__game;
    return {
      stage: g.quests.stage, bolts: g.dharma.bolts, altar: g.dharma.altarHp, logs: g.inventory.count("log"),
      gate: g.world.get(32, 16, 51), palisade: g.world.get(30, 16, 51), spikes: g.world.get(32, 15, 53),
      raid: g.monsters.count(true), bgm: g.bgm.current, cleared: g.quests.flags.wavesCleared ?? 0,
      marker: g.villager("gonta").marker.visible, crossbows: g.dharma.crossbows.size, battle: g.battleActive,
    };
  });
  expect(after.stage === "CH7_ALARM" && !after.battle && after.raid === 0, `敗北すると、合図の直前へ戻る (${after.stage})`);
  expect(after.bolts === before.bolts && after.altar === before.altar && after.logs === before.logs,
    `矢倉・祭壇の耐久・資材が戻る (矢${after.bolts}/${before.bolts}・灯${after.altar}・木材${after.logs})`);
  expect(after.gate === before.gate && after.palisade === before.palisade && after.spikes === before.spikes && after.crossbows === 2,
    "壊された門・防壁が、戦いの前の姿へ戻る");
  expect(after.cleared === 0 && after.bgm === "field" && after.marker, "波は突破していない。ゴンタへもう一度合図できる");

  // もう一度合図 → 今度は勝つ。
  await talk(page, "gonta");
  await choose(page, 0);
  await waitForCond(page, () => window.__game.defense.active, undefined, { label: "wave 1 again" });
  await fastForward(page, 4);
  expect(await page.evaluate(() => window.__game.monsters.count(true) === 8), "再挑戦でも、同じ第1波が来る");
  await killRaiders(page);
  await fastForward(page, 2);
  await go(page, "CH7_PREP2");
  expect(await page.evaluate(() => window.__game.quests.flags.wavesCleared === 1), "再挑戦で第1波を退けた");

  // --- ③ 波の途中で倒れても、祭壇の前で立ち上がり、戦いは続く ---------------------------
  await talk(page, "gonta");
  await choose(page, 0);
  await waitForCond(page, () => window.__game.defense.active, undefined, { label: "wave 2 started" });
  await fastForward(page, 3);
  await page.evaluate(() => {
    const g = window.__game;
    g.graceT = 0;
    g.player.invuln = 0;
    g.attackEntity(g.player, 999, { x: 32.5, y: 16, z: 60 });
  });
  await waitForCond(page, () => !window.__game.combat.playerDowned && window.__game.player.hp === window.__game.player.maxHp, undefined, { label: "respawn in battle" });
  const down = await page.evaluate(() => {
    const g = window.__game;
    return { stage: g.quests.stage, active: g.defense.active, x: g.player.pos.x, y: g.player.pos.y, z: g.player.pos.z, cleared: g.quests.flags.wavesCleared };
  });
  expect(down.stage === "CH7_WAVE2" && down.active && down.cleared === 1, `倒れても戦いは続く (${down.stage})`);
  expect(Math.abs(down.x - 32.5) < 1.5 && down.z > 28 && down.z < 34 && down.y > 18.5, `祭壇の前で立ち上がる (${down.x.toFixed(1)}, ${down.y.toFixed(1)}, ${down.z.toFixed(1)})`);

  // --- ④ 波の途中でページを閉じる → つづきからは合図の直前 -------------------------------
  const saved = await page.evaluate((key) => {
    const ok = window.__game.saveNow();
    return { ok, stage: JSON.parse(localStorage.getItem(key)).stage.stage };
  }, SAVE_KEY);
  expect(saved.ok && saved.stage === "CH7_PREP2", `戦いの途中のセーブは、合図の直前の状態 (${saved.stage})`);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started === true, undefined, { label: "continue" });
  await settle(page);
  const resumed = await page.evaluate(() => {
    const g = window.__game;
    return { stage: g.quests.stage, active: g.defense.active, raid: g.monsters.count(true), cleared: g.quests.flags.wavesCleared, marker: g.villager("gonta").marker.visible };
  });
  expect(resumed.stage === "CH7_PREP2" && !resumed.active && resumed.raid === 0 && resumed.cleared === 1,
    `つづきからは、第2波の合図の直前から (${JSON.stringify(resumed)})`);
  expect(resumed.marker, "ゴンタへ合図して、第2波をやり直せる");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("defeat-retry.test: PASS");
} finally {
  await browser.close();
}
