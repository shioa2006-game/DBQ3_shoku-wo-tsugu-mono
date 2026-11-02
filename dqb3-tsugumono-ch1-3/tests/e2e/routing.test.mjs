// 住民の橋ルーティング（Villager.routeViaBridge）の回帰テスト。
// 北の島⇔南の村をまたぐ移動は海峡を泳がず必ず橋（x30-31, z57-72）を経由し、
// 海峡の水中に落ちた住民も橋のたもとへ退避して自力で上陸できることを検証する。
// （直進すると第3章の桟橋・船の船体に水中で引っかかって出られなくなる不具合の再発防止）
// あわせて、桟橋・船のデッキと陸をまたぐ移動（routeViaDock）が付け根・乗船口を
// 経由すること、平時に水へ落ちた住民が自力で上陸することを検証する。

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  const r = await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("pino", 20, 44); // 北の島・拠点の西（橋の軸線から外れた位置）
    const out = {};
    // 北→南（食堂 z80 へ）: まず自分側（北）のたもとへ向かう。
    out.crossFromNorth = v.routeViaBridge({ x: 38.5, z: 80.5 });
    // 橋の軸線上（x31付近）にいる場合: 対岸（南）のたもとへ直進。
    v.pos.set(31.2, 5, 44);
    out.onAxis = v.routeViaBridge({ x: 38.5, z: 80.5 });
    // 海峡の水中（船のそば x36,z60）から北の家へ: 北のたもとへ退避。
    v.pos.set(36, 3.5, 60);
    out.rescueToNorth = v.routeViaBridge({ x: 32, z: 44 });
    // 橋の上を渡っている途中: 行き先（南）のたもとへ。
    v.pos.set(31.0, 5, 64);
    out.onDeck = v.routeViaBridge({ x: 38.5, z: 80.5 });
    // 同じ島の中の移動: 目的地そのまま（差し替えない）。
    v.pos.set(30, 5, 50);
    out.sameSide = v.routeViaBridge({ x: 25, z: 40 });
    // 海峡内が目的地（クラーケン防衛の船 z59）: 直進（差し替えない）。
    v.pos.set(33, 5, 54);
    out.inStraitTarget = v.routeViaBridge({ x: 39, z: 59 });
    return out;
  });

  const BX = 31; // 橋の桁の中央
  const near = (a, b, tol = 0.01) => Math.abs(a - b) < tol;
  expect(near(r.crossFromNorth.x, BX) && r.crossFromNorth.z < 57, `北→南は北のたもとへ (${JSON.stringify(r.crossFromNorth)})`);
  expect(near(r.onAxis.x, BX) && r.onAxis.z > 72, `橋の軸線上なら南のたもとへ直進 (${JSON.stringify(r.onAxis)})`);
  expect(near(r.rescueToNorth.x, BX) && r.rescueToNorth.z < 57, `海峡の水中から北のたもとへ退避 (${JSON.stringify(r.rescueToNorth)})`);
  expect(near(r.onDeck.x, BX) && r.onDeck.z > 72, `橋の上では行き先側のたもとへ (${JSON.stringify(r.onDeck)})`);
  expect(r.sameSide.x === 25 && r.sameSide.z === 40, `同じ島は直進 (${JSON.stringify(r.sameSide)})`);
  expect(r.inStraitTarget.x === 39 && r.inStraitTarget.z === 59, `海峡内が目的地なら直進（防衛戦の船） (${JSON.stringify(r.inStraitTarget)})`);

  // --- 徘徊先の水没マス回避: 波打ち際が home でも海の中を徘徊先に選ばない ----------
  const wander = await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("gonta", 34, 54); // 漂着の浜＝波打ち際（第3章の介抱シーンの持ち場）
    v.home.set(34.5, 5, 54.5);
    let land = 0, water = 0, none = 0;
    for (let i = 0; i < 300; i += 1) {
      const t = v.pickWanderTarget(g.world);
      if (!t) { none += 1; continue; }
      if (g.world.terrainSurfaceY(t.x, t.z) > 3) land += 1; else water += 1;
    }
    return { land, water, none };
  });
  expect(wander.water === 0, `徘徊先に水没マスを選ばない (300回中 water=${wander.water})`);
  expect(wander.land > 0, `陸側の徘徊先は選べる (land=${wander.land})`);

  // --- 桟橋・船のデッキと陸をまたぐ移動（routeViaDock）------------------------------
  const dock = await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("mina", 20, 40);
    const out = {};
    v.pos.set(39.5, 5.1, 54.5); // 桟橋の上
    out.deckToLand = v.routeViaDock({ x: 32, z: 44 });
    v.pos.set(33, 5, 50); // 陸（北の浜）
    out.landToDeck = v.routeViaDock({ x: 39.5, z: 54.5 });
    v.pos.set(39.2, 3.5, 56); // 桟橋の脇の水中（デッキ上とは扱わない）
    out.waterToDeck = v.routeViaDock({ x: 39.5, z: 54.5 });
    v.pos.set(40, 4.9, 49.2); // 付け根の近く
    out.atBase = v.routeViaDock({ x: 39.5, z: 54.5 });
    v.pos.set(40.5, 5.1, 60.5); // 桟橋の先端 → 船の甲板
    out.pierToShip = v.routeViaDock({ x: 36.5, z: 63.5 });
    v.pos.set(38.5, 5.1, 61.4); // 乗船口のそば → 甲板へ直進
    out.hatchToShip = v.routeViaDock({ x: 36.5, z: 63.5 });
    v.pos.set(36.5, 5.1, 63.5); // 船の甲板 → 陸: まず乗船口へ
    out.shipToLand = v.routeViaDock({ x: 32, z: 44 });
    // 発振の再発防止: 付け根からデッキへ歩き出した位置（軸線上・付け根から
    // 1.6以上離れる）でも、付け根へ引き返さず目的地へ向かい続ける。
    v.pos.set(40, 4.1, 50.5);
    out.axisNoBounce = v.routeViaDock({ x: 39.5, z: 54.5 });
    return out;
  });
  expect(near(dock.deckToLand.x, 40) && dock.deckToLand.z < 51, `桟橋→陸はまず付け根へ (${JSON.stringify(dock.deckToLand)})`);
  expect(near(dock.landToDeck.x, 40) && dock.landToDeck.z < 51, `陸→桟橋もまず付け根へ (${JSON.stringify(dock.landToDeck)})`);
  expect(near(dock.waterToDeck.x, 40) && dock.waterToDeck.z < 51, `桟橋脇の水中からは付け根へ退避 (${JSON.stringify(dock.waterToDeck)})`);
  expect(near(dock.atBase.x, 39.5) && near(dock.atBase.z, 54.5), `付け根まで来たら目的地へ (${JSON.stringify(dock.atBase)})`);
  expect(near(dock.pierToShip.x, 38.5) && near(dock.pierToShip.z, 61.5), `桟橋→船は乗船口経由 (${JSON.stringify(dock.pierToShip)})`);
  expect(near(dock.hatchToShip.x, 36.5) && near(dock.hatchToShip.z, 63.5), `乗船口のそばからは甲板へ直進 (${JSON.stringify(dock.hatchToShip)})`);
  expect(near(dock.shipToLand.x, 38.5) && near(dock.shipToLand.z, 61.5), `船→陸はまず乗船口へ (${JSON.stringify(dock.shipToLand)})`);
  expect(near(dock.axisNoBounce.x, 39.5) && near(dock.axisNoBounce.z, 54.5), `軸線上では付け根へ引き返さない (${JSON.stringify(dock.axisNoBounce)})`);

  // --- 水中で待機しない: 海峡に落ちた住民は平時、自力で上陸する ---------------------
  await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("jinbei", 33, 52);
    v.home.set(33.5, 5, 52.5);
    v.pos.set(33.5, 3.4, 59.5); // 海峡の水中（橋の軸線の外）
    v.moveTarget = null;
  });
  await waitForCond(
    page,
    () => {
      const g = window.__game;
      const v = g.villager("jinbei");
      return !v.inWater && g.world.terrainSurfaceY(v.pos.x, v.pos.z) > 3;
    },
    undefined,
    { label: "水中の住民が自力で上陸する", timeout: 30000, interval: 300 },
  );

  // --- 救出テレポート: 船・桟橋の下などで長時間水中に詰まった住民は陸へ引き上げる ----
  await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("inaho", 33, 52);
    v.home.set(33.5, 5, 52.5);
    v.pos.set(36.5, 3.4, 66.5); // 海峡の沖（泳いで戻るには遠い位置）
    v.inWater = true; // Match the water position before the next AI update.
    v.waterT = 20; // 「長時間水中に留まった」状態を再現 → 次の更新で救出される
  });
  await waitForCond(
    page,
    () => {
      const g = window.__game;
      const v = g.villager("inaho");
      return !v.inWater && g.world.terrainSurfaceY(v.pos.x, v.pos.z) > 3;
    },
    undefined,
    { label: "詰まった住民が陸へ救出される", timeout: 10000, interval: 200 },
  );

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("routing.test: PASS");
} finally {
  await browser.close();
}
