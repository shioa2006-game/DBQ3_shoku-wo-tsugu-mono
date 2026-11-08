// 第3章「旅立ちの港」の通し回帰テスト（ジパング復興編・完）。
// CH2_DONE翌朝の開始 → 桟橋 → 灯台 → 船体/帆柱/帆（船乗りの書）→ 授職の儀 →
// クラーケン防衛戦（触手→本体）→ 出航エンディング → CH3_DONE → セーブ復元。

import {
  launchBrowser, openGame, newGame, dlg, stage, expect,
  advanceToStage, advanceToChoice, waitForStage, waitForCond, sleep,
} from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- 第2章クリア相当の状態を作り、「翌朝」を迎える -------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    for (const id of ["hut", "farm", "shrine", "bridge", "paddy", "kitchen"]) g.blueprints.completed.add(id);
    g.spawnVillager("pino", 29, 46);
    g.spawnVillager("mina", 34, 49);
    g.spawnVillager("gonta", 35, 41);
    g.spawnVillager("jinbei", 33, 48);
    g.spawnVillager("inaho", 36, 47);
    g.jobs.revived.add("farmer");
    g.jobs.revived.add("cook");
    g.setBaseLevel(4);
    g.quests.flags.southOpen = true;
    g.quests.setStage("CH2_DONE", true);
    g.daynight.hour = 8;
    g.quests.flags.ch3Day = g.daynight.day - 1; // 「翌朝」条件を満たす
  });
  // 翌朝、浜にワタリが現れ！が付く（会話は自動再生されない）。
  await waitForStage(page, "CH3_INTRO", { timeout: 15000 });
  const watariMarked = await page.evaluate(() => !!window.__game.villager("watari")?.marker?.visible);
  expect(watariMarked, "CH3_INTROで浜のワタリに！マーカー");
  expect(await page.evaluate(() => window.__game.villager("watari")?.down === true), "CH3_INTROでワタリは浜に倒れている");
  await page.evaluate(() => window.__game.quests.onTalk("watari")); // 話しかけて開幕
  await advanceToStage(page, "CH3_DOCK"); // ①ワタリ漂着の会話 → 桟橋の設計図
  expect((await stage(page)) === "CH3_DOCK", "ワタリと話すとCH3_DOCKへ");
  expect(await page.evaluate(() => window.__game.villager("watari")?.down === false), "会話後ワタリは起き上がる");
  const bpDock = await page.evaluate(() => window.__game.blueprints.active?.id);
  expect(bpDock === "pier", `桟橋の設計図が起動 (${bpDock})`);
  expect(await page.evaluate(() => !!window.__game.villager("watari")), "ワタリが浜に登場");

  // 設計図を1枚ずつ埋めて進める共通処理。
  const fillActive = () => page.evaluate(() => {
    const g = window.__game;
    for (const c of [...g.blueprints.active.cells]) g.world.set(c.x, c.y, c.z, c.block);
  });

  // --- 桟橋 → 灯台（この時点で夜の海峡にイカが湧き始める）-------------------------
  await fillActive();
  await advanceToStage(page, "CH3_LIGHTHOUSE");
  expect((await stage(page)) === "CH3_LIGHTHOUSE", "桟橋完成でCH3_LIGHTHOUSEへ");
  expect(await page.evaluate(() => window.__game.quests.flags.squidWaters === true), "イカの湧きフラグが立つ");
  const bpLight = await page.evaluate(() => window.__game.blueprints.active?.id);
  expect(bpLight === "lighthouse", `灯台の設計図が起動 (${bpLight})`);

  // --- 灯台 → 船体 → 帆柱 → 帆（船乗りの書の復活）--------------------------------
  await fillActive();
  await advanceToStage(page, "CH3_HULL");
  expect(await page.evaluate(() => window.__game.blueprints.active?.id) === "ship_hull", "船体の設計図が起動");

  // --- 建造途中のセーブ/ロード（第3章の設計図アンカーがロードで復元されること）------
  // かつて applyLoad のアンカー表に ch3 の設計図IDが無く、建造中にセーブすると
  // ロードが壊れる潜在バグがあった。その再発防止。
  await page.evaluate(() => window.__game.autosave());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game && window.__game.quests.stage === "CH3_HULL", undefined, {
    label: "船体建造中のセーブ復元", timeout: 12000,
  });
  expect(await page.evaluate(() => window.__game.blueprints.active?.id) === "ship_hull", "建造途中の船体設計図がロードで復元される");

  await fillActive();
  await advanceToStage(page, "CH3_MAST");
  expect(await page.evaluate(() => window.__game.blueprints.active?.id) === "ship_mast", "帆柱の設計図が起動");

  await fillActive();
  await advanceToStage(page, "CH3_SAIL");
  expect(await page.evaluate(() => window.__game.blueprints.active?.id) === "ship_sail", "帆の設計図が起動");
  // 帆柱段階で舵輪（銅の金具の回収先）が船尾楼に据えられている。
  const helm = await page.evaluate(() => {
    const g = window.__game;
    const s = { x: 34, z: 59 }; // PLACES.ship
    return g.world.get(s.x + 2, 4 + 2, s.z + 1); // dx2, dy2(=y6), dz1
  });
  expect(helm === 36, `舵輪が船尾楼に設置されている (block=${helm})`);

  await fillActive();
  // 帆の完成 → 書の復活演出 → 会話 → CH3_RITE。
  await advanceToStage(page, "CH3_RITE", { timeout: 30000 });
  expect((await stage(page)) === "CH3_RITE", "帆の完成で船乗りの書が復活しCH3_RITEへ");
  const sailorState = await page.evaluate(() => ({
    revived: window.__game.jobs.isRevived("sailor"),
    baseLevel: window.__game.baseLevel,
    books: window.__game.jobs.bookData().length,
  }));
  expect(sailorState.revived === true, "isRevived('sailor') が true");
  expect(sailorState.baseLevel === 5, `拠点レベル5 (${sailorState.baseLevel})`);
  expect(sailorState.books === 4, `職業の書が4冊 (${sailorState.books})`);

  // --- 授職の儀: 供物が足りないと断られ、揃えるとジンベエらが職を継ぐ ---------------
  const notReady = await page.evaluate(() => {
    const g = window.__game;
    return g.quests.onTalk("jinbei"); // 供物ゼロ
  });
  expect(notReady === true, "供物なしでもジンベエとの会話は成立する");
  await dlg(page); // 「まだ足りぬ」会話を送る
  expect(await page.evaluate(() => !window.__game.quests.flags.riteDone), "供物不足では授職は成立しない");

  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("plank", 5);
    g.inventory.add("rice", 5);
    g.inventory.add("feast", 1);
    g.quests.onTalk("jinbei"); // 授職の儀
  });
  await dlg(page); // 儀式の会話を送る
  const rite = await page.evaluate(() => ({
    done: window.__game.quests.flags.riteDone,
    plank: window.__game.inventory.count("plank"),
    watariMark: !!window.__game.villager("watari")?.marker?.visible,
  }));
  expect(rite.done === true, "供物を捧げて授職の儀が成立する");
  expect(rite.plank === 0, "供物（板材）が消費される");

  // --- 船出しようとするとクラーケン襲撃（CH3_RITE → CH3_DEFENSE）--------------------
  await page.evaluate(() => window.__game.quests.onTalk("watari"));
  await advanceToChoice(page); // 「海が泡立つ……」の会話 → 選択肢
  await page.click(".choice-panel button");
  await waitForStage(page, "CH3_DEFENSE", { timeout: 15000 });
  expect((await stage(page)) === "CH3_DEFENSE", "船出でクラーケン防衛が始まる");
  expect(await page.evaluate(() => window.__game.defense.active && window.__game.defense.cfg.label === "⛵ 船"), "守る対象＝船の防衛戦");
  expect(await page.evaluate(() => window.__game.defense.bannerMaxHp === 140), "船のHPは140（クラーケン戦バランス）");

  // 第1波（イカ）が海峡に湧くのをポーリングで待つ。
  const firstWave = await waitForCond(
    page,
    () => {
      const rs = window.__game.monsters.monsters.filter((m) => m.raid && !m.dead && m.type === "squid");
      return rs.length || 0;
    },
    undefined,
    { label: "イカの第1波", timeout: 30000, interval: 400 },
  );
  expect(firstWave > 0, `第1波はイカ (${firstWave}体)`);

  // 住民は泳いで戦わない: 集合・追跡とも桟橋・甲板・岸の上で行い、海に入らない。
  await page.waitForTimeout(2500); // 立ち位置への移動ぶん
  const wet = await page.evaluate(() => window.__game.villagers.filter((v) => v.inWater).map((v) => v.id));
  expect(wet.length === 0, `防衛戦中に水中の住民がいない (${JSON.stringify(wet)})`);

  // 地上戦の担保①: 襲撃イカは船でなく守り手（人）を狙って上陸してくる。
  const squidTargets = await page.evaluate(() => {
    const g = window.__game;
    return g.monsters.monsters
      .filter((m) => m.raid && !m.dead && m.type === "squid")
      .map((m) => {
        const t = m.chooseTarget({
          player: g.player,
          villagers: g.villagers,
          bannerEntity: g.defense.targetEntity,
          isNight: g.daynight.isNight,
        });
        return t?.entity === g.defense.targetEntity ? "banner" : "defender";
      });
  });
  expect(
    squidTargets.length > 0 && squidTargets.every((t) => t === "defender"),
    `イカは守り手を狙って上陸する (${JSON.stringify(squidTargets)})`,
  );

  // 地上戦の担保②: 触手4本すべてが、陸（浜・桟橋）の縁から剣が届く水際にいる。
  const armsReach = await page.evaluate(() => {
    const g = window.__game;
    return g.defense.cfg.kraken.arms.spots.map((s) => {
      let best = Infinity;
      for (let dx = -3; dx <= 3; dx += 1) {
        for (let dz = -3; dz <= 3; dz += 1) {
          const x = Math.floor(s.x) + dx + 0.5;
          const z = Math.floor(s.z) + dz + 0.5;
          if (g.world.terrainSurfaceY(x, z) <= 3) continue; // 水没列は立てない
          best = Math.min(best, Math.hypot(x - s.x, z - s.z));
        }
      }
      return Number(best.toFixed(2));
    });
  });
  expect(armsReach.every((d) => d <= 1.5), `全触手が陸の縁から届く距離 (${JSON.stringify(armsReach)})`);

  // 湧いたそばから倒して防衛戦を完走。触手を折るとクラーケン本体の無敵が解ける。
  let sawKraken = false;
  let bodyBecameVulnerable = false;
  for (let round = 0; round < 140; round += 1) {
    const st = await page.evaluate(() => {
      const g = window.__game;
      const body = g.defense.krakenBody;
      // 無敵が解けたか（本体を叩く前に観測する）。
      const vulnerable = !!body && !body.shielded && !body.dead;
      // 触手の見た目の回帰プローブ（触手が生きている最初のラウンドで一度だけ採取）。
      if (!window.__armProbe) {
        const arm = g.defense.krakenArms.find((a) => a && !a.dead);
        if (arm) {
          window.__armProbe = {
            spriteHidden: arm.sprite.group.visible === false,
            segs: arm.tentacleSegs?.length ?? 0,
            surfacePoints: g.defense.cfg.kraken.surfacePoints?.length ?? 0,
          };
        }
      }
      for (const m of [...g.monsters.monsters]) if (m.raid && !m.dead) g.hurtMonster(m, 60, null);
      return { active: g.defense.active, kraken: !!body, vulnerable };
    });
    if (st.kraken) sawKraken = true;
    if (st.vulnerable) bodyBecameVulnerable = true;
    if (!st.active) break;
    await sleep(500);
  }
  expect(sawKraken, "最終波でクラーケンが出現");
  expect(bodyBecameVulnerable, "触手を折るとクラーケン本体の無敵が解ける");
  const armProbe = await page.evaluate(() => window.__armProbe);
  expect(armProbe?.spriteHidden === true, "触手はイカのビルボードを表示しない");
  expect(armProbe?.segs === 4, `触手は4節の鞭メッシュ (${armProbe?.segs})`);
  expect(armProbe?.surfacePoints >= 2, `本体の浮上ポイントが複数ある (${armProbe?.surfacePoints})`);

  // --- 勝どき → 乗船と別れ（CH3_FAREWELL）------------------------------------------
  await advanceToStage(page, "CH3_FAREWELL");
  expect((await stage(page)) === "CH3_FAREWELL", "勝利後は乗船と別れのCH3_FAREWELLへ");
  const farewell = await page.evaluate(() => {
    const g = window.__game;
    const onShip = (id) => {
      const v = g.villager(id);
      return !!v && v.home.x >= 34 && v.home.x < 39 && v.home.z >= 59 && v.home.z < 68;
    };
    return {
      mark: !!g.villager("watari")?.marker?.visible,
      watari: onShip("watari"),
      mina: onShip("mina"),
      gonta: onShip("gonta"),
      jinbeiAshore: g.villager("jinbei").home.z < 52,
    };
  });
  expect(farewell.mark, "！は船上のワタリ");
  expect(farewell.watari && farewell.mina && farewell.gonta, `旅立つ3人の持ち場が船の甲板 (${JSON.stringify(farewell)})`);
  expect(farewell.jinbeiAshore, "見送りのジンベエは桟橋の付け根の浜に立つ");

  // --- ワタリに旅立ちを告げる → 出航エンディング → CH3_DONE --------------------------
  await page.evaluate(() => window.__game.quests.onTalk("watari"));
  await advanceToChoice(page); // 別れの会話 → 「錨を上げるか」の選択肢
  await page.click(".choice-panel button"); // 「旅立つ」
  // 結末は旅立ちのムービー（M4）だけ。このテストはムービーを止めているので、
  // 文字の結末（2026-11-08に削除）を出さずに、そのまま CH3_DONE へ進む。
  await waitForStage(page, "CH3_DONE", { timeout: 20000 });
  expect(await page.evaluate(() => !document.querySelector(".ending") && !window.__game.ui.modalOpen),
    "旅立ちを選ぶと、文字の結末を出さずにCH3_DONE（ジパング復興編・完）");

  // --- 後日談: 船のワタリに話すと出航を再演できる（やめれば自由行動のまま）------------
  await page.evaluate(() => window.__game.quests.onTalk("watari"));
  await advanceToChoice(page);
  await page.evaluate(() => document.querySelectorAll(".choice-panel button")[1]?.click()); // 「まだ島でやることがある」
  await page.waitForTimeout(400);
  const replay = await page.evaluate(() => ({
    stage: window.__game.quests.stage,
    busy: window.__game.quests.busy,
  }));
  expect(replay.stage === "CH3_DONE" && replay.busy === false, `再演をやめても後日談のまま (${JSON.stringify(replay)})`);

  // --- 夜の海峡にイカが湧く（ambient スポーンの直接検証）-----------------------------
  const squidAmbient = await page.evaluate(() => {
    const g = window.__game;
    // エンディング中に湧いた夜の通常モンスターで上限(14)が埋まっていると
    // 検査ループが頭打ちになるため、先に全モンスターをクリアして決定論化する。
    for (const m of [...g.monsters.monsters]) g.monsters.remove(m);
    const ctx = {
      world: g.world, player: { pos: g.player.pos },
      isNight: true, ch3: true, basePos: { x: 32, z: 44 },
    };
    for (let i = 0; i < 400; i += 1) { g.monsters.spawnTimer = 0; g.monsters.updateAmbient(3, ctx); }
    return g.monsters.monsters.filter((m) => m.type === "squid").length;
  });
  expect(squidAmbient > 0, `夜の海峡の水面にイカが湧く (${squidAmbient})`);

  // --- セーブ/ロード: ジパング復興編クリア状態が復元される -----------------------------
  await page.evaluate(() => window.__game.autosave());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game && window.__game.quests.stage === "CH3_DONE", undefined, {
    label: "セーブ復元後のステージ", timeout: 12000,
  });
  const restored = await page.evaluate(() => ({
    stage: window.__game.quests.stage,
    sailor: window.__game.jobs.isRevived("sailor"),
    watari: !!window.__game.villager("watari"),
  }));
  expect(restored.stage === "CH3_DONE", `ステージ復元 (${restored.stage})`);
  expect(restored.sailor === true, "船乗りの書の復活状態を復元");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("chapter3.test: PASS");
} finally {
  await browser.close();
}
