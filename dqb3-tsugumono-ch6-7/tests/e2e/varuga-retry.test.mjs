// ヴァルガ戦の敗北と再戦（初襲来・最終決戦）。
// - 祭壇の灯が尽きると、合図の直前の状態へ戻る（焼けた屋根・使った大矢も戻る）。
// - 再戦では、襲来のムービー（M12）を流し直さない。
// - 最終決戦の直前のセーブを読み直しても、同じ準備の段階から再戦できる。
// 波の再挑戦と大岩ガニは defeat-retry.test.mjs、勝ち筋の通しは chapter7.test.mjs。

import {
  launchBrowser, openGame, newGame, stage, expect,
  waitForCond, go, settle, talk, choose, completeActiveBlueprint,
  fastForward, skipToChapter7, reloadAndContinue,
} from "../helpers.mjs";

// 祭壇の灯を尽きさせ、敗北が確定するまで待つ。フレームを直接回し、進まないときは状態を出す。
async function loseBattle(page, label) {
  await page.evaluate(() => { window.__game.dharma.altarHp = 0; });
  for (let i = 0; i < 100; i += 1) {
    await fastForward(page, 0.2);
    if (await page.evaluate(() => !window.__game.varuga.active)) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  const st = await page.evaluate(() => {
    const g = window.__game;
    return { modal: g.ui.modalOpen, busy: g.quests.busy, downed: g.combat.playerDowned, phase: g.varuga.phase, state: g.varuga.state, altar: g.dharma.altarHp, hp: g.player.hp };
  });
  throw new Error(`${label}: 敗北が確定しない ${JSON.stringify(st)} errors=${JSON.stringify(errors.slice(0, 3))}`);
}

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  await skipToChapter7(page);
  await completeActiveBlueprint(page);
  await settle(page);
  // 3波を退けたところ（CH7_OMEN）から始める。ムービーの再生回数を数える。
  await page.evaluate(() => {
    const g = window.__game;
    g.dharma.loadBolts();
    g.quests.flags.wavesCleared = 3;
    g.blueprints.clear();
    g.quests.setStage("CH7_OMEN", true);
    window.__moviePlays = [];
    const play = g.movies.play.bind(g.movies);
    g.movies.play = (name, ...rest) => {
      window.__moviePlays.push(name);
      return play(name, ...rest);
    };
  });
  await settle(page);

  // --- ① 初襲来の敗北 -------------------------------------------------------------------
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA1");
  await fastForward(page, 9);
  const burned = await page.evaluate(() => {
    const g = window.__game;
    return { roof: g.missingCells("temple_roof").length, plays: window.__moviePlays.join(), active: g.varuga.active };
  });
  expect(burned.active && burned.roof >= 8, `初襲来で大屋根が焼ける (欠け ${burned.roof})`);
  expect(burned.plays === "ch7-three-heads", `初回は襲来のムービー（M12）を流す (${burned.plays})`);
  await loseBattle(page, "初襲来");
  await go(page, "CH7_OMEN", { timeout: 40000 });
  await waitForCond(page, () => !window.__game.quests.busy && window.__game.dharma.altarHp > 0, undefined, { label: "assault checkpoint restored" });
  const lost1 = await page.evaluate(() => {
    const g = window.__game;
    return {
      stage: g.quests.stage, roof: g.missingCells("temple_roof").length, altar: g.dharma.altarHp,
      seen: g.quests.flags.m12Seen, done: !!g.quests.flags.varuga1Done, ship: g.shipPresent,
      bgm: g.bgm.current, frozen: g.daynight.frozen, marker: g.villager("gonta").marker.visible,
    };
  });
  expect(lost1.stage === "CH7_OMEN" && !lost1.done && lost1.ship, `敗北すると、合図の直前へ戻る (${lost1.stage})`);
  expect(lost1.roof === 0 && lost1.altar === 200, `焼けた大屋根と祭壇の灯が、戦いの前へ戻る (欠け ${lost1.roof}・灯 ${lost1.altar})`);
  expect(lost1.bgm === "field" && !lost1.frozen && lost1.marker, "通常曲へ戻り、時刻も動き出す。ゴンタへ合図できる");

  // 再戦: ムービーは流し直さず、短い会話で始まる。今度はひるませて勝つ。
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA1");
  expect(await page.evaluate(() => window.__moviePlays.length === 1 && window.__game.quests.flags.m12Seen), "再戦では、襲来のムービーを流し直さない");
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(32.5, 16.1, 44.5);
    g.player.hp = g.player.maxHp;
  });
  let swooped = false;
  for (let i = 0; i < 60 && !swooped; i += 1) {
    await fastForward(page, 0.5);
    swooped = await page.evaluate(() => {
      const g = window.__game;
      g.player.hp = g.player.maxHp;
      return g.varuga.state === "swoop" && g.varuga.heads.some(Boolean);
    });
  }
  expect(swooped, "再戦でも、火炎のあとに首が降りてくる");
  await page.evaluate(() => {
    const g = window.__game;
    const head = g.varuga.heads.find(Boolean);
    for (let i = 0; i < 5; i += 1) g.hurtMonster(head, 10, g.player.pos, {});
  });
  await go(page, "CH7_REPAIR", { timeout: 40000 });
  expect(await page.evaluate(() => window.__game.quests.flags.varuga1Done === true), "再戦でヴァルガを退けた");

  // --- ② 最終決戦の準備まで進める -------------------------------------------------------
  await completeActiveBlueprint(page); // 神殿の修理
  await settle(page);
  await completeActiveBlueprint(page); // 射台
  await settle(page);
  await talk(page, "pino");
  await choose(page, 0);
  await go(page, "CH7_BALLISTA", { timeout: 40000 });
  await completeActiveBlueprint(page); // 大型対空ボウガン
  await settle(page);
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("fish", 3);
    const recipe = { out: "grilled_fish", n: 1, cost: { fish: 1 }, station: "kamado" };
    for (let i = 0; i < 3; i += 1) g.ui.hooks.craft(recipe);
  });
  await talk(page, "mina");
  await go(page, "CH7_FINAL_PREP");
  const prep = await page.evaluate(() => {
    const g = window.__game;
    return { bolts: g.inventory.count("great_bolt"), roof: g.missingCells("temple_roof").length, altar: g.dharma.altarHp };
  });
  expect(prep.bolts >= 6 && prep.roof === 0, `最終決戦の準備が整う (大矢 ${prep.bolts}本)`);

  // --- ③ 最終決戦の敗北 -----------------------------------------------------------------
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA2");
  await fastForward(page, 5);
  const fight = await page.evaluate(() => {
    const g = window.__game;
    g.ballista.mount();
    g.ballista.fire();
    g.varuga.onWingHit();
    g.varuga.onWingHit();
    return { bolts: g.inventory.count("great_bolt"), wings: g.varuga.wingHits, mounted: g.ballista.mounted };
  });
  expect(fight.bolts === prep.bolts - 1 && fight.wings === 2 && fight.mounted, `大矢を撃ち、翼を2度射抜いた (大矢 ${fight.bolts}本)`);
  await fastForward(page, 9); // 空からの火炎で屋根が焼ける
  const mid = await page.evaluate(() => window.__game.missingCells("temple_roof").length);
  await loseBattle(page, "最終決戦");
  await go(page, "CH7_FINAL_PREP", { timeout: 40000 });
  await waitForCond(page, () => !window.__game.quests.busy && window.__game.dharma.altarHp > 0, undefined, { label: "final checkpoint restored" });
  const lost2 = await page.evaluate(() => {
    const g = window.__game;
    return {
      stage: g.quests.stage, bolts: g.inventory.count("great_bolt"), roof: g.missingCells("temple_roof").length,
      altar: g.dharma.altarHp, ballista: !!g.ballista.cell, mounted: g.ballista.mounted, flying: g.ballista.bolts.length,
      defeated: !!g.quests.flags.varugaDefeated, seen: g.quests.flags.finalSeen, pillar: g.world.get(35, 19, 28),
    };
  });
  expect(lost2.stage === "CH7_FINAL_PREP" && !lost2.defeated, `敗北すると、最後の合図の直前へ戻る (${lost2.stage})`);
  expect(lost2.bolts === prep.bolts && lost2.altar === prep.altar, `使った大矢と祭壇の灯が戻る (大矢 ${lost2.bolts}本・灯 ${lost2.altar})`);
  expect(mid > 0 ? lost2.roof === 0 : true, `焼けた屋根も戻る (戦いの間の欠け ${mid} → ${lost2.roof})`);
  expect(lost2.ballista && !lost2.mounted && lost2.flying === 0 && lost2.pillar === 84, "大型対空ボウガンと選択の柱はそのまま。射台からは降りている");

  // --- ④ 直前のセーブを読み直しても、同じ準備の段階から再戦できる -------------------------
  await reloadAndContinue(page);
  const reload = await page.evaluate(() => {
    const g = window.__game;
    return {
      stage: g.quests.stage, bolts: g.inventory.count("great_bolt"), ballista: !!g.ballista.cell,
      belk: !!g.villager("belk"), varuga: g.varuga.active, marker: g.villager("gonta").marker.visible,
    };
  });
  expect(reload.stage === "CH7_FINAL_PREP" && reload.ballista && reload.belk && !reload.varuga && reload.marker,
    `読み直しても、最終決戦の準備から (${JSON.stringify(reload)})`);
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA2");
  const again = await page.evaluate(() => {
    const g = window.__game;
    return { wings: g.varuga.wingHits, phase: g.varuga.phase, kind: g.varuga.kind };
  });
  expect(again.kind === "final" && again.phase === "air" && again.wings === 0, `再戦は、翼の傷なしの最初から (${JSON.stringify(again)})`);
  // 今度は翼を射抜き、三つの頭を倒して勝つ。
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
  expect(await page.evaluate(() => window.__game.quests.flags.varugaDefeated === true), "再戦でヴァルガを倒した");
  expect((await stage(page)) === "CH7_AFTERMATH", "戦後の修復へ進む");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("varuga-retry.test: PASS");
} finally {
  await browser.close();
}
