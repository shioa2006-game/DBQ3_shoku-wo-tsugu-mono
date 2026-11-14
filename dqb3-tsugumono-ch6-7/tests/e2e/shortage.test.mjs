// 資材不足からの復帰。
// 物語で必ず要る設計図は、手持ちが空になっても、採り直せる素材（木・石・わら など）と作業台だけで
// 作り直せる。数に限りのある鉄を使うもの（門・ボウガン・とげ罠）は、必須の修理に含めない。
// - 定義の検証: 必須の設計図のブロックが、採り直せる素材から作れること
// - 初襲来の後: 手持ちも資材置き場も空の状態から、木と石だけで屋根を直して先へ進める（大工たちの手伝いも）
// - 最終決戦の前: 大矢も鉄もない状態から、ベルクの大矢で挑める
// - 戦後: 入口と書の紋章が焼け落ち、鉄がなくても、神殿を再開できる

import {
  launchBrowser, openGame, newGame, stage, expect,
  go, settle, talk, choose, completeActiveBlueprint, activeBlueprint,
  fastForward, skipToChapter7,
} from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- ① 定義の検証 -------------------------------------------------------------------
  const defs = await page.evaluate(() => {
    const g = window.__game;
    const { RECIPES, BLUEPRINTS, BLOCK_DEFS, itemForBlock } = g.defs;
    // 生成したばかりの島にある、採れるブロックの数（落とすアイテムごと）。
    const natural = {};
    const [W, H, D] = [64, 40, 120];
    for (let z = 0; z < D; z += 1) for (let x = 0; x < W; x += 1) for (let y = 0; y < H; y += 1) {
      const def = BLOCK_DEFS[g.world.get(x, y, z)];
      if (!def) continue;
      if (def.drops) natural[def.drops] = (natural[def.drops] ?? 0) + 1;
      for (const [item] of def.bonusDrops ?? []) natural[item] = (natural[item] ?? 0) + 1;
    }
    // 採り直せる素材: 木（伐った跡に生え直す）・石（岩山）・土・砂・わら草・きのこ・魚と、わき続ける敵の落とし物。
    const renewable = ["log", "stone", "dirt", "sand", "straw", "mushroom", "fish", "nuts", "herb", "hide", "meat", "crab_meat"];
    const can = new Set(renewable);
    for (let grew = true; grew;) {
      grew = false;
      for (const r of RECIPES) {
        if (can.has(r.out) || !["hand", "bench"].includes(r.station)) continue;
        if (Object.keys(r.cost).every((id) => can.has(id))) {
          can.add(r.out);
          grew = true;
        }
      }
    }
    // 物語で必ず完成させる設計図（防衛線は開始時の支給で足りる。下で別に確かめる）。
    const required = [
      "slope_bridge", "common_hut", "temple_base", "quarry_scaffold", "quarry_bridge", "haul_road",
      "temple_frame", "temple_roof", "altar_keystone", "temple_living", "temple_library",
      "ballista_tower", "great_ballista", "reopen_repair",
    ];
    // 物語が渡す品（作れなくてよい）: 要石・大型対空ボウガンは受け取る。壊しても自分を落とす。
    // かまどは ねん土を使う（共同小屋のときにスズハが渡す。設置済みのものは持ち運べる）。
    const given = new Set(["keystone", "great_ballista", "kamado"]);
    const lacking = [];
    for (const id of required) {
      for (const c of BLUEPRINTS[id].build()) {
        const item = itemForBlock(c.block);
        if (!item) lacking.push(`${id}: block ${c.block} にアイテムがない`);
        else if (!can.has(item) && !given.has(item)) lacking.push(`${id}: ${item}`);
      }
    }
    const selfDrop = ["keystone", "great_ballista", "kamado"].every((item) =>
      Object.values(BLOCK_DEFS).some((def) => def.drops === item && Number.isFinite(def.hardness)));
    // 防衛線: 必要な数。
    const need = {};
    for (const c of BLUEPRINTS.defense_line.build()) {
      const item = itemForBlock(c.block);
      need[item] = (need[item] ?? 0) + 1;
    }
    return { natural, lacking: [...new Set(lacking)], selfDrop, need, canEmblem: can.has("emblem"), canRoof: can.has("roof") };
  });
  expect(defs.lacking.length === 0, `必須の設計図は、採り直せる素材と作業台だけで作れる (${defs.lacking.join(" / ") || "不足なし"})`);
  expect(defs.canEmblem && defs.canRoof, "屋根板と書の紋章は、鉄を使わずに作れる");
  expect(defs.selfDrop, "要石・大型対空ボウガン・かまどは、壊すと自分を落とす（置き直せる）");
  expect(defs.natural.log >= 60 && defs.natural.clay >= 6 && defs.natural.iron_ore >= 12,
    `島に 木・ねん土・鉄鉱脈が十分ある (木材${defs.natural.log}・ねん土${defs.natural.clay}・鉄鉱脈${defs.natural.iron_ore})`);

  // --- ② 防衛線は、開始時の支給と 木・石だけで築ける ------------------------------------
  await skipToChapter7(page);
  const line = await page.evaluate((need) => {
    const g = window.__game;
    const { RECIPES, itemForBlock } = g.defs;
    const inv = g.inventory;
    // 支給された鉄・金具・皮・矢だけを残し、ほかは空にする。採ってきた木と石を足す。
    for (const s of inv.slots.filter(Boolean)) {
      if (!["iron", "iron_fitting", "hide", "bolt"].includes(s.id)) inv.remove(s.id, inv.count(s.id));
    }
    inv.remove("iron", inv.count("iron") - 6);
    inv.remove("iron_fitting", inv.count("iron_fitting") - 4);
    inv.remove("hide", inv.count("hide") - 3);
    inv.add("log", 30);
    inv.add("stone", 10);
    const recipe = (out) => RECIPES.find((r) => r.out === out);
    const craftUntil = (out, n) => {
      for (let i = 0; i < 40 && inv.count(out) < n; i += 1) {
        const r = recipe(out);
        for (const [id, c] of Object.entries(r.cost)) if (inv.count(id) < c && recipe(id)) craftUntil(id, c);
        if (!g.ui.hooks.craft(r)) return false;
      }
      return inv.count(out) >= n;
    };
    const crafted = Object.entries(need).map(([item, n]) => [item, craftUntil(item, n)]);
    // 設計図のとおりに、手持ちから置く。
    let placed = 0;
    for (const c of g.missingCells("defense_line")) {
      const item = itemForBlock(c.block);
      if (!inv.remove(item, 1)) return { crafted, failed: item };
      g.world.set(c.x, c.y, c.z, c.block);
      placed += 1;
    }
    return { crafted, placed, iron: inv.count("iron"), fitting: inv.count("iron_fitting") };
  }, defs.need);
  expect(!line.failed && line.crafted.every(([, ok]) => ok), `支給の鉄と 木・石だけで、防衛線の資材を作れる (${JSON.stringify(line)})`);
  await settle(page);
  expect(await page.evaluate(() => window.__game.quests.flags.defenseBuilt === true), "防衛線が完成し、合図できるようになる");

  // --- ③ 初襲来の後: 手持ちも資材置き場も空から、屋根を直す ---------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.dharma.loadBolts();
    g.quests.flags.wavesCleared = 3;
    g.blueprints.clear();
    g.quests.setStage("CH7_OMEN", true);
  });
  await settle(page);
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA1");
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(32.5, 16.1, 44.5);
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
  await page.evaluate(() => {
    const g = window.__game;
    // 門も壊されたことにする（鉄がないと作り直せない）。
    g.world.set(32, 16, 51, 0);
    const head = g.varuga.heads.find(Boolean);
    for (let i = 0; i < 5; i += 1) g.hurtMonster(head, 10, g.player.pos, {});
  });
  await go(page, "CH7_REPAIR", { timeout: 40000 });
  const broke = await page.evaluate(() => {
    const g = window.__game;
    const inv = g.inventory;
    // 受け取った修理の資材も、手持ちも、資材置き場も、すべて失ったことにする（鉄も金具もない）。
    for (const s of inv.slots.filter(Boolean)) {
      if (!s.id.startsWith("hammer") && !s.id.startsWith("sword")) inv.remove(s.id, inv.count(s.id));
    }
    const chest = g.crew.siteStorage();
    for (const s of chest.slots.filter(Boolean)) chest.remove(s.id, chest.count(s.id));
    const missing = g.missingRepairCells();
    const items = {};
    for (const c of missing) {
      const item = g.defs.itemForBlock(c.block);
      items[item] = (items[item] ?? 0) + 1;
    }
    return { bp: g.blueprints.active?.id, items, gate: g.world.get(32, 16, 51), chest: !!chest };
  });
  expect(broke.bp === "temple_repair" && broke.items.roof >= 8, `屋根が焼け、修理の資材は何もない (${JSON.stringify(broke.items)})`);
  expect(broke.gate === 0 && !("gate" in broke.items), "壊れた門は、必須の修理に入らない（鉄がなくても先へ進める）");
  // 森で木を伐り、岩山で石を採ってきたことにして、作業台で作る。半分は自分で置き、残りは資材置き場へ入れる。
  const fixed = await page.evaluate((items) => {
    const g = window.__game;
    const { RECIPES, itemForBlock } = g.defs;
    const inv = g.inventory;
    inv.add("log", 30);
    inv.add("stone", 20);
    const recipe = (out) => RECIPES.find((r) => r.out === out);
    const craftUntil = (out, n) => {
      for (let i = 0; i < 60 && inv.count(out) < n; i += 1) {
        const r = recipe(out);
        if (!r) return false;
        for (const [id, c] of Object.entries(r.cost)) if (inv.count(id) < c && recipe(id)) craftUntil(id, c);
        if (!g.ui.hooks.craft(r)) return false;
      }
      return inv.count(out) >= n;
    };
    const ok = Object.entries(items).every(([item, n]) => craftUntil(item, n));
    const missing = g.missingRepairCells();
    const mine = missing.slice(0, Math.ceil(missing.length / 2));
    for (const c of mine) {
      inv.remove(itemForBlock(c.block), 1);
      g.world.set(c.x, c.y, c.z, c.block);
    }
    // 残りは資材置き場の箱へ。
    const chest = g.crew.siteStorage();
    let stored = 0;
    for (const c of missing.slice(mine.length)) {
      const item = itemForBlock(c.block);
      inv.remove(item, 1);
      chest.add(item, 1);
      stored += 1;
    }
    return { ok, placed: mine.length, stored, left: g.missingRepairCells().length };
  }, broke.items);
  expect(fixed.ok && fixed.left === fixed.stored && fixed.stored > 0, `木と石だけで屋根の資材を作り、半分を置いた (${JSON.stringify(fixed)})`);
  // 大工たちが、箱の資材で残りを組む。
  let left = fixed.left;
  for (let i = 0; i < 40 && left > 0; i += 1) {
    await fastForward(page, 2);
    left = await page.evaluate(() => window.__game.missingRepairCells().length);
    if (await page.evaluate(() => window.__game.ui.dialogue.open)) break;
  }
  await settle(page);
  const repaired = await page.evaluate(() => {
    const g = window.__game;
    return { done: g.quests.flags.repairDone, left: g.missingCells("temple_roof").length, bp: g.blueprints.active?.id, pillar: g.world.get(35, 19, 28) };
  });
  expect(repaired.left === 0, "資材置き場へ入れた分は、大工たちが組む");
  expect(repaired.done && repaired.bp === "ballista_tower" && repaired.pillar === 82, `神殿の修理が済み、物語が先へ進む (${JSON.stringify(repaired)})`);

  // --- ④ 最終決戦の前: 大矢も鉄もない → ベルクが補う -------------------------------------
  await completeActiveBlueprint(page); // 射台
  await settle(page);
  await talk(page, "pino");
  await choose(page, 0);
  await go(page, "CH7_BALLISTA", { timeout: 40000 });
  await completeActiveBlueprint(page);
  await settle(page);
  await page.evaluate(() => {
    const g = window.__game;
    g.inventory.add("fish", 3);
    const recipe = { out: "grilled_fish", n: 1, cost: { fish: 1 }, station: "kamado" };
    for (let i = 0; i < 3; i += 1) g.ui.hooks.craft(recipe);
  });
  await talk(page, "mina");
  await go(page, "CH7_FINAL_PREP");
  const optional = await page.evaluate(() => {
    const g = window.__game;
    return { bp: g.blueprints.active?.id ?? null, missing: g.missingRepairCells().map((c) => c.block) };
  });
  expect(optional.bp === "temple_repair" && optional.missing.length === 1, `壊れた門は、準備の段階で任意の修理として出る (${JSON.stringify(optional)})`);
  const none = await page.evaluate(() => {
    const g = window.__game;
    const inv = g.inventory;
    for (const id of ["great_bolt", "iron", "iron_ore", "iron_fitting", "steel"]) inv.remove(id, inv.count(id));
    return { bolts: inv.count("great_bolt"), belk: !!g.villager("belk") };
  });
  expect(none.bolts === 0 && none.belk, "大矢も鉄も失った");
  await talk(page, "belk");
  const resupply = await page.evaluate(() => {
    const g = window.__game;
    return { bolts: g.inventory.count("great_bolt"), again: g.quests.onTalk("belk") };
  });
  expect(resupply.bolts === 6, `ベルクに話すと、大矢が6本になるまで受け取れる (${resupply.bolts}本)`);
  expect(resupply.again === false, "足りているときは、渡さない");
  // 門が壊れたままでも、合図して最終決戦へ進める。
  await talk(page, "gonta");
  await choose(page, 0);
  await go(page, "CH7_VARUGA2");
  expect((await activeBlueprint(page)) === null, "修理が残っていても、合図で最終決戦が始まる");

  // --- ⑤ 戦後: 入口と書の紋章が焼け落ち、鉄がなくても再開できる ---------------------------
  await fastForward(page, 4);
  await page.evaluate(() => {
    const g = window.__game;
    while (g.varuga.phase === "air") g.varuga.onWingHit();
  });
  await fastForward(page, 4);
  await settle(page);
  await page.evaluate(() => {
    const g = window.__game;
    // 入口の上（破風・書の紋章・梁・アーチ）が焼け落ちたことにする。
    for (const c of g.defs.BLUEPRINTS.reopen_repair.build()) {
      if (c.dy > 20) g.world.set(c.dx, c.dy, c.dz, 0);
    }
    for (const head of g.varuga.heads) g.hurtMonster(head, 9999, g.player.pos, {});
  });
  await fastForward(page, 4);
  await go(page, "CH7_AFTERMATH", { timeout: 40000 });
  const reopen = await page.evaluate(() => {
    const g = window.__game;
    const { RECIPES, itemForBlock } = g.defs;
    const inv = g.inventory;
    for (const s of inv.slots.filter(Boolean)) {
      if (!s.id.startsWith("hammer") && !s.id.startsWith("sword")) inv.remove(s.id, inv.count(s.id));
    }
    const missing = g.missingCells("reopen_repair");
    const items = {};
    for (const c of missing) {
      const item = itemForBlock(c.block);
      items[item] = (items[item] ?? 0) + 1;
    }
    inv.add("log", 12);
    inv.add("stone", 12);
    const recipe = (out) => RECIPES.find((r) => r.out === out);
    const craftUntil = (out, n) => {
      for (let i = 0; i < 60 && inv.count(out) < n; i += 1) {
        const r = recipe(out);
        if (!r) return false;
        for (const [id, c] of Object.entries(r.cost)) if (inv.count(id) < c && recipe(id)) craftUntil(id, c);
        if (!g.ui.hooks.craft(r)) return false;
      }
      return inv.count(out) >= n;
    };
    const ok = Object.entries(items).every(([item, n]) => craftUntil(item, n));
    for (const c of missing) {
      if (!inv.remove(itemForBlock(c.block), 1)) return { ok: false, failed: itemForBlock(c.block), items };
      g.world.set(c.x, c.y, c.z, c.block);
    }
    return { ok, items, bp: g.blueprints.active?.id ?? null, iron: inv.count("iron") + inv.count("iron_fitting") };
  });
  expect(reopen.items.emblem === 1 && reopen.iron === 0, `書の紋章も焼け落ち、鉄はない (${JSON.stringify(reopen.items)})`);
  expect(reopen.ok && !reopen.failed, "木と石だけで、入口と書の紋章を作り直せる");
  await settle(page);
  expect(await page.evaluate(() => window.__game.quests.flags.reopenDone === true), "神殿の再開の修復が完成する");
  await talk(page, "pino");
  await go(page, "CH7_SUCCESSION");
  expect((await stage(page)) === "CH7_SUCCESSION", "鉄がなくても、継承へ進める");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("shortage.test: PASS");
} finally {
  await browser.close();
}
