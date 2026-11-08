// 第1章ストーリー全体の回帰テスト。
// イントロ → 採取 → 作業台 → 小屋 → 畑 → 稲作 → 農民の書 → 防衛戦 → 社 → エンディング
// までを状態注入で進め、各節目のステージ・住民・戦闘・夜スポーンを検証する。
// 進行の早送りはデバッグフック(window.__game)を使うが、判定は必ずゲーム側の
// 正規のイベント経路(onCrafted/onBlockPlaced/世界変更コールバック等)を通す。

import { launchBrowser, openGame, dlg, stage, expect, advanceToStage, advanceToChoice, waitForStage, waitForCond } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await page.click(".btn-new");
  await waitForCond(page, () => window.__game.ui.dialogue.open, undefined, { label: "導入会話" });
  await page.setViewportSize({ width: 640, height: 720 });
  const intro = await page.evaluate(() => {
    const dialogue = window.__game.ui.dialogue;
    const text = document.querySelector(".dlg-text");
    const box = text.closest(".dialogue");
    const lines = [];
    while (dialogue.open && lines.length < 30) {
      if (dialogue.typing) dialogue.advance();
      const r = text.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      lines.push({
        text: text.textContent,
        speaker: window.__game.ui.dialogueName.textContent,
        fits: text.scrollWidth <= text.clientWidth && text.scrollHeight <= text.clientHeight &&
          r.bottom <= b.bottom && b.bottom <= innerHeight && b.right <= innerWidth,
      });
      dialogue.advance();
    }
    return lines;
  });
  expect(intro.some((line) => line.text.includes("ゾーマ")) && intro.some((line) => line.text.includes("上の世界")), "導入でゾーマ討伐後の上の世界を説明する");
  expect(intro.some((line) => line.text.includes("職業の書を抱えて") && line.text.includes("逃げ出した")), "シオンが書を携えて神殿から脱出したと語る");
  expect(intro.some((line) => line.speaker === "職業の書"), "相棒の話者名は職業の書");
  expect(intro.every((line) => line.fits), "導入の全文が幅640pxの会話枠に収まる");
  await page.setViewportSize({ width: 1280, height: 720 });
  expect((await stage(page)) === "GATHER_WOOD", "イントロ後は GATHER_WOOD");

  // --- 木材集め → 作業台 -------------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("log", 30);
    g.inventory.add("dirt", 60);
    g.inventory.add("stone", 40);
    g.inventory.add("straw", 40);
    g.inventory.add("copper", 6);
  });
  await advanceToStage(page, "CRAFT_BENCH");
  expect((await stage(page)) === "CRAFT_BENCH", "木材5でCRAFT_BENCHへ");

  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("workbench", 1);
    g.quests.onCrafted("workbench");
  });
  await page.evaluate(() => {
    const g = window.__game;
    const px = Math.floor(g.player.pos.x) + 2;
    const pz = Math.floor(g.player.pos.z);
    g.world.set(px, g.world.groundY(px, pz), pz, 17); // B.WORKBENCH
    g.quests.onBlockPlaced("workbench");
  });
  await advanceToStage(page, "BUILD_HUT");
  expect((await stage(page)) === "BUILD_HUT", "作業台設置でBUILD_HUTへ");

  // --- 小屋 → ピノ/ミナ加入 ----------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    for (const c of [...g.blueprints.active.cells]) g.world.set(c.x, c.y, c.z, c.block);
  });
  await advanceToStage(page, "MEET_MINA");
  expect((await stage(page)) === "MEET_MINA", "小屋完成でMEET_MINAへ");
  const roster1 = await page.evaluate(() => window.__game.villagers.map((v) => v.id));
  expect(roster1.includes("pino") && roster1.includes("mina"), `ピノとミナが加入 (${roster1})`);

  // --- ミナと会話 → 畑 ---------------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    const mina = g.villager("mina");
    g.player.pos.set(mina.pos.x + 1, mina.pos.y, mina.pos.z);
  });
  await page.waitForTimeout(200);
  await page.keyboard.press("f");
  await advanceToStage(page, "BUILD_FARM");
  expect((await stage(page)) === "BUILD_FARM", "ミナ会話でBUILD_FARMへ");

  await page.evaluate(() => {
    const g = window.__game;
    for (const c of [...g.blueprints.active.cells]) g.world.set(c.x, c.y, c.z, c.block);
  });
  await advanceToStage(page, "FARMING");
  expect((await stage(page)) === "FARMING", "畑完成でFARMINGへ");
  const seeds = await page.evaluate(() => window.__game.inventory.count("seed"));
  expect(seeds === 10, `種もみを10個入手 (${seeds})`);

  // --- 章進行の準備: 種まきの実入力は quality-input.test.mjs で必須検証する ---
  await page.evaluate(() => {
    const g = window.__game;
    let n = g.quests.counters.planted;
    for (const key of [...g.farmland]) {
      if (n >= 8) break;
      const [x, y, z] = key.split(",").map(Number);
      if (g.world.get(x, y + 1, z) === 0) {
        g.world.set(x, y + 1, z, 19); // B.CROP1
        n += 1;
      }
    }
    g.quests.counters.planted = n;
  });
  await advanceToStage(page, "HARVEST");
  expect((await stage(page)) === "HARVEST", "8株植えてHARVESTへ");

  // --- 収穫 → 農民の書復活 → ゴンタ加入 -----------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    for (const key of [...g.cropGrowth.keys()]) {
      const [x, y, z] = key.split(",").map(Number);
      g.world.set(x, y, z, 21); // B.CROP3
    }
  });
  await page.evaluate(() => {
    const g = window.__game;
    for (let z = 0; z < 64; z += 1) for (let x = 0; x < 64; x += 1) for (let y = 0; y < 24; y += 1) {
      if (g.world.get(x, y, z) === 21) {
        g.world.set(x, y, z, 0);
        g.harvestCrop(x + 0.5, y + 0.4, z + 0.5);
      }
    }
  });
  const harvested = await waitForCond(
    page,
    () => (window.__game.quests.counters.harvested >= 8 ? window.__game.quests.counters.harvested : 0),
    undefined,
    { label: "harvested>=8", timeout: 8000 },
  );
  expect(harvested >= 8, `8株収穫 (${harvested})`);
  // 書の復活演出（数秒）→ PREPARE。固定待ちでなくステージ到達を待つ。
  await advanceToStage(page, "PREPARE", { timeout: 30000 });
  expect((await stage(page)) === "PREPARE", "農民の書復活でPREPAREへ");
  const roster2 = await page.evaluate(() => window.__game.villagers.map((v) => v.id));
  expect(roster2.includes("gonta"), `ゴンタが加入 (${roster2})`);

  // 攻撃の実入力・対象HP差分は quality-input.test.mjs で検証する。

  // --- 防衛戦 --------------------------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    const gonta = g.villager("gonta");
    g.player.pos.set(gonta.pos.x + 1, gonta.pos.y, gonta.pos.z);
  });
  await page.keyboard.press("f");
  await advanceToChoice(page); // 会話を進めて選択肢が出るまで待つ
  await page.click(".choice-panel button");
  await waitForStage(page, "DEFENSE", { timeout: 15000 });
  expect((await stage(page)) === "DEFENSE", "防衛戦開始でDEFENSEへ");
  expect(await page.evaluate(() => window.__game.defense.active), "defense.active が true");
  // ヘッドレス(ソフトレンダリング)ではゲーム内時間が実時間より遅く進むため、
  // 固定待ちではなく湧きをポーリングで待つ。
  const raiders = await waitForCond(
    page,
    () => window.__game.monsters.count(true),
    undefined,
    { label: "第1波の湧き", timeout: 20000, interval: 400 },
  );
  expect(raiders > 0, `第1波が湧く (${raiders}体)`);

  for (let round = 0; round < 80; round += 1) {
    const st = await page.evaluate(() => {
      const g = window.__game;
      for (const m of [...g.monsters.monsters]) if (m.raid && !m.dead) g.hurtMonster(m, 50, null);
      return g.defense.active;
    });
    if (!st) break;
    await page.waitForTimeout(700);
  }
  await advanceToStage(page, "BUILD_SHRINE");
  expect((await stage(page)) === "BUILD_SHRINE", "防衛勝利でBUILD_SHRINEへ");
  const roster3 = await page.evaluate(() => window.__game.villagers.map((v) => v.id));
  expect(roster3.includes("jinbei"), `ジンベエが加入 (${roster3})`);

  // --- 社 → 祈り → エンディング → POSTGAME ---------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    for (const c of [...g.blueprints.active.cells]) g.world.set(c.x, c.y, c.z, c.block);
  });
  await advanceToStage(page, "SHRINE_DONE");
  expect((await stage(page)) === "SHRINE_DONE", "社完成でSHRINE_DONEへ");

  await page.evaluate(() => window.__game.quests.onAltarPrayed());
  // 書の予告が長くなっても、小さめのPC画面で会話枠からはみ出さない。
  await page.evaluate(() => {
    const dialogue = window.__game.ui.dialogue;
    while (dialogue.open && !dialogue.fullText.includes("料理人の書")) dialogue.advance();
    if (dialogue.typing) dialogue.advance();
  });
  await page.setViewportSize({ width: 640, height: 720 });
  const dialogueFits = await page.locator(".dlg-text").evaluate((text) => {
    const box = text.closest(".dialogue");
    const r = text.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    return !box.classList.contains("hidden") && text.textContent.includes("僧侶の書") &&
      text.scrollWidth <= text.clientWidth && text.scrollHeight <= text.clientHeight &&
      r.bottom <= b.bottom && b.bottom <= innerHeight && b.right <= innerWidth;
  });
  expect(dialogueFits, "書の予告全文が幅640pxの会話枠に収まる");
  await page.setViewportSize({ width: 1280, height: 720 });
  await dlg(page, 20);
  // 章末は第1章の結びのムービー（M1）だけ。このテストはムービーを止めているので、
  // 文字の章末（2026-11-08に削除）を出さずに、そのまま自由行動へ進む。
  await waitForStage(page, "POSTGAME", { timeout: 15000 });
  expect(await page.evaluate(() => !document.querySelector(".ending") && !window.__game.ui.modalOpen),
    "祭壇の会話の後は、文字の章末を出さずにPOSTGAME");

  // --- 夜間の常時スポーン ----------------------------------------------------------
  await page.evaluate(() => {
    window.__game.daynight.hour = 21;
  });
  const night = await waitForCond(
    page,
    () => window.__game.monsters.monsters.length,
    undefined,
    { label: "夜間スポーン", timeout: 20000, interval: 400 },
  );
  expect(night > 0, `夜間モンスターが湧く (${night}体)`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("story.test: PASS");
} finally {
  await browser.close();
}
