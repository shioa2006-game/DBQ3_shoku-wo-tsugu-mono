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

  // 途中目標を1回問い合わせるだけでは、境界を踏んだ次のフレームの引き返しは見えない。
  // 実際の設計図と衝突判定で、乗船・下船・食事への切り替えを最後まで歩かせる。
  const dock = await page.evaluate(() => {
    const g = window.__game;
    const completed = g.blueprints.completed;
    const mina = g.spawnVillager("mina", 39.5, 51.1);
    mina.pos.set(39.5, 5.1, 51.1);
    const beach = { x: 37.5, z: 54.5 };
    const beforePier = mina.routeViaDock(beach, completed) === beach;

    function build(id, x, z) {
      const bp = g.blueprints.activate(id, { x, z }, 4);
      for (const c of bp.cells) g.world.set(c.x, c.y, c.z, c.block);
    }
    build("bridge", 30, 57);
    build("pier", 39, 51);
    const deck = { x: 37.5, z: 62.5 };
    mina.pos.set(35, 5, 53); // 浜から未完成の船へ、架空の乗船口を経由しない
    const beforeHull = mina.routeViaDock(deck, completed) === deck;
    const pier = { x: 39.5, z: 54.5 };
    mina.pos.set(39.2, 3.5, 56); // デッキの下からは陸側の付け根へ
    const fromWater = mina.routeViaDock(pier, completed);
    for (const id of ["ship_hull", "ship_mast", "ship_sail"]) build(id, 34, 59);

    const ctx = { world: g.world, completedBlueprints: completed, cameraYaw: 0 };
    function walk(v, context, reached, seconds) {
      let wet = false;
      let passedHatch = false;
      for (let frame = 0; frame < seconds * 60; frame++) {
        v.update(1 / 60, context);
        wet ||= v.inWater;
        passedHatch ||= Math.abs(v.pos.x - 39) < 0.1 && Math.abs(v.pos.z - 61.5) < 0.2;
        if (reached(v.pos)) return { arrived: true, wet, passedHatch };
      }
      return { arrived: false, wet, passedHatch, x: v.pos.x, z: v.pos.z };
    }
    const closeTo = (x, z) => (p) => Math.hypot(p.x - x, p.z - z) <= 0.5;

    const watari = g.spawnVillager("watari", 31, 75.5); // 南岸から橋・浜・桟橋を経由して乗船
    watari.thinkTimer = 60; // 徘徊先の抽選だけを固定し、通常のAI・物理で乗船
    watari.moveTarget = watari.pos.clone().set(35.5, 6, 60.5);
    const board = walk(watari, ctx, closeTo(35.5, 60.5), 35);

    mina.pos.set(deck.x, 5.01, deck.z);
    mina.thinkTimer = 0;
    const farm = { ...ctx, farmWork: true, pickFarmCell: () => ({ x: 37, y: 5, z: 45 }) };
    const toFarm = walk(mina, farm, closeTo(37.5, 45.5), 20);

    const gonta = g.villager("gonta");
    gonta.pos.set(40, 5.01, 53);
    gonta.thinkTimer = 60;
    gonta.moveTarget = gonta.pos.clone().set(beach.x, 4, beach.z);
    const toBeach = walk(gonta, ctx, closeTo(beach.x, beach.z), 12);

    // 乗船へ歩き出した途中で食事が始まる。桟橋を降り、南の村へは橋を渡る。
    gonta.pos.set(40, 5.01, 58);
    gonta.moveTarget = gonta.pos.clone().set(deck.x, 5, deck.z);
    gonta.update(1 / 60, ctx);
    const meal = { ...ctx, mealPos: { x: 40.5, z: 82.5 } };
    const toMeal = walk(gonta, meal, (p) => p.z > 72 && p.x >= 30 && p.x < 32, 24);
    return { beforePier, beforeHull, fromWater, board, toFarm, toBeach, toMeal };
  });
  expect(dock.beforePier && dock.beforeHull, "建設前の浜・船の予定地では港の経路を使わない");
  expect(near(dock.fromWater.x, 40) && dock.fromWater.z < 51, "桟橋の下からは浜側の付け根へ向かう");
  for (const [trip, description] of [[dock.board, "ワタリが舵輪へ乗船"], [dock.toFarm, "ミナが船から畑へ戻る"]]) {
    expect(trip.arrived && trip.passedHatch && !trip.wet, `${description}（乗船口を通り、水に落ちずに到着） ${JSON.stringify(trip)}`);
  }
  expect(dock.toBeach.arrived && !dock.toBeach.wet, `桟橋の付け根で引き返さず浜へ到着 ${JSON.stringify(dock.toBeach)}`);
  expect(dock.toMeal.arrived && !dock.toMeal.wet, `食事へ切り替えて桟橋を降り、橋で南の村へ ${JSON.stringify(dock.toMeal)}`);

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
