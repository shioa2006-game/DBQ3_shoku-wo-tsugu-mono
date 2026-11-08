// Chapter integration via state injection; real mining/planting/attacks are in quality-input.test.mjs.
// 第5章「眠る竹林の社」の通しテスト。
// CH4_DONE 相当の状態から CH5_DONE（火山島編・完）まで、峠の開通・宿坊・薬草園・
// 外社・僧侶の書・穢れ石・グロム討伐・泉の浄化を順に検証する。

import {
  launchBrowser, openGame, newGame, dlg, stage, expect,
  waitForCond, advanceToStage, advanceToChoice, completeActiveBlueprint, sleep,
} from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- 第4章をスクリプトで駆け抜けて CH4_DONE まで進める --------------------------------
  await page.evaluate(() => window.__game.quests.onTalk("kaya"));
  await dlg(page);
  await completeActiveBlueprint(page);
  await advanceToStage(page, "CH4_COLD_FORGE");
  await page.evaluate(() => window.__game.quests.onTalk("belk"));
  await dlg(page);
  await page.evaluate(() => window.__game.quests.onTalk("roku"));
  await advanceToStage(page, "CH4_GATHER_PEOPLE");
  await page.evaluate(() => window.__game.quests.onTalk("sumi"));
  await dlg(page);
  await page.evaluate(() => window.__game.quests.onTalk("teru"));
  await dlg(page);
  await page.evaluate(() => window.__game.quests.onTalk("kaya"));
  await dlg(page);
  await waitForCond(page, () => window.__game.blueprints.active?.id === "ash_farm", undefined, { label: "ash_farm" });
  await completeActiveBlueprint(page);
  await advanceToStage(page, "CH4_MINE");
  await completeActiveBlueprint(page);
  await dlg(page);
  await page.evaluate(() => window.__game.inventory.add("iron_ore", 6));
  await advanceToStage(page, "CH4_FORGE");
  await completeActiveBlueprint(page); // 炭焼き窯
  await dlg(page);
  await waitForCond(page, () => window.__game.blueprints.active?.id === "forge", undefined, { label: "forge bp" });
  await completeActiveBlueprint(page); // 鍛冶場
  await advanceToStage(page, "CH4_WORK_TOGETHER");
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.onCrafted("hammer_iron");
    g.quests.onCrafted("iron_fitting");
    g.quests.onCrafted("iron_pot");
  });
  for (let i = 0; i < 60; i += 1) {
    await dlg(page);
    if ((await page.evaluate(() => window.__game.blueprints.active?.id)) === "canteen") break;
    await sleep(250);
  }
  await completeActiveBlueprint(page); // 食堂
  await advanceToStage(page, "CH4_BOOK", { timeout: 90000 });
  await page.evaluate(() => window.__game.quests.onTalk("belk"));
  await advanceToChoice(page);
  await page.evaluate(() => document.querySelectorAll(".choice-panel button")[0].click());
  await waitForCond(page, () => window.__game.defense.active === true, undefined, { label: "defense" });
  await sleep(800);
  await page.evaluate(() => window.__game.defense.finish(true));
  await advanceToStage(page, "CH4_DONE", { timeout: 60000 });
  expect(true, "第4章を完了（CH4_DONE）");

  // --- ① 翌朝、ヨモギが現れて第5章が始まる ---------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.daynight.day += 1;
    g.daynight.hour = 9;
  });
  await waitForStageCH5();
  async function waitForStageCH5() {
    await waitForCond(page, () => window.__game.quests.stage === "CH5_INTRO", undefined, { label: "CH5_INTRO", timeout: 30000 });
  }
  const yomogi = await page.evaluate(() => !!window.__game.villager("yomogi"));
  expect(yomogi, "ヨモギが鉱山町に現れる");

  // ヨモギと話す → ナギが目覚め、住民が瘴熱に倒れる。
  await page.evaluate(() => window.__game.quests.onTalk("yomogi"));
  await dlg(page);
  const intro = await page.evaluate(() => ({
    yomogiMet: window.__game.quests.flags.yomogiMet,
    nagiUp: !window.__game.villager("nagi")?.down,
    sumiDown: window.__game.villager("sumi")?.down,
  }));
  expect(intro.yomogiMet === true, "ヨモギとの会話が進む");
  expect(intro.nagiUp === true, "ナギが目を覚ます");
  expect(intro.sumiDown === true, "住民（スミ）が瘴熱に倒れる");

  // --- ② ベルクの鉄の山刀 → 竹林の門 → 峠の開通 -----------------------------------------
  await page.evaluate(() => window.__game.quests.onTalk("belk"));
  await advanceToStage(page, "CH5_BAMBOO_GATE");
  const machete = await page.evaluate(() => window.__game.inventory.count("machete"));
  expect(machete >= 1, "鉄の山刀を受け取る");
  await page.evaluate(() => window.__game.inventory.add("bamboo", 12)); // 黒竹払いを省略
  await completeActiveBlueprint(page);
  await advanceToStage(page, "CH5_LODGE");
  const passOpen = await page.evaluate(() => window.__game.passOpen);
  expect(passOpen === true, "竹林の門の完成で峠が開通する");

  // 倒れた病人が宿坊の設計図のマスに重なると、設置できず進行不能になる。
  const sickOnLodge = () => page.evaluate(() => {
    const g = window.__game;
    const sick = ["sumi", "teru"].map((id) => g.villager(id));
    return g.blueprints.active.cells
      .filter((c) => sick.some((e) =>
        Math.abs(e.pos.x - (c.x + 0.5)) < e.halfW + 0.5 &&
        Math.abs(e.pos.z - (c.z + 0.5)) < e.halfW + 0.5 &&
        e.pos.y < c.y + 1 && e.pos.y + e.height > c.y))
      .map((c) => `${c.x},${c.y},${c.z}`);
  });
  const blockedNew = await sickOnLodge();
  expect(blockedNew.length === 0, `病人は宿坊の予定地の外で休む (${blockedNew.join(" ")})`);

  // 以前のセーブ（テルが宿坊の南壁のマスに倒れている）をロードすると、予定地の外へ移される。
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.ch5.relocate("teru", 47, 16);
    g.autosave();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1800);
  const blockedOld = await sickOnLodge();
  expect(blockedOld.length === 0, `以前のセーブでも病人が宿坊の設置を妨げない (${blockedOld.join(" ")})`);
  const wallFilled = await page.evaluate(() => {
    const g = window.__game;
    const cell = g.blueprints.active.cells.find((c) => c.x === 47 && c.z === 16 && c.y === g.blueprints.active.baseY);
    g.inventory.add("wall", 1);
    // 付き添いのナギは歩き回るので、たまたま同じマスに来ないよう一時的に遠ざける。
    const nagi = g.villager("nagi");
    const nagiPos = nagi.pos.clone();
    nagi.pos.set(0, -100, 0);
    g.fillGhostCell(cell);
    nagi.pos.copy(nagiPos);
    return g.world.get(cell.x, cell.y, cell.z) === cell.block;
  });
  expect(wallFilled, "テルがいた宿坊の南壁のマスに壁を置ける");

  // --- ③④ 宿坊 → 薬草園 → 煎じ湯 ---------------------------------------------------------
  await completeActiveBlueprint(page); // 宿坊
  await advanceToStage(page, "CH5_HERB_GARDEN");
  const patients = await page.evaluate(() => ({
    sumi: window.__game.villager("sumi")?.down,
    kamado: window.__game.kamados.size,
  }));
  expect(patients.sumi === true, "病人が宿坊の寝床で休む");
  await completeActiveBlueprint(page); // 薬草園
  await dlg(page);
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.onCrafted("herb_tea");
    g.quests.onCrafted("herb_tea");
  });
  await advanceToStage(page, "CH5_OUTER_SHRINE", { timeout: 30000 });
  expect(true, "煎じ湯2杯で外社へ進む");

  // --- ⑤ 外社の修復 → 急変 → ⑥ 夜通しの看護（僧侶の書） ---------------------------------
  await completeActiveBlueprint(page); // 外社
  await advanceToStage(page, "CH5_VIGIL");
  // 供物なしでは看護が始まらない。
  await page.evaluate(() => window.__game.quests.onTalk("nagi"));
  await dlg(page);
  expect((await stage(page)) === "CH5_VIGIL", "煎じ湯と粥が無いと看護は始まらない");
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("herb_tea", 1);
    g.inventory.add("porridge", 1);
    g.quests.onTalk("nagi");
  });
  await advanceToStage(page, "CH5_PURIFY_PATH", { timeout: 90000 }); // 看護→復活演出→宣言
  const priest = await page.evaluate(() => ({
    revived: window.__game.jobs.isRevived("priest"),
    baseLevel: window.__game.baseLevel,
  }));
  expect(priest.revived === true, "僧侶の書が復活する");
  expect(priest.baseLevel === 5, `拠点レベル5 (${priest.baseLevel})`);

  // --- ⑦ 三つの穢れ石（戦闘 → 柱 → 浄化） -----------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("plank", 3);
    g.inventory.add("stone", 3);
    g.inventory.add("incense_herb", 3);
  });
  for (let i = 0; i < 3; i += 1) {
    await page.evaluate((i) => {
      const g = window.__game;
      // 番の魔物を倒す（スクリプトで直接撃破）。
      for (const m of [...g.monsters.monsters]) {
        if (m.guardStone === i) g.hurtMonster(m, 999, null);
      }
    }, i);
    await waitForCond(page, (i) => window.__game.purification.taintStones[i].guardsDown, i, { label: `stone${i} guards down` });
    const s = await page.evaluate((i) => {
      const g = window.__game;
      const p = g.quests.ch5;
      const st = window.__game.purification;
      const spot = [{ x: 40, z: 72 }, { x: 30, z: 80 }, { x: 34, z: 87 }][i];
      g.quests.onTaintStone(spot.x, spot.z); // 柱を立て直す
      return { pillar: st.taintStones[i].pillarBuilt, p: !!p };
    }, i);
    expect(s.pillar === true, `穢れ石${i + 1}: 祈り柱を立て直す`);
    await page.evaluate((i) => {
      const spot = [{ x: 40, z: 72 }, { x: 30, z: 80 }, { x: 34, z: 87 }][i];
      window.__game.quests.onTaintStone(spot.x, spot.z); // ナギの浄化
    }, i);
    await dlg(page);
    await waitForCond(page, (i) => window.__game.purification.taintStones[i].purified, i, { label: `stone${i} purified` });
  }
  await advanceToStage(page, "CH5_INNER_SHRINE", { timeout: 30000 });
  expect(true, "三つの穢れ石を清め、内社への道が開く");

  // --- ⑧⑨ 内社 → グロム討伐 ---------------------------------------------------------------
  await page.evaluate(() => window.__game.quests.onTalk("nagi"));
  await advanceToChoice(page);
  await page.evaluate(() => document.querySelectorAll(".choice-panel button")[0].click());
  await waitForCond(page, () => window.__game.gromBattle.active === true, undefined, { label: "grom battle" });
  expect((await stage(page)) === "CH5_DRAGON", "グロム戦が始まる");
  const gromState = await page.evaluate(() => ({
    heads: window.__game.gromBattle.heads.length,
    inMonsters: window.__game.monsters.monsters.filter((m) => m.isDragonHead).length,
  }));
  expect(gromState.heads === 2, "グロムは二つの頭を持つ");
  expect(gromState.inMonsters === 2, "左右の頭が攻撃対象として登録される");
  // 左の頭 → 右の頭の順に破壊する。
  await page.evaluate(() => {
    const g = window.__game;
    const [l] = g.gromBattle.heads;
    g.hurtMonster(l, 999, null);
  });
  await sleep(700);
  const oneDown = await page.evaluate(() => ({
    active: window.__game.gromBattle.active,
    leftDead: window.__game.gromBattle.heads[0]?.dead,
  }));
  expect(oneDown.active === true && oneDown.leftDead === true, "片方の頭を破壊しても戦闘は続く");
  await page.evaluate(() => {
    const g = window.__game;
    const r = g.gromBattle.heads[1];
    r.invuln = 0;
    g.hurtMonster(r, 999, null);
  });
  await waitForCond(page, () => window.__game.quests.flags.gromDefeated === true, undefined, { label: "grom defeated", timeout: 30000 });
  await dlg(page);
  await waitForCond(page, () => window.__game.blueprints.active?.id === "spring_works", undefined, { label: "spring bp" });
  expect(true, "両頭の破壊でグロムを討伐し、泉の設計図が開く");

  // --- ⑩ 泉の祭壇・水門・導水路 → 浄化 → 火山島編・完 -------------------------------------
  await completeActiveBlueprint(page);
  await dlg(page); // springDone の会話
  // 結末は火山島編の結びのムービー（M7）だけ。このテストはムービーを止めているので、
  // 文字の結末（2026-11-08に削除）を出さずに、そのまま CH5_DONE へ進む。
  await advanceToStage(page, "CH5_DONE", { timeout: 30000 });
  expect(await page.evaluate(() => !document.querySelector(".ending")), "泉の浄化の後は、文字の結末を出さずにCH5_DONE");
  const done = await page.evaluate(() => {
    const g = window.__game;
    return {
      purified: g.purification.springPurified,
      sumiUp: !g.villager("sumi")?.down,
      priest: g.jobs.isRevived("priest"),
      blacksmith: g.jobs.isRevived("blacksmith"),
      baseLevel: g.baseLevel,
      scale: g.inventory.count("black_scale") + g.drops.filter((d) => d.itemId === "black_scale").length,
    };
  });
  expect(done.purified === true, "泉が清められる");
  expect(done.sumiUp === true, "病人が全快する");
  expect(done.priest && done.blacksmith, "六冊のうち鍛冶屋・僧侶の書が復活済み");
  expect(done.baseLevel === 6, `拠点レベル6 (${done.baseLevel})`);
  expect(done.scale >= 1, "無銘の黒鱗が残る");

  // --- ロード復元: クリア後状態が維持される ------------------------------------------------
  await page.evaluate(() => window.__game.autosave());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1800);
  const loaded = await page.evaluate(() => {
    const g = window.__game;
    return {
      stage: g.quests.stage,
      purified: g.purification.springPurified,
      passOpen: g.passOpen,
      priest: g.jobs.isRevived("priest"),
      sumiUp: !g.villager("sumi")?.down,
    };
  });
  expect(loaded.stage === "CH5_DONE", `ロード後もステージ維持 (${loaded.stage})`);
  expect(loaded.purified === true, "ロード後も泉は清められたまま");
  expect(loaded.passOpen === true, "ロード後も峠は開通したまま");
  expect(loaded.priest === true, "ロード後も僧侶の書は復活済み");
  expect(loaded.sumiUp === true, "ロード後も病人は回復したまま");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("chapter5.test: PASS");
} finally {
  await browser.close();
}
