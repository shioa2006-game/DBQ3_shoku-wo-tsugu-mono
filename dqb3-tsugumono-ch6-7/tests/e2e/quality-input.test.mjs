// 実際の入力（マウス・キー・ホイール）の回帰テスト。下ごしらえは状態を置くだけで、確かめたい操作そのものは代行しない。
// - 最初の目標が「長押し」を案内する。左ボタンを押し続けて木を伐ると、木材がちょうど1つ出る
// - クリックで狙った耕地へ種をまける／クリックで狙った敵に剣が当たり、次の一振りも当たる
// - 会話・メニューなど世界が止まる画面と、大型対空ボウガンに乗っている間は、ホイールで持ち物が切り替わらない
import { launchBrowser, openGame, newGame, expect, waitForCond, dlg } from "../helpers.mjs";
import { B } from "../../src/world/blocks.js";
import { ITEMS } from "../../src/game/items.js";
import assert from "node:assert/strict";
import fs from "node:fs";

// 前庭に作る平らな検査場（x22..38, z39..49。床は石、上は空）。
const ARENA = { x0: 22, x1: 38, z0: 39, z1: 49, floor: 15 };
const GROUND = ARENA.floor + 1; // 立つ高さ
const TARGET = { x: 30, y: GROUND, z: 42 }; // 木を置くマス（のちに耕地の上の苗、敵の向こう側）
const SWORD_ATK = ITEMS.sword_iron.atk;

const browser = await launchBrowser(), errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  await page.evaluate(() => window.__game.quests.onTalk("suzuha"));
  await dlg(page);
  await waitForCond(page, () => window.__game.quests.flags.suzuhaMet);
  await waitForCond(page, () => document.querySelector(".objective").innerText.includes("長押し"), undefined, { label: "first objective explains holding the button", timeout: 5000 });
  expect(true, "最初の目標（水運びの橋）が ボタンの長押しを案内する");
  await page.evaluate(({ B, arena, ground, target }) => {
    const g = window.__game;
    g.blueprints.clear();
    for (let x = arena.x0; x <= arena.x1; x += 1) for (let z = arena.z0; z <= arena.z1; z += 1) {
      for (let y = ground; y < 36; y += 1) g.world.set(x, y, z, B.AIR);
      g.world.set(x, arena.floor, z, B.STONE);
    }
    g.player.pos.set(target.x + 0.5, ground + 0.01, target.z + 2.5); g.player.vel.set(0, 0, 0);
    g.cameraYaw = 0; g.cameraYawTarget = 0; g.camZoom = 1;
    g.inventory.slots.fill(null); g.inventory.add("hammer_iron", 1); g.inventory.add("barley_seed", 3);
    g.inventory.add("sword_iron", 1); g.inventory.add("plank", 3);
    g.inventory.selected = 0;
    g.monsters.spawnTimer = 1e6;
    for (const m of [...g.monsters.monsters]) g.monsters.remove(m);
    g.world.set(target.x, target.y, target.z, B.LOG);
  }, { B, arena: ARENA, ground: GROUND, target: TARGET });
  // 狙うマスを画面へ投影し、実際の照準（レイキャスト）がそのマスを捉えてからクリックする。
  async function aim(cell) {
    let previous = null, stable = 0;
    for (let n = 0; n < 60; n += 1) {
      const current = await page.evaluate(() => window.__game.camera.position.toArray());
      stable = previous && current.every((v, i) => Math.abs(v - previous[i]) < 0.002) ? stable + 1 : 0;
      if (stable >= 3) break;
      previous = current; await page.waitForTimeout(100);
    }
    for (let i = 0; i < 30; i += 1) {
      const p = await page.evaluate((c) => {
        const g = window.__game, v = g.player.pos.clone().set(c.x + 0.5, c.y + 0.7, c.z + 0.5).project(g.camera);
        return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
      }, cell);
      await page.mouse.move(p.x, p.y);
      await page.waitForTimeout(100);
      if (await page.evaluate((c) => { const a = window.__game.aim?.cell; return a && a.x === c.x && a.y === c.y && a.z === c.z; }, cell)) return p;
    }
    throw Error("could not aim at " + JSON.stringify(cell));
  }
  const mouse = () => page.evaluate(() => ({ x: window.__game.input.mouse.x, y: window.__game.input.mouse.y }));

  // --- 長押しで採掘 -----------------------------------------------------------------
  await aim(TARGET);
  await page.mouse.down();
  await waitForCond(page, (c) => window.__game.world.get(c.x, c.y, c.z) === 0, TARGET, { label: "held mouse mines the exact log", timeout: 15000 });
  await page.mouse.up();
  const mined = await page.evaluate(() => {
    const g = window.__game;
    return g.inventory.count("log") + g.drops.filter((d) => d.itemId === "log").reduce((n, d) => n + d.count, 0);
  });
  expect(mined === 1, "押し続けた入力で 狙った木が壊れ、木材がちょうど1つ出る");

  // --- クリックで種まき ---------------------------------------------------------------
  const soil = { x: TARGET.x, y: ARENA.floor, z: TARGET.z };
  await page.evaluate(({ B, soil }) => {
    const g = window.__game; g.world.set(soil.x, soil.y, soil.z, B.FARMLAND);
    g.inventory.selected = g.inventory.slots.findIndex((s) => s?.id === "barley_seed");
  }, { B, soil });
  await aim(soil);
  const seeds = await page.evaluate(() => window.__game.inventory.count("barley_seed"));
  const unplanted = await page.evaluate((c) => window.__game.world.get(c.x, c.y, c.z), TARGET);
  let at = await mouse();
  await page.mouse.click(at.x, at.y);
  await waitForCond(page, ({ c, crop }) => window.__game.world.get(c.x, c.y, c.z) === crop, { c: TARGET, crop: B.CROP1 }, { label: "click plants the aimed farmland" });
  expect(await page.evaluate(() => window.__game.inventory.count("barley_seed")) === seeds - 1, "種まきのクリックで 種が1つ減る");
  const planted = await page.evaluate((c) => window.__game.world.get(c.x, c.y, c.z), TARGET);
  const assertPlanted = (observed) => assert.equal(observed, B.CROP1, "target must contain a seedling");
  assert.throws(() => assertPlanted(unplanted), "no planting input must fail the same assertion");
  assertPlanted(planted);
  expect(planted === B.CROP1, "種まきを 状態の書き込みで代用していない（まく前は苗が無い）");

  // --- クリックで攻撃 -----------------------------------------------------------------
  // 的の動きだけを止め、入力と当たり判定を、敵の行動やノックバックから切り離して確かめる。
  await page.evaluate(({ target, ground }) => {
    const g = window.__game;
    g.inventory.selected = g.inventory.slots.findIndex((s) => s?.id === "sword_iron");
    const m = g.monsters.spawn("rock_goat", target.x + 0.5, ground + 0.01, target.z + 1.3); m.hp = 30; m.maxHp = 30; m.update = () => {};
    window.inputTestTarget = m;
    g.spawnDrop("stone", 1, target.x - 6, ground, target.z - 2); // 前からあるドロップが、命中の判定の代わりにならないこと
    g.player.facing.set(0, -1);
  }, { target: TARGET, ground: GROUND });
  await aim(TARGET);
  const before = await page.evaluate(() => window.inputTestTarget.hp);
  at = await mouse();
  await page.mouse.click(at.x, at.y);
  await waitForCond(page, (hp) => window.inputTestTarget.hp === hp, 30 - SWORD_ATK, { label: "real click damages the chosen enemy" });
  const after = await page.evaluate(() => window.inputTestTarget.hp);
  const assertHit = (oldHp, newHp) => assert.ok(newHp < oldHp, "chosen target HP must decrease");
  assert.throws(() => assertHit(before, before), "old drops cannot hide an unsuccessful attack");
  assertHit(before, after);
  await waitForCond(page, () => window.__game.player.attackCooldown <= 0);
  at = await mouse();
  await page.mouse.click(at.x, at.y);
  await waitForCond(page, (hp) => window.inputTestTarget.hp === hp, 30 - SWORD_ATK * 2, { label: "next swing hits during enemy flash" });
  expect(after === 30 - SWORD_ATK, `クリックの攻撃が狙った敵に当たり、次の一振りも当たる (30→${after}→${30 - SWORD_ATK * 2})`);
  await page.evaluate(() => { window.__game.monsters.remove(window.inputTestTarget); delete window.inputTestTarget; });

  // --- 世界が止まる画面ではホイールを捨てる。キャンバスの上では効く ------------------------
  for (const kind of ["inventory", "storage", "book", "dialogue", "pause", "help", "choice", "movie", "title"]) {
    await page.evaluate((kind) => {
      const g = window.__game; g.inventory.selected = 0;
      if (kind === "inventory") g.ui.openMenu(g.menuCtx());
      if (kind === "storage") g.storage.open("2,2,2");
      if (kind === "book") g.ui.showJobBook(g.jobBookData());
      if (kind === "dialogue") g.ui.dialogue.play([{ speaker: "確認", text: "入力テスト" }], () => {});
      if (kind === "pause") g.ui.showPause(() => true, null);
      if (kind === "help") g.ui.showHelp();
      if (kind === "choice") g.ui.dialogue.choice("入力テスト", ["続ける"], () => {});
      if (kind === "movie") { window.__SHOKU_SKIP_MOVIES__ = false; g.movies.play("ch7-unseen-books"); } // 結びのムービー
      if (kind === "title") g.ui.showTitle({ hasSave: false, onNew: () => {}, onContinue: () => {} });
    }, kind);
    await waitForCond(page, () => !window.__game.input.enabled);
    await page.mouse.move(480, 320); await page.mouse.wheel(0, 500);
    await page.evaluate((kind) => {
      const u = window.__game.ui;
      if (kind === "inventory") u.closeMenu();
      if (kind === "storage") u.hideStorage();
      if (kind === "book") u.hideJobBook();
      if (kind === "dialogue") { u.dialogue.typing = false; u.dialogue.advance(); }
      if (kind === "pause") u.hidePause();
      if (kind === "help") u.help.classList.add("hidden");
      if (kind === "choice") u.choiceBox.querySelector("button").click();
      if (kind === "movie") { window.__game.movies.skip(); window.__SHOKU_SKIP_MOVIES__ = true; }
      if (kind === "title") u.title.classList.add("hidden");
    }, kind);
    await waitForCond(page, () => window.__game.input.enabled);
    expect(await page.evaluate(() => window.__game.inventory.selected) === 0, kind + " の間のホイールでは 持ち物の選択が変わらない");
  }
  await page.mouse.move(480, 300); await page.mouse.wheel(0, 100);
  await waitForCond(page, () => window.__game.inventory.selected === 1, undefined, { label: "canvas wheel changes hotbar normally" });
  expect(true, "キャンバスの上のホイールは ふだんどおり持ち物を切り替える");
  await page.keyboard.press("e");
  await waitForCond(page, () => window.__game.ui.menuOpen, undefined, { label: "E opens the menu" });
  await page.mouse.wheel(0, 200);
  await page.keyboard.press("e");
  await waitForCond(page, () => window.__game.input.enabled);
  expect(await page.evaluate(() => window.__game.inventory.selected) === 1, "実際の E で開く・ホイール・E で閉じる の後も選択が変わらない");

  // --- 大型対空ボウガンに乗っている間（この編の操作） -------------------------------------
  // 世界は止まらないが、操作は向き・発射・降りるだけ。ホイールで持ち物は切り替わらず、F で降りる。
  await page.evaluate(({ B, target, ground }) => {
    const g = window.__game;
    g.world.set(target.x + 3, ground, target.z + 3, B.GREAT_BALLISTA);
    g.ballista.mount();
  }, { B, target: TARGET, ground: GROUND });
  await waitForCond(page, () => window.__game.ballista.mounted && document.body.classList.contains("aiming"), undefined, { label: "mounted on the great ballista" });
  // ホイールの後に F を押す。降りたフレームまでに、先に届いたホイールは処理（破棄）されている。
  await page.mouse.move(480, 300); await page.mouse.wheel(0, 300);
  await page.keyboard.press("f");
  await waitForCond(page, () => !window.__game.ballista.mounted && !document.body.classList.contains("aiming"), undefined, { label: "F dismounts" });
  expect(true, "実際の F で 大型対空ボウガンから降りる");
  expect(await page.evaluate(() => window.__game.inventory.selected) === 1, "大型対空ボウガンに乗っている間のホイールでは 持ち物の選択が変わらない");
  await page.mouse.move(480, 300); await page.mouse.wheel(0, 100);
  await waitForCond(page, () => window.__game.inventory.selected === 2, undefined, { label: "wheel works again after dismount" });
  expect(true, "降りた後は ホイールがまた効く");

  await page.evaluate(() => window.__game.ui.showHelp());
  expect(await page.locator(".help").innerText().then((s) => s.includes("左ボタン長押し")), "そうさ方法にも 長押しでの採掘が書いてある");
  if (process.env.QA_CAPTURE) { fs.mkdirSync("work/quality-input", { recursive: true }); await page.screenshot({ path: "work/quality-input/help.png" }); }
  expect(errors.length === 0, `コンソールエラーなし (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("quality-input.test: PASS");
} finally { await browser.close(); }
