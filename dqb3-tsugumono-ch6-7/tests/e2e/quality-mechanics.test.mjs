// 仕組みごとの確認（本物のブラウザのゲームの中で、部品を直接動かして確かめる）。
// - HPのハート: 4分の1刻みの表示と、幅が変わらないこと
// - 山麦: 2段階の成長・余った時間の持ち越し・住民の世話・植え直しのリセット、収穫して麦がゆにできること
// - 攻撃: 同じ一振りは二重に当たらず、別の一振りは被弾の点滅中でも当たる。カニの正面の甲羅、ヴァルガの三つの頭、
//   住民（ゴンタ）の実際のAIからの攻撃、受ける側の無敵時間
// - 設置: 主人公・魔物がいるマスには置けない（材料も減らない）。住民はよけて置ける。竜の頭がいるマスにも置けない
import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";
import { RECIPES } from "../../src/game/items.js";
import { B, BLOCK_DEFS } from "../../src/world/blocks.js";
import fs from "node:fs";
const browser = await launchBrowser(), errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  // ポーズを開いて世界を止めておく（以下は部品を直接動かす）。
  await page.keyboard.press("Escape");
  await page.waitForSelector(".btn-save", { state: "visible" });
  const hp = await page.evaluate(() => {
    const g = window.__game, result = [];
    for (const n of [0, 1, 2, 3, 4, 25, 26]) {
      g.ui.setHp(n, 26);
      const cells = [...g.ui.hearts.children];
      result.push({ n, label: g.ui.hearts.getAttribute("aria-label"), fills: cells.map((c) => c.style.getPropertyValue("--hp-fill")), classes: cells.map((c) => c.className), widths: cells.map((c) => c.getBoundingClientRect().width) });
    }
    g.player.hp = 1; g.ui.setHp(1, 26);
    return result;
  });
  expect(hp[0].classes.every((c) => c.includes("empty")) && hp[1].classes[0].includes("partial"), "HP1 は HP0 と見た目が違う");
  expect(hp.slice(0, 5).map((h) => h.fills[0]).join(",") === "0%,25%,50%,75%,100%", "HP0〜4 を 4分の1刻みのハートで表す");
  expect(hp.every((h) => h.widths.every((w) => w === 24)) && hp[6].fills[6] === "50%" && hp[6].label === "HP 26 / 26", "ハートの幅は変わらず、最大HPの端数も表す");
  if (process.env.QA_CAPTURE) { fs.mkdirSync("work/quality-mechanics", { recursive: true }); await page.screenshot({ path: "work/quality-mechanics/hp1.png" }); }

  // 前庭の空いた場所で確かめる（山麦を植えるマスと、設置のマス）。
  const CROP = { x: 26, y: 16, z: 46 };
  const crops = await page.evaluate(({ B, c }) => {
    const g = window.__game, w = g.world, f = g.farming, { x, y, z } = c, key = [x, y, z].join(",");
    w.set(x, y - 1, z, B.FARMLAND); w.set(x, y, z, B.CROP1);
    f.update(69); const first = w.get(x, y, z) === B.CROP1;
    f.update(1.01); const middle = w.get(x, y, z) === B.CROP2;
    f.update(0.05); const stays = w.get(x, y, z) === B.CROP2;
    f.update(69); const late = w.get(x, y, z) === B.CROP2;
    f.update(1); const done = w.get(x, y, z) === B.CROP3 && !f.cropGrowth.has(key);
    w.set(x, y, z, B.AIR); w.set(x, y, z, B.CROP1); f.update(141);
    const big = w.get(x, y, z) === B.CROP3;
    w.set(x, y, z, B.AIR); w.set(x, y, z, B.CROP1);
    for (let i = 0; i < 20; i += 1) { f.boostCropsNear({ x: x + 0.5, z: z + 0.5 }, 2, 1); f.update(1); }
    const boost = w.get(x, y, z) === B.CROP2;
    w.set(x, y, z, B.AIR); w.set(x, y, z, B.CROP1);
    return { first, middle, stays, late, done, big, boost, reset: f.cropGrowth.get(key) === 0 };
  }, { B, c: CROP });
  expect(Object.values(crops).every(Boolean), "山麦は時間で2段階育ち、余った時間を持ち越し、住民の世話で早まり、植え直すと最初から: " + JSON.stringify(crops));

  const harvest = await page.evaluate(({ B, def, recipe, c }) => {
    const g = window.__game, w = g.world, { x, y, z } = c;
    w.set(x, y, z, B.CROP3);
    const count = g.quests.counters.harvested;
    const before = g.drops.length;
    g.breakBlock(x, y, z, def);
    const drops = g.drops.slice(before);
    const barley = drops.filter((d) => d.itemId === "barley").reduce((n, d) => n + d.count, 0);
    const ids = drops.every((d) => ["barley", "barley_seed"].includes(d.itemId));
    for (const d of drops) g.inventory.add(d.itemId, d.count);
    const cooked = g.inventory.craft(recipe) && g.inventory.count("barley_porridge") === 1 && g.inventory.count("barley") === 0;
    return { barley, ids, cooked, counted: g.quests.counters.harvested === count + 1, cleared: w.get(x, y, z) === B.AIR };
  }, { B, def: BLOCK_DEFS[B.CROP3], recipe: RECIPES.find((r) => r.out === "barley_porridge"), c: CROP });
  expect(harvest.barley === 2 && harvest.ids && harvest.cooked && harvest.counted && harvest.cleared, "実った山麦からは 山麦2つ（と種）が出て、かまどの麦がゆにできる: " + JSON.stringify(harvest));

  const combat = await page.evaluate(() => {
    const g = window.__game, result = {};
    for (const type of ["rock_goat", "rock_crab"]) {
      const m = g.monsters.spawn(type, 27.5, 16.1, 44.5); m.hp = 100;
      const ally = {}, hero = {};
      g.hurtMonster(m, 2, null, ally); g.hurtMonster(m, 7, null, hero);
      result[type + "Together"] = m.hp === 91;
      g.hurtMonster(m, 7, null, hero); result[type + "Dedup"] = m.hp === 91;
      m.invuln = Math.max(0, m.invuln - 0.42);
      g.hurtMonster(m, 7, null, {}); result[type + "Cadence"] = m.hp === 84;
      if (type === "rock_crab") {
        // 小岩ガニ: 構えていない間は正面からも通る。ハサミを上げて構えると、正面の甲羅が硬い。横・後ろは通る。
        m.facingDir.set(0, 1);
        g.hurtMonster(m, 8, m.pos.clone().add({ x: 0, y: 0, z: 1 }), {});
        result.unguarded = m.hp === 76;
        m.armoredNow = true;
        g.hurtMonster(m, 8, m.pos.clone().add({ x: 0, y: 0, z: 1 }), {});
        result.armor = m.hp === 74;
        g.hurtMonster(m, 8, m.pos.clone().add({ x: 0, y: 0, z: -1 }), {});
        result.flank = m.hp === 66;
      }
      g.monsters.remove(m);
    }
    // ヴァルガの最終決戦: 翼を射抜いて地上へ降ろし、三つの頭を標的にする。
    // 降りたときの会話は chapter7.test.mjs が確かめるので、ここでは出さない（世界を止めたまま部品を進めるため）。
    g.startVaruga("final");
    const grounded = g.varuga.onGrounded;
    g.varuga.onGrounded = null;
    while (g.varuga.phase === "air") g.varuga.onWingHit();
    for (let i = 0; i < 200 && g.varuga.phase !== "ground"; i += 1) g.varuga.update(0.05);
    g.varuga.onGrounded = grounded;
    const heads = g.varuga.heads.filter(Boolean);
    result.threeHeads = g.varuga.phase === "ground" && heads.length === 3 && heads.every((h) => g.monsters.monsters.includes(h));
    for (const h of heads) {
      const n = h.hp, hero = {}, ally = {};
      g.hurtMonster(h, 7, null, hero); g.hurtMonster(h, 2, null, ally);
      result["head" + h.index + "Together"] = h.hp === n - 9;
      g.hurtMonster(h, 7, null, hero); result["head" + h.index + "Dedup"] = h.hp === n - 9;
      h.update(0.42); g.hurtMonster(h, 7, null, {});
      result["head" + h.index + "Cadence"] = h.hp === n - 16;
    }
    // 住民の実際のAIと、ゲームが渡す文脈を通して、それぞれの頭へ攻撃が届くこと。
    const v = g.villager("gonta"), battleUpdate = g.varuga.update;
    g.varuga.update = () => {}; // この確認の間だけ、頭の位置を決めた場所に保つ
    for (const h of heads) {
      for (const other of heads) other.pos.set(50, 30, 100);
      h.pos.set(30.5, 17.5, 44.5); // 祭壇にいちばん近い頭をゴンタが狙う
      v.pos.set(30.5, 16.01, 44); v.attackCd = 0; v.setDown(false);
      const before = h.hp; g.simulate(0.01, 0);
      result["head" + h.index + "RealAlly"] = h.hp === before - v.def.atk;
    }
    g.varuga.update = battleUpdate;
    g.graceT = 0;
    for (const e of [g.player, v]) {
      e.hp = e.maxHp; e.invuln = 0; g.attackEntity(e, 5, null); const hp = e.hp;
      g.attackEntity(e, 5, null); result[e.kind + "Protection"] = e.hp === hp && hp < e.maxHp;
    }
    return result;
  });
  expect(Object.values(combat).every(Boolean), "一振りの重複・カニの甲羅・三つの頭・住民の実際のAI・受ける側の無敵時間: " + JSON.stringify(combat));

  const placement = await page.evaluate((B) => {
    const g = window.__game, w = g.world, y = w.terrainSurfaceY(28.5, 46.5), c = { x: 28, y, z: 46, block: B.DHARMA_STONE };
    w.set(c.x, c.y, c.z, B.AIR); g.inventory.add("dharma_stone", 10);
    const p = g.player.pos.clone(), v = g.spawnVillager("asagi", 28, 46, y), m = g.monsters.spawn("rock_goat", 28.5, y, 46.5);
    const heads = g.varuga.heads.filter(Boolean);
    const blockers = [g.player, m];
    const entities = [...blockers, ...heads, v];
    const away = () => { for (const e of entities) e.pos.set(40.5, y, 40.5); };
    const results = [];
    // 主人公・魔物がいるマスには、設計図のブロックを置けない（材料も減らない）。
    for (const occupant of blockers) {
      away();
      occupant.pos.set(28.5, y + 0.001, 46.5);
      const n = g.inventory.count("dharma_stone");
      g.fillGhostCell(c);
      results.push(w.get(c.x, c.y, c.z) === B.AIR && g.inventory.count("dharma_stone") === n);
    }
    // 竜の頭がいるマスには、手に持ったブロックを置けない。
    // （ヴァルガ戦の間は設計図の枠を出さないので、頭と重なり得るのは ふつうの設置だけ）
    for (const head of heads) {
      away();
      const clear = !g.placeBlockedByEntity(c);
      head.pos.set(28.5, y + 0.001, 46.5);
      results.push(clear && g.placeBlockedByEntity(c));
    }
    // 住民は近くの床へよけ、マスには1回だけ置かれる。
    away();
    v.pos.set(28.5, y + 0.001, 46.5);
    let n = g.inventory.count("dharma_stone"); g.fillGhostCell(c);
    const off = Math.abs(v.pos.x - 28.5) >= v.halfW + 0.5 || Math.abs(v.pos.z - 46.5) >= v.halfW + 0.5;
    results.push(w.get(c.x, c.y, c.z) === B.DHARMA_STONE && g.inventory.count("dharma_stone") === n - 1 && off && !v.collides(w, v.pos.x, v.pos.y, v.pos.z));
    w.set(c.x, c.y, c.z, B.AIR);
    away();
    n = g.inventory.count("dharma_stone"); g.fillGhostCell(c);
    results.push(w.get(c.x, c.y, c.z) === B.DHARMA_STONE && g.inventory.count("dharma_stone") === n - 1);
    g.fillGhostCell(c); results.push(g.inventory.count("dharma_stone") === n - 1);
    g.player.pos.copy(p);
    g.monsters.remove(m);
    g.varuga.abort();
    return { results, heads: heads.length, y };
  }, B);
  expect(placement.heads === 3 && placement.results.length === 8, `設置の確認が そろっている (頭${placement.heads}・確認${placement.results.length})`);
  expect(placement.results.every(Boolean), "主人公・魔物・竜の頭がいるマスには置けず材料も減らない。住民はよける。空いたマスには1回だけ置く: " + JSON.stringify(placement.results));
  expect(errors.length === 0, `コンソールエラーなし (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("quality-mechanics.test: PASS");
} finally { await browser.close(); }
