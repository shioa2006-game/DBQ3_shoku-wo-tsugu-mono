// 戦いの前後のセーブの回帰テスト。下ごしらえ（建築・敵の始末・場面の移動）は代行するが、
// セーブのボタン・会話・選択肢・リロードは本物を使う。
// 第7章の戦い（3波・ヴァルガ）は、ゴンタへの合図のときに「開始直前の状態」を保存する（docs/DESIGN.md の「8. 第7章の防衛」）。
// - 戦いの最中にポーズでセーブしてロードすると、準備の段階（合図の前）から始まる。戦いの間の変化は残らない
// - 勝利の会話・結びのムービーの間は、オートセーブもポーズのセーブもできない（途中の場面を保存しない）
// - 敗北すると、その場で開始直前の状態へ戻る（建物・持ち物・収納箱・矢倉・祭壇の耐久・時刻）。突破済みの波はそのまま。
//   ヴァルガ戦で負けても、竜の頭や体は残らない
// - 勝利の後のセーブをロードしても、戦いは始まり直さない
// 合図のときに保存されることと、準備の段階のロード（損傷と修復ガイド）は chapter7.test.mjs が確かめる。
import {
  launchBrowser, openGame, newGame, expect, waitForCond, advanceToChoice, sleep, SAVE_KEY,
  completeActiveBlueprint, skipToChapter7, fastForward, pauseLoop,
} from "../helpers.mjs";
import { B } from "../../src/world/blocks.js";

const GATE = [32, 16, 51]; // 防衛線の門
const browser = await launchBrowser(), errors = [];
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  // 会話を送りながら、進行が落ち着く（会話・暗転が終わる）まで待つ。target を渡すと、そのステージになるまで続ける。
  // 会話は本物を流すが、行数が多いので、開いている会話は1行ずつキーで送らずにまとめて送る。選択肢が出たら止まる。
  async function settle(target = null) {
    const start = Date.now();
    let calm = 0;
    for (;;) {
      const st = await page.evaluate((target) => {
        const g = window.__game, d = g.ui.dialogue;
        if (d.open) {
          const lines = d.lines; // 送り終えた後に続けて始まる別の会話は、次の回で送る
          while (d.open && d.lines === lines) { d.typing = false; d.advance(); }
          return "sent";
        }
        if (document.querySelector(".choice-panel button")) return "choice";
        if (g.quests.busy || (target && g.quests.stage !== target)) return "waiting";
        return "calm";
      }, target);
      if (st === "choice") return;
      calm = st === "calm" ? calm + 1 : 0;
      if (calm >= 3) return;
      if (Date.now() - start > 40000) throw new Error(`TIMEOUT waiting for the story to settle (${target ?? "no stage"})`);
      await sleep(st === "sent" ? 30 : 100);
    }
  }
  // ポーズの実際のボタンでセーブして、ゲームへ戻る。
  async function save() {
    await page.keyboard.press("Escape");
    await page.click(".btn-save");
    await page.locator(".btn-resume").click();
    await waitForCond(page, () => !window.__game.ui.modalOpen);
  }
  async function reload(expected) {
    await page.reload({ waitUntil: "networkidle" });
    await page.click(".btn-continue");
    await waitForCond(page, () => window.__game.started);
    expect(await page.evaluate(() => window.__game.quests.stage) === expected, "ロード → " + expected);
  }
  const savedStage = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)).stage.stage, SAVE_KEY);
  // ゴンタへ合図して戦いを始める（会話と選択肢は本物）。battle は、戦いの最中のステージ。
  async function signal(battle) {
    await page.evaluate(() => window.__game.quests.onTalk("gonta"));
    await settle();
    await advanceToChoice(page);
    await page.locator(".choice-panel button").first().click();
    await settle(battle); // ヴァルガ戦は、名乗り・再挑戦の会話の後に始まる
    await waitForCond(page, () => window.__game.defense.active || window.__game.varuga.active, undefined, { label: `${battle} started` });
  }
  // 会話・ムービーの最中は、オートセーブが何も書かず、Esc でポーズも開かない。
  async function guardedSave(label, expectedSaved = null) {
    const guard = await page.evaluate((key) => {
      const g = window.__game;
      const before = localStorage.getItem(key);
      g.autosave();
      const after = localStorage.getItem(key);
      return { same: before === after, busy: g.quests.busy, saved: after ? JSON.parse(after).stage.stage : null };
    }, SAVE_KEY);
    await page.keyboard.press("Escape");
    await waitForCond(page, () => !window.__game.input.pressedKeys.has("escape"));
    const pauseHidden = await page.evaluate(() => window.__game.ui.pause.classList.contains("hidden"));
    expect(guard.same && guard.busy && pauseHidden, label + ": オートセーブもポーズのセーブも、途中の場面を保存しない");
    if (expectedSaved) expect(guard.saved === expectedSaved, `${label}: セーブは ${expectedSaved} のまま（やり直せる）`);
  }
  // 「開始直前の状態」に含まれるもの（建物・持ち物・収納箱・矢倉・祭壇の耐久・時刻）と、戦いの様子。
  const snapshot = () => page.evaluate((gate) => {
    const g = window.__game;
    return {
      stage: g.quests.stage,
      gate: g.world.get(...gate),
      onigiri: g.inventory.count("onigiri"),
      chestLogs: g.crew.siteStorage()?.count("log") ?? -1,
      bolts: g.dharma.bolts,
      altar: g.dharma.altarHp,
      hour: g.daynight.hour,
      active: g.defense.active || g.varuga.active,
      raiders: g.monsters.monsters.filter((m) => m.raid && !m.isDragonHead).length,
      heads: g.monsters.monsters.filter((m) => m.isDragonHead).length,
      rig: !!g.varuga.rig,
      frozen: g.daynight.frozen,
      bgm: g.bgm.current,
      cleared: g.quests.flags.wavesCleared ?? 0,
      signalMarker: g.villager("gonta").marker.visible,
    };
  }, GATE);
  // 同じ「開始直前の状態」か（時刻は、戻った後に少し進む分を許す）。
  const samePrep = (a, b) =>
    a.stage === b.stage && a.gate === b.gate && a.onigiri === b.onigiri &&
    a.chestLogs === b.chestLogs && a.bolts === b.bolts && a.altar === b.altar && Math.abs(a.hour - b.hour) < 0.5;
  // 戦いの間に起きる変化を置く: 門が壊れ、矢と食料が減り、収納箱の中身が変わる。
  const battleDamage = () => page.evaluate((gate) => {
    const g = window.__game;
    g.world.set(...gate, 0);
    g.dharma.bolts = Math.max(0, g.dharma.bolts - 7);
    g.inventory.remove("onigiri", 2);
    g.crew.siteStorage().add("log", 5);
  }, GATE);

  // --- 第1波: 戦いの最中のセーブ → ロードすると準備の段階から -----------------------------
  await skipToChapter7(page);
  await completeActiveBlueprint(page);
  await settle();
  await page.evaluate(() => window.__game.dharma.loadBolts());
  const prep1 = await snapshot();
  expect(prep1.stage === "CH7_ALARM" && prep1.gate === B.GATE && prep1.bolts >= 30 && prep1.onigiri >= 2 && prep1.chestLogs === 0 && prep1.signalMarker,
    `そなえの済んだ状態 (${JSON.stringify(prep1)})`);
  await signal("CH7_WAVE1");
  await fastForward(page, 2.8);
  await battleDamage();
  await page.evaluate(() => window.__game.defense.damageBanner(60));
  const mid1 = await snapshot();
  expect(mid1.active && mid1.raiders === 8 && mid1.gate === 0 && Math.abs(mid1.hour - prep1.hour) > 1 && !samePrep(mid1, prep1),
    `第1波の最中（夜になり、群れが飛来し、門が壊れた） (${JSON.stringify(mid1)})`);
  // セーブのボタンが書いたことを確かめるため、合図のときのセーブを消してから押す。
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await save();
  expect((await savedStage()) === "CH7_ALARM", "戦いの最中のポーズのセーブは 合図の前のステージを書く");
  await reload("CH7_ALARM");
  const loaded1 = await snapshot();
  expect(!loaded1.active && loaded1.raiders === 0 && loaded1.signalMarker, "ロードすると 戦いは始まっておらず、群れもいない（ゴンタに ！）");
  expect(samePrep(loaded1, prep1), `戦いの間の変化は残らず、そなえの状態から始まる (${JSON.stringify(loaded1)})`);
  expect(await page.evaluate(() => window.__game.dharma.crossbows.size === 2 && window.__game.quests.flags.defenseBuilt === true), "防衛線とボウガンは 建てたまま");

  // --- 第1波の勝利: 会話の間は保存できない。会話が済むと次の準備の段階が保存される -------
  await signal("CH7_WAVE1");
  await page.evaluate(() => window.__game.defense.finish(true));
  await guardedSave("第1波の勝利の会話", "CH7_ALARM");
  await settle("CH7_PREP2");
  expect((await savedStage()) === "CH7_PREP2", "勝利の会話が済むと 次の準備の段階がオートセーブされる");

  // --- 第2波の敗北: その場で開始直前の状態へ戻る ---------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.dharma.altarHp = 150; // 祭壇は前の波で傷んだまま
    g.daynight.hour = 10; // 一夜明けた朝（戦いは夜になるので、時刻が戻ることを見分けられる）
  });
  const prep2 = await snapshot();
  expect(prep2.stage === "CH7_PREP2" && prep2.cleared === 1 && prep2.altar === 150 && prep2.gate === B.GATE, `第2波の準備の段階 (${JSON.stringify(prep2)})`);
  await signal("CH7_WAVE2");
  await fastForward(page, 2.8);
  await battleDamage();
  const mid2 = await snapshot();
  expect(mid2.active && mid2.raiders === 7 && mid2.bgm === "boss" && Math.abs(mid2.hour - prep2.hour) > 1, `第2波の最中（夜になり、岩砕きの混じる群れが来る） (${JSON.stringify(mid2)})`);
  await page.evaluate(() => window.__game.defense.damageBanner(9999)); // 祭壇の灯が消える
  await settle("CH7_PREP2");
  const lost2 = await snapshot();
  expect(!lost2.active && lost2.raiders === 0 && lost2.bgm === "field" && lost2.signalMarker, "敗北の会話の後、戦いは片づく（群れは消え、通常曲、ゴンタに ！）");
  expect(samePrep(lost2, prep2), `敗北で 開始直前の状態へ戻る（門・持ち物・収納箱・矢倉・祭壇の耐久・時刻） (${JSON.stringify(lost2)})`);
  expect(lost2.cleared === 1, "突破済みの波はそのまま");

  // --- ヴァルガとの最終決戦の敗北: 竜の頭も体も残さずに戻る -----------------------------------
  await page.evaluate(() => window.__game.quests.setStage("CH7_FINAL_PREP", true));
  const prep3 = await snapshot();
  await signal("CH7_VARUGA2");
  // 翼を射抜いて前庭へ降ろし、三つの頭を出す（降りるまでの時間は、実時間のループを止めて進める）。
  await pauseLoop(page, true);
  await page.evaluate(() => {
    const g = window.__game;
    while (g.varuga.phase === "air") g.varuga.onWingHit();
  });
  await fastForward(page, 3);
  await pauseLoop(page, false);
  await settle(); // 降りたときの会話
  await battleDamage();
  const mid3 = await snapshot();
  expect(mid3.active && mid3.heads === 3 && mid3.rig && mid3.frozen && mid3.gate === 0, `最終決戦の最中（竜が前庭に降り、三つの頭が出ている） (${JSON.stringify(mid3)})`);
  await page.evaluate(() => { window.__game.dharma.altarHp = 0; }); // 祭壇の灯が消える
  await waitForCond(page, () => !window.__game.varuga.active, undefined, { label: "final battle lost" });
  await settle("CH7_FINAL_PREP");
  const lost3 = await snapshot();
  expect(!lost3.active && lost3.heads === 0 && !lost3.rig && !lost3.frozen && lost3.bgm === "field", `敗北の後、竜の頭も体も残らない (${JSON.stringify(lost3)})`);
  expect(samePrep(lost3, prep3), `消えた灯と 戦いの間の変化も、開始直前の状態へ戻る (${JSON.stringify(lost3)})`);

  // --- 最終決戦の勝利: 会話の間は保存できない。勝利の後のセーブをロードしても戦いは始まり直さない --
  await signal("CH7_VARUGA2");
  await page.evaluate(() => window.__game.varuga.finish(true));
  await guardedSave("最終決戦の勝利の会話", "CH7_FINAL_PREP");
  await settle("CH7_AFTERMATH");
  await waitForCond(page, () => window.__game.blueprints.active?.id === "reopen_repair", undefined, { label: "reopen_repair active" });
  await save();
  await reload("CH7_AFTERMATH");
  expect(await page.evaluate(() => {
    const g = window.__game;
    return g.quests.flags.varugaDefeated === true && g.blueprints.active?.id === "reopen_repair" &&
      !g.varuga.active && !g.varuga.rig && !g.monsters.monsters.some((m) => m.isDragonHead);
  }), "勝利の後のセーブ: ロードすると 神殿の再開の設計図が戻り、ヴァルガ戦は始まり直さない");

  // --- 結びのムービー: 流れている間は保存できない。見終えると完結が保存される ---------------
  // 結びはムービー（M14）が受け持つので、ここだけムービーを流す。
  await page.evaluate(() => {
    const g = window.__game;
    window.__SHOKU_SKIP_MOVIES__ = false;
    g.quests.setStage("CH7_DEPARTURE", true);
    g.quests.onTalk("watari");
  });
  await advanceToChoice(page);
  await page.locator(".choice-panel button").first().click();
  await waitForCond(page, () => window.__game.ui.dialogue.open, undefined, { label: "farewell dialogue" });
  await page.evaluate(() => {
    const d = window.__game.ui.dialogue;
    while (d.open) { d.typing = false; d.advance(); } // 見送りの会話を送る → ムービーが始まる
  });
  await waitForCond(page, () => window.__game.movies.open, undefined, { label: "ending movie shown" });
  await guardedSave("結びのムービー", "CH7_AFTERMATH");
  await waitForCond(page, () => {
    const m = window.__game.movies;
    if (m.current?.player) m.skip();
    return !m.open;
  }, undefined, { label: "ending movie closed" });
  await settle("CH7_DONE");
  expect((await savedStage()) === "CH7_DONE" && await page.evaluate(() => window.__game.baseLevel === 7), "結びの後、完結（CH7_DONE・拠点レベル7）がオートセーブされる");
  expect(errors.length === 0, `コンソールエラーなし (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("raid-save.test: PASS");
} finally { await browser.close(); }
