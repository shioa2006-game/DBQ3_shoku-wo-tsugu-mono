// 第7章「三つ首の空」の通しテスト。
// CH7_ALARM から CH7_DONE まで: 防衛線・3波（飛来→着地→進軍）・合間の修理・ヴァルガの初襲来・
// ベルクの招聘・大型対空ボウガン・選択の柱・最終決戦・継承・最後の出航を検証する。
// 第6章を終えた状態は helpers の skipToChapter7 で作る（第6章の進行は chapter6.test.mjs）。
// 敗北後の再挑戦は defeat-retry.test.mjs。

import {
  launchBrowser, openGame, newGame, stage, expect, SAVE_KEY,
  waitForCond, go, settle, talk, choose, completeActiveBlueprint, activeBlueprint,
  fastForward, skipToChapter7, killRaiders, reloadAndContinue, pauseLoop,
} from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  await skipToChapter7(page);
  expect((await stage(page)) === "CH7_ALARM", "第7章の始まり: CH7_ALARM");

  const alarm = await page.evaluate(() => {
    const g = window.__game;
    return {
      bolt: g.inventory.count("bolt"), hide: g.inventory.count("hide"), bp: g.blueprints.active?.id,
      altar: g.dharma.altarHp, max: g.dharma.altarMax,
    };
  });
  expect(alarm.bp === "defense_line", "山道の防衛線の設計図が開く");
  expect(alarm.bolt >= 30 && alarm.hide >= 3, `防衛の資材を受け取る (矢${alarm.bolt}・皮${alarm.hide})`);
  expect(alarm.altar === alarm.max, `祭壇の灯の守りは満タンから (${alarm.altar}/${alarm.max})`);

  // ① 防衛線の完成 → ゴンタに ！。ボウガンは置いた向き（南）で登録される。
  expect(await page.evaluate(() => window.__game.quests.onTalk("gonta") === false), "防衛線ができるまでは、ゴンタへ合図できない");
  await settle(page);
  await completeActiveBlueprint(page);
  await settle(page);
  const line = await page.evaluate(() => {
    const g = window.__game;
    return {
      crossbows: g.dharma.crossbows.size, dirs: [...g.dharma.crossbows.values()].map((c) => c.dir.join()).join(" "),
      marker: g.villager("gonta").marker.visible, gate: g.world.get(32, 16, 51),
    };
  });
  expect(line.crossbows === 2 && line.dirs === "0,1 0,1", `ボウガン2基が南向きで登録される (${line.dirs})`);
  expect(line.marker, "ゴンタに ！ が付く");

  // ボウガンを調べると、持っている矢が矢倉へ入る。
  const loaded = await page.evaluate(() => {
    const g = window.__game;
    g.dharma.loadBolts();
    return { pool: g.dharma.bolts, left: g.inventory.count("bolt") };
  });
  expect(loaded.pool >= 30 && loaded.left === 0, `矢を矢倉へ入れる (矢倉${loaded.pool})`);

  // ② 第1波: 合図 → 飛来 → 着地 → 進軍。
  await talk(page, "gonta");
  await choose(page, 1); // まだ準備したい
  expect((await stage(page)) === "CH7_ALARM", "「まだ準備したい」では始まらない");
  await talk(page, "gonta");
  await pauseLoop(page, true); // ここから第1波の経過は、決まった時間で確かめる
  await choose(page, 0);
  await waitForCond(page, () => window.__game.quests.stage === "CH7_WAVE1" && window.__game.defense.active, undefined, { label: "wave 1 started" });
  const started = await page.evaluate((SAVE_KEY) => {
    const g = window.__game;
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    return { saved: raw.stage.stage, checkpoint: !!g.checkpoint, bgm: g.bgm.current, bp: g.blueprints.active?.id ?? null };
  }, SAVE_KEY);
  expect(started.saved === "CH7_ALARM" && started.checkpoint, `合図のときに「開始直前の状態」が保存される (${started.saved})`);
  expect(started.bgm === "boss" && started.bp === null, "戦いの間はボス曲。設計図の枠は出さない");

  await fastForward(page, 4);
  const flying = await page.evaluate(() => {
    const g = window.__game;
    const raid = g.monsters.monsters.filter((m) => m.raid);
    return { n: raid.length, flying: raid.filter((m) => m.state === "flyin" && m.untargetable).length, minZ: Math.min(...raid.map((m) => m.pos.z)) };
  });
  expect(flying.n === 8 && flying.flying > 0, `第1波はガーゴイル8体が海から飛来する (飛行中${flying.flying}/${flying.n})`);
  await fastForward(page, 14);
  const landed = await page.evaluate(() => {
    const g = window.__game;
    const raid = g.monsters.monsters.filter((m) => m.raid && !m.dead);
    return {
      marching: raid.filter((m) => m.state !== "flyin" && !m.untargetable).length, n: raid.length,
      ground: raid.every((m) => m.state === "flyin" || m.pos.y < 18),
      north: raid.filter((m) => m.pos.z < 62).length,
    };
  });
  expect(landed.marching >= 6 && landed.ground, `着地して地上を進む (進軍${landed.marching}/${landed.n})`);
  await fastForward(page, 1.5);
  const held = await page.evaluate(() => {
    const g = window.__game;
    const raid = g.monsters.monsters.filter((m) => m.raid && !m.dead);
    const xs = raid.map((m) => m.pos.x);
    return {
      past: raid.filter((m) => m.pos.z < 50.5).length, n: raid.length, bolts: g.dharma.bolts,
      front: Math.min(...raid.map((m) => m.pos.z)), spread: Math.max(...xs) - Math.min(...xs),
      gate: g.world.get(32, 16, 51),
      shelter: ["suzuha", "asagi", "ganzou", "pino"].every((id) => { const v = g.villager(id); return v.pos.z < 35 && v.pos.y > 18.5; }),
      mina: g.villager("mina").pos.z,
    };
  });
  expect(held.front < 54.6, `山道の段を登って門の前まで来る (先頭 z=${held.front.toFixed(1)})`);
  expect(held.past === 0 && held.gate !== 0, `門と防壁が進軍を食い止める (門の内側へ抜けた数 ${held.past}/${held.n})`);
  expect(held.spread > 1.2, `群れは1点に重ならず、横へ広がる (幅 ${held.spread.toFixed(1)})`);
  expect(held.bolts < loaded.pool, `ボウガンが矢倉の矢で自動射撃する (${loaded.pool}→${held.bolts})`);
  expect(held.shelter && held.mina > 40, "戦わない住民は本堂へ避難し、ミナは門の内側で支える");

  const overGate = await page.evaluate(() => {
    const w = window.__game.world;
    return { monster: w.isSolidAt(32, 17, 51, "monster"), player: w.isSolidAt(32, 17, 51, "player"), villager: w.isSolidAt(32, 16, 51, "villager") };
  });
  expect(overGate.monster && !overGate.player && !overGate.villager, "門は魔物だけを止める（上を跳び越えられない。人は通れる）");

  // 戦いの最中のポーズのセーブは「開始直前の状態」を書く。
  const midSave = await page.evaluate((SAVE_KEY) => {
    const ok = window.__game.saveNow();
    return { ok, stage: JSON.parse(localStorage.getItem(SAVE_KEY)).stage.stage };
  }, SAVE_KEY);
  expect(midSave.ok && midSave.stage === "CH7_ALARM", `戦いの最中のセーブは開始直前の状態 (${midSave.stage})`);

  // 道の脇の土手へ落ちた敵は、しばらくすると飛び上がって踊り場へ降り直す（波が終わらなくなるのを防ぐ）。
  const lost = await page.evaluate(() => {
    const g = window.__game;
    const m = g.monsters.monsters.find((x) => x.raid && !x.dead && x.state === "march");
    m.pos.set(24.5, 12.1, 53.5);
    m.vel.set(0, 0, 0);
    let flew = false;
    for (let i = 0; i < 260 && !flew; i += 1) {
      g.frame(0.05);
      flew = m.state === "flyin";
    }
    for (let i = 0; i < 120 && m.state === "flyin"; i += 1) g.frame(0.05);
    return { flew, state: m.state, dead: m.dead, y: m.pos.y, z: m.pos.z };
  });
  expect(lost.flew && (lost.dead || (lost.state === "march" && lost.y > 13.5 && lost.z > 54)),
    `土手へ落ちた敵は 飛び上がって踊り場へ降り直す (${JSON.stringify(lost)})`);

  await pauseLoop(page, false);
  // 門を壊しておく（勝利後に損傷が残り、修理の対象になる）。
  await page.evaluate(() => window.__game.world.set(32, 16, 51, 0));
  await killRaiders(page);
  await fastForward(page, 2);
  await go(page, "CH7_PREP2");
  const prep2 = await page.evaluate(() => {
    const g = window.__game;
    return {
      bp: g.blueprints.active?.id, missing: g.missingRepairCells().length, gate: g.world.get(32, 16, 51),
      cleared: g.quests.flags.wavesCleared, bgm: g.bgm.current,
    };
  });
  expect(prep2.cleared === 1 && prep2.bgm === "field", "第1波を退けた");
  const back = await page.evaluate(() => {
    const g = window.__game;
    return ["asagi", "ganzou", "pino"].map((id) => g.villager(id).pos).every((p) => p.z > 36 && p.y < 18);
  });
  expect(back, "戦いが終わると、避難していた住民は持ち場（前庭）へ戻る");
  expect(prep2.gate === 0 && prep2.bp === "temple_repair" && prep2.missing >= 1, `勝利後も損傷が残り、修復ガイドが出る (${JSON.stringify(prep2)})`);

  // 補給中のセーブ・ロード: 損傷・修復ガイド・突破済みの波が戻る。
  await reloadAndContinue(page);
  const reload = await page.evaluate(() => {
    const g = window.__game;
    return { stage: g.quests.stage, bp: g.blueprints.active?.id, gate: g.world.get(32, 16, 51), cleared: g.quests.flags.wavesCleared, bolts: g.dharma.bolts };
  });
  expect(reload.stage === "CH7_PREP2" && reload.bp === "temple_repair" && reload.gate === 0 && reload.cleared === 1,
    `補給中のロード: 損傷と修復ガイドが戻る (${JSON.stringify(reload)})`);
  expect(reload.bolts === held.bolts || reload.bolts <= loaded.pool, `矢倉の矢も保存される (${reload.bolts})`);

  // 修理しきらなくても、合図で次へ進める。
  // ③ 第2波: 岩砕きのガーゴイルが壁を砕く。
  await talk(page, "gonta");
  await choose(page, 0);
  await waitForCond(page, () => window.__game.defense.active, undefined, { label: "wave 2 started" });
  await fastForward(page, 4);
  const wave2 = await page.evaluate(() => {
    const raid = window.__game.monsters.monsters.filter((m) => m.raid);
    return { crushers: raid.filter((m) => m.type === "gargoyle_crusher").length, n: raid.length };
  });
  expect(wave2.crushers === 3 && wave2.n === 7, `第2波は岩砕き3・ガーゴイル4 (${JSON.stringify(wave2)})`);
  // 岩砕きの一撃は防壁を砕き、振りかぶりの間に叩くと止まる。
  const smash = await page.evaluate(() => {
    const g = window.__game;
    const m = g.monsters.monsters.find((x) => x.type === "gargoyle_crusher");
    const hits = Math.ceil(60 / m.def.smash.damage); // 丸太の防壁の耐久 60
    for (let i = 0; i < hits - 1; i += 1) g.damageBlock(30, 16, 51, m.def.smash.damage, true);
    const palisadeBefore = g.world.get(30, 16, 51);
    g.damageBlock(30, 16, 51, m.def.smash.damage, true);
    const palisade = g.world.get(30, 16, 51);
    const before = g.world.get(27, 19, 35);
    g.damageBlock(27, 19, 35, 2, false); // 通常のガーゴイルは神殿の壁を壊せない
    const wallAfterGnaw = g.world.get(27, 19, 35);
    m.untargetable = false;
    m.setSprite("attack");
    m.enter("windup");
    g.hurtMonster(m, 1, { x: m.pos.x + 1, y: m.pos.y, z: m.pos.z }, {});
    return { palisade, palisadeBefore, hits, before, wallAfterGnaw, state: m.state };
  });
  expect(smash.palisadeBefore !== 0 && smash.palisade === 0, `岩砕きの${smash.hits}撃で 丸太の防壁が壊れる`);
  expect(smash.before === smash.wallAfterGnaw && smash.before !== 0, "通常のガーゴイルは神殿の壁を壊せない");
  expect(smash.state === "stagger", `振りかぶりの間に叩くと止まる (${smash.state})`);
  await killRaiders(page);
  await fastForward(page, 2);
  await go(page, "CH7_PREP3");
  expect(await page.evaluate(() => window.__game.quests.flags.wavesCleared === 2), "第2波を退けた");

  // ④ 第3波 → CH7_OMEN。
  await talk(page, "gonta");
  await choose(page, 0);
  await waitForCond(page, () => window.__game.defense.active, undefined, { label: "wave 3 started" });
  await fastForward(page, 4);
  const wave3 = await page.evaluate(() => {
    const raid = window.__game.monsters.monsters.filter((m) => m.raid);
    return { crushers: raid.filter((m) => m.type === "gargoyle_crusher").length, gargoyles: raid.filter((m) => m.type === "gargoyle").length };
  });
  expect(wave3.crushers === 4 && wave3.gargoyles === 8, `第3波は両者の混成 (${JSON.stringify(wave3)})`);
  await killRaiders(page);
  await fastForward(page, 2);
  await go(page, "CH7_OMEN");
  expect(await page.evaluate(() => window.__game.quests.flags.wavesCleared === 3), "3波をすべて退けた");

  // 修理してから初襲来へ（屋根が無傷でも、最初の一吹きで必ず傷つく）。
  await page.evaluate(() => {
    const g = window.__game;
    for (const c of g.missingRepairCells()) g.world.set(c.x, c.y, c.z, c.block);
  });
  await settle(page);

  // ⑤ 初襲来: 合図 → 名乗り → 最初の一吹きで大屋根が焼ける → 低く降りた首を叩いてひるませる。
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA1");
  const assault = await page.evaluate(() => {
    const g = window.__game;
    return { active: g.varuga.active, kind: g.varuga.kind, phase: g.varuga.phase, seen: g.quests.flags.m12Seen, bars: g.varuga.hudBars().length };
  });
  expect(assault.active && assault.kind === "assault" && assault.phase === "air", `ヴァルガの初襲来が始まる (${JSON.stringify(assault)})`);
  const roofBefore = await page.evaluate(() => window.__game.missingCells("temple_roof").length);
  await fastForward(page, 9);
  const roofAfter = await page.evaluate(() => {
    const g = window.__game;
    return { missing: g.missingCells("temple_roof").length, altar: g.dharma.altarHp, volleys: g.varuga.volleys };
  });
  expect(roofBefore === 0 && roofAfter.missing >= 8, `最初の一吹きで大屋根が焼け落ちる (欠け ${roofBefore}→${roofAfter.missing})`);
  expect(roofAfter.altar === 200, "屋根が受け止めた一吹きでは、祭壇の灯は傷つかない");
  // 首が降りてくるまで進め、降りた首を叩く。
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(32.5, 16.1, 44.5);
    g.player.hp = g.player.maxHp;
  });
  let swooped = false;
  for (let i = 0; i < 40 && !swooped; i += 1) {
    await fastForward(page, 0.5);
    swooped = await page.evaluate(() => window.__game.varuga.state === "swoop" && window.__game.varuga.heads.some(Boolean));
  }
  expect(swooped, "火炎のあと、頭の一つが低く降りてくる（その間だけ攻撃できる）");
  await page.evaluate(() => {
    const g = window.__game;
    const head = g.varuga.heads.find(Boolean);
    for (let i = 0; i < 5; i += 1) g.hurtMonster(head, 10, g.player.pos, {});
  });
  await go(page, "CH7_REPAIR", { timeout: 40000 });
  const repair = await page.evaluate(() => {
    const g = window.__game;
    return {
      ship: g.shipPresent, watari: !!g.villager("watari"), bp: g.blueprints.active?.id,
      missing: g.missingCells("temple_roof").length, varuga: g.varuga.active, bgm: g.bgm.current,
    };
  });
  expect(!repair.varuga && repair.bgm === "field", "ヴァルガは退却した");
  expect(repair.missing >= 8 && repair.bp === "temple_repair", `初襲来の後、大屋根の傷はそのまま残り、修理の対象になる (欠け ${repair.missing})`);
  expect(!repair.ship && !repair.watari, "ワタリはベルクを迎えに出航して不在");

  // ⑥ 修理 → 石の印 → 射台 → ピノと待つ → ベルクの到着。
  await completeActiveBlueprint(page);
  await settle(page);
  const repaired = await page.evaluate(() => {
    const g = window.__game;
    return { done: g.quests.flags.repairDone, pillar: g.world.get(35, 19, 28), bp: g.blueprints.active?.id };
  });
  expect(repaired.done && repaired.pillar === 82, `修理が済み、選択の柱に石の印が加わる (block ${repaired.pillar})`);
  expect(repaired.bp === "ballista_tower", "ピノの射台の設計図が開く");
  await completeActiveBlueprint(page);
  await settle(page);
  expect(await page.evaluate(() => window.__game.villager("pino").marker.visible), "ピノに ！ が付く");
  const dayBefore = await page.evaluate(() => window.__game.daynight.day);
  await talk(page, "pino");
  await choose(page, 0);
  await go(page, "CH7_BALLISTA", { timeout: 40000 });
  const belk = await page.evaluate(() => {
    const g = window.__game;
    return {
      day: g.daynight.day, ship: g.shipPresent, watari: !!g.villager("watari"), belk: !!g.villager("belk"),
      ballista: g.inventory.count("great_ballista"), bolts: g.inventory.count("great_bolt"), bp: g.blueprints.active?.id,
    };
  });
  expect(belk.day === dayBefore + 2, `数日が過ぎる (${dayBefore}→${belk.day}日目)`);
  expect(belk.ship && belk.watari && belk.belk, "船が戻り、ワタリとベルクが島にいる");
  expect(belk.ballista === 1 && belk.bolts >= 6 && belk.bp === "great_ballista", `ベルクの機構と大矢を受け取る (${JSON.stringify(belk)})`);

  // ⑦ 大型対空ボウガンを据える。ミナの炊き出し（料理3回）で食の印。そろうと守りの印 → CH7_FINAL_PREP。
  await completeActiveBlueprint(page);
  await settle(page);
  expect((await stage(page)) === "CH7_BALLISTA", "炊き出しが済むまでは、柱は完成しない");
  expect(await page.evaluate(() => !!window.__game.ballista.cell), "大型対空ボウガンが射台に据わる");
  await talk(page, "mina");
  expect(await page.evaluate(() => !window.__game.quests.flags.markFood), "料理が足りないうちは、食の印は刻まれない");
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("fish", 3);
    const recipe = { out: "grilled_fish", n: 1, cost: { fish: 1 }, station: "kamado" };
    for (let i = 0; i < 3; i += 1) g.ui.hooks.craft(recipe);
  });
  await talk(page, "mina");
  await go(page, "CH7_FINAL_PREP");
  const pillar = await page.evaluate(() => ({ block: window.__game.world.get(35, 19, 28), marks: window.__game.quests.flags.pillarMarks }));
  expect(pillar.block === 84 && pillar.marks === 4, `選択の柱に四つの印がそろう (block ${pillar.block})`);

  // ⑧ 最終決戦: 対空ボウガンで翼を射抜く → 地上へ → 三つの頭を倒す。
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA2");
  await fastForward(page, 5);
  const air = await page.evaluate(() => {
    const g = window.__game;
    g.ballista.mount();
    const mounted = g.ballista.mounted;
    const bars = g.varuga.hudBars().map((b) => b.label).join("/");
    // 砲口から竜の胴へ向けて撃つ（狙いは aimPoint ではなく、当たり判定そのものを確かめる）。
    const from = g.ballista.muzzle();
    const hit = g.varuga.hitByBolt(from, g.varuga.pos.clone().setY(g.varuga.pos.y + 1.4));
    return { mounted, bars, hit, wings: g.varuga.wingHits, phase: g.varuga.phase };
  });
  expect(air.mounted, "射台の大型対空ボウガンに乗れる");
  expect(air.hit && air.wings === 1 && air.phase === "air", `大矢が当たると翼の傷が増える (${JSON.stringify(air)})`);
  // 実際に発射する（大矢が減り、矢が飛ぶ）。
  const shot = await page.evaluate(() => {
    const g = window.__game;
    const before = g.inventory.count("great_bolt");
    g.ballista.fire();
    return { used: before - g.inventory.count("great_bolt"), flying: g.ballista.bolts.length };
  });
  expect(shot.used === 1 && shot.flying === 1, "クリックで大矢を1本撃つ");
  await page.evaluate(() => {
    const g = window.__game;
    while (g.varuga.phase === "air") g.varuga.onWingHit();
  });
  await fastForward(page, 4);
  await settle(page);
  const ground = await page.evaluate(() => {
    const g = window.__game;
    return { phase: g.varuga.phase, heads: g.varuga.heads.filter(Boolean).length, mounted: g.ballista.mounted, y: g.varuga.pos.y };
  });
  expect(ground.phase === "ground" && ground.heads === 3, `翼を射抜かれて前庭へ降り、三つの頭が現れる (${JSON.stringify(ground)})`);
  expect(!ground.mounted, "竜が降りたら、射台から降りる");
  // 頭を一つ倒すと、その頭は倒れたまま（火炎も止まる）。
  await page.evaluate(() => {
    const g = window.__game;
    g.hurtMonster(g.varuga.heads[0], 9999, g.player.pos, {});
  });
  await fastForward(page, 1);
  const oneDown = await page.evaluate(() => {
    const g = window.__game;
    return { down: g.varuga.headDown.join(), active: g.varuga.active, rigDead: g.varuga.rig.heads[0].dead };
  });
  expect(oneDown.down === "true,false,false" && oneDown.active && oneDown.rigDead, `頭を一つ倒しても戦いは続く (${oneDown.down})`);
  await page.evaluate(() => {
    const g = window.__game;
    g.hurtMonster(g.varuga.heads[1], 9999, g.player.pos, {});
    g.hurtMonster(g.varuga.heads[2], 9999, g.player.pos, {});
  });
  await fastForward(page, 4);
  await go(page, "CH7_AFTERMATH", { timeout: 40000 });
  const after = await page.evaluate(() => {
    const g = window.__game;
    return {
      varuga: g.varuga.active, scale: g.inventory.slots.filter(Boolean).map((s) => s.id).join(),
      bp: g.blueprints.active?.id, missing: g.missingCells("reopen_repair").length, bgm: g.bgm.current,
    };
  });
  expect(!after.varuga && after.bgm === "field", "三つの頭を倒して勝利");
  expect(!/scale/.test(after.scale), "ヴァルガは何も残さない（黒鱗などの戦利品なし）");
  expect(after.bp === "reopen_repair" && after.missing >= 1, `戦後も損傷が残り、神殿の再開の修復が要る (欠け ${after.missing})`);

  // ⑨ 神殿の再開 → ピノがアサギへ託す → スズハへの継承 → 写しを祭壇へ。
  await completeActiveBlueprint(page);
  await settle(page);
  await talk(page, "pino");
  await go(page, "CH7_SUCCESSION");
  await talk(page, "suzuha");
  expect(await page.evaluate(() => window.__game.inventory.count("book_copy") === 1), "職業の書の写しを手にする");
  await page.evaluate(() => window.__game.quests.onInteract("altar", { x: 32, y: 20, z: 28 }));
  await go(page, "CH7_DEPARTURE");
  const reopened = await page.evaluate(() => {
    const g = window.__game;
    return { copy: g.inventory.count("book_copy"), reopened: g.quests.flags.templeReopened, baseLevel: g.baseLevel, marker: g.villager("watari").marker.visible };
  });
  expect(reopened.copy === 0 && reopened.reopened && reopened.baseLevel === 6, `写しを祭壇へ納め、神殿が再開する (${JSON.stringify(reopened)})`);
  expect(reopened.marker, "桟橋のワタリに ！ が付く");

  // ⑩ 最後の出航 → ダーマ再興編・完。クリア後も同じ島で続けられる。
  await talk(page, "watari");
  await choose(page, 0);
  await go(page, "CH7_DONE", { timeout: 40000 });
  const done = await page.evaluate((SAVE_KEY) => {
    const g = window.__game;
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    return { baseLevel: g.baseLevel, saved: raw.stage.stage, books: g.jobs.bookData().filter((b) => b.revived).length, started: g.started };
  }, SAVE_KEY);
  expect(done.baseLevel === 7 && done.saved === "CH7_DONE", `ダーマ再興編・完（拠点レベル7・保存 ${done.saved}）`);
  expect(done.books === 6, "職業の書は六冊のまま");
  await reloadAndContinue(page);
  expect((await stage(page)) === "CH7_DONE", "クリア後のセーブをロードして続けられる");
  expect((await activeBlueprint(page)) === null, "クリア後は設計図なし（自由建築）");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("chapter7.test: PASS");
} finally {
  await browser.close();
}
